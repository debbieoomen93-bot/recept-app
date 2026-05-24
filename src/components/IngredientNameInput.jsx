// src/components/IngredientNameInput.jsx
import { useState, useEffect, useRef } from 'react'

export default function IngredientNameInput({ value, onChange, picnicProductId, picnicProductName, onProductSelect }) {
  const [products, setProducts] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCredForm, setShowCredForm] = useState(false)
  const [credEmail, setCredEmail] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const email = localStorage.getItem('picnic-email')
    const password = localStorage.getItem('picnic-password')
    if (!email || !password || value.trim().length < 2) {
      setProducts([])
      setShowDropdown(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch('/api/picnic-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, searchTerm: value.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.products?.length) {
          setProducts(data.products)
          setShowDropdown(true)
        } else {
          setProducts([])
          setShowDropdown(false)
        }
      } catch {
        setProducts([])
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(debounceRef.current)
  }, [value])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (product) => {
    onProductSelect(product.id, product.name)
    setShowDropdown(false)
    setProducts([])
  }

  const handleUnlink = (e) => {
    e.stopPropagation()
    onProductSelect(null, null)
  }

  const hasCredentials = Boolean(localStorage.getItem('picnic-email') && localStorage.getItem('picnic-password'))

  return (
    <div className="ing-name-wrapper" ref={wrapperRef}>
      <input
        className={`ing-name ${picnicProductId ? 'ing-linked' : ''}`}
        placeholder="Naam"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => products.length > 0 && setShowDropdown(true)}
        autoComplete="off"
      />
      {searching && <span className="ing-searching-dot" />}
      {picnicProductId && !showDropdown && (
        <div className="ing-linked-badge">
          🚲 {picnicProductName}
          <button className="ing-unlink-btn" onClick={handleUnlink} type="button">×</button>
        </div>
      )}
      {!hasCredentials && value.trim().length >= 2 && !picnicProductId && !showCredForm && (
        <div className="ing-no-credentials">
          🚲 <button className="ing-cred-link" onClick={() => setShowCredForm(true)} type="button">Picnic instellen om te zoeken</button>
        </div>
      )}
      {showCredForm && (
        <div className="ing-cred-form">
          <input type="email" placeholder="Picnic e-mailadres" value={credEmail} onChange={e => setCredEmail(e.target.value)} />
          <input type="password" placeholder="Picnic wachtwoord" value={credPassword} onChange={e => setCredPassword(e.target.value)} />
          <div className="ing-cred-actions">
            <button type="button" onClick={() => setShowCredForm(false)}>Annuleren</button>
            <button type="button" className="ing-cred-save" onClick={() => {
              if (credEmail && credPassword) {
                localStorage.setItem('picnic-email', credEmail)
                localStorage.setItem('picnic-password', credPassword)
                setShowCredForm(false)
              }
            }}>Opslaan</button>
          </div>
        </div>
      )}
      {showDropdown && (
        <div className="ing-dropdown">
          {products.map(p => (
            <div key={p.id} className="ing-dropdown-item" onMouseDown={() => handleSelect(p)}>
              <span className="ing-dropdown-name">{p.name}</span>
              <span className="ing-dropdown-right">
                {p.unitQuantity && <span className="ing-dropdown-qty">{p.unitQuantity}</span>}
                {p.price && <span className="ing-dropdown-price">{p.price}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
