// src/components/RecipeDetail.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { subscribeToRecipe, deleteRecipe, regenerateRecipeImage } from '../firebase'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)

  useEffect(() => subscribeToRecipe(id, setRecipe), [id])

  if (!recipe) return <div className="empty-state"><p>Laden...</p></div>

  const handleDelete = async () => {
    if (window.confirm(`Recept "${recipe.title}" verwijderen?`)) {
      try {
        await deleteRecipe(id)
        navigate('/recepten')
      } catch (err) {
        console.error('Verwijderen mislukt:', err)
        alert('Verwijderen mislukt — probeer het opnieuw')
      }
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: '15px' }}>{recipe.title}</span>
        <button className="topbar-save" onClick={() => navigate(`/recepten/${id}/bewerken`)}>✏️</button>
      </div>

      <div className="detail-image-container">
        {recipe.imageStatus === 'done' && recipe.imageUrl
          ? <img src={recipe.imageUrl} alt={recipe.title} className="detail-image" />
          : recipe.imageStatus === 'error'
            ? <div className="detail-image-placeholder">🍽️</div>
            : <div className="detail-image-placeholder">
                <span>⏳</span>
                <p>AI-afbeelding wordt gegenereerd...</p>
              </div>
        }
        <button
          className="ai-badge"
          style={{ cursor: 'pointer', background: 'none', border: 'none' }}
          onClick={() => regenerateRecipeImage(recipe.id)}
        >
          {recipe.imageStatus === 'done' ? '✨ Opnieuw genereren' : '🔄 Opnieuw proberen'}
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-meta">{recipe.portions} personen · {recipe.createdBy}</div>
        {recipe.description && <p className="detail-description">{recipe.description}</p>}

        <h3>Ingrediënten</h3>
        <ul className="ingredients-list">
          {recipe.ingredients?.map((ing, i) => (
            <li key={i} className="ingredient-item">
              <span className="ing-amount-detail">{ing.amount} {ing.unit}</span>
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: '20px' }}>Bereiding</h3>
        <ol className="steps-list">
          {recipe.steps?.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <button className="btn-danger" onClick={handleDelete}>Verwijderen</button>
        </div>
      </div>
    </div>
  )
}
