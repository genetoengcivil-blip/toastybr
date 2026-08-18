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

export default function DashboardPage() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  const tz = DEFAULT_TZ

  const { data: dash, isLoading } = useAnalyticsDashboard(tz)
  const trendRange = getQuickRange('last30')
  const trendFilters: AnalyticsFilters = { startDate: trendRange.startDate, endDate: trendRange.endDate, timezone: tz }
  const { data: trend } = useAnalyticsSalesTrend(trendFilters, 'day')
  const { data: products } = useAnalyticsTopProducts(trendFilters, 5)

  useOrdersRealtime(orgId, {
    channelPrefix: 'dashboard',
    extraInvalidateKeys: [['analytics', orgId, 'dashboard', tz]],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Indicadores do dia vs. ontem</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Vendas hoje"
          loading={isLoading}
          value={dash ? formatCurrencyBRL(dash.sales_today) : '—'}
          previous={dash ? formatCurrencyBRL(dash.sales_yesterday) : undefined}
          variation={dash ? variationPct(dash.sales_today, dash.sales_yesterday) : undefined}
        />
        <KpiCard
          title="Pedidos hoje"
          loading={isLoading}
          value={dash ? formatNumberPtbr(dash.orders_today) : '—'}
          previous={dash ? formatNumberPtbr(dash.orders_yesterday) : undefined}
          variation={dash ? variationPct(dash.orders_today, dash.orders_yesterday) : undefined}
        />
        <KpiCard
          title="Ticket médio"
          loading={isLoading}
          value={dash ? formatCurrencyBRL(dash.avg_ticket_today) : '—'}
          previous={dash ? formatCurrencyBRL(dash.avg_ticket_yesterday) : undefined}
          variation={dash ? variationPct(dash.avg_ticket_today, dash.avg_ticket_yesterday) : undefined}
        />
        <KpiCard
          title="Clientes atendidos"
          loading={isLoading}
          value={dash ? formatNumberPtbr(dash.customers_served_today) : '—'}
          hint="hoje"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Receita dos últimos 30 dias" isEmpty={!trend || trend.length === 0}>
            <SalesTrendChart data={trend ?? []} />
          </ChartCard>
        </div>
        <ChartCard title="Top produtos (30d)" isEmpty={!products || products.length === 0}>
          <ul className="space-y-2 text-sm">
            {(products ?? []).map((p) => (
              <li key={p.product_id ?? p.product_name} className="flex justify-between border-b pb-1 last:border-0">
                <span className="truncate pr-2">{p.product_name}</span>
                <span className="font-medium">{formatCurrencyBRL(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  )
}
