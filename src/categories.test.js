import { CATEGORIES, getCategoryLabel } from './categories'

test('CATEGORIES is een niet-lege array van strings', () => {
  expect(Array.isArray(CATEGORIES)).toBe(true)
  expect(CATEGORIES.length).toBeGreaterThan(0)
  CATEGORIES.forEach(c => expect(typeof c).toBe('string'))
})

test('getCategoryLabel geeft de waarde terug als die bestaat', () => {
  expect(getCategoryLabel(CATEGORIES[0])).toBe(CATEGORIES[0])
})

test('getCategoryLabel geeft "Overig" terug voor onbekende waarde', () => {
  expect(getCategoryLabel('onbekend')).toBe('Overig')
})
