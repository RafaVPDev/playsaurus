/**
 * Criação de um produto novo — o que o botão "Novo produto" do painel executa.
 *
 * Gera um `projetos/<id>/` completo e que **compila de primeira**: projeto.json,
 * uma página inicial por seção, tema derivado de uma cor e um modelo de captura
 * de screenshots. A partir daí é só escrever os artigos.
 */
const fs = require('node:fs');
const path = require('node:path');

const {
  RAIZ,
  DIR_PROJETOS,
  listarProjetos,
  validarId,
  salvarCaminhoLocal,
} = require('./projeto.cjs');

/** Seções padrão — as mesmas do Oktask, para os produtos ficarem com a mesma cara. */
const SECOES_PADRAO = [
  {
    id: 'arquitetura',
    rotulo: 'Arquitetura',
    tag: 'Para desenvolvedores',
    descricao: 'Documentação técnica: stack, banco de dados, autenticação, integrações e segurança.',
  },
  {
    id: 'usabilidade',
    rotulo: 'Usabilidade',
    tag: 'Para usuários',
    descricao: 'Guias passo a passo para o dia a dia de quem usa o produto.',
  },
  {
    id: 'referencia',
    rotulo: 'Referência',
    tag: 'Consulta rápida',
    descricao: 'Glossário, permissões e perguntas frequentes para tirar dúvidas rapidamente.',
  },
];

// ------------------------------------------------------------------ cores

/** #rrggbb -> {h, s, l} em graus e porcentagem. */
function hexParaHsl(hex) {
  const limpo = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(limpo)) return { h: 220, s: 70, l: 40 };
  const r = parseInt(limpo.slice(0, 2), 16) / 255;
  const g = parseInt(limpo.slice(2, 4), 16) / 255;
  const b = parseInt(limpo.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Monta o tema a partir de uma cor só.
 *
 * A estrutura (quais tokens existem, o que cada um pinta) vive em
 * compartilhado/css/base.css. Aqui só se define o valor de cada um.
 */
function temaCss(nome, corPrimaria) {
  const { h, s: sBruto } = hexParaHsl(corPrimaria);
  // Saturação muito baixa produz um tema morto; muito alta cansa a leitura.
  const s = Math.min(95, Math.max(45, sBruto));

  return `/**
 * ${nome} — identidade visual do portal de documentação
 * ----------------------------------------------------------------------------
 * Gerado a partir da cor ${corPrimaria}. Só cor mora aqui: layout e componentes
 * ficam em compartilhado/css/base.css, que consome estes tokens.
 *
 * Para mudar a identidade do produto, mexa nos valores abaixo — nenhum outro
 * arquivo precisa saber.
 */

/* ============================================================
   TEMA CLARO
   ============================================================ */
:root {
  --doc-primary: hsl(${h} ${s}% 35%);
  --doc-primary-hover: hsl(${h} ${s}% 28%);
  --doc-navbar-bg: hsl(${h} 15% 12%);
  --doc-sidebar-bg: hsl(${h} 20% 98%);
  --doc-background: hsl(0 0% 100%);
  --doc-surface: hsl(0 0% 100%);
  --doc-surface-2: hsl(${h} 20% 96%);
  --doc-border: hsl(${h} 15% 90%);
  --doc-text: hsl(${h} 8% 12%);
  --doc-text-muted: hsl(${h} 10% 45%);
  --doc-success: hsl(145 80% 42%);
  --doc-warning: hsl(36 100% 48%);
  --doc-danger: hsl(356 95% 45%);

  --doc-pre-bg: hsl(${h} 18% 97%);
  --doc-menu-ativo-bg: hsl(${h} 60% 94%);
  --doc-menu-hover-bg: hsl(${h} 40% 96%);
  --doc-menu-ativo-cor: var(--doc-primary-hover);
  --doc-navbar-link-hover: hsl(${h} 80% 65%);
  --doc-footer-bg: var(--doc-navbar-bg);
  --doc-scrollbar-thumb: hsl(${h} 45% 72%);
  --doc-selection: hsl(${h} ${s}% 35% / 0.25);

  /* --- Homepage --- */
  --doc-hero-gradient: linear-gradient(135deg, hsl(${h} 15% 12%) 0%, hsl(${h} ${s}% 20%) 100%);
  --doc-hero-btn-bg: hsl(${h} ${s}% 45%);
  --doc-hero-btn-bg-hover: hsl(${h} ${s}% 52%);
  --doc-hero-btn-text: hsl(${h} 60% 8%);

  /* --- Primária Infima --- */
  --ifm-color-primary: hsl(${h} ${s}% 32%);
  --ifm-color-primary-dark: hsl(${h} ${s}% 29%);
  --ifm-color-primary-darker: hsl(${h} ${s}% 27%);
  --ifm-color-primary-darkest: hsl(${h} ${s}% 22%);
  --ifm-color-primary-light: hsl(${h} ${s}% 37%);
  --ifm-color-primary-lighter: hsl(${h} ${s}% 40%);
  --ifm-color-primary-lightest: hsl(${h} ${s}% 45%);

  --docusaurus-highlighted-code-line-bg: hsl(${h} 45% 90%);
}

/* ============================================================
   TEMA ESCURO
   ============================================================ */
[data-theme='dark'] {
  --doc-primary: hsl(${h} ${Math.round(s * 0.75)}% 58%);
  --doc-primary-hover: hsl(${h} ${Math.round(s * 0.75)}% 68%);
  --doc-navbar-bg: hsl(${h} 16% 8%);
  --doc-sidebar-bg: hsl(${h} 15% 12%);
  --doc-background: hsl(${h} 15% 10%);
  --doc-surface: hsl(${h} 15% 13%);
  --doc-surface-2: hsl(${h} 18% 16%);
  --doc-border: hsl(${h} 18% 22%);
  --doc-text: hsl(${h} 20% 96%);
  --doc-text-muted: hsl(${h} 15% 65%);
  --doc-success: hsl(145 70% 48%);
  --doc-warning: hsl(36 100% 55%);
  --doc-danger: hsl(356 85% 60%);

  --doc-pre-bg: hsl(${h} 18% 12%);
  --doc-menu-ativo-bg: hsl(${h} 55% 16%);
  --doc-menu-hover-bg: hsl(${h} 18% 16%);
  --doc-menu-ativo-cor: hsl(${h} ${Math.round(s * 0.75)}% 70%);
  --doc-footer-bg: hsl(${h} 20% 6%);
  --doc-scrollbar-thumb: hsl(${h} 45% 34%);

  --ifm-color-primary: hsl(${h} ${Math.round(s * 0.75)}% 58%);
  --ifm-color-primary-dark: hsl(${h} ${Math.round(s * 0.75)}% 52%);
  --ifm-color-primary-darker: hsl(${h} ${Math.round(s * 0.75)}% 48%);
  --ifm-color-primary-darkest: hsl(${h} ${Math.round(s * 0.75)}% 40%);
  --ifm-color-primary-light: hsl(${h} ${Math.round(s * 0.75)}% 64%);
  --ifm-color-primary-lighter: hsl(${h} ${Math.round(s * 0.75)}% 68%);
  --ifm-color-primary-lightest: hsl(${h} ${Math.round(s * 0.75)}% 74%);

  --docusaurus-highlighted-code-line-bg: hsl(${h} 30% 20%);
}
`;
}

// ------------------------------------------------------------------ conteúdo

function paginaInicial(nome, secao, posicao) {
  return `---
sidebar_position: ${posicao}
---

# ${secao.rotulo}

${secao.descricao}

:::info Página inicial gerada automaticamente
Esta seção ainda não tem conteúdo. Troque este texto pelo que interessa ao
${nome} e crie novos arquivos \`.md\` ou \`.mdx\` nesta pasta — eles entram
sozinhos no menu da esquerda, na ordem do \`sidebar_position\`.
:::

## Por onde começar

- Os arquivos desta seção ficam em \`projetos/${'${id}'}/docs/${secao.id}/\`.
- Imagens ficam em \`projetos/${'${id}'}/static/img/\` e são referenciadas como \`/img/arquivo.png\`.
- Para ver o resultado enquanto escreve, use o botão **Gerar build** no painel,
  ou \`npm run start -- ${'${id}'}\` para recarregar a cada alteração.
`;
}

const LOGIN_PAGE = (nome) => `import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '../../../compartilhado/playwright/BasePage';

/**
 * MODELO — precisa ser ajustado para o ${nome}.
 *
 * Os seletores abaixo são um chute razoável. Abra a tela de login do produto,
 * confira os ids/rótulos reais e troque. Enquanto isso não for feito, a captura
 * de screenshots vai falhar no passo de autenticação — e é para falhar mesmo,
 * em vez de gerar imagens da tela errada.
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    // Selecionar por id costuma ser mais estável que por texto, que muda com o idioma.
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('form button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.waitForPageLoad();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    // Ajuste para as rotas que o produto usa depois de autenticar.
    await this.page.waitForURL(/dashboard|home|app/i, { waitUntil: 'networkidle' });
  }
}
`;

const AUTH_SETUP = (idMaiusculo) => `import { test as setup } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { LoginPage } from './LoginPage';

const { projetoAtivo } = require('../../../compartilhado/projeto.cjs');

const authFile = projetoAtivo().arquivoAuth;

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.${idMaiusculo}_TEST_USER_EMAIL || '',
    process.env.${idMaiusculo}_TEST_USER_PASSWORD || ''
  );
  mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
`;

const SPEC = (nome) => `import { test } from '@playwright/test';
import { BasePage } from '../../../compartilhado/playwright/BasePage';

/**
 * MODELO — as telas abaixo são exemplos e precisam virar as do ${nome}.
 *
 * Cada teste navega até uma rota e salva a imagem em
 * static/img/usabilidade/geradas/, que os artigos referenciam como
 * \`/img/usabilidade/geradas/<nome>.png\`.
 *
 * Rotas e seletores são de cada produto — este arquivo não é compartilhado
 * justamente por isso.
 */

// A tela de login precisa ser capturada SEM sessão autenticada.
test.describe('Login (sem autenticação)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login', async ({ page }) => {
    const base = new BasePage(page);
    await page.goto('/login');
    await base.takeScreenshot('01-login');
  });
});

test.describe('Telas autenticadas', () => {
  test('Início', async ({ page }) => {
    const base = new BasePage(page);
    await page.goto('/');
    await base.takeScreenshot('02-inicio');
  });

  // Copie o bloco acima para cada tela que a documentação precisar mostrar.
});
`;

const ENV_EXEMPLO = (nome, idMaiusculo, urlLocal) => `# Screenshots do ${nome} — copie para .env (mesma pasta) e preencha.
# O .env não é versionado. Use uma conta de demonstração, nunca dados reais.
${idMaiusculo}_BASE_URL=${urlLocal}
${idMaiusculo}_TEST_USER_EMAIL=
${idMaiusculo}_TEST_USER_PASSWORD=

# Opcional: sobrescreve onde fica o repositório do produto nesta máquina.
# Normalmente não é preciso — o painel resolve isso.
# ${idMaiusculo}_REPO=
`;

const README = (nome, id, url, baseUrl, repositorio, destino) => `# ${nome} — documentação

- **Publicada em:** ${url}${baseUrl}
- **Repositório do produto:** \`${path.basename(repositorio)}\`
- **Destino da publicação:** \`${destino}\` no repositório do produto

## Publicar

\`\`\`bash
npm run publish -- ${id}
\`\`\`

Depois, no repositório do produto: commitar \`${destino}\` e publicar o app. A
pasta precisa estar versionada para a documentação aparecer no ar.

## Escrever

Os artigos ficam em \`docs/\`, uma pasta por seção. Arquivos \`.md\` e \`.mdx\`
entram sozinhos no menu, na ordem do \`sidebar_position\` do frontmatter.

Para ver o resultado enquanto escreve:

\`\`\`bash
npm run start -- ${id}
\`\`\`

## Identidade visual

Está toda em \`tema.css\`, gerada a partir de uma cor só. Mexer nos valores de lá
muda o portal inteiro; nenhum outro arquivo precisa saber.

## Screenshots

A pasta \`playwright/\` nasceu como **modelo** e precisa de ajuste: os seletores
de \`LoginPage.ts\` e as rotas de \`screenshots.spec.ts\` são chutes razoáveis, não
os do produto. Antes de rodar, copie \`.env.example\` para \`.env\` e preencha com
uma conta de demonstração.

\`\`\`bash
npm run screenshots -- ${id}
\`\`\`
`;

// ------------------------------------------------------------------ criação

/**
 * Cria projetos/<id>/ inteiro. Devolve o caminho e a lista de arquivos criados.
 *
 * Escreve tudo ou nada: se algo falhar no meio, a pasta parcial é removida —
 * um projeto meio criado quebraria o painel para todos os outros, já que
 * `listarProjetos` varre o diretório.
 */
function criarProjeto({ id, nome, url, baseUrl, repositorio, destino, cor, secoes }) {
  const problema = validarId(id);
  if (problema) throw new Error(problema);
  if (!nome) throw new Error('Informe o nome do produto.');
  if (!repositorio) throw new Error('Informe o repositório do produto.');
  if (!fs.existsSync(repositorio)) throw new Error(`A pasta ${repositorio} não existe.`);

  const urlFinal = (url || 'http://localhost:8080').replace(/\/+$/, '');
  let baseFinal = baseUrl || '/docs/';
  if (!baseFinal.startsWith('/')) baseFinal = `/${baseFinal}`;
  if (!baseFinal.endsWith('/')) baseFinal += '/';
  const destinoFinal = destino || 'public/docs';
  const secoesFinais = secoes?.length ? secoes : SECOES_PADRAO;
  const idMaiusculo = id.toUpperCase().replace(/-/g, '_');

  const dir = path.join(DIR_PROJETOS, id);
  const criados = [];
  const escrever = (relativo, conteudo) => {
    const alvo = path.join(dir, relativo);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, conteudo);
    criados.push(relativo.split(path.sep).join('/'));
  };

  try {
    fs.mkdirSync(dir, { recursive: false });

    const projeto = {
      nome,
      tagline: `Documentação do ${nome}`,
      url: urlFinal,
      baseUrl: baseFinal,
      repositorio: {
        // Relativo à raiz da instalação, para funcionar em outra máquina.
        relativo: path.relative(RAIZ, repositorio).split(path.sep).join('/'),
        env: `${idMaiusculo}_REPO`,
        destino: destinoFinal,
      },
      screenshots: {
        envBaseUrl: `${idMaiusculo}_BASE_URL`,
        baseUrlPadrao: 'http://localhost:8080',
        destino: 'img/usabilidade/geradas',
      },
      secoes: secoesFinais,
      home: {
        titulo: `Documentação do ${nome}`,
        acaoPrincipal: { rotulo: `Ver ${secoesFinais[0].rotulo}`, para: `/${secoesFinais[0].id}` },
      },
      // O índice da Central de Ajuda é consumido pelo app do produto. Só faz
      // sentido quando o app tiver essa tela — por isso nasce desligado.
      indiceAjuda: { gerar: false },
    };

    escrever('projeto.json', `${JSON.stringify(projeto, null, 2)}\n`);
    escrever('tema.css', temaCss(nome, cor || '#2f6feb'));

    secoesFinais.forEach((secao, i) => {
      escrever(
        path.join('docs', secao.id, 'index.mdx'),
        paginaInicial(nome, secao, i + 1).replace(/\$\{id\}/g, id),
      );
    });

    // O Docusaurus precisa da pasta de estáticos mesmo vazia.
    escrever(path.join('static', 'img', 'usabilidade', 'geradas', '.gitkeep'), '');

    escrever(path.join('playwright', 'LoginPage.ts'), LOGIN_PAGE(nome));
    escrever(path.join('playwright', 'auth.setup.ts'), AUTH_SETUP(idMaiusculo));
    escrever(path.join('playwright', 'screenshots.spec.ts'), SPEC(nome));
    escrever('.env.example', ENV_EXEMPLO(nome, idMaiusculo, 'http://localhost:8080'));
    escrever(
      'README.md',
      README(nome, id, urlFinal, baseFinal, repositorio, destinoFinal),
    );

    return { dir, criados };
  } catch (e) {
    // Não deixa esqueleto pela metade atrapalhando os outros projetos.
    fs.rmSync(dir, { recursive: true, force: true });
    if (e.code === 'EEXIST') throw new Error(`A pasta projetos/${id} já existe.`);
    throw e;
  }
}

/**
 * Repositórios candidatos dentro de uma pasta-base.
 *
 * "Candidato" = pasta que parece um projeto (tem .git ou package.json). O painel
 * mostra também se ela tem `public/`, porque sem isso não há onde publicar.
 */
function repositoriosCandidatos(base) {
  if (!base || !fs.existsSync(base)) return [];

  const jaUsados = new Map();
  for (const id of listarProjetos()) {
    try {
      const dados = JSON.parse(
        fs.readFileSync(path.join(DIR_PROJETOS, id, 'projeto.json'), 'utf8'),
      );
      if (dados.repositorio?.relativo) {
        jaUsados.set(path.resolve(RAIZ, dados.repositorio.relativo), id);
      }
    } catch {
      // Projeto ilegível não impede listar repositórios.
    }
  }

  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => {
      const caminho = path.join(base, e.name);
      return {
        nome: e.name,
        caminho,
        temGit: fs.existsSync(path.join(caminho, '.git')),
        temPackage: fs.existsSync(path.join(caminho, 'package.json')),
        temPublic: fs.existsSync(path.join(caminho, 'public')),
        usadoPor: jaUsados.get(caminho) ?? null,
      };
    })
    .filter((r) => r.temGit || r.temPackage)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Apaga um produto: a pasta projetos/<id>/ e os artefatos regeneráveis dele.
 *
 * NUNCA toca o repositório do produto nem o public/docs publicado — só o que
 * vive dentro desta instalação. É a saída para recriar um produto que ficou com
 * algum defeito.
 */
function excluirProjeto(id) {
  if (!listarProjetos().includes(id)) {
    throw new Error(`Produto "${id}" não existe.`);
  }

  const dir = path.resolve(DIR_PROJETOS, id);
  // Trava de segurança: o alvo tem que ser um filho direto de projetos/.
  // Sem isto, um id com "../" apagaria pasta fora daqui.
  if (path.dirname(dir) !== path.resolve(DIR_PROJETOS)) {
    throw new Error('Caminho inesperado — exclusão abortada.');
  }

  fs.rmSync(dir, { recursive: true, force: true });
  // Build e sessão do Playwright são regeneráveis e não fazem falta.
  fs.rmSync(path.join(RAIZ, 'build', id), { recursive: true, force: true });
  fs.rmSync(path.join(RAIZ, '.auth', `${id}.json`), { force: true });
  // Tira o caminho local, se houver, para não sobrar entrada órfã.
  salvarCaminhoLocal(id, null);

  return { id };
}

module.exports = {
  SECOES_PADRAO,
  criarProjeto,
  excluirProjeto,
  repositoriosCandidatos,
  temaCss,
};
