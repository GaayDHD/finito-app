import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// "Remember me": when off, the session lives in sessionStorage (cleared when the
// browser closes); when on (default), it persists in localStorage.
const REMEMBER_KEY = 'finito-remember'

export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

function activeStorage(): Storage {
  try {
    return localStorage.getItem(REMEMBER_KEY) === 'false' ? sessionStorage : localStorage
  } catch {
    return localStorage
  }
}

const rememberAwareStorage = {
  getItem: (key: string) => activeStorage().getItem(key),
  setItem: (key: string, value: string) => activeStorage().setItem(key, value),
  removeItem: (key: string) => activeStorage().removeItem(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rememberAwareStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
