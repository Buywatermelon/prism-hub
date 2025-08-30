import { toast } from '@/components/ui/use-toast'
import { getErrorMessage } from '@/lib/errors'

/**
 * 处理 Server Action 错误的客户端辅助函数
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