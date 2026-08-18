Responsabilidade:
garantir que toda documentação do projeto seja consistente, final e livre de regressões.

## Regras

### Read Before Write

Antes de modificar um arquivo existente:

1. leia o conteúdo atual;
2. identifique o que está correto;
3. identifique apenas o trecho que precisa de alteração;
4. preserve o restante.

### Patch Before Overwrite

Para alterações pontuais:

preferir Edit/Patch.

Não sobrescrever arquivo inteiro sem necessidade.

### Prompt não é documento

Nunca copiar instruções do usuário para dentro do arquivo final.

Exemplos proibidos em documentação final:

* "adicione";
* "corrija";
* "inclua";
* "restaure";
* "melhore";
* "substitua";
* "faça";
* "não use";
* "utilize";
* "depois faça";
* "cada fase deve conter".

### Zero Placeholders

Não permitir:

* TODO;
* placeholder;
* "content will be added";
* "preencher depois";
* seção vazia;
* comentário temporário.

### Regression Check

Se uma pequena revisão provocar grande redução no tamanho ou estrutura de um documento, investigar antes de salvar.

Exemplo:

300 linhas → 60 linhas

deve ser tratado como possível regressão.

### Final Document Test

Antes de considerar documentação pronta:

"Uma pessoa que nunca viu o prompt consegue compreender este documento?"

Se não, corrigir.

### Linguagem

Documentação principal:

Português brasileiro.

Termos técnicos podem permanecer em inglês.