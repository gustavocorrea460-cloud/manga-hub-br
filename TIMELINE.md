# TIMELINE — Manga Hub BR

> 📌 **Finalidade:** cache quente da sessão atual — onde estou, o que falta, para onde vou.
> 📌 **Referência completa:** `MEMORY.md` (knowledge base) + `SESSIONS.md` (histórico append-only)
> 📌 **Atualizar a cada checkpoint** (modificações, docs, commits).

⚠️ STOP — se você chegou aqui após compactação, leia este arquivo na íntegra antes de qualquer tool call.

---

## Sessão atual

- **Início:** 2026-06-01
- **Sessão nº:** 21
- **Tarefa em andamento:** Fase 3 — estrutura de resiliência (TIMELINE.md + discoveries/)
- **Fase do projeto:** 2.5 — Fontes Alternativas (5 fontes integradas) ✅

## Pilha

1. 🔴 **Fase 3** — TIMELINE.md + `docs/archive/discoveries/` + propagação de decisões já feita
2. ⏸️ Testar QueroLer em produção (`/busca?source=queroler&q=one+piece`)
3. ⏸️ Revogar token antigo `ghp_7wbOgl...` (ação do USUÁRIO)
4. ⏸️ MangaPlus (oficial Shueisha) como próxima fonte

## Progresso

- **Último passo:** Fase 3 — TIMELINE.md criado, 4 discovery files indexados, AGENTS.md atualizado (boot + referências)
- **Próximo passo:** Fase 3 finalizada — commit + SESSIONS.md (sessão 21)

## 📋 ÍNDICE

| Path | Conteúdo |
|---|---|
| `MEMORY.md` | Fonte de verdade — arquitetura, fontes, schema, roadmap, decisões |
| `SESSIONS.md` | Log append-only — histórico completo de 21 sessões |
| `AGENTS.md` | Protocolo do agente — boot, breaking changes, convenções |
| `RESEARCH.md` | Pesquisa de viabilidade de 17+ fontes BR |
| `docs/archive/discoveries/2026-05-24-mangastop-ts-token.md` | MangaStop: token `_ts_internal_config` + origin CDN |
| `docs/archive/discoveries/2026-05-24-queroler-rate-limit.md` | QueroLer: rate limit + adblock detection |
| `docs/archive/discoveries/2026-05-24-leiturmanga-nextjs-ssr.md` | LeituraManga: Next.js SSR sem API |
| `docs/archive/discoveries/2026-06-01-github-token-remote-leak.md` | Segurança: token Git na URL do remote |

## Histórico (últimas 5)

| Data | Sessão | Resumo |
|---|---|---|
| 2026-06-01 | 21 | Fase 2 — propagação de decisões + push |
| 2026-05-31 | 20 | Fase 1 — separação AGENTS.md/MEMORY.md |
| 2026-05-31 | 19 | Fase 0 — correções críticas |
| 2026-05-24 | 18 | QueroLer 5ª fonte + fallback chain |
| 2026-05-24 | 17 | LeituraManga scraper + catálogo |
