// src/components/DayPicker.jsx
import { useState, useEffect } from 'react'
import { subscribeToRecipes } from '../firebase'

export default function DayPicker({ dayName, currentRecipeId, onSelect, onClose }) {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const [spans2Days, setSpans2Days] = useState(false)

  useEffect(() => subscribeToRecipes(setRecipes), [])

  const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>Recept kiezen voor {dayName}</span>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-search">
          <input
            type="search"
            placeholder="Zoek recept..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-list">
          <div className="modal-item modal-item-clear" onClick={() => onSelect(null, false)}>
            🗑️ Dag leeg maken
          </div>
          {filtered.map(recipe => (
            <div
              key={recipe.id}
              className={`modal-item ${recipe.id === currentRecipeId ? 'selected' : ''}`}
              onClick={() => onSelect(recipe.id, spans2Days)}
            >
              <span>{recipe.title}</span>
              <span className="modal-item-meta">{recipe.portions} pers.</span>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <label className="spans-toggle">
            <input
              type="checkbox"
              checked={spans2Days}
              onChange={e => setSpans2Days(e.target.checked)}
            />
            Dit recept is ook voor de volgende dag
          </label>
        </div>
      </div>
    </div>
  )
}
