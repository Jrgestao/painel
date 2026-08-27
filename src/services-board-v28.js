import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js?v=2'
import { hydrateIcons } from './icons.js?v=9'
import { initializeUiControls, refreshCustomSelect, setUiControlValue } from './ui-controls.js?v=9'
import {
  SERVICE_METRICS,
  SERVICE_METRIC_KEYS,
  daysInMonth,
  detectImportantServices,
  effectiveObservationParts,
  effectiveScore,
  hasScoreOverride,
  hasImportedScore,
  isMetricHidden,
  isObservationHidden,
  metricPeriod,
  normalizeReportSetting,
  normalizeText,
  serializeReportSetting,
  SERVICE_PERIOD_LABELS,
} from './services-board-core-v21.mjs?v=nomes-por-planilha-v38-20260811'
import {
  appendAddressContextV30,
  getCesipSmartResolverV30,
} from './cesip-smart-resolver-v33.mjs?v=33'
import {
  aggregateImportEntries,
  importReplacementKeys,
  importantObservationLinesV28,
  importedImportantLinesV28,
  importedRowMetric,
  mergeRebuiltImportedNotesV28,
  mergeRebuiltImportedScoresV28,
  normalizeImportText,
  parseImportDate,
  parseImportMinutes,
  rebuildImportedNotesByMetricV28,
  rebuildImportedScoresByMetricV28,
  shouldKeepImportedRow,
} from './services-import-core-v28.mjs?v=34'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const $ = (selector) => document.querySelector(selector)
const GLOBAL_KEY = '__matrix__'
// JR_GESTAO_OBSERVACOES_INTELIGENTES_V40_13=20260827

// JR_GESTAO_OBSERVACOES_SEM_CORTE_V40_14_3=20260827

// JR_GESTAO_OBSERVACOES_QUADRADO_CENTRAL_V40_14_4=20260827

// JR_GESTAO_OBSERVACOES_CAIXA_CORRETA_V40_14_5=20260827
function jrInstallObservationBoxV4145() {
  ;[
    'jr-observation-no-clip-v4141',
    'jr-observation-no-clip-v4142',
    'jr-observation-no-clip-v4141',
  ].forEach((id) => document.getElementById(id)?.remove())

  let style = document.getElementById('jr-observation-box-v4145')
  if (!style) {
    style = document.createElement('style')
    style.id = 'jr-observation-box-v4145'
    document.head.appendChild(style)
  }

  style.textContent = `
    /* O DIALOG E A PROPRIA CAIXA. NAO E MAIS UMA CAMADA DE 100vw. */
    dialog#services-observation-viewer.services-observation-viewer{
      position:fixed!important;
      inset:0!important;
      left:0!important;
      right:0!important;
      top:0!important;
      bottom:0!important;

      width:min(760px,calc(100vw - 32px))!important;
      max-width:min(760px,calc(100vw - 32px))!important;
      min-width:0!important;

      height:min(760px,calc(100dvh - 32px))!important;
      max-height:min(760px,calc(100dvh - 32px))!important;
      min-height:0!important;

      margin:auto!important;
      padding:0!important;
      border:1px solid rgba(255,255,255,.15)!important;
      border-radius:16px!important;
      box-sizing:border-box!important;

      background:#10161c!important;
      color:inherit!important;

      transform:none!important;
      translate:none!important;

      overflow:hidden!important;
      overflow-x:hidden!important;
      overflow-y:hidden!important;
    }

    dialog#services-observation-viewer.services-observation-viewer::backdrop{
      background:rgba(0,0,0,.76)!important;
      backdrop-filter:blur(3px)!important;
    }

    #services-observation-viewer .services-observation-viewer-card{
      position:relative!important;
      inset:auto!important;
      left:auto!important;
      right:auto!important;
      top:auto!important;
      bottom:auto!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      height:100%!important;
      max-height:100%!important;
      min-height:0!important;

      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-sizing:border-box!important;

      transform:none!important;
      translate:none!important;

      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;

      overflow:hidden!important;
      overflow-x:hidden!important;
      overflow-y:hidden!important;
    }

    #services-observation-viewer .services-observation-viewer-header{
      position:relative!important;
      inset:auto!important;
      transform:none!important;

      flex:0 0 auto!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      margin:0!important;
      padding:12px 14px 10px!important;
      box-sizing:border-box!important;

      text-align:center!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-viewer-title,
    #services-observation-viewer .services-viewer-title > *{
      width:auto!important;
      max-width:100%!important;
      min-width:0!important;
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
    }

    #services-observation-viewer .services-viewer-days{
      position:relative!important;
      inset:auto!important;
      transform:none!important;

      flex:0 0 auto!important;

      display:flex!important;
      flex-wrap:wrap!important;
      align-items:center!important;
      align-content:center!important;
      justify-content:center!important;

      gap:5px!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      margin:0!important;
      padding:8px 10px!important;
      box-sizing:border-box!important;

      white-space:normal!important;
      overflow:hidden!important;
      overflow-x:hidden!important;
      overflow-y:visible!important;
    }

    #services-observation-viewer .services-viewer-days > *{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:0 0 auto!important;
      margin:0!important;
    }

    /* UNICA AREA QUE ROLA: PARA BAIXO. */
    #services-observation-viewer .services-observation-viewer-body{
      position:relative!important;
      inset:auto!important;
      transform:none!important;

      flex:1 1 auto!important;

      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
      justify-content:flex-start!important;

      gap:9px!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      height:auto!important;
      min-height:0!important;
      max-height:none!important;

      margin:0!important;
      padding:10px!important;
      box-sizing:border-box!important;

      overflow-x:hidden!important;
      overflow-y:auto!important;
      overscroll-behavior-x:none!important;
      overscroll-behavior-y:contain!important;
      scrollbar-gutter:stable!important;
    }

    #services-observation-viewer .services-observation-viewer-body > *{
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }

    #services-observation-viewer .services-viewer-team{
      position:relative!important;
      inset:auto!important;
      left:auto!important;
      right:auto!important;
      top:auto!important;
      bottom:auto!important;

      transform:none!important;
      translate:none!important;
      float:none!important;
      clear:both!important;

      display:block!important;
      grid-column:1 / -1!important;
      flex:0 0 auto!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      height:auto!important;
      min-height:0!important;
      max-height:none!important;

      margin:0!important;
      padding:10px 12px!important;
      box-sizing:border-box!important;

      text-align:center!important;

      overflow:hidden!important;
      overflow-x:hidden!important;
      overflow-y:visible!important;
    }

    #services-observation-viewer .services-viewer-team > header{
      position:relative!important;
      inset:auto!important;
      transform:none!important;

      display:flex!important;
      flex-direction:column!important;
      flex-wrap:nowrap!important;
      align-items:center!important;
      justify-content:center!important;

      gap:4px!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      margin:0 0 7px!important;
      padding:0!important;
      box-sizing:border-box!important;

      text-align:center!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-viewer-team-content,
    #services-observation-viewer .services-viewer-service,
    #services-observation-viewer .services-viewer-manual,
    #services-observation-viewer .services-viewer-empty,
    #services-observation-viewer .services-viewer-manual-important{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      translate:none!important;

      display:block!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      height:auto!important;
      min-height:0!important;
      max-height:none!important;

      margin-left:0!important;
      margin-right:0!important;
      box-sizing:border-box!important;

      text-align:center!important;

      overflow:hidden!important;
      overflow-x:hidden!important;
      overflow-y:visible!important;
    }

    #services-observation-viewer .services-viewer-team p,
    #services-observation-viewer .services-viewer-team strong,
    #services-observation-viewer .services-viewer-team span,
    #services-observation-viewer .services-viewer-team small,
    #services-observation-viewer .services-viewer-team b{
      display:block!important;
      width:auto!important;
      max-width:100%!important;
      min-width:0!important;

      margin-left:auto!important;
      margin-right:auto!important;

      box-sizing:border-box!important;

      white-space:normal!important;
      overflow-wrap:anywhere!important;
      word-break:normal!important;

      text-align:center!important;
    }

    #services-observation-viewer .services-observation-viewer-footer{
      position:relative!important;
      inset:auto!important;
      transform:none!important;

      flex:0 0 auto!important;

      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:7px!important;

      width:100%!important;
      max-width:100%!important;
      min-width:0!important;

      margin:0!important;
      padding:9px 12px 11px!important;
      box-sizing:border-box!important;

      text-align:center!important;

      overflow:hidden!important;
      overflow-x:hidden!important;
      overflow-y:visible!important;
    }

    #services-observation-viewer .services-observation-viewer-footer > *{
      max-width:100%!important;
      min-width:0!important;
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      box-sizing:border-box!important;
    }

    #services-observation-viewer .services-observation-viewer-footer button{
      white-space:normal!important;
      max-width:100%!important;
    }

    @media(max-width:700px){
      dialog#services-observation-viewer.services-observation-viewer{
        width:calc(100vw - 14px)!important;
        max-width:calc(100vw - 14px)!important;
        height:calc(100dvh - 14px)!important;
        max-height:calc(100dvh - 14px)!important;
        border-radius:12px!important;
      }

      #services-observation-viewer .services-observation-viewer-header{
        padding:10px 8px 8px!important;
      }

      #services-observation-viewer .services-viewer-days{
        gap:4px!important;
        padding:7px 7px!important;
      }

      #services-observation-viewer .services-observation-viewer-body{
        padding:8px!important;
      }

      #services-observation-viewer .services-viewer-team{
        padding:9px!important;
      }

      #services-observation-viewer .services-observation-viewer-footer{
        padding:8px!important;
      }

      #services-observation-viewer .services-observation-viewer-footer button{
        width:100%!important;
      }
    }
  `
}

jrInstallObservationBoxV4145()

function jrSetImportantV4144(element, property, value) {
  if (!element) return
  element.style.setProperty(property, value, 'important')
}

function jrForceObservationSquareV4144() {
  const viewer = document.getElementById('services-observation-viewer')
  if (!viewer) return

  const card = viewer.querySelector('.services-observation-viewer-card')
  if (!card) return

  const mobile = window.matchMedia?.('(max-width: 700px)')?.matches === true

  // OVERLAY: ocupa a tela, mas o quadrado interno fica pequeno/controlado.
  ;[
    ['position', 'fixed'],
    ['inset', '0'],
    ['width', '100vw'],
    ['max-width', '100vw'],
    ['height', '100dvh'],
    ['max-height', '100dvh'],
    ['box-sizing', 'border-box'],
    ['padding', mobile ? '8px' : '16px'],
    ['overflow-x', 'hidden'],
    ['overflow-y', 'hidden'],
    ['display', 'flex'],
    ['align-items', 'center'],
    ['justify-content', 'center'],
  ].forEach(([p, v]) => jrSetImportantV4144(viewer, p, v))

  // QUADRADO PRINCIPAL: não fica gigante.
  const desktopSize = 'min(760px, calc(100vw - 32px), calc(100dvh - 32px))'
  const mobileSize = 'calc(100vw - 16px)'
  ;[
    ['position', 'relative'],
    ['inset', 'auto'],
    ['left', 'auto'],
    ['right', 'auto'],
    ['top', 'auto'],
    ['bottom', 'auto'],
    ['transform', 'none'],
    ['translate', 'none'],
    ['width', mobile ? mobileSize : desktopSize],
    ['max-width', mobile ? mobileSize : '760px'],
    ['min-width', '0'],
    ['height', mobile ? 'calc(100dvh - 16px)' : desktopSize],
    ['max-height', mobile ? 'calc(100dvh - 16px)' : '760px'],
    ['min-height', '0'],
    ['margin', '0 auto'],
    ['padding', '0'],
    ['box-sizing', 'border-box'],
    ['overflow-x', 'hidden'],
    ['overflow-y', 'hidden'],
    ['display', 'flex'],
    ['flex-direction', 'column'],
    ['align-items', 'stretch'],
  ].forEach(([p, v]) => jrSetImportantV4144(card, p, v))

  const header = card.querySelector('.services-observation-viewer-header')
  if (header) {
    ;[
      ['position', 'relative'],
      ['inset', 'auto'],
      ['transform', 'none'],
      ['width', '100%'],
      ['max-width', '100%'],
      ['min-width', '0'],
      ['box-sizing', 'border-box'],
      ['flex', '0 0 auto'],
      ['margin', '0'],
      ['padding', mobile ? '10px' : '12px 14px 10px'],
      ['overflow-x', 'hidden'],
      ['overflow-y', 'visible'],
      ['text-align', 'center'],
    ].forEach(([p, v]) => jrSetImportantV4144(header, p, v))
  }

  const days = card.querySelector('.services-viewer-days')
  if (days) {
    ;[
      ['position', 'relative'],
      ['inset', 'auto'],
      ['transform', 'none'],
      ['display', 'flex'],
      ['flex-wrap', 'wrap'],
      ['align-items', 'center'],
      ['justify-content', 'center'],
      ['align-content', 'center'],
      ['gap', mobile ? '4px' : '5px'],
      ['width', '100%'],
      ['max-width', '100%'],
      ['min-width', '0'],
      ['box-sizing', 'border-box'],
      ['flex', '0 0 auto'],
      ['margin', '0'],
      ['padding', mobile ? '7px 8px' : '8px 12px'],
      ['overflow-x', 'hidden'],
      ['overflow-y', 'visible'],
      ['white-space', 'normal'],
    ].forEach(([p, v]) => jrSetImportantV4144(days, p, v))

    days.querySelectorAll(':scope > *').forEach((button) => {
      ;[
        ['position', 'relative'],
        ['inset', 'auto'],
        ['transform', 'none'],
        ['flex', '0 0 auto'],
        ['margin', '0'],
      ].forEach(([p, v]) => jrSetImportantV4144(button, p, v))
    })
  }

  const body = card.querySelector('.services-observation-viewer-body')
  if (body) {
    ;[
      ['position', 'relative'],
      ['inset', 'auto'],
      ['transform', 'none'],
      ['display', 'flex'],
      ['flex-direction', 'column'],
      ['align-items', 'stretch'],
      ['justify-content', 'flex-start'],
      ['gap', '9px'],
      ['width', '100%'],
      ['max-width', '100%'],
      ['min-width', '0'],
      ['height', 'auto'],
      ['min-height', '0'],
      ['box-sizing', 'border-box'],
      ['flex', '1 1 auto'],
      ['margin', '0'],
      ['padding', mobile ? '8px' : '10px 12px 14px'],
      ['overflow-x', 'hidden'],
      ['overflow-y', 'auto'],
      ['overscroll-behavior-x', 'none'],
      ['overscroll-behavior-y', 'contain'],
    ].forEach(([p, v]) => jrSetImportantV4144(body, p, v))
  }

  // Cada equipe = UM CARD centralizado ocupando somente o espaço interno.
  card.querySelectorAll('.services-viewer-team').forEach((team) => {
    ;[
      ['position', 'relative'],
      ['inset', 'auto'],
      ['left', 'auto'],
      ['right', 'auto'],
      ['top', 'auto'],
      ['bottom', 'auto'],
      ['transform', 'none'],
      ['translate', 'none'],
      ['float', 'none'],
      ['clear', 'both'],
      ['display', 'block'],
      ['grid-column', '1 / -1'],
      ['width', '100%'],
      ['max-width', '100%'],
      ['min-width', '0'],
      ['height', 'auto'],
      ['min-height', '0'],
      ['max-height', 'none'],
      ['box-sizing', 'border-box'],
      ['flex', '0 0 auto'],
      ['margin', '0'],
      ['padding', mobile ? '9px' : '10px 12px'],
      ['overflow-x', 'hidden'],
      ['overflow-y', 'visible'],
      ['text-align', 'center'],
    ].forEach(([p, v]) => jrSetImportantV4144(team, p, v))

    const teamHeader = team.querySelector('header')
    if (teamHeader) {
      ;[
        ['position', 'relative'],
        ['inset', 'auto'],
        ['transform', 'none'],
        ['display', 'flex'],
        ['flex-direction', 'column'],
        ['align-items', 'center'],
        ['justify-content', 'center'],
        ['gap', '5px'],
        ['width', '100%'],
        ['max-width', '100%'],
        ['min-width', '0'],
        ['box-sizing', 'border-box'],
        ['margin', '0 0 7px'],
        ['padding', '0'],
        ['overflow-x', 'hidden'],
        ['overflow-y', 'visible'],
        ['text-align', 'center'],
      ].forEach(([p, v]) => jrSetImportantV4144(teamHeader, p, v))
    }

    team.querySelectorAll(
      '.services-viewer-team-content,.services-viewer-service,.services-viewer-manual,.services-viewer-empty,.services-viewer-manual-important'
    ).forEach((node) => {
      ;[
        ['position', 'relative'],
        ['inset', 'auto'],
        ['transform', 'none'],
        ['translate', 'none'],
        ['display', 'block'],
        ['width', '100%'],
        ['max-width', '100%'],
        ['min-width', '0'],
        ['height', 'auto'],
        ['min-height', '0'],
        ['max-height', 'none'],
        ['box-sizing', 'border-box'],
        ['margin-left', '0'],
        ['margin-right', '0'],
        ['overflow-x', 'hidden'],
        ['overflow-y', 'visible'],
        ['text-align', 'center'],
      ].forEach(([p, v]) => jrSetImportantV4144(node, p, v))
    })

    team.querySelectorAll('p,strong,span,small,b').forEach((node) => {
      ;[
        ['display', 'block'],
        ['max-width', '100%'],
        ['min-width', '0'],
        ['margin-left', 'auto'],
        ['margin-right', 'auto'],
        ['white-space', 'normal'],
        ['overflow-wrap', 'anywhere'],
        ['word-break', 'normal'],
        ['text-align', 'center'],
        ['box-sizing', 'border-box'],
      ].forEach(([p, v]) => jrSetImportantV4144(node, p, v))
    })
  })

  const footer = card.querySelector('.services-observation-viewer-footer')
  if (footer) {
    ;[
      ['position', 'relative'],
      ['inset', 'auto'],
      ['transform', 'none'],
      ['display', 'flex'],
      ['flex-wrap', 'wrap'],
      ['align-items', 'center'],
      ['justify-content', 'center'],
      ['gap', '7px'],
      ['width', '100%'],
      ['max-width', '100%'],
      ['min-width', '0'],
      ['box-sizing', 'border-box'],
      ['flex', '0 0 auto'],
      ['margin', '0'],
      ['padding', mobile ? '8px' : '9px 12px 11px'],
      ['overflow-x', 'hidden'],
      ['overflow-y', 'visible'],
      ['text-align', 'center'],
    ].forEach(([p, v]) => jrSetImportantV4144(footer, p, v))

    footer.querySelectorAll('button').forEach((button) => {
      ;[
        ['max-width', '100%'],
        ['min-width', '0'],
        ['white-space', 'normal'],
        ['text-align', 'center'],
      ].forEach(([p, v]) => jrSetImportantV4144(button, p, v))
    })
  }
}

function jrScheduleObservationSquareV4144() {
  requestAnimationFrame(() => {
    jrForceObservationSquareV4144()
    requestAnimationFrame(jrForceObservationSquareV4144)
  })
}

// Observa o modal: sempre que dia/equipe/conteúdo muda, reaplica inline !important.
function jrInstallObservationSquareObserverV4144() {
  const attach = () => {
    const viewer = document.getElementById('services-observation-viewer')
    if (!viewer || viewer.__jrSquareObserverV4144) return false

    viewer.__jrSquareObserverV4144 = true
    const observer = new MutationObserver(() => jrScheduleObservationSquareV4144())
    observer.observe(viewer, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    viewer.addEventListener('click', jrScheduleObservationSquareV4144, true)
    window.addEventListener('resize', jrScheduleObservationSquareV4144)
    jrScheduleObservationSquareV4144()
    return true
  }

  if (attach()) return

  const pageObserver = new MutationObserver(() => {
    if (attach()) pageObserver.disconnect()
  })
  pageObserver.observe(document.documentElement, { childList: true, subtree: true })
}

void 0 // desativado pela V40.14.5

function jrInstallObservationNoClipV4142() {
  let style = document.getElementById('jr-observation-no-clip-v4142')
  if (!style) {
    style = document.createElement('style')
    style.id = 'jr-observation-no-clip-v4142'
    document.head.appendChild(style)
  }

  style.textContent = `
    #services-observation-viewer.services-observation-viewer{
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      max-width:100vw!important;
      height:100dvh!important;
      max-height:100dvh!important;
      box-sizing:border-box!important;
      padding:16px!important;
      overflow:hidden!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
    }

    #services-observation-viewer .services-observation-viewer-card{
      position:relative!important;
      inset:auto!important;
      left:auto!important;
      right:auto!important;
      top:auto!important;
      bottom:auto!important;
      transform:none!important;
      translate:none!important;
      width:min(1080px,calc(100vw - 32px))!important;
      max-width:calc(100vw - 32px)!important;
      min-width:0!important;
      height:min(900px,calc(100dvh - 32px))!important;
      max-height:calc(100dvh - 32px)!important;
      min-height:0!important;
      margin:0 auto!important;
      padding:0!important;
      box-sizing:border-box!important;
      overflow:hidden!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
    }

    #services-observation-viewer .services-observation-viewer-header{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:0 0 auto!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      margin:0!important;
      padding:14px 16px 12px!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-viewer-days{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:0 0 auto!important;
      display:flex!important;
      flex-wrap:wrap!important;
      align-items:center!important;
      align-content:flex-start!important;
      justify-content:flex-start!important;
      gap:6px!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      margin:0!important;
      padding:10px 14px!important;
      overflow:hidden!important;
      white-space:normal!important;
    }

    #services-observation-viewer .services-viewer-days > *{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:0 0 auto!important;
      margin:0!important;
    }

    #services-observation-viewer .services-observation-viewer-body{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:1 1 auto!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
      gap:10px!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      min-height:0!important;
      box-sizing:border-box!important;
      margin:0!important;
      padding:12px 14px 16px!important;
      overflow-x:hidden!important;
      overflow-y:auto!important;
      overscroll-behavior:contain!important;
      scrollbar-gutter:stable!important;
    }

    #services-observation-viewer .services-observation-viewer-body > *{
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }

    #services-observation-viewer .services-viewer-team{
      position:relative!important;
      inset:auto!important;
      left:auto!important;
      right:auto!important;
      top:auto!important;
      bottom:auto!important;
      transform:none!important;
      translate:none!important;
      float:none!important;
      clear:both!important;
      display:block!important;
      flex:0 0 auto!important;
      grid-column:1 / -1!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      height:auto!important;
      min-height:0!important;
      max-height:none!important;
      box-sizing:border-box!important;
      margin:0!important;
      padding:12px!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-viewer-team > header{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      display:flex!important;
      flex-wrap:wrap!important;
      align-items:flex-start!important;
      justify-content:space-between!important;
      gap:8px!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      margin:0 0 9px!important;
      padding:0!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-viewer-team > header > *{
      min-width:0!important;
      max-width:100%!important;
    }

    #services-observation-viewer .services-viewer-team-content,
    #services-observation-viewer .services-viewer-service,
    #services-observation-viewer .services-viewer-manual,
    #services-observation-viewer .services-viewer-empty,
    #services-observation-viewer .services-viewer-manual-important{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      translate:none!important;
      display:block!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      height:auto!important;
      min-height:0!important;
      max-height:none!important;
      box-sizing:border-box!important;
      margin-left:0!important;
      margin-right:0!important;
      overflow-x:hidden!important;
      overflow-y:visible!important;
    }

    #services-observation-viewer .services-viewer-team p,
    #services-observation-viewer .services-viewer-team span,
    #services-observation-viewer .services-viewer-team strong,
    #services-observation-viewer .services-viewer-team small{
      max-width:100%!important;
      min-width:0!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      word-break:normal!important;
    }

    #services-observation-viewer .services-observation-viewer-footer{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      flex:0 0 auto!important;
      display:flex!important;
      flex-wrap:wrap!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:8px!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      margin:0!important;
      padding:10px 14px 12px!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-observation-viewer-footer > *{
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
    }

    #services-observation-viewer .services-observation-viewer-footer button{
      flex:0 1 auto!important;
      max-width:100%!important;
      white-space:normal!important;
    }

    @media(max-width:700px){
      #services-observation-viewer.services-observation-viewer{
        padding:7px!important;
      }

      #services-observation-viewer .services-observation-viewer-card{
        width:calc(100vw - 14px)!important;
        max-width:calc(100vw - 14px)!important;
        height:calc(100dvh - 14px)!important;
        max-height:calc(100dvh - 14px)!important;
      }

      #services-observation-viewer .services-observation-viewer-header{
        padding:11px 10px 9px!important;
      }

      #services-observation-viewer .services-viewer-days{
        padding:8px 9px!important;
        gap:5px!important;
      }

      #services-observation-viewer .services-observation-viewer-body{
        padding:9px!important;
      }

      #services-observation-viewer .services-viewer-team{
        padding:10px!important;
      }

      #services-observation-viewer .services-observation-viewer-footer{
        padding:8px 9px!important;
      }

      #services-observation-viewer .services-observation-viewer-footer button{
        flex:1 1 100%!important;
        width:100%!important;
      }
    }
  `
}

void 0 // desativado pela V40.14.5

function jrObsNormalizeV413(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function jrRawObservationPartsV413(day, draft, metricKey) {
  if (typeof originalEffectiveObservationPartsV412 === 'function') {
    return originalEffectiveObservationPartsV412(day, draft, metricKey)
  }
  return effectiveObservationParts(day, draft, metricKey)
}

function jrObsActionV413(text) {
  const normalized = jrObsNormalizeV413(text)
  return {
    install: /\b(?:instal|implant|montag|colocac)/.test(normalized),
    remove: /\b(?:retir|remoc|remov|desinstal)/.test(normalized),
    maintenance: /\b(?:manuten|reparo|acion|desacion|regulag|ajust)/.test(normalized),
  }
}

function jrObsActionLabelV413(actions, objectLabel) {
  if (actions.remove && actions.install) return `RETIRADA E INSTALAÇÃO DE ${objectLabel}`
  if (actions.install) return `INSTALAÇÃO DE ${objectLabel}`
  if (actions.remove) return `RETIRADA DE ${objectLabel}`
  if (actions.maintenance) return `MANUTENÇÃO DE ${objectLabel}`
  return objectLabel
}

function smartObservationSummaryV413(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const text = jrObsNormalizeV413(raw)
  const segments = text
    .split(/\s*(?:•|\||;|\n)\s*/)
    .map((item) => item.trim())
    .filter(Boolean)

  const contactor = { present: false, install: false, remove: false, maintenance: false }
  const commandBox = { present: false, install: false, remove: false, maintenance: false }

  let transMunk = false
  let rentedTruck = false
  let excavation = false
  let superPost = false
  let postInstallation = false
  let cableLaunch = false
  let reflector = false
  let outlet = false
  let lamp = false
  let event = false
  let square = false
  let field = false
  let school = false

  for (const segment of segments) {
    const action = jrObsActionV413(segment)

    const isContactor =
      /conta(?:c)?tor/.test(segment) ||
      /\bcodigo\s*16\b/.test(segment)

    if (isContactor) {
      contactor.present = true
      contactor.install ||= action.install
      contactor.remove ||= action.remove
      contactor.maintenance ||= action.maintenance
    }

    const isCommandBox =
      /caixa.{0,35}(?:comando|sistema)/.test(segment) ||
      /sistema.{0,35}(?:comando|caixa)/.test(segment)

    if (isCommandBox) {
      commandBox.present = true
      commandBox.install ||= action.install
      commandBox.remove ||= action.remove
      commandBox.maintenance ||= action.maintenance
    }

    if (/\b(?:trans\s*munk|transmunk|transmulk|transmunck|munck|munk)\b/.test(segment)) {
      transMunk = true
      if (/\b(?:locad[oa]?|alugad[oa]?|locacao|aluguel)\b/.test(segment)) rentedTruck = true
    }

    if (
      /\bcaminhao\b.{0,45}\b(?:locad[oa]?|alugad[oa]?|locacao|aluguel)\b/.test(segment) ||
      /\b(?:locad[oa]?|alugad[oa]?|locacao|aluguel)\b.{0,45}\bcaminhao\b/.test(segment)
    ) rentedTruck = true

    if (/escav|valeta|buraco/.test(segment)) excavation = true
    if (/\bsuper\s+poste\b/.test(segment)) superPost = true

    if (
      /(?:implant|instal).{0,55}\bposte\b/.test(segment) ||
      /\bposte\b.{0,55}(?:implant|instal)/.test(segment)
    ) postInstallation = true

    if (
      /lancamento.{0,55}\bcabo\b/.test(segment) ||
      /\bcabo\s+aereo\b/.test(segment)
    ) cableLaunch = true

    if (/(?:implant|instal).{0,55}\brefletor/.test(segment)) reflector = true
    if (/(?:implant|instal).{0,55}\btomad/.test(segment)) outlet = true
    if (/(?:implant|instal).{0,55}\blampad/.test(segment)) lamp = true
    if (/\bevento\b/.test(segment)) event = true
    if (/\bpraca\b/.test(segment)) square = true
    if (/\bcampo\b/.test(segment)) field = true
    if (/\bescola\b/.test(segment)) school = true
  }

  const result = []
  const add = (label) => {
    if (!label || result.includes(label)) return
    result.push(label)
  }

  if (transMunk && rentedTruck) add('TRANS MUNK CAMINHÃO LOCADO')
  else if (transMunk) add('TRANS MUNK CAMINHÃO')
  else if (rentedTruck) add('CAMINHÃO LOCADO')

  if (contactor.present) add(jrObsActionLabelV413(contactor, 'CONTACTORA'))
  if (commandBox.present) add(jrObsActionLabelV413(commandBox, 'CAIXA / SISTEMA DE COMANDO'))

  if (cableLaunch) add('LANÇAMENTO DE CABO')
  if (excavation) add('ESCAVAÇÃO / VALETA / BURACO')
  if (postInstallation) add('IMPLANTAÇÃO DE POSTE')
  if (superPost) add('SUPER POSTE')
  if (reflector) add('IMPLANTAÇÃO DE REFLETOR')
  if (outlet) add('INSTALAÇÃO DE TOMADA')
  if (lamp) add('INSTALAÇÃO DE LÂMPADA')
  if (event) add('EVENTO')
  if (square) add('PRAÇA')
  if (field) add('CAMPO')
  if (school) add('ESCOLA')

  // LED, fio, relé, conector perfurante, amperagem e descrição técnica
  // não entram como serviço isolado.
  return result.slice(0, 10).join(' • ')
}

function installObservationLayoutV413() {
  let style = document.getElementById('jr-observation-layout-v413')
  if (!style) {
    style = document.createElement('style')
    style.id = 'jr-observation-layout-v413'
    document.head.appendChild(style)
  }

  style.textContent = `
    #services-observation-viewer.services-observation-viewer{
      box-sizing:border-box!important;
      padding:14px!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-observation-viewer-card{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      box-sizing:border-box!important;
      width:min(1080px,calc(100vw - 28px))!important;
      max-width:1080px!important;
      height:min(880px,calc(100dvh - 28px))!important;
      max-height:calc(100dvh - 28px)!important;
      min-height:0!important;
      margin:auto!important;
      overflow:hidden!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
    }

    #services-observation-viewer .services-observation-viewer-header,
    #services-observation-viewer .services-viewer-days,
    #services-observation-viewer .services-observation-viewer-footer{
      flex:0 0 auto!important;
      position:relative!important;
      inset:auto!important;
      transform:none!important;
    }

    #services-observation-viewer .services-viewer-days{
      display:flex!important;
      flex-wrap:nowrap!important;
      gap:7px!important;
      width:100%!important;
      min-width:0!important;
      overflow-x:auto!important;
      overflow-y:hidden!important;
      overscroll-behavior-x:contain!important;
      scrollbar-width:thin!important;
    }

    #services-observation-viewer .services-viewer-days > *{
      flex:0 0 auto!important;
    }

    #services-observation-viewer .services-observation-viewer-body{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      display:block!important;
      flex:1 1 auto!important;
      width:100%!important;
      min-width:0!important;
      min-height:0!important;
      height:auto!important;
      max-height:none!important;
      box-sizing:border-box!important;
      overflow-x:hidden!important;
      overflow-y:auto!important;
      padding:12px 2px 24px!important;
      margin:0!important;
      overscroll-behavior:contain!important;
    }

    #services-observation-viewer .services-viewer-team{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      float:none!important;
      clear:both!important;
      display:block!important;
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
      height:auto!important;
      min-height:0!important;
      max-height:none!important;
      margin:0 0 12px!important;
      padding:12px!important;
      overflow:hidden!important;
    }

    #services-observation-viewer .services-viewer-team:last-child{
      margin-bottom:0!important;
    }

    #services-observation-viewer .services-viewer-team > header{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      display:flex!important;
      align-items:flex-start!important;
      justify-content:space-between!important;
      flex-wrap:wrap!important;
      gap:8px!important;
      min-width:0!important;
      height:auto!important;
      margin:0 0 9px!important;
    }

    #services-observation-viewer .services-viewer-team-content{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      display:block!important;
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      height:auto!important;
      min-height:0!important;
      max-height:none!important;
      overflow:visible!important;
      margin:0!important;
      padding:0!important;
    }

    #services-observation-viewer .services-viewer-service,
    #services-observation-viewer .services-viewer-manual,
    #services-observation-viewer .services-viewer-empty,
    #services-observation-viewer .services-viewer-manual-important{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      display:block!important;
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      height:auto!important;
      min-height:0!important;
      max-height:none!important;
      overflow:visible!important;
      margin:0!important;
    }

    #services-observation-viewer .services-viewer-manual{
      margin-top:8px!important;
    }

    #services-observation-viewer .services-viewer-service p,
    #services-observation-viewer .services-viewer-manual p{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      height:auto!important;
      max-height:none!important;
      margin:5px 0 0!important;
      overflow:visible!important;
      white-space:pre-wrap!important;
      overflow-wrap:anywhere!important;
      word-break:normal!important;
      line-height:1.42!important;
    }

    @media(max-width:700px){
      #services-observation-viewer.services-observation-viewer{
        padding:7px!important;
      }
      #services-observation-viewer .services-observation-viewer-card{
        width:calc(100vw - 14px)!important;
        height:calc(100dvh - 14px)!important;
        max-height:calc(100dvh - 14px)!important;
      }
      #services-observation-viewer .services-viewer-team{
        padding:10px!important;
        margin-bottom:9px!important;
      }
    }
  `
}
// JR_GESTAO_OBSERVACOES_RESUMIDAS_V40_12=20260827
const originalEffectiveObservationPartsV412 = effectiveObservationParts

function compactNormalizeObservationV412(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function compactAutomaticObservationV412(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const text = compactNormalizeObservationV412(raw)
  const segments = text
    .split(/\s*(?:•|\||;|\n)\s*/)
    .map((item) => item.trim())
    .filter(Boolean)

  const items = []
  const seen = new Set()
  const add = (label) => {
    const key = compactNormalizeObservationV412(label)
    if (!key || seen.has(key)) return
    seen.add(key)
    items.push(label)
  }

  // Esses dois precisam sempre permanecer visíveis quando existirem.
  if (/\b(?:trans\s*munk|transmunk|transmulk|transmunck|munck|munk)\b/.test(text)) {
    add('TRANS MUNK CAMINHÃO')
  }
  if (/\bcaminhao\s+(?:locad|alugad)|(?:locac|alug).{0,35}\bcaminhao\b/.test(text)) {
    add('CAMINHÃO LOCADO')
  }

  const contactorText = segments
    .filter((segment) => /conta(?:c)?tor/.test(segment))
    .join(' ')
  if (contactorText) {
    if (/instal|implan/.test(contactorText)) add('INSTALAÇÃO DE CONTATORA')
    else if (/troca|substit/.test(contactorText)) add('TROCA DE CONTATORA')
    else if (/manuten|reparo/.test(contactorText)) add('MANUTENÇÃO DE CONTATORA')
    else if (/acion|desacion/.test(contactorText)) add('ACIONAMENTO DE CONTATORA')
    else add('CONTATORA')
  }

  const commandBoxText = segments
    .filter((segment) => /caixa.{0,25}comando|sistema.{0,20}comando/.test(segment))
    .join(' ')
  if (commandBoxText) {
    if (/instal|implan/.test(commandBoxText)) add('INSTALAÇÃO DE CAIXA DE COMANDO')
    else if (/manuten|reparo/.test(commandBoxText)) add('MANUTENÇÃO DE CAIXA DE COMANDO')
    else add('CAIXA DE COMANDO')
  }

  if (/escav|valeta|buraco/.test(text)) add('ESCAVAÇÃO / VALETA / BURACO')
  if (/\bsuper\s+poste\b/.test(text)) add('SUPER POSTE')
  if (/(?:implan|instal).{0,65}\bposte\b|\bposte\b.{0,65}(?:implan|instal)/.test(text)) {
    add('IMPLANTAÇÃO DE POSTE')
  }
  if (/\bevento\b/.test(text)) add('EVENTO')
  if (/\bpraca\b/.test(text)) add('PRAÇA')
  if (/\bcampo\b/.test(text)) add('CAMPO')
  if (/\bescola\b/.test(text)) add('ESCOLA')
  if (/lancamento.{0,60}\bcabo\b|\bcabo\s+aereo\b/.test(text)) add('LANÇAMENTO DE CABO')
  if (/(?:implan|instal).{0,60}\brefletor/.test(text)) add('IMPLANTAÇÃO DE REFLETOR')
  if (/(?:implan|instal).{0,60}\btomad/.test(text)) add('INSTALAÇÃO DE TOMADA')
  if (/(?:implan|instal).{0,60}\blampad/.test(text)) add('INSTALAÇÃO DE LÂMPADA')

  // Troca de LED, fio, relé, conector e detalhes técnicos não entram sozinhos.
  // Mantém no máximo oito serviços realmente relevantes para o card ficar legível.
  return items.slice(0, 8).join(' • ')
}

function compactEffectiveObservationPartsV412(day, draft, metricKey) {
  const parts = originalEffectiveObservationPartsV412(day, draft, metricKey) || {}
  const automatic = compactAutomaticObservationV412(parts.automatic)
  const manual = String(parts.manual || '').trim()

  return {
    ...parts,
    automatic,
    manual,
    text: [automatic, manual].filter(Boolean).join('\n'),
    hasAutomatic: Boolean(automatic),
    hasManual: Boolean(manual),
    hasImportant: Boolean(automatic) || Boolean(parts.manualImportant),
  }
}

function installObservationLayoutV412() {
  if (document.getElementById('jr-observation-layout-v412')) return
  const style = document.createElement('style')
  style.id = 'jr-observation-layout-v412'
  style.textContent = `
    .services-observation-viewer-card {
      width: min(1180px, calc(100vw - 28px)) !important;
      max-width: 1180px !important;
      max-height: calc(100dvh - 28px) !important;
      min-height: 0 !important;
      overflow: hidden !important;
      display: grid !important;
      grid-template-rows: auto auto minmax(0, 1fr) auto !important;
    }

    .services-observation-viewer-header {
      min-width: 0 !important;
      flex: 0 0 auto !important;
    }

    .services-viewer-days {
      min-width: 0 !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      flex-wrap: nowrap !important;
      scrollbar-width: thin;
      overscroll-behavior-x: contain;
    }

    .services-viewer-days > * {
      flex: 0 0 auto !important;
    }

    .services-observation-viewer-body {
      min-width: 0 !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      grid-auto-rows: max-content !important;
      align-content: start !important;
      align-items: start !important;
      gap: 12px !important;
      padding-bottom: 24px !important;
    }

    .services-viewer-team {
      position: relative !important;
      min-width: 0 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: hidden !important;
      align-self: start !important;
    }

    .services-viewer-team-content,
    .services-viewer-service,
    .services-viewer-manual {
      min-width: 0 !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }

    .services-viewer-service p,
    .services-viewer-manual p {
      margin: 0 !important;
      white-space: pre-wrap !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      max-height: none !important;
      overflow: visible !important;
      line-height: 1.45 !important;
    }

    .services-observation-viewer-footer {
      position: relative !important;
      z-index: 2 !important;
      flex: 0 0 auto !important;
    }

    @media (max-width: 820px) {
      .services-observation-viewer-card {
        width: min(100vw - 14px, 760px) !important;
        max-height: calc(100dvh - 14px) !important;
      }
      .services-observation-viewer-body {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 10px !important;
      }
    }
  `
  document.head.appendChild(style)
}

const SETTINGS_FRESH_MS_V22 = 120000
const MATRIX_CACHE_IDLE_TIMEOUT_V22 = 1400

const dateFormatterV22 = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Campo_Grande',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const timeFormatterV22 = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Campo_Grande',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const monthFormatterV22 = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Campo_Grande',
  year: 'numeric',
  month: '2-digit',
})

const monthLabelFormatterV22 = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function requestIdleV22(callback, timeout = MATRIX_CACHE_IDLE_TIMEOUT_V22) {
  if (typeof window.requestIdleCallback === 'function') {
    return {
      type: 'idle',
      id: window.requestIdleCallback(callback, { timeout }),
    }
  }

  return {
    type: 'timeout',
    id: window.setTimeout(
      () => callback({
        didTimeout: true,
        timeRemaining: () => 0,
      }),
      120,
    ),
  }
}

function cancelIdleV22(handle) {
  if (!handle) return

  if (
    handle.type === 'idle' &&
    typeof window.cancelIdleCallback === 'function'
  ) {
    window.cancelIdleCallback(handle.id)
    return
  }

  window.clearTimeout(handle.id)
}


const els = {
  page: $('#page-services'),
  month: $('#services-month-filter'),
  metric: $('#services-metric-filter'),
  team: $('#services-team-filter'),
  showHidden: $('#services-show-hidden'),
  showHiddenColumns: $('#services-show-hidden-columns'),
  refresh: $('#services-refresh'),
  save: $('#services-save-all'),
  hideEmpty: $('#services-hide-empty'),
  showAll: $('#services-show-all'),
  showAllColumns: $('#services-show-all-columns'),
  toggleObservations: $('#services-toggle-observations'),
  download: $('#services-download'),
  importButton: $('#services-import-workbook'),
  discard: $('#services-discard-all'),
  dirtyActions: $('#services-dirty-actions'),
  loading: $('#services-loading'),
  error: $('#services-error'),
  root: $('#services-board-root'),
  saveState: $('#services-save-state'),
  dialog: $('#services-note-dialog'),
  dialogTitle: $('#services-note-dialog-title'),
  dialogBody: $('#services-note-dialog-body'),
  dialogSave: $('#services-note-dialog-save'),
  dialogCancel: $('#services-note-dialog-cancel'),

  viewer: $('#services-observation-viewer'),
  viewerTitle: $('#services-observation-viewer-title'),
  viewerPeriod: $('#services-observation-viewer-period'),
  viewerDays: $('#services-observation-viewer-days'),
  viewerBody: $('#services-observation-viewer-body'),
  viewerPrev: $('#services-observation-viewer-prev'),
  viewerNext: $('#services-observation-viewer-next'),
  viewerEdit: $('#services-observation-viewer-edit'),
  viewerClose: $('#services-observation-viewer-close'),

  unsavedDialog: $('#services-unsaved-dialog'),
  unsavedSave: $('#services-unsaved-save'),
  unsavedDiscard: $('#services-unsaved-discard'),
  unsavedStay: $('#services-unsaved-stay'),

  hoverPreview: $('#services-observation-hover'),

  actionConfirm: $('#services-action-confirm-dialog'),
  actionConfirmTitle: $('#services-action-confirm-title'),
  actionConfirmText: $('#services-action-confirm-text'),
  actionConfirmYes: $('#services-action-confirm-yes'),
  actionConfirmNo: $('#services-action-confirm-no'),

  importDialog: $('#services-import-dialog'),
  importClose: $('#services-import-close'),
  importCancel: $('#services-import-cancel'),
  importFile: $('#services-import-file'),
  importFileName: $('#services-import-file-name'),
  importTeam: $('#services-import-team'),
  importDate: $('#services-import-date'),
  importSummary: $('#services-import-summary'),
  importStatus: $('#services-import-status'),
  importApply: $('#services-import-apply'),
}

const state = {
  cache: null,
  profile: null,
  month: '',
  settingsMonth: '',
  settings: new Map(),
  drafts: new Map(),
  selectedTeam: 'all',
  metric: 'dayPoints',
  showHidden: false,
  showHiddenColumns: false,
  loading: false,
  dialogDay: 0,
  viewerDay: 0,
  pendingNavigation: null,
  allowNavigationOnce: false,
  hoverDay: 0,
  hoverAnchor: null,
  noteEditorRows: [],
  noteEditorNextId: 1,
  noteEditorRenderVersion: 0,

  sheetCacheSource: null,
  sheetCacheMonth: '',
  sheetCache: null,

  pendingDirectAction: '',
  matrixWheelDeltaY: 0,
  matrixWheelFrame: 0,

  noteSelectTouchY: 0,

  noteDialogDirty: false,

  importWorkbook: null,
  importEntries: [],
  importMeta: null,
  importRenderVersion: 0,

  matrixCacheFingerprint: '',
  sharedMatrixPersistTimer: 0,

  settingsLoadedAtV22: 0,
  settingsRevisionV22: '',
  settingsLoadPromiseV22: null,
  backgroundSettingsTimerV22: 0,

  fingerprintCacheSourceV22: null,
  fingerprintCacheMonthV22: '',
  fingerprintCacheValueV22: '',

  matrixPersistIdleV22: null,
  renderFrameV22: 0,
  scrollQuietUntilV39: 0,
  scrollQuietTimerV39: 0,
  visibilityAutoSaveTimerV40: 0,
  visibilityAutoSaveBusyV40: false,
  visibilityAutoSaveQueuedV40: false,
  hoverRetryTimerV40: 0,
  teamFilterSignatureV22: '',

  lastBoardRenderSignatureV25: '',
  boardWasRenderedV25: false,
}

initializeUiControls()
installObservationLayoutV412()
installObservationLayoutV413()
moveObservationHoverToBody()
moveDirtyActionsToBody()
bindEvents()
syncFromMainCache()
syncServicesUiControls()


function moveObservationHoverToBody() {
  if (
    els.hoverPreview &&
    els.hoverPreview.parentElement !== document.body
  ) {
    document.body.appendChild(
      els.hoverPreview,
    )
  }
}

function moveDirtyActionsToBody() {
  if (
    els.dirtyActions &&
    els.dirtyActions.parentElement !== document.body
  ) {
    document.body.appendChild(
      els.dirtyActions,
    )
  }
}

function syncServicesUiControls() {
  initializeUiControls()

  setUiControlValue(
    'services-month-filter',
    state.month || currentMonthValue(),
  )

  setUiControlValue(
    'services-metric-filter',
    state.metric,
  )

  setUiControlValue(
    'services-team-filter',
    state.selectedTeam,
  )
}


function applyScoreInputDraft(scoreInput) {
  if (!scoreInput || !isAdmin()) return

  const teamKey =
    scoreInput.dataset.team

  const metric =
    scoreInput.dataset.metric

  const day =
    String(
      Number(scoreInput.dataset.day),
    )

  const draft =
    draftFor(teamKey)

  const text =
    scoreInput.value.trim()

  if (!draft.scoreOverrides[metric]) {
    draft.scoreOverrides[metric] = {}
  }

  if (text === '') {
    delete draft.scoreOverrides[metric][day]
  } else {
    draft.scoreOverrides[metric][day] =
      clampScore(text)
  }

  if (
    Object.keys(
      draft.scoreOverrides[metric],
    ).length === 0
  ) {
    delete draft.scoreOverrides[metric]
  }

  markDirty(teamKey)
}

function markNoteDialogDirty() {
  state.noteDialogDirty = true
  updateSaveState()
}


function invalidateFingerprintV22() {
  state.fingerprintCacheSourceV22 = null
  state.fingerprintCacheMonthV22 = ''
  state.fingerprintCacheValueV22 = ''
}

function settingsRevisionV22(rows) {
  return (rows || [])
    .map((item) => [
      String(item?.team_key || ''),
      String(item?.updated_at || ''),
      String(item?.display_name || ''),
    ].join('|'))
    .sort()
    .join('||')
}

function scheduleBoardRenderV22() {
  if (state.renderFrameV22) return

  state.renderFrameV22 =
    window.requestAnimationFrame(() => {
      state.renderFrameV22 = 0
      renderBoard()
    })
}

function scheduleBackgroundSettingsRefreshV22() {
  window.clearTimeout(
    state.backgroundSettingsTimerV22,
  )

  if (
    hasUnsavedChanges() ||
    Date.now() - state.settingsLoadedAtV22 <
      SETTINGS_FRESH_MS_V22
  ) {
    return
  }

  state.backgroundSettingsTimerV22 =
    window.setTimeout(() => {
      if (
        !isServicesPageVisible() ||
        hasUnsavedChanges()
      ) {
        return
      }

      requestIdleV22(() => {
        if (
          !isServicesPageVisible() ||
          hasUnsavedChanges()
        ) {
          return
        }

        void loadSettingsAndRender(
          true,
          true,
          true,
        )
      }, 1800)
    }, 900)
}


function currentBoardRenderSignatureV25() {
  if (!state.cache || !state.month) {
    return ''
  }

  return [
    state.month,
    matrixFingerprintV21(),
    state.settingsRevisionV22 || '',
    state.metric,
    state.selectedTeam,
    state.showHidden ? '1' : '0',
    state.showHiddenColumns ? '1' : '0',
  ].join('|')
}

function markBoardRenderedV25() {
  state.lastBoardRenderSignatureV25 =
    currentBoardRenderSignatureV25()

  state.boardWasRenderedV25 =
    Boolean(
      els.root &&
      els.root.childElementCount,
    )
}

function canReuseBoardDomV25() {
  if (
    !state.boardWasRenderedV25 ||
    !els.root ||
    !els.root.childElementCount
  ) {
    return false
  }

  return (
    state.lastBoardRenderSignatureV25 ===
    currentBoardRenderSignatureV25()
  )
}

function bindEvents() {
  document.addEventListener('jr:pagechange', (event) => {
    if (event.detail?.page === 'services') activateServicesPage()
  })

  document.addEventListener('jr:monthdata', (event) => {
    const nextCache =
      event.detail || null
    const nextMonth =
      event.detail?.month ||
      currentMonthValue()

    const cacheChanged =
      state.cache !== nextCache ||
      state.month !== nextMonth

    state.cache = nextCache
    state.profile =
      event.detail?.profile || null
    state.month = nextMonth

    if (cacheChanged) {
      invalidateFingerprintV22()
      state.lastBoardRenderSignatureV25 = ''
      state.boardWasRenderedV25 = false
    }

    setUiControlValue(
      'services-month-filter',
      state.month,
    )

    if (isServicesPageVisible()) {
      void loadSettingsAndRender(
        false,
        true,
        false,
      )
    }
  })

  window.addEventListener('beforeunload', (event) => {
    if (!hasUnsavedChanges()) return
    event.preventDefault()
    event.returnValue = ''
  })

  document.addEventListener('click', interceptUnsavedNavigation, true)

  els.month?.addEventListener('change', () => {
    const month = normalizeMonth(els.month.value)
    if (!month || month === state.month) return

    if (hasUnsavedChanges()) {
      setUiControlValue('services-month-filter', state.month)
      openUnsavedDialog({ type: 'month', value: month })
      return
    }

    requestMonthFromMain(month)
  })

  els.metric?.addEventListener('change', () => {
    state.metric = SERVICE_METRIC_KEYS.includes(els.metric.value)
      ? els.metric.value
      : 'dayPoints'
    renderTeamFilter()
    renderBoard()
    if (state.viewerDay && els.viewer?.open) renderObservationViewer()
  })

  els.team?.addEventListener('change', () => {
    state.selectedTeam = els.team.value || 'all'
    renderBoard()
  })

  els.showHidden?.addEventListener('change', () => {
    state.showHidden = Boolean(els.showHidden.checked)
    renderBoard()
  })

  els.showHiddenColumns?.addEventListener('change', () => {
    state.showHiddenColumns = Boolean(els.showHiddenColumns.checked)
    renderBoard()
  })

  els.refresh?.addEventListener('click', () => {
    if (hasUnsavedChanges()) {
      openUnsavedDialog({ type: 'refresh' })
      return
    }
    performRefresh()
  })

  els.save?.addEventListener('click', () => {
    if (!hasUnsavedChanges()) return
    openDirectActionConfirm('save')
  })

  els.discard?.addEventListener('click', () => {
    if (!hasUnsavedChanges()) return
    openDirectActionConfirm('discard')
  })

  els.hideEmpty?.addEventListener('click', toggleEmptyRowsVisibilityV40)
  els.showAllColumns?.addEventListener('click', showAllColumnsForCurrentMetric)
  els.toggleObservations?.addEventListener('click', toggleObservationColumnForCurrentMetric)
  els.importButton?.addEventListener(
    'click',
    openImportDialog,
  )

  els.importFile?.addEventListener(
    'change',
    handleImportFile,
  )

  els.importTeam?.addEventListener(
    'change',
    renderImportPreview,
  )

  els.importDate?.addEventListener(
    'change',
    renderImportPreview,
  )

  els.importApply?.addEventListener(
    'click',
    applyImportedWorkbook,
  )

  els.importClose?.addEventListener(
    'click',
    closeImportDialog,
  )

  els.importCancel?.addEventListener(
    'click',
    closeImportDialog,
  )

  els.importDialog?.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault()
      closeImportDialog()
    },
  )

  els.download?.addEventListener('click', downloadWorkbook)
  /* JR_GESTAO_V39_SCROLL_NATIVO
     Nao cancela mais o wheel nem converte scroll em window.scrollBy.
     O Chrome passa a rolar pelo compositor nativo. */
  els.root?.addEventListener(
    'wheel',
    () => {
      state.scrollQuietUntilV39 = performance.now() + 150
      window.clearTimeout(state.scrollQuietTimerV39)
      state.scrollQuietTimerV39 = window.setTimeout(() => {
        state.scrollQuietUntilV39 = 0
      }, 170)
      if (state.hoverAnchor) hideObservationHover()
    },
    { passive: true },
  )
  els.root?.addEventListener('input', (event) => {
    if (!isAdmin()) return

    const alias =
      event.target.closest(
        '[data-services-alias]',
      )

    if (alias) {
      const teamKey =
        alias.dataset.servicesAlias

      const metricKey = alias.dataset.servicesAliasMetric || state.metric
      if (!SERVICE_METRIC_KEYS.includes(metricKey)) return
      const aliasDraft = draftFor(teamKey)
      if (!aliasDraft.displayNamesByMetric) aliasDraft.displayNamesByMetric = {}
      aliasDraft.displayNamesByMetric[metricKey] = alias.value.slice(0, 80)

      markDirty(teamKey)
      return
    }

    const scoreInput =
      event.target.closest(
        '[data-services-score]',
      )

    if (scoreInput) {
      applyScoreInputDraft(scoreInput)
    }
  })

  els.root?.addEventListener('change', (event) => {
    const scoreInput =
      event.target.closest(
        '[data-services-score]',
      )

    if (!scoreInput || !isAdmin()) {
      return
    }

    applyScoreInputDraft(scoreInput)
    scheduleBoardRenderV22()
  })
  /* JR_GESTAO_V40_HOVER_RETRY */
  els.root?.addEventListener('pointerover', (event) => {
    const anchor = event.target.closest('[data-services-hover-notes]')
    if (!anchor) return
    if (event.relatedTarget && anchor.contains(event.relatedTarget)) return
    const day = Number(anchor.dataset.servicesHoverNotes)
    if (!Number.isInteger(day)) return
    queueObservationHoverV40(day, anchor)
  })

  els.root?.addEventListener('pointerout', (event) => {
    const anchor = event.target.closest('[data-services-hover-notes]')
    if (!anchor) return
    if (event.relatedTarget && anchor.contains(event.relatedTarget)) return
    window.clearTimeout(state.hoverRetryTimerV40)
    state.hoverRetryTimerV40 = 0
    hideObservationHover()
  })
  window.addEventListener('scroll', () => {
    state.scrollQuietUntilV39 = performance.now() + 120
    if (state.hoverAnchor) hideObservationHover()
  }, { capture: true, passive: true })
  window.addEventListener('resize', hideObservationHover)

  els.root?.addEventListener('click', (event) => {
    const toggleDay = event.target.closest('[data-services-toggle-day]')
    if (toggleDay) {
      toggleHiddenDay(Number(toggleDay.dataset.servicesToggleDay))
      return
    }

    const toggleColumn = event.target.closest('[data-services-toggle-column]')
    if (toggleColumn) {
      toggleHiddenColumn(toggleColumn.dataset.servicesToggleColumn)
      return
    }

    const viewNotes = event.target.closest('[data-services-view-notes]')
    if (viewNotes) {
      openObservationViewer(Number(viewNotes.dataset.servicesViewNotes))
      return
    }

    const notes = event.target.closest('[data-services-edit-notes]')
    if (notes) openNotesDialog(Number(notes.dataset.servicesEditNotes))
  })

  els.dialogBody?.addEventListener(
    'wheel',
    (event) => {
      const menu = event.target.closest(
        '.services-note-dynamic-custom-select .custom-select-menu.show',
      )

      if (!menu) return

      event.preventDefault()
      event.stopPropagation()

      menu.scrollTop += event.deltaY
    },
    { passive: false },
  )

  els.dialogBody?.addEventListener(
    'touchstart',
    (event) => {
      const menu = event.target.closest(
        '.services-note-dynamic-custom-select .custom-select-menu.show',
      )

      if (!menu) return

      state.noteSelectTouchY =
        event.touches?.[0]?.clientY || 0

      event.stopPropagation()
    },
    { passive: true },
  )

  els.dialogBody?.addEventListener(
    'touchmove',
    (event) => {
      const menu = event.target.closest(
        '.services-note-dynamic-custom-select .custom-select-menu.show',
      )

      if (!menu) return

      const currentY =
        event.touches?.[0]?.clientY

      if (!Number.isFinite(currentY)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const delta =
        state.noteSelectTouchY - currentY

      menu.scrollTop += delta
      state.noteSelectTouchY = currentY
    },
    { passive: false },
  )

  els.dialogBody?.addEventListener(
    'input',
    (event) => {
      if (!isAdmin()) return

      const noteText =
        event.target.closest(
          '[data-note-text]',
        )

      if (noteText) {
        markNoteDialogDirty()
      }
    },
  )

  els.dialogBody?.addEventListener(
    'change',
    (event) => {
      if (!isAdmin()) return

      const noteFlag =
        event.target.closest(
          '[data-note-important], [data-note-suppress]',
        )

      if (noteFlag) {
        markNoteDialogDirty()
      }
    },
  )

  els.dialogBody?.addEventListener('change', (event) => {
    if (!isAdmin()) return

    const teamSelect = event.target.closest('[data-note-team-select]')
    if (!teamSelect) return

    const rowId = Number(teamSelect.dataset.noteTeamSelect)
    const row = state.noteEditorRows.find((item) => item.id === rowId)
    if (!row) return

    row.teamKey = String(teamSelect.value || '')
    renderNoteEditorRows()
  })

  els.dialogBody?.addEventListener('click', (event) => {
    if (!isAdmin()) return

    const addRow = event.target.closest('[data-note-add-row]')
    if (addRow) {
      state.noteEditorRows.push({
        id: state.noteEditorNextId++,
        teamKey: '',
      })
      renderNoteEditorRows()
      return
    }

    const removeRow = event.target.closest('[data-note-remove-row]')
    if (removeRow) {
      const rowId = Number(removeRow.dataset.noteRemoveRow)
      state.noteEditorRows = state.noteEditorRows.filter((item) => item.id !== rowId)

      if (!state.noteEditorRows.length) {
        state.noteEditorRows.push({
          id: state.noteEditorNextId++,
          teamKey: '',
        })
      }

      renderNoteEditorRows()
      return
    }

    const structured = event.target.closest(
      '[data-note-add-transfer], [data-note-add-absence], [data-note-add-support]',
    )

    if (!structured) return

    const section = structured.closest('[data-note-team]')
    const textarea = section?.querySelector('[data-note-text]')
    const ownSelect = section?.querySelector('[data-note-own-employee]')
    const destinationSelect = section?.querySelector('[data-note-destination-employee]')

    if (!section || !textarea || !ownSelect) return

    const employee = String(ownSelect.value || '').trim()
    if (!employee) {
      ownSelect.focus()
      showToast('Selecione o funcionário da equipe.')
      return
    }

    const period = metricPeriod(state.metric)
    const periodPhrase = period === 'day' ? 'na manhã/tarde' : 'à noite'
    let line = ''

    if (structured.matches('[data-note-add-transfer], [data-note-add-support]')) {
      const selectedOption = destinationSelect?.selectedOptions?.[0]
      const destinationEmployee = String(selectedOption?.value || '').trim()
      const destinationTeam = String(selectedOption?.dataset?.destinationTeam || '').trim()

      if (!destinationEmployee) {
        destinationSelect?.focus()
        showToast('Selecione com qual funcionário ele trabalhou.')
        return
      }

      const teamText = destinationTeam ? ` da equipe ${destinationTeam}` : ''

      if (structured.matches('[data-note-add-support]')) {
        line = `APOIO A OUTRA EQUIPE: ${employee} prestou apoio com ${destinationEmployee}${teamText} ${periodPhrase}.`
      } else {
        line = `FUNCIONÁRIO EM OUTRA EQUIPE: ${employee} trabalhou com ${destinationEmployee}${teamText} ${periodPhrase}.`
      }
    } else {
      line = `FUNCIONÁRIO AUSENTE: ${employee} não trabalhou com esta equipe ${periodPhrase}.`
    }

    appendManualNote(textarea, line)
    markNoteDialogDirty()
  })

  els.dialogSave?.addEventListener('click', applyNotesDialog)
  els.dialogCancel?.addEventListener('click', closeNotesDialog)
  els.dialog?.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeNotesDialog()
  })

  els.viewerPrev?.addEventListener('click', () => changeObservationViewerDay(-1))
  els.viewerNext?.addEventListener('click', () => changeObservationViewerDay(1))

  els.viewerDays?.addEventListener('click', (event) => {
    const dayButton = event.target.closest('[data-viewer-day]')
    if (!dayButton) return

    const day = Number(dayButton.dataset.viewerDay)
    if (!Number.isInteger(day)) return

    state.viewerDay = day
    renderObservationViewer()
  })

  els.viewerEdit?.addEventListener('click', () => {
    if (!isAdmin() || !state.viewerDay) return
    const day = state.viewerDay
    closeObservationViewer()
    openNotesDialog(day)
  })

  els.viewerClose?.addEventListener('click', closeObservationViewer)
  els.viewer?.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeObservationViewer()
  })

  els.actionConfirmYes?.addEventListener(
    'click',
    async () => {
      const action =
        state.pendingDirectAction

      closeDirectActionConfirm()

      if (action === 'save') {
        if (
          state.noteDialogDirty &&
          els.dialog?.open
        ) {
          const applied =
            applyNotesDialog()

          if (!applied) {
            return
          }
        }

        await saveAllChanges()
        return
      }

      if (action === 'discard') {
        state.noteDialogDirty = false

        if (els.dialog?.open) {
          closeNotesDialog()
        }

        discardAllDraftChanges()
      }
    },
  )

  els.actionConfirmNo?.addEventListener(
    'click',
    closeDirectActionConfirm,
  )

  els.actionConfirm?.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault()
      closeDirectActionConfirm()
    },
  )

  els.unsavedSave?.addEventListener('click', async () => {
    const action = state.pendingNavigation
    const saved = await saveAllChanges()
    if (!saved || hasUnsavedChanges()) return
    closeUnsavedDialog()
    continuePendingNavigation(action)
  })

  els.unsavedDiscard?.addEventListener('click', () => {
    const action = state.pendingNavigation
    discardAllDraftChanges()
    closeUnsavedDialog()
    continuePendingNavigation(action)
  })

  els.unsavedStay?.addEventListener('click', closeUnsavedDialog)
  els.unsavedDialog?.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeUnsavedDialog()
  })
}



async function activateServicesPage() {
  syncFromMainCache()

  if (!state.cache) {
    showLoading(true)
    setError(
      'Aguardando os dados mensais do painel...',
    )
    return
  }

  const warm =
    state.settingsMonth === state.month &&
    state.settings.size > 0

  if (warm) {
    if (!canReuseBoardDomV25()) {
      renderTeamFilter()
      renderBoard()
    }

    showLoading(false)
    scheduleBackgroundSettingsRefreshV22()
    return
  }

  await loadSettingsAndRender(
    false,
    false,
    false,
  )
}

function syncFromMainCache() {
  const cache =
    window.__JR_SERVICES_MONTH_CACHE__

  if (!cache) return

  state.cache = cache
  state.profile = cache.profile || null
  state.month =
    cache.month || currentMonthValue()

  setUiControlValue(
    'services-month-filter',
    state.month,
  )
}

function requestMonthFromMain(month, force = false) {
  clearError()
  showLoading(true)
  state.month = month

  setUiControlValue(
    'services-month-filter',
    month,
  )

  const mainMonth = $('#month-filter')

  if (!mainMonth) {
    setError(
      'O filtro mensal principal não foi encontrado.',
    )
    showLoading(false)
    return
  }

  setUiControlValue(
    'month-filter',
    month,
  )

  mainMonth.value = month
  mainMonth.dispatchEvent(
    new Event('change', { bubbles: true }),
  )

  if (
    force &&
    state.cache?.month === month
  ) {
    window.setTimeout(
      () => loadSettingsAndRender(),
      250,
    )
  }
}


async function loadSettingsAndRender(
  forceSettings = false,
  silentWarm = false,
  backgroundOnly = false,
) {
  if (!state.cache || !state.month) {
    return false
  }

  const warm =
    state.settingsMonth === state.month &&
    state.settings.size > 0

  const settingsFresh =
    warm &&
    Date.now() - state.settingsLoadedAtV22 <
      SETTINGS_FRESH_MS_V22

  const needsSettings =
    forceSettings ||
    !warm ||
    !settingsFresh

  if (
    !silentWarm &&
    !warm &&
    !backgroundOnly
  ) {
    showLoading(true)
  }

  if (!backgroundOnly) {
    clearError()
  }

  try {
    let settingsChanged = false

    if (
      needsSettings &&
      !hasUnsavedChanges()
    ) {
      if (!state.settingsLoadPromiseV22) {
        const monthRequested = state.month

        state.settingsLoadPromiseV22 =
          (async () => {
            const { data, error } =
              await supabase
                .from('service_report_settings')
                .select(
                  'month_key, team_key, display_name, hidden_days, manual_notes, updated_at',
                )
                .eq(
                  'month_key',
                  monthRequested,
                )

            if (error) throw error

            return {
              monthRequested,
              rows: data || [],
            }
          })().finally(() => {
            state.settingsLoadPromiseV22 = null
          })
      }

      const result =
        await state.settingsLoadPromiseV22

      if (
        result.monthRequested !== state.month
      ) {
        return false
      }

      const nextRevision =
        settingsRevisionV22(
          result.rows,
        )

      settingsChanged =
        state.settingsMonth !== state.month ||
        state.settingsRevisionV22 !==
          nextRevision

      if (settingsChanged) {
        state.lastBoardRenderSignatureV25 = ''

        state.settings = new Map(
          result.rows.map((item) => [
            String(item.team_key),
            normalizeReportSetting(item),
          ]),
        )

        state.drafts.clear()
        state.teamFilterSignatureV22 = ''
        state.settingsRevisionV22 =
          nextRevision
      }

      state.settingsMonth = state.month
      state.settingsLoadedAtV22 =
        Date.now()
    }

    if (
      backgroundOnly &&
      !settingsChanged
    ) {
      return true
    }

    renderTeamFilter()
    renderBoard()

    return true
  } catch (error) {
    if (!backgroundOnly) {
      setError(friendlyError(error))
    }

    return false
  } finally {
    if (!backgroundOnly) {
      showLoading(false)
    }
  }
}



function matrixFingerprintV21() {
  if (
    state.fingerprintCacheSourceV22 ===
      state.cache &&
    state.fingerprintCacheMonthV22 ===
      state.month &&
    state.fingerprintCacheValueV22
  ) {
    return state.fingerprintCacheValueV22
  }

  const cache = state.cache || {}
  const records =
    Array.isArray(cache.records)
      ? cache.records
      : []
  const profiles =
    Array.isArray(cache.profiles)
      ? cache.profiles
      : []

  let newest = ''
  let versionSum = 0

  for (const row of records) {
    const stamp =
      String(
        row?.updated_at ||
        row?.data ||
        '',
      )

    if (stamp > newest) {
      newest = stamp
    }

    versionSum +=
      Number(
        row?.sync_version || 0,
      )
  }

  const value = [
    'period-split-v28',
    state.month,
    records.length,
    profiles.length,
    newest,
    versionSum,
  ].join('|')

  state.fingerprintCacheSourceV22 =
    state.cache
  state.fingerprintCacheMonthV22 =
    state.month
  state.fingerprintCacheValueV22 =
    value

  return value
}

function compactMatrixSnapshotV21(sheets, fingerprint) {
  return {
    fingerprint,
    month: state.month,
    updatedAt: new Date().toISOString(),
    teams: (sheets || []).map((sheet) => ({
      key: sheet.key,
      originalName: sheet.originalName,
      days: sheet.days.map((day) => ({
        day: day.day,
        dayPoints: Number(day.dayPoints || 0),
        daySurveys: Number(day.daySurveys || 0),
        nightPoints: Number(day.nightPoints || 0),
        nightSurveys: Number(day.nightSurveys || 0),
        autoObservationByMetric: { ...day.autoObservationByMetric },
      })),
    })),
  }
}

function hydrateMatrixSnapshotV21(snapshot) {
  if (!snapshot?.teams?.length) return null

  return snapshot.teams.map((saved) => {
    const sheet = createTeamSheet(saved.key, saved.originalName)
    saved.days?.forEach((source, index) => {
      const day = sheet.days[index]
      if (!day) return
      day.dayPoints = Number(source.dayPoints || 0)
      day.daySurveys = Number(source.daySurveys || 0)
      day.nightPoints = Number(source.nightPoints || 0)
      day.nightSurveys = Number(source.nightSurveys || 0)
      SERVICE_METRIC_KEYS.forEach((metric) => {
        day.autoObservationByMetric[metric] = String(
          source.autoObservationByMetric?.[metric] || '',
        )
      })
    })
    return sheet
  })
}

function localMatrixCacheKeyV21() {
  return `jr_services_matrix_v21:${state.month}`
}

function loadCachedMatrixV21(fingerprint) {
  const globalSnapshot = draftFor(GLOBAL_KEY).matrixCacheV21
  if (
    globalSnapshot?.fingerprint === fingerprint &&
    globalSnapshot?.month === state.month
  ) {
    const hydrated = hydrateMatrixSnapshotV21(globalSnapshot)
    if (hydrated) return hydrated
  }

  try {
    const parsed = JSON.parse(
      localStorage.getItem(localMatrixCacheKeyV21()) || 'null',
    )
    if (
      parsed?.fingerprint === fingerprint &&
      parsed?.month === state.month
    ) {
      return hydrateMatrixSnapshotV21(parsed)
    }
  } catch (_error) {}

  return null
}


function scheduleMatrixCachePersistV21(
  sheets,
  fingerprint,
) {
  cancelIdleV22(
    state.matrixPersistIdleV22,
  )

  state.matrixPersistIdleV22 =
    requestIdleV22(async () => {
      state.matrixPersistIdleV22 = null

      const snapshot =
        compactMatrixSnapshotV21(
          sheets,
          fingerprint,
        )

      try {
        localStorage.setItem(
          localMatrixCacheKeyV21(),
          JSON.stringify(snapshot),
        )
      } catch (_error) {}

      const globalDraft =
        draftFor(GLOBAL_KEY)

      if (
        !isAdmin() ||
        globalDraft.dirty ||
        globalDraft.matrixCacheV21
          ?.fingerprint === fingerprint
      ) {
        return
      }

      window.clearTimeout(
        state.sharedMatrixPersistTimer,
      )

      state.sharedMatrixPersistTimer =
        window.setTimeout(
          async () => {
            try {
              if (
                draftFor(GLOBAL_KEY).dirty
              ) {
                return
              }

              const latest =
                draftFor(GLOBAL_KEY)

              latest.matrixCacheV21 =
                snapshot

              await supabase
                .from(
                  'service_report_settings',
                )
                .upsert(
                  {
                    month_key:
                      state.month,
                    team_key:
                      GLOBAL_KEY,
                    display_name:
                      latest.displayName ||
                      'Matriz',
                    hidden_days: [
                      ...latest.hiddenDays,
                    ].sort(
                      (a, b) => a - b,
                    ),
                    manual_notes:
                      serializeReportSetting(
                        latest,
                      ),
                  },
                  {
                    onConflict:
                      'month_key,team_key',
                  },
                )
            } catch (_error) {
              // Cache compartilhado é otimização.
            }
          },
          1200,
        )
    })
}


function detectImportantServicesExpandedV28(record) {
  const products =
    Array.isArray(record?.products)
      ? record.products
      : []

  const productText =
    products
      .map((item) =>
        [
          item?.product?.code,
          item?.product?.name,
          item?.code,
          item?.name,
        ]
          .filter(Boolean)
          .join(' '),
      )
      .join(' ')

  /*
    V33: produtos comuns nao entram no detector textual. O codigo 16 continua
    sendo tratado por detectImportantServices(record), sem fazer RELE/FIO/LED
    virarem servico importante por acidente.
  */
  const source = [
    record?.serviceType?.name,
    record?.observation,
    record?.surveyObservation,
  ]
    .filter(Boolean)
    .join('\n')

  const result = new Map()

  for (const text of detectImportantServices(record)) {
    result.set(normalizeImportText(text), text)
  }

  for (const text of importantObservationLinesV28(source)) {
    result.set(normalizeImportText(text), text)
  }

  return [...result.values()]
}

function buildTeamSheets() {
  const fingerprint = matrixFingerprintV21()

  if (
    state.sheetCache &&
    state.sheetCacheMonth === state.month &&
    state.matrixCacheFingerprint === fingerprint
  ) {
    return state.sheetCache
      .slice()
      .sort((a, b) =>
        displayNameFor(a).localeCompare(
          displayNameFor(b),
          'pt-BR',
        ),
      )
  }

  const cached = loadCachedMatrixV21(fingerprint)
  if (cached) {
    state.sheetCacheSource = state.cache
    state.sheetCacheMonth = state.month
    state.matrixCacheFingerprint = fingerprint
    state.sheetCache = cached
    return cached
      .slice()
      .sort((a, b) =>
        displayNameFor(a).localeCompare(displayNameFor(b), 'pt-BR'),
      )
  }

  const cache = state.cache || {}
  const profiles =
    Array.isArray(cache.profiles)
      ? cache.profiles
      : []
  const records =
    Array.isArray(cache.records)
      ? cache.records
      : []

  const profileMap = new Map(
    profiles.map(
      (profile) => [
        String(profile.id),
        profile,
      ],
    ),
  )

  const teams = new Map()

  profiles
    .filter(
      (profile) =>
        profile?.active === true &&
        profile?.role === 'team',
    )
    .forEach((profile) => {
      const key = String(profile.id)

      teams.set(
        key,
        createTeamSheet(
          key,
          String(
            profile.team_name ||
            profile.username ||
            'Equipe',
          ),
        ),
      )
    })

  records
    .filter(
      (row) =>
        !row?.deleted_at &&
        serviceDateKey(row).startsWith(
          `${state.month}-`,
        ),
    )
    .forEach((row) => {
      const record =
        row?.registro || {}

      const profile =
        profileMap.get(
          String(row?.user_id || ''),
        )

      const originalName =
        String(
          profile?.team_name ||
          record.teamName ||
          'Sem equipe',
        ).trim() || 'Sem equipe'

      const key = row?.user_id
        ? String(row.user_id)
        : `legacy:${normalizeText(originalName)}`

      if (!teams.has(key)) {
        teams.set(
          key,
          createTeamSheet(
            key,
            originalName,
          ),
        )
      }

      const sheet = teams.get(key)
      const dayNumber = Number(
        serviceDateKey(row).slice(8, 10),
      )

      if (
        !Number.isInteger(dayNumber) ||
        dayNumber < 1 ||
        dayNumber > sheet.days.length
      ) {
        return
      }

      const day =
        sheet.days[dayNumber - 1]

      const score =
        recordScore(row)

      const detected =
        detectImportantServicesExpandedV28(
          record,
        )

      if (Number(score.normal) > 0) {
        const pointMinutesV371 = pointMinutesV28(row)
        /* JR_GESTAO_V37_1_NAO_CLASSIFICA_HORARIO_AUSENTE */
        if (!Number.isFinite(pointMinutesV371)) {
          // Sem horario confiavel: nao inventar M/T nem Noite.
        } else if (isDayMinutesV28(pointMinutesV371)) {
          day.dayPoints += score.normal

          detected.forEach(
            (item) =>
              day.importantByMetric
                .dayPoints.add(item),
          )
        } else {
          day.nightPoints += score.normal

          detected.forEach(
            (item) =>
              day.importantByMetric
                .nightPoints.add(item),
          )
        }
      }

      if (Number(score.levantamento) > 0) {
        const surveyMinutesV371 = surveyMinutesV28(row)
        /* JR_GESTAO_V37_1_NAO_CLASSIFICA_LEVANTAMENTO_SEM_HORARIO */
        if (!Number.isFinite(surveyMinutesV371)) {
          // Sem horario confiavel: nao inventar M/T nem Noite.
        } else if (isDayMinutesV28(surveyMinutesV371)) {
          day.daySurveys +=
            score.levantamento

          detected.forEach(
            (item) =>
              day.importantByMetric
                .daySurveys.add(item),
          )
        } else {
          day.nightSurveys +=
            score.levantamento

          detected.forEach(
            (item) =>
              day.importantByMetric
                .nightSurveys.add(item),
          )
        }
      }
    })

  const result =
    [...teams.values()].map(
      (sheet) => {
        sheet.days.forEach((day) => {
          SERVICE_METRIC_KEYS.forEach(
            (metric) => {
              day.autoObservationByMetric[
                metric
              ] = [
                ...day.importantByMetric[
                  metric
                ],
              ].join(' • ')
            },
          )
        })

        return sheet
      },
    )

  state.sheetCacheSource = state.cache
  state.sheetCacheMonth = state.month
  state.matrixCacheFingerprint = fingerprint
  state.sheetCache = result
  scheduleMatrixCachePersistV21(result, fingerprint)

  return result
    .slice()
    .sort((a, b) =>
      displayNameFor(a).localeCompare(
        displayNameFor(b),
        'pt-BR',
      ),
    )
}

function createTeamSheet(key, originalName) {
  return {
    key,
    originalName,
    days: Array.from(
      { length: daysInMonth(state.month) },
      (_unused, index) => ({
        day: index + 1,
        dayPoints: 0,
        daySurveys: 0,
        nightPoints: 0,
        nightSurveys: 0,
        importantByMetric: {
          dayPoints: new Set(),
          daySurveys: new Set(),
          nightPoints: new Set(),
          nightSurveys: new Set(),
        },
        autoObservationByMetric: {
          dayPoints: '',
          daySurveys: '',
          nightPoints: '',
          nightSurveys: '',
        },
      }),
    ),
  }
}


function renderTeamFilter() {
  if (!els.team) return

  const sheets =
    buildTeamSheets()

  const previous =
    state.selectedTeam

  const entries =
    sheets.map((sheet) => {
      const hidden =
        isMetricHidden(
          draftFor(sheet.key),
          state.metric,
        )

      const suffix = hidden
        ? ' • oculta nesta planilha'
        : ''

      return {
        key: sheet.key,
        label:
          displayNameFor(sheet) +
          suffix,
      }
    })

  const next =
    sheets.some(
      (sheet) =>
        sheet.key === previous,
    )
      ? previous
      : 'all'

  const signature = [
    state.metric,
    next,
    ...entries.map(
      (item) =>
        `${item.key}:${item.label}`,
    ),
  ].join('|')

  if (
    state.teamFilterSignatureV22 !==
      signature
  ) {
    els.team.innerHTML =
      '<option value="all">Todas as equipes em colunas</option>' +
      entries
        .map(
          (item) =>
            `<option value="${escapeHtml(
              item.key,
            )}">${escapeHtml(
              item.label,
            )}</option>`,
        )
        .join('')

    refreshCustomSelect(
      'services-team-filter',
    )

    state.teamFilterSignatureV22 =
      signature
  }

  els.team.value = next
  state.selectedTeam = next

  setUiControlValue(
    'services-team-filter',
    next,
  )
}

function renderBoard() {
  if (!els.root || !state.cache) return

  hideObservationHover()

  const admin = isAdmin()
  const metric = metricDefinition(state.metric)
  const period = metricPeriod(state.metric)
  const periodLabel = SERVICE_PERIOD_LABELS[period]
  const allSheets = buildTeamSheets()
  const candidateSheets = allSheets.filter(
    (sheet) =>
      state.selectedTeam === 'all' ||
      sheet.key === state.selectedTeam,
  )

  /* JR_GESTAO_V39_RENDER_CACHE: cache efemero, somente para este desenho. */
  const renderDraftCacheV39 = new Map()
  const renderDraftV39 = (sheet) => {
    if (!renderDraftCacheV39.has(sheet.key)) {
      renderDraftCacheV39.set(sheet.key, draftFor(sheet.key))
    }
    return renderDraftCacheV39.get(sheet.key)
  }
  const renderObservationCacheV39 = new Map()
  const renderNotePartsV39 = (sheet, dayNumber) => {
    const key = `${sheet.key}|${dayNumber}|${state.metric}`
    if (renderObservationCacheV39.has(key)) {
      return renderObservationCacheV39.get(key)
    }
    const parts = compactEffectiveObservationPartsV412(
      sheet.days[dayNumber - 1],
      renderDraftV39(sheet),
      state.metric,
    )
    renderObservationCacheV39.set(key, parts)
    return parts
  }
  const hiddenColumnCount = candidateSheets.filter(
    (sheet) => isMetricHidden(renderDraftV39(sheet), state.metric),
  ).length
  const sheets = candidateSheets.filter(
    (sheet) =>
      state.showHiddenColumns ||
      !isMetricHidden(renderDraftV39(sheet), state.metric),
  )

  const globalDraft = draftFor(GLOBAL_KEY)
  const observationsHidden = isObservationHidden(
    globalDraft,
    state.metric,
  )

  updateVisibilityButtonsV40(globalDraft)

  const visibleDays = Array.from(
    { length: daysInMonth(state.month) },
    (_unused, index) => index + 1,
  ).filter(
    (day) =>
      state.showHidden ||
      !globalDraft.hiddenDays.has(day),
  )

  ;[
    els.save,
    els.hideEmpty,
    els.showAll,
    els.showAllColumns,
    els.toggleObservations,
    els.importButton,
  ].forEach((button) =>
    button?.classList.toggle('hidden', !admin),
  )

  els.showHidden
    ?.closest('label')
    ?.classList.toggle('hidden', !admin)

  els.showHiddenColumns
    ?.closest('label')
    ?.classList.toggle('hidden', !admin)

  if (els.toggleObservations) {
    const label = els.toggleObservations.querySelector('.button-label')
    if (label) {
      label.textContent = observationsHidden
        ? 'Mostrar observações'
        : 'Ocultar observações'
    }
  }

  if (candidateSheets.length === 0) {
    els.root.innerHTML =
      '<div class="services-empty"><strong>Nenhuma equipe encontrada</strong><span>Selecione outro mês ou atualize os dados.</span></div>'
    updateSaveState()
    markBoardRenderedV25()
    return
  }

  if (sheets.length === 0) {
    els.root.innerHTML = `<div class="services-empty services-empty-columns">
      <strong>Todas as equipes desta seleção estão ocultas em ${escapeHtml(metric.label)}</strong>
      <span>Marque “Mostrar equipes ocultas” para revisar ou use “Mostrar todas as equipes desta planilha”.</span>
    </div>`
    updateSaveState()
    markBoardRenderedV25()
    return
  }

  const headerCells = sheets.map((sheet) => {
    const displayName = displayNameFor(sheet)
    const hidden = isMetricHidden(
      renderDraftV39(sheet),
      state.metric,
    )

    return `<th class="services-team-column ${hidden ? 'is-hidden-column' : ''}">
      <div class="services-matrix-team-name">
        ${
          admin
            ? `<input data-services-alias="${escapeHtml(sheet.key)}" data-services-alias-metric="${escapeHtml(state.metric)}" maxlength="80" value="${escapeHtml(displayName)}" aria-label="Nome da equipe nesta área" />`
            : `<strong>${escapeHtml(displayName)}</strong>`
        }
        ${
          displayName !== sheet.originalName
            ? `<small>Original: ${escapeHtml(sheet.originalName)}</small>`
            : ''
        }
        ${
          hidden
            ? '<span class="services-hidden-column-badge">oculta nesta planilha</span>'
            : ''
        }
        ${
          admin
            ? `<button type="button" class="services-column-toggle" data-services-toggle-column="${escapeHtml(sheet.key)}">${hidden ? 'Mostrar coluna' : 'Ocultar nesta planilha'}</button>`
            : ''
        }
      </div>
    </th>`
  }).join('')

  const bodyRows = visibleDays.map((dayNumber) => {
    const isDayHidden = globalDraft.hiddenDays.has(dayNumber)

    const cells = sheets.map((sheet) => {
      const day = sheet.days[dayNumber - 1]
      const draft = renderDraftV39(sheet)
      const value = effectiveScore(
        day,
        draft,
        state.metric,
      )
      const overridden = hasScoreOverride(
        draft,
        state.metric,
        dayNumber,
      )
      const imported = hasImportedScore(
        draft,
        state.metric,
        dayNumber,
      )
      const noteParts = renderNotePartsV39(sheet, dayNumber)
      const important = noteParts.hasImportant
      const manual = noteParts.hasManual
      const hidden = isMetricHidden(
        draft,
        state.metric,
      )
      const digits = Math.max(
        1,
        String(Math.abs(Number(value) || 0)).length,
      )

      const sourceLabel = overridden
        ? 'alterado'
        : imported
          ? 'importado'
          : ''

      return `<td class="services-score-cell ${overridden ? 'is-overridden' : ''} ${imported ? 'is-imported-score' : ''} ${important ? 'has-important-service' : ''} ${manual ? 'has-manual-communication' : ''} ${hidden ? 'is-hidden-column' : ''}">
        <div class="services-score-wrap">
          <span class="services-score-top-slot ${sourceLabel ? '' : 'is-empty-slot'}">${sourceLabel || 'normal'}</span>
          <div class="services-score-center">
            ${
              admin
                ? `<input type="number" inputmode="numeric" min="0" max="999999" step="1" value="${value}" style="--score-digits:${digits}" data-services-score data-team="${escapeHtml(sheet.key)}" data-metric="${state.metric}" data-day="${dayNumber}" title="Apague o valor para voltar ao cálculo automático" />`
                : `<strong style="--score-digits:${digits}">${value}</strong>`
            }
          </div>
          <span class="services-score-bottom-slot ${important ? '' : 'is-empty-slot'}">✦ destaque</span>
        </div>
      </td>`
    }).join('')

    const noteItems = sheets
      .map((sheet) => {
        const parts = renderNotePartsV39(sheet, dayNumber)
        return {
          team: displayNameFor(sheet, state.metric),
          automatic: parts.automatic,
          imported: parts.imported,
          manual: parts.manual,
          text: parts.text,
          important: parts.hasImportant,
          manualImportant: parts.manualImportant,
        }
      })
      .filter((item) => item.text || item.important)

    const noteCount = noteItems.length
    const hasImportantObservation = noteItems.some(
      (item) => Boolean(item.important),
    )

    let observationCell = ''

    if (!observationsHidden) {
      if (isDayHidden) {
        observationCell = `<td class="services-observations-column services-observations-compact services-observation-hidden-day">
          <div class="services-hidden-day-note">
            <strong>Dia ${String(dayNumber).padStart(2, '0')} oculto</strong>
            <small>Desoculte o dia na primeira coluna para voltar a ver as observações.</small>
          </div>
        </td>`
      } else {
        observationCell = `<td class="services-observations-column services-observations-compact">
          <button type="button"
            class="services-observation-open ${hasImportantObservation ? 'has-important' : ''}"
            data-services-view-notes="${dayNumber}">
            <span class="services-observation-open-main">
              <span class="services-observation-open-eye"
                data-icon="eye"
                data-services-hover-notes="${dayNumber}"
                aria-label="Passe o mouse para visualizar as observações do dia ${String(dayNumber).padStart(2, '0')}"></span>
              <span class="services-observation-open-copy">
                <strong>Clique para ver observações do dia ${String(dayNumber).padStart(2, '0')}</strong>
              </span>
            </span>
          </button>
          ${
            admin
              ? `<button type="button" class="services-edit-notes services-edit-notes-compact" data-services-edit-notes="${dayNumber}">Editar</button>`
              : ''
          }
        </td>`
      }
    }

    return `<tr class="${isDayHidden ? 'services-row-hidden' : ''}">
      <td class="services-day-cell">
        <div class="services-day-stack">
          <strong>${String(dayNumber).padStart(2, '0')}</strong>
          ${
            admin
              ? `<button type="button"
                  class="services-day-toggle ${isDayHidden ? 'is-restore' : ''}"
                  data-services-toggle-day="${dayNumber}"
                  title="${isDayHidden ? 'Desocultar dia' : 'Ocultar dia'}"
                  aria-label="${isDayHidden ? 'Desocultar' : 'Ocultar'} dia ${String(dayNumber).padStart(2, '0')}">${isDayHidden ? '+' : '−'}</button>`
              : ''
          }
        </div>
      </td>
      ${cells}
      ${observationCell}
    </tr>`
  }).join('')

  const totals = sheets.map((sheet) => {
    const draft = renderDraftV39(sheet)
    const total = sheet.days.reduce(
      (sum, day) =>
        sum +
        effectiveScore(
          day,
          draft,
          state.metric,
        ),
      0,
    )

    return `<th class="${isMetricHidden(draft, state.metric) ? 'is-hidden-column' : ''}">${total}</th>`
  }).join('')

  const footerObservation = observationsHidden
    ? ''
    : '<th>Observação</th>'

  const observationHeader = observationsHidden
    ? ''
    : '<th class="services-observations-header">Observação</th>'

  const colspan = sheets.length + (observationsHidden ? 1 : 2)

  els.root.innerHTML = `
    <div class="services-matrix-meta">
      <div class="services-matrix-meta-main">
        <strong>${escapeHtml(metric.label)}</strong>
        <span class="services-period-chip">${escapeHtml(periodLabel)}</span>
      </div>
      <span>${sheets.length} equipe(s) visível(is) • ${hiddenColumnCount} coluna(s) oculta(s) • Observações ${observationsHidden ? 'ocultas' : 'visíveis'} nesta planilha • ${monthLabel(state.month)}</span>
    </div>

    <div class="services-matrix-scroll">
      <table class="services-matrix-table" style="--services-team-count:${sheets.length}">
        <thead>
          <tr>
            <th class="services-day-column">Dia</th>
            ${headerCells}
            ${observationHeader}
          </tr>
        </thead>

        <tbody>
          ${
            bodyRows ||
            `<tr><td colspan="${colspan}" class="services-no-rows">Todas as linhas estão ocultas. Marque “Revisar / desocultar dias ocultos” para recuperá-las.</td></tr>`
          }
        </tbody>

        <tfoot>
          <tr>
            <th>TOTAL</th>
            ${totals}
            ${footerObservation}
          </tr>
        </tfoot>
      </table>
    </div>`

  hydrateIcons(els.root)
  updateSaveState()
  markBoardRenderedV25()
}


function importedObservationDisplayV26(value) {
  return String(value || '')
    .replace(
      /^IMPORTADO:\s*/i,
      '',
    )
    .trim()
}

function observationItemsForDay(
  sheets,
  dayNumber,
  metricKey = state.metric,
) {
  return sheets
    .map((sheet) => {
      const day = sheet.days[dayNumber - 1]
      const parts = jrRawObservationPartsV413(
        day,
        draftFor(sheet.key),
        metricKey,
      )
      const automatic = smartObservationSummaryV413(parts.automatic)
      const manual = String(parts.manual || '').trim()
      return {
        team: displayNameFor(sheet),
        automatic,
        manual,
        text: [automatic, manual].filter(Boolean).join('\n'),
        important: Boolean(automatic) || Boolean(parts.manualImportant),
        manualImportant: parts.manualImportant,
      }
    })
    .filter((item) => item.text || item.important)
}
function employeeNamesForSheet(sheet) {
  const source = displayNameFor(sheet) || sheet?.originalName || ''
  const parts = String(source)
    .split(/\s+(?:e|&)\s+|\/|,|\+|\s+-\s+/i)
    .map((item) => item.trim())
    .filter(Boolean)

  return [...new Set(parts.length ? parts : [String(source).trim()].filter(Boolean))]
}

function appendManualNote(textarea, line) {
  const value = String(line || '').trim()
  if (!textarea || !value) return

  const current = String(textarea.value || '').trim()
  textarea.value = current ? `${current}\n${value}` : value
  textarea.focus()
  textarea.setSelectionRange?.(textarea.value.length, textarea.value.length)
}


function availableObservationDays() {
  const hiddenDays = draftFor(GLOBAL_KEY).hiddenDays

  return Array.from(
    { length: daysInMonth(state.month) },
    (_unused, index) => index + 1,
  ).filter((day) => !hiddenDays.has(day))
}

function visibleSheetsForHover() {
  return buildTeamSheets()
    .filter(
      (sheet) =>
        state.selectedTeam === 'all' ||
        sheet.key === state.selectedTeam,
    )
    .filter(
      (sheet) =>
        state.showHiddenColumns ||
        !isMetricHidden(
          draftFor(sheet.key),
          state.metric,
        ),
    )
}

function showObservationHover(dayNumber, anchor) {
  if (!els.hoverPreview || !anchor) return
  if (draftFor(GLOBAL_KEY).hiddenDays.has(dayNumber)) return
  const metric = metricDefinition(state.metric)
  const items = visibleSheetsForHover()
    .map((sheet) => {
      const parts = jrRawObservationPartsV413(
        sheet.days[dayNumber - 1],
        draftFor(sheet.key),
        state.metric,
      )
      const automatic = smartObservationSummaryV413(parts.automatic)
      const manual = String(parts.manual || '').trim()
      if (!automatic && !manual && !parts.manualImportant) return null
      return {
        team: displayNameFor(sheet),
        automatic,
        manual,
        important: Boolean(automatic) || Boolean(parts.manualImportant),
        manualImportant: Boolean(parts.manualImportant),
      }
    })
    .filter(Boolean)

  const content = items.length
    ? items.map((item) => `<article class="services-hover-team ${item.important ? 'is-important' : ''}">
        <strong>${escapeHtml(item.team)}</strong>
        ${item.automatic ? `<span class="services-hover-service"><b>Serviço:</b> ${escapeHtml(item.automatic)}</span>` : ''}
        ${item.manual ? `<span class="services-hover-manual"><b>Comunicado:</b> ${escapeHtml(item.manual)}</span>` : ''}
        ${item.manualImportant && !item.automatic ? '<span class="services-hover-manual-highlight">✦ Destaque manual como serviço importante</span>' : ''}
      </article>`).join('')
    : `<div class="services-hover-empty">Sem observações em ${escapeHtml(metric.label)}.</div>`

  els.hoverPreview.innerHTML = `
    <div class="services-hover-heading">
      <div><small>OBSERVAÇÕES</small><strong>DIA ${String(dayNumber).padStart(2, '0')}</strong></div>
      <span>${escapeHtml(metric.shortLabel)}</span>
    </div>
    <div class="services-hover-list">${content}</div>`

  state.hoverDay = dayNumber
  state.hoverAnchor = anchor
  els.hoverPreview.classList.add('is-visible')
  els.hoverPreview.setAttribute('aria-hidden', 'false')

  window.requestAnimationFrame(() => {
    if (state.hoverAnchor === anchor && els.hoverPreview?.classList.contains('is-visible')) {
      positionObservationHover(anchor)
    }
  })
}
function positionObservationHover(anchor) {
  if (!els.hoverPreview || !anchor) return

  const anchorRect = anchor.getBoundingClientRect()
  const bubbleRect = els.hoverPreview.getBoundingClientRect()
  const gap = 12
  const margin = 10

  let left =
    anchorRect.left -
    bubbleRect.width -
    gap

  if (left < margin) {
    left =
      anchorRect.right +
      gap
  }

  left = Math.min(
    Math.max(margin, left),
    window.innerWidth -
      bubbleRect.width -
      margin,
  )

  let top =
    anchorRect.top +
    anchorRect.height / 2 -
    bubbleRect.height / 2

  top = Math.min(
    Math.max(margin, top),
    window.innerHeight -
      bubbleRect.height -
      margin,
  )

  els.hoverPreview.style.left =
    `${Math.round(left)}px`

  els.hoverPreview.style.top =
    `${Math.round(top)}px`
}

function hideObservationHover() {
  if (!els.hoverPreview) return

  state.hoverDay = 0
  state.hoverAnchor = null
  els.hoverPreview.classList.remove('is-visible')
  els.hoverPreview.setAttribute('aria-hidden', 'true')
}

function openObservationViewer(dayNumber) {
  if (!els.viewer || !Number.isInteger(dayNumber)) return

  const hiddenDays = draftFor(GLOBAL_KEY).hiddenDays

  if (hiddenDays.has(dayNumber)) {
    showToast(
      `O dia ${String(dayNumber).padStart(2, '0')} está oculto. Desoculte o dia para ver suas observações.`,
    )
    return
  }

  state.viewerDay = Math.min(
    Math.max(dayNumber, 1),
    daysInMonth(state.month),
  )

  renderObservationViewer()

  if (typeof els.viewer.showModal === 'function') {
    els.viewer.showModal()
  } else {
    els.viewer.setAttribute('open', '')
  }
}

function closeObservationViewer() {
  state.viewerDay = 0
  if (!els.viewer) return
  if (typeof els.viewer.close === 'function') els.viewer.close()
  else els.viewer.removeAttribute('open')
}

function changeObservationViewerDay(delta) {
  if (!state.viewerDay) return

  const days = availableObservationDays()
  const currentIndex = days.indexOf(state.viewerDay)

  if (currentIndex < 0) return

  const nextIndex = currentIndex + Number(delta || 0)

  if (
    nextIndex < 0 ||
    nextIndex >= days.length
  ) {
    return
  }

  state.viewerDay = days[nextIndex]
  renderObservationViewer()
}

function renderObservationViewer() {
  if (!els.viewerBody || !state.viewerDay) return

  const availableDays = availableObservationDays()
  if (!availableDays.length) {
    els.viewerBody.innerHTML =
      '<div class="services-empty"><strong>Nenhum dia visível</strong><span>Desoculte pelo menos um dia para consultar observações.</span></div>'
    if (els.viewerDays) els.viewerDays.innerHTML = ''
    if (els.viewerPrev) els.viewerPrev.disabled = true
    if (els.viewerNext) els.viewerNext.disabled = true
    return
  }

  if (!availableDays.includes(state.viewerDay)) state.viewerDay = availableDays[0]

  const dayNumber = state.viewerDay
  const currentIndex = availableDays.indexOf(dayNumber)
  const metric = metricDefinition(state.metric)
  const period = metricPeriod(state.metric)
  const periodLabel = SERVICE_PERIOD_LABELS[period]
  const sheets = buildTeamSheets()

  if (els.viewerTitle) els.viewerTitle.textContent = `DIA ${String(dayNumber).padStart(2, '0')}`
  if (els.viewerPeriod) els.viewerPeriod.textContent = `${metric.label} • ${periodLabel}`
  if (els.viewerPrev) els.viewerPrev.disabled = currentIndex <= 0
  if (els.viewerNext) els.viewerNext.disabled = currentIndex >= availableDays.length - 1
  if (els.viewerEdit) els.viewerEdit.classList.toggle('hidden', !isAdmin())

  if (els.viewerDays) {
    els.viewerDays.innerHTML = availableDays.map((day) => {
      const hasNotes = sheets.some((sheet) => {
        const parts = jrRawObservationPartsV413(
          sheet.days[day - 1],
          draftFor(sheet.key),
          state.metric,
        )
        return Boolean(
          smartObservationSummaryV413(parts.automatic) ||
          String(parts.manual || '').trim() ||
          parts.manualImportant
        )
      })

      return `<button type="button"
        class="${day === dayNumber ? 'is-active' : ''} ${hasNotes ? 'has-notes' : ''}"
        data-viewer-day="${day}"
        title="Abrir observações do dia ${String(day).padStart(2, '0')}">
        ${String(day).padStart(2, '0')}
      </button>`
    }).join('')
  }

  const cards = sheets.map((sheet) => {
    const day = sheet.days[dayNumber - 1]
    const parts = jrRawObservationPartsV413(
      day,
      draftFor(sheet.key),
      state.metric,
    )
    const automaticSummary = smartObservationSummaryV413(parts.automatic)
    const manual = String(parts.manual || '').trim()
    const important = Boolean(automaticSummary) || Boolean(parts.manualImportant)
    const hasText = Boolean(automaticSummary || manual || parts.manualImportant)
    const score = effectiveScore(day, draftFor(sheet.key), state.metric)

    return `<article class="services-viewer-team ${important ? 'is-important' : ''} ${hasText ? '' : 'is-empty'}">
      <header>
        <div>
          <strong>${escapeHtml(displayNameFor(sheet))}</strong>
          <span>${escapeHtml(metric.shortLabel)}: <b>${score}</b></span>
        </div>
        ${important ? '<span class="services-viewer-important-badge">✦ Serviço importante desta planilha</span>' : ''}
      </header>

      <div class="services-viewer-team-content">
        ${automaticSummary
          ? `<div class="services-viewer-service"><small>SERVIÇO • ${escapeHtml(metric.label)}</small><p>${escapeHtml(automaticSummary)}</p></div>`
          : ''}

        ${manual
          ? `<div class="services-viewer-manual"><small>COMUNICADO • ${escapeHtml(metric.label)}</small><p>${escapeHtml(manual)}</p></div>`
          : ''}

        ${parts.manualImportant && !automaticSummary
          ? '<div class="services-viewer-manual-important">✦ Destaque manual como serviço importante</div>'
          : ''}

        ${!automaticSummary && !manual && !parts.manualImportant
          ? `<div class="services-viewer-empty">Sem observações em ${escapeHtml(metric.label)}.</div>`
          : ''}
      </div>
    </article>`
  }).join('')

  els.viewerBody.innerHTML =
    cards ||
    '<div class="services-empty"><strong>Nenhuma equipe encontrada</strong></div>'

  const activeButton = els.viewerDays?.querySelector('[data-viewer-day].is-active')
  activeButton?.scrollIntoView?.({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}
function availableNoteEditorSheets() {
  return buildTeamSheets()
    .filter(
      (sheet) =>
        state.showHiddenColumns ||
        !isMetricHidden(
          draftFor(sheet.key),
          state.metric,
        ),
    )
}

function noteEditorDestinationPeople(allSheets) {
  return allSheets.flatMap(
    (targetSheet) =>
      employeeNamesForSheet(targetSheet).map(
        (employee) => ({
          employee,
          team: displayNameFor(targetSheet),
          key: targetSheet.key,
        }),
      ),
  )
}

function renderNoteEditorRows() {
  if (!els.dialogBody) return

  const renderVersion =
    ++state.noteEditorRenderVersion

  const metric = metricDefinition(state.metric)
  const sheets = availableNoteEditorSheets()
  const allSheets = buildTeamSheets()
  const destinationPeople = noteEditorDestinationPeople(allSheets)
  const usedKeys = new Set(
    state.noteEditorRows
      .map((row) => row.teamKey)
      .filter(Boolean),
  )

  const rowsHtml = state.noteEditorRows.map((row, index) => {
    const selectedSheet = sheets.find((sheet) => sheet.key === row.teamKey) || null

    const options = sheets
      .filter((sheet) => {
        if (sheet.key === row.teamKey) return true
        return !usedKeys.has(sheet.key)
      })
      .map((sheet) => {
        const selected = sheet.key === row.teamKey ? 'selected' : ''
        return `<option value="${escapeHtml(sheet.key)}" ${selected}>${escapeHtml(displayNameFor(sheet))}</option>`
      })
      .join('')

    const teamSelectId =
      `services-note-team-select-${row.id}-v${renderVersion}`

    const selector = `<div class="services-note-team-selector">
      <div class="services-note-team-selector-main">
        <label class="picker-field services-note-team-picker">
          <span>Equipe</span>

          <div class="custom-select-control services-note-team-custom-select services-note-dynamic-custom-select"
            data-note-dynamic-select="${renderVersion}"
            data-select-for="${teamSelectId}">
            <button class="custom-select-trigger"
              type="button"
              aria-label="Selecionar equipe"
              aria-haspopup="listbox"
              aria-expanded="false">
              <span class="custom-select-value">${
                selectedSheet
                  ? escapeHtml(displayNameFor(selectedSheet))
                  : 'Selecionar equipe'
              }</span>
              <span class="custom-select-arrow"
                data-icon="chevron-down"></span>
            </button>

            <select id="${teamSelectId}"
              class="native-control-hidden"
              tabindex="-1"
              aria-hidden="true"
              data-note-team-select="${row.id}">
              <option value="">Selecionar equipe</option>
              ${options}
            </select>

            <div class="custom-select-menu"
              role="listbox"></div>
          </div>
        </label>
        ${
          state.noteEditorRows.length > 1
            ? `<button type="button" class="services-note-row-remove" data-note-remove-row="${row.id}" aria-label="Remover equipe">×</button>`
            : ''
        }
      </div>
    </div>`

    if (!selectedSheet) {
      return `<section class="services-note-editor-row" data-note-row="${row.id}">
        ${selector}
        <div class="services-note-team-empty">
          Selecione a equipe para preencher a observação.
        </div>
      </section>`
    }

    const day = selectedSheet.days[state.dialogDay - 1]
    const draft = draftFor(selectedSheet.key)
    const dayKey = String(state.dialogDay)

    const automatic = String(
      day.autoObservationByMetric?.[state.metric] || '',
    ).trim()

    const manual = String(
      draft.manualNotesByMetric?.[state.metric]?.[dayKey] || '',
    ).trim()

    const suppressed = Boolean(
      draft.suppressedNotesByMetric?.[state.metric]?.has(state.dialogDay),
    )

    const ownEmployees = employeeNamesForSheet(selectedSheet)
    const ownOptions = ownEmployees.length
      ? ownEmployees
          .map(
            (name) =>
              `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`,
          )
          .join('')
      : `<option value="${escapeHtml(displayNameFor(selectedSheet))}">${escapeHtml(displayNameFor(selectedSheet))}</option>`

    const destinationOptions = destinationPeople
      .filter((item) => item.key !== selectedSheet.key)
      .map(
        (item) =>
          `<option value="${escapeHtml(item.employee)}" data-destination-team="${escapeHtml(item.team)}">${escapeHtml(item.employee)} — ${escapeHtml(item.team)}</option>`,
      )
      .join('')

    return `<section class="services-note-editor-row" data-note-row="${row.id}">
      ${selector}

      <section class="services-note-editor services-note-editor-selected" data-note-team="${escapeHtml(selectedSheet.key)}">
        <div class="services-note-editor-heading">
          <div>
            <strong>${escapeHtml(displayNameFor(selectedSheet))}</strong>
            <span class="services-period-chip">${escapeHtml(metric.label)}</span>
          </div>

          ${
            automatic
              ? `<small class="services-auto-preview"><b>Automática desta planilha:</b> ${escapeHtml(automatic)}</small>`
              : `<small>Automática: nenhum serviço importante em ${escapeHtml(metric.label)} neste dia.</small>`
          }
        </div>

        <div class="services-person-move-card">
          <div class="services-person-move-title">
            <strong>Comunicado de funcionário</strong>
            <span>Este comunicado ficará somente em ${escapeHtml(metric.label)}.</span>
          </div>

          <div class="services-person-move-grid">
            <label class="picker-field services-note-person-picker">
              <span>Funcionário desta equipe</span>
              <div class="custom-select-control services-note-dynamic-custom-select"
                data-select-for="services-note-own-${row.id}-v${renderVersion}">
                <button class="custom-select-trigger" type="button" aria-label="Selecionar funcionário" aria-haspopup="listbox" aria-expanded="false">
                  <span class="custom-select-value">Selecionar funcionário</span>
                  <span class="custom-select-arrow" data-icon="chevron-down"></span>
                </button>
                <select id="services-note-own-${row.id}-v${renderVersion}" class="native-control-hidden" tabindex="-1" aria-hidden="true" data-note-own-employee>
                  <option value="">Selecionar funcionário</option>
                  ${ownOptions}
                </select>
                <div class="custom-select-menu" role="listbox"></div>
              </div>
            </label>

            <label class="picker-field services-note-person-picker">
              <span>Foi trabalhar com</span>
              <div class="custom-select-control services-note-dynamic-custom-select"
                data-select-for="services-note-destination-${row.id}-v${renderVersion}">
                <button class="custom-select-trigger" type="button" aria-label="Selecionar funcionário ou equipe" aria-haspopup="listbox" aria-expanded="false">
                  <span class="custom-select-value">Selecionar funcionário / equipe</span>
                  <span class="custom-select-arrow" data-icon="chevron-down"></span>
                </button>
                <select id="services-note-destination-${row.id}-v${renderVersion}" class="native-control-hidden" tabindex="-1" aria-hidden="true" data-note-destination-employee>
                  <option value="">Selecionar funcionário / equipe</option>
                  ${destinationOptions}
                </select>
                <div class="custom-select-menu" role="listbox"></div>
              </div>
            </label>
          </div>

          <div class="services-person-move-actions">
            <button type="button" data-note-add-transfer>Registrar em outra equipe</button>
            <button type="button" data-note-add-support>Apoio a outra equipe</button>
            <button type="button" data-note-add-absence>Registrar ausente</button>
          </div>
        </div>

        <label class="services-note-field">
          <span>Rascunho / comunicado • ${escapeHtml(metric.label)}</span>
          <textarea maxlength="1600" data-note-text placeholder="Escreva a observação desta equipe.">${escapeHtml(manual)}</textarea>
        </label>

        <label class="services-note-important-toggle">
          <input type="checkbox"
            data-note-important
            ${
              draft.manualImportantByMetric?.[state.metric]?.has(
                state.dialogDay,
              )
                ? 'checked'
                : ''
            } />
          <span>
            <b>Destacar como serviço importante</b>
            <small>Destaca a célula e o card de Observação desta equipe/dia.</small>
          </span>
        </label>

        <label class="services-note-suppress">
          <input type="checkbox" data-note-suppress ${suppressed ? 'checked' : ''} />
          <span>Ocultar o serviço automático somente em ${escapeHtml(metric.label)} neste dia</span>
        </label>
      </section>
    </section>`
  }).join('')

  const canAddMore = usedKeys.size < sheets.length

  els.dialogBody.innerHTML = `
    <div class="services-note-editor-rows">
      ${rowsHtml}
    </div>

    ${
      canAddMore
        ? `<button type="button" class="services-note-add-row" data-note-add-row>
            <span>+</span>
            <strong>Adicionar outra equipe</strong>
          </button>`
        : ''
    }`

  initializeUiControls()

  state.noteEditorRows.forEach((row) => {
    const selectId =
      `services-note-team-select-${row.id}-v${renderVersion}`

    refreshCustomSelect(selectId)

    if (row.teamKey) {
      setUiControlValue(
        selectId,
        row.teamKey,
      )
    }

    refreshCustomSelect(
      `services-note-own-${row.id}-v${renderVersion}`,
    )
    refreshCustomSelect(
      `services-note-destination-${row.id}-v${renderVersion}`,
    )
  })

  hydrateIcons(els.dialogBody)
}

function openNotesDialog(dayNumber) {
  if (!isAdmin() || !els.dialog || !els.dialogBody) return

  if (draftFor(GLOBAL_KEY).hiddenDays.has(dayNumber)) {
    showToast(
      `O dia ${String(dayNumber).padStart(2, '0')} está oculto. Desoculte o dia antes de editar suas observações.`,
    )
    return
  }

  state.dialogDay = dayNumber
  state.noteDialogDirty = false
  state.noteEditorRows = []
  state.noteEditorNextId = 1

  const sheets = availableNoteEditorSheets()

  if (state.selectedTeam !== 'all' && sheets.some((sheet) => sheet.key === state.selectedTeam)) {
    state.noteEditorRows.push({
      id: state.noteEditorNextId++,
      teamKey: state.selectedTeam,
    })
  } else {
    state.noteEditorRows.push({
      id: state.noteEditorNextId++,
      teamKey: '',
    })
  }

  const metric = metricDefinition(state.metric)
  els.dialogTitle.textContent =
    `Dia ${String(dayNumber).padStart(2, '0')} • ${metric.label}`

  renderNoteEditorRows()

  if (typeof els.dialog.showModal === 'function') {
    els.dialog.showModal()
  } else {
    els.dialog.setAttribute('open', '')
  }
}

function applyNotesDialog() {
  if (!isAdmin() || !state.dialogDay) {
    return false
  }

  const sections = [
    ...(els.dialogBody?.querySelectorAll('[data-note-team]') || []),
  ]

  if (!sections.length) {
    showToast('Selecione pelo menos uma equipe para editar.')
    return false
  }

  let changed = false

  sections.forEach((section) => {
    const teamKey = String(section.dataset.noteTeam || '')
    if (!teamKey) return

    const draft = draftFor(teamKey)
    const dayKey = String(state.dialogDay)
    const text = String(
      section.querySelector('[data-note-text]')?.value || '',
    ).trim().slice(0, 1600)

    const suppress = Boolean(
      section.querySelector('[data-note-suppress]')?.checked,
    )

    if (!draft.manualNotesByMetric[state.metric]) {
      draft.manualNotesByMetric[state.metric] = {}
    }

    if (!draft.suppressedNotesByMetric[state.metric]) {
      draft.suppressedNotesByMetric[state.metric] = new Set()
    }

    const beforeText = String(
      draft.manualNotesByMetric[state.metric][dayKey] || '',
    )

    const beforeSuppress =
      draft.suppressedNotesByMetric[state.metric].has(state.dialogDay)

    if (!draft.manualImportantByMetric[state.metric]) {
      draft.manualImportantByMetric[state.metric] =
        new Set()
    }

    const important = Boolean(
      section.querySelector(
        '[data-note-important]',
      )?.checked,
    )

    const beforeImportant =
      draft.manualImportantByMetric[
        state.metric
      ].has(state.dialogDay)

    if (text) {
      draft.manualNotesByMetric[state.metric][dayKey] = text
    } else {
      delete draft.manualNotesByMetric[state.metric][dayKey]
    }

    if (suppress) {
      draft.suppressedNotesByMetric[state.metric].add(state.dialogDay)
    } else {
      draft.suppressedNotesByMetric[state.metric].delete(state.dialogDay)
    }

    if (important) {
      draft.manualImportantByMetric[state.metric].add(
        state.dialogDay,
      )
    } else {
      draft.manualImportantByMetric[state.metric].delete(
        state.dialogDay,
      )
    }

    if (
      beforeText !== text ||
      beforeSuppress !== suppress ||
      beforeImportant !== important
    ) {
      markDirty(teamKey)
      changed = true
    }
  })

  state.noteDialogDirty = false

  closeNotesDialog()
  renderBoard()

  if (changed) {
    showToast(
      'Observações aplicadas ao rascunho.',
    )
  }

  updateSaveState()
  return true
}

function closeNotesDialog() {
  state.dialogDay = 0
  state.noteDialogDirty = false

  if (!els.dialog) {
    updateSaveState()
    return
  }

  if (
    typeof els.dialog.close ===
    'function'
  ) {
    els.dialog.close()
  } else {
    els.dialog.removeAttribute('open')
  }

  updateSaveState()
}

function draftFor(teamKey) {
  if (state.drafts.has(teamKey)) {
    return state.drafts.get(teamKey)
  }

  const setting =
    state.settings.get(teamKey) ||
    normalizeReportSetting({})

  const manualNotesByMetric = {}
  const suppressedNotesByMetric = {}

  SERVICE_METRIC_KEYS.forEach((metric) => {
    manualNotesByMetric[metric] = {
      ...(setting.manualNotesByMetric?.[metric] || {}),
    }

    suppressedNotesByMetric[metric] =
      new Set(
        setting.suppressedNotesByMetric?.[metric] || [],
      )
  })

  const draft = {
    displayName: setting.displayName,
    displayNamesByMetric: { ...(setting.displayNamesByMetric || {}) },
    hiddenDays: new Set(setting.hiddenDays),
    manualNotesByMetric,
    suppressedNotesByMetric,
    scoreOverrides: JSON.parse(
      JSON.stringify(setting.scoreOverrides || {}),
    ),
    hiddenMetrics: new Set(
      setting.hiddenMetrics || [],
    ),
    hiddenObservationMetrics: new Set(
      setting.hiddenObservationMetrics || [],
    ),
    manualImportantByMetric: Object.fromEntries(
      SERVICE_METRIC_KEYS.map(
        (metric) => [
          metric,
          new Set(
            setting.manualImportantByMetric?.[metric] || [],
          ),
        ],
      ),
    ),
    importedScoresByMetric:
      mergeRebuiltImportedScoresV28(
        setting.importedScoresByMetric || {},
        rebuildImportedScoresByMetricV28(
          setting.importedRows || [],
        ),
      ),
    importedNotesByMetric:
      mergeRebuiltImportedNotesV28(
        setting.importedNotesByMetric || {},
        rebuildImportedNotesByMetricV28(
          setting.importedRows || [],
        ),
      ),
    importedRows: JSON.parse(
      JSON.stringify(
        setting.importedRows || [],
      ),
    ),
    matrixCacheV21: setting.matrixCacheV21
      ? JSON.parse(JSON.stringify(setting.matrixCacheV21))
      : null,
    dirty: false,
  }

  state.drafts.set(teamKey, draft)
  return draft
}

/* JR_GESTAO_V38_ALIAS_ISOLADO_POR_METRICA */
function displayNameFor(sheet, metricKey = state.metric) {
  /* JR_GESTAO_V38_NOME_POR_PLANILHA: nome editado vale somente na planilha/metrica atual. */
  const draft = draftFor(sheet.key)
  const metric = SERVICE_METRIC_KEYS.includes(metricKey) ? metricKey : state.metric
  return (
    String(draft.displayNamesByMetric?.[metric] || '').trim() ||
    draft.displayName.trim() ||
    sheet.originalName
  )
}

function allDisplayNamesForSheetV38(sheet) {
  return [...new Set(
    SERVICE_METRIC_KEYS
      .map((metric) => displayNameFor(sheet, metric))
      .map((name) => String(name || '').trim())
      .filter(Boolean),
  )]
}

function importTeamLabelV38(sheet) {
  if (!state.importMeta || !(state.importEntries || []).length) {
    return displayNameFor(sheet, state.metric)
  }
  const aggregate = currentImportAggregate()
  const present = [
    ['dayPoints', Number(aggregate.totals.dayPoints || 0), 'Pontos M/T'],
    ['daySurveys', Number(aggregate.totals.daySurveys || 0), 'Lev. M/T'],
    ['nightPoints', Number(aggregate.totals.nightPoints || 0), 'Pontos Noite'],
    ['nightSurveys', Number(aggregate.totals.nightSurveys || 0), 'Lev. Noite'],
  ].filter((item) => item[1] > 0)
  if (!present.length) return displayNameFor(sheet, state.metric)
  const names = [...new Set(present.map(([metric]) => displayNameFor(sheet, metric)))]
  if (names.length === 1) return names[0]
  return present
    .map(([metric, _count, label]) => `${displayNameFor(sheet, metric)} (${label})`)
    .join(' / ')
}

function markDirty(teamKey) {
  draftFor(teamKey).dirty = true
  updateSaveState()
}

function updateSaveState() {
  if (!els.saveState) return

  const dirtyCount = [
    ...state.drafts.values(),
  ].filter((draft) => draft.dirty).length

  if (!isAdmin()) {
    els.saveState.classList.remove('hidden')
    els.saveState.textContent =
      'Modo somente leitura.'

    els.dirtyActions?.classList.add(
      'hidden',
    )
    els.dirtyActions?.classList.remove(
      'is-visible',
    )
    return
  }

  const hasDirty =
    dirtyCount > 0 ||
    state.noteDialogDirty

  els.dirtyActions?.classList.toggle(
    'hidden',
    !hasDirty,
  )

  els.dirtyActions?.classList.toggle(
    'is-visible',
    hasDirty,
  )

  els.saveState.classList.toggle(
    'hidden',
    hasDirty,
  )

  els.saveState.textContent =
    hasDirty
      ? ''
      : 'Tudo salvo.'
}



/* JR_GESTAO_V40_VISIBILIDADE_AUTOSAVE */
function updateVisibilityButtonsV40(globalDraft = draftFor(GLOBAL_KEY)) {
  if (els.hideEmpty) {
    const hasHiddenDays = globalDraft.hiddenDays.size > 0
    const label = els.hideEmpty.querySelector('.button-label') || els.hideEmpty
    label.textContent = hasHiddenDays ? 'Mostrar todos os dias' : 'Ocultar dias vazios'
    els.hideEmpty.setAttribute('aria-pressed', hasHiddenDays ? 'true' : 'false')
    els.hideEmpty.title = hasHiddenDays
      ? 'Mostrar novamente todos os dias deste mes'
      : 'Ocultar automaticamente os dias sem pontos e sem observacoes'
  }
}

function scheduleVisibilityAutoSaveV40() {
  if (!isAdmin()) return
  window.clearTimeout(state.visibilityAutoSaveTimerV40)
  state.visibilityAutoSaveQueuedV40 = true
  if (els.saveState) els.saveState.textContent = 'Salvando preferencia automaticamente...'
  state.visibilityAutoSaveTimerV40 = window.setTimeout(() => {
    void flushVisibilityAutoSaveV40()
  }, 360)
}

async function flushVisibilityAutoSaveV40() {
  if (state.visibilityAutoSaveBusyV40) {
    state.visibilityAutoSaveQueuedV40 = true
    return
  }
  if (!hasUnsavedChanges()) {
    state.visibilityAutoSaveQueuedV40 = false
    updateSaveState()
    return
  }
  state.visibilityAutoSaveBusyV40 = true
  state.visibilityAutoSaveQueuedV40 = false
  try {
    await saveAllChanges()
  } finally {
    state.visibilityAutoSaveBusyV40 = false
    if (state.visibilityAutoSaveQueuedV40 && hasUnsavedChanges()) {
      scheduleVisibilityAutoSaveV40()
    }
  }
}

function toggleEmptyRowsVisibilityV40() {
  if (!isAdmin()) return
  const globalDraft = draftFor(GLOBAL_KEY)
  if (globalDraft.hiddenDays.size > 0) showAllRows(true)
  else hideEmptyRows(true)
}

function queueObservationHoverV40(dayNumber, anchor) {
  window.clearTimeout(state.hoverRetryTimerV40)
  const quietUntil = Number(state.scrollQuietUntilV39 || 0)
  const wait = Math.max(0, quietUntil - performance.now())
  const show = () => {
    state.hoverRetryTimerV40 = 0
    if (!anchor?.isConnected) return
    // Se o navegador suportar :hover, garante que o mouse continua no olhinho.
    try { if (!anchor.matches(':hover')) return } catch (_error) {}
    showObservationHover(dayNumber, anchor)
  }
  if (wait > 0) {
    state.hoverRetryTimerV40 = window.setTimeout(show, wait + 28)
  } else {
    show()
  }
}

function toggleHiddenDay(day) {
  if (!isAdmin()) return
  const draft = draftFor(GLOBAL_KEY)
  if (draft.hiddenDays.has(day)) draft.hiddenDays.delete(day)
  else draft.hiddenDays.add(day)
  markDirty(GLOBAL_KEY)
  renderBoard()
  scheduleVisibilityAutoSaveV40()
}

function hideEmptyRows(autoSaveV40 = false) {
  if (!isAdmin()) return
  const allSheets = buildTeamSheets()
  const candidateSheets = allSheets.filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
  const sheets = candidateSheets.filter((sheet) => !isMetricHidden(draftFor(sheet.key), state.metric))
  const globalDraft = draftFor(GLOBAL_KEY)
  const totalDays = daysInMonth(state.month)

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    const hasValue = sheets.some(
      (sheet) => effectiveScore(sheet.days[dayNumber - 1], draftFor(sheet.key), state.metric) !== 0,
    )
    const hasObservation = observationItemsForDay(sheets, dayNumber, state.metric).length > 0
    if (!hasValue && !hasObservation) globalDraft.hiddenDays.add(dayNumber)
  }

  markDirty(GLOBAL_KEY)
  renderBoard()
  if (autoSaveV40) scheduleVisibilityAutoSaveV40()
}

function showAllRows(autoSaveV40 = false) {
  if (!isAdmin()) return
  draftFor(GLOBAL_KEY).hiddenDays.clear()
  markDirty(GLOBAL_KEY)
  renderBoard()
  if (autoSaveV40) scheduleVisibilityAutoSaveV40()
}

function toggleHiddenColumn(teamKey) {
  if (!isAdmin() || !teamKey) return
  const draft = draftFor(teamKey)
  if (draft.hiddenMetrics.has(state.metric)) draft.hiddenMetrics.delete(state.metric)
  else draft.hiddenMetrics.add(state.metric)
  markDirty(teamKey)
  renderTeamFilter()
  renderBoard()
  scheduleVisibilityAutoSaveV40()
}

function showAllColumnsForCurrentMetric() {
  if (!isAdmin()) return
  let changed = false

  buildTeamSheets().forEach((sheet) => {
    const draft = draftFor(sheet.key)
    if (draft.hiddenMetrics.delete(state.metric)) {
      draft.dirty = true
      changed = true
    }
  })

  if (changed) {
    updateSaveState()
    renderTeamFilter()
    renderBoard()
    scheduleVisibilityAutoSaveV40()
  } else {
    showToast('Nenhuma equipe está oculta nesta planilha.')
  }
}

async function saveAllChanges() {
  if (!isAdmin()) {
    showToast(
      'Somente administradores podem alterar esta área.',
      true,
    )
    return false
  }

  const dirtyEntries = [
    ...state.drafts.entries(),
  ].filter(([_key, draft]) => draft.dirty)

  if (!dirtyEntries.length) {
    showToast('Não há alterações para salvar.')
    return true
  }

  setButtonLoading(
    els.save,
    true,
    'Salvando...',
  )
  clearError()

  try {
    const { data } =
      await supabase.auth.getSession()

    const userId =
      data.session?.user?.id

    if (!userId) {
      throw new Error(
        'Sua sessão expirou. Entre novamente.',
      )
    }

    const payloads = dirtyEntries.map(
      ([teamKey, draft]) => ({
        month_key: state.month,
        team_key: teamKey,
        display_name:
          teamKey === GLOBAL_KEY
            ? 'Matriz mensal'
            : draft.displayName.trim(),
        hidden_days:
          teamKey === GLOBAL_KEY
            ? [...draft.hiddenDays].sort(
                (a, b) => a - b,
              )
            : [],
        manual_notes:
          serializeReportSetting(draft),
        updated_by: userId,
      }),
    )

    const {
      data: saved,
      error,
    } = await supabase
      .from('service_report_settings')
      .upsert(
        payloads,
        {
          onConflict: 'month_key,team_key',
        },
      )
      .select(
        'month_key, team_key, display_name, hidden_days, manual_notes, updated_at',
      )

    if (error) throw error

    ;(saved || []).forEach((item) => {
      state.settings.set(
        String(item.team_key),
        normalizeReportSetting(item),
      )
    })

    dirtyEntries.forEach(([teamKey]) => {
      state.drafts.delete(teamKey)
    })

    state.settingsLoadedAtV22 =
      Date.now()
    state.teamFilterSignatureV22 = ''

    renderTeamFilter()
    renderBoard()
    showToast(
      'Alterações salvas no Supabase.',
    )

    document.dispatchEvent(
      new CustomEvent(
        'jr:services-settings-updated',
        {
          detail: {
            month: state.month,
            updatedAt: Date.now(),
          },
        },
      ),
    )

    return true
  } catch (error) {
    setError(friendlyError(error))
    showToast(
      friendlyError(error),
      true,
    )
    return false
  } finally {
    setButtonLoading(
      els.save,
      false,
      'Salvar alterações',
    )
    updateSaveState()
  }
}


function openDirectActionConfirm(action) {
  if (
    !els.actionConfirm ||
    !['save', 'discard'].includes(action)
  ) {
    return
  }

  state.pendingDirectAction = action

  const saving =
    action === 'save'

  if (els.actionConfirmTitle) {
    els.actionConfirmTitle.textContent =
      saving
        ? 'Salvar alterações?'
        : 'Descartar alterações?'
  }

  if (els.actionConfirmText) {
    els.actionConfirmText.textContent =
      saving
        ? 'Confirma salvar todas as alterações pendentes?'
        : 'Confirma descartar todas as alterações pendentes? Esta ação não poderá ser desfeita.'
  }

  els.actionConfirmYes?.classList.toggle(
    'is-danger',
    !saving,
  )

  if (
    typeof els.actionConfirm.showModal ===
    'function'
  ) {
    if (!els.actionConfirm.open) {
      els.actionConfirm.showModal()
    }
  } else {
    els.actionConfirm.setAttribute(
      'open',
      '',
    )
  }
}

function closeDirectActionConfirm() {
  state.pendingDirectAction = ''

  if (!els.actionConfirm) return

  if (
    typeof els.actionConfirm.close ===
    'function'
  ) {
    if (els.actionConfirm.open) {
      els.actionConfirm.close()
    }
  } else {
    els.actionConfirm.removeAttribute(
      'open',
    )
  }
}

function hasUnsavedChanges() {
  return (
    state.noteDialogDirty ||
    [...state.drafts.values()].some(
      (draft) => draft.dirty,
    )
  )
}

function performRefresh() {
  state.settingsMonth = ''
  requestMonthFromMain(
    normalizeMonth(els.month?.value) ||
      currentMonthValue(),
    true,
  )
}

function toggleObservationColumnForCurrentMetric() {
  if (!isAdmin()) return

  const draft = draftFor(GLOBAL_KEY)

  if (
    draft.hiddenObservationMetrics.has(
      state.metric,
    )
  ) {
    draft.hiddenObservationMetrics.delete(
      state.metric,
    )
  } else {
    draft.hiddenObservationMetrics.add(
      state.metric,
    )
  }

  markDirty(GLOBAL_KEY)
  renderBoard()
  scheduleVisibilityAutoSaveV40()
}

function discardAllDraftChanges() {
  state.drafts.clear()
  renderTeamFilter()
  renderBoard()
  updateSaveState()
  showToast(
    'Alterações pendentes descartadas.',
  )
}

function interceptUnsavedNavigation(event) {
  if (
    state.allowNavigationOnce ||
    !isServicesPageVisible() ||
    !hasUnsavedChanges()
  ) {
    return
  }

  const clickable = event.target.closest(
    'button, a, [role="button"]',
  )

  if (!clickable) return

  const targetPage =
    clickable.dataset?.page

  const text =
    String(clickable.textContent || '')
      .trim()
      .toLowerCase()

  const isDifferentPage =
    targetPage &&
    targetPage !== 'services'

  const isLogout =
    text === 'sair' ||
    clickable.dataset?.action === 'logout' ||
    clickable.id === 'logout-button' ||
    clickable.classList?.contains(
      'logout-button',
    )

  if (!isDifferentPage && !isLogout) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation?.()

  openUnsavedDialog({
    type: 'click',
    target: clickable,
  })
}

function openUnsavedDialog(action) {
  if (!els.unsavedDialog) return

  state.pendingNavigation = action

  if (
    typeof els.unsavedDialog.showModal ===
    'function'
  ) {
    if (!els.unsavedDialog.open) {
      els.unsavedDialog.showModal()
    }
  } else {
    els.unsavedDialog.setAttribute(
      'open',
      '',
    )
  }
}

function closeUnsavedDialog() {
  state.pendingNavigation = null

  if (!els.unsavedDialog) return

  if (
    typeof els.unsavedDialog.close ===
    'function'
  ) {
    if (els.unsavedDialog.open) {
      els.unsavedDialog.close()
    }
  } else {
    els.unsavedDialog.removeAttribute(
      'open',
    )
  }
}

function continuePendingNavigation(action) {
  if (!action) return

  if (action.type === 'month') {
    requestMonthFromMain(action.value)
    return
  }

  if (action.type === 'refresh') {
    performRefresh()
    return
  }

  if (
    action.type === 'click' &&
    action.target
  ) {
    state.allowNavigationOnce = true

    try {
      action.target.click()
    } finally {
      window.setTimeout(() => {
        state.allowNavigationOnce = false
      }, 0)
    }
  }
}


const EXCELJS_IMPORT_URL =
  new URL(
    './vendor/exceljs-4.4.0.min.js',
    import.meta.url,
  ).href

let excelImportPromise

async function ensureExcelJsForImport() {
  if (window.ExcelJS) return window.ExcelJS
  if (excelImportPromise) return excelImportPromise

  excelImportPromise = new Promise(
    (resolve, reject) => {
      const existing =
        document.querySelector(
          'script[data-services-exceljs-v20]',
        )

      const finish = () => {
        if (window.ExcelJS) {
          resolve(window.ExcelJS)
        } else {
          reject(
            new Error(
              'A biblioteca de planilhas não iniciou.',
            ),
          )
        }
      }

      if (existing) {
        existing.addEventListener(
          'load',
          finish,
          { once: true },
        )
        window.setTimeout(finish, 0)
        return
      }

      const script =
        document.createElement('script')

      script.src = EXCELJS_IMPORT_URL
      script.async = true
      script.dataset.servicesExceljsV20 = '1'
      script.onload = finish
      script.onerror = () =>
        reject(
          new Error(
            'Não foi possível carregar o leitor de planilhas.',
          ),
        )

      document.head.appendChild(script)
    },
  )

  try {
    return await excelImportPromise
  } catch (error) {
    excelImportPromise = null
    throw error
  }
}

function activeImportSheets() {
  return buildTeamSheets()
}

function fillImportTeamSelect() {
  if (!els.importTeam) return

  const sheets = buildTeamSheets()
  els.importTeam.innerHTML =
    '<option value="">Selecionar equipe</option>' +
    sheets
      .map(
        (sheet) =>
          `<option value="${escapeHtml(sheet.key)}">${escapeHtml(importTeamLabelV38(sheet))}</option>`,
      )
      .join('')
}

function resetImportState() {
  state.importWorkbook = null
  state.importEntries = []
  state.importMeta = null

  if (els.importFile) {
    els.importFile.value = ''
  }

  if (els.importFileName) {
    els.importFileName.textContent =
      'Nenhuma planilha selecionada'
  }

  if (els.importSummary) {
    els.importSummary.innerHTML = ''
    els.importSummary.classList.add(
      'hidden',
    )
  }

  if (els.importStatus) {
    els.importStatus.textContent =
      'Selecione uma planilha em códigos ou relatório normal.'
    els.importStatus.classList.remove(
      'is-error',
      'is-ready',
    )
  }

  if (els.importApply) {
    els.importApply.disabled = true
  }
}

function openImportDialog() {
  if (!isAdmin() || !els.importDialog) {
    return
  }

  resetImportState()
  fillImportTeamSelect()
  if (els.importTeam) els.importTeam.value = ''
  if (els.importDate) els.importDate.value = ''

  if (
    typeof els.importDialog.showModal ===
    'function'
  ) {
    els.importDialog.showModal()
  } else {
    els.importDialog.setAttribute(
      'open',
      '',
    )
  }
}

function closeImportDialog() {
  if (!els.importDialog) return

  if (
    typeof els.importDialog.close ===
    'function'
  ) {
    if (els.importDialog.open) {
      els.importDialog.close()
    }
  } else {
    els.importDialog.removeAttribute(
      'open',
    )
  }
}

function importCellValue(cell) {
  const value = cell?.value
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) return value

  if (
    typeof value === 'object' &&
    value !== null
  ) {
    if ('text' in value) {
      return String(value.text || '')
    }
    if ('result' in value) {
      return value.result ?? ''
    }
    if (Array.isArray(value.richText)) {
      return value.richText
        .map((item) => item?.text || '')
        .join('')
    }
  }

  return value
}

function normalizedHeaderMap(sheet, rowNumber) {
  const result = new Map()
  const row = sheet.getRow(rowNumber)

  row.eachCell(
    { includeEmpty: false },
    (cell, column) => {
      const key = normalizeImportText(
        importCellValue(cell),
      ).replaceAll(' ', '_')

      if (key) result.set(key, column)
    },
  )

  return result
}

function findHeaderColumn(map, names) {
  for (const name of names) {
    const normalized =
      normalizeImportText(name)
        .replaceAll(' ', '_')
    if (map.has(normalized)) {
      return map.get(normalized)
    }
  }
  return 0
}


function findObservationColumnV25(
  headers,
  fallback = 0,
) {
  const exact =
    findHeaderColumn(
      headers,
      [
        'observacao',
        'observação',
        'observacoes',
        'observações',
        'observacao do servico',
        'observação do serviço',
        'observacoes do servico',
        'observações do serviço',
        'obs',
      ],
    )

  if (exact) return exact

  for (
    const [key, column]
    of headers
  ) {
    const normalized =
      String(key || '')
        .replaceAll('_', ' ')

    if (
      normalized.includes(
        'observ',
      ) ||
      normalized === 'obs'
    ) {
      return column
    }
  }

  return fallback
}

function importedImportantForRecordV25(
  entry,
  record,
) {
  const rawLines =
    importedImportantLinesV28(
      entry,
    )

  if (rawLines.length) {
    return rawLines
  }

  /*
    Fallback para serviço identificado por código/produto,
    mesmo se a observação estiver vazia.
  */
  return detectImportantServicesExpandedV28(
    record,
  )
}

function importProductsFromCodes(row, headers) {
  const products = []

  for (let index = 1; index <= 10; index += 1) {
    const productColumn = findHeaderColumn(
      headers,
      [`produto${index}`, `produto ${index}`],
    )
    const quantityColumn = findHeaderColumn(
      headers,
      [`qtd${index}`, `qtd ${index}`, `quantidade${index}`],
    )

    if (!productColumn) continue

    const code = String(importCellValue(row.getCell(productColumn)) || '').trim()
    const quantity = quantityColumn
      ? String(importCellValue(row.getCell(quantityColumn)) ?? '').trim()
      : ''

    if (!code && !quantity) continue

    products.push({
      product: { code, name: '' },
      quantity,
    })
  }

  return products
}

function importProductsFromNormal(row) {
  const products = []

  for (let column = 8; column <= 27; column += 2) {
    const name = String(importCellValue(row.getCell(column)) || '').trim()
    const quantity = String(importCellValue(row.getCell(column + 1)) ?? '').trim()
    if (!name && !quantity) continue
    products.push({
      product: { code: '', name },
      quantity,
    })
  }

  return products
}

function dateFromTimeText(value) {
  return parseImportDate(
    String(value || ''),
  )
}

function singleDateFromHeader(value) {
  const raw = String(value || '')
  const matches = [
    ...raw.matchAll(
      /(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4})/g,
    ),
  ]
    .map((item) => parseImportDate(item[1]))
    .filter(Boolean)

  return new Set(matches).size === 1
    ? matches[0]
    : ''
}

function detectTeamHint(workbook, fileName) {
  const candidates = []

  for (const sheet of workbook.worksheets) {
    for (const address of ['F1', 'H1', 'C1']) {
      const text = String(
        importCellValue(
          sheet.getCell(address),
        ) || '',
      ).trim()

      const match = text.match(
        /equipe\s*:\s*(.+)$/i,
      )
      if (match?.[1]) {
        candidates.push(match[1].trim())
      }
    }
  }

  const filenameText =
    String(fileName || '')
      .replace(/\.xlsx?$/i, '')
      .replace(/planilha\s+(?:cod|normal)\s*/i, '')

  if (filenameText) candidates.push(filenameText)

  const sheets = activeImportSheets()

  for (const hint of candidates) {
    const normalized = normalizeImportText(hint)

    const exact = sheets.find((sheet) =>
      allDisplayNamesForSheetV38(sheet).some((name) => normalizeImportText(name) === normalized)
    )

    if (exact) return exact.key

    const contained = sheets.find((sheet) =>
      allDisplayNamesForSheetV38(sheet).some((name) => {
        const team = normalizeImportText(name)
        return normalized.includes(team) || team.includes(normalized)
      })
    )

    if (contained) return contained.key
  }

  return ''
}

async function parseCodesWorkbook(workbook) {
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('A planilha em códigos não possui uma aba válida.')

  const headers = normalizedHeaderMap(sheet, 1)
  const dateColumn = findHeaderColumn(headers, ['data'])
  const serviceColumn = findHeaderColumn(headers, ['tipo_servico', 'tipo serviço'])
  const streetColumn = findHeaderColumn(headers, ['logradouro', 'rua'])
  const numberColumn = findHeaderColumn(headers, ['numero', 'número'])
  const neighborhoodColumn = findHeaderColumn(headers, ['bairro'])
  const orderColumn = findHeaderColumn(headers, ['ordem_servico', 'ordem de servico', 'ordem de serviço'])
  const timeColumn = findHeaderColumn(headers, ['horario', 'horário', 'horas'])
  const observationColumn =
    findObservationColumnV25(
      headers,
      28,
    )

  if (!dateColumn || !serviceColumn || !timeColumn) {
    throw new Error('A planilha não corresponde ao formato em códigos do JR Gestão.')
  }

  const entries = []
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const date = importCellValue(row.getCell(dateColumn))
    const service = String(importCellValue(row.getCell(serviceColumn)) || '').trim()
    const time = String(importCellValue(row.getCell(timeColumn)) || '').trim()
    if (!date && !service && !time) continue

    const street = streetColumn ? String(importCellValue(row.getCell(streetColumn)) || '').trim() : ''
    const number = numberColumn ? String(importCellValue(row.getCell(numberColumn)) ?? '').trim() : ''
    const neighborhood = neighborhoodColumn ? String(importCellValue(row.getCell(neighborhoodColumn)) || '').trim() : ''
    const orderNumber = orderColumn ? String(importCellValue(row.getCell(orderColumn)) || '').trim() : ''
    const observation = String(importCellValue(row.getCell(observationColumn)) || '').trim()
    const kind = service === '162' || normalizeImportText(service).includes('levantamento') ? 'survey' : 'point'
    const products = importProductsFromCodes(row, headers)
    const record = {
      serviceType: { code: service, name: kind === 'survey' ? 'Levantamento' : '' },
      street: { code: street, name: '' },
      neighborhood: { code: neighborhood, name: '' },
      number,
      orderNumber,
      observation,
      products,
    }

    const entry = {
      date,
      time,
      kind,
      serviceCode: service,
      serviceName: kind === 'survey' ? 'Levantamento' : '',
      streetCode: street,
      streetName: '',
      number,
      neighborhoodCode: neighborhood,
      neighborhoodName: '',
      orderNumber,
      observation,
      surveyObservation: kind === 'survey' ? observation : '',
      products: products.map((item) => ({
        code: item.product?.code || '',
        name: item.product?.name || '',
        quantity: item.quantity ?? '',
      })),
      sourceRow: rowNumber,
    }

    entry.important =
      importedImportantForRecordV25(
        entry,
        record,
      )

    entries.push(entry)

    if (rowNumber % 250 === 0) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }

  return { format: 'codes', label: 'Planilha em códigos', entries }
}

function normalSheetKind(sheet, index) {
  const title = normalizeImportText(
    sheet?.name,
  )
  if (title.includes('levant')) return 'survey'
  if (title.includes('ponto')) return 'point'
  return index === 1 ? 'survey' : 'point'
}

async function parseNormalWorkbook(workbook) {
  if (!workbook.worksheets.length) throw new Error('A planilha normal não possui abas.')

  /*
    V30: a tabela CESIP só é carregada quando uma planilha NORMAL realmente
    precisa ser convertida. Nada disso entra no boot do painel. Se os arquivos
    auxiliares falharem, a importação antiga continua funcionando em letras.
  */
  let cesipResolverV30 = null
  try {
    cesipResolverV30 = await getCesipSmartResolverV30()
  } catch (error) {
    console.warn('[JR V30] Base CESIP indisponível durante a importação.', error)
  }

  const entries = []
  let recognizedSheets = 0

  for (let sheetIndex = 0; sheetIndex < workbook.worksheets.length; sheetIndex += 1) {
    const sheet = workbook.worksheets[sheetIndex]
    const headers = normalizedHeaderMap(sheet, 2)
    const streetColumn = findHeaderColumn(headers, ['rua', 'logradouro'])
    const numberColumn = findHeaderColumn(headers, ['nº', 'numero', 'número']) || 4
    const orderColumn = findHeaderColumn(headers, ['ordem de servico', 'ordem_servico', 'ordem de serviço'])
    const neighborhoodColumn = findHeaderColumn(headers, ['bairro'])
    const timeColumn = findHeaderColumn(headers, ['horas', 'horario', 'horário']) || 5
    const observationColumn =
      findObservationColumnV25(
        headers,
        sheetIndex === 1
          ? 8
          : 28,
      )
    const headerMatches = [streetColumn, timeColumn, orderColumn, neighborhoodColumn].filter(Boolean).length
    if (headerMatches < 3) continue

    recognizedSheets += 1
    const headerDate = singleDateFromHeader(importCellValue(sheet.getCell('H1')))
    const kind = normalSheetKind(sheet, sheetIndex)

    for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber)
      const time = String(importCellValue(row.getCell(timeColumn)) || '').trim()
      const orderNumber = String(importCellValue(row.getCell(orderColumn || 6)) || '').trim()
      if (!time && !orderNumber) continue

      const rawStreetName = String(importCellValue(row.getCell(streetColumn || 2)) || '').trim()
      const number = String(importCellValue(row.getCell(numberColumn)) ?? '').trim()
      const rawNeighborhoodName = String(importCellValue(row.getCell(neighborhoodColumn || 7)) || '').trim()
      const rawObservation = String(importCellValue(row.getCell(observationColumn)) || '').trim()

      const streetResolutionV30 =
        rawStreetName && cesipResolverV30
          ? cesipResolverV30.resolveStreetWithContext(rawStreetName)
          : null
      const neighborhoodResolutionV30 =
        rawNeighborhoodName && cesipResolverV30
          ? cesipResolverV30.resolveNeighborhood(rawNeighborhoodName)
          : null

      const streetCode = streetResolutionV30?.matched
        ? String(streetResolutionV30.code || '')
        : ''
      const streetName = streetResolutionV30?.matched
        ? String(streetResolutionV30.name || rawStreetName)
        : rawStreetName
      const neighborhoodCode = neighborhoodResolutionV30?.matched
        ? String(neighborhoodResolutionV30.code || '')
        : ''
      const neighborhoodName = neighborhoodResolutionV30?.matched
        ? String(neighborhoodResolutionV30.name || rawNeighborhoodName)
        : rawNeighborhoodName
      const observation = appendAddressContextV30(
        rawObservation,
        streetResolutionV30?.matched
          ? String(streetResolutionV30.context || '')
          : '',
      )

      const date = dateFromTimeText(time) || headerDate
      const products = kind === 'point' ? importProductsFromNormal(row) : []
      const record = {
        serviceType: { code: kind === 'survey' ? '162' : '', name: kind === 'survey' ? 'Levantamento' : '' },
        street: { code: streetCode, name: streetName },
        neighborhood: { code: neighborhoodCode, name: neighborhoodName },
        number,
        orderNumber,
        observation,
        products,
      }

      const entry = {
        date,
        time,
        kind,
        serviceCode: kind === 'survey' ? '162' : '',
        serviceName: kind === 'survey' ? 'Levantamento' : '',
        streetCode,
        streetName,
        number,
        neighborhoodCode,
        neighborhoodName,
        orderNumber,
        observation:
          kind === 'point'
            ? observation
            : '',
        surveyObservation:
          kind === 'survey'
            ? observation
            : '',
        products: products.map((item) => ({
          code: item.product?.code || '',
          name: item.product?.name || '',
          quantity: item.quantity ?? '',
        })),
        sourceRow: rowNumber,
      }

      entry.important =
        importedImportantForRecordV25(
          entry,
          record,
        )

      entries.push(entry)

      if (rowNumber % 45 === 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    }
  }

  if (!recognizedSheets) {
    throw new Error('O arquivo não corresponde à planilha em códigos nem ao relatório normal do JR Gestão.')
  }

  return { format: 'normal', label: 'Relatório normal', entries }
}

function workbookLooksLikeCodes(workbook) {
  const sheet = workbook.worksheets[0]
  if (!sheet) return false
  const headers = normalizedHeaderMap(
    sheet,
    1,
  )
  return (
    Boolean(findHeaderColumn(headers, ['data'])) &&
    Boolean(
      findHeaderColumn(
        headers,
        ['tipo_servico', 'tipo serviço'],
      ),
    )
  )
}

async function parseImportedWorkbook(file) {
  if (!file) {
    throw new Error(
      'Selecione uma planilha XLSX.',
    )
  }

  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error(
      'Use um arquivo .xlsx.',
    )
  }

  if (file.size > 30 * 1024 * 1024) {
    throw new Error(
      'A planilha excede 30 MB.',
    )
  }

  const ExcelJS =
    await ensureExcelJsForImport()

  const workbook =
    new ExcelJS.Workbook()

  await workbook.xlsx.load(
    await file.arrayBuffer(),
  )

  const parsed = workbookLooksLikeCodes(
    workbook,
  )
    ? await parseCodesWorkbook(workbook)
    : await parseNormalWorkbook(workbook)

  return {
    ...parsed,
    workbook,
    fileName: file.name,
    teamHint: detectTeamHint(
      workbook,
      file.name,
    ),
  }
}

function inferredImportDate(entries) {
  const dates = [
    ...new Set(
      (entries || [])
        .map((entry) =>
          parseImportDate(entry.date),
        )
        .filter(Boolean),
    ),
  ]

  return dates.length === 1
    ? dates[0]
    : ''
}

async function handleImportFile() {
  const file =
    els.importFile?.files?.[0]

  if (!file) return

  if (els.importFileName) {
    els.importFileName.textContent =
      file.name
  }

  if (els.importStatus) {
    els.importStatus.textContent =
      'Lendo e conferindo a planilha...'
    els.importStatus.classList.remove(
      'is-error',
      'is-ready',
    )
  }

  if (els.importApply) {
    els.importApply.disabled = true
  }

  try {
    const parsed =
      await parseImportedWorkbook(file)

    state.importWorkbook =
      parsed.workbook
    state.importEntries =
      parsed.entries
    state.importMeta = {
      format: parsed.format,
      label: parsed.label,
      fileName: parsed.fileName,
    }


    /* JR_GESTAO_V38_REFRESH_IMPORT_TEAM_LABELS */
    fillImportTeamSelect()

    if (parsed.teamHint && els.importTeam) {
      els.importTeam.value = parsed.teamHint
    }

    const inferredDate =
      inferredImportDate(
        parsed.entries,
      )

    if (inferredDate && els.importDate) {
      els.importDate.value = inferredDate
    }

    renderImportPreview()
  } catch (error) {
    state.importWorkbook = null
    state.importEntries = []
    state.importMeta = null

    if (els.importStatus) {
      els.importStatus.textContent =
        friendlyError(error)
      els.importStatus.classList.add(
        'is-error',
      )
    }
  }
}

function currentImportAggregate() {
  const fallback =
    els.importDate?.value || ''

  return aggregateImportEntries(
    state.importEntries,
    fallback,
    state.month,
  )
}

function renderImportPreview() {
  if (!els.importSummary) return

  if (!state.importMeta) {
    els.importSummary.classList.add(
      'hidden',
    )
    if (els.importApply) {
      els.importApply.disabled = true
    }
    return
  }

  const aggregate =
    currentImportAggregate()

  const teamKey =
    els.importTeam?.value || ''

  const importantCount =
    aggregate.days.reduce(
      (total, day) =>
        total +
        SERVICE_METRIC_KEYS.reduce(
          (sum, metric) =>
            sum +
            (day.importantByMetric?.[metric]?.length || 0),
          0,
        ),
      0,
    )

  const dateLabel = aggregate.days.length
    ? aggregate.days
        .map((day) =>
          day.date.split('-').reverse().join('/'),
        )
        .join(', ')
    : 'Nenhuma data válida'

  els.importSummary.classList.remove(
    'hidden',
  )

  els.importSummary.innerHTML = `
    <div class="services-import-summary-head">
      <div>
        <small>FORMATO DETECTADO</small>
        <strong>${escapeHtml(state.importMeta.label)}</strong>
      </div>
      <span>${aggregate.total} item(ns)</span>
    </div>

    <div class="services-import-metrics">
      <span><small>Pontos M/T</small><strong>${aggregate.totals.dayPoints}</strong></span>
      <span><small>Levant. M/T</small><strong>${aggregate.totals.daySurveys}</strong></span>
      <span><small>Pontos noite</small><strong>${aggregate.totals.nightPoints}</strong></span>
      <span><small>Levant. noite</small><strong>${aggregate.totals.nightSurveys}</strong></span>
    </div>

    <div class="services-import-detail-line">
      <span><b>Dias:</b> ${escapeHtml(dateLabel)}</span>
      <span><b>Observações importantes:</b> ${importantCount}</span>
      <span><b>Linhas ignoradas:</b> ${aggregate.ignored}</span>
    </div>`

  const ready =
    Boolean(teamKey) &&
    aggregate.days.length > 0 &&
    aggregate.total > 0

  if (els.importApply) {
    els.importApply.disabled = !ready
  }

  if (els.importStatus) {
    const blocks = [
      aggregate.totals.dayPoints > 0
        ? 'Pontos M/T'
        : '',
      aggregate.totals.daySurveys > 0
        ? 'Levant. M/T'
        : '',
      aggregate.totals.nightPoints > 0
        ? 'Pontos Noite'
        : '',
      aggregate.totals.nightSurveys > 0
        ? 'Levant. Noite'
        : '',
    ].filter(Boolean)

    els.importStatus.textContent = ready
      ? `Conferência pronta. Substitui somente: ${blocks.join(', ')}. As outras faixas do mesmo dia serão preservadas.`
      : !teamKey
        ? 'Selecione a equipe que pertence a esta planilha.'
        : 'Informe uma data válida para as linhas que não possuem data no arquivo.'

    els.importStatus.classList.toggle(
      'is-ready',
      ready,
    )
    els.importStatus.classList.toggle(
      'is-error',
      !ready,
    )
  }
}

function ensureMetricDayObject(target, metric) {
  if (!target[metric]) target[metric] = {}
  return target[metric]
}

async function applyImportedWorkbook() {
  if (!isAdmin()) return

  const teamKey =
    els.importTeam?.value || ''
  const aggregate =
    currentImportAggregate()

  if (!teamKey || !aggregate.days.length) {
    showToast(
      'Selecione a equipe e confira os dias da planilha.',
      true,
    )
    return
  }

  const draft = draftFor(teamKey)

  /*
    V25:
    substituição é por DATA + MÉTRICA, nunca pelo dia inteiro.

    Exemplo:
    importar Noite de 03/08 remove somente as linhas de
    Pontos Noite/Levantamento Noite realmente presentes
    no arquivo atual. M/T do mesmo dia continua intacto.
  */
  const replacementKeys =
    importReplacementKeys(
      aggregate,
    )

  draft.importedRows =
    (draft.importedRows || [])
      .filter((item) =>
        shouldKeepImportedRow(
          item,
          replacementKeys,
        ),
      )

  const fallbackDate = els.importDate?.value || ''
  const sourceFile = state.importMeta?.fileName || ''
  const sourceFormat = state.importMeta?.format || ''

  for (const entry of state.importEntries || []) {
    const date =
      parseImportDate(entry?.date) ||
      parseImportDate(fallbackDate)

    const metric =
      importedRowMetric(entry)

    if (
      !date ||
      !date.startsWith(`${state.month}-`) ||
      !metric
    ) {
      continue
    }

    draft.importedRows.push({
      date,
      time: String(entry?.time || ''),
      kind: entry?.kind === 'survey' ? 'survey' : 'point',
      serviceCode: String(entry?.serviceCode || ''),
      serviceName: String(entry?.serviceName || ''),
      streetCode: String(entry?.streetCode || ''),
      streetName: String(entry?.streetName || ''),
      number: String(entry?.number ?? ''),
      neighborhoodCode: String(entry?.neighborhoodCode || ''),
      neighborhoodName: String(entry?.neighborhoodName || ''),
      orderNumber: String(entry?.orderNumber || ''),
      observation: String(entry?.observation || ''),
      surveyObservation: String(entry?.surveyObservation || ''),
      products: Array.isArray(entry?.products) ? entry.products : [],
      sourceFormat,
      sourceFile,
      sourceRow: Number(entry?.sourceRow || 0),
    })
  }

  /*
    Reconstroi as observações diretamente das linhas importadas
    já consolidadas. Isso também corrige importações antigas V21-V25
    que tinham a observação salva em importedRows mas não no card.
  */
  draft.importedNotesByMetric =
    mergeRebuiltImportedNotesV28(
      draft.importedNotesByMetric,
      rebuildImportedNotesByMetricV28(
        draft.importedRows,
      ),
    )

  SERVICE_METRIC_KEYS.forEach((metric) => {
    ensureMetricDayObject(
      draft.importedScoresByMetric,
      metric,
    )
    ensureMetricDayObject(
      draft.importedNotesByMetric,
      metric,
    )
  })

  aggregate.days.forEach((day) => {
    const dayNumber = Number(
      day.date.slice(8, 10),
    )
    const dayKey = String(dayNumber)

    const presentMetrics =
      new Set(
        day.presentMetrics || [],
      )

    SERVICE_METRIC_KEYS.forEach((metric) => {
      /*
        AUSENTE no Excel não significa ZERO.
        Só alteramos o bloco que realmente veio no arquivo.
      */
      if (!presentMetrics.has(metric)) {
        return
      }

      draft.importedScoresByMetric[metric][dayKey] =
        Number(day[metric] || 0)

      const important =
        day.importantByMetric?.[metric] || []

      if (important.length) {
        const rebuilt =
          rebuildImportedNotesByMetricV28(
            draft.importedRows,
          )?.[metric]?.[dayKey]

        draft.importedNotesByMetric[metric][dayKey] =
          String(
            rebuilt ||
            `IMPORTADO: ${important.join(' • ')}`,
          ).slice(0, 1600)
      } else {
        /*
          Não apaga uma observação reconstruída de outra
          planilha/importação válida da mesma métrica.
        */
        const rebuilt =
          rebuildImportedNotesByMetricV28(
            draft.importedRows,
          )?.[metric]?.[dayKey]

        if (rebuilt) {
          draft.importedNotesByMetric[metric][dayKey] =
            rebuilt
        } else {
          delete draft.importedNotesByMetric[metric][dayKey]
        }
      }

      /*
        Override manual também só é limpo na métrica
        que está sendo substituída pela planilha atual.
      */
      if (draft.scoreOverrides?.[metric]) {
        delete draft.scoreOverrides[metric][dayKey]

        if (
          Object.keys(
            draft.scoreOverrides[metric],
          ).length === 0
        ) {
          delete draft.scoreOverrides[metric]
        }
      }
    })
  })

  markDirty(teamKey)

  if (els.importApply) {
    els.importApply.disabled = true
    els.importApply.textContent =
      'Salvando importação...'
  }

  try {
    const saved =
      await saveAllChanges()

    if (!saved) {
      throw new Error(
        'A importação não foi salva.',
      )
    }

    closeImportDialog()
    state.sheetCache = null
    state.matrixCacheFingerprint = ''
    renderTeamFilter()
    renderBoard()

    document.dispatchEvent(
      new CustomEvent('jr:imported-records-v21', {
        detail: { month: state.month, teamKey },
      }),
    )

    const replacedBlocks = [
      aggregate.totals.dayPoints > 0
        ? 'Pontos M/T'
        : '',
      aggregate.totals.daySurveys > 0
        ? 'Levant. M/T'
        : '',
      aggregate.totals.nightPoints > 0
        ? 'Pontos Noite'
        : '',
      aggregate.totals.nightSurveys > 0
        ? 'Levant. Noite'
        : '',
    ].filter(Boolean)

    showToast(
      `Planilha importada: ${aggregate.total} item(ns). Atualizado: ${replacedBlocks.join(', ')}. As outras faixas foram preservadas.`,
    )
  } catch (error) {
    showToast(
      friendlyError(error),
      true,
    )
  } finally {
    if (els.importApply) {
      els.importApply.textContent =
        'Importar e salvar'
      renderImportPreview()
    }
  }
}

async function downloadWorkbook() {
  try {
    if (!window.ExcelJS) {
      throw new Error(
        'O gerador de planilhas ainda não carregou. Atualize a página.',
      )
    }

    const allSheets = buildTeamSheets()
    const sheets = allSheets.filter(
      (sheet) =>
        state.selectedTeam === 'all' ||
        sheet.key === state.selectedTeam,
    )

    if (!sheets.length) {
      throw new Error(
        'Nenhuma equipe disponível para gerar a planilha.',
      )
    }

    setButtonLoading(
      els.download,
      true,
      'Gerando...',
    )

    const workbook =
      new window.ExcelJS.Workbook()

    workbook.creator = 'JR Gestão'
    workbook.created = new Date()

    const globalDraft = draftFor(GLOBAL_KEY)

    SERVICE_METRICS.forEach((metric) => {
      const worksheet =
        workbook.addWorksheet(metric.sheetName)

      const observationColumn =
        sheets.length + 2

      const visibleObservationSheets =
        sheets.filter(
          (sheet) =>
            !isMetricHidden(
              draftFor(sheet.key),
              metric.key,
            ),
        )

      worksheet.views = [
        {
          state: 'frozen',
          xSplit: 1,
          ySplit: 3,
        },
      ]

      worksheet.mergeCells(
        1,
        1,
        1,
        observationColumn,
      )

      worksheet.getCell(1, 1).value =
        metric.label

      worksheet.getCell(1, 1).font = {
        bold: true,
        size: 16,
      }

      worksheet.getCell(1, 1).alignment = {
        horizontal: 'center',
      }

      worksheet.mergeCells(
        2,
        1,
        2,
        observationColumn,
      )

      worksheet.getCell(2, 1).value =
        monthLabel(state.month)

      worksheet.getCell(2, 1).alignment = {
        horizontal: 'center',
      }

      worksheet.addRow([
        'Dia',
        ...sheets.map((sheet) => displayNameFor(sheet, metric.key)),
        `Observações — ${metric.label}`,
      ])

      worksheet.getRow(3).font = {
        bold: true,
      }

      worksheet.getRow(3).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      }

      for (
        let dayNumber = 1;
        dayNumber <= daysInMonth(state.month);
        dayNumber += 1
      ) {
        const observations =
          observationItemsForDay(
            visibleObservationSheets,
            dayNumber,
            metric.key,
          )
            .map((item) => {
              const parts = []

              if (item.automatic) {
                parts.push(
                  `Serviço: ${item.automatic}`,
                )
              }

              if (item.manual) {
                parts.push(
                  `Comunicado: ${item.manual}`,
                )
              }

              return `${item.team}: ${parts.join(' | ')}`
            })
            .join('\n')

        const row = worksheet.addRow([
          dayNumber,
          ...sheets.map((sheet) =>
            effectiveScore(
              sheet.days[dayNumber - 1],
              draftFor(sheet.key),
              metric.key,
            ),
          ),
          observations,
        ])

        row.hidden =
          globalDraft.hiddenDays.has(dayNumber)

        row.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        }

        sheets.forEach((sheet, index) => {
          const parts =
            compactEffectiveObservationPartsV412(
              sheet.days[dayNumber - 1],
              draftFor(sheet.key),
              metric.key,
            )

          if (parts.hasImportant) {
            const cell =
              row.getCell(index + 2)

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: 'FFF2C14E',
              },
            }

            cell.font = {
              bold: true,
              color: {
                argb: 'FF201600',
              },
            }
          }
        })
      }

      const totalRow = worksheet.addRow([
        'TOTAL',
        ...sheets.map((sheet) =>
          sheet.days.reduce(
            (sum, day) =>
              sum +
              effectiveScore(
                day,
                draftFor(sheet.key),
                metric.key,
              ),
            0,
          ),
        ),
        metric.label,
      ])

      totalRow.font = {
        bold: true,
      }

      worksheet.getColumn(1).width = 9

      sheets.forEach((sheet, index) => {
        const column =
          worksheet.getColumn(index + 2)

        column.width = 18

        column.hidden =
          isMetricHidden(
            draftFor(sheet.key),
            metric.key,
          )
      })

      worksheet.getColumn(
        observationColumn,
      ).width = 70

      worksheet.getColumn(
        observationColumn,
      ).hidden =
        isObservationHidden(
          globalDraft,
          metric.key,
        )

      worksheet.autoFilter = {
        from: {
          row: 3,
          column: 1,
        },
        to: {
          row: 3,
          column: observationColumn,
        },
      }

      worksheet.eachRow((row) => {
        row.eachCell(
          { includeEmpty: true },
          (cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            }
          },
        )
      })
    })

    const buffer =
      await workbook.xlsx.writeBuffer()

    downloadBlob(
      new Blob(
        [buffer],
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ),
      `SERVICOS_EXECUTADOS_MATRIZ_V22_${state.month}.xlsx`,
    )

    showToast(
      'Planilha com quatro abas gerada.',
    )
  } catch (error) {
    showToast(
      friendlyError(error),
      true,
    )
  } finally {
    setButtonLoading(
      els.download,
      false,
      'Baixar 4 planilhas',
    )
  }
}

function recordScore(row) {
  const record = row?.registro || row || {}
  const normal = isServiceLevantamento(record) ? 0 : 1
  const levantamento = isServiceLevantamento(record) || hasSurveyPhotoFilled(record) ? 1 : 0
  return { normal, levantamento }
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

function minutesFromDateValueV28(value) {
  if (!hasText(value)) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  let hour = 0
  let minute = 0

  for (const part of timeFormatterV22.formatToParts(date)) {
    if (part.type === 'hour') hour = Number(part.value)
    else if (part.type === 'minute') minute = Number(part.value)
  }

  return hour * 60 + minute
}

function pointMinutesV28(row) {
  /* JR_GESTAO_PERIODO_FOTO_V37_1_SERVICOS: mesma regra exata do Home/planilha. */
  const record = row?.registro || row || {}
  for (const value of [
    record.timePhotoFileName,
    record.timePhotoPath,
    record.stampedTimeText,
  ]) {
    const parsed = parseImportMinutes(value)
    if (Number.isFinite(parsed)) return parsed
  }
  const fromDate = minutesFromDateValueV28(record.timePhotoTakenAt)
  if (Number.isFinite(fromDate)) return fromDate
  const parsed = parseImportMinutes(record.timePhotoTakenAt)
  return Number.isFinite(parsed) ? parsed : null
}

function surveyMinutesV28(row) {
  /* JR_GESTAO_PERIODO_FOTO_V37_1_SERVICOS: levantamento separado pelo horario da propria foto. */
  const record = row?.registro || row || {}
  for (const value of [
    record.surveyPhotoFileName,
    record.surveyPhotoPath,
  ]) {
    const parsed = parseImportMinutes(value)
    if (Number.isFinite(parsed)) return parsed
  }
  const fromDate = minutesFromDateValueV28(record.surveyPhotoTakenAt)
  if (Number.isFinite(fromDate)) return fromDate
  const parsed = parseImportMinutes(record.surveyPhotoTakenAt)
  if (Number.isFinite(parsed)) return parsed
  if (isServiceLevantamento(record)) return pointMinutesV28(row)
  return null
}

function isDayMinutesV28(minutes) {
  return (
    Number.isFinite(minutes) &&
    minutes >= 360 &&
    minutes < 1050
  )
}

function recordMinutes(row) {
  const point = pointMinutesV28(row)
  if (Number.isFinite(point)) return point

  const survey = surveyMinutesV28(row)
  return Number.isFinite(survey) ? survey : 0
}

function isMorningRecord(row) {
  return isDayMinutesV28(recordMinutes(row))
}


function serviceDateKey(row) {
  const record =
    row?.registro || row || {}

  for (const value of [
    record.timePhotoFileName,
    record.timePhotoPath,
    record.surveyPhotoFileName,
    record.surveyPhotoPath,
  ]) {
    const match =
      String(value || '')
        .match(
          /(?:^|\D)(\d{4})(\d{2})(\d{2})[_\-\s](?:[01]\d|2[0-3])(?:[0-5]\d)/,
        )

    if (match) {
      return (
        `${match[1]}-` +
        `${match[2]}-` +
        match[3]
      )
    }
  }

  for (const value of [
    record.timePhotoTakenAt,
    record.surveyPhotoTakenAt,
  ]) {
    if (!value) continue

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      continue
    }

    return dateFormatterV22
      .format(date)
  }

  for (const value of [
    record.date,
    record.serviceDate,
    record.workDate,
    record.work_date,
  ]) {
    const match =
      String(value || '')
        .match(
          /^(\d{4})-(\d{2})-(\d{2})/,
        )

    if (match) {
      return (
        `${match[1]}-` +
        `${match[2]}-` +
        match[3]
      )
    }
  }

  const fallback =
    String(row?.data || '')
      .match(
        /^(\d{4})-(\d{2})-(\d{2})/,
      )

  return fallback
    ? `${fallback[1]}-${fallback[2]}-${fallback[3]}`
    : ''
}

function metricDefinition(key) {
  return SERVICE_METRICS.find((item) => item.key === key) || SERVICE_METRICS[0]
}

function clampScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(999999, Math.round(number)))
}

function normalizeMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || '')) ? String(value) : ''
}


function currentMonthValue() {
  return (
    normalizeMonth(
      $('#month-filter')?.value,
    ) ||
    monthFormatterV22.format(
      new Date(),
    )
  )
}


function monthLabel(value) {
  const [year, month] =
    value
      .split('-')
      .map(Number)

  return monthLabelFormatterV22
    .format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
        ),
      ),
    )
}

function setButtonLoading(button, loading, label) {
  if (!button) return
  button.disabled = loading
  const node = button.querySelector('.button-label')
  if (node) node.textContent = label
}

function showLoading(value) {
  state.loading = value
  els.loading?.classList.toggle('hidden', !value)
  if (els.refresh) els.refresh.disabled = value
  if (els.download) els.download.disabled = value
}

function setError(message) {
  if (!els.error) return
  els.error.textContent = message
  els.error.classList.remove('hidden')
  els.error.classList.add('error')
}

function clearError() {
  if (!els.error) return
  els.error.textContent = ''
  els.error.classList.add('hidden')
  els.error.classList.remove('error')
}

function showToast(message, error = false) {
  const toast = $('#toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.toggle('error', error)
  toast.classList.add('show')
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200)
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function friendlyError(error) {
  const message = String(error?.message || error || '')
  if (message.includes('service_report_settings') || message.includes('schema cache')) {
    return 'A tabela de configurações dos serviços ainda não está instalada no Supabase.'
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Seu usuário não possui permissão para alterar esta área.'
  }
  return message || 'Não foi possível carregar os serviços executados.'
}

function isAdmin() {
  return state.profile?.role === 'admin'
}

function isServicesPageVisible() {
  return Boolean(els.page && !els.page.classList.contains('hidden'))
}

function hasText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char])
}
