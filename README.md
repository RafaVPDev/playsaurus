# Playsaurus — instalação compartilhada de documentação

Uma instalação do Docusaurus + Playwright que gera a documentação de **vários
produtos**. Cada produto tem só o que é dele (artigos, marca, screenshots, vídeos)
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
produto, informar **onde fica o repositório dele nesta máquina** e disparar
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
| `npm run start -- oktask` | Servidor de desenvolvimento, com recarga |
| `npm run build -- oktask` | Gera o site em `build/oktask` |
| `npm run serve -- oktask` | Serve o build como um servidor estático serviria |
| `npm run screenshots -- oktask` | Captura as telas do produto (precisa do app rodando) |
| `npm run videos -- oktask` | Grava o vídeo-tutorial de jornada em `static/videos/` (precisa do app rodando) |
| `npm run publish -- oktask` | Build + cópia para o repositório do produto + índice da Ajuda |

## Estrutura

```
compartilhado/     tema base, componentes, BasePage e overlays de vídeo (cursor + legenda), projeto.cjs
projetos/<id>/     artigos, marca, screenshots, specs, projeto.json
scripts/           build, publicação, índice da Ajuda, painel
painel/            a página do painel
build/<id>/        saída do build (não versionada)
```

**Compartilhado:** a instalação, o CSS estrutural, a homepage, os utilitários de
captura, os scripts e os padrões editoriais.

**Por projeto:** os artigos, a marca e as cores, a `baseUrl`, as credenciais e —
o que costuma surpreender — os **specs de screenshot**, porque rotas e seletores
são de cada produto.

> Resista a subir para `compartilhado/` algo que só serve a um produto. Os specs
> de screenshot são o caso mais tentador e o mais errado.

## Como o caminho do repositório é resolvido

Nesta ordem, o primeiro que existir vence:

1. a variável de ambiente declarada no `projeto.json` (ex.: `OKTASK_REPO`);
2. `caminhos.local.json` — escrito pelo painel, específico da máquina;
3. o caminho relativo do `projeto.json` — o padrão versionado.

Se nenhum resolver, os comandos param com uma mensagem dizendo o que fazer, em
vez de publicar em algum lugar errado.

## Adicionar um produto

No painel, botão **+ Novo produto**. Ele lista os repositórios que encontrar na
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

Feito isso o produto já aparece no painel e o **Gerar build** funciona. A partir
daí é escrever os artigos em `docs/`.

> Os arquivos em `playwright/` nascem como modelo: os seletores do `LoginPage` e
> as rotas do spec são chutes razoáveis, não os do seu produto. Ajuste antes de
> rodar os screenshots — é por isso que rotas e seletores não são compartilhados.

O índice da Central de Ajuda nasce desligado (`indiceAjuda.gerar: false`): ele só
faz sentido se o app do produto tiver uma tela que consuma o `help-index.json`.

O `projeto.json` é validado no carregamento: campo faltando, `baseUrl` sem barra
final ou seção sem pasta correspondente falham na hora, com o motivo.

## Excluir um produto

No cartão do produto, **Excluir este produto** (com confirmação em dois passos).
Isso apaga `projetos/<id>/` e o build gerado — serve para recriar um produto que
ficou com defeito. **O repositório do produto e o `public/docs` publicado não são
tocados.**

## O que é versionado

O conteúdo de `projetos/` **não** vai para o git: é individual de cada máquina.
Quem clonar a instalação sobe a pasta vazia e cria os próprios produtos pelo
painel — o Oktask inclusive. O que se compartilha é a ferramenta (`compartilhado/`,
`scripts/`, `painel/`), não a documentação de cada um.

> Consequência: a fonte da documentação de cada produto vive só na máquina de
> quem a mantém e no build publicado em `public/docs`. Faça backup do que
> escrever — aqui o git não segura por você.

## Armadilhas conhecidas

Estas falhas não geram mensagem de erro — tudo aparenta funcionar:

| Armadilha | Sintoma | Correção |
|---|---|---|
| **Status 200 enganoso** | Toda rota responde 200 porque o SPA devolve o `index.html` do app | Validar por **conteúdo** (título) e por arquivo com extensão (`/docs/sitemap.xml`) |
| **Barra final ausente** | `/docs/secao/artigo` cai no 404 do app; `/docs/secao/artigo/` funciona | `trailingSlash: true` e todos os links construídos com barra |
| **Servidor de desenvolvimento do produto** | `/docs` não abre no `npm run dev` do app | Testar com o build do produto, ou com `npm run serve -- <id>` aqui |
| **Publicação não propagada** | O commit existe, mas o site não mudou | Conferir o *Publish* no Lovable antes de investigar o código |
| **Links relativos a diretórios** | Com `trailingSlash`, links como `../secao/` resolvem errado | Apontar para o arquivo: `../secao/index.mdx` |
| **Índice da Ajuda desatualizado** | A Central de Ajuda mostra conteúdo antigo | Ele é gerado no `publish`; rode o comando completo |

## Publicação: manual, por opção

Não há automação. `npm run publish -- <id>` copia o build para o `public/docs`
do produto; depois é preciso **commitar essa pasta** no repositório do produto e
publicar pelo Lovable.

Automações por GitHub Actions chegaram a existir e foram removidas
deliberadamente: cada publicação gerava um commit e o Lovable ressincronizava,
somando ruído a um repositório que já carrega o build da documentação. A decisão
foi trocar automação por controle.

> Não acople o build da documentação ao build do produto: as dependências do
> Docusaurus são pesadas e uma falha na documentação passaria a interromper o
> deploy da aplicação.

## O acoplamento que essa escolha cria

Com a instalação compartilhada, um erro em `compartilhado/css/base.css`, no
`BasePage` ou numa atualização de dependência passa a afetar **todos** os
produtos de uma vez. Com um produto só isso não custa nada; a partir do segundo,
vale testar o build de cada um antes de commitar mudanças em `compartilhado/`.
