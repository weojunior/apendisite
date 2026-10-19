import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOI_CONCEITO,
  DOI_VERSAO,
  TEXTOS,
  escolherIdioma,
  mensagemDeErro,
  preencher,
} from '../../public/js/textos.js';
import { lerTexto } from './auxiliares.js';

const aprovado = await lerTexto('docs/textos_aprovados.md');

function folhas(valor, caminho = '') {
  if (typeof valor === 'string') return [[caminho, valor]];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => folhas(v, `${caminho}[${i}]`));
  return Object.entries(valor).flatMap(([k, v]) => folhas(v, caminho ? `${caminho}.${k}` : k));
}

function estrutura(valor) {
  if (typeof valor === 'string') return 'texto';
  if (Array.isArray(valor)) return valor.map(estrutura);
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, estrutura(v)]));
}

test('pt_e_en_tem_as_mesmas_chaves_e_listas_do_mesmo_tamanho', () => {
  assert.deepEqual(estrutura(TEXTOS.en), estrutura(TEXTOS.pt));
});

test('nenhum_texto_vazio', () => {
  for (const idioma of ['pt', 'en']) {
    for (const [caminho, texto] of folhas(TEXTOS[idioma])) {
      assert.ok(texto.trim().length > 0, `${idioma}.${caminho} vazio`);
    }
  }
});

test('nenhum_travessao', () => {
  for (const idioma of ['pt', 'en']) {
    for (const [caminho, texto] of folhas(TEXTOS[idioma])) {
      assert.ok(!texto.includes('\u2014'), `${idioma}.${caminho} tem travessão`);
    }
  }
});

test('todo_texto_vem_palavra_por_palavra_dos_textos_aprovados', () => {
  const ausentes = [];
  for (const idioma of ['pt', 'en']) {
    for (const [caminho, texto] of folhas(TEXTOS[idioma])) {
      for (const pedaco of texto.split(/\{\w+\}/)) {
        if (pedaco.trim() && !aprovado.includes(pedaco)) ausentes.push(`${idioma}.${caminho}: ${pedaco}`);
      }
    }
  }
  assert.deepEqual(ausentes, []);
});

test('dois_sao_nulos_ou_no_formato_do_zenodo', () => {
  for (const doi of [DOI_VERSAO, DOI_CONCEITO]) {
    assert.ok(doi === null || /^10\.5281\/zenodo\.\d+$/.test(doi), `DOI inválido: ${doi}`);
  }
});

test('escolherIdioma_url_vence_aparelho_e_navegador', () => {
  assert.equal(escolherIdioma({ parametroUrl: 'en', guardado: 'pt', idiomasNavegador: ['pt-BR'] }), 'en');
  assert.equal(escolherIdioma({ parametroUrl: 'pt', guardado: 'en', idiomasNavegador: ['en-US'] }), 'pt');
});

test('escolherIdioma_aparelho_vence_navegador', () => {
  assert.equal(escolherIdioma({ parametroUrl: null, guardado: 'en', idiomasNavegador: ['pt-BR'] }), 'en');
});

test('escolherIdioma_navegador_em_ingles_abre_em_ingles_e_os_demais_em_portugues', () => {
  assert.equal(escolherIdioma({ idiomasNavegador: ['en-GB', 'pt-BR'] }), 'en');
  assert.equal(escolherIdioma({ idiomasNavegador: ['fr-FR'] }), 'pt');
  assert.equal(escolherIdioma({ idiomasNavegador: [] }), 'pt');
  assert.equal(escolherIdioma({ parametroUrl: 'es', idiomasNavegador: ['es-ES'] }), 'pt');
});

test('preencher_troca_as_chaves', () => {
  assert.equal(preencher('Modelo {versao}', { versao: '1.0.0' }), 'Modelo 1.0.0');
});

test('mensagemDeErro_de_faixa_usa_numero_e_unidade_do_idioma', () => {
  assert.equal(
    mensagemDeErro({ campo: 'leucocitos', codigo: 'faixa', faixa: [500, 60000], unidade: 'mm3' }, 'pt'),
    'Valor fora da faixa aceita (500 a 60.000 /mm³). Confira o número e a unidade.',
  );
  assert.equal(
    mensagemDeErro({ campo: 'leucocitos', codigo: 'faixa', faixa: [0.5, 60], unidade: 'mil_ul' }, 'en'),
    'Value outside the accepted range (0.5 to 60 ×10³/µL). Check the number and the unit.',
  );
  assert.equal(
    mensagemDeErro({ campo: 'idade', codigo: 'faixa', faixa: [2, 14], unidade: 'anos' }, 'pt'),
    'Valor fora da faixa aceita (2 a 14 anos). Confira o número e a unidade.',
  );
  assert.equal(
    mensagemDeErro({ campo: 'urina', codigo: 'faixa', faixa: [0, 500], unidade: 'campo' }, 'en'),
    'Value outside the accepted range (0 to 500 per high-power field). Check the number and the unit.',
  );
});

test('mensagemDeErro_dos_demais_codigos', () => {
  assert.equal(mensagemDeErro({ campo: 'peso', codigo: 'vazio' }, 'pt'), 'Preencha este campo.');
  assert.equal(mensagemDeErro({ campo: 'idade', codigo: 'idade' }, 'en'), 'The model applies to children aged 2 to 14 years.');
  assert.equal(mensagemDeErro({ campo: 'neutrofilos', codigo: 'neutrofilos_acima' }, 'pt'), 'Os neutrófilos não podem passar do total de leucócitos.');
  assert.equal(mensagemDeErro({ campo: 'declaracao', codigo: 'declaracao' }, 'en'), 'Check the statement to calculate.');
});
