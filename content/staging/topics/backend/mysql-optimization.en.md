---
title: MySQL Performance Optimization Guide
description: Master MySQL optimization for high-performance databases
track: backend
section: databases
difficulty: advanced
tags:
  - MySQL
  - Performance
  - Indexing
  - SQL
status: imported
origin: old/src/content/docs/backend/mysql-optimization.en.md
divergence: 0.221
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 21
  lastUpdated: 2026-01-07
---

MySQL is one of the world's most popular open-source relational databases, widely used in web applications, enterprise systems, and internet services. As data volumes and access rates grow, database performance optimization becomes a critical component of building highly available systems. This guide walks through core MySQL performance optimization techniques, from architectural principles to practical tips, helping developers build high-performance database applications.

## MySQL Architecture and Storage Engines

### MySQL Overall Architecture

MySQL employs a layered architecture design, consisting of several core layers:

```
+-----------------------------------------------------------+
|                    Connection Layer                        |
|  +-----------------------------------------------------+  |
|  | Connection Mgmt | Auth | Thread Pool | Connection Pool |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
|                     Server Layer                           |
|  +-----------------------------------------------------+  |
|  | SQL Interface | Parser | Optimizer | Cache | Executor |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
|                  Storage Engine Layer                      |
|  +---------+ +---------+ +---------+ +---------+          |
|  | InnoDB  | | MyISAM  | | Memory  | | Archive |          |
|  +---------+ +---------+ +---------+ +---------+          |
+-----------------------------------------------------------+
|                    File System Layer                       |
|  +-----------------------------------------------------+  |
|  | Data Files | Log Files | Config Files | Index Files |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

The **Connection Layer** handles client connections, authentication, and permission validation. Each client connection is assigned a dedicated thread to process requests.

The **Server Layer** is MySQL's core, containing query parsing, optimization, caching, and execution functionality. The query optimizer generates the optimal execution plan for SQL statements.

The **Storage Engine Layer** is responsible for data storage and retrieval. MySQL supports a pluggable storage engine architecture, with different engines offering different characteristics.

### Deep Dive into InnoDB Storage Engine

InnoDB is MySQL's default storage engine and the most commonly used engine in production environments. It provides these core features:

```sql
-- Check current default storage engine
SHOW VARIABLES LIKE 'default_storage_engine';

-- View all supported storage engines
SHOW ENGINES;

-- Check storage engine used by a table
SHOW TABLE STATUS LIKE 'users'\G
```

**InnoDB Core Features:**

| Feature | Description |
|---------|-------------|
| Transaction Support | Full ACID transaction support |
| Row-Level Locking | Supports row-level locks for better concurrency |
| Foreign Key Constraints | Supports foreign key integrity constraints |
| MVCC | Multi-Version Concurrency Control, reads don't block writes |
| Crash Recovery | Automatic crash recovery capability |
| Clustered Index | Data stored in primary key order |

### InnoDB Memory Structures

```sql
-- View InnoDB buffer pool configuration
SHOW VARIABLES LIKE 'innodb_buffer_pool%';

-- Check buffer pool status
SHOW STATUS LIKE 'Innodb_buffer_pool%';

-- Recommended configuration (typically 70-80% of physical memory)
SET GLOBAL innodb_buffer_pool_size = 8589934592;  -- 8GB
```

The **Buffer Pool** is InnoDB's most important memory structure, used to cache data pages and index pages:

```sql
-- Check buffer pool hit ratio
SELECT
    (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100
    AS buffer_pool_hit_ratio
FROM (
    SELECT
        VARIABLE_VALUE AS Innodb_buffer_pool_reads
    FROM performance_schema.global_status
    WHERE VARIABLE_NAME = 'Innodb_buffer_pool_reads'
) a,
(
    SELECT
        VARIABLE_VALUE AS Innodb_buffer_pool_read_requests
    FROM performance_schema.global_status
    WHERE VARIABLE_NAME = 'Innodb_buffer_pool_read_requests'
) b;
```

### Redo Log and Undo Log

**Redo Log** ensures transaction durability by recording physical modifications to data pages:

```sql
-- View Redo Log configuration
SHOW VARIABLES LIKE 'innodb_log%';

-- Recommended configuration
-- innodb_log_file_size = 1G        -- Individual log file size
-- innodb_log_files_in_group = 2    -- Number of log file groups
-- innodb_log_buffer_size = 64M     -- Log buffer size
```

**Undo Log** is used for transaction rollback and MVCC implementation:

```sql
-- View Undo-related configuration
SHOW VARIABLES LIKE 'innodb_undo%';

-- View currently active Undo segments
SELECT * FROM information_schema.INNODB_METRICS
WHERE NAME LIKE '%undo%';
```

---

## Index Principles and Optimization

### B+ Tree Index Structure

MySQL InnoDB uses B+ trees as the default index data structure, a balanced multi-way search tree:

```
                        +------------------+
                        |    [35, 70]      |  Root Node
                        +--------+---------+
                   +-----------+-----------+
                   v           v           v
            +------------+ +------------+ +------------+
            |[10,20,30]  | |[40,50,60]  | |[75,80,90]  |  Branch Nodes
            +-----+------+ +-----+------+ +-----+------+
                  |              |              |
     +---+---+---+---+   +---+---+---+   +---+---+---+
     v   v   v   v   v   v   v   v   v   v   v   v   v
   +---+---+---+---+   +---+---+---+   +---+---+---+
   |10 |20 |30 |-> |   |40 |50 |60 |   |75 |80 |90 |  Leaf Nodes
   |   |   |   |   |   |   |   |   |   |   |   |   |  (Doubly Linked List)
   +---+---+---+---+   +---+---+---+   +---+---+---+
```

**Advantages of B+ Trees:**

1. **Disk-Friendly**: Node size aligns with disk pages, reducing I/O operations
2. **Efficient Range Queries**: Leaf nodes connected via linked list support efficient range scans
3. **Stable Query Performance**: All queries reach leaf nodes, providing consistent efficiency
4. **Higher Fan-Out**: Non-leaf nodes don't store data, allowing more keys per node

### Clustered Index and Secondary Index

```sql
-- Create sample table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_age_created (age, created_at)
) ENGINE=InnoDB;
```

**Clustered Index:**

- In InnoDB, the primary key index is the clustered index
- Leaf nodes store complete row data
- Table data is physically stored in primary key order

**Secondary Index:**

- All non-primary key indexes are secondary indexes
- Leaf nodes store primary key values
- Queries may require a table lookup (bookmark lookup)

```sql
-- Clustered index query (direct data access)
SELECT * FROM users WHERE id = 100;

-- Secondary index query (may require table lookup)
SELECT * FROM users WHERE username = 'john';
-- Execution: 1. Find id for username='john' in idx_username
--           2. Lookup complete data using id from primary index

-- Index-only query (no table lookup needed)
SELECT id, username FROM users WHERE username = 'john';
-- idx_username already contains id and username, no lookup required
```

### Covering Index Optimization

A covering index contains all columns needed by the query, avoiding table lookups:

```sql
-- Create covering index
CREATE INDEX idx_username_email ON users(username, email);

-- This query can use the covering index
EXPLAIN SELECT username, email FROM users WHERE username = 'john';
-- Extra column shows "Using index"

-- Before optimization: requires table lookup
SELECT id, username, email, age FROM users WHERE username LIKE 'john%';

-- After optimization: create covering index
CREATE INDEX idx_cover_user ON users(username, email, age);
SELECT id, username, email, age FROM users WHERE username LIKE 'john%';
```

### Composite Index and Leftmost Prefix Rule

```sql
-- Create composite index
CREATE INDEX idx_compound ON orders(user_id, status, created_at);

-- These queries CAN use the index:
SELECT * FROM orders WHERE user_id = 100;                           -- Uses index
SELECT * FROM orders WHERE user_id = 100 AND status = 'paid';       -- Uses index
SELECT * FROM orders WHERE user_id = 100 AND status = 'paid'
    AND created_at > '2024-01-01';                                  -- Uses index

-- These queries CANNOT use the index (violates leftmost prefix):
SELECT * FROM orders WHERE status = 'paid';                         -- Cannot use
SELECT * FROM orders WHERE created_at > '2024-01-01';               -- Cannot use
SELECT * FROM orders WHERE status = 'paid' AND created_at > '2024-01-01';  -- Cannot use
```

### Index Design Best Practices

```sql
-- 1. Columns with high selectivity are good for indexing
SELECT
    COUNT(DISTINCT status) / COUNT(*) AS status_selectivity,
    COUNT(DISTINCT user_id) / COUNT(*) AS user_id_selectivity
FROM orders;
-- user_id has higher selectivity, better candidate for indexing

-- 2. Avoid over-indexing
-- Bad practice: Creating an index for every column
CREATE INDEX idx_col1 ON table_name(col1);
CREATE INDEX idx_col2 ON table_name(col2);
CREATE INDEX idx_col3 ON table_name(col3);

-- Better practice: Create composite indexes based on query patterns
CREATE INDEX idx_composite ON table_name(col1, col2, col3);

-- 3. Prefix indexes for long strings
-- For very long strings, use prefix indexes to save space
CREATE INDEX idx_email_prefix ON users(email(20));

-- Calculate optimal prefix length
SELECT
    COUNT(DISTINCT LEFT(email, 10)) / COUNT(*) AS prefix_10,
    COUNT(DISTINCT LEFT(email, 15)) / COUNT(*) AS prefix_15,
    COUNT(DISTINCT LEFT(email, 20)) / COUNT(*) AS prefix_20,
    COUNT(DISTINCT email) / COUNT(*) AS full_selectivity
FROM users;

-- 4. Use Index Condition Pushdown (ICP)
-- Supported in MySQL 5.6+
EXPLAIN SELECT * FROM users
WHERE age > 20 AND username LIKE '%test%';
-- Extra: Using index condition
```

---

## SQL Query Optimization

### Query Optimization Principles

```sql
-- 1. Avoid SELECT *
-- Not recommended
SELECT * FROM users WHERE id = 100;

-- Recommended: Select only needed columns
SELECT id, username, email FROM users WHERE id = 100;

-- 2. Avoid function operations on columns in WHERE clause
-- Not recommended (cannot use index)
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- Recommended (can use index)
SELECT * FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

-- 3. Avoid implicit type conversions
-- Assuming phone column is VARCHAR type
-- Not recommended (triggers implicit conversion, cannot use index)
SELECT * FROM users WHERE phone = 13800138000;

-- Recommended
SELECT * FROM users WHERE phone = '13800138000';

-- 4. Use EXISTS instead of IN (for large datasets)
-- Not recommended
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- Recommended
SELECT * FROM orders o
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id AND u.status = 'active');

-- 5. Use LIMIT pagination wisely
-- Not recommended (poor performance for deep pagination)
SELECT * FROM orders ORDER BY id LIMIT 1000000, 20;

-- Recommended: Deferred join optimization
SELECT o.* FROM orders o
INNER JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 20) t
ON o.id = t.id;

-- Or use cursor-based pagination
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 20;
```

### JOIN Optimization

```sql
-- 1. Ensure JOIN columns are indexed
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_users_id ON users(id);  -- Primary key is auto-indexed

-- 2. Drive with smaller table
-- MySQL optimizer usually selects automatically, but STRAIGHT_JOIN can force order
SELECT STRAIGHT_JOIN u.*, o.order_no
FROM users u  -- Smaller table
INNER JOIN orders o ON u.id = o.user_id;  -- Larger table

-- 3. Avoid too many JOINs
-- Not recommended: Complex multi-table JOIN
SELECT * FROM a
JOIN b ON a.id = b.a_id
JOIN c ON b.id = c.b_id
JOIN d ON c.id = d.c_id
JOIN e ON d.id = e.d_id;

-- Recommended: Split into multiple simple queries, assemble at application layer

-- 4. View JOIN execution order
EXPLAIN FORMAT=JSON
SELECT u.username, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;
```

### Subquery Optimization

```sql
-- 1. Rewrite correlated subqueries as JOINs
-- Not recommended: Correlated subquery
SELECT u.*,
    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count
FROM users u;

-- Recommended: Use JOIN
SELECT u.*, COALESCE(o.order_count, 0) AS order_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
) o ON u.id = o.user_id;

-- 2. Avoid correlated subqueries in WHERE
-- Not recommended
SELECT * FROM products p
WHERE price > (SELECT AVG(price) FROM products WHERE category_id = p.category_id);

-- Recommended
SELECT p.* FROM products p
INNER JOIN (
    SELECT category_id, AVG(price) AS avg_price
    FROM products
    GROUP BY category_id
) avg_t ON p.category_id = avg_t.category_id AND p.price > avg_t.avg_price;
```

---

## EXPLAIN Execution Plan Analysis

### Understanding EXPLAIN Output

```sql
-- Basic usage
EXPLAIN SELECT * FROM users WHERE username = 'john';

-- Detailed JSON format
EXPLAIN FORMAT=JSON SELECT * FROM users WHERE username = 'john';

-- Actual execution statistics (MySQL 8.0+)
EXPLAIN ANALYZE SELECT * FROM users WHERE username = 'john';
```

**EXPLAIN Output Columns Explained:**

| Column | Description |
|--------|-------------|
| id | Query identifier; same id executes top-to-bottom, different ids execute largest first |
| select_type | Query type: SIMPLE, PRIMARY, SUBQUERY, DERIVED, etc. |
| table | Table being accessed |
| partitions | Matched partitions |
| type | Access type (important!): Best to worst: system > const > eq_ref > ref > range > index > ALL |
| possible_keys | Indexes that could be used |
| key | Index actually used |
| key_len | Length of index used |
| ref | Columns or constants compared to index |
| rows | Estimated rows to scan |
| filtered | Percentage of rows filtered by condition |
| Extra | Additional information |

### Understanding Access Types (type column)

```sql
-- system/const: Best - primary key or unique index equality lookup
EXPLAIN SELECT * FROM users WHERE id = 1;
-- type: const

-- eq_ref: JOIN using primary key or unique index
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.id;
-- users table type: eq_ref

-- ref: Non-unique index equality lookup
EXPLAIN SELECT * FROM orders WHERE user_id = 100;
-- type: ref

-- range: Index range scan
EXPLAIN SELECT * FROM orders WHERE created_at > '2024-01-01';
-- type: range

-- index: Full index scan
EXPLAIN SELECT id FROM users;
-- type: index

-- ALL: Full table scan (needs optimization!)
EXPLAIN SELECT * FROM users WHERE email LIKE '%@gmail.com';
-- type: ALL
```

### Important Extra Column Information

```sql
-- Using index: Using covering index, no table lookup needed
EXPLAIN SELECT id, username FROM users WHERE username = 'john';

-- Using where: Storage engine returns records, MySQL server layer filters further
EXPLAIN SELECT * FROM users WHERE age > 18 AND status = 'active';

-- Using index condition: Using Index Condition Pushdown (ICP)
EXPLAIN SELECT * FROM users WHERE age > 18 AND username LIKE 'john%';

-- Using temporary: Using temporary table (needs attention)
EXPLAIN SELECT DISTINCT username FROM users;

-- Using filesort: Using file sort (needs optimization)
EXPLAIN SELECT * FROM users ORDER BY created_at;

-- Using join buffer: Using join buffer
EXPLAIN SELECT * FROM orders o, users u WHERE o.user_id = u.id;
```

### Practical Analysis Example

```sql
-- Complex query analysis
EXPLAIN
SELECT
    u.username,
    COUNT(o.id) AS order_count,
    SUM(o.amount) AS total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
    AND u.status = 'active'
GROUP BY u.id
HAVING order_count > 5
ORDER BY total_amount DESC
LIMIT 10;

-- Optimization suggestions:
-- 1. Create composite index on users.created_at and users.status
CREATE INDEX idx_users_status_created ON users(status, created_at);

-- 2. Create index on orders.user_id
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 3. Consider covering index for orders table query
CREATE INDEX idx_orders_cover ON orders(user_id, amount);
```

---

## Slow Query Analysis and Optimization

### Enabling Slow Query Log

```sql
-- View slow query configuration
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- Dynamically enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL long_query_time = 1;  -- Log queries over 1 second
SET GLOBAL log_queries_not_using_indexes = 'ON';  -- Log queries not using indexes

-- Permanent configuration in config file /etc/my.cnf
-- [mysqld]
-- slow_query_log = 1
-- slow_query_log_file = /var/log/mysql/slow.log
-- long_query_time = 1
-- log_queries_not_using_indexes = 1
```

### Using mysqldumpslow for Analysis

```bash
# View total slow query count
mysqldumpslow -s c /var/log/mysql/slow.log

# Sort by execution time, show top 10
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log

# Sort by average execution time
mysqldumpslow -s at -t 10 /var/log/mysql/slow.log

# Sort by query count
mysqldumpslow -s c -t 10 /var/log/mysql/slow.log
```

### Using pt-query-digest for Analysis

```bash
# Install Percona Toolkit
apt-get install percona-toolkit

# Analyze slow query log
pt-query-digest /var/log/mysql/slow.log

# Generate detailed report
pt-query-digest --report-format=profile /var/log/mysql/slow.log > slow_report.txt

# Compare slow queries between two time periods
pt-query-digest slow_before.log --review h=localhost,D=review,t=queries \
    --history h=localhost,D=review,t=history
```

### Real-time Slow Query Monitoring

```sql
-- View currently executing queries
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- View queries running longer than specified seconds
SELECT * FROM information_schema.PROCESSLIST
WHERE COMMAND != 'Sleep' AND TIME > 10;

-- Use Performance Schema for monitoring
SELECT
    DIGEST_TEXT,
    COUNT_STAR,
    AVG_TIMER_WAIT/1000000000000 AS avg_time_sec,
    SUM_ROWS_EXAMINED,
    SUM_ROWS_SENT
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;
```

---

## Lock Mechanisms and Concurrency Control

### InnoDB Lock Types

```sql
-- 1. Shared Lock (S Lock) - Read Lock
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE;
-- MySQL 8.0+ new syntax
SELECT * FROM users WHERE id = 1 FOR SHARE;

-- 2. Exclusive Lock (X Lock) - Write Lock
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- 3. Intention Locks (Table-level)
-- IS (Intention Shared) and IX (Intention Exclusive) are added automatically

-- 4. View current lock waits
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
-- MySQL 8.0+
SELECT * FROM performance_schema.data_lock_waits;
```

### Row Lock Implementation Principles

InnoDB row locks are implemented by locking index entries:

```sql
-- Record Lock: Locks a single index record
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- Gap Lock: Locks the gap between index records, prevents phantom reads
-- Assuming age index has values: 10, 20, 30
SELECT * FROM users WHERE age = 15 FOR UPDATE;
-- Locks the gap (10, 20)

-- Next-Key Lock: Record lock + Gap lock
-- Default locking strategy, locks record and gap before it
SELECT * FROM users WHERE age >= 20 FOR UPDATE;
-- Locks range [20, +infinity)
```

### Deadlock Detection and Handling

```sql
-- View deadlock log
SHOW ENGINE INNODB STATUS\G

-- Configure deadlock detection
SHOW VARIABLES LIKE 'innodb_deadlock_detect';
SET GLOBAL innodb_deadlock_detect = ON;

-- Set lock wait timeout
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';
SET GLOBAL innodb_lock_wait_timeout = 50;  -- Default 50 seconds
```

**Best Practices for Avoiding Deadlocks:**

```sql
-- 1. Maintain consistent lock ordering
-- Bad approach
-- Transaction 1: UPDATE accounts SET balance = balance - 100 WHERE id = 1;
--               UPDATE accounts SET balance = balance + 100 WHERE id = 2;
-- Transaction 2: UPDATE accounts SET balance = balance - 100 WHERE id = 2;
--               UPDATE accounts SET balance = balance + 100 WHERE id = 1;

-- Good approach: Lock in ID order
-- Both transactions update ID=1 first, then ID=2

-- 2. Use proper indexes to reduce lock scope
-- Ensure WHERE conditions use indexes, avoid full table scans causing table locks

-- 3. Minimize transaction duration
-- Move non-database operations outside transactions

-- 4. Process batch operations in chunks
-- Not recommended: Update large amount of data at once
UPDATE orders SET status = 'expired' WHERE created_at < '2020-01-01';

-- Recommended: Update in batches
DELIMITER //
CREATE PROCEDURE batch_update_orders()
BEGIN
    DECLARE affected_rows INT DEFAULT 1;
    WHILE affected_rows > 0 DO
        UPDATE orders
        SET status = 'expired'
        WHERE created_at < '2020-01-01' AND status != 'expired'
        LIMIT 1000;
        SET affected_rows = ROW_COUNT();
        -- Sleep briefly to reduce lock contention
        DO SLEEP(0.1);
    END WHILE;
END //
DELIMITER ;
```

### Transaction Isolation Levels

```sql
-- Check current isolation level
SELECT @@transaction_isolation;  -- MySQL 8.0+
SELECT @@tx_isolation;           -- MySQL 5.7

-- Set isolation level
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Isolation level descriptions
-- READ UNCOMMITTED: Can read uncommitted data, allows dirty reads
-- READ COMMITTED: Only reads committed data, prevents dirty reads
-- REPEATABLE READ: Repeatable reads (MySQL default), uses MVCC + gap locks to prevent phantom reads
-- SERIALIZABLE: Serializable, highest isolation level, worst performance
```

---

## Database Sharding

### Sharding Strategies

When single table data exceeds tens of millions of rows or single database connections are insufficient, consider sharding:

```
Sharding Strategies:

1. Vertical Database Partitioning: Split by business module
   User Database    -> users, user_profiles, user_settings
   Order Database   -> orders, order_items, payments
   Product Database -> products, categories, inventory

2. Vertical Table Partitioning: Split by column (hot/cold data separation)
   users_basic  -> id, username, email, phone
   users_detail -> user_id, address, bio, avatar

3. Horizontal Database Partitioning: Same structure databases, data distributed by rule
   db_0: orders (user_id % 4 = 0)
   db_1: orders (user_id % 4 = 1)
   db_2: orders (user_id % 4 = 2)
   db_3: orders (user_id % 4 = 3)

4. Horizontal Table Partitioning: Split tables by rule within same database
   orders_0, orders_1, orders_2, orders_3
```

### Shard Key Selection

```sql
-- Common sharding strategies

-- 1. Hash Sharding
-- Routing rule: table_index = hash(user_id) % table_count
-- Pros: Even data distribution
-- Cons: Difficult to scale, requires data migration

-- 2. Range Sharding
-- Routing rule:
--   table_0: id 1-1000000
--   table_1: id 1000001-2000000
-- Pros: Easy to scale
-- Cons: Potential hotspot issues

-- 3. Time-based Sharding
-- Routing rule: table_name = orders_2024_01, orders_2024_02
-- Pros: Easy to archive historical data
-- Cons: Recent data may be hotspots

-- 4. Consistent Hashing
-- Solves scaling problems with hash sharding
-- Uses virtual nodes for even distribution
```

### ShardingSphere Implementation

```yaml
# ShardingSphere-JDBC configuration example
dataSources:
  ds_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3306/db_0?serverTimezone=UTC
    username: root
    password: root
  ds_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3306/db_1?serverTimezone=UTC
    username: root
    password: root

rules:
  - !SHARDING
    tables:
      orders:
        actualDataNodes: ds_${0..1}.orders_${0..3}
        tableStrategy:
          standard:
            shardingColumn: order_id
            shardingAlgorithmName: orders_inline
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: database_inline
    shardingAlgorithms:
      database_inline:
        type: INLINE
        props:
          algorithm-expression: ds_${user_id % 2}
      orders_inline:
        type: INLINE
        props:
          algorithm-expression: orders_${order_id % 4}
```

### Distributed ID Generation

```sql
-- Snowflake Algorithm Structure
-- 64 bits = 1 sign bit + 41 timestamp bits + 10 machine ID bits + 12 sequence bits

-- 1. Database Auto-Increment ID (not recommended for distributed systems)
-- Problem: IDs will duplicate across shards

-- 2. Segment Mode
CREATE TABLE id_generator (
    biz_type VARCHAR(50) PRIMARY KEY,
    max_id BIGINT NOT NULL,
    step INT NOT NULL DEFAULT 1000,
    version INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Get ID segment
UPDATE id_generator
SET max_id = max_id + step, version = version + 1
WHERE biz_type = 'order' AND version = #{version};

-- 3. Redis INCR
-- INCR order:id

-- 4. UUID (not recommended as primary key, poor index efficiency)
SELECT UUID();  -- 36 characters
SELECT REPLACE(UUID(), '-', '');  -- 32 characters
```

---

## Read-Write Separation

### Read-Write Separation Architecture

```
                    +-------------------+
                    |    Application    |
                    +---------+---------+
                              |
                    +---------v---------+
                    |   Proxy/Driver    |  (ShardingSphere/MyCat/ProxySQL)
                    +---------+---------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
       +------------+   +------------+   +------------+
       |   Master   |   |   Slave1   |   |   Slave2   |
       |   (Write)  |-->|   (Read)   |   |   (Read)   |
       +------------+   +------------+   +------------+
              |               ^               ^
              +---------------+---------------+
                      Replication
```

### MySQL Master-Replica Configuration

```sql
-- Master configuration (/etc/my.cnf)
-- [mysqld]
-- server-id = 1
-- log-bin = mysql-bin
-- binlog-format = ROW
-- sync_binlog = 1
-- gtid_mode = ON
-- enforce_gtid_consistency = ON

-- Create replication user
CREATE USER 'repl'@'%' IDENTIFIED BY 'replication_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- View Master status
SHOW MASTER STATUS;

-- Replica configuration (/etc/my.cnf)
-- [mysqld]
-- server-id = 2
-- relay-log = relay-bin
-- read_only = 1
-- gtid_mode = ON
-- enforce_gtid_consistency = ON

-- Configure replication on Replica
CHANGE MASTER TO
    MASTER_HOST = 'master_host',
    MASTER_USER = 'repl',
    MASTER_PASSWORD = 'replication_password',
    MASTER_AUTO_POSITION = 1;  -- Use GTID

-- Start replication
START SLAVE;

-- View replication status
SHOW SLAVE STATUS\G
```

### Handling Replication Lag

```sql
-- Monitor replication lag
SHOW SLAVE STATUS\G
-- Look at Seconds_Behind_Master field

-- Use pt-heartbeat to monitor lag
-- Run on Master
pt-heartbeat -D test --create-table --update --daemonize

-- Run on Replica
pt-heartbeat -D test --monitor

-- Solutions for replication lag:

-- 1. Force queries to master (critical business)
-- Mark queries that need to go to master at application layer

-- 2. Wait for GTID sync
-- MySQL 5.7+
SELECT WAIT_FOR_EXECUTED_GTID_SET('gtid_set', timeout);

-- 3. Semi-synchronous replication
-- Master configuration
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 10000;  -- 10 seconds

-- Replica configuration
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';
SET GLOBAL rpl_semi_sync_slave_enabled = 1;
```

### Read-Write Splitting Middleware Configuration

```yaml
# ShardingSphere read-write splitting configuration
dataSources:
  master:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://master:3306/mydb
    username: root
    password: root
  slave_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://slave1:3306/mydb
    username: root
    password: root
  slave_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://slave2:3306/mydb
    username: root
    password: root

rules:
  - !READWRITE_SPLITTING
    dataSources:
      readwrite_ds:
        writeDataSourceName: master
        readDataSourceNames:
          - slave_0
          - slave_1
        loadBalancerName: round_robin
    loadBalancers:
      round_robin:
        type: ROUND_ROBIN
```

---

## Monitoring and Diagnostic Tools

### Performance Schema

```sql
-- Enable Performance Schema
-- Configure in my.cnf
-- performance_schema = ON

-- View configured instruments
SELECT * FROM performance_schema.setup_instruments
WHERE NAME LIKE '%statement%';

-- Enable statement monitoring
UPDATE performance_schema.setup_instruments
SET ENABLED = 'YES', TIMED = 'YES'
WHERE NAME LIKE 'statement/%';

-- View most time-consuming SQL
SELECT
    DIGEST_TEXT AS sql_text,
    COUNT_STAR AS exec_count,
    SUM_TIMER_WAIT/1000000000000 AS total_time_sec,
    AVG_TIMER_WAIT/1000000000000 AS avg_time_sec,
    SUM_ROWS_EXAMINED AS rows_examined,
    SUM_ROWS_SENT AS rows_sent
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- View table I/O statistics
SELECT
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ,
    COUNT_WRITE,
    SUM_TIMER_READ/1000000000 AS read_ms,
    SUM_TIMER_WRITE/1000000000 AS write_ms
FROM performance_schema.table_io_waits_summary_by_table
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- View index usage
SELECT
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME,
    COUNT_READ,
    COUNT_WRITE
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NOT NULL
ORDER BY COUNT_READ DESC
LIMIT 20;
```

### sys Schema Diagnostics

```sql
-- MySQL 5.7+ includes sys schema

-- View unused indexes
SELECT * FROM sys.schema_unused_indexes;

-- View redundant indexes
SELECT * FROM sys.schema_redundant_indexes;

-- View wait events
SELECT * FROM sys.wait_classes_global_by_avg_latency;

-- View most resource-consuming SQL
SELECT * FROM sys.statements_with_runtimes_in_95th_percentile;

-- View statements with full table scans
SELECT * FROM sys.statements_with_full_table_scans;

-- View statements using temporary tables
SELECT * FROM sys.statements_with_temp_tables;

-- View tables with most I/O
SELECT * FROM sys.io_global_by_file_by_bytes LIMIT 10;

-- View memory usage
SELECT * FROM sys.memory_global_by_current_bytes;

-- View user statistics
SELECT * FROM sys.user_summary;
```

### Common Monitoring Commands

```sql
-- View server status
SHOW GLOBAL STATUS;

-- Important status variables
SHOW GLOBAL STATUS LIKE 'Threads_%';
SHOW GLOBAL STATUS LIKE 'Connections';
SHOW GLOBAL STATUS LIKE 'Queries';
SHOW GLOBAL STATUS LIKE 'Slow_queries';
SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_%';
SHOW GLOBAL STATUS LIKE 'Handler_%';

-- View connection count
SHOW STATUS LIKE 'Max_used_connections';
SHOW VARIABLES LIKE 'max_connections';

-- QPS and TPS calculation
-- QPS = Queries / Uptime
-- TPS = (Com_commit + Com_rollback) / Uptime

-- View table sizes
SELECT
    table_schema AS 'Database',
    table_name AS 'Table',
    ROUND(data_length / 1024 / 1024, 2) AS 'Data Size (MB)',
    ROUND(index_length / 1024 / 1024, 2) AS 'Index Size (MB)',
    ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Total Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'your_database'
ORDER BY (data_length + index_length) DESC
LIMIT 10;
```

### Prometheus + Grafana Monitoring

```yaml
# mysqld_exporter configuration
# docker-compose.yml
version: '3'
services:
  mysqld-exporter:
    image: prom/mysqld-exporter
    ports:
      - "9104:9104"
    environment:
      - DATA_SOURCE_NAME=exporter:password@(mysql:3306)/
    depends_on:
      - mysql
```

```sql
-- Create monitoring user
CREATE USER 'exporter'@'%' IDENTIFIED BY 'password';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
```

---

## Interview Key Points

### Frequently Asked Questions

**1. MySQL Index Questions**

```markdown
Q: Why does MySQL use B+ trees instead of B-trees or hash indexes?

A:
- B+ tree leaf nodes are connected via linked list, supporting efficient range queries
- B+ tree non-leaf nodes don't store data, so each node can hold more keys, making the tree shallower
- B+ tree queries are stable; all queries reach leaf nodes
- Hash indexes don't support range queries and sorting

Q: When does an index become ineffective?

A:
- Using functions or expressions on indexed columns
- Implicit type conversions
- LIKE patterns starting with %
- OR conditions with non-indexed columns
- Violating the leftmost prefix rule
- Optimizer determines full table scan is faster
```

**2. Transactions and Locks**

```markdown
Q: How does MySQL solve the phantom read problem?

A:
- At REPEATABLE READ level, InnoDB uses MVCC + gap locks to prevent phantom reads
- MVCC ensures consistent snapshot reads through Read View
- Gap locks prevent other transactions from inserting new records in locked ranges

Q: When do row locks escalate to table locks?

A:
- Update conditions don't use indexes, causing full table scans
- Indexed columns undergo implicit type conversion
- DDL operations on the table
```

**3. Master-Replica Replication**

```markdown
Q: What is the principle behind MySQL replication?

A:
1. Master writes data changes to binlog
2. Replica's I/O thread reads Master's binlog and writes to local relay log
3. Replica's SQL thread replays events from relay log

Q: How to handle replication lag?

A:
- Use parallel replication (MySQL 5.7+)
- Force critical business queries to master
- Use semi-synchronous replication to ensure data consistency
- Implement GTID waiting mechanism at application layer
```

**4. Sharding**

```markdown
Q: How to perform cross-shard JOINs after sharding?

A:
- Avoid cross-shard JOINs whenever possible; use data redundancy
- Use global/broadcast tables for small, frequently-joined tables
- Assemble data at application layer
- Use distributed database middleware support

Q: How to ensure globally unique IDs after sharding?

A:
- Snowflake algorithm
- Segment mode (database segment + local cache)
- Redis INCR
- UUID (not recommended as primary key)
```

### Performance Optimization Checklist

```markdown
## SQL Optimization Checklist
- [ ] Is SELECT * being used?
- [ ] Can WHERE conditions use indexes?
- [ ] Do JOIN operations have proper indexes?
- [ ] Are there deep pagination issues?
- [ ] Are there unnecessary subqueries?
- [ ] Can ORDER BY utilize indexes?

## Index Optimization Checklist
- [ ] Are there redundant indexes?
- [ ] Are there unused indexes?
- [ ] Is composite index column order optimal?
- [ ] Is index selectivity sufficient?
- [ ] Have covering indexes been considered?

## Architecture Optimization Checklist
- [ ] Is read-write separation needed?
- [ ] Is sharding needed?
- [ ] Is caching strategy appropriate?
- [ ] Is connection pool configuration optimal?
- [ ] Is there slow query monitoring?
```

### Recommended Configuration Parameters

```ini
# my.cnf recommended configuration

[mysqld]
# Basic configuration
max_connections = 500
max_connect_errors = 1000
wait_timeout = 600
interactive_timeout = 600

# InnoDB configuration
innodb_buffer_pool_size = 8G          # 70-80% of physical memory
innodb_buffer_pool_instances = 8       # Buffer pool instances
innodb_log_file_size = 1G             # Redo Log file size
innodb_log_buffer_size = 64M          # Log buffer size
innodb_flush_log_at_trx_commit = 1    # Flush to disk on commit
innodb_flush_method = O_DIRECT        # Flush method

# Query cache (removed in MySQL 8.0)
# query_cache_type = 0
# query_cache_size = 0

# Logging configuration
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = 1

# Replication configuration
server_id = 1
log_bin = mysql-bin
binlog_format = ROW
sync_binlog = 1
gtid_mode = ON
enforce_gtid_consistency = ON
```

---

## Conclusion

MySQL performance optimization is a systematic discipline that requires consideration from multiple dimensions:

1. **SQL Level**: Write efficient SQL and avoid common performance pitfalls
2. **Index Level**: Design indexes wisely and use covering indexes to reduce table lookups
3. **Architecture Level**: Implement read-write separation and sharding for high-concurrency scenarios
4. **Configuration Level**: Configure MySQL parameters appropriately based on hardware resources
5. **Monitoring Level**: Build comprehensive monitoring systems to detect performance issues promptly

There is no silver bullet for performance optimization. You need to select appropriate optimization strategies based on specific business scenarios and data characteristics. Make sure to thoroughly test and validate optimization solutions before deployment to ensure their effectiveness and stability.

With these MySQL optimization techniques, you can build more efficient and stable database applications and confidently handle various database performance challenges in both interviews and real-world projects.

---

## Further Reading

### Official Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Performance Blog](https://www.percona.com/blog/)
- [MySQL Internals Manual](https://dev.mysql.com/doc/internals/en/)

### Recommended Books

- *High Performance MySQL* by Baron Schwartz, Peter Zaitsev, Vadim Tkachenko
- *MySQL 8 Query Performance Tuning* by Jesper Wisborg Krogh
- *Database Internals* by Alex Petrov

### Related Tools

- **pt-query-digest**: Percona Toolkit query analyzer
- **MySQLTuner**: Database configuration optimization script
- **Percona Monitoring and Management (PMM)**: Comprehensive MySQL monitoring
- **MySQL Workbench**: Official GUI management tool
- **mysqldumpslow**: Slow query log analyzer
- **sysbench**: Database benchmarking tool
