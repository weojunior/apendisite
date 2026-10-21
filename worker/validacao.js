// Validação pura dos pedidos a /api (spec, seção 9.2). Sem rede e sem banco.
import {
  AREAS,
  CHAVES,
  EVENTOS,
  IDIOMAS_API,
  NOTA_TESTE,
  N_ITENS_SUS,
  PAISES,
  TAMANHO_MAXIMO_ISCA,
  USARIA,
} from '../public/js/contrato_api.js';

// O Brasil não tem horário de verão desde 2019: Brasília fica em UTC-3 o ano todo.
const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000;
const PADRAO_PAIS = /^[A-Z0-9]{2}$/;
const PAIS_DESCONHECIDO = 'XX';

export class ErroValidacao extends Error {
  constructor(motivo) {
    super(motivo);
    this.name = 'ErroValidacao';
  }
}

function exigir(condicao, motivo) {
  if (!condicao) throw new ErroValidacao(motivo);
}

function exigirChavesExatas(corpo, chaves) {
  exigir(corpo !== null && typeof corpo === 'object' && !Array.isArray(corpo), 'corpo não é objeto');
  const recebidas = Object.keys(corpo).sort();
  const esperadas = [...chaves].sort();
  exigir(recebidas.length === esperadas.length && recebidas.every((c, i) => c === esperadas[i]), 'chaves');
}

export function validarEvento(corpo) {
  exigirChavesExatas(corpo, CHAVES.evento);
  exigir(EVENTOS.includes(corpo.evento), 'evento');
  exigir(IDIOMAS_API.includes(corpo.idioma), 'idioma');
  return { evento: corpo.evento, idioma: corpo.idioma };
}

export function validarSus(corpo) {
  exigirChavesExatas(corpo, CHAVES.sus);
  exigir(IDIOMAS_API.includes(corpo.idioma), 'idioma');
  exigir(Array.isArray(corpo.itens) && corpo.itens.length === N_ITENS_SUS, 'itens');
  exigir(corpo.itens.every((v) => Number.isInteger(v) && v >= 1 && v <= 5), 'itens');
  exigir(AREAS.includes(corpo.area), 'area');
  exigir(PAISES.includes(corpo.pais), 'pais');
  exigir(USARIA.includes(corpo.usaria), 'usaria');
  exigir(typeof corpo.site === 'string' && corpo.site.length <= TAMANHO_MAXIMO_ISCA, 'site');
  return {
    idioma: corpo.idioma,
    itens: [...corpo.itens],
    area: corpo.area,
    pais: corpo.pais,
    usaria: corpo.usaria,
    isca: corpo.site !== '',
  };
}

export function validarUtilidade(corpo) {
  exigirChavesExatas(corpo, CHAVES.utilidade);
  exigir(IDIOMAS_API.includes(corpo.idioma), 'idioma');
  const teste = corpo.nota === NOTA_TESTE;
  exigir(teste || (Number.isInteger(corpo.nota) && corpo.nota >= 0 && corpo.nota <= 10), 'nota');
  return { idioma: corpo.idioma, nota: teste ? null : corpo.nota, teste: teste ? 1 : 0 };
}

/** País que a Cloudflare põe em request.cf, ou XX. Nunca o IP. */
export function paisDoCabecalho(cf) {
  const pais = cf?.country;
  return typeof pais === 'string' && PADRAO_PAIS.test(pais) ? pais : PAIS_DESCONHECIDO;
}

/** Dia em horário de Brasília, AAAA-MM-DD. */
export function diaEmBrasilia(agora = new Date()) {
  return new Date(agora.getTime() - DESLOCAMENTO_BRASILIA_MS).toISOString().slice(0, 10);
}
