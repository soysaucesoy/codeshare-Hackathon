// pages/user/login.tsx - 利用者ログインページ
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const UserLoginPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // エラーをクリア
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      // ログイン成功時の処理
      // トークンをlocalStorageに保存（実際の実装では適切な方法を選択）
      if (data.token) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      // リダイレクト先を確認（クエリパラメータから取得）
      const returnUrl = router.query.returnUrl as string || '/dashboard';
      router.push(returnUrl);

    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>利用者ログイン - ケアコネクト</title>
        <meta name="description" content="ケアコネクトの利用者ログインページです" />
      </Head>

      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ケアコネクト</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/help" 
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ヘルプ
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* タイトル */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              利用者ログイン
            </h2>
            <p className="text-sm text-gray-600">
              ケアコネクトにログインして、サービスを利用しましょう
            </p>
          </div>

          {/* ログインフォーム */}
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* エラーメッセージ */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  ❌ {error}
                </div>
              )}

              {/* メールアドレス */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="your-email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              {/* パスワード */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="パスワードを入力"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <span className="text-gray-400 hover:text-gray-600 text-sm">
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </button>
                </div>
              </div>

              {/* パスワードを忘れた場合 */}
              <div className="text-right">
                <Link 
                  href="/user/forgot-password"
                  className="text-sm text-green-600 hover:text-green-500"
                >
                  パスワードを忘れた場合
                </Link>
              </div>

              {/* ログインボタン */}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? '処理中...' : 'ログイン'}
                </button>
              </div>
            </form>

            {/* 新規登録リンク */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  アカウントをお持ちでない場合{' '}
                  <Link 
                    href="/user/register"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    新規登録はこちら
                  </Link>
                </p>
              </div>
            </div>

            {/* 事業者向けリンク */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                事業者の方は{' '}
                <Link 
                  href="/provider/login"
                  className="text-green-600 hover:text-green-500"
                >
                  こちらからログイン
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-sm text-gray-900 font-medium">ケアコネクト</span>
            </div>
            <span className="text-xs text-gray-500">© 2025 All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLoginPage;