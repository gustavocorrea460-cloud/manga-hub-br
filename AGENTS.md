<!-- ====================================================================== -->
<!-- BOOT CHECKLIST — Leia isto PRIMEIRO ao iniciar uma nova sessão        -->
<!-- ====================================================================== -->

# 🚀 BOOT — Manga Hub BR

## 🚨 PRIMEIRA AÇÃO AO PERDER CONTEXTO

Sempre que iniciar uma sessão nova (sem histórico), execute nesta ordem:

```markdown
1. LEIA `AGENTS.md`   ← este arquivo (boot, breaking changes, convenções)
2. LEIA `TIMELINE.md` ← cache quente da sessão atual (onde paramos, próximo passo)
3. LEIA `MEMORY.md`   ← arquitetura, schema, decisões, roadmap
4. LEIA `SESSIONS.md` ← últimas ações, próximo passo, blockers
5. LEIA `.env.example` ← variáveis de ambiente necessárias
6. EXECUTE `git status`         ← saber estado do working tree
7. EXECUTE `npm run build`      ← verificar se compila
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
<!-- PROJETO — REFERÊNCIAS RÁPIDAS                                        -->
<!-- ====================================================================== -->

> 📌 **Cache quente da sessão:** `TIMELINE.md` (sessão atual, pilha, progresso, próximo passo)
> 📌 **Contexto completo do projeto:** `MEMORY.md` (arquitetura, fontes, schema, roadmap, decisões)
> 📌 **Log de sessões:** `SESSIONS.md` (histórico append-only de cada sessão)

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
```

## 📦 Comandos Úteis

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Build de produção
npm run typecheck    # TypeScript check sem build
npm run lint         # ESLint
npm run db:migrate         # Rodar migrations no Neon (precisa .env.local)
npm run db:dump            # Dump catálogo MangaStop (2456 mangás, ~30min)
npm run db:dump -- --quick # Dump rápido MangaStop (150ms rate limit, ~15min)
npm run db:dump:leiturmanga # Dump catálogo LeituraManga.net
npm run setup              # cp .env.example .env.local
```

## 🔗 Referências

- MangaDex API: https://api.mangadex.org/docs/
- Neon: https://neon.tech
- Next.js 16 docs: `node_modules/next/dist/docs/`
- Repo: https://github.com/gustavocorrea460-cloud/manga-hub-br
- Site: https://manga-hub-br.vercel.app
