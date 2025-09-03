'use client'

import { useState } from 'react'
import { Key, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const SCENARIOS = [
  { id: 'code', name: '编程', icon: '💻' },
  { id: 'api', name: 'API调用', icon: '🔌' },
]

// 解锁确认对话框
export function UnlockDialog({ 
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

// 新建 API Key 对话框
export function NewApiKeyDialog({
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
export function ShowApiKeyDialog({
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