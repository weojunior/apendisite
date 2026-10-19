# Spec do apendisite, versão 1

Data: 19/10/2026. Situação: aprovado pelo Wilson em 19/10/2026, seções 1 a 17 e recomendações S1 a S9. Depois de aprovado, vai para `docs/superpowers/specs/2026-10-19-apendisite-design.md` no repositório `weojunior/apendisite`.

## 0. Como ler

Cada requisito leva uma marca de origem:

- [Decidido Qx]: decisão do Wilson nas partes 1 a 4, com o número da pergunta. Não se reabre aqui.
- [Padrão]: escolha técnica minha, reversível, aprovada com o spec em 19/10 (lista na seção 17).
- [Decidido Sn]: pergunta deste spec, decidida pelo Wilson em 19/10 com a recomendação (registro na seção 16).

Fatos levam a classe Observado, Inferido ou Não verificado (convenção 23).

Fontes: passagem `2026-10-18-apendisite-site.md` (seções 3 a 3d), decisões e textos da parte 3 (`apendisite_parte3_decisoes.md`, `apendisite_parte3_textos.md`), ficha de fatos (D1 a D12), fatos das partes 2 e 4, e a leitura de `app/streamlit_app.py`, `src/config.py` e `models/random_forest.joblib` feita nesta sessão.

## 1. Objetivo e escopo

O apendisite é a calculadora pública do random forest de apendicite pediátrica de Botucatu, em português e inglês, no endereço `https://apendisite.com.br`, o destino do QR do tema livre do 38º CBCP (23/10/2026, 8:00).

Entra na versão 1.0.0:

1. Formulário com as 15 entradas do modelo, cálculo do escore no aparelho, os dois cortes e a faixa com a frequência de Botucatu [Decidido Q1, Q6 da parte 1].
2. Seção opcional de Alvarado e PAS [Decidido Q9 a Q11, Q3.25, Q3.26].
3. Contador de abertura e de cálculo sem IP [Decidido Q2c, Q14b].
4. Questionário SUS anônimo e pergunta de utilidade [Decidido Q5b, Q6a, Q9a, Q13a, Q17a].
5. Página Privacidade [Decidido Q8a].
6. Pacote do Zenodo com DOI [Decidido Q3.11, Q4.5, Q4.6, Q4.13].
7. Runbook, script de conferência de produção e plano B [Decidido Q4.2, convenção 18].

Fica fora: escore de pontos da regressão logística (versão 2) [Decidido Q1], recalibração, apendicite complicada, modo offline, conta de usuário, painel de resultados do questionário (a análise sai do export do D1), texto sobre regularização na ANVISA [Decidido Q3.10].

## 2. Arquitetura

```
navegador ──GET──> Cloudflare (zona apendisite.com.br, plano Free)
                     │
                     ├─ arquivos estáticos (HTML, CSS, JS, modelo em JSON)
                     │    servidos sem passar pelo código do Worker
                     │
                     └─ /api/*  ──> código do Worker ──> D1 "apendisite"
                                    (contador, SUS, nota de utilidade)

O cálculo do escore roda inteiro no navegador. Nenhum valor do formulário
nem o resultado viaja para /api.
```

1. Hospedagem em Cloudflare Workers com arquivos estáticos, no lugar da Pages [Decidido Q4.8]. As rotas `/api/*` passam pelo código do Worker, e o resto é arquivo estático.
2. Banco D1 `apendisite`, sem região fixa, conferido com `wrangler d1 info apendisite --json` depois de criado [Decidido Q11a].
3. `workers.dev` desligado e sem prévias públicas [Decidido Q4.8]. O `wrangler.jsonc` fixa `workers_dev: false` e `preview_urls: false`.
4. Domínio próprio no apex `apendisite.com.br`, canônico. O `www` responde 301 para o apex por Redirect Rule da zona (Single Redirect, 10 no Free), com um registro `www` proxiado de espaço reservado (AAAA `100::`), porque o Worker no apex não recebe o tráfego do `www` [Decidido Q4.3, mecanismo Observado na documentação em 19/10]. Não verificado: a expressão que preserva caminho e query, a conferir no modelo de regra do painel.
5. Deploy por `npx wrangler deploy` no terminal do Wilson, sem ligar o GitHub à conta nova da Cloudflare [Decidido Q4.9].
6. O `wrangler.jsonc` traz o `account_id` da conta apendisite [Padrão]. Como o mesmo login tem a conta da Leviva, isso impede publicar na conta errada. O `account_id` é identificador, não segredo.
7. O Worker não tem segredo nenhum: sem chave de API, sem token, sem serviço externo [Padrão].
8. Logs persistentes do Worker desligados (`observability.enabled: false`, escrito explícito) [Padrão]. Para depurar, `wrangler tail` mostra o tráfego ao vivo sem gravar. Motivo: o log de invocação pode guardar cabeçalhos do pedido, e a página Privacidade promete que o IP não chega ao nosso banco. Não verificado: a documentação diverge sobre o padrão sem a chave, não lista os campos do log de invocação e não diz se o `wrangler tail` funciona com a gravação desligada (agente de leitura, 19/10). Conferir no painel, em Worker, Settings, Observability, depois do primeiro deploy.
9. A lista do `run_worker_first` leva `/api` e `/api/*`, porque não está documentado se `/api/*` casa com `/api` sem barra (Não verificado). A lista exige Wrangler 4.20.0 ou superior (Observado no changelog de 17/06/2025).
10. `workers_dev: false` e `preview_urls: false` escritos explícitos. Observado na documentação: desligar o `workers_dev` sozinho não desliga as Version URLs e Preview URLs de um Worker já existente.

Rascunho do `wrangler.jsonc` (os valores entre sinais de menor e maior vêm da Fase A e da criação do D1):

```jsonc
{
  "name": "apendisite",
  "account_id": "<id da conta apendisite>",
  "main": "worker/index.js",
  "compatibility_date": "<data com pelo menos 14 dias>",
  "workers_dev": false,
  "preview_urls": false,
  "routes": [{ "pattern": "apendisite.com.br", "custom_domain": true }],
  "assets": {
    "directory": "./public",
    "run_worker_first": ["/api", "/api/*"],
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "apendisite",
      "database_id": "<id do D1>", "migrations_dir": "migrations" }
  ],
  "observability": { "enabled": false }
}
```

## 3. Repositório e ferramentas

1. O repositório é o `weojunior/sera-apendicite` renomeado para `weojunior/apendisite`. O primeiro commit tira o Streamlit [Decidido, parte 1]. Observado: não há clone local em `~/Documents`, `~/Desktop`, `~/Downloads` nem `~` (busca até profundidade 3). O Wilson clona em `~/Documents/apendisite` [Padrão]. Não verificado: o conteúdo atual do repositório no GitHub (conferir no clone).
2. `~/Documents/apendicite` continua só leitura. Dele saem o `.joblib` (copiado para o repositório novo com o SHA-256 conferido) e os dados da paridade local, lidos pelo caminho, nunca copiados.
3. Estrutura proposta [Padrão]:

```
apendisite/
  public/                      arquivos servidos
    index.html                 calculadora
    privacidade/index.html     página Privacidade
    404.html
    _headers                   cabeçalhos de segurança
    robots.txt
    css/apendisite.css
    js/modelo.js               motor de cálculo puro (sem DOM, sem rede)
    js/entrada.js              leitura dos campos, unidades, faixas, vetor de 19
    js/escores.js              Alvarado e PAS
    js/textos.js               textos PT e EN aprovados
    js/servidor.js             chamadas a /api, só com campos permitidos
    js/app.js                  interface
    modelo/random_forest_v1.0.0.json
    img/                       logo e favicon do brand pack
  plano-b/                     página informativa de contingência
  worker/index.js              rotas /api
  worker/validacao.js          validação pura dos pedidos
  migrations/0001_inicial.sql
  src/apendisite_conversao/    Python: exportar, referencia, sinteticos,
                               paridade, excecoes
  run.py                       CLI: exportar, sinteticos, paridade-local
  tests/js/                    node:test
  tests/python/                pytest, com conftest.py que injeta src/
  tests/dados/casos_sinteticos_v1.0.0.json
  scripts/conferir_producao.sh
  scripts/avaliar_lote.mjs     ponte Python para JS na paridade
  docs/RUNBOOK.md
  docs/MODEL_CARD.md
  docs/paridade_659.md         só agregados
  docs/superpowers/specs/ e plans/
  models/random_forest.joblib
  wrangler.jsonc, package.json, requirements-conversao.txt
  README.md, CONTRIBUTING.md, RELATORIO_TESTES.md, RELATORIO_FEEDBACK.md
  LICENSE (CC BY 4.0)
  .gitignore
```

4. JavaScript puro em módulos ES, sem etapa de build, sem bundler e sem TypeScript [Padrão]. O mesmo arquivo roda no navegador e no Node 25 (Observado: `node -v` dá v25.9.0). Testes com `node --test`, sem Vitest.
5. Única dependência npm: `wrangler`, em `devDependencies`, com versão exata publicada há pelo menos 14 dias [Padrão, convenção 17]. Candidata: 4.147.0, de 02/10/2026 (Observado no registro do npm pelo agente de leitura em 19/10, e a mais recente é a 4.151.1, de 16/10). O Wilson confirma com `npm view wrangler time --json` antes de instalar.
6. Python só para conversão e teste. `requirements-conversao.txt` fixa as versões do venv onde o modelo foi treinado (Observado: Python 3.14.3, scikit-learn 1.8.0, numpy 2.4.4, scipy 1.17.1, joblib 1.5.3, pandas 3.0.3). Docstring Google, type hints e exceções do projeto (convenção 7). O Wilson cria o venv e instala (convenção 2).
7. `.gitignore` cobre `.venv/`, `node_modules/`, `.wrangler/`, `__pycache__/`, `*.pkl`, `dados_locais/`, `*.sql` de backup e arquivos do macOS. Nenhuma linha das 659 crianças entra no Git.

## 4. Modelo no aparelho

### 4.1 O que o `.joblib` contém (Observado nesta sessão)

- SHA-256 `ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858`, 1.397.634 bytes.
- `Pipeline` com `preproc` (`ColumnTransformer`) e `clf` (`RandomForestClassifier`, 500 árvores, `max_depth` 5, profundidade real de 4 a 5, 14.698 nós no total, classes 0 e 1).
- Bloco `num`: idade_anos, leucocitos, neutrofilos, pcr, leucocitos_urina e peso. Imputa a mediana (9, 12.650, 9.570, 4,5, 0,9 e 30) e acrescenta indicador de faltante para as cinco últimas. A idade não tem indicador.
- Bloco `bin`: nausea, emese, febre, disuria, ped_dor_fid, ped_dor_difusa, ped_rx_nivel_fid, ped_rx_nivel_difuso, leucocitose, neutrofilia, pcr_alterado e leucocituria. Imputa a moda (1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0) e acrescenta indicador para nausea, disuria, os dois do raio X e as quatro derivadas. Faltante em coluna sem indicador é imputado sem indicador (`error_on_new` falso).
- Bloco `cat`: sexo, codificado numa coluna só, `sexo_M` (1 para M, 0 para F e para valor desconhecido).
- Saída do pré-processamento: 32 colunas, na ordem 6 numéricas, 5 indicadores numéricos, 12 binárias, 8 indicadores binários e `sexo_M`.

### 4.2 Exportação para JSON

`run.py exportar` lê o `.joblib` e grava `public/modelo/random_forest_v1.0.0.json` [Decidido Q4.6]. Requisitos:

1. Confere a estrutura antes de exportar: nomes dos passos, colunas de cada bloco, estratégias, categorias, 500 árvores, 32 colunas, classes 0 e 1. Qualquer diferença levanta exceção do projeto e nada é gravado.
2. Grava metadados: formato e versão do formato, versão do modelo (1.0.0), SHA-256 do `.joblib`, versões do Python e das bibliotecas, a lista das 19 entradas, as medianas, as modas, as colunas com indicador e a ordem das 32 saídas.
3. Cada árvore vira cinco listas paralelas: filho esquerdo, filho direito, variável, limiar e probabilidade da classe 1 no nó (`value[:,0,1] / value[:,0].sum()`, como o sklearn normaliza). Folha tem filho esquerdo -1.
4. Números com a representação curta do Python (`json.dumps`), que volta ao mesmo double no `JSON.parse`.
5. Não exporta contagem de amostras por nó nem impureza [Padrão]: o cálculo não precisa delas.
6. Saída determinística. Rodar duas vezes dá os mesmos bytes, e o teste confere isso. O SHA-256 do JSON vai ao model card e ao script de produção.
7. Tamanho medido na sonda desta sessão: 434 KB, 82 KB com gzip (Observado).

### 4.3 Motor de cálculo em `modelo.js`

Funções puras, sem DOM e sem rede:

- `carregarModelo(json)`: valida formato, versão, 500 árvores e 32 saídas.
- `transformar(modelo, entrada)`: recebe as 19 entradas, com `null` para faltante, e devolve as 32 colunas, com a mesma imputação e os mesmos indicadores do Python.
- `calcularEscore(modelo, entrada)`: percorre as 500 árvores na ordem e devolve a média das probabilidades das folhas.
- `classificar(escore)`: devolve positivo ou negativo em cada corte e a faixa.

Requisitos de paridade:

1. Antes de comparar com o limiar, cada uma das 32 colunas passa por `Math.fround`, porque o sklearn converte a entrada da floresta para float32. Observado na sonda: com essa conversão, a diferença máxima contra o `predict_proba` nas 659 crianças foi 4,4e-16, com zero discordâncias nos dois cortes. Sem ela, a diferença chegou a 0,002.
2. Regra de decisão do nó: vai para a esquerda se `valor <= limiar`.
3. Soma das 500 folhas na ordem das árvores, dividida por 500.
4. O motor não bloqueia faixa nenhuma. Quem bloqueia é o formulário (seção 5). Assim a paridade roda também nas 7 crianças menores de 2 anos.

### 4.4 Cortes e faixas

1. Constantes no topo de `modelo.js`, escritas assim: `CORTE_EQUILIBRIO = 0.503` e `CORTE_ALTA_SENSIBILIDADE = 0.358` [Decidido, parte 1, Q5].
2. Comparação com o escore cheio, sem arredondar: positivo se `escore >= corte` [Decidido]. Observado na ficha: é o critério do projeto, e nenhuma das 320 probabilidades fica a menos de 0,00015 do 0,503.
3. Faixas: baixa se escore < 0,358. Intermediária se 0,358 <= escore < 0,503. Alta se escore >= 0,503 [Decidido].
4. Frequências fixas no código, da validação: baixa 1 de 120, intermediária 8 de 70, alta 67 de 130 [Decidido, ficha item 4].

## 5. Formulário, unidades e validação

### 5.1 Campos

Ordem e rótulos da seção 2 dos textos aprovados. Todos começam vazios [Decidido, parte 1].

| Campo | Resposta | Entrada do modelo |
|---|---|---|
| Idade (anos completos) | inteiro | idade_anos |
| Sexo | Masculino, Feminino | sexo (M, F) |
| Peso (kg) | decimal | peso |
| Náusea, Vômito, Febre, Disúria | Sim, Não | nausea, emese, febre, disuria |
| Dor à palpação em FID, Dor difusa à palpação | Sim, Não | ped_dor_fid, ped_dor_difusa |
| Nível hidroaéreo em FID, Nível hidroaéreo difuso | Sim, Não, Não realizado | ped_rx_nivel_fid, ped_rx_nivel_difuso (Não realizado vira faltante) |
| Leucócitos | decimal, com unidade | leucocitos |
| Neutrófilos | decimal, com unidade | neutrofilos |
| PCR | decimal, com unidade | pcr |
| Leucócitos na urina (por campo) | decimal | leucocitos_urina |

As quatro derivadas saem dos valores já convertidos, com `>` estrito, como em `construir_X` (`app/streamlit_app.py:179`) e `src/config.py:60-63`: leucocitose se leucócitos > 10.000/mm³, neutrofilia se neutrófilos > 7.500/mm³, pcr_alterado se PCR > 5,0 mg/dL, leucocituria se urina > 10 por campo.

Raio X: os dois campos precisam de resposta, e "Não realizado" é resposta válida que vira faltante. Campo em branco mostra "Preencha este campo" [Decidido S4]. Marcar "Não realizado" num campo marca o outro, e marcar Sim ou Não num deles limpa o "Não realizado" do outro, que passa a pedir resposta [Decidido S3].

### 5.2 Números

1. Campo de texto com `inputmode="decimal"`, nunca `type="number"`, que recusa vírgula em parte dos navegadores [Padrão].
2. Aceita dígitos com no máximo um separador decimal, vírgula ou ponto [Decidido, parte 1]. Não existe separador de milhar: "12.600" vira 12,6, e a faixa bloqueia [Decidido, armadilha da passagem].
3. Idade aceita só inteiro [Padrão]. "8,5" mostra a mensagem de faixa.
4. Texto que não é número (letra, sinal, dois separadores) mostra a mensagem de faixa, que já pede para conferir o número e a unidade [Padrão].

### 5.3 Unidades

| Grandeza | Unidades | Conversão para a unidade do treino |
|---|---|---|
| Leucócitos | /mm³, ×10³/µL | ×10³/µL vezes 1.000 |
| Neutrófilos | /mm³, ×10³/µL, % | ×10³/µL vezes 1.000, e % vezes leucócitos /mm³ dividido por 100 |
| PCR | mg/dL, mg/L | mg/L dividido por 10 |
| Temperatura (só Alvarado) | °C, °F | (°F menos 32) vezes 5/9 |

1. Depois da conversão, leucócitos e neutrófilos são arredondados ao inteiro, e a PCR a duas casas em mg/dL [Padrão]. Observado: no treino, leucócitos e neutrófilos são inteiros em 639 de 639 valores, e a PCR tem até duas casas. O arredondamento tira o resíduo de ponto flutuante da multiplicação.
2. Unidade inicial segue o idioma [Decidido, parte 1]. Em PT, leucócitos e neutrófilos em /mm³, PCR em mg/dL e temperatura em °C. Em EN, leucócitos e neutrófilos em ×10³/µL, PCR em mg/L e temperatura em °C [Decidido S2].
3. Depois que a página carrega, a unidade nunca muda sozinha, nem quando o idioma é trocado [Padrão, regra de segurança]. Motivo: PCR de 45 digitada em mg/L viraria 45 mg/dL, dentro da faixa, e o modelo receberia um valor dez vezes maior.
4. A unidade escolhida não é guardada no aparelho (a Privacidade diz que só o idioma e a marca do questionário ficam no navegador).

### 5.4 Faixas aceitas e bloqueio

Faixas aprovadas na Q3.28, conferidas na unidade digitada, com os limites daquela unidade [Decidido Q3.28]:

| Campo | Faixa |
|---|---|
| Idade | 2 a 14 anos |
| Peso | 8 a 120 kg |
| Leucócitos | 500 a 60.000/mm³, ou 0,5 a 60 ×10³/µL |
| Neutrófilos | 0 a 50.000/mm³, ou 0 a 50 ×10³/µL, sem passar dos leucócitos, ou 0 a 100% |
| PCR | 0 a 60 mg/dL, ou 0 a 600 mg/L |
| Leucócitos na urina | 0 a 500 por campo |
| Temperatura do Alvarado | 34 a 43 °C, ou 93,2 a 109,4 °F |

Mensagens, nos textos aprovados: campo vazio, valor fora da faixa (com mínimo, máximo e unidade), idade fora de 2 a 14, neutrófilos acima dos leucócitos (comparados em /mm³), declaração desmarcada. Qualquer erro bloqueia o cálculo inteiro, inclusive um valor inválido na seção opcional [Padrão, coerente com "valor fora da faixa bloqueia o cálculo"]. O foco vai ao primeiro campo com erro.

### 5.5 Declaração

Caixa acima do Calcular, obrigatória, marcada uma vez por visita e guardada só na memória da página [Decidido Q3.24]. Visita é a página aberta. Recarregar começa visita nova.

## 6. Resultado

Textos da seção 3 aprovada. Ordem: escore, frase de que o escore não é a chance de cirurgia, os dois cortes com positivo ou negativo e as métricas da validação, a faixa com a frequência, o pictograma, o aviso do raio X (só se algum campo de raio X for "Não realizado") e as três linhas visíveis [Decidido Q3.18 a Q3.22].

1. Escore na tela com três casas, truncado e nunca arredondado para cima: 0,5028 aparece como 0,502 [Decidido S1]. A classificação usa sempre o escore cheio, nunca o número mostrado. Teste nos limites 0,358 e 0,503 e nos vizinhos de ponto flutuante.
2. Pictograma de 10 por 10 quadrados. Quadrados cheios: o percentual da faixa arredondado ao inteiro, que dá 1, 11 e 52 [Padrão]. Desenhado com elementos da própria página, sem imagem externa.
3. Percentuais com uma casa, vírgula em PT e ponto em EN: 0,8%, 11,4% e 51,5%.
4. Alvarado e PAS, quando completos, aparecem ao lado do escore do modelo (seção 7).
5. Calcular de novo, depois de mudar um campo, refaz o resultado. Cada resultado mostrado conta um evento "calculou".
6. Ao fechar ou recarregar, tudo some. Nada é guardado.

## 7. Escores de Alvarado e PAS

Seção opcional, recolhida, com os textos da seção 4 aprovada [Decidido Q3.25, Q3.26].

Itens preenchidos a partir do formulário, mostrados sem edição e atualizados quando o formulário muda [Padrão]:

| Item | Alvarado | PAS | Regra |
|---|---|---|---|
| Náusea ou vômito | 1 | 1 | náusea Sim ou vômito Sim |
| Dor à palpação em FID | 2 | 2 | campo do formulário |
| Leucócitos | 2 se > 10.000/mm³ | 1 se >= 10.000/mm³ | Observado nos originais (adendo 2): Alvarado "above", PAS ">=" |
| Neutrófilos | 1 se > 75% | 1 se > 7.500/mm³ | percentual digitado ou neutrófilos dividido por leucócitos vezes 100, e no PAS o limite do modelo [Decidido Q3.26] |
| Febre do PAS | | 1 | campo Febre do formulário (axilar de 37,8 °C ou mais) [Decidido Q3.26] |

Itens perguntados na seção:

| Item | Alvarado | PAS |
|---|---|---|
| Migração da dor para a FID (uma pergunta, vale para os dois) | 1 | 1 |
| Anorexia (e acetona na urina, no Alvarado) | 1 | 1 | 
| Descompressão brusca dolorosa | 1 | |
| Dor em FID à tosse, à percussão ou ao saltar | | 2 |
| Temperatura medida, °C ou °F, ponto se 37,3 °C ou mais | 1 | |

1. "Anorexia" é perguntada uma vez e vale para os dois escores. "Acetona na urina" (EN "Urinary acetone") é perguntada só no bloco do Alvarado, que pontua se qualquer uma das duas for Sim [Decidido S6]. Esse texto curto entra em `textos.js`.
2. Temperatura em °F convertida para °C e arredondada a uma casa antes de comparar com 37,3 °C, para que 99,1 °F pontue como diz o texto aprovado [Decidido S5]. Teste com 99,0, 99,1 e 99,2 °F.
3. O total de cada escore só aparece com todos os itens dele respondidos. Faltando item, aquele escore não aparece [Padrão, coerente com "responda os demais para ver o total"].
4. Categorias e origem de cada artigo, do texto aprovado. Alvarado abaixo de 5 mostra que o artigo não define categoria.
5. Os valores da seção ficam no aparelho, como o resto do formulário.

## 8. Idiomas e textos

1. Um endereço só [Decidido, parte 1]. Ordem de escolha do idioma: `?lang=en` ou `?lang=pt` na URL, depois o idioma guardado no aparelho, depois o idioma do navegador (inglês se `navigator.languages[0]` começa com "en", português nos demais casos) [Decidido, parte 1, com a precedência como Padrão].
2. O botão PT | EN grava `apendisite.idioma` no `localStorage`, com o aviso ao lado [Decidido Q3a]. O `?lang` vale para a visita e não grava [Padrão].
3. A troca de idioma redesenha os textos, mantém o que foi digitado e não mexe nas unidades (seção 5.3).
4. `textos.js` tem um objeto PT e um EN com as mesmas chaves, copiados dos textos aprovados em 19/10. Teste confere chaves iguais, nenhum texto vazio e nenhum travessão. Mudança de texto depois da aprovação passa pelo Wilson.
5. Números exibidos com vírgula decimal em PT e ponto em EN, e separador de milhar como no texto aprovado (10.000 em PT, 10,000 em EN).
6. Lista de países do questionário: códigos ISO 3166-1 fixos no código, com o nome no idioma da página dado pelo próprio navegador (`Intl.DisplayNames`), Brasil no topo [Padrão]. Nenhum arquivo de terceiro.
7. A Privacidade usa o mesmo mecanismo de idioma.
8. Sem JavaScript, a página mostra, nos dois idiomas, que a calculadora precisa de JavaScript [Padrão]. Texto a aprovar junto com o plano B.
9. "Como citar" usa o DOI da versão. O rodapé usa o DOI do conceito [Decidido Q4.14]. Os dois DOIs vivem só em `textos.js`, fora dos arquivos que vão ao Zenodo, para que a troca do DOI não mude o pacote publicado [Padrão].

## 9. Contador, questionário e nota de utilidade

### 9.1 Comportamento na página

1. Ao abrir a calculadora, a página envia um evento "abriu". A cada resultado mostrado, um "calculou". O corpo leva só o tipo de evento e o idioma [Decidido Q1a, Q14b]. A Privacidade não conta abertura.
2. Erro ou 429 no contador é ignorado em silêncio. O cálculo nunca depende do servidor.
3. Convite do questionário abaixo do primeiro resultado da visita, se o aparelho não tem a marca de "já respondeu" [Decidido Q3.7a, Q13a]. "Agora não" esconde o convite até o fim da visita.
4. "Responder" e o link fixo do rodapé abrem a tela de participação num diálogo sobre a página. A calculadora fica intacta por trás [Padrão].
5. A tela de participação exige a caixa de elegibilidade, que não é gravada [Decidido Q3.5a]. "Começar" abre as 13 perguntas no mesmo diálogo. Todas são obrigatórias. Faltando resposta, a mensagem "Preencha este campo" aparece na pergunta.
6. Envio bem-sucedido grava `apendisite.sus_respondido` no `localStorage` e mostra o agradecimento [Decidido Q13a]. A marca esconde o convite e não bloqueia nada. O link do rodapé continua aberto.
7. Falha no envio mostra a mensagem de erro aprovada e mantém as respostas no diálogo para nova tentativa.
8. Com a marca presente, a pergunta de utilidade aparece abaixo do primeiro resultado de cada visita [Decidido Q17a]. Notas de 0 a 10 e "Foi só um teste" enviam e mostram "Obrigado". "Pular" não envia. Falha no envio é ignorada em silêncio [Padrão].
9. Estado da visita (declaração, convite dispensado, utilidade já perguntada) fica só na memória da página [Padrão]. No `localStorage` ficam só as duas chaves que a Privacidade descreve.
10. Chave de ligar e desligar o questionário, `QUESTIONARIO_ATIVO`, em `app.js`. Desligada, somem o convite, o link do rodapé e a pergunta de utilidade, e o contador continua [Decidido Q16a]. Quando decidir [Padrão: 22/10 às 18:00, junto com o plano B].

### 9.2 API

Rotas, todas com JSON e corpo de no máximo 2 KB:

| Método e rota | Corpo | Grava | Resposta |
|---|---|---|---|
| POST /api/evento | `{evento: "abriu" ou "calculou", idioma}` | soma 1 em contagem | 204 |
| POST /api/sus | `{idioma, itens: 10 inteiros de 1 a 5, area, pais, usaria, site}` | linha em resposta_sus | 201 |
| POST /api/utilidade | `{idioma, nota: 0 a 10 ou "teste"}` | linha em nota_utilidade | 201 |
| GET /api/saude | nenhum | nada (lê `SELECT 1`) | 200 `{ok: true}` |

1. Validação no servidor [Decidido Q13a]: chaves exatas, tipos e valores da lista. Qualquer desvio dá 400, sem ecoar o corpo.
2. Campo-isca `site`, escondido na página [Decidido Q13a]. Preenchido, o servidor responde 201 e não grava.
3. Pedido com cabeçalho `Origin` diferente de `https://apendisite.com.br` dá 403 [Padrão].
4. País do contador e da nota: `request.cf.country`, ou "XX" se ausente [Decidido Q14b, Q17a]. País do SUS: o declarado na pergunta [Decidido Q6a].
5. Dia em horário de Brasília, `AAAA-MM-DD` [Padrão].
6. O código do Worker nunca lê `CF-Connecting-IP`, `X-Forwarded-For` nem `X-Real-IP`. Um teste procura esses nomes no código e reprova se achar [Padrão].
7. Rota desconhecida em `/api/` dá 404, e método errado dá 405.
8. As respostas do Worker levam os mesmos cabeçalhos de segurança dos arquivos estáticos (seção 10).

### 9.3 Banco D1 (`migrations/0001_inicial.sql`)

```sql
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
  -- item2 a item10 iguais
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

1. O contador soma numa linha por dia, evento, idioma e país, em vez de uma linha por evento [Padrão]. Guarda o mesmo que a Q14b e não deixa ligar, pela ordem de gravação, um "calculou" a uma nota de utilidade.
2. O SUS guarda dia e idioma, além das respostas [Padrão]. A pontuação (ímpares menos 1, 5 menos pares, soma vezes 2,5) é feita na análise, não no banco.
3. Retenção: respostas até 5 anos depois da publicação, contagens sem prazo [Decidido Q12a]. Fica no runbook.
4. Backup por `wrangler d1 export apendisite --remote --output` em `~/Documents/apendisite-backups/`, semanal até 30/11 e mensal depois, fora do Git [Decidido Q4.11].

## 10. Segurança, privacidade e proibição de script de terceiro

1. Nenhum script, folha de estilo, fonte ou imagem de outro domínio [Decidido, parte 2]. Fonte do sistema operacional, sem arquivo de fonte [Padrão]. Logo e favicon do brand pack servidos pelo próprio site. Links para doi.org, zenodo.org e o `mailto:` são só links.
2. Web Analytics da zona desligado e Bot Fight Mode desligado [Decidido Q2c, Q4.10]. Fazem parte da Fase A e são conferidos pelo script de produção.
3. Sem cookie. O site não grava cookie, e o script de produção confere que nenhuma resposta traz `Set-Cookie` [Decidido Q8a].
4. Cabeçalhos em `public/_headers`, repetidos no código do Worker para as respostas de `/api` [Padrão]. Observado na documentação: o `_headers` vale só para arquivos estáticos, não para o que o Worker gera.

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-Frame-Options: DENY
```

5. Sem estilo nem script embutido no HTML, para a CSP funcionar sem `unsafe-inline`.
6. HSTS sem `preload`, que é difícil de desfazer [Padrão].
7. Limite de pedidos: uma regra, caminho começando com `/api/`, 50 pedidos em 10 s por IP, bloqueio de 10 s com 429 [Decidido Q4.10]. Não verificado: se o painel do Free oferece "starts with" para o caminho. Se não oferecer, a mesma regra se escreve com `wildcard` em `/api/*`, que tem o mesmo efeito. Inferido: no Wi-Fi do congresso, com muita gente atrás do mesmo IP, o contador perde eventos nos picos. O cálculo não é afetado, porque os arquivos estáticos ficam fora da regra.
8. Teste de rede da página: `servidor.js` só monta corpos com as chaves da seção 9.2, e um teste reprova se algum campo do formulário entrar num corpo [Padrão].

## 11. Testes

| Suíte | O que prova | Onde roda | Publicada |
|---|---|---|---|
| Python, exportação | estrutura conferida, JSON determinístico, avaliador em Python puro a partir do JSON igual ao sklearn | Mac do Wilson | sim |
| Paridade sintética | cerca de 2.000 casos, JS contra sklearn | Mac, antes de cada deploy | sim, casos e resultados esperados [Decidido Q4.6] |
| Paridade das 659 | JS contra sklearn nos dados reais, com faltantes e menores de 2 anos | só local [Decidido Q4.6] | só o resumo agregado |
| JS, entrada | leitura de vírgula e ponto, unidades, arredondamento, faixas, mensagens, derivadas com `>` estrito, raio X | Mac | sim |
| JS, resultado | cortes em `>=`, faixas, formato do escore nos limites (0,358 e 0,503 e os vizinhos de ponto flutuante), pictograma | Mac | sim |
| JS, escores | Alvarado e PAS item a item, limites de 10.000, 75%, 7.500 e 37,3 °C | Mac | sim |
| JS, textos | chaves iguais em PT e EN, nada vazio, nenhum travessão | Mac | sim |
| JS, página | nenhum recurso de outro domínio no HTML, nenhum estilo ou script embutido | Mac | sim |
| Worker | validação, isca, Origin, 404 e 405, nenhum cabeçalho de IP lido, com banco falso | Mac | sim |
| API local | `wrangler dev` com D1 local e `curl` nas quatro rotas | Mac | sim |
| Produção | `scripts/conferir_producao.sh` (seção 13.3) | depois de cada deploy e às 7:30 de 23/10 | sim |

Critério das duas paridades: diferença absoluta de no máximo 1e-12 em cada caso e classificação igual nos dois cortes em 100% dos casos. O relatório diz também quantos casos batem bit a bit.

Casos sintéticos [Padrão de composição, total de cerca de 2.000 decidido]:

1. Cerca de 1.000 casos sorteados dentro das faixas aceitas, com os três valores do raio X.
2. Cerca de 600 casos nos limiares das árvores: para cada variável contínua, o float32 logo abaixo e logo acima de uma amostra dos limiares usados. É o teste que pega a falta do `Math.fround` (lição de `2026-10-15-paridade-validada-so-no-caso-facil.md`: varrer além do caso fácil).
3. Cerca de 200 casos nos limites das derivadas (10.000 e 10.001, 7.500 e 7.501, 5,0 e 5,01, 10 e 10,1) e das faixas aceitas.
4. Cerca de 200 casos com padrões de faltante fora do raio X, para provar a imputação geral do motor.
5. Semente fixa, gravada no arquivo. O gerador e o arquivo vão juntos ao Zenodo.

Paridade das 659: `run.py paridade-local --dados ~/Documents/apendicite/data/processed` lê os `.pkl` pelo caminho, passa as 19 colunas como o modelo as viu (inclusive as derivadas faltantes), chama `scripts/avaliar_lote.mjs` com arquivos numa pasta temporária apagada ao fim e grava em `docs/paridade_659.md` só agregados: n, faltantes por padrão, diferença máxima, discordâncias por corte, data e SHA-256 do JSON.

Comandos: `node --test tests/js/` e `python3 -m pytest` (convenção 8). O `RELATORIO_TESTES.md` traz a contagem que bate com a suíte.

## 12. Pacote do Zenodo

Upload manual, DOI reservado no rascunho, versão 1.0.0, tipo Software, CC BY 4.0, criadores Bruna, Wilson e Erika com ROR da UNESP e ORCID pelo nome, idiomas por e eng, publicação só com o OK do Wilson na hora [Decidido Q3.11, Q4.5, Q4.13].

Arquivos [Decidido Q4.6, organização como Padrão]:

1. `random_forest.joblib`, com o SHA-256 no README e no model card.
2. `random_forest_v1.0.0.json`.
3. `apendisite-1.0.0-codigo.zip`: `modelo.js`, `entrada.js`, `escores.js`, o pacote Python de conversão, `run.py`, `requirements-conversao.txt`, `scripts/avaliar_lote.mjs` e os testes de paridade sintética. O Zenodo não aceita pastas, por isso o zip.
4. `casos_sinteticos_v1.0.0.json`, com entradas e resultados esperados.
5. `MODEL_CARD.md`, com o resumo agregado da paridade das 659.
6. `README.md`.
7. `LICENSE`, texto da CC BY 4.0.

Ordem em 22/10:

1. Congelar o código e criar a tag `v1.0.0`. O README já leva o DOI reservado.
2. Gerar o pacote a partir da tag e listar o SHA-256 de cada arquivo.
3. Mostrar README e model card ao Wilson. Os dois em inglês, com título e descrição do registro em português e inglês nos metadados [Decidido S7].
4. O Wilson sobe os arquivos, confere e publica.
5. Anotar o DOI do conceito, pôr no rodapé, fazer o deploy e a tag de deploy.

Inferido: o DOI do conceito só existe depois da primeira publicação, porque a documentação diz que os dois DOIs são registrados nesse momento e a página de reserva cita um DOI só (agente de leitura, 19/10). O passo 5 cobre isso.

Ponto pendente que atinge o rodapé e o registro: a agência do PDPG (CAPES, a confirmar com a Bruna, Q3.29 b).

## 13. Deploy, runbook, conferência de produção e plano B

### 13.1 Deploy

1. Antes: `node --test tests/js/`, `python3 -m pytest` e a paridade sintética verdes.
2. Commit, tag `deploy-AAAAMMDD-HHMM` e `npx wrangler deploy`, nessa ordem [Decidido Q4.9, formato da tag como Padrão]. A tag `v1.0.0` marca o pacote do Zenodo.
3. Depois: `scripts/conferir_producao.sh`.
4. Para voltar atrás: deploy da tag anterior, que é o caminho preferido. `wrangler rollback` existe e volta à versão anterior em todas as rotas (Observado na documentação), mas não está dito se restaura também os arquivos estáticos (Não verificado).
5. Uma vez, na fase de código: `wrangler d1 create`, `wrangler d1 info --json` (região anotada no runbook), `wrangler d1 migrations apply --remote`, regra de limite, registro proxiado do `www` com a Redirect Rule.

### 13.2 Runbook

`docs/RUNBOOK.md`, uma página, com os seis campos da skill `runbook` [Decidido, convenção 18]: o que é e quem usa, como rodar localmente (`npm install`, `npx wrangler dev`, D1 local), onde ficam as contas (Cloudflare apendisite, Zenodo, registro.br, Gmail do `contato@`, sem segredo no repositório), deploy e plano B, quem chamar (Wilson, e a Bruna como Administrator depois de 23/10, Q4.12), modos de falha conhecidos (Web Analytics religado inserindo script, 429 no Wi-Fi do congresso, D1 fora do ar sem afetar o cálculo, deploy na conta errada, unidade da PCR, troca de servidores DNS e DNSSEC, fim do "Enviar como" do Gmail em janeiro de 2027).

### 13.3 `scripts/conferir_producao.sh`

Só leitura, sem POST, para não sujar o contador. Cada linha sai como PASSOU, FALHOU ou NÃO CONFERIDO, e o script termina com erro se houver FALHOU [Padrão, lição de `2026-10-15-checagem-de-paridade-antes-do-estudo.md`].

1. `https://apendisite.com.br/` dá 200 e traz a versão do modelo.
2. `https://www.apendisite.com.br/qualquer` dá 301 para `https://apendisite.com.br/qualquer`.
3. `http://apendisite.com.br/` redireciona para https.
4. Pedido como navegador (`Accept: text/html` e User-Agent real) não traz script de outro domínio, nem `cloudflareinsights` (lição de `2026-09-29-cloudflare-insere-script-de-analytics-no-site-publicado.md`).
5. Nenhum `Set-Cookie` em `/`, `/privacidade/`, no JSON do modelo e em `/api/saude`.
6. Os oito cabeçalhos da seção 10, com a CSP exata.
7. `/api/saude` dá 200 com `{"ok":true}`.
8. O JSON do modelo dá 200, e o SHA-256 bate com o do model card.
9. `/privacidade/` dá 200.
10. O endereço `workers.dev` do Worker não serve o site (NÃO CONFERIDO se o subdomínio da conta não for informado).
11. `dig` mostra o apex na Cloudflare e os três MX do Email Routing.
12. O DOI da versão resolve para o Zenodo (NÃO CONFERIDO antes de publicar).

No fim, o script imprime a lista manual: QR lido no iPhone e no Android, um caso sintético calculado na tela com o escore esperado, troca PT e EN, e-mail de teste para `contato@` recebido no Gmail.

### 13.4 Plano B

1. Decisão em 22/10 às 18:00 [Decidido Q4.2]. Critério [Padrão]: segue a calculadora se as duas paridades passaram, se o `conferir_producao.sh` passou depois do último deploy e se o QR abriu o site nos dois celulares. Faltando qualquer um, entra o plano B.
2. O plano B é a pasta `plano-b/`, pronta desde 21/10: página estática, sem JavaScript, com título, autores, resumo, Zenodo e contato, no mesmo endereço [Decidido Q4.2]. Conteúdo montado só com blocos aprovados (cabeçalho, seção 8 "Como o modelo foi feito", autoria, como citar e contato), em PT e depois EN na mesma página [Decidido S8]. O aviso de que a calculadora precisa de JavaScript é mostrado ao Wilson junto, na parte 5.
3. Deploy do plano B com uma segunda configuração, `npx wrangler deploy --config wrangler.plano-b.jsonc`, com o mesmo nome de Worker, o mesmo `account_id` e o mesmo domínio, apontando para `plano-b/` [Padrão]. Observado na documentação: o flag é `--config` (o `--assets` existe, mas está em beta). Não verificado na prática: ensaio com `--dry-run` em 21/10. Volta à calculadora com o deploy normal.
4. Sem o Zenodo publicado, a linha do Zenodo sai da página.

## 14. Calendário até 23/10

| Dia | O quê | Quem |
|---|---|---|
| Seg 19/10 | Spec aprovado e plano escrito. Em paralelo, a Fase A: conta, zona, delegação, Web Analytics e Bot Fight Mode desligados, Email Routing, rascunho do Zenodo com DOI reservado | Wilson e sessões |
| Ter 20/10 | Renomear e clonar o repositório, tirar o Streamlit. Parte 1: exportação, motor, casos sintéticos, as duas paridades. Parte 2: formulário, unidades, validação, resultado, idiomas | Wilson roda, eu escrevo |
| Qua 21/10 | Parte 3: Alvarado e PAS. Parte 4: Worker, D1, questionário, utilidade. Parte 5: cabeçalhos, plano B, runbook, `conferir_producao.sh`. Primeiro deploy, regra de limite, `www` | Wilson roda, eu escrevo |
| Qui 22/10 | Pacote do Zenodo e publicação com o OK do Wilson. DOIs no site e deploy final. QR no iPhone e no Android. E-mail de teste. 18:00: calculadora ou plano B, e questionário ligado ou não. Logo depois, apagar o app do Streamlit Cloud [Decidido S9] | Wilson |
| Sex 23/10 | 7:30: `conferir_producao.sh` e lista manual. 8:00: tema livre | Wilson |
| Depois | Backups do D1, DNSSEC religado, Bruna como Administrator e no Zenodo | Wilson |

Cada parte termina com teste verde e confirmação do Wilson antes da seguinte (convenção 6).

## 15. Riscos e armadilhas

1. Corte arredondado troca resultado. Por isso 0,503 e 0,358 como decididos e o escore comparado cheio (passagem, seção 6).
2. PCR em mg/L sem conversão entra dez vezes maior. Seletor de unidade, faixa e unidade que nunca muda sozinha (seção 5.3).
3. "12.600" vira 12,6 e é bloqueado pela faixa.
4. Falta do `Math.fround` muda escores em até 0,002 (Observado na sonda). Coberto pelos casos nos limiares.
5. A Cloudflare pode inserir script na entrega a navegador. Coberto pelo item 4 do script de produção.
6. Os números do site diferem do manuscrito e dos slides (0,742 contra 0,76, ficha D3). Já tratado nos textos.
7. O JPS rejeitou o artigo em 03/10/2026. O site não cita o artigo (Q3.27).
8. Wi-Fi do congresso e a regra de 50 pedidos em 10 s: perda de contagem nos picos, sem efeito no cálculo.
9. Deploy na conta da Leviva por engano. Coberto pelo `account_id` no `wrangler.jsonc`.
10. Rede do hospital intercepta TLS: `pip` e `npm` podem falhar com certificado. Rodar de outra rede ou com os certificados do sistema (`node --use-system-ca`).

## 16. Perguntas para o Wilson (decididas em 19/10/2026)

O Wilson aprovou as nove recomendações em 19/10/2026. O texto abaixo fica como registro do motivo de cada uma.

S1. Formato do escore na tela. Recomendo três casas, truncadas e nunca arredondadas para cima: 0,5028 aparece como 0,502 e sai negativo no corte 0,503. Com duas casas, como no exemplo aprovado (0,62), o número mostrado pode contradizer o corte: 0,5031 aparece como 0,50 e sai positivo no 0,503. Só três casas truncadas evitam a contradição com cortes de três casas.

S2. Unidades iniciais por idioma. Recomendo PT com /mm³, /mm³, mg/dL e °C, e EN com ×10³/µL, ×10³/µL, mg/L e °C. A PCR em mg/dL em PT segue o laboratório do HC-FMB, onde o modelo foi treinado. O °C em EN serve a quem usa inglês fora dos Estados Unidos, e o °F continua no seletor.

S3. "Não realizado" num campo do raio X só. Recomendo que um puxe o outro: marcar "Não realizado" num campo marca o outro, e marcar Sim ou Não num deles limpa o "Não realizado" do outro, que precisa de resposta. Alternativa: campos independentes, como o modelo aceita (no treino, 55 faltantes em FID e 54 no difuso).

S4. Raio X obrigatório. Minha leitura da decisão da parte 1: os dois campos precisam de resposta, e "Não realizado" é resposta válida que vira faltante. Campo em branco mostra "Preencha este campo". Confirma?

S5. Temperatura do Alvarado em °F. O texto aprovado diz "37,3 °C (99,1 °F) ou mais", mas 99,1 °F são 37,28 °C, abaixo de 37,3. Recomendo converter para °C e arredondar a uma casa antes de comparar, para que 99,1 °F pontue como o texto promete. Alternativa: comparar sem arredondar e mudar o texto para 99,2 °F.

S6. Anorexia e acetona. O Alvarado pontua "anorexia ou acetona na urina", e o PAS só "anorexia". Recomendo perguntar "Anorexia" uma vez, valendo para os dois, e "Acetona na urina" só no bloco do Alvarado, que pontua se qualquer um for Sim. Isso pede um texto novo curto (PT "Acetona na urina", EN "Urinary acetone"). Alternativa: uma pergunta em cada bloco, como está no texto, e a pessoa responde anorexia duas vezes.

S7. Idioma do README e do model card do Zenodo. Recomendo inglês nos dois arquivos, com título e descrição do registro em português e inglês nos metadados. Em 22/10 isso deixa um texto só para você aprovar, em vez de dois.

S8. Conteúdo do plano B. Recomendo montar só com blocos já aprovados (cabeçalho, seção 8 "Como o modelo foi feito", autoria, como citar e contato), em PT e depois EN na mesma página, sem JavaScript. O aviso de "precisa de JavaScript" da página principal entra na mesma aprovação.

S9. Quando apagar o app do Streamlit Cloud. Recomendo logo depois da decisão de 22/10 às 18:00, para que em 23/10 só exista uma calculadora pública com os cortes da derivação. O app antigo usa 0,517 e 0,441 e o rótulo "Probabilidade predita de cirurgia" em percentual.

## 17. Padrões adotados (aprovados com o spec em 19/10/2026)

1. `account_id` fixo no `wrangler.jsonc` e logs persistentes do Worker desligados (seção 2).
2. JavaScript puro, sem build, testes com `node --test`, só o `wrangler` como dependência (seção 3).
3. Clone em `~/Documents/apendisite` (seção 3).
4. Leucócitos e neutrófilos arredondados ao inteiro e PCR a duas casas depois da conversão. Unidade que nunca muda sozinha (seção 5.3).
5. Idade só inteira. Texto inválido mostra a mensagem de faixa. Erro na seção opcional bloqueia o cálculo (seção 5).
6. Pictograma com 1, 11 e 52 quadrados cheios (seção 6).
7. Itens comuns do Alvarado e do PAS sem edição, total só com o escore completo (seção 7).
8. Precedência do idioma: URL, aparelho, navegador. `?lang` não grava (seção 8).
9. Nomes de países pelo próprio navegador (seção 8).
10. DOIs só em `textos.js` (seção 8).
11. Contador somado por dia, evento, idioma e país. SUS com dia e idioma. Dia em horário de Brasília (seção 9).
12. Diálogo sobre a página para o questionário. Falha da nota de utilidade em silêncio (seção 9).
13. `GET /api/saude`, recusa de `Origin` estranho e teste que proíbe ler cabeçalho de IP (seção 9).
14. Cabeçalhos e CSP da seção 10, HSTS sem `preload`, fonte do sistema.
15. Composição dos casos sintéticos (seção 11).
16. Zip do código no Zenodo e tags `v1.0.0` e `deploy-AAAAMMDD-HHMM` (seções 12 e 13).
17. Critério da decisão das 18:00 e chave do questionário decidida na mesma hora (seção 13.4).
