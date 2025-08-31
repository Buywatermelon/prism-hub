import { Suspense } from 'react'
import { ProviderList } from './_components/provider-list'
import { getProviders, getCredentials } from './actions'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ProvidersPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  
  // 从 slug 获取实际的 workspace ID
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()
  
  if (!workspace) {
    notFound()
  }
  
  const [providers, credentials] = await Promise.all([
    getProviders(workspace.id),
    getCredentials(workspace.id)
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ProviderList 
          initialProviders={providers}
          initialCredentials={credentials}
          workspaceId={workspace.id}
        />
      </Suspense>
    </div>
  )
}