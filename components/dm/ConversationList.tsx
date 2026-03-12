// components/dm/ConversationList.tsx
import React from 'react';
import { MessageCircle, User } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { type Conversation } from '@/lib/hooks/useMessages';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  loading?: boolean;
  /** 事業者側で利用者プロフィールを表示する際に提供するコールバック */
  onViewProfile?: (userId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  selectedConversationId,
  loading = false,
  onViewProfile
}) => {
  const { user } = useAuthContext();

  const getOtherPartyInfo = (conversation: Conversation) => {
    if (!user) return { name: '', subtitle: '' };

    // ログインユーザーのuser_typeで表示を切り替え
    // 利用者の場合：事業所名を表示
    // 事業者の場合：利用者名を表示
    const isUserSide = conversation.user_id === user.id;

    if (isUserSide) {
      // 利用者側：事業所名を表示
      return {
        name: conversation.facility?.name || '事業所',
        subtitle: ''
      };
    } else {
      // 事業者側：利用者名を表示
      return {
        name: conversation.user?.full_name || '利用者',
        subtitle: ''
      };
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        会話を読み込み中...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <MessageCircle size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#374151' }}>
          メッセージがありません
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          事業所の詳細ページからメッセージを送信してみましょう
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <h2 style={{
        margin: '0 0 1rem 1rem',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#111827'
      }}>
        メッセージ
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {conversations.map((conversation) => {
          const otherParty = getOtherPartyInfo(conversation);
          const isSelected = conversation.id === selectedConversationId;
          // 最後のメッセージが相手から送られてきて、かつ未読の場合
          const isUnread = conversation.last_message &&
                          conversation.last_message.sender_id !== user?.id &&
                          !conversation.last_message.is_read;

          return (
            <div
              key={conversation.id}
              style={{
                borderLeft: isSelected ? '4px solid #22c55e' : '4px solid transparent',
                background: isSelected ? '#f0fdf4' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {/* メイン会話クリックエリア */}
              <button
                onClick={() => onSelectConversation(conversation)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
              {/* アバター */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isSelected ? '#22c55e' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'white' : '#6b7280',
                flexShrink: 0
              }}>
                <User size={24} />
              </div>

              {/* 内容 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: isUnread ? 600 : 500,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {otherParty.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {formatLastMessageTime(conversation.last_message_at)}
                    </span>
                    {/* 未読メッセージ数のバッジ（緑色） */}
                    {conversation.unread_count > 0 && (
                      <div style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        background: '#22c55e',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0 6px'
                      }}>
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>

                {otherParty.subtitle && (
                  <p style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {otherParty.subtitle}
                  </p>
                )}

                {conversation.last_message && (
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conversation.last_message.sender_id === user?.id ? '自分: ' : ''}
                    {conversation.last_message.content}
                  </p>
                )}
              </div>
              </button>

              {/* プロフィールを見るボタン（事業者側のみ） */}
              {onViewProfile && conversation.user_id && user?.id !== conversation.user_id && (
                <div style={{ paddingLeft: '4.5rem', paddingBottom: '0.75rem', paddingRight: '1rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile(conversation.user_id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#16a34a',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dcfce7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f0fdf4';
                    }}
                  >
                    <User size={12} />
                    プロフィールを見る
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
