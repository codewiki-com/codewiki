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
origin: old/src/content/docs/frontend/seo.zh.md
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

## 简介

搜索引擎优化（SEO）是优化网页以在搜索引擎结果页面（SERP）中获得更高排名的实践。对于前端开发者来说，理解和实施 SEO 最佳实践对于构建可发现、可访问且高性能的网站至关重要。

现代 SEO 远不止关键词和反向链接。它涵盖了技术实现、用户体验指标、结构化数据和渲染策略。本指南涵盖了每个 Web 开发者都应该掌握的基本前端 SEO 技术。

### 为什么前端 SEO 很重要

1. **自然流量** - 更高的排名意味着无需付费广告即可获得更多访问者
2. **用户体验** - 许多 SEO 实践与良好的用户体验原则一致
3. **可信度** - 排名靠前的网站被认为更值得信赖
4. **长期价值** - 优化良好的内容会持续吸引访问者

---

## 技术 SEO 基础

技术 SEO 是指帮助搜索引擎有效爬取、索引和渲染你网站的优化措施。

### URL 结构

简洁、描述性的 URL 可以改善用户体验和搜索引擎的理解：

```plaintext
# 良好的 URL 结构
https://example.com/blog/frontend-seo-guide
https://example.com/products/wireless-headphones

# 不良的 URL 结构
https://example.com/p?id=12345
https://example.com/blog/post/2024/01/15/a1b2c3d4
```

**URL 最佳实践：**

```javascript
// URL 生成工具
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')      // 用连字符替换空格
    .replace(/-+/g, '-')       // 移除连续的连字符
    .substring(0, 60);         // 保持 URL 合理长度
}

// 使用示例
const slug = generateSlug('Frontend SEO Optimization Guide');
// 结果: 'frontend-seo-optimization-guide'
```

### 规范化 URL

规范化标签通过指定页面的首选版本来防止重复内容问题：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- 规范化 URL 以防止重复内容问题 -->
  <link rel="canonical" href="https://example.com/blog/seo-guide" />
</head>
</html>
```

```javascript
// Next.js 实现
import Head from 'next/head';

function SEOPage({ canonicalUrl }) {
  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

// 动态规范化 URL 生成
function getCanonicalUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  // 移除查询参数和尾部斜杠
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  return `${baseUrl}${cleanPath}`;
}
```

### 语言和国际化

对于多语言网站，使用 hreflang 标签来指示语言和地区定位：

```html
<head>
  <!-- 默认语言 -->
  <link rel="alternate" hreflang="en" href="https://example.com/page" />

  <!-- 语言变体 -->
  <link rel="alternate" hreflang="es" href="https://example.com/es/page" />
  <link rel="alternate" hreflang="fr" href="https://example.com/fr/page" />
  <link rel="alternate" hreflang="de" href="https://example.com/de/page" />

  <!-- 默认回退 -->
  <link rel="alternate" hreflang="x-default" href="https://example.com/page" />
</head>
```

```javascript
// hreflang 标签的 React 组件
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

## Meta 标签

Meta 标签向搜索引擎和社交平台提供有关页面的重要信息。

### 基本 Meta 标签

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- 主要 Meta 标签 -->
  <title>Frontend SEO Guide | Example Site</title>
  <meta name="title" content="Frontend SEO Guide | Example Site" />
  <meta name="description" content="Learn essential frontend SEO techniques including meta tags, structured data, and Core Web Vitals optimization." />

  <!-- 索引指令 -->
  <meta name="robots" content="index, follow" />

  <!-- 作者和版权 -->
  <meta name="author" content="Your Name" />
  <meta name="copyright" content="Example Company" />
</head>
</html>
```

### Title 标签最佳实践

Title 标签是最重要的页面 SEO 元素之一：

```javascript
// Title 标签优化规则
const titleGuidelines = {
  maxLength: 60,        // 在 SERP 中截断前的字符数
  minLength: 30,        // 有意义标题的最小长度
  brandPosition: 'end', // '主要关键词 | 品牌名'
  separator: ' | '      // 常用分隔符: | - :
};

function generateSEOTitle(pageTitle, brandName, options = {}) {
  const { maxLength = 60, separator = ' | ' } = options;
  const fullTitle = `${pageTitle}${separator}${brandName}`;

  if (fullTitle.length <= maxLength) {
    return fullTitle;
  }

  // 如需要则截断页面标题，保留品牌
  const brandPart = `${separator}${brandName}`;
  const availableLength = maxLength - brandPart.length;
  const truncatedPageTitle = pageTitle.substring(0, availableLength - 3) + '...';

  return `${truncatedPageTitle}${brandPart}`;
}

// 示例
generateSEOTitle('Complete Guide to Frontend SEO', 'DevBlog');
// 结果: 'Complete Guide to Frontend SEO | DevBlog'
```

### Meta 描述

```javascript
// 带字符限制的 Meta 描述组件
function MetaDescription({ description, maxLength = 160 }) {
  const truncatedDescription = description.length > maxLength
    ? description.substring(0, maxLength - 3) + '...'
    : description;

  return <meta name="description" content={truncatedDescription} />;
}

// 撰写有效 Meta 描述的技巧
const metaDescriptionTips = `
1. 保持在 150-160 个字符之间
2. 自然地包含主要关键词
3. 撰写能吸引点击的文案
4. 适当时包含行动号召
5. 确保每个页面的描述都是唯一的
6. 准确总结页面内容
`;
```

### Robots Meta 标签

控制搜索引擎如何与你的页面交互：

```html
<!-- 允许索引和跟踪链接（默认行为） -->
<meta name="robots" content="index, follow" />

<!-- 阻止索引但跟踪链接 -->
<meta name="robots" content="noindex, follow" />

<!-- 允许索引但不跟踪链接 -->
<meta name="robots" content="index, nofollow" />

<!-- 阻止索引和链接跟踪 -->
<meta name="robots" content="noindex, nofollow" />

<!-- 额外指令 -->
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
```

```javascript
// 基于页面类型的动态 robots meta
function getRobotsContent(pageType, isDraft = false) {
  if (isDraft) {
    return 'noindex, nofollow';
  }

  const robotsMap = {
    public: 'index, follow',
    search: 'noindex, follow',     // 搜索结果页面
    user: 'noindex, nofollow',      // 用户个人资料页面
    admin: 'noindex, nofollow',     // 管理页面
    preview: 'noindex, nofollow'    // 预览页面
  };

  return robotsMap[pageType] || 'index, follow';
}
```

---

## Open Graph 协议

Open Graph（OG）标签控制你的内容在 Facebook、LinkedIn 等社交媒体平台上分享时的显示方式。

### 基本 Open Graph 标签

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

### Twitter Card 标签

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

### 完整的社交 Meta 组件

```javascript
// React/Next.js SEO 组件
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

// 使用示例
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

### OG 图片最佳实践

```javascript
// OG 图片规格
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
  fileSize: '小于 8MB',
  formats: ['JPG', 'PNG', 'GIF', 'WebP']
};

// 使用 canvas 动态生成 OG 图片（Node.js）
async function generateOGImage(title, subtitle) {
  const { createCanvas, loadImage } = require('canvas');

  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1200, 630);

  // 标题
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(title, 60, 280, 1080);

  // 副标题
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '24px sans-serif';
  ctx.fillText(subtitle, 60, 340, 1080);

  return canvas.toBuffer('image/png');
}
```

---

## 结构化数据（Schema.org）

结构化数据帮助搜索引擎理解你的内容，并能在搜索中启用富媒体结果。

### JSON-LD 格式

JSON-LD 是结构化数据的推荐格式：

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

### 常见 Schema 类型

```javascript
// 文章 schema
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

// 产品 schema
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

// 面包屑 schema
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

### 组织和网站 Schema

```javascript
// 组织 schema（放在首页）
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

// 带搜索功能的网站 schema
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

### 结构化数据 React 组件

在 React 中渲染 JSON-LD 时，你需要将 JSON 注入到 script 标签中。在 Next.js 13+ 中，你可以使用 Script 组件或内置的 metadata API：

```javascript
// Next.js 13+ App Router 方法（推荐）
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
        {/* 文章内容 */}
      </article>
    </>
  );
}

// 使用 next/script 获得更多控制
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

// 使用多个 schema
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

## SEO 的核心 Web 指标

核心 Web 指标是衡量真实用户体验的关键排名因素。

### 三个核心 Web 指标

```javascript
// 核心 Web 指标阈值
const coreWebVitals = {
  LCP: {
    name: 'Largest Contentful Paint',
    good: 2500,      // 毫秒
    needsImprovement: 4000,
    description: '加载性能'
  },
  INP: {
    name: 'Interaction to Next Paint',
    good: 200,       // 毫秒
    needsImprovement: 500,
    description: '交互响应性'
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    good: 0.1,       // 分数
    needsImprovement: 0.25,
    description: '视觉稳定性'
  }
};
```

### 测量核心 Web 指标

```javascript
// 使用 web-vitals 库
import { onLCP, onINP, onCLS } from 'web-vitals';

function reportWebVitals(metric) {
  // 发送到分析服务
  console.log(metric.name, metric.value);

  // 示例：发送到 Google Analytics
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true
  });
}

// 初始化监控
onLCP(reportWebVitals);
onINP(reportWebVitals);
onCLS(reportWebVitals);
```

### LCP 优化

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/hero-image.webp" as="image" />
<link rel="preload" href="/critical-font.woff2" as="font" type="font/woff2" crossorigin />

<!-- 关键图片的优先级提示 -->
<img
  src="/hero.jpg"
  alt="Hero"
  fetchpriority="high"
  loading="eager"
/>

<!-- 延迟加载首屏以下的图片 -->
<img
  src="/product.jpg"
  alt="Product"
  loading="lazy"
  decoding="async"
/>
```

### CLS 预防

```javascript
// 始终指定图片尺寸
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

// 为动态内容预留空间
function AdPlaceholder() {
  return (
    <div
      style={{
        minHeight: '250px',
        backgroundColor: '#f0f0f0'
      }}
    >
      {/* 广告在此加载 */}
    </div>
  );
}

// 字体加载优化
const fontLoadingCSS = `
  @font-face {
    font-family: 'CustomFont';
    src: url('/fonts/custom.woff2') format('woff2');
    font-display: swap;
    font-weight: 400;
  }
`;
```

### INP 优化

```javascript
// 分解长任务
async function processData(items) {
  for (const item of items) {
    processItem(item);

    // 让出主线程
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// 使用 requestIdleCallback 处理非关键工作
function deferAnalytics() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initializeAnalytics();
    });
  } else {
    setTimeout(initializeAnalytics, 1);
  }
}

// 防抖输入处理器
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

## SEO 的服务端渲染

服务端渲染（SSR）和静态站点生成（SSG）通过向搜索引擎提供完全渲染的 HTML 来显著改善 SEO。

### 为什么 SSR/SSG 能改善 SEO

```html
<!-- 客户端渲染（CSR） - 对 SEO 不利 -->
<!-- 初始 HTML： -->
<div id="root"></div>
<!-- 搜索引擎可能不会等待 JavaScript 执行 -->

<!-- 服务端渲染（SSR） - 对 SEO 有利 -->
<!-- 初始 HTML 包含完整内容： -->
<div id="root">
  <h1>Frontend SEO Guide</h1>
  <p>Complete guide to optimizing your website...</p>
</div>
```

### Next.js 实现

```javascript
// 静态站点生成（SSG）
// 最适合：不经常变化的内容
export async function getStaticProps() {
  const articles = await fetchArticles();

  return {
    props: { articles },
    revalidate: 3600 // 每小时重新生成（ISR）
  };
}

// 服务端渲染（SSR）
// 最适合：动态、个性化或频繁更新的内容
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

// 动态路由的静态路径
export async function getStaticPaths() {
  const articles = await fetchAllArticleSlugs();

  return {
    paths: articles.map(article => ({
      params: { slug: article.slug }
    })),
    fallback: 'blocking' // 按需生成新页面
  };
}
```

### 使用 App Router 处理 SEO（Next.js 13+）

```javascript
// app/blog/[slug]/page.js
import { Metadata } from 'next';

// 生成元数据
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

// 带结构化数据的页面组件
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
        {/* 文章内容 */}
      </article>
    </>
  );
}
```

---

## 站点地图

站点地图帮助搜索引擎发现和理解你的网站结构。

### XML 站点地图结构

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

### 动态站点地图生成

```javascript
// Next.js App Router 站点地图
// app/sitemap.js
export default async function sitemap() {
  const baseUrl = 'https://example.com';

  // 获取动态内容
  const articles = await fetchAllArticles();
  const products = await fetchAllProducts();

  // 静态页面
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

  // 动态文章页面
  const articlePages = articles.map(article => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  // 动态产品页面
  const productPages = products.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6
  }));

  return [...staticPages, ...articlePages, ...productPages];
}
```

### 大型网站的站点地图索引

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
// 生成站点地图索引
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

robots.txt 文件控制搜索引擎可以爬取网站的哪些部分。

### 基本 Robots.txt 结构

```plaintext
# https://example.com 的 robots.txt

# 允许所有爬虫访问所有内容
User-agent: *
Allow: /

# 站点地图位置
Sitemap: https://example.com/sitemap.xml

# 爬取延迟（可选，不是所有爬虫都支持）
Crawl-delay: 1
```

### 高级 Robots.txt 配置

```plaintext
# robots.txt

# 所有机器人的默认规则
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /search
Disallow: /*?*sort=
Disallow: /*?*filter=

# 允许禁止目录中的特定路径
Allow: /api/public/

# Googlebot 的特定规则
User-agent: Googlebot
Allow: /
Disallow: /admin/
Crawl-delay: 0

# 阻止 AI 训练爬虫（可选）
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

# 多个站点地图
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
```

### 动态 Robots.txt 生成

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
// Express.js 动态 robots.txt
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

## 完整的 SEO 组件

这是一个结合所有概念的综合 SEO 组件：

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
      {/* 主要 Meta 标签 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Robots */}
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* 规范化 */}
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

      {/* 文章特定 */}
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

// 使用方法
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

## SEO 审核清单

使用此清单审核你网站的 SEO 实现：

```javascript
const seoAuditChecklist = {
  technical: [
    '所有页面都有唯一的描述性标题标签',
    'Meta 描述存在且在 160 个字符以内',
    '规范化 URL 已正确设置',
    'Robots.txt 允许重要页面',
    'XML 站点地图已生成并提交',
    '全站启用 HTTPS',
    '没有断开的内部或外部链接',
    'URL 结构简洁可读'
  ],
  content: [
    '每个页面都有 H1 标签（只有一个）',
    '标题层次结构合理（H1 > H2 > H3）',
    '图片有描述性的 alt 文本',
    '内容原创且有价值',
    '内部链接结构合理'
  ],
  performance: [
    'LCP 在 2.5 秒以内',
    'INP 在 200 毫秒以内',
    'CLS 在 0.1 以内',
    '关键 CSS 已内联',
    '图片已优化并延迟加载',
    'JavaScript 使用 defer 或 async 加载'
  ],
  social: [
    'Open Graph 标签存在',
    'Twitter Card 标签存在',
    'OG 图片为 1200x630 像素',
    '社交元数据内容与页面内容一致'
  ],
  structuredData: [
    'JSON-LD schema 有效',
    '首页有组织 schema',
    '博客文章有文章 schema',
    '已实现面包屑 schema',
    '适当位置有 FAQ schema'
  ],
  mobile: [
    'viewport meta 标签存在',
    '网站移动端响应式',
    '触摸目标尺寸适当',
    '文本无需缩放即可阅读'
  ]
};
```

---

## 最佳实践总结

1. **技术 SEO**：确保简洁的 URL、正确的规范化和可爬取的网站结构
2. **Meta 标签**：为每个页面编写唯一、有吸引力的标题和描述
3. **Open Graph**：使用正确的 OG 和 Twitter Card 标签优化社交分享
4. **结构化数据**：实现 JSON-LD schema 以启用富媒体结果
5. **核心 Web 指标**：优先优化 LCP、INP 和 CLS
6. **SSR/SSG**：对内容密集型页面使用服务端渲染
7. **站点地图**：生成并提交全面的 XML 站点地图
8. **Robots.txt**：控制爬虫访问以保护敏感区域

通过实施这些前端 SEO 技术，你可以显著提高网站在搜索引擎中的可见度，同时也能提升用户体验。请记住，SEO 是一个持续的过程——定期审核你的网站并跟上搜索引擎算法的变化。
