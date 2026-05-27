import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRecipe } from '../firebase'

export default function PicnicRecipeDetail({ username }) {
  const { recipeId } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const navigate = useNavigate()

  const authToken = localStorage.getItem('picnic-auth-token')

  useEffect(() => {
    if (!authToken) { setLoading(false); return }
    setLoading(true)
    fetch('/api/picnic-recipe-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authToken, recipeId: decodeURIComponent(recipeId) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.tokenExpired) localStorage.removeItem('picnic-auth-token')
        if (data.error) throw new Error(data.error)
        setRecipe(data.recipe)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [recipeId, authToken])

  const handleImport = async () => {
    if (!recipe || importing) return
    setImporting(true)
    try {
      await createRecipe({
        title: recipe.name,
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {recipe?.name || 'Recept'}
        </span>
        <span style={{ width: 40 }} />
      </div>

      {loading ? (
        <div className="empty-state">Recept laden…</div>
      ) : error ? (
        <div className="empty-state" style={{ color: '#d32f2f' }}>⚠️ {error}</div>
      ) : !recipe ? (
        <div className="empty-state">Recept niet gevonden</div>
      ) : (
        <div>
          {recipe.imageUrl ? (
            <img className="detail-image" src={recipe.imageUrl} alt={recipe.name} />
          ) : (
            <div className="detail-image-placeholder"><span>🍽️</span></div>
          )}

          <div className="detail-body">
            <div className="detail-meta">
              {recipe.prepTime && <span>⏱ {recipe.prepTime} min &nbsp;</span>}
              <span>🍽 {recipe.portions} personen</span>
            </div>

            {recipe.ingredients?.length > 0 && (
              <>
                <h3 style={{ marginTop: 16 }}>Ingrediënten</h3>
                <ul className="ingredients-list" style={{ marginBottom: 20 }}>
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="ingredient-item">
                      <span className="ing-amount-detail">
                        {ing.amount && ing.amount !== 1 ? ing.amount : ''} {ing.unit !== 'stuks' ? ing.unit : ''}
                      </span>
                      <span>
                        {ing.name}
                        {ing.picnicProductId && (
                          <span style={{ fontSize: 11, color: 'var(--picnic)', marginLeft: 6 }}>🚲</span>
                        )}
                      </span>
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
              className="btn-picnic"
              onClick={handleImport}
              disabled={importing || imported}
              style={{ marginTop: 8 }}
            >
              {imported ? '✓ Geïmporteerd!' : importing ? 'Importeren…' : '+ Importeer als recept'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
