import PicnicClient from 'picnic-api'

const IMG_BASE = 'https://storefront-prod.nl.picnicinternational.com/static/images'
const imgUrl = (id) => id ? `${IMG_BASE}/${id}/medium.png` : null

// Only extract items found INSIDE arrays, to avoid picking up page-root metadata
function extractFromPage(root) {
  const seen = new Set()
  const results = []

  function isRecipeLike(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const id = item.id
    const name = item.name || item.header || item.title || item.display_name
    if (!id || typeof id !== 'string' || id.length < 4) return false
    if (!name || typeof name !== 'string' || name.length < 3) return false
    // Skip generic metadata values
    if (['title', 'header', 'page', 'root', 'content'].includes(name.toLowerCase())) return false
    // Prefer items with an image or type hint
    const hasImage = Array.isArray(item.image_ids) && item.image_ids.length > 0
      || item.image?.image_id || item.image_id
    const isRecipeType = String(item.type || item.item_type || '').toLowerCase().includes('recipe')
    return hasImage || isRecipeType
  }

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) {
        if (isRecipeLike(item) && !seen.has(item.id)) {
          seen.add(item.id)
          const imageId = Array.isArray(item.image_ids) ? item.image_ids[0]
            : item.image?.image_id || item.image_id || null
          results.push({
            id: item.id,
            name: item.name || item.header || item.title || item.display_name,
            imageUrl: imgUrl(imageId),
            subHeader: item.sub_header || item.subtitle || null,
          })
        }
        walk(item)
      }
    } else {
      for (const val of Object.values(node)) {
        if (typeof val === 'object') walk(val)
      }
    }
  }

  walk(root)
  return results
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { authToken } = req.body
  if (!authToken) return res.status(400).json({ error: 'authToken verplicht' })

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })
    const page = await client.recipe.getRecipesPage()
    const recipes = extractFromPage(page)
    res.status(200).json({ recipes, _debug_keys: Object.keys(page || {}) })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
