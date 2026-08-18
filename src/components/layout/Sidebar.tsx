import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  ChefHat,
  UtensilsCrossed,
  Wheat,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Megaphone,
  UserCog,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useCurrentOrganization } from '../../features/auth/context'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  group: string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Principal' },
  { name: 'PDV', href: '/pos', icon: CreditCard, group: 'Principal' },
  { name: 'Pedidos', href: '/orders', icon: ClipboardList, group: 'Principal' },
  { name: 'Cozinha', href: '/kitchen', icon: ChefHat, group: 'Principal' },
  { name: 'Cardápio', href: '/menu', icon: UtensilsCrossed, group: 'Gestão' },
  { name: 'Ingredientes', href: '/ingredients', icon: Wheat, group: 'Gestão' },
  { name: 'Estoque', href: '/inventory', icon: Package, group: 'Gestão' },
  { name: 'Compras', href: '/purchasing', icon: ShoppingCart, group: 'Gestão' },
  { name: 'Financeiro', href: '/finance', icon: DollarSign, group: 'Gestão' },
  { name: 'Clientes', href: '/customers', icon: Users, group: 'Relacionamento' },
  { name: 'Marketing', href: '/marketing', icon: Megaphone, group: 'Relacionamento' },
  { name: 'Equipe', href: '/staff', icon: UserCog, group: 'Operação' },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, group: 'Operação' },
  { name: 'Configurações', href: '/settings', icon: Settings, group: 'Sistema' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { organization } = useCurrentOrganization()

  const grouped = navigation.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[hsl(var(--sidebar-accent))] flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-[hsl(var(--sidebar-fg))] font-semibold text-sm tracking-tight">Toasty OS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-fg))]/10 hidden md:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>

      {organization && !collapsed && (
        <div className="px-4 py-3 border-b border-[hsl(var(--sidebar-border))]">
          <p className="text-xs text-[hsl(var(--sidebar-muted))] truncate">{organization.name}</p>
        </div>
      )}

      <ScrollArea className="flex-1 py-2">
        {Object.entries(grouped).map(([group, items], groupIndex) => (
          <div key={group}>
            {groupIndex > 0 && <Separator className="my-2 mx-4 w-auto" />}
            {!collapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-muted))]">
                {group}
              </p>
            )}
            <div className="space-y-0.5 px-2">
              {items.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon

                const linkClasses = cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-[hsl(var(--sidebar-accent))]/10 text-[hsl(var(--sidebar-accent))]'
                    : 'text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-fg))]/5'
                )

                const content = (
                  <>
                    <Icon size={18} className={isActive ? 'text-[hsl(var(--sidebar-accent))]' : ''} />
                    {!collapsed && <span>{item.name}</span>}
                  </>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <Link to={item.href} className={linkClasses}>
                          {content}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <Link key={item.name} to={item.href} className={linkClasses}>
                    {content}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] transition-all duration-300 hidden md:flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
