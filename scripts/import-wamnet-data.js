// scripts/import-wamnet-data.js
const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '..', '.env.local') 
});

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

// リトライ設定
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  backoffMultiplier: 2
};

// 東京都の市区町村のマッピング（23区 + 市部 + 町村部）
const TOKYO_DISTRICTS = {
  // 特別区（23区）
  '千代田区': '千代田区', '中央区': '中央区', '港区': '港区', '新宿区': '新宿区',
  '文京区': '文京区', '台東区': '台東区', '墨田区': '墨田区', '江東区': '江東区',
  '品川区': '品川区', '目黒区': '目黒区', '大田区': '大田区', '世田谷区': '世田谷区',
  '渋谷区': '渋谷区', '中野区': '中野区', '杉並区': '杉並区', '豊島区': '豊島区',
  '北区': '北区', '荒川区': '荒川区', '板橋区': '板橋区', '練馬区': '練馬区',
  '足立区': '足立区', '葛飾区': '葛飾区', '江戸川区': '江戸川区',
  
  // 市部
  '八王子市': '八王子市', '立川市': '立川市', '武蔵野市': '武蔵野市', '三鷹市': '三鷹市',
  '青梅市': '青梅市', '府中市': '府中市', '昭島市': '昭島市', '調布市': '調布市',
  '町田市': '町田市', '小金井市': '小金井市', '小平市': '小平市', '日野市': '日野市',
  '東村山市': '東村山市', '国分寺市': '国分寺市', '国立市': '国立市', '福生市': '福生市',
  '狛江市': '狛江市', '東大和市': '東大和市', '清瀬市': '清瀬市', '東久留米市': '東久留米市',
  '武蔵村山市': '武蔵村山市', '多摩市': '多摩市', '稲城市': '稲城市', '羽村市': '羽村市',
  'あきる野市': 'あきる野市', '西東京市': '西東京市',
  
  // 西多摩郡
  '瑞穂町': '瑞穂町', '日の出町': '日の出町', '檜原村': '檜原村', '奥多摩町': '奥多摩町',
  
  // 島しょ部
  '大島町': '大島町', '利島村': '利島村', '新島村': '新島村', '神津島村': '神津島村',
  '三宅村': '三宅村', '御蔵島村': '御蔵島村', '八丈町': '八丈町', '青ヶ島村': '青ヶ島村',
  '小笠原村': '小笠原村'
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

// エラー統計を管理するクラス
class ImportStats {
  constructor() {
    this.csvProcessed = 0;
    this.csvErrors = 0;
    this.facilitiesInserted = 0;
    this.facilitiesFailed = 0;
    this.servicesInserted = 0;
    this.servicesFailed = 0;
    this.retryCount = 0;
    this.startTime = new Date();
  }

  logProgress() {
    const elapsed = Math.floor((new Date() - this.startTime) / 1000);
    console.log(`\n=== 進捗レポート (${elapsed}秒経過) ===`);
    console.log(`CSV処理: ${this.csvProcessed}件 (エラー: ${this.csvErrors}件)`);
    console.log(`事業所挿入: ${this.facilitiesInserted}件 (失敗: ${this.facilitiesFailed}件)`);
    console.log(`サービス挿入: ${this.servicesInserted}件 (失敗: ${this.servicesFailed}件)`);
    console.log(`リトライ実行回数: ${this.retryCount}回`);
  }

  logFinal() {
    const elapsed = Math.floor((new Date() - this.startTime) / 1000);
    console.log(`\n=== 最終結果 (総時間: ${elapsed}秒) ===`);
    console.log(`✅ 事業所挿入成功: ${this.facilitiesInserted}件`);
    console.log(`✅ サービス挿入成功: ${this.servicesInserted}件`);
    if (this.facilitiesFailed > 0 || this.servicesFailed > 0) {
      console.log(`❌ 事業所挿入失敗: ${this.facilitiesFailed}件`);
      console.log(`❌ サービス挿入失敗: ${this.servicesFailed}件`);
    }
  }
}

// リトライ機能付きのデータベース操作
async function executeWithRetry(operation, description, stats) {
  let lastError;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.log(`⏳ ${description} - リトライ ${attempt}/${RETRY_CONFIG.maxRetries} (${delay}ms待機)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        stats.retryCount++;
      }
      
      const result = await operation();
      
      if (attempt > 0) {
        console.log(`✅ ${description} - リトライ成功`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ ${description} - 試行 ${attempt + 1} 失敗:`, error.message);
      
      // 致命的エラーの場合は即座に中断
      if (isFatalError(error)) {
        console.error(`🚨 致命的エラーのため処理を中断します`);
        throw error;
      }
    }
  }
  
  console.error(`❌ ${description} - 全てのリトライが失敗しました`);
  throw lastError;
}

// 致命的エラーかどうかを判定
function isFatalError(error) {
  // 認証エラーや設定エラーなど、リトライしても解決しない問題
  const fatalMessages = [
    'Invalid API key',
    'Authentication failed',
    'Permission denied',
    'Database connection failed',
    'Invalid database URL'
  ];
  
  return fatalMessages.some(msg => error.message.includes(msg));
}

// データベーストランザクション管理
async function withTransaction(operations) {
  // Supabaseはトランザクションを直接サポートしていないため、
  // エラー発生時にロールバック処理を実行
  const rollbackOperations = [];
  
  try {
    const results = [];
    for (const operation of operations) {
      const result = await operation.execute();
      results.push(result);
      if (operation.rollback) {
        rollbackOperations.push(operation.rollback);
      }
    }
    return results;
  } catch (error) {
    console.log('⏪ エラーが発生したためロールバックを実行します...');
    for (const rollback of rollbackOperations.reverse()) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('ロールバック失敗:', rollbackError);
      }
    }
    throw error;
  }
}

// 地区を抽出する関数（改良版）
function extractDistrict(address) {
  if (!address) return null;
  
  // 完全一致を優先してチェック
  for (const district of Object.keys(TOKYO_DISTRICTS)) {
    if (address.includes(district)) {
      return district;
    }
  }
  
  // 「東京都」を含む住所の場合、東京都を除いた部分から地区を抽出
  if (address.includes('東京都')) {
    const addressWithoutTokyo = address.replace('東京都', '');
    for (const district of Object.keys(TOKYO_DISTRICTS)) {
      if (addressWithoutTokyo.includes(district)) {
        return district;
      }
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
  const stats = new ImportStats();
  console.log('WAMNETデータのインポートを開始します...');
  
  const facilities = [];
  const facilityServices = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('wamnet.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          // 東京都のデータのみ処理（全市区町村対応）
          const district = extractDistrict(row['事業所住所（市区町村）']);
          if (!district) {
            return; // 東京都以外はスキップ
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
          stats.csvProcessed++;

          if (stats.csvProcessed % 1000 === 0) {
            console.log(`処理済み: ${stats.csvProcessed} 件`);
          }

        } catch (error) {
          console.error('CSV行処理エラー:', error);
          stats.csvErrors++;
        }
      })
      .on('end', async () => {
        console.log(`\nCSV読み込み完了`);
        console.log(`処理済み: ${stats.csvProcessed} 件`);
        console.log(`東京23区内の事業所: ${facilities.length} 件`);
        console.log(`エラー: ${stats.csvErrors} 件`);

        try {
          await insertFacilitiesToDB(facilities, facilityServices, stats);
          stats.logFinal();
          resolve();
        } catch (error) {
          stats.logFinal();
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('CSV読み込みエラー:', error);
        stats.csvErrors++;
        reject(error);
      });
  });
}

async function insertFacilitiesToDB(facilities, facilityServices, stats) {
  console.log('\nデータベースへの挿入を開始...');

  try {
    // トランザクション的な処理のために、清掃とデータ挿入を分離
    await withTransaction([
      {
        execute: async () => {
          // 既存の施設データを削除（開発環境での再インポート用）
          if (process.env.NODE_ENV === 'development') {
            console.log('既存データを削除中...');
            await executeWithRetry(
              () => supabase.from('facility_services').delete().neq('id', 0),
              'facility_services削除',
              stats
            );
            await executeWithRetry(
              () => supabase.from('facilities').delete().neq('id', 0),
              'facilities削除',
              stats
            );
          }
        }
      }
    ]);

    // 事業所データを挿入（バッチ処理）
    const batchSize = 50;
    const facilitiesInserted = [];
    const failedFacilities = [];

    for (let i = 0; i < facilities.length; i += batchSize) {
      const batch = facilities.slice(i, i + batchSize);
      
      try {
        const result = await executeWithRetry(
          async () => {
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
            return data;
          },
          `事業所バッチ挿入 (${i + 1}-${Math.min(i + batchSize, facilities.length)})`,
          stats
        );

        // 挿入された事業所のIDをマッピング
        result.forEach((facility, index) => {
          const originalFacility = batch[index];
          const facilityKey = `${originalFacility.name}_${originalFacility.district}_${originalFacility.external_id}`;
          facilitiesInserted.push({
            id: facility.id,
            key: facilityKey
          });
        });

        stats.facilitiesInserted += result.length;
        console.log(`✅ 事業所挿入進捗: ${stats.facilitiesInserted}/${facilities.length}`);

      } catch (error) {
        console.error(`❌ バッチ挿入失敗 (${i + 1}-${Math.min(i + batchSize, facilities.length)}):`, error.message);
        stats.facilitiesFailed += batch.length;
        failedFacilities.push(...batch.map((f, idx) => ({ ...f, batchIndex: i + idx })));
        
        // 致命的エラーの場合は処理を中断
        if (isFatalError(error)) {
          throw error;
        }
      }

      // 進捗レポート（10バッチごと）
      if ((i / batchSize) % 10 === 0) {
        stats.logProgress();
      }
    }

    // 失敗した事業所がある場合は詳細をログ出力
    if (failedFacilities.length > 0) {
      console.log(`\n⚠️  挿入に失敗した事業所: ${failedFacilities.length}件`);
      failedFacilities.slice(0, 5).forEach(f => {
        console.log(`  - ${f.name} (${f.district})`);
      });
      if (failedFacilities.length > 5) {
        console.log(`  ... その他 ${failedFacilities.length - 5}件`);
      }
    }

    // サービスデータを挿入
    console.log('\nサービスデータを挿入中...');
    const servicesToInsert = [];
    const failedServices = [];

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
      
      try {
        await executeWithRetry(
          async () => {
            const { error } = await supabase
              .from('facility_services')
              .insert(batch);

            if (error) {
              throw error;
            }
          },
          `サービスバッチ挿入 (${i + 1}-${Math.min(i + batchSize, servicesToInsert.length)})`,
          stats
        );

        stats.servicesInserted += batch.length;
        console.log(`✅ サービス挿入進捗: ${stats.servicesInserted}/${servicesToInsert.length}`);

      } catch (error) {
        console.error(`❌ サービスバッチ挿入失敗 (${i + 1}-${Math.min(i + batchSize, servicesToInsert.length)}):`, error.message);
        stats.servicesFailed += batch.length;
        failedServices.push(...batch);
        
        // 致命的エラーの場合は処理を中断
        if (isFatalError(error)) {
          throw error;
        }
      }

      // 進捗レポート（10バッチごと）
      if ((i / batchSize) % 10 === 0) {
        stats.logProgress();
      }
    }

    // 最終チェック
    const finalFacilityCount = await supabase
      .from('facilities')
      .select('id', { count: 'exact', head: true });
    
    const finalServiceCount = await supabase
      .from('facility_services')
      .select('id', { count: 'exact', head: true });

    console.log('\n✅ データインポート完了!');
    console.log(`DB内事業所数: ${finalFacilityCount.count} 件`);
    console.log(`DB内サービス数: ${finalServiceCount.count} 件`);

  } catch (error) {
    console.error('🚨 データベース挿入で致命的エラーが発生しました:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  importWAMNETData()
    .then(() => {
      console.log('🎉 インポート処理が完了しました。');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 インポート処理でエラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { importWAMNETData };