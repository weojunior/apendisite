import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTOS } from '../../public/js/textos.js';
import { lerTexto } from './auxiliares.js';

const html = await lerTexto('public/privacidade/index.html');

function secao(idioma) {
  const encontrada = html.match(new RegExp(`<section[^>]*data-idioma="${idioma}"[^>]*>([\\s\\S]*?)</section>`));
  assert.ok(encontrada, `seção ${idioma} ausente`);
  return encontrada[1];
}

test('privacidade_repete_os_textos_aprovados_nos_dois_idiomas', () => {
  for (const idioma of ['pt', 'en']) {
    const conteudo = secao(idioma);
    const paragrafos = [...conteudo.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].trim());
    assert.deepEqual(paragrafos, TEXTOS[idioma].priv_paragrafos, idioma);
    assert.ok(conteudo.includes(`<h1>${TEXTOS[idioma].priv_titulo}</h1>`), idioma);
    assert.ok(conteudo.includes(TEXTOS[idioma].priv_voltar), idioma);
  }
});

test('privacidade_carrega_so_o_proprio_script', () => {
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts, ['/js/privacidade.js']);
});
