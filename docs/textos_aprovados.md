# Textos do site apendisite (parte 3), aprovados pelo Wilson em 19/10/2026

Versão de 19/10/2026. Cada bloco traz o português e logo abaixo o inglês, com o mesmo conteúdo (Q10a). Entre sinais de menor e maior estão os valores calculados pela página. Decimal com vírgula em PT e ponto em EN. Os números vêm da ficha `apendisite_parte3_ficha_fatos.md`.

## 1. Cabeçalho

PT
- Nome: apendisite
- Frase: Escore de apendicite em crianças de 2 a 14 anos, por um modelo de aprendizado de máquina desenvolvido e validado por cirurgiões pediátricos e pesquisadores da FMB/UNESP, Botucatu (SP). Ferramenta de pesquisa para médicos e estudantes de medicina.
- Botão de idioma: PT | EN. Ao lado: O idioma escolhido fica guardado neste aparelho.

EN
- Name: apendisite
- Line: Appendicitis score for children aged 2 to 14 years, from a machine learning model developed and validated by pediatric surgeons and researchers at FMB/UNESP, Botucatu, Brazil. A research tool for physicians and medical students.
- Language button: PT | EN. Next to it: Your language choice is stored on this device.

## 2. Formulário

PT
- Abertura: Preencha todos os campos. Os dados ficam neste aparelho e não são enviados a nenhum servidor.
- Paciente: Idade (anos completos), com a ajuda "De 2 a 14 anos". Sexo (Masculino, Feminino). Peso (kg).
- Sintomas, cada um com Sim e Não: Náusea. Vômito. Febre (axilar de 37,8 °C ou mais). Disúria.
- Exame físico, com Sim e Não: Dor à palpação em fossa ilíaca direita. Dor difusa à palpação.
- Radiografia simples de abdome, com a ajuda "Em pelo menos duas posições" e as opções Sim, Não e Não realizado: Nível hidroaéreo em fossa ilíaca direita. Nível hidroaéreo difuso.
- Exames laboratoriais: Leucócitos (/mm³ ou ×10³/µL). Neutrófilos (/mm³, ×10³/µL ou %). PCR (mg/L ou mg/dL). Leucócitos na urina (por campo).
- Ajuda dos números: Use vírgula ou ponto para decimal. Não use separador de milhar (12600, e não 12.600).
- Declaração, acima do botão: Declaro que sou médica, médico ou estudante de medicina e tenho 18 anos ou mais.
- Botão: Calcular
- Mensagens: Preencha este campo. | Valor fora da faixa aceita (<mín> a <máx> <unidade>). Confira o número e a unidade. | O modelo vale para crianças de 2 a 14 anos. | Os neutrófilos não podem passar do total de leucócitos. | Marque a declaração para calcular.

EN
- Opening: Complete all fields. The data stay on this device and are not sent to any server.
- Patient: Age (completed years), with the hint "From 2 to 14 years". Sex (Male, Female). Weight (kg).
- Symptoms, each with Yes and No: Nausea. Vomiting. Fever (axillary temperature of 37.8 °C [100.0 °F] or higher). Dysuria.
- Physical examination, with Yes and No: Right lower quadrant tenderness. Diffuse abdominal tenderness.
- Plain abdominal radiograph, with the hint "At least two views" and the options Yes, No and Not performed: Air-fluid level in the right lower quadrant. Diffuse air-fluid levels.
- Laboratory tests: White blood cell count (/mm³ or ×10³/µL). Neutrophils (/mm³, ×10³/µL or %). C-reactive protein (mg/L or mg/dL). Urine white blood cells (per high-power field).
- Number hint: Use a comma or a period as the decimal mark. Do not use a thousands separator (12600, not 12,600).
- Statement, above the button: I confirm that I am a physician or a medical student and that I am 18 years of age or older.
- Button: Calculate
- Messages: Complete this field. | Value outside the accepted range (<min> to <max> <unit>). Check the number and the unit. | The model applies to children aged 2 to 14 years. | Neutrophils cannot exceed the white blood cell count. | Check the statement to calculate.

Faixas aceitas (Q3.28, aprovadas em 19/10/2026), que entram no lugar de <mín> e <máx>: idade de 2 a 14 anos. Peso de 8 a 120 kg. Leucócitos de 500 a 60.000/mm³ (0,5 a 60 ×10³/µL). Neutrófilos de 0 a 50.000/mm³ (0 a 50 ×10³/µL), sem passar dos leucócitos, ou de 0 a 100%. PCR de 0 a 60 mg/dL (0 a 600 mg/L). Leucócitos na urina de 0 a 500 por campo. Temperatura do Alvarado de 34 a 43 °C (93,2 a 109,4 °F).

## 3. Resultado

Reescrita aprovada pelo Wilson em 22/10/2026. Sai a leitura de cada corte como positivo ou negativo, e os números da validação vão para a gaveta "Por trás dos números", fechada por padrão.

PT
- Escore <0,42>: <baixo|intermediário|alto>
- Nível do escore: baixo, intermediário, alto
- O escore vai de 0 a 1.
- Escore baixo: Em Botucatu, 1 de cada 100 crianças com escore baixo foi operada.
- Escore intermediário: Em Botucatu, 11 de cada 100 crianças com escore intermediário foram operadas.
- Escore alto: Em Botucatu, 52 de cada 100 crianças com escore alto foram operadas.
- Legenda do pictograma: Cada quadrado é uma criança. Os cheios são as operadas.
- Aviso, só quando a radiografia for "Não realizado": Sem raio X, este resultado não foi testado. Use com mais cautela.
- Linha visível: Ferramenta de pesquisa, validada só em Botucatu. Não substitui a avaliação clínica.
- Gaveta fechada: Por trás dos números
  - Os três grupos de escore
    1. Baixo, abaixo de 0,358: 1 de 120 crianças operada (0,8%).
    2. Intermediário, de 0,358 a 0,502: 8 de 70 (11,4%).
    3. Alto, 0,503 ou mais: 67 de 130 (51,5%).
  - Os dois cortes
  - Os limites dos grupos são os dois cortes do modelo.
    1. O corte de 0,358 foi feito para quase não deixar passar uma criança que vai ser operada. Na validação, 98,7% das operadas ficaram acima dele (sensibilidade). Entre as não operadas, 48,8% ficaram abaixo (especificidade).
    2. O corte de 0,503 equilibra os dois erros, com sensibilidade de 88,2% e especificidade de 74,2%.
  - A validação
  - 320 crianças em Botucatu (SP), de março a setembro de 2025, das quais 24% foram operadas. A AUC foi 0,89.
  - O que o modelo não faz
    1. Estima a decisão de operar. Não estima apendicite complicada.
    2. O escore não é calibrado. Em serviço com mais ou menos cirurgias, as frequências dos grupos mudam.
    3. Sem raio X, o modelo usa o achado mais comum da derivação. O desempenho sem o exame não foi testado.

EN
- Score <0.42>: <low|intermediate|high>
- Score level: low, intermediate, high
- The score ranges from 0 to 1.
- Low score: In Botucatu, 1 in every 100 children with a low score underwent surgery.
- Intermediate score: In Botucatu, 11 in every 100 children with an intermediate score underwent surgery.
- High score: In Botucatu, 52 in every 100 children with a high score underwent surgery.
- Icon array caption: Each square is one child. Filled squares are those who underwent surgery.
- Notice, only when the radiograph is "Not performed": Without a radiograph, this result was not tested. Use it with more caution.
- Visible line: Research tool, validated only in Botucatu, Brazil. It does not replace clinical assessment.
- Closed drawer: Behind the numbers
  - The three score groups
    1. Low, below 0.358: 1 of 120 children underwent surgery (0.8%).
    2. Intermediate, from 0.358 to 0.502: 8 of 70 (11.4%).
    3. High, 0.503 or higher: 67 of 130 (51.5%).
  - The two cutoffs
  - The group limits are the two cutoffs of the model.
    1. The 0.358 cutoff was set to miss almost no child who will undergo surgery. In validation, 98.7% of the children who underwent surgery scored above it (sensitivity). Among those who did not, 48.8% scored below it (specificity).
    2. The 0.503 cutoff balances the two errors, with sensitivity of 88.2% and specificity of 74.2%.
  - The validation
  - 320 children in Botucatu, Brazil, from March to September 2025, of whom 24% underwent surgery. The AUC was 0.89.
  - What the model does not do
    1. Estimates the decision to operate. It does not estimate complicated appendicitis.
    2. The score is not calibrated. In a setting with more or fewer operations, the group frequencies change.
    3. Without a radiograph, the model uses the most common finding in the derivation cohort. Performance without the exam was not tested.

## 4. Escores de Alvarado e PAS (seção opcional)

PT
- Título: Escores de Alvarado e PAS (opcional)
- Abertura: Os itens que já estão no formulário vêm preenchidos. Responda os demais para ver o total. Os totais usam as categorias dos artigos originais e não têm frequência de Botucatu.
- Alvarado (pontos entre parênteses): Migração da dor para a fossa ilíaca direita (1). Anorexia ou acetona na urina (1). Náusea ou vômito (1). Dor à palpação em fossa ilíaca direita (2). Descompressão brusca dolorosa (1). Temperatura de 37,3 °C ou mais (1), com o campo "Temperatura medida" em °C ou °F e a nota "O artigo original usa a temperatura oral". Leucócitos acima de 10.000/mm³ (2). Neutrófilos acima de 75%, desvio à esquerda (1).
- Categorias do Alvarado: 5 ou 6, compatível com apendicite. 7 ou 8, apendicite provável. 9 ou 10, apendicite muito provável. Abaixo de 5, o artigo não define categoria.
- Origem do Alvarado: Derivado em 277 pacientes de 4 a 80 anos, num hospital da Filadélfia (Estados Unidos), em 1975 e 1976.
- PAS (pontos entre parênteses): Dor em fossa ilíaca direita à tosse, à percussão ou ao saltar (2). Anorexia (1). Febre (1). Náusea ou vômito (1). Dor à palpação em fossa ilíaca direita (2). Leucócitos de 10.000/mm³ ou mais (1). Neutrofilia (1). Migração da dor para a fossa ilíaca direita (1).
- Nota de limites do PAS: O artigo original registra febre e neutrofilia como presentes ou ausentes, sem definir o limite. Usamos os do modelo: temperatura axilar de 37,8 °C ou mais e neutrófilos acima de 7.500/mm³. Outros estudos usam febre acima de 38 °C e neutrófilos acima de 75% (Simkhada et al., 2025).
- Categorias do PAS: 5 ou menos, não compatível com apendicite. 6, compatível com apendicite. 7 a 10, alta probabilidade de apendicite.
- Origem do PAS: Derivado em 1.170 crianças de 4 a 15 anos, em Southampton e Londres (Reino Unido).
- Preenchidos a partir do formulário: náusea ou vômito, dor à palpação em fossa ilíaca direita, leucócitos, neutrófilos (absoluto e percentual) e a febre do PAS. A migração da dor é perguntada uma vez e vale para os dois escores.

EN
- Title: Alvarado score and Pediatric Appendicitis Score (optional)
- Opening: Items already in the form are filled in. Answer the remaining items to see the total. Totals use the categories of the original articles and have no Botucatu frequencies.
- Alvarado (points in parentheses): Migration of pain to the right lower quadrant (1). Anorexia or urinary acetone (1). Nausea or vomiting (1). Right lower quadrant tenderness (2). Rebound tenderness (1). Temperature of 37.3 °C (99.1 °F) or higher (1), with the field "Measured temperature" in °C or °F and the note "The original article uses oral temperature". White blood cell count above 10,000/mm³ (2). Neutrophils above 75%, left shift (1).
- Alvarado categories: 5 or 6, compatible with appendicitis. 7 or 8, probable appendicitis. 9 or 10, very probable appendicitis. Below 5, the article defines no category.
- Alvarado origin: Derived in 277 patients aged 4 to 80 years at one hospital in Philadelphia, United States, in 1975 and 1976.
- PAS (points in parentheses): Right lower quadrant tenderness on coughing, percussion or hopping (2). Anorexia (1). Fever (1). Nausea or vomiting (1). Right lower quadrant tenderness (2). White blood cell count of 10,000/mm³ or higher (1). Neutrophilia (1). Migration of pain to the right lower quadrant (1).
- PAS threshold note: The original article records fever and neutrophilia as present or absent and does not define a threshold. We use the model's definitions: axillary temperature of 37.8 °C (100.0 °F) or higher and neutrophils above 7,500/mm³. Other studies use fever above 38 °C and neutrophils above 75% (Simkhada et al., 2025).
- PAS categories: 5 or less, not compatible with appendicitis. 6, compatible with appendicitis. 7 to 10, high probability of appendicitis.
- PAS origin: Derived in 1,170 children aged 4 to 15 years in Southampton and London, United Kingdom.

## 5. Convite do questionário e pergunta de utilidade

PT
- Convite, abaixo do primeiro resultado da visita: Avalie o apendisite. São 13 perguntas, em cerca de 2 minutos. Botões: Responder | Agora não
- Link fixo no rodapé: Avaliar o site
- Pergunta, para quem já respondeu, uma vez por visita e abaixo do resultado: Este site foi útil neste caso? Escala de 0 a 10, com "Nada útil" no 0 e "Muito útil" no 10. Botões extras: Foi só um teste | Pular. Depois do clique: Obrigado.

EN
- Invitation, below the first result of the visit: Rate apendisite. 13 questions, about 2 minutes. Buttons: Answer | Not now
- Fixed footer link: Rate this site
- Question, for those who already answered, once per visit and below the result: Was this site useful in this case? Scale from 0 to 10, with "Not useful at all" at 0 and "Very useful" at 10. Extra buttons: It was just a test | Skip. After the click: Thank you.

## 6. Tela de participação

PT
Título: Avaliação de usabilidade do apendisite

Esta pesquisa avalia a facilidade de uso do apendisite. São 10 afirmações da Escala de Usabilidade de Sistema (versão brasileira) e 3 perguntas sobre você, em cerca de 2 minutos.

A participação é voluntária e anônima. O questionário não pede nome, e-mail nem dado do paciente, e o site não guarda IP nem o que foi digitado na calculadora. Você pode desistir a qualquer momento antes de enviar, e nada é gravado. Depois do envio, a resposta não pode ser apagada, porque não há como saber qual é a sua.

As respostas serão analisadas em conjunto e publicadas só de forma agregada, em artigo e em congresso. Elas ficam guardadas até 5 anos depois da publicação e então são apagadas.

Depois de responder, você verá, uma vez por visita e abaixo do resultado, a pergunta "Este site foi útil neste caso?", de 0 a 10. Essa nota é gravada sem identificação, com o dia, o idioma e o país.

Pesquisa de opinião com participantes não identificáveis, dispensada de registro e avaliação pelo sistema CEP/Conep (Resolução CNS 674/2022, art. 26, I).

Responsáveis: Bruna Aliotto Nalin Tedesco, Wilson Elias de Oliveira Junior e Erika Veruska Paiva Ortolan. Contato: contato@apendisite.com.br.

Ao enviar o questionário, você concorda em participar.

- Caixa obrigatória: Sou médica, médico ou estudante de medicina e tenho 18 anos ou mais.
- Botões: Começar | Cancelar

EN
Title: apendisite usability survey

This survey assesses how easy apendisite is to use. It has the 10 statements of the System Usability Scale and 3 questions about you, and takes about 2 minutes.

Participation is voluntary and anonymous. The survey does not ask for your name, email or any patient data, and the site does not store IP addresses or what was entered in the calculator. You may stop at any time before submitting, and nothing is stored. Once submitted, a response cannot be deleted, because there is no way to tell which one is yours.

Responses will be analyzed together and published only in aggregate form, in an article and at conferences. They are kept for up to 5 years after publication and then deleted.

After you answer, you will see, once per visit and below the result, the question "Was this site useful in this case?", from 0 to 10. This rating is stored without identification, with the date, language and country.

Opinion survey with non-identifiable participants, exempt from registration and review by the Brazilian CEP/Conep research ethics system (National Health Council Resolution 674/2022, article 26, I).

Investigators: Bruna Aliotto Nalin Tedesco, Wilson Elias de Oliveira Junior and Erika Veruska Paiva Ortolan. Contact: contato@apendisite.com.br.

By submitting the survey, you agree to take part.

- Required checkbox: I am a physician or a medical student and I am 18 years of age or older.
- Buttons: Start | Cancel

## 7. Questionário

PT
- Instrução: Para cada afirmação, marque de 1 (discordo fortemente) a 5 (concordo fortemente).
  1. Eu acho que gostaria de usar esse site frequentemente.
  2. Eu achei esse site desnecessariamente complexo.
  3. Eu achei esse site fácil de usar.
  4. Eu achei que precisaria de ajuda de uma pessoa técnica para ser capaz de usar esse site.
  5. Eu achei que as várias funções desse site foram bem integradas.
  6. Eu acho que o site apresenta muita inconsistência.
  7. Eu imagino que a maioria das pessoas pode aprender a usar esse site rapidamente.
  8. Eu achei esse site muito pesado para usar.
  9. Eu me senti muito seguro usando o site.
  10. Eu precisei aprender muitas coisas antes que pudesse utilizar esse site.
- Fonte, em letra pequena: Escala de Usabilidade de Sistema, versão brasileira (Lourenço, Carmona e Lopes, 2022), com "sistema" trocado por "site".
- Sua área: Cirurgia pediátrica (especialista). Cirurgia pediátrica (residente). Cirurgia geral. Pediatria. Medicina de emergência. Medicina de família e comunidade. Generalista (sem especialidade). Outra especialidade médica. Estudante de medicina.
- País onde você trabalha ou estuda: lista completa, com o Brasil no topo.
- Você usaria o apendisite na sua prática? Sim | Talvez | Não
- Botão: Enviar
- Depois do envio: Resposta enviada. Obrigado por participar.
- Erro: Não foi possível enviar agora. Tente de novo em alguns minutos.

EN
- Instruction: For each statement, choose from 1 (strongly disagree) to 5 (strongly agree).
  1. I think that I would like to use this website frequently.
  2. I found the website unnecessarily complex.
  3. I thought the website was easy to use.
  4. I think that I would need the support of a technical person to be able to use this website.
  5. I found the various functions in this website were well integrated.
  6. I thought there was too much inconsistency in this website.
  7. I would imagine that most people would learn to use this website very quickly.
  8. I found the website very cumbersome to use.
  9. I felt very confident using the website.
  10. I needed to learn a lot of things before I could get going with this website.
- Source, in small print: System Usability Scale (Brooke, 1996), with "system" replaced by "website".
- Your field: Pediatric surgery (attending). Pediatric surgery (resident). General surgery. Pediatrics. Emergency medicine. Family medicine. General practitioner (no specialty). Other medical specialty. Medical student.
- Country where you work or study: full list, with Brazil at the top.
- Would you use apendisite in your practice? Yes | Maybe | No
- Button: Submit
- After submitting: Response submitted. Thank you for taking part.
- Error: The response could not be sent. Please try again in a few minutes.

## 8. Como o modelo foi feito (seção recolhida)

PT
O apendisite usa um random forest (500 árvores, profundidade máxima 5) treinado com 15 dados de rotina do pronto-socorro: idade, sexo, peso, náusea, vômito, febre, disúria, dor à palpação em fossa ilíaca direita, dor difusa à palpação, dois achados da radiografia simples, leucócitos, neutrófilos, PCR e leucócitos na urina. Quatro variáveis derivadas usam cortes fixos (leucócitos acima de 10.000/mm³, neutrófilos acima de 7.500/mm³, PCR acima de 5,0 mg/dL e leucócitos na urina acima de 10 por campo).

O desfecho é a decisão de operar, tomada pela equipe de cirurgia pediátrica. Na validação, as 76 crianças operadas tiveram apendicite confirmada.

A derivação incluiu 339 crianças atendidas no HC-FMB/UNESP de 2019 a 2021, das quais 176 (51,9%) foram operadas. Os dois cortes foram fixados no grupo de teste da derivação (102 crianças), antes da validação. O corte de equilíbrio (0,503) é o índice de Youden. O corte de alta sensibilidade (0,358) é o de maior especificidade com sensibilidade de pelo menos 95%.

A validação prospectiva incluiu 320 crianças em Botucatu (SP), de março a setembro de 2025, das quais 76 (23,8%) foram operadas. A AUC foi 0,89 (IC 95% 0,84 a 0,92).

EN
apendisite uses a random forest (500 trees, maximum depth 5) trained on 15 routine emergency department data points: age, sex, weight, nausea, vomiting, fever, dysuria, right lower quadrant tenderness, diffuse abdominal tenderness, two plain radiograph findings, white blood cell count, neutrophils, C-reactive protein and urine white blood cells. Four derived variables use fixed thresholds (white blood cell count above 10,000/mm³, neutrophils above 7,500/mm³, C-reactive protein above 5.0 mg/dL and urine white blood cells above 10 per high-power field).

The outcome is the decision to operate, made by the pediatric surgery team. In validation, all 76 children who underwent surgery had confirmed appendicitis.

The derivation cohort included 339 children seen at HC-FMB/UNESP from 2019 to 2021, of whom 176 (51.9%) underwent surgery. Both cutoffs were fixed in the derivation test set (102 children), before validation. The balanced cutoff (0.503) is the Youden index. The high-sensitivity cutoff (0.358) is the one with the highest specificity among those with a sensitivity of at least 95%.

The prospective validation included 320 children in Botucatu, Brazil, from March to September 2025, of whom 76 (23.8%) underwent surgery. The AUC was 0.89 (95% CI 0.84 to 0.92).

## 9. Limitações (seção recolhida)

PT
- O escore não é calibrado. Na validação, a mediana do escore foi 0,45, e 24% das crianças foram operadas.
- As frequências por faixa vêm de Botucatu. No grupo de teste da derivação, com 52% de crianças operadas, as mesmas faixas tiveram 9%, 33% e 78% de operadas.
- O modelo não estima apendicite complicada. Para esse desfecho, a AUC na validação foi 0,60 (IC 95% 0,47 a 0,73).
- Sem radiografia, o desempenho não foi validado. Na validação, só 1 das 320 crianças não tinha o exame.
- Crianças com menos de 2 anos ficam fora, porque só 2 entraram na validação.
- Em outra população, o modelo pode precisar de recalibração.

EN
- The score is not calibrated. In validation, the median score was 0.45, and 24% of the children underwent surgery.
- Band frequencies come from Botucatu. In the derivation test set, where 52% of the children underwent surgery, the same bands had 9%, 33% and 78% of children who underwent surgery.
- The model does not estimate complicated appendicitis. For that outcome, the AUC in validation was 0.60 (95% CI 0.47 to 0.73).
- Performance without a radiograph was not validated. In validation, only 1 of the 320 children had no radiograph.
- Children younger than 2 years are excluded, because only 2 entered the validation cohort.
- In another population, the model may need recalibration.

## 10. Autoria, como citar e referências

PT
- Bruna Aliotto Nalin Tedesco, MD, PhD, cirurgiã pediátrica
- Wilson Elias de Oliveira Junior, MD, PhD, cirurgião pediátrico
- Erika Veruska Paiva Ortolan, MD, PhD, cirurgiã pediátrica
- Faculdade de Medicina de Botucatu (FMB/UNESP), Botucatu (SP). Contato: contato@apendisite.com.br
- Como citar: Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Versão 1.0.0. Zenodo; 2026. doi:<preenchido na parte 4>. Resultados apresentados no 38º Congresso Brasileiro de Cirurgia Pediátrica, 2026.

EN
- Bruna Aliotto Nalin Tedesco, MD, PhD, pediatric surgeon
- Wilson Elias de Oliveira Junior, MD, PhD, pediatric surgeon
- Erika Veruska Paiva Ortolan, MD, PhD, pediatric surgeon
- Botucatu Medical School (FMB/UNESP), Botucatu, Brazil. Contact: contato@apendisite.com.br
- How to cite: Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Version 1.0.0. Zenodo; 2026. doi:<filled in part 4>. Results presented at the 38th Brazilian Congress of Pediatric Surgery, 2026.

Referências (iguais nas duas línguas)
1. Alvarado A. A practical score for the early diagnosis of acute appendicitis. Annals of Emergency Medicine. 1986;15(5):557-64. doi:10.1016/s0196-0644(86)80993-3
2. Samuel M. Pediatric appendicitis score. Journal of Pediatric Surgery. 2002;37(6):877-81. doi:10.1053/jpsu.2002.32893
3. Simkhada S, Thapa B, Basnet AT, Karki S. Pediatric appendicitis score and ultrasound in children with acute appendicitis: an observational study. Journal of Nepal Medical Association. 2025;63(282):109-13. doi:10.31729/jnma.8889
4. Lourenço DF, Carmona EV, Lopes MHBM. Tradução e adaptação transcultural da System Usability Scale para o português do Brasil. Aquichan. 2022;22(2):e2228. doi:10.5294/aqui.2022.22.2.8
5. Brooke J. SUS: a "quick and dirty" usability scale. In: Usability evaluation in industry. CRC Press; 1996. p. 207-12. doi:10.1201/9781498710411-35
6. Bhangu A, Soreide K, Di Saverio S, Assarsson JH, Drake FT. Acute appendicitis: modern understanding of pathogenesis, diagnosis, and management. The Lancet. 2015;386(10000):1278-87. doi:10.1016/S0140-6736(15)00275-5
7. The SMML, Bakx R, Budding AE, De Meij TGJ, Van Der Lee JH, Bunders MJ, et al. Microbiota of children with complex appendicitis: different composition and diversity of the microbiota in children with complex compared with simple appendicitis. Pediatr Infect Dis J. 2019;38(10):1054-60. doi:10.1097/INF.0000000000002434
8. The SMML, Schreurs RRCE, Drewniak A, Bakx R, De Meij TGJ, Budding AE, et al. Enhanced Th17 responses in the appendix of children with complex compared to simple appendicitis are associated with microbial dysbiosis. Front Immunol. 2024;14:1258363. doi:10.3389/fimmu.2023.1258363
9. Almaramhy HH. Acute appendicitis in young children less than 5 years: review article. Ital J Pediatr. 2017;43(1):15. doi:10.1186/s13052-017-0335-2
10. Jukic M, Nizeteo P, Matas J, Pogorelic Z. Trends and predictors of pediatric negative appendectomy rates: a single-centre retrospective study. Children. 2023;10(5):887. doi:10.3390/children10050887
11. Zouari M, Issaoui A, Hbaieb M, Belhajmansour M, Meddeb S, Ben Dhaou M, et al. Predictive factors of acute appendicitis in children with non-visualized appendix on ultrasound: a prospective cohort study. Surg Infect. 2024;25(1):26-31. doi:10.1089/sur.2023.295
12. Reismann J, Romualdi A, Kiss N, Minderjahn MI, Kallarackal J, Schad M, et al. Diagnosis and classification of pediatric acute appendicitis by artificial intelligence methods: an investigator-independent approach. PLOS One. 2019;14(9):e0222030. doi:10.1371/journal.pone.0222030
13. Marcinkevics R, Reis Wolfertstetter P, Wellmann S, Knorr C, Vogt JE. Using machine learning to predict the diagnosis, management and severity of pediatric appendicitis. Front Pediatr. 2021;9:662183. doi:10.3389/fped.2021.662183
14. Gollapalli M, Rahman A, Kudos SA, Foula MS, Alkhalifa AM, Albisher HM, et al. Appendicitis diagnosis: ensemble machine learning and explainable artificial intelligence-based comprehensive approach. Big Data Cogn Comput. 2024;8(9):108. doi:10.3390/bdcc8090108
15. Yazici H, Ugurlu O, Aygul Y, Ugur MA, Sen YK, Yildirim M. Predicting severity of acute appendicitis with machine learning methods: a simple and promising approach for clinicians. BMC Emerg Med. 2024;24(1):101. doi:10.1186/s12873-024-01023-9
16. Cohen J. A coefficient of agreement for nominal scales. Educ Psychol Meas. 1960;20(1):37-46. doi:10.1177/001316446002000104
17. Landis JR, Koch GG. The measurement of observer agreement for categorical data. Biometrics. 1977;33(1):159-74. doi:10.2307/2529310
18. Steyerberg EW, Vergouwe Y. Towards better clinical prediction models: seven steps for development and an ABCD for validation. Eur Heart J. 2014;35(29):1925-31. doi:10.1093/eurheartj/ehu207
19. Van Calster B, Wynants L, Timmerman D, Steyerberg EW, Collins GS. Predictive analytics in health care: how can we know it works? J Am Med Inform Assoc. 2019;26(12):1651-4. doi:10.1093/jamia/ocz130
20. Collins GS, Moons KGM, Dhiman P, Riley RD, Beam AL, Van Calster B, et al. TRIPOD+AI statement: updated guidance for reporting clinical prediction models that use regression or machine learning methods. BMJ. 2024;385:e078378. doi:10.1136/bmj-2023-078378
21. Vickers AJ, Elkin EB. Decision curve analysis: a novel method for evaluating prediction models. Med Decis Making. 2006;26(6):565-74. doi:10.1177/0272989X06295361
22. Lundberg SM, Lee SI. A unified approach to interpreting model predictions. In: Advances in Neural Information Processing Systems 30. 2017. p. 4765-74.
23. Rey R, Gualtieri R, La Scala G, Posfay Barbe K. Artificial intelligence in the diagnosis and management of appendicitis in pediatric departments: a systematic review. Eur J Pediatr Surg. 2024;34(5):385-91. doi:10.1055/a-2257-5122
24. Shikha A, Kasem A. The development and validation of artificial intelligence pediatric appendicitis decision-tree for children 0 to 12 years old. Eur J Pediatr Surg. 2023;33(5):395-402. doi:10.1055/a-1946-0157
25. Shikha A, Kasem A, Han WSP, Wong JHL. AI-augmented clinical decision in paediatric appendicitis: can an AI-generated model improve trainees’ diagnostic capability? Eur J Pediatr. 2024;183(3):1361-6. doi:10.1007/s00431-023-05390-6
26. Barthwal A, Goel AK, Chakrabarti P, Krishnan SB. Multimodal explainable AI approach to pediatric appendicitis detection: integrating clinical data and ultrasound images. Egypt Pediatr Assoc Gaz. 2026;74:38. doi:10.1186/s43054-026-00540-5
27. Marcinkevics R, Reis Wolfertstetter P, Klimiene U, Chin-Cheong K, Paschke A, Zerres J, et al. Interpretable and intervenable ultrasonography-based machine learning models for pediatric appendicitis. Med Image Anal. 2024;91:103042. doi:10.1016/j.media.2023.103042
28. Elsayed H, Singer G, Till T, Till H. Latest developments in artificial intelligence and machine learning models in general pediatric surgery. Eur J Pediatr Surg. 2026;36(2):157-64. doi:10.1055/a-2689-8280
29. Vollmer S, Mateen BA, Bohner G, Kiraly FJ, Ghani R, Jonsson P, et al. Machine learning and artificial intelligence research for patient benefit: 20 critical questions on transparency, replicability, ethics, and effectiveness. BMJ. 2020;368:l6927. doi:10.1136/bmj.l6927

## 11. Rodapé

PT: Privacidade | Avaliar o site | Contato | Modelo <versão> | Código e modelo no Zenodo
EN: Privacy | Rate this site | Contact | Model <version> | Code and model on Zenodo

PT: Apoio: CNPq (bolsa de produtividade em pesquisa 310401/2021-6 e bolsa de iniciação científica PIBIC) e CAPES (bolsa PDPG 88887.808727/2023-00).
EN: Funding: CNPq (research productivity fellowship 310401/2021-6 and PIBIC undergraduate scholarship) and CAPES (PDPG fellowship 88887.808727/2023-00).


## 12. Página Privacidade

PT
Título: Privacidade

Responsável pelo tratamento dos dados: Wilson Elias de Oliveira Junior, pessoa física. Contato: contato@apendisite.com.br.

Dados do paciente. Os valores digitados na calculadora ficam no seu aparelho. O cálculo é feito no navegador, e nenhum valor do formulário, nem o resultado, é enviado ao servidor. Ao fechar ou recarregar a página, os valores são apagados.

Contador de uso. O site conta quantas vezes foi aberto e quantos cálculos foram feitos. Cada registro tem o dia, o tipo de evento (abertura ou cálculo), o idioma e o país informado pela rede da Cloudflare. O contador não guarda IP, nome nem o que foi digitado.

Questionário e nota de utilidade. As respostas ao questionário de usabilidade e à pergunta "Este site foi útil neste caso?" são anônimas. Não pedimos nome nem e-mail e não guardamos IP. As respostas podem ser publicadas de forma agregada, em artigo e em congresso, e ficam guardadas até 5 anos depois da publicação.

Dados guardados no aparelho. O site guarda no seu navegador só o idioma escolhido e a marca de que você já respondeu ao questionário, para não mostrar o convite de novo. O site não cria cookies próprios e não usa ferramentas de análise de terceiros.

Cloudflare. O site é hospedado na Cloudflare, que é operadora dos dados de acesso. Para entregar as páginas, a Cloudflare recebe o endereço IP de quem acessa, como qualquer serviço de hospedagem, e também o usa para limitar envios repetidos do questionário. Esse IP não chega ao nosso banco de dados.

Seus direitos. Para dúvidas ou pedidos sobre seus dados, escreva para contato@apendisite.com.br. Como as respostas não têm identificação, não conseguimos localizar a resposta de uma pessoa.

EN
Title: Privacy

Data controller: Wilson Elias de Oliveira Junior, as an individual. Contact: contato@apendisite.com.br.

Patient data. The values entered in the calculator stay on your device. The calculation runs in the browser, and no form value, and no result, is sent to the server. When you close or reload the page, the values are erased.

Usage counter. The site counts how many times it was opened and how many calculations were made. Each record has the date, the event type (opening or calculation), the language and the country reported by the Cloudflare network. The counter does not store IP addresses, names or anything that was entered.

Survey and usefulness rating. Responses to the usability survey and to the question "Was this site useful in this case?" are anonymous. We do not ask for names or email addresses and do not store IP addresses. Responses may be published in aggregate form, in an article and at conferences, and are kept for up to 5 years after publication.

Data stored on your device. The site stores in your browser only the chosen language and a mark that you already answered the survey, so the invitation is not shown again. The site sets no cookies of its own and uses no third-party analytics.

Cloudflare. The site is hosted on Cloudflare, which is the processor of access data. To deliver the pages, Cloudflare receives the IP address of each visitor, as any hosting service does, and also uses it to limit repeated survey submissions. That IP address never reaches our database.

Your rights. For questions or requests about your data, write to contato@apendisite.com.br. Because responses carry no identification, we cannot locate one person's response.

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
