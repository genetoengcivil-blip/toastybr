# TOASTY_AI_ARCHITECTURE.md

Este documento detalha a arquitetura conceitual do Toasty OS, focada em um modelo de Monolito Modular, governança de IA e controle de fluxo de trabalho (Human-in-the-Loop).

## 1. Domínios Modulares (Monolito Modular)
A arquitetura será baseada na separação de domínio clara, onde cada domínio (Identity, Organizations, Users, RBAC, Menu, Orders, POS, Kitchen, Inventory, Purchasing, Finance, Customers, Loyalty, Marketing, Analytics, Notifications, AI, Audit) possui suas próprias regras, serviços e contratos.

## 2. Agentes e Estrutura de Controle
### 2.1. Agentes
Existem dois tipos de agentes:
*   **Agentes de Desenvolvimento:** Usados na construção do sistema (ex: Product Manager, Backend Engineer).
*   **Agentes de Gestão:** Funcionalidades reais do Toasty OS, que operarão no dashboard administrativo.

### 2.2. Toasty AI Team
A equipe gerencial oficial é composta pelos seguintes especialistas de IA:
*   **Toasty Manager:** Coordenação geral.
*   **Sales AI:** Faturamento, pedidos, tendências.
*   **Finance AI:** Receitas, despesas, fluxo de caixa, CMV.
*   **Stock AI:** Estoque, consumo, ruptura, validade.
*   **Purchase AI:** Necessidade de compra, fornecedores, lead time.
*   **Margin AI:** Ficha técnica, Food Cost, margem.
*   **Pricing AI:** Análise de preço e simulação (sem automação de preços).
*   **Customer AI:** Clientes, frequência, churn.
*   **Marketing AI:** Promoções, campanhas, segmentação.
*   **Loyalty AI:** Fidelidade e recompensas.
*   **Kitchen AI:** Tempo de preparo, filas, gargalos.
*   **Operations AI:** Fluxo operacional, capacidade.
*   **Team AI:** Escalas e necessidade de pessoal.
*   **Waste AI:** Perdas e desperdício.
*   **Forecast AI:** Previsão de vendas, estoque, compras.
*   **Risk AI:** Detecção de anomalias (sem acusar fraude).
*   **Reputation AI:** Análise de reputação externa.
*   **CEO AI:** Estratégia e crescimento.

### 2.3. Agent Orchestrator
O `Agent Orchestrator` será o ponto central de coordenação, seguindo o fluxo:
`User` $\rightarrow$ `Toasty Manager / Agent` $\rightarrow$ `Agent Orchestrator` $\rightarrow$ `Data Tools` $\rightarrow$ `Specialist Agents` $\rightarrow$ `Reasoning` $\rightarrow$ `Recommendation` $\rightarrow$ `Action Gateway`.
Responsabilidades: Interpretar solicitações, identificar especialistas, executar ferramentas, consolidar resultados, evitar chamadas desnecessárias, registrar execução e retornar evidências.

## 3. Camada de Dados e Ferramentas
### 3.1. Data Tools
Os agentes não terão acesso livre ao banco de dados. O acesso será mediado por ferramentas estruturadas (Data Tools), como: `get_sales_summary()`, `get_inventory_status()`, `get_purchase_requirements()`, etc.
Todas as ferramentas devem respeitar `organization_id`, `unit_id` e permissões do usuário.

### 3.2. Restrição de SQL
É estritamente proibido fornecer acesso irrestrito ao PostgreSQL, incluindo SQL arbitrário, *service roles* ou *connection strings*. A IA deve operar exclusivamente através das `Data Tools`.

## 4. Fluxo de Ação e Governança
### 4.1. AI Action Gateway (Human-in-the-Loop)
Fluxo obrigatório para ações críticas:
`Agent Recommendation` $\rightarrow$ `Proposed Action` $\rightarrow$ `Permission Check` $\rightarrow$ **`Human Approval`** $\rightarrow$ `Application Service` $\rightarrow$ `Database` $\rightarrow$ `Audit Log`.
Exemplo: O Purchase AI gera um rascunho de pedido, que exige aprovação humana antes da execução.

### 4.2. Estrutura de Ações (`ai_actions`)
A execução de ações será modelada pela entidade `ai_actions` com os seguintes campos obrigatórios:
*   `id`, `organization_id`, `unit_id`
*   `agent_type`, `action_type`, `title`, `description`
*   `rationale`, `payload`, `expected_impact`, `confidence`
*   `status` (propriedades: `proposed`, `reviewing`, `approved`, `rejected`, `executed`, `failed`, `expired`)
*   `approved_by`, `approved_at`, `executed_at`

### 4.3. Insights e Recomendações (Separação)
Existe uma separação obrigatória entre:
*   **Insight:** Fatos extraídos dos dados (Ex: "Estoque de carne está abaixo do ideal.").
*   **Recommendation:** A ação sugerida (Ex: "Comprar 25kg de carne.").
*   **Action:** A execução planejada (Ex: "Criar pedido de compra de 25kg.").
A hierarquia é: `Data` $\rightarrow$ `Metric` $\rightarrow$ `Insight` $\rightarrow$ `Recommendation` $\rightarrow$ `Action` $\rightarrow$ `Result`.

## 5. Multi-Tenancy
Toda execução de agente deve obrigatoriamente carregar o contexto de `organization_id` e, quando aplicável, `unit_id`. Isso deve ser validado no backend e no banco de dados para garantir que um agente jamais acesse dados de outra organização.

## 6. Auditoria e Performance
### 6.1. Auditoria (`Audit`)
Todos os passos, decisões e execuções devem ser registrados em um log de auditoria.

### 6.2. Performance e Confiança
*   **Confiança:** Insights preditivos (Forecasts) devem sempre incluir um nível de confiança (Ex: 82%).
*   **Explainability:** Todas as recomendações devem ser acompanhadas de uma explicação estruturada detalhando as evidências usadas (Ex: Por que a recomendação foi feita: Estoque atual, Consumo previsto, Estoque de segurança, Lote sugerido).
*   **Result Tracking:** Deve haver um mecanismo para medir o resultado das recomendações (`Recommendation Outcome`), rastreando KPIs (Receita, Custo, Conversões) gerados pela ação.

## 7. Estrutura de Dashboard e Relatórios
### 7.1. Toasty Command Center (`/command-center`)
Esta rota será a central inteligente, reunindo:
*   Toasty Health Score
*   Situação atual
*   Alertas críticos
*   Oportunidades (Recomendações)
*   Ações pendentes
*   Previsões
*   Agentes (Status geral)
*   Atividade recente

### 7.2. Dashboard Principal
A hierarquia da página inicial será focada em gestão de atenção:
1. **TOASTY** (Saudação)
2. **Toasty Manager** (Mensagem contextual)
3. **PRECISA DA SUA ATENÇÃO** (Alertas e recomendações)
4. **HOJE** (KPIs)
5. **OPERAÇÃO EM TEMPO REAL** (Pedidos, cozinha, estoque)
6. **AI TEAM** (Resumo dos agentes)
7. **PREVISÕES**
8. **PERFORMANCE** (Gráficos e análises)

### 7.3. Daily Briefing
Estrutura sugerida para o `Toasty Daily Briefing`:
*   **Ontem:** Faturamento, pedidos, ticket médio, margem, lucro estimado.
*   **Destaques:** Problemas, Estoque, Financeiro, Clientes.
*   **Previsão de Hoje:** Previsão de vendas, estoque, etc.
*   **Top 3 Recomendações.**

## 8. Stack Sugerida
A preferência técnica para o projeto, dada a natureza do LLM e a necessidade de um frontend moderno, é:
*   **Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, React Hook Form, Zod, Recharts, Lucide.
*   **Backend/Data:** Supabase (PostgreSQL, Auth, RLS) como base de dados, utilizando Edge Functions ou camada server-side para orquestração de IA e comunicação com LLMs via APIs.

## 9. Roadmap e Faseamento
O projeto seguirá um caminho estruturado:
*   **Fase 0 (Foundation):** Estruturar a base (estrutura do projeto, database foundation, organizações, unidades, autenticação, RBAC, RLS, layout, dashboard shell, audit foundation, AI architecture foundation sem LLM real).
*   **Fase 1:** Construção da Fundação, focando na estrutura e na preparação da arquitetura para os agentes (Foundation, mas sem implementação completa dos 18 agentes).
*   **Critério de Sucesso:** Estabelecer a cadeia de valor: Venda $\rightarrow$ Pedido $\rightarrow$ Cozinha $\rightarrow$ Estoque $\rightarrow$ Financeiro $\rightarrow$ Analytics $\rightarrow$ Insights $\rightarrow$ Agentes $\rightarrow$ Recomendação $\rightarrow$ Aprovação $\rightarrow$ Ação.