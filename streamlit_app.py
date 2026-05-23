"""Streamlit app — apoio à decisão em suspeita de apendicite pediátrica.

Carrega o Random Forest treinado, recebe os dados do paciente via formulário,
exibe a probabilidade predita com contexto de cutoffs (Youden + alta sensibilidade)
e opcionalmente loga cada predição em uma Google Sheet.

Para rodar localmente:
    cd ~/Documents/apendicite
    source .venv/bin/activate
    pip install -r app/requirements.txt
    streamlit run app/streamlit_app.py
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

# ---------------------------------------------------------------------------
# Caminhos e configuração da página
# ---------------------------------------------------------------------------

APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
MODEL_PATH = PROJECT_ROOT / "models" / "random_forest.joblib"

CUTOFF_YOUDEN = 0.517
CUTOFF_ALTA_SENS = 0.441

st.set_page_config(
    page_title="Será que é Apendicite?",
    page_icon="🩺",
    layout="centered",
)


# ---------------------------------------------------------------------------
# Carregamento do modelo (com cache)
# ---------------------------------------------------------------------------

@st.cache_resource
def carregar_modelo():
    return joblib.load(MODEL_PATH)


@st.cache_resource
def conectar_gsheet():
    """Tenta conectar à planilha de log. Retorna None se as credenciais
    não estiverem configuradas — app continua funcionando sem log.
    """
    try:
        import gspread
        from google.oauth2.service_account import Credentials

        creds_dict = dict(st.secrets["gcp_service_account"])
        nome_planilha = st.secrets.get("gsheet_nome", "Apendicite_Log")
        nome_aba = st.secrets.get("gsheet_aba", "predicoes")

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        client = gspread.authorize(creds)
        sheet = client.open(nome_planilha).worksheet(nome_aba)
        return sheet
    except Exception as e:
        st.session_state["_gsheet_erro"] = str(e)
        return None


# ---------------------------------------------------------------------------
# Cabeçalho
# ---------------------------------------------------------------------------

st.title("🩺 Será que é Apendicite?")
st.subheader("Apoio à decisão clínica em suspeita de apendicite pediátrica")
st.warning(
    "**Ferramenta de apoio à decisão.** A responsabilidade clínica final é do médico assistente. "
    "O modelo foi validado em coorte de Botucatu (SP) — usar com cautela em outras populações."
)

with st.sidebar:
    st.markdown("### Sobre o modelo")
    st.markdown(
        "- **Random Forest** treinado no HC-FMB-UNESP (Botucatu, SP)\n"
        "- Validado externamente no Hospital do Bairro (Botucatu, SP)\n"
        "- **AUC 0.889** (IC95% 0.843–0.924)\n"
        "- Cutoff Youden: 0.517 (sens 0.88, esp 0.76)\n"
        "- Cutoff alta sens.: 0.441 (sens 0.96, esp 0.63)\n"
    )
    st.markdown("---")
    st.markdown(
        "### Limitações\n"
        "- Não usar para predizer **complicação** (não generalizou)\n"
        "- Validado em crianças de Botucatu — recalibrar em outras populações\n"
        "- Cautela em crianças <2 anos (n insuficiente na validação)"
    )
    st.markdown("---")
    st.caption(f"Modelo: {MODEL_PATH.name}")


# ---------------------------------------------------------------------------
# Formulário
# ---------------------------------------------------------------------------

with st.form("formulario_paciente"):
    st.markdown("### Identificação (opcional)")
    paciente_id = st.text_input(
        "ID/iniciais do paciente",
        value="",
        help="Apenas para registro interno — não é obrigatório.",
    )

    st.markdown("### Dados demográficos")
    c1, c2, c3 = st.columns(3)
    idade_anos = c1.number_input("Idade (anos)", min_value=0, max_value=18, value=8, step=1)
    sexo = c2.radio("Sexo", ["M", "F"], horizontal=True)
    peso = c3.number_input("Peso (kg)", min_value=0.0, max_value=150.0, value=25.0, step=0.5)

    st.markdown("### Sintomas")
    c1, c2, c3, c4 = st.columns(4)
    nausea = c1.radio("Náusea", ["Não", "Sim"], horizontal=True, key="nausea")
    emese = c2.radio("Êmese", ["Não", "Sim"], horizontal=True, key="emese")
    febre = c3.radio("Febre", ["Não", "Sim"], horizontal=True, key="febre")
    disuria = c4.radio("Disúria", ["Não", "Sim"], horizontal=True, key="disuria")

    st.markdown("### Exame físico")
    c1, c2 = st.columns(2)
    dor_fid = c1.radio("Dor em FID", ["Não", "Sim"], horizontal=True, key="dor_fid")
    dor_difusa = c2.radio("Dor difusa", ["Não", "Sim"], horizontal=True, key="dor_difusa")

    st.markdown("### Radiografia abdominal (se realizada)")
    c1, c2 = st.columns(2)
    rx_nivel_fid = c1.radio(
        "Nível hidroaéreo em FID", ["Não realizado", "Não", "Sim"], horizontal=True, key="rx_fid"
    )
    rx_nivel_difuso = c2.radio(
        "Nível hidroaéreo difuso", ["Não realizado", "Não", "Sim"], horizontal=True, key="rx_difuso"
    )

    st.markdown("### Exames laboratoriais")
    c1, c2 = st.columns(2)
    leucocitos = c1.number_input(
        "Leucócitos (/mm³)", min_value=0, max_value=100000, value=10000, step=100
    )
    neutrofilos = c2.number_input(
        "Neutrófilos (/mm³)", min_value=0, max_value=100000, value=7000, step=100
    )
    c1, c2 = st.columns(2)
    pcr = c1.number_input("PCR (mg/dL)", min_value=0.0, max_value=100.0, value=2.0, step=0.1)
    leucocitos_urina = c2.number_input(
        "Leucócitos na urina (/campo)", min_value=0, max_value=1000, value=0, step=1
    )

    st.markdown("### Escores clínicos (opcional, para comparação)")
    c1, c2 = st.columns(2)
    alvarado = c1.number_input("Alvarado (0–10)", min_value=-1, max_value=10, value=-1, step=1,
                                help="Deixe -1 se não foi calculado.")
    pas = c2.number_input("PAS (0–10)", min_value=-1, max_value=10, value=-1, step=1,
                           help="Deixe -1 se não foi calculado.")

    submitted = st.form_submit_button("🔍 Calcular probabilidade", type="primary")


# ---------------------------------------------------------------------------
# Predição e exibição
# ---------------------------------------------------------------------------

def construir_X(form):
    sino = {"Sim": 1, "Não": 0}
    rx = {"Sim": 1.0, "Não": 0.0, "Não realizado": float("nan")}
    dados = {
        # Contínuas
        "idade_anos":         form["idade_anos"],
        "leucocitos":         form["leucocitos"],
        "neutrofilos":        form["neutrofilos"],
        "pcr":                form["pcr"],
        "leucocitos_urina":   form["leucocitos_urina"],
        "peso":               form["peso"],
        # Binárias (convertidas para float64 — mesma estratégia do treino)
        "nausea":             float(sino[form["nausea"]]),
        "emese":              float(sino[form["emese"]]),
        "febre":              float(sino[form["febre"]]),
        "disuria":            float(sino[form["disuria"]]),
        "ped_dor_fid":        float(sino[form["dor_fid"]]),
        "ped_dor_difusa":     float(sino[form["dor_difusa"]]),
        "ped_rx_nivel_fid":   rx[form["rx_nivel_fid"]],
        "ped_rx_nivel_difuso": rx[form["rx_nivel_difuso"]],
        "leucocitose":        float(form["leucocitos"] > 10000),
        "neutrofilia":        float(form["neutrofilos"] > 7500),
        "pcr_alterado":       float(form["pcr"] > 5),
        "leucocituria":       float(form["leucocitos_urina"] > 10),
        # Categórica
        "sexo":               form["sexo"],
    }
    return pd.DataFrame([dados])


if submitted:
    modelo = carregar_modelo()
    form = {
        "idade_anos": idade_anos, "sexo": sexo, "peso": peso,
        "nausea": nausea, "emese": emese, "febre": febre, "disuria": disuria,
        "dor_fid": dor_fid, "dor_difusa": dor_difusa,
        "rx_nivel_fid": rx_nivel_fid, "rx_nivel_difuso": rx_nivel_difuso,
        "leucocitos": leucocitos, "neutrofilos": neutrofilos,
        "pcr": pcr, "leucocitos_urina": leucocitos_urina,
    }
    X = construir_X(form)
    prob = float(modelo.predict_proba(X)[0, 1])

    st.markdown("---")
    st.markdown("## 📊 Resultado")
    st.metric("Probabilidade predita de cirurgia", f"{prob * 100:.1f}%")
    st.progress(prob)

    # Interpretação dos cutoffs
    classe_youden = "✅ POSITIVO" if prob >= CUTOFF_YOUDEN else "❌ Negativo"
    classe_sens = "✅ POSITIVO" if prob >= CUTOFF_ALTA_SENS else "❌ Negativo"

    c1, c2 = st.columns(2)
    c1.markdown(f"**Cutoff Youden ({CUTOFF_YOUDEN}):**\n\n{classe_youden}")
    c1.caption("Equilíbrio sens/esp (sens 0.88, esp 0.76)")
    c2.markdown(f"**Cutoff alta sens. ({CUTOFF_ALTA_SENS}):**\n\n{classe_sens}")
    c2.caption("Prioriza não perder caso (sens 0.96, esp 0.63)")

    # Comparação com escores se preenchidos
    if alvarado >= 0 or pas >= 0:
        st.markdown("### Escores clínicos (entrada manual)")
        comp = []
        if alvarado >= 0:
            risco_alv = "Alto" if alvarado >= 7 else "Intermediário" if alvarado >= 5 else "Baixo"
            comp.append({"Escore": "Alvarado", "Valor": alvarado, "Categoria": risco_alv})
        if pas >= 0:
            risco_pas = "Alto" if pas >= 7 else "Intermediário" if pas >= 4 else "Baixo"
            comp.append({"Escore": "PAS", "Valor": pas, "Categoria": risco_pas})
        st.table(pd.DataFrame(comp))

    # Logging em Google Sheets
    sheet = conectar_gsheet()
    if sheet is not None:
        try:
            linha = [
                datetime.now().isoformat(timespec="seconds"),
                paciente_id or "—",
                idade_anos, sexo, peso,
                nausea, emese, febre, disuria,
                dor_fid, dor_difusa,
                rx_nivel_fid, rx_nivel_difuso,
                leucocitos, neutrofilos, pcr, leucocitos_urina,
                alvarado if alvarado >= 0 else "",
                pas if pas >= 0 else "",
                round(prob, 4),
                "POS_Youden" if prob >= CUTOFF_YOUDEN else "NEG_Youden",
                "POS_AltaSens" if prob >= CUTOFF_ALTA_SENS else "NEG_AltaSens",
            ]
            sheet.append_row(linha, value_input_option="USER_ENTERED")
            st.success("✓ Predição registrada na planilha de log.")
        except Exception as e:
            st.error(f"Erro ao registrar log: {e}")
    else:
        erro = st.session_state.get("_gsheet_erro")
        if erro:
            st.info(
                "ℹ Log no Google Sheets desativado (sem credenciais configuradas). "
                "Predição válida — não foi gravada externamente."
            )
            st.caption(f"Detalhe: {erro}")
        else:
            st.info("ℹ Log no Google Sheets desativado (sem credenciais configuradas).")

    st.markdown("---")
    st.caption(
        "Modelo Random Forest — AUC 0.889 na validação prospectiva externa (n=320). "
        "Para uso em outras populações, considerar recalibração (Platt scaling)."
    )


# ---------------------------------------------------------------------------
# Créditos institucionais (sempre visíveis no rodapé)
# ---------------------------------------------------------------------------

st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; font-size: 0.85em; color: #555; line-height: 1.5;'>
    Produto da Tese de Doutorado em Cirurgia e Medicina Translacional FMB/UNESP intitulada
    <i>"Inteligência Artificial no Diagnóstico de Apendicite Aguda em Crianças"</i>
    de <b>Bruna Aliotto Nalin Tedesco</b>, orientada por
    <b>Erika Veruska Paiva Ortolan</b>.<br><br>
    Algoritmo revisado e elaboração do app por
    <b>Wilson Elias de Oliveira Junior</b>.
    </div>
    """,
    unsafe_allow_html=True,
)
