"""Gera os casos sintéticos da paridade publicada (spec, seção 11)."""

import json
from pathlib import Path

import numpy as np

from apendisite_conversao.exportar import VERSAO_MODELO
from apendisite_conversao.quadro import ENTRADAS, montar_quadro

SEMENTE = 20261023
N_SORTEADOS = 1000
N_LIMIARES_POR_VARIAVEL = 33
N_POR_PAR_DE_LIMITE = 10
N_FALTANTES = 200
CORTE_EQUILIBRIO = 0.503
CORTE_ALTA_SENSIBILIDADE = 0.358
CONTINUAS = [
    "idade_anos", "leucocitos", "neutrofilos", "pcr", "leucocitos_urina", "peso",
]
BINARIAS_FORMULARIO = [
    "nausea", "emese", "febre", "disuria", "ped_dor_fid", "ped_dor_difusa",
]
RAIO_X = ["ped_rx_nivel_fid", "ped_rx_nivel_difuso"]
DERIVADAS = {
    "leucocitos": ("leucocitose", 10000.0),
    "neutrofilos": ("neutrofilia", 7500.0),
    "pcr": ("pcr_alterado", 5.0),
    "leucocitos_urina": ("leucocituria", 10.0),
}
PARES_DE_LIMITE = [
    ("leucocitos", 10000.0), ("leucocitos", 10001.0),
    ("leucocitos", 500.0), ("leucocitos", 60000.0),
    ("neutrofilos", 7500.0), ("neutrofilos", 7501.0),
    ("neutrofilos", 0.0), ("neutrofilos", 50000.0),
    ("pcr", 5.0), ("pcr", 5.01), ("pcr", 0.0), ("pcr", 60.0),
    ("leucocitos_urina", 10.0), ("leucocitos_urina", 10.1),
    ("leucocitos_urina", 0.0), ("leucocitos_urina", 500.0),
    ("idade_anos", 2.0), ("idade_anos", 14.0), ("peso", 8.0), ("peso", 120.0),
]
FALTANTES_POSSIVEIS = CONTINUAS + BINARIAS_FORMULARIO
GERADOR = "run.py sinteticos"


def _derivar(caso: dict) -> dict:
    """Recalcula as quatro derivadas com > estrito. Origem faltante vira None."""
    for origem, (derivada, limite) in DERIVADAS.items():
        valor = caso[origem]
        caso[derivada] = None if valor is None else float(valor > limite)
    return caso


def _log_uniforme(rng: np.random.Generator, minimo: float, maximo: float) -> float:
    return float(10 ** rng.uniform(np.log10(minimo), np.log10(maximo)))


def _sortear_caso(rng: np.random.Generator) -> dict:
    leucocitos = float(round(_log_uniforme(rng, 500, 60000)))
    caso = {
        "idade_anos": float(rng.integers(2, 15)),
        "leucocitos": leucocitos,
        "neutrofilos": float(round(leucocitos * rng.uniform(0.05, 0.95))),
        "pcr": round(_log_uniforme(rng, 0.01, 60), 2),
        "leucocitos_urina": round(_log_uniforme(rng, 0.1, 500), 1),
        "peso": round(float(rng.uniform(8, 120)), 1),
        "sexo": str(rng.choice(["M", "F"])),
    }
    for nome in BINARIAS_FORMULARIO:
        caso[nome] = float(rng.integers(0, 2))
    for nome in RAIO_X:
        caso[nome] = [0.0, 1.0, None][int(rng.integers(0, 3))]
    return _derivar(caso)


def _limiares_por_variavel(modelo_json: dict) -> dict[str, list[float]]:
    """Reúne os limiares distintos usados em cada variável contínua."""
    indices = {
        modelo_json["saidas"].index(f"num__{nome}"): nome for nome in CONTINUAS
    }
    limiares: dict[str, set[float]] = {nome: set() for nome in CONTINUAS}
    for arvore in modelo_json["arvores"]:
        for variavel, limiar in zip(arvore["variavel"], arvore["limiar"]):
            if variavel in indices:
                limiares[indices[variavel]].add(limiar)
    return {nome: sorted(valores) for nome, valores in limiares.items()}


def _vizinhos_float32(limiar: float) -> list[float]:
    """Devolve o float32 logo abaixo ou igual, o float32 logo acima e o double
    logo acima do limiar. O terceiro só fica do lado certo com Math.fround."""
    abaixo = np.float32(limiar)
    if float(abaixo) > limiar:
        abaixo = np.nextafter(abaixo, np.float32(-np.inf))
    acima = np.nextafter(abaixo, np.float32(np.inf))
    double_acima = float(np.nextafter(limiar, np.inf))
    return [float(abaixo), float(acima), double_acima]


def _casos_nos_limiares(rng: np.random.Generator, modelo_json: dict) -> list[dict]:
    casos = []
    for nome, limiares in _limiares_por_variavel(modelo_json).items():
        quantos = min(N_LIMIARES_POR_VARIAVEL, len(limiares))
        escolhidos = sorted(rng.choice(limiares, size=quantos, replace=False).tolist())
        for limiar in escolhidos:
            for valor in _vizinhos_float32(limiar):
                caso = _sortear_caso(rng)
                caso[nome] = valor
                casos.append(_derivar(caso))
    return casos


def _casos_nos_limites(rng: np.random.Generator) -> list[dict]:
    casos = []
    for nome, valor in PARES_DE_LIMITE:
        for _ in range(N_POR_PAR_DE_LIMITE):
            caso = _sortear_caso(rng)
            caso[nome] = valor
            casos.append(_derivar(caso))
    return casos


def _casos_com_faltantes(rng: np.random.Generator) -> list[dict]:
    casos = []
    for _ in range(N_FALTANTES):
        caso = _sortear_caso(rng)
        quantos = int(rng.integers(1, 5))
        for nome in rng.choice(FALTANTES_POSSIVEIS, size=quantos, replace=False):
            caso[str(nome)] = None
        casos.append(_derivar(caso))
    return casos


def gerar_casos(modelo_json: dict, semente: int = SEMENTE) -> list[dict]:
    """Gera os casos sintéticos nos quatro grupos do spec.

    Args:
        modelo_json: modelo exportado, de onde saem os limiares das árvores.
        semente: semente do gerador, gravada no arquivo publicado.

    Returns:
        Lista de casos, cada um com o grupo e as 19 entradas na ordem do modelo.
    """
    rng = np.random.default_rng(semente)
    grupos = [
        ("sorteado", [_sortear_caso(rng) for _ in range(N_SORTEADOS)]),
        ("limiar", _casos_nos_limiares(rng, modelo_json)),
        ("limite", _casos_nos_limites(rng)),
        ("faltante", _casos_com_faltantes(rng)),
    ]
    return [
        {"grupo": grupo, "entrada": {nome: caso[nome] for nome in ENTRADAS}}
        for grupo, casos in grupos
        for caso in casos
    ]


def anotar_esperados(pipeline, casos: list[dict]) -> list[dict]:
    """Acrescenta a cada caso o escore do sklearn e a classe nos dois cortes.

    Args:
        pipeline: Pipeline do sklearn lido por carregar_pipeline, para que o
            escore se repita a cada geração.
        casos: saída de gerar_casos.

    Returns:
        Casos com escore, equilibrio e alta_sensibilidade.
    """
    quadro = montar_quadro([c["entrada"] for c in casos])
    escores = pipeline.predict_proba(quadro)[:, 1]
    return [
        {
            **caso,
            "escore": float(escore),
            "equilibrio": bool(escore >= CORTE_EQUILIBRIO),
            "alta_sensibilidade": bool(escore >= CORTE_ALTA_SENSIBILIDADE),
        }
        for caso, escore in zip(casos, escores)
    ]


def gravar_casos(
    caminho: Path, casos: list[dict], semente: int, sha256_modelo_json: str
) -> None:
    """Grava os casos com os metadados que o teste em JS confere.

    Args:
        caminho: destino do arquivo JSON.
        casos: saída de anotar_esperados.
        semente: semente usada em gerar_casos.
        sha256_modelo_json: SHA-256 do JSON do modelo usado.
    """
    dados = {
        "versao_modelo": VERSAO_MODELO,
        "gerador": GERADOR,
        "semente": semente,
        "sha256_modelo_json": sha256_modelo_json,
        "n": len(casos),
        "casos": casos,
    }
    texto = json.dumps(
        dados, ensure_ascii=False, separators=(",", ":"), allow_nan=False
    )
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(texto + "\n", encoding="utf-8")
