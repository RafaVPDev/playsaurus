# Plano — Exportar documentação em PDF (Playsaurus)

## Objetivo
Botão "Exportar PDF" no painel: gera a doc em **A4**, **mantendo o design**, com
**todas as páginas**, nas **duas versões** (cliente e equipe, igual o Visualizar),
salvando em `projetos/<id>/static/pdf/`.

## Viável? Sim
- Playsaurus já usa **Playwright**; o Chromium dele imprime PDF nativo
  (`page.pdf({ format:'A4', printBackground:true })`) renderizando o HTML/CSS real →
  preserva o design.
- Reaproveita build por modo (`build/<id>` e `build/<id>-cliente`), `docusaurus serve`
  e o modelo de ações do painel.
- Nova dependência: **`pdf-lib`** (JS puro) para juntar as páginas num PDF por versão.

## Script novo: `scripts/exportar-pdf.mjs`
Para cada modo — `publico` → `documentacao-cliente.pdf`; `interno` → `documentacao-equipe.pdf`:
1. Garante o build (build.mjs com DOC_MODO).
2. Sobe `docusaurus serve` numa porta livre (headless).
3. Enumera páginas na ordem de leitura: navbar (ordem das seções) → sidebar de cada
   seção (`.theme-doc-sidebar-menu a.menu__link`), + a home como capa. Mode-aware
   (no cliente não há Arquitetura).
4. Playwright/Chromium headless: por página → goto + networkidle → injeta CSS de
   impressão (esconde navbar/sidebar/TOC/footer/paginação, deixa só o `article`) +
   força tema claro → `page.pdf(A4, printBackground, margens, nº de página no rodapé)`.
5. Junta com `pdf-lib` num único PDF.
6. Salva em `projetos/<id>/static/pdf/documentacao-<cliente|equipe>.pdf`.
7. Encerra o serve.

## Painel
- Ação `exportar-pdf` em ACOES (painel.mjs) → botão "Exportar PDF" com log SSE.
- Não precisa de `.env` nem do app no ar (doc estática). Segue a trava de "Salvar".

## Anti-vazamento (importante)
`static/` é copiado inteiro nos dois builds. O `documentacao-equipe.pdf` vazaria para
o cliente. Solução: **`publicar.mjs` remove `*-equipe.pdf`** do build antes de copiar
para o repo do produto. Assim os dois ficam em `static/pdf/` localmente, mas o cliente
nunca recebe o de equipe.

## Arquivos
- Novo: `scripts/exportar-pdf.mjs`.
- Editar: `scripts/painel.mjs` (ação), `painel/index.html` (botão), `scripts/publicar.mjs`
  (remover *-equipe.pdf do build público), `package.json` (script `pdf` + dep `pdf-lib`).

## Verificação
1. `node scripts/exportar-pdf.mjs open-hearted-service` → 2 PDFs em static/pdf.
2. cliente: A4, sem chrome web, **sem Arquitetura**; equipe: **com Arquitetura**.
3. publish do cliente **não** leva `documentacao-equipe.pdf`.
