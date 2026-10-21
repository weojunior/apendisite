// Contrato entre a página e o Worker: rotas, chaves dos corpos e valores aceitos.
// O Worker importa este mesmo arquivo para validar (spec, seção 9.2).

export const ROTAS = Object.freeze({
  evento: '/api/evento',
  sus: '/api/sus',
  utilidade: '/api/utilidade',
  saude: '/api/saude',
});
export const LIMITE_CORPO_BYTES = 2048;
export const IDIOMAS_API = Object.freeze(['pt', 'en']);
export const EVENTOS = Object.freeze(['abriu', 'calculou']);
export const AREAS = Object.freeze([
  'cir_ped_especialista', 'cir_ped_residente', 'cir_geral', 'pediatria', 'emergencia',
  'familia_comunidade', 'generalista', 'outra_especialidade', 'estudante_medicina',
]);
export const USARIA = Object.freeze(['sim', 'talvez', 'nao']);
export const N_ITENS_SUS = 10;
export const NOTA_TESTE = 'teste';
export const TAMANHO_MAXIMO_ISCA = 200;
export const CHAVES = Object.freeze({
  evento: Object.freeze(['evento', 'idioma']),
  sus: Object.freeze(['idioma', 'itens', 'area', 'pais', 'usaria', 'site']),
  utilidade: Object.freeze(['idioma', 'nota']),
});

// ISO 3166-1 alfa-2, de /usr/share/zoneinfo/iso3166.tab (macOS, 19/10/2026).
export const PAISES = Object.freeze(
  ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ '
  + 'BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM '
  + 'DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS '
  + 'GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN '
  + 'KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ '
  + 'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM '
  + 'PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV '
  + 'SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI '
  + 'VN VU WF WS YE YT ZA ZM ZW').split(' '),
);
