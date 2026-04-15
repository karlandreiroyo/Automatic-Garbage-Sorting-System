import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aezdtsjycbsygqnsvkbz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemR0c2p5Y2JzeWdxbnN2a2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MTEsImV4cCI6MjA4MjMwNTgxMX0.q6DYxzIGPJLt8_2Aop1HQ31VkGk0OP9ODwy7CTJoN2I'

const projectRef = (() => {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || 'default'
  } catch {
    return 'default'
  }
})()

const hostSuffix = typeof window !== 'undefined' ? window.location.hostname : 'browser'
const storageKey = `sb-${projectRef}-auth-token-${hostSuffix}`
const legacyStorageKey = `sb-${projectRef}-auth-token`

const safeStorage = {
  getItem: (key) => {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Prevent Supabase auto-refresh from using malformed or stale entries.
      if (!parsed || (!parsed.refresh_token && !parsed.currentSession?.refresh_token)) {
        window.localStorage.removeItem(key)
        return null
      }
      return raw
    } catch {
      window.localStorage.removeItem(key)
      return null
    }
  },
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
}

if (typeof window !== 'undefined') {
  try {
    const legacyRaw = window.localStorage.getItem(legacyStorageKey)
    if (legacyRaw && !window.localStorage.getItem(storageKey)) {
      const legacyParsed = JSON.parse(legacyRaw)
      if (legacyParsed && (legacyParsed.refresh_token || legacyParsed.currentSession?.refresh_token)) {
        window.localStorage.setItem(storageKey, legacyRaw)
      }
    }
    // Remove old key so deployed/local sessions do not conflict.
    window.localStorage.removeItem(legacyStorageKey)
  } catch {
    // ignore storage migration failures
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeStorage,
    storageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// to install the library, paste this to your terminal
// "npm install @supabase\supabase-js"