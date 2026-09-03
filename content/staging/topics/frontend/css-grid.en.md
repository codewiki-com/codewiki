---
title: CSS Grid Layout Complete Guide
description: Master CSS Grid for powerful two-dimensional web layouts
track: frontend
section: html-css
difficulty: intermediate
tags:
  - CSS
  - Grid
  - Layout
  - Responsive
status: imported
origin: old/src/content/docs/frontend/css-grid.en.md
divergence: 0.198
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: CSS
  order: 2
  lastUpdated: 2026-01-07
---

CSS Grid is one of the most powerful layout systems available in modern CSS. It is a two-dimensional layout system that can handle both rows and columns simultaneously, making complex web layouts simple and intuitive. This comprehensive guide will explore CSS Grid's core concepts, key properties, and practical applications.

## Understanding Two-Dimensional Layout

### The Leap from One-Dimensional to Two-Dimensional

Before CSS Grid, we primarily relied on float, inline-block, and Flexbox for page layouts. Among these, Flexbox is an excellent one-dimensional layout system that handles single-row or single-column element arrangements very well.

However, when we need to control both rows and columns simultaneously, one-dimensional layout systems fall short. CSS Grid was created specifically to solve this problem—it is the first CSS module designed explicitly for two-dimensional layouts.

**One-Dimensional vs Two-Dimensional Layout:**

```
One-Dimensional Layout (Flexbox):
+-----+-----+-----+-----+
|  1  |  2  |  3  |  4  |  <-- Controls only one direction
+-----+-----+-----+-----+

Two-Dimensional Layout (Grid):
+-----+-----+-----+
|  1  |  2  |  3  |  <-- Controls both
+-----+-----+-----+     rows and columns
|  4  |  5  |  6  |     simultaneously
+-----+-----+-----+
|  7  |  8  |  9  |
+-----+-----+-----+
```

### Advantages of Grid Layout

1. **True Two-Dimensional Control**: Define sizes and positions for both rows and columns simultaneously
2. **Explicit Positioning**: Precisely control element placement within the grid
3. **Overlapping Capability**: Elements can overlap without additional positioning tricks
4. **Responsive-Friendly**: Combined with `minmax()` and `auto-fit`, responsive layouts become effortless

## Core Concepts: Grid Container and Grid Items

### Grid Container

When an element is set to `display: grid` or `display: inline-grid`, it becomes a grid container. The grid container is the starting point for all grid layouts.

```css
.container {
  display: grid;
  /* or */
  display: inline-grid;
}
```

**The difference between the two:**
- `display: grid`: The container behaves as a block-level element
- `display: inline-grid`: The container behaves as an inline element

### Grid Items

The direct children of a grid container automatically become grid items. Note that only direct children are grid items—grandchildren and deeper descendants are not directly affected by the grid layout.

```html
<div class="grid-container">
  <div class="grid-item">1</div>  <!-- Grid Item -->
  <div class="grid-item">2</div>  <!-- Grid Item -->
  <div class="grid-item">
    <span>Inner element</span>  <!-- NOT a Grid Item -->
  </div>
</div>
```

### Grid Lines and Grid Tracks

Understanding Grid layout requires mastering several key terms:

- **Grid Line**: The dividing lines that form the grid structure, including row lines and column lines
- **Grid Track**: The space between two adjacent grid lines, forming a row or column
- **Grid Cell**: The smallest unit of space formed by four grid lines
- **Grid Area**: A rectangular region composed of one or more grid cells

```
     Col Line 1  Col Line 2  Col Line 3  Col Line 4
          |          |          |          |
Row Line 1 +----------+----------+----------+
           |          |          |          | <-- Grid Track (row)
Row Line 2 +----------+----------+----------+
           |          |   Cell   |          |
Row Line 3 +----------+----------+----------+
           |          |          |          |
Row Line 4 +----------+----------+----------+
                      |
                 Grid Track (column)
```

## Core Properties Explained

### grid-template-columns and grid-template-rows

These two properties define the sizes of grid columns and rows.

```css
.container {
  display: grid;
  /* Define three columns with widths of 100px, 200px, and 100px */
  grid-template-columns: 100px 200px 100px;
  /* Define two rows, each 50px tall */
  grid-template-rows: 50px 50px;
}
```

### The fr Unit: Flexible Proportion Unit

The `fr` (fraction) unit is unique to Grid layout and represents a proportional share of available space in the grid container.

```css
.container {
  display: grid;
  /* Three columns distributed in a 1:2:1 ratio */
  grid-template-columns: 1fr 2fr 1fr;
}
```

**Difference between fr and percentage:**

```css
/* Using percentages requires accounting for gap impact */
grid-template-columns: 33.33% 33.33% 33.33%; /* May overflow with gaps */

/* Using fr automatically deducts gap space */
grid-template-columns: 1fr 1fr 1fr; /* Always fits perfectly */
```

### The repeat() Function

When you need to define identical tracks repeatedly, the `repeat()` function simplifies your code:

```css
.container {
  /* Equivalent to: grid-template-columns: 1fr 1fr 1fr 1fr; */
  grid-template-columns: repeat(4, 1fr);

  /* Can repeat complex patterns */
  grid-template-columns: repeat(3, 1fr 2fr);
  /* Equivalent to: 1fr 2fr 1fr 2fr 1fr 2fr */
}
```

**Combined with auto-fill and auto-fit:**

```css
/* auto-fill: Create as many columns as possible */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* auto-fit: Similar to auto-fill, but collapses empty tracks */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

### The minmax() Function

The `minmax()` function defines a size range, allowing tracks to adapt between minimum and maximum values:

```css
.container {
  /* Column width minimum 100px, maximum 1fr */
  grid-template-columns: minmax(100px, 1fr) minmax(200px, 2fr);

  /* Row height minimum determined by content, maximum 200px */
  grid-template-rows: minmax(auto, 200px);
}
```

### The gap Property

The `gap` property sets spacing between grid items:

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  /* Both row-gap and column-gap are 20px */
  gap: 20px;

  /* Set row-gap and column-gap separately */
  row-gap: 20px;
  column-gap: 10px;

  /* Shorthand: row-gap column-gap */
  gap: 20px 10px;
}
```

### grid-template-areas and Named Grid Areas

`grid-template-areas` allows you to define layouts in a visual, intuitive way:

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 60px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

Use `.` to represent empty areas:

```css
grid-template-areas:
  "header header header"
  "sidebar main ."
  "footer footer footer";
```

### Grid Item Positioning

You can use grid lines to precisely position items:

```css
.item {
  /* Start at column line 1, end at column line 3 */
  grid-column-start: 1;
  grid-column-end: 3;

  /* Shorthand form */
  grid-column: 1 / 3;

  /* Using the span keyword */
  grid-column: 1 / span 2; /* Start at line 1, span 2 columns */

  /* Same applies to rows */
  grid-row: 2 / 4;
}
```

### Alignment Properties

Grid provides powerful alignment capabilities for both the container and individual items.

**Container Alignment (for all items):**

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(2, 100px);

  /* Align items horizontally within their grid areas */
  justify-items: start | end | center | stretch;

  /* Align items vertically within their grid areas */
  align-items: start | end | center | stretch;

  /* Shorthand for justify-items and align-items */
  place-items: center; /* Both axes centered */
  place-items: start end; /* align-items / justify-items */

  /* Distribute tracks within the container horizontally */
  justify-content: start | end | center | space-between | space-around | space-evenly;

  /* Distribute tracks within the container vertically */
  align-content: start | end | center | space-between | space-around | space-evenly;

  /* Shorthand for justify-content and align-content */
  place-content: center;
}
```

**Item Self-Alignment:**

```css
.item {
  /* Override container's justify-items for this item */
  justify-self: start | end | center | stretch;

  /* Override container's align-items for this item */
  align-self: start | end | center | stretch;

  /* Shorthand for align-self and justify-self */
  place-self: center;
}
```

## Implicit vs Explicit Grids

### Explicit Grid

The explicit grid is the grid you explicitly define using `grid-template-columns`, `grid-template-rows`, and `grid-template-areas`.

```css
.container {
  display: grid;
  /* Explicit grid: 3 columns, 2 rows */
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 100px);
}
```

### Implicit Grid

When there are more items than cells in the explicit grid, or when items are placed outside the explicit grid, the browser automatically creates additional tracks. These are called implicit tracks, forming the implicit grid.

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 100px 100px;

  /* Control the size of implicitly created rows */
  grid-auto-rows: 150px;

  /* Control the size of implicitly created columns */
  grid-auto-columns: 100px;

  /* Control auto-placement direction */
  grid-auto-flow: row | column | dense | row dense | column dense;
}
```

**Using grid-auto-flow:**

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  /* row (default): Fill rows first, then add new rows */
  grid-auto-flow: row;

  /* column: Fill columns first, then add new columns */
  grid-auto-flow: column;

  /* dense: Attempt to fill in holes earlier in the grid */
  grid-auto-flow: dense;
}
```

The `dense` keyword is particularly useful for layouts where items have varying sizes and you want to minimize empty spaces:

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  grid-auto-flow: dense; /* Fill gaps with smaller items */
}

.large-item {
  grid-column: span 2;
  grid-row: span 2;
}
```

## Auto-fit vs Auto-fill

Understanding the difference between `auto-fit` and `auto-fill` is crucial for creating responsive layouts.

### auto-fill

Creates as many tracks as possible, even if they are empty:

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}
```

With `auto-fill`, if there are only 3 items but space for 6 columns, you get 6 columns (3 filled, 3 empty). The empty columns still take up space.

### auto-fit

Similar to `auto-fill`, but collapses empty tracks to zero width:

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

With `auto-fit`, those same 3 items would expand to fill all available space because empty tracks collapse.

**Visual comparison:**

```
Container width: 600px, Item minimum: 100px

auto-fill:
+------+------+------+------+------+------+
| Item | Item | Item |      |      |      |
+------+------+------+------+------+------+
       ^items stay at minmax size, empty tracks preserved

auto-fit:
+----------+----------+----------+
|   Item   |   Item   |   Item   |
+----------+----------+----------+
           ^items expand, empty tracks collapsed
```

**When to use which:**

- Use `auto-fill` when you want consistent column widths regardless of content
- Use `auto-fit` when you want items to expand and fill available space

## Code Examples

### Example 1: Classic Holy Grail Layout

The Holy Grail layout is a classic web page layout pattern with a header, footer, main content area, and two sidebars.

```html
<div class="holy-grail">
  <header class="header">Header</header>
  <nav class="nav">Navigation</nav>
  <main class="main">Main Content</main>
  <aside class="aside">Sidebar</aside>
  <footer class="footer">Footer</footer>
</div>
```

```css
.holy-grail {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  gap: 10px;
}

.header { grid-area: header; background: #f0f0f0; padding: 20px; }
.nav { grid-area: nav; background: #e0e0e0; padding: 20px; }
.main { grid-area: main; background: #ffffff; padding: 20px; }
.aside { grid-area: aside; background: #e0e0e0; padding: 20px; }
.footer { grid-area: footer; background: #f0f0f0; padding: 20px; }

/* Responsive handling */
@media (max-width: 768px) {
  .holy-grail {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
  }
}
```

### Example 2: Responsive Image Grid

A responsive grid layout that requires no media queries:

```html
<div class="image-grid">
  <div class="image-item"><img src="image1.jpg" alt=""></div>
  <div class="image-item"><img src="image2.jpg" alt=""></div>
  <div class="image-item"><img src="image3.jpg" alt=""></div>
  <div class="image-item"><img src="image4.jpg" alt=""></div>
  <div class="image-item"><img src="image5.jpg" alt=""></div>
  <div class="image-item"><img src="image6.jpg" alt=""></div>
</div>
```

```css
.image-grid {
  display: grid;
  /* Key technique: auto-fit + minmax for adaptive column count */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
}

.image-item {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 8px;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover img {
  transform: scale(1.05);
}
```

### Example 3: Magazine-Style Layout

Using Grid's positioning capabilities to create an irregular magazine layout:

```html
<div class="magazine-layout">
  <article class="feature">Featured Article</article>
  <article class="story story-1">Story 1</article>
  <article class="story story-2">Story 2</article>
  <article class="story story-3">Story 3</article>
  <article class="story story-4">Story 4</article>
</div>
```

```css
.magazine-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 16px;
  padding: 16px;
}

/* Featured article spans 2x2 area in top-left */
.feature {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: 12px;
}

.story {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.2rem;
}

.story-1 { grid-column: 3 / 5; }
.story-2 { grid-column: 3; }
.story-3 { grid-column: 4; }
.story-4 { grid-column: 1 / 5; grid-row: 3; }

/* Responsive handling */
@media (max-width: 768px) {
  .magazine-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .feature,
  .story-1,
  .story-2,
  .story-3,
  .story-4 {
    grid-column: 1;
    grid-row: auto;
  }

  .feature {
    min-height: 300px;
  }

  .story {
    min-height: 150px;
  }
}
```

### Example 4: Dashboard Card Layout

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-auto-rows: minmax(200px, auto);
  gap: 24px;
  padding: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

/* Large card spans two columns */
.card.large {
  grid-column: span 2;
}

/* Tall card spans two rows */
.card.tall {
  grid-row: span 2;
}

/* Reset spans on smaller screens */
@media (max-width: 768px) {
  .card.large,
  .card.tall {
    grid-column: span 1;
    grid-row: span 1;
  }
}
```

### Example 5: Masonry-Like Layout with Grid

While CSS Grid doesn't natively support true masonry layout yet, you can create a similar effect:

```css
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: 10px;
  gap: 16px;
}

.masonry-item {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

/* Different heights using row spans */
.masonry-item.small { grid-row: span 15; }
.masonry-item.medium { grid-row: span 25; }
.masonry-item.large { grid-row: span 35; }
```

### Example 6: Overlapping Elements

Grid makes overlapping elements straightforward:

```css
.overlap-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 50px);
}

.background-image {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.overlay-text {
  grid-column: 2 / 8;
  grid-row: 3 / 5;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  padding: 24px;
  border-radius: 8px;
}

.corner-badge {
  grid-column: 11 / 13;
  grid-row: 1 / 2;
  z-index: 2;
  background: #ff6b6b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Common Layout Patterns

### Pattern 1: Sidebar Layout

```css
.sidebar-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

/* Collapsible sidebar */
.sidebar-layout.collapsed {
  grid-template-columns: 60px 1fr;
}

/* Responsive: sidebar becomes top bar on mobile */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
```

### Pattern 2: Card Grid with Featured Item

```css
.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 250px);
  gap: 16px;
}

.featured-item {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.regular-item {
  /* Automatically fills remaining spaces */
}
```

### Pattern 3: Pancake Stack (Sticky Footer)

```css
.page-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { /* auto height */ }
.main { /* takes all available space */ }
.footer { /* auto height, always at bottom */ }
```

### Pattern 4: RAM (Repeat, Auto, Minmax) Pattern

The most versatile responsive pattern:

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
}
```

This pattern:
- Uses `auto-fit` to create as many columns as fit
- Uses `minmax()` to set minimum and maximum column widths
- Uses `min(100%, 300px)` to prevent overflow on small screens

## Best Practices

### Use Meaningful Names

Naming grid lines and areas significantly improves code readability:

```css
.container {
  display: grid;
  grid-template-columns:
    [sidebar-start] 250px
    [sidebar-end content-start] 1fr
    [content-end];
  grid-template-rows:
    [header-start] 60px
    [header-end main-start] 1fr
    [main-end footer-start] 80px
    [footer-end];
}
```

### Avoid Fixed Pixel Values

Use relative and flexible units whenever possible:

```css
/* Not recommended */
grid-template-columns: 300px 600px 300px;

/* Recommended */
grid-template-columns: 1fr 2fr 1fr;
/* Or */
grid-template-columns: minmax(200px, 1fr) minmax(400px, 2fr) minmax(200px, 1fr);
```

### Leverage auto-fit/auto-fill for Media-Query-Free Responsiveness

```css
/* Self-adapting responsive grid */
grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
```

### Use grid-auto-flow to Control Auto-Placement

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-flow: dense; /* Automatically fill empty areas */
}
```

### Consider Accessibility

Ensure visual order matches DOM order, or provide appropriate ARIA attributes:

```css
/* Only change visual order on larger screens */
@media (min-width: 768px) {
  .sidebar { order: -1; }
}
```

### Use Subgrid When Available

CSS Subgrid allows nested grids to align with their parent grid:

```css
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.child {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid; /* Inherit parent's column tracks */
}
```

Note: Subgrid has good browser support in modern browsers but check compatibility for your target audience.

## Grid vs Flexbox Comparison

| Feature | CSS Grid | Flexbox |
|---------|----------|---------|
| Layout Dimension | Two-dimensional (rows and columns) | One-dimensional (row or column) |
| Layout Direction | Controls both directions simultaneously | Main axis and cross axis |
| Content-First vs Layout-First | Layout-first | Content-first |
| Alignment Control | Powerful two-dimensional alignment | Excellent one-dimensional alignment |
| Item Positioning | Can precisely position to any location | Based on document flow |
| Overlapping Capability | Native support | Requires additional positioning |
| Browser Support | Modern browsers | Broader support |
| Use Case | Page layouts, complex grids | Component layouts, navigation |

### When to Use Grid

- Complex layouts requiring simultaneous row and column control
- Overall page layout structure
- Designs requiring element overlap
- Irregular grid layouts
- When you know the layout structure upfront

### When to Use Flexbox

- One-dimensional arrangements (navigation bars, button groups)
- Content-driven layouts
- Need to automatically distribute remaining space
- Simple centering alignment
- When content size determines layout

### Using Both Together

In real development, Grid and Flexbox are often used in combination:

```css
/* Grid for overall page layout */
.page {
  display: grid;
  grid-template-areas:
    "header"
    "main"
    "footer";
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* Flexbox for component internal layout */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.nav-links {
  display: flex;
  gap: 20px;
}

/* Grid for card grid, Flexbox for card internals */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1; /* Push footer to bottom */
}
```

## Interview Key Points

### Common Interview Questions

**1. What is the difference between CSS Grid and Flexbox?**

Grid is a two-dimensional layout system that controls rows and columns simultaneously; Flexbox is a one-dimensional layout system that handles one row or column at a time. Grid is better suited for page-level layouts, while Flexbox excels at component-level layouts.

**2. Explain how the fr unit works**

The `fr` (fraction) unit represents a proportional share of remaining space in the grid container. After allocating fixed sizes and content sizes, the remaining space is distributed according to fr proportions.

**3. What is the difference between auto-fill and auto-fit?**

Both are used for automatically calculating the number of tracks. The difference shows when the container has extra space:
- `auto-fill`: Preserves empty tracks
- `auto-fit`: Collapses empty tracks, allowing existing items to expand and fill the space

**4. How do you create a responsive grid without media queries?**

Use the combination `repeat(auto-fit, minmax(min-width, 1fr))`.

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
```

**5. What are the advantages of grid-template-areas?**

It provides a visual way to define layouts, making code more intuitive, readable, and easy to maintain and modify.

**6. Explain implicit vs explicit grid**

- Explicit grid: Defined by `grid-template-columns`, `grid-template-rows`, and `grid-template-areas`
- Implicit grid: Automatically created tracks when items exceed explicit grid or are placed outside it. Controlled by `grid-auto-rows`, `grid-auto-columns`, and `grid-auto-flow`

**7. How do you center an element using Grid?**

```css
.container {
  display: grid;
  place-items: center;
  /* or */
  justify-items: center;
  align-items: center;
}
```

**8. What does grid-auto-flow: dense do?**

It enables a "dense" packing algorithm where the grid attempts to fill holes in the grid earlier, potentially changing the visual order of items. Useful for layouts with varying item sizes.

### Core Properties to Master

**Container Properties:**
- `display: grid`
- `grid-template-columns/rows`
- `grid-template-areas`
- `gap` (row-gap, column-gap)
- `grid-auto-flow`
- `grid-auto-rows/columns`
- `justify-items/align-items`
- `justify-content/align-content`

**Item Properties:**
- `grid-column/grid-row`
- `grid-area`
- `justify-self/align-self`

### Common Pitfalls

**1. Forgetting min-width: 0 for overflow**

Grid items have `min-width: auto` by default, which can cause overflow with long content:

```css
.grid-item {
  min-width: 0; /* Allow shrinking below content size */
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**2. Percentage-based gaps**

Unlike fr units, percentage gaps don't work well with Grid:

```css
/* Avoid */
gap: 5%;

/* Use instead */
gap: 1rem;
/* or */
gap: clamp(1rem, 2vw, 2rem);
```

**3. Overlapping without z-index**

When items overlap, they stack in DOM order. Use z-index for control:

```css
.background { z-index: 1; }
.foreground { z-index: 2; }
```

## Browser Support and Fallbacks

CSS Grid has excellent support in all modern browsers. For older browsers, consider these strategies:

```css
/* Feature detection */
@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

/* Fallback for older browsers */
@supports not (display: grid) {
  .container {
    display: flex;
    flex-wrap: wrap;
  }

  .item {
    flex: 1 1 250px;
  }
}
```

## Further Reading

### Official Resources

- [MDN CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) - Authoritative official documentation
- [CSS Grid Level 2](https://www.w3.org/TR/css-grid-2/) - W3C Specification

### Learning Resources

- [CSS-Tricks Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) - The most comprehensive Grid guide
- [Grid by Example](https://gridbyexample.com/) - Rachel Andrew's collection of Grid examples
- [Learn CSS Grid](https://learncssgrid.com/) - Interactive learning platform
- [An Interactive Guide to CSS Grid](https://www.joshwcomeau.com/css/interactive-guide-to-grid/) - Josh Comeau's visual guide

### Practice Tools

- [CSS Grid Generator](https://cssgrid-generator.netlify.app/) - Visual Grid generator
- [Grid Garden](https://cssgridgarden.com/) - Learn Grid through a game
- [Firefox Grid Inspector](https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_grid_layouts/index.html) - Powerful debugging tool

### Advanced Topics

- **Subgrid**: A Grid Level 2 feature allowing child elements to inherit parent grid track definitions
- **Masonry Layout**: A potential future CSS Grid feature for waterfall/Pinterest-style layouts
- **Container Queries**: Combined with Grid for even smarter responsive design

## Summary

CSS Grid is a cornerstone of modern web layout, offering unprecedented layout capabilities and flexibility. By mastering the core concepts and techniques covered in this guide, you can:

1. Easily create complex two-dimensional layout structures
2. Implement responsive designs without media queries
3. Build maintainable, readable layout code
4. Choose the appropriate layout solution for any project
5. Combine Grid with Flexbox for optimal results

Remember, Grid and Flexbox are not mutually exclusive choices but complementary tools. Understanding the strengths of each and using them in appropriate scenarios leads to elegant and efficient CSS code.

Continuous practice is the best way to master CSS Grid. Start with simple layouts, gradually challenge more complex designs, and soon you will be able to confidently wield this powerful layout tool.

The future of CSS Grid is bright, with features like Subgrid now available and Masonry layout on the horizon. Investing time in learning Grid today will pay dividends throughout your web development career.
