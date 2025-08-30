'use client'

import { useState } from 'react'
import { Key, Globe, Eye, EyeOff, Copy, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteCredential } from '../actions'
import { Database } from '@/types/database.types'

type Credential = Database['public']['Tables']['provider_credentials']['Row'] & {
  encrypted_key?: never
  key_hint: string
}

interface CredentialCardProps {
  credential: Credential
  onDeleted: () => void
}

export function CredentialCard({ credential, onDeleted }: CredentialCardProps) {
  const [showKey, setShowKey] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  // 处理复制
  const handleCopy = async () => {
    try {
      // 实际应该复制真实的密钥，这里暂时复制提示信息
      await navigator.clipboard.writeText(credential.key_hint || '***')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 处理删除
  const handleDelete = async () => {
    if (!confirm(`确定要删除凭证 "${credential.name}" 吗？此操作不可恢复。`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteCredential(credential.id)
      if (result.error) {
        alert(result.error)
      } else {
        onDeleted()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // 获取凭证类型图标
  const getCredentialIcon = () => {
    return credential.credential_type === 'api_key' ? (
      <Key className="h-4 w-4 text-primary" />
    ) : (
      <Globe className="h-4 w-4 text-green-600" />
    )
  }

  // 获取凭证类型标签
  const getCredentialTypeLabel = () => {
    return credential.credential_type === 'api_key' ? 'API密钥' : 'OAuth令牌'
  }

  // 获取状态图标
  const getStatusIcon = () => {
    if (credential.status === 'active') {
      return <CheckCircle className="h-3 w-3 text-green-500" />
    } else if (credential.status === 'expired') {
      return <XCircle className="h-3 w-3 text-red-500" />
    } else {
      return <XCircle className="h-3 w-3 text-yellow-500" />
    }
  }

  // 获取状态标签
  const getStatusLabel = () => {
    switch (credential.status) {
      case 'active':
        return '活跃'
      case 'expired':
        return '已过期'
      case 'rate_limited':
        return '限流中'
      default:
        return '未知'
    }
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getCredentialIcon()}
            <div>
              <h4 className="font-medium">{credential.name}</h4>
              <p className="text-sm text-muted-foreground">
                {getCredentialTypeLabel()} • 创建于 {new Date(credential.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {showKey ? credential.key_hint : '••••••••'}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="h-8 w-8 p-0"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {getStatusIcon()}
                  {getStatusLabel()}
                </span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑凭证
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制凭证
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除凭证
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}