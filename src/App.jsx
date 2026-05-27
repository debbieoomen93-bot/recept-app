// src/App.jsx
import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Login from './components/Login'
import RecipeList from './components/RecipeList'
import RecipeForm from './components/RecipeForm'
import RecipeDetail from './components/RecipeDetail'
import WeekPlanning from './components/WeekPlanning'
import ShoppingList from './components/ShoppingList'
import PicnicRecipes from './components/PicnicRecipes'
import PicnicRecipeDetail from './components/PicnicRecipeDetail'
import AIRecipe from './components/AIRecipe'
import PublicRecipeView from './components/PublicRecipeView'
import PublicMealDBView from './components/PublicMealDBView'
import { isAuthenticated, getUsername } from './auth'
import { signInAsGuest } from './firebase'

const isPublicRoute = /^\/recept\//.test(window.location.pathname)

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated(import.meta.env.VITE_SHARED_PASSWORD))
  const [firebaseReady, setFirebaseReady] = useState(false)
  const username = getUsername()

  useEffect(() => {
    if (authed) {
      signInAsGuest().then(() => setFirebaseReady(true)).catch(() => setFirebaseReady(true))
    }
  }, [authed])

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/recept/db/:mealId" element={<PublicMealDBView />} />
        <Route path="/recept/:id" element={<PublicRecipeView />} />
      </Routes>
    )
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  if (!firebaseReady) {
    return null
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
          <Route path="/picnic" element={<PicnicRecipes username={username} />} />
          <Route path="/picnic/ai" element={<AIRecipe username={username} />} />
          <Route path="/picnic/db/:mealId" element={<PicnicRecipeDetail username={username} />} />
          <Route path="*" element={<Navigate to="/recepten" replace />} />
        </Routes>
      </div>
      <nav className="bottom-nav">
        <NavLink to="/recepten" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span>📋</span><span>Jouw recepten</span>
        </NavLink>
        <NavLink to="/picnic" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span>🔍</span><span>Recepten</span>
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
