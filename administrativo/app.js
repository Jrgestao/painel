import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../src/config.js?v=3'
import { hydrateIcons, icon } from '../src/icons.js?v=9'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const PRIORITY_SCORE = 35
const DATE_ZONE = 'America/Campo_Grande'
const FILTER_IDS = ['text', 'municipality', 'agency', 'category', 'modality', 'status', 'source', 'compatibility', 'min-value', 'max-value']

const state = {
  profile: null,
  month: '',
  selectedDate: '',
  calendar: {},
  results: [],
  scope: 'state',
  openTenderId: null,
  toastTimer: null,
}

const el = (id) => document.getElementById(id)

bootstrap().catch((error) => showFatal(error))

async function bootstrap() {
  hydrateIcons()
  setLoadingMessage('Validando seu acesso administrativo…')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!session?.user) {
    window.location.replace('../')
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, team_name, active, role')
    .eq('id', session.user.id)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile?.active || profile.role !== 'admin') {
    throw new Error('Esta área é exclusiva para administradores ativos.')
  }

  state.profile = profile
  el('admin-user').textContent = profile.username || profile.team_name || 'Administrador'
  populateDateSelectors()
  bindEvents()

  const today = todayInCampoGrande()
  const params = new URLSearchParams(window.location.search)
  const requestedDate = validDate(params.get('data')) ? params.get('data') : today
  state.selectedDate = requestedDate
  state.month = requestedDate.slice(0, 7)
  syncDateSelectors()

  el('admin-app').classList.remove('hidden')
  el('admin-loading').classList.add('hidden')

  // V11: o Modo Administrativo abre direto em Boletins de Licitações.
  // Só mostramos a tela de ferramentas se ela for solicitada explicitamente.
  if (params.get('ferramenta') === 'ferramentas') {
    showTools()
  } else {
    await openBulletins({ scope: params.get('ferramenta') === 'campo-grande' ? 'campo' : 'state', preserveHistory: true })
  }
}

function bindEvents() {
  el('open-bulletins').addEventListener('click', () => openBulletins({ scope: 'state' }))
  el('open-campo-grande')?.addEventListener('click', () => openBulletins({ scope: 'campo' }))
  document.querySelectorAll('[data-go-tools]').forEach((node) => node.addEventListener('click', (event) => {
    event.preventDefault()
    showTools()
  }))
  el('previous-month').addEventListener('click', () => changeMonth(-1))
  el('next-month').addEventListener('click', () => changeMonth(1))
  el('month-select').addEventListener('change', () => selectMonthFromControls())
  el('year-select').addEventListener('change', () => selectMonthFromControls())
  el('today-button').addEventListener('click', () => selectDate(todayInCampoGrande()))
  el('toggle-filters').addEventListener('click', toggleFilters)
  el('clear-filters').addEventListener('click', clearFilters)
  el('close-detail').addEventListener('click', closeDetail)
  el('tender-dialog').addEventListener('click', (event) => {
    if (event.target === el('tender-dialog')) closeDetail()
  })
  el('tender-dialog').addEventListener('close', () => { state.openTenderId = null })

  FILTER_IDS.forEach((name) => {
    const node = el(`${name}-filter`)
    node.addEventListener(name === 'text' ? 'input' : 'change', () => renderResults())
  })
  document.querySelectorAll('[data-scope]').forEach((button) => button.addEventListener('click', async () => {
    const scope = button.dataset.scope
    if (scope === state.scope) return
    state.scope = scope
    clearFilters({ render: false })
    syncScopeUi()
    updateUrl({ tool: true })
    renderCalendar()
    populateFilterOptions()
    renderCampoGrandeList()
    renderResults()
  }))


  document.addEventListener('click', async (event) => {
    const day = event.target.closest('[data-calendar-date]')
    if (day) return selectDate(day.dataset.calendarDate)
    const showCampo = event.target.closest('[data-show-campo]')
    if (showCampo) return switchToCampoGrande()
    const detail = event.target.closest('[data-open-tender]')
    if (detail) return openDetail(detail.dataset.openTender)
    const favorite = event.target.closest('[data-favorite]')
    if (favorite) return toggleFavorite(favorite.dataset.favorite)
    const safeLink = event.target.closest('[data-safe-url]')
    if (safeLink) return openSafeUrl(safeLink.dataset.safeUrl)
  })
}

async function openBulletins({ scope = 'state', preserveHistory = false } = {}) {
  state.scope = scope
  clearFilters({ render: false })
  el('tools-view').classList.add('hidden')
  el('bulletins-view').classList.remove('hidden')
  syncScopeUi()
  updateUrl({ tool: true, replace: preserveHistory })
  await Promise.all([loadCalendar(), loadDay(), loadCollectorStatus()])
}

function showTools() {
  closeDetail()
  el('bulletins-view').classList.add('hidden')
  el('tools-view').classList.remove('hidden')
  const url = new URL(window.location.href)
  url.search = ''
  history.pushState({}, '', url)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function changeMonth(delta) {
  const [year, month] = state.month.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + delta, 1))
  const value = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`
  await selectDate(`${value}-01`)
}

async function selectMonthFromControls() {
  const value = `${el('year-select').value}-${String(Number(el('month-select').value) + 1).padStart(2, '0')}`
  await selectDate(`${value}-01`)
}

async function selectDate(date) {
  if (!validDate(date)) return
  const nextMonth = date.slice(0, 7)
  const monthChanged = nextMonth !== state.month
  state.selectedDate = date
  state.month = nextMonth
  syncDateSelectors()
  updateUrl({ tool: true })
  if (monthChanged) await loadCalendar()
  else renderCalendar()
  await loadDay()
  requestAnimationFrame(() => el('day-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

async function loadCalendar() {
  el('calendar-grid').setAttribute('aria-busy', 'true')
  try {
    const payload = await api(`/api/admin/licitacoes/calendario?month=${encodeURIComponent(state.month)}`)
    state.calendar = payload.days || {}
    renderCalendar()
  } catch (error) {
    state.calendar = {}
    renderCalendar()
    showToast(readableError(error))
  } finally {
    el('calendar-grid').removeAttribute('aria-busy')
  }
}

function renderCalendar() {
  const [year, month] = state.month.split('-').map(Number)
  el('month-title').textContent = MONTHS[month - 1]
  el('month-year').textContent = String(year)
  const first = new Date(Date.UTC(year, month - 1, 1))
  const gridStart = new Date(first)
  gridStart.setUTCDate(first.getUTCDate() - first.getUTCDay())
  const today = todayInCampoGrande()
  const cells = []
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + index)
    const iso = date.toISOString().slice(0, 10)
    const counts = state.calendar[iso] || { total: 0, prioritarias: 0, campoGrande: 0 }
    const visibleCount = state.scope === 'campo' ? Number(counts.campoGrande || 0) : Number(counts.total || 0)
    const outside = date.getUTCMonth() + 1 !== month
    const label = `${formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })}${visibleCount ? `, ${visibleCount} licitações` : ', nenhuma licitação'}`
    cells.push(`
      <button type="button" role="gridcell" class="calendar-day${outside ? ' outside' : ''}${iso === today ? ' today' : ''}${iso === state.selectedDate ? ' selected' : ''}" data-calendar-date="${iso}" aria-label="${escapeHtml(label)}" aria-selected="${iso === state.selectedDate}">
        <span class="day-number"><span>${date.getUTCDate()}</span><i>HOJE</i></span>
        <span class="day-count">
          ${visibleCount ? `<strong>${visibleCount} ${visibleCount === 1 ? 'licitação' : 'licitações'}</strong><span>publicadas</span>` : '<span>—</span>'}
          ${counts.prioritarias ? `<span class="priority-count">★ ${counts.prioritarias} prioritária${counts.prioritarias === 1 ? '' : 's'}</span>` : ''}
        </span>
      </button>`)
  }
  el('calendar-grid').innerHTML = cells.join('')
}

async function loadDay() {
  el('day-loading').classList.remove('hidden')
  el('day-error').classList.add('hidden')
  el('results-container').innerHTML = ''
  try {
    const payload = await api(`/api/admin/licitacoes/dia?date=${encodeURIComponent(state.selectedDate)}`)
    state.results = Array.isArray(payload.results) ? payload.results : []
    const scoped = scopeResults()
    el('day-title').textContent = state.scope === 'campo'
      ? `Licitações de Campo Grande em ${formatDate(state.selectedDate)}`
      : `Licitações de ${formatDate(state.selectedDate)}`
    el('day-summary').textContent = state.scope === 'campo'
      ? `${scoped.length} ${scoped.length === 1 ? 'publicação oficial de Campo Grande localizada' : 'publicações oficiais de Campo Grande localizadas'}.`
      : `${payload.total || 0} ${payload.total === 1 ? 'publicação oficial localizada' : 'publicações oficiais localizadas'} em Mato Grosso do Sul.`
    populateFilterOptions()
    renderCampoGrandeList()
    renderResults()
  } catch (error) {
    state.results = []
    renderCampoGrandeList()
    const message = readableError(error)
    el('day-error').textContent = message
    el('day-error').classList.remove('hidden')
    el('day-title').textContent = `Licitações de ${formatDate(state.selectedDate)}`
    el('day-summary').textContent = 'Não foi possível consultar esta data.'
  } finally {
    el('day-loading').classList.add('hidden')
  }
}

async function loadCollectorStatus() {
  const box = el('collector-state')
  try {
    const payload = await api('/api/admin/licitacoes/fontes-status')
    const sources = payload.sources || []
    if (!sources.length) {
      box.classList.add('warning')
      box.querySelector('strong').textContent = 'Coleta aguardando início'
      el('collector-state-detail').textContent = 'O coletor iniciará após a instalação do banco.'
      return
    }
    const failures = sources.filter((item) => !['sucesso', 'parcial'].includes(item.status))
    const latest = sources.map((item) => item.finalizada_em || item.iniciada_em).filter(Boolean).sort().at(-1)
    box.classList.toggle('warning', failures.length > 0)
    box.querySelector('strong').textContent = failures.length ? 'Fontes em nova tentativa' : 'Base atualizada'
    el('collector-state-detail').textContent = latest
      ? `${sources.length} fontes monitoradas • ${formatDateTime(latest)}`
      : `${sources.length} fontes monitoradas`
  } catch {
    box.classList.add('warning')
    box.querySelector('strong').textContent = 'Status indisponível'
    el('collector-state-detail').textContent = 'Os resultados disponíveis continuam acessíveis.'
  }
}

function renderCampoGrandeList() {
  const matches = state.results
    .filter((item) => displayIsCampoGrande(item))
    .sort((a, b) => {
      const interest = Number(isDisplayPriority(b)) - Number(isDisplayPriority(a))
      if (interest) return interest
      const score = displayCompatibility(b) - displayCompatibility(a)
      if (score) return score
      return Number(b.valor_estimado || 0) - Number(a.valor_estimado || 0)
    })

  el('radar-summary').innerHTML = `<strong>${matches.length}</strong><span>${matches.length === 1 ? 'licitação de Campo Grande neste dia' : 'licitações de Campo Grande neste dia'}</span>`
  if (!matches.length) {
    el('radar-list').innerHTML = '<div class="cg-empty"><strong>Nenhuma publicação de Campo Grande nesta data.</strong><span>Escolha outro dia no calendário para consultar.</span></div>'
    return
  }

  const items = matches.slice(0, 8).map((item) => {
    const status = statusForTender(item)
    const title = smartTenderSummary(item)
    const category = primaryCategoryLabel(item)
    const value = Number(item.valor_estimado || 0) > 0 ? formatMoney(item.valor_estimado) : 'Valor não informado'
    return `
      <button type="button" class="cg-tender-item" data-open-tender="${item.id}">
        <span class="cg-tender-accent"></span>
        <span class="cg-tender-copy">
          <small>${escapeHtml(category)}</small>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(status.label)} • ${escapeHtml(value)}</span>
        </span>
        <span class="cg-tender-arrow">${icon('chevron-right')}</span>
      </button>`
  }).join('')
  const more = matches.length > 8
    ? `<button type="button" class="cg-show-all" data-show-campo>Ver todas as ${matches.length} de Campo Grande ${icon('arrow-right')}</button>`
    : `<button type="button" class="cg-show-all" data-show-campo>Ver Campo Grande em lista completa ${icon('arrow-right')}</button>`
  el('radar-list').innerHTML = items + more
}

async function switchToCampoGrande() {
  if (state.scope !== 'campo') {
    state.scope = 'campo'
    clearFilters({ render: false })
    syncScopeUi()
    updateUrl({ tool: true })
    renderCalendar()
    populateFilterOptions()
  }
  renderCampoGrandeList()
  renderResults()
  requestAnimationFrame(() => el('day-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function renderResults() {
  const scoped = scopeResults()
  const filtered = scoped.filter(matchesFilters)
  const groups = state.scope === 'campo'
    ? [
        { key: 'campo', icon: 'CG', label: 'Campo Grande', description: 'Todas as licitações do município na data', items: filtered },
      ]
    : [
        { key: 'priority', icon: '★', label: 'Prioridade para você', description: 'Campo Grande + categorias de interesse', items: filtered.filter(isPriority) },
        { key: 'campo', icon: '●', label: 'Campo Grande', description: 'Outras oportunidades do município', items: filtered.filter((item) => displayIsCampoGrande(item) && !isPriority(item)) },
        { key: 'state', icon: 'MS', label: 'Mato Grosso do Sul', description: 'Interior, órgãos estaduais e federais relacionados a MS', items: filtered.filter((item) => !displayIsCampoGrande(item)) },
      ]
  const activeCount = countActiveFilters()
  el('filter-count').textContent = String(activeCount)
  el('filter-count').classList.toggle('hidden', activeCount === 0)

  if (!filtered.length) {
    el('results-container').innerHTML = `
      <div class="empty-state"><strong>Nenhuma licitação neste recorte</strong><p>${scoped.length ? 'Tente outro atalho ou limpe os filtros.' : 'Assim que uma fonte oficial publicar uma oportunidade nesta data, ela aparecerá aqui.'}</p></div>`
    return
  }

  el('results-container').innerHTML = groups.filter((group) => group.items.length).map((group) => `
    <section class="result-section ${group.key}">
      <div class="result-section-heading"><div><i>${group.icon}</i><h3>${group.label}</h3></div><span>${group.items.length} • ${group.description}</span></div>
      <div class="tender-list">${group.items.map(renderTenderCard).join('')}</div>
    </section>`).join('')
}

function renderTenderCard(item) {
  const score = displayCompatibility(item)
  const status = statusForTender(item)
  const shortSummary = smartTenderSummary(item)
  const officialUrl = safeUrl(item.url_oficial)
  const tenderNumber = item.processo || item.numero_compra || 'Não informado'
  const tags = displayCategories(item).map((category) => `<span class="category-chip">${escapeHtml(category)}</span>`).join('')
  return `
    <article class="tender-card${isDisplayPriority(item) ? ' priority' : ''}">
      <div class="tender-main">
        <div class="tender-topline">
          <span class="source-badge">${escapeHtml(item.fonte_principal || 'Fonte oficial')}</span>
          <span class="compatibility${score >= 60 ? ' high' : ''}">${score}% compatível</span>
          <span class="status-badge ${status.kind}" title="Situação oficial: ${escapeHtml(item.situacao || 'Não informada')}">${escapeHtml(status.label)}</span>
        </div>
        <p class="tender-object-type">${escapeHtml(primaryCategoryLabel(item))}</p>
        <button type="button" class="tender-title-button" data-open-tender="${item.id}" title="Abrir objeto completo">${escapeHtml(shortSummary)}</button>
        <p class="tender-original-hint">Objeto completo disponível em “Ver licitação”.</p>
        <div class="tender-meta">
          <span><strong>Órgão:</strong>${escapeHtml(item.orgao || 'Não informado')}</span>
          <span><strong>Município:</strong>${escapeHtml(item.municipio || 'MS')} / ${escapeHtml(item.uf || 'MS')}</span>
          <span><strong>Modalidade:</strong>${escapeHtml(item.modalidade || 'Não informada')}</span>
          <span><strong>Processo:</strong>${escapeHtml(tenderNumber)}</span>
          <span><strong>Publicação:</strong>${formatDate(item.data_publicacao)}</span>
          <span><strong>Abertura:</strong>${formatDateTime(item.data_abertura)}</span>
          <span><strong>Prazo:</strong>${escapeHtml(item.prazo_texto || formatDateTime(item.data_encerramento))}</span>
        </div>
        ${tags ? `<div class="categories">${tags}</div>` : ''}
      </div>
      <div class="tender-value"><small>Valor estimado</small><strong>${formatMoney(item.valor_estimado)}</strong></div>
      <div class="tender-actions">
        <button class="action-button primary" type="button" data-open-tender="${item.id}">${icon('eye')}Ver licitação</button>
        <button class="action-button" type="button" data-open-tender="${item.id}" data-detail-section="documents">${icon('file-text')}Edital</button>
        <button class="action-button" type="button" data-open-tender="${item.id}" data-detail-section="documents">${icon('archive')}Documentos</button>
        <button class="action-button favorite${item.favoritada ? ' active' : ''}" type="button" data-favorite="${item.id}">${icon(item.favoritada ? 'check' : 'save')}${item.favoritada ? 'Favoritada' : 'Favoritar'}</button>
        ${officialUrl ? `<button class="action-button" type="button" data-safe-url="${escapeHtml(officialUrl)}">${icon('arrow-right')}Publicação oficial</button>` : ''}
      </div>
    </article>`
}

async function openDetail(id) {
  const scrollTarget = document.activeElement?.dataset?.detailSection
  state.openTenderId = id
  const dialog = el('tender-dialog')
  el('detail-content').classList.add('hidden')
  el('detail-loading').classList.remove('hidden')
  el('detail-title').textContent = 'Carregando…'
  if (!dialog.open) dialog.showModal()
  try {
    const payload = await api(`/api/admin/licitacoes/${encodeURIComponent(id)}`)
    if (state.openTenderId !== id) return
    renderDetail(payload)
    if (scrollTarget === 'documents') requestAnimationFrame(() => el('detail-documents')?.scrollIntoView({ behavior: 'smooth' }))
  } catch (error) {
    el('detail-content').innerHTML = `<div class="day-error">${escapeHtml(readableError(error))}</div>`
    el('detail-content').classList.remove('hidden')
  } finally {
    el('detail-loading').classList.add('hidden')
  }
}

function renderDetail(payload) {
  const item = payload.tender
  const status = statusForTender(item)
  const sources = payload.sources || []
  const documents = payload.documents || []
  const requirements = payload.requirements || []
  el('detail-title').textContent = item.processo || item.numero_compra || 'Licitação'
  const fields = [
    ['Órgão', item.orgao],
    ['Município / UF', `${item.municipio || 'Não informado'} / ${item.uf || 'MS'}`],
    ['Processo', item.processo || item.numero_compra],
    ['Modalidade', item.modalidade],
    ['Valor estimado', formatMoney(item.valor_estimado)],
    ['Publicação', formatDate(item.data_publicacao)],
    ['Prazo', item.prazo_texto || formatDateTime(item.data_encerramento)],
    ['Data e horário da sessão', formatDateTime(item.data_abertura)],
    ['Local de execução', item.local_execucao],
  ]
  const resources = sources.map((source) => resourceItem({
    title: source.fonte,
    subtitle: [source.edicao, source.pagina ? `Página ${source.pagina}` : '', source.data_publicacao ? formatDate(source.data_publicacao) : ''].filter(Boolean).join(' • '),
    url: pageUrl(source.url, source.pagina),
    action: source.pagina ? `Abrir página ${source.pagina}` : 'Abrir fonte',
  })).join('')
  const documentItems = documents.map((document) => resourceItem({
    title: document.titulo || document.tipo || 'Documento',
    subtitle: [document.tipo, document.pagina_publicacao ? `Publicação na página ${document.pagina_publicacao}` : '', document.analisado_em ? 'Analisado' : 'Disponível'].filter(Boolean).join(' • '),
    url: pageUrl(document.url, document.pagina_publicacao),
    action: 'Abrir documento',
  })).join('')

  const groupedRequirements = groupBy(requirements, (item) => item.categoria || 'Outras exigências')
  const requirementHtml = Object.entries(groupedRequirements).map(([category, rows]) => `
    <div class="requirement-group">
      <h4>${escapeHtml(category)}</h4>
      ${rows.map((requirement) => {
        const document = documents.find((doc) => doc.id === requirement.documento_id)
        const url = pageUrl(document?.url, requirement.pagina)
        return `<div class="requirement"><strong>${escapeHtml(requirement.titulo)}</strong><p>${escapeHtml(requirement.descricao)}${requirement.trecho ? ` — “${escapeHtml(trimText(requirement.trecho, 220))}”` : ''}</p>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">VER NO EDITAL${requirement.pagina ? ` • PÁGINA ${requirement.pagina}` : ''}</a>` : ''}</div>`
      }).join('')}
    </div>`).join('')

  el('detail-content').innerHTML = `
    <section class="detail-hero">
      <div class="detail-badges"><span class="source-badge">${escapeHtml(item.fonte_principal)}</span><span class="status-badge ${status.kind}">${escapeHtml(status.label)}</span><span class="compatibility${displayCompatibility(item) >= 60 ? ' high' : ''}">${displayCompatibility(item)}% compatível</span>${displayCategories(item).map((value) => `<span class="category-chip">${escapeHtml(value)}</span>`).join('')}</div>
      <p class="detail-summary"><strong>Resumo inteligente:</strong> ${escapeHtml(smartTenderSummary(item))}</p>
      <div class="detail-full-object"><small>OBJETO COMPLETO</small><p class="detail-object">${escapeHtml(item.objeto)}</p></div>
      <div class="tender-actions">
        <button class="action-button favorite${item.favoritada ? ' active' : ''}" type="button" data-favorite="${item.id}">${icon(item.favoritada ? 'check' : 'save')}${item.favoritada ? 'Favoritada' : 'Favoritar'}</button>
        ${safeUrl(item.url_oficial) ? `<button class="action-button primary" type="button" data-safe-url="${escapeHtml(safeUrl(item.url_oficial))}">${icon('arrow-right')}Abrir publicação oficial</button>` : ''}
      </div>
    </section>
    <div class="detail-grid">${fields.map(([label, value]) => `<div class="detail-field"><small>${label}</small><strong>${escapeHtml(value || 'Não informado')}</strong></div>`).join('')}</div>
    <section class="detail-section">
      <div class="detail-section-heading"><h3>Fontes oficiais encontradas</h3><span>${sources.length} fonte(s)</span></div>
      <div class="resource-list">${resources || '<div class="empty-state"><p>Nenhuma fonte adicional cadastrada.</p></div>'}</div>
    </section>
    <section class="detail-section" id="detail-documents">
      <div class="detail-section-heading"><h3>Edital, anexos e documentos</h3><span>${documents.length} arquivo(s)</span></div>
      <div class="resource-list">${documentItems || '<div class="empty-state"><p>A fonte ainda não disponibilizou documentos vinculados.</p></div>'}</div>
    </section>
    <section class="detail-section">
      <div class="detail-section-heading"><h3>Documentos necessários para participar</h3><span>${requirements.length} exigência(s)</span></div>
      ${requirementHtml || (payload.analysisPending
        ? '<div class="analysis-pending"><strong>Análise solicitada.</strong> O coletor está lendo os documentos disponíveis. Os requisitos aparecerão aqui com o link exato para conferência no edital.</div>'
        : '<div class="empty-state"><p>Nenhuma exigência foi identificada automaticamente. Consulte o edital completo antes de participar.</p></div>')}
    </section>`
  el('detail-content').classList.remove('hidden')
}

function resourceItem({ title, subtitle, url, action }) {
  return `<div class="resource-item"><div><strong>${escapeHtml(title || 'Documento oficial')}</strong><small>${escapeHtml(subtitle || 'Fonte oficial')}</small></div>${safeUrl(url) ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(action)}</a>` : '<small>Link indisponível</small>'}</div>`
}

async function toggleFavorite(id) {
  const item = state.results.find((row) => row.id === id)
  const detailFavorite = state.openTenderId === id && el('detail-content').querySelector(`[data-favorite="${CSS.escape(id)}"]`)?.classList.contains('active')
  const current = item ? Boolean(item.favoritada) : Boolean(detailFavorite)
  try {
    const payload = await api(`/api/admin/licitacoes/${encodeURIComponent(id)}/favorito`, {
      method: 'PUT',
      body: JSON.stringify({ favorite: !current }),
    })
    state.results.filter((row) => row.id === id).forEach((row) => { row.favoritada = payload.favorite })
    renderResults()
    if (state.openTenderId === id) {
      el('detail-content').querySelectorAll(`[data-favorite="${CSS.escape(id)}"]`).forEach((button) => {
        button.classList.toggle('active', payload.favorite)
        button.innerHTML = `${icon(payload.favorite ? 'check' : 'save')}${payload.favorite ? 'Favoritada' : 'Favoritar'}`
      })
    }
    showToast(payload.favorite ? 'Licitação adicionada aos favoritos.' : 'Licitação removida dos favoritos.')
  } catch (error) {
    showToast(readableError(error))
  }
}

function toggleFilters() {
  const filters = el('filters')
  const show = filters.classList.contains('hidden')
  filters.classList.toggle('hidden', !show)
  el('toggle-filters').setAttribute('aria-expanded', String(show))
}

function clearFilters({ render = true } = {}) {
  FILTER_IDS.forEach((name) => { el(`${name}-filter`).value = name === 'compatibility' ? '0' : '' })
  if (render) renderResults()
}

function populateDateSelectors() {
  el('month-select').innerHTML = MONTHS.map((name, index) => `<option value="${index}">${name}</option>`).join('')
  const currentYear = Number(todayInCampoGrande().slice(0, 4))
  const years = []
  for (let year = currentYear + 3; year >= 2021; year -= 1) years.push(`<option value="${year}">${year}</option>`)
  el('year-select').innerHTML = years.join('')
}

function syncDateSelectors() {
  const [year, month] = state.month.split('-').map(Number)
  if (![...el('year-select').options].some((option) => Number(option.value) === year)) {
    el('year-select').insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`)
  }
  el('month-select').value = String(month - 1)
  el('year-select').value = String(year)
}

function populateFilterOptions() {
  const rows = scopeResults()
  setOptions('municipality-filter', unique(rows.map((item) => item.municipio)), 'Todos')
  setOptions('agency-filter', unique(rows.map((item) => item.orgao)), 'Todos')
  setOptions('category-filter', unique(rows.flatMap((item) => item.categorias || [])), 'Todas')
  setOptions('modality-filter', unique(rows.map((item) => item.modalidade)), 'Todas')
  setOptions('status-filter', unique(rows.map((item) => statusForTender(item).label)), 'Todos')
  setOptions('source-filter', unique(rows.map((item) => item.fonte_principal)), 'Todas')
}

function setOptions(id, values, allLabel) {
  const node = el(id)
  const previous = node.value
  node.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`
  node.value = values.includes(previous) ? previous : ''
}

function matchesFilters(item) {
  const text = normalize(el('text-filter').value)
  const haystack = normalize([item.objeto, item.orgao, item.processo, item.numero_compra, item.municipio, ...(item.categorias || [])].join(' '))
  const exact = (name, value) => !el(`${name}-filter`).value || el(`${name}-filter`).value === (value || '')
  const category = el('category-filter').value
  const minimumScore = Number(el('compatibility-filter').value || 0)
  const minimumValue = Number(el('min-value-filter').value || 0)
  const maximumValue = Number(el('max-value-filter').value || 0)
  const value = Number(item.valor_estimado || 0)
  return (!text || haystack.includes(text))
    && exact('municipality', item.municipio)
    && exact('agency', item.orgao)
    && (!category || displayCategories(item).includes(category))
    && exact('modality', item.modalidade)
    && exact('status', statusForTender(item).label)
    && exact('source', item.fonte_principal)
    && displayCompatibility(item) >= minimumScore
    && (!minimumValue || value >= minimumValue)
    && (!maximumValue || (value > 0 && value <= maximumValue))
}

function scopeResults() {
  return state.scope === 'campo' ? state.results.filter((item) => displayIsCampoGrande(item)) : state.results
}


function syncScopeUi() {
  const campo = state.scope === 'campo'
  document.querySelectorAll('[data-scope]').forEach((button) => button.classList.toggle('active', button.dataset.scope === state.scope))
  el('bulletin-eyebrow').textContent = campo ? 'CAMPO GRANDE' : 'BOLETINS DE LICITAÇÕES'
  el('bulletin-title').textContent = campo ? 'Licitações de Campo Grande' : 'Calendário de oportunidades'
  el('radar-eyebrow').textContent = 'CAMPO GRANDE'
  el('radar-title').textContent = 'Licitações do dia'
  if (state.selectedDate) {
    const scoped = scopeResults()
    el('day-title').textContent = campo
      ? `Licitações de Campo Grande em ${formatDate(state.selectedDate)}`
      : `Licitações de ${formatDate(state.selectedDate)}`
    el('day-summary').textContent = campo
      ? `${scoped.length} ${scoped.length === 1 ? 'publicação oficial de Campo Grande localizada' : 'publicações oficiais de Campo Grande localizadas'}.`
      : `${state.results.length} ${state.results.length === 1 ? 'publicação oficial localizada' : 'publicações oficiais localizadas'} em Mato Grosso do Sul.`
  }
}


function isPriority(item) {
  return displayIsCampoGrande(item) && displayCompatibility(item) >= PRIORITY_SCORE
}

function isDisplayPriority(item) { return isPriority(item) }

function primaryCategoryLabel(item) {
  const text = normalize(String(item.objeto || item.resumo || ''))
  if (isPavingAndDrainageText(text)) return 'PAVIMENTAÇÃO + DRENAGEM'
  if (/\bpavimentac\w*\s+asfalt\w*\b|\basfalto\b/.test(text)) return 'PAVIMENTAÇÃO'
  if (/\bdrenagem\s+(?:de\s+)?aguas?\s+pluviais?\b|\bdrenagem\s+pluvial\b/.test(text)) return 'DRENAGEM'
  const natal = /\b(?:natal|natalin\w*|natalino\w*)\b/.test(text)
  const light = /\b(?:iluminac\w*|luminari\w*|luminotecn\w*|luminos\w*)\b/.test(text)
  if (natal && light) return 'NATAL + ILUMINAÇÃO'
  if (natal) return 'NATAL'
  if (light) return 'ILUMINAÇÃO'
  if (/\b(?:eletric\w*|eletricit\w*|subestac\w*|transformador\w*)\b/.test(text)) return 'ELÉTRICA'
  if (/\b(?:maquin\w*|hora\s+maquina|motonivelador\w*|patrolament\w*|retroescav\w*|escavadeir\w*|terraplan\w*)\b/.test(text)) return 'MÁQUINAS'
  if (/\b(?:poda\w*|arboriz\w*|arbore\w*|arvore\w*)\b/.test(text)) return 'PODA / ARBORIZAÇÃO'
  if (/\b(?:ambient\w*|licenciamento\s+ambiental|residuos?\s+solidos?)\b/.test(text)) return 'AMBIENTAL'
  if (/\b(?:cascalh\w*|saibro\w*|laterita\w*)\b/.test(text)) return 'CASCALHO'
  if (/\b(?:revestimento\s+primario|nao\s+pavimentad\w*|estrada\w*\s+vicinal\w*)\b/.test(text)) return 'VIAS / REVESTIMENTO'
  const categories = displayCategories(item)
  return categories[0] || 'LICITAÇÃO'
}

function smartTenderSummary(item) {
  const object = String(item.objeto || item.resumo || '').replace(/\s+/g, ' ').trim()
  if (!object) return 'Objeto não informado pela fonte oficial'
  const text = normalize(object)

  // Primeiro entende o objeto real; só depois usa tags de interesse.
  if (isPavingAndDrainageText(text)) return 'Pavimentação asfáltica e drenagem pluvial'
  if (/\bpavimentac\w*\s+asfalt\w*\b|\basfalto\b/.test(text)) return 'Pavimentação asfáltica'
  if (/\bdrenagem\s+(?:de\s+)?aguas?\s+pluviais?\b|\bdrenagem\s+pluvial\b/.test(text)) return 'Drenagem de águas pluviais'

  const hasNatal = /\b(?:natal|natalin\w*|natalino\w*)\b/.test(text)
  const hasLighting = /\b(?:iluminac\w*|luminari\w*|luminotecn\w*|luminos\w*)\b/.test(text)
  const hasElectric = /\b(?:eletric\w*|eletricit\w*|subestac\w*|transformador\w*)\b/.test(text)
  const hasMachines = /\b(?:maquin\w*|hora\s+maquina|motonivelador\w*|patrolament\w*|retroescav\w*|escavadeir\w*|terraplan\w*)\b/.test(text)
  const hasPruning = /\b(?:poda\w*|arboriz\w*|arbore\w*|arvore\w*|supressao\s+vegetal)\b/.test(text)
  const hasEnvironmental = /\b(?:ambient\w*|licenciamento\s+ambiental|residuos?\s+solidos?)\b/.test(text)
  const hasGravel = /\b(?:cascalh\w*|saibro\w*|laterita\w*)\b/.test(text)
  const hasPrimarySurfacing = /\b(?:revestimento\s+primario|nao\s+pavimentad\w*|estrada\w*\s+vicinal\w*)\b/.test(text)
  const hasEvent = /\b(?:evento\w*|festividad\w*|show\w*|cenic\w*)\b/.test(text)

  if (hasNatal && hasLighting) return 'Iluminação e decoração de Natal'
  if (hasNatal) return 'Decoração e serviços de Natal'
  if (hasEvent && hasLighting) return 'Iluminação para eventos'
  if (hasLighting) {
    if (/\b(?:moderniz\w*|eficientiz\w*|manutenc\w*)\b/.test(text)) return 'Manutenção e modernização da iluminação pública'
    if (/\b(?:fornec\w*|instal\w*|aquis\w*)\b/.test(text)) return 'Fornecimento e instalação de iluminação'
    return 'Serviços de iluminação pública'
  }
  if (hasElectric) return 'Serviços e instalações elétricas'
  if (hasPruning) return 'Poda de árvores e arborização'
  if (hasEnvironmental) return 'Serviços ambientais e de meio ambiente'
  if (hasMachines) {
    if (/\b(?:hora\s+maquina|loca\w*|operador\w*)\b/.test(text)) return 'Locação de máquinas com operador'
    if (/\b(?:patrol\w*|terraplan\w*)\b/.test(text)) return 'Máquinas para patrolamento e terraplanagem'
    return 'Máquinas e equipamentos pesados'
  }
  if (hasGravel) return 'Cascalhamento e material para vias'
  if (hasPrimarySurfacing) return 'Manutenção de vias e revestimento primário'
  return conciseObject(object)
}

function displayIsCampoGrande(item) {
  const object = String(item?.objeto || '').replace(/\s+/g, ' ').trim()
  const match = object.match(/\b(?:no|na|nos|nas)\s+munic[ií]pio(?:s)?\s+de\s+([^.;]{2,120}?)(?=\s*\/\s*MS\b|\s*-\s*MS\b|[,.;]|$)/i)
    || object.match(/\bmunic[ií]pio(?:s)?\s*[:\-]?\s*([^.;]{2,120}?)(?=\s*\/\s*MS\b|\s*-\s*MS\b|[,.;]|$)/i)
  if (match?.[1]) return normalize(match[1]).includes('campo grande')
  const direct = normalize(object)
  if (/\bcampo grande\s*ms\b/.test(direct)) return true
  return Boolean(item?.is_campo_grande)
}

function displayCategories(item) {
  const saved = Array.isArray(item.categorias) ? item.categorias : []
  const text = normalize(String(item.objeto || item.resumo || ''))
  return saved.filter((category) => categorySupportedByObject(category, text))
}

function displayCompatibility(item) {
  const saved = Array.isArray(item.categorias) ? item.categorias : []
  if (!saved.length) return 0
  return displayCategories(item).length ? Number(item.compatibilidade || 0) : 0
}

function categorySupportedByObject(category, text) {
  if (!text) return false
  const rules = {
    'MÁQUINAS': /\b(?:maquin\w*|hora\s+maquina|motonivelador\w*|patrolament\w*|retroescav\w*|escavadeir\w*|terraplan\w*)\b/,
    'AMBIENTAL': /\b(?:ambient\w*|licenciamento\s+ambiental|residuos?\s+solidos?)\b/,
    'ILUMINAÇÃO': /\b(?:iluminac\w*|luminari\w*|luminotecn\w*|luminos\w*)\b/,
    'ELÉTRICA': /\b(?:eletric\w*|eletricit\w*|subestac\w*|transformador\w*)\b/,
    'PODA E ARBORIZAÇÃO': /\b(?:poda\w*|arboriz\w*|arbore\w*|arvore\w*|supressao\s+vegetal)\b/,
    'NATAL': /\b(?:natal|natalin\w*|natalino\w*)\b/,
    'EVENTOS DE ILUMINAÇÃO': /\b(?:evento\w*|festividad\w*|show\w*|cenic\w*)\b.*\b(?:iluminac\w*|eletric\w*)\b|\b(?:iluminac\w*|eletric\w*)\b.*\b(?:evento\w*|festividad\w*|show\w*|cenic\w*)\b/,
    'CASCALHO': /\b(?:cascalh\w*|saibro\w*|laterita\w*)\b/,
    'REVESTIMENTO PRIMÁRIO': /\b(?:revestimento\s+primario|nao\s+pavimentad\w*|estrada\w*\s+vicinal\w*|patrolament\w*)\b/,
  }
  return rules[category] ? rules[category].test(text) : true
}

function isPavingAndDrainageText(text) {
  return /\b(?:pavimentac\w*\s+asfalt\w*|asfalto)\b/.test(text)
    && /\bdrenagem\s+(?:de\s+)?aguas?\s+pluviais?\b|\bdrenagem\s+pluvial\b/.test(text)
}

function conciseObject(value) {
  let text = String(value || '').replace(/\s+/g, ' ').trim()
  text = text
    .replace(/^o objeto (?:do|da) presente (?:contrato|licita[cç][aã]o|contrata[cç][aã]o) (?:é|e|consiste em)\s+(?:a|o)\s+/i, '')
    .replace(/^o objeto (?:é|e|consiste em)\s+(?:a|o)\s+/i, '')
    .replace(/^contrata[cç][aã]o de servi[cç]os de (?:uma )?empresa(?: especializada)? para\s+/i, '')
    .replace(/^contrata[cç][aã]o de (?:uma )?empresa(?: especializada)? para\s+/i, '')
    .replace(/^contrata[cç][aã]o para\s+/i, '')
  text = text.split(/(?:,\s*|\.\s+)(?:por meio|conforme|de acordo|nos termos|através|dotação orçamentária|as despesas decorrentes|processo n)/i)[0]
  text = text.split(/;\s*(?:conforme|de acordo|dotação|processo)/i)[0]
  text = text.replace(/[.;,:\s]+$/, '').trim()
  if (!text) return 'Objeto não informado pela fonte oficial'
  if (text === text.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÇ]/.test(text)) text = text.toLocaleLowerCase('pt-BR')
  text = text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1)
  if (text.length <= 118) return text
  const shortened = text.slice(0, 115).replace(/\s+\S*$/, '').trim()
  return `${shortened}…`
}

function statusForTender(item) {
  const official = normalize(item.situacao)
  if (/cancel|anulad|revogad|desert|fracassad/.test(official)) return { label: 'Cancelada', kind: 'cancelled' }
  if (/suspens|suspensa/.test(official)) return { label: 'Suspensa', kind: 'suspended' }
  if (/encerr|concluid|homologad|adjudicad|finalizad/.test(official)) return { label: 'Encerrada', kind: 'closed' }
  const deadline = new Date(item.data_encerramento || '')
  if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) return { label: 'Encerrada', kind: 'closed' }
  const opening = new Date(item.data_abertura || '')
  if (Number.isNaN(deadline.getTime()) && !Number.isNaN(opening.getTime()) && opening.getTime() < Date.now()) return { label: 'Encerrada', kind: 'closed' }
  return { label: 'Em prazo', kind: 'open' }
}

function countActiveFilters() {
  return FILTER_IDS.filter((name) => {
    const value = el(`${name}-filter`).value
    return value && !(name === 'compatibility' && value === '0')
  }).length
}

async function api(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente no JR Gestão.')
  const requestUrl = new URL(path, window.location.origin)
  const route = requestUrl.pathname
  if (route.endsWith('/licitacoes/calendario')) return queryCalendar(requestUrl.searchParams.get('month'))
  if (route.endsWith('/licitacoes/dia')) return queryDay(requestUrl.searchParams.get('date'), session.user.id)
  if (route.endsWith('/licitacoes/fontes-status')) return querySourceStatus()

  const favoriteMatch = route.match(/\/licitacoes\/([0-9a-f-]+)\/favorito$/i)
  if (favoriteMatch) return updateFavorite(favoriteMatch[1], session.user.id, JSON.parse(options.body || '{}'))
  const detailMatch = route.match(/\/licitacoes\/([0-9a-f-]+)$/i)
  if (detailMatch) return queryDetail(detailMatch[1], session.user.id)
  throw new Error('Consulta de licitações desconhecida.')
}

async function queryCalendar(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new Error('Mês inválido.')
  const [year, monthNumber] = month.split('-').map(Number)
  const start = `${month}-01`
  const nextDate = new Date(Date.UTC(year, monthNumber, 1))
  const end = nextDate.toISOString().slice(0, 10)
  const rows = await fetchPaged(() => supabase.from('licitacoes')
    .select('id,data_publicacao,is_campo_grande,compatibilidade')
    .gte('data_publicacao', start)
    .lt('data_publicacao', end)
    .order('data_publicacao', { ascending: true }), 20000)
  const days = {}
  rows.forEach((row) => {
    const day = days[row.data_publicacao] || { total: 0, prioritarias: 0, campoGrande: 0 }
    day.total += 1
    if (row.is_campo_grande) day.campoGrande += 1
    if (row.is_campo_grande && Number(row.compatibilidade || 0) >= PRIORITY_SCORE) day.prioritarias += 1
    days[row.data_publicacao] = day
  })
  return { month, days }
}

async function queryDay(date, userId) {
  if (!validDate(date)) throw new Error('Data inválida.')
  const [rows, favoriteRows] = await Promise.all([
    fetchPaged(() => supabase.from('licitacoes').select('*').eq('data_publicacao', date).order('compatibilidade', { ascending: false }).order('data_abertura', { ascending: true, nullsFirst: false }), 2000),
    checked(supabase.from('licitacao_favoritos').select('licitacao_id').eq('user_id', userId)),
  ])
  const favorites = new Set((favoriteRows || []).map((item) => item.licitacao_id))
  const results = rows.map((item) => ({ ...item, favoritada: favorites.has(item.id) }))
  return { date, total: results.length, results }
}

async function querySourceStatus() {
  const rows = await checked(supabase.from('licitacao_coletas')
    .select('fonte,status,iniciada_em,finalizada_em,itens_encontrados,itens_salvos,mensagem')
    .order('iniciada_em', { ascending: false })
    .limit(20))
  const sources = []
  const seen = new Set()
  for (const row of rows || []) {
    if (seen.has(row.fonte)) continue
    seen.add(row.fonte)
    sources.push(row)
  }
  return { sources }
}

async function queryDetail(id, userId) {
  const [tenderRows, sources, documents, requirements, favorites] = await Promise.all([
    checked(supabase.from('licitacoes').select('*').eq('id', id).limit(1)),
    checked(supabase.from('licitacao_fontes').select('*').eq('licitacao_id', id).order('data_publicacao', { ascending: true })),
    checked(supabase.from('licitacao_documentos').select('*').eq('licitacao_id', id).order('tipo', { ascending: true })),
    checked(supabase.from('licitacao_exigencias').select('*').eq('licitacao_id', id).order('categoria', { ascending: true })),
    checked(supabase.from('licitacao_favoritos').select('licitacao_id,observacao').eq('licitacao_id', id).eq('user_id', userId).limit(1)),
  ])
  const tender = tenderRows?.[0]
  if (!tender) throw new Error('Licitação não encontrada.')
  if (!(requirements || []).length && (documents || []).length) {
    checked(supabase.from('licitacao_fila_analise').upsert({ licitacao_id: id, prioridade: 10, status: 'pendente', solicitado_em: new Date().toISOString(), erro: null }, { onConflict: 'licitacao_id' })).catch(() => null)
  }
  return { tender: { ...tender, favoritada: Boolean(favorites?.length) }, sources: sources || [], documents: documents || [], requirements: requirements || [], analysisPending: !(requirements || []).length && Boolean((documents || []).length) }
}

async function updateFavorite(id, userId, payload) {
  const favorite = Boolean(payload.favorite)
  if (favorite) {
    await checked(supabase.from('licitacao_favoritos').upsert({ user_id: userId, licitacao_id: id, observacao: String(payload.note || '').slice(0, 500) }, { onConflict: 'user_id,licitacao_id' }))
  } else {
    await checked(supabase.from('licitacao_favoritos').delete().eq('user_id', userId).eq('licitacao_id', id))
  }
  return { favorite }
}

async function fetchPaged(buildQuery, maximum) {
  const rows = []
  const pageSize = 1000
  for (let offset = 0; offset < maximum; offset += pageSize) {
    const page = await checked(buildQuery().range(offset, offset + pageSize - 1))
    rows.push(...(page || []))
    if (!page || page.length < pageSize) break
  }
  return rows
}

async function checked(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

function closeDetail() {
  const dialog = el('tender-dialog')
  if (dialog.open) dialog.close()
}

function updateUrl({ tool, replace = false }) {
  const url = new URL(window.location.href)
  if (tool) {
    url.searchParams.set('ferramenta', state.scope === 'campo' ? 'campo-grande' : 'licitacoes')
    url.searchParams.set('data', state.selectedDate)
  }
  history[replace ? 'replaceState' : 'pushState']({}, '', url)
}

function openSafeUrl(value) {
  const url = safeUrl(value)
  if (!url) return showToast('A fonte não forneceu um endereço oficial válido.')
  window.open(url, '_blank', 'noopener,noreferrer')
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : ''
  } catch { return '' }
}

function pageUrl(value, page) {
  const url = safeUrl(value)
  if (!url || !page) return url
  try {
    const parsed = new URL(url)
    parsed.hash = `page=${Number(page)}`
    return parsed.toString()
  } catch { return url }
}

function todayInCampoGrande() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: DATE_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${map.year}-${map.month}-${map.day}`
}

function formatDate(value, options = {}) {
  if (!value) return 'Não informada'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'Não informada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: DATE_ZONE, dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function formatMoney(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function groupBy(values, getter) {
  return values.reduce((groups, value) => {
    const key = getter(value)
    groups[key] = groups[key] || []
    groups[key].push(value)
    return groups
  }, {})
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function trimText(value, maximum) {
  const text = String(value || '')
  return text.length > maximum ? `${text.slice(0, maximum - 1).trim()}…` : text
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

function readableError(error) {
  const message = String(error?.message || error || 'Erro inesperado.')
  if (/Failed to fetch|NetworkError/i.test(message)) return 'Não foi possível alcançar o Supabase. Confirme se o servidor no Docker e o endereço público estão ativos.'
  if (/permission denied|row-level security|42501/i.test(message)) return 'O acesso seguro do GitHub Pages ainda não foi habilitado no banco. Execute a atualização do módulo no PC servidor.'
  return message
}

function setLoadingMessage(message) {
  el('loading-message').textContent = message
}

function showToast(message) {
  clearTimeout(state.toastTimer)
  el('toast').textContent = message
  el('toast').classList.add('show')
  state.toastTimer = setTimeout(() => el('toast').classList.remove('show'), 3500)
}

function showFatal(error) {
  setLoadingMessage(readableError(error))
  el('admin-loading').querySelector('.loading-track').classList.add('hidden')
  window.setTimeout(() => {
    const link = document.createElement('a')
    link.href = '../'
    link.textContent = 'Voltar ao modo operacional'
    link.style.cssText = 'color:#0f6f4a;font-weight:800;font-size:.8rem'
    el('admin-loading').append(link)
  }, 400)
}
