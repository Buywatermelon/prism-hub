'use client'

import { useState, ReactNode, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Brain, Globe, Shield } from 'lucide-react'
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
import { createCredential, updateCredential } from '../actions'
import { Credential } from '../types'
import { OAuthFlowDialog } from './oauth-flow-dialog'

interface AddCredentialDialogProps {
  workspaceId: string
  providerId: string
  providerName: string
  providerConfig?: any // provider的config字段
  onCredentialAdded?: (credential: Credential) => void
  onCredentialUpdated?: (credential: Credential) => void
  trigger?: ReactNode
  editCredential?: Credential | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddCredentialDialog({ 
  workspaceId,
  providerId,
  providerName,
  providerConfig,
  onCredentialAdded,
  onCredentialUpdated,
  trigger,
  editCredential,
  open: controlledOpen,
  onOpenChange
}: AddCredentialDialogProps) {
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOAuthDialog, setShowOAuthDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    credential_type: 'api_key' as 'api_key' | 'oauth_account',
    api_key: ''
  })
  
  // 检查是否是内置提供商（内置提供商只支持OAuth）
  const isBuiltinProvider = providerConfig?.builtin === true

  // 编辑模式时填充表单
  useEffect(() => {
    if (editCredential) {
      setFormData({
        name: editCredential.name,
        credential_type: editCredential.credential_type as 'api_key' | 'oauth_account',
        api_key: '' // 安全起见，不显示原始密钥
      })
    } else {
      // 重置表单，根据供应商类型设置默认值
      const defaultName = isBuiltinProvider ? `${providerName} OAuth` : `${providerName} API Key`
      setFormData({
        name: defaultName,
        credential_type: isBuiltinProvider ? 'oauth_account' : 'api_key',
        api_key: ''
      })
    }
  }, [editCredential, isBuiltinProvider, providerName])

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: '错误',
        description: '请输入凭证名称',
        variant: 'destructive',
      })
      return
    }

    if (formData.credential_type === 'api_key' && !editCredential && !formData.api_key.trim()) {
      toast({
        title: '错误',
        description: '请输入API密钥',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (editCredential) {
        // 更新模式
        const updates: Record<string, unknown> = {
          name: formData.name,
          credential_type: formData.credential_type,
          status: editCredential.status,
          config: editCredential.config || {},
        }

        // 只有在输入新密钥时才更新
        if (formData.credential_type === 'api_key' && formData.api_key) {
          updates.encrypted_key = formData.api_key
        }

        // OAuth 数据不需要更新，由 OAuth 流程管理

        const result = await updateCredential(editCredential.id, updates)

        if (result.success) {
          toast({
            title: '更新成功',
            description: `凭证 ${result.data.name} 已更新`,
          })
          // 直接使用返回的数据，actions已经处理好了api_key字段
          onCredentialUpdated?.(result.data as Credential)
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
        const result = await createCredential(
          workspaceId,
          providerId,
          {
            name: formData.name,
            credential_type: formData.credential_type,
            encrypted_key: formData.credential_type === 'api_key' ? formData.api_key : null,
            key_hint: null,
            oauth_data: null, // OAuth 数据由 OAuth 流程设置
            status: 'active',
            config: {},
            created_by: null,
          }
        )

        if (result.success) {
          toast({
            title: '创建成功',
            description: `凭证 ${result.data.name} 已添加`,
          })
          // 直接使用返回的数据，actions已经处理好了api_key字段
          onCredentialAdded?.(result.data as Credential)
          setOpen(false)
          // 重置表单
          const defaultName = `${providerName} API Key`
          setFormData({
            name: defaultName,
            credential_type: 'api_key',
            api_key: ''
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


  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            添加凭证
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editCredential ? '编辑' : '添加'}认证凭证</DialogTitle>
            <DialogDescription>
              {editCredential ? `更新 ${providerName} 的凭证信息` : `为 ${providerName} 添加新的认证凭证`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Provider</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    <Brain className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{providerName}</span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="credential-name">
                凭证名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="credential-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如: Production API Key"
                required
              />
            </div>
            
            {/* 根据供应商类型显示不同的凭证输入 */}
            {isBuiltinProvider ? (
              // 内置供应商: OAuth授权
              <div className="grid gap-2">
                <Label>凭证类型</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Shield className="h-4 w-4" />
                  <span>OAuth 授权</span>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">OAuth 2.0 授权</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      点击下方按钮开始 OAuth 授权流程，将跳转到 {providerName} 进行授权
                    </p>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowOAuthDialog(true)
                        setOpen(false)
                      }}
                      className="w-full"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      开始 OAuth 授权
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    授权后将自动创建凭证
                  </p>
                </div>
              </div>
            ) : (
              // 用户添加的供应商: API密钥
              <div className="grid gap-2">
                <Label htmlFor="api-key">
                  API 密钥 {!editCredential && <span className="text-destructive">*</span>}
                </Label>
                <PasswordInput
                  id="api-key"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder={editCredential ? '留空保持不变' : 'sk-...'}
                  required={!editCredential}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  密钥将以明文形式存储（请确保数据库安全）
                  {editCredential && '，留空表示不更改当前密钥'}
                </p>
              </div>
            )}
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
            {!isBuiltinProvider && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (editCredential ? '更新中...' : '添加中...') : 
                 (editCredential ? '更新凭证' : '添加凭证')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    {/* OAuth 授权对话框 - 内置供应商都支持OAuth */}
    {isBuiltinProvider && (
      <OAuthFlowDialog
        providerId={providerId}
        providerName={providerName}
        workspaceId={workspaceId}
        open={showOAuthDialog}
        onOpenChange={setShowOAuthDialog}
        onSuccess={(credential) => {
          onCredentialAdded?.(credential)
          setShowOAuthDialog(false)
        }}
      />
    )}
    </>
  )
}