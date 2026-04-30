const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

export function formatDateFr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  return day === 1
    ? `1er ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
    : `${day} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateEn(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function lastDayOfMonth(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10)
}

export function firstDayOfMonth(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function buildDescription(lang, fromName, periodStart, periodEnd) {
  if (lang === 'fr') {
    return `Travail de bureau en tant que développeur, ${fromName}, du ${formatDateFr(periodStart)} au ${formatDateFr(periodEnd)}.`
  }
  return `Development work, ${fromName}, from ${formatDateEn(periodStart)} to ${formatDateEn(periodEnd)}.`
}
