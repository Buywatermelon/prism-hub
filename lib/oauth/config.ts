/**
 * OAuth 提供商配置
 * 根据oauth-integration-guide-zh.md文档配置
 */

export interface OAuthProviderConfig {
  name: string
  type: 'claude' | 'openai' | 'gemini'
  description: string
  icon?: string  // SVG 或图标 URL
  oauth: {
    authorization_url: string
    token_url: string
    api_endpoint: string
    client_id: string
    client_secret?: string
    redirect_uri: string
    scopes: string[]
    use_pkce: boolean
    additional_params?: Record<string, string>
  }
  builtin: boolean
}

/**
 * 内置OAuth提供商配置
 * 所有配置值来自 oauth-integration-guide-zh.md
 */
export const BUILTIN_OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    name: 'Claude Code',
    type: 'claude',
    description: 'Anthropic Claude 官方 CLI',
    icon: 'https://www.anthropic.com/favicon.ico',
    oauth: {
      authorization_url: 'https://claude.ai/oauth/authorize',
      token_url: 'https://console.anthropic.com/v1/oauth/token',
      api_endpoint: 'https://api.anthropic.com',
      client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
      redirect_uri: 'http://localhost:54545/callback',
      scopes: ['org:create_api_key', 'user:profile', 'user:inference'],
      use_pkce: true,
      additional_params: {
        code: 'true'
      }
    },
    builtin: true
  },
  {
    name: 'CodeX CLI',
    type: 'openai',
    description: 'OpenAI 官方 CLI',
    icon: 'https://openai.com/favicon.ico',
    oauth: {
      authorization_url: 'https://auth.openai.com/oauth/authorize',
      token_url: 'https://auth.openai.com/oauth/token',
      api_endpoint: 'https://chatgpt.com/backend-api',
      client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
      redirect_uri: 'http://localhost:1455/auth/callback',
      scopes: ['openid', 'email', 'profile', 'offline_access'],
      use_pkce: true,
      additional_params: {
        prompt: 'login',
        id_token_add_organizations: 'true',
        codex_cli_simplified_flow: 'true'
      }
    },
    builtin: true
  },
  {
    name: 'Gemini CLI',
    type: 'gemini',
    description: 'Google Gemini 官方 CLI',
    icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    oauth: {
      authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_url: 'https://oauth2.googleapis.com/token',
      api_endpoint: 'https://generativelanguage.googleapis.com',
      client_id: '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com',
      client_secret: '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',
      redirect_uri: 'http://localhost:8085/oauth2callback',
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      use_pkce: false,
      additional_params: {
        access_type: 'offline',
        prompt: 'consent'
      }
    },
    builtin: true
  }
]

/**
 * 获取OAuth重定向URI
 * 注意：每个提供商有固定的重定向URI，不能随意更改
 */
export function getOAuthRedirectUri(provider: 'claude' | 'openai' | 'gemini'): string {
  const config = BUILTIN_OAUTH_PROVIDERS.find(p => p.type === provider)
  return config?.oauth.redirect_uri || 'http://localhost:3000/oauth/callback'
}