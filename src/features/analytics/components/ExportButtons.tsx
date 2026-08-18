import { Download, Printer } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { buildCsv, downloadCsv, type CsvColumn } from '../utils/format'

interface ExportButtonsProps<T extends Record<string, unknown>> {
  filename: string
  columns: CsvColumn<T>[]
  data: T[]
  disabled?: boolean
}

export function ExportButtons<T extends Record<string, unknown>>({
  filename,
  columns,
  data,
  disabled,
}: ExportButtonsProps<T>) {
  const handleCsv = () => {
    const csv = buildCsv(data, columns)
    downloadCsv(filename, csv)
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="no-print ml-auto flex items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleCsv} disabled={disabled || data.length === 0}>
        <Download className="mr-1 h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={disabled}>
        <Printer className="mr-1 h-4 w-4" /> Imprimir
      </Button>
    </div>
  )
}
