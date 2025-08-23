// pages/auth/register.tsx （更新版）
import React from 'react'
import Head from 'next/head'
import ImprovedRegisterForm from '@/components/auth/ImprovedRegisterForm'

const RegisterPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>新規登録 - ケアコネクト</title>
        <meta name="description" content="ケアコネクトのアカウントを作成して、ブックマークやメッセージ機能をご利用ください" />
      </Head>
      <ImprovedRegisterForm />
    </>
  )
}

export default RegisterPage