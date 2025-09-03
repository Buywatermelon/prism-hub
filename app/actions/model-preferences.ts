"use server"

import { createClient } from '@/lib/supabase/server'
import { Result, Ok, Err, createError } from '@/lib/result'
import type { AppError } from '@/lib/result'
import type { Json } from '@/types/database.types'
import type { 
  ModelInfo, 
  ModelId, 
  ScenarioType,
  PreferencesResponse,
  WorkspacePreferences,
  WorkspaceMemberPreferences
} from '@/types/preferences.types'
import { 
  parseModelId,
  buildModelId,
  isValidModelId,
  createDefaultPreferences
} from '@/types/preferences.types'
import { 
  getOAuthProviderModels, 
  getApiProviderModels,
  isOAuthProvider,
  getProviderDisplayName 
} from '@/lib/utils/model-definitions'

/**
 * 获取工作空间所有可用的模型
 * 包括API密钥模型和OAuth模型
 */
export async function getAllAvailableModels(
  workspaceId: string
): Promise<Result<ModelInfo[], AppError>> {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }

  // 查询工作空间的所有供应商及其凭证
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select(`
      id,
      name,
      type,
      config,
      provider_credentials(
        id,
        credential_type,
        status
      )
    `)
    .eq('workspace_id', workspaceId)

  if (providersError) {
    return Err(createError('DATABASE_ERROR', '获取供应商列表失败'))
  }

  const models: ModelInfo[] = []

  // 处理每个供应商
  for (const provider of providers || []) {
    const activeCredentials = provider.provider_credentials?.filter(
      (c: any) => c.status === 'active'
    ) || []
    
    const hasActiveCredentials = activeCredentials.length > 0
    const providerType = provider.type as string

    // 判断是OAuth还是API供应商
    if (isOAuthProvider(providerType)) {
      // OAuth供应商：从model-definitions获取模型
      const oauthModels = getOAuthProviderModels(providerType)
      
      for (const model of oauthModels) {
        models.push({
          id: buildModelId('oauth', provider.id, model.id) as ModelId,
          name: model.displayName,
          provider: getProviderDisplayName(providerType, true),
          providerId: provider.id,
          type: 'oauth',
          available: hasActiveCredentials,
          credentialCount: activeCredentials.length
        })
      }
    } else {
      // API供应商：从供应商配置或model-definitions获取模型
      let apiModels = []
      
      // 优先使用供应商配置的模型
      if (provider.config && typeof provider.config === 'object' && 'models' in provider.config) {
        const configModels = provider.config.models as any[]
        if (Array.isArray(configModels)) {
          apiModels = configModels
        }
      }
      
      // 如果配置中没有模型，从model-definitions获取
      if (apiModels.length === 0) {
        apiModels = getApiProviderModels(providerType)
      }
      
      for (const model of apiModels) {
        const modelId = typeof model === 'string' ? model : model.id
        const modelName = typeof model === 'string' ? model : (model.displayName || model.name || model.id)
        
        models.push({
          id: buildModelId('apikey', provider.id, modelId) as ModelId,
          name: modelName,
          provider: provider.name,
          providerId: provider.id,
          type: 'apikey',
          available: hasActiveCredentials,
          credentialCount: activeCredentials.length
        })
      }
    }
  }

  return Ok(models)
}

/**
 * 获取场景偏好设置
 * 支持工作空间和成员两级偏好
 */
export async function getScenarioPreferences(
  workspaceId: string,
  scenario: ScenarioType,
  userId?: string
): Promise<Result<PreferencesResponse, AppError>> {
  const supabase = await createClient()
  
  // 获取当前用户（如果没有提供userId）
  if (!userId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Err(createError('AUTH_REQUIRED', '请先登录'))
    }
    userId = user.id
  }

  // 查询成员偏好
  const { data: memberData, error: memberError } = await supabase
    .from('workspace_members')
    .select('preferences')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!memberError && memberData?.preferences) {
    const prefs = (memberData.preferences as unknown) as WorkspaceMemberPreferences
    if (prefs.scenarios?.[scenario]?.length > 0) {
      return Ok({
        preferences: prefs.scenarios,
        source: 'member',
        lastUpdated: prefs.last_updated
      })
    }
  }

  // 查询工作空间偏好
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('preferences')
    .eq('id', workspaceId)
    .single()

  if (workspaceError) {
    return Err(createError('DATABASE_ERROR', '获取工作空间偏好失败'))
  }

  if (workspaceData?.preferences) {
    const prefs = (workspaceData.preferences as unknown) as WorkspacePreferences
    if (prefs.scenarios?.[scenario]) {
      return Ok({
        preferences: prefs.scenarios,
        source: 'workspace',
        lastUpdated: prefs.last_updated
      })
    }
  }

  // 返回默认空配置
  return Ok({
    preferences: {
      code: [],
      api: []
    },
    source: 'default'
  })
}

/**
 * 保存场景偏好设置
 */
export async function saveScenarioPreferences(
  workspaceId: string,
  scenario: ScenarioType,
  modelIds: ModelId[],
  scope: 'workspace' | 'member',
  userId?: string
): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }

  // 验证模型ID格式
  for (const modelId of modelIds) {
    if (!isValidModelId(modelId)) {
      return Err(createError('VALIDATION_ERROR', `无效的模型ID格式: ${modelId}`))
    }
  }

  if (scope === 'workspace') {
    // 检查管理员权限
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return Err(createError('PERMISSION_DENIED', '只有管理员可以修改工作空间偏好'))
    }

    // 获取当前工作空间偏好
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('preferences')
      .eq('id', workspaceId)
      .single()

    const currentPrefs = ((workspace?.preferences || {}) as unknown) as WorkspacePreferences
    const scenarios = currentPrefs.scenarios || { code: [], api: [] }
    scenarios[scenario] = modelIds

    // 更新工作空间偏好
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        preferences: {
          scenarios,
          last_updated: new Date().toISOString()
        } as unknown as Json
      })
      .eq('id', workspaceId)

    if (updateError) {
      return Err(createError('DATABASE_ERROR', '保存工作空间偏好失败'))
    }
  } else {
    // 保存成员偏好
    const targetUserId = userId || user.id

    // 获取当前成员偏好
    const { data: member } = await supabase
      .from('workspace_members')
      .select('preferences')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .single()

    if (!member) {
      return Err(createError('NOT_FOUND', '成员不存在'))
    }

    const currentPrefs = ((member.preferences || {}) as unknown) as WorkspaceMemberPreferences
    const scenarios = currentPrefs.scenarios || { code: [], api: [] }
    scenarios[scenario] = modelIds

    // 更新成员偏好
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({
        preferences: {
          scenarios,
          last_updated: new Date().toISOString()
        } as unknown as Json
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)

    if (updateError) {
      return Err(createError('DATABASE_ERROR', '保存成员偏好失败'))
    }
  }

  return Ok()
}

/**
 * 重置成员偏好设置
 * 删除成员的自定义偏好，回退到工作空间默认
 */
export async function resetMemberPreferences(
  workspaceId: string,
  userId: string,
  scenario?: ScenarioType
): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }

  // 只能重置自己的偏好（除非是管理员）
  if (userId !== user.id) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return Err(createError('PERMISSION_DENIED', '没有权限重置其他成员的偏好'))
    }
  }

  if (scenario) {
    // 重置特定场景
    const { data: member } = await supabase
      .from('workspace_members')
      .select('preferences')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!member) {
      return Err(createError('NOT_FOUND', '成员不存在'))
    }

    const currentPrefs = ((member.preferences || {}) as unknown) as WorkspaceMemberPreferences
    const scenarios = currentPrefs.scenarios || { code: [], api: [] }
    scenarios[scenario] = []

    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({
        preferences: {
          scenarios,
          last_updated: new Date().toISOString()
        } as unknown as Json
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (updateError) {
      return Err(createError('DATABASE_ERROR', '重置偏好失败'))
    }
  } else {
    // 重置所有场景
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({
        preferences: createDefaultPreferences() as unknown as Json
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (updateError) {
      return Err(createError('DATABASE_ERROR', '重置偏好失败'))
    }
  }

  return Ok()
}