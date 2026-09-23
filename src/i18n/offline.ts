/**
 * The strings the offline surfaces use — the update notice, the two Save buttons and the
 * `/offline/` page.
 *
 * They are deliberately NOT in `en.ts`/`zh.ts`. Every island imports `@/i18n`, so that dictionary
 * is bundled into a chunk every page downloads, and both locales of it already cost about 18 KB
 * gzipped against a 60 KiB topic-page script budget with almost nothing left over. These strings
 * are only ever read in `.astro` frontmatter, which runs at build time, so keeping them in their
 * own module means the feature adds no client JavaScript at all.
 *
 * Both locales sit on one key here rather than in two parallel files: with one entry per string,
 * a missing translation is a type error rather than something a parity test has to catch.
 */
import type { Locale } from '@/lib/urls';

const STRINGS = {
  update: { en: 'A new version is available', zh: '有新版本可用' },
  reload: { en: 'Reload', zh: '重新加载' },
  saveTrack: { en: 'Save this track offline', zh: '离线保存本方向' },
  saveRuntimes: {
    en: 'Download runtimes for offline (≈{mb} MB)',
    zh: '下载离线运行环境（约{mb} MB）',
  },
  saving: { en: 'Saving… {done}/{total}', zh: '正在保存… {done}/{total}' },
  savedPages: { en: 'Saved · {n} pages', zh: '已保存 · {n}个页面' },
  savedRuntimes: { en: 'Runtimes saved · {mb} MB', zh: '运行环境已保存 · {mb} MB' },
  remove: { en: 'Remove', zh: '移除' },
  failed: { en: 'Some files could not be saved. Try again.', zh: '部分文件未能保存，请重试。' },
  label: { en: 'offline', zh: '离线' },
  title: { en: 'You are offline', zh: '你当前处于离线状态' },
  lead: {
    en: 'The network is unreachable. Pages you have already opened, and any track you saved for offline reading, still work; everything else needs the connection back.',
    zh: '网络暂时不可用。你打开过的页面，以及已离线保存的学习方向，仍然可以正常阅读；其余页面需要恢复联网后才能打开。',
  },
  saved: {
    en: 'To read on a plane or a train, open a track and press “Save this track offline” before you leave.',
    zh: '想在飞机或火车上阅读，请在出发前打开学习方向页并点击“离线保存本方向”。',
  },
  retry: { en: 'Try again', zh: '重试' },
  home: { en: 'Go to the home page', zh: '返回首页' },
} as const;

export type OfflineKey = keyof typeof STRINGS;

/** Same contract as `t()`: looks up a string and fills `{var}` slots, leaving unknown ones visible. */
export function tOffline(
  locale: Locale,
  key: OfflineKey,
  vars: Record<string, string | number> = {},
): string {
  return STRINGS[key][locale].replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
