"""Exporta o random forest do apendisite de .joblib para JSON."""

import hashlib
import json
import platform
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import scipy
import sklearn

from apendisite_conversao.excecoes import EstruturaInesperada
from apendisite_conversao.quadro import ENTRADAS

FORMATO = "apendisite-rf"
VERSAO_FORMATO = 1
VERSAO_MODELO = "1.0.0"
SHA256_JOBLIB = "ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858"
N_ARVORES = 500
N_SAIDAS = 32
NUMERICAS = ENTRADAS[:6]
BINARIAS = ENTRADAS[6:18]
INDICES_INDICADOR_NUMERICAS = [1, 2, 3, 4, 5]
INDICES_INDICADOR_BINARIAS = [0, 3, 6, 7, 8, 9, 10, 11]
CATEGORIAS_SEXO = ["F", "M"]
SEXO_UM = "M"


def _exigir(condicao: bool, o_que: str) -> None:
    if not condicao:
        raise EstruturaInesperada(f"estrutura inesperada: {o_que}")


def conferir_estrutura(pipeline) -> None:
    """Confere se o pipeline tem a estrutura que a exportação conhece.

    Args:
        pipeline: Pipeline do sklearn lido do .joblib.

    Raises:
        EstruturaInesperada: na primeira diferença encontrada.
    """
    _exigir([nome for nome, _ in pipeline.steps] == ["preproc", "clf"], "passos")
    _exigir(list(pipeline.feature_names_in_) == ENTRADAS, "ordem das 19 entradas")
    pre = pipeline.named_steps["preproc"]
    clf = pipeline.named_steps["clf"]
    blocos = [(nome, list(colunas)) for nome, _, colunas in pre.transformers_]
    esperado = [("num", NUMERICAS), ("bin", BINARIAS), ("cat", ["sexo"])]
    _exigir(blocos == esperado, "blocos do ColumnTransformer")
    num = pre.named_transformers_["num"]
    bina = pre.named_transformers_["bin"]
    cat = pre.named_transformers_["cat"]
    _exigir(num.strategy == "median" and num.add_indicator, "imputador numérico")
    _exigir(
        list(num.indicator_.features_) == INDICES_INDICADOR_NUMERICAS,
        "indicadores numéricos",
    )
    _exigir(
        bina.strategy == "most_frequent" and bina.add_indicator,
        "imputador binário",
    )
    _exigir(
        list(bina.indicator_.features_) == INDICES_INDICADOR_BINARIAS,
        "indicadores binários",
    )
    _exigir(
        not num.indicator_.error_on_new and not bina.indicator_.error_on_new,
        "error_on_new",
    )
    _exigir(not np.isnan(num.statistics_).any(), "medianas")
    _exigir(not np.isnan(bina.statistics_).any(), "modas")
    _exigir(
        [list(c) for c in cat.categories_] == [CATEGORIAS_SEXO],
        "categorias de sexo",
    )
    _exigir(
        cat.drop == "if_binary" and cat.handle_unknown == "ignore",
        "codificação de sexo",
    )
    _exigir(len(clf.estimators_) == N_ARVORES, "número de árvores")
    _exigir(list(clf.classes_) == [0, 1], "classes")
    _exigir(clf.n_features_in_ == N_SAIDAS, "número de colunas de saída")
    _exigir(len(pre.get_feature_names_out()) == N_SAIDAS, "nomes das saídas")


def _versoes() -> dict:
    return {
        "python": platform.python_version(),
        "sklearn": sklearn.__version__,
        "numpy": np.__version__,
        "scipy": scipy.__version__,
        "joblib": joblib.__version__,
        "pandas": pd.__version__,
    }


def _exportar_arvore(arvore) -> dict:
    valores = arvore.value[:, 0, :]
    prob = valores[:, 1] / valores.sum(axis=1)
    return {
        "esquerdo": [int(v) for v in arvore.children_left],
        "direito": [int(v) for v in arvore.children_right],
        "variavel": [int(v) for v in arvore.feature],
        "limiar": [float(v) for v in arvore.threshold],
        "prob": [float(v) for v in prob],
    }


def montar_json(pipeline, sha256_joblib: str) -> dict:
    """Monta o dicionário do modelo no formato lido pelo site.

    Args:
        pipeline: Pipeline do sklearn já conferido por conferir_estrutura.
        sha256_joblib: SHA-256 do .joblib de origem.

    Returns:
        Dicionário com metadados, imputação, ordem das 32 saídas e as 500
        árvores em listas paralelas.
    """
    pre = pipeline.named_steps["preproc"]
    clf = pipeline.named_steps["clf"]
    num = pre.named_transformers_["num"]
    bina = pre.named_transformers_["bin"]
    return {
        "formato": FORMATO,
        "versao_formato": VERSAO_FORMATO,
        "versao_modelo": VERSAO_MODELO,
        "sha256_joblib": sha256_joblib,
        "versoes": _versoes(),
        "entradas": ENTRADAS,
        "numericas": NUMERICAS,
        "medianas": [float(v) for v in num.statistics_],
        "indicadores_numericas": [NUMERICAS[i] for i in INDICES_INDICADOR_NUMERICAS],
        "binarias": BINARIAS,
        "modas": [float(v) for v in bina.statistics_],
        "indicadores_binarias": [BINARIAS[i] for i in INDICES_INDICADOR_BINARIAS],
        "sexo_um": SEXO_UM,
        "saidas": [str(nome) for nome in pre.get_feature_names_out()],
        "n_arvores": len(clf.estimators_),
        "arvores": [_exportar_arvore(e.tree_) for e in clf.estimators_],
    }


def serializar(dados: dict) -> bytes:
    """Serializa o modelo em JSON compacto, determinístico e sem NaN.

    Args:
        dados: dicionário de montar_json.

    Returns:
        Bytes UTF-8 terminados em quebra de linha.
    """
    texto = json.dumps(
        dados, ensure_ascii=False, separators=(",", ":"), allow_nan=False
    )
    return (texto + "\n").encode("utf-8")


def exportar_modelo(caminho_joblib: Path, caminho_json: Path) -> str:
    """Confere o .joblib, exporta o JSON e devolve o SHA-256 do JSON.

    Args:
        caminho_joblib: caminho do .joblib publicado.
        caminho_json: destino do JSON.

    Returns:
        SHA-256 hexadecimal do JSON gravado.

    Raises:
        EstruturaInesperada: se o SHA-256 do .joblib ou a estrutura diferem
            do esperado. Nesse caso nada é gravado.
    """
    conteudo = caminho_joblib.read_bytes()
    sha = hashlib.sha256(conteudo).hexdigest()
    if sha != SHA256_JOBLIB:
        raise EstruturaInesperada(f"SHA-256 do .joblib difere do esperado: {sha}")
    pipeline = joblib.load(caminho_joblib)
    conferir_estrutura(pipeline)
    dados = serializar(montar_json(pipeline, sha))
    caminho_json.parent.mkdir(parents=True, exist_ok=True)
    caminho_json.write_bytes(dados)
    return hashlib.sha256(dados).hexdigest()
