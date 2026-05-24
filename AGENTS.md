<!-- ====================================================================== -->
<!-- BOOT CHECKLIST — Leia isto PRIMEIRO ao iniciar uma nova sessão        -->
<!-- ====================================================================== -->

# 🚀 BOOT — Manga Hub BR

## 🚨 PRIMEIRA AÇÃO AO PERDER CONTEXTO

Sempre que iniciar uma sessão nova (sem histórico), execute nesta ordem:

```markdown
1. LEIA `AGENTS.md`   ← este arquivo (boot + breaking changes + convenções)
2. LEIA `MEMORY.md`   ← arquitetura, schema, decisões, roadmap
3. LEIA `SESSIONS.md` ← últimas ações, próximo passo, blockers
4. EXECUTE `git status`         ← saber estado do working tree
5. EXECUTE `npm run build`      ← verificar se compila
```

## 1. Protocolo de Retomada de Contexto

Se esta é uma nova sessão e você PRECISA RECUPERAR CONTEXTO:

```markdown
1. LEIA `AGENTS.md` — boot, breaking changes, ficha rápida, convenções
2. LEIA `MEMORY.md` — arquitetura completa, schema, roadmap
3. LEIA `SESSIONS.md` — últimas ações, próximo passo, blockers
4. LEIA `.env.example` — variáveis necessárias
5. EXECUTE `git status` — verificar working tree
6. EXECUTE `npm run build` — verificar se compila
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

- [ ] Já li `AGENTS.md` para instruções de boot?
- [ ] Já li `MEMORY.md` para entender a arquitetura?
- [ ] Já li `SESSIONS.md` para saber onde paramos?
- [ ] `git status` — working tree limpo?
- [ ] `npm run build` — compila?
- [ ] `.env.local` existe com DATABASE_URL válida?

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
|---|---|---|
| Projeto | Manga Hub BR — agregador mangás PT-BR |
| Stack | Next.js 16 + TypeScript + Tailwind CSS v4 |
| DB | Neon PostgreSQL (serverless, free) |
| Deploy | Vercel (free) — https://manga-hub-br.vercel.app |
| Auth | NextAuth.js v5 (estrutura, sem providers ainda) |
| Fontes | MangaDex API (primária) + MangaFire scraper (fallback) + MangaStop.net (fallback BR) |
| Cache | Tabelas PostgreSQL (TTL 30min) com fallback expirado |
| Cron | GitHub Actions (30min) — CRON_SECRET + VERCEL_URL configurados |
| Repo | https://github.com/gustavocorrea460-cloud/manga-hub-br |
| Plan Mode | `/plan` para planejar, sem edições |

### Features implementadas (Fase 1 + 1.5 + Multi-source)
- Home com grid de lançamentos + paginação (`?page=N`)
- Detalhes do mangá (capa, status, tags, autor, descrição, scanlators)
- Leitor com: teclado (← → Espaço), clique lateral, navegação entre caps, Data Saver, scanlator visível
- Busca por texto com paginação (`?q=&page=`)
- Cache PostgreSQL com fallback se API cair
- Tema escuro (#0f0f0f + accent roxo #6c5ce7)
- Cron de atualização automática (GitHub Actions a cada 30min)
- **Multi-source**: `?source=mangafire|mangastop` na busca, detalhes e leitor
- **Image proxy**: `/api/proxy?url=` para bypass de CORS/hotlink
- **Source toggle** na página de busca (MangaDex ↔ MangaFire ↔ MangaStop)

## 📁 Estrutura

```
/
├── app/
│   ├── page.tsx                    # Home (lançamentos + paginação)
│   ├── layout.tsx                  # Layout + Navbar
│   ├── globals.css                 # Tema escuro + Tailwind
│   ├── not-found.tsx / error.tsx / loading.tsx
│   ├── manga/[slug]/page.tsx       # Detalhes do mangá
│   ├── leitor/[chapterId]/page.tsx # Leitor (teclado, navegação caps)
│   ├── busca/page.tsx              # Busca com paginação + source toggle
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── cron/update-cache/route.ts  # force-dynamic
│       └── proxy/route.ts              # Image proxy CORS (force-dynamic)
├── components/
│   ├── Pagination.tsx              # Paginação compartilhada
│   ├── MangaCard.tsx               # Card de mangá na grid
│   ├── ChapterList.tsx             # Lista de capítulos
│   ├── Reader.tsx                  # Leitor (suporta absoluteUrls)
│   ├── Navbar.tsx                  # Navbar com busca inline
│   ├── SearchBar.tsx               # Input de busca (mantém query + source)
│   ├── LoadingSkeleton.tsx         # Skeletons
│   ├── ErrorMessage.tsx            # Mensagem de erro
│   └── EmptyState.tsx              # Estado vazio
├── lib/
│   ├── api/mangadex.ts             # Cliente MangaDex ({ data, total })
│   ├── api/mangafire.ts            # Scraper MangaFire (cheerio + AJAX)
│   ├── api/mangastop.ts            # Scraper MangaStop.net (cheerio + _ts_internal_config)
│   ├── cache.ts                    # Cache layer (TTL 30min, fallback)
│   ├── sources.ts                  # Unified adapter multi-source
│   ├── db.ts                       # Neon SQL queries (lazy init)
│   └── utils.ts                    # Helpers (date, format, cn)
├── types/
│   ├── mangadex.ts                 # Tipos + helpers (getTitle, getScanlatorName...)
│   ├── mangafire.ts                # Tipos MangaFire scraper
│   └── mangastop.ts                # Tipos MangaStop scraper
├── db/migrate.ts                   # Migration script
├── .env.example                    # Template de variáveis
├── MEMORY.md                       # Documentação completa
├── SESSIONS.md                     # Log de sessões (append-only)
├── AGENTS.md                       # Este arquivo
└── CLAUDE.md                       # @AGENTS.md
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
// API RETURN: getLatestMangas/searchManga → { data: Manga[], total: number }
// LEITOR: mangaId passado como ?mangaId= no search param
// MULTI-SOURCE: parâmetro ?source=mangadex|mangafire|mangastop nas páginas
// MANGA FIRE: scraper via cheerio + AJAX endpoints (/ajax/read/...)
//   search: /filter?keyword=X&page=N
//   detail: /manga/{id}
//   chapters: /ajax/read/{numId}/chapter/{lang}  (GET, JSON response)
//   pages: /ajax/read/chapter/{chapterId}  (GET, JSON response)
//   proxy: /api/proxy?url=X (imagens com hotlink protection)
// MANGA STOP: scraper via cheerio (WordPress mangareader theme)
//   search: /?s={query}  (WordPress native search)
//   detail: /manga/{slug}/
//   chapters: parse from #chapterlist / ul.clstyle
//   pages: fetch chapter page, extract _ts_internal_config, atob(token)
//   origin CDN: comick.jeffersondev.xyz (no hotlink — URLs diretas no <img>)
// SOURCE TOGGLE: componente SourceToggle disponível em /busca (3 fontes)
// IMAGE PROXY: /api/proxy?url= para CORS/hotlink bypass (mangafire.to)
```

## 📦 Comandos Úteis

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Build de produção
npm run typecheck    # TypeScript check sem build
npm run lint         # ESLint
npm run db:migrate   # Rodar migrations no Neon (precisa DATABASE_URL)
npm run setup        # cp .env.example .env.local
```

## 🔗 Referências

- MangaDex API: https://api.mangadex.org/docs/
- Neon: https://neon.tech
- Next.js 16 docs: `node_modules/next/dist/docs/`
- Repo: https://github.com/gustavocorrea460-cloud/manga-hub-br
- Site: https://manga-hub-br.vercel.app
