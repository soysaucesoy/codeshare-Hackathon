// pages/facilities/[id].tsx - 検索状態復元機能付き事業所詳細ページ
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { MapPin, Phone, Globe, MessageCircle, Heart, ArrowLeft, Clock, Users, Star, Building, Calendar, ExternalLink } from 'lucide-react';
import BookmarkIcon from '@/components/ui/BookmarkIcon';

// 型定義
interface Service {
  id: number;
  service_id: number;
  availability: 'available' | 'unavailable';
  capacity: number | null;
  current_users: number;
  service?: {
    name: string;
    category: string;
    description: string;
  };
}

interface Facility {
  id: number;
  name: string;
  description: string | null;
  appeal_points: string | null;
  address: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  phone_number: string | null;
  website_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
  // 詳細ページ用の追加プロパティ
  operating_hours?: string;
  established_date?: string;
  organization_type?: string;
  staff_count?: number;
  accessibility_features?: string[];
  transportation_info?: string;
  fees_info?: string;
  contact_person?: string;
  email?: string;
}

// ユーティリティ関数
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2,4})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
}

// Badge コンポーネント
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: '500',
        borderRadius: '9999px',
        padding: size === 'sm' ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
        fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
        backgroundColor: variant === 'default' ? '#f3f4f6' : 
                        variant === 'success' ? '#dcfce7' : 
                        variant === 'warning' ? '#fef3c7' : 
                        variant === 'error' ? '#fecaca' : '#dbeafe',
        color: variant === 'default' ? '#374151' : 
               variant === 'success' ? '#166534' : 
               variant === 'warning' ? '#92400e' : 
               variant === 'error' ? '#dc2626' : '#1e40af',
      }}
    >
      {children}
    </span>
  );
};

// ServiceTag コンポーネント
const ServiceTag: React.FC<{
  service?: {
    name: string;
    category: string;
    description: string;
  };
  availability: 'available' | 'unavailable';
  capacity?: number | null;
  currentUsers?: number;
}> = ({ service, availability, capacity, currentUsers = 0 }) => {
  if (!service) return null;

  const variant = availability === 'available' ? 'success' : 'default';
  const symbol = availability === 'available' ? '○' : '×';

  return (
    <div 
      style={{
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid',
        borderColor: availability === 'available' ? '#22c55e' : '#d1d5db',
        backgroundColor: availability === 'available' ? '#f0fdf4' : '#f9fafb'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: '600', color: availability === 'available' ? '#166534' : '#6b7280' }}>
          {symbol} {service.name}
        </span>
        <Badge variant={variant} size="sm">
          {service.category}
        </Badge>
      </div>
      
      <p style={{ 
        fontSize: '0.75rem', 
        color: '#6b7280', 
        margin: '0 0 0.5rem 0',
        lineHeight: 1.4 
      }}>
        {service.description}
      </p>
      
      {availability === 'available' && capacity && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#059669',
          fontWeight: '500'
        }}>
          利用可能枠: {capacity - currentUsers}/{capacity}名
          {capacity - currentUsers > 0 ? (
            <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>✓ 空きあり</span>
          ) : (
            <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>満員</span>
          )}
        </div>
      )}
    </div>
  );
};

// InfoCard コンポーネント
const InfoCard: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, children, icon }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      {icon && <div style={{ color: '#22c55e' }}>{icon}</div>}
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '600', 
        color: '#111827',
        margin: 0
      }}>
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// 事業所詳細ページコンポーネント（検索状態復元機能付き）
const FacilityDetailPage: React.FC = () => {
  const router = useRouter();
  const { id, ...searchParams } = router.query;
  const { user } = useAuthContext();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const isLoggedIn = !!user;

  // 検索に戻るためのURL構築
  const getBackToSearchUrl = () => {
    // URLパラメータから検索条件を取得
    const params = new URLSearchParams();
    
    const getString = (value: string | string[] | undefined): string => {
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) return value[0] || '';
      return '';
    };
    
    // 検索条件をURLパラメータから復元
    if (searchParams.q) {
      const value = getString(searchParams.q);
      if (value) params.append('q', value);
    }
    if (searchParams.district) {
      const value = getString(searchParams.district);
      if (value) params.append('district', value);
    }
    if (searchParams.services) {
      const value = getString(searchParams.services);
      if (value) params.append('services', value);
    }
    if (searchParams.available) {
      const value = getString(searchParams.available);
      if (value) params.append('available', value);
    }
    if (searchParams.page) {
      const value = getString(searchParams.page);
      if (value) params.append('page', value);
    }
    if (searchParams.view) {
      const value = getString(searchParams.view);
      if (value) params.append('view', value);
    }

    const queryString = params.toString();
    const backUrl = queryString ? `/?${queryString}` : '/';
    
    return backUrl;
  };

  // データ取得
  useEffect(() => {
    if (!id || Array.isArray(id)) {
      return;
    }

    const fetchFacility = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/facilities/${id}`);
        
        if (!response.ok) {
          throw new Error('事業所情報の取得に失敗しました');
        }

        const data = await response.json();
        setFacility(data);
      } catch (err) {
        console.error('事業所詳細取得エラー:', err);
        setError(err instanceof Error ? err.message : '事業所情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  // ブックマークトグル
  const handleBookmarkToggle = async () => {
    if (!isLoggedIn || !facility) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }

    try {
      await toggleBookmark(facility.id.toString());
      console.log('ブックマーク操作完了');
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
      alert('ブックマーク操作中にエラーが発生しました。');
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <div>
        <Head>
          <title>事業所詳細 - ケアコネクト</title>
        </Head>
        
        <header className="header">
          <div className="container">
            <Link href="/" className="logo-container">
              <div className="logo">C</div>
              <h1 className="main-title">ケアコネクト</h1>
            </Link>
          </div>
        </header>

        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p>事業所情報を読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  // エラー状態
  if (error || !facility) {
    return (
      <div>
        <Head>
          <title>事業所が見つかりません - ケアコネクト</title>
        </Head>
        
        <header className="header">
          <div className="container">
            <Link href="/" className="logo-container">
              <div className="logo">C</div>
              <h1 className="main-title">ケアコネクト</h1>
            </Link>
          </div>
        </header>

        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="error-container">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2>事業所が見つかりません</h2>
            <p className="error-message">{error || '指定された事業所は存在しないか、削除された可能性があります。'}</p>
            <Link href={getBackToSearchUrl()}>
              <button className="cta-primary" style={{ marginTop: '1rem' }}>
                検索ページに戻る
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];

  // 検索状態がある場合の判定
  const hasSearchParams = Object.keys(searchParams).length > 0;

  return (
    <div>
      <Head>
        <title>{facility.name} - 事業所詳細 - ケアコネクト</title>
        <meta name="description" content={facility.description || `${facility.name}の詳細情報`} />
      </Head>

      {/* ヘッダー */}
      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" className="logo-container">
              <div className="logo">C</div>
              <h1 className="main-title">ケアコネクト</h1>
            </Link>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href={getBackToSearchUrl()}>
                <button className="cta-secondary" style={{ 
                  fontSize: '0.875rem', 
                  padding: '0.5rem 1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ArrowLeft size={16} />
                  {hasSearchParams ? '検索結果に戻る' : '検索に戻る'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* パンくずリスト */}
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <Link href={getBackToSearchUrl()} style={{ color: '#22c55e', textDecoration: 'none' }}>
            {hasSearchParams ? '検索結果' : 'ホーム'}
          </Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span>事業所詳細</span>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: '#111827', fontWeight: '500' }}>{facility.name}</span>
        </nav>

        {/* 事業所ヘッダー */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 画像セクション */}
            <div style={{ height: '300px', position: 'relative' }}>
              {facility.image_url && !imageError ? (
                <Image
                  src={facility.image_url}
                  alt={facility.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <Heart size={64} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                  <p style={{ color: '#166534', fontSize: '1.125rem', fontWeight: '500' }}>
                    {facility.name}
                  </p>
                </div>
              )}
              
              {/* オーバーレイ情報 */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                padding: '2rem',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h1 style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      margin: '0 0 0.5rem 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {facility.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} />
                      <span style={{ fontSize: '1rem' }}>{facility.district}</span>
                    </div>
                  </div>
                  
                  {isLoggedIn && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      padding: '0.5rem'
                    }}>
                      <BookmarkIcon
                        isBookmarked={isBookmarked(facility.id.toString())}
                        onClick={handleBookmarkToggle}
                        size="lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 基本情報セクション */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {/* ステータス */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Badge variant={facility.is_active ? 'success' : 'error'}>
                      {facility.is_active ? '営業中' : '休業中'}
                    </Badge>
                    {facility.organization_type && (
                      <Badge variant="info">{facility.organization_type}</Badge>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    最終更新: {new Date(facility.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {/* 連絡先 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {facility.phone_number && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={16} style={{ color: '#22c55e' }} />
                      <a href={`tel:${facility.phone_number}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {formatPhoneNumber(facility.phone_number)}
                      </a>
                    </div>
                  )}
                  {facility.website_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={16} style={{ color: '#22c55e' }} />
                      <a 
                        href={facility.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        公式サイト
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* メインコンテンツ */}
          <div>
            {/* 事業所概要 */}
            {facility.description && (
              <InfoCard title="事業所概要" icon={<Building size={20} />}>
                <p style={{ 
                  lineHeight: 1.7, 
                  color: '#374151',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  {facility.description}
                </p>
              </InfoCard>
            )}

            {/* アピールポイント */}
            {facility.appeal_points && (
              <InfoCard title="アピールポイント" icon={<Star size={20} />}>
                <p style={{ 
                  lineHeight: 1.7, 
                  color: '#22c55e',
                  fontWeight: '500',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  {facility.appeal_points}
                </p>
              </InfoCard>
            )}

            {/* 提供サービス */}
            <InfoCard title="提供サービス" icon={<Heart size={20} />}>
              {availableServices.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    color: '#166534', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    ✅ 利用可能なサービス ({availableServices.length}件)
                  </h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {availableServices.map((service) => (
                      <ServiceTag
                        key={service.id}
                        service={service.service}
                        availability="available"
                        capacity={service.capacity}
                        currentUsers={service.current_users}
                      />
                    ))}
                  </div>
                </div>
              )}

              {unavailableServices.length > 0 && (
                <div>
                  <h4 style={{ 
                    color: '#6b7280', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    ❌ 現在利用できないサービス ({unavailableServices.length}件)
                  </h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {unavailableServices.map((service) => (
                      <ServiceTag
                        key={service.id}
                        service={service.service}
                        availability="unavailable"
                      />
                    ))}
                  </div>
                </div>
              )}

              {availableServices.length === 0 && unavailableServices.length === 0 && (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                  サービス情報がありません
                </p>
              )}
            </InfoCard>
          </div>

          {/* サイドバー */}
          <div>
            {/* アクセス情報 */}
            <InfoCard title="アクセス情報" icon={<MapPin size={20} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    住所
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                    {facility.address}
                  </p>
                </div>
                
                {facility.transportation_info && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      交通アクセス
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {facility.transportation_info}
                    </p>
                  </div>
                )}

                {facility.latitude && facility.longitude && (
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <MapPin size={16} />
                    Google Mapで開く
                  </button>
                )}
              </div>
            </InfoCard>

            {/* 運営情報 */}
            <InfoCard title="運営情報" icon={<Clock size={20} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {facility.operating_hours && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      営業時間
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {facility.operating_hours}
                    </p>
                  </div>
                )}
                
                {facility.established_date && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      設立年月日
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {new Date(facility.established_date).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}

                {facility.staff_count && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      スタッフ数
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={14} />
                      {facility.staff_count}名
                    </p>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* お問い合わせ */}
            <InfoCard title="お問い合わせ" icon={<MessageCircle size={20} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {facility.contact_person && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      担当者
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {facility.contact_person}
                    </p>
                  </div>
                )}

                {facility.email && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      メールアドレス
                    </h4>
                    <a 
                      href={`mailto:${facility.email}`}
                      style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                      {facility.email}
                    </a>
                  </div>
                )}

                {facility.phone_number && (
                  <a
                    href={`tel:${facility.phone_number}`}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Phone size={16} />
                    電話で問い合わせ
                  </a>
                )}
              </div>
            </InfoCard>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <Link href="/" className="footer-logo">
              <div className="footer-logo-icon">C</div>
              <span className="footer-name">ケアコネクト</span>
            </Link>
            <div className="footer-copyright">
              © 2025 ケアコネクト. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FacilityDetailPage;