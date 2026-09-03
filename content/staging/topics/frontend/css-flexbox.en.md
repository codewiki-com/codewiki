---
title: CSS Flexbox Complete Guide
description: Master CSS Flexbox for one-dimensional layouts
track: frontend
section: html-css
difficulty: beginner
tags:
  - CSS
  - Flexbox
  - Layout
  - Responsive
status: imported
origin: old/src/content/docs/frontend/css-flexbox.en.md
divergence: 0.236
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 3
  lastUpdated: 2026-01-07
---

Flexbox (Flexible Box Layout) is one of the most revolutionary layout modules in CSS3. It has fundamentally changed how we approach web layouts, making previously complex hacks simple and intuitive. This comprehensive guide covers everything from basic concepts to practical applications of Flexbox.

## Flexbox Fundamentals

### What is Flexbox?

Flexbox is short for Flexible Box Layout Module, a **one-dimensional layout model**. The term "one-dimensional" means Flexbox handles layout in one direction at a time - either horizontally (row) or vertically (column).

Before Flexbox, CSS layouts primarily relied on these methods:

- **Float**: Originally designed for text wrapping around images, later widely "misused" for page layouts
- **Position**: Good for precise control of individual elements, but difficult for complex responsive layouts
- **Table Layout**: Semantically incorrect and inflexible
- **Inline-block**: Has whitespace gap issues and vertical alignment difficulties

All these traditional methods have their limitations. Flexbox makes the following tasks remarkably simple:

- Vertically centering an element (no more hacks needed)
- Making multiple elements equally divide container space
- Creating equal-height elements with different content
- Changing visual order without modifying HTML structure

### Container and Items

Flexbox layout involves two core concepts: **Flex Container** and **Flex Items**.

```css
/* Transform an element into a Flex container */
.container {
  display: flex;
  /* or display: inline-flex; */
}
```

When an element is set to `display: flex` or `display: inline-flex`:

- That element becomes a **Flex Container**
- Its **direct children** automatically become **Flex Items**
- Grandchildren and deeper nested elements are not directly affected by Flex layout

```html
<div class="container">           <!-- Flex Container -->
  <div class="item">Item 1</div>  <!-- Flex Item -->
  <div class="item">Item 2</div>  <!-- Flex Item -->
  <div class="item">              <!-- Flex Item -->
    <span>Grandchild</span>       <!-- NOT a Flex Item -->
  </div>
</div>
```

The difference between `display: flex` and `display: inline-flex`:

- `flex`: The container behaves as a block-level element, taking up the full width
- `inline-flex`: The container behaves as an inline element, can share a line with other inline elements

## Main Axis and Cross Axis

### Understanding the Axes

The core of understanding Flexbox lies in grasping the concepts of **Main Axis** and **Cross Axis**. These two axes form the coordinate system of Flex layout.

```
flex-direction: row (default)

        main-start                            main-end
             |                                   |
cross-start  +-----------------------------------+
             |  +-------+  +-------+  +-------+  |
             |  | Item1 |  | Item2 |  | Item3 |  | <-- Main Axis direction
             |  +-------+  +-------+  +-------+  |
cross-end    +-----------------------------------+
                          |
                    Cross Axis direction

flex-direction: column

             | main-start
cross-start  +-------------------+ cross-end
             |    +-------+      |
             |    | Item1 |      |
             |    +-------+      |
             |    +-------+      |   |
             |    | Item2 |      | Main Axis
             |    +-------+      | direction
             |    +-------+      |
             |    | Item3 |      |
             |    +-------+      |
             +-------------------+
             | main-end
```

### Axis Terminology

- **Main Axis**: The primary direction along which Flex items are arranged, determined by `flex-direction`
- **Cross Axis**: The direction perpendicular to the main axis
- **main-start/main-end**: The start and end points of the main axis
- **cross-start/cross-end**: The start and end points of the cross axis
- **main size**: The size of a Flex item along the main axis
- **cross size**: The size of a Flex item along the cross axis

Remember this key point: **All alignment properties work relative to these two axes**. `justify-content` controls alignment on the main axis, while `align-items` and `align-content` control alignment on the cross axis.

## Container Properties in Detail

There are six main properties that can be set on a Flex container:

### flex-direction

The `flex-direction` property determines the main axis direction, which is the direction Flex items are arranged.

```css
.container {
  flex-direction: row;            /* Default: left-to-right (LTR) or right-to-left (RTL) */
  flex-direction: row-reverse;    /* Opposite of row */
  flex-direction: column;         /* Top to bottom */
  flex-direction: column-reverse; /* Bottom to top */
}
```

**Practical Examples:**

```css
/* Create a vertical sidebar navigation */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Responsive design: vertical on small screens, horizontal on large screens */
.navigation {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .navigation {
    flex-direction: row;
  }
}
```

### flex-wrap

By default, all Flex items try to fit on one line (or column). The `flex-wrap` property controls whether items should wrap when container space is insufficient.

```css
.container {
  flex-wrap: nowrap;       /* Default: no wrapping, items may shrink or overflow */
  flex-wrap: wrap;         /* Wrap, first line on top */
  flex-wrap: wrap-reverse; /* Wrap, first line on bottom */
}
```

**Visual Representation:**

```
flex-wrap: nowrap (default)
+------------------------------+
| [1] [2] [3] [4] [5] [6]      | <-- All items squeezed on one line
+------------------------------+

flex-wrap: wrap
+------------------------------+
| [1] [2] [3] [4]              |
| [5] [6]                      | <-- Automatic wrapping
+------------------------------+

flex-wrap: wrap-reverse
+------------------------------+
| [5] [6]                      | <-- First line at bottom
| [1] [2] [3] [4]              |
+------------------------------+
```

**The flex-flow Shorthand:**

`flex-flow` is shorthand for `flex-direction` and `flex-wrap`:

```css
.container {
  flex-flow: row wrap;           /* Horizontal, allow wrapping */
  flex-flow: column nowrap;      /* Vertical, no wrapping */
}
```

### justify-content

`justify-content` defines how Flex items are aligned on the **main axis**, distributing remaining space.

```css
.container {
  justify-content: flex-start;    /* Default: items align to main axis start */
  justify-content: flex-end;      /* Items align to main axis end */
  justify-content: center;        /* Items centered on main axis */
  justify-content: space-between; /* Items evenly distributed; first at start, last at end */
  justify-content: space-around;  /* Items evenly distributed with equal space around each */
  justify-content: space-evenly;  /* Items evenly distributed with equal space between */
}
```

**Visual Comparison:**

```
justify-content: flex-start
|[1][2][3]                    |

justify-content: flex-end
|                    [1][2][3]|

justify-content: center
|          [1][2][3]          |

justify-content: space-between
|[1]         [2]         [3]|
 ^ First and last touch edges, middle evenly distributed

justify-content: space-around
|  [1]      [2]      [3]  |
   ^ Equal space on each side of items (space between items is 2x edge space)

justify-content: space-evenly
|   [1]    [2]    [3]   |
    ^ All spaces are exactly equal
```

### align-items

`align-items` defines how Flex items are aligned on the **cross axis**. It affects all items within a single line.

```css
.container {
  align-items: stretch;    /* Default: stretch to fill container's cross axis */
  align-items: flex-start; /* Items align to cross axis start */
  align-items: flex-end;   /* Items align to cross axis end */
  align-items: center;     /* Items centered on cross axis */
  align-items: baseline;   /* Items aligned by their first line of text baseline */
}
```

**Visual Comparison (assuming flex-direction: row):**

```
align-items: stretch (default)
+---------------------+
| +---+ +---+ +---+   |
| | 1 | | 2 | | 3 |   | <-- All items same height
| |   | |   | |   |   |
| +---+ +---+ +---+   |
+---------------------+

align-items: flex-start
+---------------------+
| +-+ +--+ +---+      | <-- Top aligned
| +-+ +--+ +---+      |
|                     |
+---------------------+

align-items: flex-end
+---------------------+
|                     |
| +-+ +--+ +---+      | <-- Bottom aligned
| +-+ +--+ +---+      |
+---------------------+

align-items: center
+---------------------+
|      +--+           |
| +-+  |  |  +---+    | <-- Vertically centered
| +-+  +--+  +---+    |
+---------------------+

align-items: baseline
+-------------------------+
| +---+  +-----+  +---+   |
| | A |  |  B  |  | C |   | <-- Text baseline aligned
| +---+  |     |  +---+   |
|        +-----+          |
+-------------------------+
```

### align-content

`align-content` defines how **multiple lines** of Flex items are aligned on the cross axis. **This only works when `flex-wrap: wrap` and there are multiple lines**.

```css
.container {
  flex-wrap: wrap;  /* Must allow wrapping */
  align-content: stretch;       /* Default: stretch to fill entire cross axis */
  align-content: flex-start;    /* Lines packed to cross axis start */
  align-content: flex-end;      /* Lines packed to cross axis end */
  align-content: center;        /* Lines centered on cross axis */
  align-content: space-between; /* First and last lines at edges, rest evenly distributed */
  align-content: space-around;  /* Equal space around each line */
  align-content: space-evenly;  /* Equal space between all lines */
}
```

**align-items vs align-content:**

- `align-items`: Controls alignment of items **within a line**
- `align-content`: Controls alignment **between lines**

### gap

The `gap` property sets the spacing between Flex items. It's shorthand for `row-gap` and `column-gap`.

```css
.container {
  display: flex;
  gap: 20px;           /* Both row and column gap are 20px */
  gap: 20px 10px;      /* Row gap 20px, column gap 10px */
  row-gap: 20px;       /* Set only row gap */
  column-gap: 10px;    /* Set only column gap */
}
```

**Advantages of Using gap:**

```css
/* Traditional approach: using margin (need to handle last element's margin) */
.item {
  margin-right: 20px;
}
.item:last-child {
  margin-right: 0;
}

/* Modern approach: using gap (cleaner and more elegant) */
.container {
  display: flex;
  gap: 20px;
}
```

## Item Properties in Detail

There are six main properties that can be set on Flex items:

### flex-grow

`flex-grow` defines the **growth ratio** of a Flex item, determining how items distribute remaining space when the container has extra room.

```css
.item {
  flex-grow: 0; /* Default: don't grow */
  flex-grow: 1; /* Can grow, takes share of remaining space */
  flex-grow: 2; /* Gets twice the share of remaining space */
}
```

**Calculation Formula:**

```
Item final width = Item base width + (Remaining space * (item's flex-grow / sum of all flex-grow values))
```

**Example:**

```css
/* Assuming container width is 500px */
.container {
  display: flex;
  width: 500px;
}

/* Three items with base width of 100px each, remaining space = 500 - 300 = 200px */
.item-1 { flex-grow: 1; }  /* Gets 200 * (1/4) = 50px, final width 150px */
.item-2 { flex-grow: 2; }  /* Gets 200 * (2/4) = 100px, final width 200px */
.item-3 { flex-grow: 1; }  /* Gets 200 * (1/4) = 50px, final width 150px */
```

### flex-shrink

`flex-shrink` defines the **shrink ratio** of a Flex item, determining how items shrink when container space is insufficient.

```css
.item {
  flex-shrink: 1; /* Default: shrink proportionally */
  flex-shrink: 0; /* Don't shrink (maintain original size) */
  flex-shrink: 2; /* Shrinks twice as much as other items */
}
```

**Calculation Formula (more complex than flex-grow because it considers base size):**

```
Shrink amount = Overflow * (flex-shrink * flex-basis) / Sum(flex-shrink * flex-basis)
```

**Practical Application: Preventing Image Compression**

```css
.card {
  display: flex;
}

.card-image {
  flex-shrink: 0;  /* Image won't shrink */
  width: 200px;
}

.card-content {
  flex-shrink: 1;  /* Content can shrink */
}
```

### flex-basis

`flex-basis` defines the **initial main axis size** of a Flex item before remaining space is distributed.

```css
.item {
  flex-basis: auto;  /* Default: use item's own size (width or height) */
  flex-basis: 0;     /* Ignore content size completely, distribute by flex-grow */
  flex-basis: 200px; /* Fixed initial width */
  flex-basis: 30%;   /* Percentage (relative to container's main axis size) */
  flex-basis: content; /* Calculate based on content automatically */
}
```

**flex-basis vs width Priority:**

In a Flex context, `flex-basis` takes priority over `width` (or `height`, depending on main axis direction).

```css
.item {
  width: 200px;       /* Ignored in Flex context */
  flex-basis: 300px;  /* This takes effect */
}
```

### flex (Shorthand Property)

`flex` is shorthand for `flex-grow`, `flex-shrink`, and `flex-basis`. **Using the shorthand is strongly recommended**.

```css
.item {
  flex: 0 1 auto;   /* Default: don't grow, can shrink, based on content size */
  flex: 1;          /* Equivalent to flex: 1 1 0% (can grow/shrink, ignore content size) */
  flex: auto;       /* Equivalent to flex: 1 1 auto (can grow/shrink, based on content) */
  flex: none;       /* Equivalent to flex: 0 0 auto (don't grow or shrink) */
  flex: 2 1 200px;  /* grow: 2, shrink: 1, basis: 200px */
}
```

**Common Values Explained:**

| Shorthand | Equivalent | Meaning |
|-----------|------------|---------|
| `flex: initial` | `flex: 0 1 auto` | Default, don't grow but can shrink |
| `flex: auto` | `flex: 1 1 auto` | Can grow and shrink, based on content |
| `flex: none` | `flex: 0 0 auto` | No flex at all, maintain original size |
| `flex: 1` | `flex: 1 1 0%` | Equal share of remaining space |
| `flex: 2` | `flex: 2 1 0%` | Gets double share |

### order

The `order` property defines the **arrangement order** of Flex items. Lower values appear first.

```css
.item {
  order: 0; /* Default value */
}

.item:nth-child(1) { order: 3; }  /* Originally first, now appears third */
.item:nth-child(2) { order: 1; }  /* Originally second, now appears first */
.item:nth-child(3) { order: 2; }  /* Originally third, now appears second */
```

**Important Notes:**

- Only affects visual order, doesn't change DOM structure
- Screen readers and keyboard navigation still follow DOM order
- Overuse can cause accessibility issues

### align-self

`align-self` allows a single Flex item to **override** the container's `align-items` setting for independent cross-axis alignment.

```css
.container {
  display: flex;
  align-items: flex-start;  /* Container default: top aligned */
}

.special-item {
  align-self: center;       /* This item individually centered */
}
```

```css
.item {
  align-self: auto;       /* Default: inherit container's align-items */
  align-self: flex-start; /* Align to cross axis start */
  align-self: flex-end;   /* Align to cross axis end */
  align-self: center;     /* Center on cross axis */
  align-self: baseline;   /* Baseline alignment */
  align-self: stretch;    /* Stretch to fill */
}
```

## Common Layout Patterns

### Perfect Centering

The most classic Flexbox use case:

```css
/* Horizontal and vertical centering */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* Just two lines of core code */
.center-box {
  display: flex;
  place-content: center;  /* Shorthand for justify-content + align-content */
}
```

### Equal Distribution Layout

```css
/* Three equal columns */
.container {
  display: flex;
}

.item {
  flex: 1;  /* Each item gets equal space */
}

/* Unequal: 1:2:1 layout */
.sidebar { flex: 1; }
.main { flex: 2; }
.aside { flex: 1; }
```

### Holy Grail Layout

The classic three-column layout with Header, Footer, two sidebars, and main content area:

```html
<div class="holy-grail">
  <header class="header">Header</header>
  <div class="body">
    <nav class="sidebar">Sidebar</nav>
    <main class="main">Main Content</main>
    <aside class="aside">Aside</aside>
  </div>
  <footer class="footer">Footer</footer>
</div>
```

```css
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header, .footer {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
}

.body {
  display: flex;
  flex: 1;
}

.sidebar {
  flex: 0 0 200px;  /* Fixed width, no flex */
  background: #34495e;
  color: white;
  padding: 1rem;
}

.main {
  flex: 1;  /* Takes remaining space */
  padding: 1rem;
}

.aside {
  flex: 0 0 150px;  /* Fixed width, no flex */
  background: #95a5a6;
  padding: 1rem;
}

/* Responsive: single column on small screens */
@media (max-width: 768px) {
  .body {
    flex-direction: column;
  }

  .sidebar, .aside {
    flex-basis: auto;
  }
}
```

### Sticky Footer

Keep the footer at the bottom of the page (even when content is insufficient):

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
}

main {
  flex: 1;  /* Main content takes all available space */
}

footer {
  /* Footer naturally sticks to bottom */
  background: #2c3e50;
  color: white;
  padding: 2rem;
}
```

### Media Object Layout

The classic image/avatar + content pattern:

```css
.media {
  display: flex;
  gap: 1rem;
}

.media-image {
  flex-shrink: 0;  /* Prevent image compression */
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.media-body {
  flex: 1;
  min-width: 0;  /* Allow text truncation (important!) */
}
```

## Flexbox vs Grid

### Core Differences

| Feature | Flexbox | CSS Grid |
|---------|---------|----------|
| **Layout Dimension** | One-dimensional (row or column) | Two-dimensional (rows and columns simultaneously) |
| **Design Philosophy** | Content-first | Layout-first |
| **Alignment Control** | Main axis + Cross axis | Rows + Columns |
| **Item Positioning** | Based on document flow order | Can precisely position to any location |
| **Overlap Capability** | Requires additional positioning | Native support |
| **Responsive** | Natural flow | Requires more configuration |

### Selection Guide

**Use Flexbox for:**

- Single row or column arrangements (navigation bars, button groups)
- Content-driven layouts (let content determine size)
- Simple centering alignment
- Small-scale layouts within components

**Use Grid for:**

- Complex layouts requiring simultaneous control of rows and columns
- Overall page layout frameworks
- Designs requiring element overlap
- Regular grid systems

**Best Practice: Use Both Together**

```css
/* Grid for overall page layout */
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* Flexbox for component internal layout */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-list {
  display: flex;
  gap: 1.5rem;
}
```

## Responsive Design with Flexbox

### Responsive Navigation Bar

```html
<nav class="navbar">
  <div class="logo">MyBrand</div>
  <ul class="nav-links">
    <li><a href="#">Home</a></li>
    <li><a href="#">Products</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
  <button class="cta-btn">Sign Up</button>
</nav>
```

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: white;
}

.cta-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive design */
@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav-links {
    order: 3;
    flex-basis: 100%;
    justify-content: center;
    gap: 1rem;
  }
}
```

### Card Layout

```html
<div class="card-grid">
  <article class="card">
    <div class="card-image">
      <img src="image.jpg" alt="Card Image">
    </div>
    <div class="card-content">
      <span class="card-tag">Technology</span>
      <h3 class="card-title">CSS Flexbox Practical Tips</h3>
      <p class="card-desc">Learn various practical tips and best practices for Flexbox layout...</p>
    </div>
    <div class="card-footer">
      <div class="author">
        <img src="avatar.jpg" alt="Author" class="author-avatar">
        <span class="author-name">John Doe</span>
      </div>
      <time class="card-date">2024-01-15</time>
    </div>
  </article>
  <!-- More cards... -->
</div>
```

```css
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
}

.card {
  flex: 1 1 320px;  /* Min width 320px, can grow and shrink */
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.card-image {
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  flex: 1;  /* Key: content area fills remaining space */
  padding: 1.5rem;
}

.card-tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.card-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  line-height: 1.4;
}

.card-desc {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.card-date {
  font-size: 0.75rem;
  color: #999;
}
```

### Form Layout

```html
<form class="form">
  <div class="form-row">
    <div class="form-group">
      <label for="firstName">First Name</label>
      <input type="text" id="firstName" placeholder="Enter first name">
    </div>
    <div class="form-group">
      <label for="lastName">Last Name</label>
      <input type="text" id="lastName" placeholder="Enter last name">
    </div>
  </div>

  <div class="form-group">
    <label for="email">Email Address</label>
    <input type="email" id="email" placeholder="example@domain.com">
  </div>

  <div class="form-group">
    <label for="message">Message</label>
    <textarea id="message" rows="4" placeholder="Enter your message..."></textarea>
  </div>

  <div class="form-actions">
    <button type="button" class="btn btn-secondary">Cancel</button>
    <button type="submit" class="btn btn-primary">Submit</button>
  </div>
</form>
```

```css
.form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Responsive: stack name fields on small screens */
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
```

## Best Practices

### Use Shorthand Properties

Always prefer the `flex` shorthand over individual properties:

```css
/* Recommended */
.item {
  flex: 1 0 200px;
}

/* Not recommended */
.item {
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 200px;
}
```

### Prevent Overflow with min-width: 0

Flex items have `min-width: auto` by default, which can cause overflow issues with long text:

```css
.item {
  min-width: 0;  /* Allow shrinking below content size */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Use gap Instead of Margins

The `gap` property is cleaner and easier to maintain:

```css
/* Modern approach */
.container {
  display: flex;
  gap: 1rem;
}

/* Avoid this */
.item {
  margin-right: 1rem;
}
.item:last-child {
  margin-right: 0;
}
```

### Accessibility Considerations

When using `order` to change visual order, remember that screen readers and keyboard navigation still follow DOM order:

```css
/* Use with caution */
.item {
  order: -1;  /* Visual order changed, but accessibility order unchanged */
}
```

### Performance Tips

1. Avoid frequently changing flex properties that trigger reflow
2. For large numbers of Flex items, consider virtual scrolling
3. Use `transform` for animations instead of changing dimensions

## Interview Key Points

### Frequently Asked Questions

**Q1: What are the main axis and cross axis?**

A: The main axis is the direction along which Flex items are arranged, determined by `flex-direction`. The cross axis is perpendicular to the main axis. By default, the main axis is horizontal (left to right) and the cross axis is vertical (top to bottom).

**Q2: Explain what flex: 1 means**

A: `flex: 1` is shorthand for `flex: 1 1 0%`, meaning:
- `flex-grow: 1` - Can grow, takes share of remaining space
- `flex-shrink: 1` - Can shrink
- `flex-basis: 0%` - Initial size is 0, completely depends on flex-grow for space distribution

**Q3: What's the difference between justify-content and align-items?**

A: Both are alignment properties, but they work on different axes:
- `justify-content`: Controls alignment on the main axis
- `align-items`: Controls alignment on the cross axis (single line)

**Q4: What's the difference between align-items and align-content?**

A:
- `align-items`: Controls alignment of items within a single line
- `align-content`: Controls alignment between multiple lines, only works with `flex-wrap: wrap` and multiple lines

**Q5: How do you center an element horizontally and vertically?**

```css
.container {
  display: flex;
  justify-content: center;  /* Center on main axis */
  align-items: center;      /* Center on cross axis */
}
```

**Q6: How does flex-shrink calculate shrinkage?**

A: `flex-shrink` calculation is more complex than `flex-grow` because it considers the item's base size:

```
Shrink amount = Overflow * (flex-shrink * flex-basis) / Sum(flex-shrink * flex-basis)
```

Items with larger base sizes and higher flex-shrink values shrink more.

**Q7: Why doesn't width work after setting flex-basis?**

A: In a Flex context, `flex-basis` has higher priority than `width` (or `height`, depending on main axis direction). If both are set, `flex-basis` overrides the `width` effect.

**Q8: How do you prevent a Flex item from being compressed?**

```css
.item {
  flex-shrink: 0;  /* Disable shrinking */
}
```

### Common Pitfalls

**Pitfall 1: min-width: auto Causing Overflow**

Flex items default to `min-width: auto`, meaning minimum width equals content width. Long text can cause overflow.

```css
/* Solution */
.item {
  min-width: 0;  /* Allow shrinking to 0 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Pitfall 2: Images Distorting in Flex Container**

```css
/* Problem: image may be stretched */
.flex-container img {
  /* May distort */
}

/* Solution */
.flex-container img {
  flex-shrink: 0;
  object-fit: cover;
}
```

**Pitfall 3: flex-basis: 0 vs flex-basis: auto**

- `flex-basis: 0`: Ignores content size, distributes purely by flex-grow ratio
- `flex-basis: auto`: Considers content size first, then distributes remaining space

## Further Reading

### Official Resources

- [MDN Flexbox Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout) - The most authoritative official documentation
- [CSS Flexible Box Layout Module Level 1](https://www.w3.org/TR/css-flexbox-1/) - W3C Specification

### Learning Resources

- [CSS-Tricks: A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) - Classic visual guide
- [Flexbox Froggy](https://flexboxfroggy.com/) - Learn Flexbox through a game
- [Flexbox Defense](http://www.flexboxdefense.com/) - Tower defense style Flexbox practice

### Debugging Tools

- **Chrome DevTools**: Shows "flex" badge in Elements panel, provides layout visualization
- **Firefox DevTools**: Offers the most powerful Flexbox debugging tools with detailed size calculation info
- **Edge DevTools**: Similar to Chrome, supports Flex layout visualization

### Related Technologies

- **CSS Grid**: Two-dimensional layout system, complementary to Flexbox
- **Container Queries**: Responsive design based on container size
- **CSS Logical Properties**: Internationalization-friendly layout properties (e.g., `margin-inline-start`)
- **Subgrid**: Grid extension that allows child elements to inherit parent grid

### Browser Compatibility

Flexbox has excellent support in modern browsers:

- Chrome 29+
- Firefox 28+
- Safari 9+
- Edge 12+
- IE 11 (partial support, many bugs)

For projects requiring IE 11 support, note:
- Avoid using shorthand with `flex-basis: auto`
- Explicitly set `flex-shrink`
- Avoid combining `min-height` with Flexbox
- Use Autoprefixer to add vendor prefixes

## Summary

Flexbox is the cornerstone of modern CSS layout and can solve most layout problems. Key takeaways:

1. **Understand the axis concept**: Main axis and cross axis are the core of Flexbox
2. **Master container properties**: `flex-direction`, `flex-wrap`, `justify-content`, `align-items`, `align-content`, `gap`
3. **Master item properties**: `flex-grow`, `flex-shrink`, `flex-basis`, `flex`, `order`, `align-self`
4. **Use shorthand**: Prefer the `flex` shorthand property
5. **Watch for pitfalls**: `min-width: auto`, `flex-shrink` calculation, `flex-basis` priority
6. **Combine with Grid**: Use Flexbox for one-dimensional layouts, Grid for two-dimensional layouts

Flexbox has a relatively gentle learning curve, but mastery requires extensive practice. Start with simple centering layouts, progressively tackle more complex layout patterns, and eventually you'll be able to confidently use Flexbox to solve any layout challenge.
