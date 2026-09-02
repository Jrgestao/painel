// JR_GESTAO_BAIXAR_4_PLANILHAS_ROBUSTO_V40_16_2=20260902
//
// Este modulo NAO recria a planilha.
// Ele deixa o services-board atual gerar os quatro XLSX exatamente como antes,
// captura somente esses quatro downloads e entrega um ZIP unico para o navegador
// nao bloquear downloads automaticos multiplos.

const JR_V4016_EXPECTED = 4
const JR_V4016_TIMEOUT_MS = 45000
const JR_V4016_IDLE_MS = 500

let jrV4016Session = null

function jrV4016Text(value) {
  return String(value ?? '').trim()
}

function jrV4016SafeName(value, fallback = 'planilha.xlsx') {
  const text = jrV4016Text(value)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return fallback
  return /\.xlsx$/i.test(text) ? text : `${text}.xlsx`
}

function jrV4016MonthLabel() {
  const raw =
    document.getElementById('services-month-filter')
      ?.value || ''

  const match =
    String(raw).match(/^(\d{4})-(\d{2})/)

  return match
    ? `${match[2]}-${match[1]}`
    : new Date().toISOString().slice(0, 7)
}

function jrV4016Status(text, error = false) {
  const state =
    document.getElementById('services-save-state')

  if (state) {
    state.textContent = text
    state.dataset.jrV4016 =
      error ? 'error' : 'active'
  }

  if (error) {
    const banner =
      document.getElementById('services-error')

    if (banner) {
      banner.textContent = text
      banner.classList.remove('hidden')
    }
  }
}

function jrV4016ButtonLabel(button, text) {
  const label =
    button?.querySelector('.button-label')

  if (label) {
    label.textContent = text
  } else if (button) {
    button.textContent = text
  }
}

function jrV4016Crc32(bytes) {
  let crc = 0xffffffff

  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]

    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc >>> 1) ^
        (0xedb88320 &
          -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function jrV4016DosDateTime(date = new Date()) {
  const year =
    Math.max(1980, date.getFullYear())

  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)

  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate()

  return { dosTime, dosDate }
}

function jrV4016U16(value) {
  const out = new Uint8Array(2)
  new DataView(out.buffer)
    .setUint16(0, value, true)
  return out
}

function jrV4016U32(value) {
  const out = new Uint8Array(4)
  new DataView(out.buffer)
    .setUint32(0, value >>> 0, true)
  return out
}

function jrV4016Concat(parts) {
  const total =
    parts.reduce(
      (sum, part) =>
        sum + part.byteLength,
      0,
    )

  const out = new Uint8Array(total)

  let offset = 0

  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }

  return out
}

async function jrV4016Zip(entries) {
  const encoder = new TextEncoder()
  const localParts = []
  const centralParts = []

  let offset = 0

  for (const entry of entries) {
    const nameBytes =
      encoder.encode(entry.name)

    const data =
      new Uint8Array(
        await entry.blob.arrayBuffer(),
      )

    const crc =
      jrV4016Crc32(data)

    const {
      dosTime,
      dosDate,
    } = jrV4016DosDateTime(
      new Date(),
    )

    // Local file header.
    const local = jrV4016Concat([
      jrV4016U32(0x04034b50),
      jrV4016U16(20),
      jrV4016U16(0x0800), // UTF-8
      jrV4016U16(0), // STORE: XLSX ja e ZIP; nao recompimir
      jrV4016U16(dosTime),
      jrV4016U16(dosDate),
      jrV4016U32(crc),
      jrV4016U32(data.length),
      jrV4016U32(data.length),
      jrV4016U16(nameBytes.length),
      jrV4016U16(0),
      nameBytes,
      data,
    ])

    localParts.push(local)

    const central = jrV4016Concat([
      jrV4016U32(0x02014b50),
      jrV4016U16(20),
      jrV4016U16(20),
      jrV4016U16(0x0800),
      jrV4016U16(0),
      jrV4016U16(dosTime),
      jrV4016U16(dosDate),
      jrV4016U32(crc),
      jrV4016U32(data.length),
      jrV4016U32(data.length),
      jrV4016U16(nameBytes.length),
      jrV4016U16(0),
      jrV4016U16(0),
      jrV4016U16(0),
      jrV4016U16(0),
      jrV4016U32(0),
      jrV4016U32(offset),
      nameBytes,
    ])

    centralParts.push(central)
    offset += local.byteLength
  }

  const central =
    jrV4016Concat(centralParts)

  const local =
    jrV4016Concat(localParts)

  const end =
    jrV4016Concat([
      jrV4016U32(0x06054b50),
      jrV4016U16(0),
      jrV4016U16(0),
      jrV4016U16(entries.length),
      jrV4016U16(entries.length),
      jrV4016U32(central.byteLength),
      jrV4016U32(local.byteLength),
      jrV4016U16(0),
    ])

  return new Blob(
    [local, central, end],
    { type: 'application/zip' },
  )
}

function jrV4016DownloadBlob(blob, name) {
  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download = name
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    6000,
  )
}

function jrV4016UniqueEntries(captures) {
  const byName = new Map()

  for (const item of captures) {
    let name =
      jrV4016SafeName(item.name)

    if (byName.has(name)) {
      const base =
        name.replace(/\.xlsx$/i, '')

      let index = 2
      let candidate =
        `${base}_${index}.xlsx`

      while (byName.has(candidate)) {
        index += 1
        candidate =
          `${base}_${index}.xlsx`
      }

      name = candidate
    }

    byName.set(name, {
      name,
      blob: item.blob,
    })
  }

  return [...byName.values()]
}

function jrV4016Restore(session) {
  if (!session || session.restored) {
    return
  }

  session.restored = true

  HTMLAnchorElement.prototype.click =
    session.originalAnchorClick

  URL.createObjectURL =
    session.originalCreateObjectURL

  URL.revokeObjectURL =
    session.originalRevokeObjectURL

  window.removeEventListener(
    'error',
    session.onError,
    true,
  )

  window.removeEventListener(
    'unhandledrejection',
    session.onRejection,
    true,
  )

  if (session.timer) {
    window.clearInterval(
      session.timer,
    )
  }

  for (const url of session.heldUrls) {
    try {
      session.originalRevokeObjectURL
        .call(URL, url)
    } catch {
      // Nada.
    }
  }
}

async function jrV4016Finish(session) {
  if (
    !session ||
    session.finishing
  ) {
    return
  }

  session.finishing = true

  const entries =
    jrV4016UniqueEntries(
      session.captures,
    )

  // Restaura ANTES de disparar o ZIP final,
  // senao capturariamos nosso proprio download.
  jrV4016Restore(session)

  try {
    if (
      entries.length !==
      JR_V4016_EXPECTED
    ) {
      const detail =
        session.lastRuntimeError
          ? ` Erro detectado: ${session.lastRuntimeError}`
          : ''

      throw new Error(
        `O gerador atual produziu ${entries.length}/4 arquivos XLSX.${detail}`,
      )
    }

    jrV4016Status(
      'Compactando as 4 planilhas...',
    )

    const zip =
      await jrV4016Zip(entries)

    const month =
      jrV4016MonthLabel()

    jrV4016DownloadBlob(
      zip,
      `JR_SERVICOS_EXECUTADOS_4_PLANILHAS_${month}.zip`,
    )

    jrV4016ButtonLabel(
      session.button,
      '4 planilhas baixadas',
    )

    jrV4016Status(
      '4 planilhas geradas com sucesso.',
    )

    window.__JR_SERVICES_DOWNLOAD_V40162__ = {
      ok: true,
      month,
      files:
        entries.map(
          (entry) => entry.name,
        ),
      at:
        new Date().toISOString(),
    }

    console.info(
      '[JR V40.16.2] 4 XLSX preservados e entregues em ZIP:',
      entries.map(
        (entry) => entry.name,
      ),
    )
  } catch (error) {
    const message =
      `Falha ao baixar as 4 planilhas: ${
        error?.message || error
      }`

    jrV4016Status(
      message,
      true,
    )

    jrV4016ButtonLabel(
      session.button,
      'Baixar 4 planilhas',
    )

    window.__JR_SERVICES_DOWNLOAD_V40162__ = {
      ok: false,
      captures:
        entries.map(
          (entry) => entry.name,
        ),
      error:
        String(
          error?.stack ||
          error?.message ||
          error,
        ),
      at:
        new Date().toISOString(),
    }

    console.error(
      '[JR V40.16.2]',
      error,
    )
  } finally {
    window.setTimeout(() => {
      if (session.button) {
        session.button.disabled =
          session.originalDisabled

        jrV4016ButtonLabel(
          session.button,
          session.originalLabel ||
            'Baixar 4 planilhas',
        )
      }

      if (
        jrV4016Session ===
        session
      ) {
        jrV4016Session = null
      }
    }, 1800)
  }
}

function jrV4016Start(button) {
  if (jrV4016Session) {
    return
  }

  const originalAnchorClick =
    HTMLAnchorElement
      .prototype.click

  const originalCreateObjectURL =
    URL.createObjectURL.bind(URL)

  const originalRevokeObjectURL =
    URL.revokeObjectURL.bind(URL)

  const blobByUrl = new Map()
  const heldUrls = new Set()

  const session = {
    button,
    originalLabel:
      button
        ?.querySelector(
          '.button-label',
        )
        ?.textContent ||
      'Baixar 4 planilhas',
    originalDisabled:
      Boolean(button?.disabled),
    originalAnchorClick,
    originalCreateObjectURL,
    originalRevokeObjectURL,
    blobByUrl,
    heldUrls,
    captures: [],
    lastCaptureAt: 0,
    startedAt:
      Date.now(),
    lastRuntimeError: '',
    finishing: false,
    restored: false,
    timer: null,
    onError: null,
    onRejection: null,
  }

  jrV4016Session = session

  URL.createObjectURL = function jrV4016CreateObjectURL(blob) {
    const url =
      originalCreateObjectURL(blob)

    if (
      jrV4016Session ===
      session &&
      blob instanceof Blob
    ) {
      blobByUrl.set(url, blob)
    }

    return url
  }

  URL.revokeObjectURL = function jrV4016RevokeObjectURL(url) {
    if (
      jrV4016Session ===
        session &&
      heldUrls.has(url)
    ) {
      return
    }

    return originalRevokeObjectURL(
      url,
    )
  }

  HTMLAnchorElement.prototype.click =
    function jrV4016AnchorClick() {
      const name =
        jrV4016Text(
          this.download,
        )

      const isXlsx =
        /\.xlsx$/i.test(name)

      const blob =
        blobByUrl.get(
          this.href,
        )

      if (
        jrV4016Session ===
          session &&
        isXlsx &&
        blob instanceof Blob
      ) {
        heldUrls.add(
          this.href,
        )

        session.captures.push({
          name,
          blob,
        })

        session.lastCaptureAt =
          Date.now()

        jrV4016Status(
          `Planilhas prontas: ${Math.min(
            session.captures.length,
            JR_V4016_EXPECTED,
          )}/4`,
        )

        console.info(
          '[JR V40.16.2] XLSX capturado:',
          name,
          blob.size,
        )

        // Nao deixa o navegador iniciar 4 downloads separados.
        // O conteudo sera entregue intacto dentro de um unico ZIP.
        return
      }

      return originalAnchorClick
        .call(this)
    }

  session.onError =
    (event) => {
      if (
        jrV4016Session ===
        session
      ) {
        session.lastRuntimeError =
          jrV4016Text(
            event?.error?.message ||
            event?.message,
          )
      }
    }

  session.onRejection =
    (event) => {
      if (
        jrV4016Session ===
        session
      ) {
        session.lastRuntimeError =
          jrV4016Text(
            event?.reason?.message ||
            event?.reason,
          )
      }
    }

  window.addEventListener(
    'error',
    session.onError,
    true,
  )

  window.addEventListener(
    'unhandledrejection',
    session.onRejection,
    true,
  )

  // So muda a aparencia depois que o clique original
  // ja teve oportunidade de entrar nos listeners do board.
  window.setTimeout(() => {
    if (
      jrV4016Session !==
      session
    ) {
      return
    }

    if (session.button) {
      session.button.disabled =
        true

      jrV4016ButtonLabel(
        session.button,
        'Gerando 4 planilhas...',
      )
    }

    jrV4016Status(
      'Gerando as 4 planilhas...',
    )
  }, 0)

  session.timer =
    window.setInterval(() => {
      if (
        jrV4016Session !==
        session ||
        session.finishing
      ) {
        return
      }

      const now =
        Date.now()

      if (
        session.captures.length >=
          JR_V4016_EXPECTED &&
        now -
          session.lastCaptureAt >=
          JR_V4016_IDLE_MS
      ) {
        void jrV4016Finish(
          session,
        )
        return
      }

      if (
        now -
          session.startedAt >
        JR_V4016_TIMEOUT_MS
      ) {
        void jrV4016Finish(
          session,
        )
      }
    }, 200)
}

document.addEventListener(
  'click',
  (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest(
            '#services-download',
          )
        : null

    if (!target) {
      return
    }

    // CAPTURE PHASE:
    // instala a captura antes do listener original do services-board.
    jrV4016Start(target)
  },
  true,
)

window.__JR_SERVICES_DOWNLOAD_V40162_READY__ =
  true

console.info(
  '[JR V40.16.2] Download robusto das 4 planilhas ativo.',
)
