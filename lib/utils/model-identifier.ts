/**
 * 模型标识工具函数
 * 使用 provider_id:model_name 格式作为唯一标识
 */

/**
 * 创建模型的唯一标识
 */
export function createModelId(providerId: string, modelName: string): string {
  return `${providerId}:${modelName}`
}

/**
 * 解析模型标识
 */
export function parseModelId(modelId: string): { providerId: string; modelName: string } | null {
  const separatorIndex = modelId.indexOf(':')
  if (separatorIndex === -1) {
    return null
  }
  
  return {
    providerId: modelId.substring(0, separatorIndex),
    modelName: modelId.substring(separatorIndex + 1)
  }
}

/**
 * 获取模型的显示名称
 */
export function getModelDisplayName(
  providerId: string, 
  modelName: string, 
  providerName?: string
): string {
  if (providerName) {
    return `${providerName} - ${modelName}`
  }
  return modelName
}

/**
 * 检查模型ID是否有效
 */
export function isValidModelId(modelId: string): boolean {
  const parsed = parseModelId(modelId)
  return parsed !== null && parsed.providerId.length > 0 && parsed.modelName.length > 0
}

/**
 * 从供应商列表中提取所有模型
 */
export interface ModelInfo {
  id: string
  providerId: string
  providerName: string
  modelName: string
  displayName: string
  providerType: string
  providerIcon?: string
  hasActiveCredentials: boolean
}

export function extractModelsFromProviders(providers: Array<{
  id: string
  name: string
  type: string
  icon?: string
  models?: any
  activeCredentials?: number
  totalCredentials?: number
}>): ModelInfo[] {
  const models: ModelInfo[] = []
  
  for (const provider of providers) {
    // 确保 models 是数组
    const modelList = Array.isArray(provider.models) ? provider.models : []
    
    for (const modelName of modelList) {
      models.push({
        id: createModelId(provider.id, String(modelName)),
        providerId: provider.id,
        providerName: provider.name,
        modelName: String(modelName),
        displayName: getModelDisplayName(provider.id, String(modelName), provider.name),
        providerType: provider.type,
        providerIcon: provider.icon,
        hasActiveCredentials: (provider.activeCredentials || 0) > 0
      })
    }
  }
  
  return models
}