/**
 * 模型定义 - 所有支持的AI模型的静态定义
 * 基于实际支持的模型列表，用于模型偏好配置
 */

// ============= 模型定义接口 =============

export interface ModelDefinition {
  // 基本信息
  id: string                    // 模型ID（不含provider前缀）
  object?: string               // 对象类型，通常为 "model"
  created?: number              // 创建时间戳
  ownedBy?: string             // 所有者
  type?: string                // 模型类型 (claude, gemini, openai 等)
  displayName: string          // 显示名称
  version?: string             // 版本号
  description?: string         // 描述
  
  // 容量限制
  contextLength?: number       // 上下文窗口大小
  inputTokenLimit?: number     // 输入token限制
  outputTokenLimit?: number    // 输出token限制
  maxCompletionTokens?: number // 最大完成token数
  
  // 功能支持
  supportedGenerationMethods?: string[]  // 支持的生成方法
  supportedParameters?: string[]         // 支持的参数
  
  // 其他属性
  tier?: 'lite' | 'standard' | 'premium'  // 模型等级
  deprecated?: boolean          // 是否已弃用
}

export interface ProviderModels {
  provider: string              // 供应商标识
  displayName: string           // 供应商显示名称
  models: ModelDefinition[]     // 支持的模型列表
}

// ============= Claude (Anthropic) 模型 =============

export const CLAUDE_MODELS: ModelDefinition[] = [
  {
    id: 'claude-opus-4-1-20250805',
    object: 'model',
    created: 1722945600, // 2025-08-05
    ownedBy: 'anthropic',
    type: 'claude',
    displayName: 'Claude 4.1 Opus',
    description: '最新的Claude 4.1 Opus模型，性能卓越',
    contextLength: 200000,
    tier: 'premium'
  },
  {
    id: 'claude-opus-4-20250514',
    object: 'model',
    created: 1715644800, // 2025-05-14
    ownedBy: 'anthropic',
    type: 'claude',
    displayName: 'Claude 4 Opus',
    description: 'Claude 4系列的旗舰模型',
    contextLength: 200000,
    tier: 'premium'
  },
  {
    id: 'claude-sonnet-4-20250514',
    object: 'model',
    created: 1715644800, // 2025-05-14
    ownedBy: 'anthropic',
    type: 'claude',
    displayName: 'Claude 4 Sonnet',
    description: 'Claude 4系列的平衡模型',
    contextLength: 200000,
    tier: 'standard'
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    object: 'model',
    created: 1708300800, // 2025-02-19
    ownedBy: 'anthropic',
    type: 'claude',
    displayName: 'Claude 3.7 Sonnet',
    description: '增强版Claude 3 Sonnet',
    contextLength: 200000,
    tier: 'standard'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    object: 'model',
    created: 1729555200, // 2024-10-22
    ownedBy: 'anthropic',
    type: 'claude',
    displayName: 'Claude 3.5 Haiku',
    description: '快速响应的轻量级模型',
    contextLength: 200000,
    tier: 'lite'
  }
]

// ============= OpenAI 模型 =============

export const OPENAI_MODELS: ModelDefinition[] = [
  {
    id: 'gpt-5',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'openai',
    type: 'openai',
    version: 'gpt-5-2025-08-07',
    displayName: 'GPT-5',
    description: '最强大的GPT模型，适合编码和代理任务',
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: ['tools'],
    tier: 'premium'
  },
  {
    id: 'gpt-5-high',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'openai',
    type: 'openai',
    version: 'gpt-5-2025-08-07',
    displayName: 'GPT-5 High',
    description: 'GPT-5高性能版本',
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: ['tools'],
    tier: 'premium'
  },
  {
    id: 'gpt-5-medium',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'openai',
    type: 'openai',
    version: 'gpt-5-2025-08-07',
    displayName: 'GPT-5 Medium',
    description: 'GPT-5平衡版本',
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: ['tools'],
    tier: 'standard'
  },
  {
    id: 'gpt-5-low',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'openai',
    type: 'openai',
    version: 'gpt-5-2025-08-07',
    displayName: 'GPT-5 Low',
    description: 'GPT-5经济版本',
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: ['tools'],
    tier: 'standard'
  },
  {
    id: 'gpt-5-minimal',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'openai',
    type: 'openai',
    version: 'gpt-5-2025-08-07',
    displayName: 'GPT-5 Minimal',
    description: 'GPT-5轻量版本',
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: ['tools'],
    tier: 'lite'
  },
  {
    id: 'codex-mini-latest',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'openai',
    type: 'openai',
    version: '1.0',
    displayName: 'Codex Mini',
    description: '轻量级代码生成模型',
    contextLength: 4096,
    maxCompletionTokens: 2048,
    supportedParameters: ['temperature', 'max_tokens', 'stream', 'stop'],
    tier: 'lite'
  }
]

// ============= Gemini (Google) 模型 =============

export const GEMINI_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-2.5-pro',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'google',
    type: 'gemini',
    version: '2.5',
    displayName: 'Gemini 2.5 Pro',
    description: 'Gemini 2.5系列的旗舰模型',
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    supportedGenerationMethods: ['generateContent', 'countTokens', 'createCachedContent', 'batchGenerateContent'],
    tier: 'premium'
  },
  {
    id: 'gemini-2.5-flash',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'google',
    type: 'gemini',
    version: '001',
    displayName: 'Gemini 2.5 Flash',
    description: '支持百万令牌的中型多模态模型',
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    supportedGenerationMethods: ['generateContent', 'countTokens', 'createCachedContent', 'batchGenerateContent'],
    tier: 'standard'
  },
  {
    id: 'gemini-2.5-flash-lite',
    object: 'model',
    created: Date.now() / 1000,
    ownedBy: 'google',
    type: 'gemini',
    version: '2.5',
    displayName: 'Gemini 2.5 Flash Lite',
    description: 'Gemini 2.5 Flash的轻量版本',
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    supportedGenerationMethods: ['generateContent', 'countTokens', 'createCachedContent', 'batchGenerateContent'],
    tier: 'lite'
  }
]

// ============= OAuth供应商模型配置 =============

/**
 * OAuth供应商支持的模型
 * 这些模型通过OAuth认证的CLI工具访问
 */
export const OAUTH_PROVIDER_MODELS: Record<string, ProviderModels> = {
  // Claude Code (Anthropic CLI)
  // Claude Code 主要用于编程任务，只需要 Opus 和 Sonnet
  claude: {
    provider: 'claude',
    displayName: 'Claude Code',
    models: [
      {
        id: 'claude-opus-4-1-20250805',
        object: 'model',
        created: 1722945600, // 2025-08-05
        ownedBy: 'anthropic',
        type: 'claude',
        displayName: 'Claude 4.1 Opus',
        description: '最强大的Claude模型，适合复杂任务',
        contextLength: 200000,
        tier: 'premium'
      },
      {
        id: 'claude-3-7-sonnet-20250219',
        object: 'model',
        created: 1708300800, // 2025-02-19
        ownedBy: 'anthropic',
        type: 'claude',
        displayName: 'Claude 3.7 Sonnet',
        description: '平衡性能和效率的日常使用模型',
        contextLength: 200000,
        tier: 'standard'
      }
    ]
  },
  
  // CodeX CLI (OpenAI CLI)
  // CodeX CLI 主要用于编程任务，提供多个性能级别
  openai: {
    provider: 'openai',
    displayName: 'CodeX CLI',
    models: [
      {
        id: 'gpt-5',
        object: 'model',
        created: Date.now() / 1000,
        ownedBy: 'openai',
        type: 'openai',
        version: 'gpt-5-2025-08-07',
        displayName: 'GPT-5',
        description: '最强大的GPT模型，适合编码和代理任务',
        contextLength: 400000,
        maxCompletionTokens: 128000,
        supportedParameters: ['tools'],
        tier: 'premium'
      },
      {
        id: 'gpt-5-medium',
        object: 'model',
        created: Date.now() / 1000,
        ownedBy: 'openai',
        type: 'openai',
        version: 'gpt-5-2025-08-07',
        displayName: 'GPT-5 Medium',
        description: '平衡性能和成本的版本',
        contextLength: 400000,
        maxCompletionTokens: 128000,
        supportedParameters: ['tools'],
        tier: 'standard'
      }
    ]
  },
  
  // Gemini CLI (Google CLI)
  // Gemini CLI 提供 Pro 和 Flash 两种模型
  gemini: {
    provider: 'gemini',
    displayName: 'Gemini CLI',
    models: [
      {
        id: 'gemini-2.5-pro',
        object: 'model',
        created: Date.now() / 1000,
        ownedBy: 'google',
        type: 'gemini',
        version: '2.5',
        displayName: 'Gemini 2.5 Pro',
        description: '旗舰模型，支持百万级上下文',
        inputTokenLimit: 1048576,
        outputTokenLimit: 65536,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'createCachedContent', 'batchGenerateContent'],
        tier: 'premium'
      },
      {
        id: 'gemini-2.5-flash',
        object: 'model',
        created: Date.now() / 1000,
        ownedBy: 'google',
        type: 'gemini',
        version: '001',
        displayName: 'Gemini 2.5 Flash',
        description: '快速响应的多模态模型',
        inputTokenLimit: 1048576,
        outputTokenLimit: 65536,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'createCachedContent', 'batchGenerateContent'],
        tier: 'standard'
      }
    ]
  }
}

// ============= API供应商模型配置 =============

/**
 * API密钥供应商支持的模型
 * 这些模型通过API密钥直接访问
 */
export const API_PROVIDER_MODELS: Record<string, ProviderModels> = {
  anthropic: {
    provider: 'anthropic',
    displayName: 'Anthropic',
    models: CLAUDE_MODELS
  },
  
  openai: {
    provider: 'openai',
    displayName: 'OpenAI',
    models: OPENAI_MODELS
  },
  
  google: {
    provider: 'google',
    displayName: 'Google AI',
    models: GEMINI_MODELS
  }
}

// ============= 工具函数 =============

/**
 * 获取OAuth供应商的模型列表
 */
export function getOAuthProviderModels(providerType: string): ModelDefinition[] {
  return OAUTH_PROVIDER_MODELS[providerType]?.models || []
}

/**
 * 获取API供应商的模型列表
 */
export function getApiProviderModels(providerType: string): ModelDefinition[] {
  return API_PROVIDER_MODELS[providerType]?.models || []
}

/**
 * 根据模型ID查找模型定义
 */
export function getModelDefinition(providerType: string, modelId: string, isOAuth: boolean = false): ModelDefinition | undefined {
  const models = isOAuth 
    ? getOAuthProviderModels(providerType)
    : getApiProviderModels(providerType)
  
  return models.find(m => m.id === modelId)
}

/**
 * 获取所有支持的供应商类型
 */
export function getSupportedProviderTypes(): string[] {
  return [
    ...Object.keys(API_PROVIDER_MODELS),
    ...Object.keys(OAUTH_PROVIDER_MODELS)
  ]
}

/**
 * 判断供应商是否为OAuth类型
 */
export function isOAuthProvider(providerType: string): boolean {
  return providerType in OAUTH_PROVIDER_MODELS
}

/**
 * 获取供应商显示名称
 */
export function getProviderDisplayName(providerType: string, isOAuth: boolean = false): string {
  if (isOAuth) {
    return OAUTH_PROVIDER_MODELS[providerType]?.displayName || providerType
  }
  return API_PROVIDER_MODELS[providerType]?.displayName || providerType
}