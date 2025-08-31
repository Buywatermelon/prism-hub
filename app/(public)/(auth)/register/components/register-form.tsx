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
import { signUp } from "@/app/actions/auth"

// 表单验证 schema
const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要 6 个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: RegisterFormData) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', values.email)
      formData.set('password', values.password)
      
      const result = await signUp(formData)
      
      if (result.success) {
        toast({
          title: "注册成功",
          description: "欢迎加入 Prism Hub！",
        })
        
        // 处理重定向
        if (result.redirectTo) {
          router.push(result.redirectTo)
          router.refresh()
        }
      } else {
        // 根据错误代码显示不同的提示
        const { code, message } = result.error
        
        if (code === 'DUPLICATE_ENTRY') {
          toast({
            title: "邮箱已存在",
            description: message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "注册失败",
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
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="至少 6 个字符"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="再次输入密码"
                  autoComplete="new-password"
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
          创建账户
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">已有账户？</span>{" "}
          <Link 
            href="/login" 
            className="text-primary underline-offset-4 hover:underline"
          >
            立即登录
          </Link>
        </div>
      </form>
    </Form>
  )
}