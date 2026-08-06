import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config-cachefix-20260731-140035.js'
import { hydrateIcons } from './icons.js?v=20260731'
import { setUiControlValue } from './ui-controls.js?v=20260731'

const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') {
  throw new Error('Cliente local do Supabase não carregou para Serviços Executados.')
}
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const $ = (selector) => document.querySelector(selector)

const els = {
  page: $('#page-services'),
  month: $('#services-month-filter'),
  team: $('#services-team-filter'),
  showHidden: $('#services-show-hidden'),
  refresh: $('#services-refresh'),
  download: $('#services-download'),
  loading: $('#services-loading'),
  error: $('#services-error'),
  root: $('#services-board-root'),
  saveState: $('#services-save-state'),
}

const state = {
  cache: null,
  profile: null,
  month: '',
  settingsMonth: '',
  settings: new Map(),
  drafts: new Map(),
  selectedTeam: 'all',
  showHidden: false,
  loading: false,
  openTeams: new Set(),
}

bindEvents()
syncFromMainCache()

function bindEvents() {
  document.addEventListener('jr:pagechange', (event) => {
    if (event.detail?.page === 'services') activateServicesPage()
  })

  document.addEventListener('jr:monthdata', async (event) => {
    state.cache = event.detail || null
    state.profile = event.detail?.profile || null
    const month = event.detail?.month || currentMonthValue()
    state.month = month
    if (els.month) els.month.value = month
    if (isServicesPageVisible()) await loadSettingsAndRender()
  })

  els.month?.addEventListener('change', () => {
    const month = normalizeMonth(els.month.value)
    if (!month) return
    requestMonthFromMain(month)
  })

  els.team?.addEventListener('change', () => {
    state.selectedTeam = els.team.value || 'all'
    renderBoard()
  })

  els.showHidden?.addEventListener('change', () => {
    state.showHidden = Boolean(els.showHidden.checked)
    renderBoard()
  })

  els.refresh?.addEventListener('click', () => {
    const month = normalizeMonth(els.month.value) || currentMonthValue()
    state.settingsMonth = ''
    requestMonthFromMain(month, true)
  })

  els.download?.addEventListener('click', downloadWorkbook)

  els.root?.addEventListener('input', (event) => {
    const aliasInput = event.target.closest('[data-services-alias]')
    if (aliasInput) {
      const draft = draftFor(aliasInput.dataset.servicesAlias)
      draft.displayName = aliasInput.value.slice(0, 80)
      markDirty(aliasInput.dataset.servicesAlias)
      return
    }

    const noteInput = event.target.closest('[data-services-note]')
    if (noteInput) {
      const teamKey = noteInput.dataset.servicesNote
      const day = String(Number(noteInput.dataset.day))
      const draft = draftFor(teamKey)
      const value = noteInput.value.slice(0, 1200)
      if (value.trim()) draft.manualNotes[day] = value
      else delete draft.manualNotes[day]
      markDirty(teamKey)
    }
  })

  els.root?.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('[data-services-save]')
    if (saveButton) {
      await saveTeam(saveButton.dataset.servicesSave)
      return
    }

    const hideButton = event.target.closest('[data-services-toggle-day]')
    if (hideButton) {
      const teamKey = hideButton.dataset.servicesToggleDay
      const day = Number(hideButton.dataset.day)
      toggleHiddenDay(teamKey, day)
      return
    }

    const hideEmptyButton = event.target.closest('[data-services-hide-empty]')
    if (hideEmptyButton) {
      hideEmptyDays(hideEmptyButton.dataset.servicesHideEmpty)
      return
    }

    const showAllButton = event.target.closest('[data-services-show-all]')
    if (showAllButton) {
      const draft = draftFor(showAllButton.dataset.servicesShowAll)
      draft.hiddenDays.clear()
      markDirty(showAllButton.dataset.servicesShowAll)
      renderBoard()
    }
  })

  els.root?.addEventListener('toggle', (event) => {
    const details = event.target.closest('details[data-services-team-sheet]')
    if (!details) return
    if (details.open) state.openTeams.add(details.dataset.servicesTeamSheet)
    else state.openTeams.delete(details.dataset.servicesTeamSheet)
  }, true)
}

async function activateServicesPage() {
  syncFromMainCache()
  if (!state.cache) {
    showLoading(true)
    setError('Aguardando os dados mensais do painel...')
    return
  }
  await loadSettingsAndRender()
}

function syncFromMainCache() {
  const cache = window.__JR_SERVICES_MONTH_CACHE__
  if (!cache) return
  state.cache = cache
  state.profile = cache.profile || null
  state.month = cache.month || currentMonthValue()
  if (els.month) els.month.value = state.month
}

function requestMonthFromMain(month, force = false) {
  clearError()
  showLoading(true)
  state.month = month
  if (els.month) els.month.value = month

  const mainMonth = $('#month-filter')
  if (!mainMonth) {
    setError('O filtro mensal principal não foi encontrado.')
    showLoading(false)
    return
  }

  setUiControlValue('month-filter', month)
  mainMonth.value = month
  mainMonth.dispatchEvent(new Event('change', { bubbles: true }))

  if (force && state.cache?.month === month) {
    window.setTimeout(() => loadSettingsAndRender(), 250)
  }
}

async function loadSettingsAndRender() {
  if (!state.cache || !state.month) return
  showLoading(true)
  clearError()

  try {
    if (state.settingsMonth !== state.month) {
      const { data, error } = await supabase
        .from('service_report_settings')
        .select('month_key, team_key, display_name, hidden_days, manual_notes, updated_at')
        .eq('month_key', state.month)

      if (error) throw error

      state.settings = new Map((data || []).map((item) => [String(item.team_key), normalizeSetting(item)]))
      state.drafts.clear()
      state.settingsMonth = state.month
    }

    renderTeamFilter()
    renderBoard()
  } catch (error) {
    setError(friendlyError(error))
  } finally {
    showLoading(false)
  }
}

function buildTeamSheets() {
  const cache = state.cache || {}
  const profiles = Array.isArray(cache.profiles) ? cache.profiles : []
  const records = Array.isArray(cache.records) ? cache.records : []
  const profileMap = new Map(profiles.map((profile) => [String(profile.id), profile]))
  const teams = new Map()

  profiles
    .filter((profile) => profile?.active === true && profile?.role === 'team')
    .forEach((profile) => {
      const key = String(profile.id)
      teams.set(key, createTeamSheet(key, String(profile.team_name || profile.username || 'Equipe')))
    })

  records
    .filter((row) => !row?.deleted_at && serviceDateKey(row).startsWith(`${state.month}-`))
    .forEach((row) => {
      const record = row?.registro || {}
      const profile = profileMap.get(String(row?.user_id || ''))
      const originalName = String(profile?.team_name || record.teamName || 'Sem equipe').trim() || 'Sem equipe'
      const key = row?.user_id ? String(row.user_id) : `legacy:${normalizeText(originalName)}`

      if (!teams.has(key)) teams.set(key, createTeamSheet(key, originalName))
      const sheet = teams.get(key)
      const day = Number(serviceDateKey(row).slice(8, 10))
      if (!Number.isInteger(day) || day < 1 || day > sheet.days.length) return

      const target = sheet.days[day - 1]
      const score = recordScore(row)
      if (isMorningRecord(row)) {
        target.dayPoints += score.normal
        target.daySurveys += score.levantamento
      } else {
        target.nightPoints += score.normal
        target.nightSurveys += score.levantamento
      }

      target.total += score.total
      target.records += 1
      const service = reportServiceLabel(record)
      target.services.set(service, (target.services.get(service) || 0) + 1)
      reportImportantLabels(record).forEach((label) => target.important.add(label))

      const fieldObservation = String(record.observation || '').trim()
      if (fieldObservation) target.fieldNotes.add(fieldObservation)
    })

  return [...teams.values()]
    .map((sheet) => {
      sheet.days.forEach((day) => { day.autoObservation = buildAutoObservation(day) })
      sheet.totals = sheet.days.reduce((acc, day) => {
        acc.dayPoints += day.dayPoints
        acc.daySurveys += day.daySurveys
        acc.nightPoints += day.nightPoints
        acc.nightSurveys += day.nightSurveys
        acc.total += day.total
        acc.records += day.records
        return acc
      }, { dayPoints: 0, daySurveys: 0, nightPoints: 0, nightSurveys: 0, total: 0, records: 0 })
      return sheet
    })
    .sort((a, b) => displayNameFor(a).localeCompare(displayNameFor(b), 'pt-BR'))
}

function createTeamSheet(key, originalName) {
  const daysInMonth = daysInSelectedMonth()
  return {
    key,
    originalName,
    days: Array.from({ length: daysInMonth }, (_unused, index) => ({
      day: index + 1,
      dayPoints: 0,
      daySurveys: 0,
      nightPoints: 0,
      nightSurveys: 0,
      total: 0,
      records: 0,
      services: new Map(),
      important: new Set(),
      fieldNotes: new Set(),
      autoObservation: '',
    })),
    totals: null,
  }
}

function renderTeamFilter() {
  if (!els.team) return
  const sheets = buildTeamSheets()
  const previous = state.selectedTeam
  els.team.innerHTML = '<option value="all">Todas as equipes</option>' + sheets.map((sheet) => {
    return `<option value="${escapeHtml(sheet.key)}">${escapeHtml(displayNameFor(sheet))}</option>`
  }).join('')
  els.team.value = sheets.some((sheet) => sheet.key === previous) ? previous : 'all'
  state.selectedTeam = els.team.value
}

function renderBoard() {
  if (!els.root || !state.cache) return

  const admin = isAdmin()
  const sheets = buildTeamSheets().filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
  els.saveState.textContent = admin
    ? 'Alterações ficam somente nesta área e são salvas no Supabase.'
    : 'Modo somente leitura.'

  if (sheets.length === 0) {
    els.root.innerHTML = '<div class="services-empty"><strong>Nenhuma equipe encontrada</strong><span>Selecione outro mês ou atualize os dados.</span></div>'
    return
  }

  const openBefore = new Set(
    [...els.root.querySelectorAll('details[data-services-team-sheet][open]')]
      .map((item) => item.dataset.servicesTeamSheet)
  )
  if (openBefore.size) state.openTeams = openBefore
  if (state.openTeams.size === 0 && sheets[0]) state.openTeams.add(sheets[0].key)

  els.root.innerHTML = sheets.map((sheet) => renderTeamSheet(sheet, admin)).join('')
  hydrateIcons()
}

function renderTeamSheet(sheet, admin) {
  const draft = draftFor(sheet.key)
  const hiddenCount = draft.hiddenDays.size
  const visibleRows = sheet.days.filter((day) => state.showHidden || !draft.hiddenDays.has(day.day))
  const isOpen = state.selectedTeam !== 'all' || state.openTeams.has(sheet.key)
  const displayName = draft.displayName.trim() || sheet.originalName

  const rows = visibleRows.map((day) => {
    const hidden = draft.hiddenDays.has(day.day)
    const manual = String(draft.manualNotes[String(day.day)] || '')
    const observation = day.autoObservation
    const dayLabel = String(day.day).padStart(2, '0')
    return `
      <tr class="${hidden ? 'services-row-hidden' : ''}">
        <td class="services-day-cell">
          <strong>${dayLabel}</strong>
          ${admin ? `<button type="button" class="services-eye-button" data-services-toggle-day="${escapeHtml(sheet.key)}" data-day="${day.day}" title="${hidden ? 'Mostrar linha' : 'Ocultar linha'}">${hidden ? '↩' : '−'}</button>` : ''}
        </td>
        <td>${day.dayPoints}</td>
        <td>${day.daySurveys}</td>
        <td>${day.nightPoints}</td>
        <td>${day.nightSurveys}</td>
        <td class="services-total-cell">${day.total}</td>
        <td class="services-observation-cell">
          ${observation ? `<div class="services-auto-note">${escapeHtml(observation)}</div>` : '<div class="services-auto-note empty">Sem serviço informado.</div>'}
          ${admin
            ? `<textarea data-services-note="${escapeHtml(sheet.key)}" data-day="${day.day}" maxlength="1200" placeholder="Escreva uma observação para esta equipe neste dia...">${escapeHtml(manual)}</textarea>`
            : manual ? `<div class="services-manual-note">${escapeHtml(manual)}</div>` : ''}
        </td>
      </tr>`
  }).join('')

  return `
    <details class="services-team-sheet" data-services-team-sheet="${escapeHtml(sheet.key)}" ${isOpen ? 'open' : ''}>
      <summary>
        <div class="services-team-name-block">
          <span>Equipe</span>
          ${admin
            ? `<input data-services-alias="${escapeHtml(sheet.key)}" maxlength="80" value="${escapeHtml(displayName)}" aria-label="Nome da equipe nesta área" />`
            : `<strong>${escapeHtml(displayName)}</strong>`}
          ${displayName !== sheet.originalName ? `<small>Equipe original: ${escapeHtml(sheet.originalName)}</small>` : ''}
        </div>
        <div class="services-team-summary">
          <span><small>Registros</small><strong>${sheet.totals.records}</strong></span>
          <span><small>Pontos M/T</small><strong>${sheet.totals.dayPoints}</strong></span>
          <span><small>Lev. M/T</small><strong>${sheet.totals.daySurveys}</strong></span>
          <span><small>Pontos noite</small><strong>${sheet.totals.nightPoints}</strong></span>
          <span><small>Lev. noite</small><strong>${sheet.totals.nightSurveys}</strong></span>
          <span class="services-total-summary"><small>Total</small><strong>${sheet.totals.total}</strong></span>
        </div>
      </summary>

      <div class="services-team-actions">
        <span>${hiddenCount} linha(s) oculta(s)</span>
        ${admin ? `
          <button type="button" class="outline-button" data-services-hide-empty="${escapeHtml(sheet.key)}">Ocultar dias vazios</button>
          <button type="button" class="outline-button" data-services-show-all="${escapeHtml(sheet.key)}">Mostrar todas</button>
          <button type="button" class="primary-button" data-services-save="${escapeHtml(sheet.key)}"><span data-icon="save"></span><span class="button-label">SALVAR ALTERAÇÕES</span></button>
        ` : ''}
      </div>

      <div class="services-sheet-scroll">
        <table class="services-sheet-table">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Pontos M/T</th>
              <th>Lev. M/T</th>
              <th>Pontos noite</th>
              <th>Lev. noite</th>
              <th>Total</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" class="services-no-rows">Todas as linhas estão ocultas. Ative “Mostrar linhas ocultas” para restaurar.</td></tr>'}</tbody>
          <tfoot>
            <tr>
              <th>TOTAL</th>
              <th>${sheet.totals.dayPoints}</th>
              <th>${sheet.totals.daySurveys}</th>
              <th>${sheet.totals.nightPoints}</th>
              <th>${sheet.totals.nightSurveys}</th>
              <th>${sheet.totals.total}</th>
              <th>${escapeHtml(displayName)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>`
}

function draftFor(teamKey) {
  if (state.drafts.has(teamKey)) return state.drafts.get(teamKey)
  const setting = state.settings.get(teamKey) || normalizeSetting({})
  const draft = {
    displayName: setting.displayName,
    hiddenDays: new Set(setting.hiddenDays),
    manualNotes: { ...setting.manualNotes },
    dirty: false,
  }
  state.drafts.set(teamKey, draft)
  return draft
}

function displayNameFor(sheet) {
  const draft = draftFor(sheet.key)
  return draft.displayName.trim() || sheet.originalName
}

function markDirty(teamKey) {
  const draft = draftFor(teamKey)
  draft.dirty = true
  const button = els.root?.querySelector(`[data-services-save="${cssEscape(teamKey)}"] .button-label`)
  if (button) button.textContent = 'SALVAR ALTERAÇÕES •'
}

function toggleHiddenDay(teamKey, day) {
  if (!isAdmin()) return
  const draft = draftFor(teamKey)
  if (draft.hiddenDays.has(day)) draft.hiddenDays.delete(day)
  else draft.hiddenDays.add(day)
  markDirty(teamKey)
  renderBoard()
}

function hideEmptyDays(teamKey) {
  if (!isAdmin()) return
  const sheet = buildTeamSheets().find((item) => item.key === teamKey)
  if (!sheet) return
  const draft = draftFor(teamKey)
  sheet.days.forEach((day) => {
    const manual = String(draft.manualNotes[String(day.day)] || '').trim()
    if (day.total === 0 && !day.autoObservation && !manual) draft.hiddenDays.add(day.day)
  })
  markDirty(teamKey)
  renderBoard()
}

async function saveTeam(teamKey) {
  if (!isAdmin()) {
    showToast('Somente administradores podem alterar esta área.', true)
    return
  }

  const draft = draftFor(teamKey)
  const button = els.root?.querySelector(`[data-services-save="${cssEscape(teamKey)}"]`)
  setButtonLoading(button, true, 'SALVANDO...')

  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (!userId) throw new Error('Sua sessão expirou. Entre novamente.')

    const payload = {
      month_key: state.month,
      team_key: teamKey,
      display_name: draft.displayName.trim(),
      hidden_days: [...draft.hiddenDays].sort((a, b) => a - b),
      manual_notes: cleanManualNotes(draft.manualNotes),
      updated_by: userId,
    }

    const { data: saved, error } = await supabase
      .from('service_report_settings')
      .upsert(payload, { onConflict: 'month_key,team_key' })
      .select('month_key, team_key, display_name, hidden_days, manual_notes, updated_at')
      .single()

    if (error) throw error

    state.settings.set(teamKey, normalizeSetting(saved))
    state.drafts.delete(teamKey)
    renderTeamFilter()
    renderBoard()
    showToast('Alterações da equipe salvas.')
  } catch (error) {
    setError(friendlyError(error))
    showToast(friendlyError(error), true)
  } finally {
    setButtonLoading(button, false, 'SALVAR ALTERAÇÕES')
  }
}

async function downloadWorkbook() {
  try {
    if (!window.ExcelJS) throw new Error('O gerador de planilhas ainda não carregou. Atualize a página.')
    const sheets = buildTeamSheets().filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
    if (sheets.length === 0) throw new Error('Nenhuma equipe disponível para gerar a planilha.')

    setButtonLoading(els.download, true, 'GERANDO...')
    const workbook = new window.ExcelJS.Workbook()
    workbook.creator = 'JR Gestão'
    workbook.created = new Date()

    sheets.forEach((sheet) => {
      const draft = draftFor(sheet.key)
      const displayName = draft.displayName.trim() || sheet.originalName
      const worksheet = workbook.addWorksheet(uniqueSheetName(workbook, displayName))
      worksheet.views = [{ state: 'frozen', ySplit: 3 }]
      worksheet.mergeCells('A1:G1')
      worksheet.getCell('A1').value = displayName
      worksheet.getCell('A1').font = { bold: true, size: 16 }
      worksheet.getCell('A1').alignment = { horizontal: 'center' }
      worksheet.mergeCells('A2:G2')
      worksheet.getCell('A2').value = `Serviços executados — ${monthLabel(state.month)}`
      worksheet.getCell('A2').alignment = { horizontal: 'center' }

      worksheet.addRow(['Dia', 'Pontos M/T', 'Lev. M/T', 'Pontos noite', 'Lev. noite', 'Total', 'Observações'])
      worksheet.getRow(3).font = { bold: true }
      worksheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' }

      sheet.days.forEach((day) => {
        const manual = String(draft.manualNotes[String(day.day)] || '').trim()
        const observations = [day.autoObservation, manual].filter(Boolean).join('\n')
        const row = worksheet.addRow([
          day.day,
          day.dayPoints,
          day.daySurveys,
          day.nightPoints,
          day.nightSurveys,
          day.total,
          observations,
        ])
        row.hidden = draft.hiddenDays.has(day.day)
        row.alignment = { vertical: 'top', wrapText: true }
      })

      const totalRow = worksheet.addRow([
        'TOTAL',
        sheet.totals.dayPoints,
        sheet.totals.daySurveys,
        sheet.totals.nightPoints,
        sheet.totals.nightSurveys,
        sheet.totals.total,
        displayName,
      ])
      totalRow.font = { bold: true }

      worksheet.columns = [
        { width: 9 },
        { width: 14 },
        { width: 12 },
        { width: 14 },
        { width: 12 },
        { width: 10 },
        { width: 62 },
      ]
      worksheet.autoFilter = { from: 'A3', to: 'G3' }
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        })
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `SERVICOS_EXECUTADOS_${state.month}.xlsx`,
    )
    showToast('Planilha mensal gerada.')
  } catch (error) {
    showToast(friendlyError(error), true)
  } finally {
    setButtonLoading(els.download, false, 'BAIXAR PLANILHA')
  }
}

function buildAutoObservation(day) {
  const parts = []
  if (day.important.size) parts.push([...day.important].join(', '))

  const services = [...day.services.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, 8)
    .map(([name, quantity]) => `${quantity}× ${name}`)
  if (services.length) parts.push(services.join('; '))

  const fieldNotes = [...day.fieldNotes].slice(0, 4)
  if (fieldNotes.length) parts.push(`Campo: ${fieldNotes.join(' | ')}`)

  return parts.join(' • ')
}

function reportProductItems(record) {
  return Array.isArray(record?.products) ? record.products.map((entry) => ({
    code: String(entry?.product?.code || '').trim(),
    name: String(entry?.product?.name || '').trim(),
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
  if (products.some((item) => item.code === '16' || normalizeText(item.name).includes('contact'))) add('CONTACTORA')
  if (observation.includes('tomada') || serviceName.includes('tomada')) add('INSTALAÇÃO DE TOMADA')

  const namedPattern = /(evento|event|pra[çc]a|campo(?:\s+de\s+futebol)?)\s*[:\-]\s*([^;|/\n]+)/gi
  let match
  while ((match = namedPattern.exec(observationRaw)) !== null) {
    const normalized = normalizeText(match[1])
    const kind = normalized.startsWith('event') ? 'EVENTO' : normalized.startsWith('praca') ? 'PRAÇA' : 'CAMPO DE FUTEBOL'
    const detail = String(match[2] || '').trim().replace(/\s+/g, ' ')
    add(detail ? `${kind}: ${detail.toUpperCase()}` : kind)
  }

  return [...labels]
}

function recordScore(row) {
  const record = row?.registro || row || {}
  const normal = isServiceLevantamento(record) ? 0 : 1
  const levantamento = isServiceLevantamento(record) || hasSurveyPhotoFilled(record) ? 1 : 0
  return { normal, levantamento, total: normal + levantamento }
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

function isMorningRecord(row) {
  const minutes = recordMinutes(row)
  return minutes >= 360 && minutes <= 1050
}

function recordMinutes(row) {
  const record = row?.registro || {}
  const takenAt = record.timePhotoTakenAt || record.surveyPhotoTakenAt
  if (hasText(takenAt)) {
    const date = new Date(takenAt)
    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Campo_Grande',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date)
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
      return (Number(values.hour) * 60) + Number(values.minute)
    }
  }

  const raw = String(record.stampedTimeText || '').trim().replaceAll('.', ':').replaceAll('H', ':').replaceAll('h', ':')
  const match = raw.match(/(\d{1,2}):(\d{2})/)
  return match ? (Number(match[1]) * 60) + Number(match[2]) : 0
}

function serviceDateKey(row) {
  const recordDate = row?.registro?.date
  if (hasText(recordDate)) return String(recordDate).slice(0, 10)
  if (hasText(row?.data)) return String(row.data).slice(0, 10)
  return ''
}

function normalizeSetting(item) {
  const hiddenDays = Array.isArray(item?.hidden_days)
    ? item.hidden_days.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
    : []
  const notes = item?.manual_notes && typeof item.manual_notes === 'object' && !Array.isArray(item.manual_notes)
    ? item.manual_notes
    : {}
  return {
    displayName: String(item?.display_name || '').slice(0, 80),
    hiddenDays,
    manualNotes: cleanManualNotes(notes),
  }
}

function cleanManualNotes(notes) {
  const result = {}
  Object.entries(notes || {}).forEach(([day, value]) => {
    const dayNumber = Number(day)
    const text = String(value || '').trim().slice(0, 1200)
    if (Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 31 && text) result[String(dayNumber)] = text
  })
  return result
}

function daysInSelectedMonth() {
  const [year, month] = state.month.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

function normalizeMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || '')) ? String(value) : ''
}

function currentMonthValue() {
  return normalizeMonth($('#month-filter')?.value) || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Campo_Grande',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
}

function uniqueSheetName(workbook, value) {
  const base = String(value || 'Equipe').replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31) || 'Equipe'
  let candidate = base
  let index = 2
  while (workbook.getWorksheet(candidate)) {
    const suffix = ` ${index}`
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`
    index += 1
  }
  return candidate
}

function setButtonLoading(button, loading, label) {
  if (!button) return
  button.disabled = loading
  const node = button.querySelector('.button-label')
  if (node) node.textContent = label
}

function showLoading(value) {
  state.loading = value
  els.loading?.classList.toggle('hidden', !value)
  if (els.refresh) els.refresh.disabled = value
  if (els.download) els.download.disabled = value
}

function setError(message) {
  if (!els.error) return
  els.error.textContent = message
  els.error.classList.remove('hidden')
  els.error.classList.add('error')
}

function clearError() {
  if (!els.error) return
  els.error.textContent = ''
  els.error.classList.add('hidden')
  els.error.classList.remove('error')
}

function showToast(message, error = false) {
  const toast = $('#toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.toggle('error', error)
  toast.classList.add('show')
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200)
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function friendlyError(error) {
  const message = String(error?.message || error || '')
  if (message.includes('service_report_settings') || message.includes('schema cache')) {
    return 'A tabela de configurações dos serviços ainda não está instalada no Supabase.'
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Seu usuário não possui permissão para alterar esta área.'
  }
  return message || 'Não foi possível carregar os serviços executados.'
}

function isAdmin() {
  return state.profile?.role === 'admin'
}

function isServicesPageVisible() {
  return Boolean(els.page && !els.page.classList.contains('hidden'))
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value))
  return String(value).replace(/["\\]/g, '\\$&')
}

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function hasText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char])
}
