// api/picnic-search.js
import crypto from 'crypto'

const BASE_URL = 'https://storefront-prod.nl.picnicinternational.com/api/15'
const AGENT = '30100;1.0;17.28.0;Samsung;Android/17.28.0;nl;01'

async function picnicLogin(email, password) {
  const passwordHash = crypto.createHash('md5').update(password).digest('hex')
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-picnic-agent': AGENT },
    body: JSON.stringify({ key: email, secret: passwordHash, client_id: 1 }),
  })
  if (!res.ok) throw new Error('Picnic login mislukt — controleer e-mail en wachtwoord')
  return res.headers.get('x-picnic-auth')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, searchTerm } = req.body
  if (!email || !password || !searchTerm) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' })
  }

  try {
    const authToken = await picnicLogin(email, password)
    const searchRes = await fetch(
      `${BASE_URL}/search?search_term=${encodeURIComponent(searchTerm)}`,
      { headers: { 'x-picnic-auth': authToken, 'x-picnic-agent': AGENT } }
    )
    const data = await searchRes.json()

    return res.status(200).json({ debug: data, authToken: authToken ? 'ontvangen' : 'NULL', searchStatus: searchRes.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
