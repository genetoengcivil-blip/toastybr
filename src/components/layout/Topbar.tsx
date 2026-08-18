import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Sun, Moon, LogOut, User, Settings, Package, Users } from 'lucide-react'
import { useAuth, useCurrentOrganization } from '../../features/auth/context'
import { useTheme } from '../../lib/use-theme'
import { Button } from '../ui/button'
import { AvatarFallback } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuth()
  const { organization } = useCurrentOrganization()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'TO'

  return (
    <header className="h-12 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 backdrop-blur transition-all duration-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
          <Menu size={18} />
        </Button>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
          <span>{organization?.name ?? 'Toasty OS'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/20 transition-colors duration-200">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
            <Bell size={18} />
            <span className="absolute top-0 right-0 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[hsl(var(--destructive))] ring-2 ring-[hsl(var(--background))]">9+</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-[hsl(var(--border))] shadow-lg p-2 bg-[hsl(var(--card))]">
            <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
              Notificações
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))]/10 focus:bg-[hsl(var(--accent))]/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent-foreground))]">
                <Package size={14} />
              </div>
              <div className="flex-1">
                <span className="font-medium">Pedido #1234 pronto para retirada</span>
                <span className="block text-xs text-[hsl(var(--muted-foreground))]">Há 2 minutos</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[hsl(var(--accent))]/10 focus:bg-[hsl(var(--accent))]/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent-foreground))]">
                <Users size={14} />
              </div>
              <div className="flex-1">
                <span className="font-medium">Nova avaliação recebida</span>
                <span className="block text-xs text-[hsl(var(--muted-foreground))]">Cliente: Maria Silva</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              Marcar todas como lidas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/20 transition-colors duration-200" onClick={() => navigate('/settings')}>
            <Settings size={18} />
          </Button>
        </div>
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-[hsl(var(--muted))]/20 transition-all duration-200 hover:bg-[hsl(var(--muted))]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
              <AvatarFallback className="h-10 w-10 text-[hsl(var(--foreground))] font-medium">{initials}</AvatarFallback>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-[hsl(var(--border))] shadow-lg p-2 bg-[hsl(var(--card))] mt-2">
              <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                Olá, {user?.email?.split('@')[0] ?? 'Usuário'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <User className="h-4 w-4 mr-2" /> Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <Settings className="h-4 w-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
