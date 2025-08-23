// components/dashboard/FacilityDashboard.tsx - 事業者ダッシュボード
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Building2, Settings, MapPin, Phone, Mail, Globe, Save, Eye, EyeOff, Users, Calendar, Star } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { TokyoDistrict, Facility } from '@/types/database'

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

const FacilityDashboard: React.FC = () => {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'settings'>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [facilityData, setFacilityData] = useState({
    // 担当者情報
    full_name: '',
    email: '',
    phone_number: '',
    
    // 事業所情報
    name: '',
    description: '',
    appeal_points: '',
    address: '',
    district: '' as TokyoDistrict | '',
    facility_phone: '',
    website_url: '',
    is_active: true
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

  // 仮のサービス管理データ
  const [services] = useState([
    { id: 1, name: '生活介護', category: '日中活動系サービス', capacity: 20, current_users: 15, availability: 'available' },
    { id: 2, name: '就労継続支援B型', category: '訓練系・就労系サービス', capacity: 30, current_users: 28, availability: 'unavailable' },
    { id: 3, name: '短期入所', category: '施設系サービス', capacity: 5, current_users: 3, availability: 'available' }
  ])

  useEffect(() => {
    // 事業所データの初期化
    if (user) {
      // ここで実際のAPIから事業所データを取得
      // setFacilityData(facilityData)
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // プロフィール更新API呼び出し
      // const { error } = await updateFacilityProfile(facilityData)
      
      // if (error) {
      //   setMessage({ type: 'error', text: error.message })
      // } else {
        setMessage({ type: 'success', text: '事業所情報を更新しました' })
      // }
    } catch (err) {
      setMessage({ type: 'error', text: '事業所情報更新に失敗しました' })
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
      setFacilityData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFacilityData(prev => ({ ...prev, [name]: value }))
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

  const toggleServiceAvailability = async (serviceId: number) => {
    // サービス空き状況の更新
    setMessage({ type: 'success', text: 'サービス情報を更新しました' })
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
              {facilityData.name || '事業所'}
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
              <Building2 size={16} />
              事業所情報
            </button>
            <button
              onClick={() => setActiveTab('services')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'services' ? '#22c55e' : 'transparent',
                color: activeTab === 'services' ? 'white' : '#6b7280',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={16} />
              サービス管理
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
                事業所情報
              </h3>
              
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* 担当者情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      担当者情報
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          担当者名
                        </label>
                        <Input
                          name="full_name"
                          type="text"
                          value={facilityData.full_name}
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
                          value={facilityData.email}
                          onChange={handleChange}
                          placeholder="contact@facility.example.com"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          担当者電話番号
                        </label>
                        <Input
                          name="phone_number"
                          type="tel"
                          value={facilityData.phone_number}
                          onChange={handleChange}
                          placeholder="090-1234-5678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 事業所情報 */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                      事業所情報
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          事業所名
                        </label>
                        <Input
                          name="name"
                          type="text"
                          value={facilityData.name}
                          onChange={handleChange}
                          placeholder="○○デイサービスセンター"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          事業所電話番号
                        </label>
                        <Input
                          name="facility_phone"
                          type="tel"
                          value={facilityData.facility_phone}
                          onChange={handleChange}
                          placeholder="03-1234-5678"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          住所
                        </label>
                        <Input
                          name="address"
                          type="text"
                          value={facilityData.address}
                          onChange={handleChange}
                          placeholder="東京都新宿区西新宿1-2-3"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          地区
                        </label>
                        <select
                          name="district"
                          value={facilityData.district}
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

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        ウェブサイト
                      </label>
                      <Input
                        name="website_url"
                        type="url"
                        value={facilityData.website_url}
                        onChange={handleChange}
                        placeholder="https://facility.example.com"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        事業所の説明
                      </label>
                      <textarea
                        name="description"
                        value={facilityData.description}
                        onChange={handleChange}
                        placeholder="事業所の特徴やサービス内容について記載してください"
                        rows={3}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                        アピールポイント
                      </label>
                      <textarea
                        name="appeal_points"
                        value={facilityData.appeal_points}
                        onChange={handleChange}
                        placeholder="事業所の強みや特色、利用者へのメッセージなど"
                        rows={3}
                        style={{
                          width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={facilityData.is_active}
                          onChange={handleChange}
                          style={{ accentColor: '#22c55e' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          事業所を公開する（利用者が検索できるようになります）
                        </span>
                      </label>
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
                    {loading ? '保存中...' : '事業所情報を保存'}
                  </Button>
                </div>
              </form>
            </div>
          ) : activeTab === 'services' ? (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
                サービス管理
              </h3>
              
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  提供しているサービスの空き状況や定員を管理できます。
                </p>
                <Button variant="primary" size="sm" style={{ marginBottom: '1rem' }}>
                  新しいサービスを追加
                </Button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {services.map(service => (
                  <div key={service.id} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem', 
                    padding: '1.5rem',
                    background: service.availability === 'available' ? '#f0fdf4' : '#fef2f2'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                          {service.name}
                        </h4>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {service.category}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            利用者数: {service.current_users} / {service.capacity}名
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 500,
                            color: service.availability === 'available' ? '#166534' : '#b91c1c',
                            background: service.availability === 'available' ? '#bbf7d0' : '#fecaca',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem'
                          }}>
                            {service.availability === 'available' ? '空きあり' : '満員'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                          variant={service.availability === 'available' ? 'secondary' : 'primary'} 
                          size="sm"
                          onClick={() => toggleServiceAvailability(service.id)}
                        >
                          {service.availability === 'available' ? '満員に変更' : '空きありに変更'}
                        </Button>
                        <Button variant="secondary" size="sm">
                          編集
                        </Button>
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: 'white', 
                      padding: '1rem', 
                      borderRadius: '0.375rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>
                            定員
                          </label>
                          <Input
                            type="number"
                            defaultValue={service.capacity.toString()}
                            min="1"
                            style={{ fontSize: '0.875rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>
                            現在の利用者数
                          </label>
                          <Input
                            type="number"
                            defaultValue={service.current_users.toString()}
                            min="0"
                            style={{ fontSize: '0.875rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

              {/* アカウント削除セクション */}
              <div style={{ 
                marginTop: '3rem', 
                padding: '1.5rem', 
                border: '1px solid #fecaca', 
                borderRadius: '0.5rem',
                background: '#fef2f2'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.5rem' }}>
                  危険な操作
                </h4>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  アカウントを削除すると、全ての事業所情報とサービス情報が永久に削除されます。この操作は取り消すことができません。
                </p>
                <Button variant="secondary" size="sm" style={{ color: '#b91c1c', borderColor: '#fecaca' }}>
                  アカウントを削除
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FacilityDashboard