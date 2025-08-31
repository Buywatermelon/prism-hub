# 代码清理待办事项

## 当前状态

### Result 模式迁移进度
- ✅ **已完成**：`app/actions/auth.ts` (登录、注册、密码更新)
- ⏳ **待迁移**：
  - `app/workspace-setup/actions.ts`
  - `app/(workspace)/[workspaceSlug]/settings/actions.ts`
  - `app/(workspace)/[workspaceSlug]/members/actions.ts`
  - `app/(workspace)/[workspaceSlug]/providers/actions.ts`
  - `app/(workspace)/[workspaceSlug]/providers/oauth/actions.ts`

### 可删除的代码（迁移完成后）

#### 1. 错误处理相关
- **文件**：`lib/client/handle-action-error.ts`
  - 依赖：`workspace-setup/client.tsx` 仍在使用
  - 迁移后可删除

- **文件**：`lib/errors.ts`
  - 定义了自定义错误类（AuthenticationError、ValidationError 等）
  - 被多个 Server Actions 使用
  - 全部迁移到 Result 模式后可删除

#### 2. Result.ts 中未使用的函数
已删除：
- ✅ `OkWithRedirect()` - 用 `Redirect()` 替代
- ✅ `mapResult()` - 未使用
- ✅ `mapError()` - 未使用  
- ✅ `unwrap()` - 违背 Result 模式理念
- ✅ `unwrapOr()` - 无使用场景

保留但未使用（可能有未来价值）：
- `isOk()` - 类型守卫，客户端可能需要
- `isErr()` - 类型守卫，客户端可能需要

## 迁移计划

### 第一阶段：Server Actions 迁移
1. 迁移 `workspace-setup/actions.ts` 到 Result 模式
2. 更新 `workspace-setup/client.tsx` 使用新的错误处理
3. 迁移其他 workspace 相关的 actions

### 第二阶段：清理旧代码
1. 删除 `lib/client/handle-action-error.ts`
2. 删除 `lib/errors.ts`
3. 删除所有相关的导入语句

### 第三阶段：优化
1. 评估 `isOk()` 和 `isErr()` 的必要性
2. 考虑是否需要添加更多 Result 工具函数
3. 统一所有错误代码和消息

## 代码统计

### 当前可精简的代码行数
- `lib/result.ts`：已从 184 行减少到 114 行（节省 70 行）
- 潜在可删除：
  - `lib/errors.ts`：~200 行
  - `lib/client/handle-action-error.ts`：~56 行
  - 总计可节省：~326 行

## 注意事项
- 保持渐进式迁移，避免破坏现有功能
- 每个模块迁移后要充分测试
- 更新 CLAUDE.md 文档保持同步