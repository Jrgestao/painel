import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config-cachefix-20260731-140035.js'
import { hydrateIcons } from './icons.js?v=20260731'
import { setUiControlValue } from './ui-controls.js?v=20260731'
import {
  SERVICE_METRICS,
  SERVICE_METRIC_KEYS,
  daysInMonth,
  detectImportantServices,
  effectiveObservation,
  effectiveScore,
  hasScoreOverride,
  normalizeReportSetting,
  normalizeText,
  serializeReportSetting,
} from './services-board-core-v11.mjs?v=1'

const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') {
  throw new Error('Cliente local do Supabase não carregou para Serviços Executados.')
}
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const $ = (selector) => document.querySelector(selector)
const GLOBAL_KEY = '__matrix__'

const els = {
  page: $('#page-services'),
  month: $('#services-month-filter'),
  metric: $('#services-metric-filter'),
  team: $('#services-team-filter'),
  showHidden: $('#services-show-hidden'),
  refresh: $('#services-refresh'),
  save: $('#services-save-all'),
  hideEmpty: $('#services-hide-empty'),
  showAll: $('#services-show-all'),
  download: $('#services-download'),
  loading: $('#services-loading'),
  error: $('#services-error'),
  root: $('#services-board-root'),
  saveState: $('#services-save-state'),
  dialog: $('#services-note-dialog'),
  dialogTitle: $('#services-note-dialog-title'),
  dialogBody: $('#services-note-dialog-body'),
  dialogSave: $('#services-note-dialog-save'),
  dialogCancel: $('#services-note-dialog-cancel'),
}

const state = {
  cache: null,
  profile: null,
  month: '',
  settingsMonth: '',
  settings: new Map(),
  drafts: new Map(),
  selectedTeam: 'all',
  metric: 'dayPoints',
  showHidden: false,
  loading: false,
  dialogDay: 0,
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
    state.month = event.detail?.month || currentMonthValue()
    if (els.month) els.month.value = state.month
    if (isServicesPageVisible()) await loadSettingsAndRender()
  })

  els.month?.addEventListener('change', () => {
    const month = normalizeMonth(els.month.value)
    if (month) requestMonthFromMain(month)
  })

  els.metric?.addEventListener('change', () => {
    state.metric = SERVICE_METRIC_KEYS.includes(els.metric.value) ? els.metric.value : 'dayPoints'
    renderBoard()
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
    state.settingsMonth = ''
    requestMonthFromMain(normalizeMonth(els.month?.value) || currentMonthValue(), true)
  })

  els.save?.addEventListener('click', saveAllChanges)
  els.hideEmpty?.addEventListener('click', hideEmptyRows)
  els.showAll?.addEventListener('click', showAllRows)
  els.download?.addEventListener('click', downloadWorkbook)

  els.root?.addEventListener('input', (event) => {
    const alias = event.target.closest('[data-services-alias]')
    if (!alias || !isAdmin()) return
    const teamKey = alias.dataset.servicesAlias
    draftFor(teamKey).displayName = alias.value.slice(0, 80)
    markDirty(teamKey)
  })

  els.root?.addEventListener('change', (event) => {
    const scoreInput = event.target.closest('[data-services-score]')
    if (!scoreInput || !isAdmin()) return
    const teamKey = scoreInput.dataset.team
    const metric = scoreInput.dataset.metric
    const day = String(Number(scoreInput.dataset.day))
    const draft = draftFor(teamKey)
    const text = scoreInput.value.trim()

    if (!draft.scoreOverrides[metric]) draft.scoreOverrides[metric] = {}
    if (text === '') delete draft.scoreOverrides[metric][day]
    else draft.scoreOverrides[metric][day] = clampScore(text)
    if (Object.keys(draft.scoreOverrides[metric]).length === 0) delete draft.scoreOverrides[metric]

    markDirty(teamKey)
    renderBoard()
  })

  els.root?.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-services-toggle-day]')
    if (toggle) {
      toggleHiddenDay(Number(toggle.dataset.servicesToggleDay))
      return
    }

    const notes = event.target.closest('[data-services-edit-notes]')
    if (notes) openNotesDialog(Number(notes.dataset.servicesEditNotes))
  })

  els.dialogSave?.addEventListener('click', applyNotesDialog)
  els.dialogCancel?.addEventListener('click', closeNotesDialog)
  els.dialog?.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeNotesDialog()
  })
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

      state.settings = new Map((data || []).map((item) => [String(item.team_key), normalizeReportSetting(item)]))
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
      const dayNumber = Number(serviceDateKey(row).slice(8, 10))
      if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > sheet.days.length) return

      const day = sheet.days[dayNumber - 1]
      const score = recordScore(row)
      if (isMorningRecord(row)) {
        day.dayPoints += score.normal
        day.daySurveys += score.levantamento
      } else {
        day.nightPoints += score.normal
        day.nightSurveys += score.levantamento
      }

      detectImportantServices(record).forEach((item) => day.important.add(item))
    })

  return [...teams.values()]
    .map((sheet) => {
      sheet.days.forEach((day) => {
        day.autoObservation = [...day.important].join(' • ')
      })
      return sheet
    })
    .sort((a, b) => displayNameFor(a).localeCompare(displayNameFor(b), 'pt-BR'))
}

function createTeamSheet(key, originalName) {
  return {
    key,
    originalName,
    days: Array.from({ length: daysInMonth(state.month) }, (_unused, index) => ({
      day: index + 1,
      dayPoints: 0,
      daySurveys: 0,
      nightPoints: 0,
      nightSurveys: 0,
      important: new Set(),
      autoObservation: '',
    })),
  }
}

function renderTeamFilter() {
  if (!els.team) return
  const sheets = buildTeamSheets()
  const previous = state.selectedTeam
  els.team.innerHTML = '<option value="all">Todas as equipes em colunas</option>' + sheets.map((sheet) => {
    return `<option value="${escapeHtml(sheet.key)}">${escapeHtml(displayNameFor(sheet))}</option>`
  }).join('')
  els.team.value = sheets.some((sheet) => sheet.key === previous) ? previous : 'all'
  state.selectedTeam = els.team.value
}

function renderBoard() {
  if (!els.root || !state.cache) return

  const admin = isAdmin()
  const allSheets = buildTeamSheets()
  const sheets = allSheets.filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
  const metric = metricDefinition(state.metric)
  const globalDraft = draftFor(GLOBAL_KEY)
  const visibleDays = Array.from({ length: daysInMonth(state.month) }, (_unused, index) => index + 1)
    .filter((day) => state.showHidden || !globalDraft.hiddenDays.has(day))

  els.saveState.textContent = admin
    ? 'Administrador: nomes, pontuações e observações podem ser alterados nesta área.'
    : 'Modo somente leitura.'

  ;[els.save, els.hideEmpty, els.showAll].forEach((button) => button?.classList.toggle('hidden', !admin))

  if (sheets.length === 0) {
    els.root.innerHTML = '<div class="services-empty"><strong>Nenhuma equipe encontrada</strong><span>Selecione outro mês ou atualize os dados.</span></div>'
    return
  }

  const headerCells = sheets.map((sheet) => {
    const displayName = displayNameFor(sheet)
    return `<th class="services-team-column">
      <div class="services-matrix-team-name">
        ${admin
          ? `<input data-services-alias="${escapeHtml(sheet.key)}" maxlength="80" value="${escapeHtml(displayName)}" aria-label="Nome da equipe nesta área" />`
          : `<strong>${escapeHtml(displayName)}</strong>`}
        ${displayName !== sheet.originalName ? `<small>Original: ${escapeHtml(sheet.originalName)}</small>` : ''}
      </div>
    </th>`
  }).join('')

  const bodyRows = visibleDays.map((dayNumber) => {
    const cells = sheets.map((sheet) => {
      const day = sheet.days[dayNumber - 1]
      const draft = draftFor(sheet.key)
      const value = effectiveScore(day, draft, state.metric)
      const overridden = hasScoreOverride(draft, state.metric, dayNumber)
      return `<td class="services-score-cell ${overridden ? 'is-overridden' : ''}">
        ${admin
          ? `<input type="number" min="0" max="999999" step="1" value="${value}" data-services-score data-team="${escapeHtml(sheet.key)}" data-metric="${state.metric}" data-day="${dayNumber}" title="Apague o valor para voltar ao cálculo automático" />`
          : `<strong>${value}</strong>`}
        ${overridden ? '<small>alterado</small>' : ''}
      </td>`
    }).join('')

    const notes = observationItemsForDay(sheets, dayNumber)
    const notesHtml = notes.length
      ? notes.map((item) => `<div class="services-observation-item"><strong>${escapeHtml(item.team)}:</strong><span>${escapeHtml(item.text)}</span></div>`).join('')
      : '<div class="services-observation-empty">Sem serviço importante neste dia.</div>'

    return `<tr class="${globalDraft.hiddenDays.has(dayNumber) ? 'services-row-hidden' : ''}">
      <td class="services-day-cell">
        <strong>${String(dayNumber).padStart(2, '0')}</strong>
        ${admin ? `<button type="button" class="services-eye-button" data-services-toggle-day="${dayNumber}" title="${globalDraft.hiddenDays.has(dayNumber) ? 'Mostrar linha' : 'Ocultar linha'}">${globalDraft.hiddenDays.has(dayNumber) ? '↩' : '−'}</button>` : ''}
      </td>
      ${cells}
      <td class="services-observations-column">
        <div class="services-observation-list">${notesHtml}</div>
        ${admin ? `<button type="button" class="services-edit-notes" data-services-edit-notes="${dayNumber}">Editar observações</button>` : ''}
      </td>
    </tr>`
  }).join('')

  const totals = sheets.map((sheet) => {
    const draft = draftFor(sheet.key)
    const total = sheet.days.reduce((sum, day) => sum + effectiveScore(day, draft, state.metric), 0)
    return `<th>${total}</th>`
  }).join('')

  els.root.innerHTML = `
    <div class="services-matrix-meta">
      <strong>${escapeHtml(metric.label)}</strong>
      <span>${sheets.length} equipe(s) • ${monthLabel(state.month)} • ${globalDraft.hiddenDays.size} linha(s) oculta(s)</span>
    </div>
    <div class="services-matrix-scroll">
      <table class="services-matrix-table" style="--services-team-count:${sheets.length}">
        <thead><tr><th class="services-day-column">Dia</th>${headerCells}<th class="services-observations-header">Observações importantes</th></tr></thead>
        <tbody>${bodyRows || `<tr><td colspan="${sheets.length + 2}" class="services-no-rows">Todas as linhas estão ocultas. Marque “Mostrar linhas ocultas” ou clique em “Mostrar todas”.</td></tr>`}</tbody>
        <tfoot><tr><th>TOTAL</th>${totals}<th>${escapeHtml(metric.shortLabel)}</th></tr></tfoot>
      </table>
    </div>`

  hydrateIcons()
  updateSaveState()
}

function observationItemsForDay(sheets, dayNumber) {
  return sheets.map((sheet) => {
    const day = sheet.days[dayNumber - 1]
    return {
      team: displayNameFor(sheet),
      text: effectiveObservation(day, draftFor(sheet.key)),
    }
  }).filter((item) => item.text)
}

function openNotesDialog(dayNumber) {
  if (!isAdmin() || !els.dialog || !els.dialogBody) return
  state.dialogDay = dayNumber
  const sheets = buildTeamSheets().filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
  els.dialogTitle.textContent = `Observações do dia ${String(dayNumber).padStart(2, '0')}`
  els.dialogBody.innerHTML = sheets.map((sheet) => {
    const day = sheet.days[dayNumber - 1]
    const draft = draftFor(sheet.key)
    const dayKey = String(dayNumber)
    const hasManual = Object.prototype.hasOwnProperty.call(draft.manualNotes, dayKey)
    const currentText = hasManual ? draft.manualNotes[dayKey] : day.autoObservation
    const suppressed = draft.suppressedNotes.has(dayNumber)
    return `<section class="services-note-editor" data-note-team="${escapeHtml(sheet.key)}">
      <div class="services-note-editor-heading">
        <strong>${escapeHtml(displayNameFor(sheet))}</strong>
        <small>Automática: ${day.autoObservation ? escapeHtml(day.autoObservation) : 'nenhuma ocorrência importante'}</small>
      </div>
      <textarea maxlength="1600" data-note-text placeholder="Digite uma observação manual ou mantenha a automática...">${escapeHtml(suppressed ? '' : currentText)}</textarea>
      <label><input type="checkbox" data-note-suppress ${suppressed ? 'checked' : ''} /> Não mostrar observação automática para esta equipe neste dia</label>
    </section>`
  }).join('')

  if (typeof els.dialog.showModal === 'function') els.dialog.showModal()
  else els.dialog.setAttribute('open', '')
}

function applyNotesDialog() {
  if (!isAdmin() || !state.dialogDay) return
  const sheets = new Map(buildTeamSheets().map((sheet) => [sheet.key, sheet]))

  els.dialogBody?.querySelectorAll('[data-note-team]').forEach((section) => {
    const teamKey = section.dataset.noteTeam
    const sheet = sheets.get(teamKey)
    if (!sheet) return
    const day = sheet.days[state.dialogDay - 1]
    const draft = draftFor(teamKey)
    const dayKey = String(state.dialogDay)
    const text = String(section.querySelector('[data-note-text]')?.value || '').trim().slice(0, 1600)
    const suppress = Boolean(section.querySelector('[data-note-suppress]')?.checked)
    const automatic = String(day.autoObservation || '').trim()

    if (suppress) {
      delete draft.manualNotes[dayKey]
      draft.suppressedNotes.add(state.dialogDay)
    } else {
      draft.suppressedNotes.delete(state.dialogDay)
      if (!text || text === automatic) delete draft.manualNotes[dayKey]
      else draft.manualNotes[dayKey] = text
    }
    markDirty(teamKey)
  })

  closeNotesDialog()
  renderBoard()
}

function closeNotesDialog() {
  state.dialogDay = 0
  if (!els.dialog) return
  if (typeof els.dialog.close === 'function') els.dialog.close()
  else els.dialog.removeAttribute('open')
}

function draftFor(teamKey) {
  if (state.drafts.has(teamKey)) return state.drafts.get(teamKey)
  const setting = state.settings.get(teamKey) || normalizeReportSetting({})
  const draft = {
    displayName: setting.displayName,
    hiddenDays: new Set(setting.hiddenDays),
    manualNotes: { ...setting.manualNotes },
    suppressedNotes: new Set(setting.suppressedNotes),
    scoreOverrides: JSON.parse(JSON.stringify(setting.scoreOverrides || {})),
    dirty: false,
  }
  state.drafts.set(teamKey, draft)
  return draft
}

function displayNameFor(sheet) {
  return draftFor(sheet.key).displayName.trim() || sheet.originalName
}

function markDirty(teamKey) {
  draftFor(teamKey).dirty = true
  updateSaveState()
}

function updateSaveState() {
  if (!els.saveState) return
  const dirtyCount = [...state.drafts.values()].filter((draft) => draft.dirty).length
  if (!isAdmin()) {
    els.saveState.textContent = 'Modo somente leitura.'
    return
  }
  els.saveState.textContent = dirtyCount
    ? `${dirtyCount} alteração(ões) ainda não salva(s).`
    : 'Tudo salvo. As mudanças ficam somente nesta área.'
  const label = els.save?.querySelector('.button-label')
  if (label) label.textContent = dirtyCount ? 'SALVAR ALTERAÇÕES •' : 'SALVAR ALTERAÇÕES'
}

function toggleHiddenDay(day) {
  if (!isAdmin()) return
  const draft = draftFor(GLOBAL_KEY)
  if (draft.hiddenDays.has(day)) draft.hiddenDays.delete(day)
  else draft.hiddenDays.add(day)
  markDirty(GLOBAL_KEY)
  renderBoard()
}

function hideEmptyRows() {
  if (!isAdmin()) return
  const sheets = buildTeamSheets().filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
  const globalDraft = draftFor(GLOBAL_KEY)
  const totalDays = daysInMonth(state.month)

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    const hasValue = sheets.some((sheet) => effectiveScore(sheet.days[dayNumber - 1], draftFor(sheet.key), state.metric) !== 0)
    const hasObservation = observationItemsForDay(sheets, dayNumber).length > 0
    if (!hasValue && !hasObservation) globalDraft.hiddenDays.add(dayNumber)
  }

  markDirty(GLOBAL_KEY)
  renderBoard()
}

function showAllRows() {
  if (!isAdmin()) return
  draftFor(GLOBAL_KEY).hiddenDays.clear()
  markDirty(GLOBAL_KEY)
  renderBoard()
}

async function saveAllChanges() {
  if (!isAdmin()) {
    showToast('Somente administradores podem alterar esta área.', true)
    return
  }

  const dirtyEntries = [...state.drafts.entries()].filter(([_key, draft]) => draft.dirty)
  if (!dirtyEntries.length) {
    showToast('Não há alterações para salvar.')
    return
  }

  setButtonLoading(els.save, true, 'SALVANDO...')
  clearError()

  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (!userId) throw new Error('Sua sessão expirou. Entre novamente.')

    const payloads = dirtyEntries.map(([teamKey, draft]) => ({
      month_key: state.month,
      team_key: teamKey,
      display_name: teamKey === GLOBAL_KEY ? 'Matriz mensal' : draft.displayName.trim(),
      hidden_days: teamKey === GLOBAL_KEY ? [...draft.hiddenDays].sort((a, b) => a - b) : [],
      manual_notes: serializeReportSetting(draft),
      updated_by: userId,
    }))

    const { data: saved, error } = await supabase
      .from('service_report_settings')
      .upsert(payloads, { onConflict: 'month_key,team_key' })
      .select('month_key, team_key, display_name, hidden_days, manual_notes, updated_at')

    if (error) throw error

    ;(saved || []).forEach((item) => state.settings.set(String(item.team_key), normalizeReportSetting(item)))
    dirtyEntries.forEach(([teamKey]) => state.drafts.delete(teamKey))
    renderTeamFilter()
    renderBoard()
    showToast('Alterações salvas no Supabase.')
  } catch (error) {
    setError(friendlyError(error))
    showToast(friendlyError(error), true)
  } finally {
    setButtonLoading(els.save, false, 'SALVAR ALTERAÇÕES')
    updateSaveState()
  }
}

async function downloadWorkbook() {
  try {
    if (!window.ExcelJS) throw new Error('O gerador de planilhas ainda não carregou. Atualize a página.')
    const sheets = buildTeamSheets().filter((sheet) => state.selectedTeam === 'all' || sheet.key === state.selectedTeam)
    if (!sheets.length) throw new Error('Nenhuma equipe disponível para gerar a planilha.')

    setButtonLoading(els.download, true, 'GERANDO...')
    const workbook = new window.ExcelJS.Workbook()
    workbook.creator = 'JR Gestão'
    workbook.created = new Date()
    const globalDraft = draftFor(GLOBAL_KEY)

    SERVICE_METRICS.forEach((metric) => {
      const worksheet = workbook.addWorksheet(metric.sheetName)
      const observationColumn = sheets.length + 2
      worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }]
      worksheet.mergeCells(1, 1, 1, observationColumn)
      worksheet.getCell(1, 1).value = metric.label
      worksheet.getCell(1, 1).font = { bold: true, size: 16 }
      worksheet.getCell(1, 1).alignment = { horizontal: 'center' }
      worksheet.mergeCells(2, 1, 2, observationColumn)
      worksheet.getCell(2, 1).value = monthLabel(state.month)
      worksheet.getCell(2, 1).alignment = { horizontal: 'center' }

      worksheet.addRow(['Dia', ...sheets.map(displayNameFor), 'Observações importantes'])
      worksheet.getRow(3).font = { bold: true }
      worksheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

      for (let dayNumber = 1; dayNumber <= daysInMonth(state.month); dayNumber += 1) {
        const observations = observationItemsForDay(sheets, dayNumber)
          .map((item) => `${item.team}: ${item.text}`)
          .join('\n')
        const row = worksheet.addRow([
          dayNumber,
          ...sheets.map((sheet) => effectiveScore(sheet.days[dayNumber - 1], draftFor(sheet.key), metric.key)),
          observations,
        ])
        row.hidden = globalDraft.hiddenDays.has(dayNumber)
        row.alignment = { vertical: 'top', wrapText: true }
      }

      const totalRow = worksheet.addRow([
        'TOTAL',
        ...sheets.map((sheet) => sheet.days.reduce((sum, day) => sum + effectiveScore(day, draftFor(sheet.key), metric.key), 0)),
        metric.label,
      ])
      totalRow.font = { bold: true }

      worksheet.getColumn(1).width = 9
      sheets.forEach((_sheet, index) => { worksheet.getColumn(index + 2).width = 18 })
      worksheet.getColumn(observationColumn).width = 70
      worksheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: observationColumn } }

      worksheet.eachRow((row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
          }
        })
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `SERVICOS_EXECUTADOS_MATRIZ_${state.month}.xlsx`,
    )
    showToast('Planilha com as quatro abas gerada.')
  } catch (error) {
    showToast(friendlyError(error), true)
  } finally {
    setButtonLoading(els.download, false, 'BAIXAR 4 PLANILHAS')
  }
}

function recordScore(row) {
  const record = row?.registro || row || {}
  const normal = isServiceLevantamento(record) ? 0 : 1
  const levantamento = isServiceLevantamento(record) || hasSurveyPhotoFilled(record) ? 1 : 0
  return { normal, levantamento }
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
        timeZone: 'America/Campo_Grande', hour: '2-digit', minute: '2-digit', hour12: false,
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
  if (hasText(row?.registro?.date)) return String(row.registro.date).slice(0, 10)
  if (hasText(row?.data)) return String(row.data).slice(0, 10)
  return ''
}

function metricDefinition(key) {
  return SERVICE_METRICS.find((item) => item.key === key) || SERVICE_METRICS[0]
}

function clampScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(999999, Math.round(number)))
}

function normalizeMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || '')) ? String(value) : ''
}

function currentMonthValue() {
  return normalizeMonth($('#month-filter')?.value) || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit',
  }).format(new Date())
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
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

function hasText(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char])
}
