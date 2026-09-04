import { cardSources, type Flashcard, type Flashcards, type Prefs } from '@/lib/prefs';
import { isDue } from '@/lib/srs';

export type CardRef =
  { kind: 'term'; term: string } | { kind: 'quiz'; bank: string; item: string; line?: number };

export interface GlossaryCardTerm {
  id: string;
  en: string;
  zh: string;
  short: { en: string; zh: string };
  topics?: string[];
}

interface LocalizedText {
  en: string;
  zh: string;
}

export interface QuizCardItem {
  id: string;
  type?: string;
  prompt?: LocalizedText;
  explanation?: LocalizedText;
  code?: string;
  url?: string;
  answer?: string;
  options?: Array<{ text?: LocalizedText; correct?: boolean }>;
  issues?: Array<{ line?: number; lines?: number; note?: LocalizedText }>;
}

export interface QuizCardBank {
  id: string;
  topic?: string;
  items: QuizCardItem[];
}

/** Public prompt data and the answer-bearing sibling fetched only by the review island. */
export interface QuizCardSources {
  public?: QuizCardBank;
  answers?: QuizCardBank;
}

export type QuizCardBanks = Record<string, QuizCardSources>;

export interface CardFaceLink {
  href: string;
  kind: 'section' | 'glossary' | 'practice';
}

export interface CardFace {
  front: { title: string; alt?: string; cue: string; code?: string };
  back: { text: string; textZh?: string; code?: string; links: CardFaceLink[] };
}

/** Parses a stable card id, including ReviewKata's optional per-issue line suffix. */
export function parseRef(ref: string): CardRef | undefined {
  const term = /^glossary:([^:#]+)$/.exec(ref);
  if (term?.[1]) return { kind: 'term', term: term[1] };

  const quiz = /^quiz:([^#]+)#([^:]+)(?::([1-9]\d*))?$/.exec(ref);
  if (!quiz?.[1] || !quiz[2]) return undefined;
  return {
    kind: 'quiz',
    bank: quiz[1],
    item: quiz[2],
    ...(quiz[3] ? { line: Number(quiz[3]) } : {}),
  };
}

function dueTime(card: Flashcard): number {
  const parsed = Date.parse(card.due);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

/** Source-visible, active cards with everything currently due ahead of future cards. */
export function visibleDeck(deck: Flashcards, prefs: Prefs, now: Date): Flashcard[] {
  const enabled = cardSources(prefs);
  const cards = Array.isArray(deck?.cards) ? deck.cards : [];
  return cards
    .filter((card): card is Flashcard => Boolean(card) && typeof card === 'object')
    .filter((card) => {
      const source = card.source ?? (card.kind === 'term' ? 'terms' : 'quiz');
      return !card.suspended && enabled[source] !== false;
    })
    .slice()
    .sort((a, b) => Number(isDue(b, now)) - Number(isDue(a, now)) || dueTime(a) - dueTime(b));
}

function localized(value: unknown): LocalizedText | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const text = value as Partial<LocalizedText>;
  return typeof text.en === 'string' && typeof text.zh === 'string'
    ? { en: text.en, zh: text.zh }
    : undefined;
}

function joinAnswer(answer: string | undefined, explanation: string | undefined): string {
  return [answer, explanation].filter(Boolean).join('\n\n');
}

function answerFor(item: QuizCardItem, line?: number): LocalizedText | undefined {
  if (line !== undefined) {
    const issue = item.issues?.find(
      (candidate) =>
        typeof candidate.line === 'number' &&
        line >= candidate.line &&
        line <= (candidate.lines ?? candidate.line),
    );
    return localized(issue?.note);
  }

  const correct = item.options?.find((option) => option.correct === true);
  const option = localized(correct?.text);
  if (option) return option;

  if (typeof item.answer === 'string') return { en: item.answer, zh: item.answer };

  const issues = (item.issues ?? []).map((issue) => localized(issue.note)).filter(Boolean) as LocalizedText[];
  if (issues.length > 0) {
    return {
      en: issues.map((issue) => issue.en).join('\n'),
      zh: issues.map((issue) => issue.zh).join('\n'),
    };
  }
  return undefined;
}

/** Resolves the bilingual front and back without reading the network or browser storage. */
export function faceOf(
  card: Flashcard,
  glossary: readonly GlossaryCardTerm[],
  banks: QuizCardBanks,
): CardFace | undefined {
  const parsed = parseRef(card.ref);
  if (!parsed) return undefined;

  if (parsed.kind === 'term') {
    const term = glossary.find((candidate) => candidate.id === parsed.term);
    if (!term) return undefined;
    const topic = term.topics?.find((candidate) => candidate.includes('/'));
    return {
      front: {
        title: term.en,
        alt: term.zh,
        cue: 'Define this term before you flip.',
      },
      back: {
        text: term.short.en,
        textZh: term.short.zh,
        links: [
          ...(topic ? [{ href: `/${topic}/`, kind: 'section' as const }] : []),
          { href: `/glossary/${term.id}/`, kind: 'glossary' },
        ],
      },
    };
  }

  const sources = banks[parsed.bank];
  const publicItem = sources?.public?.items.find((item) => item.id === parsed.item);
  const answerItem = sources?.answers?.items.find((item) => item.id === parsed.item);
  const prompt = localized(publicItem?.prompt) ?? localized(answerItem?.prompt);
  if (!prompt || !answerItem) return undefined;

  const answer = answerFor(answerItem, parsed.line);
  const explanation = localized(answerItem.explanation);
  const url = publicItem?.url;
  return {
    front: {
      title: prompt.en,
      alt: prompt.zh,
      cue: 'Answer before you flip.',
      ...(publicItem?.code || answerItem.code ? { code: publicItem?.code ?? answerItem.code } : {}),
    },
    back: {
      text: joinAnswer(answer?.en, explanation?.en),
      ...(answer?.zh || explanation?.zh ? { textZh: joinAnswer(answer?.zh, explanation?.zh) } : {}),
      ...(answerItem.code ? { code: answerItem.code } : {}),
      links: url ? [{ href: url, kind: 'practice' }] : [],
    },
  };
}
