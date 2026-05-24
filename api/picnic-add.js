// api/picnic-add.js
import crypto from 'crypto'

const BASE_URL = 'https://storefront-prod.nl.picnicinternational.com/api/15'
const AGENT = '30100;1.0;17.28.0;Samsung;Android/17.28.0;nl;01'

async function picnicLogin(email, password) {
  const passwordHash = crypto.createHash('md5').update(password).digest('hex')
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-picnic-agent': AGENT,
    },
    body: JSON.stringify({ key: email, secret: passwordHash, client_id: 1 }),
  })
  if (!res.ok) throw new Error('Picnic login mislukt — controleer e-mail en wachtwoord')
  return res.headers.get('x-picnic-auth')
}

async function searchProduct(authToken, searchTerm) {
  const res = await fetch(`${BASE_URL}/search?search_term=${encodeURIComponent(searchTerm)}`, {
    headers: { 'x-picnic-auth': authToken, 'x-picnic-agent': AGENT },
  })
  const data = await res.json()
  return data?.[0]?.items?.[0]?.id || null
}

async function addToCart(authToken, productId) {
  const res = await fetch(`${BASE_URL}/cart/add_product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-picnic-auth': authToken,
      'x-picnic-agent': AGENT,
    },
    body: JSON.stringify({ product_id: productId, count: 1 }),
  })
  if (!res.ok) throw new Error(`Cart toevoegen mislukt: ${res.status}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, ingredients } = req.body
  if (!email || !password || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' })
  }

  try {
    const authToken = await picnicLogin(email, password)
    const added = []
    const failed = []

    for (const ing of ingredients) {
      const productId = await searchProduct(authToken, ing.name)
      if (productId) {
        try {
          await addToCart(authToken, productId)
          added.push(ing.name)
        } catch {
          failed.push(ing.name)
        }
      } else {
        failed.push(ing.name)
      }
    }

    res.status(200).json({ added, failed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
