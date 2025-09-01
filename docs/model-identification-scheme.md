# 模型标识方案设计

## 当前状况
- 模型存储在 `providers` 表的 `models` 字段中（JSONB 数组）
- 模型仅有名称，没有独立的 ID
- 示例：`["claude-3-opus", "claude-3-sonnet", "gpt-4", "gpt-3.5-turbo"]`

## 方案设计

### 方案一：组合键标识（推荐）
使用 `provider_id:model_name` 作为唯一标识

**优点：**
- 无需修改数据库结构
- 立即可实现
- 模型标识全局唯一

**实现示例：**
```typescript
interface ModelIdentifier {
  providerId: string
  modelName: string
  
  // 生成唯一标识
  get id(): string {
    return `${this.providerId}:${this.modelName}`
  }
  
  // 从标识解析
  static parse(id: string): ModelIdentifier {
    const [providerId, ...modelParts] = id.split(':')
    return {
      providerId,
      modelName: modelParts.join(':') // 处理模型名中可能的冒号
    }
  }
}
```

**在模型偏好中的使用：**
```json
{
  "model_priority": [
    "provider-uuid-1:claude-3-opus",
    "provider-uuid-2:gpt-4",
    "provider-uuid-1:claude-3-sonnet"
  ]
}
```

### 方案二：扩展 models 字段结构
将 models 字段从字符串数组改为对象数组

**数据结构：**
```json
{
  "models": [
    {
      "id": "claude-3-opus",
      "name": "Claude 3 Opus",
      "description": "最强大的推理模型",
      "capabilities": ["code", "analysis", "creative"],
      "context_window": 200000,
      "cost_per_1k": 0.015
    }
  ]
}
```

**优点：**
- 可存储更多模型元数据
- 支持未来扩展

**缺点：**
- 需要数据迁移
- 改动较大

### 方案三：创建独立的 models 表
创建新表存储模型信息

**表结构：**
```sql
CREATE TABLE models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text,
  description text,
  capabilities jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, name)
);
```

**优点：**
- 最规范的关系型设计
- 支持复杂查询和关联

**缺点：**
- 需要大量重构
- 增加系统复杂度

## 推荐实现：方案一

### 实现步骤

1. **创建模型标识工具函数**
```typescript
// lib/utils/model-identifier.ts
export function createModelId(providerId: string, modelName: string): string {
  return `${providerId}:${modelName}`
}

export function parseModelId(modelId: string): { providerId: string; modelName: string } {
  const [providerId, ...modelParts] = modelId.split(':')
  return {
    providerId,
    modelName: modelParts.join(':')
  }
}

export function getModelDisplayName(providerId: string, modelName: string, providers: Provider[]): string {
  const provider = providers.find(p => p.id === providerId)
  if (!provider) return modelName
  return `${provider.name} - ${modelName}`
}
```

2. **更新模型偏好处理逻辑**
```typescript
// 获取所有可用模型
export async function getAvailableModels(workspaceId: string) {
  const providers = await getProvidersWithCredentials(workspaceId)
  
  const models = []
  for (const provider of providers) {
    for (const modelName of provider.models) {
      models.push({
        id: createModelId(provider.id, modelName),
        providerId: provider.id,
        providerName: provider.name,
        modelName: modelName,
        displayName: `${provider.name} - ${modelName}`,
        hasActiveCredentials: provider.activeCredentials > 0
      })
    }
  }
  
  return models
}
```

3. **更新 UI 组件**
- 模型选择器显示 `provider.name - model.name`
- 存储时使用 `provider.id:model.name`
- 读取时解析标识符

### 迁移策略

对于现有的 `provider_priority`（将改为 `model_priority`）：
1. 如果存储的是 provider ID，需要迁移为 model ID
2. 提供向后兼容逻辑，自动转换旧格式

```typescript
function migrateProviderPriorityToModelPriority(
  providerIds: string[], 
  providers: Provider[]
): string[] {
  const modelIds = []
  
  for (const providerId of providerIds) {
    const provider = providers.find(p => p.id === providerId)
    if (provider && provider.models.length > 0) {
      // 添加该供应商的第一个模型
      modelIds.push(createModelId(providerId, provider.models[0]))
    }
  }
  
  return modelIds
}
```

## 未来扩展

当需要更复杂的模型管理时，可以：
1. 先使用方案一快速实现
2. 后续根据需求升级到方案二或方案三
3. 保持 API 接口稳定，内部实现可以逐步演进