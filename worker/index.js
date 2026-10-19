// Rotas /api do apendisite. O resto do site é arquivo estático e não passa por aqui.
// Este código nunca lê cabeçalho de IP (spec, seção 9.2, item 6).
import { LIMITE_CORPO_BYTES, ROTAS } from '../public/js/contrato_api.js';
import { CABECALHOS_SEGURANCA } from './cabecalhos.js';
import {
  ErroValidacao,
  diaEmBrasilia,
  paisDoCabecalho,
  validarEvento,
  validarSus,
  validarUtilidade,
} from './validacao.js';

const SQL_EVENTO = 'INSERT INTO contagem (dia, evento, idioma, pais, n) VALUES (?1, ?2, ?3, ?4, 1) '
  + 'ON CONFLICT (dia, evento, idioma, pais) DO UPDATE SET n = n + 1';
const SQL_SUS = 'INSERT INTO resposta_sus (dia, idioma, item1, item2, item3, item4, item5, item6, '
  + 'item7, item8, item9, item10, area, pais, usaria) '
  + 'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)';
const SQL_UTILIDADE = 'INSERT INTO nota_utilidade (dia, nota, teste, idioma, pais) VALUES (?1, ?2, ?3, ?4, ?5)';
const SQL_SAUDE = 'SELECT 1 AS ok';
const TIPO_JSON = 'application/json';

function responder(status, corpo) {
  const cabecalhos = new Headers(CABECALHOS_SEGURANCA);
  cabecalhos.set('Cache-Control', 'no-store');
  if (corpo === undefined) return new Response(null, { status, headers: cabecalhos });
  cabecalhos.set('Content-Type', `${TIPO_JSON}; charset=utf-8`);
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos });
}

async function lerCorpo(request) {
  const tipo = (request.headers.get('Content-Type') ?? '').toLowerCase();
  if (!tipo.startsWith(TIPO_JSON)) throw new ErroValidacao('content-type');
  if (Number(request.headers.get('Content-Length') ?? 0) > LIMITE_CORPO_BYTES) throw new ErroValidacao('tamanho');
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > LIMITE_CORPO_BYTES) throw new ErroValidacao('tamanho');
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroValidacao('json');
  }
}

const TRATADORES = {
  [ROTAS.evento]: async (corpo, env, request) => {
    const { evento, idioma } = validarEvento(corpo);
    await env.DB.prepare(SQL_EVENTO).bind(diaEmBrasilia(), evento, idioma, paisDoCabecalho(request.cf)).run();
    return responder(204);
  },
  [ROTAS.sus]: async (corpo, env) => {
    const resposta = validarSus(corpo);
    if (resposta.isca) return responder(201, { ok: true });
    const { idioma, itens, area, pais, usaria } = resposta;
    await env.DB.prepare(SQL_SUS).bind(diaEmBrasilia(), idioma, ...itens, area, pais, usaria).run();
    return responder(201, { ok: true });
  },
  [ROTAS.utilidade]: async (corpo, env, request) => {
    const { idioma, nota, teste } = validarUtilidade(corpo);
    await env.DB.prepare(SQL_UTILIDADE).bind(diaEmBrasilia(), nota, teste, idioma, paisDoCabecalho(request.cf)).run();
    return responder(201, { ok: true });
  },
};

async function tratarSaude(request, env) {
  if (request.method !== 'GET') return responder(405, { erro: 'metodo' });
  try {
    await env.DB.prepare(SQL_SAUDE).first();
    return responder(200, { ok: true });
  } catch {
    return responder(503, { ok: false });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === ROTAS.saude) return tratarSaude(request, env);
    const tratar = TRATADORES[pathname];
    if (!tratar) return responder(404, { erro: 'rota' });
    if (request.method !== 'POST') return responder(405, { erro: 'metodo' });
    if (request.headers.get('Origin') !== env.ORIGEM_PERMITIDA) return responder(403, { erro: 'origem' });
    try {
      return await tratar(await lerCorpo(request), env, request);
    } catch (erro) {
      if (erro instanceof ErroValidacao) return responder(400, { erro: 'pedido' });
      return responder(503, { ok: false });
    }
  },
};
