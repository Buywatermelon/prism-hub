# CLAUDE.md - Prism Hub 开发指南

## 项目概述
Prism Hub 是 Claude Relay 的企业级管理控制台，严格遵循 Next.js 15 和 Supabase 最佳实践。

## 🎯 核心原则

### 1. 精简优先
- **如无必要，勿增实体** - 不创建不必要的组件或功能
- 优先使用已有组件，避免重复造轮子
- 保持代码库干净、可维护

### 2. 组件复用策略
- **必须**优先使用 `@/components/ui/*` 中的基础组件 (shadcn/ui)
- **必须**优先使用 `@/components/kokonutui/*` 中的复合组件
- 只有在现有组件无法满足需求时，才考虑创建新组件

### 3. 技术栈
- **框架**: Next.js 15.2.4 (App Router)
- **运行时**: React 19
- **样式**: Tailwind CSS 3.4 + shadcn/ui
- **认证**: Supabase Auth + SSR
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: React Context
- **表单**: React Hook Form + Zod
- **数据获取**: Server Actions + React Suspense
- **工作空间**: Slugify 处理中文名称

## 开发命令
```bash
# 开发
npm run dev          # 启动开发服务器 (localhost:3000)

# 构建
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 类型检查
```

## 目录结构
```
prism-hub/
├── app/                        # Next.js App Router
│   ├── (public)/              # 公开访问路由组
│   │   └── (auth)/           # 认证页面 (login/register)
│   ├── (workspace)/           # 需认证的工作空间路由组
│   │   ├── [workspaceSlug]/  # 动态工作空间路由
│   │   │   ├── dashboard/    # 仪表板页面
│   │   │   ├── members/      # 成员管理页面
│   │   │   ├── providers/    # 供应商与凭证管理
│   │   │   └── settings/     # 设置页面
│   │   ├── loading.tsx       # ✅ 工作空间加载状态
│   │   └── error.tsx         # 错误边界
│   ├── actions/               # 全局 Server Actions
│   └── workspace-setup/       # 工作空间初始设置
├── components/            
│   ├── ui/                    # shadcn/ui 基础组件
│   ├── kokonutui/            # 复合组件库
│   └── theme-provider.tsx    # 主题提供者
├── lib/                       
│   ├── supabase/             # Supabase 客户端配置
│   ├── oauth/                # OAuth 配置与工具
│   ├── data/                 # 数据获取函数
│   ├── errors.ts             # 自定义错误类
│   └── utils.ts              # 工具函数
└── types/                     # TypeScript 类型定义
```

## 🚀 Next.js 15 最佳实践

### 1. App Router 规范
- **路由组**: 使用 `(folder)` 组织路由，不影响 URL 结构
- **动态路由**: 使用 `[param]` 处理动态段
- **Loading UI**: 每个路由段都应有 `loading.tsx`
- **Error Boundaries**: 使用 `error.tsx` 处理错误
- **并行路由**: 利用路由组实现布局复用

### 2. 数据获取
- **Server Components**: 默认使用服务器组件获取数据
- **Server Actions**: 使用 `"use server"` 处理表单提交
- **Streaming**: 利用 Suspense 实现渐进式渲染
- **缓存策略**: 合理使用 `revalidate` 控制缓存

### 3. 性能优化
- **代码分割**: 自动按路由分割
- **图片优化**: 使用 `next/image` 组件
- **字体优化**: 使用 `next/font` 加载字体
- **预取**: 利用 `<Link>` 自动预取

### 4. TypeScript 配置
- **严格模式**: `strict: true` 确保类型安全
- **路径别名**: 使用 `@/*` 简化导入
- **增量编译**: `incremental: true` 加速编译

## 🔐 Supabase 最佳实践

### 1. 客户端配置
- **SSR 客户端**: 服务器组件使用 `createClient`
- **浏览器客户端**: 客户端组件使用 `createBrowserClient`
- **中间件客户端**: 中间件使用 `createMiddlewareClient`
- **Cookie 处理**: 确保正确处理认证 cookie

### 2. 认证流程
- **会话刷新**: 中间件自动刷新过期会话
- **认证保护**: 路由组级别的认证检查
- **用户上下文**: 使用 Context 共享用户状态

### 3. 数据库操作
- **RLS 策略**: 利用行级安全保护数据
- **类型生成**: 使用 Supabase CLI 生成类型
- **实时订阅**: 合理使用实时功能

### 4. 错误处理
- **友好提示**: 转换数据库错误为用户友好信息
- **重试机制**: 网络错误自动重试
- **日志记录**: 记录关键操作日志

## 📋 开发规范

### UI 开发
- **组件优先级**: ui → kokonutui → 自定义
- **主题支持**: 深浅色模式自动切换
- **响应式**: 移动优先设计
- **无障碍**: 遵循 ARIA 规范

### 状态管理
- **服务器状态**: Server Actions + React Suspense
- **客户端状态**: React Context + useState
- **表单状态**: React Hook Form 管理表单

### 错误处理
- **边界捕获**: Error Boundary 捕获组件错误
- **Toast 提示**: 操作反馈使用 toast
- **表单验证**: Zod schema 验证
- **友好错误**: 自定义错误类提供上下文

## 🔥 异常处理规范 (Result 模式)

### 核心理念
使用 **Result 模式** 代替异常抛出，将错误处理作为正常的控制流，提供类型安全和更好的错误处理体验。

### Server Actions
- **必须**返回 `Result<T, AppError>` 类型
- **使用工具函数**：`Ok()`, `Err()`, `OkWithRedirect()`
- **标准错误代码**：使用预定义的 `ErrorCode` 枚举

```typescript
// ✅ 正确 - Result 模式
import { Result, Ok, Err, createError } from '@/lib/result'

export async function updateProfile(
  data: FormData
): Promise<Result<User, AppError>> {
  if (!isValid) {
    return Err(createError('VALIDATION_ERROR', '数据无效'))
  }
  return Ok(updatedUser)
}

// 带重定向的 Action
export async function signIn(
  data: FormData
): Promise<ResultWithRedirect<void, AppError>> {
  if (success) {
    return OkWithRedirect(undefined, '/dashboard')
  }
  return Err(createError('AUTH_FAILED', '登录失败'))
}
```

### 客户端组件
- **无需 try-catch**：直接处理返回的 Result
- **类型安全**：TypeScript 自动推断成功/失败类型
- **差异化处理**：根据错误代码执行不同逻辑

```typescript
// ✅ 正确 - 处理 Result
const result = await serverAction(formData)

if (result.success) {
  toast({ description: '操作成功' })
  if (result.redirectTo) {
    router.push(result.redirectTo)
  }
} else {
  // 根据错误代码差异化处理
  switch (result.error.code) {
    case 'AUTH_FAILED':
      router.push('/login')
      break
    case 'VALIDATION_ERROR':
      form.setError('root', { message: result.error.message })
      break
    default:
      toast({ 
        description: result.error.message,
        variant: 'destructive'
      })
  }
}
```

### 标准错误代码
```typescript
// 认证相关
'AUTH_FAILED'         // 认证失败
'AUTH_REQUIRED'       // 需要登录
'EMAIL_NOT_VERIFIED'  // 邮箱未验证

// 验证相关
'VALIDATION_ERROR'    // 输入验证失败
'DUPLICATE_ENTRY'     // 重复数据

// 业务逻辑
'NOT_FOUND'          // 资源不存在
'PERMISSION_DENIED'  // 权限不足
'BUSINESS_ERROR'     // 业务错误

// 系统相关
'DATABASE_ERROR'     // 数据库错误
'INTERNAL_ERROR'     // 内部错误
```

### 工具函数
```typescript
// 基础工具
Ok(data)                    // 创建成功结果
Err(error)                  // 创建失败结果
OkWithRedirect(data, url)   // 成功结果带重定向

// 错误创建
createError(code, message, details?)  // 创建标准错误

// 类型守卫
isOk(result)   // 判断是否成功
isErr(result)  // 判断是否失败

// 链式操作
mapResult(result, fn)  // 转换成功值
mapError(result, fn)   // 转换错误值
```

## 供应商管理
### 内置 OAuth 供应商
- **Claude Code** (Anthropic CLI)
- **CodeX CLI** (OpenAI)  
- **Gemini CLI** (Google)

### 凭证类型
- **OAuth**: 内置供应商专用，自动创建
- **API 密钥**: 用户自定义供应商

### OAuth 流程
1. 生成授权 URL（支持 PKCE）
2. 用户授权后复制回调 URL
3. 自动提取授权码并交换令牌
4. 凭证自动保存

## 部署
- **平台**: Vercel Edge Runtime
- **环境变量**: 通过 Vercel 管理
- **CI/CD**: GitHub Actions 自动部署
