import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/data/auth"
import { getUserDefaultWorkspace } from "@/lib/data/workspace"

export default async function Home() {
  // 检查用户是否已登录
  const user = await getCurrentUser()
  
  if (user) {
    // 获取默认工作空间
    const defaultWorkspace = await getUserDefaultWorkspace(user.id)
    
    if (defaultWorkspace) {
      // 已登录且有工作空间，重定向到仪表板
      redirect(`/${defaultWorkspace.workspace.slug}/dashboard`)
    } else {
      // 已登录但没有工作空间，重定向到设置页
      redirect('/workspace-setup')
    }
  }
  
  // 未登录用户显示欢迎页面
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-4 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            欢迎使用 Prism Hub
          </h1>
          <p className="text-muted-foreground">
            强大的 AI 工作空间管理平台
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/register">
              创建账户
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              登录
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}