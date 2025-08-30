import type { User } from '@supabase/supabase-js'
import type { Database } from './database.types'

// 工作空间成员信息（后续使用）
export interface WorkspaceMembership {
  workspace: Database['public']['Tables']['workspaces']['Row']
  membership: Database['public']['Tables']['workspace_members']['Row']
}

// 表单数据类型
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
}