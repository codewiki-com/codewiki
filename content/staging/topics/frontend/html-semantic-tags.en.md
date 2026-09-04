---
title: HTML5 Semantic Tags Complete Guide
description: Master HTML5 semantic elements to create well-structured, accessible web pages
track: frontend
section: html-css
difficulty: beginner
tags:
  - HTML5
  - Semantic
  - Accessibility
  - SEO
status: imported
origin: old/src/content/docs/frontend/html-semantic-tags.en.md
divergence: 0.29
issues: []
legacy:
  category: Frontend
  subcategory: HTML
  order: 1
  lastUpdated: 2026-01-07
---

## What Are Semantic Elements?

### Understanding Semantic HTML

Semantic tags are HTML5 elements that carry meaningful information about their content. Unlike generic containers such as `<div>` and `<span>`, semantic elements describe both the structure and the purpose of their content. They tell browsers, search engines, and assistive technologies what role each part of the page plays.

The word "semantic" comes from the Greek word "semantikos," meaning "significant" or "meaningful." In the context of HTML, semantic markup means using elements that convey the meaning of your content, not just its appearance.

### Historical Background

Before HTML5, developers relied heavily on `<div>` tags with class or id attributes to organize page structure. This approach led to several problems:

1. **Poor Code Readability**: Pages filled with `<div class="header">` and `<div class="footer">` lacked expressiveness
2. **Machine Incomprehension**: Search engines and screen readers could not accurately identify the purpose of different page sections
3. **Inconsistent Conventions**: Different projects used varying class naming schemes

In 2014, HTML5 became the official W3C recommendation, introducing a suite of semantic tags to address these issues. These elements include `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, and `<footer>`.

### Problems Solved by Semantic HTML

Semantic tags address several core challenges:

- **Improved Code Readability**: Tag names directly express content purpose
- **Enhanced Accessibility**: Assistive technologies can correctly interpret page structure
- **Better SEO**: Search engines can understand and index content more effectively
- **Team Collaboration**: Unified semantic standards reduce communication overhead
- **Future-Proofing**: Provides better compatibility with new technologies and devices

## Core Principles

### The Essence of Semantic HTML

The essence of semantic HTML is **letting HTML return to its responsibility of describing content structure**. HTML was originally designed to mark up the logical structure of documents, not to control styling (that is CSS's job). Semantic tags enable us to maintain clear separation:

```
Document Structure = HTML Semantic Tags
Visual Presentation = CSS Styles
Interactive Behavior = JavaScript
```

### Document Outline Algorithm

HTML5 introduced the concept of a document outline algorithm. Each sectioning content element creates a new node in the document outline. The main sectioning content elements include:

- `<article>` - Independent content unit
- `<section>` - Thematic content grouping
- `<nav>` - Navigation link area
- `<aside>` - Tangentially related content

These elements, combined with heading elements (`<h1>` - `<h6>`), build a clear hierarchical document structure.

### Implicit ARIA Roles

Semantic tags have built-in implicit ARIA (Accessible Rich Internet Applications) roles. This is the technical foundation for their accessibility benefits:

| HTML5 Tag | Implicit ARIA Role |
|-----------|-------------------|
| `<header>` | banner (when a direct child of body) |
| `<nav>` | navigation |
| `<main>` | main |
| `<article>` | article |
| `<section>` | region (when it has an accessible name) |
| `<aside>` | complementary |
| `<footer>` | contentinfo (when a direct child of body) |

This means when you use a `<nav>` tag, screen readers automatically recognize it as a navigation region without needing to add a `role="navigation"` attribute.

## Document Structure Tags

### header - Page Header Area

The `<header>` element represents introductory content or a set of navigational aids. It typically contains headings, logos, search forms, or navigation menus.

**Key Characteristics**:

- A page can have multiple `<header>` elements; they can be used for the entire page or within `<article>` or `<section>` elements
- When used as a direct child of the body, it has the `banner` ARIA role
- Cannot be nested inside `<footer>`, `<address>`, or another `<header>`

```html
<!-- Page-level header -->
<header>
  <img src="logo.png" alt="Company Logo">
  <h1>Website Name</h1>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<!-- Article-level header -->
<article>
  <header>
    <h2>Article Title</h2>
    <p>By John Smith | Published: January 15, 2024</p>
  </header>
  <p>Article content...</p>
</article>
```

### nav - Navigation Area

The `<nav>` element wraps **major navigation link blocks** on a page. It informs browsers and assistive technologies that this is a navigation region.

**Key Characteristics**:

- Use only for major navigation; not every group of links requires `<nav>`
- A page can have multiple `<nav>` elements (main navigation, breadcrumbs, footer navigation, etc.)
- Recommended to use `aria-label` or `aria-labelledby` to distinguish multiple navigation regions

```html
<!-- Main navigation -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/contact">Contact Us</a></li>
  </ul>
</nav>

<!-- Breadcrumb navigation -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Product Details</li>
  </ol>
</nav>
```

### main - Main Content Area

The `<main>` element contains the **core content** of the document - the unique primary content of the page, excluding headers, footers, navigation, sidebars, and other repeated content.

**Key Characteristics**:

- **Each page can only have one visible `<main>` element** (unless other main elements are hidden with the `hidden` attribute)
- Cannot be a descendant of `<article>`, `<aside>`, `<footer>`, `<header>`, or `<nav>`
- Skip links typically target the `<main>` element

```html
<body>
  <header>...</header>
  <nav>...</nav>

  <main id="main-content">
    <h1>Page Main Title</h1>
    <article>
      <h2>Article Title</h2>
      <p>This is the core content area of the page...</p>
    </article>
  </main>

  <aside>...</aside>
  <footer>...</footer>
</body>
```

### article - Independent Content Unit

The `<article>` element represents **independent, self-contained content** in a document. The test: would this content make sense on its own if removed from the current page?

**Key Characteristics**:

- Suitable for blog posts, news articles, forum posts, user comments, product cards, etc.
- Should contain a heading element (usually `<h2>` - `<h6>`)
- Can be nested (e.g., comments within an article can also be articles)
- Recommended to include publication time (`<time datetime="...">`)

```html
<article>
  <header>
    <h2>Understanding CSS Flexbox Layout</h2>
    <p>
      <time datetime="2024-01-15">January 15, 2024</time>
      <span>By Jane Doe</span>
    </p>
  </header>

  <p>Flexbox is a one-dimensional layout model particularly suited for component-level layouts...</p>

  <section>
    <h3>Basic Concepts</h3>
    <p>Flex containers and flex items are the two core concepts...</p>
  </section>

  <footer>
    <p>Tags: CSS, Layout, Frontend</p>
  </footer>
</article>
```

### section - Thematic Grouping

The `<section>` element represents a **thematically grouped content block** in a document, typically with a heading. It is more semantic than `<div>` but more general than `<article>`.

**Key Characteristics**:

- Must have a clear theme, usually including a heading
- Should not be used purely for styling or scripting purposes (use `<div>` for that)
- Suitable for chapters, tab content, step-by-step wizards, etc.

**section vs article vs div**:

| Element | Use Case |
|---------|----------|
| `<article>` | Independent, complete, distributable content |
| `<section>` | Thematic grouping within a page, depends on context |
| `<div>` | Pure styling container, no semantic meaning |

```html
<article>
  <h1>JavaScript Complete Guide</h1>

  <section>
    <h2>Chapter 1: Basic Syntax</h2>
    <p>JavaScript is a dynamically typed language...</p>
  </section>

  <section>
    <h2>Chapter 2: Functions and Scope</h2>
    <p>Functions are first-class citizens in JavaScript...</p>
  </section>

  <section>
    <h2>Chapter 3: Asynchronous Programming</h2>
    <p>Asynchrony is one of JavaScript's core features...</p>
  </section>
</article>
```

### aside - Sidebar Content

The `<aside>` element represents content that is **tangentially related** to the surrounding content. It is often presented as sidebars, callout boxes, or advertisements.

**Key Characteristics**:

- Content should be related to but not essential to the main content
- Common uses: sidebars, related links, advertisements, quotes, glossaries
- Removing it should not affect understanding of the main content

```html
<main>
  <article>
    <h1>Deep Dive into React Hooks</h1>
    <p>React Hooks were introduced in version 16.8, fundamentally changing how we write functional components...</p>

    <!-- Aside within article: supplementary information related to the article -->
    <aside>
      <h3>What is React?</h3>
      <p>React is a JavaScript UI library developed by Facebook for building user interfaces.</p>
    </aside>

    <p>useState is one of the most commonly used Hooks...</p>
  </article>
</main>

<!-- Page-level aside: sidebar -->
<aside>
  <h2>Popular Articles</h2>
  <ul>
    <li><a href="#">Vue 3 New Features Overview</a></li>
    <li><a href="#">TypeScript Getting Started Guide</a></li>
  </ul>

  <h2>Follow Us</h2>
  <p>Subscribe to get the latest tech articles</p>
</aside>
```

### footer - Page Footer Area

The `<footer>` element represents a **footer** for its nearest sectioning content or sectioning root element. It typically contains copyright information, author information, related links, etc.

**Key Characteristics**:

- A page can have multiple `<footer>` elements
- When used as a direct child of body, it has the `contentinfo` ARIA role
- Cannot be nested inside `<header>`, `<address>`, or another `<footer>`

```html
<!-- Page-level footer -->
<footer>
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/privacy">Privacy Policy</a></li>
      <li><a href="/terms">Terms of Service</a></li>
      <li><a href="/sitemap">Sitemap</a></li>
    </ul>
  </nav>
  <p>&copy; 2024 Company Name. All rights reserved.</p>
</footer>

<!-- Article-level footer -->
<article>
  <header>
    <h2>Article Title</h2>
  </header>
  <p>Article content...</p>
  <footer>
    <p>Author: Jane Smith</p>
    <p>Last updated: <time datetime="2024-01-15">January 15, 2024</time></p>
    <p>Category: <a href="/category/frontend">Frontend Development</a></p>
  </footer>
</article>
```

## Text Semantic Tags

Beyond the document structure tags, HTML5 provides other important semantic elements for text-level content:

### figure and figcaption

The `<figure>` element represents self-contained content, typically with a caption. The `<figcaption>` element provides the caption for its parent `<figure>`.

```html
<figure>
  <img src="chart.png" alt="Sales chart showing 25% growth in Q4">
  <figcaption>Figure 1: Q4 2024 Sales Performance</figcaption>
</figure>

<figure>
  <pre><code>
function greet(name) {
  return `Hello, ${name}!`;
}
  </code></pre>
  <figcaption>Example: A simple greeting function in JavaScript</figcaption>
</figure>
```

### time

The `<time>` element represents a specific period in time. The `datetime` attribute provides a machine-readable format.

```html
<p>The event starts on <time datetime="2024-03-15T19:00">March 15 at 7:00 PM</time>.</p>

<p>Published <time datetime="2024-01-15">January 15, 2024</time></p>

<p>The meeting lasted <time datetime="PT2H30M">2 hours and 30 minutes</time>.</p>
```

### mark

The `<mark>` element highlights text that is relevant in a particular context, such as search results.

```html
<p>Search results for "JavaScript":</p>
<p>Learn <mark>JavaScript</mark> fundamentals with our comprehensive guide to <mark>JavaScript</mark> programming.</p>
```

### address

The `<address>` element provides contact information for the author or owner of a document or article.

```html
<article>
  <h1>Article Title</h1>
  <p>Article content...</p>
  <footer>
    <address>
      Written by <a href="mailto:author@example.com">John Doe</a>.<br>
      Visit us at:<br>
      123 Main Street<br>
      City, State 12345
    </address>
  </footer>
</article>
```

### details and summary

The `<details>` element creates a disclosure widget that can be toggled open or closed. The `<summary>` element provides the visible heading.

```html
<details>
  <summary>What is your return policy?</summary>
  <p>We offer a 30-day return policy for all unused items in original packaging. Contact our support team to initiate a return.</p>
</details>

<details open>
  <summary>System Requirements</summary>
  <ul>
    <li>Windows 10 or later / macOS 10.15 or later</li>
    <li>4GB RAM minimum (8GB recommended)</li>
    <li>2GB available disk space</li>
  </ul>
</details>
```

### Other Text Semantic Elements

| Tag | Purpose | Example |
|-----|---------|---------|
| `<abbr>` | Abbreviation or acronym | `<abbr title="HyperText Markup Language">HTML</abbr>` |
| `<cite>` | Title of a creative work | `<cite>The Great Gatsby</cite>` |
| `<code>` | Computer code | `<code>console.log()</code>` |
| `<data>` | Machine-readable value | `<data value="398">Product ID: 398</data>` |
| `<dfn>` | Term being defined | `<dfn>Semantic HTML</dfn> means...` |
| `<kbd>` | Keyboard input | `Press <kbd>Ctrl</kbd>+<kbd>S</kbd>` |
| `<samp>` | Sample output | `<samp>Error: File not found</samp>` |
| `<var>` | Variable | `<var>x</var> = <var>y</var> + 2` |

## Practical Examples

### Complete Blog Page Structure

A complete blog page example built with semantic tags:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Frontend tech blog sharing web development best practices">
  <title>Frontend Tech Blog - Home</title>
</head>
<body>
  <!-- Skip link: improves accessibility -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Page header -->
  <header>
    <div class="logo">
      <img src="/images/logo.svg" alt="Frontend Tech Blog">
    </div>

    <!-- Main navigation -->
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/articles">Articles</a></li>
        <li><a href="/tutorials">Tutorials</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>

    <!-- Search functionality -->
    <search>
      <form action="/search" method="get">
        <label for="search-input" class="visually-hidden">Search articles</label>
        <input type="search" id="search-input" name="q" placeholder="Search...">
        <button type="submit">Search</button>
      </form>
    </search>
  </header>

  <!-- Breadcrumb navigation -->
  <nav aria-label="Breadcrumb">
    <ol class="breadcrumb">
      <li><a href="/">Home</a></li>
      <li><a href="/articles">Articles</a></li>
      <li aria-current="page">Current Article</li>
    </ol>
  </nav>

  <!-- Main content area -->
  <main id="main-content">
    <h1>Featured Frontend Articles</h1>

    <!-- Article listing -->
    <article>
      <header>
        <h2><a href="/articles/react-hooks">React Hooks Complete Guide</a></h2>
        <p class="meta">
          <span class="author">By John Smith</span>
          <time datetime="2024-01-15">January 15, 2024</time>
          <span class="reading-time">15 min read</span>
        </p>
      </header>

      <figure>
        <img src="/images/react-hooks.jpg" alt="React Hooks concept diagram">
        <figcaption>React Hooks give functional components state management capabilities</figcaption>
      </figure>

      <p>React Hooks were introduced in React 16.8, allowing you to use state and other React features without writing a class. We explore the principles and best practices of core Hooks like useState, useEffect, and useContext.</p>

      <section aria-labelledby="hooks-overview">
        <h3 id="hooks-overview">Hooks Overview</h3>
        <p>What problems do Hooks solve? Why do we need Hooks? Let's start with the evolution of React components...</p>

        <aside class="note">
          <strong>Note:</strong> Hooks can only be called at the top level of function components. They cannot be called inside loops, conditions, or nested functions.
        </aside>
      </section>

      <section aria-labelledby="usestate-section">
        <h3 id="usestate-section">useState In Depth</h3>
        <p>useState is the most fundamental Hook, used to add local state to functional components...</p>

        <pre><code>
const [count, setCount] = useState(0);
        </code></pre>
      </section>

      <footer>
        <p>Tags:
          <a href="/tags/react" rel="tag">React</a>,
          <a href="/tags/hooks" rel="tag">Hooks</a>,
          <a href="/tags/frontend" rel="tag">Frontend</a>
        </p>
        <p>
          <a href="/articles/react-hooks">Continue reading</a>
        </p>
      </footer>
    </article>

    <!-- Second article -->
    <article>
      <header>
        <h2><a href="/articles/css-grid">CSS Grid Layout in Practice</a></h2>
        <p class="meta">
          <time datetime="2024-01-10">January 10, 2024</time>
        </p>
      </header>
      <p>CSS Grid is a two-dimensional layout system particularly suited for page-level layout design...</p>
      <footer>
        <a href="/articles/css-grid">Continue reading</a>
      </footer>
    </article>

    <!-- Pagination navigation -->
    <nav aria-label="Article pagination">
      <ul class="pagination">
        <li><a href="/page/1" aria-current="page">1</a></li>
        <li><a href="/page/2">2</a></li>
        <li><a href="/page/3">3</a></li>
        <li><a href="/page/2" aria-label="Next page">Next</a></li>
      </ul>
    </nav>
  </main>

  <!-- Sidebar -->
  <aside aria-label="Sidebar">
    <section>
      <h2>About the Author</h2>
      <p>Senior frontend engineer focused on React and modern web technologies.</p>
    </section>

    <section>
      <h2>Popular Tags</h2>
      <ul class="tag-cloud">
        <li><a href="/tags/javascript">JavaScript</a></li>
        <li><a href="/tags/react">React</a></li>
        <li><a href="/tags/css">CSS</a></li>
        <li><a href="/tags/typescript">TypeScript</a></li>
      </ul>
    </section>

    <section>
      <h2>Subscribe for Updates</h2>
      <form action="/subscribe" method="post">
        <label for="email">Email address:</label>
        <input type="email" id="email" name="email" required>
        <button type="submit">Subscribe</button>
      </form>
    </section>
  </aside>

  <!-- Page footer -->
  <footer>
    <nav aria-label="Footer navigation">
      <section>
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/articles">All Articles</a></li>
          <li><a href="/tutorials">Tutorial Series</a></li>
          <li><a href="/resources">Resources</a></li>
        </ul>
      </section>

      <section>
        <h3>About</h3>
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
        </ul>
      </section>
    </nav>

    <address>
      Contact us: <a href="mailto:contact@example.com">contact@example.com</a>
    </address>

    <p>
      <small>&copy; 2024 Frontend Tech Blog. All rights reserved.</small>
    </p>
  </footer>
</body>
</html>
```

### E-commerce Product Page Example

```html
<main>
  <article itemscope itemtype="https://schema.org/Product">
    <header>
      <nav aria-label="Breadcrumb">
        <ol>
          <li><a href="/">Home</a></li>
          <li><a href="/electronics">Electronics</a></li>
          <li aria-current="page">Wireless Headphones</li>
        </ol>
      </nav>
      <h1 itemprop="name">High-Fidelity Wireless Bluetooth Headphones</h1>
    </header>

    <figure>
      <img src="/products/headphone.jpg"
           alt="Black wireless Bluetooth headphones front view"
           itemprop="image">
      <figcaption>Product photo</figcaption>
    </figure>

    <section aria-labelledby="price-section">
      <h2 id="price-section" class="visually-hidden">Price Information</h2>
      <p itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <span class="price" itemprop="price" content="299">$299</span>
        <span class="original-price"><del>$499</del></span>
        <meta itemprop="priceCurrency" content="USD">
      </p>
    </section>

    <section aria-labelledby="description-section">
      <h2 id="description-section">Product Description</h2>
      <p itemprop="description">Featuring the latest Bluetooth 5.3 technology with active noise cancellation and up to 40 hours of battery life...</p>
    </section>

    <section aria-labelledby="specs-section">
      <h2 id="specs-section">Specifications</h2>
      <dl>
        <dt>Connectivity</dt>
        <dd>Bluetooth 5.3</dd>
        <dt>Battery Life</dt>
        <dd>40 hours</dd>
        <dt>Charging Port</dt>
        <dd>USB-C</dd>
      </dl>
    </section>

    <section aria-labelledby="reviews-section">
      <h2 id="reviews-section">Customer Reviews</h2>

      <article>
        <header>
          <strong>Michael Johnson</strong>
          <time datetime="2024-01-10">January 10, 2024</time>
        </header>
        <p>Excellent sound quality, impressive noise cancellation. Great value for money!</p>
        <footer>
          <data value="5">5-star review</data>
        </footer>
      </article>

      <article>
        <header>
          <strong>Sarah Williams</strong>
          <time datetime="2024-01-08">January 8, 2024</time>
        </header>
        <p>Very comfortable to wear, perfect for long listening sessions.</p>
        <footer>
          <data value="4">4-star review</data>
        </footer>
      </article>
    </section>
  </article>

  <aside>
    <h2>Related Products</h2>
    <ul>
      <li><a href="/products/earbuds">In-ear Bluetooth Earbuds</a></li>
      <li><a href="/products/speaker">Portable Bluetooth Speaker</a></li>
    </ul>
  </aside>
</main>
```

## Accessibility Benefits

Semantic tags are the foundation of building accessible websites:

### Screen Reader Navigation

Screen reader users can navigate quickly using semantic landmarks:
- Press `D` to jump to the next landmark
- Jump directly to `<main>` content
- List all `<nav>` regions for selection

### Skip Links

Skip links allow keyboard users to bypass repetitive content:

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>...</header>
  <nav>...</nav>
  <main id="main-content">
    <!-- Users can skip navigation and jump directly here -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>
```

### Keyboard Navigation Enhancement

Semantic interactive elements (like `<button>`, `<a>`) natively support keyboard operation:

```html
<!-- Recommended: Use semantic elements -->
<button onclick="toggleMenu()">Menu</button>

<!-- Avoid: div simulating button requires extra work -->
<div role="button" tabindex="0" onclick="toggleMenu()" onkeydown="handleKey(event)">
  Menu
</div>
```

### ARIA Landmark Role Mapping

| Semantic Tag | ARIA Landmark Role | Screen Reader Announcement |
|--------------|-------------------|---------------------------|
| `<header>` (page-level) | banner | "Banner" |
| `<nav>` | navigation | "Navigation" |
| `<main>` | main | "Main" |
| `<aside>` | complementary | "Complementary" |
| `<footer>` (page-level) | contentinfo | "Content info" |

### Accessibility Checklist

- [ ] Page has one and only one `<main>` element
- [ ] All images have descriptive `alt` attributes
- [ ] Heading levels are logical with no skipping
- [ ] Every form input has a corresponding `<label>`
- [ ] Multiple `<nav>` elements use `aria-label` to differentiate
- [ ] Interactive elements are keyboard accessible
- [ ] Color contrast meets WCAG standards
- [ ] Skip links are provided to bypass repeated content

## SEO Advantages

Semantic tags have a significant impact on search engine optimization:

### Content Hierarchy Recognition

Search engines use semantic tags to understand page structure:
- `<main>` helps identify core content
- `<article>` marks independently indexable content units
- `<nav>` distinguishes navigation from body content

### Rich Snippets

Properly using semantic tags with structured data can display enhanced information in search results:

```html
<article itemscope itemtype="https://schema.org/Article">
  <header>
    <h1 itemprop="headline">Article Title</h1>
    <time itemprop="datePublished" datetime="2024-01-15">
      January 15, 2024
    </time>
  </header>
  <div itemprop="articleBody">...</div>
</article>
```

### Crawling Efficiency

Clear semantic structure helps search engine crawlers more efficiently understand and index page content. When content is properly structured, search engines can:

- Better understand content relationships
- Identify the most important content on the page
- Index pages more accurately
- Display more relevant search results

## Best Practices

### Follow Content-First Principle

Consider the **semantic meaning** of content first, then choose the appropriate tag. Ask yourself:

- What is this content? (Heading, paragraph, list, quote?)
- What role does it play on the page? (Navigation, main content, supplementary?)
- Is it independent and complete? (article vs section)

### Maintain Tag Hierarchy

```html
<!-- Recommended: Clear hierarchy -->
<main>
  <article>
    <header>
      <h1>Article Title</h1>
    </header>
    <section>
      <h2>Section Title</h2>
    </section>
  </article>
</main>

<!-- Avoid: Flat structure -->
<div class="main">
  <div class="article">
    <div class="header">
      <h1>Article Title</h1>
    </div>
  </div>
</div>
```

### Ensure Every section/article Has a Heading

Sectioning content should have corresponding heading elements. This is important for both accessibility and SEO:

```html
<!-- Recommended -->
<section aria-labelledby="faq-title">
  <h2 id="faq-title">Frequently Asked Questions</h2>
  <details>
    <summary>How do I return an item?</summary>
    <p>Please apply within 7 days of receiving...</p>
  </details>
</section>

<!-- If there's truly no visible heading, use aria-label -->
<section aria-label="User comments list">
  <!-- Comment content -->
</section>
```

### Use Correct Heading Levels

Headings should form a logical hierarchy without skipping levels:

```html
<!-- Recommended -->
<h1>Page Main Title</h1>
  <h2>First-level Section</h2>
    <h3>Second-level Section</h3>
  <h2>Another First-level Section</h2>

<!-- Avoid: Skipping levels -->
<h1>Page Main Title</h1>
  <h3>Jumping straight to h3</h3>  <!-- Wrong -->
```

### Label Multiple Navigations of the Same Type

```html
<nav aria-label="Main menu">...</nav>
<nav aria-label="Breadcrumb navigation">...</nav>
<nav aria-label="Footer links">...</nav>
```

### Enhance Semantics with Microdata

Combining Schema.org microdata helps search engines better understand content:

```html
<article itemscope itemtype="https://schema.org/BlogPosting">
  <h1 itemprop="headline">Article Title</h1>
  <p itemprop="author" itemscope itemtype="https://schema.org/Person">
    Author: <span itemprop="name">John Smith</span>
  </p>
  <time itemprop="datePublished" datetime="2024-01-15">January 15, 2024</time>
  <div itemprop="articleBody">
    <p>Article content...</p>
  </div>
</article>
```

## Common Mistakes to Avoid

### Mistake 1: Overusing Semantic Tags

**Wrong**: Replacing all `<div>` elements with semantic tags

```html
<!-- Wrong: Containers used only for styling shouldn't use semantic tags -->
<section class="flex-container">
  <article class="card">
    <p>This is just a styled card...</p>
  </article>
</section>

<!-- Correct: Pure styling containers should use div -->
<div class="flex-container">
  <div class="card">
    <p>This is just a styled card...</p>
  </div>
</div>
```

### Mistake 2: Confusing article and section

**Test**: Can the content exist independently?

```html
<!-- This should be an article: blog posts can be distributed independently -->
<article>
  <h2>How to Learn Programming</h2>
  <p>The key to learning programming is practice...</p>
</article>

<!-- This should be a section: chapters depend on article context -->
<article>
  <h1>JavaScript Tutorial</h1>
  <section>
    <h2>Chapter 1: Variables</h2>
  </section>
  <section>
    <h2>Chapter 2: Functions</h2>
  </section>
</article>
```

### Mistake 3: Nesting main Inside main

```html
<!-- Wrong: Multiple visible main elements -->
<main>
  <main>Content</main>  <!-- Wrong! -->
</main>

<!-- Correct: Only one main (unless others are hidden) -->
<main>Content</main>
```

### Mistake 4: Ignoring header/footer Scope

header and footer are not limited to page-level use:

```html
<!-- Common misconception: Only using header/footer at page level -->
<body>
  <header>Page header</header>
  <main>
    <div class="article-header">Article header</div>  <!-- Wrong -->
    <p>Content</p>
    <div class="article-footer">Article footer</div>  <!-- Wrong -->
  </main>
  <footer>Page footer</footer>
</body>

<!-- Correct: Use header/footer inside article/section -->
<article>
  <header>
    <h2>Article Title</h2>
    <p>Author information</p>
  </header>
  <p>Content</p>
  <footer>
    <p>Publication date, tags, etc.</p>
  </footer>
</article>
```

### Mistake 5: Using nav for All Links

```html
<!-- Wrong: Regular link lists don't need nav -->
<nav>
  <h2>Related Articles</h2>
  <ul>
    <li><a href="#">Article 1</a></li>
    <li><a href="#">Article 2</a></li>
  </ul>
</nav>

<!-- Correct: Only major navigation needs nav -->
<aside>
  <h2>Related Articles</h2>
  <ul>
    <li><a href="#">Article 1</a></li>
    <li><a href="#">Article 2</a></li>
  </ul>
</aside>
```

### Mistake 6: Redundant ARIA Roles

Semantic tags already have implicit ARIA roles; no need to declare them again:

```html
<!-- Redundant: nav already has the navigation role -->
<nav role="navigation">...</nav>

<!-- Correct: Just use the semantic tag -->
<nav>...</nav>
```

## Interview Key Points

### Basic Questions

**Q1: What is HTML5 semantic markup? Why use semantic tags?**

Answer: Semantic markup means using HTML tags with clear meanings to describe content structure and purpose, not just appearance. Benefits of using semantic tags include:
1. Improved code readability and maintainability
2. Better SEO, helping search engines understand content
3. Enhanced accessibility for assistive technologies
4. Better team collaboration with unified code standards

**Q2: List 5 HTML5 semantic tags and explain their purposes**

Answer:
- `<header>`: Page header area, contains introductory content or navigation
- `<nav>`: Navigation link area
- `<main>`: Main page content, only one per page
- `<article>`: Independent content unit, like a blog post
- `<section>`: Thematic content grouping
- `<aside>`: Sidebar content tangentially related to main content
- `<footer>`: Footer area, contains copyright information, etc.

### Advanced Questions

**Q3: What's the difference between article and section? How do you choose?**

Answer:
- `<article>` is for independent, complete content that can be distributed separately (like RSS)
- `<section>` is for thematically grouped content that depends on document context
- Selection criteria: Ask yourself "Can this content exist independently and have meaning?" If yes, use article; if it's a chapter of the document, use section

**Q4: Can header and footer only be used at page level?**

Answer: No. header and footer can be used inside any sectioning content (`<article>`, `<section>`, etc.). For example, an article's title and metadata can go in the article's header, and the article's tags and copyright info can go in the article's footer.

**Q5: How do semantic tags affect SEO?**

Answer:
1. Search engines use semantic tags to identify content structure and importance
2. `<main>` helps identify the core content area
3. `<article>` marks independently indexable content units
4. Combined with Schema.org microdata, you can get rich snippet display in search results
5. Clear structure improves crawler efficiency

### Practical Questions

**Q6: If asked to refactor an old page using many divs, what would you do?**

Answer:
1. First analyze page structure, identifying each block's function
2. Identify page header, navigation, main content, sidebar, footer
3. Identify independent content units (article) and thematic groupings (section)
4. Gradually replace divs with corresponding semantic tags
5. Check if heading levels are correct
6. Add aria-label to distinguish multiple similar elements
7. Verify with accessibility testing tools
8. Ensure existing styles aren't broken (adjust CSS selectors if necessary)

**Q7: How do you verify if page semantics are correct?**

Answer:
1. Use browser DevTools Accessibility panel to view landmarks
2. Run Lighthouse accessibility audit
3. Test with screen readers (like NVDA, VoiceOver)
4. Use W3C validator to check HTML validity
5. Use accessibility testing tools like axe, WAVE
6. Disable CSS and check if page structure remains clear

## Further Reading

### Official Documentation

- [MDN - HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [W3C HTML5 Specification](https://html.spec.whatwg.org/)
- [WAI-ARIA Specification](https://www.w3.org/TR/wai-aria-1.2/)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)

### Recommended Books

- "The Definitive Guide to HTML5" - Adam Freeman
- "A Web for Everyone: Designing Accessible User Experiences" - Sarah Horton & Whitney Quesenbery
- "Inclusive Design Patterns" - Heydon Pickering

### Quality Articles

- [HTML5 Doctor - Semantic Element Usage Guide](http://html5doctor.com/)
- [A List Apart - Semantics in HTML5](https://alistapart.com/article/semanticsinhtml5/)
- [Web.dev - Accessibility Fundamentals](https://web.dev/accessibility/)

### Useful Tools

- [W3C HTML Validator](https://validator.w3.org/)
- [axe DevTools - Accessibility Testing](https://www.deque.com/axe/)
- [WAVE - Web Accessibility Evaluation Tool](https://wave.webaim.org/)
- [Lighthouse - Performance & Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
- [Schema.org - Structured Data Markup](https://schema.org/)

---

> Semantic HTML is not just a technical specification, but a user-centered development philosophy. Writing semantic HTML means building a more inclusive web for all users, including those who rely on assistive technologies.
