// components/search/SearchSection.tsx - SearchFilterを使用するラッパーコンポーネント
import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import SearchFilterComponent, { SearchFilters } from './SearchFilter';

interface SearchSectionProps {
  onSearchResults: (facilities: any[], loading: boolean, error: string | null, pagination?: any) => void;
  onShowBookmarks?: () => void;
  isLoggedIn?: boolean;
  isBookmarkMode?: boolean;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  onSearchResults,
  onShowBookmarks,
  isLoggedIn = false,
  isBookmarkMode = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (filters: SearchFilters) => {
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

  const handleShowBookmarks = () => {
    if (onShowBookmarks) onShowBookmarks();
  };

  return (
    <div className="search-section">
      {/* ヘッダー: タイトル + ブックマークボタン */}
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
              transition: 'all 0.2s',
              background: isBookmarkMode ? '#eab308' : '#f3f4f6',
              color: isBookmarkMode ? 'white' : '#374151',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = isBookmarkMode ? '#d97706' : '#e5e7eb';
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

      {/* ブックマークモード説明 */}
      {isBookmarkMode && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
            📌 ブックマークした事業所を表示しています。通常の検索に戻るには「検索」ボタンを押してください。
          </p>
        </div>
      )}

      {/* 検索フォーム（ブックマークモード時は非表示） */}
      {!isBookmarkMode && (
        <SearchFilterComponent onSearch={handleSearch} loading={loading} />
      )}

      {/* ブックマークモード: 通常検索に戻るボタン */}
      {isBookmarkMode && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => handleSearch({ query: '', district: '', serviceIds: [], availabilityOnly: false })}
            className="filter-search-button"
          >
            通常検索に戻る
          </button>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          fontSize: '0.875rem',
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default SearchSection;
