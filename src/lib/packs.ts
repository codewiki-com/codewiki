/** Pure assembly and size-bounded splitting for section context packs. */
import { SITE } from '@/data/site';
import { getSection, getTrack } from '@/data/tracks';

export const PACK_LIMIT = 1_000_000;
const SEPARATOR = '\n\n---\n\n';

export interface PackTopic {
  track: string;
  section: string;
  title: string;
  url: string;
  markdown: string;
}

export interface ContextPackFile {
  track: string;
  section: string;
  filename: string;
  url: string;
  body: string;
}

const bytes = (value: string): number => new TextEncoder().encode(value).byteLength;

/** Split a sequence without reordering it. Separators count toward the byte limit. */
export function splitPack(parts: string[], limit = PACK_LIMIT): string[] {
  if (!Number.isFinite(limit) || limit < 1) throw new RangeError('Pack limit must be positive');
  const output: string[] = [];
  let current = '';

  const push = () => {
    if (!current) return;
    output.push(current);
    current = '';
  };

  for (const source of parts) {
    let part = source.trim();
    if (!part) continue;

    const joined = current ? `${current}${SEPARATOR}${part}` : part;
    if (bytes(joined) <= limit) {
      current = joined;
      continue;
    }
    push();

    // A single unusually large topic still has to respect the endpoint's hard byte budget.
    while (bytes(part) > limit) {
      let low = 1;
      let high = part.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (bytes(part.slice(0, middle)) <= limit) low = middle;
        else high = middle - 1;
      }
      let end = low;
      const code = part.charCodeAt(end - 1);
      if (code >= 0xd800 && code <= 0xdbff) end -= 1;
      output.push(part.slice(0, end));
      part = part.slice(end).trimStart();
    }
    current = part;
  }
  push();
  return output;
}

function titleFor(track: string, section: string): string {
  const trackEntry = getTrack(track);
  const sectionEntry = getSection(trackEntry ?? track, section);
  return `${trackEntry?.name.en ?? track}: ${sectionEntry?.name.en ?? section} context pack`;
}

function header(topics: PackTopic[], filenames: string[]): string {
  const first = topics[0]!;
  const topicLines = topics.map((topic) => `- [${topic.title}](${topic.url})`).join('\n');
  const partLines =
    filenames.length > 1
      ? `\n\n## Parts\n\n${filenames
          .map((filename, index) => `- [Part ${index + 1}](${SITE.url}/packs/${first.track}/${filename})`)
          .join('\n')}`
      : '';
  return `# ${titleFor(first.track, first.section)}\n\nReviewed codewiki topics, concatenated as plain Markdown.\n\n## Topics\n\n${topicLines}${partLines}`;
}

/** Build the one file, or numbered files, served for a reviewed track section. */
export function buildContextPackFiles(topics: PackTopic[], limit = PACK_LIMIT): ContextPackFile[] {
  if (topics.length === 0) return [];
  const [{ track, section }] = topics;
  if (topics.some((topic) => topic.track !== track || topic.section !== section)) {
    throw new Error('A context pack can only contain one track section');
  }

  const parts = topics.map((topic) => topic.markdown.trim());
  let chunks = splitPack(parts, limit);
  let filenames: string[] = [];
  let packHeader = '';

  // The part list changes the header size. Recompute until the number of parts settles.
  for (let pass = 0; pass < 4; pass += 1) {
    filenames =
      chunks.length === 1 ? [`${section}.md`] : chunks.map((_, index) => `${section}-${index + 1}.md`);
    packHeader = header(topics, filenames);
    const contentLimit = limit - bytes(packHeader) - bytes(SEPARATOR);
    if (contentLimit < 1) throw new RangeError('Pack header exceeds the configured byte limit');
    const next = splitPack(parts, contentLimit);
    if (next.length === chunks.length) {
      chunks = next;
      break;
    }
    chunks = next;
  }

  filenames =
    chunks.length === 1 ? [`${section}.md`] : chunks.map((_, index) => `${section}-${index + 1}.md`);
  packHeader = header(topics, filenames);

  return chunks.map((chunk, index) => {
    const filename = filenames[index]!;
    return {
      track,
      section,
      filename,
      url: `${SITE.url}/packs/${track}/${filename}`,
      body: `${packHeader}${SEPARATOR}${chunk}\n`,
    };
  });
}
