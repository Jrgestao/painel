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


/*
  V34 — Servico importante conservador + contexto de endereco.
  Nao marca material comum por existir na linha: RELE, FIO e LED sozinho
  deixaram de ser gatilhos. A intencao do servico precisa bater com as regras
  definidas no JR Gestao.
*/
function damerauDistanceV33(a, b) {
  const left = String(a || '')
  const right = String(b || '')
  const rows = left.length + 1
  const cols = right.length + 1
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0))
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
      if (
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1)
      }
    }
  }
  return matrix[left.length][right.length]
}

function fuzzyWordV33(text, canonical, options = {}) {
  const source = normalizeImportText(text)
  const target = normalizeImportText(canonical)
  if (!source || !target) return false
  const targetFirst = target.slice(0, 1)
  const targetSecond = target.slice(0, 2)
  const tokens = source.split(' ').filter(Boolean)
  const maxDistance = Number.isFinite(options.maxDistance)
    ? Number(options.maxDistance)
    : target.length >= 9
      ? 2
      : 1

  return tokens.some((token) => {
    if (token === target) return true
    if (token.length < 4 || target.length < 4) return false
    if (token.slice(0, 1) !== targetFirst) return false
    if (target.length <= 6 && token.slice(0, 2) !== targetSecond) return false
    if (Math.abs(token.length - target.length) > maxDistance) return false
    const distance = damerauDistanceV33(token, target)
    if (distance > maxDistance) return false

    // Palavras curtas geram muito falso positivo por uma simples substituicao
    // (ex.: PODA x PODE, CAMPO x CANTO). Nelas aceitamos 1 erro apenas quando
    // parece tecla a mais/a menos ou troca de duas letras vizinhas.
    if (target.length <= 5 && distance === 1) {
      if (token.length !== target.length) return true
      let mismatch = -1
      for (let i = 0; i < target.length; i += 1) {
        if (token[i] !== target[i]) { mismatch = i; break }
      }
      return mismatch >= 0 && mismatch < target.length - 1 &&
        token[mismatch] === target[mismatch + 1] &&
        token[mismatch + 1] === target[mismatch] &&
        token.slice(0, mismatch) === target.slice(0, mismatch) &&
        token.slice(mismatch + 2) === target.slice(mismatch + 2)
    }
    return true
  })
}

function fuzzyAnyWordV33(text, words) {
  return words.some((word) => fuzzyWordV33(text, word))
}

const IMPORTANT_FUZZY_WORDS_V33 = [
  'contactora', 'contatora', 'contator', 'comando',
  'escavacao', 'valeta', 'buraco', 'poda',
  'refletor', 'tomada', 'soquete', 'lampada', 'extensao',
  'evento', 'praca', 'campo',
]

const IMPORTANT_FUZZY_INSTALL_ACTIONS_V33 = [
  'implantacao', 'instalacao', 'colocacao', 'montagem',
]

const IMPORTANT_FUZZY_CABLE_ACTIONS_V33 = [
  'lancamento', 'passagem', 'enterrar', 'subterraneo',
  'aereo', 'terrestre',
]

const IMPORTANT_SIMPLE_PATTERNS_V33 = [
  /\bcontact\w*/, /\bcontator\w*/, /\bcontactor\w*/,
  /\bcomando\b/,
  /\bescav\w*/, /\bvaleta\b/, /\bvala\b/, /\bburaco\b/, /\bcavac\w*/, /\bcavar\b/, /\btrincheira\b/,
  /\bpoda\w*/, /\bpodar\w*/, /\bdesgalh\w*/, /\bcorte\w*.{0,50}\bgalho\w*/,
  /\brefletor\w*/, /\bholofote\w*/,
  /\btomad\w*/, /\bsoquet\w*/,
  /\blampad\w*/,
  /\bextens\w*/,
  /\bevento\w*/, /\bfesta\b/, /\bfeira\b/, /\bfestival\b/, /\bshow\b/,
  /\bpraca\b/,
  /\bcampo\b/, /\bestadio\b/,
  /\bsuper\s*poste\b/,
]

const IMPORTANT_INSTALL_ACTION_V33 = /\b(?:implant\w*|instal\w*|coloc\w*|mont\w*|fix\w*|ergu\w*|assent\w*)\b/
const IMPORTANT_CABLE_ACTION_V33 = /\b(?:lanc\w*|pux\w*|pass\w*|estic\w*|enterr\w*|subterr\w*|aere\w*|terrest\w*)\b/
const IMPORTANT_CABLE_OBJECT_V33 = /\b(?:cabo\w*|fiacao\w*|rede\w*|fio\w*)\b/
const IMPORTANT_TRUCK_HELP_V33 = /(?:\b(?:ajud\w*|apoio\w*|auxil\w*|suporte\w*)\b.{0,80}\bcami(?:nh)?(?:ao|oes)\b|\bcami(?:nh)?(?:ao|oes)\b.{0,80}\b(?:ajud\w*|apoio\w*|auxil\w*|suporte\w*)\b)/

const IMPORTANT_AVENUE_WORD_V34 = /\b(?:avenida|av)\b/
const ADDRESS_CONTEXT_BEFORE_AVENUE_V34 = /\b(?:esq(?:uina)?|cruz(?:amento)?|cruzamento)\b.{0,70}\b(?:avenida|av)\b/

function hasImportantAvenueContextV34(text) {
  if (!IMPORTANT_AVENUE_WORD_V34.test(text)) return false
  // Avenida continua podendo ser servico/local importante quando escrita como
  // "servico na avenida". Mas "esquina/cruzamento com avenida" e apenas
  // referencia de endereco e deve permanecer somente na observacao.
  return !ADDRESS_CONTEXT_BEFORE_AVENUE_V34.test(text)
}

export function isImportantObservationV33(value) {
  const text = normalizeImportText(value)
  if (!text) return false

  if (IMPORTANT_SIMPLE_PATTERNS_V33.some((pattern) => pattern.test(text))) return true
  if (fuzzyAnyWordV33(text, IMPORTANT_FUZZY_WORDS_V33)) return true
  if (hasImportantAvenueContextV34(text)) return true

  const fuzzyInstall = fuzzyAnyWordV33(text, IMPORTANT_FUZZY_INSTALL_ACTIONS_V33)
  const fuzzyCableAction = fuzzyAnyWordV33(text, IMPORTANT_FUZZY_CABLE_ACTIONS_V33)

  const cableContext = IMPORTANT_CABLE_OBJECT_V33.test(text) && (
    IMPORTANT_CABLE_ACTION_V33.test(text) ||
    fuzzyCableAction ||
    /\b(?:subterraneo|subterranea|aereo|aerea|terrestre|chao)\b/.test(text)
  )
  if (cableContext) return true

  if (IMPORTANT_TRUCK_HELP_V33.test(text)) return true

  const postInstall = /\bposte\w*\b/.test(text) && (IMPORTANT_INSTALL_ACTION_V33.test(text) || fuzzyInstall)
  if (postInstall) return true

  return false
}

export function splitImportedObservationV28(value) {
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

export function importantObservationLinesV28(value) {
  const result = []
  const seen = new Set()

  for (
    const line
    of splitImportedObservationV28(value)
  ) {
    const normalized =
      normalizeImportText(line)

    if (!isImportantObservationV33(normalized)) continue

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

export function importedObservationTextV28(entry) {
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

export function importedImportantLinesV28(entry) {
  return importantObservationLinesV28(
    importedObservationTextV28(entry),
  )
}

export function rebuildImportedNotesByMetricV28(rows) {
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
      importedImportantLinesV28(entry)

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

export function mergeRebuiltImportedNotesV28(
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


export function rebuildImportedScoresByMetricV28(rows) {
  const scores = Object.fromEntries(
    IMPORT_METRICS.map((metric) => [metric, {}]),
  )

  for (const entry of rows || []) {
    const date = parseImportDate(entry?.date)
    const metric = importedRowMetric(entry)

    if (!date || !metric) continue

    const dayKey = String(Number(date.slice(8, 10)))
    scores[metric][dayKey] =
      Number(scores[metric][dayKey] || 0) + 1
  }

  return scores
}

export function mergeRebuiltImportedScoresV28(current, rebuilt) {
  const result = JSON.parse(JSON.stringify(current || {}))

  for (const metric of IMPORT_METRICS) {
    if (!result[metric]) result[metric] = {}

    for (const [dayKey, value] of Object.entries(rebuilt?.[metric] || {})) {
      result[metric][dayKey] = Number(value || 0)
    }
  }

  return result
}
