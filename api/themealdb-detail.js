const CATEGORY_RULES = [
  ['Groente & fruit', ['tomato', 'onion', 'garlic', 'carrot', 'potato', 'lettuce', 'spinach', 'pepper', 'mushroom', 'zucchini', 'courgette', 'lemon', 'lime', 'avocado', 'mango', 'orange', 'apple', 'ginger', 'celery', 'cucumber', 'aubergine', 'eggplant', 'chilli', 'chili', 'parsley', 'spring onion', 'scallion', 'leek', 'broccoli', 'cauliflower', 'asparagus', 'bean', 'pea', 'corn', 'cabbage', 'kale', 'pumpkin', 'squash', 'beetroot', 'radish']],
  ['Vlees, vis & vega', ['chicken', 'beef', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'prawn', 'meat', 'mince', 'sausage', 'turkey', 'duck', 'fish', 'cod', 'haddock', 'mackerel', 'sardine', 'anchovy', 'squid', 'crab', 'lobster', 'clam', 'mussel', 'bacon', 'ham', 'steak', 'tofu', 'tempeh']],
  ['Zuivel & eieren', ['milk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'egg', 'parmesan', 'mozzarella', 'cheddar', 'feta', 'ricotta', 'brie', 'gouda', 'sour cream', 'crème fraîche', 'mascarpone']],
  ['Pasta, rijst & granen', ['rice', 'pasta', 'spaghetti', 'penne', 'flour', 'noodle', 'lasagne', 'macaroni', 'bulgur', 'lentil', 'chickpea', 'oat', 'bread', 'breadcrumb', 'couscous', 'quinoa', 'barley', 'tagliatelle']],
  ['Blikken & potten', ['tomato paste', 'coconut milk', 'canned', 'passata', 'kidney bean', 'black bean', 'chickpeas', 'diced tomato']],
  ['Sauzen & kruiden', ['salt', 'pepper', 'oregano', 'basil', 'thyme', 'rosemary', 'cumin', 'cinnamon', 'turmeric', 'mustard', 'vinegar', 'soy sauce', 'worcestershire', 'fish sauce', 'oyster sauce', 'hot sauce', 'bay leaf', 'sage', 'dill', 'mint', 'paprika', 'cayenne', 'cardamom', 'clove', 'nutmeg', 'stock cube', 'bouillon']],
  ['Bakken & koken', ['olive oil', 'oil', 'sugar', 'baking powder', 'vanilla', 'cocoa', 'honey', 'syrup', 'cornstarch', 'yeast', 'almond', 'walnut', 'nut', 'raisin', 'coconut', 'sesame']],
  ['Dranken', ['wine', 'beer', 'stock', 'broth', 'juice', 'water']],
]

function detectCategory(name) {
  const lower = name.toLowerCase()
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some(kw => lower.includes(kw))) return category
  }
  return 'Overig'
}

const UNIT_MAP = {
  cup: 'kop', cups: 'kop',
  tbsp: 'eetlepel', tablespoon: 'eetlepel', tablespoons: 'eetlepel',
  tsp: 'theelepel', teaspoon: 'theelepel', teaspoons: 'theelepel',
  g: 'gram', gram: 'gram', grams: 'gram',
  kg: 'kilogram', kilogram: 'kilogram',
  ml: 'milliliter', l: 'liter',
  oz: 'gram', lb: 'gram',
  clove: 'teen', cloves: 'teen',
  pinch: 'snufje', handful: 'handvol',
  slice: 'plak', slices: 'plakken',
  piece: 'stuks', pieces: 'stuks',
}

function parseMeasure(measure) {
  if (!measure?.trim()) return { amount: 1, unit: 'stuks' }
  const m = measure.trim()
  if (/to taste|as needed|as required/i.test(m)) return { amount: 1, unit: 'naar smaak' }
  if (/^pinch$/i.test(m)) return { amount: 1, unit: 'snufje' }

  // Replace unicode fractions
  const str = m.replace('½', '0.5').replace('¼', '0.25').replace('¾', '0.75')
    .replace('⅓', '0.33').replace('⅔', '0.67')

  const match = str.match(/^(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?(?:\s*-\s*\d+)?)\s*(.*)$/)
  if (!match) return { amount: 1, unit: m }

  let numStr = match[1].trim()
  if (numStr.includes('/')) {
    const [n, d] = numStr.split('/')
    numStr = String(Number(n.trim()) / Number(d.trim()))
  }
  if (numStr.includes('-')) numStr = numStr.split('-')[0].trim()

  const amount = Math.round(parseFloat(numStr) * 100) / 100 || 1
  const unitStr = match[2].trim().toLowerCase().replace(/s$/, '') // singular
  const unit = UNIT_MAP[match[2].trim().toLowerCase()] || UNIT_MAP[unitStr] || match[2].trim() || 'stuks'

  return { amount, unit }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { mealId } = req.body
  if (!mealId) return res.status(400).json({ error: 'mealId verplicht' })

  try {
    const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
    const data = await fetch(url).then(r => r.json())
    const meal = data.meals?.[0]
    if (!meal) return res.status(404).json({ error: 'Recept niet gevonden' })

    const ingredients = []
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`]?.trim()
      if (!name) break
      const measure = meal[`strMeasure${i}`]?.trim() || ''
      const { amount, unit } = parseMeasure(measure)
      ingredients.push({ name, amount, unit, category: detectCategory(name) })
    }

    const steps = (meal.strInstructions || '')
      .split(/\r?\n+/)
      .map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(s => s.length > 4)

    const recipe = {
      id: meal.idMeal,
      name: meal.strMeal,
      imageUrl: meal.strMealThumb,
      portions: 4,
      prepTime: null,
      ingredients,
      steps,
      source: 'db',
      category: meal.strCategory,
      area: meal.strArea,
    }

    res.status(200).json({ recipe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
