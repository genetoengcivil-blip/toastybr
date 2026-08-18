import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReportFilterBar } from './ReportFilterBar'
import { KpiCard } from './KpiCard'
import { ChartCard } from './ChartCard'
import { ExportButtons } from './ExportButtons'

beforeAll(() => {
  // @ts-ignore test shim
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:x')
  // @ts-ignore test shim
  globalThis.URL.revokeObjectURL = vi.fn()
})

describe('ReportFilterBar', () => {
  const base = {
    range: 'last30' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    compare: true,
    onRangeChange: vi.fn(),
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
    onCompareChange: vi.fn(),
    onRefresh: vi.fn(),
  }

  it('renders period label and refresh triggers callback', () => {
    render(<ReportFilterBar {...base} />)
    expect(screen.getByText('Período')).toBeTruthy()
    fireEvent.click(screen.getByText('Atualizar'))
    expect(base.onRefresh).toHaveBeenCalled()
  })

  it('editing start date switches to custom range', () => {
    render(<ReportFilterBar {...base} />)
    const input = screen.getByDisplayValue('2026-08-01') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-07-01' } })
    expect(base.onStartDateChange).toHaveBeenCalledWith('2026-07-01')
    expect(base.onRangeChange).toHaveBeenCalledWith('custom')
  })
})

describe('KpiCard', () => {
  it('shows skeleton while loading', () => {
    const { container } = render(<KpiCard title="Vendas" value="—" loading />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders value and formatted variation', () => {
    render(<KpiCard title="Vendas" value="R$ 100,00" variation={20} previous="R$ 80,00" />)
    expect(screen.getByText('Vendas')).toBeTruthy()
    expect(screen.getByText('R$ 100,00')).toBeTruthy()
    expect(screen.getByText('+20,0%')).toBeTruthy()
  })
})

describe('ChartCard', () => {
  it('renders empty state when empty', () => {
    render(<ChartCard title="Gráfico" isEmpty>Something</ChartCard>)
    expect(screen.getByText('Sem dados no período')).toBeTruthy()
  })

  it('renders children when not empty', () => {
    render(<ChartCard title="Gráfico">CONTEÚDO</ChartCard>)
    expect(screen.getByText('CONTEÚDO')).toBeTruthy()
  })
})

describe('ExportButtons', () => {
  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'total', header: 'Total' },
  ]
  const data = [{ name: 'A', total: 10 }]

  it('renders CSV and print buttons', () => {
    render(<ExportButtons filename="x.csv" columns={columns} data={data} />)
    expect(screen.getByText('CSV')).toBeTruthy()
    expect(screen.getByText('Imprimir')).toBeTruthy()
  })

  it('CSV button triggers download', () => {
    render(<ExportButtons filename="x.csv" columns={columns} data={data} />)
    fireEvent.click(screen.getByText('CSV'))
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
  })

  it('disables CSV when no data', () => {
    render(<ExportButtons filename="x.csv" columns={columns} data={[]} />)
    expect((screen.getByText('CSV') as HTMLButtonElement).disabled).toBe(true)
  })
})
