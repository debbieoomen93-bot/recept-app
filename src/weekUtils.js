export function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const week = getISOWeekNumber(date)
  return `${d.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

export function getWeekDays() {
  return ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
}

export function getPrevWeekId(weekId) {
  const [year, week] = weekId.split('-').map(Number)
  if (week === 1) {
    const lastWeek = getISOWeekNumber(new Date(year - 1, 11, 28))
    return `${year - 1}-${String(lastWeek).padStart(2, '0')}`
  }
  return `${year}-${String(week - 1).padStart(2, '0')}`
}

export function getNextWeekId(weekId) {
  const [year, week] = weekId.split('-').map(Number)
  const lastWeekOfYear = getISOWeekNumber(new Date(year, 11, 28))
  if (week === lastWeekOfYear) {
    return `${year + 1}-01`
  }
  return `${year}-${String(week + 1).padStart(2, '0')}`
}
