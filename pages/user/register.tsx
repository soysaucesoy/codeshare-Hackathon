// pages/user/register.tsx - 利用者新規登録ページ
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface FormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  birthDate: string;
  gender: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

const UserRegisterPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    postalCode: '',
    prefecture: '東京都',
    city: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    agreedToTerms: false,
    agreedToPrivacy: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // 個別エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必須項目のチェック
    if (!formData.lastName) newErrors.lastName = '姓を入力してください';
    if (!formData.firstName) newErrors.firstName = '名を入力してください';
    if (!formData.lastNameKana) newErrors.lastNameKana = '姓（カナ）を入力してください';
    if (!formData.firstNameKana) newErrors.firstNameKana = '名（カナ）を入力してください';
    if (!formData.email) newErrors.email = 'メールアドレスを入力してください';
    if (!formData.password) newErrors.password = 'パスワードを入力してください';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'パスワード確認を入力してください';
    if (!formData.phoneNumber) newErrors.phoneNumber = '電話番号を入力してください';
    if (!formData.birthDate) newErrors.birthDate = '生年月日を選択してください';
    if (!formData.gender) newErrors.gender = '性別を選択してください';

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = '正しいメールアドレス形式で入力してください';
    }

    // パスワード強度チェック
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    // パスワード確認チェック
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // 電話番号形式チェック
    const phoneRegex = /^[\d-]+$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '電話番号は数字とハイフンのみで入力してください';
    }

    // 同意項目のチェック
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = '利用規約への同意が必要です';
    }
    if (!formData.agreedToPrivacy) {
      newErrors.agreedToPrivacy = 'プライバシーポリシーへの同意が必要です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      // 登録成功時の処理
      alert('登録が完了しました！確認メールをお送りしましたので、メールの確認をお願いします。');
      router.push('/user/login');

    } catch (err) {
      console.error('登録エラー:', err);
      setErrors({
        general: err instanceof Error ? err.message : '登録に失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>利用者新規登録 - ケアコネクト</title>
        <meta name="description" content="ケアコネクトの利用者新規登録ページです" />
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
              <Link 
                href="/user/login" 
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              利用者新規登録
            </h2>
            <p className="text-sm text-gray-600">
              ケアコネクトに登録して、適切なケアサービスを見つけましょう
            </p>
          </div>

          {/* 登録フォーム */}
          <div className="bg-white py-8 px-6 shadow sm:rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 全般エラーメッセージ */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  ❌ {errors.general}
                </div>
              )}

              {/* 基本情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  基本情報
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 姓 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="山田"
                      disabled={loading}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  {/* 名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="太郎"
                      disabled={loading}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  {/* 姓（カナ） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓（カナ） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastNameKana"
                      value={formData.lastNameKana}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.lastNameKana ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="ヤマダ"
                      disabled={loading}
                    />
                    {errors.lastNameKana && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastNameKana}</p>
                    )}
                  </div>

                  {/* 名（カナ） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名（カナ） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstNameKana"
                      value={formData.firstNameKana}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.firstNameKana ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="タロウ"
                      disabled={loading}
                    />
                    {errors.firstNameKana && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstNameKana}</p>
                    )}
                  </div>

                  {/* 生年月日 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      生年月日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.birthDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    {errors.birthDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>
                    )}
                  </div>

                  {/* 性別 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      性別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.gender ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <option value="">選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                      <option value="prefer_not_to_say">回答しない</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 連絡先情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  連絡先情報
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* メールアドレス */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your-email@example.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* 電話番号 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="090-1234-5678"
                      disabled={loading}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* パスワード設定 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  パスワード設定
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* パスワード */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パスワード <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="8文字以上で入力"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="text-gray-400 text-sm">
                          {showPassword ? '🙈' : '👁️'}
                        </span>
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* パスワード確認 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パスワード確認 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="同じパスワードを再入力"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <span className="text-gray-400 text-sm">
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </span>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 同意項目 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                  利用規約・プライバシーポリシー
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleInputChange}
                      className="mt-1 mr-2"
                      disabled={loading}
                    />
                    <span className="text-sm">
                      <Link href="/terms" className="text-green-600 hover:text-green-500">
                        利用規約
                      </Link>
                      に同意します <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-red-500 text-xs">{errors.agreedToTerms}</p>
                  )}

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreedToPrivacy"
                      checked={formData.agreedToPrivacy}
                      onChange={handleInputChange}
                      className="mt-1 mr-2"
                      disabled={loading}
                    />
                    <span className="text-sm">
                      <Link href="/privacy" className="text-green-600 hover:text-green-500">
                        プライバシーポリシー
                      </Link>
                      に同意します <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.agreedToPrivacy && (
                    <p className="text-red-500 text-xs">{errors.agreedToPrivacy}</p>
                  )}
                </div>
              </div>

              {/* 登録ボタン */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? '登録中...' : '新規登録'}
                </button>
              </div>
            </form>

            {/* ログインリンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちの場合{' '}
                <Link 
                  href="/user/login"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  ログインはこちら
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

export default UserRegisterPage;