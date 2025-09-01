'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ShieldAlert, AlertCircle, FileQuestion, XCircle, DatabaseIcon } from 'lucide-react'
import type { ErrorCode } from '@/lib/result'

interface ErrorProps {
  error: Error & { digest?: string; code?: ErrorCode; details?: unknown }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 可以在这里记录错误到错误跟踪服务
    console.error('Error caught by error boundary:', error)
  }, [error])

  const getErrorInfo = () => {
    // 优先处理来自 unwrap 的错误 (带有 code 属性)
    if (error.code) {
      switch (error.code as ErrorCode) {
        case 'AUTH_REQUIRED':
        case 'AUTH_FAILED':
          return {
            icon: <ShieldAlert className="h-8 w-8 text-red-500" />,
            title: '需要登录',
            message: error.message || '请先登录后再继续操作',
            showRetry: false,
            showLogin: true
          }
        
        case 'PERMISSION_DENIED':
          return {
            icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
            title: '权限不足',
            message: error.message || '您没有权限执行此操作',
            showRetry: false,
            showLogin: false
          }
        
        case 'VALIDATION_ERROR':
          return {
            icon: <AlertCircle className="h-8 w-8 text-orange-500" />,
            title: '输入错误',
            message: error.message || '请检查您的输入内容',
            showRetry: true,
            showLogin: false
          }
        
        case 'NOT_FOUND':
          return {
            icon: <FileQuestion className="h-8 w-8 text-gray-500" />,
            title: '未找到资源',
            message: error.message || '请求的资源不存在',
            showRetry: false,
            showLogin: false
          }
        
        case 'BUSINESS_ERROR':
        case 'DUPLICATE_ENTRY':
          return {
            icon: <XCircle className="h-8 w-8 text-red-500" />,
            title: '操作失败',
            message: error.message || '业务操作失败',
            showRetry: true,
            showLogin: false
          }
        
        case 'DATABASE_ERROR':
        case 'INTERNAL_ERROR':
          return {
            icon: <DatabaseIcon className="h-8 w-8 text-red-500" />,
            title: '系统错误',
            message: error.message || '系统错误，请稍后重试',
            showRetry: true,
            showLogin: false
          }
        
        default:
          return {
            icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
            title: '发生错误',
            message: error.message || '发生了意外错误',
            showRetry: true,
            showLogin: false
          }
      }
    }
    
    // 处理其他未预期的错误（没有 code 属性的）
    return {
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      title: '发生错误',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : '抱歉，发生了意外错误',
      showRetry: true,
      showLogin: false
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">{errorInfo.icon}</div>
        <h2 className="mb-2 text-2xl font-semibold">{errorInfo.title}</h2>
        <p className="mb-6 text-muted-foreground">{errorInfo.message}</p>
        
        <div className="flex gap-3 justify-center">
          {errorInfo.showRetry && (
            <Button onClick={reset}>重试</Button>
          )}
          {errorInfo.showLogin && (
            <Button onClick={() => window.location.href = '/login'}>
              去登录
            </Button>
          )}
          {!errorInfo.showRetry && !errorInfo.showLogin && (
            <Button variant="outline" onClick={() => window.history.back()}>
              返回
            </Button>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}