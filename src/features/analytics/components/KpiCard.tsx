import { Card, CardContent } from '../../../components/ui/card'
import { formatVariation } from '../utils/format'

interface KpiCardProps {
  title: string
  value: string
  previous?: string
  variation?: number | null
  hint?: string
  loading?: boolean
}

export function KpiCard({ title, value, previous, variation, hint, loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-[hsl(var(--muted))]" />
          <div className="h-7 w-32 animate-pulse rounded bg-[hsl(var(--muted))]" />
        </CardContent>
      </Card>
    )
  }

  const hasVariation = typeof variation === 'number'
  const positive = (variation ?? 0) >= 0

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {hasVariation && (
            <span className={positive ? 'text-emerald-600' : 'text-red-600'}>
              {formatVariation(variation)}
            </span>
          )}
          {previous !== undefined && <span className="text-[hsl(var(--muted-foreground))]">anterior: {previous}</span>}
          {hint && <span className="text-[hsl(var(--muted-foreground))]">· {hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
