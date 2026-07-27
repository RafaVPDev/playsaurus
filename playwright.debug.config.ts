import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
const { projetoAtivo } = require('./compartilhado/projeto.cjs');
const p = projetoAtivo(); dotenv.config({ path: p.arquivoEnv });
const e = p.screenshots?.envBaseUrl;
export default defineConfig({ testDir: p.dirPlaywright, workers:1, retries:0, reporter:'list', timeout:120000,
  use:{ baseURL:(e&&process.env[e])||'http://localhost:8080', ignoreHTTPSErrors:true, locale:'pt-BR' },
  projects:[{ name:'chromium', testMatch:/_debug\.spec\.ts/, use:{...devices['Desktop Chrome'], viewport:{width:1440,height:900}, storageState:p.arquivoAuth } }] });
