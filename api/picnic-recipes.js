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

// Collect recipe-like items from a FusionPage tree.
// Looks in both direct fields and nested params objects.
function extractFromPage(root) {
  const seen = new Set()
  const results = []
  const SKIP_NAMES = new Set([
    'title', 'header', 'page', 'root', 'content', 'home', 'more', 'all',
    'recepten', 'maaltijden', 'meals', 'recipes',
  ])

  function getName(item) {
    return item.name || item.header || item.title || item.display_name
      || item.meal_name || item.recipe_name
      || item.params?.name || item.params?.meal_name || item.params?.recipe_name
      || item.params?.title || item.params?.header || null
  }

  function getId(item) {
    return item.id || item.params?.id || item.params?.recipe_id || item.params?.meal_id || null
  }

  function getImageId(item) {
    if (Array.isArray(item.image_ids) && item.image_ids.length > 0) return item.image_ids[0]
    if (item.image?.image_id) return item.image.image_id
    if (item.image_id) return item.image_id
    if (item.params?.image_id) return item.params.image_id
    if (Array.isArray(item.params?.image_ids)) return item.params.image_ids[0]
    return null
  }

  function isCandidate(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const id = getId(item)
    const name = getName(item)
    if (!id || typeof id !== 'string' || id.length < 4) return false
    if (!name || typeof name !== 'string' || name.length < 3) return false
    if (SKIP_NAMES.has(name.toLowerCase())) return false
    return true
  }

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) {
        const id = getId(item)
        if (isCandidate(item) && id && !seen.has(id)) {
          seen.add(id)
          results.push({
            id,
            name: getName(item),
            imageUrl: imgUrl(getImageId(item)),
            subHeader: item.sub_header || item.subtitle || item.params?.sub_header || null,
          })
        }
        walk(item)
      }
    } else {
      for (const [key, val] of Object.entries(node)) {
        if (key === 'script') continue  // skip compiled JS functions
        if (typeof val === 'object') walk(val)
      }
    }
  }

  walk(root)
  return results
}

// Navigate directly to campaign-meals-section children and show their structure
function debugStructure(page) {
  function trim(val, depth) {
    if (depth <= 0) return '…'
    if (val === null || val === undefined) return val
    if (typeof val === 'string') return val.length > 80 ? val.slice(0, 80) + '…' : val
    if (typeof val !== 'object') return val
    if (Array.isArray(val)) {
      const sample = val.slice(0, 3).map(x => trim(x, depth - 1))
      return val.length > 3 ? [...sample, `(+${val.length - 3} meer)`] : sample
    }
    const out = {}
    for (const [k, v] of Object.entries(val)) {
      if (['script', 'onMount', 'onPageFocus', 'onUnmount', 'analytics'].includes(k)) continue
      out[k] = trim(v, depth - 1)
    }
    return out
  }
  try {
    // Navigate: layout.body → 3x child (STATE_BOUNDARY chain) → children[0] (campaign-page-layout) → children (sections)
    const body = page?.layout?.body
    const container = body?.child?.child?.child
    const campaignLayout = container?.children?.[0]
    const sections = (campaignLayout?.children || []).filter(
      c => c && typeof c === 'object' && c.type === 'BLOCK' && Array.isArray(c.children)
    )
    const result = {
      sectionCount: sections.length,
      firstSectionId: sections[0]?.id,
      firstSectionChildCount: sections[0]?.children?.length,
      firstSectionFirstChild: trim(sections[0]?.children?.[0], 7),
      firstSectionSecondChild: trim(sections[0]?.children?.[1], 4),
    }
    const str = JSON.stringify(result, null, 1)
    return str.length > 5000 ? str.slice(0, 5000) + '…' : str
  } catch (e) { return `(fout: ${e.message})` }
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
      _debug: recipes.length === 0 ? debugStructure(page) : undefined,
    })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
