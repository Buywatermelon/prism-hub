"use server"

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import slugify from 'slugify'
import { Result, Ok, Err, createError, AppError } from '@/lib/result'

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
})

function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createWorkspace(
  input: { name: string; description?: string }
): Promise<Result<{ workspace: any; membership: any }, AppError>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '用户未登录'))
  }

  const parsed = createWorkspaceSchema.safeParse(input)
  if (!parsed.success) {
    return Err(createError('VALIDATION_ERROR', '输入数据无效', parsed.error.errors))
  }
  const { name, description } = parsed.data

  // 生成 slug - slugify 会自动处理中文和特殊字符
  let slug = slugify(name, {
    lower: true,
    strict: true,
    trim: true
  })
  
  // 如果 slug 为空（比如纯中文或特殊字符），使用时间戳
  if (!slug) {
    slug = `workspace-${Date.now()}`
  }
  
  // 检查是否已存在，如果存在就加时间戳
  const { data: existing } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single()
  
  if (existing) {
    slug = `${slug}-${Date.now()}`
  }
  
  const joinCode = generateJoinCode()

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name,
      slug,
      description,
      join_code: joinCode,
      settings: { require_approval: false },
      created_by: user.id,
    })
    .select()
    .single()
  if (workspaceError || !workspace) {
    console.error('创建工作空间失败:', workspaceError)
    return Err(createError('DATABASE_ERROR', '创建工作空间失败', workspaceError))
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    })
    .select()
    .single()
  if (membershipError || !membership) {
    await supabase.from('workspaces').delete().eq('id', workspace.id)
    console.error('创建工作空间成员失败:', membershipError)
    return Err(createError('DATABASE_ERROR', '创建工作空间成员失败', membershipError))
  }

  // 初始化内置OAuth提供商
  try {
    const { initBuiltinOAuthProviders } = await import('@/app/(workspace)/[workspaceSlug]/providers/oauth/actions')
    await initBuiltinOAuthProviders(workspace.id)
  } catch (error) {
    console.error('初始化内置提供商失败:', error)
    // 不阻塞工作空间创建流程
  }

  return Ok({ workspace, membership })
}

const joinWorkspaceSchema = z.object({
  join_code: z.string().length(6, '邀请码必须是6位'),
})

export async function joinWorkspace(
  input: { join_code: string }
): Promise<Result<{ workspace: any; membership: any; message?: string }, AppError>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '用户未登录'))
  }

  const parsed = joinWorkspaceSchema.safeParse(input)
  if (!parsed.success) {
    return Err(createError('VALIDATION_ERROR', '邀请码格式无效', parsed.error.errors))
  }

  const { join_code } = parsed.data

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('join_code', join_code.toUpperCase())
    .single()
  if (workspaceError || !workspace) {
    return Err(createError('NOT_FOUND', '邀请码无效或已过期'))
  }

  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id, status')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()
  if (existingMember) {
    if (existingMember.status === 'active') {
      return Err(createError('ALREADY_EXISTS', '您已经是该工作空间的成员'))
    }
    if (existingMember.status === 'pending') {
      return Err(createError('BUSINESS_ERROR', '您的加入申请正在等待审批'))
    }
  }

  const memberStatus = (workspace.settings as any)?.require_approval ? 'pending' : 'active'
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'member',
      status: memberStatus,
    })
    .select()
    .single()
  if (membershipError || !membership) {
    console.error('创建工作空间成员失败:', membershipError)
    return Err(createError('DATABASE_ERROR', '加入工作空间失败', membershipError))
  }

  if (memberStatus === 'pending') {
    return Ok({ message: '申请已提交，等待管理员审批', workspace, membership })
  }
  return Ok({ workspace, membership })
}

