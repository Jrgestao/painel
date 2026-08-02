(() => {
  'use strict'

  const MOBILE_QUERY = '(max-width: 900px)'
  const media = window.matchMedia(MOBILE_QUERY)
  const EDGE = 34
  const DISTANCE = 66
  const MAX_VERTICAL = 76

  function sidebar() {
    return document.getElementById('sidebar')
  }

  function menuOpen() {
    return Boolean(sidebar()?.classList.contains('open'))
  }

  function toggleMenu(open) {
    const panel = sidebar()
    const overlay = document.getElementById('sidebar-overlay')
    if (!panel || !overlay) return

    panel.classList.toggle('open', open)
    panel.setAttribute('aria-hidden', String(!open))
    overlay.classList.toggle('show', open)
    overlay.setAttribute('aria-hidden', String(!open))
    document.body.classList.toggle('sidebar-open', open)

    const button = document.getElementById('mobile-menu-button')
    button?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
  }

  function installSwipe() {
    let start = null

    document.addEventListener('pointerdown', (event) => {
      if (!media.matches || event.pointerType === 'mouse') return

      const open = menuOpen()
      if (!open && event.clientX > EDGE) return

      if (event.target.closest(
        'input, textarea, select, button, a, dialog, ' +
        '.date-picker-popover, .custom-select-menu'
      )) return

      start = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        open,
      }
    }, { passive: true, capture: true })

    document.addEventListener('pointercancel', () => {
      start = null
    }, { passive: true, capture: true })

    document.addEventListener('pointerup', (event) => {
      if (!start || start.id !== event.pointerId) return

      const dx = event.clientX - start.x
      const dy = Math.abs(event.clientY - start.y)

      if (dy <= MAX_VERTICAL && Math.abs(dx) > dy * 1.2) {
        if (!start.open && dx >= DISTANCE) toggleMenu(true)
        if (start.open && dx <= -DISTANCE) toggleMenu(false)
      }

      start = null
    }, { passive: true, capture: true })

    document.getElementById('sidebar-overlay')
      ?.addEventListener('click', () => toggleMenu(false))

    media.addEventListener?.('change', (event) => {
      if (!event.matches) toggleMenu(false)
    })
  }

  function wrapperFromTrigger(trigger) {
    return trigger?.closest(
      '[data-date-picker-for], [data-month-picker-for], [data-select-for], ' +
      '.picker-control, .custom-select-control'
    )
  }

  function popoverFromWrapper(wrapper) {
    return wrapper?.querySelector('.date-picker-popover, .custom-select-menu') || null
  }

  function alignPopover(trigger) {
    const wrapper = wrapperFromTrigger(trigger)
    const popover = popoverFromWrapper(wrapper)
    if (!wrapper || !popover) return

    popover.classList.remove(
      'jr-service-calendar-fixed-v40',
      'jr-service-date-popover-v37',
      'jr-service-date-popover-fixed-v39'
    )

    for (const property of [
      '--jr-calendar-left-v40',
      '--jr-calendar-top-v40',
      '--jr-calendar-width-v40',
      '--jr-calendar-max-height-v40',
      '--jr37-floating-left',
      '--jr37-floating-top',
      '--jr37-floating-width',
      '--jr37-floating-max-height',
    ]) {
      popover.style.removeProperty(property)
    }

    popover.style.removeProperty('left')
    popover.style.removeProperty('right')
    popover.style.removeProperty('top')
    popover.style.removeProperty('bottom')
    popover.style.removeProperty('width')
    popover.style.removeProperty('transform')

    const rect = trigger.getBoundingClientRect()
    const expectedHeight = Math.min(
      Math.max(popover.scrollHeight || 300, 180),
      window.innerHeight - 24
    )
    const below = window.innerHeight - rect.bottom
    const above = rect.top

    popover.classList.toggle(
      'jr-open-above',
      below < Math.min(expectedHeight, 280) && above > below
    )
  }

  function scheduleAlignment(trigger) {
    requestAnimationFrame(() => alignPopover(trigger))
    window.setTimeout(() => alignPopover(trigger), 24)
  }

  function installPopoverAlignment() {
    document.addEventListener('pointerdown', (event) => {
      const trigger = event.target.closest(
        '.picker-trigger, .custom-select-trigger'
      )
      if (trigger) scheduleAlignment(trigger)
    }, { passive: true, capture: true })

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest(
        '.picker-trigger, .custom-select-trigger'
      )
      if (trigger) scheduleAlignment(trigger)
    }, { passive: true, capture: true })

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const trigger = event.target.closest(
        '.picker-trigger, .custom-select-trigger'
      )
      if (trigger) scheduleAlignment(trigger)
    }, true)
  }


  function installNetworkNoticeV6() {
    let notice = document.getElementById('jr-network-notice-v6')
    if (!notice) {
      notice = document.createElement('div')
      notice.id = 'jr-network-notice-v6'
      notice.hidden = true
      notice.setAttribute('role', 'status')
      document.body.appendChild(notice)
    }

    const update = () => {
      const offline = navigator.onLine === false
      notice.hidden = !offline
      notice.textContent = offline
        ? 'Sem internet. O painel volta a atualizar assim que a conexão retornar.'
        : ''
    }

    window.addEventListener('online', update, { passive: true })
    window.addEventListener('offline', update, { passive: true })
    update()
  }

  function cleanOldRuntimeCacheV6() {
    const release = '20260801-221649'
    const key = 'jr_rede_mobile_release_v6'
    let previous = ''
    try { previous = localStorage.getItem(key) || '' } catch (_error) {}
    if (previous === release) return

    try { localStorage.setItem(key, release) } catch (_error) {}

    if ('caches' in window) {
      caches.keys()
        .then((names) => Promise.all(names
          .filter((name) => /jr|gestao|painel/i.test(name))
          .map((name) => caches.delete(name))))
        .catch(() => {})
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((items) => Promise.all(items.map((item) => item.unregister())))
        .catch(() => {})
    }
  }


  function start() {
    document.body.classList.add('jr-sidebar-swipe-v6', 'jr-performance-v6')
    cleanOldRuntimeCacheV6()
    installNetworkNoticeV6()
    installSwipe()
    installPopoverAlignment()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true })
  } else {
    start()
  }
})()
