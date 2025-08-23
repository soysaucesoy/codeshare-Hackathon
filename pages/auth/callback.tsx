// pages/auth/callback.tsx - OAuth認証コールバック
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const AuthCallback: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('認証コールバックエラー:', error);
          router.push('/auth/login?error=callback_failed');
          return;
        }

        if (data.session) {
          console.log('認証成功:', data.session.user);
          router.push('/');
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('認証処理エラー:', error);
        router.push('/auth/login?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>認証中 - ケアコネクト</title>
        <meta name="description" content="認証を処理しています" />
      </Head>
      
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">認証を処理しています...</p>
      </div>
    </div>
  );
};

export default AuthCallback;