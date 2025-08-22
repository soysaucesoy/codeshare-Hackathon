// pages/auth/login.tsx （更新版）
import React from 'react'
import Head from 'next/head'
import ImprovedLoginForm from '@/components/auth/ImprovedLoginForm'

const LoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>ログイン - ケアコネクト</title>
        <meta name="description" content="ケアコネクトにログインして、より便利にサービスをご利用ください" />
      </Head>
      <ImprovedLoginForm />
    </>
  )
}

export default LoginPage