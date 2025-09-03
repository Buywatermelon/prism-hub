"use server"

import { createClient } from '@/lib/supabase/server'
import { Result, Ok, Err, createError } from '@/lib/result'
import type { AppError } from '@/lib/result'
import type { Json } from '@/types/database.types'
import { randomBytes, createHash } from 'crypto'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto/api-key'

export interface ApiKey {
  id: string
  description: string | null
  key: string  // 完整的解密后的密钥
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  scopes: ApiKeyScopes
}

export interface ApiKeyScopes {
  scenario?: string  // 默认场景
  permissions?: string[]  // 权限列表
}

export interface CreateApiKeyResult {
  key: string  // 完整密钥（仅创建时返回一次）
  apiKey: ApiKey  // API Key 信息
}

/**
 * 生成 API Key
 */
function generateApiKey(): { key: string; hash: string; encrypted: string } {
  // 生成 32 字节的随机密钥
  const keyBytes = randomBytes(32)
  const key = `ph_${keyBytes.toString('base64url')}`
  
  // 计算哈希值（用于快速验证）
  const hash = createHash('sha256').update(key).digest('hex')
  
  // 加密密钥（用于存储和显示）
  const encrypted = encryptApiKey(key)
  
  return { key, hash, encrypted }
}

/**
 * 获取用户的 API Keys
 */
export async function getUserApiKeys(
  workspaceId: string,
  userId: string
): Promise<Result<ApiKey[], AppError>> {
  const supabase = await createClient()
  
  // 验证用户身份
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.id !== userId) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }
  
  // 查询 API Keys
  const { data: keys, error } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return Err(createError('DATABASE_ERROR', '获取 API Keys 失败'))
  }
  
  const apiKeys: ApiKey[] = (keys || []).map(key => ({
    id: key.id,
    description: key.description,
    key: key.encrypted_key ? decryptApiKey(key.encrypted_key) : '', // 解密完整密钥
    createdAt: key.created_at,
    lastUsedAt: key.last_used_at,
    expiresAt: key.expires_at,
    scopes: (key.scopes as ApiKeyScopes) || {}
  }))
  
  return Ok(apiKeys)
}

/**
 * 创建 API Key
 */
export async function createApiKey(
  workspaceId: string,
  description: string,
  scopes: ApiKeyScopes,
  expiresInDays?: number
): Promise<Result<CreateApiKeyResult, AppError>> {
  const supabase = await createClient()
  
  // 验证用户身份
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }
  
  // 验证工作空间成员身份
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
  
  if (!member) {
    return Err(createError('PERMISSION_DENIED', '您不是该工作空间的成员'))
  }
  
  // 生成密钥
  const { key, hash, encrypted } = generateApiKey()
  
  // 计算过期时间
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null
  
  // 插入数据库
  const { data: apiKey, error: insertError } = await supabase
    .from('user_api_keys')
    .insert({
      user_id: user.id,
      workspace_id: workspaceId,
      key_hash: hash,
      encrypted_key: encrypted,
      description: description || null,
      scopes: scopes as unknown as Json,
      expires_at: expiresAt
    })
    .select()
    .single()
  
  if (insertError) {
    return Err(createError('DATABASE_ERROR', '创建 API Key 失败'))
  }
  
  return Ok({
    key,  // 完整密钥
    apiKey: {
      id: apiKey.id,
      description: apiKey.description,
      key: decryptApiKey(apiKey.encrypted_key),  // 返回解密后的完整密钥
      createdAt: apiKey.created_at,
      lastUsedAt: apiKey.last_used_at,
      expiresAt: apiKey.expires_at,
      scopes: (apiKey.scopes as ApiKeyScopes) || {}
    }
  })
}

/**
 * 更新 API Key
 */
export async function updateApiKey(
  workspaceId: string,
  keyId: string,
  updates: {
    description?: string
    scopes?: ApiKeyScopes
  }
): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  // 验证用户身份
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }
  
  // 验证密钥所有权
  const { data: existingKey } = await supabase
    .from('user_api_keys')
    .select('id')
    .eq('id', keyId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (!existingKey) {
    return Err(createError('NOT_FOUND', 'API Key 不存在'))
  }
  
  // 更新数据
  const updateData: any = {}
  if (updates.description !== undefined) {
    updateData.description = updates.description || null
  }
  if (updates.scopes !== undefined) {
    updateData.scopes = updates.scopes as unknown as Json
  }
  
  const { error: updateError } = await supabase
    .from('user_api_keys')
    .update(updateData)
    .eq('id', keyId)
  
  if (updateError) {
    return Err(createError('DATABASE_ERROR', '更新 API Key 失败'))
  }
  
  return Ok()
}

/**
 * 删除 API Key
 */
export async function deleteApiKey(
  workspaceId: string,
  keyId: string
): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  // 验证用户身份
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Err(createError('AUTH_REQUIRED', '请先登录'))
  }
  
  // 验证密钥所有权并删除
  const { error: deleteError } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('id', keyId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
  
  if (deleteError) {
    return Err(createError('DATABASE_ERROR', '删除 API Key 失败'))
  }
  
  return Ok()
}