"""Testes do gerador de casos sintéticos."""

import hashlib
import json
from collections import Counter

import numpy as np
from conftest import CAMINHO_CASOS, CAMINHO_JSON

from apendisite_conversao.quadro import ENTRADAS, montar_quadro
from apendisite_conversao.sinteticos import (
    N_LIMIARES_POR_VARIAVEL,
    SEMENTE,
    _derivar,
    _limiares_por_variavel,
    _vizinhos_float32,
    gerar_casos,
)


def test_gerar_casos_quantidade_por_grupo(modelo_json):
    limiares = _limiares_por_variavel(modelo_json)
    esperado_limiar = 3 * sum(
        min(N_LIMIARES_POR_VARIAVEL, len(v)) for v in limiares.values()
    )

    contagem = Counter(c["grupo"] for c in gerar_casos(modelo_json, SEMENTE))

    assert contagem == {
        "sorteado": 1000,
        "limiar": esperado_limiar,
        "limite": 200,
        "faltante": 200,
    }


def test_gerar_casos_e_deterministico_com_a_mesma_semente(modelo_json):
    assert gerar_casos(modelo_json, SEMENTE) == gerar_casos(modelo_json, SEMENTE)


def test_gerar_casos_traz_as_19_entradas_em_cada_caso(modelo_json):
    casos = gerar_casos(modelo_json, SEMENTE)

    assert all(list(c["entrada"]) == ENTRADAS for c in casos)


def test_vizinhos_float32_cercam_um_limiar_representavel():
    abaixo, acima, double_acima = _vizinhos_float32(9999.5)

    assert abaixo == 9999.5
    assert acima > 9999.5 and float(np.float32(acima)) == acima
    assert double_acima > 9999.5
    assert float(np.float32(double_acima)) == abaixo


def test_vizinhos_float32_cercam_um_limiar_nao_representavel():
    limiar = 0.85
    abaixo, acima, _ = _vizinhos_float32(limiar)

    assert abaixo <= limiar < acima
    assert float(np.float32(abaixo)) == abaixo


def test_derivar_usa_maior_estrito_e_propaga_faltante():
    caso = {"leucocitos": 10000.0, "neutrofilos": 7501.0, "pcr": None,
            "leucocitos_urina": 10.0}

    _derivar(caso)

    assert caso["leucocitose"] == 0.0
    assert caso["neutrofilia"] == 1.0
    assert caso["pcr_alterado"] is None
    assert caso["leucocituria"] == 0.0


def test_arquivo_publicado_bate_com_o_sklearn_e_com_o_json_atual(pipeline):
    arquivo = json.loads(CAMINHO_CASOS.read_text(encoding="utf-8"))
    sha_json = hashlib.sha256(CAMINHO_JSON.read_bytes()).hexdigest()
    casos = arquivo["casos"]

    escores = pipeline.predict_proba(montar_quadro([c["entrada"] for c in casos]))

    assert arquivo["sha256_modelo_json"] == sha_json
    assert arquivo["n"] == len(casos)
    assert [float(e) for e in escores[:, 1]] == [c["escore"] for c in casos]
