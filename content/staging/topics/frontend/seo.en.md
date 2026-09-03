---
title: Frontend SEO Optimization
description: Learn frontend SEO optimization techniques and best practices
track: frontend
section: performance
difficulty: intermediate
tags:
  - SEO
  - optimization
  - meta tags
  - structured data
status: imported
origin: old/src/content/docs/frontend/seo.en.md
divergence: 0.214
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: Optimization
  order: 49
  lastUpdated: 2026-01-07
---

## Introduction

Search Engine Optimization (SEO) is the practice of optimizing web pages to rank higher in search engine results pages (SERPs). For frontend developers, understanding and implementing SEO best practices is crucial for building discoverable, accessible, and high-performing websites.

Modern SEO extends far beyond keywords and backlinks. It encompasses technical implementation, user experience metrics, structured data, and rendering strategies. We cover the essential frontend SEO techniques that every web developer should master.

### Why Frontend SEO Matters

1. **Organic Traffic** - Higher rankings lead to more visitors without paid advertising
2. **User Experience** - Many SEO practices align with good UX principles
3. **Credibility** - Top-ranking sites are perceived as more trustworthy
4. **Long-term Value** - Well-optimized content continues to attract visitors over time

---

## Technical SEO Fundamentals

Technical SEO refers to the optimizations that help search engines crawl, index, and render your website effectively.

### URL Structure

Clean, descriptive URLs improve both user experience and search engine understanding:

```plaintext
# Good URL structure
https://example.com/blog/frontend-seo-guide
https://example.com/products/wireless-headphones

# Poor URL structure
https://example.com/p?id=12345
https://example.com/blog/post/2024/01/15/a1b2c3d4
```

**Best practices for URLs:**

```javascript
// URL generation utility
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Remove consecutive hyphens
    .substring(0, 60);         // Keep URLs reasonably short
}

// Example usage
const slug = generateSlug('Frontend SEO Optimization Guide');
// Result: 'frontend-seo-optimization-guide'
```

### Canonical URLs

Canonical tags prevent duplicate content issues by specifying the preferred version of a page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Canonical URL to prevent duplicate content issues -->
  <link rel="canonical" href="https://example.com/blog/seo-guide" />
</head>
</html>
```

```javascript
// Next.js implementation
import Head from 'next/head';

function SEOPage({ canonicalUrl }) {
  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

// Dynamic canonical URL generation
function getCanonicalUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  // Remove query parameters and trailing slashes
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  return `${baseUrl}${cleanPath}`;
}
```

### Language and Internationalization

For multilingual sites, use hreflang tags to indicate language and regional targeting:

```html
<head>
  <!-- Default language -->
  <link rel="alternate" hreflang="en" href="https://example.com/page" />

  <!-- Language variants -->
  <link rel="alternate" hreflang="es" href="https://example.com/es/page" />
  <link rel="alternate" hreflang="fr" href="https://example.com/fr/page" />
  <link rel="alternate" hreflang="de" href="https://example.com/de/page" />

  <!-- Default fallback -->
  <link rel="alternate" hreflang="x-default" href="https://example.com/page" />
</head>
```

```javascript
// React component for hreflang tags
function HreflangTags({ currentPath, availableLocales }) {
  const baseUrl = 'https://example.com';

  return (
    <>
      {availableLocales.map(locale => (
        <link
          key={locale.code}
          rel="alternate"
          hreflang={locale.code}
          href={`${baseUrl}${locale.prefix}${currentPath}`}
        />
      ))}
      <link
        rel="alternate"
        hreflang="x-default"
        href={`${baseUrl}${currentPath}`}
      />
    </>
  );
}
```

---

## Meta Tags

Meta tags provide essential information about your page to search engines and social platforms.

### Essential Meta Tags

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta Tags -->
  <title>Frontend SEO Guide | Example Site</title>
  <meta name="title" content="Frontend SEO Guide | Example Site" />
  <meta name="description" content="Learn essential frontend SEO techniques including meta tags, structured data, and Core Web Vitals optimization." />

  <!-- Indexing directives -->
  <meta name="robots" content="index, follow" />

  <!-- Author and copyright -->
  <meta name="author" content="Your Name" />
  <meta name="copyright" content="Example Company" />
</head>
</html>
```

### Title Tag Best Practices

The title tag is one of the most important on-page SEO elements:

```javascript
// Title tag optimization rules
const titleGuidelines = {
  maxLength: 60,        // Characters before truncation in SERPs
  minLength: 30,        // Minimum for meaningful titles
  brandPosition: 'end', // 'Primary Keyword | Brand Name'
  separator: ' | '      // Common separators: | - :
};

function generateSEOTitle(pageTitle, brandName, options = {}) {
  const { maxLength = 60, separator = ' | ' } = options;
  const fullTitle = `${pageTitle}${separator}${brandName}`;

  if (fullTitle.length <= maxLength) {
    return fullTitle;
  }

  // Truncate page title if needed, keeping brand
  const brandPart = `${separator}${brandName}`;
  const availableLength = maxLength - brandPart.length;
  const truncatedPageTitle = pageTitle.substring(0, availableLength - 3) + '...';

  return `${truncatedPageTitle}${brandPart}`;
}

// Examples
generateSEOTitle('Complete Guide to Frontend SEO', 'DevBlog');
// Result: 'Complete Guide to Frontend SEO | DevBlog'
```

### Meta Description

```javascript
// Meta description component with character limit
function MetaDescription({ description, maxLength = 160 }) {
  const truncatedDescription = description.length > maxLength
    ? description.substring(0, maxLength - 3) + '...'
    : description;

  return <meta name="description" content={truncatedDescription} />;
}

// Writing effective meta descriptions
const metaDescriptionTips = `
1. Keep between 150-160 characters
2. Include primary keyword naturally
3. Write compelling copy that encourages clicks
4. Include a call-to-action when appropriate
5. Make each page's description unique
6. Accurately summarize page content
`;
```

### Robots Meta Tag

Control how search engines interact with your pages:

```html
<!-- Allow indexing and following links (default behavior) -->
<meta name="robots" content="index, follow" />

<!-- Prevent indexing but follow links -->
<meta name="robots" content="noindex, follow" />

<!-- Allow indexing but don't follow links -->
<meta name="robots" content="index, nofollow" />

<!-- Prevent indexing and link following -->
<meta name="robots" content="noindex, nofollow" />

<!-- Additional directives -->
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
```

```javascript
// Dynamic robots meta based on page type
function getRobotsContent(pageType, isDraft = false) {
  if (isDraft) {
    return 'noindex, nofollow';
  }

  const robotsMap = {
    public: 'index, follow',
    search: 'noindex, follow',     // Search results pages
    user: 'noindex, nofollow',      // User profile pages
    admin: 'noindex, nofollow',     // Admin pages
    preview: 'noindex, nofollow'    // Preview pages
  };

  return robotsMap[pageType] || 'index, follow';
}
```

---

## Open Graph Protocol

Open Graph (OG) tags control how your content appears when shared on social media platforms like Facebook, LinkedIn, and others.

### Essential Open Graph Tags

```html
<head>
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://example.com/blog/seo-guide" />
  <meta property="og:title" content="Complete Frontend SEO Guide" />
  <meta property="og:description" content="Master frontend SEO with this comprehensive guide covering meta tags, structured data, and performance optimization." />
  <meta property="og:image" content="https://example.com/images/seo-guide-og.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Frontend SEO Guide Cover Image" />
  <meta property="og:site_name" content="Example Site" />
  <meta property="og:locale" content="en_US" />
</head>
```

### Twitter Card Tags

```html
<head>
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@yourusername" />
  <meta name="twitter:creator" content="@authorusername" />
  <meta name="twitter:title" content="Complete Frontend SEO Guide" />
  <meta name="twitter:description" content="Master frontend SEO with this comprehensive guide." />
  <meta name="twitter:image" content="https://example.com/images/seo-guide-twitter.jpg" />
  <meta name="twitter:image:alt" content="Frontend SEO Guide Cover" />
</head>
```

### Complete Social Meta Component

```javascript
// React/Next.js SEO component
function SocialMeta({
  title,
  description,
  url,
  image,
  type = 'website',
  twitterHandle,
  siteName
}) {
  const imageUrl = image?.startsWith('http')
    ? image
    : `https://example.com${image}`;

  return (
    <>
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {twitterHandle && (
        <meta name="twitter:site" content={twitterHandle} />
      )}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}

// Usage example
<SocialMeta
  title="Frontend SEO Guide"
  description="Learn essential SEO techniques for modern web development"
  url="https://example.com/blog/seo-guide"
  image="/images/seo-og.jpg"
  type="article"
  twitterHandle="@devblog"
  siteName="DevBlog"
/>
```

### OG Image Best Practices

```javascript
// OG image specifications
const ogImageSpecs = {
  recommended: {
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1'
  },
  minimum: {
    width: 600,
    height: 315
  },
  fileSize: 'Under 8MB',
  formats: ['JPG', 'PNG', 'GIF', 'WebP']
};

// Dynamic OG image generation with canvas (Node.js)
async function generateOGImage(title, subtitle) {
  const { createCanvas, loadImage } = require('canvas');

  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1200, 630);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(title, 60, 280, 1080);

  // Subtitle
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '24px sans-serif';
  ctx.fillText(subtitle, 60, 340, 1080);

  return canvas.toBuffer('image/png');
}
```

---

## Structured Data (Schema.org)

Structured data helps search engines understand your content and can enable rich results in search.

### JSON-LD Format

JSON-LD is the recommended format for structured data:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Frontend SEO Guide",
  "description": "Learn essential frontend SEO techniques",
  "image": "https://example.com/images/seo-guide.jpg",
  "author": {
    "@type": "Person",
    "name": "John Developer",
    "url": "https://example.com/authors/john"
  },
  "publisher": {
    "@type": "Organization",
    "name": "DevBlog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-20"
}
</script>
```

### Common Schema Types

```javascript
// Article schema
function generateArticleSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.url
    },
    publisher: {
      '@type': 'Organization',
      name: 'DevBlog',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png'
      }
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    }
  };
}

// Product schema
function generateProductSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.currency,
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Example Store'
      }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count
    } : undefined
  };
}

// Breadcrumb schema
function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// FAQ schema
function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
```

### Organization and Website Schema

```javascript
// Organization schema (place on homepage)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Example Company',
  url: 'https://example.com',
  logo: 'https://example.com/logo.png',
  sameAs: [
    'https://twitter.com/example',
    'https://linkedin.com/company/example',
    'https://github.com/example'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-555-555-5555',
    contactType: 'customer service',
    availableLanguage: ['English', 'Spanish']
  }
};

// Website schema with search action
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Example Site',
  url: 'https://example.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://example.com/search?q={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
};
```

### Structured Data React Component

When rendering JSON-LD in React, you need to inject the JSON into a script tag. In Next.js 13+, you can use the Script component or the built-in metadata API:

```javascript
// Next.js 13+ App Router approach (recommended)
// app/blog/[slug]/page.js
export default function ArticlePage({ article }) {
  const jsonLd = generateArticleSchema(article);

  return (
    <>
      <script
        type="application/ld+json"
      >
        {JSON.stringify(jsonLd)}
      </script>
      <article>
        <h1>{article.title}</h1>
        {/* Article content */}
      </article>
    </>
  );
}

// Using next/script for more control
import Script from 'next/script';

function StructuredData({ data }) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
    >
      {JSON.stringify(data)}
    </Script>
  );
}

// Usage with multiple schemas
function SEOHead({ article, breadcrumbs }) {
  const articleSchema = generateArticleSchema(article);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <Head>
      <StructuredData data={articleSchema} />
      <StructuredData data={breadcrumbSchema} />
    </Head>
  );
}
```

---

## Core Web Vitals for SEO

Core Web Vitals are critical ranking factors that measure real-world user experience.

### The Three Core Web Vitals

```javascript
// Core Web Vitals thresholds
const coreWebVitals = {
  LCP: {
    name: 'Largest Contentful Paint',
    good: 2500,      // milliseconds
    needsImprovement: 4000,
    description: 'Loading performance'
  },
  INP: {
    name: 'Interaction to Next Paint',
    good: 200,       // milliseconds
    needsImprovement: 500,
    description: 'Interactivity responsiveness'
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    good: 0.1,       // score
    needsImprovement: 0.25,
    description: 'Visual stability'
  }
};
```

### Measuring Core Web Vitals

```javascript
// Using web-vitals library
import { onLCP, onINP, onCLS } from 'web-vitals';

function reportWebVitals(metric) {
  // Send to analytics
  console.log(metric.name, metric.value);

  // Example: Send to Google Analytics
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true
  });
}

// Initialize monitoring
onLCP(reportWebVitals);
onINP(reportWebVitals);
onCLS(reportWebVitals);
```

### LCP Optimization

```html
<!-- Preload critical resources -->
<link rel="preload" href="/hero-image.webp" as="image" />
<link rel="preload" href="/critical-font.woff2" as="font" type="font/woff2" crossorigin />

<!-- Priority hints for critical images -->
<img
  src="/hero.jpg"
  alt="Hero"
  fetchpriority="high"
  loading="eager"
/>

<!-- Lazy load below-the-fold images -->
<img
  src="/product.jpg"
  alt="Product"
  loading="lazy"
  decoding="async"
/>
```

### CLS Prevention

```javascript
// Always specify image dimensions
function OptimizedImage({ src, alt, width, height }) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ aspectRatio: `${width} / ${height}` }}
      loading="lazy"
    />
  );
}

// Reserve space for dynamic content
function AdPlaceholder() {
  return (
    <div
      style={{
        minHeight: '250px',
        backgroundColor: '#f0f0f0'
      }}
    >
      {/* Ad loads here */}
    </div>
  );
}

// Font loading optimization
const fontLoadingCSS = `
  @font-face {
    font-family: 'CustomFont';
    src: url('/fonts/custom.woff2') format('woff2');
    font-display: swap;
    font-weight: 400;
  }
`;
```

### INP Optimization

```javascript
// Break up long tasks
async function processData(items) {
  for (const item of items) {
    processItem(item);

    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Use requestIdleCallback for non-critical work
function deferAnalytics() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initializeAnalytics();
    });
  } else {
    setTimeout(initializeAnalytics, 1);
  }
}

// Debounce input handlers
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}
```

---

## Server-Side Rendering for SEO

Server-Side Rendering (SSR) and Static Site Generation (SSG) significantly improve SEO by providing fully rendered HTML to search engines.

### Why SSR/SSG Improves SEO

```html
<!-- Client-side rendering (CSR) - Poor for SEO -->
<!-- Initial HTML: -->
<div id="root"></div>
<!-- Search engines may not wait for JavaScript to execute -->

<!-- Server-side rendering (SSR) - Good for SEO -->
<!-- Initial HTML contains full content: -->
<div id="root">
  <h1>Frontend SEO Guide</h1>
  <p>Complete guide to optimizing your website...</p>
</div>
```

### Next.js Implementation

```javascript
// Static Site Generation (SSG)
// Best for: Content that doesn't change frequently
export async function getStaticProps() {
  const articles = await fetchArticles();

  return {
    props: { articles },
    revalidate: 3600 // Regenerate every hour (ISR)
  };
}

// Server-Side Rendering (SSR)
// Best for: Dynamic, personalized, or frequently updated content
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const article = await fetchArticle(slug);

  if (!article) {
    return { notFound: true };
  }

  return {
    props: { article }
  };
}

// Static paths for dynamic routes
export async function getStaticPaths() {
  const articles = await fetchAllArticleSlugs();

  return {
    paths: articles.map(article => ({
      params: { slug: article.slug }
    })),
    fallback: 'blocking' // Generate new pages on demand
  };
}
```

### Handling SEO with App Router (Next.js 13+)

```javascript
// app/blog/[slug]/page.js
import { Metadata } from 'next';

// Generate metadata
export async function generateMetadata({ params }) {
  const article = await fetchArticle(params.slug);

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.featuredImage],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name]
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.featuredImage]
    }
  };
}

// Page component with structured data
export default async function ArticlePage({ params }) {
  const article = await fetchArticle(params.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name
    }
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <article>
        <h1>{article.title}</h1>
        {/* Article content */}
      </article>
    </>
  );
}
```

---

## Sitemap

A sitemap helps search engines discover and understand your site structure.

### XML Sitemap Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://example.com/blog/seo-guide</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Dynamic Sitemap Generation

```javascript
// Next.js App Router sitemap
// app/sitemap.js
export default async function sitemap() {
  const baseUrl = 'https://example.com';

  // Fetch dynamic content
  const articles = await fetchAllArticles();
  const products = await fetchAllProducts();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5
    }
  ];

  // Dynamic article pages
  const articlePages = articles.map(article => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  // Dynamic product pages
  const productPages = products.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6
  }));

  return [...staticPages, ...articlePages, ...productPages];
}
```

### Sitemap Index for Large Sites

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-blog.xml</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-products.xml</loc>
    <lastmod>2024-01-14</lastmod>
  </sitemap>
</sitemapindex>
```

```javascript
// Generate sitemap index
function generateSitemapIndex(sitemaps) {
  const sitemapEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastModified}</lastmod>
  </sitemap>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}
```

---

## Robots.txt

The robots.txt file controls which parts of your site search engines can crawl.

### Basic Robots.txt Structure

```plaintext
# robots.txt for https://example.com

# Allow all crawlers access to everything
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://example.com/sitemap.xml

# Crawl-delay (optional, not supported by all crawlers)
Crawl-delay: 1
```

### Advanced Robots.txt Configuration

```plaintext
# robots.txt

# Default rules for all bots
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /search
Disallow: /*?*sort=
Disallow: /*?*filter=

# Allow specific paths within disallowed directories
Allow: /api/public/

# Specific rules for Googlebot
User-agent: Googlebot
Allow: /
Disallow: /admin/
Crawl-delay: 0

# Block AI training crawlers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

# Multiple sitemaps
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
```

### Dynamic Robots.txt Generation

```javascript
// Next.js App Router robots.txt
// app/robots.js
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/private/', '/search']
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/admin/'
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
```

```javascript
// Express.js dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const robotsContent = isProduction
    ? `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://example.com/sitemap.xml`
    : `User-agent: *
Disallow: /`;

  res.type('text/plain');
  res.send(robotsContent);
});
```

---

## Complete SEO Component

The following is a comprehensive SEO component combining all the concepts:

```javascript
// components/SEO.js
import Head from 'next/head';

export default function SEO({
  title,
  description,
  canonical,
  image,
  article,
  noindex = false
}) {
  const siteName = 'Example Site';
  const baseUrl = 'https://example.com';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const imageUrl = image?.startsWith('http') ? image : `${baseUrl}${image}`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Robots */}
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {canonical && <meta property="og:url" content={canonical} />}
      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </>
      )}

      {/* Article specific */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedAt} />
          <meta property="article:modified_time" content={article.updatedAt} />
          <meta property="article:author" content={article.author} />
          {article.tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
    </Head>
  );
}

// Usage
<SEO
  title="Frontend SEO Guide"
  description="Master frontend SEO with this comprehensive guide"
  canonical="https://example.com/blog/seo-guide"
  image="/images/seo-guide-og.jpg"
  article={{
    publishedAt: '2024-01-15',
    updatedAt: '2024-01-20',
    author: 'John Developer',
    tags: ['SEO', 'Frontend', 'Performance']
  }}
/>
```

---

## SEO Audit Checklist

Use this checklist to audit your website's SEO implementation:

```javascript
const seoAuditChecklist = {
  technical: [
    'All pages have unique, descriptive title tags',
    'Meta descriptions are present and under 160 characters',
    'Canonical URLs are properly set',
    'Robots.txt allows important pages',
    'XML sitemap is generated and submitted',
    'HTTPS is enabled site-wide',
    'No broken internal or external links',
    'URL structure is clean and readable'
  ],
  content: [
    'H1 tag present on each page (only one)',
    'Heading hierarchy is logical (H1 > H2 > H3)',
    'Images have descriptive alt text',
    'Content is original and valuable',
    'Internal linking structure is logical'
  ],
  performance: [
    'LCP under 2.5 seconds',
    'INP under 200 milliseconds',
    'CLS under 0.1',
    'Critical CSS is inlined',
    'Images are optimized and lazy loaded',
    'JavaScript is deferred or async loaded'
  ],
  social: [
    'Open Graph tags are present',
    'Twitter Card tags are present',
    'OG images are 1200x630 pixels',
    'Social meta content matches page content'
  ],
  structuredData: [
    'JSON-LD schema is valid',
    'Organization schema on homepage',
    'Article schema on blog posts',
    'Breadcrumb schema implemented',
    'FAQ schema where appropriate'
  ],
  mobile: [
    'Viewport meta tag is present',
    'Site is mobile responsive',
    'Touch targets are adequately sized',
    'Text is readable without zooming'
  ]
};
```

---

## Best Practices Summary

1. **Technical SEO**: Ensure clean URLs, proper canonicalization, and crawlable site structure
2. **Meta Tags**: Write unique, compelling titles and descriptions for every page
3. **Open Graph**: Optimize social sharing with proper OG and Twitter Card tags
4. **Structured Data**: Implement JSON-LD schema to enable rich results
5. **Core Web Vitals**: Prioritize LCP, INP, and CLS optimization
6. **SSR/SSG**: Use server-side rendering for content-heavy pages
7. **Sitemaps**: Generate and submit comprehensive XML sitemaps
8. **Robots.txt**: Control crawler access to protect sensitive areas

By implementing these frontend SEO techniques, you can significantly improve your website's visibility in search engines while also enhancing user experience. Remember that SEO is an ongoing process - regularly audit your site and stay updated with search engine algorithm changes.
