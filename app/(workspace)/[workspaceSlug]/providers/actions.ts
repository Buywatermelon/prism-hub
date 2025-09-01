'use server'

import { createClient } from '@/lib/supabase/server'
import { Provider, ProviderInsert, ProviderUpdate, CredentialInsert, CredentialUpdate, Credential } from './types'
import { Result, Ok, Err, createError, AppError } from '@/lib/result'

// ==================== Provider Actions ====================

/**
 * 获取工作空间的所有供应商
 */
export async function getProviders(workspaceId: string): Promise<Result<Provider[], AppError>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching providers:', error)
    return Err(createError('DATABASE_ERROR', '获取供应商列表失败', error))
  }

  return Ok(data as Provider[])
}

/**
 * 创建新的供应商
 */
export async function createProvider(workspaceId: string, provider: Omit<ProviderInsert, 'workspace_id' | 'id' | 'created_at' | 'updated_at'>): Promise<Result<Provider, AppError>> {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return Err(createError('AUTH_REQUIRED', '用户未登录'))
  }

  // 推断供应商类型
  const type = provider.type || inferProviderType(provider.endpoint || '')
  
  // 创建供应商
  const { data, error } = await supabase
    .from('providers')
    .insert({
      ...provider,
      type,
      workspace_id: workspaceId,
      created_by: user.id,
      models: provider.models || []
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating provider:', error)
    // 处理重复名称错误
    if (error.code === '23505') {
      return Err(createError('DUPLICATE_ENTRY', `已存在名为 "${provider.name}" 的供应商，请使用其他名称`))
    }
    return Err(createError('DATABASE_ERROR', '创建供应商失败', error))
  }

  // 不调用 revalidatePath，依赖客户端的乐观更新
  return Ok(data as Provider)
}

/**
 * 更新供应商
 */
export async function updateProvider(providerId: string, updates: ProviderUpdate): Promise<Result<Provider, AppError>> {
  const supabase = await createClient()
  
  // 如果更新了 endpoint，重新推断类型
  if (updates.endpoint) {
    updates.type = inferProviderType(updates.endpoint)
  }

  // 更新供应商
  const { data, error } = await supabase
    .from('providers')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', providerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating provider:', error)
    return Err(createError('DATABASE_ERROR', '更新供应商失败', error))
  }

  // 不调用 revalidatePath，依赖客户端的乐观更新
  return Ok(data as Provider)
}

/**
 * 删除供应商（会级联删除所有相关凭证）
 */
export async function deleteProvider(providerId: string): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  // 直接删除供应商（数据库设置了 ON DELETE CASCADE，会自动删除关联的凭证）
  const { error } = await supabase
    .from('providers')
    .delete()
    .eq('id', providerId)

  if (error) {
    console.error('Error deleting provider:', error)
    return Err(createError('DATABASE_ERROR', '删除供应商失败', error))
  }

  // 不调用 revalidatePath，依赖客户端的乐观更新
  return Ok()
}

// ==================== Credential Actions ====================

/**
 * 获取工作空间的所有凭证
 */
export async function getCredentials(workspaceId: string): Promise<Result<Credential[], AppError>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('provider_credentials')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching credentials:', error)
    return Err(createError('DATABASE_ERROR', '获取凭证列表失败', error))
  }

  // 返回凭证数据，包括完整的API密钥
  const credentials = data.map(credential => ({
    ...credential,
    api_key: credential.encrypted_key, // 将encrypted_key作为明文api_key返回
    encrypted_key: undefined, // 移除原字段
    key_hint: credential.key_hint || maskApiKey(credential.encrypted_key)
  })) as Credential[]
  
  return Ok(credentials)
}

/**
 * 获取供应商的凭证
 */
export async function getCredentialsByProvider(providerId: string): Promise<Result<Credential[], AppError>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('provider_credentials')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching credentials:', error)
    return Err(createError('DATABASE_ERROR', '获取供应商凭证失败', error))
  }

  // 返回凭证数据，包括完整的API密钥
  const credentials = data.map(credential => ({
    ...credential,
    api_key: credential.encrypted_key, // 将encrypted_key作为明文api_key返回
    encrypted_key: undefined, // 移除原字段
    key_hint: credential.key_hint || maskApiKey(credential.encrypted_key)
  })) as Credential[]
  
  return Ok(credentials)
}

/**
 * 创建新的凭证
 */
export async function createCredential(
  workspaceId: string, 
  providerId: string,
  credential: Omit<CredentialInsert, 'workspace_id' | 'provider_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<Result<Credential, AppError>> {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return Err(createError('AUTH_REQUIRED', '用户未登录'))
  }

  // 处理API密钥 - 生成提示信息（不加密，直接存储）
  let keyHint = ''
  if (credential.credential_type === 'api_key' && credential.encrypted_key) {
    keyHint = maskApiKey(credential.encrypted_key)
    // 直接明文存储API密钥
  }

  // 创建凭证
  const { data, error } = await supabase
    .from('provider_credentials')
    .insert({
      ...credential,
      workspace_id: workspaceId,
      provider_id: providerId,
      created_by: user.id,
      key_hint: keyHint,
      config: credential.config || {}
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating credential:', error)
    return Err(createError('DATABASE_ERROR', '创建凭证失败', error))
  }

  // 返回完整数据，包括API密钥
  const result = {
    ...data,
    api_key: data.encrypted_key, // 将encrypted_key作为api_key返回
    encrypted_key: undefined,
    key_hint: data.key_hint || keyHint
  } as Credential

  // 不调用 revalidatePath，依赖客户端的乐观更新
  return Ok(result)
}

/**
 * 更新凭证
 */
export async function updateCredential(credentialId: string, updates: CredentialUpdate): Promise<Result<Credential, AppError>> {
  const supabase = await createClient()
  
  // 如果更新了密钥，重新生成提示信息
  if (updates.encrypted_key) {
    updates.key_hint = maskApiKey(updates.encrypted_key)
    // 直接明文存储，不加密
  }

  // 更新凭证
  const { data, error } = await supabase
    .from('provider_credentials')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', credentialId)
    .select()
    .single()

  if (error) {
    console.error('Error updating credential:', error)
    return Err(createError('DATABASE_ERROR', '更新凭证失败', error))
  }

  // 返回完整数据，包括API密钥
  const result = {
    ...data,
    api_key: data.encrypted_key, // 将encrypted_key作为api_key返回
    encrypted_key: undefined,
    key_hint: data.key_hint
  } as Credential

  // 不调用 revalidatePath，依赖客户端的乐观更新
  return Ok(result)
}

/**
 * 删除凭证
 */
export async function deleteCredential(credentialId: string): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('provider_credentials')
    .delete()
    .eq('id', credentialId)

  if (error) {
    console.error('Error deleting credential:', error)
    return Err(createError('DATABASE_ERROR', '删除凭证失败', error))
  }

  // 不调用 revalidatePath，依赖客户端的乐观更新
  return Ok()
}

// ==================== Helper Functions ====================

/**
 * 根据 URL 推断供应商类型
 */
function inferProviderType(endpoint: string): 'openai' | 'claude' | 'gemini' {
  const url = endpoint.toLowerCase()
  
  if (url.includes('anthropic.com') || url.includes('claude')) {
    return 'claude'
  }
  
  if (url.includes('googleapis.com') || url.includes('gemini')) {
    return 'gemini'
  }
  
  // 默认为 OpenAI 兼容格式（包括 OpenAI、硅基流动、通义千问等）
  return 'openai'
}

/**
 * 掩码 API 密钥用于显示
 */
function maskApiKey(key: string | null): string {
  if (!key || key.length < 8) return 'sk-***'
  
  // 检测密钥类型并生成合适的掩码
  if (key.startsWith('sk-')) {
    // OpenAI 风格的密钥
    const suffix = key.substring(key.length - 4)
    return `sk-****${suffix}`
  } else if (key.startsWith('gsk_')) {
    // Groq 风格的密钥
    const suffix = key.substring(key.length - 4)
    return `gsk_****${suffix}`
  } else {
    // 通用密钥格式
    const prefix = key.substring(0, 3)
    const suffix = key.substring(key.length - 4)
    return `${prefix}****${suffix}`
  }
}