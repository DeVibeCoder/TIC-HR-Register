import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:    true,   // keeps user logged in across page reloads
    autoRefreshToken:  true,   // silently refreshes the JWT before it expires
    detectSessionInUrl: false, // we don't use magic-link / OAuth redirects
  },
})

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert a plain username to the internal email Supabase stores.
 *  e.g.  "admin"  →  "admin@tic-hr.local"
 */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@tic-hr.local`
}

/** Extract the username back from the internal email.
 *  e.g.  "admin@tic-hr.local"  →  "admin"
 */
export function emailToUsername(email: string): string {
  return email.split('@')[0]
}
