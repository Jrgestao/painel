(() => {
  'use strict'

  const ID = 'jr-mode-toggle-v11'
  const STYLE_ID = 'jr-mode-toggle-v11-style'
  const WIPE_ID = 'jr-mode-toggle-v11-wipe'
  const VERSION = '11'

  const isAdministrative = () => /\/administrativo(?:\/|$)/i.test(location.pathname)

  function appIsReady() {
    const app = document.querySelector('#app-view')
    if (app) return !app.classList.contains('hidden')
    const login = document.querySelector('#login-view')
    if (login && !login.classList.contains('hidden')) return false
    return Boolean(document.querySelector('.admin-topbar, .admin-actions, .main-content, #logout-button, .app-shell'))
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #${ID}{box-sizing:border-box!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:9px!important;min-height:42px!important;padding:6px 10px!important;border-radius:999px!important;text-decoration:none!important;cursor:pointer!important;user-select:none!important;white-space:nowrap!important;position:relative!important;z-index:2147482000!important;overflow:hidden!important;transition:transform .18s ease,background .24s ease,border-color .24s ease,box-shadow .24s ease!important}
      #${ID}:hover{transform:translateY(-1px)}
      #${ID} .jr-mode-label{font:800 9px/1 Inter,system-ui,sans-serif!important;letter-spacing:.08em!important}
      #${ID} .jr-mode-track{width:52px!important;height:27px!important;flex:0 0 52px!important;padding:3px!important;border-radius:999px!important;box-sizing:border-box!important;position:relative!important;transition:background .28s ease,border-color .28s ease!important}
      #${ID} .jr-mode-knob{display:block!important;width:19px!important;height:19px!important;border-radius:50%!important;transition:transform .3s cubic-bezier(.22,.8,.25,1),background .25s ease,box-shadow .25s ease!important}
      #${ID}[data-current="operational"]{border:1px solid rgba(255,255,255,.18)!important;background:rgba(255,255,255,.06)!important;color:#fafafa!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 7px 22px rgba(0,0,0,.24)!important}
      #${ID}[data-current="operational"] .jr-mode-track{background:#101214!important;border:1px solid rgba(255,255,255,.22)!important}
      #${ID}[data-current="operational"] .jr-mode-knob{background:#f7f8f9!important;box-shadow:0 2px 7px rgba(0,0,0,.42)!important;transform:translateX(0)!important}
      #${ID}[data-current="operational"] .jr-mode-admin{color:#969ca2!important}
      #${ID}[data-current="administrative"]{border:1px solid #d7dde2!important;background:#fff!important;color:#17191c!important;box-shadow:0 8px 24px rgba(35,45,55,.10)!important}
      #${ID}[data-current="administrative"] .jr-mode-track{background:#edf0f2!important;border:1px solid #d2d8dd!important}
      #${ID}[data-current="administrative"] .jr-mode-knob{background:#17191c!important;box-shadow:0 2px 7px rgba(20,30,40,.2)!important;transform:translateX(25px)!important}
      #${ID}[data-current="administrative"] .jr-mode-op{color:#9aa1a7!important}
      #${ID}.jr-switching[data-current="operational"] .jr-mode-track{background:#edf0f2!important;border-color:#d2d8dd!important}
      #${ID}.jr-switching[data-current="operational"] .jr-mode-knob{background:#17191c!important;transform:translateX(25px)!important}
      #${ID}.jr-switching[data-current="administrative"] .jr-mode-track{background:#101214!important;border-color:rgba(255,255,255,.21)!important}
      #${ID}.jr-switching[data-current="administrative"] .jr-mode-knob{background:#f6f7f8!important;transform:translateX(0)!important}
      #${WIPE_ID}{position:fixed;inset:0;z-index:2147483646;pointer-events:none;opacity:0;transition:opacity .27s ease;background:#f7f8fa}
      #${WIPE_ID}.show{opacity:1}
      #${WIPE_ID}[data-direction="operational"]{background:#050505}
      #${ID}.jr-fixed-mode-toggle{position:fixed!important;top:max(12px,env(safe-area-inset-top))!important;right:84px!important;box-shadow:0 10px 30px rgba(0,0,0,.28)!important}
      @media(max-width:760px){#${ID}{gap:6px!important;padding:5px 7px!important;min-height:38px!important}#${ID} .jr-mode-label{font-size:0!important}#${ID} .jr-mode-op::after{content:'OPR';font-size:8px}#${ID} .jr-mode-admin::after{content:'ADM';font-size:8px}#${ID} .jr-mode-track{width:47px!important;flex-basis:47px!important;height:25px!important}#${ID} .jr-mode-knob{width:17px!important;height:17px!important}#${ID}[data-current="administrative"] .jr-mode-knob,#${ID}.jr-switching[data-current="operational"] .jr-mode-knob{transform:translateX(22px)!important}#${ID}.jr-fixed-mode-toggle{right:62px!important;top:max(8px,env(safe-area-inset-top))!important}}
      @media(max-width:480px){#${ID} .jr-mode-label{display:none!important}#${ID}{padding:5px!important}}
    `
    document.head.appendChild(style)
  }

  function markup() {
    return '<span class="jr-mode-label jr-mode-op">OPERACIONAL</span><span class="jr-mode-track" aria-hidden="true"><span class="jr-mode-knob"></span></span><span class="jr-mode-label jr-mode-admin">ADMINISTRATIVO</span>'
  }

  function wipe() {
    let node = document.getElementById(WIPE_ID)
    if (!node) {
      node = document.createElement('div')
      node.id = WIPE_ID
      document.body.appendChild(node)
    }
    return node
  }

  function normalize(link, current) {
    if (!link) return null
    document.querySelectorAll(`#${ID}`).forEach((old) => { if (old !== link) old.remove() })
    link.id = ID
    link.dataset.jrModeVersion = VERSION
    link.dataset.current = current
    link.classList.remove('admin-only', 'hidden', 'viewer-only')
    link.removeAttribute('hidden')
    link.setAttribute('aria-hidden', 'false')
    link.style.removeProperty('display')
    link.style.removeProperty('visibility')
    link.style.removeProperty('opacity')
    link.innerHTML = markup()
    const target = current === 'operational' ? './administrativo/?ferramenta=licitacoes' : '../'
    link.setAttribute('href', target)
    link.setAttribute('aria-label', current === 'operational' ? 'Abrir Modo Administrativo em Boletins de Licitações' : 'Voltar ao Modo Operacional')
    link.setAttribute('title', current === 'operational' ? 'Modo Administrativo — Licitações' : 'Modo Operacional')
    if (link.dataset.jrModeWired !== VERSION) {
      link.dataset.jrModeWired = VERSION
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        if (link.classList.contains('jr-switching')) return
        link.classList.add('jr-switching')
        const cover = wipe()
        cover.dataset.direction = current === 'operational' ? 'administrative' : 'operational'
        requestAnimationFrame(() => cover.classList.add('show'))
        setTimeout(() => location.assign(target), 285)
      })
    }
    return link
  }

  function operationalTarget() {
    const actions = document.querySelector('.admin-actions, .topbar-actions, .header-actions, .admin-topbar .actions, .topbar .actions')
    if (actions) return { actions, fixed: false }
    const header = document.querySelector('.admin-topbar, .topbar, header.app-header, .main-content > header')
    if (header) return { actions: header, fixed: false }
    if (appIsReady()) return { actions: document.body, fixed: true }
    return null
  }

  function installOperational() {
    if (!appIsReady()) return false
    const target = operationalTarget()
    if (!target) return false
    let link = document.querySelector('a.mode-switch-button, a[href*="/administrativo"], a[href*="administrativo/"]')
    if (!link || /login/i.test(link.closest?.('section')?.id || '')) {
      link = document.createElement('a')
      link.className = 'mode-switch-button'
      if (target.fixed) {
        target.actions.appendChild(link)
      } else {
        const profile = target.actions.querySelector('.admin-profile, .profile-chip, .user-profile')
        if (profile) target.actions.insertBefore(link, profile)
        else target.actions.insertBefore(link, target.actions.firstChild)
      }
    }
    if (target.fixed) link.classList.add('jr-fixed-mode-toggle')
    else link.classList.remove('jr-fixed-mode-toggle')
    normalize(link, 'operational')
    return true
  }

  function installAdministrative() {
    const actions = document.querySelector('.admin-header .header-actions, .admin-header .actions, .admin-header')
    if (!actions) return false
    let link = actions.querySelector('.operational-switch, a[href="../"], #jr-mode-toggle-v11')
    if (!link) {
      link = document.createElement('a')
      link.className = 'operational-switch'
      actions.insertBefore(link, actions.firstChild)
    }
    link.classList.remove('jr-fixed-mode-toggle')
    normalize(link, 'administrative')
    return true
  }

  function attempt() {
    return isAdministrative() ? installAdministrative() : installOperational()
  }

  function start() {
    addStyle()
    attempt()
    const observer = new MutationObserver(() => attempt())
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] })
    setInterval(attempt, 2500)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
})()
