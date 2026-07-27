import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const { projetoAtivo } = require('./compartilhado/projeto.cjs');

/**
 * Config de GRAVAÇÃO DE VÍDEO das jornadas — separada da de screenshots para não
 * misturar as duas (vídeo é mais lento e só interessa aos specs de jornada).
 *
 * Diferenças em relação à config de screenshots:
 * - grava vídeo (use.video) no tamanho do viewport;
 * - roda mais devagar (slowMo) para o vídeo ficar assistível;
 * - só executa os arquivos *.jornada.spec.ts, ignorando os screenshots.
 *
 * Rodar com: npm run videos -- <projeto>
 */
const projeto = projetoAtivo();

dotenv.config({ path: projeto.arquivoEnv });

const envBaseUrl = projeto.screenshots?.envBaseUrl;
// Mesmo tamanho dos screenshots (1440×900): telas menores cortavam a tabela de
// projetos e escondiam o botão "Novo Projeto".
const VIEWPORT = { width: 1440, height: 900 };

export default defineConfig({
  testDir: projeto.dirPlaywright,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL:
      (envBaseUrl && process.env[envBaseUrl]) ||
      projeto.screenshots?.baseUrlPadrao ||
      'http://localhost:8080',
    ignoreHTTPSErrors: true,
    locale: 'pt-BR',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /jornada\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT,
        storageState: projeto.arquivoAuth,
        // Grava vídeo de cada teste; o spec salva a versão final em static/videos/.
        video: { mode: 'on', size: VIEWPORT },
        launchOptions: {
          // Sem slowMo: ele multiplicava cada tecla digitada e cada ação, e uma
          // jornada de ~15s virava ~2min. O ritmo e a visibilidade do cursor
          // vêm das pausas (`beat`) e do efeito de digitação no próprio spec.
          slowMo: 0,
          args: ['--disable-blink-features=Animations'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
