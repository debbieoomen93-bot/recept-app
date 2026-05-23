import { getWeekId, getWeekDays, getISOWeekNumber, getPrevWeekId, getNextWeekId } from './weekUtils'

test('getISOWeekNumber geeft correct weeknummer', () => {
  expect(getISOWeekNumber(new Date('2026-05-18'))).toBe(21)
  expect(getISOWeekNumber(new Date('2026-01-01'))).toBe(1)
})

test('getWeekId geeft "jaar-week" string', () => {
  expect(getWeekId(new Date('2026-05-18'))).toBe('2026-21')
})

test('getWeekDays geeft array van 7 dagnamen in volgorde', () => {
  const days = getWeekDays()
  expect(days).toEqual(['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'])
})

test('getPrevWeekId geeft de vorige week', () => {
  expect(getPrevWeekId('2026-21')).toBe('2026-20')
})

test('getPrevWeekId handelt jaarovergang af', () => {
  expect(getPrevWeekId('2026-01')).toBe('2025-52')
})

test('getNextWeekId geeft de volgende week', () => {
  expect(getNextWeekId('2026-21')).toBe('2026-22')
})
