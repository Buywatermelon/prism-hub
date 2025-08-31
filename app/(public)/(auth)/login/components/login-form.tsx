"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "@/app/actions/auth"

// 表单验证 schema
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormData) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', values.email)
      formData.set('password', values.password)
      
      const result = await signIn(formData)
      
      if (result.success) {
        toast({
          title: "登录成功",
          description: "欢迎回来！",
        })
        
        // 处理重定向
        if (result.redirectTo) {
          router.push(result.redirectTo)
          router.refresh()
        }
      } else {
        // 根据错误代码显示不同的提示
        const { code, message } = result.error
        
        if (code === 'EMAIL_NOT_VERIFIED') {
          toast({
            title: "邮箱未验证",
            description: message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "登录失败",
            description: message,
            variant: "destructive",
          })
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>密码</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  忘记密码？
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="输入密码"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={isPending}
        >
          {isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          登录
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">还没有账户？</span>{" "}
          <Link 
            href="/register" 
            className="text-primary underline-offset-4 hover:underline"
          >
            立即注册
          </Link>
        </div>
      </form>
    </Form>
  )
}
