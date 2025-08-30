import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'

// 定义资源类型
interface Member {
  userId: string
  role: string
}

interface Workspace {
  id: string
}

// 定义权限主体类型
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'invite' | 'approve'
export type Subjects = 
  | 'Workspace' 
  | 'Member' 
  | 'Settings' 
  | 'Provider' 
  | 'Credential'
  | 'all'
  | Member
  | Workspace

export type AppAbility = MongoAbility<[Actions, Subjects]>

// 定义角色类型
export type UserRole = 'owner' | 'admin' | 'member' | 'guest'

export interface PermissionContext {
  userId: string
  workspaceId: string
  role: UserRole
}

// 定义基于角色的权限
export function defineAbilitiesFor(context: PermissionContext): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
  
  const { role } = context

  switch (role) {
    case 'owner':
      // 所有者可以做任何事
      can('manage', 'all')
      break
      
    case 'admin':
      // 管理员可以管理大部分资源
      can('read', 'all')
      can('create', ['Provider', 'Credential', 'Member'])
      can('update', ['Provider', 'Credential', 'Member', 'Settings'])
      can('delete', ['Provider', 'Credential'])
      can('invite', 'Member')
      can('approve', 'Member')
      // 但不能删除工作空间或修改所有者
      cannot('delete', 'Workspace')
      cannot('update', 'Member', { role: 'owner' })
      break
      
    case 'member':
      // 普通成员只能读取
      can('read', ['Workspace', 'Member', 'Provider', 'Credential'])
      can('update', 'Member', { userId: context.userId }) // 只能更新自己的信息
      break
      
    case 'guest':
      // 访客只能读取基本信息
      can('read', 'Workspace')
      break
  }

  return build()
}