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

/** Lê o bloco de um caminho do _headers (cada bloco começa numa linha sem recuo). */
function lerBloco(texto, caminho) {
  const linhas = texto.split('\n');
  const inicio = linhas.indexOf(caminho);
  assert.notEqual(inicio, -1, `bloco ${caminho} ausente`);
  const bloco = [];
  for (const linha of linhas.slice(inicio + 1)) {
    if (!linha.startsWith(' ')) break;
    bloco.push(linha);
  }
  return Object.fromEntries(bloco.map((linha) => {
    const posicao = linha.indexOf(':');
    return [linha.slice(0, posicao).trim(), linha.slice(posicao + 1).trim()];
  }));
}

function lerArquivoDeCabecalhos(texto) {
  return lerBloco(texto, '/*');
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

test('modelo_versionado_em_cache_longo_e_codigo_sempre_revalidado', async () => {
  const texto = await lerTexto('public/_headers');
  assert.equal(lerBloco(texto, '/modelo/*')['Cache-Control'], 'public, max-age=31536000, immutable');
  // JS e CSS sem prazo: módulos de versões diferentes não podem se misturar depois de um deploy.
  for (const caminho of ['/js/*', '/css/*']) {
    assert.equal(lerBloco(texto, caminho)['Cache-Control'], 'public, max-age=0, must-revalidate', caminho);
  }
  assert.equal(lerBloco(texto, '/img/*')['Cache-Control'], 'public, max-age=300, must-revalidate');
});
