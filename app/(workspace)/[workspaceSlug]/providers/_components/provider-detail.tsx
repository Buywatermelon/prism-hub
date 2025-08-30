'use client'

import { useState } from 'react'
import { Brain, Key, MoreHorizontal, Plus, Edit, Trash2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CredentialCard } from './credential-card'
import { AddCredentialDialog } from './add-credential-dialog'
import { deleteProvider } from '../actions'
import { Database } from '@/types/database.types'

type Provider = Database['public']['Tables']['providers']['Row']
type Credential = Database['public']['Tables']['provider_credentials']['Row'] & {
  encrypted_key?: never
  key_hint: string
}

interface ProviderDetailProps {
  provider: Provider
  credentials: Credential[]
  workspaceId: string
  onProviderDeleted: (providerId: string) => void
  onCredentialsUpdated: (credentials: Credential[]) => void
}

export function ProviderDetail({
  provider,
  credentials,
  workspaceId,
  onProviderDeleted,
  onCredentialsUpdated,
}: ProviderDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取供应商图标
  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'openai':
        return '🤖'
      case 'claude':
        return '🧠'
      case 'gemini':
        return '✨'
      default:
        return '🔌'
    }
  }

  // 处理删除供应商
  const handleDelete = async () => {
    if (!confirm(`确定要删除供应商 "${provider.name}" 吗？此操作不可恢复。`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteProvider(provider.id)
      if (result.error) {
        alert(result.error)
      } else {
        onProviderDeleted(provider.id)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // 处理凭证添加成功
  const handleCredentialAdded = (newCredential: Credential) => {
    onCredentialsUpdated([newCredential, ...credentials])
  }

  // 处理凭证删除
  const handleCredentialDeleted = (credentialId: string) => {
    onCredentialsUpdated(credentials.filter(c => c.id !== credentialId))
  }

  // 获取模型列表
  const models = Array.isArray(provider.models) ? provider.models : []

  return (
    <div className="space-y-6">
      {/* 供应商详情卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                {provider.icon ? (
                  <AvatarImage src={provider.icon} alt={provider.name} />
                ) : null}
                <AvatarFallback className="text-xl">
                  {getProviderIcon(provider.type)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {provider.name}
                  </h2>
                  <Badge variant="secondary">
                    {provider.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>{provider.endpoint}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑Provider
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || credentials.length > 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除Provider
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {models.length > 0 && (
          <CardContent>
            <div>
              <h4 className="font-medium mb-2">支持的模型</h4>
              <div className="flex flex-wrap gap-2">
                {models.map((model, index) => (
                  <Badge key={index} variant="outline">
                    {String(model)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 凭证列表卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                认证凭证 ({credentials.length})
              </CardTitle>
              <CardDescription>
                管理 {provider.name} 的认证凭证
              </CardDescription>
            </div>
            <AddCredentialDialog
              workspaceId={workspaceId}
              providerId={provider.id}
              providerName={provider.name}
              onCredentialAdded={handleCredentialAdded}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加凭证
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {credentials.length > 0 ? (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onDeleted={() => handleCredentialDeleted(credential.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">暂无认证凭证</p>
              <p className="text-xs mt-1">点击上方按钮添加凭证</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}