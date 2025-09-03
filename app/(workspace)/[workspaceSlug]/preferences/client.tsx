'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cpu, Plus, ChevronUp, ChevronDown, X, Lock, Unlock, Key, AlertCircle, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAbility } from '@/hooks'
import type { WorkspaceMembership } from '@/lib/data/workspace'
import type { ModelInfo, ModelId, PreferencesResponse, ScenarioType } from '@/types/preferences.types'
import { saveScenarioPreferences, resetMemberPreferences } from '@/app/actions/model-preferences'
import { getUserApiKeys, createApiKey, updateApiKey, deleteApiKey, type ApiKey, type ApiKeyScopes } from '@/app/actions/api-keys'

// 小组件
const Dot = ({ color = "bg-emerald-500" }: { color?: string }) => (
  <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
)

const Section = ({ 
  title, 
  desc, 
  children, 
  right 
}: { 
  title: string
  desc?: React.ReactNode
  children: React.ReactNode
  right?: React.ReactNode
}) => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {desc && <CardDescription className="mt-1">{desc}</CardDescription>}
        </div>
        {right}
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

// 场景定义
const SCENARIOS = [
  { id: 'code' as ScenarioType, name: '编程', icon: '💻' },
  { id: 'api' as ScenarioType, name: 'API调用', icon: '🔌' },
]

interface PreferencesClientProps {
  workspace: WorkspaceMembership
  availableModels: ModelInfo[]
  codePreferences: PreferencesResponse
  apiPreferences: PreferencesResponse
  userId: string
  initialApiKeys: ApiKey[]
}

export default function PreferencesClient({
  workspace,
  availableModels,
  codePreferences,
  apiPreferences,
  userId,
  initialApiKeys
}: PreferencesClientProps) {
  const ability = useAbility()
  const { toast } = useToast()
  const isAdmin = ability?.can('update', 'Settings')

  // 状态管理
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('code')
  const [scope, setScope] = useState<'member' | 'workspace'>('member')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [wsLocked, setWsLocked] = useState(true) // 工作空间编辑锁定状态
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [banner, setBanner] = useState('')
  
  // API Key 状态
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyCreated, setNewKeyCreated] = useState<{ key: string; description: string } | null>(null)
  
  // 获取当前场景的 API Keys
  const currentScenarioKeys = apiKeys.filter(key => key.scopes.scenario === activeScenario)

  // 模型优先级状态
  const [codeModels, setCodeModels] = useState<ModelId[]>(codePreferences.preferences.code)
  const [apiModels, setApiModels] = useState<ModelId[]>(apiPreferences.preferences.api)
  
  // 初始状态（用于检测变化）
  const [initialCodeModels, setInitialCodeModels] = useState<ModelId[]>(codePreferences.preferences.code)
  const [initialApiModels, setInitialApiModels] = useState<ModelId[]>(apiPreferences.preferences.api)

  // 当前场景的模型列表
  const currentModels = activeScenario === 'code' ? codeModels : apiModels
  const setCurrentModels = activeScenario === 'code' ? setCodeModels : setApiModels
  const currentSource = activeScenario === 'code' ? codePreferences.source : apiPreferences.source

  // 检测是否有未保存的更改
  useEffect(() => {
    const codeChanged = JSON.stringify(codeModels) !== JSON.stringify(initialCodeModels)
    const apiChanged = JSON.stringify(apiModels) !== JSON.stringify(initialApiModels)
    setHasUnsavedChanges(codeChanged || apiChanged)
  }, [codeModels, apiModels, initialCodeModels, initialApiModels])

  // 获取可添加的模型（未在当前列表中的）
  const availableToAdd = availableModels.filter(
    model => !currentModels.includes(model.id)
  )

  // 获取当前列表中的模型详情
  const currentModelDetails = currentModels
    .map(id => availableModels.find(m => m.id === id))
    .filter(Boolean) as ModelInfo[]

  // 检查当前是否为继承状态
  const inherited = scope === 'member' && currentSource !== 'member'

  // 移动模型位置
  const moveModel = useCallback((index: number, direction: 'up' | 'down') => {
    if (scope === 'workspace' && wsLocked) {
      setBanner('工作空间规则已锁定，解锁后才能修改。')
      return
    }
    
    const newModels = [...currentModels]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newModels.length) {
      [newModels[index], newModels[targetIndex]] = [newModels[targetIndex], newModels[index]]
      setCurrentModels(newModels)
    }
  }, [currentModels, setCurrentModels, scope, wsLocked])

  // 移除模型
  const removeModel = useCallback((index: number) => {
    if (scope === 'workspace' && wsLocked) {
      setBanner('工作空间规则已锁定，解锁后才能修改。')
      return
    }
    
    const newModels = currentModels.filter((_, i) => i !== index)
    setCurrentModels(newModels)
  }, [currentModels, setCurrentModels, scope, wsLocked])

  // 添加模型
  const addModel = useCallback((modelId: ModelId) => {
    if (scope === 'workspace' && wsLocked) {
      setBanner('工作空间规则已锁定，解锁后才能修改。')
      return
    }
    
    if (!currentModels.includes(modelId)) {
      setCurrentModels([...currentModels, modelId])
    }
  }, [currentModels, setCurrentModels, scope, wsLocked])

  // 保存偏好
  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // 保存code场景
      if (JSON.stringify(codeModels) !== JSON.stringify(initialCodeModels)) {
        const result = await saveScenarioPreferences(
          workspace.workspace.id,
          'code',
          codeModels,
          scope,
          scope === 'member' ? userId : undefined
        )
        
        if (!result.success) {
          throw new Error(result.error.message)
        }
      }

      // 保存api场景
      if (JSON.stringify(apiModels) !== JSON.stringify(initialApiModels)) {
        const result = await saveScenarioPreferences(
          workspace.workspace.id,
          'api',
          apiModels,
          scope,
          scope === 'member' ? userId : undefined
        )
        
        if (!result.success) {
          throw new Error(result.error.message)
        }
      }

      // 更新初始状态
      setInitialCodeModels(codeModels)
      setInitialApiModels(apiModels)
      setHasUnsavedChanges(false)
      
      toast({ description: '模型偏好已保存' })
    } catch (error: any) {
      toast({ 
        title: '保存失败', 
        description: error.message, 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 清除成员覆盖
  const clearOverride = async () => {
    if (scope !== 'member') return
    
    setIsLoading(true)
    try {
      const result = await resetMemberPreferences(
        workspace.workspace.id,
        userId,
        activeScenario
      )
      
      if (!result.success) {
        throw new Error(result.error.message)
      }

      // 清空当前场景的成员偏好
      if (activeScenario === 'code') {
        setCodeModels([])
        setInitialCodeModels([])
      } else {
        setApiModels([])
        setInitialApiModels([])
      }
      setHasUnsavedChanges(false)
      
      toast({ description: '已清除成员覆盖，使用工作空间默认设置' })
    } catch (error: any) {
      toast({ 
        title: '重置失败', 
        description: error.message, 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 切换作用域
  const onScopeChange = (newScope: 'member' | 'workspace') => {
    if (newScope === 'workspace' && !isAdmin) return
    setScope(newScope)
    if (newScope === 'workspace') {
      setBanner('您正在查看工作空间默认优先级。修改前需解锁编辑。')
    } else {
      setBanner('')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶栏 */}
      <div className="flex-shrink-0 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cpu className="h-6 w-6" />
              模型偏好
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              配置不同场景的AI模型优先级和管理API访问密钥
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="secondary">有未保存的更改</Badge>
            )}
            
            {isAdmin && (
              <ScopeSwitch scope={scope} setScope={onScopeChange} />
            )}
            
            <Button 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges || isLoading}
            >
              {isLoading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
        
        {banner && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{banner}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* 左：场景 */}
        <aside className="col-span-12 lg:col-span-3">
          <Section 
            title="场景" 
            desc="为不同场景设置优先级"
          >
            <nav className="flex flex-col gap-1">
              {SCENARIOS.map((s) => {
                const modelCount = s.id === 'code' ? codeModels.length : apiModels.length
                const hasOverride = scope === 'member' && 
                  ((s.id === 'code' && codePreferences.source === 'member') ||
                   (s.id === 'api' && apiPreferences.source === 'member'))
                
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenario(s.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeScenario === s.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {scope === 'member' && (
                        <Dot color={hasOverride ? "bg-emerald-500" : "bg-gray-300"} />
                      )}
                      <span>{s.icon}</span>
                      {s.name}
                    </span>
                    <span className={`text-xs ${
                      activeScenario === s.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {modelCount} 个模型
                    </span>
                  </button>
                )
              })}
            </nav>
          </Section>
        </aside>

        {/* 右：优先级配置 */}
        <main className="col-span-12 lg:col-span-9 space-y-6 overflow-y-auto">
          <Section
            title={`优先级 · ${SCENARIOS.find(s => s.id === activeScenario)?.name}`}
            desc={
              scope === 'member'
                ? (inherited ? "当前成员未设置，继承自工作空间" : "当前为成员级偏好")
                : wsLocked
                ? "工作空间默认优先级（已锁定）"
                : "工作空间默认优先级（可编辑）"
            }
            right={
              <div className="flex items-center gap-2">
                {isAdmin && scope === 'workspace' && (
                  wsLocked ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowUnlockDialog(true)}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      解锁编辑
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setWsLocked(true)
                        setBanner('已重新锁定工作空间编辑。')
                      }}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      重新锁定
                    </Button>
                  )
                )}
                
                {scope === 'member' && !inherited && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearOverride}
                  >
                    清除成员覆盖
                  </Button>
                )}
                
                <AddModelDropdown 
                  onAdd={addModel} 
                  available={availableToAdd} 
                />
              </div>
            }
          >
            {currentModelDetails.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无模型配置</p>
                <p className="text-sm mt-1">点击上方"添加模型"开始配置</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {currentModelDetails.map((model, idx) => (
                  <li key={model.id} className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <Dot color={model.available ? "bg-emerald-500" : "bg-rose-500"} />
                        <div className="font-medium">{model.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {model.provider}
                        </Badge>
                        {model.type === 'oauth' && (
                          <Badge variant="secondary" className="text-xs">OAuth</Badge>
                        )}
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveModel(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveModel(idx, 'down')}
                          disabled={idx === currentModelDetails.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModel(idx)}
                        >
                          <X className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          
          {/* API Key 管理 - 仅成员作用域显示 */}
          {scope === 'member' && (
            <Section
              title={`${SCENARIOS.find(s => s.id === activeScenario)?.name}场景 · 访问密钥`}
              desc="这些密钥用于该场景下的 API 调用身份验证"
              right={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewKeyDialog(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  新建密钥
                </Button>
              }
            >
              {currentScenarioKeys.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无访问密钥</p>
                  <p className="text-sm mt-1">点击"新建密钥"创建 API 访问密钥</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {currentScenarioKeys.map((key) => (
                    <ApiKeyCard
                      key={key.id}
                      apiKey={key}
                      onUpdate={async (updates) => {
                        const result = await updateApiKey(
                          workspace.workspace.id,
                          key.id,
                          updates
                        )
                        if (result.success) {
                          setApiKeys(prev => prev.map(k => 
                            k.id === key.id 
                              ? { ...k, ...updates, scopes: { ...k.scopes, ...updates.scopes } }
                              : k
                          ))
                          toast({ description: '密钥已更新' })
                        } else {
                          toast({ 
                            title: '更新失败',
                            description: result.error.message,
                            variant: 'destructive'
                          })
                        }
                      }}
                      onDelete={async () => {
                        const result = await deleteApiKey(
                          workspace.workspace.id,
                          key.id
                        )
                        if (result.success) {
                          setApiKeys(prev => prev.filter(k => k.id !== key.id))
                          toast({ description: '密钥已删除' })
                        } else {
                          toast({ 
                            title: '删除失败',
                            description: result.error.message,
                            variant: 'destructive'
                          })
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}
        </main>
      </div>

      {/* 解锁确认对话框 */}
      {showUnlockDialog && (
        <UnlockDialog
          onCancel={() => setShowUnlockDialog(false)}
          onConfirm={() => {
            setWsLocked(false)
            setShowUnlockDialog(false)
            setBanner('已解锁工作空间编辑。')
          }}
        />
      )}
      
      {/* 新建 API Key 对话框 */}
      {showNewKeyDialog && (
        <NewApiKeyDialog
          scenario={activeScenario}
          onCancel={() => setShowNewKeyDialog(false)}
          onCreate={async (description) => {
            const result = await createApiKey(
              workspace.workspace.id,
              description,
              { scenario: activeScenario },
              90  // 90天过期
            )
            
            if (result.success) {
              setApiKeys(prev => [result.data.apiKey, ...prev])
              setNewKeyCreated({ 
                key: result.data.key, 
                description: result.data.apiKey.description || '未命名密钥' 
              })
              setShowNewKeyDialog(false)
              toast({ description: '密钥创建成功' })
            } else {
              toast({ 
                title: '创建失败',
                description: result.error.message,
                variant: 'destructive'
              })
            }
          }}
        />
      )}
      
      {/* 显示新创建的密钥 */}
      {newKeyCreated && (
        <ShowApiKeyDialog
          apiKey={newKeyCreated.key}
          description={newKeyCreated.description}
          onClose={() => setNewKeyCreated(null)}
        />
      )}
    </div>
  )
}

// 作用域切换组件
function ScopeSwitch({ 
  scope, 
  setScope 
}: { 
  scope: 'member' | 'workspace'
  setScope: (scope: 'member' | 'workspace') => void 
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
      {(['member', 'workspace'] as const).map((s) => (
        <button
          key={s}
          onClick={() => setScope(s)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            scope === s 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s === 'member' ? '成员' : '工作空间'}
        </button>
      ))}
    </div>
  )
}

// 添加模型下拉菜单
function AddModelDropdown({ 
  onAdd, 
  available 
}: { 
  onAdd: (id: ModelId) => void
  available: ModelInfo[] 
}) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <Plus className="h-4 w-4 mr-2" />
        添加模型
      </Button>
      
      {open && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg">
            <div className="max-h-80 divide-y divide-border overflow-auto">
              {available.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">无更多可添加</div>
              ) : (
                available.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onAdd(model.id)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent"
                  >
                    <Dot color={model.available ? "bg-emerald-500" : "bg-rose-500"} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{model.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {model.provider} · {model.type === 'oauth' ? 'OAuth' : 'API'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// API Key 卡片组件
function ApiKeyCard({
  apiKey,
  onUpdate,
  onDelete
}: {
  apiKey: ApiKey
  onUpdate: (updates: { description?: string }) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(apiKey.description || '')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const handleSave = () => {
    onUpdate({ description })
    setIsEditing(false)
  }
  
  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const lastUsed = apiKey.lastUsedAt 
    ? new Date(apiKey.lastUsedAt).toLocaleDateString('zh-CN')
    : '从未使用'
  
  const createdAt = new Date(apiKey.createdAt).toLocaleDateString('zh-CN')
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="密钥描述"
                  className="w-full rounded border px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <div className="font-medium">
                  {apiKey.description || '未命名密钥'}
                </div>
              )}
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-muted-foreground select-none">
                    {showKey 
                      ? apiKey.key 
                      : apiKey.key.length > 20 
                        ? `${apiKey.key.substring(0, 10)}••••••••${apiKey.key.substring(apiKey.key.length - 4)}`
                        : `${apiKey.key.substring(0, 6)}••••`
                    }
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-5 px-2 text-xs"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? '隐藏' : '显示'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-5 px-2 text-xs"
                    onClick={handleCopyKey}
                  >
                    {copied ? '已复制' : '复制密钥'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  创建于 {createdAt} · 最后使用: {lastUsed}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={handleSave}>
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setIsEditing(false)
                    setDescription(apiKey.description || '')
                  }}>
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    编辑
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onDelete}>
                    <X className="h-4 w-4 text-rose-600" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 新建 API Key 对话框
function NewApiKeyDialog({
  scenario,
  onCancel,
  onCreate
}: {
  scenario: string
  onCancel: () => void
  onCreate: (description: string) => void
}) {
  const [description, setDescription] = useState('')
  const scenarioInfo = SCENARIOS.find(s => s.id === scenario)
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="z-10 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-5 shadow-xl">
        <h3 className="text-lg font-semibold">创建新密钥</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          为{scenarioInfo?.icon} {scenarioInfo?.name}场景创建访问密钥
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如: CLI 工具、测试环境"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button size="sm" onClick={() => onCreate(description)}>
            创建密钥
          </Button>
        </div>
      </div>
    </div>
  )
}

// 显示新密钥对话框
function ShowApiKeyDialog({
  apiKey,
  description,
  onClose
}: {
  apiKey: string
  description: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="z-10 w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-5 shadow-xl">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5 text-green-600" />
          密钥创建成功
        </h3>
        
        <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            密钥已创建成功。您可以随时在密钥列表中查看和复制完整密钥。
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">描述</div>
            <div className="text-sm text-muted-foreground">{description || '未命名密钥'}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">API 密钥</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 rounded-lg border bg-gray-50 dark:bg-gray-900 px-3 py-2 font-mono text-xs select-all"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button 
                size="sm" 
                onClick={handleCopy}
                variant={copied ? "default" : "outline"}
              >
                {copied ? '✓ 已复制' : '复制密钥'}
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-xs text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">在您的应用中使用此密钥：</div>
            <code className="block bg-white dark:bg-gray-900 rounded p-2 mt-1">
              Authorization: Bearer {apiKey.substring(0, 20)}...
            </code>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <div className="text-xs text-muted-foreground">
            {copied ? '✓ 密钥已复制到剪贴板' : '密钥已安全保存，可随时查看'}
          </div>
          <Button 
            size="sm" 
            onClick={onClose}
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}

// 解锁确认对话框
function UnlockDialog({ 
  onCancel, 
  onConfirm 
}: { 
  onCancel: () => void
  onConfirm: () => void 
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="z-10 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-5 shadow-xl">
        <h3 className="text-lg font-semibold">解锁工作空间编辑</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p>你将允许在<strong>工作空间层</strong>修改模型优先级，这会影响所有成员的默认路由。</p>
          <p className="mt-1">请确认后继续。</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button size="sm" onClick={onConfirm}>
            确认解锁
          </Button>
        </div>
      </div>
    </div>
  )
}