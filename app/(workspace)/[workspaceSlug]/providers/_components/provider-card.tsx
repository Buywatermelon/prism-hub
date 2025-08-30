'use client'

import { Brain } from 'lucide-react'
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
  // 根据类型获取供应商的默认图标/颜色
  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'openai':
        return '🤖'
      case 'claude':
        return '🧠'
      case 'gemini':
        return '✨'
      default:
        return '🔌'
    }
  }

  // 获取模型数量
  const modelCount = Array.isArray(provider.models) ? provider.models.length : 0

  return (
    <div
      className={cn(
        "p-4 cursor-pointer transition-colors hover:bg-accent",
        isSelected && "bg-accent border-l-2 border-l-primary"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {provider.icon ? (
            <AvatarImage src={provider.icon} alt={provider.name} />
          ) : null}
          <AvatarFallback className="text-lg">
            {getProviderIcon(provider.type)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {provider.name}
            </h3>
            <Badge 
              variant="secondary" 
              className="text-xs"
            >
              {provider.type}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground truncate">
            {provider.description || provider.endpoint}
          </p>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{credentialCount} 个凭证</span>
            {modelCount > 0 && (
              <>
                <span>•</span>
                <span>{modelCount} 个模型</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}