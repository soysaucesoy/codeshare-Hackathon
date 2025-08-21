// pages/auth/register.tsx - 新規登録ページ
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, 
  ArrowLeft, ArrowRight, Check, Users, Building2 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 東京23区
const TOKYO_DISTRICTS = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
  '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
  '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
  '葛飾区', '江戸川区'
];

// 障害種別
const DISABILITY_TYPES = [
  '身体障害', '知的障害', '精神障害', '発達障害', '難病等', 'その他'
];

// UI Components (前回のものと同じ - Button, Input, Card)
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ 
  variant = 'primary', 
  size = 'md', 
  type = 'button', 
  disabled = false,
  loading = false,
  children, 
  onClick, 
  className = '' 
}) => {
  const variants = {
    primary: 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

const Input: React.FC<{
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
  required?: boolean;
  helperText?: string;
}> = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error, 
  startIcon, 
  endIcon, 
  className = '',
  required = false,
  helperText
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{startIcon}</div>
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`block w-full px-3 py-2 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
            startIcon ? 'pl-10' : ''
          } ${
            endIcon ? 'pr-10' : ''
          } ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
          } ${className}`}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
            {endIcon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

// Register Page Component
const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { type } = router.query; // URL パラメータから user type を取得
  
  const [userType, setUserType] = useState<'user' | 'facility' | ''>('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    // 共通フィールド
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    district: '',
    
    // 利用者専用フィールド
    age: '',
    gender: '',
    disability_types: [] as string[],
    disability_grade: '',
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: '',
    medical_info: '',
    transportation_needs: '',
    other_requirements: '',
    receive_notifications: false,
    
    // 事業所専用フィールド
    facility_name: '',
    facility_description: '',
    address: '',
    website_url: '',
  });

  // URL パラメータからユーザータイプを設定
  useEffect(() => {
    if (type === 'user' || type === 'facility') {
      setUserType(type as 'user' | 'facility');
    }
  }, [type]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラークリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayToggle = (field: string, value: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleInputChange(field, newArray);
  };

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      // 基本情報のバリデーション
      if (!formData.email) newErrors.email = 'メールアドレスは必須です';
      if (!formData.password) newErrors.password = 'パスワードは必須です';
      if (formData.password.length < 6) newErrors.password = 'パスワードは6文字以上で入力してください';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'パスワード確認は必須です';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'パスワードが一致しません';
      }
      if (!formData.full_name) newErrors.full_name = userType === 'user' ? '氏名は必須です' : '担当者名は必須です';
      
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.email = '正しいメールアドレスを入力してください';
      }
    }

    if (stepNumber === 2 && userType === 'facility') {
      if (!formData.facility_name) newErrors.facility_name = '事業所名は必須です';
      if (!formData.address) newErrors.address = '住所は必須です';
      if (!formData.district) newErrors.district = '地区は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    try {
      setLoading(true);
      setErrors({});

      // Supabaseでユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: userType,
            full_name: formData.full_name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // プロフィール作成
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            user_type: userType,
            email: formData.email,
            full_name: formData.full_name,
            phone_number: formData.phone_number || null,
            district: formData.district || null,
          });

        if (profileError) throw profileError;

        // ユーザータイプ別の追加データ作成
        if (userType === 'user') {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              profile_id: authData.user.id,
              age: formData.age ? parseInt(formData.age) : null,
              gender: formData.gender || null,
              disability_types: formData.disability_types,
              disability_grade: formData.disability_grade || null,
              guardian_name: formData.guardian_name || null,
              guardian_phone: formData.guardian_phone || null,
              emergency_contact: formData.emergency_contact || null,
              medical_info: formData.medical_info || null,
              transportation_needs: formData.transportation_needs || null,
              other_requirements: formData.other_requirements || null,
              receive_notifications: formData.receive_notifications,
            });

          if (userError) throw userError;
        } else if (userType === 'facility') {
          const { error: facilityError } = await supabase
            .from('facilities')
            .insert({
              profile_id: authData.user.id,
              name: formData.facility_name,
              description: formData.facility_description || null,
              address: formData.address,
              district: formData.district,
              phone_number: formData.phone_number || null,
              website_url: formData.website_url || null,
              is_active: true,
            });

          if (facilityError) throw facilityError;
        }

        // 成功 - 確認ページに遷移
        router.push('/auth/verify-email');
      }

    } catch (error: any) {
      console.error('登録エラー:', error);
      
      let errorMessage = '登録に失敗しました';
      if (error.message?.includes('User already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています';
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'パスワードは6文字以上で入力してください';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ユーザータイプ選択画面
  if (!userType) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Head>
          <title>新規登録 - ケアコネクト</title>
        </Head>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>ホームに戻る</span>
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ケアコネクト</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">アカウント作成</h2>
            <p className="mt-2 text-sm text-gray-600">
              登録タイプを選択してください
            </p>
          </div>

          <Card>
            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center space-x-3"
                onClick={() => setUserType('user')}
              >
                <Users size={20} />
                <span>利用者として登録</span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-center space-x-3"
                onClick={() => setUserType('facility')}
              >
                <Building2 size={20} />
                <span>事業所として登録</span>
              </Button>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                すでにアカウントをお持ちの方は{' '}
                <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
                  こちらからログイン
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const totalSteps = userType === 'user' ? 3 : 2;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>
          {userType === 'user' ? '利用者' : '事業所'}登録 - ケアコネクト
        </title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 1 ? setUserType('') : setStep(step - 1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>戻る</span>
          </Button>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              ステップ {step} / {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {userType === 'user' ? '利用者登録' : '事業所登録'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          {/* ステップ1: 基本情報 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
                <p className="text-gray-600 mt-1">アカウントの基本情報を入力してください</p>
              </div>

              {/* 全般エラー */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  startIcon={<Mail size={16} />}
                  required
                />

                <Input
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6文字以上のパスワード"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={errors.password}
                  startIcon={<Lock size={16} />}
                  endIcon={
                    <div onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  }
                  required
                />

                <Input
                  label="パスワード確認"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="上記と同じパスワード"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  startIcon={<Lock size={16} />}
                  required
                />

                <Input
                  label={userType === 'user' ? '氏名' : '担当者名'}
                  placeholder="山田 太郎"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  error={errors.full_name}
                  startIcon={<User size={16} />}
                  required
                />

                <Input
                  label="電話番号"
                  type="tel"
                  placeholder="03-1234-5678"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  error={errors.phone_number}
                  startIcon={<Phone size={16} />}
                  helperText="任意項目です"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    所在地区
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">選択してください</option>
                    {TOKYO_DISTRICTS.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.district && <p className="text-sm text-red-600 mt-1">{errors.district}</p>}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  次へ
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ステップ2: 利用者詳細情報 */}
          {step === 2 && userType === 'user' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">詳細情報</h2>
                <p className="text-gray-600 mt-1">サービス提供のための詳細情報（任意）</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="年齢"
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">選択してください</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                    <option value="その他">その他</option>
                    <option value="回答しない">回答しない</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  障害種別（複数選択可）
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DISABILITY_TYPES.map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.disability_types.includes(type)}
                        onChange={() => handleArrayToggle('disability_types', type)}
                        className="text-green-500 focus:ring-green-500 rounded"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  戻る
                </Button>
                <Button onClick={handleNext}>
                  次へ
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ステップ2: 事業所詳細情報 */}
          {step === 2 && userType === 'facility' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">事業所情報</h2>
                <p className="text-gray-600 mt-1">事業所の詳細情報を入力してください</p>
              </div>

              <Input
                label="事業所名"
                placeholder="○○福祉サービス事業所"
                value={formData.facility_name}
                onChange={(e) => handleInputChange('facility_name', e.target.value)}
                error={errors.facility_name}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業所説明
                </label>
                <textarea
                  placeholder="事業所の概要や特徴を入力してください"
                  rows={4}
                  value={formData.facility_description}
                  onChange={(e) => handleInputChange('facility_description', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <Input
                label="住所"
                placeholder="東京都○○区○○ 1-2-3"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={errors.address}
                required
              />

              <Input
                label="ウェブサイトURL"
                type="url"
                placeholder="https://example.com"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                helperText="任意項目です"
              />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  戻る
                </Button>
                <Button
                  loading={loading}
                  onClick={handleSubmit}
                >
                  <Check size={16} className="mr-2" />
                  登録完了
                </Button>
              </div>
            </div>
          )}

          {/* ステップ3: 利用者の設定 */}
          {step === 3 && userType === 'user' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">設定</h2>
                <p className="text-gray-600 mt-1">最後に、通知設定などを行います</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.receive_notifications}
                    onChange={(e) => handleInputChange('receive_notifications', e.target.checked)}
                    className="mt-0.5 text-green-500 focus:ring-green-500 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      メール通知を受信する
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      希望するサービスに空きが出た際にメールでお知らせします
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  戻る
                </Button>
                <Button
                  loading={loading}
                  onClick={handleSubmit}
                >
                  <Check size={16} className="mr-2" />
                  登録完了
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
              こちらからログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;