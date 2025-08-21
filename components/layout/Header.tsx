import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider'; // AuthProviderからuseAuthをインポート
import { useRouter } from 'next/router';

const Header: React.FC = () => {
  const { user, loading } = useAuth(); // 認証情報を取得
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // ログアウト後にホームページへ
  };

  return (
    <header style={{
      background: 'white',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 0'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* ロゴ部分（変更なし） */}
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2rem', height: '2rem', background: '#22c55e', borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.125rem' }}>C</span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>ケアコネクト</span>
          </div>
        </Link>
        
        {/* 認証状態に応じたボタン表示 */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!loading && (
            <>
              {user ? (
                <>
                  <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151', background: '#f3f4f6', borderRadius: '0.375rem', textDecoration: 'none' }}>
                    ログイン
                  </Link>
                  <Link href="/auth/register" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'white', background: '#22c55e', borderRadius: '0.375rem', textDecoration: 'none' }}>
                    新規登録
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;