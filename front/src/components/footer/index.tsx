import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 py-6 md:flex-row md:py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/vite.svg" alt="FreshBox" className="h-6 w-6" />
            <span className="text-xl font-bold">FreshBox</span>
          </Link>
          
          <nav className="flex gap-4 md:gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              首页
            </Link>
            <Link
              to="/ocr"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              OCR识别
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              关于我们
            </Link>
            <Link
              to="/auth/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              登录
            </Link>
          </nav>
        </div>
        
        <div className="text-center text-sm text-muted-foreground md:text-right">
          © {new Date().getFullYear()} FreshBox. 保留所有权利。
        </div>
      </div>
    </footer>
  )
}
