# Como preencher a documentação de um produto

Quando você cria um produto pelo painel ("Novo produto"), ele nasce com um
**esqueleto que já compila**: uma página inicial por seção, tema, config e um
modelo de Playwright. Este guia é sobre o passo seguinte — **escrever o conteúdo**
de verdade (tirar os placeholders).

Não há preenchimento automático a partir do código: os artigos são escritos à
mão, com ou sem ajuda de IA. Abaixo, os dois caminhos.

Ao longo do guia, troque:
- `<id>` — id do projeto na instalação (ex.: `career-compass`)
- `<PRODUTO>` — nome do produto (ex.: Career Compass)
- `<REPO>` — caminho/branch do repositório do produto

---

## Parte 1 — Preencher manualmente

### Onde ficam os arquivos
Tudo do conteúdo vive em `projetos/<id>/`:

```
projetos/<id>/docs/
├── arquitetura/     (para a equipe técnica)
├── usabilidade/     (para o usuário final)
└── referencia/      (glossário, permissões, FAQ)
```

Cada arquivo `.md` ou `.mdx` dentro dessas pastas vira uma página. Ele entra
sozinho no menu da esquerda — a ordem vem do `sidebar_position` do frontmatter.

### Anatomia de um artigo
No topo do arquivo, um frontmatter simples:

```markdown
---
sidebar_position: 3
publico: todos        # "todos" ou "admin" (usado pela busca da Ajuda por perfil)
---

# Título da página

Conteúdo em Markdown normal. Pode usar títulos ##, listas, tabelas, código,
imagens e, em arquivos .mdx, componentes e diagramas Mermaid.
```

- **`sidebar_position`** decide a ordem no menu. Sem ele, entra em ordem alfabética.
- **`publico`** (`todos`/`admin`) só importa se o app do produto tiver uma tela de
  Ajuda que consome o índice — filtra o que cada perfil enxerga.

### Imagens
- Ficam em `projetos/<id>/static/img/` e são referenciadas a partir da raiz:
  `![alt](/img/pasta/arquivo.png)`.
- Os screenshots gerados pelo Playwright caem em
  `projetos/<id>/static/img/usabilidade/geradas/` — veja "Screenshots" abaixo.

### O que cada seção costuma ter
- **Arquitetura** (técnica): por página — objetivo, contexto, componentes, fluxo,
  regras de negócio, segurança, falhas possíveis, limitações, conteúdos
  relacionados, data da última revisão. Diagramas Mermaid ajudam nos fluxos.
- **Usabilidade** (tutorial): o que será feito, quem pode fazer, pré-requisitos,
  passo a passo numerado, resultado esperado, observações, problemas comuns,
  próximos passos. Linguagem simples; sem citar nomes internos de código.
- **Referência**: glossário; matriz de permissões (papel × ação); FAQ.

### Formato do FAQ (referencia/perguntas-frequentes.md)
Categorias em `##`, perguntas em `###`. No frontmatter, `faq_admin` lista as
categorias visíveis só para administradores:

```markdown
---
faq_admin:
  - Administração
---

## Geral
### Como faço login?
Resposta...

## Administração
### Como removo um usuário?
Resposta...
```

### Ver enquanto escreve
Na raiz da instalação compartilhada:

```bash
npm run start -- <id>
```

Abre com recarga automática a cada alteração.

### Conferir e publicar
```bash
npm run build -- <id>       # valida (links quebrados derrubam o build)
npm run screenshots -- <id> # regera as imagens (precisa do app rodando + .env)
npm run publish -- <id>     # copia o build para o public/docs do produto
```

### A regra de ouro
Confira **cada afirmação contra o código**. Documentação bem escrita que descreve
algo que não existe é o erro mais comum (e mais difícil de perceber). Ao inferir
algo, deixe explícito.

---

## Parte 2 — Preencher com ajuda de IA (prompts sugeridos)

Prompts genéricos para acelerar o preenchimento. **Rode um por vez**, conferindo
cada entrega. Cole o bloco de contexto no topo de cada um e ajuste os `<...>`.

### Bloco de contexto (colar no topo de todos)
```
Você vai documentar o produto <PRODUTO> (repositório em <REPO>).
A documentação usa Docusaurus e vive na instalação compartilhada, em
projetos/<id>/docs/ (os arquivos já existem como esqueleto). Escreva em
português do Brasil.

Regras invioláveis:
- NÃO altere o código do produto.
- Toda afirmação técnica relevante deve citar o arquivo de origem.
- Separe claramente: fato confirmado no código, inferência e lacuna.
- Não exponha segredos, tokens, senhas, URLs privadas ou dados pessoais.
- Cada arquivo .md/.mdx usa frontmatter com sidebar_position (ordem no menu).
```

### Prompt 1 — Inventário técnico (mapear o código antes de escrever)
```
Analise integralmente o código de <PRODUTO> antes de escrever qualquer doc.
Mapeie, com evidência nos arquivos: stack e dependências; rotas e telas;
componentes principais; hooks e contextos; autenticação; papéis e permissões;
modelo de dados e relacionamentos; migrations; políticas de acesso (RLS/roles);
funções/procedimentos no banco; jobs/eventos assíncronos; integrações externas;
tratamento de erros; auditoria/logs; variáveis de ambiente; build e deploy.

Crie:
- projetos/<id>/docs/arquitetura/inventario-tecnico.md
- projetos/<id>/docs/arquitetura/matriz-de-componentes.md
- projetos/<id>/docs/arquitetura/mapa-de-rotas.md

Não invente comportamentos. Ao considerar migrations, avalie a sequência
completa (não trate uma migration antiga como estado final).
```

### Prompt 2 — Documentação de Arquitetura (equipe técnica)
```
Usando SOMENTE o que está confirmado no código e no inventário técnico, escreva
a seção Arquitetura em projetos/<id>/docs/arquitetura/.

Crie uma página por tema relevante do produto (ajuste a lista à realidade dele):
visão geral; arquitetura de alto nível; frontend; backend; banco e entidades;
autenticação, papéis e autorização; isolamento de dados (se houver multiempresa);
tempo real (se houver); funções/serviços; módulos principais do produto;
integrações externas; notificações e auditoria; segurança; deploy e configuração;
observabilidade e troubleshooting; limitações e riscos conhecidos.

Cada página deve conter: objetivo; contexto; componentes; fluxo; regras de
negócio; segurança; falhas possíveis; práticas recomendadas; limitações;
conteúdos relacionados; data da última revisão.

Use diagramas Mermaid onde ajudarem (arquitetura geral, autenticação, fluxos
críticos, sincronização de integrações). Ao terminar, rode: npm run build -- <id>
```

### Prompt 3 — Documentação de Usabilidade (cliente/usuário final)
```
Escreva a seção Usabilidade em projetos/<id>/docs/usabilidade/, orientada a
tarefas, para usuários não técnicos. Baseie-se nas rotas, telas, labels, botões,
validações e permissões REAIS do produto. Documente só o que existe no código.

Organize um artigo por tarefa (ajuste ao produto): primeiros passos; login e
acesso; navegação; [uma página por tela/funcionalidade principal];
configurações; perguntas frequentes; solução de problemas.

Cada tutorial deve conter: 1) o que será feito; 2) quem pode fazer;
3) pré-requisitos; 4) passo a passo numerado; 5) resultado esperado;
6) observações e alertas; 7) problemas comuns; 8) próximos passos.

- Linguagem simples e direta. Não cite nomes internos de tabelas/componentes.
- Não invente ações ou botões que não existem.
- Marque com comentário MDX {/* screenshot: <tela> */} onde entra imagem.
- No frontmatter, use `publico: admin` ou `publico: todos` para indicar quem
  enxerga o artigo (usado pela busca/filtragem por perfil, quando o produto
  tiver tela de ajuda).
```

### Prompt 4 — Referência (glossário, permissões, FAQ)
```
Crie a seção Referência em projetos/<id>/docs/referencia/:

- glossario.md: termos funcionais e técnicos do produto.
- permissoes.md: matriz de papéis × ações, DERIVADA do controle de acesso real
  do código (não de suposição por nome de papel).
- perguntas-frequentes.md: FAQ no formato — categorias em "##", perguntas em
  "###". No frontmatter, liste em `faq_admin` as categorias visíveis só para
  administradores.

Só inclua perguntas cujas respostas você confirma no comportamento atual.
```

### Prompt 5 — Adaptar os screenshots (o Playwright nasceu como modelo)
```
A pasta projetos/<id>/playwright/ foi gerada como MODELO e precisa ser ajustada
ao <PRODUTO>. Abra a tela de login real e as rotas reais e:

- Corrija os seletores de LoginPage.ts (ids/labels reais) e as rotas de
  screenshots.spec.ts para as telas do produto.
- Prefira getByRole/getByLabel/data-testid; evite timeouts fixos.
- Viewport 1440x900; desative animações; espere o carregamento real.
- Masque nomes, e-mails, telefones, avatares e dados sensíveis. Use uma conta de
  DEMONSTRAÇÃO com dados fictícios — nunca dados reais de cliente.
- Preencha projetos/<id>/.env (a partir do .env.example).

Se precisar de data-testid no produto, apenas LISTE os pontos sugeridos e aguarde
aprovação — não altere o produto por conta própria. Rode: npm run screenshots -- <id>
```

### Prompt 6 — Revisão e cobertura (auditoria final)
```
Faça uma auditoria da documentação de <PRODUTO>. Valide: links internos
quebrados; imagens ausentes; páginas sem título; páginas fora da sidebar;
inconsistências entre Arquitetura e Usabilidade; funcionalidades descritas que
NÃO existem no código; nomes antigos do produto; termos sem entrada no glossário;
exposição de dados sensíveis; diagramas Mermaid inválidos; tema escuro;
responsividade; build do Docusaurus.

Crie projetos/<id>/docs/referencia/relatorio-de-cobertura.md com uma matriz:
módulo do produto | página de arquitetura | tutorial de usabilidade |
screenshots disponíveis | status (completo/parcial/pendente) | motivo da pendência.

Corrija só problemas dentro de projetos/<id>/. Ao final: npm run build -- <id>
```

### Prompt EXTRA — Atualizar a doc quando entra uma funcionalidade nova
```
Uma funcionalidade nova/alterada entrou em <PRODUTO>: <DESCREVA a mudança e/ou
aponte os arquivos/PR>.

1. Leia o código dessa funcionalidade e identifique o que na documentação é
   afetado (cruzando com projetos/<id>/docs/).
2. Atualize o que for necessário, mantendo o padrão de cada seção:
   - Arquitetura: página do módulo afetado (fluxo, regras, segurança, diagrama).
   - Usabilidade: tutorial da tarefa (passos, telas, resultado esperado).
   - Referência: matriz de permissões e glossário, se mudaram.
3. Se telas mudaram, ajuste/adicione o spec em projetos/<id>/playwright/ e
   regenere as imagens afetadas: npm run screenshots -- <id>
4. Atualize a "data da última revisão" das páginas mexidas.

Regras: cite os arquivos de origem; não invente; não altere o produto; não
exponha dados sensíveis. Ao final: npm run build -- <id>
```

---

Ordem recomendada: **1 → 2 → 3 → 4 → 5 → 6**. Fazer o inventário técnico (1)
antes de escrever reduz muito o risco de uma documentação bonita, porém diferente
do funcionamento real do produto.
