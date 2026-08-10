// JR_GESTAO_DATA_ORDEM_PLANILHAS_V10
// JR_GESTAO_CORRECAO_DATA_RELATORIO_DIA_ATUAL_V12
// JR_GESTAO_CORRECAO_DATA_PLANILHA_CODIGOS_V13
// Datas de serviço sem deslocamento UTC e planilhas em ordem antiga -> nova.
const CODES_TEMPLATE = new URL('../assets/templates/PLANILHA EM CODIGOS.xlsx', import.meta.url).href
const NAMES_TEMPLATE = new URL('../assets/templates/PLANILHA EM NOMES.xlsx', import.meta.url).href
const SURVEY_SERVICE_CODE = '162'

export async function downloadCodesWorkbook(records, context) {
  ensureRecords(records)
  const workbook = await loadTemplate(CODES_TEMPLATE)
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('A planilha modelo em códigos não possui uma aba válida.')

  extendCodesTemplate(sheet)
  const codeHeaders = ['data','tipo_servico','logradouro','numero','bairro','ordem_servico','horario', ...Array.from({ length: 10 }, (_, index) => `produto${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `qtd${index + 1}`), 'observacao']
  codeHeaders.forEach((value, index) => { sheet.getRow(1).getCell(index + 1).value = value })
  clearRows(sheet, 2, Math.max(sheet.rowCount, 2), 28)
  const rows = buildCodesRows(records, context)
  const selectedDay = singleDayContextDate(context)
  const selectedDayLabel = selectedDay ? formatDate(selectedDay) : ''
  ensureStyledRows(sheet, 2, rows.length, 28)

  rows.forEach((values, index) => {
    const row = sheet.getRow(index + 2)

    values.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1)

      if (colIndex === 0 && selectedDayLabel) {
        // A coluna DATA da planilha em códigos é texto propositalmente.
        // Assim o Excel não converte 29/07 para 28/07 por fuso horário.
        cell.numFmt = '@'
        cell.value = selectedDayLabel
        return
      }

      cell.value = value
    })

    row.commit?.()
  })

  const name = `PLANILHA COD ${safeFilePart(context.team)} ${contextFilePeriod(context)}.xlsx`
  await downloadWorkbook(workbook, name)
}

export async function downloadNamesWorkbook(records, context) {
  ensureRecords(records)
  const workbook = await loadTemplate(NAMES_TEMPLATE)
  const pointsSheet = workbook.worksheets[0]
  const surveySheet = workbook.worksheets[1]
  if (!pointsSheet || !surveySheet) throw new Error('A planilha modelo em nomes está incompleta.')

  const pointRows = sortByTimestampOldestFirst(
    records.filter((row) => serviceCode(row) !== SURVEY_SERVICE_CODE),
    pointRecordDate,
  ).map((row, index) => buildNamesPointRow(row, index + 1))

  const surveyRows = sortByTimestampOldestFirst(
    records.filter((row) => hasSurvey(row) || serviceCode(row) === SURVEY_SERVICE_CODE),
    surveyRecordDate,
  ).map((row, index) => buildNamesSurveyRow(row, index + 1))

  prepareNamesHeader(pointsSheet, context)
  prepareNamesHeader(surveySheet, context)
  prepareNamesColumnHeaders(pointsSheet)
  prepareSurveyColumnHeaders(surveySheet)
  fillNamesTemplateRows(pointsSheet, pointRows, 3, 28)
  fillNamesTemplateRows(surveySheet, surveyRows, 3, 8)
  ensureNameStreetMerges(pointsSheet, 3, pointRows.length)
  ensureNameStreetMerges(surveySheet, 3, surveyRows.length)

  const name = `PLANILHA NORMAL ${safeFilePart(context.team)} ${contextFilePeriod(context)}.xlsx`
  await downloadWorkbook(workbook, name)
}

export async function downloadConferenceWorkbook(summary, context) {
  const ExcelJS = await ensureExcelJsV6()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'JR Gestão'
  workbook.created = new Date()

  const overview = workbook.addWorksheet('CONFERÊNCIA', { views: [{ state: 'frozen', ySplit: 1 }] })
  overview.columns = [
    { header: 'ITEM', key: 'item', width: 34 },
    { header: 'QUANTIDADE', key: 'value', width: 18 },
    { header: 'SITUAÇÃO', key: 'status', width: 25 },
  ]
  overview.addRows([
    { item: 'Período', value: contextPeriodLabel(context), status: '' },
    { item: 'Equipe', value: context.team, status: '' },
    { item: 'Pontuação válida total', value: summary.score?.total ?? summary.active.length, status: 'PONTOS + LEVANTAMENTOS' },
    { item: 'Pontos manhã/tarde', value: summary.score?.dayPoints ?? summary.active.length, status: 'CONTABILIZADOS' },
    { item: 'Levantamentos manhã/tarde', value: summary.score?.daySurveys ?? 0, status: 'CONTABILIZADOS' },
    { item: 'Pontos noite', value: summary.score?.nightPoints ?? 0, status: 'CONTABILIZADOS' },
    { item: 'Levantamentos noite', value: summary.score?.nightSurveys ?? 0, status: 'CONTABILIZADOS' },
    { item: 'Registros válidos', value: summary.active.length, status: 'ENTRAM NAS PLANILHAS' },
    { item: 'Pontos excluídos', value: summary.deleted.length, status: 'SOMENTE AUDITORIA' },
    { item: 'Fotos recebidas', value: `${summary.receivedPhotos}/${summary.expectedPhotos}`, status: summary.receivedPhotos === summary.expectedPhotos ? 'COMPLETO' : 'INCOMPLETO' },
    { item: 'Pendências críticas', value: summary.criticalCount, status: summary.criticalCount === 0 ? 'COMPLETO' : 'EXIGE ATENÇÃO' },
    { item: 'Último manifesto', value: summary.latestManifest ? formatDateTime(summary.latestManifest) : 'Não recebido', status: '' },
  ])
  styleWorksheet(overview)

  const valid = workbook.addWorksheet('PONTOS VÁLIDOS', { views: [{ state: 'frozen', ySplit: 1 }] })
  valid.columns = [
    { header: 'ORDEM', key: 'order', width: 18 },
    { header: 'RUA', key: 'street', width: 34 },
    { header: 'NÚMERO', key: 'number', width: 12 },
    { header: 'EQUIPE', key: 'team', width: 24 },
    { header: 'DATA/HORÁRIO', key: 'date', width: 23 },
    { header: 'ID', key: 'id', width: 40 },
  ]
  summary.active.forEach((row) => {
    const record = row.registro || {}
    valid.addRow({
      order: record.orderNumber || '',
      street: streetDisplayName(record),
      number: safeNumber(record.number),
      team: context.profileMap.get(row.user_id)?.team_name || record.teamName || '',
      date: formatDateTime(record.timePhotoTakenAt || row.data),
      id: row.id,
    })
  })
  styleWorksheet(valid)

  const deleted = workbook.addWorksheet('EXCLUÍDOS', { views: [{ state: 'frozen', ySplit: 1 }] })
  deleted.columns = [
    { header: 'ORDEM', key: 'order', width: 18 },
    { header: 'RUA', key: 'street', width: 34 },
    { header: 'EQUIPE', key: 'team', width: 24 },
    { header: 'EXCLUÍDO EM', key: 'deletedAt', width: 23 },
    { header: 'ID', key: 'id', width: 40 },
  ]
  summary.deleted.forEach((row) => {
    const record = row.registro || {}
    deleted.addRow({
      order: record.orderNumber || '',
      street: streetDisplayName(record),
      team: context.profileMap.get(row.user_id)?.team_name || record.teamName || '',
      deletedAt: formatDateTime(row.deleted_at),
      id: row.id,
    })
  })
  styleWorksheet(deleted, 'FF4343')

  const issues = workbook.addWorksheet('PENDÊNCIAS', { views: [{ state: 'frozen', ySplit: 1 }] })
  issues.columns = [
    { header: 'TIPO', key: 'type', width: 24 },
    { header: 'PROBLEMA', key: 'title', width: 48 },
    { header: 'DETALHE', key: 'detail', width: 48 },
    { header: 'PRIORIDADE', key: 'severity', width: 16 },
  ]
  summary.issues.forEach((item) => issues.addRow({ ...item, severity: item.severity === 'danger' ? 'CRÍTICA' : 'ATENÇÃO' }))
  styleWorksheet(issues, 'FFA928')

  const name = `CONFERENCIA ${safeFilePart(context.team)} ${contextFilePeriod(context)}.xlsx`
  await downloadWorkbook(workbook, name)
}



function extendCodesTemplate(sheet) {
  const originalObservationColumn = 18
  for (let rowIndex = 1; rowIndex <= Math.max(sheet.rowCount, 2); rowIndex += 1) {
    const row = sheet.getRow(rowIndex)
    copyCellStyle(row.getCell(originalObservationColumn), row.getCell(28))
    for (let column = 8; column <= 17; column += 1) copyCellStyle(row.getCell(8), row.getCell(column))
    for (let column = 18; column <= 27; column += 1) copyCellStyle(row.getCell(13), row.getCell(column))
  }
  for (let column = 8; column <= 17; column += 1) sheet.getColumn(column).width = sheet.getColumn(8).width
  for (let column = 18; column <= 27; column += 1) sheet.getColumn(column).width = sheet.getColumn(13).width
  sheet.getColumn(28).width = sheet.getColumn(originalObservationColumn).width
}

function extendNamesPointsTemplate(sheet) {
  const originalObservationColumn = 18
  for (let rowIndex = 1; rowIndex <= sheet.rowCount; rowIndex += 1) {
    const row = sheet.getRow(rowIndex)
    copyCellStyle(row.getCell(originalObservationColumn), row.getCell(28))
    for (let column = 18; column <= 27; column += 1) {
      const sourceColumn = column % 2 === 0 ? 16 : 17
      copyCellStyle(row.getCell(sourceColumn), row.getCell(column))
    }
  }
  for (let column = 18; column <= 27; column += 1) {
    const sourceColumn = column % 2 === 0 ? 16 : 17
    sheet.getColumn(column).width = sheet.getColumn(sourceColumn).width
  }
  sheet.getColumn(28).width = sheet.getColumn(originalObservationColumn).width
}

function copyCellStyle(source, target) {
  target.style = clone(source.style)
  target.numFmt = source.numFmt
  target.alignment = clone(source.alignment)
  target.border = clone(source.border)
  target.fill = clone(source.fill)
  target.font = clone(source.font)
  target.protection = clone(source.protection)
}

function prepareNamesColumnHeaders(sheet) {
  extendNamesPointsTemplate(sheet)
  const headers = ['', 'RUA', '', 'Nº', 'HORAS', 'ORDEM DE SERVIÇO', 'BAIRRO']
  for (let index = 1; index <= 10; index += 1) headers.push(`PRODUTO ${index}`, 'QTD.')
  headers.push('OBSERVAÇÕES')
  headers.forEach((value, index) => { sheet.getRow(2).getCell(index + 1).value = value })
}

function prepareSurveyColumnHeaders(sheet) {
  const headers = ['', 'RUA', '', 'Nº', 'HORAS', 'ORDEM DE SERVIÇO', 'BAIRRO', 'OBSERVAÇÕES']
  headers.forEach((value, index) => { sheet.getRow(2).getCell(index + 1).value = value })
}

function prepareNamesHeader(sheet, context) {
  const dateLabel = contextPeriodLabel(context)
  sheet.getCell('C1').value = `PLACA: ${context.vehiclePlate || '-'}`
  sheet.getCell('F1').value = `EQUIPE: ${context.team || '-'}`
  sheet.getCell('H1').value = `CIDADE CAMPO GRANDE ${dateLabel}`
}

function ensureNameStreetMerges(sheet, firstRow, rowCount) {
  for (let index = 0; index < rowCount; index += 1) {
    const rowNumber = firstRow + index
    const range = `B${rowNumber}:C${rowNumber}`
    try {
      if (!sheet.getCell(`B${rowNumber}`).isMerged) sheet.mergeCells(range)
    } catch (_error) {
      // O modelo já possui a mesclagem; mantém o layout original.
    }
  }
}

function fillNamesTemplateRows(sheet, rows, firstRow, columnCount) {
  const existingCount = Math.max(sheet.rowCount - firstRow + 1, 1)
  clearRows(sheet, firstRow, Math.max(sheet.rowCount, firstRow), columnCount)
  ensureStyledRows(sheet, firstRow, rows.length, columnCount, existingCount)
  rows.forEach((values, index) => {
    const row = sheet.getRow(firstRow + index)
    values.forEach((value, colIndex) => {
      // A coluna C faz parte da mesclagem B:C da rua. Escrever vazio em C
      // apagava o conteúdo colocado em B nos modelos do ExcelJS.
      if (colIndex === 2) return
      row.getCell(colIndex + 1).value = value
    })
    row.commit?.()
  })
}



function codeTimeFallbackV28(row, kind = 'point') {
  const record = row.registro || row
  const directSurvey =
    serviceCode(row) ===
    SURVEY_SERVICE_CODE

  const survey =
    kind === 'survey'

  const fileName = survey
    ? (
        text(record.surveyPhotoFileName) ||
        (
          directSurvey
            ? text(record.timePhotoFileName)
            : ''
        )
      )
    : text(record.timePhotoFileName)

  const fallbackPath = survey
    ? (
        text(record.surveyPhotoPath) ||
        (
          directSurvey
            ? text(record.timePhotoPath)
            : ''
        )
      )
    : text(record.timePhotoPath)

  const fromFile =
    fileNameWithoutExtension(
      fileName,
      fallbackPath,
    )

  if (fromFile) return fromFile

  const takenAt = survey
    ? (
        record.surveyPhotoTakenAt ||
        (
          directSurvey
            ? record.timePhotoTakenAt
            : ''
        )
      )
    : record.timePhotoTakenAt

  const timestamp =
    safeDateTimestamp(takenAt)

  if (timestamp) {
    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            'America/Campo_Grande',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        },
      ).formatToParts(
        new Date(timestamp),
      )

    const values =
      Object.fromEntries(
        parts.map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
      )

    return (
      String(
        values.hour || '00',
      ) +
      String(
        values.minute || '00',
      ) +
      String(
        values.second || '00',
      )
    )
  }

  const clock =
    normalizeClock(
      record.stampedTimeText,
    )

  return clock
    ? clock.replaceAll(':','')
    : ''
}

function surveyObservationV28(row) {
  const record = row.registro || row

  return (
    text(record.surveyObservation) ||
    (
      serviceCode(row) ===
        SURVEY_SERVICE_CODE
        ? text(record.observation)
        : ''
    )
  )
}

function buildCodesRows(records, context = {}) {
  const entries = []
  let sequence = 0

  for (const row of records) {
    const record = row.registro || row
    const directSurvey =
      serviceCode(row) ===
      SURVEY_SERVICE_CODE

    /*
      Se o próprio registro é 162,
      ele já é o levantamento.
      Portanto NÃO cria uma linha de ponto antes.
    */
    if (!directSurvey) {
      const products =
        normalizeProducts(
          record.products,
        )

      entries.push({
        timestamp:
          pointRecordDate(row),
        sequence:
          sequence++,
        values: [
          formatServiceDate(
            row,
            context,
          ),
          codeOrFallback(
            record.serviceType,
          ),
          codeOrFallback(
            record.street,
          ),
          safeNumber(
            record.number,
          ),
          codeOrFallback(
            record.neighborhood,
          ),
          text(
            record.orderNumber,
          ),
          codeTimeFallbackV28(
            row,
            'point',
          ),
          ...products.map(
            (item) => item.code,
          ),
          ...products.map(
            (item) => item.quantity,
          ),
          text(
            record.observation,
          ),
        ],
      })
    }

    if (hasSurvey(row)) {
      entries.push({
        timestamp:
          surveyRecordDate(row),
        sequence:
          sequence++,
        values: [
          formatServiceDate(
            row,
            context,
          ),
          SURVEY_SERVICE_CODE,
          codeOrFallback(
            record.street,
          ),
          safeNumber(
            record.number,
          ),
          codeOrFallback(
            record.neighborhood,
          ),
          text(
            record.orderNumber,
          ),
          codeTimeFallbackV28(
            row,
            'survey',
          ),
          ...Array(10).fill(''),
          ...Array(10).fill(''),
          surveyObservationV28(
            row,
          ),
        ],
      })
    }
  }

  return entries
    .sort(
      (a,b) =>
        a.timestamp-b.timestamp ||
        a.sequence-b.sequence,
    )
    .map(
      (entry) => entry.values,
    )
}

function buildNamesPointRow(row, index) {
  const record = row.registro || row
  const products = normalizeProducts(record.products)
  const values = [
    index ?? '',
    streetDisplayName(record),
    '',
    safeNumber(record.number),
    fileNameWithoutExtension(record.timePhotoFileName, record.timePhotoPath),
    text(record.orderNumber),
    neighborhoodDisplayName(record),
  ]
  products.forEach((item) => values.push(item.name, item.quantity))
  values.push(text(record.observation))
  return values
}






function buildNamesSurveyRow(row, index) {
  const record = row.registro || row

  return [
    index ?? '',
    streetDisplayName(record),
    '',
    safeNumber(record.number),
    codeTimeFallbackV28(
      row,
      'survey',
    ),
    text(record.orderNumber),
    neighborhoodDisplayName(record),
    surveyObservationV28(row),
  ]
}

function normalizeProducts(raw) {
  const items = Array.isArray(raw) ? raw.slice(0, 10) : []
  const result = items.map((entry) => ({
    code: displayName(entry?.product?.code),
    name: displayName(entry?.product?.name),
    quantity: text(entry?.quantity),
  }))
  while (result.length < 10) result.push({ code: '', name: '', quantity: '' })
  return result
}

function hasSurvey(row) {
  const record = row.registro || row
  return Boolean(
    text(record.surveyPhotoPath) ||
    text(record.surveyPhotoFileName) ||
    text(record.surveyPhotoStoragePath) ||
    serviceCode(row) === SURVEY_SERVICE_CODE
  )
}

function serviceCode(row) {
  const record = row.registro || row
  return text(record.serviceType?.code)
}

function sortOldestFirst(records) {
  return sortByTimestampOldestFirst(records, recordDate)
}

function sortNewestFirst(records) {
  return [...records].sort((a, b) => recordDate(b) - recordDate(a) || text(b.id).localeCompare(text(a.id)))
}

function sortByTimestampOldestFirst(records, timestampResolver) {
  return [...records].sort((a, b) => {
    const difference = timestampResolver(a) - timestampResolver(b)
    return difference || text(a.id).localeCompare(text(b.id))
  })
}

function pointRecordDate(row) {
  const record = row.registro || row

  for (const value of [
    record.timePhotoTakenAt,
    dateTimeFromFileName(row, record.timePhotoFileName, record.timePhotoPath),
    record.stampedTimeText ? `${serviceDateKey(row)}T${normalizeClock(record.stampedTimeText)}` : '',
  ]) {
    const timestamp = safeDateTimestamp(value)
    if (timestamp) return timestamp
  }

  return recordDate(row)
}

function surveyRecordDate(row) {
  const record = row.registro || row

  for (const value of [
    record.surveyPhotoTakenAt,
    dateTimeFromFileName(row, record.surveyPhotoFileName, record.surveyPhotoPath),
  ]) {
    const timestamp = safeDateTimestamp(value)
    if (timestamp) return timestamp
  }

  return pointRecordDate(row)
}

function recordDate(row) {
  const record = row.registro || row

  for (const value of [
    record.timePhotoTakenAt,
    record.surveyPhotoTakenAt,
    record.photoSyncUpdatedAt,
  ]) {
    const timestamp = safeDateTimestamp(value)
    if (timestamp) return timestamp
  }

  const day = serviceDateKey(row)
  const clock = normalizeClock(record.stampedTimeText)
  if (day && clock) {
    const timestamp = safeDateTimestamp(`${day}T${clock}`)
    if (timestamp) return timestamp
  }

  return (
    safeDateTimestamp(record.date) ||
    safeDateTimestamp(row.data) ||
    safeDateTimestamp(row.updated_at)
  )
}

function normalizeClock(value) {
  const raw = String(value || '')
    .trim()
    .replaceAll('.', ':')
    .replaceAll('H', ':')
    .replaceAll('h', ':')
  const match = raw.match(/(\d{1,2}):?(\d{2})(?::?(\d{2}))?/)
  if (!match) return ''

  const hour = String(Math.min(23, Number(match[1]))).padStart(2, '0')
  const minute = String(Math.min(59, Number(match[2]))).padStart(2, '0')
  const second = String(Math.min(59, Number(match[3] || 0))).padStart(2, '0')
  return `${hour}:${minute}:${second}`
}

function dateTimeFromFileName(row, fileName, fallbackPath) {
  let value = text(fileName)
  if (!value && text(fallbackPath)) {
    value = text(fallbackPath).replaceAll('\\', '/').split('/').pop()
  }

  const day = serviceDateKey(row)
  if (!day || !value) return ''

  // Aceita 0600, 06-00, 06_00, 060000 e nomes TimePhoto_YYYYMMDD_HHMMSS.
  const timePhoto = value.match(/(?:^|[_\-\s])(\d{8})[_\-\s](\d{2})(\d{2})(\d{2})(?:\D|$)/)
  if (timePhoto) {
    const fileDay = `${timePhoto[1].slice(0, 4)}-${timePhoto[1].slice(4, 6)}-${timePhoto[1].slice(6, 8)}`
    return `${fileDay}T${timePhoto[2]}:${timePhoto[3]}:${timePhoto[4]}`
  }

  const compact = value.match(/(?:^|\D)([01]\d|2[0-3])([0-5]\d)([0-5]\d)?(?:\D|$)/)
  if (compact) {
    return `${day}T${compact[1]}:${compact[2]}:${compact[3] || '00'}`
  }

  const separated = value.match(/(?:^|\D)([01]?\d|2[0-3])[:._-]([0-5]\d)(?:[:._-]([0-5]\d))?(?:\D|$)/)
  if (separated) {
    return `${day}T${String(separated[1]).padStart(2, '0')}:${separated[2]}:${separated[3] || '00'}`
  }

  return ''
}

function serviceDateKey(row) {
  const record=row.registro||row
  for(const value of [record.timePhotoFileName,record.timePhotoPath,record.surveyPhotoFileName,record.surveyPhotoPath]){
    const match=text(value).match(/(?:^|\D)(\d{4})(\d{2})(\d{2})[_\-\s](?:[01]\d|2[0-3])(?:[0-5]\d)/)
    if(match)return [match[1],match[2],match[3]].join('-')
  }
  for(const value of [record.timePhotoTakenAt,record.surveyPhotoTakenAt,row.data]){
    const timestamp=safeDateTimestamp(value); if(!timestamp)continue
    return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Campo_Grande',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp))
  }
  for(const value of [record.date,record.serviceDate,record.workDate,record.work_date]){
    const match=text(value).match(/^(\d{4})-(\d{2})-(\d{2})/); if(match)return [match[1],match[2],match[3]].join('-')
  }
  return ''
}

function formatServiceDate(row, context = {}) {
  const selectedDay = singleDayContextDate(context)
  if (selectedDay) return formatDate(selectedDay)

  const day = serviceDateKey(row)
  return day ? formatDate(day) : ''
}

function singleDayContextDate(context) {
  const start = String(context?.startDate || context?.date || '').slice(0, 10)
  const end = String(context?.endDate || start).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return ''
  return start === end ? start : ''
}

function safeDateTimestamp(value) {
  if (!value) return 0
  const raw = String(value).trim()
  const naive = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (naive && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    // Campo Grande/MS atualmente usa UTC-4. Timestamp sem fuso é relógio local.
    const utc = Date.UTC(
      Number(naive[1]),
      Number(naive[2]) - 1,
      Number(naive[3]),
      Number(naive[4]) + 4,
      Number(naive[5]),
      Number(naive[6] || 0),
    )
    return Number.isNaN(utc) ? 0 : utc
  }

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) {
    return Date.UTC(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
      12,
    )
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

async function loadTemplate(url) {
  const ExcelJS = await ensureExcelJsV6()
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Não foi possível abrir o modelo ${url}.`)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await response.arrayBuffer())
  return workbook
}

function ensureStyledRows(sheet, sourceRow, count, columnCount, existingCount = 1) {
  if (count <= existingCount) return
  const source = sheet.getRow(sourceRow)
  for (let index = existingCount; index < count; index += 1) {
    const target = sheet.getRow(sourceRow + index)
    target.height = source.height
    for (let column = 1; column <= columnCount; column += 1) {
      const sourceCell = source.getCell(column)
      const targetCell = target.getCell(column)
      targetCell.style = clone(sourceCell.style)
      targetCell.numFmt = sourceCell.numFmt
      targetCell.alignment = clone(sourceCell.alignment)
      targetCell.border = clone(sourceCell.border)
      targetCell.fill = clone(sourceCell.fill)
      targetCell.font = clone(sourceCell.font)
      targetCell.protection = clone(sourceCell.protection)
    }
  }
}

function clearRows(sheet, first, last, columnCount) {
  for (let rowIndex = first; rowIndex <= last; rowIndex += 1) {
    const row = sheet.getRow(rowIndex)
    for (let column = 1; column <= columnCount; column += 1) row.getCell(column).value = null
  }
}

function styleWorksheet(sheet, accent = '2693FF') {
  const header = sheet.getRow(1)
  header.height = 26
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${accent}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell((cell) => {
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD8DEE8' } } }
      cell.alignment = { vertical: 'middle', wrapText: true }
    })
  })
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer()
  await downloadBlob(
    new Blob(
      [buffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ),
    fileName
  )
}

export async function downloadBlob(blob, fileName) {
  const safeName = String(fileName || 'arquivo.xlsx').trim() || 'arquivo.xlsx'
  const file = typeof File === 'function'
    ? new File([blob], safeName, { type: blob.type || 'application/octet-stream' })
    : blob

  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (
    isAppleMobile &&
    file instanceof File &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: safeName })
      return
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeName
  link.rel = 'noopener'
  link.style.position = 'fixed'
  link.style.left = '-9999px'
  link.style.top = '0'
  document.body.appendChild(link)

  link.click()
  await new Promise((resolve) => window.setTimeout(resolve, 350))
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
}

const EXCELJS_LOCAL_URL = new URL('./vendor/exceljs-4.4.0.min.js', import.meta.url).href
let excelJsPromiseV6

async function ensureExcelJsV6() {
  if (window.ExcelJS) return window.ExcelJS
  if (excelJsPromiseV6) return excelJsPromiseV6

  excelJsPromiseV6 = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-jr-exceljs-local-v6]')
    const finish = () => window.ExcelJS
      ? resolve(window.ExcelJS)
      : reject(new Error('A biblioteca local de Excel não iniciou.'))

    if (existing) {
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener('error', () => reject(new Error('Falha ao abrir a biblioteca local de Excel.')), { once: true })
      window.setTimeout(finish, 0)
      return
    }

    const script = document.createElement('script')
    script.src = EXCELJS_LOCAL_URL
    script.async = true
    script.dataset.jrExceljsLocalV6 = '1'
    script.onload = finish
    script.onerror = () => reject(new Error('Falha ao abrir a biblioteca local de Excel.'))
    document.head.appendChild(script)
  })

  try {
    return await excelJsPromiseV6
  } catch (error) {
    excelJsPromiseV6 = null
    throw error
  }
}

function ensureRecords(records) {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Nenhum ponto válido encontrado para gerar a planilha.')
}

function clone(value) {
  if (!value) return value
  try { return structuredClone(value) } catch (_) { return JSON.parse(JSON.stringify(value)) }
}

function codeOrFallback(item) {
  return text(item?.code) || displayName(item?.name)
}

function displayName(value) {
  const raw = text(value)
  const match = raw.match(/^\d+\s*-\s*(.+)$/)
  return match ? match[1].trim() : raw
}

function lookupDisplayName(value, fallbacks = []) {
  const candidates = []
  if (value && typeof value === 'object') {
    candidates.push(value.name, value.nome, value.description, value.descricao, value.label, value.text)
  } else {
    candidates.push(value)
  }
  candidates.push(...fallbacks)
  for (const candidate of candidates) {
    const resolved = displayName(candidate)
    if (resolved) return resolved
  }
  return ''
}

function streetDisplayName(record) {
  return lookupDisplayName(record?.street, [record?.streetName, record?.streetText, record?.logradouroNome, record?.logradouro, record?.manualStreet])
}

function neighborhoodDisplayName(record) {
  return lookupDisplayName(record?.neighborhood, [record?.neighborhoodName, record?.bairroNome, record?.bairro])
}

function safeNumber(value) { return text(value) || '0' }
function text(value) { return String(value ?? '').trim() }

function fileNameWithoutExtension(fileName, fallbackPath) {
  let value = text(fileName)
  if (!value && text(fallbackPath)) value = text(fallbackPath).replaceAll('\\', '/').split('/').pop()
  return value.replace(/\.[^.]+$/, '')
}

function formatDate(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`

  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Campo_Grande' }).format(date)
  }

  const parts = raw.slice(0, 10).split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : raw
}

function formatDateTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Campo_Grande', dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function contextPeriodLabel(context) {
  if (context?.periodLabel) return String(context.periodLabel)
  const start = context?.startDate || context?.date
  const end = context?.endDate || start
  return start === end ? formatDate(start) : `${formatDate(start)} até ${formatDate(end)}`
}

function contextFilePeriod(context) {
  const start = context?.startDate || context?.date
  const end = context?.endDate || start
  return start === end ? fileDate(start) : `${fileDate(start)}_A_${fileDate(end)}`
}

function fileDate(value) {
  const parts = String(value || '').slice(0, 10).split('-')
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : 'SEM-DATA'
}

function safeFilePart(value) {
  const safe = text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
  return safe || 'SEM EQUIPE'
}
