"""Monta o DataFrame que o pipeline do sklearn espera."""

import pandas as pd

ENTRADAS = [
    "idade_anos", "leucocitos", "neutrofilos", "pcr", "leucocitos_urina", "peso",
    "nausea", "emese", "febre", "disuria", "ped_dor_fid", "ped_dor_difusa",
    "ped_rx_nivel_fid", "ped_rx_nivel_difuso", "leucocitose", "neutrofilia",
    "pcr_alterado", "leucocituria", "sexo",
]
COLUNAS_NUMERICAS = ENTRADAS[:-1]


def montar_quadro(entradas: list[dict]) -> pd.DataFrame:
    """Monta o DataFrame das 19 entradas, com None convertido em NaN.

    Args:
        entradas: dicionários com as 19 chaves de ENTRADAS. Faltante é None.

    Returns:
        DataFrame com as colunas na ordem de ENTRADAS, as 18 numéricas em
        float64 e sexo como objeto.
    """
    quadro = pd.DataFrame(entradas, columns=ENTRADAS)
    quadro[COLUNAS_NUMERICAS] = quadro[COLUNAS_NUMERICAS].astype("float64")
    quadro["sexo"] = quadro["sexo"].astype(object)
    return quadro
