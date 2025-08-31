'use client'

import { useState } from 'react'
import { Brain, Search, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ProviderCard } from './provider-card'
import { ProviderDetail } from './provider-detail'
import { AddProviderDialog } from './add-provider-dialog'
import { Provider, Credential } from '../types'

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
  // 使用 state 管理数据，支持乐观更新
  const [providers, setProviders] = useState(initialProviders)
  const [credentials, setCredentials] = useState(initialCredentials)
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // 过滤供应商
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          provider.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || provider.type === filterType
    return matchesSearch && matchesType
  })

  const selectedProvider = providers.find(p => p.id === selectedProviderId)
  const providerCredentials = credentials.filter(c => c.provider_id === selectedProviderId)

  // 计算每个供应商的凭证数量
  const getCredentialCount = (providerId: string) => {
    return credentials.filter(c => c.provider_id === providerId).length
  }

  // 获取唯一的供应商类型列表
  const providerTypes = Array.from(new Set(providers.map(p => p.type).filter(Boolean)))

  // 处理供应商添加成功 - 乐观更新
  const handleProviderAdded = (newProvider: Provider) => {
    setProviders(prev => [newProvider, ...prev])
    setSelectedProviderId(newProvider.id)
  }

  // 处理供应商更新 - 乐观更新
  const handleProviderUpdated = (updatedProvider: Provider) => {
    setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p))
  }

  // 处理供应商删除 - 乐观更新
  const handleProviderDeleted = (providerId: string) => {
    setProviders(prev => prev.filter(p => p.id !== providerId))
    if (selectedProviderId === providerId) {
      const remainingProviders = providers.filter(p => p.id !== providerId)
      setSelectedProviderId(remainingProviders[0]?.id || '')
    }
  }

  // 处理凭证更新 - 乐观更新
  const handleCredentialsUpdated = (newCredentials: Credential[]) => {
    setCredentials(newCredentials)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧供应商列表 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 搜索和筛选栏 */}
          <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索供应商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {providerTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'claude' ? 'Claude' : 
                   type === 'openai' ? 'OpenAI' : 
                   type === 'gemini' ? 'Gemini' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">供应商</CardTitle>
                <CardDescription>选择一个供应商查看详情</CardDescription>
              </div>
              <AddProviderDialog
                workspaceId={workspaceId}
                onProviderAdded={handleProviderAdded}
                trigger={
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => (
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
                  <p className="text-sm">
                    {searchQuery || filterType !== 'all' 
                      ? '没有找到匹配的供应商' 
                      : '暂无供应商'}
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery || filterType !== 'all'
                      ? '尝试调整搜索条件'
                      : '点击上方按钮添加第一个供应商'}
                  </p>
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
            onProviderUpdated={handleProviderUpdated}
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