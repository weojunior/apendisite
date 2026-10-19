// Escores de Alvarado e PAS. Funções puras, sem DOM.
// Pontos e limites dos textos aprovados (seção 4) e do spec (seção 7).
import {
  FAIXAS,
  LIMITE_LEUCOCITOSE,
  LIMITE_NEUTROFILIA,
  dentroDaFaixa,
  lerNumero,
  neutrofilosParaMm3,
  paraMm3,
  temperaturaParaC,
} from './entrada.js';

export const LIMITE_TEMPERATURA_C = 37.3;
export const LIMITE_NEUTROFILOS_PCT = 75;

function simNao(valor) {
  if (valor === 'sim') return true;
  if (valor === 'nao') return false;
  return null;
}

function numeroNaFaixa(texto, faixa) {
  const valor = lerNumero(texto);
  return valor !== null && dentroDaFaixa(valor, faixa) ? valor : null;
}

function comparar(valor, teste) {
  return valor === null ? null : teste(valor);
}

/** Lê do formulário o que os dois escores usam. Faltante ou inválido vira null. */
export function dadosDosEscores(valores, unidades) {
  const nausea = simNao(valores.nausea);
  const emese = simNao(valores.emese);
  let nauseaOuVomito = null;
  if (nausea === true || emese === true) nauseaOuVomito = true;
  else if (nausea === false && emese === false) nauseaOuVomito = false;

  const leuco = numeroNaFaixa(valores.leucocitos, FAIXAS.leucocitos[unidades.leucocitos]);
  const leucocitosMm3 = leuco === null ? null : paraMm3(leuco, unidades.leucocitos);
  const neutro = numeroNaFaixa(valores.neutrofilos, FAIXAS.neutrofilos[unidades.neutrofilos]);
  let neutrofilosMm3 = null;
  let neutrofilosPct = null;
  if (neutro !== null && unidades.neutrofilos === 'pct') {
    neutrofilosPct = neutro;
    if (leucocitosMm3 !== null) neutrofilosMm3 = neutrofilosParaMm3(neutro, 'pct', leucocitosMm3);
  } else if (neutro !== null) {
    neutrofilosMm3 = neutrofilosParaMm3(neutro, unidades.neutrofilos, null);
    if (leucocitosMm3 !== null) neutrofilosPct = (100 * neutrofilosMm3) / leucocitosMm3;
  }
  const temperatura = numeroNaFaixa(valores.temperatura, FAIXAS.temperatura[unidades.temperatura]);
  return {
    nauseaOuVomito,
    dorFid: simNao(valores.dor_fid),
    febre: simNao(valores.febre),
    leucocitosMm3,
    neutrofilosMm3,
    neutrofilosPct,
    migracao: simNao(valores.migracao),
    anorexia: simNao(valores.anorexia),
    acetona: simNao(valores.acetona),
    descompressao: simNao(valores.descompressao),
    dorTosse: simNao(valores.dor_tosse),
    temperaturaC: temperatura === null ? null : temperaturaParaC(temperatura, unidades.temperatura),
  };
}

function anorexiaOuAcetona({ anorexia, acetona }) {
  if (anorexia === null || acetona === null) return null;
  return anorexia || acetona;
}

function itensAlvarado(d) {
  return [
    { chave: 'item_migracao', pontos: 1, presente: d.migracao },
    { chave: 'item_anorexia_acetona', pontos: 1, presente: anorexiaOuAcetona(d) },
    { chave: 'item_nausea_vomito', pontos: 1, presente: d.nauseaOuVomito },
    { chave: 'item_dor_fid', pontos: 2, presente: d.dorFid },
    { chave: 'item_descompressao', pontos: 1, presente: d.descompressao },
    { chave: 'item_temperatura', pontos: 1, presente: comparar(d.temperaturaC, (v) => v >= LIMITE_TEMPERATURA_C) },
    { chave: 'item_leuco_alvarado', pontos: 2, presente: comparar(d.leucocitosMm3, (v) => v > LIMITE_LEUCOCITOSE) },
    { chave: 'item_neutro_alvarado', pontos: 1, presente: comparar(d.neutrofilosPct, (v) => v > LIMITE_NEUTROFILOS_PCT) },
  ];
}

function itensPas(d) {
  return [
    { chave: 'item_dor_tosse', pontos: 2, presente: d.dorTosse },
    { chave: 'item_anorexia', pontos: 1, presente: d.anorexia },
    { chave: 'item_febre_pas', pontos: 1, presente: d.febre },
    { chave: 'item_nausea_vomito', pontos: 1, presente: d.nauseaOuVomito },
    { chave: 'item_dor_fid', pontos: 2, presente: d.dorFid },
    { chave: 'item_leuco_pas', pontos: 1, presente: comparar(d.leucocitosMm3, (v) => v >= LIMITE_LEUCOCITOSE) },
    { chave: 'item_neutro_pas', pontos: 1, presente: comparar(d.neutrofilosMm3, (v) => v > LIMITE_NEUTROFILIA) },
    { chave: 'item_migracao', pontos: 1, presente: d.migracao },
  ];
}

function somar(itens) {
  if (itens.some((item) => item.presente === null)) return null;
  return itens.reduce((total, item) => total + (item.presente ? item.pontos : 0), 0);
}

export function categoriaAlvarado(total) {
  if (total === null) return null;
  if (total >= 9) return 'muito_provavel';
  if (total >= 7) return 'provavel';
  if (total >= 5) return 'compativel';
  return 'sem_categoria';
}

export function categoriaPas(total) {
  if (total === null) return null;
  if (total >= 7) return 'alta';
  if (total === 6) return 'compativel';
  return 'nao_compativel';
}

/** Itens, total (null se falta resposta) e categoria do artigo original. */
export function calcularAlvarado(dados) {
  const itens = itensAlvarado(dados);
  const total = somar(itens);
  return { itens, total, categoria: categoriaAlvarado(total) };
}

export function calcularPas(dados) {
  const itens = itensPas(dados);
  const total = somar(itens);
  return { itens, total, categoria: categoriaPas(total) };
}
