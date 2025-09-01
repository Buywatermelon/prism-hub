import { createClient } from '@/lib/supabase/server'
import { defineAbilitiesFor, type PermissionContext, type AppAbility, type UserRole } from './abilities'
import { Result, Ok, Err, createError, AppError } from '@/lib/result'

/**
 * 获取用户在工作空间的权限上下文
 */
export async function getUserPermissionContext(
  userId: string,
  workspaceId: string
): Promise<PermissionContext> {
  const supabase = await createClient()
  
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .single()
  
  if (error || !member) {
    return {
      userId,
      workspaceId,
      role: 'guest' as UserRole
    }
  }
  
  return {
    userId,
    workspaceId,
    role: member.role as UserRole
  }
}

/**
 * 获取用户的 CASL 能力实例（服务端使用）
 */
export async function getUserAbility(
  userId: string,
  workspaceId: string
): Promise<AppAbility> {
  const context = await getUserPermissionContext(userId, workspaceId)
  return defineAbilitiesFor(context)
}

/**
 * 检查用户是否有特定权限（服务端使用）
 */
export async function checkPermission(
  userId: string,
  workspaceId: string,
  action: string,
  subject: string
): Promise<boolean> {
  const ability = await getUserAbility(userId, workspaceId)
  return ability.can(action as any, subject as any)
}

/**
 * 获取当前用户的权限（Server Component 使用）
 */
export async function getCurrentUserAbility(workspaceId: string): Promise<AppAbility | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  return getUserAbility(user.id, workspaceId)
}

/**
 * 要求特定权限（Server Component 使用）
 */
export async function requirePermission(
  workspaceId: string,
  action: string,
  subject: string
): Promise<Result<void, AppError>> {
  const ability = await getCurrentUserAbility(workspaceId)
  
  if (!ability || !ability.can(action as any, subject as any)) {
    return Err(createError('PERMISSION_DENIED', `无法执行 ${action} 操作于 ${subject}`))
  }
  
  return Ok()
}