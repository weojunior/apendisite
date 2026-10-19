"""Testes do quadro de entrada do sklearn."""

import math

from apendisite_conversao.quadro import ENTRADAS, montar_quadro


def _entrada_completa() -> dict:
    entrada = {nome: 1.0 for nome in ENTRADAS}
    entrada["sexo"] = "M"
    return entrada


def test_montar_quadro_mantem_a_ordem_das_19_entradas():
    quadro = montar_quadro([_entrada_completa()])

    assert list(quadro.columns) == ENTRADAS
    assert len(ENTRADAS) == 19


def test_montar_quadro_converte_none_em_nan():
    entrada = _entrada_completa()
    entrada["pcr"] = None

    quadro = montar_quadro([entrada])

    assert math.isnan(quadro.loc[0, "pcr"])
    assert quadro["pcr"].dtype == "float64"
    assert quadro.loc[0, "sexo"] == "M"
