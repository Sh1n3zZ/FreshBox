import { Outlet } from 'react-router-dom'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/providers/auth-provider'
import { useState } from 'react'

const MainLayout = () => {
  const { isAuthenticated } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}
        
        <main className="flex-1 p-4 md:p-6 mx-auto w-full">
          <Outlet />
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default MainLayout 