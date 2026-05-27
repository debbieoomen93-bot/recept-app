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
        'Content-Type': 'application/json',
      }
    })
    if (!res.ok) return { _status: res.status }
    return res.json()
  } catch { return null }
}

// Extract all SUSPENSE components with a non-null pageConfig.id
function extractSuspenseConfigs(page) {
  const configs = []
  const seen = new Set()
  function walk(val) {
    if (!val || typeof val !== 'object') return
    if (Array.isArray(val)) { val.forEach(walk); return }
    if (val.type === 'SUSPENSE' && val.pageConfig?.id && !seen.has(val.pageConfig.id)) {
      seen.add(val.pageConfig.id)
      configs.push({ pageConfigId: val.pageConfig.id, params: val.pageConfig.parameters || {} })
    }
    for (const [k, v] of Object.entries(val)) {
      if (k === 'script') continue
      if (typeof v === 'object') walk(v)
    }
  }
  walk(page)
  return configs
}

// Try to find recipe-like items in a FusionPage response.
// Only returns items that look like individual recipes (have a name + image or selling-group reference).
function extractRecipesFromPage(data) {
  if (!data || data._status) return []
  const seen = new Set()
  const results = []
  const SKIP = new Set(['title', 'header', 'page', 'root', 'content', 'home', 'more', 'all', 'maaltijden', 'recepten', 'meals', 'recipes'])

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) {
        const id = item?.params?.recipe_id || item?.params?.selling_group_id || item?.recipe_id || item?.selling_group_id
        const name = item?.params?.name || item?.params?.title || item?.params?.recipe_name || item?.name
        if (id && name && typeof id === 'string' && typeof name === 'string' && name.length >= 3 && !SKIP.has(name.toLowerCase()) && !seen.has(id)) {
          seen.add(id)
          const imageId = item?.params?.image_id
            || (Array.isArray(item?.params?.image_ids) ? item.params.image_ids[0] : null)
            || item?.image_id || null
          results.push({ id, name, imageUrl: imgUrl(imageId), subHeader: null })
        }
        walk(item)
      }
    } else {
      for (const [k, v] of Object.entries(node)) {
        if (k === 'script') continue
        if (typeof v === 'object') walk(v)
      }
    }
  }
  walk(data)
  return results
}

// Trim a value for debug display
function trimDebug(val, maxLen = 200) {
  if (!val) return val
  if (val._status) return `HTTP ${val._status}`
  const s = JSON.stringify(val)
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { authToken } = req.body
  if (!authToken) return res.status(400).json({ error: 'authToken verplicht' })

  const debug = {}

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })

    // 1. Get the FusionPage and extract SUSPENSE page IDs
    let page = null
    try {
      page = await client.recipe.getRecipesPage()
    } catch (pkgErr) {
      page = pkgErr?.data || pkgErr?.response || pkgErr?.body || null
    }

    if (page) {
      const suspenseConfigs = extractSuspenseConfigs(page)
      debug.suspenseConfigs = suspenseConfigs.map(c => c.pageConfigId)

      // Fetch each SUSPENSE page and look for recipe items
      for (const { pageConfigId, params } of suspenseConfigs) {
        const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
        const path = `/pages/${pageConfigId}${query ? `?${query}` : ''}`
        const data = await fetchDirect(authToken, path)
        debug[pageConfigId] = trimDebug(data)
        const recipes = extractRecipesFromPage(data)
        if (recipes.length > 0) return res.status(200).json({ recipes, _source: `suspense:${pageConfigId}` })
      }
    }

    // 2. Try a few more direct paths with recipe-specific endpoints
    const extraPaths = [
      '/pages/planner-cloud-wrapper',
      '/pages/meal-planner-cloud-wrapper',
      '/pages/cooking-widget-page',
      '/pages/my-saved-recipes',
    ]
    for (const path of extraPaths) {
      const data = await fetchDirect(authToken, path)
      debug[path] = trimDebug(data)
      const recipes = extractRecipesFromPage(data)
      if (recipes.length > 0) return res.status(200).json({ recipes, _source: `extra:${path}` })
    }

    return res.status(200).json({ recipes: [], _debug: debug })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
