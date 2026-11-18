import { useEffect, useState } from 'react';
import { CURATED_TAGS, VOICEBANKS } from './constants/masterData';
import type { TagCategory, VocaSong } from './types/song';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'vocadig-theme';

const TAG_CATEGORY_LABEL: Record<TagCategory, string> = {
  mood: 'ムード',
  genre: 'ジャンル',
  instrument: '楽器',
  tempo_style: 'テンポ・スタイル',
};

const TAG_CATEGORY_STYLE: Record<TagCategory, string> = {
  mood: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  genre: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  instrument: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  tempo_style: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

interface DataStats {
  total: number;
  withBpm: number;
  withPv: number;
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // localStorage が使えない場合はライトテーマにする
  }
  return 'light';
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // 保存できなくてもテーマ切替自体は機能させる
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}data/songs.json`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as VocaSong[];
      })
      .then((songs) => {
        if (cancelled) return;
        setStats({
          total: songs.length,
          withBpm: songs.filter((song) => song.bpm !== null).length,
          withPv: songs.filter((song) => song.pvs.length > 0).length,
        });
      })
      .catch(() => {
        if (!cancelled) setDataError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const formatCount = (value: number | null) =>
    value === null ? '—' : value.toLocaleString('ja-JP');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-black text-white shadow-lg shadow-cyan-500/20">
              V
            </div>
            <div>
              <p className="text-base font-bold leading-tight">VocaDig</p>
              <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                VOCALOID SONG DIGGER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 sm:inline-flex">
              Phase 1 / Data Foundation
            </span>
            <button
              type="button"
              onClick={() =>
                setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
              }
              aria-label={
                theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
            >
              {theme === 'dark' ? (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/10 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Filter Dig × Like-to-Dig
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                掘るほど、
                <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  好きになる。
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                ムード・BPM・音声ライブラリから条件検索する「Filter Dig」と、
                好きな曲のタグやBPMから類似曲を探す「Like-to-Dig」。
                ボカロ曲の発掘体験を、もっと自由に。
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {['ムード検索', 'BPMレンジ', '音声ライブラリ', '類似度レコメンド'].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>

              <div className="mt-7 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                  Phase 1 完了:
                </span>{' '}
                VocaSong型・マスターデータ・正規化ロジック・VocaDB取得スクリプトと初期データを整備しました。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              label="収録楽曲"
              value={dataError ? '未取得' : formatCount(stats?.total ?? null)}
              hint="VocaDB 正規化済み"
              accent="text-cyan-600 dark:text-cyan-400"
            />
            <StatCard
              label="BPM登録"
              value={dataError ? '—' : formatCount(stats?.withBpm ?? null)}
              hint="BPMフィルタ対応"
              accent="text-teal-600 dark:text-teal-400"
            />
            <StatCard
              label="PVあり"
              value={dataError ? '—' : formatCount(stats?.withPv ?? null)}
              hint="YouTube / ニコニコ"
              accent="text-violet-600 dark:text-violet-400"
            />
            <StatCard
              label="音声ライブラリ"
              value={formatCount(VOICEBANKS.length)}
              hint="マスター定義済み"
              accent="text-fuchsia-600 dark:text-fuchsia-400"
            />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">音声ライブラリ</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {VOICEBANKS.length} 件
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              主要ボカロ・UTAU・CeVIO系ライブラリをVocaDBアーティストIDで照合します。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {VOICEBANKS.map((voicebank) => (
                <span
                  key={voicebank.id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    color: voicebank.color,
                    borderColor: `${voicebank.color}66`,
                    backgroundColor: `${voicebank.color}14`,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: voicebank.color }}
                  />
                  {voicebank.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">キュレーションタグ</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {CURATED_TAGS.length} 件
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              VocaDBの英語タグと対応付け、AND / OR検索に利用します。
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {CURATED_TAGS.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{tag.name}</p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {tag.enName}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TAG_CATEGORY_STYLE[tag.category]}`}
                  >
                    {TAG_CATEGORY_LABEL[tag.category]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">データパイプライン</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'VocaDB取得',
                text: '人気・トレンド・タグ・Hidden Gemの4バケット。1.8秒間隔と指数バックオフを厳守。',
              },
              {
                step: '02',
                title: '正規化',
                text: 'VocaSongへ変換。BPM・PV・制作者・音声ライブラリを安全に抽出。',
              },
              {
                step: '03',
                title: 'タグ精製',
                text: '汎用ストップワードを除外し、ムードやジャンルだけを特徴タグとして保持。',
              },
              {
                step: '04',
                title: '静的JSON',
                text: 'song.idで重複排除し public/data/songs.json へ出力。SPAから高速に参照。',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs font-black tracking-widest text-cyan-600 dark:text-cyan-400">
                  {item.step}
                </p>
                <p className="mt-2 text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>VocaDig — Phase 1: Data Foundation</p>
          <p>データ出典: VocaDB (https://vocadb.net)</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
