/**
 * Exporta a documentação em PDF (A4), mantendo o design, com todas as páginas.
 *
 * Gera as duas versões, igual o Visualizar:
 *   - cliente  (modo público — sem as seções internas, ex.: Arquitetura)
 *   - equipe   (modo interno — tudo)
 *
 * Salva em projetos/<id>/static/pdf/documentacao-<cliente|equipe>.pdf.
 *
 * Uso: npm run pdf -- meu-projeto
 *
 * Como funciona: builda cada modo, sobe `docusaurus serve`, enumera as páginas na
 * ordem da navbar+sidebar, e usa o Chromium do Playwright para imprimir cada
 * página em A4 (page.pdf). Os PDFs de cada página são unidos com pdf-lib.
 *
 * Atenção ao vazamento: `static/` é copiado inteiro nos dois builds, então o
 * `publicar.mjs` remove o `*-equipe.pdf` antes de enviar ao repositório do cliente.
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { BIN, RAIZ, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';

const MODOS = [
  { modo: 'publico', rotulo: 'cliente' },
  { modo: 'interno', rotulo: 'equipe' },
];

// Esconde a moldura web (navbar, sidebar, TOC, rodapé, paginação) e deixa só o
// artigo — mantendo a tipografia/estilo do conteúdo.
const CSS_IMPRESSAO = `
  .navbar, .navbar-sidebar, .theme-doc-sidebar-container, aside.theme-doc-sidebar-container,
  .theme-doc-toc-desktop, .theme-doc-toc-mobile, .table-of-contents, .pagination-nav,
  .theme-doc-breadcrumbs, .theme-doc-footer, footer.footer, .theme-back-to-top-button,
  .docItemCol_ > .theme-doc-footer { display: none !important; }
  .main-wrapper, main, .container, .row, .docItemContainer_ { margin: 0 !important; padding: 0 !important; max-width: none !important; }
  .col { max-width: 100% !important; flex: 0 0 100% !important; padding: 0 !important; }
  article { max-width: none !important; }
`;

/** Porta livre pedindo a porta 0 ao SO. */
function portaLivre() {
  return new Promise((resolve, reject) => {
    const sonda = net.createServer();
    sonda.on('error', reject);
    sonda.listen(0, HOST, () => {
      const { port } = sonda.address();
      sonda.close(() => resolve(port));
    });
  });
}

/** Espera a porta aceitar conexão — sinal de que o serve subiu. */
function esperarPorta(port, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const inicio = Date.now();
    const tentar = () => {
      const s = net.connect(port, HOST);
      s.once('connect', () => {
        s.destroy();
        resolve();
      });
      s.once('error', () => {
        s.destroy();
        if (Date.now() - inicio > timeout) reject(new Error('serve não respondeu a tempo'));
        else setTimeout(tentar, 250);
      });
    };
    tentar();
  });
}

/** Sobe `docusaurus serve` de um build e devolve { proc, port }. */
async function servir(id, modo, dir) {
  const port = await portaLivre();
  const proc = spawn(
    process.execPath,
    [BIN.docusaurus, 'serve', '--dir', path.relative(RAIZ, dir), '-p', String(port), '-h', HOST, '--no-open'],
    { cwd: RAIZ, env: { ...process.env, DOC_PROJETO: id, DOC_MODO: modo, FORCE_COLOR: '0' } },
  );
  await esperarPorta(port);
  return { proc, port };
}

/** Ordem de leitura: home + navbar (seções) + sidebar de cada seção. */
async function enumerarPaginas(page, origem, basePath) {
  const paginas = [`${origem}${basePath}`]; // home como capa
  const vistos = new Set([basePath.replace(/\/+$/, '/')]);

  await page.goto(`${origem}${basePath}`, { waitUntil: 'domcontentloaded' });
  const secoes = await page.$$eval('.navbar__item.navbar__link', (els) =>
    els.map((e) => e.getAttribute('href')).filter(Boolean),
  );

  for (const secao of secoes) {
    if (!secao.startsWith(basePath)) continue;
    await page.goto(`${origem}${secao}`, { waitUntil: 'domcontentloaded' });
    const links = await page.$$eval('.theme-doc-sidebar-menu a.menu__link', (els) =>
      els.map((e) => e.getAttribute('href')).filter(Boolean),
    );
    for (const href of [secao, ...links]) {
      const chave = href.replace(/\/+$/, '/');
      if (href.startsWith(basePath) && !vistos.has(chave)) {
        vistos.add(chave);
        paginas.push(`${origem}${href}`);
      }
    }
  }
  return paginas;
}

/** Imprime uma URL em PDF A4 e devolve o buffer. */
async function imprimir(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.emulateMedia({ media: 'screen', colorScheme: 'light' });
  await page.addStyleTag({ content: CSS_IMPRESSAO });
  // Mermaid renderiza no cliente: espera o SVG aparecer quando houver diagrama.
  if (await page.$('.mermaid')) {
    await page.waitForSelector('.mermaid svg', { timeout: 5000 }).catch(() => {});
  }
  return page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
  });
}

async function gerarPdf(browser, id, modo, rotulo, projeto) {
  const dir = modo === 'publico' ? projeto.dirBuildCliente : projeto.dirBuild;

  console.log(`\n[${rotulo}] Gerando o build (${modo})...`);
  await executar(process.execPath, [path.join(aqui, 'build.mjs'), id], { env: { DOC_MODO: modo } });

  console.log(`[${rotulo}] Subindo o servidor local...`);
  const { proc, port } = await servir(id, modo, dir);
  const origem = `http://${HOST}:${port}`;

  try {
    const page = await browser.newPage();
    const urls = await enumerarPaginas(page, origem, projeto.baseUrl);
    console.log(`[${rotulo}] ${urls.length} páginas. Imprimindo...`);

    const merged = await PDFDocument.create();
    for (const [i, url] of urls.entries()) {
      process.stdout.write(`  [${i + 1}/${urls.length}] ${url.replace(origem, '')}\n`);
      const buffer = await imprimir(page, url);
      const doc = await PDFDocument.load(buffer);
      const copiadas = await merged.copyPages(doc, doc.getPageIndices());
      copiadas.forEach((p) => merged.addPage(p));
    }
    await page.close();

    const destino = path.join(projeto.dirStatic, 'pdf', `documentacao-${rotulo}.pdf`);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, await merged.save());
    console.log(`[${rotulo}] PDF salvo em ${path.relative(RAIZ, destino)}`);
  } finally {
    if (!proc.killed) proc.kill();
  }
}

try {
  const id = idDoArgumento();
  const projeto = carregarProjeto(id);

  console.log(`Exportando a documentação do ${projeto.nome} (${id}) em PDF...`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const { modo, rotulo } of MODOS) {
      await gerarPdf(browser, id, modo, rotulo, projeto);
    }
  } finally {
    await browser.close();
  }
  console.log('\nPDFs gerados em static/pdf/ (cliente e equipe).');
} catch (e) {
  encerrarComErro(e);
}
