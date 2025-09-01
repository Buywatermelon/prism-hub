"use client"

import { useState, useEffect } from "react"
import { RotateCcw, Settings, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronUp, ChevronDown } from "lucide-react"
import type { ModelInfo } from "@/lib/utils/model-identifier"

interface ModelPreferencesSettingsProps {
  models: ModelInfo[]
  currentOrder: string[]  // 模型ID列表 (provider_id:model_name 格式)
  context: "user" | "workspace"
  onOrderChange: (newOrder: string[]) => void
  onReset?: () => void
}

export function ModelPreferencesSettings({
  models,
  currentOrder,
  context,
  onOrderChange,
  onReset,
}: ModelPreferencesSettingsProps) {
  const [orderedModels, setOrderedModels] = useState<ModelInfo[]>([])

  useEffect(() => {
    if (currentOrder.length > 0) {
      // 按照当前顺序排列模型
      const ordered = currentOrder
        .map((id) => models.find((m) => m.id === id))
        .filter(Boolean) as ModelInfo[]
      
      // 添加未在顺序中的模型
      const remaining = models.filter((m) => !currentOrder.includes(m.id))
      setOrderedModels([...ordered, ...remaining])
    } else {
      setOrderedModels(models)
    }
  }, [models, currentOrder])

  const moveModel = (index: number, direction: "up" | "down") => {
    const newOrder = [...orderedModels]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      setOrderedModels(newOrder)
      onOrderChange(newOrder.map((m) => m.id))
    }
  }

  if (models.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            模型偏好设置
          </CardTitle>
          <CardDescription>
            {context === "user" ? "设置你的个人模型使用优先级" : "设置工作空间的默认模型优先级"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无可用的模型</p>
            <p className="text-sm mt-1">请先添加供应商并配置凭证</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              模型偏好设置
            </CardTitle>
            <CardDescription>
              {context === "user"
                ? "设置你的个人模型使用优先级"
                : "新成员将使用此默认优先级"}
            </CardDescription>
          </div>
          {context === "user" && onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置为默认
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {orderedModels.map((model, index) => (
          <ModelItemCard
            key={model.id}
            model={model}
            index={index}
            total={orderedModels.length}
            onMoveUp={() => moveModel(index, "up")}
            onMoveDown={() => moveModel(index, "down")}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface ModelItemCardProps {
  model: ModelInfo
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
}

function ModelItemCard({
  model,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: ModelItemCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-semibold text-sm">
        {index + 1}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage src={model.providerIcon} alt={model.providerName} />
          <AvatarFallback>
            {model.providerName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {model.modelName}
            </h4>
            <Badge variant="secondary" className="text-xs">
              {model.providerType}
            </Badge>
            {model.hasActiveCredentials ? (
              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">可用</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">无凭证</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            供应商: {model.providerName}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="h-8 w-8 p-0"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}