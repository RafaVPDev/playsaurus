/**
 * Publica a documentação dentro do app do produto.
 *
 * Uso: npm run publish -- meu-projeto
 *
 * Faz três coisas, nesta ordem:
 *   1. gera o build em build/<id>;
 *   2. copia o build para <repositório do produto>/public/docs;
 *   3. gera o índice da Central de Ajuda a partir do que foi publicado.
 *
 * Importante: apenas o BUILD é copiado — uma pasta única e autocontida. O
 * projeto da documentação (fonte, node_modules, .env, Playwright) fica só aqui
 * e nunca vai para o produto.
 */
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RAIZ,
  carregarProjeto,
  destinoPublicacao,
  executar,
  idDoArgumento,
  encerrarComErro,
} from './comum.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));

try {
  const id = idDoArgumento();
  const projeto = carregarProjeto(id);

  // Resolve o destino ANTES de gastar tempo no build: se o caminho do
  // repositório estiver errado, o erro aparece de imediato.
  const { repositorio, destino, origem, detalhe } = destinoPublicacao(projeto);
  console.log(`Produto:      ${projeto.nome} (${id})`);
  console.log(`Repositório:  ${repositorio}  [${origem}: ${detalhe}]`);
  console.log(`Destino:      ${destino}\n`);

  // O destino fica dentro de public/ do produto. Se essa pasta não existe, o
  // caminho configurado provavelmente aponta para o lugar errado — melhor parar
  // do que criar uma árvore de pastas solta em algum canto do disco.
  const pai = path.dirname(destino);
  if (!existsSync(pai)) {
    throw new Error(
      `A pasta ${pai} não existe.\n` +
        `Confira o caminho do repositório em \`npm run painel\`.`,
    );
  }

  // Publica sempre a versão PÚBLICA: as seções marcadas com "publicar": false no
  // projeto.json (ex.: a Arquitetura) ficam de fora do que vai para o cliente.
  await executar(process.execPath, [path.join(aqui, 'build.mjs'), id], {
    env: { DOC_MODO: 'publico' },
  });

  if (!existsSync(projeto.dirBuildCliente)) {
    throw new Error(`Build público não encontrado em ${path.relative(RAIZ, projeto.dirBuildCliente)} depois de gerar.`);
  }

  // O PDF de equipe (static/pdf/documentacao-equipe.pdf) é copiado pelo Docusaurus
  // junto do static, mesmo no build público. Remove antes de publicar para a
  // versão interna nunca chegar ao cliente.
  const pdfEquipe = path.join(projeto.dirBuildCliente, 'pdf', 'documentacao-equipe.pdf');
  if (existsSync(pdfEquipe)) {
    await rm(pdfEquipe, { force: true });
    console.log('Removido do build público: pdf/documentacao-equipe.pdf (interno).');
  }

  // Limpa a versão anterior para não deixar arquivos órfãos de builds antigos.
  console.log(`\nSubstituindo ${path.relative(repositorio, destino)}...`);
  await rm(destino, { recursive: true, force: true });
  await mkdir(destino, { recursive: true });
  await cp(projeto.dirBuildCliente, destino, { recursive: true });

  // O índice faz parte do artefato publicado. Gerá-lo sempre evita que a limpeza
  // de public/docs apague o arquivo usado pela Central de Ajuda. Produtos que
  // ainda não consomem o índice apenas mantêm um JSON estático sem efeito.
  console.log('');
  await executar(process.execPath, [path.join(aqui, 'gerar-indice-ajuda.mjs'), id], {
    env: { DOC_MODO: 'publico' },
  });

  console.log(`\nDocumentação publicada em ${path.relative(RAIZ, destino)}`);
  console.log(`Falta o último passo, manual: publicar o ${projeto.nome} pela plataforma de hospedagem.`);
} catch (e) {
  encerrarComErro(e);
}
