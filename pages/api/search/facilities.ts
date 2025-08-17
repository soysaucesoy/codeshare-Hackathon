// pages/api/search/facilities.ts - サービス検索対応修正版
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 環境変数から Supabase 設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase クライアント初期化
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// 簡単な型定義
interface SearchResponse {
  facilities: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | ErrorResponse>
) {
  // メソッドチェック
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 環境変数チェック
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
    const searchAvailabilityOnly = Array.isArray(availability_only) 
      ? availability_only[0] === 'true' 
      : availability_only === 'true';
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1;
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // service_ids の処理（デバッグログ追加）
    let serviceIds: number[] = [];
    if (service_ids) {
      try {
        const serviceIdsStr = Array.isArray(service_ids) ? service_ids[0] : service_ids;
        console.log('service_ids 受信:', serviceIdsStr);
        serviceIds = JSON.parse(serviceIdsStr);
        console.log('service_ids パース結果:', serviceIds);
      } catch (e) {
        console.warn('service_ids パースエラー:', service_ids, e);
      }
    }

    console.log('=== 検索API デバッグ情報 ===');
    console.log('検索パラメータ:', { 
      searchQuery, 
      searchDistrict, 
      serviceIds, 
      searchAvailabilityOnly, 
      pageNum, 
      limitNum 
    });

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

    // 検索条件の追加
    if (searchQuery && searchQuery.trim() !== '') {
      facilitiesQuery = facilitiesQuery.ilike('name', `%${searchQuery.trim()}%`);
      console.log('事業所名検索追加:', searchQuery);
    }

    if (searchDistrict && searchDistrict.trim() !== '') {
      facilitiesQuery = facilitiesQuery.eq('district', searchDistrict.trim());
      console.log('地区検索追加:', searchDistrict);
    }

    // ページネーションと並び順
    facilitiesQuery = facilitiesQuery
      .range(offset, offset + limitNum - 1)
      .order('updated_at', { ascending: false });

    // データ取得
    console.log('Supabase クエリ実行中...');
    const { data, error: facilitiesError } = await facilitiesQuery;

    if (facilitiesError) {
      console.error('Supabase 事業所取得エラー:', facilitiesError);
      throw new Error(`事業所データの取得に失敗しました: ${facilitiesError.message}`);
    }

    console.log('Supabase から取得した事業所数:', data?.length || 0);

    let filteredFacilities = data || [];

    // サービスIDでフィルタリング（後処理）
    if (serviceIds && serviceIds.length > 0) {
      console.log('サービスIDフィルタリング開始:', serviceIds);
      
      const beforeFilter = filteredFacilities.length;
      filteredFacilities = filteredFacilities.filter(facility => {
        const hasMatchingService = facility.facility_services?.some((fs: any) => {
          const serviceId = fs.service_id || fs.services?.id;
          const matches = serviceIds.includes(serviceId);
          if (matches) {
            console.log(`マッチしたサービス: 事業所${facility.name} - サービスID${serviceId}`);
          }
          return matches;
        });
        return hasMatchingService;
      });
      
      console.log(`サービスフィルタリング結果: ${beforeFilter} → ${filteredFacilities.length}`);
    }

    // 空きありのみフィルター
    if (searchAvailabilityOnly) {
      console.log('空きありフィルタリング開始');
      
      const beforeAvailabilityFilter = filteredFacilities.length;
      filteredFacilities = filteredFacilities.filter(facility =>
        facility.facility_services?.some((fs: any) =>
          fs.availability === 'available'
        )
      );
      
      console.log(`空きありフィルタリング結果: ${beforeAvailabilityFilter} → ${filteredFacilities.length}`);
    }

    // データを整形（servicesという名前に変更）
    const transformedFacilities = filteredFacilities.map((facility: any) => ({
      ...facility,
      services: facility.facility_services?.map((fs: any) => ({
        id: fs.id,
        availability: fs.availability,
        capacity: fs.capacity,
        current_users: fs.current_users,
        service: fs.services,
      })) || [],
    }));

    console.log(`最終検索結果: ${transformedFacilities.length} 件`);

    // 総数取得のクエリ（簡略化）
    const totalCount = transformedFacilities.length; // 簡易実装

    // レスポンス作成
    const response: SearchResponse = {
      facilities: transformedFacilities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    };

    console.log('=== API レスポンス ===');
    console.log('返送する事業所数:', response.facilities.length);

    res.status(200).json(response);

  } catch (error) {
    console.error('検索API エラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '事業所検索中にエラーが発生しました';

    res.status(500).json({ 
      error: errorMessage 
    });
  }
}