export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { dishName } = req.body
  if (!dishName?.trim()) return res.status(400).json({ error: 'dishName verplicht' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY niet ingesteld in Vercel-omgeving' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Maak een recept voor "${dishName.trim()}" in het Nederlands. Geef ALLEEN geldige JSON terug, geen tekst eromheen:
{
  "title": "naam van het gerecht",
  "portions": 4,
  "kcalPerPortion": 550,
  "ingredients": [
    { "name": "ingredientnaam", "amount": 200, "unit": "gram", "category": "Groente & fruit" }
  ],
  "steps": [
    "Verwarm de oven voor op 200°C.",
    "Snij de ui fijn en fruit deze in olijfolie."
  ]
}

Regels:
- Gebruik Nederlandse maateenheden: gram, kilogram, milliliter, liter, eetlepel, theelepel, stuks, snufje, takje, teen
- amount is altijd een getal (geen string)
- Categorieën: "Groente & fruit", "Vlees, vis & vega", "Zuivel & eieren", "Pasta, rijst & granen", "Blikken & potten", "Sauzen & kruiden", "Bakken & koken", "Dranken", "Overig"
- Geef 6-12 ingrediënten en 4-8 stappen
- kcalPerPortion is een geheel getal (integer) met een schatting van de calorieën per portie op basis van standaard voedingswaarden`
        }]
      })
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Anthropic API fout: ${response.status} — ${errBody.slice(0, 200)}`)
    }

    const aiData = await response.json()
    const text = aiData.content?.[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI gaf geen geldig JSON-recept terug')

    const recipe = JSON.parse(jsonMatch[0])
    if (!recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      throw new Error('AI-recept mist verplichte velden')
    }

    res.status(200).json({ recipe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
