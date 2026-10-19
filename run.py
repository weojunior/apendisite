"""Linha de comando da conversão do apendisite.

Uso:
    ./.venv/bin/python run.py exportar
    ./.venv/bin/python run.py sinteticos
    ./.venv/bin/python run.py paridade-local --dados <pasta com os .pkl>
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ / "src"))

from apendisite_conversao.excecoes import ErroApendisite  # noqa: E402
from apendisite_conversao.exportar import (  # noqa: E402
    carregar_pipeline,
    exportar_modelo,
)
from apendisite_conversao.sinteticos import (  # noqa: E402
    SEMENTE,
    anotar_esperados,
    gerar_casos,
    gravar_casos,
)

CAMINHO_JOBLIB = RAIZ / "models" / "random_forest.joblib"
CAMINHO_JSON = RAIZ / "public" / "modelo" / "random_forest_v1.0.0.json"
CAMINHO_CASOS = RAIZ / "tests" / "dados" / "casos_sinteticos_v1.0.0.json"
CAMINHO_RELATORIO_659 = RAIZ / "docs" / "paridade_659.md"


def _sha256(caminho: Path) -> str:
    return hashlib.sha256(caminho.read_bytes()).hexdigest()


def _exportar(_: argparse.Namespace) -> int:
    sha = exportar_modelo(CAMINHO_JOBLIB, CAMINHO_JSON)
    print(f"JSON gravado em {CAMINHO_JSON.relative_to(RAIZ)}")
    print(f"SHA-256 do JSON: {sha}")
    return 0


def _sinteticos(_: argparse.Namespace) -> int:
    modelo_json = json.loads(CAMINHO_JSON.read_text(encoding="utf-8"))
    pipeline = carregar_pipeline(CAMINHO_JOBLIB)
    casos = anotar_esperados(pipeline, gerar_casos(modelo_json, SEMENTE))
    gravar_casos(CAMINHO_CASOS, casos, SEMENTE, _sha256(CAMINHO_JSON))
    print(f"{len(casos)} casos gravados em {CAMINHO_CASOS.relative_to(RAIZ)}")
    return 0


def _montar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Conversão do apendisite")
    sub = parser.add_subparsers(dest="comando", required=True)
    sub.add_parser("exportar", help="exporta o .joblib para JSON").set_defaults(
        funcao=_exportar
    )
    sub.add_parser("sinteticos", help="gera os casos sintéticos").set_defaults(
        funcao=_sinteticos
    )
    return parser


def main() -> int:
    """Ponto de entrada da linha de comando."""
    args = _montar_parser().parse_args()
    try:
        return args.funcao(args)
    except ErroApendisite as erro:
        print(f"erro: {erro}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
