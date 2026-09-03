---
title: CSS Animation Complete Guide
description: Master CSS transitions and animations for interactive UIs
track: frontend
section: html-css
difficulty: intermediate
tags:
  - CSS
  - Animation
  - Transition
  - UI
status: imported
origin: old/src/content/docs/frontend/css-animation.en.md
divergence: 0.208
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 4
  lastUpdated: 2026-01-07
---

## Introduction

CSS animations are a powerful technique for creating dynamic effects on web pages without JavaScript. They consist of two core mechanisms:

- **CSS Transitions**: Create smooth transitions between two states
- **CSS Animations**: Define complex multi-stage animations through keyframes

Compared to JavaScript animations, CSS animations offer several advantages:

1. **Better Performance**: Browsers can optimize CSS animations using GPU acceleration
2. **Cleaner Code**: Declarative syntax that is easy to maintain
3. **Non-blocking**: Animations run on the compositor thread, not affecting page interactions

### Why Use CSS Animations?

Animations are essential in user interfaces:

- **Provide Visual Feedback**: Let users know their actions have been recognized
- **Guide User Attention**: Highlight important information or changes
- **Enhance User Experience**: Make interfaces feel smoother and more natural
- **Establish Spatial Relationships**: Help users understand element hierarchies

## CSS Transitions

### Basic Syntax

Transitions are the simplest form of CSS animation, defining how a property changes from one value to another.

```css
.element {
  /* Shorthand syntax */
  transition: property duration timing-function delay;

  /* Individual properties */
  transition-property: transform;
  transition-duration: 0.3s;
  transition-timing-function: ease;
  transition-delay: 0s;
}
```

### transition-property

Specifies which CSS properties should have transition effects applied.

```css
.box {
  /* Single property */
  transition-property: opacity;

  /* Multiple properties */
  transition-property: opacity, transform, background-color;

  /* All transitionable properties (use cautiously, may impact performance) */
  transition-property: all;

  /* Disable transitions */
  transition-property: none;
}
```

**Transitionable Property Types:**

| Type | Examples |
|------|----------|
| Colors | color, background-color, border-color |
| Lengths | width, height, padding, margin, font-size |
| Transforms | transform |
| Opacity | opacity |
| Shadows | box-shadow, text-shadow |

**Non-transitionable Properties:**
- display
- font-family
- position
- visibility (possible but suboptimal)

### transition-duration

Defines how long the transition effect lasts. Units can be seconds (s) or milliseconds (ms).

```css
.button {
  /* Recommended duration for interaction feedback */
  transition-duration: 0.2s;  /* 200ms, quick feedback */
}

.modal {
  /* Page-level transitions */
  transition-duration: 0.4s;  /* 400ms, more noticeable */
}

.menu {
  /* Different durations for multiple properties */
  transition-property: transform, opacity;
  transition-duration: 0.3s, 0.2s;
}
```

**Duration Guidelines:**
- **Micro-interactions** (button hover): 100-200ms
- **Component animations** (dropdown menus): 200-300ms
- **Page transitions**: 300-500ms
- **Complex animations**: 500ms+

### transition-timing-function

Defines the speed curve (easing function) of the transition effect.

```css
.element {
  /* Preset values */
  transition-timing-function: ease;        /* Default, slow-fast-slow */
  transition-timing-function: ease-in;     /* Slow start */
  transition-timing-function: ease-out;    /* Slow end */
  transition-timing-function: ease-in-out; /* Slow at both ends, fast in middle */
  transition-timing-function: linear;      /* Constant speed */

  /* Step functions */
  transition-timing-function: steps(4);    /* Complete in 4 steps */
  transition-timing-function: steps(4, start);
  transition-timing-function: steps(4, end);

  /* Custom cubic-bezier curve */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### transition-delay

Defines the delay before the transition effect starts.

```css
.nav-item {
  transition: transform 0.3s ease;
}

/* Create staggered animation effect */
.nav-item:nth-child(1) { transition-delay: 0s; }
.nav-item:nth-child(2) { transition-delay: 0.1s; }
.nav-item:nth-child(3) { transition-delay: 0.2s; }
.nav-item:nth-child(4) { transition-delay: 0.3s; }
```

### Complete Transition Example

```css
/* Button hover effect */
.button {
  background-color: #3b82f6;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  transform: translateY(0);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Multi-property transitions */
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out,
    background-color 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  background-color: #2563eb;
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## CSS Animations and @keyframes

### Basic Syntax

Animations are more powerful than transitions, allowing you to define multiple keyframes for complex animation sequences.

```css
/* Define keyframes */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Apply the animation */
.element {
  animation: slideIn 0.5s ease-out forwards;
}
```

### @keyframes Deep Dive

Keyframes define the state of an animation at different points in time.

```css
/* Define multiple keyframes using percentages */
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-20px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

/* Combine keyframes at the same position */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
```

### Animation Properties Explained

```css
.element {
  /* Shorthand */
  animation: name duration timing-function delay iteration-count direction fill-mode play-state;

  /* Individual properties */
  animation-name: slideIn;           /* Keyframe name */
  animation-duration: 0.5s;          /* Duration */
  animation-timing-function: ease;   /* Easing function */
  animation-delay: 0s;               /* Delay */
  animation-iteration-count: 1;      /* Number of iterations */
  animation-direction: normal;       /* Play direction */
  animation-fill-mode: none;         /* Fill mode */
  animation-play-state: running;     /* Play state */
}
```

#### animation-iteration-count

```css
.element {
  animation-iteration-count: 1;        /* Play once */
  animation-iteration-count: 3;        /* Play three times */
  animation-iteration-count: infinite; /* Loop infinitely */
  animation-iteration-count: 2.5;      /* Play 2.5 times */
}
```

#### animation-direction

```css
.element {
  animation-direction: normal;            /* Play forward */
  animation-direction: reverse;           /* Play backward */
  animation-direction: alternate;         /* Alternate (odd=forward, even=backward) */
  animation-direction: alternate-reverse; /* Alternate starting backward */
}
```

#### animation-fill-mode

Controls the element's style before and after the animation executes.

```css
.element {
  animation-fill-mode: none;      /* Default, no style changes before/after */
  animation-fill-mode: forwards;  /* Retain the last keyframe's styles after animation */
  animation-fill-mode: backwards; /* Apply first keyframe's styles before animation starts */
  animation-fill-mode: both;      /* Apply both forwards and backwards */
}
```

```css
/* Example: Fade-in effect */
.fade-in {
  opacity: 0; /* Initial state */
  animation: fadeIn 0.5s ease forwards; /* forwards retains the final opacity: 1 */
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
```

#### animation-play-state

```css
.element {
  animation-play-state: running; /* Currently playing */
  animation-play-state: paused;  /* Paused */
}

/* Pause animation on hover */
.animated:hover {
  animation-play-state: paused;
}
```

### Multiple Animation Composition

```css
.element {
  /* Apply multiple animations simultaneously */
  animation:
    fadeIn 0.5s ease forwards,
    slideUp 0.5s ease forwards,
    pulse 2s ease-in-out 0.5s infinite;
}
```

## Timing Functions

### Preset Easing Functions

```css
/* Linear - constant speed */
.linear {
  transition-timing-function: linear;
  /* cubic-bezier(0, 0, 1, 1) */
}

/* ease - default value, slow-fast-slow */
.ease {
  transition-timing-function: ease;
  /* cubic-bezier(0.25, 0.1, 0.25, 1) */
}

/* ease-in - slow start */
.ease-in {
  transition-timing-function: ease-in;
  /* cubic-bezier(0.42, 0, 1, 1) */
}

/* ease-out - slow end (recommended for entry animations) */
.ease-out {
  transition-timing-function: ease-out;
  /* cubic-bezier(0, 0, 0.58, 1) */
}

/* ease-in-out - slow at both ends */
.ease-in-out {
  transition-timing-function: ease-in-out;
  /* cubic-bezier(0.42, 0, 0.58, 1) */
}
```

### Custom cubic-bezier Curves

Bezier curves are defined by four points: P0(0,0), P1(x1,y1), P2(x2,y2), P3(1,1).

```css
/* Custom easing function */
.custom {
  /* cubic-bezier(x1, y1, x2, y2) */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**Common Custom Easing Functions:**

```css
/* Elastic effect - overshoot and bounce back */
.bounce-out {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Quick start, slow end */
.smooth-out {
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Material Design standard easing */
.material-standard {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Material Design deceleration */
.material-decelerate {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Material Design acceleration */
.material-accelerate {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
```

### The steps() Function

```css
/* Typewriter effect */
.typewriter {
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  animation: typing 3s steps(20) forwards;
}

@keyframes typing {
  to {
    width: 100%;
  }
}

/* Sprite sheet animation */
.sprite {
  width: 64px;
  height: 64px;
  background: url('sprite.png') 0 0;
  animation: walk 0.8s steps(8) infinite;
}

@keyframes walk {
  to {
    background-position: -512px 0; /* 8 frames x 64px */
  }
}
```

## Performance Optimization

### Browser Rendering Pipeline

Understanding the browser rendering pipeline is crucial for optimizing animation performance:

```
JavaScript -> Style -> Layout -> Paint -> Composite
    |           |         |        |          |
  Execute    Calculate  Calculate  Draw     Compose
    JS       styles     layout    pixels    layers
```

Different CSS property modifications trigger different rendering stages:

| Triggered Stage | CSS Properties | Performance Impact |
|-----------------|----------------|-------------------|
| Layout | width, height, padding, margin, top, left | Slowest |
| Paint | background, color, border, box-shadow | Slower |
| Composite | transform, opacity | Fastest |

### High-Performance Properties

**Only animate transform and opacity:**

```css
/* Not recommended: triggers Layout */
.bad {
  transition: left 0.3s, top 0.3s;
}
.bad:hover {
  left: 100px;
  top: 50px;
}

/* Recommended: only triggers Composite */
.good {
  transition: transform 0.3s;
}
.good:hover {
  transform: translate(100px, 50px);
}
```

```css
/* Not recommended: modifying width/height */
.scale-bad {
  transition: width 0.3s, height 0.3s;
}
.scale-bad:hover {
  width: 200px;
  height: 200px;
}

/* Recommended: use transform: scale() */
.scale-good {
  transition: transform 0.3s;
}
.scale-good:hover {
  transform: scale(1.5);
}
```

### The will-change Property

`will-change` informs the browser in advance about upcoming changes, allowing it to prepare optimizations.

```css
/* Correct usage */
.element {
  will-change: transform;
}

/* Prepare on hover, clear after */
.container:hover .element {
  will-change: transform;
}
.container .element {
  transition: transform 0.3s;
}

/* Remove with JavaScript after animation ends */
```

**will-change Usage Guidelines:**

```css
/* Wrong: overuse */
* {
  will-change: transform, opacity; /* Consumes excessive memory */
}

/* Wrong: permanent on static elements */
.static-element {
  will-change: transform; /* Wastes resources */
}

/* Correct: use only when needed */
.will-animate {
  will-change: transform;
}

.will-animate.done {
  will-change: auto; /* Reset after animation completes */
}
```

### Reducing Repaints and Reflows

```css
/* Use transform instead of position properties */
.move {
  /* Avoid */
  /* position: absolute; top: 0; left: 0; */

  /* Recommended */
  transform: translate(0, 0);
}

/* Use opacity instead of visibility/display */
.fade {
  /* Avoid */
  /* visibility: hidden; */

  /* Recommended */
  opacity: 0;
  pointer-events: none; /* Ensure non-clickable */
}
```

### Enabling GPU Acceleration

```css
/* Force creation of a new compositing layer */
.gpu-accelerated {
  transform: translateZ(0);
  /* or */
  transform: translate3d(0, 0, 0);
  /* or */
  will-change: transform;
}
```

## Animation Composition

### Creating Sequences with animation-delay

```css
/* Staggered list item animation */
.list-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
}

.list-item:nth-child(1) { animation-delay: 0.1s; }
.list-item:nth-child(2) { animation-delay: 0.2s; }
.list-item:nth-child(3) { animation-delay: 0.3s; }
.list-item:nth-child(4) { animation-delay: 0.4s; }
.list-item:nth-child(5) { animation-delay: 0.5s; }

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Dynamic Control with CSS Variables

```css
.list-item {
  --delay: 0;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: calc(var(--delay) * 0.1s);
}

/* Set in HTML */
/* <div class="list-item" style="--delay: 1">Item 1</div> */
/* <div class="list-item" style="--delay: 2">Item 2</div> */
```

### Combining Multiple Animations

```css
/* Complex entry animation */
.card {
  animation:
    fadeIn 0.3s ease forwards,
    slideUp 0.4s ease forwards,
    scaleIn 0.3s ease 0.1s forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); }
  to { transform: translateY(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}
```

### Using Animation Events (JavaScript Integration)

```javascript
const element = document.querySelector('.animated');

// Animation start
element.addEventListener('animationstart', (e) => {
  console.log('Animation started:', e.animationName);
});

// Animation iteration (each loop)
element.addEventListener('animationiteration', (e) => {
  console.log('Animation iteration:', e.animationName);
});

// Animation end
element.addEventListener('animationend', (e) => {
  console.log('Animation ended:', e.animationName);
  // Trigger next animation here
  element.classList.add('next-animation');
});
```

## Practical Examples

### Loading Animations

```css
/* Spinning loader */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Pulsing loader */
.pulse-loader {
  width: 20px;
  height: 20px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
}

/* Three-dot loader */
.dots-loader {
  display: flex;
  gap: 8px;
}

.dots-loader span {
  width: 12px;
  height: 12px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.dots-loader span:nth-child(1) { animation-delay: 0s; }
.dots-loader span:nth-child(2) { animation-delay: 0.2s; }
.dots-loader span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Skeleton loading effect */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Hover Effects

```css
/* Button hover - gradient background */
.btn-gradient {
  position: relative;
  padding: 12px 24px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.btn-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.btn-gradient:hover::before {
  opacity: 1;
}

/* Card hover - lift effect */
.card-hover {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* Image hover - zoom + overlay */
.image-hover {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.image-hover img {
  width: 100%;
  transition: transform 0.5s ease;
}

.image-hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-hover:hover img {
  transform: scale(1.1);
}

.image-hover:hover::after {
  opacity: 1;
}

/* Link underline animation */
.link-underline {
  position: relative;
  color: #3b82f6;
  text-decoration: none;
}

.link-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.link-underline:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

### Page Transitions

```css
/* Fade in/out */
.page-fade-enter {
  opacity: 0;
}

.page-fade-enter-active {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.page-fade-exit {
  opacity: 1;
}

.page-fade-exit-active {
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Slide transition */
.page-slide-enter {
  transform: translateX(100%);
}

.page-slide-enter-active {
  transform: translateX(0);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-slide-exit {
  transform: translateX(0);
}

.page-slide-exit-active {
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Modal animation */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  pointer-events: none;
}

.modal-overlay.active {
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}

.modal-overlay.active .modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* Hamburger menu animation */
.hamburger {
  width: 30px;
  height: 20px;
  position: relative;
  cursor: pointer;
}

.hamburger span {
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: #333;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.hamburger span:nth-child(1) { top: 0; }
.hamburger span:nth-child(2) { top: 50%; transform: translateY(-50%); }
.hamburger span:nth-child(3) { bottom: 0; }

.hamburger.active span:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}
```

### Advanced Animation Effects

```css
/* Typewriter effect */
.typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid #333;
  width: 0;
  animation:
    typing 3s steps(30) forwards,
    blink 0.75s step-end infinite;
}

@keyframes typing {
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}

/* Wave text effect */
.wave-text span {
  display: inline-block;
  animation: wave 1s ease-in-out infinite;
}

.wave-text span:nth-child(1) { animation-delay: 0s; }
.wave-text span:nth-child(2) { animation-delay: 0.1s; }
.wave-text span:nth-child(3) { animation-delay: 0.2s; }
.wave-text span:nth-child(4) { animation-delay: 0.3s; }
.wave-text span:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Flash highlight effect */
.highlight {
  animation: highlight 2s ease-in-out;
}

@keyframes highlight {
  0%, 100% {
    background-color: transparent;
  }
  25%, 75% {
    background-color: rgba(255, 255, 0, 0.3);
  }
}

/* Material Design Ripple Effect */
.ripple-btn {
  position: relative;
  overflow: hidden;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%);
  background-size: 1000% 1000%;
  background-position: center;
  opacity: 0;
  transition: background-size 0.5s ease, opacity 0.5s ease;
}

.ripple-btn:active::after {
  background-size: 0% 0%;
  opacity: 1;
  transition: 0s;
}
```

## CSS vs JavaScript Animations

### When to Use CSS Animations

| Scenario | Recommendation |
|----------|----------------|
| Simple state transitions (hover, focus) | CSS Transition |
| Looping animations (loading indicators) | CSS Animation |
| Declarative animations (predefined effects) | CSS |
| Animations requiring best performance | CSS (using transform/opacity) |

### When to Use JavaScript Animations

| Scenario | Recommendation |
|----------|----------------|
| Need precise control (pause, reverse, seek) | JavaScript |
| Input-based animations (drag, scroll) | JavaScript |
| Complex sequence animations | JavaScript |
| Physics effects (spring, inertia) | JavaScript |
| Dynamically calculated animation values | JavaScript |

### Performance Comparison

```javascript
// JavaScript animation (using requestAnimationFrame)
function animateWithJS(element) {
  let start = null;
  const duration = 1000;

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);

    element.style.transform = `translateX(${progress * 200}px)`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// CSS animation (more concise, usually better performance)
// .animate { transition: transform 1s ease; }
// .animate.active { transform: translateX(200px); }
```

### Web Animations API

Modern browsers provide the Web Animations API, combining the best of both worlds:

```javascript
// Using Web Animations API
const element = document.querySelector('.box');

const animation = element.animate([
  { transform: 'translateX(0)', opacity: 1 },
  { transform: 'translateX(200px)', opacity: 0.5 }
], {
  duration: 1000,
  easing: 'ease-out',
  fill: 'forwards'
});

// Precise control
animation.pause();
animation.play();
animation.reverse();
animation.currentTime = 500; // Seek to 500ms
animation.playbackRate = 2;  // 2x speed playback

// Event listeners
animation.onfinish = () => console.log('Animation complete');
```

## Best Practices

### Performance First

- Limit animations to `transform` and `opacity` properties
- Avoid animating properties that trigger layout (width, height, top, left)
- Use `will-change` sparingly and remove it after animations complete
- Test animations on low-powered devices

### Respect User Preferences

```css
/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Meaningful Animation Duration

- Keep micro-interactions under 200ms
- Most UI animations should be 200-500ms
- Avoid animations longer than 1 second for common interactions

### Use Easing Appropriately

- `ease-out` for elements entering the screen
- `ease-in` for elements leaving the screen
- `ease-in-out` for elements moving within the viewport
- Avoid `linear` for UI animations (feels mechanical)

### Avoid Animation Overload

- Not every element needs animation
- Animations should serve a purpose (feedback, guidance, delight)
- Too many animations can be distracting and impact performance

## Interview Key Points

### Common Interview Questions

**1. What is the difference between transition and animation?**

```
Transition:
- Requires a trigger condition (hover, class change, etc.)
- Can only define start and end states
- Cannot automatically repeat
- Simpler syntax

Animation:
- Can play automatically without a trigger
- Can define multiple keyframes (@keyframes)
- Can loop infinitely
- More fine-grained control (direction, pause, etc.)
```

**2. How do you optimize CSS animation performance?**

```
1. Only animate transform and opacity (only triggers compositing)
2. Use will-change to hint the browser (use sparingly)
3. Avoid animating many elements simultaneously
4. Use GPU acceleration: transform: translateZ(0)
5. Reduce complexity of animated elements (layers, shadows)
6. Use requestAnimationFrame instead of setTimeout/setInterval
```

**3. What are reflow and repaint?**

```
Reflow (Layout):
- Recalculating layout due to geometric property changes
- Triggered by: width, height, padding, margin, position, etc.
- Highest performance impact

Repaint:
- Element appearance changes without affecting layout
- Triggered by: color, background, border-color, visibility, etc.
- Lower performance impact

Optimal: Only trigger Composite
- Only transform and opacity avoid reflow/repaint
```

**4. What causes CSS animation jank and how to fix it?**

```
Causes:
1. Using properties that trigger reflow (width, height, top, left)
2. Too many animated elements
3. Animation calculations on main thread
4. Overly complex layer hierarchy
5. Memory pressure causing frequent GC

Solutions:
1. Use transform instead of position/size properties
2. Use opacity instead of visibility
3. Reduce number of animated elements
4. Use will-change to create new layers
5. Simplify DOM structure
```

**5. Explain cubic-bezier easing functions**

```
cubic-bezier(x1, y1, x2, y2) defines a Bezier curve

- Start point fixed at (0, 0), end point fixed at (1, 1)
- (x1, y1) is the first control point
- (x2, y2) is the second control point
- X-axis represents time (0-1), Y-axis represents progress (can exceed 0-1)

Common values:
- ease: cubic-bezier(0.25, 0.1, 0.25, 1)
- ease-in: cubic-bezier(0.42, 0, 1, 1)
- ease-out: cubic-bezier(0, 0, 0.58, 1)
- elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

**6. What does each animation-fill-mode value do?**

```css
none:     No style changes before/after animation
forwards: Retain the last keyframe's styles after animation ends
backwards: Apply first keyframe's styles before animation starts (during delay)
both:     Apply both forwards and backwards

Common pitfall:
- Default is none, so elements "jump back" to original state after animation
- To retain animation result, must set forwards or both
```

### Code Challenge

**Implement a button click ripple effect (Material Design Ripple):**

```css
.ripple-btn {
  position: relative;
  overflow: hidden;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%);
  background-size: 1000% 1000%;
  background-position: center;
  opacity: 0;
  transition: background-size 0.5s ease, opacity 0.5s ease;
}

.ripple-btn:active::after {
  background-size: 0% 0%;
  opacity: 1;
  transition: 0s;
}
```

## Further Reading

### Official Documentation

- [MDN - CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions)
- [MDN - CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [MDN - Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

### Recommended Tools

- [cubic-bezier.com](https://cubic-bezier.com/) - Visual bezier curve editor
- [Easings.net](https://easings.net/) - Easing function cheat sheet
- [Animista](https://animista.net/) - CSS animation code generator
- [CSS Triggers](https://csstriggers.com/) - See which rendering stages CSS properties trigger

### Animation Libraries

- **Animate.css** - Pre-built CSS animation classes
- **Framer Motion** - React animation library
- **GSAP** - Professional-grade JavaScript animation library
- **Lottie** - After Effects animation export and playback

### Advanced Topics

- CSS Houdini - Low-level CSS APIs
- View Transitions API - New page transition standard
- Scroll-driven Animations - Scroll-linked animations
- CSS Motion Path - Path-based animations

### Design Guidelines

- [Material Design Motion](https://m3.material.io/styles/motion/overview)
- [Apple Human Interface Guidelines - Animation](https://developer.apple.com/design/human-interface-guidelines/animation)

## Summary

CSS animations are an essential skill in modern web development. Mastering Transitions and Animations, along with understanding performance optimization principles, enables you to create smooth, natural user interface interactions.

Key takeaways:

1. **Transitions** are best for simple state changes; **Animations** are better for complex multi-stage effects
2. The core of **performance optimization** is animating only `transform` and `opacity`
3. **Timing functions** determine the rhythm of animations; choosing the right easing makes animations feel natural
4. Choose between **CSS animations** or **JavaScript animations** based on your use case
5. Animations should serve the user experience, not be used for showing off

Through continuous practice and experimentation, you will be able to skillfully use CSS animations to create outstanding interactive experiences for your users. Remember that the best animations are often the ones users do not consciously notice - they simply make the interface feel right.
