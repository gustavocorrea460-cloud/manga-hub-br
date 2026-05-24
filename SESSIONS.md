# 📝 SESSIONS — Log Persistente

```
╔═══════════════════════════════════════════════════════╗
║  Este arquivo é APPEND-ONLY.                         ║
║  Nunca editar/remover entradas passadas.             ║
║  Sempre adicionar nova sessão no topo.               ║
║  Formato: ISO 8601 | o que foi feito | decisões      ║
╚═══════════════════════════════════════════════════════╝
```

---

## Sessão 13 — 2026-05-24 | MangaStop.net Scraper + 3-fontes Source Toggle

**O que foi feito:**
- **Engenharia reversa completa do MangaStop.net** — tema `mangareader` v2.2.2 (WordPress), CDN dupla: proxy `images.mangastop.net` (protegida: Referer + token Base64) + origin `comick.jeffersondev.xyz` (sem proteção)
- **Tipos criados** (`types/mangastop.ts`) — `MangaStopSearchResult`, `MangaStopManga`, `MangaStopChapter`, helpers `extractSlug()`, `extractChapterNumber()`
- **Scraper criado** (`lib/api/mangastop.ts`):
  - `searchManga(query)` → WordPress search `/?s={query}` — extrai links `/manga/{slug}/`
  - `getManga(slug)` → parse `/manga/{slug}/` — título, capa, status, tipo, autor, gêneros, descrição
  - `getChapters(slug)` → parse `#chapterlist ul.clstyle li a[href*="-capitulo-"]` — número, título, data, URL
  - `getChapterImages(chapterUrlPath)` → fetch chapter page → regex `_ts_internal_config` → `atob(token)` → URLs do `comick.jeffersondev.xyz` (origin CDN, sem hotlink)
- **Unified adapter atualizado** (`lib/sources.ts`) — `SourceId` estendido para `"mangastop"`, funções `searchMangaStop()`, `getMangaMangaStop()`, suporte em `getChaptersSource()`, `getChapterPagesSource()`, `getSourceLabel()`
- **Source toggle atualizado** (`app/busca/page.tsx`) — 3 fontes: MangaDex ↔ MangaFire ↔ MangaStop
- **Manga detail MangaStop** (`app/manga/[slug]/page.tsx`) — `MangaDetailMangaStop` + `ChaptersSectionMangaStop`
- **Reader MangaStop** (`app/leitor/[chapterId]/page.tsx`) — `MangaStopReader` + `getPrevNextMangaStop()`, usa `absoluteUrls` (origin CDN sem proteção)
- **Documentação atualizada** — MEMORY.md (roadmap ✅), AGENTS.md (convenções), SESSIONS.md (esta sessão)
- **Build: ✅** compila sem erros (8 routes)

**Decisões:**
- MangaStop implementado DEPOIS do MangaFire (conforme planejado no roadmap)
- `getChapterImages()` decodifica `_token` via `atob()` no servidor — não expõe o proxy protegido ao cliente, serve URLs diretas do origin CDN
- Origin CDN (`comick.jeffersondev.xyz`) não tem hotlink protection — imagens vão direto pro `<img>` sem precisar de proxy
- Não implementado cache PostgreSQL para MangaStop ainda (será feito na fase de cache multi-source)
- Não implementada paginação na busca do MangaStop (WordPress search é paginada mas simplificamos para página 1)

**Próximos passos:**
- [ ] Cache PostgreSQL para MangaFire e MangaStop (source prefix nas chaves)
- [ ] Source indicator nos MangaCards (badge visual de qual fonte)
- [ ] Testar MangaStop reader no ar (verificar se imagens carregam sem proxy)
- [ ] LeituraManga.net scraper
- [ ] Script de dump do catálogo do MangaStop (metadados para PostgreSQL)

**Blocadores:** Nenhum

---

## Sessão 12 — 2026-05-24 | MangaFire Scraper + Multi-source Integration

**O que foi feito:**
- **MangaFire scraper criado** (`lib/api/mangafire.ts`) — cheerio + AJAX endpoints
  - `searchManga(query, page)` → scrape `/filter?keyword=X&page=N`
  - `getManga(id)` → scrape `/manga/{id}` (título, poster, status, gêneros, descrição)
  - `getChapters(mangaId, lang)` → AJAX `/ajax/read/{numId}/chapter/{lang}` (JSON)
  - `getChapterImages(chapterId)` → AJAX `/ajax/read/chapter/{chapterId}` (JSON)
  - `getCoverUrl(manga)` → normalize poster URL
- **Image proxy criado** (`app/api/proxy/route.ts`) — fetch com `Referer: mangafire.to` + CORS headers
- **Source toggle** adicionado à página de busca (`/busca?source=mangafire`)
  - Componente `SourceToggle` — switch MangaDex ↔ MangaFire
  - `MangaFireResults` — grid de resultados com capa, título, tipo
  - Preserva query na troca de fonte
- **MangaFire detail page** (`/manga/{slug}?source=mangafire`)
  - Renderiza dados do MangaFire (título, altTitles, poster, status, tipo, autor, gêneros, descrição)
  - Lista de capítulos com link para leitor MangaFire
  - Badge indicador de fonte (MangaFire / MangaDex)
- **Reader com suporte absoluteUrls** (`/leitor/{chapterId}?source=mangafire`)
  - Reader component aceita `absoluteUrls` prop
  - MangaFire leitor navega entre capítulos
- **Unified adapter** (`lib/sources.ts`) — `searchSource()`, `getMangaSource()`, `getChaptersSource()`
- **Bibliotecas instaladas:** cheerio
- **MEMORY.md atualizado** — arquitetura multi-fonte, roadmap revisado, decisões registradas
- **AGENTS.md atualizado** — novos arquivos, convenções multi-source, endpoints MangaFire
- **Build: ✅** compila sem erros

**Decisões:**
- MangaFire como primeiro fallback implementado (não MangaStop.net) — API wrapper existente, menor esforço
- Source toggle em vez de merge automático — UX mais clara, evita conflitos de ID entre fontes
- Image proxy separado em vez de middleware — mais simples, sem overhead em requests normais
- Reader modificado (`absoluteUrls` prop) em vez de componente separado — mínimo impacto no código existente
- MangaFire imagens SEM proxy no leitor por enquanto — URLs diretas do CDN podem funcionar sem Referer

**Próximos passos:**
- [ ] Implementar MangaStop.net scraper (WordPress MangaThemesia + Cloudflare)
- [ ] Adicionar cache PostgreSQL para MangaFire (source prefix nas chaves)
- [ ] LeituraManga.net scraper
- [ ] Source indicator no MangaCard (badge mostrando qual fonte)
- [ ] Testar MangaFire reader no ar (verificar se imagens carregam sem proxy)
- [ ] Tratar erro de capítulo 404 no MangaFire (retornar EmptyState em vez de quebrar)

**Blocadores:** Nenhum

---

## Sessão 11 — 2026-05-24 | Varredura Completa de Fontes BR

**O que foi feito:**
- **Varredura exaustiva de 17+ fontes BR** — testadas individualmente com webfetch
- **Fonte BR primária descoberta: MangaStop.net** (WordPress + MangaThemesia, catálogo completo PT-BR, Cloudflare, Discord 9k+)
- **Fonte BR secundária descoberta: LeituraManga.net** (HTML próprio, Telegram ativo, milhares de títulos)
- **Fonte BR complementar descoberta: QueroLer.com** (HTML simples, busca por título)
- **Confirmado mortas (14):** HQNow!, Tsuki Mangás, Yomu Mangás, SlimeRead, Ler Mangá, MangáNanquim, LuraToon, FlowerManga, ReMangas, MangaOnline.biz, YomuComics, MahouScan, MangaLivre.ru, MangaPark.io
- **Comick.io confirmado morto** (shutdown setembro/2025, virou tracking site)
- **Bato.to sob ameaça legal** (operador preso na China, site ainda funciona)
- **MangaFire API wrapper encontrado** (shafat-96/mangafire no GitHub — Node.js + Express + TypeScript + cheerio)
- **Engenharia reversa do MangaStop.net:** URL patterns documentados, tema MangaTheresia identificado (estrutura previsível)
- **Engenharia reversa do MangaFire:** endpoints documentados (home, search, manga, chapters, chapter images, proxy-image)
- **RESEARCH.md atualizado** — seção 9 adicionada com tabela completa de 17+ fontes

**Decisões:**
- **Nova ordem de fontes:**
  1. MangaDex (já feito) ✅
  2. **MangaStop.net** 🔥 (nova fonte BR primária — vivo, grande acervo, PT-BR)
  3. MangaFire (API wrapper já existe no GitHub)
  4. LeituraManga.net (alternativa BR)
  5. QueroLer.com (complementar)
  6. MangaPlus (oficial Shueisha)
  7. MangaFox (catálogo EN)
- Fontes BR mortas/comprometidas **removidas da lista de prioridades**
- Estratégia revisada: sem fontes BR dedicadas no curto prazo — MangaStop.net + MangaFire como fallbacks reais

---

## Sessão 10 — 2026-05-24 | Fix Reader: onError + eager loading + remotePatterns

**O que foi feito:**
- Adicionado `onError` handler no `<Image>` do leitor (Reader.tsx) — se imagem falha, mostra botão "Tentar novamente"
- Adicionado `loading="eager"` na imagem em modo single (antes: `lazy` padrão do Next.js, atrasava carregamento)
- Adicionado `key` dinâmico + `retryKey` no `<Image>` para permitir remontagem no retry
- Adicionado `remotePatterns` para `**.mangadex.network` no `next.config.ts` (CDN real das imagens de capítulos)
- Reset de `error` state em `goNext`/`goPrev`

**Diagnóstico do bug de imagens não carregarem:**
- Página do leitor renderiza corretamente (curl)
- `src` da imagem aponta para CDN correta (`*.mangadex.network`)
- Causas possíveis corrigidas:
  1. `loading="lazy"` padrão do Next.js — alterado para `"eager"` no modo single
  2. Falta de `onError` — imagem falhava silenciosamente, spinner infinito
  3. `remotePatterns` sem `*.mangadex.network` — mesmo com `unoptimized`, adicionado como segurança

**Estado do build:** ✅ Compilando

**Próximos passos:**
1. Verificar se imagens carregam no leitor em produção
2. Multi-fontes (Comick) como fallback
3. Domínio .com.br

---

## Sessão 9 — 2026-05-24 | Filtros Avançados na Busca

**O que foi feito:**
- **Filtros avançados na busca:** Sistema completo de filtros na página `/busca`
- **Tipos extendidos:** `SearchFilters`, `FilterOrder`, `TagResponse`, helper functions (`getDemographicTags`, `getGenreTags`, `getThemeTags`, `getFormatTags` em `types/mangadex.ts`
- **API:** `searchMangaWithFilters(filters)` — aceita status, year, includedTags, excludedTags, order; `getTags()` para buscar tags do MangaDex; cache de tags com TTL 6h em `lib/cache.ts`
- **Componente `SearchFilters`:** Accordion collapsible mobile-first com seções: Status (multi-select pills), Ordenação (radio), Ano (input numérico), Demografia (tags), Gêneros (include/exclude toggle), Temas, Formatos. Cada tag tem 3 estados clicáveis: off → include (✓ roxo) → exclude (✗ tachado)
- **URL state:** Todos os filtros via search params (`?q=&status=ongoing,completed&order=latestUpload&year=2020&includedTags=id1,id2&excludedTags=id3`), paginação preserva filtros
- **Botão "Limpar filtros"** com indicador visual (bolinha roxa) quando filtros ativos

**Arquivos criados/modificados:**
- `types/mangadex.ts` — SearchFilters, FilterOrder, helpers de tag groups
- `lib/api/mangadex.ts` — searchMangaWithFilters, getTags
- `lib/cache.ts` — getTagsCached (TTL 6h)
- `components/SearchFilters.tsx` — Componente de filtros completo (novo)
- `app/busca/page.tsx` — Integração de filtros com server components + Suspense

**Estado do build:** ✅ Compilando (Next.js 16 + TypeScript)

**Próximos passos:**
- Multi-fontes (Comick API como fallback)
- Zoom e Pan no leitor
- Domínio .com.br
- PWA

**Blocadores:** Nenhum

---

## Sessão 8 — 2026-05-24 | Modo Webtoon + Correções Críticas

**O que foi feito:**
- **Modo Webtoon (Long Strip):** Botão de toggle no leitor, scroll vertical com lazy loading (`loading="lazy"`), indicador de progresso em %, navegação para próximo capítulo ao chegar ao final
- **Pré-carregamento:** `<link rel="prefetch">` para a próxima página no modo single
- **Fix crítico:** `next.config.ts` — adicionado `remotePatterns` para `/data/**` e `/data-saver/**` (sem isso, imagens do leitor davam 404 em produção)
- **Fix crítico:** `fetch` com timeout de 10s (`AbortSignal.timeout`)
- **Fix:** `getMangaListCache` — trocado `LIKE` por `=` (era semanticamente incorreto)
- **Melhoria:** `leitorUrl()` helper em utils.ts — centraliza construção de URLs do leitor
- **Melhoria:** Reader refatorado — botões mais compactos, `leitorUrl()` usado em todos os links

**Estado do build:** ✅ Compilando e deployado

**Próximos passos:**
- Zoom e pan no leitor
- Filtros avançados na busca
- Multi-fontes (Comick)

---

## Sessão 7 — 2026-05-24 | Fix: Migração de Cache de Páginas

**O que foi feito:**
- Diagnóstico: cache antigo de `chapter_cache` não tinha campo `hash` → leitor gerava URL com `undefined` → 404
- `normalizeChapterPages()` criado para ler cache nos dois formatos (antigo: sem hash, novo: com hash) e com fallback `hash: ""` para o antigo
- Cache antigo de páginas limpo do banco (`DELETE FROM chapter_cache WHERE id LIKE 'pages:%'`)
- Deployado em https://manga-hub-br.vercel.app

**Estado do build:** ✅ Compilando

---

## Sessão 6 — 2026-05-24 | Fix: Migração de Cache

**O que foi feito:**
- Diagnóstico de erro em produção: cache da Home ainda no formato antigo (array) quebrava a página ao tentar ler como `{ data, total }`
- `getLatestMangasCached` agora detecta se o cache é array (formato antigo) e converte para `{ data, total }` automaticamente
- Cache antigo limpo do banco PostgreSQL

**Estado do build:** ✅ Compilando e deployado em https://manga-hub-br.vercel.app

---

## Sessão 5 — 2026-05-24 | Reforço do Sistema de Memória

**O que foi feito:**
- **AGENTS.md reescrito:** "PRIMEIRA AÇÃO AO PERDER CONTEXTO" destacado no topo, estrutura de pastas atualizada, ficha rápida com features implementadas, `git status` adicionado ao boot checklist, convenções expandidas (retorno `{ data, total }`, `mangaId` como search param)
- **MEMORY.md limpo:** stack corrigido para Next.js 16 (estava 14+), tabela de log de sessões removida (informação duplicada do `SESSIONS.md`)
- **CLAUDE.md** já referencia `@AGENTS.md` — ok

**Decisões:**
- MEMORY.md não deve mais duplicar logs de sessão — fonte única é SESSIONS.md
- AGENTS.md é o primeiro arquivo a ser lido ao perder contexto (antes de MEMORY.md), pois contém as instruções de boot + breaking changes

**Estado do build:** ✅ Compilando

**Próximos passos:**
- Fase 2 — Modos de leitura (webtoon, página dupla, zoom/pan)
- Fase 2 — Download de capítulos
- Fase 3 — Multi-fontes (Comick, MangaFire)

**Blocadores:** Nenhum

---

## Sessão 4 — 2026-05-24 | Base Robusta (Fase 1.5)

**O que foi feito:**
- **Infra:** Configurados GitHub Secrets (CRON_SECRET, VERCEL_URL) + Vercel env vars
- **Fix:** Cron route — removido `force-static` (impedia validação de auth header)
- **Paginação:** Componente `<Pagination>` compartilhado, Home e Busca com `?page=N`, limite de 30 itens por página, retorno do total de resultados da API
- **Busca:** SearchBar mantém query no input após submit, query params preservados na URL
- **Leitor — Data Saver corrigido:** `hash` agora é passada corretamente do `getChapterPages` até o componente Reader
- **Leitor — teclado:** Setas ← → e Espaço para navegar entre páginas
- **Leitor — navegação entre capítulos:** Botões "Cap. anterior" e "Próx. capítulo" aparecem na primeira/última página; navegação automática com setas ao chegar no fim/início
- **Leitor — clique nas laterais:** Terço esquerdo = anterior, terço direito = próximo
- **Leitor — scanlator:** Exibe nome do grupo tradutor no topo do leitor
- **API client:** `getLatestMangas` e `searchManga` agora retornam `{ data, total }` em vez de `Manga[]` diretamente
- **Cache layer:** Adaptado para armazenar o objeto `{ data, total }` e incluir `hash` nas pages

**Decisões:**
- `mangaId` passado como search param (`?mangaId=`) no leitor para permitir navegação entre capítulos sem reestruturar URLs
- ChapterList atualizado para incluir `mangaId` nos links do leitor

**Estado do build:** ✅ Compilando (Next.js 16 + TypeScript)

**Próximos passos:**
- Fase 2 — Modos de leitura (webtoon, página dupla, zoom/pan)
- Fase 2 — Download de capítulos
- Fase 3 — Multi-fontes (Comick, MangaFire)
- Configurar domínio próprio

**Blocadores:** Nenhum

---

## Sessão 3 — 2026-05-24 | Deploy & Infra Completa

**O que foi feito:**
- Instalado `gh` CLI (GitHub) e `vercel` CLI
- Configurado `.env.local` com DATABASE_URL real do Neon
- Rodado `npm run db:migrate` — tabelas criadas no Neon
- Criado repositório GitHub e feito push (`gustavocorrea460-cloud/manga-hub-br`)
- Feito deploy no Vercel (URL: https://manga-hub-br.vercel.app)
- Configurado env vars no Vercel: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- Fix: lazy db init (`getSql()`) para build não quebrar sem DATABASE_URL

**Estado do build:** ✅ Compilando e rodando em produção
**URL:** https://manga-hub-br.vercel.app
**Repo:** https://github.com/gustavocorrea460-cloud/manga-hub-br

**Site funcionando:**
- Home com grid de lançamentos recentes do MangaDex
- Capas carregando do CDN da MangaDex
- Labels em português (Completo, Em andamento, Hiato)
- Datas relativas em português (há 5 horas, etc.)

**Decisões:**
- Fix `db.ts` com lazy init (`getSql()`) em vez de eager (`const sql = neon(...)`)
- Tagged template Neon API (`sql`...``) em vez de `sql.query()` para compatibilidade de tipos

**Próximos passos (Futuro):**
- Configurar GitHub Secrets: CRON_SECRET, VERCEL_URL
- Configurar domínio personalizado no registro.br
- Adicionar fonte fallback Comick API (Fase 2)
- Implementar autenticação (NextAuth)
- Adicionar favoritos e histórico

**Blocadores:** Nenhum

---

## Sessão 2 — 2026-05-24 | Sistema Anti-Falha de Contexto

**O que foi feito:**
- Criado `SESSIONS.md` — log persistente append-only
- Atualizado `AGENTS.md` — boot checklist + protocolo de sumário
- Criado `.env.example` — todas as variáveis documentadas
- Adicionado scripts npm: `db:migrate`, `db:studio`, `setup`, `typecheck`

**Estado do build:** ✅ Compilando (Next.js 16 + TypeScript)

**Próximos passos imediatos:**
1. Instalar `gh` CLI + `gh auth login`
2. Instalar `vercel` CLI + `vercel login`
3. Criar conta Neon → obter DATABASE_URL
4. Voltar aqui para: `gh repo create` + push + `vercel --prod`

**Blocadores:** Nenhum (aguardando setup do usuário)

---

## Sessão 1 — 2026-05-24 | MVP Completo

**O que foi feito:**
- Análise do ecossistema BR (112 extensões Tachiyomi mapeadas)
- Definição de arquitetura: Next.js → Cache (Neon) → MangaDex API
- Projeto Next.js 16 criado com App Router + TypeScript + Tailwind
- Schema PostgreSQL: `manga_cache`, `chapter_cache`
- Cliente MangaDex API: busca, mangá, capítulos, páginas
- Cache layer com fallback (TTL 30min)
- Páginas: Home, Mangá, Leitor, Busca, 404, Error, Loading
- Componentes: Navbar, MangaCard, ChapterList, Reader, SearchBar
- Tema escuro com roxo (#6c5ce7) como accent
- GitHub Actions cron (30min)
- NextAuth.js v5 configurado (estrutura)
- MEMORY.md e AGENTS.md criados

**Decisões importantes:**
- MVP focado só em MangaDex (Comick e MangaFire na Fase 2)
- Cache em PostgreSQL em vez de Redis (simplicidade para iniciante)
- Sem anúncios (viola ToS da MangaDex), só doações Pix
- Sem hospedar imagens (tudo via CDN da MangaDex)
- API routes sem middleware (Next.js 16 mudou para proxy.ts)

**Estado do build:** ✅ Compilando

**Próximos passos:** Deploy Vercel + Neon + GitHub
