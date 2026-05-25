// src/components/RecipeForm.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRecipe, updateRecipe, subscribeToRecipe } from '../firebase'
import { CATEGORIES } from '../categories'
import IngredientNameInput from './IngredientNameInput'

const UNITS = ['g', 'kg', 'ml', 'liter', 'stuks', 'el', 'tl', 'snufje', 'naar smaak']

const emptyIngredient = () => ({ name: '', amount: 1, unit: 'stuks', category: CATEGORIES[0], picnicProductId: null, picnicProductName: null })

export default function RecipeForm({ username }) {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [portions, setPortions] = useState(4)
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [steps, setSteps] = useState([''])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    return subscribeToRecipe(id, (recipe) => {
      setTitle(recipe.title || '')
      setDescription(recipe.description || '')
      setPortions(recipe.portions || 4)
      setIngredients(recipe.ingredients?.length ? recipe.ingredients.map(i => ({ picnicProductId: null, picnicProductName: null, ...i })) : [emptyIngredient()])
      setSteps(recipe.steps?.length ? recipe.steps : [''])
    })
  }, [id, isEditing])

  const updateIngredient = (index, field, value) => {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing))
  }

  const addIngredient = () => setIngredients(prev => [...prev, emptyIngredient()])
  const removeIngredient = (index) => setIngredients(prev => prev.filter((_, i) => i !== index))
  const setPicnicProduct = (index, productId, productName) => {
    setIngredients(prev => prev.map((ing, i) => i === index
      ? { ...ing, picnicProductId: productId, picnicProductName: productName }
      : ing))
  }

  const updateStep = (index, value) => setSteps(prev => prev.map((s, i) => i === index ? value : s))
  const addStep = () => setSteps(prev => [...prev, ''])
  const removeStep = (index) => setSteps(prev => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        portions: Number(portions),
        ingredients: ingredients.filter(i => i.name.trim()).map(i => ({
          ...i, amount: Number(i.amount) || 0
        })),
        steps: steps.filter(s => s.trim()),
      }
      if (isEditing) {
        await updateRecipe(id, data)
      } else {
        await createRecipe(data, username)
      }
      navigate('/recepten')
    } catch (err) {
      console.error('Opslaan mislukt:', err)
      alert('Opslaan mislukt — probeer het opnieuw')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate(-1)}>←</button>
        <span>{isEditing ? 'Recept bewerken' : 'Nieuw recept'}</span>
        <button
          className="topbar-save"
          onClick={handleSave}
          disabled={saving || !title.trim()}
        >
          {saving ? '...' : 'Opslaan'}
        </button>
      </div>

      <div className="form-body">
        <div className="form-group">
          <label>Naam recept *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="bijv. Spaghetti carbonara" />
        </div>

        <div className="form-group">
          <label>Omschrijving (voor AI-afbeelding)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="bijv. Romige pasta met ei en pancetta" rows={2} />
        </div>

        <div className="form-group">
          <label>Aantal porties</label>
          <input type="number" value={portions} onChange={e => setPortions(e.target.value)} min={1} max={20} style={{ width: '80px' }} />
        </div>

        <div className="form-section">
          <h3>Ingrediënten</h3>
          {ingredients.map((ing, i) => (
            <div key={i} className="ingredient-block">
              <div className="ingredient-row">
                <IngredientNameInput
                  value={ing.name}
                  onChange={val => updateIngredient(i, 'name', val)}
                  picnicProductId={ing.picnicProductId}
                  picnicProductName={ing.picnicProductName}
                  onProductSelect={(productId, productName) => setPicnicProduct(i, productId, productName)}
                  onCategoryDetect={cat => updateIngredient(i, 'category', cat)}
                />
                <input
                  type="number"
                  placeholder="Hoev."
                  value={ing.amount}
                  onChange={e => updateIngredient(i, 'amount', e.target.value)}
                  className="ing-amount"
                />
                <select value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} className="ing-unit">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <select value={ing.category} onChange={e => updateIngredient(i, 'category', e.target.value)} className="ing-cat">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                {ingredients.length > 1 && (
                  <button className="btn-remove" onClick={() => removeIngredient(i)}>×</button>
                )}
              </div>
            </div>
          ))}
          <button className="btn-add" onClick={addIngredient}>+ Ingrediënt toevoegen</button>
        </div>

        <div className="form-section">
          <h3>Bereidingsstappen</h3>
          {steps.map((step, i) => (
            <div key={i} className="step-row">
              <span className="step-number">{i + 1}</span>
              <textarea
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                placeholder={`Stap ${i + 1}...`}
                rows={2}
              />
              {steps.length > 1 && (
                <button className="btn-remove" onClick={() => removeStep(i)}>×</button>
              )}
            </div>
          ))}
          <button className="btn-add" onClick={addStep}>+ Stap toevoegen</button>
        </div>
      </div>

    </div>
  )
}
