"""Testes da comparação JS contra sklearn e do relatório agregado."""

import math
from datetime import date

import pandas as pd
import pytest
from conftest import CAMINHO_JSON

from apendisite_conversao.excecoes import DadosLocaisAusentes
from apendisite_conversao.paridade import (
    avaliar_em_js,
    carregar_dados_locais,
    comparar,
    contar_padroes_faltantes,
    escrever_relatorio_659,
    quadro_para_entradas,
)
from apendisite_conversao.quadro import ENTRADAS
from apendisite_conversao.referencia import calcular_escore


def test_comparar_aprova_diferenca_minima_sem_discordancia():
    resumo = comparar([0.2, 0.6], [0.2, 0.6 + 1e-16])

    assert resumo.aprovado
    assert resumo.iguais_bit_a_bit == 1


def test_comparar_reprova_discordancia_no_corte_de_equilibrio():
    resumo = comparar([0.503], [0.5029999999])

    assert resumo.discordancias_equilibrio == 1
    assert not resumo.aprovado


def test_avaliar_em_js_igual_a_referencia_python(raiz, modelo_json):
    entradas = [{nome: None for nome in ENTRADAS} for _ in range(3)]
    entradas[1]["leucocitos"] = 15000.0
    entradas[2]["sexo"] = "M"

    obtidos = avaliar_em_js(entradas, CAMINHO_JSON, raiz)

    esperados = [calcular_escore(modelo_json, e) for e in entradas]
    assert comparar(esperados, obtidos).aprovado


def test_quadro_para_entradas_troca_nan_por_none():
    quadro = pd.DataFrame([{nome: 1.0 for nome in ENTRADAS}])
    quadro.loc[0, "pcr"] = math.nan
    quadro["sexo"] = ["F"]

    entradas = quadro_para_entradas(quadro)

    assert entradas[0]["pcr"] is None
    assert entradas[0]["sexo"] == "F"


def test_contar_padroes_faltantes_agrupa_por_colunas():
    quadro = pd.DataFrame([{nome: 1.0 for nome in ENTRADAS} for _ in range(3)])
    quadro.loc[1, "pcr"] = math.nan
    quadro.loc[2, "pcr"] = math.nan

    assert contar_padroes_faltantes(quadro) == {"pcr": 2, "nenhum": 1}


def test_carregar_dados_locais_recusa_pasta_sem_os_pkl(tmp_path):
    with pytest.raises(DadosLocaisAusentes):
        carregar_dados_locais(tmp_path)


def test_escrever_relatorio_659_so_tem_agregados(tmp_path):
    resumo = comparar([0.1, 0.9], [0.1, 0.9])
    destino = tmp_path / "paridade.md"

    escrever_relatorio_659(
        destino, resumo, {"nenhum": 2}, 0, "abc123", date(2026, 10, 20)
    )

    texto = destino.read_text(encoding="utf-8")
    assert "| Crianças | 2 |" in texto
    assert "abc123" in texto
    assert "0.9" not in texto
