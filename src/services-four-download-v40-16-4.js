// JR_GESTAO_BAIXAR_4_PLANILHAS_ROBUSTO_V40_16_4=20260902
//
// Estrategia V40.16.4:
// 1) nao altera o downloadWorkbook() interno do services-board;
// 2) garante ExcelJS ANTES do clique chegar ao gerador original;
// 3) captura o XLSX original de 4 abas;
// 4) separa as 4 abas em 4 XLSX e entrega 1 ZIP.
// Assim o publicador nao depende de texto/espacamento interno do gerador.

const JR_V40164_IDLE_MS = 450
const JR_V40164_TIMEOUT_MS = 45000
const JR_V40164_EXCELJS_URL = new URL(
  './vendor/exceljs-4.4.0.min.js',
  import.meta.url,
).href

let jrV40164ExcelPromise = null
let jrV40164Session = null
let jrV40164ReplayClick = false

function jrV40164Text(value) {
  return String(value ?? '').trim()
}

function jrV40164Clone(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // fallback abaixo
    }
  }
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

function jrV40164SafeBase(value, fallback = 'PLANILHA') {
  const text = jrV40164Text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[^a-zA-Z0-9 _.-]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return text || fallback
}

function jrV40164Month() {
  const raw =
    document.getElementById('services-month-filter')?.value ||
    document.getElementById('month-filter')?.value ||
    ''

  const match = String(raw).match(/^(\d{4})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}` : new Date().toISOString().slice(0, 7)
}

function jrV40164Status(text, error = false) {
  const state = document.getElementById('services-save-state')
  if (state) {
    state.textContent = text
    state.dataset.jrV40164 = error ? 'error' : 'active'
  }

  if (error) {
    const banner = document.getElementById('services-error')
    if (banner) {
      banner.textContent = text
      banner.classList.remove('hidden')
    }
  }
}

function jrV40164ButtonLabel(button, text) {
  if (!button) return
  const label = button.querySelector('.button-label')
  if (label) label.textContent = text
  else button.textContent = text
}

async function jrV40164EnsureExcelJS() {
  if (window.ExcelJS) return window.ExcelJS
  if (jrV40164ExcelPromise) return jrV40164ExcelPromise

  jrV40164ExcelPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-services-exceljs-v20], script[data-jr-v40164-exceljs]',
    )

    const finish = () => {
      if (window.ExcelJS) {
        resolve(window.ExcelJS)
      } else {
        reject(new Error('A biblioteca de planilhas não iniciou.'))
      }
    }

    if (existing) {
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Não foi possível carregar a biblioteca de planilhas.')),
        { once: true },
      )
      window.setTimeout(finish, 0)
      return
    }

    const script = document.createElement('script')
    script.src = JR_V40164_EXCELJS_URL
    script.async = true
    script.dataset.jrV40164Exceljs = '1'
    script.onload = finish
    script.onerror = () =>
      reject(new Error('Não foi possível carregar a biblioteca de planilhas.'))
    document.head.appendChild(script)
  })

  try {
    return await jrV40164ExcelPromise
  } catch (error) {
    jrV40164ExcelPromise = null
    throw error
  }
}

function jrV40164Crc32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function jrV40164DosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear())
  return {
    dosTime:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    dosDate:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  }
}

function jrV40164U16(value) {
  const out = new Uint8Array(2)
  new DataView(out.buffer).setUint16(0, value, true)
  return out
}

function jrV40164U32(value) {
  const out = new Uint8Array(4)
  new DataView(out.buffer).setUint32(0, value >>> 0, true)
  return out
}

function jrV40164Concat(parts) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}

async function jrV40164Zip(entries) {
  const encoder = new TextEncoder()
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const data = new Uint8Array(await entry.blob.arrayBuffer())
    const crc = jrV40164Crc32(data)
    const { dosTime, dosDate } = jrV40164DosDateTime()

    const local = jrV40164Concat([
      jrV40164U32(0x04034b50),
      jrV40164U16(20),
      jrV40164U16(0x0800),
      jrV40164U16(0),
      jrV40164U16(dosTime),
      jrV40164U16(dosDate),
      jrV40164U32(crc),
      jrV40164U32(data.length),
      jrV40164U32(data.length),
      jrV40164U16(nameBytes.length),
      jrV40164U16(0),
      nameBytes,
      data,
    ])
    localParts.push(local)

    const central = jrV40164Concat([
      jrV40164U32(0x02014b50),
      jrV40164U16(20),
      jrV40164U16(20),
      jrV40164U16(0x0800),
      jrV40164U16(0),
      jrV40164U16(dosTime),
      jrV40164U16(dosDate),
      jrV40164U32(crc),
      jrV40164U32(data.length),
      jrV40164U32(data.length),
      jrV40164U16(nameBytes.length),
      jrV40164U16(0),
      jrV40164U16(0),
      jrV40164U16(0),
      jrV40164U16(0),
      jrV40164U32(0),
      jrV40164U32(offset),
      nameBytes,
    ])
    centralParts.push(central)
    offset += local.byteLength
  }

  const local = jrV40164Concat(localParts)
  const central = jrV40164Concat(centralParts)
  const end = jrV40164Concat([
    jrV40164U32(0x06054b50),
    jrV40164U16(0),
    jrV40164U16(0),
    jrV40164U16(entries.length),
    jrV40164U16(entries.length),
    jrV40164U32(central.byteLength),
    jrV40164U32(local.byteLength),
    jrV40164U16(0),
  ])

  return new Blob([local, central, end], { type: 'application/zip' })
}

function jrV40164DownloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function jrV40164CopyWorksheetFallback(source, target) {
  target.properties = jrV40164Clone(source.properties) || {}
  target.pageSetup = jrV40164Clone(source.pageSetup) || {}
  target.headerFooter = jrV40164Clone(source.headerFooter) || {}
  target.views = jrV40164Clone(source.views) || []
  target.state = source.state
  if (source.autoFilter) target.autoFilter = jrV40164Clone(source.autoFilter)

  source.columns.forEach((column, index) => {
    const out = target.getColumn(index + 1)
    if (column.width != null) out.width = column.width
    out.hidden = Boolean(column.hidden)
    out.outlineLevel = Number(column.outlineLevel || 0)
    if (column.style) out.style = jrV40164Clone(column.style)
  })

  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const outRow = target.getRow(rowNumber)
    if (row.height != null) outRow.height = row.height
    outRow.hidden = Boolean(row.hidden)
    outRow.outlineLevel = Number(row.outlineLevel || 0)

    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const outCell = outRow.getCell(columnNumber)
      outCell.value = jrV40164Clone(cell.value)
      if (cell.style) outCell.style = jrV40164Clone(cell.style)
      if (cell.note) outCell.note = jrV40164Clone(cell.note)
    })
  })

  const merges = source.model?.merges || []
  for (const merge of merges) {
    try {
      target.mergeCells(merge)
    } catch {
      // merge duplicado/invalido: ignora sem perder a planilha
    }
  }

  try {
    if (source.dataValidations?.model) {
      target.dataValidations.model = jrV40164Clone(source.dataValidations.model)
    }
  } catch {
    // opcional
  }
}

function jrV40164CopyWorksheet(source, target) {
  try {
    const model = jrV40164Clone(source.model)
    if (!model || !Array.isArray(model.rows)) throw new Error('modelo vazio')
    model.id = target.id
    model.name = source.name
    target.model = model
    return
  } catch (error) {
    console.warn('[JR V40.16.4] Copia por model falhou; usando fallback.', error)
  }

  jrV40164CopyWorksheetFallback(source, target)
}

async function jrV40164SplitWorkbook(blob) {
  const ExcelJS = await jrV40164EnsureExcelJS()
  const sourceBook = new ExcelJS.Workbook()
  await sourceBook.xlsx.load(await blob.arrayBuffer())

  if (!sourceBook.worksheets.length) {
    throw new Error('O XLSX gerado não possui abas.')
  }

  const month = jrV40164Month()
  const entries = []

  for (const sourceSheet of sourceBook.worksheets) {
    const book = new ExcelJS.Workbook()
    book.creator = sourceBook.creator || 'JR Gestão'
    book.lastModifiedBy = sourceBook.lastModifiedBy || 'JR Gestão'
    book.created = sourceBook.created || new Date()
    book.modified = new Date()
    book.company = sourceBook.company || ''
    book.manager = sourceBook.manager || ''
    book.subject = sourceBook.subject || ''
    book.title = sourceBook.title || sourceSheet.name
    book.description = sourceBook.description || ''
    book.keywords = sourceBook.keywords || ''
    book.category = sourceBook.category || ''

    const target = book.addWorksheet(sourceSheet.name)
    jrV40164CopyWorksheet(sourceSheet, target)

    const buffer = await book.xlsx.writeBuffer()
    const safe = jrV40164SafeBase(sourceSheet.name, `PLANILHA_${entries.length + 1}`)
    entries.push({
      name: `SERVICOS_EXECUTADOS_${safe}_${month}.xlsx`,
      blob: new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    })
  }

  if (entries.length !== 4) {
    throw new Error(`O gerador original trouxe ${entries.length} aba(s); eram esperadas 4.`)
  }

  return entries
}

function jrV40164Restore(session) {
  if (!session || session.restored) return
  session.restored = true

  HTMLAnchorElement.prototype.click = session.originalAnchorClick
  URL.createObjectURL = session.originalCreateObjectURL
  URL.revokeObjectURL = session.originalRevokeObjectURL

  if (session.timer) window.clearInterval(session.timer)

  for (const url of session.heldUrls) {
    try {
      session.originalRevokeObjectURL.call(URL, url)
    } catch {
      // nada
    }
  }
}

async function jrV40164Finish(session) {
  if (!session || session.finishing) return
  session.finishing = true

  const capture = session.capture
  jrV40164Restore(session)

  try {
    if (!capture?.blob) {
      throw new Error('O gerador original não entregou o XLSX.')
    }

    jrV40164Status('Separando as 4 planilhas...')
    jrV40164ButtonLabel(session.button, 'Separando 4 planilhas...')

    const entries = await jrV40164SplitWorkbook(capture.blob)
    const zip = await jrV40164Zip(entries)
    const month = jrV40164Month()

    jrV40164DownloadBlob(
      zip,
      `JR_SERVICOS_EXECUTADOS_4_PLANILHAS_${month}.zip`,
    )

    jrV40164Status('4 planilhas geradas com sucesso.')
    jrV40164ButtonLabel(session.button, '4 planilhas baixadas')

    window.__JR_SERVICES_DOWNLOAD_V40164__ = {
      ok: true,
      source: capture.name,
      files: entries.map((item) => item.name),
      at: new Date().toISOString(),
    }

    console.info(
      '[JR V40.16.4] XLSX original separado em 4 arquivos:',
      entries.map((item) => item.name),
    )
  } catch (error) {
    const message = `Falha ao baixar as 4 planilhas: ${error?.message || error}`
    jrV40164Status(message, true)
    jrV40164ButtonLabel(session.button, 'Baixar 4 planilhas')
    window.__JR_SERVICES_DOWNLOAD_V40164__ = {
      ok: false,
      error: String(error?.stack || error?.message || error),
      at: new Date().toISOString(),
    }
    console.error('[JR V40.16.4]', error)
  } finally {
    window.setTimeout(() => {
      if (session.button) {
        session.button.disabled = false
        jrV40164ButtonLabel(session.button, 'Baixar 4 planilhas')
      }
      if (jrV40164Session === session) jrV40164Session = null
    }, 1500)
  }
}

function jrV40164Start(button) {
  if (jrV40164Session) return false

  const originalAnchorClick = HTMLAnchorElement.prototype.click
  const originalCreateObjectURL = URL.createObjectURL.bind(URL)
  const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL)
  const blobByUrl = new Map()
  const heldUrls = new Set()

  const session = {
    button,
    originalAnchorClick,
    originalCreateObjectURL,
    originalRevokeObjectURL,
    blobByUrl,
    heldUrls,
    capture: null,
    startedAt: Date.now(),
    lastCaptureAt: 0,
    finishing: false,
    restored: false,
    timer: null,
  }

  jrV40164Session = session

  URL.createObjectURL = function jrV40164CreateObjectURL(blob) {
    const url = originalCreateObjectURL(blob)
    if (jrV40164Session === session && blob instanceof Blob) {
      blobByUrl.set(url, blob)
    }
    return url
  }

  URL.revokeObjectURL = function jrV40164RevokeObjectURL(url) {
    if (jrV40164Session === session && heldUrls.has(url)) return
    return originalRevokeObjectURL(url)
  }

  HTMLAnchorElement.prototype.click = function jrV40164AnchorClick() {
    const name = jrV40164Text(this.download)
    const blob = blobByUrl.get(this.href)

    if (
      jrV40164Session === session &&
      /\.xlsx$/i.test(name) &&
      blob instanceof Blob
    ) {
      heldUrls.add(this.href)
      session.capture = { name, blob }
      session.lastCaptureAt = Date.now()
      jrV40164Status('Planilha matriz pronta. Separando em 4 arquivos...')
      console.info('[JR V40.16.4] XLSX matriz capturado:', name, blob.size)
      return
    }

    return originalAnchorClick.call(this)
  }

  session.timer = window.setInterval(() => {
    if (jrV40164Session !== session || session.finishing) return

    const now = Date.now()
    if (
      session.capture &&
      now - session.lastCaptureAt >= JR_V40164_IDLE_MS
    ) {
      void jrV40164Finish(session)
      return
    }

    if (now - session.startedAt > JR_V40164_TIMEOUT_MS) {
      void jrV40164Finish(session)
    }
  }, 180)

  return true
}

document.addEventListener(
  'click',
  (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest('#services-download')
        : null

    if (!target) return

    if (jrV40164ReplayClick) {
      jrV40164ReplayClick = false
      jrV40164Start(target)
      return
    }

    if (jrV40164Session) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }

    if (!window.ExcelJS) {
      event.preventDefault()
      event.stopImmediatePropagation()

      const oldDisabled = Boolean(target.disabled)
      target.disabled = true
      jrV40164ButtonLabel(target, 'Carregando gerador...')
      jrV40164Status('Carregando gerador de planilhas...')

      void jrV40164EnsureExcelJS()
        .then(() => {
          target.disabled = oldDisabled
          jrV40164ButtonLabel(target, 'Baixar 4 planilhas')
          jrV40164ReplayClick = true
          target.click()
        })
        .catch((error) => {
          target.disabled = oldDisabled
          jrV40164ReplayClick = false
          jrV40164ButtonLabel(target, 'Baixar 4 planilhas')
          jrV40164Status(
            `Não foi possível carregar o gerador: ${error?.message || error}`,
            true,
          )
        })

      return
    }

    jrV40164Start(target)
  },
  true,
)

window.__JR_SERVICES_DOWNLOAD_V40164_READY__ = true
console.info('[JR V40.16.4] Gerador robusto das 4 planilhas ativo.')
