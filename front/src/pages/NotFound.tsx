import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-8xl font-bold tracking-tighter text-primary">404</h1>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">页面未找到</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页继续浏览。
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        返回首页
      </Link>
    </div>
  )
}
