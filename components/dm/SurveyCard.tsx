// components/dm/SurveyCard.tsx - DMスレッド内のアンケート表示（Q&A積み重ね形式）
import React, { useEffect, useState } from 'react'
import { ClipboardList, CheckCircle2, Loader2 } from 'lucide-react'
import { useSurveys } from '@/lib/hooks/useSurveys'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { SurveyResponse, SurveyQuestion } from '@/types/survey'

interface SurveyCardProps {
  surveyResponseId: string
}

const SurveyCard: React.FC<SurveyCardProps> = ({ surveyResponseId }) => {
  const { user } = useAuthContext()
  const { fetchSurveyResponse, submitSurveyAnswers } = useSurveys()
  const [surveyResponse, setSurveyResponse] = useState<SurveyResponse | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  // 回答フォームの状態: { [question_id]: string | string[] }
  const [formAnswers, setFormAnswers] = useState<Record<string, string | string[]>>({})

  useEffect(() => {
    const load = async () => {
      setLoadingData(true)
      const data = await fetchSurveyResponse(surveyResponseId)
      setSurveyResponse(data)
      setLoadingData(false)
    }
    load()
  }, [surveyResponseId, fetchSurveyResponse])

  const handleTextChange = (questionId: string, value: string) => {
    setFormAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleRadioChange = (questionId: string, value: string) => {
    setFormAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleCheckboxChange = (questionId: string, value: string, checked: boolean) => {
    setFormAnswers(prev => {
      const current = (prev[questionId] as string[]) || []
      return {
        ...prev,
        [questionId]: checked ? [...current, value] : current.filter(v => v !== value)
      }
    })
  }

  const getAnswer = (question: SurveyQuestion) => {
    if (!surveyResponse?.answers) return null
    return surveyResponse.answers.find(a => a.question_id === question.id)
  }

  const handleSubmit = async () => {
    if (!surveyResponse?.survey?.questions) return

    // 必須チェック
    for (const q of surveyResponse.survey.questions) {
      if (!q.required) continue
      const ans = formAnswers[q.id]
      if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
        alert(`「${q.question_text}」は必須です`)
        return
      }
    }

    try {
      setSubmitting(true)
      const answersToSubmit = surveyResponse.survey.questions.map(q => ({
        question_id: q.id,
        answer_text: q.question_type !== 'checkbox' ? (formAnswers[q.id] as string) || '' : undefined,
        answer_json: q.question_type === 'checkbox' ? (formAnswers[q.id] as string[]) || [] : undefined
      }))

      await submitSurveyAnswers(surveyResponseId, answersToSubmit)

      // 再取得して表示更新
      const updated = await fetchSurveyResponse(surveyResponseId)
      setSurveyResponse(updated)
    } catch {
      alert('回答の送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: '#6b7280' }}>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem' }}>アンケートを読み込み中...</span>
      </div>
    )
  }

  if (!surveyResponse?.survey) {
    return (
      <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
        アンケートデータを取得できませんでした
      </div>
    )
  }

  const survey = surveyResponse.survey
  const isCompleted = surveyResponse.status === 'completed'
  // 送信者が自分の場合（事業者）は回答フォームを表示しない
  const isSentByMe = surveyResponse.sent_by === user?.id

  return (
    <div style={{
      border: `2px solid ${isCompleted ? '#bbf7d0' : '#d1d5db'}`,
      borderRadius: '0.875rem',
      overflow: 'hidden',
      maxWidth: '480px',
      width: '100%'
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.875rem 1rem',
        background: isCompleted ? '#f0fdf4' : '#f9fafb',
        borderBottom: `1px solid ${isCompleted ? '#bbf7d0' : '#e5e7eb'}`
      }}>
        {isCompleted
          ? <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          : <ClipboardList size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
        }
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>
            {survey.title}
          </p>
          {survey.description && (
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
              {survey.description}
            </p>
          )}
        </div>
        <span style={{
          fontSize: '0.75rem', fontWeight: 500, padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
          background: isCompleted ? '#dcfce7' : '#fef3c7',
          color: isCompleted ? '#166534' : '#92400e'
        }}>
          {isCompleted ? '回答済み' : '未回答'}
        </span>
      </div>

      {/* 質問＆回答 */}
      <div style={{ padding: '1rem', background: 'white' }}>
        {(survey.questions || []).map((q, index) => {
          const existingAnswer = getAnswer(q)

          return (
            <div key={q.id} style={{ marginBottom: index < (survey.questions?.length || 0) - 1 ? '1.25rem' : 0 }}>
              {/* 質問テキスト */}
              <p style={{
                margin: '0 0 0.5rem',
                fontSize: '0.875rem', fontWeight: 600, color: '#374151'
              }}>
                Q{index + 1}. {q.question_text}
                {q.required && !isCompleted && (
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                )}
              </p>

              {/* 回答フィールド / 回答済み表示 */}
              {isCompleted ? (
                // 回答済み：読み取り専用表示
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: '#f9fafb', borderRadius: '0.375rem',
                  fontSize: '0.875rem', color: '#374151',
                  border: '1px solid #e5e7eb'
                }}>
                  {q.question_type === 'checkbox'
                    ? (existingAnswer?.answer_json || []).join('、') || '（未回答）'
                    : existingAnswer?.answer_text || '（未回答）'
                  }
                </div>
              ) : isSentByMe ? (
                // 自分が送信した（事業者）：回答待ち表示
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: '#f9fafb', borderRadius: '0.375rem',
                  fontSize: '0.8125rem', color: '#9ca3af',
                  border: '1px dashed #e5e7eb', fontStyle: 'italic'
                }}>
                  回答待ち...
                </div>
              ) : (
                // 回答者（利用者）：入力フィールド
                <>
                  {q.question_type === 'text' && (
                    <textarea
                      value={(formAnswers[q.id] as string) || ''}
                      onChange={e => handleTextChange(q.id, e.target.value)}
                      placeholder="回答を入力してください"
                      rows={2}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db', borderRadius: '0.375rem',
                        fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                      }}
                    />
                  )}
                  {q.question_type === 'radio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {(q.options || []).map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={(formAnswers[q.id] as string) === opt}
                            onChange={() => handleRadioChange(q.id, opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'checkbox' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {(q.options || []).map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            value={opt}
                            checked={((formAnswers[q.id] as string[]) || []).includes(opt)}
                            onChange={e => handleCheckboxChange(q.id, opt, e.target.checked)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 送信ボタン（未回答かつ自分が送信者でない場合のみ） */}
      {!isCompleted && !isSentByMe && (
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '0.75rem',
              background: submitting ? '#d1d5db' : '#22c55e',
              color: 'white', border: 'none', borderRadius: '0.5rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem', fontWeight: 600
            }}>
            {submitting ? '送信中...' : '回答を送信する'}
          </button>
        </div>
      )}

      {/* 回答済みフッター */}
      {isCompleted && surveyResponse.completed_at && (
        <div style={{ padding: '0.625rem 1rem', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#16a34a', textAlign: 'center' }}>
            {new Date(surveyResponse.completed_at).toLocaleString('ja-JP', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })} に回答済み
          </p>
        </div>
      )}
    </div>
  )
}

export default SurveyCard
