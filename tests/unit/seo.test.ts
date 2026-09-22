import {
  buildHead,
  breadcrumbLd,
  websiteLd,
  techArticleLd,
  courseLd,
  definedTermLd,
  definedTermSetLd,
  faqPageLd,
} from '@/lib/seo';
import { stripMarkdown } from '@/lib/md';

describe('buildHead', () => {
  it('describes the image and other locale on social cards', () => {
    const head = buildHead({
      locale: 'zh',
      path: '/zh/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
    });
    expect(head.og['og:locale:alternate']).toBe('en_US');
    expect(head.og['og:image:type']).toBe('image/png');
    expect(head.og['og:image:alt']).toBe('Python｜CodeWiki');
    expect(head.twitter['twitter:image:alt']).toBe(head.og['og:image:alt']);
  });

  it('describes a reused home card without claiming it contains the practice title', () => {
    const head = buildHead({
      locale: 'en',
      path: '/practice/',
      title: 'Practice',
      description: 'd',
      kind: 'page',
      ogImagePath: '/og/home.png',
    });
    expect(head.og['og:image:alt']).toBe('CodeWiki · Master code in the AI era');
  });

  it('publishes article metadata without inventing a publication date', () => {
    const head = buildHead({
      locale: 'en',
      path: '/python/closures/',
      title: 'Closures',
      description: 'd',
      kind: 'topic',
      article: { modifiedTime: '2026-09-04', section: 'Functions', tags: ['closures', 'scope'] },
    });
    expect(head.og['article:modified_time']).toBe('2026-09-04');
    expect(head.og['article:section']).toBe('Functions');
    expect(head.og['article:tag']).toEqual(['closures', 'scope']);
    expect(head.og).not.toHaveProperty('article:published_time');
  });

  it('formats titles per locale', () => {
    expect(
      buildHead({
        locale: 'en',
        path: '/python/closures/',
        title: 'Closures',
        description: 'd',
        kind: 'topic',
        trackName: 'Python',
      }).title,
    ).toBe('Closures · Python · CodeWiki');
    expect(
      buildHead({
        locale: 'zh',
        path: '/zh/python/closures/',
        title: '闭包',
        description: 'd',
        kind: 'topic',
        trackName: 'Python',
      }).title,
    ).toBe('闭包｜Python｜CodeWiki');
    expect(buildHead({ locale: 'en', path: '/', title: '', description: 'd', kind: 'home' }).title).toBe(
      'CodeWiki · Master code in the AI era',
    );
  });
  it('emits canonical and three alternates', () => {
    const h = buildHead({
      locale: 'zh',
      path: '/zh/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
    });
    expect(h.canonical).toBe('https://codewiki.com/zh/python/');
    expect(h.alternates).toEqual([
      { hreflang: 'en', href: 'https://codewiki.com/python/' },
      { hreflang: 'zh-Hans', href: 'https://codewiki.com/zh/python/' },
      { hreflang: 'x-default', href: 'https://codewiki.com/python/' },
    ]);
  });
  it('defaults og image to the generated endpoint', () => {
    expect(
      buildHead({
        locale: 'en',
        path: '/python/closures/',
        title: 'Closures',
        description: 'd',
        kind: 'topic',
        trackName: 'Python',
      }).og['og:image'],
    ).toBe('https://codewiki.com/og/python/closures.png');
  });

  it('formats the Chinese home title from the tagline', () => {
    expect(buildHead({ locale: 'zh', path: '/zh/', title: '', description: 'd', kind: 'home' }).title).toBe(
      'CodeWiki · 在 AI 时代精通编程',
    );
  });

  it('formats practice titles with the localized practice label', () => {
    expect(
      buildHead({
        locale: 'en',
        path: '/practice/predict/python/closures/loop/',
        title: 'What does this print?',
        description: 'd',
        kind: 'practice',
      }).title,
    ).toBe('What does this print? · Practice · CodeWiki');
    expect(
      buildHead({
        locale: 'zh',
        path: '/zh/practice/predict/python/closures/loop/',
        title: '会输出什么？',
        description: 'd',
        kind: 'practice',
      }).title,
    ).toBe('会输出什么？ · 练习 · CodeWiki');
  });

  it('omits the middle segment when no track name is given', () => {
    expect(
      buildHead({ locale: 'en', path: '/about/', title: 'About', description: 'd', kind: 'page' }).title,
    ).toBe('About · CodeWiki');
    expect(
      buildHead({ locale: 'zh', path: '/zh/about/', title: '关于', description: 'd', kind: 'page' }).title,
    ).toBe('关于｜CodeWiki');
  });

  it('prefixes the Chinese og image path with /og/zh', () => {
    expect(
      buildHead({
        locale: 'zh',
        path: '/zh/python/closures/',
        title: '闭包',
        description: 'd',
        kind: 'topic',
      }).og['og:image'],
    ).toBe('https://codewiki.com/og/zh/python/closures.png');
    expect(
      buildHead({ locale: 'zh', path: '/zh/', title: '', description: 'd', kind: 'home' }).og['og:image'],
    ).toBe('https://codewiki.com/og/zh/home.png');
    expect(
      buildHead({ locale: 'en', path: '/', title: '', description: 'd', kind: 'home' }).og['og:image'],
    ).toBe('https://codewiki.com/og/home.png');
  });

  it('honours an explicit og image path', () => {
    expect(
      buildHead({
        locale: 'en',
        path: '/python/',
        title: 'Python',
        description: 'd',
        kind: 'track',
        ogImagePath: '/og/custom.png',
      }).og['og:image'],
    ).toBe('https://codewiki.com/og/custom.png');
  });

  it('marks topics as articles and everything else as websites', () => {
    const topic = buildHead({
      locale: 'en',
      path: '/python/closures/',
      title: 'Closures',
      description: 'd',
      kind: 'topic',
    });
    expect(topic.og['og:type']).toBe('article');
    expect(topic.og['og:locale']).toBe('en_US');
    expect(topic.og['og:site_name']).toBe('CodeWiki');
    expect(topic.og['og:url']).toBe('https://codewiki.com/python/closures/');
    expect(topic.og['og:image:width']).toBe('1200');
    expect(topic.og['og:image:height']).toBe('630');
    expect(topic.twitter['twitter:card']).toBe('summary_large_image');

    const track = buildHead({
      locale: 'zh',
      path: '/zh/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
    });
    expect(track.og['og:type']).toBe('website');
    expect(track.og['og:locale']).toBe('zh_CN');
  });

  it('adds a robots directive only when noindex is set', () => {
    const plain = buildHead({
      locale: 'en',
      path: '/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
    });
    expect(plain.robots).toBeUndefined();
    const hidden = buildHead({
      locale: 'en',
      path: '/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
      noindex: true,
    });
    expect(hidden.robots).toBe('noindex, nofollow');
    // An unindexable page is not an alternative of anything, so it advertises no hreflang set.
    expect(plain.alternates).toHaveLength(3);
    expect(hidden.alternates).toEqual([]);
  });

  it('attaches websiteLd on the home page only, then caller-supplied blocks', () => {
    const home = buildHead({ locale: 'en', path: '/', title: '', description: 'd', kind: 'home' });
    expect(home.jsonLd).toHaveLength(1);
    expect((home.jsonLd[0] as { '@type': string })['@type']).toBe('WebSite');

    const track = buildHead({
      locale: 'en',
      path: '/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
    });
    expect(track.jsonLd).toEqual([]);

    const extra = { '@type': 'BreadcrumbList' };
    const withLd = buildHead({
      locale: 'en',
      path: '/python/',
      title: 'Python',
      description: 'd',
      kind: 'track',
      jsonLd: [extra],
    });
    expect(withLd.jsonLd).toEqual([extra]);
  });
});

describe('breadcrumbLd', () => {
  it('numbers positions from 1', () => {
    const ld = breadcrumbLd([
      { name: 'Python', url: 'https://codewiki.com/python/' },
      { name: 'Closures', url: 'https://codewiki.com/python/closures/' },
    ]) as { itemListElement: { position: number }[] };
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });
});

describe('websiteLd', () => {
  it('points the search action at the localized search page', () => {
    const en = websiteLd('en') as {
      '@context': string;
      '@type': string;
      potentialAction: { target: { urlTemplate: string } };
    };
    expect(en['@context']).toBe('https://schema.org');
    expect(en['@type']).toBe('WebSite');
    expect(en.potentialAction.target.urlTemplate).toBe('https://codewiki.com/search/?q={search_term_string}');
    const zh = websiteLd('zh') as { potentialAction: { target: { urlTemplate: string } } };
    expect(zh.potentialAction.target.urlTemplate).toBe(
      'https://codewiki.com/zh/search/?q={search_term_string}',
    );
  });
});

describe('content json-ld builders', () => {
  it('builds a TechArticle, dropping absent optional fields', () => {
    const ld = techArticleLd({
      headline: 'Closures',
      description: 'd',
      url: 'https://codewiki.com/python/closures/',
      dateModified: '2026-01-02',
      inLanguage: 'en',
      section: 'Python',
    }) as Record<string, unknown>;
    expect(ld['@type']).toBe('TechArticle');
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld.dateModified).toBe('2026-01-02');
    expect(ld.articleSection).toBe('Python');
    expect('datePublished' in ld).toBe(false);
    expect('keywords' in ld).toBe(false);
  });

  it('builds Course, DefinedTerm and DefinedTermSet objects', () => {
    const course = courseLd({
      name: 'Python',
      description: 'd',
      url: 'https://codewiki.com/python/',
      inLanguage: 'en',
    }) as Record<string, unknown>;
    expect(course['@type']).toBe('Course');
    expect(course.name).toBe('Python');

    const term = definedTermLd({
      name: 'Closure',
      description: 'd',
      url: 'https://codewiki.com/glossary/closure/',
      inLanguage: 'en',
      termSetUrl: 'https://codewiki.com/glossary/',
    }) as { '@type': string; inDefinedTermSet: { '@id': string } };
    expect(term['@type']).toBe('DefinedTerm');
    expect(term.inDefinedTermSet['@id']).toBe('https://codewiki.com/glossary/');

    const set = definedTermSetLd({ name: 'Glossary', url: 'https://codewiki.com/glossary/' }) as {
      '@type': string;
      '@id': string;
    };
    expect(set['@type']).toBe('DefinedTermSet');
    expect(set['@id']).toBe('https://codewiki.com/glossary/');
  });

  it('builds an FAQPage with accepted answers', () => {
    const faq = faqPageLd([
      { question: 'What is a closure?', answer: 'A function with retained bindings.' },
      { question: 'What is late binding?', answer: 'A name is read when the closure runs.' },
    ]) as {
      '@type': string;
      mainEntity: Array<{
        '@type': string;
        name: string;
        acceptedAnswer: { '@type': string; text: string };
      }>;
    };

    expect(faq['@type']).toBe('FAQPage');
    expect(faq.mainEntity).toHaveLength(2);
    expect(faq.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'What is a closure?',
      acceptedAnswer: { '@type': 'Answer', text: 'A function with retained bindings.' },
    });
  });

  it('strips Markdown formatting to visible text', () => {
    expect(stripMarkdown('**a** `b`')).toBe('a b');
  });
});
