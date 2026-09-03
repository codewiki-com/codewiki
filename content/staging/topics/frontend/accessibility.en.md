---
title: Web Accessibility (A11y) Guide
description: Master web accessibility for inclusive website development
track: frontend
section: accessibility
difficulty: intermediate
tags:
  - Accessibility
  - A11y
  - ARIA
  - Inclusive
status: imported
origin: old/src/content/docs/frontend/accessibility.en.md
divergence: 0.215
issues: []
legacy:
  category: Frontend
  subcategory: Best Practices
  order: 21
  lastUpdated: 2026-01-07
---

## Understanding Web Accessibility

### What is Web Accessibility?

Web Accessibility (commonly abbreviated as A11y, where 11 represents the eleven letters between "a" and "y" in "accessibility") refers to the practice of making websites and web applications usable by everyone, including people with visual, auditory, motor, or cognitive disabilities. The core philosophy of accessibility development is **inclusive design**—ensuring that everyone has equal access to web resources and functionality.

### Why Accessibility Matters

The importance of web accessibility spans multiple dimensions:

**1. Large User Population**

According to the World Health Organization (WHO), approximately 15% of the global population (over 1 billion people) lives with some form of disability. In the United States alone, about 61 million adults have a disability. Ignoring accessibility means excluding a significant portion of potential users.

**2. Legal Compliance Requirements**

Many countries and regions have enacted accessibility-related legislation:

- United States: Americans with Disabilities Act (ADA) and Section 508 of the Rehabilitation Act
- European Union: Web Accessibility Directive and European Accessibility Act
- United Kingdom: Equality Act 2010
- Canada: Accessible Canada Act
- Australia: Disability Discrimination Act

Non-compliance with accessibility standards can result in lawsuits and financial penalties. Notable cases include lawsuits against major companies like Domino's Pizza and Netflix.

**3. Business Value**

- Expands user base and market reach
- Improves SEO rankings (search engines parse pages similarly to screen readers)
- Enhances brand image and demonstrates corporate social responsibility
- Improves overall user experience, as accessibility optimizations benefit all users
- Reduces legal risk and associated costs

**4. Technical Quality Indicator**

Accessibility-friendly code is typically high-quality code—semantically clear, well-structured, and easy to maintain.

### Common Types of Disabilities

| Disability Type | Description | Common Assistive Technologies |
|----------------|-------------|------------------------------|
| Visual | Blindness, low vision, color blindness | Screen readers, magnifiers, high contrast modes |
| Auditory | Deafness, hard of hearing | Captions, sign language videos, visual cues |
| Motor | Inability to use mouse, fine motor difficulties | Keyboard navigation, voice control, eye tracking |
| Cognitive | Reading difficulties, attention disorders, memory issues | Simplified interfaces, consistent navigation, clear language |

## WCAG Standards and Compliance Levels

### WCAG Overview

WCAG (Web Content Accessibility Guidelines) is developed by the W3C (World Wide Web Consortium) and is the most authoritative international accessibility standard. The current mainstream version is WCAG 2.1 (released in 2018), with WCAG 2.2 becoming a W3C Recommendation in October 2023.

### The Four Core Principles (POUR)

WCAG is built on four core principles:

```
Perceivable    - Information must be presented in ways users can perceive
Operable       - Interface components and navigation must be operable
Understandable - Information and operations must be understandable
Robust         - Content must be robust enough for reliable interpretation
```

### Three Conformance Levels

WCAG defines three conformance levels with progressively higher requirements:

**Level A (Minimum Level)**
- Basic requirements that must be met
- Failure to meet means some users cannot use the site at all
- Examples: Provide alt text for images, ensure keyboard accessibility

**Level AA (Recommended Level)**
- Addresses the most common accessibility barriers
- Most legal regulations require this level
- Examples: Color contrast ratio of 4.5:1, resizable text

**Level AAA (Highest Level)**
- Highest level of accessibility support
- Provides enhanced assistive features
- Examples: Sign language interpretation, extended audio descriptions

### Key Success Criteria Examples

```javascript
// WCAG 2.1 Key Success Criteria
const wcagCriteria = {
  'A': [
    '1.1.1 Non-text Content - Provide text alternatives',
    '1.3.1 Info and Relationships - Convey structure through code',
    '2.1.1 Keyboard - All functionality via keyboard',
    '2.4.1 Bypass Blocks - Provide skip navigation mechanism',
    '4.1.1 Parsing - Avoid major HTML errors',
    '4.1.2 Name, Role, Value - UI components properly identified'
  ],
  'AA': [
    '1.4.3 Contrast (Minimum) - Text contrast at least 4.5:1',
    '1.4.4 Resize Text - Text resizable to 200% without loss',
    '2.4.6 Headings and Labels - Descriptive headings and labels',
    '2.4.7 Focus Visible - Keyboard focus must be visible',
    '3.2.3 Consistent Navigation - Navigation mechanisms consistent'
  ],
  'AAA': [
    '1.4.6 Contrast (Enhanced) - Text contrast at least 7:1',
    '2.2.3 No Timing - Timing not essential',
    '2.4.9 Link Purpose (Link Only) - Purpose from link text alone'
  ]
};
```

## Semantic HTML and ARIA

### Semantic HTML is the Foundation of Accessibility

Semantic HTML is the first and most important step in achieving accessibility. Using native HTML elements correctly provides built-in accessibility support from browsers:

```html
<!-- Bad: Using non-semantic elements -->
<div class="button" onclick="submit()">Submit</div>
<div class="heading">Page Title</div>
<div class="input" contenteditable="true"></div>

<!-- Good: Using semantic elements -->
<button type="submit">Submit</button>
<h1>Page Title</h1>
<input type="text" aria-label="Search" />
```

### Built-in Accessibility Features of Native HTML Elements

| Element | Built-in Features |
|---------|-------------------|
| `<button>` | Focusable, activatable via Enter/Space, has button role |
| `<a href>` | Focusable, activatable via Enter, has link role |
| `<input>` | Focusable, label association, form validation |
| `<select>` | Keyboard navigation, focusable, listbox role |
| `<h1>-<h6>` | Heading role, forms document outline |
| `<nav>` | Navigation landmark role |
| `<main>` | Main content landmark role |

### ARIA Attributes Explained

ARIA (Accessible Rich Internet Applications) is a set of attributes that enhance the accessibility semantics of HTML elements. **Important principle: Prefer native HTML; only use ARIA when necessary.**

#### ARIA Roles

```html
<!-- Landmark Roles - Help users navigate quickly -->
<div role="banner">Page Header</div>
<div role="navigation">Navigation Menu</div>
<div role="main">Main Content</div>
<div role="complementary">Sidebar</div>
<div role="contentinfo">Footer</div>

<!-- Widget Roles - For interactive components -->
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Tab Panel Content</div>

<!-- Live Region Roles - Dynamic content notifications -->
<div role="alert">Error: Please fill in required fields</div>
<div role="status">Saved successfully</div>
<div role="log">Chat history area</div>
```

#### ARIA Properties

```html
<!-- aria-label: Provides accessible name for element -->
<button aria-label="Close dialog">
  <svg><!-- Close icon --></svg>
</button>

<!-- aria-labelledby: References another element as label -->
<h2 id="section-title">User Settings</h2>
<section aria-labelledby="section-title">
  <!-- Settings content -->
</section>

<!-- aria-describedby: Provides additional description -->
<input
  type="password"
  aria-describedby="password-hint"
/>
<p id="password-hint">Password must contain at least 8 characters</p>

<!-- aria-required: Marks required fields -->
<input type="email" aria-required="true" />

<!-- aria-invalid: Marks validation state -->
<input type="email" aria-invalid="true" aria-errormessage="email-error" />
<span id="email-error">Please enter a valid email address</span>
```

#### ARIA States

```html
<!-- aria-expanded: Expand/collapse state -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<ul id="menu" hidden>
  <li>Option 1</li>
  <li>Option 2</li>
</ul>

<!-- aria-pressed: Button pressed state (toggle button) -->
<button aria-pressed="true">
  Mute
</button>

<!-- aria-hidden: Hidden from assistive technology -->
<span aria-hidden="true">Decorative icon</span>

<!-- aria-disabled: Disabled state -->
<button aria-disabled="true">
  Submitting...
</button>

<!-- aria-current: Current item identification -->
<nav>
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
</nav>
```

### ARIA Live Regions

Live regions are used to notify screen readers of dynamic content changes:

```html
<!-- aria-live: Sets notification urgency -->
<div aria-live="polite">
  <!-- Content changes wait for user idle before announcing -->
  File upload progress: 45%
</div>

<div aria-live="assertive">
  <!-- Content changes interrupt user immediately -->
  Session about to expire!
</div>

<!-- Preset live region roles -->
<div role="alert">
  <!-- Equivalent to aria-live="assertive" -->
  Login failed, please check password
</div>

<div role="status">
  <!-- Equivalent to aria-live="polite" -->
  3 new messages
</div>
```

### Complete ARIA Component Examples

```html
<!-- Accessible Modal Dialog -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Confirm Deletion</h2>
  <p id="dialog-desc">
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
  <div>
    <button>Cancel</button>
    <button>Confirm Delete</button>
  </div>
</div>

<!-- Accessible Accordion Component -->
<div class="accordion">
  <h3>
    <button
      aria-expanded="true"
      aria-controls="panel1"
      id="accordion1"
    >
      Section One
    </button>
  </h3>
  <div
    id="panel1"
    role="region"
    aria-labelledby="accordion1"
  >
    <p>Content of section one...</p>
  </div>

  <h3>
    <button
      aria-expanded="false"
      aria-controls="panel2"
      id="accordion2"
    >
      Section Two
    </button>
  </h3>
  <div
    id="panel2"
    role="region"
    aria-labelledby="accordion2"
    hidden
  >
    <p>Content of section two...</p>
  </div>
</div>
```

## Keyboard Navigation Support

### Keyboard Accessibility Principles

Keyboard accessibility is one of the core requirements of accessibility. Many users cannot use a mouse and rely entirely on keyboard operation.

**Basic Requirements:**
1. All interactive elements must be accessible via keyboard
2. Focus order must be logical
3. Focus must be visible
4. No keyboard traps should exist

### Focus Management

```javascript
// Core methods for managing focus

// 1. Make element focusable
element.tabIndex = 0;  // Add to Tab sequence
element.tabIndex = -1; // Programmatically focusable, but not in Tab sequence

// 2. Set focus
element.focus();

// 3. Get currently focused element
const currentFocus = document.activeElement;

// 4. Focus trap example (for modals)
class FocusTrap {
  constructor(container) {
    this.container = container;
    this.focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  activate() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.firstFocusable.focus();
  }

  handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }

  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

### Keyboard Shortcuts

```javascript
// Standard keyboard interaction patterns

// Buttons: Enter or Space to activate
button.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    button.click();
  }
});

// Links: Enter only to activate
link.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Link default behavior
  }
});

// Dropdown menu navigation
dropdown.addEventListener('keydown', (e) => {
  const items = dropdown.querySelectorAll('[role="menuitem"]');
  const currentIndex = Array.from(items).indexOf(document.activeElement);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
      break;
    case 'ArrowUp':
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
      break;
    case 'Escape':
      dropdown.close();
      break;
    case 'Home':
      e.preventDefault();
      items[0].focus();
      break;
    case 'End':
      e.preventDefault();
      items[items.length - 1].focus();
      break;
  }
});
```

### Skip Links

```html
<!-- Skip links help keyboard users quickly reach main content -->
<body>
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>

  <header>
    <nav>
      <!-- Many navigation links -->
    </nav>
  </header>

  <main id="main-content" tabindex="-1">
    <!-- Main content -->
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
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}
</style>
```

### Focus Indicator Styles

```css
/* Default focus styles - don't simply remove them! */
/* Wrong approach */
*:focus {
  outline: none; /* This causes serious accessibility problems */
}

/* Correct approach: Customize focus styles */
:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* Use :focus-visible to distinguish keyboard and mouse focus */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}

/* Button focus style */
button:focus-visible {
  outline: 3px solid #005fcc;
  box-shadow: 0 0 0 6px rgba(0, 95, 204, 0.3);
}

/* Input focus style */
input:focus-visible,
textarea:focus-visible {
  border-color: #005fcc;
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.3);
}
```

## Screen Reader Compatibility

### Popular Screen Readers

| Screen Reader | Platform | Browser |
|---------------|----------|---------|
| NVDA | Windows | Firefox (recommended) / Chrome |
| JAWS | Windows | Chrome / Edge |
| VoiceOver | macOS / iOS | Safari |
| TalkBack | Android | Chrome |
| Narrator | Windows | Edge |

### Optimizing Content for Screen Readers

```html
<!-- 1. Provide meaningful alternative text for images -->
<!-- Informative images -->
<img src="chart.png" alt="2023 sales data: Q1 up 15%, Q2 up 23%">

<!-- Decorative images -->
<img src="decorative-line.png" alt="" role="presentation">

<!-- Complex images -->
<figure>
  <img src="complex-chart.png" alt="Quarterly sales trend" aria-describedby="chart-desc">
  <figcaption id="chart-desc">
    This chart shows the sales trend across four quarters of 2023...
  </figcaption>
</figure>

<!-- 2. Use proper heading hierarchy -->
<h1>Website Name</h1>
  <h2>Main Section</h2>
    <h3>Subsection</h3>
    <h3>Subsection</h3>
  <h2>Another Main Section</h2>

<!-- 3. Use landmark regions -->
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>

<!-- 4. List structure -->
<nav aria-label="Breadcrumb navigation">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Phones</li>
  </ol>
</nav>

<!-- 5. Table accessibility -->
<table>
  <caption>2023 Sales Data</caption>
  <thead>
    <tr>
      <th scope="col">Product</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Phones</th>
      <td>100</td>
      <td>150</td>
    </tr>
  </tbody>
</table>
```

### Visually Hidden Content for Screen Readers Only

```css
/* Visually hidden but readable by screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Show when focusable (for skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

```html
<!-- Usage examples -->
<button>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">Close menu</span>
</button>

<a href="/cart">
  Shopping Cart
  <span class="sr-only">(contains 3 items)</span>
</a>
```

### Dynamic Content Update Notifications

```javascript
// Use aria-live regions to announce updates
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.setAttribute('aria-atomic', 'true');
announcer.classList.add('sr-only');
document.body.appendChild(announcer);

function announce(message) {
  announcer.textContent = '';
  // Short delay ensures screen readers detect the change
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

// Usage examples
function addToCart(item) {
  // ... add to cart logic
  announce(`${item.name} has been added to your cart`);
}

function formSubmit() {
  // ... form submission logic
  announce('Form submitted successfully');
}
```

## Color Contrast and Visual Design

### Contrast Requirements

WCAG 2.1 has clear requirements for color contrast:

| Text Type | AA Level | AAA Level |
|-----------|----------|-----------|
| Normal text (<18pt) | 4.5:1 | 7:1 |
| Large text (>=18pt or 14pt bold) | 3:1 | 4.5:1 |
| UI components and graphics | 3:1 | - |

### Calculating Contrast

```javascript
// Calculate relative luminance
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(...color1);
  const l2 = getLuminance(...color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check WCAG compliance
function checkContrast(foreground, background, level = 'AA', isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);

  const requirements = {
    'AA': isLargeText ? 3 : 4.5,
    'AAA': isLargeText ? 4.5 : 7
  };

  return {
    ratio: ratio.toFixed(2),
    passes: ratio >= requirements[level],
    required: requirements[level]
  };
}

// Usage example
const white = [255, 255, 255];
const darkBlue = [0, 51, 102];
console.log(checkContrast(white, darkBlue));
// { ratio: "11.59", passes: true, required: 4.5 }
```

### Color Cannot Be the Only Information Carrier

```html
<!-- Wrong: Only using color to distinguish status -->
<span style="color: green">Success</span>
<span style="color: red">Failed</span>

<!-- Correct: Color + icon/text -->
<span style="color: green">
  <svg aria-hidden="true"><!-- Check icon --></svg>
  Success
</span>
<span style="color: red">
  <svg aria-hidden="true"><!-- X icon --></svg>
  Failed
</span>

<!-- Form error indication -->
<!-- Wrong: Only red border -->
<input style="border-color: red" />

<!-- Correct: Red border + error icon + text message -->
<div class="form-field error">
  <input aria-invalid="true" aria-describedby="email-error" />
  <svg aria-hidden="true"><!-- Error icon --></svg>
  <span id="email-error">Please enter a valid email address</span>
</div>
```

### CSS Accessibility Best Practices

```css
/* Use relative units to support user scaling */
html {
  font-size: 100%; /* Default 16px */
}

body {
  font-size: 1rem;
  line-height: 1.5;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
  }
}

@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --text-color: #000000;
  }
}

/* Ensure links are identifiable within text (not relying on color alone) */
a {
  color: #0066cc;
  text-decoration: underline;
}

a:hover,
a:focus {
  text-decoration: none;
  outline: 2px solid currentColor;
}

/* Avoid text images (use real text instead) */
.text-content {
  /* Use web fonts instead of text images */
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
}
```

## Form Accessibility

### Basic Form Structure

```html
<form aria-labelledby="form-title">
  <h2 id="form-title">User Registration</h2>

  <!-- Use label to associate input fields -->
  <div class="form-group">
    <label for="username">Username <span aria-hidden="true">*</span></label>
    <input
      type="text"
      id="username"
      name="username"
      required
      aria-required="true"
      autocomplete="username"
    />
  </div>

  <!-- Use fieldset and legend to group related fields -->
  <fieldset>
    <legend>Contact Information</legend>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" autocomplete="email" />
    </div>

    <div class="form-group">
      <label for="phone">Phone</label>
      <input type="tel" id="phone" name="phone" autocomplete="tel" />
    </div>
  </fieldset>

  <!-- Radio button group -->
  <fieldset>
    <legend>Gender</legend>
    <div>
      <input type="radio" id="male" name="gender" value="male" />
      <label for="male">Male</label>
    </div>
    <div>
      <input type="radio" id="female" name="gender" value="female" />
      <label for="female">Female</label>
    </div>
  </fieldset>

  <button type="submit">Submit Registration</button>
</form>
```

### Form Validation and Error Handling

```html
<form novalidate>
  <div class="form-group">
    <label for="email">
      Email
      <span class="required" aria-hidden="true">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-hint email-error"
    />
    <p id="email-hint" class="hint">We will use this email for confirmation</p>
    <p id="email-error" class="error" role="alert" hidden>
      Please enter a valid email address
    </p>
  </div>
</form>

<script>
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');

emailInput.addEventListener('blur', validateEmail);
emailInput.addEventListener('input', () => {
  if (emailInput.getAttribute('aria-invalid') === 'true') {
    validateEmail();
  }
});

function validateEmail() {
  const isValid = emailInput.validity.valid;

  emailInput.setAttribute('aria-invalid', !isValid);
  emailError.hidden = isValid;

  if (!isValid) {
    emailInput.focus();
  }
}
</script>

<style>
.error {
  color: #d32f2f;
  margin-top: 0.25rem;
}

input[aria-invalid="true"] {
  border-color: #d32f2f;
  border-width: 2px;
}
</style>
```

### Complex Form Controls

```html
<!-- Custom dropdown select -->
<div class="custom-select">
  <label id="city-label">Select City</label>
  <button
    type="button"
    aria-haspopup="listbox"
    aria-expanded="false"
    aria-labelledby="city-label city-value"
  >
    <span id="city-value">Please select</span>
    <svg aria-hidden="true"><!-- Dropdown arrow --></svg>
  </button>
  <ul
    role="listbox"
    aria-labelledby="city-label"
    hidden
  >
    <li role="option" aria-selected="false">New York</li>
    <li role="option" aria-selected="false">Los Angeles</li>
    <li role="option" aria-selected="false">Chicago</li>
  </ul>
</div>

<!-- Search autocomplete -->
<div class="autocomplete">
  <label for="search">Search Products</label>
  <input
    type="text"
    id="search"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded="false"
    aria-controls="search-results"
    aria-activedescendant=""
  />
  <ul
    id="search-results"
    role="listbox"
    hidden
  >
    <!-- Dynamically generated options -->
  </ul>
</div>

<!-- Date picker -->
<div class="date-picker">
  <label for="date">Select Date</label>
  <input
    type="text"
    id="date"
    aria-describedby="date-format"
  />
  <span id="date-format" class="hint">Format: YYYY-MM-DD</span>
  <button
    type="button"
    aria-label="Open calendar to select date"
    aria-expanded="false"
  >
    <svg aria-hidden="true"><!-- Calendar icon --></svg>
  </button>
</div>
```

## Testing Tools

### Automated Testing Tools

#### axe DevTools

```javascript
// Install axe-core
// npm install axe-core

import axe from 'axe-core';

// Run accessibility test
async function runAccessibilityTest() {
  const results = await axe.run(document);

  console.log('Violations:', results.violations);
  console.log('Passes:', results.passes);
  console.log('Incomplete:', results.incomplete);

  // Generate report
  results.violations.forEach(violation => {
    console.error(`${violation.id}: ${violation.description}`);
    console.error(`Impact: ${violation.impact}`);
    console.error(`Affected elements:`, violation.nodes);
  });
}

// Using with Jest
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button component', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### Lighthouse

```javascript
// Using Lighthouse CLI
// npx lighthouse https://example.com --only-categories=accessibility

// Using with Puppeteer
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');

async function runLighthouseTest(url) {
  const browser = await puppeteer.launch({ headless: true });
  const { port } = new URL(browser.wsEndpoint());

  const result = await lighthouse(url, {
    port,
    onlyCategories: ['accessibility']
  });

  console.log('Accessibility score:', result.lhr.categories.accessibility.score * 100);

  await browser.close();
  return result;
}

// Integrating axe with Playwright
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('page should pass accessibility checks', async ({ page }) => {
  await page.goto('/');

  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityResults.violations).toEqual([]);
});
```

#### ESLint Plugin

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsx-a11y'],
  extends: ['plugin:jsx-a11y/recommended'],
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error'
  }
};
```

### Manual Testing Checklist

```markdown
## Keyboard Testing Checklist
- [ ] Tab key can access all interactive elements
- [ ] Focus order is logical
- [ ] Focus indicator is clearly visible
- [ ] Enter/Space can activate buttons and links
- [ ] Modal dialogs correctly trap focus
- [ ] ESC key can close modals/dropdowns
- [ ] No keyboard traps exist

## Screen Reader Testing Checklist
- [ ] Page title is descriptive
- [ ] Heading hierarchy is correct
- [ ] Images have appropriate alternative text
- [ ] Link text is meaningful
- [ ] Form fields have associated labels
- [ ] Error messages are properly announced
- [ ] Dynamic content changes are announced
- [ ] Landmark regions are correctly identified

## Visual Testing Checklist
- [ ] Text contrast ratio meets 4.5:1
- [ ] Can zoom to 200% without loss of functionality
- [ ] Color is not the only information carrier
- [ ] Animations can be paused or disabled
- [ ] Focus styles contrast with content
```

### Browser Developer Tools

```javascript
// Chrome DevTools accessibility features
// 1. Elements panel > Accessibility tab
// 2. Lighthouse panel > Accessibility audit
// 3. Rendering panel > Emulate vision deficiencies

// Firefox Accessibility Inspector
// 1. Developer Tools > Accessibility
// 2. View accessibility tree
// 3. Simulate color blindness

// Edge DevTools
// 1. Similar to Chrome (Chromium-based)
// 2. Additional Issues panel shows accessibility problems
```

## Best Practices and Checklists

### Development Phase Checklist

```markdown
## HTML Structure
- [ ] Use semantic HTML elements
- [ ] Heading hierarchy is correct (h1-h6 in order)
- [ ] Document language is set (<html lang="en">)
- [ ] Page has unique, descriptive <title>
- [ ] Landmark regions used correctly (header, nav, main, footer)

## Images and Media
- [ ] Informative images have alt text
- [ ] Decorative images use alt=""
- [ ] Complex images have long descriptions
- [ ] Videos have captions
- [ ] Audio has transcripts

## Links and Buttons
- [ ] Link text describes destination
- [ ] Avoid vague text like "click here"
- [ ] Button text describes action
- [ ] Icon buttons have accessible names

## Forms
- [ ] Input fields have associated labels
- [ ] Required fields are clearly marked
- [ ] Error messages are associated with inputs
- [ ] Appropriate input types are used
- [ ] Related fields use fieldset/legend grouping

## Keyboard
- [ ] All functionality is keyboard operable
- [ ] Focus order is logical
- [ ] Focus styles are clearly visible
- [ ] No keyboard traps
- [ ] Skip links provided

## Color and Visual
- [ ] Text contrast at least 4.5:1
- [ ] Information not conveyed by color alone
- [ ] Can zoom to 200% without loss of function
- [ ] Animations can be paused
```

### React Accessibility Best Practices

```jsx
// 1. Accessible component example
function AccessibleButton({ children, onClick, disabled, isLoading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span className="sr-only">Loading</span>
          <Spinner aria-hidden="true" />
        </>
      ) : children}
    </button>
  );
}

// 2. Using React's focus management
import { useRef, useEffect } from 'react';

function Modal({ isOpen, onClose, children }) {
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      closeButtonRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Dialog Title</h2>
      {children}
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// 3. Using Fragment to avoid extra DOM elements
function Navigation({ items }) {
  return (
    <nav aria-label="Main navigation">
      <ul>
        {items.map(item => (
          <React.Fragment key={item.id}>
            <li>
              <a href={item.url}>{item.label}</a>
            </li>
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
}

// 4. Accessibility considerations for conditional rendering
function Notification({ message, type }) {
  if (!message) return null;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  );
}
```

### Vue Accessibility Best Practices

```vue
<template>
  <!-- Use v-bind to bind ARIA attributes -->
  <button
    :aria-expanded="isOpen"
    :aria-controls="menuId"
    @click="toggle"
  >
    Menu
  </button>

  <ul
    v-show="isOpen"
    :id="menuId"
    role="menu"
  >
    <li
      v-for="item in items"
      :key="item.id"
      role="menuitem"
    >
      {{ item.label }}
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isOpen = ref(false);
const menuId = 'dropdown-menu';
const buttonRef = ref(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

// Focus management
onMounted(() => {
  // Ensure initial focus is correct
});
</script>
```

## Interview Key Points

### Common Interview Questions

**Q1: What is Web Accessibility? Why is it important?**

```
A: Web Accessibility (A11y) is the practice of making websites and applications
usable by everyone, including people with disabilities.

Its importance includes:
1. Ethical responsibility: Everyone should have equal access to information
2. Legal compliance: Many countries have accessibility regulations
3. Business value: Expands user base, improves SEO
4. Code quality: Accessible code is typically more semantic and maintainable
```

**Q2: What are the core principles of WCAG?**

```
A: WCAG is based on four principles (POUR):
1. Perceivable: Information can be perceived
2. Operable: Interface can be operated
3. Understandable: Information can be understood
4. Robust: Content can be reliably interpreted by various technologies
```

**Q3: How do you make images accessible to screen readers?**

```
A: Use different strategies based on image type:
1. Informative images: Provide descriptive alt text
2. Decorative images: Use empty alt="" or role="presentation"
3. Complex images: Use aria-describedby to link to long description
4. Icon buttons: Use aria-label or sr-only text
```

**Q4: What are the principles for using ARIA?**

```
A: Follow these principles:
1. Use native HTML whenever possible before ARIA
2. Don't change native semantics
3. All interactive elements must be keyboard accessible
4. Don't use role="presentation" on focusable elements
5. Interactive elements must have accessible names
```

**Q5: How do you test website accessibility?**

```
A: Use a multi-layered testing approach:
1. Automated tools: axe DevTools, Lighthouse
2. Keyboard testing: Navigate using only keyboard
3. Screen reader testing: NVDA, VoiceOver
4. Contrast checking: Color Contrast Analyzer
5. Manual checking: Verify against WCAG checklist
```

### Code Challenge Examples

```javascript
// Interview question: Fix accessibility issues in this component
// Original code (problematic)
function BadButton({ icon, onClick }) {
  return (
    <div className="button" onClick={onClick}>
      <img src={icon} />
    </div>
  );
}

// Fixed code
function GoodButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      <img src={icon} alt="" aria-hidden="true" />
    </button>
  );
}

// Interview question: Implement an accessible Tab component
function AccessibleTabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e, index) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    setActiveIndex(newIndex);
    document.getElementById(`tab-${newIndex}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Content tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${index}`}
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`panel-${index}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`panel-${index}`}
          role="tabpanel"
          aria-labelledby={`tab-${index}`}
          hidden={activeIndex !== index}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

## Resources and Further Learning

### Official Resources

- [W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/) - Official W3C accessibility resources
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/) - Full WCAG specification
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - Patterns and widgets implementation guide

### Learning Resources

- [WebAIM](https://webaim.org/) - Comprehensive accessibility resources and training
- [A11y Project](https://www.a11yproject.com/) - Community-driven accessibility resources
- [Deque University](https://dequeuniversity.com/) - Professional accessibility training
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Mozilla's accessibility documentation

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/) - Browser extension and testing library
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Google's auditing tool
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/) - Color contrast checking tool

## Summary

Web accessibility is not just a technical requirement, but a demonstration of respect and inclusivity for all users. As frontend developers, we should:

1. **Consider accessibility from the start**: Integrate accessibility into design and development processes, rather than retrofitting
2. **Prioritize semantic HTML**: Native HTML elements provide built-in accessibility support
3. **Test, test, and test again**: Combine automated tools and manual testing to ensure coverage of various scenarios
4. **Keep learning**: Accessibility standards evolve, so stay current with best practices
5. **Listen to real user feedback**: Engage with users who have disabilities to understand their real needs

Building accessible web applications ensures that everyone can equally enjoy the convenience of the digital world. This is both our responsibility and our privilege as developers.

Remember: **Accessibility is not a feature—it's a fundamental requirement for quality web development.** When we build for accessibility, we build better products for everyone.
