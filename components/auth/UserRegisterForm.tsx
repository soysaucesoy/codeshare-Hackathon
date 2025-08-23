// components/auth/UserRegisterForm.tsx - 利用者専用新規登録フォーム
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  ArrowLeft, Home, User, Mail, Lock, Phone, MapPin, Heart, 
  Eye, EyeOff, AlertCircle, UserCheck, Shield, Activity, Users
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { TokyoDistrict, DisabilityType } from '@/types/database'

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

const DISABILITY_TYPES: DisabilityType[] = [
  '身体障害', '知的障害', '精神障害', '発達障害', '難病等', 'その他'
]

// 入力コンポーネント（FacilityRegisterFormと同じものを使用）
const UserInput: React.FC<{
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
}> = ({ name, type = 'text', value, onChange, placeholder, required, disabled, min, max }) => {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
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

// ボタンコンポーネント（FacilityRegisterFormと同じものを使用）
const UserButton: React.FC<{
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

const UserRegisterForm: React.FC = () => {
  const router = useRouter()
  const { signUpWithEmail } = useAuth()
  
  const [step, setStep] = useState<'basic-info' | 'personal-info' | 'support-info'>('basic-info')
  
  const [formData, setFormData] = useState({
    // 基本情報
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    district: '' as TokyoDistrict | '',
    
    // 個人情報
    age: '',
    gender: '',
    disability_types: [] as DisabilityType[],
    disability_grade: '',
    
    // サポート情報
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: '',
    medical_info: '',
    transportation_needs: '',
    other_requirements: '',
    receive_notifications: true
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'disability_types') {
        const disabilityType = value as DisabilityType
        setFormData(prev => ({
          ...prev,
          disability_types: checked 
            ? [...prev.disability_types, disabilityType]
            : prev.disability_types.filter(d => d !== disabilityType)
        }))
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
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
      setStep('personal-info')
      setLoading(false)
      return
    }

    // ステップ2の処理
    if (step === 'personal-info') {
      setStep('support-info')
      setLoading(false)
      return
    }

    // 最終登録処理
    if (step === 'support-info') {
      try {
        const registrationData = {
          user_type: 'user' as const,
          full_name: formData.full_name,
          phone_number: formData.phone_number || undefined,
          district: formData.district || undefined,
          user_details: {
            age: formData.age ? parseInt(formData.age) : undefined,
            gender: formData.gender || undefined,
            disability_types: formData.disability_types,
            disability_grade: formData.disability_grade || undefined,
            guardian_name: formData.guardian_name || undefined,
            guardian_phone: formData.guardian_phone || undefined,
            emergency_contact: formData.emergency_contact || undefined,
            medical_info: formData.medical_info || undefined,
            transportation_needs: formData.transportation_needs || undefined,
            other_requirements: formData.other_requirements || undefined,
            receive_notifications: formData.receive_notifications
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
      { key: 'basic-info', label: '基本情報', icon: UserCheck },
      { key: 'personal-info', label: '個人情報', icon: User },
      { key: 'support-info', label: 'サポート情報', icon: Shield }
    ]
    
    const currentStepIndex = steps.findIndex(s => s.key === step)
    
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          {steps.map((stepItem, index) => {
            const IconComponent = stepItem.icon
            return (
              <React.Fragment key={stepItem.key}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                  background: index <= currentStepIndex ? '#22c55e' : '#e5e7eb',
                  color: index <= currentStepIndex ? 'white' : '#9ca3af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 600,
                  border: index === currentStepIndex ? '3px solid #16a34a' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {index === currentStepIndex ? (
                    <IconComponent size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div style={{
                    width: '3rem', height: '3px',
                    background: index < currentStepIndex ? '#22c55e' : '#e5e7eb',
                    borderRadius: '2px',
                    transition: 'all 0.3s'
                  }}></div>
                )}
              </React.Fragment>
            )
          })}
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
                color: index <= currentStepIndex ? '#22c55e' : '#6b7280',
                transition: 'all 0.3s'
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
      <div style={{ maxWidth: step === 'support-info' ? '48rem' : '32rem', width: '100%' }}>
        {/* ヘッダーナビゲーション */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}>
          <Link href="/auth/facility/register" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', 
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            padding: '0.5rem', borderRadius: '0.375rem', transition: 'all 0.2s'
          }}>
            <Users size={16} />
            事業所登録
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
            <User size={24} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            利用者アカウント作成
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {step === 'basic-info' && 'アカウント基本情報を入力してください'}
            {step === 'personal-info' && '個人情報を入力してください'}
            {step === 'support-info' && 'サポート情報を入力してください'}
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
                    <UserCheck size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    基本情報
                  </h4>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    お名前 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <UserInput
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="山田 太郎"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <Mail size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    メールアドレス <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <UserInput
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
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
                    <UserInput
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    パスワード確認 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserInput
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
                    電話番号
                  </label>
                  <UserInput
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="090-1234-5678"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    <MapPin size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    お住まいの地区
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
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

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <UserButton 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    style={{ width: '100%' }}
                  >
                    個人情報を入力する
                  </UserButton>
                </div>
              </div>
            )}

            {step === 'personal-info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    <User size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    個人情報
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        年齢
                      </label>
                      <UserInput
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="25"
                        min="0"
                        max="120"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        性別
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="filter-select"
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white'
                        }}
                      >
                        <option value="">選択してください</option>
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                        <option value="その他">その他</option>
                        <option value="回答しない">回答しない</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.75rem' }}>
                      <Heart size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      障害の種類（複数選択可）
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {DISABILITY_TYPES.map(type => (
                        <label key={type} className="filter-checkbox-container" style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', 
                          border: '1px solid #e5e7eb', borderRadius: '0.375rem', cursor: 'pointer',
                          background: formData.disability_types.includes(type) ? '#dcfce7' : 'white',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="checkbox"
                            name="disability_types"
                            value={type}
                            checked={formData.disability_types.includes(type)}
                            onChange={handleChange}
                            className="filter-checkbox"
                            style={{ accentColor: '#22c55e' }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      障害の等級・程度
                    </label>
                    <UserInput
                      name="disability_grade"
                      type="text"
                      value={formData.disability_grade}
                      onChange={handleChange}
                      placeholder="例：身体障害者手帳1級"
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      お持ちの手帳の等級や程度を記入してください
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <UserButton 
                    type="button" 
                    variant="secondary" 
                    size="lg" 
                    onClick={() => setStep('basic-info')}
                    style={{ flex: 1 }}
                  >
                    <ArrowLeft size={16} />
                    戻る
                  </UserButton>
                  <UserButton 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    style={{ flex: 2 }}
                  >
                    サポート情報を入力する
                  </UserButton>
                </div>
              </div>
            )}

            {step === 'support-info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    <Shield size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    緊急時・サポート情報
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        保護者・家族名
                      </label>
                      <UserInput
                        name="guardian_name"
                        type="text"
                        value={formData.guardian_name}
                        onChange={handleChange}
                        placeholder="山田 花子"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        保護者・家族の電話番号
                      </label>
                      <UserInput
                        name="guardian_phone"
                        type="tel"
                        value={formData.guardian_phone}
                        onChange={handleChange}
                        placeholder="090-1234-5678"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      緊急連絡先
                    </label>
                    <UserInput
                      name="emergency_contact"
                      type="text"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      placeholder="緊急時の連絡先"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <Activity size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      医療情報・配慮事項
                    </label>
                    <textarea
                      name="medical_info"
                      value={formData.medical_info}
                      onChange={handleChange}
                      placeholder="アレルギー、服薬状況、医療的配慮が必要な事項などを記入してください"
                      rows={3}
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
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      <MapPin size={16} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      移動・交通手段
                    </label>
                    <UserInput
                      name="transportation_needs"
                      type="text"
                      value={formData.transportation_needs}
                      onChange={handleChange}
                      placeholder="車椅子利用、送迎希望など"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      その他のご要望・特記事項
                    </label>
                    <textarea
                      name="other_requirements"
                      value={formData.other_requirements}
                      onChange={handleChange}
                      placeholder="サービス利用にあたってのご要望や特別な配慮が必要な事項があれば記入してください"
                      rows={3}
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
                  </div>

                  <div style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '0.5rem', 
                    padding: '1rem',
                    marginTop: '1.5rem'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#166534'
                    }}>
                      <input
                        type="checkbox"
                        name="receive_notifications"
                        checked={formData.receive_notifications}
                        onChange={handleChange}
                        style={{ accentColor: '#22c55e', transform: 'scale(1.2)' }}
                      />
                      <Mail size={16} />
                      新しいサービスや空き情報のメール通知を受け取る
                    </label>
                    <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem', marginLeft: '1.7rem' }}>
                      お住まいの地区で新しいサービスや空きが出た際にメールでお知らせします
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <UserButton 
                    type="button" 
                    variant="secondary" 
                    size="lg" 
                    onClick={() => setStep('personal-info')}
                    style={{ flex: 1 }}
                  >
                    <ArrowLeft size={16} />
                    戻る
                  </UserButton>
                  <UserButton 
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
                        <UserCheck size={16} />
                        利用者アカウント作成
                      </>
                    )}
                  </UserButton>
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
              <User size={16} />
              利用者ログインはこちら →
            </Link>
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/auth/facility/register" style={{ 
                color: '#6b7280', 
                textDecoration: 'none', 
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Users size={14} />
                事業所として登録する
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

export default UserRegisterForm