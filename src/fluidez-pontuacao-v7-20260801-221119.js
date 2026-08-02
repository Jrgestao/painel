(() => {
  'use strict'

  const release = '20260801-221119'
  document.documentElement.dataset.jrFluidezV7 = release

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('.nav-item[data-page]')
    if (!nav) return
    document.body.classList.add('jr-switching-page-v7')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove('jr-switching-page-v7')
      })
    })
  }, { capture: true, passive: true })

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('jr-switching-page-v7')
  }, { passive: true })
})()
