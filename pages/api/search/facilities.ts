// pages/api/search/facilities.ts - 地区検索修正版
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 環境変数から Supabase 設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase クライアント初期化
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

interface SearchResponse {
  facilities: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  debug?: any; // デバッグ用情報
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase環境変数が設定されていません');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // クエリパラメータの取得
    const {
      query = '',
      district = '',
      service_ids,
      availability_only = 'false',
      page = '1',
      limit = '20'
    } = req.query;

    // パラメータの変換
    const searchQuery = Array.isArray(query) ? query[0] : query;
    const searchDistrict = Array.isArray(district) ? district[0] : district;
    
    // 修正: availability_only の型安全な変換
    const availabilityOnlyValue = Array.isArray(availability_only) 
      ? availability_only[0] 
      : availability_only;
    const searchAvailabilityOnly = availabilityOnlyValue === 'true';
    
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1;
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // service_ids の処理
    let serviceIds: number[] = [];
    if (service_ids) {
      try {
        const serviceIdsStr = Array.isArray(service_ids) ? service_ids[0] : service_ids;
        if (serviceIdsStr && serviceIdsStr !== '') {
          serviceIds = JSON.parse(serviceIdsStr);
        }
      } catch (e) {
        console.warn('service_ids パースエラー:', service_ids, e);
      }
    }

    console.log('=== 検索パラメータ ===');
    console.log('searchQuery:', searchQuery);
    console.log('searchDistrict:', searchDistrict);
    console.log('serviceIds:', serviceIds);
    console.log('searchAvailabilityOnly:', searchAvailabilityOnly);

    // 基本クエリの構築
    let facilitiesQuery = supabase
      .from('facilities')
      .select(`
        id,
        name,
        description,
        appeal_points,
        address,
        district,
        phone_number,
        website_url,
        image_url,
        created_at,
        updated_at,
        facility_services (
          id,
          availability,
          capacity,
          current_users,
          service_id,
          services (
            id,
            name,
            category,
            description
          )
        )
      `)
      .eq('is_active', true);

    // 検索条件の追加（修正版）
    if (searchQuery && searchQuery.trim() !== '') {
      facilitiesQuery = facilitiesQuery.ilike('name', `%${searchQuery.trim()}%`);
      console.log('✅ 事業所名フィルター追加:', searchQuery);
    }

    // 地区フィルター - 空文字列の場合はフィルターを適用しない
    if (searchDistrict && searchDistrict.trim() !== '' && searchDistrict !== 'すべての地区') {
      facilitiesQuery = facilitiesQuery.eq('district', searchDistrict.trim());
      console.log('✅ 地区フィルター追加:', searchDistrict);
    } else {
      console.log('✅ 地区フィルターなし（全地区対象）');
    }

    console.log('データベースクエリ実行中...');

    // データ取得
    const { data: rawFacilities, error: facilitiesError } = await facilitiesQuery;

    if (facilitiesError) {
      console.error('❌ Supabase エラー:', facilitiesError);
      throw new Error(`事業所データの取得に失敗しました: ${facilitiesError.message}`);
    }

    console.log('✅ Supabase から取得:', rawFacilities?.length || 0, '件');

    let filteredFacilities = rawFacilities || [];

    // サービスIDでフィルタリング
    if (serviceIds && serviceIds.length > 0) {
      console.log('🔍 サービスIDフィルタリング開始:', serviceIds);
      
      const beforeCount = filteredFacilities.length;
      filteredFacilities = filteredFacilities.filter(facility => {
        const hasService = facility.facility_services?.some((fs: any) => {
          const serviceId = fs.service_id;
          return serviceIds.includes(serviceId);
        });
        
        if (hasService) {
          console.log(`  ✅ マッチ: ${facility.name}`);
        }
        return hasService;
      });
      
      console.log(`🔍 サービスフィルター結果: ${beforeCount} → ${filteredFacilities.length}`);
    }

    // 空きありフィルター
    if (searchAvailabilityOnly) {
      console.log('🔍 空きありフィルタリング開始');
      
      const beforeCount = filteredFacilities.length;
      filteredFacilities = filteredFacilities.filter(facility =>
        facility.facility_services?.some((fs: any) => fs.availability === 'available')
      );
      
      console.log(`🔍 空きありフィルター結果: ${beforeCount} → ${filteredFacilities.length}`);
    }

    // ページネーション適用
    const totalCount = filteredFacilities.length;
    const paginatedFacilities = filteredFacilities.slice(offset, offset + limitNum);

    // データ整形
    const transformedFacilities = paginatedFacilities.map((facility: any) => ({
      ...facility,
      services: facility.facility_services?.map((fs: any) => ({
        id: fs.id,
        availability: fs.availability,
        capacity: fs.capacity,
        current_users: fs.current_users,
        service: fs.services,
      })) || [],
    }));

    console.log('✅ 最終結果:', transformedFacilities.length, '件（ページング後）');

    const response: SearchResponse = {
      facilities: transformedFacilities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
      // デバッグ情報（開発環境のみ）
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          rawCount: rawFacilities?.length || 0,
          afterServiceFilter: serviceIds.length > 0 ? filteredFacilities.length : 'スキップ',
          afterAvailabilityFilter: searchAvailabilityOnly ? filteredFacilities.length : 'スキップ',
          totalCount,
          searchParams: {
            searchQuery,
            searchDistrict,
            serviceIds,
            searchAvailabilityOnly
          }
        }
      })
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ 検索API エラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '事業所検索中にエラーが発生しました';

    res.status(500).json({ 
      error: errorMessage 
    });
  }
}