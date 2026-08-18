# TOASTY_ROLE_MATRIX.md

## Matriz de Permissões por Role

### Legenda
- ✅ = Acesso total (Create/Read/Update/Delete conforme aplicável)
- 👁️ = Somente leitura
- ❌ = Sem acesso
- 🔐 = Via RPC apenas (não via Data API direta)

---

## 1. Configurações da Organização

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver configurações gerais | ✅ | ✅ | 👁️ | 👁️ |
| Editar nome da org | ✅ | ✅ | ❌ | ❌ |
| Editar telefone/email/endereço | ✅ | ✅ | ❌ | ❌ |
| Editar timezone/currency/locale | ✅ | ✅ | ❌ | ❌ |
| Ver horários de funcionamento | ✅ | ✅ | 👁️ | 👁️ |
| Editar horários de funcionamento | ✅ | ✅ | ✅ | ❌ |

---

## 2. Equipe (Membros)

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Listar membros | ✅ | ✅ | 👁️ | 👁️ |
| Convidar membro | ✅ | ✅ | ❌ | ❌ |
| Cancelar convite | ✅ | ✅ | ❌ | ❌ |
| Alterar role de outro membro | ✅ | ✅* | ❌ | ❌ |
| Remover membro | ✅ | ✅* | ❌ | ❌ |
| Ver convites pendentes | ✅ | ✅ | ❌ | ❌ |

*Admin NÃO pode:
- Alterar role de owner
- Promover para owner/admin
- Remover owner

---

## 3. Perfil Próprio

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Editar nome/telefone/endereço | ✅ | ✅ | ✅ | ✅ |
| Alterar senha | ✅ | ✅ | ✅ | ✅ |
| Alterar email (via Supabase Auth) | ✅ | ✅ | ✅ | ✅ |

---

## 4. Financeiro

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver Visão Geral | ✅ | ✅ | 👁️ | 👁️ |
| Contas a Pagar (listar) | ✅ | ✅ | 👁️ | 👁️ |
| Criar AP manual | ✅ | ✅ | ❌ | ❌ |
| Pagar AP (RPC) | ✅ | ✅ | ❌ | ❌ |
| Cancelar AP (RPC) | ✅ | ✅ | ❌ | ❌ |
| Contas a Receber (listar) | ✅ | ✅ | 👁️ | 👁️ |
| Criar AR manual | ✅ | ✅ | ❌ | ❌ |
| Receber AR (RPC) | ✅ | ✅ | ❌ | ❌ |
| Cancelar AR (RPC) | ✅ | ✅ | ❌ | ❌ |
| Lançamentos manuais | ✅ | ✅ | ❌ | ❌ |
| Estorno financeiro | ✅ | ✅ | ❌ | ❌ |
| DRE / Relatórios | ✅ | ✅ | 👁️ | 👁️ |

---

## 5. Vendas (PDV + Pedidos)

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Abrir pedido (PDV) | ✅ | ✅ | ✅ | ✅ |
| Finalizar venda | ✅ | ✅ | ✅ | ✅ |
| Cancelar pedido (aberto/confirmado) | ✅ | ✅ | ✅ | ❌ |
| Ver pedidos | ✅ | ✅ | ✅ | 👁️ |
| Ver cozinha | ✅ | ✅ | ✅ | ✅ |
| Avançar status cozinha | ✅ | ✅ | ✅ | ✅ |

---

## 6. Cardápio + Produtos

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver produtos/categorias | ✅ | ✅ | ✅ | 👁️ |
| Criar/editar categoria | ✅ | ✅ | ✅ | ❌ |
| Criar/editar produto | ✅ | ✅ | ✅ | ❌ |
| Toggle disponibilidade | ✅ | ✅ | ✅ | ❌ |
| Ficha técnica (ver) | ✅ | ✅ | ✅ | 👁️ |
| Ficha técnica (editar) | ✅ | ✅ | ✅ | ❌ |

---

## 7. Ingredientes + Estoque

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver ingredientes | ✅ | ✅ | ✅ | 👁️ |
| Criar/editar ingrediente | ✅ | ✅ | ✅ | ❌ |
| Movimentar estoque (entrada/saída/ajuste) | ✅ | ✅ | ✅ | ❌ |
| Editar estoque mínimo | ✅ | ✅ | ✅ | ❌ |
| Ver movimentações (ledger) | ✅ | ✅ | ✅ | 👁️ |

---

## 8. Compras + Fornecedores

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver fornecedores | ✅ | ✅ | ✅ | 👁️ |
| Criar/editar fornecedor | ✅ | ✅ | ✅ | ❌ |
| Criar pedido de compra | ✅ | ✅ | ✅ | ❌ |
| Receber pedido (entrada estoque) | ✅ | ✅ | ✅ | ❌ |
| Ver recibos de compra | ✅ | ✅ | ✅ | 👁️ |

---

## 9. Clientes + CRM

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver clientes | ✅ | ✅ | ✅ | 👁️ |
| Criar/editar cliente | ✅ | ✅ | ✅ | ❌ |
| Ver detalhes (endereços, notas, tags) | ✅ | ✅ | ✅ | 👁️ |
| Gerenciar endereços | ✅ | ✅ | ✅ | 👁️ |
| Adicionar notas | ✅ | ✅ | ✅ | ✅ |
| Gerenciar tags | ✅ | ✅ | ✅ | ❌ |

---

## 10. Fidelidade (Loyalty)

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver contas/saldos | ✅ | ✅ | 👁️ | 👁️ |
| Ajustar pontos (RPC) | ✅ | ✅ | ❌ | ❌ |
| Ver transações (ledger) | ✅ | ✅ | 👁️ | 👁️ |
| Configurar points_per_real | ✅ | ✅ | ❌ | ❌ |

---

## 11. Marketing (Campanhas + Cupons)

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver campanhas | ✅ | ✅ | 👁️ | 👁️ |
| Criar/editar campanha | ✅ | ✅ | ❌ | ❌ |
| Avançar status campanha (RPC) | ✅ | ✅ | ❌ | ❌ |
| Ver cupons | ✅ | ✅ | 👁️ | 👁️ |
| Criar/editar cupom | ✅ | ✅ | ❌ | ❌ |
| Ver resgates | ✅ | ✅ | 👁️ | 👁️ |

---

## 12. Relatórios

| Ação | Owner | Admin | Manager | Staff |
|------|-------|-------|---------|-------|
| Ver Dashboard | ✅ | ✅ | 👁️ | 👁️ |
| Ver Relatórios (DRE, categorias, pagamentos) | ✅ | ✅ | 👁️ | 👁️ |

---

## Resumo de Princípios

1. **Owner**: Controle total — tudo que Admin pode + gestão de owners + proteção última instância
2. **Admin**: Administração ampla — tudo que Manager pode + gestão de membros (exceto owners) + configurações
3. **Manager**: Operação gerencial — tudo que Staff pode + receber compras + editar horários + fichas técnicas + movimentar estoque
4. **Staff**: Operação básica — PDV, cozinha, ver dados, adicionar notas de cliente

### Regras de Escalação
- Ninguém pode promover/demover para role ≥ sua própria
- Admin não toca em owner
- Org sempre tem ≥1 owner
- Self-actions (própria role/remoção) bloqueadas

### Data API (PostgREST) vs RPC
- Tabelas de ledger (movimentações, loyalty_transactions, etc.): apenas SELECT via Data API, escrita via RPC
- Tabelas imutáveis (sales_order_items, sales_payments, receipts): sem UPDATE/DELETE policies
- RPCs financeiros/sensíveis: apenas owner/admin/manager (conforme feature)
- Anon: zero acesso a dados de negócio