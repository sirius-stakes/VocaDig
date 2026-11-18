# VocaDig（ボカディグ）

ムード・BPM・音声ライブラリでの条件検索（Filter Dig）と、好きな曲からの類似度スコアリング推薦（Like-to-Dig）を備えた、ボカロ曲ディグ（発掘）Webアプリケーションです。

- **技術スタック:** Vite + React + TypeScript + Tailwind CSS
- **データ戦略:** 静的JSON（`public/data/songs.json`）＋ VocaDB公開API

## 現在のステータス

**Phase 2: 検索・レコメンドエンジン × メインUI** 完了

- ライト／ダークモード切替（`html.dark`・`localStorage`・OS設定追従）
- 条件ディグ（Filter Dig）: キーワード、タグAND/OR、BPMレンジ、音声ライブラリ、6種の並び替え
- 好きな曲から推薦（Like-to-Dig）: タグ重み（共通タグは2.5倍）・BPM近接・音声ライブラリ一致ボーナス
- VocaDBリアルタイム検索: 600msデバウンス＋メモリキャッシュでレート制限に配慮
- マイリスト（`localStorage` 保存）、URLパラメータとの検索条件同期、モバイルドロワー対応

**Phase 1: データ基盤** 完了

- VocaSong 型・マスターデータ（音声ライブラリ / キュレーションタグ / ストップワード）
- VocaDB API レスポンスの正規化ロジック（`src/utils/vocadbMapper.ts`）
- レート制限・リトライ・中間キャッシュ対応のデータ取得スクリプト
- 初期データ `public/data/songs.json` の生成

## コマンド

```bash
# 依存関係のインストール
npm install

# VocaDBから初期データを取得（レート制限1.8秒 / 429・5xx時は指数バックオフ）
npm run fetch-data

# 型チェック＋プロダクションビルド（動作確認はこちらを使用）
npm run build
```

### データ取得について

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
    SongCard.tsx               # 楽曲カード（マッチ度・一致タグ表示）
    MyListDrawer.tsx           # マイリストドロワー
  hooks/
    useTheme.ts                # ライト／ダークモード管理
    useSongCatalog.ts          # songs.json 読み込み
    useMyList.ts               # マイリスト永続化
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
public/data/
  songs.json                   # 生成済み初期データ
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

## データ出典

楽曲データは [VocaDB](https://vocadb.net) の公開APIを利用しています。
