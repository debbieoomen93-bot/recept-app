// src/components/PicnicModal.jsx
import { useState } from 'react'

export default function PicnicModal({ ingredients, onClose }) {
  const [email, setEmail] = useState(() => localStorage.getItem('picnic-email') || '')
  const [password, setPassword] = useState(() => localStorage.getItem('picnic-password') || '')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)

  const handleSend = async () => {
    localStorage.setItem('picnic-email', email)
    localStorage.setItem('picnic-password', password)
    setStatus('loading')

    try {
      const res = await fetch('/api/picnic-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ingredients }),
      })
      const data = await res.json()
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
          {status === 'idle' || status === 'error' ? (
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
              {status === 'error' && (
                <p className="error">{result?.error}</p>
              )}
              <button
                className="btn-picnic"
                onClick={handleSend}
                disabled={!email || !password}
              >
                {ingredients.length} items toevoegen aan mandje
              </button>
            </>
          ) : status === 'loading' ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p>Bezig met toevoegen aan Picnic...</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--picnic)' }}>
                ✅ Klaar!
              </p>
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
              <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onClose}>
                Sluiten
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
