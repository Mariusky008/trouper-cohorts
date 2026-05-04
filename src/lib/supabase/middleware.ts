import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '../env'

function cookieDomainForHost(host: string) {
  const hostname = String(host || "").split(":")[0].toLowerCase();
  // Share auth cookies between `popey.academy` and `www.popey.academy`.
  if (/(^|\.)popey\.academy$/.test(hostname)) return ".popey.academy";
  return undefined;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const domain = cookieDomainForHost(request.headers.get("host") || "")
    const supabase = createServerClient(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        // Important: ensure cookies are sent on both `/popey-human/*` and `/admin/*`.
        cookieOptions: { path: "/", ...(domain ? { domain } : {}) },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    return { response, user }
  } catch (error) {
    console.error("[proxy] updateSession failed, fallback as anonymous", error)
    return { response, user: null }
  }
}
