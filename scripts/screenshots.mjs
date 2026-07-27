/**
 * Captura os screenshots de usabilidade de um produto.
 *
 * Uso: npm run screenshots -- meu-projeto
 *      npm run screenshots -- meu-projeto --ui
 *
 * Requer o app rodando na URL base do projeto e projetos/<id>/.env preenchido
 * com as credenciais da conta de demonstração.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { BIN, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

try {
  const argv = process.argv.slice(2);
  const id = idDoArgumento(argv);
  const projeto = carregarProjeto(id);

  if (!existsSync(projeto.arquivoEnv)) {
    throw new Error(
      `Falta projetos/${id}/.env com as credenciais da conta de demonstração.\n` +
        `Copie projetos/${id}/.env.example e preencha.`,
    );
  }

  mkdirSync(projeto.dirScreenshots, { recursive: true });

  const extras = argv.filter((a) => a.startsWith('-'));
  console.log(`Capturando screenshots do ${projeto.nome} (${id})...`);
  await executar(process.execPath, [BIN.playwright, 'test', ...extras], {
    env: { DOC_PROJETO: id },
  });
} catch (e) {
  encerrarComErro(e);
}
