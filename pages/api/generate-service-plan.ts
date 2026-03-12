// pages/api/generate-service-plan.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface AssessmentInput {
  life_history: string
  medical_history: string
  medical_usage: string
  welfare_equipment: string
  daily_life_self: string
  daily_life_guardian: string
  desired_life: string
  family_requests: string
  support_status: string
  assessment_other: string
  user_name?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY が設定されていません' })
  }

  // ユーザー認証チェック
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const token = req.headers.authorization?.replace('Bearer ', '')
  let userId: string | null = null
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    userId = user?.id ?? null
  }

  const assessment: AssessmentInput = req.body

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const prompt = `
あなたは障害福祉の相談支援専門員です。以下のアセスメント情報をもとに、サービス等利用計画書を作成してください。

【アセスメント情報】
・生活歴: ${assessment.life_history}
・病歴・障がい歴: ${assessment.medical_history}
・医療機関利用状況: ${assessment.medical_usage}
・現在使用している福祉用具: ${assessment.welfare_equipment}
・本人の生活状況（一日の流れ）: ${assessment.daily_life_self}
・保護者の生活状況（一日の流れ）: ${assessment.daily_life_guardian}
・本人の希望する暮らし: ${assessment.desired_life}
・家族の要望: ${assessment.family_requests}
・支援の状況: ${assessment.support_status}
・その他: ${assessment.assessment_other}

【出力形式】
以下のJSON形式で出力してください。各テキスト項目は日本語で50字程度にまとめてください。
ニーズ行は最大6行まで生成し、必要な行数だけ含めてください（最低1行）。

{
  "計画作成日": "${today}",
  "利用者が希望する生活": "（50字程度）",
  "家族が希望する生活": "（50字程度）",
  "総合的な援助の方針": "（50字程度）",
  "長期目標": "（50字程度）",
  "短期目標": "（50字程度）",
  "ニーズ行": [
    {
      "優先順位": "1",
      "本人のニーズ": "（50字程度）",
      "支援目標": "（50字程度）",
      "達成時期": "（例：6ヶ月後）",
      "福祉サービス内容": "（50字程度）",
      "本人の役割": "（50字程度）",
      "評価時期": "（例：3ヶ月後）",
      "その他留意事項": "（50字程度）"
    }
  ]
}

JSONのみを返してください。説明文や\`\`\`は不要です。`

  // 指数バックオフ付きリトライ（429対策）
  const fetchWithRetry = async (retries = 3, delayMs = 2000): Promise<Response> => {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      }
    )
    if (r.status === 429 && retries > 0) {
      console.warn(`Gemini 429 - ${delayMs}ms 後にリトライ (残り${retries}回)`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return fetchWithRetry(retries - 1, delayMs * 2)
    }
    return r
  }

  try {
    const response = await fetchWithRetry()

    if (!response.ok) {
      const err = await response.text()
      console.error('Gemini API error:', response.status, err)
      if (response.status === 429) {
        return res.status(503).json({ error: 'AIサービスが混雑しています。少し待ってから再度お試しください。' })
      }
      return res.status(502).json({ error: `Gemini API エラー: ${response.status} - ${err}` })
    }

    const data = await response.json()
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // JSONを抽出（```json ... ``` or 裸のJSONどちらも対応）
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('JSON抽出失敗:', rawText)
      return res.status(500).json({ error: 'AIからの応答解析に失敗しました' })
    }

    const planJson = JSON.parse(jsonMatch[0])

    // DBに保存（認証済みユーザーの場合）
    let savedAt: string | null = null
    if (userId) {
      const now = new Date().toISOString()
      const planJsonStr = JSON.stringify(planJson)

      const { data: existingPlan } = await supabase
        .from('user_service_plans')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingPlan) {
        await supabase
          .from('user_service_plans')
          .update({ plan_text: planJsonStr, updated_at: now })
          .eq('user_id', userId)
      } else {
        await supabase
          .from('user_service_plans')
          .insert({ user_id: userId, plan_text: planJsonStr, created_at: now, updated_at: now })
      }
      savedAt = now
    }

    return res.status(200).json({ planJson, savedAt })
  } catch (error) {
    console.error('generate-service-plan error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : '不明なエラー' })
  }
}
