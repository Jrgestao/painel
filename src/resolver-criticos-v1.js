// JR_GESTAO_RESOLVER_CRITICOS_GITHUB_V1=20260918
// Modulo isolado: nao altera dashboard, logo, cores ou funcoes existentes.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js?v=2'
import { icon } from './icons.js?v=9'

const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

const FIVE_MINUTES = 5 * 60 * 1000
let profile = null
let current = null
let busy = false

const $ = (s) => document.querySelector(s)
const esc = (v) => String(v ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;')

function dateKey(v) {
  const m = String(v || '').match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}
function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Campo_Grande', year:'numeric', month:'2-digit', day:'2-digit'
  }).format(new Date())
}
function fmtDate(v) {
  const [y,m,d] = dateKey(v).split('-')
  return y && m && d ? `${d}/${m}/${y}` : '—'
}
function fmtDateTime(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Campo_Grande', dateStyle:'short', timeStyle:'short'
  }).format(d)
}
function olderThan5(v) {
  const t = new Date(v || 0).getTime()
  return Number.isFinite(t) && t > 0 ? Date.now() - t >= FIVE_MINUTES : true
}
function parseIds(v) {
  let x = v
  if (typeof x === 'string') {
    try { x = JSON.parse(x) } catch { x = [] }
  }
  return Array.isArray(x) ? x.map(i => String(i || '').trim()).filter(Boolean) : []
}
function latestManifests(rows) {
  const map = new Map()
  for (const row of rows || []) {
    const key = `${row.user_id || ''}|${row.device_id || ''}|${dateKey(row.work_date)}`
    const ts = new Date(row.sent_at || row.updated_at || 0).getTime() || 0
    const old = map.get(key)
    const oldTs = old ? (new Date(old.sent_at || old.updated_at || 0).getTime() || 0) : -1
    if (!old || ts >= oldTs) map.set(key, row)
  }
  return [...map.values()]
}
function addOwner(map, raw, owner) {
  for (const id of parseIds(raw)) {
    const prev = map.get(id)
    if (!prev || owner.sentMs >= prev.sentMs) map.set(id, owner)
  }
}
function buildOwners(manifests, profiles) {
  const profileMap = new Map((profiles || []).map(p => [String(p.id), p]))
  const maps = {active:new Map(), deleted:new Map(), pending:new Map(), conflict:new Map()}
  for (const m of manifests) {
    const p = profileMap.get(String(m.user_id || ''))
    const owner = {
      userId: String(m.user_id || ''),
      deviceId: String(m.device_id || ''),
      workDate: dateKey(m.work_date),
      team: String(p?.team_name || m.team_name || 'Sem equipe identificada').trim(),
      sentAt: m.sent_at || m.updated_at || null,
      sentMs: new Date(m.sent_at || m.updated_at || 0).getTime() || 0,
    }
    addOwner(maps.active, m.active_record_ids, owner)
    addOwner(maps.deleted, m.deleted_record_ids, owner)
    addOwner(maps.pending, m.pending_record_ids, owner)
    addOwner(maps.conflict, m.conflict_record_ids, owner)
  }
  return maps
}
function ownerFor(map,id,date) {
  return map.get(String(id)) || {
    userId:'', deviceId:'', workDate:date, team:'Sem equipe identificada',
    sentAt:null, sentMs:0
  }
}
function hasText(v) { return String(v ?? '').trim().length > 0 }
function photoExpected(r,k) {
  const vals = k === 'time'
    ? [r?.timePhotoFileName,r?.timePhotoTakenAt,r?.timePhotoStoragePath]
    : [r?.surveyPhotoFileName,r?.surveyPhotoTakenAt,r?.surveyPhotoStoragePath]
  return vals.some(hasText)
}
function streetName(r) {
  return String([
    r?.streetName,r?.streetText,r?.logradouroNome,r?.logradouro,r?.manualStreet,
    r?.street?.name,r?.street?.nome, typeof r?.street === 'string' ? r.street : ''
  ].find(hasText) || '').trim()
}
function teamName(row,profileMap) {
  const r = row?.registro || {}
  return String(profileMap.get(String(row?.user_id || ''))?.team_name || r.teamName || '').trim()
}
async function fetchAll(builder, size=1000) {
  const out=[]
  let from=0
  while (true) {
    const {data,error}=await builder(from,from+size-1)
    if (error) throw error
    const page=data||[]
    out.push(...page)
    if (page.length < size) break
    from += size
  }
  return out
}
async function fetchRecords(ids) {
  const unique=[...new Set(ids.map(String).filter(Boolean))]
  const out=[]
  for (let i=0;i<unique.length;i+=100) {
    const {data,error}=await sb.from('service_records')
      .select('id,user_id,data,registro,device_id,deleted_at,updated_at,sync_version')
      .in('id',unique.slice(i,i+100))
    if (error) throw error
    out.push(...(data||[]))
  }
  return out
}
function dedupe(items) {
  const m=new Map()
  for (const i of items) {
    const k=`${i.type}|${i.id}|${i.userId}|${i.deviceId}|${i.workDate}`
    if (!m.has(k)) m.set(k,i)
  }
  return [...m.values()]
}
function resolvable(issue) {
  return Boolean(issue?.serverRecord && !issue.serverRecord.deleted_at &&
    ['Fila de envio','Conflito'].includes(issue.type))
}
function notify(message,error=false) {
  const t=$('#toast')
  if (!t) return alert(message)
  t.textContent=message
  t.classList.toggle('error',error)
  t.classList.add('show')
  clearTimeout(notify.timer)
  notify.timer=setTimeout(()=>t.classList.remove('show'),4600)
}
function friendly(error) {
  const m=error?.message || String(error || '')
  if (/admin_resolve_sync_issue_v1|does not exist|could not find the function/i.test(m))
    return 'A função segura do banco ainda não foi instalada. Execute primeiro o BAT 1_INSTALAR_BANCO_RESOLVER_CRITICOS_V1.'
  if (/42501|permission|administrador/i.test(m)) return 'Acesso negado: somente administrador.'
  if (/failed to fetch|network|fetch/i.test(m)) return 'Não foi possível conectar ao Supabase.'
  return m || 'Erro desconhecido.'
}

async function collect(date) {
  const [profiles, manifestsRaw] = await Promise.all([
    fetchAll((a,b)=>sb.from('profiles').select('id,username,team_name,active,role').range(a,b)),
    fetchAll((a,b)=>sb.from('day_sync_manifests').select('*').eq('work_date',date)
      .order('sent_at',{ascending:false}).range(a,b)),
  ])
  const manifests=latestManifests(manifestsRaw)
  const owners=buildOwners(manifests,profiles)
  const sets={active:new Set(),deleted:new Set(),pending:new Set(),conflict:new Set()}
  for (const m of manifests) {
    parseIds(m.active_record_ids).forEach(id=>sets.active.add(id))
    parseIds(m.deleted_record_ids).forEach(id=>sets.deleted.add(id))
    parseIds(m.pending_record_ids).forEach(id=>sets.pending.add(id))
    parseIds(m.conflict_record_ids).forEach(id=>sets.conflict.add(id))
  }
  const ids=[...new Set([...sets.active,...sets.deleted,...sets.pending,...sets.conflict])]
  const records=ids.length ? await fetchRecords(ids) : []
  const recordMap=new Map(records.map(r=>[String(r.id),r]))
  const profileMap=new Map(profiles.map(p=>[String(p.id),p]))
  const issues=[]

  for (const id of sets.active) {
    if (recordMap.has(id)) continue
    const o=ownerFor(owners.active,id,date)
    if (!olderThan5(o.sentAt)) continue
    issues.push({type:'Ponto não recebido',id,...o,title:'Ponto salvo no celular, mas ausente no Supabase',
      problem:'O registro ainda não chegou ao servidor.',serverRecord:null,
      blocked:'Ainda falta o ponto no Supabase.'})
  }
  for (const id of sets.deleted) {
    const row=recordMap.get(id)
    if (!row || row.deleted_at) continue
    const o=ownerFor(owners.deleted,id,date)
    if (!olderThan5(o.sentAt)) continue
    issues.push({type:'Exclusão pendente',id,...o,title:'Exclusão ainda não confirmada',
      problem:'O celular marcou como excluído, mas o servidor ainda mantém o ponto válido.',
      serverRecord:row,blocked:'Não é seguro cancelar uma exclusão automaticamente pelo site.'})
  }
  for (const id of sets.pending) {
    const o=ownerFor(owners.pending,id,date)
    if (!olderThan5(o.sentAt)) continue
    const row=recordMap.get(id)||null
    issues.push({type:'Fila de envio',id,...o,title:'Alteração aguardando confirmação do servidor',
      problem:row?'O ponto já existe no Supabase; a confirmação ficou presa no aparelho.':'A versão ainda não apareceu no servidor.',
      serverRecord:row,blocked:row?'':'A versão ainda não chegou ao Supabase.'})
  }
  for (const id of sets.conflict) {
    const o=ownerFor(owners.conflict,id,date)
    const row=recordMap.get(id)||null
    issues.push({type:'Conflito',id,...o,title:'Ponto alterado em mais de um celular',
      problem:row?'Existe uma versão atual no Supabase que pode ser mantida pelo administrador.':'Nenhuma versão válida foi encontrada no servidor.',
      serverRecord:row,blocked:row?'':'Não existe uma versão do servidor para manter.'})
  }

  for (const row of records) {
    if (row.deleted_at || !olderThan5(row.updated_at || row.data)) continue
    const r=row.registro||{}
    const common={
      type:'Foto faltando',id:String(row.id),userId:String(row.user_id||''),
      deviceId:String(row.device_id||''),workDate:date,
      team:teamName(row,profileMap)||'Sem equipe identificada',sentAt:row.updated_at||row.data,
      serverRecord:row,blocked:'A foto ainda precisa chegar ao Storage.'
    }
    const label=`${common.team} • ${r.orderNumber || row.id} • ${streetName(r)||'Sem rua'}`
    if (photoExpected(r,'time') && !hasText(r.timePhotoStoragePath))
      issues.push({...common,title:'Foto de horário não chegou ao Storage',problem:label})
    if (photoExpected(r,'survey') && !hasText(r.surveyPhotoStoragePath))
      issues.push({...common,title:'Foto de levantamento não chegou ao Storage',problem:label})
  }

  const list=dedupe(issues)
  return {date,issues:list,resolvable:list.filter(resolvable)}
}

function ensureUi() {
  if (profile?.role !== 'admin') return removeUi()

  if (!$('[data-page="critical-resolver-v1"]')) {
    const b=document.createElement('button')
    b.className='nav-item'
    b.type='button'
    b.dataset.page='critical-resolver-v1'
    b.innerHTML=`<span>${icon('triangle-alert')}</span><span>Resolver críticos</span>`
    const home=$('.sidebar-nav .nav-item[data-page="home"]')
    home?.insertAdjacentElement('afterend',b)
    b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openPage()})
  }

  if (!$('#page-critical-resolver-v1')) {
    const page=document.createElement('section')
    page.id='page-critical-resolver-v1'
    page.className='page-section hidden'
    page.setAttribute('aria-hidden','true')
    page.innerHTML=`
      <section class="panel jr-critical-panel-v1">
        <div class="panel-title-row">
          <div><span class="panel-kicker">${icon('triangle-alert')} RESOLVER CRÍTICOS</span>
          <p>Exclusivo do administrador. Confirma pelo site somente o que já chegou ao Supabase.</p></div>
          <div class="jr-critical-security-v1">${icon('shield-check')} SOMENTE ADMINISTRADOR</div>
        </div>
        <div class="jr-critical-toolbar-v1">
          <label class="jr-critical-date-v1"><span>DATA DO SERVIÇO</span><input id="jr-critical-date-input-v1" type="date"><small>Pendência de envio vira crítica após 5 minutos.</small></label>
          <button id="jr-critical-refresh-v1" class="outline-button" type="button">${icon('refresh')} ATUALIZAR</button>
          <button id="jr-critical-all-v1" class="primary-button" type="button">${icon('shield-check')} RESOLVER COMPLETOS</button>
        </div>
        <div id="jr-critical-summary-v1" class="jr-critical-summary-v1"></div>
        <div id="jr-critical-loading-v1" class="jr-critical-loading-v1 hidden"><span class="spinner"></span>Conferindo servidor...</div>
        <div id="jr-critical-list-v1" class="jr-critical-list-v1"></div>
      </section>`
    $('.main-content')?.appendChild(page)
    $('#jr-critical-date-input-v1').value=dateKey($('#date-filter')?.value)||today()
    $('#jr-critical-date-input-v1').addEventListener('change',refresh)
    $('#jr-critical-refresh-v1').addEventListener('click',refresh)
    $('#jr-critical-all-v1').addEventListener('click',resolveAll)
    page.addEventListener('click',e=>{
      const btn=e.target.closest('[data-resolve-v1]')
      if (!btn) return
      const issue=current?.issues?.[Number(btn.dataset.resolveV1)]
      if (issue) resolveOne(issue,btn)
    })
  }
}
function removeUi() {
  $('[data-page="critical-resolver-v1"]')?.remove()
  $('#page-critical-resolver-v1')?.remove()
}
function openPage() {
  if (profile?.role !== 'admin') return notify('Acesso negado.',true)
  document.querySelectorAll('.page-section').forEach(s=>{
    const on=s.id==='page-critical-resolver-v1'
    s.classList.toggle('hidden',!on)
    s.setAttribute('aria-hidden',String(!on))
    s.toggleAttribute('inert',!on)
  })
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page==='critical-resolver-v1'))
  $('#sidebar')?.classList.remove('open','show','active')
  $('#sidebar-overlay')?.classList.remove('show','open','active')
  document.body.classList.remove('sidebar-open')
  const d=$('#jr-critical-date-input-v1')
  if (d && !d.value) d.value=dateKey($('#date-filter')?.value)||today()
  refresh()
}
function setBusy(v) {
  busy=v
  $('#jr-critical-loading-v1')?.classList.toggle('hidden',!v)
  if ($('#jr-critical-refresh-v1')) $('#jr-critical-refresh-v1').disabled=v
  if ($('#jr-critical-all-v1')) $('#jr-critical-all-v1').disabled=v || !(current?.resolvable?.length)
}
function render() {
  if (!current) return
  const total=current.issues.length, ready=current.resolvable.length, blocked=total-ready
  $('#jr-critical-summary-v1').innerHTML=`
    <article><small>CRÍTICOS</small><strong>${total}</strong><span>${esc(fmtDate(current.date))}</span></article>
    <article><small>PRONTOS PARA RESOLVER</small><strong>${ready}</strong><span>Versão já existe no servidor</span></article>
    <article><small>BLOQUEADOS</small><strong>${blocked}</strong><span>Ainda falta dado/foto/confirmação</span></article>`
  $('#jr-critical-all-v1').disabled=busy || ready===0
  if (!total) {
    $('#jr-critical-list-v1').innerHTML=`<div class="jr-critical-empty-v1">${icon('shield-check')}<strong>Nenhum ponto crítico nesta data</strong><p>Nenhuma pendência acima de 5 minutos exige intervenção.</p></div>`
    return
  }
  $('#jr-critical-list-v1').innerHTML=current.issues.map((i,n)=>{
    const row=i.serverRecord, r=row?.registro||{}, ok=resolvable(i)
    const updated=row?.updated_at||row?.data
    return `<article class="jr-critical-item-v1 ${ok?'ready':'blocked'}">
      <div class="jr-critical-head-v1"><span class="status-pill pending">CRÍTICO</span><strong>${esc(i.title)}</strong><em>${esc(i.type)}</em></div>
      <div class="jr-critical-grid-v1">
        <span><small>EQUIPE</small><strong>${esc(i.team||'Sem equipe')}</strong></span>
        <span><small>ID</small><strong>${esc(i.id)}</strong></span>
        <span><small>ORDEM</small><strong>${esc(r.orderNumber||'—')}</strong></span>
        <span><small>RUA</small><strong>${esc(streetName(r)||'—')}</strong></span>
        <span><small>APARELHO</small><strong>${esc(i.deviceId||'—')}</strong></span>
        <span><small>VERSÃO NO SERVIDOR</small><strong>${esc(updated?fmtDateTime(updated):'Não chegou')}</strong></span>
      </div>
      <p>${esc(i.problem||'')}</p>
      <div class="jr-critical-note-v1 ${ok?'safe':'unsafe'}">${ok?icon('shield-check'):icon('triangle-alert')}<span>${esc(ok?'Ao confirmar, a versão atual do Supabase será mantida e o pending/conflito será encerrado.':i.blocked||'Ainda não pode resolver com segurança.')}</span></div>
      <div class="jr-critical-actions-v1"><button class="${ok?'primary-button':'outline-button'}" type="button" data-resolve-v1="${n}" ${ok?'':'disabled'}>${icon('shield-check')} ${ok?'MANTER VERSÃO DO SERVIDOR':'AINDA NÃO PODE RESOLVER'}</button></div>
    </article>`
  }).join('')
}
async function refresh() {
  if (busy || profile?.role!=='admin') return
  setBusy(true)
  try {
    const d=dateKey($('#jr-critical-date-input-v1')?.value)||today()
    current=await collect(d)
    render()
  } catch (e) {
    console.error('[JR Resolver críticos]',e)
    current={date:dateKey($('#jr-critical-date-input-v1')?.value)||today(),issues:[],resolvable:[]}
    render()
    notify(`Falha ao conferir críticos: ${friendly(e)}`,true)
  } finally { setBusy(false) }
}
async function rpc(issue) {
  const {data,error}=await sb.rpc('admin_resolve_sync_issue_v1',{
    p_record_id:String(issue.id),
    p_user_id:issue.userId||null,
    p_device_id:issue.deviceId||'',
    p_work_date:issue.workDate||current?.date||today(),
    p_issue_type:issue.type,
  })
  if (error) throw error
  if (data?.resolved===false) throw new Error(data.reason||'Servidor recusou a resolução.')
  return data
}
async function resolveOne(issue,btn) {
  if (!resolvable(issue)||busy) return
  btn.disabled=true
  try {
    await rpc(issue)
    notify(`Crítico ${issue.id} resolvido mantendo a versão que já estava no servidor.`)
    await refresh()
    $('#refresh-button')?.click()
  } catch(e) { notify(`Não foi possível resolver: ${friendly(e)}`,true) }
}
async function resolveAll() {
  const list=[...(current?.resolvable||[])]
  if (!list.length || busy) return notify('Nenhum crítico completo para resolver nesta data.')
  let done=0
  setBusy(true)
  try {
    for (const i of list) { await rpc(i); done++ }
    notify(`${done} ponto(s) crítico(s) resolvido(s) mantendo a versão do servidor.`)
  } catch(e) {
    notify(`Resolvidos ${done}. O restante parou por: ${friendly(e)}`,true)
  } finally {
    setBusy(false)
    await refresh()
    $('#refresh-button')?.click()
  }
}
async function syncRole() {
  try {
    const {data:{session}}=await sb.auth.getSession()
    if (!session?.user) { profile=null; return removeUi() }
    const {data,error}=await sb.from('profiles').select('id,active,role,username,team_name').eq('id',session.user.id).maybeSingle()
    if (error) throw error
    profile=data?.active?data:null
    profile?.role==='admin' ? ensureUi() : removeUi()
  } catch(e) {
    console.warn('[JR Resolver críticos] perfil',e)
    profile=null
    removeUi()
  }
}
function boot() {
  syncRole()
  sb.auth.onAuthStateChange(()=>setTimeout(syncRole,100))
  const obs=new MutationObserver(()=>{ if(profile?.role==='admin'&&!$('[data-page="critical-resolver-v1"]')) ensureUi() })
  obs.observe(document.documentElement,{childList:true,subtree:true})
  $('#date-filter')?.addEventListener('change',()=>{
    const d=$('#jr-critical-date-input-v1')
    if(d)d.value=dateKey($('#date-filter')?.value)||today()
    if(!$('#page-critical-resolver-v1')?.classList.contains('hidden'))refresh()
  })
}
document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',boot,{once:true}) : boot()
