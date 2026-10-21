# Relatório de testes

Data: 20/10/2026. Branch `feat/parte-5-producao`. Node v25.9.0 e Python 3.14.3.

## Contagem

| Suíte | Comando | Arquivos | Testes | Resultado |
|---|---|---|---|---|
| JavaScript | `npm test` | 16 | 139 | 139 passaram, 0 falharam |
| Python | `./.venv/bin/python -m pytest` | 5 | 29 | 29 passaram |

Saída do `npm test` (trecho final):

```
casos 1958, diferença máxima 0, iguais bit a bit 1958
sem Math.fround, 87 de 558 casos nos limiares divergem
ℹ tests 139
ℹ pass 139
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

## Primeiro deploy (Parte 6)

Datas: 20 e 21/10/2026. Produção: `https://apendisite.com.br`, `main` em `02e1a56` (PR #7 mesclado). Deploy feito pelo Wilson com `npx wrangler deploy`, Wrangler 4.147.0. Esta seção separa o que foi observado, o que o Wilson relatou e o que não foi verificado.

### Conferência de produção

O `scripts/conferir_producao.sh` foi rodado na máquina do Wilson e na do assistente. A partir das 23:10 de 20/10, o IPv4 dessa rede passou a receber "Connection reset by peer" no handshake TLS com parte dos IPs da Cloudflare (também com `example.com`), e o IPv6 funcionou de modo intermitente. Nenhuma rodada única terminou limpa depois das mudanças na zona. A tabela junta as melhores observações de cada item.

| Item | Resultado | Evidência |
|---|---|---|
| 1. `/` dá 200 e traz a versão 1.0.0 do modelo | PASSOU | Rodada com `curl -6` e versão corrigida do script (PR #8). Falhou em outras rodadas só com código 000. |
| 2. `www` dá 301 para o apex com a query preservada | PASSOU | Saída do Wilson: `301 https://apendisite.com.br/qualquer?x=1`. |
| 3. `http://` redireciona para `https://` | PASSOU | Rodada com `curl -6`: `301 https://apendisite.com.br/`. |
| 4. Nenhum script de outro domínio nem `cloudflareinsights` | PASSOU | Todas as rodadas com resposta. |
| 5. Sem `Set-Cookie` em `/`, `/privacidade/`, no JSON do modelo e em `/api/saude` | PASSOU | Todas as rodadas com resposta. |
| 6. Oito cabeçalhos de segurança e `Cache-Control` | PASSOU | Rodada com a versão corrigida do script: 26 itens PASSOU e só os itens 2 e 3 falhando, antes de a zona ser configurada. |
| 7. `/api/saude` dá 200 com `{"ok":true}` | PASSOU | Mesma rodada. |
| 8. SHA-256 do JSON publicado bate com o repositório e o model card | PASSOU | Mesma rodada. |
| 9. `/privacidade/` dá 200 | PASSOU | Mesma rodada. |
| 10. `workers.dev` não serve o site | PASSOU | Captura do Wilson: `apendisite.woliveirajr-cipe.workers.dev` mostra "There is nothing here yet". O script, com a correção do PR #8, marca NÃO CONFERIDO quando a rede não responde. |
| 11. NS na Cloudflare e três MX do Email Routing | PASSOU | `dig` no 8.8.8.8 e no servidor `albert.ns.cloudflare.com`. |
| 12. DOI | NÃO CONFERIDO | O DOI só resolve depois da publicação no Zenodo, em 22/10. |

Limitação: o item 3 e os itens 6 a 9 foram vistos passando antes ou durante a configuração da zona, mas nenhuma rodada completa foi feita com o estado final da zona. Repetir `scripts/conferir_producao.sh --workers-dev woliveirajr-cipe` de outra rede está pendente. O Wilson aceitou registrar assim, porque o hotspot do celular não funcionou.

A correção do script (blocos de cache por caminho do `_headers` e resposta 000 no item 10) está no PR weojunior/apendisite#8, não mesclado na data desta seção.

### Configuração da zona no painel da Cloudflare

Observado nas capturas do Wilson em 21/10/2026.

| Configuração | Estado |
|---|---|
| Redirect Rule "Redirect from WWW to root" | Active, `Hostname equals www.apendisite.com.br`, redirect 301 para `concat("https://apendisite.com.br", ...)`. Cota de redirecionamentos: 1 de 10. |
| Regra de limite `api 50 em 10 s` | Active, ação Block, `URI Path starts with /api/`. Cota de regras de limite do plano Free: 1 de 1. |
| Worker `apendisite` | Domínio personalizado `apendisite.com.br`, sem rota `workers.dev`, Workers Logs e Workers Traces Disabled. |
| Always Use HTTPS | Ativo, conforme o item 3 da tabela acima. |

Não verificado: as quantidades da regra de limite (50 requisições, 10 segundos de período e de duração) não aparecem na lista, só no nome da regra. O Preview URLs do Worker não foi fotografado.

### Verificações relatadas pelo Wilson

Não vi a saída. Registradas como relatadas.

- Site aberto no celular.
- Contador em produção (`wrangler d1 execute apendisite --remote`, tarefa 6.4 passo 2) e e-mail de teste para `contato@apendisite.com.br` (passo 3): o Wilson deu o passo 6.4 por concluído.

### Lista manual do runbook, ainda aberta

- QR lido no iPhone e no Android.
- Caso sintético calculado na tela dá o escore esperado.
- Troca PT e EN mantém valores e unidades.
- E-mail de teste de outra conta chegou no Gmail (a ser confirmado com captura em 22/10).
