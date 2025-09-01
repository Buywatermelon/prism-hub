# Supabase 本地开发指南

## 快速命令

```bash
# 启动/停止
npx supabase start        # 启动本地实例
npx supabase stop         # 停止本地实例
npx supabase status       # 查看状态

# 数据库操作
npx supabase db reset --local      # 重置数据库（重新应用迁移+种子）
npx supabase db push --local       # 应用迁移到本地
npx supabase migration new <name>  # 创建新迁移
npx supabase migration list --local  # 查看迁移状态

# 类型生成
npx supabase gen types typescript --local > types/database.types.ts
```

## 访问地址
- Studio: http://localhost:54323
- API: http://localhost:54321
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## 密钥配置

### Client Keys (可公开)
- **用途**：客户端/浏览器
- **环境变量**：`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **权限**：受 RLS 策略限制

### Service Keys (保密)
- **用途**：服务器端
- **环境变量**：`SUPABASE_SERVICE_ROLE_KEY`  
- **权限**：绕过所有 RLS

## 开发流程

1. 修改 schema/seed 后，执行 `npx supabase db reset`
2. 需要新迁移时，使用 `npx supabase migration new <name>`
3. 更新类型定义：`npx supabase gen types typescript --local > types/database.types.ts`