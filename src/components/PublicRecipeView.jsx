import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { signInAsGuest, getRecipe } from '../firebase'

export default function PublicRecipeView() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    signInAsGuest()
      .then(() => getRecipe(id))
      .then(r => {
        if (!r) throw new Error('Recept niet gevonden')
        setRecipe(r)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f5f5f0', minHeight: '100dvh' }}>
      <div style={{ background: '#2d5a27', color: 'white', padding: '14px 16px', fontSize: 16, fontWeight: 700 }}>
        🍽 Gedeeld recept
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Laden…</div>
      ) : error ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#d32f2f' }}>⚠️ {error}</div>
      ) : (
        <div>
          {recipe.imageUrl && recipe.imageStatus === 'done' ? (
            <img src={recipe.imageUrl} alt={recipe.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#e8f5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🍽️</div>
          )}

          <div style={{ padding: '16px 16px 32px' }}>
            <h1 style={{ fontSize: 22, marginBottom: 4 }}>{recipe.title}</h1>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
              🍽 {recipe.portions} personen
              {recipe.createdBy ? ` · Door ${recipe.createdBy}` : ''}
            </p>

            {recipe.description && (
              <p style={{ fontSize: 14, color: '#444', marginBottom: 16, lineHeight: 1.5 }}>{recipe.description}</p>
            )}

            {recipe.ingredients?.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, marginBottom: 10, marginTop: 8 }}>Ingrediënten</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 14 }}>
                      <span style={{ color: '#666', minWidth: 80 }}>{ing.amount} {ing.unit}</span>
                      <span>{ing.name}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {recipe.steps?.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Bereiding</h3>
                <ol style={{ paddingLeft: 20, lineHeight: 1.7, fontSize: 14, color: '#333' }}>
                  {recipe.steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>{step}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
