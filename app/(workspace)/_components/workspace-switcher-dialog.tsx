"use client"

import React, { useState } from "react"
import { Check, Plus, Users2, Calendar, Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useWorkspaceContext } from "@/hooks/use-workspace"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

// 角色映射
const ROLE_NAMES = {
  owner: "所有者",
  admin: "管理员",
  member: "成员",
} as const

// 获取首字母缩写
const getInitials = (name: string) => 
  name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

interface WorkspaceSwitcherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkspaceSwitcherDialog({ open, onOpenChange }: WorkspaceSwitcherDialogProps) {
  const router = useRouter()
  const { workspaces, currentWorkspace, switchWorkspace, isPending } = useWorkspaceContext()
  const [isLoading, setIsLoading] = useState(false)

  // 处理选择
  const handleSelect = async (action: string) => {
    if (action === "new") {
      onOpenChange(false)
      router.push("/workspace-setup?tab=create")
      return
    }
    
    if (action === "join") {
      onOpenChange(false)
      router.push("/workspace-setup?tab=join")
      return
    }
    
    if (action !== currentWorkspace?.workspace.slug) {
      setIsLoading(true)
      switchWorkspace(action)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>切换工作空间</DialogTitle>
          <DialogDescription>
            选择一个工作空间或创建新的工作空间
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* 工作空间列表 */}
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {isPending ? (
              // 加载状态
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // 工作空间列表
              workspaces.map(({ workspace, membership }) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace.slug)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-lg border transition-all
                    ${currentWorkspace?.workspace.slug === workspace.slug 
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <Avatar className="w-12 h-12 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium">
                      {getInitials(workspace.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {workspace.name}
                      </h3>
                      {currentWorkspace?.workspace.id === workspace.id && (
                        <Check className="h-4 w-4 text-gray-900 dark:text-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{ROLE_NAMES[membership.role as keyof typeof ROLE_NAMES]}</span>
                      {workspace.created_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(workspace.created_at), 'yyyy年MM月', { locale: zhCN })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect("new")}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              创建新工作空间
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect("join")}
              disabled={isLoading}
            >
              <Users2 className="h-4 w-4 mr-2" />
              加入工作空间
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
