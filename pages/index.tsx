// pages/index.tsx - ヘッダー内認証ボタン修正版
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // 必要に応じて別行で
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { supabase } from '@/lib/supabase/client'

// 型定義
interface Service {
  id: number;
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
}

interface SearchResponse {
  facilities: Facility[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SearchFilters {
  query: string;
  district: string;
  serviceIds: number[];
  availabilityOnly: boolean;
}

// サービスカテゴリ
const SERVICE_CATEGORIES = {
  '訪問系サービス': [
    { id: 1, name: '居宅介護', description: '自宅で入浴、排せつ、食事の介護などを行います' },
    { id: 2, name: '重度訪問介護', description: '重度の方への総合的な介護支援を行います' },
    { id: 3, name: '同行援護', description: '視覚障害の方への外出時の援護を行います' },
    { id: 4, name: '行動援護', description: '行動時の危険回避のための支援を行います' },
  ],
  '日中活動系サービス': [
    { id: 6, name: '療養介護', description: '医療と常時介護を必要とする方への支援' },
    { id: 7, name: '生活介護', description: '日中の介護と創作・生産活動の機会を提供' },
    { id: 8, name: '短期入所', description: '短期間の入所による介護を行います' },
  ],
  '居住系サービス': [
    { id: 10, name: '共同生活援助', description: 'グループホームでの共同生活支援' },
    { id: 11, name: '自立生活援助', description: '一人暮らしのための生活支援' },
  ],
  '訓練系・就労系サービス': [
    { id: 15, name: '就労移行支援', description: '一般企業への就労を目指す訓練' },
    { id: 16, name: '就労継続支援A型', description: '雇用契約による生産活動の機会を提供' },
    { id: 17, name: '就労継続支援B型', description: '非雇用での生産活動の機会を提供' },
    { id: 18, name: '就労定着支援', description: '就労継続のための支援' },
  ],
  '障害児通所系サービス': [
    { id: 19, name: '児童発達支援', description: '未就学児への発達支援' },
    { id: 21, name: '放課後等デイサービス', description: '就学児の放課後・休日支援' },
  ],
};

// SearchFilterコンポーネント
const SearchFilterComponent: React.FC<{
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}> = ({ onSearch, loading = false }) => {
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [showServiceFilter, setShowServiceFilter] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ 
      query, 
      district, 
      serviceIds: selectedServices,
      availabilityOnly 
    });
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const clearServices = () => {
    setSelectedServices([]);
  };

  // 東京都の市区町村リスト
  const districts = [
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区'
  ];

  const allServices = Object.values(SERVICE_CATEGORIES).flat();

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="事業所名で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="filters-section">
        <h3 className="filters-title">検索条件</h3>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">地区</label>
            <select
              className="filter-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">すべての地区</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              提供サービス 
              {selectedServices.length > 0 && (
                <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>
                  ({selectedServices.length}件選択中)
                </span>
              )}
            </label>
            <button
              type="button"
              className="filter-select"
              style={{ 
                textAlign: 'left',
                cursor: 'pointer',
                background: showServiceFilter ? '#f0fdf4' : 'white'
              }}
              onClick={() => setShowServiceFilter(!showServiceFilter)}
            >
              {selectedServices.length === 0 
                ? 'サービスを選択...' 
                : `${selectedServices.length}件のサービスを選択中`
              }
              <span style={{ float: 'right' }}>
                {showServiceFilter ? '▲' : '▼'}
              </span>
            </button>
          </div>

        </div>

        {/* サービス選択パネル */}
        {showServiceFilter && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem' 
            }}>
              <span className="filter-label">サービスを選択してください</span>
              <button
                type="button"
                onClick={clearServices}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                すべてクリア
              </button>
            </div>

            {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
              <div key={category} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {category}
                </h4>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="filter-checkbox-container"
                      style={{ 
                        padding: '0.5rem',
                        background: selectedServices.includes(service.id) ? '#dcfce7' : 'white',
                        borderRadius: '0.375rem',
                        border: selectedServices.includes(service.id) ? '1px solid #22c55e' : '1px solid #e5e7eb',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 500, 
                          fontSize: '0.875rem',
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {service.name}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          lineHeight: 1.3
                        }}>
                          {service.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 選択されたサービスの表示 */}
        {selectedServices.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="filter-label">選択中のサービス:</div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              {selectedServices.map(serviceId => {
                const service = allServices.find(s => s.id === serviceId);
                return service ? (
                  <span
                    key={serviceId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {service.name}
                    <button
                      type="button"
                      onClick={() => handleServiceToggle(serviceId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#166534',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'left', justifyContent: 'center', gap: '3rem', marginTop: '1.5rem' }}>
          <label className="filter-checkbox-container">
            <input
              type="checkbox"
              className="filter-checkbox"
                style={{ 
                width: '20px',      // 幅
                height: '20px',     // 高さ
                transform: 'scale(1.2)' // 全体的なスケール調整
                }}
              checked={availabilityOnly}
              onChange={(e) => setAvailabilityOnly(e.target.checked)}
            />
            <span className="filter-checkbox-label" style={{ fontSize: '1.5rem', fontWeight: '500' }}>空きのある事務所のみ</span>
          </label>
          <button
            type="submit"
            className="filter-search-button"
            disabled={loading}
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ページネーションコンポーネント
const Pagination: React.FC<{
  pagination: SearchResponse['pagination'];
  onPageChange: (page: number) => void;
  loading?: boolean;
}> = ({ pagination, onPageChange, loading = false }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, hasNext, hasPrev } = pagination;
  
  // 表示するページ番号の範囲を計算
  const getPageNumbers = () => {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, page - half);
    let end = Math.min(pages, start + maxVisible - 1);
    
    // 終端に合わせて開始点を調整
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageNumbers = getPageNumbers();

  const buttonStyle = (isActive: boolean = false, disabled: boolean = false) => ({
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    background: isActive ? '#22c55e' : disabled ? '#f9fafb' : 'white',
    color: isActive ? 'white' : disabled ? '#9ca3af' : '#374151',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: isActive ? '600' : '400',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s'
  });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '2rem',
      padding: '1rem'
    }}>
      {/* 前へボタン */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev || loading}
        style={buttonStyle(false, !hasPrev || loading)}
      >
        ← 前へ
      </button>

      {/* 最初のページ（1ページ目が表示範囲外の場合） */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={loading}
            style={buttonStyle(false, loading)}
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span style={{ color: '#9ca3af', padding: '0 0.5rem' }}>...</span>
          )}
        </>
      )}

      {/* ページ番号ボタン */}
      {pageNumbers.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          disabled={loading}
          style={buttonStyle(pageNum === page, loading)}
        >
          {pageNum}
        </button>
      ))}

      {/* 最後のページ（最終ページが表示範囲外の場合） */}
      {pageNumbers[pageNumbers.length - 1] < pages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < pages - 1 && (
            <span style={{ color: '#9ca3af', padding: '0 0.5rem' }}>...</span>
          )}
          <button
            onClick={() => onPageChange(pages)}
            disabled={loading}
            style={buttonStyle(false, loading)}
          >
            {pages}
          </button>
        </>
      )}

      {/* 次へボタン */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext || loading}
        style={buttonStyle(false, !hasNext || loading)}
      >
        次へ →
      </button>

      {/* ページ情報表示 */}
      <div style={{
        marginLeft: '1rem',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        {page}/{pages} ページ（全{pagination.total}件）
      </div>
    </div>
  );
};

// ブックマーク機能付きFacilityCardコンポーネント
const FacilityCard: React.FC<{ 
  facility: Facility;
  isLoggedIn: boolean;
  isBookmarked: boolean;
  onBookmarkToggle: (facilityId: number) => void;
}> = ({ facility, isLoggedIn, isBookmarked, onBookmarkToggle }) => {
  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];
  
  return (
    <div className="facility-card">
      <div className="facility-image">
        {facility.image_url ? (
          <img src={facility.image_url} alt={facility.name} />
        ) : (
          <div className="no-image">🏢</div>
        )}
      </div>
      
      <div className="facility-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 className="facility-name">{facility.name}</h3>
          {/* ブックマークボタン（ログイン時のみ表示） */}
          {isLoggedIn && (
            <button
              onClick={() => onBookmarkToggle(facility.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                color: isBookmarked ? '#eab308' : '#9ca3af',
                fontSize: '1.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                if (!isBookmarked) {
                  e.currentTarget.style.color = '#eab308';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = isBookmarked ? '#eab308' : '#9ca3af';
              }}
              title={isBookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
            >
              {isBookmarked ? '★' : '☆'}
                <span style={{fontSize: '0.75rem', marginLeft: '0.25rem'}}>
                {isBookmarked ? '保存済み' : '保存'}
                </span>
            </button>
          )}
        </div>
        
        <p className="facility-district">📍 {facility.district}</p>
        
        {facility.description && (
          <p className="facility-description">
            {facility.description.length > 120 
              ? facility.description.slice(0, 120) + '...' 
              : facility.description}
          </p>
        )}

        {facility.appeal_points && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="services-label">✨ アピールポイント</div>
            <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: '500' }}>
              {facility.appeal_points.length > 80 
                ? facility.appeal_points.slice(0, 80) + '...' 
                : facility.appeal_points}
            </p>
          </div>
        )}

        <div className="services-info">
          <div className="services-label">提供サービス</div>
          <div className="services-list">
            {availableServices.slice(0, 3).map((service, index) => (
              <span key={index} className="service-tag available">
                ◯ {service.service?.name || 'サービス'}
              </span>
            ))}
            {unavailableServices.slice(0, 2).map((service, index) => (
              <span key={`unavailable-${index}`} className="service-tag unavailable">
                × {service.service?.name || 'サービス'}
              </span>
            ))}
            {(availableServices.length + unavailableServices.length) > 5 && (
              <span className="more-services">
                他{(availableServices.length + unavailableServices.length) - 5}件
              </span>
            )}
          </div>
        </div>

        <div className="contact-info">
          {facility.phone_number && (
            <p>📞 {facility.phone_number}</p>
          )}
          {facility.website_url && (
            <p>
              🌐 <a href={facility.website_url} target="_blank" rel="noopener noreferrer">
                ウェブサイト
              </a>
            </p>
          )}
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            更新: {new Date(facility.updated_at).toLocaleDateString('ja-JP')}
          </p>
        </div>

        <div className="facility-actions">
          <button className="details-button">
            詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
};

// SearchResultsコンポーネント（ブックマーク機能付き）
const SearchResults: React.FC<{
  facilities: Facility[];
  pagination: SearchResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  isBookmarkMode: boolean;
  isLoggedIn: boolean;
  onBookmarkToggle: (facilityId: number) => void;
  isBookmarked: (facilityId: number) => boolean;
}> = ({ 
  facilities, 
  pagination, 
  loading, 
  error, 
  onPageChange, 
  viewMode, 
  onViewModeChange,
  isBookmarkMode,
  isLoggedIn,
  onBookmarkToggle,
  isBookmarked
}) => {
  if (loading && viewMode === 'list') {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>{isBookmarkMode ? 'ブックマークを読み込み中...' : '検索中...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (facilities.length === 0 && !loading && viewMode === 'list') {
    return (
      <div className="no-results">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3>{isBookmarkMode ? 'ブックマークした事業所がありません' : '検索結果がありません'}</h3>
        <p className="no-results-sub">
          {isBookmarkMode 
            ? '気になる事業所をブックマークしてみてください。'
            : '検索条件を変更して再度お試しください。'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="results-title">
            {isBookmarkMode ? 'ブックマーク' : '検索結果'} ({pagination?.total || facilities.length}件)
          </h2>
          
          {/* 表示切り替えボタン */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onViewModeChange('list')}
              style={{
                padding: '0.5rem 1rem',
                border: viewMode === 'list' ? '2px solid #22c55e' : '1px solid #d1d5db',
                background: viewMode === 'list' ? '#f0fdf4' : 'white',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              📋 リスト表示
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              disabled={isBookmarkMode}
              style={{
                padding: '0.5rem 1rem',
                border: viewMode === 'map' ? '2px solid #22c55e' : '1px solid #d1d5db',
                background: viewMode === 'map' ? '#f0fdf4' : 'white',
                borderRadius: '0.5rem',
                cursor: isBookmarkMode ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: isBookmarkMode ? 0.5 : 1
              }}
            >
              🗺️ 地図表示
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="map-container">
          <div style={{
            height: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>地図表示</h3>
            <p style={{ color: '#6b7280', textAlign: 'center' }}>
              地図機能は開発中です
            </p>
          </div>
          <div className="map-stats">
            {facilities.length}件の事業所が見つかりました
          </div>
        </div>
      ) : (
        <>
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner">⏳</div>
              <p>検索中...</p>
            </div>
          )}
          
          {!loading && facilities.length > 0 && (
            <>
              <div className="facilities-grid">
                {facilities.map((facility) => (
                  <FacilityCard 
                    key={facility.id} 
                    facility={facility} 
                    isLoggedIn={isLoggedIn}
                    isBookmarked={isBookmarked(facility.id)}
                    onBookmarkToggle={onBookmarkToggle}
                  />
                ))}
              </div>

              {/* ページネーション */}
              {!isBookmarkMode && pagination && (
                <Pagination
                  pagination={pagination}
                  onPageChange={onPageChange}
                  loading={loading}
                />
              )}
            </>
          )}

          {/* ブックマーク機能の説明（未ログイン時） */}
          {!isLoggedIn && !isBookmarkMode && facilities.length > 0 && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ color: '#2563eb', marginRight: '0.75rem' }}>💡</div>
                <div>
                  <p style={{ color: '#1e40af', fontWeight: '500', margin: 0 }}>ブックマーク機能について</p>
                  <p style={{ color: '#1e40af', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
                    <Link href="/auth/login" style={{ textDecoration: 'underline', color: '#1d4ed8' }}>
                      ログイン
                    </Link>
                    すると、気になる事業所をブックマークして後で確認できます。
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// メインページ
const HomePage: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuthContext();
  const { bookmarks, refreshBookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null);

  const isLoggedIn = !!user;

  // ブックマークのトグル処理（修正版）
  const handleBookmarkToggle = async (facilityId: number) => {
    if (!isLoggedIn) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }

    try {
      const facilityIdStr = facilityId.toString();
      const isCurrentlyBookmarked = isBookmarked(facilityIdStr);
      
      // useBookmarksフックのtoggleBookmark関数を使用
      await toggleBookmark(facilityIdStr);
      
      console.log(`${isCurrentlyBookmarked ? '削除' : '追加'}しました: ${facilityId}`);
      
      // ブックマークモード時は表示も更新
      if (isBookmarkMode) {
        // 少し待ってからブックマーク表示を更新
        setTimeout(async () => {
          await handleShowBookmarks();
        }, 200);
      }
      
    } catch (error) {
      console.error('❌ ブックマーク操作エラー:', error);
      alert('ブックマーク操作中にエラーが発生しました。');
    }
  };

  // ブックマーク表示処理（修正版）
  const handleShowBookmarks = async () => {
    if (!isLoggedIn) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }
    
    const newBookmarkMode = !isBookmarkMode;
    setIsBookmarkMode(newBookmarkMode);

    if (newBookmarkMode) {
      setLoading(true);
      setError(null);
      setHasSearched(true); 
      console.log('📖 ブックマーク表示開始...');
      
      try {
        // 最新のブックマーク情報を取得
        await refreshBookmarks();
        
        // 少し待ってからブックマーク情報を処理
        setTimeout(async () => {
          try {
            console.log('現在のブックマーク:', bookmarks);
            
            if (bookmarks.length === 0) {
              console.log('ブックマークが0件');
              setFacilities([]);
              setPagination(null);
              setLoading(false);
              return;
            }
            
            // ブックマークから事業所IDを取得
            const bookmarkedFacilityIds = bookmarks.map(bookmark => parseInt(bookmark.facility));
            console.log('ブックマーク事業所ID:', bookmarkedFacilityIds);

            // facility_ids パラメータを使ってAPI呼び出し
            const params = new URLSearchParams();
            params.append('facility_ids', JSON.stringify(bookmarkedFacilityIds));
            
            console.log('API呼び出し開始...');
            const response = await fetch(`/api/search/facilities?${params.toString()}`);
            
            if (!response.ok) {
              throw new Error(`API エラー: ${response.status}`);
            }

            const data: SearchResponse = await response.json();
            
            console.log(`✅ 取得完了: ${data.facilities?.length || 0} 件`);

            if (data.facilities && data.facilities.length > 0) {
              setFacilities(data.facilities);
              setPagination(data.pagination);
            } else {
              console.log('❌ ブックマークした事業所が見つかりません');
              setFacilities([]);
              setPagination(null);
              setError('ブックマークした事業所が見つかりませんでした。削除された可能性があります。');
            }
            
            setLoading(false);
            
          } catch (err) {
            console.error('❌ 事業所取得エラー:', err);
            setError(err instanceof Error ? err.message : 'ブックマークした事業所の取得に失敗しました');
            setFacilities([]);
            setPagination(null);
            setLoading(false);
          }
        }, 100);
        
      } catch (err) {
        console.error('❌ ブックマーク表示エラー:', err);
        setError(err instanceof Error ? err.message : 'ブックマークの取得中にエラーが発生しました');
        setFacilities([]);
        setPagination(null);
        setLoading(false);
      }
    }
  };

  // 通常検索処理
  const executeSearch = async (filters: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);
    setIsBookmarkMode(false);

    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.district) params.append('district', filters.district);
      if (filters.serviceIds?.length > 0) {
        params.append('service_ids', JSON.stringify(filters.serviceIds));
      }
      if (filters.availabilityOnly) params.append('availability_only', 'true');
      
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/search/facilities?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      setFacilities(data.facilities || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました');
      setFacilities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    setHasSearched(true);
    setLastSearchFilters(filters);
    await executeSearch(filters, 1);
  };

  const handlePageChange = async (page: number) => {
    if (!lastSearchFilters) return;
    await executeSearch(lastSearchFilters, page);
    // ページ変更時に上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewModeChange = (mode: 'list' | 'map') => {
    if (isBookmarkMode && mode === 'map') {
      alert('ブックマーク表示では地図モードは利用できません。');
      return;
    }
    setViewMode(mode);
  };

  return (
    <div>
      <Head>
        <title>ケアコネクト - 東京都障害福祉サービス事業所検索</title>
        <meta 
          name="description" 
          content="東京都の障害福祉サービス事業所を検索して、適切なケアサービスを見つけましょう。" 
        />
      </Head>

      {/* ヘッダー */}
      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" passHref legacyBehavior>
              <a className="logo-container" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <div className="logo">C</div>
                <div>
                  <h1 className="main-title">ケアコネクト</h1>
                </div>
              </a>
            </Link>
            <h2 style={{ fontSize: '16px', margin: 0 }}>東京都の障害福祉サービス事業所検索システム</h2>
            
            {/* ヘッダー右側のコンテンツ */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!isLoggedIn ? (
                <>
                  <Link href="/auth/login">
                    <button className="cta-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                      利用者ログイン
                    </button>
                  </Link>
                  <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>
                  <Link href="/provider/login">
                    <button className="cta-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                      事業者ログイン
                    </button>
                  </Link>
                  <span style={{ color: '#d1d5db', fontSize: '1rem' }}>|</span>
                </>
              ) : (
                <>
                  <Link href="/mypage" passHref legacyBehavior>
                    <a className="cta-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                      マイページ
                    </a>
                  </Link>
                  <button
                    className="cta-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    onClick={async () => {
                      const { error } = await signOut();
                      if (error) {
                        console.error("ログアウトエラー:", error.message);
                        alert("ログアウトに失敗しました");
                      } else {
                        alert("ログアウトしました");
                      }
                    }}
                  >
                    ログアウト
                  </button>
                </>
              )}
              <button className="cta-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                お問い合わせ
              </button>
            </div>
          </div>
        </div>        
      </header>

      {/* メインコンテンツ */}
      <main className="container">
        {/* ログインユーザーへの挨拶（ヒーローセクション削除） */}
        {isLoggedIn && (
          <section style={{ marginTop: '2rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '2rem' }}>
              <p style={{ 
                margin: 0, 
                fontSize: '1.125rem', 
                fontWeight: '500',
                color: '#374151' 
              }}>
                ようこそ、{user?.user_metadata?.full_name || user?.email}さん
              </p>
            </div>
          </section>
        )}
        
        {/* 検索セクション */}
        <div className="search-section">
          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="services-title" style={{ margin: 0 }}>
              {isBookmarkMode ? 'ブックマークした事業所' : '事業所を検索'}
            </h2>
            
            {/* ブックマークボタン */}
            {isLoggedIn && (
              <button
                onClick={handleShowBookmarks}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: isBookmarkMode ?'#22c55e':'#eab308',
                  color: isBookmarkMode ? 'white' : '#374151'
                }}
              >
                {isBookmarkMode ? '★' : '☆'} {isBookmarkMode ? '全体検索に戻る' : 'ブックマークを表示する'}
              </button>
            )}
          </div>

          {/* ブックマークモード時の説明 */}
          {isBookmarkMode && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              background: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '0.5rem' 
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                📌 ブックマークした事業所を表示しています
              </p>
            </div>
          )}

          {!isBookmarkMode ? (
            <SearchFilterComponent onSearch={handleSearch} loading={loading} />
          ) : (
            <div style={{ textAlign: 'center' }}>

            </div>
          )}
        </div>

        {/* 検索結果 */}
        {hasSearched && (
          <SearchResults 
            facilities={facilities} 
            pagination={pagination}
            loading={loading} 
            error={error}
            onPageChange={handlePageChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isBookmarkMode={isBookmarkMode}
            isLoggedIn={isLoggedIn}
            onBookmarkToggle={handleBookmarkToggle}
            isBookmarked={(facilityId: number) => isBookmarked(facilityId.toString())}
          />
        )}
      </main>

      {/* フッター */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <Link href="/" passHref legacyBehavior>
              <a className="footer-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="footer-logo-icon">C</div>
                <span className="footer-name">ケアコネクト</span>
              </a>
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

export default HomePage;