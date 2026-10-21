# Como contribuir

1. Abrir um branch a partir da `main` com o nome `tipo/descricao-curta` (por exemplo `fix/faixa-da-pcr`). Tipos: `feat`, `fix`, `docs`, `chore`, `refactor` e `test`.
2. Escrever os commits em Conventional Commits, em português, com o verbo no infinitivo e sem ponto final (`feat: adicionar ...`). Um commit por unidade lógica.
3. Selecionar os arquivos com `git add caminho/do/arquivo`, nunca com `git add .`.
4. Antes de abrir o PR, rodar `npm test` e `./.venv/bin/python -m pytest`, os dois verdes.
5. Abrir o PR pelo template, com o porquê da mudança. A mesclagem é por merge commit.
6. Texto novo ou mudança de texto no site só entra com aprovação do Wilson. Os textos aprovados estão em `docs/textos_aprovados.md`, e os testes conferem a cópia palavra por palavra.
7. Nenhum dado de paciente entra no repositório. Os `.pkl` ficam fora do Git, e a paridade nas 659 crianças sai só em agregado (`docs/paridade_659.md`).
8. Sem travessão em texto, código, comentário ou documento.
