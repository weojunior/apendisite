import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vizinhoAbaixo, vizinhoAcima } from './auxiliares.js';

test('vizinhos_de_ponto_flutuante_cercam_o_corte', () => {
  assert.ok(vizinhoAbaixo(0.503) < 0.503);
  assert.ok(vizinhoAcima(0.503) > 0.503);
});
