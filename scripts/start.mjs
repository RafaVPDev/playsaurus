/**
 * Sobe o servidor de desenvolvimento da documentação de um produto.
 *
 * Uso: npm run start -- meu-projeto
 */
import { BIN, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

try {
  const id = idDoArgumento();
  const projeto = carregarProjeto(id);

  console.log(`Servindo a documentação do ${projeto.nome} (${id})...`);
  await executar(process.execPath, [BIN.docusaurus, 'start'], { env: { DOC_PROJETO: id } });
} catch (e) {
  encerrarComErro(e);
}
