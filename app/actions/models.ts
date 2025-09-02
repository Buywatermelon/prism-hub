'use server'

import { createClient } from '@/lib/supabase/server'
import { Result, Ok, Err, createError } from '@/lib/result'
import type { AppError } from '@/lib/errors'

export interface Model {
  id: string
  canonical_slug: string | null
  hugging_face_id: string | null
  name: string
  created: number | null
  description: string | null
  context_length: number | null
  architecture: any
  pricing: any
  top_provider: any
  per_request_limits: any
  supported_parameters: string[] | null
  last_synced_at: string
}

export interface ModelsPageResult {
  models: Model[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getModels(
  page: number = 1,
  pageSize: number = 20,
  searchTerm?: string
): Promise<Result<ModelsPageResult, AppError>> {
  try {
    const supabase = await createClient()
    
    // 计算偏移量
    const offset = (page - 1) * pageSize
    
    // 构建查询
    let query = supabase
      .from('models')
      .select('*', { count: 'exact' })
    
    // 搜索功能
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
    }
    
    // 分页和排序
    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1)
    
    if (error) {
      console.error('[GetModels] Database error:', error)
      return Err(createError('DATABASE_ERROR', '获取模型列表失败'))
    }
    
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pageSize)
    
    return Ok({
      models: data || [],
      totalCount,
      page,
      pageSize,
      totalPages
    })
  } catch (error) {
    console.error('[GetModels] Unexpected error:', error)
    return Err(createError('INTERNAL_ERROR', '获取模型列表时发生错误'))
  }
}