---
title: FIDO2/WebAuthn Standard
description: A comprehensive guide to FIDO2 and WebAuthn - the standards powering passwordless authentication
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - FIDO2
  - WebAuthn
  - CTAP
  - Authentication
  - Security
  - Passwordless
status: imported
origin: old/src/content/docs/security/fido2-webauthn.en.md
divergence: 0.198
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 12
  lastUpdated: 2026-01-20
---

FIDO2 and WebAuthn represent a paradigm shift in authentication technology, providing a standardized framework for phishing-resistant, passwordless authentication. While [Passkeys](/docs/security/passkeys) focus on the user experience and practical implementation, this article dives deep into the underlying standards, protocols, and cryptographic foundations that make modern passwordless authentication possible.

## Concept Explanation

### What is FIDO2?

FIDO2 is an umbrella term for the set of specifications that enable passwordless and strong authentication on the web and in applications. It consists of two complementary standards:

1. **WebAuthn (Web Authentication API)**: A W3C standard that defines how web browsers and applications interact with authenticators
2. **CTAP (Client to Authenticator Protocol)**: A FIDO Alliance specification that defines how clients communicate with external authenticators

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FIDO2 Architecture                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Relying Party (Server)                         │   │
│  │                    - Stores Public Keys                           │   │
│  │                    - Verifies Assertions                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                     │
│                                    │ HTTPS                               │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    WebAuthn API (W3C)                             │   │
│  │                    - navigator.credentials.create()               │   │
│  │                    - navigator.credentials.get()                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                    ┌───────────────┴───────────────┐                    │
│                    │                               │                     │
│                    ▼                               ▼                     │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │   Platform Authenticator   │   │   Roaming Authenticator         │  │
│  │   (Internal)               │   │   (External via CTAP)           │  │
│  │   - Touch ID / Face ID     │   │   - Security Keys (YubiKey)     │  │
│  │   - Windows Hello          │   │   - Smartphones                 │  │
│  │   - Android Biometrics     │   │   - Smart Cards                 │  │
│  └─────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The FIDO Alliance

The FIDO (Fast IDentity Online) Alliance is an industry consortium formed in 2012 to address the lack of interoperability among strong authentication technologies. Key members include:

- **Founding Members**: PayPal, Lenovo, Nok Nok Labs, Validity Sensors, Infineon, Agnitio
- **Current Board Members**: Google, Microsoft, Apple, Amazon, Meta, Intel, Qualcomm, Samsung, Visa, Mastercard, and many others

### Evolution of FIDO Standards

| Version | Year | Key Features |
|---------|------|--------------|
| FIDO UAF 1.0 | 2014 | Passwordless authentication for mobile |
| FIDO U2F 1.0 | 2014 | Second-factor security keys |
| FIDO2 / WebAuthn | 2018-2019 | Web-native passwordless standard |
| CTAP 2.0 | 2018 | Enhanced authenticator protocol |
| WebAuthn Level 2 | 2021 | Cross-device authentication, enterprise features |
| CTAP 2.1 | 2021 | Credential management, hybrid transport |
| WebAuthn Level 3 | 2023+ | Conditional UI, enhanced attestation |

### FIDO2 vs Previous FIDO Standards

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIDO Standards Evolution                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FIDO UAF (Universal Authentication Framework)                   │
│  └── Mobile-focused, proprietary APIs                           │
│  └── Passwordless authentication                                │
│  └── Limited browser support                                    │
│                                                                  │
│  FIDO U2F (Universal 2nd Factor)                                │
│  └── Hardware security keys                                     │
│  └── Second factor only (password + key)                        │
│  └── Simple JavaScript API                                      │
│                                                                  │
│  FIDO2 (WebAuthn + CTAP)                                        │
│  └── W3C standardized browser API                               │
│  └── Passwordless OR second factor                              │
│  └── Platform and roaming authenticators                        │
│  └── Discoverable credentials (resident keys)                   │
│  └── Backward compatible with U2F                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

### Public Key Cryptography Foundation

WebAuthn relies on asymmetric cryptography where credentials consist of a key pair:

```javascript
// Conceptual representation of WebAuthn credential
const credential = {
  // Stored on authenticator (never leaves the device)
  privateKey: {
    algorithm: 'ECDSA P-256',  // or RS256, Ed25519
    keyMaterial: '...',         // Protected by hardware
    userVerificationRequired: true
  },

  // Sent to and stored by the Relying Party
  publicKey: {
    algorithm: -7,  // COSE algorithm identifier for ES256
    x: '...',       // X coordinate (for EC keys)
    y: '...',       // Y coordinate (for EC keys)
  },

  // Unique identifier for this credential
  credentialId: new Uint8Array([...]),

  // Optional: User information (for discoverable credentials)
  userHandle: new Uint8Array([...])
};
```

**Supported Cryptographic Algorithms (COSE Algorithm Identifiers):**

| COSE ID | Algorithm | Description | Security Level |
|---------|-----------|-------------|----------------|
| -7 | ES256 | ECDSA with P-256 and SHA-256 | High (recommended) |
| -35 | ES384 | ECDSA with P-384 and SHA-384 | Very High |
| -36 | ES512 | ECDSA with P-521 and SHA-512 | Very High |
| -8 | EdDSA | Ed25519 or Ed448 | High (recommended) |
| -257 | RS256 | RSASSA-PKCS1-v1_5 with SHA-256 | Medium (legacy) |
| -37 | PS256 | RSASSA-PSS with SHA-256 | High |

### CTAP Protocol Deep Dive

CTAP (Client to Authenticator Protocol) defines the communication between a client (browser or OS) and an authenticator. CTAP2 is the current version used in FIDO2.

**CTAP Transport Bindings:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CTAP Transport Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USB HID (Human Interface Device)                               │
│  └── Primary transport for security keys                        │
│  └── Report descriptor: 0xF1D0                                  │
│  └── Uses HID reports for CTAP messages                         │
│                                                                  │
│  NFC (Near Field Communication)                                 │
│  └── Contactless smart cards                                    │
│  └── Mobile devices as authenticators                           │
│  └── ISO 7816-4 APDU framing                                    │
│                                                                  │
│  BLE (Bluetooth Low Energy)                                     │
│  └── Wireless connection to authenticators                      │
│  └── FIDO service UUID: 0xFFFD                                  │
│  └── Requires pairing for security                              │
│                                                                  │
│  Hybrid (caBLE - Cloud-Assisted BLE)                            │
│  └── Cross-device authentication                                │
│  └── QR code + BLE proximity                                    │
│  └── Phone as authenticator for laptop                          │
│                                                                  │
│  Internal (Platform)                                            │
│  └── Direct OS API calls                                        │
│  └── TPM / Secure Enclave access                                │
│  └── Biometric verification                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**CTAP2 Commands:**

| Command | Code | Description |
|---------|------|-------------|
| `authenticatorMakeCredential` | 0x01 | Create new credential |
| `authenticatorGetAssertion` | 0x02 | Authenticate with credential |
| `authenticatorGetInfo` | 0x04 | Query authenticator capabilities |
| `authenticatorClientPIN` | 0x06 | PIN management operations |
| `authenticatorReset` | 0x07 | Factory reset |
| `authenticatorBioEnrollment` | 0x09 | Biometric enrollment (CTAP 2.1) |
| `authenticatorCredentialManagement` | 0x0A | Manage stored credentials |
| `authenticatorSelection` | 0x0B | User presence check |
| `authenticatorLargeBlobs` | 0x0C | Store large data blobs |
| `authenticatorConfig` | 0x0D | Configure authenticator |

### Authenticator Types

**Platform Authenticators (Internal):**

Platform authenticators are built into the device and typically leverage hardware security:

```javascript
// Request platform authenticator specifically
const credential = await navigator.credentials.create({
  publicKey: {
    // ... other options
    authenticatorSelection: {
      authenticatorAttachment: 'platform',  // Only platform authenticators
      residentKey: 'required',
      userVerification: 'required'
    }
  }
});
```

| Platform | Authenticator | Secure Storage |
|----------|--------------|----------------|
| macOS/iOS | Touch ID / Face ID | Secure Enclave |
| Windows | Windows Hello | TPM 2.0 |
| Android | Biometric Prompt | StrongBox / TEE |
| Linux | FIDO2 (via libfido2) | TPM 2.0 (if available) |

**Roaming Authenticators (External):**

Roaming authenticators are external devices that can be used across multiple platforms:

```javascript
// Allow roaming authenticators
const credential = await navigator.credentials.create({
  publicKey: {
    // ... other options
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',  // External authenticators
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  }
});
```

| Type | Examples | CTAP Transport |
|------|----------|----------------|
| Security Keys | YubiKey, Google Titan, Feitian | USB, NFC, BLE |
| Smart Cards | PIV cards, CAC | NFC, USB |
| Smartphones | iOS/Android phones | Hybrid (caBLE) |

### User Verification Levels

User Verification (UV) determines how the authenticator confirms the user's identity:

```javascript
// User verification options
const userVerificationOptions = {
  // User MUST verify (biometric, PIN, etc.)
  required: 'required',

  // User verification preferred but not mandatory
  preferred: 'preferred',

  // User verification explicitly not required
  discouraged: 'discouraged'
};
```

**Verification Methods:**

| Method | Description | AAGUID Example |
|--------|-------------|----------------|
| Biometric | Fingerprint, Face, Iris | Platform-specific |
| Client PIN | Authenticator-specific PIN | Required if no biometric |
| Passcode | Device passcode (fallback) | iOS, Android |
| None | User presence only (touch) | Basic security keys |

**Authenticator Flags:**

```javascript
// Authenticator data flags (single byte)
const AuthenticatorFlags = {
  UP: 0x01,    // User Presence (bit 0)
  UV: 0x04,    // User Verified (bit 2)
  BE: 0x08,    // Backup Eligibility (bit 3) - CTAP 2.1
  BS: 0x10,    // Backup State (bit 4) - CTAP 2.1
  AT: 0x40,    // Attested credential data included (bit 6)
  ED: 0x80     // Extension data included (bit 7)
};

// Example: Parse authenticator data flags
function parseAuthenticatorFlags(flagsByte) {
  return {
    userPresent: (flagsByte & 0x01) !== 0,
    userVerified: (flagsByte & 0x04) !== 0,
    backupEligible: (flagsByte & 0x08) !== 0,
    backedUp: (flagsByte & 0x10) !== 0,
    attestedCredentialData: (flagsByte & 0x40) !== 0,
    extensionData: (flagsByte & 0x80) !== 0
  };
}
```

## Core Components

### Registration Flow (Attestation Ceremony)

The registration flow creates a new credential and registers its public key with the relying party:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebAuthn Registration Flow                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User          Browser/Client        Authenticator       Relying Party  │
│    │                 │                    │                    │         │
│    │  1. Request     │                    │                    │         │
│    │  Registration   │                    │                    │         │
│    │────────────────>│                    │                    │         │
│    │                 │  2. Request        │                    │         │
│    │                 │  Options           │                    │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │  3. PublicKeyCredentialCreationOptions │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
│    │                 │  4. Create         │                    │         │
│    │                 │  Credential        │                    │         │
│    │                 │───────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │  5. User Verification               │                    │         │
│    │<─────────────────────────────────────│                    │         │
│    │  (Biometric/PIN)│                    │                    │         │
│    │─────────────────────────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │                 │  6. Attestation    │                    │         │
│    │                 │  Object            │                    │         │
│    │                 │<───────────────────│                    │         │
│    │                 │                    │                    │         │
│    │                 │  7. Send Attestation                   │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │                    │  8. Verify & Store │         │
│    │                 │                    │                    │         │
│    │                 │  9. Success                            │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
└─────────────────────────────────────────────────────────────────────────┘
```

**PublicKeyCredentialCreationOptions Structure:**

```javascript
const publicKeyCredentialCreationOptions = {
  // Challenge - cryptographically random bytes from server
  challenge: new Uint8Array([/* 32+ bytes */]),

  // Relying Party information
  rp: {
    id: 'example.com',      // RP ID (domain or registrable suffix)
    name: 'Example Corp'    // Human-readable name
  },

  // User account information
  user: {
    id: new Uint8Array([/* user handle - opaque bytes */]),
    name: 'user@example.com',        // Username
    displayName: 'John Doe'           // Display name
  },

  // Acceptable public key algorithms (in preference order)
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },    // ES256
    { type: 'public-key', alg: -257 }   // RS256
  ],

  // Timeout in milliseconds
  timeout: 60000,

  // Credentials to exclude (prevent re-registration)
  excludeCredentials: [
    {
      id: new Uint8Array([/* existing credential ID */]),
      type: 'public-key',
      transports: ['usb', 'nfc', 'ble', 'internal', 'hybrid']
    }
  ],

  // Authenticator selection criteria
  authenticatorSelection: {
    authenticatorAttachment: 'platform',  // or 'cross-platform'
    residentKey: 'required',              // 'required', 'preferred', 'discouraged'
    userVerification: 'required'          // 'required', 'preferred', 'discouraged'
  },

  // Attestation preference
  attestation: 'none',  // 'none', 'indirect', 'direct', 'enterprise'

  // Extensions
  extensions: {
    credProps: true,        // Request credential properties
    largeBlob: {            // Large blob storage
      support: 'preferred'
    },
    credentialProtectionPolicy: 'userVerificationRequired'
  }
};
```

### Authentication Flow (Assertion Ceremony)

The authentication flow proves possession of a registered credential:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebAuthn Authentication Flow                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User          Browser/Client        Authenticator       Relying Party  │
│    │                 │                    │                    │         │
│    │  1. Login       │                    │                    │         │
│    │  Request        │                    │                    │         │
│    │────────────────>│                    │                    │         │
│    │                 │  2. Request        │                    │         │
│    │                 │  Options           │                    │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │  3. PublicKeyCredentialRequestOptions  │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
│    │                 │  4. Get            │                    │         │
│    │                 │  Assertion         │                    │         │
│    │                 │───────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │  5. User Verification               │                    │         │
│    │<─────────────────────────────────────│                    │         │
│    │  (Biometric/PIN)│                    │                    │         │
│    │─────────────────────────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │                 │  6. Signed         │                    │         │
│    │                 │  Assertion         │                    │         │
│    │                 │<───────────────────│                    │         │
│    │                 │                    │                    │         │
│    │                 │  7. Send Assertion                     │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │                    │  8. Verify         │         │
│    │                 │                    │     Signature      │         │
│    │                 │                    │                    │         │
│    │                 │  9. Authenticated                      │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
└─────────────────────────────────────────────────────────────────────────┘
```

**PublicKeyCredentialRequestOptions Structure:**

```javascript
const publicKeyCredentialRequestOptions = {
  // Challenge - cryptographically random bytes from server
  challenge: new Uint8Array([/* 32+ bytes */]),

  // Relying Party ID
  rpId: 'example.com',

  // Timeout in milliseconds
  timeout: 60000,

  // Allowed credentials (empty for discoverable credentials)
  allowCredentials: [
    {
      id: new Uint8Array([/* credential ID */]),
      type: 'public-key',
      transports: ['internal', 'hybrid']
    }
  ],

  // User verification requirement
  userVerification: 'required',  // 'required', 'preferred', 'discouraged'

  // Extensions
  extensions: {
    appid: 'https://example.com',  // Legacy U2F appId
    largeBlob: {
      read: true
    }
  }
};
```

### Credential Management

**Discoverable Credentials (Resident Keys):**

Discoverable credentials are stored on the authenticator with user information, enabling username-less authentication:

```javascript
// Registration with discoverable credential
const options = {
  publicKey: {
    // ... other options
    authenticatorSelection: {
      residentKey: 'required',  // Force discoverable credential
      userVerification: 'required'
    },
    // User information stored in credential
    user: {
      id: new Uint8Array([/* unique user handle */]),
      name: 'user@example.com',
      displayName: 'John Doe'
    }
  }
};

// Authentication without specifying credentials
const authOptions = {
  publicKey: {
    challenge: new Uint8Array([/* ... */]),
    rpId: 'example.com',
    userVerification: 'required',
    // Empty allowCredentials enables credential discovery
    allowCredentials: []
  }
};
```

**Credential Properties Extension:**

```javascript
// Request credential properties during registration
const options = {
  publicKey: {
    // ... other options
    extensions: {
      credProps: true
    }
  }
};

const credential = await navigator.credentials.create(options);

// Access credential properties
const credProps = credential.getClientExtensionResults().credProps;
console.log('Resident key:', credProps.rk);           // boolean
console.log('Authenticator display name:', credProps.authenticatorDisplayName);
```

### Attestation Deep Dive

Attestation provides cryptographic proof of the authenticator's properties:

**Attestation Types:**

| Type | Description | Use Case |
|------|-------------|----------|
| None | No attestation data | Privacy-focused, most common |
| Self | Self-signed by credential key | Basic authenticity |
| Basic | Shared attestation key | Vendor identification |
| AttCA | Attestation CA | Privacy-preserving vendor attestation |
| ECDAA | Enhanced privacy attestation | Zero-knowledge proof |

**Attestation Statement Formats:**

```javascript
// Attestation object structure (CBOR encoded)
const attestationObject = {
  fmt: 'packed',  // Format identifier
  authData: Uint8Array([/* authenticator data */]),
  attStmt: {
    alg: -7,        // Algorithm
    sig: Uint8Array([/* signature */]),
    x5c: [          // Certificate chain (optional)
      Uint8Array([/* attestation certificate */]),
      Uint8Array([/* intermediate certificate */])
    ]
  }
};
```

**Parsing Authenticator Data:**

```javascript
function parseAuthenticatorData(authData) {
  const dataView = new DataView(authData.buffer);

  // rpIdHash (32 bytes)
  const rpIdHash = authData.slice(0, 32);

  // Flags (1 byte)
  const flags = authData[32];

  // Signature counter (4 bytes, big-endian)
  const signCount = dataView.getUint32(33, false);

  let offset = 37;
  let attestedCredentialData = null;
  let extensions = null;

  // If attested credential data is present (AT flag)
  if (flags & 0x40) {
    // AAGUID (16 bytes)
    const aaguid = authData.slice(offset, offset + 16);
    offset += 16;

    // Credential ID length (2 bytes, big-endian)
    const credIdLength = dataView.getUint16(offset, false);
    offset += 2;

    // Credential ID
    const credentialId = authData.slice(offset, offset + credIdLength);
    offset += credIdLength;

    // Credential public key (COSE encoded)
    // Decode using CBOR library
    const publicKeyCOSE = authData.slice(offset);

    attestedCredentialData = {
      aaguid,
      credentialId,
      publicKeyCOSE
    };
  }

  // If extension data is present (ED flag)
  if (flags & 0x80) {
    // Remaining bytes are CBOR-encoded extensions
    extensions = authData.slice(offset);
  }

  return {
    rpIdHash,
    flags: parseAuthenticatorFlags(flags),
    signCount,
    attestedCredentialData,
    extensions
  };
}
```

## Code Examples

### Complete Frontend Implementation

```javascript
/**
 * FIDO2/WebAuthn Client Implementation
 * Comprehensive implementation with full protocol support
 */
class WebAuthnClient {
  constructor(config = {}) {
    this.rpId = config.rpId || window.location.hostname;
    this.rpName = config.rpName || document.title;
    this.apiEndpoint = config.apiEndpoint || '/api/webauthn';
    this.timeout = config.timeout || 60000;
  }

  /**
   * Check WebAuthn support and capabilities
   */
  static async checkSupport() {
    const support = {
      webauthn: false,
      platformAuthenticator: false,
      conditionalMediation: false,
      userVerifyingPlatformAuthenticator: false
    };

    if (!window.PublicKeyCredential) {
      return support;
    }

    support.webauthn = true;

    try {
      support.platformAuthenticator =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      support.userVerifyingPlatformAuthenticator = support.platformAuthenticator;
    } catch (e) {
      console.warn('Platform authenticator check failed:', e);
    }

    try {
      if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
        support.conditionalMediation =
          await PublicKeyCredential.isConditionalMediationAvailable();
      }
    } catch (e) {
      console.warn('Conditional mediation check failed:', e);
    }

    return support;
  }

  /**
   * Create credential (Registration)
   */
  async createCredential(username, displayName, options = {}) {
    // 1. Get registration options from server
    const serverOptions = await this._fetchRegistrationOptions(username, displayName);

    // 2. Build WebAuthn options
    const publicKeyOptions = this._buildCreationOptions(serverOptions, options);

    // 3. Create credential
    let credential;
    try {
      credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      });
    } catch (error) {
      throw this._handleError(error);
    }

    // 4. Serialize and send to server
    const serializedCredential = this._serializeAttestationResponse(credential);
    const verificationResult = await this._verifyRegistration(
      serializedCredential,
      serverOptions.session
    );

    return {
      credential: serializedCredential,
      verification: verificationResult
    };
  }

  /**
   * Get assertion (Authentication)
   */
  async getAssertion(username = null, options = {}) {
    // 1. Get authentication options from server
    const serverOptions = await this._fetchAuthenticationOptions(username);

    // 2. Build WebAuthn options
    const publicKeyOptions = this._buildRequestOptions(serverOptions, options);

    // 3. Get assertion
    let assertion;
    try {
      assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: options.mediation
      });
    } catch (error) {
      throw this._handleError(error);
    }

    // 4. Serialize and send to server
    const serializedAssertion = this._serializeAssertionResponse(assertion);
    const verificationResult = await this._verifyAuthentication(
      serializedAssertion,
      serverOptions.session
    );

    return {
      assertion: serializedAssertion,
      verification: verificationResult
    };
  }

  /**
   * Conditional UI authentication (Autofill)
   */
  async authenticateWithConditionalUI(abortSignal = null) {
    const support = await WebAuthnClient.checkSupport();
    if (!support.conditionalMediation) {
      throw new Error('Conditional mediation not supported');
    }

    const serverOptions = await this._fetchAuthenticationOptions(null, true);

    const publicKeyOptions = {
      challenge: this._base64urlToUint8Array(serverOptions.challenge),
      rpId: serverOptions.rpId || this.rpId,
      timeout: serverOptions.timeout || this.timeout,
      userVerification: serverOptions.userVerification || 'preferred',
      allowCredentials: []  // Empty for discoverable credentials
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: 'conditional',
        signal: abortSignal
      });

      const serializedAssertion = this._serializeAssertionResponse(assertion);
      return this._verifyAuthentication(serializedAssertion, serverOptions.session);
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      throw this._handleError(error);
    }
  }

  // Private methods

  async _fetchRegistrationOptions(username, displayName) {
    const response = await fetch(`${this.apiEndpoint}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get registration options');
    }

    return response.json();
  }

  async _fetchAuthenticationOptions(username, conditional = false) {
    const response = await fetch(`${this.apiEndpoint}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, conditional }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get authentication options');
    }

    return response.json();
  }

  _buildCreationOptions(serverOptions, clientOptions = {}) {
    return {
      challenge: this._base64urlToUint8Array(serverOptions.challenge),
      rp: {
        id: serverOptions.rp?.id || this.rpId,
        name: serverOptions.rp?.name || this.rpName
      },
      user: {
        id: this._base64urlToUint8Array(serverOptions.user.id),
        name: serverOptions.user.name,
        displayName: serverOptions.user.displayName
      },
      pubKeyCredParams: serverOptions.pubKeyCredParams || [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      timeout: serverOptions.timeout || this.timeout,
      excludeCredentials: (serverOptions.excludeCredentials || []).map(cred => ({
        id: this._base64urlToUint8Array(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      authenticatorSelection: {
        authenticatorAttachment: clientOptions.authenticatorAttachment ||
          serverOptions.authenticatorSelection?.authenticatorAttachment,
        residentKey: clientOptions.residentKey ||
          serverOptions.authenticatorSelection?.residentKey || 'preferred',
        userVerification: clientOptions.userVerification ||
          serverOptions.authenticatorSelection?.userVerification || 'required'
      },
      attestation: clientOptions.attestation || serverOptions.attestation || 'none',
      extensions: {
        ...serverOptions.extensions,
        ...clientOptions.extensions,
        credProps: true
      }
    };
  }

  _buildRequestOptions(serverOptions, clientOptions = {}) {
    return {
      challenge: this._base64urlToUint8Array(serverOptions.challenge),
      rpId: serverOptions.rpId || this.rpId,
      timeout: serverOptions.timeout || this.timeout,
      allowCredentials: (serverOptions.allowCredentials || []).map(cred => ({
        id: this._base64urlToUint8Array(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      userVerification: clientOptions.userVerification ||
        serverOptions.userVerification || 'required',
      extensions: {
        ...serverOptions.extensions,
        ...clientOptions.extensions
      }
    };
  }

  _serializeAttestationResponse(credential) {
    const response = credential.response;

    return {
      id: credential.id,
      rawId: this._uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        clientDataJSON: this._uint8ArrayToBase64url(
          new Uint8Array(response.clientDataJSON)
        ),
        attestationObject: this._uint8ArrayToBase64url(
          new Uint8Array(response.attestationObject)
        ),
        transports: response.getTransports?.() || [],
        publicKeyAlgorithm: response.getPublicKeyAlgorithm?.(),
        publicKey: response.getPublicKey?.()
          ? this._uint8ArrayToBase64url(new Uint8Array(response.getPublicKey()))
          : undefined,
        authenticatorData: response.getAuthenticatorData?.()
          ? this._uint8ArrayToBase64url(new Uint8Array(response.getAuthenticatorData()))
          : undefined
      },
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: credential.authenticatorAttachment
    };
  }

  _serializeAssertionResponse(assertion) {
    const response = assertion.response;

    return {
      id: assertion.id,
      rawId: this._uint8ArrayToBase64url(new Uint8Array(assertion.rawId)),
      type: assertion.type,
      response: {
        clientDataJSON: this._uint8ArrayToBase64url(
          new Uint8Array(response.clientDataJSON)
        ),
        authenticatorData: this._uint8ArrayToBase64url(
          new Uint8Array(response.authenticatorData)
        ),
        signature: this._uint8ArrayToBase64url(
          new Uint8Array(response.signature)
        ),
        userHandle: response.userHandle
          ? this._uint8ArrayToBase64url(new Uint8Array(response.userHandle))
          : null
      },
      clientExtensionResults: assertion.getClientExtensionResults(),
      authenticatorAttachment: assertion.authenticatorAttachment
    };
  }

  async _verifyRegistration(credential, session) {
    const response = await fetch(`${this.apiEndpoint}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, session }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration verification failed');
    }

    return response.json();
  }

  async _verifyAuthentication(assertion, session) {
    const response = await fetch(`${this.apiEndpoint}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertion, session }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication verification failed');
    }

    return response.json();
  }

  _base64urlToUint8Array(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  _uint8ArrayToBase64url(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  _handleError(error) {
    const errorMap = {
      'NotAllowedError': 'Operation was cancelled or timed out',
      'InvalidStateError': 'Credential already registered on this authenticator',
      'NotSupportedError': 'Authenticator does not support this operation',
      'SecurityError': 'Operation not allowed (check origin and rpId)',
      'AbortError': 'Operation was aborted',
      'ConstraintError': 'Authenticator does not meet requirements',
      'UnknownError': 'An unknown error occurred'
    };

    const message = errorMap[error.name] || error.message;
    const wrappedError = new Error(message);
    wrappedError.name = error.name;
    wrappedError.originalError = error;
    return wrappedError;
  }
}

export { WebAuthnClient };
```

### Complete Backend Implementation (Node.js)

```javascript
/**
 * FIDO2/WebAuthn Server Implementation
 * Full protocol implementation with verification
 */
const crypto = require('crypto');
const cbor = require('cbor');
const cose = require('cose-js');

// Configuration
const config = {
  rpId: process.env.RP_ID || 'localhost',
  rpName: process.env.RP_NAME || 'WebAuthn Demo',
  origin: process.env.ORIGIN || 'https://localhost:3000',
  challengeSize: 32,
  timeout: 60000
};

// Storage interfaces (implement with your database)
const storage = {
  users: new Map(),
  credentials: new Map(),
  challenges: new Map()
};

/**
 * Generate cryptographically secure challenge
 */
function generateChallenge() {
  return crypto.randomBytes(config.challengeSize);
}

/**
 * Generate user handle
 */
function generateUserHandle() {
  return crypto.randomBytes(32);
}

/**
 * Hash data with SHA-256
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

/**
 * Decode base64url to Buffer
 */
function base64urlToBuffer(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return Buffer.from(base64, 'base64');
}

/**
 * Encode Buffer to base64url
 */
function bufferToBase64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Parse authenticator data
 */
function parseAuthenticatorData(authData) {
  let offset = 0;

  // RP ID Hash (32 bytes)
  const rpIdHash = authData.slice(offset, offset + 32);
  offset += 32;

  // Flags (1 byte)
  const flags = authData[offset];
  offset += 1;

  // Sign Count (4 bytes, big-endian)
  const signCount = authData.readUInt32BE(offset);
  offset += 4;

  const result = {
    rpIdHash,
    flags: {
      userPresent: !!(flags & 0x01),
      userVerified: !!(flags & 0x04),
      backupEligible: !!(flags & 0x08),
      backedUp: !!(flags & 0x10),
      attestedCredentialData: !!(flags & 0x40),
      extensionData: !!(flags & 0x80)
    },
    signCount
  };

  // Attested Credential Data (if present)
  if (result.flags.attestedCredentialData) {
    // AAGUID (16 bytes)
    const aaguid = authData.slice(offset, offset + 16);
    offset += 16;

    // Credential ID Length (2 bytes, big-endian)
    const credentialIdLength = authData.readUInt16BE(offset);
    offset += 2;

    // Credential ID
    const credentialId = authData.slice(offset, offset + credentialIdLength);
    offset += credentialIdLength;

    // Credential Public Key (COSE format, CBOR encoded)
    const publicKeyCbor = authData.slice(offset);
    const publicKey = cbor.decodeFirstSync(publicKeyCbor);

    result.attestedCredentialData = {
      aaguid,
      credentialId,
      publicKey,
      publicKeyBytes: publicKeyCbor.slice(0, cbor.encode(publicKey).length)
    };

    offset += cbor.encode(publicKey).length;
  }

  // Extension Data (if present)
  if (result.flags.extensionData) {
    result.extensions = cbor.decodeFirstSync(authData.slice(offset));
  }

  return result;
}

/**
 * Verify COSE signature
 */
async function verifyCOSESignature(publicKey, signature, data) {
  const keyType = publicKey.get(1);  // kty
  const algorithm = publicKey.get(3); // alg

  if (keyType === 2) {  // EC2
    const curve = publicKey.get(-1);
    const x = publicKey.get(-2);
    const y = publicKey.get(-3);

    // Convert to JWK
    const jwk = {
      kty: 'EC',
      crv: curve === 1 ? 'P-256' : curve === 2 ? 'P-384' : 'P-521',
      x: bufferToBase64url(x),
      y: bufferToBase64url(y)
    };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: jwk.crv },
      false,
      ['verify']
    );

    // Convert signature from ASN.1 DER to raw format if needed
    const rawSignature = derToRaw(signature, jwk.crv);

    return crypto.subtle.verify(
      { name: 'ECDSA', hash: algorithm === -7 ? 'SHA-256' : 'SHA-384' },
      key,
      rawSignature,
      data
    );
  } else if (keyType === 3) {  // RSA
    const n = publicKey.get(-1);
    const e = publicKey.get(-2);

    const jwk = {
      kty: 'RSA',
      n: bufferToBase64url(n),
      e: bufferToBase64url(e)
    };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      data
    );
  }

  throw new Error('Unsupported key type');
}

/**
 * Convert DER signature to raw format
 */
function derToRaw(signature, curve) {
  const size = curve === 'P-256' ? 32 : curve === 'P-384' ? 48 : 66;

  // Check if already raw format
  if (signature.length === size * 2) {
    return signature;
  }

  // Parse DER
  let offset = 0;
  if (signature[offset++] !== 0x30) {
    throw new Error('Invalid DER signature');
  }

  // Skip length
  let length = signature[offset++];
  if (length & 0x80) {
    offset += length & 0x7f;
  }

  // Parse R
  if (signature[offset++] !== 0x02) {
    throw new Error('Invalid DER signature');
  }
  let rLength = signature[offset++];
  let r = signature.slice(offset, offset + rLength);
  offset += rLength;

  // Parse S
  if (signature[offset++] !== 0x02) {
    throw new Error('Invalid DER signature');
  }
  let sLength = signature[offset++];
  let s = signature.slice(offset, offset + sLength);

  // Remove leading zeros and pad to correct size
  while (r.length > size && r[0] === 0) r = r.slice(1);
  while (s.length > size && s[0] === 0) s = s.slice(1);

  const raw = Buffer.alloc(size * 2);
  r.copy(raw, size - r.length);
  s.copy(raw, size * 2 - s.length);

  return raw;
}

/**
 * Registration: Generate options
 */
async function generateRegistrationOptions(username, displayName) {
  // Get or create user
  let user = storage.users.get(username);
  if (!user) {
    user = {
      id: generateUserHandle(),
      username,
      displayName: displayName || username,
      credentials: []
    };
    storage.users.set(username, user);
  }

  const challenge = generateChallenge();
  const session = crypto.randomBytes(32).toString('hex');

  // Store challenge
  storage.challenges.set(session, {
    challenge: bufferToBase64url(challenge),
    username,
    type: 'registration',
    timestamp: Date.now()
  });

  // Get existing credentials to exclude
  const excludeCredentials = user.credentials.map(cred => ({
    id: bufferToBase64url(cred.id),
    type: 'public-key',
    transports: cred.transports || []
  }));

  return {
    challenge: bufferToBase64url(challenge),
    rp: {
      id: config.rpId,
      name: config.rpName
    },
    user: {
      id: bufferToBase64url(user.id),
      name: user.username,
      displayName: user.displayName
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }, // RS256
      { type: 'public-key', alg: -8 }    // EdDSA
    ],
    timeout: config.timeout,
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required'
    },
    attestation: 'none',
    session
  };
}

/**
 * Registration: Verify response
 */
async function verifyRegistrationResponse(credential, session) {
  // Get stored challenge
  const storedChallenge = storage.challenges.get(session);
  if (!storedChallenge || storedChallenge.type !== 'registration') {
    throw new Error('Invalid session');
  }

  // Check expiration (5 minutes)
  if (Date.now() - storedChallenge.timestamp > 300000) {
    storage.challenges.delete(session);
    throw new Error('Challenge expired');
  }

  const user = storage.users.get(storedChallenge.username);
  if (!user) {
    throw new Error('User not found');
  }

  // Decode client data
  const clientDataJSON = base64urlToBuffer(credential.response.clientDataJSON);
  const clientData = JSON.parse(clientDataJSON.toString('utf8'));

  // Verify client data
  if (clientData.type !== 'webauthn.create') {
    throw new Error('Invalid ceremony type');
  }

  if (clientData.challenge !== storedChallenge.challenge) {
    throw new Error('Challenge mismatch');
  }

  if (clientData.origin !== config.origin) {
    throw new Error('Origin mismatch');
  }

  // Decode attestation object
  const attestationObject = base64urlToBuffer(credential.response.attestationObject);
  const attestation = cbor.decodeFirstSync(attestationObject);

  // Parse authenticator data
  const authData = parseAuthenticatorData(attestation.authData);

  // Verify RP ID hash
  const expectedRpIdHash = sha256(Buffer.from(config.rpId));
  if (!authData.rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID hash mismatch');
  }

  // Verify user presence
  if (!authData.flags.userPresent) {
    throw new Error('User presence not verified');
  }

  // Verify user verification (if required)
  // if (!authData.flags.userVerified) {
  //   throw new Error('User verification not performed');
  // }

  // Get credential data
  if (!authData.attestedCredentialData) {
    throw new Error('No attested credential data');
  }

  const { credentialId, publicKey, aaguid } = authData.attestedCredentialData;

  // Verify attestation (if not 'none')
  if (attestation.fmt !== 'none') {
    // Implement attestation verification based on format
    await verifyAttestation(attestation, authData, clientDataJSON);
  }

  // Store credential
  const storedCredential = {
    id: credentialId,
    publicKey,
    signCount: authData.signCount,
    aaguid,
    transports: credential.response.transports || [],
    createdAt: new Date(),
    lastUsed: null,
    backupEligible: authData.flags.backupEligible,
    backedUp: authData.flags.backedUp
  };

  user.credentials.push(storedCredential);
  storage.credentials.set(bufferToBase64url(credentialId), {
    userId: user.id,
    ...storedCredential
  });

  // Clean up
  storage.challenges.delete(session);

  return {
    verified: true,
    credentialId: bufferToBase64url(credentialId),
    publicKeyAlgorithm: publicKey.get(3),
    backupEligible: authData.flags.backupEligible,
    backedUp: authData.flags.backedUp
  };
}

/**
 * Authentication: Generate options
 */
async function generateAuthenticationOptions(username, conditional = false) {
  const challenge = generateChallenge();
  const session = crypto.randomBytes(32).toString('hex');

  // Build allow credentials
  let allowCredentials = [];
  if (username && !conditional) {
    const user = storage.users.get(username);
    if (user) {
      allowCredentials = user.credentials.map(cred => ({
        id: bufferToBase64url(cred.id),
        type: 'public-key',
        transports: cred.transports
      }));
    }
  }

  // Store challenge
  storage.challenges.set(session, {
    challenge: bufferToBase64url(challenge),
    username,
    type: 'authentication',
    conditional,
    timestamp: Date.now()
  });

  return {
    challenge: bufferToBase64url(challenge),
    rpId: config.rpId,
    timeout: config.timeout,
    allowCredentials: conditional ? [] : allowCredentials,
    userVerification: 'required',
    session
  };
}

/**
 * Authentication: Verify response
 */
async function verifyAuthenticationResponse(assertion, session) {
  // Get stored challenge
  const storedChallenge = storage.challenges.get(session);
  if (!storedChallenge || storedChallenge.type !== 'authentication') {
    throw new Error('Invalid session');
  }

  // Check expiration
  if (Date.now() - storedChallenge.timestamp > 300000) {
    storage.challenges.delete(session);
    throw new Error('Challenge expired');
  }

  // Find credential
  const credentialId = assertion.rawId;
  const storedCredential = storage.credentials.get(credentialId);
  if (!storedCredential) {
    throw new Error('Credential not found');
  }

  // Find user
  let user = null;
  for (const [, u] of storage.users) {
    if (u.credentials.some(c => bufferToBase64url(c.id) === credentialId)) {
      user = u;
      break;
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  // Decode client data
  const clientDataJSON = base64urlToBuffer(assertion.response.clientDataJSON);
  const clientData = JSON.parse(clientDataJSON.toString('utf8'));

  // Verify client data
  if (clientData.type !== 'webauthn.get') {
    throw new Error('Invalid ceremony type');
  }

  if (clientData.challenge !== storedChallenge.challenge) {
    throw new Error('Challenge mismatch');
  }

  if (clientData.origin !== config.origin) {
    throw new Error('Origin mismatch');
  }

  // Decode authenticator data
  const authenticatorData = base64urlToBuffer(assertion.response.authenticatorData);
  const authData = parseAuthenticatorData(authenticatorData);

  // Verify RP ID hash
  const expectedRpIdHash = sha256(Buffer.from(config.rpId));
  if (!authData.rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID hash mismatch');
  }

  // Verify user presence
  if (!authData.flags.userPresent) {
    throw new Error('User presence not verified');
  }

  // Verify signature
  const signature = base64urlToBuffer(assertion.response.signature);
  const clientDataHash = sha256(clientDataJSON);
  const signedData = Buffer.concat([authenticatorData, clientDataHash]);

  const signatureValid = await verifyCOSESignature(
    storedCredential.publicKey,
    signature,
    signedData
  );

  if (!signatureValid) {
    throw new Error('Signature verification failed');
  }

  // Verify counter
  if (authData.signCount !== 0 || storedCredential.signCount !== 0) {
    if (authData.signCount <= storedCredential.signCount) {
      // Possible cloned authenticator
      console.warn('Sign count not increased - possible cloned authenticator');
      // Decide how to handle: reject, notify user, or accept with warning
    }
  }

  // Update credential
  storedCredential.signCount = authData.signCount;
  storedCredential.lastUsed = new Date();

  // Clean up
  storage.challenges.delete(session);

  return {
    verified: true,
    user: {
      id: bufferToBase64url(user.id),
      username: user.username,
      displayName: user.displayName
    },
    credentialId: credentialId,
    signCount: authData.signCount,
    backupState: authData.flags.backedUp
  };
}

/**
 * Verify attestation statement
 */
async function verifyAttestation(attestation, authData, clientDataJSON) {
  const { fmt, attStmt } = attestation;

  switch (fmt) {
    case 'packed':
      return verifyPackedAttestation(attStmt, authData, clientDataJSON);
    case 'tpm':
      return verifyTPMAttestation(attStmt, authData, clientDataJSON);
    case 'android-key':
      return verifyAndroidKeyAttestation(attStmt, authData, clientDataJSON);
    case 'android-safetynet':
      return verifyAndroidSafetyNetAttestation(attStmt, authData, clientDataJSON);
    case 'fido-u2f':
      return verifyU2FAttestation(attStmt, authData, clientDataJSON);
    case 'apple':
      return verifyAppleAttestation(attStmt, authData, clientDataJSON);
    case 'none':
      return true;
    default:
      throw new Error(`Unsupported attestation format: ${fmt}`);
  }
}

/**
 * Verify packed attestation
 */
async function verifyPackedAttestation(attStmt, authData, clientDataJSON) {
  const clientDataHash = sha256(clientDataJSON);
  const signedData = Buffer.concat([authData.rawAuthData, clientDataHash]);

  if (attStmt.x5c) {
    // Full attestation with certificate chain
    const certificate = attStmt.x5c[0];
    // Verify certificate chain and signature
    // Implementation depends on your certificate validation requirements
    return true;
  } else if (attStmt.ecdaaKeyId) {
    // ECDAA attestation
    throw new Error('ECDAA attestation not supported');
  } else {
    // Self attestation
    // Verify signature with credential public key
    return verifyCOSESignature(
      authData.attestedCredentialData.publicKey,
      attStmt.sig,
      signedData
    );
  }
}

// Express.js routes
const express = require('express');
const router = express.Router();

router.post('/register/options', async (req, res) => {
  try {
    const { username, displayName } = req.body;
    const options = await generateRegistrationOptions(username, displayName);
    res.json(options);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/register/verify', async (req, res) => {
  try {
    const { credential, session } = req.body;
    const result = await verifyRegistrationResponse(credential, session);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login/options', async (req, res) => {
  try {
    const { username, conditional } = req.body;
    const options = await generateAuthenticationOptions(username, conditional);
    res.json(options);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login/verify', async (req, res) => {
  try {
    const { assertion, session } = req.body;
    const result = await verifyAuthenticationResponse(assertion, session);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Python Backend Implementation

```python
"""
FIDO2/WebAuthn Server Implementation in Python
Using py_webauthn library for FIDO2 compliance
"""

import os
import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from base64 import urlsafe_b64encode, urlsafe_b64decode

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
    parse_authenticator_data,
    parse_client_data_json,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    AuthenticatorAttachment,
    PublicKeyCredentialDescriptor,
    AuthenticatorTransport,
    AttestationConveyancePreference,
    RegistrationCredential,
    AuthenticationCredential,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier

from flask import Flask, request, jsonify, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

# Configuration
class Config:
    RP_ID = os.environ.get('RP_ID', 'localhost')
    RP_NAME = os.environ.get('RP_NAME', 'WebAuthn Demo')
    ORIGIN = os.environ.get('ORIGIN', 'https://localhost:3000')
    CHALLENGE_SIZE = 32
    TIMEOUT = 60000  # milliseconds

config = Config()


@dataclass
class StoredCredential:
    """Stored credential information"""
    credential_id: bytes
    public_key: bytes
    sign_count: int
    aaguid: bytes
    transports: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    backup_eligible: bool = False
    backed_up: bool = False
    device_type: str = "unknown"


@dataclass
class User:
    """User account"""
    user_id: bytes
    username: str
    display_name: str
    credentials: List[StoredCredential] = field(default_factory=list)


# In-memory storage (use database in production)
users: Dict[str, User] = {}
credentials: Dict[str, StoredCredential] = {}
challenges: Dict[str, Dict[str, Any]] = {}


def get_or_create_user(username: str, display_name: Optional[str] = None) -> User:
    """Get existing user or create new one"""
    if username not in users:
        users[username] = User(
            user_id=secrets.token_bytes(32),
            username=username,
            display_name=display_name or username
        )
    return users[username]


def get_user_by_credential_id(credential_id: bytes) -> Optional[User]:
    """Find user by credential ID"""
    cred_b64 = bytes_to_base64url(credential_id)
    if cred_b64 in credentials:
        stored_cred = credentials[cred_b64]
        for user in users.values():
            for cred in user.credentials:
                if cred.credential_id == credential_id:
                    return user
    return None


@app.route('/api/webauthn/register/options', methods=['POST'])
def registration_options():
    """Generate registration options"""
    try:
        data = request.get_json()
        username = data.get('username')
        display_name = data.get('displayName', username)

        if not username:
            return jsonify({'error': 'Username is required'}), 400

        user = get_or_create_user(username, display_name)

        # Build exclude credentials
        exclude_credentials = [
            PublicKeyCredentialDescriptor(
                id=cred.credential_id,
                transports=[AuthenticatorTransport(t) for t in cred.transports if t]
            )
            for cred in user.credentials
        ]

        # Generate options
        options = generate_registration_options(
            rp_id=config.RP_ID,
            rp_name=config.RP_NAME,
            user_id=user.user_id,
            user_name=username,
            user_display_name=user.display_name,
            attestation=AttestationConveyancePreference.NONE,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
            exclude_credentials=exclude_credentials,
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
            timeout=config.TIMEOUT,
        )

        # Store challenge
        session_id = secrets.token_hex(32)
        challenges[session_id] = {
            'challenge': bytes_to_base64url(options.challenge),
            'username': username,
            'type': 'registration',
            'timestamp': datetime.utcnow().isoformat()
        }

        # Convert to JSON-serializable format
        options_dict = json.loads(options_to_json(options))
        options_dict['session'] = session_id

        return jsonify(options_dict)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/webauthn/register/verify', methods=['POST'])
def registration_verify():
    """Verify registration response"""
    try:
        data = request.get_json()
        credential_data = data.get('credential')
        session_id = data.get('session')

        # Get stored challenge
        stored = challenges.get(session_id)
        if not stored or stored['type'] != 'registration':
            return jsonify({'error': 'Invalid session'}), 400

        # Check expiration (5 minutes)
        created = datetime.fromisoformat(stored['timestamp'])
        if datetime.utcnow() - created > timedelta(minutes=5):
            del challenges[session_id]
            return jsonify({'error': 'Challenge expired'}), 400

        user = users.get(stored['username'])
        if not user:
            return jsonify({'error': 'User not found'}), 400

        # Build credential object
        credential = RegistrationCredential.parse_raw(json.dumps(credential_data))

        # Verify registration
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(stored['challenge']),
            expected_origin=config.ORIGIN,
            expected_rp_id=config.RP_ID,
            require_user_verification=True,
        )

        # Store credential
        stored_credential = StoredCredential(
            credential_id=verification.credential_id,
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            aaguid=verification.aaguid if verification.aaguid else b'',
            transports=credential_data.get('response', {}).get('transports', []),
            backup_eligible=verification.credential_backed_up is not None,
            backed_up=verification.credential_backed_up or False,
            device_type=verification.credential_device_type or 'unknown',
        )

        user.credentials.append(stored_credential)
        credentials[bytes_to_base64url(verification.credential_id)] = stored_credential

        # Clean up
        del challenges[session_id]

        return jsonify({
            'verified': True,
            'credentialId': bytes_to_base64url(verification.credential_id),
            'backupEligible': stored_credential.backup_eligible,
            'backedUp': stored_credential.backed_up,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/webauthn/login/options', methods=['POST'])
def authentication_options():
    """Generate authentication options"""
    try:
        data = request.get_json()
        username = data.get('username')
        conditional = data.get('conditional', False)

        # Build allow credentials
        allow_credentials = []
        if username and not conditional:
            user = users.get(username)
            if user:
                allow_credentials = [
                    PublicKeyCredentialDescriptor(
                        id=cred.credential_id,
                        transports=[AuthenticatorTransport(t) for t in cred.transports if t]
                    )
                    for cred in user.credentials
                ]

        options = generate_authentication_options(
            rp_id=config.RP_ID,
            timeout=config.TIMEOUT,
            allow_credentials=allow_credentials if not conditional else None,
            user_verification=UserVerificationRequirement.REQUIRED,
        )

        # Store challenge
        session_id = secrets.token_hex(32)
        challenges[session_id] = {
            'challenge': bytes_to_base64url(options.challenge),
            'username': username,
            'type': 'authentication',
            'conditional': conditional,
            'timestamp': datetime.utcnow().isoformat()
        }

        options_dict = json.loads(options_to_json(options))
        options_dict['session'] = session_id

        return jsonify(options_dict)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/webauthn/login/verify', methods=['POST'])
def authentication_verify():
    """Verify authentication response"""
    try:
        data = request.get_json()
        assertion_data = data.get('assertion')
        session_id = data.get('session')

        # Get stored challenge
        stored = challenges.get(session_id)
        if not stored or stored['type'] != 'authentication':
            return jsonify({'error': 'Invalid session'}), 400

        # Check expiration
        created = datetime.fromisoformat(stored['timestamp'])
        if datetime.utcnow() - created > timedelta(minutes=5):
            del challenges[session_id]
            return jsonify({'error': 'Challenge expired'}), 400

        # Find credential
        credential_id = base64url_to_bytes(assertion_data['rawId'])
        stored_credential = credentials.get(bytes_to_base64url(credential_id))

        if not stored_credential:
            return jsonify({'error': 'Credential not found'}), 400

        # Find user
        user = get_user_by_credential_id(credential_id)
        if not user:
            return jsonify({'error': 'User not found'}), 400

        # Build credential object
        credential = AuthenticationCredential.parse_raw(json.dumps(assertion_data))

        # Verify authentication
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(stored['challenge']),
            expected_origin=config.ORIGIN,
            expected_rp_id=config.RP_ID,
            credential_public_key=stored_credential.public_key,
            credential_current_sign_count=stored_credential.sign_count,
            require_user_verification=True,
        )

        # Check for possible cloned authenticator
        if verification.new_sign_count <= stored_credential.sign_count:
            if stored_credential.sign_count != 0:
                # Log warning but don't necessarily fail
                app.logger.warning(
                    f"Sign count not increased for credential {assertion_data['rawId']}. "
                    f"Previous: {stored_credential.sign_count}, Current: {verification.new_sign_count}"
                )

        # Update credential
        stored_credential.sign_count = verification.new_sign_count
        stored_credential.last_used = datetime.utcnow()

        # Clean up
        del challenges[session_id]

        return jsonify({
            'verified': True,
            'user': {
                'id': bytes_to_base64url(user.user_id),
                'username': user.username,
                'displayName': user.display_name,
            },
            'credentialId': bytes_to_base64url(credential_id),
            'signCount': verification.new_sign_count,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/webauthn/credentials', methods=['GET'])
def list_credentials():
    """List user's credentials"""
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username required'}), 400

    user = users.get(username)
    if not user:
        return jsonify({'credentials': []})

    creds = []
    for cred in user.credentials:
        creds.append({
            'id': bytes_to_base64url(cred.credential_id),
            'createdAt': cred.created_at.isoformat(),
            'lastUsed': cred.last_used.isoformat() if cred.last_used else None,
            'backupEligible': cred.backup_eligible,
            'backedUp': cred.backed_up,
            'transports': cred.transports,
        })

    return jsonify({'credentials': creds})


@app.route('/api/webauthn/credentials/<credential_id>', methods=['DELETE'])
def delete_credential(credential_id: str):
    """Delete a credential"""
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username required'}), 400

    user = users.get(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Find and remove credential
    cred_bytes = base64url_to_bytes(credential_id)
    user.credentials = [c for c in user.credentials if c.credential_id != cred_bytes]

    if credential_id in credentials:
        del credentials[credential_id]

    return jsonify({'deleted': True})


if __name__ == '__main__':
    # Use HTTPS in production
    app.run(host='0.0.0.0', port=3000, debug=True)
```

## Best Practices

### Security Configuration

**1. Challenge Generation:**

```javascript
// Always use cryptographically secure random bytes
function generateChallenge(size = 32) {
  // Node.js
  const crypto = require('crypto');
  return crypto.randomBytes(size);

  // Browser
  // const array = new Uint8Array(size);
  // crypto.getRandomValues(array);
  // return array;
}

// Never reuse challenges
const challengeStore = new Map();

function storeChallenge(sessionId, challenge) {
  challengeStore.set(sessionId, {
    challenge,
    createdAt: Date.now(),
    used: false
  });

  // Auto-expire after 5 minutes
  setTimeout(() => challengeStore.delete(sessionId), 5 * 60 * 1000);
}

function consumeChallenge(sessionId) {
  const stored = challengeStore.get(sessionId);
  if (!stored || stored.used) {
    throw new Error('Invalid or expired challenge');
  }
  stored.used = true;
  challengeStore.delete(sessionId);
  return stored.challenge;
}
```

**2. RP ID Configuration:**

```javascript
// RP ID must be a valid domain or registrable suffix
const validRpIds = {
  // Exact domain match
  'example.com': ['https://example.com', 'https://www.example.com'],

  // Registrable domain suffix
  'example.com': ['https://app.example.com', 'https://auth.example.com'],

  // Invalid: cannot use public suffix
  // 'com': INVALID
  // 'github.io': INVALID for github.io pages
};

// Server-side validation
function validateOrigin(clientDataOrigin, expectedOrigins) {
  if (!expectedOrigins.includes(clientDataOrigin)) {
    throw new Error(`Invalid origin: ${clientDataOrigin}`);
  }
}

function validateRpIdHash(authDataRpIdHash, expectedRpId) {
  const expectedHash = sha256(Buffer.from(expectedRpId));
  if (!authDataRpIdHash.equals(expectedHash)) {
    throw new Error('RP ID hash mismatch');
  }
}
```

**3. User Verification Requirements:**

```javascript
// Determine UV requirement based on security context
function getUserVerificationRequirement(context) {
  switch (context) {
    case 'high-value-transaction':
      return 'required';  // Always require UV

    case 'standard-authentication':
      return 'preferred'; // Request UV but allow without

    case 'second-factor':
      return 'discouraged'; // Password already verified

    default:
      return 'required';
  }
}

// Verify UV flag on server
function verifyUserVerification(authData, requirement) {
  const flags = parseAuthenticatorFlags(authData[32]);

  if (requirement === 'required' && !flags.userVerified) {
    throw new Error('User verification required but not performed');
  }

  return flags.userVerified;
}
```

### User Experience Design

**1. Progressive Enhancement:**

```javascript
async function initializeAuthentication() {
  const support = await WebAuthnClient.checkSupport();

  if (!support.webauthn) {
    // Fall back to password-only
    showPasswordOnlyForm();
    return;
  }

  if (support.conditionalMediation) {
    // Enable autofill
    setupConditionalUI();
  }

  if (support.platformAuthenticator) {
    // Show "Sign in with Face ID/Touch ID/Windows Hello"
    showPlatformAuthenticatorOption();
  }

  // Always show security key option
  showSecurityKeyOption();

  // Provide password fallback
  showPasswordFallback();
}
```

**2. Clear Error Messages:**

```javascript
const ERROR_MESSAGES = {
  'NotAllowedError': {
    title: 'Authentication Cancelled',
    message: 'The authentication was cancelled or timed out. Please try again.',
    action: 'retry'
  },
  'InvalidStateError': {
    title: 'Already Registered',
    message: 'This security key is already registered with your account.',
    action: 'use-existing'
  },
  'NotSupportedError': {
    title: 'Not Supported',
    message: 'Your device does not support this authentication method.',
    action: 'try-alternative'
  },
  'SecurityError': {
    title: 'Security Error',
    message: 'Please ensure you are using a secure (HTTPS) connection.',
    action: 'check-connection'
  },
  'AbortError': {
    title: 'Operation Aborted',
    message: 'The operation was cancelled.',
    action: 'retry'
  },
  'ConstraintError': {
    title: 'Requirements Not Met',
    message: 'Your authenticator does not meet the security requirements.',
    action: 'try-alternative'
  }
};

function getErrorDetails(error) {
  return ERROR_MESSAGES[error.name] || {
    title: 'Authentication Failed',
    message: error.message || 'An unexpected error occurred.',
    action: 'contact-support'
  };
}
```

**3. Credential Management UI:**

```javascript
// Provide clear credential management
async function renderCredentialsList(credentials) {
  return credentials.map(cred => ({
    id: cred.id,
    displayName: getCredentialDisplayName(cred),
    createdAt: formatDate(cred.createdAt),
    lastUsed: cred.lastUsed ? formatDate(cred.lastUsed) : 'Never',
    status: getCredentialStatus(cred),
    icon: getCredentialIcon(cred)
  }));
}

function getCredentialDisplayName(cred) {
  // Use device type and creation date
  const deviceType = cred.deviceType === 'singleDevice'
    ? 'Security Key'
    : 'Synced Passkey';
  const platform = cred.transports?.includes('internal')
    ? 'This Device'
    : 'External';
  return `${deviceType} (${platform})`;
}

function getCredentialStatus(cred) {
  if (cred.backedUp) {
    return { label: 'Synced', color: 'green' };
  }
  if (cred.backupEligible) {
    return { label: 'Backup Available', color: 'yellow' };
  }
  return { label: 'Single Device', color: 'gray' };
}
```

### Fallback Mechanisms

**1. Multi-Method Authentication:**

```javascript
class AuthenticationManager {
  constructor() {
    this.methods = [];
    this.initializeMethods();
  }

  async initializeMethods() {
    const webauthnSupport = await WebAuthnClient.checkSupport();

    if (webauthnSupport.platformAuthenticator) {
      this.methods.push({
        id: 'platform',
        name: 'Face ID / Touch ID / Windows Hello',
        priority: 1,
        available: true
      });
    }

    if (webauthnSupport.webauthn) {
      this.methods.push({
        id: 'security-key',
        name: 'Security Key',
        priority: 2,
        available: true
      });
    }

    this.methods.push({
      id: 'password',
      name: 'Password',
      priority: 10,
      available: true
    });

    this.methods.sort((a, b) => a.priority - b.priority);
  }

  async authenticate(preferredMethod = null) {
    const method = preferredMethod
      ? this.methods.find(m => m.id === preferredMethod)
      : this.methods.find(m => m.available);

    try {
      return await this.executeMethod(method);
    } catch (error) {
      // Try next available method
      const nextMethod = this.methods.find(
        m => m.available && m.priority > method.priority
      );
      if (nextMethod) {
        console.log(`Falling back to ${nextMethod.name}`);
        return this.authenticate(nextMethod.id);
      }
      throw error;
    }
  }

  async executeMethod(method) {
    switch (method.id) {
      case 'platform':
        return this.platformAuth();
      case 'security-key':
        return this.securityKeyAuth();
      case 'password':
        return this.passwordAuth();
      default:
        throw new Error(`Unknown method: ${method.id}`);
    }
  }
}
```

**2. Recovery Options:**

```javascript
// Implement multiple recovery paths
const recoveryMethods = {
  // Backup passkey on different device
  async backupPasskey(userId) {
    // Guide user to register passkey on different device
    const options = await generateRegistrationOptions(userId, {
      authenticatorAttachment: 'cross-platform'
    });
    return startRegistration(options);
  },

  // Recovery codes
  async generateRecoveryCodes(userId, count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code.match(/.{4}/g).join('-')); // Format: XXXX-XXXX
    }

    // Store hashed codes
    const hashedCodes = codes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );
    await db.users.update(userId, { recoveryCodes: hashedCodes });

    return codes; // Return plaintext codes once for user to save
  },

  // Email-based recovery (with verification delay)
  async initiateEmailRecovery(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await db.recoveryRequests.create({
      email,
      token: crypto.createHash('sha256').update(token).digest('hex'),
      expiresAt,
      status: 'pending'
    });

    // Add intentional delay for security
    await sendRecoveryEmail(email, token, '24 hours');

    return { message: 'Recovery email sent. Check your inbox.' };
  }
};
```

## Common Pitfalls

### Pitfall 1: Improper Certificate Verification

```javascript
// BAD: Accepting any attestation without verification
function verifyRegistration(credential) {
  // Just storing the credential without verifying attestation
  storeCredential(credential);
}

// GOOD: Proper attestation verification
async function verifyRegistration(credential, expectedChallenge) {
  // 1. Verify client data
  const clientData = JSON.parse(
    Buffer.from(credential.response.clientDataJSON, 'base64url').toString()
  );

  if (clientData.type !== 'webauthn.create') {
    throw new Error('Invalid ceremony type');
  }

  if (clientData.challenge !== expectedChallenge) {
    throw new Error('Challenge mismatch');
  }

  if (clientData.origin !== config.ORIGIN) {
    throw new Error('Origin mismatch');
  }

  // 2. Verify attestation object
  const attestation = cbor.decode(
    Buffer.from(credential.response.attestationObject, 'base64url')
  );

  // 3. Verify RP ID hash
  const authData = parseAuthenticatorData(attestation.authData);
  const expectedRpIdHash = sha256(config.RP_ID);

  if (!authData.rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID hash mismatch');
  }

  // 4. Verify attestation statement (if not 'none')
  if (attestation.fmt !== 'none') {
    await verifyAttestationStatement(attestation);
  }

  return authData;
}
```

### Pitfall 2: Attestation Object Handling

```javascript
// BAD: Not properly handling different attestation formats
function parseAttestation(attestationObject) {
  return JSON.parse(attestationObject); // Wrong! It's CBOR, not JSON
}

// GOOD: Proper CBOR decoding
const cbor = require('cbor');

function parseAttestation(attestationObject) {
  const buffer = base64urlToBuffer(attestationObject);
  const decoded = cbor.decodeFirstSync(buffer);

  return {
    fmt: decoded.fmt,
    authData: decoded.authData,
    attStmt: decoded.attStmt
  };
}

// Handle different attestation formats
function verifyAttestationStatement(attestation, authData, clientDataJSON) {
  switch (attestation.fmt) {
    case 'none':
      // No attestation - acceptable for most use cases
      return true;

    case 'packed':
      return verifyPackedAttestation(attestation, authData, clientDataJSON);

    case 'tpm':
      return verifyTPMAttestation(attestation, authData, clientDataJSON);

    case 'android-key':
      return verifyAndroidKeyAttestation(attestation, authData, clientDataJSON);

    case 'fido-u2f':
      return verifyU2FAttestation(attestation, authData, clientDataJSON);

    case 'apple':
      return verifyAppleAttestation(attestation, authData, clientDataJSON);

    default:
      throw new Error(`Unknown attestation format: ${attestation.fmt}`);
  }
}
```

### Pitfall 3: Cross-Origin Issues

```javascript
// BAD: Mismatched RP ID and origin
const config = {
  rpId: 'example.com',
  origin: 'https://app.different-domain.com' // Will fail!
};

// GOOD: RP ID must be same or registrable suffix of origin
const config = {
  rpId: 'example.com',
  origin: 'https://app.example.com' // Valid: origin's domain matches RP ID
};

// Or for exact domain match:
const config = {
  rpId: 'app.example.com',
  origin: 'https://app.example.com'
};

// Server-side validation
function validateOriginAgainstRpId(origin, rpId) {
  const originUrl = new URL(origin);
  const originHost = originUrl.hostname;

  // Origin host must equal rpId or be a subdomain of rpId
  if (originHost === rpId) {
    return true;
  }

  if (originHost.endsWith('.' + rpId)) {
    return true;
  }

  throw new Error(`Origin ${origin} does not match RP ID ${rpId}`);
}
```

### Pitfall 4: Sign Count Verification

```javascript
// BAD: Ignoring sign count
function verifyAssertion(assertion, storedCredential) {
  // Verify signature...
  // Update credential without checking sign count
  storedCredential.signCount = newSignCount;
}

// GOOD: Proper sign count verification
function verifyAssertion(assertion, storedCredential) {
  const authData = parseAuthenticatorData(assertion.authenticatorData);
  const newSignCount = authData.signCount;

  // Sign count of 0 means the authenticator doesn't support counters
  // In that case, skip the check
  if (storedCredential.signCount !== 0 || newSignCount !== 0) {
    if (newSignCount <= storedCredential.signCount) {
      // Possible cloned authenticator!
      // Options:
      // 1. Reject authentication
      // 2. Accept but flag for review
      // 3. Notify user

      logSecurityEvent({
        type: 'POSSIBLE_CLONED_AUTHENTICATOR',
        credentialId: assertion.id,
        storedCount: storedCredential.signCount,
        newCount: newSignCount
      });

      // Decision: reject or accept with warning
      throw new Error('Sign count verification failed - possible cloned authenticator');
    }
  }

  storedCredential.signCount = newSignCount;
}
```

### Pitfall 5: User Handle Confusion

```javascript
// BAD: Using username as user handle
const options = {
  user: {
    id: Buffer.from(username), // Exposes username!
    name: username,
    displayName: displayName
  }
};

// GOOD: Use opaque, random user handle
function generateUserHandle() {
  return crypto.randomBytes(32);
}

const options = {
  user: {
    id: generateUserHandle(), // Random opaque identifier
    name: username,           // Username for display
    displayName: displayName  // Friendly name
  }
};

// Store mapping between user handle and user account
async function storeUserHandle(userId, userHandle) {
  await db.users.update(userId, {
    webauthnUserHandle: userHandle
  });
}

// Look up user by user handle during authentication
async function getUserByUserHandle(userHandle) {
  return db.users.findOne({
    webauthnUserHandle: userHandle
  });
}
```

## Performance Considerations

### Authentication Latency

```javascript
// Measure and optimize authentication latency
class AuthenticationMetrics {
  constructor() {
    this.metrics = [];
  }

  async measureAuthentication(authenticateFn) {
    const startTime = performance.now();
    const stages = {};

    try {
      // Stage 1: Get options from server
      stages.optionsFetch = performance.now();
      const options = await this.fetchOptions();
      stages.optionsFetchEnd = performance.now();

      // Stage 2: WebAuthn API call
      stages.webauthnStart = performance.now();
      const credential = await authenticateFn(options);
      stages.webauthnEnd = performance.now();

      // Stage 3: Server verification
      stages.verifyStart = performance.now();
      const result = await this.verifyCredential(credential);
      stages.verifyEnd = performance.now();

      const totalTime = performance.now() - startTime;

      this.metrics.push({
        timestamp: Date.now(),
        totalTime,
        optionsFetch: stages.optionsFetchEnd - stages.optionsFetch,
        webauthnTime: stages.webauthnEnd - stages.webauthnStart,
        verifyTime: stages.verifyEnd - stages.verifyStart
      });

      return result;
    } catch (error) {
      this.metrics.push({
        timestamp: Date.now(),
        error: error.name,
        totalTime: performance.now() - startTime
      });
      throw error;
    }
  }

  getAverageMetrics() {
    const successful = this.metrics.filter(m => !m.error);
    if (successful.length === 0) return null;

    return {
      avgTotalTime: average(successful.map(m => m.totalTime)),
      avgOptionsFetch: average(successful.map(m => m.optionsFetch)),
      avgWebauthnTime: average(successful.map(m => m.webauthnTime)),
      avgVerifyTime: average(successful.map(m => m.verifyTime)),
      successRate: successful.length / this.metrics.length
    };
  }
}
```

### Batch Verification

```javascript
// Optimize for multiple credential verification
async function batchVerifyCredentials(assertions, challenges) {
  // Parallel signature verification
  const verificationPromises = assertions.map(async (assertion, index) => {
    try {
      return await verifyAssertion(assertion, challenges[index]);
    } catch (error) {
      return { error, index };
    }
  });

  const results = await Promise.all(verificationPromises);

  return {
    successful: results.filter(r => !r.error),
    failed: results.filter(r => r.error)
  };
}
```

### Caching Strategies

```javascript
// Cache WebAuthn capability detection
class CapabilityCache {
  constructor(ttl = 60000) {
    this.cache = null;
    this.cacheTime = null;
    this.ttl = ttl;
  }

  async getCapabilities() {
    if (this.cache && Date.now() - this.cacheTime < this.ttl) {
      return this.cache;
    }

    this.cache = await this.detectCapabilities();
    this.cacheTime = Date.now();
    return this.cache;
  }

  async detectCapabilities() {
    if (!window.PublicKeyCredential) {
      return { supported: false };
    }

    const [platformAuth, conditionalUI] = await Promise.all([
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .catch(() => false),
      PublicKeyCredential.isConditionalMediationAvailable?.()
        .catch(() => false) ?? false
    ]);

    return {
      supported: true,
      platformAuthenticator: platformAuth,
      conditionalMediation: conditionalUI
    };
  }
}

// Cache user credentials list
const credentialsCache = new Map();

async function getUserCredentials(userId, forceRefresh = false) {
  const cacheKey = `credentials:${userId}`;

  if (!forceRefresh && credentialsCache.has(cacheKey)) {
    const cached = credentialsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.credentials;
    }
  }

  const credentials = await db.credentials.findMany({ userId });

  credentialsCache.set(cacheKey, {
    credentials,
    timestamp: Date.now()
  });

  return credentials;
}
```

## Real-World Scenarios

### Enterprise SSO Integration

```javascript
// FIDO2 integration with enterprise identity providers
class EnterpriseFIDO2Integration {
  constructor(config) {
    this.samlEndpoint = config.samlEndpoint;
    this.oidcEndpoint = config.oidcEndpoint;
    this.rpId = config.rpId;
  }

  // Step-up authentication for sensitive operations
  async stepUpAuthentication(sessionToken, requiredAssuranceLevel) {
    // Verify current session
    const session = await this.validateSession(sessionToken);

    // Check if step-up is needed
    if (session.assuranceLevel >= requiredAssuranceLevel) {
      return session;
    }

    // Require FIDO2 authentication for step-up
    const authOptions = await this.generateStepUpOptions(session.userId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        ...authOptions,
        userVerification: 'required'  // Always require UV for step-up
      }
    });

    // Verify and upgrade session
    const verified = await this.verifyStepUpAssertion(assertion, session);

    return {
      ...session,
      assuranceLevel: requiredAssuranceLevel,
      stepUpTime: Date.now()
    };
  }

  // Policy-based authenticator requirements
  async enforceAuthenticatorPolicy(userId, policy) {
    const credentials = await this.getUserCredentials(userId);

    const requirements = {
      // Require hardware-backed authenticator
      hardwareBacked: policy.requireHardware
        ? credentials.some(c => c.aaguid !== AAGUID_SOFTWARE)
        : true,

      // Require non-synced credential for high security
      singleDevice: policy.requireSingleDevice
        ? credentials.some(c => !c.backedUp)
        : true,

      // Require specific AAGUID (e.g., corporate YubiKeys)
      approvedAuthenticator: policy.allowedAAGUIDs
        ? credentials.some(c => policy.allowedAAGUIDs.includes(c.aaguid))
        : true
    };

    return {
      compliant: Object.values(requirements).every(r => r),
      requirements
    };
  }

  // FIDO2 as SAML authentication method
  async handleSAMLAuthnRequest(samlRequest) {
    const authnRequest = this.parseSAMLRequest(samlRequest);

    // Check requested authentication context
    if (authnRequest.requestedAuthnContext?.includes('fido2')) {
      // Require FIDO2 authentication
      const authResult = await this.authenticateWithFIDO2(
        authnRequest.subject
      );

      // Build SAML response with FIDO2 context
      return this.buildSAMLResponse(authResult, {
        authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:FIDO'
      });
    }
  }
}
```

### E-commerce Checkout

```javascript
// Secure checkout with FIDO2
class SecureCheckout {
  constructor(webauthnClient) {
    this.webauthnClient = webauthnClient;
  }

  async processPayment(order, paymentMethod) {
    // Generate transaction-bound challenge
    const transactionData = {
      orderId: order.id,
      amount: order.total,
      currency: order.currency,
      merchant: order.merchantId,
      timestamp: Date.now()
    };

    // Create transaction hash for binding
    const txHash = await this.hashTransaction(transactionData);

    // Get authentication with transaction binding
    const authOptions = await fetch('/api/checkout/auth-options', {
      method: 'POST',
      body: JSON.stringify({
        transactionHash: txHash,
        orderId: order.id
      })
    }).then(r => r.json());

    // Authenticate with user verification
    const assertion = await navigator.credentials.get({
      publicKey: {
        ...authOptions,
        userVerification: 'required',
        extensions: {
          // Include transaction confirmation (if supported)
          txAuthSimple: `Pay ${order.currency} ${order.total} to ${order.merchantName}`
        }
      }
    });

    // Submit payment with signed assertion
    const result = await fetch('/api/checkout/process', {
      method: 'POST',
      body: JSON.stringify({
        assertion: this.serializeAssertion(assertion),
        transactionData,
        paymentMethod
      })
    });

    return result.json();
  }

  async hashTransaction(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return bufferToBase64url(new Uint8Array(hashBuffer));
  }
}
```

### Financial Application

```javascript
// High-security FIDO2 for banking
class BankingFIDO2 {
  constructor(config) {
    this.config = config;
    this.webauthnClient = new WebAuthnClient(config);
  }

  // Tiered authentication based on transaction risk
  async authenticateForTransaction(transaction) {
    const riskLevel = await this.assessTransactionRisk(transaction);

    switch (riskLevel) {
      case 'low':
        // Recent authentication is sufficient
        if (await this.hasRecentAuth(5 * 60 * 1000)) { // 5 minutes
          return { method: 'cached', risk: riskLevel };
        }
        return this.standardAuth();

      case 'medium':
        // Require fresh FIDO2 authentication
        return this.freshAuth();

      case 'high':
        // Require FIDO2 with user verification
        return this.highSecurityAuth(transaction);

      case 'critical':
        // Require multiple factors
        return this.multiFactorAuth(transaction);
    }
  }

  async highSecurityAuth(transaction) {
    // Generate options with strict requirements
    const options = await fetch('/api/auth/high-security/options', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: transaction.id,
        amount: transaction.amount
      })
    }).then(r => r.json());

    const assertion = await navigator.credentials.get({
      publicKey: {
        ...options,
        userVerification: 'required',
        timeout: 30000  // Shorter timeout for security
      }
    });

    // Verify with additional checks
    return fetch('/api/auth/high-security/verify', {
      method: 'POST',
      body: JSON.stringify({
        assertion: this.serializeAssertion(assertion),
        transactionId: transaction.id,
        deviceFingerprint: await this.getDeviceFingerprint()
      })
    }).then(r => r.json());
  }

  async multiFactorAuth(transaction) {
    // First factor: FIDO2
    const fido2Result = await this.highSecurityAuth(transaction);

    if (!fido2Result.verified) {
      throw new Error('FIDO2 authentication failed');
    }

    // Second factor: Out-of-band confirmation
    const oobResult = await this.requestOOBConfirmation(transaction);

    return {
      verified: fido2Result.verified && oobResult.verified,
      factors: ['fido2', 'oob']
    };
  }

  // Device binding for registered devices only
  async enforceDeviceBinding(userId) {
    const registeredDevices = await this.getRegisteredDevices(userId);
    const currentDevice = await this.identifyCurrentDevice();

    const isRegistered = registeredDevices.some(
      d => d.fingerprint === currentDevice.fingerprint
    );

    if (!isRegistered) {
      throw new Error('Device not registered. Please register from a known device.');
    }

    return currentDevice;
  }
}
```

## Interview Questions

### Basic Questions

**Q1: What is the difference between FIDO2 and WebAuthn?**

A: FIDO2 is an umbrella term that encompasses two specifications:
1. **WebAuthn**: A W3C standard that defines the JavaScript API for browsers to interact with authenticators
2. **CTAP**: A FIDO Alliance specification that defines how clients communicate with external authenticators

WebAuthn is the browser-facing part of FIDO2, while CTAP handles communication with external devices.

**Q2: What are the main components of WebAuthn architecture?**

A:
1. **Relying Party (RP)**: The website/application implementing WebAuthn
2. **Client**: Browser or application with WebAuthn support
3. **Authenticator**: Device that creates and stores credentials (platform or roaming)
4. **User**: Person authenticating

**Q3: What is the difference between platform and roaming authenticators?**

A:
- **Platform authenticators**: Built into the device (Touch ID, Face ID, Windows Hello). Cannot be removed, tied to device.
- **Roaming authenticators**: External devices (YubiKey, security keys). Can be used across multiple devices, connected via USB/NFC/BLE.

### Intermediate Questions

**Q4: Explain the WebAuthn registration ceremony.**

A: The registration ceremony creates a new credential:

1. Server generates a challenge and sends `PublicKeyCredentialCreationOptions`
2. Browser calls `navigator.credentials.create()` with the options
3. Authenticator verifies user presence/verification
4. Authenticator generates a new key pair
5. Authenticator returns attestation object containing public key
6. Server verifies attestation and stores the public key
7. Server associates credential with user account

**Q5: What is the purpose of the challenge in WebAuthn?**

A: The challenge serves multiple security purposes:
1. **Replay attack prevention**: Each ceremony uses a unique challenge
2. **Freshness**: Proves the response was generated for this specific request
3. **Binding**: Links the client response to the server's request
4. **Cryptographic input**: Becomes part of the signed data

Challenges must be cryptographically random (minimum 16 bytes) and single-use.

**Q6: What is attestation and when would you require it?**

A: Attestation is cryptographic proof of the authenticator's properties (manufacturer, model, security level).

**When to require attestation:**
- Enterprise environments requiring specific hardware
- High-security applications needing certified authenticators
- Regulatory compliance requiring known authenticator types

**When to skip attestation:**
- Consumer applications prioritizing privacy
- When any FIDO2 authenticator is acceptable
- To reduce friction in registration

### Advanced Questions

**Q7: How does WebAuthn prevent phishing attacks?**

A: WebAuthn has built-in phishing resistance through multiple mechanisms:

1. **Origin binding**: Credentials are bound to the RP ID (domain). The browser automatically includes the origin in client data, which is signed.

2. **RP ID validation**: The authenticator verifies that the RP ID matches the origin. An attacker cannot create valid credentials for `bank.com` from `fake-bank.com`.

3. **Challenge-response**: The server's challenge is included in the signed response. Proxying the authentication would require real-time interception.

4. **No shared secrets**: Private keys never leave the authenticator. There's nothing to phish.

**Q8: Explain the sign count verification and its limitations.**

A: Sign count is a counter that increments with each authentication:

**Purpose:**
- Detect cloned authenticators
- If count decreases or stays same (when non-zero), the credential may be cloned

**Limitations:**
- Some authenticators don't support counters (always return 0)
- Global counters can leak usage information
- Per-credential counters are better but not universally supported
- Clock rollback or authenticator reset can cause false positives

**Mitigation:**
- Use counters as a signal, not sole decision factor
- Log anomalies for review
- Consider risk-based response (notify user, require additional verification)

**Q9: How would you implement secure credential recovery for a FIDO2-only system?**

A: Multi-layered recovery approach:

1. **Multiple credentials**: Encourage users to register multiple authenticators
   - Platform authenticator on primary device
   - Security key as backup
   - Phone as cross-device authenticator

2. **Synced passkeys**: Leverage platform sync (iCloud Keychain, Google Password Manager)
   - Credentials available on all user's devices
   - Protected by platform security

3. **Recovery codes**: One-time use codes
   - Generated at registration
   - User must store securely
   - Hash before storing on server

4. **Trusted contacts**: Social recovery
   - Designated contacts can vouch for identity
   - Requires multiple contacts for security

5. **Time-delayed email recovery**: With security measures
   - Waiting period (24-72 hours)
   - Notifications to all user's devices
   - Additional verification steps

**Q10: How do you handle the differences between WebAuthn Level 1, 2, and 3?**

A: Progressive enhancement approach:

```javascript
async function detectWebAuthnLevel() {
  const features = {
    level1: !!window.PublicKeyCredential,
    level2: {
      conditionalMediation: typeof PublicKeyCredential.isConditionalMediationAvailable === 'function',
      credProps: true, // Extension support
      largeBlob: true
    },
    level3: {
      // Newer features
      getClientCapabilities: typeof PublicKeyCredential.getClientCapabilities === 'function'
    }
  };

  return features;
}

// Implement based on available features
async function createCredential(options) {
  const features = await detectWebAuthnLevel();

  // Adjust options based on support
  if (!features.level2.largeBlob) {
    delete options.extensions?.largeBlob;
  }

  // Use conditional UI if available
  if (features.level2.conditionalMediation) {
    // Enable autofill
  }

  return navigator.credentials.create({ publicKey: options });
}
```

## Further Reading

### Official Specifications

- [W3C Web Authentication (WebAuthn) Level 2](https://www.w3.org/TR/webauthn-2/)
- [W3C Web Authentication (WebAuthn) Level 3 Draft](https://www.w3.org/TR/webauthn-3/)
- [FIDO2 CTAP Specification](https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-20210615.html)
- [FIDO Metadata Service](https://fidoalliance.org/metadata/)

### FIDO Alliance Resources

- [FIDO Alliance Official Website](https://fidoalliance.org/)
- [FIDO2 Certified Products](https://fidoalliance.org/certification/fido-certified-products/)
- [FIDO Developer Resources](https://fidoalliance.org/developers/)
- [Passkeys.dev](https://passkeys.dev/) - Developer resources for passkeys

### Libraries and Tools

**JavaScript/TypeScript:**
- [SimpleWebAuthn](https://simplewebauthn.dev/) - Comprehensive server and client libraries
- [@github/webauthn-json](https://github.com/nicbarker/webauthn-json) - JSON encoding for WebAuthn
- [CBOR-X](https://github.com/nicbarker/cbor-x) - Fast CBOR encoding/decoding

**Python:**
- [py_webauthn](https://github.com/duo-labs/py_webauthn) - Full-featured WebAuthn library
- [fido2](https://github.com/Yubico/python-fido2) - Yubico's Python library

**Go:**
- [go-webauthn](https://github.com/go-webauthn/webauthn) - WebAuthn library for Go

**Java:**
- [java-webauthn-server](https://github.com/Yubico/java-webauthn-server) - Yubico's Java library

### Testing and Development

- [WebAuthn.io](https://webauthn.io/) - Interactive WebAuthn demo
- [WebAuthn Debugger](https://webauthn.me/debugger) - Debug WebAuthn flows
- [FIDO Conformance Tools](https://fidoalliance.org/certification/functional-certification/conformance/) - Official conformance testing

### Books and Articles

- [WebAuthn: The Standard for Strong Authentication](https://www.w3.org/2019/03/webauthn-fido.pdf) - W3C Overview
- [FIDO2 and WebAuthn: Taking the Plunge](https://www.yubico.com/blog/fido2-webauthn-taking-the-plunge/) - Yubico Guide
- [Understanding WebAuthn](https://webauthn.guide/) - Duo Security Guide

### Community

- [W3C Web Authentication Working Group](https://www.w3.org/groups/wg/webauthn/)
- [FIDO Alliance Member Forum](https://fidoalliance.org/members/)
- [WebAuthn subreddit](https://www.reddit.com/r/webauthn/)
- [Stack Overflow - WebAuthn tag](https://stackoverflow.com/questions/tagged/webauthn)
