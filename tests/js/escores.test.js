import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UNIDADES_INICIAIS, VALORES_VAZIOS } from '../../public/js/entrada.js';
import { calcularAlvarado, calcularPas, categoriaAlvarado, categoriaPas, dadosDosEscores } from '../../public/js/escores.js';

const NENHUM = {
  nauseaOuVomito: false, dorFid: false, febre: false,
  leucocitosMm3: 8000, neutrofilosMm3: 5000, neutrofilosPct: 62.5,
  migracao: false, anorexia: false, acetona: false, descompressao: false, dorTosse: false,
  temperaturaC: 36.5,
};

function presente(resultado, chave) {
  return resultado.itens.find((item) => item.chave === chave).presente;
}

test('alvarado_sem_nenhum_item_da_zero_e_sem_categoria', () => {
  assert.deepEqual([calcularAlvarado(NENHUM).total, calcularAlvarado(NENHUM).categoria], [0, 'sem_categoria']);
});

test('alvarado_com_todos_os_itens_da_10', () => {
  const dados = { ...NENHUM, nauseaOuVomito: true, dorFid: true, leucocitosMm3: 15000, neutrofilosPct: 80, migracao: true, anorexia: true, descompressao: true, temperaturaC: 38 };
  assert.deepEqual([calcularAlvarado(dados).total, calcularAlvarado(dados).categoria], [10, 'muito_provavel']);
});

test('pas_com_todos_os_itens_da_10', () => {
  const dados = { ...NENHUM, dorTosse: true, anorexia: true, febre: true, nauseaOuVomito: true, dorFid: true, leucocitosMm3: 10000, neutrofilosMm3: 7501, migracao: true };
  assert.deepEqual([calcularPas(dados).total, calcularPas(dados).categoria], [10, 'alta']);
});

test('leucocitos_10000_pontuam_no_pas_e_nao_no_alvarado', () => {
  const dados = { ...NENHUM, leucocitosMm3: 10000 };
  assert.equal(presente(calcularAlvarado(dados), 'item_leuco_alvarado'), false);
  assert.equal(presente(calcularPas(dados), 'item_leuco_pas'), true);
});

test('leucocitos_10001_pontuam_nos_dois', () => {
  const dados = { ...NENHUM, leucocitosMm3: 10001 };
  assert.equal(presente(calcularAlvarado(dados), 'item_leuco_alvarado'), true);
  assert.equal(presente(calcularPas(dados), 'item_leuco_pas'), true);
});

test('neutrofilos_75_por_cento_nao_pontuam_no_alvarado_e_75_1_pontuam', () => {
  assert.equal(presente(calcularAlvarado({ ...NENHUM, neutrofilosPct: 75 }), 'item_neutro_alvarado'), false);
  assert.equal(presente(calcularAlvarado({ ...NENHUM, neutrofilosPct: 75.1 }), 'item_neutro_alvarado'), true);
});

test('neutrofilos_7500_nao_pontuam_no_pas_e_7501_pontuam', () => {
  assert.equal(presente(calcularPas({ ...NENHUM, neutrofilosMm3: 7500 }), 'item_neutro_pas'), false);
  assert.equal(presente(calcularPas({ ...NENHUM, neutrofilosMm3: 7501 }), 'item_neutro_pas'), true);
});

test('temperatura_de_37_3_pontua_e_37_2_nao', () => {
  assert.equal(presente(calcularAlvarado({ ...NENHUM, temperaturaC: 37.3 }), 'item_temperatura'), true);
  assert.equal(presente(calcularAlvarado({ ...NENHUM, temperaturaC: 37.2 }), 'item_temperatura'), false);
});

test('temperatura_em_fahrenheit_arredondada_antes_de_comparar', () => {
  const unidades = { ...UNIDADES_INICIAIS.pt, temperatura: 'f' };
  const em = (texto) => dadosDosEscores({ ...VALORES_VAZIOS, temperatura: texto }, unidades).temperaturaC;
  assert.equal(em('99,0'), 37.2);
  assert.equal(em('99,1'), 37.3);
  assert.equal(em('99.2'), 37.3);
});

test('anorexia_ou_acetona_exige_as_duas_respostas', () => {
  const dados = { ...NENHUM, anorexia: true, acetona: null };
  assert.equal(presente(calcularAlvarado(dados), 'item_anorexia_acetona'), null);
  assert.equal(calcularAlvarado(dados).total, null);
  assert.equal(presente(calcularAlvarado({ ...NENHUM, anorexia: false, acetona: true }), 'item_anorexia_acetona'), true);
});

test('item_sem_resposta_deixa_o_total_nulo', () => {
  assert.equal(calcularPas({ ...NENHUM, dorTosse: null }).total, null);
  assert.equal(calcularPas({ ...NENHUM, dorTosse: null }).categoria, null);
});

test('categorias_nos_limites', () => {
  assert.deepEqual([4, 5, 6, 7, 8, 9, 10].map(categoriaAlvarado),
    ['sem_categoria', 'compativel', 'compativel', 'provavel', 'provavel', 'muito_provavel', 'muito_provavel']);
  assert.deepEqual([0, 5, 6, 7, 10].map(categoriaPas), ['nao_compativel', 'nao_compativel', 'compativel', 'alta', 'alta']);
});

test('dadosDosEscores_le_as_unidades_do_ingles', () => {
  const valores = { ...VALORES_VAZIOS, leucocitos: '12,6', neutrofilos: '80' };
  const dados = dadosDosEscores(valores, { ...UNIDADES_INICIAIS.en, neutrofilos: 'pct' });
  assert.equal(dados.leucocitosMm3, 12600);
  assert.equal(dados.neutrofilosPct, 80);
  assert.equal(dados.neutrofilosMm3, 10080);
});

test('dadosDosEscores_nausea_ou_vomito', () => {
  const un = UNIDADES_INICIAIS.pt;
  assert.equal(dadosDosEscores({ ...VALORES_VAZIOS, nausea: 'sim' }, un).nauseaOuVomito, true);
  assert.equal(dadosDosEscores({ ...VALORES_VAZIOS, nausea: 'nao' }, un).nauseaOuVomito, null);
  assert.equal(dadosDosEscores({ ...VALORES_VAZIOS, nausea: 'nao', emese: 'nao' }, un).nauseaOuVomito, false);
});

test('dadosDosEscores_valor_fora_da_faixa_vira_nulo', () => {
  const dados = dadosDosEscores({ ...VALORES_VAZIOS, leucocitos: '12.600', temperatura: '44' }, UNIDADES_INICIAIS.pt);
  assert.equal(dados.leucocitosMm3, null);
  assert.equal(dados.temperaturaC, null);
});
