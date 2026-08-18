import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { TooltipProvider } from '../ui/tooltip'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'} hidden md:block`}>
          <Topbar onMenuToggle={() => setMobileOpen(true)} />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
        <div className="md:hidden">
          <Topbar onMenuToggle={() => setMobileOpen(true)} />
          <main className="p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
