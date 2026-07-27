import { type Page } from '@playwright/test';

const { projetoAtivo } = require('../projeto.cjs');

/**
 * Utilidades de captura comuns a todos os produtos.
 *
 * O que é específico de um produto — rotas, seletores, fluxo de login — fica
 * nos arquivos de projetos/<id>/playwright/. Aqui só entra o que vale para
 * qualquer app: esperar o carregamento, congelar animações, capturar a tela.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // Aguarda sumir os spinners de carregamento (Loader2 => classe .animate-spin),
    // evitando capturar a tela ainda em estado de "carregando". Se não houver
    // spinner, o estado "hidden" é satisfeito de imediato.
    await this.page
      .locator('.animate-spin')
      .first()
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});
    // Pequena folga para o conteúdo assentar após o fim do carregamento.
    await this.page.waitForTimeout(500);
  }

  /**
   * Desativa animações/transições antes da captura para telas estáveis.
   *
   * Observação: não borramos imagens aqui. As capturas usam uma conta de
   * demonstração com dados fictícios; borrar todas as `<img>` também afetava a
   * logo e o fundo da tela. Se for necessário capturar com dados reais, adicionar
   * masking direcionado apenas às fotos de avatar.
   */
  async prepareForScreenshot() {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
          scroll-behavior: auto !important;
        }
      `,
    });
    // Garante que fontes/layout estabilizaram após injetar o estilo.
    await this.page.evaluate(() => document.fonts?.ready).catch(() => {});
  }

  async takeScreenshot(name: string) {
    await this.waitForPageLoad();
    await this.prepareForScreenshot();
    // Se a página for mais larga que o viewport (tabelas largas), aumenta a
    // largura para caber todo o conteúdo — o `fullPage` cobre a altura, mas não
    // a largura além do viewport, o que cortava colunas à direita.
    const scrollWidth = await this.page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const viewport = this.page.viewportSize();
    if (viewport && scrollWidth > viewport.width) {
      await this.page.setViewportSize({
        width: Math.min(scrollWidth + 16, 3000),
        height: viewport.height,
      });
      await this.page.waitForTimeout(400);
      await this.prepareForScreenshot();
    }
    // O destino sai do projeto ativo (DOC_PROJETO), não de um caminho fixo:
    // cada produto guarda as próprias imagens em projetos/<id>/static/.
    await this.page.screenshot({
      path: `${projetoAtivo().dirScreenshots}/${name}.png`,
      fullPage: true,
    });
  }
}
