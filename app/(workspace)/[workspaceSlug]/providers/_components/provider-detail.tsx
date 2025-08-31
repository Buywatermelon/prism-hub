'use client'

import { useState } from 'react'
import { Key, MoreHorizontal, Plus, Edit, Trash2, Globe, Brain } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CredentialCard } from './credential-card'
import { AddCredentialDialog } from './add-credential-dialog'
import { AddProviderDialog } from './add-provider-dialog'
import { deleteProvider } from '../actions'
import { Provider, Credential } from '../types'

interface ProviderDetailProps {
  provider: Provider
  credentials: Credential[]
  workspaceId: string
  onProviderDeleted: (providerId: string) => void
  onProviderUpdated?: (provider: Provider) => void
  onCredentialsUpdated: (credentials: Credential[]) => void
}

export function ProviderDetail({
  provider,
  credentials,
  workspaceId,
  onProviderDeleted,
  onProviderUpdated,
  onCredentialsUpdated,
}: ProviderDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)


  // 处理删除供应商
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProvider(provider.id)
      if (result.error) {
        alert(result.error)
      } else {
        onProviderDeleted(provider.id)
        setIsDeleteDialogOpen(false)
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
                  <Brain className="h-6 w-6" />
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
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑Provider
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
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
              providerConfig={provider.config}
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

      {/* 编辑Provider对话框 */}
      <AddProviderDialog
        workspaceId={workspaceId}
        editProvider={provider}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        trigger={null}
        onProviderUpdated={(updatedProvider) => {
          onProviderUpdated?.(updatedProvider)
          setIsEditDialogOpen(false)
        }}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除供应商 &ldquo;{provider.name}&rdquo; 吗？
              <span className="block mt-2">
                此操作不可恢复，供应商及其所有凭证将被永久删除。
              </span>
              {credentials.length > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-500">
                  ⚠️ 注意：该供应商下还有 {credentials.length} 个凭证也将被删除。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}