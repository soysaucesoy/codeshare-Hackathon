// components/auth/TabbedAuthForm.tsx
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, Home, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '@/lib/supabase/client'

interface TabbedAuthFormProps {
  defaultTab?: 'login' | 'register'
}

const TabbedAuthForm: React.FC<TabbedAuthFormProps> = ({ defaultTab = 'login' }) => {
  const router = useRouter()
  const { user, signInWithEmail, signUpWithEmail, loading: authLoading } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const shouldRedirect = router.isReady && !!user && router.pathname !== '/'

  useEffect(() => {
    if (!shouldRedirect) return
    router.replace('/')
  }, [shouldRedirect, router])

  if (shouldRedirect) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>ログイン済みです。ホームへ移動しています…</p>
      </div>
    )
  }


  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('=== ログイン処理開始 ===')

    try {
      const { error } = await signInWithEmail(loginData.email, loginData.password)
      
      if (error) {
        console.error('ログインエラー:', error)
        
        if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
          setError('メールアドレスの確認が完了していません。確認メールをご確認いただくか、開発環境の場合はSupabaseの設定をご確認ください。')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。')
        } else {
          setError('ログインに失敗しました: ' + error.message)
        }
      } else {
        console.log('=== ログイン成功、認証状態変更を待機 ===')
        setSuccess('ログインに成功しました。認証状態を更新中...')
        
        // 認証状態の変更はuseEffectで処理される
        // ここでは手動リダイレクトはしない
      }
    } catch (err) {
      console.error('ログイン処理例外:', err)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading || authLoading) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    // 簡単なバリデーション
    if (!registerData.email || !registerData.password || !registerData.fullName) {
      setError('すべての項目を入力してください')
      setLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      console.log('=== 新規登録開始（統合AuthProvider使用） ===')
      console.log('フォームデータ:', registerData)

      // AuthProvider経由でサインアップ
      const { data: authData, error: authError } = await signUpWithEmail(
        registerData.email,
        registerData.password,
        registerData.fullName
      )

      if (authError) {
        console.error('認証エラー詳細分析:', authError)
        
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
        
        const { data: userCreationResult, error: userCreationError } = await supabase
          .rpc('upsert_user_profile', {
            p_user_id: userId,
            p_email: registerData.email,
            p_full_name: registerData.fullName,
            p_phone_number: null,
            p_district: null
          })

        console.log('ユーザー作成関数結果:', {
          result: userCreationResult,
          error: userCreationError
        })

        if (userCreationError) {
          console.error('ユーザーレコード作成エラー:', userCreationError)
          setError(`データベース保存に失敗しましたが、認証は完了しています。管理者にお問い合わせください。エラー: ${userCreationError.message}`)
          setSuccess(`認証は完了しました。${authData.user?.email_confirmed_at ? 'ログインページに進んでください。' : 'メール確認が必要です。'}`)
        } else if (!userCreationResult?.success) {
          console.error('ユーザーレコード作成失敗:', userCreationResult)
          setError(`データベース保存に失敗しました: ${userCreationResult?.error || '不明なエラー'}`)
          setSuccess('認証は完了していますが、プロフィール作成で問題が発生しました。')
        } else {
          console.log('データベースレコード作成成功')
          
          if (authData.user?.email_confirmed_at) {
            setSuccess('アカウント作成が完了しました！ログインタブに切り替えます。')
            setTimeout(() => {
              setActiveTab('login')
              setLoginData({ email: registerData.email, password: '' })
            }, 2000)
          } else {
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

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      {/* 認証済みでリダイレクト中の場合は、リダイレクトオーバーレイを表示 */}
      {isRedirecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '3px solid #22c55e',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '0.5rem' }}>
              ログイン完了！
            </p>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '0.5rem' }}>
              ホームページに移動しています...
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {user?.email} としてログイン中
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '32rem', width: '100%' }}>
        {/* ヘッダーナビゲーション */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}>
           {/* ロゴ部分 */}
          <Link 
            href="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = '1'
            }}
          >
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: '#22c55e',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              C
            </div>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: '#111827' 
            }}>
              ケアコネクト
            </span>
          </Link>
          
          {/* 施設ログインボタン */}
          <Link 
            href="/auth/facilitylogin" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              background: 'white'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = '#f9fafb'
              ;(e.target as HTMLAnchorElement).style.borderColor = '#22c55e'
              ;(e.target as HTMLAnchorElement).style.color = '#22c55e'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLAnchorElement).style.backgroundColor = 'white'
              ;(e.target as HTMLAnchorElement).style.borderColor = '#e5e7eb'
              ;(e.target as HTMLAnchorElement).style.color = '#6b7280'
            }}
          >
            <Home size={16} />
            施設ログイン
          </Link>
        </div>

        {/* メインコンテンツヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <User size={28} style={{ color: '#22c55e' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              利用者向けサービス
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            施設の検索・ブックマークや事業所へのメッセージ送信ができます
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* タブヘッダー */}
          <div style={{ 
            display: 'flex',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: activeTab === 'login' ? 600 : 400,
                color: activeTab === 'login' ? '#22c55e' : '#6b7280',
                borderBottom: activeTab === 'login' ? '2px solid #22c55e' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: activeTab === 'register' ? 600 : 400,
                color: activeTab === 'register' ? '#22c55e' : '#6b7280',
                borderBottom: activeTab === 'register' ? '2px solid #22c55e' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              新規登録
            </button>
          </div>

          {/* タブコンテンツ */}
          <div style={{ padding: '2rem' }}>

          {/* エラー・成功メッセージ */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
              {error.includes('email_not_confirmed') && activeTab === 'login' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Link 
                    href="/auth/verify-email" 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: '#2563eb', 
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    メール確認ページを見る →
                  </Link>
                </div>
              )}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {success}
            </div>
          )}

          {/* ログインフォーム */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  メールアドレス
                </label>
                <Input
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="example@email.com"
                  required
                  style={{ width: '100%', fontSize: '1rem' }}
                />
              </div>

              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  パスワード
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="password"
                    required
                    style={{ paddingRight: '2.5rem', width: '100%', fontSize: '1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '60%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full cta-primary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    ログイン中...
                  </div>
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>
          )}

          {/* 新規登録フォーム */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  お名前 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Input
                  name="fullName"
                  type="text"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  placeholder="山田太郎"
                  required
                  style={{ width: '100%', fontSize: '1rem' }}
                />
              </div>

              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  メールアドレス <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="example@email.com"
                  required
                  style={{ width: '100%', fontSize: '1rem' }}
                />
              </div>

              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  パスワード <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="6文字以上で入力"
                    required
                    style={{ paddingRight: '2.5rem', width: '100%', fontSize: '1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '60%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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

              {/* 利用規約・プライバシーポリシー */}
              <div style={{ 
                padding: '1rem', 
                background: '#f9fafb', 
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                アカウント作成により、
                <a href="https://github.com/soysaucesoy/codeshare-Hackathon" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>利用規約</a>
                と
                <a href="https://github.com/soysaucesoy/codeshare-Hackathon" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>プライバシーポリシー</a>
                に同意したものとみなされます
              </div>
            </form>
          )}

            {/* ゲストアクセス案内 */}
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#f0fdf4', 
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid #bbf7d0'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#166534', margin: '0 0 0.5rem 0', fontWeight: 500 }}>
                ログインなしでも利用できます
              </p>
              <Link 
                href="/" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: '#22c55e', 
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                事業所検索を試してみる →
              </Link>
            </div>
          </div>
        </div>

        {/* フッター情報 */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            お困りの場合は{' '}
            <Link
              href="/contact"
              style={{ color: '#22c55e', textDecoration: 'none' }}
            >
              サポートまでお問い合わせください
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default TabbedAuthForm