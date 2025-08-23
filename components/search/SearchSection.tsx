// components/search/SearchSection.tsx - globals.css互換版
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

interface SearchFilters {
  query: string;
  district: string;
  serviceIds: number[];
  availabilityOnly: boolean;
}

interface Service {
  id: number;
  name: string;
  category: string;
}

interface SearchSectionProps {
  onSearchResults: (facilities: any[], loading: boolean, error: string | null, pagination?: any) => void;
  onShowBookmarks?: () => void;
  isLoggedIn?: boolean;
  isBookmarkMode?: boolean;
}

// フォールバックのサービスデータ
const FALLBACK_SERVICES = [
  { id: 1, name: '居宅介護', category: '訪問系サービス' },
  { id: 2, name: '重度訪問介護', category: '訪問系サービス' },
  { id: 3, name: '同行援護', category: '訪問系サービス' },
  { id: 4, name: '行動援護', category: '訪問系サービス' },
  { id: 6, name: '療養介護', category: '日中活動系サービス' },
  { id: 7, name: '生活介護', category: '日中活動系サービス' },
  { id: 8, name: '短期入所', category: '日中活動系サービス' },
  { id: 10, name: '共同生活援助', category: '居住系サービス' },
  { id: 11, name: '自立生活援助', category: '居住系サービス' },
  { id: 15, name: '就労移行支援', category: '訓練系・就労系サービス' },
  { id: 16, name: '就労継続支援A型', category: '訓練系・就労系サービス' },
  { id: 17, name: '就労継続支援B型', category: '訓練系・就労系サービス' },
  { id: 18, name: '就労定着支援', category: '訓練系・就労系サービス' },
  { id: 19, name: '児童発達支援', category: '障害児通所系サービス' },
  { id: 21, name: '放課後等デイサービス', category: '障害児通所系サービス' },
];

const SearchSection: React.FC<SearchSectionProps> = ({ 
  onSearchResults, 
  onShowBookmarks,
  isLoggedIn = false,
  isBookmarkMode = false,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    district: '',
    serviceIds: [],
    availabilityOnly: false,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServiceFilter, setShowServiceFilter] = useState(false);

  // サービス一覧を取得
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const servicesData = await response.json();
          setServices(servicesData);
        } else {
          setServices(FALLBACK_SERVICES);
        }
      } catch (err) {
        console.warn('サービス一覧の取得に失敗:', err);
        setServices(FALLBACK_SERVICES);
      }
    };

    fetchServices();
  }, []);

  // カテゴリ別にサービスをグループ化
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.query.trim()) {
        queryParams.set('query', filters.query.trim());
      }
      if (filters.district && filters.district !== 'すべての地区') {
        queryParams.set('district', filters.district);
      }
      if (filters.serviceIds.length > 0) {
        queryParams.set('service_ids', JSON.stringify(filters.serviceIds));
      }
      if (filters.availabilityOnly) {
        queryParams.set('availability_only', 'true');
      }
      
      queryParams.set('page', '1');
      queryParams.set('limit', '50');

      const apiUrl = `/api/search/facilities?${queryParams.toString()}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`検索に失敗しました (${response.status})`);
      }

      const data = await response.json();
      onSearchResults(data.facilities || [], false, null, data.pagination);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索中にエラーが発生しました';
      setError(errorMessage);
      onSearchResults([], false, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SearchFilters, value: string | boolean | number[]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    const newServiceIds = checked
      ? [...filters.serviceIds, serviceId]
      : filters.serviceIds.filter(id => id !== serviceId);
    
    setFilters(prev => ({ ...prev, serviceIds: newServiceIds }));
  };

  const handleShowBookmarks = () => {
    if (onShowBookmarks) {
      onShowBookmarks();
    }
  };

  const clearServices = () => {
    setFilters(prev => ({ ...prev, serviceIds: [] }));
  };

  const districts = [
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区'
  ];

  const allServices = Object.values(servicesByCategory).flat();

  return (
    <div className="search-section">
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="services-title" style={{ margin: 0 }}>
          {isBookmarkMode ? 'ブックマークした事業所' : '事業所を検索'}
        </h2>
        
        {/* ブックマークボタン（ログイン時のみ表示） */}
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
              transition: 'all 0.2s',
              background: isBookmarkMode ? '#eab308' : '#f3f4f6',
              color: isBookmarkMode ? 'white' : '#374151'
            }}
            onMouseOver={(e) => {
              if (!isBookmarkMode) {
                e.currentTarget.style.background = '#e5e7eb';
              } else {
                e.currentTarget.style.background = '#d97706';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = isBookmarkMode ? '#eab308' : '#f3f4f6';
            }}
          >
            <Bookmark size={18} fill={isBookmarkMode ? 'currentColor' : 'none'} />
            {isBookmarkMode ? 'ブックマーク表示中' : 'ブックマーク'}
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
            📌 ブックマークした事業所を表示しています。通常の検索に戻るには「検索」ボタンを押してください。
          </p>
        </div>
      )}

      {/* メイン検索（ブックマークモード時は非表示） */}
      {!isBookmarkMode && (
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="事業所名で検索..."
              value={filters.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filters-section">
            <h3 className="filters-title">検索条件</h3>
            
            <div className="filters-grid">
              {/* 地区選択 */}
              <div className="filter-group">
                <label className="filter-label">地区</label>
                <select
                  className="filter-select"
                  value={filters.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                >
                  <option value="">すべての地区</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* サービス選択 */}
              <div className="filter-group">
                <label className="filter-label">
                  提供サービス 
                  {filters.serviceIds.length > 0 && (
                    <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>
                      ({filters.serviceIds.length}件選択中)
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
                  {filters.serviceIds.length === 0 
                    ? 'サービスを選択...' 
                    : `${filters.serviceIds.length}件のサービスを選択中`
                  }
                  <span style={{ float: 'right' }}>
                    {showServiceFilter ? '▲' : '▼'}
                  </span>
                </button>
              </div>

              {/* 空きありフィルター */}
              <div className="filter-group">
                <label className="filter-checkbox-container">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={filters.availabilityOnly}
                    onChange={(e) => handleInputChange('availabilityOnly', e.target.checked)}
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

                {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
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
                      {categoryServices.map((service) => (
                        <label
                          key={service.id}
                          className="filter-checkbox-container"
                          style={{ 
                            padding: '0.5rem',
                            background: filters.serviceIds.includes(service.id) ? '#dcfce7' : 'white',
                            borderRadius: '0.375rem',
                            border: filters.serviceIds.includes(service.id) ? '1px solid #22c55e' : '1px solid #e5e7eb',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={filters.serviceIds.includes(service.id)}
                            onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              fontSize: '0.875rem',
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>
                              {service.name}
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
            {filters.serviceIds.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className="filter-label">選択中のサービス:</div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {filters.serviceIds.map(serviceId => {
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
                          fontWeight: '500'
                        }}
                      >
                        {service.name}
                        <button
                          type="button"
                          onClick={() => handleServiceToggle(serviceId, false)}
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

            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                color: '#dc2626',
                fontSize: '0.875rem'
              }}>
                ❌ {error}
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
      )}

      {/* ブックマークモード時の簡易操作 */}
      {isBookmarkMode && (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={handleSearch}
            className="filter-search-button"
          >
            通常検索に戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchSection;