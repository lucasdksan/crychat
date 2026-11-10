# CryChat — guia para agentes

Monólito **Next.js 16** (App Router): SaaS de chat inteligente para e-commerce (MVP: chat + admin).

## Onde colocar código

| Intenção | Local |
|----------|--------|
| Página / layout | `src/app/` — `(public)` ou `(private)` |
| Rota HTTP | `src/app/api/...` → `src/backend/controllers/` |
| Server Action | `src/backend/controllers/` (`"use server"`) |
| Leitura server-side | `src/backend/controllers/*-query.ts` sem `"use server"` |
| Prisma por entidade | `src/backend/models/` |
| Domínio (DDD) | `src/backend/modules/<domínio>/` |
| Utilitário backend | `src/backend/lib/<domínio>/` |
| UI Atomic | `src/frontend/components/{atoms,molecules,organisms,templates,ui}` |
| Proxy | `src/proxy.ts` + `src/backend/lib/proxy/` |

## Camadas

- **MVC backend:** controllers → models / modules (application) → lib / infra.
- **Atomic frontend:** pages montam templates com organisms.

## Commits

Formato: `[task] - [tipo] - [descrição PT-BR imperativo]` ou Conventional Commits em PT-BR.
