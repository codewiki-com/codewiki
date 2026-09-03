---
title: "Python UUID Module: Complete Guide to Generating Unique Identifiers"
description: Comprehensive guide to Python's uuid module for generating universally unique identifiers (UUIDs). Learn UUID versions, generation methods, best practices, and real-world applications.
track: python
section: stdlib
difficulty: beginner
tags:
  - uuid
  - identifiers
  - unique-id
  - data-structures
  - standard-library
status: imported
origin: old/src/content/docs/python/uuid.en.md
divergence: 0.255
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## Concept Explanation

A **UUID (Universally Unique Identifier)**, also known as a GUID (Globally Unique Identifier), is a 128-bit value used to identify information in computer systems. Unlike sequential numeric IDs that must be coordinated across systems, UUIDs can be generated independently across different machines, networks, and services without risk of duplication.

### Historical Context

UUIDs were standardized in RFC 4122 (2005) and have become essential in distributed systems, databases, APIs, and microservices architectures. They solve the fundamental problem of generating unique identifiers in decentralized environments where a central authority cannot allocate IDs.

### The Problem They Solve

Without UUIDs, systems face several challenges:
- **Coordination overhead**: Sequential IDs require a central authority
- **Privacy concerns**: Sequential IDs reveal system scale and growth patterns
- **Scalability issues**: Distributed systems struggle with ID uniqueness
- **Data merging complexity**: Combining databases with overlapping ID ranges becomes problematic

Python's `uuid` module provides multiple methods to generate UUIDs with different properties and guarantees.

## Core Principles

### UUID Structure

A UUID is a 128-bit number typically represented as a string of 32 hexadecimal digits separated by hyphens in five groups: `8-4-4-4-12` format.

```
550e8400-e29b-41d4-a716-446655440000
```

### UUID Versions

The UUID standard defines five main versions (plus NIL UUID):

1. **Version 1 (Time-based)**: Generated from MAC address and current timestamp
2. **Version 3 (MD5 hash-based)**: Generated from namespace and name using MD5
3. **Version 4 (Random)**: Generated from random numbers
4. **Version 5 (SHA-1 hash-based)**: Generated from namespace and name using SHA-1
5. **Version 6 (Time-based, sorted)**: Timestamp-based with sortable properties
6. **Version 7 (Unix Timestamp)**: Unix timestamp-based with random component
7. **NIL UUID**: All zeros (00000000-0000-0000-0000-000000000000)

### Key Characteristics

- **Uniqueness**: 128-bit space makes collisions virtually impossible (2^120 possible values)
- **Decentralized**: Can be generated without network communication
- **Deterministic vs Random**: Versions 1, 3, 5 are deterministic; version 4 is random
- **Sortability**: Versions 1, 6, 7 have time-ordering properties

## Key Points

### Version Comparison

| Version | Method | Deterministic | Sortable | Use Case |
|---------|--------|---|---|---|
| 1 | MAC + Timestamp | Yes | Yes | Database records, system-wide uniqueness |
| 3 | MD5(namespace + name) | Yes | No | URLs, stable IDs from names |
| 4 | Random | No | No | Security tokens, session IDs |
| 5 | SHA-1(namespace + name) | Yes | No | DNS, URLs with collision resistance |
| 6 | Timestamp (sortable) | Yes | Yes | Modern distributed systems, databases |
| 7 | Unix timestamp | Yes | Yes | Performance-optimized systems |

### UUID Representation Formats

- **Standard**: `550e8400-e29b-41d4-a716-446655440000`
- **Integer**: `110086518189149329519403597751589833728`
- **Bytes**: Binary representation (16 bytes)
- **Fields**: Separate time, clock, node components

### Namespaces for Hash-based UUIDs

Python provides predefined namespaces:
- `uuid.NAMESPACE_DNS`: DNS names (6ba7b810-9dad-11d1-80b4-00c04fd430c8)
- `uuid.NAMESPACE_URL`: URLs (6ba7b811-9dad-11d1-80b4-00c04fd430c8)
- `uuid.NAMESPACE_OID`: ISO OID (6ba7b812-9dad-11d1-80b4-00c04fd430c8)
- `uuid.NAMESPACE_X500`: X.500 DN (6ba7b814-9dad-11d1-80b4-00c04fd430c8)

## Code Examples

### Basic UUID Generation

```python
import uuid

# Generate random UUID (version 4)
random_uuid = uuid.uuid4()
print(random_uuid)  # Output: a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c

# UUID string representation
uuid_string = str(random_uuid)
print(uuid_string)  # Output: a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c

# UUID as integer
uuid_int = random_uuid.int
print(uuid_int)  # Output: 238573946482673866597638089098765230700

# UUID as bytes
uuid_bytes = random_uuid.bytes
print(len(uuid_bytes))  # Output: 16
```

### Version 1: Time-based UUID

```python
import uuid

# Generate version 1 UUID (time-based)
# Note: May vary based on network interface availability
time_uuid = uuid.uuid1()
print(time_uuid)
print(f"Version: {time_uuid.version}")  # Output: 1

# Access UUID components
print(f"Timestamp: {time_uuid.timestamp()}")
print(f"MAC Address (node): {time_uuid.node}")
print(f"Clock Sequence: {time_uuid.clock_seq}")

# Generate version 1 with specific node and clock sequence
custom_uuid1 = uuid.uuid1(node=0x123456789abc, clock_seq=1234)
print(custom_uuid1)
```

### Version 3: MD5-based UUID (Namespace)

```python
import uuid

# Create stable UUID from DNS name
namespace = uuid.NAMESPACE_DNS
name = "example.com"
dns_uuid = uuid.uuid3(namespace, name)
print(dns_uuid)
print(f"Version: {dns_uuid.version}")  # Output: 3

# Same namespace + name always produces same UUID (deterministic)
dns_uuid_2 = uuid.uuid3(namespace, name)
print(dns_uuid == dns_uuid_2)  # Output: True

# Different names produce different UUIDs
dns_uuid_3 = uuid.uuid3(namespace, "different.com")
print(dns_uuid == dns_uuid_3)  # Output: False

# Using URL namespace
url_namespace = uuid.NAMESPACE_URL
user_uuid = uuid.uuid3(url_namespace, "https://example.com/user/123")
print(user_uuid)
```

### Version 4: Random UUID

```python
import uuid

# Generate random UUID (most common)
random_uuid = uuid.uuid4()
print(random_uuid)
print(f"Version: {random_uuid.version}")  # Output: 4

# Generate multiple unique UUIDs
user_ids = [uuid.uuid4() for _ in range(5)]
print(user_ids)

# Verify uniqueness
unique_count = len(set(user_ids))
print(f"Unique UUIDs: {unique_count} out of {len(user_ids)}")  # Output: 5 out of 5

# UUID4 with random seed (for reproducibility in tests)
import uuid
saved_state = uuid.getnode()  # Won't directly help with uuid4, but shows access to system info
```

### Version 5: SHA-1-based UUID (Namespace)

```python
import uuid

# Similar to version 3 but with SHA-1 (more secure)
namespace = uuid.NAMESPACE_DNS
name = "example.com"
sha_uuid = uuid.uuid5(namespace, name)
print(sha_uuid)
print(f"Version: {sha_uuid.version}")  # Output: 5

# Deterministic - same inputs produce same output
sha_uuid_2 = uuid.uuid5(namespace, name)
print(sha_uuid == sha_uuid_2)  # Output: True

# Custom namespace UUID
custom_namespace = uuid.uuid4()
user_id = "user_123"
user_uuid = uuid.uuid5(custom_namespace, user_id)
print(user_uuid)
```

### UUID Parsing and Validation

```python
import uuid

# Parse UUID from string
uuid_string = "550e8400-e29b-41d4-a716-446655440000"
parsed_uuid = uuid.UUID(uuid_string)
print(parsed_uuid)
print(type(parsed_uuid))  # Output: <class 'uuid.UUID'>

# Different format variations
uuid_hex = uuid.UUID("550e8400e29b41d4a716446655440000")  # Without hyphens
uuid_int = uuid.UUID(int=308061521170129141992965865450915942128)
uuid_bytes = uuid.UUID(bytes=b'\x55\x0e\x84\x00\xe2\x9b\x41\xd4\xa7\x16\x44\x66\x55\x44\x00\x00')

print(uuid_hex == uuid_int == uuid_bytes == parsed_uuid)  # Output: True

# String representation variations
print(f"Standard: {parsed_uuid}")
print(f"Uppercase: {parsed_uuid.hex.upper()}")  # Grouped without hyphens: 550e8400e29b41d4a716446655440000
print(f"Uppercase with hyphens: {str(parsed_uuid).upper()}")  # 550E8400-E29B-41D4-A716-446655440000
print(f"Integer: {parsed_uuid.int}")
print(f"Hex: {parsed_uuid.hex}")
```

### NIL UUID

```python
import uuid

# NIL UUID - all zeros
nil_uuid = uuid.UUID(int=0)
print(nil_uuid)  # Output: 00000000-0000-0000-0000-000000000000

# Check if UUID is nil
def is_nil_uuid(u):
    return u.int == 0

result = is_nil_uuid(nil_uuid)
print(result)  # Output: True
```

### Practical Example: Database ID Generation

```python
import uuid
from datetime import datetime
from typing import Optional

class User:
    def __init__(self, name: str, email: str):
        self.id: str = str(uuid.uuid4())  # UUID as primary key
        self.name: str = name
        self.email: str = email
        self.created_at: datetime = datetime.utcnow()

    def __repr__(self) -> str:
        return f"User(id={self.id}, name={self.name}, email={self.email})"

# Create users with unique IDs
users = [
    User("Alice", "alice@example.com"),
    User("Bob", "bob@example.com"),
    User("Charlie", "charlie@example.com"),
]

for user in users:
    print(user)

# Verify uniqueness
user_ids = [user.id for user in users]
print(f"All unique: {len(user_ids) == len(set(user_ids))}")  # Output: True
```

### Working with UUID Collections

```python
import uuid
from typing import Dict, Set

# Store UUIDs in sets (efficient for lookups)
user_ids: Set[uuid.UUID] = {uuid.uuid4() for _ in range(1000)}
print(f"Total users: {len(user_ids)}")

# Store UUIDs in dictionaries
user_data: Dict[uuid.UUID, dict] = {
    uuid.uuid4(): {"name": "Alice", "role": "admin"},
    uuid.uuid4(): {"name": "Bob", "role": "user"},
}

# Check membership
test_id = list(user_data.keys())[0]
print(f"User exists: {test_id in user_data}")  # Output: True

# Serialize to JSON-friendly format
import json

uuids_list = [str(uid) for uid in user_ids]
json_str = json.dumps({"users": uuids_list[:3]})  # First 3 for brevity
print(json_str)
```

### Comparison with Sequential IDs

```python
import uuid
import time
from typing import List

# Performance comparison
class IDGenerator:
    def __init__(self):
        self.counter = 0

    def next_sequential(self) -> int:
        self.counter += 1
        return self.counter

    @staticmethod
    def next_uuid() -> uuid.UUID:
        return uuid.uuid4()

# Generate IDs
gen = IDGenerator()
sequential_ids: List[int] = [gen.next_sequential() for _ in range(1000)]
uuid_ids: List[uuid.UUID] = [gen.next_uuid() for _ in range(1000)]

print(f"Sequential ID range: {min(sequential_ids)} to {max(sequential_ids)}")
print(f"UUID example: {uuid_ids[0]}")
print(f"Sequential IDs are sortable: {sequential_ids == sorted(sequential_ids)}")
print(f"UUIDs are not inherently sortable: {uuid_ids != sorted(uuid_ids)}")
```

## Best Practices

### Choose the Right UUID Version

```python
import uuid

# For random identification (most common)
def generate_user_id() -> str:
    return str(uuid.uuid4())

# For deterministic IDs based on user email
def generate_user_id_from_email(email: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, email))

# For sortable time-based IDs (modern systems)
def generate_sortable_id() -> str:
    return str(uuid.uuid1())
```

### Always Convert to String for Storage

```python
import uuid

# Good: Store as string
user_uuid = str(uuid.uuid4())
# Store user_uuid in database

# Also acceptable: Store as UUID object (if your DB supports it)
# Some ORMs have native UUID support

# Avoid: Storing as integer (loses formatting, harder to debug)
user_uuid_int = uuid.uuid4().int  # Less readable
```

### Use Type Hints for Clarity

```python
import uuid
from typing import Optional, List

def create_session(user_id: str) -> uuid.UUID:
    """Create a session with a unique ID."""
    return uuid.uuid4()

def get_user(user_id: str) -> Optional[dict]:
    """Retrieve user by UUID string."""
    pass

def batch_create_tokens(count: int) -> List[str]:
    """Generate multiple UUID tokens."""
    return [str(uuid.uuid4()) for _ in range(count)]
```

### Handle UUID Parsing Safely

```python
import uuid
from typing import Optional

def parse_uuid(uuid_string: str) -> Optional[uuid.UUID]:
    """Safely parse UUID string with error handling."""
    try:
        return uuid.UUID(uuid_string)
    except ValueError as e:
        print(f"Invalid UUID: {uuid_string}, Error: {e}")
        return None

# Usage
test_cases = [
    "550e8400-e29b-41d4-a716-446655440000",
    "invalid-uuid",
    "550e8400e29b41d4a716446655440000",  # Also valid (no hyphens)
]

for test in test_cases:
    result = parse_uuid(test)
    print(f"{test}: {result}")
```

### Use Namespaces Consistently

```python
import uuid

# Define namespace once, reuse it
USER_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "example.com")

def generate_user_uuid(username: str) -> uuid.UUID:
    """Generate consistent UUID for username."""
    return uuid.uuid5(USER_NAMESPACE, username)

# Same username always generates same UUID
user1 = generate_user_uuid("alice")
user2 = generate_user_uuid("alice")
print(f"Same UUID: {user1 == user2}")  # Output: True
```

### Performance Considerations in Batch Operations

```python
import uuid
from typing import List

# Efficient batch generation
def generate_batch(count: int) -> List[str]:
    """Generate multiple UUIDs efficiently."""
    return [str(uuid.uuid4()) for _ in range(count)]

# Using set comprehension for automatic deduplication (shouldn't be needed)
def generate_unique_batch(count: int) -> List[str]:
    """Generate and ensure uniqueness."""
    uuids = set()
    while len(uuids) < count:
        uuids.add(str(uuid.uuid4()))
    return list(uuids)

# Generate 10000 UUIDs
batch = generate_batch(10000)
print(f"Generated {len(batch)} UUIDs")
```

## Common Pitfalls

### Using UUID4 When Deterministic ID is Needed

```python
import uuid

# WRONG: Using random UUID for reproducible scenarios
class Config:
    def __init__(self, name: str):
        self.id = uuid.uuid4()  # Changes every time!
        self.name = name

# Same config creates different IDs
config1 = Config("production")
config2 = Config("production")
print(f"Same config, different IDs: {config1.id != config2.id}")  # True - BAD!

# CORRECT: Use deterministic UUID based on content
class ConfigFixed:
    def __init__(self, name: str):
        self.id = uuid.uuid5(uuid.NAMESPACE_DNS, f"config-{name}")
        self.name = name

config1 = ConfigFixed("production")
config2 = ConfigFixed("production")
print(f"Same config, same ID: {config1.id == config2.id}")  # True - GOOD!
```

### Assuming UUID4 Can Be Compared/Sorted

```python
import uuid

# WRONG: Assuming UUID4 preserves order
ids = [uuid.uuid4() for _ in range(5)]
print(f"Original: {ids}")
print(f"Sorted: {sorted(ids)}")
print(f"Order preserved: {ids == sorted(ids)}")  # Almost always False!

# CORRECT: Use UUID1 or UUID6 if sorting matters
time_ids = [uuid.uuid1() for _ in range(5)]
print(f"\nTime-based UUIDs (should be mostly sorted): {time_ids == sorted(time_ids)}")
```

### Not Validating UUID Input

```python
import uuid

# WRONG: Assuming input is valid
def process_user(user_id: str):
    user_uuid = uuid.UUID(user_id)  # Will crash if invalid!
    # Process user

# CORRECT: Validate before using
def process_user_safe(user_id: str) -> bool:
    try:
        user_uuid = uuid.UUID(user_id)
        # Process user
        return True
    except ValueError:
        print(f"Invalid UUID: {user_id}")
        return False

# Test
process_user_safe("550e8400-e29b-41d4-a716-446655440000")  # Success
process_user_safe("not-a-uuid")  # Graceful failure
```

### Confusing UUID Versions

```python
import uuid

# WRONG: Don't mix versions without understanding differences
ids = [
    uuid.uuid1(),  # Time-based
    uuid.uuid4(),  # Random
    uuid.uuid5(uuid.NAMESPACE_DNS, "example.com"),  # Hash-based
]

# These have very different properties!
for uid in ids:
    print(f"Version: {uid.version}, UUID: {uid}")

# CORRECT: Choose one version per use case
# For security tokens: uuid.uuid4()
# For distributed unique IDs: uuid.uuid1() or uuid.uuid6()
# For deterministic IDs: uuid.uuid5()
```

### Storing UUID as Integer in Binary Fields

```python
import uuid

# WRONG: Storing UUID as INT64 (loses information)
uuid_obj = uuid.uuid4()
# Storing only first 64 bits loses the rest!

# CORRECT: Store as proper UUID type or full binary
def store_uuid(uid: uuid.UUID):
    # Option 1: Store as UUID type
    db_uuid_type = str(uid)  # Database UUID type

    # Option 2: Store as BINARY(16)
    db_binary = uid.bytes  # 16 bytes

    # Option 3: Store as VARCHAR(36)
    db_varchar = str(uid)  # Standard format

    return db_varchar
```

## Performance Considerations

### UUID Generation Speed

```python
import uuid
import time

def benchmark_uuid_generation(version: int, count: int = 100000) -> float:
    """Benchmark UUID generation speed."""
    start = time.perf_counter()

    if version == 1:
        for _ in range(count):
            uuid.uuid1()
    elif version == 4:
        for _ in range(count):
            uuid.uuid4()
    elif version == 5:
        for _ in range(count):
            uuid.uuid5(uuid.NAMESPACE_DNS, str(_))

    elapsed = time.perf_counter() - start
    return elapsed

# Benchmark different versions
for v in [1, 4, 5]:
    elapsed = benchmark_uuid_generation(v)
    print(f"UUID{v}: {elapsed:.4f}s for 100,000 generations")
    # Typical: UUID1 is fastest, UUID4 is fast, UUID5 is slower
```

### Memory Usage

```python
import uuid
import sys

# UUID objects are relatively small
uid = uuid.uuid4()
print(f"UUID object size: {sys.getsizeof(uid)} bytes")

# String representation is larger
uid_string = str(uid)
print(f"UUID string size: {sys.getsizeof(uid_string)} bytes")

# Integer representation uses same as UUID object
uid_int = uid.int
print(f"UUID int size: {sys.getsizeof(uid_int)} bytes")

# For large collections, store as string or use database-native UUID type
ids = [str(uuid.uuid4()) for _ in range(1000000)]
total_memory = sum(sys.getsizeof(i) for i in ids[:1000])  # Sample
print(f"Approx memory for 1M strings: {total_memory / 1000 * 1000 / (1024**2):.2f} MB")
```

### Database Indexing Considerations

```python
import uuid

# UUID1 is better for database indexing (sequential)
def generate_sortable_id() -> str:
    """Use UUID1 or UUID6 for better database performance."""
    return str(uuid.uuid1())

# UUID4 causes index fragmentation (random insertion)
def generate_random_id() -> str:
    """UUID4 is random, may cause index fragmentation."""
    return str(uuid.uuid4())

# For modern databases supporting native UUID:
# PostgreSQL: Use UUID type with UUID1/UUID6 for clustering
# MySQL: BINARY(16) or CHAR(36) with UUID1/UUID6 for performance
# MongoDB: UUID is fine (BSON optimization)
```

## Real-world Scenarios

### Web API: Request Tracking

```python
import uuid
from typing import Dict, Any
from datetime import datetime

class APIRequestTracker:
    """Track API requests with unique IDs for debugging."""

    def __init__(self):
        self.requests: Dict[str, Dict[str, Any]] = {}

    def start_request(self, path: str, method: str) -> str:
        """Generate and track new request."""
        request_id = str(uuid.uuid4())
        self.requests[request_id] = {
            "path": path,
            "method": method,
            "timestamp": datetime.utcnow(),
            "status": "pending"
        }
        return request_id

    def log_response(self, request_id: str, status_code: int, duration_ms: float):
        """Log request completion."""
        if request_id in self.requests:
            self.requests[request_id].update({
                "status": "completed",
                "status_code": status_code,
                "duration_ms": duration_ms
            })

    def get_request_info(self, request_id: str) -> Dict[str, Any]:
        """Retrieve request information."""
        return self.requests.get(request_id, {})

# Usage
tracker = APIRequestTracker()
req_id = tracker.start_request("/api/users", "GET")
# ... process request ...
tracker.log_response(req_id, 200, 45.2)
print(tracker.get_request_info(req_id))
```

### Multi-tenancy: Tenant Isolation

```python
import uuid
from typing import Dict, List

class TenantManager:
    """Manage multiple tenants with unique IDs."""

    def __init__(self):
        self.tenants: Dict[str, Dict] = {}

    def create_tenant(self, name: str, owner: str) -> str:
        """Create new tenant."""
        tenant_id = str(uuid.uuid4())
        self.tenants[tenant_id] = {
            "id": tenant_id,
            "name": name,
            "owner": owner,
            "created_at": __import__('datetime').datetime.utcnow(),
            "databases": []
        }
        return tenant_id

    def create_database(self, tenant_id: str, db_name: str) -> str:
        """Create database for tenant."""
        if tenant_id not in self.tenants:
            raise ValueError(f"Tenant {tenant_id} not found")

        db_id = str(uuid.uuid4())
        self.tenants[tenant_id]["databases"].append({
            "id": db_id,
            "name": db_name
        })
        return db_id

# Usage
manager = TenantManager()
tenant_id = manager.create_tenant("Acme Corp", "john@acme.com")
db_id = manager.create_database(tenant_id, "production")
print(f"Created tenant {tenant_id} with database {db_id}")
```

### Session Management

```python
import uuid
import hashlib
from typing import Optional
from datetime import datetime, timedelta

class SessionManager:
    """Manage user sessions with unique session IDs."""

    def __init__(self, session_timeout_minutes: int = 30):
        self.sessions: Dict[str, Dict] = {}
        self.timeout = timedelta(minutes=session_timeout_minutes)

    def create_session(self, user_id: str) -> str:
        """Create new session for user."""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + self.timeout,
            "last_activity": datetime.utcnow()
        }
        return session_id

    def validate_session(self, session_id: str) -> bool:
        """Check if session is valid and not expired."""
        if session_id not in self.sessions:
            return False

        session = self.sessions[session_id]
        if datetime.utcnow() > session["expires_at"]:
            del self.sessions[session_id]  # Clean up expired session
            return False

        return True

    def get_user_for_session(self, session_id: str) -> Optional[str]:
        """Get user ID from session."""
        if self.validate_session(session_id):
            return self.sessions[session_id]["user_id"]
        return None

# Usage
sessions = SessionManager()
session_id = sessions.create_session("user123")
print(f"Session valid: {sessions.validate_session(session_id)}")
print(f"User for session: {sessions.get_user_for_session(session_id)}")
```

### Data Deduplication

```python
import uuid
import hashlib
from typing import Dict, Set

class DataDeduplicator:
    """Deduplicate data while maintaining references."""

    def __init__(self):
        self.data_store: Dict[str, Dict] = {}
        self.hash_index: Dict[str, str] = {}  # content_hash -> data_id

    def add_data(self, content: str) -> str:
        """Add data and check for duplicates."""
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        # Check if we've seen this content before
        if content_hash in self.hash_index:
            return self.hash_index[content_hash]  # Return existing ID

        # New data - generate unique ID
        data_id = str(uuid.uuid4())
        self.data_store[data_id] = {
            "id": data_id,
            "content": content,
            "hash": content_hash
        }
        self.hash_index[content_hash] = data_id
        return data_id

    def get_unique_count(self) -> int:
        """Count unique data items."""
        return len(self.data_store)

# Usage
dedup = DataDeduplicator()
id1 = dedup.add_data("Hello World")
id2 = dedup.add_data("Hello World")  # Duplicate
id3 = dedup.add_data("Different content")
print(f"Same ID for duplicates: {id1 == id2}")  # True
print(f"Unique items: {dedup.get_unique_count()}")  # 2
```

## Interview Points

### Common Questions

1. **What is a UUID and why use it instead of sequential IDs?**
   - UUID is a 128-bit identifier that can be generated independently without coordination
   - Advantages: distributed generation, privacy (no pattern), data merge-friendly
   - Disadvantages: larger storage, non-sequential (harder to reason about)

2. **What are the different UUID versions and their use cases?**
   - Version 1: Time-based (timestamp + MAC), sortable
   - Version 3: MD5 namespace hash, deterministic
   - Version 4: Random, most common for tokens/sessions
   - Version 5: SHA-1 namespace hash, deterministic
   - Version 6/7: Modern timestamp variants for performance

3. **Why might UUID1 be better for databases than UUID4?**
   - UUID1 is sortable and sequential, improving index clustering
   - UUID4 is random, causing index fragmentation on insertion
   - Modern solutions: UUID6, UUID7, or database-specific optimizations

4. **How do you generate a deterministic UUID from user input?**
   - Use `uuid.uuid5(namespace, name)` with consistent namespace
   - Same namespace and name always produce same UUID
   - Useful for merging data or creating stable references

5. **What's the probability of UUID collision?**
   - For UUID4 (random): 2^120 possible values, mathematically negligible
   - With 1 billion IDs: probability ~10^-21 (smaller than chance of hardware error)
   - For hash-based (v3/v5): depends on hash collision resistance

6. **Should you store UUID as string, bytes, or integer?**
   - String (VARCHAR(36)): Most portable, human-readable, slightly larger
   - Bytes (BINARY(16)): More compact, database native support
   - Integer: Not recommended, loses formatting and is error-prone
   - Use database native UUID type if available

### Follow-up Questions to Demonstrate Depth

```python
# Q: How would you handle UUID validation in an API?
import uuid
from typing import Optional

def validate_uuid_parameter(uuid_str: str) -> Optional[uuid.UUID]:
    """Validate and parse UUID from API parameter."""
    try:
        parsed = uuid.UUID(uuid_str)
        # Could add additional checks:
        # - Not NIL UUID
        # - Specific version
        # - Format validation
        return parsed
    except ValueError:
        return None

# Q: How would you implement UUID-based sharding?
class ShardRouter:
    def __init__(self, shard_count: int = 8):
        self.shard_count = shard_count

    def get_shard(self, item_id: str) -> int:
        """Determine shard based on UUID."""
        uid = uuid.UUID(item_id)
        return uid.int % self.shard_count  # Consistent hashing

# Q: How would you version UUIDs in a system that evolves?
def create_versioned_id(user_id: str, version: int = 1) -> str:
    """Create versioned UUID."""
    namespace = uuid.uuid5(uuid.NAMESPACE_DNS, f"myapp-v{version}")
    return str(uuid.uuid5(namespace, user_id))
```

## Further Reading

### Official Documentation
- [Python uuid module documentation](https://docs.python.org/3/library/uuid.html)
- [RFC 4122 - A Universally Unique Identifier Standard](https://tools.ietf.org/html/rfc4122)
- [UUID Versions Explained (Draft RFC)](https://datatracker.ietf.org/doc/html/draft-ietf-uuidrev-rfc4122bis)

### Related Topics
- **Database Design**: UUID as primary key vs. surrogate keys
- **Distributed Systems**: UUID for decentralized ID generation
- **API Design**: UUID in REST endpoints and GraphQL
- **Security**: UUID for token generation and session management
- **Performance**: UUID indexing and sharding strategies

### Libraries and Tools
- `shortuuid`: Generate shorter, more readable unique IDs
- `uuid6`: Implementation of UUID versions 6 and 7
- `ulid`: ULID (Universally Unique Lexicographically Sortable Identifier) alternative
- `nanoid`: JavaScript-inspired ID generation for Python
- `secrets`: For cryptographically strong random generation (alternative to UUID4)

### Real-world Applications
- Database primary keys (PostgreSQL UUID type, MongoDB ObjectId alternatives)
- REST API resource identifiers
- WebSocket connection tracking
- Task queue job IDs
- Feature flag toggles per user
- Distributed transaction tracing
- Cloud resource identifiers (AWS IDs, Azure GUIDs)
- Blockchain transaction hashes (though often custom)

### Key Takeaways

1. **UUID4 for random generation**: Most common choice for tokens, sessions, resource IDs
2. **UUID5 for deterministic IDs**: When you need consistent IDs from input data
3. **UUID1/UUID6/UUID7 for sortability**: When database performance matters
4. **Always validate**: Validate and handle UUID parsing errors gracefully
5. **Choose storage wisely**: Database-native UUID types when available
6. **Privacy consideration**: UUID4 prevents information leakage unlike sequential IDs
7. **Distributed systems**: UUIDs enable decentralized systems without coordination overhead
