---
title: "HTMX: Modern Web Development Simplified"
description: Build interactive web applications with HTMX without complex frontend frameworks
track: javascript
section: patterns-tooling
difficulty: beginner
tags:
  - HTMX
  - HTML
  - AJAX
  - Hypermedia
status: imported
origin: old/src/content/docs/frontend/htmx.en.md
divergence: 0.228
issues: []
legacy:
  category: Frontend
  subcategory: Libraries
  order: 29
  lastUpdated: 2026-01-07
---

HTMX is a lightweight JavaScript library that extends HTML with powerful attributes for building dynamic, interactive web applications. Instead of writing complex JavaScript code or adopting heavy frontend frameworks, HTMX lets you access AJAX, CSS Transitions, WebSockets, and Server-Sent Events directly from HTML using declarative attributes.

## The HTMX Philosophy

### Returning to Hypermedia

HTMX is built on a fundamental insight: HTML is inherently powerful but artificially limited. Standard HTML restricts HTTP requests to `<a>` tags and `<form>` elements, supports only GET and POST methods, and can only replace the entire page. HTMX removes these arbitrary limitations while preserving the declarative simplicity that makes HTML approachable.

The core philosophy centers on several key principles:

1. **HTML-Centric Development**: Instead of building JavaScript applications that manipulate the DOM, let the server return HTML fragments that HTMX swaps into place
2. **Hypermedia as the Engine of Application State (HATEOAS)**: The server drives application behavior through hypermedia responses
3. **Simplicity Over Complexity**: Achieve rich interactivity without build steps, bundlers, or complex state management
4. **Progressive Enhancement**: Start with working HTML and enhance it with HTMX attributes

### Why Choose HTMX?

HTMX offers compelling advantages for many web development scenarios:

- **Zero Production Dependencies**: A small footprint of approximately 14KB minified and gzipped
- **No Build Step Required**: Include the script tag and start using attributes immediately
- **Server-Agnostic**: Works with any backend technology that can return HTML
- **Gentle Learning Curve**: If you understand HTML, you can start using HTMX today
- **Reduced Complexity**: No need for client-side routing, state management libraries, or component frameworks
- **SEO-Friendly**: Server-rendered HTML is naturally indexable by search engines

## Getting Started

### Installation

There are several ways to include HTMX in your project:

```html
<!-- Via CDN (simplest approach) -->
<script src="https://unpkg.com/htmx.org@2.0.0"></script>

<!-- Or via npm for bundled projects -->
<!-- npm install htmx.org -->
```

### Your First HTMX Request

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>HTMX Demo</title>
    <script src="https://unpkg.com/htmx.org@2.0.0"></script>
</head>
<body>
    <button hx-get="/api/greeting" hx-target="#result">
        Click Me
    </button>
    <div id="result">Response will appear here</div>
</body>
</html>
```

When the button is clicked, HTMX makes a GET request to `/api/greeting` and replaces the content of `#result` with the server's HTML response.

## Core Attributes

HTMX provides attributes for all standard HTTP methods, allowing any element to make AJAX requests.

### AJAX Request Attributes

```html
<!-- GET request -->
<button hx-get="/api/users">Load Users</button>

<!-- POST request -->
<form hx-post="/api/users">
    <input name="username" type="text" required />
    <input name="email" type="email" required />
    <button type="submit">Create User</button>
</form>

<!-- PUT request with confirmation -->
<button
    hx-put="/api/users/123"
    hx-confirm="Update this user?"
    hx-target="#user-123">
    Update User
</button>

<!-- PATCH request for partial updates -->
<input
    type="checkbox"
    hx-patch="/api/tasks/456"
    hx-vals='{"completed": true}'
    hx-target="#task-456" />

<!-- DELETE request with element removal -->
<button
    hx-delete="/api/users/123"
    hx-target="#user-123"
    hx-swap="delete"
    hx-confirm="Delete this user permanently?">
    Delete User
</button>
```

### The hx-target Attribute

By default, HTMX replaces the content of the element that triggered the request. Use `hx-target` to specify a different element:

```html
<!-- Target by ID -->
<button hx-get="/api/users" hx-target="#user-list">
    Load Users
</button>
<div id="user-list"></div>

<!-- Target closest ancestor matching selector -->
<button hx-delete="/api/item/123" hx-target="closest tr" hx-swap="delete">
    Delete Row
</button>

<!-- Target next sibling matching selector -->
<input hx-get="/api/validate" hx-target="next .error-message" />
<span class="error-message"></span>

<!-- Target using find (searches descendants) -->
<div hx-get="/api/data" hx-target="find .content-area">
    <div class="content-area"></div>
</div>
```

### The hx-swap Attribute

HTMX provides eight swap strategies for inserting server responses:

```html
<!-- innerHTML (default): Replace inner content -->
<div hx-get="/api/content" hx-swap="innerHTML">
    Content will be replaced
</div>

<!-- outerHTML: Replace entire element -->
<div hx-get="/api/widget" hx-swap="outerHTML">
    Entire element will be replaced
</div>

<!-- beforebegin: Insert before the element -->
<div hx-get="/api/item" hx-swap="beforebegin">
    New content appears before this
</div>

<!-- afterbegin: Insert as first child -->
<ul hx-get="/api/latest" hx-swap="afterbegin">
    <li>Existing item</li>
</ul>

<!-- beforeend: Insert as last child -->
<ul hx-get="/api/more" hx-swap="beforeend">
    <li>Existing item</li>
</ul>

<!-- afterend: Insert after the element -->
<div hx-get="/api/notice" hx-swap="afterend">
    New content appears after this
</div>

<!-- delete: Remove the target element -->
<div hx-delete="/api/item/123" hx-swap="delete">
    This element will be removed
</div>

<!-- none: No DOM update (useful for side effects) -->
<button hx-post="/api/track" hx-swap="none">
    Track Click (no visible change)
</button>
```

### Swap Modifiers

Fine-tune swap behavior with modifiers:

```html
<!-- Control timing -->
<button
    hx-get="/api/data"
    hx-swap="innerHTML swap:500ms settle:1s">
    Load with Delay
</button>

<!-- Scroll control -->
<div hx-get="/api/more" hx-swap="beforeend scroll:bottom">
    Auto-scroll to bottom after swap
</div>

<!-- Show element at viewport position -->
<div hx-get="/api/details" hx-swap="innerHTML show:top">
    Scroll to top after swap
</div>

<!-- Enable View Transitions API -->
<div hx-get="/api/page" hx-swap="innerHTML transition:true">
    Animated transition
</div>
```

### The hx-trigger Attribute

By default, HTMX triggers requests based on element type:
- `<input>`, `<textarea>`, `<select>`: triggered on `change`
- `<form>`: triggered on `submit`
- Everything else: triggered on `click`

Customize triggers with `hx-trigger`:

```html
<!-- Different events -->
<div hx-get="/api/data" hx-trigger="mouseenter">
    Hover to load
</div>

<input hx-get="/api/search" hx-trigger="keyup" />

<!-- Multiple triggers -->
<input
    hx-get="/api/search"
    hx-trigger="keyup, search"
    hx-target="#results" />

<!-- Load on page load -->
<div hx-get="/api/initial" hx-trigger="load">
    Loading...
</div>

<!-- Lazy loading with revealed -->
<div hx-get="/api/lazy" hx-trigger="revealed">
    Loads when scrolled into view
</div>

<!-- Intersection observer -->
<img
    hx-get="/api/image"
    hx-trigger="intersect threshold:0.5"
    hx-swap="outerHTML" />
```

### Trigger Modifiers

```html
<!-- Debounce: Wait for pause in activity -->
<input
    type="search"
    hx-get="/api/search"
    hx-trigger="keyup changed delay:500ms"
    hx-target="#results"
    placeholder="Search..." />

<!-- Throttle: Limit request frequency -->
<button
    hx-get="/api/data"
    hx-trigger="click throttle:1s">
    Click (max once per second)
</button>

<!-- Once: Only trigger one time -->
<div hx-get="/api/welcome" hx-trigger="load once">
    Loads once on page load
</div>

<!-- Changed: Only trigger if value changed -->
<input hx-get="/api/validate" hx-trigger="keyup changed" />

<!-- Polling -->
<div hx-get="/api/status" hx-trigger="every 2s">
    Status updates every 2 seconds
</div>

<!-- Conditional polling -->
<div hx-get="/api/updates" hx-trigger="every 1s [isPollingEnabled]">
    Conditional polling based on JavaScript variable
</div>
```

### Event Filters

```html
<!-- Modifier keys -->
<button
    hx-post="/api/admin"
    hx-trigger="click[ctrlKey]">
    Admin Action (Ctrl+Click required)
</button>

<!-- Keyboard shortcuts -->
<body hx-trigger="keyup[key=='Escape'] from:body"
      hx-get="/api/close-modal"
      hx-target="#modal">
</body>

<!-- Value-based conditions -->
<input
    hx-get="/api/search"
    hx-trigger="keyup[target.value.length > 2] delay:300ms"
    hx-target="#results" />
```

## AJAX Requests in Depth

### Including Additional Data

```html
<!-- Static values with hx-vals -->
<button
    hx-post="/api/action"
    hx-vals='{"userId": 123, "action": "approve"}'>
    Approve
</button>

<!-- Dynamic values with JavaScript -->
<button
    hx-post="/api/action"
    hx-vals="js:{timestamp: Date.now()}">
    Submit with Timestamp
</button>

<!-- Include inputs from other elements -->
<input type="text" id="search-input" name="query" />
<button hx-get="/api/search" hx-include="#search-input">
    Search
</button>

<!-- Include entire form -->
<button hx-post="/api/submit" hx-include="closest form">
    Submit Form
</button>

<!-- Custom headers -->
<button
    hx-post="/api/data"
    hx-headers='{"X-Custom-Header": "value"}'>
    With Custom Header
</button>
```

### Request Indicators

Show loading states during requests:

```html
<style>
    .htmx-indicator {
        display: none;
    }
    .htmx-request .htmx-indicator {
        display: inline-block;
    }
    .htmx-request.htmx-indicator {
        display: inline-block;
    }
</style>

<!-- External indicator -->
<button hx-get="/api/data" hx-indicator="#spinner">
    Load Data
</button>
<img id="spinner" class="htmx-indicator" src="/spinner.gif" alt="Loading" />

<!-- Inline indicator -->
<button hx-get="/api/data">
    <span class="htmx-indicator">Loading...</span>
    <span>Load Data</span>
</button>
```

### Request Synchronization

Control how concurrent requests are handled:

```html
<!-- Abort previous requests -->
<input
    hx-get="/api/search"
    hx-trigger="keyup"
    hx-sync="this:abort">

<!-- Queue requests -->
<button
    hx-post="/api/action"
    hx-sync="this:queue first">
    Only First Queued
</button>

<!-- Drop if request in flight -->
<button
    hx-post="/api/action"
    hx-sync="this:drop">
    Ignore While Processing
</button>

<!-- Replace pending request -->
<div hx-get="/api/data" hx-sync="this:replace">
    Only most recent request executes
</div>
```

### Out-of-Band Swaps

Update multiple page regions with a single response:

```html
<!-- Server response -->
<div id="main-content">
    Updated main content
</div>

<!-- These elements are swapped out-of-band -->
<div id="notification" hx-swap-oob="true">
    New notification appeared!
</div>

<span id="user-count" hx-swap-oob="innerHTML">
    42 users online
</span>

<div id="sidebar" hx-swap-oob="beforeend">
    <p>New sidebar item</p>
</div>
```

## WebSockets

HTMX supports real-time bidirectional communication through the WebSocket extension:

```html
<!-- Include WebSocket extension -->
<script src="https://unpkg.com/htmx-ext-ws@2.0.0/ws.js"></script>

<!-- Establish WebSocket connection -->
<div hx-ext="ws" ws-connect="/chat">
    <!-- Messages received from server appear here -->
    <div id="chat-messages">
        <!-- Server sends HTML that targets this element -->
    </div>

    <!-- Form sends messages via WebSocket -->
    <form ws-send>
        <input name="message" placeholder="Type a message..." />
        <button type="submit">Send</button>
    </form>
</div>
```

### WebSocket Events

```javascript
// Before WebSocket message is sent
document.body.addEventListener('htmx:wsBeforeSend', (event) => {
    console.log('Sending:', event.detail.message);
});

// After WebSocket message is sent
document.body.addEventListener('htmx:wsAfterSend', (event) => {
    console.log('Sent:', event.detail.message);
});

// When WebSocket connection opens
document.body.addEventListener('htmx:wsOpen', (event) => {
    console.log('WebSocket connected');
});

// When WebSocket connection closes
document.body.addEventListener('htmx:wsClose', (event) => {
    console.log('WebSocket disconnected');
});
```

### WebSocket Server Response

The server should send HTML that HTMX can swap into the page:

```html
<!-- Server sends this HTML via WebSocket -->
<div id="chat-messages" hx-swap-oob="beforeend">
    <div class="message">
        <strong>User123:</strong> Hello everyone!
    </div>
</div>
```

## Server-Sent Events (SSE)

For one-way real-time updates from server to client:

```html
<!-- Include SSE extension -->
<script src="https://unpkg.com/htmx-ext-sse@2.2.1/sse.js"></script>

<!-- Connect to SSE endpoint -->
<div hx-ext="sse" sse-connect="/events">
    <!-- Swap content when 'message' event received -->
    <div sse-swap="message">
        Waiting for messages...
    </div>

    <!-- Different event types -->
    <div sse-swap="notification">
        Notifications appear here
    </div>

    <!-- Trigger HTMX request on SSE event -->
    <div hx-get="/api/data" hx-trigger="sse:data-update">
        Refreshes when data-update event fires
    </div>
</div>
```

### SSE Server Implementation (Node.js Example)

```javascript
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send message event
    res.write('event: message\n');
    res.write('data: <div>New message received!</div>\n\n');

    // Send notification event
    res.write('event: notification\n');
    res.write('data: <span class="badge">3</span>\n\n');
});
```

## Integration with Backend Frameworks

HTMX works seamlessly with any backend that returns HTML. Here are patterns for popular frameworks:

### Express.js (Node.js)

```javascript
const express = require('express');
const app = express();

// Regular page load
app.get('/users', (req, res) => {
    const users = getUsers();

    // Check if this is an HTMX request
    if (req.headers['hx-request']) {
        // Return partial HTML for HTMX
        res.send(renderUserList(users));
    } else {
        // Return full page for normal request
        res.send(renderFullPage(users));
    }
});

// HTMX-specific endpoint
app.delete('/users/:id', (req, res) => {
    deleteUser(req.params.id);

    // Return empty response for delete swap
    res.send('');
});
```

### Django (Python)

```python
from django.http import HttpResponse
from django.shortcuts import render

def user_list(request):
    users = User.objects.all()

    # Check for HTMX request
    if request.headers.get('HX-Request'):
        return render(request, 'partials/user_list.html', {'users': users})

    return render(request, 'users/index.html', {'users': users})

def delete_user(request, user_id):
    User.objects.get(id=user_id).delete()
    return HttpResponse('')
```

### Laravel (PHP)

```php
class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::all();

        if ($request->header('HX-Request')) {
            return view('partials.user-list', compact('users'));
        }

        return view('users.index', compact('users'));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response('');
    }
}
```

### Flask (Python)

```python
from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/users')
def users():
    users = get_users()

    if request.headers.get('HX-Request'):
        return render_template('partials/user_list.html', users=users)

    return render_template('users/index.html', users=users)

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    remove_user(id)
    return ''
```

### Spring Boot (Java)

```java
@Controller
public class UserController {

    @GetMapping("/users")
    public String users(Model model,
                       @RequestHeader(value = "HX-Request", required = false) String hxRequest) {
        model.addAttribute("users", userService.findAll());

        if (hxRequest != null) {
            return "partials/user-list";
        }

        return "users/index";
    }

    @DeleteMapping("/users/{id}")
    @ResponseBody
    public String deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return "";
    }
}
```

## Comparison with SPA Frameworks

### HTMX vs React/Vue/Angular

| Aspect | HTMX | SPA Frameworks |
|--------|------|----------------|
| **Bundle Size** | ~14KB | 30KB - 200KB+ |
| **Learning Curve** | Low (HTML knowledge) | Moderate to High |
| **Build Tools** | Optional | Required |
| **State Management** | Server-side | Client-side |
| **SEO** | Native support | Requires SSR/SSG |
| **Initial Load** | Fast | Slower |
| **Interactivity** | Good | Excellent |
| **Offline Support** | Limited | Better |
| **Developer Tools** | Browser DevTools | Framework-specific |

### When to Choose HTMX

HTMX excels in these scenarios:

- **Content-focused websites** with selective interactivity
- **CRUD applications** and admin dashboards
- **Progressive enhancement** of existing server-rendered applications
- **Teams with strong backend expertise** who want to minimize frontend complexity
- **Projects prioritizing simplicity** and maintainability
- **SEO-critical applications** where server-rendered content matters

### When to Choose SPA Frameworks

SPA frameworks may be better for:

- **Highly interactive applications** like collaborative editors or games
- **Offline-first applications** requiring extensive client-side state
- **Complex client-side data manipulation** and transformations
- **Mobile applications** via React Native or similar
- **Teams with strong frontend expertise** and existing component libraries

### Hybrid Approaches

HTMX can coexist with JavaScript frameworks:

```html
<!-- Alpine.js for local interactivity, HTMX for server communication -->
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>

    <div x-show="open">
        <button hx-get="/api/details" hx-target="#details">
            Load from Server
        </button>
        <div id="details"></div>
    </div>
</div>
```

## Practical Examples

### Live Search

```html
<input
    type="search"
    name="q"
    placeholder="Search users..."
    hx-get="/api/search"
    hx-trigger="input changed delay:300ms, search"
    hx-target="#search-results"
    hx-indicator="#search-spinner" />

<span id="search-spinner" class="htmx-indicator">Searching...</span>

<div id="search-results">
    <!-- Results appear here -->
</div>
```

### Infinite Scroll

```html
<div id="item-list">
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>

    <!-- Sentinel element for loading more -->
    <div
        hx-get="/api/items?page=2"
        hx-trigger="revealed"
        hx-swap="outerHTML"
        hx-indicator=".load-indicator">
        <div class="load-indicator htmx-indicator">Loading more...</div>
    </div>
</div>
```

Server response includes the next sentinel:

```html
<div class="item">Item 11</div>
<div class="item">Item 12</div>
<div
    hx-get="/api/items?page=3"
    hx-trigger="revealed"
    hx-swap="outerHTML">
    <div class="htmx-indicator">Loading more...</div>
</div>
```

### Inline Editing

```html
<!-- Display mode -->
<div id="user-name-123" class="editable">
    <span>John Doe</span>
    <button hx-get="/api/users/123/edit" hx-target="#user-name-123">
        Edit
    </button>
</div>
```

Edit form response:

```html
<form
    hx-put="/api/users/123/name"
    hx-target="#user-name-123"
    hx-swap="outerHTML">
    <input name="name" value="John Doe" autofocus />
    <button type="submit">Save</button>
    <button type="button"
            hx-get="/api/users/123/name"
            hx-target="#user-name-123">
        Cancel
    </button>
</form>
```

### Form Validation

```html
<form hx-post="/api/register" hx-target="#form-messages">
    <div class="field">
        <label for="email">Email</label>
        <input
            type="email"
            id="email"
            name="email"
            hx-post="/api/validate/email"
            hx-trigger="blur changed"
            hx-target="next .validation" />
        <span class="validation"></span>
    </div>

    <div class="field">
        <label for="username">Username</label>
        <input
            type="text"
            id="username"
            name="username"
            hx-post="/api/validate/username"
            hx-trigger="keyup changed delay:500ms"
            hx-target="next .validation" />
        <span class="validation"></span>
    </div>

    <button type="submit">Register</button>
</form>

<div id="form-messages"></div>
```

### Modal Dialogs

```html
<button
    hx-get="/api/modals/confirm-delete"
    hx-target="#modal-container"
    hx-swap="innerHTML">
    Delete Item
</button>

<div id="modal-container"></div>
```

Modal response:

```html
<div class="modal-backdrop" hx-on:click="htmx.remove(this.parentElement)">
    <div class="modal" hx-on:click="event.stopPropagation()">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this item?</p>

        <button
            hx-delete="/api/items/123"
            hx-target="#item-123"
            hx-swap="delete"
            hx-on::after-request="htmx.remove(document.getElementById('modal-container').firstChild)">
            Confirm
        </button>

        <button hx-on:click="htmx.remove(this.closest('.modal-backdrop'))">
            Cancel
        </button>
    </div>
</div>
```

## Browser History and Navigation

### History Management

```html
<!-- Push URL to browser history -->
<a hx-get="/page2" hx-target="#content" hx-push-url="true">
    Go to Page 2
</a>

<!-- Custom URL different from request path -->
<button
    hx-get="/api/users/123/profile"
    hx-target="#content"
    hx-push-url="/users/123">
    View Profile
</button>

<!-- Replace current URL without adding history -->
<a hx-get="/page3" hx-target="#content" hx-replace-url="true">
    Replace with Page 3
</a>

<!-- Prevent history modification -->
<div hx-get="/api/live-data" hx-trigger="every 5s" hx-history="false">
    Polling without affecting history
</div>
```

### Boosting Links and Forms

Convert traditional navigation to AJAX with `hx-boost`:

```html
<nav hx-boost="true">
    <!-- These links use AJAX with history support -->
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/products">Products</a>
</nav>

<main id="content">
    <!-- Page content swapped here -->
</main>
```

## Events and JavaScript Integration

### HTMX Events

```javascript
// Before request
document.body.addEventListener('htmx:beforeRequest', (event) => {
    console.log('Request starting:', event.detail.pathInfo.requestPath);
});

// After response received
document.body.addEventListener('htmx:afterRequest', (event) => {
    console.log('Request completed');
});

// After content swapped
document.body.addEventListener('htmx:afterSwap', (event) => {
    console.log('Content swapped into:', event.detail.target);
});

// Handle errors
document.body.addEventListener('htmx:responseError', (event) => {
    console.error('Request failed:', event.detail.xhr.status);
});

// Modify request before sending
document.body.addEventListener('htmx:configRequest', (event) => {
    event.detail.headers['X-Custom-Header'] = 'value';
});
```

### Programmatic Control

```javascript
// Trigger an element's HTMX behavior
htmx.trigger('#my-element', 'click');

// Make a direct AJAX request
htmx.ajax('GET', '/api/data', {
    target: '#result',
    swap: 'innerHTML'
});

// Process new content for HTMX attributes
htmx.process(document.getElementById('new-content'));

// Remove HTMX from an element
htmx.remove(document.getElementById('old-element'));
```

### Inline Event Handlers

```html
<!-- Using hx-on for inline handlers -->
<button
    hx-post="/api/action"
    hx-on::before-request="console.log('Starting request')"
    hx-on::after-request="console.log('Request complete')">
    Action
</button>

<!-- Shorthand for htmx events -->
<div hx-get="/api/data" hx-on:htmx:after-swap="initializeComponent(this)">
    Content
</div>
```

## Security Best Practices

### CSRF Protection

```html
<!-- Include CSRF token in meta tag -->
<meta name="csrf-token" content="{{ csrf_token }}">

<script>
    document.body.addEventListener('htmx:configRequest', (event) => {
        event.detail.headers['X-CSRF-Token'] =
            document.querySelector('meta[name="csrf-token"]').content;
    });
</script>
```

### Input Validation

Always validate on the server side. Never trust `hx-vals` or any client-side data:

```javascript
// Server-side validation (Express example)
app.post('/api/users', (req, res) => {
    const { username, email } = req.body;

    // Always validate server-side
    if (!isValidUsername(username)) {
        return res.status(400).send('<div class="error">Invalid username</div>');
    }

    if (!isValidEmail(email)) {
        return res.status(400).send('<div class="error">Invalid email</div>');
    }

    // Process valid data
});
```

### Content Security Policy

If using strict CSP, you may need to configure HTMX:

```javascript
// Disable inline event handlers if CSP blocks them
htmx.config.allowScriptTags = false;
htmx.config.allowEval = false;
```

## Configuration

### Global Configuration

```javascript
htmx.config.historyCacheSize = 20;     // History cache entries
htmx.config.defaultSwapStyle = 'innerHTML';
htmx.config.defaultSwapDelay = 0;
htmx.config.defaultSettleDelay = 20;
htmx.config.includeIndicatorStyles = true;
htmx.config.timeout = 0;               // Request timeout (0 = none)
htmx.config.wsReconnectDelay = 'full-jitter';
htmx.config.scrollBehavior = 'smooth';
```

### Attribute Inheritance

HTMX attributes inherit down the DOM tree:

```html
<div hx-target="#results" hx-swap="innerHTML">
    <!-- All children inherit target and swap -->
    <button hx-get="/api/users">Users</button>
    <button hx-get="/api/products">Products</button>
    <button hx-get="/api/orders">Orders</button>
</div>
```

Disable inheritance with `hx-disinherit`:

```html
<div hx-target="#results">
    <button hx-get="/api/data" hx-disinherit="hx-target">
        Uses default target
    </button>
</div>
```

## Summary

HTMX offers a refreshing approach to web development that embraces the strengths of HTML and HTTP rather than working around them. By extending HTML with powerful attributes, HTMX enables developers to build dynamic, interactive applications without the complexity of modern JavaScript frameworks.

Key takeaways:

- **Simplicity**: Add interactivity with HTML attributes, no JavaScript required
- **Server-centric**: The server returns HTML, keeping state management simple
- **Progressive**: Enhance existing applications without rewriting them
- **Lightweight**: Small footprint with no build step needed
- **Flexible**: Works with any backend technology

Whether building new applications or enhancing existing ones, HTMX provides a pragmatic path to modern, interactive web experiences while keeping complexity in check.

## Further Resources

- [Official HTMX Documentation](https://htmx.org/docs/)
- [HTMX Examples](https://htmx.org/examples/)
- [Hypermedia Systems](https://hypermedia.systems/) - Free online book by HTMX creators
- [HTMX Discord Community](https://htmx.org/discord)
- [HTMX GitHub Repository](https://github.com/bigskysoftware/htmx)
