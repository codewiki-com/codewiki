---
title: PostgreSQL Complete Guide
description: Master PostgreSQL for enterprise-grade relational database management
track: backend
section: databases
difficulty: intermediate
tags:
  - PostgreSQL
  - SQL
  - Database
  - RDBMS
status: imported
origin: old/src/content/docs/backend/postgresql-guide.en.md
divergence: 0.243
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: Database
  order: 12
  lastUpdated: 2026-01-07
---

PostgreSQL is the world's most advanced open-source relational database management system, renowned for its reliability, feature richness, extensibility, and performance. Originally developed at UC Berkeley in 1986, PostgreSQL has evolved into a robust enterprise-grade database that powers mission-critical applications across industries. This comprehensive guide explores PostgreSQL's core concepts, advanced features, and performance optimization techniques to help developers master this powerful database system.

## PostgreSQL Features

PostgreSQL stands out among relational databases due to its extensive feature set that combines the best of both traditional RDBMS capabilities and modern data handling requirements.

### Core Architectural Features

PostgreSQL employs a client-server model with a multi-process architecture:

- **Postmaster Process**: The main daemon process that listens for connection requests and forks independent backend processes for each client connection
- **Backend Processes**: Worker processes that handle client query requests
- **Shared Memory**: Contains shared buffers, WAL buffers, and other shared data structures
- **Background Workers**: Includes WAL Writer, Checkpointer, Autovacuum, and other maintenance processes

### Key Distinguishing Features

1. **ACID Compliance**: Full support for Atomicity, Consistency, Isolation, and Durability
2. **MVCC (Multi-Version Concurrency Control)**: Efficient concurrent access without read-write blocking
3. **Extensibility**: Custom data types, operators, functions, and extensions
4. **Advanced SQL Support**: Window functions, CTEs, lateral joins, and more
5. **Robust Security**: Row-level security, SSL encryption, and fine-grained access control
6. **Cross-Platform**: Runs on all major operating systems
7. **Active Community**: Continuous development with annual major releases

### MVCC Multi-Version Concurrency Control

PostgreSQL uses MVCC to handle concurrent access. Each transaction sees a snapshot of the data rather than the current state, enabling non-blocking concurrent operations:

- Read operations never block write operations, and vice versa
- Each row contains `xmin` and `xmax` system columns recording the transaction IDs that created and deleted the row
- Transaction snapshots determine data visibility for the current transaction

```sql
-- View row system columns
SELECT xmin, xmax, ctid, * FROM users LIMIT 5;
```

### Write-Ahead Logging (WAL)

Write-Ahead Logging is PostgreSQL's core mechanism for ensuring data durability. All modifications must be written to the WAL log before being written to data files, ensuring database recovery to a consistent state even after system crashes.

Key WAL advantages:
- **Crash Recovery**: Replay WAL logs after system restart to recover incomplete transactions
- **Replication Foundation**: Both streaming replication and logical replication are built on WAL
- **Point-in-Time Recovery (PITR)**: Combined with base backups, enables recovery to any point in time

```sql
-- View WAL-related configuration
SHOW wal_level;
SHOW max_wal_size;
SHOW checkpoint_timeout;

-- View current WAL position
SELECT pg_current_wal_lsn();

-- View WAL files
SELECT * FROM pg_ls_waldir() ORDER BY modification DESC LIMIT 5;
```

## Data Types

PostgreSQL provides a rich data type system that goes far beyond standard SQL types. Understanding and properly utilizing these types can simplify application logic and improve query efficiency.

### Numeric Types

```sql
-- Integer types
SMALLINT        -- 2 bytes, -32768 to 32767
INTEGER         -- 4 bytes, -2147483648 to 2147483647
BIGINT          -- 8 bytes, -9223372036854775808 to 9223372036854775807
SERIAL          -- Auto-incrementing integer
BIGSERIAL       -- Auto-incrementing bigint

-- Decimal types
NUMERIC(p, s)   -- Exact precision, p digits with s decimal places
DECIMAL(p, s)   -- Alias for NUMERIC
REAL            -- 4 bytes, 6 decimal digits precision
DOUBLE PRECISION -- 8 bytes, 15 decimal digits precision

-- Example: Financial calculations requiring exact precision
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    amount NUMERIC(15, 2) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL
);
```

### Character Types

```sql
-- Character types
CHAR(n)         -- Fixed-length, padded with spaces
VARCHAR(n)      -- Variable-length with limit
TEXT            -- Variable-length, unlimited

-- Tip: In PostgreSQL, there's no performance difference between VARCHAR and TEXT
-- Use VARCHAR(n) only when you need a length constraint
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    slug VARCHAR(100) UNIQUE
);
```

### Date and Time Types

```sql
-- Date/Time types
DATE            -- Date only (4 bytes)
TIME            -- Time only (8 bytes)
TIMESTAMP       -- Date and time without timezone (8 bytes)
TIMESTAMPTZ     -- Date and time with timezone (8 bytes)
INTERVAL        -- Time interval

-- Examples
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED
);

-- Timezone handling
SELECT NOW();                           -- Current timestamp with timezone
SELECT NOW() AT TIME ZONE 'UTC';        -- Convert to UTC
SELECT NOW() AT TIME ZONE 'America/New_York';  -- Convert to specific timezone

-- Date arithmetic
SELECT CURRENT_DATE + INTERVAL '30 days';
SELECT age(CURRENT_DATE, '1990-01-15');
```

### Boolean Type

```sql
-- Boolean accepts: true, false, null
-- Valid literals: TRUE, FALSE, 't', 'f', 'yes', 'no', '1', '0'
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false
);

-- Boolean in WHERE clauses
SELECT * FROM users WHERE is_active;           -- Equivalent to is_active = true
SELECT * FROM users WHERE NOT is_verified;     -- Equivalent to is_verified = false
```

### UUID Type

UUID (Universally Unique Identifier) is ideal for primary keys in distributed systems:

```sql
-- Enable uuid-ossp extension (for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table with UUID primary key
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Using gen_random_uuid() (PostgreSQL 13+, no extension needed)
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL
);

-- UUID advantages for distributed systems:
-- 1. No coordination needed between nodes
-- 2. No sequential pattern exposure
-- 3. Can be generated client-side
```

### Array Type

PostgreSQL natively supports array types, allowing multiple values of the same type in a single field:

```sql
-- Create table with array columns
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[],
    scores INTEGER[]
);

-- Insert array data
INSERT INTO articles (title, tags, scores) VALUES
('PostgreSQL Guide', ARRAY['database', 'sql', 'tutorial'], ARRAY[95, 88, 92]),
('React Hooks', '{"react", "frontend", "javascript"}', '{90, 85}');

-- Array operations
-- Access array elements (1-indexed)
SELECT tags[1] FROM articles;

-- Array slicing
SELECT tags[1:2] FROM articles;

-- Check if element exists in array
SELECT * FROM articles WHERE 'database' = ANY(tags);

-- Array containment check
SELECT * FROM articles WHERE tags @> ARRAY['sql'];

-- Array overlap check
SELECT * FROM articles WHERE tags && ARRAY['react', 'vue'];

-- Append element to array
UPDATE articles SET tags = array_append(tags, 'advanced') WHERE id = 1;

-- Remove element from array
UPDATE articles SET tags = array_remove(tags, 'tutorial') WHERE id = 1;

-- Array length
SELECT array_length(tags, 1) FROM articles;

-- Unnest array to rows
SELECT id, unnest(tags) as tag FROM articles;
```

### Range Types

PostgreSQL supports range types for representing value ranges:

```sql
-- Built-in range types: int4range, int8range, numrange, tsrange, tstzrange, daterange

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    during TSRANGE NOT NULL,
    -- Exclusion constraint prevents overlapping bookings
    EXCLUDE USING GIST (room_id WITH =, during WITH &&)
);

-- Insert range data
INSERT INTO reservations (room_id, during) VALUES
(101, '[2024-01-15 14:00, 2024-01-15 16:00)'),
(101, '[2024-01-15 17:00, 2024-01-15 19:00)');

-- Range queries
-- Contains query
SELECT * FROM reservations
WHERE during @> '2024-01-15 15:00'::timestamp;

-- Overlap check
SELECT * FROM reservations
WHERE during && '[2024-01-15 15:00, 2024-01-15 18:00)'::tsrange;

-- Range bounds
SELECT lower(during), upper(during) FROM reservations;
```

### Enum Type

Enumerated types are suitable for fixed value sets:

```sql
-- Create enum type
CREATE TYPE order_status AS ENUM (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
);

-- Use enum type
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new enum value
ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'cancelled';

-- Query enum values
SELECT enum_range(NULL::order_status);
```

## JSON/JSONB Support

PostgreSQL provides powerful JSON support, making it an excellent choice for applications requiring both relational and document-style data storage. JSONB (Binary JSON) is the recommended format for most use cases.

### JSON vs JSONB Comparison

| Feature | JSON | JSONB |
|---------|------|-------|
| Storage Format | Text | Binary |
| Write Speed | Fast | Slightly slower |
| Query Speed | Slow | Fast |
| Index Support | None | GIN indexes |
| Preserves Whitespace/Order | Yes | No |
| Duplicate Key Handling | Preserves all | Keeps last value |
| Processing | Parsed on each access | Parsed once on input |

### JSONB Operations

```sql
-- Create table with JSONB column
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    attributes JSONB NOT NULL DEFAULT '{}'
);

-- Insert JSONB data
INSERT INTO products (name, attributes) VALUES
('iPhone 15', '{"color": "black", "storage": 256, "specs": {"cpu": "A17", "ram": 8}}'),
('MacBook Pro', '{"color": "silver", "storage": 512, "ports": ["USB-C", "HDMI", "MagSafe"]}'),
('AirPods Pro', '{"color": "white", "features": ["noise_cancellation", "spatial_audio"]}');

-- JSONB operators

-- -> : Get JSON object field (returns JSON)
SELECT attributes -> 'color' FROM products;

-- ->> : Get JSON object field as text
SELECT attributes ->> 'color' FROM products;

-- #> : Get JSON object at path (returns JSON)
SELECT attributes #> '{specs, cpu}' FROM products;

-- #>> : Get JSON object at path as text
SELECT attributes #>> '{specs, cpu}' FROM products;

-- ? : Check if key exists
SELECT * FROM products WHERE attributes ? 'ports';

-- ?| : Check if any of the keys exist
SELECT * FROM products WHERE attributes ?| array['ports', 'features'];

-- ?& : Check if all keys exist
SELECT * FROM products WHERE attributes ?& array['color', 'storage'];

-- @> : Contains (left contains right)
SELECT * FROM products WHERE attributes @> '{"color": "black"}';

-- <@ : Contained by (left is contained by right)
SELECT * FROM products WHERE '{"color": "black", "storage": 256}' @> attributes;

-- || : Concatenate JSONB values
SELECT attributes || '{"warranty": "1 year"}' FROM products;

-- - : Delete key
SELECT attributes - 'color' FROM products;

-- #- : Delete at path
SELECT attributes #- '{specs, ram}' FROM products;
```

### JSONB Functions

```sql
-- jsonb_set: Update or insert value at path
UPDATE products
SET attributes = jsonb_set(attributes, '{storage}', '512')
WHERE name = 'iPhone 15';

-- jsonb_insert: Insert value at path (for arrays)
UPDATE products
SET attributes = jsonb_insert(attributes, '{ports, 0}', '"Thunderbolt"')
WHERE name = 'MacBook Pro';

-- jsonb_build_object: Build JSONB object
SELECT jsonb_build_object(
    'product', name,
    'details', attributes
) FROM products;

-- jsonb_agg: Aggregate values into JSONB array
SELECT jsonb_agg(name) FROM products WHERE attributes @> '{"color": "black"}';

-- jsonb_object_keys: Get keys as set
SELECT DISTINCT jsonb_object_keys(attributes) FROM products;

-- jsonb_each: Expand to key-value pairs
SELECT id, key, value
FROM products, jsonb_each(attributes);

-- jsonb_array_elements: Expand JSON array
SELECT id, elem
FROM products, jsonb_array_elements(attributes -> 'ports') AS elem
WHERE attributes ? 'ports';

-- jsonb_typeof: Get JSON value type
SELECT jsonb_typeof(attributes -> 'storage') FROM products;

-- jsonb_path_query: SQL/JSON path query (PostgreSQL 12+)
SELECT * FROM products
WHERE jsonb_path_exists(attributes, '$.specs.cpu ? (@ == "A17")');
```

### JSONB Indexing

```sql
-- GIN index for all JSONB operations
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- GIN index with jsonb_path_ops (smaller, only supports @>)
CREATE INDEX idx_products_attrs_path ON products
    USING GIN (attributes jsonb_path_ops);

-- Expression index for specific key
CREATE INDEX idx_products_color ON products ((attributes ->> 'color'));

-- Partial index for specific condition
CREATE INDEX idx_products_high_storage ON products ((attributes ->> 'storage'))
    WHERE (attributes ->> 'storage')::int >= 256;
```

## Indexes and Performance

Indexes are fundamental to database performance optimization. PostgreSQL provides multiple index types, each optimized for different data characteristics and query patterns.

### B-Tree Index

B-Tree (Balanced Tree) is PostgreSQL's default index type and the most commonly used structure. It organizes data in a sorted tree structure supporting fast equality and range queries:

```sql
-- Create B-Tree index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (column order matters!)
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- Partial index (indexes only rows meeting condition)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- Unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Covering index (includes additional columns)
CREATE INDEX idx_orders_covering ON orders(customer_id)
    INCLUDE (total_amount, created_at);

-- B-Tree supported operators: <, <=, =, >=, >, BETWEEN, IN, IS NULL, IS NOT NULL
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM orders WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
```

### Hash Index

Hash indexes support only equality comparisons. Since PostgreSQL 10, they're reliable and WAL-logged:

```sql
-- Create Hash index
CREATE INDEX idx_users_hash_email ON users USING HASH (email);

-- Only supports equality queries
SELECT * FROM users WHERE email = 'test@example.com';

-- Use case: Large text columns with only equality lookups
-- Hash indexes are smaller than B-Tree for such cases
```

### GIN Index (Generalized Inverted Index)

GIN indexes are ideal for data types containing multiple values like arrays, JSONB, and full-text search:

```sql
-- GIN index for JSONB
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- GIN index for arrays
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);

-- GIN index with jsonb_path_ops (more compact, only supports @>)
CREATE INDEX idx_products_attrs_path ON products
    USING GIN (attributes jsonb_path_ops);

-- Full-text search GIN index
CREATE INDEX idx_articles_fts ON articles
    USING GIN (to_tsvector('english', title || ' ' || content));

-- GIN supported operators: @>, ?, ?&, ?|, @@ (for full-text)
```

### GiST Index (Generalized Search Tree)

GiST indexes support complex data types and spatial searches:

```sql
-- Install PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create table with geographic data
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    coordinates GEOMETRY(Point, 4326)
);

-- Create GiST index
CREATE INDEX idx_locations_geo ON locations USING GiST (coordinates);

-- Spatial queries
-- Find locations within 5km radius
SELECT * FROM locations
WHERE ST_DWithin(
    coordinates::geography,
    ST_MakePoint(-73.935242, 40.730610)::geography,
    5000
);

-- GiST for range types
CREATE INDEX idx_reservations_during ON reservations USING GiST (during);
```

### BRIN Index (Block Range Index)

BRIN indexes are extremely compact and ideal for large tables where data is physically ordered:

```sql
-- Perfect for time-series data
CREATE TABLE logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10),
    message TEXT
);

-- Create BRIN index
CREATE INDEX idx_logs_created_brin ON logs USING BRIN (created_at);

-- BRIN advantages:
-- 1. Extremely small size (can be 1000x smaller than B-Tree)
-- 2. Low maintenance overhead
-- 3. Ideal for append-only tables with natural ordering
-- 4. Great for billion-row tables

-- Check BRIN index size vs B-Tree
SELECT pg_size_pretty(pg_relation_size('idx_logs_created_brin'));
```

### Index Selection Guide

| Index Type | Best For | Operators Supported | Size |
|------------|----------|---------------------|------|
| B-Tree | Equality, range, sorting | <, <=, =, >=, >, BETWEEN | Medium |
| Hash | Equality only | = | Small |
| GIN | Full-text, JSONB, arrays | @>, ?, ?&, ?|, @@ | Large |
| GiST | Geospatial, ranges | &&, @>, <@, << | Medium |
| BRIN | Time-series, ordered large tables | <, <=, =, >=, > | Very small |

## Full-Text Search

PostgreSQL includes powerful full-text search capabilities without requiring external search engines. Full-text search uses `tsvector` (document vector) and `tsquery` (query expression) data types for efficient text retrieval.

### Core Concepts

- **tsvector**: Converts documents into searchable lexemes (normalized words)
- **tsquery**: Represents search conditions as query expressions
- **Dictionary**: Handles lexeme processing like stemming and stopword filtering
- **Configuration**: Defines which dictionaries and parsers to use

### Basic Full-Text Search

```sql
-- Create full-text search column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Update search vector
UPDATE articles SET search_vector =
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

-- Create GIN index for fast searching
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

-- Create trigger to auto-update search vector
CREATE OR REPLACE FUNCTION articles_search_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_search_update
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION articles_search_trigger();

-- Basic search query
SELECT title, content
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql & database');

-- Search with ranking
SELECT
    title,
    ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'postgresql & tutorial') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

### Search Query Syntax

```sql
-- AND operator (&)
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql & performance');

-- OR operator (|)
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'mysql | postgresql');

-- NOT operator (!)
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'database & !nosql');

-- Phrase search (<->)
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'full <-> text <-> search');

-- Prefix matching (:*)
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'optim:*');

-- Using plainto_tsquery for natural language input
SELECT * FROM articles
WHERE search_vector @@ plainto_tsquery('english', 'postgresql performance tuning');

-- Using websearch_to_tsquery (PostgreSQL 11+) for web-style queries
SELECT * FROM articles
WHERE search_vector @@ websearch_to_tsquery('english', '"full text search" -mysql');
```

### Search Highlighting

```sql
-- Highlight matching terms in results
SELECT
    title,
    ts_headline('english', content, to_tsquery('english', 'postgresql'),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25'
    ) AS highlighted_content
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql');
```

### Weighted Search

```sql
-- Set different weights for different fields (A > B > C > D)
UPDATE articles SET search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C');

-- Ranking with weights
SELECT
    title,
    ts_rank_cd(search_vector, query, 32) AS rank  -- 32 = divide rank by document length
FROM articles, to_tsquery('english', 'database') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Custom weight array
SELECT
    title,
    ts_rank_cd(search_vector, query, '{0.1, 0.2, 0.4, 1.0}') AS rank
FROM articles, to_tsquery('english', 'database') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

## Transactions and ACID

Transactions are the fundamental unit of database operations, providing ACID properties: Atomicity, Consistency, Isolation, and Durability. PostgreSQL implements efficient transaction isolation through its MVCC mechanism.

### ACID Properties Explained

1. **Atomicity**: All operations in a transaction succeed or all fail together
2. **Consistency**: Database moves from one valid state to another
3. **Isolation**: Concurrent transactions don't interfere with each other
4. **Durability**: Committed changes persist even after system failure

### Transaction Basics

```sql
-- Basic transaction
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Transaction with rollback
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- Something went wrong
ROLLBACK;

-- Savepoints for partial rollback
BEGIN;
INSERT INTO orders (customer_id, total) VALUES (1, 100);
SAVEPOINT sp1;
INSERT INTO order_items (order_id, product_id) VALUES (1, 100);
-- Error occurred, rollback to savepoint
ROLLBACK TO sp1;
INSERT INTO order_items (order_id, product_id) VALUES (1, 200);
COMMIT;
```

### Isolation Levels

PostgreSQL supports four SQL-standard isolation levels:

```sql
-- Read Uncommitted (treated as Read Committed in PostgreSQL)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Read Committed (default)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Repeatable Read
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Set isolation level for specific transaction
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- ... operations
COMMIT;

-- Set default isolation level for session
SET default_transaction_isolation = 'repeatable read';
```

### Isolation Level Characteristics

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-----------------|------------|---------------------|--------------|
| READ UNCOMMITTED | Not possible* | Possible | Possible |
| READ COMMITTED | Not possible | Possible | Possible |
| REPEATABLE READ | Not possible | Not possible | Not possible** |
| SERIALIZABLE | Not possible | Not possible | Not possible |

*PostgreSQL treats READ UNCOMMITTED as READ COMMITTED
**PostgreSQL's REPEATABLE READ also prevents phantom reads

### Practical Isolation Examples

```sql
-- Session 1: Read Committed behavior
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000
-- Session 2 commits: UPDATE accounts SET balance = 500 WHERE id = 1;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 500 (sees committed change)
COMMIT;

-- Session 1: Repeatable Read behavior
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000
-- Session 2 commits: UPDATE accounts SET balance = 500 WHERE id = 1;
SELECT balance FROM accounts WHERE id = 1;  -- Still returns 1000 (snapshot)
COMMIT;
```

### Locking Mechanisms

```sql
-- Row-level locks
-- FOR UPDATE: Exclusive lock, blocks other transactions from modifying or locking
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- FOR SHARE: Shared lock, allows other reads but not modifications
SELECT * FROM accounts WHERE id = 1 FOR SHARE;

-- FOR NO KEY UPDATE: For updating non-key columns
SELECT * FROM accounts WHERE id = 1 FOR NO KEY UPDATE;

-- SKIP LOCKED: Skip already locked rows (great for job queues)
SELECT * FROM tasks WHERE status = 'pending'
FOR UPDATE SKIP LOCKED LIMIT 1;

-- NOWAIT: Fail immediately if lock not available
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;

-- View current locks
SELECT
    pg_class.relname,
    pg_locks.mode,
    pg_locks.granted,
    pg_locks.pid
FROM pg_locks
JOIN pg_class ON pg_locks.relation = pg_class.oid
WHERE pg_class.relname NOT LIKE 'pg_%';

-- Deadlock detection
SHOW deadlock_timeout;  -- Default 1s

-- Set lock wait timeout
SET lock_timeout = '10s';
```

## Replication

PostgreSQL offers robust replication options for high availability, read scaling, and disaster recovery. Understanding these options is crucial for building reliable production systems.

### Streaming Replication

Streaming replication provides real-time, byte-by-byte copying of WAL data to standby servers:

```sql
-- Primary server configuration (postgresql.conf)
-- wal_level = replica
-- max_wal_senders = 10
-- wal_keep_size = 1GB

-- Create replication user
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_password';

-- Check replication status on primary
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag
FROM pg_stat_replication;

-- Check replication status on standby
SELECT
    pg_is_in_recovery(),
    pg_last_wal_receive_lsn(),
    pg_last_wal_replay_lsn(),
    pg_last_xact_replay_timestamp();
```

### Logical Replication

Logical replication allows selective table replication and cross-version upgrades:

```sql
-- Enable logical replication (postgresql.conf)
-- wal_level = logical

-- On publisher: Create publication
CREATE PUBLICATION my_publication FOR TABLE users, orders;

-- Or publish all tables
CREATE PUBLICATION all_tables_pub FOR ALL TABLES;

-- On subscriber: Create subscription
CREATE SUBSCRIPTION my_subscription
    CONNECTION 'host=primary_host dbname=mydb user=replicator password=xxx'
    PUBLICATION my_publication;

-- Monitor logical replication
SELECT * FROM pg_stat_subscription;
SELECT * FROM pg_replication_slots;

-- Add table to publication
ALTER PUBLICATION my_publication ADD TABLE products;

-- Refresh subscription
ALTER SUBSCRIPTION my_subscription REFRESH PUBLICATION;
```

### High Availability Solutions

```sql
-- Popular HA tools:
-- 1. Patroni - Template for PostgreSQL HA with etcd/consul/zookeeper
-- 2. pg_auto_failover - Automatic failover solution
-- 3. repmgr - Replication manager for PostgreSQL

-- Key metrics to monitor for HA
SELECT
    pg_is_in_recovery() as is_standby,
    CASE WHEN pg_is_in_recovery()
        THEN pg_last_wal_replay_lsn()
        ELSE pg_current_wal_lsn()
    END as current_lsn;
```

## Query Optimization

Query optimization is central to database performance tuning. PostgreSQL's query optimizer selects optimal execution plans based on table statistics, index availability, and other factors.

### Understanding Execution Plans

```sql
-- Basic EXPLAIN (shows plan without executing)
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- EXPLAIN ANALYZE (actually executes the query)
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Detailed output with buffers
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- JSON format for programmatic parsing
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM orders WHERE created_at > '2024-01-01';
```

### Reading Execution Plans

```
Seq Scan on users  (cost=0.00..1.05 rows=1 width=100) (actual time=0.015..0.017 rows=1 loops=1)
  Filter: (email = 'test@example.com'::text)
  Rows Removed by Filter: 4
  Buffers: shared hit=1
Planning Time: 0.085 ms
Execution Time: 0.035 ms
```

Key metrics explained:
- **cost**: Estimated cost (startup cost..total cost) in arbitrary units
- **rows**: Estimated number of rows returned
- **actual time**: Real execution time (first row..total time in milliseconds)
- **loops**: Number of times this node was executed
- **Buffers**: Buffer hits (cache) and reads (disk)

### Common Execution Plan Nodes

| Node Type | Description | When Used |
|-----------|-------------|-----------|
| Seq Scan | Sequential table scan | No suitable index, small table |
| Index Scan | Use index then fetch rows | Selective queries with index |
| Index Only Scan | Use only index data | Covering index, no table access needed |
| Bitmap Index Scan | Build bitmap then scan | Multiple conditions, moderate selectivity |
| Nested Loop | Join rows one by one | Small datasets, indexed lookups |
| Hash Join | Build hash table, probe | Equality joins, larger datasets |
| Merge Join | Sort both sides, merge | Already sorted data, range joins |
| Sort | Sort rows | ORDER BY, merge joins |
| Aggregate | Compute aggregates | GROUP BY, COUNT, SUM, etc. |

### Optimization Techniques

```sql
-- Update statistics for better query planning
ANALYZE users;

-- Detailed table statistics
ANALYZE VERBOSE orders;

-- View table statistics
SELECT
    attname,
    n_distinct,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE tablename = 'users';

-- Create covering index to avoid table access
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (name, created_at);

-- Force index usage (for testing only)
SET enable_seqscan = OFF;
EXPLAIN ANALYZE SELECT * FROM users WHERE status = 'active';
SET enable_seqscan = ON;

-- Increase work_mem for complex sorts/joins
SET work_mem = '256MB';
EXPLAIN ANALYZE SELECT * FROM large_table ORDER BY complex_column;

-- Parallel query tuning
SET max_parallel_workers_per_gather = 4;
EXPLAIN ANALYZE SELECT COUNT(*) FROM very_large_table;
```

### Finding Performance Issues

```sql
-- Find tables that might need indexes (high sequential scans)
SELECT
    schemaname,
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    CASE WHEN seq_scan > 0
        THEN round(seq_tup_read::numeric / seq_scan, 2)
        ELSE 0
    END AS avg_rows_per_seq_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_tup_read DESC
LIMIT 10;

-- Find unused indexes
SELECT
    schemaname,
    indexrelname AS index_name,
    relname AS table_name,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find slow queries (requires pg_stat_statements)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
    query,
    calls,
    round(total_exec_time::numeric / calls, 2) AS avg_time_ms,
    round(total_exec_time::numeric, 2) AS total_time_ms,
    rows / calls AS avg_rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Find queries with poor cache hit ratio
SELECT
    query,
    calls,
    shared_blks_hit,
    shared_blks_read,
    round(100.0 * shared_blks_hit /
        nullif(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_statements
WHERE shared_blks_hit + shared_blks_read > 100
ORDER BY cache_hit_ratio ASC
LIMIT 10;
```

### Configuration Tuning

```sql
-- Memory settings
SHOW shared_buffers;          -- Shared memory for caching (25% of RAM)
SHOW work_mem;                -- Memory per operation (sort, hash)
SHOW maintenance_work_mem;    -- Memory for maintenance tasks
SHOW effective_cache_size;    -- Planner's estimate of OS cache (50-75% of RAM)

-- Connection settings
SHOW max_connections;         -- Maximum concurrent connections

-- WAL settings
SHOW wal_buffers;
SHOW checkpoint_timeout;
SHOW max_wal_size;

-- Query planner settings
SHOW random_page_cost;        -- Cost of random disk access (lower for SSDs)
SHOW effective_io_concurrency; -- Concurrent disk I/O (higher for SSDs)

-- Example optimized settings for SSD
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_io_concurrency = 200;
-- SELECT pg_reload_conf();
```

## Interview Key Points

### Common Interview Questions

1. **What are the main differences between PostgreSQL and MySQL?**
   - PostgreSQL supports richer data types (JSONB, arrays, range types, etc.)
   - PostgreSQL has more index types (GIN, GiST, BRIN)
   - PostgreSQL has better SQL standard compliance
   - PostgreSQL uses true MVCC; MySQL InnoDB uses a different implementation
   - PostgreSQL has stronger extension ecosystem
   - PostgreSQL supports table inheritance and partitioning natively

2. **How do you optimize a slow query?**
   - Use EXPLAIN ANALYZE to examine the execution plan
   - Check if appropriate indexes exist and are being used
   - Update table statistics with ANALYZE
   - Consider query rewrites or adding covering indexes
   - Check work_mem configuration for sorts and hash operations
   - Look for unnecessary columns in SELECT
   - Examine join order and method

3. **How does MVCC work in PostgreSQL?**
   - Each row stores version information (xmin/xmax transaction IDs)
   - Readers see a consistent snapshot based on transaction isolation level
   - Writers create new row versions rather than updating in place
   - Dead tuples are reclaimed by VACUUM
   - No read-write blocking enables high concurrency

4. **How do you handle large tables?**
   - Use table partitioning (range, list, or hash)
   - Archive historical data regularly
   - Use BRIN indexes for time-ordered data
   - Consider TimescaleDB for time-series workloads
   - Implement proper indexing strategies
   - Use parallel query execution

5. **When should you use different index types?**
   - B-Tree: Default choice for equality and range queries
   - Hash: Only equality queries, smaller than B-Tree
   - GIN: Full-text search, JSONB, arrays
   - GiST: Geospatial data, range types
   - BRIN: Time-series data, large ordered tables

6. **What's the difference between VACUUM and VACUUM FULL?**
   - VACUUM: Marks dead tuples as reusable, doesn't shrink file, non-blocking
   - VACUUM FULL: Rebuilds entire table, returns space to OS, locks table exclusively
   - Use regular VACUUM for routine maintenance
   - Consider VACUUM FULL only for severe bloat
   - pg_repack is a non-blocking alternative to VACUUM FULL

7. **How do you implement database high availability?**
   - Configure streaming replication with synchronous or asynchronous mode
   - Use Patroni or pg_auto_failover for automatic failover
   - Implement connection pooling with PgBouncer
   - Set up proper monitoring and alerting
   - Consider Citus for distributed architecture

8. **What is connection bloat and how do you solve it?**
   - Each PostgreSQL connection is a separate process consuming memory
   - Too many connections exhaust system resources
   - Solution: Use connection pooling (PgBouncer, pgpool-II)
   - Configure max_connections appropriately
   - Use transaction-mode pooling for short-lived queries

9. **Explain the checkpoint process and its impact on performance.**
   - Checkpoints flush dirty pages from shared buffers to disk
   - They mark a recovery point in WAL
   - Too frequent: Increases I/O, hurts performance
   - Too infrequent: Longer recovery time, more WAL retained
   - Tune checkpoint_timeout and max_wal_size based on workload

10. **How do you handle database migrations safely?**
    - Use tools like Flyway, Liquibase, or Alembic
    - Test migrations in staging environment first
    - Avoid long-running locks (use CREATE INDEX CONCURRENTLY)
    - Have rollback plans ready
    - Consider blue-green deployments for major changes

## Further Reading

### Official Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/) - Comprehensive and authoritative
- [PostgreSQL Wiki](https://wiki.postgresql.org/) - Community knowledge base
- [PostgreSQL Source Code](https://github.com/postgres/postgres) - Learn from the source

### Recommended Books

- "PostgreSQL: Up and Running" by Regina Obe and Leo Hsu
- "The Art of PostgreSQL" by Dimitri Fontaine
- "PostgreSQL 14 Administration Cookbook" by Simon Riggs and Gianni Ciolli
- "Mastering PostgreSQL" series by Hans-Jurgen Schonig

### Online Learning

- [PostgreSQL Exercises](https://pgexercises.com/) - Interactive SQL practice
- [The Art of PostgreSQL](https://theartofpostgresql.com/) - Advanced techniques
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) - Beginner-friendly tutorials
- [Planet PostgreSQL](https://planet.postgresql.org/) - Community blog aggregator

### Advanced Topics to Explore

- Logical replication and change data capture (CDC)
- PostgreSQL high availability with Patroni
- Time-series databases with TimescaleDB
- Distributed PostgreSQL with Citus
- Vector similarity search with pgvector
- Advanced partitioning strategies
- Query parallelization and optimization
- Custom extensions development

### Monitoring and Tools

- pgAdmin - Popular PostgreSQL administration tool
- DBeaver - Universal database client
- pg_stat_statements - Query performance monitoring
- pgBadger - Log analysis and reporting
- Prometheus + Grafana - Metrics and visualization
- pg_stat_monitor - Enhanced query monitoring

---

PostgreSQL's combination of reliability, extensibility, and advanced features makes it the database of choice for organizations ranging from startups to Fortune 500 companies. Its active community ensures continuous improvement, with each annual release bringing new capabilities. By mastering PostgreSQL's core concepts and optimization techniques, developers can build robust, high-performance database applications that scale with their needs. Stay engaged with the PostgreSQL community and keep exploring new features to continuously enhance your database skills.
