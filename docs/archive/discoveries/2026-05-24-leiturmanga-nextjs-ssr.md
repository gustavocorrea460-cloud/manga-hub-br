# Descoberta: LeituraManga.net — Next.js SSR sem API exposta

**Data:** 2026-05-24
**Sessão:** 17
**Fonte:** LeituraManga.net (lib/api/leiturmanga.ts)

## Problema

LeituraManga.net é Next.js com React Query client-side:
- NÃO é WordPress/Madara (diferente do MangaStop)
- Busca nativa `/?s=` NÃO funciona (retorna homepage)
- Capítulos carregados via client-side (sem endpoint de API exposto no HTML)

## Solução

1. **Títulos:** parse do sitemap `/manga-sitemap.xml` (sitemaps individuais)
2. **Capítulos:** derivar range de first/last chapter a partir de "Ler Primeiro/Último Capítulo" na página do mangá (limite 500)
3. **Páginas:** extração direta dos `<img>` tags do SSR em `/manga/{slug}/chapter/{num}/` — CDN `cdn.leituramanga.net` SEM hotlink protection

## Decisões-chave

- ChapterId formato `{slug}:{number}` (separado por ":") — compatível com cache, navegação prev/next e fallback chain
- **Sem suporte a busca** — LeituraManga é fonte de navegação (catálogo via sitemap), não de busca
- Imagens extraídas dos `<img>` SSR (sem API necessária)

## Gotchas

- ⚠️ Chapter list é derivada por RANGE — mangás com numeração irregular (ex: 1, 2, 3, 12.5) podem ter capítulos fantasma no meio
- ⚠️ CDN `cdn.leituramanga.net` usa nomes randomizados (`page-{random}-{number}.webp`) — deduplicar por page number
- ⚠️ Telegram ativo — sinal de que o site é mantido, mas também sinal de mudanças frequentes

## Referências

- `lib/api/leiturmanga.ts` — implementação
- `lib/api/sitemap.ts` — parser de sitemaps
- `scripts/dump-leiturmanga.ts` — dump do catálogo
