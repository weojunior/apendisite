# Runbook do apendisite

## O que é e quem usa

Calculadora pública do random forest de apendicite pediátrica da FMB/UNESP, em https://apendisite.com.br, para médicos e estudantes de medicina. É o destino do QR do tema livre do 38º Congresso Brasileiro de Cirurgia Pediátrica (23/10/2026). O cálculo roda no navegador. Um Worker da Cloudflare serve os arquivos estáticos de `public/` e a API `/api` (contador, questionário e nota de utilidade), que grava no banco D1.

## Como rodar localmente

Pré-requisitos: Node com npm e Python 3.14.3 (`/Library/Frameworks/Python.framework/Versions/3.14/bin/python3.14`).

```bash
npm install
cp -n .dev.vars.exemplo .dev.vars
npx wrangler d1 migrations apply apendisite --local
npx wrangler dev
npm test
/Library/Frameworks/Python.framework/Versions/3.14/bin/python3.14 -m venv .venv
./.venv/bin/python -m pip install -r requirements-conversao.txt
./.venv/bin/python -m pytest
```

O `wrangler dev` atende em http://localhost:8787. Sequência conferida do zero num clone limpo em 20/10/2026: `npm test` e `pytest` verdes, `/api/saude` com 200.

## Onde ficam as contas e os segredos

- Cloudflare, conta "apendisite" no login do Wilson (`account_id` `838d6356e968881a5b4a969406ee0d68`): Worker `apendisite` no domínio `apendisite.com.br`, Email Routing, regra de limite em `/api/` e Redirect Rule do `www` (as duas criadas no primeiro deploy).
- D1 `apendisite`: `database_id` `b5ba7a8a-f049-4ad4-9ca6-aec53b46b2cc`, região ENAM, binding `DB`. Migração `0001_inicial.sql` aplicada no local e no remoto em 20/10/2026.
- Zenodo: registro do software e DOI da versão (`10.5281/zenodo.23474325`).
- registro.br: domínio `apendisite.com.br`, titular pessoa física (Wilson).
- Gmail do Wilson: destino do `contato@apendisite.com.br`.
- Segredos: nenhum no repositório. O Worker não tem segredo. O `.dev.vars` só leva a origem local e fica fora do Git. O login do Wrangler fica no computador de quem faz o deploy (`npx wrangler login`).

## Deploy e volta atrás

1. `npm test` e `./.venv/bin/python -m pytest` verdes.
2. Commit na `main` e tag `deploy-AAAAMMDD-HHMM`.
3. `npx wrangler deploy`.
4. `scripts/conferir_producao.sh` (opções `--workers-dev SUBDOMINIO` e `--doi DOI`). Termina com erro se algum item sair como FALHOU.

Voltar atrás: `git switch --detach <tag anterior>`, `npx wrangler deploy` e `git switch main`.

Plano B (página estática de `plano-b/`, mesmo Worker e mesmo domínio): `npx wrangler deploy --config wrangler.plano-b.jsonc`. A volta é o deploy normal. Ensaiado com `--dry-run` em 20/10/2026.

Backup do D1, semanal até 30/11/2026 e mensal depois, fora do Git: `npx wrangler d1 export apendisite --remote --output ~/Documents/apendisite-backups/backup_AAAAMMDD.sql`. Retenção: respostas até 5 anos depois da publicação, depois apagadas. Contagens sem prazo.

## Quem chamar

Wilson Elias de Oliveira Junior, dono da conta e responsável pelos dados: `contato@apendisite.com.br`. Depois de 23/10/2026, também a Bruna Aliotto Nalin Tedesco, como Administrator na Cloudflare e com edição no Zenodo.

## Modos de falha conhecidos

- Web Analytics religado na zona: a Cloudflare insere um script na página, e o item 4 do `conferir_producao.sh` falha. Desligar de novo em Web Analytics.
- Wi-Fi do congresso: muitos aparelhos saem pelo mesmo IP, passam de 50 pedidos em 10 s e recebem 429 em `/api/`. Perde contagens, o cálculo segue.
- D1 fora do ar: `/api/saude` dá 503, e o contador e o questionário param. O cálculo segue, porque roda no aparelho.
- Deploy na conta errada (a da Leviva): o `account_id` fixo no `wrangler.jsonc` e no `wrangler.plano-b.jsonc` impede.
- PCR em mg/L digitada com a unidade mg/dL entra dez vezes maior. O seletor de unidade fica ao lado do campo, e a faixa de 0 a 60 mg/dL barra os valores altos.
- Troca de servidores DNS: o DNSSEC ficou desligado na troca para a Cloudflare e continua assim até ser religado no registro.br.
- O "Enviar como" do Gmail para endereço fora do Google deixa de funcionar em janeiro de 2027. Rever antes disso como responder pelo `contato@`.
- `wrangler rollback` não garante a volta dos arquivos estáticos (Não verificado). Voltar pela tag.
- O `_headers` só vale para os arquivos estáticos. As respostas de `/api` levam os mesmos cabeçalhos pelo `worker/cabecalhos.js`, e um teste confere que os dois batem.
