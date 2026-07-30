import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const {projetoAtivo} = require('./compartilhado/projeto.cjs');

// O loader é CommonJS e devolve `any` — os campos usados aqui ficam declarados
// para o editor e o typecheck não perderem o pé.
type Secao = {id: string; rotulo: string};

/**
 * Config única para todos os produtos documentados.
 *
 * O projeto a montar vem de DOC_PROJETO (definido pelos scripts em scripts/).
 * Tudo o que é específico de um produto — marca, baseUrl, seções — está no
 * projeto.json correspondente; aqui só ficam as regras comuns.
 */
const projeto = projetoAtivo();

const modoPdf = process.env.DOC_MODO === 'publico' ? 'cliente' : 'equipe';
const urlPdf = `${projeto.baseUrl}pdf/documentacao-${modoPdf}.pdf`;

const config: Config = {
  title: projeto.nome,
  tagline: projeto.tagline ?? '',
  favicon: projeto.favicon,

  future: {
    v4: true,
  },

  // A documentação é publicada dentro do próprio app do produto, servida a
  // partir de `public/docs/` — por isso o baseUrl costuma ser '/docs/'.
  // Ver README.md para o processo de publicação.
  url: projeto.url,
  baseUrl: projeto.baseUrl,

  // As páginas são geradas como `pasta/index.html`. Sem a barra final, servidores
  // estáticos não resolvem o índice do diretório e a URL cai no catch-all do app.
  trailingSlash: true,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  // O primeiro diretório é comum a todos os produtos; o segundo é a marca e as
  // imagens do produto atual — e vence em caso de arquivo com o mesmo nome.
  staticDirectories: ['compartilhado/static', `projetos/${projeto.id}/static`],

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
    hooks: {
      // Os screenshots de usabilidade são gerados separadamente por
      // `npm run screenshots -- <projeto>`. Antes da captura, os arquivos ainda
      // não existem — avisar em vez de quebrar o build.
      onBrokenMarkdownImages: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          path: `projetos/${projeto.id}/docs`,
          // O site inteiro é a documentação e já vive sob o baseUrl do produto.
          // Com routeBasePath '/', as seções ficam em /docs/arquitetura,
          // /docs/usabilidade etc. (em vez de /docs/docs/...).
          routeBasePath: '/',
          // No modo público, as seções internas (projetoAtivo já as tirou de
          // `secoes`) também têm as páginas removidas do build — senão elas
          // continuariam acessíveis pela URL e no sitemap. Os defaults do plugin
          // são repetidos aqui porque `exclude` substitui, não acrescenta.
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
            ...((projeto.excluidas as string[] | undefined) ?? []).map((secao) => `${secao}/**`),
          ],
          // Sem `editUrl`: o link "editar esta página" apontaria para o repositório
          // da documentação, não para o do produto.
        },
        blog: false,
        theme: {
          // A base vem primeiro para que o tema do produto possa sobrescrevê-la.
          customCss: ['./compartilhado/css/base.css', `./projetos/${projeto.id}/tema.css`],
        },
      } satisfies Preset.Options,
    ],
  ],

  // Consumido pela home compartilhada (compartilhado/componentes/Home.tsx).
  // Só os campos de conteúdo — caminhos de disco não vão para o bundle.
  customFields: {
    projeto: {
      id: projeto.id,
      nome: projeto.nome,
      tagline: projeto.tagline ?? '',
      logo: projeto.logo ?? null,
      secoes: projeto.secoes,
      home: projeto.home ?? {},
      urlPdf,
    },
  },

  themeConfig: {
    // Cartão social (og:image). Opcional: sem ele o produto simplesmente não
    // publica um. Melhor nenhum do que o cartão genérico do Docusaurus.
    ...(projeto.imagemSocial ? {image: projeto.imagemSocial} : {}),
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: projeto.logo ? '' : projeto.nome,
      ...(projeto.logo
        ? {logo: {alt: projeto.nome, src: projeto.logo, srcDark: projeto.logoEscuro ?? projeto.logo}}
        : {}),
      items: [
        ...(projeto.secoes as Secao[]).map((secao) => ({
          type: 'docSidebar' as const,
          sidebarId: `${secao.id}Sidebar`,
          position: 'left' as const,
          label: secao.rotulo,
        })),
        {
          type: 'html' as const,
          position: 'right' as const,
          value: `<a class="navbar-pdf-btn" href="${urlPdf}" download>⬇ Baixar PDF</a>`,
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} ${projeto.nome}.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
