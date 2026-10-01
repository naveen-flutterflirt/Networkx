// store.ts — updated to use new API client exports
// All page imports (getUser, loginUser, logoutUser, useStore) work unchanged.

import { useState, useEffect } from 'react'
import { TokenStore, AuthAPI } from './api'

const KEY = 'nia_user'
const EVENT = 'nia_user_change'

export function getUser(): any | null {
  if (typeof window === 'undefined') return null
  // Try new TokenStore first, fallback to old key
  return TokenStore.getUser() || (() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()
}

function saveUser(u: any) {
  localStorage.setItem(KEY, JSON.stringify(u))
  TokenStore.setUser(u)
  window.dispatchEvent(new Event(EVENT))
}

// loginUser() — same signature as original
// Calls the real authentication API. Authentication must fail closed when the
// API is unavailable; client-side fallback users would bypass backend checks.
export async function loginUser(email: string, password = ''): Promise<boolean> {
  try {
    const res = await AuthAPI.login(email, password)
    // AuthAPI.login already sets TokenStore tokens + user
    // Also save to old KEY for backwards compat
    if (res.user) saveUser(res.user)
    return true
  } catch { return false }
}

export function logoutUser() {
  TokenStore.clear()
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event(EVENT))
}

export function useStore() {
  const [user, setUser] = useState<any | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setUser(getUser())
    setHydrated(true)
    const handler = () => setUser(getUser())
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  return { user, hydrated, login: loginUser, logout: logoutUser }
}
