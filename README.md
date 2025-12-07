# 駐車場管理システム

月極駐車場の契約者管理と月額料金の支払いを管理するWebアプリケーション。

## 機能

### 利用者向け機能
- **名前+電話番号認証**: 名前と電話番号下4桁で安全にログイン
- **未払い月の表示**: 契約期間内の未払い月のみを表示
- **Stripe決済**: 安全なオンライン決済
- **支払い履歴**: 過去の支払い履歴を確認
- **領収書発行**: 支払い履歴から適格請求書対応の領収書を印刷・PDF保存

### オーナー向け機能
- **契約者管理**: 契約者の追加・編集・削除
- **手動入金消込**: 現金払い等に対応した代理消込機能（部分入金対応）
- **契約期間管理**: 契約開始月・終了月の管理
- **支払い状況確認**: 月ごとの支払い状況（滞納・未払・済）を一覧表示
- **電話番号管理**: 契約者の電話番号を管理

## 技術スタック

- **フロントエンド**: Next.js 15, React, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Auth)
- **決済**: Stripe
- **デプロイ**: Vercel

## セットアップ

### 必要要件

- Node.js 18+
- Supabaseアカウント
- Stripeアカウント

### 環境変数

プロジェクトルートに`.env.local`ファイルを作成:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) にアクセスしてアプリケーションを確認できます。

### データベースセットアップ

Supabase SQL Editorで以下のSQLファイルを順番に実行:

1. **`supabase/1-schema.sql`** - テーブル作成
2. **`supabase/2-seed.sql`** - テストデータ挿入
3. **`supabase/3-update_owner_auth.sql`** - オーナーアカウント設定
   - Supabase Auth > Users でオーナーアカウントを作成
   - 作成されたユーザーIDをコピー
   - SQLの`XXXXX`を実際のIDに置き換えて実行

### Stripe Webhook設定

本番環境(Vercel)の場合:
1. [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks) にアクセス
2. エンドポイントを追加: `https://your-domain.vercel.app/api/webhooks/stripe`
3. イベントを選択: `checkout.session.completed`
4. Webhook secretを`STRIPE_WEBHOOK_SECRET`環境変数にコピー

## 使い方

### 利用者の場合

1. ホームページにアクセス
2. 「ポータルにアクセス」をクリック
3. 登録されている名前と電話番号下4桁を入力
   - 例: 名前「田中」、電話番号「5678」
4. 未払いの月額料金を確認して支払い

### オーナーの場合

1. ホームページにアクセス
2. 「オーナーログイン」をクリック
3. メールアドレスとパスワードを入力
4. 契約者の追加・管理と支払い履歴を確認

## デプロイ

### GitHubを使用したデプロイ(推奨)

VercelとGitHubリポジトリを連携している場合、以下のコマンドで自動的にデプロイされます:

```bash
# 変更をコミット
git add .
git commit -m "コミットメッセージ"

# GitHubにプッシュ(自動的にVercelがデプロイを開始)
git push origin main
```

Vercelダッシュボードでデプロイの進捗を確認できます。

### Vercel CLIを使用したデプロイ(代替方法)

GitHubを使用しない場合は、Vercel CLIで直接デプロイできます:

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

**重要**: Vercelダッシュボードで全ての環境変数を設定してください。

## ライセンス

MIT
