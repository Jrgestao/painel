import * as JR_CONFIG from './config.js?v=admin-switch-v7-20260904'

const MARKER_ID = 'jr-admin-mode-entry-v7'

function getCreateClient() {
  const api = window.supabase
  if (!api || typeof api.createClient !== 'function') return null
  return api.createClient.bind(api)
}

async function installAdminEntry() {
  if (document.getElementById(MARKER_ID)) return
  const createClient = getCreateClient()
  const url = JR_CONFIG.SUPABASE_URL
  const key = JR_CONFIG.SUPABASE_PUBLISHABLE_KEY || JR_CONFIG.SUPABASE_ANON_KEY || JR_CONFIG.ANON_KEY
  if (!createClient || !url || !key) return

  const supabase = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role,active')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || !profile?.active || profile.role !== 'admin') return

  const style = document.createElement('style')
  style.id = `${MARKER_ID}-style`
  style.textContent = `
    .jr-admin-mode-entry-v7{box-sizing:border-box!important;text-decoration:none!important;cursor:pointer!important}
    .sidebar-nav .jr-admin-mode-entry-v7{position:relative;margin-top:10px;border:1px solid rgba(255,255,255,.18)!important;background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(255,255,255,.045))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 10px 28px rgba(0,0,0,.18)!important;color:#f4f4f4!important}
    .sidebar-nav .jr-admin-mode-entry-v7:hover{border-color:rgba(255,255,255,.38)!important;background:linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.07))!important;transform:translateY(-1px)}
    .jr-admin-mode-badge{width:24px;height:24px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.32);border-radius:8px;font-size:9px;font-weight:900;letter-spacing:.08em;color:#111;background:linear-gradient(145deg,#fff,#aaa)}
    .jr-admin-mode-floating{position:fixed;right:18px;bottom:18px;z-index:99990;display:flex;align-items:center;gap:10px;padding:11px 15px;border:1px solid rgba(255,255,255,.22);border-radius:14px;color:#fff!important;background:rgba(8,8,8,.92);box-shadow:0 14px 36px rgba(0,0,0,.38);backdrop-filter:blur(12px);font:700 12px/1.1 Inter,system-ui,sans-serif}
    .jr-admin-mode-floating small{display:block;margin-bottom:2px;color:#aaa;font-size:8px;letter-spacing:.11em}
    @media(max-width:720px){.jr-admin-mode-floating{right:12px;bottom:12px;padding:10px 12px}.jr-admin-mode-floating strong{font-size:11px}}
  `
  document.head.appendChild(style)

  const link = document.createElement('a')
  link.id = MARKER_ID
  link.href = './administrativo/'
  link.setAttribute('aria-label', 'Abrir Modo Administrativo')

  const nav = document.querySelector('.sidebar-nav')
  if (nav) {
    link.className = 'nav-item jr-admin-mode-entry-v7'
    link.innerHTML = '<span class="jr-admin-mode-badge" aria-hidden="true">ADM</span><span>Administrativo</span>'
    nav.appendChild(link)
  } else {
    link.className = 'jr-admin-mode-entry-v7 jr-admin-mode-floating'
    link.innerHTML = '<span class="jr-admin-mode-badge" aria-hidden="true">ADM</span><span><small>MODO</small><strong>ADMINISTRATIVO</strong></span>'
    document.body.appendChild(link)
  }
}

const start = () => installAdminEntry().catch((error) => console.warn('[JR Administrativo]', error))
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
else start()
