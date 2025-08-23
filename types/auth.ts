// types/auth.ts

export interface UserRegistrationData {
  user_type: 'user'
  full_name: string
  phone_number?: string | null
  district?: string | null
  user_details?: {
    age?: number | null
    gender?: string | null
    disability_types?: string[]
    disability_grade?: string | null
    guardian_name?: string | null
    guardian_phone?: string | null
    emergency_contact?: string | null
    medical_info?: string | null
    transportation_needs?: string | null
    other_requirements?: string | null
    receive_notifications?: boolean
  }
}

export interface FacilityRegistrationData {
  user_type: 'facility'
  full_name: string
  phone_number?: string | null
  district?: string | null
  // 施設用の追加フィールドをここに定義
}

export type RegistrationData = UserRegistrationData | FacilityRegistrationData
