import { Outlet } from 'react-router-dom'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { Footer } from './footer'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
