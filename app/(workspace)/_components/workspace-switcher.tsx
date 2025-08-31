"use client"

import React, { useState } from "react"
import { ChevronsUpDown } from "lucide-react"
import { useWorkspaceContext } from "@/hooks/use-workspace"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { WorkspaceSwitcherDialog } from "./workspace-switcher-dialog"

// 角色映射
const ROLE_NAMES = {
  owner: "所有者",
  admin: "管理员",
  member: "成员",
} as const

// 获取首字母缩写
const getInitials = (name: string) => 
  name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

export function WorkspaceSwitcher() {
  const { currentWorkspace, isPending } = useWorkspaceContext()
  const [dialogOpen, setDialogOpen] = useState(false)

  // 加载状态
  if (isPending) {
    return (
      <div className="px-6 py-3 border-b border-gray-200 dark:border-[#1F1F23]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    )
  }

  if (!currentWorkspace) return null

  const currentMembership = currentWorkspace.membership

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full px-6 py-3 border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 rounded-lg">
              <AvatarFallback className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium">
                {getInitials(currentWorkspace.workspace.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {currentWorkspace.workspace.name}
              </div>
              {currentMembership && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {ROLE_NAMES[currentMembership.role as keyof typeof ROLE_NAMES]}
                </div>
              )}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
      </button>
      
      <WorkspaceSwitcherDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </>
  )
}