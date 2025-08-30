import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getUserDefaultWorkspace } from "@/lib/data/workspace"
import WorkspaceSetupClient from "./client"

export default async function WorkspaceSetupPage() {
  // 获取当前用户
  const user = await getCurrentUser()
  
  // 未登录，重定向到登录页
  if (!user) {
    redirect('/login')
  }
  
  // 检查是否已有工作空间
  const defaultWorkspace = await getUserDefaultWorkspace(user.id)
  
  if (defaultWorkspace) {
    // 已有工作空间，重定向到仪表板
    redirect(`/${defaultWorkspace.workspace.slug}/dashboard`)
  }
  
  // 渲染客户端组件
  return <WorkspaceSetupClient user={user} />
}