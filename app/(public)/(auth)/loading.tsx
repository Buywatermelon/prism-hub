import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 px-4">
        {/* Logo/标题骨架 */}
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        {/* 表单骨架 */}
        <div className="space-y-4 rounded-lg border bg-card p-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        {/* 底部链接骨架 */}
        <div className="flex justify-center">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}