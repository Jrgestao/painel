/*
  JR GESTAO - CESIP SMART RESOLVER V32 — LETRAS PRIMEIRO + SEMANTICO + FONETICO

  Resolve nomes imperfeitos de logradouros/bairros contra a tabela oficial
  que o app JR Gestao usa. A decisao prioriza a proximidade ORTOGRAFICA
  (letras escritas), depois nucleo semantico e fonetica. O MENOR codigo CESIP
  e usado somente quando os candidatos continuam realmente equivalentes.
  Sufixos de bairro (I, II, III / 1, 2, 3 / secoes) sao informacao forte.
*/

const STREET_DATA_URL = new URL('./data/cesip-logradouros-v30.json', import.meta.url).href
const NEIGHBORHOOD_DATA_URL = new URL('./data/cesip-bairros-v30.json', import.meta.url).href

const STREET_TYPE_ALIASES = new Map([
  ['R', 'RUA'], ['RUA', 'RUA'],
  ['AV', 'AVENIDA'], ['AVE', 'AVENIDA'], ['AVENIDA', 'AVENIDA'],
  ['AL', 'ALAMEDA'], ['ALAMEDA', 'ALAMEDA'],
  ['TV', 'TRAVESSA'], ['TRAV', 'TRAVESSA'], ['TRAVESSA', 'TRAVESSA'],
  ['ROD', 'RODOVIA'], ['RODOVIA', 'RODOVIA'],
  ['ESTR', 'ESTRADA'], ['EST', 'ESTRADA'], ['ESTRADA', 'ESTRADA'],
  ['PCA', 'PRACA'], ['PRACA', 'PRACA'],
  ['VIELA', 'VIELA'],
])

const TITLE_ALIASES = new Map([
  ['PRES', 'PRESIDENTE'], ['PRESIDENTE', 'PRESIDENTE'],
  ['GOV', 'GOVERNADOR'], ['GOVERNADOR', 'GOVERNADOR'],
  ['DEP', 'DEPUTADO'], ['DEPUTADO', 'DEPUTADO'],
  ['VER', 'VEREADOR'], ['VEREADOR', 'VEREADOR'],
  ['CEL', 'CORONEL'], ['CORONEL', 'CORONEL'],
  ['CAP', 'CAPITAO'], ['CAPITAO', 'CAPITAO'],
  ['TEN', 'TENENTE'], ['TENENTE', 'TENENTE'],
  ['SGT', 'SARGENTO'], ['SARGENTO', 'SARGENTO'],
  ['GEN', 'GENERAL'], ['GENERAL', 'GENERAL'],
  ['MAL', 'MARECHAL'], ['MARECHAL', 'MARECHAL'],
  ['DR', 'DOUTOR'], ['DOUTOR', 'DOUTOR'],
  ['PROF', 'PROFESSOR'], ['PROFESSOR', 'PROFESSOR'],
  ['ENG', 'ENGENHEIRO'], ['ENGENHEIRO', 'ENGENHEIRO'],
  ['ARQ', 'ARQUITETO'], ['ARQUITETO', 'ARQUITETO'],
  ['PE', 'PADRE'], ['PADRE', 'PADRE'],
  ['FREI', 'FREI'],
  ['STA', 'SANTA'], ['SANTA', 'SANTA'],
  ['STO', 'SANTO'], ['SANTO', 'SANTO'],
  ['SAO', 'SAO'],
  ['M', 'MESTRE'], ['ME', 'MESTRE'], ['MST', 'MESTRE'], ['MSTR', 'MESTRE'], ['MSTRE', 'MESTRE'],
  ['MEST', 'MESTRE'], ['MESTR', 'MESTRE'], ['MEXTRE', 'MESTRE'], ['MESTRE', 'MESTRE'],
])

const STOP_WORDS = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E'])
const NEIGHBORHOOD_PREFIXES = new Set(['BAIRRO'])
const NEIGHBORHOOD_LEADING_NOISE = new Set([
  'BAIRRO', 'JD', 'JDM', 'JARDIM', 'VL', 'VILA',
  'NUCLEO', 'NUC', 'HAB', 'HABIT', 'HABITAL', 'HABITACIONAL',
  'CJ', 'CONJ', 'CONJUNTO', 'RES', 'RESID', 'RESIDENCIAL',
  'LOT', 'LOTEAMENTO', 'PARQUE', 'PQ',
])
const NEIGHBORHOOD_TYPE_ALIASES = new Map([
  ['BAIRRO', 'BAIRRO'], ['JARDIM', 'JARDIM'], ['JD', 'JARDIM'], ['JDM', 'JARDIM'],
  ['VILA', 'VILA'], ['VL', 'VILA'], ['LOTEAMENTO', 'LOTEAMENTO'], ['LOT', 'LOTEAMENTO'],
  ['CONJUNTO', 'CONJUNTO'], ['CONJ', 'CONJUNTO'], ['CJ', 'CONJUNTO'],
  ['RESIDENCIAL', 'RESIDENCIAL'], ['RESID', 'RESIDENCIAL'], ['RES', 'RESIDENCIAL'],
  ['PARQUE', 'PARQUE'], ['PQ', 'PARQUE'],
  ['NUCLEO', 'GENERIC'], ['NUC', 'GENERIC'], ['HABITACIONAL', 'GENERIC'], ['HABITAL', 'GENERIC'], ['HABIT', 'GENERIC'], ['HAB', 'GENERIC'],
])
const NUMBER_WORDS = new Map([
  ['ZERO', 0], ['UM', 1], ['UMA', 1], ['DOIS', 2], ['DUAS', 2],
  ['TRES', 3], ['QUATRO', 4], ['CINCO', 5], ['SEIS', 6], ['SETE', 7],
  ['OITO', 8], ['NOVE', 9], ['DEZ', 10], ['ONZE', 11], ['DOZE', 12],
  ['TREZE', 13], ['CATORZE', 14], ['QUATORZE', 14], ['QUINZE', 15],
  ['DEZESSEIS', 16], ['DEZASSEIS', 16], ['DEZESSETE', 17],
  ['DEZOITO', 18], ['DEZENOVE', 19], ['VINTE', 20], ['TRINTA', 30],
  ['QUARENTA', 40], ['CINQUENTA', 50], ['SESSENTA', 60], ['SETENTA', 70],
  ['OITENTA', 80], ['NOVENTA', 90], ['CEM', 100], ['CENTO', 100],
  ['DUZENTOS', 200], ['TREZENTOS', 300], ['QUATROCENTOS', 400],
  ['QUINHENTOS', 500], ['SEISCENTOS', 600], ['SETECENTOS', 700],
  ['OITOCENTOS', 800], ['NOVECENTOS', 900],
])

const NEIGHBORHOOD_ROMAN_NUMBERS_V32 = new Map([
  ['I', '1'], ['II', '2'], ['III', '3'], ['IV', '4'], ['V', '5'],
  ['VI', '6'], ['VII', '7'], ['VIII', '8'], ['IX', '9'], ['X', '10'],
])

const TRAILING_CONTEXT_RE = /\b(?:ESQ(?:\.|UINA)?|ESQUINA(?:\s+(?:COM|C\/))?|CRUZAMENTO(?:\s+(?:COM|C\/))?|CRUZ(?:\.|AMENTO)?(?:\s+(?:COM|C\/))?|C\/)\b/i
const SOFT_CONTEXT_RE = /\b(?:PROX(?:\.|IMO|IMA)?|EM\s+FRENTE|FRENTE|AO\s+LADO|LADO|POSTE|QUADRA|QD\.?|LOTE|LT\.?|FUNDOS|ENTRADA|SAIDA|ROTATORIA)\b/i

let resolverPromiseV30 = null

export function normalizeCesipTextV30(value) {
  return normalizeBase(value).join(' ')
}

export function phoneticCesipTokenV32(value) {
  return phoneticTokenV32(value)
}

function stripDiacritics(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function rawTokens(value) {
  return stripDiacritics(value)
    .toUpperCase()
    .replace(/[º°]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function normalizeNumberWords(tokens) {
  if (!tokens.length) return []
  const out = []
  let index = 0
  while (index < tokens.length) {
    if (!NUMBER_WORDS.has(tokens[index])) {
      out.push(tokens[index])
      index += 1
      continue
    }
    let bestValue = null
    let bestLength = 0
    const maxLength = Math.min(5, tokens.length - index)
    for (let length = 1; length <= maxLength; length += 1) {
      const slice = tokens.slice(index, index + length)
      let total = 0
      let valid = true
      let used = false
      let previousConnector = false
      for (const token of slice) {
        if (token === 'E') {
          if (!used || previousConnector) { valid = false; break }
          previousConnector = true
          continue
        }
        const number = NUMBER_WORDS.get(token)
        if (number == null) { valid = false; break }
        total += number
        used = true
        previousConnector = false
      }
      if (valid && used && !previousConnector) {
        bestValue = total
        bestLength = length
      }
    }
    if (bestValue != null) {
      out.push(String(bestValue))
      index += bestLength
    } else {
      out.push(tokens[index])
      index += 1
    }
  }
  return out
}

function singularNeighborhoodToken(token) {
  if (!token || /^\d+$/.test(token)) return token
  if (token.length >= 7 && /(?:AS|OS)$/.test(token)) return token.slice(0, -1)
  return token
}

function normalizeBase(value, { kind = 'street' } = {}) {
  let tokens = rawTokens(value)
  if (!tokens.length) return []

  let streetType = ''
  let neighborhoodType = ''

  if (kind === 'street' && STREET_TYPE_ALIASES.has(tokens[0])) {
    streetType = STREET_TYPE_ALIASES.get(tokens[0])
    tokens = tokens.slice(1)
  }

  if (kind === 'neighborhood') {
    neighborhoodType = NEIGHBORHOOD_TYPE_ALIASES.get(tokens[0]) || ''
    // O primeiro classificador (BAIRRO/JARDIM/VILA/PARQUE/RESIDENCIAL etc.)
    // vira metadado e sai do nucleo. Depois removemos qualificadores em cadeia:
    // "Parque Residencial Iracy Coelho Netto" -> "Iracy Coelho Netto";
    // "Nucleo Habitacional Aero Rancho" -> "Aero Rancho".
    if (neighborhoodType) tokens = tokens.slice(1)
    while (tokens.length > 1 && NEIGHBORHOOD_LEADING_NOISE.has(tokens[0])) tokens = tokens.slice(1)
  }

  tokens = tokens.map((token, index) => {
    if (kind === 'street' && TITLE_ALIASES.has(token)) return TITLE_ALIASES.get(token)
    if (kind === 'street' && index === 0 && token === 'M') return 'MESTRE'
    if (kind === 'neighborhood') {
      const singular = singularNeighborhoodToken(token)
      return NEIGHBORHOOD_ROMAN_NUMBERS_V32.get(singular) || singular
    }
    return token
  })

  tokens = normalizeNumberWords(tokens)
  Object.defineProperty(tokens, 'streetType', { value: streetType, enumerable: false, configurable: true })
  Object.defineProperty(tokens, 'neighborhoodType', { value: neighborhoodType, enumerable: false, configurable: true })
  return tokens
}

function meaningfulTokens(value, kind) {
  return normalizeBase(value, { kind }).filter((token) => !STOP_WORDS.has(token))
}

function streetTypeOf(value) {
  const tokens = rawTokens(value)
  return STREET_TYPE_ALIASES.get(tokens[0]) || ''
}

function neighborhoodTypeOf(value) {
  const tokens = rawTokens(value)
  return NEIGHBORHOOD_TYPE_ALIASES.get(tokens[0]) || ''
}

function phoneticTokenV32(value) {
  let token = stripDiacritics(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!token || /^\d+$/.test(token)) return token
  token = token
    .replace(/Y/g, 'I')
    .replace(/W/g, 'V')
    .replace(/PH/g, 'F')
    .replace(/SCH/g, 'X')
    .replace(/SH/g, 'X')
    .replace(/CH/g, 'X')
    .replace(/NH/g, 'N')
    .replace(/LH/g, 'L')
    .replace(/CK/g, 'K')
    .replace(/QU(?=[EI])/g, 'K')
    .replace(/GU(?=[EI])/g, 'G')
    .replace(/SC(?=[EI])/g, 'S')
    .replace(/C(?=[EI])/g, 'S')
    .replace(/G(?=[EI])/g, 'J')
    .replace(/Q/g, 'K')
    .replace(/C/g, 'K')
    .replace(/(.)\1+/g, '$1')
  return token
}

function phoneticComparableV32(tokens) {
  return tokens.map(phoneticTokenV32).filter(Boolean).join(' ')
}

function normalizedComparable(value, kind) {
  return meaningfulTokens(value, kind).join(' ')
}

function compact(value) {
  return String(value || '').replace(/\s+/g, '')
}

function grams(token) {
  const text = `^${token}$`
  if (text.length <= 3) return [text]
  const out = []
  for (let i = 0; i <= text.length - 3; i += 1) out.push(text.slice(i, i + 3))
  return [...new Set(out)]
}

function seed(token) {
  return token.slice(0, Math.min(3, token.length))
}

function itemCode(item) {
  return String(item?.code ?? '').trim()
}

function itemName(item) {
  return String(item?.name ?? '').trim()
}

function buildCatalog(items, kind) {
  const entries = []
  const byNormalized = new Map()
  const byPhoneticNormalized = new Map()
  const byToken = new Map()
  const byPhoneticToken = new Map()
  const bySeed = new Map()
  const byGram = new Map()
  const byFirstLength = new Map()
  const byNeighborhoodBase = new Map()

  const add = (map, key, entry) => {
    if (!key) return
    let bucket = map.get(key)
    if (!bucket) map.set(key, bucket = [])
    bucket.push(entry)
  }

  for (const item of Array.isArray(items) ? items : []) {
    const name = itemName(item)
    const code = itemCode(item)
    if (!name || !code) continue
    const tokens = meaningfulTokens(name, kind)
    if (!tokens.length) continue
    const normalized = tokens.join(' ')
    const phoneticTokens = tokens.map(phoneticTokenV32)
    const phoneticNormalized = phoneticTokens.join(' ')
    const neighborhoodSplit = kind === 'neighborhood'
      ? splitNeighborhoodCoreDetailV32(tokens)
      : null
    const entry = {
      item: { code, name }, code, name,
      type: kind === 'street' ? streetTypeOf(name) : neighborhoodTypeOf(name),
      tokens, normalized, compact: compact(normalized), phoneticTokens, phoneticNormalized,
      neighborhoodSplit,
      numericCode: Number.parseInt(code, 10) || Number.MAX_SAFE_INTEGER,
    }
    entries.push(entry)
    add(byNormalized, normalized, entry)
    add(byPhoneticNormalized, phoneticNormalized, entry)
    if (kind === 'neighborhood' && neighborhoodSplit?.coreTokens?.length) {
      add(byNeighborhoodBase, neighborhoodSplit.coreTokens.join(' '), entry)
    }
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]
      const ptoken = phoneticTokens[i]
      add(byToken, token, entry)
      add(byPhoneticToken, ptoken, entry)
      add(bySeed, seed(token), entry)
      add(byFirstLength, `${token[0] || ''}:${token.length}`, entry)
      for (const gram of grams(token)) add(byGram, gram, entry)
    }
  }

  return { kind, entries, byNormalized, byPhoneticNormalized, byToken, byPhoneticToken, bySeed, byGram, byFirstLength, byNeighborhoodBase }
}

function levenshtein(a, b, maxDistance = Infinity) {
  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1
  if (a.length > b.length) [a, b] = [b, a]
  let previous = Array.from({ length: a.length + 1 }, (_, index) => index)
  for (let row = 1; row <= b.length; row += 1) {
    const current = new Array(a.length + 1)
    current[0] = row
    let rowMin = current[0]
    for (let column = 1; column <= a.length; column += 1) {
      const cost = a[column - 1] === b[row - 1] ? 0 : 1
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + cost,
      )
      rowMin = Math.min(rowMin, current[column])
    }
    if (rowMin > maxDistance) return maxDistance + 1
    previous = current
  }
  return previous[a.length]
}

function maxTokenDistance(a, b) {
  const longest = Math.max(a.length, b.length)
  if (longest >= 13) return 3
  if (longest >= 8) return 2
  if (longest >= 4) return 1
  return 0
}

function genderVariantConflictV32(a, b) {
  if (!a || !b || a.length < 7 || b.length < 7 || a.length !== b.length) return false
  const aLast = a.at(-1)
  const bLast = b.at(-1)
  if (!((aLast === 'A' && bLast === 'O') || (aLast === 'O' && bLast === 'A'))) return false
  return a.slice(0, -1) === b.slice(0, -1)
}

function orthographicTokenSimilarityV32(a, b) {
  if (a === b) return 1
  if (!a || !b) return 0
  if (genderVariantConflictV32(a, b)) return 0

  // Inicial oficial: "Maria Aparecida Pedrossian" <-> "MARIA A PEDROSSIAN".
  if (a.length === 1 && b.length >= 4 && b.startsWith(a)) return 0.93
  if (b.length === 1 && a.length >= 4 && a.startsWith(b)) return 0.93

  const shorter = a.length <= b.length ? a : b
  const longer = a.length > b.length ? a : b
  let best = 0
  if (shorter.length >= 3 && longer.startsWith(shorter)) {
    const difference = longer.length - shorter.length
    if (difference <= 2) best = difference === 1 ? 0.97 : 0.92
  }

  // Falta de uma ou duas letras e mais proxima do que trocar uma letra por outra.
  // CHINAGLIA -> CHINAGLA: o menor texto e uma subsequencia perfeita do maior.
  if (shorter.length >= 4 && longer.length - shorter.length >= 1 && longer.length - shorter.length <= 2) {
    let cursor = 0
    for (const char of longer) {
      if (cursor < shorter.length && char === shorter[cursor]) cursor += 1
    }
    if (cursor === shorter.length) {
      const missing = longer.length - shorter.length
      best = Math.max(best, missing === 1 ? 0.99 : 0.95)
    }
  }

  const maxDistance = maxTokenDistance(a, b)
  if (maxDistance) {
    const distance = levenshtein(a, b, maxDistance)
    if (distance <= maxDistance) {
      best = Math.max(best, 1 - (distance / Math.max(a.length, b.length)))
    }
  }
  return best
}

function tokenSimilarity(a, b) {
  const spelling = orthographicTokenSimilarityV32(a, b)
  if (spelling === 1 || !a || !b) return spelling
  if (genderVariantConflictV32(a, b)) return 0

  let best = spelling
  const pa = phoneticTokenV32(a)
  const pb = phoneticTokenV32(b)
  // Fonetica recupera JOQUEI/JOCKEY e erros de digitacao, mas nao pode superar
  // uma grafia claramente mais proxima. Por isso fica abaixo de igualdade escrita.
  if (pa && pa === pb) best = Math.max(best, 0.965)
  else if (pa && pb && pa[0] === pb[0]) {
    const pd = levenshtein(pa, pb, 2)
    if (pd <= 2) best = Math.max(best, (1 - pd / Math.max(pa.length, pb.length)) * 0.92)
  }
  return best
}

function matchTokenSetsWithSimilarityV32(sourceTokens, targetTokens, similarityFn, minimum = 0.72) {
  const pairs = []
  for (let si = 0; si < sourceTokens.length; si += 1) {
    for (let ti = 0; ti < targetTokens.length; ti += 1) {
      const similarity = similarityFn(sourceTokens[si], targetTokens[ti])
      if (similarity >= minimum) pairs.push({ si, ti, similarity })
    }
  }
  pairs.sort((a, b) => b.similarity - a.similarity)

  const usedSource = new Set()
  const usedTarget = new Set()
  const selected = []
  for (const pair of pairs) {
    if (usedSource.has(pair.si) || usedTarget.has(pair.ti)) continue
    usedSource.add(pair.si)
    usedTarget.add(pair.ti)
    selected.push(pair)
  }

  const sourceWeight = sourceTokens.reduce((sum, token) => sum + tokenWeight(token), 0) || 1
  const targetWeight = targetTokens.reduce((sum, token) => sum + tokenWeight(token), 0) || 1
  let sourceMatched = 0
  let targetMatched = 0
  let exactCount = 0
  let distanceCost = 0
  for (const pair of selected) {
    const sw = tokenWeight(sourceTokens[pair.si])
    const tw = tokenWeight(targetTokens[pair.ti])
    sourceMatched += sw * pair.similarity
    targetMatched += tw * pair.similarity
    if (pair.similarity === 1) exactCount += 1
    distanceCost += 1 - pair.similarity
  }

  const ordered = selected
    .slice()
    .sort((a, b) => a.si - b.si)
    .every((pair, index, arr) => index === 0 || pair.ti > arr[index - 1].ti)

  return {
    selected,
    sourceCoverage: sourceMatched / sourceWeight,
    targetCoverage: targetMatched / targetWeight,
    exactCount,
    distanceCost,
    orderScore: ordered ? 1 : 0.72,
  }
}

function matchTokenSets(sourceTokens, targetTokens) {
  return matchTokenSetsWithSimilarityV32(sourceTokens, targetTokens, tokenSimilarity, 0.72)
}

function matchOrthographicTokenSetsV32(sourceTokens, targetTokens) {
  return matchTokenSetsWithSimilarityV32(sourceTokens, targetTokens, orthographicTokenSimilarityV32, 0.72)
}

function tokenWeight(token) {
  if (/^\d+$/.test(token)) return 7
  return Math.max(3, Math.min(12, token.length))
}

function wholeSimilarity(a, b) {
  if (a === b) return 1
  const ca = compact(a)
  const cb = compact(b)
  const longest = Math.max(ca.length, cb.length)
  if (!longest) return 0
  const maxDistance = Math.max(4, Math.ceil(longest * 0.34))
  const distance = levenshtein(ca, cb, maxDistance)
  if (distance > maxDistance) return 0
  return Math.max(0, 1 - distance / longest)
}

function candidatePool(catalog, sourceTokens) {
  const ranked = new Map()
  const bump = (entry, amount) => ranked.set(entry, (ranked.get(entry) || 0) + amount)

  for (const token of sourceTokens) {
    const ptoken = phoneticTokenV32(token)
    for (const entry of catalog.byToken.get(token) || []) bump(entry, 140)
    for (const entry of catalog.byPhoneticToken.get(ptoken) || []) bump(entry, 105)
    for (const entry of catalog.bySeed.get(seed(token)) || []) bump(entry, 28)
  }

  if (ranked.size < 28) {
    for (const token of sourceTokens) {
      for (let delta = -2; delta <= 2; delta += 1) {
        const length = token.length + delta
        if (length < 1) continue
        const bucket = catalog.byFirstLength.get(`${token[0] || ''}:${length}`) || []
        for (let i = 0; i < bucket.length && i < 75; i += 1) bump(bucket[i], 5)
      }
    }
  }

  // Trigramas sao o ultimo recurso para erro forte de digitacao; nao percorre a base inteira.
  if (ranked.size < 18) {
    for (const token of sourceTokens) {
      for (const gram of grams(token)) {
        const bucket = catalog.byGram.get(gram) || []
        for (let i = 0; i < bucket.length && i < 55; i += 1) bump(bucket[i], 2)
      }
    }
  }

  return [...ranked.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].numericCode - b[0].numericCode)
    .slice(0, 56)
    .map(([entry]) => entry)
}

function scoreCandidate(source, candidate, kind) {
  const tokenMatch = matchTokenSets(source.tokens, candidate.tokens)
  if (!tokenMatch.selected.length) return null
  const spellingMatch = matchOrthographicTokenSetsV32(source.tokens, candidate.tokens)

  const whole = wholeSimilarity(source.normalized, candidate.normalized)
  const phoneticWhole = wholeSimilarity(source.phoneticNormalized, candidate.phoneticNormalized)
  const spellingQuality =
    spellingMatch.sourceCoverage * 0.55 +
    spellingMatch.targetCoverage * 0.25 +
    whole * 0.20

  // V32: LETRAS primeiro. Fonetica continua ajudando a encontrar, mas a grafia
  // pesa mais na decisao final (ex.: CHINAGLIA -> CHINAGLA, nao CHINABLIA).
  let score =
    tokenMatch.sourceCoverage * 0.28 +
    tokenMatch.targetCoverage * 0.16 +
    spellingMatch.sourceCoverage * 0.22 +
    spellingMatch.targetCoverage * 0.12 +
    whole * 0.12 +
    phoneticWhole * 0.05 +
    tokenMatch.orderScore * 0.05

  if (source.normalized === candidate.normalized) score += 0.35
  if (source.phoneticNormalized === candidate.phoneticNormalized) score += 0.17
  if (spellingMatch.exactCount >= Math.min(2, source.tokens.length)) score += 0.035

  if (kind === 'street' && source.type) {
    if (candidate.type === source.type) score += 0.035
    else if (candidate.type) score -= 0.07
  }
  if (kind === 'neighborhood' && source.type && source.type !== 'GENERIC') {
    if (candidate.type === source.type) score += 0.025
  }
  if (kind === 'neighborhood' && (!source.type || source.type === 'GENERIC') && candidate.type === 'BAIRRO') {
    score += 0.018
  }

  return {
    entry: candidate,
    score,
    whole,
    phoneticWhole,
    spellingQuality,
    spellingSourceCoverage: spellingMatch.sourceCoverage,
    spellingTargetCoverage: spellingMatch.targetCoverage,
    spellingExactCount: spellingMatch.exactCount,
    ...tokenMatch,
  }
}

function samePhysicalCandidate(a, b) {
  return Boolean(a && b && a.entry.code === b.entry.code)
}

function lowestCodeEntryV32(entries) {
  if (!entries.length) return null
  return entries.slice().sort((a, b) =>
    a.numericCode - b.numericCode || a.name.localeCompare(b.name, 'pt-BR')
  )[0]
}

function pickExactCoreV32(entries, sourceType, kind) {
  if (!entries.length) return null
  if (entries.length === 1) return entries[0]
  if (sourceType && sourceType !== 'GENERIC') {
    const sameType = entries.filter((entry) => entry.type === sourceType)
    if (sameType.length) return lowestCodeEntryV32(sameType)
  }
  if (kind === 'neighborhood') {
    // Sem tipo explicito, "Aero Rancho" deve representar o BAIRRO base (491),
    // nao "LOTEAMENTO Aero Rancho" (467). O tipo semantico vem antes do desempate numerico.
    const baseBairro = entries.filter((entry) => entry.type === 'BAIRRO')
    if (baseBairro.length) return lowestCodeEntryV32(baseBairro)
  }
  // Regra operacional: mesmo nucleo/tipo e mais de um codigo => menor codigo CESIP.
  return lowestCodeEntryV32(entries)
}

const NEIGHBORHOOD_DETAIL_MARKERS_V32 = new Set([
  'SEC', 'SECAO', 'SETOR', 'QUADRA', 'QD', 'Q',
])

function splitNeighborhoodCoreDetailV32(tokens) {
  const list = [...tokens]
  if (!list.length) return { coreTokens: [], detailTokens: [], detailKey: '' }

  // Numero/romano final: IRACY ... II / IRACY ... 2 / AERO RANCHO III.
  const last = list.at(-1)
  if (/^(?:[1-9]|10)$/.test(last)) {
    return {
      coreTokens: list.slice(0, -1),
      detailTokens: [last],
      detailKey: `NUM:${last}`,
    }
  }

  // SEC A, SECAO B, QD 05 etc. A letra so e detalhe quando vem acompanhada
  // do marcador; assim o A de MARIA A PEDROSSIAN continua parte do nome.
  if (list.length >= 2) {
    const marker = list.at(-2)
    const value = list.at(-1)
    if (NEIGHBORHOOD_DETAIL_MARKERS_V32.has(marker) && /^[A-Z0-9-]{1,5}$/.test(value)) {
      return {
        coreTokens: list.slice(0, -2),
        detailTokens: [marker, value],
        detailKey: `${marker}:${value}`,
      }
    }
  }

  return { coreTokens: list, detailTokens: [], detailKey: '' }
}

function exactOrderedSubsetV32(sourceTokens, targetTokens) {
  if (!sourceTokens.length || targetTokens.length < sourceTokens.length) return false
  let cursor = 0
  for (const token of targetTokens) {
    if (cursor < sourceTokens.length && token === sourceTokens[cursor]) cursor += 1
  }
  return cursor === sourceTokens.length
}

function neighborhoodFamilyCandidatesV32(catalog, source) {
  const split = splitNeighborhoodCoreDetailV32(source.tokens)
  if (!split.coreTokens.length) return []
  const exactKey = split.coreTokens.join(' ')
  let family = catalog.byNeighborhoodBase?.get(exactKey) || []

  // O relatorio costuma omitir uma parte oficial do nome, como NETTO em
  // "Iracy Coelho". Com pelo menos duas palavras EXATAS e na mesma ordem,
  // aceitamos somente UMA palavra lexical extra no cadastro CESIP.
  if (!family.length && split.coreTokens.length >= 2) {
    family = catalog.entries.filter((entry) => {
      const candidateSplit = entry.neighborhoodSplit || splitNeighborhoodCoreDetailV32(entry.tokens)
      const target = candidateSplit.coreTokens
      return target.length >= split.coreTokens.length &&
        target.length - split.coreTokens.length <= 1 &&
        exactOrderedSubsetV32(split.coreTokens, target)
    })
  }
  return family
}

function chooseNeighborhoodFamilyV32(catalog, source) {
  let family = neighborhoodFamilyCandidatesV32(catalog, source)
  if (!family.length) return null
  const sourceSplit = splitNeighborhoodCoreDetailV32(source.tokens)

  // Se veio II/2, III/3, SEC A etc. e esse detalhe existe, ele ganha antes
  // de qualquer regra de menor codigo. IRACY COELHO NETTO 2 => 571.
  if (sourceSplit.detailKey) {
    const sameDetail = family.filter((entry) => entry.neighborhoodSplit?.detailKey === sourceSplit.detailKey)
    if (sameDetail.length) family = sameDetail
  }

  if (source.type && source.type !== 'GENERIC') {
    const sameType = family.filter((entry) => entry.type === source.type)
    if (sameType.length) family = sameType
  } else {
    // Sem tipo expresso, o BAIRRO base e mais forte do que LOTEAMENTO.
    // AERO RANCHO => 491, nao 467.
    const bairro = family.filter((entry) => entry.type === 'BAIRRO')
    if (bairro.length) family = bairro
  }

  return lowestCodeEntryV32(family)
}

function isNeighborhoodCoreExpansionV32(sourceTokens, targetTokens) {
  if (!sourceTokens.length || targetTokens.length < sourceTokens.length) return false
  const sourceSplit = splitNeighborhoodCoreDetailV32(sourceTokens)
  const targetSplit = splitNeighborhoodCoreDetailV32(targetTokens)
  if (!sourceSplit.coreTokens.length || !targetSplit.coreTokens.length) return false
  return exactOrderedSubsetV32(sourceSplit.coreTokens, targetSplit.coreTokens) &&
    targetSplit.coreTokens.length - sourceSplit.coreTokens.length <= 1
}

function candidateStrongEnoughV32(candidate, source, kind, thresholds) {
  const coreExpansion = kind === 'neighborhood' &&
    isNeighborhoodCoreExpansionV32(source.tokens, candidate.entry.tokens)
  const officialShortName = candidate.targetCoverage >= 0.94 &&
    candidate.exactCount >= 2 && candidate.sourceCoverage >= 0.50
  const initialOfficialName = candidate.spellingTargetCoverage >= 0.90 &&
    candidate.spellingSourceCoverage >= 0.72 && candidate.spellingExactCount >= 2
  const evidence =
    candidate.exactCount >= 1 ||
    candidate.whole >= 0.84 ||
    candidate.phoneticWhole >= 0.9 ||
    coreExpansion || officialShortName || initialOfficialName
  const targetOk = candidate.targetCoverage >= thresholds.minimumTargetCoverage ||
    (coreExpansion && candidate.sourceCoverage >= 0.66) || officialShortName || initialOfficialName
  const sourceOk = candidate.sourceCoverage >= thresholds.minimumSourceCoverage ||
    officialShortName || initialOfficialName || (coreExpansion && candidate.sourceCoverage >= 0.62)
  return candidate.score >= thresholds.minimumScore && sourceOk && targetOk && evidence
}

function chooseLowerCodeTieV32(scored, source, kind, thresholds) {
  if (!scored.length) return null
  const top = scored[0]
  // Menor codigo SO entra quando a qualidade de escrita tambem esta praticamente
  // empatada. Isso impede 3412/CHINABLIA de vencer 7888/CHINAGLA.
  const spellingTieGap = 0.018
  const strong = scored.filter((candidate) =>
    top.score - candidate.score <= thresholds.minimumGap &&
    Math.abs(top.spellingQuality - candidate.spellingQuality) <= spellingTieGap &&
    candidateStrongEnoughV32(candidate, source, kind, thresholds)
  )
  if (strong.length < 2) return null
  return strong.slice().sort((a, b) =>
    a.entry.numericCode - b.entry.numericCode || b.spellingQuality - a.spellingQuality ||
    b.score - a.score || a.entry.name.localeCompare(b.entry.name, 'pt-BR')
  )[0]
}

function resolveAgainstCatalog(raw, catalog, kind, options = {}) {
  const value = String(raw ?? '').trim()
  const sourceTokens = meaningfulTokens(value, kind)
  if (!sourceTokens.length) return { matched: false, reason: 'empty', raw: value }

  const source = {
    raw: value,
    tokens: sourceTokens,
    normalized: sourceTokens.join(' '),
    phoneticNormalized: phoneticComparableV32(sourceTokens),
    type: kind === 'street' ? streetTypeOf(value) : neighborhoodTypeOf(value),
  }

  if (kind === 'neighborhood') {
    const familyPick = chooseNeighborhoodFamilyV32(catalog, source)
    if (familyPick) {
      const sourceSplit = splitNeighborhoodCoreDetailV32(source.tokens)
      return {
        matched: true, raw: value, code: familyPick.code, name: familyPick.name,
        item: { ...familyPick.item }, score: 1, gap: 1,
        exact: familyPick.normalized === source.normalized,
        familyMatchV32: true,
        detailKeyV32: sourceSplit.detailKey,
        tieBreakLowerCode: true,
        sourceCoverage: 1, targetCoverage: 1,
      }
    }
  }

  const exactEntries = catalog.byNormalized.get(source.normalized) || []
  const exactPick = pickExactCoreV32(exactEntries, source.type, kind)
  if (exactPick) {
    return {
      matched: true, raw: value, code: exactPick.code, name: exactPick.name,
      item: { ...exactPick.item }, score: 1, gap: 1, exact: true,
      sourceCoverage: 1, targetCoverage: 1,
    }
  }

  const phoneticEntries = catalog.byPhoneticNormalized.get(source.phoneticNormalized) || []
  // Igualdade fonetica ajuda a montar candidatos, mas nao fecha o resultado sozinha:
  // nomes diferentes podem soar quase iguais e ter codigos CESIP diferentes.
  let candidates = exactEntries.length
    ? exactEntries
    : [...new Set([...phoneticEntries, ...candidatePool(catalog, sourceTokens)])].slice(0, 112)
  if (!candidates.length) return { matched: false, reason: 'no-candidate', raw: value }

  const scored = candidates
    .map((entry) => scoreCandidate(source, entry, kind))
    .filter(Boolean)
    .sort((a, b) =>
      b.score - a.score ||
      b.spellingQuality - a.spellingQuality ||
      a.entry.numericCode - b.entry.numericCode ||
      a.entry.name.localeCompare(b.entry.name, 'pt-BR')
    )

  if (!scored.length) return { matched: false, reason: 'no-score', raw: value }
  const best = scored[0]
  const distinctSecond = scored.find((item) => !samePhysicalCandidate(item, best)) || null

  const tokenCount = source.tokens.length
  const minimumScore = tokenCount === 1 ? 0.86 : tokenCount === 2 ? 0.815 : 0.785
  const minimumSourceCoverage = tokenCount === 1 ? 0.9 : 0.74
  const minimumTargetCoverage = tokenCount === 1 ? 0.72 : tokenCount === 2 ? 0.63 : 0.57
  const minimumGap = tokenCount === 1 ? 0.085 : tokenCount === 2 ? 0.06 : 0.055
  const thresholds = { minimumScore, minimumSourceCoverage, minimumTargetCoverage, minimumGap }
  const gap = distinctSecond ? best.score - distinctSecond.score : 1

  const exactUnique =
    source.normalized === best.entry.normalized &&
    (!source.type || !best.entry.type || source.type === best.entry.type)

  const bestStrong = exactUnique || candidateStrongEnoughV32(best, source, kind, thresholds)
  let chosen = best
  let tieBreakLowerCode = false

  if (bestStrong && gap < minimumGap) {
    const lowerCodeTie = chooseLowerCodeTieV32(scored, source, kind, thresholds)
    if (lowerCodeTie) {
      chosen = lowerCodeTie
      tieBreakLowerCode = true
    }
  }

  if (!bestStrong) {
    return {
      matched: false,
      ambiguous: gap < minimumGap,
      reason: gap < minimumGap ? 'close-candidates' : 'low-confidence',
      raw: value,
      score: best.score,
      gap,
      candidate: best.entry.item,
      secondCandidate: distinctSecond?.entry.item || null,
    }
  }

  return {
    matched: true,
    raw: value,
    code: chosen.entry.code,
    name: chosen.entry.name,
    item: { ...chosen.entry.item },
    score: Math.min(1, chosen.score),
    gap,
    exact: exactUnique,
    tieBreakLowerCode,
    sourceCoverage: chosen.sourceCoverage,
    targetCoverage: chosen.targetCoverage,
    spellingQuality: chosen.spellingQuality,
    lettersFirstV32: true,
  }
}

function explicitContextCut(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null
  const marker = TRAILING_CONTEXT_RE.exec(stripDiacritics(text).toUpperCase())
  if (marker && marker.index > 0) {
    return {
      primary: text.slice(0, marker.index).replace(/[\s,;:/-]+$/g, '').trim(),
      context: text.slice(marker.index).replace(/^[\s,;:/-]+/g, '').trim(),
      explicit: true,
    }
  }

  const separators = [/\s+[–—-]\s+/, /\s+\/\s+/]
  for (const re of separators) {
    const match = re.exec(text)
    if (match && match.index > 0) {
      return {
        primary: text.slice(0, match.index).trim(),
        context: text.slice(match.index + match[0].length).trim(),
        explicit: true,
      }
    }
  }

  // "Rua X com Rua Y". So considera COM quando ha material dos dois lados.
  const com = /\s+COM\s+/i.exec(stripDiacritics(text).toUpperCase())
  if (com && com.index > 4) {
    return {
      primary: text.slice(0, com.index).trim(),
      context: text.slice(com.index + 1).trim(),
      explicit: true,
    }
  }
  return null
}

function softContextCut(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null
  const normalized = stripDiacritics(text).toUpperCase()
  const marker = SOFT_CONTEXT_RE.exec(normalized)
  if (!marker || marker.index <= 0) return null
  return {
    primary: text.slice(0, marker.index).replace(/[\s,;:/-]+$/g, '').trim(),
    context: text.slice(marker.index).replace(/^[\s,;:/-]+/g, '').trim(),
    explicit: false,
  }
}

function resolveStreetWithContext(raw, streetCatalog) {
  const value = String(raw ?? '').trim()
  if (!value) return { matched: false, raw: value, primary: '', context: '' }

  const split = explicitContextCut(value)
  if (split?.primary && split.context) {
    const primaryResult = resolveAgainstCatalog(split.primary, streetCatalog, 'street')
    if (primaryResult.matched) {
      return { ...primaryResult, primary: split.primary, context: split.context, contextExtracted: true }
    }
  }

  const full = resolveAgainstCatalog(value, streetCatalog, 'street')
  if (full.matched) return { ...full, primary: value, context: '', contextExtracted: false }

  const soft = softContextCut(value)
  if (soft?.primary && soft.context) {
    const primaryResult = resolveAgainstCatalog(soft.primary, streetCatalog, 'street')
    if (
      primaryResult.matched &&
      primaryResult.score >= 0.9 &&
      primaryResult.gap >= 0.055
    ) {
      return { ...primaryResult, primary: soft.primary, context: soft.context, contextExtracted: true }
    }
  }

  return { ...full, primary: value, context: '', contextExtracted: false }
}

export function appendAddressContextV30(observation, context) {
  const base = String(observation ?? '').trim()
  const extra = String(context ?? '').trim().replace(/^[\s•;,-]+|[\s•;,-]+$/g, '')
  if (!extra) return base
  const normalizedBase = normalizeCesipTextV30(base)
  const normalizedExtra = normalizeCesipTextV30(extra)
  if (normalizedExtra && normalizedBase.includes(normalizedExtra)) return base
  return base ? `${base} • ${extra}` : extra
}

export function createCesipSmartResolverV30(streets, neighborhoods) {
  const streetCatalog = buildCatalog(streets, 'street')
  const neighborhoodCatalog = buildCatalog(neighborhoods, 'neighborhood')

  return Object.freeze({
    streetCount: streetCatalog.entries.length,
    neighborhoodCount: neighborhoodCatalog.entries.length,
    resolveStreet(raw) {
      return resolveAgainstCatalog(raw, streetCatalog, 'street')
    },
    resolveStreetWithContext(raw) {
      return resolveStreetWithContext(raw, streetCatalog)
    },
    resolveNeighborhood(raw) {
      return resolveAgainstCatalog(raw, neighborhoodCatalog, 'neighborhood')
    },
  })
}

async function fetchJsonV30(url) {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`Base CESIP indisponivel (${response.status}).`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('Base CESIP invalida.')
  return data
}

export async function getCesipSmartResolverV30() {
  if (!resolverPromiseV30) {
    resolverPromiseV30 = Promise.all([
      fetchJsonV30(STREET_DATA_URL),
      fetchJsonV30(NEIGHBORHOOD_DATA_URL),
    ]).then(([streets, neighborhoods]) => createCesipSmartResolverV30(streets, neighborhoods))
      .catch((error) => {
        resolverPromiseV30 = null
        throw error
      })
  }
  return resolverPromiseV30
}

function recordStreetText(record) {
  const street = record?.street
  if (street && typeof street === 'object') return String(street.name ?? street.nome ?? '').trim()
  return String(street || record?.streetName || record?.streetText || record?.logradouroNome || record?.logradouro || record?.manualStreet || '').trim()
}

function recordNeighborhoodText(record) {
  const neighborhood = record?.neighborhood
  if (neighborhood && typeof neighborhood === 'object') return String(neighborhood.name ?? neighborhood.nome ?? '').trim()
  return String(neighborhood || record?.neighborhoodName || record?.bairroNome || record?.bairro || '').trim()
}

function hasCode(value) {
  return Boolean(String(value?.code ?? '').trim())
}

function nextUiSliceV30() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
      return
    }
    if (typeof setImmediate === 'function') {
      setImmediate(resolve)
      return
    }
    setTimeout(resolve, 0)
  })
}

export async function canonicalizeCodesRecordsV30(records, options = {}) {
  if (!Array.isArray(records) || !records.length) return records || []
  let resolver
  try {
    resolver = await getCesipSmartResolverV30()
  } catch (error) {
    console.warn('[JR V30] Base CESIP nao carregou; exportacao antiga preservada.', error)
    return records
  }

  const stats = {
    total: records.length,
    streetMatched: 0,
    streetUnmatched: 0,
    streetContextMoved: 0,
    neighborhoodMatched: 0,
    neighborhoodUnmatched: 0,
  }
  const result = []
  let sliceStarted = typeof performance !== 'undefined' ? performance.now() : Date.now()

  for (let index = 0; index < records.length; index += 1) {
    const row = records[index]
    const originalRecord = row?.registro || row || {}
    const record = { ...originalRecord }
    let changed = false

    if (!hasCode(record.street)) {
      const rawStreet = recordStreetText(record)
      if (rawStreet) {
        const street = resolver.resolveStreetWithContext(rawStreet)
        if (street.matched) {
          record.street = { ...(record.street && typeof record.street === 'object' ? record.street : {}), code: street.code, name: street.name }
          changed = true
          stats.streetMatched += 1
          if (street.context) {
            record.observation = appendAddressContextV30(record.observation, street.context)
            const directSurvey = String(record?.serviceType?.code || '') === '162'
            const hasSurvey = directSurvey || Boolean(record.surveyPhotoPath || record.surveyPhotoFileName || record.surveyPhotoStoragePath || record.surveyObservation)
            if (hasSurvey) record.surveyObservation = appendAddressContextV30(record.surveyObservation, street.context)
            stats.streetContextMoved += 1
          }
        } else {
          stats.streetUnmatched += 1
        }
      }
    }

    if (!hasCode(record.neighborhood)) {
      const rawNeighborhood = recordNeighborhoodText(record)
      if (rawNeighborhood) {
        const neighborhood = resolver.resolveNeighborhood(rawNeighborhood)
        if (neighborhood.matched) {
          record.neighborhood = { ...(record.neighborhood && typeof record.neighborhood === 'object' ? record.neighborhood : {}), code: neighborhood.code, name: neighborhood.name }
          changed = true
          stats.neighborhoodMatched += 1
        } else {
          stats.neighborhoodUnmatched += 1
        }
      }
    }

    if (row?.registro) result.push(changed ? { ...row, registro: record } : row)
    else result.push(changed ? record : row)

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if ((index + 1) % 45 === 0 || now - sliceStarted > 11) {
      options.onProgress?.({ ...stats, processed: index + 1 })
      await nextUiSliceV30()
      sliceStarted = typeof performance !== 'undefined' ? performance.now() : Date.now()
    }
  }

  options.onProgress?.({ ...stats, processed: records.length, done: true })
  if (typeof window !== 'undefined') window.__JR_CESIP_SMART_STATS_V32__ = { ...stats, updatedAt: Date.now() }
  return result
}
