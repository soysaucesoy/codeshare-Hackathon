// components/providers/AuthProvider.tsx
'use client'

import React from 'react'
import { AuthProvider as AuthContextProvider } from '@/lib/hooks/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  )
}