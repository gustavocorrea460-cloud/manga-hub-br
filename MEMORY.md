# MEMÓRIA DO PROJETO — Manga Hub BR

## 📋 Ficha Técnica

| Item | Valor |
|---|---|
| **Projeto** | Manga Hub BR — agregador de mangás em português brasileiro |
| **Stack** | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| **Database** | PostgreSQL (Neon — free tier) |
| **Deploy** | Vercel (gratuito) — https://manga-hub-br.vercel.app |
| **Autenticação** | NextAuth.js v5 (estrutura, sem providers ainda) |
| **Cache** | Tabelas PostgreSQL + GitHub Actions (cron 30min, TTL 30min) |
| **Domínio** | registro.br (~R$ 40/ano) |
| **Monetização** | Doações/Pix (sem anúncios — viola ToS da MangaDex) |
| **Nível do usuário** | Iniciante |
| **Idioma** | PT-BR (conteúdo já traduzido por scanlators, sem tradução automática) |
| **Repo** | https://github.com/gustavocorrea460-cloud/manga-hub-br |
| **Plan Mode** | `/plan` para planejar, sem edições |

### 🚀 Status Atual

**Fase atual:** 2.5 — Fontes Alternativas (5 fontes integradas) ✅
**Build:** ✅ Compilando (8 routes: /, /busca, /catalogo, /manga/[slug], /leitor/[chapterId], /api/auth, /api/cron, /api/proxy)
**Última sessão:** Sessão 19 — Fase 0 de correção da documentação

**Features implementadas:**
- Home com grid de lançamentos + paginação (`?page=N`)
- Detalhes do mangá (capa, status, tags, autor, descrição, scanlators, source badge)
- Leitor com: teclado (← → Espaço), clique lateral, navegação entre caps, Data Saver, scanlator visível, modo webtoon
- Busca por texto com paginação + filtros avançados (`?q=&page=&status=&year=`)
- **5 fontes**: MangaDex, MangaFire, MangaStop.net, LeituraManga.net (✅ ativas) + QueroLer.com (⚠️ down desde 2026-09-04)
- **Source toggle** na busca com fallback chain automática
- **Image proxy** `/api/proxy?url=` para bypass de CORS/hotlink
- **Catálogo** `/catalogo` com grid, paginação e filtro por fonte
- Cache PostgreSQL com fallback se API cair
- Tema escuro (#0f0f0f + accent roxo #6c5ce7)
- Cron de atualização automática (GitHub Actions a cada 30min)

---

## 🗺️ Arquitetura

```
                 ┌─────────────────────┐
                 │    Usuário (browser) │
                 └─────────┬───────────┘
                           │
                 ┌─────────▼───────────┐
                 │  Next.js (Vercel)   │
                 │  App Router + SSR   │
                 └─────────┬───────────┘
                           │
                 ┌─────────▼───────────┐
                 │   Cache Layer (DB)  │
                 │  PostgreSQL (Neon)  │
                 └─────────┬───────────┘
                           │
              ┌────────────┼────────────┐
               │            │            │
      ┌────────▼────────┐ ┌──────────▼────────┐
      │ MangaDex        │ │ MangaFire         │
      │ API (primária)  │ │ (scraper, fallback│
      └─────────────────┘ │  principal)       │
                          └───────────────────┘
       ┌────────▼────────┐ ┌──────────▼────────┐
       │ MangaStop.net   │ │ LeituraManga.net  │
       │ (scraper BR,    │ │ (scraper BR,     │
       │  fase 2.5)      │ │  fase 3)         │
       └─────────────────┘ └───────────────────┘
       ┌────────▼────────┐
       │ QueroLer.com    │
       │ (scraper BR,    │
       │  search-only)   │
       └─────────────────┘
                            Fase 2.5-3
```

### Fluxo de Request

1. Usuário acessa página
2. Next.js SSR/SSG tenta buscar do cache PostgreSQL
3. Se cache válido (< 30 min), retorna direto
4. Se cache expirado, busca da MangaDex API, atualiza cache, retorna
5. Se MangaDex falhar, tenta fallback chain (MangaFire → MangaStop → LeituraManga → QueroLer)
6. Se cache existir (mesmo expirado), serve como fallback

### Pipeline de Atualização

```
GitHub Actions (cron 30min)
       │
       ▼
Busca últimos 100 mangás atualizados via MangaDex API
       │
       ▼
Atualiza manga_cache + chapter_cache no PostgreSQL
       │
       ▼
Site sempre servido do cache (rápido)
```

---

## 📦 Fontes de Dados

### Primária: MangaDex API (fase 1)
- **Endpoint:** `https://api.mangadex.org`
- **Docs:** https://api.mangadex.org/docs/
- **Títulos PT-BR:** ~12.776
- **Rate limit:** 5 req/s por IP (10 req/s com autenticação)
- **Termos:** Sem anúncios no site

#### Endpoints principais

```typescript
// Buscar mangás PT-BR
GET /manga
  ?limit=20
  &offset=0
  &availableTranslatedLanguage[]=pt-br
  &includes[]=cover_art
  &order[updatedAt]=desc

// Detalhes do mangá
GET /manga/{id}
  ?includes[]=cover_art
  &includes[]=author
  &includes[]=artist

// Feed de capítulos
GET /manga/{id}/feed
  ?translatedLanguage[]=pt-br
  &limit=500
  &order[chapter]=desc
  &includes[]=scanlation_group

// Páginas do capítulo (CDN)
GET /at-home/server/{chapter-id}

// Capa do mangá
GET /cover/{cover-id}  → redireciona para CDN
Formato: https://uploads.mangadex.org/covers/{manga-id}/{cover-filename}.256.jpg
```

### Fallback principal: MangaFire (fase 2.5)
- **Site:** https://mangafire.to — agregador gringo com seletor de idioma por capítulo
- **Abordagem:** Scraping TS + cheerio (não tem API oficial)
- **Padrão comprovado:** shafat-96/mangafire (Express + cheerio, 15 stars) — endpoints `/api/home`, `/api/search/:keyword`, `/api/manga/:id`, `/api/manga/:id/chapters/:lng`, `/api/chapter/:chapterId`, `/api/proxy-image`
- **Chaves AJAX:** `/ajax/read/:numericId/chapter/:lang` e `/ajax/read/chapter/:chapterId` retornam JSON com HTML
- **Estrutura:** HTML com IDs previsíveis (`#top-trending`, `#most-viewed`, `.description`, etc.)
- **Cache:** Mesmo layer PostgreSQL (TTL 30min), chave composta `{source, id}`

### Fallback BR primário: MangaStop.net (fase 2.5) ✅ IMPLEMENTADO
- **Site:** https://mangastop.net — WordPress + tema mangareader v2.2.2, maior acervo BR vivo
- **Abordagem:** Scraping TS + cheerio (WordPress com tema previsível)
- **Cloudflare:** Presente, mas bypassável via fetch
- **Discord:** 9k+ membros, ativo
- **Issue keiyoushi:** #9516 (solicitação de extensão Mihon, aguardando)
- **Engenharia reversa concluída e implementada:** URLs documentadas em RESEARCH.md §9
- **Endpoints do scraper:** `searchManga()`, `getManga()`, `getChapters()`, `getChapterImages()`
- **Busca:** WordPress native `/?s={query}`
- **Detalhes:** `/manga/{slug}/` — extrai HTML com cheerio (título, capa, status, autor, gêneros, descrição, lista de capítulos)
- **Capítulos:** extraídos de `#chapterlist` / `ul.clstyle li a[href*="-capitulo-"]`
- **Páginas:** Fetch da página do capítulo → regex `_ts_internal_config` → `atob(token)` → URLs do `comick.jeffersondev.xyz` (origin CDN sem proteção)
- **Proxy de imagens:** Desnecessário — origin CDN não tem hotlink protection, URLs decodificadas vão direto pro `<img>`

### Fallback BR secundário: LeituraManga.net (fase 2.5) ✅ IMPLEMENTADO
- **Site:** https://leituramanga.net — Next.js com RSC + API client-side
- **Abordagem:** Scraping TS + cheerio (Next.js SSR, imagens em `<img>` tags)
- **CDN:** `https://cdn.leituramanga.net/{slug}/{uuid}/page-{random}-{number}.webp`
- **Capítulos:** Deriva range de first/last chapter (client-side React Query, sem API exposta)
- **Páginas:** Extrai `<img>` tags diretas do CDN no HTML SSR (sem hotlink protection)
- **Busca:** `/?s=` não funciona (retorna homepage)
- **Sitemap:** `/manga-sitemap.xml` com sitemaps individuais
- **Telegram:** ativo com notificações de novos capítulos
- **Acervo:** milhares de títulos PT-BR

### Fallback BR complementar: QueroLer.com (fase 2.5) ⚠️ DOWN desde 2026-09-04
- **Site:** https://queroler.com — Next.js SSR, busca por query param
- **Abordagem:** Scraping TS + cheerio (Next.js SSR, HTML estruturado)
- **Acervo:** menor (~63 caps por manga), PDF-only (sem reader online)
- **Busca:** SSR via `GET /manga/?query={term}` — parse de `div.manga-card` com UUID, título, capa, autor
- **Detalhes:** `GET /manga/{uuid}/` — parse SSR com tags semânticas (h1.font-serif, manga-detail-cover, manga-detail-info, manga-description)
- **Capítulos:** Tabela HTML `#chapters-body` com dados em `data-chapter-id` + API paginada `GET /manga/{uuid}/capitulos/?page=N`
- **Páginas:** ❌ Não implementado — QueroLer só disponibiliza PDF para download, sem reader online
- **Covers:** `GET /manga/cover/?id={uuid}&f={filename}.{ext}.256.jpg` (UUID-based, não sequencial)
- **Adblock detection:** Bloqueia conteúdo se scripts de tracking não carregarem — detecção por keywords no HTML + retry 1x
- **Rate limiting:** 800ms mínimo entre requests para evitar bloqueio
- **Cache:** `ql:*` prefix no PostgreSQL (TTL 30min)
- **Status 2026-09-04:** ❌ **DOWN** — retorna 404 em todos os endpoints (raiz, busca, www, .br). Removido do `searchAllSources` (health check detectou). Código mantido para reativação futura. Ver discovery `2026-09-04-queroler-down.md`
- **Fallback chain:** ⚠️ Removido de `searchAllSources` — mantido no registry com marcação down

### Outros agregadores considerados (status)
| Fonte | Status | Motivo |
|---|---|---|
| Comick.io | ❌ Morto | Shutdown set/2025, virou tracking site |
| Bato.to | ⚠️ Risco legal | Operador preso na China (2026) |
| HQNow! | ❌ Morto | Redireciona para netun-oum.com (adware) |
| Tsuki Mangás | ❌ Morto | Redireciona para netun-oum.com (adware) |
| Yomu Mangás | ❌ Morto | 403, sem conteúdo |
| SlimeRead | ❌ Morto | Transport error |
| Ler Mangá | ❌ Morto | Sem conteúdo real |
| MangáNanquim | ❌ Morto | Transport error |
| LuraToon | ❌ Morto | 403 |
| FlowerManga | ❌ Morto | 403 |
| ReMangas | ❌ Morto | Domínio comprometido |
| MangaOnline.biz | ❌ Morto | 403 |
| YomuComics | ❌ Morto | Cloudflare + erro |
| MahouScan | ❌ Morto | 403 |
| MangaLivre.ru | ❌ Morto | 403 |
| MangaPark.io | ❌ Morto | Redirect/erro |
| MangaFox | ✅ Vivo | EN, sem PT-BR |

---

## 🗄️ Schema do Banco

### Tabela: `manga_cache`

```sql
CREATE TABLE IF NOT EXISTS manga_cache (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_manga_cache_updated ON manga_cache(updated_at DESC);
```

### Tabela: `chapter_cache`

```sql
CREATE TABLE IF NOT EXISTS chapter_cache (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapter_cache_manga ON chapter_cache(manga_id);
CREATE INDEX idx_chapter_cache_updated ON chapter_cache(updated_at DESC);
```

### Tabela: `users` (fase 3)

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `favorites` (fase 3)

```sql
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, manga_id)
);
```

### Tabela: `reading_history` (fase 3)

```sql
CREATE TABLE IF NOT EXISTS reading_history (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_number REAL NOT NULL,
  page INTEGER NOT NULL DEFAULT 1,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, chapter_id)
);
```

---

## 📁 Estrutura de Pastas

```
/
├── app/
│   ├── page.tsx                    # Home (lançamentos recentes + paginação)
│   ├── layout.tsx                  # Layout global com Navbar
│   ├── globals.css                 # Estilos globais Tailwind
│   ├── not-found.tsx               # Página 404
│   ├── error.tsx                   # Error boundary
│   ├── loading.tsx                 # Loading global
│   ├── manga/
│   │   └── [slug]/
│   │       ├── page.tsx            # Detalhes do mangá
│   │       └── loading.tsx         # Loading da página
│   ├── leitor/
│   │   └── [chapterId]/
│   │       ├── page.tsx            # Leitor de capítulos (teclado, navegação caps)
│   │       └── loading.tsx
│   ├── busca/
│   │   └── page.tsx                # Página de busca com paginação
│   ├── catalogo/
│   │   └── page.tsx                # Catálogo de mangás (manga_catalog)
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts        # NextAuth config
│       ├── cron/
│       │   └── update-cache/
│       │       └── route.ts        # Trigger do cron (force-dynamic)
│       └── proxy/
│           └── route.ts            # Image proxy CORS/hotlink (force-dynamic)
├── lib/
│   ├── api/
│   │   ├── mangadex.ts            # Cliente MangaDex API (retorna {data, total})
│   │   ├── mangafire.ts           # Scraper MangaFire (cheerio, AJAX, proxy)
│   │   ├── mangastop.ts           # Scraper MangaStop.net (cheerio, _ts_internal_config)
│   │   ├── leiturmanga.ts         # Scraper LeituraManga.net (cheerio, Next.js SSR)
│   │   ├── queroler.ts            # Scraper QueroLer.com (cheerio, SSR, PDF-only)
│   │   └── sitemap.ts             # Parser de sitemaps XML (MangaStop + LeituraManga)
│   ├── cache.ts                   # Cache layer (banco, TTL 30min)
│   ├── db.ts                      # Conexão com banco (lazy init)
│   ├── source-fallback.ts         # Cross-source fallback chain (search, dedup, equivalent manga/chapter)
│   ├── sources.ts                 # Unified adapter multi-source
│   └── utils.ts                   # Helpers (formatação, data, etc.)
├── components/
│   ├── Pagination.tsx             # Componente de paginação compartilhado
│   ├── MangaCard.tsx              # Card de mangá na grid (suporta source badge)
│   ├── ChapterList.tsx            # Lista de capítulos
│   ├── Reader.tsx                 # Leitor (teclado, clique lateral, navegação caps, webtoon)
│   ├── Navbar.tsx                 # Navegação superior
│   ├── SearchBar.tsx              # Input de busca (mantém query + source)
│   ├── SearchFilters.tsx          # Filtros avançados (status, ano, tags, gêneros)
│   ├── SourceBadge.tsx            # Badge visual de identificação de fonte
│   ├── LoadingSkeleton.tsx        # Skeleton de loading
│   ├── ErrorMessage.tsx           # Mensagem de erro
│   └── EmptyState.tsx             # Estado vazio
├── types/
│   ├── mangadex.ts               # Tipos TypeScript da API + helpers
│   ├── mangafire.ts              # Tipos MangaFire scraper + helpers
│   ├── mangastop.ts              # Tipos MangaStop scraper + helpers
│   ├── leiturmanga.ts            # Tipos LeituraManga scraper + helpers
│   └── queroler.ts               # Tipos QueroLer scraper + helpers
├── scripts/
│   ├── dump-mangastop.ts          # Dump do catálogo MangaStop (2456 mangás)
│   └── dump-leiturmanga.ts        # Dump do catálogo LeituraManga.net
├── db/
│   └── migrate.ts                 # Script de migração
├── .env.local                     # Variáveis de ambiente (local)
├── .github/
│   └── workflows/
│       └── update-cache.yml       # GitHub Actions cron (usa CRON_SECRET + VERCEL_URL)
├── MEMORY.md                      # Fonte de verdade do projeto (arquitetura, schema, roadmap, decisões)
├── SESSIONS.md                    # Log de sessões append-only
├── AGENTS.md                      # Instruções para a IA (protocolo)
├── RESEARCH.md                    # Pesquisa de viabilidade de fontes
├── CLAUDE.md                      # @AGENTS.md
├── next.config.ts                 # Next.js config (remotePatterns, etc.)
├── package.json                   # Dependências + scripts
├── tsconfig.json                  # TypeScript config
├── eslint.config.mjs              # ESLint config
├── postcss.config.mjs              # PostCSS config
└── README.md                      # Visão geral do projeto
```

---

## 🧠 Decisões Arquiteturais

### Por que Next.js?
- SSR/SSG para carregamento rápido
- App Router com layouts aninhados
- API routes para o cron e auth
- Deploy gratuito no Vercel
- Ótimo para SEO

### Por que Neon (PostgreSQL)?
- Tier gratuito com 500MB
- PostgreSQL completo (não é SQLite)
- Serverless (ideal para Vercel)
- Conexão via HTTP (sem pooler complexo)
- Ótimo para dados estruturados JSONB

### Por que cache em PostgreSQL em vez de Redis?
- Menos serviços para gerenciar (simplifica para iniciante)
- Neon já é grátis, Redis Upstash seria outro free tier
- JSONB é performático para dados semi-estruturados
- Podemos migrar para Redis depois se necessário

### Por que GitHub Actions para cron?
- Gratuito (2000 min/mês)
- Executa a cada 30min tranquilamente
- Sem servidor dedicado
- Simples de configurar

### Por que MangaDex como fonte única na Fase 1?
- API REST oficial e documentada
- Maior acervo PT-BR (~12.776 títulos)
- Complexidade mínima para MVP
- Fallbacks adicionados na Fase 2 sem quebrar nada

### Por que priorizar agregadores BR como fontes?
- Decisão: 2026-05-24
- Público-alvo é leitor BR que quer conteúdo em português
- Agregadores BR (HQNow!, Tsuki, Yomu) têm curadoria PT-BR consistente
- MangaDex já cobre ~12.7k títulos PT-BR como base
- Fontes BR complementam com conteúdo que não está no MangaDex
- Agregadores gringos com PT-BR (Comick, MangaFire, Bato.to) ficam como fallback secundário

### Estratégia de Fontes (hierarquia — revisada 2026-05-24)
1. **MangaDex API** — primária, já implementada ✅
2. **MangaFire** — fallback principal (gringo com PT-BR via scraping) ✅
3. **MangaStop.net** — fallback BR primário (WordPress mangareader, Cloudflare) ✅
4. **LeituraManga.net** — fallback BR secundário (Next.js, RSC) ✅
5. **QueroLer.com** — fallback BR complementar (search-only, PDF) ✅
6. **MangaPlus** — oficial Shueisha (capítulos recentes PT-BR)
7. **MangaFox** — fallback EN apenas
8. **Scanlators individuais BR** — apenas sob demanda

### Critério para inclusão de fonte (revisado 2026-05-24)
- ✅ No ar com conteúdo acessível
- ✅ Conteúdo PT-BR consistente (> 100 títulos)
- ✅ Estrutura HTML sem JS pesado (scraping via cheerio)
- ✅ Imagens em qualidade aceitável
- ⚠️ Cloudflare é tolerado se HTML for previsível (ex: MangaStop.net com MangaThemesia)
- ❌ CAPTCHA ou login obrigatório são ignorados
- ❌ Sites que redirecionam para adware/domínios suspeitos são ignorados

### Por que sem anúncios?
- Termos de serviço da MangaDex API proíbem anúncios
- Alternativa: doações via Pix (QR Code estático)

### Por que não hospedar imagens?
- Evita violação de direitos autorais
- Zero custo de armazenamento/banda
- Todo conteúdo servido via CDN oficial da MangaDex

### Decisão: BR apocalypse — fontes BR abandonadas (2026-05-24)

**Contexto:** Varredura exaustiva de 17+ fontes BR no dia 24/05/2026 revelou que
APENAS 3 estão vivas. Todas as 5 fontes-alvo originais (HQNow!, Tsuki, Yomu,
SlimeRead, Ler Mangá) estão mortas.

**Decisão:** Revisão completa da estratégia de fontes:
1. ~~Agregadores BR dedicados~~ → ❌ 14/17 mortos, inviável como estratégia
2. **MangaFire migra de "fallback secundário gringo" para "fallback principal"**
3. **MangaStop.net** (descoberto na varredura) vira **fonte BR primária**
4. LeituraManga.net e QueroLer.com como complementares
5. Comick.io removido (morto desde set/2025)
6. Bato.to rebaixado (risco legal — operador preso)
7. MangaPlus mantido como opção oficial para capítulos recentes PT-BR

**Impacto:** Roadmap simplificado — menos fontes para implementar, mas as que
restaram são de maior qualidade e com padrões de scraping mais previsíveis.

### Decisão: MangaFire como primeira fonte multi-source (2026-05-24)

**Contexto:** Das novas fontes descobertas, MangaFire é a mais rápida de
implementar porque shafat-96/mangafire já documenta todos os endpoints e
padrões de scraping. AJAX endpoints retornam JSON (não precisa parsear HTML
para obter capítulos/imagens). Estrutura HTML consistente com IDs previsíveis.

**Decisão:** Implementar MangaFire primeiro, depois MangaStop.net.

**Impacto:** Primeira integração multi-source servirá como prova de conceito
para o BaseScraper + cache multi-fonte + image proxy.

### Decisão: Source toggle em vez de merge automático (2026-05-24)

**Contexto:** Com múltiplas fontes, surge a pergunta: fundir resultados de
todas as fontes ou deixar o usuário escolher?

**Decisão:** Source toggle (parâmetro `?source=`) em vez de merge automático:
- UX mais clara — o usuário sabe exatamente de onde veio cada resultado
- Evita conflitos de ID entre fontes (cada fonte tem IDs diferentes)

**Impacto:** Todas as páginas (busca, detalhes, leitor) filtram por fonte via
query param `?source=`.

### Decisão: Image proxy separado em vez de middleware (2026-05-24)

**Contexto:** Imagens do MangaFire têm hotlink protection (precisam de Referer).

**Decisão:** API route `/api/proxy` dedicada em vez de middleware:
- Mais simples, sem overhead em requests normais
- Força-dynamic para evitar cache de URLs com query

**Impacto:** `/api/proxy?url=` usado apenas quando a fonte exige (MangaFire);
fontes com CDN aberta (MangaStop, LeituraManga) usam URLs diretas no `<img>`.

### Decisão: Reader com prop `absoluteUrls` em vez de componente separado (2026-05-24)

**Contexto:** Fontes alternativas servem URLs absolutas em formatos diferentes.

**Decisão:** Reader.tsx aceita prop opcional `absoluteUrls` — mínimo impacto no
código existente, um único componente para todas as fontes.

**Impacto:** Todos os readers (MangaFire, MangaStop, LeituraManga) reutilizam o
mesmo componente Reader com URLs absolutas.

### Decisão: Cache key namespaces por fonte (2026-05-24)

**Contexto:** Multi-fonte no mesmo schema de cache. IDs de manga podem colidir
entre fontes (ex: "one-piece" pode existir no MangaStop e no MangaFire).

**Decisão:** Prefixos por fonte nas chaves de cache: `md:*` (MangaDex), `mf:*`
(MangaFire), `ms:*` (MangaStop), `llm:*` (LeituraManga), `ql:*` (QueroLer).
TTL 30min para todas (exceto tags: 6h).

### Decisão: ChapterList derivada de first/last no LeituraManga (2026-05-24)

**Contexto:** LeituraManga.net usa React Query client-side — não expõe API de
capítulos no servidor.

**Decisão:** Derivar range de capítulos a partir de first/last chapter
(campos "Ler Primeiro/Último Capítulo" da página), com limite de 500.

**Impacto:** Sem endpoint adicional; getChapters() do LeituraManga gera a lista
por range.

### Decisão: ChapterId formato `{slug}:{number}` (2026-05-24)

**Contexto:** Source-fallback precisa localizar capítulos equivalentes entre
fontes para navegação (prev/next) e deduplicação.

**Decisão:** IDs de capítulo no formato `{slug}:{number}` (separado por ":")
para fontes sem ID real (LeituraManga, MangaStop).

**Impacto:** Compatibilidade com cache, navegação prev/next e fallback chain;
`extractSlug()`/`extractChapterNumber()` helpers em cada types/ da fonte.

### Decisão: Sem busca nativa no LeituraManga (2026-05-24)

**Contexto:** Busca gringa `/?s=` do LeituraManga.net retorna a homepage (não
funciona).

**Decisão:** LeituraManga é fonte de navegação (catálogo via sitemap), não de
busca. `searchManga()` retorna vazio; busca coberta por MangaDex/MangaFire/
MangaStop/QueroLer.

### Decisão: QueroLer como search-only (2026-05-24)

**Contexto:** QueroLer.com é PDF-only — sem reader online para páginas de
capítulo.

**Decisão:** QueroLer integrado como fonte de **busca e metadados** apenas:
- Sem `getChapterPages()` (não existe reader online)
- Sem dump de catálogo (PDF não serve como fallback de leitura)
- Links para download de PDF externos nas páginas de detalhe

**Impacto:** QueroLer incluído em `searchAllSources` e `findAlternativesForReader`
(para descoberta), mas ignorado como fallback de leitura real.

### Decisão: Rate limit + adblock detection no QueroLer (2026-05-24)

**Contexto:** QueroLer bloqueia conteúdo se scripts de tracking não carregarem
(adblock detection), e barra IP se fizer requests rápido demais.

**Decisão:** `MIN_REQUEST_GAP_MS = 800ms` via `rateLimitedFetch()` + detecção
de keywords de bloqueio no HTML com retry 1x após 2s.

**Impacto:** Scraper QueroLer é o mais lento — sempre com delay entre requests
e tolerante a respostas bloqueadas.

---

## 🔌 Interface MangaDex API

### Tipos principais (types/mangadex.ts)

```typescript
interface Manga {
  id: string
  type: "manga"
  attributes: {
    title: { [lang: string]: string }
    altTitles: { [lang: string]: string }[]
    description: { [lang: string]: string }
    status: "ongoing" | "completed" | "hiatus" | "cancelled"
    year: number | null
    contentRating: "safe" | "suggestive" | "erotica" | "pornographic"
    tags: Tag[]
    updatedAt: string
  }
  relationships: Relationship[]
}

interface Chapter {
  id: string
  type: "chapter"
  attributes: {
    chapter: string | null
    title: string | null
    pages: number
    publishAt: string
    translatedLanguage: string
  }
  relationships: Relationship[]
}

interface CoverResponse {
  id: string
  type: "cover_art"
  attributes: {
    fileName: string
  }
}

interface ChapterPages {
  baseUrl: string
  chapter: {
    hash: string
    data: string[]    // nomes dos arquivos .png
    dataSaver: string[]  // nomes dos arquivos .jpg (data saver)
  }
}
```

### Funções do cliente (lib/api/mangadex.ts)

```typescript
// Busca paginada de mangás PT-BR
async function getLatestMangas(page?: number): Promise<Manga[]>

// Busca por texto
async function searchManga(query: string, page?: number): Promise<Manga[]>

// Detalhes de um mangá
async function getManga(id: string): Promise<MangaDetail>

// Capítulos de um mangá
async function getChapters(mangaId: string): Promise<Chapter[]>

// Páginas de um capítulo
async function getChapterPages(chapterId: string): Promise<ChapterPages>

// URL da capa de um mangá
function getCoverUrl(mangaId: string, fileName: string, size?: "256" | "512"): string

// Slug amigável a partir do título
function slugify(title: string): string
```

---

## 🚧 Roadmap

### Fase 1 (MVP) — MangaDex apenas ✅ COMPLETO

- [x] MEMORY.md criado
- [x] Setup Next.js + Tailwind + dependências
- [x] Schema do banco + migração
- [x] Cliente MangaDex API (lib/api/mangadex.ts)
- [x] Tipos TypeScript (types/mangadex.ts)
- [x] Cache layer (lib/cache.ts + lib/db.ts)
- [x] Componentes: Navbar, MangaCard, ChapterList, Reader, SearchBar, LoadingSkeleton,
      ErrorMessage, EmptyState, Pagination
- [x] Página Home (lançamentos recentes em grid + paginação)
- [x] Página Mangá (detalhes + lista de capítulos)
- [x] Página Leitor (navegação entre páginas, teclado, capítulos)
- [x] Página Busca (input + resultados + paginação)
- [x] Página 404 e Error Boundary
- [x] GitHub Actions cron (atualização a cada 30min)
- [x] API route /api/cron/update-cache
- [x] Deploy no Vercel
- [x] AGENTS.md para documentação técnica
- [x] GitHub Secrets configurados (CRON_SECRET, VERCEL_URL)
- [x] Cron route fix (force-dynamic em vez de force-static)
- [x] Paginação na Home e Busca
- [x] Leitor: atalhos de teclado, navegação entre capítulos, Data Saver corrigido, scanlator

### Fase 2 — Melhorias no Leitor (1-2 semanas)

- [x] Image Proxy (/api/proxy) ← KevinLmn ✅
- [x] Quality Toggle (high/data-saver) ← KevinLmn/Akari ✅
- [ ] Continue Reading (localStorage) ← KevinLmn
- [ ] Favorites (localStorage) ← Todos
- [ ] Preload Capítulo (75%) ← Akari
- [ ] PWA (Service Worker) ← MangaVerse

### Fase 2.5 — Fontes Alternativas (2-3 semanas)

- [x] **Pesquisa de viabilidade completa (BR sweep)** — 17 sites testados
- [x] Instalar cheerio + dependências de scraping
- [x] BaseScraper abstrato (search, getManga, getChapters, getPages)
- [x] Cache layer multi-fonte (source + id como chave, TTL 30min)
- [x] **Integração MangaFire** (scraper + cache, prioridade máxima — API wrapper existente) ✅
- [x] Image proxy /api/proxy (para imagens com proteção CORS/hotlink) ✅
- [x] Source switch param (?source=mangadex|mangafire|mangastop) ✅
- [x] **Integração MangaStop.net** (cheerio + WordPress mangareader theme) ✅
- [x] Source indicator UI (badges por fonte nos cards, detalhes e leitor) ✅
- [x] Cache PostgreSQL multi-source: MangaFire + MangaStop (prefixos `mf:*`, `ms:*`) ✅
- [x] Dump do catálogo MangaStop (script + tabela manga_catalog, 2456 mangás) ✅
- [x] Integração LeituraManga.net ✅
- [x] Integração QueroLer.com (search-only, PDF, rate-limited) ✅

### Fase 3 — Usuários + Gringos

- [ ] NextAuth.js com email (magic link)
- [ ] Tabelas users, favorites, reading_history
- [ ] Páginas de perfil
- [ ] Favoritar mangás
- [ ] Histórico de leitura
- [ ] Continuar de onde parou
- [x] Cliente MangaFire (lib/api/mangafire.ts) — fallback gringo ✅
- [x] Lógica de fallback no cache layer para fontes gringas (lib/source-fallback.ts — searchAllSources, findAlternativesForReader, deduplicateResults) ✅

### Fase 4 — Features extras

- [x] Modo leitura vertical (webtoon) ✅
- [ ] Comentários via Disqus/utterances
- [ ] PWA (instalável)
- [ ] Tema escuro/claro
- [ ] Doações via Pix
- [ ] Domínio próprio (.com.br)

---

> 📌 **Log de sessões completo em `SESSIONS.md`** (append-only, nunca editado)

---

## ⚙️ Setup Inicial

```bash
# Node.js 20.12+ necessário (usa --env-file nativo)
node -v  # >= 20.12

# Criar projeto
npx create-next-app@latest manga-hub-br --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Dependências
npm install @neondatabase/serverless next-auth@beta date-fns

# Variáveis de ambiente (.env.local)
DATABASE_URL=postgres://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 🔗 Referências

- **MangaDex API Docs:** https://api.mangadex.org/docs/
- **MangaDex API Swagger:** https://api.mangadex.org/swagger.html
- **Repositório Keiyoushi (extensões Tachiyomi):** https://github.com/keiyoushi/extensions-source
- **Neon PostgreSQL:** https://neon.tech
- **NextAuth.js:** https://next-auth.js.org
- **Next.js Docs:** https://nextjs.org/docs
- **Mangaeon (inspiração):** https://github.com/oMatheuss/mangaeon
- **RESEARCH.md** — pesquisa de viabilidade de 17+ fontes BR (resultados completos da varredura)
- **README.md** — visão geral do projeto

---

## 🧪 Convenções de Código

- **Nomes:** camelCase para variáveis/funções, PascalCase para componentes/types
- **Imports:** Absolute paths com `@/` (ex: `import { x } from "@/lib/utils"`)
- **CSS:** Tailwind utility classes (sem CSS modules)
- **Componentes:** Client components (`"use client"`) só quando necessário (eventos, hooks, estado)
- **Páginas:** Server components por padrão (SSR/SSG)
- **API routes:** Next.js Route Handlers
- **Tipagem:** Sempre tipar responses da API, evitar `any`
