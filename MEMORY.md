# MEMÓRIA DO PROJETO — Manga Hub BR

## 📋 Ficha Técnica

- **Projeto:** Manga Hub BR — agregador de mangás em português brasileiro
- **Stack:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Database:** PostgreSQL (Neon — free tier)
- **Hospedagem:** Vercel (gratuito)
- **Autenticação:** NextAuth.js
- **Cache:** Tabelas PostgreSQL + GitHub Actions (cron 30min)
- **Domínio:** registro.br (~R$ 40/ano)
- **Monetização:** Doações/Pix (sem anúncios — viola ToS da MangaDex)
- **Nível do usuário:** Iniciante
- **Idioma:** PT-BR (conteúdo já traduzido por scanlators, sem tradução automática)

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
     ┌────────▼───┐ ┌─────▼─────┐ ┌───▼────────┐
     │ MangaDex   │ │ Comick    │ │ MangaFire  │
     │ API (prim) │ │ (fallback)│ │ (fallback2)│
     └────────────┘ └───────────┘ └────────────┘
                          Fase 2
```

### Fluxo de Request

1. Usuário acessa página
2. Next.js SSR/SSG tenta buscar do cache PostgreSQL
3. Se cache válido (< 30 min), retorna direto
4. Se cache expirado, busca da MangaDex API, atualiza cache, retorna
5. Se MangaDex falhar, tenta Comick (fase 2)
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

### Fallback: Comick API (fase 2)
- **Endpoint:** `https://api.comick.io`
- **Docs:** https://api.comick.io/docs
- **Busca PT-BR:** `GET /search?q={query}&lang=pt-br`
- **Capítulos:** `GET /comic/{slug}/chapter?lang=pt-br`

### Fallback 2: MangaFire (fase 2)
- **Endpoint:** `https://mangafire.to`
- **Sem API oficial — scraping necessário**

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
manga-hub-br/
├── app/
│   ├── page.tsx                    # Home (lançamentos recentes)
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
│   │       ├── page.tsx            # Leitor de capítulos
│   │       └── loading.tsx
│   ├── busca/
│   │   └── page.tsx                # Página de busca
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts        # NextAuth config
│       └── cron/
│           └── update-cache/
│               └── route.ts        # Trigger do cron
├── lib/
│   ├── api/
│   │   └── mangadex.ts            # Cliente MangaDex API
│   ├── cache.ts                   # Cache layer (banco)
│   ├── db.ts                      # Conexão com banco
│   └── utils.ts                   # Helpers (formatação, etc.)
├── components/
│   ├── MangaCard.tsx              # Card de mangá na grid
│   ├── ChapterList.tsx            # Lista de capítulos
│   ├── Reader.tsx                 # Leitor de imagens
│   ├── Navbar.tsx                 # Navegação superior
│   ├── SearchBar.tsx              # Input de busca
│   ├── LoadingSkeleton.tsx        # Skeleton de loading
│   ├── ErrorMessage.tsx           # Mensagem de erro
│   └── EmptyState.tsx             # Estado vazio
├── types/
│   └── mangadex.ts               # Tipos TypeScript da API
├── db/
│   └── migrate.ts                 # Script de migração
├── .env.local                     # Variáveis de ambiente (local)
├── .github/
│   └── workflows/
│       └── update-cache.yml       # GitHub Actions cron
├── MEMORY.md                      # Este arquivo
└── AGENTS.md                      # Instruções para IA
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

### Por que sem anúncios?
- Termos de serviço da MangaDex API proíbem anúncios
- Alternativa: doações via Pix (QR Code estático)

### Por que não hospedar imagens?
- Evita violação de direitos autorais
- Zero custo de armazenamento/banda
- Todo conteúdo servido via CDN oficial da MangaDex

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

### Fase 1 (MVP) — MangaDex apenas ✅ EM ANDAMENTO

- [x] MEMORY.md criado
- [ ] Setup Next.js + Tailwind + dependências
- [ ] Schema do banco + migração
- [ ] Cliente MangaDex API (lib/api/mangadex.ts)
- [ ] Tipos TypeScript (types/mangadex.ts)
- [ ] Cache layer (lib/cache.ts + lib/db.ts)
- [ ] Componentes: Navbar, MangaCard, ChapterList, Reader, SearchBar, LoadingSkeleton
- [ ] Página Home (lançamentos recentes em grid)
- [ ] Página Mangá (detalhes + lista de capítulos)
- [ ] Página Leitor (navegação entre páginas)
- [ ] Página Busca (input + resultados)
- [ ] Página 404 e Error Boundary
- [ ] GitHub Actions cron (atualização a cada 30min)
- [ ] API route /api/cron/update-cache
- [ ] Deploy no Vercel
- [ ] AGENTS.md para documentação técnica

### Fase 2 — Multi-fontes

- [ ] Cliente Comick API (lib/api/comick.ts)
- [ ] Cliente MangaFire (lib/api/mangafire.ts)
- [ ] Lógica de fallback no cache layer
- [ ] Normalização de dados entre fontes

### Fase 3 — Usuários

- [ ] NextAuth.js com email (magic link)
- [ ] Tabelas users, favorites, reading_history
- [ ] Páginas de perfil
- [ ] Favoritar mangás
- [ ] Histórico de leitura
- [ ] Continuar de onde parou

### Fase 4 — Features extras

- [ ] Modo leitura vertical (webtoon)
- [ ] Comentários via Disqus/utterances
- [ ] PWA (instalável)
- [ ] Tema escuro/claro
- [ ] Doações via Pix
- [ ] Domínio próprio (.com.br)

---

## 📝 Log de Sessões

| Data | Sessão | Decisões/Progresso |
|---|---|---|
| 2026-05-24 | Sessão 1 — Planejamento | Análise do ecossistema BR, mapeamento de 112 extensões Tachiyomi, definição de arquitetura com 3 fontes, escolha de MangaDex como fonte primária. |
| 2026-05-24 | Sessão 2 — Aprovação | Usuário aprovou MVP focado em MangaDex. MEMORY.md criado como banco de memória. Início da implementação. |

---

## ⚙️ Setup Inicial

```bash
# Node.js 18+ necessário
node -v  # >= 18

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

---

## 🧪 Convenções de Código

- **Nomes:** camelCase para variáveis/funções, PascalCase para componentes/types
- **Imports:** Absolute paths com `@/` (ex: `import { x } from "@/lib/utils"`)
- **CSS:** Tailwind utility classes (sem CSS modules)
- **Componentes:** Client components (`"use client"`) só quando necessário (eventos, hooks, estado)
- **Páginas:** Server components por padrão (SSR/SSG)
- **API routes:** Next.js Route Handlers
- **Tipagem:** Sempre tipar responses da API, evitar `any`
