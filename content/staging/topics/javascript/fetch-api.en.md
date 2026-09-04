---
title: Fetch API
description: Complete guide to JavaScript Fetch API, HTTP requests, response handling and error handling
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Fetch
  - HTTP
  - API
status: imported
origin: old/src/content/docs/javascript/fetch-api.en.md
divergence: 0.225
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 16
  lastUpdated: 2026-01-07
---

The Fetch API is a modern JavaScript interface for making HTTP requests. It provides a more powerful and flexible alternative to XMLHttpRequest, using Promises to handle asynchronous operations in a cleaner, more readable way.

## Introduction to Fetch

The Fetch API is built into modern browsers and provides a global `fetch()` function for making network requests. It returns a Promise that resolves to the Response object representing the response to the request.

### Basic Syntax

```javascript
fetch(url)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Using async/await
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Simple GET Request

```javascript
// Fetching JSON data
fetch('https://api.example.com/users')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(users => {
    console.log('Users:', users);
  })
  .catch(error => {
    console.error('Fetch failed:', error);
  });
```

## The fetch() Function

The `fetch()` function accepts two parameters: the resource URL and an optional init object containing request settings.

### Function Signature

```javascript
fetch(resource, options)
```

- **resource**: A string URL or a Request object
- **options**: An optional object containing request settings

### Request Options

```javascript
fetch('https://api.example.com/data', {
  method: 'POST',                    // HTTP method
  headers: {                         // Request headers
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ key: 'value' }),  // Request body
  mode: 'cors',                      // CORS mode
  credentials: 'include',            // Cookie handling
  cache: 'no-cache',                 // Cache mode
  redirect: 'follow',                // Redirect handling
  referrer: 'no-referrer',          // Referrer policy
  signal: abortController.signal     // AbortController signal
});
```

### HTTP Methods

```javascript
// GET request (default)
fetch('https://api.example.com/users');

// POST request
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// PUT request
fetch('https://api.example.com/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John Updated' })
});

// PATCH request
fetch('https://api.example.com/users/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'newemail@example.com' })
});

// DELETE request
fetch('https://api.example.com/users/1', {
  method: 'DELETE'
});
```

## The Request Object

The Request object represents a resource request. You can create a Request object directly and pass it to `fetch()`.

### Creating a Request

```javascript
// Create a request object
const request = new Request('https://api.example.com/data', {
  method: 'POST',
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  body: JSON.stringify({ key: 'value' })
});

// Use the request with fetch
fetch(request)
  .then(response => response.json())
  .then(data => console.log(data));
```

### Request Properties

```javascript
const request = new Request('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
});

console.log(request.url);        // "https://api.example.com/users"
console.log(request.method);     // "POST"
console.log(request.headers);    // Headers object
console.log(request.mode);       // "cors"
console.log(request.credentials); // "same-origin"
console.log(request.cache);      // "default"
console.log(request.redirect);   // "follow"
console.log(request.referrer);   // "about:client"
console.log(request.bodyUsed);   // false
```

### Cloning Requests

```javascript
const originalRequest = new Request('https://api.example.com/data', {
  method: 'POST',
  body: JSON.stringify({ data: 'original' })
});

// Clone the request
const clonedRequest = originalRequest.clone();

// Now you can use both requests
fetch(originalRequest).then(/* ... */);
fetch(clonedRequest).then(/* ... */);
```

## The Response Object

The Response object represents the response to a request. It contains the response status, headers, and body.

### Response Properties

```javascript
fetch('https://api.example.com/users')
  .then(response => {
    // Status properties
    console.log(response.status);      // 200
    console.log(response.statusText);  // "OK"
    console.log(response.ok);          // true (status 200-299)

    // Response metadata
    console.log(response.url);         // Final URL after redirects
    console.log(response.type);        // "basic", "cors", "opaque", etc.
    console.log(response.redirected);  // true if redirected
    console.log(response.headers);     // Headers object

    // Body state
    console.log(response.bodyUsed);    // false initially

    return response.json();
  });
```

### Response Body Methods

The Response object provides several methods to extract the body content in different formats.

```javascript
// Parse as JSON
fetch('https://api.example.com/data.json')
  .then(response => response.json())
  .then(data => console.log(data));

// Parse as text
fetch('https://example.com/page.html')
  .then(response => response.text())
  .then(html => console.log(html));

// Parse as Blob (binary data)
fetch('https://example.com/image.png')
  .then(response => response.blob())
  .then(blob => {
    const imageUrl = URL.createObjectURL(blob);
    document.getElementById('image').src = imageUrl;
  });

// Parse as ArrayBuffer
fetch('https://example.com/file.bin')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const view = new Uint8Array(buffer);
    console.log(view);
  });

// Parse as FormData
fetch('https://api.example.com/form-data')
  .then(response => response.formData())
  .then(formData => {
    for (const [key, value] of formData) {
      console.log(key, value);
    }
  });
```

### Cloning Responses

```javascript
fetch('https://api.example.com/data')
  .then(response => {
    // Clone the response before consuming the body
    const clonedResponse = response.clone();

    // Process original response
    response.json().then(data => {
      console.log('Original:', data);
    });

    // Process cloned response
    clonedResponse.text().then(text => {
      console.log('Cloned as text:', text);
    });
  });
```

### Creating Custom Responses

```javascript
// Create a custom response
const customResponse = new Response(
  JSON.stringify({ message: 'Hello, World!' }),
  {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

customResponse.json().then(data => {
  console.log(data.message); // "Hello, World!"
});
```

## Working with Headers

The Headers object provides methods to manipulate HTTP headers.

### Creating and Modifying Headers

```javascript
// Create headers from an object
const headers = new Headers({
  'Content-Type': 'application/json',
  'X-Custom-Header': 'custom-value'
});

// Create empty headers and add values
const headers2 = new Headers();
headers2.append('Content-Type', 'application/json');
headers2.append('Accept', 'application/json');

// Set a header (replaces if exists)
headers2.set('Authorization', 'Bearer token123');

// Get a header value
console.log(headers2.get('Content-Type')); // "application/json"

// Check if header exists
console.log(headers2.has('Authorization')); // true

// Delete a header
headers2.delete('X-Custom-Header');

// Iterate over headers
for (const [name, value] of headers2) {
  console.log(`${name}: ${value}`);
}
```

### Common Header Patterns

```javascript
// JSON API request
const jsonHeaders = new Headers({
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

// Form submission
const formHeaders = new Headers({
  'Content-Type': 'application/x-www-form-urlencoded'
});

// File upload (let browser set Content-Type with boundary)
const uploadHeaders = new Headers({
  'Authorization': 'Bearer token123'
});
// Don't set Content-Type for FormData - browser handles it

// Authentication headers
const authHeaders = new Headers({
  'Authorization': 'Bearer ' + accessToken,
  'X-API-Key': apiKey
});
```

### Reading Response Headers

```javascript
fetch('https://api.example.com/data')
  .then(response => {
    // Get specific header
    const contentType = response.headers.get('Content-Type');
    const cacheControl = response.headers.get('Cache-Control');

    // Get all headers
    for (const [name, value] of response.headers) {
      console.log(`${name}: ${value}`);
    }

    // Note: Some headers may be restricted by CORS
    return response.json();
  });
```

## Request Body Types

The Fetch API supports various body types for sending data.

### JSON Body

```javascript
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  })
});
```

### FormData Body

```javascript
// Create FormData from a form element
const form = document.querySelector('form');
const formData = new FormData(form);

fetch('https://api.example.com/submit', {
  method: 'POST',
  body: formData  // No Content-Type header needed
});

// Create FormData programmatically
const data = new FormData();
data.append('username', 'john');
data.append('email', 'john@example.com');
data.append('avatar', fileInput.files[0]);

fetch('https://api.example.com/profile', {
  method: 'POST',
  body: data
});
```

### URL-Encoded Body

```javascript
const params = new URLSearchParams();
params.append('username', 'john');
params.append('password', 'secret123');

fetch('https://api.example.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params
});

// Or using string
fetch('https://api.example.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'username=john&password=secret123'
});
```

### Blob and ArrayBuffer Body

```javascript
// Send Blob data
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });

fetch('https://api.example.com/upload', {
  method: 'POST',
  body: blob
});

// Send ArrayBuffer data
const buffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer);
view.set([1, 2, 3, 4, 5, 6, 7, 8]);

fetch('https://api.example.com/binary', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/octet-stream'
  },
  body: buffer
});
```

### Stream Body

```javascript
// ReadableStream as body
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('Hello '));
    controller.enqueue(new TextEncoder().encode('World!'));
    controller.close();
  }
});

fetch('https://api.example.com/stream', {
  method: 'POST',
  body: stream,
  duplex: 'half'  // Required for streaming body
});
```

## Error Handling

Proper error handling is crucial when working with the Fetch API. Note that fetch only rejects on network errors, not on HTTP error status codes.

### Understanding Fetch Error Behavior

```javascript
// fetch() does NOT reject for HTTP error statuses (4xx, 5xx)
fetch('https://api.example.com/not-found')  // Returns 404
  .then(response => {
    // This still executes! response.ok will be false
    console.log(response.status); // 404
    console.log(response.ok);     // false
  });

// Network errors DO cause rejection
fetch('https://invalid-domain-12345.com/')
  .catch(error => {
    console.log('Network error:', error); // TypeError: Failed to fetch
  });
```

### Proper Error Handling Pattern

```javascript
async function fetchWithErrorHandling(url) {
  try {
    const response = await fetch(url);

    // Check for HTTP errors
    if (!response.ok) {
      // Try to extract error message from response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Handle both network errors and HTTP errors
    if (error.name === 'TypeError') {
      // Network error
      throw new Error('Network error: Please check your connection');
    }
    throw error;
  }
}

// Usage
try {
  const data = await fetchWithErrorHandling('https://api.example.com/users');
  console.log(data);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

### Custom Error Classes

```javascript
class FetchError extends Error {
  constructor(message, status, statusText, response) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

async function fetchJSON(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new NetworkError('Failed to fetch resource', error);
  }

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    throw new FetchError(
      errorBody.message || `HTTP ${response.status}`,
      response.status,
      response.statusText,
      errorBody
    );
  }

  return response.json();
}

// Usage with specific error handling
async function getUser(id) {
  try {
    return await fetchJSON(`https://api.example.com/users/${id}`);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network problem:', error.message);
    } else if (error instanceof FetchError) {
      if (error.status === 404) {
        console.error('User not found');
      } else if (error.status === 401) {
        console.error('Unauthorized');
      } else {
        console.error(`Server error: ${error.status}`);
      }
    }
    throw error;
  }
}
```

### Retry on Failure

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.status}`);
        }
        // Retry server errors (5xx)
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## AbortController

AbortController allows you to cancel fetch requests. This is essential for preventing memory leaks and unnecessary network traffic.

### Basic Cancellation

```javascript
const controller = new AbortController();
const signal = controller.signal;

fetch('https://api.example.com/large-data', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Request was cancelled');
    } else {
      console.error('Fetch error:', error);
    }
  });

// Cancel the request after 2 seconds
setTimeout(() => {
  controller.abort();
}, 2000);
```

### Timeout Implementation

```javascript
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage
try {
  const response = await fetchWithTimeout(
    'https://api.example.com/data',
    {},
    3000  // 3 second timeout
  );
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error.message);
}
```

### Canceling Multiple Requests

```javascript
const controller = new AbortController();

// Start multiple requests with the same signal
const requests = [
  fetch('https://api.example.com/users', { signal: controller.signal }),
  fetch('https://api.example.com/posts', { signal: controller.signal }),
  fetch('https://api.example.com/comments', { signal: controller.signal })
];

// Cancel all requests
controller.abort();

// Handle cancellation
Promise.allSettled(requests).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.log(`Request ${index + 1} cancelled:`, result.reason.name);
    }
  });
});
```

### React Hook Example

```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Cleanup: abort fetch on unmount or URL change
    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(
    `https://api.example.com/users/${userId}`
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{data.name}</div>;
}
```

### AbortSignal.timeout()

Modern browsers support `AbortSignal.timeout()` for simpler timeout handling.

```javascript
// Simple timeout using AbortSignal.timeout()
try {
  const response = await fetch('https://api.example.com/data', {
    signal: AbortSignal.timeout(5000)  // 5 second timeout
  });
  const data = await response.json();
  console.log(data);
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Request timed out');
  } else if (error.name === 'AbortError') {
    console.error('Request was aborted');
  } else {
    console.error('Fetch error:', error);
  }
}

// Combining timeout with manual abort
const controller = new AbortController();
const timeoutSignal = AbortSignal.timeout(5000);

// Abort when either signal triggers
const combinedSignal = AbortSignal.any([
  controller.signal,
  timeoutSignal
]);

fetch('https://api.example.com/data', { signal: combinedSignal });

// Manual abort still works
controller.abort();
```

## CORS (Cross-Origin Resource Sharing)

The Fetch API respects CORS policies. Understanding CORS modes is important when making cross-origin requests.

### CORS Modes

```javascript
// cors (default) - Allows cross-origin requests with CORS headers
fetch('https://api.example.com/data', {
  mode: 'cors'
});

// same-origin - Only allows same-origin requests
fetch('/api/data', {
  mode: 'same-origin'
});

// no-cors - Limited cross-origin requests (opaque response)
fetch('https://other-domain.com/data', {
  mode: 'no-cors'
});
```

### Credentials Mode

```javascript
// same-origin (default) - Send credentials for same-origin requests only
fetch('https://api.example.com/data', {
  credentials: 'same-origin'
});

// include - Send credentials for cross-origin requests
fetch('https://api.example.com/data', {
  credentials: 'include'
});

// omit - Never send credentials
fetch('https://api.example.com/data', {
  credentials: 'omit'
});
```

### Handling CORS Errors

```javascript
async function fetchCrossOrigin(url) {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.error('CORS error: The server must include proper CORS headers');
      console.error('Required headers: Access-Control-Allow-Origin, etc.');
    }
    throw error;
  }
}
```

## Streaming Responses

The Fetch API supports streaming for handling large responses efficiently.

### Reading a Stream

```javascript
async function streamResponse(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let result = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    // Decode chunk and process
    const chunk = decoder.decode(value, { stream: true });
    result += chunk;
    console.log('Received chunk:', chunk.length, 'bytes');
  }

  return result;
}
```

### Progress Tracking

```javascript
async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    loaded += value.length;

    if (total) {
      const progress = (loaded / total) * 100;
      onProgress(progress, loaded, total);
    }
  }

  // Combine chunks
  const allChunks = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return new TextDecoder().decode(allChunks);
}

// Usage
const data = await fetchWithProgress(
  'https://example.com/large-file.json',
  (progress, loaded, total) => {
    console.log(`Progress: ${progress.toFixed(2)}% (${loaded}/${total})`);
  }
);
```

### Streaming JSON Lines

```javascript
async function* streamJSONLines(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      // Process remaining buffer
      if (buffer.trim()) {
        yield JSON.parse(buffer);
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');

    // Keep last incomplete line in buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        yield JSON.parse(line);
      }
    }
  }
}

// Usage
for await (const item of streamJSONLines('https://api.example.com/stream')) {
  console.log('Received:', item);
}
```

## Comparison with XMLHttpRequest

The Fetch API is the modern replacement for XMLHttpRequest. Here is how they compare.

### Basic GET Request Comparison

```javascript
// XMLHttpRequest
function xhrGet(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network error'));
    };

    xhr.send();
  });
}

// Fetch API
async function fetchGet(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
```

### POST Request Comparison

```javascript
// XMLHttpRequest
function xhrPost(url, data) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network error'));
    };

    xhr.send(JSON.stringify(data));
  });
}

// Fetch API
async function fetchPost(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

### Feature Comparison

| Feature | Fetch API | XMLHttpRequest |
|---------|-----------|----------------|
| Promise-based | Yes | No (callback-based) |
| Streaming | Yes | Limited |
| Request/Response objects | Yes | No |
| AbortController support | Yes | Has abort() method |
| Upload progress | No | Yes |
| Synchronous requests | No | Yes (deprecated) |
| Service Worker compatible | Yes | No |
| Cookie handling | Via credentials option | Automatic |

### Upload Progress with XMLHttpRequest

```javascript
// XMLHttpRequest has native upload progress support
function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

// Fetch API doesn't have direct upload progress
// You can track it server-side or use alternative approaches
```

## Practical Examples

### Building a REST API Client

```javascript
class APIClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Usage
const api = new APIClient('https://api.example.com', {
  'Authorization': 'Bearer token123'
});

// GET request
const users = await api.get('/users');

// POST request
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updatedUser = await api.put('/users/1', {
  name: 'John Updated'
});

// DELETE request
await api.delete('/users/1');
```

### File Download with Progress

```javascript
async function downloadFile(url, filename, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (onProgress && total) {
      onProgress({ loaded, total, progress: (loaded / total) * 100 });
    }
  }

  // Create blob from chunks
  const blob = new Blob(chunks);

  // Create download link
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  return blob;
}

// Usage
await downloadFile(
  'https://example.com/files/document.pdf',
  'document.pdf',
  ({ progress }) => console.log(`Download: ${progress.toFixed(2)}%`)
);
```

### Parallel Requests with Rate Limiting

```javascript
async function fetchWithRateLimit(urls, maxConcurrent = 3) {
  const results = [];
  const executing = new Set();

  for (const url of urls) {
    const promise = fetch(url)
      .then(response => response.json())
      .then(data => {
        executing.delete(promise);
        return { url, data, status: 'fulfilled' };
      })
      .catch(error => {
        executing.delete(promise);
        return { url, error: error.message, status: 'rejected' };
      });

    executing.add(promise);
    results.push(promise);

    if (executing.size >= maxConcurrent) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// Usage
const urls = [
  'https://api.example.com/item/1',
  'https://api.example.com/item/2',
  'https://api.example.com/item/3',
  'https://api.example.com/item/4',
  'https://api.example.com/item/5'
];

const results = await fetchWithRateLimit(urls, 2);
console.log(results);
```

### Caching Fetch Responses

```javascript
class CachedFetch {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;  // Time to live in milliseconds
  }

  async fetch(url, options = {}) {
    const cacheKey = `${options.method || 'GET'}:${url}`;

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }
    }

    // Make request
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Cache GET responses
    if (!options.method || options.method === 'GET') {
      this.cache.set(cacheKey, {
        data,
        expiry: Date.now() + this.ttl
      });
    }

    return data;
  }

  clearCache() {
    this.cache.clear();
  }

  invalidate(url) {
    for (const key of this.cache.keys()) {
      if (key.includes(url)) {
        this.cache.delete(key);
      }
    }
  }
}

// Usage
const cachedFetch = new CachedFetch(30000);  // 30 second TTL

// First call - fetches from network
const data1 = await cachedFetch.fetch('https://api.example.com/users');

// Second call - returns cached data
const data2 = await cachedFetch.fetch('https://api.example.com/users');
```

### Polling with Fetch

```javascript
class Poller {
  constructor(url, interval = 5000) {
    this.url = url;
    this.interval = interval;
    this.controller = null;
    this.timeoutId = null;
    this.isRunning = false;
  }

  async start(callback) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.controller = new AbortController();

    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const response = await fetch(this.url, {
          signal: this.controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        callback(null, data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          callback(error, null);
        }
      }

      if (this.isRunning) {
        this.timeoutId = setTimeout(poll, this.interval);
      }
    };

    poll();
  }

  stop() {
    this.isRunning = false;
    if (this.controller) {
      this.controller.abort();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

// Usage
const poller = new Poller('https://api.example.com/status', 3000);

poller.start((error, data) => {
  if (error) {
    console.error('Polling error:', error);
  } else {
    console.log('Status update:', data);
  }
});

// Stop polling after 30 seconds
setTimeout(() => poller.stop(), 30000);
```

## Best Practices

### Always Check response.ok

```javascript
// Bad - doesn't handle HTTP errors
const data = await fetch(url).then(r => r.json());

// Good - properly checks for errors
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
const data = await response.json();
```

### Use AbortController for Cleanup

```javascript
// Always provide cancellation capability
function createFetchWithAbort() {
  const controller = new AbortController();

  return {
    promise: fetch(url, { signal: controller.signal }),
    abort: () => controller.abort()
  };
}
```

### Handle JSON Parsing Errors

```javascript
async function safeJsonParse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }
}
```

### Set Appropriate Timeouts

```javascript
// Always set timeouts for production code
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000)  // 10 second timeout
});
```

### Avoid Storing Sensitive Data in URLs

```javascript
// Bad - sensitive data in URL
fetch(`https://api.example.com/auth?token=${secretToken}`);

// Good - sensitive data in headers
fetch('https://api.example.com/auth', {
  headers: {
    'Authorization': `Bearer ${secretToken}`
  }
});
```

## Summary

The Fetch API provides a modern, Promise-based interface for making HTTP requests in JavaScript:

- **fetch()** returns a Promise that resolves to a Response object
- **Request** and **Response** objects provide rich APIs for handling HTTP data
- **Headers** object allows manipulation of HTTP headers
- Multiple body types are supported: JSON, FormData, Blob, ArrayBuffer, streams
- **Error handling** requires checking response.ok since fetch only rejects on network errors
- **AbortController** enables request cancellation and timeout implementation
- **Streaming** support allows efficient handling of large responses
- Compared to XMLHttpRequest, Fetch offers cleaner syntax and better Promise integration

The Fetch API is the standard way to make HTTP requests in modern JavaScript applications and is supported in all current browsers and Node.js 18+.
