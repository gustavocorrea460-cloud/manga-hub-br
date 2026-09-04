# 🔍 Análise — Nexustoons.com (SPA React + API criptografada)

**Data:** 2026-09-04
**Tipo:** Engenharia reversa de fonte para o app Manga Hub BR

---

## 🏗️ Arquitetura do Nexustoons

```
Browser (SPA React + Vite + PWA)
    │  Axios (baseURL "/api", withCredentials, CSRF via cookie)
    ▼
nexustoons.com/api (Express, Cloudflare, banco próprio)
    │  Respostas CRIPTOGRAFADAS: {d: base64, k: índice, v: versão}
    ▼
CDN: img.nx-toons.xyz (covers, manga_pages, site assets)
```

**Stack:** Next.js-like SPA (Vite build, hash `index-C5k-fnOg.js`) + backend Express + PostgreSQL/prisma (provavelmente) + Cloudflare + ads (HomeTop/global/manga_top positions) + gtag analytics.

**Padrão de proteção:** Todas as respostas de API passam por interceptor axios que decripta `{d, k, v}` com **OrionCrypto** (RC4-like + SHA-256-derivada de 5 chaves).

---

## 🔐 Criptografia OrionCrypto (REVERSED ✅)

### Algoritmo (do bundle `index-C5k-fnOg.js`)

```javascript
const SECRET = "OrionNexus2025CryptoKey!Secure";

// initFromSecret(secret):
for (let n = 0; n < 5; n++) {
  const a = `_orion_key_${n}_v2_${secret}`;
  const digest = SHA256(UTF8(a));      // 32 bytes
  keys[n] = hex(digest) → byte array;
}
// init(keys): para cada chave → sbox (RC4 KSA) + rsbox (inversa)

// decrypt(keyIndex, b64):
//   a = key bytes; r = rsbox; data = base64decode(b64)
//   for c from len-1 down to 0:
//     e = data[c] ^ (data[c-1] ou a[last] se c=0)
//     e = r[e]
//     t = ((a[(c+3)%len] + (255 & c)) & 255) % 7 + 1
//     e = rotateRight(e, t)
//     e = e ^ a[c % len]
//     out[c] = e
//   return TextDecoder(out)
```

### Quando aplica
- `v === 1` → usa key index `0`
- `v === 2` → usa key index `e.k` (as chaves 0..4)
- Response interceptor: `if (isEncryptedResponse(data) && initialized) data = processResponse(data)`

### Implementação Python (funcional, testada ✅)

```python
import json, base64, hashlib

class OrionCrypto:
    def __init__(self, secret):
        self.keys = []
        for n in range(5):
            a = f"_orion_key_{n}_v2_{secret}"
            d = hashlib.sha256(a.encode()).digest()
            self.keys.append(list(d))
        self.keys = [self._init_sboxes(k) for k in self.keys]

    def _init_sboxes(self, key):
        sbox = list(range(256))
        n = 0
        for a in range(256):
            n = (n + sbox[a] + key[a % len(key)]) % 256
            sbox[a], sbox[n] = sbox[n], sbox[a]
        rsbox = [0]*256
        for i in range(256):
            rsbox[sbox[i]] = i
        return {'key': key, 'sbox': sbox, 'rsbox': rsbox}

    def rotate_right(self, val, bits):
        bits %= 8
        return 255 & (val >> bits | val << (8 - bits))

    def decrypt(self, key_index, b64):
        k = self.keys[key_index]
        a = k['key']
        r = k['rsbox']
        data = base64.b64decode(b64)
        l = len(a)
        out = bytearray(len(data))
        for c in range(len(data)-1, -1, -1):
            e = data[c]
            e ^= data[c-1] if c > 0 else a[l-1]
            e = r[e]
            t = ((a[(c+3) % l] + (255 & c)) & 255) % 7 + 1
            e = self.rotate_right(e, t)
            e ^= a[c % l]
            out[c] = e
        return bytes(out)

crypto = OrionCrypto("OrionNexus2025CryptoKey!Secure")
data = json.load(open('payload.json'))  # {"d": "...", "k": 1, "v": 2}
plain = json.loads(crypto.decrypt(data.get('k', 0), data['d']))
```

### Implementação TypeScript no projeto (lib/api/orion.ts) ✅ INTEGRADA

A implementação oficial do projeto está em `lib/api/orion.ts` (classe `OrionCrypto`)
com `decryptPayload({d, k, v})` e singletons. Testada com payloads reais:
- `/api/read/194900` → 17 páginas decriptadas ✅
- `/api/manga/pico-marcial` → detalhes + 3862 capítulos ✅
- `/api/mangas?q=` → busca sem criptografia (13559 resultados) ✅

> ⚠️ A criptografia é proprietária do Nexus. A integração é feita com
> responsabilidade: rate limit gentil, cache e respeito a termos de serviço.
> Se o projeto for monetizado/público, reavaliar legalmente.

---

## 📡 Endpoints da API Nexus (mapeados)

### Públicos (sem auth)
| Endpoint | Query | Retorno |
|---|---|---|
| `GET /api/mangas` | `?limit=150&includeNsfw=true&sortBy=views|lastChapterAt` | `{data, limit, page, pages, total}` |
| `GET /api/mangas/trending` | `?limit=10&includeNsfw=true` | `{data}` |
| `GET /api/mangas/weekly` | `?limit=20&includeNsfw=true&metric=views|favorites` | `{data}` |
| `GET /api/manga/{slug}` | — | `{..., chapters[], categories[]}` (criptografado) |
| `GET /api/chapter/{id}` | — | dados do capítulo (criptografado) |
| `GET /api/read/{id}` | — | `{pages: [{imageUrl, pageNumber}]}` (criptografado) |
| `GET /api/categories` | — | lista de categorias |
| `GET /api/settings` | — | settings (criptografado) |
| `GET /api/ads?position=` | `home_top|global|manga_top` | ads |
| `GET /api/ranking/daily-readers` | `?limit=15` | ranking |

### Autenticados (OAuth / JWT)
- `/auth/discord|google`, `/api/me/*`, `/api/v1/conn/*` (sync de biblioteca), `/api/v1/scan/*` (para scan groups), `/api/gacha/*`, `/api/achievements`, `/api/admin/*`, `/api/me/provider-apps`

### Schema do "banco" (inferido das respostas)
```
mangas: id (int, PK), slug, title, alternativeTitles, description, coverImage,
        bannerImage, author, artist, status, type, releaseYear, rating, views,
        isNsfw, isSuggestive, isVipOnly, vipCoinCost, officialLink, rawUrl,
        publisher, studio, volumes, muRating, muVotes, muLatestChapter,
        muRelatedIds, uploaderId, lastChapterAt, chapterCount, createdAt, updatedAt
chapters: id (int, PK), mangaId (FK), number, title, views, releaseStatus,
          accessLevel, coinCost, contentType, pageToken, createdAt
categories: id, slug, name, description, type (genre|theme), isNsfw
manga_categories: id, mangaId, categoryId (join table)
pages (via /api/read/{id}): imageUrl, pageNumber
```

**CDN de imagens:** `img.nx-toons.xyz` — `covers/{id}.png` / `manga_pages/{mangaId}/{hash}_{chapterNum}/{page}.webp` — SEM hotlink protection aparente (acessível direto).

---

## 🧲 Por que essa fonte interessa para o Manga Hub BR

1. **Conteúdo PT-BR massivo** — 18k+ mangás (o `id 18294` já viu), categorias em PT (Ação, Aventura, Romance...), tipos manhua/manhwa/manga
2. **Metadata rica** — rating, views, status, publisher, studio, muRating (fonte MangaUpdates!)
3. **Páginas diretas** — CDN `img.nx-toons.xyz` sem proteção, URLs absolutas no payload
4. **API com endpoints públicos** — `/api/mangas` funciona sem auth
5. **PROBLEMA:** criptografia OrionCrypto em quase tudo (detalhe, capítulo, read) — mas **REVERSED** (podemos implementar o decrypt)

---

## ⚠️ Avisos legais/éticos (importante)

- **Verificar ToS/DMCA** do Nexus antes de usar como fonte de scraping
- A API de content não é oficialmente pública (a pública é a Connection API p/ OAuth)
- O `X-App-Key: NxT_s3cur3_k3y_2026!xK9mPqL` vazado na doc é **risco** — não usá-lo indiscriminadamente
- Nexus tem `isVipOnly` / `accessLevel` — nem todo conteúdo é free
- Considerar que o Nexus **pode bloquear** (GEO_BLOCKED aparece no bundle)
