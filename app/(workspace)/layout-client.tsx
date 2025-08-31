'use client'

import React from "react"
import { User } from "@supabase/supabase-js"
import { createContext, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { WorkspaceMembership } from "@/lib/data/workspace"
import Layout from "@/components/kokonutui/layout"

interface WorkspaceContextValue {
  user: User
  workspaces: WorkspaceMembership[]
  currentWorkspace: WorkspaceMembership
  switchWorkspace: (slug: string) => void
  isPending: boolean
}

// 导出 Context 供 hooks 使用
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceLayoutClient({
  children,
  user,
  workspaces,
  currentWorkspace
}: {
  children: React.ReactNode
  user: User
  workspaces: WorkspaceMembership[]
  currentWorkspace: WorkspaceMembership
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedWorkspace, setSelectedWorkspace] = useState(currentWorkspace)
  
  // 当 props 中的 currentWorkspace 变化时，更新本地状态
  React.useEffect(() => {
    setSelectedWorkspace(currentWorkspace)
  }, [currentWorkspace])
  
  const switchWorkspace = (slug: string) => {
    const workspace = workspaces.find(w => w.workspace.slug === slug)
    if (!workspace) return
    
    setSelectedWorkspace(workspace)
    
    // 使用 transition 进行平滑切换
    startTransition(() => {
      router.push(`/${slug}/dashboard`)
    })
  }
  
  return (
    <WorkspaceContext.Provider 
      value={{
        user,
        workspaces,
        currentWorkspace: selectedWorkspace,
        switchWorkspace,
        isPending
      }}
    >
      <Layout>{children}</Layout>
    </WorkspaceContext.Provider>
  )
}