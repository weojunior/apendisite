// Formatação de números para a tela. Funções puras.
import { FREQUENCIAS } from './modelo.js';

const LOCALIDADES = Object.freeze({ pt: 'pt-BR', en: 'en-US' });

/** Formata um número com o separador decimal e de milhar do idioma. */
export function formatarNumero(valor, idioma) {
  return new Intl.NumberFormat(LOCALIDADES[idioma], { maximumFractionDigits: 2 }).format(valor);
}

/**
 * Milésimos inteiros do escore, truncados. A correção final garante que
 * k / 1000, calculado em double, fica do mesmo lado do escore que os cortes:
 * o número mostrado nunca contradiz a classificação.
 */
export function truncarMilesimos(escore) {
  let k = Math.floor(escore * 1000);
  if ((k + 1) / 1000 <= escore) k += 1;
  if (k / 1000 > escore) k -= 1;
  return k;
}

/** Escore com três casas truncadas e o separador decimal do idioma. */
export function formatarEscore(escore, idioma) {
  const k = truncarMilesimos(escore);
  const inteiro = Math.floor(k / 1000);
  const fracao = String(k % 1000).padStart(3, '0');
  return `${inteiro}${idioma === 'pt' ? ',' : '.'}${fracao}`;
}

/** Quadrados cheios no pictograma de 100: o percentual da faixa arredondado. */
export function quadradosCheios(faixa) {
  const { operadas, total } = FREQUENCIAS[faixa];
  return Math.round((100 * operadas) / total);
}
