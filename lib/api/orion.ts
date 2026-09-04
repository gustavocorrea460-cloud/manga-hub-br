import { createHash } from "crypto"

/**
 * ███████████████████████████████████████████████████████████████████████████
 * ORIONCRYPTO — Reversão da criptografia da API do Nexustoons.com
 * ███████████████████████████████████████████████████████████████████████████
 *
 * O Nexustoons.com protege as respostas da API com um payload criptografado:
 *   { "d": "<base64>", "k": <índice da chave>, "v": 1 | 2 }
 *
 * Algoritmo (extraído do bundle index-C5k-fnOg.js, 2026-09-04):
 *   1. Secret = "OrionNexus2025CryptoKey!Secure" (novo app)
 *   2. Gera 5 derivadas: SHA-256("_orion_key_{n}_v2_{secret}") → hex → bytes
 *   3. Para cada chave: KSA (RC4-like) → sbox + rsbox (inversa)
 *   4. decrypt(keyIdx, b64):
 *        data = base64decode(d)
 *        para c de len-1 até 0:
 *          e = data[c] ^ (data[c-1] OU key[last] se c=0)
 *          e = rsbox[e]
 *          t = ((key[(c+3)%len] + (255 & c)) & 255) % 7 + 1
 *          e = rotateRight(e, t)
 *          e = e ^ key[c % len]
 *          out[c] = e
 *        return TextDecoder(out)
 *   5. Se v === 1 → usa índice 0; se v === 2 → usa índice k
 *
 * ⚠️ NOTA LEGAL: isto foi feito para análise/pesquisa da integração.
 *    Antes de USAR em produção contínua, verifique os termos de serviço
 *    do Nexus. Respeite DMCA e limites de rate.
 */

const NEXUS_SECRET = "OrionNexus2025CryptoKey!Secure"

interface OrionKey {
  key: number[]
  sbox: number[]
  rsbox: number[]
}

function sha256Hex(input: string): number[] {
  const digest = createHash("sha256").update(input, "utf8").digest()
  return Array.from(digest)
}

function initSboxes(key: number[]): OrionKey {
  const sbox = Array.from({ length: 256 }, (_, i) => i)
  let n = 0
  for (let a = 0; a < 256; a++) {
    n = (n + sbox[a] + key[a % key.length]) % 256
    ;[sbox[a], sbox[n]] = [sbox[n], sbox[a]]
  }
  const rsbox = new Array<number>(256)
  for (let i = 0; i < 256; i++) rsbox[sbox[i]] = i
  return { key, sbox, rsbox }
}

function rotateRight(value: number, bits: number): number {
  bits %= 8
  return 255 & ((value >>> bits) | (value << (8 - bits)))
}

export class OrionCrypto {
  private keys: OrionKey[] = []

  constructor(secret: string = NEXUS_SECRET) {
    for (let n = 0; n < 5; n++) {
      const derived = sha256Hex(`_orion_key_${n}_v2_${secret}`)
      this.keys.push(initSboxes(derived))
    }
  }

  /** Verifica se a resposta da API está no formato criptografado { d, k, v } */
  static isEncrypted(data: unknown): data is { d: string; k: number; v: number } {
    if (!data || typeof data !== "object") return false
    const t = data as Record<string, unknown>
    return (
      typeof t.d === "string" &&
      typeof t.k === "number" &&
      typeof t.v === "number" &&
      (t.v === 1 || t.v === 2)
    )
  }

  /** Decripta um payload { d, k, v } e retorna o texto plano */
  decryptPayload(payload: { d: string; k: number; v: number }): string {
    const keyIdx = payload.v === 1 ? 0 : payload.k || 0
    return this.decrypt(keyIdx, payload.d)
  }

  decrypt(keyIndex: number, b64: string): string {
    if (keyIndex < 0 || keyIndex >= 5) {
      throw new Error(`Índice de chave inválido: ${keyIndex}`)
    }
    const k = this.keys[keyIndex]
    const buf = Buffer.from(b64, "base64")
    const out = Buffer.alloc(buf.length)
    const keyLen = k.key.length
    const r = k.rsbox

    for (let c = buf.length - 1; c >= 0; c--) {
      let e = buf[c]
      e ^= c > 0 ? buf[c - 1] : k.key[keyLen - 1]
      e = r[e]
      const t = (((k.key[(c + 3) % keyLen] + (255 & c)) & 255) % 7) + 1
      e = rotateRight(e, t)
      e ^= k.key[c % keyLen]
      out[c] = e
    }
    return out.toString("utf8")
  }
}

/** Singleton — as 5 chaves derivadas são geradas uma vez por processo */
let singleton: OrionCrypto | null = null
export function getOrionCrypto(): OrionCrypto {
  if (!singleton) singleton = new OrionCrypto()
  return singleton
}

/** Helper: decripta resposta JSON { d, k, v } → objeto JS */
export async function decryptJsonResponse<T = unknown>(
  response: Response,
): Promise<T> {
  const raw = await response.json()
  if (OrionCrypto.isEncrypted(raw)) {
    const plain = getOrionCrypto().decryptPayload(raw)
    return JSON.parse(plain) as T
  }
  return raw as T
}
