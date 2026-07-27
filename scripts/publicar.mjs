/**
 * Publica a documentação dentro do app do produto.
 *
 * Uso: npm run publish -- oktask
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

  await executar(process.execPath, [path.join(aqui, 'build.mjs'), id]);

  if (!existsSync(projeto.dirBuild)) {
    throw new Error(`Build não encontrado em build/${id} depois de gerar.`);
  }

  // Limpa a versão anterior para não deixar arquivos órfãos de builds antigos.
  console.log(`\nSubstituindo ${path.relative(repositorio, destino)}...`);
  await rm(destino, { recursive: true, force: true });
  await mkdir(destino, { recursive: true });
  await cp(projeto.dirBuild, destino, { recursive: true });

  if (projeto.indiceAjuda?.gerar) {
    console.log('');
    await executar(process.execPath, [path.join(aqui, 'gerar-indice-ajuda.mjs'), id]);
  }

  console.log(`\nDocumentação publicada em ${path.relative(RAIZ, destino)}`);
  console.log(`Falta o último passo, manual: publicar o ${projeto.nome} pelo Lovable.`);
} catch (e) {
  encerrarComErro(e);
}
