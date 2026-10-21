# Model card: apendisite 1.0.0

Appendicitis score for children aged 2 to 14 years, from a machine learning model developed and validated by pediatric surgeons and researchers at FMB/UNESP, Botucatu, Brazil. A research tool for physicians and medical students.

## Model details

- Random forest classifier from scikit-learn 1.8.0, with 500 trees and a maximum depth of 5.
- Stored as a scikit-learn pipeline (`models/random_forest.joblib`). The preprocessing step imputes the median for numeric inputs and the mode for binary inputs, and adds missing-value indicators. Sex is coded in a single column. The preprocessing output has 32 columns.
- On the website, the forest is exported to JSON (`public/modelo/random_forest_v1.0.0.json`) and computed in the browser by `public/js/modelo.js`. Each of the 32 columns is converted to float32 (`Math.fround`) before it is compared with the node threshold, as scikit-learn does. A node goes left when the value is less than or equal to the threshold. The score is the mean of the 500 leaf probabilities, summed in tree order.

## Intended use

1. Validated in Botucatu, Brazil, where 24% of the children underwent surgery. In another setting, the band frequencies may differ.
2. Estimates the decision to operate. It does not estimate complicated appendicitis.
3. Research tool. It does not replace clinical assessment.

## Inputs

apendisite uses a random forest (500 trees, maximum depth 5) trained on 15 routine emergency department data points: age, sex, weight, nausea, vomiting, fever, dysuria, right lower quadrant tenderness, diffuse abdominal tenderness, two plain radiograph findings, white blood cell count, neutrophils, C-reactive protein and urine white blood cells. Four derived variables use fixed thresholds (white blood cell count above 10,000/mm³, neutrophils above 7,500/mm³, C-reactive protein above 5.0 mg/dL and urine white blood cells above 10 per high-power field).

## Outcome, derivation, validation and external application

The outcome is the decision to operate, made by the pediatric surgery team. In validation, all 76 children who underwent surgery had confirmed appendicitis.

The derivation cohort included 339 children seen at HC-FMB/UNESP from 2019 to 2021, of whom 176 (51.9%) underwent surgery. Both cutoffs were fixed in the derivation test set (102 children), before validation. The balanced cutoff (0.503) is the Youden index. The high-sensitivity cutoff (0.358) is the one with the highest specificity among those with a sensitivity of at least 95%.

The prospective validation included 320 children in Botucatu, Brazil, from March to September 2025, of whom 76 (23.8%) underwent surgery. The AUC was 0.89 (95% CI 0.84 to 0.92).

Applied without retraining to two public German datasets, the model had an AUC of 0.77 in Regensburg (781 children) and 0.78 in Düsseldorf (301) for the surgical decision. This analysis was done by our group, presented at a conference and not yet published.

## Cutoffs and bands

A result is positive when the full score is greater than or equal to the cutoff. The score is never rounded before the comparison.

| Cutoff | Sensitivity in validation | Specificity in validation |
|---|---|---|
| High-sensitivity (0.358) | 98.7% | 48.8% |
| Balanced (0.503) | 88.2% | 74.2% |

| Band | Score | Children who underwent surgery in the Botucatu validation |
|---|---|---|
| Low | below 0.358 | 1 of 120 (0.8%) |
| Intermediate | from 0.358 to below 0.503 | 8 of 70 (11.4%) |
| High | 0.503 or higher | 67 of 130 (51.5%) |

## Limitations

- The score is not calibrated. In validation, the median score was 0.45, and 24% of the children underwent surgery.
- Band frequencies come from Botucatu. In the derivation test set, where 52% of the children underwent surgery, the same bands had 9%, 33% and 78% of children who underwent surgery.
- The model does not estimate complicated appendicitis. For that outcome, the AUC in validation was 0.60 (95% CI 0.47 to 0.73).
- Performance without a radiograph was not validated. In validation, only 1 of the 320 children had no radiograph.
- Children younger than 2 years are excluded, because only 2 entered the validation cohort.
- In another population, the model may need recalibration.

## Parity between the browser and scikit-learn

The acceptance criterion is an absolute difference of at most 1e-12 in every case and the same classification at both cutoffs in 100% of cases.

- Synthetic cases (`tests/dados/casos_sinteticos_v1.0.0.json`, published): 1,958 cases generated with seed 20261023 (1,000 random cases, 558 next to the split thresholds of the continuous inputs, 200 at the thresholds of the derived variables and at the ends of the accepted ranges, and 200 with missing values). Maximum difference 0, 1,958 scores identical bit for bit, zero disagreements at 0.503 and at 0.358.
- The 659 children of the derivation and validation cohorts, run locally only. No patient row is in the repository or in the Zenodo record. 174 children had at least one missing value and 7 were outside 2 to 14 years. Maximum difference 0, 659 scores identical bit for bit, zero disagreements at both cutoffs. The aggregate report is `docs/paridade_659.md`.

## Files and hashes

- SHA-256 of the JSON: `21b7e560ade3d678ff9403557f6cd3b3983e3c715659ef2ee606bf478f3f80f0` (`random_forest_v1.0.0.json`, 460,310 bytes)
- SHA-256 of the joblib: `ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858` (`random_forest.joblib`, 1,397,634 bytes)
- SHA-256 of the synthetic cases: `9a178ca8aee47b593aa67ad9ae98f8203ebf18e156f85fdfb41a3432c7f61f6d` (`casos_sinteticos_v1.0.0.json`)

## License and citation

License: Creative Commons Attribution 4.0 International (CC BY 4.0). The full text is in `LICENSE`.

How to cite: Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Version 1.0.0. Zenodo; 2026. doi:10.5281/zenodo.23474325. Results presented at the 38th Brazilian Congress of Pediatric Surgery, 2026.
