// components/surveys/SendSurveyModal.tsx - アンケート送信モーダル
import React, { useEffect, useState } from 'react'
import { X, ClipboardList, Send } from 'lucide-react'
import { useSurveys } from '@/lib/hooks/useSurveys'
import type { Survey } from '@/types/survey'

interface SendSurveyModalProps {
  facilityId: number
  conversationId: string
  onClose: () => void
  onSent: () => void
}

const SendSurveyModal: React.FC<SendSurveyModalProps> = ({
  facilityId,
  conversationId,
  onClose,
  onSent
}) => {
  const { surveys, loading, fetchSurveys, sendSurveyToConversation } = useSurveys()
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchSurveys(facilityId)
  }, [facilityId, fetchSurveys])

  const handleSend = async () => {
    if (!selectedSurveyId) return
    try {
      setSending(true)
      await sendSurveyToConversation(selectedSurveyId, conversationId)
      onSent()
      onClose()
    } catch {
      alert('アンケートの送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)'
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'white', borderRadius: '1rem', padding: '1.5rem',
        width: '100%', maxWidth: '480px', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={20} style={{ color: '#22c55e' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              アンケートを送信
            </h3>
          </div>
          <button onClick={onClose}
            style={{ padding: '0.375rem', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={20} />
          </button>
        </div>

        {/* アンケート一覧 */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>読み込み中...</p>
          ) : surveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <ClipboardList size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>送信できるアンケートがありません</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
                「アンケート管理」タブで作成してください
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {surveys.map(survey => (
                <button
                  key={survey.id}
                  onClick={() => setSelectedSurveyId(survey.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.875rem 1rem',
                    border: `2px solid ${selectedSurveyId === survey.id ? '#22c55e' : '#e5e7eb'}`,
                    borderRadius: '0.625rem',
                    background: selectedSurveyId === survey.id ? '#f0fdf4' : 'white',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>
                    {survey.title}
                  </p>
                  {survey.description && (
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                      {survey.description}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9ca3af' }}>
                    {survey.questions?.length || 0}問
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '0.75rem', background: 'white', border: '1px solid #d1d5db',
              borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500
            }}>
            キャンセル
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedSurveyId || sending}
            style={{
              flex: 1, padding: '0.75rem',
              background: !selectedSurveyId || sending ? '#d1d5db' : '#22c55e',
              color: 'white', border: 'none', borderRadius: '0.5rem',
              cursor: !selectedSurveyId || sending ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem', fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
            <Send size={16} />
            {sending ? '送信中...' : '送信する'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SendSurveyModal
