"use server"

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { AuthenticationError, AuthorizationError, ValidationError, DatabaseError } from '@/lib/errors'

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  settings: z
    .object({
      require_approval: z.boolean().optional(),
    })
    .optional(),
})

export async function updateWorkspace(
  workspaceId: string,
  input: { name?: string; description?: string | null; settings?: { require_approval?: boolean } }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new AuthenticationError()

  const parsed = updateWorkspaceSchema.safeParse(input)
  if (!parsed.success) throw new ValidationError('输入数据无效', parsed.error)

  const { name, description, settings } = parsed.data

  const { data: currentMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
  if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role as any)) {
    throw new AuthorizationError('需要管理员或所有者权限')
  }

  const updates: any = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (description !== undefined) updates.description = description

  if (settings) {
    const { data: currentWorkspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single()
    updates.settings = { ...(currentWorkspace?.settings as Record<string, any> || {}), ...settings }
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single()
  if (error || !workspace) {
    console.error('Failed to update workspace:', error)
    throw new DatabaseError('更新工作空间失败', error)
  }

  return { workspace }
}

