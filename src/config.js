const PUBLIC_SERVER_ORIGIN = 'https://jrgestao-supa.duckdns.org:18443'
const LOCAL_PANEL = window.location.port === '8787'

export const ADMIN_API_BASE_URL = LOCAL_PANEL
  ? window.location.origin
  : `${PUBLIC_SERVER_ORIGIN}/painel-api`

// O navegador acessa o Kong/Supabase diretamente pelo Caddy.
export const SUPABASE_URL = PUBLIC_SERVER_ORIGIN

export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fkoQELhFGvusskJ0-tdaNZ_nmcD_d6S'
export const INTERNAL_LOGIN_DOMAIN = 'jrgestao.app'
export const APP_TIME_ZONE = 'America/Campo_Grande'
