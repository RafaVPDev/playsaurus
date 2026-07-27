/**
 * Gera o build da documentação de um produto.
 *
 * Uso: npm run build -- meu-projeto
 * Saída: build/<id>/ — uma pasta por produto, sem uma sobrescrever a outra.
 */
import path from 'node:path';
import { BIN, RAIZ, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

try {
  const id = idDoArgumento();
  const projeto = carregarProjeto(id);

  console.log(`Gerando a documentação do ${projeto.nome} (${id})...`);
  await executar(process.execPath, [BIN.docusaurus, 'build', '--out-dir', path.relative(RAIZ, projeto.dirBuild)], {
    env: { DOC_PROJETO: id },
  });
  console.log(`\nBuild pronto em build/${id}`);
} catch (e) {
  encerrarComErro(e);
}
