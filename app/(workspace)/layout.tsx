import { redirect } from "next/navigation"
import React from "react"
import { getCurrentUser } from "@/lib/data/auth"
import { getUserWorkspaces, getUserDefaultWorkspace } from "@/lib/data/workspace"
import { WorkspaceLayoutClient } from "./layout-client"
import { unwrap } from "@/lib/result"

// 强制动态渲染，确保每次都获取最新数据
export const dynamic = 'force-dynamic'

export default async function WorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ workspaceSlug?: string }>
}) {
  const resolvedParams = await params
  // 获取当前用户，失败时会抛出错误，被错误边界捕获
  const user = await unwrap(getCurrentUser())
  
  // 未登录，重定向到登录页
  if (!user) {
    redirect('/login')
  }
  
  // 获取用户的所有工作空间
  const workspaces = await getUserWorkspaces(user.id)
  
  // 没有工作空间，重定向到设置页
  if (workspaces.length === 0) {
    redirect('/workspace-setup')
  }
  
  // 获取当前工作空间（从 URL 或默认）
  let currentWorkspace = null
  
  if (resolvedParams.workspaceSlug) {
    currentWorkspace = workspaces.find(w => w.workspace.slug === resolvedParams.workspaceSlug)
  }
  
  if (!currentWorkspace) {
    currentWorkspace = await getUserDefaultWorkspace(user.id)
  }
  
  if (!currentWorkspace) {
    // 不应该发生，但作为保险
    redirect('/workspace-setup')
  }
  
  return (
    <WorkspaceLayoutClient 
      user={user}
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
    >
      {children}
    </WorkspaceLayoutClient>
  )
}