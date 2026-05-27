import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RecipeSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()

  const search = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/search-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: searchTerm.trim() }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setRecipes(data.recipes || [])
      setSearched(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="topbar">
        <span>🔍 Recepten zoeken</span>
      </div>

      <form onSubmit={search} style={{ padding: '12px 12px 0', display: 'flex', gap: 8 }}>
        <input
          type="search"
          className="recipe-search-input"
          placeholder="Zoek een gerecht…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          autoCapitalize="none"
        />
        <button type="submit" className="btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? '…' : 'Zoeken'}
        </button>
      </form>

      <div style={{ padding: '6px 12px 8px', textAlign: 'right' }}>
        <button
          type="button"
          className="btn-link"
          onClick={() => navigate('/picnic/ai')}
        >
          ✨ AI recept genereren →
        </button>
      </div>

      {error && (
        <div className="empty-state" style={{ color: '#d32f2f' }}>⚠️ {error}</div>
      )}

      {loading ? (
        <div className="empty-state">Zoeken…</div>
      ) : searched && recipes.length === 0 ? (
        <div className="empty-state">
          <div style={{ marginBottom: 12 }}>Geen recepten gevonden voor "{searchTerm}"</div>
          <button type="button" className="btn-picnic" onClick={() => navigate('/picnic/ai')}>
            ✨ Laat AI dit recept maken
          </button>
        </div>
      ) : recipes.length > 0 ? (
        <div className="picnic-recipe-grid">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="picnic-recipe-card"
              onClick={() => navigate(`/picnic/db/${recipe.id}`)}
            >
              <div className="picnic-card-img">
                {recipe.imageUrl
                  ? <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" />
                  : <span style={{ fontSize: 36 }}>🍽️</span>
                }
              </div>
              <div className="picnic-card-body">
                <div className="picnic-card-title">{recipe.name}</div>
                {recipe.category && <div className="picnic-card-sub">{recipe.category}{recipe.area ? ` · ${recipe.area}` : ''}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Zoek een recept</p>
          <p style={{ fontSize: 13, color: '#888', maxWidth: 260, margin: '0 auto 16px' }}>
            Zoek in duizenden recepten of laat AI een Nederlands recept voor je maken.
          </p>
          <button type="button" className="btn-picnic" onClick={() => navigate('/picnic/ai')}>
            ✨ AI recept genereren
          </button>
        </div>
      )}
    </div>
  )
}
