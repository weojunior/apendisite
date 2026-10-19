# Plano de implementação do apendisite, versão 1

> Para quem executa: sub-skill obrigatória `superpowers:executing-plans`, em sequência, na sessão (seção 5 do manual do Wilson). Subagente por tarefa só se o Wilson pedir. Os passos usam caixas (`- [ ]`) para acompanhamento.

**Objetivo:** pôr no ar, em `https://apendisite.com.br`, a calculadora pública do random forest de apendicite pediátrica de Botucatu, em PT e EN, com contador, questionário SUS, nota de utilidade, Privacidade, pacote no Zenodo, runbook e plano B, antes do tema livre de 23/10/2026, 8:00.

**Arquitetura:** Cloudflare Workers com arquivos estáticos em `public/`. Só `/api` e `/api/*` passam pelo código do Worker, que grava contagens e respostas no D1 `apendisite`. O escore é calculado no navegador, em JavaScript puro, a partir de um JSON exportado do `.joblib` por um pacote Python que também gera os casos sintéticos e roda as duas paridades.

**Tecnologia:** JavaScript em módulos ES sem build (Node v25.9.0 nos testes, `node --test`), Wrangler 4.147.0, D1, Python 3.14.3 com scikit-learn 1.8.0 só para conversão e teste (pytest 9.1.1).

**Spec:** `docs/superpowers/specs/2026-10-19-apendisite-design.md` no repositório (cópia de `apendisite_spec_v1.md`, aprovado em 19/10/2026). Quem executa lê o spec e este plano. As marcas [Decidido Qx], [Padrão] e [Decidido Sn] do spec não se reabrem.

**Textos:** `docs/textos_aprovados.md` no repositório (cópia das seções 1 a 12 de `apendisite_parte3_textos.md`, aprovado em 19/10/2026, mais a seção 13 com os textos curtos aprovados junto com este plano).

**Origem dos arquivos até a Parte 0:** `~/.claude/passagens/apendisite-notas/`. Em 19/10, por volta de 02:25, o app apagou as pastas de notas das sessões arquivadas, inclusive as que guardavam o spec, os textos e o QR. Os quatro foram recuperados às 02:31 (Observado: spec com 45.964 bytes e textos com 30.299 bytes, iguais ao `ls` feito antes da perda, QR com o SHA-256 de antes). A partir da Parte 0, a cópia de referência é a do repositório.

---

## Restrições globais

Valem para todas as tarefas. Os valores estão copiados do spec.

1. Cortes escritos assim no código: `CORTE_EQUILIBRIO = 0.503` e `CORTE_ALTA_SENSIBILIDADE = 0.358`. Positivo se `escore >= corte`, com o escore cheio, nunca o número mostrado (spec 4.4).
2. Faixas: baixa se escore < 0,358, intermediária se 0,358 <= escore < 0,503, alta se escore >= 0,503. Frequências fixas: baixa 1 de 120, intermediária 8 de 70, alta 67 de 130 (spec 4.4).
3. Motor: cada uma das 32 colunas passa por `Math.fround` antes de comparar com o limiar. O nó vai para a esquerda se `valor <= limiar`. Soma das 500 folhas na ordem das árvores, dividida por 500. O motor não bloqueia faixa nenhuma (spec 4.3).
4. Paridade: diferença absoluta de no máximo 1e-12 em cada caso e classificação igual nos dois cortes em 100% dos casos (spec 11).
5. `.joblib`: SHA-256 `ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858`, 1.397.634 bytes (spec 4.1).
6. Faixas aceitas, conferidas na unidade digitada (spec 5.4): idade 2 a 14 anos. Peso 8 a 120 kg. Leucócitos 500 a 60.000/mm³ ou 0,5 a 60 ×10³/µL. Neutrófilos 0 a 50.000/mm³ ou 0 a 50 ×10³/µL, sem passar dos leucócitos, ou 0 a 100%. PCR 0 a 60 mg/dL ou 0 a 600 mg/L. Leucócitos na urina 0 a 500 por campo. Temperatura do Alvarado 34 a 43 °C ou 93,2 a 109,4 °F.
7. Derivadas com `>` estrito, sobre os valores já convertidos: leucocitose se leucócitos > 10.000/mm³, neutrofilia se neutrófilos > 7.500/mm³, pcr_alterado se PCR > 5,0 mg/dL, leucocituria se urina > 10 por campo (spec 5.1).
8. Unidades iniciais: PT com /mm³, /mm³, mg/dL e °C. EN com ×10³/µL, ×10³/µL, mg/L e °C. Depois que a página carrega, a unidade nunca muda sozinha, nem na troca de idioma, e não é guardada (spec 5.3, S2).
9. Nenhum valor do formulário nem o resultado vai ao servidor. No `localStorage` ficam só `apendisite.idioma` e `apendisite.sus_respondido`. Sem cookie (spec 9.1, 10).
10. Nenhum script, folha de estilo, fonte ou imagem de outro domínio. Sem estilo nem script embutido no HTML. Fonte do sistema (spec 10).
11. CSP exata e os oito cabeçalhos da seção 10 do spec, nos arquivos estáticos e nas respostas de `/api`.
12. O código do Worker nunca lê `CF-Connecting-IP`, `X-Forwarded-For` nem `X-Real-IP` (spec 9.2).
13. Textos só dos aprovados, iguais palavra por palavra. Mudança de texto passa pelo Wilson. Zero travessão em texto, código, comentário e documento.
14. Versões fixas: Wrangler `4.147.0` (publicado em 02/10/2026, Observado no npm em 19/10), `compatibility_date` `"2026-10-01"` (workerd 1.20261001.1 do Wrangler 4.147.0, Observado). Python 3.14.3 em `/Library/Frameworks/Python.framework/Versions/3.14/bin/python3.14`. scikit-learn 1.8.0, numpy 2.4.4, scipy 1.17.1, joblib 1.5.3, pandas 3.0.3, threadpoolctl 3.6.0, python-dateutil 2.9.0.post0, six 1.17.0, tzdata 2026.2 (Observado no venv de `~/Documents/apendicite`), pytest 9.1.1 (publicado em 19/06/2026, Observado no PyPI).
15. `~/Documents/apendicite` é só leitura. Os `.pkl` são lidos pelo caminho e nunca copiados. Nenhuma linha das 659 crianças entra no Git, no Zenodo ou em relatório.
16. Python: docstring Google, type hints modernos, exceções do projeto, núcleo sem `print` nem `input` (convenção 7). Testes `test_<funcao>_<comportamento>` (convenção 8).
17. Commits em Conventional Commits em português, verbo no infinitivo, sem ponto final, um por unidade lógica, com `git add` de caminhos explícitos, nunca `git add .` (convenção 9). A sessão que executa acrescenta a cada `git commit` o trailer de coautoria do seu system reminder, como segundo `-m`, e a linha de atribuição ao corpo de cada PR.

## Quem faz o quê

| Quem | O quê |
|---|---|
| Eu (sessão que executa) | Escrevo código, testes e documentos no repositório. Rodo `node --test`, `./.venv/bin/python -m pytest`, `./.venv/bin/python run.py ...`, leituras, `curl` e `dig` de conferência. Confiro páginas no navegador do app. |
| Wilson | Roda `git`, `gh`, `npm install`, `npx wrangler ...`, criação do venv e `pip install`, qualquer `cp` ou `curl -o` para dentro do repositório, os cliques na Cloudflare, no GitHub, no Zenodo e no Streamlit Cloud. |

Cada comando do Wilson vem em bloco próprio. Eu espero o output colado antes de seguir. Nenhum comando deste plano é interativo, salvo `npx wrangler login`, que abre o navegador.

Cada parte termina com teste verde, PR aberto pelo Wilson, minha apresentação do resultado e o merge do Wilson ("Create a merge commit"). O merge é a confirmação da convenção 6. Ao fechar cada parte, atualizo a passagem `~/.claude/passagens/2026-10-18-apendisite-site.md`.

## Estado da Fase A em 19/10/2026, 02:09

Observado pelo RDAP do registro.br e por `dig` no 8.8.8.8:

- Servidores ainda `a.auto.dns.br` e `b.auto.dns.br`. A troca para `albert` e `dorthy.ns.cloudflare.com` foi salva no registro.br (`last changed` 2026-10-19T03:52:17Z) e ainda não entrou.
- DNSSEC já retirado (`delegationSigned: false`).
- MX nulo (`0 .`), SPF `v=spf1 -all` e DMARC `p=reject` ainda servidos pelo DNS do registro.br.
- A sessão da Fase A ([Fase A do apendisite](#local_b8dbc324-def0-4f6d-8a74-34b3e99d0a94)) está arquivada. A última mensagem do Wilson foi "DNS ok, precisamos aguardar 2h". Os passos A4 (Web Analytics e Bot Fight Mode desligados), A5 (Email Routing) e A6 (rascunho do Zenodo com DOI reservado) não começaram.

Dependências deste plano na Fase A:

| Item da Fase A | Parte que precisa | Até quando |
|---|---|---|
| `account_id` da conta apendisite | Parte 4, tarefa 4.5 | 21/10 de manhã |
| Zona ativa na Cloudflare | Parte 6, primeiro deploy | 21/10 à tarde |
| Web Analytics e Bot Fight Mode desligados | Parte 6, conferência | 21/10 à tarde |
| Email Routing de `contato@` | Parte 6, conferência (MX) e lista manual | 21/10 à tarde |
| DOI reservado no Zenodo | Parte 2 (`DOI_VERSAO`), Parte 5 (plano B, README) | 21/10 |

## Ambiguidades resolvidas neste plano (aprovadas pelo Wilson em 19/10/2026, com os textos curtos novos e a Parte 0)

Nenhuma reabre decisão. São lacunas do spec, cada uma com a minha recomendação, aplicada no plano.

| N | O spec diz | O plano faz | Por quê |
|---|---|---|---|
| A1 | "Origin diferente de `https://apendisite.com.br` dá 403" | POST sem cabeçalho `Origin` também dá 403. `GET /api/saude` não confere `Origin`. | Todo navegador manda `Origin` em POST. Sem a regra, um `curl` sem `Origin` passaria. O script de produção usa GET. |
| A2 | Não diz o que acontece com o D1 fora do ar | Erro do D1 dá 503 `{"ok":false}`. A página trata como falha de envio. | O cálculo não depende do servidor (spec 9.1). |
| A3 | "Qualquer desvio dá 400" | Corpo acima de 2 KB, `Content-Type` diferente de `application/json` e JSON inválido dão 400. | Segue a regra do spec, sem código novo de status. |
| A4 | Origem fixa | A origem aceita vem de `ORIGEM_PERMITIDA` em `vars` do `wrangler.jsonc` (`https://apendisite.com.br`). No `wrangler dev`, o `.dev.vars` troca para `http://localhost:8787`. | Sem isso, o teste local da API daria 403. |
| A5 | Arredonda "depois da conversão" | O arredondamento vale também sem conversão: 12650,4 /mm³ vira 12650. | Mesmo tratamento em todas as unidades. |
| A6 | °F convertido e arredondado a uma casa (S5) | °C é usado como digitado. Só °F é arredondado. | O S5 trata só do °F. |
| A7 | Total só com o escore completo | O Alvarado completo exige anorexia e acetona respondidas, mesmo quando uma delas já é Sim. | Regra única: todo item perguntado precisa de resposta. |
| A8 | Convite e utilidade "abaixo do primeiro resultado" | Aparecem só com o primeiro resultado da visita. Um novo cálculo redesenha o resultado sem o convite. O link do rodapé continua. | Leitura literal de Q3.7a e Q17a. |
| A9 | Estrutura de arquivos [Padrão] | Acrescenta `public/js/formato.js` (escore truncado, números), `public/js/contrato_api.js` (chaves, áreas, países, usado pela página e pelo Worker), `public/js/visita.js` (estado da visita), `public/js/privacidade.js`, `worker/cabecalhos.js`, `src/apendisite_conversao/quadro.py`, `.dev.vars.exemplo`, `wrangler.plano-b.jsonc`, `scripts/montar_pacote_zenodo.sh`, `docs/textos_aprovados.md` e `docs/qr/`. | Arquivos menores, cada um com uma responsabilidade e com teste. |
| A10 | Paridade sintética "no Mac, antes de cada deploy" | O arquivo de casos guarda o escore do sklearn. A paridade sintética roda no `node --test` e o pytest confere que o arquivo ainda bate com o sklearn. | Uma só suíte antes do deploy, sem Python no caminho do JS. |
| A11 | `http://` redireciona para `https://` (spec 13.3, item 3) | Ligar "Always Use HTTPS" na zona, na Parte 6. | O spec confere, mas não diz como. |
| A12 | Plano B "no mesmo endereço" | `not_found_handling: "single-page-application"`: qualquer caminho mostra a página informativa. | O QR e links antigos caem na mesma página. |
| A13 | DOIs só em `textos.js` | Com `DOI_VERSAO` nulo, o bloco "Como citar" não aparece. Com `DOI_CONCEITO` nulo, o link do Zenodo do rodapé não aparece. | Evita "doi:null" na tela. |
| A14 | Logo e favicon do brand pack | Logo `HOR_COR_3.png` (texto azul para fundo claro, 1520 x 299). Favicon e ícone do iPhone recortados do símbolo do mesmo arquivo. | O brand pack não traz favicon (Observado: só PNG e PDF de logotipo). |
| A15 | Spec e textos no repositório público | O spec vai inteiro, como decidido. Ele cita a rejeição do JPS (seção 15, item 7). Os textos vão sem as duas linhas internas sobre o manuscrito (linhas 270 e 274 do original) e sem a lista de pendências. | O repositório `weojunior/sera-apendicite` é público (Observado pela API do GitHub). Se preferir, o spec vai sem o item 15.7. |
| A16 | O primeiro commit tira o Streamlit | Observado: o app do Streamlit Cloud lê a `main`. Inferido: depois do merge da Parte 0, em 20/10, o app antigo para de funcionar, dois dias antes da S9. Recomendo aceitar, porque a S9 quer uma só calculadora pública. O app continua listado no Streamlit Cloud até ser apagado em 22/10. | |

## Textos curtos novos (aprovar junto com o plano)

Entram na seção 13 de `docs/textos_aprovados.md`, com data de aprovação. Sem eles a página não tem rótulo de acessibilidade, título de bloco ou mensagem de erro de carga.

| Chave | PT | EN | Onde |
|---|---|---|---|
| `item_acetona` | Acetona na urina | Urinary acetone | Escores (S6, já decidido) |
| `unidade` | Unidade | Unit | rótulo do seletor de unidade |
| `resultado_titulo` | Resultado | Result | título do bloco de resultado |
| `total_escore` | {nome}: {total} de 10. Categoria do artigo original: {categoria} | {nome}: {total} of 10. Category from the original article: {categoria} | total do Alvarado e do PAS |
| `como_feito_titulo` | Como o modelo foi feito | How the model was built | seção recolhida |
| `limitacoes_titulo` | Limitações | Limitations | seção recolhida |
| `autoria_titulo` | Autoria | Authors | bloco de autoria |
| `referencias_titulo` | Referências | References | bloco de referências |
| `pais_selecione` | Selecione | Select | primeira opção da lista de países |
| `erro_modelo` | Não foi possível carregar o modelo. Recarregue a página. | The model could not be loaded. Reload the page. | falha ao ler o JSON |
| `priv_voltar` | Voltar à calculadora | Back to the calculator | página Privacidade |
| `unidade_anos` | anos | years | mensagem de faixa da idade |
| `unidade_campo` | por campo | per high-power field | mensagem de faixa da urina |
| aviso sem JavaScript | A calculadora do apendisite precisa de JavaScript. Ative o JavaScript no navegador e recarregue a página. | The apendisite calculator requires JavaScript. Enable JavaScript in your browser and reload the page. | `index.html` (S8) |
| página 404 | Página não encontrada. Ir para a calculadora. | Page not found. Go to the calculator. | `404.html` |

## Mapa de arquivos

```
apendisite/
  public/
    index.html                   esqueleto, <noscript>, meta versao-modelo
    privacidade/index.html       esqueleto da Privacidade
    404.html                     página de erro bilíngue, sem JavaScript
    _headers                     oito cabeçalhos de segurança
    robots.txt
    css/apendisite.css           estilo (tarefa de design 2.4)
    js/modelo.js                 motor: carregarModelo, transformar, calcularEscore, classificar
    js/formato.js                formatarEscore, truncarMilesimos, formatarNumero, quadradosCheios
    js/entrada.js                lerNumero, conversões, faixas, validarFormulario, acoplarRaioX
    js/escores.js                calcularAlvarado, calcularPas
    js/textos.js                 TEXTOS pt e en, escolherIdioma, preencher, DOIs
    js/contrato_api.js           ROTAS, CHAVES, EVENTOS, AREAS, USARIA, PAISES
    js/servidor.js               montarCorpo*, enviar, enviarSemFalha
    js/visita.js                 estado da visita e o que mostrar abaixo do resultado
    js/app.js                    interface da calculadora (única com DOM)
    js/privacidade.js            interface da Privacidade
    modelo/random_forest_v1.0.0.json
    img/logo.png, img/favicon-32.png, img/apple-touch-icon.png
  plano-b/                       index.html, estilo.css, _headers, img/logo.png
  worker/index.js                rotas /api
  worker/validacao.js            validação pura, país, dia em Brasília
  worker/cabecalhos.js           CSP e cabeçalhos de segurança
  migrations/0001_inicial.sql
  src/apendisite_conversao/
    __init__.py, excecoes.py, exportar.py, quadro.py, referencia.py,
    sinteticos.py, paridade.py
  run.py                         CLI: exportar, sinteticos, paridade-local
  scripts/avaliar_lote.mjs       ponte Python para JS
  scripts/conferir_producao.sh
  scripts/montar_pacote_zenodo.sh
  tests/js/*.test.js, tests/js/auxiliares.js
  tests/python/conftest.py, tests/python/test_*.py
  tests/dados/casos_sinteticos_v1.0.0.json
  docs/superpowers/specs/2026-10-19-apendisite-design.md
  docs/superpowers/plans/2026-10-19-apendisite-plano.md
  docs/textos_aprovados.md, docs/RUNBOOK.md, docs/MODEL_CARD.md, docs/paridade_659.md
  docs/qr/qr_apendisite.png, docs/qr/ler_qr.swift
  models/random_forest.joblib    já está no repositório (Observado)
  wrangler.jsonc, wrangler.plano-b.jsonc, package.json, package-lock.json
  requirements-conversao.txt, .dev.vars.exemplo, .gitignore, LICENSE
  README.md, CONTRIBUTING.md, RELATORIO_TESTES.md, RELATORIO_FEEDBACK.md
  .github/pull_request_template.md
```

Calendário (spec 14): Parte 0, 1 e 2 em 20/10. Partes 3, 4, 5 e 6 em 21/10. Parte 7 em 22/10. Parte 8 em 23/10, às 7:30.

---

## Parte 0 (20/10, manhã): repositório

Pronto quando o repositório `weojunior/apendisite` está clonado em `~/Documents/apendisite`, sem o Streamlit, com spec, plano, textos, `.gitignore`, `LICENSE`, `package.json`, venv e `node_modules` instalados, e o PR da Parte 0 mesclado.

### Tarefa 0.1: renomear e clonar

**Arquivos:** nenhum ainda.

- [ ] **Passo 1: renomear no GitHub (Wilson, clique a clique).** Abrir `https://github.com/weojunior/sera-apendicite/settings`. Em "General", campo "Repository name", trocar `sera-apendicite` por `apendisite`. Clicar em "Rename". O GitHub redireciona o endereço antigo.

- [ ] **Passo 2: clonar (Wilson).**

```bash
git clone https://github.com/weojunior/apendisite.git ~/Documents/apendisite
```

- [ ] **Passo 3: conferir o conteúdo e o modelo (Wilson cola o output).**

```bash
cd ~/Documents/apendisite && git log --oneline -5 && ls -la && shasum -a 256 models/random_forest.joblib
```

Esperado: `3b3b1e0 Rename random_forest.joblib to models/random_forest.joblib` no topo, os arquivos `models/`, `requirements.txt` e `streamlit_app.py`, e o SHA-256 `ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858`. Observado em 19/10: o SHA-1 de blob do `.joblib` no GitHub (`0f86281846c1fc2ed9e94385aeeac01191c985b4`) é igual ao do arquivo em `~/Documents/apendicite`, então não há cópia a fazer. Se o SHA-256 divergir, parar e avisar.

### Tarefa 0.2: tirar o Streamlit e preparar a estrutura

**Arquivos:**
- Apagar: `streamlit_app.py`, `requirements.txt`
- Criar: `.gitignore`, `package.json`, `requirements-conversao.txt`, `.dev.vars.exemplo`, `.github/pull_request_template.md`, `tests/js/auxiliares.js`, `tests/js/fumaca.test.js`
- Copiar (Wilson): `LICENSE`, `docs/superpowers/specs/2026-10-19-apendisite-design.md`, `docs/superpowers/plans/2026-10-19-apendisite-plano.md`, `docs/textos_aprovados.md`, `docs/qr/qr_apendisite.png`, `docs/qr/ler_qr.swift`, `public/img/logo.png`

- [ ] **Passo 1: branch e remoção do Streamlit (Wilson).**

```bash
cd ~/Documents/apendisite && git switch -c chore/preparar-repositorio && git rm streamlit_app.py requirements.txt
```

- [ ] **Passo 2: escrever o `.gitignore`.**

```gitignore
# Python
.venv/
__pycache__/
*.pyc
.pytest_cache/

# Node e Wrangler
node_modules/
.wrangler/
.dev.vars

# Dados locais e backups (nenhuma linha de paciente entra no Git)
*.pkl
dados_locais/
backup_*.sql

# Pacote do Zenodo gerado
dist/

# macOS e editores
.DS_Store
.vscode/
.idea/
```

- [ ] **Passo 3: escrever o `package.json`.**

```json
{
  "name": "apendisite",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "apendisite: a random forest for appendicitis in children",
  "scripts": {
    "test": "node --test 'tests/js/*.test.js'"
  },
  "devDependencies": {
    "wrangler": "4.147.0"
  }
}
```

- [ ] **Passo 4: escrever o `requirements-conversao.txt`.**

```
joblib==1.5.3
numpy==2.4.4
pandas==3.0.3
python-dateutil==2.9.0.post0
scikit-learn==1.8.0
scipy==1.17.1
six==1.17.0
threadpoolctl==3.6.0
tzdata==2026.2
pytest==9.1.1
```

- [ ] **Passo 5: escrever o `.dev.vars.exemplo`.**

```
# Copiar para .dev.vars (fora do Git) antes do wrangler dev.
ORIGEM_PERMITIDA=http://localhost:8787
```

- [ ] **Passo 6: escrever o `.github/pull_request_template.md`.**

```markdown
## O que muda

## Por quê

## Como foi testado

- [ ] `npm test` verde (número de testes: )
- [ ] `./.venv/bin/python -m pytest` verde (número de testes: )
- [ ] Nenhum dado de paciente, `.pkl` ou credencial no diff

## Parte do plano

Parte N, tarefas:
```

- [ ] **Passo 7: escrever o auxiliar e o teste de fumaça do Node.**

`tests/js/auxiliares.js`:

```js
// Auxiliares dos testes em node:test.
import { readFile } from 'node:fs/promises';

/** Lê um JSON pelo caminho relativo à raiz do repositório. */
export async function lerJson(caminhoRelativo) {
  const url = new URL(`../../${caminhoRelativo}`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

/** Lê um arquivo de texto pelo caminho relativo à raiz do repositório. */
export async function lerTexto(caminhoRelativo) {
  return readFile(new URL(`../../${caminhoRelativo}`, import.meta.url), 'utf8');
}

/** Devolve o double imediatamente abaixo de x, para x positivo. */
export function vizinhoAbaixo(x) {
  const visao = new DataView(new ArrayBuffer(8));
  visao.setFloat64(0, x);
  visao.setBigUint64(0, visao.getBigUint64(0) - 1n);
  return visao.getFloat64(0);
}

/** Devolve o double imediatamente acima de x, para x positivo. */
export function vizinhoAcima(x) {
  const visao = new DataView(new ArrayBuffer(8));
  visao.setFloat64(0, x);
  visao.setBigUint64(0, visao.getBigUint64(0) + 1n);
  return visao.getFloat64(0);
}
```

`tests/js/fumaca.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vizinhoAbaixo, vizinhoAcima } from './auxiliares.js';

test('vizinhos_de_ponto_flutuante_cercam_o_corte', () => {
  assert.ok(vizinhoAbaixo(0.503) < 0.503);
  assert.ok(vizinhoAcima(0.503) > 0.503);
});
```

- [ ] **Passo 8: copiar os arquivos de fora (Wilson).** As linhas 270 e 274 e as pendências (linha 312 em diante) do arquivo de textos são notas internas e ficam fora (A15).

```bash
cd ~/Documents/apendisite && mkdir -p docs/superpowers/specs docs/superpowers/plans docs/qr public/img && N="$HOME/.claude/passagens/apendisite-notas" && cp "$N/apendisite_spec_v1.md" docs/superpowers/specs/2026-10-19-apendisite-design.md && cp "$N/apendisite_plano_v1.md" docs/superpowers/plans/2026-10-19-apendisite-plano.md && cp "$N/qr_apendisite.png" docs/qr/ && cp "$N/ler_qr.swift" docs/qr/ && sed -e '312,$d' -e '274d' -e '270d' "$N/apendisite_parte3_textos.md" > docs/textos_aprovados.md && cp "$HOME/Downloads/BRAND PACK _ APENDISITE/LOGOTIPO/PNG (SEM FUNDO)/HOR_COR_3.png" public/img/logo.png && shasum -a 256 docs/qr/qr_apendisite.png && wc -l docs/textos_aprovados.md
```

Esperado: SHA-256 do QR `07a2f6c560ce08afc2ff9f1fae6d4ba704c4d5b0127d4c428a35c5895ddfafbf` e 309 linhas no arquivo de textos.

- [ ] **Passo 9: baixar a licença CC BY 4.0 (Wilson).**

```bash
cd ~/Documents/apendisite && curl -fsSL -o LICENSE https://creativecommons.org/licenses/by/4.0/legalcode.txt && head -3 LICENSE
```

Esperado: a primeira linha cita "Attribution 4.0 International". Se a rede do hospital recusar o certificado, rodar de outra rede.

- [ ] **Passo 10: acrescentar a seção 13 aos textos aprovados.** Eu acrescento ao fim de `docs/textos_aprovados.md`:

```markdown
## 13. Textos curtos aprovados com o spec e o plano (19/10/2026)

PT
- Acetona na urina
- Unidade
- Resultado
- {nome}: {total} de 10. Categoria do artigo original: {categoria}
- Como o modelo foi feito
- Limitações
- Autoria
- Referências
- Selecione
- Não foi possível carregar o modelo. Recarregue a página.
- Voltar à calculadora
- anos
- por campo
- A calculadora do apendisite precisa de JavaScript. Ative o JavaScript no navegador e recarregue a página.
- Página não encontrada. Ir para a calculadora.

EN
- Urinary acetone
- Unit
- Result
- {nome}: {total} of 10. Category from the original article: {categoria}
- How the model was built
- Limitations
- Authors
- References
- Select
- The model could not be loaded. Reload the page.
- Back to the calculator
- years
- per high-power field
- The apendisite calculator requires JavaScript. Enable JavaScript in your browser and reload the page.
- Page not found. Go to the calculator.
```

- [ ] **Passo 11: criar o venv e instalar (Wilson).** Pode levar alguns minutos. Na rede do hospital, se o `pip` ou o `npm` falharem por certificado, rodar de outra rede (spec 15.10).

```bash
cd ~/Documents/apendisite && /Library/Frameworks/Python.framework/Versions/3.14/bin/python3.14 -m venv .venv && ./.venv/bin/python -m pip install -r requirements-conversao.txt && ./.venv/bin/python -c "import sklearn, sys; print(sys.version.split()[0], sklearn.__version__)"
```

Esperado: `3.14.3 1.8.0`.

```bash
cd ~/Documents/apendisite && npm view wrangler@4.147.0 time.4.147.0 && npm install && npx wrangler --version
```

Esperado: `2026-10-02T11:30:47.699Z` e `4.147.0`. O `npm install` cria o `package-lock.json`, que entra no commit.

- [ ] **Passo 12: rodar o teste de fumaça.** Eu rodo `npm test`. Esperado: 1 teste, 1 passou.

- [ ] **Passo 13: commit, push e PR (Wilson).**

```bash
cd ~/Documents/apendisite && git add .gitignore package.json package-lock.json requirements-conversao.txt .dev.vars.exemplo .github/pull_request_template.md tests/js/auxiliares.js tests/js/fumaca.test.js LICENSE docs/superpowers/specs/2026-10-19-apendisite-design.md docs/superpowers/plans/2026-10-19-apendisite-plano.md docs/textos_aprovados.md docs/qr/qr_apendisite.png docs/qr/ler_qr.swift public/img/logo.png && git status --short && git commit -m "chore: tirar o app do Streamlit e preparar o repositório do apendisite"
```

Conferir no `git status --short` que só aparecem os caminhos acima e as duas remoções (`D streamlit_app.py`, `D requirements.txt`).

```bash
cd ~/Documents/apendisite && git push -u origin chore/preparar-repositorio && gh pr create --base main --title "chore: preparar o repositório do apendisite" --body "Tira o Streamlit, que dá lugar ao site estático na Cloudflare (decisão da parte 1). Traz o spec aprovado em 19/10, o plano, os textos aprovados, a licença CC BY 4.0, o QR e as dependências fixas. Por quê: o primeiro commit do repositório renomeado separa o app antigo do novo."
```

- [ ] **Passo 14: merge (Wilson), depois de eu apresentar o diff.**

```bash
cd ~/Documents/apendisite && gh pr merge --merge --delete-branch && git switch main && git pull
```

**Portão da Parte 0:** PR mesclado, `npm test` verde, venv com sklearn 1.8.0. Atualizar a passagem.

---

## Parte 1 (20/10): exportação, motor, casos sintéticos e as duas paridades

Aprovada pelo Wilson em 19/10/2026, junto com a Parte 2 (bloco 2).

Pronto quando o JSON do modelo está exportado e conferido, o motor JS dá o escore do sklearn nos cerca de 2.000 casos sintéticos e nas 659 crianças (diferença de no máximo 1e-12, zero discordâncias), e o PR da Parte 1 está mesclado.

Branch (Wilson, no começo da parte):

```bash
cd ~/Documents/apendisite && git switch main && git pull && git switch -c feat/parte-1-motor
```

### Tarefa 1.1: pacote Python, exceções e quadro do sklearn

**Arquivos:**
- Criar: `pytest.ini`, `src/apendisite_conversao/__init__.py`, `src/apendisite_conversao/excecoes.py`, `src/apendisite_conversao/quadro.py`, `tests/python/conftest.py`
- Teste: `tests/python/test_quadro.py`

**Interfaces:**
- Produz: `ENTRADAS: list[str]` (19 nomes, na ordem de `feature_names_in_`), `montar_quadro(entradas: list[dict]) -> pd.DataFrame`, exceções `ErroApendisite`, `EstruturaInesperada`, `ErroAvaliadorJs`, `DadosLocaisAusentes`. Fixtures `raiz`, `pipeline`, `modelo_json` e as constantes `CAMINHO_JOBLIB`, `CAMINHO_JSON`, `CAMINHO_CASOS` em `conftest.py`.

- [ ] **Passo 1: escrever `pytest.ini`, `__init__.py`, `excecoes.py` e `conftest.py`.**

`pytest.ini`:

```ini
[pytest]
testpaths = tests/python
```

`src/apendisite_conversao/__init__.py`:

```python
"""Conversão do random forest do apendisite para JSON e testes de paridade."""
```

`src/apendisite_conversao/excecoes.py`:

```python
"""Exceções do pacote de conversão do apendisite."""


class ErroApendisite(Exception):
    """Classe-base das exceções do pacote."""


class EstruturaInesperada(ErroApendisite):
    """O modelo carregado não tem a estrutura que a exportação conhece."""


class ErroAvaliadorJs(ErroApendisite):
    """O avaliador em JavaScript não rodou ou devolveu saída inválida."""


class DadosLocaisAusentes(ErroApendisite):
    """Os dados da paridade local não estão no caminho informado."""
```

`tests/python/conftest.py`:

```python
"""Configuração dos testes: injeta src/ no caminho e carrega o modelo uma vez."""

import json
import sys
from pathlib import Path

import joblib
import pytest

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "src"))

CAMINHO_JOBLIB = RAIZ / "models" / "random_forest.joblib"
CAMINHO_JSON = RAIZ / "public" / "modelo" / "random_forest_v1.0.0.json"
CAMINHO_CASOS = RAIZ / "tests" / "dados" / "casos_sinteticos_v1.0.0.json"


@pytest.fixture(scope="session")
def raiz() -> Path:
    """Raiz do repositório."""
    return RAIZ


@pytest.fixture(scope="session")
def pipeline():
    """Pipeline do sklearn lido do .joblib publicado."""
    return joblib.load(CAMINHO_JOBLIB)


@pytest.fixture(scope="session")
def modelo_json() -> dict:
    """Modelo exportado em JSON (existe a partir da tarefa 1.2)."""
    return json.loads(CAMINHO_JSON.read_text(encoding="utf-8"))
```

- [ ] **Passo 2: escrever o teste que falha.**

`tests/python/test_quadro.py`:

```python
"""Testes do quadro de entrada do sklearn."""

import math

from apendisite_conversao.quadro import ENTRADAS, montar_quadro


def _entrada_completa() -> dict:
    entrada = {nome: 1.0 for nome in ENTRADAS}
    entrada["sexo"] = "M"
    return entrada


def test_montar_quadro_mantem_a_ordem_das_19_entradas():
    quadro = montar_quadro([_entrada_completa()])

    assert list(quadro.columns) == ENTRADAS
    assert len(ENTRADAS) == 19


def test_montar_quadro_converte_none_em_nan():
    entrada = _entrada_completa()
    entrada["pcr"] = None

    quadro = montar_quadro([entrada])

    assert math.isnan(quadro.loc[0, "pcr"])
    assert quadro["pcr"].dtype == "float64"
    assert quadro.loc[0, "sexo"] == "M"
```

- [ ] **Passo 3: rodar e ver falhar.** Eu rodo `./.venv/bin/python -m pytest tests/python/test_quadro.py -v`. Esperado: erro de importação de `apendisite_conversao.quadro`.

- [ ] **Passo 4: escrever `quadro.py`.**

```python
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
```

- [ ] **Passo 5: rodar e ver passar.** `./.venv/bin/python -m pytest tests/python/test_quadro.py -v`. Esperado: 2 passaram.

- [ ] **Passo 6: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add pytest.ini src/apendisite_conversao/__init__.py src/apendisite_conversao/excecoes.py src/apendisite_conversao/quadro.py tests/python/conftest.py tests/python/test_quadro.py && git commit -m "feat: criar o pacote de conversão com exceções e quadro do sklearn"
```

### Tarefa 1.2: exportação do `.joblib` para JSON

**Arquivos:**
- Criar: `src/apendisite_conversao/exportar.py`, `run.py`, `public/modelo/random_forest_v1.0.0.json` (gerado)
- Teste: `tests/python/test_exportar.py`

**Interfaces:**
- Consome: `ENTRADAS` de `quadro.py`, `EstruturaInesperada`.
- Produz: `conferir_estrutura(pipeline) -> None`, `montar_json(pipeline, sha256_joblib: str) -> dict`, `serializar(dados: dict) -> bytes`, `exportar_modelo(caminho_joblib: Path, caminho_json: Path) -> str` (SHA-256 do JSON), constantes `SHA256_JOBLIB`, `VERSAO_MODELO`.
- Formato do JSON (consumido por `modelo.js` e `referencia.py`): `formato` ("apendisite-rf"), `versao_formato` (1), `versao_modelo` ("1.0.0"), `sha256_joblib`, `versoes` (python, sklearn, numpy, scipy, joblib, pandas), `entradas` (19), `numericas` (6), `medianas` (6), `indicadores_numericas` (5 nomes), `binarias` (12), `modas` (12), `indicadores_binarias` (8 nomes), `sexo_um` ("M"), `saidas` (32 nomes), `n_arvores` (500), `arvores` (500 objetos com `esquerdo`, `direito`, `variavel`, `limiar`, `prob`). Folha tem `esquerdo` igual a -1.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/python/test_exportar.py`:

```python
"""Testes da exportação do random forest para JSON."""

import copy
import hashlib
import json

import numpy as np
import pytest
from conftest import CAMINHO_JOBLIB, CAMINHO_JSON

from apendisite_conversao.excecoes import EstruturaInesperada
from apendisite_conversao.exportar import (
    SHA256_JOBLIB,
    conferir_estrutura,
    exportar_modelo,
    montar_json,
    serializar,
)
from apendisite_conversao.quadro import ENTRADAS


def test_conferir_estrutura_aceita_o_modelo_publicado(pipeline):
    conferir_estrutura(pipeline)


def test_conferir_estrutura_recusa_floresta_com_499_arvores(pipeline):
    copia = copy.deepcopy(pipeline)
    copia.named_steps["clf"].estimators_ = copia.named_steps["clf"].estimators_[:499]

    with pytest.raises(EstruturaInesperada, match="número de árvores"):
        conferir_estrutura(copia)


def test_conferir_estrutura_recusa_indicador_binario_diferente(pipeline):
    copia = copy.deepcopy(pipeline)
    imputador = copia.named_steps["preproc"].named_transformers_["bin"]
    imputador.indicator_.features_ = np.array([0, 3])

    with pytest.raises(EstruturaInesperada, match="indicadores binários"):
        conferir_estrutura(copia)


def test_montar_json_traz_metadados_imputacao_e_500_arvores(pipeline):
    dados = montar_json(pipeline, SHA256_JOBLIB)

    assert dados["formato"] == "apendisite-rf"
    assert dados["versao_formato"] == 1
    assert dados["versao_modelo"] == "1.0.0"
    assert dados["entradas"] == ENTRADAS
    assert dados["medianas"] == pytest.approx([9, 12650, 9570, 4.5, 0.9, 30])
    assert dados["modas"] == [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0]
    assert dados["indicadores_numericas"] == [
        "leucocitos", "neutrofilos", "pcr", "leucocitos_urina", "peso",
    ]
    assert dados["indicadores_binarias"] == [
        "nausea", "disuria", "ped_rx_nivel_fid", "ped_rx_nivel_difuso",
        "leucocitose", "neutrofilia", "pcr_alterado", "leucocituria",
    ]
    assert len(dados["saidas"]) == 32
    assert dados["saidas"][-1] == "cat__sexo_M"
    assert dados["n_arvores"] == 500
    assert sum(len(a["esquerdo"]) for a in dados["arvores"]) == 14698


def test_montar_json_nao_exporta_contagem_nem_impureza(pipeline):
    arvore = montar_json(pipeline, SHA256_JOBLIB)["arvores"][0]

    assert set(arvore) == {"esquerdo", "direito", "variavel", "limiar", "prob"}


def test_serializar_e_deterministico_e_volta_ao_mesmo_double(pipeline):
    dados = montar_json(pipeline, SHA256_JOBLIB)

    primeira = serializar(dados)
    segunda = serializar(dados)
    relido = json.loads(primeira)

    assert primeira == segunda
    assert relido["arvores"][7]["limiar"] == dados["arvores"][7]["limiar"]


def test_exportar_modelo_recusa_joblib_com_outro_sha256(tmp_path):
    falso = tmp_path / "falso.joblib"
    falso.write_bytes(b"nao e o modelo")
    destino = tmp_path / "modelo.json"

    with pytest.raises(EstruturaInesperada, match="SHA-256"):
        exportar_modelo(falso, destino)
    assert not destino.exists()


def test_exportar_modelo_grava_json_e_devolve_o_sha256(tmp_path):
    destino = tmp_path / "modelo.json"

    sha = exportar_modelo(CAMINHO_JOBLIB, destino)

    assert sha == hashlib.sha256(destino.read_bytes()).hexdigest()


def test_json_publicado_igual_a_uma_exportacao_nova(tmp_path):
    sha_novo = exportar_modelo(CAMINHO_JOBLIB, tmp_path / "modelo.json")

    assert sha_novo == hashlib.sha256(CAMINHO_JSON.read_bytes()).hexdigest()
```

- [ ] **Passo 2: rodar e ver falhar.** `./.venv/bin/python -m pytest tests/python/test_exportar.py -v`. Esperado: erro de importação de `apendisite_conversao.exportar`.

- [ ] **Passo 3: escrever `exportar.py`.**

```python
"""Exporta o random forest do apendisite de .joblib para JSON."""

import hashlib
import json
import platform
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import scipy
import sklearn

from apendisite_conversao.excecoes import EstruturaInesperada
from apendisite_conversao.quadro import ENTRADAS

FORMATO = "apendisite-rf"
VERSAO_FORMATO = 1
VERSAO_MODELO = "1.0.0"
SHA256_JOBLIB = "ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858"
N_ARVORES = 500
N_SAIDAS = 32
NUMERICAS = ENTRADAS[:6]
BINARIAS = ENTRADAS[6:18]
INDICES_INDICADOR_NUMERICAS = [1, 2, 3, 4, 5]
INDICES_INDICADOR_BINARIAS = [0, 3, 6, 7, 8, 9, 10, 11]
CATEGORIAS_SEXO = ["F", "M"]
SEXO_UM = "M"


def _exigir(condicao: bool, o_que: str) -> None:
    if not condicao:
        raise EstruturaInesperada(f"estrutura inesperada: {o_que}")


def conferir_estrutura(pipeline) -> None:
    """Confere se o pipeline tem a estrutura que a exportação conhece.

    Args:
        pipeline: Pipeline do sklearn lido do .joblib.

    Raises:
        EstruturaInesperada: na primeira diferença encontrada.
    """
    _exigir([nome for nome, _ in pipeline.steps] == ["preproc", "clf"], "passos")
    _exigir(list(pipeline.feature_names_in_) == ENTRADAS, "ordem das 19 entradas")
    pre = pipeline.named_steps["preproc"]
    clf = pipeline.named_steps["clf"]
    blocos = [(nome, list(colunas)) for nome, _, colunas in pre.transformers_]
    esperado = [("num", NUMERICAS), ("bin", BINARIAS), ("cat", ["sexo"])]
    _exigir(blocos == esperado, "blocos do ColumnTransformer")
    num = pre.named_transformers_["num"]
    bina = pre.named_transformers_["bin"]
    cat = pre.named_transformers_["cat"]
    _exigir(num.strategy == "median" and num.add_indicator, "imputador numérico")
    _exigir(
        list(num.indicator_.features_) == INDICES_INDICADOR_NUMERICAS,
        "indicadores numéricos",
    )
    _exigir(
        bina.strategy == "most_frequent" and bina.add_indicator,
        "imputador binário",
    )
    _exigir(
        list(bina.indicator_.features_) == INDICES_INDICADOR_BINARIAS,
        "indicadores binários",
    )
    _exigir(
        not num.indicator_.error_on_new and not bina.indicator_.error_on_new,
        "error_on_new",
    )
    _exigir(not np.isnan(num.statistics_).any(), "medianas")
    _exigir(not np.isnan(bina.statistics_).any(), "modas")
    _exigir(
        [list(c) for c in cat.categories_] == [CATEGORIAS_SEXO],
        "categorias de sexo",
    )
    _exigir(
        cat.drop == "if_binary" and cat.handle_unknown == "ignore",
        "codificação de sexo",
    )
    _exigir(len(clf.estimators_) == N_ARVORES, "número de árvores")
    _exigir(list(clf.classes_) == [0, 1], "classes")
    _exigir(clf.n_features_in_ == N_SAIDAS, "número de colunas de saída")
    _exigir(len(pre.get_feature_names_out()) == N_SAIDAS, "nomes das saídas")


def _versoes() -> dict:
    return {
        "python": platform.python_version(),
        "sklearn": sklearn.__version__,
        "numpy": np.__version__,
        "scipy": scipy.__version__,
        "joblib": joblib.__version__,
        "pandas": pd.__version__,
    }


def _exportar_arvore(arvore) -> dict:
    valores = arvore.value[:, 0, :]
    prob = valores[:, 1] / valores.sum(axis=1)
    return {
        "esquerdo": [int(v) for v in arvore.children_left],
        "direito": [int(v) for v in arvore.children_right],
        "variavel": [int(v) for v in arvore.feature],
        "limiar": [float(v) for v in arvore.threshold],
        "prob": [float(v) for v in prob],
    }


def montar_json(pipeline, sha256_joblib: str) -> dict:
    """Monta o dicionário do modelo no formato lido pelo site.

    Args:
        pipeline: Pipeline do sklearn já conferido por conferir_estrutura.
        sha256_joblib: SHA-256 do .joblib de origem.

    Returns:
        Dicionário com metadados, imputação, ordem das 32 saídas e as 500
        árvores em listas paralelas.
    """
    pre = pipeline.named_steps["preproc"]
    clf = pipeline.named_steps["clf"]
    num = pre.named_transformers_["num"]
    bina = pre.named_transformers_["bin"]
    return {
        "formato": FORMATO,
        "versao_formato": VERSAO_FORMATO,
        "versao_modelo": VERSAO_MODELO,
        "sha256_joblib": sha256_joblib,
        "versoes": _versoes(),
        "entradas": ENTRADAS,
        "numericas": NUMERICAS,
        "medianas": [float(v) for v in num.statistics_],
        "indicadores_numericas": [NUMERICAS[i] for i in INDICES_INDICADOR_NUMERICAS],
        "binarias": BINARIAS,
        "modas": [float(v) for v in bina.statistics_],
        "indicadores_binarias": [BINARIAS[i] for i in INDICES_INDICADOR_BINARIAS],
        "sexo_um": SEXO_UM,
        "saidas": [str(nome) for nome in pre.get_feature_names_out()],
        "n_arvores": len(clf.estimators_),
        "arvores": [_exportar_arvore(e.tree_) for e in clf.estimators_],
    }


def serializar(dados: dict) -> bytes:
    """Serializa o modelo em JSON compacto, determinístico e sem NaN.

    Args:
        dados: dicionário de montar_json.

    Returns:
        Bytes UTF-8 terminados em quebra de linha.
    """
    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    return (texto + "\n").encode("utf-8")


def exportar_modelo(caminho_joblib: Path, caminho_json: Path) -> str:
    """Confere o .joblib, exporta o JSON e devolve o SHA-256 do JSON.

    Args:
        caminho_joblib: caminho do .joblib publicado.
        caminho_json: destino do JSON.

    Returns:
        SHA-256 hexadecimal do JSON gravado.

    Raises:
        EstruturaInesperada: se o SHA-256 do .joblib ou a estrutura diferem
            do esperado. Nesse caso nada é gravado.
    """
    conteudo = caminho_joblib.read_bytes()
    sha = hashlib.sha256(conteudo).hexdigest()
    if sha != SHA256_JOBLIB:
        raise EstruturaInesperada(f"SHA-256 do .joblib difere do esperado: {sha}")
    pipeline = joblib.load(caminho_joblib)
    conferir_estrutura(pipeline)
    dados = serializar(montar_json(pipeline, sha))
    caminho_json.parent.mkdir(parents=True, exist_ok=True)
    caminho_json.write_bytes(dados)
    return hashlib.sha256(dados).hexdigest()
```

- [ ] **Passo 4: escrever `run.py` só com o subcomando `exportar`.** Os outros entram nas tarefas 1.5 e 1.7.

```python
"""Linha de comando da conversão do apendisite.

Uso:
    ./.venv/bin/python run.py exportar
    ./.venv/bin/python run.py sinteticos
    ./.venv/bin/python run.py paridade-local --dados <pasta com os .pkl>
"""

import argparse
import hashlib
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ / "src"))

from apendisite_conversao.excecoes import ErroApendisite  # noqa: E402
from apendisite_conversao.exportar import exportar_modelo  # noqa: E402

CAMINHO_JOBLIB = RAIZ / "models" / "random_forest.joblib"
CAMINHO_JSON = RAIZ / "public" / "modelo" / "random_forest_v1.0.0.json"
CAMINHO_CASOS = RAIZ / "tests" / "dados" / "casos_sinteticos_v1.0.0.json"
CAMINHO_RELATORIO_659 = RAIZ / "docs" / "paridade_659.md"


def _sha256(caminho: Path) -> str:
    return hashlib.sha256(caminho.read_bytes()).hexdigest()


def _exportar(_: argparse.Namespace) -> int:
    sha = exportar_modelo(CAMINHO_JOBLIB, CAMINHO_JSON)
    print(f"JSON gravado em {CAMINHO_JSON.relative_to(RAIZ)}")
    print(f"SHA-256 do JSON: {sha}")
    return 0


def _montar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Conversão do apendisite")
    sub = parser.add_subparsers(dest="comando", required=True)
    sub.add_parser("exportar", help="exporta o .joblib para JSON").set_defaults(
        funcao=_exportar
    )
    return parser


def main() -> int:
    """Ponto de entrada da linha de comando."""
    args = _montar_parser().parse_args()
    try:
        return args.funcao(args)
    except ErroApendisite as erro:
        print(f"erro: {erro}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Passo 5: exportar o JSON.** Eu rodo `./.venv/bin/python run.py exportar`. Esperado: `JSON gravado em public/modelo/random_forest_v1.0.0.json` e o SHA-256, que anoto para o model card. Tamanho esperado perto de 434 KB (`ls -l public/modelo/`).

- [ ] **Passo 6: rodar e ver passar.** `./.venv/bin/python -m pytest tests/python/test_exportar.py -v`. Esperado: 9 passaram.

- [ ] **Passo 7: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add src/apendisite_conversao/exportar.py run.py tests/python/test_exportar.py public/modelo/random_forest_v1.0.0.json && git commit -m "feat: exportar o random forest para JSON com conferência da estrutura"
```

### Tarefa 1.3: avaliador de referência em Python puro

**Arquivos:**
- Criar: `src/apendisite_conversao/referencia.py`
- Teste: `tests/python/test_referencia.py`

**Interfaces:**
- Consome: o JSON da tarefa 1.2, `montar_quadro`.
- Produz: `transformar(modelo: dict, entrada: dict) -> list[float]` (32 valores) e `calcular_escore(modelo: dict, entrada: dict) -> float`. É a prova de que o JSON reproduz o sklearn antes de existir JavaScript.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/python/test_referencia.py`:

```python
"""Testes do avaliador de referência em Python puro, a partir do JSON."""

import numpy as np

from apendisite_conversao.quadro import ENTRADAS, montar_quadro
from apendisite_conversao.referencia import calcular_escore, transformar

BINARIAS = ENTRADAS[6:18]


def _entradas_aleatorias(n: int, semente: int) -> list[dict]:
    rng = np.random.default_rng(semente)
    entradas = []
    for _ in range(n):
        leucocitos = float(rng.integers(500, 30001))
        entrada = {
            "idade_anos": float(rng.integers(1, 16)),
            "leucocitos": leucocitos,
            "neutrofilos": float(rng.integers(0, int(leucocitos) + 1)),
            "pcr": round(float(rng.uniform(0, 30)), 2),
            "leucocitos_urina": round(float(rng.uniform(0, 50)), 1),
            "peso": round(float(rng.uniform(8, 80)), 1),
            "sexo": str(rng.choice(["M", "F"])),
        }
        for nome in BINARIAS:
            entrada[nome] = float(rng.integers(0, 2))
        if rng.random() < 0.3:
            entrada[str(rng.choice(ENTRADAS[:18]))] = None
        entradas.append(entrada)
    return entradas


def test_transformar_igual_ao_preprocessamento_do_sklearn(pipeline, modelo_json):
    entradas = _entradas_aleatorias(60, semente=7)
    esperado = pipeline.named_steps["preproc"].transform(montar_quadro(entradas))
    esperado = esperado.toarray() if hasattr(esperado, "toarray") else esperado

    obtido = np.array([transformar(modelo_json, e) for e in entradas])

    assert np.array_equal(obtido, esperado)


def test_transformar_com_tudo_faltante_usa_medianas_modas_e_indicadores(
    modelo_json,
):
    entrada = {nome: None for nome in ENTRADAS}

    x = transformar(modelo_json, entrada)

    assert x[:6] == modelo_json["medianas"]
    assert x[6:11] == [1.0] * 5
    assert x[11:23] == modelo_json["modas"]
    assert x[23:31] == [1.0] * 8
    assert x[31] == 0.0


def test_calcular_escore_igual_ao_sklearn_em_300_casos(pipeline, modelo_json):
    entradas = _entradas_aleatorias(300, semente=11)
    esperado = pipeline.predict_proba(montar_quadro(entradas))[:, 1]

    obtido = np.array([calcular_escore(modelo_json, e) for e in entradas])

    assert np.max(np.abs(obtido - esperado)) <= 1e-12
```

- [ ] **Passo 2: rodar e ver falhar.** `./.venv/bin/python -m pytest tests/python/test_referencia.py -v`. Esperado: erro de importação de `apendisite_conversao.referencia`.

- [ ] **Passo 3: escrever `referencia.py`.**

```python
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
```

- [ ] **Passo 4: rodar e ver passar.** `./.venv/bin/python -m pytest tests/python/test_referencia.py -v`. Esperado: 3 passaram. Se o teste da transformação falhar, parar: a ordem das colunas ou a imputação está errada, e nada adiante vale.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add src/apendisite_conversao/referencia.py tests/python/test_referencia.py && git commit -m "test: provar o JSON contra o sklearn com avaliador em Python puro"
```

### Tarefa 1.4: motor de cálculo `modelo.js`

**Arquivos:**
- Criar: `public/js/modelo.js`
- Teste: `tests/js/modelo.test.js`

**Interfaces:**
- Consome: o JSON da tarefa 1.2.
- Produz (usado por `formato.js`, `app.js`, `scripts/avaliar_lote.mjs` e os testes): `CORTE_EQUILIBRIO`, `CORTE_ALTA_SENSIBILIDADE`, `FREQUENCIAS` (`{baixa:{operadas,total}, intermediaria:..., alta:...}`), `class ErroModelo`, `carregarModelo(dados) -> modelo`, `transformar(modelo, entrada) -> number[]` (32), `calcularEscore(modelo, entrada) -> number`, `classificar(escore) -> {equilibrio: boolean, altaSensibilidade: boolean, faixa: 'baixa'|'intermediaria'|'alta'}`. `entrada` é um objeto com as 19 chaves do JSON (`idade_anos` ... `sexo`), com `null` para faltante e `sexo` igual a `'M'` ou `'F'`.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/modelo.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CORTE_ALTA_SENSIBILIDADE,
  CORTE_EQUILIBRIO,
  ErroModelo,
  FREQUENCIAS,
  calcularEscore,
  carregarModelo,
  classificar,
  transformar,
} from '../../public/js/modelo.js';
import { lerJson, vizinhoAbaixo } from './auxiliares.js';

const json = await lerJson('public/modelo/random_forest_v1.0.0.json');
const modelo = carregarModelo(json);
const TODAS_NULAS = Object.fromEntries(modelo.entradas.map((nome) => [nome, null]));

// Floresta de uma árvore só, com a raiz cortando a idade em 1,0.
const MINIMO = {
  numericas: ['idade_anos'],
  medianas: [9],
  indicadores_numericas: [],
  binarias: [],
  modas: [],
  indicadores_binarias: [],
  sexo_um: 'M',
  n_arvores: 1,
  arvores: [
    { esquerdo: [1, -1, -1], direito: [2, -1, -1], variavel: [0, -2, -2], limiar: [1.0, -2, -2], prob: [0.5, 0.2, 0.8] },
  ],
};

test('carregarModelo_recusa_formato_desconhecido', () => {
  assert.throws(() => carregarModelo({ ...json, formato: 'outro' }), ErroModelo);
});

test('carregarModelo_recusa_floresta_com_499_arvores', () => {
  assert.throws(() => carregarModelo({ ...json, arvores: json.arvores.slice(1) }), ErroModelo);
});

test('carregarModelo_recusa_31_saidas', () => {
  assert.throws(() => carregarModelo({ ...json, saidas: json.saidas.slice(1) }), ErroModelo);
});

test('transformar_com_tudo_faltante_usa_medianas_modas_e_indicadores', () => {
  const x = transformar(modelo, TODAS_NULAS);
  assert.equal(x.length, 32);
  assert.deepEqual(x.slice(0, 6), modelo.medianas);
  assert.deepEqual(x.slice(6, 11), [1, 1, 1, 1, 1]);
  assert.deepEqual(x.slice(11, 23), modelo.modas);
  assert.deepEqual(x.slice(23, 31), [1, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(x[31], 0);
});

test('transformar_idade_faltante_nao_tem_indicador', () => {
  const entrada = { ...TODAS_NULAS, leucocitos: 1, neutrofilos: 1, pcr: 1, leucocitos_urina: 1, peso: 1 };
  const x = transformar(modelo, entrada);
  assert.equal(x[0], 9);
  assert.deepEqual(x.slice(6, 11), [0, 0, 0, 0, 0]);
});

test('transformar_codifica_sexo_m_como_1_e_os_demais_como_0', () => {
  assert.equal(transformar(modelo, { ...TODAS_NULAS, sexo: 'M' })[31], 1);
  assert.equal(transformar(modelo, { ...TODAS_NULAS, sexo: 'F' })[31], 0);
  assert.equal(transformar(modelo, TODAS_NULAS)[31], 0);
});

test('calcularEscore_vai_para_a_esquerda_no_limiar_exato', () => {
  assert.equal(calcularEscore(MINIMO, { idade_anos: 1.0, sexo: 'F' }), 0.2);
});

test('calcularEscore_converte_para_float32_antes_de_comparar', () => {
  // 1.00000001 fica acima de 1 em double, mas vira 1 em float32 e vai para a esquerda.
  assert.equal(calcularEscore(MINIMO, { idade_anos: 1.00000001, sexo: 'F' }), 0.2);
  assert.equal(calcularEscore(MINIMO, { idade_anos: 1.0000002, sexo: 'F' }), 0.8);
});

test('calcularEscore_com_tudo_faltante_fica_entre_0_e_1', () => {
  const escore = calcularEscore(modelo, TODAS_NULAS);
  assert.ok(escore >= 0 && escore <= 1);
});

test('cortes_escritos_com_tres_casas', () => {
  assert.equal(CORTE_EQUILIBRIO, 0.503);
  assert.equal(CORTE_ALTA_SENSIBILIDADE, 0.358);
});

test('classificar_no_corte_exato_e_positivo', () => {
  assert.deepEqual(classificar(CORTE_EQUILIBRIO), { equilibrio: true, altaSensibilidade: true, faixa: 'alta' });
  assert.deepEqual(classificar(CORTE_ALTA_SENSIBILIDADE), { equilibrio: false, altaSensibilidade: true, faixa: 'intermediaria' });
});

test('classificar_logo_abaixo_do_corte_e_negativo', () => {
  assert.deepEqual(classificar(vizinhoAbaixo(CORTE_EQUILIBRIO)), { equilibrio: false, altaSensibilidade: true, faixa: 'intermediaria' });
  assert.deepEqual(classificar(vizinhoAbaixo(CORTE_ALTA_SENSIBILIDADE)), { equilibrio: false, altaSensibilidade: false, faixa: 'baixa' });
});

test('frequencias_da_validacao_em_botucatu', () => {
  assert.deepEqual(FREQUENCIAS, {
    baixa: { operadas: 1, total: 120 },
    intermediaria: { operadas: 8, total: 70 },
    alta: { operadas: 67, total: 130 },
  });
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/modelo.test.js`. Esperado: erro de módulo não encontrado.

- [ ] **Passo 3: escrever `modelo.js`.**

```js
// Motor de cálculo do apendisite. Funções puras, sem DOM e sem rede.
// O mesmo arquivo roda no navegador e no Node.

export const FORMATO_MODELO = 'apendisite-rf';
export const VERSAO_FORMATO = 1;
export const N_ARVORES = 500;
export const N_SAIDAS = 32;
export const CORTE_EQUILIBRIO = 0.503;
export const CORTE_ALTA_SENSIBILIDADE = 0.358;
export const FREQUENCIAS = Object.freeze({
  baixa: Object.freeze({ operadas: 1, total: 120 }),
  intermediaria: Object.freeze({ operadas: 8, total: 70 }),
  alta: Object.freeze({ operadas: 67, total: 130 }),
});

export class ErroModelo extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroModelo';
  }
}

/** Confere o JSON exportado e o devolve pronto para o cálculo. */
export function carregarModelo(dados) {
  if (dados?.formato !== FORMATO_MODELO) throw new ErroModelo('formato desconhecido');
  if (dados.versao_formato !== VERSAO_FORMATO) throw new ErroModelo('versão de formato desconhecida');
  if (!Array.isArray(dados.arvores) || dados.arvores.length !== N_ARVORES || dados.n_arvores !== N_ARVORES) {
    throw new ErroModelo('a floresta precisa de 500 árvores');
  }
  if (!Array.isArray(dados.saidas) || dados.saidas.length !== N_SAIDAS) {
    throw new ErroModelo('o pré-processamento precisa de 32 saídas');
  }
  return dados;
}

function faltante(valor) {
  return valor === null || valor === undefined || Number.isNaN(valor);
}

/** Transforma as 19 entradas nas 32 colunas, com a imputação do sklearn. */
export function transformar(modelo, entrada) {
  const saida = [];
  modelo.numericas.forEach((nome, i) => {
    saida.push(faltante(entrada[nome]) ? modelo.medianas[i] : entrada[nome]);
  });
  for (const nome of modelo.indicadores_numericas) saida.push(faltante(entrada[nome]) ? 1 : 0);
  modelo.binarias.forEach((nome, i) => {
    saida.push(faltante(entrada[nome]) ? modelo.modas[i] : entrada[nome]);
  });
  for (const nome of modelo.indicadores_binarias) saida.push(faltante(entrada[nome]) ? 1 : 0);
  saida.push(entrada.sexo === modelo.sexo_um ? 1 : 0);
  return saida;
}

/**
 * Calcula o escore: cada coluna passa por Math.fround, porque o sklearn
 * converte a entrada da floresta para float32. Esquerda se valor <= limiar.
 */
export function calcularEscore(modelo, entrada) {
  const x = transformar(modelo, entrada).map((valor) => Math.fround(valor));
  let soma = 0;
  for (const { esquerdo, direito, variavel, limiar, prob } of modelo.arvores) {
    let no = 0;
    while (esquerdo[no] !== -1) {
      no = x[variavel[no]] <= limiar[no] ? esquerdo[no] : direito[no];
    }
    soma += prob[no];
  }
  return soma / modelo.n_arvores;
}

/** Classifica o escore cheio nos dois cortes e na faixa. */
export function classificar(escore) {
  const equilibrio = escore >= CORTE_EQUILIBRIO;
  const altaSensibilidade = escore >= CORTE_ALTA_SENSIBILIDADE;
  let faixa = 'baixa';
  if (equilibrio) faixa = 'alta';
  else if (altaSensibilidade) faixa = 'intermediaria';
  return { equilibrio, altaSensibilidade, faixa };
}
```

- [ ] **Passo 4: rodar e ver passar.** `npm test`. Esperado: todos os testes de `modelo.test.js` e o de fumaça passaram.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/modelo.js tests/js/modelo.test.js && git commit -m "feat: calcular o escore no navegador com conversão para float32"
```

### Tarefa 1.5: casos sintéticos

**Arquivos:**
- Criar: `src/apendisite_conversao/sinteticos.py`, `tests/dados/casos_sinteticos_v1.0.0.json` (gerado)
- Modificar: `run.py` (subcomando `sinteticos`)
- Teste: `tests/python/test_sinteticos.py`

**Interfaces:**
- Consome: JSON da tarefa 1.2, `montar_quadro`, `ENTRADAS`.
- Produz: `SEMENTE = 20261023`, `gerar_casos(modelo_json: dict, semente: int) -> list[dict]` (cada caso `{"grupo", "entrada"}`), `anotar_esperados(pipeline, casos) -> list[dict]` (acrescenta `escore`, `equilibrio`, `alta_sensibilidade`), `gravar_casos(caminho: Path, casos, semente: int, sha256_modelo_json: str) -> None`. Formato do arquivo: `{"versao_modelo", "gerador", "semente", "sha256_modelo_json", "n", "casos": [...]}`. Grupos: `sorteado` (1.000), `limiar` (3 valores por limiar, até 33 limiares por variável contínua), `limite` (200) e `faltante` (200).

- [ ] **Passo 1: escrever o teste que falha.**

`tests/python/test_sinteticos.py`:

```python
"""Testes do gerador de casos sintéticos."""

import hashlib
import json
from collections import Counter

import numpy as np
from conftest import CAMINHO_CASOS, CAMINHO_JSON

from apendisite_conversao.quadro import ENTRADAS, montar_quadro
from apendisite_conversao.sinteticos import (
    N_LIMIARES_POR_VARIAVEL,
    SEMENTE,
    _derivar,
    _limiares_por_variavel,
    _vizinhos_float32,
    gerar_casos,
)


def test_gerar_casos_quantidade_por_grupo(modelo_json):
    limiares = _limiares_por_variavel(modelo_json)
    esperado_limiar = 3 * sum(
        min(N_LIMIARES_POR_VARIAVEL, len(v)) for v in limiares.values()
    )

    contagem = Counter(c["grupo"] for c in gerar_casos(modelo_json, SEMENTE))

    assert contagem == {
        "sorteado": 1000,
        "limiar": esperado_limiar,
        "limite": 200,
        "faltante": 200,
    }


def test_gerar_casos_e_deterministico_com_a_mesma_semente(modelo_json):
    assert gerar_casos(modelo_json, SEMENTE) == gerar_casos(modelo_json, SEMENTE)


def test_gerar_casos_traz_as_19_entradas_em_cada_caso(modelo_json):
    casos = gerar_casos(modelo_json, SEMENTE)

    assert all(list(c["entrada"]) == ENTRADAS for c in casos)


def test_vizinhos_float32_cercam_um_limiar_representavel():
    abaixo, acima, double_acima = _vizinhos_float32(9999.5)

    assert abaixo == 9999.5
    assert acima > 9999.5 and float(np.float32(acima)) == acima
    assert double_acima > 9999.5
    assert float(np.float32(double_acima)) == abaixo


def test_vizinhos_float32_cercam_um_limiar_nao_representavel():
    limiar = 0.85
    abaixo, acima, _ = _vizinhos_float32(limiar)

    assert abaixo <= limiar < acima
    assert float(np.float32(abaixo)) == abaixo


def test_derivar_usa_maior_estrito_e_propaga_faltante():
    caso = {"leucocitos": 10000.0, "neutrofilos": 7501.0, "pcr": None,
            "leucocitos_urina": 10.0}

    _derivar(caso)

    assert caso["leucocitose"] == 0.0
    assert caso["neutrofilia"] == 1.0
    assert caso["pcr_alterado"] is None
    assert caso["leucocituria"] == 0.0


def test_arquivo_publicado_bate_com_o_sklearn_e_com_o_json_atual(pipeline):
    arquivo = json.loads(CAMINHO_CASOS.read_text(encoding="utf-8"))
    sha_json = hashlib.sha256(CAMINHO_JSON.read_bytes()).hexdigest()
    casos = arquivo["casos"]

    escores = pipeline.predict_proba(montar_quadro([c["entrada"] for c in casos]))

    assert arquivo["sha256_modelo_json"] == sha_json
    assert arquivo["n"] == len(casos)
    assert [float(e) for e in escores[:, 1]] == [c["escore"] for c in casos]
```

- [ ] **Passo 2: rodar e ver falhar.** `./.venv/bin/python -m pytest tests/python/test_sinteticos.py -v`. Esperado: erro de importação de `apendisite_conversao.sinteticos`.

- [ ] **Passo 3: escrever `sinteticos.py`.**

```python
"""Gera os casos sintéticos da paridade publicada (spec, seção 11)."""

import json
from pathlib import Path

import numpy as np

from apendisite_conversao.exportar import VERSAO_MODELO
from apendisite_conversao.quadro import ENTRADAS, montar_quadro

SEMENTE = 20261023
N_SORTEADOS = 1000
N_LIMIARES_POR_VARIAVEL = 33
N_POR_PAR_DE_LIMITE = 10
N_FALTANTES = 200
CORTE_EQUILIBRIO = 0.503
CORTE_ALTA_SENSIBILIDADE = 0.358
CONTINUAS = [
    "idade_anos", "leucocitos", "neutrofilos", "pcr", "leucocitos_urina", "peso",
]
BINARIAS_FORMULARIO = [
    "nausea", "emese", "febre", "disuria", "ped_dor_fid", "ped_dor_difusa",
]
RAIO_X = ["ped_rx_nivel_fid", "ped_rx_nivel_difuso"]
DERIVADAS = {
    "leucocitos": ("leucocitose", 10000.0),
    "neutrofilos": ("neutrofilia", 7500.0),
    "pcr": ("pcr_alterado", 5.0),
    "leucocitos_urina": ("leucocituria", 10.0),
}
PARES_DE_LIMITE = [
    ("leucocitos", 10000.0), ("leucocitos", 10001.0),
    ("leucocitos", 500.0), ("leucocitos", 60000.0),
    ("neutrofilos", 7500.0), ("neutrofilos", 7501.0),
    ("neutrofilos", 0.0), ("neutrofilos", 50000.0),
    ("pcr", 5.0), ("pcr", 5.01), ("pcr", 0.0), ("pcr", 60.0),
    ("leucocitos_urina", 10.0), ("leucocitos_urina", 10.1),
    ("leucocitos_urina", 0.0), ("leucocitos_urina", 500.0),
    ("idade_anos", 2.0), ("idade_anos", 14.0), ("peso", 8.0), ("peso", 120.0),
]
FALTANTES_POSSIVEIS = CONTINUAS + BINARIAS_FORMULARIO
GERADOR = "run.py sinteticos"


def _derivar(caso: dict) -> dict:
    """Recalcula as quatro derivadas com > estrito. Origem faltante vira None."""
    for origem, (derivada, limite) in DERIVADAS.items():
        valor = caso[origem]
        caso[derivada] = None if valor is None else float(valor > limite)
    return caso


def _log_uniforme(rng: np.random.Generator, minimo: float, maximo: float) -> float:
    return float(10 ** rng.uniform(np.log10(minimo), np.log10(maximo)))


def _sortear_caso(rng: np.random.Generator) -> dict:
    leucocitos = float(round(_log_uniforme(rng, 500, 60000)))
    caso = {
        "idade_anos": float(rng.integers(2, 15)),
        "leucocitos": leucocitos,
        "neutrofilos": float(round(leucocitos * rng.uniform(0.05, 0.95))),
        "pcr": round(_log_uniforme(rng, 0.01, 60), 2),
        "leucocitos_urina": round(_log_uniforme(rng, 0.1, 500), 1),
        "peso": round(float(rng.uniform(8, 120)), 1),
        "sexo": str(rng.choice(["M", "F"])),
    }
    for nome in BINARIAS_FORMULARIO:
        caso[nome] = float(rng.integers(0, 2))
    for nome in RAIO_X:
        caso[nome] = [0.0, 1.0, None][int(rng.integers(0, 3))]
    return _derivar(caso)


def _limiares_por_variavel(modelo_json: dict) -> dict[str, list[float]]:
    """Reúne os limiares distintos usados em cada variável contínua."""
    indices = {
        modelo_json["saidas"].index(f"num__{nome}"): nome for nome in CONTINUAS
    }
    limiares: dict[str, set[float]] = {nome: set() for nome in CONTINUAS}
    for arvore in modelo_json["arvores"]:
        for variavel, limiar in zip(arvore["variavel"], arvore["limiar"]):
            if variavel in indices:
                limiares[indices[variavel]].add(limiar)
    return {nome: sorted(valores) for nome, valores in limiares.items()}


def _vizinhos_float32(limiar: float) -> list[float]:
    """Devolve o float32 logo abaixo ou igual, o float32 logo acima e o double
    logo acima do limiar. O terceiro só fica do lado certo com Math.fround."""
    abaixo = np.float32(limiar)
    if float(abaixo) > limiar:
        abaixo = np.nextafter(abaixo, np.float32(-np.inf))
    acima = np.nextafter(abaixo, np.float32(np.inf))
    double_acima = float(np.nextafter(limiar, np.inf))
    return [float(abaixo), float(acima), double_acima]


def _casos_nos_limiares(rng: np.random.Generator, modelo_json: dict) -> list[dict]:
    casos = []
    for nome, limiares in _limiares_por_variavel(modelo_json).items():
        quantos = min(N_LIMIARES_POR_VARIAVEL, len(limiares))
        escolhidos = sorted(rng.choice(limiares, size=quantos, replace=False).tolist())
        for limiar in escolhidos:
            for valor in _vizinhos_float32(limiar):
                caso = _sortear_caso(rng)
                caso[nome] = valor
                casos.append(_derivar(caso))
    return casos


def _casos_nos_limites(rng: np.random.Generator) -> list[dict]:
    casos = []
    for nome, valor in PARES_DE_LIMITE:
        for _ in range(N_POR_PAR_DE_LIMITE):
            caso = _sortear_caso(rng)
            caso[nome] = valor
            casos.append(_derivar(caso))
    return casos


def _casos_com_faltantes(rng: np.random.Generator) -> list[dict]:
    casos = []
    for _ in range(N_FALTANTES):
        caso = _sortear_caso(rng)
        quantos = int(rng.integers(1, 5))
        for nome in rng.choice(FALTANTES_POSSIVEIS, size=quantos, replace=False):
            caso[str(nome)] = None
        casos.append(_derivar(caso))
    return casos


def gerar_casos(modelo_json: dict, semente: int = SEMENTE) -> list[dict]:
    """Gera os casos sintéticos nos quatro grupos do spec.

    Args:
        modelo_json: modelo exportado, de onde saem os limiares das árvores.
        semente: semente do gerador, gravada no arquivo publicado.

    Returns:
        Lista de casos, cada um com o grupo e as 19 entradas na ordem do modelo.
    """
    rng = np.random.default_rng(semente)
    grupos = [
        ("sorteado", [_sortear_caso(rng) for _ in range(N_SORTEADOS)]),
        ("limiar", _casos_nos_limiares(rng, modelo_json)),
        ("limite", _casos_nos_limites(rng)),
        ("faltante", _casos_com_faltantes(rng)),
    ]
    return [
        {"grupo": grupo, "entrada": {nome: caso[nome] for nome in ENTRADAS}}
        for grupo, casos in grupos
        for caso in casos
    ]


def anotar_esperados(pipeline, casos: list[dict]) -> list[dict]:
    """Acrescenta a cada caso o escore do sklearn e a classe nos dois cortes.

    Args:
        pipeline: Pipeline do sklearn.
        casos: saída de gerar_casos.

    Returns:
        Casos com escore, equilibrio e alta_sensibilidade.
    """
    quadro = montar_quadro([c["entrada"] for c in casos])
    escores = pipeline.predict_proba(quadro)[:, 1]
    return [
        {
            **caso,
            "escore": float(escore),
            "equilibrio": bool(escore >= CORTE_EQUILIBRIO),
            "alta_sensibilidade": bool(escore >= CORTE_ALTA_SENSIBILIDADE),
        }
        for caso, escore in zip(casos, escores)
    ]


def gravar_casos(
    caminho: Path, casos: list[dict], semente: int, sha256_modelo_json: str
) -> None:
    """Grava os casos com os metadados que o teste em JS confere.

    Args:
        caminho: destino do arquivo JSON.
        casos: saída de anotar_esperados.
        semente: semente usada em gerar_casos.
        sha256_modelo_json: SHA-256 do JSON do modelo usado.
    """
    dados = {
        "versao_modelo": VERSAO_MODELO,
        "gerador": GERADOR,
        "semente": semente,
        "sha256_modelo_json": sha256_modelo_json,
        "n": len(casos),
        "casos": casos,
    }
    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(texto + "\n", encoding="utf-8")
```

- [ ] **Passo 4: acrescentar o subcomando `sinteticos` ao `run.py`.** Novos imports logo abaixo dos que existem:

```python
import json  # junto dos imports da biblioteca padrão

import joblib  # noqa: E402

from apendisite_conversao.sinteticos import (  # noqa: E402
    SEMENTE,
    anotar_esperados,
    gerar_casos,
    gravar_casos,
)
```

Nova função, antes de `_montar_parser`:

```python
def _sinteticos(_: argparse.Namespace) -> int:
    modelo_json = json.loads(CAMINHO_JSON.read_text(encoding="utf-8"))
    pipeline = joblib.load(CAMINHO_JOBLIB)
    casos = anotar_esperados(pipeline, gerar_casos(modelo_json, SEMENTE))
    gravar_casos(CAMINHO_CASOS, casos, SEMENTE, _sha256(CAMINHO_JSON))
    print(f"{len(casos)} casos gravados em {CAMINHO_CASOS.relative_to(RAIZ)}")
    return 0
```

Em `_montar_parser`, depois do `exportar`:

```python
    sub.add_parser("sinteticos", help="gera os casos sintéticos").set_defaults(
        funcao=_sinteticos
    )
```

- [ ] **Passo 5: gerar o arquivo.** Eu rodo `./.venv/bin/python run.py sinteticos`. Esperado: perto de 2.000 casos (1.000 + limiar + 200 + 200).

- [ ] **Passo 6: rodar e ver passar.** `./.venv/bin/python -m pytest tests/python/test_sinteticos.py -v`. Esperado: 7 passaram.

- [ ] **Passo 7: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add src/apendisite_conversao/sinteticos.py run.py tests/python/test_sinteticos.py tests/dados/casos_sinteticos_v1.0.0.json && git commit -m "feat: gerar os casos sintéticos da paridade com semente fixa"
```

### Tarefa 1.6: paridade sintética em JavaScript e ponte Python para JS

**Arquivos:**
- Criar: `scripts/avaliar_lote.mjs`, `src/apendisite_conversao/paridade.py`
- Teste: `tests/js/paridade_sintetica.test.js`, `tests/python/test_paridade.py`

**Interfaces:**
- Consome: `modelo.js`, o arquivo de casos, `referencia.py`.
- Produz: `scripts/avaliar_lote.mjs <modelo.json> <entradas.json> <saida.json>` (grava a lista de escores). Em `paridade.py`: `TOLERANCIA = 1e-12`, `ResumoParidade` (`n`, `dif_maxima`, `iguais_bit_a_bit`, `discordancias_equilibrio`, `discordancias_alta_sensibilidade`, propriedade `aprovado`), `comparar(esperados, obtidos) -> ResumoParidade`, `avaliar_em_js(entradas, caminho_modelo, raiz) -> list[float]`, `quadro_para_entradas(quadro) -> list[dict]`, `contar_padroes_faltantes(quadro) -> dict[str, int]`, `carregar_dados_locais(pasta) -> pd.DataFrame`, `escrever_relatorio_659(...)`.

- [ ] **Passo 1: escrever o teste JS que falha.**

`tests/js/paridade_sintetica.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { calcularEscore, carregarModelo, classificar, transformar } from '../../public/js/modelo.js';
import { lerJson, lerTexto } from './auxiliares.js';

const TOLERANCIA = 1e-12;
const textoModelo = await lerTexto('public/modelo/random_forest_v1.0.0.json');
const modelo = carregarModelo(JSON.parse(textoModelo));
const arquivo = await lerJson('tests/dados/casos_sinteticos_v1.0.0.json');

function escoreSemFround(entrada) {
  const x = transformar(modelo, entrada);
  let soma = 0;
  for (const { esquerdo, direito, variavel, limiar, prob } of modelo.arvores) {
    let no = 0;
    while (esquerdo[no] !== -1) no = x[variavel[no]] <= limiar[no] ? esquerdo[no] : direito[no];
    soma += prob[no];
  }
  return soma / modelo.n_arvores;
}

test('arquivo_de_casos_foi_gerado_com_este_json', () => {
  const sha = createHash('sha256').update(textoModelo).digest('hex');
  assert.equal(arquivo.sha256_modelo_json, sha);
  assert.equal(arquivo.n, arquivo.casos.length);
});

test('paridade_sintetica_js_igual_ao_sklearn_em_todos_os_casos', () => {
  let difMaxima = 0;
  let bitABit = 0;
  const reprovados = [];
  arquivo.casos.forEach((caso, i) => {
    const escore = calcularEscore(modelo, caso.entrada);
    const dif = Math.abs(escore - caso.escore);
    const classe = classificar(escore);
    difMaxima = Math.max(difMaxima, dif);
    if (escore === caso.escore) bitABit += 1;
    if (dif > TOLERANCIA || classe.equilibrio !== caso.equilibrio || classe.altaSensibilidade !== caso.alta_sensibilidade) {
      reprovados.push(i);
    }
  });
  console.log(`casos ${arquivo.casos.length}, diferença máxima ${difMaxima}, iguais bit a bit ${bitABit}`);
  assert.deepEqual(reprovados, []);
});

test('casos_nos_limiares_pegam_a_falta_do_fround', () => {
  const limiares = arquivo.casos.filter((caso) => caso.grupo === 'limiar');
  const divergentes = limiares.filter((caso) => Math.abs(escoreSemFround(caso.entrada) - caso.escore) > TOLERANCIA);
  console.log(`sem Math.fround, ${divergentes.length} de ${limiares.length} casos nos limiares divergem`);
  assert.ok(divergentes.length > 0);
});
```

- [ ] **Passo 2: rodar.** `node --test tests/js/paridade_sintetica.test.js`. Esperado: os três passam já com o `modelo.js` da tarefa 1.4, porque o arquivo de casos existe. Se `paridade_sintetica...` falhar, é defeito do motor: parar e depurar com a skill `superpowers:systematic-debugging`. Se `casos_nos_limiares...` falhar, o grupo `limiar` não discrimina a falta do `fround` e precisa de outros valores antes de seguir (lição de `2026-10-15-paridade-validada-so-no-caso-facil.md`).

- [ ] **Passo 3: escrever o teste Python que falha.**

`tests/python/test_paridade.py`:

```python
"""Testes da comparação JS contra sklearn e do relatório agregado."""

import math
from datetime import date

import pandas as pd
import pytest
from conftest import CAMINHO_JSON

from apendisite_conversao.excecoes import DadosLocaisAusentes
from apendisite_conversao.paridade import (
    avaliar_em_js,
    carregar_dados_locais,
    comparar,
    contar_padroes_faltantes,
    escrever_relatorio_659,
    quadro_para_entradas,
)
from apendisite_conversao.quadro import ENTRADAS
from apendisite_conversao.referencia import calcular_escore


def test_comparar_aprova_diferenca_minima_sem_discordancia():
    resumo = comparar([0.2, 0.6], [0.2, 0.6 + 1e-16])

    assert resumo.aprovado
    assert resumo.iguais_bit_a_bit == 1


def test_comparar_reprova_discordancia_no_corte_de_equilibrio():
    resumo = comparar([0.503], [0.5029999999])

    assert resumo.discordancias_equilibrio == 1
    assert not resumo.aprovado


def test_avaliar_em_js_igual_a_referencia_python(raiz, modelo_json):
    entradas = [{nome: None for nome in ENTRADAS} for _ in range(3)]
    entradas[1]["leucocitos"] = 15000.0
    entradas[2]["sexo"] = "M"

    obtidos = avaliar_em_js(entradas, CAMINHO_JSON, raiz)

    esperados = [calcular_escore(modelo_json, e) for e in entradas]
    assert comparar(esperados, obtidos).aprovado


def test_quadro_para_entradas_troca_nan_por_none():
    quadro = pd.DataFrame([{nome: 1.0 for nome in ENTRADAS}])
    quadro.loc[0, "pcr"] = math.nan
    quadro["sexo"] = ["F"]

    entradas = quadro_para_entradas(quadro)

    assert entradas[0]["pcr"] is None
    assert entradas[0]["sexo"] == "F"


def test_contar_padroes_faltantes_agrupa_por_colunas():
    quadro = pd.DataFrame([{nome: 1.0 for nome in ENTRADAS} for _ in range(3)])
    quadro.loc[1, "pcr"] = math.nan
    quadro.loc[2, "pcr"] = math.nan

    assert contar_padroes_faltantes(quadro) == {"pcr": 2, "nenhum": 1}


def test_carregar_dados_locais_recusa_pasta_sem_os_pkl(tmp_path):
    with pytest.raises(DadosLocaisAusentes):
        carregar_dados_locais(tmp_path)


def test_escrever_relatorio_659_so_tem_agregados(tmp_path):
    resumo = comparar([0.1, 0.9], [0.1, 0.9])
    destino = tmp_path / "paridade.md"

    escrever_relatorio_659(
        destino, resumo, {"nenhum": 2}, 0, "abc123", date(2026, 10, 20)
    )

    texto = destino.read_text(encoding="utf-8")
    assert "| Crianças | 2 |" in texto
    assert "abc123" in texto
    assert "0.9" not in texto
```

- [ ] **Passo 4: rodar e ver falhar.** `./.venv/bin/python -m pytest tests/python/test_paridade.py -v`. Esperado: erro de importação de `apendisite_conversao.paridade`.

- [ ] **Passo 5: escrever `scripts/avaliar_lote.mjs`.**

```js
// Avalia um lote de entradas com o motor do site, para a paridade em Python.
// Uso: node scripts/avaliar_lote.mjs <modelo.json> <entradas.json> <saida.json>
import { readFile, writeFile } from 'node:fs/promises';
import { calcularEscore, carregarModelo } from '../public/js/modelo.js';

const [caminhoModelo, caminhoEntradas, caminhoSaida] = process.argv.slice(2);
if (!caminhoSaida) {
  console.error('uso: node scripts/avaliar_lote.mjs <modelo.json> <entradas.json> <saida.json>');
  process.exit(2);
}
const modelo = carregarModelo(JSON.parse(await readFile(caminhoModelo, 'utf8')));
const entradas = JSON.parse(await readFile(caminhoEntradas, 'utf8'));
const escores = entradas.map((entrada) => calcularEscore(modelo, entrada));
await writeFile(caminhoSaida, JSON.stringify(escores));
```

- [ ] **Passo 6: escrever `paridade.py`.**

```python
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
            np.sum((a >= CORTE_ALTA_SENSIBILIDADE) != (b >= CORTE_ALTA_SENSIBILIDADE))
        ),
    )


def avaliar_em_js(entradas: list[dict], caminho_modelo: Path, raiz: Path) -> list[float]:
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
        resultado = subprocess.run(comando, capture_output=True, text=True, check=False)
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
    registros = quadro[ENTRADAS].astype(object).where(quadro[ENTRADAS].notna(), None)
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
        raise DadosLocaisAusentes(f"arquivos ausentes em {pasta}: {', '.join(faltando)}")
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
        f"| Discordâncias no corte 0,358 | {resumo.discordancias_alta_sensibilidade} |",
        f"| Critério do spec (seção 11) | {'aprovado' if resumo.aprovado else 'reprovado'} |",
        "",
        "## Padrões de faltante",
        "",
        "| Colunas faltantes | Crianças |",
        "|---|---|",
    ]
    linhas += [f"| {chave} | {n} |" for chave, n in padroes.items()]
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text("\n".join(linhas) + "\n", encoding="utf-8")
```

- [ ] **Passo 7: rodar e ver passar.** `./.venv/bin/python -m pytest tests/python/test_paridade.py -v` e `npm test`. Esperado: 7 passaram no pytest e toda a suíte JS verde.

- [ ] **Passo 8: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add scripts/avaliar_lote.mjs src/apendisite_conversao/paridade.py tests/js/paridade_sintetica.test.js tests/python/test_paridade.py && git commit -m "test: conferir a paridade sintética do motor JS contra o sklearn"
```

### Tarefa 1.7: paridade nas 659 crianças

**Arquivos:**
- Modificar: `run.py` (subcomando `paridade-local`)
- Criar: `docs/paridade_659.md` (gerado, só agregados)

- [ ] **Passo 1: acrescentar o subcomando ao `run.py`.** Imports novos:

```python
from datetime import date  # junto dos imports da biblioteca padrão

from apendisite_conversao.paridade import (  # noqa: E402
    avaliar_em_js,
    carregar_dados_locais,
    comparar,
    contar_padroes_faltantes,
    escrever_relatorio_659,
    quadro_para_entradas,
)
```

Nova função:

```python
def _paridade_local(args: argparse.Namespace) -> int:
    quadro = carregar_dados_locais(Path(args.dados).expanduser())
    esperados = joblib.load(CAMINHO_JOBLIB).predict_proba(quadro)[:, 1].tolist()
    obtidos = avaliar_em_js(quadro_para_entradas(quadro), CAMINHO_JSON, RAIZ)
    resumo = comparar(esperados, obtidos)
    idade = quadro["idade_anos"]
    fora_da_faixa = int(((idade < 2) | (idade > 14)).sum())
    escrever_relatorio_659(
        CAMINHO_RELATORIO_659, resumo, contar_padroes_faltantes(quadro),
        fora_da_faixa, _sha256(CAMINHO_JSON), date.today(),
    )
    print(
        f"n={resumo.n} dif_maxima={resumo.dif_maxima:.1e} "
        f"bit_a_bit={resumo.iguais_bit_a_bit} "
        f"discordancias_0503={resumo.discordancias_equilibrio} "
        f"discordancias_0358={resumo.discordancias_alta_sensibilidade}"
    )
    print("APROVADO" if resumo.aprovado else "REPROVADO")
    return 0 if resumo.aprovado else 1
```

Em `_montar_parser`:

```python
    paridade = sub.add_parser("paridade-local", help="paridade nas 659 crianças")
    paridade.add_argument("--dados", required=True, help="pasta com os .pkl")
    paridade.set_defaults(funcao=_paridade_local)
```

- [ ] **Passo 2: rodar a paridade.** Eu rodo:

`./.venv/bin/python run.py paridade-local --dados ~/Documents/apendicite/data/processed`

Esperado (Observado na sonda de 19/10): `n=659`, diferença máxima perto de 4,4e-16, zero discordâncias nos dois cortes, `APROVADO`. Esperado no relatório: 174 crianças com algum faltante e 7 fora de 2 a 14 anos.

- [ ] **Passo 3: conferir o relatório.** Abrir `docs/paridade_659.md` e confirmar que só há contagens, diferença, discordâncias, data e SHA-256. Nenhum valor de criança.

- [ ] **Passo 4: suíte inteira.** `npm test` e `./.venv/bin/python -m pytest`. Anotar as contagens para o `RELATORIO_TESTES.md` (tarefa 5.5).

- [ ] **Passo 5: commit, push e PR (Wilson).**

```bash
cd ~/Documents/apendisite && git add run.py docs/paridade_659.md && git status --short && git commit -m "test: registrar a paridade nas 659 crianças só com agregados"
```

Conferir no `git status --short` que nenhum `.pkl` nem arquivo de `dados_locais/` aparece.

```bash
cd ~/Documents/apendisite && git push -u origin feat/parte-1-motor && gh pr create --base main --title "feat: motor de cálculo e as duas paridades" --body "Exporta o random forest para JSON, calcula o escore no navegador com Math.fround nas 32 colunas e prova a paridade contra o sklearn nos casos sintéticos e nas 659 crianças (só agregados). Por quê: o site só pode publicar o escore se ele for o mesmo do modelo validado."
```

**Portão da Parte 1:** eu apresento ao Wilson os números das duas paridades (n, diferença máxima, bit a bit, discordâncias) e o SHA-256 do JSON. Com o OK dele, o Wilson mescla:

```bash
cd ~/Documents/apendisite && gh pr merge --merge --delete-branch && git switch main && git pull
```

Atualizar a passagem.

---
## Parte 2 (20/10): textos, idiomas, formulário, unidades, validação e resultado

Pronto quando a calculadora abre em PT ou EN, aceita vírgula e ponto, troca unidade sem perder o valor, bloqueia valor fora da faixa com a mensagem aprovada, calcula no aparelho e mostra o resultado na ordem do spec, com escore truncado em três casas e o pictograma. Sem escores clínicos (Parte 3) e sem servidor (Parte 4).

Branch (Wilson):

```bash
cd ~/Documents/apendisite && git switch main && git pull && git switch -c feat/parte-2-formulario
```

### Tarefa 2.1: textos PT e EN, escolha de idioma e mensagens de erro

**Arquivos:**
- Criar: `public/js/formato.js` (só `formatarNumero` nesta tarefa, o resto na 2.2), `public/js/textos.js`
- Teste: `tests/js/textos.test.js`

**Interfaces:**
- Consome: `docs/textos_aprovados.md` (Parte 0).
- Produz: `IDIOMAS = ['pt', 'en']`, `CHAVE_IDIOMA = 'apendisite.idioma'`, `DOI_VERSAO` (texto ou `null`), `DOI_CONCEITO` (texto ou `null`), `TEXTOS.pt` e `TEXTOS.en` com as mesmas chaves, `SIMBOLOS_UNIDADE`, `escolherIdioma({parametroUrl, guardado, idiomasNavegador}) -> 'pt'|'en'`, `preencher(modelo, valores) -> string` (troca `{chave}`), `mensagemDeErro(erro, idioma) -> string`, `urlDoi(doi) -> string`. Em `formato.js`: `formatarNumero(valor, idioma) -> string`.
- Forma do `erro` (vem de `entrada.js`, tarefa 2.3): `{campo, codigo}` com `codigo` em `'vazio' | 'faixa' | 'idade' | 'neutrofilos_acima' | 'declaracao'`. Quando `codigo` é `'faixa'`, traz também `faixa: [min, max]` e `unidade` em `'anos' | 'kg' | 'mm3' | 'mil_ul' | 'pct' | 'mgdl' | 'mgl' | 'campo' | 'c' | 'f'`.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/textos.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOI_CONCEITO,
  DOI_VERSAO,
  TEXTOS,
  escolherIdioma,
  mensagemDeErro,
  preencher,
} from '../../public/js/textos.js';
import { lerTexto } from './auxiliares.js';

const aprovado = await lerTexto('docs/textos_aprovados.md');

function folhas(valor, caminho = '') {
  if (typeof valor === 'string') return [[caminho, valor]];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => folhas(v, `${caminho}[${i}]`));
  return Object.entries(valor).flatMap(([k, v]) => folhas(v, caminho ? `${caminho}.${k}` : k));
}

function estrutura(valor) {
  if (typeof valor === 'string') return 'texto';
  if (Array.isArray(valor)) return valor.map(estrutura);
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, estrutura(v)]));
}

test('pt_e_en_tem_as_mesmas_chaves_e_listas_do_mesmo_tamanho', () => {
  assert.deepEqual(estrutura(TEXTOS.en), estrutura(TEXTOS.pt));
});

test('nenhum_texto_vazio', () => {
  for (const idioma of ['pt', 'en']) {
    for (const [caminho, texto] of folhas(TEXTOS[idioma])) {
      assert.ok(texto.trim().length > 0, `${idioma}.${caminho} vazio`);
    }
  }
});

test('nenhum_travessao', () => {
  for (const idioma of ['pt', 'en']) {
    for (const [caminho, texto] of folhas(TEXTOS[idioma])) {
      assert.ok(!texto.includes('\u2014'), `${idioma}.${caminho} tem travessão`);
    }
  }
});

test('todo_texto_vem_palavra_por_palavra_dos_textos_aprovados', () => {
  const ausentes = [];
  for (const idioma of ['pt', 'en']) {
    for (const [caminho, texto] of folhas(TEXTOS[idioma])) {
      for (const pedaco of texto.split(/\{\w+\}/)) {
        if (pedaco.trim() && !aprovado.includes(pedaco)) ausentes.push(`${idioma}.${caminho}: ${pedaco}`);
      }
    }
  }
  assert.deepEqual(ausentes, []);
});

test('dois_sao_nulos_ou_no_formato_do_zenodo', () => {
  for (const doi of [DOI_VERSAO, DOI_CONCEITO]) {
    assert.ok(doi === null || /^10\.5281\/zenodo\.\d+$/.test(doi), `DOI inválido: ${doi}`);
  }
});

test('escolherIdioma_url_vence_aparelho_e_navegador', () => {
  assert.equal(escolherIdioma({ parametroUrl: 'en', guardado: 'pt', idiomasNavegador: ['pt-BR'] }), 'en');
  assert.equal(escolherIdioma({ parametroUrl: 'pt', guardado: 'en', idiomasNavegador: ['en-US'] }), 'pt');
});

test('escolherIdioma_aparelho_vence_navegador', () => {
  assert.equal(escolherIdioma({ parametroUrl: null, guardado: 'en', idiomasNavegador: ['pt-BR'] }), 'en');
});

test('escolherIdioma_navegador_em_ingles_abre_em_ingles_e_os_demais_em_portugues', () => {
  assert.equal(escolherIdioma({ idiomasNavegador: ['en-GB', 'pt-BR'] }), 'en');
  assert.equal(escolherIdioma({ idiomasNavegador: ['fr-FR'] }), 'pt');
  assert.equal(escolherIdioma({ idiomasNavegador: [] }), 'pt');
  assert.equal(escolherIdioma({ parametroUrl: 'es', idiomasNavegador: ['es-ES'] }), 'pt');
});

test('preencher_troca_as_chaves', () => {
  assert.equal(preencher('Modelo {versao}', { versao: '1.0.0' }), 'Modelo 1.0.0');
});

test('mensagemDeErro_de_faixa_usa_numero_e_unidade_do_idioma', () => {
  assert.equal(
    mensagemDeErro({ campo: 'leucocitos', codigo: 'faixa', faixa: [500, 60000], unidade: 'mm3' }, 'pt'),
    'Valor fora da faixa aceita (500 a 60.000 /mm³). Confira o número e a unidade.',
  );
  assert.equal(
    mensagemDeErro({ campo: 'leucocitos', codigo: 'faixa', faixa: [0.5, 60], unidade: 'mil_ul' }, 'en'),
    'Value outside the accepted range (0.5 to 60 ×10³/µL). Check the number and the unit.',
  );
  assert.equal(
    mensagemDeErro({ campo: 'idade', codigo: 'faixa', faixa: [2, 14], unidade: 'anos' }, 'pt'),
    'Valor fora da faixa aceita (2 a 14 anos). Confira o número e a unidade.',
  );
  assert.equal(
    mensagemDeErro({ campo: 'urina', codigo: 'faixa', faixa: [0, 500], unidade: 'campo' }, 'en'),
    'Value outside the accepted range (0 to 500 per high-power field). Check the number and the unit.',
  );
});

test('mensagemDeErro_dos_demais_codigos', () => {
  assert.equal(mensagemDeErro({ campo: 'peso', codigo: 'vazio' }, 'pt'), 'Preencha este campo.');
  assert.equal(mensagemDeErro({ campo: 'idade', codigo: 'idade' }, 'en'), 'The model applies to children aged 2 to 14 years.');
  assert.equal(mensagemDeErro({ campo: 'neutrofilos', codigo: 'neutrofilos_acima' }, 'pt'), 'Os neutrófilos não podem passar do total de leucócitos.');
  assert.equal(mensagemDeErro({ campo: 'declaracao', codigo: 'declaracao' }, 'en'), 'Check the statement to calculate.');
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/textos.test.js`. Esperado: módulo não encontrado.

- [ ] **Passo 3: escrever `formatarNumero` em `public/js/formato.js`.**

```js
// Formatação de números para a tela. Funções puras.

const LOCALIDADES = Object.freeze({ pt: 'pt-BR', en: 'en-US' });

/** Formata um número com o separador decimal e de milhar do idioma. */
export function formatarNumero(valor, idioma) {
  return new Intl.NumberFormat(LOCALIDADES[idioma], { maximumFractionDigits: 2 }).format(valor);
}
```

- [ ] **Passo 4: escrever `public/js/textos.js`.** Cada texto é cópia exata de `docs/textos_aprovados.md`. Os DOIs começam nulos. Se a Fase A6 já tiver o DOI reservado, ele entra em `DOI_VERSAO` nesta tarefa.

```js
// Textos aprovados pelo Wilson em 19/10/2026 (docs/textos_aprovados.md).
// Qualquer mudança passa por ele. O teste confere cada texto contra o documento.
import { formatarNumero } from './formato.js';

export const IDIOMAS = Object.freeze(['pt', 'en']);
export const CHAVE_IDIOMA = 'apendisite.idioma';

// DOI da versão 1.0.0, reservado no rascunho do Zenodo (Fase A6).
export const DOI_VERSAO = null;
// DOI do conceito, que só existe depois da publicação (22/10).
export const DOI_CONCEITO = null;

export const SIMBOLOS_UNIDADE = Object.freeze({
  mm3: '/mm³',
  mil_ul: '×10³/µL',
  pct: '%',
  mgdl: 'mg/dL',
  mgl: 'mg/L',
  c: '°C',
  f: '°F',
  kg: 'kg',
});

const REFERENCIAS = Object.freeze([
  'Alvarado A. A practical score for the early diagnosis of acute appendicitis. Annals of Emergency Medicine. 1986;15(5):557-64. doi:10.1016/s0196-0644(86)80993-3',
  'Samuel M. Pediatric appendicitis score. Journal of Pediatric Surgery. 2002;37(6):877-81. doi:10.1053/jpsu.2002.32893',
  'Simkhada S, Thapa B, Basnet AT, Karki S. Pediatric appendicitis score and ultrasound in children with acute appendicitis: an observational study. Journal of Nepal Medical Association. 2025;63(282):109-13. doi:10.31729/jnma.8889',
  'Lourenço DF, Carmona EV, Lopes MHBM. Tradução e adaptação transcultural da System Usability Scale para o português do Brasil. Aquichan. 2022;22(2):e2228. doi:10.5294/aqui.2022.22.2.8',
  'Brooke J. SUS: a "quick and dirty" usability scale. In: Usability evaluation in industry. CRC Press; 1996. p. 207-12. doi:10.1201/9781498710411-35',
]);

export const TEXTOS = Object.freeze({
  pt: {
    nome: 'apendisite',
    frase: 'Escore de apendicite em crianças de 2 a 14 anos, por um modelo de aprendizado de máquina desenvolvido e validado por cirurgiões pediátricos e pesquisadores da FMB/UNESP, Botucatu (SP). Ferramenta de pesquisa para médicos e estudantes de medicina.',
    idioma_aviso: 'O idioma escolhido fica guardado neste aparelho.',
    form_abertura: 'Preencha todos os campos. Os dados ficam neste aparelho e não são enviados a nenhum servidor.',
    grupo_paciente: 'Paciente',
    idade: 'Idade (anos completos)',
    idade_ajuda: 'De 2 a 14 anos',
    sexo: 'Sexo',
    sexo_m: 'Masculino',
    sexo_f: 'Feminino',
    peso: 'Peso (kg)',
    grupo_sintomas: 'Sintomas',
    nausea: 'Náusea',
    vomito: 'Vômito',
    febre: 'Febre (axilar de 37,8 °C ou mais)',
    disuria: 'Disúria',
    sim: 'Sim',
    nao: 'Não',
    grupo_exame: 'Exame físico',
    dor_fid: 'Dor à palpação em fossa ilíaca direita',
    dor_difusa: 'Dor difusa à palpação',
    grupo_rx: 'Radiografia simples de abdome',
    rx_ajuda: 'Em pelo menos duas posições',
    nao_realizado: 'Não realizado',
    rx_fid: 'Nível hidroaéreo em fossa ilíaca direita',
    rx_difuso: 'Nível hidroaéreo difuso',
    grupo_lab: 'Exames laboratoriais',
    leucocitos: 'Leucócitos',
    neutrofilos: 'Neutrófilos',
    pcr: 'PCR',
    urina: 'Leucócitos na urina (por campo)',
    unidade: 'Unidade',
    unidade_anos: 'anos',
    unidade_campo: 'por campo',
    ajuda_numeros: 'Use vírgula ou ponto para decimal. Não use separador de milhar (12600, e não 12.600).',
    declaracao: 'Declaro que sou médica, médico ou estudante de medicina e tenho 18 anos ou mais.',
    calcular: 'Calcular',
    erro_vazio: 'Preencha este campo.',
    erro_faixa: 'Valor fora da faixa aceita ({min} a {max} {unidade}). Confira o número e a unidade.',
    erro_idade: 'O modelo vale para crianças de 2 a 14 anos.',
    erro_neutrofilos: 'Os neutrófilos não podem passar do total de leucócitos.',
    erro_declaracao: 'Marque a declaração para calcular.',
    erro_modelo: 'Não foi possível carregar o modelo. Recarregue a página.',
    resultado_titulo: 'Resultado',
    escore: 'Escore do modelo: {escore} (de 0 a 1)',
    escore_nao_chance: 'O escore não é a chance de cirurgia. A frequência da faixa, abaixo, mostra o que aconteceu com crianças de escore parecido.',
    corte_alta: 'Corte de alta sensibilidade (0,358): {classe}. Na validação, sensibilidade 98,7% e especificidade 48,8%.',
    corte_equilibrio: 'Corte de equilíbrio (0,503): {classe}. Na validação, sensibilidade 88,2% e especificidade 74,2%.',
    positivo: 'positivo',
    negativo: 'negativo',
    faixa_baixa: 'Faixa baixa (escore abaixo de 0,358): Na validação em Botucatu, 1 das 120 crianças nesta faixa foi operada (0,8%).',
    faixa_intermediaria: 'Faixa intermediária (escore de 0,358 até abaixo de 0,503): Na validação em Botucatu, 8 das 70 crianças nesta faixa foram operadas (11,4%).',
    faixa_alta: 'Faixa alta (escore de 0,503 ou mais): Na validação em Botucatu, 67 das 130 crianças nesta faixa foram operadas (51,5%).',
    legenda_pictograma: 'Cada quadrado é 1 de 100 crianças. Os quadrados cheios são as crianças operadas.',
    aviso_rx: 'Sem raio X, o modelo assume o achado mais comum da derivação. Na validação, isso levou 22 das 320 crianças a positivas no corte de equilíbrio. O desempenho sem raio X não foi validado.',
    linhas_visiveis: [
      'Validado em Botucatu (SP), onde 24% das crianças foram operadas. Em outro serviço, as frequências por faixa podem ser outras.',
      'Estima a decisão de operar. Não estima apendicite complicada.',
      'Ferramenta de pesquisa. Não substitui a avaliação clínica.',
    ],
    escores_titulo: 'Escores de Alvarado e PAS (opcional)',
    escores_abertura: 'Os itens que já estão no formulário vêm preenchidos. Responda os demais para ver o total. Os totais usam as categorias dos artigos originais e não têm frequência de Botucatu.',
    alvarado_nome: 'Alvarado',
    pas_nome: 'PAS',
    item_migracao: 'Migração da dor para a fossa ilíaca direita',
    item_anorexia: 'Anorexia',
    item_acetona: 'Acetona na urina',
    item_anorexia_acetona: 'Anorexia ou acetona na urina',
    item_nausea_vomito: 'Náusea ou vômito',
    item_dor_fid: 'Dor à palpação em fossa ilíaca direita',
    item_descompressao: 'Descompressão brusca dolorosa',
    item_temperatura: 'Temperatura de 37,3 °C ou mais',
    temperatura_campo: 'Temperatura medida',
    temperatura_nota: 'O artigo original usa a temperatura oral',
    item_leuco_alvarado: 'Leucócitos acima de 10.000/mm³',
    item_neutro_alvarado: 'Neutrófilos acima de 75%, desvio à esquerda',
    item_dor_tosse: 'Dor em fossa ilíaca direita à tosse, à percussão ou ao saltar',
    item_febre_pas: 'Febre',
    item_leuco_pas: 'Leucócitos de 10.000/mm³ ou mais',
    item_neutro_pas: 'Neutrofilia',
    total_escore: '{nome}: {total} de 10. Categoria do artigo original: {categoria}',
    alvarado_categorias: {
      sem_categoria: 'Abaixo de 5, o artigo não define categoria.',
      compativel: '5 ou 6, compatível com apendicite.',
      provavel: '7 ou 8, apendicite provável.',
      muito_provavel: '9 ou 10, apendicite muito provável.',
    },
    alvarado_origem: 'Derivado em 277 pacientes de 4 a 80 anos, num hospital da Filadélfia (Estados Unidos), em 1975 e 1976.',
    pas_nota: 'O artigo original registra febre e neutrofilia como presentes ou ausentes, sem definir o limite. Usamos os do modelo: temperatura axilar de 37,8 °C ou mais e neutrófilos acima de 7.500/mm³. Outros estudos usam febre acima de 38 °C e neutrófilos acima de 75% (Simkhada et al., 2025).',
    pas_categorias: {
      nao_compativel: '5 ou menos, não compatível com apendicite.',
      compativel: '6, compatível com apendicite.',
      alta: '7 a 10, alta probabilidade de apendicite.',
    },
    pas_origem: 'Derivado em 1.170 crianças de 4 a 15 anos, em Southampton e Londres (Reino Unido).',
    convite: 'Avalie o apendisite. São 13 perguntas, em cerca de 2 minutos.',
    convite_responder: 'Responder',
    convite_agora_nao: 'Agora não',
    rodape_avaliar: 'Avaliar o site',
    utilidade_pergunta: 'Este site foi útil neste caso?',
    utilidade_0: 'Nada útil',
    utilidade_10: 'Muito útil',
    utilidade_teste: 'Foi só um teste',
    utilidade_pular: 'Pular',
    utilidade_obrigado: 'Obrigado.',
    participacao_titulo: 'Avaliação de usabilidade do apendisite',
    participacao_paragrafos: [
      'Esta pesquisa avalia a facilidade de uso do apendisite. São 10 afirmações da Escala de Usabilidade de Sistema (versão brasileira) e 3 perguntas sobre você, em cerca de 2 minutos.',
      'A participação é voluntária e anônima. O questionário não pede nome, e-mail nem dado do paciente, e o site não guarda IP nem o que foi digitado na calculadora. Você pode desistir a qualquer momento antes de enviar, e nada é gravado. Depois do envio, a resposta não pode ser apagada, porque não há como saber qual é a sua.',
      'As respostas serão analisadas em conjunto e publicadas só de forma agregada, em artigo e em congresso. Elas ficam guardadas até 5 anos depois da publicação e então são apagadas.',
      'Depois de responder, você verá, uma vez por visita e abaixo do resultado, a pergunta "Este site foi útil neste caso?", de 0 a 10. Essa nota é gravada sem identificação, com o dia, o idioma e o país.',
      'Pesquisa de opinião com participantes não identificáveis, dispensada de registro e avaliação pelo sistema CEP/Conep (Resolução CNS 674/2022, art. 26, I).',
      'Responsáveis: Bruna Aliotto Nalin Tedesco, Wilson Elias de Oliveira Junior e Erika Veruska Paiva Ortolan. Contato: contato@apendisite.com.br.',
      'Ao enviar o questionário, você concorda em participar.',
    ],
    participacao_caixa: 'Sou médica, médico ou estudante de medicina e tenho 18 anos ou mais.',
    comecar: 'Começar',
    cancelar: 'Cancelar',
    sus_instrucao: 'Para cada afirmação, marque de 1 (discordo fortemente) a 5 (concordo fortemente).',
    sus_itens: [
      'Eu acho que gostaria de usar esse site frequentemente.',
      'Eu achei esse site desnecessariamente complexo.',
      'Eu achei esse site fácil de usar.',
      'Eu achei que precisaria de ajuda de uma pessoa técnica para ser capaz de usar esse site.',
      'Eu achei que as várias funções desse site foram bem integradas.',
      'Eu acho que o site apresenta muita inconsistência.',
      'Eu imagino que a maioria das pessoas pode aprender a usar esse site rapidamente.',
      'Eu achei esse site muito pesado para usar.',
      'Eu me senti muito seguro usando o site.',
      'Eu precisei aprender muitas coisas antes que pudesse utilizar esse site.',
    ],
    sus_ancora_1: 'discordo fortemente',
    sus_ancora_5: 'concordo fortemente',
    sus_fonte: 'Escala de Usabilidade de Sistema, versão brasileira (Lourenço, Carmona e Lopes, 2022), com "sistema" trocado por "site".',
    area_pergunta: 'Sua área',
    areas: {
      cir_ped_especialista: 'Cirurgia pediátrica (especialista)',
      cir_ped_residente: 'Cirurgia pediátrica (residente)',
      cir_geral: 'Cirurgia geral',
      pediatria: 'Pediatria',
      emergencia: 'Medicina de emergência',
      familia_comunidade: 'Medicina de família e comunidade',
      generalista: 'Generalista (sem especialidade)',
      outra_especialidade: 'Outra especialidade médica',
      estudante_medicina: 'Estudante de medicina',
    },
    pais_pergunta: 'País onde você trabalha ou estuda',
    pais_selecione: 'Selecione',
    usaria_pergunta: 'Você usaria o apendisite na sua prática?',
    usaria: { sim: 'Sim', talvez: 'Talvez', nao: 'Não' },
    enviar: 'Enviar',
    enviado: 'Resposta enviada. Obrigado por participar.',
    erro_envio: 'Não foi possível enviar agora. Tente de novo em alguns minutos.',
    como_feito_titulo: 'Como o modelo foi feito',
    como_feito: [
      'O apendisite usa um random forest (500 árvores, profundidade máxima 5) treinado com 15 dados de rotina do pronto-socorro: idade, sexo, peso, náusea, vômito, febre, disúria, dor à palpação em fossa ilíaca direita, dor difusa à palpação, dois achados da radiografia simples, leucócitos, neutrófilos, PCR e leucócitos na urina. Quatro variáveis derivadas usam cortes fixos (leucócitos acima de 10.000/mm³, neutrófilos acima de 7.500/mm³, PCR acima de 5,0 mg/dL e leucócitos na urina acima de 10 por campo).',
      'O desfecho é a decisão de operar, tomada pela equipe de cirurgia pediátrica. Na validação, as 76 crianças operadas tiveram apendicite confirmada.',
      'A derivação incluiu 339 crianças atendidas no HC-FMB/UNESP de 2019 a 2021, das quais 176 (51,9%) foram operadas. Os dois cortes foram fixados no grupo de teste da derivação (102 crianças), antes da validação. O corte de equilíbrio (0,503) é o índice de Youden. O corte de alta sensibilidade (0,358) é o de maior especificidade com sensibilidade de pelo menos 95%.',
      'A validação prospectiva incluiu 320 crianças em Botucatu (SP), de março a setembro de 2025, das quais 76 (23,8%) foram operadas. A AUC foi 0,89 (IC 95% 0,84 a 0,92).',
      'Aplicado sem retreino a dois bancos públicos da Alemanha, o modelo teve AUC 0,77 em Regensburg (781 crianças) e 0,78 em Düsseldorf (301) para a decisão cirúrgica. A análise é do nosso grupo, foi apresentada em congresso e não foi publicada.',
    ],
    limitacoes_titulo: 'Limitações',
    limitacoes: [
      'O escore não é calibrado. Na validação, a mediana do escore foi 0,45, e 24% das crianças foram operadas.',
      'As frequências por faixa vêm de Botucatu. No grupo de teste da derivação, com 52% de crianças operadas, as mesmas faixas tiveram 9%, 33% e 78% de operadas.',
      'O modelo não estima apendicite complicada. Para esse desfecho, a AUC na validação foi 0,60 (IC 95% 0,47 a 0,73).',
      'Sem radiografia, o desempenho não foi validado. Na validação, só 1 das 320 crianças não tinha o exame.',
      'Crianças com menos de 2 anos ficam fora, porque só 2 entraram na validação.',
      'Em outra população, o modelo pode precisar de recalibração.',
    ],
    autoria_titulo: 'Autoria',
    autores: [
      'Bruna Aliotto Nalin Tedesco, MD, PhD, cirurgiã pediátrica',
      'Wilson Elias de Oliveira Junior, MD, PhD, cirurgião pediátrico',
      'Erika Veruska Paiva Ortolan, MD, PhD, cirurgiã pediátrica',
    ],
    instituicao: 'Faculdade de Medicina de Botucatu (FMB/UNESP), Botucatu (SP). Contato: contato@apendisite.com.br',
    fomento: 'Apoio: CNPq (bolsa de produtividade em pesquisa 310401/2021-6 e bolsa de iniciação científica PIBIC) e CAPES (bolsa PDPG 88887.808727/2023-00).',
    como_citar_titulo: 'Como citar',
    como_citar: 'Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Versão 1.0.0. Zenodo; 2026. doi:{doi}. Resultados apresentados no 38º Congresso Brasileiro de Cirurgia Pediátrica, 2026.',
    dados_alema: 'Dados da validação alemã: bancos públicos de Marcinkevičs e colaboradores, Regensburg Pediatric Appendicitis Dataset (Zenodo, doi:10.5281/zenodo.7711412, licença CC BY-NC 4.0) e coorte de Düsseldorf (Frontiers in Pediatrics, 2025, doi:10.3389/fped.2025.1587488).',
    referencias_titulo: 'Referências',
    referencias: REFERENCIAS,
    rodape_privacidade: 'Privacidade',
    rodape_contato: 'Contato',
    rodape_modelo: 'Modelo {versao}',
    rodape_zenodo: 'Código e modelo no Zenodo',
    priv_titulo: 'Privacidade',
    priv_paragrafos: [
      'Responsável pelo tratamento dos dados: Wilson Elias de Oliveira Junior, pessoa física. Contato: contato@apendisite.com.br.',
      'Dados do paciente. Os valores digitados na calculadora ficam no seu aparelho. O cálculo é feito no navegador, e nenhum valor do formulário, nem o resultado, é enviado ao servidor. Ao fechar ou recarregar a página, os valores são apagados.',
      'Contador de uso. O site conta quantas vezes foi aberto e quantos cálculos foram feitos. Cada registro tem o dia, o tipo de evento (abertura ou cálculo), o idioma e o país informado pela rede da Cloudflare. O contador não guarda IP, nome nem o que foi digitado.',
      'Questionário e nota de utilidade. As respostas ao questionário de usabilidade e à pergunta "Este site foi útil neste caso?" são anônimas. Não pedimos nome nem e-mail e não guardamos IP. As respostas podem ser publicadas de forma agregada, em artigo e em congresso, e ficam guardadas até 5 anos depois da publicação.',
      'Dados guardados no aparelho. O site guarda no seu navegador só o idioma escolhido e a marca de que você já respondeu ao questionário, para não mostrar o convite de novo. O site não cria cookies próprios e não usa ferramentas de análise de terceiros.',
      'Cloudflare. O site é hospedado na Cloudflare, que é operadora dos dados de acesso. Para entregar as páginas, a Cloudflare recebe o endereço IP de quem acessa, como qualquer serviço de hospedagem, e também o usa para limitar envios repetidos do questionário. Esse IP não chega ao nosso banco de dados.',
      'Seus direitos. Para dúvidas ou pedidos sobre seus dados, escreva para contato@apendisite.com.br. Como as respostas não têm identificação, não conseguimos localizar a resposta de uma pessoa.',
    ],
    priv_voltar: 'Voltar à calculadora',
  },
  en: {
    nome: 'apendisite',
    frase: 'Appendicitis score for children aged 2 to 14 years, from a machine learning model developed and validated by pediatric surgeons and researchers at FMB/UNESP, Botucatu, Brazil. A research tool for physicians and medical students.',
    idioma_aviso: 'Your language choice is stored on this device.',
    form_abertura: 'Complete all fields. The data stay on this device and are not sent to any server.',
    grupo_paciente: 'Patient',
    idade: 'Age (completed years)',
    idade_ajuda: 'From 2 to 14 years',
    sexo: 'Sex',
    sexo_m: 'Male',
    sexo_f: 'Female',
    peso: 'Weight (kg)',
    grupo_sintomas: 'Symptoms',
    nausea: 'Nausea',
    vomito: 'Vomiting',
    febre: 'Fever (axillary temperature of 37.8 °C [100.0 °F] or higher)',
    disuria: 'Dysuria',
    sim: 'Yes',
    nao: 'No',
    grupo_exame: 'Physical examination',
    dor_fid: 'Right lower quadrant tenderness',
    dor_difusa: 'Diffuse abdominal tenderness',
    grupo_rx: 'Plain abdominal radiograph',
    rx_ajuda: 'At least two views',
    nao_realizado: 'Not performed',
    rx_fid: 'Air-fluid level in the right lower quadrant',
    rx_difuso: 'Diffuse air-fluid levels',
    grupo_lab: 'Laboratory tests',
    leucocitos: 'White blood cell count',
    neutrofilos: 'Neutrophils',
    pcr: 'C-reactive protein',
    urina: 'Urine white blood cells (per high-power field)',
    unidade: 'Unit',
    unidade_anos: 'years',
    unidade_campo: 'per high-power field',
    ajuda_numeros: 'Use a comma or a period as the decimal mark. Do not use a thousands separator (12600, not 12,600).',
    declaracao: 'I confirm that I am a physician or a medical student and that I am 18 years of age or older.',
    calcular: 'Calculate',
    erro_vazio: 'Complete this field.',
    erro_faixa: 'Value outside the accepted range ({min} to {max} {unidade}). Check the number and the unit.',
    erro_idade: 'The model applies to children aged 2 to 14 years.',
    erro_neutrofilos: 'Neutrophils cannot exceed the white blood cell count.',
    erro_declaracao: 'Check the statement to calculate.',
    erro_modelo: 'The model could not be loaded. Reload the page.',
    resultado_titulo: 'Result',
    escore: 'Model score: {escore} (0 to 1)',
    escore_nao_chance: 'The score is not the chance of surgery. The band frequency below shows what happened to children with a similar score.',
    corte_alta: 'High-sensitivity cutoff (0.358): {classe}. In validation, sensitivity 98.7% and specificity 48.8%.',
    corte_equilibrio: 'Balanced cutoff (0.503): {classe}. In validation, sensitivity 88.2% and specificity 74.2%.',
    positivo: 'positive',
    negativo: 'negative',
    faixa_baixa: 'Low band (score below 0.358): In the Botucatu validation, 1 of the 120 children in this band underwent surgery (0.8%).',
    faixa_intermediaria: 'Intermediate band (score from 0.358 to below 0.503): In the Botucatu validation, 8 of the 70 children in this band underwent surgery (11.4%).',
    faixa_alta: 'High band (score of 0.503 or higher): In the Botucatu validation, 67 of the 130 children in this band underwent surgery (51.5%).',
    legenda_pictograma: 'Each square is 1 in 100 children. Filled squares are children who underwent surgery.',
    aviso_rx: 'Without a radiograph, the model assumes the most common finding in the derivation cohort. In validation, this moved 22 of the 320 children to positive at the balanced cutoff. Performance without a radiograph was not validated.',
    linhas_visiveis: [
      'Validated in Botucatu, Brazil, where 24% of the children underwent surgery. In another setting, the band frequencies may differ.',
      'Estimates the decision to operate. It does not estimate complicated appendicitis.',
      'Research tool. It does not replace clinical assessment.',
    ],
    escores_titulo: 'Alvarado score and Pediatric Appendicitis Score (optional)',
    escores_abertura: 'Items already in the form are filled in. Answer the remaining items to see the total. Totals use the categories of the original articles and have no Botucatu frequencies.',
    alvarado_nome: 'Alvarado',
    pas_nome: 'PAS',
    item_migracao: 'Migration of pain to the right lower quadrant',
    item_anorexia: 'Anorexia',
    item_acetona: 'Urinary acetone',
    item_anorexia_acetona: 'Anorexia or urinary acetone',
    item_nausea_vomito: 'Nausea or vomiting',
    item_dor_fid: 'Right lower quadrant tenderness',
    item_descompressao: 'Rebound tenderness',
    item_temperatura: 'Temperature of 37.3 °C (99.1 °F) or higher',
    temperatura_campo: 'Measured temperature',
    temperatura_nota: 'The original article uses oral temperature',
    item_leuco_alvarado: 'White blood cell count above 10,000/mm³',
    item_neutro_alvarado: 'Neutrophils above 75%, left shift',
    item_dor_tosse: 'Right lower quadrant tenderness on coughing, percussion or hopping',
    item_febre_pas: 'Fever',
    item_leuco_pas: 'White blood cell count of 10,000/mm³ or higher',
    item_neutro_pas: 'Neutrophilia',
    total_escore: '{nome}: {total} of 10. Category from the original article: {categoria}',
    alvarado_categorias: {
      sem_categoria: 'Below 5, the article defines no category.',
      compativel: '5 or 6, compatible with appendicitis.',
      provavel: '7 or 8, probable appendicitis.',
      muito_provavel: '9 or 10, very probable appendicitis.',
    },
    alvarado_origem: 'Derived in 277 patients aged 4 to 80 years at one hospital in Philadelphia, United States, in 1975 and 1976.',
    pas_nota: 'The original article records fever and neutrophilia as present or absent and does not define a threshold. We use the model\'s definitions: axillary temperature of 37.8 °C (100.0 °F) or higher and neutrophils above 7,500/mm³. Other studies use fever above 38 °C and neutrophils above 75% (Simkhada et al., 2025).',
    pas_categorias: {
      nao_compativel: '5 or less, not compatible with appendicitis.',
      compativel: '6, compatible with appendicitis.',
      alta: '7 to 10, high probability of appendicitis.',
    },
    pas_origem: 'Derived in 1,170 children aged 4 to 15 years in Southampton and London, United Kingdom.',
    convite: 'Rate apendisite. 13 questions, about 2 minutes.',
    convite_responder: 'Answer',
    convite_agora_nao: 'Not now',
    rodape_avaliar: 'Rate this site',
    utilidade_pergunta: 'Was this site useful in this case?',
    utilidade_0: 'Not useful at all',
    utilidade_10: 'Very useful',
    utilidade_teste: 'It was just a test',
    utilidade_pular: 'Skip',
    utilidade_obrigado: 'Thank you.',
    participacao_titulo: 'apendisite usability survey',
    participacao_paragrafos: [
      'This survey assesses how easy apendisite is to use. It has the 10 statements of the System Usability Scale and 3 questions about you, and takes about 2 minutes.',
      'Participation is voluntary and anonymous. The survey does not ask for your name, email or any patient data, and the site does not store IP addresses or what was entered in the calculator. You may stop at any time before submitting, and nothing is stored. Once submitted, a response cannot be deleted, because there is no way to tell which one is yours.',
      'Responses will be analyzed together and published only in aggregate form, in an article and at conferences. They are kept for up to 5 years after publication and then deleted.',
      'After you answer, you will see, once per visit and below the result, the question "Was this site useful in this case?", from 0 to 10. This rating is stored without identification, with the date, language and country.',
      'Opinion survey with non-identifiable participants, exempt from registration and review by the Brazilian CEP/Conep research ethics system (National Health Council Resolution 674/2022, article 26, I).',
      'Investigators: Bruna Aliotto Nalin Tedesco, Wilson Elias de Oliveira Junior and Erika Veruska Paiva Ortolan. Contact: contato@apendisite.com.br.',
      'By submitting the survey, you agree to take part.',
    ],
    participacao_caixa: 'I am a physician or a medical student and I am 18 years of age or older.',
    comecar: 'Start',
    cancelar: 'Cancel',
    sus_instrucao: 'For each statement, choose from 1 (strongly disagree) to 5 (strongly agree).',
    sus_itens: [
      'I think that I would like to use this website frequently.',
      'I found the website unnecessarily complex.',
      'I thought the website was easy to use.',
      'I think that I would need the support of a technical person to be able to use this website.',
      'I found the various functions in this website were well integrated.',
      'I thought there was too much inconsistency in this website.',
      'I would imagine that most people would learn to use this website very quickly.',
      'I found the website very cumbersome to use.',
      'I felt very confident using the website.',
      'I needed to learn a lot of things before I could get going with this website.',
    ],
    sus_ancora_1: 'strongly disagree',
    sus_ancora_5: 'strongly agree',
    sus_fonte: 'System Usability Scale (Brooke, 1996), with "system" replaced by "website".',
    area_pergunta: 'Your field',
    areas: {
      cir_ped_especialista: 'Pediatric surgery (attending)',
      cir_ped_residente: 'Pediatric surgery (resident)',
      cir_geral: 'General surgery',
      pediatria: 'Pediatrics',
      emergencia: 'Emergency medicine',
      familia_comunidade: 'Family medicine',
      generalista: 'General practitioner (no specialty)',
      outra_especialidade: 'Other medical specialty',
      estudante_medicina: 'Medical student',
    },
    pais_pergunta: 'Country where you work or study',
    pais_selecione: 'Select',
    usaria_pergunta: 'Would you use apendisite in your practice?',
    usaria: { sim: 'Yes', talvez: 'Maybe', nao: 'No' },
    enviar: 'Submit',
    enviado: 'Response submitted. Thank you for taking part.',
    erro_envio: 'The response could not be sent. Please try again in a few minutes.',
    como_feito_titulo: 'How the model was built',
    como_feito: [
      'apendisite uses a random forest (500 trees, maximum depth 5) trained on 15 routine emergency department data points: age, sex, weight, nausea, vomiting, fever, dysuria, right lower quadrant tenderness, diffuse abdominal tenderness, two plain radiograph findings, white blood cell count, neutrophils, C-reactive protein and urine white blood cells. Four derived variables use fixed thresholds (white blood cell count above 10,000/mm³, neutrophils above 7,500/mm³, C-reactive protein above 5.0 mg/dL and urine white blood cells above 10 per high-power field).',
      'The outcome is the decision to operate, made by the pediatric surgery team. In validation, all 76 children who underwent surgery had confirmed appendicitis.',
      'The derivation cohort included 339 children seen at HC-FMB/UNESP from 2019 to 2021, of whom 176 (51.9%) underwent surgery. Both cutoffs were fixed in the derivation test set (102 children), before validation. The balanced cutoff (0.503) is the Youden index. The high-sensitivity cutoff (0.358) is the one with the highest specificity among those with a sensitivity of at least 95%.',
      'The prospective validation included 320 children in Botucatu, Brazil, from March to September 2025, of whom 76 (23.8%) underwent surgery. The AUC was 0.89 (95% CI 0.84 to 0.92).',
      'Applied without retraining to two public German datasets, the model had an AUC of 0.77 in Regensburg (781 children) and 0.78 in Düsseldorf (301) for the surgical decision. This analysis was done by our group, presented at a conference and not yet published.',
    ],
    limitacoes_titulo: 'Limitations',
    limitacoes: [
      'The score is not calibrated. In validation, the median score was 0.45, and 24% of the children underwent surgery.',
      'Band frequencies come from Botucatu. In the derivation test set, where 52% of the children underwent surgery, the same bands had 9%, 33% and 78% of children who underwent surgery.',
      'The model does not estimate complicated appendicitis. For that outcome, the AUC in validation was 0.60 (95% CI 0.47 to 0.73).',
      'Performance without a radiograph was not validated. In validation, only 1 of the 320 children had no radiograph.',
      'Children younger than 2 years are excluded, because only 2 entered the validation cohort.',
      'In another population, the model may need recalibration.',
    ],
    autoria_titulo: 'Authors',
    autores: [
      'Bruna Aliotto Nalin Tedesco, MD, PhD, pediatric surgeon',
      'Wilson Elias de Oliveira Junior, MD, PhD, pediatric surgeon',
      'Erika Veruska Paiva Ortolan, MD, PhD, pediatric surgeon',
    ],
    instituicao: 'Botucatu Medical School (FMB/UNESP), Botucatu, Brazil. Contact: contato@apendisite.com.br',
    fomento: 'Funding: CNPq (research productivity fellowship 310401/2021-6 and PIBIC undergraduate scholarship) and CAPES (PDPG fellowship 88887.808727/2023-00).',
    como_citar_titulo: 'How to cite',
    como_citar: 'Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Version 1.0.0. Zenodo; 2026. doi:{doi}. Results presented at the 38th Brazilian Congress of Pediatric Surgery, 2026.',
    dados_alema: 'German validation data: public datasets by Marcinkevičs and colleagues, Regensburg Pediatric Appendicitis Dataset (Zenodo, doi:10.5281/zenodo.7711412, CC BY-NC 4.0 license) and the Düsseldorf cohort (Frontiers in Pediatrics, 2025, doi:10.3389/fped.2025.1587488).',
    referencias_titulo: 'References',
    referencias: REFERENCIAS,
    rodape_privacidade: 'Privacy',
    rodape_contato: 'Contact',
    rodape_modelo: 'Model {versao}',
    rodape_zenodo: 'Code and model on Zenodo',
    priv_titulo: 'Privacy',
    priv_paragrafos: [
      'Data controller: Wilson Elias de Oliveira Junior, as an individual. Contact: contato@apendisite.com.br.',
      'Patient data. The values entered in the calculator stay on your device. The calculation runs in the browser, and no form value, and no result, is sent to the server. When you close or reload the page, the values are erased.',
      'Usage counter. The site counts how many times it was opened and how many calculations were made. Each record has the date, the event type (opening or calculation), the language and the country reported by the Cloudflare network. The counter does not store IP addresses, names or anything that was entered.',
      'Survey and usefulness rating. Responses to the usability survey and to the question "Was this site useful in this case?" are anonymous. We do not ask for names or email addresses and do not store IP addresses. Responses may be published in aggregate form, in an article and at conferences, and are kept for up to 5 years after publication.',
      'Data stored on your device. The site stores in your browser only the chosen language and a mark that you already answered the survey, so the invitation is not shown again. The site sets no cookies of its own and uses no third-party analytics.',
      'Cloudflare. The site is hosted on Cloudflare, which is the processor of access data. To deliver the pages, Cloudflare receives the IP address of each visitor, as any hosting service does, and also uses it to limit repeated survey submissions. That IP address never reaches our database.',
      'Your rights. For questions or requests about your data, write to contato@apendisite.com.br. Because responses carry no identification, we cannot locate one person\'s response.',
    ],
    priv_voltar: 'Back to the calculator',
  },
});

/** Escolhe o idioma: parâmetro da URL, depois o aparelho, depois o navegador. */
export function escolherIdioma({ parametroUrl = null, guardado = null, idiomasNavegador = [] } = {}) {
  if (IDIOMAS.includes(parametroUrl)) return parametroUrl;
  if (IDIOMAS.includes(guardado)) return guardado;
  const primeiro = String(idiomasNavegador[0] ?? '').toLowerCase();
  return primeiro.startsWith('en') ? 'en' : 'pt';
}

/** Troca cada {chave} do modelo pelo valor correspondente. */
export function preencher(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (_, chave) => String(valores[chave]));
}

/** Endereço de resolução de um DOI. */
export function urlDoi(doi) {
  return `https://doi.org/${doi}`;
}

function simboloDaUnidade(unidade, idioma) {
  if (unidade === 'anos') return TEXTOS[idioma].unidade_anos;
  if (unidade === 'campo') return TEXTOS[idioma].unidade_campo;
  return SIMBOLOS_UNIDADE[unidade];
}

/** Monta a mensagem aprovada para um erro de validação. */
export function mensagemDeErro(erro, idioma) {
  const textos = TEXTOS[idioma];
  if (erro.codigo === 'vazio') return textos.erro_vazio;
  if (erro.codigo === 'idade') return textos.erro_idade;
  if (erro.codigo === 'neutrofilos_acima') return textos.erro_neutrofilos;
  if (erro.codigo === 'declaracao') return textos.erro_declaracao;
  return preencher(textos.erro_faixa, {
    min: formatarNumero(erro.faixa[0], idioma),
    max: formatarNumero(erro.faixa[1], idioma),
    unidade: simboloDaUnidade(erro.unidade, idioma),
  });
}
```

- [ ] **Passo 5: rodar e ver passar.** `node --test tests/js/textos.test.js`. Esperado: 11 passaram. Se `todo_texto_vem_palavra_por_palavra...` listar pedaços, corrigir o `textos.js` pela cópia aprovada, nunca o documento.

- [ ] **Passo 6: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/formato.js public/js/textos.js tests/js/textos.test.js && git commit -m "feat: trazer os textos aprovados em PT e EN com escolha de idioma"
```

### Tarefa 2.2: escore truncado e pictograma

**Arquivos:**
- Modificar: `public/js/formato.js`
- Teste: `tests/js/formato.test.js`

**Interfaces:**
- Consome: `FREQUENCIAS` de `modelo.js`.
- Produz: `truncarMilesimos(escore) -> number` (inteiro de 0 a 1000, coerente com os cortes em double), `formatarEscore(escore, idioma) -> string` ("0,502" em PT, "0.502" em EN), `quadradosCheios(faixa) -> number` (1, 11 ou 52).

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/formato.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarEscore, formatarNumero, quadradosCheios, truncarMilesimos } from '../../public/js/formato.js';
import { CORTE_ALTA_SENSIBILIDADE, CORTE_EQUILIBRIO, classificar } from '../../public/js/modelo.js';
import { vizinhoAbaixo, vizinhoAcima } from './auxiliares.js';

test('formatarEscore_trunca_e_nunca_arredonda_para_cima', () => {
  assert.equal(formatarEscore(0.5028, 'pt'), '0,502');
  assert.equal(formatarEscore(0.5031, 'en'), '0.503');
  assert.equal(formatarEscore(0.9999, 'pt'), '0,999');
});

test('formatarEscore_nos_cortes_exatos', () => {
  assert.equal(formatarEscore(CORTE_EQUILIBRIO, 'pt'), '0,503');
  assert.equal(formatarEscore(CORTE_ALTA_SENSIBILIDADE, 'pt'), '0,358');
});

test('formatarEscore_logo_abaixo_dos_cortes_mostra_o_milesimo_anterior', () => {
  assert.equal(formatarEscore(vizinhoAbaixo(CORTE_EQUILIBRIO), 'pt'), '0,502');
  assert.equal(formatarEscore(vizinhoAbaixo(CORTE_ALTA_SENSIBILIDADE), 'pt'), '0,357');
  assert.equal(formatarEscore(vizinhoAcima(CORTE_EQUILIBRIO), 'pt'), '0,503');
});

test('formatarEscore_nos_extremos', () => {
  assert.equal(formatarEscore(0, 'pt'), '0,000');
  assert.equal(formatarEscore(1, 'en'), '1.000');
});

test('numero_mostrado_nunca_contradiz_o_corte', () => {
  for (let k = 300; k <= 600; k += 1) {
    for (const escore of [vizinhoAbaixo(k / 1000), k / 1000, vizinhoAcima(k / 1000)]) {
      const mostrado = truncarMilesimos(escore);
      const classe = classificar(escore);
      assert.equal(mostrado >= 503, classe.equilibrio, `escore ${escore}`);
      assert.equal(mostrado >= 358, classe.altaSensibilidade, `escore ${escore}`);
    }
  }
});

test('quadradosCheios_arredonda_o_percentual_da_faixa', () => {
  assert.equal(quadradosCheios('baixa'), 1);
  assert.equal(quadradosCheios('intermediaria'), 11);
  assert.equal(quadradosCheios('alta'), 52);
});

test('formatarNumero_usa_o_separador_do_idioma', () => {
  assert.equal(formatarNumero(60000, 'pt'), '60.000');
  assert.equal(formatarNumero(60000, 'en'), '60,000');
  assert.equal(formatarNumero(93.2, 'pt'), '93,2');
  assert.equal(formatarNumero(0.5, 'en'), '0.5');
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/formato.test.js`. Esperado: `formatarEscore` não exportado.

- [ ] **Passo 3: acrescentar ao `formato.js`.**

```js
import { FREQUENCIAS } from './modelo.js';

/**
 * Milésimos inteiros do escore, truncados. A correção final garante que
 * k / 1000, calculado em double, fica do mesmo lado do escore que os cortes:
 * o número mostrado nunca contradiz a classificação.
 */
export function truncarMilesimos(escore) {
  let k = Math.floor(escore * 1000);
  if ((k + 1) / 1000 <= escore) k += 1;
  if (k / 1000 > escore) k -= 1;
  return k;
}

/** Escore com três casas truncadas e o separador decimal do idioma. */
export function formatarEscore(escore, idioma) {
  const k = truncarMilesimos(escore);
  const inteiro = Math.floor(k / 1000);
  const fracao = String(k % 1000).padStart(3, '0');
  return `${inteiro}${idioma === 'pt' ? ',' : '.'}${fracao}`;
}

/** Quadrados cheios no pictograma de 100: o percentual da faixa arredondado. */
export function quadradosCheios(faixa) {
  const { operadas, total } = FREQUENCIAS[faixa];
  return Math.round((100 * operadas) / total);
}
```

O `import` vai para o topo do arquivo, acima de `LOCALIDADES`.

- [ ] **Passo 4: rodar e ver passar.** `npm test`. Esperado: tudo verde.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/formato.js tests/js/formato.test.js && git commit -m "feat: mostrar o escore truncado em três casas e o pictograma da faixa"
```

### Tarefa 2.3: leitura dos campos, unidades, faixas e validação

**Arquivos:**
- Criar: `public/js/entrada.js`
- Teste: `tests/js/entrada.test.js`

**Interfaces:**
- Produz: `UNIDADES`, `UNIDADES_INICIAIS` (`pt` e `en`), `FAIXAS`, `LIMITE_LEUCOCITOSE = 10000`, `LIMITE_NEUTROFILIA = 7500`, `LIMITE_PCR = 5.0`, `LIMITE_LEUCOCITURIA = 10`, `ORDEM_CAMPOS`, `VALORES_VAZIOS`, `lerNumero(texto) -> number|null`, `lerInteiro(texto) -> number|null`, `arredondar(valor, casas) -> number`, `paraMm3(valor, unidade)`, `neutrofilosParaMm3(valor, unidade, leucocitosMm3)`, `pcrParaMgdl(valor, unidade)`, `temperaturaParaC(valor, unidade)`, `dentroDaFaixa(valor, [min, max])`, `validarFormulario(valores, unidades) -> {erros, entrada, convertidos}`, `acoplarRaioX(valores, campo, valor) -> valores`, `algumRaioXNaoRealizado(valores) -> boolean`.
- `valores` (estado do formulário): `idade`, `peso`, `leucocitos`, `neutrofilos`, `pcr`, `urina` como texto digitado. `sexo` em `'M' | 'F' | ''`. `nausea`, `emese`, `febre`, `disuria`, `dor_fid`, `dor_difusa` em `'sim' | 'nao' | ''`. `rx_fid`, `rx_difuso` em `'sim' | 'nao' | 'nao_realizado' | ''`. `declaracao` booleano. A Parte 3 acrescenta `migracao`, `anorexia`, `acetona`, `descompressao`, `dor_tosse` e `temperatura`.
- `unidades`: `{leucocitos: 'mm3'|'mil_ul', neutrofilos: 'mm3'|'mil_ul'|'pct', pcr: 'mgdl'|'mgl', temperatura: 'c'|'f'}`.
- `convertidos`: `{leucocitosMm3, neutrofilosMm3, neutrofilosPct, pcrMgdl}`, usado pelos escores da Parte 3.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/entrada.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIDADES_INICIAIS,
  VALORES_VAZIOS,
  acoplarRaioX,
  algumRaioXNaoRealizado,
  arredondar,
  lerInteiro,
  lerNumero,
  neutrofilosParaMm3,
  paraMm3,
  pcrParaMgdl,
  validarFormulario,
} from '../../public/js/entrada.js';

const UNIDADES_PT = { ...UNIDADES_INICIAIS.pt };
const UNIDADES_EN = { ...UNIDADES_INICIAIS.en };

function valoresValidos(mudancas = {}) {
  return {
    ...VALORES_VAZIOS,
    idade: '8', sexo: 'M', peso: '27,5',
    nausea: 'sim', emese: 'nao', febre: 'nao', disuria: 'nao',
    dor_fid: 'sim', dor_difusa: 'nao', rx_fid: 'nao', rx_difuso: 'nao',
    leucocitos: '12600', neutrofilos: '9800', pcr: '3,2', urina: '4',
    declaracao: true,
    ...mudancas,
  };
}

test('lerNumero_aceita_virgula_ou_ponto', () => {
  assert.equal(lerNumero('12,5'), 12.5);
  assert.equal(lerNumero('12.5'), 12.5);
  assert.equal(lerNumero(' 7 '), 7);
});

test('lerNumero_sem_separador_de_milhar', () => {
  assert.equal(lerNumero('12.600'), 12.6);
});

test('lerNumero_recusa_texto_que_nao_e_numero', () => {
  for (const texto of ['', 'abc', '-3', '1e3', '1,2,3', ',5', '12 600', '+4']) {
    assert.equal(lerNumero(texto), null, texto);
  }
});

test('lerInteiro_so_aceita_inteiro', () => {
  assert.equal(lerInteiro('8'), 8);
  assert.equal(lerInteiro('8,5'), null);
  assert.equal(lerInteiro('8.0'), null);
});

test('arredondar_sem_residuo_de_ponto_flutuante', () => {
  assert.equal(arredondar(1.005, 2), 1.01);
  assert.equal(arredondar(12.6 * 1000, 0), 12600);
});

test('conversoes_para_a_unidade_do_treino', () => {
  assert.equal(paraMm3(12.6, 'mil_ul'), 12600);
  assert.equal(paraMm3(12650.4, 'mm3'), 12650);
  assert.equal(neutrofilosParaMm3(9.57, 'mil_ul', null), 9570);
  assert.equal(neutrofilosParaMm3(80, 'pct', 12600), 10080);
  assert.equal(pcrParaMgdl(45, 'mgl'), 4.5);
  assert.equal(pcrParaMgdl(45.55, 'mgl'), 4.56);
  assert.equal(pcrParaMgdl(4.567, 'mgdl'), 4.57);
});

test('unidades_iniciais_seguem_o_idioma', () => {
  assert.deepEqual(UNIDADES_INICIAIS.pt, { leucocitos: 'mm3', neutrofilos: 'mm3', pcr: 'mgdl', temperatura: 'c' });
  assert.deepEqual(UNIDADES_INICIAIS.en, { leucocitos: 'mil_ul', neutrofilos: 'mil_ul', pcr: 'mgl', temperatura: 'c' });
});

test('validarFormulario_caminho_feliz_monta_as_19_entradas', () => {
  const { erros, entrada } = validarFormulario(valoresValidos(), UNIDADES_PT);
  assert.deepEqual(erros, []);
  assert.deepEqual(entrada, {
    idade_anos: 8, leucocitos: 12600, neutrofilos: 9800, pcr: 3.2, leucocitos_urina: 4, peso: 27.5,
    nausea: 1, emese: 0, febre: 0, disuria: 0, ped_dor_fid: 1, ped_dor_difusa: 0,
    ped_rx_nivel_fid: 0, ped_rx_nivel_difuso: 0,
    leucocitose: 1, neutrofilia: 1, pcr_alterado: 0, leucocituria: 0,
    sexo: 'M',
  });
});

test('validarFormulario_converte_as_unidades_do_ingles', () => {
  const valores = valoresValidos({ leucocitos: '12.6', neutrofilos: '9,8', pcr: '45' });
  const { erros, entrada } = validarFormulario(valores, UNIDADES_EN);
  assert.deepEqual(erros, []);
  assert.equal(entrada.leucocitos, 12600);
  assert.equal(entrada.neutrofilos, 9800);
  assert.equal(entrada.pcr, 4.5);
});

test('derivadas_usam_maior_estrito', () => {
  const casos = [
    [{ leucocitos: '10000', neutrofilos: '5000' }, 'leucocitose', 0],
    [{ leucocitos: '10001', neutrofilos: '5000' }, 'leucocitose', 1],
    [{ neutrofilos: '7500' }, 'neutrofilia', 0],
    [{ neutrofilos: '7501' }, 'neutrofilia', 1],
    [{ pcr: '5' }, 'pcr_alterado', 0],
    [{ pcr: '5,01' }, 'pcr_alterado', 1],
    [{ urina: '10' }, 'leucocituria', 0],
    [{ urina: '10,1' }, 'leucocituria', 1],
  ];
  for (const [mudancas, derivada, esperado] of casos) {
    const { entrada } = validarFormulario(valoresValidos(mudancas), UNIDADES_PT);
    assert.equal(entrada[derivada], esperado, JSON.stringify(mudancas));
  }
});

test('campo_vazio_bloqueia_e_os_erros_seguem_a_ordem_do_formulario', () => {
  const { erros, entrada } = validarFormulario(valoresValidos({ pcr: '', idade: '', declaracao: false }), UNIDADES_PT);
  assert.equal(entrada, null);
  assert.deepEqual(erros.map((e) => [e.campo, e.codigo]), [['idade', 'vazio'], ['pcr', 'vazio'], ['declaracao', 'declaracao']]);
});

test('idade_fora_de_2_a_14_mostra_a_mensagem_da_idade', () => {
  for (const idade of ['1', '15']) {
    const { erros } = validarFormulario(valoresValidos({ idade }), UNIDADES_PT);
    assert.deepEqual(erros, [{ campo: 'idade', codigo: 'idade' }]);
  }
});

test('idade_nao_inteira_mostra_a_mensagem_de_faixa', () => {
  const { erros } = validarFormulario(valoresValidos({ idade: '8,5' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'idade', codigo: 'faixa', faixa: [2, 14], unidade: 'anos' }]);
});

test('leucocitos_com_ponto_de_milhar_caem_fora_da_faixa', () => {
  const { erros } = validarFormulario(valoresValidos({ leucocitos: '12.600', neutrofilos: '9' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'leucocitos', codigo: 'faixa', faixa: [500, 60000], unidade: 'mm3' }]);
});

test('neutrofilos_acima_dos_leucocitos_bloqueiam', () => {
  const { erros } = validarFormulario(valoresValidos({ leucocitos: '9000', neutrofilos: '9500' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'neutrofilos', codigo: 'neutrofilos_acima' }]);
});

test('faixas_na_unidade_digitada', () => {
  const casos = [
    [{ neutrofilos: '101' }, { ...UNIDADES_PT, neutrofilos: 'pct' }, 'neutrofilos', [0, 100], 'pct'],
    [{ pcr: '61' }, UNIDADES_PT, 'pcr', [0, 60], 'mgdl'],
    [{ pcr: '601', leucocitos: '12,6', neutrofilos: '9,8' }, UNIDADES_EN, 'pcr', [0, 600], 'mgl'],
    [{ peso: '7,9' }, UNIDADES_PT, 'peso', [8, 120], 'kg'],
    [{ urina: '501' }, UNIDADES_PT, 'urina', [0, 500], 'campo'],
  ];
  for (const [mudancas, unidades, campo, faixa, unidade] of casos) {
    const { erros } = validarFormulario(valoresValidos(mudancas), unidades);
    assert.deepEqual(erros, [{ campo, codigo: 'faixa', faixa, unidade }], JSON.stringify(mudancas));
  }
  const { erros } = validarFormulario(valoresValidos({ pcr: '600', leucocitos: '12,6', neutrofilos: '9,8' }), UNIDADES_EN);
  assert.deepEqual(erros, []);
});

test('raio_x_nao_realizado_vira_faltante', () => {
  const { entrada } = validarFormulario(valoresValidos({ rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' }), UNIDADES_PT);
  assert.equal(entrada.ped_rx_nivel_fid, null);
  assert.equal(entrada.ped_rx_nivel_difuso, null);
});

test('raio_x_em_branco_pede_resposta', () => {
  const { erros } = validarFormulario(valoresValidos({ rx_difuso: '' }), UNIDADES_PT);
  assert.deepEqual(erros, [{ campo: 'rx_difuso', codigo: 'vazio' }]);
});

test('acoplarRaioX_nao_realizado_puxa_o_outro', () => {
  const valores = acoplarRaioX({ rx_fid: '', rx_difuso: 'sim' }, 'rx_fid', 'nao_realizado');
  assert.deepEqual(valores, { rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' });
});

test('acoplarRaioX_sim_ou_nao_limpa_o_nao_realizado_do_outro', () => {
  const valores = acoplarRaioX({ rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' }, 'rx_difuso', 'sim');
  assert.deepEqual(valores, { rx_fid: '', rx_difuso: 'sim' });
});

test('acoplarRaioX_nao_mexe_no_outro_quando_ele_ja_tem_resposta', () => {
  const valores = acoplarRaioX({ rx_fid: 'nao', rx_difuso: 'sim' }, 'rx_fid', 'sim');
  assert.deepEqual(valores, { rx_fid: 'sim', rx_difuso: 'sim' });
});

test('algumRaioXNaoRealizado', () => {
  assert.equal(algumRaioXNaoRealizado({ rx_fid: 'nao_realizado', rx_difuso: 'nao_realizado' }), true);
  assert.equal(algumRaioXNaoRealizado({ rx_fid: 'sim', rx_difuso: 'nao' }), false);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/entrada.test.js`. Esperado: módulo não encontrado.

- [ ] **Passo 3: escrever `public/js/entrada.js`.**

```js
// Leitura dos campos, unidades, faixas e montagem das 19 entradas.
// Funções puras, sem DOM. Faixas aprovadas na Q3.28 (spec, seção 5.4).

export const UNIDADES = Object.freeze({
  leucocitos: Object.freeze(['mm3', 'mil_ul']),
  neutrofilos: Object.freeze(['mm3', 'mil_ul', 'pct']),
  pcr: Object.freeze(['mgdl', 'mgl']),
  temperatura: Object.freeze(['c', 'f']),
});

export const UNIDADES_INICIAIS = Object.freeze({
  pt: Object.freeze({ leucocitos: 'mm3', neutrofilos: 'mm3', pcr: 'mgdl', temperatura: 'c' }),
  en: Object.freeze({ leucocitos: 'mil_ul', neutrofilos: 'mil_ul', pcr: 'mgl', temperatura: 'c' }),
});

export const FAIXAS = Object.freeze({
  idade: Object.freeze({ anos: [2, 14] }),
  peso: Object.freeze({ kg: [8, 120] }),
  leucocitos: Object.freeze({ mm3: [500, 60000], mil_ul: [0.5, 60] }),
  neutrofilos: Object.freeze({ mm3: [0, 50000], mil_ul: [0, 50], pct: [0, 100] }),
  pcr: Object.freeze({ mgdl: [0, 60], mgl: [0, 600] }),
  urina: Object.freeze({ campo: [0, 500] }),
  temperatura: Object.freeze({ c: [34, 43], f: [93.2, 109.4] }),
});

export const LIMITE_LEUCOCITOSE = 10000;
export const LIMITE_NEUTROFILIA = 7500;
export const LIMITE_PCR = 5.0;
export const LIMITE_LEUCOCITURIA = 10;

export const ORDEM_CAMPOS = Object.freeze([
  'idade', 'sexo', 'peso', 'nausea', 'emese', 'febre', 'disuria', 'dor_fid', 'dor_difusa',
  'rx_fid', 'rx_difuso', 'leucocitos', 'neutrofilos', 'pcr', 'urina',
  'migracao', 'anorexia', 'acetona', 'descompressao', 'dor_tosse', 'temperatura', 'declaracao',
]);

export const VALORES_VAZIOS = Object.freeze({
  idade: '', sexo: '', peso: '',
  nausea: '', emese: '', febre: '', disuria: '', dor_fid: '', dor_difusa: '',
  rx_fid: '', rx_difuso: '',
  leucocitos: '', neutrofilos: '', pcr: '', urina: '',
  migracao: '', anorexia: '', acetona: '', descompressao: '', dor_tosse: '', temperatura: '',
  declaracao: false,
});

const PADRAO_DECIMAL = /^\d+(?:[.,]\d+)?$/;
const PADRAO_INTEIRO = /^\d+$/;
const SIM_NAO = Object.freeze({ sim: 1, nao: 0 });
const RAIO_X = Object.freeze({ sim: 1, nao: 0, nao_realizado: null });
const BINARIAS = Object.freeze([
  ['nausea', 'nausea'], ['emese', 'emese'], ['febre', 'febre'], ['disuria', 'disuria'],
  ['dor_fid', 'ped_dor_fid'], ['dor_difusa', 'ped_dor_difusa'],
]);

function vazio(texto) {
  return String(texto ?? '').trim() === '';
}

/** Lê número com no máximo um separador decimal, vírgula ou ponto. */
export function lerNumero(texto) {
  const limpo = String(texto ?? '').trim();
  return PADRAO_DECIMAL.test(limpo) ? Number(limpo.replace(',', '.')) : null;
}

/** Lê só inteiro sem sinal. */
export function lerInteiro(texto) {
  const limpo = String(texto ?? '').trim();
  return PADRAO_INTEIRO.test(limpo) ? Number(limpo) : null;
}

/** Arredonda a n casas sem o resíduo da multiplicação em ponto flutuante. */
export function arredondar(valor, casas) {
  const fator = 10 ** casas;
  return Math.round(Number((valor * fator).toPrecision(12))) / fator;
}

/** Leucócitos ou neutrófilos absolutos em /mm³, inteiros. */
export function paraMm3(valor, unidade) {
  return arredondar(unidade === 'mil_ul' ? valor * 1000 : valor, 0);
}

/** Neutrófilos em /mm³, a partir de /mm³, ×10³/µL ou percentual dos leucócitos. */
export function neutrofilosParaMm3(valor, unidade, leucocitosMm3) {
  if (unidade === 'pct') return arredondar((valor * leucocitosMm3) / 100, 0);
  return paraMm3(valor, unidade);
}

/** PCR em mg/dL com duas casas. */
export function pcrParaMgdl(valor, unidade) {
  return arredondar(unidade === 'mgl' ? valor / 10 : valor, 2);
}

/** Temperatura em °C. °F é convertido e arredondado a uma casa (S5). */
export function temperaturaParaC(valor, unidade) {
  return unidade === 'f' ? arredondar(((valor - 32) * 5) / 9, 1) : valor;
}

export function dentroDaFaixa(valor, [minimo, maximo]) {
  return valor >= minimo && valor <= maximo;
}

function lerCampoNumerico(campo, texto, faixa, unidade, erros) {
  if (vazio(texto)) {
    erros.push({ campo, codigo: 'vazio' });
    return null;
  }
  const valor = lerNumero(texto);
  if (valor === null || !dentroDaFaixa(valor, faixa)) {
    erros.push({ campo, codigo: 'faixa', faixa, unidade });
    return null;
  }
  return valor;
}

function lerEscolha(campo, valor, opcoes, erros) {
  if (!Object.hasOwn(opcoes, valor ?? '')) {
    erros.push({ campo, codigo: 'vazio' });
    return undefined;
  }
  return opcoes[valor];
}

function lerIdade(texto, erros) {
  if (vazio(texto)) {
    erros.push({ campo: 'idade', codigo: 'vazio' });
    return null;
  }
  const idade = lerInteiro(texto);
  if (idade === null) {
    erros.push({ campo: 'idade', codigo: 'faixa', faixa: FAIXAS.idade.anos, unidade: 'anos' });
    return null;
  }
  if (!dentroDaFaixa(idade, FAIXAS.idade.anos)) {
    erros.push({ campo: 'idade', codigo: 'idade' });
    return null;
  }
  return idade;
}

function ordenar(erros) {
  return [...erros].sort((a, b) => ORDEM_CAMPOS.indexOf(a.campo) - ORDEM_CAMPOS.indexOf(b.campo));
}

/** Valida o formulário inteiro e monta as 19 entradas do modelo. */
export function validarFormulario(valores, unidades) {
  const erros = [];
  const idade = lerIdade(valores.idade, erros);
  const sexo = ['M', 'F'].includes(valores.sexo) ? valores.sexo : null;
  if (sexo === null) erros.push({ campo: 'sexo', codigo: 'vazio' });
  const peso = lerCampoNumerico('peso', valores.peso, FAIXAS.peso.kg, 'kg', erros);
  const binarias = {};
  for (const [campo, nome] of BINARIAS) binarias[nome] = lerEscolha(campo, valores[campo], SIM_NAO, erros);
  const rxFid = lerEscolha('rx_fid', valores.rx_fid, RAIO_X, erros);
  const rxDifuso = lerEscolha('rx_difuso', valores.rx_difuso, RAIO_X, erros);

  const uLeuco = unidades.leucocitos;
  const leucoDigitado = lerCampoNumerico('leucocitos', valores.leucocitos, FAIXAS.leucocitos[uLeuco], uLeuco, erros);
  const leucocitosMm3 = leucoDigitado === null ? null : paraMm3(leucoDigitado, uLeuco);

  const uNeutro = unidades.neutrofilos;
  const neutroDigitado = lerCampoNumerico('neutrofilos', valores.neutrofilos, FAIXAS.neutrofilos[uNeutro], uNeutro, erros);
  let neutrofilosMm3 = null;
  if (neutroDigitado !== null && (uNeutro !== 'pct' || leucocitosMm3 !== null)) {
    neutrofilosMm3 = neutrofilosParaMm3(neutroDigitado, uNeutro, leucocitosMm3);
    if (leucocitosMm3 !== null && neutrofilosMm3 > leucocitosMm3) {
      erros.push({ campo: 'neutrofilos', codigo: 'neutrofilos_acima' });
      neutrofilosMm3 = null;
    }
  }

  const uPcr = unidades.pcr;
  const pcrDigitada = lerCampoNumerico('pcr', valores.pcr, FAIXAS.pcr[uPcr], uPcr, erros);
  const pcrMgdl = pcrDigitada === null ? null : pcrParaMgdl(pcrDigitada, uPcr);
  const urina = lerCampoNumerico('urina', valores.urina, FAIXAS.urina.campo, 'campo', erros);

  if (valores.declaracao !== true) erros.push({ campo: 'declaracao', codigo: 'declaracao' });
  if (erros.length > 0) return { erros: ordenar(erros), entrada: null, convertidos: null };

  const convertidos = {
    leucocitosMm3,
    neutrofilosMm3,
    neutrofilosPct: uNeutro === 'pct' ? neutroDigitado : (100 * neutrofilosMm3) / leucocitosMm3,
    pcrMgdl,
  };
  const entrada = {
    idade_anos: idade,
    leucocitos: leucocitosMm3,
    neutrofilos: neutrofilosMm3,
    pcr: pcrMgdl,
    leucocitos_urina: urina,
    peso,
    ...binarias,
    ped_rx_nivel_fid: rxFid,
    ped_rx_nivel_difuso: rxDifuso,
    leucocitose: leucocitosMm3 > LIMITE_LEUCOCITOSE ? 1 : 0,
    neutrofilia: neutrofilosMm3 > LIMITE_NEUTROFILIA ? 1 : 0,
    pcr_alterado: pcrMgdl > LIMITE_PCR ? 1 : 0,
    leucocituria: urina > LIMITE_LEUCOCITURIA ? 1 : 0,
    sexo,
  };
  return { erros: [], entrada, convertidos };
}

/** "Não realizado" num campo do raio X puxa o outro. Sim ou Não limpa o do outro (S3). */
export function acoplarRaioX(valores, campo, valor) {
  const outro = campo === 'rx_fid' ? 'rx_difuso' : 'rx_fid';
  const novos = { ...valores, [campo]: valor };
  if (valor === 'nao_realizado') novos[outro] = 'nao_realizado';
  else if (valores[outro] === 'nao_realizado') novos[outro] = '';
  return novos;
}

export function algumRaioXNaoRealizado(valores) {
  return valores.rx_fid === 'nao_realizado' || valores.rx_difuso === 'nao_realizado';
}
```

- [ ] **Passo 4: rodar e ver passar.** `npm test`. Esperado: tudo verde.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/entrada.js tests/js/entrada.test.js && git commit -m "feat: ler os campos com unidades, faixas aceitas e raio X acoplado"
```

### Tarefa 2.4: desenho visual (com portão do Wilson)

**Arquivos:**
- Criar: `public/css/apendisite.css`, `public/img/favicon.png`

Esta tarefa é de design. As três skills de front-end se aplicam pela ordem da seção 4 do manual: identidade da marca (brand pack do apendisite, logo `HOR_COR_3.png`, azul-marinho `#324676` do QR), depois `design-taste` (modo Operate, que é ferramenta), `frontend-design` e `anti-slop-design` como verificador.

- [ ] **Passo 1: carregar as skills `design-taste`, `frontend-design` e `anti-slop-design`.**

- [ ] **Passo 2: medir as cores do logo.** Eu abro `public/img/logo.png` e anoto as cores do texto e do degradê do símbolo, para a paleta.

- [ ] **Passo 3: escrever o plano de design e mostrar ao Wilson.** Design Read e os três dials do `design-taste`, 4 a 6 cores nomeadas em hex, a fonte do sistema (spec 10.1) com papéis de tamanho, e o layout em ASCII para celular (o QR abre no celular) e para computador. Contraste AA em todo texto. Resultado com a faixa marcada sem depender só de cor. Esperar o OK antes do CSS.

- [ ] **Passo 4: escrever `public/css/apendisite.css`** seguindo o plano aprovado e o contrato de classes abaixo, que `app.js` e `privacidade.js` usam:

| Classe ou seletor | Elemento |
|---|---|
| `.cabecalho`, `.logo`, `.frase` | topo com logo e frase |
| `.idioma`, `.idioma button[aria-pressed="true"]`, `.aviso-idioma` | botões PT e EN |
| `.grupo` (fieldset), `.grupo > legend`, `.ajuda` | grupos do formulário |
| `.campo`, `.campo-numero`, `.unidade` (select) | campo numérico com unidade |
| `.escolha` (fieldset), `.opcoes` | Sim, Não, Não realizado |
| `.erro`, `[aria-invalid="true"]` | mensagem e campo com erro |
| `.declaracao`, `.botao-principal`, `.botao-secundario` | declaração e botões |
| `.resultado`, `.faixa-baixa`, `.faixa-intermediaria`, `.faixa-alta` | bloco do resultado |
| `.escore`, `.corte`, `.faixa`, `.aviso`, `.linhas` | linhas do resultado |
| `.pictograma`, `.quadrado`, `.quadrado.cheio`, `.legenda` | grade de 10 por 10 |
| `.escores`, `.bloco-escore`, `.item-escore`, `.item-escore.presente`, `.item-escore.ausente`, `.item-escore.pendente`, `.total-escore`, `.nota` | Parte 3 |
| `.convite`, `.utilidade`, `.escala`, `.questionario` (dialog), `.isca` | Parte 4 |
| `.sobre`, `details`, `summary`, `.autoria`, `.referencias` | seções recolhidas e autoria |
| `.rodape` | rodapé |
| `.visualmente-oculto` | texto só para leitor de tela |
| `.erro-modelo` | falha ao carregar o modelo |

`.isca` tira o campo da tela sem `display: none` (posição absoluta fora da área visível), para o robô ainda o ver.

- [ ] **Passo 5: favicon (Wilson).** Recorta o símbolo do logo e reduz a 64 por 64.

```bash
cd ~/Documents/apendisite && sips -c 299 299 --cropOffset 0 0 public/img/logo.png --out /tmp/simbolo_apendisite.png && sips -z 64 64 /tmp/simbolo_apendisite.png --out public/img/favicon.png && sips -g pixelWidth -g pixelHeight public/img/favicon.png
```

Eu abro `public/img/favicon.png` e confiro que é o símbolo inteiro, sem a palavra.

- [ ] **Passo 6: verificação de design.** `scripts/preflight.mjs` do `design-taste` sobre o HTML e o CSS, depois o portão de 7 eixos do `anti-slop-design` (nota mínima 4 em todos). Violação "hard" volta ao passo 4. Este passo roda de novo no fim da tarefa 2.5, com a página montada.

- [ ] **Passo 7: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/css/apendisite.css public/img/favicon.png && git commit -m "feat: definir o estilo da calculadora a partir da marca"
```

### Tarefa 2.5: página da calculadora

**Arquivos:**
- Criar: `public/index.html`, `public/js/dom.js`, `public/js/app.js`, `.claude/launch.json`
- Teste: `tests/js/pagina.test.js`

**Interfaces:**
- Consome: tudo das tarefas 1.4 e 2.1 a 2.3.
- Produz: `dom.js` com `el(tag, atributos, ...filhos)`, `lerIdiomaGuardado() -> string|null`, `gravarIdioma(idioma) -> void`, `idiomaInicial() -> 'pt'|'en'`, `seletorDeIdioma(idioma, aviso, aoTrocar) -> HTMLElement`. Em `app.js`, as funções `desenhar()`, `calcular()` e `desenharResultado()`, que as Partes 3 e 4 estendem.

- [ ] **Passo 1: escrever o teste da página que falha.**

`tests/js/pagina.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { lerJson, lerTexto } from './auxiliares.js';

const DOMINIOS_PERMITIDOS = ['https://doi.org/', 'https://zenodo.org/', 'https://apendisite.com.br'];
const PASTAS_HTML = ['public', 'plano-b'];

async function arquivos(pasta, extensao) {
  let nomes = [];
  try {
    nomes = await readdir(new URL(`../../${pasta}/`, import.meta.url), { recursive: true });
  } catch {
    return [];
  }
  return nomes.filter((nome) => nome.endsWith(extensao)).map((nome) => `${pasta}/${nome}`);
}

const htmls = (await Promise.all(PASTAS_HTML.map((p) => arquivos(p, '.html')))).flat();
const scripts = await arquivos('public/js', '.js');

test('existe_pelo_menos_a_pagina_principal', () => {
  assert.ok(htmls.includes('public/index.html'));
});

test('html_sem_estilo_nem_script_embutido', async () => {
  for (const caminho of htmls) {
    const html = await lerTexto(caminho);
    assert.ok(!/<style/i.test(html), `${caminho}: <style>`);
    assert.ok(!/\sstyle\s*=/i.test(html), `${caminho}: atributo style`);
    assert.ok(!/\son[a-z]+\s*=/i.test(html), `${caminho}: atributo de evento`);
    for (const [, atributos] of html.matchAll(/<script([^>]*)>/gi)) {
      assert.ok(/\ssrc=/.test(atributos), `${caminho}: script sem src`);
    }
  }
});

test('html_sem_recurso_de_outro_dominio', async () => {
  for (const caminho of htmls) {
    const html = await lerTexto(caminho);
    for (const [, url] of html.matchAll(/<(?:script|link|img)[^>]*\s(?:src|href)="([^"]+)"/gi)) {
      assert.ok(!/^[a-z]+:\/\//i.test(url) && !url.startsWith('//'), `${caminho}: ${url}`);
    }
  }
});

test('javascript_so_cita_dominios_permitidos', async () => {
  for (const caminho of scripts) {
    const codigo = await lerTexto(caminho);
    for (const [url] of codigo.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
      assert.ok(DOMINIOS_PERMITIDOS.some((d) => url.startsWith(d)), `${caminho}: ${url}`);
    }
  }
});

test('javascript_nao_usa_innerHTML', async () => {
  for (const caminho of scripts) {
    assert.ok(!(await lerTexto(caminho)).includes('innerHTML'), caminho);
  }
});

test('localStorage_so_grava_as_duas_chaves_da_privacidade', async () => {
  for (const caminho of scripts) {
    const codigo = await lerTexto(caminho);
    for (const [, chave] of codigo.matchAll(/\.setItem\(\s*([^,]+),/g)) {
      assert.ok(['CHAVE_IDIOMA', 'CHAVE_SUS'].includes(chave.trim()), `${caminho}: ${chave}`);
    }
  }
});

test('meta_da_versao_igual_a_versao_do_modelo', async () => {
  const html = await lerTexto('public/index.html');
  const modelo = await lerJson('public/modelo/random_forest_v1.0.0.json');
  assert.ok(html.includes(`<meta name="versao-modelo" content="${modelo.versao_modelo}">`));
});

test('pagina_principal_avisa_sem_javascript_nos_dois_idiomas', async () => {
  const html = await lerTexto('public/index.html');
  assert.ok(html.includes('A calculadora do apendisite precisa de JavaScript.'));
  assert.ok(html.includes('The apendisite calculator requires JavaScript.'));
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/pagina.test.js`. Esperado: falha em `existe_pelo_menos_a_pagina_principal`.

- [ ] **Passo 3: escrever `public/index.html`.**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="versao-modelo" content="1.0.0">
  <meta name="description" content="Escore de apendicite em crianças de 2 a 14 anos. Appendicitis score for children aged 2 to 14 years.">
  <title>apendisite</title>
  <link rel="icon" type="image/png" href="/img/favicon.png">
  <link rel="stylesheet" href="/css/apendisite.css">
  <script type="module" src="/js/app.js"></script>
</head>
<body>
  <noscript>
    <p lang="pt-BR">A calculadora do apendisite precisa de JavaScript. Ative o JavaScript no navegador e recarregue a página.</p>
    <p lang="en">The apendisite calculator requires JavaScript. Enable JavaScript in your browser and reload the page.</p>
  </noscript>
  <div id="app"></div>
</body>
</html>
```

- [ ] **Passo 4: escrever `public/js/dom.js`.**

```js
// Auxiliares de DOM e de idioma, comuns à calculadora e à Privacidade.
import { CHAVE_IDIOMA, IDIOMAS, escolherIdioma } from './textos.js';

/** Cria um elemento com atributos, ouvintes (on*) e filhos, sem innerHTML. */
export function el(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nome === 'class') elemento.className = valor;
    else if (nome.startsWith('on')) elemento.addEventListener(nome.slice(2), valor);
    else if (valor === true) elemento.setAttribute(nome, '');
    else elemento.setAttribute(nome, String(valor));
  }
  for (const filho of filhos.flat(Infinity)) {
    if (filho === null || filho === undefined || filho === false) continue;
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return elemento;
}

/** Idioma guardado no aparelho, ou null se não há ou o armazenamento falha. */
export function lerIdiomaGuardado() {
  try {
    return localStorage.getItem(CHAVE_IDIOMA);
  } catch {
    return null;
  }
}

/** Guarda o idioma. Sem armazenamento, o idioma vale só nesta visita. */
export function gravarIdioma(idioma) {
  try {
    localStorage.setItem(CHAVE_IDIOMA, idioma);
  } catch {
    // Navegador sem armazenamento (modo privado ou bloqueio): segue sem gravar.
  }
}

/** Idioma da visita: ?lang, depois o aparelho, depois o navegador. */
export function idiomaInicial() {
  return escolherIdioma({
    parametroUrl: new URLSearchParams(window.location.search).get('lang'),
    guardado: lerIdiomaGuardado(),
    idiomasNavegador: navigator.languages?.length ? navigator.languages : [navigator.language],
  });
}

/** Botões PT e EN com o aviso de que o idioma fica no aparelho. */
export function seletorDeIdioma(idioma, aviso, aoTrocar) {
  const botoes = IDIOMAS.map((codigo) =>
    el('button', {
      type: 'button',
      lang: codigo === 'pt' ? 'pt-BR' : 'en',
      'aria-pressed': codigo === idioma ? 'true' : 'false',
      onclick: () => {
        if (codigo === idioma) return;
        gravarIdioma(codigo);
        aoTrocar(codigo);
      },
    }, codigo.toUpperCase()),
  );
  return el('div', { class: 'idioma' }, botoes[0], ' | ', botoes[1], el('span', { class: 'aviso-idioma' }, aviso));
}
```

- [ ] **Passo 5: escrever `public/js/app.js`** (versão da Parte 2: formulário, resultado, seções recolhidas e rodapé).

```js
// Interface da calculadora. Único módulo, com dom.js, que toca o DOM.
import { el, idiomaInicial, seletorDeIdioma } from './dom.js';
import { acoplarRaioX, algumRaioXNaoRealizado, UNIDADES, UNIDADES_INICIAIS, VALORES_VAZIOS, validarFormulario } from './entrada.js';
import { formatarEscore, quadradosCheios } from './formato.js';
import { calcularEscore, carregarModelo, classificar } from './modelo.js';
import { DOI_CONCEITO, DOI_VERSAO, SIMBOLOS_UNIDADE, TEXTOS, mensagemDeErro, preencher, urlDoi } from './textos.js';

const CAMINHO_MODELO = '/modelo/random_forest_v1.0.0.json';
const EMAIL_CONTATO = 'contato@apendisite.com.br';
const QUADRADOS_NO_PICTOGRAMA = 100;

const estado = {
  idioma: 'pt',
  unidades: null,
  valores: { ...VALORES_VAZIOS },
  erros: [],
  resultado: null,
  modelo: null,
  erroModelo: false,
};

function t(chave) {
  return TEXTOS[estado.idioma][chave];
}

function versaoDoModelo() {
  return document.querySelector('meta[name="versao-modelo"]').getAttribute('content');
}

function erroDo(campo) {
  return estado.erros.find((erro) => erro.campo === campo) ?? null;
}

function mensagem(campo) {
  const erro = erroDo(campo);
  return erro ? el('p', { class: 'erro', id: `erro-${campo}` }, mensagemDeErro(erro, estado.idioma)) : null;
}

function campoNumerico(campo, rotulo, { ajuda = null, grandeza = null } = {}) {
  const invalido = erroDo(campo) !== null;
  const seletor = grandeza
    ? el('select', {
        class: 'unidade',
        'aria-label': `${t('unidade')}: ${rotulo}`,
        onchange: (evento) => { estado.unidades[grandeza] = evento.target.value; },
      }, UNIDADES[grandeza].map((unidade) =>
        el('option', { value: unidade, selected: estado.unidades[grandeza] === unidade }, SIMBOLOS_UNIDADE[unidade])))
    : null;
  return el('div', { class: 'campo campo-numero' },
    el('label', { for: `campo-${campo}` }, rotulo),
    ajuda ? el('p', { class: 'ajuda', id: `ajuda-${campo}` }, ajuda) : null,
    el('input', {
      id: `campo-${campo}`,
      name: campo,
      type: 'text',
      inputmode: campo === 'idade' ? 'numeric' : 'decimal',
      autocomplete: 'off',
      value: estado.valores[campo],
      'aria-invalid': invalido ? 'true' : null,
      'aria-describedby': [ajuda ? `ajuda-${campo}` : null, invalido ? `erro-${campo}` : null].filter(Boolean).join(' ') || null,
      oninput: (evento) => { estado.valores[campo] = evento.target.value; },
    }),
    seletor,
    mensagem(campo));
}

function campoEscolha(campo, rotulo, opcoes, aoMudar = null) {
  const invalido = erroDo(campo) !== null;
  return el('fieldset', { class: 'escolha', 'aria-invalid': invalido ? 'true' : null, 'aria-describedby': invalido ? `erro-${campo}` : null },
    el('legend', {}, rotulo),
    el('div', { class: 'opcoes' }, opcoes.map(([valor, texto], i) =>
      el('label', {},
        el('input', {
          type: 'radio',
          name: campo,
          value: valor,
          id: i === 0 ? `campo-${campo}` : null,
          checked: estado.valores[campo] === valor,
          onchange: () => {
            if (aoMudar) aoMudar(valor);
            else estado.valores[campo] = valor;
          },
        }),
        ` ${texto}`))),
    mensagem(campo));
}

function simNao() {
  return [['sim', t('sim')], ['nao', t('nao')]];
}

function mudarRaioX(campo) {
  return (valor) => {
    estado.valores = acoplarRaioX(estado.valores, campo, valor);
    desenhar();
  };
}

function desenharCabecalho() {
  return el('header', { class: 'cabecalho' },
    el('h1', {}, el('img', { class: 'logo', src: '/img/logo.png', alt: t('nome'), width: '1520', height: '299' })),
    el('p', { class: 'frase' }, t('frase')),
    seletorDeIdioma(estado.idioma, t('idioma_aviso'), trocarIdioma));
}

function desenharFormulario() {
  const rx = [['sim', t('sim')], ['nao', t('nao')], ['nao_realizado', t('nao_realizado')]];
  return el('form', { id: 'formulario', novalidate: true, onsubmit: (evento) => { evento.preventDefault(); calcular(); } },
    el('p', {}, t('form_abertura')),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_paciente')),
      campoNumerico('idade', t('idade'), { ajuda: t('idade_ajuda') }),
      campoEscolha('sexo', t('sexo'), [['M', t('sexo_m')], ['F', t('sexo_f')]]),
      campoNumerico('peso', t('peso'))),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_sintomas')),
      campoEscolha('nausea', t('nausea'), simNao()),
      campoEscolha('emese', t('vomito'), simNao()),
      campoEscolha('febre', t('febre'), simNao()),
      campoEscolha('disuria', t('disuria'), simNao())),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_exame')),
      campoEscolha('dor_fid', t('dor_fid'), simNao()),
      campoEscolha('dor_difusa', t('dor_difusa'), simNao())),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_rx')),
      el('p', { class: 'ajuda' }, t('rx_ajuda')),
      campoEscolha('rx_fid', t('rx_fid'), rx, mudarRaioX('rx_fid')),
      campoEscolha('rx_difuso', t('rx_difuso'), rx, mudarRaioX('rx_difuso'))),
    el('fieldset', { class: 'grupo' }, el('legend', {}, t('grupo_lab')),
      el('p', { class: 'ajuda' }, t('ajuda_numeros')),
      campoNumerico('leucocitos', t('leucocitos'), { grandeza: 'leucocitos' }),
      campoNumerico('neutrofilos', t('neutrofilos'), { grandeza: 'neutrofilos' }),
      campoNumerico('pcr', t('pcr'), { grandeza: 'pcr' }),
      campoNumerico('urina', t('urina'))),
    el('div', { class: 'declaracao' },
      el('label', {},
        el('input', {
          type: 'checkbox',
          id: 'campo-declaracao',
          checked: estado.valores.declaracao,
          'aria-invalid': erroDo('declaracao') ? 'true' : null,
          onchange: (evento) => { estado.valores.declaracao = evento.target.checked; },
        }),
        ` ${t('declaracao')}`),
      mensagem('declaracao')),
    estado.erroModelo ? el('p', { class: 'erro-modelo', role: 'alert' }, t('erro_modelo')) : null,
    el('button', { type: 'submit', class: 'botao-principal', disabled: estado.modelo === null }, t('calcular')));
}

function desenharResultado() {
  const resultado = estado.resultado;
  if (!resultado) return null;
  const { escore, classe, rxNaoRealizado } = resultado;
  const rotulo = (positivo) => t(positivo ? 'positivo' : 'negativo');
  const cheios = quadradosCheios(classe.faixa);
  const quadrados = Array.from({ length: QUADRADOS_NO_PICTOGRAMA }, (_, i) =>
    el('span', { class: i < cheios ? 'quadrado cheio' : 'quadrado' }));
  return el('section', { id: 'resultado', class: `resultado faixa-${classe.faixa}`, tabindex: '-1', 'aria-live': 'polite' },
    el('h2', {}, t('resultado_titulo')),
    el('p', { class: 'escore' }, preencher(t('escore'), { escore: formatarEscore(escore, estado.idioma) })),
    el('p', {}, t('escore_nao_chance')),
    el('p', { class: 'corte' }, preencher(t('corte_alta'), { classe: rotulo(classe.altaSensibilidade) })),
    el('p', { class: 'corte' }, preencher(t('corte_equilibrio'), { classe: rotulo(classe.equilibrio) })),
    el('p', { class: 'faixa' }, t(`faixa_${classe.faixa}`)),
    el('div', { class: 'pictograma', role: 'img', 'aria-label': t('legenda_pictograma') }, quadrados),
    el('p', { class: 'legenda' }, t('legenda_pictograma')),
    rxNaoRealizado ? el('p', { class: 'aviso' }, t('aviso_rx')) : null,
    el('ul', { class: 'linhas' }, t('linhas_visiveis').map((linha) => el('li', {}, linha))));
}

function desenharSobre() {
  const comoCitar = DOI_VERSAO
    ? el('section', {}, el('h3', {}, t('como_citar_titulo')), el('p', {}, preencher(t('como_citar'), { doi: DOI_VERSAO })))
    : null;
  return el('div', { class: 'sobre' },
    el('details', {}, el('summary', {}, t('como_feito_titulo')), t('como_feito').map((p) => el('p', {}, p))),
    el('details', {}, el('summary', {}, t('limitacoes_titulo')), el('ul', {}, t('limitacoes').map((item) => el('li', {}, item)))),
    el('section', { class: 'autoria' },
      el('h2', {}, t('autoria_titulo')),
      el('ul', {}, t('autores').map((autor) => el('li', {}, autor))),
      el('p', {}, t('instituicao')),
      el('p', {}, t('fomento')),
      comoCitar,
      el('p', {}, t('dados_alema')),
      el('h3', {}, t('referencias_titulo')),
      el('ol', { class: 'referencias' }, t('referencias').map((ref) => el('li', {}, ref)))));
}

function desenharRodape() {
  const itens = [
    el('a', { href: `/privacidade/${estado.idioma === 'en' ? '?lang=en' : ''}` }, t('rodape_privacidade')),
    el('a', { href: `mailto:${EMAIL_CONTATO}` }, t('rodape_contato')),
    el('span', {}, preencher(t('rodape_modelo'), { versao: versaoDoModelo() })),
    DOI_CONCEITO ? el('a', { href: urlDoi(DOI_CONCEITO) }, t('rodape_zenodo')) : null,
  ];
  return el('footer', { class: 'rodape' }, el('ul', {}, itens.filter(Boolean).map((item) => el('li', {}, item))));
}

function desenhar() {
  document.documentElement.lang = estado.idioma === 'pt' ? 'pt-BR' : 'en';
  document.getElementById('app').replaceChildren(
    desenharCabecalho(),
    el('main', {}, desenharFormulario(), desenharResultado(), desenharSobre()),
    desenharRodape(),
  );
}

function trocarIdioma(idioma) {
  estado.idioma = idioma;
  desenhar();
}

function focarPrimeiroErro() {
  const primeiro = estado.erros[0];
  document.getElementById(`campo-${primeiro.campo}`)?.focus();
}

function calcular() {
  const { erros, entrada } = validarFormulario(estado.valores, estado.unidades);
  estado.erros = erros;
  if (erros.length > 0) {
    estado.resultado = null;
    desenhar();
    focarPrimeiroErro();
    return;
  }
  const escore = calcularEscore(estado.modelo, entrada);
  estado.resultado = { escore, classe: classificar(escore), rxNaoRealizado: algumRaioXNaoRealizado(estado.valores) };
  desenhar();
  document.getElementById('resultado').focus();
}

async function iniciar() {
  estado.idioma = idiomaInicial();
  estado.unidades = { ...UNIDADES_INICIAIS[estado.idioma] };
  try {
    const resposta = await fetch(CAMINHO_MODELO);
    estado.modelo = carregarModelo(await resposta.json());
  } catch {
    estado.erroModelo = true;
  }
  desenhar();
}

iniciar();
```

- [ ] **Passo 6: rodar o teste da página.** `npm test`. Esperado: tudo verde.

- [ ] **Passo 7: servidor local para conferir no navegador.** Eu escrevo `.claude/launch.json` e abro pelo navegador do app (`preview_start` com o nome `estatico`). O servidor só lê `public/`.

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "estatico",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8000", "--directory", "public"],
      "port": 8000
    }
  ]
}
```

- [ ] **Passo 8: conferir no navegador do app.** Cada item vira Observado com a captura ou o texto da página:
  1. Navegador em português abre em PT com /mm³, /mm³ e mg/dL. `?lang=en` abre em EN com ×10³/µL e mg/L.
  2. O primeiro caso do grupo `sorteado` sem faltante de `tests/dados/casos_sinteticos_v1.0.0.json`, digitado na tela (com Sim e Não convertidos de 1 e 0), dá o escore do arquivo truncado em três casas e as mesmas classes.
  3. "12.600" em leucócitos (/mm³) mostra "Valor fora da faixa aceita (500 a 60.000 /mm³)" e o foco vai ao campo.
  4. Trocar PT para EN depois de digitar mantém os valores e as unidades.
  5. "Não realizado" num campo do raio X marca o outro, e o resultado mostra o aviso do raio X.
  6. Sem a declaração, aparece "Marque a declaração para calcular."
  7. Largura de 375 px sem rolagem horizontal.
  8. Console sem erro.

- [ ] **Passo 9: rodar de novo a verificação de design da tarefa 2.4, passo 6, na página montada.**

- [ ] **Passo 10: commit, push e PR (Wilson).** O `.claude/launch.json` fica fora do commit.

```bash
cd ~/Documents/apendisite && git add public/index.html public/js/dom.js public/js/app.js tests/js/pagina.test.js && git commit -m "feat: montar a página da calculadora com resultado e idiomas"
```

```bash
cd ~/Documents/apendisite && git push -u origin feat/parte-2-formulario && gh pr create --base main --title "feat: formulário, unidades, validação, resultado e idiomas" --body "Calculadora completa no navegador, em PT e EN, com os textos aprovados conferidos palavra por palavra, unidades que nunca mudam sozinhas, faixas aceitas e escore truncado em três casas coerente com os cortes. Por quê: é o que o QR do tema livre abre."
```

**Portão da Parte 2:** eu mostro ao Wilson as capturas em PT e EN (celular e computador), o caso sintético conferido na tela e a contagem de testes. Com o OK dele:

```bash
cd ~/Documents/apendisite && gh pr merge --merge --delete-branch && git switch main && git pull
```

Atualizar a passagem.

---
## Parte 3 (21/10, manhã): escores de Alvarado e PAS

Aprovada pelo Wilson em 19/10/2026, junto com a Parte 4 (bloco 3), com a correção do pré-requisito da Parte 4.

Pronto quando a seção opcional mostra os itens de cada escore, preenche os comuns a partir do formulário, mostra o total só com o escore completo e leva os totais para o resultado, com os limites de 10.000, 75%, 7.500 e 37,3 °C testados.

Branch (Wilson):

```bash
cd ~/Documents/apendisite && git switch main && git pull && git switch -c feat/parte-3-escores
```

### Tarefa 3.1: cálculo do Alvarado e do PAS

**Arquivos:**
- Criar: `public/js/escores.js`
- Teste: `tests/js/escores.test.js`

**Interfaces:**
- Consome: `FAIXAS`, `LIMITE_LEUCOCITOSE`, `LIMITE_NEUTROFILIA`, `dentroDaFaixa`, `lerNumero`, `paraMm3`, `neutrofilosParaMm3`, `temperaturaParaC` de `entrada.js`.
- Produz: `dadosDosEscores(valores, unidades) -> dados` com `nauseaOuVomito`, `dorFid`, `febre`, `migracao`, `anorexia`, `acetona`, `descompressao`, `dorTosse` (booleano ou `null`) e `leucocitosMm3`, `neutrofilosMm3`, `neutrofilosPct`, `temperaturaC` (número ou `null`). `calcularAlvarado(dados)` e `calcularPas(dados)` devolvem `{itens: [{chave, pontos, presente}], total: number|null, categoria: string|null}`. A `chave` de cada item é a chave do texto em `textos.js`. Categorias do Alvarado: `sem_categoria`, `compativel`, `provavel`, `muito_provavel`. Do PAS: `nao_compativel`, `compativel`, `alta`.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/escores.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UNIDADES_INICIAIS, VALORES_VAZIOS } from '../../public/js/entrada.js';
import { calcularAlvarado, calcularPas, categoriaAlvarado, categoriaPas, dadosDosEscores } from '../../public/js/escores.js';

const NENHUM = {
  nauseaOuVomito: false, dorFid: false, febre: false,
  leucocitosMm3: 8000, neutrofilosMm3: 5000, neutrofilosPct: 62.5,
  migracao: false, anorexia: false, acetona: false, descompressao: false, dorTosse: false,
  temperaturaC: 36.5,
};

function presente(resultado, chave) {
  return resultado.itens.find((item) => item.chave === chave).presente;
}

test('alvarado_sem_nenhum_item_da_zero_e_sem_categoria', () => {
  assert.deepEqual([calcularAlvarado(NENHUM).total, calcularAlvarado(NENHUM).categoria], [0, 'sem_categoria']);
});

test('alvarado_com_todos_os_itens_da_10', () => {
  const dados = { ...NENHUM, nauseaOuVomito: true, dorFid: true, leucocitosMm3: 15000, neutrofilosPct: 80, migracao: true, anorexia: true, descompressao: true, temperaturaC: 38 };
  assert.deepEqual([calcularAlvarado(dados).total, calcularAlvarado(dados).categoria], [10, 'muito_provavel']);
});

test('pas_com_todos_os_itens_da_10', () => {
  const dados = { ...NENHUM, dorTosse: true, anorexia: true, febre: true, nauseaOuVomito: true, dorFid: true, leucocitosMm3: 10000, neutrofilosMm3: 7501, migracao: true };
  assert.deepEqual([calcularPas(dados).total, calcularPas(dados).categoria], [10, 'alta']);
});

test('leucocitos_10000_pontuam_no_pas_e_nao_no_alvarado', () => {
  const dados = { ...NENHUM, leucocitosMm3: 10000 };
  assert.equal(presente(calcularAlvarado(dados), 'item_leuco_alvarado'), false);
  assert.equal(presente(calcularPas(dados), 'item_leuco_pas'), true);
});

test('leucocitos_10001_pontuam_nos_dois', () => {
  const dados = { ...NENHUM, leucocitosMm3: 10001 };
  assert.equal(presente(calcularAlvarado(dados), 'item_leuco_alvarado'), true);
  assert.equal(presente(calcularPas(dados), 'item_leuco_pas'), true);
});

test('neutrofilos_75_por_cento_nao_pontuam_no_alvarado_e_75_1_pontuam', () => {
  assert.equal(presente(calcularAlvarado({ ...NENHUM, neutrofilosPct: 75 }), 'item_neutro_alvarado'), false);
  assert.equal(presente(calcularAlvarado({ ...NENHUM, neutrofilosPct: 75.1 }), 'item_neutro_alvarado'), true);
});

test('neutrofilos_7500_nao_pontuam_no_pas_e_7501_pontuam', () => {
  assert.equal(presente(calcularPas({ ...NENHUM, neutrofilosMm3: 7500 }), 'item_neutro_pas'), false);
  assert.equal(presente(calcularPas({ ...NENHUM, neutrofilosMm3: 7501 }), 'item_neutro_pas'), true);
});

test('temperatura_de_37_3_pontua_e_37_2_nao', () => {
  assert.equal(presente(calcularAlvarado({ ...NENHUM, temperaturaC: 37.3 }), 'item_temperatura'), true);
  assert.equal(presente(calcularAlvarado({ ...NENHUM, temperaturaC: 37.2 }), 'item_temperatura'), false);
});

test('temperatura_em_fahrenheit_arredondada_antes_de_comparar', () => {
  const unidades = { ...UNIDADES_INICIAIS.pt, temperatura: 'f' };
  const em = (texto) => dadosDosEscores({ ...VALORES_VAZIOS, temperatura: texto }, unidades).temperaturaC;
  assert.equal(em('99,0'), 37.2);
  assert.equal(em('99,1'), 37.3);
  assert.equal(em('99.2'), 37.3);
});

test('anorexia_ou_acetona_exige_as_duas_respostas', () => {
  const dados = { ...NENHUM, anorexia: true, acetona: null };
  assert.equal(presente(calcularAlvarado(dados), 'item_anorexia_acetona'), null);
  assert.equal(calcularAlvarado(dados).total, null);
  assert.equal(presente(calcularAlvarado({ ...NENHUM, anorexia: false, acetona: true }), 'item_anorexia_acetona'), true);
});

test('item_sem_resposta_deixa_o_total_nulo', () => {
  assert.equal(calcularPas({ ...NENHUM, dorTosse: null }).total, null);
  assert.equal(calcularPas({ ...NENHUM, dorTosse: null }).categoria, null);
});

test('categorias_nos_limites', () => {
  assert.deepEqual([4, 5, 6, 7, 8, 9, 10].map(categoriaAlvarado),
    ['sem_categoria', 'compativel', 'compativel', 'provavel', 'provavel', 'muito_provavel', 'muito_provavel']);
  assert.deepEqual([0, 5, 6, 7, 10].map(categoriaPas), ['nao_compativel', 'nao_compativel', 'compativel', 'alta', 'alta']);
});

test('dadosDosEscores_le_as_unidades_do_ingles', () => {
  const valores = { ...VALORES_VAZIOS, leucocitos: '12,6', neutrofilos: '80' };
  const dados = dadosDosEscores(valores, { ...UNIDADES_INICIAIS.en, neutrofilos: 'pct' });
  assert.equal(dados.leucocitosMm3, 12600);
  assert.equal(dados.neutrofilosPct, 80);
  assert.equal(dados.neutrofilosMm3, 10080);
});

test('dadosDosEscores_nausea_ou_vomito', () => {
  const un = UNIDADES_INICIAIS.pt;
  assert.equal(dadosDosEscores({ ...VALORES_VAZIOS, nausea: 'sim' }, un).nauseaOuVomito, true);
  assert.equal(dadosDosEscores({ ...VALORES_VAZIOS, nausea: 'nao' }, un).nauseaOuVomito, null);
  assert.equal(dadosDosEscores({ ...VALORES_VAZIOS, nausea: 'nao', emese: 'nao' }, un).nauseaOuVomito, false);
});

test('dadosDosEscores_valor_fora_da_faixa_vira_nulo', () => {
  const dados = dadosDosEscores({ ...VALORES_VAZIOS, leucocitos: '12.600', temperatura: '44' }, UNIDADES_INICIAIS.pt);
  assert.equal(dados.leucocitosMm3, null);
  assert.equal(dados.temperaturaC, null);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/escores.test.js`. Esperado: módulo não encontrado.

- [ ] **Passo 3: escrever `public/js/escores.js`.**

```js
// Escores de Alvarado e PAS. Funções puras, sem DOM.
// Pontos e limites dos textos aprovados (seção 4) e do spec (seção 7).
import {
  FAIXAS,
  LIMITE_LEUCOCITOSE,
  LIMITE_NEUTROFILIA,
  dentroDaFaixa,
  lerNumero,
  neutrofilosParaMm3,
  paraMm3,
  temperaturaParaC,
} from './entrada.js';

export const LIMITE_TEMPERATURA_C = 37.3;
export const LIMITE_NEUTROFILOS_PCT = 75;

function simNao(valor) {
  if (valor === 'sim') return true;
  if (valor === 'nao') return false;
  return null;
}

function numeroNaFaixa(texto, faixa) {
  const valor = lerNumero(texto);
  return valor !== null && dentroDaFaixa(valor, faixa) ? valor : null;
}

function comparar(valor, teste) {
  return valor === null ? null : teste(valor);
}

/** Lê do formulário o que os dois escores usam. Faltante ou inválido vira null. */
export function dadosDosEscores(valores, unidades) {
  const nausea = simNao(valores.nausea);
  const emese = simNao(valores.emese);
  let nauseaOuVomito = null;
  if (nausea === true || emese === true) nauseaOuVomito = true;
  else if (nausea === false && emese === false) nauseaOuVomito = false;

  const leuco = numeroNaFaixa(valores.leucocitos, FAIXAS.leucocitos[unidades.leucocitos]);
  const leucocitosMm3 = leuco === null ? null : paraMm3(leuco, unidades.leucocitos);
  const neutro = numeroNaFaixa(valores.neutrofilos, FAIXAS.neutrofilos[unidades.neutrofilos]);
  let neutrofilosMm3 = null;
  let neutrofilosPct = null;
  if (neutro !== null && unidades.neutrofilos === 'pct') {
    neutrofilosPct = neutro;
    if (leucocitosMm3 !== null) neutrofilosMm3 = neutrofilosParaMm3(neutro, 'pct', leucocitosMm3);
  } else if (neutro !== null) {
    neutrofilosMm3 = neutrofilosParaMm3(neutro, unidades.neutrofilos, null);
    if (leucocitosMm3 !== null) neutrofilosPct = (100 * neutrofilosMm3) / leucocitosMm3;
  }
  const temperatura = numeroNaFaixa(valores.temperatura, FAIXAS.temperatura[unidades.temperatura]);
  return {
    nauseaOuVomito,
    dorFid: simNao(valores.dor_fid),
    febre: simNao(valores.febre),
    leucocitosMm3,
    neutrofilosMm3,
    neutrofilosPct,
    migracao: simNao(valores.migracao),
    anorexia: simNao(valores.anorexia),
    acetona: simNao(valores.acetona),
    descompressao: simNao(valores.descompressao),
    dorTosse: simNao(valores.dor_tosse),
    temperaturaC: temperatura === null ? null : temperaturaParaC(temperatura, unidades.temperatura),
  };
}

function anorexiaOuAcetona({ anorexia, acetona }) {
  if (anorexia === null || acetona === null) return null;
  return anorexia || acetona;
}

function itensAlvarado(d) {
  return [
    { chave: 'item_migracao', pontos: 1, presente: d.migracao },
    { chave: 'item_anorexia_acetona', pontos: 1, presente: anorexiaOuAcetona(d) },
    { chave: 'item_nausea_vomito', pontos: 1, presente: d.nauseaOuVomito },
    { chave: 'item_dor_fid', pontos: 2, presente: d.dorFid },
    { chave: 'item_descompressao', pontos: 1, presente: d.descompressao },
    { chave: 'item_temperatura', pontos: 1, presente: comparar(d.temperaturaC, (v) => v >= LIMITE_TEMPERATURA_C) },
    { chave: 'item_leuco_alvarado', pontos: 2, presente: comparar(d.leucocitosMm3, (v) => v > LIMITE_LEUCOCITOSE) },
    { chave: 'item_neutro_alvarado', pontos: 1, presente: comparar(d.neutrofilosPct, (v) => v > LIMITE_NEUTROFILOS_PCT) },
  ];
}

function itensPas(d) {
  return [
    { chave: 'item_dor_tosse', pontos: 2, presente: d.dorTosse },
    { chave: 'item_anorexia', pontos: 1, presente: d.anorexia },
    { chave: 'item_febre_pas', pontos: 1, presente: d.febre },
    { chave: 'item_nausea_vomito', pontos: 1, presente: d.nauseaOuVomito },
    { chave: 'item_dor_fid', pontos: 2, presente: d.dorFid },
    { chave: 'item_leuco_pas', pontos: 1, presente: comparar(d.leucocitosMm3, (v) => v >= LIMITE_LEUCOCITOSE) },
    { chave: 'item_neutro_pas', pontos: 1, presente: comparar(d.neutrofilosMm3, (v) => v > LIMITE_NEUTROFILIA) },
    { chave: 'item_migracao', pontos: 1, presente: d.migracao },
  ];
}

function somar(itens) {
  if (itens.some((item) => item.presente === null)) return null;
  return itens.reduce((total, item) => total + (item.presente ? item.pontos : 0), 0);
}

export function categoriaAlvarado(total) {
  if (total === null) return null;
  if (total >= 9) return 'muito_provavel';
  if (total >= 7) return 'provavel';
  if (total >= 5) return 'compativel';
  return 'sem_categoria';
}

export function categoriaPas(total) {
  if (total === null) return null;
  if (total >= 7) return 'alta';
  if (total === 6) return 'compativel';
  return 'nao_compativel';
}

/** Itens, total (null se falta resposta) e categoria do artigo original. */
export function calcularAlvarado(dados) {
  const itens = itensAlvarado(dados);
  const total = somar(itens);
  return { itens, total, categoria: categoriaAlvarado(total) };
}

export function calcularPas(dados) {
  const itens = itensPas(dados);
  const total = somar(itens);
  return { itens, total, categoria: categoriaPas(total) };
}
```

- [ ] **Passo 4: rodar e ver passar.** `npm test`. Esperado: tudo verde.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/escores.js tests/js/escores.test.js && git commit -m "feat: calcular Alvarado e PAS a partir do formulário"
```

### Tarefa 3.2: temperatura na validação e seção na página

**Arquivos:**
- Modificar: `public/js/entrada.js` (`validarFormulario`), `public/js/app.js`
- Teste: `tests/js/entrada.test.js` (três testes novos)

- [ ] **Passo 1: acrescentar os testes que falham** ao fim de `tests/js/entrada.test.js`:

```js
test('temperatura_vazia_nao_bloqueia', () => {
  assert.deepEqual(validarFormulario(valoresValidos({ temperatura: '' }), UNIDADES_PT).erros, []);
});

test('temperatura_fora_da_faixa_bloqueia_o_calculo_inteiro', () => {
  const { erros, entrada } = validarFormulario(valoresValidos({ temperatura: '44' }), UNIDADES_PT);
  assert.equal(entrada, null);
  assert.deepEqual(erros, [{ campo: 'temperatura', codigo: 'faixa', faixa: [34, 43], unidade: 'c' }]);
});

test('temperatura_em_fahrenheit_usa_a_faixa_da_unidade', () => {
  const unidades = { ...UNIDADES_PT, temperatura: 'f' };
  assert.deepEqual(validarFormulario(valoresValidos({ temperatura: '101' }), unidades).erros, []);
  assert.deepEqual(validarFormulario(valoresValidos({ temperatura: '110' }), unidades).erros,
    [{ campo: 'temperatura', codigo: 'faixa', faixa: [93.2, 109.4], unidade: 'f' }]);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/entrada.test.js`. Esperado: falham os dois testes de faixa.

- [ ] **Passo 3: validar a temperatura em `validarFormulario`.** Logo antes da linha da declaração:

```js
  if (!vazio(valores.temperatura)) {
    const uTemp = unidades.temperatura;
    lerCampoNumerico('temperatura', valores.temperatura, FAIXAS.temperatura[uTemp], uTemp, erros);
  }
```

- [ ] **Passo 4: rodar e ver passar.** `npm test`.

- [ ] **Passo 5: a seção na página.** Em `public/js/app.js`:

Import novo:

```js
import { calcularAlvarado, calcularPas, dadosDosEscores } from './escores.js';
```

Em `estado`, acrescentar `escoresAbertos: false`.

Funções novas, antes de `desenharFormulario`:

```js
function blocoDoEscore(chaveNome, resultado, chaveCategorias, notas) {
  return el('div', { class: 'bloco-escore' },
    el('h3', {}, t(chaveNome)),
    el('ul', {}, resultado.itens.map((item) => {
      let situacao = 'pendente';
      if (item.presente === true) situacao = 'presente';
      if (item.presente === false) situacao = 'ausente';
      const leitura = item.presente === null ? '' : ` ${t(item.presente ? 'sim' : 'nao')}`;
      return el('li', { class: `item-escore ${situacao}` },
        `${t(item.chave)} (${item.pontos})`,
        el('span', { class: 'visualmente-oculto' }, leitura));
    })),
    resultado.total === null ? null : el('p', { class: 'total-escore' }, textoDoTotal(chaveNome, resultado, chaveCategorias)),
    notas.map((nota) => el('p', { class: 'nota' }, t(nota))));
}

function textoDoTotal(chaveNome, resultado, chaveCategorias) {
  return preencher(t('total_escore'), {
    nome: t(chaveNome),
    total: resultado.total,
    categoria: t(chaveCategorias)[resultado.categoria],
  });
}

function conteudoDosEscores() {
  const dados = dadosDosEscores(estado.valores, estado.unidades);
  return [
    blocoDoEscore('alvarado_nome', calcularAlvarado(dados), 'alvarado_categorias', ['alvarado_origem']),
    blocoDoEscore('pas_nome', calcularPas(dados), 'pas_categorias', ['pas_nota', 'pas_origem']),
  ];
}

function atualizarEscores() {
  document.getElementById('escores-itens')?.replaceChildren(...conteudoDosEscores());
}

function desenharEscores() {
  return el('details', {
    class: 'escores',
    open: estado.escoresAbertos,
    ontoggle: (evento) => { estado.escoresAbertos = evento.target.open; },
  },
    el('summary', {}, t('escores_titulo')),
    el('p', {}, t('escores_abertura')),
    campoEscolha('migracao', t('item_migracao'), simNao()),
    campoEscolha('anorexia', t('item_anorexia'), simNao()),
    campoEscolha('acetona', t('item_acetona'), simNao()),
    campoEscolha('descompressao', t('item_descompressao'), simNao()),
    campoEscolha('dor_tosse', t('item_dor_tosse'), simNao()),
    campoNumerico('temperatura', t('temperatura_campo'), { ajuda: t('temperatura_nota'), grandeza: 'temperatura' }),
    el('div', { id: 'escores-itens' }, conteudoDosEscores()));
}
```

Em `campoNumerico`, no `oninput` do campo e no `onchange` do seletor de unidade, chamar `atualizarEscores()` depois de gravar no `estado`. Em `campoEscolha`, no `onchange`, chamar `atualizarEscores()` depois de gravar (o raio X já redesenha a página).

Em `desenharFormulario`, logo depois do fieldset de exames laboratoriais e antes da declaração: `desenharEscores(),`.

Em `calcular`, no objeto `estado.resultado`, acrescentar:

```js
    escores: (() => {
      const dados = dadosDosEscores(estado.valores, estado.unidades);
      return { alvarado: calcularAlvarado(dados), pas: calcularPas(dados) };
    })(),
```

Em `desenharResultado`, logo depois do parágrafo `.escore`, os totais completos ao lado do escore do modelo (spec 6.4):

```js
    resultado.escores.alvarado.total === null ? null
      : el('p', { class: 'total-escore' }, textoDoTotal('alvarado_nome', resultado.escores.alvarado, 'alvarado_categorias')),
    resultado.escores.pas.total === null ? null
      : el('p', { class: 'total-escore' }, textoDoTotal('pas_nome', resultado.escores.pas, 'pas_categorias')),
```

- [ ] **Passo 6: conferir no navegador do app** (servidor `estatico`):
  1. A seção abre recolhida. Os itens comuns acompanham o formulário enquanto se digita.
  2. Leucócitos 10000/mm³: PAS marca o item, Alvarado não. 10001: os dois.
  3. Temperatura 99,1 °F pontua no Alvarado. 99,0 não.
  4. Com todos os itens respondidos, o total aparece com a categoria. Faltando um, some.
  5. Temperatura 44 °C bloqueia o Calcular com a mensagem de faixa.
  6. Os totais completos aparecem no resultado, logo abaixo do escore do modelo.

- [ ] **Passo 7: commit, push e PR (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/entrada.js public/js/app.js tests/js/entrada.test.js && git commit -m "feat: mostrar a seção opcional de Alvarado e PAS"
```

```bash
cd ~/Documents/apendisite && git push -u origin feat/parte-3-escores && gh pr create --base main --title "feat: escores de Alvarado e PAS" --body "Seção opcional com os itens comuns preenchidos a partir do formulário, total só com o escore completo e categoria do artigo original. Por quê: decisões Q3.25, Q3.26, S5 e S6."
```

**Portão da Parte 3:** captura da seção e dos testes de limite. Com o OK do Wilson:

```bash
cd ~/Documents/apendisite && gh pr merge --merge --delete-branch && git switch main && git pull
```

---

## Parte 4 (21/10, manhã e começo da tarde): Worker, D1, questionário e utilidade

Pronto quando as quatro rotas respondem no `wrangler dev` com D1 local, a validação recusa tudo fora do contrato, o código do Worker não lê cabeçalho de IP, a página conta "abriu" e "calculou", o questionário grava, a utilidade aparece na visita seguinte e nenhum corpo enviado leva campo do formulário.

Pré-requisito: `account_id` da conta apendisite (Fase A). Sem ele, as tarefas 4.1 a 4.3 e 4.5 seguem, e a 4.4 e o passo 6 da 4.6 esperam. O `account_id` sai do `wrangler whoami` da tarefa 4.4, passo 2 (correção aprovada pelo Wilson em 19/10/2026).

Branch (Wilson):

```bash
cd ~/Documents/apendisite && git switch main && git pull && git switch -c feat/parte-4-api
```

### Tarefa 4.1: contrato da API e lista de países

**Arquivos:**
- Criar: `public/js/contrato_api.js`
- Modificar: `public/js/formato.js` (exportar `LOCALIDADES`), `public/js/textos.js` (`listaDePaises`)
- Teste: `tests/js/contrato_api.test.js`

**Interfaces:**
- Produz: `ROTAS` (`evento`, `sus`, `utilidade`, `saude`), `LIMITE_CORPO_BYTES = 2048`, `IDIOMAS_API`, `EVENTOS`, `AREAS` (9 códigos, na ordem do `CHECK` da tabela), `USARIA`, `N_ITENS_SUS = 10`, `NOTA_TESTE = 'teste'`, `TAMANHO_MAXIMO_ISCA = 200`, `CHAVES` (`evento`, `sus`, `utilidade`), `PAISES` (249 códigos ISO 3166-1 alfa-2). Em `textos.js`: `listaDePaises(idioma) -> [[codigo, nome], ...]`, com o Brasil primeiro e os demais em ordem alfabética do nome no idioma.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/contrato_api.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, CHAVES, PAISES, USARIA } from '../../public/js/contrato_api.js';
import { TEXTOS, listaDePaises } from '../../public/js/textos.js';

test('paises_tem_249_codigos_iso_unicos_com_o_brasil', () => {
  assert.equal(PAISES.length, 249);
  assert.equal(new Set(PAISES).size, 249);
  assert.ok(PAISES.every((codigo) => /^[A-Z]{2}$/.test(codigo)));
  assert.ok(PAISES.includes('BR'));
});

test('areas_e_usaria_batem_com_os_textos_dos_dois_idiomas', () => {
  for (const idioma of ['pt', 'en']) {
    assert.deepEqual(Object.keys(TEXTOS[idioma].areas), [...AREAS]);
    assert.deepEqual(Object.keys(TEXTOS[idioma].usaria), [...USARIA]);
  }
});

test('corpo_do_sus_tem_o_campo_isca', () => {
  assert.ok(CHAVES.sus.includes('site'));
});

test('listaDePaises_comeca_pelo_brasil_e_ordena_o_resto_pelo_nome', () => {
  for (const [idioma, nome] of [['pt', 'Brasil'], ['en', 'Brazil']]) {
    const lista = listaDePaises(idioma);
    assert.deepEqual(lista[0], ['BR', nome]);
    assert.equal(lista.length, 249);
    const resto = lista.slice(1).map(([, n]) => n);
    assert.deepEqual(resto, [...resto].sort((a, b) => a.localeCompare(b, idioma)));
  }
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/contrato_api.test.js`. Esperado: módulo não encontrado.

- [ ] **Passo 3: escrever `public/js/contrato_api.js`.** A lista de países vem de `/usr/share/zoneinfo/iso3166.tab` do macOS (249 linhas, Observado em 19/10).

```js
// Contrato entre a página e o Worker: rotas, chaves dos corpos e valores aceitos.
// O Worker importa este mesmo arquivo para validar (spec, seção 9.2).

export const ROTAS = Object.freeze({
  evento: '/api/evento',
  sus: '/api/sus',
  utilidade: '/api/utilidade',
  saude: '/api/saude',
});
export const LIMITE_CORPO_BYTES = 2048;
export const IDIOMAS_API = Object.freeze(['pt', 'en']);
export const EVENTOS = Object.freeze(['abriu', 'calculou']);
export const AREAS = Object.freeze([
  'cir_ped_especialista', 'cir_ped_residente', 'cir_geral', 'pediatria', 'emergencia',
  'familia_comunidade', 'generalista', 'outra_especialidade', 'estudante_medicina',
]);
export const USARIA = Object.freeze(['sim', 'talvez', 'nao']);
export const N_ITENS_SUS = 10;
export const NOTA_TESTE = 'teste';
export const TAMANHO_MAXIMO_ISCA = 200;
export const CHAVES = Object.freeze({
  evento: Object.freeze(['evento', 'idioma']),
  sus: Object.freeze(['idioma', 'itens', 'area', 'pais', 'usaria', 'site']),
  utilidade: Object.freeze(['idioma', 'nota']),
});

// ISO 3166-1 alfa-2, de /usr/share/zoneinfo/iso3166.tab (macOS, 19/10/2026).
export const PAISES = Object.freeze(
  ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ '
  + 'BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM '
  + 'DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS '
  + 'GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN '
  + 'KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ '
  + 'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM '
  + 'PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV '
  + 'SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI '
  + 'VN VU WF WS YE YT ZA ZM ZW').split(' '),
);
```

- [ ] **Passo 4: exportar `LOCALIDADES` em `formato.js`** (trocar `const LOCALIDADES` por `export const LOCALIDADES`) **e acrescentar `listaDePaises` a `textos.js`:**

```js
import { PAISES } from './contrato_api.js';
import { LOCALIDADES, formatarNumero } from './formato.js';

/** Países com o nome no idioma da página, dado pelo próprio navegador. Brasil primeiro. */
export function listaDePaises(idioma) {
  const nomes = new Intl.DisplayNames([LOCALIDADES[idioma]], { type: 'region' });
  const outros = PAISES.filter((codigo) => codigo !== 'BR')
    .map((codigo) => [codigo, nomes.of(codigo)])
    .sort((a, b) => a[1].localeCompare(b[1], idioma));
  return [['BR', nomes.of('BR')], ...outros];
}
```

O `import` de `formato.js` já existe em `textos.js` e passa a trazer também `LOCALIDADES`.

- [ ] **Passo 5: rodar e ver passar.** `npm test`.

- [ ] **Passo 6: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/contrato_api.js public/js/formato.js public/js/textos.js tests/js/contrato_api.test.js && git commit -m "feat: definir o contrato da API e a lista de países"
```

### Tarefa 4.2: validação dos pedidos no servidor

**Arquivos:**
- Criar: `worker/validacao.js`
- Teste: `tests/js/validacao.test.js`

**Interfaces:**
- Consome: `contrato_api.js`.
- Produz: `class ErroValidacao`, `validarEvento(corpo) -> {evento, idioma}`, `validarSus(corpo) -> {idioma, itens, area, pais, usaria, isca: boolean}`, `validarUtilidade(corpo) -> {idioma, nota: number|null, teste: 0|1}`, `paisDoCabecalho(cf) -> string` ("XX" se ausente), `diaEmBrasilia(agora: Date) -> 'AAAA-MM-DD'`.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/validacao.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroValidacao,
  diaEmBrasilia,
  paisDoCabecalho,
  validarEvento,
  validarSus,
  validarUtilidade,
} from '../../worker/validacao.js';

const SUS = { idioma: 'pt', itens: [3, 4, 2, 5, 1, 3, 4, 2, 5, 1], area: 'pediatria', pais: 'BR', usaria: 'sim', site: '' };

test('validarEvento_aceita_o_contrato', () => {
  assert.deepEqual(validarEvento({ evento: 'abriu', idioma: 'pt' }), { evento: 'abriu', idioma: 'pt' });
});

test('validarEvento_recusa_chave_a_mais_valor_fora_da_lista_e_corpo_que_nao_e_objeto', () => {
  for (const corpo of [
    { evento: 'abriu', idioma: 'pt', leucocitos: 12000 },
    { evento: 'saiu', idioma: 'pt' },
    { evento: 'abriu', idioma: 'es' },
    { evento: 'abriu' },
    null, [], 'abriu',
  ]) {
    assert.throws(() => validarEvento(corpo), ErroValidacao, JSON.stringify(corpo));
  }
});

test('validarSus_aceita_o_contrato_e_marca_a_isca', () => {
  assert.deepEqual(validarSus(SUS), { idioma: 'pt', itens: SUS.itens, area: 'pediatria', pais: 'BR', usaria: 'sim', isca: false });
  assert.equal(validarSus({ ...SUS, site: 'http://spam' }).isca, true);
});

test('validarSus_recusa_itens_fora_do_contrato', () => {
  for (const itens of [SUS.itens.slice(1), [0, ...SUS.itens.slice(1)], [6, ...SUS.itens.slice(1)], [2.5, ...SUS.itens.slice(1)], ['3', ...SUS.itens.slice(1)]]) {
    assert.throws(() => validarSus({ ...SUS, itens }), ErroValidacao, JSON.stringify(itens));
  }
});

test('validarSus_recusa_area_pais_usaria_e_isca_invalidos', () => {
  for (const mudanca of [{ area: 'enfermagem' }, { pais: 'ZZ' }, { usaria: 'nunca' }, { site: 3 }, { site: 'x'.repeat(201) }]) {
    assert.throws(() => validarSus({ ...SUS, ...mudanca }), ErroValidacao, JSON.stringify(mudanca));
  }
});

test('validarUtilidade_aceita_0_a_10_e_teste', () => {
  assert.deepEqual(validarUtilidade({ idioma: 'en', nota: 0 }), { idioma: 'en', nota: 0, teste: 0 });
  assert.deepEqual(validarUtilidade({ idioma: 'en', nota: 10 }), { idioma: 'en', nota: 10, teste: 0 });
  assert.deepEqual(validarUtilidade({ idioma: 'pt', nota: 'teste' }), { idioma: 'pt', nota: null, teste: 1 });
});

test('validarUtilidade_recusa_nota_fora_do_contrato', () => {
  for (const nota of [11, -1, 7.5, '7', null]) {
    assert.throws(() => validarUtilidade({ idioma: 'pt', nota }), ErroValidacao, String(nota));
  }
});

test('paisDoCabecalho_usa_XX_quando_falta', () => {
  assert.equal(paisDoCabecalho({ country: 'BR' }), 'BR');
  assert.equal(paisDoCabecalho({ country: 'T1' }), 'T1');
  assert.equal(paisDoCabecalho(undefined), 'XX');
  assert.equal(paisDoCabecalho({}), 'XX');
});

test('diaEmBrasilia_vira_as_tres_da_manha_em_utc', () => {
  assert.equal(diaEmBrasilia(new Date('2026-10-23T02:59:59Z')), '2026-10-22');
  assert.equal(diaEmBrasilia(new Date('2026-10-23T03:00:00Z')), '2026-10-23');
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/validacao.test.js`. Esperado: módulo não encontrado.

- [ ] **Passo 3: escrever `worker/validacao.js`.**

```js
// Validação pura dos pedidos a /api (spec, seção 9.2). Sem rede e sem banco.
import {
  AREAS,
  CHAVES,
  EVENTOS,
  IDIOMAS_API,
  NOTA_TESTE,
  N_ITENS_SUS,
  PAISES,
  TAMANHO_MAXIMO_ISCA,
  USARIA,
} from '../public/js/contrato_api.js';

// O Brasil não tem horário de verão desde 2019: Brasília fica em UTC-3 o ano todo.
const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000;
const PADRAO_PAIS = /^[A-Z0-9]{2}$/;
const PAIS_DESCONHECIDO = 'XX';

export class ErroValidacao extends Error {
  constructor(motivo) {
    super(motivo);
    this.name = 'ErroValidacao';
  }
}

function exigir(condicao, motivo) {
  if (!condicao) throw new ErroValidacao(motivo);
}

function exigirChavesExatas(corpo, chaves) {
  exigir(corpo !== null && typeof corpo === 'object' && !Array.isArray(corpo), 'corpo não é objeto');
  const recebidas = Object.keys(corpo).sort();
  const esperadas = [...chaves].sort();
  exigir(recebidas.length === esperadas.length && recebidas.every((c, i) => c === esperadas[i]), 'chaves');
}

export function validarEvento(corpo) {
  exigirChavesExatas(corpo, CHAVES.evento);
  exigir(EVENTOS.includes(corpo.evento), 'evento');
  exigir(IDIOMAS_API.includes(corpo.idioma), 'idioma');
  return { evento: corpo.evento, idioma: corpo.idioma };
}

export function validarSus(corpo) {
  exigirChavesExatas(corpo, CHAVES.sus);
  exigir(IDIOMAS_API.includes(corpo.idioma), 'idioma');
  exigir(Array.isArray(corpo.itens) && corpo.itens.length === N_ITENS_SUS, 'itens');
  exigir(corpo.itens.every((v) => Number.isInteger(v) && v >= 1 && v <= 5), 'itens');
  exigir(AREAS.includes(corpo.area), 'area');
  exigir(PAISES.includes(corpo.pais), 'pais');
  exigir(USARIA.includes(corpo.usaria), 'usaria');
  exigir(typeof corpo.site === 'string' && corpo.site.length <= TAMANHO_MAXIMO_ISCA, 'site');
  return {
    idioma: corpo.idioma,
    itens: [...corpo.itens],
    area: corpo.area,
    pais: corpo.pais,
    usaria: corpo.usaria,
    isca: corpo.site !== '',
  };
}

export function validarUtilidade(corpo) {
  exigirChavesExatas(corpo, CHAVES.utilidade);
  exigir(IDIOMAS_API.includes(corpo.idioma), 'idioma');
  const teste = corpo.nota === NOTA_TESTE;
  exigir(teste || (Number.isInteger(corpo.nota) && corpo.nota >= 0 && corpo.nota <= 10), 'nota');
  return { idioma: corpo.idioma, nota: teste ? null : corpo.nota, teste: teste ? 1 : 0 };
}

/** País que a Cloudflare põe em request.cf, ou XX. Nunca o IP. */
export function paisDoCabecalho(cf) {
  const pais = cf?.country;
  return typeof pais === 'string' && PADRAO_PAIS.test(pais) ? pais : PAIS_DESCONHECIDO;
}

/** Dia em horário de Brasília, AAAA-MM-DD. */
export function diaEmBrasilia(agora = new Date()) {
  return new Date(agora.getTime() - DESLOCAMENTO_BRASILIA_MS).toISOString().slice(0, 10);
}
```

- [ ] **Passo 4: rodar e ver passar.** `npm test`.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add worker/validacao.js tests/js/validacao.test.js && git commit -m "feat: validar os pedidos da API no servidor"
```

### Tarefa 4.3: rotas do Worker e cabeçalhos

**Arquivos:**
- Criar: `worker/cabecalhos.js`, `worker/index.js`
- Teste: `tests/js/worker.test.js`

**Interfaces:**
- Consome: `validacao.js`, `contrato_api.js`, binding `env.DB` (D1) e `env.ORIGEM_PERMITIDA`.
- Produz: `CSP` e `CABECALHOS_SEGURANCA` (objeto com os oito cabeçalhos, usado pelo teste de `_headers` na Parte 5 e pelo `conferir_producao.sh`). `export default { fetch(request, env) }`. Respostas: 204 (evento), 201 `{"ok":true}` (sus e utilidade), 200 `{"ok":true}` (saude), 400 `{"erro":"pedido"}`, 403 `{"erro":"origem"}`, 404 `{"erro":"rota"}`, 405 `{"erro":"metodo"}`, 503 `{"ok":false}`.

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/worker.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import trabalhador from '../../worker/index.js';
import { CABECALHOS_SEGURANCA } from '../../worker/cabecalhos.js';
import { lerTexto } from './auxiliares.js';

const ORIGEM = 'https://apendisite.com.br';
const SUS = { idioma: 'pt', itens: [3, 4, 2, 5, 1, 3, 4, 2, 5, 1], area: 'pediatria', pais: 'BR', usaria: 'sim', site: '' };
const DIA = /^\d{4}-\d{2}-\d{2}$/;

function bancoFalso({ falhar = false } = {}) {
  const chamadas = [];
  const executar = async (sql, valores) => {
    if (falhar) throw new Error('D1 fora do ar');
    chamadas.push({ sql, valores });
    return { success: true };
  };
  return {
    chamadas,
    prepare(sql) {
      return {
        bind: (...valores) => ({ run: () => executar(sql, valores) }),
        first: async () => {
          await executar(sql, []);
          return { ok: 1 };
        },
      };
    },
  };
}

function pedido(caminho, { metodo = 'POST', corpo, origem = ORIGEM, tipo = 'application/json', pais = 'BR' } = {}) {
  const cabecalhos = new Headers();
  if (origem) cabecalhos.set('Origin', origem);
  if (tipo) cabecalhos.set('Content-Type', tipo);
  let texto = '';
  if (corpo !== undefined) texto = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  return {
    url: `${ORIGEM}${caminho}`,
    method: metodo,
    headers: cabecalhos,
    cf: pais ? { country: pais } : undefined,
    text: async () => texto,
  };
}

async function chamar(caminho, opcoes = {}, banco = bancoFalso()) {
  const resposta = await trabalhador.fetch(pedido(caminho, opcoes), { DB: banco, ORIGEM_PERMITIDA: ORIGEM });
  return { resposta, banco, texto: await resposta.text() };
}

test('evento_valido_soma_na_contagem_e_responde_204', async () => {
  const { resposta, banco } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' } });
  assert.equal(resposta.status, 204);
  assert.equal(banco.chamadas.length, 1);
  const [dia, evento, idioma, pais] = banco.chamadas[0].valores;
  assert.match(dia, DIA);
  assert.deepEqual([evento, idioma, pais], ['abriu', 'pt', 'BR']);
  assert.match(banco.chamadas[0].sql, /ON CONFLICT \(dia, evento, idioma, pais\) DO UPDATE SET n = n \+ 1/);
});

test('evento_sem_pais_grava_XX', async () => {
  const { banco } = await chamar('/api/evento', { corpo: { evento: 'calculou', idioma: 'en' }, pais: null });
  assert.equal(banco.chamadas[0].valores[3], 'XX');
});

test('evento_com_campo_do_formulario_e_recusado_sem_gravar', async () => {
  const { resposta, banco } = await chamar('/api/evento', { corpo: { evento: 'calculou', idioma: 'pt', leucocitos: 12000 } });
  assert.equal(resposta.status, 400);
  assert.equal(banco.chamadas.length, 0);
});

test('corpo_acima_de_2_kb_e_recusado', async () => {
  const { resposta } = await chamar('/api/sus', { corpo: { ...SUS, site: 'x'.repeat(3000) } });
  assert.equal(resposta.status, 400);
});

test('content_type_diferente_de_json_e_recusado', async () => {
  const { resposta } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' }, tipo: 'text/plain' });
  assert.equal(resposta.status, 400);
});

test('json_invalido_e_recusado_sem_ecoar_o_corpo', async () => {
  const { resposta, texto } = await chamar('/api/evento', { corpo: '{"evento":"abriu", MARCADOR_QUE_NAO_PODE_VOLTAR' });
  assert.equal(resposta.status, 400);
  assert.ok(!texto.includes('MARCADOR_QUE_NAO_PODE_VOLTAR'));
});

test('origem_diferente_ou_ausente_da_403', async () => {
  for (const origem of ['https://exemplo.com', null]) {
    const { resposta, banco } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' }, origem });
    assert.equal(resposta.status, 403, String(origem));
    assert.equal(banco.chamadas.length, 0);
  }
});

test('sus_valido_grava_dia_idioma_dez_itens_area_pais_e_usaria', async () => {
  const { resposta, banco, texto } = await chamar('/api/sus', { corpo: SUS });
  assert.equal(resposta.status, 201);
  assert.deepEqual(JSON.parse(texto), { ok: true });
  const valores = banco.chamadas[0].valores;
  assert.equal(valores.length, 15);
  assert.deepEqual(valores.slice(1), ['pt', 3, 4, 2, 5, 1, 3, 4, 2, 5, 1, 'pediatria', 'BR', 'sim']);
});

test('sus_com_isca_preenchida_responde_201_e_nao_grava', async () => {
  const { resposta, banco } = await chamar('/api/sus', { corpo: { ...SUS, site: 'http://spam' } });
  assert.equal(resposta.status, 201);
  assert.equal(banco.chamadas.length, 0);
});

test('sus_com_9_itens_e_recusado', async () => {
  const { resposta } = await chamar('/api/sus', { corpo: { ...SUS, itens: SUS.itens.slice(1) } });
  assert.equal(resposta.status, 400);
});

test('utilidade_grava_nota_e_teste', async () => {
  const nota = await chamar('/api/utilidade', { corpo: { idioma: 'en', nota: 7 } });
  assert.equal(nota.resposta.status, 201);
  assert.deepEqual(nota.banco.chamadas[0].valores.slice(1), [7, 0, 'en', 'BR']);
  const teste = await chamar('/api/utilidade', { corpo: { idioma: 'pt', nota: 'teste' } });
  assert.deepEqual(teste.banco.chamadas[0].valores.slice(1), [null, 1, 'pt', 'BR']);
});

test('utilidade_nota_11_e_recusada', async () => {
  const { resposta } = await chamar('/api/utilidade', { corpo: { idioma: 'pt', nota: 11 } });
  assert.equal(resposta.status, 400);
});

test('rota_desconhecida_da_404_e_metodo_errado_405', async () => {
  assert.equal((await chamar('/api/outra', { corpo: {} })).resposta.status, 404);
  assert.equal((await chamar('/api', { corpo: {} })).resposta.status, 404);
  assert.equal((await chamar('/api/evento', { metodo: 'GET' })).resposta.status, 405);
  assert.equal((await chamar('/api/saude', { metodo: 'POST', corpo: {} })).resposta.status, 405);
});

test('saude_responde_ok_e_503_com_o_banco_fora', async () => {
  const ok = await chamar('/api/saude', { metodo: 'GET', origem: null, tipo: null });
  assert.equal(ok.resposta.status, 200);
  assert.deepEqual(JSON.parse(ok.texto), { ok: true });
  const fora = await chamar('/api/saude', { metodo: 'GET', origem: null, tipo: null }, bancoFalso({ falhar: true }));
  assert.equal(fora.resposta.status, 503);
});

test('banco_fora_no_evento_da_503', async () => {
  const { resposta } = await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' } }, bancoFalso({ falhar: true }));
  assert.equal(resposta.status, 503);
});

test('toda_resposta_traz_os_oito_cabecalhos_de_seguranca', async () => {
  const respostas = [
    await chamar('/api/evento', { corpo: { evento: 'abriu', idioma: 'pt' } }),
    await chamar('/api/sus', { corpo: SUS }),
    await chamar('/api/outra', { corpo: {} }),
    await chamar('/api/saude', { metodo: 'GET', origem: null, tipo: null }),
  ];
  for (const { resposta } of respostas) {
    for (const [nome, valor] of Object.entries(CABECALHOS_SEGURANCA)) {
      assert.equal(resposta.headers.get(nome), valor, `${resposta.status} ${nome}`);
    }
    assert.equal(resposta.headers.get('Set-Cookie'), null);
  }
});

test('codigo_do_worker_nao_le_cabecalho_de_ip', async () => {
  const nomes = (await readdir(new URL('../../worker/', import.meta.url))).filter((n) => n.endsWith('.js'));
  for (const nome of nomes) {
    const codigo = (await lerTexto(`worker/${nome}`)).toLowerCase();
    for (const proibido of ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip', 'true-client-ip']) {
      assert.ok(!codigo.includes(proibido), `${nome} cita ${proibido}`);
    }
  }
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/worker.test.js`. Esperado: módulo não encontrado.

- [ ] **Passo 3: escrever `worker/cabecalhos.js`.**

```js
// Cabeçalhos de segurança (spec, seção 10). Os mesmos do public/_headers,
// que só vale para os arquivos estáticos. Um teste confere que os dois batem.

export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests";

export const CABECALHOS_SEGURANCA = Object.freeze({
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
});
```

- [ ] **Passo 4: escrever `worker/index.js`.**

```js
// Rotas /api do apendisite. O resto do site é arquivo estático e não passa por aqui.
// Este código nunca lê cabeçalho de IP (spec, seção 9.2, item 6).
import { LIMITE_CORPO_BYTES, ROTAS } from '../public/js/contrato_api.js';
import { CABECALHOS_SEGURANCA } from './cabecalhos.js';
import {
  ErroValidacao,
  diaEmBrasilia,
  paisDoCabecalho,
  validarEvento,
  validarSus,
  validarUtilidade,
} from './validacao.js';

const SQL_EVENTO = 'INSERT INTO contagem (dia, evento, idioma, pais, n) VALUES (?1, ?2, ?3, ?4, 1) '
  + 'ON CONFLICT (dia, evento, idioma, pais) DO UPDATE SET n = n + 1';
const SQL_SUS = 'INSERT INTO resposta_sus (dia, idioma, item1, item2, item3, item4, item5, item6, '
  + 'item7, item8, item9, item10, area, pais, usaria) '
  + 'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)';
const SQL_UTILIDADE = 'INSERT INTO nota_utilidade (dia, nota, teste, idioma, pais) VALUES (?1, ?2, ?3, ?4, ?5)';
const SQL_SAUDE = 'SELECT 1 AS ok';
const TIPO_JSON = 'application/json';

function responder(status, corpo) {
  const cabecalhos = new Headers(CABECALHOS_SEGURANCA);
  cabecalhos.set('Cache-Control', 'no-store');
  if (corpo === undefined) return new Response(null, { status, headers: cabecalhos });
  cabecalhos.set('Content-Type', `${TIPO_JSON}; charset=utf-8`);
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos });
}

async function lerCorpo(request) {
  const tipo = (request.headers.get('Content-Type') ?? '').toLowerCase();
  if (!tipo.startsWith(TIPO_JSON)) throw new ErroValidacao('content-type');
  if (Number(request.headers.get('Content-Length') ?? 0) > LIMITE_CORPO_BYTES) throw new ErroValidacao('tamanho');
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > LIMITE_CORPO_BYTES) throw new ErroValidacao('tamanho');
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroValidacao('json');
  }
}

const TRATADORES = {
  [ROTAS.evento]: async (corpo, env, request) => {
    const { evento, idioma } = validarEvento(corpo);
    await env.DB.prepare(SQL_EVENTO).bind(diaEmBrasilia(), evento, idioma, paisDoCabecalho(request.cf)).run();
    return responder(204);
  },
  [ROTAS.sus]: async (corpo, env) => {
    const resposta = validarSus(corpo);
    if (resposta.isca) return responder(201, { ok: true });
    const { idioma, itens, area, pais, usaria } = resposta;
    await env.DB.prepare(SQL_SUS).bind(diaEmBrasilia(), idioma, ...itens, area, pais, usaria).run();
    return responder(201, { ok: true });
  },
  [ROTAS.utilidade]: async (corpo, env, request) => {
    const { idioma, nota, teste } = validarUtilidade(corpo);
    await env.DB.prepare(SQL_UTILIDADE).bind(diaEmBrasilia(), nota, teste, idioma, paisDoCabecalho(request.cf)).run();
    return responder(201, { ok: true });
  },
};

async function tratarSaude(request, env) {
  if (request.method !== 'GET') return responder(405, { erro: 'metodo' });
  try {
    await env.DB.prepare(SQL_SAUDE).first();
    return responder(200, { ok: true });
  } catch {
    return responder(503, { ok: false });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === ROTAS.saude) return tratarSaude(request, env);
    const tratar = TRATADORES[pathname];
    if (!tratar) return responder(404, { erro: 'rota' });
    if (request.method !== 'POST') return responder(405, { erro: 'metodo' });
    if (request.headers.get('Origin') !== env.ORIGEM_PERMITIDA) return responder(403, { erro: 'origem' });
    try {
      return await tratar(await lerCorpo(request), env, request);
    } catch (erro) {
      if (erro instanceof ErroValidacao) return responder(400, { erro: 'pedido' });
      return responder(503, { ok: false });
    }
  },
};
```

- [ ] **Passo 5: rodar e ver passar.** `npm test`. Esperado: tudo verde.

- [ ] **Passo 6: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add worker/cabecalhos.js worker/index.js tests/js/worker.test.js && git commit -m "feat: criar as rotas da API com cabeçalhos de segurança"
```

### Tarefa 4.4: banco D1, configuração do Wrangler e teste local da API

**Arquivos:**
- Criar: `migrations/0001_inicial.sql`, `wrangler.jsonc`, `.dev.vars` (fora do Git, cópia do exemplo)

- [ ] **Passo 1: escrever `migrations/0001_inicial.sql`.**

```sql
-- Banco do apendisite (spec, seção 9.3). Nenhuma coluna guarda IP ou valor clínico.

CREATE TABLE contagem (
  dia    TEXT NOT NULL,
  evento TEXT NOT NULL CHECK (evento IN ('abriu', 'calculou')),
  idioma TEXT NOT NULL CHECK (idioma IN ('pt', 'en')),
  pais   TEXT NOT NULL,
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, evento, idioma, pais)
);

CREATE TABLE resposta_sus (
  id     INTEGER PRIMARY KEY,
  dia    TEXT NOT NULL,
  idioma TEXT NOT NULL CHECK (idioma IN ('pt', 'en')),
  item1  INTEGER NOT NULL CHECK (item1 BETWEEN 1 AND 5),
  item2  INTEGER NOT NULL CHECK (item2 BETWEEN 1 AND 5),
  item3  INTEGER NOT NULL CHECK (item3 BETWEEN 1 AND 5),
  item4  INTEGER NOT NULL CHECK (item4 BETWEEN 1 AND 5),
  item5  INTEGER NOT NULL CHECK (item5 BETWEEN 1 AND 5),
  item6  INTEGER NOT NULL CHECK (item6 BETWEEN 1 AND 5),
  item7  INTEGER NOT NULL CHECK (item7 BETWEEN 1 AND 5),
  item8  INTEGER NOT NULL CHECK (item8 BETWEEN 1 AND 5),
  item9  INTEGER NOT NULL CHECK (item9 BETWEEN 1 AND 5),
  item10 INTEGER NOT NULL CHECK (item10 BETWEEN 1 AND 5),
  area   TEXT NOT NULL CHECK (area IN ('cir_ped_especialista',
           'cir_ped_residente', 'cir_geral', 'pediatria', 'emergencia',
           'familia_comunidade', 'generalista', 'outra_especialidade',
           'estudante_medicina')),
  pais   TEXT NOT NULL,
  usaria TEXT NOT NULL CHECK (usaria IN ('sim', 'talvez', 'nao'))
);

CREATE TABLE nota_utilidade (
  id     INTEGER PRIMARY KEY,
  dia    TEXT NOT NULL,
  nota   INTEGER CHECK (nota BETWEEN 0 AND 10),
  teste  INTEGER NOT NULL CHECK (teste IN (0, 1)),
  idioma TEXT NOT NULL CHECK (idioma IN ('pt', 'en')),
  pais   TEXT NOT NULL,
  CHECK ((teste = 1 AND nota IS NULL) OR (teste = 0 AND nota IS NOT NULL))
);
```

- [ ] **Passo 2: login e conta (Wilson).** O primeiro comando abre o navegador para autorizar o Wrangler. Clicar em "Allow" na página da Cloudflare.

```bash
cd ~/Documents/apendisite && npx wrangler login
```

```bash
cd ~/Documents/apendisite && npx wrangler whoami
```

Esperado: a tabela de contas com a conta "apendisite" e a da Leviva. O Wilson cola o output, e eu copio o `Account ID` da linha "apendisite" (identificador, não segredo).

- [ ] **Passo 3: escrever o `wrangler.jsonc`, ainda sem o D1.** Com o `account_id` do passo 2 no lugar indicado:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "apendisite",
  "account_id": "COLAR_AQUI_O_ACCOUNT_ID_DA_CONTA_APENDISITE",
  "main": "worker/index.js",
  "compatibility_date": "2026-10-01",
  "workers_dev": false,
  "preview_urls": false,
  "routes": [{ "pattern": "apendisite.com.br", "custom_domain": true }],
  "assets": {
    "directory": "./public",
    "run_worker_first": ["/api", "/api/*"],
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "vars": { "ORIGEM_PERMITIDA": "https://apendisite.com.br" },
  "observability": { "enabled": false }
}
```

Conferir que `COLAR_AQUI...` foi trocado antes do passo 4.

- [ ] **Passo 4: criar o D1 (Wilson).** Sem `--update-config`, que reformata o arquivo (lição de `2026-10-01-wrangler-d1-create-erro-10000-e-config-reformatada.md`). Se vier "Authentication error [code: 10000]" seguido de 5xx, esperar um minuto e repetir antes de mexer no login.

```bash
cd ~/Documents/apendisite && npx wrangler d1 create apendisite
```

```bash
cd ~/Documents/apendisite && npx wrangler d1 info apendisite --json
```

O Wilson cola os dois outputs. Eu anoto o `database_id` e a região (vai para o runbook, Q11a).

- [ ] **Passo 5: acrescentar o D1 ao `wrangler.jsonc`**, depois de `vars`:

```jsonc
  "d1_databases": [
    { "binding": "DB", "database_name": "apendisite",
      "database_id": "COLAR_AQUI_O_DATABASE_ID", "migrations_dir": "migrations" }
  ],
```

- [ ] **Passo 6: aplicar a migração no banco local e no remoto (Wilson).** Os dois comandos perguntam "Ok to proceed?". Responder `y`. O banco remoto ainda não recebe tráfego, então aplicar agora não tem efeito público.

```bash
cd ~/Documents/apendisite && npx wrangler d1 migrations apply apendisite --local
```

```bash
cd ~/Documents/apendisite && npx wrangler d1 migrations apply apendisite --remote
```

- [ ] **Passo 7: subir o servidor local (Wilson).** Fica rodando no terminal dele.

```bash
cd ~/Documents/apendisite && cp -n .dev.vars.exemplo .dev.vars && npx wrangler dev
```

- [ ] **Passo 8: testar as quatro rotas no local.** Eu rodo, contra `http://localhost:8787`:

```bash
curl -s -i http://localhost:8787/api/saude
curl -s -i -X POST http://localhost:8787/api/evento -H 'Origin: http://localhost:8787' -H 'Content-Type: application/json' -d '{"evento":"abriu","idioma":"pt"}'
curl -s -i -X POST http://localhost:8787/api/sus -H 'Origin: http://localhost:8787' -H 'Content-Type: application/json' -d '{"idioma":"pt","itens":[3,4,2,5,1,3,4,2,5,1],"area":"pediatria","pais":"BR","usaria":"sim","site":""}'
curl -s -i -X POST http://localhost:8787/api/utilidade -H 'Origin: http://localhost:8787' -H 'Content-Type: application/json' -d '{"idioma":"en","nota":"teste"}'
curl -s -i -X POST http://localhost:8787/api/evento -H 'Origin: https://exemplo.com' -H 'Content-Type: application/json' -d '{"evento":"abriu","idioma":"pt"}'
curl -s -i http://localhost:8787/
```

Esperado: 200, 204, 201, 201, 403 e 200 (a página). As respostas de `/api` trazem os oito cabeçalhos. Depois o Wilson confere o que gravou:

```bash
cd ~/Documents/apendisite && npx wrangler d1 execute apendisite --local --command "SELECT * FROM contagem; SELECT COUNT(*) AS sus FROM resposta_sus; SELECT * FROM nota_utilidade;"
```

Esperado: uma linha em `contagem` com `n = 1` e país `XX` (no local não há `request.cf.country`, Inferido), uma resposta SUS e uma nota de teste.

- [ ] **Passo 9: commit (Wilson).** `.dev.vars` fica fora (está no `.gitignore`).

```bash
cd ~/Documents/apendisite && git add migrations/0001_inicial.sql wrangler.jsonc && git status --short && git commit -m "feat: criar o banco D1 e a configuração do Worker"
```

### Tarefa 4.5: chamadas da página e estado da visita

**Arquivos:**
- Criar: `public/js/servidor.js`, `public/js/visita.js`
- Modificar: `public/js/dom.js` (`armazenamento()`)
- Teste: `tests/js/servidor.test.js`, `tests/js/visita.test.js`

**Interfaces:**
- Produz em `servidor.js`: `montarCorpoEvento(evento, idioma)`, `montarCorpoSus({idioma, itens, area, pais, usaria, site})`, `montarCorpoUtilidade(idioma, nota)`, `enviar(rota, corpo, buscar) -> Promise<boolean>`, `enviarSemFalha(rota, corpo, buscar) -> Promise<boolean>`.
- Produz em `visita.js`: `CHAVE_SUS = 'apendisite.sus_respondido'`, `novaVisita()`, `registrarResultado(visita)`, `oQueMostrarAbaixoDoResultado(visita, {respondido, ativo}) -> 'convite'|'utilidade'|'obrigado'|'nada'`, `faltandoNoSus(respostas) -> string[]`, `lerRespondido(armazenamento) -> boolean`, `marcarRespondido(armazenamento) -> boolean`. `visita` é `{resultados, conviteDispensado, utilidade: 'pendente'|'obrigado'|'pulada'}`. `respostas` é `{itens: string[10], area, pais, usaria}`.
- Produz em `dom.js`: `armazenamento() -> Storage|null` (o acesso ao `localStorage` pode lançar erro em navegador bloqueado).

- [ ] **Passo 1: escrever os testes que falham.**

`tests/js/servidor.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAVES, ROTAS } from '../../public/js/contrato_api.js';
import { VALORES_VAZIOS } from '../../public/js/entrada.js';
import { enviar, enviarSemFalha, montarCorpoEvento, montarCorpoSus, montarCorpoUtilidade } from '../../public/js/servidor.js';

const CAMPOS_DO_FORMULARIO = Object.keys(VALORES_VAZIOS);
const formulario = Object.fromEntries(CAMPOS_DO_FORMULARIO.map((campo) => [campo, '1']));

function buscarFalso(status = 201) {
  const pedidos = [];
  const buscar = async (url, init) => {
    pedidos.push({ url, init });
    return { ok: status >= 200 && status < 300, status };
  };
  return { buscar, pedidos };
}

test('corpos_tem_so_as_chaves_do_contrato', () => {
  const sus = montarCorpoSus({ ...formulario, idioma: 'pt', itens: Array(10).fill(3), area: 'pediatria', pais: 'BR', usaria: 'sim', site: '', escore: 0.6 });
  assert.deepEqual(Object.keys(sus).sort(), [...CHAVES.sus].sort());
  assert.deepEqual(Object.keys(montarCorpoEvento('abriu', 'pt')).sort(), [...CHAVES.evento].sort());
  assert.deepEqual(Object.keys(montarCorpoUtilidade('pt', 7)).sort(), [...CHAVES.utilidade].sort());
});

test('nenhum_campo_do_formulario_entra_num_corpo_enviado', async () => {
  const { buscar, pedidos } = buscarFalso();
  await enviar(ROTAS.sus, montarCorpoSus({ ...formulario, idioma: 'pt', itens: Array(10).fill(3), area: 'pediatria', pais: 'BR', usaria: 'sim', site: '' }), buscar);
  await enviar(ROTAS.evento, montarCorpoEvento('calculou', 'pt'), buscar);
  await enviar(ROTAS.utilidade, montarCorpoUtilidade('pt', 'teste'), buscar);
  for (const { init } of pedidos) {
    const chaves = Object.keys(JSON.parse(init.body));
    for (const campo of CAMPOS_DO_FORMULARIO) assert.ok(!chaves.includes(campo), campo);
  }
});

test('enviar_faz_post_json_sem_credencial', async () => {
  const { buscar, pedidos } = buscarFalso(204);
  assert.equal(await enviar(ROTAS.evento, montarCorpoEvento('abriu', 'en'), buscar), true);
  assert.equal(pedidos[0].url, '/api/evento');
  assert.equal(pedidos[0].init.method, 'POST');
  assert.equal(pedidos[0].init.headers['Content-Type'], 'application/json');
  assert.equal(pedidos[0].init.credentials, 'omit');
});

test('enviarSemFalha_devolve_falso_em_erro_de_rede_e_em_429', async () => {
  const quebrado = async () => { throw new Error('sem rede'); };
  assert.equal(await enviarSemFalha(ROTAS.evento, montarCorpoEvento('abriu', 'pt'), quebrado), false);
  assert.equal(await enviarSemFalha(ROTAS.evento, montarCorpoEvento('abriu', 'pt'), buscarFalso(429).buscar), false);
});
```

`tests/js/visita.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVE_SUS,
  faltandoNoSus,
  lerRespondido,
  marcarRespondido,
  novaVisita,
  oQueMostrarAbaixoDoResultado,
  registrarResultado,
} from '../../public/js/visita.js';

const ATIVO = { respondido: false, ativo: true };

function armazenamentoFalso() {
  const dados = new Map();
  return { getItem: (k) => (dados.has(k) ? dados.get(k) : null), setItem: (k, v) => dados.set(k, String(v)), dados };
}

test('convite_so_no_primeiro_resultado_da_visita', () => {
  const primeiro = registrarResultado(novaVisita());
  assert.equal(oQueMostrarAbaixoDoResultado(primeiro, ATIVO), 'convite');
  assert.equal(oQueMostrarAbaixoDoResultado(registrarResultado(primeiro), ATIVO), 'nada');
  assert.equal(oQueMostrarAbaixoDoResultado(novaVisita(), ATIVO), 'nada');
});

test('agora_nao_esconde_o_convite', () => {
  const visita = { ...registrarResultado(novaVisita()), conviteDispensado: true };
  assert.equal(oQueMostrarAbaixoDoResultado(visita, ATIVO), 'nada');
});

test('quem_ja_respondeu_ve_a_utilidade_e_depois_o_obrigado', () => {
  const visita = registrarResultado(novaVisita());
  assert.equal(oQueMostrarAbaixoDoResultado(visita, { respondido: true, ativo: true }), 'utilidade');
  assert.equal(oQueMostrarAbaixoDoResultado({ ...visita, utilidade: 'obrigado' }, { respondido: true, ativo: true }), 'obrigado');
  assert.equal(oQueMostrarAbaixoDoResultado({ ...visita, utilidade: 'pulada' }, { respondido: true, ativo: true }), 'nada');
});

test('questionario_desligado_nao_mostra_nada', () => {
  const visita = registrarResultado(novaVisita());
  assert.equal(oQueMostrarAbaixoDoResultado(visita, { respondido: false, ativo: false }), 'nada');
  assert.equal(oQueMostrarAbaixoDoResultado(visita, { respondido: true, ativo: false }), 'nada');
});

test('faltandoNoSus_lista_cada_pergunta_sem_resposta', () => {
  const respostas = { itens: ['3', '', '2', '5', '1', '3', '4', '2', '5', ''], area: '', pais: 'BR', usaria: 'sim' };
  assert.deepEqual(faltandoNoSus(respostas), ['item2', 'item10', 'area']);
});

test('marca_de_respondido_no_aparelho', () => {
  const armazenamento = armazenamentoFalso();
  assert.equal(lerRespondido(armazenamento), false);
  assert.equal(marcarRespondido(armazenamento), true);
  assert.equal(armazenamento.dados.get(CHAVE_SUS), '1');
  assert.equal(lerRespondido(armazenamento), true);
});

test('sem_armazenamento_nada_quebra', () => {
  assert.equal(lerRespondido(null), false);
  assert.equal(marcarRespondido(null), false);
  const quebrado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
  assert.equal(lerRespondido(quebrado), false);
  assert.equal(marcarRespondido(quebrado), false);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `npm test`. Esperado: módulos não encontrados.

- [ ] **Passo 3: escrever `public/js/servidor.js`.**

```js
// Chamadas a /api. Cada corpo é montado só com as chaves do contrato (spec, seção 9.2).
// Nenhum valor do formulário nem o resultado sai do aparelho.

export function montarCorpoEvento(evento, idioma) {
  return { evento, idioma };
}

export function montarCorpoSus({ idioma, itens, area, pais, usaria, site }) {
  return { idioma, itens: [...itens], area, pais, usaria, site };
}

export function montarCorpoUtilidade(idioma, nota) {
  return { idioma, nota };
}

/** POST JSON. Devolve true se a resposta foi 2xx. */
export async function enviar(rota, corpo, buscar = globalThis.fetch.bind(globalThis)) {
  const resposta = await buscar(rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
    credentials: 'omit',
    keepalive: true,
  });
  return resposta.ok;
}

/** Como enviar, mas erro de rede vira false. O cálculo nunca depende do servidor. */
export async function enviarSemFalha(rota, corpo, buscar) {
  try {
    return await enviar(rota, corpo, buscar);
  } catch {
    return false;
  }
}
```

- [ ] **Passo 4: escrever `public/js/visita.js`.**

```js
// Estado da visita: convite, utilidade e marca de "já respondeu". Funções puras.
// Visita é a página aberta. Recarregar começa visita nova (spec, seção 9.1).

export const CHAVE_SUS = 'apendisite.sus_respondido';
const VALOR_RESPONDIDO = '1';

export function novaVisita() {
  return { resultados: 0, conviteDispensado: false, utilidade: 'pendente' };
}

export function registrarResultado(visita) {
  return { ...visita, resultados: visita.resultados + 1 };
}

/** O que vai abaixo do resultado. Só o primeiro resultado da visita leva convite ou utilidade. */
export function oQueMostrarAbaixoDoResultado(visita, { respondido, ativo }) {
  if (!ativo || visita.resultados !== 1) return 'nada';
  if (respondido) {
    if (visita.utilidade === 'obrigado') return 'obrigado';
    return visita.utilidade === 'pulada' ? 'nada' : 'utilidade';
  }
  return visita.conviteDispensado ? 'nada' : 'convite';
}

/** Perguntas do questionário ainda sem resposta, na ordem da tela. */
export function faltandoNoSus(respostas) {
  const faltando = respostas.itens.flatMap((valor, i) => (valor === '' ? [`item${i + 1}`] : []));
  for (const campo of ['area', 'pais', 'usaria']) if (respostas[campo] === '') faltando.push(campo);
  return faltando;
}

export function lerRespondido(armazenamento) {
  try {
    return armazenamento?.getItem(CHAVE_SUS) === VALOR_RESPONDIDO;
  } catch {
    return false;
  }
}

export function marcarRespondido(armazenamento) {
  if (!armazenamento) return false;
  try {
    armazenamento.setItem(CHAVE_SUS, VALOR_RESPONDIDO);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Passo 5: acrescentar `armazenamento` a `dom.js`.**

```js
/** O localStorage, ou null se o navegador bloqueia o acesso. */
export function armazenamento() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
```

- [ ] **Passo 6: rodar e ver passar.** `npm test`.

- [ ] **Passo 7: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/servidor.js public/js/visita.js public/js/dom.js tests/js/servidor.test.js tests/js/visita.test.js && git commit -m "feat: enviar só os campos do contrato e guardar o estado da visita"
```

### Tarefa 4.6: contador, convite, questionário e utilidade na página

**Arquivos:**
- Modificar: `public/js/app.js`

- [ ] **Passo 1: imports e estado.** Em `app.js`:

```js
import { ROTAS } from './contrato_api.js';
import { armazenamento } from './dom.js';
import { enviarSemFalha, montarCorpoEvento, montarCorpoSus, montarCorpoUtilidade } from './servidor.js';
import { faltandoNoSus, lerRespondido, marcarRespondido, novaVisita, oQueMostrarAbaixoDoResultado, registrarResultado } from './visita.js';
import { listaDePaises } from './textos.js';
```

(`armazenamento` entra no `import` de `dom.js` que já existe, e `listaDePaises` no de `textos.js`.)

Constantes e estado novos:

```js
// Chave do questionário (Q16a). Desligada, somem convite, link do rodapé e utilidade.
// O contador continua. Decisão em 22/10 às 18:00.
const QUESTIONARIO_ATIVO = true;
const NOTAS_DE_UTILIDADE = Array.from({ length: 11 }, (_, i) => i);
const VALORES_SUS = ['1', '2', '3', '4', '5'];

function questionarioVazio() {
  return { aberto: false, etapa: 'participacao', elegivel: false, respostas: { itens: Array(10).fill(''), area: '', pais: '', usaria: '' }, faltando: [], falhou: false, enviando: false };
}
```

No objeto `estado`: `visita: novaVisita()`, `respondido: false`, `questionario: questionarioVazio()`, `enviado: false`.

- [ ] **Passo 2: contador.** Em `iniciar`, logo depois de `desenhar()`:

```js
  estado.respondido = lerRespondido(armazenamento());
  enviarSemFalha(ROTAS.evento, montarCorpoEvento('abriu', estado.idioma));
```

(A leitura de `respondido` vai antes de `desenhar()`.) Em `calcular`, depois de montar `estado.resultado` e antes de `desenhar()`:

```js
  estado.visita = registrarResultado(estado.visita);
  enviarSemFalha(ROTAS.evento, montarCorpoEvento('calculou', estado.idioma));
```

- [ ] **Passo 3: o que vai abaixo do resultado.** Função nova, chamada como último filho da `section` em `desenharResultado`:

```js
function desenharAbaixoDoResultado() {
  const mostrar = oQueMostrarAbaixoDoResultado(estado.visita, { respondido: estado.respondido, ativo: QUESTIONARIO_ATIVO });
  if (mostrar === 'convite') {
    return el('div', { class: 'convite' },
      el('p', {}, t('convite')),
      el('button', { type: 'button', class: 'botao-principal', onclick: abrirQuestionario }, t('convite_responder')),
      el('button', { type: 'button', class: 'botao-secundario', onclick: () => { estado.visita = { ...estado.visita, conviteDispensado: true }; desenhar(); } }, t('convite_agora_nao')));
  }
  if (mostrar === 'utilidade') {
    return el('div', { class: 'utilidade' },
      el('p', {}, t('utilidade_pergunta')),
      el('div', { class: 'escala' },
        el('span', { class: 'ancora' }, t('utilidade_0')),
        NOTAS_DE_UTILIDADE.map((nota) => el('button', { type: 'button', onclick: () => enviarUtilidade(nota) }, String(nota))),
        el('span', { class: 'ancora' }, t('utilidade_10'))),
      el('button', { type: 'button', class: 'botao-secundario', onclick: () => enviarUtilidade('teste') }, t('utilidade_teste')),
      el('button', { type: 'button', class: 'botao-secundario', onclick: () => { estado.visita = { ...estado.visita, utilidade: 'pulada' }; desenhar(); } }, t('utilidade_pular')));
  }
  if (mostrar === 'obrigado') return el('p', { class: 'utilidade', role: 'status' }, t('utilidade_obrigado'));
  return null;
}

function enviarUtilidade(nota) {
  enviarSemFalha(ROTAS.utilidade, montarCorpoUtilidade(estado.idioma, nota));
  estado.visita = { ...estado.visita, utilidade: 'obrigado' };
  desenhar();
}
```

- [ ] **Passo 4: o diálogo do questionário.** Funções novas:

```js
function abrirQuestionario() {
  estado.questionario = { ...questionarioVazio(), aberto: true };
  desenharQuestionario();
  document.getElementById('questionario').showModal();
}

function fecharQuestionario() {
  estado.questionario = questionarioVazio();
  document.getElementById('questionario').close();
}

function conteudoParticipacao() {
  const q = estado.questionario;
  return [
    el('h2', {}, t('participacao_titulo')),
    t('participacao_paragrafos').map((p) => el('p', {}, p)),
    el('label', {},
      el('input', { type: 'checkbox', id: 'campo-elegivel', checked: q.elegivel, onchange: (e) => { q.elegivel = e.target.checked; } }),
      ` ${t('participacao_caixa')}`),
    q.faltando.includes('elegivel') ? el('p', { class: 'erro' }, t('erro_vazio')) : null,
    el('button', { type: 'button', class: 'botao-principal', onclick: () => {
      if (!q.elegivel) { q.faltando = ['elegivel']; desenharQuestionario(); return; }
      q.etapa = 'perguntas';
      q.faltando = [];
      desenharQuestionario();
    } }, t('comecar')),
    el('button', { type: 'button', class: 'botao-secundario', onclick: fecharQuestionario }, t('cancelar')),
  ];
}

function perguntaSus(indice) {
  const q = estado.questionario;
  const nome = `item${indice + 1}`;
  return el('fieldset', { class: 'escolha' },
    el('legend', {}, `${indice + 1}. ${t('sus_itens')[indice]}`),
    el('div', { class: 'opcoes escala' },
      el('span', { class: 'ancora' }, t('sus_ancora_1')),
      VALORES_SUS.map((valor) => el('label', {},
        el('input', { type: 'radio', name: nome, value: valor, checked: q.respostas.itens[indice] === valor, onchange: () => { q.respostas.itens[indice] = valor; } }),
        ` ${valor}`)),
      el('span', { class: 'ancora' }, t('sus_ancora_5'))),
    q.faltando.includes(nome) ? el('p', { class: 'erro' }, t('erro_vazio')) : null);
}

function conteudoPerguntas() {
  const q = estado.questionario;
  const r = q.respostas;
  const seletor = (campo, rotulo, opcoes) => el('div', { class: 'campo' },
    el('label', { for: `campo-${campo}` }, rotulo),
    el('select', { id: `campo-${campo}`, onchange: (e) => { r[campo] = e.target.value; } },
      el('option', { value: '' }, t('pais_selecione')),
      opcoes.map(([valor, texto]) => el('option', { value: valor, selected: r[campo] === valor }, texto))),
    q.faltando.includes(campo) ? el('p', { class: 'erro' }, t('erro_vazio')) : null);
  return [
    el('h2', {}, t('participacao_titulo')),
    el('p', {}, t('sus_instrucao')),
    t('sus_itens').map((_, i) => perguntaSus(i)),
    el('p', { class: 'nota' }, t('sus_fonte')),
    seletor('area', t('area_pergunta'), Object.entries(t('areas'))),
    seletor('pais', t('pais_pergunta'), listaDePaises(estado.idioma)),
    el('fieldset', { class: 'escolha' },
      el('legend', {}, t('usaria_pergunta')),
      el('div', { class: 'opcoes' }, Object.entries(t('usaria')).map(([valor, texto]) => el('label', {},
        el('input', { type: 'radio', name: 'usaria', value: valor, checked: r.usaria === valor, onchange: () => { r.usaria = valor; } }),
        ` ${texto}`))),
      q.faltando.includes('usaria') ? el('p', { class: 'erro' }, t('erro_vazio')) : null),
    el('div', { class: 'isca', 'aria-hidden': 'true' },
      el('input', { type: 'text', id: 'campo-site', name: 'site', tabindex: '-1', autocomplete: 'off' })),
    q.falhou ? el('p', { class: 'erro', role: 'alert' }, t('erro_envio')) : null,
    el('button', { type: 'button', class: 'botao-principal', disabled: q.enviando, onclick: enviarSus }, t('enviar')),
    el('button', { type: 'button', class: 'botao-secundario', onclick: fecharQuestionario }, t('cancelar')),
  ];
}

async function enviarSus() {
  const q = estado.questionario;
  q.faltando = faltandoNoSus(q.respostas);
  if (q.faltando.length > 0) {
    desenharQuestionario();
    return;
  }
  q.enviando = true;
  q.falhou = false;
  desenharQuestionario();
  const corpo = montarCorpoSus({
    idioma: estado.idioma,
    itens: q.respostas.itens.map(Number),
    area: q.respostas.area,
    pais: q.respostas.pais,
    usaria: q.respostas.usaria,
    site: document.getElementById('campo-site').value,
  });
  const ok = await enviarSemFalha(ROTAS.sus, corpo);
  q.enviando = false;
  if (!ok) {
    q.falhou = true;
    desenharQuestionario();
    return;
  }
  marcarRespondido(armazenamento());
  estado.visita = { ...estado.visita, conviteDispensado: true };
  estado.enviado = true;
  fecharQuestionario();
  desenhar();
}

function desenharQuestionario() {
  const dialogo = document.getElementById('questionario');
  const etapa = estado.questionario.etapa;
  dialogo.replaceChildren(...(etapa === 'participacao' ? conteudoParticipacao() : conteudoPerguntas()).flat(Infinity).filter(Boolean));
}
```

A marca de "já respondeu" gravada nesta visita não liga a utilidade na mesma visita: `estado.respondido` só é lido em `iniciar`. A pergunta aparece na visita seguinte, como diz a tela de participação.

- [ ] **Passo 5: diálogo, aviso de envio e link do rodapé.** Em `desenhar`, o `replaceChildren` passa a ser:

```js
  const partes = [
    desenharCabecalho(),
    el('main', {}, desenharFormulario(), desenharResultado(), desenharSobre()),
    estado.enviado ? el('p', { class: 'convite', role: 'status' }, t('enviado')) : null,
    desenharRodape(),
    el('dialog', { id: 'questionario', class: 'questionario', onclose: () => { estado.questionario = questionarioVazio(); } }),
  ];
  document.getElementById('app').replaceChildren(...partes.filter(Boolean));
```

Em `desenharRodape`, depois do link da Privacidade:

```js
    QUESTIONARIO_ATIVO ? el('button', { type: 'button', class: 'link', onclick: abrirQuestionario }, t('rodape_avaliar')) : null,
```

- [ ] **Passo 6: conferir com o `wrangler dev` (Wilson deixa rodando, tarefa 4.4 passo 7).** Eu abro `http://localhost:8787` no navegador do app e confiro, com `read_network_requests` para ver os corpos:
  1. Abrir a página manda um POST `/api/evento` com `{"evento":"abriu","idioma":"pt"}` e mais nada.
  2. Cada cálculo manda `{"evento":"calculou",...}`. Nenhum corpo tem campo do formulário.
  3. O convite aparece sob o primeiro resultado. Um segundo cálculo não o repete. "Agora não" o esconde.
  4. "Responder" abre o diálogo. Sem a caixa marcada, "Começar" mostra "Preencha este campo.". Sem responder tudo, "Enviar" marca cada pergunta faltante.
  5. Enviar grava (o Wilson confere com `d1 execute`), fecha o diálogo e mostra "Resposta enviada. Obrigado por participar.".
  6. Recarregar a página: sem convite, e sob o primeiro resultado aparece a utilidade. Nota 8 grava e mostra "Obrigado.". "Pular" não envia.
  7. Com o `wrangler dev` parado, o cálculo continua funcionando e o envio do questionário mostra a mensagem de erro aprovada, mantendo as respostas.
  8. A lista de países abre com o Brasil e segue em ordem alfabética no idioma da página.

- [ ] **Passo 7: commit, push e PR (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/js/app.js && git commit -m "feat: contar uso e abrir o questionário e a utilidade na página"
```

```bash
cd ~/Documents/apendisite && git push -u origin feat/parte-4-api && gh pr create --base main --title "feat: Worker, D1, questionário e utilidade" --body "Rotas /api validadas no servidor, D1 com contagem sem IP, questionário SUS anônimo com campo-isca e nota de utilidade na visita seguinte. Por quê: decisões Q1a, Q5b a Q9a, Q13a, Q14b e Q17a. Nenhum corpo leva campo do formulário, conferido por teste e no navegador."
```

**Portão da Parte 4:** eu mostro as respostas do `curl`, as linhas do D1 local e os corpos dos pedidos lidos no navegador. Com o OK do Wilson:

```bash
cd ~/Documents/apendisite && gh pr merge --merge --delete-branch && git switch main && git pull
```

Atualizar a passagem.

---
## Parte 5 (21/10, tarde): cabeçalhos, Privacidade, plano B, script de produção e documentos

Aprovada pelo Wilson em 19/10/2026, junto com as Partes 6, 7 e 8 (bloco 4).

Pronto quando os arquivos estáticos levam os mesmos oito cabeçalhos do Worker, a Privacidade funciona com e sem JavaScript, o plano B está pronto e ensaiado com `--dry-run`, o `conferir_producao.sh` roda contra o local e o runbook, o README e o model card estão aprovados pelo Wilson.

Branch (Wilson):

```bash
cd ~/Documents/apendisite && git switch main && git pull && git switch -c feat/parte-5-producao
```

### Tarefa 5.1: cabeçalhos estáticos, robots e página 404

**Arquivos:**
- Criar: `public/_headers`, `public/robots.txt`, `public/404.html`
- Teste: `tests/js/cabecalhos.test.js`

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/cabecalhos.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { CABECALHOS_SEGURANCA } from '../../worker/cabecalhos.js';
import { lerTexto } from './auxiliares.js';

async function existe(caminho) {
  try {
    await access(new URL(`../../${caminho}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

function lerArquivoDeCabecalhos(texto) {
  const linhas = texto.split('\n').filter((linha) => linha.trim() !== '');
  assert.equal(linhas[0], '/*');
  return Object.fromEntries(linhas.slice(1).map((linha) => {
    const posicao = linha.indexOf(':');
    return [linha.slice(0, posicao).trim(), linha.slice(posicao + 1).trim()];
  }));
}

test('_headers_iguais_aos_cabecalhos_do_worker', async () => {
  for (const caminho of ['public/_headers', 'plano-b/_headers']) {
    if (caminho.startsWith('plano-b') && !(await existe(caminho))) continue;
    assert.deepEqual(lerArquivoDeCabecalhos(await lerTexto(caminho)), { ...CABECALHOS_SEGURANCA }, caminho);
  }
});

test('hsts_sem_preload', () => {
  assert.ok(!CABECALHOS_SEGURANCA['Strict-Transport-Security'].includes('preload'));
});

test('pagina_404_bilingue_sem_javascript', async () => {
  const html = await lerTexto('public/404.html');
  assert.ok(!/<script/i.test(html));
  assert.ok(html.includes('Página não encontrada.'));
  assert.ok(html.includes('Page not found.'));
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/cabecalhos.test.js`. Esperado: arquivo `public/_headers` não encontrado.

- [ ] **Passo 3: escrever os três arquivos.**

`public/_headers`:

```
/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Frame-Options: DENY
```

`public/robots.txt`:

```
User-agent: *
Disallow: /api/
```

`public/404.html`:

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>apendisite</title>
  <link rel="icon" type="image/png" href="/img/favicon.png">
  <link rel="stylesheet" href="/css/apendisite.css">
</head>
<body>
  <main class="pagina-simples">
    <p><img class="logo" src="/img/logo.png" alt="apendisite" width="1520" height="299"></p>
    <p lang="pt-BR">Página não encontrada. <a href="/">Ir para a calculadora.</a></p>
    <p lang="en">Page not found. <a href="/?lang=en">Go to the calculator.</a></p>
  </main>
</body>
</html>
```

Acrescentar `.pagina-simples` ao contrato de classes do CSS.

- [ ] **Passo 4: rodar e ver passar.** `npm test`.

- [ ] **Passo 5: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/_headers public/robots.txt public/404.html tests/js/cabecalhos.test.js public/css/apendisite.css && git commit -m "feat: servir os arquivos estáticos com os cabeçalhos de segurança"
```

### Tarefa 5.2: página Privacidade

A Privacidade vem escrita no HTML nos dois idiomas, para funcionar sem JavaScript. Com JavaScript, `privacidade.js` mostra só o idioma escolhido e põe os botões PT e EN (spec 8.7). Um teste confere que o HTML repete palavra por palavra os textos de `textos.js`.

**Arquivos:**
- Criar: `public/privacidade/index.html`, `public/js/privacidade.js`
- Teste: `tests/js/privacidade.test.js`

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/privacidade.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTOS } from '../../public/js/textos.js';
import { lerTexto } from './auxiliares.js';

const html = await lerTexto('public/privacidade/index.html');

function secao(idioma) {
  const encontrada = html.match(new RegExp(`<section[^>]*data-idioma="${idioma}"[^>]*>([\\s\\S]*?)</section>`));
  assert.ok(encontrada, `seção ${idioma} ausente`);
  return encontrada[1];
}

test('privacidade_repete_os_textos_aprovados_nos_dois_idiomas', () => {
  for (const idioma of ['pt', 'en']) {
    const conteudo = secao(idioma);
    const paragrafos = [...conteudo.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].trim());
    assert.deepEqual(paragrafos, TEXTOS[idioma].priv_paragrafos, idioma);
    assert.ok(conteudo.includes(`<h1>${TEXTOS[idioma].priv_titulo}</h1>`), idioma);
    assert.ok(conteudo.includes(TEXTOS[idioma].priv_voltar), idioma);
  }
});

test('privacidade_carrega_so_o_proprio_script', () => {
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts, ['/js/privacidade.js']);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/privacidade.test.js`. Esperado: arquivo não encontrado.

- [ ] **Passo 3: escrever `public/privacidade/index.html`.** Os parágrafos são cópia de `TEXTOS.pt.priv_paragrafos` e `TEXTOS.en.priv_paragrafos`, um `<p>` por item, na mesma ordem, sem quebra de linha dentro do `<p>`.

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>apendisite: Privacidade | Privacy</title>
  <link rel="icon" type="image/png" href="/img/favicon.png">
  <link rel="stylesheet" href="/css/apendisite.css">
  <script type="module" src="/js/privacidade.js"></script>
</head>
<body>
  <header class="cabecalho">
    <p><a href="/"><img class="logo" src="/img/logo.png" alt="apendisite" width="1520" height="299"></a></p>
    <div id="idioma"></div>
  </header>
  <main class="pagina-simples">
    <section lang="pt-BR" data-idioma="pt">
      <h1>Privacidade</h1>
      <p>Responsável pelo tratamento dos dados: Wilson Elias de Oliveira Junior, pessoa física. Contato: contato@apendisite.com.br.</p>
      <p>Dados do paciente. Os valores digitados na calculadora ficam no seu aparelho. O cálculo é feito no navegador, e nenhum valor do formulário, nem o resultado, é enviado ao servidor. Ao fechar ou recarregar a página, os valores são apagados.</p>
      <p>Contador de uso. O site conta quantas vezes foi aberto e quantos cálculos foram feitos. Cada registro tem o dia, o tipo de evento (abertura ou cálculo), o idioma e o país informado pela rede da Cloudflare. O contador não guarda IP, nome nem o que foi digitado.</p>
      <p>Questionário e nota de utilidade. As respostas ao questionário de usabilidade e à pergunta "Este site foi útil neste caso?" são anônimas. Não pedimos nome nem e-mail e não guardamos IP. As respostas podem ser publicadas de forma agregada, em artigo e em congresso, e ficam guardadas até 5 anos depois da publicação.</p>
      <p>Dados guardados no aparelho. O site guarda no seu navegador só o idioma escolhido e a marca de que você já respondeu ao questionário, para não mostrar o convite de novo. O site não cria cookies próprios e não usa ferramentas de análise de terceiros.</p>
      <p>Cloudflare. O site é hospedado na Cloudflare, que é operadora dos dados de acesso. Para entregar as páginas, a Cloudflare recebe o endereço IP de quem acessa, como qualquer serviço de hospedagem, e também o usa para limitar envios repetidos do questionário. Esse IP não chega ao nosso banco de dados.</p>
      <p>Seus direitos. Para dúvidas ou pedidos sobre seus dados, escreva para contato@apendisite.com.br. Como as respostas não têm identificação, não conseguimos localizar a resposta de uma pessoa.</p>
      <nav><a href="/">Voltar à calculadora</a></nav>
    </section>
    <section lang="en" data-idioma="en">
      <h1>Privacy</h1>
      <p>Data controller: Wilson Elias de Oliveira Junior, as an individual. Contact: contato@apendisite.com.br.</p>
      <p>Patient data. The values entered in the calculator stay on your device. The calculation runs in the browser, and no form value, and no result, is sent to the server. When you close or reload the page, the values are erased.</p>
      <p>Usage counter. The site counts how many times it was opened and how many calculations were made. Each record has the date, the event type (opening or calculation), the language and the country reported by the Cloudflare network. The counter does not store IP addresses, names or anything that was entered.</p>
      <p>Survey and usefulness rating. Responses to the usability survey and to the question "Was this site useful in this case?" are anonymous. We do not ask for names or email addresses and do not store IP addresses. Responses may be published in aggregate form, in an article and at conferences, and are kept for up to 5 years after publication.</p>
      <p>Data stored on your device. The site stores in your browser only the chosen language and a mark that you already answered the survey, so the invitation is not shown again. The site sets no cookies of its own and uses no third-party analytics.</p>
      <p>Cloudflare. The site is hosted on Cloudflare, which is the processor of access data. To deliver the pages, Cloudflare receives the IP address of each visitor, as any hosting service does, and also uses it to limit repeated survey submissions. That IP address never reaches our database.</p>
      <p>Your rights. For questions or requests about your data, write to contato@apendisite.com.br. Because responses carry no identification, we cannot locate one person's response.</p>
      <nav><a href="/?lang=en">Back to the calculator</a></nav>
    </section>
  </main>
</body>
</html>
```

- [ ] **Passo 4: escrever `public/js/privacidade.js`.**

```js
// Página Privacidade: mostra só o idioma escolhido. Sem JavaScript, os dois aparecem.
import { idiomaInicial, seletorDeIdioma } from './dom.js';
import { TEXTOS } from './textos.js';

function mostrar(idioma) {
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
  for (const secao of document.querySelectorAll('section[data-idioma]')) {
    secao.hidden = secao.dataset.idioma !== idioma;
  }
  document.getElementById('idioma').replaceChildren(seletorDeIdioma(idioma, TEXTOS[idioma].idioma_aviso, mostrar));
}

mostrar(idiomaInicial());
```

- [ ] **Passo 5: rodar e ver passar.** `npm test`. Conferir no navegador do app: `/privacidade/` abre no idioma do aparelho, o botão troca, e com JavaScript desligado as duas seções aparecem.

- [ ] **Passo 6: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add public/privacidade/index.html public/js/privacidade.js tests/js/privacidade.test.js && git commit -m "feat: publicar a página Privacidade em PT e EN"
```

### Tarefa 5.3: plano B

Página informativa estática, sem JavaScript, com os blocos aprovados (S8): cabeçalho, "Como o modelo foi feito", autoria, como citar e contato, em PT e depois EN na mesma página. Mesmo nome de Worker, mesmo `account_id`, mesmo domínio (spec 13.4).

**Arquivos:**
- Criar: `plano-b/index.html`, `wrangler.plano-b.jsonc`, `tests/js/plano_b.test.js`
- Copiar (Wilson): `plano-b/_headers`, `plano-b/estilo.css`, `plano-b/img/logo.png`, `plano-b/img/favicon.png`

- [ ] **Passo 1: escrever o teste que falha.**

`tests/js/plano_b.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerTexto } from './auxiliares.js';

const TRAVESSAO = String.fromCharCode(0x2014);
const html = await lerTexto('plano-b/index.html');
const aprovado = await lerTexto('docs/textos_aprovados.md');

function textos() {
  return [...html.matchAll(/<(p|li|h1|h2)[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => m[2].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
}

test('plano_b_sem_javascript', () => {
  assert.ok(!/<script/i.test(html));
});

test('plano_b_so_tem_textos_aprovados', () => {
  const ausentes = [];
  for (const texto of textos()) {
    for (const pedaco of texto.split(/10\.5281\/zenodo\.\d+/)) {
      if (pedaco.trim() && !aprovado.includes(pedaco.trim())) ausentes.push(pedaco);
    }
  }
  assert.deepEqual(ausentes, []);
});

test('plano_b_tem_portugues_e_depois_ingles_sem_travessao', () => {
  assert.ok(html.indexOf('lang="pt-BR"') < html.indexOf('lang="en"'));
  assert.ok(!html.includes(TRAVESSAO));
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/js/plano_b.test.js`. Esperado: arquivo não encontrado.

- [ ] **Passo 3: copiar os arquivos de apoio (Wilson).**

```bash
cd ~/Documents/apendisite && mkdir -p plano-b/img && cp public/_headers plano-b/_headers && cp public/css/apendisite.css plano-b/estilo.css && cp public/img/logo.png public/img/favicon.png plano-b/img/
```

- [ ] **Passo 4: escrever `plano-b/index.html`.** Os parágrafos são cópia dos blocos aprovados. O bloco "Como citar" entra só com o DOI da versão conhecido (Fase A6). O link do Zenodo entra só depois da publicação (tarefa 7.4). Sem o DOI, os dois ficam fora, e o resto da página vale sozinho (spec 13.4, item 4).

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>apendisite</title>
  <link rel="icon" type="image/png" href="/img/favicon.png">
  <link rel="stylesheet" href="/estilo.css">
</head>
<body>
  <main class="pagina-simples">
    <section lang="pt-BR">
      <h1><img class="logo" src="/img/logo.png" alt="apendisite" width="1520" height="299"></h1>
      <p>Escore de apendicite em crianças de 2 a 14 anos, por um modelo de aprendizado de máquina desenvolvido e validado por cirurgiões pediátricos e pesquisadores da FMB/UNESP, Botucatu (SP). Ferramenta de pesquisa para médicos e estudantes de medicina.</p>
      <h2>Como o modelo foi feito</h2>
      <p>O apendisite usa um random forest (500 árvores, profundidade máxima 5) treinado com 15 dados de rotina do pronto-socorro: idade, sexo, peso, náusea, vômito, febre, disúria, dor à palpação em fossa ilíaca direita, dor difusa à palpação, dois achados da radiografia simples, leucócitos, neutrófilos, PCR e leucócitos na urina. Quatro variáveis derivadas usam cortes fixos (leucócitos acima de 10.000/mm³, neutrófilos acima de 7.500/mm³, PCR acima de 5,0 mg/dL e leucócitos na urina acima de 10 por campo).</p>
      <p>O desfecho é a decisão de operar, tomada pela equipe de cirurgia pediátrica. Na validação, as 76 crianças operadas tiveram apendicite confirmada.</p>
      <p>A derivação incluiu 339 crianças atendidas no HC-FMB/UNESP de 2019 a 2021, das quais 176 (51,9%) foram operadas. Os dois cortes foram fixados no grupo de teste da derivação (102 crianças), antes da validação. O corte de equilíbrio (0,503) é o índice de Youden. O corte de alta sensibilidade (0,358) é o de maior especificidade com sensibilidade de pelo menos 95%.</p>
      <p>A validação prospectiva incluiu 320 crianças em Botucatu (SP), de março a setembro de 2025, das quais 76 (23,8%) foram operadas. A AUC foi 0,89 (IC 95% 0,84 a 0,92).</p>
      <p>Aplicado sem retreino a dois bancos públicos da Alemanha, o modelo teve AUC 0,77 em Regensburg (781 crianças) e 0,78 em Düsseldorf (301) para a decisão cirúrgica. A análise é do nosso grupo, foi apresentada em congresso e não foi publicada.</p>
      <h2>Autoria</h2>
      <ul>
        <li>Bruna Aliotto Nalin Tedesco, MD, PhD, cirurgiã pediátrica</li>
        <li>Wilson Elias de Oliveira Junior, MD, PhD, cirurgião pediátrico</li>
        <li>Erika Veruska Paiva Ortolan, MD, PhD, cirurgiã pediátrica</li>
      </ul>
      <p>Faculdade de Medicina de Botucatu (FMB/UNESP), Botucatu (SP). Contato: <a href="mailto:contato@apendisite.com.br">contato@apendisite.com.br</a></p>
    </section>
    <section lang="en">
      <p>Appendicitis score for children aged 2 to 14 years, from a machine learning model developed and validated by pediatric surgeons and researchers at FMB/UNESP, Botucatu, Brazil. A research tool for physicians and medical students.</p>
      <h2>How the model was built</h2>
      <p>apendisite uses a random forest (500 trees, maximum depth 5) trained on 15 routine emergency department data points: age, sex, weight, nausea, vomiting, fever, dysuria, right lower quadrant tenderness, diffuse abdominal tenderness, two plain radiograph findings, white blood cell count, neutrophils, C-reactive protein and urine white blood cells. Four derived variables use fixed thresholds (white blood cell count above 10,000/mm³, neutrophils above 7,500/mm³, C-reactive protein above 5.0 mg/dL and urine white blood cells above 10 per high-power field).</p>
      <p>The outcome is the decision to operate, made by the pediatric surgery team. In validation, all 76 children who underwent surgery had confirmed appendicitis.</p>
      <p>The derivation cohort included 339 children seen at HC-FMB/UNESP from 2019 to 2021, of whom 176 (51.9%) underwent surgery. Both cutoffs were fixed in the derivation test set (102 children), before validation. The balanced cutoff (0.503) is the Youden index. The high-sensitivity cutoff (0.358) is the one with the highest specificity among those with a sensitivity of at least 95%.</p>
      <p>The prospective validation included 320 children in Botucatu, Brazil, from March to September 2025, of whom 76 (23.8%) underwent surgery. The AUC was 0.89 (95% CI 0.84 to 0.92).</p>
      <p>Applied without retraining to two public German datasets, the model had an AUC of 0.77 in Regensburg (781 children) and 0.78 in Düsseldorf (301) for the surgical decision. This analysis was done by our group, presented at a conference and not yet published.</p>
      <h2>Authors</h2>
      <ul>
        <li>Bruna Aliotto Nalin Tedesco, MD, PhD, pediatric surgeon</li>
        <li>Wilson Elias de Oliveira Junior, MD, PhD, pediatric surgeon</li>
        <li>Erika Veruska Paiva Ortolan, MD, PhD, pediatric surgeon</li>
      </ul>
      <p>Botucatu Medical School (FMB/UNESP), Botucatu, Brazil. Contact: <a href="mailto:contato@apendisite.com.br">contato@apendisite.com.br</a></p>
    </section>
  </main>
</body>
</html>
```

Com `DOI_VERSAO` conhecido, acrescentar ao fim de cada seção (trocando `DOI_DA_VERSAO` pelo valor de `textos.js`):

```html
      <h2>Como citar</h2>
      <p>Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Versão 1.0.0. Zenodo; 2026. doi:DOI_DA_VERSAO. Resultados apresentados no 38º Congresso Brasileiro de Cirurgia Pediátrica, 2026.</p>
```

```html
      <h2>How to cite</h2>
      <p>Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Version 1.0.0. Zenodo; 2026. doi:DOI_DA_VERSAO. Results presented at the 38th Brazilian Congress of Pediatric Surgery, 2026.</p>
```

- [ ] **Passo 5: escrever `wrangler.plano-b.jsonc`** (mesmo `account_id` do `wrangler.jsonc`):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "apendisite",
  "account_id": "MESMO_ACCOUNT_ID_DO_WRANGLER_JSONC",
  "compatibility_date": "2026-10-01",
  "workers_dev": false,
  "preview_urls": false,
  "routes": [{ "pattern": "apendisite.com.br", "custom_domain": true }],
  "assets": {
    "directory": "./plano-b",
    "not_found_handling": "single-page-application"
  },
  "observability": { "enabled": false }
}
```

- [ ] **Passo 6: rodar e ver passar.** `npm test` (o `pagina.test.js` também passa a ler `plano-b/`). Conferir a página no navegador do app servindo `plano-b/` com `python3 -m http.server 8001 --directory plano-b`.

- [ ] **Passo 7: ensaio sem publicar (Wilson).** Não verificado até aqui: se o `--config` com Worker só de arquivos estáticos passa na validação.

```bash
cd ~/Documents/apendisite && npx wrangler deploy --config wrangler.plano-b.jsonc --dry-run
```

Esperado: a lista de arquivos estáticos e nenhuma publicação. Se o Wrangler recusar a configuração, ajustar antes do portão e registrar no runbook.

- [ ] **Passo 8: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add plano-b/index.html plano-b/_headers plano-b/estilo.css plano-b/img/logo.png plano-b/img/favicon.png wrangler.plano-b.jsonc tests/js/plano_b.test.js && git commit -m "feat: preparar o plano B estático no mesmo endereço"
```

### Tarefa 5.4: script de conferência de produção

**Arquivos:**
- Criar: `scripts/conferir_producao.sh`

Só leitura, sem POST. Cada linha sai como PASSOU, FALHOU ou NÃO CONFERIDO, e o script termina com erro se houver FALHOU (spec 13.3). Os valores esperados dos cabeçalhos vêm de `public/_headers`, e o SHA-256 do JSON vem do repositório e do model card.

- [ ] **Passo 1: escrever `scripts/conferir_producao.sh`.**

```bash
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
  done < "$RAIZ/public/_headers"
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
```

- [ ] **Passo 2: permissão de execução (Wilson).**

```bash
cd ~/Documents/apendisite && chmod +x scripts/conferir_producao.sh && bash -n scripts/conferir_producao.sh && echo sintaxe ok
```

- [ ] **Passo 3: ensaio contra o local.** Com o `wrangler dev` rodando (Wilson) e o model card da tarefa 5.5 já com o SHA-256, eu rodo `scripts/conferir_producao.sh --base http://localhost:8787`. Esperado: itens 1, 4, 5, 7, 8 e 9 PASSOU. Itens 2, 3, 10, 11 e 12 NÃO CONFERIDO. O item 6 depende de o `wrangler dev` aplicar o `_headers` aos arquivos estáticos (Não verificado): se falhar só no local, anotar no runbook e conferir em produção na Parte 6.

- [ ] **Passo 4: commit (Wilson).**

```bash
cd ~/Documents/apendisite && git add scripts/conferir_producao.sh && git commit -m "feat: conferir a produção só com leituras"
```

### Tarefa 5.5: runbook, README, model card e relatórios

**Arquivos:**
- Criar: `docs/RUNBOOK.md`, `README.md`, `docs/MODEL_CARD.md`, `CONTRIBUTING.md`, `RELATORIO_TESTES.md`, `RELATORIO_FEEDBACK.md`, `scripts/montar_pacote_zenodo.sh`

- [ ] **Passo 1: runbook.** Carregar a skill `runbook` e escrever `docs/RUNBOOK.md` em uma página, com os seis campos e só os fatos abaixo:
  1. O que é e quem usa: calculadora pública do random forest, médicos e estudantes de medicina, destino do QR do tema livre do 38º CBCP.
  2. Como rodar localmente: `npm install`, `cp -n .dev.vars.exemplo .dev.vars`, `npx wrangler d1 migrations apply apendisite --local`, `npx wrangler dev`, `npm test`, venv com `requirements-conversao.txt` e `./.venv/bin/python -m pytest`. Conferir do zero num clone limpo antes de dar como pronto (convenção 18).
  3. Onde ficam as contas, pelo endereço: conta Cloudflare "apendisite" no login do Wilson (Workers, D1 `apendisite` com a região anotada na tarefa 4.4, regra de limite, Redirect Rule, Email Routing), Zenodo (registro do DOI), registro.br (domínio, titular pessoa física), Gmail do Wilson (destino do `contato@`). Nenhum segredo no repositório: o Worker não tem segredo.
  4. Deploy e volta atrás: testes verdes, commit, tag `deploy-AAAAMMDD-HHMM`, `npx wrangler deploy`, `scripts/conferir_producao.sh`. Voltar: `git switch --detach <tag anterior>` e `npx wrangler deploy`. Plano B: `npx wrangler deploy --config wrangler.plano-b.jsonc`, volta com o deploy normal. Backup do D1: `npx wrangler d1 export apendisite --remote --output ~/Documents/apendisite-backups/backup_AAAAMMDD.sql`, semanal até 30/11/2026 e mensal depois. Retenção: respostas até 5 anos depois da publicação, contagens sem prazo.
  5. Quem chamar: Wilson (`contato@apendisite.com.br`). Depois de 23/10, Bruna como Administrator na Cloudflare e com edição no Zenodo.
  6. Modos de falha conhecidos: Web Analytics religado insere script (item 4 do script de produção), 429 no Wi-Fi do congresso perde contagens sem afetar o cálculo, D1 fora do ar não afeta o cálculo, deploy na conta errada (o `account_id` fixo impede), PCR em mg/L sem conversão (seletor e faixa), troca de servidores DNS e DNSSEC desligado até religar, fim do "Enviar como" do Gmail em janeiro de 2027, `wrangler rollback` sem garantia de voltar os arquivos estáticos (Não verificado), `_headers` só vale para arquivos estáticos (o Worker repete os cabeçalhos).

- [ ] **Passo 2: README em inglês (S7).** Seções: what it is (frase EN aprovada), the calculator (`https://apendisite.com.br`), how the score is computed (JSON exportado, `Math.fround` nas 32 colunas, cortes 0.503 e 0.358 comparados ao escore cheio), reproducing the parity (`run.py exportar`, `run.py sinteticos`, `npm test`), privacy (nada do formulário sai do aparelho, nenhum dado de paciente no repositório), files and SHA-256 (`.joblib` `ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858` e o SHA-256 do JSON da tarefa 1.2), how to cite (texto EN aprovado com o DOI da versão), authors, funding (linha EN aprovada), license CC BY 4.0, "Research tool. It does not replace clinical assessment." Só fatos dos textos aprovados e deste plano. Sem travessão, sem citar o artigo do JPS (spec 15.7), sem texto sobre regularização (Q3.10).

- [ ] **Passo 3: model card em inglês (S7).** Seções e fontes:
  1. Model details: random forest do scikit-learn 1.8.0, 500 árvores, profundidade máxima 5, pipeline com imputação pela mediana e pela moda e indicadores de faltante, 32 colunas (spec 4.1).
  2. Intended use: os três parágrafos de "linhas visíveis" EN aprovados.
  3. Inputs: as 15 entradas e as quatro derivadas (primeiro parágrafo EN de "How the model was built").
  4. Outcome, derivation, validation, external application: parágrafos 2 a 5 EN aprovados.
  5. Cutoffs and bands: 0.358 e 0.503, sensibilidade e especificidade aprovadas, frequências por faixa (1 of 120, 8 of 70, 67 of 130).
  6. Limitations: os seis itens EN aprovados.
  7. Parity: casos sintéticos (n, diferença máxima, iguais bit a bit, zero discordâncias, semente 20261023) e as 659 crianças só em agregado (de `docs/paridade_659.md`).
  8. Files and hashes, com a linha exata que o `conferir_producao.sh` lê: ``SHA-256 of the JSON: `<valor da tarefa 1.2>` `` e a do `.joblib`.
  9. License and citation.

- [ ] **Passo 4: `CONTRIBUTING.md`, `RELATORIO_TESTES.md` e `RELATORIO_FEEDBACK.md` em português.** CONTRIBUTING: branch `tipo/descricao`, Conventional Commits em português, `npm test` e `pytest` verdes antes do PR, texto novo só com aprovação do Wilson, nenhum dado de paciente. RELATORIO_TESTES: contagem de `npm test` e de `pytest` (com a saída que bate), as duas paridades. RELATORIO_FEEDBACK: tabela vazia (data, quem, o quê, decisão).

- [ ] **Passo 5: escrever `scripts/montar_pacote_zenodo.sh`** (roda em 22/10, tarefa 7.2):

```bash
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
```

- [ ] **Passo 6: auditoria de escrita.** Skill `escrita-formal` nos `.md` em português. Nos `.md` em inglês, busca por travessão e pela lista de vocabulário banido. `grep -c` de travessão em todos os `.md` dá zero.

- [ ] **Passo 7: commit, push e PR (Wilson).**

```bash
cd ~/Documents/apendisite && chmod +x scripts/montar_pacote_zenodo.sh && git add docs/RUNBOOK.md README.md docs/MODEL_CARD.md CONTRIBUTING.md RELATORIO_TESTES.md RELATORIO_FEEDBACK.md scripts/montar_pacote_zenodo.sh && git commit -m "docs: escrever runbook, README, model card e relatórios"
```

```bash
cd ~/Documents/apendisite && git push -u origin feat/parte-5-producao && gh pr create --base main --title "feat: produção, plano B e documentação" --body "Cabeçalhos de segurança nos arquivos estáticos, Privacidade em PT e EN que funciona sem JavaScript, plano B ensaiado, script de conferência só de leitura, runbook, README e model card. Por quê: convenção 18 e decisão Q4.2."
```

**Portão da Parte 5:** eu mostro ao Wilson a página do plano B renderizada, o runbook, o README e o model card. Ele aprova os textos novos e mescla:

```bash
cd ~/Documents/apendisite && gh pr merge --merge --delete-branch && git switch main && git pull
```

---

## Parte 6 (21/10, fim da tarde): primeiro deploy, regra de limite e www

Pronto quando `https://apendisite.com.br` serve a calculadora, o `www` redireciona com 301, o `http` vai para `https`, a regra de limite está ativa, os logs persistentes e o `workers.dev` estão desligados, e o `conferir_producao.sh` sai sem FALHOU (o item 12 fica NÃO CONFERIDO até 22/10).

### Tarefa 6.1: conferir a Fase A

- [ ] **Passo 1: leitura.** Eu rodo:

```bash
curl -s https://rdap.registro.br/domain/apendisite.com.br | python3 -c "import json,sys; d=json.load(sys.stdin); print([n['ldhName'] for n in d['nameservers']], d['secureDNS'])"
dig +short NS apendisite.com.br @8.8.8.8
dig +short MX apendisite.com.br @8.8.8.8
```

Esperado: `albert` e `dorthy.ns.cloudflare.com`, `delegationSigned: False` e três MX `route*.mx.cloudflare.net`.

- [ ] **Passo 2: painel (Wilson confirma, com captura).** Em `dash.cloudflare.com`, conta "apendisite", domínio `apendisite.com.br`: status "Active" na visão geral. Em "Analytics & Logs", "Web Analytics" desligado para a zona. Em "Security", "Bots", "Bot Fight Mode" desligado. Em "Email", "Email Routing", a regra `contato@apendisite.com.br` para o Gmail com o destino verificado. Os nomes dos menus podem ter mudado (Não verificado): se algum não aparecer, o Wilson manda a captura.

Se a zona não estiver ativa, parar: o deploy espera, e o prazo do plano B (22/10, 18:00) começa a contar.

### Tarefa 6.2: deploy

- [ ] **Passo 1: testes e árvore limpa (Wilson).**

```bash
cd ~/Documents/apendisite && git switch main && git pull && npm test && ./.venv/bin/python -m pytest -q && git status --short
```

Esperado: tudo verde e `git status` vazio.

- [ ] **Passo 2: tag e deploy (Wilson).**

```bash
cd ~/Documents/apendisite && TAG="deploy-$(date +%Y%m%d-%H%M)" && git tag "$TAG" && git push origin "$TAG" && npx wrangler deploy && echo "tag: $TAG"
```

Esperado: "Uploaded apendisite", a lista de arquivos estáticos e o domínio `apendisite.com.br` como custom domain. Se o Wrangler acusar registro DNS existente no apex, o Wilson me manda a lista de registros do painel antes de apagar qualquer um (regra de escalonamento 3).

### Tarefa 6.3: configuração da zona (Wilson, clique a clique)

Os nomes dos menus são os da documentação lida em 19/10 e podem ter mudado (Não verificado). Em caso de dúvida, captura antes de salvar.

- [ ] **Passo 1: "Always Use HTTPS" (A11).** Domínio `apendisite.com.br`, "SSL/TLS", "Edge Certificates", "Always Use HTTPS" em On.

- [ ] **Passo 2: registro do `www`.** "DNS", "Records", "Add record". Type `AAAA`, Name `www`, IPv6 address `100::`, Proxy status "Proxied" (nuvem laranja). "Save".

- [ ] **Passo 3: Redirect Rule do `www` (Q4.3).** "Rules", "Redirect Rules" (Single Redirects), "Create rule". Nome `www para o apex`. Em "If incoming requests match", "Custom filter expression": campo "Hostname", operador "equals", valor `www.apendisite.com.br`. Em "Then", "URL redirect", tipo "Dynamic", expressão `concat("https://apendisite.com.br", http.request.uri.path)`, status `301`, "Preserve query string" ligado. "Deploy". Se o painel oferecer o modelo "Redirect from WWW to root", usar o modelo e conferir os mesmos campos.

- [ ] **Passo 4: regra de limite (Q4.10).** "Security", "WAF", "Rate limiting rules", "Create rule". Nome `api 50 em 10 s`. Campo "URI Path", operador "starts with", valor `/api/` (se não houver "starts with" no Free, operador "wildcard" com `/api/*`). Características: IP. Limite: 50 pedidos em 10 segundos. Ação: Block, duração 10 segundos, resposta padrão 429. "Deploy".

- [ ] **Passo 5: Worker no painel.** "Workers & Pages", `apendisite`, "Settings", "Domains & Routes": `workers.dev` e "Preview URLs" desligados, custom domain `apendisite.com.br` ativo. "Settings", "Observability": logs desligados (spec 2.8). Anotar o subdomínio `workers.dev` da conta (aparece na visão geral de "Workers & Pages") para o item 10 do script.

### Tarefa 6.4: conferência

- [ ] **Passo 1: script.** Eu rodo `scripts/conferir_producao.sh --workers-dev <subdomínio>`. Esperado: nenhum FALHOU, item 12 NÃO CONFERIDO. Cada FALHOU vai ao runbook (modo de falha) e é corrigido antes do próximo passo.

- [ ] **Passo 2: contador em produção (Wilson).** Abrir `https://apendisite.com.br` no celular e depois:

```bash
cd ~/Documents/apendisite && npx wrangler d1 execute apendisite --remote --command "SELECT * FROM contagem ORDER BY dia DESC LIMIT 5"
```

Esperado: uma linha `abriu` com o país `BR`.

- [ ] **Passo 3: e-mail de teste (Wilson).** De outra conta, mandar um e-mail para `contato@apendisite.com.br` e confirmar que chegou no Gmail.

- [ ] **Passo 4: registrar.** Atualizar `RELATORIO_TESTES.md` com a saída do script (branch `docs/primeiro-deploy`, commit e PR como nas partes anteriores) e a passagem.

---

## Parte 7 (22/10): Zenodo, deploy final, QR e decisão das 18:00

### Tarefa 7.1: fomento e DOIs

- [ ] **Passo 1: fomento.** Se a Bruna confirmar a CAPES no PDPG, nada muda. Se a agência for outra, eu proponho a linha nova em PT e EN, o Wilson aprova, e a mudança entra em `textos.js` e na seção 13 de `docs/textos_aprovados.md` com a data.

- [ ] **Passo 2: DOI da versão.** Se `DOI_VERSAO` ainda está nulo, entra o DOI reservado na Fase A6, no `textos.js`, no README, no model card e no plano B (tarefa 5.3, passo 4). Branch `docs/doi-da-versao`, commit, PR e merge, como nas partes anteriores.

### Tarefa 7.2: tag e pacote

- [ ] **Passo 1: congelar (Wilson).**

```bash
cd ~/Documents/apendisite && git switch main && git pull && npm test && ./.venv/bin/python -m pytest -q && git tag v1.0.0 && git push origin v1.0.0
```

- [ ] **Passo 2: pacote (Wilson).**

```bash
cd ~/Documents/apendisite && scripts/montar_pacote_zenodo.sh && unzip -l dist/zenodo-1.0.0/apendisite-1.0.0-codigo.zip
```

- [ ] **Passo 3: conferir o pacote.** Eu confiro a lista do zip (os arquivos do spec 12.3 estão lá, nenhum `.pkl`, nenhum dado de criança) e que o SHA-256 do `.joblib` e do JSON em `SHA256SUMS.txt` batem com o README e o model card (lição de `2026-08-26-release-github-zenodo-antes-do-merge.md`: conferir o conteúdo antes de arquivar). Eu rodo, numa pasta temporária, `unzip` do pacote, cópia do `.joblib` para `models/` e `node --test tests/js/paridade_sintetica.test.js`, para provar que o pacote roda sozinho.

### Tarefa 7.3: publicação no Zenodo (Wilson, com o OK na hora)

- [ ] **Passo 1: README e model card finais.** Eu mostro os dois ao Wilson. Ele aprova.

- [ ] **Passo 2: upload.** No rascunho do Zenodo (Fase A6), "Upload files": `random_forest.joblib`, `random_forest_v1.0.0.json`, `apendisite-1.0.0-codigo.zip`, `casos_sinteticos_v1.0.0.json`, `MODEL_CARD.md`, `README.md`, `LICENSE`. `SHA256SUMS.txt` fica fora. Conferir os metadados: tipo Software, título "apendisite: a random forest for appendicitis in children", versão 1.0.0, criadores Bruna, Wilson e Erika com ORCID e ROR da UNESP, idiomas por e eng, licença CC BY 4.0, descrição em PT e EN, DOI reservado igual ao `DOI_VERSAO`.

- [ ] **Passo 3: publicar.** Eu pergunto ao Wilson se publica. Só com o sim dele naquela hora, ele clica em "Publish". Versão publicada no Zenodo não muda depois.

- [ ] **Passo 4: DOI do conceito.** O Wilson copia da página do registro o DOI de "all versions" e me passa.

### Tarefa 7.4: deploy final

- [ ] **Passo 1: DOIs no site.** `DOI_CONCEITO` em `textos.js`. No plano B, o link do Zenodo no fim de cada seção:

```html
      <p><a href="https://doi.org/DOI_DO_CONCEITO">Código e modelo no Zenodo</a></p>
```

```html
      <p><a href="https://doi.org/DOI_DO_CONCEITO">Code and model on Zenodo</a></p>
```

`npm test` verde. Branch `feat/doi-do-conceito`, commit, PR e merge.

- [ ] **Passo 2: deploy (Wilson).** Mesmo comando da tarefa 6.2, passo 2.

- [ ] **Passo 3: conferência.** `scripts/conferir_producao.sh --workers-dev <subdomínio> --doi <DOI da versão>`. Esperado: nenhum FALHOU e nenhum NÃO CONFERIDO.

### Tarefa 7.5: QR e e-mail

- [ ] **Passo 1: leitura pelo Vision.** Eu rodo `swift docs/qr/ler_qr.swift docs/qr/qr_apendisite.png`. Esperado: `https://apendisite.com.br`.

- [ ] **Passo 2: celulares (Wilson).** Câmera do iPhone e do Android apontada para o QR na tela ou impresso: os dois abrem `https://apendisite.com.br` e a calculadora carrega.

- [ ] **Passo 3: e-mail.** Se o teste da tarefa 6.4 não foi feito, fazer agora.

### Tarefa 7.6: decisão das 18:00 (Wilson)

- [ ] **Passo 1: checklist.** Segue a calculadora se: as duas paridades passaram (Parte 1), o `conferir_producao.sh` passou depois do último deploy (tarefa 7.4) e o QR abriu nos dois celulares (tarefa 7.5). Faltando qualquer um, entra o plano B.

- [ ] **Passo 2: se for o plano B (Wilson).**

```bash
cd ~/Documents/apendisite && npx wrangler deploy --config wrangler.plano-b.jsonc
```

Depois eu confiro `https://apendisite.com.br` (200, página informativa, sem script) e os itens 2, 3, 4, 5, 6 e 11 do script.

- [ ] **Passo 3: questionário.** O Wilson decide `QUESTIONARIO_ATIVO`. Se desligar: `false` em `app.js`, `npm test`, branch, commit, PR, merge e deploy com tag.

- [ ] **Passo 4: apagar o app do Streamlit Cloud (S9, Wilson).** Eu confirmo com ele antes, porque não tem volta. Em `share.streamlit.io`, na lista de apps, menu do app antigo, "Delete", confirmar. Depois eu confiro que o endereço antigo não serve mais a calculadora.

- [ ] **Passo 5: passagem.** Atualizar com o que ficou no ar e o que falta.

---

## Parte 8 (23/10, 7:30): checagem antes do tema livre

- [ ] **Passo 1:** eu rodo `scripts/conferir_producao.sh --workers-dev <subdomínio> --doi <DOI da versão>`. Qualquer FALHOU segue o runbook.
- [ ] **Passo 2:** o Wilson faz a lista manual que o script imprime: QR nos dois celulares, um caso sintético na tela, troca PT e EN, e-mail.
- [ ] **Passo 3:** 8:00, tema livre.

## Depois de 23/10

- Backup do D1 (Wilson), semanal até 30/11/2026 e mensal depois:

```bash
mkdir -p ~/Documents/apendisite-backups && cd ~/Documents/apendisite && npx wrangler d1 export apendisite --remote --output ~/Documents/apendisite-backups/backup_$(date +%Y%m%d).sql
```

- DNSSEC: ligar na Cloudflare ("DNS", "Settings", "DNSSEC", "Enable"), copiar o registro DS e cadastrar no registro.br. Conferir com `dig +dnssec`.
- Bruna como Administrator na conta Cloudflare ("Manage Account", "Members", "Invite") e com edição no registro do Zenodo (Q4.12).
- Status da passagem para `encerrada` quando tudo acima estiver feito.

---

## Revisão do plano contra o spec

| Seção do spec | Onde está no plano |
|---|---|
| 1. Objetivo e escopo | Partes 1 a 7 (os sete itens da versão 1.0.0) |
| 2. Arquitetura, `wrangler.jsonc`, `account_id`, logs, `run_worker_first`, `workers_dev` e `preview_urls` | 4.4 (passos 3 e 5), 6.3 (passo 5) |
| 3. Repositório, ferramentas, versões, `.gitignore` | Parte 0, restrição 14 |
| 4.1 e 4.2. Estrutura do `.joblib` e exportação determinística | 1.2 |
| 4.3. Motor com `Math.fround`, `<=`, soma na ordem, sem bloqueio | 1.4, 1.6 |
| 4.4. Cortes, faixas, frequências | 1.4, 2.2 |
| 5.1. Campos, derivadas com `>` estrito, raio X (S3, S4) | 2.3, 2.5 |
| 5.2. Vírgula e ponto, sem milhar, idade inteira | 2.3 |
| 5.3. Unidades, conversões, arredondamento, unidade que não muda sozinha | 2.3, 2.5 (passo 8, item 4) |
| 5.4. Faixas e mensagens, bloqueio inteiro, foco no primeiro erro | 2.1, 2.3, 2.5, 3.2 |
| 5.5. Declaração por visita | 2.3, 2.5 |
| 6. Resultado, três casas truncadas (S1), pictograma, aviso do raio X | 2.2, 2.5 |
| 7. Alvarado e PAS (S5, S6) | 3.1, 3.2 |
| 8. Idiomas, `?lang`, aparelho, navegador, países, sem JavaScript, DOIs | 2.1, 2.5, 4.1, 5.2 |
| 9.1. Contador, convite, diálogo, utilidade, `QUESTIONARIO_ATIVO` | 4.5, 4.6, 7.6 |
| 9.2. API, validação, isca, Origin, país, dia, sem IP, 404 e 405 | 4.1 a 4.3 |
| 9.3. D1, retenção, backup | 4.4, 5.5 (runbook), Depois de 23/10 |
| 10. Sem terceiros, sem cookie, cabeçalhos, CSP, HSTS sem preload, limite | 2.5 (teste da página), 4.3, 5.1, 6.3 |
| 11. Testes e critério de paridade | Partes 1 a 5, 7.2 |
| 12. Pacote do Zenodo | 5.5 (passo 5), 7.2, 7.3 |
| 13.1. Deploy e volta atrás | 6.2, 5.5 (runbook) |
| 13.2. Runbook | 5.5 |
| 13.3. `conferir_producao.sh` | 5.4, 6.4, 7.4, Parte 8 |
| 13.4. Plano B | 5.3, 7.6 |
| 14. Calendário | cabeçalho de cada parte |
| 15. Riscos | restrições globais, runbook, 2.3, 6.4 |
| 16 e 17. S1 a S9 e padrões | 2.2 (S1), 2.3 (S2 a S4), 3.1 (S5, S6), 5.5 (S7), 5.3 (S8), 7.6 (S9) |
