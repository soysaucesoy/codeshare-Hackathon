// pages/auth/verify-email.tsx - CSS修正版
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div style={{
    background: 'white',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    padding: '1.5rem'
  }}>
    {children}
  </div>
);

const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  href?: string;
  style?: React.CSSProperties;
}> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick, 
  className = '',
  href,
  style = {}
}) => {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: 'white',
      border: 'none'
    },
    secondary: {
      background: 'white',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    ghost: {
      background: 'transparent',
      color: '#374151',
      border: 'none'
    }
  };

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' }
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textDecoration: 'none',
    ...variants[variant],
    ...sizes[size],
    ...style
  };

  if (href) {
    return (
      <Link 
        href={href} 
        style={baseStyle}
        onMouseEnter={(e) => {
          if (variant === 'primary') {
            (e.target as HTMLAnchorElement).style.transform = 'translateY(-1px)';
            (e.target as HTMLAnchorElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLAnchorElement).style.transform = 'translateY(0)';
          (e.target as HTMLAnchorElement).style.boxShadow = 'none';
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button 
      style={baseStyle} 
      onClick={onClick}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.target as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
};

const VerifyEmailPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '3rem 1.5rem'
    }}>
      <Head>
        <title>メール認証 - ケアコネクト</title>
        <meta name="description" content="ケアコネクトのメール認証を完了してください" />
      </Head>

      <div style={{
        width: '100%',
        maxWidth: '28rem',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.25rem',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>C</span>
            </div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>ケアコネクト</span>
          </div>
        </div>

        <Card>
          <div style={{ textAlign: 'center' }}>
            {/* 成功アイコン */}
            <div style={{
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '3rem',
              width: '3rem',
              borderRadius: '50%',
              background: '#dcfce7',
              marginBottom: '1rem'
            }}>
              <CheckCircle style={{ height: '1.5rem', width: '1.5rem', color: '#16a34a' }} />
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 0.5rem 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              アカウント作成完了！
            </h2>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              ご登録いただいたメールアドレスに認証メールを送信しました。
              メール内のリンクをクリックして認証を完了してください。
            </p>

            {/* メールアイコンとイラスト */}
            <div style={{
              background: '#dbeafe',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <Mail style={{ height: '2rem', width: '2rem', color: '#2563eb', margin: '0 auto 0.75rem auto', display: 'block' }} />
              <p style={{
                fontSize: '0.875rem',
                color: '#1e40af',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                メールが届かない場合は、迷惑メールフォルダもご確認ください
              </p>
            </div>

            {/* 注意事項 */}
            <div style={{
              background: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#a16207',
                margin: '0 0 0.5rem 0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>認証完了まで：</h3>
              <ul style={{
                fontSize: '0.75rem',
                color: '#a16207',
                margin: 0,
                paddingLeft: '1rem',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1.4
              }}>
                <li style={{ marginBottom: '0.25rem' }}>メール内のリンクをクリックしてください</li>
                <li style={{ marginBottom: '0.25rem' }}>認証が完了するとログインできるようになります</li>
                <li>メールが届かない場合は24時間後に再送信されます</li>
              </ul>
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button 
                variant="primary" 
                size="lg" 
                href="/auth/login"
              >
                <div style={{ width: '100%' }}>
                  ログインページへ
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                size="md" 
                href="/"
              >
                <div style={{ 
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <ArrowLeft size={16} />
                  ホームページへ戻る
                </div>
              </Button>
            </div>
          </div>
        </Card>

        {/* サポート情報 */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            メール認証に関してご不明な点がございましたら{' '}
            <a 
              href="mailto:support@care-connect.jp" 
              style={{
                color: '#22c55e',
                textDecoration: 'none',
                fontWeight: 500
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#16a34a'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#22c55e'}
            >
              サポートまでお問い合わせ
            </a>
            ください
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;