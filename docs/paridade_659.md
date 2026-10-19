# Paridade nas crianças da derivação e da validação (só agregados)

Data: 2026-10-19. SHA-256 do JSON: `21b7e560ade3d678ff9403557f6cd3b3983e3c715659ef2ee606bf478f3f80f0`.
Rodada local. Os dados não entram no repositório.

| Medida | Valor |
|---|---|
| Crianças | 659 |
| Crianças com algum faltante | 174 |
| Crianças fora de 2 a 14 anos | 7 |
| Diferença máxima contra o sklearn | 0.0e+00 |
| Escores iguais bit a bit | 659 |
| Discordâncias no corte 0,503 | 0 |
| Discordâncias no corte 0,358 | 0 |
| Critério do spec (seção 11) | aprovado |

## Padrões de faltante

| Colunas faltantes | Crianças |
|---|---|
| nenhum | 485 |
| peso | 53 |
| leucocitos_urina, leucocituria | 36 |
| ped_rx_nivel_fid, ped_rx_nivel_difuso | 21 |
| pcr, pcr_alterado | 10 |
| leucocitos_urina, ped_rx_nivel_fid, ped_rx_nivel_difuso, leucocituria | 8 |
| leucocitos, neutrofilos, pcr, leucocitos_urina, ped_rx_nivel_fid, ped_rx_nivel_difuso, leucocitose, neutrofilia, pcr_alterado, leucocituria | 7 |
| leucocitos_urina, peso, leucocituria | 7 |
| peso, ped_rx_nivel_fid, ped_rx_nivel_difuso | 6 |
| leucocitos, neutrofilos, pcr, leucocitos_urina, leucocitose, neutrofilia, pcr_alterado, leucocituria | 5 |
| leucocitos, neutrofilos, pcr, leucocitos_urina, peso, ped_rx_nivel_fid, ped_rx_nivel_difuso, leucocitose, neutrofilia, pcr_alterado, leucocituria | 5 |
| leucocitos_urina, peso, ped_rx_nivel_fid, ped_rx_nivel_difuso, leucocituria | 3 |
| pcr, leucocitos_urina, ped_rx_nivel_fid, ped_rx_nivel_difuso, pcr_alterado, leucocituria | 3 |
| leucocitos, neutrofilos, pcr, leucocitos_urina, peso, leucocitose, neutrofilia, pcr_alterado, leucocituria | 2 |
| pcr, peso, pcr_alterado | 2 |
| disuria | 1 |
| leucocitos, neutrofilos, pcr, leucocitos_urina, disuria, leucocitose, neutrofilia, pcr_alterado, leucocituria | 1 |
| nausea | 1 |
| pcr, leucocitos_urina, pcr_alterado, leucocituria | 1 |
| pcr, leucocitos_urina, peso, ped_rx_nivel_fid, ped_rx_nivel_difuso, pcr_alterado, leucocituria | 1 |
| ped_rx_nivel_fid | 1 |
