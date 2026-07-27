/**
 * Painel local da documentação.
 *
 * Uso: npm run painel
 *
 * Sobe uma página em http://127.0.0.1:4321 para escolher o produto, conferir
 * onde está o repositório dele nesta máquina e disparar screenshots, build e
 * publicação — com o log aparecendo ao vivo.
 *
 * Só módulos nativos do Node: o painel não deve adicionar dependência nenhuma
 * à instalação compartilhada.
 *
 * Segurança: o painel executa comandos, então escuta apenas em 127.0.0.1, checa
 * o cabeçalho Host (contra DNS rebinding) e só aceita ações e projetos de uma
 * lista fechada — nada vindo da requisição vira comando.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  RAIZ,
  listarProjetos,
  carregarProjeto,
  resolverRepositorio,
  salvarCaminhoLocal,
  lerPastaBase,
  salvarPastaBase,
} = require('../compartilhado/projeto.cjs');
const {
  SECOES_PADRAO,
  criarProjeto,
  excluirProjeto,
  repositoriosCandidatos,
} = require('../compartilhado/novo-projeto.cjs');

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DIR_PAINEL = path.resolve(aqui, '..', 'painel');
const HOST = '127.0.0.1';
const PORTA_INICIAL = Number(process.env.PORT) || 4321;

/** Ações permitidas — o cliente escolhe pelo nome, nunca monta o comando. */
const ACOES = {
  screenshots: { script: 'screenshots.mjs', titulo: 'Gerando screenshots' },
  build: { script: 'build.mjs', titulo: 'Gerando build' },
  publicar: { script: 'publicar.mjs', titulo: 'Publicando' },
};

let emExecucao = null;

// ------------------------------------------------------------------ estado

function estadoDosProjetos() {
  return listarProjetos().map((id) => {
    try {
      const projeto = carregarProjeto(id);
      const repo = resolverRepositorio(projeto);

      // O caminho versionado no projeto.json. Serve de referência: publicar em
      // uma pasta diferente dela é legítimo (cada máquina organiza como quer),
      // mas é também o jeito de apagar o public/docs do produto errado — então
      // a divergência vira aviso em vez de passar batido.
      const padrao = projeto.repositorio?.relativo
        ? path.resolve(RAIZ, projeto.repositorio.relativo)
        : null;

      return {
        id,
        nome: projeto.nome,
        tagline: projeto.tagline ?? '',
        baseUrl: projeto.baseUrl,
        url: projeto.url,
        secoes: projeto.secoes.map((s) => s.rotulo),
        destino: projeto.repositorio?.destino ?? 'public/docs',
        env: projeto.repositorio?.env ?? null,
        caminho: repo.caminho,
        origem: repo.origem,
        detalhe: repo.detalhe,
        padrao,
        foraDoPadrao: Boolean(padrao && repo.caminho && path.relative(padrao, repo.caminho) !== ''),
        existe: repo.caminho ? existsSync(repo.caminho) : false,
        temEnv: existsSync(projeto.arquivoEnv),
        temBuild: existsSync(projeto.dirBuild),
      };
    } catch (e) {
      return { id, erro: e.message };
    }
  });
}

// ------------------------------------------------------------------ helpers

function json(res, dados, status = 200) {
  const corpo = JSON.stringify(dados);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(corpo);
}

function hostConfiavel(req) {
  const host = (req.headers.host || '').split(':')[0];
  return host === '127.0.0.1' || host === 'localhost' || host === '[::1]';
}

async function lerCorpo(req, limite = 64 * 1024) {
  let dados = '';
  for await (const pedaco of req) {
    dados += pedaco;
    if (dados.length > limite) throw new Error('Corpo da requisição grande demais.');
  }
  return dados ? JSON.parse(dados) : {};
}

// ------------------------------------------------------------------ execução

/** Roda um script de scripts/ repassando a saída por Server-Sent Events. */
function executarComStream(res, acao, id) {
  const { script, titulo } = ACOES[acao];

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store',
    connection: 'keep-alive',
  });

  const enviar = (tipo, dados) =>
    res.write(`event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`);

  if (emExecucao) {
    enviar('linha', `Já existe uma tarefa rodando (${emExecucao}). Aguarde terminar.`);
    enviar('fim', { codigo: 1 });
    return res.end();
  }

  emExecucao = `${acao}/${id}`;
  enviar('inicio', { titulo: `${titulo} — ${id}` });

  const filho = spawn(process.execPath, [path.join(aqui, script), id], {
    cwd: RAIZ,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  const repassar = (fluxo) => {
    let resto = '';
    fluxo.setEncoding('utf8');
    fluxo.on('data', (pedaco) => {
      const linhas = (resto + pedaco).split(/\r?\n/);
      resto = linhas.pop() ?? '';
      for (const linha of linhas) enviar('linha', linha);
    });
    fluxo.on('end', () => {
      if (resto) enviar('linha', resto);
    });
  };
  repassar(filho.stdout);
  repassar(filho.stderr);

  filho.on('error', (e) => {
    enviar('linha', `Falha ao iniciar: ${e.message}`);
  });
  filho.on('close', (codigo) => {
    emExecucao = null;
    enviar('fim', { codigo });
    res.end();
  });

  // Se a aba fechar no meio, não deixa o processo órfão.
  res.on('close', () => {
    if (!filho.killed) filho.kill();
  });
}

// ------------------------------------------------------------------ servidor

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function servirEstatico(res, nome) {
  const arquivo = path.join(DIR_PAINEL, nome);
  // Não deixa sair da pasta do painel.
  if (!arquivo.startsWith(DIR_PAINEL)) {
    res.writeHead(403).end('Proibido');
    return;
  }
  try {
    await stat(arquivo);
    const conteudo = await readFile(arquivo);
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(arquivo)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(conteudo);
  } catch {
    res.writeHead(404).end('Não encontrado');
  }
}

const servidor = createServer(async (req, res) => {
  if (!hostConfiavel(req)) {
    res.writeHead(403).end('Host não permitido');
    return;
  }

  const url = new URL(req.url, `http://${HOST}`);

  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return await servirEstatico(res, 'index.html');
    }

    if (url.pathname === '/api/projetos' && req.method !== 'POST') {
      return json(res, {
        projetos: estadoDosProjetos(),
        raiz: RAIZ,
        pastaBase: lerPastaBase(),
        secoesPadrao: SECOES_PADRAO,
      });
    }

    // Repositórios candidatos dentro da pasta-base, para escolher na lista.
    if (url.pathname === '/api/repositorios') {
      const base = url.searchParams.get('base') || lerPastaBase();
      return json(res, {
        base,
        existe: Boolean(base) && existsSync(base),
        repositorios: repositoriosCandidatos(base),
      });
    }

    if (url.pathname === '/api/base' && req.method === 'POST') {
      const { base } = await lerCorpo(req);
      const salva = salvarPastaBase((base ?? '').trim() || null);
      return json(res, {
        base: salva,
        existe: Boolean(salva) && existsSync(salva),
        repositorios: repositoriosCandidatos(salva),
      });
    }

    if (url.pathname === '/api/projetos' && req.method === 'POST') {
      const dados = await lerCorpo(req);
      const { dir, criados } = criarProjeto(dados);
      console.log(`Produto "${dados.id}" criado em ${path.relative(RAIZ, dir)} (${criados.length} arquivos)`);
      return json(res, { criado: dados.id, arquivos: criados, projetos: estadoDosProjetos() });
    }

    if (url.pathname === '/api/excluir' && req.method === 'POST') {
      const { id } = await lerCorpo(req);
      if (!listarProjetos().includes(id)) {
        return json(res, { erro: `Produto desconhecido: ${id}` }, 400);
      }
      excluirProjeto(id);
      console.log(`Produto "${id}" excluído.`);
      return json(res, { excluido: id, projetos: estadoDosProjetos() });
    }

    if (url.pathname === '/api/caminho' && req.method === 'POST') {
      const { id, caminho } = await lerCorpo(req);
      if (!listarProjetos().includes(id)) {
        return json(res, { erro: `Projeto desconhecido: ${id}` }, 400);
      }
      salvarCaminhoLocal(id, (caminho ?? '').trim() || null);
      return json(res, { projetos: estadoDosProjetos() });
    }

    if (url.pathname === '/api/executar') {
      const acao = url.searchParams.get('acao');
      const id = url.searchParams.get('projeto');
      if (!ACOES[acao]) return json(res, { erro: `Ação desconhecida: ${acao}` }, 400);
      if (!listarProjetos().includes(id)) {
        return json(res, { erro: `Projeto desconhecido: ${id}` }, 400);
      }
      return executarComStream(res, acao, id);
    }

    if (url.pathname.startsWith('/painel/')) {
      return await servirEstatico(res, url.pathname.slice('/painel/'.length));
    }

    res.writeHead(404).end('Não encontrado');
  } catch (e) {
    json(res, { erro: e.message }, 500);
  }
});

function abrirNoNavegador(endereco) {
  // `--sem-navegador` para quem já tem a aba aberta ou está rodando sem sessão gráfica.
  if (process.argv.includes('--sem-navegador')) return;
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', endereco], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [endereco], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [endereco], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // Abrir o navegador é conveniência: se falhar, o endereço já foi impresso.
  }
}

// Registrado uma única vez, fora do laço de tentativas: um callback passado a
// cada `listen()` sobrevive à tentativa que falhou e dispararia de novo quando
// outra porta desse certo — anunciando (e abrindo no navegador) uma porta morta.
// A porta sai de `address()`, que é a que valeu de fato.
servidor.on('listening', () => {
  const endereco = `http://${HOST}:${servidor.address().port}`;
  console.log(`\nPainel da documentação: ${endereco}`);
  console.log('Ctrl+C para encerrar.\n');
  abrirNoNavegador(endereco);
});

function ouvir(porta, tentativas = 10) {
  servidor.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && tentativas > 0) {
      console.log(`Porta ${porta} ocupada, tentando ${porta + 1}...`);
      ouvir(porta + 1, tentativas - 1);
    } else {
      console.error(e.message);
      process.exit(1);
    }
  });
  servidor.listen(porta, HOST);
}

ouvir(PORTA_INICIAL);
