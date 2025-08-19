// pages/api/facilities/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.resolve(process.cwd(), 'data', 'facilities.json');

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      name, 
      description, 
      appeal_points, 
      address, 
      district, 
      phone_number, 
      website_url, 
      image_url, 
      serviceIds 
    } = req.body;

    // 簡単なバリデーション
    if (!name || !address || !district || !serviceIds || serviceIds.length === 0) {
      return res.status(400).json({ error: '必須項目が不足しています。' });
    }

    let facilities: any[] = [];
    try {
      // ファイルが存在し、内容がある場合のみ読み込む
      if (fs.existsSync(DATA_FILE_PATH)) {
        const facilitiesData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        if (facilitiesData) { // ファイルが空でないことを確認
          facilities = JSON.parse(facilitiesData);
        }
      }
    } catch (parseError) {
      console.warn('Error parsing facilities.json, initializing as empty array:', parseError);
      // エラーが発生した場合でも、空の配列として続行
      facilities = [];
    }

    // 新しい事業所データを作成
    const newFacility = {
      // より堅牢なID生成: 既存のIDの最大値 + 1、またはファイルが空の場合は1
      id: facilities.length > 0 ? Math.max(...facilities.map((f: any) => f.id)) + 1 : 1,
      name,
      description: description || null,
      appeal_points: appeal_points || null,
      address,
      district,
      latitude: null, 
      longitude: null,
      phone_number: phone_number || null,
      website_url: website_url || null,
      image_url: image_url || null,
      is_active: true, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      services: serviceIds.map((id: number) => ({
        id: id, // service_idとして使用
        availability: 'available',
        capacity: null,
        current_users: 0,
        service: { id: id, name: '', category: '', description: '' } // 仮のサービス情報
      })),
    };

    facilities.push(newFacility);

    // 更新されたデータをファイルに書き込む
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(facilities, null, 2), 'utf-8');

    console.log('New facility registered and saved:', newFacility);

    res.status(201).json({ message: '登録が成功しました', facility: newFacility });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}