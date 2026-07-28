/**
 * Gera o build da documentação de um produto.
 *
 * Uso: npm run build -- meu-projeto            (modo interno: tudo)
 *      DOC_MODO=publico npm run build -- ...    (modo público: sem seções internas)
 *
 * Saída: build/<id>/ (interno) ou build/<id>-cliente/ (público) — os dois modos
 * coexistem, um não sobrescreve o outro.
 */
import path from 'node:path';
import { BIN, RAIZ, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

try {
  const id = idDoArgumento();
  const projeto = carregarProjeto(id);

  const modo = process.env.DOC_MODO === 'publico' ? 'publico' : 'interno';
  const saida = modo === 'publico' ? projeto.dirBuildCliente : projeto.dirBuild;

  const rotulo = modo === 'publico' ? 'versão pública' : 'versão interna';
  console.log(`Gerando a documentação do ${projeto.nome} (${id}) — ${rotulo}...`);
  await executar(process.execPath, [BIN.docusaurus, 'build', '--out-dir', path.relative(RAIZ, saida)], {
    env: { DOC_PROJETO: id, DOC_MODO: modo },
  });
  console.log(`\nBuild pronto em ${path.relative(RAIZ, saida)}`);
} catch (e) {
  encerrarComErro(e);
}
