"""Compara o motor em JavaScript com o sklearn e resume só agregados."""

import json
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

from apendisite_conversao.excecoes import DadosLocaisAusentes, ErroAvaliadorJs
from apendisite_conversao.quadro import ENTRADAS

TOLERANCIA = 1e-12
CORTE_EQUILIBRIO = 0.503
CORTE_ALTA_SENSIBILIDADE = 0.358
ARQUIVOS_LOCAIS = ("retrospectivo_processado.pkl", "prospectivo_processado.pkl")
SCRIPT_AVALIADOR = Path("scripts") / "avaliar_lote.mjs"


@dataclass(frozen=True)
class ResumoParidade:
    """Resumo agregado de uma comparação JS contra sklearn."""

    n: int
    dif_maxima: float
    iguais_bit_a_bit: int
    discordancias_equilibrio: int
    discordancias_alta_sensibilidade: int

    @property
    def aprovado(self) -> bool:
        """Diz se a comparação cumpre o critério do spec (seção 11)."""
        return (
            self.dif_maxima <= TOLERANCIA
            and self.discordancias_equilibrio == 0
            and self.discordancias_alta_sensibilidade == 0
        )


def comparar(esperados: list[float], obtidos: list[float]) -> ResumoParidade:
    """Compara duas listas de escores caso a caso.

    Args:
        esperados: escores do sklearn.
        obtidos: escores do motor em JavaScript.

    Returns:
        Resumo com diferença máxima, iguais bit a bit e discordâncias.

    Raises:
        ErroAvaliadorJs: se as listas têm tamanhos diferentes.
    """
    if len(esperados) != len(obtidos):
        raise ErroAvaliadorJs("as listas de escores têm tamanhos diferentes")
    a = np.asarray(esperados, dtype=np.float64)
    b = np.asarray(obtidos, dtype=np.float64)
    return ResumoParidade(
        n=len(a),
        dif_maxima=float(np.max(np.abs(a - b))) if len(a) else 0.0,
        iguais_bit_a_bit=int(np.sum(a == b)),
        discordancias_equilibrio=int(
            np.sum((a >= CORTE_EQUILIBRIO) != (b >= CORTE_EQUILIBRIO))
        ),
        discordancias_alta_sensibilidade=int(
            np.sum(
                (a >= CORTE_ALTA_SENSIBILIDADE) != (b >= CORTE_ALTA_SENSIBILIDADE)
            )
        ),
    )


def avaliar_em_js(
    entradas: list[dict], caminho_modelo: Path, raiz: Path
) -> list[float]:
    """Roda o motor do site no Node, com arquivos numa pasta temporária.

    Args:
        entradas: dicionários com as 19 entradas, faltante como None.
        caminho_modelo: JSON do modelo.
        raiz: raiz do repositório, onde está scripts/avaliar_lote.mjs.

    Returns:
        Escores na mesma ordem das entradas.

    Raises:
        ErroAvaliadorJs: sem Node, com saída de erro ou com contagem errada.
    """
    node = shutil.which("node")
    if node is None:
        raise ErroAvaliadorJs("node não encontrado no PATH")
    with tempfile.TemporaryDirectory(prefix="apendisite_") as pasta:
        caminho_entradas = Path(pasta) / "entradas.json"
        caminho_saida = Path(pasta) / "saida.json"
        caminho_entradas.write_text(
            json.dumps(entradas, allow_nan=False), encoding="utf-8"
        )
        comando = [
            node, str(raiz / SCRIPT_AVALIADOR), str(caminho_modelo),
            str(caminho_entradas), str(caminho_saida),
        ]
        resultado = subprocess.run(
            comando, capture_output=True, text=True, check=False
        )
        if resultado.returncode != 0:
            raise ErroAvaliadorJs(
                f"o avaliador saiu com código {resultado.returncode}: "
                f"{resultado.stderr.strip()}"
            )
        escores = json.loads(caminho_saida.read_text(encoding="utf-8"))
    if len(escores) != len(entradas):
        raise ErroAvaliadorJs("o avaliador devolveu número de escores diferente")
    return [float(e) for e in escores]


def quadro_para_entradas(quadro: pd.DataFrame) -> list[dict]:
    """Converte o DataFrame das 19 colunas em dicionários com None no faltante.

    Args:
        quadro: DataFrame com as colunas de ENTRADAS.

    Returns:
        Lista de dicionários prontos para JSON.
    """
    registros = quadro[ENTRADAS].astype(object).where(
        quadro[ENTRADAS].notna(), None
    )
    entradas = []
    for registro in registros.to_dict("records"):
        entradas.append(
            {
                nome: valor if nome == "sexo" or valor is None else float(valor)
                for nome, valor in registro.items()
            }
        )
    return entradas


def contar_padroes_faltantes(quadro: pd.DataFrame) -> dict[str, int]:
    """Conta as linhas por conjunto de colunas faltantes, sem expor valores.

    Args:
        quadro: DataFrame com as colunas de ENTRADAS.

    Returns:
        Dicionário do padrão (colunas separadas por vírgula, ou "nenhum")
        para o número de linhas, do mais frequente para o menos frequente.
    """
    padroes: dict[str, int] = {}
    for linha in quadro[ENTRADAS].isna().itertuples(index=False):
        faltam = [nome for nome, falta in zip(ENTRADAS, linha) if falta]
        chave = ", ".join(faltam) if faltam else "nenhum"
        padroes[chave] = padroes.get(chave, 0) + 1
    return dict(sorted(padroes.items(), key=lambda item: (-item[1], item[0])))


def carregar_dados_locais(pasta: Path) -> pd.DataFrame:
    """Lê os dois .pkl processados pelo caminho, sem copiar nada.

    Args:
        pasta: pasta data/processed do projeto de pesquisa.

    Returns:
        DataFrame com as 19 colunas, como o modelo as viu.

    Raises:
        DadosLocaisAusentes: se algum dos dois arquivos não existe.
    """
    caminhos = [pasta / nome for nome in ARQUIVOS_LOCAIS]
    faltando = [c.name for c in caminhos if not c.exists()]
    if faltando:
        raise DadosLocaisAusentes(
            f"arquivos ausentes em {pasta}: {', '.join(faltando)}"
        )
    quadros = [pd.read_pickle(caminho)[ENTRADAS] for caminho in caminhos]
    return pd.concat(quadros, ignore_index=True)


def escrever_relatorio_659(
    caminho: Path,
    resumo: ResumoParidade,
    padroes: dict[str, int],
    fora_da_faixa_de_idade: int,
    sha256_json: str,
    data: date,
) -> None:
    """Grava o relatório da paridade nos dados reais, só com agregados.

    Args:
        caminho: destino do markdown.
        resumo: resultado de comparar.
        padroes: saída de contar_padroes_faltantes.
        fora_da_faixa_de_idade: crianças fora de 2 a 14 anos.
        sha256_json: SHA-256 do JSON do modelo.
        data: data da rodada.
    """
    com_faltante = sum(n for chave, n in padroes.items() if chave != "nenhum")
    criterio = "aprovado" if resumo.aprovado else "reprovado"
    discordancias_0358 = resumo.discordancias_alta_sensibilidade
    linhas = [
        "# Paridade nas crianças da derivação e da validação (só agregados)",
        "",
        f"Data: {data.isoformat()}. SHA-256 do JSON: `{sha256_json}`.",
        "Rodada local. Os dados não entram no repositório.",
        "",
        "| Medida | Valor |",
        "|---|---|",
        f"| Crianças | {resumo.n} |",
        f"| Crianças com algum faltante | {com_faltante} |",
        f"| Crianças fora de 2 a 14 anos | {fora_da_faixa_de_idade} |",
        f"| Diferença máxima contra o sklearn | {resumo.dif_maxima:.1e} |",
        f"| Escores iguais bit a bit | {resumo.iguais_bit_a_bit} |",
        f"| Discordâncias no corte 0,503 | {resumo.discordancias_equilibrio} |",
        f"| Discordâncias no corte 0,358 | {discordancias_0358} |",
        f"| Critério do spec (seção 11) | {criterio} |",
        "",
        "## Padrões de faltante",
        "",
        "| Colunas faltantes | Crianças |",
        "|---|---|",
    ]
    linhas += [f"| {chave} | {n} |" for chave, n in padroes.items()]
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text("\n".join(linhas) + "\n", encoding="utf-8")
