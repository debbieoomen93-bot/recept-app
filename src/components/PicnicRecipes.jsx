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
    <div className="recipe-search-page">
      <div className="search-bg-image" />

      <div className="topbar">
        <span>🔍 Recepten</span>
      </div>

      <div className="search-page-content">
        <div className="search-section-card">
          <div className="search-section-header">
            <span className="search-section-icon">🌍</span>
            <div>
              <div className="search-section-title">Recept zoeken</div>
              <div className="search-section-sub">Zoek in duizenden wereldrecepten</div>
            </div>
          </div>
          <form onSubmit={search}>
            <input
              type="search"
              className="search-input-full"
              placeholder="Bijv. spaghetti, curry, soep…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoCapitalize="none"
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading || !searchTerm.trim()}>
              {loading ? 'Zoeken…' : 'Zoeken'}
            </button>
          </form>
        </div>

        <div className="search-section-card search-ai-card">
          <div className="search-section-header">
            <span className="search-section-icon">✨</span>
            <div>
              <div className="search-section-title">AI Recept genereren</div>
              <div className="search-section-sub">Laat AI een recept in het Nederlands maken</div>
            </div>
          </div>
          <button className="btn-ai-generate" onClick={() => navigate('/picnic/ai')}>
            Genereer een recept →
          </button>
        </div>

        {error && (
          <div className="empty-state" style={{ color: '#c0392b' }}>⚠️ {error}</div>
        )}

        {loading ? (
          <div className="empty-state">Zoeken…</div>
        ) : searched && recipes.length === 0 ? (
          <div className="empty-state">
            <div style={{ marginBottom: 12 }}>Geen recepten gevonden voor "{searchTerm}"</div>
            <button type="button" className="btn-ai-generate" onClick={() => navigate('/picnic/ai')} style={{ display: 'inline-block', width: 'auto', padding: '10px 20px' }}>
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
        ) : null}
      </div>
    </div>
  )
}
