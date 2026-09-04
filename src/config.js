const PUBLIC_SERVER_ORIGIN = 'https://jrgestao-supa.duckdns.org:18443'
const LOCAL_PANEL = window.location.port === '8787'

export const ADMIN_API_BASE_URL = LOCAL_PANEL
  ? window.location.origin
  : `${PUBLIC_SERVER_ORIGIN}/painel-api`

// O navegador acessa o Kong/Supabase diretamente pelo Caddy.
export const SUPABASE_URL = PUBLIC_SERVER_ORIGIN

export const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg1MTYwNTk4LCJleHAiOjE5NDI4NDA1OTh9.cWnVn9shxS0ylqvrFcvGcWVSsPn9gQRCP9eiE7ldYao'
export const INTERNAL_LOGIN_DOMAIN = 'jrgestao.app'
export const APP_TIME_ZONE = 'America/Campo_Grande'
