import { useRoutes } from 'react-router-dom'
import { Suspense } from 'react'
import routes from './routes'
import { ThemeProvider } from './providers/theme-provider'
import { AuthProvider } from './providers/auth-provider'

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
  </div>
)

function App() {
  const routeElements = useRoutes(routes)

  return (
    <ThemeProvider defaultTheme="light" storageKey="freshbox-theme">
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          {routeElements}
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
