export const demoKPIs = {
  vendas: { value: 'R$ 47.832,00', change: '+12,4%', trend: 'up' as const },
  pedidos: { value: '312', change: '+8,2%', trend: 'up' as const },
  ticketMedio: { value: 'R$ 153,31', change: '+3,1%', trend: 'up' as const },
  clientes: { value: '1.248', change: '-2,1%', trend: 'down' as const },
}

export const demoRevenueData = [
  { month: 'Jan', receita: 38000, despesas: 22000 },
  { month: 'Fev', receita: 42000, despesas: 24000 },
  { month: 'Mar', receita: 39000, despesas: 21000 },
  { month: 'Abr', receita: 45000, despesas: 26000 },
  { month: 'Mai', receita: 41000, despesas: 23000 },
  { month: 'Jun', receita: 47832, despesas: 25500 },
]

export const demoOrdersByChannel = [
  { name: 'Balcão', value: 42, color: '#f97316' },
  { name: 'Delivery', value: 35, color: '#3b82f6' },
  { name: 'Retirada', value: 23, color: '#22c55e' },
]

export const demoTopProducts = [
  { name: 'X-Burger Especial', quantity: 89, revenue: 'R$ 3.560,00' },
  { name: 'Pizza Margherita', quantity: 67, revenue: 'R$ 4.690,00' },
  { name: 'Batata Trufada', quantity: 54, revenue: 'R$ 2.160,00' },
  { name: 'Brownie c/ Sorvete', quantity: 48, revenue: 'R$ 1.920,00' },
  { name: 'Suco Natural Laranja', quantity: 41, revenue: 'R$ 1.230,00' },
]

export const demoActivity = [
  { time: '14:32', event: 'Pedido #312 finalizado', type: 'order' as const },
  { time: '14:28', event: 'Estoque de cebola abaixo do mínimo', type: 'alert' as const },
  { time: '14:15', event: 'Novo cliente cadastrado: Maria Silva', type: 'customer' as const },
  { time: '13:50', event: 'Pedido #311 entregue via iFood', type: 'delivery' as const },
  { time: '13:20', event: 'Relatório diário gerado', type: 'report' as const },
]

export const demoAlerts = [
  { id: '1', message: 'Estoque baixo: Tomate (2kg restantes)', severity: 'warning' as const },
  { id: '2', message: 'Pedido #308 atrasado há 15min', severity: 'danger' as const },
  { id: '3', message: 'Fornecedor pendente: Bebidas ABC', severity: 'info' as const },
]

interface POSProduct {
  id: string
  name: string
  price: number
  category: string
  image: string
}

export const demoProducts: POSProduct[] = [
  { id: '1', name: 'X-Burger', price: 32.90, category: 'Lanches', image: '' },
  { id: '2', name: 'X-Burger Especial', price: 39.90, category: 'Lanches', image: '' },
  { id: '3', name: 'Cheeseburger', price: 35.90, category: 'Lanches', image: '' },
  { id: '4', name: 'Hot Dog Premium', price: 28.90, category: 'Lanches', image: '' },
  { id: '5', name: 'Pizza Margherita', price: 49.90, category: 'Pizzas', image: '' },
  { id: '6', name: 'Pizza 4 Queijos', price: 54.90, category: 'Pizzas', image: '' },
  { id: '7', name: 'Batata Frita', price: 22.90, category: 'Acompanhamentos', image: '' },
  { id: '8', name: 'Batata Trufada', price: 34.90, category: 'Acompanhamentos', image: '' },
  { id: '9', name: 'Onion Rings', price: 24.90, category: 'Acompanhamentos', image: '' },
  { id: '10', name: 'Coca-Cola 350ml', price: 8.90, category: 'Bebidas', image: '' },
  { id: '11', name: 'Suco Natural Laranja', price: 12.90, category: 'Bebidas', image: '' },
  { id: '12', name: 'Milkshake Chocolate', price: 18.90, category: 'Bebidas', image: '' },
  { id: '13', name: 'Brownie c/ Sorvete', price: 24.90, category: 'Sobremesas', image: '' },
  { id: '14', name: 'Petit Gateau', price: 29.90, category: 'Sobremesas', image: '' },
  { id: '15', name: 'Açaí 500ml', price: 22.90, category: 'Sobremesas', image: '' },
]

export const demoPOSOrders = [
  {
    id: '#308',
    items: [
      { name: 'X-Burger Especial', qty: 2, price: 39.90 },
      { name: 'Coca-Cola 350ml', qty: 2, price: 8.90 },
    ],
    status: 'em_preparo' as const,
    channel: 'balcão',
    time: '14:05',
  },
  {
    id: '#309',
    items: [
      { name: 'Pizza Margherita', qty: 1, price: 49.90 },
      { name: 'Suco Natural Laranja', qty: 1, price: 12.90 },
    ],
    status: 'pronto' as const,
    channel: 'delivery',
    time: '14:12',
  },
  {
    id: '#310',
    items: [
      { name: 'Batata Trufada', qty: 1, price: 34.90 },
      { name: 'Brownie c/ Sorvete', qty: 1, price: 24.90 },
    ],
    status: 'novo' as const,
    channel: 'retirada',
    time: '14:20',
  },
]

export const demoMenuCategories = [
  { id: '1', name: 'Lanches', productCount: 8, active: true },
  { id: '2', name: 'Pizzas', productCount: 6, active: true },
  { id: '3', name: 'Acompanhamentos', productCount: 5, active: true },
  { id: '4', name: 'Bebidas', productCount: 12, active: true },
  { id: '5', name: 'Sobremesas', productCount: 4, active: true },
]

export const demoMenuProducts = [
  { id: '1', name: 'X-Burger', category: 'Lanches', price: 32.90, available: true, sku: 'LCH-001' },
  { id: '2', name: 'X-Burger Especial', category: 'Lanches', price: 39.90, available: true, sku: 'LCH-002' },
  { id: '3', name: 'Cheeseburger', category: 'Lanches', price: 35.90, available: true, sku: 'LCH-003' },
  { id: '4', name: 'Hot Dog Premium', category: 'Lanches', price: 28.90, available: false, sku: 'LCH-004' },
  { id: '5', name: 'Pizza Margherita', category: 'Pizzas', price: 49.90, available: true, sku: 'PIZ-001' },
  { id: '6', name: 'Pizza 4 Queijos', category: 'Pizzas', price: 54.90, available: true, sku: 'PIZ-002' },
  { id: '7', name: 'Batata Frita', category: 'Acompanhamentos', price: 22.90, available: true, sku: 'ACP-001' },
  { id: '8', name: 'Batata Trufada', category: 'Acompanhamentos', price: 34.90, available: true, sku: 'ACP-002' },
  { id: '9', name: 'Onion Rings', category: 'Acompanhamentos', price: 24.90, available: true, sku: 'ACP-003' },
  { id: '10', name: 'Coca-Cola 350ml', category: 'Bebidas', price: 8.90, available: true, sku: 'BEB-001' },
]

export const demoInventoryItems = [
  { id: '1', name: 'Pão de Hamburger', unit: 'un', currentStock: 120, minStock: 50, cost: 1.20, status: 'ok' as const },
  { id: '2', name: 'Carne Moída', unit: 'kg', currentStock: 8, minStock: 10, cost: 32.00, status: 'low' as const },
  { id: '3', name: 'Queijo Cheddar', unit: 'kg', currentStock: 3, minStock: 5, cost: 45.00, status: 'critical' as const },
  { id: '4', name: 'Tomate', unit: 'kg', currentStock: 6, minStock: 4, cost: 8.50, status: 'ok' as const },
  { id: '5', name: 'Cebola', unit: 'kg', currentStock: 2, minStock: 3, cost: 6.00, status: 'low' as const },
  { id: '6', name: 'Batata', unit: 'kg', currentStock: 15, minStock: 8, cost: 12.00, status: 'ok' as const },
  { id: '7', name: 'Molho de Tomate', unit: 'un', currentStock: 24, minStock: 10, cost: 4.50, status: 'ok' as const },
  { id: '8', name: 'Coca-Cola Lata', unit: 'un', currentStock: 48, minStock: 20, cost: 3.20, status: 'ok' as const },
]

export const demoPurchases = [
  { id: '1', supplier: 'Distribuidora Central', items: 12, total: 'R$ 2.340,00', status: 'entregue' as const, date: '15/08/2026' },
  { id: '2', supplier: 'Carnes Premium', items: 5, total: 'R$ 1.890,00', status: 'em_transito' as const, date: '16/08/2026' },
  { id: '3', supplier: 'Bebidas ABC', items: 8, total: 'R$ 980,00', status: 'pendente' as const, date: '17/08/2026' },
]

export const demoCustomers = [
  { id: '1', name: 'Maria Silva', orders: 23, totalSpent: 'R$ 3.450,00', lastOrder: '17/08/2026', segment: 'VIP' },
  { id: '2', name: 'João Santos', orders: 15, totalSpent: 'R$ 2.100,00', lastOrder: '16/08/2026', segment: 'Regular' },
  { id: '3', name: 'Ana Oliveira', orders: 8, totalSpent: 'R$ 890,00', lastOrder: '15/08/2026', segment: 'Novo' },
  { id: '4', name: 'Pedro Costa', orders: 31, totalSpent: 'R$ 5.200,00', lastOrder: '17/08/2026', segment: 'VIP' },
  { id: '5', name: 'Lucia Ferreira', orders: 12, totalSpent: 'R$ 1.780,00', lastOrder: '14/08/2026', segment: 'Regular' },
]

export const demoMarketing = {
  campaigns: [
    { id: '1', name: 'Promoção de Inverno', status: 'ativa' as const, reach: 2340, conversions: 89 },
    { id: '2', name: 'Happy Hour Terça', status: 'agendada' as const, reach: 0, conversions: 0 },
  ],
  coupons: [
    { id: '1', code: 'BEMVINDO10', discount: '10%', uses: 45, active: true },
    { id: '2', code: 'FRETEGRATIS', discount: 'Frete grátis', uses: 23, active: true },
  ],
}

export const demoTeam = [
  { id: '1', name: 'Carlos Administrador', role: 'owner' as const, status: 'ativo' as const, lastAccess: 'Agora' },
  { id: '2', name: 'Ana Gerente', role: 'admin' as const, status: 'ativo' as const, lastAccess: '14:30' },
  { id: '3', name: 'Pedro Cozinha', role: 'staff' as const, status: 'ativo' as const, lastAccess: '13:45' },
  { id: '4', name: 'Maria Atendente', role: 'staff' as const, status: 'ativo' as const, lastAccess: '14:20' },
  { id: '5', name: 'João Estoque', role: 'manager' as const, status: 'inativo' as const, lastAccess: 'Ontem' },
]

export const demoFinance = {
  kpis: {
    receita: 'R$ 47.832,00',
    despesas: 'R$ 25.500,00',
    resultado: 'R$ 22.332,00',
    caixa: 'R$ 18.200,00',
  },
  accountsPayable: [
    { id: '1', description: 'Aluguel', amount: 'R$ 8.500,00', dueDate: '20/08/2026', status: 'pendente' as const },
    { id: '2', description: 'Energia Elétrica', amount: 'R$ 2.340,00', dueDate: '22/08/2026', status: 'pendente' as const },
    { id: '3', description: 'Fornecedor Carnes', amount: 'R$ 4.200,00', dueDate: '18/08/2026', status: 'pago' as const },
  ],
  accountsReceivable: [
    { id: '1', description: 'iFood', amount: 'R$ 12.400,00', dueDate: '25/08/2026', status: 'pendente' as const },
    { id: '2', description: 'Rappi', amount: 'R$ 5.600,00', dueDate: '25/08/2026', status: 'pendente' as const },
  ],
}
