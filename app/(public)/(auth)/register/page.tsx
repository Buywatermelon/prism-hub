import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegisterForm } from "./components/register-form"

export default function RegisterPage() {
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

      {/* 注册卡片 */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">创建账户</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码以创建 Prism Hub 账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>

      {/* 服务条款 */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        注册即表示您同意我们的{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          服务条款
        </Link>{" "}
        和{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          隐私政策
        </Link>
      </p>
    </>
  )
}