# 1. FASE 0 — DISCOVERY

Melhore os entregáveis.

Substitua o entregável genérico por:

* `TOASTY_ARCHITECTURE.md`
* `TOASTY_AI_ARCHITECTURE.md`
* `TOASTY_DATABASE_PLAN.md`
* `TOASTY_ROADMAP.md`
* `TOASTY_PROGRESS.md`
* `TOASTY_DECISIONS.md`
* revisão cruzada de consistência;
* inspeção inicial do repositório antes da Fase 1.

Critério de aceite:

A Fase 0 só estará `Complete` quando os seis documentos estiverem preenchidos, consistentes e revisados.

---

# 2. FASE 1 — FOUNDATION

Corrigir dependência.

**Dependências:**
Conclusão e aprovação da Fase 0 — Discovery. A implementação deverá respeitar as decisões arquiteturais e de dados registradas nos documentos da Fase 0.

---

# 3. FASE 4 — KITCHEN

**Objetivo:**
Gerenciar o fluxo real de produção dos pedidos na cozinha, permitindo acompanhamento em tempo real, medição de desempenho e identificação de gargalos.

**Escopo:**

* KDS — Kitchen Display System;
* fila de produção;
* estados de preparo;
* timers;
* timestamps operacionais;
* SLA de preparo;
* identificação de atrasos;
* priorização visual;
* métricas de produção;
* tempo médio;
* mediana;
* p90;
* gargalos por produto e período.

**Entregáveis:**

* painel KDS funcional;
* integração com pedidos confirmados;
* transições controladas de status;
* registro dos timestamps;
* indicadores de atraso;
* dados preparados para Kitchen AI e Operations AI.

**Dependências:**

* Fase 2 — Menu & Products;
* Fase 3 — Orders & POS.

**Riscos:**

* inconsistência entre status do pedido e cozinha;
* concorrência;
* eventos duplicados;
* perda de atualização em tempo real;
* métricas incorretas.

**Critério de aceite:**

Um pedido confirmado deve chegar corretamente ao KDS, percorrer estados válidos e gerar dados confiáveis de tempo de produção.

---

# 4. FASE 5 — INVENTORY

**Dependências corretas:**

* Fase 2 — Menu & Products;
* Recipes/Fichas Técnicas;
* Fase 3 — Orders & POS;
* integração com eventos da Kitchen quando aplicável.

O Financeiro consumirá posteriormente dados de custo do Inventory; não deve ser pré-requisito para o Inventory.

**Escopo ampliado para incluir:**

* ingredients;
* inventory items;
* inventory movements;
* automatic depletion;
* stock counts;
* inventory count items;
* adjustments;
* waste;
* minimum stock;
* safety stock;
* lot/expiry preparation.

---

# 5. FASE 6 — PURCHASING

**Dependências corretas:**

* Inventory;
* Suppliers;
* Organization/Units;
* RBAC.

Purchasing deverá gerar dados que posteriormente alimentam o Financeiro.

**Entregáveis ampliados para:**

* fornecedores;
* produtos por fornecedor;
* pedido de compra;
* aprovação;
* recebimento;
* divergência entre pedido e recebimento;
* entrada de estoque;
* histórico de preços;
* sugestão de reposição.

---

# 6. FASE 7 — FINANCIAL

**Dependências:**

* Orders & POS;
* Payments;
* Purchasing;
* Inventory;
* Registers/Cash Sessions.

Financeiro recebe fatos econômicos dos módulos operacionais.

Evitar criar contabilidade fiscal completa nesta fase.

Trata-se inicialmente de gestão financeira e DRE gerencial.

---

# 7. FASE 8 — CRM

**Dependências principais:**

* Orders & POS;
* Customers;
* Organization/Unit;
* RBAC.

**Escopo ampliado para:**

* customers;
* addresses;
* history;
* segmentation;
* loyalty;
* points/cashback;
* coupons;
* promotions;
* campaigns;
* churn;
* customer lifetime indicators.

---

# 8. FASE 10 — TOASTY INTELLIGENCE

**Status:** Planned

Manter Human-in-the-Loop atual.

Adicionar explicitamente ao escopo:

* `ai_agent_definitions`;
* `ai_agent_runs`;
* `ai_insights`;
* `ai_recommendations`;
* `ai_actions`;
* `ai_action_approvals`;
* `ai_action_executions`;
* `recommendation_outcomes`;
* `ai_feedback`.

Não significa que todos serão implementados simultaneamente.

---

# 9. FASE 11 — AUTOMATIONS

**Status:** Planned

Manter a separação entre:

* automações de baixo risco;
* automações controladas.

---

# 10. DEPENDÊNCIAS SEM CICLOS

Após editar, faça uma validação das dependências entre fases.

A direção principal deverá ser:

F0 Discovery
↓
F1 Foundation
↓
F2 Menu
↓
F3 Orders
↓
F4 Kitchen
↓
F5 Inventory
↓
F6 Purchasing
↓
F7 Financial
↓
F8 CRM
↓
F9 Analytics
↓
F10 Intelligence
↓
F11 Automations
↓
F12 Hardening

Uma fase pode utilizar componentes de fases anteriores.

Evite declarar como pré-requisito um módulo que só será implementado em fase posterior.

---

# 11. NÃO REESCREVER O DOCUMENTO INTEIRO

Faça apenas as alterações necessárias.

Depois:

1. releia o roadmap;
2. valide Fases 0–12;
3. valide dependências;
4. valide status;
5. salve;
6. prossiga para `TOASTY_PROGRESS.md`.

Não peça nova instrução após concluir o roadmap.