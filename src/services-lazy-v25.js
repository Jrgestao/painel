const loaded = {
  board: null,
  home: null,
  bridge: null,
}

let boardReady = false

function currentPageV25() {
  const active =
    document.querySelector(
      '.nav-item.active[data-page]',
    )

  return (
    active?.dataset.page ||
    'home'
  )
}

function showServicesLoadingV25() {
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

function loadBoardV25(replay = true) {
  if (!loaded.board) {
    showServicesLoadingV25()

    loaded.board =
      import(
        './services-board-v25.js?v=performance-v25-20260807'
      )
        .then((module) => {
          const first =
            !boardReady

          boardReady = true

          if (
            first &&
            replay &&
            currentPageV25() ===
              'services'
          ) {
            document.dispatchEvent(
              new CustomEvent(
                'jr:pagechange',
                {
                  detail: {
                    page: 'services',
                    performanceReplayV25:
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
            '[JR V25] Falha ao carregar Serviços Executados:',
            error,
          )

          throw error
        })
  }

  return loaded.board
}


function loadHomeV25() {
  if (!loaded.home) {
    loaded.home =
      import(
        './services-home-overlay-v25.js?v=performance-v25-20260807'
      ).catch((error) => {
        loaded.home = null

        console.error(
          '[JR V25] Falha no resumo importado:',
          error,
        )

        throw error
      })
  }

  return loaded.home.then(
    (module) => {
      module
        .restoreHomeOverlayV25
        ?.()

      return module
    },
  )
}

function loadBridgeV25() {
  if (!loaded.bridge) {
    loaded.bridge =
      import(
        './services-import-bridge-v21.js?v=bridge-v21-20260807'
      ).catch((error) => {
        loaded.bridge = null

        console.error(
          '[JR V25] Falha na ponte de importação:',
          error,
        )

        throw error
      })
  }

  return loaded.bridge
}


const preloadedV25 = new Set()

function modulePreloadV25(href) {
  if (
    !href ||
    preloadedV25.has(href)
  ) {
    return
  }

  preloadedV25.add(href)

  const link =
    document.createElement('link')

  link.rel = 'modulepreload'
  link.href = href
  link.crossOrigin = 'anonymous'

  document.head.appendChild(link)
}

function prepareModulesV25() {
  modulePreloadV25(
    './src/services-board-v25.js?v=performance-v25-20260807',
  )
  modulePreloadV25(
    './src/services-home-overlay-v25.js?v=performance-v25-20260807',
  )
  modulePreloadV25(
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
          ?.performanceReplayV25
      ) {
        return
      }

      void loadBoardV25(true)
      return
    }

    if (page === 'home') {
      void loadHomeV25()
      return
    }

    if (
      page === 'codes' ||
      page === 'orders'
    ) {
      void loadBridgeV25()
    }
  },
)

document.addEventListener(
  'jr:monthdata',
  () => {
    if (
      currentPageV25() ===
      'home'
    ) {
      void loadHomeV25()
    }
  },
)

document.addEventListener(
  'jr:services-settings-updated',
  () => {
    if (
      currentPageV25() ===
      'home'
    ) {
      void loadHomeV25()
    }
  },
)

/*
  Se o usuário já estiver numa dessas telas quando o módulo lazy
  terminar de carregar, não depende de um novo clique.
*/
const initialPage =
  currentPageV25()

if (initialPage === 'services') {
  void loadBoardV25(true)
} else if (
  initialPage === 'codes' ||
  initialPage === 'orders'
) {
  void loadBridgeV25()
}

/*
  Home é leve e pode ser preparado no tempo ocioso, depois que o boot
  principal terminar. Não ocupa a thread crítica de login.
*/
const prepareNavigationV25 =
  () => {
    prepareModulesV25()

    if (
      currentPageV25() ===
      'home' &&
      window.__JR_SERVICES_MONTH_CACHE__
    ) {
      void loadHomeV25()
    }
  }

if (
  typeof window.requestIdleCallback ===
  'function'
) {
  window.requestIdleCallback(
    prepareNavigationV25,
    { timeout: 1500 },
  )
} else {
  window.setTimeout(
    prepareNavigationV25,
    650,
  )
}

document.documentElement
  .classList.add(
    'jr-performance-v25',
  )
