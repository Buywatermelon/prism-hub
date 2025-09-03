"use server"

import { Result, Ok } from '@/lib/result'
import type { AppError } from '@/lib/result'

// OpenRouter 模型类型定义
export interface Model {
  id: string
  name: string
  description?: string
  context_length?: number
  max_tokens?: number
  provider?: string
  pricing?: {
    prompt: number
    completion: number
  }
  created?: number
}

export interface ModelsPageResult {
  models: Model[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 获取 OpenRouter 模型列表
 * 这是一个占位函数，实际实现需要调用 OpenRouter API
 */
export async function getModels(
  page: number = 1,
  pageSize: number = 20,
  search: string = ''
): Promise<Result<ModelsPageResult, AppError>> {
  // 暂时返回空数据，避免构建错误
  // TODO: 实现 OpenRouter API 调用
  const emptyResult: ModelsPageResult = {
    models: [],
    totalCount: 0,
    page,
    pageSize,
    totalPages: 0
  }
  
  return Ok(emptyResult)
}