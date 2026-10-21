// Página Privacidade: mostra só o idioma escolhido. Sem JavaScript, os dois aparecem.
import { idiomaInicial, seletorDeIdioma } from './dom.js';
import { TEXTOS } from './textos.js';

function mostrar(idioma) {
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
  for (const secao of document.querySelectorAll('section[data-idioma]')) {
    secao.hidden = secao.dataset.idioma !== idioma;
  }
  document.getElementById('idioma').replaceChildren(seletorDeIdioma(idioma, TEXTOS[idioma].idioma_aviso, mostrar));
}

mostrar(idiomaInicial());
