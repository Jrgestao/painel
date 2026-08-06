const CODES_TEMPLATE = './assets/templates/PLANILHA EM CODIGOS.xlsx'
const NAMES_TEMPLATE = './assets/templates/PLANILHA EM NOMES.xlsx'
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
  const rows = buildCodesRows(records)
  ensureStyledRows(sheet, 2, rows.length, 28)
  rows.forEach((values, index) => {
    const row = sheet.getRow(index + 2)
    values.forEach((value, colIndex) => { row.getCell(colIndex + 1).value = value })
    row.commit?.()
  })

  const name = `PLANILHA COD ${safeFilePart(context.team)} ${fileDate(context.date)}.xlsx`
  await downloadWorkbook(workbook, name)
}

export async function downloadNamesWorkbook(records, context) {
  ensureRecords(records)
  const workbook = await loadTemplate(NAMES_TEMPLATE)
  const pointsSheet = workbook.worksheets[0]
  const surveySheet = workbook.worksheets[1]
  if (!pointsSheet || !surveySheet) throw new Error('A planilha modelo em nomes está incompleta.')

  const sorted = sortOldestFirst(records)
  const pointRows = sorted
    .filter((row) => serviceCode(row) !== SURVEY_SERVICE_CODE)
    .map((row, index) => buildNamesPointRow(row, index + 1))
  const surveyRows = sorted
    .filter((row) => hasSurvey(row) || serviceCode(row) === SURVEY_SERVICE_CODE)
    .map((row, index) => buildNamesSurveyRow(row, index + 1))

  prepareNamesHeader(pointsSheet, context)
  prepareNamesHeader(surveySheet, context)
  prepareNamesColumnHeaders(pointsSheet)
  prepareSurveyColumnHeaders(surveySheet)
  fillNamesTemplateRows(pointsSheet, pointRows, 3, 28)
  fillNamesTemplateRows(surveySheet, surveyRows, 3, 8)
  ensureNameStreetMerges(pointsSheet, 3, pointRows.length)
  ensureNameStreetMerges(surveySheet, 3, surveyRows.length)

  const name = `PLANILHA NORMAL ${safeFilePart(context.team)} ${fileDate(context.date)}.xlsx`
  await downloadWorkbook(workbook, name)
}


export async function downloadMonthlyServicesWorkbook(data, context = {}) {
  const ExcelJS = requireExcelJs()
  if (!data?.base?.length) throw new Error('Nenhum serviço encontrado para gerar o relatório mensal.')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'JR Gestão'
  workbook.created = new Date()
  const monthLabel = formatMonthLabel(context.month)

  const colors = {
    dark: 'FF1F2937', header: 'FFA6A6A6', light: 'FFF2F2F2', gray: 'FFBFBFBF',
    blue: 'FF2226C8', white: 'FFFFFFFF', black: 'FF000000', border: 'FF000000',
  }

  const summary = workbook.addWorksheet('RESUMO MENSAL', { views: [{ state: 'frozen', ySplit: 3, xSplit: 1 }] })
  summary.properties.defaultRowHeight = 21
  summary.mergeCells(1, 1, 1, Math.max(5, data.teams.length + 3))
  summary.getCell(1, 1).value = `RELATÓRIO MENSAL DE SERVIÇOS - ${monthLabel}`
  paintCell(summary.getCell(1, 1), colors.dark, colors.white, true, 'center')

  const dayMap = new Map(data.dayRows.map((item) => [`${item.date}|${item.team}`, item]))
  const sections = [
    ['PONTOS MANHÃ/TARDE', 'dayPoints'],
    ['LEVANTAMENTOS MANHÃ/TARDE', 'daySurveys'],
    ['PONTOS NOITE', 'nightPoints'],
    ['LEVANTAMENTOS NOITE', 'nightSurveys'],
  ]
  let startRow = 3
  sections.forEach(([title, key]) => {
    startRow = writeMonthlySection(summary, startRow, title, key, data, dayMap, colors)
  })
  summary.getColumn(1).width = 13
  data.teams.forEach((_team, index) => { summary.getColumn(index + 2).width = 18 })
  summary.getColumn(data.teams.length + 2).width = 12
  summary.getColumn(data.teams.length + 3).width = 60

  const services = workbook.addWorksheet('SERVIÇOS EXECUTADOS', { views: [{ state: 'frozen', ySplit: 2 }] })
  const serviceHeaders = ['EQUIPE', 'SERVIÇO EXECUTADO', 'MANHÃ/TARDE', 'NOITE', 'TOTAL']
  services.mergeCells(1, 1, 1, serviceHeaders.length)
  services.getCell(1, 1).value = `SERVIÇOS EXECUTADOS POR EQUIPE - ${monthLabel}`
  paintCell(services.getCell(1, 1), colors.dark, colors.white, true, 'center')
  serviceHeaders.forEach((header, index) => {
    services.getCell(2, index + 1).value = header
    paintCell(services.getCell(2, index + 1), colors.header, colors.black, true, 'center')
  })
  data.serviceRows.forEach((item, rowIndex) => {
    const values = [item.team, item.service, item.day, item.night, item.total]
    values.forEach((value, colIndex) => {
      const cell = services.getCell(rowIndex + 3, colIndex + 1)
      cell.value = value
      paintCell(cell, colors.light, colors.black, colIndex === 4, colIndex < 2 ? 'left' : 'center')
    })
  })
  ;[24, 48, 16, 12, 12].forEach((width, index) => { services.getColumn(index + 1).width = width })
  services.autoFilter = { from: 'A2', to: 'E2' }

  const detail = workbook.addWorksheet('DIA POR EQUIPE', { views: [{ state: 'frozen', ySplit: 2 }] })
  const detailHeaders = ['DATA', 'EQUIPE', 'MANHÃ N', 'MANHÃ L', 'MANHÃ T', 'NOTURNO N', 'NOTURNO L', 'NOTURNO T', 'NORMAL', 'LEV', 'TOTAL', 'SERVIÇOS IMPORTANTES', 'MATERIAIS']
  detail.mergeCells(1, 1, 1, detailHeaders.length)
  detail.getCell(1, 1).value = `PONTUAÇÃO DIA POR EQUIPE - ${monthLabel}`
  paintCell(detail.getCell(1, 1), colors.dark, colors.white, true, 'center')
  detailHeaders.forEach((header, index) => {
    detail.getCell(2, index + 1).value = header
    paintCell(detail.getCell(2, index + 1), colors.header, colors.black, true, 'center')
  })
  data.dayRows.forEach((item, rowIndex) => {
    const materialText = [
      item.materials?.rele ? `Relé: ${item.materials.rele}` : '',
      item.materials?.fio ? `Fio: ${item.materials.fio}` : '',
      item.materials?.led ? `Led: ${item.materials.led}` : '',
    ].filter(Boolean).join(', ')
    const morningTotal = item.dayPoints + item.daySurveys
    const nightTotal = item.nightPoints + item.nightSurveys
    const normalTotal = item.dayPoints + item.nightPoints
    const surveyTotal = item.daySurveys + item.nightSurveys
    const grandTotal = normalTotal + surveyTotal
    const values = [
      formatDate(item.date), item.team,
      item.dayPoints, item.daySurveys, morningTotal,
      item.nightPoints, item.nightSurveys, nightTotal,
      normalTotal, surveyTotal, grandTotal,
      [...item.important].join(' / '), materialText,
    ]
    values.forEach((value, colIndex) => {
      const cell = detail.getCell(rowIndex + 3, colIndex + 1)
      cell.value = value || ''
      const highlight = colIndex === 11 && value
      paintCell(cell, highlight ? colors.blue : colors.light, highlight ? colors.white : colors.black, colIndex === 10, colIndex >= 11 ? 'left' : 'center')
    })
  })
  ;[14, 24, 12, 12, 12, 13, 12, 13, 12, 12, 12, 52, 32].forEach((width, index) => { detail.getColumn(index + 1).width = width })
  detail.autoFilter = { from: 'A2', to: 'M2' }

  const base = workbook.addWorksheet('BASE', { views: [{ state: 'frozen', ySplit: 1 }] })
  const baseHeaders = ['DATA', 'EQUIPE', 'PERÍODO', 'TIPO', 'OBSERVAÇÃO', 'IMPORTANTES', 'OS', 'SERVIÇO', 'RUA', 'NÚMERO', 'BAIRRO', 'PRODUTOS']
  baseHeaders.forEach((header, index) => {
    base.getCell(1, index + 1).value = header
    paintCell(base.getCell(1, index + 1), colors.header, colors.black, true, 'center')
  })
  data.base.forEach((item, rowIndex) => {
    const values = [formatDate(item.date), item.team, item.period, item.type, item.observation, item.important, item.order, item.service, item.street, item.number, item.neighborhood, item.products]
    values.forEach((value, colIndex) => {
      const cell = base.getCell(rowIndex + 2, colIndex + 1)
      cell.value = value || ''
      paintCell(cell, colors.light, colors.black, false, [4, 5, 7, 8, 10, 11].includes(colIndex) ? 'left' : 'center')
    })
  })
  ;[14, 24, 16, 15, 58, 38, 16, 42, 36, 10, 28, 42].forEach((width, index) => { base.getColumn(index + 1).width = width })
  base.autoFilter = { from: 'A1', to: 'L1' }

  const fileName = `RELATORIO SERVICOS EXECUTADOS ${safeFilePart(monthLabel)}.xlsx`
  await downloadWorkbook(workbook, fileName)
}

function writeMonthlySection(sheet, startRow, title, key, data, dayMap, colors) {
  const firstTeamCol = 2
  const totalCol = firstTeamCol + data.teams.length
  const obsCol = totalCol + 1
  sheet.mergeCells(startRow, 1, startRow, obsCol)
  sheet.getCell(startRow, 1).value = title
  paintCell(sheet.getCell(startRow, 1), colors.dark, colors.white, true, 'center')
  const headerRow = startRow + 1
  const columns = ['DIA', ...data.teams, 'TOTAL DIA', 'OBSERVAÇÃO']
  columns.forEach((value, index) => {
    const cell = sheet.getCell(headerRow, index + 1)
    cell.value = value
    paintCell(cell, colors.header, colors.black, true, 'center')
  })
  data.dates.forEach((dateValue, rowIndex) => {
    const row = headerRow + rowIndex + 1
    sheet.getCell(row, 1).value = formatDate(dateValue)
    paintCell(sheet.getCell(row, 1), colors.light, colors.black, true, 'center')
    let total = 0
    const observations = []
    data.teams.forEach((team, teamIndex) => {
      const item = dayMap.get(`${dateValue}|${team}`)
      const value = item?.[key] || 0
      total += value
      const cell = sheet.getCell(row, firstTeamCol + teamIndex)
      cell.value = value || ''
      const hasImportant = item?.important?.size > 0
      paintCell(cell, hasImportant ? colors.blue : colors.gray, hasImportant ? colors.white : colors.black, true, 'center')
      if (item?.important?.size) observations.push(`(${team}) ${[...item.important].join(' / ')}`)
    })
    sheet.getCell(row, totalCol).value = total || ''
    paintCell(sheet.getCell(row, totalCol), colors.light, colors.black, true, 'center')
    sheet.getCell(row, obsCol).value = observations.join(' - ')
    paintCell(sheet.getCell(row, obsCol), colors.gray, colors.black, false, 'left')
  })
  const totalRow = headerRow + data.dates.length + 1
  sheet.getCell(totalRow, 1).value = 'TOTAL'
  for (let col = 1; col <= obsCol; col += 1) paintCell(sheet.getCell(totalRow, col), colors.light, colors.black, true, 'center')
  data.teams.forEach((_team, index) => {
    const col = firstTeamCol + index
    const letter = getExcelColumnName(col)
    sheet.getCell(totalRow, col).value = { formula: `SUM(${letter}${headerRow + 1}:${letter}${totalRow - 1})` }
  })
  const firstLetter = getExcelColumnName(firstTeamCol)
  const lastLetter = getExcelColumnName(totalCol - 1)
  sheet.getCell(totalRow, totalCol).value = { formula: `SUM(${firstLetter}${totalRow}:${lastLetter}${totalRow})` }
  return totalRow + 3
}

function paintCell(cell, fillColor, fontColor, bold = false, horizontal = 'center') {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
  cell.font = { color: { argb: fontColor }, bold }
  cell.alignment = { vertical: 'middle', horizontal, wrapText: true }
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  }
}

function getExcelColumnName(number) {
  let result = ''
  let value = number
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(65 + (value % 26)) + result
    value = Math.floor(value / 26)
  }
  return result
}

function formatMonthLabel(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return String(value || 'MÊS')
  const names = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
  return `${names[Number(match[2]) - 1] || match[2]} ${match[1]}`
}

export async function downloadConferenceWorkbook(summary, context) {
  const ExcelJS = requireExcelJs()
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
    { item: 'Data', value: formatDate(context.date), status: '' },
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

  const name = `CONFERENCIA ${safeFilePart(context.team)} ${fileDate(context.date)}.xlsx`
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
  const dateLabel = formatDate(context.date)
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

function buildCodesRows(records) {
  const rows = []
  for (const row of sortOldestFirst(records)) {
    const record = row.registro || row
    const products = normalizeProducts(record.products)
    const normal = [
      formatDate(record.date || row.data),
      codeOrFallback(record.serviceType),
      codeOrFallback(record.street),
      safeNumber(record.number),
      codeOrFallback(record.neighborhood),
      text(record.orderNumber),
      fileNameWithoutExtension(record.timePhotoFileName, record.timePhotoPath),
      ...products.map((item) => item.code),
      ...products.map((item) => item.quantity),
      text(record.observation),
    ]
    rows.push(normal)

    if (hasSurvey(row)) {
      rows.push([
        formatDate(record.date || row.data),
        SURVEY_SERVICE_CODE,
        codeOrFallback(record.street),
        safeNumber(record.number),
        codeOrFallback(record.neighborhood),
        text(record.orderNumber),
        fileNameWithoutExtension(record.surveyPhotoFileName, record.surveyPhotoPath),
        ...Array(10).fill(''),
        ...Array(10).fill(''),
        text(record.surveyObservation),
      ])
    }
  }
  return rows
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
  const directSurvey = serviceCode(row) === SURVEY_SERVICE_CODE
  const filename = directSurvey
    ? (text(record.surveyPhotoFileName) || text(record.timePhotoFileName))
    : text(record.surveyPhotoFileName)
  const fallbackPath = directSurvey
    ? (text(record.surveyPhotoPath) || text(record.timePhotoPath))
    : text(record.surveyPhotoPath)
  return [
    index ?? '',
    streetDisplayName(record),
    '',
    safeNumber(record.number),
    fileNameWithoutExtension(filename, fallbackPath),
    text(record.orderNumber),
    neighborhoodDisplayName(record),
    directSurvey ? text(record.observation) : text(record.surveyObservation),
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
  return [...records].sort((a, b) => recordDate(a) - recordDate(b) || text(a.id).localeCompare(text(b.id)))
}

function recordDate(row) {
  const record = row.registro || row
  const value = record.timePhotoTakenAt || record.surveyPhotoTakenAt || record.date || row.data
  const date = new Date(value || 0)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

async function loadTemplate(url) {
  const ExcelJS = requireExcelJs()
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
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName)
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function requireExcelJs() {
  if (!window.ExcelJS) throw new Error('A biblioteca de Excel não carregou. Verifique a internet e tente novamente.')
  return window.ExcelJS
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
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date)
  const parts = String(value).slice(0, 10).split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value)
}

function formatDateTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function fileDate(value) {
  const parts = String(value || '').slice(0, 10).split('-')
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : 'SEM-DATA'
}

function safeFilePart(value) {
  const safe = text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
  return safe || 'SEM EQUIPE'
}
