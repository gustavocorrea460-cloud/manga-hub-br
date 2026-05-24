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
