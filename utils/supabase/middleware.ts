// utils/supabase/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr' // CookieOptionsは必要に応じて残す
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          return request.cookies.get(name)?.value
        },
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  // セッションのリフレッシュのみ行い、リダイレクトはクライアント側(AuthProvider)に任せる
  await supabase.auth.getUser()

  return response
}