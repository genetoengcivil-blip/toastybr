import { RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { QUICK_RANGES } from '../utils/dateRanges'
import type { QuickRange } from '../types'

interface ReportFilterBarProps {
  range: QuickRange
  onRangeChange: (r: QuickRange) => void
  startDate: string
  endDate: string
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
  compare: boolean
  onCompareChange: (v: boolean) => void
  onRefresh: () => void
  extra?: React.ReactNode
}

export function ReportFilterBar({
  range,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  compare,
  onCompareChange,
  onRefresh,
  extra,
}: ReportFilterBarProps) {
  return (
    <div className="no-print flex flex-wrap items-end gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 print:hidden">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[hsl(var(--muted-foreground))]">Período</label>
        <Select value={range} onValueChange={(v) => onRangeChange(v as QuickRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUICK_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[hsl(var(--muted-foreground))]">De</label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            onStartDateChange(e.target.value)
            onRangeChange('custom')
          }}
          className="w-auto"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[hsl(var(--muted-foreground))]">Até</label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            onEndDateChange(e.target.value)
            onRangeChange('custom')
          }}
          className="w-auto"
        />
      </div>

      <label className="flex items-center gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          checked={compare}
          onChange={(e) => onCompareChange(e.target.checked)}
        />
        Comparar período anterior
      </label>

      <Button variant="outline" size="sm" onClick={onRefresh} className="mb-0.5">
        <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
      </Button>

      {extra}
    </div>
  )
}
