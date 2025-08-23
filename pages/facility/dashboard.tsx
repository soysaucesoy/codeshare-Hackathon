// pages/facility/dashboard.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/hooks/useAuth'
import FacilityDashboard from '@/components/dashboard/FacilityDashboard'

export default function FacilityDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/facility/login')
    } else if (!loading && user && user.user_metadata?.user_type !== 'facility') {
      router.push('/user/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>読み込み中...</div>
      </div>
    )
  }

  if (!user || user.user_metadata?.user_type !== 'facility') {
    return null
  }

  return <FacilityDashboard />
}