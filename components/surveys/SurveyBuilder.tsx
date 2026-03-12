// components/surveys/SurveyBuilder.tsx - アンケート作成・管理UI
import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, ClipboardList, X, Edit3 } from 'lucide-react'
import { useSurveys } from '@/lib/hooks/useSurveys'
import type { Survey, SurveyForm, SurveyQuestionForm, QuestionType } from '@/types/survey'

interface SurveyBuilderProps {
  facilityId: number
}

const emptyQuestion = (): SurveyQuestionForm => ({
  question_text: '',
  question_type: 'text',
  options: [],
  required: true,
  order_index: 0
})

const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ facilityId }) => {
  const { surveys, loading, fetchSurveys, createSurvey, updateSurvey, deleteSurvey } = useSurveys()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SurveyForm>({
    title: '',
    description: '',
    questions: [emptyQuestion()]
  })
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [editForm, setEditForm] = useState<SurveyForm>({
    title: '',
    description: '',
    questions: [emptyQuestion()]
  })

  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    const init = async () => {
      await fetchSurveys(facilityId)
      setHasFetched(true)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId])

  // デフォルトアンケートの定義
  const DEFAULT_SURVEYS: SurveyForm[] = [
    {
      title: '生活習慣アンケート',
      description: '',
      questions: [
        '洗面', '衣服の着脱', '食事', '排泄', '移動', '入浴'
      ].map((text, i) => ({
        question_text: text,
        question_type: 'checkbox' as const,
        options: ['全介助', '多くを介助', '一部介助', 'ほぼ自立', '自立'],
        required: true,
        order_index: i
      }))
    },
    {
      title: '問題行動アンケート',
      description: '',
      questions: [
        '突然、場にそぐわない大きな声でしゃべったり、奇声を上げることがありますか',
        '破壊行為がありますか',
        '他傷行為がありますか',
        '自傷行為がありますか',
        'パニックを起こすことがありますか',
        '施設内や近所を徘徊しますか',
        '火遊びはしますか',
        '盗癖がありますか',
        '人に対する性的トラブルがありますか',
        '性的な関心が過度にありますか',
        '黙って外出や外泊することがありますか',
        '人との関わりを拒絶しますか',
        '過食がありますか',
        '拒食がありますか',
        '著しいこだわりや固執がありますか',
        '著しい偏食がありますか',
        '異食がありますか',
        '抑制の利かない多飲水がありますか',
        '睡眠の乱れがありますか',
        '著しい多動がありますか',
        '便こねがありますか',
        '脅迫的な排泄行為を繰り返しますか'
      ].map((text, i) => ({
        question_text: text,
        question_type: 'checkbox' as const,
        options: ['日常的にする', '頻繁にする', 'ときどきする', 'たまにする', 'しない'],
        required: true,
        order_index: i
      }))
    }
  ]

  // 初回フェッチ完了後に一度だけデフォルトアンケートを作成
  const defaultsCreatedRef = useRef(false)
  useEffect(() => {
    if (!hasFetched) return
    if (defaultsCreatedRef.current) return
    defaultsCreatedRef.current = true

    const existingTitles = surveys.map(s => s.title)
    const missing = DEFAULT_SURVEYS.filter(s => !existingTitles.includes(s.title))
    if (missing.length === 0) return

    const createDefaults = async () => {
      try {
        for (const surveyForm of missing) {
          await createSurvey(facilityId, surveyForm)
        }
        await fetchSurveys(facilityId)
      } catch (err) {
        console.error('デフォルトアンケート作成エラー:', err)
      }
    }
    createDefaults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFetched])

  const handleAddQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { ...emptyQuestion(), order_index: prev.questions.length }]
    }))
  }

  const handleRemoveQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const handleQuestionChange = (index: number, field: keyof SurveyQuestionForm, value: any) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...form.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setForm(prev => ({ ...prev, questions: newQuestions }))
  }

  const handleAddOption = (qIndex: number) => {
    handleQuestionChange(qIndex, 'options', [...form.questions[qIndex].options, ''])
  }

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newOptions = [...form.questions[qIndex].options]
    newOptions[oIndex] = value
    handleQuestionChange(qIndex, 'options', newOptions)
  }

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newOptions = form.questions[qIndex].options.filter((_, i) => i !== oIndex)
    handleQuestionChange(qIndex, 'options', newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    try {
      setSaving(true)
      await createSurvey(facilityId, form)
      setForm({ title: '', description: '', questions: [emptyQuestion()] })
      setShowForm(false)
      await fetchSurveys(facilityId)
    } catch {
      alert('アンケートの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleEditStart = (survey: Survey) => {
    setEditingSurvey(survey)
    setEditForm({
      title: survey.title,
      description: survey.description || '',
      questions: (survey.questions || []).map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        required: q.required,
        order_index: q.order_index
      }))
    })
    setShowForm(false)
  }

  const handleEditCancel = () => {
    setEditingSurvey(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSurvey || !editForm.title.trim()) return

    try {
      setSaving(true)
      await updateSurvey(editingSurvey.id, editForm)
      setEditingSurvey(null)
      await fetchSurveys(facilityId)
    } catch (err: any) {
      alert(`アンケートの更新に失敗しました: ${err?.message || err}`)
    } finally {
      setSaving(false)
    }
  }

  const isSurveyLocked = (survey: Survey) => (survey.responses?.length ?? 0) > 0

  const handleEditQuestionChange = (index: number, field: keyof SurveyQuestionForm, value: any) => {
    setEditForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
    }))
  }

  const handleEditMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...editForm.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setEditForm(prev => ({ ...prev, questions: newQuestions }))
  }

  const handleEditAddOption = (qIndex: number) => {
    handleEditQuestionChange(qIndex, 'options', [...editForm.questions[qIndex].options, ''])
  }

  const handleEditOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newOptions = [...editForm.questions[qIndex].options]
    newOptions[oIndex] = value
    handleEditQuestionChange(qIndex, 'options', newOptions)
  }

  const handleEditRemoveOption = (qIndex: number, oIndex: number) => {
    const newOptions = editForm.questions[qIndex].options.filter((_, i) => i !== oIndex)
    handleEditQuestionChange(qIndex, 'options', newOptions)
  }

  const handleDelete = async (surveyId: string) => {
    if (!confirm('このアンケートを削除しますか？')) return
    try {
      await deleteSurvey(surveyId)
      await fetchSurveys(facilityId)
    } catch {
      alert('削除に失敗しました')
    }
  }

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ClipboardList size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
            アンケート管理
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.4rem 0.625rem',
            background: showForm ? '#f3f4f6' : '#22c55e',
            color: showForm ? '#374151' : 'white',
            border: 'none', borderRadius: '0.5rem',
            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
            whiteSpace: 'nowrap' as const, flexShrink: 0
          }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'キャンセル' : '新規作成'}
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem'
        }}>
          <h4 style={{ margin: '0 0 1rem', color: '#111827', fontSize: '1rem', fontWeight: 600 }}>
            新しいアンケートを作成
          </h4>

          {/* タイトル */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              タイトル <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例：事前ヒアリングアンケート"
              required
              style={{
                width: '100%', padding: '0.625rem 0.75rem',
                border: '1px solid #d1d5db', borderRadius: '0.5rem',
                fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 説明 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              説明（任意）
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="アンケートの目的や注意事項を記入してください"
              rows={2}
              style={{
                width: '100%', padding: '0.625rem 0.75rem',
                border: '1px solid #d1d5db', borderRadius: '0.5rem',
                fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 質問一覧 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
              質問項目
            </label>
            {form.questions.map((q, qIndex) => (
              <div key={qIndex} style={{
                background: 'white', border: '1px solid #e5e7eb',
                borderRadius: '0.5rem', padding: '1rem', marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
                    Q{qIndex + 1}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button type="button" onClick={() => handleMoveQuestion(qIndex, 'up')}
                      disabled={qIndex === 0}
                      style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: qIndex === 0 ? 'not-allowed' : 'pointer', opacity: qIndex === 0 ? 0.3 : 1 }}>
                      <ChevronUp size={16} />
                    </button>
                    <button type="button" onClick={() => handleMoveQuestion(qIndex, 'down')}
                      disabled={qIndex === form.questions.length - 1}
                      style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: qIndex === form.questions.length - 1 ? 'not-allowed' : 'pointer', opacity: qIndex === form.questions.length - 1 ? 0.3 : 1 }}>
                      <ChevronDown size={16} />
                    </button>
                    <button type="button" onClick={() => handleRemoveQuestion(qIndex)}
                      disabled={form.questions.length === 1}
                      style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: form.questions.length === 1 ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: form.questions.length === 1 ? 0.3 : 1 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 質問テキスト */}
                <input
                  type="text"
                  value={q.question_text}
                  onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  placeholder="質問を入力してください"
                  required
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db', borderRadius: '0.375rem',
                    fontSize: '0.875rem', marginBottom: '0.5rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />

                {/* 質問タイプ選択 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  {(['text', 'radio', 'checkbox'] as QuestionType[]).map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                      <input
                        type="radio"
                        checked={q.question_type === type}
                        onChange={() => handleQuestionChange(qIndex, 'question_type', type)}
                      />
                      {type === 'text' ? 'テキスト入力' : type === 'radio' ? '単一選択' : '複数選択'}
                    </label>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.8125rem', marginLeft: 'auto' }}>
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => handleQuestionChange(qIndex, 'required', e.target.checked)}
                    />
                    必須
                  </label>
                </div>

                {/* 選択肢（radio/checkbox の場合） */}
                {(q.question_type === 'radio' || q.question_type === 'checkbox') && (
                  <div style={{ background: '#f9fafb', borderRadius: '0.375rem', padding: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280' }}>選択肢</p>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                          placeholder={`選択肢 ${oIndex + 1}`}
                          style={{
                            flex: 1, padding: '0.375rem 0.625rem',
                            border: '1px solid #d1d5db', borderRadius: '0.375rem',
                            fontSize: '0.8125rem', outline: 'none'
                          }}
                        />
                        <button type="button" onClick={() => handleRemoveOption(qIndex, oIndex)}
                          style={{ padding: '0.375rem', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleAddOption(qIndex)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.25rem 0.5rem', background: 'white', border: '1px dashed #d1d5db',
                        borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#6b7280'
                      }}>
                      <Plus size={12} /> 選択肢を追加
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={handleAddQuestion}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', background: 'white', border: '1px dashed #22c55e',
                borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#22c55e', fontWeight: 500
              }}>
              <Plus size={16} /> 質問を追加
            </button>
          </div>

          {/* 送信ボタン */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ padding: '0.625rem 1.25rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              キャンセル
            </button>
            <button type="submit" disabled={saving || !form.title.trim()}
              style={{
                padding: '0.625rem 1.25rem',
                background: saving || !form.title.trim() ? '#d1d5db' : '#22c55e',
                color: 'white', border: 'none', borderRadius: '0.5rem',
                cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem', fontWeight: 500
              }}>
              {saving ? '保存中...' : '作成する'}
            </button>
          </div>
        </form>
      )}

      {/* アンケート一覧 */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>読み込み中...</p>
      ) : surveys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '0.75rem' }}>
          <ClipboardList size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>アンケートがありません</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>「新規作成」から作成してください</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {surveys.map(survey => (
            <div key={survey.id} style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: '0.75rem', padding: '1rem'
            }}>
              {editingSurvey?.id === survey.id ? (
                /* 編集フォーム */
                <form onSubmit={handleEditSubmit}>
                  <h4 style={{ margin: '0 0 1rem', color: '#111827', fontSize: '1rem', fontWeight: 600 }}>
                    アンケートを編集
                  </h4>

                  {/* タイトル */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                      タイトル <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      style={{
                        width: '100%', padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db', borderRadius: '0.5rem',
                        fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 説明 */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                      説明（任意）
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%', padding: '0.625rem 0.75rem',
                        border: '1px solid #d1d5db', borderRadius: '0.5rem',
                        fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 質問一覧 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                      質問項目
                    </label>

                    {/* 送信済みの場合は設問編集不可の警告 */}
                    {editingSurvey && isSurveyLocked(editingSurvey) && (
                      <div style={{
                        background: '#fefce8', border: '1px solid #fde047',
                        borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem',
                        fontSize: '0.875rem', color: '#854d0e'
                      }}>
                        このアンケートはすでに送信されています。過去の回答データを保護するため、設問の編集はできません。タイトルと説明のみ変更できます。
                      </div>
                    )}

                    {editForm.questions.map((q, qIndex) => (
                      <div key={qIndex} style={{
                        background: editingSurvey && isSurveyLocked(editingSurvey) ? '#f9fafb' : '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem', padding: '1rem', marginBottom: '0.75rem',
                        opacity: editingSurvey && isSurveyLocked(editingSurvey) ? 0.65 : 1
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Q{qIndex + 1}</span>
                          {!(editingSurvey && isSurveyLocked(editingSurvey)) && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button type="button" onClick={() => handleEditMoveQuestion(qIndex, 'up')}
                                disabled={qIndex === 0}
                                style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: qIndex === 0 ? 'not-allowed' : 'pointer', opacity: qIndex === 0 ? 0.3 : 1 }}>
                                <ChevronUp size={16} />
                              </button>
                              <button type="button" onClick={() => handleEditMoveQuestion(qIndex, 'down')}
                                disabled={qIndex === editForm.questions.length - 1}
                                style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: qIndex === editForm.questions.length - 1 ? 'not-allowed' : 'pointer', opacity: qIndex === editForm.questions.length - 1 ? 0.3 : 1 }}>
                                <ChevronDown size={16} />
                              </button>
                              <button type="button"
                                onClick={() => setEditForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }))}
                                disabled={editForm.questions.length === 1}
                                style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: editForm.questions.length === 1 ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: editForm.questions.length === 1 ? 0.3 : 1 }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          value={q.question_text}
                          onChange={e => handleEditQuestionChange(qIndex, 'question_text', e.target.value)}
                          placeholder="質問を入力してください"
                          required
                          disabled={!!(editingSurvey && isSurveyLocked(editingSurvey))}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem',
                            border: '1px solid #d1d5db', borderRadius: '0.375rem',
                            fontSize: '0.875rem', marginBottom: '0.5rem', outline: 'none', boxSizing: 'border-box',
                            background: editingSurvey && isSurveyLocked(editingSurvey) ? '#f3f4f6' : 'white'
                          }}
                        />

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          {(['text', 'radio', 'checkbox'] as QuestionType[]).map(type => (
                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: editingSurvey && isSurveyLocked(editingSurvey) ? 'not-allowed' : 'pointer', fontSize: '0.8125rem' }}>
                              <input
                                type="radio"
                                checked={q.question_type === type}
                                onChange={() => handleEditQuestionChange(qIndex, 'question_type', type)}
                                disabled={!!(editingSurvey && isSurveyLocked(editingSurvey))}
                              />
                              {type === 'text' ? 'テキスト入力' : type === 'radio' ? '単一選択' : '複数選択'}
                            </label>
                          ))}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: editingSurvey && isSurveyLocked(editingSurvey) ? 'not-allowed' : 'pointer', fontSize: '0.8125rem', marginLeft: 'auto' }}>
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={e => handleEditQuestionChange(qIndex, 'required', e.target.checked)}
                              disabled={!!(editingSurvey && isSurveyLocked(editingSurvey))}
                            />
                            必須
                          </label>
                        </div>

                        {(q.question_type === 'radio' || q.question_type === 'checkbox') && (
                          <div style={{ background: 'white', borderRadius: '0.375rem', padding: '0.75rem' }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280' }}>選択肢</p>
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => handleEditOptionChange(qIndex, oIndex, e.target.value)}
                                  placeholder={`選択肢 ${oIndex + 1}`}
                                  disabled={!!(editingSurvey && isSurveyLocked(editingSurvey))}
                                  style={{
                                    flex: 1, padding: '0.375rem 0.625rem',
                                    border: '1px solid #d1d5db', borderRadius: '0.375rem',
                                    fontSize: '0.8125rem', outline: 'none',
                                    background: editingSurvey && isSurveyLocked(editingSurvey) ? '#f3f4f6' : 'white'
                                  }}
                                />
                                {!(editingSurvey && isSurveyLocked(editingSurvey)) && (
                                  <button type="button" onClick={() => handleEditRemoveOption(qIndex, oIndex)}
                                    style={{ padding: '0.375rem', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {!(editingSurvey && isSurveyLocked(editingSurvey)) && (
                              <button type="button" onClick={() => handleEditAddOption(qIndex)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.25rem 0.5rem', background: 'white', border: '1px dashed #d1d5db',
                                  borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#6b7280'
                                }}>
                                <Plus size={12} /> 選択肢を追加
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {!(editingSurvey && isSurveyLocked(editingSurvey)) && (
                      <button type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, questions: [...prev.questions, { ...emptyQuestion(), order_index: prev.questions.length }] }))}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 1rem', background: 'white', border: '1px dashed #22c55e',
                          borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#22c55e', fontWeight: 500
                        }}>
                        <Plus size={16} /> 質問を追加
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <button type="button" onClick={handleEditCancel}
                      style={{ padding: '0.625rem 1.25rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                      キャンセル
                    </button>
                    <button type="submit" disabled={saving || !editForm.title.trim()}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: saving || !editForm.title.trim() ? '#d1d5db' : '#22c55e',
                        color: 'white', border: 'none', borderRadius: '0.5rem',
                        cursor: saving || !editForm.title.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem', fontWeight: 500
                      }}>
                      {saving ? '保存中...' : '保存する'}
                    </button>
                  </div>
                </form>
              ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                      {survey.title}
                    </h4>
                    {survey.description && (
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {survey.description}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9ca3af' }}>
                      {survey.questions?.length || 0}問 · 作成日: {new Date(survey.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleEditStart(survey)}
                      title="編集"
                      style={{ padding: '0.375rem', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      title="削除"
                      style={{ padding: '0.375rem', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 質問プレビュー */}
                {survey.questions && survey.questions.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                    {survey.questions.slice(0, 3).map((q, i) => (
                      <p key={q.id} style={{ margin: i === 0 ? 0 : '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                        Q{i + 1}. {q.question_text}
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                          ({q.question_type === 'text' ? 'テキスト' : q.question_type === 'radio' ? '単一選択' : '複数選択'})
                        </span>
                      </p>
                    ))}
                    {(survey.questions.length > 3) && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#9ca3af' }}>
                        ...他 {survey.questions.length - 3} 問
                      </p>
                    )}
                  </div>
                )}
              </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SurveyBuilder
