import { toast } from '@/components/ui/use-toast'
import { getErrorMessage } from '@/lib/errors'

/**
 * 检查是否是 Next.js 的重定向错误
 */
function isRedirectError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'digest' in error) {
    const digest = (error as any).digest
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
  }
  return false
}

/**
 * 处理 Server Action 错误的客户端辅助函数
 * 
 * 特殊处理：
 * - NEXT_REDIRECT: Next.js 的重定向信号，需要重新抛出
 * - AuthenticationError: 认证错误，延迟后重定向到登录页
 * 
 * @example
 * try {
 *   await updateWorkspace(workspaceId, data)
 *   toast({ description: '更新成功' })
 * } catch (error) {
 *   handleActionError(error)
 * }
 */
export function handleActionError(error: unknown) {
  // 特殊处理：Next.js 的 redirect() 会抛出 NEXT_REDIRECT 错误
  // 这不是真正的错误，而是重定向信号，需要让它继续传播
  if (isRedirectError(error)) {
    throw error
  }
  
  const message = getErrorMessage(error)
  toast({ 
    title: '操作失败',
    description: message, 
    variant: 'destructive' 
  })
  
  // 开发环境输出详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('Action error:', error)
  }
  
  // 如果是认证错误，可以选择重定向到登录页
  if (error instanceof Error && error.name === 'AuthenticationError') {
    // 延迟一下让 toast 显示
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }
}