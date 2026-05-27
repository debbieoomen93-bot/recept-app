// Shared server-side utility for kcal estimation
// kcal per 100g (or 100ml for liquids, treated as ~100g)

const KCAL_TABLE = {
  // --- Meat & Fish (EN + NL) ---
  'chicken': 165, 'kip': 165, 'kipfilet': 165, 'kippendij': 215,
  'beef': 250, 'rund': 250, 'rundvlees': 250,
  'mince': 254, 'gehakt': 254, 'rundergehakt': 254, 'varkensgehakt': 263,
  'pork': 242, 'varken': 242, 'varkensvlees': 242,
  'lamb': 294, 'lam': 294, 'lamsvlees': 294,
  'salmon': 208, 'zalm': 208,
  'tuna': 132, 'tonijn': 132,
  'shrimp': 85, 'garnaal': 85, 'garnalen': 85,
  'prawn': 85,
  'bacon': 417, 'spek': 417,
  'ham': 145,
  'sausage': 301, 'worst': 301,
  'turkey': 135, 'kalkoen': 135,
  'duck': 337, 'eend': 337,
  'cod': 82, 'kabeljauw': 82,
  'haddock': 87,
  'mackerel': 205, 'makreel': 205,
  'sardine': 208,
  'anchovy': 131, 'ansjovis': 131,
  'fish': 100, 'vis': 100,
  'tofu': 76,
  'tempeh': 193,

  // --- Dairy & Eggs (EN + NL) ---
  'milk': 61, 'melk': 61, 'halfvolle melk': 46, 'volle melk': 61,
  'cheese': 402, 'kaas': 402,
  'butter': 717, 'boter': 717,
  'cream': 337, 'room': 337, 'slagroom': 337, 'kookroom': 185,
  'sour cream': 198, 'zure room': 198,
  'creme fraiche': 257, 'crème fraîche': 257,
  'mascarpone': 429,
  'egg': 155, 'ei': 155, 'eieren': 155,
  'parmesan': 431, 'parmezaan': 431,
  'mozzarella': 280,
  'cheddar': 403,
  'feta': 264,
  'ricotta': 174,
  'brie': 334,
  'gouda': 356,
  'yogurt': 59, 'yoghurt': 59, 'yogurt naturel': 59,
  'kwark': 67,
  'cream cheese': 342, 'roomkaas': 342,

  // --- Vegetables (EN + NL) ---
  'tomato': 18, 'tomaat': 18, 'tomaten': 18,
  'onion': 40, 'ui': 40, 'uien': 40,
  'garlic': 149, 'knoflook': 149,
  'carrot': 41, 'wortel': 41, 'wortels': 41, 'worteltjes': 41,
  'potato': 77, 'aardappel': 77, 'aardappelen': 77, 'aardappels': 77,
  'spinach': 23, 'spinazie': 23,
  'pepper': 20, 'paprika': 20, 'rode paprika': 20, 'groene paprika': 20,
  'mushroom': 22, 'champignon': 22, 'champignons': 22, 'paddestoel': 22,
  'zucchini': 17, 'courgette': 17,
  'broccoli': 34,
  'cabbage': 25, 'kool': 25, 'wittekool': 25, 'rodekool': 31,
  'celery': 16, 'selderij': 16,
  'leek': 61, 'prei': 61,
  'cucumber': 15, 'komkommer': 15,
  'lettuce': 15, 'sla': 15, 'ijsbergsla': 14,
  'aubergine': 25, 'eggplant': 25,
  'avocado': 160,
  'ginger': 80, 'gember': 80,
  'chilli': 40, 'chili': 40, 'chilipeper': 40,
  'corn': 96, 'mais': 96,
  'pumpkin': 26, 'pompoen': 26,
  'beetroot': 43, 'biet': 43, 'rode biet': 43,
  'cauliflower': 25, 'bloemkool': 25,
  'asparagus': 20, 'asperge': 20, 'asperges': 20,
  'spring onion': 32, 'bosui': 32, 'bieslook': 30,
  'bean': 31, 'bonen': 31, 'sperziebonen': 31, 'prinsessenbonen': 31,
  'pea': 81, 'erwt': 81, 'erwten': 81,
  'kale': 49, 'boerenkool': 49,
  'radish': 16, 'radijs': 16,
  'sweet potato': 86, 'zoete aardappel': 86,

  // --- Pasta, Grains & Bread (EN + NL, dry weight) ---
  'pasta': 371, 'spaghetti': 371, 'penne': 371, 'tagliatelle': 371,
  'macaroni': 371, 'fusilli': 371, 'farfalle': 371,
  'lasagne': 371, 'lasagna': 371,
  'rice': 370, 'rijst': 370, 'witte rijst': 370, 'zilvervliesrijst': 362,
  'flour': 364, 'bloem': 364, 'tarwebloem': 364, 'zelfrijzend bakmeel': 352,
  'bread': 265, 'brood': 265, 'witbrood': 265, 'volkorenbrood': 247,
  'breadcrumb': 395, 'paneermeel': 395, 'broodkruimels': 395,
  'couscous': 376,
  'noodle': 138, 'noedel': 138, 'noedels': 138, 'rijstnoedels': 364,
  'oat': 389, 'haver': 389, 'havermout': 389,
  'bulgur': 342,
  'quinoa': 368,
  'barley': 354, 'gerst': 354,
  'cornstarch': 381, 'maizena': 381, 'zetmeel': 381,
  'tortilla': 312,

  // --- Oils & Fats ---
  'olive oil': 884, 'olijfolie': 884,
  'oil': 884, 'olie': 884, 'zonnebloemolie': 884, 'koolzaadolie': 884,
  'coconut oil': 862, 'kokosolie': 862,
  'vegetable oil': 884, 'plantaardige olie': 884,
  'sesame oil': 884, 'sesamolie': 884,
  'lard': 902, 'reuzel': 902,

  // --- Legumes ---
  'kidney bean': 127, 'kidneyboon': 127, 'kidneybonen': 127,
  'chickpea': 164, 'kikkererwt': 164, 'kikkererwten': 164,
  'lentil': 116, 'linze': 116, 'linzen': 116,
  'black bean': 132, 'zwarte boon': 132, 'zwarte bonen': 132,
  'white bean': 139, 'witte boon': 139, 'witte bonen': 139,
  'soy bean': 173, 'sojaboon': 173,

  // --- Sauces, Condiments & Liquids ---
  'tomato paste': 82, 'tomatenpuree': 82,
  'passata': 32, 'gezeefde tomaten': 32,
  'coconut milk': 197, 'kokosmelk': 197,
  'soy sauce': 53, 'sojasaus': 53,
  'fish sauce': 35, 'vissaus': 35,
  'oyster sauce': 87, 'oestersaus': 87,
  'worcestershire': 78,
  'hot sauce': 35,
  'mustard': 66, 'mosterd': 66,
  'vinegar': 21, 'azijn': 21, 'wijnazijn': 21, 'balsamico': 88,
  'ketchup': 101,
  'mayonnaise': 680, 'mayo': 680,
  'wine': 83, 'wijn': 83, 'rode wijn': 85, 'witte wijn': 82,
  'stock': 5, 'bouillon': 5, 'fond': 12,
  'broth': 5,
  'beer': 43, 'bier': 43,
  'cream of coconut': 330,
  'tomato sauce': 29, 'tomatensaus': 29,
  'pasta sauce': 62,

  // --- Baking ---
  'sugar': 387, 'suiker': 387, 'rietsuiker': 387, 'bruine suiker': 380,
  'honey': 304, 'honing': 304,
  'baking powder': 0, 'bakpoeder': 0,
  'baking soda': 0, 'natron': 0,
  'cocoa': 228, 'cacao': 228, 'cacaopoeder': 228,
  'vanilla': 288, 'vanille': 288,
  'yeast': 325, 'gist': 325,
  'almond': 579, 'amandel': 579, 'amandelen': 579,
  'walnut': 654, 'walnoot': 654, 'walnoten': 654,
  'peanut': 567, 'pindakaas': 588, 'pinda': 567,
  'nut': 600, 'noot': 600, 'noten': 600,
  'raisin': 299, 'rozijn': 299, 'rozijnen': 299,
  'coconut': 354, 'kokos': 354, 'geraspte kokos': 354,
  'sesame': 573, 'sesam': 573, 'sesamzaad': 573,
  'syrup': 260, 'siroop': 260, 'stroop': 260,
  'dark chocolate': 546, 'pure chocolade': 546, 'chocolade': 546,
  'milk chocolate': 535, 'melkchocolade': 535,
  'condensed milk': 321, 'gecondenseerde melk': 321,

  // --- Spices (mostly 0 or negligible) ---
  'salt': 0, 'zout': 0,
  'black pepper': 251, 'zwarte peper': 251, 'peper': 251,
  'oregano': 265,
  'basil': 23, 'basilicum': 23,
  'thyme': 101, 'tijm': 101,
  'rosemary': 131, 'rozemarijn': 131,
  'cumin': 375, 'komijn': 375,
  'cinnamon': 261, 'kaneel': 261,
  'turmeric': 312, 'kurkuma': 312,
  'paprika powder': 282, 'paprikapoeder': 282,
  'cayenne': 318,
  'cardamom': 311, 'kardemom': 311,
  'clove': 274, 'kruidnagel': 274,
  'nutmeg': 525, 'nootmuskaat': 525,
  'bay leaf': 313, 'laurier': 313,
  'sage': 315, 'salie': 315,
  'dill': 43, 'dille': 43,
  'mint': 70, 'munt': 70,
  'parsley': 36, 'peterselie': 36,
  'coriander': 23, 'koriander': 23,
  'chives': 30,
  'stock cube': 323, 'bouillonblokje': 323,
}

// Per-piece weights in grams for 'stuks' unit
const PIECE_WEIGHTS = {
  'egg': 60, 'ei': 60, 'eieren': 60,
  'onion': 110, 'ui': 110, 'uien': 110,
  'tomato': 120, 'tomaat': 120, 'tomaten': 120,
  'carrot': 80, 'wortel': 80, 'wortels': 80,
  'potato': 150, 'aardappel': 150, 'aardappelen': 150, 'aardappels': 150,
  'pepper': 150, 'paprika': 150,
  'lemon': 90, 'citroen': 90,
  'lime': 60, 'limoen': 60,
  'orange': 130, 'sinaasappel': 130,
  'apple': 180, 'appel': 180,
  'avocado': 200, 'avocado': 200,
  'chicken breast': 200, 'kipfilet': 200,
  'chicken thigh': 150, 'kippendij': 150,
  'banana': 120, 'banaan': 120,
  'zucchini': 200, 'courgette': 200,
  'mushroom': 20, 'champignon': 20, 'champignons': 20,
  'garlic': 5, 'knoflook': 5,
  'stock cube': 11, 'bouillonblokje': 11,
  'sausage': 80, 'worst': 80,
  'tomato paste': 20, // small can assumed as stuks edge case
}

// Unit to grams conversion (approximate)
const UNIT_TO_GRAMS = {
  'gram': 1,
  'g': 1,
  'kilogram': 1000,
  'kg': 1000,
  'milliliter': 1,
  'ml': 1,
  'liter': 1000,
  'l': 1000,
  'eetlepel': 15,
  'el': 15,
  'tablespoon': 15,
  'theelepel': 5,
  'tl': 5,
  'teaspoon': 5,
  'kop': 240,
  'cup': 240,
  'teen': 5,        // garlic clove ~5g
  'handvol': 30,
  'handful': 30,
  'plak': 30,
  'plakken': 30,
  'slice': 30,
  'snufje': 1,
  'pinch': 1,
  'takje': 2,       // sprig
  'naar smaak': 0,
  'to taste': 0,
  'as needed': 0,
}

/**
 * Look up kcal per 100g for an ingredient name.
 * Tries exact match first, then partial matches (longest match wins).
 * @param {string} name
 * @returns {number|null}
 */
function lookupKcal(name) {
  const lower = name.toLowerCase().trim()

  // Exact match
  if (lower in KCAL_TABLE) return KCAL_TABLE[lower]

  // Partial match — find all keys that appear in the name, pick longest
  let best = null
  let bestLen = 0
  for (const key of Object.keys(KCAL_TABLE)) {
    if (lower.includes(key) && key.length > bestLen) {
      best = KCAL_TABLE[key]
      bestLen = key.length
    }
  }
  if (best !== null) return best

  // Also check if name appears in a key (e.g. "zalm" in "zalm met citroen")
  for (const key of Object.keys(KCAL_TABLE)) {
    if (key.includes(lower) && lower.length > 2) {
      return KCAL_TABLE[key]
    }
  }

  return null
}

/**
 * Get per-piece weight for an ingredient.
 * @param {string} name
 * @returns {number} grams, defaults to 100g if unknown
 */
function getPieceWeight(name) {
  const lower = name.toLowerCase().trim()
  if (lower in PIECE_WEIGHTS) return PIECE_WEIGHTS[lower]
  for (const key of Object.keys(PIECE_WEIGHTS)) {
    if (lower.includes(key) || key.includes(lower)) return PIECE_WEIGHTS[key]
  }
  return 100 // fallback: assume 100g per piece
}

/**
 * Convert an ingredient's amount+unit to grams.
 * @param {number} amount
 * @param {string} unit
 * @param {string} name - needed for 'stuks' lookup
 * @returns {number}
 */
function toGrams(amount, unit, name) {
  const u = (unit || '').toLowerCase().trim()

  if (u === 'stuks' || u === 'piece' || u === 'pieces' || u === 'stuk') {
    return amount * getPieceWeight(name)
  }

  if (u in UNIT_TO_GRAMS) {
    return amount * UNIT_TO_GRAMS[u]
  }

  // Try partial unit match
  for (const key of Object.keys(UNIT_TO_GRAMS)) {
    if (u.includes(key) || key.includes(u)) {
      return amount * UNIT_TO_GRAMS[key]
    }
  }

  // Unknown unit — assume grams
  return amount
}

/**
 * Calculate total kcal and kcal per portion for a recipe.
 *
 * @param {Array<{name: string, amount: number, unit: string}>} ingredients
 * @param {number} portions
 * @returns {{ totalKcal: number, kcalPerPortion: number } | null}
 *   Returns null if fewer than 30% of ingredients can be matched.
 */
export function calculateKcal(ingredients, portions) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return null
  const p = Math.max(1, portions || 4)

  let totalKcal = 0
  let matched = 0

  for (const ing of ingredients) {
    const { name, amount, unit } = ing
    if (!name) continue

    const kcalPer100g = lookupKcal(name)
    if (kcalPer100g === null) continue

    const grams = toGrams(amount || 0, unit || 'gram', name)

    // Skip 0-kcal spices/seasonings for the match count but still count them
    matched++
    totalKcal += (kcalPer100g * grams) / 100
  }

  const matchRatio = matched / ingredients.length
  if (matchRatio < 0.3) return null

  const totalRounded = Math.round(totalKcal)
  const perPortion = Math.round(totalKcal / p)

  return { totalKcal: totalRounded, kcalPerPortion: perPortion }
}
