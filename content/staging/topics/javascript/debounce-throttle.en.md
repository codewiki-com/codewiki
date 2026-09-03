---
title: JavaScript Debounce and Throttle Patterns
description: Comprehensive guide to debounce and throttle patterns in JavaScript. Learn how to optimize event handlers, API calls, and expensive operations with practical examples and best practices.
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - debounce
  - throttle
  - performance
  - optimization
  - event handling
  - patterns
status: imported
origin: old/src/content/docs/javascript/debounce-throttle.en.md
divergence: 0.042
issues: []
legacy:
  category: JavaScript
  subcategory: Performance
  order: 25
  lastUpdated: 2026-01-07
---

Debounce and throttle are two essential techniques for controlling the frequency of function execution in response to high-frequency events. They are critical for building performant web applications that handle user interactions, API calls, and expensive DOM operations efficiently.

## Concept Explanation

### What are Debounce and Throttle?

**Debounce** and **throttle** are optimization techniques that limit how often a function executes. They're used to reduce unnecessary function calls and improve application performance.

**Debounce** delays the execution of a function until a specified time has passed since the last invocation. It's like saying "wait for the user to stop doing something before executing the function."

**Throttle** ensures that a function executes at most once every specified time interval. It's like saying "execute the function at regular intervals while the event is happening."

### When Were They Introduced?

These patterns emerged from practical web development needs:
- Early 2000s: Developers noticed performance issues with high-frequency events
- jQuery era: Libraries started including debounce/throttle utilities
- Modern JavaScript: Now considered essential knowledge for front-end developers
- Modern frameworks: React, Vue, Angular all recommend or provide these utilities

### What Problems Do They Solve?

1. **Performance Issues**: High-frequency events (scroll, resize, mousemove) can trigger excessive function calls, causing lag and high CPU usage
2. **API Rate Limiting**: Preventing excessive API requests that could violate rate limits
3. **Expensive Computations**: Reducing unnecessary DOM updates, calculations, or rendering
4. **Battery Drain**: On mobile devices, reducing function calls conserves battery
5. **Memory Leaks**: Preventing accumulation of pending executions

## Core Principles

### How Debounce Works

Debounce operates on the principle of "wait until the action stops":

1. When the function is called, start a timer
2. If the function is called again before the timer completes, reset the timer
3. Only execute the function when the timer completes without being reset
4. Each new call cancels the previous pending execution

**Timeline example for debounce (wait: 300ms):**
```
Events:  |--e--|--e--|--e--|--e--|--e--|
Timers:  |-----[reset]-[reset]-[reset]-[execute]
Result:  Executes once, 300ms after the last event
```

### How Throttle Works

Throttle operates on the principle of "execute at regular intervals":

1. When the function is called, execute it immediately (or queue it)
2. Set a flag to indicate execution is in progress
3. Ignore all subsequent calls within the specified interval
4. When the interval expires, the flag resets and the next call can execute
5. Some implementations execute again at the interval end if calls were made

**Timeline example for throttle (interval: 300ms):**
```
Events:  |e|e|e|e|e|e|e|e|e|e|
Results: |e|---|e|---|e|---|e|
         Executes at regular intervals
```

### Key Difference

| Aspect | Debounce | Throttle |
|--------|----------|----------|
| **Goal** | Wait for action to stop | Execute at intervals |
| **Use Case** | Form validation, search | Scroll, resize, mousemove |
| **Execution** | Once after delay | Multiple times periodically |
| **Cancellation** | Each call resets timer | Only interval-based |
| **Last Event** | Always executes last | May miss last event |

## Key Points

### Understanding Debounce Behavior

1. **Trailing Execution (Default)**: Function executes after the delay period
   - Use case: Form validation, search suggestions
   - User completes action, then validation runs

2. **Leading Execution**: Function executes immediately on first call
   - Use case: Preventing double-clicks, immediate feedback
   - First call executes, then ignored until delay passes

3. **Both Leading and Trailing**: Function executes on first and last call
   - Use case: Complex operations needing immediate and final response
   - Most flexible but most complex

### Understanding Throttle Behavior

1. **Leading Execution (Default)**: First call executes immediately
   - Use case: Instant visual feedback (like scroll position)
   - Ensures responsive feel on first event

2. **Trailing Execution**: Last call executes after the interval
   - Use case: Final state capture
   - Ensures final state is processed

3. **MaxWait**: Ensures function executes at least after a maximum time
   - Use case: Long sequences of events
   - Guarantees no starvation of execution

### Memory and Closure Considerations

Both patterns rely on closures to maintain state:
- Debounce stores the timeout ID
- Throttle stores the last execution time and timeout ID
- Multiple instances need separate closures to avoid interference
- Proper cleanup prevents memory leaks

## Code Examples

### Basic Debounce Implementation

```javascript
// Simple debounce without options
function debounce(func, delay) {
  let timeoutId;

  return function debounced(...args) {
    // Clear the previous timer
    clearTimeout(timeoutId);

    // Set a new timer
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage
const handleSearch = debounce((query) => {
  console.log("Searching for:", query);
  // Make API call
}, 300);

// Every keystroke resets the timer
input.addEventListener('input', (e) => {
  handleSearch(e.target.value);
});
```

### Advanced Debounce with Options

```javascript
function debounce(func, delay, options = {}) {
  let timeoutId;
  let lastCallTime;
  let maxTimeoutId;
  let lastResult;

  const {
    leading = false,      // Execute on leading edge
    trailing = true,      // Execute on trailing edge
    maxWait = null,       // Maximum wait time
    resultCallback = null // Callback with result
  } = options;

  const debounced = function(...args) {
    const now = Date.now();
    const isFirstCall = lastCallTime === undefined;

    // Leading edge execution
    if (isFirstCall && leading) {
      lastResult = func.apply(this, args);
      if (resultCallback) resultCallback(lastResult);
    }

    lastCallTime = now;

    // Clear existing timers
    clearTimeout(timeoutId);
    clearTimeout(maxTimeoutId);

    // Setup trailing timeout
    if (trailing) {
      timeoutId = setTimeout(() => {
        lastResult = func.apply(this, args);
        if (resultCallback) resultCallback(lastResult);
        lastCallTime = undefined;
      }, delay);
    }

    // Setup max wait timeout
    if (maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        if (trailing) clearTimeout(timeoutId);
        lastResult = func.apply(this, args);
        if (resultCallback) resultCallback(lastResult);
        lastCallTime = undefined;
        maxTimeoutId = undefined;
      }, maxWait);
    }

    return lastResult;
  };

  // Cancel function to clear pending executions
  debounced.cancel = function() {
    clearTimeout(timeoutId);
    clearTimeout(maxTimeoutId);
    lastCallTime = undefined;
  };

  // Flush function to immediately execute pending call
  debounced.flush = function() {
    if (timeoutId || maxTimeoutId) {
      clearTimeout(timeoutId);
      clearTimeout(maxTimeoutId);
      lastResult = func.apply(this, arguments);
      lastCallTime = undefined;
    }
    return lastResult;
  };

  return debounced;
}

// Usage examples
const validateEmail = debounce(
  (email) => {
    console.log("Validating:", email);
    return email.includes('@');
  },
  500,
  {
    trailing: true,
    resultCallback: (isValid) => {
      console.log("Email valid:", isValid);
    }
  }
);
```

### Basic Throttle Implementation

```javascript
// Simple throttle
function throttle(func, interval) {
  let lastCallTime = 0;
  let timeoutId;

  return function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= interval) {
      // Enough time has passed, execute immediately
      lastCallTime = now;
      return func.apply(this, args);
    } else {
      // Schedule execution at the end of interval
      clearTimeout(timeoutId);
      const remainingTime = interval - timeSinceLastCall;

      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func.apply(this, args);
      }, remainingTime);
    }
  };
}

// Usage
const handleScroll = throttle(() => {
  console.log("User scrolled, position:", window.scrollY);
  // Update UI or make API call
}, 1000);

window.addEventListener('scroll', handleScroll);
```

### Advanced Throttle with Options

```javascript
function throttle(func, interval, options = {}) {
  let lastCallTime = 0;
  let lastExecutionTime = 0;
  let timeoutId;
  let pendingArgs;
  let pendingThis;

  const {
    leading = true,     // Execute on first call
    trailing = false,   // Execute pending call at interval end
  } = options;

  const throttled = function(...args) {
    const now = Date.now();
    pendingArgs = args;
    pendingThis = this;

    // First call and leading is true
    if (lastCallTime === 0 && leading) {
      lastCallTime = now;
      lastExecutionTime = now;
      return func.apply(this, args);
    }

    // Set pending execution timer
    if (trailing && !timeoutId) {
      const timeSinceLastExecution = now - lastExecutionTime;
      const delayUntilNext = interval - timeSinceLastExecution;

      timeoutId = setTimeout(() => {
        lastExecutionTime = Date.now();
        timeoutId = null;
        func.apply(pendingThis, pendingArgs);
      }, delayUntilNext);
    }

    lastCallTime = now;
  };

  throttled.cancel = function() {
    clearTimeout(timeoutId);
    lastCallTime = 0;
    lastExecutionTime = 0;
    timeoutId = null;
  };

  return throttled;
}

// Usage
const handleMouseMove = throttle(
  (e) => {
    console.log(`Mouse at ${e.clientX}, ${e.clientY}`);
  },
  100,
  { leading: true, trailing: true }
);

document.addEventListener('mousemove', handleMouseMove);
```

### Using Lodash Library

```javascript
// Debounce with lodash
import { debounce } from 'lodash';

const searchUsers = debounce((query) => {
  fetch(`/api/users?q=${query}`)
    .then(res => res.json())
    .then(data => updateResults(data));
}, 300);

input.addEventListener('input', (e) => {
  searchUsers(e.target.value);
});

// Throttle with lodash
import { throttle } from 'lodash';

const trackScrollPosition = throttle(() => {
  const scrollPos = window.scrollY;
  analytics.track('scroll_position', { position: scrollPos });
}, 1000);

window.addEventListener('scroll', trackScrollPosition);
```

### Real-world: Search with Abort Controller

```javascript
function createDebouncedSearch() {
  let timeoutId;
  let abortController;

  return async function search(query) {
    clearTimeout(timeoutId);

    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }

    timeoutId = setTimeout(async () => {
      try {
        abortController = new AbortController();

        const response = await fetch(
          `/api/search?q=${query}`,
          { signal: abortController.signal }
        );

        if (!response.ok) throw new Error('Search failed');

        const results = await response.json();
        updateUI(results);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      }
    }, 300);
  };
}

const search = createDebouncedSearch();
searchInput.addEventListener('input', (e) => {
  search(e.target.value);
});
```

### Combining Debounce and Throttle

```javascript
function debounceThrottle(func, debounceDelay, throttleInterval) {
  let throttled = throttle(func, throttleInterval);
  let debounced = debounce(throttled, debounceDelay);

  return debounced;
}

// Usage: Ensures minimum throttle interval with debounce for final state
const handleComplexOperation = debounceThrottle(
  (value) => {
    console.log("Processing:", value);
    expensiveOperation(value);
  },
  300,  // Wait 300ms after last call
  100   // But execute at least every 100ms
);

input.addEventListener('input', (e) => {
  handleComplexOperation(e.target.value);
});
```

## Best Practices

### Choose the Right Pattern

```javascript
// Use Debounce when:
// - You only care about the final result
// - User is still interacting (typing, resizing)
// - API calls should be minimized

const handleFormChange = debounce(async (formData) => {
  await saveFormChanges(formData);
}, 1000);

// Use Throttle when:
// - You need consistent, responsive updates
// - Interval-based execution is important
// - Visual feedback is needed during interaction

const handleWindowScroll = throttle(() => {
  updateScrollIndicator();
}, 100);
```

### Managing Function Context

```javascript
// Problem: Wrong 'this' context
class SearchComponent {
  constructor() {
    // Without proper binding, 'this' is lost
    this.search = debounce(this.performSearch, 300);
  }

  performSearch(query) {
    console.log(this); // Will be wrong
  }
}

// Solution 1: Arrow function
class SearchComponent {
  constructor() {
    this.search = debounce((query) => {
      this.performSearch(query);
    }, 300);
  }

  performSearch(query) {
    console.log(this); // Correct
  }
}

// Solution 2: Bind in debounce
function debounceWithContext(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
```

### Proper Resource Cleanup

```javascript
class DataFetcher {
  constructor() {
    this.fetchData = debounce(() => {
      this.abortController?.abort();
      this.abortController = new AbortController();

      fetch('/api/data', { signal: this.abortController.signal })
        .then(res => res.json())
        .then(data => this.handleData(data));
    }, 500);
  }

  handleData(data) {
    // Process data
  }

  // Cleanup when component is destroyed
  destroy() {
    this.fetchData.cancel?.();
    this.abortController?.abort();
  }
}
```

### Handling Arguments Correctly

```javascript
// Problem: Lost arguments
const handleInput = debounce((event) => {
  console.log(event.target.value); // event might be synthetic
}, 300);

input.addEventListener('input', handleInput);

// Solution: Extract needed values immediately
const handleInput = debounce((value, event) => {
  console.log(value);
}, 300);

input.addEventListener('input', (e) => {
  handleInput(e.target.value, e);
});

// Or persist event properties
const handleInput = debounce(function(event) {
  const value = event.target.value;
  console.log(value);
}, 300);

// Better: use event.persist() if needed
input.addEventListener('input', (e) => {
  if (e.persist) e.persist(); // React synthetic events
  handleInput(e);
});
```

### Testing Debounced Functions

```javascript
// Test debounce with fake timers
describe('debounce', () => {
  jest.useFakeTimers();

  it('should wait before executing', () => {
    const callback = jest.fn();
    const debounced = debounce(callback, 300);

    debounced('value');
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith('value');
  });

  it('should reset timer on new call', () => {
    const callback = jest.fn();
    const debounced = debounce(callback, 300);

    debounced('value1');
    jest.advanceTimersByTime(100);
    debounced('value2');
    jest.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledWith('value2');
  });

  jest.useRealTimers();
});
```

## Common Pitfalls

### Creating New Debounced Functions Each Render

```javascript
// WRONG - React creates new debounced function each render
function SearchComponent() {
  const handleSearch = debounce((query) => {
    // search logic
  }, 300);

  return <input onChange={handleSearch} />;
}

// CORRECT - Use useCallback or useMemo
import { useCallback, useRef } from 'react';

function SearchComponent() {
  const debouncedRef = useRef(null);

  const handleSearch = useCallback((query) => {
    if (!debouncedRef.current) {
      debouncedRef.current = debounce((q) => {
        // search logic
      }, 300);
    }
    debouncedRef.current(query);
  }, []);

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

### Forgetting to Cancel Pending Executions

```javascript
// WRONG - Pending request may execute after component unmounts
function SearchComponent() {
  const handleSearch = debounce((query) => {
    fetch('/api/search?q=' + query)
      .then(res => res.json())
      .then(data => setResults(data)); // May crash if component unmounted
  }, 300);

  return <input onChange={handleSearch} />;
}

// CORRECT - Cancel on unmount
function SearchComponent() {
  useEffect(() => {
    return () => {
      handleSearch.cancel(); // Cancel pending execution
    };
  }, []);

  return <input onChange={handleSearch} />;
}
```

### Misunderstanding Throttle with Events

```javascript
// WRONG - May miss important events
const handleResize = throttle(() => {
  const width = window.innerWidth;
  layout.resize(width);
}, 500);

window.addEventListener('resize', handleResize);

// CORRECT - Ensure final state is captured
const handleResize = throttle(() => {
  const width = window.innerWidth;
  layout.resize(width);
}, 500, { leading: true, trailing: true });

window.addEventListener('resize', handleResize);
```

### Memory Leaks with Event Listeners

```javascript
// WRONG - Debounced function never cleaned up
class Component {
  constructor() {
    this.handleScroll = debounce(() => {
      this.updatePosition();
    }, 200);

    window.addEventListener('scroll', this.handleScroll);
  }

  destroy() {
    // Forgot to remove listener and cancel debounce
  }
}

// CORRECT - Proper cleanup
class Component {
  constructor() {
    this.handleScroll = debounce(() => {
      this.updatePosition();
    }, 200);

    window.addEventListener('scroll', this.handleScroll);
  }

  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
    this.handleScroll.cancel?.();
  }
}
```

### Mixing Immediate Execution with Events

```javascript
// WRONG - Can cause unexpected behavior
const handleClick = debounce(() => {
  // Process click
}, 300, { leading: true, trailing: true });

button.addEventListener('click', handleClick); // May execute twice!

// CORRECT - Use appropriate option
const handleClick = debounce(() => {
  // Process click
}, 300, { leading: true, trailing: false });

button.addEventListener('click', handleClick); // Executes once immediately
```

## Performance Considerations

### Choosing Optimal Delays

```javascript
// General guidelines:
const delays = {
  // Keyboard input (search, validation)
  search: 300,              // Allow user to finish typing
  validation: 500,          // More time for complex validation
  autoSave: 2000,           // Balance between saving and performance

  // Mouse/touch events
  mousemove: 100,           // Quick visual feedback
  scroll: 100,              // Smooth scroll tracking
  resize: 150,              // Account for rapid resize

  // Debounce for final processing
  analytics: 1000,          // Batch analytics events
  logging: 2000,            // Batch log entries
};

// Consider network latency
const debounceDelay = Math.max(
  300,                      // Minimum for perceived responsiveness
  estimatedNetworkLatency   // Account for actual conditions
);
```

### Memory Impact Analysis

```javascript
// Debounce memory usage
function debounce(func, delay) {
  let timeoutId;        // Single number (4 bytes)
  let lastArgs;         // Stores function arguments
  let context;          // Stores 'this' context

  // Total: ~100-200 bytes per debounced function
  // Impact: Minimal for most use cases
}

// Throttle memory usage
function throttle(func, interval) {
  let lastCallTime = 0; // Single number (8 bytes)
  let timeoutId;        // Single number (4 bytes)

  // Total: ~50-100 bytes per throttled function
  // Impact: Very minimal
}

// Best practice: Reuse debounced functions
class UIManager {
  constructor() {
    // Create once, reuse many times
    this.onResize = debounce(() => this.layout(), 150);
    this.onScroll = throttle(() => this.updatePosition(), 100);
  }

  attachListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll);
  }

  detachListeners() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
  }
}
```

### CPU Impact Reduction

```javascript
// Before optimization: Thousands of calls per second
window.addEventListener('mousemove', (e) => {
  updateTracker(e.clientX, e.clientY);
  calculateDistance();
  updateUI();
});

// After throttle: ~10 calls per second
const optimizedTracker = throttle((e) => {
  updateTracker(e.clientX, e.clientY);
  calculateDistance();
  updateUI();
}, 100);

window.addEventListener('mousemove', optimizedTracker);

// Actual performance impact:
// - CPU: ~90% reduction
// - Frame rate: Maintained at 60fps
// - Battery (mobile): ~40% improvement
```

### Measuring Performance

```javascript
// Measure function call frequency
function measureCallFrequency(label, interval = 1000) {
  let callCount = 0;
  let lastLogTime = Date.now();

  return function(...args) {
    callCount++;
    const now = Date.now();

    if (now - lastLogTime >= interval) {
      console.log(`${label}: ${callCount} calls/second`);
      callCount = 0;
      lastLogTime = now;
    }
  };
}

// Usage
const handler = measureCallFrequency('scroll events');
window.addEventListener('scroll', handler);
// Output: "scroll events: 145 calls/second" (without optimization)

// With throttle
const throttledHandler = throttle(handler, 100);
window.addEventListener('scroll', throttledHandler);
// Output: "scroll events: 10 calls/second" (93% reduction)
```

## Real-world Scenarios

### Search Input with API Call

```javascript
class SearchBox {
  constructor(inputElement, resultsElement) {
    this.input = inputElement;
    this.results = resultsElement;
    this.abortController = null;

    // Debounce to wait for user to finish typing
    this.search = debounce((query) => {
      this.performSearch(query);
    }, 400);

    this.input.addEventListener('input', (e) => {
      this.search(e.target.value);
    });
  }

  async performSearch(query) {
    if (!query.trim()) {
      this.results.textContent = '';
      return;
    }

    // Cancel previous request
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      this.showLoading();

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
        { signal: this.abortController.signal }
      );

      if (!response.ok) throw new Error('Search failed');

      const results = await response.json();
      this.displayResults(results);

    } catch (error) {
      if (error.name !== 'AbortError') {
        this.showError(error.message);
      }
    }
  }

  showLoading() {
    this.results.textContent = 'Loading...';
  }

  displayResults(results) {
    this.results.textContent = results
      .map(item => item.title)
      .join(', ');
  }

  showError(message) {
    this.results.textContent = 'Error: ' + message;
  }
}

// Usage
new SearchBox(
  document.getElementById('searchInput'),
  document.getElementById('searchResults')
);
```

### Window Resize Handler

```javascript
class ResponsiveLayout {
  constructor() {
    // Use throttle to ensure responsive UI updates
    this.handleResize = throttle(() => {
      this.updateLayout();
    }, 150, { leading: true, trailing: true });

    window.addEventListener('resize', this.handleResize);
  }

  updateLayout() {
    const width = window.innerWidth;
    const breakpoint = this.getBreakpoint(width);

    document.documentElement.dataset.breakpoint = breakpoint;
    this.adjustLayout(breakpoint);
  }

  getBreakpoint(width) {
    if (width < 480) return 'mobile';
    if (width < 768) return 'tablet';
    if (width < 1024) return 'desktop';
    return 'wide';
  }

  adjustLayout(breakpoint) {
    const layout = document.querySelector('.layout');
    layout.classList.forEach(cls => {
      if (cls.startsWith('bp-')) layout.classList.remove(cls);
    });
    layout.classList.add(`bp-${breakpoint}`);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
  }
}
```

### Form Auto-Save

```javascript
class AutoSaveForm {
  constructor(formElement) {
    this.form = formElement;
    this.saveState = 'saved';
    this.lastSavedData = null;

    // Debounce to wait for user to finish editing
    this.save = debounce(() => {
      this.performSave();
    }, 2000);

    // Listen to form changes
    this.form.addEventListener('input', (e) => {
      this.save();
      this.updateSaveState('saving');
    });

    // Also save on form submit
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.save.flush(); // Execute immediately
    });
  }

  async performSave() {
    try {
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData);

      if (JSON.stringify(data) === this.lastSavedData) {
        this.updateSaveState('saved');
        return;
      }

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        this.lastSavedData = JSON.stringify(data);
        this.updateSaveState('saved');
      } else {
        this.updateSaveState('error');
      }
    } catch (error) {
      console.error('Save failed:', error);
      this.updateSaveState('error');
    }
  }

  updateSaveState(state) {
    this.saveState = state;
    const indicator = this.form.querySelector('[data-save-state]');

    if (indicator) {
      indicator.textContent = state === 'saving' ? 'Saving...'
                            : state === 'error' ? 'Save failed'
                            : 'Saved';
      indicator.className = `save-state save-state-${state}`;
    }
  }
}

// Usage
const form = document.getElementById('autoSaveForm');
new AutoSaveForm(form);
```

### Scroll Position Tracking

```javascript
class ScrollTracker {
  constructor() {
    this.setupAnalytics();
    this.setupUI();
  }

  setupAnalytics() {
    // Throttle analytics events
    this.trackScroll = throttle(() => {
      const scrollPercentage = this.getScrollPercentage();

      // Track scroll depth for analytics
      if (scrollPercentage > this.lastTrackedPercentage + 25) {
        this.lastTrackedPercentage = scrollPercentage;
        this.sendAnalytics('scroll_depth', {
          percentage: scrollPercentage,
          timestamp: Date.now()
        });
      }
    }, 300);

    window.addEventListener('scroll', this.trackScroll);
  }

  setupUI() {
    // Throttle UI updates for smooth performance
    this.updateProgressBar = throttle(() => {
      const percentage = this.getScrollPercentage();
      const progressBar = document.querySelector('.progress-bar');

      if (progressBar) {
        progressBar.style.width = percentage + '%';
      }
    }, 100);

    window.addEventListener('scroll', this.updateProgressBar);
  }

  getScrollPercentage() {
    const window_height = document.documentElement.scrollHeight
                        - document.documentElement.clientHeight;
    const scrolled = window.scrollY;
    return Math.round((scrolled / window_height) * 100);
  }

  sendAnalytics(event, data) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', event, data);
    }
  }
}

// Usage
new ScrollTracker();
```

### Button Click Prevention (Debounce)

```javascript
class SubmitButton {
  constructor(buttonElement) {
    this.button = buttonElement;

    // Prevent double-clicks with debounce
    this.handleClick = debounce(() => {
      this.submitForm();
    }, 300, { leading: true, trailing: false });

    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleClick();
    });
  }

  async submitForm() {
    try {
      this.button.disabled = true;
      this.button.textContent = 'Submitting...';

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: new FormData(this.button.closest('form'))
      });

      if (response.ok) {
        this.button.textContent = 'Submitted!';
        this.button.classList.add('success');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      this.button.textContent = 'Submit';
      this.button.disabled = false;
      this.button.classList.add('error');
      console.error('Submit error:', error);
    }
  }
}

// Usage
document.querySelectorAll('.submit-btn').forEach(btn => {
  new SubmitButton(btn);
});
```

## Interview Points

### Common Interview Questions

**Q1: What's the main difference between debounce and throttle?**

A: Debounce delays execution until action stops (wait for silence), while throttle executes at regular intervals during ongoing action (periodic execution). Debounce is ideal for final results (search, validation), throttle for continuous feedback (scroll, resize).

**Q2: When would you use debounce over throttle?**

A: Use debounce when you only care about the final result and want to minimize function calls. Examples: form validation, search suggestions, auto-save. The function executes once after the user stops interacting.

**Q3: Can you implement a basic debounce function?**

A: (Provide the code from Code Examples section - simple debounce implementation)

**Q4: What are the challenges with debounce in React?**

A: Main challenges include:
- Creating new debounced function on every render (use useCallback)
- Memory leaks from pending executions (cancel on unmount)
- Lost event data due to async behavior (extract needed values immediately)
- Proper cleanup and reference management

**Q5: How would you test a debounced function?**

A: Use fake timers (jest.useFakeTimers), advance time with jest.advanceTimersByTime, verify the callback wasn't called too early, and verify it was called at the right time.

**Q6: What's the performance impact of debounce/throttle?**

A: Both have minimal memory impact (~100 bytes per function). Performance improvement depends on frequency reduction. Typical scroll events reduce from 100+ calls/second to 10, achieving ~90% reduction in unnecessary work.

**Q7: Explain "cancel" and "flush" methods on debounced functions.**

A:
- `cancel()`: Clears pending execution without calling the function
- `flush()`: Immediately executes any pending function call

Both are useful for cleanup or forcing execution at specific times.

**Q8: How do you handle 'this' context in debounced methods?**

A: Use arrow functions to preserve 'this' context, or apply context-aware debounce implementations that use `func.apply(this, args)` internally.

**Q9: Should debounce be used for API calls?**

A: Yes, but combine with AbortController to cancel pending requests. Also consider maxWait option to ensure requests don't get delayed indefinitely.

**Q10: What's the difference between leading and trailing execution?**

A: Leading executes immediately on first call (good for instant feedback). Trailing executes after delay passes (good for final state). Can use both for maximum control.

### Expected Follow-up Discussions

- Performance monitoring and profiling
- Integration with modern frameworks (React, Vue)
- Advanced patterns combining multiple techniques
- Testing strategies and edge cases
- Browser event handling nuances

## Further Reading

### Official Documentation and Resources

- [JavaScript.info - Decorators, forwarding, call/apply](https://javascript.info/call-apply-decorators)
- [MDN Web Docs - Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [Event Loop and Timers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)

### Libraries and Tools

- [Lodash - debounce and throttle](https://lodash.com/)
- [Underscore.js](https://underscorejs.org/)
- [TooMany.js](https://github.com/dennyferra/TooMany.js)

### Related Concepts

- Promise and async/await for handling asynchronous operations
- Event delegation for efficient event handling
- RequestAnimationFrame for smooth animations
- Intersection Observer API for visibility detection
- ResizeObserver for element resize tracking

### Practice and Tutorials

- Build a search autocomplete component with debounce
- Implement a responsive layout handler with throttle
- Create an auto-save form implementation
- Build performance monitoring utilities
- Implement request batching with debounce

### Key Takeaways

1. **Choose wisely**: Debounce for final results, throttle for continuous updates
2. **Proper cleanup**: Always cancel pending executions to prevent memory leaks
3. **Context matters**: Be aware of 'this' binding and event object lifecycle
4. **Performance first**: Use appropriate delays based on your use case
5. **Test thoroughly**: Use fake timers and verify call frequencies
6. **Framework integration**: Use framework-specific hooks (React useCallback, Vue watch)
7. **Combine strategically**: Sometimes combining patterns gives optimal results
8. **Monitor and measure**: Track actual call reduction and performance impact
