import PicnicClient from 'picnic-api'

const CATEGORY_RULES = [
  ['Groente & fruit', ['appel', 'peer', 'banaan', 'tomaat', ' ui', 'knoflook', 'wortel', 'aardappel', 'sla', 'spinazie', 'broccoli', 'bloemkool', 'paprika', 'champignon', 'courgette', 'komkommer', 'citroen', 'limoen', 'avocado', 'mango', 'aardbei', 'druif', 'sinaasappel', 'groente', 'fruit', 'prei', 'venkel', 'radijs', 'asperge', 'sperzieboon', 'erwt', 'bospeen', 'bieslook', 'peterselie', 'gember']],
  ['Vlees, vis & vega', ['kip', 'rund', 'varken', 'lam', 'zalm', 'tonijn', 'garnaal', 'mossel', 'tofu', 'tempeh', 'vlees', 'gehakt', 'worst', 'bacon', 'ham', 'kalkoen', 'biefstuk', 'ossenhaas', 'shoarma', 'filet', 'haring', 'makreel', 'forel', 'inktvis', 'seitan']],
  ['Zuivel & eieren', ['melk', 'kaas', 'yoghurt', 'room', 'boter', 'eieren', 'kwark', 'mascarpone', 'mozzarella', 'cheddar', 'parmezaan', 'feta', 'vla', 'slagroom', 'crème fraîche', 'ricotta', 'camembert', 'brie', 'gouda', 'amandel drink', 'haver drink', 'soja drink', 'rijst drink', 'kokos drink', 'oat drink']],
  ['Pasta, rijst & granen', ['pasta', 'spaghetti', 'penne', 'rijst', 'quinoa', 'couscous', 'meel', 'havermout', 'noodle', 'lasagne', 'macaroni', 'bulgur', 'linzen', 'kikkererwt', 'tagliatelle', 'fusilli', 'orzo']],
  ['Blikken & potten', ['tomatenpuree', 'passata', 'kokosmelk', 'blik', 'conserven', 'mais', 'kidneyboon', 'witte boon', 'bruine boon']],
  ['Sauzen & kruiden', ['zout', 'peper', 'oregano', 'basilicum', 'tijm', 'rozemarijn', 'koriander', 'komijn', 'kaneel', 'curry', 'mosterd', 'azijn', 'mayonaise', 'ketchup', 'sambal', 'ketjap', 'sojasaus', 'tabasco', 'worcestershire', 'kruid', 'specerij']],
  ['Bakken & koken', ['olijfolie', 'zonnebloemolie', 'bloem', 'suiker', 'bakpoeder', 'vanille', 'cacao', 'honing', 'stroop', 'maizena', 'gist', 'amandelschaafsel', 'kokos', 'rozijn', 'noot', 'amandel', 'walnoot']],
  ['Dranken', ['water', 'vruchtensap', 'cola', 'bier', 'wijn', 'koffie', 'thee', 'limonade', 'bouillon', 'tomatensap']],
]

function detectCategory(name) {
  const lower = name.toLowerCase()
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some(kw => lower.includes(kw))) return category
  }
  return 'Overig'
}

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
      imageUrl: item.image_id
        ? `https://storefront-prod.nl.picnicinternational.com/static/images/${item.image_id}/small.png`
        : null,
      category: detectCategory(item.name),
    }))

    res.status(200).json({ products })
  } catch (err) {
    const tokenExpired = /403|401|Unauthorized|Forbidden/i.test(err.message)
    res.status(tokenExpired ? 401 : 500).json({ error: err.message, tokenExpired })
  }
}
