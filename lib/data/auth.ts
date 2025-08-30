import { createClient } from "@/lib/supabase/server"
import { User } from "@supabase/supabase-js"
import { AuthenticationError } from "@/lib/errors"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new AuthenticationError()
  }
  
  return user
}