'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Globe, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { generateOAuthURL, exchangeOAuthCode } from '../oauth/actions'

interface OAuthFlowDialogProps {
  providerId: string
  providerName: string
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (credential: any) => void
}

export function OAuthFlowDialog({
  providerId,
  providerName,
  workspaceId,
  open,
  onOpenChange,
  onSuccess
}: OAuthFlowDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // OAuth流程状态
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  const [authState, setAuthState] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [copied, setCopied] = useState(false)
  
  // 生成授权URL
  const handleGenerateAuthUrl = async () => {
    setLoading(true)
    try {
      const result = await generateOAuthURL(providerId, workspaceId)
      
      if ('error' in result) {
        toast({
          title: '生成授权链接失败',
          description: result.error,
          variant: 'destructive'
        })
        return
      }
      
      setAuthUrl(result.url)
      setAuthState(result.state)
      setStep(2)
    } catch (_error) {
      toast({
        title: '生成授权链接失败',
        description: '请重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // 复制授权链接
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(authUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // 在新窗口打开授权页面（自动处理回调）
  const handleOpenAuthWindow = async () => {
    setLoading(true)
    try {
      // 检查是否需要启动本地回调服务器
      const needsLocalServer = authUrl.includes('localhost:1455') || 
                               authUrl.includes('localhost:54545') || 
                               authUrl.includes('localhost:8085')
      
      if (needsLocalServer) {
        // 对于需要特定端口的OAuth，打开窗口并等待用户手动输入
        const authWindow = window.open(authUrl, '_blank', 'width=600,height=700')
        
        // 监听窗口关闭，提示用户输入授权码
        const checkInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkInterval)
            toast({
              title: '请输入授权码',
              description: '请从回调URL中复制授权码（code参数）并粘贴到下方'
            })
            setLoading(false)
          }
        }, 1000)
      } else {
        // 使用标准回调流程
        window.open(authUrl, '_blank', 'width=600,height=700')
        setLoading(false)
      }
    } catch (_error) {
      toast({
        title: '打开授权页面失败',
        description: '请重试',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }
  
  // 交换授权码
  const handleExchangeCode = async () => {
    if (!authCode.trim()) {
      toast({
        title: '请输入授权码',
        variant: 'destructive'
      })
      return
    }
    
    setLoading(true)
    try {
      const result = await exchangeOAuthCode(authCode, authState)
      
      if ('error' in result) {
        toast({
          title: '授权失败',
          description: result.error,
          variant: 'destructive'
        })
        return
      }
      
      setStep(3)
      
      // 成功后延迟关闭对话框
      setTimeout(() => {
        onSuccess?.(result.credential)
        handleClose()
        router.refresh()
      }, 1500)
    } catch (_error) {
      toast({
        title: '授权失败',
        description: '请重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // 关闭对话框时重置状态
  const handleClose = () => {
    setStep(1)
    setAuthUrl('')
    setAuthState('')
    setAuthCode('')
    setCopied(false)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>OAuth 授权</DialogTitle>
          <DialogDescription>
            为 {providerName} 添加 OAuth 凭证
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 步骤指示器 */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s
                      ? step === 3 && s === 3
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step === 3 && s === 3 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    s
                  )}
                </div>
                {s < 3 && (
                  <div
                    className={`w-full h-0.5 transition-colors ${
                      step > s ? 'bg-blue-600' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* 步骤1：生成授权链接 */}
          {step === 1 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  点击下方按钮生成授权链接，然后跳转到 {providerName} 进行授权
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleGenerateAuthUrl}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                生成授权链接
              </Button>
            </div>
          )}
          
          {/* 步骤2：跳转授权并输入授权码 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>授权链接</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={authUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleOpenAuthWindow}
                className="w-full"
              >
                <Globe className="h-4 w-4 mr-2" />
                在新窗口中打开授权页面
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    授权完成后
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auth-code">授权码或回调URL</Label>
                <Input
                  id="auth-code"
                  value={authCode}
                  onChange={(e) => {
                    const value = e.target.value
                    // 检查是否粘贴了完整的回调URL
                    if (value.includes('?code=')) {
                      const url = new URL(value)
                      const code = url.searchParams.get('code')
                      if (code) {
                        setAuthCode(code)
                        toast({
                          title: '已提取授权码',
                          description: '自动从URL中提取了授权码'
                        })
                      }
                    } else {
                      setAuthCode(value)
                    }
                  }}
                  placeholder="粘贴授权码或完整的回调URL"
                />
                <p className="text-xs text-muted-foreground">
                  可以直接粘贴回调URL，系统会自动提取授权码
                </p>
              </div>
              
              <Button
                onClick={handleExchangeCode}
                disabled={!authCode.trim() || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  '交换访问令牌'
                )}
              </Button>
            </div>
          )}
          
          {/* 步骤3：授权成功 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-lg">OAuth 授权成功！</h3>
                  <p className="text-sm text-muted-foreground">
                    已成功获取访问令牌并保存凭证
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  凭证已保存
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        {step !== 3 && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}