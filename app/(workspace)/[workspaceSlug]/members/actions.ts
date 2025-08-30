"use server"

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'
import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, BusinessError, DatabaseError } from '@/lib/errors'

export type MemberStatus = 'active' | 'pending' | 'rejected'
export type MemberRole = 'owner' | 'admin' | 'member'

export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'] & {
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
    last_sign_in_at?: string
  }
}

type Role = 'owner' | 'admin' | 'member'

async function buildActionContext(workspaceId: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    supabase,
    user,
    workspaceId,
    async membership() {
      if (!user || !workspaceId) return null as { role: Role } | null
      const { data } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      return (data as any) ?? null
    },
    async role() {
      const m = await this.membership()
      return (m?.role as Role) ?? null
    },
  }
}

function assertAuth(user: any) {
  if (!user) {
    throw new AuthenticationError()
  }
}

function assertWorkspace(workspaceId: string | null) {
  if (!workspaceId) {
    throw new ValidationError('缺少工作空间 ID')
  }
}

async function assertRole(ctx: Awaited<ReturnType<typeof buildActionContext>>, allowed: Role[]) {
  const r = await ctx.role()
  if (!r || !allowed.includes(r)) {
    throw new AuthorizationError('需要 ' + allowed.join(' 或 ') + ' 权限')
  }
}

export async function getMembers(workspaceId: string, status?: MemberStatus[]): Promise<WorkspaceMember[]> {
  const ctx = await buildActionContext(workspaceId)
  assertAuth(ctx.user)
  assertWorkspace(ctx.workspaceId)

  // 必须是工作空间成员
  const membership = await ctx.membership()
  if (!membership) throw new AuthorizationError('需要工作空间成员权限')

  const supabase = ctx.supabase
  const supabaseAdmin = await createServiceRoleClient()

  const query = supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
  const finalQuery = status?.length ? query.in('status', status) : query.eq('status', 'active')

  const { data: members, error: membersError } = await finalQuery.order('joined_at', { ascending: false })
  if (membersError) {
    console.error('Failed to fetch members:', membersError)
    throw new DatabaseError('加载成员列表失败', membersError)
  }

  const userIds = [...new Set(members?.map((m) => m.user_id).filter(Boolean) || [])]
  const usersResults = await Promise.all(userIds.map((id) => supabaseAdmin.auth.admin.getUserById(id)))
  const usersMap = new Map<string, any>()
  usersResults.forEach((res) => {
    if (res.data?.user) usersMap.set(res.data.user.id, res.data.user)
  })

  const formatted: WorkspaceMember[] = (members || []).map((m) => {
    const u = usersMap.get(m.user_id)
    return {
      ...m,
      user: u
        ? {
            id: u.id,
            email: u.email,
            user_metadata: u.user_metadata,
            last_sign_in_at: u.last_sign_in_at,
          }
        : undefined,
    }
  })

  const roleOrder: Record<MemberRole, number> = { owner: 1, admin: 2, member: 3 }
  formatted.sort((a, b) => {
    const roleA = roleOrder[a.role as MemberRole] ?? 999
    const roleB = roleOrder[b.role as MemberRole] ?? 999
    if (roleA !== roleB) return roleA - roleB
    return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
  })

  return formatted
}

export async function approveMember(workspaceId: string, membershipId: string): Promise<WorkspaceMember> {
  const ctx = await buildActionContext(workspaceId)
  assertAuth(ctx.user)
  assertWorkspace(ctx.workspaceId)
  await assertRole(ctx, ['owner', 'admin'])

  const supabase = ctx.supabase

  const { data: target, error: memberError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', membershipId)
    .eq('workspace_id', workspaceId)
    .single()
  if (memberError || !target) throw new NotFoundError('成员不存在')
  if (target.status !== 'pending') throw new BusinessError(target.status === 'active' ? '该成员已经被批准' : '该成员申请已经被处理')

  const { data: updated, error: updateError } = await supabase
    .from('workspace_members')
    .update({ status: 'active', approved_at: new Date().toISOString(), approved_by: ctx.user!.id })
    .eq('id', membershipId)
    .select('*')
    .single()
  if (updateError || !updated) throw new DatabaseError('批准失败，请稍后重试', updateError)
  return updated as WorkspaceMember
}

export async function rejectMember(
  workspaceId: string,
  membershipId: string,
  reason?: string
): Promise<WorkspaceMember> {
  const ctx = await buildActionContext(workspaceId)
  assertAuth(ctx.user)
  assertWorkspace(ctx.workspaceId)
  await assertRole(ctx, ['owner', 'admin'])

  const supabase = ctx.supabase
  const { data: target, error: memberError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', membershipId)
    .eq('workspace_id', workspaceId)
    .single()
  if (memberError || !target) throw new NotFoundError('成员不存在')
  if (target.status !== 'pending') throw new BusinessError(target.status === 'active' ? '该成员已经被批准' : '该成员申请已经被处理')

  const { data: updated, error: updateError } = await supabase
    .from('workspace_members')
    .update({ status: 'rejected', reject_reason: reason || null })
    .eq('id', membershipId)
    .select('*')
    .single()
  if (updateError || !updated) throw new DatabaseError('拒绝失败，请稍后重试', updateError)
  return updated as WorkspaceMember
}

export async function updateMemberRole(
  workspaceId: string,
  membershipId: string,
  role: Exclude<MemberRole, 'owner'>
): Promise<WorkspaceMember> {
  const ctx = await buildActionContext(workspaceId)
  assertAuth(ctx.user)
  assertWorkspace(ctx.workspaceId)
  await assertRole(ctx, ['owner', 'admin'])

  const supabase = ctx.supabase
  const { data: target, error: memberError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', membershipId)
    .eq('workspace_id', workspaceId)
    .single()
  if (memberError || !target) throw new NotFoundError('成员不存在')
  if (target.role === 'owner') throw new BusinessError('不能修改所有者角色')

  const { data: updated, error: updateError } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('id', membershipId)
    .select('*')
    .single()
  if (updateError || !updated) throw new DatabaseError('更新角色失败，请稍后重试', updateError)
  return updated as WorkspaceMember
}

export async function removeMember(
  workspaceId: string,
  membershipId: string
): Promise<{ success: boolean; message?: string }> {
  const ctx = await buildActionContext(workspaceId)
  assertAuth(ctx.user)
  assertWorkspace(ctx.workspaceId)

  const supabase = ctx.supabase
  const { data: currentMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', ctx.user!.id)
    .eq('status', 'active')
    .single()
  if (!currentMembership) throw new AuthorizationError()

  const { data: target, error: memberError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', membershipId)
    .eq('workspace_id', workspaceId)
    .single()
  if (memberError || !target) throw new NotFoundError('成员不存在')
  if (target.role === 'owner') throw new BusinessError('不能移除工作空间所有者')

  const isSelf = target.user_id === ctx.user!.id
  if (!isSelf && !['owner', 'admin'].includes(currentMembership.role as Role)) {
    throw new AuthorizationError('需要管理员权限')
  }

  const { error: deleteError } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', membershipId)
  if (deleteError) throw new DatabaseError('移除成员失败，请稍后重试', deleteError)

  return { success: true, message: isSelf ? '已退出工作空间' : '成员已移除' }
}

