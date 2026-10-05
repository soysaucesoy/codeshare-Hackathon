// lib/auth/api-auth.ts - API Routes 用の認証ヘルパー
import type { NextApiRequest } from 'next'
import { createClient, type User } from '@supabase/supabase-js'

// Authorization: Bearer <access_token> ヘッダーからログインユーザーを取得する
// トークンが未指定・無効な場合は null を返す
export async function getUserFromRequest(req: NextApiRequest): Promise<User | null> {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) return null

  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}
