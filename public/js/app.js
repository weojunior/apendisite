// Interface da calculadora. Único módulo, com dom.js, que toca o DOM.
import { el, idiomaInicial, seletorDeIdioma } from './dom.js';
import { acoplarRaioX, algumRaioXNaoRealizado, UNIDADES, UNIDADES_INICIAIS, VALORES_VAZIOS, validarFormulario } from './entrada.js';
import { formatarEscore, quadradosCheios } from './formato.js';
import { calcularEscore, carregarModelo, classificar } from './modelo.js';
import { DOI_CONCEITO, DOI_VERSAO, SIMBOLOS_UNIDADE, TEXTOS, mensagemDeErro, preencher, urlDoi } from './textos.js';

const CAMINHO_MODELO = '/modelo/random_forest_v1.0.0.json';
const EMAIL_CONTATO = 'contato@apendisite.com.br';
const QUADRADOS_NO_PICTOGRAMA = 100;

const estado = {
  idioma: 'pt',
  unidades: null,
  valores: { ...VALORES_VAZIOS },
  erros: [],
  resultado: null,
  modelo: null,
  erroModelo: false,
};

function t(chave) {
  return TEXTOS[estado.idioma][chave];
}

function versaoDoModelo() {
  return document.querySelector('meta[name="versao-modelo"]').getAttribute('content');
}

function erroDo(campo) {
  return estado.erros.find((erro) => erro.campo === campo) ?? null;
}

function mensagem(campo) {
  const erro = erroDo(campo);
  return erro ? el('p', { class: 'erro', id: `erro-${campo}` }, mensagemDeErro(erro, estado.idioma)) : null;
}

function campoNumerico(campo, rotulo, { ajuda = null, grandeza = null } = {}) {
  const invalido = erroDo(campo) !== null;
  const seletor = grandeza
    ? el('select', {
        class: 'unidade',
        'aria-label': `${t('unidade')}: ${rotulo}`,
        onchange: (evento) => { estado.unidades[grandeza] = evento.target.value; },
      }, UNIDADES[grandeza].map((unidade) =>
        el('option', { value: unidade, selected: estado.unidades[grandeza] === unidade }, SIMBOLOS_UNIDADE[unidade])))
    : null;
  return el('div', { class: 'campo campo-numero' },
    el('label', { for: `campo-${campo}` }, rotulo),
    ajuda ? el('p', { class: 'ajuda', id: `ajuda-${campo}` }, ajuda) : null,
    el('input', {
      id: `campo-${campo}`,
      name: campo,
      type: 'text',
      inputmode: campo === 'idade' ? 'numeric' : 'decimal',
      autocomplete: 'off',
      value: estado.valores[campo],
      'aria-invalid': invalido ? 'true' : null,
      'aria-describedby': [ajuda ? `ajuda-${campo}` : null, invalido ? `erro-${campo}` : null].filter(Boolean).join(' ') || null,
      oninput: (evento) => { estado.valores[campo] = evento.target.value; },
    }),
    seletor,
    mensagem(campo));
}

function campoEscolha(campo, rotulo, opcoes, aoMudar = null) {
  const invalido = erroDo(campo) !== null;
  return el('fieldset', { class: 'escolha', 'aria-invalid': invalido ? 'true' : null, 'aria-describedby': invalido ? `erro-${campo}` : null },
    el('legend', {}, rotulo),
    el('div', { class: 'opcoes' }, opcoes.map(([valor, texto], i) =>
      el('label', {},
        el('input', {
          type: 'radio',
          name: campo,
          value: valor,
          id: i === 0 ? `campo-${campo}` : null,
          checked: estado.valores[campo] === valor,
          onchange: () => {
            if (aoMudar) aoMudar(valor);
            else estado.valores[campo] = valor;
          },
        }),
        ` ${texto}`))),
    mensagem(campo));
}

function simNao() {
  return [['sim', t('sim')], ['nao', t('nao')]];
}

function mudarRaioX(campo) {
  return (valor) => {
    estado.valores = acoplarRaioX(estado.valores, campo, valor);
    desenhar();
  };
}

function desenharCabecalho() {
  return el('header', { class: 'cabecalho' },
    el('h1', {}, el('img', { class: 'logo', src: '/img/logo.png', alt: t('nome'), width: '1520', height: '299' })),
    el('p', { class: 'frase' }, t('frase')),
    seletorDeIdioma(estado.idioma, t('idioma_aviso'), trocarIdioma));
}

function desenharFormulario() {
  const rx = [['sim', t('sim')], ['nao', t('nao')], ['nao_realizado', t('nao_realizado')]];
  return el('form', { id: 'formulario', novalidate: true, onsubmit: (evento) => { evento.preventDefault(); calcular(); } },
    el('p', {}, t('form_abertura')),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_paciente')),
      campoNumerico('idade', t('idade'), { ajuda: t('idade_ajuda') }),
      campoEscolha('sexo', t('sexo'), [['M', t('sexo_m')], ['F', t('sexo_f')]]),
      campoNumerico('peso', t('peso'))),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_sintomas')),
      campoEscolha('nausea', t('nausea'), simNao()),
      campoEscolha('emese', t('vomito'), simNao()),
      campoEscolha('febre', t('febre'), simNao()),
      campoEscolha('disuria', t('disuria'), simNao())),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_exame')),
      campoEscolha('dor_fid', t('dor_fid'), simNao()),
      campoEscolha('dor_difusa', t('dor_difusa'), simNao())),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_rx')),
      el('p', { class: 'ajuda' }, t('rx_ajuda')),
      campoEscolha('rx_fid', t('rx_fid'), rx, mudarRaioX('rx_fid')),
      campoEscolha('rx_difuso', t('rx_difuso'), rx, mudarRaioX('rx_difuso'))),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_lab')),
      el('p', { class: 'ajuda' }, t('ajuda_numeros')),
      campoNumerico('leucocitos', t('leucocitos'), { grandeza: 'leucocitos' }),
      campoNumerico('neutrofilos', t('neutrofilos'), { grandeza: 'neutrofilos' }),
      campoNumerico('pcr', t('pcr'), { grandeza: 'pcr' }),
      campoNumerico('urina', t('urina'))),
    el('div', { class: 'declaracao' },
      el('label', {},
        el('input', {
          type: 'checkbox',
          id: 'campo-declaracao',
          checked: estado.valores.declaracao,
          'aria-invalid': erroDo('declaracao') ? 'true' : null,
          onchange: (evento) => { estado.valores.declaracao = evento.target.checked; },
        }),
        ` ${t('declaracao')}`),
      mensagem('declaracao')),
    estado.erroModelo ? el('p', { class: 'erro-modelo', role: 'alert' }, t('erro_modelo')) : null,
    el('button', { type: 'submit', class: 'botao-principal', disabled: estado.modelo === null }, t('calcular')));
}

function desenharResultado() {
  const resultado = estado.resultado;
  if (!resultado) return null;
  const { escore, classe, rxNaoRealizado } = resultado;
  const rotulo = (positivo) => t(positivo ? 'positivo' : 'negativo');
  const cheios = quadradosCheios(classe.faixa);
  const quadrados = Array.from({ length: QUADRADOS_NO_PICTOGRAMA }, (_, i) =>
    el('span', { class: i < cheios ? 'quadrado cheio' : 'quadrado' }));
  return el('section', { id: 'resultado', class: `resultado faixa-${classe.faixa}`, tabindex: '-1', 'aria-live': 'polite' },
    el('h2', {}, t('resultado_titulo')),
    el('p', { class: 'escore' }, preencher(t('escore'), { escore: formatarEscore(escore, estado.idioma) })),
    el('p', {}, t('escore_nao_chance')),
    el('p', { class: 'corte' }, preencher(t('corte_alta'), { classe: rotulo(classe.altaSensibilidade) })),
    el('p', { class: 'corte' }, preencher(t('corte_equilibrio'), { classe: rotulo(classe.equilibrio) })),
    el('p', { class: 'faixa' }, t(`faixa_${classe.faixa}`)),
    el('div', { class: 'pictograma', role: 'img', 'aria-label': t('legenda_pictograma') }, quadrados),
    el('p', { class: 'legenda' }, t('legenda_pictograma')),
    rxNaoRealizado ? el('p', { class: 'aviso' }, t('aviso_rx')) : null,
    el('ul', { class: 'linhas' }, t('linhas_visiveis').map((linha) => el('li', {}, linha))));
}

function desenharSobre() {
  const comoCitar = DOI_VERSAO
    ? el('section', {}, el('h3', {}, t('como_citar_titulo')), el('p', {}, preencher(t('como_citar'), { doi: DOI_VERSAO })))
    : null;
  return el('div', { class: 'sobre' },
    el('details', {}, el('summary', {}, t('como_feito_titulo')), t('como_feito').map((p) => el('p', {}, p))),
    el('details', {}, el('summary', {}, t('limitacoes_titulo')), el('ul', {}, t('limitacoes').map((item) => el('li', {}, item)))),
    el('section', { class: 'autoria' },
      el('h2', {}, t('autoria_titulo')),
      el('ul', {}, t('autores').map((autor) => el('li', {}, autor))),
      el('p', {}, t('instituicao')),
      el('p', {}, t('fomento')),
      comoCitar,
      el('p', {}, t('dados_alema')),
      el('h3', {}, t('referencias_titulo')),
      el('ol', { class: 'referencias' }, t('referencias').map((ref) => el('li', {}, ref)))));
}

function desenharRodape() {
  const itens = [
    el('a', { href: `/privacidade/${estado.idioma === 'en' ? '?lang=en' : ''}` }, t('rodape_privacidade')),
    el('a', { href: `mailto:${EMAIL_CONTATO}` }, t('rodape_contato')),
    el('span', {}, preencher(t('rodape_modelo'), { versao: versaoDoModelo() })),
    DOI_CONCEITO ? el('a', { href: urlDoi(DOI_CONCEITO) }, t('rodape_zenodo')) : null,
  ];
  return el('footer', { class: 'rodape' }, el('ul', {}, itens.filter(Boolean).map((item) => el('li', {}, item))));
}

function desenhar() {
  document.documentElement.lang = estado.idioma === 'pt' ? 'pt-BR' : 'en';
  document.getElementById('app').replaceChildren(
    desenharCabecalho(),
    el('main', {}, desenharFormulario(), desenharResultado(), desenharSobre()),
    desenharRodape(),
  );
}

function trocarIdioma(idioma) {
  estado.idioma = idioma;
  desenhar();
}

function focarPrimeiroErro() {
  const primeiro = estado.erros[0];
  document.getElementById(`campo-${primeiro.campo}`)?.focus();
}

function calcular() {
  const { erros, entrada } = validarFormulario(estado.valores, estado.unidades);
  estado.erros = erros;
  if (erros.length > 0) {
    estado.resultado = null;
    desenhar();
    focarPrimeiroErro();
    return;
  }
  const escore = calcularEscore(estado.modelo, entrada);
  estado.resultado = { escore, classe: classificar(escore), rxNaoRealizado: algumRaioXNaoRealizado(estado.valores) };
  desenhar();
  document.getElementById('resultado').focus();
}

async function iniciar() {
  estado.idioma = idiomaInicial();
  estado.unidades = { ...UNIDADES_INICIAIS[estado.idioma] };
  try {
    const resposta = await fetch(CAMINHO_MODELO);
    estado.modelo = carregarModelo(await resposta.json());
  } catch {
    estado.erroModelo = true;
  }
  desenhar();
}

iniciar();
