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


const IMPORT_IMPORTANT_PATTERNS_V25 = [
  /contactora/,
  /contatora/,
  /contator/,
  /remocao.{0,50}contact/,
  /retirada.{0,50}contact/,
  /instalacao.{0,50}contact/,
  /troca.{0,50}contact/,
  /lancamento.{0,120}\bcabo\b/,
  /lancar.{0,120}\bcabo\b/,
  /implantacao.{0,120}\bcabo\b/,
  /remov(?:endo|er|ido|ida|ao)?.{0,120}\bcabo\b/,
  /retir(?:ando|ar|ado|ada|adao)?.{0,120}\bcabo\b/,
  /\bcabo\b.{0,80}cortad/,
  /\bcabo\b.{0,80}rompid/,
  /\bcabo\b.{0,80}furtad/,
  /cabo aereo/,
  /cabo subterraneo/,
  /cabo duplex/,
  /cabo triplex/,
  /cabo quadriplex/,
  /escav/,
  /valeta/,
  /\bvala\b/,
  /buraco/,
  /cavacao/,
  /coveamento/,
  /perfuracao/,
  /refletor/,
  /tomada/,
  /lampada/,
  /lamp led/,
  /modulo led/,
  /implantacao.{0,80}\bposte\b/,
  /instalacao.{0,80}\bposte\b/,
  /poste novo/,
  /caixa de comando/,
  /quadro de comando/,
  /painel de comando/,
  /implantacao de padrao/,
  /instalacao de padrao/,
  /troca de padrao/,
  /\bevento\b/,
  /\bfesta\b/,
  /\bfeira\b/,
  /\bfestival\b/,
  /\bpraca\b/,
  /campo de futebol/,
  /\bestadio\b/,
  /\bescola\b/,
  /\bcreche\b/,
  /\bceinf\b/,
  /\bcmei\b/,
  /\bcolegio\b/,
  /\bquadra\b/,
  /\bginasio\b/,
  /\bparque\b/,
  /posto de saude/,
  /\bubs\b/,
  /\bhospital\b/,
  /unidade de saude/,
  /centro comunitario/,
  /associacao de moradores/,
  /\bigreja\b/,
  /\btemplo\b/,
]

export function splitImportedObservationV25(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .split(
      /\n+|[;|]+|(?<=[.!?])\s+/,
    )
    .map((item) =>
      item
        .trim()
        .replace(/\s+/g, ' '),
    )
    .filter(Boolean)
}

export function importantObservationLinesV25(value) {
  const result = []
  const seen = new Set()

  for (
    const line
    of splitImportedObservationV25(value)
  ) {
    const normalized =
      normalizeImportText(line)

    const important =
      IMPORT_IMPORTANT_PATTERNS_V25
        .some((pattern) =>
          pattern.test(normalized),
        )

    if (!important) continue

    const key =
      normalizeImportText(line)

    if (seen.has(key)) continue
    seen.add(key)

    result.push(
      line.slice(0, 300),
    )
  }

  return result
}

export function importedObservationTextV25(entry) {
  return [
    entry?.observation,
    entry?.surveyObservation,
  ]
    .map((item) =>
      String(item || '').trim(),
    )
    .filter(Boolean)
    .join('\n')
}

export function importedImportantLinesV25(entry) {
  return importantObservationLinesV25(
    importedObservationTextV25(entry),
  )
}

export function rebuildImportedNotesByMetricV25(rows) {
  const notes = Object.fromEntries(
    IMPORT_METRICS.map(
      (metric) => [metric, {}],
    ),
  )

  const buckets = new Map()

  for (const entry of rows || []) {
    const date =
      parseImportDate(
        entry?.date,
      )

    const metric =
      importedRowMetric(entry)

    if (!date || !metric) {
      continue
    }

    const lines =
      importedImportantLinesV25(entry)

    if (!lines.length) continue

    const dayKey =
      String(
        Number(
          date.slice(8, 10),
        ),
      )

    const key =
      `${metric}|${dayKey}`

    if (!buckets.has(key)) {
      buckets.set(
        key,
        new Map(),
      )
    }

    const bucket =
      buckets.get(key)

    for (const line of lines) {
      bucket.set(
        normalizeImportText(line),
        line,
      )
    }
  }

  for (
    const [key, bucket]
    of buckets
  ) {
    const [metric, dayKey] =
      key.split('|')

    const text =
      [...bucket.values()]
        .join(' • ')
        .slice(0, 1550)

    if (text) {
      notes[metric][dayKey] =
        `IMPORTADO: ${text}`
    }
  }

  return notes
}

export function mergeRebuiltImportedNotesV25(
  current,
  rebuilt,
) {
  const result =
    JSON.parse(
      JSON.stringify(
        current || {},
      ),
    )

  for (const metric of IMPORT_METRICS) {
    if (!result[metric]) {
      result[metric] = {}
    }

    for (
      const [dayKey, text]
      of Object.entries(
        rebuilt?.[metric] || {},
      )
    ) {
      /*
        Prefere a observação reconstruída a partir da planilha,
        porque ela preserva exatamente o texto original do Excel.
      */
      result[metric][dayKey] =
        text
    }
  }

  return result
}
