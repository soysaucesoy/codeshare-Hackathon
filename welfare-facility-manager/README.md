# Welfare Facility Manager

## 1. 概要 (Overview)

このプロジェクトは、福祉施設の情報を管理するためのWebアプリケーションです。Next.js, Prisma, Tailwind CSSを使用して構築されています。

This project is a web application for managing information about welfare facilities, built with Next.js, Prisma, and Tailwind CSS.

## 2. 技術スタック (Technology Stack)

- **Framework**: [Next.js](https://nextjs.org/) 15
- **UI**: [React](https://react.dev/) 19
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: SQLite
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 3. セットアップ手順 (Getting Started)

### 前提条件 (Prerequisites)

- [Node.js](https://nodejs.org/) (v18.17 or later)
- [npm](https://www.npmjs.com/)

### インストールと起動 (Installation and Execution)

1.  **リポジトリをクローン (Clone the repository):**
    ```bash
    git clone <repository-url>
    cd welfare-facility-manager
    ```

2.  **依存関係をインストール (Install dependencies):**
    プロジェクトに必要なライブラリをインストールします。
    ```bash
    npm install
    ```

3.  **データベースをセットアップ (Set up the database):**
    Prismaを使用して、SQLiteデータベースとテーブルを作成します。
    ```bash
    npx prisma migrate dev
    ```
    これにより `prisma/` ディレクトリ内に `dev.db` というデータベースファイルが生成されます。

4.  **開発サーバーを起動 (Run the development server):**
    ```bash
    npm run dev
    ```

5.  **ブラウザで確認 (Open in browser):**
    [http://localhost:3000](http://localhost:3000) をブラウザで開き、アプリケーションが動作していることを確認してください。

## 4. 利用可能なスクリプト (Available Scripts)

`package.json` には以下のスクリプトが定義されています。

- `npm run dev`: 開発モードでアプリケーションを起動します。
- `npm run build`: 本番環境用にアプリケーションをビルドします。
- `npm run start`: ビルドされた本番用アプリケーションを起動します。
- `npm run lint`: ESLintを実行し、コードの静的解析を行います。

## 5. プロジェクト構成 (Project Structure)

```
.
├── /app/           # アプリケーションのページとコンポーネント
├── /prisma/        # Prismaスキーマとデータベースファイル
│   ├── schema.prisma # データベースモデルの定義
│   └── dev.db      # SQLiteデータベースファイル
├── /public/        # 静的ファイル (画像など)
├── package.json    # 依存関係とスクリプトの定義
└── README.md       # このファイル
```