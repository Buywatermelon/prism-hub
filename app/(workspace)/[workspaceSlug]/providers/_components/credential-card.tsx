'use client'

import { useState } from 'react'
import { Key, Globe, Eye, EyeOff, Copy, Trash2, CheckCircle, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { deleteCredential } from '../actions'
import { Credential } from '../types'

interface CredentialCardProps {
  credential: Credential
  onDeleted: () => void
}

export function CredentialCard({ credential, onDeleted }: CredentialCardProps) {
  const [showKey, setShowKey] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // 处理复制
  const handleCopy = async () => {
    try {
      let textToCopy = ''
      
      if (credential.credential_type === 'oauth_account' && credential.oauth_data) {
        // 对于OAuth，复制完整的JSON数据
        const oauth = credential.oauth_data as Record<string, any>
        const oauthData = {
          access_token: oauth.access_token || credential.api_key,
          refresh_token: oauth.refresh_token,
          token_type: oauth.token_type || 'Bearer',
          expires_at: oauth.expires_at,
          scopes: oauth.scopes,
          email: oauth.email,
          // 包含provider特定的数据
          ...(oauth.id_token && { id_token: oauth.id_token }),
          ...(oauth.account_id && { account_id: oauth.account_id })
        }
        textToCopy = JSON.stringify(oauthData, null, 2)
      } else {
        // 对于API密钥，只复制密钥本身
        textToCopy = credential.api_key || credential.key_hint || '***'
      }
      
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 处理删除
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCredential(credential.id)
      if (result.error) {
        console.error('Delete error:', result.error)
      } else {
        onDeleted()
        setIsDeleteDialogOpen(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // 获取凭证类型图标
  const getCredentialIcon = () => {
    return credential.credential_type === 'api_key' ? (
      <Key className="h-4 w-4 text-blue-600" />
    ) : (
      <Globe className="h-4 w-4 text-blue-600" />
    )
  }

  // 获取凭证类型标签
  const getCredentialTypeLabel = () => {
    return credential.credential_type === 'api_key' ? 'API密钥' : 'OAuth令牌'
  }


  return (
    <>
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className={`${credential.credential_type === 'oauth_account' && showKey ? 'space-y-4' : 'flex items-center justify-between'}`}>
            <div className="flex items-center gap-3">
              {getCredentialIcon()}
              <div>
                <h4 className="font-medium">{credential.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {getCredentialTypeLabel()} • 创建于 {new Date(credential.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  最后使用: {credential.last_used_at 
                    ? new Date(credential.last_used_at).toLocaleDateString() 
                    : '暂无记录'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 密钥显示 - OAuth token 特殊处理 */}
              {credential.credential_type === 'oauth_account' ? (
                <div className="flex-1">
                  {showKey ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Access Token:</span>
                        <Badge variant="secondary" className="text-xs">
                          {(credential.oauth_data as any)?.access_token ? 
                            `${(credential.oauth_data as any).access_token.substring(0, 20)}...` : 
                            (credential.api_key ? `${credential.api_key.substring(0, 20)}...` : 'N/A')}
                        </Badge>
                      </div>
                      {(credential.oauth_data as any)?.refresh_token && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Refresh Token:</span>
                          <Badge variant="secondary" className="text-xs">
                            {(credential.oauth_data as any).refresh_token.substring(0, 20)}...
                          </Badge>
                        </div>
                      )}
                      {(credential.oauth_data as any)?.expires_at && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">过期时间:</span>
                          <span className="text-xs">
                            {new Date((credential.oauth_data as any).expires_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {(credential.oauth_data as any)?.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">关联邮箱:</span>
                          <span className="text-xs">{(credential.oauth_data as any).email}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        OAuth 已授权
                      </Badge>
                      {(credential.oauth_data as any)?.email && (
                        <span className="text-xs text-muted-foreground">
                          {(credential.oauth_data as any).email}
                        </span>
                      )}
                      {(credential.oauth_data as any)?.expires_at && 
                       new Date((credential.oauth_data as any).expires_at) < new Date() && (
                        <Badge variant="destructive" className="text-xs">
                          已过期
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {showKey && credential.api_key 
                    ? credential.api_key 
                    : credential.key_hint || '••••••••'}
                </code>
              )}
              
              {/* 操作按钮 - 水平排列 */}
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
                title={credential.credential_type === 'oauth_account' ? '复制 OAuth JSON' : '复制 API 密钥'}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除凭证</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除凭证 &ldquo;{credential.name}&rdquo; 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}