import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useAuthContext } from '@/components/providers/AuthProvider'

/**
 * ログイン中ユーザーの未読DM合計数をリアルタイムで返すフック。
 * Header のバッジ表示など軽量な用途向け。
 */
export function useUnreadCount() {
  const { user } = useAuthContext()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      // RLS が自動的に自分の会話だけを返す
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0)
        return
      }

      const conversationIds = conversations.map((c: { id: string }) => c.id)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
    } catch (err) {
      console.error('未読数取得エラー:', err)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    fetchUnreadCount()

    // INSERT (新着) + UPDATE (既読) の両方を監視
    const channel = supabase
      .channel(`unread-count-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchUnreadCount() }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => { fetchUnreadCount() }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, fetchUnreadCount])

  return unreadCount
}
