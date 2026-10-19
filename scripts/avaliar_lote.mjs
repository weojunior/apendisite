// Avalia um lote de entradas com o motor do site, para a paridade em Python.
// Uso: node scripts/avaliar_lote.mjs <modelo.json> <entradas.json> <saida.json>
import { readFile, writeFile } from 'node:fs/promises';
import { calcularEscore, carregarModelo } from '../public/js/modelo.js';

const [caminhoModelo, caminhoEntradas, caminhoSaida] = process.argv.slice(2);
if (!caminhoSaida) {
  console.error('uso: node scripts/avaliar_lote.mjs <modelo.json> <entradas.json> <saida.json>');
  process.exit(2);
}
const modelo = carregarModelo(JSON.parse(await readFile(caminhoModelo, 'utf8')));
const entradas = JSON.parse(await readFile(caminhoEntradas, 'utf8'));
const escores = entradas.map((entrada) => calcularEscore(modelo, entrada));
await writeFile(caminhoSaida, JSON.stringify(escores));
