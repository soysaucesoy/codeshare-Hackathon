// components/auth/FacilityLoginForm.tsx - 事業者用ログインフォーム
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Mail, Lock, Home, ArrowRight, Building2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'

const FacilityLoginForm: React.FC = () => {
  const router = useRouter()
  const { signInWithEmail } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithEmail(formData.email, formData.password)
      
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else {
        router.push('/facility/dashboard')
      }
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        {/* ナビゲーション */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}>
          <Link href="/auth/user/login" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', 
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            padding: '0.5rem', borderRadius: '0.375rem'
          }}>
            利用者ログイン
          </Link>
          <Link href="/" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', 
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            padding: '0.5rem', borderRadius: '0.375rem'
          }}>
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
            <Building2 size={24} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            事業者ログイン
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            事業所アカウント情報を入力してログインしてください
          </p>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  placeholder="contact@facility.example.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  パスワード
                </label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="パスワードを入力"
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </div>
          </form>

          {/* フッター */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link href="/auth/forgot-password" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem', display: 'block' }}>
              パスワードを忘れた方はこちら
            </Link>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              アカウントをお持ちでない方は
            </p>
            <Link href="/auth/facility/register" style={{ 
              color: '#22c55e', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
            }}>
              新規登録はこちら <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacilityLoginForm