(() => {
  'use strict'

  const MOBILE_MAX = 900
  const EDGE_START = 34
  const SWIPE_DISTANCE = 68
  const SWIPE_VERTICAL_LIMIT = 72
  const POPOVER_SELECTOR = '.date-picker-popover, .custom-select-menu'

  const isMobile = () => window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches

  function menuElements() {
    return {
      app: document.getElementById('app-view'),
      sidebar: document.getElementById('sidebar'),
      overlay: document.getElementById('sidebar-overlay'),
      button: document.getElementById('mobile-menu-button'),
    }
  }

  function appIsVisible() {
    const { app } = menuElements()
    return Boolean(app && !app.classList.contains('hidden') && app.getAttribute('aria-hidden') !== 'true')
  }

  function menuIsOpen() {
    const { sidebar } = menuElements()
    return Boolean(sidebar?.classList.contains('open'))
  }

  function setMenuOpen(open) {
    const { sidebar, overlay, button } = menuElements()
    if (!sidebar || !overlay) return

    sidebar.classList.toggle('open', open)
    sidebar.classList.remove('show', 'active')
    sidebar.setAttribute('aria-hidden', String(!open))

    overlay.classList.toggle('show', open)
    overlay.classList.remove('open', 'active')
    overlay.setAttribute('aria-hidden', String(!open))

    document.body.classList.toggle('sidebar-open', open)

    if (button) {
      button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
      button.setAttribute('title', open ? 'Fechar menu' : 'Abrir menu')
    }
  }

  function installSwipeMenu() {
    let gesture = null

    document.addEventListener('pointerdown', (event) => {
      if (!isMobile() || !appIsVisible() || event.pointerType === 'mouse') return

      const blocked = event.target.closest(
        'input, textarea, select, button, a, dialog, [contenteditable="true"], ' +
        '.date-picker-popover, .custom-select-menu, .period-selector-dialog'
      )
      if (blocked) return

      const open = menuIsOpen()
      if (!open && event.clientX > EDGE_START) return

      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        open,
      }
    }, { passive: true, capture: true })

    document.addEventListener('pointercancel', () => {
      gesture = null
    }, { passive: true, capture: true })

    document.addEventListener('pointerup', (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return

      const dx = event.clientX - gesture.startX
      const dy = Math.abs(event.clientY - gesture.startY)
      const horizontal = Math.abs(dx) > dy * 1.2

      if (horizontal && dy <= SWIPE_VERTICAL_LIMIT) {
        if (!gesture.open && dx >= SWIPE_DISTANCE) setMenuOpen(true)
        if (gesture.open && dx <= -SWIPE_DISTANCE) setMenuOpen(false)
      }

      gesture = null
    }, { passive: true, capture: true })

    document.getElementById('sidebar-overlay')?.addEventListener('click', () => setMenuOpen(false))

    window.addEventListener('resize', () => {
      if (!isMobile()) setMenuOpen(false)
    }, { passive: true })
  }

  function viewportBox() {
    const viewport = window.visualViewport
    return {
      left: viewport?.offsetLeft || 0,
      top: viewport?.offsetTop || 0,
      width: viewport?.width || window.innerWidth,
      height: viewport?.height || window.innerHeight,
    }
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum))
  }

  function controlWrapper(popover) {
    return popover.closest(
      '[data-date-picker-for], [data-month-picker-for], [data-select-for]'
    )
  }

  function isPopoverOpen(popover) {
    return popover.classList.contains('show') ||
      popover.closest('[data-date-picker-for], [data-month-picker-for], [data-select-for]')?.classList.contains('open')
  }

  function clearPopoverPosition(popover) {
    popover.classList.remove('jr-anchored-popover-final')
    for (const property of [
      'position', 'inset', 'left', 'right', 'top', 'bottom',
      'width', 'max-width', 'max-height', 'margin', 'transform',
      'translate', 'z-index', 'overflow-y'
    ]) {
      popover.style.removeProperty(property)
    }
  }

  function positionPopover(popover) {
    if (!(popover instanceof HTMLElement)) return
    if (!isPopoverOpen(popover)) {
      clearPopoverPosition(popover)
      return
    }

    const wrapper = controlWrapper(popover)
    const trigger = wrapper?.querySelector(
      '.picker-trigger, .custom-select-trigger, button'
    )
    if (!wrapper || !trigger) return

    const view = viewportBox()
    const rect = trigger.getBoundingClientRect()
    const margin = isMobile() ? 10 : 12
    const viewportRight = view.left + view.width
    const viewportBottom = view.top + view.height

    const isSelect = popover.classList.contains('custom-select-menu')
    const minimumWidth = isSelect ? Math.max(220, rect.width) : Math.max(300, rect.width)
    const maximumWidth = isSelect ? 390 : 390
    const width = Math.min(maximumWidth, view.width - margin * 2, minimumWidth)

    const measuredHeight = Math.min(
      Math.max(popover.scrollHeight || popover.offsetHeight || 320, 160),
      view.height - margin * 2,
      isMobile() ? 520 : 560
    )

    let left = clamp(rect.left, view.left + margin, viewportRight - width - margin)
    let top = rect.bottom + 8

    const spaceBelow = viewportBottom - rect.bottom - margin
    const spaceAbove = rect.top - view.top - margin

    if (spaceBelow < Math.min(measuredHeight, 260) && spaceAbove > spaceBelow) {
      top = Math.max(view.top + margin, rect.top - measuredHeight - 8)
    } else {
      top = clamp(top, view.top + margin, viewportBottom - Math.min(measuredHeight, view.height - margin * 2) - margin)
    }

    popover.classList.add('jr-anchored-popover-final')
    popover.style.setProperty('position', 'fixed', 'important')
    popover.style.setProperty('inset', 'auto', 'important')
    popover.style.setProperty('left', `${Math.round(left)}px`, 'important')
    popover.style.setProperty('top', `${Math.round(top)}px`, 'important')
    popover.style.setProperty('right', 'auto', 'important')
    popover.style.setProperty('bottom', 'auto', 'important')
    popover.style.setProperty('width', `${Math.round(width)}px`, 'important')
    popover.style.setProperty('max-width', `${Math.round(view.width - margin * 2)}px`, 'important')
    popover.style.setProperty('max-height', `${Math.round(view.height - margin * 2)}px`, 'important')
    popover.style.setProperty('margin', '0', 'important')
    popover.style.setProperty('transform', 'none', 'important')
    popover.style.setProperty('translate', 'none', 'important')
    popover.style.setProperty('z-index', '26000', 'important')
    popover.style.setProperty('overflow-y', 'auto', 'important')
  }

  function positionAllOpenPopovers() {
    document.querySelectorAll(POPOVER_SELECTOR).forEach(positionPopover)
  }

  function schedulePositioning(savedScrollY = null) {
    const reposition = () => {
      positionAllOpenPopovers()

      if (
        savedScrollY !== null &&
        Math.abs(window.scrollY - savedScrollY) > 18
      ) {
        window.scrollTo({ top: savedScrollY, left: window.scrollX, behavior: 'auto' })
      }
    }

    requestAnimationFrame(reposition)
    window.setTimeout(reposition, 30)
    window.setTimeout(reposition, 110)
  }

  function installAnchoredControls() {
    const observer = new MutationObserver((mutations) => {
      let shouldPosition = false

      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.target instanceof HTMLElement &&
          (
            mutation.target.matches(POPOVER_SELECTOR) ||
            mutation.target.matches('[data-date-picker-for], [data-month-picker-for], [data-select-for]')
          )
        ) {
          shouldPosition = true
          break
        }

        if (mutation.type === 'childList') {
          shouldPosition = true
          break
        }
      }

      if (shouldPosition) schedulePositioning()
    })

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-expanded'],
    })

    document.addEventListener('pointerdown', (event) => {
      const trigger = event.target.closest(
        '[data-date-picker-for] .picker-trigger, ' +
        '[data-month-picker-for] .picker-trigger, ' +
        '[data-select-for] .custom-select-trigger'
      )
      if (!trigger) return

      const savedScrollY = window.scrollY
      schedulePositioning(savedScrollY)
    }, { passive: true, capture: true })

    document.addEventListener('click', (event) => {
      if (
        event.target.closest(
          '[data-date-picker-for], [data-month-picker-for], [data-select-for], ' +
          '.date-picker-popover, .custom-select-menu'
        )
      ) {
        schedulePositioning()
      }
    }, { passive: true, capture: true })

    window.addEventListener('resize', positionAllOpenPopovers, { passive: true })
    window.addEventListener('scroll', positionAllOpenPopovers, { passive: true, capture: true })
    window.visualViewport?.addEventListener('resize', positionAllOpenPopovers, { passive: true })
    window.visualViewport?.addEventListener('scroll', positionAllOpenPopovers, { passive: true })
  }

  function start() {
    document.body.dataset.jrAjustesFinais = 'ativo'
    installSwipeMenu()
    installAnchoredControls()
    schedulePositioning()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true })
  } else {
    start()
  }
})()
