// components/auth/ImprovedLoginForm.tsx
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, Home, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'

const ImprovedLoginForm: React.FC = () => {
  const router = useRouter()
  const { signInWithEmail } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithEmail(formData.email, formData.password)
      
      if (error) {
        // メール未確認エラーの場合は親切なメッセージ
        if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
          setError('メールアドレスの確認が完了していません。確認メールをご確認いただくか、開発環境の場合はSupabaseの設定をご確認ください。')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。')
        } else {
          setError('ログインに失敗しました: ' + error.message)
        }
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('ログインに失敗しました')
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
            href="/auth/register" 
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
            新規登録
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
            ログイン
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            アカウントにログインしてご利用ください
          </p>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
              {error.includes('email_not_confirmed') && (
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                メールアドレス
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
                パスワード
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="パスワードを入力"
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
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

          {/* パスワードを忘れた場合 */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a 
              href="/auth/forgot-password" 
              style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                textDecoration: 'none' 
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#22c55e'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#6b7280'}
            >
              パスワードをお忘れの場合
            </a>
          </div>

          {/* 開発環境でのヒント */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#f0f9ff', 
              borderRadius: '0.375rem', 
              border: '1px solid #bae6fd' 
            }}>
              <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0 }}>
                💡 <strong>開発環境</strong>: メール確認エラーが出る場合は、Supabaseで「Enable email confirmations」をOFFにしてください。
              </p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              アカウントをお持ちでない方は
            </p>
            <Link 
              href="/auth/register" 
              style={{ 
                color: '#22c55e', 
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              新規アカウント作成 →
            </Link>
          </div>

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
              👀 ログインなしでも利用できます
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

        {/* フッター情報 */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            ログインでお困りの場合は{' '}
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

export default ImprovedLoginForm