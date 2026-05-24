# 🔬 Pesquisa de Projetos — Manga Hub BR

> Projetos analisados: **36** + 12 wrappers/scanlators listados
> Data: 2026-05-24 | Stack do projeto: Next.js 16 + TypeScript + Tailwind v4 + Neon PostgreSQL

---

## 1. Sumário Executivo

| Métrica | Valor |
|---------|-------|
| Projetos web (Next.js/React) | 14 |
| Self-hosted servers | 7 |
| Apps mobile/desktop | 9 |
| CLI/downloaders | 6 |
| Código-fonte lido (deep analysis) | 7 repositórios |

**Descoberta #1 — Nenhum projeto web faz tudo bem.** MangaVerse (Next.js 16) tem leitor quebrado. Akari (TanStack) é o mais completo mas NÃO é Next.js. KevinLmn tem a melhor arquitetura multi-camada mas só 7 stars.

**Descoberta #2 — Ninguém fez multi-fontes + web de forma madura.** comick-source-api tem 70 scrapers mas zero cache. Neko (Android) faz merge de fontes mas é app nativo. A oportunidade do Manga Hub BR é ser o PRIMEIRO leitor web com multi-fontes de qualidade.

**Descoberta #3 — Três padrões de cache emergem:** (a) só Redis server-side, (b) IndexedDB client-side, (c) 2-tier (Redis + IndexedDB). KevinLmn é o único que faz 3-tier (Redis + PostgreSQL + IndexedDB).

**Descoberta #4 — Image proxy é obrigatório.** `uploads.mangadex.org` tem CORS restritivo e mixed content problems. Todo projeto sério tem `/api/proxy/image`.

---

## 2. Projetos Ordenados por Relevância

> Critério: similaridade de stack + código funcional + features úteis para nosso roadmap

---

### 🥇 #1 — KevinLmn/mangadex-reader (MELHOR ARQUITETURA)

| Campo | Info |
|-------|------|
| **Link** | https://github.com/KevinLmn/mangadex-reader |
| **Stack real** | Next.js 14 + Fastify 5 + Prisma + Redis + PostgreSQL + TanStack Query v5 + Dexie.js |
| **Stars** | 7 (subestimado) |
| **Funcionando?** | ✅ Completo e funcional |

**Features únicas:**
- Monorepo TurboRepo (frontend Next.js + backend Fastify)
- **3-tier cache**: Redis (24h TTL) + PostgreSQL (persistente) + IndexedDB (images)
- **Image proxy** `/api/proxy/image?url=` com 1 ano de cache
- **Download capítulo como merged PNG** via `sharp`
- Quality toggle (high = `data` / low = `data-saver`)
- Auto-save reading progress on every page change (com dedup)
- Hover prefetch com debounce 300ms
- Cleanup de query cache (remove páginas não adjacentes)
- Warm cache script para popular/latest
- Auth JWT + MangaDex OAuth2

**Pipeline de imagem do leitor:**
1. `useCurrentPageImage` → check IndexedDB → fetch arraybuffer → Blob → store in Dexie
2. `usePrefetchAdjacentPages` → preload page+1, page+2, page-1
3. `useBlobObjectUrl` → Blob → object URL (auto-revoga anterior)
4. Render via Next/Image `unoptimized`

**Backend routes (Fastify auto-load):**

| Rota | Descrição |
|------|-----------|
| `POST /api/manga/:id` | Chapters list (DB ou MangaDex) + manga detail |
| `GET /api/manga/chapter/:chapterId/:page?quality=` | Proxy de imagens via MangaDex@home CDN |
| `GET /api/proxy/image?url=` | Proxy CORS genérico |
| `POST /api/login` / `register` | Auth JWT |
| `GET /api/search?q=` | Search via MangaDex API |
| `GET /api/popular` / `latest` | JSON estáticos (warmCache) |
| `POST /api/favorites` | CRUD favoritos |
| `POST /api/progress` | Reading progress |

**⚠️ Problemas:**
- IndexedDB cleanup muito agressivo (30s) — imagens são re-download com frequência
- `/api/proxy/image` aceita QUALQUER URL — sem whitelist (risco SSRF)
- MangaDex client credentials hardcoded (obrigatório)
- Popular/latest são JSON estáticos — sem dados em tempo real
- Sem PWA / service worker
- Sem testes
- Sem modo long-strip / webtoon (só single page)

**🔑 O que copiar:**
- Image proxy + 3-tier cache + merged PNG download + prefetch adjacente + quality toggle + warm cache script + cleanup query cache

---

### 🥈 #2 — Akari (sn0w12) — MELHOR READER

| Campo | Info |
|-------|------|
| **Link** | https://github.com/sn0w12/Akari |
| **Stack real** | **TanStack Start** (NÃO Next.js) + React 19 + Vite 8 + Tailwind v4 + shadcn/ui + Supabase SSR + TanStack Query + TanStack Virtual + TanStack Hotkeys + openapi-fetch + Embla Carousel |
| **Stars** | ~30 |
| **Funcionando?** | ✅ Completo, deploy ativo |

**Features únicas:**
- **Page Reader**: click zones (40% left prev / 20% inert / 40% right next — flip RTL), keyboard ArrowLeft/ArrowRight
- **Strip Reader**: vertical column, slider width 32-256, progresso via scroll
- **Auto-advance**: última página → próximo capítulo automaticamente
- **Preload capítulo seguinte aos 75%** (ou últimas 3 páginas)
- **Sync automático**: `syncAllServices()` aos 50% da leitura
- **MAL/AniList Sync**: OAuth2 PKCE + Implicit Grant, `Promise.allSettled`
- **Reader mode auto-detection**: manhwa/manhua = strip, manga = page (override por localStorage)
- **Inactivity**: esconde cursor após 2s sem interação
- **Hidden preloading**: `chapter.images[currentPage + 1]` em div oculta
- **Settings completos**: tema (System), fancy animations, toasts, analytics, strip width
- **Border flash**: verde/vermelho em bookmark success/failure

**API Layer:**
- Chama proxy customizado `https://api.akarimanga.dpdns.org/v2/*` (NÃO MangaDex direto)
- `openapi-fetch` com TypeScript codegen do swagger (170KB tipos)
- Auth: Supabase SSR cookie `sb-db-auth-token`

**Caching:** TanStack Query staleTime 5min + localStorage/SessionStorage type-safe + Service Worker custom

**⚠️ Problemas:**
- **Não é Next.js** — é TanStack Start (framework diferente). Impossível copiar código diretamente
- API proxy é privada (`dpdns.org`) — não temos acesso
- Sem cache server-side (Redis/banco) — só staleTime do TanStack Query
- Sem image proxy — imagens vão direto do CDN
- Sem download offline
- Sem multi-fontes — só MangaDex via proxy
- Dead dependencies: `next-intl` e `idb` declarados mas não usados

**🔑 O que copiar (conceitos, não código):**
- Dual reader (page + strip) + auto-detection + preload 75% + sync 50% + auto-advance + inactivity hide cursor

---

### 🥉 #3 — comick-source-api (GooglyBlox) — MULTI-FONTES

| Campo | Info |
|-------|------|
| **Link** | https://github.com/GooglyBlox/comick-source-api |
| **Stack real** | Next.js 14 Edge + cheerio |
| **Stars** | 12 |
| **Funcionando?** | ⚠️ Fontes morrem/com frequência (API é frágil) |

**70 scrapers via Factory Pattern:**
```typescript
abstract BaseScraper {
  abstract getName(), getBaseUrl(), canHandle(url)
  abstract extractMangaInfo(), getChapterList(), search()
  protected fetchWithRetry(url, retries)
}
```

**3 estratégias de scraping:**

| Estratégia | Fontes | Método |
|------------|--------|--------|
| **API direta** | Comick, AtsuMoe, FlameComics | `fetch()` → JSON |
| **HTML/cheerio** | MangaPark, Bato, WEBTOON, ~50 fontes | `cheerio.load()` + CSS selectors |
| **Browser headers** | AsuraScan, WeebCentral | Headers completos + `isClientOnly` flag |

**Streaming NDJSON para search multi-source:**
```typescript
new ReadableStream({ start(controller) {
  await Promise.all(scrapers.map(s => searchWithTimeout(s, query, 20000)))
  // Cada resultado: {"source": "MangaPark", "results": [...]}
  // Final: {"done": true, ...summary}
}})
```

**⚠️ Problemas GRAVES:**
- **Zero cache** — toda request re-scrapeia a fonte
- **Zero rate limiting** — pode ter IP bloqueado
- **Zero proxy rotation** — sem fallback de IP
- **Zero CAPTCHA solving**
- **Sem verificação de saúde automática** — health check só manual
- **70 scrapers frágeis** — mudança de HTML quebra tudo

**🔑 O que copiar (conceito, não implementação):**
- Factory pattern (BaseScraper + registry) — SIM
- Streaming NDJSON para search multi-source — SIM
- 70 scrapers frágeis sem cache — NÃO
- Implementação de scraper por fonte sem fallback — NÃO

---

### #4 — Neko (nekomangaorg) — MERGE DE FONTES

| Campo | Info |
|-------|------|
| **Link** | https://github.com/nekomangaorg/Neko |
| **Stack** | Kotlin (Tachiyomi fork) |
| **Stars** | 2.7k |

**Multi-source merge** (client-side):
- Busca capítulos de **múltiplas fontes** para um mesmo mangá
- Merge por número de capítulo: capítulos faltantes de fonte A são preenchidos por fonte B
- Fontes: MangaDex + Atsumaru + Toonily + Weeb Central + Project Suki + Comix + Suwayomi + Komga
- **Tracking**: MAL, AniList, Kitsu, MangaUpdates, MangaBaka — bidirecional
- **Recomendações**: ML + MAL/MU/AL

**🔑 O que copiar:**
- Merge client-side por número de capítulo (simples e eficaz)
- Lista de fontes prioritárias

---

### #5 — Suwayomi — EXTENSÕES APK NO SERVER

| Campo | Info |
|-------|------|
| **Link** | https://github.com/Suwayomi/Suwayomi-Server |
| **Stack** | Kotlin/Java + Javalin + GraphQL + Exposed DB |
| **Stars** | 7k |

**Pipeline de extensão:**
1. APK baixado do GitHub
2. DEX → JAR via **dex2jar**
3. JAR carregado via `ChildFirstURLClassLoader`
4. Android APIs stubadas via **AndroidCompat**
5. Extensão instanciada via reflection

**🔑 O que copiar:**
- Conceito de plugin para fontes — **complexidade muito alta para nosso estágio atual**
- Ignorar até Fase 4

---

### #6 — Kavita / Komga — SELF-HOSTED MADUROS

| Projeto | Stack | Stars | Diferencial |
|---------|-------|-------|-------------|
| **Kavita** | C# + Angular | 10.7k | Temas customizáveis, OPDS, RBAC, 61+ idiomas |
| **Komga** | Kotlin + Spring Boot + Vue.js | 6.3k | **Kobo Sync**, 80k+ books, REST API, 6 anos maduro |

**🔑 Referência para:** funcionalidades de servidor (collections, reading lists, metadata) — não para nossa stack web.

---

### #7 — Mangal — LUA SCRAPERS

| Campo | Info |
|-------|------|
| **Link** | https://github.com/metafates/mangal |
| **Stack** | Go + gopher-lua |
| **Stars** | 1.7k |

**3 funções Lua obrigatórias:**
```lua
function search_manga(query)  -- → table of manga
function manga_chapters(url)  -- → table of chapters
function chapter_pages(url)   -- → table of pages
```

**28 bibliotecas Go → Lua:** http, html, json, headless Chrome, crypto, base64, regexp, xmlpath (XPath!), storage

**🔑 O que copiar:**
- Interface mínima de 3 funções para uma fonte — **ótimo design**
- Ideal para Fase 4 (plugin system)

---

### Demais Projetos (Tabela Resumo)

| Projeto | Stack | Nota |
|---------|-------|------|
| MangaVerse | Next.js 16 | Leitor quebrado, PWA ok, proxy inconsistente |
| prattyush15/manga-reader | Next.js 15 | Glassmorphism UI, filtro gênero salvo |
| mangadex-client | React | Browse/read básico via MangaDex |
| mangastack | JS | Frontend MangaDex, 48 stars |
| comick-offline-reader | Next.js + PWA | Offline via Comick (morto) |
| comick-api-proxy | Next.js | Proxy genérico (arquivado) |
| Okuma-Reader | JS | Pre-caching, double-page view |
| ReaderFront | React + styled-components | Comic CMS, PWA |
| InkNest | JS | Mobile comics + anime |
| EdizKeskin/MangaReader | JS | Follow/save básico |
| Deep-patra/nextjs_manga_app | Next.js | Zustand stores, 0 stars |
| Mango | Crystal | Self-hosted (descontinuado) |
| Teemii | Vue.js + Node | Agent-based metadata, recomendações |
| Mangatsu | Go | Media server doujinshi |
| Stump | Rust + React | 41MB container, WIP |
| Mihon | Kotlin | 20.7k★, ecossistema extensões |
| Kotatsu | Kotlin | 8.6k★ (shut down), 1200+ sources |
| Komikku | Kotlin | 3.9k★, auto theme color |
| Mangayomi | Dart/Flutter + Rust | 3.4k★, manga+novel+anime |
| Houdoku | Electron + React + shadcn/ui | 1.1k★, desktop multi-fontes |
| OpenComic | Electron | 1.8k★, ePub/PDF |
| AI-Manga-Reader | JS | 50★, OCR + TTS |
| Unyo | Flutter | 626★, anime+manga sem ads |
| Hakuneko | JS | 6.1k★, downloader multi-fonte |
| AIO-Webtoon-Downloader | Python | Download paralelo EPUB/PDF/CBZ |
| manga-tui | Rust | 873★, TUI + multi-provider |
| mokuro | Python | 1.6k★, OCR manga japonês |

---

## 3. Análise Comparativa por Domínio

### 3.1 Readers

| Aspecto | Akari | KevinLmn | MangaVerse |
|---------|-------|----------|------------|
| Page reader | ✅ Click zones 40/20/40 | ✅ Click 50/50 | ❌ Quebrado |
| Strip reader | ✅ Slider width | ❌ | ❌ |
| Auto-detection | ✅ Manhwa=strip, manga=page | ❌ | ❌ |
| Auto-advance | ✅ Próx capítulo | ❌ | ❌ |
| Preload capítulo | ✅ 75% | ❌ | ❌ |
| Preload páginas | ✅ Hidden div | ✅ usePrefetchAdjacentPages | ❌ |
| Quality toggle | ❌ | ✅ high/data-saver | ❌ |
| Progress auto-save | ✅ Sync 50% | ✅ Every page (dedup) | ✅ localStorage |
| Inactivity hide | ✅ 2s cursor | ❌ | ❌ |
| Click zones RTL | ✅ Flipável | ❌ | ❌ |

**Decisão:** Implementar page reader do Akari + preload/strip do Akari + quality toggle + prefetch adjacente do KevinLmn.

---

### 3.2 Multi-Fontes

| Sistema | Formato | Fontes | Cache | Complexidade |
|---------|---------|--------|-------|-------------|
| comick-source-api | TS/cheerio | 70 | ❌ | Média |
| Neko | Kotlin (app) | 8 (merge) | N/A | Alta (fork) |
| Suwayomi | APK → JVM | 1000+ (Mihon) | Redis | Muito alta |
| Mangal | Lua → Go | 4 built-in + custom | SQLite | Média |

**Decisão:** Fase 2 = Comick como 2ª fonte (JSON API). Fase 3 = scrapers TS para scans BR (pattern comick). Fase 4 = plugin system (pattern Mangal).

---

### 3.3 Cache

| Projeto | Server | Client | Browser | TTL |
|---------|--------|--------|---------|-----|
| KevinLmn | Redis + PostgreSQL | TanStack Query | IndexedDB (Dexie) | 24h Redis / 30s IDB |
| Akari | ❌ | TanStack Query staleTime 5min | localStorage | 5min |
| MangaVerse | ❌ | ❌ | localStorage + Workbox SW | Variável |
| comick-source-api | ❌ | ❌ | ❌ | N/A |

**Decisão:** Cache server-side via Neon PostgreSQL (já temos) com TTL 30min + fallback expirado. Cache browser via TanStack Query staleTime + localStorage para progresso. IndexedDB para images quando implementar offline.

---

### 3.4 Search

| Projeto | Onde roda | Técnica | Multi-source |
|---------|-----------|---------|-------------|
| MangaVerse | API route `/api/search` | MangaDex `title=` | ❌ |
| KevinLmn | API route `/api/search?q=` | MangaDex API | ❌ |
| Akari | API proxy externa | GET /v2/manga/search + /list | ❌ |
| comick-source-api | Edge route | 70 scrapers NDJSON streaming | ✅ |

**Decisão:** Manter search via API route MangaDex (já implementado). Quando adicionar multi-fontes, usar NDJSON streaming do comick-source-api para agregar resultados em paralelo.

---

### 3.5 Auth / Sync / Tracking

| Projeto | Auth | Sync | Tracking |
|---------|------|------|----------|
| KevinLmn | JWT + MangaDex OAuth2 | Reading progress server-side | ❌ |
| Akari | Supabase SSR | MAL/AniList OAuth2, sync 50% | ✅ MAL + AniList |
| Suwayomi | JWT | Backup/restore | ✅ MAL + AniList + MangaUpdates |
| Neko | MangaDex login | Bidirecional | ✅ MAL + AniList + Kitsu + MangaUpdates + MangaBaka |

**Decisão:** Fase 2 = favorites + progress localStorage (sem auth). Fase 3 = NextAuth + sync server-side. Fase 4 = scrobbler (AniList/MAL).

---

### 3.6 PWA / Offline

| Projeto | PWA | Offline | Estratégia |
|---------|-----|---------|------------|
| MangaVerse | ✅ next-pwa + Workbox | APIs com NetworkFirst | SW com 6 estratégias de cache |
| KevinLmn | ❌ | IndexedDB (Dexie) | Imagens em Blob no IDB |
| Akari | ✅ Service Worker custom | TanStack Query + localStorage | SW separado (build tsc) |
| comick-offline-reader | ✅ PWA | Capítulos offline | Comick API (morto) |

**Decisão:** Implementar PWA via `next-pwa` (padrão MangaVerse) + IndexedDB para cache de imagens (padrão KevinLmn).

---

## 4. Ecossistema Scanlator BR — Análise de Viabilidade

### Agregadores BR

| Nome | URL | Tem API? | Scraping? | Cloudflare? | Prioridade |
|------|-----|----------|-----------|-------------|------------|
| **HQNow!** | hqnow.com.br | ❌ | Provável | ? | 🔥 Alta (agregador popular) |
| **Ler Mangá** | lermanga.org | ❌ | Provável | ⚠️ Possível | 🔥 Alta |
| **Tsuki Mangás** | tsukimangas.com | ❌ | Provável | ❌ | 🔥 Alta |
| **Yomu Mangás** | yomumangas.com | ❌ | Provável | ❌ | Média |
| **MangáNanquim** | mangananquim.com | ❌ | Provável | ? | Média |
| **SlimeRead** | slimeread.com | ❌ | Provável | ? | Média |
| **LuraToon** | luratoon.com | ❌ | Provável | ? | Média |
| **Mangás Chan** | mangaschan.com | ⚠️ Requer workaround | Sim | ✅ Sim | Baixa |
| **Mangás Online** | mangasonline.com.br | ❌ | Provável | ? | Baixa |
| **Ler Mangá Online** | lermangaonline.com.br | ❌ | Provável | ? | Baixa |

### Agregadores Gringos com PT-BR

| Nome | Tem PT-BR? | Tem API? | Confiabilidade |
|------|-----------|----------|----------------|
| **MangaDex** | ✅ | ✅ Oficial v5 | 🔥 Máxima |
| **Comick** | ✅ | ✅ JSON API | 🔥 Alta (mas instável) |
| **MangaFire** | ✅ | ❌ (scraping) | Média |
| **Bato.to** | ✅ | ❌ (scraping) | Média |
| **MangaPark** | ✅ | ❌ (scraping) | Média |

### Decisão

**Ordem de implementação de fontes:**
1. MangaDex (✅ já feito)
2. Comick API (JSON, fácil) — próxima sprint
3. MangaFire (scraping HTML médio)
4. HQNow! / Tsuki Mangás / Ler Mangá (scraping TS + cheerio)
5. Demais agregadores BR

Pattern de implementação (baseado no comick-source-api):
```typescript
abstract class BaseScraper {
  abstract name: string
  abstract baseUrl: string
  abstract canHandle(url: string): boolean
  abstract search(query: string): Promise<MangaResult[]>
  abstract getChapters(mangaId: string): Promise<Chapter[]>
  abstract getPages(chapterId: string): Promise<string[]>
  protected async fetch(url: string, options?: RequestInit): Promise<string>
}
```

---

## 5. Decisões Técnicas para o Manga Hub BR

### 5.1 Arquitetura de Fontes Recomendada

```
┌────────────────────────────────────────────────────────────────┐
│                      Manga Hub BR                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ MangaDex │  │  Comick  │  │ MangaFire│  │ Scans BR     │  │
│  │ (API v5) │  │ (JSON)   │  │ (Scrape) │  │ (TS/cheerio) │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │             │                │          │
│       └──────────────┴─────────────┴────────────────┘          │
│                              │                                  │
│                   ┌──────────┴──────────┐                      │
│                   │  Source Manager      │                      │
│                   │  (Merge + Fallback)  │                      │
│                   └──────────┬──────────┘                      │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              │  Cache Layer (Neon PostgreSQL) │                │
│              │  TTL 30min + fallback expirado │                │
│              └───────────────┬───────────────┘                  │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              │  API Routes (/api/*)          │                  │
│              │  Image Proxy (/api/proxy)     │                  │
│              └───────────────┬───────────────┘                  │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              │  Frontend (React Server +      │                  │
│              │   Client Components)           │                  │
│              └───────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Anti-Padrões (O que NÃO fazer)

| Anti-Padrão | Projeto | Por que evitar |
|-------------|---------|----------------|
| **Leitor sem return** (tela branca) | MangaVerse | Testar fluxo completo do leitor |
| **Chamar API externa do client-side** | MangaVerse | CORS, duplicação lógica, sem cache |
| **70 scrapers sem cache nem rate limit** | comick-source-api | IP bloqueado, fonte morre, experiência lenta |
| **IndexedDB cleanup agressivo (30s)** | KevinLmn | Redownload frequente de imagens |
| **Proxy sem whitelist de URL** | KevinLmn | Risco SSRF |
| **Zero error handling em fetch** | MangaVerse | UX quebrada silenciosamente |
| **Tudo "use client"** | MangaVerse | Perde SSR, SEO, streaming |
| **Dead dependencies** | MangaVerse, Akari | Manutenção desnecessária |
| **Scrapers sem fallback** | comick-source-api | Fonte única = ponto único de falha |
| **APK no servidor (dex2jar)** | Suwayomi | Complexidade alta demais para nosso estágio |

### 5.3 Stack Recomendada por Feature

| Feature | Stack | Referência |
|---------|-------|------------|
| API Routes (proxy MangaDex) | Next.js App Router | MangaVerse (mas funcionando) |
| Image proxy | `app/api/proxy/route.ts` | KevinLmn |
| Cache | Neon PostgreSQL (já temos) | KevinLmn (adaptado) |
| Reader page | Componente client + click zones | Akari |
| Reader strip | Componente client + scroll | Akari |
| Quality toggle | SearchParams `?quality=` | KevinLmn |
| Preload capítulo | IntersectionObserver + prefetch | Akari |
| Progress | localStorage | Akari |
| PWA | `next-pwa` | MangaVerse |
| Multi-fontes | BaseScraper + registry | comick-source-api |
| Merge fontes | Client-side por número capítulo | Neko |
| Scrapers BR | TS + cheerio | comick-source-api |
| Auth | NextAuth.js v5 | Já temos estrutura |
| Search streaming | NDJSON + ReadableStream | comick-source-api |
| Download merged PNG | API route + `sharp` | KevinLmn |
| Favorites | localStorage → server-side | Todos |

---

## 6. Roadmap Atualizado (com Dependências)

```
FASE 2 (Agora — 1-2 semanas)
─────────────────────────────────────────────────
  ┌─ Image Proxy (/api/proxy) ← KevinLmn [1 dia]
  │     └── Bloqueia: CORS das imagens MangaDex
  │
  ├─ Quality Toggle ← KevinLmn/Akari [1 dia]
  │     └── Depende: nada (só searchParams)
  │
  ├─ Continue Reading ← KevinLmn [1 dia]
  │     └── Depende: nada (localStorage)
  │
  ├─ Favorites ← Todos [1 dia]
  │     └── Depende: nada (localStorage)
  │
  ├─ Preload Capítulo (75%) ← Akari [2 dias]
  │     └── Depende: nada
  │
  └─ PWA (Service Worker) ← MangaVerse [2 dias]
        └── Depende: nada

FASE 2.5 (2-3 semanas)
─────────────────────────────────────────────────
  ┌─ Multi-fontes: Comick API ← comick-source-api [3 dias]
  │     └── Depende: Source Manager + Cache Layer
  │
  ├─ Dual Reader (Page + Strip) ← Akari [3 dias]
  │     └── Depende: nada (componente novo)
  │
  ├─ Auto-advance ← Akari [1 dia]
  │     └── Depende: Dual Reader
  │
  └─ Auto-detection modo ← Akari [1 dia]
        └── Depende: Dual Reader

FASE 3 (1-2 meses)
─────────────────────────────────────────────────
  ┌─ Scraper System (BaseScraper) ← comick-source-api [5 dias]
  │     └── Depende: Cache Layer
  │
  ├─ Scans BR (HQNow!, Tsuki, Ler Mangá) [5 dias]
  │     └── Depende: Scraper System
  │
  ├─ Merge Fontes (client-side) ← Neko [2 dias]
  │     └── Depende: Multi-fontes
  │
  ├─ NextAuth + Favorites server-side [3 dias]
  │     └── Depende: nada (estrutura já existe)
  │
  ├─ Download merged PNG ← KevinLmn [3 dias]
  │     └── Depende: Image Proxy
  │
  ├─ IndexedDB cache images [3 dias]
  │     └── Depende: PWA
  │
  └─ Scrobbler (AniList) ← Akari [3 dias]
        └── Depende: NextAuth

FASE 4 (Longo prazo)
─────────────────────────────────────────────────
  ├─ Plugin System (Lua ou TS) ← Mangal
  ├─ Backup/Restore ← Suwayomi
  ├─ OPDS Server ← Kavita/Komga
  ├─ AI Auto-translate ← AI_Manga_Reader
  └─ Sync entre dispositivos ← KevinLmn
```

---

## 7. Atalhos de Teclado (Compilado)

| Tecla | Ação | Origem |
|-------|------|--------|
| `←` / `→` | Anterior / Próxima página | Todos |
| `Espaço` | Próxima página | Manga Hub BR |
| `A` / `D` | Anterior/Próxima (alternativa) | KevinLmn |
| `H` | Alternar qualidade (high/data-saver) | KevinLmn |
| `?` | Modal de atalhos | KevinLmn |
| `Esc` | Voltar ao mangá | KevinLmn |
| `Home` / `End` | Primeira/última página | (padrão) |
| `F` / `Ctrl+D` | Favoritar | (sugerido) |
| `R` | Modo de leitura (alternar) | (sugerido) |
| `+` / `-` | Zoom in/out | (sugerido) |

---

## 8. Scanlators BR — Lista Completa

### Agregadores
HQNow!, Ler Mangá, Ler Mangá Online, LuraToon, MangáNanquim, Mangás Chan, Mangás Online, SlimeRead, Tsuki Mangás, Yomu Mangás

### Scans Individuais
Argos Scans, Arthur Scans, Astrum Scans, Demon Sect, Diskus Scans, Gekkou Scans, Hikari Scans, Mode Scanlator, Nazarick Scans, Nexo Scans, Portuga Mangas, SSSScanlator, Sagrado Império da Britannia, Saikai Scans, Silence Scans, Sinensis Scans, Tao Sect, Tsundoku Traduções, Tyrant Scans

### Agregadores Gringos com PT-BR
MangaDex ✅ (já integrado), Comick (próximo), MangaFire, Bato.to, MangaPark

---

## 9. Varredura Completa de Fontes (2026-05-24)

> Status de TODAS as fontes identificadas para o Manga Hub BR após varredura exaustiva

### 9.1 Tabela de Status — Fontes BR

| Site | Status | Proteção | Estrutura | Prioridade | Notas |
|------|--------|----------|-----------|------------|-------|
| **MangaStop.net** | ✅ **VIVO** | Cloudflare | WordPress + MangaThemesia | 🔥🔥🔥 | Completo, milhares de títulos, sistema VIP, Discord 9k+, em português |
| **LeituraManga.net** | ✅ **VIVO** | Leve | HTML próprio | 🔥🔥🔥 | Completo, gêneros em PT, Telegram/Instagram ativos |
| **QueroLer.com** | ✅ **VIVO** | Leve | HTML simples | 🔥🔥 | Busca + catálogo, interface limpa |
| **Valkyrie Scan** | 🟡 **Grupo vivo** | N/A | Posta no MangaDex/Bato.to | 🔥🔥 | Scanlator BR focado em Yuri/GL, ativo no MangaDex (maio/2026) |
| **HQNow!** | 🔴 **COMPROMETIDO** | Redireciona adware | netun-oum.com | ❌ | Domínio expirou ou foi hackeado |
| **Tsuki Mangás** | 🔴 **COMPROMETIDO** | Redireciona adware | netun-oum.com | ❌ | Mesmo destino suspeito |
| **Yomu Mangás** | 🔴 **OFF** | Cloudflare? | 403/503 | ❌ | Fora do ar |
| **SlimeRead** | 🔴 **CAIU** | — | Transport error | ❌ | Confirmado por Reddit |
| **Ler Mangá** | 🔴 **MORTO** | — | Transport error | ❌ | Site morto desde 2022 |
| **MangáNanquim** | 🔴 **OFF** | — | Sem resposta | ❌ | Fora do ar |
| **LuraToon** | 🔴 **OFF** | — | Sem resposta | ❌ | Fora do ar |
| **FlowerManga** | 🔴 **MORTO** | — | Transport error | ❌ | Mencionado em listas 2022 |
| **ReMangas** | 🔴 **MORTO** | — | Transport error | ❌ | Mencionado em listas 2022 |
| **MangaOnline.biz** | 🔴 **MORTO** | — | Timeout | ❌ | Mencionado em listas 2022 |
| **YomuComics** | 🔴 **MORTO** | — | Transport error | ❌ | Mencionado em listas 2022 |
| **MahouScan** | 🔴 **MORTO** | — | Transport error | ❌ | Scanlator BR, site caiu |
| **MangaLivre.ru** | 🟡 **BLOQUEADO** | Cloudflare | 403 | ❌ | Possível IP bloqueado |
| **MangaPark.io** | 🔴 **DOMAIN PARK** | — | Estacionado | ❌ | Domínio expirou |
| **Bato.to** | 🟡 **SOB AMEAÇA** | Cloudflare | Operador preso na China | ⚠️ | Funciona mas risco alto |

### 9.2 Fontes Internacionais com PT-BR

| Site | Status | API? | Scraper pronto? | Notas |
|------|--------|------|----------------|-------|
| **MangaDex** | ✅ Vivo | ✅ API v5 | ✅ Já integrado | Principal fonte, oficial |
| **MangaFire** | ✅ Vivo | ❌ HTML scraping | 📦 API wrapper no GitHub | Capítulos PT-BR esporádicos |
| **MangaFox** | ✅ Vivo | ❌ HTML scraping | ❌ Precisa criar | Catálogo EN massivo |
| **MangaPlus** | ✅ Vivo | ✅ Oficial | ❌ Official — apenas caps recentes | Conteúdo PT-BR oficial |
| **MangaKakalot** | 🟡 Timeout | ❌ HTML scraping | ❌ Precisa criar | Pode estar bloqueado |
| **Comick.io** | 🔴 **MORTO** (09/2025) | — | — | Fechou, virou tracking site |
| **Bato.to** | 🟡 Sob ameaça legal | ❌ HTML scraping | ⚠️ Risco alto | Operador preso na China |

### 9.3 MangaStop.net — Engenharia Reversa

**Stack detectada:**
- WordPress + **MangaThemesia** theme (tema WP para mangá bem conhecido)
- Cloudflare (CDN + proteção)
- Redis Object Cache
- Built-in cache do tema

**URL Patterns:**
```
Home:       https://mangastop.net/
Catálogo:   https://mangastop.net/mangas/
Manga:      https://mangastop.net/manga/{slug}/
Genre:      https://mangastop.net/genres/{genre}/
Biblioteca: https://mangastop.net/biblioteca/
Ranking:    https://mangastop.net/ranking/
Perfil VIP: https://mangastop.net/perfil
A-Z list:   https://mangastop.net/chwsfg/?show={letter}
```

**For scraping:**
- HTML previsível (MangaThemesia tem estrutura padronizada)
- Capítulos listados em `<div>` com data
- Capa, sinopse, gêneros, autor, status tudo em HTML semântico
- Já tem request aberto no keiyoushi/extensions-source (Issue #9516) para extensão Mihon
- Leitor de imagens precisa ser analisado (capítulo 404 na URL testada — pattern de URL exato precisa de confirmação)

**Riscos:**
- Cloudflare pode bloquear scraping agressivo
- Site tem 14 meses de idade — pode não ser estável a longo prazo

### 9.4 MangaFire — Engenharia Reversa

**JÁ EXISTE API WRAPPER PRONTA:**
- https://github.com/shafat-96/mangafire (Node.js + Express + cheerio + TypeScript)
- https://github.com/23008417/mangafire-api (Python FastAPI, baseado no Tachiyomi extension)
- CoorenLabs docs com endpoints documentados

**Endpoints disponíveis no wrapper Node.js:**
```
GET /api/home                  → Trendings, novos, atualizados
GET /api/search/:keyword       → Busca paginada
GET /api/manga/:id             → Detalhes do mangá
GET /api/manga/:id/chapters/:lng → Capítulos por idioma
GET /api/chapter/:chapterId    → Imagens do capítulo
GET /proxy-image?url=          → Proxy CORS
```

**Já tem suporte a proxy de imagem e multi-idioma.** Ideal para integrar rapidamente.

### 9.5 LeituraManga.net — Engenharia Reversa

**Stack detectada:**
- HTML próprio (não WordPress)
- Tem Telegram, Instagram, TikTok, Twitter
- Suporte a +18

**URL Patterns:**
```
Home:   https://leituramanga.net
Search: https://leituramanga.net/search
```

### 9.6 QueroLer.com — Engenharia Reversa

**Stack detectada:**
- HTML simples
- Busca por título
- Interface limpa

### 9.7 Conclusão — Ordem Recomendada de Implementação

Baseado na varredura completa:

| Ordem | Fonte | Método | Esforço | Impacto |
|-------|-------|--------|---------|---------|
| 1 | **MangaDex** | API v5 (já feito) | ✅ Feito | 🔥 Máximo |
| 2 | **MangaFire** | API wrapper existente | 2 dias | 🔥🔥 Alto |
| 3 | **MangaStop.net** | HTML cheerio (MangaThemesia) | 3 dias | 🔥🔥🔥 **MUITO ALTO** (fonte BR primária) |
| 4 | **LeituraManga.net** | HTML cheerio | 2 dias | 🔥 Alto |
| 5 | **QueroLer.com** | HTML cheerio | 1 dia | 🔥 Médio |
| 6 | **MangaPlus** | API oficial (Shueisha) | 1 dia | 🔥 Médio (caps recentes) |
| 7 | **MangaFox** | HTML cheerio | 2 dias | 🔥 Médio (catálogo EN) |

**FONTES BR QUE RESTAM:**
Das 17 fontes BR identificadas inicialmente, apenas **3 estão vivas e acessíveis**:
1. **MangaStop.net** — A MAIS PROMISSORA (catálogo completo, em PT-BR, ativo)
2. **LeituraManga.net** — Boa alternativa
3. **QueroLer.com** — Complementar

**ESTRATÉGIA REVISADA:**
- **MangaDex** continua sendo a fonte primária (API estável, multi-idioma)
- **MangaStop.net** deve ser a SEGUNDA fonte prioritária (BR, vivo, grande acervo)
- **MangaFire** como terceira (API wrapper já existe, PT-BR esporádico)
- Demais fontes BR mortas/comprometidas = REMOVIDAS da lista de prioridades
