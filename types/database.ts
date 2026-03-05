// types/database.ts - データベース型定義

// 基本的な列挙型
export type UserType = 'facility' | 'user'

export type TokyoDistrict = 
  // 23区
  '千代田区' | '中央区' | '港区' | '新宿区' | '文京区' | '台東区' | '墨田区' | 
  '江東区' | '品川区' | '目黒区' | '大田区' | '世田谷区' | '渋谷区' | '中野区' | 
  '杉並区' | '豊島区' | '北区' | '荒川区' | '板橋区' | '練馬区' | '足立区' | 
  '葛飾区' | '江戸川区' |
  // 市部
  '八王子市' | '立川市' | '武蔵野市' | '三鷹市' | '青梅市' | '府中市' | '昭島市' | 
  '調布市' | '町田市' | '小金井市' | '小平市' | '日野市' | '東村山市' | '国分寺市' | 
  '国立市' | '福生市' | '狛江市' | '東大和市' | '清瀬市' | '東久留米市' | '武蔵村山市' | 
  '多摩市' | '稲城市' | '羽村市' | 'あきる野市' | '西東京市' |
  // 西多摩郡
  '瑞穂町' | '日の出町' | '檜原村' | '奥多摩町' |
  // 島しょ部
  '大島町' | '利島村' | '新島村' | '神津島村' | '三宅村' | '御蔵島村' | 
  '八丈町' | '青ヶ島村' | '小笠原村'

export type DisabilityType = '身体障害' | '知的障害' | '精神障害' | '発達障害' | '難病等' | 'その他'

export type ServiceCategory = 
  '訪問系サービス' | 
  '日中活動系サービス' | 
  '施設系サービス' | 
  '居住系サービス' | 
  '訓練系・就労系サービス' | 
  '障害児通所系サービス' | 
  '障害児入所系サービス' | 
  '相談系サービス'

export type AvailabilityStatus = 'available' | 'unavailable'

export const T_DISTRICTS: TokyoDistrict[] = [
  '千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区',
  '品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区','豊島区',
  '北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区',
  '八王子市','立川市','武蔵野市','三鷹市','青梅市','府中市','昭島市',
  '調布市','町田市','小金井市','小平市','日野市','東村山市','国分寺市',
  '国立市','福生市','狛江市','東大和市','清瀬市','東久留米市','武蔵村山市',
  '多摩市','稲城市','羽村市','あきる野市','西東京市',
  '瑞穂町','日の出町','檜原村','奥多摩町',
  '大島町','利島村','新島村','神津島村','三宅村','御蔵島村',
  '八丈町','青ヶ島村','小笠原村'
]

// ===== サービスマスタデータ =====
// 障害福祉サービスの各サービス項目
export interface ServiceItem {
  id: number
  name: string
  description: string
}

// サービスカテゴリごとのマスタデータ
export const SERVICE_CATEGORIES: Record<ServiceCategory, ServiceItem[]> = {
  '訪問系サービス': [
    { id: 1, name: '居宅介護', description: '自宅で入浴、排せつ、食事の介護などを行います' },
    { id: 2, name: '重度訪問介護', description: '重度の肢体不自由者または重度の知的障害もしくは精神障害により行動上著しい困難を有する方に、自宅で入浴、排せつ、食事の介護、外出時における移動支援などを総合的に行います' },
    { id: 3, name: '同行援護', description: '視覚障害により、移動に著しい困難を有する方に、移動時及びそれに伴う外出先において必要な視覚的情報の提供（代筆・代読を含む）、移動の援護等の便宜を供与します' },
    { id: 4, name: '行動援護', description: '自己判断能力が制限されている方が行動する際に、危険を回避するために必要な支援、外出支援を行います' },
    { id: 5, name: '重度障害者等包括支援', description: '介護の必要性がとても高い方に、居宅介護等複数のサービスを包括的に行います' },
  ],
  '日中活動系サービス': [
    { id: 6, name: '療養介護', description: '医療と常時介護を必要とする方に、医療機関で機能訓練、療養上の管理、看護、介護及び日常生活の世話を行います' },
    { id: 7, name: '生活介護', description: '常に介護を必要とする方に、昼間、入浴、排せつ、食事の介護等を行うとともに、創作的活動又は生産活動の機会を提供します' },
    { id: 8, name: '短期入所', description: '自宅で介護する方が病気の場合などに、短期間、夜間も含め施設で入浴、排せつ、食事の介護等を行います' },
  ],
  '居住系サービス': [
    { id: 10, name: '共同生活援助', description: '夜間や休日、共同生活を行う住居で、相談や日常生活上の援助を行います' },
    { id: 11, name: '自立生活援助', description: '一人暮らしに必要な理解力・生活力等を補うため、定期的な居宅訪問や随時の対応により日常生活における課題を把握し、必要な支援を行います' },
  ],
  '施設系サービス': [
    { id: 9, name: '施設入所支援', description: '施設に入所する方に、夜間や休日、入浴、排せつ、食事の介護等を行います' },
  ],
  '訓練系・就労系サービス': [
    { id: 12, name: '自立訓練(機能訓練)', description: '自立した日常生活又は社会生活ができるよう、一定期間、身体機能又は生活能力の向上のために必要な訓練を行います' },
    { id: 13, name: '自立訓練(生活訓練)', description: '自立した日常生活又は社会生活ができるよう、一定期間、生活能力の向上のために必要な訓練を行います' },
    { id: 14, name: '宿泊型自立訓練', description: '夜間も含め施設において、機能訓練、生活訓練等を実施するとともに、地域移行に向けた関係機関との連絡調整等を行います' },
    { id: 15, name: '就労移行支援', description: '一般企業等への就労を希望する方に、一定期間、就労に必要な知識及び能力の向上のために必要な訓練を行います' },
    { id: 16, name: '就労継続支援Ａ型', description: '一般企業等での就労が困難な方に、雇用契約を結び、生産活動その他の活動の機会を提供するとともに、その他の就労に必要な知識及び能力の向上のために必要な訓練を行います' },
    { id: 17, name: '就労継続支援Ｂ型', description: '一般企業等での就労が困難な方に、雇用契約を結ばず、生産活動その他の活動の機会を提供するとともに、その他の就労に必要な知識及び能力の向上のために必要な訓練を行います' },
    { id: 18, name: '就労定着支援', description: '生活介護、自立訓練、就労移行支援又は就労継続支援を利用して、通常の事業所に新たに雇用された方の就労の継続を図るため、企業、障害福祉サービス事業者、医療機関等との連絡調整を行うとともに、雇用に伴い生じる日常生活又は社会生活を営む上での各般の問題に関する相談、指導及び助言等の必要な支援を行います' },
  ],
  '障害児通所系サービス': [
    { id: 19, name: '児童発達支援', description: '未就学の障害のある子どもが主に通い、支援を受けるための施設です。日常生活の自立支援や機能訓練を行ったり、保育園や幼稚園のように遊びや学びの場を提供したりします' },
    { id: 20, name: '医療型児童発達支援', description: '未就学の障害のある子どもが主に通い、児童発達支援及び治療を行います' },
    { id: 21, name: '放課後等デイサービス', description: '就学中の障害のある子どもが、放課後や夏休み等の長期休暇中において、生活能力向上のための訓練等を継続的に提供することにより、学校教育と相まって障害のある子どもの自立を促進するとともに、放課後等の居場所づくりを行います' },
    { id: 22, name: '居宅訪問型児童発達支援', description: '重度の障害等の状態にある障害児であって、児童発達支援等の通所支援を利用するために外出することが著しく困難な障害児に発達支援を提供します' },
    { id: 23, name: '保育所等訪問支援', description: '障害児以外の児童との集団生活への適応のための専門的な支援その他の便宜を供与します' },
  ],
  '障害児入所系サービス': [
    { id: 24, name: '福祉型障害児入所施設', description: '障害のある子どもを入所させて、保護、日常生活の指導及び知識技能の付与を行います' },
    { id: 25, name: '医療型障害児入所施設', description: '障害のある子どもを入所させて、保護、日常生活の指導及び知識技能の付与並びに治療を行います' },
  ],
  '相談系サービス': [
    { id: 26, name: '地域相談支援(地域移行)', description: '障害者支援施設等に入所している障害者又は精神科病院に入院している精神障害者等に対し、住居の確保その他の地域における生活に移行するための活動に関する相談その他の便宜を供与します' },
    { id: 27, name: '地域相談支援(地域定着)', description: '居宅において単身等で生活する障害者に対し、常時の連絡体制を確保し、障害の特性に起因して生じた緊急の事態等に相談その他の便宜を供与します' },
    { id: 28, name: '計画相談支援', description: '障害福祉サービス等の利用計画の作成やモニタリング等を行います' },
    { id: 29, name: '障害児相談支援', description: '障害児通所支援等の利用計画の作成やモニタリング等を行います' },
  ],
}

// プロフィール関連の型
export interface Profile {
  id: string
  user_type: UserType
  email: string
  full_name?: string
  phone_number?: string
  district?: TokyoDistrict
  created_at: string
  updated_at: string
}

// 利用者プロフィール
export interface UserProfile {
  id: number
  profile_id: string
  age?: number
  gender?: string
  disability_types?: DisabilityType[]
  disability_grade?: string
  guardian_name?: string
  guardian_phone?: string
  emergency_contact?: string
  medical_info?: string
  transportation_needs?: string
  other_requirements?: string
  receive_notifications: boolean
  created_at: string
  updated_at: string
}

// 事業所
export interface Facility {
  id: number
  profile_id?: string
  name: string
  description?: string
  appeal_points?: string
  address: string
  district: TokyoDistrict
  latitude?: number
  longitude?: number
  phone_number?: string
  website_url?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  services?: Service[]
}

// サービス定義
export interface ServiceDefinition {
  id: number
  category: ServiceCategory
  name: string
  description?: string
  created_at: string
}

// 事業所サービス
export interface FacilityService {
  id: number
  facility_id: number
  service_id: number
  availability: AvailabilityStatus
  capacity?: number
  current_users: number
  updated_at: string
  service?: ServiceDefinition
}

// index.tsxで使用されているService型（FacilityServiceのエイリアス）
export type Service = FacilityService

// 利用者希望サービス
export interface UserDesiredService {
  id: number
  user_id: number
  service_id: number
  priority: number
  created_at: string
}

// ブックマーク
export interface Bookmark {
  id: number
  user_id: number
  facility_id: number
  created_at: string
}

// メッセージ
export interface Message {
  id: number
  conversation_id: string
  sender_id: string
  recipient_id: string
  receiver_id?: string  // useMessagesとの互換性のため
  facility_id?: number
  user_id?: number
  content: string
  is_read: boolean
  message_type?: 'text' | 'survey'
  survey_response_id?: string
  created_at: string
  updated_at?: string
}

// 通知設定
export interface NotificationSetting {
  id: number
  user_id: number
  district?: TokyoDistrict
  service_id?: number
  email: string
  is_active: boolean
  created_at: string
}

// 活動ログ
export interface ActivityLog {
  id: number
  user_id: string
  action: string
  resource_type?: string
  resource_id?: number
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// 検索レスポンス（index.tsxで使用）
export interface SearchResponse {
  facilities: Facility[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 認証関連の型
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    user_type?: UserType
    full_name?: string
    [key: string]: any
  }
}

// フォームデータの型
export interface UserRegistrationData {
  user_type: 'user'
  full_name: string
  phone_number?: string | null   // ← null を許可
  district?: TokyoDistrict | null
  user_details: {
    age?: number | null
    gender?: string | null
    disability_types?: DisabilityType[]
    disability_grade?: string | null
    guardian_name?: string | null
    guardian_phone?: string | null
    emergency_contact?: string | null
    medical_info?: string | null
    transportation_needs?: string | null
    other_requirements?: string | null
    receive_notifications: boolean
  }
}

export interface FacilityRegistrationData {
  user_type: 'facility'
  full_name: string
  phone_number?: string | null   // ← null を許可
  district?: TokyoDistrict | null
  facility_details: {
    name: string
    description?: string | null
    appeal_points?: string | null
    address: string
    district: TokyoDistrict
    phone_number?: string | null
    website_url?: string | null
  }
}

export type RegistrationData = UserRegistrationData | FacilityRegistrationData

// API エラーレスポンス
export interface ApiError {
  error: string
  message?: string
  details?: any
}

// 検索フィルター
export interface SearchFilters {
  query?: string
  district?: string
  serviceIds?: number[]
  availabilityOnly?: boolean
  page?: number
  limit?: number
}