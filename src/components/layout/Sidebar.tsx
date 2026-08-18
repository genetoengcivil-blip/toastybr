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
  Store,
  X,
} from 'lucide-react'
import { useCurrentOrganization } from '../../features/auth/context'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ScrollArea } from '../ui/scroll-area'
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

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const grouped = navigation.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] flex items-center justify-center shadow-sm">
                <Store className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[hsl(var(--sidebar-accent))] border-2 border-[hsl(var(--sidebar-bg))]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[hsl(var(--sidebar-fg))] font-semibold text-sm tracking-tight leading-none">Toasty OS</span>
              <span className="text-[10px] text-[hsl(var(--sidebar-muted))] tracking-wide mt-0.5">Restaurant OS</span>
            </div>
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

      {/* Organization context (mobile only) */}
      {organization && !collapsed && (
        <div className="md:hidden px-4 py-3 border-b border-[hsl(var(--sidebar-border))]">
          <p className="text-xs text-[hsl(var(--sidebar-muted))] truncate">{organization.name}</p>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        {Object.entries(grouped).map(([group, items], groupIndex) => (
          <div key={group} className={groupIndex > 0 ? 'mt-6' : ''}>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-muted))]">
                {group}
              </p>
            )}
            <div className="space-y-1">
              {items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon

                const linkClasses = cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-[hsl(var(--sidebar-accent))]/15 text-[hsl(var(--sidebar-fg))]'
                    : 'text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-fg))]/5'
                )

                const content = (
                  <>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[hsl(var(--sidebar-accent))]" />
                    )}
                    <Icon
                      size={18}
                      className={cn(
                        'shrink-0 transition-colors',
                        active ? 'text-[hsl(var(--sidebar-accent))]' : 'group-hover:text-[hsl(var(--sidebar-fg))]'
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
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
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
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

      {/* Footer / collapsed version toggle for mobile */}
      {collapsed && (
        <div className="md:hidden p-3 border-t border-[hsl(var(--sidebar-border))]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="h-8 w-8 text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] mx-auto"
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] transition-all duration-300 hidden md:flex flex-col border-r border-[hsl(var(--sidebar-border))]',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}