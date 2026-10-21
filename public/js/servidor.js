// Chamadas a /api. Cada corpo é montado só com as chaves do contrato (spec, seção 9.2).
// Nenhum valor do formulário nem o resultado sai do aparelho.

export function montarCorpoEvento(evento, idioma) {
  return { evento, idioma };
}

export function montarCorpoSus({ idioma, itens, area, pais, usaria, site }) {
  return { idioma, itens: [...itens], area, pais, usaria, site };
}

export function montarCorpoUtilidade(idioma, nota) {
  return { idioma, nota };
}

/** POST JSON. Devolve true se a resposta foi 2xx. */
export async function enviar(rota, corpo, buscar = globalThis.fetch.bind(globalThis)) {
  const resposta = await buscar(rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
    credentials: 'omit',
    keepalive: true,
  });
  return resposta.ok;
}

/** Como enviar, mas erro de rede vira false. O cálculo nunca depende do servidor. */
export async function enviarSemFalha(rota, corpo, buscar) {
  try {
    return await enviar(rota, corpo, buscar);
  } catch {
    return false;
  }
}
