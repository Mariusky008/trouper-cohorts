import { createClient } from '@supabase/supabase-js'

/** `fetch` : (⏱️ 27 novembre 2026) pour chronométrer les demandes à la base d'une page (`univers/salons/chrono.tsx`). */
export function createAdminClient(options?: { fetch?: typeof fetch }) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      ...(options?.fetch ? { global: { fetch: options.fetch } } : {})
    }
  )
}
