import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, CHAVES, PAISES, USARIA } from '../../public/js/contrato_api.js';
import { TEXTOS, listaDePaises } from '../../public/js/textos.js';

test('paises_tem_249_codigos_iso_unicos_com_o_brasil', () => {
  assert.equal(PAISES.length, 249);
  assert.equal(new Set(PAISES).size, 249);
  assert.ok(PAISES.every((codigo) => /^[A-Z]{2}$/.test(codigo)));
  assert.ok(PAISES.includes('BR'));
});

test('areas_e_usaria_batem_com_os_textos_dos_dois_idiomas', () => {
  for (const idioma of ['pt', 'en']) {
    assert.deepEqual(Object.keys(TEXTOS[idioma].areas), [...AREAS]);
    assert.deepEqual(Object.keys(TEXTOS[idioma].usaria), [...USARIA]);
  }
});

test('corpo_do_sus_tem_o_campo_isca', () => {
  assert.ok(CHAVES.sus.includes('site'));
});

test('listaDePaises_comeca_pelo_brasil_e_ordena_o_resto_pelo_nome', () => {
  for (const [idioma, nome] of [['pt', 'Brasil'], ['en', 'Brazil']]) {
    const lista = listaDePaises(idioma);
    assert.deepEqual(lista[0], ['BR', nome]);
    assert.equal(lista.length, 249);
    const resto = lista.slice(1).map(([, n]) => n);
    assert.deepEqual(resto, [...resto].sort((a, b) => a.localeCompare(b, idioma)));
  }
});
