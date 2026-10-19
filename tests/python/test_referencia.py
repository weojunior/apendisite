"""Testes do avaliador de referência em Python puro, a partir do JSON."""

import numpy as np

from apendisite_conversao.quadro import ENTRADAS, montar_quadro
from apendisite_conversao.referencia import calcular_escore, transformar

BINARIAS = ENTRADAS[6:18]


def _entradas_aleatorias(n: int, semente: int) -> list[dict]:
    rng = np.random.default_rng(semente)
    entradas = []
    for _ in range(n):
        leucocitos = float(rng.integers(500, 30001))
        entrada = {
            "idade_anos": float(rng.integers(1, 16)),
            "leucocitos": leucocitos,
            "neutrofilos": float(rng.integers(0, int(leucocitos) + 1)),
            "pcr": round(float(rng.uniform(0, 30)), 2),
            "leucocitos_urina": round(float(rng.uniform(0, 50)), 1),
            "peso": round(float(rng.uniform(8, 80)), 1),
            "sexo": str(rng.choice(["M", "F"])),
        }
        for nome in BINARIAS:
            entrada[nome] = float(rng.integers(0, 2))
        if rng.random() < 0.3:
            entrada[str(rng.choice(ENTRADAS[:18]))] = None
        entradas.append(entrada)
    return entradas


def test_transformar_igual_ao_preprocessamento_do_sklearn(pipeline, modelo_json):
    entradas = _entradas_aleatorias(60, semente=7)
    esperado = pipeline.named_steps["preproc"].transform(montar_quadro(entradas))
    esperado = esperado.toarray() if hasattr(esperado, "toarray") else esperado

    obtido = np.array([transformar(modelo_json, e) for e in entradas])

    assert np.array_equal(obtido, esperado)


def test_transformar_com_tudo_faltante_usa_medianas_modas_e_indicadores(
    modelo_json,
):
    entrada = {nome: None for nome in ENTRADAS}

    x = transformar(modelo_json, entrada)

    assert x[:6] == modelo_json["medianas"]
    assert x[6:11] == [1.0] * 5
    assert x[11:23] == modelo_json["modas"]
    assert x[23:31] == [1.0] * 8
    assert x[31] == 0.0


def test_calcular_escore_igual_ao_sklearn_em_300_casos(pipeline, modelo_json):
    entradas = _entradas_aleatorias(300, semente=11)
    esperado = pipeline.predict_proba(montar_quadro(entradas))[:, 1]

    obtido = np.array([calcular_escore(modelo_json, e) for e in entradas])

    assert np.max(np.abs(obtido - esperado)) <= 1e-12
