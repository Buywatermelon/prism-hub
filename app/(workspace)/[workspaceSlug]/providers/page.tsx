import { Suspense } from 'react'
import { ProviderList } from './_components/provider-list'
import { getProviders, getCredentials } from './actions'

export default async function ProvidersPage({
  params
}: {
  params: { workspaceSlug: string }
}) {
  // 获取工作空间ID（这里简化处理，实际需要从slug查询）
  // TODO: 从 workspaceSlug 获取实际的 workspaceId
  const workspaceId = params.workspaceSlug // 临时使用slug作为ID
  
  const [providers, credentials] = await Promise.all([
    getProviders(workspaceId),
    getCredentials(workspaceId)
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">LLM Providers</h2>
          <p className="text-muted-foreground">
            管理AI服务提供商和认证配置
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ProviderList 
          initialProviders={providers}
          initialCredentials={credentials}
          workspaceId={workspaceId}
        />
      </Suspense>
    </div>
  )
}