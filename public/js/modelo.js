// Motor de cálculo do apendisite. Funções puras, sem DOM e sem rede.
// O mesmo arquivo roda no navegador e no Node.

export const FORMATO_MODELO = 'apendisite-rf';
export const VERSAO_FORMATO = 1;
export const N_ARVORES = 500;
export const N_SAIDAS = 32;
export const CORTE_EQUILIBRIO = 0.503;
export const CORTE_ALTA_SENSIBILIDADE = 0.358;
export const FREQUENCIAS = Object.freeze({
  baixa: Object.freeze({ operadas: 1, total: 120 }),
  intermediaria: Object.freeze({ operadas: 8, total: 70 }),
  alta: Object.freeze({ operadas: 67, total: 130 }),
});

export class ErroModelo extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroModelo';
  }
}

/** Confere o JSON exportado e o devolve pronto para o cálculo. */
export function carregarModelo(dados) {
  if (dados?.formato !== FORMATO_MODELO) throw new ErroModelo('formato desconhecido');
  if (dados.versao_formato !== VERSAO_FORMATO) throw new ErroModelo('versão de formato desconhecida');
  if (!Array.isArray(dados.arvores) || dados.arvores.length !== N_ARVORES || dados.n_arvores !== N_ARVORES) {
    throw new ErroModelo('a floresta precisa de 500 árvores');
  }
  if (!Array.isArray(dados.saidas) || dados.saidas.length !== N_SAIDAS) {
    throw new ErroModelo('o pré-processamento precisa de 32 saídas');
  }
  return dados;
}

function faltante(valor) {
  return valor === null || valor === undefined || Number.isNaN(valor);
}

/** Transforma as 19 entradas nas 32 colunas, com a imputação do sklearn. */
export function transformar(modelo, entrada) {
  const saida = [];
  modelo.numericas.forEach((nome, i) => {
    saida.push(faltante(entrada[nome]) ? modelo.medianas[i] : entrada[nome]);
  });
  for (const nome of modelo.indicadores_numericas) saida.push(faltante(entrada[nome]) ? 1 : 0);
  modelo.binarias.forEach((nome, i) => {
    saida.push(faltante(entrada[nome]) ? modelo.modas[i] : entrada[nome]);
  });
  for (const nome of modelo.indicadores_binarias) saida.push(faltante(entrada[nome]) ? 1 : 0);
  saida.push(entrada.sexo === modelo.sexo_um ? 1 : 0);
  return saida;
}

/**
 * Calcula o escore: cada coluna passa por Math.fround, porque o sklearn
 * converte a entrada da floresta para float32. Esquerda se valor <= limiar.
 */
export function calcularEscore(modelo, entrada) {
  const x = transformar(modelo, entrada).map((valor) => Math.fround(valor));
  let soma = 0;
  for (const { esquerdo, direito, variavel, limiar, prob } of modelo.arvores) {
    let no = 0;
    while (esquerdo[no] !== -1) {
      no = x[variavel[no]] <= limiar[no] ? esquerdo[no] : direito[no];
    }
    soma += prob[no];
  }
  return soma / modelo.n_arvores;
}

/** Classifica o escore cheio nos dois cortes e na faixa. */
export function classificar(escore) {
  const equilibrio = escore >= CORTE_EQUILIBRIO;
  const altaSensibilidade = escore >= CORTE_ALTA_SENSIBILIDADE;
  let faixa = 'baixa';
  if (equilibrio) faixa = 'alta';
  else if (altaSensibilidade) faixa = 'intermediaria';
  return { equilibrio, altaSensibilidade, faixa };
}
