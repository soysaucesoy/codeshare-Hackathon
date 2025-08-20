// components/search/SearchSection.tsx - 修正版（サービスID対応）
import React, { useState, useEffect } from 'react';

interface SearchFilters {
  query: string;
  district: string;
  serviceIds: number[];  // 修正: カテゴリではなくサービスID配列
  availabilityOnly: boolean;  // 修正: 名前を統一
}

interface Service {
  id: number;
  name: string;
  category: string;
}

interface SearchSectionProps {
  onSearchResults: (facilities: any[], loading: boolean, error: string | null, pagination?: any) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSearchResults }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    district: '',
    serviceIds: [],
    availabilityOnly: false,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // サービス一覧を取得
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const servicesData = await response.json();
          setServices(servicesData);
        }
      } catch (err) {
        console.warn('サービス一覧の取得に失敗:', err);
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
      console.log('🔍 検索実行:', filters);

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
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`検索に失敗しました (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ 検索結果:', data);

      onSearchResults(data.facilities || [], false, null, data.pagination);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索中にエラーが発生しました';
      console.error('❌ 検索エラー:', errorMessage);
      setError(errorMessage);
      onSearchResults([], false, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SearchFilters, value: string | boolean | number[]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // サービス選択の変更
  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    const newServiceIds = checked
      ? [...filters.serviceIds, serviceId]
      : filters.serviceIds.filter(id => id !== serviceId);
    
    setFilters(prev => ({ ...prev, serviceIds: newServiceIds }));
  };

  const districts = [
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区'
  ];

  return (
    <div className="search-section bg-white rounded-lg shadow-sm border p-6">
      {/* メイン検索 */}
      <div className="main-search mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="事業所名で検索..."
              value={filters.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading ? '検索中...' : '検索する'}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            ❌ {error}
          </div>
        )}
      </div>

      {/* フィルター */}
      <div className="filters-section">
        <h3 className="text-lg font-semibold mb-4">絞り込み検索</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 地区選択 */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">地区</label>
            <select
              value={filters.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">すべての地区</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* 空きありフィルター */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">空き状況</label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.availabilityOnly}
                onChange={(e) => handleInputChange('availabilityOnly', e.target.checked)}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">空きのある事業所のみ</span>
            </label>
          </div>
        </div>

        {/* サービス選択（修正版：サービスID使用） */}
        {Object.keys(servicesByCategory).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">提供サービス</h4>
            <div className="space-y-4">
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                <div key={category} className="border rounded-lg p-3">
                  <h5 className="font-medium text-gray-800 mb-2">{category}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryServices.map((service) => (
                      <label key={service.id} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={filters.serviceIds.includes(service.id)}
                          onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                          className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 選択されたサービスの表示 */}
        {filters.serviceIds.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-2">
              選択中のサービス ({filters.serviceIds.length}件):
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.serviceIds.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return service ? (
                  <span key={serviceId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {service.name}
                    <button
                      onClick={() => handleServiceToggle(serviceId, false)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <button 
          onClick={handleSearch}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {loading ? '検索中...' : '条件で検索'}
        </button>
      </div>
    </div>
  );
};

export default SearchSection;