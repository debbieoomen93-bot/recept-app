export function aggregateIngredients(recipes) {
  const grouped = {}

  for (const recipe of recipes) {
    for (const ing of (recipe.ingredients || [])) {
      const cat = ing.category || 'Overig'
      if (!grouped[cat]) grouped[cat] = []

      const existing = grouped[cat].find(
        i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit
      )
      if (existing) {
        existing.amount += ing.amount
      } else {
        grouped[cat].push({ name: ing.name, amount: ing.amount, unit: ing.unit })
      }
    }
  }

  return grouped
}
