Responsabilidade:
modelagem PostgreSQL, migrations, tenancy e integridade.

## Ordem conceitual

1. SaaS Foundation
2. Menu
3. Orders
4. Kitchen
5. Inventory
6. Purchasing
7. Financial
8. CRM
9. Analytics
10. Intelligence

A IA nunca deve ser o centro do banco.

## Multi-tenancy

Estrutura principal:

Organization
→ Units
→ Users/Data.

Entidades tenant-owned devem carregar `organization_id`.

Quando aplicável:

`unit_id`.

## Segurança

Quando Supabase for utilizado:

* RLS;
* policies;
* server-side authorization;
* nenhuma service role no browser.

## Migration Safety

Antes de migration:

* ler migrations existentes;
* verificar schema;
* FK;
* PK;
* unique constraints;
* indexes;
* triggers;
* RLS;
* dados existentes.

Não executar migration destrutiva em banco remoto com dados reais sem autorização.