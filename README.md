# VocaDig（ボカディグ）

ムード・BPM・音声ライブラリでの条件検索（**Filter Dig**）と、好きな曲からの類似度スコアリング推薦（**Like-to-Dig**）を備えた、ボカロ曲ディグ（発掘）Webアプリケーションです。

- **技術スタック:** Vite + React + TypeScript + Tailwind CSS
- **データ戦略:** 静的JSON（`public/data/songs.json`）＋ VocaDB公開API
- **データ出典:** [VocaDB](https://vocadb.net)

## 主な機能

### 条件からディグる（Filter Dig）
- キーワード検索（曲名・P名・タグ）
- キュレーション済みタグの **AND / OR** 絞り込み
- BPMレンジ（デュアルスライダー）と「BPM未登録曲を含める」スイッチ
- 音声ライブラリ（初音ミク・鏡音リンなど）での絞り込み
- 人気順／新着順／BPM昇順・降順／隠れた名曲／ランダムの6種ソート

### 好きな曲から推薦（Like-to-Dig）
- シード曲の共通タグ（2.5倍の重み）・平均BPM・音声ライブラリから類似度をスコアリング
- マッチ度（%）と一致タグをカードに表示
- 好みプロファイル（平均BPM・特徴タグ・よく聴く音声ライブラリ）を可視化
- 音声ライブラリ一致ボーナスのON / OFF

### ハイブリッド検索
- 静的JSONのカタログ検索に加えて、VocaDB公開APIからリアルタイム検索
- フロントエンドは **600msデバウンス＋メモリキャッシュ（5分TTL）** でレート制限に配慮
- リアルタイム検索で追加した曲も、そのままシード曲・マイリストとして利用可能

### 試聴ミニプレイヤー
- 楽曲カードの「▶ 試聴」から画面下部にスライドインする固定プレイヤー
- YouTube PVは `youtube-nocookie.com` で埋め込み再生（`autoplay=1`）
- ニコニコ動画のみの曲はサムネイル＋外部リンクボタンで表示
- コンパクト／展開サイズの切り替え、推薦基準への追加、マイリスト保存、閉じる操作
- プレイヤー表示中もスクロール・検索操作を妨げない下部余白設計

### マイリスト
- お気に入り曲を `localStorage`（キー: `vocadig-mylist`）へ永続化
- ヘッダーのマイリストボタンからモーダルで一覧・試聴・削除
- マイリスト内の曲を **まとめて推薦基準に追加** し、類似曲レコメンドへ移行
- 曲名 / アーティスト / URL のテキスト一覧コピー、JSONエクスポート
- 別タブでの変更も `storage` イベントで同期

### テーマ切替
- ライト／ダークモードをヘッダーから切替（`localStorage` キー: `vocadig-theme`）
- 初回訪問時はOSのカラースキームに追従

### OGP・ファビコン
- `index.html` にタイトル・ディスクリプション・OGP / Twitter Card メタデータを設定
- 音楽波形とディグ（虫眼鏡）をモチーフにしたSVGファビコン（`public/favicon.svg`）

## セットアップ

```bash
# 依存関係のインストール
npm install

# 型チェック＋プロダクションビルド（動作確認はこちらを使用）
npm run build
```

> [!NOTE]
> このプロジェクトの開発ルールでは、開発サーバーの常駐起動を禁止しています。動作確認は `npm run build` で行ってください。

## データ更新

```bash
# VocaDBから初期データを取得（public/data/songs.json を更新）
npm run fetch-data
```

`scripts/fetch-vocadb.ts` は以下の4種類のバケットから楽曲を取得し、`song.id` で重複排除します。

1. 王道・人気名曲枠（RatingScore / Original）
2. 2020年以降のトレンド枠
3. ムード・ジャンルタグ別枠（12タグ × 50曲）
4. 隠れた名曲（Hidden Gem）枠

取得結果は `.cache/vocadb-buckets.json` にバケット単位でキャッシュされ、再実行時は取得済みバケットをスキップします。`npm run fetch-data -- --refresh` でキャッシュを無視して再取得できます。

- リクエスト間隔: 1,800ms 以上
- User-Agent: `VocaDig-DataFetcher/1.0`
- 429 / 5xx: 10秒 → 30秒 → 60秒で最大3回リトライ

## ディレクトリ構成

```text
src/
  components/
    Header.tsx                 # ロゴ・モードタブ・マイリスト・テーマ切替
    FilterSidebar.tsx          # タグ / BPM / 音声ライブラリの条件検索
    SeedRecommendSidebar.tsx   # シード検索・VocaDB検索・好みプロファイル
    SongCard.tsx               # 楽曲カード（マッチ度・一致タグ・試聴）
    MiniPlayer.tsx             # 下部固定の試聴ミニプレイヤー
    MyListModal.tsx            # マイリストの一覧・共有・一括シード追加
  hooks/
    useTheme.ts                # ライト／ダークモード管理
    useSongCatalog.ts          # songs.json 読み込み
    useMyList.ts               # マイリスト永続化・テキスト/JSON書き出し
  constants/
    masterData.ts              # 音声ライブラリ・キュレーションタグ・ストップワード
    search.ts                  # 検索初期値・並び替え定義
  types/song.ts                # 共有型（VocaSong など）
  utils/
    vocadbMapper.ts            # VocaDB → VocaSong 正規化
    vocadbApi.ts               # 600msデバウンス＋キャッシュ付きリアルタイム検索
    recommendEngine.ts         # フィルタリング・類似度スコアリング
    urlState.ts                # URLパラメータ同期
    format.ts                  # 表示フォーマット
  App.tsx                      # 全体状態管理・2カラムレイアウト
scripts/
  fetch-vocadb.ts              # 事前データ取得スクリプト
public/
  data/songs.json              # 生成済み初期データ
  favicon.svg                  # アプリファビコン
```

## 検索条件のURLパラメータ

検索条件はURLに同期されます（履歴は増やしません）。

| パラメータ | 内容 | 例 |
| --- | --- | --- |
| `mode` | 表示モード | `similar` |
| `q` | キーワード | `wowaka` |
| `tags` | タグ（カンマ区切り） | `rock,melancholic` |
| `tagMode` | タグの一致条件 | `and` |
| `voicebanks` | 音声ライブラリID | `1,3` |
| `bpmMin` / `bpmMax` | BPMレンジ | `120` / `200` |
| `unknownBpm` | BPM未登録曲を含めない場合 `0` | `0` |
| `sort` | 並び順 | `hidden_gem` |

## 実装フェーズ

- **Phase 1:** データ基盤（VocaSong型・正規化・データ取得スクリプト）
- **Phase 2:** 検索・レコメンドエンジン × メインUI
- **Phase 3:** 試聴ミニプレイヤー・マイリスト共有・OGP・README整備

## ライセンス・注意事項

楽曲データは VocaDB の公開APIを利用しています。各楽曲・動画の権利は原作者および各配信サイトに帰属します。試聴はYouTube / ニコニコ動画の公式埋め込み・リンクを利用しています。
