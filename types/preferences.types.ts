/**
 * 模型偏好系统类型定义
 * 支持场景化配置和两级偏好（工作空间/成员）
 */

// ============= 基础类型 =============

/**
 * 支持的场景类型
 */
export type ScenarioType = 'code' | 'api'

/**
 * 模型类型
 */
export type ModelType = 'apikey' | 'oauth'

/**
 * 模型ID格式
 * - API模型: "apikey:{provider_id}:{model_name}"
 * - OAuth模型: "oauth:{provider_id}:{model_name}"
 */
export type ModelId = `${ModelType}:${string}:${string}`

// ============= 偏好配置 =============

/**
 * 场景偏好配置
 * 每个场景包含一个有序的模型ID列表
 */
export interface ScenarioPreferences {
  code: ModelId[]  // 编程场景的模型优先级
  api: ModelId[]   // API调用场景的模型优先级
}

/**
 * 工作空间偏好
 */
export interface WorkspacePreferences {
  scenarios: ScenarioPreferences
  last_updated: string
}

/**
 * 成员偏好（结构与工作空间相同）
 */
export interface WorkspaceMemberPreferences {
  scenarios: ScenarioPreferences
  last_updated: string
}

// ============= 模型信息 =============

/**
 * 模型基础信息
 */
export interface ModelInfo {
  id: ModelId                    // 模型唯一标识
  name: string                   // 模型显示名称
  provider: string               // 供应商名称
  providerId: string             // 供应商ID
  type: ModelType                // 模型类型
  available: boolean             // 是否可用
  credentialCount?: number       // 可用凭证数量
}

/**
 * 解析后的模型ID
 */
export interface ParsedModelId {
  type: ModelType
  providerId: string
  modelName: string
}

// ============= API响应类型 =============

/**
 * 获取偏好的响应
 */
export interface PreferencesResponse {
  preferences: ScenarioPreferences
  source: 'member' | 'workspace' | 'default'
  lastUpdated?: string
}

/**
 * 可用模型列表响应
 */
export interface AvailableModelsResponse {
  models: ModelInfo[]
  totalProviders: number
  activeCredentials: number
}

// ============= 工具函数类型 =============

/**
 * 解析模型ID
 */
export function parseModelId(modelId: ModelId): ParsedModelId {
  const [type, providerId, ...modelNameParts] = modelId.split(':')
  return {
    type: type as ModelType,
    providerId,
    modelName: modelNameParts.join(':') // 处理模型名称中可能包含冒号的情况
  }
}

/**
 * 构建模型ID
 */
export function buildModelId(type: ModelType, providerId: string, modelName: string): ModelId {
  return `${type}:${providerId}:${modelName}`
}

/**
 * 检查是否为有效的模型ID
 */
export function isValidModelId(id: string): id is ModelId {
  const parts = id.split(':')
  if (parts.length < 3) return false
  const [type] = parts
  return type === 'apikey' || type === 'oauth'
}

/**
 * 创建默认偏好
 */
export function createDefaultPreferences(): WorkspacePreferences {
  return {
    scenarios: {
      code: [],
      api: []
    },
    last_updated: new Date().toISOString()
  }
}

/**
 * 合并偏好（成员覆盖工作空间）
 */
export function mergePreferences(
  workspace: WorkspacePreferences | null,
  member: WorkspaceMemberPreferences | null,
  scenario: ScenarioType
): ModelId[] {
  // 如果成员有配置，使用成员配置
  if (member?.scenarios?.[scenario]?.length) {
    return member.scenarios[scenario]
  }
  
  // 否则使用工作空间配置
  if (workspace?.scenarios?.[scenario]?.length) {
    return workspace.scenarios[scenario]
  }
  
  // 都没有则返回空数组
  return []
}