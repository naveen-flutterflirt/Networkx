// auth.ts — updated to use new API client exports

import { TokenStore, AuthAPI } from './api'

const KEY = 'nia_one_user'

export function getUser(): any | null {
  if (typeof window === 'undefined') return null
  // First try new key, fallback to old key (checking both storages since
  // remember=false puts everything in sessionStorage instead of localStorage)
  return TokenStore.getUser() || (() => {
    try {
      const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()
}

export async function login(email: string, password: string, remember: boolean = true): Promise<any> {
  const res = await AuthAPI.login(email, password, remember)
  // AuthAPI.login already calls TokenStore.setTokens + setUser internally
  // Also save to old KEY for backwards compat with any components still reading it
  if (res.user) {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(res.user))
  }
  // Returns the user object (was just `true`) so the caller can read
  // membership_status and decide whether to land on /dashboard or send
  // an unpaid account to /pricing instead.
  return res.user
}

export async function loginWithOtp(email: string, otp: string, remember: boolean = true): Promise<any> {
  const res = await AuthAPI.verifyOtp(email, otp, remember)
  // Same legacy-KEY mirror as login() above, so components reading the
  // old key work regardless of which of the two sign-in methods was used.
  if (res.user) {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(res.user))
  }
  return res.user
}

export function logout() {
  TokenStore.clear()
  localStorage.removeItem(KEY)
  sessionStorage.removeItem(KEY)
}
