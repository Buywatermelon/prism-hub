/**
 * OAuth 工具函数
 */

interface OAuthCallbackParams {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

/**
 * 生成随机的 state 参数（防止 CSRF 攻击）
 */
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成 PKCE code verifier
 * 根据文档要求：96字节随机数据
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(96)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * 生成 PKCE code challenge
 * 使用SHA-256哈希
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

/**
 * Base64 URL 编码（无填充）
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * 生成完整的PKCE参数
 */
export async function generatePKCE() {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  return { codeVerifier, codeChallenge }
}

/**
 * 验证 state 参数
 */
export function validateState(receivedState: string, storedState: string): boolean {
  return receivedState === storedState
}

/**
 * 构建查询字符串
 */
export function buildQueryString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value)
    }
  })
  
  return searchParams.toString()
}

/**
 * 解析回调 URL 参数
 */
export function parseCallbackParams(url: URL): OAuthCallbackParams {
  const searchParams = url.searchParams
  
  return {
    code: searchParams.get('code') || undefined,
    state: searchParams.get('state') || undefined,
    error: searchParams.get('error') || undefined,
    error_description: searchParams.get('error_description') || undefined
  }
}

/**
 * 检查令牌是否过期
 */
export function isTokenExpired(expiresAt?: Date | string | null): boolean {
  if (!expiresAt) return false
  
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const now = new Date()
  
  // 提前 5 分钟认为过期，留出刷新时间
  const buffer = 5 * 60 * 1000
  return expiry.getTime() - buffer <= now.getTime()
}

/**
 * 计算令牌过期时间
 */
export function calculateExpiresAt(expiresIn?: number): Date {
  const now = new Date()
  const expiresInMs = (expiresIn || 3600) * 1000 // 默认 1 小时
  return new Date(now.getTime() + expiresInMs)
}

/**
 * 格式化 scopes
 */
export function formatScopes(scopes: string | string[]): string {
  if (Array.isArray(scopes)) {
    return scopes.join(' ')
  }
  return scopes
}

/**
 * 解析 scopes
 */
export function parseScopes(scopes?: string): string[] {
  if (!scopes) return []
  return scopes.split(' ').filter(Boolean)
}