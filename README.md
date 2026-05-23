# App Streamlit — Apoio à Decisão em Apendicite Pediátrica

Aplicação web para apoio à decisão clínica em casos de suspeita de apendicite
pediátrica, baseada no modelo Random Forest validado externamente no
HC-FMB-UNESP (derivação) e Hospital do Bairro (validação), ambos em Botucatu/SP.

---

## Rodar localmente (teste)

```bash
cd ~/Documents/apendicite
source .venv/bin/activate
pip install -r app/requirements.txt
streamlit run app/streamlit_app.py
```

Abre o navegador em `http://localhost:8501`. O app funciona sem credenciais
do Google Sheets — apenas o log de predições fica desativado.

---

## Configurar log no Google Sheets (uma vez)

### 1) Criar Service Account no Google Cloud

1. Acessar https://console.cloud.google.com
2. Criar projeto (ou usar existente)
3. APIs e Serviços → Biblioteca → ativar:
   - **Google Sheets API**
   - **Google Drive API**
4. IAM → Service Accounts → criar conta
5. Na conta criada: **Chaves → Adicionar chave → JSON** → baixar arquivo

### 2) Criar a planilha de log

1. Criar uma Google Sheet nova (nome sugerido: `Apendicite_Log`)
2. Criar uma aba chamada `predicoes`
3. Inserir os cabeçalhos na primeira linha:

```
timestamp | paciente_id | idade_anos | sexo | peso | nausea | emese | febre |
disuria | dor_fid | dor_difusa | rx_nivel_fid | rx_nivel_difuso |
leucocitos | neutrofilos | pcr | leucocitos_urina | alvarado | pas |
probabilidade | classe_youden | classe_alta_sens
```

4. **Compartilhar** a planilha com o e-mail da Service Account
   (algo como `nome@seu-projeto.iam.gserviceaccount.com`) — permissão de **Editor**

### 3) Configurar credenciais no Streamlit

```bash
cp app/.streamlit/secrets.toml.example app/.streamlit/secrets.toml
```

Editar `app/.streamlit/secrets.toml` e colar o conteúdo do JSON da Service
Account na seção `[gcp_service_account]`. Ajustar `gsheet_nome` e `gsheet_aba`
se usou nomes diferentes.

**Importante**: o arquivo `secrets.toml` (sem `.example`) já está no
`.gitignore` — não vai para o repositório.

---

## Deploy no Streamlit Cloud (grátis)

### 1) Criar repositório no GitHub

```bash
cd ~/Documents/apendicite
git init
git add .
git commit -m "Initial commit — app Apendicite"
# Criar repo no GitHub (privado de preferência) e:
git remote add origin git@github.com:SEU_USUARIO/apendicite.git
git push -u origin main
```

> ⚠ Antes de commitar pela primeira vez, **revisar `.gitignore`** para garantir
> que dados de pacientes (`data/raw/*.csv`) e credenciais (`secrets.toml`) NÃO
> sejam enviados ao GitHub.

### 2) Conectar Streamlit Cloud

1. Acessar https://share.streamlit.io
2. Login com GitHub
3. New app → escolher repositório
4. Configurar:
   - **Branch**: `main`
   - **Main file path**: `app/streamlit_app.py`
   - **Requirements file**: `app/requirements.txt`
5. Em **Advanced settings → Secrets**, colar o conteúdo do
   `secrets.toml` (mesma estrutura)
6. Deploy

App ficará em `https://NOME.streamlit.app` — pode ser compartilhado com a
equipe via link.

---

## Estrutura de arquivos

```
app/
├── streamlit_app.py       ← app principal
├── requirements.txt        ← dependências
├── README.md               ← este arquivo
└── .streamlit/
    ├── secrets.toml.example   ← template das credenciais
    └── secrets.toml           ← arquivo REAL (não commitar)
```

---

## Próximos passos sugeridos

| Etapa | O que envolve |
|---|---|
| Teste interno (1-2 semanas) | Você + cirurgião usam, validam interface |
| Estudo piloto de implementação | Protocolo CEP, uso paralelo ao julgamento clínico, análise de aceitação |
| Recalibração se necessário | Platt scaling nos novos dados coletados |
| Versão institucional | Integração ao sistema do HC-FMB (futuro) |
