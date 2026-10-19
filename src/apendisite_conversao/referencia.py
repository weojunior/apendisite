"""Avaliador de referência em Python puro, a partir do JSON exportado.

Replica o que modelo.js faz, para provar o JSON contra o sklearn.
"""

import math
import struct


def _para_float32(valor: float) -> float:
    return struct.unpack("f", struct.pack("f", valor))[0]


def _faltante(valor) -> bool:
    return valor is None or (isinstance(valor, float) and math.isnan(valor))


def transformar(modelo: dict, entrada: dict) -> list[float]:
    """Transforma as 19 entradas nas 32 colunas do pré-processamento.

    Args:
        modelo: dicionário lido do JSON exportado.
        entrada: dicionário com as 19 entradas. Faltante é None ou NaN.

    Returns:
        Lista de 32 floats: numéricas imputadas, indicadores numéricos,
        binárias imputadas, indicadores binários e sexo_M.
    """
    saida = []
    for nome, mediana in zip(modelo["numericas"], modelo["medianas"]):
        valor = entrada[nome]
        saida.append(mediana if _faltante(valor) else float(valor))
    for nome in modelo["indicadores_numericas"]:
        saida.append(1.0 if _faltante(entrada[nome]) else 0.0)
    for nome, moda in zip(modelo["binarias"], modelo["modas"]):
        valor = entrada[nome]
        saida.append(moda if _faltante(valor) else float(valor))
    for nome in modelo["indicadores_binarias"]:
        saida.append(1.0 if _faltante(entrada[nome]) else 0.0)
    saida.append(1.0 if entrada["sexo"] == modelo["sexo_um"] else 0.0)
    return saida


def calcular_escore(modelo: dict, entrada: dict) -> float:
    """Calcula o escore com conversão para float32 e média das 500 folhas.

    Args:
        modelo: dicionário lido do JSON exportado.
        entrada: dicionário com as 19 entradas.

    Returns:
        Média das probabilidades da classe 1 nas folhas, de 0 a 1.
    """
    x = [_para_float32(v) for v in transformar(modelo, entrada)]
    soma = 0.0
    for arvore in modelo["arvores"]:
        esquerdo = arvore["esquerdo"]
        no = 0
        while esquerdo[no] != -1:
            if x[arvore["variavel"][no]] <= arvore["limiar"][no]:
                no = esquerdo[no]
            else:
                no = arvore["direito"][no]
        soma += arvore["prob"][no]
    return soma / modelo["n_arvores"]
