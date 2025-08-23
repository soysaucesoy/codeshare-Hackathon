// pages/api/facilities/[id].ts - 事業所詳細API
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // IDの検証
  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return res.status(400).json({ error: '無効な事業所IDです' });
  }

  try {
    const facilityId = parseInt(id);

    // 事業所とサービス情報を取得
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select(`
        *,
        services:facility_services(
          id,
          service_id,
          availability,
          capacity,
          current_users,
          service:services(
            name,
            category,
            description
          )
        )
      `)
      .eq('id', facilityId)
      .single();

    if (facilityError) {
      console.error('事業所取得エラー:', facilityError);
      
      if (facilityError.code === 'PGRST116') {
        return res.status(404).json({ error: '事業所が見つかりません' });
      }
      
      return res.status(500).json({ error: '事業所情報の取得に失敗しました' });
    }

    if (!facility) {
      return res.status(404).json({ error: '事業所が見つかりません' });
    }

    // 非アクティブな事業所は表示しない
    if (!facility.is_active) {
      return res.status(404).json({ error: '事業所が見つかりません' });
    }

    // レスポンスデータを整形
    const responseData = {
      ...facility,
      services: facility.services || [],
      // 詳細ページ用の追加情報（実際のDBスキーマに合わせて調整）
      operating_hours: facility.operating_hours || null,
      established_date: facility.established_date || null,
      organization_type: facility.organization_type || null,
      staff_count: facility.staff_count || null,
      accessibility_features: facility.accessibility_features || [],
      transportation_info: facility.transportation_info || null,
      fees_info: facility.fees_info || null,
      contact_person: facility.contact_person || null,
      email: facility.email || null,
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('予期しないエラー:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}

// APIルート設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};