// pages/user/profile/[userId].tsx - 利用者プロフィール閲覧ページ
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import {
  User, MapPin, Phone, Calendar, Shield, Heart,
  FileText, ClipboardList, ArrowLeft, AlertCircle
} from 'lucide-react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { DisabilityType } from '@/types/database'
import Header from '@/components/layout/Header'

// サービス等利用計画の型
interface NeedsRow {
  '優先順位': string
  '本人のニーズ': string
  '支援目標': string
  '達成時期': string
  '福祉サービス内容': string
  '本人の役割': string
  '評価時期': string
  'その他留意事項': string
}

interface ServicePlanData {
  '計画作成日': string
  '利用者が希望する生活': string
  '家族が希望する生活': string
  '総合的な援助の方針': string
  '長期目標': string
  '短期目標': string
  'ニーズ行': NeedsRow[]
}

// セクションカードコンポーネント
const SectionCard: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  color?: string
}> = ({ title, icon, children, color = '#22c55e' }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      marginBottom: '1.25rem',
      paddingBottom: '0.875rem',
      borderBottom: '2px solid #f3f4f6'
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '0.5rem',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
        {title}
      </h2>
    </div>
    {children}
  </div>
)

// フィールド行コンポーネント
const FieldRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '9rem 1fr',
      gap: '0.75rem',
      padding: '0.625rem 0',
      borderBottom: '1px solid #f3f4f6',
      alignItems: 'start'
    }}>
      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, paddingTop: '0.1rem' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: '#111827', lineHeight: 1.6 }}>
        {value}
      </span>
    </div>
  )
}

// アセスメントフィールド
const AssessmentField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.375rem'
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '0.875rem',
        color: '#111827',
        lineHeight: 1.7,
        background: '#f9fafb',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        margin: 0,
        whiteSpace: 'pre-wrap'
      }}>
        {value}
      </p>
    </div>
  )
}

// サービス等利用計画 表示コンポーネント
const ServicePlanView: React.FC<{ plan: ServicePlanData }> = ({ plan }) => {
  const needsRows = plan['ニーズ行'] ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 基本情報 */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: '0.75rem',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            background: '#16a34a', color: 'white',
            fontSize: '0.75rem', fontWeight: 700,
            padding: '0.2rem 0.75rem', borderRadius: '9999px'
          }}>サービス等利用計画</span>
          {plan['計画作成日'] && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              計画作成日：{plan['計画作成日']}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {plan['利用者が希望する生活'] && (
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', marginBottom: '0.3rem' }}>
                利用者が希望する生活
              </p>
              <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0, lineHeight: 1.6 }}>
                {plan['利用者が希望する生活']}
              </p>
            </div>
          )}
          {plan['家族が希望する生活'] && (
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', marginBottom: '0.3rem' }}>
                家族が希望する生活
              </p>
              <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0, lineHeight: 1.6 }}>
                {plan['家族が希望する生活']}
              </p>
            </div>
          )}
          {plan['総合的な援助の方針'] && (
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>
                総合的な援助の方針
              </p>
              <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0, lineHeight: 1.6 }}>
                {plan['総合的な援助の方針']}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 目標 */}
      {(plan['長期目標'] || plan['短期目標']) && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {plan['長期目標'] && (
            <div style={{
              flex: 1, minWidth: '180px',
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: '0.75rem', padding: '1rem'
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.4rem' }}>長期目標</p>
              <p style={{ fontSize: '0.875rem', color: '#111827', lineHeight: 1.7, margin: 0 }}>{plan['長期目標']}</p>
            </div>
          )}
          {plan['短期目標'] && (
            <div style={{
              flex: 1, minWidth: '180px',
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: '0.75rem', padding: '1rem'
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.4rem' }}>短期目標</p>
              <p style={{ fontSize: '0.875rem', color: '#111827', lineHeight: 1.7, margin: 0 }}>{plan['短期目標']}</p>
            </div>
          )}
        </div>
      )}

      {/* ニーズ行テーブル */}
      {needsRows.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>
            ニーズと支援目標
          </h4>
          <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['優先順位', '本人のニーズ', '支援目標', '達成時期', '福祉サービス内容', '本人の役割', '評価時期', 'その他留意事項'].map((h) => (
                    <th key={h} style={{
                      padding: '0.6rem 0.75rem',
                      textAlign: 'left', fontWeight: 700,
                      color: '#374151', borderBottom: '2px solid #e5e7eb',
                      whiteSpace: 'nowrap', fontSize: '0.75rem'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {needsRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', verticalAlign: 'top' }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: '50%',
                        background: '#16a34a', color: 'white', fontWeight: 700, fontSize: '0.75rem'
                      }}>{row['優先順位']}</span>
                    </td>
                    {(['本人のニーズ', '支援目標', '達成時期', '福祉サービス内容', '本人の役割', '評価時期', 'その他留意事項'] as const).map(key => (
                      <td key={key} style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', lineHeight: 1.6 }}>
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// メインコンポーネント
const UserProfilePage: React.FC = () => {
  const router = useRouter()
  const { userId } = router.query
  const { user, signOut } = useAuthContext()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [basicInfo, setBasicInfo] = useState<{
    full_name: string
    email: string
    phone_number: string
    district: string
  } | null>(null)

  const [userDetails, setUserDetails] = useState<{
    age: number | null
    gender: string
    disability_types: DisabilityType[]
    disability_grade: string
    guardian_name: string
    guardian_phone: string
    emergency_contact: string
    medical_info: string
    transportation_needs: string
    other_requirements: string
  } | null>(null)

  const [assessment, setAssessment] = useState<{
    life_history: string
    medical_history: string
    medical_usage: string
    welfare_equipment: string
    daily_life_self: string
    daily_life_guardian: string
    desired_life: string
    family_requests: string
    support_status: string
    assessment_other: string
  } | null>(null)

  const [servicePlan, setServicePlan] = useState<ServicePlanData | null>(null)

  useEffect(() => {
    if (!userId || typeof userId !== 'string') return

    const fetchProfile = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        // APIルート経由で取得（サービスロールキーを使うためRLSを迂回）
        const res = await fetch(`/api/users/profile/${userId}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()

        setBasicInfo(data.basicInfo)

        if (data.userDetails) {
          const d = data.userDetails
          setUserDetails({
            age: d.age ?? null,
            gender: d.gender || '',
            disability_types: d.disability_types || [],
            disability_grade: d.disability_grade || '',
            guardian_name: d.guardian_name || '',
            guardian_phone: d.guardian_phone || '',
            emergency_contact: d.emergency_contact || '',
            medical_info: d.medical_info || '',
            transportation_needs: d.transportation_needs || '',
            other_requirements: d.other_requirements || ''
          })
        }

        if (data.assessment) {
          const a = data.assessment
          setAssessment({
            life_history: a.life_history || '',
            medical_history: a.medical_history || '',
            medical_usage: a.medical_usage || '',
            welfare_equipment: a.welfare_equipment || '',
            daily_life_self: a.daily_life_self || '',
            daily_life_guardian: a.daily_life_guardian || '',
            desired_life: a.desired_life || '',
            family_requests: a.family_requests || '',
            support_status: a.support_status || '',
            assessment_other: a.assessment_other || ''
          })
        }

        if (data.servicePlan?.plan_text) {
          try {
            setServicePlan(JSON.parse(data.servicePlan.plan_text) as ServicePlanData)
          } catch {
            setServicePlan(null)
          }
        }

      } catch (err) {
        console.error('プロフィール取得エラー:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  // 未ログインは認証ページへ
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header isLoggedIn={false} signOut={signOut} />
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <p style={{ color: '#374151' }}>このページを閲覧するにはログインが必要です。</p>
          <Link href="/auth/userlogin" style={{
            display: 'inline-block', marginTop: '1rem',
            padding: '0.625rem 1.5rem', background: '#22c55e',
            color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600
          }}>
            ログイン
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header isLoggedIn={!!user} signOut={signOut} />
        <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px',
            border: '3px solid #e5e7eb', borderTop: '3px solid #22c55e',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280' }}>プロフィールを読み込み中...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (notFound || !basicInfo) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header isLoggedIn={!!user} signOut={signOut} />
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ color: '#111827' }}>プロフィールが見つかりません</h2>
          <p style={{ color: '#6b7280' }}>指定されたユーザーのプロフィールが存在しません。</p>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: '1.5rem', padding: '0.625rem 1.5rem',
              background: '#22c55e', color: 'white',
              borderRadius: '0.5rem', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem'
            }}
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  const hasAssessmentData = assessment && Object.values(assessment).some(v => v)
  const hasDetailData = userDetails && (
    userDetails.age || userDetails.gender || userDetails.disability_types.length > 0 ||
    userDetails.disability_grade || userDetails.guardian_name || userDetails.medical_info ||
    userDetails.transportation_needs || userDetails.other_requirements
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Head>
        <title>{basicInfo.full_name || '利用者'} のプロフィール | Care Connect</title>
      </Head>

      <Header isLoggedIn={!!user} signOut={signOut} />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            marginBottom: '1.5rem', padding: '0.5rem 1rem',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '0.5rem', cursor: 'pointer',
            fontSize: '0.875rem', color: '#374151', fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          戻る
        </button>

        {/* ヘッダーカード */}
        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={36} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {basicInfo.full_name || '（未設定）'}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', opacity: 0.9, fontSize: '0.875rem' }}>
                {basicInfo.district && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} /> {basicInfo.district}
                  </span>
                )}
                {basicInfo.phone_number && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={14} /> {basicInfo.phone_number}
                  </span>
                )}
                {userDetails?.age && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> {userDetails.age}歳
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* 障害種別バッジ */}
          {userDetails?.disability_types && userDetails.disability_types.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.25rem' }}>
              {userDetails.disability_types.map(type => (
                <span key={type} style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 基本情報セクション */}
          <SectionCard title="基本情報" icon={<User size={18} />} color="#22c55e">
            <FieldRow label="氏名" value={basicInfo.full_name} />
            <FieldRow label="地区" value={basicInfo.district} />
            <FieldRow label="電話番号" value={basicInfo.phone_number} />
            {hasDetailData && (
              <>
                <FieldRow label="年齢" value={userDetails?.age ? `${userDetails.age}歳` : null} />
                <FieldRow label="性別" value={userDetails?.gender} />
                <FieldRow label="障害等級・程度" value={userDetails?.disability_grade} />
              </>
            )}
          </SectionCard>

          {/* 詳細情報セクション（サポート情報）*/}
          {hasDetailData && (userDetails?.guardian_name || userDetails?.emergency_contact || userDetails?.medical_info || userDetails?.transportation_needs || userDetails?.other_requirements) && (
            <SectionCard title="サポート情報" icon={<Shield size={18} />} color="#6366f1">
              <FieldRow label="保護者・家族名" value={userDetails?.guardian_name} />
              <FieldRow label="保護者電話番号" value={userDetails?.guardian_phone} />
              <FieldRow label="緊急連絡先" value={userDetails?.emergency_contact} />
              <FieldRow label="医療・服薬情報" value={userDetails?.medical_info} />
              <FieldRow label="移動手段・通所方法" value={userDetails?.transportation_needs} />
              <FieldRow label="その他要望・備考" value={userDetails?.other_requirements} />
            </SectionCard>
          )}

          {/* アセスメントセクション */}
          {hasAssessmentData && (
            <SectionCard title="アセスメント" icon={<Heart size={18} />} color="#ec4899">
              <AssessmentField label="生育歴・生活歴" value={assessment?.life_history} />
              <AssessmentField label="医療・療育歴" value={assessment?.medical_history} />
              <AssessmentField label="現在の医療機関・サービス利用状況" value={assessment?.medical_usage} />
              <AssessmentField label="福祉用具・補装具の利用状況" value={assessment?.welfare_equipment} />
              <AssessmentField label="日常生活の状況（本人）" value={assessment?.daily_life_self} />
              <AssessmentField label="日常生活の状況（家族・支援者）" value={assessment?.daily_life_guardian} />
              <AssessmentField label="本人が望む生活" value={assessment?.desired_life} />
              <AssessmentField label="家族・支援者の希望" value={assessment?.family_requests} />
              <AssessmentField label="現在の支援状況" value={assessment?.support_status} />
              <AssessmentField label="その他特記事項" value={assessment?.assessment_other} />
            </SectionCard>
          )}

          {/* サービス等利用計画セクション */}
          {servicePlan && (
            <SectionCard title="サービス等利用計画" icon={<ClipboardList size={18} />} color="#f59e0b">
              <ServicePlanView plan={servicePlan} />
            </SectionCard>
          )}

          {/* データが全くない場合 */}
          {!hasDetailData && !hasAssessmentData && !servicePlan && (
            <div style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: '1rem', padding: '3rem',
              textAlign: 'center', color: '#9ca3af'
            }}>
              <FileText size={48} style={{ marginBottom: '1rem', color: '#d1d5db' }} />
              <p style={{ margin: 0 }}>詳細な情報は登録されていません。</p>
            </div>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default UserProfilePage
