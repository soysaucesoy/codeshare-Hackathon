// lib/hooks/useMessages.ts - 修正版

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/components/providers/AuthProvider';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  facility_id: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  facility?: {
    id: number;
    name: string;
    district?: string;
  };
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    district?: string;
  };
  last_message?: Message;
}

export const useMessages = () => {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'user' | 'facility'>('user');

  // lib/hooks/useMessages.ts - 正しい構造に基づく修正版

const fetchConversations = useCallback(async () => {
  if (!user) {
    console.log('ユーザーが存在しないため会話取得をスキップ');
    return;
  }
  
  setLoading(true);
  try {
    console.log('会話一覧取得開始 - ユーザーID:', user.id);
    
    // まず、このユーザーが事業所ユーザーかどうかを確認
    // facilitiesテーブルでuser_idを検索
    const { data: facilityData, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    const isFacilityUser = !facilityError && facilityData;
    const currentUserType = isFacilityUser ? 'facility' : 'user';
    const facilityId = facilityData?.id || null;
    
    setUserType(currentUserType as 'user' | 'facility');
    
    console.log('ユーザー情報:', {
      userId: user.id,
      userType: currentUserType,
      facilityId: facilityId,
      facilityName: facilityData?.name
    });
    
    let conversationsData;
    
    if (currentUserType === 'facility' && facilityId) {
      // 事業所側：facility_idで検索
      console.log(`事業所として会話を取得 - facility_id: ${facilityId}`);
      
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('facility_id', facilityId)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;
      
      // 各会話に対してユーザー情報と事業所情報を追加
      conversationsData = await Promise.all(
        (convData || []).map(async (conv) => {
          // 利用者情報を取得
          const { data: userInfo } = await supabase
            .from('users')
            .select('id, full_name, email, district, phone_number')
            .eq('id', conv.user_id)
            .single();

          // 事業所情報も含める（一貫性のため）
          const { data: facilityInfo } = await supabase
            .from('facilities')
            .select('id, name, district')
            .eq('id', conv.facility_id)
            .single();

          return {
            ...conv,
            user: userInfo || undefined,
            facility: facilityInfo || undefined
          };
        })
      );
    } else {
      // 利用者側：user_idで検索
      console.log(`利用者として会話を取得 - user_id: ${user.id}`);
      
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;
      
      // 各会話に対して事業所情報とユーザー情報を追加
      conversationsData = await Promise.all(
        (convData || []).map(async (conv) => {
          // 事業所情報を取得
          const { data: facilityInfo } = await supabase
            .from('facilities')
            .select('id, name, district')
            .eq('id', conv.facility_id)
            .single();

          // ユーザー情報も含める（一貫性のため）
          const { data: userInfo } = await supabase
            .from('users')
            .select('id, full_name, email, district')
            .eq('id', conv.user_id)
            .single();

          return {
            ...conv,
            facility: facilityInfo || undefined,
            user: userInfo || undefined
          };
        })
      );
    }

    console.log('取得した会話:', conversationsData);

    // 各会話の最新メッセージを取得
    const conversationsWithMessages = await Promise.all(
      (conversationsData || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          last_message: lastMsg || null
        };
      })
    );
    
    setConversations(conversationsWithMessages);
    console.log(`会話一覧設定完了: ${conversationsWithMessages.length} 件 (${currentUserType}として)`);
    
  } catch (error) {
    console.error('会話一覧取得エラー:', error);
    setConversations([]);
  } finally {
    setLoading(false);
  }
}, [user]);

  // 特定の会話のメッセージを取得
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      console.log('メッセージ取得開始:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('メッセージ取得エラー詳細:', {
          error,
          conversationId,
          userId: user?.id
        });
        throw error;
      }
      
      console.log('取得したメッセージ:', {
        count: data?.length || 0,
        conversationId
      });
      
      setMessages(data || []);
      
      // 未読メッセージを既読にする（相手からのメッセージのみ）
      if (user && data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
        
        if (updateError) {
          console.error('既読更新エラー:', updateError);
        }
      }
      
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // メッセージ送信
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user) {
      console.error('ユーザーが存在しません');
      return;
    }

    try {
      console.log('メッセージ送信:', { conversationId, content, userId: user.id });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('メッセージ送信エラー:', error);
        throw error;
      }

      console.log('メッセージ送信成功:', data);
      
      // メッセージリストに追加
      setMessages(prev => [...prev, data]);

      // 会話の最終更新時刻を更新
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('会話更新エラー:', updateError);
      }

      // 会話一覧を再取得
      await fetchConversations();

      return data;
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      throw error;
    }
  }, [user, fetchConversations]);

  // 会話を作成または取得
  const getOrCreateConversation = useCallback(async (userId: string, facilityId: number) => {
    try {
      console.log('会話作成/取得:', { userId, facilityId });
      
      // 既存の会話を検索
      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .maybeSingle();

      if (searchError) {
        console.error('会話検索エラー:', searchError);
        throw searchError;
      }

      if (existing) {
        console.log('既存の会話を使用:', existing.id);
        return existing.id;
      }

      // 新規作成
      console.log('新規会話を作成');
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          facility_id: facilityId
        })
        .select()
        .single();

      if (createError) {
        console.error('会話作成エラー:', createError);
        throw createError;
      }

      console.log('新規会話作成成功:', newConv.id);
      return newConv.id;
      
    } catch (error) {
      console.error('会話作成/取得エラー:', error);
      return null;
    }
  }, []);

  // 初回ロード時に会話一覧を取得
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!user) return;

    console.log('リアルタイム更新を設定');
    
    const channel = supabase
      .channel(`user_messages_${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload: any) => {
          console.log('新しいメッセージ受信:', payload);
          
          // 自分が送信したメッセージでない場合のみ処理
          if (payload.new.sender_id !== user.id) {
            // 会話一覧を更新
            fetchConversations();
            
            // 現在開いている会話のメッセージなら追加
            if (messages.length > 0 && messages[0].conversation_id === payload.new.conversation_id) {
              setMessages(prev => [...prev, payload.new as Message]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('リアルタイム更新を解除');
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations, messages]);

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    getOrCreateConversation,
    userType
  };
};