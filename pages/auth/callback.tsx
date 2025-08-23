// pages/auth/callback.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/hooks/useAuth'

const AuthCallback: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/auth/complete-profile')
    } else {
      router.push('/auth/login')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>認証処理中...</p>
    </div>
  )
}
export default AuthCallback
