// pages/api/search/facilities.ts - RPCを利用した修正版
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
      page = '1',
      limit = '12'
    } = req.query;

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