"""Configuração dos testes: injeta src/ no caminho e carrega o modelo uma vez."""

import json
import sys
from pathlib import Path

import joblib
import pytest

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "src"))

CAMINHO_JOBLIB = RAIZ / "models" / "random_forest.joblib"
CAMINHO_JSON = RAIZ / "public" / "modelo" / "random_forest_v1.0.0.json"
CAMINHO_CASOS = RAIZ / "tests" / "dados" / "casos_sinteticos_v1.0.0.json"


@pytest.fixture(scope="session")
def raiz() -> Path:
    """Raiz do repositório."""
    return RAIZ


@pytest.fixture(scope="session")
def pipeline():
    """Pipeline do sklearn lido do .joblib publicado."""
    return joblib.load(CAMINHO_JOBLIB)


@pytest.fixture(scope="session")
def modelo_json() -> dict:
    """Modelo exportado em JSON (existe a partir da tarefa 1.2)."""
    return json.loads(CAMINHO_JSON.read_text(encoding="utf-8"))
