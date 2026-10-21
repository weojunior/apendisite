import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIDADES_INICIAIS,
  VALORES_VAZIOS,
  acoplarRaioX,
  algumRaioXNaoRealizado,
  arredondar,
  lerInteiro,
  lerNumero,
  neutrofilosParaMm3,
  paraMm3,
  pcrParaMgdl,
  progressoDoFormulario,
  validarFormulario,
} from '../../public/js/entrada.js';

const UNIDADES_PT = { ...UNIDADES_INICIAIS.pt };
const UNIDADES_EN = { ...UNIDADES_INICIAIS.en };

function valoresValidos(mudancas = {}) {
  return {
    ...VALORES_VAZIOS,
    idade: '8', sexo: 'M', peso: '27,5',
    nausea: 'sim', emese: 'nao', febre: 'nao', disuria: 'nao',
    dor_fid: 'sim', dor_difusa: 'nao', rx_fid: 'nao', rx_difuso: 'nao',
    leucocitos: '12600', neutrofilos: '9800', pcr: '3,2', urina: '4',
    declaracao: true,
    ...mudancas,
  };
}

test('lerNumero_aceita_virgula_ou_ponto', () => {
  assert.equal(lerNumero('12,5'), 12.5);
  assert.equal(lerNumero('12.5'), 12.5);
  assert.equal(lerNumero(' 7 '), 7);
});

test('lerNumero_sem_separador_de_milhar', () => {
  assert.equal(lerNumero('12.600'), 12.6);
});

test('lerNumero_recusa_texto_que_nao_e_numero', () => {
  for (const texto of ['', 'abc', '-3', '1e3', '1,2,3', ',5', '12 600', '+4']) {
    assert.equal(lerNumero(texto), null, texto);
  }
});

test('lerInteiro_so_aceita_inteiro', () => {
  assert.equal(lerInteiro('8'), 8);
  assert.equal(lerInteiro('8,5'), null);
  assert.equal(lerInteiro('8.0'), null);
});

test('arredondar_sem_residuo_de_ponto_flutuante', () => {
  assert.equal(arredondar(1.005, 2), 1.01);
  assert.equal(arredondar(12.6 * 1000, 0), 12600);
});

test('conversoes_para_a_unidade_do_treino', () => {
  assert.equal(paraMm3(12.6, 'mil_ul'), 12600);
  assert.equal(paraMm3(12650.4, 'mm3'), 12650);
  assert.equal(neutrofilosParaMm3(9.57, 'mil_ul', null), 9570);
  assert.equal(neutrofilosParaMm3(80, 'pct', 12600), 10080);
  assert.equal(pcrParaMgdl(45, 'mgl'), 4.5);
  assert.equal(pcrParaMgdl(45.55, 'mgl'), 4.56);
  assert.equal(pcrParaMgdl(4.567, 'mgdl'), 4.57);
});

test('unidades_iniciais_seguem_o_idioma', () => {
  assert.deepEqual(UNIDADES_INICIAIS.pt, { leucocitos: 'mm3', neutrofilos: 'mm3', pcr: 'mgdl', temperatura: 'c' });
  assert.deepEqual(UNIDADES_INICIAIS.en, { leucocitos: 'mil_ul', neutrofilos: 'mil_ul', pcr: 'mgl', temperatura: 'c' });
});

test('validarFormulario_caminho_feliz_monta_as_19_entradas', () => {
  const { erros, entrada } = validarFormulario(valoresValidos(), UNIDADES_PT);
  assert.deepEqual(erros, []);
  assert.deepEqual(entrada, {
    idade_anos: 8, leucocitos: 12600, neutrofilos: 9800, pcr: 3.2, leucocitos_urina: 4, peso: 27.5,
    nausea: 1, emese: 0, febre: 0, disuria: 0, ped_dor_fid: 1, ped_dor_difusa: 0,
    ped_rx_nivel_fid: 0, ped_rx_nivel_difuso: 0,
    leucocitose: 1, neutrofilia: 1, pcr_alterado: 0, leucocituria: 0,
    sexo: 'M',
  });
});

test('validarFormulario_converte_as_unidades_do_ingles', () => {
  const valores = valoresValidos({ leucocitos: '12.6', neutrofilos: '9,8', pcr: '45' });
  const { erros, entrada } = validarFormulario(valores, UNIDADES_EN);
  assert.deepEqual(erros, []);
  assert.equal(entrada.leucocitos, 12600);
  assert.equal(entrada.neutrofilos, 9800);
  assert.equal(entrada.pcr, 4.5);
});

test('derivadas_usam_maior_estrito', () => {
  const casos = [
    [{ leucocitos: '10000', neutrofilos: '5000' }, 'leucocitose', 0],
    [{ leucocitos: '10001', neutrofilos: '5000' }, 'leucocitose', 1],
    [{ neutrofilos: '7500' }, 'neutrofilia', 0],
    [{ neutrofilos: '7501' }, 'neutrofilia', 1],
    [{ pcr: '5' }, 'pcr_alterado', 0],
    [{ pcr: '5,01' }, 'pcr_alterado', 1],
    [{ urina: '10' }, 'leucocituria', 0],
    [{ urina: '10,1' }, 'leucocituria', 1],
  ];
  for (const [mudancas, derivada, esperado] of casos) {
    const { entrada } = validarFormulario(valoresValidos(mudancas), UNIDADES_PT);
    assert.equal(entrada[derivada], esperado, JSON.stringify(mudancas));
  }
});

test('campo_vazio_bloqueia_e_os_erros_seguem_a_ordem_do_formulario', () => {
  const { erros, entrada } = validarFormulario(valoresValidos({ pcr: '', idade: '', declaracao: false }), UNIDADES_PT);
  assert.equal(entrada, null);
  assert.deepEqual(erros.map((e) => [e.campo, e.codigo]), [['idade', 'vazio'], ['pcr', 'vazio'], ['declaracao', 'declaracao']]);
});

test('idade_fora_de_2_a_14_mostra_a_mensagem_da_idade', () => {
  for (const idade of ['1', '15']) {
    const { erros } = validarFormulario(valoresValidos({ idade }), UNIDADES_PT);
    assert.deepEqual(erros, [{ campo: 'idade', codigo: 'idade' }]);
  }
});

test('idade_nao_inteira_mostra_a_mensagem_de_faixa', () => {
  const { erros } = validarFormulario(valoresValidos({ idade: '8,5' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'idade', codigo: 'faixa', faixa: [2, 14], unidade: 'anos' }]);
});

test('leucocitos_com_ponto_de_milhar_caem_fora_da_faixa', () => {
  const { erros } = validarFormulario(valoresValidos({ leucocitos: '12.600', neutrofilos: '9' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'leucocitos', codigo: 'faixa', faixa: [500, 60000], unidade: 'mm3' }]);
});

test('neutrofilos_acima_dos_leucocitos_bloqueiam', () => {
  const { erros } = validarFormulario(valoresValidos({ leucocitos: '9000', neutrofilos: '9500' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'neutrofilos', codigo: 'neutrofilos_acima' }]);
});

test('faixas_na_unidade_digitada', () => {
  const casos = [
    [{ neutrofilos: '101' }, { ...UNIDADES_PT, neutrofilos: 'pct' }, 'neutrofilos', [0, 100], 'pct'],
    [{ pcr: '61' }, UNIDADES_PT, 'pcr', [0, 60], 'mgdl'],
    [{ pcr: '601', leucocitos: '12,6', neutrofilos: '9,8' }, UNIDADES_EN, 'pcr', [0, 600], 'mgl'],
    [{ peso: '7,9' }, UNIDADES_PT, 'peso', [8, 120], 'kg'],
    [{ urina: '501' }, UNIDADES_PT, 'urina', [0, 500], 'campo'],
  ];
  for (const [mudancas, unidades, campo, faixa, unidade] of casos) {
    const { erros } = validarFormulario(valoresValidos(mudancas), unidades);
    assert.deepEqual(erros, [{ campo, codigo: 'faixa', faixa, unidade }], JSON.stringify(mudancas));
  }
  const { erros } = validarFormulario(valoresValidos({ pcr: '600', leucocitos: '12,6', neutrofilos: '9,8' }), UNIDADES_EN);
  assert.deepEqual(erros, []);
});

test('raio_x_nao_realizado_vira_faltante', () => {
  const { entrada } = validarFormulario(valoresValidos({ rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' }), UNIDADES_PT);
  assert.equal(entrada.ped_rx_nivel_fid, null);
  assert.equal(entrada.ped_rx_nivel_difuso, null);
});

test('raio_x_em_branco_pede_resposta', () => {
  const { erros } = validarFormulario(valoresValidos({ rx_difuso: '' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'rx_difuso', codigo: 'vazio' }]);
});

test('acoplarRaioX_nao_realizado_puxa_o_outro', () => {
  const valores = acoplarRaioX({ rx_fid: '', rx_difuso: 'sim' }, 'rx_fid', 'nao_realizado');
  assert.deepEqual(valores, { rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' });
});

test('acoplarRaioX_sim_ou_nao_limpa_o_nao_realizado_do_outro', () => {
  const valores = acoplarRaioX({ rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' }, 'rx_difuso', 'sim');
  assert.deepEqual(valores, { rx_fid: '', rx_difuso: 'sim' });
});

test('acoplarRaioX_nao_mexe_no_outro_quando_ele_ja_tem_resposta', () => {
  const valores = acoplarRaioX({ rx_fid: 'nao', rx_difuso: 'sim' }, 'rx_fid', 'sim');
  assert.deepEqual(valores, { rx_fid: 'sim', rx_difuso: 'sim' });
});

test('algumRaioXNaoRealizado', () => {
  assert.equal(algumRaioXNaoRealizado({ rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' }), true);
  assert.equal(algumRaioXNaoRealizado({ rx_fid: 'sim', rx_difuso: 'nao' }), false);
});

test('temperatura_vazia_nao_bloqueia', () => {
  assert.deepEqual(validarFormulario(valoresValidos({ temperatura: '' }), UNIDADES_PT).erros, []);
});

test('temperatura_fora_da_faixa_bloqueia_o_calculo_inteiro', () => {
  const { erros, entrada } = validarFormulario(valoresValidos({ temperatura: '44' }), UNIDADES_PT);
  assert.equal(entrada, null);
  assert.deepEqual(erros, [{ campo: 'temperatura', codigo: 'faixa', faixa: [34, 43], unidade: 'c' }]);
});

test('temperatura_em_fahrenheit_usa_a_faixa_da_unidade', () => {
  const unidades = { ...UNIDADES_PT, temperatura: 'f' };
  assert.deepEqual(validarFormulario(valoresValidos({ temperatura: '101' }), unidades).erros, []);
  assert.deepEqual(validarFormulario(valoresValidos({ temperatura: '110' }), unidades).erros,
    [{ campo: 'temperatura', codigo: 'faixa', faixa: [93.2, 109.4], unidade: 'f' }]);
});

test('progresso_do_formulario_vazio_e_zero_de_16', () => {
  assert.deepEqual(progressoDoFormulario(VALORES_VAZIOS), { preenchidos: 0, total: 16 });
});

test('progresso_do_formulario_completo_e_16_de_16', () => {
  assert.deepEqual(progressoDoFormulario(valoresValidos()), { preenchidos: 16, total: 16 });
});

test('progresso_nao_conta_escores_opcionais_nem_espaco_em_branco', () => {
  const valores = valoresValidos({ idade: '  ', migracao: 'sim', temperatura: '37', declaracao: false });
  assert.deepEqual(progressoDoFormulario(valores), { preenchidos: 14, total: 16 });
});
