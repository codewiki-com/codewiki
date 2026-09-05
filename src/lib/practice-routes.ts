/** Shared `getStaticPaths` for `/practice/{track}/` and its `/zh/` twin. */
import { TRACKS, type Track } from '@/data/tracks';
import { listPracticeItems } from '@/lib/practice';

/**
 * One route per track that actually has exercises. A track with an empty catalogue gets no page,
 * so the hub never links at an empty grid and the sitemap never lists one.
 */
export async function practiceTrackPaths(): Promise<
  { params: { track: string }; props: { track: Track } }[]
> {
  const items = await listPracticeItems();
  const present = new Set(items.map((item) => item.track));
  return TRACKS.filter((track) => present.has(track.slug)).map((track) => ({
    params: { track: track.slug },
    props: { track },
  }));
}
