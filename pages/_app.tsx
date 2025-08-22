// pages/_app.tsx
import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from '@/components/providers/AuthProvider'
import '@/styles/globals.css' // 提供されたglobals.cssを使用

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>ケアコネクト - 東京都障害福祉サービス</title>
        <meta name="description" content="東京都の障害福祉サービス事業所と利用者をつなぐプラットフォーム" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}