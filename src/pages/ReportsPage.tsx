import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  ReportFilterBar,
  KpiCard,
  ChartCard,
  SalesTrendChart,
  HourlyChart,
  WeekdayChart,
  CategoryChart,
  PaymentPieChart,
  CashFlowChart,
  ExportButtons,
  getQuickRange,
  DEFAULT_TZ,
  formatCurrencyBRL,
  formatNumberPtbr,
  formatVariation,
  variationPct,
  type AnalyticsFilters,
  type QuickRange,
  type TrendInterval,
  type PaymentMethodRow,
  type ProductRow,
  type CategoryRow,
} from '../features/analytics'
import {
  useAnalyticsSalesSummary,
  useAnalyticsSalesTrend,
  useAnalyticsSalesHourly,
  useAnalyticsSalesWeekday,
  useAnalyticsTopProducts,
  useAnalyticsCategorySales,
  useAnalyticsPaymentMethods,
  useAnalyticsCustomers,
  useAnalyticsInventory,
  useAnalyticsPurchasing,
  useAnalyticsAPAging,
  useAnalyticsARAging,
  useAnalyticsOrderStatus,
  useAnalyticsKitchen,
} from '../features/analytics'
import {
  useDRE,
  useFinanceOverview,
  useCashflowChart,
} from '../features/finance/hooks'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit_card: 'Cartão déb.',
  credit_card: 'Cartão créd.',
  other: 'Outro',
}

const productColumns = [
  { key: 'product_name', header: 'Produto' },
  { key: 'quantity', header: 'Qtd' },
  { key: 'revenue', header: 'Receita' },
  { key: 'share_pct', header: '% Part' },
]

const paymentColumns = [
  { key: 'method', header: 'Forma' },
  { key: 'count', header: 'Qtd' },
  { key: 'total', header: 'Total' },
  { key: 'share_pct', header: '% Part' },
]

function SalesTab({ filters }: { filters: AnalyticsFilters }) {
  const [interval, setInterval] = useState<TrendInterval>('day')
  const { data: summary, isLoading } = useAnalyticsSalesSummary(filters)
  const { data: trend } = useAnalyticsSalesTrend(filters, interval)
  const { data: hourly } = useAnalyticsSalesHourly(filters)
  const { data: weekday } = useAnalyticsSalesWeekday(filters)
  const { data: products } = useAnalyticsTopProducts(filters, 10)
  const { data: payments } = useAnalyticsPaymentMethods(filters)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard title="Receita bruta" loading={isLoading} value={summary ? formatCurrencyBRL(summary.gross_revenue) : '—'} previous={summary ? formatCurrencyBRL(summary.prev_gross_revenue) : undefined} variation={summary ? variationPct(summary.gross_revenue, summary.prev_gross_revenue) : undefined} />
        <KpiCard title="Descontos" loading={isLoading} value={summary ? formatCurrencyBRL(summary.discounts) : '—'} previous={summary ? formatCurrencyBRL(summary.prev_discounts) : undefined} variation={summary ? variationPct(summary.discounts, summary.prev_discounts) : undefined} />
        <KpiCard title="Receita líquida" loading={isLoading} value={summary ? formatCurrencyBRL(summary.net_revenue) : '—'} previous={summary ? formatCurrencyBRL(summary.prev_net_revenue) : undefined} variation={summary ? variationPct(summary.net_revenue, summary.prev_net_revenue) : undefined} />
        <KpiCard title="Pedidos" loading={isLoading} value={summary ? formatNumberPtbr(summary.orders) : '—'} previous={summary ? formatNumberPtbr(summary.prev_orders) : undefined} variation={summary ? variationPct(summary.orders, summary.prev_orders) : undefined} />
        <KpiCard title="Ticket médio" loading={isLoading} value={summary ? formatCurrencyBRL(summary.avg_ticket) : '—'} previous={summary ? formatCurrencyBRL(summary.prev_avg_ticket) : undefined} variation={summary ? variationPct(summary.avg_ticket, summary.prev_avg_ticket) : undefined} />
        <KpiCard title="Itens vendidos" loading={isLoading} value={summary ? formatNumberPtbr(summary.items_sold) : '—'} previous={summary ? formatNumberPtbr(summary.prev_items_sold) : undefined} variation={summary ? variationPct(summary.items_sold, summary.prev_items_sold) : undefined} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">Agrupar:</span>
        <Select value={interval} onValueChange={(v) => setInterval(v as TrendInterval)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Dia</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ChartCard title="Receita e pedidos por período" isEmpty={!trend || trend.length === 0}>
        <SalesTrendChart data={trend ?? []} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Vendas por hora" isEmpty={!hourly || hourly.length === 0}>
          <HourlyChart data={hourly ?? []} />
        </ChartCard>
        <ChartCard title="Vendas por dia da semana" isEmpty={!weekday || weekday.length === 0}>
          <WeekdayChart data={weekday ?? []} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Top produtos</CardTitle>
            <ExportButtons filename="produtos.csv" columns={productColumns} data={(products ?? []) as unknown as Record<string, unknown>[]} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
              <TableBody>
                {(products ?? []).map((p: ProductRow) => (
                  <TableRow key={p.product_id ?? p.product_name}>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell className="text-right">{formatNumberPtbr(p.quantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(p.revenue)}</TableCell>
                    <TableCell className="text-right">{formatVariation(p.share_pct)}</TableCell>
                  </TableRow>
                ))}
                {(products ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-[hsl(var(--muted-foreground))]">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Formas de pagamento</CardTitle>
            <ExportButtons filename="pagamentos.csv" columns={paymentColumns} data={(payments ?? []) as unknown as Record<string, unknown>[]} />
          </CardHeader>
          <CardContent>
            <ChartCard title="" isEmpty={!payments || payments.length === 0}>
              <PaymentPieChart data={payments ?? []} />
            </ChartCard>
            <Table>
              <TableHeader><TableRow><TableHead>Forma</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
              <TableBody>
                {(payments ?? []).map((m: PaymentMethodRow) => (
                  <TableRow key={m.method}>
                    <TableCell>{METHOD_LABELS[m.method] ?? m.method}</TableCell>
                    <TableCell className="text-right">{formatNumberPtbr(m.count)}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(m.total)}</TableCell>
                    <TableCell className="text-right">{formatVariation(m.share_pct)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProductsTab({ filters }: { filters: AnalyticsFilters }) {
  const { data: products } = useAnalyticsTopProducts(filters, 20)
  const { data: categories } = useAnalyticsCategorySales(filters)
  const catRows: CategoryRow[] = categories ?? []

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Receita por categoria" isEmpty={catRows.length === 0}>
        <CategoryChart data={catRows} />
      </ChartCard>
      <Card>
        <CardHeader><CardTitle className="text-base">Produtos por receita</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
            <TableBody>
              {(products ?? []).map((p: ProductRow) => (
                <TableRow key={p.product_id ?? p.product_name}>
                  <TableCell>{p.product_name}</TableCell>
                  <TableCell className="text-right">{formatNumberPtbr(p.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(p.revenue)}</TableCell>
                  <TableCell className="text-right">{formatVariation(p.share_pct)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function CustomersTab({ filters }: { filters: AnalyticsFilters }) {
  const { data: c } = useAnalyticsCustomers(filters)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Novos" value={c ? formatNumberPtbr(c.new_customers) : '—'} hint="no período" />
        <KpiCard title="Recorrentes" value={c ? formatNumberPtbr(c.returning_customers) : '—'} hint="já compraram antes" />
        <KpiCard title="Ativos" value={c ? formatNumberPtbr(c.active_customers) : '—'} hint="com pedido" />
        <KpiCard title="Ticket médio / cliente" value={c ? formatCurrencyBRL(c.avg_ticket_per_customer) : '—'} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Top clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Pedidos</TableHead><TableHead className="text-right">Receita</TableHead></TableRow></TableHeader>
            <TableBody>
              {(c?.top_customers ?? []).map((t) => (
                <TableRow key={t.customer_id}>
                  <TableCell>{t.name ?? 'Sem nome'}</TableCell>
                  <TableCell className="text-right">{formatNumberPtbr(t.orders)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(t.revenue)}</TableCell>
                </TableRow>
              ))}
              {(c?.top_customers ?? []).length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-[hsl(var(--muted-foreground))]">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function InventoryTab({ filters }: { filters: AnalyticsFilters }) {
  const { data: inv } = useAnalyticsInventory(filters.startDate, filters.endDate)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <KpiCard title="Valor estimado do estoque" value={inv ? formatCurrencyBRL(inv.estimated_value) : '—'} hint="estimado" />
      <KpiCard title="Itens abaixo do mínimo" value={inv ? formatNumberPtbr(inv.low_stock.length) : '—'} />
      <KpiCard title="Itens sem estoque" value={inv ? formatNumberPtbr(inv.out_of_stock.length) : '—'} />
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle className="text-base">Abaixo do mínimo / sem estoque</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Ingrediente</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Mínimo</TableHead><TableRow /></TableRow></TableHeader>
            <TableBody>
              {[...(inv?.low_stock ?? []), ...(inv?.out_of_stock ?? [])].map((s) => (
                <TableRow key={s.ingredient_id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-right">{formatNumberPtbr(s.quantity)}</TableCell>
                  <TableCell className="text-right">{formatNumberPtbr(s.minimum_quantity ?? 0)}</TableCell>
                </TableRow>
              ))}
              {(!inv || (inv.low_stock.length === 0 && inv.out_of_stock.length === 0)) && (
                <TableRow><TableCell colSpan={3} className="text-center text-[hsl(var(--muted-foreground))]">Nenhum item crítico</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function PurchasingTab({ filters }: { filters: AnalyticsFilters }) {
  const { data: p } = useAnalyticsPurchasing(filters)
  const top = p?.top_supplier?.[0]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard title="Total comprado" value={p ? formatCurrencyBRL(p.total_purchased) : '—'} />
        <KpiCard title="Pedidos de compra" value={p ? formatNumberPtbr(p.po_count) : '—'} />
        <KpiCard title="Principal fornecedor" value={top ? (top.name ?? '—') : '—'} hint={top ? formatCurrencyBRL(top.total) : undefined} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Itens mais comprados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Ingrediente</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {(p?.top_items ?? []).map((i) => (
                <TableRow key={i.ingredient_name}>
                  <TableCell>{i.ingredient_name}</TableCell>
                  <TableCell className="text-right">{formatNumberPtbr(i.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(i.total)}</TableCell>
                </TableRow>
              ))}
              {(p?.top_items ?? []).length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-[hsl(var(--muted-foreground))]">Sem compras no período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function FinanceTab({ filters }: { filters: AnalyticsFilters }) {
  const { data: dre, isLoading } = useDRE(filters.startDate, filters.endDate)
  const { data: overview } = useFinanceOverview()
  const { data: cashflow } = useCashflowChart(30)
  const cashflowPoints = (cashflow ?? []).map((d) => ({
    bucket: d.date,
    income: d.in,
    expense: d.out,
    net: d.in - d.out,
  }))
  const { data: ap } = useAnalyticsAPAging()
  const { data: ar } = useAnalyticsARAging()
  const d = dre || { revenue_gross: 0, revenue_reversals: 0, revenue_net: 0, cogs_estimated: 0, operating_expenses_manual: 0, operating_result: 0 }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">DRE Simplificado (CMV estimado)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <div className="h-32 animate-pulse rounded bg-[hsl(var(--muted))]" /> : (
            <>
              <Row label="Receita Bruta" value={formatCurrencyBRL(d.revenue_gross)} />
              {d.revenue_reversals > 0 && <Row label="(-) Estornos" value={formatCurrencyBRL(d.revenue_reversals)} negative />}
              <Row label="= Receita Líquida" value={formatCurrencyBRL(d.revenue_net)} bold />
              {d.cogs_estimated > 0 && <Row label="(-) CMV Estimado (compras)" value={formatCurrencyBRL(d.cogs_estimated)} negative />}
              {d.operating_expenses_manual > 0 && <Row label="(-) Despesas Operacionais" value={formatCurrencyBRL(d.operating_expenses_manual)} negative />}
              <Row label="= Resultado Operacional" value={formatCurrencyBRL(d.operating_result)} bold result={d.operating_result} />
            </>
          )}
        </CardContent>
      </Card>

      <ChartCard title="Fluxo de caixa (30 dias)" isEmpty={cashflowPoints.length === 0}>
        <CashFlowChart data={cashflowPoints} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Aging Contas a Pagar</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="A vencer" value={formatCurrencyBRL(ap?.current ?? 0)} />
            <Row label="1–7 dias vencidas" value={formatCurrencyBRL(ap?.d1_7 ?? 0)} negative />
            <Row label="8–30 dias vencidas" value={formatCurrencyBRL(ap?.d8_30 ?? 0)} negative />
            <Row label="31+ dias vencidas" value={formatCurrencyBRL(ap?.d31plus ?? 0)} negative />
            <Row label="Em aberto (AP)" value={formatCurrencyBRL(overview?.open_payables ?? 0)} />
            <Row label="Vencidas (AP)" value={formatCurrencyBRL(overview?.overdue_payables ?? 0)} negative />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Aging Contas a Receber</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="A receber" value={formatCurrencyBRL(ar?.current ?? 0)} />
            <Row label="1–7 dias vencidas" value={formatCurrencyBRL(ar?.d1_7 ?? 0)} negative />
            <Row label="8–30 dias vencidas" value={formatCurrencyBRL(ar?.d8_30 ?? 0)} negative />
            <Row label="31+ dias vencidas" value={formatCurrencyBRL(ar?.d31plus ?? 0)} negative />
            <Row label="Em aberto (AR)" value={formatCurrencyBRL(overview?.open_receivables ?? 0)} />
            <Row label="Vencidas (AR)" value={formatCurrencyBRL(overview?.overdue_receivables ?? 0)} negative />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, bold, negative, result }: { label: string; value: string; bold?: boolean; negative?: boolean; result?: number }) {
  const color = result !== undefined ? (result >= 0 ? 'text-emerald-600' : 'text-red-600') : negative ? 'text-red-600' : undefined
  return (
    <div className={`flex justify-between py-1 ${bold ? 'border-t-2 font-bold' : 'border-b'}`}>
      <span className={bold ? '' : 'text-[hsl(var(--muted-foreground))]'}>{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}

function KitchenTab({ filters }: { filters: AnalyticsFilters }) {
  const { data: status } = useAnalyticsOrderStatus(filters)
  const { data: kitchen } = useAnalyticsKitchen(filters)
  const STATUS_LABELS: Record<string, string> = {
    open: 'Aberto', confirmed: 'Confirmado', preparing: 'Em preparo', ready: 'Pronto', completed: 'Concluído', cancelled: 'Cancelado',
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Pedidos por status</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Qtd</TableHead></TableRow></TableHeader>
            <TableBody>
              {(status ?? []).map((s) => (
                <TableRow key={s.status}><TableCell>{STATUS_LABELS[s.status] ?? s.status}</TableCell><TableCell className="text-right">{formatNumberPtbr(s.count)}</TableCell></TableRow>
              ))}
              {(status ?? []).length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-[hsl(var(--muted-foreground))]">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="Confirmado → Pronto" value={kitchen?.avg_confirm_to_ready_sec != null ? `${Math.round((kitchen.avg_confirm_to_ready_sec ?? 0) / 60)} min` : 'N/D'} hint={kitchen?.available ? undefined : 'sem timestamps'} />
        <KpiCard title="Pronto → Concluído" value={kitchen?.avg_ready_to_complete_sec != null ? `${Math.round((kitchen.avg_ready_to_complete_sec ?? 0) / 60)} min` : 'N/D'} hint={kitchen?.available ? undefined : 'sem timestamps'} />
        <KpiCard title="Confirmado → Concluído" value={kitchen?.avg_confirm_to_complete_sec != null ? `${Math.round((kitchen.avg_confirm_to_complete_sec ?? 0) / 60)} min` : 'N/D'} hint={kitchen?.available ? undefined : 'sem timestamps'} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [range, setRange] = useState<QuickRange>('last30')
  const initial = getQuickRange('last30')
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [compare, setCompare] = useState(true)
  const tz = DEFAULT_TZ
  const filters: AnalyticsFilters = { startDate, endDate, timezone: tz, compare }

  const refresh = () => {
    const r = getQuickRange(range)
    setStartDate(r.startDate)
    setEndDate(r.endDate)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Analytics reais por período</p>
      </div>

      <ReportFilterBar
        range={range}
        onRangeChange={setRange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        compare={compare}
        onCompareChange={setCompare}
        onRefresh={refresh}
      />

      <Tabs defaultValue="vendas">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="cozinha">Cozinha</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas"><SalesTab filters={filters} /></TabsContent>
        <TabsContent value="produtos"><ProductsTab filters={filters} /></TabsContent>
        <TabsContent value="clientes"><CustomersTab filters={filters} /></TabsContent>
        <TabsContent value="estoque"><InventoryTab filters={filters} /></TabsContent>
        <TabsContent value="compras"><PurchasingTab filters={filters} /></TabsContent>
        <TabsContent value="financeiro"><FinanceTab filters={filters} /></TabsContent>
        <TabsContent value="cozinha"><KitchenTab filters={filters} /></TabsContent>
      </Tabs>
    </div>
  )
}
