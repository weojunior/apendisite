import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAVES, ROTAS } from '../../public/js/contrato_api.js';
import { VALORES_VAZIOS } from '../../public/js/entrada.js';
import { enviar, enviarSemFalha, montarCorpoEvento, montarCorpoSus, montarCorpoUtilidade } from '../../public/js/servidor.js';

const CAMPOS_DO_FORMULARIO = Object.keys(VALORES_VAZIOS);
const formulario = Object.fromEntries(CAMPOS_DO_FORMULARIO.map((campo) => [campo, '1']));

function buscarFalso(status = 201) {
  const pedidos = [];
  const buscar = async (url, init) => {
    pedidos.push({ url, init });
    return { ok: status >= 200 && status < 300, status };
  };
  return { buscar, pedidos };
}

test('corpos_tem_so_as_chaves_do_contrato', () => {
  const sus = montarCorpoSus({ ...formulario, idioma: 'pt', itens: Array(10).fill(3), area: 'pediatria', pais: 'BR', usaria: 'sim', site: '', escore: 0.6 });
  assert.deepEqual(Object.keys(sus).sort(), [...CHAVES.sus].sort());
  assert.deepEqual(Object.keys(montarCorpoEvento('abriu', 'pt')).sort(), [...CHAVES.evento].sort());
  assert.deepEqual(Object.keys(montarCorpoUtilidade('pt', 7)).sort(), [...CHAVES.utilidade].sort());
});

test('nenhum_campo_do_formulario_entra_num_corpo_enviado', async () => {
  const { buscar, pedidos } = buscarFalso();
  await enviar(ROTAS.sus, montarCorpoSus({ ...formulario, idioma: 'pt', itens: Array(10).fill(3), area: 'pediatria', pais: 'BR', usaria: 'sim', site: '' }), buscar);
  await enviar(ROTAS.evento, montarCorpoEvento('calculou', 'pt'), buscar);
  await enviar(ROTAS.utilidade, montarCorpoUtilidade('pt', 'teste'), buscar);
  for (const { init } of pedidos) {
    const chaves = Object.keys(JSON.parse(init.body));
    for (const campo of CAMPOS_DO_FORMULARIO) assert.ok(!chaves.includes(campo), campo);
  }
});

test('enviar_faz_post_json_sem_credencial', async () => {
  const { buscar, pedidos } = buscarFalso(204);
  assert.equal(await enviar(ROTAS.evento, montarCorpoEvento('abriu', 'en'), buscar), true);
  assert.equal(pedidos[0].url, '/api/evento');
  assert.equal(pedidos[0].init.method, 'POST');
  assert.equal(pedidos[0].init.headers['Content-Type'], 'application/json');
  assert.equal(pedidos[0].init.credentials, 'omit');
});

test('enviarSemFalha_devolve_falso_em_erro_de_rede_e_em_429', async () => {
  const quebrado = async () => { throw new Error('sem rede'); };
  assert.equal(await enviarSemFalha(ROTAS.evento, montarCorpoEvento('abriu', 'pt'), quebrado), false);
  assert.equal(await enviarSemFalha(ROTAS.evento, montarCorpoEvento('abriu', 'pt'), buscarFalso(429).buscar), false);
});
