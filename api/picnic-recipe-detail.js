import PicnicClient from 'picnic-api'

function imgUrl(id) {
  return id ? `https://storefront-prod.nl.picnicinternational.com/static/images/${id}/large.png` : null
}

function findFirst(node, test, seen = new WeakSet()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return null
  seen.add(node)
  if (test(node)) return node
  const items = Array.isArray(node) ? node : Object.values(node)
  for (const child of items) {
    const found = findFirst(child, test, seen)
    if (found) return found
  }
  return null
}

function findAll(node, test, seen = new WeakSet()) {
  const results = []
  function walk(x) {
    if (!x || typeof x !== 'object' || seen.has(x)) return
    seen.add(x)
    if (test(x)) results.push(x)
    if (Array.isArray(x)) x.forEach(walk)
    else Object.values(x).forEach(walk)
  }
  walk(node)
  return results
}

function parseIngredient(item) {
  const name = item.name || item.ingredient_name || item.header || ''
  if (!name) return null

  const quantityStr = String(item.quantity_text || item.quantity_unit_text || item.quantity || '')
  const match = quantityStr.match(/^(\d+(?:[,.]\d+)?)\s*(.*)$/)
  const amount = match ? parseFloat(match[1].replace(',', '.')) : 1
  const unit = match?.[2]?.trim() || 'stuks'

  const picnicProductId = item.product_id || item.selling_unit_id
    || item.selling_unit?.id || null
  const picnicProductName = item.product_name || item.selling_unit_name
    || item.selling_unit?.name || null

  return { name, amount, unit, picnicProductId, picnicProductName, category: 'Overig' }
}

function parseDetail(page, recipeId) {
  const name = page.name || page.header || page.title
    || findFirst(page, x => x.id === recipeId && (x.name || x.header))?.name
    || 'Picnic recept'

  const imageId = page.image_ids?.[0] || page.image?.image_id
    || findFirst(page, x => Array.isArray(x.image_ids) && x.image_ids.length > 0)?.image_ids?.[0]
    || null

  const portionsNode = findFirst(page, x => x.servings || x.portions || x.num_servings)
  const portions = page.servings || page.portions || portionsNode?.servings || portionsNode?.portions || 4

  const prepNode = findFirst(page, x => x.cooking_time_minutes || x.prep_time_minutes || x.total_time_minutes)
  const prepTime = page.cooking_time_minutes || prepNode?.cooking_time_minutes
    || prepNode?.prep_time_minutes || prepNode?.total_time_minutes || null

  const ingredientNodes = findAll(page, x => Array.isArray(x.ingredients) && x.ingredients.length > 0)
  const ingredients = ingredientNodes
    .flatMap(n => n.ingredients)
    .map(parseIngredient)
    .filter(Boolean)

  const stepNodes = findAll(page, x => Array.isArray(x.preparation_steps) || Array.isArray(x.steps))
  const steps = stepNodes
    .flatMap(n => n.preparation_steps || n.steps || [])
    .map(s => {
      if (typeof s === 'string') return s
      return s.instruction || s.text || s.description || s.body || null
    })
    .filter(s => s && s.length > 2)

  return { id: recipeId, name, imageUrl: imgUrl(imageId), portions, prepTime, ingredients, steps }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { authToken, recipeId } = req.body
  if (!authToken || !recipeId) return res.status(400).json({ error: 'authToken en recipeId verplicht' })

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })
    const page = await client.recipe.getRecipeDetailsPage(recipeId)
    const recipe = parseDetail(page, recipeId)
    res.status(200).json({ recipe })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
