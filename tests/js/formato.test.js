import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarEscore, formatarNumero, quadradosCheios, truncarMilesimos } from '../../public/js/formato.js';
import { CORTE_ALTA_SENSIBILIDADE, CORTE_EQUILIBRIO, classificar } from '../../public/js/modelo.js';
import { vizinhoAbaixo, vizinhoAcima } from './auxiliares.js';

test('formatarEscore_trunca_e_nunca_arredonda_para_cima', () => {
  assert.equal(formatarEscore(0.5028, 'pt'), '0,502');
  assert.equal(formatarEscore(0.5031, 'en'), '0.503');
  assert.equal(formatarEscore(0.9999, 'pt'), '0,999');
});

test('formatarEscore_nos_cortes_exatos', () => {
  assert.equal(formatarEscore(CORTE_EQUILIBRIO, 'pt'), '0,503');
  assert.equal(formatarEscore(CORTE_ALTA_SENSIBILIDADE, 'pt'), '0,358');
});

test('formatarEscore_logo_abaixo_dos_cortes_mostra_o_milesimo_anterior', () => {
  assert.equal(formatarEscore(vizinhoAbaixo(CORTE_EQUILIBRIO), 'pt'), '0,502');
  assert.equal(formatarEscore(vizinhoAbaixo(CORTE_ALTA_SENSIBILIDADE), 'pt'), '0,357');
  assert.equal(formatarEscore(vizinhoAcima(CORTE_EQUILIBRIO), 'pt'), '0,503');
});

test('formatarEscore_nos_extremos', () => {
  assert.equal(formatarEscore(0, 'pt'), '0,000');
  assert.equal(formatarEscore(1, 'en'), '1.000');
});

test('numero_mostrado_nunca_contradiz_o_corte', () => {
  for (let k = 300; k <= 600; k += 1) {
    for (const escore of [vizinhoAbaixo(k / 1000), k / 1000, vizinhoAcima(k / 1000)]) {
      const mostrado = truncarMilesimos(escore);
      const classe = classificar(escore);
      assert.equal(mostrado >= 503, classe.equilibrio, `escore ${escore}`);
      assert.equal(mostrado >= 358, classe.altaSensibilidade, `escore ${escore}`);
    }
  }
});

test('quadradosCheios_arredonda_o_percentual_da_faixa', () => {
  assert.equal(quadradosCheios('baixa'), 1);
  assert.equal(quadradosCheios('intermediaria'), 11);
  assert.equal(quadradosCheios('alta'), 52);
});

test('formatarNumero_usa_o_separador_do_idioma', () => {
  assert.equal(formatarNumero(60000, 'pt'), '60.000');
  assert.equal(formatarNumero(60000, 'en'), '60,000');
  assert.equal(formatarNumero(93.2, 'pt'), '93,2');
  assert.equal(formatarNumero(0.5, 'en'), '0.5');
});
