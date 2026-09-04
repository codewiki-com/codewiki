---
title: Python Secrets Module - Cryptographically Secure Random Number Generation
description: Comprehensive guide to Python's secrets module for generating cryptographically secure random numbers and tokens. Learn core principles, best practices, and real-world applications of secure randomness.
track: python
section: stdlib
difficulty: intermediate
tags:
  - security
  - cryptography
  - random
  - secrets
  - tokens
  - authentication
  - passwords
status: imported
origin: old/src/content/docs/python/secrets.en.md
divergence: 0.16
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

## Concept Explanation

The `secrets` module in Python provides cryptographically secure methods for generating random numbers, tokens, and values suitable for managing secrets such as passwords, account authentication, security tokens, and related secrets. Introduced in Python 3.6, it addresses a critical gap in security by offering an alternative to the standard `random` module, which is based on the Mersenne Twister pseudo-random number generator (PRNG) and is unsuitable for security purposes.

### Key Distinctions

The `secrets` module differs fundamentally from `random`:
- **`random` module**: Uses a deterministic PRNG suitable for simulations, games, and general-purpose randomness. Its output can be predicted if the internal state is known.
- **`secrets` module**: Uses `os.urandom()` under the hood, which accesses the operating system's secure random source (e.g., `/dev/urandom` on Unix-like systems, CNG API on Windows).

### Historical Context

Before Python 3.6, developers often misused the `random` module for security-sensitive operations, leading to vulnerabilities. The introduction of the `secrets` module makes it explicit and convenient to use cryptographically secure randomness, following the principle of "secure by default" for security-sensitive operations.

## Core Principles

### Non-Determinism and Unpredictability

Cryptographically secure random generation ensures that:
- **Past outputs don't reveal future outputs**: Even knowing all previous values doesn't allow predicting the next value.
- **No patterns exist**: The output appears completely random with no discernible patterns or correlations.
- **Resistant to statistical attacks**: Passes rigorous statistical tests for randomness (NIST, Diehard tests).

### Operating System Entropy

The `secrets` module leverages the operating system's entropy sources:
- **Kernel entropy pool**: Collects entropy from system events (disk I/O timing, network packets, hardware interrupts).
- **High entropy quality**: Uses sufficient bits to resist even theoretically possible attacks.
- **System-dependent**: Behavior may vary slightly across different operating systems, but the principle remains consistent.

### Blocking Behavior on Some Systems

On some systems (particularly Linux), `/dev/urandom` provides unlimited entropy without blocking, but on other systems, `os.urandom()` may temporarily block until sufficient entropy is gathered. The `secrets` module accepts this tradeoff for security assurance.

### Comparison with Other Approaches

```
┌─────────────────────┬──────────────────┬──────────────────┬──────────────┐
│ Method              │ Deterministic    │ Speed            │ Security     │
├─────────────────────┼──────────────────┼──────────────────┼──────────────┤
│ random module       │ Yes (seedable)   │ Fast             │ Poor         │
│ secrets module      │ No               │ Moderate         │ Excellent    │
│ os.urandom()        │ No               │ Slow (syscall)   │ Excellent    │
│ External lib (bcrypt)│ No              │ Slow             │ Excellent    │
└─────────────────────┴──────────────────┴──────────────────┴──────────────┘
```

## Key Points

### Core Functions

The `secrets` module provides several core functions:

- **`secrets.randbelow(n)`**: Returns a random integer from 0 to n-1 (cryptographically secure).
- **`secrets.randbytes(k)`**: Returns k random bytes as a bytes object.
- **`secrets.choice(sequence)`**: Securely selects a random element from a non-empty sequence.
- **`secrets.token_bytes(nbytes=32)`**: Generates random bytes for use as security tokens.
- **`secrets.token_hex(nbytes=32)`**: Generates a random hexadecimal token string.
- **`secrets.token_urlsafe(nbytes=32)`**: Generates a URL-safe random token string (base64).

### Use Cases

The `secrets` module is essential for:
- **Authentication tokens**: Session IDs, CSRF tokens, OAuth tokens
- **Password generation**: Creating temporary or random passwords
- **API keys**: Generating secure API credentials
- **Security nonces**: One-time values for preventing replay attacks
- **Encryption keys**: Generating keys for symmetric encryption
- **Random UUIDs**: When unpredictability is critical
- **Lottery and raffle systems**: Fair random selection

### Mathematical Foundation

The underlying entropy is sufficient to resist brute-force attacks:
- A 32-byte (256-bit) token generated by `secrets.token_bytes(32)` has 2^256 possible values.
- Breaking a single token would require, on average, 2^255 guesses.
- Even with 1 billion guesses per second, it would take longer than the age of the universe.

### Comparison with UUID

```
random.random():     Predictable, NOT for security
uuid.uuid4():        Uses random.random() by default, also NOT cryptographically secure
secrets.token_hex(): Uses cryptographic randomness, SUITABLE for security
```

## Code Examples

### Basic Secure Random Number Generation

```python
import secrets

# Generate a random integer between 0 and 99
secure_number = secrets.randbelow(100)
print(f"Secure random number: {secure_number}")

# Generate 32 random bytes
secure_bytes = secrets.randbytes(32)
print(f"Secure bytes: {secure_bytes}")
print(f"Hex representation: {secure_bytes.hex()}")

# Generate a token as hexadecimal string
token_hex = secrets.token_hex(16)  # 16 bytes = 32 hex characters
print(f"Hex token: {token_hex}")

# Generate a URL-safe token (base64 encoding)
token_urlsafe = secrets.token_urlsafe(32)
print(f"URL-safe token: {token_urlsafe}")
```

Output:
```
Secure random number: 47
Secure bytes: b'\xc4\xd2...'
Hex representation: c4d2...
Hex token: a1f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6
URL-safe token: rN3jK_pQ-Ls2mX9vY7aB4cD6eF5gH8i0jK
```

### Secure Password Generation

```python
import secrets
import string

def generate_secure_password(length=12):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

# Generate a random password
password = generate_secure_password(16)
print(f"Generated password: {password}")

# Alternative: Using token_urlsafe (simpler but fewer punctuation options)
simple_password = secrets.token_urlsafe(12)
print(f"Simple password: {simple_password}")
```

Output:
```
Generated password: 4mL@9kN$2pQ!xZ
Simple password: rN3jK_pQ-Ls2mX9vY7
```

### Session Token Generation

```python
import secrets
from datetime import datetime, timedelta

class SessionManager:
    """Manages secure session tokens."""

    def __init__(self):
        self.sessions = {}

    def create_session(self, user_id, expires_in_hours=24):
        """Create a new secure session token."""
        # Generate a cryptographically secure token
        token = secrets.token_urlsafe(32)

        # Store session metadata
        self.sessions[token] = {
            'user_id': user_id,
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=expires_in_hours)
        }

        return token

    def validate_session(self, token):
        """Validate a session token."""
        if token not in self.sessions:
            return None, "Invalid token"

        session = self.sessions[token]

        if datetime.now() > session['expires']:
            del self.sessions[token]
            return None, "Token expired"

        return session['user_id'], "Valid"

# Usage
manager = SessionManager()
token = manager.create_session(user_id=123)
print(f"Session token: {token}")

user_id, status = manager.validate_session(token)
print(f"Validation result: {status}, User ID: {user_id}")
```

### CSRF Token Protection

```python
import secrets
from flask import Flask, session, request

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

@app.before_request
def generate_csrf_token():
    """Generate a CSRF token for each request."""
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(16)

def validate_csrf_token(token):
    """Validate CSRF token from request."""
    return token == session.get('csrf_token')

@app.route('/form')
def form_page():
    """Render form with CSRF token."""
    csrf_token = session.get('csrf_token')
    return f'''
    <form method="POST" action="/submit">
        <input type="hidden" name="csrf_token" value="{csrf_token}">
        <input type="text" name="data">
        <button type="submit">Submit</button>
    </form>
    '''

@app.route('/submit', methods=['POST'])
def handle_form():
    """Handle form submission with CSRF validation."""
    token = request.form.get('csrf_token')

    if not validate_csrf_token(token):
        return "CSRF token invalid", 403

    data = request.form.get('data')
    return f"Form submitted with data: {data}"
```

### API Key Generation

```python
import secrets
import hashlib
from datetime import datetime

class APIKeyManager:
    """Manage secure API keys."""

    def __init__(self):
        self.api_keys = {}  # In production, use a database

    def generate_api_key(self, client_name):
        """Generate a new API key."""
        # Generate a cryptographically secure random key
        key = secrets.token_urlsafe(32)

        # Hash the key for storage (don't store plaintext)
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        self.api_keys[key_hash] = {
            'client_name': client_name,
            'created': datetime.now(),
            'revoked': False
        }

        return key  # Return plaintext key once; can't be recovered later

    def validate_api_key(self, key):
        """Validate an API key."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        if key_hash not in self.api_keys:
            return False, "Invalid API key"

        if self.api_keys[key_hash]['revoked']:
            return False, "API key revoked"

        return True, self.api_keys[key_hash]['client_name']

    def revoke_api_key(self, key):
        """Revoke an API key."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        if key_hash in self.api_keys:
            self.api_keys[key_hash]['revoked'] = True
            return True
        return False

# Usage
manager = APIKeyManager()
api_key = manager.generate_api_key("TestClient")
print(f"API Key: {api_key}")

valid, info = manager.validate_api_key(api_key)
print(f"Valid: {valid}, Info: {info}")

manager.revoke_api_key(api_key)
valid, info = manager.validate_api_key(api_key)
print(f"After revocation - Valid: {valid}, Info: {info}")
```

### Secure Random Selection from a Pool

```python
import secrets
import string

def select_random_words(num_words=4, word_length=8):
    """Select random words from a pool for passphrases."""
    # In production, load from a curated word list
    word_pool = [
        'correct', 'horse', 'battery', 'staple', 'mountain', 'river',
        'forest', 'ocean', 'desert', 'sunrise', 'shadow', 'flame',
        'crystal', 'silver', 'golden', 'marble', 'diamond', 'emerald'
    ]

    # Securely select words without replacement
    selected_words = []
    available_words = word_pool.copy()

    for _ in range(num_words):
        if not available_words:
            break
        word = secrets.choice(available_words)
        selected_words.append(word)
        available_words.remove(word)

    return '-'.join(selected_words)

# Generate a passphrase
passphrase = select_random_words(4)
print(f"Passphrase: {passphrase}")

# Diceware-style passphrase (more secure for memory)
def diceware_passphrase():
    """Generate a Diceware passphrase (5 dice rolls per word)."""
    # This would use an actual Diceware word list
    words = select_random_words(5)
    return words

diceware = diceware_passphrase()
print(f"Diceware passphrase: {diceware}")
```

### Comparing Random vs Secrets

```python
import random
import secrets

# Demonstrating why 'random' is unsuitable for security
print("=== Comparison: random vs secrets ===\n")

# Set a seed to show predictability
random.seed(42)
print("With random.seed(42):")
print(f"  First 5 random.randint(0, 100): {[random.randint(0, 100) for _ in range(5)]}")

# Reset and repeat - same sequence
random.seed(42)
print(f"  Reset seed to 42, same sequence: {[random.randint(0, 100) for _ in range(5)]}")
print("  --> Predictable! Bad for security.\n")

# Secrets module
print("With secrets module:")
print(f"  First 5 secure numbers: {[secrets.randbelow(101) for _ in range(5)]}")
print(f"  Next 5 secure numbers: {[secrets.randbelow(101) for _ in range(5)]}")
print("  --> No predictable pattern. Good for security.\n")

# Time measurement
import timeit

time_random = timeit.timeit(lambda: random.randint(0, 1000000), number=100000)
time_secrets = timeit.timeit(lambda: secrets.randbelow(1000001), number=100000)

print(f"Performance comparison (100,000 iterations):")
print(f"  random.randint(): {time_random:.4f} seconds")
print(f"  secrets.randbelow(): {time_secrets:.4f} seconds")
print(f"  Ratio: {time_secrets/time_random:.1f}x slower (acceptable for security)")
```

## Best Practices

### Always Use Secrets for Security-Sensitive Operations

```python
# ❌ WRONG - Don't use random for security
import random
token = ''.join(str(random.randint(0, 9)) for _ in range(32))

# ✅ CORRECT - Use secrets for security
import secrets
token = secrets.token_hex(16)
```

### Choose Appropriate Token Length

```python
# Token length guidelines
import secrets

# Session tokens: 32-64 bytes (256-512 bits)
session_token = secrets.token_bytes(32)

# API keys: 32-64 bytes
api_key = secrets.token_urlsafe(32)

# CSRF tokens: 32 bytes (sufficient)
csrf_token = secrets.token_hex(16)

# Encryption keys: Match your cipher strength
# AES-256: 32 bytes
# ChaCha20: 32 bytes
encryption_key = secrets.token_bytes(32)
```

### Hash Tokens Before Storing

```python
import secrets
import hashlib

# Generate token
plaintext_token = secrets.token_urlsafe(32)

# Hash it for storage
token_hash = hashlib.sha256(plaintext_token.encode()).hexdigest()

# Store only the hash
stored_token = token_hash

# Later, when validating, compare hashes (not plaintext)
incoming_token = plaintext_token  # From user
if hashlib.sha256(incoming_token.encode()).hexdigest() == stored_token:
    print("Token valid")
```

### Implement Token Expiration

```python
from datetime import datetime, timedelta
import secrets

class TokenManager:
    def __init__(self):
        self.tokens = {}

    def create_token(self, user_id, expires_minutes=30):
        """Create a token with expiration."""
        token = secrets.token_urlsafe(32)
        self.tokens[token] = {
            'user_id': user_id,
            'expires': datetime.now() + timedelta(minutes=expires_minutes)
        }
        return token

    def validate_token(self, token):
        """Validate token and check expiration."""
        if token not in self.tokens:
            return False

        if datetime.now() > self.tokens[token]['expires']:
            del self.tokens[token]  # Clean up expired tokens
            return False

        return True

    def cleanup_expired(self):
        """Remove all expired tokens."""
        now = datetime.now()
        expired = [t for t, data in self.tokens.items()
                   if now > data['expires']]
        for token in expired:
            del self.tokens[token]
```

### Use URL-Safe Encoding for HTTP Contexts

```python
import secrets

# For embedding in URLs or HTTP headers
token_urlsafe = secrets.token_urlsafe(32)
print(f"URL-safe token: {token_urlsafe}")

# For raw binary data or hex display
token_hex = secrets.token_hex(32)
print(f"Hex token: {token_hex}")

# For database storage (compact binary)
token_bytes = secrets.randbytes(32)
print(f"Bytes token: {token_bytes}")
```

### Never Use Hardcoded Secret Values

```python
# ❌ WRONG - Hardcoded secrets
API_KEY = "sk_live_1234567890abcdef"
SECRET = "my_super_secret_key"

# ✅ CORRECT - Generate or load from environment
import os
import secrets

API_KEY = os.getenv('API_KEY')
SECRET = os.getenv('SECRET')

# Or generate for testing
if not API_KEY:
    API_KEY = secrets.token_urlsafe(32)
```

### Implement Rate Limiting with Secure Tokens

```python
import secrets
from datetime import datetime, timedelta

class RateLimiter:
    """Rate limiting with secure token tracking."""

    def __init__(self, requests_per_minute=60):
        self.requests = {}
        self.limit = requests_per_minute

    def get_client_token(self):
        """Get a unique secure token for a client."""
        return secrets.token_hex(16)

    def is_rate_limited(self, token):
        """Check if client has exceeded rate limit."""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)

        if token not in self.requests:
            self.requests[token] = []

        # Remove old requests
        self.requests[token] = [
            req_time for req_time in self.requests[token]
            if req_time > minute_ago
        ]

        # Check limit
        if len(self.requests[token]) >= self.limit:
            return True

        self.requests[token].append(now)
        return False
```

## Common Pitfalls

### Pitfall 1: Using `random` for Security

```python
# ❌ WRONG
import random
token = random.randint(0, 10**32)
# Issue: Predictable; can be brute-forced

# ✅ CORRECT
import secrets
token = secrets.randbytes(32)
# Solution: Cryptographically secure
```

### Pitfall 2: Not Hashing Tokens Before Storage

```python
# ❌ WRONG
import secrets
tokens = set()
token = secrets.token_urlsafe(32)
tokens.add(token)  # Storing plaintext - if DB leaks, all tokens exposed

# ✅ CORRECT
import secrets
import hashlib
tokens = {}
token = secrets.token_urlsafe(32)
token_hash = hashlib.sha256(token.encode()).hexdigest()
tokens[token_hash] = True  # Can't recover plaintext if DB leaks
```

### Pitfall 3: Insufficient Token Length

```python
# ❌ WEAK
token = secrets.token_hex(4)  # Only 8 hex chars = 32 bits

# ✅ STRONG
token = secrets.token_hex(16)  # 32 hex chars = 128 bits
# Or even better for high-security:
token = secrets.token_urlsafe(32)  # 256 bits
```

### Pitfall 4: Not Handling Token Expiration

```python
# ❌ WRONG - Tokens never expire
tokens = {}
token = secrets.token_urlsafe(32)
tokens[token] = user_id  # No expiration -> token valid forever

# ✅ CORRECT - Tokens expire
from datetime import datetime, timedelta
tokens = {}
token = secrets.token_urlsafe(32)
tokens[token] = {
    'user_id': user_id,
    'expires': datetime.now() + timedelta(hours=1)
}
```

### Pitfall 5: Reusing Random State

```python
# ❌ WRONG - Caching os.urandom() result
cached_entropy = os.urandom(32)
def get_token():
    return cached_entropy  # Same bytes every time!

# ✅ CORRECT - Fresh randomness each time
def get_token():
    return secrets.token_bytes(32)
```

### Pitfall 6: Logging or Displaying Tokens

```python
# ❌ WRONG - Tokens in logs
token = secrets.token_urlsafe(32)
print(f"Generated token: {token}")  # Now in logs/terminal history
logger.info(f"Token: {token}")  # Exposed in log files

# ✅ CORRECT - Hash before displaying
import hashlib
token = secrets.token_urlsafe(32)
token_hash = hashlib.sha256(token.encode()).hexdigest()[:8]
print(f"Token created (hash: {token_hash})")  # Only show hash
```

### Pitfall 7: Seeding `random` Module

```python
# ❌ WRONG - Thinking seeding helps random for security
import random
random.seed(os.urandom(32))  # Seeding doesn't make it cryptographically secure
token = random.getrandbits(128)

# ✅ CORRECT - Use secrets directly
import secrets
token = secrets.token_bytes(16)
```

## Performance Considerations

### Cryptographic vs Computational Cost

```python
import timeit
import secrets
import random

# Benchmark different operations
print("Performance comparison:")

# Random module (baseline)
time_random = timeit.timeit(
    lambda: random.randint(0, 2**32-1),
    number=100000
)
print(f"random.randint(): {time_random:.4f}s")

# Secrets module
time_secrets = timeit.timeit(
    lambda: secrets.randbelow(2**32),
    number=100000
)
print(f"secrets.randbelow(): {time_secrets:.4f}s")

# Token generation
time_token_hex = timeit.timeit(
    lambda: secrets.token_hex(16),
    number=10000
)
print(f"secrets.token_hex(16): {time_token_hex:.4f}s")

# Token generation (URL-safe)
time_token_urlsafe = timeit.timeit(
    lambda: secrets.token_urlsafe(16),
    number=10000
)
print(f"secrets.token_urlsafe(16): {time_token_urlsafe:.4f}s")

print(f"\nSecrets is typically {time_secrets/time_random:.1f}x slower")
print("This cost is acceptable for security-critical operations")
```

### Caching for Performance-Sensitive Operations

```python
import secrets
from functools import lru_cache

# Pre-generate tokens in batch for high-throughput scenarios
class TokenPool:
    def __init__(self, pool_size=1000):
        self.tokens = [secrets.token_urlsafe(32) for _ in range(pool_size)]
        self.index = 0

    def get_token(self):
        """Get pre-generated token (O(1) operation)."""
        token = self.tokens[self.index]
        self.tokens[self.index] = secrets.token_urlsafe(32)  # Regenerate
        self.index = (self.index + 1) % len(self.tokens)
        return token

# Usage
pool = TokenPool(100)
for _ in range(5):
    print(pool.get_token())
```

### Database Storage Optimization

```python
import secrets

# Option 1: Store as hex (longer, human-readable)
token = secrets.token_hex(16)  # 32 characters
# Storage: 32 bytes per token

# Option 2: Store as URL-safe base64 (shorter)
token = secrets.token_urlsafe(16)  # ~22 characters
# Storage: ~22 bytes per token

# Option 3: Store as raw binary (most compact, requires binary DB field)
token = secrets.randbytes(16)  # 16 bytes
# Storage: 16 bytes per token (+ overhead for binary type)

# Trade-off: Compactness vs readability
# For millions of tokens, consider binary storage
```

### Async Generation for I/O-Bound Operations

```python
import asyncio
import secrets
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

async def generate_tokens_async(count=100):
    """Generate tokens in a thread pool (non-blocking)."""
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(executor, secrets.token_urlsafe, 32)
        for _ in range(count)
    ]
    tokens = await asyncio.gather(*tasks)
    return tokens

# Usage
tokens = asyncio.run(generate_tokens_async(10))
print(f"Generated {len(tokens)} tokens asynchronously")
```

## Real-world Scenarios

### Scenario 1: User Registration and Email Verification

```python
import secrets
import hashlib
from datetime import datetime, timedelta

class UserRegistration:
    def __init__(self):
        self.verification_tokens = {}

    def register_user(self, email, password):
        """Register a new user with email verification."""
        # Generate secure verification token
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        # Store token with expiration (24 hours)
        self.verification_tokens[token_hash] = {
            'email': email,
            'password_hash': hashlib.sha256(password.encode()).hexdigest(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        # In production: send verification email with token
        verification_url = f"https://example.com/verify?token={token}"
        print(f"Verification URL: {verification_url}")

        return token

    def verify_email(self, token):
        """Verify email with token."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        if token_hash not in self.verification_tokens:
            return False, "Invalid token"

        data = self.verification_tokens[token_hash]

        if datetime.now() > data['expires']:
            del self.verification_tokens[token_hash]
            return False, "Token expired"

        # Token valid - create user
        del self.verification_tokens[token_hash]
        return True, f"User {data['email']} verified successfully"

# Usage
reg = UserRegistration()
token = reg.register_user("user@example.com", "password123")
success, message = reg.verify_email(token)
print(f"Verification: {message}")
```

### Scenario 2: Password Reset Flow

```python
import secrets
import hashlib
from datetime import datetime, timedelta

class PasswordReset:
    def __init__(self):
        self.reset_tokens = {}

    def request_reset(self, email):
        """Request password reset."""
        reset_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()

        self.reset_tokens[token_hash] = {
            'email': email,
            'expires': datetime.now() + timedelta(minutes=30),
            'used': False
        }

        reset_url = f"https://example.com/reset-password?token={reset_token}"
        print(f"Reset URL: {reset_url}")

        return reset_token

    def reset_password(self, token, new_password):
        """Reset password with token."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        if token_hash not in self.reset_tokens:
            return False, "Invalid token"

        data = self.reset_tokens[token_hash]

        if datetime.now() > data['expires']:
            del self.reset_tokens[token_hash]
            return False, "Token expired"

        if data['used']:
            return False, "Token already used"

        # Mark as used (prevent reuse)
        data['used'] = True

        # In production: update user's password
        new_password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        print(f"Password updated for {data['email']}")

        return True, "Password reset successfully"

# Usage
pr = PasswordReset()
token = pr.request_reset("user@example.com")
success, message = pr.reset_password(token, "newpassword456")
print(f"Reset: {message}")
```

### Scenario 3: OAuth 2.0 Authorization Code Flow

```python
import secrets
import hashlib
from datetime import datetime, timedelta

class OAuthServer:
    def __init__(self):
        self.auth_codes = {}
        self.access_tokens = {}

    def authorize(self, client_id, redirect_uri, scope):
        """Generate authorization code."""
        auth_code = secrets.token_urlsafe(32)
        code_hash = hashlib.sha256(auth_code.encode()).hexdigest()

        self.auth_codes[code_hash] = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': scope,
            'expires': datetime.now() + timedelta(minutes=10),
            'used': False
        }

        return auth_code

    def exchange_code_for_token(self, auth_code, client_id, client_secret):
        """Exchange authorization code for access token."""
        code_hash = hashlib.sha256(auth_code.encode()).hexdigest()

        if code_hash not in self.auth_codes:
            return None, "Invalid authorization code"

        code_data = self.auth_codes[code_hash]

        if code_data['used']:
            return None, "Authorization code already used"

        if datetime.now() > code_data['expires']:
            del self.auth_codes[code_hash]
            return None, "Authorization code expired"

        # Mark as used
        code_data['used'] = True

        # Generate access token
        access_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(access_token.encode()).hexdigest()

        self.access_tokens[token_hash] = {
            'client_id': client_id,
            'scope': code_data['scope'],
            'expires': datetime.now() + timedelta(hours=1)
        }

        return access_token, "Token granted"

    def validate_access_token(self, token, scope):
        """Validate access token."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        if token_hash not in self.access_tokens:
            return False, "Invalid token"

        token_data = self.access_tokens[token_hash]

        if datetime.now() > token_data['expires']:
            return False, "Token expired"

        if scope not in token_data['scope']:
            return False, "Insufficient scope"

        return True, "Token valid"

# Usage
oauth = OAuthServer()
auth_code = oauth.authorize("client123", "https://app.example.com/callback", ["read", "write"])
access_token, msg = oauth.exchange_code_for_token(auth_code, "client123", "secret123")
valid, msg = oauth.validate_access_token(access_token, "read")
print(f"Token validation: {msg}")
```

## Interview Points

### Why Can't We Use `random` for Security?

**Answer**: The `random` module uses the Mersenne Twister PRNG, which is:
- **Deterministic**: If the internal state is known, all future values are predictable
- **Non-cryptographic**: It passes simple statistical tests but fails cryptographic tests
- **Seeding vulnerability**: The seed space is small (typically 32 bits), making brute-force feasible

The `secrets` module uses the OS entropy source (e.g., `/dev/urandom`), which has no internal state to predict and uses high-quality entropy.

### What's the Difference Between `secrets.token_hex()` and `secrets.token_urlsafe()`?

**Answer**:
- **`token_hex()`**: Encodes bytes as hexadecimal (2 hex chars per byte). Safe for all contexts. 32 bytes → 64 hex characters.
- **`token_urlsafe()`**: Uses base64 URL-safe encoding. Shorter (4 chars per 3 bytes). Suitable for URLs and API parameters. 32 bytes → ~43 characters.

Choose based on context: use `token_hex()` for general purposes, `token_urlsafe()` when brevity matters.

### How Should Tokens Be Stored in a Database?

**Answer**: Never store plaintext tokens. Instead:
1. Generate token: `token = secrets.token_urlsafe(32)`
2. Hash it: `token_hash = hashlib.sha256(token.encode()).hexdigest()`
3. Store hash in database: `db.store(token_hash)`
4. Send plaintext token to user (can't be recovered from database)
5. When validating, compare hashes (not plaintext)

This way, if the database is compromised, attackers cannot use the tokens.

### What Token Length is Sufficient?

**Answer**:
- **Minimum**: 32 bytes (256 bits) for most applications
- **Math**: 2^256 possible values. Even 1 billion guesses/second would take ~10^59 years
- **For weak adversaries**: 16 bytes (128 bits) is sufficient (2^128 ≈ 10^38)
- **For critical security**: 64 bytes (512 bits) provides margin against future advances

Most frameworks default to 32 bytes, which is standard practice.

### How Do You Handle Token Expiration Securely?

**Answer**:
- Store expiration time with token in database
- Check expiration on every validation attempt
- Delete expired tokens periodically (cleanup task)
- For stateless tokens (e.g., JWT), include expiration in the token itself
- Example: `expires = datetime.now() + timedelta(hours=1)`

### What's the Relationship Between Entropy and Security?

**Answer**: Token security depends on entropy:
- **Entropy source**: Where randomness comes from (OS entropy pool)
- **Entropy extraction**: How bits are selected (cryptographic hash functions)
- **Entropy quantity**: How many random bits (token length)
- **Security = min(source entropy, token bits)**

Using 256 bits from `/dev/urandom` gives 256 bits of security against brute-force.

### How Does the `secrets` Module Differ on Different Operating Systems?

**Answer**:
- **Linux/Unix**: Uses `/dev/urandom`, unlimited entropy, non-blocking
- **Windows**: Uses CNG (Cryptography Next Generation) API
- **macOS**: Uses `/dev/urandom` (like Linux)
- **API**: `secrets` module abstracts differences; same API works everywhere
- **Guarantee**: All systems provide cryptographically secure randomness

The implementation details differ, but security guarantees are equivalent.

### Can Tokens Be Compromised in Transit?

**Answer**:
- **In transit**: Use HTTPS/TLS to encrypt communication
- **In storage**: Hash tokens before storing
- **In logs**: Never log plaintext tokens
- **In memory**: Clear tokens after use if possible
- **Best practice**: TLS + hashing + proper token expiration = defense in depth

## Further Reading

### Official Documentation
- [Python secrets — Generate secure random numbers for managing secrets](https://docs.python.org/3/library/secrets.html)
- [os.urandom() — OS random source](https://docs.python.org/3/library/os.html#os.urandom)

### Security Standards
- [NIST SP 800-90A: Recommendation for Random Number Generation Using Deterministic Random Bit Generators](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-90a.pdf)
- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://tools.ietf.org/html/rfc4648)

### Related Topics
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [PEP 506: Adding A Secrets Module To The Standard Library](https://www.python.org/dev/peps/pep-0506/)

### Cryptography Libraries
- [cryptography.io: Python Cryptography Library](https://cryptography.io/)
- [bcrypt: Secure Password Hashing](https://github.com/pyca/bcrypt)
- [Argon2: Password Hashing Algorithm](https://github.com/P-H-C/phc-winner-argon2)

### Best Practices
- [OWASP Top 10 - A02:2021 Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [CWE-330: Use of Insufficiently Random Values](https://cwe.mitre.org/data/definitions/330.html)
- [Diceware: Secure Passphrase Generation](https://theworld.com/~reinhold/diceware.html)

### Advanced Topics
- [Understanding Entropy](https://www.araneus.fi/generateentropy/en/)
- [Random.org - Randomness and Integrity Services](https://www.random.org/)
- [TRNG: True Random Number Generation](https://en.wikipedia.org/wiki/Hardware_random_number_generator)
