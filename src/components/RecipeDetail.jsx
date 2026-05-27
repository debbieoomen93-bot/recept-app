// src/components/RecipeDetail.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { subscribeToRecipe, deleteRecipe, regenerateRecipeImage } from '../firebase'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [regenerating, setRegenerating] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  useEffect(() => subscribeToRecipe(id, setRecipe), [id])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await regenerateRecipeImage(recipe.id)
    } catch (err) {
      alert('Opnieuw genereren mislukt — probeer het nogmaals')
    } finally {
      setRegenerating(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/recept/${id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url, text: `Bekijk dit recept: ${recipe.title}` })
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2500)
      }
    } catch (_) {}
  }

  if (!recipe) return <div className="empty-state"><p>Laden...</p></div>

  const handleDelete = async () => {
    if (window.confirm(`Recept "${recipe.title}" verwijderen?`)) {
      try {
        await deleteRecipe(id)
        navigate('/recepten')
      } catch (err) {
        alert('Verwijderen mislukt — probeer het opnieuw')
      }
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: '15px' }}>{recipe.title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="topbar-save" onClick={handleShare} title="Delen">📤</button>
          <button className="topbar-save" onClick={() => navigate(`/recepten/${id}/bewerken`)}>✏️</button>
        </div>
      </div>

      {shareToast && (
        <div className="share-toast">Link gekopieerd!</div>
      )}

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
          className="ai-badge ai-badge-btn"
          onClick={handleRegenerate}
          disabled={regenerating || recipe.imageStatus === 'pending'}
        >
          {regenerating || recipe.imageStatus === 'pending' ? '⏳ Bezig...' : recipe.imageStatus === 'done' ? '✨ Opnieuw genereren' : '🔄 Opnieuw proberen'}
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
