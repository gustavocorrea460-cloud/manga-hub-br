# Descoberta: MangaStop.net — token `_ts_internal_config` + origin CDN

**Data:** 2026-05-24
**Sessão:** 13
**Fonte:** MangaStop.net (lib/api/mangastop.ts)

## Problema

As imagens de capítulos do MangaStop.net são protegidas:
1. Proxy `images.mangastop.net` exige token Base64 + Referer
2. Sem a decodificação correta, as páginas retornam 403/no content

## Solução (engenharia reversa)

1. Fetch da página do capítulo (`/manga/{slug}/capitulo-{n}/`)
2. Regex para extrair `_ts_internal_config` (JSON embutido no HTML)
3. Extrair o campo `_token` e decodificar com `atob(token)` no servidor
4. As URLs decodificadas apontam para o **origin CDN**: `comick.jeffersondev.xyz` (sem hotlink protection)

## Decisão-chave

- **Não expor o proxy protegido ao cliente** — decodificação acontece no servidor
- URLs do origin CDN vão direto pro `<img>` sem precisar do `/api/proxy`

## Gotchas

- ⚠️ Cloudflare presente, mas bypassável via `fetch` direto (no Node, headers de browser não são necessários)
- ⚠️ O origin CDN (`comick.jeffersondev.xyz`) NÃO é estável — se mudar de domínio, o scraper quebra
- ⚠️ WordPress theme `mangareader` v2.2.2 — se o tema atualizar, a estrutura mudará

## Referências

- `lib/api/mangastop.ts` — implementação completa
- `RESEARCH.md` §9 — engenharia reversa documentada
