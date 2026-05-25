import PicnicClient from 'picnic-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, searchTerm } = req.body
  if (!email || !password || !searchTerm) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' })
  }

  try {
    const client = new PicnicClient({ countryCode: 'NL' })
    try {
      await client.auth.login(email, password)
    } catch (loginErr) {
      return res.status(500).json({ error: `Login mislukt: ${loginErr.message}` })
    }

    let results
    try {
      results = await client.catalog.search(searchTerm)
    } catch (searchErr) {
      return res.status(500).json({ error: `Search mislukt: ${searchErr.message}` })
    }

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
    res.status(500).json({ error: err.message })
  }
}
