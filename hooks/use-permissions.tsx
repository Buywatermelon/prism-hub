'use client'

import { useEffect, useState, useRef } from 'react'
import { defineAbilitiesFor, type AppAbility, type UserRole } from '@/lib/auth/abilities'
import { useCurrentWorkspace } from './use-workspace'

/**
 * 权限相关的 Hooks
 * 从 lib/auth/hooks.ts 中迁移，更符合 Next.js 组织结构
 */

/**
 * 获取当前用户的权限
 */
export function useAbility(): AppAbility | null {
  const currentWorkspace = useCurrentWorkspace()
  const [ability, setAbility] = useState<AppAbility | null>(null)

  useEffect(() => {
    if (currentWorkspace) {
      const context = {
        userId: currentWorkspace.membership.user_id,
        workspaceId: currentWorkspace.workspace.id,
        role: currentWorkspace.membership.role as UserRole
      }
      
      const userAbility = defineAbilitiesFor(context)
      setAbility(userAbility)
    }
  }, [currentWorkspace])

  return ability
}

/**
 * 检查特定权限
 */
export function useCan(action: string, subject: string): boolean {
  const ability = useAbility()
  
  if (!ability) return false
  
  return ability.can(action as any, subject as any)
}

/**
 * 监听权限变化
 */
export function usePermissionChange(
  onChange: (newRole: UserRole | null, previousRole: UserRole | null) => void
): void {
  const onChangeRef = useRef(onChange)
  const previousRoleRef = useRef<UserRole | null>(null)
  
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  
  const currentWorkspace = useCurrentWorkspace()
  
  useEffect(() => {
    if (currentWorkspace) {
      const newRole = currentWorkspace.membership.role as UserRole
      if (newRole !== previousRoleRef.current) {
        onChangeRef.current(newRole, previousRoleRef.current)
        previousRoleRef.current = newRole
      }
    } else {
      if (previousRoleRef.current !== null) {
        onChangeRef.current(null, previousRoleRef.current)
        previousRoleRef.current = null
      }
    }
  }, [currentWorkspace])
}

/**
 * 条件渲染组件
 */
interface CanProps {
  I: string
  a: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ I, a, children, fallback = null }: CanProps) {
  const can = useCan(I, a)
  return <>{can ? children : fallback}</>
}

export function Cannot({ I, a, children, fallback = null }: CanProps) {
  const can = useCan(I, a)
  return <>{!can ? children : fallback}</>
}