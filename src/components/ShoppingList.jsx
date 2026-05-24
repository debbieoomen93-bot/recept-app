// src/components/ShoppingList.jsx
import { useState, useEffect } from 'react'
import { subscribeToWeekPlanning, subscribeToRecipes } from '../firebase'
import { getWeekId, getWeekDays } from '../weekUtils'
import { aggregateIngredients } from '../shoppingList'
import PicnicModal from './PicnicModal'

export default function ShoppingList() {
  const [weekId] = useState(() => getWeekId())
  const [planning, setPlanning] = useState({ days: {} })
  const [recipes, setRecipes] = useState([])
  const [checked, setChecked] = useState({})
  const [showPicnic, setShowPicnic] = useState(false)

  useEffect(() => subscribeToWeekPlanning(weekId, setPlanning), [weekId])
  useEffect(() => subscribeToRecipes(setRecipes), [])

  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))
  const days = getWeekDays()

  const activeRecipeIds = [...new Set(
    days.flatMap((day, i) => {
      const d = planning.days[day] || {}
      if (d.recipeId) return [d.recipeId]
      if (i > 0) {
        const prev = planning.days[days[i - 1]] || {}
        if (prev.spans2Days && prev.recipeId) return [prev.recipeId]
      }
      return []
    })
  )]

  const activeRecipes = activeRecipeIds.map(id => recipeMap[id]).filter(Boolean)
  const grouped = aggregateIngredients(activeRecipes)
  const categories = Object.keys(grouped).sort()

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  const itemKey = (cat, name, unit) => `${cat}|${name}|${unit}`

  const allIngredients = categories.flatMap(cat =>
    grouped[cat].map(ing => ({ ...ing, category: cat }))
  )

  if (activeRecipes.length === 0) {
    return (
      <div>
        <div className="topbar"><span>🛒 Boodschappen</span></div>
        <div className="empty-state"><p>Nog geen recepten gepland voor deze week</p></div>
      </div>
    )
  }

  return (
    <div>
      <div className="topbar">
        <span>🛒 Boodschappen</span>
        <span style={{ fontSize: '13px', opacity: 0.8 }}>Week {weekId.split('-')[1]}</span>
      </div>

      <div className="shopping-summary">
        {activeRecipes.length} recepten · {allIngredients.length} ingrediënten
      </div>

      <div>
        {categories.map(cat => (
          <div key={cat}>
            <div className="category-label">{cat}</div>
            {grouped[cat].map((ing, i) => {
              const key = itemKey(cat, ing.name, ing.unit)
              return (
                <div key={i} className="shopping-item" onClick={() => toggleCheck(key)}>
                  <div className={`check-circle ${checked[key] ? 'checked' : ''}`}>
                    {checked[key] && '✓'}
                  </div>
                  <span className={`shopping-item-name ${checked[key] ? 'crossed' : ''}`}>{ing.name}</span>
                  <span className="shopping-item-amount">{ing.amount} {ing.unit}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <button className="btn-picnic" onClick={() => setShowPicnic(true)}>
          🚲 Verstuur naar Picnic
        </button>
      </div>

      {showPicnic && (
        <PicnicModal
          ingredients={allIngredients}
          onClose={() => setShowPicnic(false)}
        />
      )}
    </div>
  )
}
