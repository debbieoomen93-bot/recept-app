import PicnicClient from 'picnic-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { authToken, searchTerm } = req.body
  if (!authToken || !searchTerm) return res.status(400).json({ error: 'Verplichte velden ontbreken' })

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })
    const results = await client.catalog.search(searchTerm)

    const products = (results || []).slice(0, 8).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price_ranges?.[0]?.price != null
        ? `€${(item.price_ranges[0].price / 100).toFixed(2)}`
        : null,
      unitQuantity: item.unit_quantity || null,
    }))

    res.status(200).json({ products })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
