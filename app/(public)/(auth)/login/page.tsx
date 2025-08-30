import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "./components/login-form"

export default function LoginPage() {
  return (
    <>
      {/* 返回按钮 */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          返回首页
        </Link>
      </div>

      {/* 登录卡片 */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">欢迎回来</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码登录 Prism Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      {/* 底部链接 */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        遇到问题？{" "}
        <Link
          href="/help"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          获取帮助
        </Link>
      </p>
    </>
  )
}