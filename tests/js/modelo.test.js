import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CORTE_ALTA_SENSIBILIDADE,
  CORTE_EQUILIBRIO,
  ErroModelo,
  FREQUENCIAS,
  calcularEscore,
  carregarModelo,
  classificar,
  transformar,
} from '../../public/js/modelo.js';
import { lerJson, vizinhoAbaixo } from './auxiliares.js';

const json = await lerJson('public/modelo/random_forest_v1.0.0.json');
const modelo = carregarModelo(json);
const TODAS_NULAS = Object.fromEntries(modelo.entradas.map((nome) => [nome, null]));

// Floresta de uma árvore só, com a raiz cortando a idade em 1,0.
const MINIMO = {
  numericas: ['idade_anos'],
  medianas: [9],
  indicadores_numericas: [],
  binarias: [],
  modas: [],
  indicadores_binarias: [],
  sexo_um: 'M',
  n_arvores: 1,
  arvores: [
    { esquerdo: [1, -1, -1], direito: [2, -1, -1], variavel: [0, -2, -2], limiar: [1.0, -2, -2], prob: [0.5, 0.2, 0.8] },
  ],
};

test('carregarModelo_recusa_formato_desconhecido', () => {
  assert.throws(() => carregarModelo({ ...json, formato: 'outro' }), ErroModelo);
});

test('carregarModelo_recusa_floresta_com_499_arvores', () => {
  assert.throws(() => carregarModelo({ ...json, arvores: json.arvores.slice(1) }), ErroModelo);
});

test('carregarModelo_recusa_31_saidas', () => {
  assert.throws(() => carregarModelo({ ...json, saidas: json.saidas.slice(1) }), ErroModelo);
});

test('transformar_com_tudo_faltante_usa_medianas_modas_e_indicadores', () => {
  const x = transformar(modelo, TODAS_NULAS);
  assert.equal(x.length, 32);
  assert.deepEqual(x.slice(0, 6), modelo.medianas);
  assert.deepEqual(x.slice(6, 11), [1, 1, 1, 1, 1]);
  assert.deepEqual(x.slice(11, 23), modelo.modas);
  assert.deepEqual(x.slice(23, 31), [1, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(x[31], 0);
});

test('transformar_idade_faltante_nao_tem_indicador', () => {
  const entrada = { ...TODAS_NULAS, leucocitos: 1, neutrofilos: 1, pcr: 1, leucocitos_urina: 1, peso: 1 };
  const x = transformar(modelo, entrada);
  assert.equal(x[0], 9);
  assert.deepEqual(x.slice(6, 11), [0, 0, 0, 0, 0]);
});

test('transformar_codifica_sexo_m_como_1_e_os_demais_como_0', () => {
  assert.equal(transformar(modelo, { ...TODAS_NULAS, sexo: 'M' })[31], 1);
  assert.equal(transformar(modelo, { ...TODAS_NULAS, sexo: 'F' })[31], 0);
  assert.equal(transformar(modelo, TODAS_NULAS)[31], 0);
});

test('calcularEscore_vai_para_a_esquerda_no_limiar_exato', () => {
  assert.equal(calcularEscore(MINIMO, { idade_anos: 1.0, sexo: 'F' }), 0.2);
});

test('calcularEscore_converte_para_float32_antes_de_comparar', () => {
  // 1.00000001 fica acima de 1 em double, mas vira 1 em float32 e vai para a esquerda.
  assert.equal(calcularEscore(MINIMO, { idade_anos: 1.00000001, sexo: 'F' }), 0.2);
  assert.equal(calcularEscore(MINIMO, { idade_anos: 1.0000002, sexo: 'F' }), 0.8);
});

test('calcularEscore_com_tudo_faltante_fica_entre_0_e_1', () => {
  const escore = calcularEscore(modelo, TODAS_NULAS);
  assert.ok(escore >= 0 && escore <= 1);
});

test('cortes_escritos_com_tres_casas', () => {
  assert.equal(CORTE_EQUILIBRIO, 0.503);
  assert.equal(CORTE_ALTA_SENSIBILIDADE, 0.358);
});

test('classificar_no_corte_exato_e_positivo', () => {
  assert.deepEqual(classificar(CORTE_EQUILIBRIO), { equilibrio: true, altaSensibilidade: true, faixa: 'alta' });
  assert.deepEqual(classificar(CORTE_ALTA_SENSIBILIDADE), { equilibrio: false, altaSensibilidade: true, faixa: 'intermediaria' });
});

test('classificar_logo_abaixo_do_corte_e_negativo', () => {
  assert.deepEqual(classificar(vizinhoAbaixo(CORTE_EQUILIBRIO)), { equilibrio: false, altaSensibilidade: true, faixa: 'intermediaria' });
  assert.deepEqual(classificar(vizinhoAbaixo(CORTE_ALTA_SENSIBILIDADE)), { equilibrio: false, altaSensibilidade: false, faixa: 'baixa' });
});

test('frequencias_da_validacao_em_botucatu', () => {
  assert.deepEqual(FREQUENCIAS, {
    baixa: { operadas: 1, total: 120 },
    intermediaria: { operadas: 8, total: 70 },
    alta: { operadas: 67, total: 130 },
  });
});
