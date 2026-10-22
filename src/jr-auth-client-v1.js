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
      return await renewAndRetrySafeRead(input, init, response, method, controller.signal)
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

// Renove de forma serializada para evitar consumir o mesmo refresh token em paralelo.
let renewPromise = null
async function rotateSession() {
  if (!renewPromise) {
    renewPromise = supabase.auth.refreshSession().then(({data,error}) => {
      if (error) throw error
      return data?.session ?? null
    }).finally(() => { renewPromise = null })
  }
  return renewPromise
}
export async function getFreshSession(force = false) {
  const {data,error} = await supabase.auth.getSession()
  if (error) throw error
  const session = data?.session ?? null
  if (!session?.access_token) return null
  if (!force && (!session.expires_at || session.expires_at * 1000 - Date.now() > 120000)) return session
  return await rotateSession()
}
async function renewAndRetrySafeRead(input, init, response, method, signal) {
  if (!['GET','HEAD'].includes(method) || response.status !== 401) return response
  let url
  try { url = new URL(input instanceof Request ? input.url : String(input), SUPABASE_URL) } catch { return response }
  if (url.origin !== new URL(SUPABASE_URL).origin || url.pathname.startsWith('/auth/v1/')) return response
  let message = ''
  try { message = (await response.clone().text()).slice(0, 2048) } catch {}
  if (!/jwt\s*(?:has\s*)?expired|expired\s+jwt|pgrst301|token\s+(?:has\s+)?expired/i.test(message)) return response
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
  const originalToken = (headers.get('authorization') || '').replace(/^Bearer\s+/i,'')
  if (originalToken.split('.').length !== 3) return response
  try {
    let session = await getFreshSession()
    if (!session?.access_token || session.access_token === originalToken) session = await getFreshSession(true)
    if (!session?.access_token || session.access_token === originalToken) return response
    headers.set('authorization', `Bearer ${session.access_token}`)
    return await fetch(input, {...init, headers, signal})
  } catch (e) {
    console.warn('[JR Auth] Não foi possível atualizar o JWT:', e?.message || 'Conexão indisponível')
    return response
  }
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


// Recupera sessões ao retomar o navegador sem deslogar por erros transitórios.
let checkBusy = false
async function checkActiveSession() {
  if (checkBusy || document.visibilityState === 'hidden' || !navigator.onLine) return
  checkBusy = true
  try { await getFreshSession() }
  catch (e) { console.warn('[JR Auth] Falha temporária de sessão:', e?.message || 'Conexão indisponível') }
  finally { checkBusy = false }
}
window.addEventListener('pageshow', () => { void checkActiveSession() })
window.addEventListener('focus', () => { void checkActiveSession() })
window.addEventListener('online', () => { void checkActiveSession() })
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void checkActiveSession()
})
window.setInterval(() => { void checkActiveSession() }, 120000)
