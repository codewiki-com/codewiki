---
title: Python hashlib Module
description: Complete guide to Python hashlib for cryptographic hashing, secure password handling, and data integrity verification
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - hashlib
  - Cryptography
  - Security
  - Hashing
  - Data Integrity
status: imported
origin: old/src/content/docs/python/hashlib.en.md
divergence: 0.281
issues:
  - order-mismatch
legacy:
  category: Python
  subcategory: Standard Library
  order: 35
  lastUpdated: 2026-01-07
---

The `hashlib` module is Python's standard library for cryptographic hashing, providing secure hash functions for verifying data integrity, storing passwords, and cryptographic applications. Hash functions convert arbitrary data into fixed-size hexadecimal strings, making them essential for security, data verification, and digital signatures.

## Concept Explanation

### What is Cryptographic Hashing?

Cryptographic hashing is a one-way mathematical function that transforms input data of any size into a fixed-length string of characters (hash or digest). Key properties include:

1. **Deterministic**: Same input always produces the same hash
2. **One-way**: Impossible to reverse-engineer the original input from the hash
3. **Avalanche Effect**: Tiny input changes produce completely different hashes
4. **Fast Computation**: Quick to calculate hashes
5. **Collision Resistant**: Extremely unlikely two different inputs produce the same hash

### Common Use Cases

- **Password Storage**: Securely store user passwords
- **Data Integrity Verification**: Detect file corruption or tampering
- **Digital Signatures**: Sign documents cryptographically
- **Cache Keys**: Generate unique identifiers
- **API Authentication**: Create secure tokens
- **Blockchain**: Core component of blockchain technology

## Core Principles

### Hash Functions vs Encryption

```python
# Hash functions are one-way (irreversible)
import hashlib

data = "secret_password"
hash_value = hashlib.sha256(data.encode()).hexdigest()
print(hash_value)  # Can't reverse this

# Encryption is two-way (reversible with key)
from cryptography.fernet import Fernet
key = Fernet.generate_key()
cipher = Fernet(key)
encrypted = cipher.encrypt(data.encode())
decrypted = cipher.decrypt(encrypted)  # Can get original back
```

### Available Algorithms

```python
import hashlib

# List all available algorithms
print(hashlib.algorithms_available)
# Common: {'md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512',
#          'blake2b', 'blake2s', 'sha3_224', 'sha3_256', 'sha3_384', 'sha3_512'}

# Guaranteed available algorithms
print(hashlib.algorithms_guaranteed)
```

### Hash Object Properties

```python
import hashlib

hash_obj = hashlib.sha256()
print(hash_obj.name)  # 'sha256'
print(hash_obj.digest_size)  # 32 (bytes)
print(hash_obj.block_size)  # 64 (bytes)
```

## Key Points

1. **Always encode strings** before hashing (convert to bytes)
2. **SHA256 is standard** for most applications (better than MD5 or SHA1)
3. **Use salt for passwords** to prevent rainbow table attacks
4. **Use key derivation functions** (PBKDF2, bcrypt) for passwords, not raw hashing
5. **Digest vs hexdigest**: digest() returns bytes, hexdigest() returns hex string
6. **Update iteratively** for large files to avoid loading entire file in memory

## Code Examples

### Basic Hash Computation

```python
import hashlib

# Simple string hashing
text = "Hello, World!"
hash_value = hashlib.sha256(text.encode()).hexdigest()
print(f"SHA256: {hash_value}")
# SHA256: dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f

# Different algorithms
algorithms = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'blake2b']

for algo in algorithms:
    h = hashlib.new(algo)
    h.update(text.encode())
    print(f"{algo}: {h.hexdigest()[:32]}...")

# Bytes vs Hexdigest
h = hashlib.sha256(text.encode())
print(f"Bytes: {h.digest()}")  # b'\xdf\xfd`!\xbb+...'
print(f"Hex: {h.hexdigest()}")  # dffd6021bb2bd5b0...
```

### Hashing Files

```python
import hashlib

def hash_file(filename, algorithm='sha256', chunk_size=8192):
    """Calculate hash of a file without loading it entirely into memory."""
    hash_obj = hashlib.new(algorithm)

    with open(filename, 'rb') as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            hash_obj.update(chunk)

    return hash_obj.hexdigest()

# Usage
file_hash = hash_file('large_file.iso')
print(f"File SHA256: {file_hash}")

# Calculate multiple hashes simultaneously
def hash_file_multiple(filename):
    """Calculate multiple hashes at once."""
    hashes = {
        'md5': hashlib.md5(),
        'sha256': hashlib.sha256(),
        'sha512': hashlib.sha512(),
    }

    with open(filename, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            for h in hashes.values():
                h.update(chunk)

    return {name: h.hexdigest() for name, h in hashes.items()}
```

### Password Security

```python
import hashlib
import secrets

# WRONG: Never do this for passwords
def insecure_hash_password(password):
    """Don't use this - vulnerable to rainbow tables!"""
    return hashlib.sha256(password.encode()).hexdigest()

# CORRECT: Use salt and key derivation
def secure_hash_password(password):
    """Hash password with salt using PBKDF2."""
    salt = secrets.token_hex(16)  # Generate random salt
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode(),
        salt.encode(),
        100000  # iterations (higher is slower but more secure)
    )
    return f"{salt}${pwd_hash.hex()}"

def verify_password(password, stored_hash):
    """Verify password against stored hash."""
    salt, pwd_hash = stored_hash.split('$')
    new_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode(),
        salt.encode(),
        100000
    )
    return new_hash.hex() == pwd_hash

# Usage
stored = secure_hash_password("user_password")
print(f"Stored: {stored}")

is_valid = verify_password("user_password", stored)
print(f"Valid: {is_valid}")  # True

is_valid = verify_password("wrong_password", stored)
print(f"Valid: {is_valid}")  # False
```

### Incremental Hashing

```python
import hashlib

# Hashing large data iteratively
def hash_generator(data_generator, algorithm='sha256'):
    """Hash data from a generator without storing it all in memory."""
    hash_obj = hashlib.new(algorithm)

    for chunk in data_generator:
        if isinstance(chunk, str):
            chunk = chunk.encode()
        hash_obj.update(chunk)

    return hash_obj.hexdigest()

# Example with file lines
def hash_file_lines(filename):
    """Hash file line by line."""
    def line_generator(fn):
        with open(fn, 'r') as f:
            for line in f:
                yield line.encode()

    return hash_generator(line_generator(filename))

# Example with streaming data
def hash_stream(stream):
    """Hash data from a stream."""
    hash_obj = hashlib.sha256()
    while True:
        chunk = stream.read(4096)
        if not chunk:
            break
        hash_obj.update(chunk)
    return hash_obj.hexdigest()
```

### Comparing Data Integrity

```python
import hashlib
import shutil

def verify_file_integrity(source, destination):
    """Verify that a copied file hasn't been corrupted."""
    source_hash = hashlib.sha256()
    dest_hash = hashlib.sha256()

    # Hash source file
    with open(source, 'rb') as f:
        while chunk := f.read(8192):
            source_hash.update(chunk)

    # Hash destination file
    with open(destination, 'rb') as f:
        while chunk := f.read(8192):
            dest_hash.update(chunk)

    return source_hash.hexdigest() == dest_hash.hexdigest()

# Copy and verify
shutil.copy('original.bin', 'copy.bin')
is_intact = verify_file_integrity('original.bin', 'copy.bin')
print(f"File integrity verified: {is_intact}")
```

### HMAC for Authentication

```python
import hashlib
import hmac
import secrets

# HMAC (Hash-based Message Authentication Code) - secure message authentication
def create_hmac(message, secret_key):
    """Create HMAC for message authentication."""
    if isinstance(message, str):
        message = message.encode()
    if isinstance(secret_key, str):
        secret_key = secret_key.encode()

    return hmac.new(secret_key, message, hashlib.sha256).hexdigest()

def verify_hmac(message, secret_key, signature):
    """Verify HMAC signature."""
    expected = create_hmac(message, secret_key)
    return hmac.compare_digest(expected, signature)

# Usage
secret = secrets.token_hex(32)
message = "Important data"

signature = create_hmac(message, secret)
print(f"Signature: {signature}")

is_valid = verify_hmac(message, secret, signature)
print(f"Valid: {is_valid}")  # True

is_valid = verify_hmac("Tampered data", secret, signature)
print(f"Valid: {is_valid}")  # False
```

### Checksum Generation for Downloads

```python
import hashlib

def generate_checksums(file_list):
    """Generate checksums for multiple files (like sha256sum tool)."""
    results = []
    for filename in file_list:
        hash_obj = hashlib.sha256()
        with open(filename, 'rb') as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)
        results.append(f"{hash_obj.hexdigest()}  {filename}")
    return results

def verify_checksums(checksum_file):
    """Verify files against a checksum file."""
    verified = []
    failed = []

    with open(checksum_file, 'r') as f:
        for line in f:
            hash_value, filename = line.strip().split('  ')

            computed = hashlib.sha256()
            try:
                with open(filename, 'rb') as fh:
                    while chunk := fh.read(8192):
                        computed.update(chunk)

                if computed.hexdigest() == hash_value:
                    verified.append(filename)
                else:
                    failed.append(filename)
            except FileNotFoundError:
                failed.append(f"{filename} (not found)")

    return verified, failed
```

### Content Addressing (Hash-based IDs)

```python
import hashlib
import json

def content_hash(data):
    """Generate content-based hash for deduplication."""
    if isinstance(data, (dict, list)):
        data = json.dumps(data, sort_keys=True).encode()
    elif isinstance(data, str):
        data = data.encode()

    return hashlib.sha256(data).hexdigest()

# Deduplication using content hashes
class FileDeduplicator:
    def __init__(self):
        self.content_map = {}  # hash -> file_path

    def add_file(self, filepath):
        """Add file and track by content hash."""
        hash_obj = hashlib.sha256()
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)

        file_hash = hash_obj.hexdigest()
        if file_hash not in self.content_map:
            self.content_map[file_hash] = filepath
        return file_hash

    def find_duplicates(self, filepath):
        """Find files with same content."""
        file_hash = self.add_file(filepath)
        return self.content_map.get(file_hash)

# Usage
dedup = FileDeduplicator()
hash1 = dedup.add_file('file1.txt')
hash2 = dedup.add_file('file2.txt')

if hash1 == hash2:
    print(f"Files are identical: {dedup.find_duplicates('file2.txt')}")
```

## Best Practices

### Use Strong Algorithms

```python
import hashlib

# Good: Modern algorithms
preferred = ['sha256', 'sha384', 'sha512', 'sha3_256', 'blake2b']

# Avoid: Deprecated algorithms
deprecated = ['md5', 'sha1']  # Vulnerable to collision attacks

# Algorithm choice guidelines:
# - SHA256: Standard choice, widely supported, good performance
# - SHA512: More secure, slightly slower
# - SHA3-256: Modern standard (Keccak)
# - BLAKE2b: Very fast, newer, gaining adoption
```

### Proper Password Handling

```python
import hashlib
from itertools import repeat

# WRONG: Simple hash is vulnerable to attacks
wrong = hashlib.sha256("password".encode()).hexdigest()

# RIGHT: Use PBKDF2 with salt and iterations
def hash_password_correct(password, iterations=100000):
    import secrets
    salt = secrets.token_bytes(32)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, iterations)
    return salt + pwd_hash

# EVEN BETTER: Use dedicated library
try:
    import bcrypt
    hashed = bcrypt.hashpw(b"password", bcrypt.gensalt(rounds=12))
except ImportError:
    print("Install bcrypt: pip install bcrypt")
```

### Secure Comparison

```python
import hashlib
import hmac

# WRONG: String comparison is vulnerable to timing attacks
hash1 = hashlib.sha256(b"data1").hexdigest()
hash2 = hashlib.sha256(b"data2").hexdigest()
if hash1 == hash2:  # Timing attack possible
    pass

# RIGHT: Use constant-time comparison
if hmac.compare_digest(hash1, hash2):  # Constant time
    pass
```

### Document Hash Algorithms

```python
import hashlib
from dataclasses import dataclass

@dataclass
class HashRecord:
    """Store hash with algorithm info for future verification."""
    algorithm: str
    iterations: int
    salt: str
    hash_value: str
    timestamp: str

    def to_dict(self):
        return self.__dict__

def create_verified_hash(data, algorithm='sha256', iterations=100000):
    """Create hash with metadata."""
    from datetime import datetime
    import secrets

    salt = secrets.token_hex(16)

    if algorithm.startswith('pbkdf2'):
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            data.encode() if isinstance(data, str) else data,
            salt.encode(),
            iterations
        )
    else:
        h = hashlib.new(algorithm)
        h.update(data.encode() if isinstance(data, str) else data)
        hash_obj = h.digest()

    return HashRecord(
        algorithm=algorithm,
        iterations=iterations,
        salt=salt,
        hash_value=hash_obj.hex() if isinstance(hash_obj, bytes) else hash_obj,
        timestamp=datetime.now().isoformat()
    )
```

### Chunked Processing for Large Data

```python
import hashlib
from pathlib import Path

class SafeHasher:
    """Safely hash large files without memory issues."""

    CHUNK_SIZE = 65536  # 64KB chunks

    @staticmethod
    def hash_file(filepath, algorithm='sha256'):
        """Hash large file efficiently."""
        hash_obj = hashlib.new(algorithm)

        with open(filepath, 'rb') as f:
            while True:
                chunk = f.read(SafeHasher.CHUNK_SIZE)
                if not chunk:
                    break
                hash_obj.update(chunk)

        return hash_obj.hexdigest()

    @staticmethod
    def hash_directory(directory, algorithm='sha256'):
        """Hash all files in a directory."""
        hash_obj = hashlib.new(algorithm)

        for filepath in sorted(Path(directory).rglob('*')):
            if filepath.is_file():
                with open(filepath, 'rb') as f:
                    while chunk := f.read(SafeHasher.CHUNK_SIZE):
                        hash_obj.update(chunk)

        return hash_obj.hexdigest()
```

## Common Pitfalls

### Forgetting to Encode Strings

```python
import hashlib

# WRONG: TypeError
try:
    hashlib.sha256("string").hexdigest()
except TypeError as e:
    print(f"Error: {e}")  # 'str' does not support the buffer interface

# CORRECT: Encode to bytes
hashlib.sha256("string".encode()).hexdigest()
hashlib.sha256(b"string").hexdigest()
```

### Using MD5 or SHA1

```python
import hashlib

# WRONG: Vulnerable to collision attacks
weak_hash = hashlib.md5(b"data").hexdigest()

# CORRECT: Use modern algorithms
strong_hash = hashlib.sha256(b"data").hexdigest()
```

### Storing Unhashed Passwords

```python
# WRONG: Never store plaintext passwords
user_data = {
    'username': 'john',
    'password': 'my_secret_password'  # DANGEROUS!
}

# CORRECT: Hash with salt
import hashlib
import secrets

salt = secrets.token_hex(16)
hashed = hashlib.pbkdf2_hmac('sha256', b'my_secret_password', salt.encode(), 100000)
user_data = {
    'username': 'john',
    'password_hash': hashed.hex(),
    'salt': salt
}
```

### Assuming Same Algorithm Forever

```python
import hashlib

# WRONG: Algorithm not stored
old_hash = hashlib.sha256(b"password").hexdigest()
# Later: Which algorithm was used? Unknown!

# CORRECT: Store algorithm info
password_record = {
    'hash': hashlib.sha256(b"password").hexdigest(),
    'algorithm': 'sha256',
    'salt': 'abc123',
    'iterations': 100000
}
```

### Not Handling Update Properly

```python
import hashlib

# WRONG: Inefficient for large data
data = b"large" * 1000000
hash_obj = hashlib.sha256()
hash_obj.update(data)  # All in memory

# CORRECT: Process in chunks
hash_obj = hashlib.sha256()
for i in range(0, len(data), 8192):
    chunk = data[i:i+8192]
    hash_obj.update(chunk)
```

### Not Using Salt for Password Hashing

```python
import hashlib
import secrets

# WRONG: Same password produces same hash (rainbow table vulnerable)
hash1 = hashlib.sha256(b"password").hexdigest()
hash2 = hashlib.sha256(b"password").hexdigest()
print(hash1 == hash2)  # True - vulnerable!

# CORRECT: Use unique salt per password
def secure_hash(password):
    salt = secrets.token_bytes(32)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt + hashed

hash1 = secure_hash("password")
hash2 = secure_hash("password")
print(hash1 == hash2)  # False - each unique
```

## Performance Considerations

### Algorithm Performance Comparison

```python
import hashlib
import time

def benchmark_algorithm(algorithm, data, iterations=10):
    """Benchmark hash algorithm performance."""
    data = data.encode() if isinstance(data, str) else data

    start = time.perf_counter()
    for _ in range(iterations):
        hash_obj = hashlib.new(algorithm)
        hash_obj.update(data)
    elapsed = time.perf_counter() - start

    return elapsed / iterations

# Benchmark common algorithms
test_data = "benchmark data" * 1000
algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'blake2b']

for algo in algorithms:
    time_taken = benchmark_algorithm(algo, test_data, 1000)
    print(f"{algo:10s}: {time_taken*1000000:.2f} µs")

# Results typically show BLAKE2B being fastest on modern systems
```

### Chunk Size Optimization

```python
import hashlib
import time
from pathlib import Path

def find_optimal_chunk_size(filepath):
    """Find optimal chunk size for your system."""
    sizes = [1024, 4096, 8192, 16384, 32768, 65536, 131072]

    for size in sizes:
        start = time.perf_counter()
        hash_obj = hashlib.sha256()

        with open(filepath, 'rb') as f:
            while chunk := f.read(size):
                hash_obj.update(chunk)

        elapsed = time.perf_counter() - start
        print(f"Chunk {size:6d} bytes: {elapsed:.4f} seconds")

    # Note: 65536 (64KB) is typical sweet spot
```

### Memory-Efficient Streaming

```python
import hashlib
from io import BytesIO

def hash_large_stream(stream, algorithm='sha256'):
    """Hash stream without loading into memory."""
    hash_obj = hashlib.new(algorithm)
    buffer_size = 65536

    while True:
        buffer = stream.read(buffer_size)
        if not buffer:
            break
        hash_obj.update(buffer)

    return hash_obj.hexdigest()

# Example with network stream
import urllib.request

url = "https://example.com/file.zip"
try:
    with urllib.request.urlopen(url) as response:
        file_hash = hash_large_stream(response)
        print(f"File hash: {file_hash}")
except Exception as e:
    print(f"Error: {e}")
```

### Parallel Processing for Multiple Files

```python
import hashlib
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from pathlib import Path

def hash_file(filepath):
    """Hash a single file."""
    hash_obj = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hash_obj.update(chunk)
    return filepath, hash_obj.hexdigest()

def hash_files_parallel(directory, max_workers=4):
    """Hash multiple files in parallel."""
    files = list(Path(directory).glob('*'))

    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for filepath, file_hash in executor.map(hash_file, files):
            results[str(filepath)] = file_hash

    return results
```

## Real-world Scenarios

### File Integrity Monitoring

```python
import hashlib
import json
from pathlib import Path
from datetime import datetime

class IntegrityMonitor:
    """Monitor file integrity over time."""

    def __init__(self, manifest_file='manifest.json'):
        self.manifest_file = manifest_file
        self.manifest = self.load_manifest()

    def load_manifest(self):
        """Load existing manifest."""
        if Path(self.manifest_file).exists():
            with open(self.manifest_file, 'r') as f:
                return json.load(f)
        return {}

    def save_manifest(self):
        """Save manifest to disk."""
        with open(self.manifest_file, 'w') as f:
            json.dump(self.manifest, f, indent=2)

    def compute_hash(self, filepath):
        """Compute file hash."""
        hash_obj = hashlib.sha256()
        with open(filepath, 'rb') as f:
            while chunk := f.read(65536):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()

    def register_file(self, filepath):
        """Register file for monitoring."""
        path_str = str(filepath)
        self.manifest[path_str] = {
            'hash': self.compute_hash(filepath),
            'registered': datetime.now().isoformat()
        }
        self.save_manifest()

    def verify_integrity(self, filepath):
        """Check if file has been modified."""
        path_str = str(filepath)
        if path_str not in self.manifest:
            return None

        current_hash = self.compute_hash(filepath)
        original_hash = self.manifest[path_str]['hash']

        return {
            'modified': current_hash != original_hash,
            'current_hash': current_hash,
            'original_hash': original_hash
        }

# Usage
monitor = IntegrityMonitor()
monitor.register_file('important_file.txt')
result = monitor.verify_integrity('important_file.txt')
print(result)
```

### Download Verification

```python
import hashlib
from urllib.request import urlopen

def verify_download(url, expected_hash, algorithm='sha256'):
    """Download and verify file integrity."""
    hash_obj = hashlib.new(algorithm)
    filename = url.split('/')[-1]

    try:
        with urlopen(url) as response:
            with open(filename, 'wb') as out_file:
                while chunk := response.read(65536):
                    hash_obj.update(chunk)
                    out_file.write(chunk)

        actual_hash = hash_obj.hexdigest()
        if actual_hash == expected_hash:
            print(f"✓ Download verified successfully")
            return True
        else:
            print(f"✗ Hash mismatch!")
            print(f"  Expected: {expected_hash}")
            print(f"  Actual:   {actual_hash}")
            return False
    except Exception as e:
        print(f"✗ Download failed: {e}")
        return False

# Usage
url = "https://example.com/file.zip"
expected = "a1b2c3d4e5f6..."
verify_download(url, expected)
```

### Duplicate File Detection

```python
import hashlib
from pathlib import Path
from collections import defaultdict

def find_duplicate_files(directory):
    """Find duplicate files by content hash."""
    hash_map = defaultdict(list)

    for filepath in Path(directory).rglob('*'):
        if not filepath.is_file():
            continue

        hash_obj = hashlib.sha256()
        try:
            with open(filepath, 'rb') as f:
                while chunk := f.read(65536):
                    hash_obj.update(chunk)

            file_hash = hash_obj.hexdigest()
            hash_map[file_hash].append(filepath)
        except (IOError, OSError):
            print(f"Could not read {filepath}")

    # Report duplicates
    duplicates = {h: paths for h, paths in hash_map.items() if len(paths) > 1}

    for file_hash, paths in duplicates.items():
        print(f"\nDuplicate files (hash: {file_hash[:16]}...):")
        for path in paths:
            print(f"  - {path} ({path.stat().st_size} bytes)")

    return duplicates

# Usage
duplicates = find_duplicate_files('/path/to/directory')
```

### Data Deduplication Cache

```python
import hashlib
import json
from pathlib import Path

class DeduplicationCache:
    """Cache data by content hash for deduplication."""

    def __init__(self, cache_dir='.cache'):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.index = self.load_index()

    def load_index(self):
        """Load cache index."""
        index_file = self.cache_dir / 'index.json'
        if index_file.exists():
            with open(index_file, 'r') as f:
                return json.load(f)
        return {}

    def save_index(self):
        """Save cache index."""
        with open(self.cache_dir / 'index.json', 'w') as f:
            json.dump(self.index, f)

    def store(self, data, metadata=None):
        """Store data by content hash."""
        if isinstance(data, str):
            data = data.encode()

        content_hash = hashlib.sha256(data).hexdigest()

        if content_hash not in self.index:
            # Store new data
            cache_file = self.cache_dir / content_hash
            with open(cache_file, 'wb') as f:
                f.write(data)

            self.index[content_hash] = {
                'size': len(data),
                'metadata': metadata or {}
            }
            self.save_index()

        return content_hash

    def retrieve(self, content_hash):
        """Retrieve data by hash."""
        if content_hash not in self.index:
            return None

        cache_file = self.cache_dir / content_hash
        if cache_file.exists():
            with open(cache_file, 'rb') as f:
                return f.read()
        return None

# Usage
cache = DeduplicationCache()
hash1 = cache.store(b"data1", metadata={'type': 'text'})
hash2 = cache.store(b"data1", metadata={'type': 'text'})
print(f"Same hash: {hash1 == hash2}")  # True - deduplicated

retrieved = cache.retrieve(hash1)
print(f"Retrieved: {retrieved}")
```

## Interview Points

### Hash vs Encryption

**Q: What's the difference between hashing and encryption?**

A: Hashing is one-way, encryption is two-way:
- **Hashing**: Irreversible transformation, same input = same output, used for verification
- **Encryption**: Reversible with key, used for confidentiality
- Example: Hash for passwords, encryption for credit card data

### Why Use Salt

**Q: Why do we add salt to password hashes?**

A: Salt prevents:
- **Rainbow tables**: Pre-computed hash tables become useless
- **Dictionary attacks**: Same password gets different hash each time
- **User correlation**: Can't tell if two users have same password

### Collision Resistance

**Q: What is a hash collision and why does it matter?**

A: Collision = Two different inputs producing same hash
- **Why it matters**: Breaks security guarantees
- **MD5 broken**: Practical collision attacks exist
- **SHA-1 vulnerable**: Collision attacks demonstrated
- **SHA-256 safe**: No practical collision attacks known

### PBKDF2 vs bcrypt

**Q: When would you use PBKDF2 vs bcrypt?**

A:
- **PBKDF2**: Standard, flexible, configurable iterations
- **bcrypt**: Specifically designed for passwords, automatically includes salt, slower by design
- **Best**: Use bcrypt for passwords, PBKDF2 for API tokens

### Performance-Security Tradeoff

**Q: How do you balance performance and security for password hashing?**

A:
- More iterations = slower but more secure
- Typical: 100,000+ iterations for PBKDF2
- Should take 100ms-1s to hash (slow down attacks)
- Increase iterations every few years

### Hash Verification Pattern

**Q: How do you safely compare hashes?**

A:
- Use `hmac.compare_digest()` (constant-time)
- Prevents timing attack leaks
- Regular `==` comparison is vulnerable

## Further Reading

### Official Documentation
- [Python hashlib documentation](https://docs.python.org/3/library/hashlib.html)
- [Python hmac documentation](https://docs.python.org/3/library/hmac.html)

### Security Resources
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

### Related Libraries
- **bcrypt**: Specialized password hashing library
- **argon2**: Modern key derivation function
- **cryptography**: Comprehensive cryptography library
- **passlib**: Password hashing library with multiple algorithms

### Key Concepts to Master
1. Always use `encode()` to convert strings to bytes
2. Choose appropriate algorithms (SHA-256 minimum)
3. Use salt for all password hashing
4. Never store plaintext passwords
5. Use PBKDF2 or bcrypt for passwords, not raw hashing
6. Use constant-time comparison for security-critical checks
7. Document which algorithm and parameters you used
8. Update iterations periodically as computers get faster

### Practice Exercises
1. Write a password manager that securely stores credentials
2. Implement file integrity checking for a directory
3. Create a content-addressable storage system
4. Build a deduplication system for large files
5. Implement HMAC-based API authentication
6. Create a secure backup verification system

---

The `hashlib` module is foundational for security in Python applications. Master these concepts and you'll be able to build secure systems that properly handle cryptographic hashing for passwords, data integrity, and authentication.
