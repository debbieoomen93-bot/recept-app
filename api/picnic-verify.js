const BASE_URL = 'https://storefront-prod.nl.picnicinternational.com/api/15'
const AGENT = '30100;1.228.1-15480;'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { tempToken, code } = req.body
  if (!tempToken || !code) return res.status(400).json({ error: 'Verplichte velden ontbreken' })

  try {
    const verifyRes = await fetch(`${BASE_URL}/user/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-picnic-auth': tempToken,
        'x-picnic-agent': AGENT,
        'Accept-Language': 'nl_NL',
      },
      body: JSON.stringify({ otp: code }),
    })

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}))
      return res.status(401).json({ error: err.error?.message || 'Code onjuist of verlopen' })
    }

    const authToken = verifyRes.headers.get('x-picnic-auth')
    return res.status(200).json({ authToken })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
