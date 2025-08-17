// scripts/import-wamnet-data.js
require('dotenv').config();  // この行を追加
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 環境変数の確認とデバッグ
console.log('環境変数確認:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 設定済み' : '❌ 未設定');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 設定済み' : '❌ 未設定');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ 環境変数が設定されていません。');
  console.error('.env.localファイルを確認してください。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 以下は元のコードと同じ...
// 東京23区のマッピング
const TOKYO_DISTRICTS = {
  '千代田区': '千代田区', '中央区': '中央区', '港区': '港区', '新宿区': '新宿区',
  '文京区': '文京区', '台東区': '台東区', '墨田区': '墨田区', '江東区': '江東区',
  '品川区': '品川区', '目黒区': '目黒区', '大田区': '大田区', '世田谷区': '世田谷区',
  '渋谷区': '渋谷区', '中野区': '中野区', '杉並区': '杉並区', '豊島区': '豊島区',
  '北区': '北区', '荒川区': '荒川区', '板橋区': '板橋区', '練馬区': '練馬区',
  '足立区': '足立区', '葛飾区': '葛飾区', '江戸川区': '江戸川区'
};

// サービス種別のマッピング
const SERVICE_MAPPING = {
  '居宅介護': 1,
  '重度訪問介護': 2,
  '同行援護': 3,
  '行動援護': 4,
  '重度障害者等包括支援': 5,
  '療養介護': 6,
  '生活介護': 7,
  '短期入所': 8,
  '施設入所支援': 9,
  '共同生活援助': 10,
  '自立生活援助': 11,
  '自立訓練(機能訓練)': 12,
  '自立訓練(生活訓練)': 13,
  '宿泊型自立訓練': 14,
  '就労移行支援': 15,
  '就労継続支援Ａ型': 16,
  '就労継続支援Ｂ型': 17,
  '就労定着支援': 18,
  '児童発達支援': 19,
  '医療型児童発達支援': 20,
  '放課後等デイサービス': 21,
  '居宅訪問型児童発達支援': 22,
  '保育所等訪問支援': 23,
  '福祉型障害児入所施設': 24,
  '医療型障害児入所施設': 25,
  '地域相談支援(地域移行)': 26,
  '地域相談支援(地域定着)': 27,
  '計画相談支援': 28,
  '障害児相談支援': 29
};

// 地区を抽出する関数
function extractDistrict(address) {
  if (!address) return null;
  
  for (const district of Object.keys(TOKYO_DISTRICTS)) {
    if (address.includes(district)) {
      return district;
    }
  }
  return null;
}

// 電話番号をフォーマット
function formatPhoneNumber(phone) {
  if (!phone || phone === '') return null;
  return phone.replace(/[^\d-]/g, '');
}

// URLをバリデート
function validateUrl(url) {
  if (!url || url === '' || url === '-') return null;
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  return url;
}

// ランダムな画像URLを生成（サンプル用）
function generateSampleImageUrl() {
  const imageIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
  return `https://picsum.photos/400/300?random=${randomId}`;
}

// ランダムなアピールポイントを生成（サンプル用）
function generateAppealPoints() {
  const appealPoints = [
    '利用者一人ひとりに寄り添ったサービス提供を心がけています',
    '経験豊富なスタッフが安心・安全なサービスを提供します',
    '個別支援計画に基づいた質の高いサービスを実施しています',
    '地域に根ざした温かいサービスを提供しています',
    '利用者の自立支援に向けた充実したプログラムを用意しています',
    'バリアフリー環境で快適にご利用いただけます',
    '24時間体制でサポートいたします',
    '専門性の高いスタッフによる個別対応を行っています'
  ];
  
  // 30%の確率でアピールポイントを設定
  if (Math.random() < 0.3) {
    const randomIndex = Math.floor(Math.random() * appealPoints.length);
    return appealPoints[randomIndex];
  }
  return null;
}

async function importWAMNETData() {
  console.log('WAMNETデータのインポートを開始します...');
  
  const facilities = [];
  const facilityServices = [];
  let processedCount = 0;
  let errorCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream('wamnet.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          // 東京都のデータのみ処理
          const district = extractDistrict(row['事業所住所（市区町村）']);
          if (!district) {
            return; // 東京23区以外はスキップ
          }

          // サービス種別の確認
          const serviceId = SERVICE_MAPPING[row['サービス種別']];
          if (!serviceId) {
            console.log(`未対応のサービス種別: ${row['サービス種別']}`);
            return;
          }

          // 事業所データの作成
          const facility = {
            name: row['事業所の名称'] || row['法人の名称'],
            description: `${row['法人の名称']}が運営する${row['サービス種別']}事業所です。`,
            appeal_points: generateAppealPoints(),
            address: `${row['事業所住所（市区町村）']} ${row['事業所住所（番地以降）'] || ''}`.trim(),
            district: district,
            latitude: row['事業所緯度'] && !isNaN(parseFloat(row['事業所緯度'])) 
              ? parseFloat(row['事業所緯度']) : null,
            longitude: row['事業所経度'] && !isNaN(parseFloat(row['事業所経度'])) 
              ? parseFloat(row['事業所経度']) : null,
            phone_number: formatPhoneNumber(row['事業所電話番号']),
            website_url: validateUrl(row['事業所URL'] || row['法人URL']),
            image_url: Math.random() < 0.4 ? generateSampleImageUrl() : null,
            is_active: true,
            external_id: row['事業所番号'] ? parseInt(row['事業所番号']) : null,
            legal_entity_name: row['法人の名称'],
            service_type: row['サービス種別'],
            capacity: row['定員'] && !isNaN(parseFloat(row['定員'])) 
              ? parseInt(parseFloat(row['定員'])) : null,
          };

          // 既存の事業所があるかチェック用のキー
          const facilityKey = `${facility.name}_${facility.district}_${row['事業所番号']}`;
          
          if (!facilities.find(f => `${f.name}_${f.district}_${f.external_id}` === facilityKey)) {
            facilities.push(facility);
          }

          // サービス関連データ
          const facilityService = {
            facility_key: facilityKey,
            service_id: serviceId,
            availability: Math.random() > 0.7 ? 'available' : 'unavailable',
            capacity: facility.capacity,
            current_users: facility.capacity 
              ? Math.floor(Math.random() * facility.capacity) 
              : null
          };

          facilityServices.push(facilityService);
          processedCount++;

          if (processedCount % 1000 === 0) {
            console.log(`処理済み: ${processedCount} 件`);
          }

        } catch (error) {
          console.error('データ処理エラー:', error);
          errorCount++;
        }
      })
      .on('end', async () => {
        console.log(`\nCSV読み込み完了`);
        console.log(`処理済み: ${processedCount} 件`);
        console.log(`東京23区内の事業所: ${facilities.length} 件`);
        console.log(`エラー: ${errorCount} 件`);

        try {
          await insertFacilitiesToDB(facilities, facilityServices);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('CSV読み込みエラー:', error);
        reject(error);
      });
  });
}

async function insertFacilitiesToDB(facilities, facilityServices) {
  console.log('\nデータベースへの挿入を開始...');

  try {
    // 既存の施設データを削除（開発環境での再インポート用）
    if (process.env.NODE_ENV === 'development') {
      console.log('既存データを削除中...');
      await supabase.from('facility_services').delete().neq('id', 0);
      await supabase.from('facilities').delete().neq('id', 0);
    }

    // 事業所データを挿入（バッチ処理）
    const batchSize = 50;
    const facilitiesInserted = [];

    for (let i = 0; i < facilities.length; i += batchSize) {
      const batch = facilities.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('facilities')
        .insert(batch.map(f => ({
          name: f.name,
          description: f.description,
          appeal_points: f.appeal_points,
          address: f.address,
          district: f.district,
          latitude: f.latitude,
          longitude: f.longitude,
          phone_number: f.phone_number,
          website_url: f.website_url,
          image_url: f.image_url,
          is_active: f.is_active
        })))
        .select('id, name, district');

      if (error) {
        throw error;
      }

      // 挿入された事業所のIDをマッピング
      data.forEach((facility, index) => {
        const originalFacility = batch[index];
        const facilityKey = `${originalFacility.name}_${originalFacility.district}_${originalFacility.external_id}`;
        facilitiesInserted.push({
          id: facility.id,
          key: facilityKey
        });
      });

      console.log(`事業所挿入進捗: ${Math.min(i + batchSize, facilities.length)}/${facilities.length}`);
    }

    // サービスデータを挿入
    console.log('サービスデータを挿入中...');
    const servicesToInsert = [];

    facilityServices.forEach(fs => {
      const facilityData = facilitiesInserted.find(f => f.key === fs.facility_key);
      if (facilityData) {
        servicesToInsert.push({
          facility_id: facilityData.id,
          service_id: fs.service_id,
          availability: fs.availability,
          capacity: fs.capacity,
          current_users: fs.current_users
        });
      }
    });

    // サービスデータもバッチ処理
    for (let i = 0; i < servicesToInsert.length; i += batchSize) {
      const batch = servicesToInsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('facility_services')
        .insert(batch);

      if (error) {
        console.error('サービスデータ挿入エラー:', error);
      }

      console.log(`サービス挿入進捗: ${Math.min(i + batchSize, servicesToInsert.length)}/${servicesToInsert.length}`);
    }

    console.log('\n✅ データインポート完了!');
    console.log(`事業所: ${facilitiesInserted.length} 件`);
    console.log(`サービス関連: ${servicesToInsert.length} 件`);

  } catch (error) {
    console.error('データベース挿入エラー:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  importWAMNETData()
    .then(() => {
      console.log('インポート処理が完了しました。');
      process.exit(0);
    })
    .catch((error) => {
      console.error('インポート処理でエラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { importWAMNETData };