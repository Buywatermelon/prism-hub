'use client'

import { useState, useEffect } from 'react'
import { useCurrentWorkspace } from '@/hooks/use-workspace'
import type { WorkspaceMember, MemberStatus, MemberRole } from './actions'
import { getMembers, approveMember, rejectMember, updateMemberRole, removeMember } from './actions'
import { useToast } from '@/components/ui/use-toast'
import {
  Users2,
  MoreHorizontal,
  Crown,
  Shield,
  User,
  Check,
  X,
  Search,
  Filter,
  Mail,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const roleConfig = {
  owner: {
    label: '所有者',
    icon: Crown,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  admin: {
    label: '管理员',
    icon: Shield,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  member: {
    label: '成员',
    icon: User,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  },
}

export default function MembersPage() {
  const currentWorkspace = useCurrentWorkspace()
  const { toast } = useToast()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers()
    }
  }, [currentWorkspace])

  const loadMembers = async () => {
    if (!currentWorkspace) return

    try {
      setLoading(true)
      const [activeMembers, pendingApplications] = await Promise.all([
        getMembers(currentWorkspace.workspace.id, ['active']),
        getMembers(currentWorkspace.workspace.id, ['pending'])
      ])

      setMembers(activeMembers)
      setPendingMembers(pendingApplications)
    } catch (error) {
      console.error('Failed to load members:', error)
      const msg = error instanceof Error ? error.message : '加载成员列表失败'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter((member) => {
    const userEmail = member.user?.email || ''
    const userName = member.user?.user_metadata?.full_name || userEmail
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleApproveApplication = async (membershipId: string) => {
    if (!currentWorkspace) return

    try {
      await approveMember(currentWorkspace.workspace.id, membershipId)
      toast({ description: '已批准加入申请' })
      loadMembers()
    } catch (error) {
      console.error('Failed to approve member:', error)
      const msg = error instanceof Error ? error.message : '批准申请失败'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  const handleRejectApplication = async (membershipId: string) => {
    if (!currentWorkspace) return

    try {
      await rejectMember(currentWorkspace.workspace.id, membershipId)
      toast({ description: '已拒绝加入申请' })
      loadMembers()
    } catch (error) {
      console.error('Failed to reject member:', error)
      const msg = error instanceof Error ? error.message : '拒绝申请失败'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  const handleChangeRole = async (membershipId: string, newRole: Exclude<MemberRole, 'owner'>) => {
    if (!currentWorkspace) return

    try {
      await updateMemberRole(currentWorkspace.workspace.id, membershipId, newRole)
      toast({ description: '角色已更新' })
      loadMembers()
    } catch (error) {
      console.error('Failed to update role:', error)
      const msg = error instanceof Error ? error.message : '更新角色失败'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  const handleRemoveMember = async (membershipId: string) => {
    if (!currentWorkspace) return

    try {
      const result = await removeMember(currentWorkspace.workspace.id, membershipId)
      toast({ description: result.message || '成员已移除' })
      loadMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
      const msg = error instanceof Error ? error.message : '移除成员失败'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '从未登录'

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return '刚刚'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} 天前`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} 周前`
    return `${Math.floor(diffInSeconds / 2592000)} 个月前`
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email ? email[0].toUpperCase() : '?'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">团队成员</h1>
        <p className="text-gray-600 dark:text-gray-400">管理团队成员和处理加入申请</p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            成员 ({members.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            申请 ({pendingMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索成员姓名或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有角色</SelectItem>
                    <SelectItem value="owner">所有者</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="member">成员</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">非活跃</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredMembers.map((member) => {
              const RoleIcon = roleConfig[member.role as keyof typeof roleConfig].icon
              // 使用返回的用户信息
              const userEmail = member.user?.email || ''
              const userName = member.user?.user_metadata?.full_name || member.user?.email || 'Unknown User'
              const userAvatar = member.user?.user_metadata?.avatar_url

              return (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userAvatar} alt={userName} />
                          <AvatarFallback>{getInitials(userName, userEmail)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{userName}</h3>
                            <Badge className={roleConfig[member.role as keyof typeof roleConfig].color}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleConfig[member.role as keyof typeof roleConfig].label}
                            </Badge>
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                              {member.status === 'active' ? '活跃' : '非活跃'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              加入于 {formatDate(member.joined_at)}
                            </span>
                            <span>最后活跃: {formatRelativeTime(member.user?.last_sign_in_at)}</span>
                          </div>
                        </div>
                      </div>
                      {member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleChangeRole(member.id, member.role === 'admin' ? 'member' : 'admin')}>
                              {member.role === 'admin' ? '降级为成员' : '升级为管理员'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              移除成员
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>待处理申请</CardTitle>
              <CardDescription>审核用户的加入团队申请，您可以批准或拒绝这些申请。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无申请</h3>
                  <p className="text-gray-600 dark:text-gray-400">目前没有待处理的加入申请。</p>
                </div>
              ) : (
                pendingMembers.map((application) => {
                  const userEmail = application.user?.email || ''
                  const userName = application.user?.user_metadata?.full_name || application.user?.email || 'Unknown User'
                  const userAvatar = application.user?.user_metadata?.avatar_url

                  return (
                    <Card key={application.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={userAvatar} alt={userName} />
                              <AvatarFallback>{getInitials(userName, userEmail)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{userName}</h3>
                                <Badge variant="outline">新申请</Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{userEmail}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                申请时间: {formatDate(application.applied_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectApplication(application.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4 mr-1" />
                              拒绝
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveApplication(application.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              批准
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
