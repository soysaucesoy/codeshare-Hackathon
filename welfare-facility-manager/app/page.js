'use client';

import { useState } from 'react';

// FacilityForm コンポーネント（インライン）
const FacilityForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    serviceType: '',
    capacity: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const serviceTypes = [
    'デイサービス',
    '訪問介護',
    'ショートステイ',
    'グループホーム',
    '小規模多機能型居宅介護',
    '訪問看護',
    'その他'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '事業所名は必須です';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }
    
    if (formData.capacity && isNaN(Number(formData.capacity))) {
      newErrors.capacity = '定員は数字で入力してください';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        serviceType: '',
        capacity: '',
        description: ''
      });
    } catch (error) {
      setErrors({ submit: '登録に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">新規事業所登録</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            事業所名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例: ○○デイサービスセンター"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 東京都渋谷区○○1-2-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 03-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例: info@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">サービス種別</label>
          <select
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {serviceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">定員</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例: 30"
            min="0"
          />
          {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">説明・特徴</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="事業所の特徴やサービス内容について"
          />
        </div>

        {errors.submit && (
          <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
            {errors.submit}
          </div>
        )}

        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            } text-white transition-colors`}
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

// FacilityList コンポーネント（インライン）
const FacilityList = ({ refreshTrigger }) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/facilities');
      
      if (!response.ok) {
        throw new Error('事業所データの取得に失敗しました');
      }
      
      const data = await response.json();
      setFacilities(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchFacilities();
  });
  
  useState(() => {
    if (refreshTrigger > 0) {
      fetchFacilities();
    }
  }, [refreshTrigger]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getServiceTypeColor = (serviceType) => {
    const colors = {
      'デイサービス': 'bg-blue-100 text-blue-800',
      '訪問介護': 'bg-green-100 text-green-800',
      'ショートステイ': 'bg-purple-100 text-purple-800',
      'グループホーム': 'bg-orange-100 text-orange-800',
      '小規模多機能型居宅介護': 'bg-indigo-100 text-indigo-800',
      '訪問看護': 'bg-pink-100 text-pink-800',
      'その他': 'bg-gray-100 text-gray-800'
    };
    return colors[serviceType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <h3 className="font-medium">エラーが発生しました</h3>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchFacilities}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">登録された事業所がありません</h3>
        <p className="text-gray-600">新しい事業所を登録してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">登録事業所一覧</h2>
            <p className="mt-1 text-sm text-gray-600">
              {facilities.length}件の事業所が登録されています
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {facility.name}
                    </h3>
                    
                    {facility.serviceType && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getServiceTypeColor(facility.serviceType)}`}>
                        {facility.serviceType}
                      </span>
                    )}
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      {facility.address && (
                        <p className="flex items-center">
                          <span className="mr-2">📍</span>
                          {facility.address}
                        </p>
                      )}
                      
                      {facility.phone && (
                        <p className="flex items-center">
                          <span className="mr-2">📞</span>
                          {facility.phone}
                        </p>
                      )}
                      
                      {facility.email && (
                        <p className="flex items-center">
                          <span className="mr-2">📧</span>
                          {facility.email}
                        </p>
                      )}
                      
                      {facility.capacity > 0 && (
                        <p className="flex items-center">
                          <span className="mr-2">👥</span>
                          定員: {facility.capacity}名
                        </p>
                      )}
                    </div>

                    {facility.description && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-700">
                          {facility.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      登録日: {formatDate(facility.createdAt)}
                    </p>
                    
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        詳細
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        編集
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// メインのダッシュボードコンポーネント
export default function Dashboard() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleFacilitySubmit = async (facilityData) => {
    try {
      const response = await fetch('/api/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facilityData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '登録に失敗しました');
      }

      // 成功時の処理
      setCurrentView('list');
      setRefreshCounter(prev => prev + 1); // 一覧を再読み込み
      
      // 成功メッセージを表示（簡易版）
      alert('事業所が正常に登録されました');
      
    } catch (error) {
      throw error; // FacilityFormでエラーハンドリング
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
  };

  const handleAddNew = () => {
    setCurrentView('form');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                福祉事業所管理システム
              </h1>
              <p className="text-gray-600 mt-1">
                事業所の情報を管理・表示します
              </p>
            </div>
            
            {currentView === 'list' && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                + 新規事業所登録
              </button>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'list' ? (
          <FacilityList refreshTrigger={refreshCounter} />
        ) : (
          <FacilityForm onSubmit={handleFacilitySubmit} onCancel={handleCancel} />
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 福祉事業所管理システム
          </p>
        </div>
      </footer>
    </div>
  );
}