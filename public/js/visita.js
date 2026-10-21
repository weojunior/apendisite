// Estado da visita: convite, utilidade e marca de "já respondeu". Funções puras.
// Visita é a página aberta. Recarregar começa visita nova (spec, seção 9.1).

export const CHAVE_SUS = 'apendisite.sus_respondido';
const VALOR_RESPONDIDO = '1';

export function novaVisita() {
  return { resultados: 0, conviteDispensado: false, utilidade: 'pendente' };
}

export function registrarResultado(visita) {
  return { ...visita, resultados: visita.resultados + 1 };
}

/** O que vai abaixo do resultado. Só o primeiro resultado da visita leva convite ou utilidade. */
export function oQueMostrarAbaixoDoResultado(visita, { respondido, ativo }) {
  if (!ativo || visita.resultados !== 1) return 'nada';
  if (respondido) {
    if (visita.utilidade === 'obrigado') return 'obrigado';
    return visita.utilidade === 'pulada' ? 'nada' : 'utilidade';
  }
  return visita.conviteDispensado ? 'nada' : 'convite';
}

/** Perguntas do questionário ainda sem resposta, na ordem da tela. */
export function faltandoNoSus(respostas) {
  const faltando = respostas.itens.flatMap((valor, i) => (valor === '' ? [`item${i + 1}`] : []));
  for (const campo of ['area', 'pais', 'usaria']) if (respostas[campo] === '') faltando.push(campo);
  return faltando;
}

export function lerRespondido(armazenamento) {
  try {
    return armazenamento?.getItem(CHAVE_SUS) === VALOR_RESPONDIDO;
  } catch {
    return false;
  }
}

export function marcarRespondido(armazenamento) {
  if (!armazenamento) return false;
  try {
    armazenamento.setItem(CHAVE_SUS, VALOR_RESPONDIDO);
    return true;
  } catch {
    return false;
  }
}
