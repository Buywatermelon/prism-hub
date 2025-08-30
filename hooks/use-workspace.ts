'use client'

import { useContext } from 'react'
import { WorkspaceContext } from '@/app/(workspace)/layout-client'

/**
 * 工作空间相关的 Hooks
 * 从 layout-client.tsx 中提取，遵循单一职责原则
 */

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspaceContext must be used within WorkspaceLayoutClient")
  }
  return context
}

export function useCurrentUser() {
  const { user } = useWorkspaceContext()
  return user
}

export function useCurrentWorkspace() {
  const { currentWorkspace } = useWorkspaceContext()
  return currentWorkspace
}

export function useWorkspaces() {
  const { workspaces } = useWorkspaceContext()
  return workspaces
}

export function useSwitchWorkspace() {
  const { switchWorkspace, isPending } = useWorkspaceContext()
  return { switchWorkspace, isPending }
}