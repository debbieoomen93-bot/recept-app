# Recept App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een gedeelde recept-app bouwen waarmee twee gebruikers recepten beheren, een weekmenu plannen en boodschappen met één klik naar Picnic sturen, met automatisch AI-gegenereerde afbeeldingen via Vertex AI Imagen.

**Architecture:** React (Vite) frontend gehost op Vercel. Firebase Firestore als database. Vercel serverless function voor de Picnic-integratie. Firebase Cloud Function triggered op nieuwe recepten om via Vertex AI Imagen een afbeelding te genereren en op te slaan in Firebase Storage.

**Tech Stack:** React 18, Vite, Firebase (Firestore + Storage + Cloud Functions), Vercel serverless functions, Vertex AI Imagen (`imagegeneration@006`), React Router v6, Vitest, React Testing Library.

---

## Benodigde voorbereiding (eenmalig, door de gebruiker)

1. Firebase project aanmaken op https://console.firebase.google.com
   - Firestore inschakelen (productie-modus, regio: `europe-west4`)
   - Firebase Storage inschakelen
   - Cloud Functions inschakelen (Blaze-plan vereist — pay-as-you-go, bij thuisgebruik gratis)
2. Vertex AI API inschakelen in Google Cloud Console voor hetzelfde project
3. GitHub-repo aanmaken voor `recept-app`, koppelen aan Vercel
4. In Vercel: environment variable `SHARED_PASSWORD` instellen (gekozen wachtwoord)
5. Firebase service account JSON downloaden (voor Cloud Functions — automatisch beschikbaar in Cloud Functions omgeving)

---

## Bestandsstructuur

```
recept-app/
├── src/
│   ├── main.jsx                     # Vite entrypoint
│   ├── App.jsx                      # Routing + bottom nav + auth guard
│   ├── firebase.js                  # Firebase init + alle Firestore/Storage CRUD
│   ├── auth.js                      # Wachtwoord check + localStorage helpers
│   ├── categories.js                # Vaste lijst van ingrediëntcategorieën
│   ├── weekUtils.js                 # Weeknummer, dag-volgorde, week-ID helpers
│   ├── shoppingList.js              # Ingrediënten samenvoegen vanuit weekplanning
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── RecipeList.jsx
│   │   ├── RecipeCard.jsx
│   │   ├── RecipeDetail.jsx
│   │   ├── RecipeForm.jsx
│   │   ├── WeekPlanning.jsx
│   │   ├── DayPicker.jsx            # Modal: recept kiezen voor een dag
│   │   ├── ShoppingList.jsx
│   │   └── PicnicModal.jsx          # Modal: Picnic credentials invoeren
│   ├── test/
│   │   └── setup.js
│   └── index.css
├── api/
│   └── picnic-add.js                # Vercel serverless function
├── functions/
│   ├── package.json
│   └── index.js                     # Firebase Cloud Function → Vertex AI Imagen
├── index.html
├── vite.config.js
├── vercel.json
├── firebase.json
├── .firebaserc
├── .env.local                       # Lokaal (niet in git)
├── .env.example
└── package.json
```

---

## Task 1: Project setup

**Files:**
- Create: `recept-app/` (Vite project)
- Modify: `vite.config.js`
- Create: `src/test/setup.js`
- Create: `.env.example`

- [ ] **Step 1: Maak Vite React project aan**

```bash
cd C:\Users\debbi
npm create vite@latest recept-app -- --template react
cd recept-app
npm install
```

- [ ] **Step 2: Installeer dependencies**

```bash
npm install firebase react-router-dom
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configureer Vitest in vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

- [ ] **Step 4: Maak test setup bestand**

```js
// src/test/setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Voeg test-script toe aan package.json**

In `package.json`, voeg toe aan `"scripts"`:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 6: Maak .env.example aan**

```
# .env.example
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_SHARED_PASSWORD=
```

- [ ] **Step 7: Maak .env.local aan met echte waarden (van Firebase Console)**

```
# .env.local — NIET in git
VITE_FIREBASE_API_KEY=<jouw waarde>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<waarde>
VITE_FIREBASE_APP_ID=<waarde>
VITE_SHARED_PASSWORD=<gekozen wachtwoord>
```

- [ ] **Step 8: Voeg .env.local toe aan .gitignore**

Controleer dat `.gitignore` bevat:
```
.env.local
.env*.local
```

- [ ] **Step 9: Verwijder standaard Vite boilerplate**

Verwijder inhoud van `src/App.jsx`, `src/App.css`. Laat `src/index.css` staan (wordt later overschreven).

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: project setup — Vite + React + Firebase + Vitest"
```

---

## Task 2: categories.js

**Files:**
- Create: `src/categories.js`
- Create: `src/categories.test.js`

- [ ] **Step 1: Schrijf de falende test**

```js
// src/categories.test.js
import { CATEGORIES, getCategoryLabel } from './categories'

test('CATEGORIES is een niet-lege array van strings', () => {
  expect(Array.isArray(CATEGORIES)).toBe(true)
  expect(CATEGORIES.length).toBeGreaterThan(0)
  CATEGORIES.forEach(c => expect(typeof c).toBe('string'))
})

test('getCategoryLabel geeft de waarde terug als die bestaat', () => {
  expect(getCategoryLabel(CATEGORIES[0])).toBe(CATEGORIES[0])
})

test('getCategoryLabel geeft "Overig" terug voor onbekende waarde', () => {
  expect(getCategoryLabel('onbekend')).toBe('Overig')
})
```

- [ ] **Step 2: Run test en verifieer dat die faalt**

```bash
npm test -- categories
```
Verwacht: FAIL — `categories.js` bestaat niet.

- [ ] **Step 3: Implementeer categories.js**

```js
// src/categories.js
export const CATEGORIES = [
  'Groente & fruit',
  'Vlees, vis & vega',
  'Zuivel & eieren',
  'Pasta, rijst & granen',
  'Blikken & potten',
  'Sauzen & kruiden',
  'Bakken & koken',
  'Dranken',
  'Overig',
]

export function getCategoryLabel(value) {
  return CATEGORIES.includes(value) ? value : 'Overig'
}
```

- [ ] **Step 4: Run test en verifieer dat die slaagt**

```bash
npm test -- categories
```
Verwacht: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/categories.js src/categories.test.js
git commit -m "feat: add ingredient categories"
```

---

## Task 3: weekUtils.js

**Files:**
- Create: `src/weekUtils.js`
- Create: `src/weekUtils.test.js`

- [ ] **Step 1: Schrijf de falende tests**

```js
// src/weekUtils.test.js
import { getWeekId, getWeekDays, getISOWeekNumber, getPrevWeekId, getNextWeekId } from './weekUtils'

test('getISOWeekNumber geeft correct weeknummer', () => {
  expect(getISOWeekNumber(new Date('2026-05-18'))).toBe(21)
  expect(getISOWeekNumber(new Date('2026-01-01'))).toBe(1)
})

test('getWeekId geeft "jaar-week" string', () => {
  expect(getWeekId(new Date('2026-05-18'))).toBe('2026-21')
})

test('getWeekDays geeft array van 7 dagnamen in volgorde', () => {
  const days = getWeekDays()
  expect(days).toEqual(['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'])
})

test('getPrevWeekId geeft de vorige week', () => {
  expect(getPrevWeekId('2026-21')).toBe('2026-20')
})

test('getPrevWeekId handelt jaarovergang af', () => {
  expect(getPrevWeekId('2026-01')).toBe('2025-52')
})

test('getNextWeekId geeft de volgende week', () => {
  expect(getNextWeekId('2026-21')).toBe('2026-22')
})
```

- [ ] **Step 2: Run test en verifieer dat die faalt**

```bash
npm test -- weekUtils
```
Verwacht: FAIL — module niet gevonden.

- [ ] **Step 3: Implementeer weekUtils.js**

```js
// src/weekUtils.js
export function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function getWeekId(date = new Date()) {
  const year = date.getFullYear()
  // Correct jaar voor weeknummer (week 1 kan in december vallen)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const week = getISOWeekNumber(date)
  return `${d.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

export function getWeekDays() {
  return ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
}

export function getPrevWeekId(weekId) {
  const [year, week] = weekId.split('-').map(Number)
  if (week === 1) {
    const lastWeek = getISOWeekNumber(new Date(year - 1, 11, 28))
    return `${year - 1}-${String(lastWeek).padStart(2, '0')}`
  }
  return `${year}-${String(week - 1).padStart(2, '0')}`
}

export function getNextWeekId(weekId) {
  const [year, week] = weekId.split('-').map(Number)
  const lastWeekOfYear = getISOWeekNumber(new Date(year, 11, 28))
  if (week === lastWeekOfYear) {
    return `${year + 1}-01`
  }
  return `${year}-${String(week + 1).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run test en verifieer dat die slaagt**

```bash
npm test -- weekUtils
```
Verwacht: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/weekUtils.js src/weekUtils.test.js
git commit -m "feat: add week utility functions"
```

---

## Task 4: shoppingList.js

**Files:**
- Create: `src/shoppingList.js`
- Create: `src/shoppingList.test.js`

- [ ] **Step 1: Schrijf de falende tests**

```js
// src/shoppingList.test.js
import { aggregateIngredients } from './shoppingList'

const pasta = {
  ingredients: [
    { name: 'spaghetti', amount: 400, unit: 'g', category: 'Pasta, rijst & granen' },
    { name: 'pancetta', amount: 200, unit: 'g', category: 'Vlees, vis & vega' },
    { name: 'eieren', amount: 4, unit: 'stuks', category: 'Zuivel & eieren' },
  ]
}
const soep = {
  ingredients: [
    { name: 'rode linzen', amount: 250, unit: 'g', category: 'Blikken & potten' },
    { name: 'eieren', amount: 2, unit: 'stuks', category: 'Zuivel & eieren' },
  ]
}

test('combineert ingrediënten van meerdere recepten', () => {
  const result = aggregateIngredients([pasta, soep])
  expect(result['Zuivel & eieren']).toHaveLength(1)
  const eieren = result['Zuivel & eieren'].find(i => i.name === 'eieren')
  expect(eieren.amount).toBe(6)
  expect(eieren.unit).toBe('stuks')
})

test('groepeert per categorie', () => {
  const result = aggregateIngredients([pasta])
  expect(Object.keys(result)).toContain('Pasta, rijst & granen')
  expect(Object.keys(result)).toContain('Vlees, vis & vega')
  expect(Object.keys(result)).toContain('Zuivel & eieren')
})

test('telt hoeveelheden NIET op bij verschillende eenheden', () => {
  const r1 = { ingredients: [{ name: 'melk', amount: 200, unit: 'ml', category: 'Zuivel & eieren' }] }
  const r2 = { ingredients: [{ name: 'melk', amount: 1, unit: 'liter', category: 'Zuivel & eieren' }] }
  const result = aggregateIngredients([r1, r2])
  expect(result['Zuivel & eieren']).toHaveLength(2)
})

test('lege receptenlijst geeft leeg object terug', () => {
  expect(aggregateIngredients([])).toEqual({})
})

test('recept zonder ingrediënten wordt overgeslagen', () => {
  expect(aggregateIngredients([{ ingredients: [] }])).toEqual({})
})
```

- [ ] **Step 2: Run test en verifieer dat die faalt**

```bash
npm test -- shoppingList
```
Verwacht: FAIL — module niet gevonden.

- [ ] **Step 3: Implementeer shoppingList.js**

```js
// src/shoppingList.js
export function aggregateIngredients(recipes) {
  const grouped = {}

  for (const recipe of recipes) {
    for (const ing of (recipe.ingredients || [])) {
      const cat = ing.category || 'Overig'
      if (!grouped[cat]) grouped[cat] = []

      const existing = grouped[cat].find(
        i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit
      )
      if (existing) {
        existing.amount += ing.amount
      } else {
        grouped[cat].push({ name: ing.name, amount: ing.amount, unit: ing.unit })
      }
    }
  }

  return grouped
}
```

- [ ] **Step 4: Run test en verifieer dat die slaagt**

```bash
npm test -- shoppingList
```
Verwacht: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shoppingList.js src/shoppingList.test.js
git commit -m "feat: add shopping list aggregation logic"
```

---

## Task 5: firebase.js

**Files:**
- Create: `src/firebase.js`

- [ ] **Step 1: Maak firebase.js aan**

```js
// src/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, getDoc, setDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

// --- Recipes ---

export function subscribeToRecipes(callback) {
  const q = query(collection(db, 'recipes'), orderBy('title'))
  return onSnapshot(q, snap => {
    const recipes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(recipes)
  })
}

export async function createRecipe(data, username) {
  const docRef = await addDoc(collection(db, 'recipes'), {
    ...data,
    imageUrl: null,
    imageStatus: 'pending',
    createdBy: username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateRecipe(id, data) {
  await updateDoc(doc(db, 'recipes', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRecipe(id) {
  await deleteDoc(doc(db, 'recipes', id))
}

export function subscribeToRecipe(id, callback) {
  return onSnapshot(doc(db, 'recipes', id), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })
}

// --- Week planning ---

export function subscribeToWeekPlanning(weekId, callback) {
  return onSnapshot(doc(db, 'weekplanning', weekId), snap => {
    callback(snap.exists() ? snap.data() : { days: {} })
  })
}

export async function setDayRecipe(weekId, dayName, recipeId, spans2Days) {
  const ref = doc(db, 'weekplanning', weekId)
  await setDoc(ref, {
    days: {
      [dayName]: { recipeId: recipeId || null, spans2Days: spans2Days || false }
    }
  }, { merge: true })
}
```

- [ ] **Step 2: Verifieer dat de app opstart zonder fouten**

```bash
npm run dev
```
Verwacht: Vite server start op http://localhost:5173, geen console-errors over Firebase.

- [ ] **Step 3: Commit**

```bash
git add src/firebase.js
git commit -m "feat: add Firebase Firestore + Storage integration"
```

---

## Task 6: auth.js + Login component

**Files:**
- Create: `src/auth.js`
- Create: `src/auth.test.js`
- Create: `src/components/Login.jsx`

- [ ] **Step 1: Schrijf falende tests voor auth.js**

```js
// src/auth.test.js
import { checkPassword, isAuthenticated, setAuthenticated, clearAuth } from './auth'

beforeEach(() => localStorage.clear())

test('checkPassword geeft true terug bij correct wachtwoord', () => {
  expect(checkPassword('geheim123', 'geheim123')).toBe(true)
})

test('checkPassword geeft false terug bij verkeerd wachtwoord', () => {
  expect(checkPassword('fout', 'geheim123')).toBe(false)
})

test('isAuthenticated geeft false terug als localStorage leeg is', () => {
  expect(isAuthenticated('geheim123')).toBe(false)
})

test('na setAuthenticated geeft isAuthenticated true terug', () => {
  setAuthenticated('geheim123')
  expect(isAuthenticated('geheim123')).toBe(true)
})

test('clearAuth verwijdert authenticatie', () => {
  setAuthenticated('geheim123')
  clearAuth()
  expect(isAuthenticated('geheim123')).toBe(false)
})
```

- [ ] **Step 2: Run test en verifieer dat die faalt**

```bash
npm test -- auth
```
Verwacht: FAIL.

- [ ] **Step 3: Implementeer auth.js**

```js
// src/auth.js
const STORAGE_KEY = 'recept-app-auth'

export function checkPassword(input, correctPassword) {
  return input === correctPassword
}

export function setAuthenticated(password) {
  localStorage.setItem(STORAGE_KEY, password)
}

export function isAuthenticated(correctPassword) {
  return localStorage.getItem(STORAGE_KEY) === correctPassword
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getUsername() {
  return localStorage.getItem('recept-app-username') || 'Gebruiker'
}

export function setUsername(name) {
  localStorage.setItem('recept-app-username', name)
}
```

- [ ] **Step 4: Run test en verifieer dat die slaagt**

```bash
npm test -- auth
```
Verwacht: PASS (5 tests).

- [ ] **Step 5: Maak Login.jsx aan**

```jsx
// src/components/Login.jsx
import { useState } from 'react'
import { checkPassword, setAuthenticated, setUsername } from '../auth'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(false)
  const correctPassword = import.meta.env.VITE_SHARED_PASSWORD

  const handleSubmit = (e) => {
    e.preventDefault()
    if (checkPassword(password, correctPassword)) {
      setAuthenticated(password)
      if (name.trim()) setUsername(name.trim())
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
```

- [ ] **Step 6: Commit**

```bash
git add src/auth.js src/auth.test.js src/components/Login.jsx
git commit -m "feat: add shared password auth + login screen"
```

---

## Task 7: App.jsx + routing + navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Schrijf main.jsx**

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 2: Schrijf App.jsx**

```jsx
// src/App.jsx
import { useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import RecipeList from './components/RecipeList'
import RecipeForm from './components/RecipeForm'
import RecipeDetail from './components/RecipeDetail'
import WeekPlanning from './components/WeekPlanning'
import ShoppingList from './components/ShoppingList'
import { isAuthenticated, getUsername } from './auth'

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated(import.meta.env.VITE_SHARED_PASSWORD))
  const username = getUsername()

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
```

- [ ] **Step 3: Schrijf basis CSS in index.css**

```css
/* src/index.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root { --green: #2d5a27; --green-light: #f0f7ee; --orange: #ff6600; --picnic: #00a550; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f0; color: #1a1a1a; }

.app { display: flex; flex-direction: column; height: 100dvh; }
.page-content { flex: 1; overflow-y: auto; }

/* Bottom nav */
.bottom-nav { display: flex; border-top: 1px solid #eee; background: #fff; flex-shrink: 0; }
.nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px 10px; font-size: 11px; color: #999; text-decoration: none; gap: 3px; }
.nav-item span:first-child { font-size: 20px; }
.nav-item.active { color: var(--green); }

/* Login */
.login-screen { display: flex; align-items: center; justify-content: center; min-height: 100dvh; padding: 24px; }
.login-card { background: white; border-radius: 16px; padding: 32px 24px; max-width: 360px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.login-card h1 { font-size: 24px; margin-bottom: 8px; }
.login-card p { color: #666; margin-bottom: 24px; font-size: 14px; }
.login-card input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 15px; margin-bottom: 12px; outline: none; }
.login-card input:focus { border-color: var(--green); }
.login-card button { width: 100%; padding: 13px; background: var(--green); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
.login-card button:disabled { opacity: 0.5; }
.error { color: #d32f2f; font-size: 13px; margin-bottom: 8px; }

/* Topbar */
.topbar { background: var(--green); color: white; padding: 14px 16px; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: space-between; }
.topbar-back { font-size: 22px; cursor: pointer; background: none; border: none; color: white; }

/* FAB */
.fab { position: fixed; bottom: 72px; right: 20px; width: 52px; height: 52px; border-radius: 26px; background: var(--green); color: white; font-size: 28px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(45,90,39,0.4); display: flex; align-items: center; justify-content: center; }

/* Knoppen */
.btn-primary { background: var(--green); color: white; border: none; border-radius: 10px; padding: 13px 20px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%; }
.btn-picnic { background: var(--picnic); color: white; border: none; border-radius: 10px; padding: 13px 20px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; }
.btn-danger { background: #d32f2f; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; cursor: pointer; }

/* Kaarten */
.card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
```

- [ ] **Step 4: Maak lege placeholder-componenten zodat de routes niet crashen**

Maak elk bestand aan met minimale inhoud (wordt ingevuld in volgende taken):

```jsx
// src/components/RecipeList.jsx
export default function RecipeList() { return <div>RecipeList</div> }
```
```jsx
// src/components/RecipeForm.jsx
export default function RecipeForm() { return <div>RecipeForm</div> }
```
```jsx
// src/components/RecipeDetail.jsx
export default function RecipeDetail() { return <div>RecipeDetail</div> }
```
```jsx
// src/components/WeekPlanning.jsx
export default function WeekPlanning() { return <div>WeekPlanning</div> }
```
```jsx
// src/components/ShoppingList.jsx
export default function ShoppingList() { return <div>ShoppingList</div> }
```

- [ ] **Step 5: Verifieer dat de app werkt in de browser**

```bash
npm run dev
```
Verwacht: login scherm zichtbaar op http://localhost:5173. Na inloggen: drie tabbladen in bottom nav.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add app shell with routing and bottom navigation"
```

---

## Task 8: RecipeCard + RecipeList

**Files:**
- Modify: `src/components/RecipeList.jsx`
- Create: `src/components/RecipeCard.jsx`

- [ ] **Step 1: Maak RecipeCard.jsx**

```jsx
// src/components/RecipeCard.jsx
export default function RecipeCard({ recipe, onClick }) {
  const { title, portions, createdBy, imageUrl, imageStatus } = recipe

  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-card-image">
        {imageStatus === 'done' && imageUrl
          ? <img src={imageUrl} alt={title} />
          : imageStatus === 'error'
            ? <span className="recipe-emoji">🍽️</span>
            : <span className="recipe-spinner">⏳</span>
        }
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{title}</div>
        <div className="recipe-card-meta">{portions} personen · {createdBy}</div>
      </div>
      <div className="recipe-card-arrow">›</div>
    </div>
  )
}
```

- [ ] **Step 2: Voeg RecipeCard CSS toe aan index.css**

Voeg toe aan het einde van `src/index.css`:
```css
/* RecipeCard */
.recipe-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.recipe-card-image { width: 56px; height: 56px; border-radius: 10px; overflow: hidden; background: var(--green-light); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.recipe-card-image img { width: 100%; height: 100%; object-fit: cover; }
.recipe-emoji, .recipe-spinner { font-size: 24px; }
.recipe-card-body { flex: 1; min-width: 0; }
.recipe-card-title { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.recipe-card-meta { font-size: 12px; color: #888; margin-top: 2px; }
.recipe-card-arrow { color: #ccc; font-size: 20px; }
```

- [ ] **Step 3: Implementeer RecipeList.jsx**

```jsx
// src/components/RecipeList.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToRecipes } from '../firebase'
import RecipeCard from './RecipeCard'

export default function RecipeList({ username }) {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => subscribeToRecipes(setRecipes), [])

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="topbar">
        <span>🥗 Recepten</span>
        <span style={{ fontSize: '13px', opacity: 0.8 }}>{username}</span>
      </div>
      <div className="search-bar">
        <input
          type="search"
          placeholder="Zoek recept..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>{search ? 'Geen recepten gevonden' : 'Nog geen recepten — voeg er een toe!'}</p>
          </div>
        )}
        {filtered.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => navigate(`/recepten/${recipe.id}`)}
          />
        ))}
      </div>
      <button className="fab" onClick={() => navigate('/recepten/nieuw')}>+</button>
    </div>
  )
}
```

- [ ] **Step 4: Voeg zoekbalk CSS toe aan index.css**

```css
/* Zoekbalk */
.search-bar { padding: 10px 14px; background: #f5f5f0; border-bottom: 1px solid #eee; }
.search-bar input { width: 100%; padding: 9px 14px; border-radius: 20px; border: 1px solid #ddd; font-size: 14px; background: white; outline: none; }
.empty-state { padding: 48px 24px; text-align: center; color: #888; }
```

- [ ] **Step 5: Verifieer in de browser**

```bash
npm run dev
```
Verwacht: navigeer naar Recepten-tab, zoekbalk en FAB zichtbaar. Nog geen recepten.

- [ ] **Step 6: Commit**

```bash
git add src/components/RecipeList.jsx src/components/RecipeCard.jsx src/index.css
git commit -m "feat: add recipe list and recipe card components"
```

---

## Task 9: RecipeForm

**Files:**
- Modify: `src/components/RecipeForm.jsx`

- [ ] **Step 1: Implementeer RecipeForm.jsx**

```jsx
// src/components/RecipeForm.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRecipe, updateRecipe, subscribeToRecipe } from '../firebase'
import { CATEGORIES } from '../categories'

const UNITS = ['g', 'kg', 'ml', 'liter', 'stuks', 'el', 'tl', 'snufje', 'naar smaak']

const emptyIngredient = () => ({ name: '', amount: '', unit: 'g', category: CATEGORIES[0] })

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
      setIngredients(recipe.ingredients?.length ? recipe.ingredients : [emptyIngredient()])
      setSteps(recipe.steps?.length ? recipe.steps : [''])
    })
  }, [id, isEditing])

  const updateIngredient = (index, field, value) => {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing))
  }

  const addIngredient = () => setIngredients(prev => [...prev, emptyIngredient()])
  const removeIngredient = (index) => setIngredients(prev => prev.filter((_, i) => i !== index))

  const updateStep = (index, value) => setSteps(prev => prev.map((s, i) => i === index ? value : s))
  const addStep = () => setSteps(prev => [...prev, ''])
  const removeStep = (index) => setSteps(prev => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
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
            <div key={i} className="ingredient-row">
              <input
                placeholder="Naam"
                value={ing.name}
                onChange={e => updateIngredient(i, 'name', e.target.value)}
                className="ing-name"
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
```

- [ ] **Step 2: Voeg form CSS toe aan index.css**

```css
/* RecipeForm */
.topbar-save { background: none; border: none; color: white; font-size: 15px; font-weight: 600; cursor: pointer; padding: 4px 8px; }
.form-body { padding: 16px; padding-bottom: 32px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; }
.form-group input, .form-group textarea { width: 100%; padding: 11px 13px; border: 1px solid #ddd; border-radius: 10px; font-size: 15px; outline: none; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--green); }
.form-section { margin-bottom: 24px; }
.form-section h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.ingredient-row { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.ing-name { flex: 2; min-width: 100px; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.ing-amount { width: 65px; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.ing-unit, .ing-cat { padding: 8px 6px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; background: white; }
.btn-remove { background: none; border: 1px solid #ddd; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; color: #999; font-size: 18px; flex-shrink: 0; }
.btn-add { background: none; border: 1.5px dashed #ccc; border-radius: 8px; padding: 8px 14px; font-size: 14px; color: #666; cursor: pointer; margin-top: 4px; }
.step-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }
.step-number { width: 24px; height: 24px; background: var(--green); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 10px; }
.step-row textarea { flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 14px; font-family: inherit; resize: none; }
```

- [ ] **Step 3: Verifieer in de browser**

```bash
npm run dev
```
Verwacht: klik op FAB → formulier met titel, omschrijving, ingrediënten, stappen. Opslaan maakt recept aan in Firestore (controleer Firebase Console).

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeForm.jsx src/index.css
git commit -m "feat: add recipe form for creating and editing recipes"
```

---

## Task 10: RecipeDetail

**Files:**
- Modify: `src/components/RecipeDetail.jsx`

- [ ] **Step 1: Implementeer RecipeDetail.jsx**

```jsx
// src/components/RecipeDetail.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { subscribeToRecipe, deleteRecipe } from '../firebase'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)

  useEffect(() => subscribeToRecipe(id, setRecipe), [id])

  if (!recipe) return <div className="empty-state"><p>Laden...</p></div>

  const handleDelete = async () => {
    if (window.confirm(`Recept "${recipe.title}" verwijderen?`)) {
      await deleteRecipe(id)
      navigate('/recepten')
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: '15px' }}>{recipe.title}</span>
        <button className="topbar-save" onClick={() => navigate(`/recepten/${id}/bewerken`)}>✏️</button>
      </div>

      <div className="detail-image-container">
        {recipe.imageStatus === 'done' && recipe.imageUrl
          ? <img src={recipe.imageUrl} alt={recipe.title} className="detail-image" />
          : recipe.imageStatus === 'error'
            ? <div className="detail-image-placeholder">🍽️</div>
            : <div className="detail-image-placeholder">
                <span>⏳</span>
                <p>AI-afbeelding wordt gegenereerd...</p>
              </div>
        }
        {recipe.imageStatus === 'done' && (
          <span className="ai-badge">✨ AI gegenereerd</span>
        )}
      </div>

      <div className="detail-body">
        <div className="detail-meta">{recipe.portions} personen · {recipe.createdBy}</div>
        {recipe.description && <p className="detail-description">{recipe.description}</p>}

        <h3>Ingrediënten</h3>
        <ul className="ingredients-list">
          {recipe.ingredients?.map((ing, i) => (
            <li key={i} className="ingredient-item">
              <span className="ing-amount-detail">{ing.amount} {ing.unit}</span>
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: '20px' }}>Bereiding</h3>
        <ol className="steps-list">
          {recipe.steps?.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <button className="btn-danger" onClick={handleDelete}>Verwijderen</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Voeg detail CSS toe aan index.css**

```css
/* RecipeDetail */
.detail-image-container { position: relative; }
.detail-image { width: 100%; height: 200px; object-fit: cover; display: block; }
.detail-image-placeholder { width: 100%; height: 200px; background: var(--green-light); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 48px; color: #888; }
.detail-image-placeholder p { font-size: 14px; }
.ai-badge { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; font-size: 11px; padding: 4px 8px; border-radius: 10px; }
.detail-body { padding: 16px; }
.detail-meta { font-size: 13px; color: #888; margin-bottom: 8px; }
.detail-description { font-size: 14px; color: #555; margin-bottom: 16px; }
.detail-body h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.ingredients-list { list-style: none; }
.ingredient-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.ing-amount-detail { color: var(--green); font-weight: 600; min-width: 80px; }
.steps-list { padding-left: 20px; }
.steps-list li { font-size: 14px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.5; }
```

- [ ] **Step 3: Verifieer in de browser**

```bash
npm run dev
```
Verwacht: klik op een recept in de lijst → detail met afbeelding (spinner zolang pending), ingrediënten en stappen.

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeDetail.jsx src/index.css
git commit -m "feat: add recipe detail screen with image status handling"
```

---

## Task 11: WeekPlanning + DayPicker

**Files:**
- Modify: `src/components/WeekPlanning.jsx`
- Create: `src/components/DayPicker.jsx`

- [ ] **Step 1: Implementeer DayPicker.jsx**

```jsx
// src/components/DayPicker.jsx
import { useState, useEffect } from 'react'
import { subscribeToRecipes } from '../firebase'

export default function DayPicker({ dayName, currentRecipeId, onSelect, onClose }) {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const [spans2Days, setSpans2Days] = useState(false)

  useEffect(() => subscribeToRecipes(setRecipes), [])

  const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>Recept kiezen voor {dayName}</span>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-search">
          <input
            type="search"
            placeholder="Zoek recept..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-list">
          <div className="modal-item modal-item-clear" onClick={() => onSelect(null, false)}>
            🗑️ Dag leeg maken
          </div>
          {filtered.map(recipe => (
            <div
              key={recipe.id}
              className={`modal-item ${recipe.id === currentRecipeId ? 'selected' : ''}`}
              onClick={() => onSelect(recipe.id, spans2Days)}
            >
              <span>{recipe.title}</span>
              <span className="modal-item-meta">{recipe.portions} pers.</span>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <label className="spans-toggle">
            <input
              type="checkbox"
              checked={spans2Days}
              onChange={e => setSpans2Days(e.target.checked)}
            />
            Dit recept is ook voor de volgende dag
          </label>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implementeer WeekPlanning.jsx**

```jsx
// src/components/WeekPlanning.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToWeekPlanning, setDayRecipe, subscribeToRecipes } from '../firebase'
import { getWeekId, getWeekDays, getPrevWeekId, getNextWeekId } from '../weekUtils'
import DayPicker from './DayPicker'

const DAY_SHORT = { maandag: 'Ma', dinsdag: 'Di', woensdag: 'Wo', donderdag: 'Do', vrijdag: 'Vr', zaterdag: 'Za', zondag: 'Zo' }

export default function WeekPlanning() {
  const [weekId, setWeekId] = useState(() => getWeekId())
  const [planning, setPlanning] = useState({ days: {} })
  const [recipes, setRecipes] = useState([])
  const [pickerDay, setPickerDay] = useState(null)
  const navigate = useNavigate()

  useEffect(() => subscribeToWeekPlanning(weekId, setPlanning), [weekId])
  useEffect(() => subscribeToRecipes(setRecipes), [])

  const days = getWeekDays()
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  const getEffectiveDay = (dayIndex) => {
    const day = days[dayIndex]
    const dayData = planning.days[day] || { recipeId: null, spans2Days: false }
    // Check of de vorige dag een spans2Days heeft die op deze dag valt
    if (!dayData.recipeId && dayIndex > 0) {
      const prevDay = days[dayIndex - 1]
      const prevData = planning.days[prevDay] || {}
      if (prevData.spans2Days && prevData.recipeId) {
        return { recipeId: prevData.recipeId, isSecondDay: true }
      }
    }
    return { recipeId: dayData.recipeId, isSecondDay: false, spans2Days: dayData.spans2Days }
  }

  const handleSelect = async (recipeId, spans2Days) => {
    await setDayRecipe(weekId, pickerDay, recipeId, spans2Days)
    setPickerDay(null)
  }

  const recipesInWeek = [...new Set(
    days.map((d, i) => getEffectiveDay(i).recipeId).filter(Boolean)
  )].map(id => recipeMap[id]).filter(Boolean)

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => setWeekId(getPrevWeekId(weekId))}>◀</button>
        <span>Week {weekId.split('-')[1]}</span>
        <button className="topbar-back" onClick={() => setWeekId(getNextWeekId(weekId))}>▶</button>
      </div>

      <div>
        {days.map((day, i) => {
          const { recipeId, isSecondDay, spans2Days } = getEffectiveDay(i)
          const recipe = recipeId ? recipeMap[recipeId] : null
          return (
            <div key={day} className="day-row" onClick={() => !isSecondDay && setPickerDay(day)}>
              <div className="day-label">{DAY_SHORT[day]}</div>
              {recipe ? (
                <div className={`day-recipe ${isSecondDay ? 'second-day' : ''}`}>
                  <span>{recipe.title}</span>
                  {isSecondDay && <span className="day-badge">2e dag</span>}
                  {spans2Days && !isSecondDay && <span className="day-badge">→2</span>}
                </div>
              ) : (
                <div className="day-empty">+ Recept kiezen</div>
              )}
            </div>
          )
        })}
      </div>

      {recipesInWeek.length > 0 && (
        <div style={{ padding: '16px' }}>
          <button className="btn-primary" onClick={() => navigate('/boodschappen')}>
            🛒 Naar boodschappenlijst ({recipesInWeek.length} recepten)
          </button>
        </div>
      )}

      {pickerDay && (
        <DayPicker
          dayName={pickerDay}
          currentRecipeId={planning.days[pickerDay]?.recipeId}
          onSelect={handleSelect}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Voeg planning CSS toe aan index.css**

```css
/* WeekPlanning */
.day-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.day-label { width: 30px; font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; flex-shrink: 0; }
.day-recipe { flex: 1; background: var(--green-light); border-radius: 8px; padding: 8px 12px; font-size: 13px; font-weight: 500; color: var(--green); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.day-recipe.second-day { opacity: 0.65; }
.day-empty { flex: 1; border: 1.5px dashed #ddd; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #bbb; }
.day-badge { font-size: 11px; background: white; border-radius: 4px; padding: 2px 6px; color: var(--green); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: flex-end; }
.modal { background: white; border-radius: 20px 20px 0 0; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; font-weight: 700; font-size: 16px; border-bottom: 1px solid #eee; }
.modal-header button { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; }
.modal-search { padding: 12px 16px; border-bottom: 1px solid #eee; }
.modal-search input { width: 100%; padding: 9px 14px; border-radius: 20px; border: 1px solid #ddd; font-size: 14px; outline: none; }
.modal-list { overflow-y: auto; flex: 1; }
.modal-item { padding: 14px 20px; border-bottom: 1px solid #f5f5f5; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 15px; }
.modal-item.selected { background: var(--green-light); }
.modal-item-clear { color: #d32f2f; }
.modal-item-meta { font-size: 12px; color: #888; }
.modal-footer { padding: 14px 20px; border-top: 1px solid #eee; }
.spans-toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; }
.spans-toggle input { width: 18px; height: 18px; accent-color: var(--green); }
```

- [ ] **Step 4: Verifieer in de browser**

```bash
npm run dev
```
Verwacht: navigeer naar Planning-tab, week zichtbaar, klik op dag → DayPicker modal, recept kiezen werkt.

- [ ] **Step 5: Commit**

```bash
git add src/components/WeekPlanning.jsx src/components/DayPicker.jsx src/index.css
git commit -m "feat: add week planning with day picker and 2-day recipe support"
```

---

## Task 12: ShoppingList component

**Files:**
- Modify: `src/components/ShoppingList.jsx`
- Create: `src/components/PicnicModal.jsx`

- [ ] **Step 1: Implementeer ShoppingList.jsx**

```jsx
// src/components/ShoppingList.jsx
import { useState, useEffect } from 'react'
import { subscribeToWeekPlanning, subscribeToRecipes } from '../firebase'
import { getWeekId, getWeekDays } from '../weekUtils'
import { aggregateIngredients } from '../shoppingList'
import PicnicModal from './PicnicModal'

export default function ShoppingList() {
  const weekId = getWeekId()
  const [planning, setPlanning] = useState({ days: {} })
  const [recipes, setRecipes] = useState([])
  const [checked, setChecked] = useState({})
  const [showPicnic, setShowPicnic] = useState(false)

  useEffect(() => subscribeToWeekPlanning(weekId, setPlanning), [weekId])
  useEffect(() => subscribeToRecipes(setRecipes), [])

  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))
  const days = getWeekDays()

  const activeRecipeIds = [...new Set(
    days.flatMap((day, i) => {
      const d = planning.days[day] || {}
      if (d.recipeId) return [d.recipeId]
      if (i > 0) {
        const prev = planning.days[days[i - 1]] || {}
        if (prev.spans2Days && prev.recipeId) return [prev.recipeId]
      }
      return []
    })
  )]

  const activeRecipes = activeRecipeIds.map(id => recipeMap[id]).filter(Boolean)
  const grouped = aggregateIngredients(activeRecipes)
  const categories = Object.keys(grouped).sort()

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  const itemKey = (cat, name, unit) => `${cat}|${name}|${unit}`

  const allIngredients = categories.flatMap(cat =>
    grouped[cat].map(ing => ({ ...ing, category: cat }))
  )

  if (activeRecipes.length === 0) {
    return (
      <div>
        <div className="topbar"><span>🛒 Boodschappen</span></div>
        <div className="empty-state"><p>Nog geen recepten gepland voor deze week</p></div>
      </div>
    )
  }

  return (
    <div>
      <div className="topbar">
        <span>🛒 Boodschappen</span>
        <span style={{ fontSize: '13px', opacity: 0.8 }}>Week {weekId.split('-')[1]}</span>
      </div>

      <div className="shopping-summary">
        {activeRecipes.length} recepten · {allIngredients.length} ingrediënten
      </div>

      <div>
        {categories.map(cat => (
          <div key={cat}>
            <div className="category-label">{cat}</div>
            {grouped[cat].map((ing, i) => {
              const key = itemKey(cat, ing.name, ing.unit)
              return (
                <div key={i} className="shopping-item" onClick={() => toggleCheck(key)}>
                  <div className={`check-circle ${checked[key] ? 'checked' : ''}`}>
                    {checked[key] && '✓'}
                  </div>
                  <span className={`shopping-item-name ${checked[key] ? 'crossed' : ''}`}>{ing.name}</span>
                  <span className="shopping-item-amount">{ing.amount} {ing.unit}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <button className="btn-picnic" onClick={() => setShowPicnic(true)}>
          🚲 Verstuur naar Picnic
        </button>
      </div>

      {showPicnic && (
        <PicnicModal
          ingredients={allIngredients}
          onClose={() => setShowPicnic(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implementeer PicnicModal.jsx**

```jsx
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
```

- [ ] **Step 3: Voeg shopping list CSS toe aan index.css**

```css
/* ShoppingList */
.shopping-summary { padding: 10px 16px; font-size: 13px; color: #888; background: #f9f9f7; border-bottom: 1px solid #eee; }
.category-label { padding: 8px 16px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; background: #fafaf8; }
.shopping-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.check-circle { width: 22px; height: 22px; border-radius: 11px; border: 2px solid #ddd; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.check-circle.checked { background: var(--green); border-color: var(--green); color: white; }
.shopping-item-name { flex: 1; font-size: 15px; }
.shopping-item-name.crossed { text-decoration: line-through; color: #aaa; }
.shopping-item-amount { font-size: 13px; color: #888; }
```

- [ ] **Step 4: Verifieer in de browser**

```bash
npm run dev
```
Verwacht: navigeer naar Boodschappen-tab na recepten te plannen. Ingrediëntenlijst per categorie, vinkjes werken, Picnic-knop opent modal.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShoppingList.jsx src/components/PicnicModal.jsx src/index.css
git commit -m "feat: add shopping list with grouped ingredients and Picnic modal"
```

---

## Task 13: Vercel serverless function — Picnic

**Files:**
- Create: `api/picnic-add.js`
- Modify: `vercel.json`

- [ ] **Step 1: Maak vercel.json aan**

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Maak api/picnic-add.js aan**

```js
// api/picnic-add.js
import crypto from 'crypto'

const BASE_URL = 'https://storefront-prod.nl.picnicinternational.com/api/15'
const AGENT = '30100;1.0;17.28.0;Samsung;Android/17.28.0;nl;01'

async function picnicLogin(email, password) {
  const passwordHash = crypto.createHash('md5').update(password).digest('hex')
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-picnic-agent': AGENT,
    },
    body: JSON.stringify({ key: email, secret: passwordHash, client_id: 1 }),
  })
  if (!res.ok) throw new Error('Picnic login mislukt — controleer e-mail en wachtwoord')
  return res.headers.get('x-picnic-auth')
}

async function searchProduct(authToken, searchTerm) {
  const res = await fetch(`${BASE_URL}/search?search_term=${encodeURIComponent(searchTerm)}`, {
    headers: { 'x-picnic-auth': authToken, 'x-picnic-agent': AGENT },
  })
  const data = await res.json()
  // Picnic search returns array of categories, first item in first category
  return data?.[0]?.items?.[0]?.id || null
}

async function addToCart(authToken, productId) {
  await fetch(`${BASE_URL}/cart/add_product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-picnic-auth': authToken,
      'x-picnic-agent': AGENT,
    },
    body: JSON.stringify({ product_id: productId, count: 1 }),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, ingredients } = req.body
  if (!email || !password || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Verplichte velden ontbreken' })
  }

  try {
    const authToken = await picnicLogin(email, password)
    const added = []
    const failed = []

    for (const ing of ingredients) {
      const productId = await searchProduct(authToken, ing.name)
      if (productId) {
        await addToCart(authToken, productId)
        added.push(ing.name)
      } else {
        failed.push(ing.name)
      }
    }

    res.status(200).json({ added, failed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
```

> **Let op:** De Picnic-API is inofficieel. Als Picnic hun app update, kunnen endpoints of headers veranderen. Test na elke Picnic-app-update.

- [ ] **Step 3: Verifieer lokaal met Vercel CLI**

```bash
npm install -g vercel
vercel dev
```
Verwacht: app draait op http://localhost:3000, `/api/picnic-add` is bereikbaar.

- [ ] **Step 4: Commit**

```bash
git add api/picnic-add.js vercel.json
git commit -m "feat: add Vercel serverless function for Picnic integration"
```

---

## Task 14: Firebase Cloud Function — Vertex AI Imagen

**Files:**
- Create: `functions/package.json`
- Create: `functions/index.js`
- Create: `firebase.json`
- Create: `.firebaserc`

- [ ] **Step 1: Installeer Firebase CLI en initialiseer**

```bash
npm install -g firebase-tools
firebase login
firebase init
```
Selecteer: **Functions** en **Storage**. Kies bestaand project. Runtime: **Node.js 20**. Geen ESLint.

- [ ] **Step 2: Installeer dependencies in functions/**

```bash
cd functions
npm install @google-cloud/aiplatform firebase-admin firebase-functions
cd ..
```

- [ ] **Step 3: Schrijf functions/index.js**

```js
// functions/index.js
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1
const { helpers } = require('@google-cloud/aiplatform')

initializeApp()

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT
const LOCATION = 'us-central1'
const MODEL = 'imagegeneration@006'

const predictionClient = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
})

exports.generateRecipeImage = onDocumentCreated(
  { document: 'recipes/{recipeId}', region: 'europe-west4', timeoutSeconds: 120 },
  async (event) => {
    const recipeId = event.params.recipeId
    const recipe = event.data.data()
    const db = getFirestore()
    const bucket = getStorage().bucket()

    const prompt = `Food photography of ${recipe.title}, ${recipe.description || 'delicious home-cooked meal'}, appetizing, professional, natural lighting`

    try {
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}`
      const [response] = await predictionClient.predict({
        endpoint,
        instances: [helpers.toValue({ prompt })],
        parameters: helpers.toValue({ sampleCount: 1, aspectRatio: '1:1' }),
      })

      const prediction = helpers.fromValue(response.predictions[0])
      const base64Image = prediction.bytesBase64Encoded
      const imageBuffer = Buffer.from(base64Image, 'base64')

      const filePath = `recipe-images/${recipeId}.jpg`
      const file = bucket.file(filePath)
      await file.save(imageBuffer, { contentType: 'image/jpeg', public: true })

      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

      await db.collection('recipes').doc(recipeId).update({
        imageUrl,
        imageStatus: 'done',
      })
    } catch (err) {
      console.error('Vertex AI fout:', err.message)
      await db.collection('recipes').doc(recipeId).update({
        imageStatus: 'error',
      })
    }
  }
)
```

- [ ] **Step 4: Stel Firebase Storage rules in**

In de Firebase Console → Storage → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recipe-images/{imageId} {
      allow read: if true;
      allow write: if false; // Alleen Cloud Function schrijft
    }
  }
}
```

- [ ] **Step 5: Stel Firestore rules in**

In Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Thuis-app: iedereen met de URL heeft toegang
    }
  }
}
```

- [ ] **Step 6: Activeer Vertex AI API**

Ga naar https://console.cloud.google.com/apis/library/aiplatform.googleapis.com en klik **Enable** voor jouw project.

- [ ] **Step 7: Deploy Cloud Function**

```bash
firebase deploy --only functions
```
Verwacht: `generateRecipeImage` is gedeployed. Maak een nieuw recept aan in de app → na 20-30 seconden verschijnt de afbeelding automatisch.

- [ ] **Step 8: Commit**

```bash
git add functions/ firebase.json .firebaserc
git commit -m "feat: add Firebase Cloud Function for Vertex AI image generation"
```

---

## Task 15: Deployment

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Push naar GitHub**

```bash
git remote add origin https://github.com/<jouw-username>/recept-app.git
git push -u origin main
```

- [ ] **Step 2: Koppel repo aan Vercel**

1. Ga naar https://vercel.com/new
2. Importeer de `recept-app` GitHub-repo
3. Build settings: **Vite** (auto-detected), root directory: `/`

- [ ] **Step 3: Stel environment variables in op Vercel**

In Vercel project → Settings → Environment Variables, voeg toe:
```
VITE_FIREBASE_API_KEY         = <waarde>
VITE_FIREBASE_AUTH_DOMAIN     = <waarde>
VITE_FIREBASE_PROJECT_ID      = <waarde>
VITE_FIREBASE_STORAGE_BUCKET  = <waarde>
VITE_FIREBASE_MESSAGING_SENDER_ID = <waarde>
VITE_FIREBASE_APP_ID          = <waarde>
VITE_SHARED_PASSWORD          = <gekozen wachtwoord>
```

- [ ] **Step 4: Deploy**

```bash
vercel --prod
```
Of push naar `main` — Vercel deployt automatisch.

- [ ] **Step 5: Verifieer de live app**

1. Open de Vercel-URL
2. Log in met het gedeelde wachtwoord
3. Voeg een testrecept toe → wacht 30 seconden → afbeelding verschijnt
4. Stel weekplanning in → boodschappenlijst → Picnic-knop testen

- [ ] **Step 6: Voeg Vercel-URL toe aan commit**

```bash
git commit --allow-empty -m "chore: deployed to Vercel — app is live"
```

---

## Samenvatting

| Taak | Wat het oplevert |
|------|-----------------|
| 1 | Project setup, Vite + Firebase + Vitest |
| 2 | Categorielijst met tests |
| 3 | Week-utilities met tests |
| 4 | Boodschappenlogica met tests |
| 5 | Firebase Firestore + Storage CRUD |
| 6 | Login met gedeeld wachtwoord |
| 7 | App shell, routing, bottom nav |
| 8 | Receptenlijst + zoeken |
| 9 | Recept toevoegen/bewerken |
| 10 | Recept detail + afbeeldingsstatus |
| 11 | Weekplanning + dagkiezer |
| 12 | Boodschappenlijst + Picnic modal |
| 13 | Vercel serverless function → Picnic API |
| 14 | Firebase Cloud Function → Vertex AI Imagen |
| 15 | Deployment op Vercel |
