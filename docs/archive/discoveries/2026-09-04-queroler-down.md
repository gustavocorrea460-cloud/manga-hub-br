# Descoberta: QueroLer.com MUDOU/Caiu (404 em todos os endpoints)

**Data:** 2026-09-04
**Sessão:** 22 (análise de fontes + health check)
**Fonte:** QueroLer.com (lib/api/queroler.ts)

## Problema

O QueroLer.com retorna **`404 page not found`** em:
- `https://queroler.com/` (raiz)
- `https://queroler.com/manga/?query=one+piece` (busca que o scraper usa)
- `https://www.queroler.com/` (variante)
- `https://queroler.com.br/` (domínio .br — não resolve, `000`)
- `https://leitor.queroler.com/` (subdomínio — não resolve, `000`)

## Contexto

Na **Sessão 18 (2026-05-24)** o QueroLer era um app **Next.js SSR funcional**:
- Busca: `GET /manga/?query={term}` — parse de `div.manga-card`
- Detalhes: `GET /manga/{uuid}/` — parse SSR
- Capítulos: tabela `#chapters-body` + API paginada

Agora (2026-09-04) **tudo retorna 404**. Possibilidades:
1. Site mudou de domínio/plataforma
2. Site foi derrubado (DMCA/infra)
3. Proteção anti-bot excessiva

## Impacto no Manga Hub BR

- `searchQueroLerCached()` / `getQueroLerMangaCached()` / `getQueroLerChaptersCached()`
  **não quebram a UI** (padrão de erro → retorna vazio/fallback), mas **não retornam dados**
- QueroLer está no `searchAllSources` e `findAlternativesForReader` — precisa ser removido
  ou o health check precisa impedi-lo de entrar no fallback chain
- O **`/api/health`** (novo, criado nesta sessão) **detectou o problema automaticamente** — prova de valor

## Ação

- [ ] Remover QueroLer de `searchAllSources` / `findAlternativesForReader` (or ajustar para usar health status)
- [ ] Atualizar registry: marcar `queroler` como... (decidir: remover ou manter como dead source documentado)
- [ ] Atualizar MEMORY.md (tabela de fontes: QueroLer ❌ morto)
- [ ] Atualizar SESSIONS.md

## Referências

- `lib/api/queroler.ts` — scraper (quebrando)
- `app/api/health/route.ts` — health check que detectou o problema
- `docs/archive/discoveries/2026-05-24-queroler-rate-limit.md` — análise original
