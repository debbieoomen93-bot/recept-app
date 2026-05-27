import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRecipe } from '../firebase'

export default function RecipeSearch({ username }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [mode, setMode] = useState(null) // 'db' | 'ai'
  const [dbRecipes, setDbRecipes] = useState([])
  const [aiRecipe, setAiRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const navigate = useNavigate()

  const searchDB = async () => {
    if (!searchTerm.trim() || loading) return
    setMode('db')
    setLoading(true)
    setError(null)
    setAiRecipe(null)
    try {
      const r = await fetch('/api/search-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: searchTerm.trim() }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setDbRecipes(data.recipes || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const generateAI = async () => {
    if (!searchTerm.trim() || loading) return
    setMode('ai')
    setLoading(true)
    setError(null)
    setDbRecipes([])
    setAiRecipe(null)
    setImported(false)
    try {
      const r = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: searchTerm.trim() }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setAiRecipe(data.recipe)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') searchDB()
  }

  const handleImport = async () => {
    if (!aiRecipe || importing) return
    setImporting(true)
    try {
      await createRecipe({
        title: aiRecipe.title,
        description: '',
        portions: aiRecipe.portions || 4,
        ingredients: aiRecipe.ingredients || [],
        steps: aiRecipe.steps || [],
      }, username)
      setImported(true)
      setTimeout(() => navigate('/recepten'), 800)
    } catch (err) {
      alert('Importeren mislukt: ' + err.message)
    } finally {
      setImporting(false)
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
          <input
            type="search"
            className="search-input-full"
            placeholder="Welk gerecht zoek je?"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoCapitalize="none"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`search-mode-btn${mode === 'db' ? ' search-mode-btn--active' : ''}`}
              onClick={searchDB}
              disabled={loading || !searchTerm.trim()}
            >
              🌍 Zoeken
            </button>
            <button
              className={`search-mode-btn search-mode-btn--ai${mode === 'ai' ? ' search-mode-btn--active' : ''}`}
              onClick={generateAI}
              disabled={loading || !searchTerm.trim()}
            >
              ✨ AI genereren
            </button>
          </div>
        </div>

        {loading && (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>{mode === 'ai' ? '✨' : '🔍'}</div>
            {mode === 'ai' ? 'AI maakt jouw recept…' : 'Zoeken…'}
          </div>
        )}

        {!loading && error && (
          <div className="empty-state" style={{ color: '#c0392b' }}>⚠️ {error}</div>
        )}

        {!loading && mode === 'db' && !error && dbRecipes.length === 0 && searchTerm && (
          <div className="empty-state">
            <div style={{ marginBottom: 12 }}>Geen resultaten voor "{searchTerm}"</div>
            <button className="btn-ai-generate" onClick={generateAI} style={{ width: 'auto', display: 'inline-block', padding: '10px 20px' }}>
              ✨ Laat AI het genereren
            </button>
          </div>
        )}

        {!loading && mode === 'db' && dbRecipes.length > 0 && (
          <div className="picnic-recipe-grid">
            {dbRecipes.map(recipe => (
              <div key={recipe.id} className="picnic-recipe-card" onClick={() => navigate(`/picnic/db/${recipe.id}`)}>
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
        )}

        {!loading && mode === 'ai' && aiRecipe && (
          <div className="search-section-card">
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{aiRecipe.title}</h2>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>🍽 {aiRecipe.portions} personen</div>

            {aiRecipe.ingredients?.length > 0 && (
              <>
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 15 }}>Ingrediënten</h3>
                <ul className="ingredients-list" style={{ marginBottom: 16 }}>
                  {aiRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="ingredient-item">
                      <span className="ing-amount-detail">
                        {ing.amount && ing.amount !== 1 ? ing.amount : ''}{' '}
                        {ing.unit !== 'stuks' ? ing.unit : ''}
                      </span>
                      <span>{ing.name}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {aiRecipe.steps?.length > 0 && (
              <>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}>Bereiding</h3>
                <ol className="steps-list" style={{ marginBottom: 20 }}>
                  {aiRecipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </>
            )}

            <button className="btn-primary" onClick={handleImport} disabled={importing || imported}>
              {imported ? '✓ Geïmporteerd!' : importing ? 'Importeren…' : '+ Importeer als recept'}
            </button>
          </div>
        )}

        {!mode && !loading && (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 10 }}>🍽️</div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Zoek of genereer een recept</p>
            <p style={{ fontSize: 13, color: '#aaa' }}>Typ een gerecht en kies hoe je wilt zoeken</p>
          </div>
        )}
      </div>
    </div>
  )
}
