// src/components/PicnicProductPicker.jsx
import { useState } from 'react'

export default function PicnicProductPicker({ ingredientName, currentProductId, currentProductName, onSelect, onClose }) {
  const [email, setEmail] = useState(() => localStorage.getItem('picnic-email') || '')
  const [password, setPassword] = useState(() => localStorage.getItem('picnic-password') || '')
  const [searchTerm, setSearchTerm] = useState(ingredientName)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const credentialsReady = email.trim() && password.trim()

  const handleSearch = async () => {
    if (!credentialsReady || !searchTerm.trim()) return
    setLoading(true)
    setError(null)
    try {
      localStorage.setItem('picnic-email', email.trim())
      localStorage.setItem('picnic-password', password.trim())
      const res = await fetch('/api/picnic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), searchTerm: searchTerm.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Zoeken mislukt')
      setProducts(data.products)
      setSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>🚲 Kies Picnic product</span>
          <button onClick={onClose}>×</button>
        </div>

        {!localStorage.getItem('picnic-email') && (
          <div className="picker-credentials">
            <p>Vul je Picnic-gegevens in om te zoeken</p>
            <input type="email" placeholder="E-mailadres" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Wachtwoord" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        )}

        <div className="picker-search-row">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Zoek product..."
          />
          <button className="picker-search-btn" onClick={handleSearch} disabled={loading || !credentialsReady}>
            {loading ? '...' : 'Zoek'}
          </button>
        </div>

        {error && <p className="picker-error">{error}</p>}

        <div className="modal-list">
          {currentProductId && (
            <div className="modal-item picker-unlink" onClick={() => onSelect(null, null)}>
              <span>Koppeling verwijderen</span>
              <span style={{ color: '#d32f2f' }}>×</span>
            </div>
          )}

          {searched && products.length === 0 && !loading && (
            <p className="picker-empty">Geen producten gevonden voor "{searchTerm}"</p>
          )}

          {products.map(product => (
            <div
              key={product.id}
              className={`modal-item ${product.id === currentProductId ? 'selected' : ''}`}
              onClick={() => onSelect(product.id, product.name)}
            >
              <div>
                <div className="picker-product-name">{product.name}</div>
                {product.unitQuantity && <div className="modal-item-meta">{product.unitQuantity}</div>}
              </div>
              {product.price && <span className="picker-price">{product.price}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
