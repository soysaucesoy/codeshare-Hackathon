// pages/user/dashboard.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/hooks/useAuth'
import UserDashboard from '@/components/dashboard/UserDashboard'

export default function UserDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/user/login')
    } else if (!loading && user && user.user_metadata?.user_type !== 'user') {
      router.push('/facility/dashboard')
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

  if (!user || user.user_metadata?.user_type !== 'user') {
    return null
  }

  return <UserDashboard />
}