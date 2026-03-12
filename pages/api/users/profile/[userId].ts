// pages/api/users/profile/[userId].ts
// サービスロールキーを使って利用者プロフィールを取得するAPIルート
// （RLSを迂回し、事業者など他ユーザーからでも閲覧可能にする）
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' })
  }

  try {
    // 基本情報
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('full_name, email, phone_number, district')
      .eq('id', userId)
      .single()

    if (userError || !userRow) {
      return res.status(404).json({ error: 'User not found' })
    }

    // 詳細情報
    const { data: detailRow } = await supabaseAdmin
      .from('user_details')
      .select('age, gender, disability_types, disability_grade, guardian_name, guardian_phone, emergency_contact, medical_info, transportation_needs, other_requirements')
      .eq('user_id', userId)
      .maybeSingle()

    // アセスメント
    const { data: assessRow } = await supabaseAdmin
      .from('user_assessments')
      .select('life_history, medical_history, medical_usage, welfare_equipment, daily_life_self, daily_life_guardian, desired_life, family_requests, support_status, assessment_other')
      .eq('user_id', userId)
      .maybeSingle()

    // サービス等利用計画
    const { data: planRow } = await supabaseAdmin
      .from('user_service_plans')
      .select('plan_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return res.status(200).json({
      basicInfo: userRow,
      userDetails: detailRow ?? null,
      assessment: assessRow ?? null,
      servicePlan: planRow ?? null,
    })
  } catch (err) {
    console.error('プロフィール取得エラー:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
