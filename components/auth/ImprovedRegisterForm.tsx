// components/auth/ImprovedRegisterForm.tsx
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Lock, Home } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
// import { supabase } from '@/lib/supabase/client' // もう不要
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '@/lib/supabase'

const ImprovedRegisterForm: React.FC = () => {
  const router = useRouter()
  const { signUpWithEmail, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading || authLoading) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log('=== 新規登録開始（統合AuthProvider使用） ===')
    console.log('フォームデータ:', formData)

    // 簡単なバリデーション
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('すべての項目を入力してください')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      console.log('AuthProvider経由でsignUpWithEmailを呼び出し中...')
      
      // AuthProvider経由でサインアップ
      const { data: authData, error: authError } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.fullName
      )

      console.log('AuthProvider signUpWithEmail結果:', {
        user: authData?.user?.id,
        session: authData?.session?.access_token ? 'あり' : 'なし',
        error: authError
      })

      if (authError) {
        console.error('=== 認証エラー詳細分析 ===')
        console.error('エラーオブジェクト全体:', authError)
        console.error('エラータイプ:', typeof authError)
        console.error('エラーのキー:', Object.keys(authError))
        
        // authErrorの詳細をすべて出力
        const errorAnalysis = {
          message: authError.message,
          status: (authError as any).status,
          statusText: (authError as any).statusText,
          code: (authError as any).code,
          details: (authError as any).details,
          hint: (authError as any).hint,
          __isAuthError: (authError as any).__isAuthError
        }
        console.error('詳細分析:', errorAnalysis)
        
        // しかし、CSVにデータが存在するので、実際には成功している可能性
        console.warn('⚠️ 注意: CSVデータには新しいユーザーが存在するため、実際には登録が成功している可能性があります')
        
        // 日本語エラーメッセージに変換
        let errorMessage = 'アカウント作成に失敗しました'
        
        if (authError.message) {
          if (authError.message.includes('already registered') || 
              authError.message.includes('User already registered')) {
            errorMessage = 'このメールアドレスは既に登録されています'
          } else if (authError.message.includes('invalid email') ||
                     authError.message.includes('Invalid email')) {
            errorMessage = '無効なメールアドレスです'
          } else if (authError.message.includes('password') ||
                     authError.message.includes('Password')) {
            errorMessage = 'パスワードが要件を満たしていません（6文字以上の英数字）'
          } else if (authError.message.includes('network') ||
                     authError.message.includes('fetch')) {
            errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください'
          } else if (authError.message.includes('Invalid API key') ||
                     authError.message.includes('unauthorized')) {
            errorMessage = 'API設定エラーです。管理者にお問い合わせください'
          } else if (authError.message.includes('Database error')) {
            errorMessage = 'データベースエラーが発生しました。しばらく待ってから再試行してください'
          } else {
            errorMessage = `登録に失敗しました: ${authError.message}`
          }
        }
        
        setError(errorMessage)
        
        // 部分的成功の可能性をユーザーに示す
        if (authError.message?.includes('Database error') || 
            authError.message?.includes('saving new user')) {
          setSuccess('認証は完了している可能性があります。ログインを試行してください。')
        }
        
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした')
      }

      console.log('認証成功、ユーザーID:', userId)

      // データベースレコードの作成を試行
      try {
        console.log('=== データベースレコード作成開始 ===')
        
        // サーバーサイド関数でユーザーレコードを作成
        const { data: userCreationResult, error: userCreationError } = await supabase
          .rpc('upsert_user_profile', {
            p_user_id: userId,
            p_email: formData.email,
            p_full_name: formData.fullName,
            p_phone_number: null,
            p_district: null
          })

        console.log('ユーザー作成関数結果:', {
          result: userCreationResult,
          error: userCreationError
        })

        if (userCreationError) {
          console.error('ユーザーレコード作成エラー:', userCreationError)
          
          // 認証は成功したが、データベース保存で失敗した場合の処理
          setError(`データベース保存に失敗しましたが、認証は完了しています。管理者にお問い合わせください。エラー: ${userCreationError.message}`)
          
          // 一部成功として扱い、メール確認画面に進むかどうか選択可能にする
          setSuccess(`認証は完了しました。${authData.user?.email_confirmed_at ? 'ログインページに進んでください。' : 'メール確認が必要です。'}`)
        } else if (!userCreationResult?.success) {
          console.error('ユーザーレコード作成失敗:', userCreationResult)
          setError(`データベース保存に失敗しました: ${userCreationResult?.error || '不明なエラー'}`)
          setSuccess('認証は完了していますが、プロフィール作成で問題が発生しました。')
        } else {
          console.log('データベースレコード作成成功')
          
          // 完全成功の場合
          if (authData.user?.email_confirmed_at) {
            // メール確認済みの場合（開発環境等）
            setSuccess('アカウント作成が完了しました！ログインページに移動します。')
            setTimeout(() => router.push('/auth/login'), 2000)
          } else {
            // メール確認待ちの場合
            setSuccess('アカウント作成が完了しました！メール確認画面に移動します。')
            setTimeout(() => router.push('/auth/verify-email'), 2000)
          }
        }

      } catch (dbError) {
        console.error('データベース処理例外:', dbError)
        setError('データベース処理で予期しないエラーが発生しました')
        setSuccess('認証は完了していますが、プロフィール作成で問題が発生しました。')
      }

    } catch (err: any) {
      console.error('登録プロセス全体エラー:', err)
      setError(err.message || 'アカウント作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        {/* トップナビゲーション */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}>
          <Link 
            href="/auth/login" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = '#f3f4f6'
              ;(e.target as HTMLAnchorElement).style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'
              ;(e.target as HTMLAnchorElement).style.color = '#6b7280'
            }}
          >
            <ArrowLeft size={16} />
            ログイン
          </Link>

          <Link 
            href="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#22c55e',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = '#f0fdf4'
              ;(e.target as HTMLAnchorElement).style.color = '#16a34a'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'
              ;(e.target as HTMLAnchorElement).style.color = '#22c55e'
            }}
          >
            <Home size={16} />
            トップページ
          </Link>
        </div>

        {/* メインコンテンツ */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="logo">C</div>
            <span className="main-title">ケアコネクト</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            新規アカウント作成
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            基本情報を入力してアカウントを作成してください
          </p>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          {/* エラーメッセージ */}
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              color: '#b91c1c', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem', 
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {error}
            </div>
          )}

          {/* 成功メッセージ */}
          {success && (
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              color: '#166534', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem', 
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                お名前 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <Input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="山田 太郎"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                メールアドレス <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                パスワード <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="6文字以上で入力"
                required
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                6文字以上の英数字を組み合わせてください
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading || authLoading}
              className="w-full cta-primary"
              disabled={loading || authLoading}
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading || authLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  アカウント作成中...
                </div>
              ) : (
                'アカウント作成'
              )}
            </Button>
          </form>

          {/* デバッグ情報（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#f0f9ff', 
              borderRadius: '0.5rem', 
              border: '1px solid #bae6fd' 
            }}>
              <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                🛠️ 開発環境デバッグ情報
              </p>
              <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0 }}>
                • 認証とデータベース保存を分離して処理<br/>
                • エラー発生箇所を特定してログ出力<br/>
                • 部分的成功の場合も適切に案内
              </p>
            </div>
          )}

          {/* 利用規約・プライバシーポリシー */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            アカウント作成により、
            <a href="/terms" style={{ color: '#22c55e', textDecoration: 'none' }}>利用規約</a>
            と
            <a href="/privacy" style={{ color: '#22c55e', textDecoration: 'none' }}>プライバシーポリシー</a>
            に同意したものとみなされます
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              すでにアカウントをお持ちの方は
            </p>
            <Link 
              href="/auth/login" 
              style={{ 
                color: '#22c55e', 
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              ログインページへ →
            </Link>
          </div>

          {/* 部分成功時の追加ナビゲーション */}
          {success && error && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <Link 
                href="/auth/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  background: '#22c55e',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                ログインページへ
              </Link>
              <Link 
                href="/auth/verify-email"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#22c55e',
                  border: '1px solid #22c55e',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                メール確認へ
              </Link>
            </div>
          )}
        </div>

        {/* フッター情報 */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            アカウント作成でお困りの場合は{' '}
            <a 
              href="mailto:support@care-connect.jp" 
              style={{ color: '#22c55e', textDecoration: 'none' }}
            >
              サポートまでお問い合わせください
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImprovedRegisterForm