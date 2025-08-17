import React, { useState } from 'react';
import { useSearch, SearchFilters } from '@/lib/hooks/useSearch';

interface SearchSectionProps {
  onSearchResults: (facilities: any[], loading: boolean, error: string | null) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSearchResults }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    district: '',
    serviceCategory: '',
    availableOnly: false,
  });

  const { facilities, loading, error, searchFacilities } = useSearch();

  // 検索結果を親コンポーネントに渡す
  React.useEffect(() => {
    onSearchResults(facilities, loading, error);
  }, [facilities, loading, error, onSearchResults]);

  const handleSearch = async () => {
    await searchFacilities(filters);
  };

  const handleInputChange = (field: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const districts = [
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区'
  ];

  const serviceCategories = [
    '訪問系サービス',
    '日中活動系サービス',
    '施設系サービス',
    '居住系サービス',
    '訓練系・就労系サービス',
    '障害児通所系サービス',
    '障害児入所系サービス',
    '相談系サービス'
  ];

  return (
    <div className="search-section">
      {/* メイン検索 */}
      <div className="main-search">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="事業所名で検索..."
            value={filters.query}
            onChange={(e) => handleInputChange('query', e.target.value)}
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? '検索中...' : '検索する'}
        </button>
      </div>

      {/* フィルター */}
      <div className="filters-section">
        <h3 className="filters-title">絞り込み検索</h3>
        
        <div className="filters-grid">
          {/* 地区選択 */}
          <div className="filter-group">
            <label className="filter-label">地区</label>
            <select
              value={filters.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              className="filter-select"
            >
              <option value="">すべての地区</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* サービスカテゴリ選択 */}
          <div className="filter-group">
            <label className="filter-label">サービス種別</label>
            <select
              value={filters.serviceCategory}
              onChange={(e) => handleInputChange('serviceCategory', e.target.value)}
              className="filter-select"
            >
              <option value="">すべてのサービス</option>
              {serviceCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 空きありフィルター */}
          <div className="filter-group">
            <label className="filter-checkbox-container">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => handleInputChange('availableOnly', e.target.checked)}
                className="filter-checkbox"
              />
              <span className="filter-checkbox-label">空きのある事業所のみ</span>
            </label>
          </div>
        </div>

        <button 
          onClick={handleSearch}
          disabled={loading}
          className="filter-search-button"
        >
          条件で検索
        </button>
      </div>
    </div>
  );
};

export default SearchSection;