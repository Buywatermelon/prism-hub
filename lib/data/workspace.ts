import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']

export interface WorkspaceMembership {
  workspace: Workspace
  membership: WorkspaceMember
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceMembership[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      workspace:workspaces(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
  
  if (error || !data) {
    return []
  }
  
  return data.map(item => ({
    workspace: item.workspace as Workspace,
    membership: {
      id: item.id,
      workspace_id: item.workspace_id,
      user_id: item.user_id,
      role: item.role,
      status: item.status,
      joined_at: item.joined_at,
      applied_at: item.applied_at,
      approved_at: item.approved_at,
      approved_by: item.approved_by,
      invited_by: item.invited_by,
      permissions: item.permissions,
      preferences: item.preferences,
      reject_reason: item.reject_reason,
    } as WorkspaceMember
  }))
}

export async function getUserDefaultWorkspace(userId: string): Promise<WorkspaceMembership | null> {
  const workspaces = await getUserWorkspaces(userId)
  
  if (workspaces.length === 0) {
    return null
  }
  
  return workspaces[0]
}