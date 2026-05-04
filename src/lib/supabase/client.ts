import { createBrowserClient } from '@supabase/ssr'
import { env } from '../env'

function cookieDomainForHost(hostname: string) {
  const host = String(hostname || "").split(":")[0].toLowerCase();
  // Share auth cookies between `popey.academy` and `www.popey.academy`.
  if (/(^|\.)popey\.academy$/.test(host)) return ".popey.academy";
  return undefined;
}

export function createClient() {
  const domain = typeof window !== "undefined" ? cookieDomainForHost(window.location.hostname) : undefined;
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: domain ? { domain } : undefined,
  })
}
