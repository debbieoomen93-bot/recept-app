import { aggregateIngredients } from './shoppingList'

const pasta = {
  ingredients: [
    { name: 'spaghetti', amount: 400, unit: 'g', category: 'Pasta, rijst & granen' },
    { name: 'pancetta', amount: 200, unit: 'g', category: 'Vlees, vis & vega' },
    { name: 'eieren', amount: 4, unit: 'stuks', category: 'Zuivel & eieren' },
  ]
}
const soep = {
  ingredients: [
    { name: 'rode linzen', amount: 250, unit: 'g', category: 'Blikken & potten' },
    { name: 'eieren', amount: 2, unit: 'stuks', category: 'Zuivel & eieren' },
  ]
}

test('combineert ingrediënten van meerdere recepten', () => {
  const result = aggregateIngredients([pasta, soep])
  expect(result['Zuivel & eieren']).toHaveLength(1)
  const eieren = result['Zuivel & eieren'].find(i => i.name === 'eieren')
  expect(eieren.amount).toBe(6)
  expect(eieren.unit).toBe('stuks')
})

test('groepeert per categorie', () => {
  const result = aggregateIngredients([pasta])
  expect(Object.keys(result)).toContain('Pasta, rijst & granen')
  expect(Object.keys(result)).toContain('Vlees, vis & vega')
  expect(Object.keys(result)).toContain('Zuivel & eieren')
})

test('telt hoeveelheden NIET op bij verschillende eenheden', () => {
  const r1 = { ingredients: [{ name: 'melk', amount: 200, unit: 'ml', category: 'Zuivel & eieren' }] }
  const r2 = { ingredients: [{ name: 'melk', amount: 1, unit: 'liter', category: 'Zuivel & eieren' }] }
  const result = aggregateIngredients([r1, r2])
  expect(result['Zuivel & eieren']).toHaveLength(2)
})

test('lege receptenlijst geeft leeg object terug', () => {
  expect(aggregateIngredients([])).toEqual({})
})

test('recept zonder ingrediënten wordt overgeslagen', () => {
  expect(aggregateIngredients([{ ingredients: [] }])).toEqual({})
})
