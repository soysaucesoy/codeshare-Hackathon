// components/dashboard/UserDashboard.tsx - 利用者ダッシュボード
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { User, Settings, Heart, MapPin, Phone, Mail, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { TokyoDistrict, DisabilityType, UserProfile } from '@/types/database'

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

const UserDashboard: React.FC = () => {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    district: '' as TokyoDistrict | '',
    age: '',
    gender: '',
    disability_types: [] as DisabilityType[],
    disability_grade: '',
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: '',
    medical_info: '',
    transportation_needs: '',
    other_requirements: '',
    receive_notifications: true
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    // ユーザーデータの初期化
    if (user) {
      // ここで実際のAPIからユーザーデータを取得
      // setProfileData(userData)
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // プロフィール更新API呼び出し
      // const { error } = await updateUserProfile(profileData)
      
      // if (error) {
      //   setMessage({ type: 'error', text: error.message })
      // } else {
        setMessage({ type: 'success', text: 'プロフィールを更新しました' })
      // }
    } catch (err) {
      setMessage({ type: 'error', text: 'プロフィール更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: '新しいパスワードが一致しません' })
      setLoading(false)
      return
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'パスワードは6文字以上で入力してください' })
      setLoading(false)
      return
    }

    try {
      // パスワード更新API呼び出し
      // const { error } = await updatePassword(passwordData.current_password, passwordData.new_password)
      
      // if (error) {
      //   setMessage({ type: 'error', text: error.message })
      // } else {
        setMessage({ type: 'success', text: 'パスワードを更新しました' })
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      // }
    } catch (err) {
      setMessage({ type: 'error', text: 'パスワード更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'disability_types') {
        const disabilityType = value as DisabilityType
        setProfileData(prev => ({
          ...prev,
          disability_types: checked 
            ? [...prev.disability_types, disabilityType]
            : prev.disability_types.filter(d => d !== disabilityType)
        }))
      } else {
        setProfileData(prev => ({ ...prev, [name]: checked }))
      }
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-container">
            <div className="logo">C</div>
            <span className="main-title">ケアコネクト</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {profileData.full_name || 'ユーザー'}さん
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '64rem' }}>
        {/* タブナビゲーション */}
        <div style={{ 
          background: 'white', 
          borderRadius: '0.75rem 0.75rem 0 0', 
          border: '1px solid #e5e7eb',
          borderBottom: 'none'
        }}>
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'profile' ? '#22c55e' : 'transparent',
                color: activeTab === 'profile' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '0.75rem 0 0 0',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <User size={16} />
              プロフィール設定
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'settings' ? '#22c55e' : 'transparent',
                color: activeTab === 'settings' ? 'white' : '#6b7280',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings size={16} />
              アカウント設定
            </button>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '0 0 0.75rem 0.75rem',
          border: '1px solid #e5e7eb'
        }}>
          {message && (
            <div style={{ 
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: message.type === 'success' ? '#166534' : '#b91c1c',
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '2rem' 
            }}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' ? (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                プロフィール情報
              </h3>
              
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* 基本情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      基本情報
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          お名前
                        </label>
                        <Input
                          name="full_name"
                          type="text"
                          value={profileData.full_name}
                          onChange={handleChange}
                          placeholder="山田 太郎"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          メールアドレス
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          電話番号
                        </label>
                        <Input
                          name="phone_number"
                          type="tel"
                          value={profileData.phone_number}
                          onChange={handleChange}
                          placeholder="090-1234-5678"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          お住まいの地区
                        </label>
                        <select
                          name="district"
                          value={profileData.district}
                          onChange={handleChange}
                          style={{
                            width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                            borderRadius: '0.5rem', fontSize: '0.875rem'
                          }}
                        >
                          <option value="">選択してください</option>
                          {TOKYO_DISTRICTS.map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 個人情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      個人情報
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          年齢
                        </label>
                        <Input
                          name="age"
                          type="number"
                          value={profileData.age}
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
                          value={profileData.gender}
                          onChange={handleChange}
                          style={{
                            width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                            borderRadius: '0.5rem', fontSize: '0.875rem'
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
                        障害の種類（複数選択可）
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {DISABILITY_TYPES.map(type => (
                          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              name="disability_types"
                              value={type}
                              checked={profileData.disability_types.includes(type)}
                              onChange={handleChange}
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
                      <Input
                        name="disability_grade"
                        type="text"
                        value={profileData.disability_grade}
                        onChange={handleChange}
                        placeholder="例：身体障害者手帳1級"
                      />
                    </div>
                  </div>

                  {/* 緊急時・医療情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      緊急時・医療情報
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          保護者・家族名
                        </label>
                        <Input
                          name="guardian_name"
                          type="text"
                          value={profileData.guardian_name}
                          onChange={handleChange}
                          placeholder="山田 花子"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          保護者・家族の電話番号
                        </label>
                        <Input
                          name="guardian_phone"
                          type="tel"
                          value={profileData.guardian_phone}
                          onChange={handleChange}
                          placeholder="090-1234-5678"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        緊急連絡先
                      </label>
                      <Input
                        name="emergency_contact"
                        type="text"
                        value={profileData.emergency_contact}
                        onChange={handleChange}
                        placeholder="緊急時の連絡先"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        医療情報・配慮事項
                      </label>
                      <textarea
                        name="medical_info"
                        value={profileData.medical_info}
                        onChange={handleChange}
                        placeholder="アレルギー、服薬状況、医療的配慮が必要な事項などを記入してください"
                        rows={3}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        移動・交通手段
                      </label>
                      <Input
                        name="transportation_needs"
                        type="text"
                        value={profileData.transportation_needs}
                        onChange={handleChange}
                        placeholder="車椅子利用、送迎希望など"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        その他のご要望・特記事項
                      </label>
                      <textarea
                        name="other_requirements"
                        value={profileData.other_requirements}
                        onChange={handleChange}
                        placeholder="サービス利用にあたってのご要望や特別な配慮が必要な事項があれば記入してください"
                        rows={3}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  {/* 通知設定 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      通知設定
                    </h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="receive_notifications"
                        checked={profileData.receive_notifications}
                        onChange={handleChange}
                        style={{ accentColor: '#22c55e' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        新しいサービスや空き情報のメール通知を受け取る
                      </span>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    loading={loading}
                    style={{ 
                      width: 'fit-content',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    {loading ? '保存中...' : 'プロフィールを保存'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                アカウント設定
              </h3>
              
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '24rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      現在のパスワード
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        name="current_password"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        placeholder="現在のパスワードを入力"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
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
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      新しいパスワード
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        name="new_password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        placeholder="6文字以上で入力"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
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
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                      新しいパスワード（確認）
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        name="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
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

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    loading={loading}
                    style={{ 
                      width: 'fit-content',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    {loading ? '更新中...' : 'パスワードを更新'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard