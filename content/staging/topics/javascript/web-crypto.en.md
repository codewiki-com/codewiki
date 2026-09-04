---
title: JavaScript Web Crypto API
description: Comprehensive guide to cryptographic operations in JavaScript using the Web Crypto API for secure hashing, encryption, signing, and key generation in modern web browsers.
track: javascript
section: browser
difficulty: advanced
tags:
  - cryptography
  - security
  - encryption
  - web-crypto
  - hashing
  - digital-signatures
  - key-management
status: imported
origin: old/src/content/docs/javascript/web-crypto.en.md
divergence: 0.174
issues:
  - title-lang-zh
  - missing-subcategory-en
  - order-mismatch
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: 50
  lastUpdated: 2026-01-07
---

## Concept Explanation

The Web Crypto API is a JavaScript interface providing cryptographic operations directly in web browsers. It allows developers to perform secure cryptographic tasks like hashing, encryption, decryption, digital signing, and key generation without relying on third-party libraries or server-side operations.

### Historical Context

Before the Web Crypto API, web applications had limited options for client-side cryptography:
- Dependency on external libraries (crypto-js, TweetNaCl.js)
- Performance limitations due to JavaScript's slower execution speed
- Security concerns with JavaScript-based implementations
- Need for server-side cryptographic operations

The Web Crypto API emerged as a W3C standard to provide secure, performant, and standardized cryptographic operations through native browser implementations. First supported in Firefox 34 (2014) and Chrome 37 (2014), it's now widely available across modern browsers.

### Problems It Solves

1. **Client-side encryption**: Encrypt sensitive data before transmission without exposing to servers
2. **Digital signatures**: Authenticate data origin and integrity
3. **Key derivation**: Derive encryption keys from passwords securely
4. **Secure hashing**: Compute cryptographic hashes for integrity verification
5. **Key management**: Generate and manage cryptographic keys safely

## Core Principles

### Web Crypto API Architecture

The Web Crypto API operates through the `SubtleCrypto` interface, accessed via `window.crypto.subtle`. It follows these principles:

```javascript
// SubtleCrypto provides all cryptographic operations
const cryptoApi = window.crypto.subtle;
```

### Supported Algorithms

The API supports four main algorithm categories:

- **Digest algorithms**: SHA-1, SHA-256, SHA-384, SHA-512
- **Encryption algorithms**: AES-GCM, AES-CBC, RSA-OAEP, ChaCha20-Poly1305
- **Signing algorithms**: RSASSA-PKCS1-v1_5, ECDSA, HMAC
- **Key derivation**: PBKDF2, HKDF, ECDH

### Key Objects

All cryptographic keys are represented as `CryptoKey` objects that:
- Cannot be extracted except as raw bytes (for security)
- Have metadata about their algorithms and usage
- Can be exported/imported for persistence
- Are bound to specific cryptographic operations

### Async-First Design

All Web Crypto operations are asynchronous, returning Promises:

```javascript
// All operations return Promises
const hash = await crypto.subtle.digest('SHA-256', data);
const signature = await crypto.subtle.sign('HMAC', key, data);
```

## Key Points

### Algorithm Selection

**Choosing the right algorithm:**
- **Hashing**: Use SHA-256 or SHA-512 (SHA-1 is deprecated)
- **Symmetric encryption**: AES-GCM for authenticated encryption
- **Asymmetric encryption**: RSA-OAEP or ECDH
- **Digital signatures**: ECDSA or RSASSA-PKCS1-v1_5
- **Key derivation**: PBKDF2 for password-based, HKDF for key material

### Key Derivation from Passwords

Password-based key derivation requires:
- Salt (random, unique per user/key)
- Iteration count (higher is slower but more secure)
- Hash algorithm (SHA-256 or SHA-512)
- Derived key length

### Authenticated Encryption

Always use authenticated encryption modes (AES-GCM) to ensure:
- Confidentiality: Data is encrypted
- Integrity: Data hasn't been tampered with
- Authenticity: Data comes from the expected source

### Security Considerations

- **Random data generation**: Use `crypto.getRandomValues()` for cryptographic randomness
- **Key storage**: Never expose keys; use IndexedDB or localStorage carefully
- **HTTPS requirement**: Web Crypto requires secure context (HTTPS)
- **Key reuse**: Some operations have restrictions on key reuse

### Browser Support

- All modern browsers support Web Crypto (Chrome 37+, Firefox 34+, Safari 11+, Edge 79+)
- Internet Explorer and older browsers require polyfills
- Check feature support before relying on specific algorithms

## Code Examples

### Example 1: Secure Password Hashing

```javascript
// Hash a password securely for storage
async function hashPassword(password) {
  // Convert password string to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

// Usage
const passwordHash = await hashPassword('mySecurePassword123');
console.log('Password hash:', passwordHash);
```

### Example 2: Key Derivation from Password (PBKDF2)

```javascript
// Derive encryption key from password
async function deriveKeyFromPassword(password, salt) {
  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false, // not extractable
    ['deriveKey']
  );

  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt, // Should be random, unique bytes
      iterations: 100000, // Higher is more secure but slower
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

// Usage
const salt = crypto.getRandomValues(new Uint8Array(16));
const encryptionKey = await deriveKeyFromPassword('myPassword', salt);
```

### Example 3: AES-GCM Encryption and Decryption

```javascript
// Encrypt data with AES-GCM
async function encryptData(plaintext, key) {
  // Generate random initialization vector (IV)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Return IV + ciphertext (IV must be sent with ciphertext)
  return {
    iv: Array.from(new Uint8Array(iv)),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}

// Decrypt data with AES-GCM
async function decryptData(encryptedData, key) {
  // Convert arrays back to typed arrays
  const iv = new Uint8Array(encryptedData.iv);
  const ciphertext = new Uint8Array(encryptedData.ciphertext);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  // Convert bytes to string
  return new TextDecoder().decode(decrypted);
}

// Usage
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true, // extractable
  ['encrypt', 'decrypt']
);

const encrypted = await encryptData('Secret message', key);
const decrypted = await decryptData(encrypted, key);
console.log('Decrypted:', decrypted); // 'Secret message'
```

### Example 4: Digital Signatures (ECDSA)

```javascript
// Generate ECDSA key pair
async function generateSigningKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['sign', 'verify']
  );

  return keyPair; // { publicKey, privateKey }
}

// Sign data
async function signData(data, privateKey) {
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256'
    },
    privateKey,
    new TextEncoder().encode(data)
  );

  return Array.from(new Uint8Array(signature));
}

// Verify signature
async function verifySignature(data, signature, publicKey) {
  const isValid = await crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: 'SHA-256'
    },
    publicKey,
    new Uint8Array(signature),
    new TextEncoder().encode(data)
  );

  return isValid;
}

// Usage
const { publicKey, privateKey } = await generateSigningKeyPair();
const data = 'Important document';
const signature = await signData(data, privateKey);
const isValid = await verifySignature(data, signature, publicKey);
console.log('Signature valid:', isValid); // true
```

### Example 5: HMAC Authentication

```javascript
// Create HMAC for message authentication
async function createHMAC(message, key) {
  const encoder = new TextEncoder();

  // Import key for HMAC
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  // Sign message
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    encoder.encode(message)
  );

  return Array.from(new Uint8Array(signature));
}

// Verify HMAC
async function verifyHMAC(message, signature, key) {
  const encoder = new TextEncoder();

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    hmacKey,
    new Uint8Array(signature),
    encoder.encode(message)
  );

  return isValid;
}

// Usage
const hmacKey = crypto.getRandomValues(new Uint8Array(32));
const message = 'Authenticate this message';
const hmac = await createHMAC(message, hmacKey);
const isAuthentic = await verifyHMAC(message, hmac, hmacKey);
console.log('Message authenticated:', isAuthentic); // true
```

### Example 6: Key Export and Import

```javascript
// Export key for storage or transmission
async function exportKey(key) {
  // Export as JWK (JSON Web Key)
  const jwk = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(jwk);
}

// Import key from storage
async function importKey(jwkString, algorithm, usage) {
  const jwk = JSON.parse(jwkString);

  const importedKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    algorithm,
    true, // extractable
    usage
  );

  return importedKey;
}

// Usage: Generate, export, and reimport a key
const originalKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

const exported = await exportKey(originalKey);
console.log('Exported key:', exported);

const reimported = await importKey(
  exported,
  { name: 'AES-GCM', length: 256 },
  ['encrypt', 'decrypt']
);
```

### Example 7: Complete Encrypted Communication Example

```javascript
// Complete encrypted message system
class EncryptedMessaging {
  constructor() {
    this.key = null;
  }

  // Setup: derive key from password
  async setupFromPassword(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt message
  async encrypt(message) {
    if (!this.key) throw new Error('Key not initialized');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      new TextEncoder().encode(message)
    );

    // Return combined data structure
    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext))
    };
  }

  // Decrypt message
  async decrypt(encrypted) {
    if (!this.key) throw new Error('Key not initialized');

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
      this.key,
      new Uint8Array(encrypted.ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }
}

// Usage
const messaging = new EncryptedMessaging();
const salt = crypto.getRandomValues(new Uint8Array(16));

await messaging.setupFromPassword('myPassword', salt);
const encrypted = await messaging.encrypt('Hello, World!');
const decrypted = await messaging.decrypt(encrypted);
console.log('Decrypted:', decrypted); // 'Hello, World!'
```

## Best Practices

### Use Authenticated Encryption

Always use AES-GCM or ChaCha20-Poly1305 for encryption to ensure authenticity:

```javascript
// Good: Authenticated encryption
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  plaintext
);

// Avoid: Unauthenticated encryption
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-CBC', iv },
  key,
  plaintext
);
```

### Generate Random Data Properly

Always use `crypto.getRandomValues()` for cryptographic randomness:

```javascript
// Good: Cryptographically secure randomness
const iv = crypto.getRandomValues(new Uint8Array(12));
const salt = crypto.getRandomValues(new Uint8Array(16));

// Avoid: JavaScript Math.random()
const badSalt = new Uint8Array(16).map(() => Math.random() * 256);
```

### Use Sufficient Key Derivation Iterations

Higher iteration counts (100,000+) provide better security against brute force:

```javascript
// Good: High iteration count
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    iterations: 100000, // or higher
    hash: 'SHA-256'
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

// Avoid: Low iteration count
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    iterations: 1000, // Too low
    hash: 'SHA-256'
  },
  // ...
);
```

### Never Expose Private Keys

Mark private keys as non-extractable and manage them securely:

```javascript
// Good: Non-extractable key
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false, // Not extractable
  ['encrypt', 'decrypt']
);

// Only extractable if you need to store it
const exportableKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true, // Extractable for storage
  ['encrypt', 'decrypt']
);
```

### Always Include IV with Ciphertext

Store or transmit IV alongside ciphertext:

```javascript
// Good: Include IV with ciphertext
const result = {
  iv: Array.from(iv),
  ciphertext: Array.from(new Uint8Array(ciphertext))
};

// Avoid: IV-less ciphertext
const result = {
  ciphertext: Array.from(new Uint8Array(ciphertext))
  // Where is the IV?
};
```

### Use HTTPS Only

Web Crypto API requires secure context (HTTPS):

```javascript
// This will throw if not HTTPS
if (!window.isSecureContext) {
  throw new Error('Web Crypto requires HTTPS');
}

if (!crypto.subtle) {
  throw new Error('Web Crypto API not available');
}
```

### Handle Promises Properly

All operations are async; use proper error handling:

```javascript
// Good: Proper async/await
async function encryptMessage(message, key) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(message)
    );
    return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

// Avoid: Unhandled promises
const encrypted = crypto.subtle.encrypt(...); // Missing await/then
```

## Common Pitfalls

### Reusing IVs with Same Key

Using the same IV with the same key breaks GCM security:

```javascript
// CRITICAL: Never do this
const key = await generateKey();
for (const message of messages) {
  const iv = new Uint8Array(12); // All zeros - WRONG!
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(message)
  );
}

// Correct: Generate unique IV each time
const key = await generateKey();
for (const message of messages) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Random - CORRECT!
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(message)
  );
}
```

### Weak Passwords Without Salt

Deriving keys from weak passwords without salt is vulnerable:

```javascript
// Wrong: No salt
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: new Uint8Array(16), // All zeros
    iterations: 100000,
    hash: 'SHA-256'
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

// Correct: Random salt
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: salt,
    iterations: 100000,
    hash: 'SHA-256'
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### Forgetting to Store Salt and IV

IVs and salts must be stored/transmitted with ciphertext:

```javascript
// Wrong: Lost IV and salt
async function encrypt(message, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(message)
  );

  return ciphertext; // Salt and IV lost!
}

// Correct: Include salt and IV
async function encrypt(message, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(message)
  );

  return {
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}
```

### Ignoring Algorithm Constraints

Some keys can only be used for specific operations:

```javascript
// Wrong: Using verification key for signing
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
);

// This will fail - publicKey cannot sign
await crypto.subtle.sign(
  { name: 'ECDSA', hash: 'SHA-256' },
  publicKey, // Error: key is not valid for signing
  data
);

// Correct: Use privateKey for signing
await crypto.subtle.sign(
  { name: 'ECDSA', hash: 'SHA-256' },
  privateKey, // Correct
  data
);
```

### Not Checking Browser Support

Assuming Web Crypto API is available in all browsers:

```javascript
// Wrong: No feature detection
const hash = await crypto.subtle.digest('SHA-256', data);

// Correct: Feature detection
if (!window.isSecureContext || !crypto.subtle) {
  throw new Error('Web Crypto API not available in this browser');
}

const hash = await crypto.subtle.digest('SHA-256', data);
```

### Synchronous Operations on Large Data

Web Crypto is async; large operations block less than synchronous alternatives:

```javascript
// Inefficient: Could block UI with large data
const hash = await crypto.subtle.digest('SHA-256', largeArrayBuffer);

// Better: Chunking large data if needed
async function hashLargeData(data, chunkSize = 1024 * 1024) {
  // For most use cases, just use the API directly
  // It handles large data efficiently
  const hash = await crypto.subtle.digest('SHA-256', data);
  return hash;
}
```

## Performance Considerations

### Key Generation Performance

Key generation varies by algorithm:

```javascript
// Fast: AES key generation (~instant)
const aesKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
); // ~instant

// Slow: RSA key generation (several seconds)
const rsaKey = await crypto.subtle.generateKey(
  {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  },
  true,
  ['encrypt', 'decrypt']
); // ~3-5 seconds

// Moderate: ECDSA key generation (~instant for P-256)
const ecKey = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
); // ~instant
```

### Operation Complexity

Operations have different computational costs:

```javascript
// Cost: O(n) - proportional to data size
const hash = await crypto.subtle.digest('SHA-256', data);

// Cost: O(n) - proportional to data size
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

// Cost: O(iterations) - configurable
const derivedKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    iterations: 100000, // More iterations = slower
    hash: 'SHA-256'
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### Caching and Reuse

Cache derived keys and public keys to improve performance:

```javascript
class CryptoManager {
  constructor() {
    this.keyCache = new Map();
    this.publicKeyCache = new Map();
  }

  async getOrCreateKey(password, salt) {
    const cacheKey = `${password}:${Buffer.from(salt).toString('hex')}`;

    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    const key = await deriveKeyFromPassword(password, salt);
    this.keyCache.set(cacheKey, key);
    return key;
  }

  async cachePublicKey(id, publicKey) {
    this.publicKeyCache.set(id, publicKey);
  }

  async getPublicKey(id) {
    return this.publicKeyCache.get(id);
  }
}
```

### Async Considerations

All operations are async; batch operations efficiently:

```javascript
// Inefficient: Sequential encryption
for (const message of messages) {
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    new TextEncoder().encode(message)
  );
  results.push(encrypted);
}

// Better: Parallel encryption
const promises = messages.map(message =>
  crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    new TextEncoder().encode(message)
  )
);
const results = await Promise.all(promises);
```

## Real-world Scenarios

### Scenario 1: Secure Password Storage

```javascript
// Store password hash in database
async function registerUser(username, password) {
  // Hash password before storing
  const hashedPassword = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );

  const passwordHash = Array.from(new Uint8Array(hashedPassword))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Store username and passwordHash in database
  await db.users.insert({
    username,
    passwordHash,
    createdAt: new Date()
  });
}

// Verify password during login
async function loginUser(username, password) {
  const user = await db.users.findOne({ username });

  const hashedPassword = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );

  const passwordHash = Array.from(new Uint8Array(hashedPassword))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (user.passwordHash === passwordHash) {
    return { success: true, user };
  }
  return { success: false, error: 'Invalid credentials' };
}
```

### Scenario 2: End-to-End Encrypted Chat

```javascript
class E2EEncryptedChat {
  async setupUser(username, password) {
    // Derive encryption key from password
    this.salt = crypto.getRandomValues(new Uint8Array(16));
    this.key = await this.deriveKey(password);
  }

  async deriveKey(password) {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptMessage(message) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      new TextEncoder().encode(message)
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      timestamp: Date.now()
    };
  }

  async decryptMessage(encrypted) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
      this.key,
      new Uint8Array(encrypted.ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }
}
```

### Scenario 3: Document Signing and Verification

```javascript
class DocumentSigner {
  async generateKeyPair() {
    return await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
  }

  async signDocument(documentContent, privateKey) {
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      new TextEncoder().encode(documentContent)
    );

    return {
      content: documentContent,
      signature: Array.from(new Uint8Array(signature)),
      timestamp: Date.now()
    };
  }

  async verifyDocument(signedDocument, publicKey) {
    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      new Uint8Array(signedDocument.signature),
      new TextEncoder().encode(signedDocument.content)
    );

    return isValid;
  }

  async exportPublicKey(publicKey) {
    return await crypto.subtle.exportKey('spki', publicKey);
  }

  async importPublicKey(publicKeyData) {
    return await crypto.subtle.importKey(
      'spki',
      publicKeyData,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
  }
}
```

### Scenario 4: Secure File Encryption

```javascript
class FileEncryption {
  async encryptFile(file, password) {
    // Generate salt for this encryption
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive key from password
    const key = await this.deriveKeyFromPassword(password, salt);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Encrypt file
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileData
    );

    // Combine salt, IV, and encrypted data
    const combined = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedData.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.byteLength);
    combined.set(new Uint8Array(encryptedData), salt.byteLength + iv.byteLength);

    return new Blob([combined], { type: 'application/octet-stream' });
  }

  async decryptFile(encryptedBlob, password) {
    // Read blob as ArrayBuffer
    const data = await encryptedBlob.arrayBuffer();
    const view = new Uint8Array(data);

    // Extract salt, IV, and ciphertext
    const salt = view.slice(0, 16);
    const iv = view.slice(16, 28);
    const ciphertext = view.slice(28);

    // Derive key from password and salt
    const key = await this.deriveKeyFromPassword(password, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new Blob([decrypted]);
  }

  async deriveKeyFromPassword(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  }
}
```

## Interview Points

### Q1: What is the Web Crypto API and why should we use it?

**Answer:** The Web Crypto API is a W3C standard that provides cryptographic operations (hashing, encryption, signing, key generation) directly in browsers through native implementations. We use it because it's secure (hardware-accelerated), performant, and standardized compared to JavaScript-only cryptography libraries.

### Q2: Explain the difference between AES-GCM and AES-CBC

**Answer:** AES-GCM (Galois/Counter Mode) provides authenticated encryption (confidentiality + integrity + authenticity) in a single operation. AES-CBC (Cipher Block Chaining) only provides confidentiality and requires additional HMAC for authentication. GCM is preferred for security and efficiency.

### Q3: Why is IV reuse with the same key critical?

**Answer:** Reusing the same IV with the same key in GCM completely breaks security. The same IV+key combination produces the same keystream, so XORing different plaintexts with the same keystream reveals their XOR, allowing cryptanalysis. Each encryption with the same key must use a unique IV.

### Q4: How do you derive encryption keys from passwords securely?

**Answer:** Use PBKDF2 (Password-Based Key Derivation Function) with:
- Unique random salt (16+ bytes) generated per user/key
- High iteration count (100,000+) to slow down brute force
- Strong hash algorithm (SHA-256 or SHA-512)
- Appropriate key length (256 bits for AES-256)

### Q5: What's the difference between sign/verify and encrypt/decrypt?

**Answer:**
- **Sign/Verify**: Asymmetric operations using private key (sign) and public key (verify). Proves authorship and integrity but not confidentiality.
- **Encrypt/Decrypt**: Can be symmetric or asymmetric. Symmetric (AES) encrypts/decrypts with same key. Asymmetric (RSA) encrypts with public key, decrypts with private key.

### Q6: Why must IV be transmitted with ciphertext?

**Answer:** The receiver needs the IV to decrypt. Without it, they cannot reconstruct the cipher state. IV doesn't need to be secret (only unique per encryption), so it can be sent unencrypted alongside ciphertext.

### Q7: How do you export and import crypto keys?

**Answer:** Use `exportKey()` with formats like 'jwk' (JSON Web Key) or 'spki' (Subject Public Key Info), then `importKey()` to restore. This allows key storage, transmission, and sharing while maintaining security constraints.

### Q8: What are the security requirements for Web Crypto API?

**Answer:**
- HTTPS or secure context required
- Modern browser support (Chrome 37+, Firefox 34+, Safari 11+)
- All operations are asynchronous
- Keys are bound to specific algorithms and usages

### Q9: Explain the SubtleCrypto interface

**Answer:** SubtleCrypto is the main interface for crypto operations, accessed via `crypto.subtle`. Methods include: `encrypt()`, `decrypt()`, `sign()`, `verify()`, `generateKey()`, `deriveKey()`, `digest()`, `importKey()`, `exportKey()`, etc. All return Promises.

### Q10: How do you prevent timing attacks?

**Answer:** Web Crypto API implementations are designed to be timing-safe. Always use `verify()` for signature/authentication verification rather than manual comparison, which could leak timing information.

## Further Reading

### Official Documentation
- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [W3C Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [WHATWG Streams Standard](https://streams.spec.whatwg.org/)

### Security Standards and References
- [NIST Special Publication 800-38D (GCM Mode)](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [RFC 5869: HKDF](https://tools.ietf.org/html/rfc5869)
- [RFC 2898: PBKDF2](https://tools.ietf.org/html/rfc2898)

### Related APIs and Libraries
- [Crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
- [TweetNaCl.js](https://tweetnacl.js.org/) - Pure JavaScript NaCl implementation
- [TweetNaCl.js Documentation](https://github.com/dchest/tweetnacl-js)
- [libsodium](https://libsodium.gitbook.io/) - Modern cryptographic library

### Educational Resources
- [Practical Cryptography for Developers](https://cryptobook.nakov.com/)
- [Cryptography Courses - Coursera](https://www.coursera.org/search?query=cryptography)
- [Brilliant.org - Cryptography](https://brilliant.org/courses/cryptography/)

### Articles and Tutorials
- [Web Crypto API Examples - Auth0](https://auth0.com/blog/web-crypto-api-examples/)
- [Using the Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [End-to-End Encryption in Web Applications](https://blog.filippo.io/the-ec-cryptography-that-nobody-needed/)
- [Encryption in JavaScript - Kyle Simpson](https://github.com/getify/areading-list/blob/master/2014/08/encryption-javascript.md)

### Key Derivation and Password Security
- [Argon2 - Password Hashing Competition Winner](https://github.com/P-H-C/phc-winner-argon2)
- [scrypt - Key Derivation](https://en.wikipedia.org/wiki/Scrypt)
- [Password Authentication and Key Derivation - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### Tools and Testing
- [Cryptii - Online Crypto Tool](https://cryptii.com/)
- [CyberChef - Data Transformation](https://gchq.github.io/CyberChef/)
- [VirusTotal](https://www.virustotal.com/) - Security analysis
