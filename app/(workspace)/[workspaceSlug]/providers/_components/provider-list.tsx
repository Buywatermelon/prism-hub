'use client'

import { useState } from 'react'
import { Brain, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProviderCard } from './provider-card'
import { ProviderDetail } from './provider-detail'
import { AddProviderDialog } from './add-provider-dialog'
import { Database } from '@/types/database.types'

type Provider = Database['public']['Tables']['providers']['Row']
type Credential = Database['public']['Tables']['provider_credentials']['Row'] & {
  encrypted_key?: never
  key_hint: string
}

interface ProviderListProps {
  initialProviders: Provider[]
  initialCredentials: Credential[]
  workspaceId: string
}

export function ProviderList({ 
  initialProviders, 
  initialCredentials, 
  workspaceId 
}: ProviderListProps) {
  const [providers, setProviders] = useState(initialProviders)
  const [credentials, setCredentials] = useState(initialCredentials)
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '')
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false)

  const selectedProvider = providers.find(p => p.id === selectedProviderId)
  const providerCredentials = credentials.filter(c => c.provider_id === selectedProviderId)

  // 计算每个供应商的凭证数量
  const getCredentialCount = (providerId: string) => {
    return credentials.filter(c => c.provider_id === providerId).length
  }

  // 处理供应商添加成功
  const handleProviderAdded = (newProvider: Provider) => {
    setProviders([newProvider, ...providers])
    setSelectedProviderId(newProvider.id)
    setIsAddProviderOpen(false)
  }

  // 处理供应商删除
  const handleProviderDeleted = (providerId: string) => {
    setProviders(providers.filter(p => p.id !== providerId))
    if (selectedProviderId === providerId) {
      setSelectedProviderId(providers[0]?.id || '')
    }
  }

  // 处理凭证更新
  const handleCredentialsUpdated = (newCredentials: Credential[]) => {
    setCredentials(newCredentials)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧供应商列表 */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <CardTitle>Providers ({providers.length})</CardTitle>
              </div>
              <AddProviderDialog
                workspaceId={workspaceId}
                onProviderAdded={handleProviderAdded}
                trigger={
                  <Button size="sm" className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
            <CardDescription>选择一个供应商查看详情</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {providers.length > 0 ? (
                providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isSelected={selectedProviderId === provider.id}
                    credentialCount={getCredentialCount(provider.id)}
                    onClick={() => setSelectedProviderId(provider.id)}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">暂无供应商</p>
                  <p className="text-xs mt-1">点击上方按钮添加第一个供应商</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧供应商详情 */}
      <div className="lg:col-span-2">
        {selectedProvider ? (
          <ProviderDetail
            provider={selectedProvider}
            credentials={providerCredentials}
            workspaceId={workspaceId}
            onProviderDeleted={handleProviderDeleted}
            onCredentialsUpdated={handleCredentialsUpdated}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>请选择一个Provider查看详情</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}