import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import trabalhador from '../../worker/index.js';
import { CABECALHOS_SEGURANCA } from '../../worker/cabecalhos.js';
import { lerTexto } from './auxiliares.js';

const ORIGEM = 'https://apendisite.com.br';
const SUS = { idioma: 'pt', itens: [3, 4, 2, 5, 1, 3, 4, 2, 5, 1], area: 'pediatria', pais: 'BR', usaria: 'sim', site: '' };
const DIA = /^\d{4}-\d{2}-\d{2}$/;

function bancoFalso({ falhar = false } = {}) {
  const chamadas = [];
  const executar = async (sql, valores) => {
    if (falhar) throw new Error('D1 fora do ar');
    chamadas.push({ sql, valores });
    return { success: true };
  };
  return {
    chamadas,
    prepare(sql) {
      return {
        bind: (...valores) => ({ run: () => executar(sql, valores) }),
        first: async () => {
          await executar(sql, []);
          return { ok: 1 };
        },
      };
    },
  };
}

function pedido(caminho, { metodo = 'POST', corpo, origem = ORIGEM, tipo = 'application/json', pais = 'BR' } = {}) {
  const cabecalhos = new Headers();
  if (origem) cabecalhos.set('Origin', origem);
  if (tipo) cabecalhos.set('Content-Type', tipo);
  let texto = '';
  if (corpo !== undefined) texto = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  return {
    url: `${ORIGEM}${caminho}`,
    method: metodo,
    headers: cabecalhos,
    cf: pais ? { country: pais } : undefined,
    text: async () => texto,
  };
}

async function chamar(caminho, opcoes = {}, banco = bancoFalso()) {
  const resposta = await trabalhador.fetch(pedido(caminho, opcoes), { DB: banco, ORIGEM_PERMITIDA: ORIGEM });
  return { resposta, banco, texto: await resposta.text() };
}

test('evento_valido_soma_na_contagem_e_responde_204', async () => {
  const { resposta, banco } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' } });
  assert.equal(resposta.status, 204);
  assert.equal(banco.chamadas.length, 1);
  const [dia, evento, idioma, pais] = banco.chamadas[0].valores;
  assert.match(dia, DIA);
  assert.deepEqual([evento, idioma, pais], ['abriu', 'pt', 'BR']);
  assert.match(banco.chamadas[0].sql, /ON CONFLICT \(dia, evento, idioma, pais\) DO UPDATE SET n = n \+ 1/);
});

test('evento_sem_pais_grava_XX', async () => {
  const { banco } = await chamar('/api/evento', { corpo: { evento: 'calculou', idioma: 'en' }, pais: null });
  assert.equal(banco.chamadas[0].valores[3], 'XX');
});

test('evento_com_campo_do_formulario_e_recusado_sem_gravar', async () => {
  const { resposta, banco } = await chamar('/api/evento', { corpo: { evento: 'calculou', idioma: 'pt', leucocitos: 12000 } });
  assert.equal(resposta.status, 400);
  assert.equal(banco.chamadas.length, 0);
});

test('corpo_acima_de_2_kb_e_recusado', async () => {
  const { resposta } = await chamar('/api/sus', { corpo: { ...SUS, site: 'x'.repeat(3000) } });
  assert.equal(resposta.status, 400);
});

test('content_type_diferente_de_json_e_recusado', async () => {
  const { resposta } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' }, tipo: 'text/plain' });
  assert.equal(resposta.status, 400);
});

test('json_invalido_e_recusado_sem_ecoar_o_corpo', async () => {
  const { resposta, texto } = await chamar('/api/evento', { corpo: '{"evento":"abriu", MARCADOR_QUE_NAO_PODE_VOLTAR' });
  assert.equal(resposta.status, 400);
  assert.ok(!texto.includes('MARCADOR_QUE_NAO_PODE_VOLTAR'));
});

test('origem_diferente_ou_ausente_da_403', async () => {
  for (const origem of ['https://exemplo.com', null]) {
    const { resposta, banco } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' }, origem });
    assert.equal(resposta.status, 403, String(origem));
    assert.equal(banco.chamadas.length, 0);
  }
});

test('sus_valido_grava_dia_idioma_dez_itens_area_pais_e_usaria', async () => {
  const { resposta, banco, texto } = await chamar('/api/sus', { corpo: SUS });
  assert.equal(resposta.status, 201);
  assert.deepEqual(JSON.parse(texto), { ok: true });
  const valores = banco.chamadas[0].valores;
  assert.equal(valores.length, 15);
  assert.deepEqual(valores.slice(1), ['pt', 3, 4, 2, 5, 1, 3, 4, 2, 5, 1, 'pediatria', 'BR', 'sim']);
});

test('sus_com_isca_preenchida_responde_201_e_nao_grava', async () => {
  const { resposta, banco } = await chamar('/api/sus', { corpo: { ...SUS, site: 'http://spam' } });
  assert.equal(resposta.status, 201);
  assert.equal(banco.chamadas.length, 0);
});

test('sus_com_9_itens_e_recusado', async () => {
  const { resposta } = await chamar('/api/sus', { corpo: { ...SUS, itens: SUS.itens.slice(1) } });
  assert.equal(resposta.status, 400);
});

test('utilidade_grava_nota_e_teste', async () => {
  const nota = await chamar('/api/utilidade', { corpo: { idioma: 'en', nota: 7 } });
  assert.equal(nota.resposta.status, 201);
  assert.deepEqual(nota.banco.chamadas[0].valores.slice(1), [7, 0, 'en', 'BR']);
  const teste = await chamar('/api/utilidade', { corpo: { idioma: 'pt', nota: 'teste' } });
  assert.deepEqual(teste.banco.chamadas[0].valores.slice(1), [null, 1, 'pt', 'BR']);
});

test('utilidade_nota_11_e_recusada', async () => {
  const { resposta } = await chamar('/api/utilidade', { corpo: { idioma: 'pt', nota: 11 } });
  assert.equal(resposta.status, 400);
});

test('rota_desconhecida_da_404_e_metodo_errado_405', async () => {
  assert.equal((await chamar('/api/outra', { corpo: {} })).resposta.status, 404);
  assert.equal((await chamar('/api', { corpo: {} })).resposta.status, 404);
  assert.equal((await chamar('/api/evento', { metodo: 'GET' })).resposta.status, 405);
  assert.equal((await chamar('/api/saude', { metodo: 'POST', corpo: {} })).resposta.status, 405);
});

test('saude_responde_ok_e_503_com_o_banco_fora', async () => {
  const ok = await chamar('/api/saude', { metodo: 'GET', origem: null, tipo: null });
  assert.equal(ok.resposta.status, 200);
  assert.deepEqual(JSON.parse(ok.texto), { ok: true });
  const fora = await chamar('/api/saude', { metodo: 'GET', origem: null, tipo: null }, bancoFalso({ falhar: true }));
  assert.equal(fora.resposta.status, 503);
});

test('banco_fora_no_evento_da_503', async () => {
  const { resposta } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' } }, bancoFalso({ falhar: true }));
  assert.equal(resposta.status, 503);
});

test('toda_resposta_traz_os_oito_cabecalhos_de_seguranca', async () => {
  const respostas = [
    await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' } }),
    await chamar('/api/sus', { corpo: SUS }),
    await chamar('/api/outra', { corpo: {} }),
    await chamar('/api/saude', { metodo: 'GET', origem: null, tipo: null }),
  ];
  for (const { resposta } of respostas) {
    for (const [nome, valor] of Object.entries(CABECALHOS_SEGURANCA)) {
      assert.equal(resposta.headers.get(nome), valor, `${resposta.status} ${nome}`);
    }
    assert.equal(resposta.headers.get('Set-Cookie'), null);
  }
});

test('codigo_do_worker_nao_le_cabecalho_de_ip', async () => {
  const nomes = (await readdir(new URL('../../worker/', import.meta.url))).filter((n) => n.endsWith('.js'));
  for (const nome of nomes) {
    const codigo = (await lerTexto(`worker/${nome}`)).toLowerCase();
    for (const proibido of ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip', 'true-client-ip']) {
      assert.ok(!codigo.includes(proibido), `${nome} cita ${proibido}`);
    }
  }
});
