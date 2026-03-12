# Care Connect

<img width="1280" height="720" alt="logo3" src="https://github.com/user-attachments/assets/83717aa7-c33e-4f64-8093-e996aec2285e" />

## プロジェクト概要

「Care Connect」は、東京都内の障害福祉サービス事業所を検索し、詳細情報を閲覧できるWebアプリケーションです。利用者は、事業所名、地区、提供サービスの種類、空き状況などの条件で事業所を絞り込み検索できます。

## 公開目的

本プロジェクトは以下の目的でオープンソースとして公開しています。

- **ハッカソン成果物の公開**: [東京都オープンデータハッカソン 2025](https://odhackathon.metro.tokyo.lg.jp/collection/64/?year=2025) の成果物として開発されました。障害福祉分野におけるDX推進の一例として広く共有することを目的としています。
- **リファレンス実装**: 障害福祉サービス検索システムの参考実装として、同様のシステムを構築する際の技術的なベースとして活用いただけます。

## 関連リンク

- [説明資料](https://www.canva.com/design/DAG2rB_Px9s/4yV3ZJZcQUK3jZ0obRT1nA/view?utm_content=DAG2rB_Px9s&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h6dc62b06f7)
- [プレスリリース](https://odhackathon.metro.tokyo.lg.jp/collection/64/?year=2025)
- [プロトタイプ公開URL](https://codeshare-hackathon-bw6g.vercel.app/)

## 主な機能

- **事業所検索**: 事業所名、地区、提供サービス、空き状況による詳細な検索・絞り込み機能
- **事業所情報表示**: 各事業所の詳細情報（説明、アピールポイント、提供サービス、連絡先、画像など）をカード形式で表示
- **地図表示**: Leafletを利用したインタラクティブな事業所マップ
- **ブックマーク**: 気になる事業所をブックマークして管理
- **DM機能**: 利用者と事業所間のメッセージング
- **アンケート機能**: 事業所から利用者へのアンケート送信・回答
- **ユーザー認証**: 利用者（user）と事業所（facility）の2種類のアカウントタイプに対応
- **サービス計画生成**: AIを利用したサービス計画の自動生成

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | [Next.js 15](https://nextjs.org/) (Pages Router) / React 19 / TypeScript |
| データベース & 認証 | [Supabase](https://supabase.com/) (PostgreSQL, RLS, 認証) |
| スタイリング | [Tailwind CSS 4](https://tailwindcss.com/) |
| フォーム | [React Hook Form](https://react-hook-form.com/) / [Zod](https://zod.dev/) |
| アニメーション | [Framer Motion](https://www.framer.com/motion/) |
| アイコン | [Lucide React](https://lucide.dev/) |
| 通知 | [react-hot-toast](https://react-hot-toast.com/) |
| 地図 | [Leaflet](https://leafletjs.com/) / [React-Leaflet](https://react-leaflet.js.org/) |
| グラフ | [Chart.js](https://www.chartjs.org/) / [React-Chartjs-2](https://react-chartjs-2.js.org/) |
| AI | [Gemini API](https://ai.google.dev/)（サービス計画の自動生成） |
| メール | [SendGrid](https://sendgrid.com/) |

## ディレクトリ構成

```
.
├── components/                  # UIコンポーネント
│   ├── AccountDeletionButton.tsx # アカウント削除ボタン
│   ├── auth/                    # 認証関連コンポーネント
│   │   ├── AuthGuard.tsx        #   認証ガード（未認証時のリダイレクト）
│   │   ├── FacilityAuthForm.tsx #   事業所向け認証フォーム
│   │   └── TabbedAuthForm.tsx   #   タブ切り替え式ログイン/登録フォーム
│   ├── dm/                      # DM（ダイレクトメッセージ）機能
│   │   ├── ConversationList.tsx #   会話一覧
│   │   ├── MessageThread.tsx    #   メッセージスレッド表示
│   │   └── SurveyCard.tsx       #   アンケートカード表示
│   ├── layout/                  # 共通レイアウト
│   │   ├── Footer.tsx           #   フッター
│   │   ├── Header.tsx           #   ヘッダー（ナビゲーション）
│   │   └── HelpModal.tsx        #   ヘルプモーダル
│   ├── providers/               # コンテキストプロバイダー
│   │   └── AuthProvider.tsx     #   認証状態の提供
│   ├── search/                  # 検索関連コンポーネント
│   │   ├── FacilityCard.tsx     #   事業所カード
│   │   ├── MapView.tsx          #   地図表示（動的インポート用ラッパー）
│   │   ├── MapViewInner.tsx     #   地図表示（Leaflet実装）
│   │   ├── SearchFilter.tsx     #   検索フィルターフォーム
│   │   ├── SearchResults.tsx    #   検索結果一覧
│   │   └── SearchSection.tsx    #   検索セクション全体
│   ├── surveys/                 # アンケート機能
│   │   ├── SendSurveyModal.tsx  #   アンケート送信モーダル
│   │   └── SurveyBuilder.tsx    #   アンケート作成フォーム
│   └── ui/                      # 汎用UIコンポーネント
│       ├── Badge.tsx            #   バッジ
│       ├── BookmarkIcon.tsx     #   ブックマークアイコン
│       ├── Button.tsx           #   ボタン
│       ├── Card.tsx             #   カード
│       ├── Input.tsx            #   入力フィールド
│       ├── Loading.tsx          #   ローディング表示
│       ├── Modal.tsx            #   モーダルダイアログ
│       └── ToggleSwitch.tsx     #   トグルスイッチ
│
├── hooks/                       # カスタムReactフック（ページ層）
│   ├── use-Auth.ts              #   認証状態管理
│   ├── useAccountDeletion.ts    #   アカウント削除処理
│   └── useDevice.ts             #   デバイス判定（PC/スマホ）
│
├── lib/                         # 共有ユーティリティ・ビジネスロジック
│   ├── auth/                    # 認証ヘルパー
│   │   ├── auth-helpers.ts      #   認証ユーティリティ関数
│   │   └── deleteAccount.ts     #   アカウント削除処理
│   ├── hooks/                   # カスタムフック（ビジネスロジック層）
│   │   ├── useAuth.tsx          #   認証状態管理（Provider連携）
│   │   ├── useBookmarks.ts      #   ブックマーク管理
│   │   ├── useFacilities.ts     #   事業所データ取得
│   │   ├── useMessages.ts       #   メッセージ送受信
│   │   ├── useSearch.ts         #   検索ロジック
│   │   ├── useSurveys.ts        #   アンケート管理
│   │   └── useUnreadCount.ts    #   未読メッセージ数
│   ├── supabase/                # Supabaseクライアント
│   │   ├── bookmarks.ts         #   ブックマークAPI
│   │   ├── client.ts            #   ブラウザ用クライアント初期化
│   │   ├── server.ts            #   サーバー用クライアント初期化
│   │   └── types.ts             #   Supabase型定義
│   ├── utils/                   # ユーティリティ関数
│   │   ├── constants.ts         #   定数定義
│   │   ├── helpers.ts           #   汎用ヘルパー
│   │   ├── userType.ts          #   ユーザータイプ判定
│   │   └── validation.ts        #   バリデーション
│   ├── validation/              # フォームバリデーション
│   │   └── form-validation.ts   #   Zodスキーマ定義
│   ├── middleware.ts            # ミドルウェアユーティリティ
│   └── supabase.ts              # Supabaseクライアント（レガシー）
│
├── pages/                       # Next.js ページ（Pages Router）
│   ├── _app.tsx                 # アプリケーションエントリーポイント
│   ├── index.tsx                # トップページ（事業所検索）
│   ├── dashboard.tsx            # ユーザーダッシュボード
│   ├── register.tsx             # ユーザー登録
│   ├── search-test.tsx          # 検索テストページ
│   ├── auth/                    # 認証関連ページ
│   │   ├── auth.tsx             #   認証ページ
│   │   ├── callback.tsx         #   OAuth コールバック
│   │   ├── facilitylogin.tsx    #   事業所ログイン
│   │   ├── facilityregister.tsx #   事業所登録
│   │   ├── userlogin.tsx        #   利用者ログイン
│   │   └── verify-email.tsx     #   メール確認
│   ├── business/                # 事業所向けページ
│   │   └── mypage.tsx           #   事業所マイページ
│   ├── contact/                 # お問い合わせ
│   │   ├── index.tsx            #   お問い合わせフォーム
│   │   └── success.tsx          #   送信完了
│   ├── facilities/              # 事業所詳細
│   │   └── [id].tsx             #   事業所詳細ページ（動的ルート）
│   ├── user/                    # 利用者向けページ
│   │   ├── mypage.tsx           #   利用者マイページ
│   │   └── profile/
│   │       └── [userId].tsx     #   利用者プロフィール
│   └── api/                     # APIルート
│       ├── register.ts          #   ユーザー登録
│       ├── delete-user.ts       #   ユーザー削除
│       ├── test-db.ts           #   DB接続テスト
│       ├── generate-service-plan.ts # サービス計画生成（AI）
│       ├── auth/                #   認証API
│       │   ├── create-facility-profile.ts # 事業所プロフィール作成
│       │   ├── delete-account.ts          # アカウント削除
│       │   └── logout/route.ts            # ログアウト
│       ├── facilities/          #   事業所API
│       │   ├── [id].ts          #     事業所詳細取得
│       │   └── register.ts     #     事業所登録
│       ├── search/              #   検索API
│       │   └── facilities.ts    #     事業所検索
│       ├── service-plans/       #   サービス計画API
│       │   └── index.ts         #     サービス計画CRUD
│       └── users/               #   ユーザーAPI
│           └── profile/
│               └── [userId].ts  #     ユーザープロフィール取得
│
├── types/                       # TypeScript型定義
│   ├── database.ts              # DBスキーマ型・地区・サービスカテゴリ定義
│   ├── auth.ts                  # 認証関連型
│   └── survey.ts                # アンケート関連型
│
├── utils/                       # ユーティリティ
│   └── supabase/
│       └── middleware.ts        # Supabaseサーバーサイドミドルウェア
│
├── scripts/                     # スクリプト
│   └── import-wamnet-data.js    # WAMNETデータのSupabaseインポート
│
├── styles/                      # スタイル
│   └── globals.css              # グローバルCSS（Tailwind設定含む）
│
├── public/                      # 静的ファイル
│
├── middleware.ts                 # Next.js ミドルウェア（認証チェック）
├── next.config.ts               # Next.js設定
├── tailwind.config.js           # Tailwind CSS設定
├── tsconfig.json                # TypeScript設定
├── eslint.config.mjs            # ESLint設定
├── package.json                 # 依存関係・スクリプト定義
├── wamnet.csv                   # 事業所データ（CSV）
├── CLAUDE.md                    # Claude Code向けプロジェクト情報
└── LICENSE                      # MITライセンス
```

## セットアップ方法

### 1. リポジトリのクローン

```bash
git clone https://github.com/soysaucesoy/codeshare-Hackathon.git
cd codeshare-Hackathon
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くとアプリケーションが表示されます。

### 5. データインポート（任意）

WAMNETの事業所データをSupabaseにインポートする場合：

```bash
node scripts/import-wamnet-data.js
```

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバーの起動（localhost:3000） |
| `npm run build` | プロダクションビルド |
| `npm start` | プロダクションサーバーの起動 |
| `npm run lint` | ESLintの実行 |

## ライセンス

本プロジェクトは [MIT License](./LICENSE) の下で公開されています。

- 商用利用、改変、再配布は自由です。
- 本ソフトウェアは「現状のまま」提供されます。利用により生じた損害について、開発者は一切の責任を負いません。
- 詳細は [LICENSE](./LICENSE) ファイルをご確認ください。

## コントリビューション

Issue や Pull Request は歓迎します。バグ報告、機能提案、コード改善など、お気軽にご参加ください。

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/your-feature`）
3. 変更をコミット（`git commit -m 'Add your feature'`）
4. ブランチにプッシュ（`git push origin feature/your-feature`）
5. Pull Request を作成
