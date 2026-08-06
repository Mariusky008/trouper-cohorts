import { createBrowserClient } from '@supabase/ssr'
import { env } from '../env'
import { cookieDomainForHost } from './cookie-domain'

export function createClient() {
  const domain = typeof window !== "undefined" ? cookieDomainForHost(window.location.hostname) : undefined;
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    // Important: ensure cookies are sent on both `/popey-human/*` and `/admin/*`.
    cookieOptions: { path: "/", ...(domain ? { domain } : {}) },
  })
}
