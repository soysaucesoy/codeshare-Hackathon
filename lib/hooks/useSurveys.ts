// lib/hooks/useSurveys.ts - アンケートCRUD・送信フック
import { useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'
import type { Survey, SurveyQuestion, SurveyResponse, SurveyAnswer, SurveyForm } from '@/types/survey'

export function useSurveys() {
  const { user } = useAuthContext()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 事業所のアンケート一覧を取得
  const fetchSurveys = useCallback(async (facilityId: number) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('surveys')
        .select(`
          *,
          questions:survey_questions(*)
        `)
        .eq('facility_id', facilityId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // questionsをorder_indexでソート
      const sorted = (data || []).map((s: any) => ({
        ...s,
        questions: (s.questions || []).sort((a: SurveyQuestion, b: SurveyQuestion) => a.order_index - b.order_index)
      }))

      setSurveys(sorted)
    } catch (err: any) {
      setError(err.message)
      console.error('アンケート取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // アンケートを作成
  const createSurvey = useCallback(async (facilityId: number, form: SurveyForm) => {
    if (!user) throw new Error('ログインが必要です')

    try {
      setLoading(true)

      // アンケート本体を作成
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          facility_id: facilityId,
          title: form.title,
          description: form.description || null,
          is_active: true
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // 質問項目を作成
      if (form.questions.length > 0) {
        const questionsToInsert = form.questions.map((q, index) => ({
          survey_id: surveyData.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options.length > 0 ? q.options : null,
          required: q.required,
          order_index: index
        }))

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questionsToInsert)

        if (questionsError) throw questionsError
      }

      return surveyData
    } catch (err: any) {
      setError(err.message)
      console.error('アンケート作成エラー:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // アンケートを削除（論理削除: is_active=false）
  const deleteSurvey = useCallback(async (surveyId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('surveys')
        .update({ is_active: false })
        .eq('id', surveyId)

      if (deleteError) throw deleteError
    } catch (err: any) {
      setError(err.message)
      console.error('アンケート削除エラー:', err)
      throw err
    }
  }, [])

  // アンケートを会話に送信（messagesにsurveyタイプのメッセージを追加）
  const sendSurveyToConversation = useCallback(async (
    surveyId: string,
    conversationId: string
  ) => {
    if (!user) throw new Error('ログインが必要です')

    try {
      // 会話情報を取得してreceiver_idを特定
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('user_id, facility_id')
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      // survey_responsesにレコードを作成
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          conversation_id: conversationId,
          sent_by: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (responseError) throw responseError

      // messagesにsurveyタイプのメッセージを挿入
      const recipient_id = convData.user_id === user.id
        ? convData.facility_id.toString()
        : convData.user_id

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipient_id,
          content: 'アンケートが届きました',
          is_read: false,
          message_type: 'survey',
          survey_response_id: responseData.id
        })

      if (msgError) throw msgError

      // 会話の最終メッセージ時刻を更新
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      return responseData
    } catch (err: any) {
      setError(err.message)
      console.error('アンケート送信エラー:', err)
      throw err
    }
  }, [user])

  // アンケート回答を取得（survey_response_idから）
  const fetchSurveyResponse = useCallback(async (surveyResponseId: string): Promise<SurveyResponse | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('survey_responses')
        .select(`
          *,
          survey:surveys(
            *,
            questions:survey_questions(*)
          ),
          answers:survey_answers(*)
        `)
        .eq('id', surveyResponseId)
        .single()

      if (fetchError) throw fetchError

      // questionsをorder_indexでソート
      if (data?.survey?.questions) {
        data.survey.questions = data.survey.questions.sort(
          (a: SurveyQuestion, b: SurveyQuestion) => a.order_index - b.order_index
        )
      }

      return data
    } catch (err: any) {
      console.error('アンケート回答取得エラー:', err)
      return null
    }
  }, [])

  // アンケートに回答を送信
  const submitSurveyAnswers = useCallback(async (
    surveyResponseId: string,
    answers: { question_id: string; answer_text?: string; answer_json?: string[] }[]
  ) => {
    if (!user) throw new Error('ログインが必要です')

    try {
      // 回答データを挿入
      const answersToInsert = answers.map(a => ({
        survey_response_id: surveyResponseId,
        question_id: a.question_id,
        answer_text: a.answer_text || null,
        answer_json: a.answer_json || null
      }))

      const { error: answersError } = await supabase
        .from('survey_answers')
        .insert(answersToInsert)

      if (answersError) throw answersError

      // survey_responsesのステータスをcompletedに更新
      const { error: updateError } = await supabase
        .from('survey_responses')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', surveyResponseId)

      if (updateError) throw updateError
    } catch (err: any) {
      setError(err.message)
      console.error('回答送信エラー:', err)
      throw err
    }
  }, [user])

  return {
    surveys,
    loading,
    error,
    fetchSurveys,
    createSurvey,
    deleteSurvey,
    sendSurveyToConversation,
    fetchSurveyResponse,
    submitSurveyAnswers
  }
}
