/**
 * Result 模式 - 类型安全的错误处理
 * 
 * 代替 try-catch 和抛出异常，使用明确的成功/失败返回值
 * 让错误处理成为正常的控制流，而非异常流
 */

/**
 * 基础 Result 类型
 * @template T - 成功时的数据类型
 * @template E - 失败时的错误类型
 */
export type Result<T = void, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * 带重定向的 Result 类型
 * 用于需要跳转的 Server Actions
 */
export type ResultWithRedirect<T = void, E = Error> = 
  | { success: true; data: T; redirectTo?: string }
  | { success: false; error: E }

/**
 * 标准错误代码
 */
export type ErrorCode = 
  // 认证相关
  | 'AUTH_FAILED'           // 认证失败（用户名密码错误）
  | 'AUTH_REQUIRED'         // 需要登录
  | 'EMAIL_NOT_VERIFIED'    // 邮箱未验证
  | 'SESSION_EXPIRED'       // 会话过期
  // 授权相关
  | 'PERMISSION_DENIED'     // 权限不足
  | 'FORBIDDEN'            // 禁止访问
  // 验证相关
  | 'VALIDATION_ERROR'      // 输入验证失败
  | 'INVALID_INPUT'        // 无效输入
  | 'DUPLICATE_ENTRY'      // 重复数据
  // 业务逻辑
  | 'NOT_FOUND'            // 资源不存在
  | 'ALREADY_EXISTS'       // 资源已存在
  | 'BUSINESS_ERROR'       // 业务逻辑错误
  | 'QUOTA_EXCEEDED'       // 超出配额
  // 系统相关
  | 'DATABASE_ERROR'       // 数据库错误
  | 'NETWORK_ERROR'        // 网络错误
  | 'INTERNAL_ERROR'       // 内部错误
  | 'SERVICE_UNAVAILABLE'  // 服务不可用

/**
 * 标准错误对象
 */
export interface AppError {
  code: ErrorCode
  message: string
  details?: unknown
}

/**
 * 创建成功结果
 */
export function Ok<T = void>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * 创建成功结果（带重定向）
 */
export function OkWithRedirect<T = void>(
  data: T, 
  redirectTo?: string
): ResultWithRedirect<T, never> {
  return { success: true, data, redirectTo }
}

/**
 * 创建失败结果
 */
export function Err<E = AppError>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * 创建标准错误
 */
export function createError(
  code: ErrorCode, 
  message: string, 
  details?: unknown
): AppError {
  return { code, message, details }
}

/**
 * 类型守卫：检查是否为成功结果
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true
}

/**
 * 类型守卫：检查是否为失败结果
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false
}

/**
 * Result 链式调用辅助函数
 * 允许对成功结果进行转换
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return Ok(fn(result.data))
  }
  return result
}

/**
 * Result 链式调用辅助函数
 * 允许对错误结果进行转换
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return Err(fn(result.error))
  }
  return result
}

/**
 * 从 Result 中提取值，如果失败则抛出错误
 * 仅在确定不会失败时使用
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data
  }
  throw new Error(
    typeof result.error === 'object' && result.error !== null && 'message' in result.error
      ? (result.error as any).message
      : 'Unwrap called on error result'
  )
}

/**
 * 从 Result 中提取值，如果失败则返回默认值
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data
  }
  return defaultValue
}