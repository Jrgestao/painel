const loaded = {
  board: null,
  home: null,
  bridge: null,
}

let boardReady = false

function currentPageV24() {
  const active =
    document.querySelector(
      '.nav-item.active[data-page]',
    )

  return (
    active?.dataset.page ||
    'home'
  )
}

function showServicesLoadingV24() {
  const loading =
    document.getElementById(
      'services-loading',
    )

  const state =
    document.getElementById(
      'services-save-state',
    )

  loading?.classList.remove(
    'hidden',
  )

  if (state) {
    state.textContent =
      'Abrindo matriz otimizada...'
  }
}

function loadBoardV24(replay = true) {
  if (!loaded.board) {
    showServicesLoadingV24()

    loaded.board =
      import(
        './services-board-v24.js?v=performance-v24-20260807'
      )
        .then((module) => {
          const first =
            !boardReady

          boardReady = true

          if (
            first &&
            replay &&
            currentPageV24() ===
              'services'
          ) {
            document.dispatchEvent(
              new CustomEvent(
                'jr:pagechange',
                {
                  detail: {
                    page: 'services',
                    performanceReplayV24:
                      true,
                  },
                },
              ),
            )
          }

          return module
        })
        .catch((error) => {
          loaded.board = null
          boardReady = false

          const state =
            document.getElementById(
              'services-save-state',
            )

          if (state) {
            state.textContent =
              'Não foi possível abrir a matriz.'
          }

          console.error(
            '[JR V24] Falha ao carregar Serviços Executados:',
            error,
          )

          throw error
        })
  }

  return loaded.board
}


function loadHomeV24() {
  if (!loaded.home) {
    loaded.home =
      import(
        './services-home-overlay-v24.js?v=performance-v24-20260807'
      ).catch((error) => {
        loaded.home = null

        console.error(
          '[JR V24] Falha no resumo importado:',
          error,
        )

        throw error
      })
  }

  return loaded.home.then(
    (module) => {
      module
        .restoreHomeOverlayV24
        ?.()

      return module
    },
  )
}

function loadBridgeV24() {
  if (!loaded.bridge) {
    loaded.bridge =
      import(
        './services-import-bridge-v21.js?v=bridge-v21-20260807'
      ).catch((error) => {
        loaded.bridge = null

        console.error(
          '[JR V24] Falha na ponte de importação:',
          error,
        )

        throw error
      })
  }

  return loaded.bridge
}


const preloadedV24 = new Set()

function modulePreloadV24(href) {
  if (
    !href ||
    preloadedV24.has(href)
  ) {
    return
  }

  preloadedV24.add(href)

  const link =
    document.createElement('link')

  link.rel = 'modulepreload'
  link.href = href
  link.crossOrigin = 'anonymous'

  document.head.appendChild(link)
}

function prepareModulesV24() {
  modulePreloadV24(
    './src/services-board-v24.js?v=performance-v24-20260807',
  )
  modulePreloadV24(
    './src/services-home-overlay-v24.js?v=performance-v24-20260807',
  )
  modulePreloadV24(
    './src/services-import-bridge-v21.js?v=bridge-v21-20260807',
  )
}

document.addEventListener(
  'jr:pagechange',
  (event) => {
    const page =
      event.detail?.page || ''

    if (page === 'services') {
      if (
        event.detail
          ?.performanceReplayV24
      ) {
        return
      }

      void loadBoardV24(true)
      return
    }

    if (page === 'home') {
      void loadHomeV24()
      return
    }

    if (
      page === 'codes' ||
      page === 'orders'
    ) {
      void loadBridgeV24()
    }
  },
)

document.addEventListener(
  'jr:monthdata',
  () => {
    if (
      currentPageV24() ===
      'home'
    ) {
      void loadHomeV24()
    }
  },
)

document.addEventListener(
  'jr:services-settings-updated',
  () => {
    if (
      currentPageV24() ===
      'home'
    ) {
      void loadHomeV24()
    }
  },
)

/*
  Se o usuário já estiver numa dessas telas quando o módulo lazy
  terminar de carregar, não depende de um novo clique.
*/
const initialPage =
  currentPageV24()

if (initialPage === 'services') {
  void loadBoardV24(true)
} else if (
  initialPage === 'codes' ||
  initialPage === 'orders'
) {
  void loadBridgeV24()
}

/*
  Home é leve e pode ser preparado no tempo ocioso, depois que o boot
  principal terminar. Não ocupa a thread crítica de login.
*/
const prepareNavigationV24 =
  () => {
    prepareModulesV24()

    if (
      currentPageV24() ===
      'home' &&
      window.__JR_SERVICES_MONTH_CACHE__
    ) {
      void loadHomeV24()
    }
  }

if (
  typeof window.requestIdleCallback ===
  'function'
) {
  window.requestIdleCallback(
    prepareNavigationV24,
    { timeout: 1500 },
  )
} else {
  window.setTimeout(
    prepareNavigationV24,
    650,
  )
}

document.documentElement
  .classList.add(
    'jr-performance-v24',
  )
