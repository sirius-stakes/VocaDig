# AGENTS.md - VocaDig 開発・運用ルール

## 1. プロジェクト概要
- **アプリ名:** VocaDig（ボカディグ）
- **コンセプト:** ムード・BPM・音声ライブラリでの条件検索（Filter Dig）と、好きな曲からの類似度スコアリング推薦（Like-to-Dig）を備えたボカロ曲ディグ（発掘）Webアプリケーション。
- **技術スタック:** Vite + React + TypeScript + Tailwind CSS（SPA構成・静的JSON＋VocaDB公開APIハイブリッド）

## 2. 開発サーバー・ビルド・Git 運用ルール（厳守）
1. **ローカル開発サーバーの起動・常駐禁止**
   - `npm run dev` や `vite` などの開発サーバーをバックグラウンド・フォアグラウンド問わず絶対に起動・常駐させないこと。
   - 動作確認は `npm run build`（TypeScript型チェック＋Viteプロダクションビルド）のみで行うこと。
2. **Git 操作の線引き**
   - 各フェーズの実装が完了し、`npm run build` がエラーゼロで通過した時点で、ローカルリポジトリへの `git add -A` および日本語のコミットメッセージによる `git commit` までを自動実行すること。
   - リモートリポジトリへの `git push`、ブランチ作成・強制操作は**絶対に行わないこと**。
3. **ワークスペース制限**
   - ファイルの読み書き・コマンド実行は現在のプロジェクトルートディレクトリ配下のみに限定すること。

## 3. UI/UX・デザイン統一ルール（ライト／ダーク両対応）
- **テーマ切替:** ライトモード（ホワイト基調）とダークモードをヘッダーのトグルでいつでも切り替え可能にし、`localStorage`（キー: `vocadig-theme`）に保存すること。
- **推しカラー切替:** ライト／ダークとは独立して、音声ライブラリ別のアクセントカラーを切り替えられるようにすること。
  - `useTheme.ts` が `<html data-accent="miku">` のように属性を付与し、`src/index.css` の CSS カスタムプロパティでアプリ全体のアクセント色を動的に切り替える。
  - `localStorage` キーは `vocadig-accent-theme`。対応IDは `miku`（デフォルト）/ `teto` / `rinlen` / `luka` / `kafu` / `flower` / `gumi` / `zundamon`。
  - ヘッダーには現在のテーマカラー丸バッジ付きの「推しカラー切替ポップオーバー」を配置する。
- **カラーパレット（8色テーマ × クリアアクリルガラス設計）:**
  - ベース背景: ライト `bg-slate-50 text-slate-900` / ダーク `dark:bg-slate-950 dark:text-slate-100`。ルート要素には `.app-shell` を付与し、テーマカラーが3〜5%透過で淡く滲むラジアルグラデーションを重ねる。
  - カード・サイドバー・ヘッダー: `.glass-panel`（ライト `bg-white/75 backdrop-blur-md`、ダーク `bg-slate-900/70 backdrop-blur-md` 相当）。ベースパネルはフェーズ3完了時点のすりガラス質感を維持し、不透明なベタ塗りは使用しない。
  - **外側のカラーグロー（ぼかし発光シャドウ）は全面廃止**。発光の代わりに「内側ハイライト（inset）＋1pxの半透明枠線＋極小の自然影」で輪郭と厚みを表現する。`--accent-glow` は定義しない。
  - 8テーマは `--accent-base`（メイン）と `--accent-sub`（サブ）の2色だけを定義する。透過トークンはすべて `color-mix(in srgb, ...)` で自動生成する。
    - `--accent-bg-subtle`: 10%透過背景（カード内の淡い色づき・ホバー）
    - `--accent-bg-soft`: 15%透過背景（選択中チップ・BPM／マッチ度バッジ・サブボタン）
    - `--accent-bg-active`: 22%透過背景（タブ・トグルON）
    - `--accent-border`: 35%透過ボーダー（通常の輪郭線）
    - `--accent-border-strong`: 55%透過ボーダー（アクティブ・ホバー時の強調枠線）
    - `--accent-text`: ライトは `--accent-800` 相当の濃色、ダークは `--accent-300` 相当の明色。背景の透過度に負けない可読性を確保する。
    - `--accent-ring`: フォーカスリング用の30%透過色。
    - `--accent-acrylic-tone` / `--accent-acrylic-fill`: 主役ボタン用の84%透明度アクリル板。ライトは `--accent-base` 82%＋`--accent-950`、ダークは `--accent-600` 88%＋`#020617` を混色し、白文字が沈まない濃さにする。
    - `--accent-acrylic-border`: 1pxの半透明白枠線（ライト white/28・ダーク white/24、ホバーで白を強める）。
    - `--accent-acrylic-hairline`: 白枠の内側に重ねる black/10（ダーク black/35）の細い陰影線。
    - `--accent-acrylic-highlight`: アクリル板上端の white inset ハイライト。
  - **主役ボタン4箇所**（左上「V」ロゴ、ヘッダーアクティブタブ「条件からディグる」、フィルター「AND/OR」の選択側、楽曲カードの「▶ 試聴」）は `.glass-acrylic-primary` を必ず使用する。84%透明度のアクリル板＋1px半透明白枠線＋内側ハイライト＋白文字（`text-shadow` は極小のもののみ）で構成し、外側の彩度の高い光沢シャドウは付けない。8色すべてのテーマで同じアクリル質感が適用される。
  - **重ね合わせUIは完全不透明にする**: 推しカラー切替のドロップダウンメニュー、並び順セレクト、マイリストモーダル、モバイルドロワー、固定ミニプレイヤーには `.glass-menu`（ライト `bg-white` / ダーク `bg-slate-900`）を使用し、しっかりしたボーダーと影で階層を明示する。背面の文字やコンテンツが透けて重なる場合は、背景の不透明度を上げること。
  - コンポーネント側は以下のクラスを一貫して使用する。
    - `.glass-acrylic-primary`: 上記4箇所の主役ボタン（にじみなしアクリル）
    - `.glass-menu`: ドロップダウン・セレクト・モーダルなどの完全不透明な重ね合わせ面
    - `.glass-accent-chip`: 選択中タグ・バッジ・カウント
    - `.glass-accent-button`: サブアクション・リンクボタン
    - `.glass-accent-tab`: トグルON・アイコン装飾（非推奨の主役用途には `.glass-acrylic-primary` を使う）
    - `.glass-accent-overlay`: サムネイル上に重ねるマッチ度バッジ
    - `.glass-neutral`: アクセントを使わない控えめなガラスボタン
    - `.glass-input`: 検索入力（セレクトには `.glass-menu` を使う）
    - `.glass-accent-bar` / `.glass-progress-track`: スライダー・プロファイルバー
  - 互換ユーティリティ `tint-bg` / `tint-bg-strong` / `tint-border` / `tint-border-strong` / `tint-ring` / `tint-shadow` は新トークンへ接続済み（`tint-shadow` は中立の自然影）。
  - 初音ミク（`miku`・デフォルト）は初期実装の透明感あるシアン／ティール系（`bg-cyan-500/15`、`border-cyan-500/35` 相当）と同一の見た目になるよう基準値を維持する。
  - Tailwind の `cyan` / `teal` / `violet` / `fuchsia` ユーティリティは `--color-*` を介して推しカラー変数へ接続済み。新規UIでもアクセント色はこれらのユーティリティまたは CSS 変数を使用し、固定のHEX値を直接書かないこと。
  - 成功状態は `emerald`、削除・警告は `rose`、音声ライブラリ固有の識別色はインラインstyleのまま固定でよい（いずれも透過背景＋透過ボーダーで表現する）。
- **レスポンシブ:** PCは左サイドバー（320px）＋右メインエリアの2カラム、モバイルはドロワー/アコーディオン＋1カラムカード表示。
- **フェーズ7 デザイン基準（フェーズ3基準の復元方針）:**
  - UIのレイアウト・余白・影・`backdrop-blur` 強度・半透明背景・透過ボーダーの基準は、フェーズ3完了時点のコミット `e73ea1290e1e40205b34348a1afce7237ac5a51c` に準拠する。
  - 同コミットで `cyan-*` / `teal-*` としてハードコードされていたアクセント色は、フェーズ7-Aで定義した8色テーマのCSS変数（`--accent-base` / `--accent-sub` とその透過トークン、および `--color-*` 接続のTailwindユーティリティ）へ置き換える。デフォルトの `miku` ではフェーズ3と全く同じシアン／ティールの透過スタイルになるよう基準値を維持する（発光スタイルはフェーズ8で廃止）。
  - フェーズ5〜6で追加された機能UI（ヘッダーの8色推しカラー切替ポップオーバー、類似レコメンドの「マッチ率30%以上・上位最大50曲」バッジ、該当0件時の案内）は復元時にも必ず維持する。
  - 推薦の下限・上限は `src/utils/recommendEngine.ts` の `RECOMMEND_MIN_MATCH_SCORE = 30` / `RECOMMEND_MAX_RESULTS = 50` を単一の情報源とし、UI側もこれを参照して表示する。データ・推薦ロジック（`public/data/songs.json` / `src/constants/masterData.ts` / `src/utils/recommendEngine.ts` / `scripts/fetch-vocadb.ts`）は書き戻さず最新を維持する。
- **フェーズ8 デザイン基準（クリアアクリルガラス ＋ 視認性）:**
  - パネル・カード・サイドバー・ヘッダーのすりガラス質感はフェーズ3（`e73ea1290e1e40205b34348a1afce7237ac5a51c`）を100%基準とし、フェーズ7の8色テーマ接続を維持する。
  - 外側へ広がる彩度の高い発光シャドウ（カラーグロー）は全廃し、`.glass-acrylic-primary` の「84%透明度アクリル板＋1px半透明白枠線＋内側ハイライト＋白文字」に置き換える。適用箇所は上述の主役ボタン4箇所に限定し、8色テーマすべてで同一の質感にする。
  - ドロップダウン／セレクト／モーダル／ドロワー／ミニプレイヤーは `.glass-menu` で完全不透明（ライト `bg-white` / ダーク `bg-slate-900`）にし、影とボーダーで重ね合わせの階層を明示する。透けによる文字の重なりを禁止する。
  - 推しカラー切替ポップオーバー、類似レコメンドの「マッチ率30%以上・上位最大50曲」バッジ、該当0件時の案内は引き続き維持する。
- **フェーズ9 UI微調整基準（余白・トグル・トリガーの簡素化）:**
   - UI微調整は「機能を増やさず、既存の見た目と操作感を崩さない」ことを方針とする。レイアウト・影・`backdrop-blur`・半透明背景はフェーズ3／8基準を維持し、必要最小限のクラス変更に留める。
   - ドロップダウントリガーは極限まで簡素化する。推しカラー切替の閉じた状態のトリガーは「現在カラーの色丸＋下向き矢印（∨）」のみとし、`shortName`（ミク／テト等）のテキストは表示しない。丸みのあるコンパクトなfixedサイズ（`rounded-full`＋正方形の `h-*`/`w-*`）にしてヘッダー右側の他要素と重ならないように配置し、hover／focus-visible時にアクセントの枠線・リングで分かりやすくハイライトする。ドロップダウンを開いた後の選択メニュー内では、従来どおり各カラーのキャラクター名（`name`: 初音ミク、重音テトなど）をテキストで表示する。
   - ボーダー／トグルの余白ルール: トグルスイッチのトラックはON/OFFで寸法が変わらないよう両状態とも同じ `border` 幅を確保し、稼働する丸パーツ（つまみ）は `left`/`top` と `translate-*` を固定値で指定してトラック内側に完全に収める（はみ出し・枠線との重なり禁止）。ラベル側には `min-w-0 flex-1`、カード側には十分な左右パディングと `gap-*` を設け、サブテキストとトグルが重ならない横スペースを必ず確保する。

## 4. 外部API（VocaDB API）レート制限・安全性ルール
- 事前データ取得スクリプト（`scripts/fetch-vocadb.ts`）では、各リクエスト間に必ず **1,500ms 以上のスリープ** を入れ、`User-Agent` ヘッダーを付与し、429エラー時は指数バックオフ（10s→30s→60s）でリトライすること。
- フロントエンドのリアルタイム検索（`src/utils/vocadbApi.ts`）では、**600ms のデバウンス**と**メモリキャッシュ**を必ず実装し、連続リクエストを防ぐこと。
- 正規化済み楽曲データ型（`VocaSong`）をすべてのコンポーネント・スクリプトで厳密に共有すること。

## 5. 本番URL・OGP／ファビコン構成（フェーズ10）
- **本番URL:** `https://voca-dig.vercel.app`（OGP・Twitterカードの絶対URLはすべてこのドメインで統一する）。
- **SNS・Discord共有時のプレビュー:** `index.html` の `<head>` で Open Graph（OGP）タグと Twitter Card タグを管理する。
  - OGP: `og:type=website` / `og:site_name=VocaDig` / `og:title` / `og:description` / `og:url=https://voca-dig.vercel.app/` / `og:image=https://voca-dig.vercel.app/ogp.png` / `og:image:width=1200` / `og:image:height=630`（`og:locale=ja_JP` も併記）。
  - Twitter Card: `twitter:card=summary_large_image` / `twitter:title` / `twitter:description` / `twitter:image=https://voca-dig.vercel.app/ogp.png`。
  - 画像は `public/ogp.png`（1200×630 比率）を配置して配信する。未配置でもビルドを失敗させず、メタタグ記述は完了させる。
- **ファビコン:** `public/favicon.svg` をブラウザタブ用アイコンとして使用し、`index.html` に `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`（および `apple-touch-icon`）を設定する。
  - デザインはブランドカラーのミクシアン（`#06b6d4` / `#0891b2`）を基調とした角丸クリアアクリルガラス風アイコンに、シャープな白い「V」をあしらう。外側の発光シャドウは付けず、半透明白枠線と内側ハイライトで質感を表現する（フェーズ8のアクリル基準に準拠）。
