---
title: Cryptography Fundamentals
description: Master cryptographic concepts for secure application development
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - Cryptography
  - Encryption
  - Security
  - Hashing
status: imported
origin: old/src/content/docs/security/cryptography-basics.en.md
divergence: 0.209
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Security
  subcategory: Cryptography
  order: 1
  lastUpdated: 2026-01-07
---

Cryptography is the cornerstone of information security, providing the core technologies to protect data confidentiality, integrity, and authenticity. In modern software development, understanding cryptographic principles helps developers correctly use encryption tools and prevents common security vulnerabilities.

## Concept Explanation

### What is Cryptography

Cryptography derives from the Greek words for "secret writing." It is the science of secure communication in the presence of adversarial behavior. Modern cryptography encompasses encryption and decryption, data integrity verification, identity authentication, and non-repudiation.

### Historical Evolution of Cryptography

Cryptography has evolved from classical to modern forms:

- **Classical Era**: Caesar cipher, substitution ciphers, relying on algorithm secrecy
- **Modern Era**: Enigma machine, mechanical encryption
- **Contemporary Era**: Birth of DES and RSA, open algorithm design
- **Current Developments**: AES, elliptic curve cryptography, post-quantum cryptography research

### Core Objectives of Cryptography

| Objective | Description |
|-----------|-------------|
| Confidentiality | Ensures only authorized parties can read the data |
| Integrity | Detects whether data has been tampered with |
| Authentication | Verifies the identity of communicating parties |
| Non-repudiation | Sender cannot deny having sent a message |

## Core Principles

### Symmetric Encryption Principles

Symmetric encryption uses the same key for both encryption and decryption. Its core challenge lies in the key distribution problem.

```
Plaintext + Key -> [Encryption Algorithm] -> Ciphertext
Ciphertext + Key -> [Decryption Algorithm] -> Plaintext
```

**Advantages**: Fast speed, suitable for encrypting large amounts of data
**Disadvantages**: Key distribution is difficult, key management complexity grows exponentially with participants

### Asymmetric Encryption Principles

Asymmetric encryption uses a mathematically related pair of keys: a public key and a private key. The public key can be distributed openly, while the private key must be kept strictly secret.

```
Plaintext + Public Key -> [Encryption Algorithm] -> Ciphertext
Ciphertext + Private Key -> [Decryption Algorithm] -> Plaintext
```

**Mathematical Foundations**:
- RSA: Large integer factorization problem
- ECC: Elliptic curve discrete logarithm problem

### Hash Function Principles

Hash functions map arbitrary-length input to fixed-length output, with the following properties:

1. **Deterministic**: Same input always produces the same output
2. **One-way**: Cannot reverse the hash to get the original data
3. **Collision Resistance**: Difficult to find two different inputs that produce the same hash
4. **Avalanche Effect**: Small changes in input cause dramatic changes in output

## Symmetric Encryption In-Depth

### AES (Advanced Encryption Standard)

AES is currently the most widely used symmetric encryption algorithm, published by NIST in 2001, replacing the aging DES.

**Algorithm Characteristics**:
- Block cipher with fixed 128-bit block size
- Supports 128/192/256-bit key lengths
- Based on Substitution-Permutation Network (SPN) structure

**Operating Modes**:

| Mode | Full Name | Characteristics | Use Cases |
|------|-----------|-----------------|-----------|
| ECB | Electronic Codebook | Simple but insecure, identical blocks produce identical ciphertext | Not recommended |
| CBC | Cipher Block Chaining | Requires IV, sequential processing | File encryption |
| CTR | Counter | Parallelizable, no padding needed | Stream encryption |
| GCM | Galois/Counter Mode | Provides authenticated encryption (AEAD) | Network transmission preferred |

**Why GCM Mode is Recommended**:
GCM encrypts data and provides integrity verification, detecting whether data has been tampered with. It represents the best practice for Authenticated Encryption with Associated Data (AEAD).

### ChaCha20-Poly1305

ChaCha20 is a stream cipher designed by Daniel J. Bernstein, used in combination with Poly1305 MAC.

**Advantages over AES**:
- Better performance on devices without AES hardware acceleration
- Stronger resistance to timing attacks
- Heavily promoted by Google in TLS 1.3

**Suitable Scenarios**:
- Mobile device encryption
- IoT devices
- As an alternative to AES-GCM

## Asymmetric Encryption In-Depth

### RSA Algorithm

RSA is one of the earliest public-key encryption algorithms, named after its inventors Rivest, Shamir, and Adleman.

**Key Generation Process**:
1. Choose two large primes p and q
2. Calculate n = p * q
3. Calculate Euler's totient function phi(n) = (p-1)(q-1)
4. Choose public exponent e, typically 65537
5. Calculate private exponent d such that e * d is congruent to 1 (mod phi(n))

**Security Considerations**:
- Recommended key length: 2048 bits or higher
- 4096 bits provides higher security margin
- Quantum computing threat: Shor's algorithm can effectively factor large integers

**RSA Limitations**:
- Large key and ciphertext size
- Slower encryption/decryption speed
- Usually only used for encrypting symmetric keys or signing

### Elliptic Curve Cryptography (ECC)

ECC is based on the elliptic curve discrete logarithm problem, providing equivalent security with shorter keys.

**Key Length Comparison**:

| Security Level | RSA Key Length | ECC Key Length |
|----------------|----------------|----------------|
| 80-bit | 1024-bit | 160-bit |
| 128-bit | 3072-bit | 256-bit |
| 256-bit | 15360-bit | 512-bit |

**Common Curves**:
- **P-256 (secp256r1)**: NIST standard curve, widely supported
- **Curve25519**: Designed by Bernstein, avoids patent issues, TLS 1.3 preferred
- **secp256k1**: Curve used by Bitcoin

**ECC Applications**:
- ECDH: Key exchange protocol
- ECDSA: Digital signature algorithm
- EdDSA (Ed25519): Modern signature algorithm, secure and fast

## Hash Functions In-Depth

### SHA-256

SHA-256 belongs to the SHA-2 family, outputting a 256-bit (32-byte) hash value.

**Properties**:
- Preimage resistance: Cannot find original input given a hash value
- Second preimage resistance: Cannot find another input that produces the same hash given an input
- Collision resistance: Cannot find two different inputs that produce the same hash

**Use Cases**:
- Data integrity verification
- Message digest in digital signatures
- Proof of work in blockchain
- Foundation component for key derivation functions

### BLAKE3

BLAKE3 is a next-generation hash function released in 2020, an evolution of BLAKE2.

**Advantages**:
- Extremely fast, utilizing SIMD parallel processing
- Approximately 10x faster than SHA-256
- Supports streaming and tree hashing
- Can be used as PRF, MAC, KDF, and XOF

**Design Features**:
- Based on Merkle tree structure
- Inherent parallelism
- No length extension attack risk

## Password Hashing Functions

Password hashes differ from regular hash functions, specifically designed for storing passwords with the following characteristics:

### bcrypt

bcrypt is based on the Blowfish cipher algorithm, specifically designed for password hashing.

**Core Features**:
- **Cost Factor**: Controls computational complexity, adjustable as hardware evolves
- **Built-in Salt**: Automatically generates 128-bit random salt
- **Fixed Output Length**: 60-character hash string

**Recommended Configuration**:
- Cost factor: 12-14 (adjust based on server performance)
- Target: Single verification taking approximately 250ms

### Argon2

Argon2 is the winner of the 2015 Password Hashing Competition, considered the most secure password hashing algorithm currently available.

**Three Variants**:
- **Argon2d**: Resists GPU attacks but vulnerable to side-channel attacks
- **Argon2i**: Resists side-channel attacks, suitable for password hashing
- **Argon2id**: Hybrid mode, recommended as default

**Parameter Configuration**:
- Memory cost: 64MB or higher
- Time cost: 3 iterations
- Parallelism: Set based on CPU core count

**Why Argon2 is Superior**:
- Memory hardening: Requires substantial memory, increasing the cost of specialized hardware attacks
- Resistant to multiple attack vectors
- Flexible, adjustable parameters

## Digital Signatures

Digital signatures provide message integrity, authentication, and non-repudiation.

### Workflow

```
Signing Process:
Message -> [Hash] -> Digest -> [Private Key Encryption] -> Signature

Verification Process:
Message -> [Hash] -> Digest A
Signature -> [Public Key Decryption] -> Digest B
Compare Digest A == Digest B
```

### Common Signature Algorithms

| Algorithm | Characteristics | Use Cases |
|-----------|-----------------|-----------|
| RSA-PSS | RSA Probabilistic Signature Scheme, more secure than PKCS#1 v1.5 | Legacy systems |
| ECDSA | Based on elliptic curves, shorter signatures | Blockchain, mobile |
| Ed25519 | High performance, resistant to side-channel attacks | Modern applications preferred |

### Ed25519 Advantages

- Constant-time implementation, resistant to timing attacks
- Fast signing speed (tens of thousands of signatures per second)
- Small key and signature sizes (32/64 bytes respectively)
- Deterministic signatures, no random number generator required

## Key Exchange

Key exchange protocols enable two parties to establish a shared secret over an insecure channel.

### Diffie-Hellman Key Exchange

The Diffie-Hellman (DH) protocol was the first practical key exchange method, published in 1976.

**Basic Process**:
```
1. Alice and Bob agree on public parameters: prime p and generator g
2. Alice chooses private value a, calculates A = g^a mod p, sends A to Bob
3. Bob chooses private value b, calculates B = g^b mod p, sends B to Alice
4. Alice calculates shared secret: s = B^a mod p
5. Bob calculates shared secret: s = A^b mod p
6. Both arrive at the same shared secret: s = g^(ab) mod p
```

### Elliptic Curve Diffie-Hellman (ECDH)

ECDH applies the Diffie-Hellman concept to elliptic curves, providing equivalent security with smaller key sizes.

**X25519**:
- Based on Curve25519
- 32-byte public and private keys
- Resistant to timing attacks
- Preferred for TLS 1.3 key exchange

### Forward Secrecy

Forward secrecy (also called perfect forward secrecy) ensures that session keys cannot be compromised even if long-term private keys are leaked.

**Implementation**:
- Use ephemeral key pairs for each session
- Protocols like ECDHE (Ephemeral ECDH) provide forward secrecy
- TLS 1.3 mandates forward secrecy

## SSL/TLS

TLS (Transport Layer Security) is the core protocol for protecting network communications. It evolved from SSL (Secure Sockets Layer) and is essential for securing web traffic.

### TLS Handshake Process

A simplified TLS 1.3 handshake flow:

```
Client                                    Server
   |                                        |
   |-------- ClientHello ------------------>|
   |         (Supported cipher suites,      |
   |          key shares)                   |
   |                                        |
   |<------- ServerHello -------------------|
   |         (Selected cipher suite,        |
   |          key share)                    |
   |<------- EncryptedExtensions -----------|
   |<------- Certificate -------------------|
   |<------- CertificateVerify -------------|
   |<------- Finished ----------------------|
   |                                        |
   |-------- Finished --------------------->|
   |                                        |
   |<======= Encrypted Application Data ===>|
```

### TLS 1.3 Improvements

Compared to TLS 1.2, TLS 1.3 has significant improvements:

1. **Reduced Round Trips**: From 2-RTT to 1-RTT, supports 0-RTT resumption
2. **Removed Insecure Algorithms**: Disabled RSA key exchange, CBC mode, SHA-1
3. **Mandatory Forward Secrecy**: Must use ECDHE or DHE key exchange
4. **Simplified Cipher Suites**: Only AEAD algorithms retained

### Cipher Suite Example

```
TLS_AES_256_GCM_SHA384
     |     |       |
     |     |       +-- Key derivation function
     |     +---------- Authenticated encryption algorithm
     +---------------- Protocol version
```

### Certificate Chain Validation

When establishing a TLS connection, the client validates the server's certificate:

1. **Certificate Chain**: Verify the chain from server certificate to trusted root CA
2. **Validity Period**: Check that the certificate hasn't expired
3. **Revocation Status**: Check CRL or OCSP for revoked certificates
4. **Domain Matching**: Verify the certificate matches the requested domain

## Common Algorithms Summary

### Algorithm Selection Guide

| Purpose | Recommended Algorithms | Avoid |
|---------|----------------------|-------|
| Symmetric Encryption | AES-256-GCM, ChaCha20-Poly1305 | DES, 3DES, ECB mode |
| Asymmetric Encryption | RSA-OAEP (2048+ bits), ECIES | RSA-PKCS1v1.5 |
| Digital Signatures | Ed25519, ECDSA, RSA-PSS | RSA-PKCS1v1.5 |
| Hash Functions | SHA-256, SHA-3, BLAKE3 | MD5, SHA-1 |
| Password Hashing | Argon2id, bcrypt, scrypt | MD5, SHA family, PBKDF2 |
| Key Exchange | X25519, ECDH (P-256) | Static DH |

### Algorithm Performance Comparison

Approximate performance on modern hardware (for reference only):

| Operation | Performance |
|-----------|-------------|
| AES-256-GCM (hardware accelerated) | ~5 GB/s |
| ChaCha20-Poly1305 | ~2 GB/s |
| SHA-256 | ~1 GB/s |
| BLAKE3 | ~10 GB/s |
| RSA-2048 signing | ~1000/sec |
| Ed25519 signing | ~50000/sec |
| Argon2id (64MB, 3 iterations) | ~3/sec |

## Key Management

Key management is the most challenging part of cryptographic applications. Even the strongest encryption algorithm cannot compensate for poor key management.

### Key Lifecycle

1. **Generation**: Use cryptographically secure random number generators (CSPRNG)
2. **Storage**: Hardware Security Modules (HSM), Key Management Services (KMS)
3. **Distribution**: Transmit through secure channels, avoid plaintext key transmission
4. **Usage**: Principle of least privilege, audit logging
5. **Rotation**: Regularly change keys, retain old keys for decrypting historical data
6. **Destruction**: Secure erasure, ensure unrecoverable

### Key Storage Best Practices

**Recommended Solutions**:
- AWS KMS / Google Cloud KMS / Azure Key Vault
- HashiCorp Vault
- Hardware Security Modules (HSM)

**Prohibited Practices**:
- Hardcoding keys in source code
- Storing keys in version control systems
- Using environment variables for long-term keys (only suitable for temporary scenarios)

### Key Derivation

When deriving sub-keys from a master key, use standard key derivation functions:

- **HKDF**: HMAC-based Key Derivation Function
- **PBKDF2**: Password-Based Key Derivation (no longer recommended)
- **scrypt/Argon2**: Memory-hardened key derivation

## Code Examples

### Node.js Crypto Module Implementation

A complete example using Node.js built-in crypto module:

```javascript
const crypto = require('crypto');

// ============================================
// 1. Symmetric Encryption AES-256-GCM
// ============================================
function encryptAESGCM(plaintext, key) {
  // Generate 12-byte random IV (recommended length for GCM)
  const iv = crypto.randomBytes(12);

  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Encrypt data
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag (16 bytes)
  const authTag = cipher.getAuthTag();

  // Return IV + ciphertext + AuthTag
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decryptAESGCM(encryptedData, key) {
  const { iv, encrypted, authTag } = encryptedData;

  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );

  // Set authentication tag
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  // Decrypt data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage example
const key = crypto.randomBytes(32); // 256-bit key
const message = 'This is a secret message';

const encrypted = encryptAESGCM(message, key);
console.log('Encrypted result:', encrypted);

const decrypted = decryptAESGCM(encrypted, key);
console.log('Decrypted result:', decrypted);

// ============================================
// 2. Asymmetric Encryption RSA-OAEP
// ============================================
function generateRSAKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

function encryptRSA(plaintext, publicKey) {
  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(plaintext)
  );
}

function decryptRSA(ciphertext, privateKey) {
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    ciphertext
  ).toString();
}

// ============================================
// 3. Digital Signatures Ed25519
// ============================================
function generateEd25519KeyPair() {
  return crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

function signMessage(message, privateKey) {
  return crypto.sign(null, Buffer.from(message), privateKey);
}

function verifySignature(message, signature, publicKey) {
  return crypto.verify(null, Buffer.from(message), publicKey, signature);
}

// Usage example
const { publicKey, privateKey } = generateEd25519KeyPair();
const signature = signMessage('Important document', privateKey);
const isValid = verifySignature('Important document', signature, publicKey);
console.log('Signature verification:', isValid); // true

// ============================================
// 4. Password Hashing (using scrypt, Node.js native)
// ============================================
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, Buffer.from(salt, 'hex'), 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(
        Buffer.from(key, 'hex'),
        derivedKey
      ));
    });
  });
}

// ============================================
// 5. HMAC Message Authentication Code
// ============================================
function createHMAC(message, key) {
  return crypto.createHmac('sha256', key)
    .update(message)
    .digest('hex');
}

function verifyHMAC(message, key, expectedHmac) {
  const actualHmac = createHMAC(message, key);
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(actualHmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
}

// ============================================
// 6. Key Derivation HKDF
// ============================================
function deriveKey(masterKey, salt, info, keyLength = 32) {
  return crypto.hkdfSync('sha256', masterKey, salt, info, keyLength);
}

// Derive multiple sub-keys from master key
const masterKey = crypto.randomBytes(32);
const salt = crypto.randomBytes(16);

const encryptionKey = deriveKey(masterKey, salt, 'encryption', 32);
const signingKey = deriveKey(masterKey, salt, 'signing', 32);
```

### Using Argon2 for Password Hashing

```javascript
// Installation required: npm install argon2
const argon2 = require('argon2');

async function hashPasswordArgon2(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,  // Recommended to use argon2id
    memoryCost: 65536,      // 64MB memory
    timeCost: 3,            // 3 iterations
    parallelism: 4          // 4 parallel threads
  });
}

async function verifyPasswordArgon2(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

// Usage example
(async () => {
  const hash = await hashPasswordArgon2('mySecurePassword123');
  console.log('Argon2 hash:', hash);

  const isMatch = await verifyPasswordArgon2('mySecurePassword123', hash);
  console.log('Password match:', isMatch);
})();
```

### Python Cryptography Examples

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.asymmetric import ed25519
import os

# AES-256-GCM Encryption
def encrypt_aes_gcm(plaintext: bytes, key: bytes) -> tuple:
    """Encrypt data using AES-256-GCM"""
    nonce = os.urandom(12)  # 96-bit nonce
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return nonce, ciphertext

def decrypt_aes_gcm(nonce: bytes, ciphertext: bytes, key: bytes) -> bytes:
    """Decrypt data using AES-256-GCM"""
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)

# Ed25519 Digital Signatures
def generate_ed25519_keypair():
    """Generate Ed25519 key pair"""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key

def sign_message(message: bytes, private_key) -> bytes:
    """Sign a message with Ed25519"""
    return private_key.sign(message)

def verify_signature(message: bytes, signature: bytes, public_key) -> bool:
    """Verify Ed25519 signature"""
    try:
        public_key.verify(signature, message)
        return True
    except Exception:
        return False

# Key Derivation with HKDF
def derive_key(master_key: bytes, salt: bytes, info: bytes, length: int = 32) -> bytes:
    """Derive a key using HKDF"""
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=salt,
        info=info,
    )
    return hkdf.derive(master_key)

# Usage example
if __name__ == "__main__":
    # Generate a 256-bit key
    key = os.urandom(32)

    # Encrypt and decrypt
    message = b"Secret message"
    nonce, ciphertext = encrypt_aes_gcm(message, key)
    decrypted = decrypt_aes_gcm(nonce, ciphertext, key)
    print(f"Decrypted: {decrypted.decode()}")

    # Sign and verify
    private_key, public_key = generate_ed25519_keypair()
    signature = sign_message(b"Important document", private_key)
    is_valid = verify_signature(b"Important document", signature, public_key)
    print(f"Signature valid: {is_valid}")
```

## Security Best Practices

### Secure Coding Principles

1. **Never Implement Cryptographic Algorithms Yourself**: Use audited standard libraries
2. **Use Authenticated Encryption**: Always choose AEAD modes (like GCM)
3. **Random Number Generation**: Only use CSPRNG, never Math.random()
4. **Key Length**: AES at least 256 bits, RSA at least 2048 bits
5. **Timing Safety**: Use constant-time functions when comparing sensitive data

### Common Pitfalls

#### Pitfall 1: Using ECB Mode

```javascript
// WRONG: ECB mode leaks data patterns
const cipher = crypto.createCipheriv('aes-256-ecb', key, null);

// CORRECT: Use GCM mode
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

#### Pitfall 2: Reusing IV/Nonce

```javascript
// WRONG: Fixed IV
const iv = Buffer.alloc(12, 0); // All-zero IV, dangerous!

// CORRECT: Use random IV for each encryption
const iv = crypto.randomBytes(12);
```

#### Pitfall 3: Not Verifying Ciphertext Integrity

```javascript
// WRONG: Encrypt only, no authentication
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// CORRECT: Use AEAD mode for automatic authentication
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

#### Pitfall 4: Using Insecure Random Numbers

```javascript
// WRONG: Using Math.random()
const key = Math.random().toString(36);

// CORRECT: Use crypto.randomBytes()
const key = crypto.randomBytes(32);
```

#### Pitfall 5: Timing Attack Vulnerabilities

```javascript
// WRONG: Using normal comparison
if (providedToken === storedToken) { ... }

// CORRECT: Use timing-safe comparison
if (crypto.timingSafeEqual(
  Buffer.from(providedToken),
  Buffer.from(storedToken)
)) { ... }
```

#### Pitfall 6: Improper Password Storage

```javascript
// WRONG: Using SHA-256 for password storage
const hash = crypto.createHash('sha256').update(password).digest('hex');

// CORRECT: Use dedicated password hashing function
const hash = await argon2.hash(password, { type: argon2.argon2id });
```

## Practical Scenarios

### Scenario 1: User Password Storage

```javascript
const argon2 = require('argon2');

// Store password during registration
async function registerUser(username, password) {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  await db.users.create({
    username,
    passwordHash: hash
  });
}

// Verify password during login
async function loginUser(username, password) {
  const user = await db.users.findByUsername(username);
  if (!user) {
    // Perform hash operation to prevent user enumeration attacks
    await argon2.hash(password);
    return null;
  }

  const isValid = await argon2.verify(user.passwordHash, password);
  return isValid ? user : null;
}
```

### Scenario 2: API Request Signing

```javascript
const crypto = require('crypto');

function signRequest(method, path, body, secretKey) {
  const timestamp = Date.now().toString();
  const message = `${method}\n${path}\n${timestamp}\n${JSON.stringify(body)}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return {
    'X-Timestamp': timestamp,
    'X-Signature': signature
  };
}

function verifyRequest(req, secretKey) {
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];

  // Check timestamp to prevent replay attacks (5-minute validity)
  const age = Date.now() - parseInt(timestamp);
  if (age > 5 * 60 * 1000) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(`${req.method}\n${req.path}\n${timestamp}\n${JSON.stringify(req.body)}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### Scenario 3: Encrypted Data Storage

```javascript
const crypto = require('crypto');

class SecureStorage {
  constructor(masterKey) {
    this.masterKey = masterKey;
  }

  encrypt(data, context) {
    // Derive unique key for each piece of data
    const salt = crypto.randomBytes(16);
    const key = crypto.hkdfSync('sha256', this.masterKey, salt, context, 32);

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      tag: cipher.getAuthTag().toString('base64')
    };
  }

  decrypt(encryptedData, context) {
    const { salt, iv, data, tag } = encryptedData;

    const key = crypto.hkdfSync(
      'sha256',
      this.masterKey,
      Buffer.from(salt, 'base64'),
      context,
      32
    );

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    let decrypted = decipher.update(Buffer.from(data, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}

// Usage
const storage = new SecureStorage(crypto.randomBytes(32));
const encrypted = storage.encrypt({ secret: 'data' }, 'user-data');
const decrypted = storage.decrypt(encrypted, 'user-data');
```

### Scenario 4: End-to-End Encryption

```javascript
const crypto = require('crypto');

class E2EEncryption {
  constructor() {
    // Generate key pair for this user
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  getPublicKey() {
    return this.publicKey.toString('base64');
  }

  deriveSharedSecret(peerPublicKeyBase64) {
    const peerPublicKey = crypto.createPublicKey({
      key: Buffer.from(peerPublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki'
    });

    const privateKeyObject = crypto.createPrivateKey({
      key: this.privateKey,
      format: 'der',
      type: 'pkcs8'
    });

    return crypto.diffieHellman({
      privateKey: privateKeyObject,
      publicKey: peerPublicKey
    });
  }

  encryptMessage(message, peerPublicKey) {
    const sharedSecret = this.deriveSharedSecret(peerPublicKey);

    // Derive encryption key from shared secret
    const key = crypto.hkdfSync('sha256', sharedSecret, '', 'encryption', 32);

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(message, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      iv: iv.toString('base64'),
      ciphertext: encrypted.toString('base64'),
      tag: cipher.getAuthTag().toString('base64')
    };
  }

  decryptMessage(encryptedData, peerPublicKey) {
    const sharedSecret = this.deriveSharedSecret(peerPublicKey);
    const key = crypto.hkdfSync('sha256', sharedSecret, '', 'encryption', 32);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(encryptedData.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

    let decrypted = decipher.update(Buffer.from(encryptedData.ciphertext, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between symmetric and asymmetric encryption? When should each be used?**

Symmetric encryption uses the same key for encryption and decryption, offering fast speed but difficult key distribution. Asymmetric encryption uses a public-private key pair, solving the key distribution problem but with slower speed. In practice, they are usually combined: asymmetric encryption exchanges symmetric keys, then symmetric encryption transmits data.

**Q2: Why can't you use MD5/SHA-256 for password storage?**

Regular hash functions are designed to be fast, allowing attackers to quickly try many password combinations (brute force, rainbow table attacks). Password hashing functions (bcrypt/Argon2) are specifically designed to be computationally slow and memory-intensive, increasing the cost of cracking.

**Q3: What is Forward Secrecy?**

Even if long-term private keys are leaked, previously recorded sessions cannot be decrypted. Achieved by generating ephemeral key pairs (like ECDHE) for each session. TLS 1.3 mandates forward secrecy.

**Q4: What is the purpose of the AuthTag in AES-GCM?**

AuthTag provides ciphertext integrity verification, ensuring the ciphertext has not been tampered with. If the ciphertext is modified, AuthTag verification fails during decryption. This is the core feature of Authenticated Encryption (AEAD).

**Q5: What is a timing attack? How to prevent it?**

Timing attacks infer sensitive information by measuring operation execution time. For example, normal string comparison returns immediately upon finding a mismatch, allowing attackers to guess character by character. Prevention involves using constant-time comparison functions (like crypto.timingSafeEqual).

**Q6: How do you choose between RSA and ECC?**

ECC provides equivalent security with shorter keys and better performance. New projects should use ECC (like Ed25519). RSA is mainly for compatibility with legacy systems; if used, at least 2048-bit keys are required.

**Q7: What is the difference between encryption and hashing?**

Encryption is reversible - you can decrypt ciphertext back to plaintext with the correct key. Hashing is one-way - you cannot recover the original data from a hash. Encryption protects data confidentiality; hashing verifies data integrity.

**Q8: Explain the concept of a nonce/IV and why reusing it is dangerous.**

A nonce (number used once) or IV (initialization vector) ensures that encrypting the same plaintext with the same key produces different ciphertexts. Reusing a nonce with the same key can completely break the security of stream ciphers like ChaCha20 and significantly weaken block ciphers in CTR/GCM modes, potentially revealing plaintext through XOR operations.

### Core Knowledge Summary

```
+------------------------------------------------------------+
|              Cryptography Core Knowledge System              |
+------------------------------------------------------------+
| Symmetric Encryption                                         |
| - AES-256-GCM: Recommended standard                         |
| - ChaCha20-Poly1305: Mobile/IoT alternative                 |
| - Key points: Random IV, AEAD mode, proper key length       |
+------------------------------------------------------------+
| Asymmetric Encryption                                        |
| - RSA: 2048+ bits, OAEP padding                             |
| - ECC: Smaller keys, faster operations                      |
| - X25519/Ed25519: Modern recommendations                    |
+------------------------------------------------------------+
| Hash Functions                                               |
| - General purpose: SHA-256, SHA-3, BLAKE3                   |
| - Passwords: Argon2id, bcrypt                               |
| - Never: MD5, SHA-1 for security purposes                   |
+------------------------------------------------------------+
| Digital Signatures                                           |
| - Ed25519: Fast, secure, recommended                        |
| - ECDSA: Widely used, requires careful nonce handling       |
| - RSA-PSS: For legacy compatibility                         |
+------------------------------------------------------------+
| Key Management                                               |
| - Generation: CSPRNG only                                   |
| - Storage: HSM, KMS, never in code                          |
| - Exchange: ECDH, X25519                                    |
| - Derivation: HKDF from master key                          |
+------------------------------------------------------------+
| TLS/SSL                                                      |
| - Use TLS 1.3                                               |
| - Forward secrecy mandatory                                 |
| - Certificate validation                                    |
| - Proper cipher suite configuration                         |
+------------------------------------------------------------+
```

## Further Reading

### Official Documentation

- [Node.js Crypto Module Documentation](https://nodejs.org/api/crypto.html)
- [Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [Python cryptography Library](https://cryptography.io/en/latest/)

### Classic Books

- "Applied Cryptography" - Bruce Schneier
- "Cryptography and Network Security" - William Stallings
- "Serious Cryptography" - Jean-Philippe Aumasson
- "Real-World Cryptography" - David Wong

### Quality Resources

- [Cryptography I (Coursera)](https://www.coursera.org/learn/crypto) - Stanford University cryptography course
- [Crypto101](https://www.crypto101.io/) - Free cryptography primer
- [CryptoHack](https://cryptohack.org/) - Interactive cryptography learning platform
- [soatok.blog](https://soatok.blog/) - Practical cryptography engineering blog

### Security Standards

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [RFC 8446 - TLS 1.3](https://tools.ietf.org/html/rfc8446)
- [RFC 7748 - Curve25519](https://tools.ietf.org/html/rfc7748)
- [RFC 8032 - Ed25519](https://tools.ietf.org/html/rfc8032)

### Tools and Libraries

- [OpenSSL](https://www.openssl.org/) - Industry-standard cryptographic toolkit
- [libsodium](https://doc.libsodium.org/) - Modern, easy-to-use cryptographic library
- [Tink](https://github.com/google/tink) - Google's multi-language cryptographic library
- [age](https://github.com/FiloSottile/age) - Simple, modern file encryption tool
