'use client'

import { Key, Brain } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Provider = Database['public']['Tables']['providers']['Row']

interface ProviderCardProps {
  provider: Provider
  isSelected: boolean
  credentialCount: number
  onClick: () => void
}

export function ProviderCard({ 
  provider, 
  isSelected, 
  credentialCount,
  onClick 
}: ProviderCardProps) {

  // 获取供应商类型的显示名称
  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'claude':
        return 'Claude'
      case 'openai':
        return 'OpenAI'
      case 'gemini':
        return 'Gemini'
      default:
        return type || 'Custom'
    }
  }

  // 获取模型数量
  const modelCount = Array.isArray(provider.models) ? provider.models.length : 0
  
  // 判断供应商是否活跃（有凭证）
  const isActive = credentialCount > 0

  return (
    <div
      className={cn(
        "p-4 cursor-pointer transition-all hover:bg-muted/50",
        isSelected && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-r-blue-500"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {provider.icon ? (
            <AvatarImage src={provider.icon} alt={provider.name} />
          ) : null}
          <AvatarFallback>
            <Brain className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {provider.name}
            </h3>
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {isActive ? '活跃' : '未激活'}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground truncate">
            {provider.description || provider.endpoint}
          </p>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              <span>{credentialCount} 凭证</span>
            </div>
            {modelCount > 0 && (
              <>
                <span>•</span>
                <span>{modelCount} 模型</span>
              </>
            )}
            <span>•</span>
            <Badge variant="outline" className="text-xs h-4 px-1">
              {getProviderTypeLabel(provider.type)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}