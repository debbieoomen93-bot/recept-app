import PicnicClient from 'picnic-api'

const BASE_URL = 'https://storefront-prod.nl.picnicinternational.com/api/15'
const AGENT = '30100;1.228.1-15480;'
const IMG_BASE = 'https://storefront-prod.nl.picnicinternational.com/static/images'

const imgUrl = (id) => id ? `${IMG_BASE}/${id}/medium.png` : null

async function fetchDirect(authToken, path) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'x-picnic-auth': authToken,
        'x-picnic-agent': AGENT,
        'Accept-Language': 'nl_NL',
      }
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// Try to extract recipes from a direct API response (array or items list)
function extractDirect(data) {
  if (!data) return null
  const list = Array.isArray(data) ? data
    : data.recipes || data.items || data.results || data.data
  if (!Array.isArray(list) || list.length === 0) return null
  return list
    .filter(x => x && typeof x === 'object' && x.id && (x.name || x.title))
    .map(x => {
      const imageId = Array.isArray(x.image_ids) ? x.image_ids[0]
        : x.image?.image_id || x.image_id || null
      return {
        id: String(x.id),
        name: x.name || x.title || x.header,
        imageUrl: imgUrl(imageId),
        subHeader: x.sub_header || x.subtitle || null,
      }
    })
}

// Collect every object in every array that has an id + non-trivial name
function extractFromPage(root) {
  const seen = new Set()
  const results = []
  const SKIP_NAMES = new Set(['title', 'header', 'page', 'root', 'content', 'home', 'more', 'all'])

  function isCandidate(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const id = item.id
    const name = item.name || item.header || item.title || item.display_name
    if (!id || typeof id !== 'string' || id.length < 4) return false
    if (!name || typeof name !== 'string' || name.length < 3) return false
    if (SKIP_NAMES.has(name.toLowerCase())) return false
    return true
  }

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) {
        if (isCandidate(item) && !seen.has(item.id)) {
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

function debugSample(page) {
  try {
    const str = JSON.stringify(page)
    return str.length > 1200 ? str.slice(0, 1200) + '…' : str
  } catch { return '(niet leesbaar)' }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { authToken } = req.body
  if (!authToken) return res.status(400).json({ error: 'authToken verplicht' })

  try {
    // 1. Try direct Picnic API endpoints
    const directPaths = [
      '/recipes',
      '/recipes/overview',
      '/recipes/page',
      '/cms/page-content/recipes',
    ]
    for (const path of directPaths) {
      const data = await fetchDirect(authToken, path)
      const recipes = extractDirect(data)
      if (recipes && recipes.length > 0) {
        return res.status(200).json({ recipes, _source: path })
      }
    }

    // 2. Fall back to picnic-api package FusionPage
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })
    let page = null
    try {
      page = await client.recipe.getRecipesPage()
    } catch (pkgErr) {
      page = pkgErr?.data || pkgErr?.response || pkgErr?.body || null
      if (!page) throw pkgErr
    }

    const recipes = extractFromPage(page)
    return res.status(200).json({
      recipes,
      _debug: recipes.length === 0 ? debugSample(page) : undefined,
    })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
