import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroValidacao,
  diaEmBrasilia,
  paisDoCabecalho,
  validarEvento,
  validarSus,
  validarUtilidade,
} from '../../worker/validacao.js';

const SUS = { idioma: 'pt', itens: [3, 4, 2, 5, 1, 3, 4, 2, 5, 1], area: 'pediatria', pais: 'BR', usaria: 'sim', site: '' };

test('validarEvento_aceita_o_contrato', () => {
  assert.deepEqual(validarEvento({ evento: 'abriu', idioma: 'pt' }), { evento: 'abriu', idioma: 'pt' });
});

test('validarEvento_recusa_chave_a_mais_valor_fora_da_lista_e_corpo_que_nao_e_objeto', () => {
  for (const corpo of [
    { evento: 'abriu', idioma: 'pt', leucocitos: 12000 },
    { evento: 'saiu', idioma: 'pt' },
    { evento: 'abriu', idioma: 'es' },
    { evento: 'abriu' },
    null, [], 'abriu',
  ]) {
    assert.throws(() => validarEvento(corpo), ErroValidacao, JSON.stringify(corpo));
  }
});

test('validarSus_aceita_o_contrato_e_marca_a_isca', () => {
  assert.deepEqual(validarSus(SUS), { idioma: 'pt', itens: SUS.itens, area: 'pediatria', pais: 'BR', usaria: 'sim', isca: false });
  assert.equal(validarSus({ ...SUS, site: 'http://spam' }).isca, true);
});

test('validarSus_recusa_itens_fora_do_contrato', () => {
  for (const itens of [SUS.itens.slice(1), [0, ...SUS.itens.slice(1)], [6, ...SUS.itens.slice(1)], [2.5, ...SUS.itens.slice(1)], ['3', ...SUS.itens.slice(1)]]) {
    assert.throws(() => validarSus({ ...SUS, itens }), ErroValidacao, JSON.stringify(itens));
  }
});

test('validarSus_recusa_area_pais_usaria_e_isca_invalidos', () => {
  for (const mudanca of [{ area: 'enfermagem' }, { pais: 'ZZ' }, { usaria: 'nunca' }, { site: 3 }, { site: 'x'.repeat(201) }]) {
    assert.throws(() => validarSus({ ...SUS, ...mudanca }), ErroValidacao, JSON.stringify(mudanca));
  }
});

test('validarUtilidade_aceita_0_a_10_e_teste', () => {
  assert.deepEqual(validarUtilidade({ idioma: 'en', nota: 0 }), { idioma: 'en', nota: 0, teste: 0 });
  assert.deepEqual(validarUtilidade({ idioma: 'en', nota: 10 }), { idioma: 'en', nota: 10, teste: 0 });
  assert.deepEqual(validarUtilidade({ idioma: 'pt', nota: 'teste' }), { idioma: 'pt', nota: null, teste: 1 });
});

test('validarUtilidade_recusa_nota_fora_do_contrato', () => {
  for (const nota of [11, -1, 7.5, '7', null]) {
    assert.throws(() => validarUtilidade({ idioma: 'pt', nota }), ErroValidacao, String(nota));
  }
});

test('paisDoCabecalho_usa_XX_quando_falta', () => {
  assert.equal(paisDoCabecalho({ country: 'BR' }), 'BR');
  assert.equal(paisDoCabecalho({ country: 'T1' }), 'T1');
  assert.equal(paisDoCabecalho(undefined), 'XX');
  assert.equal(paisDoCabecalho({}), 'XX');
});

test('diaEmBrasilia_vira_as_tres_da_manha_em_utc', () => {
  assert.equal(diaEmBrasilia(new Date('2026-10-23T02:59:59Z')), '2026-10-22');
  assert.equal(diaEmBrasilia(new Date('2026-10-23T03:00:00Z')), '2026-10-23');
});
