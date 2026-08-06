import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, INTERNAL_LOGIN_DOMAIN } from './config.js?v=2'
import { hydrateIcons, icon } from './icons.js?v=9'
import { initializeUiControls, setUiControlValue, refreshCustomSelect, closeAllUiControls } from './ui-controls.js?v=9'
import {
  downloadCodesWorkbook,
  downloadNamesWorkbook,
  downloadMonthlyServicesWorkbook,
  downloadBlob,
} from './export-service.js?v=10'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const els = {
  loginView: $('#login-view'), appView: $('#app-view'), loginForm: $('#login-form'), loginButton: $('#login-button'), loginError: $('#login-error'),
  username: $('#username'), password: $('#password'), togglePassword: $('#toggle-password'), logoutButton: $('#logout-button'), adminName: $('#admin-name'),
  sidebar: $('#sidebar'), sidebarOverlay: $('#sidebar-overlay'), mobileMenuButton: $('#mobile-menu-button'),
  dateFilter: $('#date-filter'), monthFilter: $('#month-filter'), teamFilter: $('#team-filter'), refreshButton: $('#refresh-button'), searchInput: $('#search-input'),
  photosDateFilter: $('#photos-date-filter'), codesDateFilter: $('#codes-date-filter'), reportsDateFilter: $('#reports-date-filter'), reportsMonthFilter: $('#reports-month-filter'),
  photosRefreshButton: $('#photos-refresh-button'), codesRefreshButton: $('#codes-refresh-button'), reportsRefreshButton: $('#reports-refresh-button'), reportsMonthRefresh: $('#reports-month-refresh'), reportsMonthDownload: $('#reports-month-download'), reportsMonthPreview: $('#reports-month-preview'),
  statusBanner: $('#status-banner'), connectionStatus: $('#connection-status'),
  topTotal: $('#top-total'), topPoints: $('#top-points'), topPointsDay: $('#top-points-day'), topPointsNight: $('#top-points-night'), topSurveys: $('#top-surveys'), topSurveysDay: $('#top-surveys-day'), topSurveysNight: $('#top-surveys-night'), topDeleted: $('#top-deleted'), topPhotos: $('#top-photos'), topIssues: $('#top-issues'),
  dailyScoreTotal: $('#daily-score-total'), teamScoreGrid: $('#team-score-grid'),
  tableHead: $('#table-head'), tableBody: $('#table-body'), tableCount: $('#table-count'), loadingState: $('#loading-state'), emptyState: $('#empty-state'), loadMoreButton: $('#load-more-button'),
  autoRefreshToggle: $('#auto-refresh-toggle'), toast: $('#toast'),
  detailsDialog: $('#details-dialog'), detailsTitle: $('#details-title'), detailsBody: $('#details-body'), detailsClose: $('#details-close'),
  purgeDialog: $('#purge-dialog'), purgeTitle: $('#purge-title'), purgeDescription: $('#purge-description'), purgeClose: $('#purge-close'), purgeCancel: $('#purge-cancel'), purgeConfirm: $('#purge-confirm'),
  photosTeamList: $('#photos-team-list'), photosFolderDetail: $('#photos-folder-detail'), photosFolderTitle: $('#photos-folder-title'), photosFolderSummary: $('#photos-folder-summary'), photosGrid: $('#photos-grid'), photosBackButton: $('#photos-back-button'), photosTeamDownload: $('#photos-team-download'),
  codesTeamList: $('#codes-team-list'), codesTeamDetail: $('#codes-team-detail'), codesTeamTitle: $('#codes-team-title'), codesTeamSummary: $('#codes-team-summary'), codesPreview: $('#codes-preview'), codesBackButton: $('#codes-back-button'), codesTeamDownload: $('#codes-team-download'),
  reportsTeamList: $('#reports-team-list'), reportsTeamDetail: $('#reports-team-detail'), reportsTeamTitle: $('#reports-team-title'), reportsTeamSummary: $('#reports-team-summary'), reportsPreview: $('#reports-preview'), reportsBackButton: $('#reports-back-button'), reportsTeamDownload: $('#reports-team-download'),
  adminApiStatus: $('#admin-api-status'), newAccessButton: $('#new-access-button'), reloadAccessesButton: $('#reload-accesses-button'), accessesTableBody: $('#accesses-table-body'), accessesEmpty: $('#accesses-empty'),
  accessDialog: $('#access-dialog'), accessForm: $('#access-form'), accessDialogTitle: $('#access-dialog-title'), accessDialogClose: $('#access-dialog-close'), accessCancel: $('#access-cancel'), accessSave: $('#access-save'), accessUserId: $('#access-user-id'), accessRole: $('#access-role'), accessType: $('#access-type'), accessPermission: $('#access-permission'), accessTeamNameField: $('#access-team-name-field'), accessPermissionField: $('#access-permission-field'), accessUsername: $('#access-username'), accessTeamName: $('#access-team-name'), accessPassword: $('#access-password'), accessTogglePassword: $('#access-toggle-password'), accessPasswordHelp: $('#access-password-help'), accessActive: $('#access-active'), accessFormError: $('#access-form-error'),
  archiveAccessDialog: $('#archive-access-dialog'), archiveAccessTitle: $('#archive-access-title'), archiveAccessDescription: $('#archive-access-description'), archiveAccessClose: $('#archive-access-close'), archiveAccessCancel: $('#archive-access-cancel'), archiveAccessConfirm: $('#archive-access-confirm'),
}

const state = {
  profile: null,
  profiles: [],
  records: [],
  manifests: [],
  monthRecords: [],
  monthManifests: [],
  summary: null,
  monthSummary: null,
  tab: 'valid',
  page: 'home',
  search: '',
  visibleRows: 10,
  realtimeChannel: null,
  realtimeTimer: null,
  autoRefresh: true,
  loading: false,
  moduleTeams: { photos: null, codes: null, reports: null },
  purgeRecordId: null,
  adminApiReady: false,
  accessEditId: null,
  archiveAccessId: null,
}

hydrateIcons()
initializeUiControls()
setAllDateFilters(todayInSaoPaulo())
setUiControlValue('month-filter', todayInSaoPaulo().slice(0, 7))
setUiControlValue('reports-month-filter', todayInSaoPaulo().slice(0, 7))
bindEvents()
bootstrap()

function bindEvents() {
  els.loginForm.addEventListener('submit', handleLogin)
  els.togglePassword.addEventListener('click', togglePassword)
  els.accessTogglePassword.addEventListener('click', toggleAccessPassword)
  els.logoutButton.addEventListener('click', handleLogout)
  els.refreshButton.addEventListener('click', () => loadDashboard(true))
  els.monthFilter.addEventListener('change', () => { setUiControlValue('reports-month-filter', els.monthFilter.value); loadDashboard() })
  ;[els.photosRefreshButton, els.codesRefreshButton, els.reportsRefreshButton].forEach((button) => button?.addEventListener('click', () => loadDashboard(true)))
  els.reportsMonthFilter?.addEventListener('change', () => {
    const value = els.reportsMonthFilter.value || todayInSaoPaulo().slice(0, 7)
    setUiControlValue('month-filter', value)
    loadDashboard()
  })
  els.reportsMonthRefresh?.addEventListener('click', () => loadDashboard(true))
  els.reportsMonthDownload?.addEventListener('click', downloadMonthlyServicesReport)

  ;[els.dateFilter, els.photosDateFilter, els.codesDateFilter, els.reportsDateFilter].forEach((input) => {
    input?.addEventListener('change', () => {
      setAllDateFilters(input.value || todayInSaoPaulo())
      closeAllModuleDetails()
      loadDashboard()
    })
  })

  els.teamFilter.addEventListener('change', () => { state.visibleRows = 10; renderDashboard() })
  els.searchInput.addEventListener('input', (event) => { state.search = normalizeText(event.target.value); state.visibleRows = 10; renderTable() })
  els.loadMoreButton.addEventListener('click', () => { state.visibleRows = Number.MAX_SAFE_INTEGER; renderTable() })
  els.mobileMenuButton.addEventListener('click', openSidebar)
  els.sidebarOverlay.addEventListener('click', closeSidebar)
  els.detailsClose.addEventListener('click', () => els.detailsDialog.close())
  els.purgeClose.addEventListener('click', closePurgeDialog)
  els.purgeCancel.addEventListener('click', closePurgeDialog)
  els.purgeConfirm.addEventListener('click', purgeExcludedRecord)
  els.autoRefreshToggle.addEventListener('change', () => { state.autoRefresh = els.autoRefreshToggle.checked; toast(state.autoRefresh ? 'Atualização automática ativada.' : 'Atualização automática pausada.') })

  $$('.nav-item').forEach((button) => button.addEventListener('click', () => switchPage(button.dataset.page)))
  $$('.tab-button').forEach((button) => button.addEventListener('click', () => switchTableTab(button.dataset.tab)))

  els.photosBackButton.addEventListener('click', closePhotoFolder)
  els.codesBackButton.addEventListener('click', closeCodesTeam)
  els.reportsBackButton.addEventListener('click', closeReportsTeam)
  els.photosTeamDownload.addEventListener('click', () => downloadPhotosZipForTeam(state.moduleTeams.photos))
  els.codesTeamDownload.addEventListener('click', () => downloadCodesForTeam(state.moduleTeams.codes))
  els.reportsTeamDownload.addEventListener('click', () => downloadNamesForTeam(state.moduleTeams.reports))
  els.newAccessButton.addEventListener('click', () => openAccessDialog())
  els.reloadAccessesButton.addEventListener('click', () => loadProfiles(true))
  els.accessDialogClose.addEventListener('click', closeAccessDialog)
  els.accessCancel.addEventListener('click', closeAccessDialog)
  els.accessForm.addEventListener('submit', saveAccess)
  els.accessType.addEventListener('change', syncAccessFormFields)
  els.accessPermission.addEventListener('change', syncAccessRoleValue)
  els.archiveAccessClose.addEventListener('click', closeArchiveAccessDialog)
  els.archiveAccessCancel.addEventListener('click', closeArchiveAccessDialog)
  els.archiveAccessConfirm.addEventListener('click', archiveAccess)

  document.addEventListener('click', async (event) => {
    const detailsButton = event.target.closest('[data-details-id]')
    if (detailsButton) showRecordDetails(detailsButton.dataset.detailsId)

    const purgeButton = event.target.closest('[data-purge-id]')
    if (purgeButton) openPurgeDialog(purgeButton.dataset.purgeId)

    const photoButton = event.target.closest('[data-photo-path]')
    if (photoButton) await openStoragePhoto(photoButton.dataset.photoBucket || 'fotos', photoButton.dataset.photoPath)

    const photoTeamButton = event.target.closest('[data-open-photo-team]')
    if (photoTeamButton) await openPhotoFolder(decodeURIComponent(photoTeamButton.dataset.openPhotoTeam))

    const codeTeamButton = event.target.closest('[data-open-code-team]')
    if (codeTeamButton) openCodesTeam(decodeURIComponent(codeTeamButton.dataset.openCodeTeam))

    const reportTeamButton = event.target.closest('[data-open-report-team]')
    if (reportTeamButton) openReportsTeam(decodeURIComponent(reportTeamButton.dataset.openReportTeam))

    const editAccessButton = event.target.closest('[data-edit-access]')
    if (editAccessButton) openAccessDialog(editAccessButton.dataset.editAccess)

    const passwordAccessButton = event.target.closest('[data-password-access]')
    if (passwordAccessButton) openAccessDialog(passwordAccessButton.dataset.passwordAccess, true)

    const archiveAccessButton = event.target.closest('[data-archive-access]')
    if (archiveAccessButton) openArchiveAccessDialog(archiveAccessButton.dataset.archiveAccess)
  })
}

async function bootstrap() {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    try { await authorizeAndOpen(data.session.user) } catch (error) { await supabase.auth.signOut(); showLogin(); toast(friendlyError(error), true) }
  } else showLogin()

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) showLogin()
  })
}

async function handleLogin(event) {
  event.preventDefault()
  els.loginError.textContent = ''
  setButtonLoading(els.loginButton, true, 'ENTRANDO...')
  try {
    const email = loginEmailFromInput(els.username.value)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: els.password.value })
    if (error) throw error
    await authorizeAndOpen(data.user)
  } catch (error) {
    els.loginError.textContent = friendlyError(error)
  } finally {
    setButtonLoading(els.loginButton, false, 'ENTRAR')
  }
}

async function authorizeAndOpen(user) {
  const { data: profile, error } = await supabase.from('profiles').select('id, username, team_name, active, role').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!profile?.active || !['admin', 'viewer'].includes(profile.role)) {
    await supabase.auth.signOut()
    throw new Error('Este login não está liberado para acessar o painel administrativo.')
  }

  state.profile = profile
  els.adminName.textContent = profile.username || 'Administrador'
  applyRoleUi()
  showApp()
  await loadProfiles()
  await loadDashboard()
  if (isAdmin()) await checkAdminApi()
  subscribeRealtime()
}

async function handleLogout() {
  await supabase.auth.signOut()
  stopRealtime()
  showLogin()
}

async function loadProfiles(showSuccessToast = false) {
  const { data, error } = await supabase.from('profiles').select('id, username, team_name, active, role').order('team_name')
  if (error) throw error
  state.profiles = data || []

  const previous = els.teamFilter.value
  const teams = configuredTeamNames()
  els.teamFilter.innerHTML = '<option value="all">Todas as equipes</option>' + teams.map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`).join('')
  els.teamFilter.value = [...els.teamFilter.options].some((option) => option.value === previous) ? previous : 'all'
  refreshCustomSelect('team-filter')
  renderAccesses()
  if (showSuccessToast) toast('Lista de acessos atualizada.')
}

async function loadDashboard(showSuccessToast = false) {
  if (state.loading) return
  setLoading(true)
  try {
    const date = currentDate()
    const month = monthRangeFromValue(currentMonth())
    const dayNext = addDays(date, 1)

    const monthFetchStart = `${addDays(month.start, -1)}T00:00:00.000Z`
    const monthFetchEnd = `${addDays(month.next, 1)}T00:00:00.000Z`
    const dayFetchStart = `${addDays(date, -1)}T00:00:00.000Z`
    const dayFetchEnd = `${addDays(dayNext, 1)}T00:00:00.000Z`

    const [monthRecords, monthManifests, dayRecords, dayManifests] = await Promise.all([
      fetchAllRows((from, to) => supabase
        .from('service_records')
        .select('id, user_id, data, registro, device_id, deleted_at, deleted_by, deleted_device_id, updated_at, sync_version')
        .gte('data', monthFetchStart)
        .lt('data', monthFetchEnd)
        .order('data', { ascending: true })
        .range(from, to)),
      fetchAllRows((from, to) => supabase
        .from('day_sync_manifests')
        .select('*')
        .gte('work_date', month.start)
        .lt('work_date', month.next)
        .order('sent_at', { ascending: false })
        .range(from, to)),
      fetchAllRows((from, to) => supabase
        .from('service_records')
        .select('id, user_id, data, registro, device_id, deleted_at, deleted_by, deleted_device_id, updated_at, sync_version')
        .gte('data', dayFetchStart)
        .lt('data', dayFetchEnd)
        .order('data', { ascending: true })
        .range(from, to)),
      fetchAllRows((from, to) => supabase
        .from('day_sync_manifests')
        .select('*')
        .gte('work_date', date)
        .lt('work_date', dayNext)
        .order('sent_at', { ascending: false })
        .range(from, to)),
    ])

    state.monthRecords = monthRecords.filter((row) => {
      const key = serviceDateKey(row)
      return key >= month.start && key < month.next
    })
    state.monthManifests = monthManifests.filter((manifest) => {
      const key = String(manifest.work_date || '').slice(0, 10)
      return key >= month.start && key < month.next
    })
    state.records = dayRecords.filter((row) => serviceDateKey(row) === date)
    state.manifests = dayManifests.filter((manifest) => String(manifest.work_date || '').slice(0, 10) === date)
    state.visibleRows = 10
    publishServicesMonthCache()
    renderDashboard()
    setConnection(true)
    if (showSuccessToast) toast('Dados atualizados com sucesso.')
  } catch (error) {
    setConnection(false)
    toast(friendlyError(error), true)
  } finally {
    setLoading(false)
  }
}

function publishServicesMonthCache() {
  const detail = {
    month: currentMonth(),
    records: state.monthRecords,
    profiles: state.profiles,
    profile: state.profile,
    updatedAt: Date.now(),
  }
  window.__JR_SERVICES_MONTH_CACHE__ = detail
  document.dispatchEvent(new CustomEvent('jr:monthdata', { detail }))
}

async function fetchAllRows(fetchPage, pageSize = 1000) {
  const rows = []
  let from = 0
  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await fetchPage(from, to)
    if (error) throw error
    const page = data || []
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }
  return rows
}

function renderDashboard() {
  const team = els.teamFilter.value
  const profileMap = profileMapById()

  // JR_FIX_MONTH_SUMMARY_IGNORES_DAILY_FILTERS_V1
  // Data de serviço e Equipe filtram somente a pontuação diária por equipe.
  // O resumo mensal usa todas as equipes do mês escolhido no month-filter.
  const records = team === 'all' ? state.records : recordsForTeam(team, profileMap)
  const manifests = team === 'all' ? state.manifests : manifestsForTeam(team, profileMap)

  state.summary = buildSummary(records, manifests, profileMap)
  state.monthSummary = buildSummary(
    state.monthRecords,
    state.monthManifests,
    profileMap,
  )
  renderMetrics()
  renderStatus()
  renderTeamScores()
  renderTable()
  renderModulePages()
}

function buildSummary(records, manifests, profileMap) {
  const active = records.filter((row) => !row.deleted_at)
  const deleted = records.filter((row) => row.deleted_at)
  const activeIds = new Set(active.map((row) => String(row.id)))
  const deletedIds = new Set(deleted.map((row) => String(row.id)))
  const expectedActive = unionJsonArrays(manifests, 'active_record_ids')
  const expectedDeleted = unionJsonArrays(manifests, 'deleted_record_ids')
  const pendingIds = unionJsonArrays(manifests, 'pending_record_ids')
  const conflictIds = unionJsonArrays(manifests, 'conflict_record_ids')
  const missingRecordIds = [...expectedActive].filter((id) => !activeIds.has(id) && !deletedIds.has(id))
  const deletionPendingIds = [...expectedDeleted].filter((id) => activeIds.has(id))

  let expectedPhotos = 0
  let receivedPhotos = 0
  const missingPhotos = []
  for (const row of active) {
    const record = row.registro || {}
    const label = recordLabel(row, profileMap)
    if (photoExpected(record, 'time')) {
      expectedPhotos += 1
      if (hasText(record.timePhotoStoragePath)) receivedPhotos += 1
      else missingPhotos.push({ type: 'Foto faltando', title: 'Foto de horário não chegou ao Storage', detail: label, severity: 'danger' })
    }
    if (photoExpected(record, 'survey')) {
      expectedPhotos += 1
      if (hasText(record.surveyPhotoStoragePath)) receivedPhotos += 1
      else missingPhotos.push({ type: 'Foto faltando', title: 'Foto de levantamento não chegou ao Storage', detail: label, severity: 'danger' })
    }
  }

  const issues = []
  missingRecordIds.forEach((id) => issues.push({ type: 'Ponto não recebido', title: 'Ponto salvo no celular, mas ausente no Supabase', detail: `ID ${id}`, severity: 'danger' }))
  deletionPendingIds.forEach((id) => issues.push({ type: 'Exclusão pendente', title: 'O celular excluiu, mas o Supabase ainda mostra como válido', detail: `ID ${id}`, severity: 'danger' }))
  pendingIds.forEach((id) => issues.push({ type: 'Fila de envio', title: 'Alteração aguardando confirmação do servidor', detail: `ID ${id}`, severity: 'warning' }))
  conflictIds.forEach((id) => issues.push({ type: 'Conflito', title: 'Ponto alterado em mais de um celular', detail: `ID ${id}`, severity: 'danger' }))
  issues.push(...missingPhotos)

  const latestManifest = manifests.map((manifest) => new Date(manifest.sent_at)).filter((date) => !Number.isNaN(date.getTime())).sort((a, b) => b - a)[0] || null
  const dedupedIssues = dedupeIssues(issues)
  const score = scoreBreakdown(active)
  return {
    records, active, deleted, manifests, profileMap, expectedPhotos, receivedPhotos, score,
    issues: dedupedIssues, criticalCount: dedupedIssues.length, latestManifest,
  }
}

function renderMetrics() {
  const summary = state.monthSummary
  if (!summary) return
  const totalPoints = summary.score.dayPoints + summary.score.nightPoints
  const totalSurveys = summary.score.daySurveys + summary.score.nightSurveys
  els.topTotal.textContent = summary.score.total
  els.topPoints.textContent = totalPoints
  els.topPointsDay.textContent = summary.score.dayPoints
  els.topPointsNight.textContent = summary.score.nightPoints
  els.topSurveys.textContent = totalSurveys
  els.topSurveysDay.textContent = summary.score.daySurveys
  els.topSurveysNight.textContent = summary.score.nightSurveys
  els.topDeleted.textContent = summary.deleted.length
  els.topPhotos.textContent = `${summary.receivedPhotos}/${summary.expectedPhotos}`
  els.topIssues.textContent = summary.criticalCount
}

function renderTeamScores() {
  if (!els.teamScoreGrid) return
  const selected = els.teamFilter.value
  const teams = selected === 'all' ? teamsForCurrentDate() : [selected]
  renderDailyScoreTotal()
  if (teams.length === 0) {
    els.teamScoreGrid.innerHTML = moduleEmpty('Nenhuma equipe cadastrada ou com dados nesta data.')
    return
  }

  els.teamScoreGrid.innerHTML = teams.map((team) => {
    const summary = summaryForTeam(team)
    const score = summary.score
    return `<article class="team-score-card ${score.total > 0 ? 'has-score' : ''}">
      <div class="team-score-header">
        <div><span class="team-score-label">EQUIPE</span><strong>${escapeHtml(team)}</strong></div>
        <div class="team-score-total"><span>TOTAL</span><strong>${score.total}</strong></div>
      </div>
      <div class="team-score-values">
        ${scoreItem('sun', 'Pontos manhã/tarde', score.dayPoints)}
        ${scoreItem('sun', 'Levantamentos manhã/tarde', score.daySurveys)}
        ${scoreItem('moon', 'Pontos noite', score.nightPoints)}
        ${scoreItem('moon', 'Levantamentos noite', score.nightSurveys)}
      </div>
      <div class="team-score-footer"><span>${summary.active.length} registro(s) válido(s)</span><span>${summary.deleted.length} excluído(s)</span></div>
    </article>`
  }).join('')
}

function renderDailyScoreTotal() {
  if (!els.dailyScoreTotal || !state.summary) return
  const score = state.summary.score
  const points = score.dayPoints + score.nightPoints
  const surveys = score.daySurveys + score.nightSurveys
  const scope = els.teamFilter.value === 'all' ? 'TODAS AS EQUIPES' : els.teamFilter.value

  // Administrador e somente leitura veem o mesmo detalhamento da pontuação diária.
  // Fotos e pendências críticas continuam exclusivas do administrador.
  const baseValues = `
    <span class="daily-period-card"><small>PONTOS MANHÃ/TARDE</small><strong>${score.dayPoints}</strong></span>
    <span class="daily-period-card night"><small>PONTOS NOITE</small><strong>${score.nightPoints}</strong></span>
    <span class="daily-period-card"><small>LEVANTAMENTOS MANHÃ/TARDE</small><strong>${score.daySurveys}</strong></span>
    <span class="daily-period-card night"><small>LEVANTAMENTOS NOITE</small><strong>${score.nightSurveys}</strong></span>
    <span class="daily-total-grand"><small>TOTAL GERAL</small><strong>${score.total}</strong></span>`
  let extraValues = ''

  if (isAdmin()) {
    const photoValue = `${state.summary.receivedPhotos}/${state.summary.expectedPhotos}`
    const issueClass = state.summary.criticalCount > 0 ? 'daily-total-warning has-issues' : 'daily-total-warning'
    extraValues = `<span class="daily-total-photos"><small>FOTOS RECEBIDAS</small><strong>${photoValue}</strong><em>Recebidas na data selecionada</em></span><span class="${issueClass}"><small>PENDÊNCIAS CRÍTICAS</small><strong>${state.summary.criticalCount}</strong><em>Exigem atenção</em></span>`
  }

  els.dailyScoreTotal.classList.toggle('viewer-compact', false)
  els.dailyScoreTotal.classList.toggle('viewer-detailed', !isAdmin())
  els.dailyScoreTotal.classList.toggle('admin-detailed', isAdmin())
  els.dailyScoreTotal.innerHTML = `<div class="daily-total-copy"><span class="eyebrow">PONTUAÇÃO TOTAL DO DIA</span><strong>${escapeHtml(scope)}</strong><small>${formatDate(currentDate())}</small></div><div class="daily-total-values">${baseValues}${extraValues}</div>`
}

function scoreItem(iconName, label, value) {
  return `<div class="team-score-item"><span class="team-score-item-icon">${icon(iconName)}</span><div><small>${escapeHtml(label)}</small><strong>${value}</strong></div></div>`
}

function renderStatus() {
  const summary = state.summary
  const date = formatDate(currentDate())
  let className = ''
  let title = 'Sem movimentação'
  let description = `Nenhum ponto ou manifesto encontrado em ${date}.`
  if (summary.records.length > 0 && summary.manifests.length === 0) {
    className = 'warning'; title = 'Aguardando manifesto automático'; description = 'Os registros chegaram, mas o celular ainda não enviou a lista independente para conferência.'
  } else if (summary.criticalCount > 0) {
    className = 'danger'; title = 'Envio incompleto'; description = `${summary.criticalCount} pendência(s) encontrada(s). Os arquivos continuam sendo preparados apenas com pontos válidos.`
  } else if (summary.manifests.length > 0) {
    className = 'success'; title = 'Envio completo'; description = `Todos os pontos declarados pelo celular chegaram. Última conferência: ${formatDateTime(summary.latestManifest)}.`
  } else if (summary.records.length > 0) {
    className = 'success'; title = 'Pontos recebidos'; description = 'Os registros do Supabase foram encontrados para esta data e equipe.'
  }
  els.statusBanner.className = `status-banner ${className}`
  els.statusBanner.innerHTML = `<div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><div><strong>${escapeHtml(date)}</strong><span>${escapeHtml(teamLabel())}</span></div>`
}

function switchTableTab(tab) {
  state.tab = tab
  state.visibleRows = 10
  $$('.tab-button').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab))
  renderTable()
}

function renderTable() {
  const summary = state.summary
  if (!summary) return
  const configs = {
    valid: { head: ['ORDEM', 'RUA', 'NÚMERO', 'EQUIPE', 'DATA/HORÁRIO', 'CONTAGEM', 'STATUS', 'AÇÕES'], rows: summary.active, render: renderValidRow },
    deleted: { head: ['ORDEM', 'RUA', 'EQUIPE', 'EXCLUÍDO EM', 'STATUS', 'AÇÕES'], rows: summary.deleted, render: renderDeletedRow },
    issues: { head: ['TIPO', 'PROBLEMA', 'DETALHE', 'PRIORIDADE'], rows: summary.issues, render: renderIssueRow },
  }
  const config = configs[state.tab]
  const orderedRows = [...config.rows].sort((a, b) => {
    if (state.tab === 'valid') return recordSortTimestamp(b) - recordSortTimestamp(a)
    if (state.tab === 'deleted') return dateTimestamp(b.deleted_at) - dateTimestamp(a.deleted_at)
    return 0
  })
  const filtered = orderedRows.filter((row) => rowMatchesSearch(row, state.tab, summary.profileMap))
  const visible = filtered.slice(0, state.visibleRows)
  els.tableHead.innerHTML = `<tr>${config.head.map((item) => `<th>${item}</th>`).join('')}</tr>`
  els.tableBody.innerHTML = visible.map((row) => config.render(row, summary.profileMap)).join('')
  els.tableCount.textContent = `${filtered.length} registro(s)`
  els.emptyState.classList.toggle('hidden', filtered.length > 0 || state.loading)
  els.loadMoreButton.classList.toggle('hidden', visible.length >= filtered.length)
}

function renderValidRow(row, profileMap) {
  const record = row.registro || {}
  const count = recordScore(row)
  const period = isMorningRecord(row) ? 'MANHÃ' : 'NOITE'
  return `<tr><td>${escapeHtml(record.orderNumber || '—')}</td><td>${escapeHtml(streetName(record) || '—')}</td><td>${escapeHtml(record.number || '0')}</td><td>${escapeHtml(recordTeam(row, profileMap) || '—')}</td><td>${escapeHtml(formatDateTime(recordDisplayDateTime(row)))}</td><td><span class="count-pill" title="${escapeHtml(count.label)}">${count.total} • ${period}</span></td><td><span class="status-pill confirmed">CONFIRMADO</span></td><td><button class="table-action" data-details-id="${escapeHtml(row.id)}" aria-label="Visualizar registro">${icon('eye')}</button></td></tr>`
}

function renderDeletedRow(row, profileMap) {
  const record = row.registro || {}
  const purgeAction = isAdmin() ? `<button class="table-action danger" data-purge-id="${escapeHtml(row.id)}" aria-label="Excluir definitivamente do Supabase" title="Excluir definitivamente do Supabase">${icon('trash')}</button>` : ''
  return `<tr><td>${escapeHtml(record.orderNumber || '—')}</td><td>${escapeHtml(streetName(record) || '—')}</td><td>${escapeHtml(recordTeam(row, profileMap) || '—')}</td><td>${escapeHtml(formatDateTime(row.deleted_at))}</td><td><span class="status-pill deleted">EXCLUÍDO</span></td><td><div class="table-action-group"><button class="table-action" data-details-id="${escapeHtml(row.id)}" aria-label="Visualizar registro excluído">${icon('eye')}</button>${purgeAction}</div></td></tr>`
}

function renderIssueRow(item) {
  return `<tr><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail)}</td><td><span class="status-pill pending">${item.severity === 'danger' ? 'CRÍTICA' : 'ATENÇÃO'}</span></td></tr>`
}

function rowMatchesSearch(row, tab, profileMap) {
  if (!state.search) return true
  if (tab === 'issues') return normalizeText(`${row.type} ${row.title} ${row.detail}`).includes(state.search)
  const record = row.registro || {}
  const team = recordTeam(row, profileMap)
  return normalizeText(`${record.orderNumber} ${streetName(record)} ${record.number} ${team} ${record.stampedTimeText} ${row.id}`).includes(state.search)
}

function showRecordDetails(id) {
  const row = state.summary?.records.find((item) => String(item.id) === String(id)) || state.records.find((item) => String(item.id) === String(id))
  if (!row) return
  const record = row.registro || {}
  const profileMap = profileMapById()
  els.detailsTitle.textContent = record.orderNumber ? `Ordem ${record.orderNumber}` : 'Ponto sem ordem'
  const details = [
    ['Situação', row.deleted_at ? 'Excluído — não entra nas planilhas' : 'Válido — entra nas planilhas'],
    ['Contagem', row.deleted_at ? 'Fora da pontuação' : `${recordScore(row).label} — ${recordScore(row).total} ponto(s)`],
    ['Período', isMorningRecord(row) ? 'Manhã/tarde' : 'Noite'],
    ['Equipe', recordTeam(row, profileMap) || '—'], ['Data/hora', formatDateTime(record.timePhotoTakenAt || row.data)],
    ['Rua', streetName(record) || '—'], ['Número', record.number || '0'], ['Bairro', neighborhoodName(record) || '—'],
    ['Serviço', displayName(record.serviceType?.name) || '—'], ['Ordem de serviço', record.orderNumber || '—'], ['Observação', record.observation || '—'],
    ['ID', row.id], ['Sincronização', `Versão ${row.sync_version ?? 0}`], ['Aparelho', row.device_id || '—'],
  ]
  const photoButtons = [
    photoButton(record.timePhotoStorageBucket, record.timePhotoStoragePath, 'Abrir foto de horário'),
    photoButton(record.surveyPhotoStorageBucket, record.surveyPhotoStoragePath, 'Abrir levantamento'),
  ].filter(Boolean).join('')
  els.detailsBody.innerHTML = `<div class="details-grid">${details.map(([label, value]) => `<div class="detail-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('')}</div>${photoButtons ? `<div class="photo-actions">${photoButtons}</div>` : ''}`
  els.detailsDialog.showModal()
}

function photoButton(bucket, path, label) {
  if (!hasText(path)) return ''
  return `<button class="outline-button" data-photo-bucket="${escapeHtml(bucket || 'fotos')}" data-photo-path="${escapeHtml(path)}">${icon('image')}${escapeHtml(label)}</button>`
}

function openPurgeDialog(id) {
  if (!isAdmin()) return
  const row = state.records.find((item) => String(item.id) === String(id))
  if (!row || !row.deleted_at) {
    toast('Somente pontos já excluídos podem ser apagados definitivamente.', true)
    return
  }
  state.purgeRecordId = String(id)
  const record = row.registro || {}
  els.purgeTitle.textContent = record.orderNumber ? `Ordem ${record.orderNumber}` : `Registro ${row.id}`
  els.purgeDescription.textContent = `${recordTeam(row) || 'Equipe sem nome'} • ${streetName(record) || 'Sem rua'}. O registro e as fotos vinculadas serão removidos definitivamente.`
  els.purgeDialog.showModal()
}

function closePurgeDialog() {
  state.purgeRecordId = null
  if (els.purgeDialog.open) els.purgeDialog.close()
}

async function purgeExcludedRecord() {
  const id = state.purgeRecordId
  const row = state.records.find((item) => String(item.id) === String(id))
  if (!id || !row?.deleted_at) return

  setButtonLoading(els.purgeConfirm, true, 'EXCLUINDO...')
  try {
    const { error } = await supabase.rpc('admin_purge_excluded_record', { p_record_id: id })
    if (error) throw error

    const storageGroups = storagePathsByBucket(row.registro || {})
    let storageWarning = false
    for (const [bucket, paths] of storageGroups) {
      if (paths.length === 0) continue
      const { error: storageError } = await supabase.storage.from(bucket).remove(paths)
      if (storageError) storageWarning = true
    }

    closePurgeDialog()
    await loadDashboard()
    toast(storageWarning ? 'Ponto removido do Supabase. Algumas fotos não puderam ser apagadas do Storage.' : 'Ponto e fotos removidos definitivamente do Supabase.', storageWarning)
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    setButtonLoading(els.purgeConfirm, false, 'EXCLUIR DO SUPABASE')
  }
}

function storagePathsByBucket(record) {
  const groups = new Map()
  const add = (bucket, path) => {
    if (!hasText(path)) return
    const key = String(bucket || 'fotos')
    if (!groups.has(key)) groups.set(key, [])
    if (!groups.get(key).includes(String(path))) groups.get(key).push(String(path))
  }
  add(record.timePhotoStorageBucket, record.timePhotoStoragePath)
  add(record.timePhotoThumbnailStorageBucket || record.timePhotoStorageBucket, record.timePhotoThumbnailStoragePath)
  add(record.surveyPhotoStorageBucket, record.surveyPhotoStoragePath)
  add(record.surveyPhotoThumbnailStorageBucket || record.surveyPhotoStorageBucket, record.surveyPhotoThumbnailStoragePath)
  return groups
}

async function openStoragePhoto(bucket, path) {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 180)
    if (error) throw error
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  } catch (error) { toast(friendlyError(error), true) }
}

function renderModulePages() {
  const teams = teamsForCurrentDate()
  renderPhotoTeams(teams)
  renderCodeTeams(teams)
  renderReportTeams(teams)
  renderMonthlyServicesPreview()

  if (state.moduleTeams.photos) refreshOpenPhotoFolder()
  if (state.moduleTeams.codes) openCodesTeam(state.moduleTeams.codes, true)
  if (state.moduleTeams.reports) openReportsTeam(state.moduleTeams.reports, true)
}

function renderPhotoTeams(teams) {
  if (!els.photosTeamList) return
  if (teams.length === 0) {
    els.photosTeamList.innerHTML = moduleEmpty('Nenhuma equipe com dados nesta data.')
    return
  }
  els.photosTeamList.innerHTML = teams.map((team) => {
    const summary = summaryForTeam(team)
    return teamFolderCard({
      team,
      action: 'data-open-photo-team',
      iconName: 'image',
      headline: `${summary.receivedPhotos}/${summary.expectedPhotos} fotos recebidas`,
      detail: `${summary.active.length} ponto(s) válido(s) • ${summary.criticalCount} pendência(s)`,
      badge: summary.receivedPhotos === summary.expectedPhotos && summary.expectedPhotos > 0 ? 'COMPLETO' : summary.expectedPhotos === 0 ? 'SEM FOTOS' : 'INCOMPLETO',
      badgeClass: summary.receivedPhotos === summary.expectedPhotos && summary.expectedPhotos > 0 ? 'confirmed' : 'pending',
    })
  }).join('')
}

function renderCodeTeams(teams) {
  if (!els.codesTeamList) return
  if (teams.length === 0) {
    els.codesTeamList.innerHTML = moduleEmpty('Nenhuma equipe com pontos nesta data.')
    return
  }
  els.codesTeamList.innerHTML = teams.map((team) => {
    const summary = summaryForTeam(team)
    return teamFolderCard({
      team,
      action: 'data-open-code-team',
      iconName: 'table',
      headline: `${summary.score.total} ponto(s) contabilizado(s)`,
      detail: `${summary.active.length} registro(s) válido(s) • ${summary.deleted.length} excluído(s)`,
      badge: summary.active.length > 0 ? 'PRONTO' : 'VAZIO',
      badgeClass: summary.active.length > 0 ? 'confirmed' : 'pending',
    })
  }).join('')
}


function monthlyValidRecords() {
  return state.monthRecords.filter((row) => !row.deleted_at)
}

function reportProductItems(record) {
  return Array.isArray(record?.products) ? record.products.map((entry) => ({
    code: String(entry?.product?.code || '').trim(),
    name: String(entry?.product?.name || '').trim(),
    quantity: Number(entry?.quantity || 0) || 0,
  })) : []
}

function reportServiceLabel(record) {
  const code = String(record?.serviceType?.code || '').trim()
  const name = String(record?.serviceType?.name || '').trim()
  return [code, name].filter(Boolean).join(' - ') || 'SERVIÇO NÃO INFORMADO'
}

function reportImportantLabels(record) {
  const code = String(record?.serviceType?.code || '').trim()
  const serviceName = normalizeText(record?.serviceType?.name || '')
  const observationRaw = String(record?.observation || '')
  const observation = normalizeText(observationRaw)
  const products = reportProductItems(record)
  const labels = new Set()
  const add = (value) => { if (value) labels.add(value) }

  if (code === '134' || ['lancamento de cabo', 'lancamento cabo', 'lanc cabo', 'cabo aereo', 'cabo subterraneo', 'duplex', 'triplex', 'quadriplex'].some((term) => serviceName.includes(term) || observation.includes(term))) add('LANÇAMENTO DE CABO')
  if (code === '42' || ['escavacao', 'valeta', 'buraco'].some((term) => serviceName.includes(term) || observation.includes(term))) add('ESCAVAÇÃO DE VALETA')
  if (['implantacao de poste', 'implatacao de poste', 'poste novo'].some((term) => serviceName.includes(term) || observation.includes(term))) add('IMPLANTAÇÃO DE POSTE')
  if (serviceName.includes('caixa de comando') || observation.includes('caixa de comando')) add('CAIXA DE COMANDO')
  if (serviceName.includes('padrao') || observation.includes('padrao')) add('PADRÃO')

  if (products.some((item) => item.code === '16' || ['contactora', 'contatora', 'contactor', 'contator'].some((term) => normalizeText(item.name).includes(term)))) add('CONTACTORA')
  if (['contactora', 'contatora', 'contactor', 'contator'].some((term) => observation.includes(term))) add('CONTACTORA')
  if (observation.includes('tomada') || serviceName.includes('tomada')) add('INSTALAÇÃO DE TOMADA')

  const namedPattern = /(evento|event|pra[çc]a|campo(?:\s+de\s+futebol)?)\s*[:\-]\s*([^;|/\n]+)/gi
  let namedMatch
  while ((namedMatch = namedPattern.exec(observationRaw)) !== null) {
    const kindNormalized = normalizeText(namedMatch[1])
    const detail = String(namedMatch[2] || '').trim().replace(/\s+/g, ' ')
    const kind = kindNormalized.startsWith('event') ? 'EVENTO' : kindNormalized.startsWith('praca') ? 'PRAÇA' : 'CAMPO DE FUTEBOL'
    add(detail && normalizeText(detail) !== normalizeText(kind) ? `${kind}: ${detail.toUpperCase()}` : kind)
  }
  if (observation.includes('evento') && ![...labels].some((item) => item.startsWith('EVENTO'))) add('EVENTO')
  if (observation.includes('praca') && ![...labels].some((item) => item.startsWith('PRAÇA'))) add('PRAÇA')
  if ((observation.includes('campo de futebol') || observation.includes('futebol')) && ![...labels].some((item) => item.startsWith('CAMPO DE FUTEBOL'))) add('CAMPO DE FUTEBOL')

  return [...labels]
}

function reportMaterialCounts(record) {
  const result = { rele: 0, fio: 0, led: 0 }
  reportProductItems(record).forEach((item) => {
    const quantity = item.quantity > 0 ? item.quantity : 1
    const name = normalizeText(item.name)
    if (item.code === '15' || name.includes('rele')) result.rele += quantity
    if (item.code === '100' || name.includes('fiacao') || name === 'fio') result.fio += quantity
  })
  const serviceCode = String(record?.serviceType?.code || '').trim()
  const observation = normalizeText(record?.observation || '')
  if (serviceCode === '122' || (observation.includes('led') && (observation.includes('troca') || observation.includes('defeito')))) result.led += 1
  return result
}

function buildMonthlyServicesData(records = monthlyValidRecords()) {
  const profileMap = profileMapById()
  const teams = new Set()
  const dates = new Set()
  const byDayTeam = new Map()
  const byServiceTeam = new Map()
  const base = []

  records.forEach((row) => {
    const record = row.registro || {}
    const date = serviceDateKey(row)
    if (!date) return
    const team = recordTeam(row, profileMap) || 'Sem equipe'
    const score = recordScore(row)
    const morning = isMorningRecord(row)
    const period = morning ? 'MANHÃ/TARDE' : 'NOITE'
    const key = `${date}|${team}`
    if (!byDayTeam.has(key)) byDayTeam.set(key, { date, team, dayPoints: 0, daySurveys: 0, nightPoints: 0, nightSurveys: 0, important: new Set(), materials: { rele: 0, fio: 0, led: 0 } })
    const day = byDayTeam.get(key)
    if (morning) {
      day.dayPoints += score.normal
      day.daySurveys += score.levantamento
    } else {
      day.nightPoints += score.normal
      day.nightSurveys += score.levantamento
    }
    reportImportantLabels(record).forEach((label) => day.important.add(label))
    const materials = reportMaterialCounts(record)
    day.materials.rele += materials.rele
    day.materials.fio += materials.fio
    day.materials.led += materials.led

    const service = reportServiceLabel(record)
    const serviceKey = `${team}|${service}`
    if (!byServiceTeam.has(serviceKey)) byServiceTeam.set(serviceKey, { team, service, total: 0, day: 0, night: 0 })
    const serviceItem = byServiceTeam.get(serviceKey)
    serviceItem.total += 1
    if (morning) serviceItem.day += 1
    else serviceItem.night += 1

    base.push({
      date,
      team,
      period,
      type: isServiceLevantamento(record) ? 'LEVANTAMENTO' : 'NORMAL',
      service,
      order: String(record.orderNumber || ''),
      street: streetName(record) || '',
      number: String(record.number || ''),
      neighborhood: String(record.neighborhood?.name || ''),
      observation: String(record.observation || ''),
      products: reportProductItems(record).map((item) => `${item.code || item.name}${item.quantity ? ` (${item.quantity})` : ''}`).join(' / '),
      important: reportImportantLabels(record).join(' / '),
    })
    teams.add(team)
    dates.add(date)
  })

  return {
    teams: [...teams].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    dates: [...dates].sort(),
    dayRows: [...byDayTeam.values()].sort((a, b) => a.date.localeCompare(b.date) || a.team.localeCompare(b.team, 'pt-BR')),
    serviceRows: [...byServiceTeam.values()].sort((a, b) => a.team.localeCompare(b.team, 'pt-BR') || b.total - a.total || a.service.localeCompare(b.service, 'pt-BR')),
    base: base.sort((a, b) => a.date.localeCompare(b.date) || a.team.localeCompare(b.team, 'pt-BR')),
  }
}

function renderMonthlyServicesPreview() {
  if (!els.reportsMonthPreview) return
  const data = buildMonthlyServicesData()
  const totals = data.dayRows.reduce((acc, item) => {
    acc.dayPoints += item.dayPoints
    acc.daySurveys += item.daySurveys
    acc.nightPoints += item.nightPoints
    acc.nightSurveys += item.nightSurveys
    return acc
  }, { dayPoints: 0, daySurveys: 0, nightPoints: 0, nightSurveys: 0 })
  const total = totals.dayPoints + totals.daySurveys + totals.nightPoints + totals.nightSurveys
  els.reportsMonthDownload.disabled = data.base.length === 0
  if (data.base.length === 0) {
    els.reportsMonthPreview.innerHTML = moduleEmpty('Nenhum serviço recebido no mês selecionado.')
    return
  }
  const topServices = data.serviceRows.slice(0, 12).map((item) => `<tr><td>${escapeHtml(item.team)}</td><td>${escapeHtml(item.service)}</td><td>${item.day}</td><td>${item.night}</td><td><strong>${item.total}</strong></td></tr>`).join('')
  els.reportsMonthPreview.innerHTML = `
    <div class="monthly-services-cards">
      <article><span>Equipes</span><strong>${data.teams.length}</strong></article>
      <article><span>Registros</span><strong>${data.base.length}</strong></article>
      <article><span>Pontos M/T</span><strong>${totals.dayPoints}</strong></article>
      <article><span>Levant. M/T</span><strong>${totals.daySurveys}</strong></article>
      <article><span>Pontos noite</span><strong>${totals.nightPoints}</strong></article>
      <article><span>Levant. noite</span><strong>${totals.nightSurveys}</strong></article>
      <article class="monthly-services-total"><span>Pontuação total</span><strong>${total}</strong></article>
    </div>
    <div class="table-wrap compact-table monthly-services-table"><table><thead><tr><th>Equipe</th><th>Serviço executado</th><th>Manhã/Tarde</th><th>Noite</th><th>Total</th></tr></thead><tbody>${topServices}</tbody></table></div>
    ${data.serviceRows.length > 12 ? `<p class="preview-note">Prévia dos 12 maiores grupos. A planilha terá ${data.serviceRows.length} linhas de serviços por equipe.</p>` : ''}`
}

async function downloadMonthlyServicesReport() {
  try {
    const data = buildMonthlyServicesData()
    if (data.base.length === 0) throw new Error('Nenhum serviço recebido no mês selecionado.')
    setSimpleButtonLoading(els.reportsMonthDownload, true, 'GERANDO RELATÓRIO...')
    await downloadMonthlyServicesWorkbook(data, { month: currentMonth() })
    toast('Relatório mensal de serviços executados gerado com sucesso.')
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    setSimpleButtonLoading(els.reportsMonthDownload, false, 'BAIXAR RELATÓRIO MENSAL')
  }
}

function renderReportTeams(teams) {
  if (!els.reportsTeamList) return
  if (teams.length === 0) {
    els.reportsTeamList.innerHTML = moduleEmpty('Nenhuma equipe com dados nesta data.')
    return
  }
  els.reportsTeamList.innerHTML = teams.map((team) => {
    const summary = summaryForTeam(team)
    return teamFolderCard({
      team,
      action: 'data-open-report-team',
      iconName: 'file-text',
      headline: `${summary.score.total} ponto(s) • ${summary.active.length} registro(s)`,
      detail: `${summary.deleted.length} excluído(s) • ${summary.criticalCount} pendência(s)`,
      badge: summary.criticalCount === 0 && summary.active.length > 0 ? 'COMPLETO' : summary.active.length === 0 ? 'SEM DADOS' : 'ATENÇÃO',
      badgeClass: summary.criticalCount === 0 && summary.active.length > 0 ? 'confirmed' : 'pending',
    })
  }).join('')
}

function teamFolderCard({ team, action, iconName, headline, detail, badge, badgeClass }) {
  return `<button class="team-folder-card" type="button" ${action}="${encodeURIComponent(team)}">
    <span class="folder-card-icon">${icon(iconName)}</span>
    <span class="folder-card-copy"><strong>${escapeHtml(team)}</strong><small>${escapeHtml(headline)}</small><em>${escapeHtml(detail)}</em></span>
    <span class="status-pill ${badgeClass}">${escapeHtml(badge)}</span>
    <span class="folder-card-arrow">${icon('arrow-right')}</span>
  </button>`
}

function moduleEmpty(message) {
  return `<div class="module-empty"><span>${icon('archive')}</span><strong>Sem dados</strong><p>${escapeHtml(message)}</p></div>`
}

async function openPhotoFolder(team, silent = false) {
  if (!team) return
  state.moduleTeams.photos = team
  els.photosTeamList.classList.add('hidden')
  els.photosFolderDetail.classList.remove('hidden')
  els.photosFolderTitle.textContent = `${team} — ${formatDate(currentDate())}`
  const summary = summaryForTeam(team)
  els.photosFolderSummary.textContent = `${summary.receivedPhotos} foto(s) recebida(s) de ${summary.expectedPhotos} esperada(s).`
  els.photosTeamDownload.disabled = summary.receivedPhotos === 0
  els.photosGrid.innerHTML = `<div class="loading-state"><span class="spinner"></span>Carregando fotos da equipe...</div>`

  const entries = photoEntries(summary.active)
  if (entries.length === 0) {
    els.photosGrid.innerHTML = moduleEmpty('Nenhuma foto original recebida no Storage para esta equipe e data.')
    return
  }

  const rendered = await Promise.all(entries.map(async (entry) => {
    try {
      const { data, error } = await supabase.storage.from(entry.bucket).createSignedUrl(entry.path, 900)
      if (error) throw error
      return `<article class="photo-card">
        <button type="button" class="photo-preview-button" data-photo-bucket="${escapeHtml(entry.bucket)}" data-photo-path="${escapeHtml(entry.path)}" aria-label="Abrir ${escapeHtml(entry.label)}">
          <img src="${escapeHtml(data.signedUrl)}" alt="${escapeHtml(entry.label)}" loading="lazy" />
        </button>
        <div><strong>${escapeHtml(entry.fileName)}</strong><span>${escapeHtml(entry.label)}</span><small>${escapeHtml(entry.order)} • ${escapeHtml(entry.street)}</small></div>
      </article>`
    } catch (_error) {
      return `<article class="photo-card photo-error"><div class="photo-error-icon">${icon('triangle-alert')}</div><div><strong>${escapeHtml(entry.fileName)}</strong><span>Não foi possível abrir a miniatura</span></div></article>`
    }
  }))
  els.photosGrid.innerHTML = rendered.join('')
  if (!silent) els.photosFolderDetail.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function refreshOpenPhotoFolder() {
  const team = state.moduleTeams.photos
  if (!team || !teamsForCurrentDate().includes(team)) return closePhotoFolder()
  openPhotoFolder(team, true)
}

function closePhotoFolder() {
  state.moduleTeams.photos = null
  els.photosFolderDetail.classList.add('hidden')
  els.photosTeamList.classList.remove('hidden')
  els.photosGrid.innerHTML = ''
}

function openCodesTeam(team, silent = false) {
  if (!team) return
  state.moduleTeams.codes = team
  els.codesTeamList.classList.add('hidden')
  els.codesTeamDetail.classList.remove('hidden')
  const summary = summaryForTeam(team)
  els.codesTeamTitle.textContent = `${team} — ${formatDate(currentDate())}`
  els.codesTeamSummary.textContent = `${summary.active.length} ponto(s) válido(s). ${summary.deleted.length} excluído(s) não entram no arquivo.`
  els.codesTeamDownload.disabled = summary.active.length === 0
  els.codesPreview.innerHTML = recordsPreview(summary.active, summary.profileMap)
  if (!silent) els.codesTeamDetail.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function closeCodesTeam() {
  state.moduleTeams.codes = null
  els.codesTeamDetail.classList.add('hidden')
  els.codesTeamList.classList.remove('hidden')
}

function openReportsTeam(team, silent = false) {
  if (!team) return
  state.moduleTeams.reports = team
  els.reportsTeamList.classList.add('hidden')
  els.reportsTeamDetail.classList.remove('hidden')
  const summary = summaryForTeam(team)
  els.reportsTeamTitle.textContent = `${team} — ${formatDate(currentDate())}`
  els.reportsTeamSummary.textContent = `${summary.active.length} ponto(s) válido(s). ${summary.deleted.length} excluído(s) não entram no arquivo.`
  els.reportsTeamDownload.disabled = summary.active.length === 0
  els.reportsPreview.innerHTML = recordsPreview(summary.active, summary.profileMap)
  if (!silent) els.reportsTeamDetail.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function closeReportsTeam() {
  state.moduleTeams.reports = null
  els.reportsTeamDetail.classList.add('hidden')
  els.reportsTeamList.classList.remove('hidden')
}

function closeAllModuleDetails() {
  closePhotoFolder()
  closeCodesTeam()
  closeReportsTeam()
}

function recordsPreview(records, profileMap) {
  if (records.length === 0) return moduleEmpty('Nenhum ponto válido desta equipe para gerar a planilha.')
  const rows = records.slice(0, 12).map((row) => {
    const record = row.registro || {}
    return `<tr><td>${escapeHtml(record.orderNumber || '—')}</td><td>${escapeHtml(streetName(record) || '—')}</td><td>${escapeHtml(record.number || '0')}</td><td>${escapeHtml(formatDateTime(record.timePhotoTakenAt || row.data))}</td></tr>`
  }).join('')
  const remaining = Math.max(0, records.length - 12)
  return `<div class="preview-summary"><span>${icon('shield-check')}</span><div><strong>${scoreBreakdown(records).total} ponto(s) em ${records.length} registro(s) válido(s)</strong><small>Somente registros válidos desta equipe entram na planilha.</small></div></div><div class="table-wrap compact-table"><table><thead><tr><th>Ordem</th><th>Rua</th><th>Número</th><th>Data/horário</th></tr></thead><tbody>${rows}</tbody></table></div>${remaining > 0 ? `<p class="preview-note">Mais ${remaining} registro(s) serão incluídos no arquivo.</p>` : ''}`
}

async function downloadCodesForTeam(team) {
  if (!isAdmin()) { toast('Acesso negado. Esta ação exige permissão de administrador.', true); return }
  await runTeamExport(team, 'Gerando planilha em códigos...', async (selection) => {
    await downloadCodesWorkbook(selection.summary.active, exportContextFor(team, selection.summary.active))
  }, 'Planilha em códigos gerada. Nenhuma outra equipe foi misturada.')
}

async function downloadNamesForTeam(team) {
  await runTeamExport(team, 'Gerando planilha em nomes...', async (selection) => {
    await downloadNamesWorkbook(selection.summary.active, exportContextFor(team, selection.summary.active))
  }, 'Planilha em nomes gerada. Nenhuma outra equipe foi misturada.')
}

async function downloadPhotosZipForTeam(team) {
  await runTeamExport(team, 'Baixando fotos da equipe no Supabase...', async (selection) => {
    if (!window.JSZip) throw new Error('A biblioteca de ZIP não carregou.')
    const records = selection.summary.active
    if (records.length === 0) throw new Error('Nenhum ponto válido desta equipe foi encontrado.')

    const entries = photoEntries(records)
    if (entries.length === 0) throw new Error('Nenhuma foto original recebida foi encontrada no Storage para esta equipe.')

    const zip = new window.JSZip()
    const folder = zip.folder(`${safeFilePart(team)}_${fileDate(currentDate())}`)
    const usedNames = new Set()
    let added = 0

    for (const entry of entries) {
      try {
        const { data, error } = await supabase.storage.from(entry.bucket).createSignedUrl(entry.path, 300)
        if (error) continue
        const response = await fetch(data.signedUrl)
        if (!response.ok) continue
        const name = uniqueZipName(entry.fileName, usedNames)
        folder.file(name, await response.blob())
        added += 1
      } catch (_error) {
        // Continua o ZIP com as demais fotos e só falha se nenhuma for obtida.
      }
    }

    if (added === 0) throw new Error('As fotos existem, mas não foi possível baixá-las do Storage.')
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    downloadBlob(blob, `FOTOS ${safeFilePart(team)} ${fileDate(currentDate())}.zip`)
  }, 'Pasta ZIP de fotos gerada somente para a equipe selecionada.')
}

async function runTeamExport(team, progressMessage, task, successMessage) {
  try {
    const normalizedTeam = requireSpecificTeam(team)
    const summary = summaryForTeam(normalizedTeam)
    toast(progressMessage)
    await task({ team: normalizedTeam, summary })
    toast(successMessage)
  } catch (error) {
    toast(friendlyError(error), true)
  }
}

function requireSpecificTeam(team) {
  const normalized = String(team || '').trim()
  if (!normalized || normalized === 'all' || normalizeText(normalized) === 'todas as equipes') {
    throw new Error('Selecione uma equipe. Não é permitido gerar arquivos misturando todas as equipes.')
  }
  return normalized
}

function summaryForTeam(team) {
  const profileMap = profileMapById()
  return buildSummary(recordsForTeam(team, profileMap), manifestsForTeam(team, profileMap), profileMap)
}

function recordsForTeam(team, profileMap = profileMapById(), source = state.records) {
  const normalized = normalizeText(team)
  return source.filter((row) => normalizeText(recordTeam(row, profileMap)) === normalized)
}

function manifestsForTeam(team, profileMap = profileMapById(), source = state.manifests) {
  const normalized = normalizeText(team)
  return source.filter((manifest) => {
    const profileTeam = profileMap.get(manifest.user_id)?.team_name || ''
    return normalizeText(manifest.team_name || profileTeam) === normalized
  })
}

function teamsForCurrentDate() {
  const profileMap = profileMapById()
  const names = new Set(configuredTeamNames())
  state.records.forEach((row) => { const team = recordTeam(row, profileMap); if (team) names.add(team) })
  state.manifests.forEach((manifest) => { const team = manifest.team_name || profileMap.get(manifest.user_id)?.team_name; if (team) names.add(String(team).trim()) })
  return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function configuredTeamNames() {
  return [...new Set(state.profiles
    .filter((profile) => profile.active && profile.role === 'team' && hasText(profile.team_name))
    .map((profile) => profile.team_name.trim()))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function profileMapById() {
  return new Map(state.profiles.map((profile) => [profile.id, profile]))
}

function recordTeam(row, profileMap = profileMapById()) {
  const record = row.registro || {}
  return String(profileMap.get(row.user_id)?.team_name || record.teamName || '').trim()
}

function photoEntries(records) {
  const entries = []
  records.forEach((row) => {
    const record = row.registro || {}
    const street = streetName(record) || 'Sem rua'
    const order = record.orderNumber || row.id
    if (hasText(record.timePhotoStoragePath)) {
      entries.push({
        rowId: row.id,
        bucket: record.timePhotoStorageBucket || 'fotos',
        path: record.timePhotoStoragePath,
        fileName: record.timePhotoFileName || `${row.id}_HORARIO.jpg`,
        label: 'Foto de horário',
        order,
        street,
      })
    }
    if (hasText(record.surveyPhotoStoragePath)) {
      entries.push({
        rowId: row.id,
        bucket: record.surveyPhotoStorageBucket || 'fotos',
        path: record.surveyPhotoStoragePath,
        fileName: record.surveyPhotoFileName || `${row.id}_LEVANTAMENTO.jpg`,
        label: 'Foto de levantamento',
        order,
        street,
      })
    }
  })
  return entries
}

function uniqueZipName(original, usedNames) {
  const safe = safeZipName(original)
  if (!usedNames.has(safe)) { usedNames.add(safe); return safe }
  const dot = safe.lastIndexOf('.')
  const base = dot > 0 ? safe.slice(0, dot) : safe
  const extension = dot > 0 ? safe.slice(dot) : ''
  let index = 1
  let candidate = `${base}_${index}${extension}`
  while (usedNames.has(candidate)) { index += 1; candidate = `${base}_${index}${extension}` }
  usedNames.add(candidate)
  return candidate
}

function exportContextFor(team, records) {
  const plates = [...new Set(records.map((row) => String(row.registro?.vehiclePlate || '').trim()).filter(Boolean))]
  return { date: currentDate(), team, vehiclePlate: plates.length === 1 ? plates[0] : plates.length > 1 ? 'DIVERSAS' : '-' }
}

function isAdmin() { return state.profile?.role === 'admin' }

function asciiJson(value) { return JSON.stringify(value).replace(/[^\x00-\x7F]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`) }

function allowedPages() {
  return isAdmin()
    ? new Set(['home', 'photos', 'settings', 'codes', 'services', 'reports'])
    : new Set(['home', 'photos', 'services', 'reports'])
}

function canAccessPage(page) {
  return allowedPages().has(page)
}

function applyRoleUi() {
  const admin = isAdmin()
  document.body.classList.toggle('viewer-mode', !admin)
  document.body.classList.toggle('admin-mode', admin)
  $$('.admin-only').forEach((element) => element.classList.toggle('hidden', !admin))
  $$('.viewer-only').forEach((element) => element.classList.toggle('hidden', admin))
  $$('.nav-item').forEach((button) => button.classList.toggle('hidden', !canAccessPage(button.dataset.page)))
  const subtitle = $('.admin-profile small')
  if (subtitle) subtitle.textContent = admin ? 'Administrador' : 'Somente leitura'
  if (!canAccessPage(state.page)) switchPage('home', true)
}

async function checkAdminApi() {
  if (!isAdmin()) return
  try {
    const result = await adminApiRequest('/api/admin/status')
    state.adminApiReady = Boolean(result.configured)
    renderAdminApiStatus(result.message)
  } catch (error) {
    state.adminApiReady = false
    renderAdminApiStatus(friendlyError(error), true)
  }
  renderAccesses()
}

function renderAdminApiStatus(message = '', error = false) {
  if (!els.adminApiStatus) return
  els.adminApiStatus.classList.toggle('error', error || !state.adminApiReady)
  els.adminApiStatus.classList.toggle('success', state.adminApiReady)
  els.adminApiStatus.innerHTML = state.adminApiReady
    ? `<span class="info-box-icon">${icon('shield-check')}</span><div><strong>Gerenciamento seguro ativado</strong><p>Criacao de equipes, troca de senhas e arquivamento disponiveis.</p></div>`
    : `<span class="info-box-icon">${icon('triangle-alert')}</span><div><strong>Gerenciamento de usuarios ainda nao configurado</strong><p>${escapeHtml(message || 'Execute CONFIGURAR_CHAVE_ADMIN.bat uma unica vez e reinicie o site.')}</p></div>`
}

function renderAccesses() {
  if (!els.accessesTableBody) return
  const profiles = [...state.profiles].sort((a, b) => {
    const aActive = a.active ? 0 : 1
    const bActive = b.active ? 0 : 1
    return aActive - bActive || String(a.team_name || a.username || '').localeCompare(String(b.team_name || b.username || ''), 'pt-BR')
  })
  els.accessesEmpty.classList.toggle('hidden', profiles.length > 0)
  els.accessesTableBody.innerHTML = profiles.map((profile) => {
    const current = profile.id === state.profile?.id
    const role = accessRoleLabel(profile.role)
    const roleClass = profile.role === 'admin' ? 'confirmed' : profile.role === 'viewer' ? 'info' : 'neutral'
    const disabled = !state.adminApiReady || !isAdmin()
    return `<tr>
      <td><strong>${escapeHtml(profile.username || '—')}</strong>${current ? '<small class="current-user-label">VOCÊ</small>' : ''}</td>
      <td>${escapeHtml(profile.team_name || '—')}</td>
      <td><span class="status-pill ${roleClass}">${escapeHtml(role)}</span></td>
      <td>${profile.active ? '<span class="status-pill confirmed">ATIVO</span>' : '<span class="status-pill deleted">ARQUIVADO</span>'}</td>
      <td><div class="access-actions">
        <button class="table-action" type="button" data-edit-access="${escapeHtml(profile.id)}" aria-label="Editar acesso" title="Editar acesso" ${disabled ? 'disabled' : ''}>${icon('edit')}</button>
        <button class="table-action" type="button" data-password-access="${escapeHtml(profile.id)}" aria-label="Trocar senha" title="Trocar senha" ${disabled ? 'disabled' : ''}>${icon('key')}</button>
        <button class="table-action danger" type="button" data-archive-access="${escapeHtml(profile.id)}" aria-label="Arquivar acesso" title="Arquivar acesso" ${(disabled || current || !profile.active) ? 'disabled' : ''}>${icon('trash')}</button>
      </div></td>
    </tr>`
  }).join('')
}

function accessRoleLabel(role) {
  if (role === 'admin') return 'ADMINISTRADOR'
  if (role === 'viewer') return 'SOMENTE LEITURA'
  return 'EQUIPE'
}

function syncAccessRoleValue() {
  els.accessRole.value = els.accessType.value === 'team' ? 'team' : els.accessPermission.value
}

function syncAccessFormFields() {
  const isTeamAccess = els.accessType.value === 'team'
  els.accessTeamNameField.classList.toggle('hidden', !isTeamAccess)
  els.accessPermissionField.classList.toggle('hidden', isTeamAccess)
  els.accessTeamName.required = isTeamAccess
  syncAccessRoleValue()
}

function openAccessDialog(id = null, passwordOnly = false) {
  if (!isAdmin()) return
  if (!state.adminApiReady) {
    toast('Configure primeiro a chave administrativa local.', true)
    return
  }
  const profile = id ? state.profiles.find((item) => String(item.id) === String(id)) : null
  if (id && !profile) return
  state.accessEditId = profile?.id || null
  els.accessForm.reset()
  els.accessFormError.textContent = ''
  els.accessUserId.value = profile?.id || ''
  const role = profile?.role || 'team'
  setUiControlValue('access-type', role === 'team' ? 'team' : 'site')
  setUiControlValue('access-permission', role === 'viewer' ? 'viewer' : 'admin')
  els.accessRole.value = role
  els.accessUsername.value = profile?.username || ''
  els.accessTeamName.value = profile?.team_name || ''
  els.accessActive.checked = profile?.active ?? true
  els.accessPassword.value = ''
  els.accessPassword.type = 'password'
  els.accessTogglePassword.innerHTML = icon('eye')
  els.accessUsername.readOnly = Boolean(profile)
  els.accessDialogTitle.textContent = profile ? (passwordOnly ? 'Trocar senha' : 'Editar acesso') : 'Novo acesso'
  els.accessPasswordHelp.textContent = profile ? 'Deixe vazio para manter a senha atual.' : 'Obrigatória para novo acesso.'
  els.accessPassword.required = !profile
  syncAccessFormFields()
  els.accessDialog.showModal()
  setTimeout(() => {
    if (passwordOnly) els.accessPassword.focus()
    else if (!profile) els.accessUsername.focus()
    else if (els.accessType.value === 'team') els.accessTeamName.focus()
    else els.accessPassword.focus()
  }, 30)
}

function closeAccessDialog() {
  state.accessEditId = null
  els.accessFormError.textContent = ''
  els.accessPassword.type = 'password'
  els.accessTogglePassword.innerHTML = icon('eye')
  if (els.accessDialog.open) els.accessDialog.close()
}

async function saveAccess(event) {
  event.preventDefault()
  if (!isAdmin() || !state.adminApiReady) return
  els.accessFormError.textContent = ''
  try {
    const username = normalizeUsername(els.accessUsername.value)
    syncAccessRoleValue()
    const role = els.accessRole.value
    const teamName = role === 'team'
      ? els.accessTeamName.value.trim()
      : username
    const password = els.accessPassword.value
    if (role === 'team' && !teamName) throw new Error('Informe a equipe ou o nome de exibição.')
    if (!state.accessEditId && password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')
    if (password && password.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.')

    setSimpleButtonLoading(els.accessSave, true, 'SALVANDO...')
    const payload = { username, team_name: teamName, role, active: els.accessActive.checked }
    if (password) payload.password = password
    const editing = Boolean(state.accessEditId)
    if (editing) {
      await adminApiRequest(`/api/admin/users/${encodeURIComponent(state.accessEditId)}`, { method: 'PATCH', body: payload })
    } else {
      await adminApiRequest('/api/admin/users', { method: 'POST', body: payload })
    }
    closeAccessDialog()
    await loadProfiles()
    await loadDashboard()
    toast(editing ? 'Acesso atualizado com sucesso.' : 'Acesso criado com sucesso.')
  } catch (error) {
    els.accessFormError.textContent = friendlyError(error)
  } finally {
    setSimpleButtonLoading(els.accessSave, false, 'SALVAR ACESSO')
  }
}

function openArchiveAccessDialog(id) {
  if (!isAdmin() || !state.adminApiReady) return
  const profile = state.profiles.find((item) => String(item.id) === String(id))
  if (!profile || profile.id === state.profile?.id) return
  state.archiveAccessId = profile.id
  els.archiveAccessTitle.textContent = profile.role === 'team' ? 'Arquivar equipe?' : 'Arquivar usuário?'
  els.archiveAccessDescription.textContent = `${profile.team_name || profile.username}. O login será bloqueado, mas todos os pontos e históricos permanecerão salvos.`
  els.archiveAccessDialog.showModal()
}

function closeArchiveAccessDialog() {
  state.archiveAccessId = null
  if (els.archiveAccessDialog.open) els.archiveAccessDialog.close()
}

async function archiveAccess() {
  const id = state.archiveAccessId
  if (!id || !isAdmin() || !state.adminApiReady) return
  try {
    setSimpleButtonLoading(els.archiveAccessConfirm, true, 'ARQUIVANDO...')
    await adminApiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
    closeArchiveAccessDialog()
    await loadProfiles()
    await loadDashboard()
    toast('Acesso arquivado. Os registros antigos foram preservados.')
  } catch (error) {
    toast(friendlyError(error), true)
  } finally {
    setSimpleButtonLoading(els.archiveAccessConfirm, false, 'ARQUIVAR ACESSO')
  }
}

async function adminApiRequest(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.')
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: options.body ? asciiJson(options.body) : undefined,
  })
  let payload = {}
  try { payload = await response.json() } catch (_error) { payload = {} }
  if (!response.ok) throw new Error(payload.error || payload.message || `Falha no serviço administrativo (${response.status}).`)
  return payload
}

function switchPage(page, silent = false) {
  let target = page
  if (!canAccessPage(target)) {
    target = 'home'
    if (!silent) toast('Acesso negado. Sua permissão não libera esta área.', true)
  }
  closeAllUiControls()
  state.page = target
  $$('.page-section').forEach((section) => section.classList.add('hidden'))
  $(`#page-${target}`)?.classList.remove('hidden')
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.page === target))
  renderModulePages()
  closeSidebar()
  document.dispatchEvent(new CustomEvent('jr:pagechange', { detail: { page: target } }))
}

function openSidebar() { els.sidebar.classList.add('open'); els.sidebarOverlay.classList.add('show') }
function closeSidebar() { els.sidebar.classList.remove('open'); els.sidebarOverlay.classList.remove('show') }

function subscribeRealtime() {
  stopRealtime()
  state.realtimeChannel = supabase.channel('jr-admin-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'service_records' }, scheduleRealtimeRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'day_sync_manifests' }, scheduleRealtimeRefresh)
    .subscribe((status) => setConnection(status === 'SUBSCRIBED'))
}

function scheduleRealtimeRefresh() {
  if (!state.autoRefresh) return
  clearTimeout(state.realtimeTimer)
  state.realtimeTimer = setTimeout(() => loadDashboard(), 700)
}

function stopRealtime() {
  clearTimeout(state.realtimeTimer)
  if (state.realtimeChannel) supabase.removeChannel(state.realtimeChannel)
  state.realtimeChannel = null
}

function showApp() { els.loginView.classList.add('hidden'); els.appView.classList.remove('hidden'); switchPage('home', true) }
function showLogin() { closeAllUiControls(); els.appView.classList.add('hidden'); els.loginView.classList.remove('hidden'); els.password.value = ''; state.profile = null; state.adminApiReady = false }

function togglePassword() {
  const show = els.password.type === 'password'
  els.password.type = show ? 'text' : 'password'
  els.togglePassword.innerHTML = icon(show ? 'eye-off' : 'eye')
}

function toggleAccessPassword() {
  const show = els.accessPassword.type === 'password'
  els.accessPassword.type = show ? 'text' : 'password'
  els.accessTogglePassword.innerHTML = icon(show ? 'eye-off' : 'eye')
}

function setLoading(value) {
  state.loading = value
  els.loadingState.classList.toggle('hidden', !value)
  ;[els.refreshButton, els.photosRefreshButton, els.codesRefreshButton, els.reportsRefreshButton, els.reportsMonthRefresh].forEach((button) => { if (button) button.disabled = value })
  if (value) els.emptyState.classList.add('hidden')
}

function setConnection(connected) {
  els.connectionStatus.classList.toggle('error', !connected)
  els.connectionStatus.lastChild.textContent = connected ? ' Sistema conectado em tempo real' : ' Falha de conexão com o Supabase'
}

function setButtonLoading(button, loading, label) {
  button.disabled = loading
  const labelNode = button.querySelector('.button-label')
  if (labelNode) labelNode.textContent = label
}

function setSimpleButtonLoading(button, loading, label) {
  if (!button) return
  button.disabled = loading
  const textNode = button.querySelector('.button-label')
  if (textNode) textNode.textContent = label
  else {
    const iconHtml = button.querySelector('svg') ? button.querySelector('span')?.outerHTML || '' : ''
    button.innerHTML = `${iconHtml}<span class="button-label">${escapeHtml(label)}</span>`
  }
}

function toast(message, error = false) {
  els.toast.textContent = message
  els.toast.classList.toggle('error', error)
  els.toast.classList.add('show')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => els.toast.classList.remove('show'), 4200)
}

function isServiceLevantamento(record) {
  const code = String(record?.serviceType?.code || '').trim()
  const name = normalizeText(record?.serviceType?.name || '')
  return code === '162' || name.includes('levantamento')
}

function hasSurveyPhotoFilled(record) {
  return [
    record?.surveyPhotoFileName,
    record?.surveyPhotoPath,
    record?.surveyPhotoTakenAt,
    record?.surveyPhotoStoragePath,
    record?.surveyPhotoThumbnailStoragePath,
  ].some(hasText)
}

function recordScore(row) {
  const record = row?.registro || row || {}
  const normal = isServiceLevantamento(record) ? 0 : 1
  const levantamento = isServiceLevantamento(record) || hasSurveyPhotoFilled(record) ? 1 : 0
  const parts = []
  if (normal) parts.push('Ponto')
  if (levantamento) parts.push('Levantamento')
  return { normal, levantamento, total: normal + levantamento, label: parts.join(' + ') || 'Sem pontuação' }
}

function scoreBreakdown(records) {
  const score = { dayPoints: 0, daySurveys: 0, nightPoints: 0, nightSurveys: 0, total: 0 }
  records.forEach((row) => {
    const value = recordScore(row)
    const morning = isMorningRecord(row)
    if (morning) {
      score.dayPoints += value.normal
      score.daySurveys += value.levantamento
    } else {
      score.nightPoints += value.normal
      score.nightSurveys += value.levantamento
    }
  })
  score.total = score.dayPoints + score.daySurveys + score.nightPoints + score.nightSurveys
  return score
}

function recordDisplayDateTime(row) {
  const record = row?.registro || {}
  return record.timePhotoTakenAt || record.surveyPhotoTakenAt || row?.data
}

function dateTimestamp(value) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function recordSortTimestamp(row) {
  return dateTimestamp(recordDisplayDateTime(row)) || dateTimestamp(row?.updated_at) || dateTimestamp(row?.data)
}

function recordMinutes(row) {
  const record = row?.registro || {}
  const takenAt = record.timePhotoTakenAt || record.surveyPhotoTakenAt
  if (hasText(takenAt)) {
    const date = new Date(takenAt)
    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date)
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
      return (Number(values.hour) * 60) + Number(values.minute)
    }
  }
  const raw = String(record.stampedTimeText || '').trim().replaceAll('.', ':').replaceAll('H', ':').replaceAll('h', ':')
  const match = raw.match(/(\d{1,2}):(\d{2})/)
  if (match) return (Number(match[1]) * 60) + Number(match[2])
  return 0
}

function isMorningRecord(row) {
  const minutes = recordMinutes(row)
  return minutes >= (6 * 60) && minutes <= ((17 * 60) + 30)
}

function recordLabel(row, profileMap) {
  const record = row.registro || {}
  const team = recordTeam(row, profileMap) || 'Sem equipe'
  return `${team} • ${record.orderNumber || row.id} • ${streetName(record) || 'Sem rua'}`
}

function photoExpected(record, type) {
  if (type === 'time') return hasText(record.timePhotoFileName) || hasText(record.timePhotoTakenAt) || hasText(record.timePhotoStoragePath)
  return hasText(record.surveyPhotoFileName) || hasText(record.surveyPhotoTakenAt) || hasText(record.surveyPhotoStoragePath)
}

function unionJsonArrays(rows, key) {
  const result = new Set()
  rows.forEach((row) => {
    let value = row[key]
    if (typeof value === 'string') {
      try { value = JSON.parse(value) } catch (_error) { value = [] }
    }
    if (Array.isArray(value)) value.forEach((item) => item && result.add(String(item)))
  })
  return result
}

function serviceDateKey(row) {
  const recordDate = row?.registro?.date
  if (hasText(recordDate)) return String(recordDate).slice(0, 10)
  if (hasText(row?.data)) return String(row.data).slice(0, 10)
  return ''
}

function monthRangeFromValue(monthValue) {
  const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/)
  const fallback = todayInSaoPaulo().slice(0, 7).match(/^(\d{4})-(\d{2})$/)
  const year = Number((match || fallback)[1])
  const month = Number((match || fallback)[2])
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const nextDate = new Date(Date.UTC(year, month, 1))
  const next = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-01`
  return { start, next }
}

function currentMonth() { return els.monthFilter.value || currentDate().slice(0, 7) }
function currentDate() { return els.dateFilter.value || todayInSaoPaulo() }
function setAllDateFilters(value) { ['date-filter', 'photos-date-filter', 'codes-date-filter', 'reports-date-filter'].forEach((id) => setUiControlValue(id, value)) }
function dedupeIssues(issues) { const map = new Map(); issues.forEach((issue) => map.set(`${issue.type}|${issue.detail}`, issue)); return [...map.values()] }
function teamLabel() { return els.teamFilter.value === 'all' ? 'Todas as equipes' : els.teamFilter.value }
function hasText(value) { return value !== null && value !== undefined && String(value).trim() !== '' }
function normalizeUsername(value) { const username = value.trim().toLowerCase(); if (!/^[a-z0-9_]+$/.test(username)) throw new Error('O usuário deve conter apenas letras, números ou _.'); return username }
function loginEmailFromInput(value) {
  const input = String(value || '').trim().toLowerCase()
  if (!input) throw new Error('Informe o usuário ou e-mail.')
  if (input.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) throw new Error('Informe um e-mail válido.')
    return input
  }
  return `${normalizeUsername(input)}@${INTERNAL_LOGIN_DOMAIN}`
}
function normalizeText(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
function displayName(value) { const text = String(value || '').trim(); const match = text.match(/^\d+\s*-\s*(.+)$/); return match ? match[1].trim() : text }
function lookupDisplayName(value, fallbacks = []) {
  const candidates = []
  if (value && typeof value === 'object') candidates.push(value.name, value.nome, value.description, value.descricao, value.label, value.text)
  else candidates.push(value)
  candidates.push(...fallbacks)
  for (const candidate of candidates) {
    const name = displayName(candidate)
    if (name) return name
  }
  return ''
}
function streetName(record) { return lookupDisplayName(record?.street, [record?.streetName, record?.streetText, record?.logradouroNome, record?.logradouro, record?.manualStreet]) }
function neighborhoodName(record) { return lookupDisplayName(record?.neighborhood, [record?.neighborhoodName, record?.bairroNome, record?.bairro]) }
function todayInSaoPaulo() { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); return `${values.year}-${values.month}-${values.day}` }
function addDays(dateString, amount) { const [year, month, day] = dateString.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10) }
function formatDate(value) { if (!value) return '—'; const parts = String(value).slice(0, 10).split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value) }
function formatDateTime(value) { if (!value) return '—'; const date = value instanceof Date ? value : new Date(value); if (Number.isNaN(date.getTime())) return '—'; return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }).format(date) }
function safeZipName(value) { return String(value || 'foto.jpg').replace(/[\\/:*?"<>|]/g, '_') }
function safeFilePart(value) { return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim().toUpperCase() || 'SEM EQUIPE' }
function fileDate(value) { const parts = String(value || '').slice(0, 10).split('-'); return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : 'SEM-DATA' }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;') }
function friendlyError(error) { const message = error?.message || String(error || 'Erro desconhecido'); if (/invalid login credentials/i.test(message)) return 'Usuário ou senha incorretos.'; if (/admin_purge_excluded_record|function .* does not exist|could not find the function/i.test(message)) return 'Execute o SQL 03_EXCLUSAO_DEFINITIVA_ADMIN.sql no Supabase antes de usar a exclusão definitiva.'; if (/failed to fetch|network|fetch/i.test(message)) return 'Não foi possível conectar ao Supabase.'; return message }
