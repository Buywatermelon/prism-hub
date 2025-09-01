"use server"

import { createClient } from '@/lib/supabase/server'
import { Result, Ok, Err, createError, AppError } from '@/lib/result'
import { z } from 'zod'
import type { WorkspacePreferences, WorkspaceMemberPreferences } from '@/types/preferences.types'
import { extractModelsFromProviders, type ModelInfo } from '@/lib/utils/model-identifier'

const modelPreferencesSchema = z.object({
  model_priority: z.array(z.string()),
  last_updated: z.string().datetime().optional(),
})

export interface ProviderWithCredentials {
  id: string
  name: string
  type: string
  icon?: string
  models?: any
  activeCredentials: number
  totalCredentials: number
}

export interface ModelPriority {
  model_priority: string[]
  source: 'user' | 'workspace' | 'default'
}

/**
 * 获取模型偏好设置
 */
export async function getModelPreferences(
  workspaceId: string,
  userId?: string
): Promise<Result<ModelPriority, AppError>> {
  const supabase = await createClient()

  // 如果提供了用户ID，先查用户设置
  if (userId) {
    const { data: memberData, error: memberError } = await supabase
      .from('workspace_members')
      .select('preferences')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single()

    const memberPrefs = memberData?.preferences as WorkspaceMemberPreferences | null
    if (!memberError && memberPrefs?.model_priority?.length && memberPrefs.model_priority.length > 0) {
      return Ok({
        model_priority: memberPrefs.model_priority,
        source: 'user'
      })
    }
  }

  // 查询工作空间默认设置
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('preferences')
    .eq('id', workspaceId)
    .single()

  if (workspaceError) {
    return Err(createError('DATABASE_ERROR', '获取工作空间设置失败'))
  }

  const workspacePrefs = workspaceData?.preferences as WorkspacePreferences | null
  if (workspacePrefs?.model_priority?.length && workspacePrefs.model_priority.length > 0) {
    return Ok({
      model_priority: workspacePrefs.model_priority,
      source: 'workspace'
    })
  }

  // 返回所有可用模型作为默认
  const modelsResult = await getAvailableModels(workspaceId)
  if (!modelsResult.success) {
    return Err(modelsResult.error)
  }

  return Ok({
    model_priority: modelsResult.data.map(m => m.id),
    source: 'default'
  })
}

/**
 * 保存模型偏好设置
 */
export async function saveModelPreferences(
  workspaceId: string,
  modelIds: string[],
  scope: 'user' | 'workspace',
  userId?: string
): Promise<Result<void, AppError>> {
  const supabase = await createClient()

  // 验证 model IDs
  const modelsResult = await getAvailableModels(workspaceId)
  if (!modelsResult.success) {
    return Err(modelsResult.error)
  }

  const validModelIds = modelsResult.data.map(m => m.id)
  const invalidIds = modelIds.filter(id => !validModelIds.includes(id))
  
  if (invalidIds.length > 0) {
    return Err(createError('VALIDATION_ERROR', `包含无效的模型ID: ${invalidIds.join(', ')}`))
  }

  const preferences = {
    model_priority: modelIds,
    last_updated: new Date().toISOString()
  }

  if (scope === 'user') {
    if (!userId) {
      return Err(createError('VALIDATION_ERROR', '用户ID不能为空'))
    }

    const { error } = await supabase
      .from('workspace_members')
      .update({ preferences })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (error) {
      return Err(createError('DATABASE_ERROR', '保存用户偏好失败'))
    }
  } else {
    // 检查是否有管理员权限
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId!)
      .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return Err(createError('PERMISSION_DENIED', '只有管理员可以修改工作空间默认设置'))
    }

    const { error } = await supabase
      .from('workspaces')
      .update({ preferences })
      .eq('id', workspaceId)

    if (error) {
      return Err(createError('DATABASE_ERROR', '保存工作空间偏好失败'))
    }
  }

  return Ok()
}

/**
 * 重置用户模型偏好设置
 */
export async function resetUserModelPreferences(
  workspaceId: string,
  userId: string
): Promise<Result<void, AppError>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workspace_members')
    .update({ 
      preferences: {
        model_priority: [],
        last_updated: new Date().toISOString()
      }
    })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) {
    return Err(createError('DATABASE_ERROR', '重置用户偏好失败'))
  }

  return Ok()
}

/**
 * 获取有凭证的供应商列表（用于兼容）
 */
export async function getProvidersWithCredentials(
  workspaceId: string
): Promise<Result<ProviderWithCredentials[], AppError>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('providers')
    .select(`
      id,
      name,
      type,
      icon,
      models,
      provider_credentials(
        id,
        status
      )
    `)
    .eq('workspace_id', workspaceId)

  if (error) {
    return Err(createError('DATABASE_ERROR', '获取供应商列表失败'))
  }

  const providers: ProviderWithCredentials[] = data?.map(provider => ({
    id: provider.id,
    name: provider.name,
    type: provider.type,
    icon: provider.icon || undefined,
    models: provider.models,
    activeCredentials: provider.provider_credentials?.filter(
      (c: any) => c.status === 'active'
    ).length || 0,
    totalCredentials: provider.provider_credentials?.length || 0
  })).filter(p => p.totalCredentials > 0) || []

  return Ok(providers)
}

/**
 * 获取所有可用的模型
 */
export async function getAvailableModels(
  workspaceId: string
): Promise<Result<ModelInfo[], AppError>> {
  const providersResult = await getProvidersWithCredentials(workspaceId)
  if (!providersResult.success) {
    return Err(providersResult.error)
  }

  const models = extractModelsFromProviders(providersResult.data)
  
  // 只返回有活跃凭证的模型
  const availableModels = models.filter(m => m.hasActiveCredentials)
  
  return Ok(availableModels)
}