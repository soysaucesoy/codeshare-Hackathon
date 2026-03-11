// pages/api/generate-service-plan.ts
import type { NextApiRequest, NextApiResponse } from 'next'

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
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

    // テキストとして整形して1つの文字列にする
    const lines: string[] = []
    lines.push(`■ 計画作成日\n${planJson['計画作成日']}`)
    lines.push(`■ 利用者が希望する生活\n${planJson['利用者が希望する生活']}`)
    lines.push(`■ 家族が希望する生活\n${planJson['家族が希望する生活']}`)
    lines.push(`■ 総合的な援助の方針\n${planJson['総合的な援助の方針']}`)
    lines.push(`■ 長期目標\n${planJson['長期目標']}`)
    lines.push(`■ 短期目標\n${planJson['短期目標']}`)

    const needRows: Array<Record<string, string>> = planJson['ニーズ行'] ?? []
    if (needRows.length > 0) {
      lines.push(`■ ニーズと支援目標`)
      needRows.slice(0, 6).forEach((row, i) => {
        lines.push(
          `【${i + 1}行目】\n` +
          `　優先順位：${row['優先順位'] ?? ''}\n` +
          `　本人のニーズ：${row['本人のニーズ'] ?? ''}\n` +
          `　支援目標：${row['支援目標'] ?? ''}\n` +
          `　達成時期：${row['達成時期'] ?? ''}\n` +
          `　福祉サービス内容：${row['福祉サービス内容'] ?? ''}\n` +
          `　本人の役割：${row['本人の役割'] ?? ''}\n` +
          `　評価時期：${row['評価時期'] ?? ''}\n` +
          `　その他留意事項：${row['その他留意事項'] ?? ''}`
        )
      })
    }

    const planText = lines.join('\n\n')

    return res.status(200).json({ planText })
  } catch (error) {
    console.error('generate-service-plan error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : '不明なエラー' })
  }
}
