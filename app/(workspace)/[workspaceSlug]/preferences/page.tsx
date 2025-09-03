import { getCurrentUser } from '@/lib/data/auth'
import { getWorkspaceBySlug } from '@/lib/data/workspace'
import { redirect } from 'next/navigation'
import { unwrap } from '@/lib/result'
import PreferencesClient from './client'
import { getAllAvailableModels, getScenarioPreferences } from '@/app/actions/model-preferences'
import { getUserApiKeys } from '@/app/actions/api-keys'

// 强制动态渲染，确保每次都获取最新数据
export const dynamic = 'force-dynamic'

export default async function PreferencesPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await unwrap(getCurrentUser())
  if (!user) {
    redirect('/login')
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug, user.id)
  if (!workspace) {
    redirect('/workspace-setup')
  }

  // 获取初始数据
  const [availableModelsResult, codePreferencesResult, apiPreferencesResult, apiKeysResult] = await Promise.all([
    getAllAvailableModels(workspace.workspace.id),
    getScenarioPreferences(workspace.workspace.id, 'code', user.id),
    getScenarioPreferences(workspace.workspace.id, 'api', user.id),
    getUserApiKeys(workspace.workspace.id, user.id)
  ])

  // 解包结果
  const availableModels = await unwrap(availableModelsResult)
  const codePreferences = await unwrap(codePreferencesResult)
  const apiPreferences = await unwrap(apiPreferencesResult)
  const apiKeys = await unwrap(apiKeysResult)

  return (
    <PreferencesClient 
      workspace={workspace}
      availableModels={availableModels}
      codePreferences={codePreferences}
      apiPreferences={apiPreferences}
      userId={user.id}
      initialApiKeys={apiKeys}
    />
  )
}