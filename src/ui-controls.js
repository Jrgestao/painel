import { icon } from './icons.js?v=8'

const controls = new Map()
let activeControl = null
let globalEventsBound = false

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function initializeUiControls() {
  document.querySelectorAll('[data-date-picker-for]').forEach((wrapper) => {
    const id = wrapper.dataset.datePickerFor
    if (id && !controls.has(id)) controls.set(id, new DatePicker(wrapper, id))
  })
  document.querySelectorAll('[data-month-picker-for]').forEach((wrapper) => {
    const id = wrapper.dataset.monthPickerFor
    if (id && !controls.has(id)) controls.set(id, new MonthPicker(wrapper, id))
  })
  document.querySelectorAll('[data-select-for]').forEach((wrapper) => {
    const id = wrapper.dataset.selectFor
    if (id && !controls.has(id)) controls.set(id, new CustomSelect(wrapper, id))
  })

  if (!globalEventsBound) {
    globalEventsBound = true
    document.addEventListener('pointerdown', (event) => {
      if (activeControl && !activeControl.wrapper.contains(event.target)) activeControl.close()
    })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && activeControl) {
        event.preventDefault()
        activeControl.close(true)
      }
    })
    window.addEventListener('resize', () => activeControl?.reposition?.())
    window.addEventListener('scroll', () => activeControl?.reposition?.(), true)
  }
}

export function setUiControlValue(id, value, emit = false) {
  const control = controls.get(id)
  if (control) control.setValue(value, emit)
  else {
    const input = document.getElementById(id)
    if (!input) return
    input.value = value ?? ''
    if (emit) input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export function refreshCustomSelect(id) {
  const control = controls.get(id)
  if (control instanceof CustomSelect) control.refresh()
}

export function closeAllUiControls() {
  controls.forEach((control) => control.close(false))
}

function activate(control) {
  if (activeControl && activeControl !== control) activeControl.close(false)
  activeControl = control
}

function deactivate(control) {
  if (activeControl === control) activeControl = null
}

class BasePopoverControl {
  constructor(wrapper, inputId) {
    this.wrapper = wrapper
    this.input = document.getElementById(inputId)
    this.trigger = wrapper.querySelector('button')
    this.valueNode = wrapper.querySelector('.picker-trigger-value, .custom-select-value')
    if (!this.input || !this.trigger || !this.valueNode) throw new Error(`Controle ${inputId} não encontrado.`)
    this.inputId = inputId
    this.isOpen = false
  }

  open() {
    activate(this)
    this.isOpen = true
    this.wrapper.classList.add('open')
    this.trigger.setAttribute('aria-expanded', 'true')
  }

  close(restoreFocus = false) {
    if (!this.isOpen) return
    this.isOpen = false
    this.wrapper.classList.remove('open')
    this.trigger.setAttribute('aria-expanded', 'false')
    deactivate(this)
    if (restoreFocus) this.trigger.focus()
  }

  emitChange() {
    this.input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

class CustomSelect extends BasePopoverControl {
  constructor(wrapper, inputId) {
    super(wrapper, inputId)
    this.menu = wrapper.querySelector('.custom-select-menu')
    this.trigger.addEventListener('click', () => this.toggle())
    this.trigger.addEventListener('keydown', (event) => this.onTriggerKeydown(event))
    this.menu.addEventListener('keydown', (event) => this.onMenuKeydown(event))
    this.input.addEventListener('change', () => this.updateDisplay())
    this.refresh()
  }

  refresh() {
    const options = [...this.input.options]
    if (!options.some((option) => option.value === this.input.value) && options.length) this.input.value = options[0].value
    this.menu.innerHTML = options.map((option, index) => {
      const selected = option.value === this.input.value
      return `<button type="button" class="custom-select-option${selected ? ' selected' : ''}" role="option" aria-selected="${selected}" data-value="${escapeAttribute(option.value)}" data-index="${index}"><span>${escapeHtml(option.textContent)}</span><span class="option-check">${selected ? icon('check') : ''}</span></button>`
    }).join('')
    this.menu.querySelectorAll('.custom-select-option').forEach((button) => {
      button.addEventListener('click', () => this.select(button.dataset.value))
    })
    this.updateDisplay()
  }

  updateDisplay() {
    const selected = [...this.input.options].find((option) => option.value === this.input.value)
    this.valueNode.textContent = selected?.textContent || 'Selecione'
    this.refreshSelectionOnly()
  }

  refreshSelectionOnly() {
    this.menu.querySelectorAll('.custom-select-option').forEach((button) => {
      const selected = button.dataset.value === this.input.value
      button.classList.toggle('selected', selected)
      button.setAttribute('aria-selected', String(selected))
      const check = button.querySelector('.option-check')
      if (check) check.innerHTML = selected ? icon('check') : ''
    })
  }

  setValue(value, emit = false) {
    const next = value ?? ''
    if ([...this.input.options].some((option) => option.value === next)) this.input.value = next
    this.updateDisplay()
    if (emit) this.emitChange()
  }

  toggle() {
    if (this.isOpen) this.close()
    else this.open()
  }

  open() {
    super.open()
    this.menu.classList.add('show')
    requestAnimationFrame(() => this.focusSelected())
  }

  close(restoreFocus = false) {
    this.menu.classList.remove('show')
    super.close(restoreFocus)
  }

  select(value) {
    this.input.value = value
    this.updateDisplay()
    this.close(true)
    this.emitChange()
  }

  focusSelected() {
    const target = this.menu.querySelector('.custom-select-option.selected') || this.menu.querySelector('.custom-select-option')
    target?.focus()
  }

  onTriggerKeydown(event) {
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault()
      this.toggle()
    } else if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      if (!this.isOpen) this.open()
      else this.moveFocus(event.key === 'ArrowDown' ? 1 : -1)
    }
  }

  onMenuKeydown(event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); this.moveFocus(1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); this.moveFocus(-1) }
    else if (event.key === 'Home') { event.preventDefault(); this.focusByIndex(0) }
    else if (event.key === 'End') { event.preventDefault(); this.focusByIndex(this.menu.querySelectorAll('.custom-select-option').length - 1) }
    else if (['Enter', ' '].includes(event.key)) {
      const current = document.activeElement.closest?.('.custom-select-option')
      if (current) { event.preventDefault(); this.select(current.dataset.value) }
    } else if (event.key === 'Escape') {
      event.preventDefault(); this.close(true)
    }
  }

  moveFocus(delta) {
    const buttons = [...this.menu.querySelectorAll('.custom-select-option')]
    if (!buttons.length) return
    const current = buttons.indexOf(document.activeElement)
    const index = current < 0 ? 0 : (current + delta + buttons.length) % buttons.length
    buttons[index].focus()
  }

  focusByIndex(index) {
    const buttons = [...this.menu.querySelectorAll('.custom-select-option')]
    buttons[Math.max(0, Math.min(index, buttons.length - 1))]?.focus()
  }
}

class DatePicker extends BasePopoverControl {
  constructor(wrapper, inputId) {
    super(wrapper, inputId)
    this.allowClear = wrapper.dataset.allowClear === 'true'
    this.popover = document.createElement('div')
    this.popover.className = 'date-picker-popover'
    this.popover.setAttribute('role', 'dialog')
    this.popover.setAttribute('aria-label', 'Calendário')
    this.wrapper.appendChild(this.popover)
    const initial = parseDateValue(this.input.value) || todayParts()
    this.viewYear = initial.year
    this.viewMonth = initial.month
    this.mode = 'days'
    this.trigger.addEventListener('click', () => this.toggle())
    this.trigger.addEventListener('keydown', (event) => {
      if (['Enter', ' '].includes(event.key)) { event.preventDefault(); this.toggle() }
      else if (event.key === 'ArrowDown') { event.preventDefault(); this.open() }
    })
    this.input.addEventListener('change', () => this.syncFromValue())
    this.updateDisplay()
  }

  setValue(value, emit = false) {
    this.input.value = value || ''
    this.syncFromValue()
    if (emit) this.emitChange()
  }

  syncFromValue() {
    const selected = parseDateValue(this.input.value)
    if (selected) { this.viewYear = selected.year; this.viewMonth = selected.month }
    this.updateDisplay()
    if (this.isOpen) this.render()
  }

  updateDisplay() {
    this.valueNode.textContent = this.input.value ? formatDateBr(this.input.value) : 'Selecione a data'
  }

  toggle() { this.isOpen ? this.close() : this.open() }

  open() {
    const selected = parseDateValue(this.input.value) || todayParts()
    this.viewYear = selected.year
    this.viewMonth = selected.month
    this.mode = 'days'
    this.render()
    super.open()
    this.popover.classList.add('show')
    this.reposition()
    requestAnimationFrame(() => this.popover.querySelector('.calendar-day.selected, .calendar-day.today, .calendar-day:not(.outside)')?.focus())
  }

  close(restoreFocus = false) {
    this.popover.classList.remove('show')
    super.close(restoreFocus)
  }

  reposition() {
    if (!this.isOpen) return
    const rect = this.wrapper.getBoundingClientRect()
    const width = Math.min(390, window.innerWidth - 24)
    this.popover.style.width = `${width}px`
    this.popover.classList.toggle('align-right', rect.left + width > window.innerWidth - 12)
    this.popover.classList.toggle('mobile-fixed', window.innerWidth <= 620)
  }

  render() {
    if (this.mode === 'days') this.renderDays()
    else if (this.mode === 'months') this.renderMonths()
    else this.renderYears()
  }

  renderShell(content, titleContent, previousLabel, nextLabel) {
    this.popover.innerHTML = `<div class="picker-header"><button type="button" class="picker-nav" data-action="previous" aria-label="${previousLabel}">${icon('chevron-left')}</button><div class="picker-heading">${titleContent}</div><button type="button" class="picker-nav" data-action="next" aria-label="${nextLabel}">${icon('chevron-right')}</button></div>${content}`
    this.popover.querySelector('[data-action="previous"]').addEventListener('click', () => this.navigate(-1))
    this.popover.querySelector('[data-action="next"]').addEventListener('click', () => this.navigate(1))
  }

  renderDays() {
    const selected = parseDateValue(this.input.value)
    const today = todayParts()
    const first = new Date(Date.UTC(this.viewYear, this.viewMonth - 1, 1))
    const startOffset = first.getUTCDay()
    const start = new Date(Date.UTC(this.viewYear, this.viewMonth - 1, 1 - startOffset))
    const days = []
    for (let index = 0; index < 42; index += 1) {
      const current = new Date(start.getTime() + index * 86400000)
      const year = current.getUTCFullYear()
      const month = current.getUTCMonth() + 1
      const day = current.getUTCDate()
      const value = toDateValue(year, month, day)
      const outside = month !== this.viewMonth
      const isSelected = selected && value === toDateValue(selected.year, selected.month, selected.day)
      const isToday = value === toDateValue(today.year, today.month, today.day)
      days.push(`<button type="button" class="calendar-day${outside ? ' outside' : ''}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}" data-date="${value}" aria-label="${formatLongDate(value)}" aria-pressed="${Boolean(isSelected)}">${day}</button>`)
    }
    const title = `<button type="button" class="picker-heading-button" data-mode="months">${MONTHS[this.viewMonth - 1]}</button><button type="button" class="picker-heading-button" data-mode="years">${this.viewYear}</button>`
    const footer = `<div class="picker-footer">${this.allowClear ? '<button type="button" data-action="clear">Limpar</button>' : '<span></span>'}<button type="button" data-action="today">Hoje</button></div>`
    const content = `<div class="weekday-grid">${WEEKDAYS.map((day) => `<span>${day}</span>`).join('')}</div><div class="calendar-grid">${days.join('')}</div>${footer}`
    this.renderShell(content, title, 'Mês anterior', 'Próximo mês')
    this.popover.querySelector('[data-mode="months"]').addEventListener('click', () => { this.mode = 'months'; this.render() })
    this.popover.querySelector('[data-mode="years"]').addEventListener('click', () => { this.mode = 'years'; this.render() })
    this.popover.querySelectorAll('.calendar-day').forEach((button) => {
      button.addEventListener('click', () => this.chooseDate(button.dataset.date))
      button.addEventListener('keydown', (event) => this.onDayKeydown(event, button.dataset.date))
    })
    this.popover.querySelector('[data-action="today"]').addEventListener('click', () => this.chooseDate(todayValue()))
    this.popover.querySelector('[data-action="clear"]')?.addEventListener('click', () => this.chooseDate(''))
  }

  renderMonths() {
    const months = MONTHS.map((month, index) => `<button type="button" class="month-option${index + 1 === this.viewMonth ? ' selected' : ''}${this.viewYear === todayParts().year && index + 1 === todayParts().month ? ' current' : ''}" data-month="${index + 1}">${capitalize(month)}</button>`).join('')
    const title = `<span>Selecionar mês</span><button type="button" class="picker-heading-button" data-mode="years">${this.viewYear}</button>`
    this.renderShell(`<div class="month-grid">${months}</div>`, title, 'Ano anterior', 'Próximo ano')
    this.popover.querySelector('[data-mode="years"]').addEventListener('click', () => { this.mode = 'years'; this.render() })
    this.popover.querySelectorAll('[data-month]').forEach((button) => button.addEventListener('click', () => {
      this.viewMonth = Number(button.dataset.month)
      this.mode = 'days'
      this.render()
    }))
  }

  renderYears() {
    const currentYear = todayParts().year
    const start = this.viewYear - 40
    const years = Array.from({ length: 81 }, (_, index) => start + index)
    const title = `<span>${start} – ${start + 80}</span>`
    this.renderShell(`<div class="year-grid scrollable-years">${years.map((year) => `<button type="button" class="year-option${year === this.viewYear ? ' selected' : ''}${year === currentYear ? ' current' : ''}" data-year="${year}">${year}</button>`).join('')}</div>`, title, 'Anos anteriores', 'Próximos anos')
    this.popover.querySelectorAll('[data-year]').forEach((button) => button.addEventListener('click', () => {
      this.viewYear = Number(button.dataset.year)
      this.mode = 'months'
      this.render()
    }))
    requestAnimationFrame(() => this.popover.querySelector('.year-option.selected')?.scrollIntoView({ block: 'center' }))
  }

  navigate(direction) {
    if (this.mode === 'days') {
      this.viewMonth += direction
      if (this.viewMonth < 1) { this.viewMonth = 12; this.viewYear -= 1 }
      if (this.viewMonth > 12) { this.viewMonth = 1; this.viewYear += 1 }
    } else if (this.mode === 'months') this.viewYear += direction
    else this.viewYear += direction * 40
    this.render()
  }

  chooseDate(value) {
    this.input.value = value
    this.updateDisplay()
    this.close(true)
    this.emitChange()
  }

  onDayKeydown(event, value) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (moves[event.key] !== undefined) {
      event.preventDefault()
      const next = addDaysValue(value, moves[event.key])
      const parts = parseDateValue(next)
      this.viewYear = parts.year
      this.viewMonth = parts.month
      this.render()
      requestAnimationFrame(() => this.popover.querySelector(`[data-date="${next}"]`)?.focus())
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      this.navigate(event.key === 'PageUp' ? -1 : 1)
      requestAnimationFrame(() => this.popover.querySelector('.calendar-day:not(.outside)')?.focus())
    }
  }
}

class MonthPicker extends BasePopoverControl {
  constructor(wrapper, inputId) {
    super(wrapper, inputId)
    this.popover = document.createElement('div')
    this.popover.className = 'date-picker-popover month-picker-popover'
    this.popover.setAttribute('role', 'dialog')
    this.popover.setAttribute('aria-label', 'Selecionar mês e ano')
    this.wrapper.appendChild(this.popover)
    const initial = parseMonthValue(this.input.value) || todayParts()
    this.viewYear = initial.year
    this.mode = 'months'
    this.trigger.addEventListener('click', () => this.toggle())
    this.trigger.addEventListener('keydown', (event) => {
      if (['Enter', ' '].includes(event.key)) { event.preventDefault(); this.toggle() }
      else if (event.key === 'ArrowDown') { event.preventDefault(); this.open() }
    })
    this.input.addEventListener('change', () => this.syncFromValue())
    this.updateDisplay()
  }

  setValue(value, emit = false) {
    this.input.value = value || ''
    this.syncFromValue()
    if (emit) this.emitChange()
  }

  syncFromValue() {
    const selected = parseMonthValue(this.input.value)
    if (selected) this.viewYear = selected.year
    this.updateDisplay()
    if (this.isOpen) this.render()
  }

  updateDisplay() {
    const selected = parseMonthValue(this.input.value)
    this.valueNode.textContent = selected ? `${MONTHS[selected.month - 1]} de ${selected.year}` : 'Selecione o mês'
  }

  toggle() { this.isOpen ? this.close() : this.open() }

  open() {
    const selected = parseMonthValue(this.input.value) || todayParts()
    this.viewYear = selected.year
    this.mode = 'months'
    this.render()
    super.open()
    this.popover.classList.add('show')
    this.reposition()
    requestAnimationFrame(() => this.popover.querySelector('.month-option.selected, .month-option.current, .month-option')?.focus())
  }

  close(restoreFocus = false) {
    this.popover.classList.remove('show')
    super.close(restoreFocus)
  }

  reposition() {
    if (!this.isOpen) return
    const rect = this.wrapper.getBoundingClientRect()
    const width = Math.min(390, window.innerWidth - 24)
    this.popover.style.width = `${width}px`
    this.popover.classList.toggle('align-right', rect.left + width > window.innerWidth - 12)
    this.popover.classList.toggle('mobile-fixed', window.innerWidth <= 620)
  }

  render() {
    if (this.mode === 'years') this.renderYears()
    else this.renderMonths()
  }

  renderMonths() {
    const selected = parseMonthValue(this.input.value)
    const today = todayParts()
    this.popover.innerHTML = `<div class="picker-header"><button type="button" class="picker-nav" data-action="previous" aria-label="Ano anterior">${icon('chevron-left')}</button><button type="button" class="picker-heading-button year-title" data-mode="years">${this.viewYear}</button><button type="button" class="picker-nav" data-action="next" aria-label="Próximo ano">${icon('chevron-right')}</button></div><div class="month-grid">${MONTHS.map((month, index) => {
      const monthNumber = index + 1
      const isSelected = selected && selected.year === this.viewYear && selected.month === monthNumber
      const isCurrent = today.year === this.viewYear && today.month === monthNumber
      return `<button type="button" class="month-option${isSelected ? ' selected' : ''}${isCurrent ? ' current' : ''}" data-month="${monthNumber}">${capitalize(month)}</button>`
    }).join('')}</div><div class="picker-footer"><span></span><button type="button" data-action="current-month">Mês atual</button></div>`
    this.popover.querySelector('[data-action="previous"]').addEventListener('click', () => { this.viewYear -= 1; this.render() })
    this.popover.querySelector('[data-action="next"]').addEventListener('click', () => { this.viewYear += 1; this.render() })
    this.popover.querySelector('[data-mode="years"]').addEventListener('click', () => { this.mode = 'years'; this.render() })
    this.popover.querySelectorAll('[data-month]').forEach((button) => button.addEventListener('click', () => this.chooseMonth(Number(button.dataset.month))))
    this.popover.querySelector('[data-action="current-month"]').addEventListener('click', () => {
      const current = todayParts()
      this.viewYear = current.year
      this.chooseMonth(current.month)
    })
  }

  renderYears() {
    const currentYear = todayParts().year
    const start = this.viewYear - 40
    const years = Array.from({ length: 81 }, (_, index) => start + index)
    this.popover.innerHTML = `<div class="picker-header"><button type="button" class="picker-nav" data-action="previous" aria-label="Anos anteriores">${icon('chevron-left')}</button><div class="picker-heading"><span>${start} – ${start + 80}</span></div><button type="button" class="picker-nav" data-action="next" aria-label="Próximos anos">${icon('chevron-right')}</button></div><div class="year-grid scrollable-years">${years.map((year) => `<button type="button" class="year-option${year === this.viewYear ? ' selected' : ''}${year === currentYear ? ' current' : ''}" data-year="${year}">${year}</button>`).join('')}</div>`
    this.popover.querySelector('[data-action="previous"]').addEventListener('click', () => { this.viewYear -= 40; this.render() })
    this.popover.querySelector('[data-action="next"]').addEventListener('click', () => { this.viewYear += 40; this.render() })
    this.popover.querySelectorAll('[data-year]').forEach((button) => button.addEventListener('click', () => { this.viewYear = Number(button.dataset.year); this.mode = 'months'; this.render() }))
    requestAnimationFrame(() => this.popover.querySelector('.year-option.selected')?.scrollIntoView({ block: 'center' }))
  }

  chooseMonth(month) {
    this.input.value = `${this.viewYear}-${String(month).padStart(2, '0')}`
    this.updateDisplay()
    this.close(true)
    this.emitChange()
  }
}

function parseDateValue(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function parseMonthValue(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) }
}

function todayParts() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) }
}

function todayValue() {
  const current = todayParts()
  return toDateValue(current.year, current.month, current.day)
}

function toDateValue(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDaysValue(value, amount) {
  const parts = parseDateValue(value)
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount))
  return toDateValue(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

function formatDateBr(value) {
  const parts = parseDateValue(value)
  return parts ? `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}` : ''
}

function formatLongDate(value) {
  const parts = parseDateValue(value)
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12))
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'full' }).format(date)
}

function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1) }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;') }
function escapeAttribute(value) { return escapeHtml(value) }
