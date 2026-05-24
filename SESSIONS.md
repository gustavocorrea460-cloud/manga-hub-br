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
