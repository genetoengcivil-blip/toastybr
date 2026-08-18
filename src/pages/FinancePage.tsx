import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import OverviewTab from '../features/finance/components/OverviewTab'
import PayablesTab from '../features/finance/components/PayablesTab'
import ReceivablesTab from '../features/finance/components/ReceivablesTab'
import TransactionsTab from '../features/finance/components/TransactionsTab'
import CategoriesTab from '../features/finance/components/CategoriesTab'

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Gestão financeira e fluxo de caixa</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="payables">Contas a pagar</TabsTrigger>
          <TabsTrigger value="receivables">Contas a receber</TabsTrigger>
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="payables"><PayablesTab /></TabsContent>
        <TabsContent value="receivables"><ReceivablesTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
