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
