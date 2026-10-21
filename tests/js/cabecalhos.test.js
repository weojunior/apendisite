import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { CABECALHOS_SEGURANCA } from '../../worker/cabecalhos.js';
import { lerTexto } from './auxiliares.js';

async function existe(caminho) {
  try {
    await access(new URL(`../../${caminho}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

function lerArquivoDeCabecalhos(texto) {
  const linhas = texto.split('\n').filter((linha) => linha.trim() !== '');
  assert.equal(linhas[0], '/*');
  return Object.fromEntries(linhas.slice(1).map((linha) => {
    const posicao = linha.indexOf(':');
    return [linha.slice(0, posicao).trim(), linha.slice(posicao + 1).trim()];
  }));
}

test('_headers_iguais_aos_cabecalhos_do_worker', async () => {
  for (const caminho of ['public/_headers', 'plano-b/_headers']) {
    if (caminho.startsWith('plano-b') && !(await existe(caminho))) continue;
    assert.deepEqual(lerArquivoDeCabecalhos(await lerTexto(caminho)), { ...CABECALHOS_SEGURANCA }, caminho);
  }
});

test('hsts_sem_preload', () => {
  assert.ok(!CABECALHOS_SEGURANCA['Strict-Transport-Security'].includes('preload'));
});

test('pagina_404_bilingue_sem_javascript', async () => {
  const html = await lerTexto('public/404.html');
  assert.ok(!/<script/i.test(html));
  assert.ok(html.includes('Página não encontrada.'));
  assert.ok(html.includes('Page not found.'));
});
