import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const { projetoAtivo } = require('./compartilhado/projeto.cjs');

/**
 * Config única de captura de screenshots, apontada para o produto em DOC_PROJETO.
 *
 * As credenciais ficam em projetos/<id>/.env (fora do git) e a URL base sai da
 * variável declarada no projeto.json de cada produto.
 */
const projeto = projetoAtivo();

dotenv.config({ path: projeto.arquivoEnv });

const envBaseUrl = projeto.screenshots?.envBaseUrl;

export default defineConfig({
  testDir: projeto.dirPlaywright,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL:
      (envBaseUrl && process.env[envBaseUrl]) ||
      projeto.screenshots?.baseUrlPadrao ||
      'http://localhost:8080',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    // Renderiza a aplicação em português para os screenshots da documentação.
    locale: 'pt-BR',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: projeto.arquivoAuth,
        launchOptions: {
          args: ['--disable-blink-features=Animations'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
