# TIMELINE — Manga Hub BR

> 📌 **Finalidade:** cache quente da sessão atual — onde estou, o que falta, para onde vou.
> 📌 **Referência completa:** `MEMORY.md` (knowledge base) + `SESSIONS.md` (histórico append-only)
> 📌 **Atualizar a cada checkpoint** (modificações, docs, commits).

⚠️ STOP — se você chegou aqui após compactação, leia este arquivo na íntegra antes de qualquer tool call.

---

## Sessão atual

- **Início:** 2026-06-01
- **Sessão nº:** 22
- **Tarefa em andamento:** 🔴 Análise de fontes + pesquisa de projetos para evoluir o app
- **Fase do projeto:** 2.5 — Fontes Alternativas (5 fontes integradas) ✅

## Pilha

1. 🔴 **Análise de fontes** — nexustoons.com + mangastop.net: estrutura, de onde pegam dados
2. 🔴 **Pesquisa de projetos** — open-source de manga apps, extrair melhores práticas
3. ⏸️ Testar QueroLer em produção (`/busca?source=queroler&q=one+piece`)
4. ⏸️ Revogar token antigo `ghp_7wbOgl...` (ação do USUÁRIO)
5. ⏸️ MangaPlus (oficial Shueisha) como próxima fonte

## Progresso

- **Último passo:** Implementados `/api/sources` + `/api/health` (registry) — health detectou QueroLer DOWN → removido do fallback chain. Discovery file criado.
- **Próximo passo:** Commit da implementação + docs (SESSIONS.md), depois push

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
| `docs/archive/discoveries/2026-09-04-nexustoons-structure.md` | Nexus: estrutura SPA + OrionCrypto reversed |
| `docs/archive/discoveries/2026-09-04-queroler-down.md` | QueroLer.com caído (404) — ação tomada |

## Histórico (últimas 5)

| Data | Sessão | Resumo |
|---|---|---|
| 2026-06-01 | 21 | Fase 2 — propagação de decisões + push |
| 2026-05-31 | 20 | Fase 1 — separação AGENTS.md/MEMORY.md |
| 2026-05-31 | 19 | Fase 0 — correções críticas |
| 2026-05-24 | 18 | QueroLer 5ª fonte + fallback chain |
| 2026-05-24 | 17 | LeituraManga scraper + catálogo |
