# CryChat

Plataforma SaaS de inteligência conversacional para e-commerce (MVP: chat + admin VTEX + métricas).

## Stack

- Next.js 16 (App Router), React 19, Tailwind 4, shadcn base-nova
- Auth.js (Google) + Prisma 7 + Supabase Postgres
- Engine de chat (DDD) com VTEX, Pinecone e provedores Gemini/OpenAI (BYOK)

## Estrutura

- `src/backend` — MVC (controllers, models, `modules/*` por domínio)
- `src/frontend` — Atomic Design (`atoms` → `templates`)
- `src/proxy.ts` — proteção de rotas (padrão cry_console)

## Desenvolvimento

```bash
cp .env.example .env
# Preencha DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_GOOGLE_*, CREDENTIALS_ENCRYPTION_KEY

pnpm install
pnpm exec prisma migrate deploy   # ou migrate dev
pnpm dev
```

Rotas principais:

- `/entrar` — login Google
- `/chat` — assistente (mobile first; vitrine à direita no desktop)
- `/admin` — métricas de busca/cliques
- `/admin/lojas/nova` — credenciais VTEX
- `/admin/ia` — provedor de IA (BYOK)

## Qualidade

```bash
pnpm typecheck
pnpm test
pnpm build
```

Design Stitch: ver [docs/DESIGN.md](./docs/DESIGN.md).
