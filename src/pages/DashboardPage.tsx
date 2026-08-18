import { useCurrentOrganization } from '../features/auth/context'
import { useOrdersRealtime } from '../features/sales/realtime/useOrdersRealtime'
import {
  DEFAULT_TZ,
  useAnalyticsDashboard,
  useAnalyticsSalesTrend,
  useAnalyticsTopProducts,
  getQuickRange,
  KpiCard,
  ChartCard,
  SalesTrendChart,
  formatCurrencyBRL,
  formatNumberPtbr,
  variationPct,
} from '../features/analytics'
import type { AnalyticsFilters } from '../features/analytics/types'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { RefreshCw, ShoppingBag, Users, Package, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  const tz = DEFAULT_TZ

  const { data: dash, isLoading, refetch } = useAnalyticsDashboard(tz)
  const trendRange = getQuickRange('last30')
  const trendFilters: AnalyticsFilters = { startDate: trendRange.startDate, endDate: trendRange.endDate, timezone: tz }
  const { data: trend } = useAnalyticsSalesTrend(trendFilters, 'day')
  const { data: products } = useAnalyticsTopProducts(trendFilters, 5)

  useOrdersRealtime(orgId, {
    channelPrefix: 'dashboard',
    extraInvalidateKeys: [['analytics', orgId, 'dashboard', tz]],
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-4 md:space-y-0 md:flex-row">
        <div>
          <h1 className="text-display">Visão geral</h1>
          <p className="text-body text-[hsl(var(--muted-foreground))]">
            Indicadores do dia vs. ontem
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} className="hover-lift">
          <RefreshCw size={20} />
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" padding="lg" className="hover-lift">
          <KpiCard
            title="Vendas hoje"
            loading={isLoading}
            value={dash ? formatCurrencyBRL(dash.sales_today) : '—'}
            previous={dash ? formatCurrencyBRL(dash.sales_yesterday) : undefined}
            variation={dash ? variationPct(dash.sales_today, dash.sales_yesterday) : undefined}
          />
        </Card>

        <Card variant="elevated" padding="lg" className="hover-lift">
          <KpiCard
            title="Pedidos hoje"
            loading={isLoading}
            value={dash ? formatNumberPtbr(dash.orders_today) : '—'}
            previous={dash ? formatNumberPtbr(dash.orders_yesterday) : undefined}
            variation={dash ? variationPct(dash.orders_today, dash.orders_yesterday) : undefined}
          />
        </Card>

        <Card variant="elevated" padding="lg" className="hover-lift">
          <KpiCard
            title="Ticket médio"
            loading={isLoading}
            value={dash ? formatCurrencyBRL(dash.avg_ticket_today) : '—'}
            previous={dash ? formatCurrencyBRL(dash.avg_ticket_yesterday) : undefined}
            variation={dash ? variationPct(dash.avg_ticket_today, dash.avg_ticket_yesterday) : undefined}
          />
        </Card>

        <Card variant="elevated" padding="lg" className="hover-lift">
          <KpiCard
            title="Clientes atendidos"
            loading={isLoading}
            value={dash ? formatNumberPtbr(dash.customers_served_today) : '—'}
            hint="hoje"
          />
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card variant="elevated" padding="lg" className="hover-lift">
            <ChartCard title="Receita dos últimos 30 dias" isEmpty={!trend || trend.length === 0}>
              <SalesTrendChart data={trend ?? []} />
            </ChartCard>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" className="hover-lift">
          <ChartCard title="Top produtos (30d)" isEmpty={!products || products.length === 0}>
            <ul className="space-y-2 text-sm">
              {(products ?? []).map((p) => (
                <li key={p.product_id ?? p.product_name} className="flex justify-between border-b pb-1 last:border-0">
                  <span className="text-body truncate pr-2">{p.product_name}</span>
                  <span className="text-metric font-medium">{formatCurrencyBRL(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-heading">Ações rápidas</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Button variant="default" size="lg" className="flex items-center gap-3 hover-lift transition-all duration-200">
            <ShoppingBag size={20} />
            <span>Novo pedido</span>
          </Button>
          <Button variant="outline" size="lg" className="flex items-center gap-3 hover-lift transition-all duration-200">
            <Users size={20} />
            <span>Gerenciar clientes</span>
          </Button>
          <Button variant="outline" size="lg" className="flex items-center gap-3 hover-lift transition-all duration-200">
            <Package size={20} />
            <span>Estoque baixo</span>
          </Button>
          <Button variant="outline" size="lg" className="flex items-center gap-3 hover-lift transition-all duration-200">
            <BarChart3 size={20} />
            <span>Relatórios</span>
          </Button>
        </div>
      </div>
    </div>
  )
}