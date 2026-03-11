// pages/api/service-plans/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: '未認証' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: '未認証' })
  }

  const { data, error } = await supabase
    .from('user_service_plans')
    .select('plan_text, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // plan_text（JSON文字列）をパースして返す
  const plans = (data ?? []).map((row) => {
    try {
      return { plan: JSON.parse(row.plan_text), created_at: row.created_at, updated_at: row.updated_at }
    } catch {
      return null
    }
  }).filter(Boolean)

  return res.status(200).json({ plans })
}
