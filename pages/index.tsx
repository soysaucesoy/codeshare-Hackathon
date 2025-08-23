// pages/index.tsx - サービス検索機能拡張版（地図機能追加・動的インポート対応）
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { supabase } from '@/lib/supabase/client';

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

  // 東京都の全市区町村リスト（拡張版）
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

// 地図コンポーネント（復活版・動的インポート対応）
const MapViewInner: React.FC<{
  facilities: Facility[];
  onFacilitySelect?: (facility: Facility) => void;
}> = ({ facilities, onFacilitySelect }) => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // 地図の初期化（実際の地図ライブラリを使用する場合）
    setMapError(null);
  }, [facilities]);

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    if (onFacilitySelect) {
      onFacilitySelect(facility);
    }
  };

  // 座標を持つ事業所のみをフィルタ
  const facilitiesWithLocation = facilities.filter(f => f.latitude && f.longitude);

  if (mapError) {
    return (
      <div style={{
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h3>地図の読み込みに失敗しました</h3>
        <p style={{ color: '#6b7280' }}>{mapError}</p>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ height: '600px', position: 'relative' }}>
      {/* 地図エリア */}
      <div style={{
        height: '100%',
        background: `linear-gradient(45deg, #e8f5e8 25%, transparent 25%), 
                     linear-gradient(-45deg, #e8f5e8 25%, transparent 25%), 
                     linear-gradient(45deg, transparent 75%, #e8f5e8 75%), 
                     linear-gradient(-45deg, transparent 75%, #e8f5e8 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        border: '2px solid #22c55e',
        borderRadius: '0.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 地図のヘッダー */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1rem',
          zIndex: 10,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem' }}>🗺️</div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>東京都地図</h3>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              📍 {facilitiesWithLocation.length}/{facilities.length} 件に位置情報あり
            </div>
          </div>
        </div>

        {/* 事業所マーカー（簡易表示） */}
        <div style={{ paddingTop: '4rem', height: '100%', position: 'relative' }}>
          {/* 東京都の区域表示 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '300px',
            background: '#dcfce7',
            borderRadius: '20% 80% 60% 40%',
            opacity: 0.3,
            zIndex: 1
          }} />

          {/* 簡易マーカー表示 */}
          {facilitiesWithLocation.slice(0, 20).map((facility, index) => {
            const offsetX = (index % 5) * 80 - 160;
            const offsetY = Math.floor(index / 5) * 60 - 120;
            
            return (
              <div
                key={facility.id}
                onClick={() => handleFacilityClick(facility)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(${offsetX}px, ${offsetY}px)`,
                  zIndex: selectedFacility?.id === facility.id ? 20 : 10,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  background: selectedFacility?.id === facility.id ? '#ef4444' : '#22c55e',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    transform: 'rotate(45deg)'
                  }}>
                    🏢
                  </div>
                </div>
                
                {/* マーカーラベル */}
                <div style={{
                  position: 'absolute',
                  top: '35px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {facility.name.length > 10 ? `${facility.name.slice(0, 10)}...` : facility.name}
                </div>
              </div>
            );
          })}

          {/* 範囲外の事業所数表示 */}
          {facilitiesWithLocation.length > 20 && (
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              background: 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              +{facilitiesWithLocation.length - 20}件の事業所
            </div>
          )}
        </div>
      </div>

      {/* 選択された事業所の詳細パネル */}
      {selectedFacility && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          width: '300px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 30
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: '600' }}>
              {selectedFacility.name}
            </h4>
            <button
              onClick={() => setSelectedFacility(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>
          
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
            📍 {selectedFacility.district}
          </p>
          
          {selectedFacility.description && (
            <p style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '0.75rem', 
              color: '#374151',
              lineHeight: 1.4
            }}>
              {selectedFacility.description.length > 80 
                ? `${selectedFacility.description.slice(0, 80)}...` 
                : selectedFacility.description}
            </p>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                console.log('詳細表示:', selectedFacility.id);
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              詳細を見る
            </button>
            <button
              onClick={() => {
                if (selectedFacility.phone_number) {
                  window.location.href = `tel:${selectedFacility.phone_number}`;
                }
              }}
              disabled={!selectedFacility.phone_number}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: selectedFacility.phone_number ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: selectedFacility.phone_number ? 'pointer' : 'not-allowed'
              }}
            >
              📞 電話
            </button>
          </div>
        </div>
      )}

      {/* 地図の統計情報 */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        fontSize: '0.875rem',
        zIndex: 10
      }}>
        <div style={{ marginBottom: '0.25rem' }}>
          📊 <strong>{facilities.length}件</strong> の事業所
        </div>
        <div style={{ color: '#6b7280' }}>
          🎯 位置情報: {facilitiesWithLocation.length}件
        </div>
      </div>
    </div>
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
          <Link href={`/facilities/${facility.id}`} passHref legacyBehavior>
            <a className="details-button" style={{ textDecoration: 'none' }}>
              詳細を見る
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

// SearchResultsコンポーネント（地図機能復活版・Toggle Switch対応）
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
    }
  };

  // 通常検索処理（地図・リスト表示対応）
  const executeSearch = async (
    filters: SearchFilters, 
    page: number = 1,
    forceViewMode?: 'list' | 'map'
  ) => {
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

      console.log('検索実行:', { ...filters, page, viewMode: currentViewMode });

      const response = await fetch(`/api/search/facilities?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

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
    setHasSearched(true);
    setLastSearchFilters(filters);
    await executeSearch(filters, 1);
  };

  const handlePageChange = async (page: number) => {
    if (!lastSearchFilters) return;
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
            <SearchFilterComponent onSearch={handleSearch} loading={loading} />
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