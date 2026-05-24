// src/components/IngredientNameInput.jsx
import { useState, useEffect, useRef } from 'react'

export default function IngredientNameInput({ value, onChange, picnicProductId, picnicProductName, onProductSelect }) {
  const [products, setProducts] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
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
