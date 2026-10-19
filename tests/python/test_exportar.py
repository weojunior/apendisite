"""Testes da exportação do random forest para JSON."""

import copy
import hashlib
import json

import numpy as np
import pytest
from conftest import CAMINHO_JOBLIB, CAMINHO_JSON

from apendisite_conversao.excecoes import EstruturaInesperada
from apendisite_conversao.exportar import (
    SHA256_JOBLIB,
    conferir_estrutura,
    exportar_modelo,
    montar_json,
    serializar,
)
from apendisite_conversao.quadro import ENTRADAS


def test_conferir_estrutura_aceita_o_modelo_publicado(pipeline):
    conferir_estrutura(pipeline)


def test_conferir_estrutura_recusa_floresta_com_499_arvores(pipeline):
    copia = copy.deepcopy(pipeline)
    copia.named_steps["clf"].estimators_ = copia.named_steps["clf"].estimators_[:499]

    with pytest.raises(EstruturaInesperada, match="número de árvores"):
        conferir_estrutura(copia)


def test_conferir_estrutura_recusa_indicador_binario_diferente(pipeline):
    copia = copy.deepcopy(pipeline)
    imputador = copia.named_steps["preproc"].named_transformers_["bin"]
    imputador.indicator_.features_ = np.array([0, 3])

    with pytest.raises(EstruturaInesperada, match="indicadores binários"):
        conferir_estrutura(copia)


def test_montar_json_traz_metadados_imputacao_e_500_arvores(pipeline):
    dados = montar_json(pipeline, SHA256_JOBLIB)

    assert dados["formato"] == "apendisite-rf"
    assert dados["versao_formato"] == 1
    assert dados["versao_modelo"] == "1.0.0"
    assert dados["entradas"] == ENTRADAS
    assert dados["medianas"] == pytest.approx([9, 12650, 9570, 4.5, 0.9, 30])
    assert dados["modas"] == [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0]
    assert dados["indicadores_numericas"] == [
        "leucocitos", "neutrofilos", "pcr", "leucocitos_urina", "peso",
    ]
    assert dados["indicadores_binarias"] == [
        "nausea", "disuria", "ped_rx_nivel_fid", "ped_rx_nivel_difuso",
        "leucocitose", "neutrofilia", "pcr_alterado", "leucocituria",
    ]
    assert len(dados["saidas"]) == 32
    assert dados["saidas"][-1] == "cat__sexo_M"
    assert dados["n_arvores"] == 500
    assert sum(len(a["esquerdo"]) for a in dados["arvores"]) == 14698


def test_montar_json_nao_exporta_contagem_nem_impureza(pipeline):
    arvore = montar_json(pipeline, SHA256_JOBLIB)["arvores"][0]

    assert set(arvore) == {"esquerdo", "direito", "variavel", "limiar", "prob"}


def test_serializar_e_deterministico_e_volta_ao_mesmo_double(pipeline):
    dados = montar_json(pipeline, SHA256_JOBLIB)

    primeira = serializar(dados)
    segunda = serializar(dados)
    relido = json.loads(primeira)

    assert primeira == segunda
    assert relido["arvores"][7]["limiar"] == dados["arvores"][7]["limiar"]


def test_exportar_modelo_recusa_joblib_com_outro_sha256(tmp_path):
    falso = tmp_path / "falso.joblib"
    falso.write_bytes(b"nao e o modelo")
    destino = tmp_path / "modelo.json"

    with pytest.raises(EstruturaInesperada, match="SHA-256"):
        exportar_modelo(falso, destino)
    assert not destino.exists()


def test_exportar_modelo_grava_json_e_devolve_o_sha256(tmp_path):
    destino = tmp_path / "modelo.json"

    sha = exportar_modelo(CAMINHO_JOBLIB, destino)

    assert sha == hashlib.sha256(destino.read_bytes()).hexdigest()


def test_json_publicado_igual_a_uma_exportacao_nova(tmp_path):
    sha_novo = exportar_modelo(CAMINHO_JOBLIB, tmp_path / "modelo.json")

    assert sha_novo == hashlib.sha256(CAMINHO_JSON.read_bytes()).hexdigest()
