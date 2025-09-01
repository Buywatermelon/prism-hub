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
  name?: string  // 可选的错误名称
}

/**
 * 创建成功结果
 * @overload 无参数时返回 void 类型的成功结果
 * @overload 有参数时返回指定类型的成功结果
 */
export function Ok(): Result<void, never>
export function Ok<T>(data: T): Result<T, never>
export function Ok<T>(data?: T): Result<T | void, never> {
  if (arguments.length === 0) {
    return { success: true, data: undefined as any }
  }
  return { success: true, data: data! }
}


/**
 * 创建仅包含重定向的成功结果（语义化别名）
 */
export function Redirect(to: string): ResultWithRedirect<void, never> {
  return { success: true, data: undefined as any, redirectTo: to }
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


// ==================== Result 解包工具 ====================

/**
 * 解包 Result，成功时返回数据，失败时抛出带有 code 的 Error
 * 用于 Server Components 中，会被错误边界捕获
 */
export async function unwrap<T>(
  result: Promise<Result<T, AppError>> | Result<T, AppError>
): Promise<T> {
  const resolved = await result
  if (!resolved.success) {
    // 创建一个带有 code 属性的 Error，方便错误边界识别
    const error = new Error(resolved.error.message) as Error & { 
      code: ErrorCode; 
      details?: unknown 
    }
    error.code = resolved.error.code
    error.details = resolved.error.details
    error.name = 'AppError'
    throw error
  }
  return resolved.data as T
}

/**
 * 解包 ResultWithRedirect，处理重定向
 */
export async function unwrapWithRedirect<T>(
  result: Promise<ResultWithRedirect<T, AppError>> | ResultWithRedirect<T, AppError>
): Promise<{ data: T | undefined; redirectTo?: string }> {
  const resolved = await result
  if (!resolved.success) {
    const error = new Error(resolved.error.message) as Error & { 
      code: ErrorCode; 
      details?: unknown 
    }
    error.code = resolved.error.code
    error.details = resolved.error.details
    error.name = 'AppError'
    throw error
  }
  return {
    data: resolved.data,
    redirectTo: resolved.redirectTo
  }
}

/**
 * 解包 Result 并返回默认值（失败时不抛出异常）
 */
export async function unwrapOr<T>(
  result: Promise<Result<T, AppError>> | Result<T, AppError>,
  defaultValue: T
): Promise<T> {
  try {
    return await unwrap(result)
  } catch {
    return defaultValue
  }
}

