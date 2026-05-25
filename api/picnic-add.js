import PicnicClient from 'picnic-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, ingredients } = req.body
  if (!email || !password || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' })
  }

  try {
    const client = new PicnicClient({ countryCode: 'NL' })
    await client.auth.login(email, password)

    const added = []
    const failed = []

    for (const ing of ingredients) {
      try {
        let productId = ing.picnicProductId
        if (!productId) {
          const results = await client.catalog.search(ing.name)
          productId = results?.[0]?.id || null
        }
        if (productId) {
          await client.cart.addProduct(productId, 1)
          added.push(ing.name)
        } else {
          failed.push(ing.name)
        }
      } catch {
        failed.push(ing.name)
      }
    }

    res.status(200).json({ added, failed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
