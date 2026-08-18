import { Plus, Search } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import OverviewTab from '../features/finance/components/OverviewTab'
import PayablesTab from '../features/finance/components/PayablesTab'
import ReceivablesTab from '../features/finance/components/ReceivablesTab'
import TransactionsTab from '../features/finance/components/TransactionsTab'
import CategoriesTab from '../features/finance/components/CategoriesTab'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useCurrentOrganization } from '../features/auth/context'
import type { UserRole } from '../lib/supabase/types'

export default function FinancePage() {
  const { role } = useCurrentOrganization()
  const isFinanceAdmin = role === 'owner' || role === 'admin' || role === 'manager' || role === 'accountant'
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display">Financeiro</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Gestão financeira e fluxo de caixa
          </p>
        </div>
        {isFinanceAdmin && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Add finance-specific actions if needed
              }}
              className="hover-lift"
            >
              <Plus size={16} className="mr-2 h-4 w-4" />
              Novo lançamento
            </Button>
            <div className="relative w-48">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4"
              />
              <Input
                placeholder="Buscar lançamentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-[repeat(5,minmax(0,1fr))] text-sm font-medium">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="payables">Contas a pagar</TabsTrigger>
          <TabsTrigger value="receivables">Contas a receber</TabsTrigger>
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="payables"><PayablesTab /></TabsContent>
        <TabsContent value="receivables"><ReceivablesTab /></TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab search={search} />
        </TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
      </Tabs>
    </div>
  )
}