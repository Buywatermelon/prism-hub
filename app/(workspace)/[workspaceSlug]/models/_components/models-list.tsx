'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ModelsPageResult } from '@/app/actions/models'
import { SearchInput } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Brain, Hash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StickyHeaderTable, TableHeader, TableBody } from '@/components/ui/sticky-header-table'

interface ModelsListProps {
  initialData: ModelsPageResult
  currentPage: number
  searchTerm: string
}

export function ModelsList({ initialData, currentPage, searchTerm }: ModelsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchTerm)
  const [isPending, startTransition] = useTransition()
  const [selectedModel, setSelectedModel] = useState<any>(null)
  const currentPageSize = searchParams.get('pageSize') || '20'

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handlePageSizeChange = (pageSize: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('pageSize', pageSize)
    params.set('page', '1') // Reset to first page when changing page size
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }


  const formatPrice = (price: string | number | null) => {
    if (!price) return '-'
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (num === 0) return '免费'
    if (num < 0.000001) return '<$0.000001'
    return `$${num.toFixed(6)}`
  }

  const formatContextLength = (length: number | null) => {
    if (!length) return '-'
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
    return length.toString()
  }

  // 定义列宽
  const columnWidths = ['w-2/5', 'w-1/6', 'w-1/6', 'w-1/6', 'w-[120px]']

  return (
    <div className="h-full flex flex-col gap-6">
      <SearchInput
        placeholder="搜索模型名称或 ID..."
        value={search}
        onValueChange={setSearch}
        onSearch={handleSearch}
        disabled={isPending}
        className="flex-shrink-0"
      />

      <StickyHeaderTable>
        <TableHeader columns={columnWidths}>
          <tr>
            <th className="text-left p-4 font-medium text-sm">模型名称</th>
            <th className="text-left p-4 font-medium text-sm whitespace-nowrap">上下文长度</th>
            <th className="text-left p-4 font-medium text-sm whitespace-nowrap">输入价格</th>
            <th className="text-left p-4 font-medium text-sm whitespace-nowrap">输出价格</th>
            <th className="text-left p-4 font-medium text-sm">操作</th>
          </tr>
        </TableHeader>
        <TableBody columns={columnWidths}>
              {initialData.models.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="p-4">
                    <div className="min-w-[200px] max-w-[400px]">
                      <div className="font-medium truncate">{model.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{model.id}</div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <Badge variant="secondary">
                      <Hash className="h-3 w-3 mr-1" />
                      {formatContextLength(model.context_length)}
                    </Badge>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="text-sm font-mono">
                      {formatPrice(model.pricing?.prompt)}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="text-sm font-mono">
                      {formatPrice(model.pricing?.completion)}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedModel(model)}
                    >
                      查看详情
                    </Button>
                  </td>
                </tr>
              ))}
              {initialData.models.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">暂无模型数据</p>
                  </td>
                </tr>
              )}
        </TableBody>
      </StickyHeaderTable>

      {(initialData.totalCount > 0) && (
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <span>每页</span>
            <Select value={currentPageSize} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>条</span>
          </div>
          
          {initialData.totalPages > 1 && (
            <Pagination className="mx-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(5, initialData.totalPages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                
                {initialData.totalPages > 5 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage >= initialData.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            共 {initialData.totalCount} 条
          </div>
        </div>
      )}

      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedModel?.name}</DialogTitle>
            <DialogDescription>{selectedModel?.id}</DialogDescription>
          </DialogHeader>
          
          {selectedModel && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">描述</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedModel.description || '暂无描述'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">基本信息</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">上下文长度</dt>
                    <dd className="font-medium">{formatContextLength(selectedModel.context_length)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">创建时间</dt>
                    <dd className="font-medium">
                      {selectedModel.created ? new Date(selectedModel.created * 1000).toLocaleDateString() : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">定价</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">输入价格</dt>
                    <dd className="font-medium font-mono">{formatPrice(selectedModel.pricing?.prompt)}/token</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">输出价格</dt>
                    <dd className="font-medium font-mono">{formatPrice(selectedModel.pricing?.completion)}/token</dd>
                  </div>
                </dl>
              </div>
              
              {selectedModel.supported_parameters && selectedModel.supported_parameters.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">支持的参数</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.supported_parameters.map((param: string) => (
                      <Badge key={param} variant="outline">
                        {param}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}