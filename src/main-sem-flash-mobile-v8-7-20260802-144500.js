// JR_GESTAO_HOTFIX_FOTOS_V30_1=20260810
// JR_GESTAO_EQUIPE_MES_ATIVOS_SITE_REAL_V8=20260805
// JR_GESTAO_SEM_FLASH_AZUL_MOBILE_V8_7=20260802-144500
// JR_GESTAO_LOADING_TEMPO_ESTETICO_V8_6=20260802-142500
// JR_GESTAO_REPARO_DUPLICIDADE_V8_4=20260802-002500
// JR_GESTAO_FLUIDEZ_TOTAL_V7 20260801-221119
// JR_GESTAO_SITE_EQUIPE_RENOMEADA_V8
// JR_GESTAO_CORRECAO_DATA_RELATORIO_DIA_ATUAL_V12
// JR_GESTAO_CORRECAO_DATA_PLANILHA_CODIGOS_V13
// JR_GESTAO_PENDENCIAS_COM_EQUIPE_V14
// JR_GESTAO_PENDENCIAS_OLHINHO_CARD_POR_EQUIPE_V15
// JR_GESTAO_CARD_PERIGO_AO_LADO_TOTAL_V16
// JR_GESTAO_MENU_ORDEM_SERVICO_V17
// JR_GESTAO_ORDENS_MES_ATUAL_BUSCA_PADRAO_V18
// JR_GESTAO_PESQUISAS_LEVES_GERAL_V19
// JR_GESTAO_PESQUISAS_LEVES_ROBUSTO_V20
// JR_GESTAO_MENU_PESQUISAR_ALINHAMENTO_ORDENS_V21
// JR_GESTAO_PESQUISAR_RELATORIO_POR_EQUIPE_V22
// JR_GESTAO_SITE_METAL_LIQUIDO_ALTERACOES_V24
// JR_GESTAO_SITE_CLEAN_LISO_V25
// JR_GESTAO_METAL_FLUIDO_LEVE_V26
// JR_GESTAO_CORRECOES_DESIGN_V27
// JR_GESTAO_CORRECOES_DESIGN_INSTALADOR_V28
// JR_GESTAO_AJUSTES_VISUAIS_CLEAN_V29
// JR_GESTAO_INTERFACE_ENXUTA_V30
// JR_GESTAO_FLUIDEZ_CALENDARIO_LOGIN_V31
// JR_GESTAO_LOGIN_LOGOUT_MOBILE_V32
// JR_GESTAO_MENU_FLUTUANTE_MOBILE_V33
// JR_GESTAO_TELA_CARREGAMENTO_METAL_V34
// JR_GESTAO_SUBSTITUIR_CARREGAMENTO_ANTIGO_V35
// JR_GESTAO_CARREGAMENTO_MOBILE_CORRIGIDO_V36
// JR_GESTAO_MOBILE_CALENDARIO_EQUIPES_V37
// JR_GESTAO_CALENDARIO_DATA_SERVICO_FIXO_V38
// JR_GESTAO_CARREGAMENTO_E_CALENDARIO_CORRIGIDOS_V39
const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') throw new Error('Cliente local do Supabase não carregou.')
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, INTERNAL_LOGIN_DOMAIN, APP_TIME_ZONE, ADMIN_API_BASE_URL } from './config-cachefix-20260731-140035.js'
import { hydrateIcons, icon } from './icons.js?v=20260731'
import { initializeUiControls, setUiControlValue, refreshCustomSelect, closeAllUiControls } from './ui-controls.js?v=20260731'
// JR_GESTAO_DATA_ORDEM_PLANILHAS_V10
// Exportações e prévias de Códigos/Relatórios em ordem cronológica.
import {
  downloadCodesWorkbook,
  downloadNamesWorkbook,
  downloadBlob,
} from './export-rede-desempenho-v6-20260801-221649.js?v=cesip-smart-v31-20260810'

const KEEP_CONNECTED_KEY = 'jr_keep_connected'
const SAVED_USERNAME_KEY = 'jr_saved_username'
const TEAM_SCORES_HIDDEN_KEY = 'jr_team_scores_hidden'
// JR_GESTAO_CORRECAO_MUITAS_SOLICITACOES_V11
const AUTO_REFRESH_BASE_MS = 90000
const AUTO_REFRESH_JITTER_MS = 30000
const AUTO_REFRESH_MIN_GAP_MS = 75000
const RATE_LIMIT_BACKOFF_BASE_MS = 120000
const DAY_ROLLOVER_CHECK_MS = 30000
const SEARCH_MIN_LENGTH = 3
const SEARCH_DEBOUNCE_MS = 380
const GLOBAL_SEARCH_LIMIT = 80
const memoryAuthStorage = new Map()
const moduleRenderCacheV31 = new Map()
let authFlowVersionV32 = 0
let logoutInProgressV32 = false
let mobileViewportFrameV32 = 0
let mobileAnchorFrameV37 = 0
let mobileTeamRenderFrameV37 = 0
let serviceDateScrollTopV38 = 0
let serviceDateTriggerRectV38 = null
let serviceDateScrollFrameV38 = 0
let serviceDateScrollLockUntilV38 = 0
let serviceDateObserverV38 = null
let photoOpenTokenV37 = 0
const teamSummaryCacheV37 = new Map()
function ensureLoadingScreenV7() {
  let screen = document.getElementById('jr-loading-screen-v7')
  if (screen) return screen

  screen = document.createElement('div')
  screen.id = 'jr-loading-screen-v7'
  screen.className = 'jr-loading-screen-v7'
  screen.hidden = true
  screen.setAttribute('role', 'status')
  screen.setAttribute('aria-live', 'polite')
  screen.setAttribute('aria-atomic', 'true')
  screen.innerHTML = `
    <div class="jr-loading-card-v7">
      <div class="jr-loading-logo-shell-v7">
        <img class="jr-loading-logo-v7" src="./assets/logo-metal-liquido-v24.png" alt="JR Gestão">
      </div>
      <strong>JR GESTÃO</strong>
      <p id="jr-loading-message-v7">Preparando o painel...</p>
      <div class="jr-loading-track-v7" aria-hidden="true"><span></span></div>
      <small>Carregando dados e deixando tudo pronto</small>
    </div>
  `
  document.body.appendChild(screen)

  const image = screen.querySelector('.jr-loading-logo-v7')
  image?.addEventListener('error', () => {
    image.src = './assets/logo.png'
  }, { once: true })

  return screen
}

function updateLoadingScreenV7(message) {
  const screen = ensureLoadingScreenV7()
  const label = screen.querySelector('#jr-loading-message-v7')
  if (label && message) label.textContent = message
}

const nextPaintV7 = () => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve))
})

function scheduleIdleV7(callback, timeout = 1000) {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback, { timeout })
  }
  return window.setTimeout(callback, Math.min(timeout, 350))
}

let safeLoadingTimerV84 = null

let safeLoadingTimerV86 = null
let safeLoadingHideTimerV86 = null
let safeLoadingShownAtV86 = 0

const SAFE_LOADING_MIN_VISIBLE_V86 = 1850
const SAFE_LOADING_FINISH_V86 = 350

function showLoadingScreenV34(message = 'Conectando ao painel...') {
  let screen = document.getElementById('jr-safe-loading-v86')

  if (!screen) {
    screen = document.createElement('div')
    screen.id = 'jr-safe-loading-v86'
    screen.className = 'jr-safe-loading-v86'
    screen.innerHTML = `
      <div class="jr-safe-loading-card-v86">
        <div class="jr-safe-loading-logo-v86">
          <img src="./assets/logo-metal-liquido-v24.png" alt="JR Gestão">
        </div>
        <strong>JR GESTÃO</strong>
        <p id="jr-safe-loading-message-v86">Conectando ao painel...</p>
        <div class="jr-safe-loading-track-v86" aria-hidden="true">
          <span></span>
        </div>
      </div>
    `
    document.body.appendChild(screen)
  }

  window.clearTimeout(safeLoadingHideTimerV86)

  if (!safeLoadingShownAtV86) {
    const bootStartedAtV87 = Number(window.__JR_BOOT_STARTED_AT_V87)
    safeLoadingShownAtV86 = Number.isFinite(bootStartedAtV87) && bootStartedAtV87 > 0
      ? bootStartedAtV87
      : Date.now()
  } else if (!screen.classList.contains('show')) {
    safeLoadingShownAtV86 = Date.now()
  }

  screen.classList.remove('finishing')

  const messageNode = document.getElementById('jr-safe-loading-message-v86')
  if (messageNode) messageNode.textContent = message

  screen.classList.add('show')

  window.clearTimeout(safeLoadingTimerV86)
  safeLoadingTimerV86 = window.setTimeout(() => {
    hideLoadingScreenV34(true)

    if (!state.profile && els.loginError) {
      els.loginError.textContent =
        'O servidor demorou para responder. Verifique o servidor e tente entrar novamente.'
    }
  }, 18000)
}
function hideLoadingScreenV34(force = false) {
  window.clearTimeout(safeLoadingTimerV86)

  const screen = document.getElementById('jr-safe-loading-v86')
  if (!screen) return

  const elapsed = safeLoadingShownAtV86
    ? Date.now() - safeLoadingShownAtV86
    : SAFE_LOADING_MIN_VISIBLE_V86

  const waitBeforeFinish = force
    ? 0
    : Math.max(0, SAFE_LOADING_MIN_VISIBLE_V86 - elapsed)

  window.clearTimeout(safeLoadingHideTimerV86)
  safeLoadingHideTimerV86 = window.setTimeout(() => {
    const messageNode = document.getElementById('jr-safe-loading-message-v86')

    if (!force && messageNode) {
      messageNode.textContent = 'Painel pronto'
    }

    screen.classList.add('finishing')

    window.setTimeout(() => {
      screen.classList.remove('show')

      window.setTimeout(() => {
        if (!screen.classList.contains('show')) screen.remove()
      }, 280)
    }, force ? 0 : SAFE_LOADING_FINISH_V86)
  }, waitBeforeFinish)
}


function keepConnectedEnabled() {
  try { return window.localStorage.getItem(KEEP_CONNECTED_KEY) !== 'false' } catch (_error) { return true }
}

function selectedAuthStorage() {
  try { return keepConnectedEnabled() ? window.localStorage : window.sessionStorage } catch (_error) { return null }
}

const safeAuthStorage = {
  getItem(key) {
    try {
      const store = selectedAuthStorage()
      const value = store?.getItem(key)
      return value === null || value === undefined ? memoryAuthStorage.get(key) ?? null : value
    } catch (_error) {
      return memoryAuthStorage.get(key) ?? null
    }
  },
  setItem(key, value) {
    memoryAuthStorage.set(key, value)
    try {
      const target = selectedAuthStorage()
      const other = keepConnectedEnabled() ? window.sessionStorage : window.localStorage
      target?.setItem(key, value)
      other?.removeItem(key)
    } catch (_error) {}
  },
  removeItem(key) {
    memoryAuthStorage.delete(key)
    try { window.localStorage.removeItem(key) } catch (_error) {}
    try { window.sessionStorage.removeItem(key) } catch (_error) {}
  },
}


const waitNetworkV6 = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function jrFetchWithRetryV6(input, init = {}) {
  const requestMethod = String(init.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase()
  const attempts = requestMethod === 'GET' || requestMethod === 'HEAD' ? 2 : 1
  let lastError

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const externalSignal = init.signal || (input instanceof Request ? input.signal : null)
    const abortFromOutside = () => controller.abort(externalSignal?.reason)
    if (externalSignal) {
      if (externalSignal.aborted) abortFromOutside()
      else externalSignal.addEventListener('abort', abortFromOutside, { once: true })
    }
    const timeoutMs = requestMethod === 'GET' || requestMethod === 'HEAD' ? 16000 : 24000
    const timeout = window.setTimeout(() => controller.abort(new DOMException('Tempo de conexão esgotado.', 'TimeoutError')), timeoutMs)

    try {
      const response = await fetch(input, { ...init, signal: controller.signal })
      if (attempt + 1 < attempts && (response.status === 429 || response.status >= 500)) {
        await waitNetworkV6(700 + Math.round(Math.random() * 500))
        continue
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt + 1 >= attempts || externalSignal?.aborted) throw error
      await waitNetworkV6(700 + Math.round(Math.random() * 500))
    } finally {
      window.clearTimeout(timeout)
      externalSignal?.removeEventListener?.('abort', abortFromOutside)
    }
  }

  throw lastError || new Error('Falha de conexão.')
}
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: jrFetchWithRetryV6 },
  auth: {
    storage: safeAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const els = {
  loginView: $('#login-view'), appView: $('#app-view'), loginForm: $('#login-form'), loginButton: $('#login-button'), loginError: $('#login-error'),
  username: $('#username'), password: $('#password'), rememberLogin: $('#remember-login'), togglePassword: $('#toggle-password'), logoutButton: $('#logout-button'), adminName: $('#admin-name'),
  sidebar: $('#sidebar'), sidebarOverlay: $('#sidebar-overlay'), mobileMenuButton: $('#mobile-menu-button'),
  globalSearchForm: $('#global-search-form'), globalSearchInput: $('#global-search-input'), globalSearchButton: $('#global-search-button'), globalSearchClearButton: $('#global-search-clear-button'), globalSearchStatus: $('#global-search-status'), globalSearchResults: $('#global-search-results'), globalSearchSummary: $('#global-search-summary'),
  dateFilter: $('#date-filter'), monthFilter: $('#month-filter'), teamFilter: $('#team-filter'), refreshButton: $('#refresh-button'), searchInput: $('#search-input'), recordKindFilter: $('#record-kind-filter'), toggleTeamScores: $('#toggle-team-scores'),
  photosRangeStart: $('#photos-range-start'), photosRangeEnd: $('#photos-range-end'), photosRangeMonth: $('#photos-range-month'),
  ordersRangeStart: $('#orders-range-start'), ordersRangeEnd: $('#orders-range-end'), ordersRangeMonth: $('#orders-range-month'),
  codesRangeStart: $('#codes-range-start'), codesRangeEnd: $('#codes-range-end'), codesRangeMonth: $('#codes-range-month'),
  reportsRangeStart: $('#reports-range-start'), reportsRangeEnd: $('#reports-range-end'), reportsRangeMonth: $('#reports-range-month'), reportsKindFilter: $('#reports-kind-filter'), reportsObservationFilter: $('#reports-observation-filter'), reportsObservationOptions: $('#reports-observation-options'), reportsSearchHelp: $('#reports-search-help'),
  photosPeriodSummary: $('#photos-period-summary'), codesPeriodSummary: $('#codes-period-summary'), reportsPeriodSummary: $('#reports-period-summary'), ordersPeriodSummary: $('#orders-period-summary'),
  periodSelectorDialog: $('#period-selector-dialog'), periodSelectorForm: $('#period-selector-form'), periodSelectorTitle: $('#period-selector-title'), periodSelectorClose: $('#period-selector-close'), periodSelectorCancel: $('#period-selector-cancel'), periodSelectorApply: $('#period-selector-apply'), periodSelectorError: $('#period-selector-error'),
  periodSingleDate: $('#period-single-date'), periodUseToday: $('#period-use-today'), periodMultipleStart: $('#period-multiple-start'), periodMultipleEnd: $('#period-multiple-end'), periodFullMonth: $('#period-full-month'), periodRangePreview: $('#period-range-preview'),
  photosRefreshButton: $('#photos-refresh-button'), codesRefreshButton: $('#codes-refresh-button'), reportsRefreshButton: $('#reports-refresh-button'), ordersRefreshButton: $('#orders-refresh-button'), photosAllDownload: $('#photos-all-download'),
  ordersSearchInput: $('#orders-search-input'), ordersSearchHelp: $('#orders-search-help'), ordersTeamFilter: $('#orders-team-filter'), ordersTableBody: $('#orders-table-body'), ordersTableCount: $('#orders-table-count'), ordersEmptyState: $('#orders-empty-state'), ordersLoadMoreButton: $('#orders-load-more-button'),
  ordersMetricOrders: $('#orders-metric-orders'), ordersMetricExecutions: $('#orders-metric-executions'), ordersMetricTeams: $('#orders-metric-teams'), ordersMetricStreets: $('#orders-metric-streets'),
  statusBanner: $('#status-banner'), connectionStatus: $('#connection-status'),
  topTotal: $('#top-total'), topPoints: $('#top-points'), topPointsDay: $('#top-points-day'), topPointsNight: $('#top-points-night'), topSurveys: $('#top-surveys'), topSurveysDay: $('#top-surveys-day'), topSurveysNight: $('#top-surveys-night'), topDeleted: $('#top-deleted'), topPhotos: $('#top-photos'), topIssues: $('#top-issues'),
  dailyScoreTotal: $('#daily-score-total'), teamScoreGrid: $('#team-score-grid'),
  tableHead: $('#table-head'), tableBody: $('#table-body'), tableCount: $('#table-count'), loadingState: $('#loading-state'), emptyState: $('#empty-state'), loadMoreButton: $('#load-more-button'),
  autoRefreshToggle: $('#auto-refresh-toggle'), toast: $('#toast'),
  detailsDialog: $('#details-dialog'), detailsTitle: $('#details-title'), detailsBody: $('#details-body'), detailsClose: $('#details-close'),
  purgeDialog: $('#purge-dialog'), purgeTitle: $('#purge-title'), purgeDescription: $('#purge-description'), purgeClose: $('#purge-close'), purgeCancel: $('#purge-cancel'), purgeConfirm: $('#purge-confirm'),
  photosTeamList: $('#photos-team-list'), photosFolderDetail: $('#photos-folder-detail'), photosFolderTitle: $('#photos-folder-title'), photosFolderSummary: $('#photos-folder-summary'), photosGrid: $('#photos-grid'), photosBackButton: $('#photos-back-button'), photosTeamDownload: $('#photos-team-download'),
  codesTeamList: $('#codes-team-list'), codesTeamDetail: $('#codes-team-detail'), codesTeamTitle: $('#codes-team-title'), codesTeamSummary: $('#codes-team-summary'), codesPreview: $('#codes-preview'), codesBackButton: $('#codes-back-button'), codesTeamDownload: $('#codes-team-download'),
  reportsTeamList: $('#reports-team-list'), reportsTeamDetail: $('#reports-team-detail'), reportsTeamTitle: $('#reports-team-title'), reportsTeamSummary: $('#reports-team-summary'), reportsPreview: $('#reports-preview'), reportsBackButton: $('#reports-back-button'), reportsTeamDownload: $('#reports-team-download'),
  adminApiStatus: $('#admin-api-status'), newAccessButton: $('#new-access-button'), reloadAccessesButton: $('#reload-accesses-button'), accessesTableBody: $('#accesses-table-body'), accessesEmpty: $('#accesses-empty'),
  accessDialog: $('#access-dialog'), accessForm: $('#access-form'), accessDialogTitle: $('#access-dialog-title'), accessDialogClose: $('#access-dialog-close'), accessCancel: $('#access-cancel'), accessSave: $('#access-save'), accessUserId: $('#access-user-id'), accessRole: $('#access-role'), accessType: $('#access-type'), accessPermission: $('#access-permission'), accessTeamNameField: $('#access-team-name-field'), accessPermissionField: $('#access-permission-field'), accessUsername: $('#access-username'), accessTeamName: $('#access-team-name'), accessPassword: $('#access-password'), accessTogglePassword: $('#access-toggle-password'), accessPasswordHelp: $('#access-password-help'), accessActive: $('#access-active'), accessFormError: $('#access-form-error'),
  archiveAccessDialog: $('#archive-access-dialog'), archiveAccessTitle: $('#archive-access-title'), archiveAccessDescription: $('#archive-access-description'), archiveAccessClose: $('#archive-access-close'), archiveAccessCancel: $('#archive-access-cancel'), archiveAccessConfirm: $('#archive-access-confirm'),
}

const state = {
  profile: null,
  profiles: [],
  records: [],
  manifests: [],
  monthRecords: [],
  monthManifests: [],
  summary: null,
  monthSummary: null,
  tab: 'valid',
  page: 'home',
  search: '',
  recordKind: 'all',
  reportKind: 'all',
  reportObservation: '',
  ordersSearch: '',
  ordersTeam: 'all',
  ordersVisibleRows: 50,
  searchTimers: { home: null, reports: null, orders: null },
  recordSearchCache: new Map(),
  ordersRangeLoading: false,
  ordersRangeFollowsCurrentMonth: true,
  ordersRange: {
    start: `${todayInCampoGrande().slice(0, 7)}-01`,
    end: addDays(monthRangeFromValue(todayInCampoGrande().slice(0, 7)).next, -1),
    records: [],
    loadedKey: '',
  },
  teamScoresHidden: false,
  visibleRows: 10,
  realtimeChannel: null,
  realtimeTimer: null,
  pollingTimer: null,
  autoRefresh: true,
  loading: false,
  lastDashboardLoadAt: 0,
  rateLimitBackoffUntil: 0,
  rateLimitFailures: 0,
  pendingDashboardRefresh: false,
  moduleTeams: { photos: null, codes: null, reports: null },
  purgeRecordId: null,
  adminApiReady: false,
  accessEditId: null,
  archiveAccessId: null,
  rangeLoading: false,
  rangeFollowsToday: true,
  lastKnownToday: todayInCampoGrande(),
  dayRolloverTimer: null,
  range: { start: todayInCampoGrande(), end: todayInCampoGrande(), records: [], manifests: [], loadedKey: '' },
  periodSelector: { target: 'reports', mode: 'day' },
}

installFluidMetalThemeV26()
prepareLightSearchUi()
finalizePanelChromeV26()
applyDesignCorrectionsV28()
applyVisualCleanupV29()
applyInterfaceCleanupV30()
applyVisualCorrectionsV31()
installMobileSessionFixV32()
installFloatingMobileMenuV33()
hydrateIcons()
initializeUiControls()
/* MOBILE_SEM_LOOP: V37 não é iniciado. */
/* MOBILE_SEM_LOOP: V38 não é iniciado; o V42 continua como único controlador móvel. */
setAllDateFilters(todayInCampoGrande())
setUiControlValue('month-filter', todayInCampoGrande().slice(0, 7))
setAllRangeFilters(todayInCampoGrande(), todayInCampoGrande())
initializeOrdersCurrentMonth()
initializePersistentUi()
bindEvents()
bootstrap()
startDayRolloverWatcher()



function installFluidMetalThemeV26() {
  if (document.body.dataset.fluidMetalV26 === 'ready') return

  document.body.dataset.fluidMetalV26 = 'ready'
  document.body.classList.remove('jr-clean-metal-v25', 'jr-metal-liquid-v24')
  document.body.classList.add('jr-fluid-metal-v26')

  document.getElementById('jr-liquid-metal-background-v24')?.remove()

  const logoPath = './assets/logo-metal-liquido-v24.png'
  document.querySelectorAll('.login-logo, .sidebar-logo, .topbar-system-logo').forEach((image) => {
    image.src = logoPath
    image.removeAttribute('srcset')
    image.loading = 'eager'
    image.decoding = 'async'
    image.style.filter = 'none'
  })
}

function normalizedChromeTextV26(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function finalizePanelChromeV26() {
  const sidebar = els.sidebar || document.getElementById('sidebar')
  const nav = sidebar?.querySelector('nav') || document.querySelector('.sidebar-nav')
  const ordersButton = document.querySelector('.nav-item[data-page="orders"]')
  const reportsButton = document.querySelector('.nav-item[data-page="reports"]')

  sidebar?.classList.add('jr-sidebar-fluid-v26')
  nav?.classList.add('jr-nav-fluid-v26')

  if (ordersButton) {
    const label = ordersButton.querySelector('span:last-child')
    if (label) label.textContent = 'Ordens de Serviço'
    ordersButton.title = 'Ordens de Serviço'
    ordersButton.classList.add('jr-orders-nav-v26')

    if (reportsButton && ordersButton.nextElementSibling !== reportsButton) {
      reportsButton.insertAdjacentElement('beforebegin', ordersButton)
    }
  }

  const topbars = [
    ...document.querySelectorAll('.admin-topbar, .topbar, .top-bar, header[role="banner"]'),
  ]

  for (const topbar of topbars) {
    topbar.classList.add('jr-topbar-fluid-v26')

    topbar.querySelectorAll(
      '.topbar-brand-copy, .topbar-system-copy, .brand-copy, .system-copy'
    ).forEach((element) => element.classList.add('jr-hidden-brand-copy-v26'))

    topbar.querySelectorAll('strong, small, span, p').forEach((element) => {
      const text = normalizedChromeTextV26(element.textContent)
      if (
        text === 'JR GESTAO' ||
        text === 'CONFERENCIA AUTOMATICA'
      ) {
        element.classList.add('jr-hidden-brand-copy-v26')
      }
    })
  }
}


function exactUiTextV27(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function applyDesignCorrectionsV28() {
  const sidebar = els.sidebar || document.getElementById('sidebar')
  if (!sidebar) return

  sidebar.classList.add('jr-sidebar-fixed-v27')

  // Remove o cartão grande “JR / GESTÃO” abaixo da logo.
  sidebar.querySelectorAll(
    '.sidebar-monogram, .sidebar-brand-card, .sidebar-brand-copy, .sidebar-title-card'
  ).forEach((element) => element.remove())

  // Remove o cartão “CONFERÊNCIA AUTOMÁTICA” por inteiro.
  sidebar.querySelectorAll(
    '.sidebar-status, .sidebar-monitor, .automatic-conference-card, .conference-status-card'
  ).forEach((element) => {
    const text = exactUiTextV27(element.textContent)
    if (
      element.matches('.sidebar-status') ||
      text.includes('CONFERENCIA AUTOMATICA')
    ) {
      element.remove()
    }
  })

  // Segurança para estruturas que não tenham as classes esperadas.
  sidebar.querySelectorAll('div, section, article, aside').forEach((element) => {
    const text = exactUiTextV27(element.textContent)
    if (
      text === 'JR GESTAO' ||
      text === 'JR GESTAO CONFERENCIA AUTOMATICA SISTEMA ATIVO E EM MONITORAMENTO' ||
      text.includes('CONFERENCIA AUTOMATICA SISTEMA ATIVO E EM MONITORAMENTO')
    ) {
      const containsNavigation = Boolean(element.querySelector('.nav-item, nav'))
      const containsLogoImage = Boolean(element.querySelector('img'))
      if (!containsNavigation && !containsLogoImage) element.remove()
    }
  })

  const ordersButton = document.querySelector('.nav-item[data-page="orders"]')
  if (ordersButton) {
    ordersButton.classList.add('jr-orders-visible-v27')
    ordersButton.title = 'Ordens de Serviço'
    const label = ordersButton.querySelector('span:last-child')
    if (label) label.textContent = 'Ordens de Serviço'
  }

  stabilizeSidebarLayoutV27(sidebar)
  cleanTeamFolderCardsV27()
  cleanTopbarV27()
}

function stabilizeSidebarLayoutV27(sidebar) {
  const shell = sidebar.parentElement
  if (!shell || shell === document.body || shell === document.documentElement) return

  const overlay = els.sidebarOverlay || document.getElementById('sidebar-overlay')
  const candidates = [...shell.children].filter((element) => {
    if (element === sidebar || element === overlay) return false
    if (element.matches('script, style, link')) return false
    return (
      element.matches('.admin-main, .main-content, .app-content, .content-shell, main') ||
      Boolean(element.querySelector('.admin-topbar, .page-section, main'))
    )
  })

  const content = candidates[0]
  if (!content) return

  shell.classList.add('jr-shell-layout-v27')
  content.classList.add('jr-shell-content-v27')
}

function cleanTeamFolderCardsV27() {
  document.querySelectorAll('.team-folder-card').forEach((card) => {
    card.classList.add('jr-team-folder-card-v27')
    const copy = card.querySelector('.folder-card-copy')
    copy?.classList.add('jr-folder-copy-v27')
  })
}

function cleanTopbarV27() {
  document.querySelectorAll(
    '.admin-topbar, .topbar, .top-bar, header[role="banner"]'
  ).forEach((topbar) => {
    topbar.querySelectorAll(
      '.topbar-brand-copy, .topbar-system-copy, .brand-copy, .system-copy'
    ).forEach((element) => element.remove())

    topbar.querySelectorAll('strong, small, span, p').forEach((element) => {
      const text = exactUiTextV27(element.textContent)
      if (text === 'JR GESTAO' || text === 'CONFERENCIA AUTOMATICA') {
        const parent = element.parentElement
        element.remove()
        if (
          parent &&
          parent.children.length === 0 &&
          !parent.matches('button, a')
        ) {
          parent.remove()
        }
      }
    })
  })
}


function applyVisualCleanupV29() {
  removeLoginDecorationV29()
  removeWelcomeDecorationV29()
  simplifySidebarBrandV29()
  centerSidebarNavigationV29()
  cleanTopbarV29()
  cleanTeamCardsV29()
}

function removeLoginDecorationV29() {
  document.querySelectorAll('.login-brand-panel, .login-brand, .login-hero').forEach((panel) => {
    panel.classList.add('jr-login-clean-v29')

    panel.querySelectorAll(
      '.liquid-wave, .liquid-metal, .metal-blob, .liquid-blob, .brand-blob, .login-decoration, [aria-hidden="true"]'
    ).forEach((element) => {
      if (!element.querySelector('img, h1, h2, h3, p, strong, small')) {
        element.remove()
      }
    })
  })
}

function removeWelcomeDecorationV29() {
  document.querySelectorAll('.welcome-banner, .welcome-card, .dashboard-hero').forEach((banner) => {
    banner.classList.add('jr-welcome-clean-v29')

    banner.querySelectorAll(
      '.liquid-wave, .liquid-metal, .metal-blob, .liquid-blob, .welcome-decoration, [aria-hidden="true"]'
    ).forEach((element) => {
      if (!element.querySelector('img, h1, h2, h3, p, strong, small')) {
        element.remove()
      }
    })
  })
}

function simplifySidebarBrandV29() {
  const sidebar = els.sidebar || document.getElementById('sidebar')
  if (!sidebar) return

  const logoContainer =
    sidebar.querySelector('.sidebar-logo') ||
    sidebar.querySelector('.sidebar-brand-logo') ||
    sidebar.querySelector('.brand-logo')

  if (logoContainer) {
    logoContainer.classList.add('jr-sidebar-logo-clean-v29')

    const image = logoContainer.matches('img')
      ? logoContainer
      : logoContainer.querySelector('img')

    image?.classList.add('jr-sidebar-logo-image-v29')
  }
}

function centerSidebarNavigationV29() {
  const sidebar = els.sidebar || document.getElementById('sidebar')
  const nav = sidebar?.querySelector('nav') || sidebar?.querySelector('.sidebar-nav')

  sidebar?.classList.add('jr-sidebar-centered-v29')
  nav?.classList.add('jr-sidebar-nav-centered-v29')
}

function cleanTopbarV29() {
  document.querySelectorAll(
    '.admin-topbar, .topbar, .top-bar, header[role="banner"]'
  ).forEach((topbar) => {
    topbar.classList.add('jr-topbar-clean-v29')

    topbar.querySelectorAll(
      '.topbar-system-logo, .topbar-logo, .system-logo, .header-logo'
    ).forEach((logo) => {
      const parent = logo.parentElement
      logo.remove()

      if (
        parent &&
        parent.children.length === 0 &&
        !parent.matches('button, a')
      ) {
        parent.remove()
      }
    })

    const account =
      topbar.querySelector('.topbar-user-card') ||
      topbar.querySelector('.user-card') ||
      topbar.querySelector('.account-card')

    account?.classList.add('jr-user-card-clean-v29')

    const logout =
      topbar.querySelector('#logout-button') ||
      [...topbar.querySelectorAll('button, a')].find((element) =>
        exactUiTextV27(element.textContent) === 'SAIR'
      )

    logout?.classList.add('jr-logout-clean-v29')
  })
}

function cleanTeamCardsV29() {
  document.querySelectorAll('.team-folder-card').forEach((card) => {
    card.classList.add('jr-team-card-clean-v29')

    const copy =
      card.querySelector('.folder-card-copy') ||
      card.querySelector('.jr-folder-copy-v27') ||
      card.children[1]

    if (copy) copy.classList.add('jr-team-copy-clean-v29')
  })
}


function applyInterfaceCleanupV30() {
  removeHomeStatusV30()
  simplifyOrdersToolbarV30()
  configureModuleToolbarV30('photos')
  configureModuleToolbarV30('reports')
  removeModuleCardArrowsV30()
  lowerSidebarBrandV30()
  removeTopGradientBandV30()
}

function removeHomeStatusV30() {
  els.statusBanner?.remove()
}

function simplifyOrdersToolbarV30() {
  const toolbar = document.querySelector('[data-range-toolbar="orders"]')
  toolbar?.classList.add('orders-toolbar-clean-v30')

  document.getElementById('orders-search-help')?.remove()
  els.ordersSearchHelp = null

  toolbar?.querySelectorAll('.orders-toolbar-help-v21, .light-search-help-v19').forEach((element) => {
    element.remove()
  })

  const period = document.querySelector('[data-open-period-selector="orders"]')
  period?.querySelector('.period-selector-copy em')?.remove()
  period?.closest('.period-selector-wrap')?.classList.add('orders-period-clean-v30')
}

function configureModuleToolbarV30(target) {
  const toolbar = document.querySelector(`[data-range-toolbar="${target}"]`)
  if (!toolbar) return

  toolbar.classList.add('module-toolbar-uniform-v30', `module-toolbar-${target}-v30`)

  const periodButton = toolbar.querySelector(`[data-open-period-selector="${target}"]`)
  const periodWrap = periodButton?.closest('.period-selector-wrap') || periodButton

  periodWrap?.classList.add('module-period-control-v30')
  periodButton?.querySelector('.period-selector-copy em')?.remove()

  toolbar.querySelectorAll('button').forEach((button) => {
    if (button !== periodButton) button.classList.add('module-action-control-v30')
  })

  if (target === 'reports') {
    const kindControl =
      els.reportsKindFilter?.closest('.custom-select-control') ||
      els.reportsKindFilter?.closest('label') ||
      els.reportsKindFilter?.parentElement

    kindControl?.classList.add('module-filter-control-v30')
  }
}

function removeModuleCardArrowsV30() {
  els.photosTeamList?.classList.add('module-team-list-no-arrow-v30')
  els.reportsTeamList?.classList.add('module-team-list-no-arrow-v30')
}

function lowerSidebarBrandV30() {
  const sidebar = els.sidebar || document.getElementById('sidebar')
  const logo =
    sidebar?.querySelector('.sidebar-logo') ||
    sidebar?.querySelector('.sidebar-brand-logo') ||
    sidebar?.querySelector('.brand-logo')

  const nav = sidebar?.querySelector('nav') || sidebar?.querySelector('.sidebar-nav')

  sidebar?.classList.add('sidebar-brand-lowered-v30')
  logo?.classList.add('sidebar-logo-lowered-v30')
  nav?.classList.add('sidebar-nav-below-logo-v30')
}

function removeTopGradientBandV30() {
  document.body.classList.add('top-gradient-removed-v30')

  document.querySelectorAll(
    '.admin-topbar, .topbar, .top-bar, header[role="banner"], .main-content, .app-content'
  ).forEach((element) => {
    element.classList.add('flat-top-background-v30')
  })
}


function applyVisualCorrectionsV31() {
  document.body.classList.add('jr-performance-v31')

  document.querySelectorAll(
    '[data-open-period-selector="photos"], [data-open-period-selector="reports"]'
  ).forEach((button) => {
    button.classList.add('period-card-left-v31')
  })

  els.periodSelectorDialog?.classList.add('period-dialog-clean-v31')
  els.loginForm?.classList.add('login-form-clean-v31')
}

function moduleRenderKeyV31(target) {
  const rangeKey = `${state.range.loadedKey}|${state.range.records.length}|${state.range.manifests.length}`
  const ordersKey = `${state.ordersRange.loadedKey}|${state.ordersRange.records.length}`

  if (target === 'photos') {
    return `${rangeKey}|${state.moduleTeams.photos || ''}`
  }

  if (target === 'codes') {
    return `${rangeKey}|${state.moduleTeams.codes || ''}`
  }

  if (target === 'reports') {
    return `${rangeKey}|${state.reportKind}|${state.reportObservation}|${state.moduleTeams.reports || ''}`
  }

  if (target === 'orders') {
    return `${ordersKey}|${state.ordersTeam}|${state.ordersSearch}|${state.ordersVisibleRows}`
  }

  return target
}

function renderCurrentModuleV31(target, force = false) {
  if (!['photos', 'codes', 'reports', 'orders'].includes(target)) return

  const key = moduleRenderKeyV31(target)
  if (!force && moduleRenderCacheV31.get(target) === key) return

  const teams = target === 'orders' ? null : teamsForRange()

  if (target === 'photos') {
    renderPhotoTeams(teams)
    if (state.moduleTeams.photos) refreshOpenPhotoFolder()
  } else if (target === 'codes') {
    renderCodeTeams(teams)
    if (state.moduleTeams.codes) openCodesTeam(state.moduleTeams.codes, true)
  } else if (target === 'reports') {
    syncReportSearchAvailability()
    renderReportTeams(teams)
    if (state.moduleTeams.reports) openReportsTeam(state.moduleTeams.reports, true)
  } else if (target === 'orders') {
    renderOrdersPage()
  }

  moduleRenderCacheV31.set(target, moduleRenderKeyV31(target))
}

function scheduleCurrentModuleRenderV31(target) {
  if (!['photos', 'codes', 'reports', 'orders'].includes(target)) return

  window.requestAnimationFrame(() => {
    renderCurrentModuleV31(target, false)
  })
}


function updateMobileViewportV32() {
  cancelAnimationFrame(mobileViewportFrameV32)

  mobileViewportFrameV32 = requestAnimationFrame(() => {
    const viewportHeight = Math.round(
      window.visualViewport?.height ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      800
    )

    document.documentElement.style.setProperty('--jr-mobile-vh-v32', `${viewportHeight}px`)
  })
}

function closeDialogsForSessionChangeV32() {
  document.querySelectorAll('dialog[open]').forEach((dialog) => {
    try { dialog.close() } catch (_error) { dialog.removeAttribute('open') }
  })

  document.querySelectorAll(
    '.dialog-overlay.show, .modal-overlay.show, .picker-popover.open, .custom-select-menu.open'
  ).forEach((element) => {
    element.classList.remove('show', 'open', 'active')
  })
}

function clearMobileInteractionLocksV32(mode) {
  try { closeAllUiControls() } catch (_error) {}
  try { closeSidebar() } catch (_error) {}

  closeDialogsForSessionChangeV32()

  const active = document.activeElement
  if (active && typeof active.blur === 'function') active.blur()

  const overlay = els.sidebarOverlay || document.getElementById('sidebar-overlay')
  if (overlay) {
    overlay.classList.remove('show', 'open', 'active')
    overlay.setAttribute('aria-hidden', 'true')
    overlay.style.removeProperty('display')
    overlay.style.removeProperty('pointer-events')
    overlay.style.removeProperty('opacity')
  }

  const sidebar = els.sidebar || document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.remove('open', 'show', 'active')
    sidebar.setAttribute('aria-hidden', mode === 'login' ? 'true' : 'false')
  }

  ;[document.documentElement, document.body].forEach((element) => {
    element.classList.remove(
      'menu-open',
      'sidebar-open',
      'modal-open',
      'dialog-open',
      'no-scroll',
      'overflow-hidden'
    )

    element.style.removeProperty('overflow')
    element.style.removeProperty('overflow-x')
    element.style.removeProperty('overflow-y')
    element.style.removeProperty('position')
    element.style.removeProperty('inset')
    element.style.removeProperty('top')
    element.style.removeProperty('left')
    element.style.removeProperty('right')
    element.style.removeProperty('bottom')
    element.style.removeProperty('width')
    element.style.removeProperty('height')
    element.style.removeProperty('touch-action')
    element.style.removeProperty('pointer-events')
  })

  document.body.dataset.mobileSessionV32 = mode
  updateMobileViewportV32()
}

function setSessionViewsV32(mode) {
  const appActive = mode === 'app'

  clearMobileInteractionLocksV32(mode)

  if (els.loginView) {
    els.loginView.classList.toggle('hidden', appActive)
    els.loginView.setAttribute('aria-hidden', String(appActive))
    els.loginView.inert = appActive
  }

  if (els.appView) {
    els.appView.classList.toggle('hidden', !appActive)
    els.appView.setAttribute('aria-hidden', String(!appActive))
    els.appView.inert = !appActive
  }

  setMobileViewportMode(mode)

  requestAnimationFrame(() => {
    clearMobileInteractionLocksV32(mode)

    requestAnimationFrame(() => {
      updateMobileViewportV32()

      if (!appActive && els.username && window.matchMedia('(min-width: 901px)').matches) {
        els.username.focus({ preventScroll: true })
      }
    })
  })
}

function installMobileSessionFixV32() {
  document.body.classList.add('jr-mobile-session-v32')
  updateMobileViewportV32()

  window.visualViewport?.addEventListener('resize', updateMobileViewportV32, { passive: true })
  window.addEventListener('resize', updateMobileViewportV32, { passive: true })
  window.addEventListener('orientationchange', () => {
    setTimeout(updateMobileViewportV32, 120)
    setTimeout(updateMobileViewportV32, 420)
  }, { passive: true })

  window.addEventListener('pageshow', () => {
    const appVisible = Boolean(els.appView && !els.appView.classList.contains('hidden'))
    setSessionViewsV32(appVisible ? 'app' : 'login')
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebar()
  })
}
async function finishAuthorizedPanelLoadV32(flowVersion) {
  let panelOpened = false
  try {
    updateLoadingScreenV7('Carregando equipes e pontuações...')
    await Promise.all([
      loadProfiles(),
      loadDashboard(false, 'initial'),
    ])
    if (flowVersion !== authFlowVersionV32 || !state.profile) return

    updateLoadingScreenV7('Montando o painel...')
    renderDashboard({ renderModules: false, forceHome: true })
    showApp()
    await nextPaintV7()
    if (flowVersion !== authFlowVersionV32 || !state.profile) return

    panelOpened = true
    hideLoadingScreenV34()
    subscribeRealtime()

    if (isAdmin() && !state.adminApiCheckStartedV7) {
      state.adminApiCheckStartedV7 = true
      scheduleIdleV7(() => {
        if (flowVersion === authFlowVersionV32 && state.profile && isAdmin()) {
          void checkAdminApi()
        }
      }, 1400)
    }
  } catch (error) {
    if (flowVersion !== authFlowVersionV32 || !state.profile) return
    if (state.records.length > 0 || state.monthRecords.length > 0) {
      renderDashboard({ renderModules: false, forceHome: true })
      showApp()
      await nextPaintV7()
      panelOpened = true
      subscribeRealtime()
      toast(`O painel abriu com os dados disponíveis: ${friendlyError(error)}`, true)
      return
    }
    throw error
  } finally {
    if (panelOpened && flowVersion === authFlowVersionV32 && state.profile) {
      hideLoadingScreenV34()
    }
  }
}



function installFloatingMobileMenuV33() {
  const button = els.mobileMenuButton || document.getElementById('mobile-menu-button')
  if (!button) return

  button.classList.add('jr-floating-menu-v33')
  button.setAttribute('aria-label', 'Abrir menu')
  button.setAttribute('title', 'Abrir menu')

  const syncVisibility = () => {
    const appVisible = Boolean(
      els.appView &&
      !els.appView.classList.contains('hidden') &&
      document.body.dataset.mobileSessionV32 === 'app'
    )

    button.classList.toggle('jr-floating-menu-visible-v33', appVisible)
    button.setAttribute('aria-hidden', String(!appVisible))
    button.tabIndex = appVisible ? 0 : -1
  }

  const observer = new MutationObserver(syncVisibility)
  if (els.appView) observer.observe(els.appView, { attributes: true, attributeFilter: ['class'] })
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-mobile-session-v32'] })

  window.addEventListener('resize', syncVisibility, { passive: true })
  window.addEventListener('orientationchange', () => setTimeout(syncVisibility, 120), { passive: true })

  syncVisibility()
}


function isMobileLayoutV37() {
  return window.matchMedia('(max-width: 900px)').matches
}

function clampNumberV37(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function restoreMobileScrollV37(scrollTop) {
  if (!isMobileLayoutV37()) return

  cancelAnimationFrame(mobileAnchorFrameV37)
  mobileAnchorFrameV37 = requestAnimationFrame(() => {
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' })

    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' })
    })
  })
}

function visibleElementV37(element) {
  if (!element || !element.isConnected) return false

  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    !element.hidden
  )
}

function findDatePopoverV37(wrapper) {
  return (
    wrapper?.querySelector(
      '.picker-popover, .date-picker-popover, [data-picker-popover], [role="dialog"]'
    ) ||
    [...document.querySelectorAll(
      '.picker-popover.open, ' +
      '.date-picker-popover.open, ' +
      '.picker-popover[data-picker-for="date-filter"], ' +
      '.date-picker-popover[data-picker-for="date-filter"], ' +
      '.date-picker-popover[data-date-picker-for="date-filter"], ' +
      '[data-date-picker-popover-for="date-filter"]'
    )].find((element) => {
      const owner =
        element.dataset?.pickerFor ||
        element.dataset?.datePickerFor ||
        element.getAttribute?.('aria-labelledby') ||
        ''

      return !owner || String(owner).includes('date-filter')
    })
  )
}

function positionFloatingControlV37(trigger, floating, type) {
  if (!isMobileLayoutV37() || !trigger || !floating || !visibleElementV37(floating)) return

  const viewport = window.visualViewport
  const viewportWidth = Math.round(viewport?.width || window.innerWidth)
  const viewportHeight = Math.round(viewport?.height || window.innerHeight)
  const viewportTop = Math.round(viewport?.offsetTop || 0)
  const rect = trigger.getBoundingClientRect()

  const minimumWidth = type === 'calendar' ? 306 : Math.max(220, rect.width)
  const width = Math.min(
    Math.max(rect.width, minimumWidth),
    Math.max(260, viewportWidth - 24)
  )

  floating.classList.add(
    type === 'calendar'
      ? 'jr-service-date-popover-v37'
      : 'jr-team-select-menu-v37'
  )

  floating.style.setProperty('--jr37-floating-width', `${width}px`)

  const measuredHeight = Math.min(
    floating.scrollHeight || floating.offsetHeight || (type === 'calendar' ? 390 : 320),
    viewportHeight - 24
  )

  const left = clampNumberV37(
    rect.left,
    12,
    Math.max(12, viewportWidth - width - 12)
  )

  const spaceBelow = viewportTop + viewportHeight - rect.bottom
  const openAbove = spaceBelow < measuredHeight + 16 && rect.top > measuredHeight + 16

  const top = openAbove
    ? Math.max(viewportTop + 12, rect.top - measuredHeight - 8)
    : Math.min(rect.bottom + 8, viewportTop + viewportHeight - measuredHeight - 12)

  floating.style.setProperty('--jr37-floating-left', `${left}px`)
  floating.style.setProperty('--jr37-floating-top', `${Math.max(viewportTop + 12, top)}px`)
  floating.style.setProperty(
    '--jr37-floating-max-height',
    `${Math.max(190, viewportHeight - 24)}px`
  )
}

function anchorServiceDateCalendarV37() {
  if (!isMobileLayoutV37()) return

  const wrapper = document.querySelector('[data-date-picker-for="date-filter"]')
  const trigger = wrapper?.querySelector('.picker-trigger')
  const popover = findDatePopoverV37(wrapper)

  wrapper?.classList.add('jr-service-date-anchor-v37')

  if (trigger && popover) {
    positionFloatingControlV37(trigger, popover, 'calendar')
  }
}

function anchorTeamSelectMenuV37() {
  if (!isMobileLayoutV37()) return

  const select = els.teamFilter || document.getElementById('team-filter')
  const control = select?.closest('.custom-select-control')
  const trigger = control?.querySelector('.custom-select-trigger')
  const menu = control?.querySelector('.custom-select-menu')

  control?.classList.add('jr-team-select-anchor-v37')

  if (trigger && menu) {
    positionFloatingControlV37(trigger, menu, 'team')
  }
}

function scheduleMobileAnchorV37(type, scrollTop) {
  const run = () => {
    if (type === 'date') anchorServiceDateCalendarV37()
    else anchorTeamSelectMenuV37()

    restoreMobileScrollV37(scrollTop)
  }

  requestAnimationFrame(run)
  setTimeout(run, 30)
  setTimeout(run, 120)
}

function handleTeamFilterChangeV37() {
  const scrollTop = window.scrollY

  state.visibleRows = 10
  closeAllUiControls()

  cancelAnimationFrame(mobileTeamRenderFrameV37)
  mobileTeamRenderFrameV37 = requestAnimationFrame(() => {
    renderDashboard({ renderModules: false })
    restoreMobileScrollV37(scrollTop)
  })
}

function installMobileCalendarAndTeamsV37() {
  document.body.classList.add('jr-mobile-calendar-teams-v37')

  const dateWrapper = document.querySelector('[data-date-picker-for="date-filter"]')
  const dateTrigger = dateWrapper?.querySelector('.picker-trigger')
  const teamControl = els.teamFilter?.closest('.custom-select-control')
  const teamTrigger = teamControl?.querySelector('.custom-select-trigger')

  dateWrapper?.classList.add('jr-service-date-anchor-v37')
  teamControl?.classList.add('jr-team-select-anchor-v37')

  dateTrigger?.addEventListener('pointerdown', () => {
    dateTrigger.dataset.jrScrollTopV37 = String(window.scrollY)
  }, { passive: true })

  dateTrigger?.addEventListener('click', () => {
    const scrollTop = Number(dateTrigger.dataset.jrScrollTopV37 || window.scrollY)
    scheduleMobileAnchorV37('date', scrollTop)
  })

  teamTrigger?.addEventListener('pointerdown', () => {
    teamTrigger.dataset.jrScrollTopV37 = String(window.scrollY)
  }, { passive: true })

  teamTrigger?.addEventListener('click', () => {
    const scrollTop = Number(teamTrigger.dataset.jrScrollTopV37 || window.scrollY)
    scheduleMobileAnchorV37('team', scrollTop)
  })

  const observer = new MutationObserver(() => {
    if (!isMobileLayoutV37()) return

    anchorServiceDateCalendarV37()
    anchorTeamSelectMenuV37()
  })

  if (dateWrapper) {
    observer.observe(dateWrapper, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'hidden', 'style'],
    })
  }

  if (teamControl) {
    observer.observe(teamControl, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'hidden', 'style'],
    })
  }

  window.visualViewport?.addEventListener('resize', () => {
    anchorServiceDateCalendarV37()
    anchorTeamSelectMenuV37()
  }, { passive: true })

  window.addEventListener('orientationchange', () => {
    setTimeout(anchorServiceDateCalendarV37, 150)
    setTimeout(anchorTeamSelectMenuV37, 150)
  }, { passive: true })
}


function isServiceDatePopoverOpenV38(popover) {
  if (!popover || !popover.isConnected) return false

  const style = window.getComputedStyle(popover)
  return (
    !popover.hidden &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    (
      popover.classList.contains('open') ||
      popover.classList.contains('show') ||
      popover.getAttribute('aria-hidden') !== 'true'
    )
  )
}

function getServiceDatePartsV38() {
  const wrapper =
    document.querySelector('[data-date-picker-for="date-filter"]') ||
    els.dateFilter?.closest?.('[data-date-picker-for]') ||
    els.dateFilter?.parentElement

  const trigger =
    wrapper?.querySelector(
      '.picker-trigger, [data-picker-trigger], button[aria-haspopup], button'
    ) ||
    els.dateFilter

  let popover = wrapper?.querySelector(
    '.picker-popover, .date-picker-popover, [data-picker-popover], [role="dialog"]'
  )

  if (!popover) {
    const candidates = [
      ...document.querySelectorAll(
        '.picker-popover.open, ' +
        '.picker-popover.show, ' +
        '.date-picker-popover.open, ' +
        '.date-picker-popover.show, ' +
        '[data-picker-popover]:not([hidden]), ' +
        '[data-date-picker-popover-for="date-filter"]'
      ),
    ]

    popover = candidates.find((element) => {
      const owner = [
        element.dataset?.pickerFor,
        element.dataset?.datePickerFor,
        element.getAttribute?.('data-date-picker-popover-for'),
        element.getAttribute?.('aria-labelledby'),
      ].filter(Boolean).join(' ')

      return !owner || owner.includes('date-filter')
    })
  }

  return { wrapper, trigger, popover }
}

function restoreServiceDateScrollV38(force = false) {
  if (!isMobileLayoutV37()) return
  if (!force && performance.now() > serviceDateScrollLockUntilV38) return

  cancelAnimationFrame(serviceDateScrollFrameV38)
  serviceDateScrollFrameV38 = requestAnimationFrame(() => {
    if (
      Math.abs(window.scrollY - serviceDateScrollTopV38) > 1 ||
      Math.abs(window.scrollX) > 1
    ) {
      window.scrollTo({
        top: serviceDateScrollTopV38,
        left: 0,
        behavior: 'auto',
      })
    }
  })
}

function positionServiceDateCalendarV38(force = false) {
  if (!isMobileLayoutV37()) return false

  const { trigger, popover } = getServiceDatePartsV38()
  if (!trigger || !popover) return false
  if (!force && !isServiceDatePopoverOpenV38(popover)) return false

  const viewport = window.visualViewport
  const viewportWidth = Math.round(viewport?.width || window.innerWidth)
  const viewportHeight = Math.round(viewport?.height || window.innerHeight)
  const viewportTop = Math.round(viewport?.offsetTop || 0)

  const rect = serviceDateTriggerRectV38 || trigger.getBoundingClientRect()
  const sideGap = 10
  const width = Math.min(
    Math.max(rect.width, 310),
    Math.max(260, viewportWidth - sideGap * 2)
  )

  popover.classList.add(
    'jr-service-date-popover-v37',
    'jr-service-date-popover-fixed-v38',
    'jr-service-date-popover-fixed-v39'
  )

  popover.style.setProperty('--jr38-calendar-width', `${width}px`)

  const measuredHeight = Math.min(
    Math.max(
      popover.scrollHeight ||
      popover.offsetHeight ||
      (force ? 390 : 380),
      220
    ),
    Math.max(220, viewportHeight - 24)
  )

  const left = clampNumberV37(
    rect.left,
    sideGap,
    Math.max(sideGap, viewportWidth - width - sideGap)
  )

  const belowTop = rect.bottom + 7
  const availableBelow = viewportTop + viewportHeight - belowTop
  const canOpenBelow = availableBelow >= Math.min(measuredHeight, 330)

  const top = canOpenBelow
    ? Math.min(
        belowTop,
        viewportTop + viewportHeight - measuredHeight - sideGap
      )
    : Math.max(
        viewportTop + sideGap,
        rect.top - measuredHeight - 7
      )

  popover.style.setProperty('--jr38-calendar-left', `${left}px`)
  popover.style.setProperty(
    '--jr38-calendar-top',
    `${Math.max(viewportTop + sideGap, top)}px`
  )
  popover.style.setProperty(
    '--jr38-calendar-max-height',
    `${Math.max(210, viewportHeight - 24)}px`
  )

  restoreServiceDateScrollV38()
  return true
}

function scheduleServiceDateCalendarV38() {
  const delays = [0, 16, 45, 90, 160, 280, 420]

  delays.forEach((delay) => {
    window.setTimeout(() => {
      positionServiceDateCalendarV38()
      restoreServiceDateScrollV38()
    }, delay)
  })
}

function beginServiceDateOpenV38() {
  if (!isMobileLayoutV37()) return

  const { trigger } = getServiceDatePartsV38()
  if (!trigger) return

  serviceDateScrollTopV38 = window.scrollY
  serviceDateTriggerRectV38 = trigger.getBoundingClientRect()
  serviceDateScrollLockUntilV38 = performance.now() + 720

  document.documentElement.classList.add('jr-service-date-opening-v38')
  document.body.classList.add('jr-service-date-opening-v38')
  document.body.classList.add('jr-service-date-opening-v39')

  // Executado antes do clique chegar ao ui-controls. Assim o popover já
  // nasce fixed e não aumenta a altura da página nem joga a tela para baixo.
  positionServiceDateCalendarV38(true)

  const active = document.activeElement
  if (active && active !== trigger && typeof active.blur === 'function') {
    active.blur()
  }

  scheduleServiceDateCalendarV38()

  window.setTimeout(() => {
    restoreServiceDateScrollV38(true)
    document.documentElement.classList.remove('jr-service-date-opening-v38')
    document.body.classList.remove(
      'jr-service-date-opening-v38',
      'jr-service-date-opening-v39'
    )
  }, 760)
}

function bindServiceDateTriggerV38() {
  const { wrapper, trigger } = getServiceDatePartsV38()
  if (!wrapper || !trigger || trigger.dataset.jrServiceDateV38 === 'ready') {
    return Boolean(trigger)
  }

  trigger.dataset.jrServiceDateV38 = 'ready'
  wrapper.classList.add('jr-service-date-anchor-v37', 'jr-service-date-anchor-v38')

  trigger.addEventListener(
    'pointerdown',
    () => {
      serviceDateScrollTopV38 = window.scrollY
      serviceDateTriggerRectV38 = trigger.getBoundingClientRect()
      serviceDateScrollLockUntilV38 = performance.now() + 900
      positionServiceDateCalendarV38(true)
    },
    { passive: true, capture: true }
  )

  trigger.addEventListener(
    'click',
    () => {
      beginServiceDateOpenV38()
    },
    { capture: true }
  )

  wrapper.addEventListener(
    'focusin',
    () => {
      if (performance.now() <= serviceDateScrollLockUntilV38) {
        restoreServiceDateScrollV38()
      }
    },
    true
  )

  return true
}
function installServiceDateCalendarV38() {
  document.body.classList.add('jr-service-date-fixed-v38', 'jr-v39-active')
  bindServiceDateTriggerV38()
}
async function mapWithConcurrencyV37(items, limit, mapper) {
  const results = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(items[index], index)
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(1, limit), items.length) },
    () => worker()
  )

  await Promise.all(workers)
  return results
}

function focusModuleDetailV37(element) {
  if (!element) return

  requestAnimationFrame(() => {
    element.scrollIntoView({
      behavior: isMobileLayoutV37() ? 'auto' : 'smooth',
      block: isMobileLayoutV37() ? 'nearest' : 'start',
    })
  })
}

function prepareLightSearchUi() {
  prepareSearchField({
    input: els.reportsObservationFilter,
    helpId: '',
    helpText: '',
    labelText: 'PESQUISAR NO DIA SELECIONADO',
    outerClasses: ['light-search-field-v19', 'report-light-search-v19'],
  })

  prepareSearchField({
    input: els.ordersSearchInput,
    helpId: '',
    helpText: '',
    labelText: 'PESQUISAR ORDEM, RUA, ENDEREÇO OU BAIRRO',
    outerClasses: ['light-search-field-v19', 'orders-light-search-v19'],
  })

  const reportDatalist = document.getElementById('reports-observation-options')
  reportDatalist?.remove()
  els.reportsObservationFilter?.removeAttribute('list')

  ensureGlobalSearchCard()
  prepareReportTeamSearchPlacement()
  prepareOrdersToolbarAlignment()

  els.reportsSearchHelp = document.getElementById('reports-search-help')
  els.ordersSearchHelp = document.getElementById('orders-search-help')
  els.globalSearchForm = document.getElementById('global-search-form')
  els.globalSearchInput = document.getElementById('global-search-input')
  els.globalSearchButton = document.getElementById('global-search-button')
  els.globalSearchStatus = document.getElementById('global-search-status')
}

function prepareSearchField({ input, helpId, helpText, labelText, outerClasses }) {
  if (!input) return

  input.type = 'search'
  input.autocomplete = 'off'
  input.setAttribute('autocapitalize', 'none')
  input.setAttribute('spellcheck', 'false')
  input.setAttribute('minlength', String(SEARCH_MIN_LENGTH))

  const outer = input.closest(
    '.orders-search-control-v18, .orders-light-search-v19, .report-observation-field, .report-light-search-v19, label'
  ) || input.parentElement

  outerClasses.forEach((className) => outer?.classList.add(className))

  let box = input.parentElement
  if (!box || box === outer) {
    box = document.createElement('div')
    box.className = 'light-search-box-v19'
    input.parentNode?.insertBefore(box, input)
    box.appendChild(input)

    const iconElement = document.createElement('span')
    iconElement.setAttribute('data-icon', 'search')
    box.appendChild(iconElement)
  } else {
    box.classList.add('light-search-box-v19')
  }

  const label = outer?.querySelector('label, :scope > span')
  if (label && !label.closest('.light-search-box-v19')) {
    label.textContent = labelText
  }

  let help = helpId ? document.getElementById(helpId) : null
  if (helpId && !help && outer) {
    help = document.createElement('small')
    help.id = helpId
    help.className = 'light-search-help-v19'
    help.textContent = helpText
    outer.appendChild(help)
  }
}

function ensureGlobalSearchCard() {
  document.querySelectorAll('.sidebar-global-search-v19').forEach((element) => element.remove())

  let navButton = document.querySelector('.nav-item[data-page="search"]')
  if (!navButton) {
    navButton = document.createElement('button')
    navButton.className = 'nav-item'
    navButton.type = 'button'
    navButton.dataset.page = 'search'
    navButton.innerHTML = '<span data-icon="search"></span><span>Pesquisar</span>'

    const homeButton = document.querySelector('.nav-item[data-page="home"]')
    if (homeButton) homeButton.insertAdjacentElement('afterend', navButton)
    else (els.sidebar?.querySelector('nav') || document.querySelector('.sidebar-nav'))?.prepend(navButton)
  }

  const navText = navButton?.querySelector('span:last-child')
  if (navText) navText.textContent = 'Pesquisar'

  let page = document.getElementById('page-search')
  if (!page) {
    page = document.createElement('section')
    page.id = 'page-search'
    page.className = 'page-section hidden'
    page.innerHTML = `
      <section class="panel search-page-panel-v21 search-page-clean-v30">
        <div class="search-page-hero-v21 search-page-hero-clean-v30">
          <div class="search-page-hero-icon-v21">${icon('search')}</div>
          <div>
            <span class="panel-kicker"><span data-icon="search"></span>PESQUISA GERAL</span>
            <h2>Pesquisar em todo o painel</h2>
            <p>Localize ordens, ruas, bairros, equipes, serviços, observações, IDs e pendências.</p>
          </div>
        </div>

        <form id="global-search-form" class="search-page-form-v21 search-page-form-clean-v30" autocomplete="off">
          <label for="global-search-input">O QUE VOCÊ PROCURA?</label>
          <div class="search-page-input-row-v21">
            <div class="search-page-input-v21">
              <input id="global-search-input" type="search" placeholder="Digite pelo menos 3 caracteres..." autocomplete="off" autocapitalize="none" spellcheck="false" minlength="${SEARCH_MIN_LENGTH}" />
              <span data-icon="search"></span>
            </div>
            <button id="global-search-button" class="primary-button search-page-submit-v21" type="submit"><span data-icon="search"></span>PESQUISAR</button>
            <button id="global-search-clear-button" class="outline-button search-page-clear-v21" type="button"><span data-icon="x"></span>LIMPAR</button>
          </div>
          <small id="global-search-status" class="search-inline-status-v30"></small>
        </form>

        <div id="global-search-results" class="search-page-results-v21">
          <div class="search-page-empty-v21 search-page-empty-clean-v30">
            <span>${icon('search')}</span>
            <strong>Nenhuma pesquisa realizada</strong>
            <p>Digite um termo acima para começar.</p>
          </div>
        </div>
      </section>`

    const homePage = document.getElementById('page-home')
    if (homePage?.parentElement) homePage.insertAdjacentElement('afterend', page)
    else document.querySelector('main')?.appendChild(page)
  }

  els.globalSearchForm = document.getElementById('global-search-form')
  els.globalSearchInput = document.getElementById('global-search-input')
  els.globalSearchButton = document.getElementById('global-search-button')
  els.globalSearchClearButton = document.getElementById('global-search-clear-button')
  els.globalSearchStatus = document.getElementById('global-search-status')
  els.globalSearchResults = document.getElementById('global-search-results')
  els.globalSearchSummary = null
}


function prepareReportTeamSearchPlacement() {
  if (!els.reportsObservationFilter || !els.reportsTeamDetail) return

  const oldHelp = document.getElementById('reports-search-help')
  oldHelp?.remove()
  els.reportsSearchHelp = null

  const searchField = els.reportsObservationFilter.closest(
    '.report-light-search-v19, .report-observation-field, .light-search-field-v19, label'
  ) || els.reportsObservationFilter.parentElement

  if (!searchField) return

  searchField.classList.add('report-team-search-card-v22')
  searchField.classList.remove('hidden')

  const toolbar = document.querySelector('[data-range-toolbar="reports"]')
  toolbar?.classList.add('reports-toolbar-without-search-v22')

  let tools = document.getElementById('reports-team-tools-v22')
  if (!tools) {
    tools = document.createElement('div')
    tools.id = 'reports-team-tools-v22'
    tools.className = 'reports-team-tools-v22 hidden'
    tools.innerHTML = `
      <article class="reports-selected-team-card-v22">
        <span class="reports-selected-team-icon-v22">${icon('users')}</span>
        <span class="reports-selected-team-copy-v22">
          <small>EQUIPE SELECIONADA</small>
          <strong id="reports-selected-team-name-v22">Nenhuma equipe</strong>
          <em>Os resultados abaixo pertencem somente a esta equipe.</em>
        </span>
      </article>`

    const preview = els.reportsPreview
    if (preview?.parentElement) {
      preview.parentElement.insertBefore(tools, preview)
    } else {
      els.reportsTeamDetail.appendChild(tools)
    }
  }

  if (!tools.contains(searchField)) {
    tools.appendChild(searchField)
  }

  const label = searchField.querySelector('label, :scope > span')
  if (label && !label.closest('.light-search-box-v19')) {
    label.textContent = 'PESQUISAR NO DIA SELECIONADO'
  }

  const remainingHelp = searchField.querySelector('#reports-search-help, .light-search-help-v19')
  remainingHelp?.remove()

  syncReportSearchAvailability()
}

function selectedReportTeamName() {
  return String(state.moduleTeams.reports || '').trim()
}

function prepareOrdersToolbarAlignment() {
  const toolbar = document.querySelector('[data-range-toolbar="orders"]')
  if (!toolbar) return

  toolbar.classList.add('orders-toolbar-aligned-v21')

  const periodWrap = toolbar.querySelector('.period-selector-wrap')
  periodWrap?.classList.add('orders-toolbar-field-v21', 'orders-period-field-v21')

  const searchField = els.ordersSearchInput?.closest(
    '.orders-search-control-v18, .orders-light-search-v19, .light-search-field-v19, label'
  )
  searchField?.classList.add('orders-toolbar-field-v21', 'orders-search-field-v21')

  const teamField = els.ordersTeamFilter?.closest('.custom-select-control')
  if (teamField) {
    teamField.classList.add('orders-toolbar-field-v21', 'orders-team-field-v21')

    if (!teamField.querySelector('.orders-toolbar-label-v21')) {
      const label = document.createElement('span')
      label.className = 'orders-toolbar-label-v21'
      label.textContent = 'EQUIPE EXECUTORA'
      teamField.prepend(label)
    }

    if (!teamField.querySelector('.orders-toolbar-help-v21')) {
      const help = document.createElement('small')
      help.className = 'orders-toolbar-help-v21'
      help.textContent = 'Selecione uma equipe ou mantenha todas.'
      teamField.appendChild(help)
    }
  }

  const refreshButton = els.ordersRefreshButton
  if (refreshButton && !refreshButton.closest('.orders-refresh-field-v21')) {
    const wrapper = document.createElement('div')
    wrapper.className = 'orders-toolbar-field-v21 orders-refresh-field-v21'

    const label = document.createElement('span')
    label.className = 'orders-toolbar-label-v21 orders-toolbar-label-placeholder-v21'
    label.textContent = 'ATUALIZAR'

    const help = document.createElement('small')
    help.className = 'orders-toolbar-help-v21'
    help.textContent = 'Recarrega o período selecionado.'

    refreshButton.parentNode?.insertBefore(wrapper, refreshButton)
    wrapper.append(label, refreshButton, help)
  }
}

function bindEvents() {
  els.loginForm.addEventListener('submit', handleLogin)
  els.rememberLogin?.addEventListener('change', persistLoginPreference)
  els.togglePassword.addEventListener('click', togglePassword)
  els.accessTogglePassword.addEventListener('click', toggleAccessPassword)
  els.logoutButton.addEventListener('click', handleLogout)
  els.refreshButton.addEventListener('click', () => loadDashboard(true, 'user'))
  els.monthFilter.addEventListener('change', () => loadDashboard(false, 'user'))
  ;[els.photosRefreshButton, els.codesRefreshButton, els.reportsRefreshButton].forEach((button) => button?.addEventListener('click', () => loadRangeData(true)))
  els.ordersRefreshButton?.addEventListener('click', () => loadOrdersRangeData(true))

  els.dateFilter?.addEventListener('change', () => loadDashboard(false, 'user'))

  $$('[data-open-period-selector]').forEach((button) => button.addEventListener('click', () => openPeriodSelector(button.dataset.openPeriodSelector)))
  $$('[data-period-mode]').forEach((button) => button.addEventListener('click', () => setPeriodSelectorMode(button.dataset.periodMode)))
  els.periodSelectorForm?.addEventListener('submit', applyPeriodSelector)
  els.periodSelectorClose?.addEventListener('click', closePeriodSelector)
  els.periodSelectorCancel?.addEventListener('click', closePeriodSelector)
  els.periodUseToday?.addEventListener('click', () => {
    setUiControlValue('period-single-date', todayInCampoGrande())
    document.querySelector('[data-date-picker-for="period-single-date"] .picker-trigger')?.focus({ preventScroll: true })
    if (els.periodSelectorError) els.periodSelectorError.textContent = ''
  })
  els.periodMultipleStart?.addEventListener('change', updatePeriodRangePreview)
  els.periodMultipleEnd?.addEventListener('change', updatePeriodRangePreview)
  els.periodSelectorDialog?.addEventListener('click', (event) => {
    if (event.target === els.periodSelectorDialog) closePeriodSelector()
  })

  els.teamFilter.addEventListener('change', handleTeamFilterChangeV37)
  els.recordKindFilter?.addEventListener('change', () => { state.recordKind = els.recordKindFilter.value || 'all'; state.visibleRows = 10; renderTable() })
  els.toggleTeamScores?.addEventListener('click', toggleTeamScoresVisibility)
  bindLightSearch(els.searchInput, 'home', (query) => {
    state.search = query
    state.visibleRows = 10
    renderTable()
  })
  els.loadMoreButton.addEventListener('click', () => { state.visibleRows = Number.MAX_SAFE_INTEGER; renderTable() })
  els.mobileMenuButton.addEventListener('click', openSidebar)
  els.globalSearchForm?.addEventListener('submit', handleGlobalSearch)
  els.globalSearchClearButton?.addEventListener('click', clearGlobalSearch)
  els.sidebarOverlay.addEventListener('click', closeSidebar)
  els.detailsClose.addEventListener('click', () => els.detailsDialog.close())
  els.purgeClose.addEventListener('click', closePurgeDialog)
  els.purgeCancel.addEventListener('click', closePurgeDialog)
  els.purgeConfirm.addEventListener('click', purgeExcludedRecord)
  els.autoRefreshToggle.addEventListener('change', () => {
    state.autoRefresh = els.autoRefreshToggle.checked
    if (state.autoRefresh) subscribeRealtime()
    else stopPollingOnly()
    toast(state.autoRefresh ? 'Atualização automática ativada a cada minuto.' : 'Atualização automática pausada.')
  })
  document.addEventListener('visibilitychange', handlePanelVisibilityChange)
  window.addEventListener('focus', handlePanelFocus)
  window.addEventListener('online', handlePanelOnline)

  $$('.nav-item').forEach((button) => button.addEventListener('click', () => switchPage(button.dataset.page)))
  $$('.tab-button').forEach((button) => button.addEventListener('click', () => switchTableTab(button.dataset.tab)))

  els.photosBackButton.addEventListener('click', closePhotoFolder)
  els.codesBackButton.addEventListener('click', closeCodesTeam)
  els.reportsBackButton.addEventListener('click', closeReportsTeam)
  els.photosTeamDownload.addEventListener('click', () => downloadPhotosZipForTeam(state.moduleTeams.photos))
  els.photosAllDownload?.addEventListener('click', () => downloadPhotosZipForRange('all'))
  els.codesTeamDownload.addEventListener('click', () => downloadCodesForTeam(state.moduleTeams.codes))
  els.reportsTeamDownload.addEventListener('click', () => downloadNamesForTeam(state.moduleTeams.reports))
  els.reportsKindFilter?.addEventListener('change', () => { state.reportKind = els.reportsKindFilter.value || 'all'; renderModulePages() })
  bindLightSearch(els.reportsObservationFilter, 'reports', (query) => {
    state.reportObservation = query
    renderReportsSearchOnly()
  }, els.reportsSearchHelp)
  bindLightSearch(els.ordersSearchInput, 'orders', (query) => {
    state.ordersSearch = query
    state.ordersVisibleRows = 50
    renderOrdersPage()
  }, els.ordersSearchHelp)
  els.ordersTeamFilter?.addEventListener('change', () => {
    state.ordersTeam = els.ordersTeamFilter.value || 'all'
    state.ordersVisibleRows = 50
    renderOrdersPage()
  })
  els.ordersLoadMoreButton?.addEventListener('click', () => {
    state.ordersVisibleRows += 100
    renderOrdersPage()
  })
  els.newAccessButton.addEventListener('click', () => openAccessDialog())
  els.reloadAccessesButton.addEventListener('click', () => loadProfiles(true))
  els.accessDialogClose.addEventListener('click', closeAccessDialog)
  els.accessCancel.addEventListener('click', closeAccessDialog)
  els.accessForm.addEventListener('submit', saveAccess)
  els.accessType.addEventListener('change', syncAccessFormFields)
  els.accessPermission.addEventListener('change', syncAccessRoleValue)
  els.archiveAccessClose.addEventListener('click', closeArchiveAccessDialog)
  els.archiveAccessCancel.addEventListener('click', closeArchiveAccessDialog)
  els.archiveAccessConfirm.addEventListener('click', archiveAccess)

  document.addEventListener('click', async (event) => {
    const issueButton = event.target.closest('[data-issue-key]')
    if (issueButton) {
      showIssueDetails(decodeURIComponent(issueButton.dataset.issueKey))
      return
    }

    const teamIssuesButton = event.target.closest('[data-open-team-issues]')
    if (teamIssuesButton) {
      openTeamIssues(decodeURIComponent(teamIssuesButton.dataset.openTeamIssues))
      return
    }

    const detailsButton = event.target.closest('[data-details-id]')
    if (detailsButton) showRecordDetails(detailsButton.dataset.detailsId)

    const purgeButton = event.target.closest('[data-purge-id]')
    if (purgeButton) openPurgeDialog(purgeButton.dataset.purgeId)

    const photoButton = event.target.closest('[data-photo-path]')
    if (photoButton) await openStoragePhoto(photoButton.dataset.photoBucket || 'fotos', photoButton.dataset.photoPath)

    const photoTeamButton = event.target.closest('[data-open-photo-team]')
    if (photoTeamButton) await openPhotoFolder(decodeURIComponent(photoTeamButton.dataset.openPhotoTeam))

    const codeTeamButton = event.target.closest('[data-open-code-team]')
    if (codeTeamButton) openCodesTeam(decodeURIComponent(codeTeamButton.dataset.openCodeTeam))

    const reportTeamButton = event.target.closest('[data-open-report-team]')
    if (reportTeamButton) openReportsTeam(decodeURIComponent(reportTeamButton.dataset.openReportTeam))

    const editAccessButton = event.target.closest('[data-edit-access]')
    if (editAccessButton) openAccessDialog(editAccessButton.dataset.editAccess)

    const passwordAccessButton = event.target.closest('[data-password-access]')
    if (passwordAccessButton) openAccessDialog(passwordAccessButton.dataset.passwordAccess, true)

    const archiveAccessButton = event.target.closest('[data-archive-access]')
    if (archiveAccessButton) openArchiveAccessDialog(archiveAccessButton.dataset.archiveAccess)
  })
}

function initializePersistentUi() {
  try {
    const keep = window.localStorage.getItem(KEEP_CONNECTED_KEY) !== 'false'
    if (els.rememberLogin) els.rememberLogin.checked = keep
    const savedUsername = window.localStorage.getItem(SAVED_USERNAME_KEY) || ''
    if (savedUsername && els.username) els.username.value = savedUsername
    state.teamScoresHidden = window.localStorage.getItem(TEAM_SCORES_HIDDEN_KEY) === 'true'
  } catch (_error) {
    if (els.rememberLogin) els.rememberLogin.checked = true
  }
  applyTeamScoresVisibility()
}

function persistLoginPreference() {
  const keep = els.rememberLogin?.checked !== false
  try { window.localStorage.setItem(KEEP_CONNECTED_KEY, keep ? 'true' : 'false') } catch (_error) {}
}

function saveLoginUsername() {
  try {
    const username = String(els.username?.value || '').trim()
    if (username) window.localStorage.setItem(SAVED_USERNAME_KEY, username)
  } catch (_error) {}
}

function toggleTeamScoresVisibility() {
  state.teamScoresHidden = !state.teamScoresHidden
  try { window.localStorage.setItem(TEAM_SCORES_HIDDEN_KEY, state.teamScoresHidden ? 'true' : 'false') } catch (_error) {}
  applyTeamScoresVisibility()
}

function applyTeamScoresVisibility() {
  els.teamScoreGrid?.classList.toggle('hidden', state.teamScoresHidden)
  if (!els.toggleTeamScores) return
  els.toggleTeamScores.innerHTML = `${icon(state.teamScoresHidden ? 'eye' : 'eye-off')}${state.teamScoresHidden ? 'Mostrar equipes' : 'Ocultar equipes'}`
  els.toggleTeamScores.setAttribute('aria-pressed', state.teamScoresHidden ? 'true' : 'false')
}

async function bootstrap() {
  showLoadingScreenV34('Conectando ao painel...')

  const flowVersion = ++authFlowVersionV32

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      authFlowVersionV32 += 1
      stopRealtime()
      showLogin()
    }
  })

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    if (data.session) {
      await authorizeAndOpen(data.session.user, flowVersion)
    } else {
      showLogin()
    }
  } catch (error) {
    if (flowVersion !== authFlowVersionV32) return

    stopRealtime()
    showLogin()
    toast(friendlyError(error), true)
  }
}

async function handleLogin(event) {
  event.preventDefault()

  if (logoutInProgressV32) return

  const flowVersion = ++authFlowVersionV32
  clearMobileInteractionLocksV32('login')
  showLoadingScreenV34('Conectando ao painel...')
  els.loginError.textContent = ''
  setButtonLoading(els.loginButton, true, 'ENTRANDO...')

  try {
    persistLoginPreference()
    saveLoginUsername()

    const email = loginEmailFromInput(els.username.value)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: els.password.value,
    })

    if (error) throw error
    if (flowVersion !== authFlowVersionV32) return

    await authorizeAndOpen(data.user, flowVersion)
  } catch (error) {
    if (flowVersion === authFlowVersionV32) {
      els.loginError.textContent = friendlyError(error)
      setSessionViewsV32('login')
      hideLoadingScreenV34()
    }
  } finally {
    setButtonLoading(els.loginButton, false, 'ENTRAR')
  }
}
async function authorizeAndOpen(user, flowVersion = authFlowVersionV32) {
  updateLoadingScreenV7('Validando seu acesso...')
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, team_name, active, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (flowVersion !== authFlowVersionV32) return
  if (!profile?.active || !['admin', 'viewer'].includes(profile.role)) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('Este login não está liberado para acessar o painel administrativo.')
  }

  state.profile = profile
  state.adminApiCheckStartedV7 = false
  els.adminName.textContent = profile.username || 'Administrador'
  applyRoleUi()
  await finishAuthorizedPanelLoadV32(flowVersion)
}


async function handleLogout(event) {
  event?.preventDefault()

  if (logoutInProgressV32) return
  logoutInProgressV32 = true

  authFlowVersionV32 += 1
  stopRealtime()
  showLogin()

  if (els.logoutButton) {
    els.logoutButton.disabled = true
    els.logoutButton.setAttribute('aria-busy', 'true')
  }

  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) toast(friendlyError(error), true)
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    logoutInProgressV32 = false

    if (els.logoutButton) {
      els.logoutButton.disabled = false
      els.logoutButton.removeAttribute('aria-busy')
    }

    setSessionViewsV32('login')
  }
}
async function loadProfiles(showSuccessToast = false) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, team_name, active, role')
    .order('team_name')
  if (error) throw error

  state.profiles = data || []
  const previous = els.teamFilter.value
  const teams = configuredTeamNames()
  const nextOptions = '<option value="all">Todas as equipes</option>' +
    teams.map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`).join('')
  if (els.teamFilter.innerHTML !== nextOptions) {
    els.teamFilter.innerHTML = nextOptions
  }
  els.teamFilter.value = [...els.teamFilter.options].some((option) => option.value === previous)
    ? previous
    : 'all'
  refreshCustomSelect('team-filter')

  state.accessesDirtyV7 = true
  if (state.page === 'settings') {
    renderAccesses()
    state.accessesDirtyV7 = false
  }
  // JR_REFRESH_HOME_AFTER_PROFILE_CHANGE_V8
  if (state.page === 'home' && state.summary) {
    renderDashboard({ renderModules: false, forceHome: true })
  }

  if (showSuccessToast) toast('Lista de acessos atualizada.')
}
async function refreshProfilesForDashboardV8() {
  if (!state.profile) return true

  await loadProfiles(false)
  const refreshedProfile = state.profiles.find((profile) => profile.id === state.profile?.id)

  if (!refreshedProfile?.active || !['admin', 'viewer'].includes(refreshedProfile.role)) {
    await supabase.auth.signOut({ scope: 'local' })
    stopRealtime()
    showLogin()
    toast('Seu acesso ao painel foi desativado.', true)
    return false
  }

  state.profile = refreshedProfile
  applyRoleUi()
  return true
}

async function loadDashboard(showSuccessToast = false, source = 'user') {
  const automatic = source === 'auto'
  const now = Date.now()

  if (automatic) {
    if (!state.autoRefresh || !state.profile || document.hidden || !navigator.onLine) return
    if (now < state.rateLimitBackoffUntil) return
    if (now - state.lastDashboardLoadAt < AUTO_REFRESH_MIN_GAP_MS) return
  }

  if (state.loading) {
    if (!automatic) state.pendingDashboardRefresh = true
    return
  }

  setLoading(true)
  try {
    const accessStillValidV8 = source === 'initial'
      ? true
      : await refreshProfilesForDashboardV8()
    if (!accessStillValidV8) return
    const date = currentDate()
    const dayNext = addDays(date, 1)
    const month = monthRangeFromValue(currentMonth())
    const dayFetchStart = `${addDays(date, -1)}T00:00:00.000Z`
    const dayFetchEnd = `${addDays(dayNext, 1)}T00:00:00.000Z`

    if (state.monthLoadedKeyV6 !== month.start) {
      state.monthRecords = []
      state.monthManifests = []
    }

    const [dayRecords, dayManifests] = await Promise.all([
      fetchAllRows((from, to) => supabase
        .from('service_records')
        .select('id, user_id, data, registro, device_id, deleted_at, deleted_by, deleted_device_id, updated_at, sync_version')
        .gte('data', dayFetchStart)
        .lt('data', dayFetchEnd)
        .order('data', { ascending: true })
        .range(from, to)),
      fetchAllRows((from, to) => supabase
        .from('day_sync_manifests')
        .select('*')
        .gte('work_date', date)
        .lt('work_date', dayNext)
        .order('sent_at', { ascending: false })
        .range(from, to)),
    ])

    state.records = dayRecords.filter((row) => serviceDateKey(row) === date)
    state.manifests = dayManifests.filter((manifest) => String(manifest.work_date || '').slice(0, 10) === date)

    if (!state.range.loadedKey || state.range.loadedKey === `${date}|${date}`) {
      state.range = {
        start: date,
        end: date,
        records: [...state.records],
        manifests: [...state.manifests],
        loadedKey: `${date}|${date}`,
      }
      setAllRangeFilters(date, date)
    }

    state.visibleRows = 10
    state.lastDashboardLoadAt = Date.now()
    state.rateLimitFailures = 0
    state.rateLimitBackoffUntil = 0
    renderDashboard({ renderModules: false })
    setConnection(true)
    setLoading(false)

    const monthIsFresh = (
      state.monthLoadedKeyV6 === month.start &&
      Date.now() - Number(state.monthLoadedAtV6 || 0) < 300000
    )

    if (monthIsFresh) {
      if (showSuccessToast) toast('Dados atualizados com sucesso.')
      return
    }

    state.dashboardMonthTokenV6 = (state.dashboardMonthTokenV6 || 0) + 1
    const token = state.dashboardMonthTokenV6
    void loadMonthDashboardV6(date, month, token, showSuccessToast, automatic)
  } catch (error) {
    setConnection(false)
    if (isRateLimitError(error)) {
      state.rateLimitFailures = Math.min(state.rateLimitFailures + 1, 5)
      const backoff = RATE_LIMIT_BACKOFF_BASE_MS * (2 ** (state.rateLimitFailures - 1))
      state.rateLimitBackoffUntil = Date.now() + backoff
      if (!automatic || state.rateLimitFailures === 1) {
        toast(`O painel atingiu o limite de solicitações. Atualização automática pausada por ${Math.ceil(backoff / 60000)} minuto(s).`, true)
      }
    } else {
      toast(friendlyError(error), true)
    }
  } finally {
    if (state.loading) setLoading(false)

    if (state.pendingDashboardRefresh) {
      state.pendingDashboardRefresh = false
      setTimeout(() => loadDashboard(false, 'user'), 250)
    }
  }
}


// Cópia antiga de loadMonthDashboardV6 removida pela V8.4.

async function loadMonthDashboardV6(date, month, token, showSuccessToast, automatic) {
  try {
    const monthFetchStart = `${addDays(month.start, -1)}T00:00:00.000Z`
    const monthFetchEnd = `${addDays(month.next, 1)}T00:00:00.000Z`
    const monthRecords = await fetchAllRows((from, to) => supabase
      .from('service_records')
      .select('id, user_id, data, registro, device_id, deleted_at, deleted_by, deleted_device_id, updated_at, sync_version')
      .gte('data', monthFetchStart)
      .lt('data', monthFetchEnd)
      .order('data', { ascending: true })
      .range(from, to))

    if (
      token !== state.dashboardMonthTokenV6 ||
      date !== currentDate() ||
      month.start !== monthRangeFromValue(currentMonth()).start
    ) return

    state.monthRecords = monthRecords.filter((row) => {
      const key = serviceDateKey(row)
      return key >= month.start && key < month.next
    })
    state.monthManifests = []
    state.monthLoadedKeyV6 = month.start
    state.monthLoadedAtV6 = Date.now()
    state.monthLoadedKeyV7 = month.start
    state.monthLoadedAtV7 = Date.now()
    publishServicesMonthCacheV8()
    moduleRenderCacheV31.clear()

    const currentOrdersMonth = currentOrdersMonthRange()
    if (state.ordersRangeFollowsCurrentMonth && month.start === currentOrdersMonth.start) {
      state.ordersRange = {
        start: currentOrdersMonth.start,
        end: currentOrdersMonth.end,
        records: [...state.monthRecords],
        loadedKey: `${currentOrdersMonth.start}|${currentOrdersMonth.end}`,
      }
      setOrdersRangeFilters(currentOrdersMonth.start, currentOrdersMonth.end)
    }

    renderDashboard({ renderModules: false, forceHome: state.page === 'home' })
    if (state.page === 'orders') scheduleCurrentModuleRenderV31('orders')
    setConnection(true)
    if (showSuccessToast) toast('Dados atualizados com sucesso.')
  } catch (error) {
    if (token !== state.dashboardMonthTokenV6) return
    if (isRateLimitError(error)) {
      state.rateLimitFailures = Math.min(state.rateLimitFailures + 1, 5)
      const backoff = RATE_LIMIT_BACKOFF_BASE_MS * (2 ** (state.rateLimitFailures - 1))
      state.rateLimitBackoffUntil = Date.now() + backoff
    }
    if (!automatic) {
      toast(`A pontuação do dia foi carregada, mas o resumo mensal não terminou: ${friendlyError(error)}`, true)
    }
  }
}


// Cópia antiga de loadMonthDashboardV6 removida pela V8.4.


// JR_GESTAO_SERVICOS_EXECUTADOS_SITE_REAL_V10
function publishServicesMonthCacheV8() {
  const detail = {
    month: currentMonth(),
    records: Array.isArray(state.monthRecords) ? state.monthRecords : [],
    profiles: Array.isArray(state.profiles) ? state.profiles : [],
    profile: state.profile || null,
    updatedAt: Date.now(),
  }

  window.__JR_SERVICES_MONTH_CACHE__ = detail
  document.dispatchEvent(new CustomEvent('jr:monthdata', { detail }))
}

function currentOrdersMonthRange() {
  const month = todayInCampoGrande().slice(0, 7)
  const range = monthRangeFromValue(month)
  return {
    month,
    start: range.start,
    end: addDays(range.next, -1),
  }
}

function initializeOrdersCurrentMonth() {
  const range = currentOrdersMonthRange()
  state.ordersRangeFollowsCurrentMonth = true
  setOrdersRangeFilters(range.start, range.end)
}

async function ensureOrdersCurrentMonthLoaded() {
  if (!state.ordersRangeFollowsCurrentMonth) return

  const range = currentOrdersMonthRange()
  const expectedKey = `${range.start}|${range.end}`

  if (
    state.ordersRange.loadedKey === expectedKey &&
    state.ordersRange.start === range.start &&
    state.ordersRange.end === range.end
  ) {
    return
  }

  setOrdersRangeFilters(range.start, range.end)

  if (
    currentMonth() === range.month &&
    state.lastDashboardLoadAt > 0
  ) {
    state.ordersRange = {
      start: range.start,
      end: range.end,
      records: [...state.monthRecords],
      loadedKey: expectedKey,
    }
    renderOrdersPage()
    return
  }

  await loadOrdersRangeData(false)
}

async function loadOrdersRangeData(showSuccessToast = false) {
  if (state.ordersRangeLoading) return false

  const { start, end } = selectedOrdersRange()
  validateRange(start, end)

  state.ordersRangeLoading = true
  setOrdersRangeLoading(true)

  try {
    const endNext = addDays(end, 1)
    const fetchStart = `${addDays(start, -1)}T00:00:00.000Z`
    const fetchEnd = `${addDays(endNext, 1)}T00:00:00.000Z`

    const records = await fetchAllRows((from, to) => supabase
      .from('service_records')
      .select('id, user_id, data, registro, device_id, deleted_at, deleted_by, deleted_device_id, updated_at, sync_version')
      .gte('data', fetchStart)
      .lt('data', fetchEnd)
      .order('data', { ascending: true })
      .range(from, to))

    state.ordersRange = {
      start,
      end,
      records: records.filter((row) => {
        const key = serviceDateKey(row)
        return key >= start && key <= end
      }),
      loadedKey: `${start}|${end}`,
    }

    state.ordersVisibleRows = 50
    renderOrdersPage()

    if (showSuccessToast) {
      toast(`Ordens de serviço de ${periodSelectorLabel(start, end)} carregadas.`)
    }

    return true
  } catch (error) {
    toast(friendlyError(error), true)
    return false
  } finally {
    state.ordersRangeLoading = false
    setOrdersRangeLoading(false)
  }
}

async function fetchAllRows(fetchPage, pageSize = 1000) {
  const rows = []
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await fetchPage(from, to)
    if (error) throw error

    const page = data || []
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }

  return rows
}

function isRateLimitError(error) {
  const status = Number(error?.status || error?.statusCode || error?.code || 0)
  const message = String(error?.message || error || '')
  return status === 429 || /too many requests|rate limit|muitas solicita[cç][oõ]es|aguarde alguns instantes/i.test(message)
}


async function loadRangeData(showSuccessToast = false, throwOnError = false) {
  if (state.rangeLoading) {
    await waitForRangeLoading()
    const current = selectedRange()
    return state.range.loadedKey === `${current.start}|${current.end}`
  }

  const { start, end } = selectedRange()
  validateRange(start, end)
  state.rangeLoading = true
  setRangeLoading(true)

  try {
    const endNext = addDays(end, 1)
    const fetchStart = `${addDays(start, -1)}T00:00:00.000Z`
    const fetchEnd = `${addDays(endNext, 1)}T00:00:00.000Z`

    const [records, manifests] = await Promise.all([
      fetchAllRows((from, to) => supabase
        .from('service_records')
        .select('id, user_id, data, registro, device_id, deleted_at, deleted_by, deleted_device_id, updated_at, sync_version')
        .gte('data', fetchStart)
        .lt('data', fetchEnd)
        .order('data', { ascending: true })
        .range(from, to)),
      fetchAllRows((from, to) => supabase
        .from('day_sync_manifests')
        .select('*')
        .gte('work_date', start)
        .lt('work_date', endNext)
        .order('sent_at', { ascending: false })
        .range(from, to)),
    ])

    state.range = {
      start,
      end,
      records: records.filter((row) => {
        const key = serviceDateKey(row)
        return key >= start && key <= end
      }),
      manifests: manifests.filter((manifest) => {
        const key = String(manifest.work_date || '').slice(0, 10)
        return key >= start && key <= end
      }),
      loadedKey: `${start}|${end}`,
    }

    closeAllModuleDetails()
    renderModulePages()
    if (showSuccessToast) toast(`Período ${periodLabel()} carregado.`)
    return true
  } catch (error) {
    if (throwOnError) throw error
    toast(friendlyError(error), true)
    return false
  } finally {
    state.rangeLoading = false
    setRangeLoading(false)
  }
}

async function waitForRangeLoading(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (state.rangeLoading && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

function updateCurrentDayIfNeeded() {
  const today = todayInCampoGrande()
  if (today === state.lastKnownToday) return false

  const previousToday = state.lastKnownToday
  state.lastKnownToday = today

  if (!els.dateFilter?.value || els.dateFilter.value === previousToday) {
    setAllDateFilters(today)
  }

  if (!els.monthFilter?.value || els.monthFilter.value === previousToday.slice(0, 7)) {
    setUiControlValue('month-filter', today.slice(0, 7))
  }

  if (state.rangeFollowsToday) {
    setAllRangeFilters(today, today)
    state.range.loadedKey = ''
  }

  return true
}

function startDayRolloverWatcher() {
  clearInterval(state.dayRolloverTimer)
  state.dayRolloverTimer = setInterval(() => {
    const changed = updateCurrentDayIfNeeded()
    if (!changed || document.hidden || !state.profile) return
    loadDashboard(false, 'auto')
    if (state.rangeFollowsToday) loadRangeData(false)
  }, DAY_ROLLOVER_CHECK_MS)
}

async function ensureExportRangeReady(target = 'reports') {
  updateCurrentDayIfNeeded()

  const { start, end } = selectedRange(target)
  validateRange(start, end)
  const expectedKey = `${start}|${end}`

  if (state.range.start !== start || state.range.end !== end) {
    setAllRangeFilters(start, end)
    state.range.loadedKey = ''
  }

  if (state.rangeLoading) await waitForRangeLoading()

  if (state.range.loadedKey !== expectedKey) {
    const loaded = await loadRangeData(false, true)
    if (!loaded || state.range.loadedKey !== expectedKey) {
      throw new Error('O dia selecionado ainda não foi carregado. Atualize o período e tente novamente.')
    }
  }

  return { start, end }
}

function rangeDateInputs() {
  return [els.photosRangeStart, els.photosRangeEnd, els.codesRangeStart, els.codesRangeEnd, els.reportsRangeStart, els.reportsRangeEnd].filter(Boolean)
}

function rangeMonthInputs() {
  return [els.photosRangeMonth, els.codesRangeMonth, els.reportsRangeMonth].filter(Boolean)
}

function setAllRangeFilters(start, end) {
  const month = String(start || todayInCampoGrande()).slice(0, 7)

  for (const prefix of ['photos', 'codes', 'reports']) {
    const startInput = document.getElementById(`${prefix}-range-start`)
    const endInput = document.getElementById(`${prefix}-range-end`)
    const monthInput = document.getElementById(`${prefix}-range-month`)
    if (startInput) startInput.value = start
    if (endInput) endInput.value = end
    if (monthInput) monthInput.value = month
  }

  state.range.start = start
  state.range.end = end
  updatePeriodSelectorSummaries(start, end)
}

function setOrdersRangeFilters(start, end) {
  const month = String(start || todayInCampoGrande()).slice(0, 7)

  if (els.ordersRangeStart) els.ordersRangeStart.value = start
  if (els.ordersRangeEnd) els.ordersRangeEnd.value = end
  if (els.ordersRangeMonth) els.ordersRangeMonth.value = month

  state.ordersRange.start = start
  state.ordersRange.end = end
  updateOrdersPeriodSummary(start, end)
}

function selectedOrdersRange() {
  const start = els.ordersRangeStart?.value || state.ordersRange.start || currentOrdersMonthRange().start
  const end = els.ordersRangeEnd?.value || state.ordersRange.end || currentOrdersMonthRange().end
  return { start, end }
}


function openPeriodSelector(target = 'reports') {
  state.periodSelector.target = ['photos', 'codes', 'reports', 'orders'].includes(target) ? target : 'reports'
  const { start, end } = state.periodSelector.target === 'orders'
    ? selectedOrdersRange()
    : selectedRange(state.periodSelector.target)

  const fullMonth = isCompleteMonthRange(start, end)
  const mode = fullMonth ? 'month' : start === end ? 'day' : 'range'

  // Seed the current mode so opening an already selected single day preserves it.
  // The automatic reset to today is only for an explicit tab change by the user.
  state.periodSelector.mode = mode

  setUiControlValue('period-single-date', mode === 'day' ? start : todayInCampoGrande())
  setUiControlValue('period-multiple-start', start)
  setUiControlValue('period-multiple-end', end)
  setUiControlValue('period-full-month', start.slice(0, 7))
  if (els.periodSelectorError) els.periodSelectorError.textContent = ''

  const names = {
    photos: 'Período das fotos',
    codes: 'Período da planilha em códigos',
    reports: 'Período do relatório',
    orders: 'Data de execução das ordens de serviço',
  }
  if (els.periodSelectorTitle) els.periodSelectorTitle.textContent = names[state.periodSelector.target]

  setPeriodSelectorMode(mode)
  updatePeriodRangePreview()
  els.periodSelectorDialog?.showModal()
}

function closePeriodSelector() {
  closeAllUiControls()
  if (els.periodSelectorDialog?.open) els.periodSelectorDialog.close()
  if (els.periodSelectorError) els.periodSelectorError.textContent = ''
}

function setPeriodSelectorMode(mode) {
  if (!['day', 'range', 'month'].includes(mode)) return

  const previousMode = state.periodSelector.mode
  state.periodSelector.mode = mode

  // When leaving "Mês inteiro" or "Vários dias" and choosing "1 dia",
  // never inherit day 01 from the selected month. Start from today in CG/MS.
  if (mode === 'day' && previousMode !== 'day') {
    setUiControlValue('period-single-date', todayInCampoGrande())
  }

  $$('[data-period-mode]').forEach((button) => {
    const active = button.dataset.periodMode === mode
    button.classList.toggle('active', active)
    button.setAttribute('aria-selected', String(active))
  })

  $$('[data-period-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.periodPanel !== mode)
  })

  if (els.periodSelectorError) els.periodSelectorError.textContent = ''
}

function applyPeriodSelector(event) {
  event.preventDefault()

  try {
    const mode = state.periodSelector.mode
    let start = ''
    let end = ''

    if (mode === 'day') {
      start = els.periodSingleDate?.value || ''
      end = start
      if (!start) throw new Error('Escolha o dia que deseja carregar.')
    } else if (mode === 'range') {
      start = els.periodMultipleStart?.value || ''
      end = els.periodMultipleEnd?.value || ''
      if (!start || !end) throw new Error('Escolha a data inicial e a data final.')
      if (start > end) throw new Error('A data inicial não pode ser depois da data final.')
    } else {
      const month = els.periodFullMonth?.value || ''
      if (!month) throw new Error('Escolha o mês e o ano.')
      const range = monthRangeFromValue(month)
      start = range.start
      end = addDays(range.next, -1)
    }

    validateRange(start, end)

    if (state.periodSelector.target === 'orders') {
      const currentMonth = currentOrdersMonthRange()
      state.ordersRangeFollowsCurrentMonth = (
        start === currentMonth.start &&
        end === currentMonth.end
      )
      setOrdersRangeFilters(start, end)
      closePeriodSelector()
      loadOrdersRangeData(true)
      return
    }

    state.rangeFollowsToday = mode === 'day' && start === todayInCampoGrande()
    setAllRangeFilters(start, end)
    closePeriodSelector()
    loadRangeData(true)
  } catch (error) {
    if (els.periodSelectorError) els.periodSelectorError.textContent = friendlyError(error)
  }
}

function updatePeriodRangePreview() {
  if (!els.periodRangePreview) return
  const start = els.periodMultipleStart?.value || ''
  const end = els.periodMultipleEnd?.value || ''

  if (!start && !end) {
    els.periodRangePreview.textContent = 'Selecione o primeiro e o último dia.'
    return
  }

  if (!start || !end) {
    els.periodRangePreview.textContent = 'Agora escolha a outra data para completar o período.'
    return
  }

  if (start > end) {
    els.periodRangePreview.textContent = 'A data inicial precisa vir antes da data final.'
    return
  }

  const days = daysBetweenInclusive(start, end)
  els.periodRangePreview.textContent = `${formatDate(start)} até ${formatDate(end)} • ${days} dia(s)`
}

function updatePeriodSelectorSummaries(start = state.range.start, end = state.range.end) {
  const label = periodSelectorLabel(start, end)
  ;[els.photosPeriodSummary, els.codesPeriodSummary, els.reportsPeriodSummary].forEach((element) => {
    if (element) element.textContent = label
  })
}

function updateOrdersPeriodSummary(start = state.ordersRange.start, end = state.ordersRange.end) {
  if (els.ordersPeriodSummary) {
    els.ordersPeriodSummary.textContent = periodSelectorLabel(start, end)
  }
}

function periodSelectorLabel(start, end) {
  if (!start || !end) return 'Selecione um período'
  if (start === end) return `Dia ${formatDate(start)}`
  if (isCompleteMonthRange(start, end)) {
    const [year, month] = start.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, 1))
    const label = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  return `${formatDate(start)} até ${formatDate(end)}`
}

function isCompleteMonthRange(start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(end || '')) return false
  if (!start.endsWith('-01')) return false
  const range = monthRangeFromValue(start.slice(0, 7))
  return end === addDays(range.next, -1)
}

function daysBetweenInclusive(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1
}

function selectedRange(target = '') {
  const normalizedTarget = ['photos', 'codes', 'reports'].includes(target) ? target : ''

  if (normalizedTarget) {
    const startInput = document.getElementById(`${normalizedTarget}-range-start`)
    const endInput = document.getElementById(`${normalizedTarget}-range-end`)
    const start = startInput?.value || state.range.start || todayInCampoGrande()
    const end = endInput?.value || state.range.end || start
    return { start, end }
  }

  const start = state.range.start || todayInCampoGrande()
  const end = state.range.end || start
  return { start, end }
}

function handleRangeDateChange(input) {
  const isStart = input.id.endsWith('-start')
  const target = String(input.id || '').split('-')[0]

  if (target === 'orders') {
    let { start, end } = selectedOrdersRange()
    if (isStart) start = input.value || start
    else end = input.value || end
    if (start > end) {
      if (isStart) end = start
      else start = end
    }

    const currentMonth = currentOrdersMonthRange()
    state.ordersRangeFollowsCurrentMonth = start === currentMonth.start && end === currentMonth.end
    setOrdersRangeFilters(start, end)
    loadOrdersRangeData()
    return
  }

  let { start, end } = selectedRange(target)
  if (isStart) start = input.value || start
  else end = input.value || end
  if (start > end) {
    if (isStart) end = start
    else start = end
  }
  state.rangeFollowsToday = start === end && start === todayInCampoGrande()
  setAllRangeFilters(start, end)
  loadRangeData()
}

function applyRangeMonth(value) {
  if (!value) return
  const range = monthRangeFromValue(value)
  const end = addDays(range.next, -1)
  state.rangeFollowsToday = false
  setAllRangeFilters(range.start, end)
  loadRangeData()
}

function validateRange(start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) throw new Error('Selecione a data inicial e a data final.')
  if (start > end) throw new Error('A data inicial não pode ser maior que a data final.')
  const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1
  if (days > 93) throw new Error('Selecione no máximo 93 dias por vez.')
}

function setRangeLoading(value) {
  ;[els.photosRefreshButton, els.codesRefreshButton, els.reportsRefreshButton].forEach((button) => { if (button) button.disabled = value })
}

function setOrdersRangeLoading(value) {
  if (els.ordersRefreshButton) els.ordersRefreshButton.disabled = value
  document.querySelector('[data-open-period-selector="orders"]')?.toggleAttribute('disabled', value)
}
function renderDashboard(options = {}) {
  const team = els.teamFilter.value
  const profileMap = profileMapById()
  const records = team === 'all' ? state.records : recordsForTeam(team, profileMap)
  const manifests = team === 'all' ? state.manifests : manifestsForTeam(team, profileMap)
  state.summary = buildSummary(records, manifests, profileMap)

  const homeActive = state.page === 'home' || options.forceHome === true
  if (homeActive || !state.monthSummary) {
    // JR_FIX_MONTH_SUMMARY_INDEPENDENT_SITE_REAL_V8
    // O calendário de mês/ano controla sozinho o resumo mensal.
    // O seletor diário de equipe não filtra os totais do mês.
    state.monthSummary = buildSummary(
      state.monthRecords,
      state.monthManifests,
      profileMap,
    )
  }

  if (homeActive) {
    renderMetrics()
    renderStatus()
    renderTeamScores()
    renderTable()
    return
  }

  if (options.renderModules !== false) {
    scheduleCurrentModuleRenderV31(state.page)
  }
}


function buildSummary(records, manifests, profileMap) {
  const manifestSnapshots = latestManifestSnapshots(manifests)
  const active = records.filter((row) => !row.deleted_at)
  const deleted = records.filter((row) => row.deleted_at)
  const activeIds = new Set(active.map((row) => String(row.id)))
  const deletedIds = new Set(deleted.map((row) => String(row.id)))
  const expectedActive = unionJsonArrays(manifestSnapshots, 'active_record_ids')
  const expectedDeleted = unionJsonArrays(manifestSnapshots, 'deleted_record_ids')
  const pendingIds = unionJsonArrays(manifestSnapshots, 'pending_record_ids')
  const conflictIds = unionJsonArrays(manifestSnapshots, 'conflict_record_ids')
  const missingRecordIds = [...expectedActive].filter((id) => !activeIds.has(id) && !deletedIds.has(id))
  const deletionPendingIds = [...expectedDeleted].filter((id) => activeIds.has(id))

  let expectedPhotos = 0
  let receivedPhotos = 0
  const missingPhotos = []
  for (const row of active) {
    const record = row.registro || {}
    const label = recordLabel(row, profileMap)
    if (photoExpected(record, 'time')) {
      expectedPhotos += 1
      if (hasText(record.timePhotoStoragePath)) receivedPhotos += 1
      else missingPhotos.push({ type: 'Foto faltando', team: recordTeam(row, profileMap) || 'Sem equipe identificada', workDate: serviceDateKey(row), deviceId: '', userId: String(row.user_id || ''), title: 'Foto de horário não chegou ao Storage', detail: label, severity: 'danger' })
    }
    if (photoExpected(record, 'survey')) {
      expectedPhotos += 1
      if (hasText(record.surveyPhotoStoragePath)) receivedPhotos += 1
      else missingPhotos.push({ type: 'Foto faltando', team: recordTeam(row, profileMap) || 'Sem equipe identificada', workDate: serviceDateKey(row), deviceId: '', userId: String(row.user_id || ''), title: 'Foto de levantamento não chegou ao Storage', detail: label, severity: 'danger' })
    }
  }

  const issueOwners = manifestIssueOwners(manifestSnapshots, profileMap)
  const issues = []

  missingRecordIds.forEach((id) => {
    const owner = issueOwnerFor(issueOwners.active, id)
    issues.push({
      type: 'Ponto não recebido',
      team: owner.team,
      workDate: owner.workDate,
      deviceId: owner.deviceId,
      userId: owner.userId,
      title: 'Ponto salvo no celular, mas ausente no Supabase',
      detail: `ID ${id}`,
      severity: 'danger',
    })
  })

  deletionPendingIds.forEach((id) => {
    const owner = issueOwnerFor(issueOwners.deleted, id)
    issues.push({
      type: 'Exclusão pendente',
      team: owner.team,
      workDate: owner.workDate,
      deviceId: owner.deviceId,
      userId: owner.userId,
      title: 'O celular excluiu, mas o Supabase ainda mostra como válido',
      detail: `ID ${id}`,
      severity: 'danger',
    })
  })

  pendingIds.forEach((id) => {
    const owner = issueOwnerFor(issueOwners.pending, id)
    issues.push({
      type: 'Fila de envio',
      team: owner.team,
      workDate: owner.workDate,
      deviceId: owner.deviceId,
      userId: owner.userId,
      title: 'Alteração aguardando confirmação do servidor',
      detail: `ID ${id}`,
      severity: 'warning',
    })
  })

  conflictIds.forEach((id) => {
    const owner = issueOwnerFor(issueOwners.conflict, id)
    issues.push({
      type: 'Conflito',
      team: owner.team,
      workDate: owner.workDate,
      deviceId: owner.deviceId,
      userId: owner.userId,
      title: 'Ponto alterado em mais de um celular',
      detail: `ID ${id}`,
      severity: 'danger',
    })
  })

  issues.push(...missingPhotos)

  const latestManifest = manifestSnapshots
    .map((manifest) => parseStoredDateTime(manifest.sent_at))
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || null
  const dedupedIssues = dedupeIssues(issues)
  const criticalCount = dedupedIssues.filter((issue) => issue.severity === 'danger').length
  const score = scoreBreakdown(active)
  return {
    records,
    active,
    deleted,
    manifests: manifestSnapshots,
    profileMap,
    expectedPhotos,
    receivedPhotos,
    score,
    issues: dedupedIssues,
    issueCount: dedupedIssues.length,
    criticalCount,
    latestManifest,
  }
}

function renderMetrics() {
  const summary = state.monthSummary
  if (!summary) return
  const totalPoints = summary.score.dayPoints + summary.score.nightPoints
  const totalSurveys = summary.score.daySurveys + summary.score.nightSurveys
  els.topTotal.textContent = summary.score.total
  els.topPoints.textContent = totalPoints
  els.topPointsDay.textContent = summary.score.dayPoints
  els.topPointsNight.textContent = summary.score.nightPoints
  els.topSurveys.textContent = totalSurveys
  els.topSurveysDay.textContent = summary.score.daySurveys
  els.topSurveysNight.textContent = summary.score.nightSurveys
  els.topDeleted.textContent = summary.deleted.length
  els.topPhotos.textContent = `${summary.receivedPhotos}/${summary.expectedPhotos}`
  els.topIssues.textContent = state.summary?.criticalCount ?? 0
}

function renderTeamScores() {
  if (!els.teamScoreGrid) return

  applyTeamScoresVisibility()

  const selected = els.teamFilter.value
  const activeTeams = configuredTeamNames()

  // JR_FIX_ONLY_ACTIVE_APP_TEAMS_SITE_REAL_V8
  // Registros antigos continuam preservados, mas equipe arquivada não recebe cartão.
  const teams = selected === 'all'
    ? activeTeams
    : activeTeams.includes(selected) ? [selected] : []

  renderDailyScoreTotal()

  els.teamScoreGrid.classList.add('team-score-list-v30')

  if (teams.length === 0) {
    els.teamScoreGrid.innerHTML = moduleEmpty('Nenhuma equipe ativa cadastrada.')
    return
  }

  els.teamScoreGrid.innerHTML = teams.map((team) => {
    const summary = (
      selected !== 'all' &&
      normalizeText(team) === normalizeText(selected) &&
      state.summary
    )
      ? state.summary
      : summaryForTeam(team)
    const score = summary.score
    const critical = summary.criticalCount
    const attention = Math.max(0, summary.issueCount - critical)
    const hasIssues = summary.issueCount > 0
    const issueClass = critical > 0 ? 'danger' : 'warning'
    const issueLabel = critical > 0
      ? `${critical} crítica(s)`
      : `${attention} em atenção`

    const issueAction = hasIssues
      ? `<button class="team-list-issue-v30 ${issueClass}" type="button" data-open-team-issues="${encodeURIComponent(team)}" title="Visualizar pendências desta equipe">
          ${icon(critical > 0 ? 'triangle-alert' : 'eye')}
          <span>${escapeHtml(issueLabel)}</span>
        </button>`
      : ''

    return `<article class="team-score-row-v30">
      <div class="team-score-row-name-v30">
        <small>EQUIPE</small>
        <strong>${escapeHtml(team)}</strong>
        <em>${summary.active.length} registro(s) válido(s)</em>
      </div>

      <div class="team-score-row-values-v30">
        <span><small>PONTOS MANHÃ/TARDE</small><strong>${score.dayPoints}</strong></span>
        <span><small>PONTOS NOITE</small><strong>${score.nightPoints}</strong></span>
        <span><small>LEVANTAMENTOS MANHÃ/TARDE</small><strong>${score.daySurveys}</strong></span>
        <span><small>LEVANTAMENTOS NOITE</small><strong>${score.nightSurveys}</strong></span>
      </div>

      <div class="team-score-row-total-v30">
        <small>TOTAL</small>
        <strong>${score.total}</strong>
      </div>

      ${issueAction}
    </article>`
  }).join('')
}

function renderDailyScoreTotal() {
  if (!els.dailyScoreTotal || !state.summary) return
  const score = state.summary.score
  const points = score.dayPoints + score.nightPoints
  const surveys = score.daySurveys + score.nightSurveys
  const scope = els.teamFilter.value === 'all' ? 'TODAS AS EQUIPES' : els.teamFilter.value

  // Administrador e somente leitura veem o mesmo detalhamento da pontuação diária.
  // Fotos e pendências críticas continuam exclusivas do administrador.
  const baseValues = `
    <span class="daily-period-card"><small>PONTOS MANHÃ/TARDE</small><strong>${score.dayPoints}</strong></span>
    <span class="daily-period-card night"><small>PONTOS NOITE</small><strong>${score.nightPoints}</strong></span>
    <span class="daily-period-card"><small>LEVANTAMENTOS MANHÃ/TARDE</small><strong>${score.daySurveys}</strong></span>
    <span class="daily-period-card night"><small>LEVANTAMENTOS NOITE</small><strong>${score.nightSurveys}</strong></span>
    <span class="daily-total-grand"><small>TOTAL GERAL</small><strong>${score.total}</strong></span>`
  let extraValues = ''

  if (isAdmin()) {
    const photoValue = `${state.summary.receivedPhotos}/${state.summary.expectedPhotos}`
    const issueClass = state.summary.criticalCount > 0 ? 'daily-total-warning has-issues' : 'daily-total-warning'
    extraValues = `<span class="daily-total-photos"><small>FOTOS RECEBIDAS</small><strong>${photoValue}</strong><em>Recebidas na data selecionada</em></span><span class="${issueClass}"><small>PENDÊNCIAS CRÍTICAS</small><strong>${state.summary.criticalCount}</strong><em>Exigem atenção</em></span>`
  }

  els.dailyScoreTotal.classList.toggle('viewer-compact', false)
  els.dailyScoreTotal.classList.toggle('viewer-detailed', !isAdmin())
  els.dailyScoreTotal.classList.toggle('admin-detailed', isAdmin())
  els.dailyScoreTotal.innerHTML = `<div class="daily-total-copy"><span class="eyebrow">PONTUAÇÃO TOTAL DO DIA</span><strong>${escapeHtml(scope)}</strong><small>${formatDate(currentDate())}</small></div><div class="daily-total-values">${baseValues}${extraValues}</div>`
}

function scoreItem(iconName, label, value) {
  return `<div class="team-score-item"><span class="team-score-item-icon">${icon(iconName)}</span><div><small>${escapeHtml(label)}</small><strong>${value}</strong></div></div>`
}

function renderStatus() {
  const summary = state.summary
  const date = formatDate(currentDate())
  let className = ''
  let title = 'Sem movimentação'
  let description = `Nenhum ponto ou manifesto encontrado em ${date}.`
  if (summary.records.length > 0 && summary.manifests.length === 0) {
    className = 'warning'; title = 'Aguardando manifesto automático'; description = 'Os registros chegaram, mas o celular ainda não enviou a lista independente para conferência.'
  } else if (summary.criticalCount > 0) {
    className = 'danger'; title = 'Envio incompleto'; description = `${summary.criticalCount} pendência(s) crítica(s) encontrada(s). Os arquivos continuam sendo preparados apenas com pontos válidos.`
  } else if ((summary.issueCount || 0) > 0) {
    className = 'warning'; title = 'Sincronização em andamento'; description = `${summary.issueCount} aviso(s) temporário(s) de sincronização. Nenhuma pendência crítica foi encontrada.`
  } else if (summary.manifests.length > 0) {
    className = 'success'; title = 'Envio completo'; description = `Todos os pontos declarados pelo celular chegaram. Última conferência: ${formatDateTime(summary.latestManifest)}.`
  } else if (summary.records.length > 0) {
    className = 'success'; title = 'Pontos recebidos'; description = 'Os registros do Supabase foram encontrados para esta data e equipe.'
  }
  els.statusBanner.className = `status-banner ${className}`
  els.statusBanner.innerHTML = `<div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><div><strong>${escapeHtml(date)}</strong><span>${escapeHtml(teamLabel())}</span></div>`
}

function switchTableTab(tab) {
  state.tab = tab
  state.visibleRows = 10
  $$('.tab-button').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab))
  renderTable()
}

function renderTable() {
  const summary = state.summary
  if (!summary) return
  const configs = {
    valid: { head: ['ORDEM', 'RUA', 'NÚMERO', 'EQUIPE', 'DATA/HORÁRIO', 'CONTAGEM', 'STATUS', 'AÇÕES'], rows: summary.active, render: renderValidRow },
    deleted: { head: ['ORDEM', 'RUA', 'EQUIPE', 'EXCLUÍDO EM', 'STATUS', 'AÇÕES'], rows: summary.deleted, render: renderDeletedRow },
    issues: { head: ['TIPO', 'EQUIPE', 'PROBLEMA', 'DETALHE', 'PRIORIDADE', 'AÇÕES'], rows: summary.issues, render: renderIssueRow },
  }
  const config = configs[state.tab]
  const orderedRows = [...config.rows].sort((a, b) => {
    if (state.tab === 'valid') return recordSortTimestamp(b) - recordSortTimestamp(a)
    if (state.tab === 'deleted') return dateTimestamp(b.deleted_at) - dateTimestamp(a.deleted_at)
    return 0
  })
  const filtered = orderedRows.filter((row) => rowMatchesRecordKind(row, state.tab) && rowMatchesSearch(row, state.tab, summary.profileMap))
  const visible = filtered.slice(0, state.visibleRows)
  els.tableHead.innerHTML = `<tr>${config.head.map((item) => `<th>${item}</th>`).join('')}</tr>`
  els.tableBody.innerHTML = visible.map((row) => config.render(row, summary.profileMap)).join('')
  els.tableCount.textContent = `${filtered.length} registro(s)`
  els.emptyState.classList.toggle('hidden', filtered.length > 0 || state.loading)
  if (filtered.length === 0 && !state.loading) {
    const title = els.emptyState.querySelector('strong')
    const description = els.emptyState.querySelector('span')
    if (state.tab === 'issues') {
      if (title) title.textContent = 'Nenhuma pendência para esta data'
      if (description) description.textContent = 'A contagem crítica da data selecionada está zerada.'
    } else {
      if (title) title.textContent = 'Nenhum item encontrado'
      if (description) description.textContent = 'Altere a data, equipe ou busca.'
    }
  }
  els.loadMoreButton.classList.toggle('hidden', visible.length >= filtered.length)
}

function renderValidRow(row, profileMap) {
  const record = row.registro || {}
  const count = recordScore(row)
  const period = isMorningRecord(row) ? 'MANHÃ' : 'NOITE'
  return `<tr><td>${escapeHtml(record.orderNumber || '—')}</td><td>${escapeHtml(streetName(record) || '—')}</td><td>${escapeHtml(record.number || '0')}</td><td>${escapeHtml(recordTeam(row, profileMap) || '—')}</td><td>${escapeHtml(formatDateTime(recordDisplayDateTime(row)))}</td><td><span class="count-pill" title="${escapeHtml(count.label)}">${count.total} • ${period}</span></td><td><span class="status-pill confirmed">CONFIRMADO</span></td><td><button class="table-action" data-details-id="${escapeHtml(row.id)}" aria-label="Visualizar registro">${icon('eye')}</button></td></tr>`
}

function renderDeletedRow(row, profileMap) {
  const record = row.registro || {}
  const purgeAction = isAdmin() ? `<button class="table-action danger" data-purge-id="${escapeHtml(row.id)}" aria-label="Excluir definitivamente do Supabase" title="Excluir definitivamente do Supabase">${icon('trash')}</button>` : ''
  return `<tr><td>${escapeHtml(record.orderNumber || '—')}</td><td>${escapeHtml(streetName(record) || '—')}</td><td>${escapeHtml(recordTeam(row, profileMap) || '—')}</td><td>${escapeHtml(formatDateTime(row.deleted_at))}</td><td><span class="status-pill deleted">EXCLUÍDO</span></td><td><div class="table-action-group"><button class="table-action" data-details-id="${escapeHtml(row.id)}" aria-label="Visualizar registro excluído">${icon('eye')}</button>${purgeAction}</div></td></tr>`
}

function renderIssueRow(item) {
  const team = item.team || 'Sem equipe identificada'
  const workDate = item.workDate ? formatDate(item.workDate) : ''
  const device = item.deviceId ? ` • Aparelho ${shortDeviceId(item.deviceId)}` : ''
  const date = workDate ? ` • Data ${workDate}` : ''
  const detail = `${item.detail || ''}${date}${device}`
  const issueKey = encodeURIComponent(issueLookupKey(item))

  return `<tr class="${item.severity === 'danger' ? 'issue-row-danger' : 'issue-row-warning'}">
    <td>${escapeHtml(item.type)}</td>
    <td><strong>${escapeHtml(team)}</strong></td>
    <td>${escapeHtml(item.title)}</td>
    <td>${escapeHtml(detail)}</td>
    <td><span class="status-pill pending">${item.severity === 'danger' ? 'CRÍTICA' : 'ATENÇÃO'}</span></td>
    <td><button class="table-action issue-eye-button" type="button" data-issue-key="${issueKey}" aria-label="Visualizar detalhes da pendência" title="Visualizar detalhes">${icon('eye')}</button></td>
  </tr>`
}

function issueLookupKey(item) {
  return [
    String(item.type || ''),
    String(item.team || ''),
    String(item.detail || ''),
    String(item.workDate || ''),
    String(item.deviceId || ''),
    String(item.severity || ''),
  ].join('|')
}

function showIssueDetails(key) {
  const issue = state.summary?.issues.find((item) => issueLookupKey(item) === key)
  if (!issue) {
    toast('Esta pendência não está mais disponível. Atualize o painel.', true)
    return
  }

  const team = issue.team || 'Sem equipe identificada'
  const priority = issue.severity === 'danger' ? 'CRÍTICA' : 'ATENÇÃO'
  const details = [
    ['Tipo', issue.type || '—'],
    ['Equipe', team],
    ['Prioridade', priority],
    ['Problema', issue.title || '—'],
    ['ID/Detalhe', issue.detail || '—'],
    ['Data', issue.workDate ? formatDate(issue.workDate) : '—'],
    ['Aparelho', issue.deviceId || 'Não informado'],
    ['Usuário do app', issue.userId || 'Não informado'],
  ]

  els.detailsTitle.textContent = `Pendência — ${team}`
  els.detailsBody.innerHTML = `
    <div class="issue-detail-banner ${issue.severity === 'danger' ? 'danger' : 'warning'}">
      <span>${icon('triangle-alert')}</span>
      <div>
        <strong>${escapeHtml(priority)}</strong>
        <small>${escapeHtml(issueResolutionText(issue))}</small>
      </div>
    </div>
    <div class="details-grid">
      ${details.map(([label, value]) => `<div class="detail-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('')}
    </div>
    <div class="issue-detail-actions">
      <button class="outline-button" type="button" data-open-team-issues="${encodeURIComponent(team)}">${icon('eye')}MOSTRAR TODAS DESTA EQUIPE</button>
    </div>`

  if (!els.detailsDialog.open) els.detailsDialog.showModal()
}

function issueResolutionText(issue) {
  if (issue.type === 'Ponto não recebido') return 'Abra o aplicativo no celular desta equipe, conecte a uma internet estável e toque em TENTAR na fila de envio.'
  if (issue.type === 'Fila de envio') return 'O celular ainda aguarda confirmação. Mantenha o aplicativo aberto e use TENTAR.'
  if (issue.type === 'Exclusão pendente') return 'O celular precisa reenviar a exclusão e receber a confirmação do Supabase.'
  if (issue.type === 'Conflito') return 'Confira o mesmo ponto nos aparelhos da equipe antes de reenviar.'
  if (issue.type === 'Foto faltando') return 'Abra o ponto no aplicativo e aguarde o envio da foto ao Storage.'
  return 'Confira o aplicativo da equipe e atualize o painel após a sincronização.'
}

function openTeamIssues(team) {
  const normalizedTeam = String(team || '').trim()
  if (!normalizedTeam) return

  if (els.detailsDialog?.open) els.detailsDialog.close()

  setUiControlValue('team-filter', normalizedTeam)
  state.search = ''
  els.searchInput.value = ''
  state.recordKind = 'all'
  setUiControlValue('record-kind-filter', 'all')
  renderDashboard({ renderModules: false })
  switchTableTab('issues')

  requestAnimationFrame(() => {
    document.querySelector('.records-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  toast(`Mostrando as pendências da equipe ${normalizedTeam}.`)
}

function shortDeviceId(value) {
  const textValue = String(value || '').trim()
  if (!textValue) return ''
  return textValue.length <= 12 ? textValue : `${textValue.slice(0, 6)}…${textValue.slice(-4)}`
}

function rowMatchesRecordKind(row, tab) {
  if (tab !== 'valid' || state.recordKind === 'all') return true
  const score = recordScore(row)
  return state.recordKind === 'surveys' ? score.levantamento > 0 : score.normal > 0
}

function rowMatchesSearch(row, tab, profileMap) {
  if (!state.search) return true
  if (tab === 'issues') return issueSearchText(row).includes(state.search)
  return recordSearchText(row, profileMap).includes(state.search)
}

function showRecordDetails(id) {
  const row = state.summary?.records.find((item) => String(item.id) === String(id)) || state.records.find((item) => String(item.id) === String(id)) || state.range.records.find((item) => String(item.id) === String(id)) || state.monthRecords.find((item) => String(item.id) === String(id)) || state.ordersRange.records.find((item) => String(item.id) === String(id))
  if (!row) return
  const record = row.registro || {}
  const profileMap = profileMapById()
  els.detailsTitle.textContent = record.orderNumber ? `Ordem ${record.orderNumber}` : 'Ponto sem ordem'
  const details = [
    ['Período', isMorningRecord(row) ? 'Manhã/tarde' : 'Noite'],
    ['Equipe', recordTeam(row, profileMap) || '—'], ['Data/hora', formatDateTime(record.timePhotoTakenAt || row.data)],
    ['Rua', streetName(record) || '—'], ['Número', record.number || '0'], ['Bairro', neighborhoodName(record) || '—'],
    ['Serviço', displayName(record.serviceType?.name) || '—'], ['Ordem de serviço', record.orderNumber || '—'], ['Observação', record.observation || '—'],
  ]
  const photoButtons = [
    photoButton(record.timePhotoStorageBucket, record.timePhotoStoragePath, 'Abrir foto de horário'),
    photoButton(record.surveyPhotoStorageBucket, record.surveyPhotoStoragePath, 'Abrir levantamento'),
  ].filter(Boolean).join('')
  els.detailsBody.innerHTML = `<div class="details-grid">${details.map(([label, value]) => `<div class="detail-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('')}</div>${photoButtons ? `<div class="photo-actions">${photoButtons}</div>` : ''}`
  if (!els.detailsDialog.open) els.detailsDialog.showModal()
}

function photoButton(bucket, path, label) {
  if (!hasText(path)) return ''
  return `<button class="outline-button" data-photo-bucket="${escapeHtml(bucket || 'fotos')}" data-photo-path="${escapeHtml(path)}">${icon('image')}${escapeHtml(label)}</button>`
}

function openPurgeDialog(id) {
  if (!isAdmin()) return
  const row = state.records.find((item) => String(item.id) === String(id))
  if (!row || !row.deleted_at) {
    toast('Somente pontos já excluídos podem ser apagados definitivamente.', true)
    return
  }
  state.purgeRecordId = String(id)
  const record = row.registro || {}
  els.purgeTitle.textContent = record.orderNumber ? `Ordem ${record.orderNumber}` : `Registro ${row.id}`
  els.purgeDescription.textContent = `${recordTeam(row) || 'Equipe sem nome'} • ${streetName(record) || 'Sem rua'}. O registro e as fotos vinculadas serão removidos definitivamente.`
  els.purgeDialog.showModal()
}

function closePurgeDialog() {
  state.purgeRecordId = null
  if (els.purgeDialog.open) els.purgeDialog.close()
}

async function purgeExcludedRecord() {
  const id = state.purgeRecordId
  const row = state.records.find((item) => String(item.id) === String(id))
  if (!id || !row?.deleted_at) return

  setButtonLoading(els.purgeConfirm, true, 'EXCLUINDO...')
  try {
    const { error } = await supabase.rpc('admin_purge_excluded_record', { p_record_id: id })
    if (error) throw error

    const storageGroups = storagePathsByBucket(row.registro || {})
    let storageWarning = false
    for (const [bucket, paths] of storageGroups) {
      if (paths.length === 0) continue
      const { error: storageError } = await supabase.storage.from(bucket).remove(paths)
      if (storageError) storageWarning = true
    }

    closePurgeDialog()
    await loadDashboard()
    toast(storageWarning ? 'Ponto removido do Supabase. Algumas fotos não puderam ser apagadas do Storage.' : 'Ponto e fotos removidos definitivamente do Supabase.', storageWarning)
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    setButtonLoading(els.purgeConfirm, false, 'EXCLUIR DO SUPABASE')
  }
}

function storagePathsByBucket(record) {
  const groups = new Map()
  const add = (bucket, path) => {
    if (!hasText(path)) return
    const key = String(bucket || 'fotos')
    if (!groups.has(key)) groups.set(key, [])
    if (!groups.get(key).includes(String(path))) groups.get(key).push(String(path))
  }
  add(record.timePhotoStorageBucket, record.timePhotoStoragePath)
  add(record.timePhotoThumbnailStorageBucket || record.timePhotoStorageBucket, record.timePhotoThumbnailStoragePath)
  add(record.surveyPhotoStorageBucket, record.surveyPhotoStoragePath)
  add(record.surveyPhotoThumbnailStorageBucket || record.surveyPhotoStorageBucket, record.surveyPhotoThumbnailStoragePath)
  return groups
}

async function openStoragePhoto(bucket, path) {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 180)
    if (error) throw error
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  } catch (error) { toast(friendlyError(error), true) }
}


function bindLightSearch(input, timerKey, onApply, helpElement = null) {
  if (!input) return

  input.setAttribute('autocomplete', 'off')
  input.setAttribute('autocapitalize', 'none')
  input.setAttribute('spellcheck', 'false')

  input.addEventListener('input', () => {
    clearTimeout(state.searchTimers[timerKey])

    const query = normalizeText(input.value)
    const empty = query.length === 0
    const ready = query.length >= SEARCH_MIN_LENGTH

    if (helpElement) {
      helpElement.textContent = empty
        ? 'Digite pelo menos 3 caracteres. Sem sugestões automáticas.'
        : ready
          ? 'Pesquisando somente nos dados já carregados.'
          : `Digite mais ${SEARCH_MIN_LENGTH - query.length} caractere(s).`
      helpElement.classList.toggle('ready', ready)
    }

    if (!ready) {
      onApply('')
      return
    }

    state.searchTimers[timerKey] = setTimeout(() => {
      onApply(query)
    }, SEARCH_DEBOUNCE_MS)
  })
}

function searchRecordSignature(row, team) {
  return [
    row?.id,
    row?.updated_at,
    row?.sync_version,
    row?.deleted_at,
    team,
  ].join('|')
}

function recordSearchText(row, profileMap = profileMapById()) {
  const id = String(row?.id || '')
  const record = row?.registro || {}
  const team = recordTeam(row, profileMap) || ''
  const signature = searchRecordSignature(row, team)
  const cached = state.recordSearchCache.get(id)

  if (cached?.signature === signature) return cached.text

  const service = lookupDisplayName(record.serviceType, [
    record.serviceTypeName,
    record.serviceName,
    record.tipoServicoNome,
  ])

  const text = normalizeText([
    record.orderNumber,
    streetName(record),
    record.number,
    neighborhoodName(record),
    team,
    service,
    record.observation,
    record.surveyObservation,
    record.stampedTimeText,
    record.vehiclePlate,
    row.device_id,
    row.id,
    serviceDateKey(row),
  ].filter(Boolean).join(' '))

  state.recordSearchCache.set(id, { signature, text })

  if (state.recordSearchCache.size > 12000) {
    const oldestKeys = [...state.recordSearchCache.keys()].slice(0, 2000)
    oldestKeys.forEach((key) => state.recordSearchCache.delete(key))
  }

  return text
}

function issueSearchText(issue) {
  return normalizeText([
    issue?.type,
    issue?.team,
    issue?.title,
    issue?.detail,
    issue?.workDate,
    issue?.deviceId,
    issue?.userId,
    issue?.severity,
  ].filter(Boolean).join(' '))
}

function reportSearchIsAvailable() {
  return Boolean(selectedReportTeamName()) && state.range.start === state.range.end
}

function syncReportSearchAvailability() {
  if (!els.reportsObservationFilter) return

  const team = selectedReportTeamName()
  const teamSelected = Boolean(team)
  const singleDay = state.range.start === state.range.end
  const enabled = teamSelected && singleDay
  const tools = document.getElementById('reports-team-tools-v22')
  const teamName = document.getElementById('reports-selected-team-name-v22')

  tools?.classList.toggle('hidden', !teamSelected)
  if (teamName) teamName.textContent = team || 'Nenhuma equipe'

  els.reportsObservationFilter.disabled = !enabled
  els.reportsObservationFilter.placeholder = enabled
    ? 'Ordem, rua, número, bairro ou observação...'
    : singleDay
      ? 'Selecione uma equipe para pesquisar'
      : 'Selecione somente um dia para pesquisar'

  if (!enabled) {
    clearTimeout(state.searchTimers.reports)
    state.reportObservation = ''
    els.reportsObservationFilter.value = ''
  }

  document.getElementById('reports-search-help')?.remove()
  els.reportsSearchHelp = null

  if (els.reportsObservationOptions) {
    els.reportsObservationOptions.innerHTML = ''
  }
}

function renderReportsSearchOnly() {
  syncReportSearchAvailability()
  const teams = teamsForRange()
  renderReportTeams(teams)

  if (state.moduleTeams.reports) {
    openReportsTeam(state.moduleTeams.reports, true)
  }
}

function loadedGlobalSearchRecords() {
  const map = new Map()

  for (const source of [
    state.records,
    state.range.records,
    state.monthRecords,
    state.ordersRange.records,
  ]) {
    for (const row of source || []) {
      const id = String(row?.id || '')
      if (id && !map.has(id)) map.set(id, row)
    }
  }

  return [...map.values()]
}

function handleGlobalSearch(event) {
  event.preventDefault()

  const rawQuery = String(els.globalSearchInput?.value || '').trim()
  const query = normalizeText(rawQuery)

  if (query.length < SEARCH_MIN_LENGTH) {
    if (els.globalSearchStatus) {
      els.globalSearchStatus.textContent = `Digite pelo menos ${SEARCH_MIN_LENGTH} caracteres.`
      els.globalSearchStatus.classList.add('error')
    }
    els.globalSearchInput?.focus()
    return
  }

  if (els.globalSearchStatus) {
    els.globalSearchStatus.textContent = 'Pesquisando nos dados carregados...'
    els.globalSearchStatus.classList.remove('error')
  }

  if (els.globalSearchButton) {
    els.globalSearchButton.disabled = true
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        showGlobalSearchResults(rawQuery, query)
      } finally {
        if (els.globalSearchButton) els.globalSearchButton.disabled = false
      }
    }, 0)
  })
}

function showGlobalSearchResults(rawQuery, query) {
  const profileMap = profileMapById()
  const recordResults = []
  const issueResults = []

  for (const row of loadedGlobalSearchRecords()) {
    if (recordSearchText(row, profileMap).includes(query)) {
      recordResults.push(row)
      if (recordResults.length >= GLOBAL_SEARCH_LIMIT) break
    }
  }

  for (const issue of state.summary?.issues || []) {
    if (issueSearchText(issue).includes(query)) {
      issueResults.push(issue)
      if (recordResults.length + issueResults.length >= GLOBAL_SEARCH_LIMIT) break
    }
  }

  recordResults.sort((a, b) => recordSortTimestamp(b) - recordSortTimestamp(a))
  const total = recordResults.length + issueResults.length

  if (state.page !== 'search') switchPage('search', true)


  if (els.globalSearchResults) {
    els.globalSearchResults.innerHTML = total === 0
      ? `<div class="search-page-empty-v21">
          <span>${icon('search')}</span>
          <strong>Nenhum resultado encontrado</strong>
          <p>Tente ordem, rua, número, bairro, equipe, serviço, observação, ID ou pendência.</p>
        </div>`
      : `<div class="global-search-results-v19 search-page-result-list-v21">
          ${[
            ...recordResults.map((row) => renderGlobalRecordResult(row, profileMap)),
            ...issueResults.map((issue) => renderGlobalIssueResult(issue)),
          ].join('')}
        </div>
        ${total >= GLOBAL_SEARCH_LIMIT
          ? `<p class="global-search-limit-v19">Exibindo os primeiros ${GLOBAL_SEARCH_LIMIT} resultados para manter o painel leve.</p>`
          : ''}`
  }

  if (els.globalSearchStatus) {
    els.globalSearchStatus.textContent = `${total} resultado(s) nos dados carregados.`
    els.globalSearchStatus.classList.remove('error')
  }

  requestAnimationFrame(() => {
    els.globalSearchResults?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function clearGlobalSearch() {
  if (els.globalSearchInput) {
    els.globalSearchInput.value = ''
    els.globalSearchInput.focus()
  }

  if (els.globalSearchStatus) {
    els.globalSearchStatus.textContent = ''
    els.globalSearchStatus.classList.remove('error')
  }

  if (els.globalSearchResults) {
    els.globalSearchResults.innerHTML = `
      <div class="search-page-empty-v21 search-page-empty-clean-v30">
        <span>${icon('search')}</span>
        <strong>Nenhuma pesquisa realizada</strong>
        <p>Digite um termo acima para começar.</p>
      </div>`
  }
}

function renderGlobalRecordResult(row, profileMap) {
  const record = row.registro || {}
  const order = String(record.orderNumber || '').trim() || 'Sem ordem'
  const street = streetName(record) || 'Rua não informada'
  const number = String(record.number || '').trim()
  const neighborhood = neighborhoodName(record) || 'Bairro não informado'
  const team = recordTeam(row, profileMap) || 'Equipe não identificada'
  const address = number && number !== '0' ? `${street}, ${number}` : street

  return `<button class="global-search-result-card-v19" type="button" data-details-id="${escapeHtml(row.id)}">
    <span class="global-result-icon-v19">${icon('file-text')}</span>
    <span class="global-result-copy-v19">
      <strong>${escapeHtml(order)} • ${escapeHtml(address)}</strong>
      <small>${escapeHtml(neighborhood)} • ${escapeHtml(team)}</small>
      <em>${escapeHtml(formatDateTime(recordDisplayDateTime(row)))}</em>
    </span>
    <span class="global-result-arrow-v19">${icon('eye')}</span>
  </button>`
}

function renderGlobalIssueResult(issue) {
  const key = encodeURIComponent(issueLookupKey(issue))
  return `<button class="global-search-result-card-v19 danger" type="button" data-issue-key="${key}">
    <span class="global-result-icon-v19">${icon('triangle-alert')}</span>
    <span class="global-result-copy-v19">
      <strong>${escapeHtml(issue.type || 'Pendência')} • ${escapeHtml(issue.team || 'Sem equipe')}</strong>
      <small>${escapeHtml(issue.title || issue.detail || 'Pendência encontrada')}</small>
      <em>${escapeHtml(issue.workDate ? formatDate(issue.workDate) : 'Data não informada')}</em>
    </span>
    <span class="global-result-arrow-v19">${icon('eye')}</span>
  </button>`
}
function renderModulePages() {
  moduleRenderCacheV31.clear()
  if (state.page !== 'home' && state.page !== 'settings') {
    scheduleCurrentModuleRenderV31(state.page)
  }
}




function importedRecordsForRangeV21(start, end) {
  try { return window.__JR_IMPORTED_RECORDS_V21__?.recordsForRange?.(start,end) || [] } catch (_error) { return [] }
}
function mergeImportedRowsV21(rows, start, end) {
  const seen=new Set((rows||[]).map(row=>String(row?.id||'')))
  const imported=importedRecordsForRangeV21(start,end).filter(row=>!seen.has(String(row?.id||'')))
  return [...(rows||[]),...imported]
}
function codesRecordsForTeamV21(team) {
  const normalized=normalizeText(team)
  const profileMap=profileMapById()
  const normal=rangeSummaryForTeam(team).active
  return mergeImportedRowsV21(normal,state.range.start,state.range.end)
    .filter(row=>normalizeText(recordTeam(row,profileMap))===normalized)
    .sort((a,b)=>recordSortTimestamp(a)-recordSortTimestamp(b)||String(a.id||'').localeCompare(String(b.id||'')))
}
function codesTeamsForRangeV21(teams) {
  const profileMap=profileMapById()
  const names=new Set(teams||[])
  importedRecordsForRangeV21(state.range.start,state.range.end).forEach(row=>{const team=recordTeam(row,profileMap);if(team)names.add(team)})
  return [...names].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'))
}

function syncOrdersTeamFilter() {
  if (!els.ordersTeamFilter) return

  const profileMap = profileMapById()
  const names = new Set(configuredTeamNames())
  const mergedRecords = mergeImportedRowsV21(
    state.ordersRange.records,
    state.ordersRange.start,
    state.ordersRange.end,
  )

  mergedRecords.forEach((row) => {
    const team = recordTeam(row, profileMap)
    if (team) names.add(team)
  })

  const teams = [...names]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const previous = state.ordersTeam || els.ordersTeamFilter.value || 'all'
  const nextHtml = '<option value="all">Todas as equipes</option>' +
    teams.map((team) => '<option value="' + escapeHtml(team) + '">' + escapeHtml(team) + '</option>').join('')

  if (els.ordersTeamFilter.innerHTML !== nextHtml) {
    els.ordersTeamFilter.innerHTML = nextHtml
  }
  const exists = [...els.ordersTeamFilter.options].some((option) => option.value === previous)
  state.ordersTeam = exists ? previous : 'all'
  els.ordersTeamFilter.value = state.ordersTeam
  refreshCustomSelect('orders-team-filter')
}

function ordersForSelectedRange() {
  const profileMap = profileMapById()
  const selectedTeam = normalizeText(state.ordersTeam)
  const search = state.ordersSearch

  return mergeImportedRowsV21(
    state.ordersRange.records,
    state.ordersRange.start,
    state.ordersRange.end,
  )
    .filter((row) => {
      if (row.deleted_at) return false
      const record = row.registro || {}
      const order = String(record.orderNumber || '').trim()
      if (!order) return false

      const team = recordTeam(row, profileMap)
      if (selectedTeam && selectedTeam !== 'all' && normalizeText(team) !== selectedTeam) return false
      if (search && !recordSearchText(row, profileMap).includes(search)) return false
      return true
    })
    .sort((a, b) => {
      const dayDifference = serviceDateKey(b).localeCompare(serviceDateKey(a))
      if (dayDifference) return dayDifference
      return recordSortTimestamp(b) - recordSortTimestamp(a) || String(b.id || '').localeCompare(String(a.id || ''))
    })
}

function renderOrdersPage() {
  if (!els.ordersTableBody) return

  syncOrdersTeamFilter()
  const profileMap = profileMapById()
  const records = ordersForSelectedRange()
  const visible = records.slice(0, state.ordersVisibleRows)

  const uniqueOrders = new Set(records.map((row) => normalizeText(row.registro?.orderNumber)).filter(Boolean)).size
  const uniqueTeams = new Set(records.map((row) => recordTeam(row, profileMap)).filter(Boolean)).size
  const uniqueStreets = new Set(records.map((row) => {
    const record = row.registro || {}
    return normalizeText(`${streetName(record)}|${record.number || ''}`)
  }).filter(Boolean)).size

  if (els.ordersMetricOrders) els.ordersMetricOrders.textContent = String(uniqueOrders)
  if (els.ordersMetricExecutions) els.ordersMetricExecutions.textContent = String(records.length)
  if (els.ordersMetricTeams) els.ordersMetricTeams.textContent = String(uniqueTeams)
  if (els.ordersMetricStreets) els.ordersMetricStreets.textContent = String(uniqueStreets)

  els.ordersTableBody.innerHTML = visible.map((row) => renderOrderServiceRow(row, profileMap)).join('')
  els.ordersTableCount.textContent = `${records.length} execução(ões) • ${uniqueOrders} ordem(ns) diferente(s)`
  els.ordersEmptyState.classList.toggle('hidden', records.length > 0)

  if (records.length === 0) {
    const title = els.ordersEmptyState.querySelector('strong')
    const description = els.ordersEmptyState.querySelector('span')
    if (title) title.textContent = 'Nenhuma ordem de serviço encontrada'
    if (description) description.textContent = 'Altere a data, a equipe ou pesquise ordem, rua, número, bairro, serviço ou observação.'
  }

  els.ordersLoadMoreButton.classList.toggle('hidden', visible.length >= records.length)
  els.ordersLoadMoreButton.textContent = visible.length >= records.length
    ? 'TODAS AS ORDENS CARREGADAS'
    : `VER MAIS ORDENS (${records.length - visible.length})`
}

function renderOrderServiceRow(row, profileMap) {
  const record = row.registro || {}
  const order = String(record.orderNumber || '').trim()
  const team = recordTeam(row, profileMap) || 'Equipe não identificada'
  const street = streetName(record) || 'Rua não informada'
  const number = String(record.number || '').trim()
  const neighborhood = neighborhoodName(record) || ''
  const service = lookupDisplayName(record.serviceType, [
    record.serviceTypeName,
    record.serviceName,
    record.tipoServicoNome,
  ]) || 'Serviço não informado'
  const executionDay = serviceDateKey(row)
  const executionTime = formatOrderExecutionTime(row)
  const address = number && number !== '0' ? `${street}, ${number}` : street

  return `<tr>
    <td><span class="order-service-number"><small>OS</small><strong>${escapeHtml(order)}</strong></span></td>
    <td><div class="order-date-cell"><strong>${escapeHtml(executionDay ? formatDate(executionDay) : '—')}</strong><small>${escapeHtml(executionTime)}</small></div></td>
    <td><div class="order-address-cell"><strong>${escapeHtml(address)}</strong><small>${escapeHtml(neighborhood || 'Bairro não informado')}</small></div></td>
    <td><span class="order-team-badge">${icon('users')}<strong>${escapeHtml(team)}</strong></span></td>
    <td><div class="order-service-type"><strong>${escapeHtml(service)}</strong><small>${escapeHtml(recordObservationText(record) || 'Sem observação')}</small></div></td>
    <td><span class="status-pill confirmed">EXECUTADA</span></td>
    <td><button class="table-action order-eye-action" type="button" data-details-id="${escapeHtml(row.id)}" aria-label="Visualizar ordem ${escapeHtml(order)}" title="Visualizar detalhes">${icon('eye')}</button></td>
  </tr>`
}

function formatOrderExecutionTime(row) {
  const date = parseStoredDateTime(recordDisplayDateTime(row))
  if (date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: APP_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const stamped = String(row?.registro?.stampedTimeText || '').trim()
  return stamped || 'Horário não informado'
}

function renderPhotoTeams(teams) {
  if (!els.photosTeamList) return
  if (teams.length === 0) {
    els.photosTeamList.innerHTML = moduleEmpty('Nenhuma equipe com dados neste período.')
    return
  }
  els.photosTeamList.innerHTML = teams.map((team) => {
    const summary = rangeSummaryForTeam(team)
    return teamFolderCard({
      team,
      action: 'data-open-photo-team',
      iconName: 'image',
      headline: `${summary.receivedPhotos}/${summary.expectedPhotos} fotos recebidas`,
      detail: `${summary.active.length} ponto(s) válido(s) • ${summary.criticalCount} pendência(s)`,
      badge: summary.receivedPhotos === summary.expectedPhotos && summary.expectedPhotos > 0 ? 'COMPLETO' : summary.expectedPhotos === 0 ? 'SEM FOTOS' : 'INCOMPLETO',
      badgeClass: summary.receivedPhotos === summary.expectedPhotos && summary.expectedPhotos > 0 ? 'confirmed' : 'pending',
    })
  }).join('')
}

function renderCodeTeams(teams) {
  if (!els.codesTeamList) return
  const visibleTeams=codesTeamsForRangeV21(teams)
  if (visibleTeams.length === 0) { els.codesTeamList.innerHTML=moduleEmpty('Nenhuma equipe com pontos neste período.'); return }
  els.codesTeamList.innerHTML=visibleTeams.map((team)=>{
    const records=codesRecordsForTeamV21(team)
    const score=scoreBreakdown(records)
    return teamFolderCard({team,action:'data-open-code-team',iconName:'table',headline:String(score.total)+' ponto(s) contabilizado(s)',detail:String(records.length)+' registro(s) válido(s) • importações incluídas',badge:records.length>0?'PRONTO':'VAZIO',badgeClass:records.length>0?'confirmed':'pending'})
  }).join('')
}

function renderReportTeams(teams) {
  if (!els.reportsTeamList) return
  if (teams.length === 0) {
    els.reportsTeamList.innerHTML = moduleEmpty('Nenhuma equipe com dados neste período.')
    return
  }
  els.reportsTeamList.innerHTML = teams.map((team) => {
    const summary = rangeSummaryForTeam(team)
    const filtered = reportRecordsForTeam(team)
    return teamFolderCard({
      team,
      action: 'data-open-report-team',
      iconName: 'file-text',
      headline: `${scoreBreakdown(filtered).total} ponto(s) • ${filtered.length} registro(s) filtrado(s)`,
      detail: `${summary.active.length} válido(s) no período • ${summary.deleted.length} excluído(s)`,
      badge: filtered.length > 0 ? 'PRONTO' : 'SEM RESULTADO',
      badgeClass: filtered.length > 0 ? 'confirmed' : 'pending',
    })
  }).join('')
}

function teamFolderCard({ team, action, iconName, headline, detail, badge, badgeClass }) {
  return `<button class="team-folder-card jr-team-folder-card-v27 jr-team-card-clean-v29" type="button" ${action}="${encodeURIComponent(team)}">
    <span class="folder-card-icon">${icon(iconName)}</span>
    <span class="folder-card-copy jr-folder-copy-v27 jr-team-copy-clean-v29"><strong>${escapeHtml(team)}</strong><small>${escapeHtml(headline)}</small><em>${escapeHtml(detail)}</em></span>
    <span class="status-pill ${badgeClass}">${escapeHtml(badge)}</span>
    <span class="folder-card-arrow">${icon('arrow-right')}</span>
  </button>`
}

function moduleEmpty(message) {
  return `<div class="module-empty"><span>${icon('archive')}</span><strong>Sem dados</strong><p>${escapeHtml(message)}</p></div>`
}

async function openPhotoFolder(team, silent = false) {
  if (!team) return

  const openToken = ++photoOpenTokenV37
  state.moduleTeams.photos = team
  els.photosTeamList.classList.add('hidden')
  els.photosFolderDetail.classList.remove('hidden')
  els.photosFolderTitle.textContent = `${team} — ${periodLabel()}`
  const summary = rangeSummaryForTeam(team)
  els.photosFolderSummary.textContent = `${summary.receivedPhotos} foto(s) recebida(s) de ${summary.expectedPhotos} esperada(s).`
  const downloadablePhotoCountV301 = photoEntries(summary.active).length
  els.photosTeamDownload.disabled = downloadablePhotoCountV301 === 0
  els.photosGrid.innerHTML = `<div class="loading-state"><span class="spinner"></span>Carregando fotos da equipe...</div>`

  const entries = photoEntries(summary.active)
  if (entries.length === 0) {
    els.photosGrid.innerHTML = moduleEmpty('Nenhuma foto original recebida no Storage para esta equipe no período.')
    return
  }

  const previewLimit = isMobileLayoutV37() ? 36 : 120
  const previewEntries = entries.slice(0, previewLimit)
  const rendered = await mapWithConcurrencyV37(
    previewEntries,
    isMobileLayoutV37() ? 5 : 12,
    async (entry) => {
    try {
      const { data, error } = await supabase.storage.from(entry.bucket).createSignedUrl(entry.path, 900)
      if (error) throw error
      return `<article class="photo-card">
        <button type="button" class="photo-preview-button" data-photo-bucket="${escapeHtml(entry.bucket)}" data-photo-path="${escapeHtml(entry.path)}" aria-label="Abrir ${escapeHtml(entry.label)}">
          <img src="${escapeHtml(data.signedUrl)}" alt="${escapeHtml(entry.label)}" loading="lazy" />
        </button>
        <div><strong>${escapeHtml(entry.fileName)}</strong><span>${escapeHtml(entry.label)}</span><small>${escapeHtml(entry.order)} • ${escapeHtml(entry.street)}</small></div>
      </article>`
    } catch (_error) {
      return `<article class="photo-card photo-error"><div class="photo-error-icon">${icon('triangle-alert')}</div><div><strong>${escapeHtml(entry.fileName)}</strong><span>Não foi possível abrir a miniatura</span></div></article>`
    }
  })

  if (
    openToken !== photoOpenTokenV37 ||
    state.moduleTeams.photos !== team
  ) {
    return
  }

  const remainingPhotos = Math.max(0, entries.length - previewEntries.length)
  els.photosGrid.innerHTML = rendered.join('') + (remainingPhotos > 0 ? `<div class="photo-preview-limit"><strong>Mais ${remainingPhotos} foto(s) no período</strong><span>Use o botão de ZIP para baixar todas sem carregar milhares de miniaturas.</span></div>` : '')

  if (!silent) focusModuleDetailV37(els.photosFolderDetail)
}

function refreshOpenPhotoFolder() {
  const team = state.moduleTeams.photos
  if (!team || !teamsForRange().includes(team)) return closePhotoFolder()
  openPhotoFolder(team, true)
}

function closePhotoFolder() {
  photoOpenTokenV37 += 1
  state.moduleTeams.photos = null
  els.photosFolderDetail.classList.add('hidden')
  els.photosTeamList.classList.remove('hidden')
  els.photosGrid.innerHTML = ''
}

function openCodesTeam(team, silent = false) {
  if (!team) return
  state.moduleTeams.codes=team
  els.codesTeamList.classList.add('hidden')
  els.codesTeamDetail.classList.remove('hidden')
  const records=codesRecordsForTeamV21(team)
  els.codesTeamTitle.textContent=String(team)+' — '+periodLabel()
  els.codesTeamSummary.textContent=String(records.length)+' ponto(s) válido(s). Registros importados também entram na planilha em códigos.'
  els.codesTeamDownload.disabled=records.length===0
  els.codesPreview.innerHTML=recordsPreview(records,profileMapById(),{newestFirst:false,showObservation:true})
  if(!silent)focusModuleDetailV37(els.codesTeamDetail)
}

function closeCodesTeam() {
  state.moduleTeams.codes = null
  els.codesTeamDetail.classList.add('hidden')
  els.codesTeamList.classList.remove('hidden')
}

function openReportsTeam(team, silent = false) {
  if (!team) return
  state.moduleTeams.reports = team
  els.reportsTeamList.classList.add('hidden')
  els.reportsTeamDetail.classList.remove('hidden')
  syncReportSearchAvailability()
  const records = reportRecordsForTeam(team)
  const allSummary = rangeSummaryForTeam(team)
  els.reportsTeamTitle.textContent = `${team} — ${periodLabel()}`
  els.reportsTeamSummary.textContent = `${records.length} registro(s) após os filtros. ${allSummary.deleted.length} excluído(s) não entram no arquivo.`
  els.reportsTeamDownload.disabled = records.length === 0
  els.reportsPreview.innerHTML = recordsPreview(records, allSummary.profileMap, { newestFirst: false, showObservation: true })
  if (!silent) focusModuleDetailV37(els.reportsTeamDetail)
}

function closeReportsTeam() {
  state.moduleTeams.reports = null
  state.reportObservation = ''
  if (els.reportsObservationFilter) els.reportsObservationFilter.value = ''
  syncReportSearchAvailability()
  els.reportsTeamDetail.classList.add('hidden')
  els.reportsTeamList.classList.remove('hidden')
}

function closeAllModuleDetails() {
  closePhotoFolder()
  closeCodesTeam()
  closeReportsTeam()
}

function recordsPreview(records, profileMap, options = {}) {
  if (records.length === 0) return moduleEmpty('Nenhum ponto válido desta equipe para gerar a planilha.')

  const ordered = [...records].sort((a, b) => {
    const difference = recordSortTimestamp(a) - recordSortTimestamp(b)
    return options.newestFirst ? -difference : difference
  })

  const rows = ordered.slice(0, 12).map((row) => {
    const record = row.registro || {}
    const observation = recordObservationText(record)
    return `<tr>
      <td>${escapeHtml(formatDateTime(recordDisplayDateTime(row)))}</td>
      <td>${escapeHtml(record.orderNumber || '—')}</td>
      <td>${escapeHtml(streetName(record) || '—')}</td>
      <td>${escapeHtml(record.number || '0')}</td>
      <td class="observation-cell">${escapeHtml(observation || '—')}</td>
    </tr>`
  }).join('')

  const remaining = Math.max(0, ordered.length - 12)
  const orderText = options.newestFirst ? 'Horários mais recentes aparecem primeiro.' : 'Horários mais antigos aparecem primeiro.'
  return `<div class="preview-summary"><span>${icon('shield-check')}</span><div><strong>${scoreBreakdown(records).total} ponto(s) em ${records.length} registro(s) válido(s)</strong><small>${escapeHtml(orderText)} As observações também entram na planilha.</small></div></div><div class="table-wrap compact-table"><table><thead><tr><th>Data/horário</th><th>Ordem</th><th>Rua</th><th>Número</th><th>Observações</th></tr></thead><tbody>${rows}</tbody></table></div>${remaining > 0 ? `<p class="preview-note">Mais ${remaining} registro(s) serão incluídos no arquivo.</p>` : ''}`
}

function recordObservationText(record) {
  const normal = String(record?.observation || '').trim()
  const survey = String(record?.surveyObservation || '').trim()

  if (normal && survey && normalizeText(normal) !== normalizeText(survey)) {
    return `${normal} • Levantamento: ${survey}`
  }

  return normal || survey
}

async function downloadCodesForTeam(team) {
  if (!isAdmin()) { toast('Acesso negado. Esta ação exige permissão de administrador.', true); return }
  try {
    const selected=await ensureExportRangeReady('codes')
    const normalizedTeam=requireSpecificTeam(team)
    await window.__JR_IMPORTED_RECORDS_V21__?.refreshRange?.(selected.start,selected.end)
    const records=codesRecordsForTeamV21(normalizedTeam)
    if(records.length===0)throw new Error('Nenhum registro válido foi encontrado neste período.')
    toast('Gerando uma planilha em códigos com registros do aplicativo e importados...')
    await downloadCodesWorkbook(records,rangeExportContextFor(normalizedTeam,records,selected))
    toast('Planilha em códigos gerada do horário mais antigo para o mais novo.')
  } catch(error){toast(friendlyError(error),true)}
}

async function downloadNamesForTeam(team) {
  try {
    const selected = await ensureExportRangeReady('reports')
    const normalizedTeam = requireSpecificTeam(team)
    const records = reportRecordsForTeam(normalizedTeam)
    if (records.length === 0) throw new Error('Nenhum registro corresponde aos filtros selecionados.')
    toast('Gerando uma planilha em nomes com o período e os filtros...')
    await downloadNamesWorkbook(records, rangeExportContextFor(normalizedTeam, records, selected))
    toast('Relatório gerado do horário mais antigo para o mais novo.')
  } catch (error) { toast(friendlyError(error), true) }
}

async function downloadPhotosZipForTeam(team) {
  try {
    const normalizedTeam = requireSpecificTeam(team)
    await downloadPhotosZipForRange(normalizedTeam)
  } catch (error) {
    toast(friendlyError(error), true)
  }
}
function photoRowsForDownloadV301(team = 'all') {
  const profileMap = profileMapById()
  const source = team === 'all'
    ? state.range.records
    : recordsForTeam(team, profileMap, state.range.records)
  return source.filter((row) => !row.deleted_at)
}
function photoEntryCountForDownloadV301(team = 'all') {
  return photoEntries(photoRowsForDownloadV301(team)).length
}
function setPhotoDownloadButtonLoadingV301(button, loading, label) {
  if (!button) return
  button.disabled = loading
  button.setAttribute('aria-busy', String(loading))
  if (!loading) button.removeAttribute('aria-busy')

  let labelNode = button.querySelector('.button-label')
  if (!labelNode) {
    const iconNode = button.querySelector('svg, [data-icon]')
    const iconHtml = iconNode?.outerHTML || ''
    button.innerHTML = `${iconHtml}<span class="button-label">${escapeHtml(label)}</span>`
    labelNode = button.querySelector('.button-label')
  }
  if (labelNode) labelNode.textContent = label
}
async function downloadPhotosZipForRange(team = 'all') {
  if (!canDownloadPhotos()) {
    toast('Acesso negado. Este usuario nao pode baixar fotos.', true)
    return
  }

  let normalizedTeam = 'all'
  let button = els.photosAllDownload
  let idleLabel = 'BAIXAR TODAS AS FOTOS'

  try {
    normalizedTeam = team === 'all' ? 'all' : requireSpecificTeam(team)
    button = normalizedTeam === 'all' ? els.photosAllDownload : els.photosTeamDownload
    idleLabel = normalizedTeam === 'all' ? 'BAIXAR TODAS AS FOTOS' : 'BAIXAR PASTA ZIP'
    setPhotoDownloadButtonLoadingV301(button, true, 'GERANDO ZIP...')

    const { start, end } = await ensureExportRangeReady('photos')
    validateRange(start, end)

    const photoCount = photoEntryCountForDownloadV301(normalizedTeam)
    if (photoCount <= 0) {
      throw new Error('Nenhuma foto original foi encontrada no Storage para este periodo.')
    }

    const teamLabelValue = normalizedTeam === 'all' ? 'todas as equipes' : normalizedTeam
    toast(`Gerando ZIP de ${teamLabelValue} com ${photoCount} foto(s). Pode demorar sem travar o painel.`)

    const result = await adminApiRequest('/api/admin/photo-exports', {
      method: 'POST',
      body: { start, end, team: normalizedTeam },
      timeoutMs: 600000,
    })

    if (!result?.downloadUrl) throw new Error('O servidor nao retornou o endereco do ZIP.')

    const link = document.createElement('a')
    link.href = `${ADMIN_API_BASE_URL}${String(result.downloadUrl).startsWith('/') ? result.downloadUrl : `/${result.downloadUrl}`}`
    link.download = ''
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()

    toast(`${result.photoCount || photoCount} foto(s) organizadas por equipe e dia. Download iniciado.`)
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    setPhotoDownloadButtonLoadingV301(button, false, idleLabel)
  }
}

function requireSpecificTeam(team) {
  const normalized = String(team || '').trim()
  if (!normalized || normalized === 'all' || normalizeText(normalized) === 'todas as equipes') {
    throw new Error('Selecione uma equipe. Não é permitido gerar arquivos misturando todas as equipes.')
  }
  return normalized
}

function summaryForTeam(team) {
  const key = [
    currentDate(),
    state.lastDashboardLoadAt,
    state.records.length,
    state.manifests.length,
    normalizeText(team),
  ].join('|')

  if (teamSummaryCacheV37.has(key)) {
    return teamSummaryCacheV37.get(key)
  }

  const profileMap = profileMapById()
  const summary = buildSummary(
    recordsForTeam(team, profileMap),
    manifestsForTeam(team, profileMap),
    profileMap
  )

  teamSummaryCacheV37.set(key, summary)

  if (teamSummaryCacheV37.size > 80) {
    const oldestKey = teamSummaryCacheV37.keys().next().value
    teamSummaryCacheV37.delete(oldestKey)
  }

  return summary
}


function rangeSummaryForTeam(team) {
  const profileMap = profileMapById()
  return buildSummary(
    recordsForTeam(team, profileMap, state.range.records),
    manifestsForTeam(team, profileMap, state.range.manifests),
    profileMap,
  )
}

function teamsForRange() {
  const profileMap = profileMapById()
  const names = new Set(configuredTeamNames())
  state.range.records.forEach((row) => { const team = recordTeam(row, profileMap); if (team) names.add(team) })
  state.range.manifests.forEach((manifest) => { const team = profileMap.get(manifest.user_id)?.team_name || manifest.team_name; if (team) names.add(String(team).trim()) })
  return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function reportRecordsForTeam(team) {
  const summary = rangeSummaryForTeam(team)
  return summary.active
    .filter((row) => {
      const score = recordScore(row)
      if (state.reportKind === 'points' && score.normal === 0) return false
      if (state.reportKind === 'surveys' && score.levantamento === 0) return false
      if (state.reportObservation && state.range.start === state.range.end) {
        if (!recordSearchText(row, summary.profileMap).includes(state.reportObservation)) return false
      }
      return true
    })
    .sort((a, b) => recordSortTimestamp(a) - recordSortTimestamp(b) || String(a.id || '').localeCompare(String(b.id || '')))
}

function renderObservationSuggestions() {
  // V19: sugestões removidas para evitar trabalho desnecessário no navegador.
  if (els.reportsObservationOptions) els.reportsObservationOptions.innerHTML = ''
}

function periodLabel(start = state.range.start, end = state.range.end) {
  return start === end ? formatDate(start) : `${formatDate(start)} até ${formatDate(end)}`
}

function rangeExportContextFor(team, records, range = selectedRange()) {
  const plates = [...new Set(records.map((row) => String(row.registro?.vehiclePlate || '').trim()).filter(Boolean))]
  const start = range.start
  const end = range.end
  return {
    date: start,
    startDate: start,
    endDate: end,
    periodLabel: periodLabel(start, end),
    team,
    vehiclePlate: plates.length === 1 ? plates[0] : plates.length > 1 ? 'DIVERSAS' : '-',
  }
}

function recordsForTeam(team, profileMap = profileMapById(), source = state.records) {
  const normalized = normalizeText(team)
  return source.filter((row) => normalizeText(recordTeam(row, profileMap)) === normalized)
}

function manifestsForTeam(team, profileMap = profileMapById(), source = state.manifests) {
  const normalized = normalizeText(team)
  return source.filter((manifest) => {
    const profileTeam = profileMap.get(manifest.user_id)?.team_name || ''
    return normalizeText(profileTeam || manifest.team_name) === normalized
  })
}

function teamsForCurrentDate() {
  const profileMap = profileMapById()
  const names = new Set(configuredTeamNames())
  state.records.forEach((row) => { const team = recordTeam(row, profileMap); if (team) names.add(team) })
  state.manifests.forEach((manifest) => { const team = profileMap.get(manifest.user_id)?.team_name || manifest.team_name; if (team) names.add(String(team).trim()) })
  return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function configuredTeamNames() {
  return [...new Set(state.profiles
    .filter((profile) => profile.active && profile.role === 'team' && hasText(profile.team_name))
    .map((profile) => profile.team_name.trim()))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function profileMapById() {
  return new Map(state.profiles.map((profile) => [profile.id, profile]))
}

function recordTeam(row, profileMap = profileMapById()) {
  const record = row.registro || {}
  return String(profileMap.get(row.user_id)?.team_name || record.teamName || '').trim()
}

function photoEntries(records) {
  const entries = []
  records.forEach((row) => {
    const record = row.registro || {}
    const street = streetName(record) || 'Sem rua'
    const order = record.orderNumber || row.id
    if (hasText(record.timePhotoStoragePath)) {
      entries.push({
        rowId: row.id,
        bucket: record.timePhotoStorageBucket || 'fotos',
        path: record.timePhotoStoragePath,
        fileName: record.timePhotoFileName || `${row.id}_HORARIO.jpg`,
        label: 'Foto de horário',
        order,
        street,
      })
    }
    if (hasText(record.surveyPhotoStoragePath)) {
      entries.push({
        rowId: row.id,
        bucket: record.surveyPhotoStorageBucket || 'fotos',
        path: record.surveyPhotoStoragePath,
        fileName: record.surveyPhotoFileName || `${row.id}_LEVANTAMENTO.jpg`,
        label: 'Foto de levantamento',
        order,
        street,
      })
    }
  })
  return entries
}

function uniqueZipName(original, usedNames) {
  const safe = safeZipName(original)
  if (!usedNames.has(safe)) { usedNames.add(safe); return safe }
  const dot = safe.lastIndexOf('.')
  const base = dot > 0 ? safe.slice(0, dot) : safe
  const extension = dot > 0 ? safe.slice(dot) : ''
  let index = 1
  let candidate = `${base}_${index}${extension}`
  while (usedNames.has(candidate)) { index += 1; candidate = `${base}_${index}${extension}` }
  usedNames.add(candidate)
  return candidate
}

function exportContextFor(team, records) {
  const plates = [...new Set(records.map((row) => String(row.registro?.vehiclePlate || '').trim()).filter(Boolean))]
  return { date: currentDate(), team, vehiclePlate: plates.length === 1 ? plates[0] : plates.length > 1 ? 'DIVERSAS' : '-' }
}

function isAdmin() { return state.profile?.role === 'admin' }
function canDownloadPhotos() { return ['admin', 'viewer'].includes(state.profile?.role) }

function asciiJson(value) { return JSON.stringify(value).replace(/[^\x00-\x7F]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`) }

function allowedPages() {
  return isAdmin()
    ? new Set(['home', 'search', 'photos', 'settings', 'codes', 'orders', 'services', 'reports'])
    : new Set(['home', 'search', 'photos', 'orders', 'services', 'reports'])
}

function canAccessPage(page) {
  return allowedPages().has(page)
}

function applyRoleUi() {
  const admin = isAdmin()
  document.body.classList.toggle('viewer-mode', !admin)
  document.body.classList.toggle('admin-mode', admin)
  $$('.admin-only').forEach((element) => element.classList.toggle('hidden', !admin))
  $$('.viewer-only').forEach((element) => element.classList.toggle('hidden', admin))
  $$('.nav-item').forEach((button) => button.classList.toggle('hidden', !canAccessPage(button.dataset.page)))
  const subtitle = $('.admin-profile small')
  if (subtitle) subtitle.textContent = admin ? 'Administrador' : 'Somente leitura'
  if (!canAccessPage(state.page)) switchPage('home', true)
}

async function checkAdminApi() {
  if (!isAdmin()) return
  try {
    const result = await adminApiRequest('/api/admin/status')
    state.adminApiReady = Boolean(result.configured)
    renderAdminApiStatus(result.message)
  } catch (error) {
    state.adminApiReady = false
    renderAdminApiStatus(friendlyError(error), true)
  }
  renderAccesses()
}

function renderAdminApiStatus(message = '', error = false) {
  if (!els.adminApiStatus) return
  els.adminApiStatus.classList.toggle('error', error || !state.adminApiReady)
  els.adminApiStatus.classList.toggle('success', state.adminApiReady)
  els.adminApiStatus.innerHTML = state.adminApiReady
    ? `<span class="info-box-icon">${icon('shield-check')}</span><div><strong>Gerenciamento seguro ativado</strong><p>Criacao de equipes, troca de senhas e arquivamento disponiveis.</p></div>`
    : `<span class="info-box-icon">${icon('triangle-alert')}</span><div><strong>Gerenciamento de usuarios ainda nao configurado</strong><p>${escapeHtml(message || 'Execute CONFIGURAR_CHAVE_ADMIN.bat uma unica vez e reinicie o site.')}</p></div>`
}

function renderAccesses() {
  if (!els.accessesTableBody) return
  const profiles = [...state.profiles].sort((a, b) => {
    const aActive = a.active ? 0 : 1
    const bActive = b.active ? 0 : 1
    return aActive - bActive || String(a.team_name || a.username || '').localeCompare(String(b.team_name || b.username || ''), 'pt-BR')
  })
  els.accessesEmpty.classList.toggle('hidden', profiles.length > 0)
  els.accessesTableBody.innerHTML = profiles.map((profile) => {
    const current = profile.id === state.profile?.id
    const role = accessRoleLabel(profile.role)
    const roleClass = profile.role === 'admin' ? 'confirmed' : profile.role === 'viewer' ? 'info' : 'neutral'
    const disabled = !state.adminApiReady || !isAdmin()
    return `<tr>
      <td><strong>${escapeHtml(profile.username || '—')}</strong>${current ? '<small class="current-user-label">VOCÊ</small>' : ''}</td>
      <td>${escapeHtml(profile.team_name || '—')}</td>
      <td><span class="status-pill ${roleClass}">${escapeHtml(role)}</span></td>
      <td>${profile.active ? '<span class="status-pill confirmed">ATIVO</span>' : '<span class="status-pill deleted">ARQUIVADO</span>'}</td>
      <td><div class="access-actions">
        <button class="table-action" type="button" data-edit-access="${escapeHtml(profile.id)}" aria-label="Editar acesso" title="Editar acesso" ${disabled ? 'disabled' : ''}>${icon('edit')}</button>
        <button class="table-action" type="button" data-password-access="${escapeHtml(profile.id)}" aria-label="Trocar senha" title="Trocar senha" ${disabled ? 'disabled' : ''}>${icon('key')}</button>
        <button class="table-action danger" type="button" data-archive-access="${escapeHtml(profile.id)}" aria-label="Arquivar acesso" title="Arquivar acesso" ${(disabled || current || !profile.active) ? 'disabled' : ''}>${icon('trash')}</button>
      </div></td>
    </tr>`
  }).join('')
}

function accessRoleLabel(role) {
  if (role === 'admin') return 'ADMINISTRADOR'
  if (role === 'viewer') return 'SOMENTE LEITURA'
  return 'EQUIPE'
}

function syncAccessRoleValue() {
  els.accessRole.value = els.accessType.value === 'team' ? 'team' : els.accessPermission.value
}

function syncAccessFormFields() {
  const isTeamAccess = els.accessType.value === 'team'
  els.accessTeamNameField.classList.toggle('hidden', !isTeamAccess)
  els.accessPermissionField.classList.toggle('hidden', isTeamAccess)
  els.accessTeamName.required = isTeamAccess
  syncAccessRoleValue()
}

function openAccessDialog(id = null, passwordOnly = false) {
  if (!isAdmin()) return
  if (!state.adminApiReady) {
    toast('Configure primeiro a chave administrativa local.', true)
    return
  }
  const profile = id ? state.profiles.find((item) => String(item.id) === String(id)) : null
  if (id && !profile) return
  state.accessEditId = profile?.id || null
  els.accessForm.reset()
  els.accessFormError.textContent = ''
  els.accessUserId.value = profile?.id || ''
  const role = profile?.role || 'team'
  setUiControlValue('access-type', role === 'team' ? 'team' : 'site')
  setUiControlValue('access-permission', role === 'viewer' ? 'viewer' : 'admin')
  els.accessRole.value = role
  els.accessUsername.value = profile?.username || ''
  els.accessTeamName.value = profile?.team_name || ''
  els.accessActive.checked = profile?.active ?? true
  els.accessPassword.value = ''
  els.accessPassword.type = 'password'
  els.accessTogglePassword.innerHTML = icon('eye')
  els.accessUsername.readOnly = Boolean(profile)
  els.accessDialogTitle.textContent = profile ? (passwordOnly ? 'Trocar senha' : 'Editar acesso') : 'Novo acesso'
  els.accessPasswordHelp.textContent = profile ? 'Deixe vazio para manter a senha atual.' : 'Obrigatória para novo acesso.'
  els.accessPassword.required = !profile
  syncAccessFormFields()
  els.accessDialog.showModal()
  setTimeout(() => {
    if (passwordOnly) els.accessPassword.focus()
    else if (!profile) els.accessUsername.focus()
    else if (els.accessType.value === 'team') els.accessTeamName.focus()
    else els.accessPassword.focus()
  }, 30)
}

function closeAccessDialog() {
  state.accessEditId = null
  els.accessFormError.textContent = ''
  els.accessPassword.type = 'password'
  els.accessTogglePassword.innerHTML = icon('eye')
  if (els.accessDialog.open) els.accessDialog.close()
}

async function saveAccess(event) {
  event.preventDefault()
  if (!isAdmin() || !state.adminApiReady) return
  els.accessFormError.textContent = ''
  try {
    const username = normalizeUsername(els.accessUsername.value)
    syncAccessRoleValue()
    const role = els.accessRole.value
    const teamName = role === 'team'
      ? els.accessTeamName.value.trim()
      : username
    const password = els.accessPassword.value
    if (role === 'team' && !teamName) throw new Error('Informe a equipe ou o nome de exibição.')
    if (!state.accessEditId && password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')
    if (password && password.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.')

    setSimpleButtonLoading(els.accessSave, true, 'SALVANDO...')
    const payload = { username, team_name: teamName, role, active: els.accessActive.checked }
    if (password) payload.password = password
    const editing = Boolean(state.accessEditId)
    if (editing) {
      await adminApiRequest(`/api/admin/users/${encodeURIComponent(state.accessEditId)}`, { method: 'PATCH', body: payload })
    } else {
      await adminApiRequest('/api/admin/users', { method: 'POST', body: payload })
    }
    closeAccessDialog()
    await loadProfiles()
    toast(editing ? 'Acesso atualizado com sucesso.' : 'Acesso criado com sucesso.')
  } catch (error) {
    els.accessFormError.textContent = friendlyError(error)
  } finally {
    setSimpleButtonLoading(els.accessSave, false, 'SALVAR ACESSO')
  }
}

function openArchiveAccessDialog(id) {
  if (!isAdmin() || !state.adminApiReady) return
  const profile = state.profiles.find((item) => String(item.id) === String(id))
  if (!profile || profile.id === state.profile?.id) return
  state.archiveAccessId = profile.id
  els.archiveAccessTitle.textContent = profile.role === 'team' ? 'Arquivar equipe?' : 'Arquivar usuário?'
  els.archiveAccessDescription.textContent = `${profile.team_name || profile.username}. O login será bloqueado, mas todos os pontos e históricos permanecerão salvos.`
  els.archiveAccessDialog.showModal()
}

function closeArchiveAccessDialog() {
  state.archiveAccessId = null
  if (els.archiveAccessDialog.open) els.archiveAccessDialog.close()
}

async function archiveAccess() {
  const id = state.archiveAccessId
  if (!id || !isAdmin() || !state.adminApiReady) return
  try {
    setSimpleButtonLoading(els.archiveAccessConfirm, true, 'ARQUIVANDO...')
    await adminApiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
    closeArchiveAccessDialog()
    await loadProfiles()
    toast('Acesso arquivado. Os registros antigos foram preservados.')
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    setSimpleButtonLoading(els.archiveAccessConfirm, false, 'ARQUIVAR ACESSO')
  }
}

async function adminApiRequest(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.')

  const normalizedPath = String(path || '').startsWith('/')
    ? String(path)
    : `/${String(path || '')}`
  const url = `${ADMIN_API_BASE_URL}${normalizedPath}`
  const controller = new AbortController()
  const timeoutMs = Math.max(5000, Math.min(Number(options.timeoutMs || 15000), 900000))
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: options.body ? asciiJson(options.body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    let payload = {}
    try {
      payload = await response.json()
    } catch (_error) {
      payload = {}
    }

    if (!response.ok) {
      throw new Error(
        payload.error ||
        payload.message ||
        `Falha no serviço administrativo (${response.status}).`
      )
    }

    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        `O servidor administrativo demorou mais de ${Math.ceil(timeoutMs / 1000)} segundos. A operação foi cancelada sem recarregar o painel.`
      )
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
function switchPage(page, silent = false) {
  let target = page
  if (!canAccessPage(target)) {
    target = 'home'
    if (!silent) toast('Acesso negado. Sua permissão não libera esta área.', true)
  }

  const samePage = state.page === target
  closeAllUiControls()
  state.page = target

  $$('.page-section').forEach((section) => {
    const active = section.id === `page-${target}`
    section.classList.toggle('hidden', !active)
    section.setAttribute('aria-hidden', String(!active))
    section.toggleAttribute('inert', !active)
  })
  $$('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === target)
  })

  closeSidebar()
  document.dispatchEvent(new CustomEvent('jr:pagechange', { detail: { page: target } }))

  if (target === 'search') {
    requestAnimationFrame(() => els.globalSearchInput?.focus({ preventScroll: true }))
  }

  requestAnimationFrame(() => {
    if (target === 'home') {
      if (!samePage || !state.monthSummary) {
        renderDashboard({ renderModules: false, forceHome: true })
      }
      return
    }

    if (target === 'settings') {
      if (state.accessesDirtyV7 || !samePage) {
        renderAccesses()
        state.accessesDirtyV7 = false
      }
      if (isAdmin() && !state.adminApiCheckStartedV7) {
        state.adminApiCheckStartedV7 = true
        void checkAdminApi()
      }
      return
    }

    if (target === 'orders') {
      void ensureOrdersCurrentMonthLoaded()
    }

    if (!samePage) scheduleCurrentModuleRenderV31(target)
  })
}


function openSidebar() {
  if (els.appView?.classList.contains('hidden')) return

  els.sidebar?.classList.add('open')
  els.sidebar?.setAttribute('aria-hidden', 'false')
  els.sidebarOverlay?.classList.add('show')
  els.sidebarOverlay?.setAttribute('aria-hidden', 'false')
  document.body.classList.add('sidebar-open')
}

function closeSidebar() {
  els.sidebar?.classList.remove('open', 'show', 'active')
  els.sidebarOverlay?.classList.remove('show', 'open', 'active')
  els.sidebarOverlay?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('sidebar-open')
}

function subscribeRealtime() {
  stopPollingOnly()
  setConnection(true)
  scheduleNextPollingRefresh()
}

function scheduleNextPollingRefresh() {
  stopPollingOnly()
  if (!state.autoRefresh || !state.profile) return

  const delay = AUTO_REFRESH_BASE_MS + Math.floor(Math.random() * AUTO_REFRESH_JITTER_MS)
  state.pollingTimer = setTimeout(async () => {
    try {
      await loadDashboard(false, 'auto')
    } finally {
      scheduleNextPollingRefresh()
    }
  }, delay)
}

function handlePanelVisibilityChange() {
  if (document.hidden) return

  const dayChanged = updateCurrentDayIfNeeded()
  if (dayChanged && state.profile && state.rangeFollowsToday) loadRangeData(false)

  if (!state.autoRefresh || !state.profile) return
  if (!dayChanged && Date.now() - state.lastDashboardLoadAt < AUTO_REFRESH_MIN_GAP_MS) return
  loadDashboard(false, 'auto')
}

function handlePanelFocus() {
  const dayChanged = updateCurrentDayIfNeeded()
  if (!dayChanged || !state.profile) return
  loadDashboard(false, 'auto')
  if (state.rangeFollowsToday) loadRangeData(false)
}

function handlePanelOnline() {
  const dayChanged = updateCurrentDayIfNeeded()
  if (dayChanged && state.profile && state.rangeFollowsToday) loadRangeData(false)
  if (!state.autoRefresh || !state.profile) return
  loadDashboard(false, 'auto')
}

function scheduleRealtimeRefresh() {
  if (!state.autoRefresh) return
  clearTimeout(state.realtimeTimer)
  state.realtimeTimer = setTimeout(() => loadDashboard(false, 'auto'), 1500)
}

function stopPollingOnly() {
  clearTimeout(state.pollingTimer)
  clearInterval(state.pollingTimer)
  state.pollingTimer = null
}

function stopRealtime() {
  clearTimeout(state.realtimeTimer)
  stopPollingOnly()
  if (state.realtimeChannel) supabase.removeChannel(state.realtimeChannel)
  state.realtimeChannel = null
}

function setMobileViewportMode(mode) {
  const appActive = mode === 'app'

  document.documentElement.classList.toggle('app-active', appActive)
  document.body.classList.toggle('app-active', appActive)
  document.documentElement.classList.toggle('login-active', !appActive)
  document.body.classList.toggle('login-active', !appActive)

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  })
}

function showApp() {
  setSessionViewsV32('app')
  switchPage('home', true)
}

function showLogin() {
  setSessionViewsV32('login')
  hideLoadingScreenV34()

  if (els.password) els.password.value = ''

  state.profile = null
  state.adminApiReady = false
  state.loading = false

  els.loadingState?.classList.add('hidden')
  els.loginError?.classList.remove('hidden')
}

function togglePassword() {
  const show = els.password.type === 'password'
  els.password.type = show ? 'text' : 'password'
  els.togglePassword.innerHTML = icon(show ? 'eye-off' : 'eye')
}

function toggleAccessPassword() {
  const show = els.accessPassword.type === 'password'
  els.accessPassword.type = show ? 'text' : 'password'
  els.accessTogglePassword.innerHTML = icon(show ? 'eye-off' : 'eye')
}

function setLoading(value) {
  state.loading = value
  els.loadingState.classList.toggle('hidden', !value)
  ;[els.refreshButton].forEach((button) => { if (button) button.disabled = value })
  if (value) els.emptyState.classList.add('hidden')
}

function setConnection(connected) {
  els.connectionStatus.classList.toggle('error', !connected)
  els.connectionStatus.lastChild.textContent = connected ? ' Sistema conectado em tempo real' : ' Falha de conexão com o Supabase'
}

function setButtonLoading(button, loading, label) {
  button.disabled = loading
  const labelNode = button.querySelector('.button-label')
  if (labelNode) labelNode.textContent = label
}

function setSimpleButtonLoading(button, loading, label) {
  if (!button) return
  button.disabled = loading
  const textNode = button.querySelector('.button-label')
  if (textNode) textNode.textContent = label
  else {
    const iconHtml = button.querySelector('svg') ? button.querySelector('span')?.outerHTML || '' : ''
    button.innerHTML = `${iconHtml}<span class="button-label">${escapeHtml(label)}</span>`
  }
}

function toast(message, error = false) {
  els.toast.textContent = message
  els.toast.classList.toggle('error', error)
  els.toast.classList.add('show')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => els.toast.classList.remove('show'), 4200)
}

function isServiceLevantamento(record) {
  const code = String(record?.serviceType?.code || '').trim()
  const name = normalizeText(record?.serviceType?.name || '')
  return code === '162' || name.includes('levantamento')
}

function hasSurveyPhotoFilled(record) {
  return [
    record?.surveyPhotoFileName,
    record?.surveyPhotoPath,
    record?.surveyPhotoTakenAt,
    record?.surveyPhotoStoragePath,
    record?.surveyPhotoThumbnailStoragePath,
  ].some(hasText)
}

function recordScore(row) {
  const record = row?.registro || row || {}
  const normal = isServiceLevantamento(record) ? 0 : 1
  const levantamento = isServiceLevantamento(record) || hasSurveyPhotoFilled(record) ? 1 : 0
  const parts = []
  if (normal) parts.push('Ponto')
  if (levantamento) parts.push('Levantamento')
  return { normal, levantamento, total: normal + levantamento, label: parts.join(' + ') || 'Sem pontuação' }
}







function scoreBreakdown(records) {
  const score = {
    dayPoints: 0,
    daySurveys: 0,
    nightPoints: 0,
    nightSurveys: 0,
    total: 0,
  }

  records.forEach((row) => {
    const value =
      recordScore(row)

    if (value.normal) {
      if (
        isDayMinutesMainV28(
          pointMinutesMainV28(row),
        )
      ) {
        score.dayPoints +=
          value.normal
      } else {
        score.nightPoints +=
          value.normal
      }
    }

    if (value.levantamento) {
      if (
        isDayMinutesMainV28(
          surveyMinutesMainV28(row),
        )
      ) {
        score.daySurveys +=
          value.levantamento
      } else {
        score.nightSurveys +=
          value.levantamento
      }
    }
  })

  score.total =
    score.dayPoints +
    score.daySurveys +
    score.nightPoints +
    score.nightSurveys

  return score
}

function recordDisplayDateTime(row) {
  const record = row?.registro || {}
  return record.timePhotoTakenAt || record.surveyPhotoTakenAt || row?.data
}

function dateTimestamp(value) {
  const date = parseStoredDateTime(value)
  return date ? date.getTime() : 0
}

function recordSortTimestamp(row) {
  const record = row?.registro || {}

  for (const value of [
    record.timePhotoTakenAt,
    record.surveyPhotoTakenAt,
    record.photoSyncUpdatedAt,
  ]) {
    const timestamp = dateTimestamp(value)
    if (timestamp) return timestamp
  }

  const serviceDay = serviceDateKey(row)
  const rawTime = String(record.stampedTimeText || '')
    .trim()
    .replaceAll('.', ':')
    .replaceAll('H', ':')
    .replaceAll('h', ':')
  const match = rawTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (serviceDay && match) {
    const hour = String(Math.min(23, Number(match[1]))).padStart(2, '0')
    const minute = String(Math.min(59, Number(match[2]))).padStart(2, '0')
    const second = String(Math.min(59, Number(match[3] || 0))).padStart(2, '0')
    const timestamp = dateTimestamp(`${serviceDay}T${hour}:${minute}:${second}`)
    if (timestamp) return timestamp
  }

  return (
    dateTimestamp(record.date) ||
    dateTimestamp(row?.data) ||
    dateTimestamp(row?.updated_at) ||
    0
  )
}




function clockMinutesMainV28(value) {
  const raw =
    String(value || '')
      .trim()
      .replaceAll('.', ':')
      .replaceAll('_', ':')
      .replaceAll('-', ':')

  if (!raw) return null

  const photo =
    raw.match(
      /(?:^|\D)\d{8}[\s:_-]?(\d{2})(\d{2})(\d{2})?(?:\D|$)/,
    )

  if (photo) {
    const hour =
      Number(photo[1])
    const minute =
      Number(photo[2])

    if (
      hour <= 23 &&
      minute <= 59
    ) {
      return (
        hour * 60 +
        minute
      )
    }
  }

  const separated =
    raw.match(
      /(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?:\D|$)/,
    )

  if (separated) {
    return (
      Number(separated[1]) * 60 +
      Number(separated[2])
    )
  }

  const compact =
    raw.match(
      /(?:^|\D)([01]\d|2[0-3])([0-5]\d)(?:[0-5]\d)?(?:\D|$)/,
    )

  if (compact) {
    return (
      Number(compact[1]) * 60 +
      Number(compact[2])
    )
  }

  return null
}

function storedMinutesMainV28(value) {
  if (!value) return null

  const date =
    parseStoredDateTime(value)

  if (!date) return null

  const parts =
    new Intl.DateTimeFormat(
      'en-GB',
      {
        timeZone:
          APP_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      },
    ).formatToParts(date)

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ],
      ),
    )

  return (
    Number(values.hour) * 60 +
    Number(values.minute)
  )
}

function pointMinutesMainV28(row) {
  const record =
    row?.registro || row || {}

  for (const value of [
    record.timePhotoTakenAt,
  ]) {
    const result =
      storedMinutesMainV28(value)

    if (
      Number.isFinite(result)
    ) {
      return result
    }
  }

  for (const value of [
    record.timePhotoFileName,
    record.timePhotoPath,
    record.stampedTimeText,
  ]) {
    const result =
      clockMinutesMainV28(value)

    if (
      Number.isFinite(result)
    ) {
      return result
    }
  }

  return null
}

function surveyMinutesMainV28(row) {
  const record =
    row?.registro || row || {}

  for (const value of [
    record.surveyPhotoTakenAt,
  ]) {
    const result =
      storedMinutesMainV28(value)

    if (
      Number.isFinite(result)
    ) {
      return result
    }
  }

  for (const value of [
    record.surveyPhotoFileName,
    record.surveyPhotoPath,
  ]) {
    const result =
      clockMinutesMainV28(value)

    if (
      Number.isFinite(result)
    ) {
      return result
    }
  }

  if (
    isServiceLevantamento(
      record,
    )
  ) {
    return pointMinutesMainV28(
      row,
    )
  }

  return null
}

function isDayMinutesMainV28(minutes) {
  return (
    Number.isFinite(minutes) &&
    minutes >= 360 &&
    minutes < 1050
  )
}

function recordMinutes(row) {
  const record =
    row?.registro || row || {}

  const minutes =
    isServiceLevantamento(
      record,
    )
      ? surveyMinutesMainV28(row)
      : pointMinutesMainV28(row)

  return Number.isFinite(minutes)
    ? minutes
    : 0
}

function isMorningRecord(row) {
  return isDayMinutesMainV28(
    recordMinutes(row),
  )
}

function recordLabel(row, profileMap) {
  const record = row.registro || {}
  const team = recordTeam(row, profileMap) || 'Sem equipe'
  return `${team} • ${record.orderNumber || row.id} • ${streetName(record) || 'Sem rua'}`
}

function photoExpected(record, type) {
  if (type === 'time') return hasText(record.timePhotoFileName) || hasText(record.timePhotoTakenAt) || hasText(record.timePhotoStoragePath)
  return hasText(record.surveyPhotoFileName) || hasText(record.surveyPhotoTakenAt) || hasText(record.surveyPhotoStoragePath)
}



function manifestIssueOwners(manifests, profileMap) {
  const maps = {
    active: new Map(),
    deleted: new Map(),
    pending: new Map(),
    conflict: new Map(),
  }

  for (const manifest of manifests || []) {
    const currentProfile = profileMap.get(manifest.user_id)
    const owner = {
      team: String(currentProfile?.team_name || manifest.team_name || 'Sem equipe identificada').trim(),
      workDate: String(manifest.work_date || '').slice(0, 10),
      deviceId: String(manifest.device_id || '').trim(),
      userId: String(manifest.user_id || '').trim(),
      sentAt: dateTimestamp(manifest.sent_at) || dateTimestamp(manifest.updated_at) || 0,
    }

    addManifestIssueOwners(maps.active, manifest.active_record_ids, owner)
    addManifestIssueOwners(maps.deleted, manifest.deleted_record_ids, owner)
    addManifestIssueOwners(maps.pending, manifest.pending_record_ids, owner)
    addManifestIssueOwners(maps.conflict, manifest.conflict_record_ids, owner)
  }

  return maps
}

function addManifestIssueOwners(target, rawIds, owner) {
  let ids = rawIds
  if (typeof ids === 'string') {
    try { ids = JSON.parse(ids) } catch (_error) { ids = [] }
  }
  if (!Array.isArray(ids)) return

  for (const rawId of ids) {
    const id = String(rawId || '').trim()
    if (!id) continue

    const previous = target.get(id)
    if (!previous || owner.sentAt >= previous.sentAt) {
      target.set(id, owner)
    }
  }
}

function issueOwnerFor(map, id) {
  return map.get(String(id || '').trim()) || {
    team: 'Sem equipe identificada',
    workDate: '',
    deviceId: '',
    userId: '',
    sentAt: 0,
  }
}

function latestManifestSnapshots(manifests) {
  const latest = new Map()

  for (const manifest of manifests || []) {
    const key = [
      String(manifest.user_id || ''),
      String(manifest.device_id || ''),
      String(manifest.work_date || '').slice(0, 10),
    ].join('|')

    const timestamp =
      dateTimestamp(manifest.sent_at) ||
      dateTimestamp(manifest.updated_at) ||
      0

    const previous = latest.get(key)
    const previousTimestamp = previous
      ? (dateTimestamp(previous.sent_at) || dateTimestamp(previous.updated_at) || 0)
      : -1

    if (!previous || timestamp >= previousTimestamp) {
      latest.set(key, manifest)
    }
  }

  return [...latest.values()]
}

function unionJsonArrays(rows, key) {
  const result = new Set()
  rows.forEach((row) => {
    let value = row[key]
    if (typeof value === 'string') {
      try { value = JSON.parse(value) } catch (_error) { value = [] }
    }
    if (Array.isArray(value)) value.forEach((item) => item && result.add(String(item)))
  })
  return result
}

function serviceDateKey(row) {
  const record = row?.registro || row || {}
  for (const value of [record.timePhotoFileName,record.timePhotoPath,record.surveyPhotoFileName,record.surveyPhotoPath]) {
    const match=String(value||'').match(/(?:^|\D)(\d{4})(\d{2})(\d{2})[_\-\s](?:[01]\d|2[0-3])(?:[0-5]\d)/)
    if(match)return [match[1],match[2],match[3]].join('-')
  }
  for(const value of [record.timePhotoTakenAt,record.surveyPhotoTakenAt]){
    if(!hasText(value))continue
    const date=parseStoredDateTime(value)
    if(!date)continue
    return new Intl.DateTimeFormat('en-CA',{timeZone:APP_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
  }
  for(const value of [record.date,record.serviceDate,record.workDate,record.work_date]){
    const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/)
    if(match)return [match[1],match[2],match[3]].join('-')
  }
  const fallback=String(row?.data||'').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return fallback?[fallback[1],fallback[2],fallback[3]].join('-'):''
}

function monthRangeFromValue(monthValue) {
  const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/)
  const fallback = todayInCampoGrande().slice(0, 7).match(/^(\d{4})-(\d{2})$/)
  const year = Number((match || fallback)[1])
  const month = Number((match || fallback)[2])
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const nextDate = new Date(Date.UTC(year, month, 1))
  const next = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-01`
  return { start, next }
}

function currentMonth() { return els.monthFilter.value || currentDate().slice(0, 7) }
function currentDate() { return els.dateFilter.value || todayInCampoGrande() }
function setAllDateFilters(value) { setUiControlValue('date-filter', value) }
function dedupeIssues(issues) { const map = new Map(); issues.forEach((issue) => map.set(issueLookupKey(issue), issue)); return [...map.values()] }
function teamLabel() { return els.teamFilter.value === 'all' ? 'Todas as equipes' : els.teamFilter.value }
function hasText(value) { return value !== null && value !== undefined && String(value).trim() !== '' }
function normalizeUsername(value) { const username = value.trim().toLowerCase(); if (!/^[a-z0-9_]+$/.test(username)) throw new Error('O usuário deve conter apenas letras, números ou _.'); return username }
function loginEmailFromInput(value) {
  const input = String(value || '').trim().toLowerCase()
  if (!input) throw new Error('Informe o usuário ou e-mail.')
  if (input.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) throw new Error('Informe um e-mail válido.')
    return input
  }
  return `${normalizeUsername(input)}@${INTERNAL_LOGIN_DOMAIN}`
}
function normalizeText(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function displayName(value) { const text = String(value || '').trim(); const match = text.match(/^\d+\s*-\s*(.+)$/); return match ? match[1].trim() : text }
function lookupDisplayName(value, fallbacks = []) {
  const candidates = []
  if (value && typeof value === 'object') candidates.push(value.name, value.nome, value.description, value.descricao, value.label, value.text)
  else candidates.push(value)
  candidates.push(...fallbacks)
  for (const candidate of candidates) {
    const name = displayName(candidate)
    if (name) return name
  }
  return ''
}
function streetName(record) { return lookupDisplayName(record?.street, [record?.streetName, record?.streetText, record?.logradouroNome, record?.logradouro, record?.manualStreet]) }
function neighborhoodName(record) { return lookupDisplayName(record?.neighborhood, [record?.neighborhoodName, record?.bairroNome, record?.bairro]) }
const NAIVE_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/

function parseStoredDateTime(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime())
  }

  const raw = String(value ?? '').trim()
  if (!raw) return null

  const naive = raw.match(NAIVE_DATE_TIME_PATTERN)
  if (naive) {
    const milliseconds = Number(String(naive[7] || '').padEnd(3, '0').slice(0, 3))
    return wallClockInTimeZoneToDate({
      year: Number(naive[1]),
      month: Number(naive[2]),
      day: Number(naive[3]),
      hour: Number(naive[4]),
      minute: Number(naive[5]),
      second: Number(naive[6] || 0),
      millisecond: milliseconds,
    }, APP_TIME_ZONE)
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function wallClockInTimeZoneToDate(parts, timeZone) {
  const desiredUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  )

  let guess = desiredUtc
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const values = Object.fromEntries(
      formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]),
    )

    const displayedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
      parts.millisecond,
    )

    const correction = desiredUtc - displayedAsUtc
    if (correction === 0) break
    guess += correction
  }

  const date = new Date(guess)
  return Number.isNaN(date.getTime()) ? null : date
}

function todayInCampoGrande() { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); return `${values.year}-${values.month}-${values.day}` }
function addDays(dateString, amount) { const [year, month, day] = dateString.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10) }
function formatDate(value) { if (!value) return '—'; const parts = String(value).slice(0, 10).split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value) }
function formatDateTime(value) { const date = parseStoredDateTime(value); if (!date) return '—'; return new Intl.DateTimeFormat('pt-BR', { timeZone: APP_TIME_ZONE, dateStyle: 'short', timeStyle: 'medium' }).format(date) }
function safeZipName(value) { return String(value || 'foto.jpg').replace(/[\\/:*?"<>|]/g, '_') }
function safeFilePart(value) { return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim().toUpperCase() || 'SEM EQUIPE' }
function fileDate(value) { const parts = String(value || '').slice(0, 10).split('-'); return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : 'SEM-DATA' }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;') }
function friendlyError(error) { const message = error?.message || String(error || 'Erro desconhecido'); if (/invalid login credentials/i.test(message)) return 'Usuário ou senha incorretos.'; if (isRateLimitError(error)) return 'Muitas solicitações ao painel. A atualização automática será retomada após o intervalo de segurança.'; if (/admin_purge_excluded_record|function .* does not exist|could not find the function/i.test(message)) return 'Execute o SQL 03_EXCLUSAO_DEFINITIVA_ADMIN.sql no Supabase antes de usar a exclusão definitiva.'; if (/failed to fetch|network|fetch/i.test(message)) return 'Não foi possível conectar ao Supabase.'; return message }

document.addEventListener('jr:imported-v21-ready', () => {
  moduleRenderCacheV31.delete('codes')
  moduleRenderCacheV31.delete('orders')
  if (state.page === 'codes' || state.page === 'orders') {
    scheduleCurrentModuleRenderV31(state.page)
  }
})
