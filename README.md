# apendisite

Appendicitis score for children aged 2 to 14 years, from a machine learning model developed and validated by pediatric surgeons and researchers at FMB/UNESP, Botucatu, Brazil. A research tool for physicians and medical students.

Research tool. It does not replace clinical assessment.

## The calculator

https://apendisite.com.br, in Portuguese and English (`?lang=en` opens it in English).

## How the score is computed

The random forest (scikit-learn 1.8.0, 500 trees, maximum depth 5) is exported from `models/random_forest.joblib` to `public/modelo/random_forest_v1.0.0.json` and computed in the browser by `public/js/modelo.js`, with the same imputation and missing-value indicators as the Python pipeline. Each of the 32 preprocessed columns is converted to float32 (`Math.fround`) before it is compared with the node threshold, as scikit-learn does. The score is the mean of the 500 leaf probabilities.

The cutoffs are 0.358 (high sensitivity) and 0.503 (balanced). A result is positive when the full score is greater than or equal to the cutoff. The page shows the score truncated to three decimals, but the comparison always uses the full score.

Model details, validation results, bands and limitations are in [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md).

## Reproducing the parity

From the Zenodo record, unzip `apendisite-1.0.0-codigo.zip` and copy `random_forest.joblib` to `apendisite-1.0.0/models/` before running the Python steps. The repository already has it in `models/`.

```bash
/Library/Frameworks/Python.framework/Versions/3.14/bin/python3.14 -m venv .venv
./.venv/bin/python -m pip install -r requirements-conversao.txt
./.venv/bin/python run.py exportar
./.venv/bin/python run.py sinteticos
npm install
npm test
./.venv/bin/python -m pytest
```

`run.py exportar` writes the JSON model and prints its SHA-256. `run.py sinteticos` writes the 1,958 synthetic cases with the scikit-learn scores (seed 20261023). Both outputs are deterministic and match the files in the repository byte for byte. `npm test` checks that, in every synthetic case, the browser engine differs from scikit-learn by at most 1e-12 and gives the same classification at both cutoffs. In version 1.0.0, all 1,958 scores are identical bit for bit.

## Privacy

No value entered in the form, and no result, leaves the device. The site keeps an anonymous usage counter and an optional anonymous survey, described on the privacy page (https://apendisite.com.br/privacidade/). No patient data is stored in this repository.

## Files and SHA-256

| File | SHA-256 |
|---|---|
| `models/random_forest.joblib` | `ee227fb1020daa8f5121cfca00fb2ce972967795889c12b063dbefe19fb9e858` |
| `public/modelo/random_forest_v1.0.0.json` | `21b7e560ade3d678ff9403557f6cd3b3983e3c715659ef2ee606bf478f3f80f0` |
| `tests/dados/casos_sinteticos_v1.0.0.json` | `9a178ca8aee47b593aa67ad9ae98f8203ebf18e156f85fdfb41a3432c7f61f6d` |

## How to cite

Tedesco BAN, Oliveira Junior WE, Ortolan EVP. apendisite: a random forest for appendicitis in children [software]. Version 1.0.0. Zenodo; 2026. doi:10.5281/zenodo.23474325. Results presented at the 38th Brazilian Congress of Pediatric Surgery, 2026.

## Authors

- Bruna Aliotto Nalin Tedesco, MD, PhD, pediatric surgeon
- Wilson Elias de Oliveira Junior, MD, PhD, pediatric surgeon
- Erika Veruska Paiva Ortolan, MD, PhD, pediatric surgeon

Botucatu Medical School (FMB/UNESP), Botucatu, Brazil. Contact: contato@apendisite.com.br

## Funding

Funding: CNPq (research productivity fellowship 310401/2021-6 and PIBIC undergraduate scholarship) and CAPES (PDPG fellowship 88887.808727/2023-00).

## License

Creative Commons Attribution 4.0 International (CC BY 4.0). See [`LICENSE`](LICENSE).
