import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 创建响应对象
  const response = NextResponse.next({
    request,
  })

  // 创建中间件专用的 Supabase 客户端
  const supabase = createMiddlewareClient(request, response)

  // 刷新过期的会话 - Server Components 必需
  await supabase.auth.getUser()

  // 中间件现在只负责刷新会话
  // 认证和工作空间检查移到路由组的 layout 中处理
  // 这样可以更好地利用 Next.js 的缓存和并行渲染

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹
     * - api 路由 (在路由处理器中处理认证)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}