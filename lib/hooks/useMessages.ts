import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuthContext } from '@/components/providers/AuthProvider';


export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  message_type?: 'text' | 'survey';
  survey_response_id?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    user_type: 'user' | 'facility';
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  facility_id: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
  };
  facility?: {
    name: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
    is_read?: boolean;
  };
  unread_count?: number;
}

// 送信者情報のキャッシュ（同一セッション内で再利用）
const senderCache = new Map<string, { full_name: string; user_type: 'user' | 'facility' }>();

async function fetchSenderInfo(senderId: string) {
  const cached = senderCache.get(senderId);
  if (cached) return cached;

  const { data } = await supabase
    .from('users')
    .select('full_name, user_type')
    .eq('id', senderId)
    .single();

  if (data) {
    senderCache.set(senderId, data);
  }
  return data;
}

export function useMessages() {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // refで最新値を参照（Realtimeコールバック内で使用）
  const activeConversationIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // 会話一覧を取得（初回ロード用）
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 会話データを取得（RLSポリシーで自動フィルタリング）
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      if (!conversationData || conversationData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationsWithDetails = await Promise.all(
        conversationData.map(async (conv) => {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', conv.user_id)
            .single();

          const { data: facilityData } = await supabase
            .from('facilities')
            .select('name')
            .eq('id', conv.facility_id)
            .single();

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id, is_read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            user: userData,
            facility: facilityData,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (err: any) {
      setError(err.message);
      console.error('会話一覧取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 特定の会話のメッセージを取得
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: messageData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithSender = await Promise.all(
        (messageData || []).map(async (message) => {
          const senderData = await fetchSenderInfo(message.sender_id);
          return { ...message, sender: senderData };
        })
      );

      setMessages(messagesWithSender);

      // 自分宛の未読メッセージを既読にする
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

    } catch (err: any) {
      setError(err.message);
      console.error('メッセージ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 会話を作成または取得
  const getOrCreateConversation = useCallback(async (
    userId: string,
    facilityId: number
  ) => {
    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .single();

      if (existingConv) {
        return existingConv.id;
      }

      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, facility_id: facilityId })
        .select()
        .single();

      if (createError) throw createError;
      return newConv.id;
    } catch (err: any) {
      console.error('会話作成エラー:', err);
      throw err;
    }
  }, []);

  // メッセージを送信（楽観的更新）
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string
  ) => {
    if (!user) throw new Error('ログインが必要です');

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('user_id, facility_id')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const recipient_id = convData.user_id === user.id
        ? convData.facility_id.toString()
        : convData.user_id;

      // 楽観的更新: DB応答を待たずにUIに即反映
      const senderData = await fetchSenderInfo(user.id);
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: recipient_id,
        content,
        is_read: false,
        message_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: senderData || undefined
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // 会話一覧のlast_messageも即更新
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              last_message_at: optimisticMessage.created_at,
              last_message: { content, sender_id: user.id, is_read: false }
            }
          : conv
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

      // DB挿入
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id,
          content,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // 楽観的メッセージを実データで置換
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessage.id
          ? { ...data, sender: senderData || undefined }
          : msg
      ));

      // 会話の最終メッセージ時刻を更新
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return data;
    } catch (err: any) {
      console.error('メッセージ送信エラー:', err);
      // 楽観的更新を元に戻す
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      throw err;
    }
  }, [user]);

  // 未読メッセージ数を取得
  const getUnreadCount = useCallback(async () => {
    if (!user) return 0;

    try {
      const { data: userConversations } = await supabase
        .from('conversations')
        .select('id');

      if (!userConversations || userConversations.length === 0) {
        return 0;
      }

      const conversationIds = userConversations.map(c => c.id);

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (err: any) {
      console.error('未読数取得エラー:', err);
      return 0;
    }
  }, [user]);

  // Realtimeセットアップ
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`dm-${user.id}`)
      // 新しいメッセージのINSERT
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // 自分が送信したメッセージは楽観的更新済みなのでスキップ
          if (newMsg.sender_id === user.id) return;

          // 送信者情報を取得
          const senderData = await fetchSenderInfo(newMsg.sender_id);
          const messageWithSender = { ...newMsg, sender: senderData || undefined };

          // 現在開いている会話のメッセージなら即追加
          if (activeConversationIdRef.current === newMsg.conversation_id) {
            setMessages(prev => {
              // 重複防止
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, messageWithSender];
            });

            // 開いている会話のメッセージは即既読にする
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }

          // 会話一覧を更新（last_message + 未読数）
          setConversations(prev => {
            const exists = prev.some(c => c.id === newMsg.conversation_id);
            if (exists) {
              return prev.map(conv => {
                if (conv.id !== newMsg.conversation_id) return conv;
                const isActive = activeConversationIdRef.current === conv.id;
                return {
                  ...conv,
                  last_message_at: newMsg.created_at,
                  last_message: { content: newMsg.content, sender_id: newMsg.sender_id, is_read: isActive },
                  unread_count: isActive ? 0 : (conv.unread_count || 0) + 1
                };
              }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            }
            // 新しい会話の場合は全体を再フェッチ
            fetchConversations();
            return prev;
          });
        }
      )
      // 既読ステータスのUPDATE（相手が読んだ時に反映）
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updated = payload.new as Message;

          // 自分が送ったメッセージの既読が変わった場合、UIに反映
          if (updated.sender_id === user.id && updated.is_read) {
            setMessages(prev => prev.map(msg =>
              msg.id === updated.id ? { ...msg, is_read: true } : msg
            ));
          }
        }
      )
      // 新しい会話のINSERT
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // 初期データ読み込み
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    error,
    activeConversationId,
    setActiveConversationId,
    fetchConversations,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    getUnreadCount,
    setMessages
  };
}
