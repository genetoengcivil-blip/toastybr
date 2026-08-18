import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { Button } from '../../../components/ui/button'
import type { CartItem } from '../types'

interface POSCartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  subtotal: number
  discount: number
  couponDiscount: number
  total: number
  onCheckout: () => void
  onClear: () => void
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemove,
  subtotal,
  discount,
  couponDiscount,
  total,
  onCheckout,
  onClear,
}: POSCartProps) {
  return (
    <div className="w-80 hidden lg:flex flex-col border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))]">
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <h2 className="font-semibold text-sm">Pedido atual</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
            <p>Nenhum item</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    R$ {item.unit_price.toFixed(2)}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] italic truncate">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.product_id, -1)}
                    className="h-6 w-6 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))]"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product_id, 1)}
                    className="h-6 w-6 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))]"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.product_id)}
                  className="text-[hsl(var(--muted-foreground))] hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-[hsl(var(--border))] space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto</span>
            <span>- R$ {discount.toFixed(2)}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Cupom</span>
            <span>- R$ {couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold border-t pt-2">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        <Button className="w-full" disabled={items.length === 0} onClick={onCheckout}>
          Pagar
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={items.length === 0}
          onClick={onClear}
        >
          Limpar
        </Button>
      </div>
    </div>
  )
}
