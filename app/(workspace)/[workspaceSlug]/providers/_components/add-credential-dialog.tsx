'use client'

import { useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Brain } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createCredential } from '../actions'
import { Database } from '@/types/database.types'

type Credential = Database['public']['Tables']['provider_credentials']['Row'] & {
  encrypted_key?: never
  key_hint: string
}

interface AddCredentialDialogProps {
  workspaceId: string
  providerId: string
  providerName: string
  onCredentialAdded: (credential: Credential) => void
  trigger?: ReactNode
}

export function AddCredentialDialog({ 
  workspaceId,
  providerId,
  providerName,
  onCredentialAdded,
  trigger 
}: AddCredentialDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    credential_type: 'api_key' as 'api_key' | 'oauth_account',
    api_key: '',
  })

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('请输入凭证名称')
      return
    }

    if (formData.credential_type === 'api_key' && !formData.api_key.trim()) {
      alert('请输入API密钥')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createCredential(
        workspaceId,
        providerId,
        {
          name: formData.name,
          credential_type: formData.credential_type,
          encrypted_key: formData.credential_type === 'api_key' ? formData.api_key : null,
          key_hint: null,
          oauth_data: formData.credential_type === 'oauth_account' ? {} : null,
          status: 'active',
          config: {},
          created_by: null,
        }
      )

      if (result.error) {
        alert(result.error)
      } else if (result.data) {
        // 添加计算的 key_hint 以匹配类型
        const credential: Credential = {
          ...result.data,
          encrypted_key: undefined,
          key_hint: result.data.key_hint || maskApiKey(formData.api_key)
        }
        onCredentialAdded(credential)
        setOpen(false)
        // 重置表单
        setFormData({
          name: '',
          credential_type: 'api_key',
          api_key: '',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 掩码 API 密钥
  function maskApiKey(key: string | null): string {
    if (!key || key.length < 8) return '***'
    const prefix = key.substring(0, 3)
    const suffix = key.substring(key.length - 4)
    return `${prefix}...${suffix}`
  }

  return (
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
            <DialogTitle>添加认证凭证</DialogTitle>
            <DialogDescription>
              为 {providerName} 添加新的认证凭证
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
            
            <div className="grid gap-2">
              <Label htmlFor="credential-type">
                凭证类型 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.credential_type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  credential_type: value as 'api_key' | 'oauth_account' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API 密钥</SelectItem>
                  <SelectItem value="oauth_account" disabled>
                    OAuth 令牌 (暂不支持)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.credential_type === 'api_key' && (
              <div className="grid gap-2">
                <Label htmlFor="api-key">
                  API 密钥 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="sk-..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  密钥将被安全加密存储
                </p>
              </div>
            )}
            
            {formData.credential_type === 'oauth_account' && (
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground">
                  OAuth 认证流程暂不支持，请使用 API 密钥方式
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
            <Button 
              type="submit" 
              disabled={isSubmitting || formData.credential_type === 'oauth_account'}
            >
              {isSubmitting ? '添加中...' : '添加凭证'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}