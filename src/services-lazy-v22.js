const loaded = {
  board: null,
  home: null,
  bridge: null,
}

let boardReady = false

function currentPageV22() {
  const active =
    document.querySelector(
      '.nav-item.active[data-page]',
    )

  return (
    active?.dataset.page ||
    'home'
  )
}

function showServicesLoadingV22() {
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

function loadBoardV22(replay = true) {
  if (!loaded.board) {
    showServicesLoadingV22()

    loaded.board =
      import(
        './services-board-v22.js?v=performance-v22-20260807'
      )
        .then((module) => {
          const first =
            !boardReady

          boardReady = true

          if (
            first &&
            replay &&
            currentPageV22() ===
              'services'
          ) {
            document.dispatchEvent(
              new CustomEvent(
                'jr:pagechange',
                {
                  detail: {
                    page: 'services',
                    performanceReplayV22:
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
            '[JR V22] Falha ao carregar Serviços Executados:',
            error,
          )

          throw error
        })
  }

  return loaded.board
}

function loadHomeV22() {
  if (!loaded.home) {
    loaded.home =
      import(
        './services-home-overlay-v22.js?v=performance-v22-20260807'
      ).catch((error) => {
        loaded.home = null

        console.error(
          '[JR V22] Falha no resumo importado:',
          error,
        )

        throw error
      })
  }

  return loaded.home
}

function loadBridgeV22() {
  if (!loaded.bridge) {
    loaded.bridge =
      import(
        './services-import-bridge-v21.js?v=bridge-v21-20260807'
      ).catch((error) => {
        loaded.bridge = null

        console.error(
          '[JR V22] Falha na ponte de importação:',
          error,
        )

        throw error
      })
  }

  return loaded.bridge
}

document.addEventListener(
  'jr:pagechange',
  (event) => {
    const page =
      event.detail?.page || ''

    if (page === 'services') {
      if (
        event.detail
          ?.performanceReplayV22
      ) {
        return
      }

      void loadBoardV22(true)
      return
    }

    if (page === 'home') {
      void loadHomeV22()
      return
    }

    if (
      page === 'codes' ||
      page === 'orders'
    ) {
      void loadBridgeV22()
    }
  },
)

document.addEventListener(
  'jr:monthdata',
  () => {
    if (
      currentPageV22() ===
      'home'
    ) {
      void loadHomeV22()
    }
  },
)

document.addEventListener(
  'jr:services-settings-updated',
  () => {
    if (
      currentPageV22() ===
      'home'
    ) {
      void loadHomeV22()
    }
  },
)

/*
  Se o usuário já estiver numa dessas telas quando o módulo lazy
  terminar de carregar, não depende de um novo clique.
*/
const initialPage =
  currentPageV22()

if (initialPage === 'services') {
  void loadBoardV22(true)
} else if (
  initialPage === 'codes' ||
  initialPage === 'orders'
) {
  void loadBridgeV22()
}

/*
  Home é leve e pode ser preparado no tempo ocioso, depois que o boot
  principal terminar. Não ocupa a thread crítica de login.
*/
const prepareHome =
  () => {
    if (
      currentPageV22() ===
      'home' &&
      window.__JR_SERVICES_MONTH_CACHE__
    ) {
      void loadHomeV22()
    }
  }

if (
  typeof window.requestIdleCallback ===
  'function'
) {
  window.requestIdleCallback(
    prepareHome,
    { timeout: 1800 },
  )
} else {
  window.setTimeout(
    prepareHome,
    800,
  )
}

document.documentElement
  .classList.add(
    'jr-performance-v22',
  )
