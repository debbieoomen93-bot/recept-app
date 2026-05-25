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
      results = await client.catalog.getSuggestions(searchTerm)
    } catch (searchErr) {
      return res.status(500).json({ error: `Search mislukt: ${searchErr.message}` })
    }

    return res.status(200).json({ debug: results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
