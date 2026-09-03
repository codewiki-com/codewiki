---
title: JavaScript Promises Deep Dive
description: "Deep dive into Promises: states, chaining, error handling and composition methods"
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - Promise
  - Async
  - Concurrency
status: imported
origin: old/src/content/docs/javascript/promises.en.md
divergence: 0.067
issues: []
legacy:
  category: JavaScript
  subcategory: Async Programming
  order: 5
  lastUpdated: 2026-01-07
---

Promises are one of the most important features in modern JavaScript, providing a cleaner and more powerful way to handle asynchronous operations compared to traditional callback patterns. We'll cover Promises in depth, including their states, methods, composition patterns, and best practices.

## What is a Promise?

A Promise is an object representing the eventual completion or failure of an asynchronous operation. It acts as a placeholder for a value that may not be available yet but will be resolved at some point in the future.

```javascript
const promise = new Promise((resolve, reject) => {
  // Asynchronous operation
  setTimeout(() => {
    resolve("Operation completed successfully");
  }, 1000);
});

promise.then(result => {
  console.log(result); // "Operation completed successfully"
});
```

## Promise States

A Promise can be in one of three states:

### Pending

The initial state - the operation has not completed yet.

```javascript
const pendingPromise = new Promise((resolve, reject) => {
  // Operation is ongoing
});

console.log(pendingPromise); // Promise { <pending> }
```

### Fulfilled (Resolved)

The operation completed successfully, and the promise has a resulting value.

```javascript
const fulfilledPromise = new Promise((resolve, reject) => {
  resolve("Success!");
});

console.log(fulfilledPromise); // Promise { 'Success!' }
```

### Rejected

The operation failed, and the promise has a reason for the failure.

```javascript
const rejectedPromise = new Promise((resolve, reject) => {
  reject(new Error("Something went wrong"));
});

console.log(rejectedPromise); // Promise { <rejected> Error: Something went wrong }
```

**Important**: Once a Promise transitions from pending to either fulfilled or rejected, it becomes **settled** and its state cannot change.

## Core Promise Methods

### then()

The `then()` method is used to handle both successful resolution and rejection of a Promise. It takes up to two arguments: callback functions for the fulfilled and rejected cases.

```javascript
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = Math.random() > 0.5;
      if (success) {
        resolve({ data: "User information", id: 123 });
      } else {
        reject(new Error("Failed to fetch data"));
      }
    }, 1000);
  });
};

fetchData()
  .then(
    result => {
      console.log("Success:", result);
      return result.id;
    },
    error => {
      console.error("Error:", error.message);
    }
  );
```

### catch()

The `catch()` method is specifically designed for handling rejections. It's more readable than using the second argument of `then()`.

```javascript
fetchData()
  .then(result => {
    console.log("Data received:", result);
    return result.id;
  })
  .catch(error => {
    console.error("Error occurred:", error.message);
  });
```

### finally()

The `finally()` method executes regardless of whether the Promise was fulfilled or rejected. It's perfect for cleanup operations.

```javascript
let isLoading = true;

fetchData()
  .then(result => {
    console.log("Success:", result);
  })
  .catch(error => {
    console.error("Error:", error.message);
  })
  .finally(() => {
    isLoading = false;
    console.log("Operation completed, loading state cleared");
  });
```

## Promise Chaining

One of the most powerful features of Promises is the ability to chain them together. Each `then()` returns a new Promise, allowing for sequential asynchronous operations.

```javascript
const getUserData = (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ userId, name: "John Doe" });
    }, 500);
  });
};

const getUserPosts = (user) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user,
        posts: ["Post 1", "Post 2", "Post 3"]
      });
    }, 500);
  });
};

const getPostComments = (posts) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        posts: posts.posts,
        comments: ["Comment 1", "Comment 2"]
      });
    }, 500);
  });
};

// Chaining example
getUserData(1)
  .then(user => {
    console.log("User fetched:", user);
    return getUserPosts(user);
  })
  .then(data => {
    console.log("Posts fetched:", data.posts);
    return getPostComments(data);
  })
  .then(data => {
    console.log("Comments fetched:", data.comments);
  })
  .catch(error => {
    console.error("Error in chain:", error);
  });
```

### Important Chaining Rules

1. Always return a value or Promise from `then()` callbacks
2. Errors propagate down the chain until caught
3. Returning a non-Promise value wraps it in a resolved Promise

```javascript
Promise.resolve(5)
  .then(value => {
    console.log(value); // 5
    return value * 2;
  })
  .then(value => {
    console.log(value); // 10
    return Promise.resolve(value + 3);
  })
  .then(value => {
    console.log(value); // 13
  });
```

## Error Handling

Proper error handling is crucial when working with Promises. Errors can occur in multiple places in a Promise chain.

### Catching Errors

```javascript
const riskyOperation = () => {
  return new Promise((resolve, reject) => {
    const random = Math.random();
    if (random > 0.7) {
      resolve("Success!");
    } else {
      reject(new Error("Operation failed"));
    }
  });
};

riskyOperation()
  .then(result => {
    console.log(result);
    // This might throw an error
    return JSON.parse("invalid json");
  })
  .catch(error => {
    // Catches both rejection and thrown errors
    console.error("Caught error:", error.message);
  });
```

### Error Recovery

You can recover from errors in a chain by returning a value from a `catch()` block.

```javascript
const fetchWithFallback = () => {
  return riskyOperation()
    .catch(error => {
      console.log("Primary operation failed, using fallback");
      return "Fallback value";
    })
    .then(result => {
      console.log("Result:", result); // Either success or fallback
    });
};

fetchWithFallback();
```

### Re-throwing Errors

Sometimes you want to handle an error partially and then propagate it.

```javascript
riskyOperation()
  .catch(error => {
    console.error("Logging error:", error.message);
    throw error; // Re-throw to propagate
  })
  .then(result => {
    console.log("This won't execute if error was thrown");
  })
  .catch(error => {
    console.error("Final error handler:", error.message);
  });
```

## Promise Composition Methods

JavaScript provides several static methods on the Promise constructor for working with multiple Promises concurrently.

### Promise.all()

Waits for all Promises to fulfill or any to reject. Returns an array of results in the same order as the input Promises.

```javascript
const promise1 = Promise.resolve(3);
const promise2 = new Promise(resolve => setTimeout(() => resolve(42), 1000));
const promise3 = Promise.resolve("foo");

Promise.all([promise1, promise2, promise3])
  .then(values => {
    console.log(values); // [3, 42, "foo"]
  })
  .catch(error => {
    console.error("One or more promises failed:", error);
  });
```

**Use case**: When you need all operations to succeed (e.g., loading multiple required resources).

```javascript
const fetchUser = () => Promise.resolve({ name: "Alice" });
const fetchSettings = () => Promise.resolve({ theme: "dark" });
const fetchNotifications = () => Promise.resolve([1, 2, 3]);

Promise.all([
  fetchUser(),
  fetchSettings(),
  fetchNotifications()
])
  .then(([user, settings, notifications]) => {
    console.log("User:", user);
    console.log("Settings:", settings);
    console.log("Notifications:", notifications);
  })
  .catch(error => {
    console.error("Failed to load data:", error);
  });
```

**Important**: `Promise.all()` fails fast - if any Promise rejects, the entire operation rejects immediately.

### Promise.race()

Returns a Promise that settles as soon as any of the input Promises settles (fulfills or rejects).

```javascript
const slow = new Promise(resolve => setTimeout(() => resolve("slow"), 2000));
const fast = new Promise(resolve => setTimeout(() => resolve("fast"), 500));

Promise.race([slow, fast])
  .then(result => {
    console.log(result); // "fast"
  });
```

**Use case**: Implementing timeouts.

```javascript
const fetchWithTimeout = (url, timeout = 5000) => {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
};

fetchWithTimeout("https://api.example.com/data", 3000)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error.message));
```

### Promise.allSettled()

Waits for all Promises to settle (fulfill or reject) and returns an array of objects describing the outcome of each Promise.

```javascript
const promises = [
  Promise.resolve(42),
  Promise.reject(new Error("Failed")),
  Promise.resolve("Success")
];

Promise.allSettled(promises)
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`Promise ${index} fulfilled with:`, result.value);
      } else {
        console.log(`Promise ${index} rejected with:`, result.reason.message);
      }
    });
  });

// Output:
// Promise 0 fulfilled with: 42
// Promise 1 rejected with: Failed
// Promise 2 fulfilled with: Success
```

**Use case**: When you want to execute multiple independent operations and handle each result individually.

```javascript
const saveMultipleRecords = (records) => {
  const savePromises = records.map(record => {
    return saveToDatabase(record)
      .then(() => ({ record, success: true }))
      .catch(error => ({ record, success: false, error: error.message }));
  });

  return Promise.allSettled(savePromises)
    .then(results => {
      const successes = results.filter(r => r.status === "fulfilled" && r.value.success);
      const failures = results.filter(r => r.status === "fulfilled" && !r.value.success);

      return {
        total: records.length,
        succeeded: successes.length,
        failed: failures.length,
        failures: failures.map(f => f.value)
      };
    });
};
```

### Promise.any()

Returns a Promise that fulfills as soon as any of the input Promises fulfills. If all Promises reject, it rejects with an AggregateError.

```javascript
const promise1 = Promise.reject(new Error("Error 1"));
const promise2 = new Promise(resolve => setTimeout(() => resolve("Success 2"), 1000));
const promise3 = new Promise(resolve => setTimeout(() => resolve("Success 3"), 2000));

Promise.any([promise1, promise2, promise3])
  .then(result => {
    console.log("First success:", result); // "Success 2"
  })
  .catch(error => {
    console.error("All promises rejected:", error);
  });
```

**Use case**: Trying multiple fallback options (e.g., fetching from multiple mirrors).

```javascript
const fetchFromMultipleSources = (resourceId) => {
  const sources = [
    fetch(`https://cdn1.example.com/${resourceId}`),
    fetch(`https://cdn2.example.com/${resourceId}`),
    fetch(`https://cdn3.example.com/${resourceId}`)
  ];

  return Promise.any(sources)
    .then(response => response.json())
    .catch(error => {
      throw new Error("All sources failed");
    });
};

fetchFromMultipleSources("image.jpg")
  .then(data => console.log("Resource loaded:", data))
  .catch(error => console.error(error.message));
```

## Comparison of Composition Methods

| Method | Fulfills When | Rejects When | Use Case |
|--------|---------------|--------------|----------|
| `Promise.all()` | All promises fulfill | Any promise rejects | All operations must succeed |
| `Promise.race()` | First promise settles | First promise rejects | Need the fastest result |
| `Promise.allSettled()` | All promises settle | Never (always fulfills) | Want all results regardless of success/failure |
| `Promise.any()` | First promise fulfills | All promises reject | Need at least one success |

## Advanced Patterns

### Sequential Execution

Sometimes you need to execute Promises one after another, where each depends on the previous result.

```javascript
const tasks = [
  () => Promise.resolve(1),
  (prev) => Promise.resolve(prev + 1),
  (prev) => Promise.resolve(prev * 2),
  (prev) => Promise.resolve(prev - 3)
];

const runSequentially = (tasks) => {
  return tasks.reduce((promiseChain, currentTask) => {
    return promiseChain.then(currentTask);
  }, Promise.resolve());
};

runSequentially(tasks)
  .then(result => {
    console.log("Final result:", result); // ((1 + 1) * 2) - 3 = 1
  });
```

### Parallel with Limit

Execute Promises in parallel but limit the number of concurrent operations.

```javascript
const parallelLimit = async (tasks, limit) => {
  const results = [];
  const executing = [];

  for (const [index, task] of tasks.entries()) {
    const promise = Promise.resolve().then(() => task()).then(result => {
      results[index] = result;
    });

    results.push(promise);

    if (limit <= tasks.length) {
      const execute = promise.then(() => {
        executing.splice(executing.indexOf(execute), 1);
      });
      executing.push(execute);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  await Promise.all(results);
  return results;
};

// Example usage
const tasks = Array.from({ length: 10 }, (_, i) => {
  return () => new Promise(resolve => {
    setTimeout(() => {
      console.log(`Task ${i} completed`);
      resolve(i);
    }, Math.random() * 1000);
  });
});

parallelLimit(tasks, 3)
  .then(results => {
    console.log("All tasks completed:", results);
  });
```

### Retry Logic

Implement retry logic for failed operations.

```javascript
const retryWithDelay = (fn, retries = 3, delay = 1000) => {
  return fn().catch(error => {
    if (retries === 0) {
      throw error;
    }

    console.log(`Retrying... (${retries} attempts left)`);

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(retryWithDelay(fn, retries - 1, delay));
      }, delay);
    });
  });
};

// Usage
const unstableOperation = () => {
  return new Promise((resolve, reject) => {
    const random = Math.random();
    if (random > 0.7) {
      resolve("Success!");
    } else {
      reject(new Error("Failed"));
    }
  });
};

retryWithDelay(unstableOperation, 3, 500)
  .then(result => console.log(result))
  .catch(error => console.error("All retries failed:", error.message));
```

## Common Pitfalls and Best Practices

### Pitfall 1: Forgetting to Return in Chains

```javascript
// Wrong - the chain breaks
Promise.resolve(1)
  .then(value => {
    Promise.resolve(value * 2); // Forgot to return!
  })
  .then(value => {
    console.log(value); // undefined
  });

// Correct
Promise.resolve(1)
  .then(value => {
    return Promise.resolve(value * 2);
  })
  .then(value => {
    console.log(value); // 2
  });
```

### Pitfall 2: Nested Promises Instead of Chaining

```javascript
// Wrong - callback hell with Promises
fetchUser()
  .then(user => {
    fetchPosts(user)
      .then(posts => {
        fetchComments(posts)
          .then(comments => {
            console.log(comments);
          });
      });
  });

// Correct - flat chain
fetchUser()
  .then(user => fetchPosts(user))
  .then(posts => fetchComments(posts))
  .then(comments => console.log(comments));
```

### Pitfall 3: Not Handling Errors

```javascript
// Wrong - unhandled rejection
fetchData()
  .then(data => {
    console.log(data);
  });
// If this rejects, you get an unhandled promise rejection

// Correct
fetchData()
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error("Error:", error);
  });
```

### Best Practice: Always Add catch() or finally()

Every Promise chain should have error handling at the end.

```javascript
asyncOperation()
  .then(processResult)
  .then(saveResult)
  .catch(handleError)
  .finally(cleanup);
```

### Best Practice: Use Promise.resolve() for Static Values

When you need to return a Promise in some branches but have static values in others:

```javascript
const getData = (useCache) => {
  if (useCache) {
    return Promise.resolve(cachedData);
  }
  return fetchFreshData();
};
```

## Converting Callbacks to Promises

If you're working with older callback-based APIs, you can wrap them in Promises.

```javascript
const fs = require('fs');

// Old callback style
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

// Promisified version
const readFilePromise = (path, encoding) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Usage
readFilePromise('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

Node.js provides `util.promisify()` for this purpose:

```javascript
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

readFile('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

## Conclusion

JavaScript Promises are a fundamental tool for managing asynchronous operations. Understanding their states, methods, and composition patterns is essential for writing clean, maintainable asynchronous code. Key takeaways:

- Promises have three states: pending, fulfilled, and rejected
- Use `then()`, `catch()`, and `finally()` for handling Promise results
- Chain Promises for sequential operations
- Use `Promise.all()`, `Promise.race()`, `Promise.allSettled()`, and `Promise.any()` for concurrent operations
- Always handle errors and avoid common pitfalls
- Combine Promises with `async/await` for even more readable code

As you become more comfortable with Promises, consider exploring `async/await` syntax, which provides syntactic sugar on top of Promises for an even more synchronous-looking asynchronous code style.
