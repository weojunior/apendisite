import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import { lerJson, lerTexto } from './auxiliares.js';

const DOMINIOS_PERMITIDOS = ['https://doi.org/', 'https://zenodo.org/', 'https://apendisite.com.br'];
const PASTAS_HTML = ['public', 'plano-b'];

async function arquivos(pasta, extensao) {
  let nomes = [];
  try {
    nomes = await readdir(new URL(`../../${pasta}/`, import.meta.url), { recursive: true });
  } catch {
    return [];
  }
  return nomes.filter((nome) => nome.endsWith(extensao)).map((nome) => `${pasta}/${nome}`);
}

const htmls = (await Promise.all(PASTAS_HTML.map((p) => arquivos(p, '.html')))).flat();
const scripts = await arquivos('public/js', '.js');

test('existe_pelo_menos_a_pagina_principal', () => {
  assert.ok(htmls.includes('public/index.html'));
});

test('html_sem_estilo_nem_script_embutido', async () => {
  for (const caminho of htmls) {
    const html = await lerTexto(caminho);
    assert.ok(!/<style/i.test(html), `${caminho}: <style>`);
    assert.ok(!/\sstyle\s*=/i.test(html), `${caminho}: atributo style`);
    assert.ok(!/\son[a-z]+\s*=/i.test(html), `${caminho}: atributo de evento`);
    for (const [, atributos] of html.matchAll(/<script([^>]*)>/gi)) {
      assert.ok(/\ssrc=/.test(atributos), `${caminho}: script sem src`);
    }
  }
});

test('html_sem_recurso_de_outro_dominio', async () => {
  for (const caminho of htmls) {
    const html = await lerTexto(caminho);
    for (const [, url] of html.matchAll(/<(?:script|link|img)[^>]*\s(?:src|href)="([^"]+)"/gi)) {
      assert.ok(!/^[a-z]+:\/\//i.test(url) && !url.startsWith('//'), `${caminho}: ${url}`);
    }
  }
});

test('javascript_so_cita_dominios_permitidos', async () => {
  for (const caminho of scripts) {
    const codigo = await lerTexto(caminho);
    for (const [url] of codigo.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
      assert.ok(DOMINIOS_PERMITIDOS.some((d) => url.startsWith(d)), `${caminho}: ${url}`);
    }
  }
});

test('javascript_nao_usa_innerHTML', async () => {
  for (const caminho of scripts) {
    assert.ok(!(await lerTexto(caminho)).includes('innerHTML'), caminho);
  }
});

test('localStorage_so_grava_as_duas_chaves_da_privacidade', async () => {
  for (const caminho of scripts) {
    const codigo = await lerTexto(caminho);
    for (const [, chave] of codigo.matchAll(/\.setItem\(\s*([^,]+),/g)) {
      assert.ok(['CHAVE_IDIOMA', 'CHAVE_SUS'].includes(chave.trim()), `${caminho}: ${chave}`);
    }
  }
});

test('meta_da_versao_igual_a_versao_do_modelo', async () => {
  const html = await lerTexto('public/index.html');
  const modelo = await lerJson('public/modelo/random_forest_v1.0.0.json');
  assert.ok(html.includes(`<meta name="versao-modelo" content="${modelo.versao_modelo}">`));
});

test('pagina_principal_avisa_sem_javascript_nos_dois_idiomas', async () => {
  const html = await lerTexto('public/index.html');
  assert.ok(html.includes('A calculadora do apendisite precisa de JavaScript.'));
  assert.ok(html.includes('The apendisite calculator requires JavaScript.'));
});

test('pagina_principal_pre_carrega_os_modulos_e_o_modelo', async () => {
  const html = await lerTexto('public/index.html');
  const modulos = (await readdir(new URL('../../public/js/', import.meta.url))).filter((n) => n.endsWith('.js') && n !== 'privacidade.js' && n !== 'app.js');
  for (const modulo of modulos) {
    assert.ok(html.includes(`<link rel="modulepreload" href="/js/${modulo}">`), modulo);
  }
  assert.ok(html.includes('<link rel="preload" href="/modelo/random_forest_v1.0.0.json" as="fetch" crossorigin>'));
});

test('orcamento_de_peso_da_primeira_visita', async () => {
  const tamanho = async (caminho) => (await stat(new URL(`../../${caminho}`, import.meta.url))).size;
  assert.ok((await tamanho('public/img/logo.png')) < 15_000, 'logo.png');
  assert.ok((await tamanho('public/css/apendisite.css')) < 20_000, 'css');
  assert.ok((await tamanho('public/index.html')) < 3_000, 'html');
});

test('app_desenha_o_formulario_antes_de_esperar_o_modelo', async () => {
  const codigo = await lerTexto('public/js/app.js');
  const iniciar = codigo.slice(codigo.indexOf('async function iniciar()'));
  assert.ok(!iniciar.includes('await fetch'), 'iniciar não espera o fetch');
  assert.ok(iniciar.indexOf('desenhar()') < iniciar.indexOf('await carregarModeloEmSegundoPlano()'), 'desenhar antes do modelo');
});
