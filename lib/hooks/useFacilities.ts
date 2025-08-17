import { useState } from 'react';

export interface Facility {
  id: number;
  name: string;
  description: string | null;
  appeal_points: string | null;
  address: string;
  district: string;
  phone_number: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
  facility_services?: FacilityService[];
}

export interface FacilityService {
  id: number;
  availability: 'available' | 'unavailable';
  capacity: number | null;
  current_users: number;
  services?: {
    name: string;
    category: string;
    description: string;
  };
}

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const searchFacilities = async (params: {
    query?: string;
    district?: string;
    page?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.query) searchParams.set('query', params.query);
      if (params.district) searchParams.set('district', params.district);
      if (params.page) searchParams.set('page', params.page.toString());

      const response = await fetch(`/api/search/facilities?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '検索に失敗しました');
      }

      const data = await response.json();
      setFacilities(data.facilities);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || '事業所の検索に失敗しました');
      console.error('検索エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return { 
    facilities, 
    loading, 
    error, 
    pagination, 
    searchFacilities 
  };
}