"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { 
  ResultWithRedirect, 
  AppError, 
  OkWithRedirect, 
  Err, 
  createError,
  Ok,
  Result
} from '@/lib/result'

const signInSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要 6 个字符'),
})

const signUpSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要 6 个字符'),
})

/**
 * 用户登录
 */
export async function signIn(
  formData: FormData
): Promise<ResultWithRedirect<void, AppError>> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return Err(createError(
      'VALIDATION_ERROR',
      '输入数据无效',
      parsed.error.errors
    ))
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // 根据错误类型返回友好的消息
    if (error.message.includes('Invalid login credentials')) {
      return Err(createError('AUTH_FAILED', '邮箱或密码错误'))
    }
    if (error.message.includes('Email not confirmed')) {
      return Err(createError('EMAIL_NOT_VERIFIED', '请先验证您的邮箱'))
    }
    return Err(createError('AUTH_FAILED', error.message))
  }

  // 登录成功，返回成功结果带重定向
  return OkWithRedirect(undefined, '/')
}

/**
 * 用户注册
 */
export async function signUp(
  formData: FormData
): Promise<ResultWithRedirect<void, AppError>> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return Err(createError(
      'VALIDATION_ERROR',
      '输入数据无效',
      parsed.error.errors
    ))
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  // 注册用户
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    if (signUpError.message.includes('User already registered')) {
      return Err(createError('DUPLICATE_ENTRY', '该邮箱已被注册'))
    }
    return Err(createError('VALIDATION_ERROR', signUpError.message))
  }

  // 注册成功后自动登录
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    // 如果自动登录失败，让用户手动登录
    return OkWithRedirect(undefined, '/login')
  }

  // 注册并登录成功，重定向到工作空间设置
  return OkWithRedirect(undefined, '/workspace-setup')
}

/**
 * 用户登出
 */
export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw new Error('登出失败，请稍后重试')
  }

  redirect('/login')
}

/**
 * 更新用户密码
 */
export async function updatePassword(
  newPassword: string
): Promise<Result<void, AppError>> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Err(createError('AUTH_REQUIRED', '用户未登录'))
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    return Err(createError('VALIDATION_ERROR', '密码更新失败'))
  }

  return Ok(undefined)
}