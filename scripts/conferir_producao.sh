#!/usr/bin/env bash
# Confere o apendisite publicado. Só leitura: nenhum POST, para não sujar o contador.
# Uso: scripts/conferir_producao.sh [--base URL] [--workers-dev SUBDOMINIO] [--doi DOI]
# Cada linha sai como PASSOU, FALHOU ou NÃO CONFERIDO. Termina com erro se houver FALHOU.
set -u

PRODUCAO="https://apendisite.com.br"
BASE="$PRODUCAO"
WORKERS_DEV=""
DOI=""
while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="${2%/}"; shift 2 ;;
    --workers-dev) WORKERS_DEV="$2"; shift 2 ;;
    --doi) DOI="$2"; shift 2 ;;
    *) echo "opção desconhecida: $1" >&2; exit 2 ;;
  esac
done

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
CAMINHO_JSON="/modelo/random_forest_v1.0.0.json"
NAVEGADOR="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
FALHAS=0

passou() { printf 'PASSOU         %s\n' "$1"; }
falhou() { printf 'FALHOU         %s\n' "$1"; FALHAS=$((FALHAS + 1)); }
nao_conferido() { printf 'NÃO CONFERIDO  %s\n' "$1"; }
conferir() { if [ "$1" = "sim" ]; then passou "$2"; else falhou "$2"; fi; }
status_de() { curl -s -o /dev/null -w '%{http_code}' -A "$NAVEGADOR" "$1"; }
cabecalhos_de() { curl -s -o /dev/null -D - -A "$NAVEGADOR" -H 'Accept: text/html' "$1" | tr -d '\r'; }
pagina_de() { curl -s -A "$NAVEGADOR" -H 'Accept: text/html,application/xhtml+xml' "$1"; }
redirecionamento_de() { curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$1"; }

pagina="$(pagina_de "$BASE/")"
if [ "$(status_de "$BASE/")" = "200" ] && echo "$pagina" | grep -q '<meta name="versao-modelo" content="1.0.0">'; then r=sim; else r=nao; fi
conferir "$r" "1. / dá 200 e traz a versão 1.0.0 do modelo"

if [ "$BASE" = "$PRODUCAO" ]; then
  resposta="$(redirecionamento_de 'https://www.apendisite.com.br/qualquer?x=1')"
  if [ "$resposta" = "301 https://apendisite.com.br/qualquer?x=1" ]; then r=sim; else r=nao; fi
  conferir "$r" "2. www/qualquer?x=1 dá 301 para o apex ($resposta)"
  resposta="$(redirecionamento_de 'http://apendisite.com.br/')"
  case "$resposta" in 30[178]" https://apendisite.com.br/"*) r=sim ;; *) r=nao ;; esac
  conferir "$r" "3. http:// redireciona para https:// ($resposta)"
else
  nao_conferido "2. www (só em produção)"
  nao_conferido "3. http para https (só em produção)"
fi

externos="$(echo "$pagina" | grep -oiE '<script[^>]*src="[^"]*"' | grep -iE 'src="(https?:)?//' || true)"
insights="$(echo "$pagina" | grep -ioE 'cloudflareinsights|beacon\.min\.js' || true)"
if [ -z "$externos" ] && [ -z "$insights" ]; then r=sim; else r=nao; fi
conferir "$r" "4. Nenhum script de outro domínio nem cloudflareinsights"

for caminho in / /privacidade/ "$CAMINHO_JSON" /api/saude; do
  if cabecalhos_de "$BASE$caminho" | grep -qi '^set-cookie:'; then r=nao; else r=sim; fi
  conferir "$r" "5. Sem Set-Cookie em $caminho"
done

# Só o bloco /* vale para todas as respostas; os blocos por caminho (cache) não entram aqui.
for caminho in / /api/saude; do
  recebidos="$(cabecalhos_de "$BASE$caminho")"
  while IFS= read -r linha; do
    case "$linha" in
      "  "*:*)
        nome="${linha#  }"
        nome="${nome%%:*}"
        esperado="${linha#*: }"
        obtido="$(echo "$recebidos" | grep -i "^$nome: " | head -1 | sed 's/^[^:]*: //')"
        if [ "$obtido" = "$esperado" ]; then r=sim; else r=nao; fi
        conferir "$r" "6. $nome em $caminho"
        ;;
    esac
  done < <(awk '/^\/\*$/ {dentro=1; next} /^[^ ]/ {dentro=0} dentro' "$RAIZ/public/_headers")
done

corpo="$(curl -s -A "$NAVEGADOR" "$BASE/api/saude")"
if [ "$(status_de "$BASE/api/saude")" = "200" ] && [ "$corpo" = '{"ok":true}' ]; then r=sim; else r=nao; fi
conferir "$r" "7. /api/saude dá 200 com {\"ok\":true}"

sha_remoto="$(curl -s "$BASE$CAMINHO_JSON" | shasum -a 256 | cut -d' ' -f1)"
sha_local="$(shasum -a 256 "$RAIZ/public$CAMINHO_JSON" | cut -d' ' -f1)"
sha_cartao="$(grep -oE 'SHA-256 of the JSON: `[0-9a-f]{64}`' "$RAIZ/docs/MODEL_CARD.md" | grep -oE '[0-9a-f]{64}' || true)"
if [ "$sha_remoto" = "$sha_local" ] && [ "$sha_local" = "$sha_cartao" ]; then r=sim; else r=nao; fi
conferir "$r" "8. SHA-256 do JSON publicado bate com o repositório e com o model card"

if [ "$(status_de "$BASE/privacidade/")" = "200" ]; then r=sim; else r=nao; fi
conferir "$r" "9. /privacidade/ dá 200"

if [ -n "$WORKERS_DEV" ]; then
  if [ "$(status_de "https://apendisite.$WORKERS_DEV.workers.dev/")" != "200" ]; then r=sim; else r=nao; fi
  conferir "$r" "10. apendisite.$WORKERS_DEV.workers.dev não serve o site"
else
  nao_conferido "10. workers.dev (passe --workers-dev SUBDOMINIO)"
fi

if [ "$BASE" = "$PRODUCAO" ]; then
  ns="$(dig +short NS apendisite.com.br @8.8.8.8)"
  mx="$(dig +short MX apendisite.com.br @8.8.8.8 | grep -c 'mx.cloudflare.net' || true)"
  if echo "$ns" | grep -q 'ns.cloudflare.com' && [ "$mx" -eq 3 ]; then r=sim; else r=nao; fi
  conferir "$r" "11. NS na Cloudflare e 3 MX do Email Routing"
else
  nao_conferido "11. DNS (só em produção)"
fi

if [ -n "$DOI" ]; then
  resposta="$(redirecionamento_de "https://doi.org/$DOI")"
  case "$resposta" in 30[278]" https://zenodo.org/"*) r=sim ;; *) r=nao ;; esac
  conferir "$r" "12. doi.org/$DOI leva ao Zenodo ($resposta)"
else
  nao_conferido "12. DOI (passe --doi depois de publicar)"
fi

cat <<'LISTA'

Lista manual:
- QR lido no iPhone e no Android abre https://apendisite.com.br
- Um caso sintético calculado na tela dá o escore esperado
- Troca PT e EN mantém valores e unidades
- E-mail de teste para contato@apendisite.com.br chegou no Gmail
LISTA

if [ "$FALHAS" -gt 0 ]; then
  echo "$FALHAS item(ns) com FALHOU"
  exit 1
fi
