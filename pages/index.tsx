// pages/index.tsx - 検索状態復元機能付きサービス検索
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useBookmarks } from '@/lib/hooks/useBookmarks';

// 地図コンポーネントを動的インポート（SSR対応）
const MapView = dynamic(() => import('../components/search/MapView'), {
  ssr: false,
  loading: () => (
    <div className="map-loading" style={{
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      color: '#6b7280'
    }}>
      <div className="loading-spinner" style={{
        fontSize: '2rem',
        marginBottom: '1rem',
        animation: 'spin 2s linear infinite'
      }}>
        🗺️
      </div>
      <p style={{ fontSize: '0.875rem' }}>地図を読み込み中...</p>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}) as React.ComponentType<{
  facilities: Facility[];
  loading?: boolean;
  onFacilitySelect?: (facility: Facility) => void;
}>;

// ToggleSwitchコンポーネント
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  leftIcon?: string;
  rightIcon?: string;
  disabled?: boolean;
}> = ({ checked, onChange, leftLabel, rightLabel, leftIcon, rightIcon, disabled = false }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <span style={{ 
        fontSize: '0.875rem', 
        fontWeight: !checked ? '600' : '400',
        color: !checked ? '#22c55e' : '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {leftIcon && <span>{leftIcon}</span>}
        {leftLabel}
      </span>
      
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '52px',
          height: '28px',
          backgroundColor: checked ? '#22c55e' : '#d1d5db',
          borderRadius: '14px',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          border: '1px solid ' + (checked ? '#16a34a' : '#9ca3af')
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            position: 'absolute',
            top: '1px',
            left: checked ? '26px' : '1px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
      
      <span style={{ 
        fontSize: '0.875rem', 
        fontWeight: checked ? '600' : '400',
        color: checked ? '#22c55e' : '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {rightIcon && <span>{rightIcon}</span>}
        {rightLabel}
      </span>
    </div>
  );
};

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

// URLパラメータエンコード/デコード関数
const encodeSearchFilters = (filters: SearchFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (filters.query) params.q = filters.query;
  if (filters.district) params.district = filters.district;
  if (filters.serviceIds.length > 0) params.services = filters.serviceIds.join(',');
  if (filters.availabilityOnly) params.available = '1';
  
  return params;
};

const decodeSearchFilters = (query: Record<string, string | string[] | undefined>): SearchFilters => {
  const getString = (value: string | string[] | undefined): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0] || '';
    return '';
  };

  return {
    query: getString(query.q),
    district: getString(query.district),
    serviceIds: query.services 
      ? getString(query.services).split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      : [],
    availabilityOnly: getString(query.available) === '1'
  };
};

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

// SearchFilterコンポーネント（検索状態復元対応）
const SearchFilterComponent: React.FC<{
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  initialFilters?: SearchFilters;
}> = ({ onSearch, loading = false, initialFilters }) => {
  const [query, setQuery] = useState(initialFilters?.query || '');
  const [district, setDistrict] = useState(initialFilters?.district || '');
  const [selectedServices, setSelectedServices] = useState<number[]>(initialFilters?.serviceIds || []);
  const [availabilityOnly, setAvailabilityOnly] = useState(initialFilters?.availabilityOnly || false);
  const [showServiceFilter, setShowServiceFilter] = useState(false);

  // 初期値が設定された場合の処理
  useEffect(() => {
    if (initialFilters) {
      setQuery(initialFilters.query);
      setDistrict(initialFilters.district);
      setSelectedServices(initialFilters.serviceIds);
      setAvailabilityOnly(initialFilters.availabilityOnly);
      // サービス選択がある場合は展開表示
      if (initialFilters.serviceIds.length > 0) {
        setShowServiceFilter(true);
      }
    }
  }, [initialFilters]);

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

  // 東京都の全市区町村リスト
  const districts = [
    // 特別区（23区）
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区',
    // 多摩地域の市
    '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市',
    '調布市', '町田市', '小金井市', '小平市', '日野市', '東村山市', '国分寺市',
    '国立市', '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市', '武蔵村山市',
    '多摩市', '稲城市', 'あきる野市', '西東京市',
    // 西多摩郡
    '瑞穂町', '日の出町', '檜原村', '奥多摩町',
    // 島嶼部
    '大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村',
    '八丈町', '青ヶ島村', '小笠原村'
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
              <optgroup label="特別区">
                {districts.slice(0, 23).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="多摩地域市部">
                {districts.slice(23, 49).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="西多摩郡">
                {districts.slice(49, 53).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="島嶼部">
                {districts.slice(53).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
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
                width: '20px',      
                height: '20px',     
                transform: 'scale(1.2)' 
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
  
  const getPageNumbers = () => {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, page - half);
    let end = Math.min(pages, start + maxVisible - 1);
    
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
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev || loading}
        style={buttonStyle(false, !hasPrev || loading)}
      >
        ← 前へ
      </button>

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

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext || loading}
        style={buttonStyle(false, !hasNext || loading)}
      >
        次へ →
      </button>

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

// ブックマーク機能付きFacilityCardコンポーネント（検索状態保持対応）
const FacilityCard: React.FC<{ 
  facility: Facility;
  isLoggedIn: boolean;
  isBookmarked: boolean;
  onBookmarkToggle: (facilityId: number) => void;
  searchParams?: string;
}> = ({ facility, isLoggedIn, isBookmarked, onBookmarkToggle, searchParams = '' }) => {
  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];
  
  // 詳細ページのURLに検索パラメータを付加
  const detailUrl = `/facilities/${facility.id}${searchParams ? `?${searchParams}` : ''}`;
  
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
          <Link href={detailUrl} passHref legacyBehavior>
            <a className="details-button" style={{ textDecoration: 'none' }}>
              詳細を見る
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

// SearchResultsコンポーネント（検索状態保持対応）
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
  searchParams?: string;
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
  isBookmarked,
  searchParams = ''
}) => {
  const router = useRouter();
  
  // 現在のURLから直接検索パラメータを取得
  const getCurrentSearchParams = (): string => {
    if (isBookmarkMode) return '';
    
    // router.queryから直接パラメータを構築
    const params = new URLSearchParams();
    
    const addParam = (key: string, queryKey: keyof typeof router.query) => {
      const value = router.query[queryKey];
      if (typeof value === 'string' && value) {
        params.append(key, value);
      } else if (Array.isArray(value) && value.length > 0 && value[0]) {
        params.append(key, value[0]);
      }
    };
    
    addParam('q', 'q');
    addParam('district', 'district'); 
    addParam('services', 'services');
    addParam('available', 'available');
    if (router.query.page && router.query.page !== '1') {
      addParam('page', 'page');
    }
    addParam('view', 'view');
    
    return params.toString();
  };

  const currentSearchParams = getCurrentSearchParams();

  // リストビューの場合のみloading判定を適用
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

  // 検索完了後に結果が0件の場合の表示（リストビューのみ）
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
      {/* 検索結果ヘッダーとビュー切替 */}
      <div className="view-toggle-container" style={{ marginBottom: '1.5rem' }}>
        <div className="results-header-with-toggle" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}>
          <div className="results-title-container">
            <h2 className="results-title" style={{ margin: 0 }}>
              {isBookmarkMode ? 'ブックマーク' : '検索結果'} ({pagination?.total || facilities.length}件)
            </h2>
          </div>
          <div className="toggle-container">
            <ToggleSwitch
              checked={viewMode === 'map'}
              onChange={(checked) => onViewModeChange(checked ? 'map' : 'list')}
              leftLabel="リスト表示"
              rightLabel="地図表示"
              leftIcon="📋"
              rightIcon="🗺️"
              disabled={loading || isBookmarkMode}
            />
          </div>
        </div>
      </div>

      {/* 表示内容 */}
      {viewMode === 'map' ? (
        <MapView 
          facilities={facilities}
          loading={loading}
          onFacilitySelect={(facility) => {
            console.log('選択された事業所:', facility.name);
          }}
        />
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
                    searchParams={currentSearchParams}
                  />
                ))}
              </div>

              {/* ページネーション（リスト表示時のみ） */}
              {!isBookmarkMode && pagination && !loading && (
                <Pagination
                  pagination={pagination}
                  onPageChange={onPageChange}
                  loading={loading}
                />
              )}
            </>
          )}

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

// メインページ（検索状態復元機能付き）
const HomePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuthContext();
  const { bookmarks, refreshBookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false); // 初期状態はfalse
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null);
  const [initialFilters, setInitialFilters] = useState<SearchFilters | undefined>(undefined);
  const [searchParamsString, setSearchParamsString] = useState('');
  const [preservedSearchParams, setPreservedSearchParams] = useState(''); // 検索状態を保持

  const isLoggedIn = !!user;

  // URLパラメータから検索条件を復元
  useEffect(() => {
    if (router.isReady) {
      // URLに検索パラメータがある場合のみ復元処理を実行
      const hasSearchParams = Object.keys(router.query).some(key => 
        ['q', 'district', 'services', 'available', 'page'].includes(key)
      );
      
      if (hasSearchParams) {
        const filters = decodeSearchFilters(router.query);
        console.log('🔄 URLから検索条件を復元:', filters);
        
        setInitialFilters(filters);
        setLastSearchFilters(filters);
        setHasSearched(true);
        
        // 自動検索実行（URL更新なし）
        executeSearchWithoutUrlUpdate(filters, 1);
      } else if (!hasSearched && !isBookmarkMode) {
        // URLにパラメータがなく、まだ検索していない場合は初期状態を設定
        console.log('📋 初期画面を表示');
        setInitialFilters(undefined);
        setLastSearchFilters(null);
        setHasSearched(false);
        setLoading(false);
        setFacilities([]);
        setPagination(null);
        setError(null);
        setSearchParamsString('');
      }
    }
  }, [router.isReady]);

  const handleBookmarkToggle = async (facilityId: number) => {
    if (!isLoggedIn) {
      alert('ブックマーク機能を使用するにはログインが必要です。');
      return;
    }

    try {
      const facilityIdStr = facilityId.toString();
      const isCurrentlyBookmarked = isBookmarked(facilityIdStr);
      
      await toggleBookmark(facilityIdStr);
      
      console.log(`${isCurrentlyBookmarked ? '削除' : '追加'}しました: ${facilityId}`);
      
      if (isBookmarkMode) {
        setTimeout(async () => {
          await handleShowBookmarks();
        }, 200);
      }
      
    } catch (error) {
      console.error('❌ ブックマーク操作エラー:', error);
      alert('ブックマーク操作中にエラーが発生しました。');
    }
  };

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
      
      // URLからクエリパラメータを削除（但しsearchParamsStringは保持）
      router.replace('/', undefined, { shallow: true });
      
      try {
        await refreshBookmarks();
        
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
            
            const bookmarkedFacilityIds = bookmarks.map(bookmark => parseInt(bookmark.facility));
            console.log('ブックマーク事業所ID:', bookmarkedFacilityIds);

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
    } else {
      // ブックマークモードを終了する場合、最後の検索条件があれば復元
      console.log('🔄 ブックマークモード終了、検索状態を復元:', { lastSearchFilters, searchParamsString });
      if (lastSearchFilters) {
        await executeSearch(lastSearchFilters, 1);
      }
    }
  };

  // 通常検索処理（URL更新対応）
  const executeSearch = async (
    filters: SearchFilters, 
    page: number = 1,
    forceViewMode?: 'list' | 'map'
  ) => {
    await executeSearchWithoutUrlUpdate(filters, page, forceViewMode);
    
    // URLパラメータを更新（検索条件を保持）
    const urlParams = encodeSearchFilters(filters);
    if (page > 1) {
      urlParams.page = page.toString();
    }
    
    const queryString = new URLSearchParams(urlParams).toString();
    console.log('🔗 URL更新:', queryString);
    setSearchParamsString(queryString);
    setPreservedSearchParams(queryString); // 検索パラメータを保持
    
    // URLを更新（ブラウザ履歴に追加せずに）
    const newUrl = queryString ? `/?${queryString}` : '/';
    router.replace(newUrl, undefined, { shallow: true });
  };

  // URL更新なしの検索処理
  const executeSearchWithoutUrlUpdate = async (
    filters: SearchFilters, 
    page: number = 1,
    forceViewMode?: 'list' | 'map'
  ) => {
    console.log('🔍 executeSearchWithoutUrlUpdate 開始:', { filters, page, forceViewMode });
    setLoading(true);
    setError(null);
    setIsBookmarkMode(false);

    try {
      const currentViewMode = forceViewMode || viewMode;
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.district) params.append('district', filters.district);
      if (filters.serviceIds?.length > 0) {
        params.append('service_ids', JSON.stringify(filters.serviceIds));
      }
      if (filters.availabilityOnly) params.append('availability_only', 'true');
      
      // 地図表示の場合は全件取得、リスト表示の場合はページング
      if (currentViewMode === 'map') {
        params.append('page', '1');
        params.append('limit', '1000'); // 大きな値で全件取得
      } else {
        params.append('page', page.toString());
        params.append('limit', '12');
      }

      console.log('📡 API呼び出し:', params.toString());

      const response = await fetch(`/api/search/facilities?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      console.log('✅ API応答:', { facilitiesCount: data.facilities?.length, pagination: data.pagination });

      setFacilities(data.facilities || []);
      // 地図表示の場合はページネーション情報をクリア
      setPagination(currentViewMode === 'map' ? null : data.pagination);
      
    } catch (err) {
      console.error('検索エラー:', err);
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました');
      setFacilities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    console.log('🔍 新しい検索を実行:', filters);
    setHasSearched(true);
    setLastSearchFilters(filters);
    await executeSearch(filters, 1);
  };

  const handlePageChange = async (page: number) => {
    if (!lastSearchFilters) return;
    console.log('📄 ページ変更:', page, 'filters:', lastSearchFilters);
    await executeSearch(lastSearchFilters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ビューモード変更時
  const handleViewModeChange = async (mode: 'list' | 'map') => {
    if (isBookmarkMode && mode === 'map') {
      alert('ブックマーク表示では地図モードは利用できません。');
      return;
    }
    
    setViewMode(mode);

    // 既に検索結果がある場合は、新しいビューモードで再検索
    if (lastSearchFilters && hasSearched) {
      await executeSearch(lastSearchFilters, 1, mode);
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="services-title" style={{ margin: 0 }}>
              {isBookmarkMode ? 'ブックマークした事業所' : '事業所を検索'}
            </h2>
            
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

          {!isBookmarkMode && (
            <SearchFilterComponent 
              onSearch={handleSearch} 
              loading={loading}
              initialFilters={initialFilters}
            />
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

        {/* 初期画面のウェルカムメッセージ */}
        {!hasSearched && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏥</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#374151' }}>
              東京都の障害福祉サービス事業所を検索
            </h3>
            <p style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              上記の検索条件を設定して「検索」ボタンをクリックしてください。<br />
              お住まいの地域や必要なサービスから、最適な事業所を見つけることができます。
            </p>
            {isLoggedIn && (
              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '0.5rem',
                display: 'inline-block'
              }}>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.875rem' }}>
                  💡 気になる事業所をブックマークして、後で確認することができます
                </p>
              </div>
            )}
          </div>
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