import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getUserDefaultWorkspace } from "@/lib/data/workspace"
import { unwrapOr } from "@/lib/result"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 检查用户是否已登录，失败时返回 null
  const user = await unwrapOr(getCurrentUser(), null)
  
  // 如果已登录，检查是否有工作空间
  if (user) {
    const defaultWorkspace = await getUserDefaultWorkspace(user.id)
    
    if (defaultWorkspace) {
      // 已登录且有工作空间，重定向到仪表板
      redirect(`/${defaultWorkspace.workspace.slug}/dashboard`)
    } else {
      // 已登录但没有工作空间，重定向到设置页
      redirect('/workspace-setup')
    }
  }
  
  // 未登录用户可以访问公开页面
  return <>{children}</>
}