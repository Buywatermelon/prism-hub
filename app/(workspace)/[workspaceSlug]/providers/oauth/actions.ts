'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateState, buildQueryString, calculateExpiresAt, formatScopes, generatePKCE } from '@/lib/oauth/utils'
import { BUILTIN_OAUTH_PROVIDERS } from '@/lib/oauth/config'
import { cookies } from 'next/headers'
import { Result, Ok, Err, createError, AppError } from '@/lib/result'

/**
 * 生成OAuth授权URL
 * 根据oauth-integration-guide-zh.md实现
 */
export async function generateOAuthURL(
  providerId: string,
  workspaceId: string
): Promise<Result<{ url: string; state: string }, AppError>> {
  try {
    const supabase = await createClient()
    
    // 获取provider
    const { data: provider, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single()
    
    if (error || !provider) {
      return Err(createError('NOT_FOUND', '供应商不存在'))
    }
    
    // 获取对应的OAuth配置
    const oauthConfig = BUILTIN_OAUTH_PROVIDERS.find(p => p.type === provider.type)
    if (!oauthConfig) {
      return Err(createError('BUSINESS_ERROR', '该供应商不支持OAuth'))
    }
    
    // 生成state
    const state = generateState()
    const cookieStore = await cookies()
    
    // 生成PKCE参数（如果需要）
    let pkceParams = {}
    if (oauthConfig.oauth.use_pkce) {
      const { codeVerifier, codeChallenge } = await generatePKCE()
      pkceParams = {
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      }
      
      // 存储code_verifier
      cookieStore.set('oauth_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10,
        path: '/'
      })
    }
    
    // 存储state和上下文
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/'
    })
    
    cookieStore.set('oauth_context', JSON.stringify({
      provider_id: providerId,
      workspace_id: workspaceId,
      provider_name: provider.name,
      provider_type: provider.type
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/'
    })
    
    // 构建OAuth URL
    const params = {
      response_type: 'code',
      client_id: oauthConfig.oauth.client_id,
      redirect_uri: oauthConfig.oauth.redirect_uri,
      scope: formatScopes(oauthConfig.oauth.scopes),
      state,
      ...pkceParams,
      ...oauthConfig.oauth.additional_params
    }
    
    const authUrl = `${oauthConfig.oauth.authorization_url}?${buildQueryString(params)}`
    
    return Ok({ 
      url: authUrl,
      state 
    })
  } catch (error) {
    console.error('Error generating OAuth URL:', error)
    return Err(createError('INTERNAL_ERROR', '生成授权链接失败', error))
  }
}

/**
 * 用授权码交换访问令牌
 * 根据oauth-integration-guide-zh.md实现
 */
export async function exchangeOAuthCode(
  code: string,
  state?: string
): Promise<Result<{ credential: any; workspace_slug?: string }, AppError>> {
  try {
    const cookieStore = await cookies()
    
    // 验证state
    if (state) {
      const storedState = cookieStore.get('oauth_state')?.value
      if (!storedState || storedState !== state) {
        return Err(createError('AUTH_FAILED', '授权状态验证失败'))
      }
    }
    
    // 获取context信息
    const contextStr = cookieStore.get('oauth_context')?.value
    if (!contextStr) {
      return Err(createError('AUTH_FAILED', '授权上下文丢失，请重新授权'))
    }
    
    const context = JSON.parse(contextStr)
    const { provider_id, workspace_id, provider_name, provider_type } = context
    
    // 获取OAuth配置
    const oauthConfig = BUILTIN_OAUTH_PROVIDERS.find(p => p.type === provider_type)
    if (!oauthConfig) {
      return Err(createError('NOT_FOUND', '未找到OAuth配置'))
    }
    
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return Err(createError('AUTH_REQUIRED', '未登录'))
    }
    
    // 准备token交换参数
    const tokenBody: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: oauthConfig.oauth.client_id,
      code,
      redirect_uri: oauthConfig.oauth.redirect_uri,
    }
    
    // 添加client_secret（Gemini需要）
    if (oauthConfig.oauth.client_secret) {
      tokenBody.client_secret = oauthConfig.oauth.client_secret
    }
    
    // 添加PKCE verifier（如果需要）
    if (oauthConfig.oauth.use_pkce) {
      const codeVerifier = cookieStore.get('oauth_verifier')?.value
      if (codeVerifier) {
        tokenBody.code_verifier = codeVerifier
      }
    }
    
    // Claude需要特殊处理
    let tokenResponse
    if (provider_type === 'claude') {
      // Claude使用JSON格式
      tokenBody.state = state || ''
      tokenResponse = await fetch(oauthConfig.oauth.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tokenBody)
      })
    } else {
      // OpenAI和Gemini使用form-urlencoded
      tokenResponse = await fetch(oauthConfig.oauth.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: buildQueryString(tokenBody)
      })
    }
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      return Err(createError('AUTH_FAILED', '令牌交换失败', error))
    }
    
    const tokens = await tokenResponse.json()
    
    // 创建凭证
    const credentialName = `${provider_name} OAuth`
    
    const { data: credential, error: credError } = await supabase
      .from('provider_credentials')
      .insert({
        workspace_id,
        provider_id,
        credential_type: 'oauth_account',
        name: credentialName,
        status: 'active',
        oauth_data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type || 'Bearer',
          expires_at: tokens.expires_in ? calculateExpiresAt(tokens.expires_in).toISOString() : null,
          scopes: oauthConfig.oauth.scopes,
          // 存储provider特定的数据
          ...(provider_type === 'openai' && {
            id_token: tokens.id_token,
            account_id: tokens.account_id
          })
        },
        created_by: user.id
      })
      .select()
      .single()
    
    if (credError) {
      console.error('Error creating credential:', credError)
      return Err(createError('DATABASE_ERROR', '保存凭证失败', credError))
    }
    
    // 清理cookie
    cookieStore.delete('oauth_state')
    cookieStore.delete('oauth_context')
    cookieStore.delete('oauth_verifier')
    
    revalidatePath('/[workspaceSlug]/providers')
    
    // 获取workspace的slug用于跳转
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('slug')
      .eq('id', workspace_id)
      .single()
    
    return Ok({ 
      credential: {
        ...credential,
        api_key: tokens.access_token, // 兼容现有的凭证显示逻辑
      },
      workspace_slug: workspace?.slug
    })
  } catch (error) {
    console.error('Error exchanging OAuth code:', error)
    return Err(createError('INTERNAL_ERROR', '授权失败，请重试', error))
  }
}

/**
 * 刷新OAuth访问令牌
 * 根据oauth-integration-guide-zh.md实现
 */
export async function refreshOAuthToken(credentialId: string): Promise<Result<void, AppError>> {
  try {
    const supabase = await createClient()
    
    // 获取凭证
    const { data: credential, error: credError } = await supabase
      .from('provider_credentials')
      .select('*, providers(*)')
      .eq('id', credentialId)
      .single()
    
    if (credError || !credential) {
      return Err(createError('NOT_FOUND', '凭证不存在'))
    }
    
    if (credential.credential_type !== 'oauth_account') {
      return Err(createError('VALIDATION_ERROR', '该凭证不是OAuth类型'))
    }
    
    const oauthData = credential.oauth_data as Record<string, any>
    const refreshToken = oauthData?.refresh_token as string | undefined
    if (!refreshToken) {
      return Err(createError('BUSINESS_ERROR', '没有刷新令牌'))
    }
    
    const providerType = credential.providers?.type
    const oauthConfig = BUILTIN_OAUTH_PROVIDERS.find(p => p.type === providerType)
    if (!oauthConfig) {
      return Err(createError('NOT_FOUND', 'OAuth配置缺失'))
    }
    
    // 准备刷新令牌参数
    const tokenBody: Record<string, string> = {
      grant_type: 'refresh_token',
      client_id: oauthConfig.oauth.client_id,
      refresh_token: refreshToken,
    }
    
    // 添加client_secret（Gemini需要）
    if (oauthConfig.oauth.client_secret) {
      tokenBody.client_secret = oauthConfig.oauth.client_secret
    }
    
    // Claude需要特殊处理
    let tokenResponse
    if (providerType === 'claude') {
      tokenResponse = await fetch(oauthConfig.oauth.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tokenBody)
      })
    } else {
      // OpenAI需要scope参数
      if (providerType === 'openai') {
        tokenBody.scope = 'openid profile email'
      }
      
      tokenResponse = await fetch(oauthConfig.oauth.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: buildQueryString(tokenBody)
      })
    }
    
    if (!tokenResponse.ok) {
      return Err(createError('AUTH_FAILED', '令牌刷新失败'))
    }
    
    const tokens = await tokenResponse.json()
    
    // 更新凭证
    const { error: updateError } = await supabase
      .from('provider_credentials')
      .update({
        oauth_data: {
          ...(credential.oauth_data as Record<string, any>),
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || (credential.oauth_data as Record<string, any>)?.refresh_token,
          expires_at: tokens.expires_in ? calculateExpiresAt(tokens.expires_in).toISOString() : null,
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', credentialId)
    
    if (updateError) {
      return Err(createError('DATABASE_ERROR', '更新凭证失败', updateError))
    }
    
    revalidatePath('/[workspaceSlug]/providers')
    
    return Ok()
  } catch (error) {
    console.error('Error refreshing OAuth token:', error)
    return Err(createError('INTERNAL_ERROR', '刷新令牌失败', error))
  }
}

/**
 * 初始化内置OAuth提供商
 * 为新工作空间创建内置的OAuth提供商
 */
export async function initBuiltinOAuthProviders(workspaceId: string): Promise<Result<void, AppError>> {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return Err(createError('AUTH_REQUIRED', '未登录'))
    }
    
    // 内置提供商配置（从BUILTIN_OAUTH_PROVIDERS获取）
    const builtinProviders = BUILTIN_OAUTH_PROVIDERS.map(config => ({
      name: config.name,
      type: config.type,
      description: config.description,
      icon: config.icon,
      config: {
        oauth: {
          ...config.oauth,
          api_endpoint: config.oauth.api_endpoint
        },
        builtin: config.builtin
      }
    }))
    
    // 批量插入，忽略重复
    for (const provider of builtinProviders) {
      await supabase
        .from('providers')
        .upsert({
          workspace_id: workspaceId,
          name: provider.name,
          type: provider.type,
          description: provider.description,
          icon: provider.icon,
          config: provider.config,
          created_by: user.id
        }, {
          onConflict: 'workspace_id,name'
        })
    }
    
    return Ok()
  } catch (error) {
    console.error('Error initializing builtin providers:', error)
    return Err(createError('INTERNAL_ERROR', '初始化内置提供商失败', error))
  }
}