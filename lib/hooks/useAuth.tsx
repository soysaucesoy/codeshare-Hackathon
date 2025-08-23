// lib/hooks/useAuth.tsx - 統合版
import { useContext } from 'react'
import { AuthContext } from '@/components/providers/AuthProvider'

// AuthContextから値を取得するフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 追加のヘルパーフック（必要に応じて）
export function useAuthContext() {
  return useAuth() // 同じものを参照
}