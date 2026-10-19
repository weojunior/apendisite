"""Exceções do pacote de conversão do apendisite."""


class ErroApendisite(Exception):
    """Classe-base das exceções do pacote."""


class EstruturaInesperada(ErroApendisite):
    """O modelo carregado não tem a estrutura que a exportação conhece."""


class ErroAvaliadorJs(ErroApendisite):
    """O avaliador em JavaScript não rodou ou devolveu saída inválida."""


class DadosLocaisAusentes(ErroApendisite):
    """Os dados da paridade local não estão no caminho informado."""
