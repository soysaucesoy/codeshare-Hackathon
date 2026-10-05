// utils/supabase/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr' // CookieOptionsは必要に応じて残す
import { NextResponse, type NextRequest } from 'next/server'
import {
  getHomePathForUserType,
  getUserTypeMismatchRedirect,
  isAuthLoginPage,
  isProtectedPath,
  UNAUTHENTICATED_REDIRECT,
} from '@/lib/auth/routes'

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

  // セッションのリフレッシュ（Cookieの更新）とユーザー取得
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 未ログインで保護ページへアクセス → トップへ
  if (!user && isProtectedPath(pathname)) {
    return redirectWithCookies(request, response, UNAUTHENTICATED_REDIRECT)
  }

  if (!user) return response

  // auth metadataにuser_typeがない場合のみDBから取得（AuthProviderと同じ判定）
  const resolveUserType = async () => {
    if (user.user_metadata?.user_type) return user.user_metadata.user_type
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle()
    return userData?.user_type
  }

  // ログイン済みでログインページへアクセス → ユーザー種別ごとの遷移先へ
  if (isAuthLoginPage(pathname)) {
    return redirectWithCookies(request, response, getHomePathForUserType(await resolveUserType()))
  }

  // 別種別の専用ページへアクセス（例: 事業者が /user/mypage）→ 自分のマイページへ
  if (isProtectedPath(pathname)) {
    const mismatchRedirect = getUserTypeMismatchRedirect(pathname, await resolveUserType())
    if (mismatchRedirect) {
      return redirectWithCookies(request, response, mismatchRedirect)
    }
  }

  return response
}

// リフレッシュされたセッションCookieを引き継いでリダイレクトする
function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const redirectResponse = NextResponse.redirect(url)
  response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
  return redirectResponse
}
