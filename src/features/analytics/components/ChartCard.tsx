import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'

interface ChartCardProps {
  title: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, isLoading, isEmpty, emptyMessage, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-medium text-[hsl(var(--foreground))]">{title}</h3>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isEmpty ? (
          <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
            {emptyMessage ?? 'Sem dados no período'}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
