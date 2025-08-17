import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchTest = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/search/facilities?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '検索に失敗しました');
      }
      
      setResults(data);
      console.log('検索結果:', data);
    } catch (err) {
      setError(err.message);
      console.error('検索エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">検索機能テスト</h1>
        
        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="事業所名で検索（例：生活介護、世田谷など）"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '検索中...' : '検索'}
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">エラー: {error}</p>
          </div>
        )}

        {/* 検索結果 */}
        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              検索結果: {results.pagination.total}件
            </h2>
            
            {results.facilities.length > 0 ? (
              <div className="space-y-4">
                {results.facilities.map((facility) => (
                  <div key={facility.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{facility.name}</h3>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {facility.district}
                      </span>
                    </div>
                    {facility.description && (
                      <p className="text-gray-600 mb-2">{facility.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      住所: {facility.address}
                    </p>
                    {facility.phone_number && (
                      <p className="text-sm text-gray-500">
                        電話: {facility.phone_number}
                      </p>
                    )}
                    {facility.facility_services && facility.facility_services.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">サービス: </span>
                        {facility.facility_services.map((service, index) => (
                          <span key={index} className="text-sm text-gray-600">
                            {service.services?.name}
                            {service.availability === 'available' ? ' (空きあり)' : ' (空きなし)'}
                            {index < facility.facility_services.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                該当する事業所が見つかりませんでした
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTest;