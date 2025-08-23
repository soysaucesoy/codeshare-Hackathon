// pages/api/search/facilities.ts - ブックマーク対応版
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service Roleクライアントを使用
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface SearchResponse {
  facilities: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase環境変数が設定されていません');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. クエリパラメータの解析
    const {
      query = '',
      district = '',
      service_ids,
      availability_only = 'false',
      facility_ids, // 新しく追加：ブックマーク用
      page = '1',
      limit = '12'
    } = req.query;

    // ★ ブックマーク表示用：facility_ids が指定されている場合
    if (facility_ids) {
      console.log('🔖 === ブックマーク事業所取得開始 ===');
      
      try {
        const facilityIdsStr = Array.isArray(facility_ids) ? facility_ids[0] : facility_ids;
        const facilityIdsArray: number[] = JSON.parse(facilityIdsStr);
        
        if (!Array.isArray(facilityIdsArray) || facilityIdsArray.length === 0) {
          return res.status(400).json({ error: 'Invalid facility_ids format' });
        }

        console.log('指定された事業所ID:', facilityIdsArray);

        // 指定されたIDの事業所を直接取得
        const { data: facilities, error } = await supabase
          .from('facilities')
          .select(`
            id,
            name,
            description,
            appeal_points,
            address,
            district,
            latitude,
            longitude,
            phone_number,
            website_url,
            image_url,
            is_active,
            created_at,
            updated_at,
            services:facility_services(
              id,
              availability,
              capacity,
              current_users,
              service:services(
                id,
                name,
                category,
                description
              )
            )
          `)
          .in('id', facilityIdsArray)
          .eq('is_active', true)
          .order('id', { ascending: true });

        if (error) {
          console.error('❌ ブックマーク事業所取得エラー:', error);
          throw new Error(`事業所取得中にエラーが発生しました: ${error.message}`);
        }

        const resultFacilities = facilities || [];
        console.log('🎉 ブックマーク事業所取得完了:', resultFacilities.length, '件');

        // ブックマークの順序を維持するためにソート
        const sortedFacilities = resultFacilities.sort((a, b) => {
          const aIndex = facilityIdsArray.indexOf(a.id);
          const bIndex = facilityIdsArray.indexOf(b.id);
          return aIndex - bIndex;
        });

        const response: SearchResponse = {
          facilities: sortedFacilities,
          pagination: {
            page: 1,
            limit: sortedFacilities.length,
            total: sortedFacilities.length,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

        return res.status(200).json(response);

      } catch (parseError) {
        console.error('❌ facility_ids解析エラー:', parseError);
        return res.status(400).json({ error: 'Invalid facility_ids format' });
      }
    }

    // ★ 通常の検索処理（既存のRPC方式）
    const searchQuery = Array.isArray(query) ? query[0] : query;
    const searchDistrict = Array.isArray(district) ? district[0] : district;
    const searchAvailabilityOnly = (Array.isArray(availability_only) ? availability_only[0] : availability_only) === 'true';
    const pageNum = Math.max(1, parseInt(Array.isArray(page) ? page[0] : page, 10) || 1);
    const limitNum = Math.max(1, Math.min(1000, parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let serviceIds: number[] = [];
    if (service_ids) {
      try {
        const serviceIdsStr = Array.isArray(service_ids) ? service_ids[0] : service_ids;
        if (serviceIdsStr) {
          serviceIds = JSON.parse(serviceIdsStr);
        }
      } catch (e) {
        console.warn('service_ids パースエラー:', service_ids, e);
      }
    }

    console.log('🔍 === RPC検索開始 ===');
    console.log('検索条件:', { searchQuery, searchDistrict, serviceIds, searchAvailabilityOnly, pageNum, limitNum });
    
    // 2. RPCを呼び出す
    const { data, error } = await supabase.rpc('search_facilities_with_filters', {
      p_query: searchQuery.trim(),
      p_district: searchDistrict.trim(),
      p_service_ids: serviceIds,
      p_availability_only: searchAvailabilityOnly,
      p_limit: limitNum,
      p_offset: offset,
    });
    
    if (error) {
      console.error('❌ RPC実行エラー:', error);
      throw new Error(`事業所検索中にエラーが発生しました: ${error.message}`);
    }

    if (!data) {
        console.warn('⚠️ RPCからデータが返されませんでした');
        throw new Error('RPC did not return data.');
    }

    const facilities = data.facilities || [];
    const totalCount = data.total_count || 0;

    console.log('🎉 最終結果:', facilities.length, '件返却 (総件数:', totalCount, ')');

    // 3. レスポンスを構築
    const response: SearchResponse = {
      facilities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ API実行エラー:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '事業所検索中に予期せぬエラーが発生しました'
    });
  }
}