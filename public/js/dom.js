// Auxiliares de DOM e de idioma, comuns à calculadora e à Privacidade.
import { CHAVE_IDIOMA, IDIOMAS, escolherIdioma } from './textos.js';

/** Cria um elemento com atributos, ouvintes (on*) e filhos, sem montar HTML em texto. */
export function el(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nome === 'class') elemento.className = valor;
    else if (nome.startsWith('on')) elemento.addEventListener(nome.slice(2), valor);
    else if (valor === true) elemento.setAttribute(nome, '');
    else elemento.setAttribute(nome, String(valor));
  }
  for (const filho of filhos.flat(Infinity)) {
    if (filho === null || filho === undefined || filho === false) continue;
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return elemento;
}

/** Idioma guardado no aparelho, ou null se não há ou o armazenamento falha. */
export function lerIdiomaGuardado() {
  try {
    return localStorage.getItem(CHAVE_IDIOMA);
  } catch {
    return null;
  }
}

/** Guarda o idioma. Sem armazenamento, o idioma vale só nesta visita. */
export function gravarIdioma(idioma) {
  try {
    localStorage.setItem(CHAVE_IDIOMA, idioma);
  } catch {
    // Navegador sem armazenamento (modo privado ou bloqueio): segue sem gravar.
  }
}

/** Idioma da visita: ?lang, depois o aparelho, depois o navegador. */
export function idiomaInicial() {
  return escolherIdioma({
    parametroUrl: new URLSearchParams(window.location.search).get('lang'),
    guardado: lerIdiomaGuardado(),
    idiomasNavegador: navigator.languages?.length ? navigator.languages : [navigator.language],
  });
}

/** Botões PT e EN com o aviso de que o idioma fica no aparelho. */
export function seletorDeIdioma(idioma, aviso, aoTrocar) {
  const botoes = IDIOMAS.map((codigo) =>
    el('button', {
      type: 'button',
      lang: codigo === 'pt' ? 'pt-BR' : 'en',
      'aria-pressed': codigo === idioma ? 'true' : 'false',
      onclick: () => {
        if (codigo === idioma) return;
        gravarIdioma(codigo);
        aoTrocar(codigo);
      },
    }, codigo.toUpperCase()),
  );
  return el('div', { class: 'idioma' }, botoes[0], ' | ', botoes[1], el('span', { class: 'aviso-idioma' }, aviso));
}

/** O localStorage, ou null se o navegador bloqueia o acesso. */
export function armazenamento() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
