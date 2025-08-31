import { Database } from '@/types/database.types'

export type Provider = Database['public']['Tables']['providers']['Row']
export type ProviderInsert = Database['public']['Tables']['providers']['Insert']
export type ProviderUpdate = Database['public']['Tables']['providers']['Update']

// 从数据库返回的原始凭证类型
type CredentialBase = Database['public']['Tables']['provider_credentials']['Row']

// 处理后的凭证类型（用于前端展示）
export type Credential = Omit<CredentialBase, 'encrypted_key'> & {
  key_hint: string
  api_key?: string | null // 完整的API密钥（从encrypted_key转换而来）
}

export type CredentialInsert = Database['public']['Tables']['provider_credentials']['Insert']
export type CredentialUpdate = Database['public']['Tables']['provider_credentials']['Update']