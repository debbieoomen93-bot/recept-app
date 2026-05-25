import PicnicClient from 'picnic-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { authToken, ingredients } = req.body
  if (!authToken || !Array.isArray(ingredients)) return res.status(400).json({ error: 'Verplichte velden ontbreken' })

  try {
    const client = new PicnicClient({ countryCode: 'NL', authKey: authToken })

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
          await client.cart.addProductToCart(productId, 1)
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
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
