import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PicnicRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const navigate = useNavigate()

  const authToken = localStorage.getItem('picnic-auth-token')

  useEffect(() => {
    if (!authToken) return
    setLoading(true)
    setError(null)
    fetch('/api/picnic-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authToken }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.tokenExpired) localStorage.removeItem('picnic-auth-token')
        if (data.error) throw new Error(data.error)
        setRecipes(data.recipes || [])
        if (data._debug) { console.warn('[PicnicRecipes] debug:', data._debug); setDebugInfo(data._debug) }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [authToken])

  return (
    <div>
      <div className="topbar">
        <span>🚲 Picnic Recepten</span>
      </div>

      {!authToken ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚲</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Verbind met Picnic</p>
          <p style={{ fontSize: 13, color: '#888', maxWidth: 260, margin: '0 auto' }}>
            Zoek een ingrediënt in een recept om in te loggen bij Picnic — dan verschijnen hier de Picnic-recepten.
          </p>
        </div>
      ) : loading ? (
        <div className="empty-state">Recepten laden…</div>
      ) : error ? (
        <div className="empty-state" style={{ color: '#d32f2f' }}>
          <div style={{ marginBottom: 8 }}>⚠️ {error}</div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div>Geen recepten gevonden</div>
          {debugInfo && (
            <details style={{ marginTop: 12, fontSize: 11, textAlign: 'left', maxWidth: 320 }}>
              <summary style={{ cursor: 'pointer', color: '#888' }}>Debug info</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#555', marginTop: 8 }}>{debugInfo}</pre>
            </details>
          )}
        </div>
      ) : (
        <div className="picnic-recipe-grid">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="picnic-recipe-card"
              onClick={() => navigate(`/picnic/${encodeURIComponent(recipe.id)}`)}
            >
              <div className="picnic-card-img">
                {recipe.imageUrl
                  ? <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" />
                  : <span style={{ fontSize: 36 }}>🍽️</span>
                }
              </div>
              <div className="picnic-card-body">
                <div className="picnic-card-title">{recipe.name}</div>
                {recipe.subHeader && <div className="picnic-card-sub">{recipe.subHeader}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
