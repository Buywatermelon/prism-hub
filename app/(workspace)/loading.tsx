import { Skeleton } from "@/components/ui/skeleton"

export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen w-full">
      {/* 侧边栏骨架 */}
      <div className="hidden border-r bg-muted/10 lg:block lg:w-64">
        <div className="flex h-full flex-col gap-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-4/5" />
        </div>
      </div>
      
      {/* 主内容区骨架 */}
      <div className="flex-1">
        {/* 顶部导航骨架 */}
        <div className="border-b px-6 py-3">
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* 内容区骨架 */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}