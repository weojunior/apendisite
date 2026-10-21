#!/usr/bin/env bash
# Monta o pacote do Zenodo a partir da tag v1.0.0, em dist/ (fora do Git).
# Uso: scripts/montar_pacote_zenodo.sh
set -euo pipefail

TAG="v1.0.0"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="$RAIZ/dist/zenodo-1.0.0"
cd "$RAIZ"
git rev-parse --verify --quiet "refs/tags/$TAG" >/dev/null || { echo "a tag $TAG não existe"; exit 1; }
rm -rf "$DESTINO"
mkdir -p "$DESTINO"
git archive --format=zip --prefix=apendisite-1.0.0/ -o "$DESTINO/apendisite-1.0.0-codigo.zip" "$TAG" \
  package.json pytest.ini run.py requirements-conversao.txt \
  public/js/modelo.js public/js/entrada.js public/js/escores.js public/modelo/random_forest_v1.0.0.json \
  src/apendisite_conversao scripts/avaliar_lote.mjs \
  tests/js/auxiliares.js tests/js/paridade_sintetica.test.js tests/python tests/dados/casos_sinteticos_v1.0.0.json
for arquivo in models/random_forest.joblib public/modelo/random_forest_v1.0.0.json \
  tests/dados/casos_sinteticos_v1.0.0.json docs/MODEL_CARD.md README.md LICENSE; do
  git show "$TAG:$arquivo" > "$DESTINO/$(basename "$arquivo")"
done
cd "$DESTINO"
shasum -a 256 ./* | tee SHA256SUMS.txt
