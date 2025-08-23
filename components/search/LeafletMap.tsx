// components/search/LeafletMap.tsx - Leaflet地図コンポーネント
import React, { useEffect, useRef, useState } from 'react';

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

interface LeafletMapProps {
  facilities: Facility[];
  loading?: boolean;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ facilities, loading = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Leafletライブラリの動的読み込み
  useEffect(() => {
    let mounted = true;

    const loadLeaflet = async () => {
      try {
        // Leafletライブラリを動的に読み込み
        const L = await import('leaflet');
        
        // CSSも動的に読み込み
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        if (!mounted || !mapRef.current) return;

        // デフォルトアイコンの問題を修正
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // 地図の初期化
        const map = L.map(mapRef.current, {
          center: [35.6762, 139.6503], // 東京都庁
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
        });

        // OpenStreetMapタイル追加
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapReady(true);

        console.log('✅ 地図が正常に初期化されました');

      } catch (error) {
        console.error('❌ Leaflet読み込みエラー:', error);
        if (mounted) {
          setMapError('地図ライブラリの読み込みに失敗しました');
        }
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
      // 地図の後始末
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('地図の削除中にエラー:', error);
        }
      }
    };
  }, []);

  // 施設マーカーの更新
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || loading) return;

    const updateMarkers = async () => {
      try {
        const L = await import('leaflet');
        const map = mapInstanceRef.current;

        // 既存のマーカーを削除
        markersRef.current.forEach(marker => {
          try {
            map.removeLayer(marker);
          } catch (error) {
            console.warn('マーカー削除エラー:', error);
          }
        });
        markersRef.current = [];

        if (facilities.length === 0) {
          console.log('表示する施設がありません');
          return;
        }

        // カスタムアイコンを作成
        const facilityIcon = L.divIcon({
          html: `
            <div style="
              width: 25px;
              height: 25px;
              background-color: #22c55e;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">🏢</div>
          `,
          className: 'facility-marker',
          iconSize: [25, 25],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12]
        });

        // 新しいマーカーを追加
        const newMarkers: any[] = [];
        const bounds = L.latLngBounds([]);

        facilities.forEach((facility) => {
          if (facility.latitude == null || facility.longitude == null) return;

          const marker = L.marker([facility.latitude, facility.longitude], {
            icon: facilityIcon
          });

          // ポップアップ内容を作成
          const popupContent = createPopupContent(facility);
          marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'facility-popup'
          });

          marker.addTo(map);
          newMarkers.push(marker);
          bounds.extend([facility.latitude, facility.longitude]);
        });

        markersRef.current = newMarkers;

        // 地図の表示範囲を調整
        if (facilities.length === 1) {
          map.setView([facilities[0].latitude!, facilities[0].longitude!], 15);
        } else if (facilities.length > 1) {
          map.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 16 
          });
        }

        console.log(`✅ ${newMarkers.length}個のマーカーを追加しました`);

      } catch (error) {
        console.error('❌ マーカー更新エラー:', error);
        setMapError('マーカーの表示に失敗しました');
      }
    };

    updateMarkers();
  }, [facilities, isMapReady, loading]);

  // ポップアップ内容の作成
  const createPopupContent = (facility: Facility): string => {
    const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
    const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];

    return `
      <div style="max-width: 280px; font-size: 0.875rem; font-family: system-ui, -apple-system, sans-serif;">
        <h3 style="font-size: 1rem; font-weight: bold; color: #111827; margin: 0 0 0.5rem 0; line-height: 1.3;">
          ${facility.name}
        </h3>
        
        <p style="color: #6b7280; font-size: 0.75rem; margin: 0 0 0.75rem 0;">
          📍 ${facility.district}
        </p>
        
        ${facility.description ? `
          <p style="color: #374151; font-size: 0.75rem; line-height: 1.4; margin: 0 0 0.75rem 0;">
            ${facility.description.length > 80 ? facility.description.slice(0, 80) + '...' : facility.description}
          </p>
        ` : ''}

        ${facility.appeal_points ? `
          <div style="margin-bottom: 0.75rem;">
            <div style="font-size: 0.75rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
              ✨ アピールポイント
            </div>
            <p style="font-size: 0.75rem; color: #22c55e; font-weight: 500; line-height: 1.3; margin: 0;">
              ${facility.appeal_points.length > 60 ? facility.appeal_points.slice(0, 60) + '...' : facility.appeal_points}
            </p>
          </div>
        ` : ''}

        <div style="margin-bottom: 0.75rem;">
          <div style="font-size: 0.75rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
            提供サービス
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
            ${availableServices.slice(0, 3).map(service => `
              <span style="
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                font-size: 0.625rem;
                font-weight: 500;
                background: #dcfce7;
                color: #166534;
              ">○ ${service.service?.name || 'サービス'}</span>
            `).join('')}
            ${unavailableServices.slice(0, 2).map(service => `
              <span style="
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                font-size: 0.625rem;
                font-weight: 500;
                background: #f3f4f6;
                color: #6b7280;
              ">× ${service.service?.name || 'サービス'}</span>
            `).join('')}
            ${(availableServices.length + unavailableServices.length) > 5 ? `
              <span style="
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                font-size: 0.625rem;
                background: #e5e7eb;
                color: #6b7280;
              ">他${(availableServices.length + unavailableServices.length) - 5}件</span>
            ` : ''}
          </div>
        </div>

        <div style="margin-bottom: 0.75rem;">
          ${facility.phone_number ? `
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0 0 0.125rem 0;">
              📞 ${facility.phone_number}
            </p>
          ` : ''}
          ${facility.website_url ? `
            <p style="font-size: 0.75rem; margin: 0 0 0.125rem 0;">
              🌐 <a href="${facility.website_url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none;">ウェブサイト</a>
            </p>
          ` : ''}
        </div>

        <div style="text-align: center;">
          <button style="
            background: #22c55e;
            color: white;
            padding: 0.375rem 1rem;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
          " onclick="console.log('詳細ページへ: ${facility.id}')">
            詳細を見る
          </button>
        </div>
      </div>
    `;
  };

  // エラー表示
  if (mapError) {
    return (
      <div style={{
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: '0.75rem',
        border: '1px solid #fecaca',
        color: '#dc2626'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>{mapError}</p>
        <button 
          onClick={() => {
            setMapError(null);
            window.location.reload();
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          再読み込み
        </button>
      </div>
    );
  }

  // ローディング表示
  if (loading) {
    return (
      <div style={{
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
        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>🗺️</div>
        <p>地図を更新中...</p>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={mapRef} 
        style={{ 
          height: '600px', 
          width: '100%', 
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          zIndex: 0
        }} 
      />
      
      {/* カスタムCSS */}
      <style jsx>{`
        :global(.facility-marker) {
          background: transparent !important;
          border: none !important;
        }
        
        :global(.facility-popup .leaflet-popup-content-wrapper) {
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        :global(.facility-popup .leaflet-popup-tip) {
          background: white;
        }
        
        :global(.leaflet-container) {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default LeafletMap;