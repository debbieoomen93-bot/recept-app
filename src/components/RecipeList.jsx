// src/components/RecipeList.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToRecipes } from '../firebase'
import RecipeCard from './RecipeCard'

export default function RecipeList({ username }) {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => subscribeToRecipes(setRecipes), [])

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="topbar">
        <span>🥗 Recepten</span>
        <span style={{ fontSize: '13px', opacity: 0.8 }}>{username}</span>
      </div>
      <div className="search-bar">
        <input
          type="search"
          placeholder="Zoek recept..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>{search ? 'Geen recepten gevonden' : 'Nog geen recepten — voeg er een toe!'}</p>
          </div>
        )}
        {filtered.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => navigate(`/recepten/${recipe.id}`)}
          />
        ))}
      </div>
      <button className="fab" onClick={() => navigate('/recepten/nieuw')}>+</button>
    </div>
  )
}
