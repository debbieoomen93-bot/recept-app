export const CATEGORIES = [
  'Groente & fruit',
  'Vlees, vis & vega',
  'Zuivel & eieren',
  'Pasta, rijst & granen',
  'Blikken & potten',
  'Sauzen & kruiden',
  'Bakken & koken',
  'Dranken',
  'Overig',
]

export function getCategoryLabel(value) {
  return CATEGORIES.includes(value) ? value : 'Overig'
}
