import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { calcularEscore, carregarModelo, classificar, transformar } from '../../public/js/modelo.js';
import { lerJson, lerTexto } from './auxiliares.js';

const TOLERANCIA = 1e-12;
const textoModelo = await lerTexto('public/modelo/random_forest_v1.0.0.json');
const modelo = carregarModelo(JSON.parse(textoModelo));
const arquivo = await lerJson('tests/dados/casos_sinteticos_v1.0.0.json');

function escoreSemFround(entrada) {
  const x = transformar(modelo, entrada);
  let soma = 0;
  for (const { esquerdo, direito, variavel, limiar, prob } of modelo.arvores) {
    let no = 0;
    while (esquerdo[no] !== -1) no = x[variavel[no]] <= limiar[no] ? esquerdo[no] : direito[no];
    soma += prob[no];
  }
  return soma / modelo.n_arvores;
}

test('arquivo_de_casos_foi_gerado_com_este_json', () => {
  const sha = createHash('sha256').update(textoModelo).digest('hex');
  assert.equal(arquivo.sha256_modelo_json, sha);
  assert.equal(arquivo.n, arquivo.casos.length);
});

test('paridade_sintetica_js_igual_ao_sklearn_em_todos_os_casos', () => {
  let difMaxima = 0;
  let bitABit = 0;
  const reprovados = [];
  arquivo.casos.forEach((caso, i) => {
    const escore = calcularEscore(modelo, caso.entrada);
    const dif = Math.abs(escore - caso.escore);
    const classe = classificar(escore);
    difMaxima = Math.max(difMaxima, dif);
    if (escore === caso.escore) bitABit += 1;
    if (dif > TOLERANCIA || classe.equilibrio !== caso.equilibrio || classe.altaSensibilidade !== caso.alta_sensibilidade) {
      reprovados.push(i);
    }
  });
  console.log(`casos ${arquivo.casos.length}, diferença máxima ${difMaxima}, iguais bit a bit ${bitABit}`);
  assert.deepEqual(reprovados, []);
});

test('casos_nos_limiares_pegam_a_falta_do_fround', () => {
  const limiares = arquivo.casos.filter((caso) => caso.grupo === 'limiar');
  const divergentes = limiares.filter((caso) => Math.abs(escoreSemFround(caso.entrada) - caso.escore) > TOLERANCIA);
  console.log(`sem Math.fround, ${divergentes.length} de ${limiares.length} casos nos limiares divergem`);
  assert.ok(divergentes.length > 0);
});
