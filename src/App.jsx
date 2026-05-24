// src/App.jsx
import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Login from './components/Login'
import RecipeList from './components/RecipeList'
import RecipeForm from './components/RecipeForm'
import RecipeDetail from './components/RecipeDetail'
import WeekPlanning from './components/WeekPlanning'
import ShoppingList from './components/ShoppingList'
import { isAuthenticated, getUsername } from './auth'
import { signInAsGuest } from './firebase'

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated(import.meta.env.VITE_SHARED_PASSWORD))
  const username = getUsername()

  useEffect(() => {
    if (authed) signInAsGuest()
  }, [authed])

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  return (
    <div className="app">
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/recepten" replace />} />
          <Route path="/recepten" element={<RecipeList username={username} />} />
          <Route path="/recepten/nieuw" element={<RecipeForm username={username} />} />
          <Route path="/recepten/:id" element={<RecipeDetail username={username} />} />
          <Route path="/recepten/:id/bewerken" element={<RecipeForm username={username} />} />
          <Route path="/planning" element={<WeekPlanning />} />
          <Route path="/boodschappen" element={<ShoppingList />} />
        </Routes>
      </div>
      <nav className="bottom-nav">
        <NavLink to="/recepten" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span>📋</span><span>Recepten</span>
        </NavLink>
        <NavLink to="/planning" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span>📅</span><span>Planning</span>
        </NavLink>
        <NavLink to="/boodschappen" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span>🛒</span><span>Boodschappen</span>
        </NavLink>
      </nav>
    </div>
  )
}
