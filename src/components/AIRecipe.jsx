import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createRecipe } from '../firebase'

export default function AIRecipe({ username }) {
  const location = useLocation()
  const [dishName, setDishName] = useState(location.state?.dishName || '')
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const navigate = useNavigate()

  const handleShare = async () => {
    if (!recipe) return
    const text = `🍽 ${recipe.title}\n\n👥 ${recipe.portions} personen\n\n📋 Ingrediënten:\n${recipe.ingredients.map(i => `• ${i.amount} ${i.unit} ${i.name}`).join('\n')}\n\n👨‍🍳 Bereiding:\n${recipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text })
      } else {
        await navigator.clipboard.writeText(text)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2500)
      }
    } catch (_) {}
  }

  const generate = async (e) => {
    e.preventDefault()
    if (!dishName.trim()) return
    setLoading(true)
    setError(null)
    setRecipe(null)
    setImported(false)
    try {
      const r = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: dishName.trim() }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setRecipe(data.recipe)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!recipe || importing) return
    setImporting(true)
    try {
      await createRecipe({
        title: recipe.title,
        description: '',
        portions: recipe.portions || 4,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
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
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate(-1)}>←</button>
        <span>✨ AI Recept</span>
        <button className="topbar-save" onClick={handleShare} disabled={!recipe} title="Delen">📤</button>
      </div>

      <div className="detail-body" style={{ paddingTop: 16 }}>
        <form onSubmit={generate} style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Welk gerecht wil je maken?
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="recipe-search-input"
              placeholder="bijv. spaghetti carbonara"
              value={dishName}
              onChange={e => setDishName(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading || !dishName.trim()} style={{ flexShrink: 0 }}>
              {loading ? '…' : 'Genereer'}
            </button>
          </div>
        </form>

        {shareToast && <div className="share-toast">Gekopieerd naar klembord!</div>}

        {loading && (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
            AI maakt jouw recept…
          </div>
        )}

        {error && (
          <div style={{ color: '#d32f2f', marginBottom: 16, fontSize: 14 }}>⚠️ {error}</div>
        )}

        {recipe && (
          <div>
            <h2 style={{ margin: '0 0 4px' }}>{recipe.title}</h2>
            <div className="detail-meta" style={{ marginBottom: 16 }}>
              <span>🍽 {recipe.portions} personen</span>
            </div>

            {recipe.ingredients?.length > 0 && (
              <>
                <h3 style={{ marginTop: 0 }}>Ingrediënten</h3>
                <ul className="ingredients-list" style={{ marginBottom: 20 }}>
                  {recipe.ingredients.map((ing, i) => (
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

            {recipe.steps?.length > 0 && (
              <>
                <h3>Bereiding</h3>
                <ol className="steps-list" style={{ marginBottom: 24 }}>
                  {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </>
            )}

            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={importing || imported}
              style={{ width: '100%' }}
            >
              {imported ? '✓ Geïmporteerd!' : importing ? 'Importeren…' : '+ Importeer als recept'}
            </button>
          </div>
        )}

        {!recipe && !loading && !error && (
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 }}>
            Voer een gerechtnaam in en AI genereert een volledig recept in het Nederlands — met ingrediënten, hoeveelheden en bereidingsstappen.
          </p>
        )}
      </div>
    </div>
  )
}
