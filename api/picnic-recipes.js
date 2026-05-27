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
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// Walk a FusionPage and collect all SUSPENSE components that have a pageConfig.id
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

// Extract recipe-like items from any FusionPage or list response
function extractRecipes(data) {
  if (!data) return []
  const seen = new Set()
  const results = []

  // Direct list
  const list = Array.isArray(data) ? data
    : data.recipes || data.items || data.results || data.data || data.selling_groups || data.meals
  if (Array.isArray(list)) {
    for (const x of list) {
      if (!x?.id || !(x.name || x.title)) continue
      const id = String(x.id)
      if (seen.has(id)) continue
      seen.add(id)
      const imageId = Array.isArray(x.image_ids) ? x.image_ids[0]
        : x.image?.image_id || x.image_id || null
      results.push({ id, name: x.name || x.title, imageUrl: imgUrl(imageId), subHeader: x.sub_header || x.subtitle || null })
    }
    if (results.length > 0) return results
  }

  // Walk FusionPage tree for recipe items
  const SKIP = new Set(['title', 'header', 'page', 'root', 'content', 'home', 'more', 'all', 'maaltijden', 'recepten', 'meals', 'recipes'])
  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) {
        const id = item?.id || item?.params?.recipe_id || item?.params?.selling_group_id
        const name = item?.name || item?.header || item?.title || item?.params?.name || item?.params?.title
        if (id && name && typeof id === 'string' && id.length >= 4 && typeof name === 'string' && name.length >= 3 && !SKIP.has(name.toLowerCase()) && !seen.has(id)) {
          seen.add(id)
          const imageId = Array.isArray(item.image_ids) ? item.image_ids[0]
            : item.image?.image_id || item.image_id || item.params?.image_id || null
          results.push({ id, name, imageUrl: imgUrl(imageId), subHeader: item.sub_header || item.subtitle || null })
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

// Build catalog item as recipe entry
function catalogToRecipe(item) {
  if (!item?.id || !item?.name) return null
  const imageId = item.image_id || (Array.isArray(item.image_ids) ? item.image_ids[0] : null)
  return { id: String(item.id), name: item.name, imageUrl: imgUrl(imageId), subHeader: item.unit_quantity || null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { authToken } = req.body
  if (!authToken) return res.status(400).json({ error: 'authToken verplicht' })

  const debug = {}

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })

    // 1. Try direct endpoints
    const directPaths = [
      '/selling_groups',
      '/selling_groups?offset=0&limit=50',
      '/meals',
      '/maaltijden',
      '/pages/planner-cloud-wrapper',
      '/pages/cooking-widget',
    ]
    for (const path of directPaths) {
      const data = await fetchDirect(authToken, path)
      const recipes = extractRecipes(data)
      if (recipes.length > 0) return res.status(200).json({ recipes, _source: `direct:${path}` })
      if (data) debug[path] = JSON.stringify(data).slice(0, 150)
    }

    // 2. Catalog search for meal-related terms
    for (const term of ['maaltijden', 'maaltijdbox', 'kookdoos']) {
      try {
        const results = await client.catalog.search(term)
        const mapped = (results || []).map(catalogToRecipe).filter(Boolean)
        if (mapped.length > 0) return res.status(200).json({ recipes: mapped, _source: `catalog:${term}` })
        debug[`catalog:${term}`] = (results || []).slice(0, 2).map(x => ({ id: x?.id, name: x?.name }))
      } catch (e) { debug[`catalog:${term}`] = `fout: ${e.message}` }
    }

    // 3. Get FusionPage, extract SUSPENSE pageConfig IDs, fetch each
    let page = null
    try {
      page = await client.recipe.getRecipesPage()
    } catch (pkgErr) {
      page = pkgErr?.data || pkgErr?.response || pkgErr?.body || null
    }

    if (page) {
      const suspenseConfigs = extractSuspenseConfigs(page)
      debug.suspenseConfigs = suspenseConfigs.map(c => c.pageConfigId)

      for (const { pageConfigId, params } of suspenseConfigs) {
        const query = Object.entries(params || {}).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
        const path = `/pages/${pageConfigId}${query ? `?${query}` : ''}`
        const data = await fetchDirect(authToken, path)
        const recipes = extractRecipes(data)
        if (recipes.length > 0) return res.status(200).json({ recipes, _source: `suspense:${pageConfigId}` })
        if (data) debug[`suspense:${pageConfigId}`] = JSON.stringify(data).slice(0, 150)
      }
    }

    return res.status(200).json({ recipes: [], _debug: debug })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
