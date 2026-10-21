// Interface da calculadora. Único módulo, com dom.js, que toca o DOM.
import { ROTAS } from './contrato_api.js';
import { armazenamento, el, idiomaInicial, seletorDeIdioma } from './dom.js';
import { acoplarRaioX, algumRaioXNaoRealizado, progressoDoFormulario, UNIDADES, UNIDADES_INICIAIS, VALORES_VAZIOS, validarFormulario } from './entrada.js';
import { calcularAlvarado, calcularPas, dadosDosEscores } from './escores.js';
import { formatarEscore, quadradosCheios } from './formato.js';
import { calcularEscore, carregarModelo, classificar } from './modelo.js';
import { enviarSemFalha, montarCorpoEvento, montarCorpoSus, montarCorpoUtilidade } from './servidor.js';
import { DOI_CONCEITO, DOI_VERSAO, SIMBOLOS_UNIDADE, TEXTOS, listaDePaises, mensagemDeErro, preencher, urlDoi } from './textos.js';
import { faltandoNoSus, lerRespondido, marcarRespondido, novaVisita, oQueMostrarAbaixoDoResultado, registrarResultado } from './visita.js';

const CAMINHO_MODELO = '/modelo/random_forest_v1.0.0.json';
const EMAIL_CONTATO = 'contato@apendisite.com.br';
const QUADRADOS_NO_PICTOGRAMA = 100;
// Chave do questionário (Q16a). Desligada, somem convite, link do rodapé e utilidade.
// O contador continua. Decisão em 22/10 às 18:00.
const QUESTIONARIO_ATIVO = true;
const NOTAS_DE_UTILIDADE = Array.from({ length: 11 }, (_, i) => i);
const VALORES_SUS = ['1', '2', '3', '4', '5'];

function questionarioVazio() {
  return { aberto: false, etapa: 'participacao', elegivel: false, respostas: { itens: Array(10).fill(''), area: '', pais: '', usaria: '' }, faltando: [], falhou: false, enviando: false };
}

const estado = {
  idioma: 'pt',
  unidades: null,
  valores: { ...VALORES_VAZIOS },
  erros: [],
  resultado: null,
  modelo: null,
  erroModelo: false,
  escoresAbertos: false,
  visita: novaVisita(),
  respondido: false,
  questionario: questionarioVazio(),
  enviado: false,
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

function atualizarProgresso() {
  const barra = document.getElementById('barra-acao');
  if (!barra) return;
  const { preenchidos, total } = progressoDoFormulario(estado.valores);
  barra.style.setProperty('--progresso', String(preenchidos / total));
}

function aoMudarValor() {
  atualizarEscores();
  atualizarProgresso();
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
        onchange: (evento) => { estado.unidades[grandeza] = evento.target.value; aoMudarValor(); },
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
      oninput: (evento) => { estado.valores[campo] = evento.target.value; aoMudarValor(); },
    }),
    seletor,
    mensagem(campo));
}

/** Duas respostas viram botões de meia largura. Sim e Não ficam na linha da pergunta, até no celular. */
function classeDaEscolha(opcoes) {
  if (opcoes.length !== 2) return 'escolha';
  return opcoes[0][0] === 'sim' ? 'escolha escolha-curta escolha-sn' : 'escolha escolha-curta';
}

function campoEscolha(campo, rotulo, opcoes, aoMudar = null) {
  const invalido = erroDo(campo) !== null;
  return el('fieldset', { class: classeDaEscolha(opcoes), 'aria-invalid': invalido ? 'true' : null, 'aria-describedby': invalido ? `erro-${campo}` : null },
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
            else {
              estado.valores[campo] = valor;
              aoMudarValor();
            }
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
    // Atualiza as marcas no lugar: refazer a página tirava o foco de quem usa o teclado.
    for (const nome of ['rx_fid', 'rx_difuso']) {
      for (const opcao of document.querySelectorAll(`input[name="${nome}"]`)) {
        opcao.checked = opcao.value === estado.valores[nome];
      }
    }
    aoMudarValor();
  };
}

function desenharCabecalho() {
  return el('header', { class: 'cabecalho' },
    el('h1', {}, el('img', { class: 'logo', src: '/img/logo.png', alt: t('nome'), width: '1520', height: '299' })),
    el('p', { class: 'frase' }, t('frase')),
    seletorDeIdioma(estado.idioma, t('idioma_aviso'), trocarIdioma));
}

function blocoDoEscore(chaveNome, resultado, chaveCategorias, notas) {
  return el('div', { class: 'bloco-escore' },
    el('h3', {}, t(chaveNome)),
    el('ul', {}, resultado.itens.map((item) => {
      let situacao = 'pendente';
      if (item.presente === true) situacao = 'presente';
      if (item.presente === false) situacao = 'ausente';
      const leitura = item.presente === null ? '' : ` ${t(item.presente ? 'sim' : 'nao')}`;
      return el('li', { class: `item-escore ${situacao}` },
        `${t(item.chave)} (${item.pontos})`,
        el('span', { class: 'visualmente-oculto' }, leitura));
    })),
    resultado.total === null ? null : el('p', { class: 'total-escore' }, textoDoTotal(chaveNome, resultado, chaveCategorias)),
    notas.map((nota) => el('p', { class: 'nota' }, t(nota))));
}

function textoDoTotal(chaveNome, resultado, chaveCategorias) {
  return preencher(t('total_escore'), {
    nome: t(chaveNome),
    total: resultado.total,
    categoria: t(chaveCategorias)[resultado.categoria],
  });
}

function conteudoDosEscores() {
  const dados = dadosDosEscores(estado.valores, estado.unidades);
  return [
    blocoDoEscore('alvarado_nome', calcularAlvarado(dados), 'alvarado_categorias', ['alvarado_origem']),
    blocoDoEscore('pas_nome', calcularPas(dados), 'pas_categorias', ['pas_nota', 'pas_origem']),
  ];
}

function atualizarEscores() {
  document.getElementById('escores-itens')?.replaceChildren(...conteudoDosEscores());
}

function desenharEscores() {
  return el('details', {
    class: 'escores',
    open: estado.escoresAbertos,
    ontoggle: (evento) => { estado.escoresAbertos = evento.target.open; },
  },
    el('summary', {}, t('escores_titulo')),
    el('p', {}, t('escores_abertura')),
    campoEscolha('migracao', t('item_migracao'), simNao()),
    campoEscolha('anorexia', t('item_anorexia'), simNao()),
    campoEscolha('acetona', t('item_acetona'), simNao()),
    campoEscolha('descompressao', t('item_descompressao'), simNao()),
    campoEscolha('dor_tosse', t('item_dor_tosse'), simNao()),
    campoNumerico('temperatura', t('temperatura_campo'), { ajuda: t('temperatura_nota'), grandeza: 'temperatura' }),
    el('div', { id: 'escores-itens' }, conteudoDosEscores()));
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
    desenharEscores(),
    el('div', { class: 'declaracao' },
      el('label', {},
        el('input', {
          type: 'checkbox',
          id: 'campo-declaracao',
          checked: estado.valores.declaracao,
          'aria-invalid': erroDo('declaracao') ? 'true' : null,
          onchange: (evento) => { estado.valores.declaracao = evento.target.checked; atualizarProgresso(); },
        }),
        ` ${t('declaracao')}`),
      mensagem('declaracao')),
    estado.erroModelo ? el('p', { class: 'erro-modelo', role: 'alert' }, t('erro_modelo')) : null,
    el('div', { id: 'barra-acao', class: 'barra-acao' },
      el('div', { class: 'progresso', 'aria-hidden': 'true' }, el('span', { class: 'progresso-cheio' })),
      el('button', { type: 'submit', class: 'botao-principal', disabled: estado.modelo === null }, t('calcular'))));
}

function desenharResultado() {
  const resultado = estado.resultado;
  if (!resultado) return null;
  const { escore, classe, rxNaoRealizado } = resultado;
  const rotulo = (positivo) => t(positivo ? 'positivo' : 'negativo');
  const cheios = quadradosCheios(classe.faixa);
  const quadrados = Array.from({ length: QUADRADOS_NO_PICTOGRAMA }, (_, i) =>
    el('span', { class: i < cheios ? 'quadrado cheio' : 'quadrado' }));
  const classeNova = resultado.novo ? ' resultado-novo' : '';
  resultado.novo = false;
  return el('section', { id: 'resultado', class: `resultado faixa-${classe.faixa}${classeNova}`, tabindex: '-1', 'aria-live': 'polite' },
    el('h2', {}, t('resultado_titulo')),
    el('p', { class: 'escore' }, preencher(t('escore'), { escore: formatarEscore(escore, estado.idioma) })),
    el('p', {}, t('escore_nao_chance')),
    el('div', { class: 'bloco-faixa' },
      el('p', { class: 'faixa' }, t(`faixa_${classe.faixa}`)),
      el('div', { class: 'pictograma', role: 'img', 'aria-label': t('legenda_pictograma') }, quadrados),
      el('p', { class: 'legenda' }, t('legenda_pictograma'))),
    el('p', { class: 'corte' }, preencher(t('corte_alta'), { classe: rotulo(classe.altaSensibilidade) })),
    el('p', { class: 'corte' }, preencher(t('corte_equilibrio'), { classe: rotulo(classe.equilibrio) })),
    resultado.escores.alvarado.total === null ? null
      : el('p', { class: 'total-escore' }, textoDoTotal('alvarado_nome', resultado.escores.alvarado, 'alvarado_categorias')),
    resultado.escores.pas.total === null ? null
      : el('p', { class: 'total-escore' }, textoDoTotal('pas_nome', resultado.escores.pas, 'pas_categorias')),
    rxNaoRealizado ? el('p', { class: 'aviso' }, t('aviso_rx')) : null,
    el('ul', { class: 'linhas' }, t('linhas_visiveis').map((linha) => el('li', {}, linha))),
    desenharAbaixoDoResultado());
}

function desenharAbaixoDoResultado() {
  const mostrar = oQueMostrarAbaixoDoResultado(estado.visita, { respondido: estado.respondido, ativo: QUESTIONARIO_ATIVO });
  if (mostrar === 'convite') {
    return el('div', { class: 'convite' },
      el('p', {}, t('convite')),
      el('button', { type: 'button', class: 'botao-principal', onclick: abrirQuestionario }, t('convite_responder')),
      el('button', { type: 'button', class: 'botao-secundario', onclick: () => { estado.visita = { ...estado.visita, conviteDispensado: true }; desenhar(); } }, t('convite_agora_nao')));
  }
  if (mostrar === 'utilidade') {
    return el('div', { class: 'utilidade' },
      el('p', {}, t('utilidade_pergunta')),
      el('div', { class: 'escala' },
        el('span', { class: 'ancora' }, t('utilidade_0')),
        NOTAS_DE_UTILIDADE.map((nota) => el('button', { type: 'button', onclick: () => enviarUtilidade(nota) }, String(nota))),
        el('span', { class: 'ancora' }, t('utilidade_10'))),
      el('button', { type: 'button', class: 'botao-secundario', onclick: () => enviarUtilidade('teste') }, t('utilidade_teste')),
      el('button', { type: 'button', class: 'botao-secundario', onclick: () => { estado.visita = { ...estado.visita, utilidade: 'pulada' }; desenhar(); } }, t('utilidade_pular')));
  }
  if (mostrar === 'obrigado') return el('p', { class: 'utilidade', role: 'status' }, t('utilidade_obrigado'));
  return null;
}

function enviarUtilidade(nota) {
  enviarSemFalha(ROTAS.utilidade, montarCorpoUtilidade(estado.idioma, nota));
  estado.visita = { ...estado.visita, utilidade: 'obrigado' };
  desenhar();
}

function abrirQuestionario() {
  estado.questionario = { ...questionarioVazio(), aberto: true };
  desenharQuestionario();
  document.getElementById('questionario').showModal();
}

function fecharQuestionario() {
  estado.questionario = questionarioVazio();
  document.getElementById('questionario').close();
}

function conteudoParticipacao() {
  const q = estado.questionario;
  return [
    el('h2', {}, t('participacao_titulo')),
    t('participacao_paragrafos').map((p) => el('p', {}, p)),
    el('label', {},
      el('input', { type: 'checkbox', id: 'campo-elegivel', checked: q.elegivel, onchange: (e) => { q.elegivel = e.target.checked; } }),
      ` ${t('participacao_caixa')}`),
    q.faltando.includes('elegivel') ? el('p', { class: 'erro' }, t('erro_vazio')) : null,
    el('button', { type: 'button', class: 'botao-principal', onclick: () => {
      if (!q.elegivel) { q.faltando = ['elegivel']; desenharQuestionario(); return; }
      q.etapa = 'perguntas';
      q.faltando = [];
      desenharQuestionario();
    } }, t('comecar')),
    el('button', { type: 'button', class: 'botao-secundario', onclick: fecharQuestionario }, t('cancelar')),
  ];
}

function perguntaSus(indice) {
  const q = estado.questionario;
  const nome = `item${indice + 1}`;
  return el('fieldset', { class: 'escolha' },
    el('legend', {}, `${indice + 1}. ${t('sus_itens')[indice]}`),
    el('div', { class: 'opcoes escala' },
      el('span', { class: 'ancora' }, t('sus_ancora_1')),
      VALORES_SUS.map((valor) => el('label', {},
        el('input', { type: 'radio', name: nome, value: valor, checked: q.respostas.itens[indice] === valor, onchange: () => { q.respostas.itens[indice] = valor; } }),
        ` ${valor}`)),
      el('span', { class: 'ancora' }, t('sus_ancora_5'))),
    q.faltando.includes(nome) ? el('p', { class: 'erro' }, t('erro_vazio')) : null);
}

function conteudoPerguntas() {
  const q = estado.questionario;
  const r = q.respostas;
  const seletor = (campo, rotulo, opcoes) => el('div', { class: 'campo' },
    el('label', { for: `campo-${campo}` }, rotulo),
    el('select', { id: `campo-${campo}`, onchange: (e) => { r[campo] = e.target.value; } },
      el('option', { value: '' }, t('pais_selecione')),
      opcoes.map(([valor, texto]) => el('option', { value: valor, selected: r[campo] === valor }, texto))),
    q.faltando.includes(campo) ? el('p', { class: 'erro' }, t('erro_vazio')) : null);
  return [
    el('h2', {}, t('participacao_titulo')),
    el('p', {}, t('sus_instrucao')),
    t('sus_itens').map((_, i) => perguntaSus(i)),
    el('p', { class: 'nota' }, t('sus_fonte')),
    seletor('area', t('area_pergunta'), Object.entries(t('areas'))),
    seletor('pais', t('pais_pergunta'), listaDePaises(estado.idioma)),
    el('fieldset', { class: 'escolha' },
      el('legend', {}, t('usaria_pergunta')),
      el('div', { class: 'opcoes' }, Object.entries(t('usaria')).map(([valor, texto]) => el('label', {},
        el('input', { type: 'radio', name: 'usaria', value: valor, checked: r.usaria === valor, onchange: () => { r.usaria = valor; } }),
        ` ${texto}`))),
      q.faltando.includes('usaria') ? el('p', { class: 'erro' }, t('erro_vazio')) : null),
    el('div', { class: 'isca', 'aria-hidden': 'true' },
      el('input', { type: 'text', id: 'campo-site', name: 'site', tabindex: '-1', autocomplete: 'off' })),
    q.falhou ? el('p', { class: 'erro', role: 'alert' }, t('erro_envio')) : null,
    el('button', { type: 'button', class: 'botao-principal', disabled: q.enviando, onclick: enviarSus }, t('enviar')),
    el('button', { type: 'button', class: 'botao-secundario', onclick: fecharQuestionario }, t('cancelar')),
  ];
}

async function enviarSus() {
  const q = estado.questionario;
  q.faltando = faltandoNoSus(q.respostas);
  if (q.faltando.length > 0) {
    desenharQuestionario();
    return;
  }
  q.enviando = true;
  q.falhou = false;
  desenharQuestionario();
  const corpo = montarCorpoSus({
    idioma: estado.idioma,
    itens: q.respostas.itens.map(Number),
    area: q.respostas.area,
    pais: q.respostas.pais,
    usaria: q.respostas.usaria,
    site: document.getElementById('campo-site').value,
  });
  const ok = await enviarSemFalha(ROTAS.sus, corpo);
  q.enviando = false;
  if (!ok) {
    q.falhou = true;
    desenharQuestionario();
    return;
  }
  marcarRespondido(armazenamento());
  estado.visita = { ...estado.visita, conviteDispensado: true };
  estado.enviado = true;
  fecharQuestionario();
  desenhar();
}

function desenharQuestionario() {
  const dialogo = document.getElementById('questionario');
  const etapa = estado.questionario.etapa;
  dialogo.replaceChildren(...(etapa === 'participacao' ? conteudoParticipacao() : conteudoPerguntas()).flat(Infinity).filter(Boolean));
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
      el('h3', {}, t('referencias_titulo')),
      el('ol', { class: 'referencias' }, t('referencias').map((ref) => el('li', {}, ref)))));
}

function desenharRodape() {
  const itens = [
    el('a', { href: `/privacidade/${estado.idioma === 'en' ? '?lang=en' : ''}` }, t('rodape_privacidade')),
    QUESTIONARIO_ATIVO ? el('button', { type: 'button', class: 'link', onclick: abrirQuestionario }, t('rodape_avaliar')) : null,
    el('a', { href: `mailto:${EMAIL_CONTATO}` }, t('rodape_contato')),
    el('span', {}, preencher(t('rodape_modelo'), { versao: versaoDoModelo() })),
    DOI_CONCEITO ? el('a', { href: urlDoi(DOI_CONCEITO) }, t('rodape_zenodo')) : null,
  ];
  return el('footer', { class: 'rodape' }, el('ul', {}, itens.filter(Boolean).map((item) => el('li', {}, item))));
}

function desenhar() {
  document.documentElement.lang = estado.idioma === 'pt' ? 'pt-BR' : 'en';
  const partes = [
    desenharCabecalho(),
    el('main', {}, desenharFormulario(), desenharResultado(), desenharSobre()),
    estado.enviado ? el('p', { class: 'convite', role: 'status' }, t('enviado')) : null,
    desenharRodape(),
    el('dialog', { id: 'questionario', class: 'questionario', onclose: () => { estado.questionario = questionarioVazio(); } }),
  ];
  document.getElementById('app').replaceChildren(...partes.filter(Boolean));
  atualizarProgresso();
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
  estado.resultado = {
    escore,
    classe: classificar(escore),
    rxNaoRealizado: algumRaioXNaoRealizado(estado.valores),
    novo: true,
    escores: (() => {
      const dados = dadosDosEscores(estado.valores, estado.unidades);
      return { alvarado: calcularAlvarado(dados), pas: calcularPas(dados) };
    })(),
  };
  estado.visita = registrarResultado(estado.visita);
  enviarSemFalha(ROTAS.evento, montarCorpoEvento('calculou', estado.idioma));
  desenhar();
  const bloco = document.getElementById('resultado');
  bloco.focus({ preventScroll: true });
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bloco.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' });
}

/** Baixa o modelo em segundo plano e libera o botão Calcular quando ele chega. */
async function carregarModeloEmSegundoPlano() {
  try {
    const resposta = await fetch(CAMINHO_MODELO);
    estado.modelo = carregarModelo(await resposta.json());
    const botao = document.querySelector('#formulario .botao-principal');
    if (botao) botao.disabled = false;
  } catch {
    estado.erroModelo = true;
    desenhar();
  }
}

async function iniciar() {
  estado.idioma = idiomaInicial();
  estado.unidades = { ...UNIDADES_INICIAIS[estado.idioma] };
  estado.respondido = lerRespondido(armazenamento());
  desenhar();
  enviarSemFalha(ROTAS.evento, montarCorpoEvento('abriu', estado.idioma));
  await carregarModeloEmSegundoPlano();
}

iniciar();
