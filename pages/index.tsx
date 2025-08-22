// 提供されたindex.tsxを globals.css スタイルに合わせて調整
// pages/index.tsx
import React, { useState, useEffect, MouseEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';

// 型定義（同じ）
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

// ToggleSwitchコンポーネント（globals.cssに合わせて調整）
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
    <div className="toggle-switch-wrapper">
      <div 
        className={`toggle-switch-label ${!checked ? 'active' : ''}`}
        onClick={() => !disabled && onChange(false)}
      >
        <span className="toggle-icon">{leftIcon}</span>
        {leftLabel}
      </div>
      
      <div
        className={`toggle-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div className="toggle-switch-slider">
          <div className="toggle-switch-thumb" />
        </div>
      </div>

      <div 
        className={`toggle-switch-label ${checked ? 'active' : ''}`}
        onClick={() => !disabled && onChange(true)}
      >
        <span className="toggle-icon">{rightIcon}</span>
        {rightLabel}
      </div>
    </div>
  );
};

// MapViewコンポーネント（globals.cssに合わせて調整）
const MapView: React.FC<{ facilities: Facility[]; loading?: boolean }> = ({ facilities, loading = false }) => {
  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner">⏳</div>
        <p>地図を読み込み中...</p>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="map-no-results">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
        <h3>表示する事業所がありません</h3>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          検索条件を変更してお試しください
        </p>
      </div>
    );
  }

  return (
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
  );
};

// サービスカテゴリ（同じ）
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

// SearchFilterコンポーネント（globals.cssに合わせて調整）
const SearchFilter: React.FC<{
  onSearch: (filters: { 
    query: string; 
    district: string; 
    serviceIds: number[];
    availabilityOnly: boolean 
  }) => void;
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

  // 東京都の市区町村リスト（同じ）
  const districts = [
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区',
    '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市',
    '調布市', '町田市', '小金井市', '小平市', '日野市', '東村山市', '国分寺市',
    '国立市', '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市',
    '武蔵村山市', '多摩市', '稲城市', '羽村市', 'あきる野市', '西東京市',
    '瑞穂町', '日の出町', '檜原村', '奥多摩町',
    '大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村',
    '八丈町', '青ヶ島村', '小笠原村'
  ];

  const allServices = Object.values(SERVICE_CATEGORIES).flat();

  return (
    <div className="search-section">
      <div className="main-search">
        <h2 className="services-title">事業所を検索</h2>
      </div>
      
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

            <div className="filter-group">
              <label className="filter-checkbox-container">
                <input
                  type="checkbox"
                  className="filter-checkbox"
                  checked={availabilityOnly}
                  onChange={(e) => setAvailabilityOnly(e.target.checked)}
                />
                <span className="filter-checkbox-label">空きのある事業所のみ</span>
              </label>
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
                    fontWeight: 600,
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

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
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
    </div>
  );
};

// FacilityCardコンポーネント（globals.cssに合わせて調整）
const FacilityCard: React.FC<{ facility: Facility }> = ({ facility }) => {
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
        <h3 className="facility-name">{facility.name}</h3>
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
                ○ {service.service?.name || 'サービス'}
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

// Paginationコンポーネント（globals.cssに合わせて調整）
const Pagination: React.FC<{
  pagination: SearchResponse['pagination'];
  onPageChange: (page: number) => void;
  loading?: boolean;
}> = ({ pagination, onPageChange, loading = false }) => {
  const { page, pages, hasNext, hasPrev, total, limit } = pagination;
  
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  if (pages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className={`pagination-container ${loading ? 'loading' : ''}`}>
      <div className="pagination-info">
        <span>
          {startItem}-{endItem}件 / 全{total}件
        </span>
      </div>
      
      <div className="pagination-controls">
        <button
          className="pagination-button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || loading}
        >
          ← 前へ
        </button>

        <div className="pagination-numbers">
          {getPageNumbers().map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="pagination-dots">...</span>
              ) : (
                <button
                  className={`pagination-number ${pageNum === page ? 'active' : ''}`}
                  onClick={() => onPageChange(pageNum as number)}
                  disabled={loading || pageNum === page}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          className="pagination-button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || loading}
        >
          次へ →
        </button>
      </div>
    </div>
  );
};

// SearchResultsコンポーネント（globals.cssに合わせて調整）
const SearchResults: React.FC<{
  facilities: Facility[];
  pagination: SearchResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
}> = ({ facilities, pagination, loading, error, onPageChange, viewMode, onViewModeChange }) => {
  if (loading && viewMode === 'list') {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>検索中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p className="error-message">{error}</p>
        <button 
          className="cta-secondary" 
          onClick={() => window.location.reload()}
          style={{ marginTop: '1rem' }}
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (facilities.length === 0 && !loading && viewMode === 'list') {
    return (
      <div className="no-results">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3>検索結果がありません</h3>
        <p className="no-results-sub">検索条件を変更して再度お試しください。</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="view-toggle-container">
        <div className="results-header-with-toggle">
          <div className="results-title-container">
            <h2 className="results-title">
              検索結果 ({pagination?.total || facilities.length}件)
            </h2>
          </div>
          <div className="toggle-container">
            <ToggleSwitch
              checked={viewMode === 'map'}
              onChange={(checked: boolean) => onViewModeChange(checked ? 'map' : 'list')}
              leftLabel="リスト表示"
              rightLabel="地図表示"
              leftIcon="📋"
              rightIcon="🗺️"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <MapView facilities={facilities} loading={loading} />
      ) : (
        <>
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner">⏳</div>
              <p>検索中...</p>
            </div>
          )}
          
          {!loading && facilities.length === 0 && (
            <div className="no-results">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3>検索結果がありません</h3>
              <p className="no-results-sub">検索条件を変更して再度お試しください。</p>
            </div>
          )}

          {!loading && facilities.length > 0 && (
            <div className="facilities-grid">
              {facilities.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>
          )}

          {pagination && !loading && (
            <Pagination 
              pagination={pagination} 
              onPageChange={onPageChange} 
              loading={loading}
            />
          )}
        </>
      )}
    </div>
  );
};

// メインページ（globals.cssに合わせて調整）
const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [lastSearchFilters, setLastSearchFilters] = useState<{
    query: string; 
    district: string; 
    serviceIds: number[];
    availabilityOnly: boolean 
  } | null>(null);

  const executeSearch = async (
    filters: { 
      query: string; 
      district: string; 
      serviceIds: number[];
      availabilityOnly: boolean 
    }, 
    page: number = 1,
    forceViewMode?: 'list' | 'map'
  ) => {
    try {
      setLoading(true);
      setError(null);

      const currentViewMode = forceViewMode || viewMode;
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.district) params.append('district', filters.district);
      if (filters.serviceIds.length > 0) {
        params.append('service_ids', JSON.stringify(filters.serviceIds));
      }
      if (filters.availabilityOnly) params.append('availability_only', 'true');
      
      if (currentViewMode === 'map') {
        params.append('page', '1');
        params.append('limit', '1000');
      } else {
        params.append('page', page.toString());
        params.append('limit', '12');
      }

      console.log('検索実行:', { ...filters, page, viewMode: currentViewMode });

      const response = await fetch(`/api/search/facilities?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || '検索に失敗しました');
      }

      setFacilities(data.facilities || []);
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

  const handleSearch = async (filters: { 
    query: string; 
    district: string; 
    serviceIds: number[];
    availabilityOnly: boolean 
  }) => {
    setHasSearched(true);
    setLastSearchFilters(filters);
    await executeSearch(filters, 1);
  };

  const handlePageChange = async (page: number) => {
    if (!lastSearchFilters) return;
    
    await executeSearch(lastSearchFilters, page);
    
    const searchResultsElement = document.querySelector('.search-results');
    if (searchResultsElement) {
      searchResultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewModeChange = async (mode: 'list' | 'map') => {
    setViewMode(mode);
    
    if (lastSearchFilters && hasSearched) {
      await executeSearch(lastSearchFilters, 1, mode);
    }
  };

  // 認証状態に応じたボタンの表示
  const renderAuthButtons = () => {
    if (authLoading) {
      return <div className="animate-pulse w-20 h-8 bg-gray-300 rounded"></div>;
    }

    if (user) {
      return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#374151', fontSize: '0.875rem' }}>
            {user.user_metadata?.full_name || user.email}さん
          </span>
          <Link href="/dashboard" className="cta-primary">
            ダッシュボード
          </Link>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link href="/auth/login" className="cta-secondary">
          ログイン
        </Link>
        <Link href="/auth/register" className="cta-primary">
          新規登録
        </Link>
      </div>
    );
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div className="logo-container">
              <div className="logo">C</div>
              <span className="main-title">ケアコネクト</span>
            </div>
            
            {renderAuthButtons()}
          </div>
        </div>
      </header>

      {/* ヒーロー部分 */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            東京都の障害福祉サービス<br />
            <span className="hero-accent">事業所検索</span>
          </h1>
          <p className="hero-description">
            あなたにぴったりのケアサービスを見つけて、より良い生活をサポートします
          </p>
        </div>
      </section>

      {/* メインコンテンツ */}
      <main className="container">
        {/* 統計情報 */}
        {!hasSearched && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-number">1,200+</div>
              <div className="stat-label">登録事業所</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-number">5,000+</div>
              <div className="stat-label">利用者登録</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-number">98%</div>
              <div className="stat-label">マッチング成功率</div>
            </div>
          </div>
        )}

        {/* 検索セクション */}
        <SearchFilter onSearch={handleSearch} loading={loading} />

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
          />
        )}

        {/* サービス案内（初回表示時のみ） */}
        {!hasSearched && (
          <section className="services-section">
            <h2 className="services-title">提供中のサービス</h2>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-name">居宅介護</div>
              </div>
              <div className="service-card">
                <div className="service-name">生活介護</div>
              </div>
              <div className="service-card">
                <div className="service-name">就労移行支援</div>
              </div>
              <div className="service-card">
                <div className="service-name">就労継続支援A型</div>
              </div>
              <div className="service-card">
                <div className="service-name">就労継続支援B型</div>
              </div>
              <div className="service-card">
                <div className="service-name">放課後等デイサービス</div>
              </div>
              <div className="service-card">
                <div className="service-name">児童発達支援</div>
              </div>
              <div className="service-card">
                <div className="service-name">共同生活援助</div>
              </div>
            </div>
          </section>
        )}

        {/* CTA セクション（初回表示時のみ） */}
        {!hasSearched && (
          <section className="cta-section">
            <h2 className="cta-title">アカウントを作成しませんか？</h2>
            <p className="cta-description">
              登録すると、ブックマーク機能やメッセージ機能をご利用いただけます。
            </p>
            <div className="cta-buttons">
              <Link href="/auth/register?type=user" className="cta-primary">
                利用者として登録
              </Link>
              <Link href="/auth/register?type=facility" className="cta-secondary">
                事業所として登録
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* フッター */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="footer-logo-icon">🌟</div>
              <span className="footer-name">ケアコネクト</span>
            </div>
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