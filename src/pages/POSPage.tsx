import { useState, useMemo } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useCurrentOrganization } from '../features/auth/context'
import { useProducts } from '../features/menu/hooks/useProducts'
import { CustomerSelector } from '../features/sales/components/CustomerSelector'
import { CouponInput } from '../features/sales/components/CouponInput'
import { PaymentSheet } from '../features/sales/components/PaymentSheet'
import type { CartItem } from '../features/sales/types'
import type { Customer, Coupon, ProductWithCategory } from '../lib/supabase/types'

export default function POSPage() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [channel] = useState<string>('pos')

  const { data: products, isLoading } = useProducts()

  const activeProducts = useMemo(() => {
    return (products ?? []).filter(
      (p: ProductWithCategory) => p.is_active && p.is_available
    )
  }, [products])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    activeProducts.forEach((p: ProductWithCategory) => {
      if (p.menu_categories?.name) cats.add(p.menu_categories.name)
    })
    return ['Todos', ...Array.from(cats)]
  }, [activeProducts])

  const filtered = useMemo(() => {
    return activeProducts.filter((p: ProductWithCategory) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory =
        activeCategory === 'Todos' || p.menu_categories?.name === activeCategory
      return matchSearch && matchCategory
    })
  }, [activeProducts, search, activeCategory])

  function addToCart(product: ProductWithCategory) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: 1,
        },
      ]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product_id !== productId) return i
          const newQty = i.quantity + delta
          return newQty > 0 ? { ...i, quantity: newQty } : i
        })
        .filter((i) => i.quantity > 0)
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = subtotal - couponDiscount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left: Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((product: ProductWithCategory) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition-colors text-left"
            >
              <div className="h-16 rounded-md bg-[hsl(var(--muted))] mb-2 flex items-center justify-center">
                <ShoppingBag size={20} className="text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                R$ {product.price.toFixed(2)}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart + Customer + Coupon */}
      <div className="w-80 hidden lg:flex flex-col border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))]">
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <h2 className="font-semibold text-sm mb-3">Pedido atual</h2>

          {/* Customer selector */}
          <div className="mb-3">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Cliente</p>
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          {/* Coupon input */}
          <div>
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Cupom</p>
            <CouponInput
              organizationId={orgId}
              orderSubtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApply={(coupon, discount) => {
                setAppliedCoupon(coupon)
                setCouponDiscount(discount)
              }}
              onRemove={() => {
                setAppliedCoupon(null)
                setCouponDiscount(0)
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
              <p>Nenhum item</p>
            </div>
          ) : (
            <div className="p-4 space-y-3 overflow-y-auto h-full">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      R$ {item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="h-6 w-6 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))]"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="h-6 w-6 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))]"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-[hsl(var(--muted-foreground))] hover:text-red-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[hsl(var(--border))] space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
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
          <Button
            className="w-full"
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
          >
            Pagar
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={cart.length === 0}
            onClick={() => {
              setCart([])
              setAppliedCoupon(null)
              setCouponDiscount(0)
              setSelectedCustomer(null)
            }}
          >
            Limpar
          </Button>
        </div>
      </div>

      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        items={cart}
        subtotal={subtotal}
        discount={0}
        couponDiscount={couponDiscount}
        total={total}
        selectedCustomer={selectedCustomer}
        appliedCoupon={appliedCoupon}
        channel={channel}
        onSuccess={() => {
          setCart([])
          setAppliedCoupon(null)
          setCouponDiscount(0)
          setSelectedCustomer(null)
        }}
      />
    </div>
  )
}
