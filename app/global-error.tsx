'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 记录到错误跟踪服务
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">系统错误</h1>
            <p className="mb-6 text-gray-600">
              抱歉，应用程序遇到了意外错误。请刷新页面重试。
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>重试</Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                返回首页
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left">
                <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}