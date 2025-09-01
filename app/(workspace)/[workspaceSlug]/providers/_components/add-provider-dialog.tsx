'use client'

import { useState, ReactNode, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { createProvider, updateProvider } from '../actions'
import { Database } from '@/types/database.types'

type Provider = Database['public']['Tables']['providers']['Row']

interface AddProviderDialogProps {
  workspaceId: string
  onProviderAdded?: (provider: Provider) => void
  onProviderUpdated?: (provider: Provider) => void
  trigger?: ReactNode
  editProvider?: Provider | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddProviderDialog({ 
  workspaceId, 
  onProviderAdded,
  onProviderUpdated,
  trigger,
  editProvider,
  open: controlledOpen,
  onOpenChange
}: AddProviderDialogProps) {
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'openai' as 'openai' | 'claude' | 'gemini',
    endpoint: '',
    description: '',
    models: '',
  })

  // 编辑模式时填充表单
  useEffect(() => {
    if (editProvider) {
      setFormData({
        name: editProvider.name,
        type: editProvider.type as 'openai' | 'claude' | 'gemini',
        endpoint: editProvider.endpoint || '',
        description: editProvider.description || '',
        models: Array.isArray(editProvider.models) ? editProvider.models.join('\n') : '',
      })
    } else {
      // 重置表单
      setFormData({
        name: '',
        type: 'openai',
        endpoint: '',
        description: '',
        models: '',
      })
    }
  }, [editProvider])

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.endpoint.trim()) {
      toast({
        title: '错误',
        description: '请填写必填字段',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // 处理模型列表
      const models = formData.models
        .split('\n')
        .map(m => m.trim())
        .filter(Boolean)

      if (editProvider) {
        // 更新模式
        const result = await updateProvider(editProvider.id, {
          name: formData.name,
          type: formData.type,
          endpoint: formData.endpoint,
          description: formData.description,
          models: models,
          config: editProvider.config || {},
        })

        if (result.success) {
          toast({
            title: '更新成功',
            description: `供应商 ${result.data.name} 已更新`,
          })
          onProviderUpdated?.(result.data)
          setOpen(false)
        } else {
          toast({
            title: '更新失败',
            description: result.error.message,
            variant: 'destructive',
          })
        }
      } else {
        // 创建模式
        const result = await createProvider(workspaceId, {
          name: formData.name,
          type: formData.type,
          endpoint: formData.endpoint,
          description: formData.description,
          models: models,
          config: {},
          icon: null,
          created_by: null,
        })

        if (result.success) {
          toast({
            title: '创建成功',
            description: `供应商 ${result.data.name} 已添加`,
          })
          onProviderAdded?.(result.data)
          setOpen(false)
          // 重置表单
          setFormData({
            name: '',
            type: 'openai',
            endpoint: '',
            description: '',
            models: '',
          })
        } else {
          toast({
            title: '创建失败',
            description: result.error.message,
            variant: 'destructive',
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 根据类型自动填充端点
  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type: type as 'openai' | 'claude' | 'gemini' }))
    
    // 自动填充常见端点
    switch (type) {
      case 'openai':
        if (!formData.endpoint) {
          setFormData(prev => ({ ...prev, endpoint: 'https://api.openai.com/v1' }))
        }
        break
      case 'claude':
        if (!formData.endpoint) {
          setFormData(prev => ({ ...prev, endpoint: 'https://api.anthropic.com/v1' }))
        }
        break
      case 'gemini':
        if (!formData.endpoint) {
          setFormData(prev => ({ ...prev, endpoint: 'https://generativelanguage.googleapis.com/v1' }))
        }
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && trigger !== undefined && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editProvider ? '编辑' : '添加'}LLM Provider</DialogTitle>
            <DialogDescription>
              {editProvider ? '更新供应商配置信息' : '配置新的AI服务提供商信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Provider名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如: OpenAI, Claude, 硅基流动"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">
                API类型 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (兼容)</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="endpoint">
                API端点 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://api.example.com/v1"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简要描述这个Provider的用途"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="models">
                支持的模型
                <span className="text-xs text-muted-foreground ml-2">
                  (每行一个模型名称)
                </span>
              </Label>
              <Textarea
                id="models"
                value={formData.models}
                onChange={(e) => setFormData(prev => ({ ...prev, models: e.target.value }))}
                placeholder="gpt-4&#10;gpt-3.5-turbo&#10;text-embedding-ada-002"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (editProvider ? '更新中...' : '添加中...') : 
               (editProvider ? '更新Provider' : '添加Provider')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}