// components/search/SearchSection.tsx - ページネーション対応版
import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

// 検索パラメータの型定義
export interface SearchFilters {
  query: string;
  district: string;
  serviceIds: number[];
  availabilityOnly: boolean;
  page: number;
  limit: number;
}

// サービス情報の型定義
interface ServiceOption {
  id: number;
  name: string;
  category: string;
  description: string;
}

interface SearchSectionProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  loading?: boolean;
  error?: string | null;
  totalResults?: number;
  availableServices?: ServiceOption[];
}

const SearchSection: React.FC<SearchSectionProps> = ({
  filters,
  onFiltersChange,
  loading = false,
  error = null,
  totalResults = 0,
  availableServices = [],
}) => {
  // ローカル状態（入力中の値を保持）
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>(filters.serviceIds);

  // 外部からの filters 変更を反映
  useEffect(() => {
    setLocalFilters(filters);
    setSelectedServices(filters.serviceIds);
  }, [filters]);

  // 東京都の区一覧
  const districts = [
    '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区',
    '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区',
    '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区',
    '葛飾区', '江戸川区'
  ];

  // サービスカテゴリごとにグループ化
  const servicesByCategory = availableServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceOption[]>);

  // 入力値変更ハンドラー
  const handleInputChange = useCallback((field: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value, // ページ以外の変更時はページを1に戻す
    }));
  }, []);

  // サービス選択変更ハンドラー
  const handleServiceChange = useCallback((serviceId: number, checked: boolean) => {
    const newSelectedServices = checked
      ? [...selectedServices, serviceId]
      : selectedServices.filter(id => id !== serviceId);
    
    setSelectedServices(newSelectedServices);
    setLocalFilters(prev => ({
      ...prev,
      serviceIds: newSelectedServices,
      page: 1, // サービス変更時はページを1に戻す
    }));
  }, [selectedServices]);

  // 検索実行
  const handleSearch = useCallback(() => {
    onFiltersChange({
      ...localFilters,
      serviceIds: selectedServices,
    });
  }, [localFilters, selectedServices, onFiltersChange]);

  // リセット
  const handleReset = useCallback(() => {
    const resetFilters: SearchFilters = {
      query: '',
      district: '',
      serviceIds: [],
      availabilityOnly: false,
      page: 1,
      limit: 20,
    };
    setLocalFilters(resetFilters);
    setSelectedServices([]);
    onFiltersChange(resetFilters);
  }, [onFiltersChange]);

  // Enterキーでの検索
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <div className="search-section bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* メイン検索バー */}
      <div className="main-search mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="事業所名で検索..."
              value={localFilters.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              onKeyPress={handleKeyPress}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>検索中...</span>
              </div>
            ) : (
              '検索する'
            )}
          </button>
        </div>

        {/* 検索結果サマリー */}
        {totalResults > 0 && !loading && (
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium text-green-600">{totalResults.toLocaleString()}件</span>
            の事業所が見つかりました
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            ❌ {error}
          </div>
        )}
      </div>

      {/* 詳細フィルター */}
      <div className="filters-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            絞り込み検索
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-green-600 hover:text-green-700 transition-colors"
            >
              {showAdvancedFilters ? '簡易表示' : '詳細表示'}
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              リセット
            </button>
          </div>
        </div>

        {/* 基本フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* 地区選択 */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地区
            </label>
            <select
              value={localFilters.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">すべての地区</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* 表示件数選択 */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示件数
            </label>
            <select
              value={localFilters.limit}
              onChange={(e) => handleInputChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            >
              <option value={10}>10件</option>
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
          </div>

          {/* 空きありフィルター */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              空き状況
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.availabilityOnly}
                onChange={(e) => handleInputChange('availabilityOnly', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">空きのある事業所のみ</span>
            </label>
          </div>
        </div>

        {/* 詳細フィルター（サービス選択） */}
        {showAdvancedFilters && (
          <div className="advanced-filters border-t border-gray-200 pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">提供サービスで絞り込み</h4>
            <div className="space-y-4">
              {Object.entries(servicesByCategory).map(([category, services]) => (
                <div key={category} className="service-category">
                  <h5 className="text-sm font-medium text-gray-800 mb-2">{category}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                        title={service.description}
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => handleServiceChange(service.id, e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700 truncate" title={service.description}>
                          {service.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 検索実行ボタン */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`px-8 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading ? '検索中...' : '条件で検索'}
          </button>
        </div>

        {/* 選択されたフィルターの表示 */}
        {(localFilters.district || selectedServices.length > 0 || localFilters.availabilityOnly) && (
          <div className="active-filters mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-2">適用中のフィルター:</div>
            <div className="flex flex-wrap gap-2">
              {localFilters.district && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  地区: {localFilters.district}
                </span>
              )}
              {selectedServices.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  サービス: {selectedServices.length}件選択
                </span>
              )}
              {localFilters.availabilityOnly && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  空きあり
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSection;