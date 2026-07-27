import type {ReactNode, CSSProperties} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './Home.module.css';

/**
 * Homepage do portal, montada a partir do projeto.json do produto ativo.
 *
 * Os dados chegam por `customFields.projeto` (ver docusaurus.config.ts) — nada
 * aqui é específico de um produto, nem mesmo a lista de seções.
 */

type Secao = {
  id: string;
  rotulo: string;
  tag?: string;
  descricao?: string;
};

type Acao = {rotulo: string; para: string};

type ProjetoNaHome = {
  nome: string;
  tagline: string;
  logo: string | null;
  secoes: Secao[];
  home: {
    titulo?: string;
    acaoPrincipal?: Acao;
    acaoSecundaria?: Acao;
  };
};

function useProjeto(): ProjetoNaHome {
  const {siteConfig} = useDocusaurusContext();
  return siteConfig.customFields!.projeto as ProjetoNaHome;
}

function Hero() {
  const projeto = useProjeto();
  const {home} = projeto;
  const logoUrl = useBaseUrl(projeto.logo ?? '/');

  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        {projeto.logo && (
          <img src={logoUrl} alt={projeto.nome} className={styles.heroLogo} />
        )}
        <Heading as="h1" className={styles.heroTitle}>
          {home.titulo ?? `Documentação do ${projeto.nome}`}
        </Heading>
        <p className={styles.heroSubtitle}>{projeto.tagline}</p>
        <div className={styles.heroActions}>
          {home.acaoPrincipal && (
            <Link className={styles.primaryBtn} to={home.acaoPrincipal.para}>
              {home.acaoPrincipal.rotulo}
            </Link>
          )}
          {home.acaoSecundaria && (
            <Link className={styles.ghostBtn} to={home.acaoSecundaria.para}>
              {home.acaoSecundaria.rotulo}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Secoes() {
  const {secoes} = useProjeto();
  // Colunas = nº de seções, no máximo 3 (acima disso quebra em linhas de 3).
  const colunas = Math.min(secoes.length, 3);
  return (
    <main className={styles.areas}>
      <div
        className={styles.areasGrid}
        style={{['--cols']: colunas} as CSSProperties}>

        {secoes.map((secao) => (
          <Link key={secao.id} to={`/${secao.id}`} className={styles.card}>
            {secao.tag && <span className={styles.cardTag}>{secao.tag}</span>}
            <Heading as="h2" className={styles.cardTitle}>
              {secao.rotulo}
            </Heading>
            {secao.descricao && <p className={styles.cardDesc}>{secao.descricao}</p>}
            <span className={styles.cardLink}>Acessar &rarr;</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function Home(): ReactNode {
  const projeto = useProjeto();
  return (
    <Layout title={projeto.nome} description={projeto.tagline}>
      <Hero />
      <Secoes />
    </Layout>
  );
}
