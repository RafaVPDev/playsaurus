# Playsaurus — instalação compartilhada de documentação

Uma instalação do Docusaurus + Playwright que gera a documentação de **vários
projetos**. Cada projeto tem só o que é dele (artigos, marca, screenshots, vídeos)
em `projetos/<id>/`; o resto — dependências, tema base, scripts — é comum.

O motivo é direto: cada projeto com documentação própria carregaria seu próprio
`node_modules` de ~700 MB. Aqui é um só.

## Começando (inclusive em outra máquina)

**Dois cliques em `painel.bat`.** Ele instala as dependências na primeira vez,
sobe o painel e abre o navegador. Quem preferir o terminal:

```bash
npm run painel
```

O painel abre em `http://127.0.0.1:4321` e é por onde se faz tudo: escolher o
projeto, informar **onde fica o repositório dele nesta máquina** e disparar
screenshots, build e publicação com o log ao vivo.

> O painel **não** é uma página estática: abrir `painel/index.html` direto no
> navegador não funciona, porque é o servidor local que executa os comandos. Ele
> fica no ar enquanto a janela do console estiver aberta.

Esse caminho é a única configuração por máquina. Ele vai para
`caminhos.local.json`, que **não é versionado** — ou seja, ninguém precisa
editar arquivo versionado para trabalhar aqui.

## Comandos

Todos aceitam o id do projeto depois de `--`. Com um único projeto instalado, o
id pode ser omitido.

| Comando | O que faz |
|---|---|
| `npm run painel` | Abre o painel (recomendado) |
| `npm run start -- meu-projeto` | Servidor de desenvolvimento, com recarga |
| `npm run build -- meu-projeto` | Gera o site em `build/meu-projeto` |
| `npm run serve -- meu-projeto` | Serve o build como um servidor estático serviria |
| `npm run screenshots -- meu-projeto` | Captura as telas do projeto (precisa do app rodando) |
| `npm run videos -- meu-projeto` | Grava todos os roteiros em `static/videos/`, preservando as subpastas (precisa do app rodando) |
| `npm run videos -- meu-projeto tutoriais-rapidos/central-ajuda.jornada.spec.ts` | Grava somente o roteiro informado |
| `npm run pdf -- meu-projeto` | Exporta a documentação em PDF nas duas versões (cliente e equipe) e salva em `projetos/<id>/static/pdf/` |
| `npm run publish -- meu-projeto` | Build público + cópia para o repositório do projeto + índice da Ajuda |

## Dois modos de build

Todo build existe em dois sabores, controlados pela variável `DOC_MODO`:

| Modo | `DOC_MODO` | Saída | Conteúdo |
|---|---|---|---|
| **Interno** (padrão) | (omitido) | `build/<id>/` | Todas as seções |
| **Público** (cliente) | `publico` | `build/<id>-cliente/` | Só as seções sem `"publicar": false` no `projeto.json` |

`npm run publish` sempre usa o modo público. Os botões **Visualizar** no painel abrem cada um no seu modo. Os botões **Gerar build** e **Iniciar servidor** usam o modo interno.

### PDFs exportados

`npm run pdf -- <id>` gera os dois PDFs em `projetos/<id>/static/pdf/`:

- `documentacao-cliente.pdf` — versão pública, sem seções internas
- `documentacao-equipe.pdf` — versão completa, com tudo

Por ficarem em `static/`, os PDFs são copiados junto com o build e ficam acessíveis no site. A documentação exibe um botão **⬇ Baixar PDF** na navbar que aponta automaticamente para o PDF correto de acordo com o modo de build.

**Anti-vazamento:** `publish` remove `documentacao-equipe.pdf` do build público antes de copiá-lo para o repositório do produto. O PDF interno nunca chega ao cliente.

> Execute `npm run pdf` sempre que o conteúdo mudar, antes de publicar. Enquanto o
> arquivo não existir, o botão da navbar resulta em 404.

## Estrutura

```
compartilhado/     tema base, componentes, BasePage e overlays de vídeo (cursor + legenda), projeto.cjs
projetos/<id>/     artigos, marca, screenshots, specs, projeto.json
scripts/           build, publicação, PDF, índice da Ajuda, painel
painel/            a página do painel
build/<id>/        saída do build interno (não versionada)
build/<id>-cliente/ saída do build público (não versionada)
```

**Compartilhado:** a instalação, o CSS estrutural, a homepage, os utilitários de
captura, os scripts e os padrões editoriais.

**Por projeto:** os artigos, a marca e as cores, a `baseUrl`, as credenciais e —
o que costuma surpreender — os **specs de screenshot**, porque rotas e seletores
são de cada projeto.

Os vídeos seguem a organização dos roteiros. Por exemplo:

```text
projetos/meu-projeto/playwright/tutoriais-rapidos/central-ajuda.jornada.spec.ts
  -> projetos/meu-projeto/static/videos/tutoriais-rapidos/central-ajuda.webm
```

Cada arquivo de jornada deve conter um único `test(...)`, pois cada roteiro gera
um vídeo final. Para gravar só um tutorial, informe seu caminho relativo à pasta
`playwright/` no comando.

> Resista a subir para `compartilhado/` algo que só serve a um projeto. Os specs
> de screenshot são o caso mais tentador e o mais errado.

## Como o caminho do repositório é resolvido

Nesta ordem, o primeiro que existir vence:

1. a variável de ambiente declarada no `projeto.json` (ex.: `MEUPROJETO_REPO`);
2. `caminhos.local.json` — escrito pelo painel, específico da máquina;
3. o caminho relativo do `projeto.json` — o padrão versionado.

Se nenhum resolver, os comandos param com uma mensagem dizendo o que fazer, em
vez de publicar em algum lugar errado.

## Adicionar um projeto

No painel, botão **+ Novo projeto**. Ele lista os repositórios que encontrar na
sua pasta de projetos — basta clicar no que quer documentar, conferir o nome e
escolher uma cor.

Repositórios já documentados e os que não têm `public/` aparecem desabilitados,
com o motivo: sem `public/` não há onde o app servir a documentação.

O que é criado em `projetos/<id>/`:

| Arquivo | Para quê |
|---|---|
| `projeto.json` | nome, `url`, `baseUrl`, seções e onde fica o repositório |
| `tema.css` | identidade visual inteira, derivada da cor escolhida |
| `docs/<secao>/index.mdx` | uma página inicial por seção, para já compilar |
| `playwright/` | **modelo** de captura — precisa de ajuste, ver abaixo |
| `.env.example` | credenciais da conta de demonstração |

Feito isso o projeto já aparece no painel e o **Gerar build** funciona. A partir
daí é escrever os artigos em `docs/`.

> Os arquivos em `playwright/` nascem como modelo: os seletores do `LoginPage` e
> as rotas do spec são chutes razoáveis, não os do seu projeto. Ajuste antes de
> rodar os screenshots — é por isso que rotas e seletores não são compartilhados.

Todo `publish` gera `public/docs/help-index.json` automaticamente. Se existir uma
página chamada `perguntas-frequentes.md` ou `.mdx`, ela é localizada sem
configuração adicional, com prioridade para a seção `referencia`. Quando houver
mais de uma candidata, use `indiceAjuda.faqArquivo` no `projeto.json` para indicar
explicitamente qual delas alimenta o FAQ.

O `projeto.json` é validado no carregamento: campo faltando, `baseUrl` sem barra
final ou seção sem pasta correspondente falham na hora, com o motivo.

## Excluir um projeto

No cartão do projeto, **Excluir este projeto** (com confirmação em dois passos).
Isso apaga `projetos/<id>/` e o build gerado — serve para recriar um projeto que
ficou com defeito. **O repositório do projeto e o `public/docs` publicado não são
tocados.**

## O que é versionado

O conteúdo de `projetos/` **não** vai para o git: é individual de cada máquina.
Quem clonar a instalação sobe a pasta vazia e cria os próprios projetos pelo
painel. O que se compartilha é a ferramenta (`compartilhado/`,
`scripts/`, `painel/`), não a documentação de cada um.

> Consequência: a fonte da documentação de cada projeto vive só na máquina de
> quem a mantém e no build publicado em `public/docs`. Faça backup do que
> escrever — aqui o git não segura por você.

## Playwright — duas configs separadas

| Config | Usada por | Roda |
|---|---|---|
| `playwright.config.ts` | `npm run screenshots` | `*.spec.ts` exceto `*.jornada.spec.ts` e `_debug.spec.ts` |
| `playwright.video.config.ts` | `npm run videos` | Só `*.jornada.spec.ts` |

As configs são intencionalmente separadas: gravar vídeo deixa cada spec 2–3× mais lento. `screenshots` ignora os roteiros de jornada via `testIgnore`; `videos` faz o inverso com `testMatch`. Misturar os dois torna o `npm run screenshots` desnecessariamente lento.

## Armadilhas conhecidas

Estas falhas não geram mensagem de erro — tudo aparenta funcionar:

| Armadilha | Sintoma | Correção |
|---|---|---|
| **Status 200 enganoso** | Toda rota responde 200 porque o SPA devolve o `index.html` do app | Validar por **conteúdo** (título) e por arquivo com extensão (`/docs/sitemap.xml`) |
| **Rota da documentação cai no SPA** | No localhost abre, mas em produção `/docs/secao/artigo/` devolve o app ou uma página vazia | A Central de Ajuda deve usar a `url` do `help-index.json` sem alterá-la; ela aponta para `/docs/secao/artigo/index.html` |
| **Servidor de desenvolvimento do app** | `/docs` não abre no `npm run dev` do app | Testar com o build do projeto, ou com `npm run serve -- <id>` aqui |
| **Publicação não propagada** | O commit existe, mas o site não mudou | Conferir a publicação na plataforma de hospedagem antes de investigar o código |
| **Links relativos a diretórios** | Com `trailingSlash`, links como `../secao/` resolvem errado | Apontar para o arquivo: `../secao/index.mdx` |
| **Índice da Ajuda desatualizado** | A Central de Ajuda mostra conteúdo antigo | Ele é gerado no `publish`; rode o comando completo |

## Publicação: manual, por opção

Não há automação. `npm run publish -- <id>` copia o build para o `public/docs`
do projeto; depois é preciso **commitar essa pasta** no repositório do projeto e
publicar pela plataforma de hospedagem.

Automações por GitHub Actions chegaram a existir e foram removidas
deliberadamente: cada publicação gerava um commit e a plataforma ressincronizava,
somando ruído a um repositório que já carrega o build da documentação. A decisão
foi trocar automação por controle.

> Não acople o build da documentação ao build da aplicação: as dependências do
> Docusaurus são pesadas e uma falha na documentação passaria a interromper o
> deploy da aplicação.

## O acoplamento que essa escolha cria

Com a instalação compartilhada, um erro em `compartilhado/css/base.css`, no
`BasePage` ou numa atualização de dependência passa a afetar **todos** os
projetos de uma vez. Com um projeto só isso não custa nada; a partir do segundo,
vale testar o build de cada um antes de commitar mudanças em `compartilhado/`.
