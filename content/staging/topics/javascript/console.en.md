---
title: JavaScript Console API
description: Complete guide to JavaScript Console API including log levels, formatting, timing and grouping
track: javascript
section: browser
difficulty: beginner
tags:
  - JavaScript
  - Console
  - debugging
  - browser
status: imported
origin: old/src/content/docs/javascript/console.en.md
divergence: 0.297
issues: []
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 24
  lastUpdated: 2026-01-07
---

The Console API provides a powerful set of methods for debugging and logging information in JavaScript. While `console.log()` is the most commonly used method, the Console API offers many more features that can significantly improve your debugging workflow.

## Basic Logging Methods

The Console API provides several methods for outputting messages to the console. Each method serves a different purpose and displays messages with distinct visual styling.

### console.log()

The most basic and widely used method for general-purpose logging.

```javascript
console.log('Hello, World!');
console.log('User:', { name: 'Alice', age: 30 });
console.log('Numbers:', 1, 2, 3, 4, 5);

// Multiple arguments are separated by spaces
console.log('Name:', 'John', 'Age:', 25);
// Output: Name: John Age: 25
```

### console.info()

Used for informational messages. In most browsers, it behaves similarly to `console.log()`, but may display with an info icon.

```javascript
console.info('Application started successfully');
console.info('Current version: 2.1.0');
console.info('Environment:', process.env.NODE_ENV);
```

### console.debug()

Outputs a message with the "debug" log level. In some browser developer tools, debug messages are hidden by default and must be enabled.

```javascript
console.debug('Entering function calculateTotal');
console.debug('Parameters:', { price: 100, quantity: 5 });
console.debug('Intermediate value:', intermediateResult);
```

## Log Levels

The Console API provides different log levels to categorize messages by severity. Using appropriate log levels helps filter and identify issues quickly.

### console.warn()

Outputs a warning message, typically displayed with a yellow background and warning icon.

```javascript
console.warn('Deprecated function called');
console.warn('Memory usage is above 80%');
console.warn('API rate limit approaching:', { remaining: 10, total: 100 });

// Common use cases
if (apiVersion < 2) {
  console.warn('API v1 is deprecated. Please upgrade to v2.');
}

if (cacheSize > maxCacheSize * 0.9) {
  console.warn('Cache is almost full. Consider clearing old entries.');
}
```

### console.error()

Outputs an error message, typically displayed with a red background and error icon. Also includes a stack trace in some browsers.

```javascript
console.error('Failed to fetch user data');
console.error('Database connection failed:', error);
console.error('Invalid configuration:', { expected: 'string', received: typeof value });

// Common use cases
try {
  await fetchData();
} catch (error) {
  console.error('Error fetching data:', error.message);
}

if (!config.apiKey) {
  console.error('Missing required configuration: apiKey');
}
```

### Log Level Comparison

```javascript
console.log('Regular log message');     // Default styling
console.info('Informational message');  // Info icon (browser-dependent)
console.debug('Debug message');         // May be hidden by default
console.warn('Warning message');        // Yellow/orange styling
console.error('Error message');         // Red styling with stack trace
```

**Log Level Hierarchy:**

| Level | Purpose | Visual Indicator |
|-------|---------|------------------|
| `debug` | Detailed debugging information | Often hidden by default |
| `log` | General logging | No special styling |
| `info` | Informational messages | Info icon |
| `warn` | Potential issues | Yellow/orange background |
| `error` | Errors and failures | Red background + stack trace |

## String Formatting and Substitution

The Console API supports printf-style string formatting with substitution patterns.

### Format Specifiers

```javascript
// %s - String
console.log('Hello, %s!', 'World');
// Output: Hello, World!

// %d or %i - Integer
console.log('Count: %d items', 42);
// Output: Count: 42 items

console.log('Integer: %i', 3.7);
// Output: Integer: 3

// %f - Floating-point number
console.log('Price: $%f', 19.99);
// Output: Price: $19.99

// %o - Object with optimal formatting
console.log('User: %o', { name: 'Alice', age: 30 });

// %O - Object with generic formatting
console.log('Config: %O', { debug: true, timeout: 5000 });

// %c - CSS styling (covered in next section)
console.log('%cStyled text', 'color: blue; font-size: 20px');
```

### Multiple Substitutions

```javascript
console.log('User %s logged in at %s with role %s', 'alice', '10:30 AM', 'admin');
// Output: User alice logged in at 10:30 AM with role admin

console.log('Order #%d: %d items totaling $%f', 1234, 5, 149.95);
// Output: Order #1234: 5 items totaling $149.95

// Mixed types
console.log('Product: %s, Quantity: %d, Price: $%f', 'Widget', 10, 29.99);
// Output: Product: Widget, Quantity: 10, Price: $29.99
```

### Template Literals Alternative

While format specifiers are useful, modern JavaScript template literals often provide a cleaner syntax:

```javascript
const user = 'Alice';
const action = 'logged in';
const time = '10:30 AM';

// Using format specifiers
console.log('%s %s at %s', user, action, time);

// Using template literals (often preferred)
console.log(`${user} ${action} at ${time}`);
```

## Styling Console Output

The `%c` directive allows you to apply CSS styles to console output, making messages more visually distinct.

### Basic Styling

```javascript
console.log('%cHello, styled world!', 'color: blue; font-size: 20px');

console.log(
  '%cSuccess!',
  'color: green; font-weight: bold; font-size: 16px'
);

console.log(
  '%cWarning: Check your input',
  'color: orange; background: yellow; padding: 2px 5px; border-radius: 3px'
);
```

### Multiple Styles in One Message

```javascript
console.log(
  '%cRed %cGreen %cBlue',
  'color: red',
  'color: green',
  'color: blue'
);

console.log(
  '%cNormal %cBold %cItalic',
  'font-weight: normal',
  'font-weight: bold',
  'font-style: italic'
);

// Complex styling
console.log(
  '%c INFO %c Application started',
  'background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px',
  'color: #333'
);
```

### Creating a Custom Logger

```javascript
const logger = {
  info(message) {
    console.log(
      '%c INFO %c ' + message,
      'background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      'color: #333'
    );
  },
  success(message) {
    console.log(
      '%c SUCCESS %c ' + message,
      'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      'color: #333'
    );
  },
  warning(message) {
    console.log(
      '%c WARNING %c ' + message,
      'background: #FF9800; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      'color: #333'
    );
  },
  error(message) {
    console.log(
      '%c ERROR %c ' + message,
      'background: #F44336; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      'color: #333'
    );
  }
};

logger.info('User session started');
logger.success('Data saved successfully');
logger.warning('Cache is almost full');
logger.error('Failed to connect to server');
```

### ASCII Art and Branding

```javascript
// Application branding in console
console.log(
  '%c' +
  '    __  __       ___              \n' +
  '   /  |/  |_ __ / _ \\_ _ ___     \n' +
  '  / /|_/ / // / /_\\  // . \\    \n' +
  ' /_/  /_/\\_, /\\___/_/  ___/    \n' +
  '        /___/                     ',
  'color: #6366F1; font-family: monospace; font-weight: bold'
);

// Welcome message
console.log(
  '%cWelcome to MyApp!%c\nVersion 2.1.0',
  'color: #6366F1; font-size: 24px; font-weight: bold',
  'color: #666; font-size: 12px'
);
```

## Displaying Objects and Arrays

The Console API provides specialized methods for inspecting objects and arrays.

### console.dir()

Displays an interactive list of the properties of a specified object.

```javascript
const user = {
  name: 'Alice',
  age: 30,
  address: {
    city: 'New York',
    country: 'USA'
  },
  hobbies: ['reading', 'coding', 'hiking']
};

// console.log shows the object inline
console.log('User:', user);

// console.dir shows an interactive tree view
console.dir(user);

// With options (browser-dependent)
console.dir(user, { depth: 2, colors: true });
```

### console.dirxml()

Displays an XML/HTML element representation of the specified object.

```javascript
// In a browser environment
const element = document.querySelector('#myElement');

// Shows the HTML structure
console.dirxml(element);

// Useful for inspecting DOM elements
console.dirxml(document.body);
```

### console.table()

Displays tabular data as a table, making it easier to read arrays of objects.

```javascript
const users = [
  { name: 'Alice', age: 30, role: 'Admin' },
  { name: 'Bob', age: 25, role: 'User' },
  { name: 'Charlie', age: 35, role: 'Moderator' }
];

// Display as a formatted table
console.table(users);

// Output:
// ┌─────────┬───────────┬─────┬─────────────┐
// │ (index) │   name    │ age │    role     │
// ├─────────┼───────────┼─────┼─────────────┤
// │    0    │  'Alice'  │ 30  │   'Admin'   │
// │    1    │   'Bob'   │ 25  │   'User'    │
// │    2    │ 'Charlie' │ 35  │ 'Moderator' │
// └─────────┴───────────┴─────┴─────────────┘
```

### Filtering Table Columns

```javascript
const products = [
  { id: 1, name: 'Widget', price: 29.99, stock: 100 },
  { id: 2, name: 'Gadget', price: 49.99, stock: 50 },
  { id: 3, name: 'Gizmo', price: 19.99, stock: 200 }
];

// Show only specific columns
console.table(products, ['name', 'price']);

// Output:
// ┌─────────┬──────────┬───────┐
// │ (index) │   name   │ price │
// ├─────────┼──────────┼───────┤
// │    0    │ 'Widget' │ 29.99 │
// │    1    │ 'Gadget' │ 49.99 │
// │    2    │  'Gizmo' │ 19.99 │
// └─────────┴──────────┴───────┘
```

### Objects with console.table()

```javascript
const inventory = {
  apples: { quantity: 100, price: 1.5 },
  bananas: { quantity: 150, price: 0.75 },
  oranges: { quantity: 80, price: 2.0 }
};

console.table(inventory);

// Output:
// ┌─────────┬──────────┬───────┐
// │ (index) │ quantity │ price │
// ├─────────┼──────────┼───────┤
// │ apples  │   100    │  1.5  │
// │ bananas │   150    │ 0.75  │
// │ oranges │    80    │  2.0  │
// └─────────┴──────────┴───────┘
```

## Grouping Log Messages

Group related log messages together to improve readability, especially for complex operations.

### console.group() and console.groupEnd()

```javascript
console.group('User Authentication');
console.log('Checking credentials...');
console.log('Validating token...');
console.log('Loading user profile...');
console.groupEnd();

// Output:
// ▼ User Authentication
//     Checking credentials...
//     Validating token...
//     Loading user profile...
```

### console.groupCollapsed()

Creates a group that is initially collapsed.

```javascript
console.groupCollapsed('Detailed Debug Information');
console.log('Request headers:', headers);
console.log('Request body:', body);
console.log('Response status:', status);
console.log('Response data:', data);
console.groupEnd();

// The group appears collapsed by default
// User can expand it to see the details
```

### Nested Groups

```javascript
console.group('API Request');
console.log('URL: /api/users');
console.log('Method: GET');

  console.group('Headers');
  console.log('Content-Type: application/json');
  console.log('Authorization: Bearer xxx');
  console.groupEnd();

  console.group('Response');
  console.log('Status: 200 OK');
  console.log('Data:', { users: [] });
  console.groupEnd();

console.groupEnd();

// Output:
// ▼ API Request
//     URL: /api/users
//     Method: GET
//     ▼ Headers
//         Content-Type: application/json
//         Authorization: Bearer xxx
//     ▼ Response
//         Status: 200 OK
//         Data: { users: [] }
```

### Practical Example: Request Logger

```javascript
function logRequest(request, response) {
  const statusColor = response.ok ? 'color: green' : 'color: red';

  console.groupCollapsed(
    `%c${request.method} %c${request.url} %c${response.status}`,
    'color: blue; font-weight: bold',
    'color: #333',
    statusColor
  );

  console.group('Request');
  console.log('Headers:', Object.fromEntries(request.headers));
  if (request.body) {
    console.log('Body:', request.body);
  }
  console.groupEnd();

  console.group('Response');
  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers));
  console.log('Data:', response.data);
  console.groupEnd();

  console.log('Duration:', response.duration + 'ms');
  console.groupEnd();
}
```

## Timing Operations

The Console API provides methods to measure the execution time of code blocks.

### console.time() and console.timeEnd()

```javascript
console.time('array-processing');

const largeArray = Array.from({ length: 1000000 }, (_, i) => i);
const sum = largeArray.reduce((acc, val) => acc + val, 0);

console.timeEnd('array-processing');
// Output: array-processing: 45.123ms
```

### Multiple Timers

```javascript
console.time('total');

console.time('fetch');
const response = await fetch('/api/data');
console.timeEnd('fetch');

console.time('parse');
const data = await response.json();
console.timeEnd('parse');

console.time('process');
const processed = processData(data);
console.timeEnd('process');

console.timeEnd('total');

// Output:
// fetch: 120.45ms
// parse: 5.23ms
// process: 15.67ms
// total: 141.35ms
```

### console.timeLog()

Log the current elapsed time of a timer without stopping it.

```javascript
console.time('operation');

// Step 1
performStep1();
console.timeLog('operation', 'Step 1 completed');

// Step 2
performStep2();
console.timeLog('operation', 'Step 2 completed');

// Step 3
performStep3();
console.timeEnd('operation');

// Output:
// operation: 50.12ms Step 1 completed
// operation: 120.45ms Step 2 completed
// operation: 180.78ms
```

### Performance Measurement Example

```javascript
class PerformanceLogger {
  constructor(name) {
    this.name = name;
    this.steps = [];
  }

  start() {
    console.time(this.name);
    return this;
  }

  step(label) {
    console.timeLog(this.name, label);
    return this;
  }

  end() {
    console.timeEnd(this.name);
    return this;
  }
}

// Usage
const perf = new PerformanceLogger('data-pipeline');

perf.start();
await loadData();
perf.step('Data loaded');

await transformData();
perf.step('Data transformed');

await saveData();
perf.end();
```

## Counting Occurrences

Track how many times a particular piece of code is executed.

### console.count()

```javascript
function processItem(item) {
  console.count('processItem called');
  // ... processing logic
}

processItem('a');  // processItem called: 1
processItem('b');  // processItem called: 2
processItem('c');  // processItem called: 3
```

### Labeled Counters

```javascript
function handleEvent(type) {
  console.count(type);
}

handleEvent('click');     // click: 1
handleEvent('mouseover'); // mouseover: 1
handleEvent('click');     // click: 2
handleEvent('click');     // click: 3
handleEvent('mouseover'); // mouseover: 2
```

### console.countReset()

Reset a counter to zero.

```javascript
console.count('myCounter');  // myCounter: 1
console.count('myCounter');  // myCounter: 2
console.count('myCounter');  // myCounter: 3

console.countReset('myCounter');

console.count('myCounter');  // myCounter: 1
```

### Practical Example: Event Tracking

```javascript
class EventTracker {
  constructor() {
    this.eventTypes = new Set();
  }

  track(eventType) {
    this.eventTypes.add(eventType);
    console.count(`Event: ${eventType}`);
  }

  reset(eventType) {
    if (eventType) {
      console.countReset(`Event: ${eventType}`);
    } else {
      this.eventTypes.forEach(type => {
        console.countReset(`Event: ${type}`);
      });
    }
  }

  summary() {
    console.group('Event Summary');
    this.eventTypes.forEach(type => {
      console.count(`Event: ${type}`);
      console.countReset(`Event: ${type}`);
    });
    console.groupEnd();
  }
}

const tracker = new EventTracker();
tracker.track('pageview');
tracker.track('click');
tracker.track('pageview');
tracker.track('scroll');
```

## Assertions

Test assumptions in your code and log messages only when assertions fail.

### console.assert()

```javascript
const value = 5;

// Assertion passes - no output
console.assert(value > 0, 'Value should be positive');

// Assertion fails - error message displayed
console.assert(value > 10, 'Value should be greater than 10');
// Output: Assertion failed: Value should be greater than 10
```

### Using with Objects

```javascript
const user = {
  name: 'Alice',
  age: 30,
  isActive: true
};

console.assert(user.name, 'User must have a name');
console.assert(user.age >= 18, 'User must be an adult', user);
console.assert(user.isActive, 'User should be active');

// Only failed assertions produce output
```

### Practical Validation Example

```javascript
function validateConfig(config) {
  console.assert(config, 'Config object is required');
  console.assert(config.apiKey, 'API key is required', config);
  console.assert(
    config.timeout > 0,
    'Timeout must be positive',
    { received: config.timeout }
  );
  console.assert(
    ['development', 'production', 'test'].includes(config.env),
    'Invalid environment',
    { received: config.env }
  );
}

validateConfig({
  apiKey: 'abc123',
  timeout: -1,
  env: 'staging'
});

// Output:
// Assertion failed: Timeout must be positive { received: -1 }
// Assertion failed: Invalid environment { received: 'staging' }
```

### Debugging Helper

```javascript
function assertType(value, expectedType, message) {
  console.assert(
    typeof value === expectedType,
    message || `Expected ${expectedType}, got ${typeof value}`,
    { value, expectedType, actualType: typeof value }
  );
}

function assertDefined(value, name) {
  console.assert(
    value !== undefined && value !== null,
    `${name} should be defined`,
    { value }
  );
}

// Usage
assertType(42, 'number', 'Age must be a number');
assertType('hello', 'number', 'This will fail');
assertDefined(null, 'username');
```

## Stack Traces

Display the call stack to understand the execution path that led to a particular point in your code.

### console.trace()

```javascript
function functionA() {
  functionB();
}

function functionB() {
  functionC();
}

function functionC() {
  console.trace('Trace from functionC');
}

functionA();

// Output:
// Trace from functionC
//     at functionC (script.js:10)
//     at functionB (script.js:6)
//     at functionA (script.js:2)
//     at script.js:13
```

### Debugging Event Handlers

```javascript
document.getElementById('myButton').addEventListener('click', function(e) {
  console.trace('Button clicked');
  handleClick(e);
});

function handleClick(event) {
  console.trace('handleClick called');
  processEvent(event);
}

function processEvent(event) {
  console.trace('processEvent called');
  // Processing logic
}
```

### Conditional Tracing

```javascript
function fetchData(url, options = {}) {
  if (options.debug) {
    console.trace('fetchData called with:', url);
  }

  // ... fetch logic
}

// Enable tracing for specific calls
fetchData('/api/users', { debug: true });
fetchData('/api/posts'); // No trace
```

### Error with Stack Trace

```javascript
function processOrder(order) {
  if (!order.id) {
    console.error('Invalid order - missing ID');
    console.trace('Stack trace for debugging');
    return null;
  }

  // ... processing logic
}
```

## Clearing the Console

### console.clear()

Clears the console if the environment allows it.

```javascript
console.log('This will be cleared');
console.log('So will this');

console.clear();

console.log('Fresh start!');
```

### Note on console.clear()

Some browsers may prevent `console.clear()` from working when the "Preserve log" option is enabled in developer tools. Additionally, in Node.js, `console.clear()` clears the terminal only when stdout is a TTY.

```javascript
// Conditional clearing
if (process.stdout.isTTY) {
  console.clear();
}
```

## Best Practices

### Use Appropriate Log Levels

```javascript
// Good: Using appropriate levels
console.debug('Detailed debug info');
console.info('Server started on port 3000');
console.warn('Deprecated function used');
console.error('Database connection failed');

// Bad: Using console.log for everything
console.log('Error: Database connection failed'); // Hard to filter
```

### Remove Debug Logs in Production

```javascript
// Development-only logging
const debug = process.env.NODE_ENV !== 'production'
  ? console.log.bind(console)
  : () => {};

debug('This only logs in development');

// Or use a wrapper
const logger = {
  debug(...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...args);
    }
  },
  info(...args) {
    console.info(...args);
  },
  warn(...args) {
    console.warn(...args);
  },
  error(...args) {
    console.error(...args);
  }
};
```

### Use Descriptive Labels

```javascript
// Good: Clear, descriptive labels
console.time('database-query-users');
console.group('API Response Processing');
console.count('retry-attempts');

// Bad: Vague or no labels
console.time('timer1');
console.group('stuff');
console.count();
```

### Leverage console.table() for Data

```javascript
// Good: Easy to read
console.table(users);

// Less readable for arrays of objects
console.log(users);
```

### Group Related Logs

```javascript
// Good: Organized and collapsible
console.groupCollapsed('User Authentication Flow');
console.log('Step 1: Validate credentials');
console.log('Step 2: Generate token');
console.log('Step 3: Set session');
console.groupEnd();

// Bad: Scattered logs
console.log('Step 1: Validate credentials');
console.log('Step 2: Generate token');
console.log('Step 3: Set session');
```

### Use Assertions for Invariants

```javascript
// Good: Self-documenting expectations
console.assert(array.length > 0, 'Array should not be empty');
console.assert(user.isAuthenticated, 'User must be authenticated');

// Instead of
if (array.length === 0) {
  console.error('Array should not be empty');
}
```

### Create Utility Functions

```javascript
const devTools = {
  // Measure and log function execution time
  measure(label, fn) {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
  },

  // Async version
  async measureAsync(label, fn) {
    console.time(label);
    const result = await fn();
    console.timeEnd(label);
    return result;
  },

  // Log object with label
  inspect(label, obj) {
    console.group(label);
    console.dir(obj, { depth: null });
    console.groupEnd();
  }
};

// Usage
const result = devTools.measure('calculation', () => {
  return heavyCalculation();
});

await devTools.measureAsync('api-call', async () => {
  return fetch('/api/data');
});

devTools.inspect('User Object', user);
```

## Summary

### Quick Reference

| Method | Purpose |
|--------|---------|
| `console.log()` | General-purpose logging |
| `console.info()` | Informational messages |
| `console.debug()` | Detailed debug information |
| `console.warn()` | Warning messages |
| `console.error()` | Error messages with stack trace |
| `console.table()` | Display data as a table |
| `console.dir()` | Display object properties |
| `console.group()` | Create collapsible groups |
| `console.time()` | Start a timer |
| `console.count()` | Count occurrences |
| `console.assert()` | Conditional logging |
| `console.trace()` | Display stack trace |
| `console.clear()` | Clear the console |

### Key Takeaways

1. **Use log levels appropriately** - `debug`, `info`, `warn`, `error` help categorize and filter messages
2. **Format output for readability** - Use `console.table()` for arrays and `console.group()` for related messages
3. **Measure performance** - Use `console.time()` and `console.timeEnd()` to identify bottlenecks
4. **Validate assumptions** - Use `console.assert()` to catch unexpected states early
5. **Debug effectively** - Use `console.trace()` to understand execution flow
6. **Clean up for production** - Remove or conditionally disable debug logging in production builds
7. **Style for visibility** - Use `%c` formatting to make important messages stand out

The Console API is an essential tool for JavaScript developers. Mastering these methods will significantly improve your debugging efficiency and help you write more maintainable code.
