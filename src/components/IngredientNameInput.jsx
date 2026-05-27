import { useState, useEffect, useRef } from 'react'

export default function IngredientNameInput({ value, onChange, picnicProductId, picnicProductName, onProductSelect, onCategoryDetect }) {
  const [products, setProducts] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('picnic-auth-token'))
  const [showCredForm, setShowCredForm] = useState(false)
  const [show2FAForm, setShow2FAForm] = useState(false)
  const [tempToken, setTempToken] = useState(null)
  const [credEmail, setCredEmail] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const justSelectedRef = useRef(false)

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (!authToken || value.trim().length < 2) {
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
          body: JSON.stringify({ authToken, searchTerm: value.trim() }),
        })
        const data = await res.json()
        if (res.status === 401 || data.tokenExpired) {
          localStorage.removeItem('picnic-auth-token')
          setAuthToken(null)
          return
        }
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
  }, [value, authToken])

  useEffect(() => {
    if (showDropdown && wrapperRef.current) {
      setTimeout(() => {
        wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)
    }
  }, [showDropdown])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const storeToken = (token) => {
    localStorage.setItem('picnic-auth-token', token)
    setAuthToken(token)
  }

  const handleLogin = async (email, password) => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/picnic-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login mislukt')

      if (data.requires2FA) {
        setTempToken(data.tempToken)
        setShowCredForm(false)
        setShow2FAForm(true)
      } else {
        storeToken(data.authToken)
        setShowCredForm(false)
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSaveCredentials = () => {
    if (!credEmail || !credPassword) return
    localStorage.setItem('picnic-email', credEmail)
    localStorage.setItem('picnic-password', credPassword)
    handleLogin(credEmail, credPassword)
  }

  const handleConnectWithSaved = () => {
    const email = localStorage.getItem('picnic-email')
    const password = localStorage.getItem('picnic-password')
    handleLogin(email, password)
  }

  const handleVerify = async () => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/picnic-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verificatie mislukt')
      storeToken(data.authToken)
      setShow2FAForm(false)
      setTempToken(null)
      setOtpCode('')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSelect = (product) => {
    justSelectedRef.current = true
    onChange(product.name)
    onProductSelect(product.id, product.name)
    if (onCategoryDetect && product.category) onCategoryDetect(product.category)
    setShowDropdown(false)
    setProducts([])
  }

  const handleUnlink = (e) => {
    e.stopPropagation()
    onProductSelect(null, null)
  }

  const hasCredentials = Boolean(localStorage.getItem('picnic-email') && localStorage.getItem('picnic-password'))
  const showHint = !authToken && value.trim().length >= 2 && !picnicProductId && !showCredForm && !show2FAForm

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

      {showHint && (
        <div className="ing-no-credentials">
          🚲 {authLoading
            ? 'Verbinden met Picnic...'
            : <button className="ing-cred-link" type="button"
                onClick={() => hasCredentials ? handleConnectWithSaved() : setShowCredForm(true)}>
                {hasCredentials ? 'Verbinden met Picnic' : 'Picnic instellen om te zoeken'}
              </button>
          }
        </div>
      )}

      {showCredForm && (
        <div className="ing-cred-form">
          <input type="email" placeholder="Picnic e-mailadres" value={credEmail} onChange={e => setCredEmail(e.target.value)} />
          <input type="password" placeholder="Picnic wachtwoord" value={credPassword} onChange={e => setCredPassword(e.target.value)} />
          {authError && <p style={{ color: 'red', fontSize: '12px', margin: '4px 0' }}>{authError}</p>}
          <div className="ing-cred-actions">
            <button type="button" onClick={() => { setShowCredForm(false); setAuthError('') }}>Annuleren</button>
            <button type="button" className="ing-cred-save" onClick={handleSaveCredentials}
              disabled={authLoading || !credEmail || !credPassword}>
              {authLoading ? 'Bezig...' : 'Verbinden'}
            </button>
          </div>
        </div>
      )}

      {show2FAForm && (
        <div className="ing-cred-form">
          <p style={{ fontSize: '13px', color: '#555', margin: '0 0 8px' }}>
            Er is een SMS-code verstuurd naar je telefoon.
          </p>
          <input type="text" placeholder="6-cijferige code" value={otpCode}
            onChange={e => setOtpCode(e.target.value)} maxLength={6} inputMode="numeric" />
          {authError && <p style={{ color: 'red', fontSize: '12px', margin: '4px 0' }}>{authError}</p>}
          <div className="ing-cred-actions">
            <button type="button" onClick={() => { setShow2FAForm(false); setAuthError('') }}>Annuleren</button>
            <button type="button" className="ing-cred-save" onClick={handleVerify}
              disabled={authLoading || otpCode.length < 4}>
              {authLoading ? 'Bezig...' : 'Bevestigen'}
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div className="ing-dropdown">
          {products.map(p => (
            <div key={p.id} className="ing-dropdown-item" onMouseDown={() => handleSelect(p)}>
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="ing-dropdown-img" onError={e => { e.target.style.display = 'none' }} />
              )}
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
