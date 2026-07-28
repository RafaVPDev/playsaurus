/**
 * Carregamento e validação dos projetos documentados.
 *
 * Este é o único lugar que sabe traduzir um id de projeto (ex.: "meu-projeto") em
 * caminhos concretos. Tudo o mais — config do Docusaurus, config do Playwright,
 * scripts e painel — passa por aqui.
 *
 * CommonJS de propósito: precisa ser consumido tanto pelos configs em
 * TypeScript (que o Docusaurus carrega como CJS) quanto pelos scripts .mjs.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const DIR_PROJETOS = path.join(RAIZ, 'projetos');
const CAMINHOS_LOCAIS = path.join(RAIZ, 'caminhos.local.json');

/** Lista os ids de projeto disponíveis (pastas com projeto.json). */
function listarProjetos() {
  if (!fs.existsSync(DIR_PROJETOS)) return [];
  return fs
    .readdirSync(DIR_PROJETOS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(DIR_PROJETOS, e.name, 'projeto.json')))
    .map((e) => e.name)
    .sort();
}

function erro(mensagem) {
  const e = new Error(mensagem);
  e.projetoInvalido = true;
  return e;
}

/**
 * Carrega o projeto.json e acrescenta os caminhos derivados.
 *
 * Falha alto e cedo: um projeto mal descrito quebra aqui, com o campo faltante
 * no texto do erro, em vez de virar um build silenciosamente errado.
 */
function carregarProjeto(id) {
  if (!id) {
    throw erro(
      `Nenhum projeto informado.\n` +
        `Use DOC_PROJETO=<id> ou passe o id no comando.\n` +
        `Disponíveis: ${listarProjetos().join(', ') || '(nenhum)'}`,
    );
  }

  const dir = path.join(DIR_PROJETOS, id);
  const arquivo = path.join(dir, 'projeto.json');
  if (!fs.existsSync(arquivo)) {
    throw erro(
      `Projeto "${id}" não encontrado em projetos/${id}/projeto.json.\n` +
        `Disponíveis: ${listarProjetos().join(', ') || '(nenhum)'}`,
    );
  }

  let dados;
  try {
    dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    throw erro(`projeto.json de "${id}" não é um JSON válido: ${e.message}`);
  }

  for (const campo of ['nome', 'url', 'baseUrl', 'secoes']) {
    if (!dados[campo]) throw erro(`projeto.json de "${id}": falta o campo "${campo}".`);
  }
  if (!Array.isArray(dados.secoes) || dados.secoes.length === 0) {
    throw erro(`projeto.json de "${id}": "secoes" precisa ser uma lista não vazia.`);
  }
  // A barra final do baseUrl não é cosmética: sem ela as páginas geradas como
  // `pasta/index.html` não resolvem em servidor estático.
  if (!dados.baseUrl.endsWith('/')) {
    throw erro(`projeto.json de "${id}": "baseUrl" precisa terminar com barra (ex.: "/docs/").`);
  }
  for (const secao of dados.secoes) {
    if (!secao.id || !secao.rotulo) {
      throw erro(`projeto.json de "${id}": cada seção precisa de "id" e "rotulo".`);
    }
    const dirSecao = path.join(dir, 'docs', secao.id);
    if (!fs.existsSync(dirSecao)) {
      throw erro(`projeto.json de "${id}": seção "${secao.id}" não existe em projetos/${id}/docs/.`);
    }
  }

  const destinoScreenshots = (dados.screenshots && dados.screenshots.destino) || 'img/usabilidade/geradas';

  return {
    ...dados,
    id,
    dir,
    dirDocs: path.join(dir, 'docs'),
    dirStatic: path.join(dir, 'static'),
    dirPlaywright: path.join(dir, 'playwright'),
    arquivoTema: path.join(dir, 'tema.css'),
    arquivoEnv: path.join(dir, '.env'),
    dirBuild: path.join(RAIZ, 'build', id),
    // Build da versão pública (sem as seções internas). Fica ao lado do build
    // interno para os dois poderem coexistir — um por modo.
    dirBuildCliente: path.join(RAIZ, 'build', `${id}-cliente`),
    dirScreenshots: path.join(dir, 'static', destinoScreenshots),
    // Sessão autenticada do Playwright, uma por produto.
    arquivoAuth: path.join(RAIZ, '.auth', `${id}.json`),
  };
}

/**
 * Aplica o modo de build a um projeto já carregado.
 *
 * No modo `publico`, as seções marcadas com `"publicar": false` no projeto.json
 * (ex.: a Arquitetura, interna) são retiradas de `secoes` — o que já as remove da
 * navbar, das sidebars e dos cards da home, pois tudo isso deriva daqui. As ações
 * da home que apontam para uma seção retirada também caem, senão o link ficaria
 * quebrado e o build (onBrokenLinks: 'throw') falharia. Os ids retirados voltam em
 * `excluidas`, para o config excluir as páginas correspondentes do build.
 *
 * No modo `interno` (padrão) nada é filtrado: o time enxerga tudo localmente.
 */
function aplicarModo(projeto, modo = process.env.DOC_MODO) {
  const secoes = projeto.secoes || [];
  if (modo !== 'publico') {
    return { ...projeto, excluidas: [] };
  }

  const excluidas = secoes.filter((s) => s.publicar === false).map((s) => s.id);
  const escondidas = new Set(excluidas);
  const secoesVisiveis = secoes.filter((s) => !escondidas.has(s.id));

  const home = { ...(projeto.home || {}) };
  for (const chave of ['acaoPrincipal', 'acaoSecundaria']) {
    const acao = home[chave];
    const destino = acao && String(acao.para).replace(/^\/+/, '').split('/')[0];
    if (destino && escondidas.has(destino)) delete home[chave];
  }

  return { ...projeto, secoes: secoesVisiveis, home, excluidas };
}

/** Projeto indicado por DOC_PROJETO, já com o modo (DOC_MODO) aplicado. */
function projetoAtivo() {
  return aplicarModo(carregarProjeto(process.env.DOC_PROJETO));
}

/**
 * Liga/desliga a publicação de uma seção no projeto.json (usado pelo painel).
 * `publicar: true` é o padrão, então o campo só é gravado quando vira `false` —
 * mantém o projeto.json enxuto e o comportamento anterior intacto.
 */
function definirPublicacaoSecao(id, secaoId, publicar) {
  const arquivo = path.join(DIR_PROJETOS, id, 'projeto.json');
  const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const secao = (dados.secoes || []).find((s) => s.id === secaoId);
  if (!secao) throw erro(`Seção "${secaoId}" não existe em ${id}.`);
  if (publicar === false) secao.publicar = false;
  else delete secao.publicar;
  fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`);
  return dados;
}

/** Caminhos de repositório desta máquina (não versionado). */
function lerCaminhosLocais() {
  if (!fs.existsSync(CAMINHOS_LOCAIS)) return {};
  try {
    return JSON.parse(fs.readFileSync(CAMINHOS_LOCAIS, 'utf8'));
  } catch {
    return {};
  }
}

function salvarCaminhoLocal(id, caminho) {
  const atual = lerCaminhosLocais();
  if (caminho) atual[id] = caminho;
  else delete atual[id];
  fs.writeFileSync(CAMINHOS_LOCAIS, `${JSON.stringify(atual, null, 2)}\n`);
  return atual;
}

/**
 * Pasta onde ficam os repositórios dos produtos nesta máquina — é ela que o
 * painel varre para oferecer a lista de repositórios ao cadastrar um produto.
 *
 * Sem configuração explícita, deduz da árvore: o pai do caminho padrão de
 * qualquer projeto já cadastrado. Numa instalação recém-clonada isso já acerta,
 * sem ninguém precisar configurar nada.
 *
 * Mora em caminhos.local.json com a chave `_pastaBase` — o prefixo `_` a separa
 * dos ids de projeto, que nunca começam com underscore (ver `validarId`).
 */
function lerPastaBase() {
  const locais = lerCaminhosLocais();
  if (locais._pastaBase) return path.resolve(locais._pastaBase);

  for (const id of listarProjetos()) {
    try {
      const projeto = carregarProjeto(id);
      if (projeto.repositorio?.relativo) {
        return path.dirname(path.resolve(RAIZ, projeto.repositorio.relativo));
      }
    } catch {
      // Projeto mal descrito não deve impedir a dedução pelos outros.
    }
  }
  return null;
}

function salvarPastaBase(caminho) {
  const atual = lerCaminhosLocais();
  if (caminho) atual._pastaBase = caminho;
  else delete atual._pastaBase;
  fs.writeFileSync(CAMINHOS_LOCAIS, `${JSON.stringify(atual, null, 2)}\n`);
  return lerPastaBase();
}

/** Ids viram nome de pasta e entram em caminhos — vale conferir antes de criar. */
function validarId(id) {
  if (!id) return 'Informe um identificador.';
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    return 'Use apenas letras minúsculas, números e hífen, começando por letra ou número.';
  }
  if (listarProjetos().includes(id)) return `Já existe um produto com o id "${id}".`;
  return null;
}

/**
 * Descobre onde está o repositório do produto nesta máquina.
 *
 * A ordem importa: o caminho versionado (`relativo`) é o último recurso
 * justamente para que quem clonar em outra máquina não precise editar
 * arquivo versionado — basta ajustar pelo painel, que grava em
 * caminhos.local.json.
 */
function resolverRepositorio(projeto) {
  const repo = projeto.repositorio || {};

  if (repo.env && process.env[repo.env]) {
    return { caminho: path.resolve(process.env[repo.env]), origem: 'env', detalhe: repo.env };
  }

  const locais = lerCaminhosLocais();
  if (locais[projeto.id]) {
    return { caminho: path.resolve(locais[projeto.id]), origem: 'local', detalhe: 'caminhos.local.json' };
  }

  if (repo.relativo) {
    return { caminho: path.resolve(RAIZ, repo.relativo), origem: 'relativo', detalhe: repo.relativo };
  }

  return { caminho: null, origem: 'ausente', detalhe: null };
}

/** Como acima, mas exige que o repositório exista de verdade. */
function exigirRepositorio(projeto) {
  const resolvido = resolverRepositorio(projeto);
  if (!resolvido.caminho) {
    throw erro(
      `Não sei onde fica o repositório do "${projeto.id}".\n` +
        `Rode \`npm run painel\` e informe o caminho, ou defina ${projeto.repositorio?.env || 'a variável de ambiente'}.`,
    );
  }
  if (!fs.existsSync(resolvido.caminho)) {
    throw erro(
      `O repositório do "${projeto.id}" não existe em:\n  ${resolvido.caminho}\n` +
        `(origem: ${resolvido.detalhe})\n` +
        `Rode \`npm run painel\` e corrija o caminho.`,
    );
  }
  return resolvido;
}

/** Pasta de destino da documentação publicada, dentro do repositório do produto. */
function destinoPublicacao(projeto) {
  const { caminho, origem, detalhe } = exigirRepositorio(projeto);
  const destino = (projeto.repositorio && projeto.repositorio.destino) || 'public/docs';
  return { repositorio: caminho, destino: path.join(caminho, destino), origem, detalhe };
}

module.exports = {
  RAIZ,
  DIR_PROJETOS,
  CAMINHOS_LOCAIS,
  listarProjetos,
  carregarProjeto,
  aplicarModo,
  projetoAtivo,
  definirPublicacaoSecao,
  lerCaminhosLocais,
  salvarCaminhoLocal,
  lerPastaBase,
  salvarPastaBase,
  validarId,
  resolverRepositorio,
  exigirRepositorio,
  destinoPublicacao,
};
