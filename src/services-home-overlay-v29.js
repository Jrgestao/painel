// JR_GESTAO_HOME_SCORE_IGUAL_EXPORT_V36=20260811
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js?v=2'
import { normalizeReportSetting } from './services-board-core-v21.mjs?v=1'
import {
  mergeRebuiltImportedScoresV28,
  parseImportMinutes,
  rebuildImportedScoresByMetricV28,
} from './services-import-core-v28.mjs?v=28'

const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') {
  throw new Error('Cliente local do Supabase não carregou para o resumo importado.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const METRICS = ['dayPoints', 'daySurveys', 'nightPoints', 'nightSurveys']

const homeDateFormatterV22 = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Campo_Grande',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const homeTimeFormatterV22 = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Campo_Grande',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})


const state = {
  cache: null,
  settingsMonth: '',
  settings: new Map(),
  model: null,
  schedule: 0,
  modelFingerprintV22: '',
  teamRowsCacheV22: null,
  importedRowsV36: [],
  afterMainFrameV25: 0,
  afterMainSecondFrameV25: 0,
  lastAppliedHomeSignatureV25: '',

  monthlySnapshotV29: null,
  finalizedMonthV29: '',
  monthlyPendingV29: true,
  homeObserverV29: null,
  observerApplyingV29: false,
  stabilizeTimersV29: [],
}

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}


function serviceDateKey(row) {
  const record =
    row?.registro || row || {}

  for (const value of [
    record.timePhotoFileName,
    record.timePhotoPath,
    record.surveyPhotoFileName,
    record.surveyPhotoPath,
  ]) {
    const match =
      String(value || '')
        .match(
          /(?:^|\D)(\d{4})(\d{2})(\d{2})[_\-\s](?:[01]\d|2[0-3])(?:[0-5]\d)/,
        )

    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }
  }

  for (const value of [
    record.timePhotoTakenAt,
    record.surveyPhotoTakenAt,
  ]) {
    if (!value) continue

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      continue
    }

    return homeDateFormatterV22
      .format(date)
  }

  for (const value of [
    record.date,
    record.serviceDate,
    record.workDate,
    record.work_date,
  ]) {
    const match =
      String(value || '')
        .match(
          /^(\d{4})-(\d{2})-(\d{2})/,
        )

    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }
  }

  return String(
    row?.data || '',
  ).slice(0, 10)
}


function homeMinutesFromDateV28(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  let hour = 0
  let minute = 0

  for (const part of homeTimeFormatterV22.formatToParts(date)) {
    if (part.type === 'hour') hour = Number(part.value)
    else if (part.type === 'minute') minute = Number(part.value)
  }

  return hour * 60 + minute
}

function homePointMinutesV28(row) {
  /* JR_GESTAO_PERIODO_FOTO_V37_1: Home usa a mesma hora visivel da planilha/foto. */
  const record = row?.registro || row || {}
  for (const value of [
    record.timePhotoFileName,
    record.timePhotoPath,
    record.stampedTimeText,
  ]) {
    const parsed = parseImportMinutes(value)
    if (Number.isFinite(parsed)) return parsed
  }
  const dateMinutes = homeMinutesFromDateV28(record.timePhotoTakenAt)
  if (Number.isFinite(dateMinutes)) return dateMinutes
  const parsed = parseImportMinutes(record.timePhotoTakenAt)
  return Number.isFinite(parsed) ? parsed : null
}

function homeSurveyMinutesV28(row) {
  /* JR_GESTAO_PERIODO_FOTO_V37_1: levantamento do Home usa a propria foto. */
  const record = row?.registro || row || {}
  for (const value of [
    record.surveyPhotoFileName,
    record.surveyPhotoPath,
  ]) {
    const parsed = parseImportMinutes(value)
    if (Number.isFinite(parsed)) return parsed
  }
  const dateMinutes = homeMinutesFromDateV28(record.surveyPhotoTakenAt)
  if (Number.isFinite(dateMinutes)) return dateMinutes
  const parsed = parseImportMinutes(record.surveyPhotoTakenAt)
  if (Number.isFinite(parsed)) return parsed
  if (isSurvey(record)) return homePointMinutesV28(row)
  return null
}

function homeIsDayV28(minutes) {
  return (
    Number.isFinite(minutes) &&
    minutes >= 360 &&
    minutes < 1050
  )
}

function isSurvey(record) {
  const code = String(record?.serviceType?.code || '').trim()
  const name = norm(record?.serviceType?.name)
  return code === '162' || name.includes('levantamento')
}

function hasSurveyPhoto(record) {
  return [record?.surveyPhotoFileName, record?.surveyPhotoPath, record?.surveyPhotoTakenAt, record?.surveyPhotoStoragePath, record?.surveyPhotoThumbnailStoragePath]
    .some((value) => String(value || '').trim())
}


function rowMetrics(row) {
  const record = row?.registro || row || {}
  const surveyOnly = isSurvey(record)
  const normal = surveyOnly ? 0 : 1
  const survey = surveyOnly || hasSurveyPhoto(record) ? 1 : 0

  const result = {
    dayPoints: 0,
    daySurveys: 0,
    nightPoints: 0,
    nightSurveys: 0,
  }

  if (normal) {
    if (homeIsDayV28(homePointMinutesV28(row))) {
      result.dayPoints += normal
    } else {
      result.nightPoints += normal
    }
  }

  if (survey) {
    if (homeIsDayV28(homeSurveyMinutesV28(row))) {
      result.daySurveys += survey
    } else {
      result.nightSurveys += survey
    }
  }

  return result
}

function blankScore() {
  return { dayPoints: 0, daySurveys: 0, nightPoints: 0, nightSurveys: 0 }
}

function addScore(target, source) {
  METRICS.forEach((metric) => { target[metric] += Number(source?.[metric] || 0) })
  return target
}

function teamKeyForRow(row, profileMap) {
  if (row?.user_id) return String(row.user_id)
  const record = row?.registro || row || {}
  const name = String(record.teamName || 'Sem equipe').trim()
  return `legacy:${norm(name)}`
}




// JR_GESTAO_HOME_IMPORTED_ROWS_V36_BEGIN
function monthBoundsV36(month) {
  const match = String(month || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const next = new Date(Date.UTC(year, monthIndex + 1, 1))
  const nextKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`
  const endDate = new Date(next.getTime() - 86400000)
  const end = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`
  return { start: `${month}-01`, end, next: nextKey }
}
async function refreshImportedRowsV36(month, force = false) {
  const bounds = monthBoundsV36(month)
  if (!bounds) { state.importedRowsV36 = []; return [] }
  try {
    if (!window.__JR_IMPORTED_RECORDS_V21__) {
      await import('./services-import-bridge-v21.js?v=bridge-v21-20260807')
    }
    await window.__JR_IMPORTED_RECORDS_V21__?.refreshRange?.(bounds.start, bounds.end, force)
    state.importedRowsV36 = window.__JR_IMPORTED_RECORDS_V21__?.recordsForRange?.(bounds.start, bounds.end) || []
  } catch (error) {
    console.warn('[JR V36] Nao foi possivel carregar linhas importadas no Home.', error)
    state.importedRowsV36 = []
  }
  return state.importedRowsV36
}
// JR_GESTAO_HOME_IMPORTED_ROWS_V36_END

function buildModel() {
  const cache = state.cache
  if (!cache) return null

  const profiles = Array.isArray(cache.profiles) ? cache.profiles : []
  const profileMap = new Map(profiles.map((p) => [String(p.id), p]))
  const activeProfiles = profiles.filter((p) => p?.active === true && p?.role === 'team')
  const raw = new Map()

  for (const profile of activeProfiles) {
    raw.set(String(profile.id), new Map())
  }

  for (const row of Array.isArray(cache.records) ? cache.records : []) {
    if (row?.deleted_at) continue
    const date = serviceDateKey(row)
    if (!date || !date.startsWith(`${cache.month}-`)) continue
    const key = teamKeyForRow(row, profileMap)
    if (!raw.has(key)) raw.set(key, new Map())
    const day = Number(date.slice(8, 10))
    if (!raw.get(key).has(day)) raw.get(key).set(day, blankScore())
    addScore(raw.get(key).get(day), rowMetrics(row))
  }

  // JR_GESTAO_HOME_ADD_IMPORTED_V36_BEGIN
  // MESMA fonte da planilha em Codigos: soma as virtual rows importadas aos nativos.
  for (const row of Array.isArray(state.importedRowsV36) ? state.importedRowsV36 : []) {
    if (row?.deleted_at) continue
    const date = serviceDateKey(row)
    if (!date || !date.startsWith(`${cache.month}-`)) continue
    const key = teamKeyForRow(row, profileMap)
    if (!raw.has(key)) raw.set(key, new Map())
    const day = Number(date.slice(8, 10))
    if (!raw.get(key).has(day)) raw.get(key).set(day, blankScore())
    addScore(raw.get(key).get(day), rowMetrics(row))
  }
  // JR_GESTAO_HOME_ADD_IMPORTED_V36_END

  const final = new Map()
  const nameToKey = new Map()

  for (const profile of activeProfiles) {
    const key = String(profile.id)
    const setting = state.settings.get(key) || normalizeReportSetting({})
    const dayMap = new Map()
    const rawDays = raw.get(key) || new Map()

    for (let day = 1; day <= 31; day += 1) {
      // JR_GESTAO_HOME_SCORE_DECISION_V36: Home segue os registros que entram na planilha.
      // Edicoes/overrides da matriz continuam existindo em Servicos Executados,
      // mas nao podem reescrever a contagem real do Home.
      const base = rawDays.get(day) || blankScore()
      const score = blankScore()
      for (const metric of METRICS) score[metric] = Number(base[metric] || 0)
      dayMap.set(day, score)
    }

    const displayName = setting.displayName || profile.team_name || profile.username || 'Equipe'
    final.set(key, { key, displayName, originalName: profile.team_name || profile.username || displayName, days: dayMap })
    nameToKey.set(norm(displayName), key)
    nameToKey.set(norm(profile.team_name || profile.username), key)
  }

  return { final, nameToKey }
}

async function loadSettings(month) {
  if (!month) return
  if (state.settingsMonth === month && state.settings.size) return
  const { data, error } = await supabase
    .from('service_report_settings')
    .select('month_key, team_key, display_name, hidden_days, manual_notes, updated_at')
    .eq('month_key', month)
  if (error) throw error
  state.settings =
    new Map(
      (data || []).map((item) => {
        const setting =
          normalizeReportSetting(item)

        /*
          V28: corrige também o Início usando as linhas importadas
          como fonte de verdade da divisão M/T x Noite.
        */
        setting.importedScoresByMetric =
          mergeRebuiltImportedScoresV28(
            setting.importedScoresByMetric || {},
            rebuildImportedScoresByMetricV28(
              setting.importedRows || [],
            ),
          )

        return [
          String(item.team_key),
          setting,
        ]
      }),
    )

  state.settingsMonth = month
}

function monthlyForTeam(team) {
  const total = blankScore()
  team?.days?.forEach((score) => addScore(total, score))
  return total
}

function globalMonthly() {
  const total = blankScore()
  state.model?.final?.forEach((team) => addScore(total, monthlyForTeam(team)))
  return total
}

function selectedDayScore() {
  const date = document.getElementById('date-filter')?.value || ''
  const day = Number(String(date).slice(8, 10))
  const selected = document.getElementById('team-filter')?.value || 'all'
  const total = blankScore()
  if (!Number.isInteger(day) || !state.model) return total

  if (selected === 'all') {
    state.model.final.forEach((team) => addScore(total, team.days.get(day)))
    return total
  }

  const key = state.model.nameToKey.get(norm(selected))
  if (key) addScore(total, state.model.final.get(key)?.days?.get(day))
  return total
}

function setText(id, value) {
  const node = document.getElementById(id)
  if (
    node &&
    node.textContent !== String(value)
  ) {
    node.textContent = String(value)
  }
}

function selectedMonthV29() {
  return (
    document.getElementById(
      'month-filter',
    )?.value ||
    state.cache?.month ||
    ''
  )
}

function setMonthlyPendingV29(pending) {
  state.monthlyPendingV29 =
    Boolean(pending)

  document.documentElement
    .classList.toggle(
      'jr-home-month-pending-v29',
      state.monthlyPendingV29,
    )

  document.querySelector(
    '.monthly-summary-block',
  )?.setAttribute(
    'aria-busy',
    state.monthlyPendingV29
      ? 'true'
      : 'false',
  )
}

function computeMonthlySnapshotV29() {
  const score = globalMonthly()
  const points =
    Number(score.dayPoints || 0) +
    Number(score.nightPoints || 0)
  const surveys =
    Number(score.daySurveys || 0) +
    Number(score.nightSurveys || 0)

  return Object.freeze({
    dayPoints:
      Number(score.dayPoints || 0),
    nightPoints:
      Number(score.nightPoints || 0),
    daySurveys:
      Number(score.daySurveys || 0),
    nightSurveys:
      Number(score.nightSurveys || 0),
    points,
    surveys,
    total:
      points + surveys,
  })
}

function monthlySnapshotMatchesDomV29(
  snapshot,
) {
  if (!snapshot) return false

  const expected = [
    ['top-total', snapshot.total],
    ['top-points', snapshot.points],
    ['top-points-day', snapshot.dayPoints],
    ['top-points-night', snapshot.nightPoints],
    ['top-surveys', snapshot.surveys],
    ['top-surveys-day', snapshot.daySurveys],
    ['top-surveys-night', snapshot.nightSurveys],
  ]

  return expected.every(
    ([id, value]) => {
      const node =
        document.getElementById(id)

      return (
        !node ||
        node.textContent ===
          String(value)
      )
    },
  )
}

function applyMonthlyCards() {
  const snapshot =
    state.monthlySnapshotV29

  if (!snapshot) return

  setText(
    'top-points-day',
    snapshot.dayPoints,
  )
  setText(
    'top-points-night',
    snapshot.nightPoints,
  )
  setText(
    'top-surveys-day',
    snapshot.daySurveys,
  )
  setText(
    'top-surveys-night',
    snapshot.nightSurveys,
  )
  setText(
    'top-points',
    snapshot.points,
  )
  setText(
    'top-surveys',
    snapshot.surveys,
  )
  setText(
    'top-total',
    snapshot.total,
  )
}

function finalizeMonthlySnapshotV29(
  month,
) {
  state.monthlySnapshotV29 =
    computeMonthlySnapshotV29()

  state.finalizedMonthV29 =
    String(month || '')

  /*
    Os sete números são escritos juntos e só depois revelados.
    Não há paint com valor cru/intermediário.
  */
  applyMonthlyCards()
  setMonthlyPendingV29(false)
}

function currentFinalMonthV29() {
  return Boolean(
    state.monthlySnapshotV29 &&
    state.finalizedMonthV29 &&
    state.finalizedMonthV29 ===
      selectedMonthV29()
  )
}

function mutationTouchesScoreV29(
  mutation,
) {
  const target =
    mutation?.target?.nodeType === 1
      ? mutation.target
      : mutation?.target?.parentElement

  if (!target?.closest) return false

  return Boolean(
    target.closest(
      '.monthly-summary-block, #team-score-grid, #daily-score-total',
    ),
  )
}

function restoreStableHomeValuesV29() {
  if (
    state.observerApplyingV29 ||
    !state.model
  ) {
    return
  }

  const home =
    document.getElementById(
      'page-home',
    )

  if (
    !home ||
    home.classList.contains('hidden')
  ) {
    return
  }

  state.observerApplyingV29 = true

  try {
    /*
      Mensal é propriedade do mês.
      Data e equipe NUNCA entram neste cálculo.
    */
    if (
      currentFinalMonthV29() &&
      !monthlySnapshotMatchesDomV29(
        state.monthlySnapshotV29,
      )
    ) {
      applyMonthlyCards()
    }

    /*
      O main também pode recriar estes cards após a busca
      assíncrona da data. Reaplica importações antes do paint.
    */
    applyTeamCards()
    applyDailyCards()
  } finally {
    state.observerApplyingV29 = false
  }
}

function ensureHomeObserverV29() {
  if (
    state.homeObserverV29 ||
    typeof MutationObserver !==
      'function'
  ) {
    return
  }

  const home =
    document.getElementById(
      'page-home',
    )

  if (!home) return

  state.homeObserverV29 =
    new MutationObserver(
      (mutations) => {
        if (
          state.observerApplyingV29 ||
          !mutations.some(
            mutationTouchesScoreV29,
          )
        ) {
          return
        }

        /*
          MutationObserver executa antes do próximo paint.
          Se o main escrever o total cru depois da consulta,
          o snapshot final volta antes de o usuário enxergar.
        */
        restoreStableHomeValuesV29()
      },
    )

  state.homeObserverV29.observe(
    home,
    {
      childList: true,
      subtree: true,
      characterData: true,
    },
  )
}

function clearStabilityTimersV29() {
  for (
    const timer
    of state.stabilizeTimersV29
  ) {
    clearTimeout(timer)
  }

  state.stabilizeTimersV29 = []
}

function scheduleStabilityPulseV29() {
  scheduleOverlayAfterMainV29()
  clearStabilityTimersV29()

  for (const delay of [
    80,
    260,
    800,
    1800,
  ]) {
    state.stabilizeTimersV29.push(
      window.setTimeout(
        restoreStableHomeValuesV29,
        delay,
      ),
    )
  }
}


function applyTeamCards() {
  if (!state.model) return

  const date =
    document.getElementById(
      'date-filter',
    )?.value || ''

  const day =
    Number(
      String(date).slice(8, 10),
    )

  if (!Number.isInteger(day)) {
    return
  }

  const grid =
    document.getElementById(
      'team-score-grid',
    )

  if (!grid) return

  const currentRows = [
    ...grid.querySelectorAll(
      '.team-score-row-v30',
    ),
  ]

  if (
    !state.teamRowsCacheV22 ||
    state.teamRowsCacheV22.length !==
      currentRows.length ||
    state.teamRowsCacheV22.some(
      (cached, index) =>
        cached.row !==
        currentRows[index],
    )
  ) {
    state.teamRowsCacheV22 =
      currentRows.map((row) => {
        const name =
          row.querySelector(
            '.team-score-row-name-v30 strong',
          )?.textContent || ''

        return {
          row,
          key:
            state.model.nameToKey
              .get(norm(name)) ||
            '',
          values: [
            ...row.querySelectorAll(
              '.team-score-row-values-v30 > span > strong',
            ),
          ],
          total:
            row.querySelector(
              '.team-score-row-total-v30 strong',
            ),
        }
      })
  }

  for (
    const item
    of state.teamRowsCacheV22
  ) {
    const team =
      item.key
        ? state.model.final.get(
            item.key,
          )
        : null

    if (!team) continue

    const score =
      team.days.get(day) ||
      blankScore()

    const ordered = [
      score.dayPoints,
      score.nightPoints,
      score.daySurveys,
      score.nightSurveys,
    ]

    item.values.forEach(
      (node, index) => {
        if (
          index <
            ordered.length &&
          node.textContent !==
            String(
              ordered[index],
            )
        ) {
          node.textContent =
            String(
              ordered[index],
            )
        }
      },
    )

    const total =
      score.dayPoints +
      score.daySurveys +
      score.nightPoints +
      score.nightSurveys

    if (
      item.total &&
      item.total.textContent !==
        String(total)
    ) {
      item.total.textContent =
        String(total)
    }
  }
}

function applyDailyCards() {
  const score = selectedDayScore()
  const root = document.getElementById('daily-score-total')
  if (!root) return
  const map = new Map([
    ['PONTOS MANHÃ/TARDE', score.dayPoints],
    ['PONTOS NOITE', score.nightPoints],
    ['LEVANTAMENTOS MANHÃ/TARDE', score.daySurveys],
    ['LEVANTAMENTOS NOITE', score.nightSurveys],
    ['TOTAL GERAL', score.dayPoints + score.daySurveys + score.nightPoints + score.nightSurveys],
  ])
  root.querySelectorAll('span').forEach((card) => {
    const label = String(card.querySelector('small')?.textContent || '').trim().toUpperCase()
    if (!map.has(label)) return
    const strong = card.querySelector('strong')
    const value = map.get(label)
    if (strong && strong.textContent !== String(value)) strong.textContent = String(value)
  })
}


function applyOverlay() {
  state.schedule = 0

  if (!state.model) return

  const home =
    document.getElementById(
      'page-home',
    )

  if (
    !home ||
    home.classList.contains(
      'hidden',
    )
  ) {
    return
  }

  /*
    O main pode recriar os nós do Home ao voltar de outra aba.
    Por isso NÃO pulamos o overlay só porque o modelo não mudou:
    os nós visuais podem ter voltado aos valores nativos.
    Cada writer abaixo já compara textContent antes de escrever.
  */
  if (
    currentFinalMonthV29()
  ) {
    applyMonthlyCards()
  }

  applyTeamCards()
  applyDailyCards()
  ensureHomeObserverV29()

  const date =
    document.getElementById(
      'date-filter',
    )?.value || ''

  const team =
    document.getElementById(
      'team-filter',
    )?.value || 'all'

  state.lastAppliedHomeSignatureV25 =
    [
      state.settingsMonth,
      date,
      team,
      state.cache?.updatedAt || '',
    ].join('|')
}

function scheduleOverlay() {
  if (state.schedule) return

  state.schedule =
    requestAnimationFrame(
      applyOverlay,
    )
}

function scheduleOverlayAfterMainV29() {
  cancelAnimationFrame(
    state.afterMainFrameV25,
  )
  cancelAnimationFrame(
    state.afterMainSecondFrameV25,
  )

  state.afterMainFrameV25 =
    requestAnimationFrame(() => {
      state.afterMainFrameV25 = 0

      state.afterMainSecondFrameV25 =
        requestAnimationFrame(() => {
          state.afterMainSecondFrameV25 = 0
          scheduleOverlay()
        })
    })
}

export function restoreHomeOverlayV29() {
  scheduleStabilityPulseV29()
}

/* Compatibilidade com loader anterior. */
export function restoreHomeOverlayV25() {
  restoreHomeOverlayV29()
}


async function refreshFromCache(detail) {
  const cache =
    detail ||
    window.__JR_SERVICES_MONTH_CACHE__

  if (!cache?.month) return

  const incomingMonth =
    String(cache.month || '')

  const monthChanged =
    Boolean(
      state.finalizedMonthV29 &&
      state.finalizedMonthV29 !==
        incomingMonth,
    )

  if (
    !state.monthlySnapshotV29 ||
    monthChanged
  ) {
    state.monthlySnapshotV29 = null
    state.finalizedMonthV29 = ''
    setMonthlyPendingV29(true)
  }

  const sameCache =
    state.cache === cache &&
    state.settingsMonth ===
      incomingMonth &&
    state.model &&
    state.monthlySnapshotV29 &&
    state.finalizedMonthV29 ===
      incomingMonth

  state.cache = cache

  if (sameCache) {
    scheduleStabilityPulseV29()
    return
  }

  try {
    await loadSettings(
      incomingMonth,
    )

    await refreshImportedRowsV36(incomingMonth)

    state.model = buildModel();

    state.teamRowsCacheV22 = null

    finalizeMonthlySnapshotV29(
      incomingMonth,
    )

    scheduleStabilityPulseV29()
  } catch (_error) {
    /*
      Falha de rede: libera o fallback nativo.
      Não deixa os números invisíveis para sempre.
    */
    if (!state.monthlySnapshotV29) {
      setMonthlyPendingV29(false)
    }
  }
}

document.addEventListener(
  'jr:monthdata',
  (event) => {
    void refreshFromCache(
      event.detail,
    )
  },
)

document.addEventListener(
  'jr:services-settings-updated',
  (event) => {
    const month =
      event.detail?.month ||
      state.cache?.month

    if (!month) return

    state.settingsMonth = ''
    state.settings.clear()

    /*
      Mesmo mês: mantém o snapshot final antigo na tela
      enquanto o novo é montado. A troca é atômica.
    */
    void refreshFromCache(
      state.cache,
    )
  },
)

document.addEventListener(
  'jr:pagechange',
  (event) => {
    if (
      event.detail?.page ===
      'home'
    ) {
      ensureHomeObserverV29()
      scheduleStabilityPulseV29()
    }
  },
)

/*
  Somente troca de mês pode invalidar o mensal.
  Listener em capture: esconde antes do loadDashboard do main.
*/
document
  .getElementById(
    'month-filter',
  )
  ?.addEventListener(
    'change',
    () => {
      const month =
        selectedMonthV29()

      if (
        month &&
        month !==
          state.finalizedMonthV29
      ) {
        state.monthlySnapshotV29 = null
        state.finalizedMonthV29 = ''
        setMonthlyPendingV29(true)
      }
    },
    true,
  )

/*
  Data/equipe só mexem no diário.
  O observer protege contra a escrita tardia do loadDashboard.
*/
document
  .getElementById(
    'date-filter',
  )
  ?.addEventListener(
    'change',
    scheduleStabilityPulseV29,
  )

document
  .getElementById(
    'team-filter',
  )
  ?.addEventListener(
    'change',
    scheduleStabilityPulseV29,
  )

ensureHomeObserverV29()

void refreshFromCache(
  window.__JR_SERVICES_MONTH_CACHE__,
)
