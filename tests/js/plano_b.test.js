import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerTexto } from './auxiliares.js';

const TRAVESSAO = String.fromCharCode(0x2014);
const html = await lerTexto('plano-b/index.html');
const aprovado = await lerTexto('docs/textos_aprovados.md');

function textos() {
  return [...html.matchAll(/<(p|li|h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => m[2].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
}

test('plano_b_sem_javascript', () => {
  assert.ok(!/<script/i.test(html));
});

test('plano_b_so_tem_textos_aprovados', () => {
  const ausentes = [];
  for (const texto of textos()) {
    for (const pedaco of texto.split(/10\.5281\/zenodo\.\d+/)) {
      if (pedaco.trim() && !aprovado.includes(pedaco.trim())) ausentes.push(pedaco);
    }
  }
  assert.deepEqual(ausentes, []);
});

test('plano_b_tem_portugues_e_depois_ingles_sem_travessao', () => {
  assert.ok(html.indexOf('lang="pt-BR"') < html.indexOf('lang="en"'));
  assert.ok(!html.includes(TRAVESSAO));
});
