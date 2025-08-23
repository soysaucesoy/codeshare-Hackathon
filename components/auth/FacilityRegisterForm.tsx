// components/auth/FacilityRegisterForm.tsx - 事業者専用新規登録フォーム
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  ArrowLeft, Home, Building2, Mail, Lock, Phone, MapPin, Globe, 
  Eye, EyeOff, User, FileText, Star, AlertCircle 
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { TokyoDistrict } from '@/types/database'

const TOKYO_DISTRICTS: TokyoDistrict[] = [
  // 23区
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
  '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
  '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
  '葛飾区', '江戸川区',
  // 市部
  '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市',
  '調布市', '町田市', '小金井市', '小平市', '日野市', '東村山市', '国分寺市',
  '国立市', '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市', '武蔵村山市',
  '多摩市', '稲城市', '羽村市', 'あきる野市', '西東京市',
  // 西多摩郡
  '瑞穂町', '日の出町', '檜原村', '奥多摩町',
  // 島しょ部
  '大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村',
  '八丈町', '青ヶ島村', '小笠原村'
]

// 入力コンポーネント
const Input: React.FC<{
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}> = ({ name, type = 'text', value, onChange, placeholder, required, disabled }) => {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="search-input"
      style={{
        width: '100%',
        padding: '0.75rem',
        fontSize: '0.875rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        outline: 'none',
        transition: 'all 0.2s',
        backgroundColor: disabled ? '#f9fafb' : 'white',
        color: disabled ? '#6b7280' : '#111827'
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.target.style.borderColor = '#22c55e'
          e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)'
        }
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db'
        e.target.style.boxShadow = 'none'
      }}
    />
  )
}

// ボタンコンポーネント
const Button: React.FC<{
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ type = 'button', variant = 'primary', size = 'md', loading, disabled, onClick, children, style }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled || loading ? '0.6' : '1',
    ...style
  }

  const variants = {
    primary: {
      background: '#22c55e',
      color: 'white',
      padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 2rem' : '0.625rem 1.5rem',
      fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.875rem'
    },
    secondary: {
      background: 'white',
      color: '#22c55e',
      border: '1px solid #22c55e',
      padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 2rem' : '0.625rem 1.5rem',
      fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.875rem'
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    const target = e.target as HTMLButtonElement
    if (variant === 'primary') {
      target.style.background = '#16a34a'
    } else {
      target.style.background = '#f0fdf4'
      target.style.borderColor = '#16a34a'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    const target = e.target as HTMLButtonElement
    if (variant === 'primary') {
      target.style.background = '#22c55e'
    } else {
      target.style.background = 'white'
      target.style.borderColor = '#22c55e'
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variants[variant] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading ? '処理中...' : children}
    </button>
  )
}

const FacilityRegisterForm: React.FC = () => {
  const router = useRouter()
  const { signUpWithEmail } = useAuth()
  
  const [step, setStep] = useState<'basic-info' | 'facility-info'>('basic-info')
  
  const [formData, setFormData] = useState({
    // 基本情報（担当者）
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    
    // 事業所情報
    facility_name: '',
    description: '',
    appeal_points: '',
    address: '',
    district: '' as TokyoDistrict | '',
    facility_phone: '',
    website_url: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // ステップ1の処理
    if (step === 'basic-info') {
      if (!formData.email || !formData.password || !formData.full_name) {
        setError('必須項目を入力してください')
        setLoading(false)
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('パスワードが一致しません')
        setLoading(false)
        return
      }
      if (formData.password.length < 6) {
        setError('パスワードは6文字以上で入力してください')
        setLoading(false)
        return
      }
      setStep('facility-info')
      setLoading(false)
      return
    }

    // 最終登録処理
    if (step === 'facility-info') {
      if (!formData.facility_name || !formData.address || !formData.district) {
        setError('事業所名、住所、地区は必須項目です')
        setLoading(false)
        return
      }

      try {
        const registrationData = {
          user_type: 'facility' as const,
          full_name: formData.full_name,
          phone_number: formData.phone_number || undefined,
          district: formData.district || undefined,
          facility_details: {
            name: formData.facility_name,
            description: formData.description || undefined,
            appeal_points: formData.appeal_points || undefined,
            address: formData.address,
            district: formData.district,
            phone_number: formData.facility_phone || undefined,
            website_url: formData.website_url || undefined
          }
        }

        const { error } = await signUpWithEmail(
          formData.email,
          formData.password,
          registrationData
        )
        
        if (error) {
          setError(error.message || 'アカウント作成に失敗しました')
        } else {
          router.push('/auth/verify-email')
        }
      } catch (err) {
        setError('アカウント作成に失敗しました')
      }
    }
    
    setLoading(false)
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'basic-info', label: '担当者情報' },
      { key: 'facility-info', label: '事業所情報' }
    ]
    
    const currentStepIndex = steps.findIndex(s => s.key === step)
    
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          {steps.map((stepItem, index) => (
            <React.Fragment key={stepItem.key}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                background: index <= currentStepIndex ? '#22c55e' : '#e5e7eb',
                color: index <= currentStepIndex ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', fontWeight: 600,
                border: index === currentStepIndex ? '3px solid #16a34a' : 'none'
              }}>
                {index === currentStepIndex ? (
                  <Building2 size={16} />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  width: '4rem', height: '3px',
                  background: index < currentStepIndex ? '#22c55e' : '#e5e7eb',
                  borderRadius: '2px'
                }}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '0.75rem', 
          fontSize: '0.75rem', 
          color: '#6b7280',
          maxWidth: '280px',
          margin: '0.75rem auto 0'
        }}>
          {steps.map((stepItem, index) => (
            <span 
              key={stepItem.key} 
              style={{ 
                textAlign: 'center', 
                fontWeight: index === currentStepIndex ? '600' : '400',
                color: index <= currentStepIndex ? '#22c55e' : '#6b7280'
              }}
            >
              {stepItem.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f9fafb',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '3rem 1rem' 
    }}>
      <div style={{ maxWidth: step === 'facility-info' ? '48rem' : '32rem', width: '100%' }}>
        {/* ヘッダーナビゲーション */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}>
          <Link href="/auth/user/register" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', 
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            padding: '0.5rem', borderRadius: '0.375rem', transition: 'all 0.2s'
          }}>
            <User size={16} />
            利用者登録
          </Link>
          <Link href="/" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', 
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            padding: '0.5rem', borderRadius: '0.375rem', transition: 'all 0.2s'
          }}>
            <Home size={16} />
            トップページ
          </Link>
        </div>

        {/* ステップインジケーター */}
        {renderStepIndicator()}

        {/* メインコンテンツ */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', background: '#22c55e', borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.125rem', fontWeight: 'bold'
            }}>C</div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>ケアコネクト</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            <Building2 size={24} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            事業所アカウント作成
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {step === 'basic-info' && '担当者情報を入力してください'}
            {step === 'facility-info' && '事業所情報を入力してください'}
          </p>
        </div>

        <div className="search-section" style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '1rem', 
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e5e7eb' 
        }}>
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              color: '#b91c1c', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 'basic-info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    担当者情報
                  </h4>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    担当者名 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="山田 太郎"
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    事業所の担当者名を入力してください
                  </p>
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
                    placeholder="contact@facility.example.com"
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    ログイン時に使用するメールアドレスです
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    パスワード <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      name="password"
                      type={showPasswords.password ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="6文字以上で入力"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      {showPasswords.password ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    英数字を組み合わせて6文字以上で設定してください
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    パスワード確認 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      name="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="パスワードを再入力"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <Phone size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    担当者電話番号
                  </label>
                  <Input
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="090-1234-5678"
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    担当者への直通電話番号（任意）
                  </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    style={{ width: '100%' }}
                  >
                    事業所情報を入力する
                  </Button>
                </div>
              </div>
            )}

            {step === 'facility-info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 事業所基本情報 */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    <Building2 size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    事業所基本情報
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        事業所名 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <Input
                        name="facility_name"
                        type="text"
                        value={formData.facility_name}
                        onChange={handleChange}
                        placeholder="○○デイサービスセンター"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        地区 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        className="filter-select"
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white'
                        }}
                      >
                        <option value="">選択してください</option>
                        {TOKYO_DISTRICTS.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <MapPin size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      住所 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Input
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="東京都新宿区西新宿1-2-3 ○○ビル2階"
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      利用者が来訪する際の住所を正確に入力してください
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        <Phone size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        事業所電話番号
                      </label>
                      <Input
                        name="facility_phone"
                        type="tel"
                        value={formData.facility_phone}
                        onChange={handleChange}
                        placeholder="03-1234-5678"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        <Globe size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        ウェブサイト
                      </label>
                      <Input
                        name="website_url"
                        type="url"
                        value={formData.website_url}
                        onChange={handleChange}
                        placeholder="https://facility.example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* 事業所詳細情報 */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    <FileText size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    事業所詳細情報
                  </h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      事業所の説明
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="事業所の特徴やサービス内容、設備について記載してください"
                      rows={4}
                      style={{
                        width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                        borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit', lineHeight: '1.5'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#22c55e'
                        e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      利用者に向けて、事業所の特色やサービス内容を詳しく説明してください
                    </p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Star size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      アピールポイント
                    </label>
                    <textarea
                      name="appeal_points"
                      value={formData.appeal_points}
                      onChange={handleChange}
                      placeholder="事業所の強みや特色、利用者へのメッセージなど"
                      rows={4}
                      style={{
                        width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                        borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit', lineHeight: '1.5'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#22c55e'
                        e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      他の事業所との差別化ポイントや、利用者に伝えたいメッセージを記入してください
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="lg" 
                    onClick={() => setStep('basic-info')}
                    style={{ flex: 1 }}
                  >
                    <ArrowLeft size={16} />
                    戻る
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    loading={loading}
                    style={{ flex: 2 }}
                  >
                    {loading ? (
                      <>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          border: '2px solid transparent', 
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        アカウント作成中...
                      </>
                    ) : (
                      <>
                        <Building2 size={16} />
                        事業所アカウント作成
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* フッター */}
          <div style={{ 
            marginTop: '2rem', 
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '1.5rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              すでにアカウントをお持ちの方は
            </p>
            <Link href="/auth/login" style={{ 
              color: '#22c55e', 
              fontWeight: 600, 
              textDecoration: 'none', 
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Building2 size={16} />
              事業所ログインはこちら →
            </Link>
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/auth/user/register" style={{ 
                color: '#6b7280', 
                textDecoration: 'none', 
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <User size={14} />
                利用者として登録する
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* スピナーのアニメーション */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default FacilityRegisterForm