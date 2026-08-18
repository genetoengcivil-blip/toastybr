import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { TrendingUp, TrendingDown, Clock, AlertTriangle, DollarSign } from 'lucide-react'
import { useFinanceOverview, useCashflowChart } from '../hooks'
import { formatCurrency } from '../utils'

function StatCard({ title, value, icon: Icon, color }: {
  title: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{title}</p>
            <p className="text-xl font-semibold">{formatCurrency(value)}</p>
          </div>
          <div className={`rounded-full p-2 ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OverviewTab() {
  const { data: overview, isLoading: overviewLoading } = useFinanceOverview()
  const [chartDays, setChartDays] = useState(30)
  const { data: chartData, isLoading: chartLoading } = useCashflowChart(chartDays)

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse bg-[hsl(var(--muted))]" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const o = overview || {
    today_in: 0, today_out: 0, month_in: 0, month_out: 0,
    open_payables: 0, open_receivables: 0, overdue_payables: 0, overdue_receivables: 0,
  }

  const todayNet = o.today_in - o.today_out
  const monthNet = o.month_in - o.month_out

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Entradas hoje" value={o.today_in} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Saídas hoje" value={o.today_out} icon={TrendingDown} color="bg-red-500" />
        <StatCard title="Entradas mês" value={o.month_in} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Saídas mês" value={o.month_out} icon={TrendingDown} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Saldo líquido hoje" value={todayNet} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Resultado mês" value={monthNet} icon={DollarSign} color="bg-blue-600" />
        <StatCard title="A pagar aberto" value={o.open_payables} icon={Clock} color="bg-amber-500" />
        <StatCard title="A receber aberto" value={o.open_receivables} icon={Clock} color="bg-amber-600" />
      </div>

      {(o.overdue_payables > 0 || o.overdue_receivables > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {o.overdue_payables > 0 && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-medium">Vencido a pagar</span>
                </div>
                <p className="text-xl font-semibold text-red-600">{formatCurrency(o.overdue_payables)}</p>
              </CardContent>
            </Card>
          )}
          {o.overdue_receivables > 0 && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-medium">Vencido a receber</span>
                </div>
                <p className="text-xl font-semibold text-red-600">{formatCurrency(o.overdue_receivables)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cashflow Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
            <Tabs value={String(chartDays)} onValueChange={(v) => setChartDays(Number(v))}>
              <TabsList>
                <TabsTrigger value="7">7d</TabsTrigger>
                <TabsTrigger value="30">30d</TabsTrigger>
                <TabsTrigger value="90">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-48 animate-pulse bg-[hsl(var(--muted))]" />
          ) : (
            <div className="space-y-2">
              {(chartData || []).length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">Sem dados para o período</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1 h-48 min-w-[600px]">
                    {(chartData || []).map((day) => {
                      const maxVal = Math.max(
                        ...(chartData || []).map((d) => Math.max(d.in, d.out)),
                        1
                      )
                      const inH = (day.in / maxVal) * 100
                      const outH = (day.out / maxVal) * 100
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-0.5 flex-1 min-w-[8px]">
                          <div className="flex gap-px items-end h-40">
                            <div
                              className="bg-emerald-500 rounded-t w-2 min-h-[2px]"
                              style={{ height: `${Math.max(inH, 2)}%` }}
                              title={`Entrada: ${formatCurrency(day.in)}`}
                            />
                            <div
                              className="bg-red-500 rounded-t w-2 min-h-[2px]"
                              style={{ height: `${Math.max(outH, 2)}%` }}
                              title={`Saída: ${formatCurrency(day.out)}`}
                            />
                          </div>
                          <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                            {new Date(day.date + 'T00:00:00').getDate()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Entradas</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Saídas</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
