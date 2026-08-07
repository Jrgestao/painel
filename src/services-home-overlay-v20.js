import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config-cachefix-20260731-140035.js'
import { normalizeReportSetting } from './services-board-core-v20.mjs?v=1'

const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') {
  throw new Error('Cliente local do Supabase não carregou para o resumo importado.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const METRICS = ['dayPoints', 'daySurveys', 'nightPoints', 'nightSurveys']

const state = {
  cache: null,
  settingsMonth: '',
  settings: new Map(),
  model: null,
  schedule: 0,
  observer: null,
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
  const record = row?.registro || row || {}
  for (const value of [record.date, record.serviceDate, record.workDate, record.work_date]) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return `${match[1]}-${match[2]}-${match[3]}`
  }
  const value = record.timePhotoTakenAt || record.surveyPhotoTakenAt || row?.data
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

function recordMinutes(row) {
  const record = row?.registro || row || {}
  const value = record.timePhotoTakenAt || record.surveyPhotoTakenAt
  if (value) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Campo_Grande', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(date)
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
      return Number(values.hour) * 60 + Number(values.minute)
    }
  }
  const raw = String(record.stampedTimeText || '').replaceAll('.', ':').replaceAll('H', ':').replaceAll('h', ':')
  const match = raw.match(/(\d{1,2}):(\d{2})/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0
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
  const day = recordMinutes(row) >= 360 && recordMinutes(row) <= 1050
  return {
    dayPoints: day ? normal : 0,
    daySurveys: day ? survey : 0,
    nightPoints: day ? 0 : normal,
    nightSurveys: day ? 0 : survey,
  }
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

  const final = new Map()
  const nameToKey = new Map()

  for (const profile of activeProfiles) {
    const key = String(profile.id)
    const setting = state.settings.get(key) || normalizeReportSetting({})
    const dayMap = new Map()
    const rawDays = raw.get(key) || new Map()

    for (let day = 1; day <= 31; day += 1) {
      const base = rawDays.get(day) || blankScore()
      const score = blankScore()
      for (const metric of METRICS) {
        const manual = setting.scoreOverrides?.[metric]?.[String(day)]
        const imported = setting.importedScoresByMetric?.[metric]?.[String(day)]
        score[metric] = Number.isFinite(Number(manual))
          ? Number(manual)
          : Number.isFinite(Number(imported))
            ? Number(imported)
            : Number(base[metric] || 0)
      }
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
  state.settings = new Map((data || []).map((item) => [String(item.team_key), normalizeReportSetting(item)]))
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
  if (node && node.textContent !== String(value)) node.textContent = String(value)
}

function applyMonthlyCards() {
  const score = globalMonthly()
  const points = score.dayPoints + score.nightPoints
  const surveys = score.daySurveys + score.nightSurveys
  const total = points + surveys
  setText('top-points-day', score.dayPoints)
  setText('top-points-night', score.nightPoints)
  setText('top-surveys-day', score.daySurveys)
  setText('top-surveys-night', score.nightSurveys)
  setText('top-points', points)
  setText('top-surveys', surveys)
  setText('top-total', total)
}

function applyTeamCards() {
  if (!state.model) return
  document.querySelectorAll('.team-score-row-v30').forEach((row) => {
    const name = row.querySelector('.team-score-row-name-v30 strong')?.textContent || ''
    const key = state.model.nameToKey.get(norm(name))
    const team = key ? state.model.final.get(key) : null
    if (!team) return
    const score = monthlyForTeam(team)
    const values = row.querySelectorAll('.team-score-row-values-v30 > span > strong')
    const ordered = [score.dayPoints, score.nightPoints, score.daySurveys, score.nightSurveys]
    values.forEach((node, index) => {
      if (index < ordered.length && node.textContent !== String(ordered[index])) node.textContent = String(ordered[index])
    })
    const total = score.dayPoints + score.daySurveys + score.nightPoints + score.nightSurveys
    const totalNode = row.querySelector('.team-score-row-total-v30 strong')
    if (totalNode && totalNode.textContent !== String(total)) totalNode.textContent = String(total)
  })
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
  applyMonthlyCards()
  applyTeamCards()
  applyDailyCards()
}

function scheduleOverlay() {
  if (state.schedule) return
  state.schedule = requestAnimationFrame(applyOverlay)
}

async function refreshFromCache(detail) {
  const cache = detail || window.__JR_SERVICES_MONTH_CACHE__
  if (!cache?.month) return
  state.cache = cache
  try {
    await loadSettings(cache.month)
    state.model = buildModel()
    scheduleOverlay()
  } catch (_error) {
    // O painel principal continua funcionando mesmo se o overlay falhar.
  }
}

document.addEventListener('jr:monthdata', (event) => {
  void refreshFromCache(event.detail)
})

document.addEventListener('jr:services-settings-updated', (event) => {
  const month = event.detail?.month || state.cache?.month
  if (month) {
    state.settingsMonth = ''
    state.settings.clear()
    void refreshFromCache(state.cache)
  }
})

document.addEventListener('jr:pagechange', (event) => {
  if (event.detail?.page === 'home') scheduleOverlay()
})

document.getElementById('date-filter')?.addEventListener('change', () => setTimeout(scheduleOverlay, 0))
document.getElementById('team-filter')?.addEventListener('change', () => setTimeout(scheduleOverlay, 0))

const homeRoot = document.getElementById('page-home')
if (homeRoot && typeof MutationObserver === 'function') {
  state.observer = new MutationObserver(() => scheduleOverlay())
  state.observer.observe(homeRoot, { childList: true, subtree: true })
}

void refreshFromCache(window.__JR_SERVICES_MONTH_CACHE__)
