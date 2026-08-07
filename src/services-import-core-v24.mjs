export const IMPORT_METRICS = Object.freeze([
  'dayPoints',
  'daySurveys',
  'nightPoints',
  'nightSurveys',
])

export function normalizeImportText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseImportDate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel 1900 date system. Keeps importer tolerant of date cells
    // that ExcelJS exposes as raw serial values.
    const serial = Math.floor(value)
    if (serial >= 20000 && serial <= 80000) {
      const utc = new Date(
        Date.UTC(1899, 11, 30) +
          serial * 86400000,
      )
      if (!Number.isNaN(utc.getTime())) {
        return [
          utc.getUTCFullYear(),
          String(utc.getUTCMonth() + 1).padStart(2, '0'),
          String(utc.getUTCDate()).padStart(2, '0'),
        ].join('-')
      }
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const raw = String(value ?? '').trim()
  if (!raw) return ''

  let match = raw.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`
  }

  match = raw.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/)
  if (match) {
    return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`
  }

  match = raw.match(/(?:^|\D)(\d{4})(\d{2})(\d{2})(?:\D|$)/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`

  return ''
}

export function parseImportMinutes(value) {
  const raw = String(value ?? '')
    .trim()
    .replaceAll('.', ':')
    .replaceAll('_', ':')
    .replaceAll('-', ':')

  if (!raw) return null

  const timePhoto = raw.match(/(?:^|\D)\d{8}[\s:_-]?(\d{2})(\d{2})(\d{2})?(?:\D|$)/)
  if (timePhoto) {
    const hour = Number(timePhoto[1])
    const minute = Number(timePhoto[2])
    if (hour <= 23 && minute <= 59) return hour * 60 + minute
  }

  const separated = raw.match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?:\D|$)/)
  if (separated) return Number(separated[1]) * 60 + Number(separated[2])

  const compact = raw.match(/(?:^|\D)([01]\d|2[0-3])([0-5]\d)(?:[0-5]\d)?(?:\D|$)/)
  if (compact) return Number(compact[1]) * 60 + Number(compact[2])

  return null
}

export function importMetricFor(kind, minutes) {
  if (!Number.isFinite(minutes)) return ''
  const day = minutes >= 360 && minutes < 1050
  if (kind === 'survey') return day ? 'daySurveys' : 'nightSurveys'
  return day ? 'dayPoints' : 'nightPoints'
}

export function aggregateImportEntries(entries, fallbackDate = '', monthKey = '') {
  const byDay = new Map()
  let ignored = 0

  for (const entry of entries || []) {
    const date = parseImportDate(entry?.date) || parseImportDate(fallbackDate)
    const minutes = parseImportMinutes(entry?.time)
    const metric = importMetricFor(entry?.kind === 'survey' ? 'survey' : 'point', minutes)

    if (!date || !metric || (monthKey && !date.startsWith(`${monthKey}-`))) {
      ignored += 1
      continue
    }

    if (!byDay.has(date)) {
      byDay.set(date, {
        date,
        dayPoints: 0,
        daySurveys: 0,
        nightPoints: 0,
        nightSurveys: 0,
        presentMetrics: new Set(),
        importantByMetric: {
          dayPoints: new Set(),
          daySurveys: new Set(),
          nightPoints: new Set(),
          nightSurveys: new Set(),
        },
      })
    }

    const row = byDay.get(date)
    row.presentMetrics.add(metric)
    row[metric] += 1
    ;(entry?.important || []).forEach((text) => {
      const clean = String(text || '').trim()
      if (clean) row.importantByMetric[metric].add(clean)
    })
  }

  const days = [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      ...day,
      presentMetrics: [...day.presentMetrics],
      importantByMetric: Object.fromEntries(
        IMPORT_METRICS.map((metric) => [
          metric,
          [...day.importantByMetric[metric]],
        ]),
      ),
    }))

  const totals = Object.fromEntries(IMPORT_METRICS.map((metric) => [metric, 0]))
  days.forEach((day) => IMPORT_METRICS.forEach((metric) => { totals[metric] += day[metric] }))

  return {
    days,
    ignored,
    totals,
    total: Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0),
  }
}


export function importedRowMetric(entry) {
  const minutes =
    parseImportMinutes(
      entry?.time,
    )

  return importMetricFor(
    entry?.kind === 'survey'
      ? 'survey'
      : 'point',
    minutes,
  )
}

export function importReplacementKeys(
  aggregate,
) {
  const keys = new Set()

  for (
    const day
    of aggregate?.days || []
  ) {
    for (
      const metric
      of day?.presentMetrics || []
    ) {
      keys.add(
        `${day.date}|${metric}`,
      )
    }
  }

  return keys
}

export function shouldKeepImportedRow(
  entry,
  replacementKeys,
) {
  const date =
    parseImportDate(
      entry?.date,
    )

  const metric =
    importedRowMetric(entry)

  if (!date || !metric) {
    return true
  }

  return !replacementKeys.has(
    `${date}|${metric}`,
  )
}
