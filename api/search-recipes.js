export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { searchTerm } = req.body
  if (!searchTerm?.trim()) return res.status(400).json({ error: 'searchTerm verplicht' })

  try {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm.trim())}`
    const data = await fetch(url).then(r => r.json())
    const recipes = (data.meals || []).map(m => ({
      id: m.idMeal,
      name: m.strMeal,
      imageUrl: m.strMealThumb,
      category: m.strCategory,
      area: m.strArea,
    }))
    res.status(200).json({ recipes })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
