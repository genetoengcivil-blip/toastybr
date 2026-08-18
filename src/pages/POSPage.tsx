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
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

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
        <div className="flex items-center justify-between space-y-2 mb-4">
          <h2 className="text-heading">Produtos</h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[250px] pl-9"
            />
            <Button variant="outline" size="icon" className="hover-lift" onClick={() => setSearch('')}>
              <Search size={18} />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 border-b border-[hsl(var(--border))]">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                  : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50'
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product: ProductWithCategory) => (
            <Card
              key={product.id}
              variant="elevated"
              padding="lg"
              className="cursor-pointer hover-lift transition-all duration-200"
              onClick={() => addToCart(product)}
            >
              <div className="flex items-center justify-center h-24 mb-3">
                <ShoppingBag size={24} className="text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="text-title truncate">{product.name}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-metric font-medium text-[hsl(var(--primary))]">
                  R$ {product.price.toFixed(2)}
                </span>
                <Badge variant="outline">
                  {product.menu_categories?.name ?? 'Sem categoria'}
                </Badge>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))] text-sm">
              <ShoppingBag size={32} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum produto encontrado</p>
              <p className="mt-2 text-[hsl(var(--muted-foreground))]/80">
                Tente ajustar os filtros de busca ou categoria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart + Customer + Coupon */}
      <div className="w-80 hidden lg:flex flex-col border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] shadow-sm">
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-heading">Pedido atual</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {cart.length} item{cart.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Customer selector */}
          <div className="space-y-2">
            <p className="text-label font-medium">Cliente</p>
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          <Separator className="my-4" />

          {/* Coupon input */}
          <div className="space-y-2">
            <p className="text-label font-medium">Cupom de desconto</p>
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

          <Separator className="my-4" />

          <div className="flex-1 overflow-hidden">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))] text-sm">
                <ShoppingBag size={32} className="mx-auto mb-4 opacity-40" />
                <p>Seu carrinho está vazio</p>
                <p className="mt-2 text-[hsl(var(--muted-foreground))]/60">
                  Adicione produtos para começar o pedido
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3 overflow-y-auto">
                {cart.map((item) => (
                  <Card
                    key={item.product_id}
                    variant="outline"
                    padding="sm"
                    className="flex items-center gap-4 hover-lift transition-all duration-200"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-md bg-[hsl(var(--muted))]/20 flex items-center justify-center">
                      <ShoppingBag size={16} className="text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-font-medium truncate">{item.product_name}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        R$ {item.unit_price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="h-8 w-8 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="h-8 w-8 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))]/50 transition-colors duration-200"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span className="text-2xl font-bold text-[hsl(var(--primary))]">
                R$ {subtotal.toFixed(2)}
              </span>
              {couponDiscount > 0 && (
                <>
                  <span className="text-[hsl(var(--muted-foreground))]">Desconto</span>
                  <span className="text-[hsl(var(--success))] font-medium">
                    - R$ {couponDiscount.toFixed(2)}
                  </span>
                </>
              )}
              <span className="text-[hsl(var(--muted-foreground))] font-medium">Total</span>
              <span className="text-3xl font-bold text-[hsl(var(--primary))]">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              className="w-full hover-lift transition-all duration-200"
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
              Limpar tudo
            </Button>
          </div>
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