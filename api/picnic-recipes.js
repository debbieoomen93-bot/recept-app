import PicnicClient from 'picnic-api'

function imgUrl(id) {
  return id ? `https://storefront-prod.nl.picnicinternational.com/static/images/${id}/medium.png` : null
}

function extractRecipes(page) {
  const seen = new Set()
  const results = []

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(walk); return }

    const name = node.name || node.header || node.title
    const id = node.id
    if (id && name && typeof name === 'string' && !seen.has(id)) {
      seen.add(id)
      const imageId = Array.isArray(node.image_ids) ? node.image_ids[0]
        : node.image?.image_id || node.image_id || null
      results.push({
        id,
        name,
        imageUrl: imgUrl(imageId),
        subHeader: node.sub_header || node.subtitle || null,
      })
    }

    for (const val of Object.values(node)) {
      if (typeof val === 'object') walk(val)
    }
  }

  walk(page)
  return results
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { authToken } = req.body
  if (!authToken) return res.status(400).json({ error: 'authToken verplicht' })

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })
    const page = await client.recipe.getRecipesPage()
    const recipes = extractRecipes(page)
    res.status(200).json({ recipes })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
