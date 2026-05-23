// src/components/RecipeCard.jsx
export default function RecipeCard({ recipe, onClick }) {
  const { title, portions, createdBy, imageUrl, imageStatus } = recipe

  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-card-image">
        {imageStatus === 'done' && imageUrl
          ? <img src={imageUrl} alt={title} />
          : imageStatus === 'error'
            ? <span className="recipe-emoji">🍽️</span>
            : <span className="recipe-spinner">⏳</span>
        }
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{title}</div>
        <div className="recipe-card-meta">{portions} personen · {createdBy}</div>
      </div>
      <div className="recipe-card-arrow">›</div>
    </div>
  )
}
