// Leitura dos campos, unidades, faixas e montagem das 19 entradas.
// Funções puras, sem DOM. Faixas aprovadas na Q3.28 (spec, seção 5.4).

export const UNIDADES = Object.freeze({
  leucocitos: Object.freeze(['mm3', 'mil_ul']),
  neutrofilos: Object.freeze(['mm3', 'mil_ul', 'pct']),
  pcr: Object.freeze(['mgdl', 'mgl']),
  temperatura: Object.freeze(['c', 'f']),
});

export const UNIDADES_INICIAIS = Object.freeze({
  pt: Object.freeze({ leucocitos: 'mm3', neutrofilos: 'mm3', pcr: 'mgdl', temperatura: 'c' }),
  en: Object.freeze({ leucocitos: 'mil_ul', neutrofilos: 'mil_ul', pcr: 'mgl', temperatura: 'c' }),
});

export const FAIXAS = Object.freeze({
  idade: Object.freeze({ anos: [2, 14] }),
  peso: Object.freeze({ kg: [8, 120] }),
  leucocitos: Object.freeze({ mm3: [500, 60000], mil_ul: [0.5, 60] }),
  neutrofilos: Object.freeze({ mm3: [0, 50000], mil_ul: [0, 50], pct: [0, 100] }),
  pcr: Object.freeze({ mgdl: [0, 60], mgl: [0, 600] }),
  urina: Object.freeze({ campo: [0, 500] }),
  temperatura: Object.freeze({ c: [34, 43], f: [93.2, 109.4] }),
});

export const LIMITE_LEUCOCITOSE = 10000;
export const LIMITE_NEUTROFILIA = 7500;
export const LIMITE_PCR = 5.0;
export const LIMITE_LEUCOCITURIA = 10;

export const ORDEM_CAMPOS = Object.freeze([
  'idade', 'sexo', 'peso', 'nausea', 'emese', 'febre', 'disuria', 'dor_fid', 'dor_difusa',
  'rx_fid', 'rx_difuso', 'leucocitos', 'neutrofilos', 'pcr', 'urina',
  'migracao', 'anorexia', 'acetona', 'descompressao', 'dor_tosse', 'temperatura', 'declaracao',
]);

export const VALORES_VAZIOS = Object.freeze({
  idade: '', sexo: '', peso: '',
  nausea: '', emese: '', febre: '', disuria: '', dor_fid: '', dor_difusa: '',
  rx_fid: '', rx_difuso: '',
  leucocitos: '', neutrofilos: '', pcr: '', urina: '',
  migracao: '', anorexia: '', acetona: '', descompressao: '', dor_tosse: '', temperatura: '',
  declaracao: false,
});

const PADRAO_DECIMAL = /^\d+(?:[.,]\d+)?$/;
const PADRAO_INTEIRO = /^\d+$/;
const SIM_NAO = Object.freeze({ sim: 1, nao: 0 });
const RAIO_X = Object.freeze({ sim: 1, nao: 0, nao_realizado: null });
const BINARIAS = Object.freeze([
  ['nausea', 'nausea'], ['emese', 'emese'], ['febre', 'febre'], ['disuria', 'disuria'],
  ['dor_fid', 'ped_dor_fid'], ['dor_difusa', 'ped_dor_difusa'],
]);

function vazio(texto) {
  return String(texto ?? '').trim() === '';
}

/** Lê número com no máximo um separador decimal, vírgula ou ponto. */
export function lerNumero(texto) {
  const limpo = String(texto ?? '').trim();
  return PADRAO_DECIMAL.test(limpo) ? Number(limpo.replace(',', '.')) : null;
}

/** Lê só inteiro sem sinal. */
export function lerInteiro(texto) {
  const limpo = String(texto ?? '').trim();
  return PADRAO_INTEIRO.test(limpo) ? Number(limpo) : null;
}

/** Arredonda a n casas sem o resíduo da multiplicação em ponto flutuante. */
export function arredondar(valor, casas) {
  const fator = 10 ** casas;
  return Math.round(Number((valor * fator).toPrecision(12))) / fator;
}

/** Leucócitos ou neutrófilos absolutos em /mm³, inteiros. */
export function paraMm3(valor, unidade) {
  return arredondar(unidade === 'mil_ul' ? valor * 1000 : valor, 0);
}

/** Neutrófilos em /mm³, a partir de /mm³, ×10³/µL ou percentual dos leucócitos. */
export function neutrofilosParaMm3(valor, unidade, leucocitosMm3) {
  if (unidade === 'pct') return arredondar((valor * leucocitosMm3) / 100, 0);
  return paraMm3(valor, unidade);
}

/** PCR em mg/dL com duas casas. */
export function pcrParaMgdl(valor, unidade) {
  return arredondar(unidade === 'mgl' ? valor / 10 : valor, 2);
}

/** Temperatura em °C. °F é convertido e arredondado a uma casa (S5). */
export function temperaturaParaC(valor, unidade) {
  return unidade === 'f' ? arredondar(((valor - 32) * 5) / 9, 1) : valor;
}

export function dentroDaFaixa(valor, [minimo, maximo]) {
  return valor >= minimo && valor <= maximo;
}

function lerCampoNumerico(campo, texto, faixa, unidade, erros) {
  if (vazio(texto)) {
    erros.push({ campo, codigo: 'vazio' });
    return null;
  }
  const valor = lerNumero(texto);
  if (valor === null || !dentroDaFaixa(valor, faixa)) {
    erros.push({ campo, codigo: 'faixa', faixa, unidade });
    return null;
  }
  return valor;
}

function lerEscolha(campo, valor, opcoes, erros) {
  if (!Object.hasOwn(opcoes, valor ?? '')) {
    erros.push({ campo, codigo: 'vazio' });
    return undefined;
  }
  return opcoes[valor];
}

function lerIdade(texto, erros) {
  if (vazio(texto)) {
    erros.push({ campo: 'idade', codigo: 'vazio' });
    return null;
  }
  const idade = lerInteiro(texto);
  if (idade === null) {
    erros.push({ campo: 'idade', codigo: 'faixa', faixa: FAIXAS.idade.anos, unidade: 'anos' });
    return null;
  }
  if (!dentroDaFaixa(idade, FAIXAS.idade.anos)) {
    erros.push({ campo: 'idade', codigo: 'idade' });
    return null;
  }
  return idade;
}

function ordenar(erros) {
  return [...erros].sort((a, b) => ORDEM_CAMPOS.indexOf(a.campo) - ORDEM_CAMPOS.indexOf(b.campo));
}

/** Valida o formulário inteiro e monta as 19 entradas do modelo. */
export function validarFormulario(valores, unidades) {
  const erros = [];
  const idade = lerIdade(valores.idade, erros);
  const sexo = ['M', 'F'].includes(valores.sexo) ? valores.sexo : null;
  if (sexo === null) erros.push({ campo: 'sexo', codigo: 'vazio' });
  const peso = lerCampoNumerico('peso', valores.peso, FAIXAS.peso.kg, 'kg', erros);
  const binarias = {};
  for (const [campo, nome] of BINARIAS) binarias[nome] = lerEscolha(campo, valores[campo], SIM_NAO, erros);
  const rxFid = lerEscolha('rx_fid', valores.rx_fid, RAIO_X, erros);
  const rxDifuso = lerEscolha('rx_difuso', valores.rx_difuso, RAIO_X, erros);

  const uLeuco = unidades.leucocitos;
  const leucoDigitado = lerCampoNumerico('leucocitos', valores.leucocitos, FAIXAS.leucocitos[uLeuco], uLeuco, erros);
  const leucocitosMm3 = leucoDigitado === null ? null : paraMm3(leucoDigitado, uLeuco);

  const uNeutro = unidades.neutrofilos;
  const neutroDigitado = lerCampoNumerico('neutrofilos', valores.neutrofilos, FAIXAS.neutrofilos[uNeutro], uNeutro, erros);
  let neutrofilosMm3 = null;
  if (neutroDigitado !== null && (uNeutro !== 'pct' || leucocitosMm3 !== null)) {
    neutrofilosMm3 = neutrofilosParaMm3(neutroDigitado, uNeutro, leucocitosMm3);
    if (leucocitosMm3 !== null && neutrofilosMm3 > leucocitosMm3) {
      erros.push({ campo: 'neutrofilos', codigo: 'neutrofilos_acima' });
      neutrofilosMm3 = null;
    }
  }

  const uPcr = unidades.pcr;
  const pcrDigitada = lerCampoNumerico('pcr', valores.pcr, FAIXAS.pcr[uPcr], uPcr, erros);
  const pcrMgdl = pcrDigitada === null ? null : pcrParaMgdl(pcrDigitada, uPcr);
  const urina = lerCampoNumerico('urina', valores.urina, FAIXAS.urina.campo, 'campo', erros);

  if (valores.declaracao !== true) erros.push({ campo: 'declaracao', codigo: 'declaracao' });
  if (erros.length > 0) return { erros: ordenar(erros), entrada: null, convertidos: null };

  const convertidos = {
    leucocitosMm3,
    neutrofilosMm3,
    neutrofilosPct: uNeutro === 'pct' ? neutroDigitado : (100 * neutrofilosMm3) / leucocitosMm3,
    pcrMgdl,
  };
  const entrada = {
    idade_anos: idade,
    leucocitos: leucocitosMm3,
    neutrofilos: neutrofilosMm3,
    pcr: pcrMgdl,
    leucocitos_urina: urina,
    peso,
    ...binarias,
    ped_rx_nivel_fid: rxFid,
    ped_rx_nivel_difuso: rxDifuso,
    leucocitose: leucocitosMm3 > LIMITE_LEUCOCITOSE ? 1 : 0,
    neutrofilia: neutrofilosMm3 > LIMITE_NEUTROFILIA ? 1 : 0,
    pcr_alterado: pcrMgdl > LIMITE_PCR ? 1 : 0,
    leucocituria: urina > LIMITE_LEUCOCITURIA ? 1 : 0,
    sexo,
  };
  return { erros: [], entrada, convertidos };
}

/** "Não realizado" num campo do raio X puxa o outro. Sim ou Não limpa o do outro (S3). */
export function acoplarRaioX(valores, campo, valor) {
  const outro = campo === 'rx_fid' ? 'rx_difuso' : 'rx_fid';
  const novos = { ...valores, [campo]: valor };
  if (valor === 'nao_realizado') novos[outro] = 'nao_realizado';
  else if (valores[outro] === 'nao_realizado') novos[outro] = '';
  return novos;
}

export function algumRaioXNaoRealizado(valores) {
  return valores.rx_fid === 'nao_realizado' || valores.rx_difuso === 'nao_realizado';
}
