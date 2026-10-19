// Auxiliares dos testes em node:test.
import { readFile } from 'node:fs/promises';

/** Lê um JSON pelo caminho relativo à raiz do repositório. */
export async function lerJson(caminhoRelativo) {
  const url = new URL(`../../${caminhoRelativo}`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

/** Lê um arquivo de texto pelo caminho relativo à raiz do repositório. */
export async function lerTexto(caminhoRelativo) {
  return readFile(new URL(`../../${caminhoRelativo}`, import.meta.url), 'utf8');
}

/** Devolve o double imediatamente abaixo de x, para x positivo. */
export function vizinhoAbaixo(x) {
  const visao = new DataView(new ArrayBuffer(8));
  visao.setFloat64(0, x);
  visao.setBigUint64(0, visao.getBigUint64(0) - 1n);
  return visao.getFloat64(0);
}

/** Devolve o double imediatamente acima de x, para x positivo. */
export function vizinhoAcima(x) {
  const visao = new DataView(new ArrayBuffer(8));
  visao.setFloat64(0, x);
  visao.setBigUint64(0, visao.getBigUint64(0) + 1n);
  return visao.getFloat64(0);
}
