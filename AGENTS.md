<!-- ====================================================================== -->
<!-- BOOT CHECKLIST — Leia isto PRIMEIRO ao iniciar uma nova sessão        -->
<!-- ====================================================================== -->

# 🚀 BOOT — Manga Hub BR

## 1. Protocolo de Retomada de Contexto

Se esta é uma nova sessão e você PRECISA RECUPERAR CONTEXTO:

```markdown
1. LEIA `MEMORY.md` — arquitetura, schema, decisões, roadmap
2. LEIA `SESSIONS.md` — últimas ações, próximo passo, blockers
3. LEIA `.env.example` — variáveis necessárias
4. VERIFIQUE `npm run build` — se quebrou, diagnostique
```

## 2. Auto-Sumário Obrigatório

**AO FINAL DE CADA SESSÃO**, você DEVE:

1. Adicionar entrada no **topo de `SESSIONS.md`** com:
   - Data (ISO 8601)
   - O que foi feito (lista)
   - Decisões tomadas
   - Estado do build (✅/❌)
   - Próximos passos (priorizados)
   - Blocadores

2. Se algo QUEBROU, registre a causa e o que falta arrumar.

## 3. Boot Checklist

Antes de qualquer ação, verifique:

- [ ] Já li `SESSIONS.md` para saber onde paramos?
- [ ] Já li `MEMORY.md` para entender a arquitetura?
- [ ] O build compila? (`npm run build`)
- [ ] `.env.local` existe com DATABASE_URL válida?
- [ ] Git está em estado limpo? (`git status`)

<!-- ====================================================================== -->
<!-- NEXT.JS 16 — BREAKING CHANGES (OBRIGATÓRIO)                           -->
<!-- ====================================================================== -->

## ⚠️ Next.js 16 — Breaking Changes

**Leia `node_modules/next/dist/docs/` antes de escrever código novo.**

| # | Mudança | Impacto |
|---|---|---|
| 1 | `params` e `searchParams` são `Promise<>` | **Sempre `await`** em pages e route handlers |
| 2 | `cookies()` e `headers()` são async | **Sempre `await`** |
| 3 | `middleware.ts` → `proxy.ts` | Renomear + export `proxy()` |
| 4 | `next lint` removido | Usar `eslint` diretamente |
| 5 | `images.domains` removido | Usar `images.remotePatterns` |
| 6 | Cache GET handlers: `dynamic = 'force-static'` | Default é dinâmico |
| 7 | `revalidateTag()` agora exige 2º argumento | `revalidateTag(tag, 'max')` |
| 8 | Turbopack é default | Use `--webpack` se necessário |

<!-- ====================================================================== -->
<!-- PROJETO — CONTEXTO COMPLETO                                           -->
<!-- ====================================================================== -->

## 📋 Ficha Rápida

| Item | Valor |
|---|---|
| Projeto | Manga Hub BR — agregador mangás PT-BR |
| Stack | Next.js 16 + TypeScript + Tailwind CSS v4 |
| DB | Neon PostgreSQL (serverless, free) |
| Deploy | Vercel (free) |
| Auth | NextAuth.js v5 |
| Fonte | MangaDex API (primária) |
| Cache | Tabelas PostgreSQL (TTL 30min) |
| Cron | GitHub Actions (30min) |

## 📁 Estrutura

```
/
├── app/
│   ├── page.tsx               # Home (lançamentos)
│   ├── layout.tsx             # Layout + Navbar
│   ├── globals.css            # Tema escuro + Tailwind
│   ├── not-found.tsx / error.tsx / loading.tsx
│   ├── manga/[slug]/page.tsx  # Detalhes do mangá
│   ├── leitor/[chapterId]/page.tsx  # Leitor
│   ├── busca/page.tsx         # Busca
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── cron/update-cache/route.ts
├── components/                # 8 componentes
│   ├── Navbar.tsx (client)
│   ├── MangaCard.tsx (server)
│   ├── ChapterList.tsx (server)
│   ├── Reader.tsx (client)
│   └── SearchBar.tsx (client)
├── lib/
│   ├── api/mangadex.ts        # Cliente MangaDex
│   ├── cache.ts               # Cache layer
│   ├── db.ts                  # Neon SQL queries
│   └── utils.ts               # Helpers (date, format)
├── types/mangadex.ts          # Tipos + helpers
├── db/migrate.ts              # Migration script
├── .env.example               # Template de variáveis
├── MEMORY.md                  # Documentação completa
├── SESSIONS.md                # Log de sessões (append-only)
└── AGENTS.md                  # Este arquivo
```

## 🧠 Convenções de Código

```typescript
// IMPORTS: absolute com @/
import { x } from "@/lib/utils"
import type { Manga } from "@/types/mangadex"

// PARAMS/SearchParams (NEXT.JS 16): sempre Promise, sempre await
export default async function Page({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}

// CLIENT COMPONENTS: só quando precisar de estado/eventos
"use client"
import { useState } from "react"

// CSS: Tailwind utility classes, sem CSS modules
// TEMA: bg-background (#0f0f0f), text-foreground (#f5f5f5), accent (#6c5ce7)
// MANGADEX: sempre with availableTranslatedLanguage[]=pt-br
```

## 📦 Comandos Úteis

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Build de produção
npm run db:migrate   # Rodar migrations no Neon (precisa DATABASE_URL)
npm run typecheck    # TypeScript check sem build
npm run lint         # ESLint
```

## 🔗 Referências

- MangaDex API: https://api.mangadex.org/docs/
- Neon: https://neon.tech
- Next.js 16 docs: `node_modules/next/dist/docs/`
