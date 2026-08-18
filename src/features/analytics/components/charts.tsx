import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrencyBRL, formatNumberPtbr } from '../utils/format'
import type { CategoryRow, CashFlowPoint, HourPoint, PaymentMethodRow, TrendPoint, WeekdayPoint } from '../types'

const PIE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#65a30d']
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const money = (v: unknown) => formatCurrencyBRL(Number(v))
const axisStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="bucket" tick={axisStyle} />
        <YAxis yAxisId="rev" tick={axisStyle} tickFormatter={(v) => money(v)} width={70} />
        <YAxis yAxisId="ord" orientation="right" tick={axisStyle} width={36} />
        <Tooltip formatter={(value, name) => [name === 'Receita' ? money(Number(value)) : formatNumberPtbr(Number(value)), name]} />
        <Legend />
        <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Receita" fill="#16a34a22" stroke="#16a34a" />
        <Line yAxisId="ord" type="monotone" dataKey="orders" name="Pedidos" stroke="#2563eb" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function HourlyChart({ data }: { data: HourPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="hour" tick={axisStyle} tickFormatter={(h) => `${String(h).padStart(2, '0')}h`} />
        <YAxis tick={axisStyle} tickFormatter={(v) => money(v)} width={70} />
        <Tooltip formatter={(v) => money(v)} />
        <Bar dataKey="revenue" name="Receita" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WeekdayChart({ data }: { data: WeekdayPoint[] }) {
  const rows = WEEKDAY_LABELS.map((label, i) => {
    const found = data.find((d) => d.dow === i)
    return { label, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 }
  })
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => money(v)} width={70} />
        <Tooltip formatter={(v) => money(v)} />
        <Bar dataKey="revenue" name="Receita" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryChart({ data }: { data: CategoryRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" tick={axisStyle} tickFormatter={(v) => money(v)} />
        <YAxis type="category" dataKey="category_name" tick={axisStyle} width={120} />
        <Tooltip formatter={(v) => money(v)} />
        <Bar dataKey="revenue" name="Receita" fill="#16a34a" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PaymentPieChart({ data }: { data: PaymentMethodRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="method" outerRadius={100} label={(e) => String(e.method)}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => money(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="bucket" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => money(v)} width={70} />
        <Tooltip formatter={(v, name) => [money(Number(v)), name]} />
        <Legend />
        <Bar dataKey="income" name="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Saídas" fill="#dc2626" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="net" name="Líquido" stroke="#2563eb" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
