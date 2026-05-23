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
