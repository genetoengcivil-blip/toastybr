export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'staff'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  created_at: string
}

export interface OrganizationWithMembership extends Organization {
  membership: OrganizationMember
}

// =============================================================
// Organization Invites
// =============================================================

export interface OrganizationInvite {
  id: string
  organization_id: string
  email: string
  role: OrganizationRole
  token_hash: string
  expires_at: string
  accepted_at: string | null
  invited_by: string
  created_at: string
}

// =============================================================
// Organization Settings
// =============================================================

export interface OrganizationSettings {
  id: string
  organization_id: string
  phone: string | null
  email: string | null
  address: string | null
  timezone: string
  currency: string
  locale: string
  updated_at: string
}

// =============================================================
// Organization Business Hours
// =============================================================

export interface OrganizationBusinessHours {
  id: string
  organization_id: string
  weekday: number
  is_open: boolean
  open_time: string
  close_time: string
  created_at: string
  updated_at: string
}

export const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const

export interface MenuCategory {
  id: string
  organization_id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  organization_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  sku: string | null
  is_active: boolean
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  menu_categories: MenuCategory | null
}

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'un' | 'cx' | 'pct'

export const INGREDIENT_UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (L)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'pct', label: 'Pacote (pct)' },
]

export interface Ingredient {
  id: string
  organization_id: string
  name: string
  description: string | null
  unit: IngredientUnit
  cost_per_unit: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductRecipeItem {
  id: string
  organization_id: string
  product_id: string
  ingredient_id: string
  quantity: number
  waste_percent: number
  created_at: string
  updated_at: string
}

export interface ProductRecipeItemWithIngredient extends ProductRecipeItem {
  ingredients: Ingredient
}

export type InventoryMovementType = 'entry' | 'exit' | 'adjustment_in' | 'adjustment_out'

export type InventoryStatus = 'normal' | 'low' | 'critical' | 'out'

export interface InventoryBalance {
  id: string
  organization_id: string
  ingredient_id: string
  quantity: number
  minimum_quantity: number
  updated_at: string
}

export interface InventoryBalanceWithIngredient extends InventoryBalance {
  ingredients: Ingredient
}

export interface InventoryMovement {
  id: string
  organization_id: string
  ingredient_id: string
  type: InventoryMovementType
  quantity: number
  previous_quantity: number
  new_quantity: number
  reason: string | null
  reference_type: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
}

export interface InventoryMovementWithIngredient extends InventoryMovement {
  ingredients: Ingredient
}

// =============================================================
// Purchasing + Suppliers
// =============================================================

export type PurchaseOrderStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export interface Supplier {
  id: string
  organization_id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  cnpj: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  organization_id: string
  supplier_id: string | null
  po_number: string
  status: PurchaseOrderStatus
  discount: number
  shipping: number
  notes: string | null
  total: number
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  organization_id: string
  po_id: string
  ingredient_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  created_at: string
  updated_at: string
}

export interface PurchaseOrderWithSupplier extends PurchaseOrder {
  suppliers: Supplier | null
  purchase_order_items: PurchaseOrderItemWithIngredient[]
}

export interface PurchaseOrderItemWithIngredient extends PurchaseOrderItem {
  ingredients: Ingredient
}

export interface PurchaseReceipt {
  id: string
  organization_id: string
  po_id: string
  received_at: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface PurchaseReceiptItem {
  id: string
  organization_id: string
  receipt_id: string
  po_item_id: string
  quantity: number
  created_at: string
}

export interface PurchaseReceiptWithItems extends PurchaseReceipt {
  purchase_receipt_items: PurchaseReceiptItem[]
}

// =============================================================
// CRM: Customers
// =============================================================

export interface Customer {
  id: string
  organization_id: string
  name: string
  email: string | null
  phone: string | null
  document: string | null
  total_orders: number
  total_spent: number
  last_order_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerWithTags extends Customer {
  customer_tag_assignments: { customer_tags: CustomerTag }[]
}

export interface CustomerAddress {
  id: string
  organization_id: string
  customer_id: string
  label: string
  street: string
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string
  state: string
  zip_code: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CustomerNote {
  id: string
  organization_id: string
  customer_id: string
  content: string
  created_by: string | null
  created_at: string
}

export interface CustomerTag {
  id: string
  organization_id: string
  name: string
  created_at: string
}

export interface CustomerTagAssignment {
  organization_id: string
  customer_id: string
  tag_id: string
  created_at: string
}

// =============================================================
// CRM: Loyalty
// =============================================================

export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjustment_in' | 'adjustment_out' | 'reversal'

export interface LoyaltyAccount {
  id: string
  organization_id: string
  customer_id: string
  points_balance: number
  lifetime_points: number
  created_at: string
  updated_at: string
}

export interface LoyaltyAccountWithCustomer extends LoyaltyAccount {
  customers: Customer
}

export interface LoyaltyTransaction {
  id: string
  organization_id: string
  customer_id: string
  loyalty_account_id: string
  type: LoyaltyTransactionType
  points: number
  balance_before: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  description: string | null
  created_by: string | null
  created_at: string
}

export interface LoyaltyTransactionWithCustomer extends LoyaltyTransaction {
  customers: Customer
}

export interface LoyaltySettings {
  id: string
  organization_id: string
  points_per_real: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// =============================================================
// CRM: Coupons
// =============================================================

export type CouponType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  organization_id: string
  code: string
  type: CouponType
  value: number
  min_order: number
  max_uses: number | null
  current_uses: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CouponRedemption {
  id: string
  organization_id: string
  coupon_id: string
  customer_id: string | null
  sales_order_id: string | null
  discount_amount: number
  reversed_at: string | null
  created_at: string
}

export interface CouponRedemptionWithCoupon extends CouponRedemption {
  coupons: Coupon
}

// =============================================================
// CRM: Campaigns
// =============================================================

export type CampaignType = 'whatsapp' | 'email' | 'sms' | 'in_store'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'

export interface Campaign {
  id: string
  organization_id: string
  name: string
  description: string | null
  type: CampaignType
  status: CampaignStatus
  reach: number
  conversions: number
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

// =============================================================
// Sales: POS + Orders + Payments
// =============================================================

export type SalesOrderChannel = 'pos' | 'counter' | 'takeaway' | 'delivery'
export type SalesOrderStatus = 'open' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'pix' | 'debit_card' | 'credit_card' | 'other'

export interface SalesOrder {
  id: string
  organization_id: string
  order_number: string
  customer_id: string | null
  channel: SalesOrderChannel
  status: SalesOrderStatus
  customer_name: string | null
  customer_phone: string | null
  subtotal: number
  discount: number
  service_fee: number
  delivery_fee: number
  total: number
  notes: string | null
  opened_by: string | null
  closed_by: string | null
  opened_at: string
  confirmed_at: string | null
  ready_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  coupon_id: string | null
  coupon_code: string | null
  coupon_discount: number
  created_at: string
  updated_at: string
}

export interface SalesOrderItem {
  id: string
  organization_id: string
  sales_order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
  created_at: string
}

export interface SalesPayment {
  id: string
  organization_id: string
  sales_order_id: string
  method: PaymentMethod
  amount: number
  status: 'confirmed' | 'cancelled'
  reference: string | null
  created_by: string | null
  created_at: string
}

export interface SalesOrderWithItems extends SalesOrder {
  sales_order_items: SalesOrderItem[]
}

export interface SalesOrderWithPayments extends SalesOrder {
  sales_payments: SalesPayment[]
}

export interface SalesOrderDetail extends SalesOrder {
  sales_order_items: SalesOrderItem[]
  sales_payments: SalesPayment[]
  customers: Customer | null
}

// =============================================================
// Finance
// =============================================================

export type FinancialTransactionType = 'sale' | 'purchase' | 'payment' | 'receipt' | 'manual' | 'adjustment' | 'reversal'

export type FinancialTransactionDirection = 'in' | 'out'

export interface AccountPayable {
  id: string
  organization_id: string
  supplier_id: string | null
  purchase_order_id: string | null
  category_id: string | null
  cost_center_id: string | null
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled'
  paid_amount: number
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  suppliers?: { name: string } | null
  financial_categories?: { name: string } | null
  cost_centers?: { name: string } | null
}

export type AccountPayableStatus = 'pending' | 'partially_paid' | 'paid' | 'cancelled'

export interface AccountReceivable {
  id: string
  organization_id: string
  customer_id: string | null
  sales_order_id: string | null
  category_id: string | null
  cost_center_id: string | null
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'partially_received' | 'received' | 'cancelled'
  received_amount: number
  received_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  customers?: { name: string } | null
  financial_categories?: { name: string } | null
  cost_centers?: { name: string } | null
}

export type AccountReceivableStatus = 'pending' | 'partially_received' | 'received' | 'cancelled'

export interface FinancialTransaction {
  id: string
  organization_id: string
  type: FinancialTransactionType
  direction: FinancialTransactionDirection
  amount: number
  category_id: string | null
  cost_center_id: string | null
  reference_type: string | null
  reference_id: string | null
  description: string
  occurred_at: string
  created_by: string | null
  created_at: string
  // joined
  financial_categories?: { name: string } | null
  cost_centers?: { name: string } | null
}

export interface FinanceOverview {
  today_in: number
  today_out: number
  month_in: number
  month_out: number
  open_payables: number
  open_receivables: number
  overdue_payables: number
  overdue_receivables: number
}

export interface CashflowDay {
  date: string
  in: number
  out: number
}

export interface DREData {
  revenue_gross: number
  revenue_reversals: number
  revenue_net: number
  cogs_estimated: number
  operating_expenses_manual: number
  operating_result: number
}

export interface CategorySummaryItem {
  category_id: string | null
  category_name: string
  direction: 'in' | 'out'
  total: number
}

export interface PaymentMethodSummary {
  method: string
  total: number
  count: number
}
