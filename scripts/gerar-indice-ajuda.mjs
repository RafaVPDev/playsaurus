/**
 * Gera o índice consumido pela Central de Ajuda do produto.
 *
 * Lê os artigos de projetos/<id>/docs e produz `help-index.json` dentro da
 * documentação publicada, com as páginas (para a busca) e as perguntas
 * frequentes (para a lista de FAQ).
 *
 * A aplicação apenas busca esse JSON em tempo de execução — não há acoplamento
 * entre o build da documentação e o build do produto.
 *
 * Uso: npm run indice -- meu-projeto   (também roda dentro do publish)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { carregarProjeto, aplicarModo, destinoPublicacao, idDoArgumento, encerrarComErro } from './comum.mjs';

try {
  const id = idDoArgumento();
  // Aplica o modo (DOC_MODO): no público, as seções internas saem de `secoes` e o
  // índice ignora seus artigos — a busca da Central de Ajuda não os revela.
  const projeto = aplicarModo(carregarProjeto(id));
  const { destino } = destinoPublicacao(projeto);

  const contentDir = projeto.dirDocs;
  const outFile = path.join(destino, 'help-index.json');
  const sitemapFile = path.join(destino, 'sitemap.xml');

  // Sem a barra final: as URLs são montadas como `${BASE_URL}/secao/...`.
  const BASE_URL = projeto.baseUrl.replace(/\/+$/, '') || '';
  const SECOES = Object.fromEntries(projeto.secoes.map((s) => [s.id, s.rotulo]));
  const arquivoFaqConfigurado = projeto.indiceAjuda?.faqArquivo ?? null;

  // -------------------------------------------------------------- utilidades

  function listarArquivos(dir, out = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) listarArquivos(p, out);
      else if (/\.(md|mdx)$/.test(entry.name)) out.push(p);
    }
    return out;
  }

  /**
   * Usa o caminho configurado quando existir. Sem configuração, encontra uma
   * página chamada "perguntas-frequentes" e prioriza a seção de Referência.
   */
  function localizarArquivoFaq(arquivos) {
    if (arquivoFaqConfigurado) return arquivoFaqConfigurado;

    const candidatos = arquivos
      .map((arquivo) => path.relative(contentDir, arquivo).split(path.sep).join('/'))
      .filter((relativo) => /(^|\/)(?:\d+-)?perguntas-frequentes\.(?:md|mdx)$/i.test(relativo))
      .sort((a, b) => {
        const prioridade = (relativo) => relativo.startsWith('referencia/') ? 0 : 1;
        return prioridade(a) - prioridade(b) || a.localeCompare(b);
      });

    return candidatos[0] ?? null;
  }

  /** Frontmatter simples (chave: valor e listas com "- item"). */
  function lerFrontmatter(texto) {
    if (!texto.startsWith('---')) return { dados: {}, corpo: texto };
    const fim = texto.indexOf('\n---', 3);
    if (fim === -1) return { dados: {}, corpo: texto };
    const bruto = texto.slice(3, fim);
    const corpo = texto.slice(fim + 4);
    const dados = {};
    let chaveLista = null;
    for (const linha of bruto.split('\n')) {
      if (!linha.trim() || linha.trim().startsWith('#')) continue;
      const item = linha.match(/^\s+-\s+(.*)$/);
      if (item && chaveLista) { dados[chaveLista].push(item[1].trim()); continue; }
      const kv = linha.match(/^([\w-]+):\s*(.*)$/);
      if (kv) {
        const [, k, v] = kv;
        if (v === '') { chaveLista = k; dados[k] = []; }
        else { chaveLista = null; dados[k] = v.trim(); }
      }
    }
    return { dados, corpo };
  }

  /** Remove sintaxe que não interessa à busca, preservando o texto legível. */
  function limpar(md) {
    return md
      .replace(/```[\s\S]*?```/g, ' ')          // blocos de código e Mermaid
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')     // comentários MDX
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')     // imagens
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // links -> só o rótulo
      .replace(/^\s*[|>-].*$/gm, (l) => l.replace(/[|>]/g, ' ')) // tabelas/citações
      .replace(/[*_`#]/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Reproduz a regra de slug do Docusaurus: remove o prefixo numérico. */
  function caminhoDoArquivo(relativo) {
    const semExt = relativo.replace(/\.(md|mdx)$/, '');
    const partes = semExt.split('/').map((s) => s.replace(/^\d+-/, ''));
    if (partes[partes.length - 1] === 'index') partes.pop();
    return partes.join('/');
  }

  /**
   * URL canônica usada pelo Docusaurus e pelo sitemap.
   *
   * O trailingSlash do build gera cada rota como `pasta/index.html`, enquanto o
   * sitemap mantém a forma amigável `pasta/`.
   */
  function urlCanonicaDoArquivo(relativo) {
    const caminho = caminhoDoArquivo(relativo);
    return caminho ? `${BASE_URL}/${caminho}/` : `${BASE_URL}/`;
  }

  /**
   * URL entregue à Central de Ajuda.
   *
   * O arquivo explícito funciona tanto em servidores estáticos tradicionais
   * quanto em hospedagens de SPA que não transformam `/pasta/` em
   * `/pasta/index.html` antes de aplicar o catch-all do aplicativo.
   */
  function urlPublicaDoArquivo(relativo) {
    const caminho = caminhoDoArquivo(relativo);
    return caminho ? `${BASE_URL}/${caminho}/index.html` : `${BASE_URL}/index.html`;
  }

  /** Compara URLs ignorando a barra final, para validar contra o sitemap. */
  const semBarra = (u) => u.replace(/\/+$/, '') || BASE_URL;

  function urlsDoSitemap() {
    if (!existsSync(sitemapFile)) return null;
    const xml = readFileSync(sitemapFile, 'utf8');
    return new Set(
      [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
        semBarra(m[1].replace(/^https?:\/\/[^/]+/, '')),
      ),
    );
  }

  // -------------------------------------------------------------- construção

  const paginas = [];
  let faqs = [];
  const avisos = [];
  const sitemap = urlsDoSitemap();
  const arquivos = listarArquivos(contentDir);
  const arquivoFaq = localizarArquivoFaq(arquivos);

  for (const arquivo of arquivos) {
    const relativo = path.relative(contentDir, arquivo).split(path.sep).join('/');
    const bruto = readFileSync(arquivo, 'utf8');
    const { dados, corpo } = lerFrontmatter(bruto);

    const secaoId = relativo.split('/')[0];
    // Seção interna (fora de `secoes` no modo público): não entra no índice.
    if (!(secaoId in SECOES)) continue;
    const urlCanonica = urlCanonicaDoArquivo(relativo);
    const url = urlPublicaDoArquivo(relativo);
    if (sitemap && !sitemap.has(semBarra(urlCanonica))) {
      avisos.push(`URL fora do sitemap: ${urlCanonica} (${relativo})`);
    }

    const titulo = (corpo.match(/^#\s+(.+)$/m) || [, path.basename(relativo)])[1].trim();
    const headings = [...corpo.matchAll(/^#{2,3}\s+(.+)$/gm)]
      .map((m) => m[1].replace(/[*`]/g, '').replace(/^\d+(\.\d+)*\.?\s*/, '').trim())
      .filter(Boolean);
    const texto = limpar(corpo.replace(/^#\s+.+$/m, ''));
    const publico = dados.publico || 'todos';

    paginas.push({
      id: relativo,
      titulo,
      secao: SECOES[secaoId] || secaoId,
      url,
      publico,
      headings,
      resumo: texto.slice(0, 220),
      texto,
    });

    // Perguntas frequentes: categorias em "##", perguntas em "###".
    if (arquivoFaq && relativo === arquivoFaq) {
      const somenteAdmin = new Set(dados.faq_admin || []);
      let categoria = '';
      const blocos = corpo.split(/\n(?=#{2,3}\s)/);
      for (const bloco of blocos) {
        const h2 = bloco.match(/^##\s+([^#\n]+)$/m);
        if (h2 && !bloco.startsWith('###')) { categoria = h2[1].trim(); continue; }
        const h3 = bloco.match(/^###\s+(.+)$/m);
        if (!h3) continue;
        const resposta = limpar(bloco.replace(/^###\s+.+$/m, ''));
        if (!resposta) continue;
        faqs.push({
          pergunta: h3[1].trim(),
          resposta,
          categoria,
          publico: somenteAdmin.has(categoria) ? 'admin' : 'todos',
          url,
        });
      }
    }
  }

  faqs = faqs.filter((f) => f.pergunta && f.resposta);

  const indice = {
    geradoEm: new Date().toISOString(),
    totalPaginas: paginas.length,
    totalFaqs: faqs.length,
    faqs,
    paginas,
  };

  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(indice));

  const kb = (Buffer.byteLength(JSON.stringify(indice)) / 1024).toFixed(0);
  console.log(`Índice da Ajuda: ${paginas.length} páginas, ${faqs.length} perguntas (${kb} KB)`);
  if (arquivoFaq && faqs.length === 0) {
    console.warn(`Aviso: nenhuma pergunta extraída de ${arquivoFaq} — confira o formato (## categoria, ### pergunta).`);
  }
  if (!sitemap) console.warn('Aviso: sitemap.xml não encontrado — URLs não foram validadas.');
  for (const a of avisos) console.warn('Aviso:', a);
} catch (e) {
  encerrarComErro(e);
}
