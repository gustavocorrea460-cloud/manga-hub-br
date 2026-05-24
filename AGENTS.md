<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Key breaking changes in this version (Next.js 16):**
1. `params` and `searchParams` are `Promise<>` — must `await` them in pages and route handlers
2. `cookies()` and `headers()` from `next/headers` are async — must `await`
3. `middleware.ts` is deprecated — use `proxy.ts` with `export function proxy()`
4. `next lint` command is removed — use `eslint` directly
5. `sass-loader` v16 — tilde `~` imports not supported in Turbopack
6. Static `GET` route handlers — use `export const dynamic = 'force-static'`
7. `images.remotePatterns` (NOT `images.domains`)
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-context -->
# Manga Hub BR — Projeto

## Stack
- **Framework:** Next.js 16.2.6 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Neon PostgreSQL (serverless)
- **Auth:** NextAuth.js v5 (beta)
- **Deploy:** Vercel

## Estrutura de Pastas
```
/
├── app/
│   ├── page.tsx              # Home (lançamentos recentes)
│   ├── layout.tsx            # Layout global com Navbar
│   ├── globals.css           # Tema escuro + Tailwind
│   ├── not-found.tsx         # 404
│   ├── error.tsx             # Error boundary (client)
│   ├── loading.tsx           # Loading global
│   ├── manga/[slug]/
│   │   ├── page.tsx          # Detalhes do mangá (id = slug)
│   │   └── loading.tsx
│   ├── leitor/[chapterId]/
│   │   ├── page.tsx          # Leitor de capítulos
│   │   └── loading.tsx
│   ├── busca/
│   │   └── page.tsx          # Busca com searchParams
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── cron/update-cache/route.ts
├── components/
│   ├── Navbar.tsx            # Navegação + busca (client)
│   ├── MangaCard.tsx         # Card de mangá (server)
│   ├── ChapterList.tsx       # Lista de capítulos (server)
│   ├── Reader.tsx            # Leitor de páginas (client)
│   ├── SearchBar.tsx         # Input de busca (client)
│   ├── LoadingSkeleton.tsx   # Skeletons de loading
│   ├── ErrorMessage.tsx      # Mensagem de erro
│   └── EmptyState.tsx        # Estado vazio
├── lib/
│   ├── api/mangadex.ts       # Cliente MangaDex API
│   ├── cache.ts              # Cache layer (Neon → API → Neon)
│   ├── db.ts                 # Conexão + queries Neon SQL
│   └── utils.ts              # Formatação, helpers
├── types/
│   └── mangadex.ts           # Tipos + helpers (getTitle, getCoverUrl, etc.)
├── db/
│   └── migrate.ts            # Script de migração do banco
├── .env.local                # Variáveis de ambiente (template)
├── .github/workflows/update-cache.yml  # Cron 30min
├── MEMORY.md                 # Documentação completa do projeto
└── AGENTS.md                 # Instruções para IA (este arquivo)
```

## Estado Atual
- [x] MEMORY.md criado
- [x] Setup Next.js + Tailwind + dependências
- [x] Schema do banco + migração
- [x] Cliente MangaDex API (lib/api/mangadex.ts)
- [x] Tipos TypeScript (types/mangadex.ts)
- [x] Cache layer (lib/cache.ts + lib/db.ts)
- [x] Componentes: Navbar, MangaCard, ChapterList, Reader, SearchBar, LoadingSkeleton, ErrorMessage, EmptyState
- [x] Página Home (lançamentos recentes em grid)
- [x] Página Mangá (detalhes + lista de capítulos)
- [x] Página Leitor (navegação entre páginas)
- [x] Página Busca (input + resultados)
- [x] Página 404, Error Boundary, Loading global
- [x] GitHub Actions cron (atualização a cada 30min)
- [x] API route /api/cron/update-cache
- [ ] Deploy no Vercel
- [ ] Configurar Neon PostgreSQL
- [ ] Conectar domínio

## Próximos Passos
1. Criar conta Neon (https://neon.tech) e obter DATABASE_URL
2. Rodar `npx tsx db/migrate.ts` para criar tabelas
3. Fazer deploy no Vercel (via GitHub)
4. Configurar CRON_SECRET e VERCEL_URL nos secrets do GitHub
5. Configurar domínio no registro.br

## Convenções de Código
- `params` e `searchParams` são `Promise<>` — sempre `await`
- Componentes com estado/eventos → `"use client"`
- Páginas → Server Components (fetch + Suspense)
- Tema escuro por padrão (variáveis CSS em globals.css)
- Cores: bg=#0f0f0f, fg=#f5f5f5, accent=#6c5ce7 (roxo)
- MangaDex API sempre com `availableTranslatedLanguage[]=pt-br`
<!-- END:project-context -->
