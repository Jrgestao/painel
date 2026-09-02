// JR_GESTAO_OBS_CACHE_V40_12=20260827
/*
  V29: esconde os números mensais nativos/parciais desde o boot.
*/
document.documentElement.classList.add(
  'jr-home-month-pending-v29',
)

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

function jrServicesImportErrorTextV40169(error) {
  const name = String(error?.name || 'Erro')
  const message = String(error?.message || error || 'Falha desconhecida')
  return `${name}: ${message}`
}

function jrShowServicesImportErrorV40169(error) {
  const stateNode = document.getElementById('services-save-state')
  const loading = document.getElementById('services-loading')
  const errorNode = document.getElementById('services-error')
  const detail = jrServicesImportErrorTextV40169(error)

  loading?.classList.add('hidden')
  if (stateNode) {
    stateNode.textContent = 'Falha ao abrir a matriz: ' + detail
    stateNode.title = String(error?.stack || detail)
  }
  if (errorNode) {
    errorNode.textContent = 'Falha ao abrir a matriz: ' + detail
    errorNode.classList.remove('hidden')
    errorNode.classList.add('error')
    errorNode.title = String(error?.stack || detail)
  }

  window.__JR_SERVICES_LAST_ERROR_V40169__ = {
    name: String(error?.name || ''),
    message: String(error?.message || error || ''),
    stack: String(error?.stack || ''),
    at: new Date().toISOString(),
  }
}

function loadBoardV25(replay = true) {
  if (!loaded.board) {
    showServicesLoadingV25()

    loaded.board =
      import(
        './services-board-v40-16-18.js?v=v40-16-18-20260902-observacoes-delegadas'
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
          jrShowServicesImportErrorV40169(error)
          console.error(
            '[JR V40.16.9] Falha real ao carregar Serviços Executados:',
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
        './services-home-overlay-v29.js?v=periodo-foto-v37-1-20260811'
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
        .restoreHomeOverlayV29
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
    './src/services-board-v40-16-18.js?v=v40-16-18-20260902-observacoes-delegadas',
  )
  modulePreloadV25(
    './src/services-home-overlay-v29.js?v=periodo-foto-v37-1-20260811',
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

/*
  V29: Home carrega imediatamente para registrar jr:monthdata
  antes do resumo mensal terminar.
*/
void loadHomeV25()

if (initialPage === 'services') {
  void loadBoardV25(true)
} else if (
  initialPage === 'codes' ||
  initialPage === 'orders'
) {
  void loadBridgeV25()
}

const prepareNavigationV25 =
  () => {
    prepareModulesV25()
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
    'jr-home-stable-v29',
  )
