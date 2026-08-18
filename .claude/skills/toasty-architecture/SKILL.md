Responsabilidade:
proteger a arquitetura oficial do Toasty OS.

## Arquitetura oficial

Modular Monolith.

Não usar microserviços prematuramente.

Fluxo macro:

SaaS Foundation
→ Operational Domains
→ Analytics
→ Intelligence
→ Automations.

## Domínios

* Identity
* Organizations
* Units
* Users
* RBAC
* Menu
* Orders
* POS
* Kitchen
* Inventory
* Purchasing
* Finance
* Customers
* Loyalty
* Marketing
* Analytics
* Notifications
* AI
* Audit

Cada domínio deve possuir fronteiras claras.

## Princípios

* baixo acoplamento;
* alta coesão;
* regras de negócio fora da UI;
* contratos tipados;
* transações em operações críticas;
* idempotência;
* auditabilidade;
* evolução incremental.