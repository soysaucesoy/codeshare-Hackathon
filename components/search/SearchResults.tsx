import React from 'react';
import { FacilityWithServices } from '@/lib/hooks/useSearch';

interface SearchResultsProps {
  facilities: FacilityWithServices[];
  loading: boolean;
  error: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  facilities,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="search-results">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>検索中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results">
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
        </div>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="search-results">
        <div className="no-results">
          <p>🔍 検索結果がありません</p>
          <p className="no-results-sub">検索条件を変更してもう一度お試しください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <h3 className="results-title">検索結果 ({facilities.length}件)</h3>
      </div>

      <div className="facilities-grid">
        {facilities.map((facility) => (
          <div key={facility.id} className="facility-card">
            {/* 事業所画像 */}
            <div className="facility-image">
              {facility.image_url ? (
                <img src={facility.image_url} alt={facility.name} />
              ) : (
                <div className="no-image">🏢</div>
              )}
            </div>

            {/* 事業所情報 */}
            <div className="facility-info">
              <h4 className="facility-name">{facility.name}</h4>
              <p className="facility-district">📍 {facility.district}</p>
              
              {facility.description && (
                <p className="facility-description">
                  {facility.description.length > 100 
                    ? facility.description.substring(0, 100) + '...'
                    : facility.description
                  }
                </p>
              )}

              {/* サービス情報 */}
              <div className="services-info">
                <p className="services-label">提供サービス：</p>
                <div className="services-list">
                  {facility.facility_services?.slice(0, 3).map((fs) => (
                    <span 
                      key={fs.id}
                      className={`service-tag ${fs.availability === 'available' ? 'available' : 'unavailable'}`}
                    >
                      {fs.availability === 'available' ? '○' : '×'} {fs.service?.name}
                    </span>
                  ))}
                  {facility.facility_services && facility.facility_services.length > 3 && (
                    <span className="more-services">
                      他{facility.facility_services.length - 3}件
                    </span>
                  )}
                </div>
              </div>

              {/* 連絡先 */}
              <div className="contact-info">
                {facility.phone_number && (
                  <p className="phone">📞 {facility.phone_number}</p>
                )}
                {facility.website_url && (
                  <p className="website">
                    <a href={facility.website_url} target="_blank" rel="noopener noreferrer">
                      🌐 ウェブサイト
                    </a>
                  </p>
                )}
              </div>

              {/* アクションボタン */}
              <div className="facility-actions">
                <button className="details-button">
                  詳細を見る
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;