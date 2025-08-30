"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Plus, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createWorkspace, joinWorkspace } from './actions'
import { useToast } from "@/components/ui/use-toast"
import { User } from "@supabase/supabase-js"

interface WorkspaceSetupClientProps {
  user: User
}

export default function WorkspaceSetupClient({ user }: WorkspaceSetupClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"create" | "join">("create")
  const [workspaceName, setWorkspaceName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 处理创建工作空间
  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return

    setIsSubmitting(true)
    try {
      const { workspace } = await createWorkspace({ name: workspaceName })
      
      toast({
        description: '工作空间创建成功！',
      })
      
      // 跳转到新创建的工作空间
      router.push(`/${workspace.slug}/dashboard`)
    } catch (error) {
      console.error('创建工作空间失败:', error)
      const msg = error instanceof Error ? error.message : '创建工作空间失败'
      toast({
        title: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理加入工作空间
  const handleJoinWorkspace = async () => {
    if (!inviteCode.trim()) return

    setIsSubmitting(true)
    try {
      const { workspace } = await joinWorkspace({ join_code: inviteCode })
      
      toast({
        description: '成功加入工作空间！',
      })
      
      // 跳转到新加入的工作空间
      router.push(`/${workspace.slug}/dashboard`)
    } catch (error) {
      console.error('加入工作空间失败:', error)
      const msg = error instanceof Error ? error.message : '加入工作空间失败'
      toast({
        title: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-2xl">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 dark:bg-white mb-4">
            <Building2 className="h-8 w-8 text-white dark:text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            设置您的工作空间
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            创建新的工作空间或加入现有团队
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "create" ? "default" : "outline"}
            onClick={() => setActiveTab("create")}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建工作空间
          </Button>
          <Button
            variant={activeTab === "join" ? "default" : "outline"}
            onClick={() => setActiveTab("join")}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            加入工作空间
          </Button>
        </div>

        {/* 内容区域 */}
        {activeTab === "create" ? (
          <Card>
            <CardHeader>
              <CardTitle>创建新的工作空间</CardTitle>
              <CardDescription>
                为您的团队创建一个全新的工作空间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">工作空间名称</Label>
                <Input
                  id="workspace-name"
                  placeholder="例如：我的团队"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500">
                  请选择一个易于识别的名称
                </p>
              </div>
              
              <Separator />
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">作为所有者，您将能够：</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 邀请和管理团队成员</li>
                  <li>• 配置工作空间设置</li>
                  <li>• 管理所有资源和权限</li>
                </ul>
              </div>

              <Button
                onClick={handleCreateWorkspace}
                disabled={!workspaceName.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "创建中..." : "创建工作空间"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>加入现有工作空间</CardTitle>
              <CardDescription>
                使用邀请码加入团队的工作空间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">邀请码</Label>
                <Input
                  id="invite-code"
                  placeholder="输入6位邀请码"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={6}
                />
                <p className="text-sm text-gray-500">
                  请向工作空间管理员获取邀请码
                </p>
              </div>
              
              <Separator />
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">加入后，您将能够：</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 访问工作空间的共享资源</li>
                  <li>• 与团队成员协作</li>
                  <li>• 使用工作空间提供的功能</li>
                </ul>
              </div>

              <Button
                onClick={handleJoinWorkspace}
                disabled={!inviteCode.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "加入中..." : "加入工作空间"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}