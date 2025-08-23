// components/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ data: any, error: any }>
  signInWithEmail: (email: string, password: string) => Promise<{ data: any, error: any }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('=== AuthProvider初期セッション取得 ===')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('初期セッション取得エラー:', error)
        } else {
          console.log('初期セッション:', session?.user?.id || 'なし')
        }
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('セッション取得例外:', err)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== Auth state changed ===', {
          event,
          userId: session?.user?.id || 'no user',
          timestamp: new Date().toISOString()
        })
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      console.log('AuthProvider cleanup: subscription解除')
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('=== AuthProvider signInWithEmail ===', { email })
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('サインイン結果:', {
        success: !error,
        userId: data?.user?.id || 'なし',
        error: error?.message || 'なし'
      })
      
      return { data, error }
    } catch (err) {
      console.error('サインイン例外:', err)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      console.log('=== AuthProvider signUpWithEmail ===')
      console.log('パラメータ:', { email, passwordLength: password.length, fullName })
      setLoading(true)
      
      // バリデーション
      if (!email || !password || !fullName) {
        const error = { message: '必須項目が不足しています' }
        return { data: null, error }
      }
      
      if (password.length < 6) {
        const error = { message: 'パスワードは6文字以上である必要があります' }
        return { data: null, error }
      }
      
      console.log('Supabase Auth signUpを呼び出し中...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })
      
      console.log('=== AuthProvider signUpWithEmail完了 ===')
      console.log('結果:', {
        success: !error,
        userId: data?.user?.id || 'なし',
        sessionExists: !!data?.session,
        needsConfirmation: data?.user && !data.session,
        error: error ? {
          message: error.message,
          status: (error as any).status,
          code: (error as any)?.code
        } : 'なし'
      })
      
      return { data, error }
      
    } catch (err) {
      console.error('=== AuthProvider signUpWithEmail例外 ===')
      console.error('例外詳細:', {
        message: err instanceof Error ? err.message : err,
        type: typeof err
      })
      
      return { 
        data: null, 
        error: { message: err instanceof Error ? err.message : 'Unknown signup error' }
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('=== AuthProvider signOut ===')
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (!error) {
        console.log('サインアウト成功: 状態をクリア')
        setUser(null)
        setSession(null)
      } else {
        console.error('サインアウト失敗:', error)
      }
      
      return { error }
    } catch (err) {
      console.error('サインアウト例外:', err)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    signUpWithEmail,
    signInWithEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}