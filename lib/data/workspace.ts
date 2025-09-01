import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"
import type { WorkspacePreferences, WorkspaceMemberPreferences } from "@/types/preferences.types"

export type Workspace = Omit<Database['public']['Tables']['workspaces']['Row'], 'preferences'> & {
  preferences: WorkspacePreferences
}

export type WorkspaceMember = Omit<Database['public']['Tables']['workspace_members']['Row'], 'preferences'> & {
  preferences: WorkspaceMemberPreferences
}

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

export async function getWorkspaceBySlug(slug: string, userId: string): Promise<WorkspaceMembership | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      workspace:workspaces!inner(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('workspace.slug', slug)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    workspace: data.workspace as Workspace,
    membership: {
      id: data.id,
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role,
      status: data.status,
      joined_at: data.joined_at,
      applied_at: data.applied_at,
      approved_at: data.approved_at,
      approved_by: data.approved_by,
      invited_by: data.invited_by,
      permissions: data.permissions,
      preferences: data.preferences,
      reject_reason: data.reject_reason,
    } as WorkspaceMember
  }
}

export async function getUserDefaultWorkspace(userId: string): Promise<WorkspaceMembership | null> {
  const workspaces = await getUserWorkspaces(userId)
  
  if (workspaces.length === 0) {
    return null
  }
  
  return workspaces[0]
}