import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

/**
 * Encrypted on-disk store for sensitive strings (API keys, tokens).
 *
 * Uses Electron's `safeStorage` so encryption keys are owned by the OS
 * (Keychain on macOS, libsecret on Linux, DPAPI on Windows). Values are
 * persisted to <userData>/secrets.json as base64-encoded blobs with a
 * one-byte tag indicating whether the blob is OS-encrypted ('e') or a
 * plaintext fallback ('p') for environments without safeStorage.
 *
 * Renderer never receives raw key material unless it explicitly asks via
 * `secrets:get` for display in the settings page.
 */

const TAG_ENC = 'e'
const TAG_PLAIN = 'p'

let cache = null
let filePath = null

function resolveFilePath() {
  if (filePath) return filePath
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  filePath = path.join(dir, 'secrets.json')
  return filePath
}

function load() {
  if (cache) return cache
  cache = {}
  const fp = resolveFilePath()
  if (!existsSync(fp)) return cache

  try {
    const raw = JSON.parse(readFileSync(fp, 'utf8') || '{}')
    for (const [key, packed] of Object.entries(raw)) {
      cache[key] = unpack(packed)
    }
  } catch {
    cache = {}
  }
  return cache
}

function persist() {
  const fp = resolveFilePath()
  const out = {}
  for (const [key, value] of Object.entries(cache)) {
    if (value == null || value === '') continue
    out[key] = pack(value)
  }
  writeFileSync(fp, JSON.stringify(out, null, 2), 'utf8')
}

function pack(plain) {
  if (safeStorage.isEncryptionAvailable()) {
    const buf = safeStorage.encryptString(plain)
    return TAG_ENC + buf.toString('base64')
  }
  // Best-effort fallback: still base64 so we don't accidentally email a key.
  return TAG_PLAIN + Buffer.from(plain, 'utf8').toString('base64')
}

function unpack(packed) {
  if (typeof packed !== 'string' || packed.length < 2) return ''
  const tag = packed[0]
  const body = Buffer.from(packed.slice(1), 'base64')
  try {
    if (tag === TAG_ENC) return safeStorage.decryptString(body)
    if (tag === TAG_PLAIN) return body.toString('utf8')
  } catch {
    return ''
  }
  return ''
}

export const secretsService = {
  isEncryptionAvailable() {
    return safeStorage.isEncryptionAvailable()
  },

  get(key) {
    return load()[key] || ''
  },

  set(key, value) {
    const c = load()
    if (value == null || value === '') delete c[key]
    else c[key] = value
    persist()
  },

  setMany(entries) {
    const c = load()
    for (const [key, value] of Object.entries(entries || {})) {
      if (value == null || value === '') delete c[key]
      else c[key] = value
    }
    persist()
  },
}
