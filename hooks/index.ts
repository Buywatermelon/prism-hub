/**
 * 统一导出所有 Hooks
 * 
 * 使用示例：
 * import { useCurrentUser, useAbility, useCan } from '@/hooks'
 */

// 工作空间相关
export {
  useWorkspaceContext,
  useCurrentUser,
  useCurrentWorkspace,
  useWorkspaces,
  useSwitchWorkspace
} from './use-workspace'

// 权限相关
export {
  useAbility,
  useCan,
  usePermissionChange,
  Can,
  Cannot
} from './use-permissions'