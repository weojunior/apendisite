import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVE_SUS,
  faltandoNoSus,
  lerRespondido,
  marcarRespondido,
  novaVisita,
  oQueMostrarAbaixoDoResultado,
  registrarResultado,
} from '../../public/js/visita.js';

const ATIVO = { respondido: false, ativo: true };

function armazenamentoFalso() {
  const dados = new Map();
  return { getItem: (k) => (dados.has(k) ? dados.get(k) : null), setItem: (k, v) => dados.set(k, String(v)), dados };
}

test('convite_so_no_primeiro_resultado_da_visita', () => {
  const primeiro = registrarResultado(novaVisita());
  assert.equal(oQueMostrarAbaixoDoResultado(primeiro, ATIVO), 'convite');
  assert.equal(oQueMostrarAbaixoDoResultado(registrarResultado(primeiro), ATIVO), 'nada');
  assert.equal(oQueMostrarAbaixoDoResultado(novaVisita(), ATIVO), 'nada');
});

test('agora_nao_esconde_o_convite', () => {
  const visita = { ...registrarResultado(novaVisita()), conviteDispensado: true };
  assert.equal(oQueMostrarAbaixoDoResultado(visita, ATIVO), 'nada');
});

test('quem_ja_respondeu_ve_a_utilidade_e_depois_o_obrigado', () => {
  const visita = registrarResultado(novaVisita());
  assert.equal(oQueMostrarAbaixoDoResultado(visita, { respondido: true, ativo: true }), 'utilidade');
  assert.equal(oQueMostrarAbaixoDoResultado({ ...visita, utilidade: 'obrigado' }, { respondido: true, ativo: true }), 'obrigado');
  assert.equal(oQueMostrarAbaixoDoResultado({ ...visita, utilidade: 'pulada' }, { respondido: true, ativo: true }), 'nada');
});

test('questionario_desligado_nao_mostra_nada', () => {
  const visita = registrarResultado(novaVisita());
  assert.equal(oQueMostrarAbaixoDoResultado(visita, { respondido: false, ativo: false }), 'nada');
  assert.equal(oQueMostrarAbaixoDoResultado(visita, { respondido: true, ativo: false }), 'nada');
});

test('faltandoNoSus_lista_cada_pergunta_sem_resposta', () => {
  const respostas = { itens: ['3', '', '2', '5', '1', '3', '4', '2', '5', ''], area: '', pais: 'BR', usaria: 'sim' };
  assert.deepEqual(faltandoNoSus(respostas), ['item2', 'item10', 'area']);
});

test('marca_de_respondido_no_aparelho', () => {
  const armazenamento = armazenamentoFalso();
  assert.equal(lerRespondido(armazenamento), false);
  assert.equal(marcarRespondido(armazenamento), true);
  assert.equal(armazenamento.dados.get(CHAVE_SUS), '1');
  assert.equal(lerRespondido(armazenamento), true);
});

test('sem_armazenamento_nada_quebra', () => {
  assert.equal(lerRespondido(null), false);
  assert.equal(marcarRespondido(null), false);
  const quebrado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
  assert.equal(lerRespondido(quebrado), false);
  assert.equal(marcarRespondido(quebrado), false);
});
