// JR Gestão: cliente Supabase único por página para evitar disputas de refresh JWT.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js?v=jr-auth-20261020'

const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') {
  throw new Error('Cliente local do Supabase não carregou.')
}

const KEEP_CONNECTED_KEY = 'jr_keep_connected'
const memoryAuthStorage = new Map()

function selectedAuthStorage() {
  try {
    return window.localStorage.getItem(KEEP_CONNECTED_KEY) === 'false'
      ? window.sessionStorage
      : window.localStorage
  } catch (_error) {
    return null
  }
}

// Um mesmo local de armazenamento para painel, serviços e administrativo.
// Quando o armazenamento funciona, nunca devolvemos um JWT antigo do cache de memória.
const authStorage = {
  getItem(key) {
    try {
      const store = selectedAuthStorage()
      if (store) return store.getItem(key)
    } catch (_error) {}
    return memoryAuthStorage.get(key) ?? null
  },
  setItem(key, value) {
    memoryAuthStorage.set(key, value)
    try {
      const store = selectedAuthStorage()
      const other = store === window.localStorage ? window.sessionStorage : window.localStorage
      store?.setItem(key, value)
      other?.removeItem(key)
    } catch (_error) {}
  },
  removeItem(key) {
    memoryAuthStorage.delete(key)
    try { window.localStorage.removeItem(key) } catch (_error) {}
    try { window.sessionStorage.removeItem(key) } catch (_error) {}
  },
}

const waitNetwork = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))
async function jrFetchWithRetry(input, init = {}) {
  const method = String(init.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase()
  const attempts = method === 'GET' || method === 'HEAD' ? 2 : 1
  let lastError

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const outside = init.signal || (input instanceof Request ? input.signal : null)
    const abort = () => controller.abort(outside?.reason)
    if (outside) {
      if (outside.aborted) abort()
      else outside.addEventListener('abort', abort, { once: true })
    }
    const timeout = window.setTimeout(
      () => controller.abort(new DOMException('Tempo de conexão esgotado.', 'TimeoutError')),
      method === 'GET' || method === 'HEAD' ? 16000 : 24000
    )
    try {
      const response = await fetch(input, { ...init, signal: controller.signal })
      if (attempt + 1 < attempts && (response.status === 429 || response.status >= 500)) {
        await waitNetwork(700 + Math.round(Math.random() * 500))
        continue
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt + 1 >= attempts || outside?.aborted) throw error
      await waitNetwork(700 + Math.round(Math.random() * 500))
    } finally {
      window.clearTimeout(timeout)
      outside?.removeEventListener?.('abort', abort)
    }
  }
  throw lastError || new Error('Falha de conexão.')
}

// Um único GoTrueClient compartilha a sessão e a renovação do token nesta página.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: jrFetchWithRetry },
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
