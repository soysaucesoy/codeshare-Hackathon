// components/auth/ImprovedRegisterForm.tsx
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Lock, Home } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'

const ImprovedRegisterForm: React.FC = () => {
  const router = useRouter()
  const { signUpWithEmail } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
      const { data, error } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.fullName
      )
      
      if (error) {
        setError(error.message)
      } else {
        router.push('/auth/verify-email')
      }
    } catch (err) {
      setError('アカウント作成に失敗しました')
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
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
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
                  アカウント作成中...
                </div>
              ) : (
                'アカウント作成'
              )}
            </Button>
          </form>

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

          {/* 開発環境での注意書き */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#f0f9ff', 
              borderRadius: '0.375rem', 
              border: '1px solid #bae6fd' 
            }}>
              <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0 }}>
                💡 <strong>開発環境</strong>: メール確認が届かない場合でも、作成後に直接ログインできる場合があります。
              </p>
            </div>
          )}

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