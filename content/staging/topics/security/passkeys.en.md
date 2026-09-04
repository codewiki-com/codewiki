---
title: Passkeys Passwordless Authentication
description: A comprehensive guide to Passkeys - the future of passwordless authentication using FIDO2/WebAuthn
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - Passkeys
  - WebAuthn
  - FIDO2
  - Passwordless
  - Authentication
  - Security
status: imported
origin: old/src/content/docs/security/passkeys.en.md
divergence: 0.218
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 11
  lastUpdated: 2026-01-20
---

Passkeys represent a fundamental shift in how we authenticate users online. Built on the FIDO2 and WebAuthn standards, passkeys replace traditional passwords with cryptographic key pairs that are more secure, easier to use, and resistant to phishing attacks. This comprehensive guide covers everything you need to know about implementing passkeys in your applications.

## Concept Explanation

### What are Passkeys?

Passkeys are a passwordless authentication technology based on public key cryptography. Instead of requiring users to create and remember passwords, passkeys use cryptographic key pairs stored securely on user devices. The private key never leaves the device, while the public key is stored on the server.

When a user authenticates, their device signs a challenge from the server using the private key. The server verifies this signature using the stored public key, confirming the user's identity without transmitting any secrets.

### Historical Background

The journey to passkeys began with the formation of the FIDO (Fast IDentity Online) Alliance in 2012:

| Year | Milestone |
|------|-----------|
| 2012 | FIDO Alliance founded by PayPal, Lenovo, and others |
| 2014 | FIDO U2F and UAF specifications released |
| 2018 | WebAuthn becomes W3C Candidate Recommendation |
| 2019 | WebAuthn becomes official W3C standard |
| 2022 | Apple, Google, and Microsoft announce passkey support |
| 2023 | Major platforms roll out passkey implementations |
| 2024+ | Widespread passkey adoption across industries |

### The Password Problem

Traditional passwords suffer from numerous security and usability issues:

**Security Issues:**
- Password reuse across multiple sites
- Vulnerable to phishing attacks
- Susceptible to credential stuffing
- Stored passwords can be breached
- Social engineering attacks

**Usability Issues:**
- Users must remember complex passwords
- Frequent password resets
- Password fatigue leads to weak choices
- Different requirements across services

**Passkeys vs. Passwords:**

| Aspect | Passwords | Passkeys |
|--------|-----------|----------|
| Phishing Resistance | None | Built-in (origin-bound) |
| Credential Reuse | Common problem | Unique per service |
| Memorization | Required | Not needed |
| Server Breach Risk | High (even with hashing) | Minimal (public keys only) |
| Man-in-the-Middle | Vulnerable | Protected |
| User Experience | Friction-heavy | Seamless |

## Core Principles

### How Passkeys Work

Passkeys utilize asymmetric cryptography where:

1. **Key Pair Generation**: A unique key pair (public/private) is generated for each service
2. **Private Key Storage**: Stored securely in hardware (TPM, Secure Enclave) or platform authenticator
3. **Public Key Registration**: Sent to the server during registration
4. **Challenge-Response**: Server issues challenges; device signs with private key
5. **Verification**: Server verifies signature with stored public key

```
┌─────────────────────────────────────────────────────────────────┐
│                    Passkey Authentication Flow                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                              ┌──────────────────┐ │
│  │  User    │                              │     Server       │ │
│  │  Device  │                              │                  │ │
│  └────┬─────┘                              └────────┬─────────┘ │
│       │                                             │           │
│       │  1. Login Request                          │           │
│       │────────────────────────────────────────────>│           │
│       │                                             │           │
│       │  2. Challenge (random nonce)               │           │
│       │<────────────────────────────────────────────│           │
│       │                                             │           │
│       │  3. User Verification (biometric/PIN)      │           │
│       │  ┌─────────────────────────────────┐       │           │
│       │  │ Sign challenge with private key │       │           │
│       │  └─────────────────────────────────┘       │           │
│       │                                             │           │
│       │  4. Signed Assertion                       │           │
│       │────────────────────────────────────────────>│           │
│       │                                             │           │
│       │                    5. Verify signature with │           │
│       │                       stored public key    │           │
│       │                                             │           │
│       │  6. Authentication Success                 │           │
│       │<────────────────────────────────────────────│           │
│       │                                             │           │
└─────────────────────────────────────────────────────────────────┘
```

### WebAuthn Protocol

WebAuthn (Web Authentication) is the W3C standard that defines how web applications communicate with authenticators. It provides two main ceremonies:

**Registration Ceremony:**
1. Server generates and sends `PublicKeyCredentialCreationOptions`
2. Browser calls `navigator.credentials.create()`
3. Authenticator creates new credential
4. Browser returns attestation to server
5. Server validates and stores credential

**Authentication Ceremony:**
1. Server generates and sends `PublicKeyCredentialRequestOptions`
2. Browser calls `navigator.credentials.get()`
3. Authenticator signs the challenge
4. Browser returns assertion to server
5. Server validates signature

### FIDO2 Standard Components

FIDO2 consists of two specifications:

| Component | Description | Role |
|-----------|-------------|------|
| WebAuthn | W3C API specification | Browser/app interface |
| CTAP2 | Client to Authenticator Protocol | Device communication |

**Authenticator Types:**

| Type | Description | Examples |
|------|-------------|----------|
| Platform | Built into device | Touch ID, Face ID, Windows Hello |
| Roaming | External devices | YubiKey, security keys |
| Hybrid | Cross-device | Phone as authenticator for laptop |

### Cryptographic Foundation

Passkeys typically use:

- **ECDSA with P-256** (ES256): Most common
- **RSA with PKCS#1 v1.5** (RS256): Legacy support
- **EdDSA with Ed25519**: Emerging standard

```javascript
// Example supported algorithms
const pubKeyCredParams = [
  { alg: -7, type: "public-key" },   // ES256 (ECDSA w/ SHA-256)
  { alg: -257, type: "public-key" }, // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
  { alg: -8, type: "public-key" },   // EdDSA
];
```

## Core Components

### Registration Flow

The complete registration process involves several key steps:

```javascript
// 1. Get registration options from server
async function startRegistration(username) {
  const response = await fetch('/api/auth/register/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const options = await response.json();

  // Decode base64url encoded values
  options.challenge = base64urlToBuffer(options.challenge);
  options.user.id = base64urlToBuffer(options.user.id);

  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map(cred => ({
      ...cred,
      id: base64urlToBuffer(cred.id)
    }));
  }

  return options;
}

// 2. Create credential using WebAuthn API
async function createCredential(options) {
  try {
    const credential = await navigator.credentials.create({
      publicKey: options
    });

    return {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        attestationObject: bufferToBase64url(credential.response.attestationObject),
        transports: credential.response.getTransports?.() || []
      }
    };
  } catch (error) {
    if (error.name === 'InvalidStateError') {
      throw new Error('This authenticator is already registered');
    }
    if (error.name === 'NotAllowedError') {
      throw new Error('Registration was cancelled or timed out');
    }
    throw error;
  }
}

// 3. Send credential to server for verification and storage
async function completeRegistration(credential) {
  const response = await fetch('/api/auth/register/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential)
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}
```

### Authentication Flow

The authentication process follows a similar pattern:

```javascript
// 1. Get authentication options from server
async function startAuthentication(username) {
  const response = await fetch('/api/auth/login/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const options = await response.json();

  // Decode challenge
  options.challenge = base64urlToBuffer(options.challenge);

  // Decode allowed credentials
  if (options.allowCredentials) {
    options.allowCredentials = options.allowCredentials.map(cred => ({
      ...cred,
      id: base64urlToBuffer(cred.id)
    }));
  }

  return options;
}

// 2. Get assertion using WebAuthn API
async function getAssertion(options) {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: options
    });

    return {
      id: assertion.id,
      rawId: bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
        signature: bufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle
          ? bufferToBase64url(assertion.response.userHandle)
          : null
      }
    };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Authentication was cancelled or timed out');
    }
    throw error;
  }
}

// 3. Verify assertion on server
async function completeAuthentication(assertion) {
  const response = await fetch('/api/auth/login/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assertion)
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  return response.json();
}
```

### Cross-Device Synchronization

Modern passkey implementations support syncing across devices:

**Platform-Specific Sync:**

| Platform | Sync Method | Scope |
|----------|-------------|-------|
| Apple | iCloud Keychain | Apple devices |
| Google | Google Password Manager | Android/Chrome |
| Microsoft | Microsoft Account | Windows devices |

**Hybrid Authentication (Cross-Device):**

```javascript
// Enable cross-device authentication
const options = {
  publicKey: {
    // ... other options
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // Allow external authenticators
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  }
};

// QR code + Bluetooth proximity enables phone as authenticator
```

### Discoverable Credentials (Resident Keys)

Discoverable credentials allow passwordless authentication without username input:

```javascript
// Registration with discoverable credential
const registrationOptions = {
  publicKey: {
    // ... other options
    authenticatorSelection: {
      residentKey: 'required', // Force discoverable credential
      userVerification: 'required'
    }
  }
};

// Authentication without username (credential discovery)
const authenticationOptions = {
  publicKey: {
    challenge: challenge,
    rpId: 'example.com',
    userVerification: 'required',
    // No allowCredentials - let authenticator discover
  }
};
```

## Code Examples

### Complete Frontend Implementation

```javascript
/**
 * Passkey Manager - Complete Frontend Implementation
 */
class PasskeyManager {
  constructor(config = {}) {
    this.rpId = config.rpId || window.location.hostname;
    this.rpName = config.rpName || 'My Application';
    this.apiBase = config.apiBase || '/api/auth';
    this.timeout = config.timeout || 60000;
  }

  /**
   * Check if WebAuthn is supported
   */
  static isSupported() {
    return !!(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === 'function'
    );
  }

  /**
   * Check if platform authenticator is available
   */
  static async isPlatformAuthenticatorAvailable() {
    if (!this.isSupported()) return false;
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  /**
   * Check if conditional mediation is supported (autofill)
   */
  static async isConditionalMediationSupported() {
    if (!this.isSupported()) return false;
    return PublicKeyCredential.isConditionalMediationAvailable?.() ?? false;
  }

  /**
   * Register a new passkey
   */
  async register(username, displayName) {
    // 1. Request options from server
    const optionsResponse = await fetch(`${this.apiBase}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName })
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get registration options');
    }

    const options = await optionsResponse.json();

    // 2. Prepare options for WebAuthn API
    const publicKeyOptions = {
      challenge: this._base64urlToBuffer(options.challenge),
      rp: {
        id: options.rp.id,
        name: options.rp.name
      },
      user: {
        id: this._base64urlToBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout || this.timeout,
      excludeCredentials: (options.excludeCredentials || []).map(cred => ({
        id: this._base64urlToBuffer(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      authenticatorSelection: options.authenticatorSelection || {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required'
      },
      attestation: options.attestation || 'none'
    };

    // 3. Create credential
    let credential;
    try {
      credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      });
    } catch (error) {
      throw this._handleWebAuthnError(error);
    }

    // 4. Prepare response for server
    const credentialResponse = {
      id: credential.id,
      rawId: this._bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this._bufferToBase64url(credential.response.clientDataJSON),
        attestationObject: this._bufferToBase64url(credential.response.attestationObject),
        transports: credential.response.getTransports?.() || [],
        publicKeyAlgorithm: credential.response.getPublicKeyAlgorithm?.(),
        publicKey: credential.response.getPublicKey?.()
          ? this._bufferToBase64url(credential.response.getPublicKey())
          : undefined,
        authenticatorData: credential.response.getAuthenticatorData?.()
          ? this._bufferToBase64url(credential.response.getAuthenticatorData())
          : undefined
      },
      clientExtensionResults: credential.getClientExtensionResults()
    };

    // 5. Complete registration on server
    const verifyResponse = await fetch(`${this.apiBase}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentialResponse)
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || 'Registration verification failed');
    }

    return verifyResponse.json();
  }

  /**
   * Authenticate with passkey
   */
  async authenticate(username = null) {
    // 1. Request options from server
    const optionsResponse = await fetch(`${this.apiBase}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get authentication options');
    }

    const options = await optionsResponse.json();

    // 2. Prepare options for WebAuthn API
    const publicKeyOptions = {
      challenge: this._base64urlToBuffer(options.challenge),
      rpId: options.rpId || this.rpId,
      timeout: options.timeout || this.timeout,
      userVerification: options.userVerification || 'required',
      allowCredentials: (options.allowCredentials || []).map(cred => ({
        id: this._base64urlToBuffer(cred.id),
        type: cred.type,
        transports: cred.transports
      }))
    };

    // 3. Get assertion
    let assertion;
    try {
      assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      });
    } catch (error) {
      throw this._handleWebAuthnError(error);
    }

    // 4. Prepare response for server
    const assertionResponse = {
      id: assertion.id,
      rawId: this._bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: this._bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: this._bufferToBase64url(assertion.response.authenticatorData),
        signature: this._bufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle
          ? this._bufferToBase64url(assertion.response.userHandle)
          : null
      },
      clientExtensionResults: assertion.getClientExtensionResults()
    };

    // 5. Verify assertion on server
    const verifyResponse = await fetch(`${this.apiBase}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assertionResponse)
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || 'Authentication verification failed');
    }

    return verifyResponse.json();
  }

  /**
   * Authenticate with conditional UI (autofill)
   */
  async authenticateWithConditionalUI(abortController = null) {
    if (!await PasskeyManager.isConditionalMediationSupported()) {
      throw new Error('Conditional mediation is not supported');
    }

    const optionsResponse = await fetch(`${this.apiBase}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditional: true })
    });

    const options = await optionsResponse.json();

    const publicKeyOptions = {
      challenge: this._base64urlToBuffer(options.challenge),
      rpId: options.rpId || this.rpId,
      timeout: options.timeout || this.timeout,
      userVerification: options.userVerification || 'required',
      allowCredentials: [] // Empty for discoverable credentials
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: 'conditional',
        signal: abortController?.signal
      });

      // Process assertion same as regular authentication
      return this._processAssertion(assertion);
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // User navigated away or cancelled
      }
      throw this._handleWebAuthnError(error);
    }
  }

  async _processAssertion(assertion) {
    const assertionResponse = {
      id: assertion.id,
      rawId: this._bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: this._bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: this._bufferToBase64url(assertion.response.authenticatorData),
        signature: this._bufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle
          ? this._bufferToBase64url(assertion.response.userHandle)
          : null
      }
    };

    const verifyResponse = await fetch(`${this.apiBase}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assertionResponse)
    });

    if (!verifyResponse.ok) {
      throw new Error('Authentication verification failed');
    }

    return verifyResponse.json();
  }

  // Utility methods
  _base64urlToBuffer(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  _bufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  _handleWebAuthnError(error) {
    const errorMessages = {
      'NotAllowedError': 'The operation was cancelled or timed out',
      'InvalidStateError': 'The authenticator is already registered',
      'NotSupportedError': 'The authenticator does not support the requested operation',
      'SecurityError': 'The operation is not allowed in this context',
      'AbortError': 'The operation was aborted',
      'ConstraintError': 'The authenticator does not meet the requirements'
    };

    const message = errorMessages[error.name] || error.message;
    const wrappedError = new Error(message);
    wrappedError.originalError = error;
    return wrappedError;
  }
}

// Export for module usage
export { PasskeyManager };
```

### Complete Backend Implementation (Node.js)

```javascript
/**
 * Passkey Server Implementation with @simplewebauthn/server
 */
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const crypto = require('crypto');

// Configuration
const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = process.env.RP_NAME || 'My Application';
const ORIGIN = process.env.ORIGIN || `https://${RP_ID}`;

// In-memory store (use database in production)
const users = new Map();
const credentials = new Map();
const challenges = new Map();

/**
 * User and Credential Management
 */
function createUser(username, displayName) {
  const userId = crypto.randomBytes(32);
  const user = {
    id: userId,
    username,
    displayName,
    credentials: []
  };
  users.set(username, user);
  return user;
}

function getUser(username) {
  return users.get(username);
}

function getUserById(userId) {
  for (const user of users.values()) {
    if (Buffer.compare(user.id, userId) === 0) {
      return user;
    }
  }
  return null;
}

function addCredentialToUser(user, credential) {
  const credentialData = {
    id: credential.id,
    publicKey: credential.publicKey,
    counter: credential.counter,
    transports: credential.transports,
    createdAt: new Date(),
    lastUsed: new Date(),
    deviceType: credential.deviceType,
    backedUp: credential.backedUp
  };

  user.credentials.push(credentialData);
  credentials.set(credential.id, { userId: user.id, ...credentialData });
  return credentialData;
}

/**
 * Registration Endpoints
 */
async function handleRegistrationOptions(req, res) {
  const { username, displayName } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Get or create user
  let user = getUser(username);
  if (!user) {
    user = createUser(username, displayName || username);
  }

  // Generate registration options
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: user.id,
    userName: username,
    userDisplayName: user.displayName,

    // Timeout in milliseconds
    timeout: 60000,

    // Attestation preference
    attestationType: 'none', // 'direct', 'indirect', 'enterprise'

    // Exclude existing credentials to prevent re-registration
    excludeCredentials: user.credentials.map(cred => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports
    })),

    // Authenticator selection criteria
    authenticatorSelection: {
      // 'platform' for built-in, 'cross-platform' for security keys
      authenticatorAttachment: 'platform',
      // Require discoverable credentials (resident keys)
      residentKey: 'preferred',
      // Require user verification (biometric/PIN)
      userVerification: 'required'
    },

    // Supported algorithms (in preference order)
    supportedAlgorithmIDs: [-7, -257, -8] // ES256, RS256, EdDSA
  });

  // Store challenge for verification
  challenges.set(username, {
    challenge: options.challenge,
    type: 'registration',
    timestamp: Date.now()
  });

  res.json(options);
}

async function handleRegistrationVerification(req, res) {
  const { username } = req.body;

  // Get stored challenge
  const storedChallenge = challenges.get(username);
  if (!storedChallenge || storedChallenge.type !== 'registration') {
    return res.status(400).json({ error: 'No registration in progress' });
  }

  // Check challenge expiry (5 minutes)
  if (Date.now() - storedChallenge.timestamp > 300000) {
    challenges.delete(username);
    return res.status(400).json({ error: 'Registration challenge expired' });
  }

  const user = getUser(username);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Store the credential
      const credential = addCredentialToUser(user, {
        id: credentialID,
        publicKey: credentialPublicKey,
        counter,
        transports: req.body.response.transports || [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp
      });

      // Clear challenge
      challenges.delete(username);

      res.json({
        verified: true,
        credential: {
          id: Buffer.from(credentialID).toString('base64url'),
          createdAt: credential.createdAt
        }
      });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Authentication Endpoints
 */
async function handleAuthenticationOptions(req, res) {
  const { username, conditional } = req.body;

  // Build allowed credentials list
  let allowCredentials = [];

  if (username) {
    const user = getUser(username);
    if (user) {
      allowCredentials = user.credentials.map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: cred.transports
      }));
    }
  }

  // Generate authentication options
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    timeout: 60000,
    userVerification: 'required',
    // Empty allowCredentials enables discoverable credentials
    allowCredentials: conditional ? [] : allowCredentials
  });

  // Store challenge
  const challengeKey = username || `conditional_${crypto.randomBytes(16).toString('hex')}`;
  challenges.set(challengeKey, {
    challenge: options.challenge,
    type: 'authentication',
    timestamp: Date.now(),
    conditional: !!conditional
  });

  // Return session identifier for conditional authentication
  if (conditional) {
    options.sessionId = challengeKey;
  }

  res.json(options);
}

async function handleAuthenticationVerification(req, res) {
  const { sessionId } = req.body;

  // Find the challenge (by username from userHandle or sessionId)
  let challengeKey = sessionId;
  let storedChallenge = challenges.get(challengeKey);

  // If using discoverable credentials, find by userHandle
  if (!storedChallenge && req.body.response.userHandle) {
    const userHandle = Buffer.from(req.body.response.userHandle, 'base64url');
    const user = getUserById(userHandle);
    if (user) {
      challengeKey = user.username;
      storedChallenge = challenges.get(challengeKey);
    }
  }

  if (!storedChallenge || storedChallenge.type !== 'authentication') {
    return res.status(400).json({ error: 'No authentication in progress' });
  }

  // Check challenge expiry
  if (Date.now() - storedChallenge.timestamp > 300000) {
    challenges.delete(challengeKey);
    return res.status(400).json({ error: 'Authentication challenge expired' });
  }

  // Find the credential
  const credentialId = Buffer.from(req.body.rawId, 'base64url');
  let credential = null;
  let user = null;

  for (const cred of credentials.values()) {
    if (Buffer.compare(Buffer.from(cred.id), credentialId) === 0) {
      credential = cred;
      user = getUserById(cred.userId);
      break;
    }
  }

  if (!credential || !user) {
    return res.status(400).json({ error: 'Credential not found' });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: credential.id,
        credentialPublicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports
      },
      requireUserVerification: true
    });

    if (verification.verified) {
      // Update counter to prevent replay attacks
      credential.counter = verification.authenticationInfo.newCounter;
      credential.lastUsed = new Date();

      // Clear challenge
      challenges.delete(challengeKey);

      // Create session/JWT
      const token = generateSessionToken(user);

      res.json({
        verified: true,
        user: {
          id: Buffer.from(user.id).toString('base64url'),
          username: user.username,
          displayName: user.displayName
        },
        token
      });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(400).json({ error: error.message });
  }
}

function generateSessionToken(user) {
  // In production, use proper JWT or session management
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: Buffer.from(user.id).toString('base64url'), username: user.username },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
}

// Express routes
const express = require('express');
const router = express.Router();

router.post('/register/options', handleRegistrationOptions);
router.post('/register/verify', handleRegistrationVerification);
router.post('/login/options', handleAuthenticationOptions);
router.post('/login/verify', handleAuthenticationVerification);

module.exports = router;
```

### Python Backend Implementation

```python
"""
Passkey Server Implementation with py_webauthn
"""
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers import (
    bytes_to_base64url,
    base64url_to_bytes,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    AuthenticatorAttachment,
    PublicKeyCredentialDescriptor,
    AuthenticatorTransport,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier

from flask import Flask, request, jsonify, session
from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
import secrets
import json

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Configuration
RP_ID = "localhost"
RP_NAME = "My Application"
ORIGIN = f"https://{RP_ID}"

# Storage (use database in production)
@dataclass
class StoredCredential:
    id: bytes
    public_key: bytes
    sign_count: int
    transports: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: datetime = field(default_factory=datetime.utcnow)
    device_type: str = "unknown"
    backed_up: bool = False

@dataclass
class User:
    id: bytes
    username: str
    display_name: str
    credentials: List[StoredCredential] = field(default_factory=list)

users: Dict[str, User] = {}
credentials: Dict[bytes, StoredCredential] = {}


def get_or_create_user(username: str, display_name: Optional[str] = None) -> User:
    """Get existing user or create new one."""
    if username not in users:
        users[username] = User(
            id=secrets.token_bytes(32),
            username=username,
            display_name=display_name or username
        )
    return users[username]


def get_user_by_id(user_id: bytes) -> Optional[User]:
    """Find user by their ID."""
    for user in users.values():
        if user.id == user_id:
            return user
    return None


@app.route('/api/auth/register/options', methods=['POST'])
def registration_options():
    """Generate registration options."""
    data = request.get_json()
    username = data.get('username')
    display_name = data.get('displayName', username)

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    user = get_or_create_user(username, display_name)

    # Build exclude credentials list
    exclude_credentials = [
        PublicKeyCredentialDescriptor(
            id=cred.id,
            transports=[AuthenticatorTransport(t) for t in cred.transports]
        )
        for cred in user.credentials
    ]

    # Generate options
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user.id,
        user_name=username,
        user_display_name=user.display_name,
        attestation="none",
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        exclude_credentials=exclude_credentials,
        supported_pub_key_algs=[
            COSEAlgorithmIdentifier.ECDSA_SHA_256,
            COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
        ],
        timeout=60000,
    )

    # Store challenge in session
    session['registration_challenge'] = bytes_to_base64url(options.challenge)
    session['registration_username'] = username

    return jsonify(json.loads(options_to_json(options)))


@app.route('/api/auth/register/verify', methods=['POST'])
def registration_verify():
    """Verify registration response."""
    # Get stored challenge
    expected_challenge = session.pop('registration_challenge', None)
    username = session.pop('registration_username', None)

    if not expected_challenge or not username:
        return jsonify({'error': 'No registration in progress'}), 400

    user = users.get(username)
    if not user:
        return jsonify({'error': 'User not found'}), 400

    try:
        credential = verify_registration_response(
            credential=request.get_json(),
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            require_user_verification=True,
        )

        # Store the credential
        stored_credential = StoredCredential(
            id=credential.credential_id,
            public_key=credential.credential_public_key,
            sign_count=credential.sign_count,
            transports=request.get_json().get('response', {}).get('transports', []),
            device_type=credential.credential_device_type,
            backed_up=credential.credential_backed_up,
        )

        user.credentials.append(stored_credential)
        credentials[credential.credential_id] = stored_credential

        return jsonify({
            'verified': True,
            'credentialId': bytes_to_base64url(credential.credential_id)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/auth/login/options', methods=['POST'])
def authentication_options():
    """Generate authentication options."""
    data = request.get_json()
    username = data.get('username')
    conditional = data.get('conditional', False)

    # Build allow credentials list
    allow_credentials = []
    if username and not conditional:
        user = users.get(username)
        if user:
            allow_credentials = [
                PublicKeyCredentialDescriptor(
                    id=cred.id,
                    transports=[AuthenticatorTransport(t) for t in cred.transports]
                )
                for cred in user.credentials
            ]

    options = generate_authentication_options(
        rp_id=RP_ID,
        timeout=60000,
        allow_credentials=allow_credentials if not conditional else None,
        user_verification=UserVerificationRequirement.REQUIRED,
    )

    # Store challenge
    session['authentication_challenge'] = bytes_to_base64url(options.challenge)
    session['authentication_username'] = username

    return jsonify(json.loads(options_to_json(options)))


@app.route('/api/auth/login/verify', methods=['POST'])
def authentication_verify():
    """Verify authentication response."""
    expected_challenge = session.pop('authentication_challenge', None)

    if not expected_challenge:
        return jsonify({'error': 'No authentication in progress'}), 400

    data = request.get_json()

    # Find credential
    try:
        credential_id = base64url_to_bytes(data['rawId'])
    except Exception:
        return jsonify({'error': 'Invalid credential ID'}), 400

    stored_credential = credentials.get(credential_id)
    if not stored_credential:
        return jsonify({'error': 'Credential not found'}), 400

    # Find user
    user = None
    for u in users.values():
        if any(c.id == credential_id for c in u.credentials):
            user = u
            break

    if not user:
        return jsonify({'error': 'User not found'}), 400

    try:
        verification = verify_authentication_response(
            credential=data,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=stored_credential.public_key,
            credential_current_sign_count=stored_credential.sign_count,
            require_user_verification=True,
        )

        # Update sign count
        stored_credential.sign_count = verification.new_sign_count
        stored_credential.last_used = datetime.utcnow()

        return jsonify({
            'verified': True,
            'user': {
                'id': bytes_to_base64url(user.id),
                'username': user.username,
                'displayName': user.display_name
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(ssl_context='adhoc', debug=True)
```

### React Component Example

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PasskeyManager } from './passkey-manager';

const passkeyManager = new PasskeyManager({
  rpId: window.location.hostname,
  rpName: 'My Application'
});

export function PasskeyAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isConditionalAvailable, setIsConditionalAvailable] = useState(false);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Check WebAuthn support on mount
  useEffect(() => {
    async function checkSupport() {
      setIsSupported(PasskeyManager.isSupported());

      if (PasskeyManager.isSupported()) {
        setIsPlatformAvailable(
          await PasskeyManager.isPlatformAuthenticatorAvailable()
        );
        setIsConditionalAvailable(
          await PasskeyManager.isConditionalMediationSupported()
        );
      }
    }
    checkSupport();
  }, []);

  // Set up conditional UI (autofill) authentication
  useEffect(() => {
    if (!isConditionalAvailable) return;

    const abortController = new AbortController();

    async function startConditionalAuth() {
      try {
        const result = await passkeyManager.authenticateWithConditionalUI(
          abortController
        );
        if (result) {
          setUser(result.user);
          setStatus('Signed in successfully via autofill');
        }
      } catch (err) {
        // Ignore abort errors
        if (err.name !== 'AbortError') {
          console.error('Conditional auth error:', err);
        }
      }
    }

    startConditionalAuth();

    return () => abortController.abort();
  }, [isConditionalAvailable]);

  const handleRegister = useCallback(async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setError('');
    setStatus('Creating passkey...');

    try {
      const result = await passkeyManager.register(username, username);
      setStatus('Passkey created successfully!');
      console.log('Registration result:', result);
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }, [username]);

  const handleAuthenticate = useCallback(async () => {
    setError('');
    setStatus('Authenticating...');

    try {
      const result = await passkeyManager.authenticate(username || null);
      setUser(result.user);
      setStatus('Signed in successfully!');
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }, [username]);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setStatus('');
    setUsername('');
  }, []);

  if (!isSupported) {
    return (
      <div className="passkey-auth">
        <div className="error">
          WebAuthn is not supported in this browser.
          Please use a modern browser like Chrome, Firefox, Safari, or Edge.
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="passkey-auth">
        <div className="user-info">
          <h2>Welcome, {user.displayName}!</h2>
          <p>Username: {user.username}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="passkey-auth">
      <h2>Passkey Authentication</h2>

      <div className="support-status">
        <p>Platform authenticator: {isPlatformAvailable ? 'Available' : 'Not available'}</p>
        <p>Autofill: {isConditionalAvailable ? 'Supported' : 'Not supported'}</p>
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username webauthn"
        />

        <div className="buttons">
          <button
            onClick={handleRegister}
            disabled={!isPlatformAvailable}
          >
            Create Passkey
          </button>

          <button onClick={handleAuthenticate}>
            Sign In with Passkey
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {error && <div className="error">{error}</div>}

      {isConditionalAvailable && (
        <p className="hint">
          Tip: Click on the username field to see passkey autofill suggestions
        </p>
      )}
    </div>
  );
}
```

## Best Practices

### Security Best Practices

**1. Always Verify User Presence and Verification:**

```javascript
// Server-side: Require user verification
const options = {
  authenticatorSelection: {
    userVerification: 'required' // Not 'preferred' or 'discouraged'
  }
};

// Verify flags in authenticator data
function verifyAuthenticatorData(authData) {
  const flags = authData[32];
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;

  if (!userPresent || !userVerified) {
    throw new Error('User verification required');
  }
}
```

**2. Validate Origin and RP ID:**

```javascript
// Server-side validation
function validateClientData(clientDataJSON, expectedOrigin, expectedRPID) {
  const clientData = JSON.parse(
    Buffer.from(clientDataJSON, 'base64').toString()
  );

  // Verify origin exactly matches
  if (clientData.origin !== expectedOrigin) {
    throw new Error('Origin mismatch');
  }

  // Verify type matches ceremony
  if (clientData.type !== 'webauthn.create' &&
      clientData.type !== 'webauthn.get') {
    throw new Error('Invalid ceremony type');
  }
}
```

**3. Implement Proper Counter Verification:**

```javascript
function verifyCounter(storedCounter, newCounter) {
  // Counter should always increase
  if (newCounter <= storedCounter) {
    // Possible cloned authenticator
    throw new Error('Counter verification failed - possible cloned authenticator');
  }
  return newCounter;
}
```

**4. Use Secure Challenge Generation:**

```javascript
// Generate cryptographically secure challenges
const crypto = require('crypto');

function generateChallenge() {
  // At least 16 bytes of randomness
  return crypto.randomBytes(32);
}
```

### Implementation Best Practices

**1. Progressive Enhancement:**

```javascript
// Gracefully handle unsupported browsers
async function initPasskeyAuth() {
  if (!PublicKeyCredential) {
    return showPasswordForm();
  }

  const platformAvailable = await PublicKeyCredential
    .isUserVerifyingPlatformAuthenticatorAvailable();

  if (platformAvailable) {
    showPasskeyOption();
  }

  // Always provide fallback
  showPasswordFallback();
}
```

**2. Clear Error Messages:**

```javascript
const ERROR_MESSAGES = {
  NotAllowedError: 'Authentication was cancelled or timed out. Please try again.',
  InvalidStateError: 'This passkey is already registered.',
  NotSupportedError: 'Your device does not support this authentication method.',
  SecurityError: 'A security error occurred. Please ensure you are using HTTPS.',
  UnknownError: 'An unexpected error occurred. Please try again.'
};

function getErrorMessage(error) {
  return ERROR_MESSAGES[error.name] || ERROR_MESSAGES.UnknownError;
}
```

**3. Handle Multiple Credentials:**

```javascript
// Allow users to manage multiple passkeys
async function listUserPasskeys(userId) {
  const credentials = await db.credentials.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      lastUsed: true,
      deviceType: true,
      backedUp: true
    }
  });

  return credentials.map(cred => ({
    ...cred,
    id: bufferToBase64url(cred.id),
    displayName: getDeviceDisplayName(cred.deviceType, cred.createdAt)
  }));
}

// Allow credential deletion
async function deletePasskey(userId, credentialId) {
  // Ensure user has at least one other authentication method
  const remainingCount = await db.credentials.count({
    where: { userId, id: { not: credentialId } }
  });

  if (remainingCount === 0) {
    throw new Error('Cannot delete last passkey. Add another authentication method first.');
  }

  await db.credentials.delete({ where: { id: credentialId, userId } });
}
```

**4. Implement Account Recovery:**

```javascript
// Recovery options for passkey-only accounts
const RECOVERY_OPTIONS = {
  // Backup passkey on another device
  BACKUP_PASSKEY: 'backup_passkey',
  // Recovery codes
  RECOVERY_CODES: 'recovery_codes',
  // Trusted contact
  TRUSTED_CONTACT: 'trusted_contact',
  // Email verification with waiting period
  EMAIL_RECOVERY: 'email_recovery'
};

async function setupRecovery(userId, method) {
  switch (method) {
    case RECOVERY_OPTIONS.RECOVERY_CODES:
      const codes = generateRecoveryCodes(10);
      await storeRecoveryCodes(userId, codes);
      return codes;

    case RECOVERY_OPTIONS.BACKUP_PASSKEY:
      // Prompt user to register passkey on another device
      return startBackupPasskeyRegistration(userId);

    // ... other methods
  }
}
```

## Common Pitfalls

### Pitfall 1: Not Handling Browser Compatibility

```javascript
// Bad: Assuming WebAuthn is available
const credential = await navigator.credentials.create({ publicKey: options });

// Good: Check support and provide fallback
async function createPasskey(options) {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported. Please use a modern browser.');
  }

  try {
    return await navigator.credentials.create({ publicKey: options });
  } catch (error) {
    if (error.name === 'NotSupportedError') {
      throw new Error('Your device does not support passkeys.');
    }
    throw error;
  }
}
```

### Pitfall 2: Incorrect Base64URL Encoding

```javascript
// Bad: Using standard base64
const encoded = btoa(String.fromCharCode(...new Uint8Array(buffer)));

// Good: Use proper base64url encoding
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToBuffer(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/') + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

### Pitfall 3: Not Storing Transports

```javascript
// Bad: Ignoring transports
const credential = {
  id: response.id,
  publicKey: response.response.getPublicKey()
};

// Good: Store transports for better UX
const credential = {
  id: response.id,
  publicKey: response.response.getPublicKey(),
  transports: response.response.getTransports?.() || [],
  // Use transports when requesting authentication
};

// Later, when authenticating
const allowCredentials = userCredentials.map(cred => ({
  id: cred.id,
  type: 'public-key',
  transports: cred.transports // Helps browser choose correct authenticator
}));
```

### Pitfall 4: Challenge Reuse

```javascript
// Bad: Reusing challenges
let globalChallenge = crypto.randomBytes(32);

// Good: Generate unique challenge per ceremony
function startAuthentication(userId) {
  const challenge = crypto.randomBytes(32);
  const expiresAt = Date.now() + 300000; // 5 minutes

  // Store challenge with expiration
  challengeStore.set(userId, { challenge, expiresAt });

  return { challenge };
}

function verifyAuthentication(userId, response) {
  const stored = challengeStore.get(userId);

  if (!stored || Date.now() > stored.expiresAt) {
    throw new Error('Challenge expired');
  }

  // Delete challenge after use (one-time use)
  challengeStore.delete(userId);

  // Verify response...
}
```

### Pitfall 5: Ignoring Backup Status

```javascript
// Bad: Not tracking backup status
storeCredential(credential.id, credential.publicKey);

// Good: Track backup status for security decisions
function storeCredential(registrationInfo) {
  const credential = {
    id: registrationInfo.credentialID,
    publicKey: registrationInfo.credentialPublicKey,
    counter: registrationInfo.counter,
    // Track if credential is synced/backed up
    backedUp: registrationInfo.credentialBackedUp,
    deviceType: registrationInfo.credentialDeviceType
  };

  db.credentials.insert(credential);

  // Alert user if credential is not backed up
  if (!credential.backedUp) {
    notifyUser('Consider adding a backup passkey on another device');
  }
}
```

## Performance Considerations

### Optimizing Registration and Authentication

```javascript
// 1. Parallelize where possible
async function startAuthentication(username) {
  // Fetch user credentials and generate challenge in parallel
  const [userCredentials, challenge] = await Promise.all([
    db.credentials.findByUsername(username),
    generateChallenge()
  ]);

  return buildAuthenticationOptions(userCredentials, challenge);
}

// 2. Use efficient credential lookup
// Create index on credential ID
db.credentials.createIndex({ credentialId: 1 });

// 3. Minimize round trips
// Return everything needed in one response
const authResult = {
  verified: true,
  user: { id, username, displayName },
  session: generateSession(userId),
  // Include any other needed data
};
```

### Caching Strategies

```javascript
// Cache WebAuthn capability checks
class PasskeyCapabilityCache {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.TTL = 60000; // 1 minute
  }

  async getCapabilities() {
    if (this.cache && Date.now() - this.cacheTime < this.TTL) {
      return this.cache;
    }

    const capabilities = {
      supported: !!window.PublicKeyCredential,
      platformAuthenticator: await PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false,
      conditionalMediation: await PublicKeyCredential
        .isConditionalMediationAvailable?.() ?? false
    };

    this.cache = capabilities;
    this.cacheTime = Date.now();

    return capabilities;
  }
}
```

### Network Optimization

```javascript
// Use compression for credential data
const express = require('express');
const compression = require('compression');

app.use('/api/auth', compression({
  filter: (req, res) => {
    // Compress JSON responses
    return /json/.test(res.getHeader('Content-Type'));
  }
}));

// Set appropriate timeouts
const AUTH_TIMEOUT = 60000; // 60 seconds for user interaction
const SERVER_TIMEOUT = 5000; // 5 seconds for server processing
```

## Real-World Scenarios

### Scenario 1: E-commerce Checkout

```javascript
// Streamlined checkout with passkey authentication
class CheckoutPasskeyAuth {
  async authenticateForCheckout(cartId) {
    // 1. Pre-flight check
    const capabilities = await passkeyManager.getCapabilities();

    if (!capabilities.platformAuthenticator) {
      // Fall back to password or other auth
      return this.fallbackAuth();
    }

    // 2. Authenticate with passkey
    try {
      const authResult = await passkeyManager.authenticate();

      // 3. Complete checkout in same request
      const orderResult = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authResult.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cartId })
      });

      return orderResult.json();
    } catch (error) {
      // Handle gracefully
      return this.handleAuthError(error);
    }
  }
}
```

### Scenario 2: Banking Application

```javascript
// High-security passkey implementation for banking
class BankingPasskeyAuth {
  constructor() {
    this.requireStrictVerification = true;
  }

  async authenticateTransaction(transactionDetails) {
    // 1. Generate transaction-specific challenge
    const challenge = await fetch('/api/transaction/challenge', {
      method: 'POST',
      body: JSON.stringify({
        amount: transactionDetails.amount,
        recipient: transactionDetails.recipient,
        timestamp: Date.now()
      })
    });

    // 2. Require user verification for every transaction
    const options = {
      publicKey: {
        challenge: challenge.data,
        rpId: 'bank.example.com',
        userVerification: 'required', // Always required for banking
        timeout: 30000, // Shorter timeout for security
        allowCredentials: await this.getUserCredentials()
      }
    };

    // 3. Get assertion with transaction binding
    const assertion = await navigator.credentials.get(options);

    // 4. Submit transaction with assertion
    return fetch('/api/transaction/execute', {
      method: 'POST',
      body: JSON.stringify({
        transaction: transactionDetails,
        assertion: this.serializeAssertion(assertion)
      })
    });
  }

  // Require re-authentication for sensitive operations
  async requireReauth(operationType) {
    const lastAuth = await this.getLastAuthTime();
    const maxAge = this.getMaxAgeForOperation(operationType);

    if (Date.now() - lastAuth > maxAge) {
      await this.authenticate();
    }
  }

  getMaxAgeForOperation(type) {
    const maxAges = {
      'view_balance': 15 * 60 * 1000,      // 15 minutes
      'transfer': 5 * 60 * 1000,            // 5 minutes
      'change_settings': 2 * 60 * 1000,     // 2 minutes
      'add_beneficiary': 0                   // Always re-auth
    };
    return maxAges[type] ?? 0;
  }
}
```

### Scenario 3: Enterprise SSO

```javascript
// Enterprise passkey integration with SAML/OIDC
class EnterprisePasskeySSO {
  constructor(config) {
    this.idpUrl = config.idpUrl;
    this.clientId = config.clientId;
    this.rpId = config.rpId;
  }

  async initiateSSO(targetApp) {
    // 1. Start OIDC flow
    const authRequest = await fetch(`${this.idpUrl}/authorize`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: this.clientId,
        response_type: 'code',
        scope: 'openid profile',
        redirect_uri: targetApp.callbackUrl,
        acr_values: 'urn:passkey' // Request passkey authentication
      })
    });

    // 2. Authenticate with passkey at IdP
    const passkeyChallenge = authRequest.passkey_challenge;

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: base64urlToBuffer(passkeyChallenge),
        rpId: this.rpId,
        userVerification: 'required',
        timeout: 60000
      }
    });

    // 3. Complete authentication at IdP
    const authCode = await this.completeIdPAuth(assertion);

    // 4. Exchange code for tokens at target app
    return this.exchangeCode(authCode, targetApp);
  }

  // Support for device trust in enterprise
  async registerTrustedDevice() {
    const deviceAttestation = await navigator.credentials.create({
      publicKey: {
        challenge: await this.getDeviceRegistrationChallenge(),
        rp: { id: this.rpId, name: 'Enterprise SSO' },
        user: await this.getCurrentUser(),
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        attestation: 'enterprise', // Request enterprise attestation
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required'
        }
      }
    });

    // Verify device meets enterprise requirements
    return this.verifyEnterpriseAttestation(deviceAttestation);
  }
}
```

### Scenario 4: Mobile App Integration

```kotlin
// Android Credential Manager integration
class PasskeyAuthManager(private val context: Context) {
    private val credentialManager = CredentialManager.create(context)

    suspend fun createPasskey(
        username: String,
        challenge: ByteArray
    ): CreatePublicKeyCredentialResponse {
        val createRequest = CreatePublicKeyCredentialRequest(
            requestJson = buildRegistrationRequestJson(username, challenge)
        )

        return credentialManager.createCredential(
            context = context,
            request = createRequest
        ) as CreatePublicKeyCredentialResponse
    }

    suspend fun authenticate(
        challenge: ByteArray,
        allowCredentials: List<String>? = null
    ): GetCredentialResponse {
        val getRequest = GetCredentialRequest(
            listOf(
                GetPublicKeyCredentialOption(
                    requestJson = buildAuthenticationRequestJson(
                        challenge,
                        allowCredentials
                    )
                )
            )
        )

        return credentialManager.getCredential(
            context = context,
            request = getRequest
        )
    }

    private fun buildRegistrationRequestJson(
        username: String,
        challenge: ByteArray
    ): String {
        return JSONObject().apply {
            put("challenge", challenge.toBase64Url())
            put("rp", JSONObject().apply {
                put("id", "example.com")
                put("name", "My App")
            })
            put("user", JSONObject().apply {
                put("id", generateUserId().toBase64Url())
                put("name", username)
                put("displayName", username)
            })
            put("pubKeyCredParams", JSONArray().apply {
                put(JSONObject().apply {
                    put("type", "public-key")
                    put("alg", -7) // ES256
                })
            })
            put("authenticatorSelection", JSONObject().apply {
                put("residentKey", "required")
                put("userVerification", "required")
            })
        }.toString()
    }
}
```

## Interview Questions

### Basic Questions

**Q1: What is the difference between passkeys and traditional passwords?**

A: Passkeys use public-key cryptography where:
- A unique key pair is generated per service
- The private key never leaves the device
- Authentication proves possession without transmitting secrets
- Phishing-resistant due to origin binding
- No password reuse or credential stuffing risks

**Q2: What are the main components of the FIDO2 standard?**

A: FIDO2 consists of:
1. **WebAuthn**: W3C API for browsers/apps to interact with authenticators
2. **CTAP2**: Client to Authenticator Protocol for communication with external authenticators

**Q3: What is the difference between platform and roaming authenticators?**

A:
- **Platform authenticators**: Built into devices (Touch ID, Face ID, Windows Hello)
- **Roaming authenticators**: External devices (YubiKey, security keys) that can be used across devices

### Intermediate Questions

**Q4: Explain the passkey registration flow.**

A: The registration flow involves:
1. Server generates `PublicKeyCredentialCreationOptions` with challenge, RP info, user info
2. Client calls `navigator.credentials.create()` with options
3. Authenticator creates new key pair after user verification
4. Authenticator returns attestation object containing public key
5. Server validates attestation and stores public key with user

**Q5: How does passkey authentication prevent phishing?**

A: Passkeys prevent phishing through:
1. **Origin binding**: Credentials are bound to specific domains
2. **Automatic origin verification**: Browser verifies RP ID matches origin
3. **Challenge-response**: Server challenges are signed, not credentials transmitted
4. **No shared secrets**: Attacker cannot intercept reusable credentials

**Q6: What are discoverable credentials and why are they important?**

A: Discoverable credentials (resident keys):
- Stored on the authenticator with user information
- Enable true passwordless authentication without username
- Allow credential discovery and selection by the user
- Enable autofill integration in browsers

### Advanced Questions

**Q7: How would you implement account recovery for passkey-only accounts?**

A: Several approaches:
1. **Backup passkeys**: Register on multiple devices
2. **Recovery codes**: One-time use codes stored securely
3. **Trusted contacts**: Social recovery with verification
4. **Synced passkeys**: Platform-managed sync (iCloud, Google)
5. **Time-delayed email recovery**: With waiting period and notifications

**Q8: Explain the security implications of synced vs. device-bound passkeys.**

A:
- **Device-bound**: Higher security, credential cannot be extracted, lost if device lost
- **Synced**: Convenience of multi-device access, relies on platform security, potential backup access by platform provider
- Security decision depends on threat model and usability requirements

**Q9: How do you handle counter verification and what does a counter mismatch indicate?**

A: Counter verification:
- Each authentication increments counter on authenticator
- Server stores and verifies counter always increases
- Counter decrease/equality may indicate cloned authenticator
- Response: Revoke credential, alert user, require re-registration

## Further Reading

### Official Documentation

- [WebAuthn Specification (W3C)](https://www.w3.org/TR/webauthn-2/)
- [FIDO2 Technical Specifications](https://fidoalliance.org/specifications/)
- [Apple Passkeys Documentation](https://developer.apple.com/passkeys/)
- [Google Identity Passkeys](https://developers.google.com/identity/passkeys)
- [Microsoft Passwordless Documentation](https://docs.microsoft.com/en-us/azure/active-directory/authentication/concept-authentication-passwordless)

### Libraries and Tools

- [SimpleWebAuthn](https://simplewebauthn.dev/) - JavaScript/TypeScript library
- [py_webauthn](https://github.com/duo-labs/py_webauthn) - Python library
- [WebAuthn.io](https://webauthn.io/) - Interactive demo and testing
- [Passkeys.dev](https://passkeys.dev/) - Resources and guides

### Articles and Tutorials

- [FIDO Alliance Passkey Resources](https://fidoalliance.org/passkeys/)
- [Auth0 Passkeys Guide](https://auth0.com/blog/passkeys-passwordless-authentication/)
- [WebAuthn Guide by Yubico](https://developers.yubico.com/WebAuthn/)

### Books

- "Modern Authentication: OAuth 2.0, OpenID Connect, and Beyond" by Justin Richer
- "Identity Attack Vectors" by Morey J. Haber and Brian Chee

### Community

- [WebAuthn Subreddit](https://www.reddit.com/r/webauthn/)
- [FIDO Alliance Member Forum](https://fidoalliance.org/members/)
- [W3C Web Authentication Working Group](https://www.w3.org/groups/wg/webauthn/)
