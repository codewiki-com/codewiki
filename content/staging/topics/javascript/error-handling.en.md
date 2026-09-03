---
title: Error Handling
description: Complete guide to JavaScript error handling, try-catch, custom errors and error boundaries
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Error Handling
  - Exceptions
  - Debugging
status: imported
origin: old/src/content/docs/javascript/error-handling.en.md
divergence: 0.213
issues: []
legacy:
  category: JavaScript
  subcategory: Core Concepts
  order: 13
  lastUpdated: 2026-01-07
---

Error handling is a critical aspect of writing robust JavaScript applications. Proper error handling ensures your application can gracefully recover from unexpected situations, provide meaningful feedback to users, and help developers debug issues effectively.

## Understanding JavaScript Errors

JavaScript errors are objects that represent something going wrong during code execution. When an error occurs, JavaScript creates an Error object containing information about what went wrong.

### The Error Object

Every error in JavaScript has three main properties:

```javascript
try {
  throw new Error("Something went wrong");
} catch (error) {
  console.log(error.name);    // "Error"
  console.log(error.message); // "Something went wrong"
  console.log(error.stack);   // Stack trace showing where the error occurred
}
```

The `stack` property is particularly useful for debugging as it shows the call stack at the point where the error was created.

## Built-in Error Types

JavaScript provides several built-in error types, each representing a specific category of error:

### SyntaxError

Occurs when the JavaScript engine encounters code that doesn't conform to the language syntax:

```javascript
// SyntaxError examples:
// - Missing brackets or parentheses
// - Invalid JSON: JSON.parse("{invalid json");
// - Typos in keywords
```

### ReferenceError

Thrown when referencing a variable that doesn't exist:

```javascript
try {
  console.log(undefinedVariable);
} catch (error) {
  console.log(error.name); // "ReferenceError"
  console.log(error.message); // "undefinedVariable is not defined"
}
```

### TypeError

Occurs when a value is not of the expected type:

```javascript
try {
  null.toString();
} catch (error) {
  console.log(error.name); // "TypeError"
  console.log(error.message); // "Cannot read properties of null"
}

try {
  const notAFunction = 42;
  notAFunction();
} catch (error) {
  console.log(error.name); // "TypeError"
  console.log(error.message); // "notAFunction is not a function"
}
```

### RangeError

Thrown when a value is outside the allowable range:

```javascript
try {
  const arr = new Array(-1);
} catch (error) {
  console.log(error.name); // "RangeError"
  console.log(error.message); // "Invalid array length"
}

try {
  const num = 1;
  num.toFixed(101); // Maximum is 100
} catch (error) {
  console.log(error.name); // "RangeError"
}
```

### URIError

Occurs when global URI handling functions are misused:

```javascript
try {
  decodeURIComponent("%");
} catch (error) {
  console.log(error.name); // "URIError"
  console.log(error.message); // "URI malformed"
}
```

### EvalError

Historically related to code evaluation functions. Rarely encountered in modern JavaScript but still exists for backward compatibility.

### AggregateError

Represents multiple errors wrapped in a single error, commonly used with `Promise.any()`:

```javascript
try {
  throw new AggregateError(
    [new Error("First error"), new Error("Second error")],
    "Multiple errors occurred"
  );
} catch (error) {
  console.log(error.name); // "AggregateError"
  console.log(error.message); // "Multiple errors occurred"
  console.log(error.errors); // [Error: First error, Error: Second error]
}
```

## Try-Catch-Finally

The `try-catch-finally` statement is the primary mechanism for handling errors in JavaScript.

### Basic Syntax

```javascript
try {
  // Code that might throw an error
  const result = riskyOperation();
  console.log(result);
} catch (error) {
  // Handle the error
  console.error("An error occurred:", error.message);
} finally {
  // Always executes, regardless of error
  console.log("Cleanup complete");
}
```

### The try Block

The `try` block contains code that might throw an error. If an error occurs, execution immediately jumps to the `catch` block:

```javascript
try {
  console.log("Step 1"); // Executes
  throw new Error("Oops!");
  console.log("Step 2"); // Never executes
} catch (error) {
  console.log("Caught:", error.message);
}
// Output:
// Step 1
// Caught: Oops!
```

### The catch Block

The `catch` block receives the error object and handles the error:

```javascript
try {
  JSON.parse("invalid json");
} catch (error) {
  // Check error type for specific handling
  if (error instanceof SyntaxError) {
    console.log("Invalid JSON format");
  } else {
    console.log("Unknown error:", error.message);
  }
}
```

You can also use catch without the error parameter if you don't need it:

```javascript
try {
  riskyOperation();
} catch {
  console.log("An error occurred");
}
```

### The finally Block

The `finally` block always executes, whether an error occurred or not. It's ideal for cleanup operations:

```javascript
function readFile(filename) {
  let fileHandle = null;
  try {
    fileHandle = openFile(filename);
    return processFile(fileHandle);
  } catch (error) {
    console.error("Error processing file:", error.message);
    return null;
  } finally {
    // Always close the file, even if an error occurred
    if (fileHandle) {
      closeFile(fileHandle);
    }
  }
}
```

Important: `finally` executes even when `return` is used in `try` or `catch`:

```javascript
function example() {
  try {
    return "from try";
  } finally {
    console.log("finally runs"); // This still executes
  }
}

console.log(example());
// Output:
// finally runs
// from try
```

### Nested Try-Catch

You can nest try-catch blocks for granular error handling:

```javascript
try {
  try {
    throw new Error("Inner error");
  } catch (innerError) {
    console.log("Inner catch:", innerError.message);
    throw new Error("Re-thrown error");
  }
} catch (outerError) {
  console.log("Outer catch:", outerError.message);
}
// Output:
// Inner catch: Inner error
// Outer catch: Re-thrown error
```

## Throwing Errors

You can throw errors explicitly using the `throw` statement.

### Throwing Built-in Errors

```javascript
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return a / b;
}

function validateAge(age) {
  if (typeof age !== "number") {
    throw new TypeError("Age must be a number");
  }
  if (age < 0 || age > 150) {
    throw new RangeError("Age must be between 0 and 150");
  }
  return true;
}
```

### Throwing Custom Values

While you can throw any value, it's best practice to throw Error objects:

```javascript
// Works, but not recommended
throw "Something went wrong";
throw 404;
throw { error: true, message: "Failed" };

// Recommended - throw Error objects
throw new Error("Something went wrong");
```

Error objects provide stack traces and consistent structure, making debugging much easier.

## Creating Custom Errors

Custom error classes allow you to create domain-specific errors with additional properties and behavior.

### Basic Custom Error

```javascript
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class DatabaseError extends Error {
  constructor(message, query) {
    super(message);
    this.name = "DatabaseError";
    this.query = query;
  }
}

// Usage
try {
  throw new ValidationError("Email format is invalid");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed:", error.message);
  }
}
```

### Rich Custom Errors

Create more detailed custom errors with additional context:

```javascript
class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

class NotFoundError extends HttpError {
  constructor(resource, id) {
    super(404, `${resource} with id ${id} not found`);
    this.name = "NotFoundError";
    this.resource = resource;
    this.resourceId = id;
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

// Usage
try {
  throw new NotFoundError("User", 123);
} catch (error) {
  if (error instanceof HttpError) {
    console.log(JSON.stringify(error.toJSON(), null, 2));
  }
}
```

### Error Hierarchy

Build a hierarchy of errors for organized error handling:

```javascript
// Base application error
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// Category-specific errors
class NetworkError extends AppError {
  constructor(message, statusCode) {
    super(message, "NETWORK_ERROR");
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(field, message) {
    super(message, "VALIDATION_ERROR");
    this.field = field;
  }
}

class BusinessLogicError extends AppError {
  constructor(message, rule) {
    super(message, "BUSINESS_LOGIC_ERROR");
    this.rule = rule;
  }
}

// Specific validation errors
class RequiredFieldError extends ValidationError {
  constructor(field) {
    super(field, `${field} is required`);
  }
}

class InvalidFormatError extends ValidationError {
  constructor(field, expectedFormat) {
    super(field, `${field} has invalid format. Expected: ${expectedFormat}`);
    this.expectedFormat = expectedFormat;
  }
}
```

## Async Error Handling

Handling errors in asynchronous code requires special attention.

### Callbacks (Legacy Pattern)

The error-first callback pattern was the traditional way to handle async errors:

```javascript
function fetchData(callback) {
  setTimeout(() => {
    const error = Math.random() > 0.5 ? new Error("Fetch failed") : null;
    const data = error ? null : { id: 1, name: "Example" };
    callback(error, data);
  }, 1000);
}

fetchData((error, data) => {
  if (error) {
    console.error("Error:", error.message);
    return;
  }
  console.log("Data:", data);
});
```

### Promises

Promises use `.catch()` for error handling:

```javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    if (!id) {
      reject(new Error("User ID is required"));
      return;
    }
    // Simulate API call
    setTimeout(() => {
      if (id === 999) {
        reject(new Error("User not found"));
      } else {
        resolve({ id, name: "John Doe" });
      }
    }, 1000);
  });
}

// Using .catch()
fetchUser(1)
  .then((user) => console.log("User:", user))
  .catch((error) => console.error("Error:", error.message));

// Chaining with error handling
fetchUser(1)
  .then((user) => {
    console.log("Found user:", user.name);
    return fetchUserPosts(user.id);
  })
  .then((posts) => {
    console.log("Posts:", posts);
  })
  .catch((error) => {
    // Catches errors from any point in the chain
    console.error("Error:", error.message);
  })
  .finally(() => {
    console.log("Operation complete");
  });
```

### Async/Await

Async/await allows using try-catch with asynchronous code:

```javascript
async function getUserData(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchUserPosts(user.id);
    const comments = await fetchPostComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    console.error("Failed to fetch user data:", error.message);
    throw error; // Re-throw if caller should handle it
  }
}

// Handling specific async errors
async function processOrder(orderId) {
  try {
    const order = await fetchOrder(orderId);
    const payment = await processPayment(order);
    const shipment = await createShipment(order);
    return { order, payment, shipment };
  } catch (error) {
    if (error instanceof PaymentError) {
      await refundOrder(orderId);
      throw new Error("Payment failed, order refunded");
    }
    if (error instanceof ShippingError) {
      await cancelPayment(orderId);
      throw new Error("Shipping unavailable, payment cancelled");
    }
    throw error;
  }
}
```

### Parallel Async Operations

Handle errors in parallel operations:

```javascript
// Promise.all - fails fast on first error
async function fetchAllUsers(ids) {
  try {
    const users = await Promise.all(ids.map((id) => fetchUser(id)));
    return users;
  } catch (error) {
    console.error("At least one fetch failed:", error.message);
    throw error;
  }
}

// Promise.allSettled - get all results, including failures
async function fetchAllUsersSafe(ids) {
  const results = await Promise.allSettled(ids.map((id) => fetchUser(id)));

  const successful = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason);

  if (failed.length > 0) {
    console.warn(`${failed.length} requests failed`);
  }

  return { successful, failed };
}

// Promise.any - succeed if at least one succeeds
async function fetchFromAnyMirror(mirrors) {
  try {
    const data = await Promise.any(mirrors.map((url) => fetch(url)));
    return data;
  } catch (error) {
    // AggregateError - all promises rejected
    console.error("All mirrors failed:", error.errors);
    throw error;
  }
}
```

### Unhandled Promise Rejections

Always handle promise rejections. Unhandled rejections can crash Node.js applications:

```javascript
// Bad - unhandled rejection
fetchUser(1).then((user) => {
  throw new Error("Processing failed");
});

// Good - always add .catch()
fetchUser(1)
  .then((user) => {
    throw new Error("Processing failed");
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });

// Global handler for unhandled rejections (Node.js)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Global handler for browsers
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  event.preventDefault(); // Prevent default logging
});
```

## Error Boundaries

Error boundaries are a concept primarily used in React applications to catch JavaScript errors in component trees.

### React Error Boundaries

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to reporting service
    console.error("Error caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Send to error tracking service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

### Functional Error Boundaries with Hooks

Using libraries like react-error-boundary:

```javascript
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function ComponentThatMayError() {
  const { showBoundary } = useErrorBoundary();

  async function handleClick() {
    try {
      await riskyAsyncOperation();
    } catch (error) {
      showBoundary(error);
    }
  }

  return <button onClick={handleClick}>Do risky thing</button>;
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset application state
      }}
      onError={(error, info) => {
        // Log to error reporting service
        logError(error, info);
      }}
    >
      <ComponentThatMayError />
    </ErrorBoundary>
  );
}
```

## Global Error Handling

Implement global error handlers as a safety net.

### Browser Global Handlers

```javascript
// Catch all unhandled errors
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error:", {
    message,
    source,
    line: lineno,
    column: colno,
    error,
  });

  // Send to error tracking service
  trackError({
    type: "unhandled",
    message,
    source,
    line: lineno,
    column: colno,
    stack: error?.stack,
  });

  // Return true to prevent default browser error handling
  return true;
};

// Catch unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);

  trackError({
    type: "unhandledRejection",
    reason: event.reason,
    stack: event.reason?.stack,
  });
});

// Catch resource loading errors
window.addEventListener(
  "error",
  (event) => {
    if (event.target !== window) {
      console.error("Resource failed to load:", event.target.src || event.target.href);
    }
  },
  true
);
```

### Node.js Global Handlers

```javascript
// Uncaught exceptions
process.on("uncaughtException", (error, origin) => {
  console.error("Uncaught Exception:", error);
  console.error("Origin:", origin);

  // Log the error
  logError(error);

  // Exit gracefully
  process.exit(1);
});

// Unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);

  // Log the error
  logError(reason);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
```

## Best Practices

### Be Specific with Error Types

```javascript
// Bad - generic error
throw new Error("Failed");

// Good - specific error with context
throw new ValidationError("email", "Invalid email format: missing @ symbol");
```

### Include Helpful Context

```javascript
// Bad
throw new Error("Database error");

// Good
throw new DatabaseError(`Failed to insert user: duplicate email '${email}'`, {
  operation: "insert",
  table: "users",
  constraint: "unique_email",
});
```

### Handle Errors at the Right Level

```javascript
// Handle at the level where you can do something meaningful
async function createUser(userData) {
  // Low-level function throws, doesn't catch
  const user = await database.insert("users", userData);
  return user;
}

async function handleUserRegistration(req, res) {
  try {
    const user = await createUser(req.body);
    res.json({ success: true, user });
  } catch (error) {
    // High-level function catches and handles
    if (error.constraint === "unique_email") {
      res.status(400).json({ error: "Email already registered" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
}
```

### Don't Swallow Errors

```javascript
// Bad - error is silently ignored
try {
  riskyOperation();
} catch (error) {
  // Nothing here
}

// Good - at minimum, log the error
try {
  riskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  // Decide: re-throw, return default, or handle
}
```

### Use Error Codes for Programmatic Handling

```javascript
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const ErrorCodes = {
  VALIDATION_FAILED: "E001",
  NOT_FOUND: "E002",
  UNAUTHORIZED: "E003",
  RATE_LIMITED: "E004",
};

throw new AppError("Invalid input", ErrorCodes.VALIDATION_FAILED);

// Handling
switch (error.code) {
  case ErrorCodes.VALIDATION_FAILED:
    // Handle validation error
    break;
  case ErrorCodes.NOT_FOUND:
    // Handle not found
    break;
}
```

### Clean Up Resources in Finally

```javascript
async function processFile(path) {
  let handle = null;
  try {
    handle = await fs.open(path, "r");
    const content = await handle.readFile("utf8");
    return processContent(content);
  } catch (error) {
    console.error("Failed to process file:", error);
    throw error;
  } finally {
    // Always close the file handle
    if (handle) {
      await handle.close();
    }
  }
}
```

### Validate Early

```javascript
function processOrder(order) {
  // Validate at the beginning
  if (!order) {
    throw new ValidationError("Order is required");
  }
  if (!order.items || order.items.length === 0) {
    throw new ValidationError("Order must have at least one item");
  }
  if (!order.customerId) {
    throw new ValidationError("Customer ID is required");
  }

  // Now safe to process
  return calculateTotal(order);
}
```

### Create Utility Functions for Common Patterns

```javascript
// Retry utility for transient failures
async function withRetry(fn, maxAttempts = 3, delay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

// Usage
const data = await withRetry(() => fetchFromAPI(url), 3, 1000);

// Safe JSON parse utility
function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
```

## Error Logging and Monitoring

Implement proper error logging for production applications:

```javascript
class ErrorLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || "app";
    this.environment = options.environment || "development";
    this.endpoint = options.endpoint;
  }

  log(error, context = {}) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      environment: this.environment,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      context: {
        ...context,
        url: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    };

    // Log locally
    console.error("Error Report:", errorReport);

    // Send to remote service
    if (this.endpoint) {
      this.sendToRemote(errorReport);
    }

    return errorReport;
  }

  async sendToRemote(report) {
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
    } catch (sendError) {
      console.error("Failed to send error report:", sendError);
    }
  }
}

// Usage
const logger = new ErrorLogger({
  serviceName: "my-app",
  environment: process.env.NODE_ENV,
  endpoint: "https://errors.example.com/api/report",
});

try {
  riskyOperation();
} catch (error) {
  logger.log(error, { userId: currentUser.id, action: "riskyOperation" });
}
```

## Summary

Effective error handling in JavaScript involves:

1. **Understanding error types**: Know the built-in error types and when they occur
2. **Using try-catch-finally**: Properly structure error handling blocks
3. **Creating custom errors**: Build domain-specific error classes for clarity
4. **Handling async errors**: Use appropriate patterns for promises and async/await
5. **Implementing error boundaries**: Contain errors in component-based applications
6. **Setting up global handlers**: Catch unhandled errors as a safety net
7. **Following best practices**: Write maintainable, debuggable error handling code
8. **Logging and monitoring**: Track errors in production for continuous improvement

Remember that good error handling is not just about catching errors, but about providing clear feedback, maintaining application stability, and enabling efficient debugging. Always consider both the developer experience (clear stack traces, meaningful messages) and the user experience (graceful degradation, helpful error messages) when implementing error handling strategies.
