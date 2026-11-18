import { CURATED_TAG_BY_EN_NAME } from '../constants/masterData';
import { normalizeTagName } from './vocadbMapper';

/** 秒数を mm:ss 形式にする（0以下は --:--） */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/** BPM 未登録は「--」と表示する */
export function formatBpm(bpm: number | null): string {
  return bpm === null ? '--' : String(Math.round(bpm));
}

/** 数値を日本語ロケールで区切る */
export function formatCount(value: number): string {
  return value.toLocaleString('ja-JP');
}

/** 英語タグ名をキュレーション済みの日本語表記へ変換する */
export function tagDisplayName(tag: string): string {
  const normalized = normalizeTagName(tag);
  return CURATED_TAG_BY_EN_NAME.get(normalized)?.name ?? normalized;
}

/** 秒数を「3分16秒」形式にする */
export function formatDurationLong(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '不明';
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}分${rest}秒`;
}
