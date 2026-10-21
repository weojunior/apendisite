# Relatório de testes

Data: 20/10/2026. Branch `feat/parte-5-producao`. Node v25.9.0 e Python 3.14.3.

## Contagem

| Suíte | Comando | Arquivos | Testes | Resultado |
|---|---|---|---|---|
| JavaScript | `npm test` | 16 | 132 | 132 passaram, 0 falharam |
| Python | `./.venv/bin/python -m pytest` | 5 | 29 | 29 passaram |

Saída do `npm test` (trecho final):

```
casos 1958, diferença máxima 0, iguais bit a bit 1958
sem Math.fround, 87 de 558 casos nos limiares divergem
ℹ tests 132
ℹ pass 132
ℹ fail 0
```

Saída do `pytest`:

```
29 passed in 0.82s
```

## Paridade entre o navegador e o scikit-learn

Critério do spec (seção 11): diferença absoluta de no máximo 1e-12 em cada caso e a mesma classificação nos dois cortes em 100% dos casos.

| Paridade | Casos | Diferença máxima | Iguais bit a bit | Discordâncias em 0,503 e 0,358 |
|---|---|---|---|---|
| Casos sintéticos (`tests/dados/casos_sinteticos_v1.0.0.json`, semente 20261023), no `npm test` | 1.958 | 0 | 1.958 | 0 e 0 |
| 659 crianças da derivação e da validação, só local (`run.py paridade-local`, rodada em 19/10/2026) | 659 | 0 | 659 | 0 e 0 |

Sem o `Math.fround`, 87 dos 558 casos nos limiares das árvores divergem, e o teste confere que a conversão para float32 é necessária. O relatório agregado das 659 crianças está em `docs/paridade_659.md`.
