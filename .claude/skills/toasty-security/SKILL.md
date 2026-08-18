Responsabilidade:
segurança global do SaaS.

## Princípios

* deny by default;
* least privilege;
* tenant isolation;
* server-side authorization;
* RBAC;
* RLS;
* proteção contra IDOR;
* secrets server-side;
* input validation;
* audit logs;
* proteção contra privilege escalation.

Antes de considerar funcionalidade pronta, verificar:

"Usuário consegue acessar dados de outra organização alterando URL, request ou payload?"

Se sim:

bloquear conclusão.