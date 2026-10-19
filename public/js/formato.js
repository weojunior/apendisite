// Formatação de números para a tela. Funções puras.

const LOCALIDADES = Object.freeze({ pt: 'pt-BR', en: 'en-US' });

/** Formata um número com o separador decimal e de milhar do idioma. */
export function formatarNumero(valor, idioma) {
  return new Intl.NumberFormat(LOCALIDADES[idioma], { maximumFractionDigits: 2 }).format(valor);
}
