# CryChat — referência de design (Stitch)

Projeto Stitch: **CryChat MVP** (`4868395317408477068`).

- Design system gerado: **Obsidian Pulse** (`assets/09ab5d28a3da4edfacbce148fc70bccd`)
- Tela mobile de referência: **CryChat - Conversational E-Commerce** (`cf9339a6986342fcb282e3b3db27721b`)

Telas geradas alinhadas ao tema do Cry Console / CryChat:

- Fundo `#13131b`, primary `#8234e9`, secundária `#02c793`
- Tipografia: Inter (corpo) e Plus Jakarta Sans (títulos)
- Chat mobile first + layout hybrid desktop (vitrine + painel de IA à direita)

A implementação React vive em `src/frontend/components` (Atomic Design) e espelha esses layouts nos templates `ChatTemplate` e `AdminTemplate`.
