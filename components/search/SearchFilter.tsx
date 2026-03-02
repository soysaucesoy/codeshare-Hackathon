// components/search/SearchFilter.tsx - 共有検索フィルターコンポーネント（アコーディオン方式）
import React, { useState, useEffect } from 'react';
import { useDevice } from '@/hooks/useDevice';
import { T_DISTRICTS, SERVICE_CATEGORIES as _SERVICE_CATEGORIES } from '@/types/database';

// ===== 型定義 =====
export interface SearchFilters {
  query: string;
  district: string;
  serviceIds: number[];
  availabilityOnly: boolean;
}

// ===== マスタデータ（@/types/database からの再エクスポート）=====
/** 東京都の全市区町村リスト（types/database.ts の T_DISTRICTS と同一）*/
export const TOKYO_DISTRICTS = T_DISTRICTS;
/** サービスカテゴリ別マスタデータ（types/database.ts の SERVICE_CATEGORIES と同一）*/
export const SERVICE_CATEGORIES = _SERVICE_CATEGORIES;

// ===== SearchFilterComponent =====
// 検索フォーム（アコーディオン方式・URL状態復元対応・モバイル対応）
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { isMobile } = useDevice();

  // initialFilters が変更されたら状態を同期
  useEffect(() => {
    if (initialFilters) {
      setQuery(initialFilters.query);
      setDistrict(initialFilters.district);
      setSelectedServices(initialFilters.serviceIds);
      setAvailabilityOnly(initialFilters.availabilityOnly);
      if (initialFilters.serviceIds.length > 0) {
        setShowServiceFilter(true);
      }
    }
  }, [initialFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, district, serviceIds: selectedServices, availabilityOnly });
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const clearServices = () => setSelectedServices([]);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

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
          {/* 地区選択 */}
          <div className="filter-group">
            <label className="filter-label">地区</label>
            <select
              className="filter-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">すべての地区</option>
              <optgroup label="特別区">
                {TOKYO_DISTRICTS.slice(0, 23).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="多摩地域市部">
                {TOKYO_DISTRICTS.slice(23, 49).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="西多摩郡">
                {TOKYO_DISTRICTS.slice(49, 53).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
              <optgroup label="島嶼部">
                {TOKYO_DISTRICTS.slice(53).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* サービス選択 */}
          <div className="filter-group">
            <label className="filter-label">
              提供サービス
              {selectedServices.length > 0 && (
                <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>
                  {' '}({selectedServices.length}件選択中)
                </span>
              )}
            </label>
            <button
              type="button"
              className="filter-select"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                background: showServiceFilter ? '#f0fdf4' : 'white',
              }}
              onClick={() => setShowServiceFilter(!showServiceFilter)}
            >
              {selectedServices.length === 0
                ? 'サービスを選択...'
                : `${selectedServices.length}件のサービスを選択中`}
              <span style={{ float: 'right' }}>{showServiceFilter ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        {/* サービス選択パネル（アコーディオン方式） */}
        {showServiceFilter && (
          <div style={{
            marginTop: '1rem',
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
          }}>
            {/* ヘッダー */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <span className="filter-label">サービスを選択してください</span>
              <button
                type="button"
                onClick={clearServices}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                すべてクリア
              </button>
            </div>

            {/* 選択済みサービスを上部に表示 */}
            {selectedServices.length > 0 && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  選択中のサービス ({selectedServices.length}件):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}
                      >
                        {service.name}
                        <button
                          type="button"
                          onClick={() => handleServiceToggle(serviceId)}
                          style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          ✕
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* カテゴリ別アコーディオン */}
            {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: expandedCategory === category ? '#f3f4f6' : 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = expandedCategory === category ? '#f3f4f6' : 'white'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{category}</span>
                    {(() => {
                      const count = services.filter(s => selectedServices.includes(s.id)).length;
                      return count > 0 ? (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          background: '#22c55e',
                          color: 'white',
                          borderRadius: '0.75rem',
                          fontWeight: '500',
                        }}>
                          {count}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <span style={{
                    transform: expandedCategory === category ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>
                    ▼
                  </span>
                </button>

                {expandedCategory === category && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '0.75rem',
                    }}>
                      {services.map((service) => (
                        <label
                          key={service.id}
                          className="filter-checkbox-container"
                          style={{
                            padding: '0.75rem',
                            background: selectedServices.includes(service.id) ? '#dcfce7' : '#f9fafb',
                            borderRadius: '0.375rem',
                            border: selectedServices.includes(service.id) ? '2px solid #22c55e' : '1px solid #e5e7eb',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827', marginBottom: '0.25rem' }}>
                              {service.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.3 }}>
                              {service.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 空きありフィルター + 検索ボタン */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3rem',
          marginTop: '1.5rem',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <label className="filter-checkbox-container">
            <input
              type="checkbox"
              className="filter-checkbox"
              style={{ width: '16px', height: '16px', transform: 'scale(1.2)' }}
              checked={availabilityOnly}
              onChange={(e) => setAvailabilityOnly(e.target.checked)}
            />
            <span className="filter-checkbox-label" style={{ fontSize: '1.25rem', fontWeight: '500' }}>
              空きのある事業所のみ
            </span>
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

export default SearchFilterComponent;
