/**
 * Grava os vídeos de jornada de um produto.
 *
 * Uso: npm run videos -- meu-projeto
 *
 * Percorre os specs *.jornada.spec.ts com a config de vídeo (playwright.video.config.ts)
 * e salva o resultado em projetos/<id>/static/videos/.
 *
 * O vídeo é copiado de test-results/ DEPOIS do teste passar — não dentro do
 * teste: `page.video().saveAs()` durante o teste trava até a página fechar.
 *
 * Requer o app rodando na URL base do projeto e projetos/<id>/.env preenchido
 * com as credenciais da conta de demonstração (a mesma dos screenshots).
 */
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { BIN, RAIZ, carregarProjeto, executar, idDoArgumento, encerrarComErro } from './comum.mjs';

/** Procura recursivamente os .webm gerados, do mais recente para o mais antigo. */
function videosGerados(dir) {
  const achados = [];
  const varrer = (d) => {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) varrer(p);
      else if (entry.name.endsWith('.webm')) achados.push({ p, mtime: statSync(p).mtimeMs });
    }
  };
  varrer(dir);
  return achados.sort((a, b) => b.mtime - a.mtime).map((x) => x.p);
}

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

  const dirVideos = path.join(projeto.dirStatic, 'videos');
  mkdirSync(dirVideos, { recursive: true });

  const config = path.join(RAIZ, 'playwright.video.config.ts');
  const resultados = path.join(RAIZ, 'test-results');
  const extras = argv.filter((a) => a.startsWith('-'));

  console.log(`Gravando vídeos de jornada do ${projeto.nome} (${id})...`);
  console.log('O navegador vai abrir e percorrer o fluxo. Não mexa até terminar.\n');
  await executar(process.execPath, [BIN.playwright, 'test', '--config', config, ...extras], {
    env: { DOC_PROJETO: id },
  });

  // Copia o vídeo mais recente de test-results/ para o destino, com nome estável.
  const gerados = videosGerados(resultados);
  if (!gerados.length) {
    throw new Error('O teste passou, mas nenhum vídeo foi encontrado em test-results/.');
  }
  const destino = path.join(dirVideos, 'jornada-projeto.webm');
  copyFileSync(gerados[0], destino);

  console.log(`\nVídeo salvo em ${path.relative(RAIZ, destino)}`);
} catch (e) {
  encerrarComErro(e);
}
