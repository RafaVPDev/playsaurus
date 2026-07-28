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
  próximos passos. Linguagem simples e voltada à tarefa; sem código, caminhos de
  arquivos, nomes de tabelas, componentes, rotas internas ou detalhes de
  implementação.
- **Referência** (consulta funcional): glossário; matriz de permissões
  (perfil × ação); FAQ. Deve explicar as regras do produto de forma objetiva,
  sem virar uma segunda seção de Arquitetura.

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
Confira **cada afirmação contra o código**, mas adapte a apresentação ao público.
Documentação bem escrita que descreve algo que não existe é o erro mais comum
(e mais difícil de perceber).

- Na **Arquitetura** e nos relatórios internos, registre arquivos de origem,
  fatos confirmados, inferências e lacunas.
- Na **Usabilidade** e na **Referência**, use o código apenas para validar o
  conteúdo. Não publique caminhos de arquivos, blocos de auditoria, evidências
  técnicas, inferências ou lacunas. Quando algo não estiver confirmado, omita a
  informação e registre a pendência somente no relatório interno.

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
- Use o código como fonte de verdade e não invente comportamentos.
- Em Arquitetura e relatórios internos, cite os arquivos de origem e separe
  claramente fatos confirmados, inferências e lacunas.
- Em Usabilidade e Referência, NÃO mostre caminhos de arquivos, nomes internos,
  trechos de código, fontes técnicas, blocos de "fato confirmado", "inferência"
  ou "lacuna". Se algo não estiver confirmado, omita e registre a pendência
  somente no relatório interno.
- Respeite o público de cada seção: Arquitetura é técnica; Usabilidade ensina
  tarefas ao usuário final; Referência serve para consulta funcional rápida.
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
O código é apenas fonte de verificação e não deve aparecer no texto publicado.

Organize um artigo por tarefa (ajuste ao produto): primeiros passos; login e
acesso; navegação; [uma página por tela/funcionalidade principal];
configurações; solução de problemas.

Cada tutorial deve conter: 1) o que será feito; 2) quem pode fazer;
3) pré-requisitos; 4) passo a passo numerado; 5) resultado esperado;
6) observações e alertas; 7) problemas comuns; 8) próximos passos.

- Escreva como um guia de uso para alguém que conhece o trabalho, mas não
  conhece o código nem a arquitetura do sistema.
- Use os nomes visíveis na interface para menus, campos, botões, status e
  perfis. Explique termos inevitáveis na primeira vez em que aparecerem.
- Prefira instruções como "No menu lateral, acesse..." e "Selecione..." em vez
  de descrever rotas, requisições, tabelas, funções ou processamento interno.
- Explique o que o usuário precisa fazer, o que acontece na tela e qual será o
  resultado. Só mencione detalhes técnicos quando forem indispensáveis para a
  pessoa concluir a tarefa.
- NÃO inclua caminhos como `src/...`, nomes de componentes, hooks, tabelas,
  migrations, APIs, endpoints, payloads, variáveis de ambiente ou trechos de
  código.
- NÃO crie seções ou observações chamadas "Fato confirmado no código", "Fonte",
  "Evidência", "Inferência", "Lacuna", "Implementação" ou equivalentes.
- Não descreva como o sistema foi implementado. Converta validações técnicas em
  mensagens úteis, por exemplo: o que preencher, qual formato usar e como
  corrigir um erro exibido.
- Não repita FAQ, glossário ou matriz de permissões completos nesta seção.
  Quando necessário, crie apenas um link para a página correspondente em
  Referência.
- Não invente ações ou botões que não existem.
- Marque com comentário MDX {/* screenshot: <tela> */} onde entra imagem.
- No frontmatter, use `publico: admin` ou `publico: todos` para indicar quem
  enxerga o artigo (usado pela busca/filtragem por perfil, quando o produto
  tiver tela de ajuda).

Antes de finalizar, releia cada página com este teste: "Uma pessoa cliente,
sem acesso ao repositório, entende este conteúdo e consegue executar a tarefa?"
Se algum trecho só for útil para desenvolvedores, mova-o para Arquitetura ou
remova-o. Não deixe observações técnicas no final dos artigos.
```

### Prompt 4 — Referência (glossário, permissões, FAQ)
```
Crie a seção Referência em projetos/<id>/docs/referencia/ como material de
consulta funcional para usuários e administradores, não como documentação
técnica. Consulte o código para confirmar as regras, mas não exponha a
investigação técnica no conteúdo publicado.

- glossario.md: termos que aparecem na interface, nos processos e na
  documentação. Definições curtas, em linguagem simples, explicando o significado
  para quem usa o produto. Inclua um termo técnico somente se ele estiver
  visível ao usuário ou for indispensável para usar/administrar o sistema.
- permissoes.md: matriz de perfis × ações, DERIVADA do controle de acesso real
  do código (não de suposição pelo nome do perfil). Use os nomes exibidos no
  produto e respostas objetivas como "Pode", "Não pode" e "Somente quando...".
  Explique exceções pelo efeito prático para o usuário, sem descrever políticas,
  claims, tabelas, funções ou verificações internas.
- perguntas-frequentes.md: FAQ no formato — categorias em "##", perguntas em
  "###". No frontmatter, liste em `faq_admin` as categorias visíveis só para
  administradores. Responda primeiro de forma direta e, quando necessário,
  inclua poucos passos práticos ou um link para o tutorial de Usabilidade.

Só inclua perguntas cujas respostas você confirma no comportamento atual.

Regras de linguagem:
- NÃO inclua caminhos de arquivos, nomes de componentes, tabelas, migrations,
  APIs, endpoints, funções, variáveis de ambiente ou trechos de código.
- NÃO inclua blocos de auditoria, fontes técnicas, "fato confirmado",
  "inferência", "lacuna" ou explicações sobre como a conclusão foi obtida.
- Não transforme o glossário em dicionário de tecnologias nem o FAQ em guia de
  troubleshooting para desenvolvedores.
- Quando uma regra não estiver confirmada, não publique uma suposição. Registre
  a pendência apenas no relatório interno de cobertura.

Antes de finalizar, confirme que cada item responde a uma dúvida de uso,
permissão ou significado. Conteúdo sobre estrutura, infraestrutura, segurança
interna ou implementação pertence à seção Arquitetura.
```

### Prompt 4A — Simplificar Usabilidade e Referência já existentes
```
Revise todo o conteúdo já existente em:
- projetos/<id>/docs/usabilidade/
- projetos/<id>/docs/referencia/

Objetivo: deixar essas duas seções adequadas para clientes, usuários finais e
administradores que não têm acesso ao código.

Na Usabilidade:
- preserve tarefas, passos, nomes visíveis na interface, regras funcionais,
  alertas, problemas comuns, screenshots e links úteis;
- reescreva explicações técnicas como orientações práticas;
- remova caminhos de arquivos, rotas internas, nomes de componentes, hooks,
  tabelas, migrations, APIs, endpoints, funções, payloads, variáveis de ambiente,
  trechos de código e detalhes de implementação;
- remova blocos ou frases de "Fato confirmado no código", "Fonte", "Evidência",
  "Inferência", "Lacuna", "Implementação" e equivalentes;
- não acrescente um resumo técnico no fim dos artigos.

Na Referência:
- mantenha apenas termos úteis para quem usa o produto, regras de permissão e
  dúvidas frequentes;
- transforme a matriz de permissões em linguagem funcional, usando os nomes de
  perfis e ações exibidos no sistema;
- responda o FAQ de forma direta, com passos curtos ou links para Usabilidade;
- remova tecnologias, estrutura interna e explicações de engenharia que
  pertençam à Arquitetura.

Não altere Arquitetura, código do produto, screenshots, links válidos,
frontmatter ou regras funcionais confirmadas. Se algum conteúdo técnico removido
for importante para desenvolvedores e ainda não existir em Arquitetura, apenas
liste a sugestão no relatório interno; não o mova automaticamente.

Ao final, informe quais arquivos foram alterados e rode: npm run build -- <id>
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

Valide também a adequação de linguagem:
- Usabilidade deve ser orientada a tarefas e não pode conter caminhos de
  arquivos, nomes de tabelas/componentes, APIs, endpoints, trechos de código,
  blocos de evidência, fatos confirmados, inferências ou lacunas.
- Referência deve ser uma consulta funcional objetiva e não pode repetir
  conteúdo técnico da Arquitetura.
- Qualquer evidência técnica ou pendência encontrada deve ficar somente no
  relatório interno, nunca acrescentada às páginas de Usabilidade ou Referência.

Crie `.Relatorios de cobertura/<id>/relatorio-de-cobertura.md` com uma matriz:
módulo do produto | página de arquitetura | tutorial de usabilidade |
screenshots disponíveis | status (completo/parcial/pendente) | motivo da pendência.

O relatório é interno: não crie links para ele dentro de `projetos/<id>/docs/`
e não o inclua na sidebar ou no build público.

Corrija os problemas encontrados somente na documentação, no tema e nas
automações do projeto dentro do Playsaurus. Não altere o código do produto.
Ao final: npm run build -- <id>
```

### Prompt 7 — Integrar a documentação à Central de Ajuda
```
Integre a documentação publicada de <PRODUTO> à Central de Ajuda do próprio
sistema. A documentação deve ser a única fonte dos artigos pesquisáveis e das
Perguntas Frequentes exibidas nessa tela.

Antes de alterar qualquer arquivo:
- analise a arquitetura, as rotas, o layout e o design system reais do produto;
- localize a tela, rota ou componente de Ajuda, caso já exista;
- confira como `public/docs` é servido em desenvolvimento e produção;
- procure por `public/docs/help-index.json` e analise seu schema real;
- identifique como o perfil do usuário autenticado é representado no sistema;
- preserve recursos e destinos úteis que já existirem na área de Ajuda.

Não presuma framework, nomes de componentes, rotas ou bibliotecas. Adapte a
solução aos padrões existentes. Não altere o conteúdo-fonte da documentação
apenas para simplificar a implementação da tela.

## Conteúdo permitido

A pesquisa pode usar somente conteúdo destinado ao uso do produto:
- Usabilidade;
- Referência funcional;
- Perguntas Frequentes.

Nunca indexe ou exiba:
- Arquitetura para desenvolvedores;
- banco de dados, APIs, componentes ou detalhes de implementação;
- relatórios de cobertura;
- auditorias, evidências, inferências ou lacunas técnicas;
- arquivos internos ou materiais que não façam parte da ajuda ao usuário.

Respeite o público definido no frontmatter ou no índice:
- conteúdo `publico: todos` pode aparecer para qualquer usuário;
- conteúdo `publico: admin` só pode aparecer para perfis administrativos reais;
- categorias listadas em `faq_admin` seguem a mesma restrição.

Não confie apenas na interface para ocultar conteúdo restrito. Filtre os dados
antes de montar FAQs e resultados.

## Criar ou adaptar a tela

Se já existir uma Central de Ajuda:
- preserve a rota, identidade visual, estrutura geral e recursos existentes;
- mantenha os destinos atuais dos quatro cards, quando já estiverem definidos;
- substitua FAQs ou artigos hardcoded pela leitura da documentação;
- adicione ou ajuste o campo de pesquisa conforme este prompt.

Se a tela não existir:
- crie uma rota de Ajuda integrada ao layout autenticado do sistema;
- adicione o acesso no menu apropriado;
- implemente os quatro cards e o painel de conteúdo descritos abaixo;
- use os componentes, ícones, cores, tipografia e padrões de acessibilidade do
  próprio projeto.

Não crie uma página visualmente desconectada do restante do sistema.

## Modelo visual obrigatório

A tela deve seguir esta composição:

1. Cabeçalho:
   - título “Central de ajuda”;
   - subtítulo curto explicando que o usuário pode encontrar respostas e
     orientações sobre o sistema.

2. Primeira linha com quatro cards:
   - Guia rápido;
   - Vídeo tutoriais;
   - Fale conosco;
   - Base de conhecimento.

Cada card deve ter ícone, título, descrição curta e ação correspondente.
Preserve os destinos e comportamentos já existentes. Se algum destino ainda não
estiver implementado, não invente URL externa: mantenha a apresentação coerente
com o produto e registre a pendência no resumo final.

3. Abaixo dos cards, um único painel principal:
   - cabeçalho do painel com título à esquerda;
   - campo de pesquisa alinhado à direita no desktop;
   - conteúdo abaixo em largura total;
   - cantos arredondados, borda suave e espaçamento consistente com o sistema.

4. Aparência:
   - fundo claro e limpo;
   - cards com bordas suaves, cantos arredondados e sombra discreta;
   - hierarquia visual clara;
   - cores, tipografia, ícones e estados derivados do design system real;
   - no mobile, cards empilhados ou em grade adequada e pesquisa em largura
     total, sem rolagem horizontal.

Use como referência de composição uma Central de Ajuda com quatro cards no topo
e FAQ/pesquisa no painel inferior. Não copie cores ou componentes de outro
produto.

## Estado sem pesquisa

Quando o campo estiver vazio:
- mantenha visíveis o cabeçalho e os quatro cards superiores;
- use o título “Perguntas frequentes” no painel principal;
- mostre somente as perguntas e respostas em formato accordion;
- carregue as perguntas da página de Perguntas Frequentes da documentação,
  preferencialmente `referencia/perguntas-frequentes`;
- respeite as categorias comuns e administrativas definidas na documentação;
- permita abrir e fechar cada pergunta sem navegar para outra página.

Neste estado, NÃO mostre:
- lista de artigos;
- cards de documentação;
- categorias da documentação;
- sugestões de leitura;
- conteúdos relacionados;
- resultados de pesquisa;
- links genéricos para todas as páginas.

As respostas do accordion vêm da documentação, mas isso não deve criar uma
segunda seção visível de documentação. Se não houver uma página de Perguntas
Frequentes, não invente perguntas: mostre um estado vazio adequado e informe a
ausência no resumo final.

## Estado com pesquisa

Considere que existe pesquisa quando o valor normalizado do campo contém pelo
menos um caractere útil. Nesse estado:
- mantenha visíveis o cabeçalho e os quatro cards superiores;
- oculte completamente o accordion de Perguntas Frequentes;
- altere o título do painel para “Resultados da busca”;
- pesquise somente em Usabilidade e Referência;
- exclua Arquitetura e materiais internos mesmo quando o termo coincidir;
- aplique o filtro de público antes de exibir os resultados;
- mostre somente os resultados correspondentes ao termo pesquisado.

Cada resultado deve apresentar:
- título;
- seção ou categoria;
- pequeno trecho relacionado à busca;
- indicação visual de que será aberto em outra página.

Ao clicar, abra a página exata da documentação em uma nova aba. Em links HTML ou
React, use o equivalente a:

target="_blank"
rel="noopener noreferrer"

Não apresente o conteúdo completo do artigo dentro da Central de Ajuda.

Quando não houver correspondência, mostre um estado claro de “Nenhum resultado
encontrado”, sem voltar automaticamente ao FAQ e sem sugerir artigos aleatórios.
Ao limpar o campo, restaure imediatamente o estado “Perguntas frequentes”.

## Regras da pesquisa

- Ignore diferenças entre maiúsculas e minúsculas.
- Normalize acentos: “configuracao” deve encontrar “Configuração”.
- Considere título, subtítulos, palavras-chave, resumo e conteúdo pesquisável.
- Dê mais peso a correspondências no título e nos subtítulos.
- Ordene os resultados por relevância.
- Destaque ou selecione um trecho relacionado sem inserir HTML inseguro.
- Limite a quantidade inicial de resultados para manter a tela legível.
- Evite buscas desnecessárias para um campo vazio.
- Se a busca for assíncrona, trate carregamento, erro e respostas fora de ordem.
- Preserve navegação por teclado, foco visível, labels e atributos de
  acessibilidade.

## Fonte dos dados

Use `public/docs/help-index.json` quando ele já existir. Antes de criar outro
mecanismo:
1. confira o arquivo;
2. analise seu schema real;
3. confirme se ele contém URLs, títulos, seção, headings, resumo, conteúdo
   pesquisável, público e FAQs;
4. confirme que Arquitetura e conteúdos internos foram excluídos;
5. reaproveite o índice existente sempre que ele atender ao fluxo.

Não duplique manualmente no frontend os textos dos artigos ou das Perguntas
Frequentes. A documentação é a fonte de verdade.

Se o índice não existir ou não tiver os campos necessários:
- ajuste ou crie o gerador no fluxo de documentação;
- prefira gerar a partir dos arquivos Markdown/MDX quando estiverem disponíveis;
- se apenas o build existir, extraia os dados do HTML em `public/docs`;
- não adicione dependências quando os recursos atuais forem suficientes;
- produza URLs compatíveis com as rotas reais do Docusaurus;
- normalize URLs e fragmentos em Unicode NFC para âncoras com acentos;
- exclua explicitamente Arquitetura, relatórios e materiais internos;
- inclua informações de público necessárias à filtragem;
- extraia o FAQ mantendo categorias, perguntas, respostas, âncoras e restrições;
- adicione um comando claro ao `package.json`, como `build:help-index`;
- integre a regeneração ao fluxo de publicação da documentação;
- mantenha o índice no projeto quando a produção depender dele como arquivo
  estático.

Se o índice atual incluir Arquitetura, corrija o gerador. Não filtre apenas
depois que dados técnicos já tiverem sido enviados ou incorporados à tela.

## URLs e ambientes

Não fixe domínio, porta ou origem. Monte os links a partir do caminho base real
da documentação, normalmente `/docs/`, respeitando a configuração do produto.

Teste no mínimo:
- `/docs/`;
- uma página de Usabilidade;
- uma página de Referência;
- uma âncora de Pergunta Frequente;
- `/docs/help-index.json`.

Confirme que URLs de página com barra final resolvem para o `index.html`
correspondente.

Se, somente em desenvolvimento, `/docs/<pagina>/` cair no roteador do aplicativo
e retornar 404:
- faça uma correção restrita ao servidor de desenvolvimento;
- resolva `/docs/**/` para o `index.html` correspondente;
- não intercepte arquivos com extensão, assets, imagens ou `help-index.json`;
- não modifique produção quando a hospedagem já resolver diretórios.

Se o problema também existir em produção, ajuste o servidor ou a hospedagem
apenas para `/docs/**`. Não esconda links quebrados e não redirecione toda URL
desconhecida para uma única página.

## Validação obrigatória

Antes de concluir:
- gere ou atualize `help-index.json`;
- rode lint, verificação de tipos e build do sistema;
- confirme que o estado inicial mostra somente quatro cards e FAQ;
- confirme que nenhum artigo aparece com a pesquisa vazia;
- confirme que, ao pesquisar, o FAQ desaparece;
- teste pesquisas com e sem acentos;
- teste correspondências no título, subtítulo e corpo;
- confirme que nenhum conteúdo de Arquitetura aparece;
- teste a filtragem de conteúdo comum e administrativo;
- confirme que FAQs e resultados vêm da documentação, sem listas duplicadas;
- valide todas as URLs e âncoras presentes no índice;
- confirme que cada resultado abre a documentação em uma nova aba;
- teste carregamento, erro e nenhum resultado;
- teste teclado, foco e leitor de tela nos controles principais;
- teste desktop e mobile;
- teste os links em desenvolvimento e na forma real de publicação.

Ao finalizar, informe:
- arquivos criados e alterados;
- se a tela de Ajuda foi criada ou adaptada;
- origem e comando de geração do índice;
- seções incluídas e excluídas;
- quantidade de artigos e perguntas indexadas;
- comportamento aplicado a conteúdos administrativos;
- testes executados;
- destinos ausentes nos cards e outras limitações encontradas.

Não altere outras funcionalidades do produto e não substitua conteúdo dinâmico
da documentação por textos hardcoded apenas para fazer a tela parecer pronta.
```

### Prompt EXTRA — Atualizar a doc quando entra uma funcionalidade nova
```
Uma funcionalidade nova/alterada entrou em <PRODUTO>: <DESCREVA a mudança e/ou
aponte os arquivos/PR>.

1. Leia o código dessa funcionalidade e identifique o que na documentação é
   afetado (cruzando com projetos/<id>/docs/).
2. Atualize o que for necessário, mantendo o padrão de cada seção:
   - Arquitetura: página do módulo afetado (fluxo, regras, segurança, diagrama).
   - Usabilidade: tutorial da tarefa em linguagem de usuário (passos, telas,
     resultado esperado), sem evidências ou detalhes técnicos.
   - Referência: matriz de permissões, glossário e FAQ, se mudaram, sempre em
     linguagem funcional e objetiva.
3. Se telas mudaram, ajuste/adicione o spec em projetos/<id>/playwright/ e
   regenere as imagens afetadas: npm run screenshots -- <id>
4. Atualize a "data da última revisão" das páginas mexidas.

Regras: cite os arquivos de origem somente na Arquitetura ou em relatórios
internos; não invente; não altere o produto; não exponha dados sensíveis. Em
Usabilidade e Referência, não publique caminhos, código, fontes, evidências,
inferências ou lacunas. Ao final: npm run build -- <id>
```

---

Ordem recomendada para uma documentação nova: **1 → 2 → 3 → 4 → 5 → 6 → 7**.
Em uma documentação já preenchida, use o **4A** sempre que Usabilidade ou
Referência estiverem técnicas demais. Fazer o inventário técnico (1) antes de
escrever reduz muito o risco de uma documentação bonita, porém diferente do
funcionamento real do produto.
