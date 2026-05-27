// src/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, getDoc, setDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, signInAnonymously } from 'firebase/auth'

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
const auth = getAuth(app)

export function signInAsGuest() {
  return signInAnonymously(auth)
}

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

export async function regenerateRecipeImage(id) {
  await updateDoc(doc(db, 'recipes', id), { imageUrl: null, imageStatus: 'pending', regenerateAt: serverTimestamp() })
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
  const docRef = doc(db, 'weekplanning', weekId)
  await setDoc(docRef, {
    days: {
      [dayName]: { recipeId: recipeId || null, spans2Days: spans2Days || false }
    }
  }, { merge: true })
}

export async function moveDayRecipe(weekId, fromDay, toDay, recipeId, spans2Days) {
  const docRef = doc(db, 'weekplanning', weekId)
  await setDoc(docRef, {
    days: {
      [fromDay]: { recipeId: null, spans2Days: false },
      [toDay]: { recipeId, spans2Days: spans2Days || false }
    }
  }, { merge: true })
}
