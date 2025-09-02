'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface StickyHeaderTableProps {
  children: React.ReactNode
  className?: string
}

// 简单的固定表头表格组件
export function StickyHeaderTable({ children, className }: StickyHeaderTableProps) {
  return (
    <div className={cn('flex-1 min-h-0 rounded-md border bg-white dark:bg-gray-950 flex flex-col', className)}>
      {children}
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  columns: string[]  // 列宽定义，如 ['w-2/5', 'w-1/6', 'w-1/6', 'w-1/6', 'w-[120px]']
}

export function TableHeader({ children, columns }: TableHeaderProps) {
  return (
    <table className="w-full table-fixed">
      <colgroup>
        {columns.map((width, index) => (
          <col key={index} className={width} />
        ))}
      </colgroup>
      <thead className="border-b bg-gray-50 dark:bg-gray-900">
        {children}
      </thead>
    </table>
  )
}

interface TableBodyProps {
  children: React.ReactNode
  columns: string[]  // 与表头相同的列宽定义
}

export function TableBody({ children, columns }: TableBodyProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full table-fixed">
        <colgroup>
          {columns.map((width, index) => (
            <col key={index} className={width} />
          ))}
        </colgroup>
        <tbody className="divide-y">
          {children}
        </tbody>
      </table>
    </div>
  )
}