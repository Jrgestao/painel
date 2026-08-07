export const SERVICE_METRICS = Object.freeze([
  Object.freeze({ key: 'dayPoints', label: 'Pontos Manhã/Tarde', shortLabel: 'Pontos M/T', sheetName: 'PONTOS M-T', period: 'day' }),
  Object.freeze({ key: 'daySurveys', label: 'Levantamentos Manhã/Tarde', shortLabel: 'Lev. M/T', sheetName: 'LEV M-T', period: 'day' }),
  Object.freeze({ key: 'nightPoints', label: 'Pontos Noite', shortLabel: 'Pontos noite', sheetName: 'PONTOS NOITE', period: 'night' }),
  Object.freeze({ key: 'nightSurveys', label: 'Levantamentos Noite', shortLabel: 'Lev. noite', sheetName: 'LEV NOITE', period: 'night' }),
])

export const SERVICE_METRIC_KEYS = Object.freeze(SERVICE_METRICS.map((item) => item.key))
export const SERVICE_PERIOD_KEYS = Object.freeze(['day', 'night'])
export const SERVICE_PERIOD_LABELS = Object.freeze({
  day: 'Manhã/Tarde',
  night: 'Noite',
})

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function daysInMonth(monthKey) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(monthKey || ''))
  if (!match) return 0
  return new Date(Number(match[1]), Number(match[2]), 0).getDate()
}

export function metricPeriod(metricKey) {
  return SERVICE_METRICS.find((item) => item.key === metricKey)?.period || 'day'
}

export function cleanScoreOverrides(value) {
  const result = {}
  SERVICE_METRIC_KEYS.forEach((metric) => {
    const source = value?.[metric]
    if (!source || typeof source !== 'object' || Array.isArray(source)) return

    const metricResult = {}
    Object.entries(source).forEach(([day, raw]) => {
      const dayNumber = Number(day)
      const number = Number(raw)
      if (
        Number.isInteger(dayNumber) &&
        dayNumber >= 1 &&
        dayNumber <= 31 &&
        Number.isFinite(number) &&
        number >= 0 &&
        number <= 999999
      ) {
        metricResult[String(dayNumber)] = Math.round(number)
      }
    })

    if (Object.keys(metricResult).length) result[metric] = metricResult
  })
  return result
}

export function cleanManualNotes(value, keepEmpty = false) {
  const result = {}
  Object.entries(value || {}).forEach(([day, raw]) => {
    const dayNumber = Number(day)
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) return
    const text = String(raw ?? '').trim().slice(0, 1600)
    if (text || keepEmpty) result[String(dayNumber)] = text
  })
  return result
}

function cleanNotesByMetric(value, keepEmpty = false) {
  const result = {}
  SERVICE_METRIC_KEYS.forEach((metric) => {
    result[metric] = cleanManualNotes(value?.[metric] || {}, keepEmpty)
  })
  return result
}

function cleanSuppressedByMetric(value) {
  const result = {}
  SERVICE_METRIC_KEYS.forEach((metric) => {
    const source = Array.isArray(value?.[metric]) ? value[metric] : []
    result[metric] = new Set(
      source
        .map(Number)
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31),
    )
  })
  return result
}

function cleanHiddenMetrics(value) {
  return new Set(
    Array.isArray(value)
      ? value.filter((metric) => SERVICE_METRIC_KEYS.includes(metric))
      : [],
  )
}

function cleanHiddenObservationMetrics(value) {
  return new Set(
    Array.isArray(value)
      ? value.filter((metric) => SERVICE_METRIC_KEYS.includes(metric))
      : [],
  )
}

function cleanManualImportantByMetric(value) {
  const result = {}

  SERVICE_METRIC_KEYS.forEach((metric) => {
    const source = Array.isArray(value?.[metric])
      ? value[metric]
      : []

    result[metric] = new Set(
      source
        .map(Number)
        .filter(
          (day) =>
            Number.isInteger(day) &&
            day >= 1 &&
            day <= 31,
        ),
    )
  })

  return result
}

function cleanImportedScoresByMetric(value) {
  return cleanScoreOverrides(value || {})
}

function cleanImportedNotesByMetric(value) {
  return cleanNotesByMetric(value || {}, true)
}


function cleanImportedRows(value) {
  if (!Array.isArray(value)) return []

  return value
    .slice(-15000)
    .map((item) => {
      const date = String(item?.date || '').slice(0, 10)
      const kind = item?.kind === 'survey' ? 'survey' : 'point'
      const products = Array.isArray(item?.products)
        ? item.products.slice(0, 10).map((product) => ({
            code: String(product?.code || '').trim().slice(0, 80),
            name: String(product?.name || '').trim().slice(0, 180),
            quantity: String(product?.quantity ?? '').trim().slice(0, 40),
          }))
        : []

      return {
        date,
        time: String(item?.time || '').trim().slice(0, 180),
        kind,
        serviceCode: String(item?.serviceCode || '').trim().slice(0, 80),
        serviceName: String(item?.serviceName || '').trim().slice(0, 180),
        streetCode: String(item?.streetCode || '').trim().slice(0, 100),
        streetName: String(item?.streetName || '').trim().slice(0, 220),
        number: String(item?.number ?? '').trim().slice(0, 60),
        neighborhoodCode: String(item?.neighborhoodCode || '').trim().slice(0, 100),
        neighborhoodName: String(item?.neighborhoodName || '').trim().slice(0, 220),
        orderNumber: String(item?.orderNumber || '').trim().slice(0, 120),
        observation: String(item?.observation || '').trim().slice(0, 1600),
        surveyObservation: String(item?.surveyObservation || '').trim().slice(0, 1600),
        products,
        sourceFormat: String(item?.sourceFormat || '').trim().slice(0, 30),
        sourceFile: String(item?.sourceFile || '').trim().slice(0, 220),
        sourceRow: Number(item?.sourceRow || 0) || 0,
      }
    })
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date))
}

function cleanMatrixCacheV21(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const fingerprint = String(value.fingerprint || '').trim().slice(0, 240)
  const month = String(value.month || '').slice(0, 7)
  const teams = Array.isArray(value.teams) ? value.teams : []
  if (!fingerprint || !/^\d{4}-\d{2}$/.test(month) || teams.length > 80) return null

  return {
    fingerprint,
    month,
    updatedAt: String(value.updatedAt || '').slice(0, 40),
    teams: teams.map((team) => ({
      key: String(team?.key || '').slice(0, 180),
      originalName: String(team?.originalName || '').slice(0, 180),
      days: Array.isArray(team?.days)
        ? team.days.slice(0, 31).map((day) => ({
            day: Number(day?.day || 0),
            dayPoints: Number(day?.dayPoints || 0),
            daySurveys: Number(day?.daySurveys || 0),
            nightPoints: Number(day?.nightPoints || 0),
            nightSurveys: Number(day?.nightSurveys || 0),
            autoObservationByMetric: Object.fromEntries(
              SERVICE_METRIC_KEYS.map((metric) => [
                metric,
                String(day?.autoObservationByMetric?.[metric] || '').slice(0, 1600),
              ]),
            ),
          }))
        : [],
    })).filter((team) => team.key),
  }
}

function metricNotesFromPeriodNotes(periodNotes) {
  return {
    dayPoints: { ...(periodNotes?.day || {}) },
    daySurveys: { ...(periodNotes?.day || {}) },
    nightPoints: { ...(periodNotes?.night || {}) },
    nightSurveys: { ...(periodNotes?.night || {}) },
  }
}

function metricSuppressionFromPeriodSuppression(periodSuppression) {
  const day = new Set(periodSuppression?.day || [])
  const night = new Set(periodSuppression?.night || [])
  return {
    dayPoints: new Set(day),
    daySurveys: new Set(day),
    nightPoints: new Set(night),
    nightSurveys: new Set(night),
  }
}

export function normalizeReportSetting(item = {}) {
  const raw = item?.manual_notes && typeof item.manual_notes === 'object' && !Array.isArray(item.manual_notes)
    ? item.manual_notes
    : {}

  const version = Number(raw._version) || 1
  let notesByMetric = cleanNotesByMetric({}, true)
  let suppressedByMetric = cleanSuppressedByMetric({})

  if (version >= 4) {
    notesByMetric = cleanNotesByMetric(raw.notes_by_metric, true)
    suppressedByMetric = cleanSuppressedByMetric(raw.suppressed_notes_by_metric)
  } else if (version >= 3) {
    const notesByPeriod = {
      day: cleanManualNotes(raw.notes_by_period?.day || {}, true),
      night: cleanManualNotes(raw.notes_by_period?.night || {}, true),
    }
    const suppressedByPeriod = {
      day: new Set(
        (Array.isArray(raw.suppressed_notes_by_period?.day) ? raw.suppressed_notes_by_period.day : [])
          .map(Number)
          .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31),
      ),
      night: new Set(
        (Array.isArray(raw.suppressed_notes_by_period?.night) ? raw.suppressed_notes_by_period.night : [])
          .map(Number)
          .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31),
      ),
    }

    notesByMetric = metricNotesFromPeriodNotes(notesByPeriod)
    suppressedByMetric = metricSuppressionFromPeriodSuppression(suppressedByPeriod)
  } else {
    const legacyNotes = {}

    if (version >= 2 && raw.notes && typeof raw.notes === 'object' && !Array.isArray(raw.notes)) {
      Object.assign(legacyNotes, cleanManualNotes(raw.notes, true))
    } else {
      Object.entries(raw).forEach(([key, value]) => {
        if (/^(?:[1-9]|[12]\d|3[01])$/.test(key)) {
          legacyNotes[key] = String(value || '').trim().slice(0, 1600)
        }
      })
    }

    SERVICE_METRIC_KEYS.forEach((metric) => {
      notesByMetric[metric] = { ...legacyNotes }
    })

    const legacySuppressed = new Set(
      (Array.isArray(raw.suppressed_notes) ? raw.suppressed_notes : [])
        .map(Number)
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31),
    )

    SERVICE_METRIC_KEYS.forEach((metric) => {
      suppressedByMetric[metric] = new Set(legacySuppressed)
    })
  }

  return {
    displayName: String(item?.display_name || '').trim().slice(0, 80),
    hiddenDays: new Set(
      Array.isArray(item?.hidden_days)
        ? item.hidden_days
            .map(Number)
            .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
        : [],
    ),
    manualNotesByMetric: notesByMetric,
    suppressedNotesByMetric: suppressedByMetric,
    scoreOverrides: cleanScoreOverrides(raw.score_overrides),
    hiddenMetrics: cleanHiddenMetrics(raw.hidden_metrics),
    hiddenObservationMetrics: cleanHiddenObservationMetrics(raw.hidden_observation_metrics),
    manualImportantByMetric: cleanManualImportantByMetric(
      raw.manual_important_by_metric,
    ),
    importedScoresByMetric: cleanImportedScoresByMetric(
      raw.imported_scores_by_metric,
    ),
    importedNotesByMetric: cleanImportedNotesByMetric(
      raw.imported_notes_by_metric,
    ),
    importedRows: cleanImportedRows(
      raw.imported_rows,
    ),
    matrixCacheV21: cleanMatrixCacheV21(
      raw.matrix_cache_v21,
    ),
  }
}

export function serializeReportSetting(draft) {
  const suppressed = {}
  const manualImportant = {}

  SERVICE_METRIC_KEYS.forEach((metric) => {
    suppressed[metric] = [...(draft?.suppressedNotesByMetric?.[metric] || [])]
      .map(Number)
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
      .sort((a, b) => a - b)

    manualImportant[metric] = [
      ...(draft?.manualImportantByMetric?.[metric] || []),
    ]
      .map(Number)
      .filter(
        (day) =>
          Number.isInteger(day) &&
          day >= 1 &&
          day <= 31,
      )
      .sort((a, b) => a - b)
  })

  return {
    _version: 7,
    notes_by_metric: cleanNotesByMetric(draft?.manualNotesByMetric || {}, true),
    suppressed_notes_by_metric: suppressed,
    score_overrides: cleanScoreOverrides(draft?.scoreOverrides || {}),
    hidden_metrics: [...(draft?.hiddenMetrics || [])]
      .filter((metric) => SERVICE_METRIC_KEYS.includes(metric))
      .sort(),
    hidden_observation_metrics: [...(draft?.hiddenObservationMetrics || [])]
      .filter((metric) => SERVICE_METRIC_KEYS.includes(metric))
      .sort(),
    manual_important_by_metric: manualImportant,
    imported_scores_by_metric: cleanImportedScoresByMetric(
      draft?.importedScoresByMetric || {},
    ),
    imported_notes_by_metric: cleanImportedNotesByMetric(
      draft?.importedNotesByMetric || {},
      true,
    ),
    imported_rows: cleanImportedRows(
      draft?.importedRows || [],
    ),
    matrix_cache_v21: cleanMatrixCacheV21(
      draft?.matrixCacheV21,
    ),
  }
}

export function hasScoreOverride(draft, metric, day) {
  return Object.prototype.hasOwnProperty.call(
    draft?.scoreOverrides?.[metric] || {},
    String(day),
  )
}

export function hasImportedScore(draft, metric, day) {
  return Object.prototype.hasOwnProperty.call(
    draft?.importedScoresByMetric?.[metric] || {},
    String(day),
  )
}

export function effectiveScore(dayData, draft, metric) {
  const dayKey = String(dayData?.day)
  const override = draft?.scoreOverrides?.[metric]?.[dayKey]
  if (Number.isFinite(Number(override))) return Number(override)

  const imported = draft?.importedScoresByMetric?.[metric]?.[dayKey]
  if (Number.isFinite(Number(imported))) return Number(imported)

  return Number(dayData?.[metric] || 0)
}

export function isMetricHidden(draft, metric) {
  return Boolean(draft?.hiddenMetrics?.has(metric))
}

export function isObservationHidden(draft, metric) {
  return Boolean(draft?.hiddenObservationMetrics?.has(metric))
}

export function effectiveObservationParts(dayData, draft, metricKey = 'dayPoints') {
  const metric = SERVICE_METRIC_KEYS.includes(metricKey) ? metricKey : 'dayPoints'
  const period = metricPeriod(metric)
  const dayNumber = Number(dayData?.day || 0)
  const dayKey = String(dayNumber)

  const suppressed = Boolean(
    draft?.suppressedNotesByMetric?.[metric]?.has(dayNumber),
  )

  const automatic = suppressed
    ? ''
    : String(dayData?.autoObservationByMetric?.[metric] || '').trim()

  const imported = String(
    draft?.importedNotesByMetric?.[metric]?.[dayKey] || '',
  ).trim()

  const manual = String(
    draft?.manualNotesByMetric?.[metric]?.[dayKey] || '',
  ).trim()

  const manualImportant = Boolean(
    draft?.manualImportantByMetric?.[metric]?.has(
      dayNumber,
    ),
  )

  return {
    metric,
    period,
    automatic,
    imported,
    manual,
    manualImportant,
    hasImportant:
      Boolean(automatic) ||
      Boolean(imported) ||
      manualImportant,
    hasImported: Boolean(imported),
    hasManual: Boolean(manual),
    text: [automatic, imported, manual].filter(Boolean).join(' • '),
  }
}

export function effectiveObservation(dayData, draft, metricKey = 'dayPoints') {
  return effectiveObservationParts(dayData, draft, metricKey).text
}

function productItems(record) {
  return Array.isArray(record?.products)
    ? record.products.map((entry) => ({
        code: String(entry?.product?.code || '').trim(),
        name: String(entry?.product?.name || '').trim(),
      }))
    : []
}

function firstRelevantClause(rawObservation, patterns) {
  const clauses = String(rawObservation || '')
    .split(/[\n;|]+|(?<=[.!?])\s+/)
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter(Boolean)

  const clause = clauses.find((item) => patterns.some((pattern) => pattern.test(normalizeText(item))))
  return clause ? clause.slice(0, 180) : ''
}

function addDetected(result, label, rawObservation, patterns) {
  const detail = firstRelevantClause(rawObservation, patterns)
  const normalizedLabel = normalizeText(label)
  const normalizedDetail = normalizeText(detail)
  const text = detail && normalizedDetail !== normalizedLabel && !normalizedLabel.includes(normalizedDetail)
    ? `${label} — ${detail}`
    : label
  result.add(text)
}

export function detectImportantServices(record = {}) {
  const serviceCode = String(record?.serviceType?.code || '').trim()
  const serviceName = String(record?.serviceType?.name || '')
  const observationRaw = String(record?.observation || '')
  const products = productItems(record)
  const productText = products.map((item) => `${item.code} ${item.name}`).join(' ')
  const searchable = normalizeText(`${serviceName} ${observationRaw} ${productText}`)
  const result = new Set()

  const excavation = [/escav/, /valeta/, /\bvala\b/, /buraco/, /cavacao/, /cavar/, /coveamento/, /perfuracao/, /abertura de vala/, /trincheira/]
  if (serviceCode === '42' || excavation.some((pattern) => pattern.test(searchable))) {
    addDetected(result, 'ESCAVAÇÃO / VALETA / BURACO', observationRaw, excavation)
  }

  const cable = [/lancamento de cabo/, /lancar cabo/, /lanc cabo/, /cabo aereo/, /cabo subterraneo/, /cabo duplex/, /cabo triplex/, /cabo quadriplex/]
  if (serviceCode === '134' || cable.some((pattern) => pattern.test(searchable))) {
    const label = /cabo aereo/.test(searchable)
      ? 'LANÇAMENTO DE CABO AÉREO'
      : /cabo subterraneo/.test(searchable)
        ? 'LANÇAMENTO DE CABO SUBTERRÂNEO'
        : 'LANÇAMENTO DE CABO'
    addDetected(result, label, observationRaw, cable)
  }

  const reflector = [/refletor/, /refletores/, /implt de refletor/, /implantacao de refletor/, /instalacao de refletor/]
  if (reflector.some((pattern) => pattern.test(searchable))) {
    const label = /troca|substituicao|substituir/.test(searchable)
      ? 'TROCA DE REFLETOR'
      : 'IMPLANTAÇÃO / INSTALAÇÃO DE REFLETOR'
    addDetected(result, label, observationRaw, reflector)
  }

  const outlet = [/tomada/, /tomadas/]
  if (outlet.some((pattern) => pattern.test(searchable))) {
    addDetected(result, 'INSTALAÇÃO / TROCA DE TOMADA', observationRaw, outlet)
  }

  const lamp = [/lampada/, /lampadas/, /lamp led/, /bulbo led/, /modulo led/]
  if (lamp.some((pattern) => pattern.test(searchable))) {
    addDetected(result, 'INSTALAÇÃO / TROCA DE LÂMPADAS OU LED', observationRaw, lamp)
  }

  const contactor = [/contactora/, /contatora/, /contator/, /contact/]
  if (products.some((item) => item.code === '16') || contactor.some((pattern) => pattern.test(searchable))) {
    const label = /troca|substituicao|substituir/.test(searchable)
      ? 'TROCA DE CONTACTORA'
      : /instalacao|instalar|implantacao|implt/.test(searchable)
        ? 'INSTALAÇÃO DE CONTACTORA'
        : 'CONTACTORA'
    addDetected(result, label, observationRaw, contactor)
  }

  const post = [/implantacao de poste/, /implt de poste/, /implantar poste/, /poste novo/, /poste implantado/]
  if (post.some((pattern) => pattern.test(searchable))) {
    addDetected(result, 'IMPLANTAÇÃO DE POSTE', observationRaw, post)
  }

  const commandBox = [/caixa de comando/, /quadro de comando/, /painel de comando/]
  if (commandBox.some((pattern) => pattern.test(searchable))) {
    addDetected(result, 'CAIXA / QUADRO DE COMANDO', observationRaw, commandBox)
  }

  const standard = [/implantacao de padrao/, /instalacao de padrao/, /padrao novo/, /troca de padrao/]
  if (standard.some((pattern) => pattern.test(searchable))) {
    addDetected(result, 'PADRÃO ELÉTRICO', observationRaw, standard)
  }

  const importantPlaces = [
    ['EVENTO', [/evento/, /festa/, /feira/, /festival/, /exposicao/]],
    ['PRAÇA', [/praca/]],
    ['CAMPO / ESTÁDIO', [/campo de futebol/, /\bcampo\b/, /estadio/]],
    ['ESCOLA / CRECHE', [/escola/, /creche/, /ceinf/, /cmei/, /colegio/]],
    ['QUADRA / GINÁSIO', [/quadra/, /ginasio/]],
    ['PARQUE', [/parque/]],
    ['UNIDADE DE SAÚDE', [/posto de saude/, /ubs/, /hospital/, /unidade de saude/]],
    ['CENTRO COMUNITÁRIO', [/centro comunitario/, /associacao de moradores/]],
    ['IGREJA', [/igreja/, /templo/]],
  ]

  importantPlaces.forEach(([label, patterns]) => {
    if (patterns.some((pattern) => pattern.test(searchable))) {
      addDetected(result, label, observationRaw, patterns)
    }
  })

  return [...result]
}
