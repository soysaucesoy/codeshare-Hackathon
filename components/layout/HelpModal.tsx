import React, { useState } from 'react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

type TabType = 'user' | 'facility'

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('user')

  if (!open) return null

  const tabStyle = (tab: TabType): React.CSSProperties => ({
    flex: 1,
    padding: '0.6rem 0',
    border: 'none',
    borderBottom: activeTab === tab ? '2.5px solid #2563eb' : '2.5px solid transparent',
    background: 'none',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? '#2563eb' : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.97rem',
    transition: 'color 0.15s, border-color 0.15s'
  })

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '0.875rem',
          padding: '1.75rem 1.75rem 1.5rem',
          maxWidth: '90vw',
          width: '480px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            color: '#9ca3af',
            lineHeight: 1
          }}
          aria-label="閉じる"
        >✕</button>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827', textAlign: 'center' }}>
          使い方
        </h2>

        {/* タブ */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1.25rem'
        }}>
          <button style={tabStyle('user')} onClick={() => setActiveTab('user')}>
            利用者
          </button>
          <button style={tabStyle('facility')} onClick={() => setActiveTab('facility')}>
            事業者
          </button>
        </div>

        {/* 利用者向けコンテンツ */}
        {activeTab === 'user' && (
          <div style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.7 }}>
            <Section title="事業所を探す">
              <Item label="キーワード検索">
                事業所名や住所のキーワードで検索できます。
              </Item>
              <Item label="地域・サービスで絞り込み">
                東京都内の区市町村や、障害福祉サービスの種別（訪問系・日中活動系など）で絞り込めます。
              </Item>
              <Item label="空き状況フィルター">
                「空きのみ表示」に切り替えることで、今すぐ受け入れ可能な事業所を探せます。
              </Item>
              <Item label="地図ビュー">
                リストと地図で表示を切り替えて、場所から事業所を探すことができます。
              </Item>
            </Section>

            <Section title="ブックマーク機能">
              <Item label="ブックマーク登録">
                気になる事業所の星アイコンをタップしてお気に入りに追加できます。ログインが必要です。
              </Item>
              <Item label="マイページで閲覧">
                マイページの「ブックマーク」タブから登録した事業所を一覧で確認できます。
              </Item>
            </Section>

            <Section title="事業所と連絡を取る">
              <Item label="メッセージを送る">
                事業所詳細ページから直接メッセージを送れます。空き状況の確認や見学のお申し込みにご利用ください。
              </Item>
              <Item label="メッセージを見る">
                マイページの「メッセージ」タブから事業所とのやり取りを確認できます。
              </Item>
            </Section>

            <Section title="利用者プロフィール">
              <Item label="プロフィールを作る">
                マイページの「アセスメント」タブに必要事項を入力すれば、AIがサービス等利用計画の作成をサポートします。
              </Item>
              <Item label="プロフィールを見る">
                マイページの「アカウント設定」タブから事業者からどう見られるかを確認できます。
              </Item>
            </Section>

            <Section title="＜よくある質問＞" bordered titleColor="#111827">
              <Faq q="検索しても事業所が表示されない">
                絞り込み条件を確認し、地域やサービス種別の選択を外して再度お試しください。
              </Faq>
              <Faq q="ブックマークが利用できない">
                未ログインの場合はご利用いただけません。
              </Faq>
              <Faq q="メッセージが届かない">
                マイページのメッセージタブを確認してください。事業者からの返信は緑色のアイコンで通知されます。
              </Faq>
              <Faq q="ログインできない">
                クッキー・認証情報を一度削除してから再度ログインをお試しください。
              </Faq>
            </Section>

            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
              その他のご不明点は「お問い合わせ」からご連絡ください。
            </p>
          </div>
        )}

        {/* 事業者向けコンテンツ */}
        {activeTab === 'facility' && (
          <div style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.7 }}>
            <Section title="事業所情報の管理">
              <Item label="詳細情報の編集">
                マイページの「事業者情報」タブから事業所名・住所・電話番号・Webサイト等を編集できます。
              </Item>
              <Item label="サービス情報の設定">
                提供しているサービス種別（訪問系・日中活動系など）と受け入れ状況を設定できます。利用者の検索結果に反映されます。
              </Item>
              <Item label="受け入れ状況の更新">
                「受け入れ可能」「受け入れ不可」をワンクリックで切り替えられます。こまめな更新にご協力ください。
              </Item>
            </Section>

            <Section title="利用者と連絡を取る">
              <Item label="受信メッセージの確認">
                マイページの「メッセージ」タブから利用者からの問い合わせを確認し、返信できます。
              </Item>
              <Item label="未読件数の表示">
                ヘッダーのメッセージアイコンに未読数が表示されます。
              </Item>
            </Section>

            <Section title="アンケート機能">
              <Item label="アンケートの作成">
                マイページの「アンケート」タブからアンケートをカスタマイズして作成できます。
              </Item>
              <Item label="アンケートの送信">
                作成したアンケートを「メッセージ」タブから利用者に送信でき、回答結果も確認できます。
              </Item>
            </Section>

            <Section title="アカウント設定">
              <Item label="パスワード変更">
                マイページの「アカウント設定」タブからパスワードを変更できます。
              </Item>
              <Item label="アカウント削除">
                マイページの「アカウント設定」タブからアカウントを削除できます。削除後はデータを復元できませんのでご注意ください。
              </Item>
            </Section>

            <Section title="＜よくある質問＞" bordered titleColor="#111827">
              <Faq q="事業所情報が検索結果に反映されない">
                情報を保存後、反映まで少し時間がかかる場合があります。しばらく待ってから再度ご確認ください。
              </Faq>
              <Faq q="サービス種別が登録できない">
                マイページの「サービス情報」タブでサービス種別を選択し、保存ボタンを押してください。
              </Faq>
              <Faq q="メッセージへの返信方法がわからない">
                マイページの「メッセージ」タブで会話を選択し、入力欄からメッセージを送信してください。
              </Faq>
            </Section>

            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
              掲載情報に関するお問い合わせや不具合の報告は「お問い合わせ」からご連絡ください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ───── 補助コンポーネント ─────

const Section: React.FC<{ title: string; children: React.ReactNode; bordered?: boolean; titleColor?: string }> = ({ title, children, bordered, titleColor }) => (
  <div style={{
    marginBottom: '1.1rem',
    ...(bordered ? {
      border: '1.5px solid #e5e7eb',
      borderRadius: '0.625rem',
      padding: '0.75rem 0.875rem 0.5rem',
    } : {})
  }}>
    <p style={{ fontWeight: 'bold', color: titleColor ?? '#1d4ed8', marginBottom: '0.4rem', fontSize: '0.93rem' }}>
      {title}
    </p>
    <ul style={{ paddingLeft: '0.5rem', margin: 0, listStyle: 'none' }}>
      {children}
    </ul>
  </div>
)

const Item: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <li style={{ marginBottom: '0.35rem', paddingLeft: '0.5rem', borderLeft: '2px solid #dbeafe' }}>
    <b>{label}</b>：{children}
  </li>
)

const Faq: React.FC<{ q: string; children: React.ReactNode }> = ({ q, children }) => (
  <li style={{ marginBottom: '0.45rem' }}>
    <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Q. {q}</span><br />
    <span style={{ color: '#374151' }}>A. {children}</span>
  </li>
)

export default HelpModal