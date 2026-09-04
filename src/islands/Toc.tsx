import { useEffect } from 'preact/hooks';
import { BILINGUAL_EVENT } from '@/lib/bilingual';
import { filterHeadings, isDepth, type Depth, type TocHeading } from '@/lib/depth';
import type { BilingualMode } from '@/lib/prefs';
import { DEPTH_EVENT } from '@/islands/DepthDial';

export interface TocProps {
  /** Localised copy. Islands never import `t`: the locale is a page-level fact. */
  labels: {
    /** Prefix a deep-only entry carries, so the reader knows why it is dimmed. */
    deep: string;
  };
}

/** The depth a heading declares, written onto it by `rehype-depth-headings`. */
function levelOf(heading: Element): Depth {
  const value = heading.getAttribute('data-depth');
  return isDepth(value) ? value : 'standard';
}

/**
 * The table of contents in the right rail — the `.toc` block of docs/design/mockups/Topic.dc.html.
 *
 * The page already rendered the list from `render(entry).headings`, so a reader without
 * JavaScript gets a complete table of contents. What the server cannot know is which heading sits
 * inside a `<Depth level="deep">` block: that lives in the rendered article as `data-depth` on the
 * heading. So this island reads the article, reconciles the list with it, and from then on keeps
 * the two in step — hiding what the current depth hides, dimming what Deep would add, and marking
 * the section being read.
 *
 * It patches the server's markup rather than owning it, which is why it renders nothing itself.
 */
export default function Toc({ labels }: TocProps) {
  useEffect(() => {
    const article = document.getElementById('article');
    const nav = document.querySelector<HTMLElement>('[data-toc-nav]');
    if (!article || !nav) return;

    /* The two anchors that are not headings: the answer at the top and the checkpoint at the
       bottom. They are what Quick mode leaves in the contents, and the elements they point at are
       given their ids here because both are rendered by components that know nothing of the TOC. */
    const fixed = new Map<string, HTMLAnchorElement>();
    for (const anchor of nav.querySelectorAll<HTMLAnchorElement>('[data-toc-fixed]')) {
      const name = anchor.dataset.tocFixed ?? '';
      const target = article.querySelector(name === 'tldr' ? '.tldr' : '[data-checkpoint]');
      if (target) {
        if (!target.id) target.id = name;
        anchor.href = `#${target.id}`;
        fixed.set(name, anchor);
      } else {
        // Nothing to link to on this topic: the anchor goes rather than pointing nowhere.
        anchor.remove();
      }
    }

    const levels = new Map<string, Depth>();
    for (const heading of article.querySelectorAll('h2[id], h3[id]'))
      levels.set(heading.id, levelOf(heading));

    const anchors = [...nav.querySelectorAll<HTMLAnchorElement>('[data-toc]')];
    const headings: TocHeading[] = anchors.map((anchor) => ({
      slug: anchor.dataset.toc ?? '',
      text: anchor.textContent ?? '',
      depth: Number(anchor.dataset.tocLevel ?? 2),
      level: levels.get(anchor.dataset.toc ?? '') ?? 'standard',
    }));

    // Deep-only entries are named as such, as in the mockup: "deep · How CPython stores cells".
    for (const [index, heading] of headings.entries()) {
      const anchor = anchors[index];
      if (!anchor || heading.level !== 'deep' || anchor.querySelector('.toc-deep')) continue;
      const marker = document.createElement('span');
      marker.className = 'lbl toc-deep';
      marker.textContent = `${labels.deep} · `;
      anchor.prepend(marker);
    }

    const apply = (mode: Depth) => {
      const shown = new Map(filterHeadings(headings, mode).map((heading) => [heading.slug, heading]));
      for (const [index, anchor] of anchors.entries()) {
        const heading = shown.get(headings[index]?.slug ?? '');
        anchor.hidden = !heading;
        anchor.classList.toggle('deep', Boolean(heading?.dimmed));
      }
      // The answer is the whole page at Quick depth, so that is when it earns a line of its own.
      const tldr = fixed.get('tldr');
      if (tldr) tldr.hidden = mode !== 'quick';
    };

    /** Mirrors alternate heading subtitles into the server-rendered TOC anchors. */
    const applyBilingual = (mode: BilingualMode) => {
      for (const [index, anchor] of anchors.entries()) {
        anchor.querySelector(':scope > .toc-bi')?.remove();
        if (mode === 'off') continue;
        const slug = headings[index]?.slug;
        if (!slug) continue;
        const heading = article.querySelector<HTMLElement>(`#${CSS.escape(slug)}`);
        const text = heading?.dataset.biH;
        if (!text) continue;
        const subtitle = document.createElement('span');
        subtitle.className = 'bi-h toc-bi';
        const headingSubtitle = heading.querySelector<HTMLElement>(':scope > .bi-h');
        subtitle.lang = headingSubtitle?.lang ?? '';
        const alternateFirst = heading.hasAttribute('data-bi-alt-first');
        subtitle.textContent = alternateFirst ? text : ` ${text}`;
        if (alternateFirst) {
          const deep = anchor.querySelector(':scope > .toc-deep');
          if (deep) deep.after(subtitle);
          else anchor.prepend(subtitle);
        } else {
          anchor.append(subtitle);
        }
      }
    };

    const current = article.getAttribute('data-depth-mode');
    apply(isDepth(current) ? current : 'standard');
    const bilingual = article.getAttribute('data-bilingual');
    applyBilingual(bilingual === 'en-zh' || bilingual === 'zh-en' ? bilingual : 'off');

    const onDepth = (event: Event) => {
      const detail = (event as CustomEvent<Depth>).detail;
      apply(isDepth(detail) ? detail : 'standard');
      scheduleMark();
    };
    document.addEventListener(DEPTH_EVENT, onDepth);
    const onBilingual = (event: Event) => {
      const detail = (event as CustomEvent<BilingualMode>).detail;
      applyBilingual(detail === 'en-zh' || detail === 'zh-en' ? detail : 'off');
      scheduleMark();
    };
    document.addEventListener(BILINGUAL_EVENT, onBilingual);

    /* Which section is being read. The band the observer watches is the top of the viewport, so
       the active entry is the heading the reader is under rather than the one about to enter from
       below. A fast scroll can jump the band entirely, so when nothing is inside it the last
       heading above the fold is used instead. */
    const visible = new Set<string>();

    const lastAbove = (): TocHeading | undefined => {
      let found: TocHeading | undefined;
      for (const [index, heading] of headings.entries()) {
        const element = document.getElementById(heading.slug);
        // A heading the current depth hides has no box, and is not what the reader is under.
        if (anchors[index]?.hidden || !element || element.getClientRects().length === 0) continue;
        if (element.getBoundingClientRect().top <= 120) found = heading;
      }
      return found;
    };

    const mark = () => {
      const active = headings.find((heading) => visible.has(heading.slug)) ?? lastAbove();
      if (!active) return;
      for (const [index, anchor] of anchors.entries())
        anchor.classList.toggle('on', headings[index]?.slug === active.slug);
    };

    let frame = 0;
    const scheduleMark = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        mark();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        scheduleMark();
      },
      { rootMargin: '-80px 0px -65% 0px' },
    );
    for (const heading of article.querySelectorAll('h2[id], h3[id]')) observer.observe(heading);

    /* The observer only reports crossings, and a jump — an in-page link, a restored scroll
       position, a flick of the wheel — can skip the band entirely, so the scroll is watched too.
       One frame at a time is enough for a class swap. */
    const onScroll = scheduleMark;
    addEventListener('scroll', onScroll, { passive: true });
    scheduleMark();

    return () => {
      observer.disconnect();
      removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener(DEPTH_EVENT, onDepth);
      document.removeEventListener(BILINGUAL_EVENT, onBilingual);
    };
  }, [labels]);

  return null;
}
