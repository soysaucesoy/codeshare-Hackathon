
// pages/api/register.ts - 新規事業所登録API
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 環境変数から Supabase 設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase クライアント初期化
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

interface RegisterRequest {
  name: string;
  district: string;
  address: string;
  phone_number?: string;
  website_url?: string;
  description?: string;
  appeal_points?: string;
  service_ids: number[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase環境変数が設定されていません');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { 
      name,
      district,
      address,
      phone_number,
      website_url,
      description,
      appeal_points,
      service_ids 
    } = req.body as RegisterRequest;

    // バリデーション
    if (!name || !district || !address || !service_ids || service_ids.length === 0) {
      return res.status(400).json({ error: '必須項目が不足しています。' });
    }

    // 1. facilities テーブルに新しい事業所を挿入
    const { data: facilityData, error: facilityError } = await supabase
      .from('facilities')
      .insert({
        name,
        district,
        address,
        phone_number,
        website_url,
        description,
        appeal_points,
        is_active: true, // デフォルトで有効
      })
      .select()
      .single();

    if (facilityError) {
      console.error('Supabase facility insert error:', facilityError);
      throw new Error(`事業所の登録に失敗しました: ${facilityError.message}`);
    }

    const newFacilityId = facilityData.id;

    // 2. facility_services テーブルに提供サービスを挿入
    const servicesToInsert = service_ids.map(serviceId => ({
      facility_id: newFacilityId,
      service_id: serviceId,
      availability: 'available', // デフォルトは「空きあり」
      // capacity, current_users はnull許容なので省略
    }));

    const { error: servicesError } = await supabase
      .from('facility_services')
      .insert(servicesToInsert);

    if (servicesError) {
      console.error('Supabase facility_services insert error:', servicesError);
      // ロールバック処理: 登録したfacilityを削除
      await supabase.from('facilities').delete().eq('id', newFacilityId);
      throw new Error(`サービスの登録に失敗しました: ${servicesError.message}`);
    }

    res.status(201).json({ message: '事業所の登録が完了しました。', facilityId: newFacilityId });

  } catch (error) {
    console.error('登録APIエラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    res.status(500).json({ error: errorMessage });
  }
}
