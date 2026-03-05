// types/survey.ts - アンケート関連の型定義

export type QuestionType = 'text' | 'radio' | 'checkbox'
export type SurveyStatus = 'pending' | 'completed'

export interface Survey {
  id: string
  facility_id: number
  title: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  questions?: SurveyQuestion[]
}

export interface SurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: QuestionType
  options?: string[]  // radio/checkbox の選択肢
  required: boolean
  order_index: number
  created_at: string
}

export interface SurveyResponse {
  id: string
  survey_id: string
  conversation_id: string
  sent_by: string
  status: SurveyStatus
  created_at: string
  completed_at?: string
  survey?: Survey
  answers?: SurveyAnswer[]
}

export interface SurveyAnswer {
  id: string
  survey_response_id: string
  question_id: string
  answer_text?: string
  answer_json?: string[]  // checkbox の複数選択
  created_at: string
}

// フォーム用の型（作成時）
export interface SurveyQuestionForm {
  question_text: string
  question_type: QuestionType
  options: string[]
  required: boolean
  order_index: number
}

export interface SurveyForm {
  title: string
  description: string
  questions: SurveyQuestionForm[]
}
