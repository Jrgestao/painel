/* JR_GESTAO_LOADING_INTERATIVO_PROFISSIONAL_V8_9=20260802-150500 */
(() => {
  'use strict';

  const ROOT_ID = 'jr-safe-loading-v86';
  const ACTIVE_ATTR = 'data-jr-interactive-v89';
  const STATE = new WeakMap();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setTarget(instance, clientX, clientY) {
    const rect = instance.root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const normalizedX = clamp((clientX - rect.left) / rect.width, 0, 1);
    const normalizedY = clamp((clientY - rect.top) / rect.height, 0, 1);

    instance.targetX = normalizedX;
    instance.targetY = normalizedY;
    instance.lastInputAt = performance.now();
  }

  function resetTarget(instance) {
    instance.targetX = .5;
    instance.targetY = .44;
  }

  function render(instance) {
    if (!instance.root.isConnected) {
      STATE.delete(instance.root);
      return;
    }

    const idleFor = performance.now() - instance.lastInputAt;

    if (idleFor > 1250) {
      const time = performance.now() / 1000;
      instance.targetX = .5 + Math.sin(time * .32) * .035;
      instance.targetY = .44 + Math.cos(time * .27) * .026;
    }

    instance.currentX += (instance.targetX - instance.currentX) * .075;
    instance.currentY += (instance.targetY - instance.currentY) * .075;

    const dx = instance.currentX - .5;
    const dy = instance.currentY - .5;

    instance.root.style.setProperty(
      '--jr-v89-pointer-x',
      (instance.currentX * 100).toFixed(2) + '%'
    );
    instance.root.style.setProperty(
      '--jr-v89-pointer-y',
      (instance.currentY * 100).toFixed(2) + '%'
    );
    instance.root.style.setProperty(
      '--jr-v89-shift-x',
      (dx * 24).toFixed(2) + 'px'
    );
    instance.root.style.setProperty(
      '--jr-v89-shift-y',
      (dy * 18).toFixed(2) + 'px'
    );
    instance.root.style.setProperty(
      '--jr-v89-logo-x',
      (dx * 8).toFixed(2) + 'px'
    );
    instance.root.style.setProperty(
      '--jr-v89-logo-y',
      (dy * 6).toFixed(2) + 'px'
    );
    instance.root.style.setProperty(
      '--jr-v89-rotate-x',
      (-dy * 5).toFixed(2) + 'deg'
    );
    instance.root.style.setProperty(
      '--jr-v89-rotate-y',
      (dx * 7).toFixed(2) + 'deg'
    );

    requestAnimationFrame(() => render(instance));
  }

  function activate(root) {
    if (!root || STATE.has(root)) return;

    const instance = {
      root,
      currentX: .5,
      currentY: .44,
      targetX: .5,
      targetY: .44,
      lastInputAt: 0,
    };

    STATE.set(root, instance);
    root.setAttribute(ACTIVE_ATTR, '1');

    root.addEventListener(
      'pointermove',
      (event) => setTarget(instance, event.clientX, event.clientY),
      { passive: true }
    );

    root.addEventListener(
      'pointerleave',
      () => {
        instance.lastInputAt = 0;
        resetTarget(instance);
      },
      { passive: true }
    );

    root.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches && event.touches[0];
        if (touch) setTarget(instance, touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    root.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches && event.touches[0];
        if (touch) setTarget(instance, touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    requestAnimationFrame(() => render(instance));
  }

  function scan() {
    activate(document.getElementById(ROOT_ID));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }

  const observer = new MutationObserver(scan);

  function startObserver() {
    if (!document.body) return;

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    scan();
  }

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  }
})();
