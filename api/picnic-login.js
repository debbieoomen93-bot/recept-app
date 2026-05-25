import crypto from 'crypto'

const BASE_URL = 'https://storefront-prod.nl.picnicinternational.com/api/15'
const AGENT = '30100;1.228.1-15480;'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Verplichte velden ontbreken' })

  try {
    const passwordHash = crypto.createHash('md5').update(password).digest('hex')
    const loginRes = await fetch(`${BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-picnic-agent': AGENT,
        'Accept-Language': 'nl_NL',
      },
      body: JSON.stringify({ key: email, secret: passwordHash, client_id: 1 }),
    })

    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => ({}))
      return res.status(401).json({ error: err.error?.message || 'Login mislukt — controleer e-mail en wachtwoord' })
    }

    const tempToken = loginRes.headers.get('x-picnic-auth')
    const loginData = await loginRes.json()

    if (loginData.second_factor_authentication_required) {
      await fetch(`${BASE_URL}/user/2fa/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-picnic-auth': tempToken,
          'x-picnic-agent': AGENT,
          'Accept-Language': 'nl_NL',
        },
        body: JSON.stringify({ channel: 'SMS' }),
      })
      return res.status(200).json({ requires2FA: true, tempToken })
    }

    return res.status(200).json({ authToken: tempToken })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
