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

  const modo = process.env.DOC_MODO === 'publico' ? 'publico' : 'interno';
  const dir = modo === 'publico' ? projeto.dirBuildCliente : projeto.dirBuild;

  if (!existsSync(dir)) {
    const comando = modo === 'publico' ? `DOC_MODO=publico npm run build -- ${id}` : `npm run build -- ${id}`;
    throw new Error(`Build não encontrado em ${path.relative(RAIZ, dir)}.\nRode \`${comando}\` antes.`);
  }

  await executar(
    process.execPath,
    [BIN.docusaurus, 'serve', '--dir', path.relative(RAIZ, dir)],
    { env: { DOC_PROJETO: id, DOC_MODO: modo } },
  );
} catch (e) {
  encerrarComErro(e);
}
