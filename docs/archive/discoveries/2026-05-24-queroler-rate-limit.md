# Descoberta: QueroLer.com — rate limit + adblock detection

**Data:** 2026-05-24
**Sessão:** 18
**Fonte:** QueroLer.com (lib/api/queroler.ts)

## Problema

QueroLer.com bloqueia scrapers de duas formas:
1. **Adblock detection** — se scripts de tracking não carregarem, o conteúdo é substituído por aviso
2. **Rate limiting** — requests muito rápidos resultam em bloqueio de IP

## Solução

```typescript
const MIN_REQUEST_GAP_MS = 800  // mínimo entre requests

// rateLimitedFetch() — impõe delay entre chamadas

// isAdblocked() — checa keywords de bloqueio no HTML:
//   - se detecta bloqueio → retry 1x após 2s
//   - se ainda bloqueado → retorna resultado vazio (não quebra a página)
```

## Decisão-chave

- QueroLer é **search-only**: sem `getChapterPages()` (PDF-only, sem reader online)
- Sem dump de catálogo (PDF não serve como fallback de leitura real)
- Incluído em `searchAllSources` e `findAlternativesForReader` (descoberta), ignorado para leitura

## Gotchas

- ⚠️ QueroLer é a fonte mais LENTA — 800ms entre requests significa que buscas com muitas páginas demoram
- ⚠️ Covers são UUID-based (`/manga/cover/?id={uuid}&f={filename}.{ext}.256.jpg`) — não sequenciais como outros sites

## Referências

- `lib/api/queroler.ts` — implementação completa
- `types/queroler.ts` — tipos + helper `extractUuidFromSlug`
