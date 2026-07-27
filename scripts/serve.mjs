/**
 * Serve o build já gerado, do jeito que o servidor estático vai servir.
 *
 * Uso: npm run serve -- meu-projeto
 *
 * Vale mais que o `start` para conferir a publicação: é aqui que aparecem os
 * problemas de barra final e de baseUrl, que o modo de desenvolvimento esconde.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { BIN, RAIZ, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

try {
  const id = idDoArgumento();
  const projeto = carregarProjeto(id);

  if (!existsSync(projeto.dirBuild)) {
    throw new Error(`Build não encontrado em build/${id}.\nRode \`npm run build -- ${id}\` antes.`);
  }

  await executar(
    process.execPath,
    [BIN.docusaurus, 'serve', '--dir', path.relative(RAIZ, projeto.dirBuild)],
    { env: { DOC_PROJETO: id } },
  );
} catch (e) {
  encerrarComErro(e);
}
