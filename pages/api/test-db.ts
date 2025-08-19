// pages/api/test-db.ts - データベーステスト用API
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const testResults: any = {};

    // 1. 全事業所数の確認
    console.log('=== データベース状況テスト ===');
    
    const { count: totalFacilities, error: countError } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    testResults.totalFacilities = totalFacilities;
    console.log('全事業所数:', totalFacilities);

    // 2. 各地区の事業所数
    const { data: districtCounts, error: districtError } = await supabase
      .from('facilities')
      .select('district')
      .eq('is_active', true);

    if (!districtError && districtCounts) {
      const districtStats: any = {};
      districtCounts.forEach((facility: any) => {
        districtStats[facility.district] = (districtStats[facility.district] || 0) + 1;
      });
      testResults.districtStats = districtStats;
      console.log('地区別統計:', districtStats);
    }

    // 3. 最初の5件のサンプルデータ
    const { data: sampleData, error: sampleError } = await supabase
      .from('facilities')
      .select(`
        id, name, district,
        facility_services (
          id, service_id, availability,
          services (id, name, category)
        )
      `)
      .eq('is_active', true)
      .limit(5);

    testResults.sampleData = sampleData;
    console.log('サンプルデータ:', sampleData?.map(f => `${f.name} (${f.district})`));

    // 4. facility_services の統計
    const { count: totalServices, error: servicesError } = await supabase
      .from('facility_services')
      .select('*', { count: 'exact', head: true });

    testResults.totalServices = totalServices;
    console.log('facility_services総数:', totalServices);

    // 5. services テーブルの確認
    const { data: servicesList, error: servicesListError } = await supabase
      .from('services')
      .select('id, name, category')
      .limit(10);

    testResults.servicesList = servicesList;
    console.log('利用可能サービス:', servicesList?.map(s => `${s.name} (ID:${s.id})`));

    // 6. 地区なしでの基本クエリテスト
    const { data: basicQuery, error: basicError } = await supabase
      .from('facilities')
      .select('id, name, district')
      .eq('is_active', true)
      .limit(10);

    testResults.basicQuerySample = basicQuery?.map(f => ({ name: f.name, district: f.district }));
    console.log('基本クエリサンプル:', basicQuery?.length, '件');

    // 7. 特定地区での検索テスト
    const testDistrict = '新宿区';
    const { data: districtQuery, error: districtQueryError } = await supabase
      .from('facilities')
      .select('id, name, district')
      .eq('is_active', true)
      .eq('district', testDistrict)
      .limit(5);

    testResults.districtQuerySample = {
      district: testDistrict,
      count: districtQuery?.length || 0,
      sample: districtQuery?.map(f => f.name)
    };
    console.log(`${testDistrict}での検索:`, districtQuery?.length, '件');

    console.log('=== テスト完了 ===');

    res.status(200).json({
      message: 'データベーステスト完了',
      timestamp: new Date().toISOString(),
      ...testResults
    });

  } catch (error) {
    console.error('データベーステストエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}