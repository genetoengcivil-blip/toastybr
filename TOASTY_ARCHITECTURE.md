# TOASTY_ARCHITECTURE.md

Este documento detalha a arquitetura geral do sistema Toasty, focando na separação de responsabilidades, fluxo de dados e a estrutura dos agentes de IA.

## Visão Geral Arquitetural
A arquitetura adota um padrão modular, separando as camadas de dados, aplicação, autenticação e a camada de inteligência artificial.

## Fluxo de Dados Conceitual
O sistema é projetado seguindo um fluxo conceitual claro para as interações da IA:
**Data $\rightarrow$ Metric $\rightarrow$ Insight $\rightarrow$ Recommendation $\rightarrow$ Action $\rightarrow$ Execution $\rightarrow$ Outcome**

## Componentes Principais
1.  **Data Layer (Supabase/DB):** Armazena todas as entidades de negócio (Organizações, Usuários, Pedidos, Estoque, etc.).
2.  **Application Layer (Backend/Services):** Lógica de negócio, autenticação, autorização (RBAC), e orquestração de agentes.
3.  **AI Layer (Agents & Flows):** Responsável por processar dados, gerar insights, recomendações e executar ações, utilizando os agentes definidos.
4.  **Presentation Layer (Frontend):** Interface do usuário (Dashboard, Menu, PDV, etc.).

## Estrutura dos Agentes
Os agentes de IA são definidos com capacidades, permissões e ferramentas específicas, evitando o *hardcoding* de lógica complexa no frontend.

### Definição de Agentes
Cada agente deve seguir um padrão estruturado:
*   `id`
*   `code` (Ex: `toasty_manager`, `sales_ai`, `finance_ai`)
*   `name`
*   `description`
*   `category`
*   `capabilities`
*   `required_permissions`
*   `allowed_tools`
*   `active`
*   `version`

### Rastreamento de Execuções
Toda execução relevante de agente deve ser rastreável através da tabela `ai_agent_runs`:
*   `organization_id`
*   `unit_id`
*   `agent_id`
*   `initiated_by`
*   `trigger_type`
*   `input_summary`
*   `tools_used`
*   `started_at`
*   `completed_at`
*   `status`
*   `error`
*   `model_provider`
*   `model_name`
*   `token_usage`
*   `estimated_cost`
*   `correlation_id`

## Fases do Projeto (Roadmap)
O projeto será implementado sequencialmente, seguindo a nomenclatura revisada:

*   **Fase 0: Discovery e documentação** (Análise de código, definição de arquitetura)
*   **Fase 1: Foundation** (Estrutura de dados, autenticação, multi-tenancy, RBAC)
*   **Fase 2: Menu & Products** (Implementação das funcionalidades de navegação e produtos)
*   **Fase 3: Orders & POS** (Implementação de pedidos e Ponto de Venda)
*   **Fase 4: Kitchen** (Módulos da cozinha)
*   **Fase 5: Inventory** (Módulos de estoque)
*   **Fase 6: Purchasing** (Módulos de compras)
*   **Fase 7: Financial** (Módulos financeiros)
*   **Fase 8: CRM** (Módulos de relacionamento com o cliente)
*   **Fase 9: Analytics** (Módulos de inteligência e relatórios)
*   **Fase 10: Toasty Intelligence** (Implementação do núcleo de IA e recomendações)
*   **Fase 11: Automations** (Implementação de fluxos automatizados)
*   **Fase 12: Hardening** (Segurança, otimização e testes finais)