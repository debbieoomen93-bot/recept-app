// src/components/Login.jsx
import { useState } from 'react'
import { checkPassword, setAuthenticated, setUsername } from '../auth'
import { signInAsGuest } from '../firebase'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(false)
  const correctPassword = import.meta.env.VITE_SHARED_PASSWORD

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (checkPassword(password, correctPassword)) {
      setAuthenticated(password)
      if (name.trim()) setUsername(name.trim())
      await signInAsGuest()
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>🥗 Onze Recepten</h1>
        <p>Voer het wachtwoord in om verder te gaan</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Jouw naam (bijv. Debbie)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            required
          />
          {error && <p className="error">Wachtwoord klopt niet</p>}
          <button type="submit" disabled={!password || !name.trim()}>
            Inloggen
          </button>
        </form>
      </div>
    </div>
  )
}
