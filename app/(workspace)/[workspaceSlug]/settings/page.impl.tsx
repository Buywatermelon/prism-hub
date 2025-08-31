'use client'

import { useState, useEffect } from 'react'
import { Settings, Users, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { updateWorkspace as updateWorkspaceAction } from './actions'
import { useAbility } from '@/hooks'
import type { WorkspaceMembership } from '@/lib/data/workspace'

interface WorkspaceSettings {
  name: string
  description: string
  requireApproval: boolean
}

interface SettingsClientProps {
  workspace: WorkspaceMembership
}

export default function SettingsClient({ workspace }: SettingsClientProps) {
  const ability = useAbility()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // 初始化设置，直接从 props 获取
  const [settings, setSettings] = useState<WorkspaceSettings>({
    name: workspace.workspace.name,
    description: workspace.workspace.description || '',
    requireApproval: (workspace.workspace.settings as any)?.require_approval || false,
  })
  const [initialSettings, setInitialSettings] = useState<WorkspaceSettings>(settings)

  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)
    setHasUnsavedChanges(hasChanges)
  }, [settings, initialSettings])

  const handleSettingChange = (key: keyof WorkspaceSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateWorkspaceAction(workspace.workspace.id, {
        name: settings.name,
        description: settings.description,
        settings: { require_approval: settings.requireApproval },
      })

      setInitialSettings(settings)
      setHasUnsavedChanges(false)
      toast({ description: '工作空间设置已更新' })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({ title: '保存设置失败', description: error instanceof Error ? error.message : undefined, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">工作空间设置</h1>
          <p className="text-gray-600 dark:text-gray-400">管理工作空间的基本信息和配置</p>
        </div>
        {hasUnsavedChanges && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            有未保存的更改
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              基本信息
            </CardTitle>
            <CardDescription>配置工作空间的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">工作空间名称</Label>
              <Input
                id="workspace-name"
                value={settings.name}
                onChange={(e) => handleSettingChange('name', e.target.value)}
                placeholder="输入工作空间名称"
                disabled={!ability?.can('update', 'Settings')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-description">工作空间描述</Label>
              <Textarea
                id="workspace-description"
                value={settings.description}
                onChange={(e) => handleSettingChange('description', e.target.value)}
                placeholder="描述工作空间的用途和目标"
                rows={3}
                disabled={!ability?.can('update', 'Settings')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              成员加入设置
            </CardTitle>
            <CardDescription>控制新成员如何加入工作空间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>需要审批才能加入</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  开启后，新成员需要管理员批准才能加入工作空间
                </p>
              </div>
              <Switch
                checked={settings.requireApproval}
                onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
                disabled={!ability?.can('update', 'Settings')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {ability?.can('update', 'Settings') && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4 -mx-6 mt-8">
          <div className="max-w-4xl mx-auto flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isLoading}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

