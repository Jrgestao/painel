export const SERVICE_METRICS = Object.freeze([
  Object.freeze({ key: 'dayPoints', label: 'Pontos Manhã/Tarde', shortLabel: 'Pontos M/T', sheetName: 'PONTOS M-T' }),
  Object.freeze({ key: 'daySurveys', label: 'Levantamentos Manhã/Tarde', shortLabel: 'Lev. M/T', sheetName: 'LEV M-T' }),
  Object.freeze({ key: 'nightPoints', label: 'Pontos Noite', shortLabel: 'Pontos noite', sheetName: 'PONTOS NOITE' }),
  Object.freeze({ key: 'nightSurveys', label: 'Levantamentos Noite', shortLabel: 'Lev. noite', sheetName: 'LEV NOITE' }),
])

export const SERVICE_METRIC_KEYS = Object.freeze(SERVICE_METRICS.map((item) => item.key))

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
        Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 31 &&
        Number.isFinite(number) && number >= 0 && number <= 999999
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

export function normalizeReportSetting(item = {}) {
  const raw = item?.manual_notes && typeof item.manual_notes === 'object' && !Array.isArray(item.manual_notes)
    ? item.manual_notes
    : {}

  const isV2 = Number(raw._version) >= 2
  const legacyNotes = {}

  if (!isV2) {
    Object.entries(raw).forEach(([key, value]) => {
      if (/^(?:[1-9]|[12]\d|3[01])$/.test(key)) legacyNotes[key] = String(value || '').slice(0, 1600)
    })
  }

  const notesSource = isV2 && raw.notes && typeof raw.notes === 'object' && !Array.isArray(raw.notes)
    ? raw.notes
    : legacyNotes

  const suppressed = new Set(
    Array.isArray(raw.suppressed_notes)
      ? raw.suppressed_notes.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
      : [],
  )

  return {
    displayName: String(item?.display_name || '').trim().slice(0, 80),
    hiddenDays: new Set(
      Array.isArray(item?.hidden_days)
        ? item.hidden_days.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
        : [],
    ),
    manualNotes: cleanManualNotes(notesSource, Boolean(isV2)),
    suppressedNotes: suppressed,
    scoreOverrides: cleanScoreOverrides(raw.score_overrides),
  }
}


export function serializeReportSetting(draft) {
  return {
    _version: 2,
    notes: cleanManualNotes(draft?.manualNotes || {}, true),
    suppressed_notes: [...(draft?.suppressedNotes || [])]
      .map(Number)
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
      .sort((a, b) => a - b),
    score_overrides: cleanScoreOverrides(draft?.scoreOverrides || {}),
  }
}

export function hasScoreOverride(draft, metric, day) {
  return Object.prototype.hasOwnProperty.call(draft?.scoreOverrides?.[metric] || {}, String(day))
}

export function effectiveScore(dayData, draft, metric) {
  const override = draft?.scoreOverrides?.[metric]?.[String(dayData?.day)]
  return Number.isFinite(Number(override)) ? Number(override) : Number(dayData?.[metric] || 0)
}

export function effectiveObservation(dayData, draft) {
  const dayKey = String(dayData?.day || '')
  if (draft?.suppressedNotes?.has(Number(dayKey))) return ''
  if (Object.prototype.hasOwnProperty.call(draft?.manualNotes || {}, dayKey)) {
    return String(draft.manualNotes[dayKey] || '').trim()
  }
  return String(dayData?.autoObservation || '').trim()
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
