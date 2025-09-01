export interface ModelPreferences {
  model_priority?: string[]  // 模型优先级列表
  // 预留给分组概念
  model_groups?: ModelPreferenceGroup[]
}

export interface ModelPreferenceGroup {
  id: string
  name: string  // 如 "快速响应", "深度分析", "代码生成"
  model_ids: string[]  // 该组中的模型ID列表
  description?: string
}

export interface WorkspacePreferences extends ModelPreferences {}

export interface WorkspaceMemberPreferences extends ModelPreferences {}