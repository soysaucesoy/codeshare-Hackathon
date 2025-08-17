import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Facility {
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
}

export interface FacilityService {
  id: number;
  service_id: number;
  availability: 'available' | 'unavailable';
  capacity: number | null;
  current_users: number;
  service: {
    name: string;
    category: string;
    description: string;
  };
}

export interface FacilityWithServices extends Facility {
  facility_services: FacilityService[];
}

export interface SearchFilters {
  query: string;
  district: string;
  serviceCategory: string;
  availableOnly: boolean;
}

export const useSearch = () => {
  const [facilities, setFacilities] = useState<FacilityWithServices[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const supabase = createClient();

  const searchFacilities = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      // 基本クエリ
      let query = supabase
        .from('facilities')
        .select(`
          *,
          facility_services (
            id,
            service_id,
            availability,
            capacity,
            current_users,
            services (
              name,
              category,
              description
            )
          )
        `)
        .eq('is_active', true);

      // 事業所名検索
      if (filters.query.trim()) {
        query = query.ilike('name', `%${filters.query.trim()}%`);
      }

      // 地区フィルター
      if (filters.district) {
        query = query.eq('district', filters.district);
      }

      // 並び順：更新日時の新しい順
      query = query.order('updated_at', { ascending: false });

      // 最大100件に制限
      query = query.limit(100);

      const { data, error: searchError, count } = await query;

      if (searchError) {
        throw searchError;
      }

      let results = data || [];

      // サービスカテゴリでフィルタリング（クライアントサイド）
      if (filters.serviceCategory) {
        results = results.filter(facility =>
          facility.facility_services?.some((fs: any) =>
            fs.services?.category === filters.serviceCategory
          )
        );
      }

      // 空きありフィルター（クライアントサイド）
      if (filters.availableOnly) {
        results = results.filter(facility =>
          facility.facility_services?.some((fs: any) =>
            fs.availability === 'available'
          )
        );
      }

      setFacilities(results as FacilityWithServices[]);
      setTotalCount(results.length);

    } catch (err: any) {
      console.error('検索エラー:', err);
      setError(err.message || '検索中にエラーが発生しました');
      setFacilities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    facilities,
    loading,
    error,
    totalCount,
    searchFacilities,
  };
};