// JR_GESTAO_CALENDARIO_DATA_SERVICO_V42
(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 900px)';
  const media = window.matchMedia(MOBILE_QUERY);

  let savedScrollY = 0;
  let triggerRect = null;
  let lockUntil = 0;
  let restoreFrame = 0;
  let observer = null;

  const normalize = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const isMobile = () => media.matches;

  function findServiceInput() {
    const direct =
      document.getElementById('date-filter') ||
      document.querySelector(
        'input[name="date_filter"], input[name="date-filter"], ' +
        'input[data-date-filter], [data-date-picker-for="date-filter"] input'
      );

    if (direct) return direct;

    return [...document.querySelectorAll('input, button[aria-haspopup="dialog"]')]
      .find((element) => {
        const container = element.closest(
          'label, .field, .form-field, .filter-field, .picker-field, .date-picker'
        );

        return normalize(container?.textContent).includes('data de servico');
      }) || null;
  }

  function findWrapper(input) {
    return (
      input?.closest('[data-date-picker-for="date-filter"]') ||
      input?.closest('[data-date-picker-for]') ||
      input?.closest('.date-picker, .picker-field, .form-field, .field') ||
      input?.parentElement ||
      null
    );
  }

  function findTrigger(input, wrapper) {
    return (
      wrapper?.querySelector(
        '.picker-trigger, [data-picker-trigger], button[aria-haspopup], button'
      ) ||
      input
    );
  }

  function popoverIsVisible(element) {
    if (!element || !element.isConnected) return false;

    const style = window.getComputedStyle(element);

    return (
      !element.hidden &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      (
        element.classList.contains('open') ||
        element.classList.contains('show') ||
        element.getAttribute('aria-hidden') !== 'true'
      )
    );
  }

  function findPopover(wrapper) {
    const inside = wrapper?.querySelector(
      '.picker-popover, .date-picker-popover, ' +
      '[data-picker-popover], [role="dialog"]'
    );

    if (inside) return inside;

    const candidates = [
      ...document.querySelectorAll(
        '.picker-popover.open, .picker-popover.show, ' +
        '.date-picker-popover.open, .date-picker-popover.show, ' +
        '[data-picker-popover]:not([hidden]), [role="dialog"]:not([hidden])'
      ),
    ];

    return candidates.find((element) => {
      const owner = normalize([
        element.dataset?.pickerFor,
        element.dataset?.datePickerFor,
        element.getAttribute('data-date-picker-popover-for'),
        element.getAttribute('aria-labelledby'),
      ].filter(Boolean).join(' '));

      return !owner || owner.includes('date-filter') || owner.includes('data de servico');
    }) || null;
  }

  function restoreScroll(force = false) {
    if (!isMobile()) return;
    if (!force && performance.now() > lockUntil) return;

    cancelAnimationFrame(restoreFrame);

    restoreFrame = requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - savedScrollY) > 1) {
        window.scrollTo({
          top: savedScrollY,
          left: 0,
          behavior: 'auto',
        });
      }
    });
  }

  function positionCalendar(force = false) {
    if (!isMobile()) return false;

    const input = findServiceInput();
    const wrapper = findWrapper(input);
    const trigger = findTrigger(input, wrapper);
    const popover = findPopover(wrapper);

    if (!trigger || !popover) return false;
    if (!force && !popoverIsVisible(popover)) return false;

    const viewport = window.visualViewport;
    const viewportWidth = Math.round(viewport?.width || window.innerWidth);
    const viewportHeight = Math.round(viewport?.height || window.innerHeight);
    const viewportTop = Math.round(viewport?.offsetTop || 0);

    const rect = triggerRect || trigger.getBoundingClientRect();
    const gap = 10;
    const width = Math.min(
      Math.max(rect.width, 310),
      Math.max(270, viewportWidth - gap * 2)
    );

    popover.classList.add('jr-service-calendar-fixed-v40');

    popover.style.setProperty('--jr-calendar-width-v40', `${width}px`);

    const measuredHeight = Math.min(
      Math.max(popover.scrollHeight || popover.offsetHeight || 390, 230),
      Math.max(230, viewportHeight - 24)
    );

    const left = Math.max(
      gap,
      Math.min(rect.left, viewportWidth - width - gap)
    );

    const below = rect.bottom + 7;
    const spaceBelow = viewportTop + viewportHeight - below;
    const openBelow = spaceBelow >= Math.min(measuredHeight, 330);

    const top = openBelow
      ? Math.min(
          below,
          viewportTop + viewportHeight - measuredHeight - gap
        )
      : Math.max(
          viewportTop + gap,
          rect.top - measuredHeight - 7
        );

    popover.style.setProperty('--jr-calendar-left-v40', `${left}px`);
    popover.style.setProperty(
      '--jr-calendar-top-v40',
      `${Math.max(viewportTop + gap, top)}px`
    );
    popover.style.setProperty(
      '--jr-calendar-max-height-v40',
      `${Math.max(215, viewportHeight - 24)}px`
    );

    restoreScroll();
    return true;
  }

  function schedulePosition() {
    [0, 16, 45, 90, 160, 280, 430].forEach((delay) => {
      window.setTimeout(() => {
        positionCalendar();
        restoreScroll();
      }, delay);
    });
  }

  function isServiceDateTarget(target) {
    if (!(target instanceof Element)) return false;

    const input = findServiceInput();
    const wrapper = findWrapper(input);
    const trigger = findTrigger(input, wrapper);

    if (target === input || target === trigger) return true;
    if (trigger?.contains(target) || wrapper?.contains(target)) {
      return normalize(wrapper?.textContent).includes('data de servico') ||
        input?.id === 'date-filter';
    }

    return false;
  }

  function beginOpen(target) {
    if (!isMobile() || !isServiceDateTarget(target)) return;

    const input = findServiceInput();
    const wrapper = findWrapper(input);
    const trigger = findTrigger(input, wrapper);

    savedScrollY = window.scrollY;
    triggerRect = trigger?.getBoundingClientRect() || null;
    lockUntil = performance.now() + 950;

    document.documentElement.classList.add('jr-service-calendar-opening-v40');
    document.body.classList.add('jr-service-calendar-opening-v40');

    /*
      Executa antes do controle original abrir. Assim o calendário já nasce
      fora do fluxo da página e não consegue empurrar a tela para baixo.
    */
    positionCalendar(true);
    schedulePosition();

    window.setTimeout(() => restoreScroll(true), 0);
    window.setTimeout(() => restoreScroll(true), 40);
    window.setTimeout(() => restoreScroll(true), 120);
    window.setTimeout(() => restoreScroll(true), 280);
    window.setTimeout(() => {
      restoreScroll(true);
      document.documentElement.classList.remove('jr-service-calendar-opening-v40');
      document.body.classList.remove('jr-service-calendar-opening-v40');
    }, 980);
  }

  document.addEventListener(
    'pointerdown',
    (event) => beginOpen(event.target),
    { capture: true, passive: true }
  );

  document.addEventListener(
    'click',
    (event) => {
      if (!isServiceDateTarget(event.target)) return;
      schedulePosition();
    },
    true
  );

  window.addEventListener(
    'scroll',
    () => restoreScroll(),
    { passive: true }
  );

  window.visualViewport?.addEventListener(
    'resize',
    () => {
      positionCalendar();
      restoreScroll();
    },
    { passive: true }
  );

  window.addEventListener(
    'orientationchange',
    () => {
      triggerRect = null;
      window.setTimeout(positionCalendar, 180);
    },
    { passive: true }
  );

  observer = new MutationObserver(() => {
    if (!isMobile()) return;

    const input = findServiceInput();
    const popover = findPopover(findWrapper(input));

    if (popoverIsVisible(popover)) schedulePosition();
  });

  const startObserver = () => {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style', 'aria-hidden'],
    });
  };

  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });
})();
