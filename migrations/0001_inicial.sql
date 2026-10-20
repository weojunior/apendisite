-- Banco do apendisite (spec, seção 9.3). Nenhuma coluna guarda IP ou valor clínico.

CREATE TABLE contagem (
  dia    TEXT NOT NULL,
  evento TEXT NOT NULL CHECK (evento IN ('abriu', 'calculou')),
  idioma TEXT NOT NULL CHECK (idioma IN ('pt', 'en')),
  pais   TEXT NOT NULL,
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, evento, idioma, pais)
);

CREATE TABLE resposta_sus (
  id     INTEGER PRIMARY KEY,
  dia    TEXT NOT NULL,
  idioma TEXT NOT NULL CHECK (idioma IN ('pt', 'en')),
  item1  INTEGER NOT NULL CHECK (item1 BETWEEN 1 AND 5),
  item2  INTEGER NOT NULL CHECK (item2 BETWEEN 1 AND 5),
  item3  INTEGER NOT NULL CHECK (item3 BETWEEN 1 AND 5),
  item4  INTEGER NOT NULL CHECK (item4 BETWEEN 1 AND 5),
  item5  INTEGER NOT NULL CHECK (item5 BETWEEN 1 AND 5),
  item6  INTEGER NOT NULL CHECK (item6 BETWEEN 1 AND 5),
  item7  INTEGER NOT NULL CHECK (item7 BETWEEN 1 AND 5),
  item8  INTEGER NOT NULL CHECK (item8 BETWEEN 1 AND 5),
  item9  INTEGER NOT NULL CHECK (item9 BETWEEN 1 AND 5),
  item10 INTEGER NOT NULL CHECK (item10 BETWEEN 1 AND 5),
  area   TEXT NOT NULL CHECK (area IN ('cir_ped_especialista',
           'cir_ped_residente', 'cir_geral', 'pediatria', 'emergencia',
           'familia_comunidade', 'generalista', 'outra_especialidade',
           'estudante_medicina')),
  pais   TEXT NOT NULL,
  usaria TEXT NOT NULL CHECK (usaria IN ('sim', 'talvez', 'nao'))
);

CREATE TABLE nota_utilidade (
  id     INTEGER PRIMARY KEY,
  dia    TEXT NOT NULL,
  nota   INTEGER CHECK (nota BETWEEN 0 AND 10),
  teste  INTEGER NOT NULL CHECK (teste IN (0, 1)),
  idioma TEXT NOT NULL CHECK (idioma IN ('pt', 'en')),
  pais   TEXT NOT NULL,
  CHECK ((teste = 1 AND nota IS NULL) OR (teste = 0 AND nota IS NOT NULL))
);
