/**
 * Next.js App Router 错误处理最佳实践
 * 
 * 在 Server Components 和 Server Actions 中使用这些错误类
 * Next.js 会自动捕获并在 error.tsx 中处理
 */

/**
 * 认证错误 - 用户未登录
 */
export class AuthenticationError extends Error {
  constructor(message = '请先登录') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * 授权错误 - 用户无权限
 */
export class AuthorizationError extends Error {
  constructor(message = '权限不足') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * 验证错误 - 请求参数无效
 */
export class ValidationError extends Error {
  constructor(message = '请求参数无效', public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends Error {
  constructor(message = '资源不存在') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'BusinessError'
  }
}

/**
 * 数据库错误包装
 */
export class DatabaseError extends Error {
  constructor(message = '数据库操作失败', public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Server Action 错误处理辅助函数
 * 将错误转换为用户友好的消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return error.message
  }
  
  if (error instanceof AuthorizationError) {
    return error.message
  }
  
  if (error instanceof ValidationError) {
    return error.message
  }
  
  if (error instanceof NotFoundError) {
    return error.message
  }
  
  if (error instanceof BusinessError) {
    return error.message
  }
  
  if (error instanceof DatabaseError) {
    return '数据库操作失败，请稍后重试'
  }
  
  if (error instanceof Error) {
    // 开发环境显示详细错误，生产环境显示通用消息
    if (process.env.NODE_ENV === 'development') {
      return error.message
    }
    return '操作失败，请稍后重试'
  }
  
  return '未知错误'
}