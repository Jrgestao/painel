const loaded = {
  board: null,
  home: null,
  bridge: null,
}

let boardReady = false

function currentPageV23() {
  const active =
    document.querySelector(
      '.nav-item.active[data-page]',
    )

  return (
    active?.dataset.page ||
    'home'
  )
}

function showServicesLoadingV23() {
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

function loadBoardV23(replay = true) {
  if (!loaded.board) {
    showServicesLoadingV23()

    loaded.board =
      import(
        './services-board-v23.js?v=performance-v23-20260807'
      )
        .then((module) => {
          const first =
            !boardReady

          boardReady = true

          if (
            first &&
            replay &&
            currentPageV23() ===
              'services'
          ) {
            document.dispatchEvent(
              new CustomEvent(
                'jr:pagechange',
                {
                  detail: {
                    page: 'services',
                    performanceReplayV23:
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
            '[JR V23] Falha ao carregar Serviços Executados:',
            error,
          )

          throw error
        })
  }

  return loaded.board
}


function loadHomeV23() {
  if (!loaded.home) {
    loaded.home =
      import(
        './services-home-overlay-v23.js?v=performance-v23-20260807'
      ).catch((error) => {
        loaded.home = null

        console.error(
          '[JR V23] Falha no resumo importado:',
          error,
        )

        throw error
      })
  }

  return loaded.home.then(
    (module) => {
      module
        .restoreHomeOverlayV23
        ?.()

      return module
    },
  )
}

function loadBridgeV23() {
  if (!loaded.bridge) {
    loaded.bridge =
      import(
        './services-import-bridge-v21.js?v=bridge-v21-20260807'
      ).catch((error) => {
        loaded.bridge = null

        console.error(
          '[JR V23] Falha na ponte de importação:',
          error,
        )

        throw error
      })
  }

  return loaded.bridge
}


const preloadedV23 = new Set()

function modulePreloadV23(href) {
  if (
    !href ||
    preloadedV23.has(href)
  ) {
    return
  }

  preloadedV23.add(href)

  const link =
    document.createElement('link')

  link.rel = 'modulepreload'
  link.href = href
  link.crossOrigin = 'anonymous'

  document.head.appendChild(link)
}

function prepareModulesV23() {
  modulePreloadV23(
    './src/services-board-v23.js?v=performance-v23-20260807',
  )
  modulePreloadV23(
    './src/services-home-overlay-v23.js?v=performance-v23-20260807',
  )
  modulePreloadV23(
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
          ?.performanceReplayV23
      ) {
        return
      }

      void loadBoardV23(true)
      return
    }

    if (page === 'home') {
      void loadHomeV23()
      return
    }

    if (
      page === 'codes' ||
      page === 'orders'
    ) {
      void loadBridgeV23()
    }
  },
)

document.addEventListener(
  'jr:monthdata',
  () => {
    if (
      currentPageV23() ===
      'home'
    ) {
      void loadHomeV23()
    }
  },
)

document.addEventListener(
  'jr:services-settings-updated',
  () => {
    if (
      currentPageV23() ===
      'home'
    ) {
      void loadHomeV23()
    }
  },
)

/*
  Se o usuário já estiver numa dessas telas quando o módulo lazy
  terminar de carregar, não depende de um novo clique.
*/
const initialPage =
  currentPageV23()

if (initialPage === 'services') {
  void loadBoardV23(true)
} else if (
  initialPage === 'codes' ||
  initialPage === 'orders'
) {
  void loadBridgeV23()
}

/*
  Home é leve e pode ser preparado no tempo ocioso, depois que o boot
  principal terminar. Não ocupa a thread crítica de login.
*/
const prepareNavigationV23 =
  () => {
    prepareModulesV23()

    if (
      currentPageV23() ===
      'home' &&
      window.__JR_SERVICES_MONTH_CACHE__
    ) {
      void loadHomeV23()
    }
  }

if (
  typeof window.requestIdleCallback ===
  'function'
) {
  window.requestIdleCallback(
    prepareNavigationV23,
    { timeout: 1500 },
  )
} else {
  window.setTimeout(
    prepareNavigationV23,
    650,
  )
}

document.documentElement
  .classList.add(
    'jr-performance-v23',
  )
