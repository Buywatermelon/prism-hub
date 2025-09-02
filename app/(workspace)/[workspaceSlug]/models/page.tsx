import { Suspense } from 'react'
import { getModels } from '@/app/actions/models'
import { unwrap } from '@/lib/result'
import { ModelsList } from './_components/models-list'

export default async function ModelsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string; pageSize?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const search = params.search || ''
  
  const result = await unwrap(getModels(page, pageSize, search))
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">模型管理</h1>
        <p className="text-gray-600 dark:text-gray-400">浏览和搜索 OpenRouter 支持的 AI 模型</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <Suspense fallback={<div>加载中...</div>}>
          <ModelsList 
            initialData={result}
            currentPage={page}
            searchTerm={search}
          />
        </Suspense>
      </div>
    </div>
  )
}