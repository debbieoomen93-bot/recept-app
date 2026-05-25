import { useState } from 'react'

export default function PicnicModal({ ingredients, onClose }) {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('picnic-auth-token'))
  const [email, setEmail] = useState(() => localStorage.getItem('picnic-email') || '')
  const [password, setPassword] = useState(() => localStorage.getItem('picnic-password') || '')
  const [tempToken, setTempToken] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loggingIn | sending | success | error
  const [result, setResult] = useState(null)
  const [authError, setAuthError] = useState('')

  const storeToken = (token) => {
    localStorage.setItem('picnic-auth-token', token)
    setAuthToken(token)
  }

  const handleLogin = async () => {
    localStorage.setItem('picnic-email', email)
    localStorage.setItem('picnic-password', password)
    setStatus('loggingIn')
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
        setShow2FA(true)
        setStatus('idle')
      } else {
        storeToken(data.authToken)
        setStatus('idle')
      }
    } catch (err) {
      setAuthError(err.message)
      setStatus('error')
    }
  }

  const handleVerify = async () => {
    setStatus('loggingIn')
    setAuthError('')
    try {
      const res = await fetch('/api/picnic-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code onjuist of verlopen')
      storeToken(data.authToken)
      setShow2FA(false)
      setTempToken(null)
      setOtpCode('')
      setStatus('idle')
    } catch (err) {
      setAuthError(err.message)
      setStatus('error')
    }
  }

  const handleSend = async () => {
    setStatus('sending')
    try {
      const res = await fetch('/api/picnic-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, ingredients }),
      })
      const data = await res.json()
      if (res.status === 401 || data.tokenExpired) {
        localStorage.removeItem('picnic-auth-token')
        setAuthToken(null)
        setStatus('idle')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Onbekende fout')
      setResult(data)
      setStatus('success')
    } catch (err) {
      setResult({ error: err.message })
      setStatus('error')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>🚲 Verstuur naar Picnic</span>
          <button onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px' }}>

          {status === 'success' ? (
            <>
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--picnic)' }}>✅ Klaar!</p>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
                {result?.added?.length || 0} van {ingredients.length} items toegevoegd.
              </p>
              {result?.failed?.length > 0 && (
                <>
                  <p style={{ fontSize: '13px', color: '#d32f2f', marginBottom: '6px' }}>Niet gevonden:</p>
                  <ul style={{ fontSize: '13px', color: '#555', paddingLeft: '16px' }}>
                    {result.failed.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </>
              )}
              <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onClose}>Sluiten</button>
            </>

          ) : status === 'sending' || status === 'loggingIn' ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p>{status === 'sending' ? 'Bezig met toevoegen aan Picnic...' : 'Verbinden met Picnic...'}</p>
            </div>

          ) : show2FA ? (
            <>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
                Er is een SMS-code verstuurd naar je telefoon.
              </p>
              <div className="form-group">
                <label>Verificatiecode</label>
                <input type="text" placeholder="6-cijferige code" value={otpCode}
                  onChange={e => setOtpCode(e.target.value)} maxLength={6} inputMode="numeric" />
              </div>
              {authError && <p className="error">{authError}</p>}
              <button className="btn-picnic" onClick={handleVerify} disabled={otpCode.length < 4}>
                Bevestigen
              </button>
            </>

          ) : authToken ? (
            <>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
                {ingredients.length} ingrediënten toevoegen aan je Picnic-mandje.
              </p>
              {status === 'error' && <p className="error">{result?.error}</p>}
              <button className="btn-picnic" onClick={handleSend}>
                {ingredients.length} items toevoegen aan mandje
              </button>
            </>

          ) : (
            <>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
                Vul je Picnic-gegevens in. Deze worden lokaal opgeslagen op dit apparaat.
              </p>
              <div className="form-group">
                <label>E-mailadres</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.nl" />
              </div>
              <div className="form-group">
                <label>Wachtwoord</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {authError && <p className="error">{authError}</p>}
              <button className="btn-picnic" onClick={handleLogin} disabled={!email || !password}>
                Verbinden met Picnic
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
