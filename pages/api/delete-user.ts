// pages/api/delete-user.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Admin用のSupabaseクライアント
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 通常のSupabaseクライアント（認証確認用）
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type DeleteUserResponse = {
  success: boolean
  message?: string
  method?: string
  error?: string
  deletedUserId?: string
  timestamp: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteUserResponse>
) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    })
  }

  try {
    console.log('=== ユーザー削除API開始 ===')
    
    const { userId, authToken } = req.body

    // バリデーション
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ユーザーIDが必要です',
        timestamp: new Date().toISOString()
      })
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: '認証トークンが必要です',
        timestamp: new Date().toISOString()
      })
    }

    // 認証確認
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authToken)
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
      return res.status(401).json({
        success: false,
        error: '認証に失敗しました',
        timestamp: new Date().toISOString()
      })
    }

    // 本人確認
    if (user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: '自分のアカウントのみ削除可能です',
        timestamp: new Date().toISOString()
      })
    }

    console.log('✓ 認証確認完了:', userId)

    // データベース削除
    console.log('=== データベース削除開始 ===')
    
    const deleteResults = await Promise.allSettled([
      supabaseAdmin.from('user_bookmarks').delete().eq('user_id', userId),
      supabaseAdmin.from('user_details').delete().eq('user_id', userId),
      supabaseAdmin.from('users').delete().eq('id', userId)
    ])

    console.log('データベース削除結果:', deleteResults)

    // 認証情報削除
    console.log('=== 認証情報削除開始 ===')
    
    const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('認証削除エラー:', deleteError)
      
      if (deleteError.message?.includes('User not found')) {
        return res.json({
          success: true,
          message: 'アカウントは既に削除されています',
          method: 'already_deleted',
          timestamp: new Date().toISOString()
        })
      }
      
      return res.json({
        success: true,
        message: 'データを削除しましたが、認証情報の削除に失敗しました',
        method: 'partial_deletion',
        timestamp: new Date().toISOString()
      })
    }

    console.log('✓ 認証削除成功')

    return res.json({
      success: true,
      message: 'アカウントを完全に削除しました',
      method: 'complete_deletion',
      deletedUserId: userId,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('API エラー:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || '削除処理中にエラーが発生しました',
      timestamp: new Date().toISOString()
    })
  }
}