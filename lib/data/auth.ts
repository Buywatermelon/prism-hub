import { createClient } from "@/lib/supabase/server"
import { User } from "@supabase/supabase-js"
import { Result, Ok, Err, createError, AppError } from "@/lib/result"

export async function getCurrentUser(): Promise<Result<User | null, AppError>> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    return Err(createError('AUTH_FAILED', '获取用户信息失败'))
  }
  
  return Ok(user)
}