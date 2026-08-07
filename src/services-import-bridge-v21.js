import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config-cachefix-20260731-140035.js'

const createClient = window.supabase?.createClient
if (typeof createClient !== 'function') throw new Error('Supabase indisponível para registros importados.')
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
const months = new Map()
const loading = new Map()
const CACHE_TTL = 5 * 60 * 1000

function monthKeys(start, end) {
  const result = []
  const a = String(start || '').slice(0, 7)
  const b = String(end || start || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(a) || !/^\d{4}-\d{2}$/.test(b)) return result
  let [y,m] = a.split('-').map(Number)
  const [ey,em] = b.split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) {
    result.push(`${y}-${String(m).padStart(2,'0')}`)
    m += 1
    if (m > 12) { m = 1; y += 1 }
    if (result.length > 24) break
  }
  return result
}

function normalizeClock(raw) {
  const value = String(raw || '').trim().replaceAll('.',':').replaceAll('_',':').replaceAll('-',':')
  let match = value.match(/(?:^|\D)\d{8}[\s:_-]?(\d{2})(\d{2})(\d{2})?(?:\D|$)/)
  if (!match) match = value.match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\D|$)/)
  if (!match) match = value.match(/(?:^|\D)([01]\d|2[0-3])([0-5]\d)([0-5]\d)?(?:\D|$)/)
  if (!match) return '00:00:00'
  return `${String(match[1]).padStart(2,'0')}:${String(match[2]).padStart(2,'0')}:${String(match[3] || '00').padStart(2,'0')}`
}

function virtualRow(item, setting, index) {
  const date = String(item.date || '').slice(0,10)
  const time = normalizeClock(item.time)
  const compact = `${date.replaceAll('-','')}_${time.replaceAll(':','')}`
  const survey = item.kind === 'survey'
  const teamName = String(setting.display_name || item.teamName || '').trim()
  const products = Array.isArray(item.products) ? item.products.map((p) => ({
    product: { code: String(p.code || ''), name: String(p.name || '') },
    quantity: String(p.quantity ?? ''),
  })) : []

  return {
    id: `import-v21:${setting.team_key}:${date}:${item.sourceRow || index}:${survey ? 's' : 'p'}`,
    user_id: setting.team_key,
    data: `${date}T${time}`,
    updated_at: setting.updated_at || `${date}T${time}`,
    deleted_at: null,
    __jrImportedV21: true,
    registro: {
      __jrImportedKind: survey ? 'survey' : 'point',
      date,
      teamName,
      orderNumber: String(item.orderNumber || ''),
      number: String(item.number ?? ''),
      serviceType: {
        code: survey ? '162' : String(item.serviceCode || ''),
        name: survey ? 'Levantamento' : String(item.serviceName || ''),
      },
      street: { code: String(item.streetCode || ''), name: String(item.streetName || '') },
      neighborhood: { code: String(item.neighborhoodCode || ''), name: String(item.neighborhoodName || '') },
      products,
      observation: survey ? '' : String(item.observation || ''),
      surveyObservation: survey ? String(item.surveyObservation || item.observation || '') : '',
      stampedTimeText: time.slice(0,5),
      timePhotoTakenAt: survey ? '' : `${date}T${time}`,
      surveyPhotoTakenAt: survey ? `${date}T${time}` : '',
      timePhotoFileName: survey ? '' : `IMPORT_${compact}.jpg`,
      surveyPhotoFileName: survey ? `IMPORT_${compact}.jpg` : '',
      importedSourceFile: String(item.sourceFile || ''),
    },
  }
}

function rowsFromSettings(data) {
  const result = []
  for (const setting of data || []) {
    const rows = Array.isArray(setting?.manual_notes?.imported_rows) ? setting.manual_notes.imported_rows : []
    rows.forEach((item,index) => result.push(virtualRow(item,setting,index)))
  }
  return result
}

async function loadMonth(month, force=false) {
  const cached = months.get(month)
  if (!force && cached && Date.now() - cached.loadedAt < CACHE_TTL) return cached.rows
  if (loading.has(month)) return loading.get(month)
  const promise = (async () => {
    const { data, error } = await supabase
      .from('service_report_settings')
      .select('month_key, team_key, display_name, manual_notes, updated_at')
      .eq('month_key', month)
    if (error) throw error
    const rows = rowsFromSettings(data)
    months.set(month,{rows,loadedAt:Date.now()})
    return rows
  })().finally(() => loading.delete(month))
  loading.set(month,promise)
  return promise
}

function recordsForRange(start,end) {
  const result=[]
  for (const month of monthKeys(start,end)) {
    const cached=months.get(month)
    if (!cached) continue
    cached.rows.forEach((row) => {
      const day=String(row.registro?.date || '').slice(0,10)
      if (day >= start && day <= end) result.push(row)
    })
  }
  return result
}

async function refreshRange(start,end,force=false) {
  await Promise.all(monthKeys(start,end).map((month)=>loadMonth(month,force)))
  document.dispatchEvent(new CustomEvent('jr:imported-v21-ready',{detail:{start,end}}))
  return recordsForRange(start,end)
}

window.__JR_IMPORTED_RECORDS_V21__ = {
  recordsForRange,
  refreshRange,
  clearMonth(month) { months.delete(month) },
}

function currentRanges() {
  const value=(id)=>document.getElementById(id)?.value || ''
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Campo_Grande',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  return [
    [value('codes-range-start') || today, value('codes-range-end') || value('codes-range-start') || today],
    [value('orders-range-start') || today, value('orders-range-end') || value('orders-range-start') || today],
  ]
}

function warm(force=false) {
  currentRanges().forEach(([start,end])=>{ void refreshRange(start,end,force).catch(()=>{}) })
}

document.addEventListener('jr:pagechange',(event)=>{
  if (['codes','orders'].includes(event.detail?.page)) warm(false)
})
document.addEventListener('jr:services-settings-updated',(event)=>{
  const month=event.detail?.month
  if (month) months.delete(month)
  warm(true)
})
document.addEventListener('jr:imported-records-v21',(event)=>{
  const month=event.detail?.month
  if (month) months.delete(month)
  warm(true)
})

warm(false)
