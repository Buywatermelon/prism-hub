import { getCurrentUser } from '@/lib/data/auth'
import { getWorkspaceBySlug } from '@/lib/data/workspace'
import { redirect } from 'next/navigation'
import SettingsClient from './page.impl'

// 强制动态渲染，确保每次都获取最新数据
export const dynamic = 'force-dynamic'

export default async function SettingsPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug, user.id)
  if (!workspace) {
    redirect('/workspace-setup')
  }

  return <SettingsClient workspace={workspace} />
}