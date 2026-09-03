---
title: Security Response Headers
description: Learn to configure web security response headers
track: security
section: web-security
difficulty: intermediate
tags:
  - security headers
  - CSP
  - HSTS
  - web security
status: imported
origin: old/src/content/docs/security/security-headers.en.md
divergence: 0.492
issues:
  - divergent
legacy:
  category: Security
  subcategory: Web Security
  order: 20
  lastUpdated: 2026-01-07
---

HTTP security headers are a fundamental layer of defense for web applications. By instructing browsers how to behave when handling your site's content, these headers can prevent various attacks including cross-site scripting (XSS), clickjacking, and man-in-the-middle attacks. We'll cover the essential security headers every web developer should implement.

## Why Security Headers Matter

Security headers act as instructions from your server to the browser, defining security policies that protect both your application and your users. Without proper security headers, your application is vulnerable to numerous attack vectors:

```
Browser Request/Response with Security Headers:

+-------------+                                  +-------------+
|   Browser   |   --------- Request ----------> |   Server    |
|             |                                  |             |
|             |   <-------- Response ---------  |             |
|             |   + Security Headers            |             |
|             |     - CSP                        |             |
|             |     - HSTS                       |             |
|             |     - X-Frame-Options           |             |
|             |     - X-Content-Type-Options    |             |
+-------------+                                  +-------------+
       |
       v
Browser enforces security policies
based on received headers
```

### Security Headers Overview

| Header | Purpose | Primary Protection |
|--------|---------|-------------------|
| Content-Security-Policy | Controls resource loading | XSS, Data injection |
| Strict-Transport-Security | Enforces HTTPS | Man-in-the-middle |
| X-Frame-Options | Controls iframe embedding | Clickjacking |
| X-Content-Type-Options | Prevents MIME sniffing | MIME confusion attacks |
| Referrer-Policy | Controls referrer information | Information leakage |
| Permissions-Policy | Controls browser features | Feature abuse |

## Content-Security-Policy (CSP)

Content-Security-Policy is the most powerful security header available, allowing fine-grained control over which resources can be loaded and executed on your pages.

### Understanding CSP Directives

CSP uses directives to control different types of resources:

```
CSP Directive Categories:

+------------------+----------------------------------------+
| Directive        | Controls                               |
+------------------+----------------------------------------+
| default-src      | Fallback for other directives          |
| script-src       | JavaScript sources                     |
| style-src        | CSS stylesheets                        |
| img-src          | Images                                 |
| font-src         | Web fonts                              |
| connect-src      | XHR, WebSocket, fetch                  |
| media-src        | Audio and video                        |
| object-src       | Plugins (Flash, Java)                  |
| frame-src        | iframe sources                         |
| frame-ancestors  | Who can embed this page                |
| form-action      | Form submission targets                |
| base-uri         | Base URL restrictions                  |
| report-uri       | Violation reporting endpoint           |
+------------------+----------------------------------------+
```

### Basic CSP Implementation

**Restrictive CSP Example:**

```http
Content-Security-Policy: default-src 'self';
                         script-src 'self';
                         style-src 'self';
                         img-src 'self' data:;
                         font-src 'self';
                         object-src 'none';
                         frame-ancestors 'none';
```

This policy:
- Only allows resources from the same origin (`'self'`)
- Blocks all plugins (`object-src 'none'`)
- Prevents the page from being embedded in frames (`frame-ancestors 'none'`)

### CSP Source Values

| Value | Description |
|-------|-------------|
| `'self'` | Same origin only |
| `'none'` | Block all sources |
| `'unsafe-inline'` | Allow inline scripts/styles (not recommended) |
| `'unsafe-eval'` | Allow dynamic code evaluation (not recommended) |
| `'strict-dynamic'` | Trust scripts loaded by trusted scripts |
| `'nonce-{random}'` | Allow specific inline elements with matching nonce |
| `'sha256-{hash}'` | Allow specific inline elements by hash |
| `https:` | Any HTTPS source |
| `data:` | Data URIs |
| `blob:` | Blob URIs |
| `*.example.com` | Wildcard subdomain |

### CSP with Nonces for Inline Scripts

Using nonces allows specific inline scripts while blocking injection attacks:

```javascript
// Node.js/Express implementation
const crypto = require('crypto');

function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

app.use((req, res, next) => {
  // Generate unique nonce for each request
  res.locals.nonce = generateNonce();

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' 'nonce-${res.locals.nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'"
  ].join('; '));

  next();
});

// In your HTML template (using EJS as example)
// <script nonce="<%= nonce %>">
//   // This inline script will execute
//   console.log('Trusted script');
// </script>
```

**HTML Template with Nonce:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Secure Page</title>
</head>
<body>
  <h1>Welcome</h1>

  <!-- This script runs because it has the correct nonce -->
  <script nonce="abc123randomnonce">
    console.log('This is allowed');
  </script>

  <!-- This injected script would be blocked -->
  <!-- <script>maliciousCode()</script> -->
</body>
</html>
```

### CSP Reporting

Configure CSP to report violations without blocking (useful for testing):

```http
Content-Security-Policy-Report-Only: default-src 'self';
                                     report-uri /csp-violation-report;
                                     report-to csp-endpoint;
```

**Violation Report Handler:**

```javascript
// Express.js CSP violation report endpoint
app.post('/csp-violation-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const violation = req.body['csp-report'];

  console.log('CSP Violation:', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number']
  });

  // Log to monitoring system
  logger.warn('CSP Violation detected', violation);

  res.status(204).end();
});
```

### Progressive CSP Deployment

Start with report-only mode and gradually tighten the policy:

```javascript
// Phase 1: Report-Only mode to identify violations
const cspReportOnly = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    reportUri: '/csp-report'
  }
};

// Phase 2: Begin restricting dangerous sources
const cspPhase2 = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Still allowing inline temporarily
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    reportUri: '/csp-report'
  }
};

// Phase 3: Full nonce-based policy
const cspStrict = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
    styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
    imgSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    reportUri: '/csp-report'
  }
};
```

## HTTP Strict-Transport-Security (HSTS)

HSTS forces browsers to only connect to your site over HTTPS, preventing protocol downgrade attacks and cookie hijacking.

### How HSTS Works

```
First Visit (without HSTS):
User types: example.com
Browser: HTTP request to example.com:80
Server: 301 Redirect to https://example.com
         + Strict-Transport-Security header
Browser: Stores HSTS policy for example.com

Subsequent Visits (with HSTS cached):
User types: example.com
Browser: Automatically upgrades to HTTPS (307 Internal Redirect)
         Never sends HTTP request
```

### HSTS Header Format

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Directive Explanation:**

| Directive | Description |
|-----------|-------------|
| `max-age` | How long (in seconds) the browser should remember to only use HTTPS |
| `includeSubDomains` | Apply HSTS to all subdomains |
| `preload` | Consent to be included in browser's preload list |

### HSTS Implementation

**Node.js/Express:**

```javascript
// Using helmet middleware
const helmet = require('helmet');

app.use(helmet.hsts({
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));

// Manual implementation
app.use((req, res, next) => {
  if (req.secure) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
});
```

**Nginx:**

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Other SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
}
```

**Apache:**

```apache
<VirtualHost *:443>
    ServerName example.com

    # Enable HSTS
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
</VirtualHost>
```

### HSTS Preload List

For maximum protection, submit your domain to the browser HSTS preload list:

1. Ensure your site meets the requirements:
   - Valid HTTPS certificate
   - Redirect all HTTP traffic to HTTPS
   - Serve HSTS header with `max-age` of at least 1 year
   - Include `includeSubDomains` directive
   - Include `preload` directive

2. Submit at https://hstspreload.org/

**Warning:** HSTS preload is difficult to undo. Ensure all subdomains support HTTPS before enabling `includeSubDomains`.

## X-Frame-Options

X-Frame-Options prevents your pages from being embedded in iframes on other sites, protecting against clickjacking attacks.

### Clickjacking Attack Example

```
Attacker's Page:
+------------------------------------------+
|  "Click here to win a prize!"            |
|  +------------------------------------+  |
|  |  [Invisible iframe of bank.com]   |  |
|  |  [Transfer $1000] <- User clicks  |  |
|  +------------------------------------+  |
+------------------------------------------+

User thinks they're clicking on the attacker's page,
but actually clicking on the hidden bank transfer button.
```

### X-Frame-Options Directives

```http
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN
X-Frame-Options: ALLOW-FROM https://trusted.com
```

| Directive | Description |
|-----------|-------------|
| `DENY` | Page cannot be displayed in any iframe |
| `SAMEORIGIN` | Page can only be framed by same origin |
| `ALLOW-FROM uri` | Page can be framed by specified origin (deprecated) |

### Implementation Examples

**Node.js/Express:**

```javascript
// Using helmet
const helmet = require('helmet');

app.use(helmet.frameguard({ action: 'deny' }));

// Or manual implementation
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
```

**Nginx:**

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
```

**Apache:**

```apache
Header always set X-Frame-Options "DENY"
```

### Modern Alternative: frame-ancestors

CSP's `frame-ancestors` directive is more flexible and should be used alongside X-Frame-Options:

```http
Content-Security-Policy: frame-ancestors 'none';
Content-Security-Policy: frame-ancestors 'self';
Content-Security-Policy: frame-ancestors 'self' https://trusted.com;
```

## X-Content-Type-Options

This header prevents browsers from MIME-sniffing a response away from the declared content-type, protecting against MIME confusion attacks.

### MIME Sniffing Attack

```
Attack Scenario:
1. Attacker uploads malicious.txt containing JavaScript
2. Server serves file with Content-Type: text/plain
3. Without nosniff, browser might "sniff" content and execute as JavaScript
4. With nosniff, browser strictly follows declared Content-Type
```

### Implementation

```http
X-Content-Type-Options: nosniff
```

**Node.js/Express:**

```javascript
// Using helmet
const helmet = require('helmet');
app.use(helmet.noSniff());

// Manual implementation
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

**Always set correct Content-Type:**

```javascript
// Ensure proper Content-Type for all responses
app.get('/api/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.json({ data: 'value' });
});

// For file downloads
app.get('/download/:filename', (req, res) => {
  const file = getFile(req.params.filename);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.send(file.content);
});
```

## Referrer-Policy

Referrer-Policy controls how much referrer information is included with requests, preventing sensitive URL information from leaking to third parties.

### Referrer Information Leakage

```
Problem Scenario:
User visits: https://example.com/account/user123/settings?token=secret

User clicks link to: https://external-site.com

Without Referrer-Policy:
External site receives full URL including sensitive token in Referer header
```

### Referrer-Policy Directives

| Directive | Description |
|-----------|-------------|
| `no-referrer` | Never send referrer |
| `no-referrer-when-downgrade` | No referrer on HTTPS to HTTP |
| `origin` | Send only origin (no path) |
| `origin-when-cross-origin` | Full URL same-origin, only origin cross-origin |
| `same-origin` | Full URL same-origin, no referrer cross-origin |
| `strict-origin` | Origin only, no referrer on downgrade |
| `strict-origin-when-cross-origin` | Full URL same-origin, origin cross-origin, no referrer on downgrade |
| `unsafe-url` | Always send full URL (not recommended) |

### Implementation

```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Node.js/Express:**

```javascript
// Using helmet
const helmet = require('helmet');

app.use(helmet.referrerPolicy({
  policy: 'strict-origin-when-cross-origin'
}));

// Manual implementation
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

**Per-link control with rel attribute:**

```html
<!-- No referrer for this specific link -->
<a href="https://external.com" rel="noreferrer">External Link</a>

<!-- Combine with noopener for security -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  External Link (new tab)
</a>
```

### Recommended Configuration by Use Case

```javascript
// E-commerce or sensitive data site
res.setHeader('Referrer-Policy', 'no-referrer');

// Standard web application
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

// Analytics-dependent site (less restrictive)
res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
```

## Permissions-Policy (formerly Feature-Policy)

Permissions-Policy controls which browser features and APIs can be used on your site, reducing the attack surface by disabling unnecessary features.

### Available Features

```
Camera & Microphone: camera, microphone
Location: geolocation
Sensors: accelerometer, gyroscope, magnetometer
Payment: payment
USB/Bluetooth: usb, bluetooth
Screen: fullscreen, display-capture
Others: autoplay, encrypted-media, picture-in-picture
```

### Implementation

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)
```

**Syntax Explanation:**

| Syntax | Meaning |
|--------|---------|
| `feature=()` | Disable feature entirely |
| `feature=(self)` | Allow only on same origin |
| `feature=(*)` | Allow on all origins |
| `feature=("https://example.com")` | Allow on specific origin |
| `feature=(self "https://example.com")` | Allow on self and specific origin |

**Node.js/Express:**

```javascript
// Using helmet (permittedCrossDomainPolicies)
const helmet = require('helmet');

app.use(helmet.permittedCrossDomainPolicies());

// Custom Permissions-Policy implementation
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'bluetooth=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
    'display-capture=()'
  ].join(', '));
  next();
});
```

**Nginx:**

```nginx
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(self)" always;
```

### Feature Control for Iframes

Control which features are available to embedded content:

```html
<!-- Restrictive iframe -->
<iframe
  src="https://embedded-content.com"
  allow="fullscreen"
  sandbox="allow-scripts allow-same-origin"
></iframe>

<!-- Allow specific features -->
<iframe
  src="https://video-player.com"
  allow="autoplay; encrypted-media; fullscreen"
></iframe>
```

## Complete Security Headers Configuration

### Express.js with Helmet

```javascript
const express = require('express');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();

// Generate nonce for each request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Configure all security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Add Permissions-Policy (not included in helmet by default)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'interest-cohort=()'
  ].join(', '));
  next();
});

app.listen(3000);
```

### Nginx Complete Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # CSP - adjust based on your application needs
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

### Apache Complete Configuration

```apache
<VirtualHost *:443>
    ServerName example.com

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/example.com.crt
    SSLCertificateKeyFile /etc/ssl/private/example.com.key
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1

    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; frame-ancestors 'none';"

    # Proxy to application
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>

<VirtualHost *:80>
    ServerName example.com
    Redirect permanent / https://example.com/
</VirtualHost>
```

## Testing Security Headers

### Online Tools

Use these tools to verify your security headers:

- **SecurityHeaders.com** - Comprehensive header analysis with grades
- **Mozilla Observatory** - In-depth security analysis
- **SSL Labs** - SSL/TLS configuration testing

### Command Line Testing

```bash
# View all response headers
curl -I https://example.com

# Check specific headers
curl -s -D - https://example.com -o /dev/null | grep -i "strict-transport\|content-security\|x-frame\|x-content-type\|referrer-policy\|permissions-policy"

# Detailed header inspection
curl -v https://example.com 2>&1 | grep -i "< "
```

### Automated Testing with JavaScript

```javascript
// Security headers checker script
const https = require('https');

function checkSecurityHeaders(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const headers = res.headers;
      const results = {
        url,
        headers: {},
        missing: [],
        grade: 'A'
      };

      const requiredHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy'
      ];

      requiredHeaders.forEach(header => {
        if (headers[header]) {
          results.headers[header] = headers[header];
        } else {
          results.missing.push(header);
          results.grade = results.missing.length > 2 ? 'C' :
                          results.missing.length > 0 ? 'B' : 'A';
        }
      });

      resolve(results);
    }).on('error', reject);
  });
}

// Usage
checkSecurityHeaders('https://example.com')
  .then(results => {
    console.log('Security Header Analysis:');
    console.log('========================');
    console.log('Grade:', results.grade);
    console.log('\nPresent Headers:');
    Object.entries(results.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.substring(0, 50)}...`);
    });
    console.log('\nMissing Headers:');
    results.missing.forEach(header => {
      console.log(`  - ${header}`);
    });
  })
  .catch(console.error);
```

## Common Issues and Solutions

### CSP Breaking Third-Party Scripts

**Problem:** Adding CSP breaks analytics, CDN scripts, or widgets.

**Solution:** Add specific sources to your CSP:

```http
Content-Security-Policy: script-src 'self'
                         https://www.google-analytics.com
                         https://cdn.example.com;
                         connect-src 'self'
                         https://www.google-analytics.com;
```

### Inline Scripts Not Working

**Problem:** CSP blocks inline `<script>` tags.

**Solution:** Use nonces or move scripts to external files:

```javascript
// Generate nonce server-side
const nonce = crypto.randomBytes(16).toString('base64');

// Add to CSP
`script-src 'self' 'nonce-${nonce}'`

// Add nonce attribute to script tags
`<script nonce="${nonce}">...</script>`
```

### HSTS Causing Issues in Development

**Problem:** HSTS cached for localhost during development.

**Solution:** Use different hostnames for development:

```javascript
// Only enable HSTS in production
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true
  }));
}
```

### Frame-Options Blocking Legitimate Embeds

**Problem:** X-Frame-Options blocks your content from being embedded where needed.

**Solution:** Use CSP frame-ancestors for more control:

```http
Content-Security-Policy: frame-ancestors 'self' https://trusted-partner.com;
```

## Best Practices Summary

1. **Start with Report-Only Mode**: Use `Content-Security-Policy-Report-Only` to identify issues before enforcing

2. **Layer Your Defenses**: Combine multiple headers for defense in depth

3. **Be Specific**: Avoid wildcards in CSP where possible

4. **Test Thoroughly**: Verify headers in all environments

5. **Monitor Violations**: Set up CSP reporting to catch issues

6. **Regular Audits**: Periodically review and update security headers

7. **Document Exceptions**: Keep track of why specific sources are allowed

8. **Progressive Enhancement**: Gradually tighten policies over time

```
Security Headers Implementation Checklist:

[ ] Content-Security-Policy configured and tested
[ ] Strict-Transport-Security enabled with adequate max-age
[ ] X-Frame-Options set (or frame-ancestors in CSP)
[ ] X-Content-Type-Options: nosniff enabled
[ ] Referrer-Policy configured appropriately
[ ] Permissions-Policy restricts unnecessary features
[ ] CSP violation reporting configured
[ ] Headers verified with online tools
[ ] Documentation updated for team reference
```

By implementing these security headers correctly, you create a robust first line of defense against many common web attacks, significantly improving your application's security posture.
