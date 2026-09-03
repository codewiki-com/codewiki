---
title: Database Design Complete Guide
description: Master database design for efficient data storage
track: backend
section: databases
difficulty: intermediate
tags:
  - Database Design
  - Normalization
  - ER Diagram
  - Data Modeling
status: imported
origin: old/src/content/docs/architecture/database-design.en.md
divergence: 0.214
issues: []
legacy:
  category: Architecture
  subcategory: Database
  order: 13
  lastUpdated: 2026-01-07
---

Database design is one of the most critical aspects of software development. A well-designed database stores and retrieves data efficiently while ensuring data consistency, integrity, and scalability. We'll take a deep dive into the core principles, methodologies, and best practices in database design.

## What is Database Design

Database design is the process of defining the logical and physical structure of a database based on business requirements. It involves:

- **Conceptual Design**: Describing business entities and their relationships using ER diagrams
- **Logical Design**: Converting the conceptual model into a relational model and applying normalization
- **Physical Design**: Determining storage structures, indexing strategies, and partitioning schemes
- **Implementation and Optimization**: Creating database objects and performing performance tuning

The quality of database design directly impacts system performance, maintainability, and scalability. A well-designed database can support a system for many years, while a poorly designed one becomes a heavy burden for system evolution.

## Database Design Process

### Complete Design Workflow

```
+-------------------------------------------------------------+
|                   Database Design Workflow                    |
+-------------------------------------------------------------+
|                                                               |
|  +------------+   +------------+   +------------+   +--------+|
|  | Requirement|-->| Conceptual |-->|  Logical   |-->|Physical||
|  |  Analysis  |   |   Design   |   |   Design   |   | Design ||
|  +------------+   +------------+   +------------+   +--------+|
|       |               |               |               |       |
|       v               v               v               v       |
|  +------------+   +------------+   +------------+   +--------+|
|  |  Business  |   |  ER        |   | Relational |   |  DDL   ||
|  |  Diagrams  |   |  Diagrams  |   |  Schemas   |   |Scripts ||
|  |Data Diction|   |Concept Model|  |Normalization|  |Indexes ||
|  +------------+   +------------+   +------------+   +--------+|
|                                                               |
+-------------------------------------------------------------+
```

### Step 1: Requirement Analysis

Requirement analysis is the starting point of database design, requiring thorough understanding of business needs:

**Functional Requirements**:
- What data does the system need to store?
- What relationships exist between data?
- What query operations need to be supported?
- What is the frequency of insert, update, and delete operations?

**Non-Functional Requirements**:
- Estimated data volume (current and future growth)
- Concurrent access volume
- Response time requirements
- Data retention policies

```typescript
// Requirement Analysis Example: E-commerce System
interface RequirementAnalysis {
  // Core entities
  entities: {
    users: {
      estimatedRecords: 1000000,
      growthRate: '10% per month',
      accessPattern: 'read-heavy'
    },
    orders: {
      estimatedRecords: 5000000,
      growthRate: '20% per month',
      accessPattern: 'write-heavy initially, then read-heavy'
    },
    products: {
      estimatedRecords: 100000,
      growthRate: '5% per month',
      accessPattern: 'read-heavy'
    }
  },

  // Critical queries
  criticalQueries: [
    'Retrieve order list by user ID',
    'Calculate sales within a date range',
    'Find bestselling products by category',
    'User login verification'
  ],

  // Performance requirements
  performance: {
    readLatency: 'P99 < 50ms',
    writeLatency: 'P99 < 100ms',
    availability: '99.9%'
  }
}
```

### Step 2: Conceptual Design

The conceptual design phase uses ER diagrams (Entity-Relationship diagrams) to describe the data model:

```
+-------------------------------------------------------------+
|                   E-commerce System ER Diagram                |
+-------------------------------------------------------------+
|                                                               |
|  +----------+      places      +----------+                   |
|  |   User   |----------------->|  Order   |                   |
|  |----------|   1         *    |----------|                   |
|  | id (PK)  |                  | id (PK)  |                   |
|  | username |                  | user_id  |                   |
|  | email    |                  | total    |                   |
|  | password |                  | status   |                   |
|  | created  |                  | created  |                   |
|  +----------+                  +----------+                   |
|                                     |                         |
|                                     | contains                |
|                                     | 1                       |
|                                     v *                       |
|  +----------+     belongs     +--------------+                |
|  | Category |<----------------|  OrderItem   |                |
|  |----------|   1         *   |--------------|                |
|  | id (PK)  |                 | id (PK)      |                |
|  | name     |                 | order_id     |                |
|  | parent_id|                 | product_id   |                |
|  +----------+                 | quantity     |                |
|       |                       | price        |                |
|       | has                   +--------------+                |
|       | 1                           |                         |
|       v *                           | references              |
|  +----------+                       | *                       |
|  | Product  |<----------------------+ 1                       |
|  |----------|                                                 |
|  | id (PK)  |                                                 |
|  | name     |                                                 |
|  | price    |                                                 |
|  | stock    |                                                 |
|  | cat_id   |                                                 |
|  +----------+                                                 |
|                                                               |
+-------------------------------------------------------------+
```

### Step 3: Logical Design

Convert the ER diagram into relational schemas and apply normalization:

```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Product categories table (supporting hierarchical structure)
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT NULL,
    level INT NOT NULL DEFAULT 0,
    path VARCHAR(255) NOT NULL DEFAULT '',
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_parent (parent_id),
    INDEX idx_path (path)
);

-- Products table
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    category_id BIGINT NOT NULL,
    status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    FULLTEXT INDEX idx_name_desc (name, description)
);

-- Orders table
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- Order items table
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);
```

### Step 4: Physical Design

Physical design focuses on storage efficiency and access performance:

```sql
-- Table partitioning example: Partition orders table by time
CREATE TABLE orders_partitioned (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_no VARCHAR(32) NOT NULL,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at),
    UNIQUE KEY uk_order_no (order_no, created_at),
    KEY idx_user (user_id, created_at)
)
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p2023q1 VALUES LESS THAN (UNIX_TIMESTAMP('2023-04-01')),
    PARTITION p2023q2 VALUES LESS THAN (UNIX_TIMESTAMP('2023-07-01')),
    PARTITION p2023q3 VALUES LESS THAN (UNIX_TIMESTAMP('2023-10-01')),
    PARTITION p2023q4 VALUES LESS THAN (UNIX_TIMESTAMP('2024-01-01')),
    PARTITION p2024q1 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01')),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

## Database Normalization Explained

Database normalization is the standard for evaluating the quality of relational schema design. The purpose of normalization is to eliminate data redundancy and avoid insertion, update, and deletion anomalies.

### First Normal Form (1NF)

**Definition**: Every attribute in a relation must be atomic (indivisible).

**Violating 1NF Example**:

```
// Incorrect design: Contact field contains multiple values
+----------+-----------------------------+
| User ID  |       Contact Info          |
+----------+-----------------------------+
|    1     | 138xxx, 139xxx, xxx@qq.com  |
|    2     | 137xxx, yyy@gmail.com       |
+----------+-----------------------------+
```

**1NF Compliant Design**:

```sql
-- Option 1: Split into multiple columns
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(100)
);

-- Option 2: Use a related table (more flexible)
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE user_contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    contact_type ENUM('phone', 'email', 'wechat') NOT NULL,
    contact_value VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_type_value (user_id, contact_type, contact_value)
);
```

### Second Normal Form (2NF)

**Definition**: Must be in 1NF, and all non-key attributes must be fully functionally dependent on the entire candidate key (eliminate partial dependencies).

**Violating 2NF Example**:

```
// Incorrect design: Student enrollment table has partial dependencies
+------------+------------+-------------+-------------+----------+
| Student ID | Course ID  | Student Name| Course Name |  Grade   |
+------------+------------+-------------+-------------+----------+
|     1      |    101     |    John     |  Database   |    85    |
|     1      |    102     |    John     |     OS      |    90    |
|     2      |    101     |    Mary     |  Database   |    78    |
+------------+------------+-------------+-------------+----------+

Analysis:
- Primary Key: (Student ID, Course ID)
- Student Name depends only on Student ID (partial dependency)
- Course Name depends only on Course ID (partial dependency)
- Grade depends on (Student ID, Course ID) (full dependency)
```

**2NF Compliant Design**:

```sql
-- Students table
CREATE TABLE students (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Courses table
CREATE TABLE courses (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Enrollments table (only keeps attributes fully dependent on primary key)
CREATE TABLE enrollments (
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    score DECIMAL(5, 2),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

### Third Normal Form (3NF)

**Definition**: Must be in 2NF, and no non-key attribute can be transitively dependent on the candidate key (eliminate transitive dependencies).

**Violating 3NF Example**:

```
// Incorrect design: Employee table has transitive dependencies
+-------------+---------------+------------+--------------+--------------+
| Employee ID | Employee Name | Dept ID    | Dept Name    | Dept Manager |
+-------------+---------------+------------+--------------+--------------+
|      1      |     John      |     10     |   R&D        |    Alice     |
|      2      |     Mary      |     10     |   R&D        |    Alice     |
|      3      |     Bob       |     20     |   Marketing  |    Charlie   |
+-------------+---------------+------------+--------------+--------------+

Analysis:
- Primary Key: Employee ID
- Employee ID -> Dept ID -> Dept Name (transitive dependency)
- Employee ID -> Dept ID -> Dept Manager (transitive dependency)
```

**3NF Compliant Design**:

```sql
-- Departments table
CREATE TABLE departments (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(50)
);

-- Employees table
CREATE TABLE employees (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department_id BIGINT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

### Boyce-Codd Normal Form (BCNF)

**Definition**: Must be in 3NF, and every determinant must be a candidate key.

**Violating BCNF Example**:

```
// Scenario: A student can take multiple courses, each course has multiple teachers,
// but each teacher only teaches one course, and a student can only have one teacher per course

+------------+------------+------------+
| Student ID | Course ID  | Teacher ID |
+------------+------------+------------+
|     1      |    Math    |     T1     |
|     1      |   Physics  |     T2     |
|     2      |    Math    |     T1     |
+------------+------------+------------+

Analysis:
- Candidate Keys: (Student ID, Course ID) or (Student ID, Teacher ID)
- Functional Dependency: Teacher ID -> Course ID
- Teacher ID is not a candidate key, but it determines Course ID, violating BCNF
```

**BCNF Compliant Design**:

```sql
-- Teacher-Course relationship table
CREATE TABLE teacher_courses (
    teacher_id BIGINT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Student enrollment table
CREATE TABLE student_teachers (
    student_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    PRIMARY KEY (student_id, teacher_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (teacher_id) REFERENCES teacher_courses(teacher_id)
);
```

### Normalization Summary

```
+-------------------------------------------------------------+
|                   Normal Form Hierarchy                       |
+-------------------------------------------------------------+
|                                                               |
|  +-------------------------------------------------------+   |
|  |                         BCNF                           |   |
|  |  +---------------------------------------------------+ |   |
|  |  |                        3NF                         | |   |
|  |  |  +-----------------------------------------------+ | |   |
|  |  |  |                      2NF                       | | |   |
|  |  |  |  +-----------------------------------------+  | | |   |
|  |  |  |  |                    1NF                   |  | | |   |
|  |  |  |  |          Atomic attributes               |  | | |   |
|  |  |  |  +-----------------------------------------+  | | |   |
|  |  |  |        Eliminate partial dependencies         | | |   |
|  |  |  +-----------------------------------------------+ | |   |
|  |  |          Eliminate transitive dependencies         | |   |
|  |  +---------------------------------------------------+ |   |
|  |        Every determinant is a candidate key            |   |
|  +-------------------------------------------------------+   |
|                                                               |
+-------------------------------------------------------------+
```

## Denormalization Design

While normalization eliminates data redundancy, practical applications sometimes require appropriate denormalization to improve query performance.

### When to Denormalize

1. **Query Performance Priority**: Frequent multi-table JOINs impact performance
2. **Read-Heavy Workloads**: Data updates are infrequent
3. **Relaxed Consistency Requirements**: Short-term data inconsistency is acceptable

### Common Denormalization Techniques

#### Redundant Columns

```sql
-- Normalized design: Requires JOIN to get username
CREATE TABLE orders_normalized (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12, 2)
);

-- Query order list requires JOIN
SELECT o.id, o.total_amount, u.username
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > '2024-01-01';

-- Denormalized design: Redundantly store username
CREATE TABLE orders_denormalized (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,  -- Redundant field
    total_amount DECIMAL(12, 2)
);

-- Query order list without JOIN
SELECT id, total_amount, username
FROM orders_denormalized
WHERE created_at > '2024-01-01';
```

#### Derived Columns

```sql
-- Normalized design: Order total needs calculation
CREATE TABLE orders (
    id BIGINT PRIMARY KEY
    -- total_amount not stored, calculated on each query
);

SELECT o.id, SUM(oi.quantity * oi.unit_price) as total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Denormalized design: Store derived values
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    total_amount DECIMAL(12, 2) NOT NULL,  -- Derived field
    item_count INT NOT NULL DEFAULT 0       -- Derived field
);

-- Maintain derived values using triggers or application layer
DELIMITER //
CREATE TRIGGER update_order_total
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT SUM(quantity * unit_price)
        FROM order_items
        WHERE order_id = NEW.order_id
    ),
    item_count = (
        SELECT COUNT(*)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
END //
DELIMITER ;
```

#### Summary Tables

```sql
-- Daily sales summary table
CREATE TABLE sales_daily_summary (
    date DATE PRIMARY KEY,
    total_orders INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    avg_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    new_customers INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
);

-- Scheduled job to update summary data
INSERT INTO sales_daily_summary (date, total_orders, total_amount, avg_order_amount)
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as avg_order_amount
FROM orders
WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY
ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    total_amount = VALUES(total_amount),
    avg_order_amount = VALUES(avg_order_amount);
```

### Denormalization Trade-offs

```typescript
interface DenormalizationTradeoff {
  pros: [
    'Reduces JOIN operations, improves query performance',
    'Simplifies query statements',
    'Reduces database load'
  ],
  cons: [
    'Data redundancy increases storage costs',
    'Update operations become more complex',
    'Data inconsistency may occur',
    'Maintenance costs increase'
  ],
  bestPractices: [
    'Maintain data consistency at application layer or through triggers',
    'Use transactions to ensure atomic updates',
    'Regularly validate and repair data',
    'Document redundant fields and their maintenance logic'
  ]
}
```

## Primary Key and Foreign Key Design

### Primary Key Design Strategies

#### Auto-Increment Primary Key

```sql
-- Auto-increment primary key: Simple and efficient
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL
);

-- Pros: Ordered, compact, good performance
-- Cons: Difficult to ensure uniqueness in distributed environments, predictable
```

#### UUID

```sql
-- UUID primary key
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,  -- Or use BINARY(16) for storage
    username VARCHAR(50) NOT NULL
);

-- Generated at application layer
-- Pros: Globally unique, unpredictable
-- Cons: Large storage space, unordered leading to poor index performance
```

#### Snowflake Algorithm

```typescript
/**
 * Snowflake Algorithm for generating distributed unique IDs
 * 64-bit structure: 1 bit sign + 41 bits timestamp + 10 bits machine ID + 12 bits sequence
 */
class SnowflakeIdGenerator {
  private readonly epoch = 1704067200000n; // 2024-01-01 00:00:00
  private readonly workerIdBits = 10n;
  private readonly sequenceBits = 12n;

  private readonly maxWorkerId = (1n << this.workerIdBits) - 1n;
  private readonly maxSequence = (1n << this.sequenceBits) - 1n;

  private readonly workerIdShift = this.sequenceBits;
  private readonly timestampShift = this.sequenceBits + this.workerIdBits;

  private workerId: bigint;
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(workerId: number) {
    if (workerId < 0 || BigInt(workerId) > this.maxWorkerId) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }
    this.workerId = BigInt(workerId);
  }

  nextId(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.maxSequence;
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return (
      ((timestamp - this.epoch) << this.timestampShift) |
      (this.workerId << this.workerIdShift) |
      this.sequence
    );
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }
}

// Usage example
const idGenerator = new SnowflakeIdGenerator(1);
const orderId = idGenerator.nextId();
console.log(orderId.toString()); // e.g., 1234567890123456789
```

```sql
-- Using Snowflake ID as primary key
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,  -- Generated by Snowflake algorithm
    order_no VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL
);
```

### Foreign Key Design

```sql
-- Foreign key constraints
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,

    -- Foreign key constraints
    CONSTRAINT fk_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

#### Foreign Key Strategy Selection

| Strategy | Description | Use Case |
|----------|-------------|----------|
| RESTRICT | Prevent deletion/update of parent record | Strong referential integrity |
| CASCADE | Cascade delete/update child records | Strong parent-child relationship |
| SET NULL | Set foreign key to NULL | Weak relationship |
| NO ACTION | Deferred check (at transaction end) | Complex transaction scenarios |

#### Should You Use Foreign Key Constraints?

```typescript
// Trade-offs of foreign key constraints
interface ForeignKeyConsideration {
  withConstraint: {
    pros: [
      'Database-level referential integrity guarantee',
      'Automatic cascade update/delete',
      'Clearer data model'
    ],
    cons: [
      'Impacts write performance (additional checks required)',
      'Batch operations restricted',
      'Cannot be used in cross-database scenarios'
    ]
  },
  withoutConstraint: {
    pros: [
      'Better write performance',
      'More flexible batch operations',
      'Supports database sharding'
    ],
    cons: [
      'Application layer must ensure integrity',
      'Orphaned data may occur',
      'Increased maintenance costs'
    ]
  }
}

// Practical recommendations
// - Use foreign key constraints for core business tables
// - Skip foreign keys for log and history tables
// - Use application-layer constraints in distributed systems
```

## Index Design Principles

### Index Types

```sql
-- 1. B+Tree Index (default)
CREATE INDEX idx_user_email ON users(email);

-- 2. Unique Index
CREATE UNIQUE INDEX uk_user_username ON users(username);

-- 3. Composite Index
CREATE INDEX idx_order_user_status ON orders(user_id, status, created_at);

-- 4. Full-text Index
CREATE FULLTEXT INDEX ft_product_name ON products(name, description);

-- 5. Prefix Index
CREATE INDEX idx_user_email_prefix ON users(email(20));

-- 6. Covering Index (implemented through composite index)
-- All queried columns are in the index, no table lookup needed
CREATE INDEX idx_covering ON orders(user_id, status, total_amount);
-- Efficiently executes: SELECT status, total_amount FROM orders WHERE user_id = 1;
```

### Leftmost Prefix Principle

```sql
-- Composite index (a, b, c)
CREATE INDEX idx_abc ON table_name(a, b, c);

-- Queries that can use the index:
WHERE a = 1                      -- Uses a
WHERE a = 1 AND b = 2            -- Uses a, b
WHERE a = 1 AND b = 2 AND c = 3  -- Uses a, b, c
WHERE a = 1 AND c = 3            -- Only uses a
WHERE a = 1 ORDER BY b           -- Uses a, sorting uses b

-- Queries that cannot use the index:
WHERE b = 2                      -- Does not satisfy leftmost prefix
WHERE b = 2 AND c = 3            -- Does not satisfy leftmost prefix
WHERE c = 3                      -- Does not satisfy leftmost prefix
```

### Index Design Best Practices

```sql
-- 1. Put high-cardinality columns first
-- Assume status has only 5 values, user_id has 1 million values
-- Recommended:
CREATE INDEX idx_user_status ON orders(user_id, status);
-- Not recommended:
CREATE INDEX idx_status_user ON orders(status, user_id);

-- 2. Cover common queries
-- Common query: SELECT id, status, total_amount FROM orders WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX idx_user_covering ON orders(user_id, created_at DESC, status, total_amount);

-- 3. Avoid redundant indexes
-- With (a, b, c), you don't need (a) and (a, b)
-- Redundant:
CREATE INDEX idx_a ON t(a);      -- Redundant
CREATE INDEX idx_ab ON t(a, b);  -- Redundant
CREATE INDEX idx_abc ON t(a, b, c);

-- 4. Use EXPLAIN to analyze queries
EXPLAIN SELECT * FROM orders WHERE user_id = 1 AND status = 'paid';
```

### Index Failure Scenarios

```sql
-- 1. Function or expression operations
WHERE YEAR(created_at) = 2024          -- Index not used
WHERE created_at >= '2024-01-01'       -- Index used

-- 2. Type conversion
WHERE user_id = '123'                  -- Implicit conversion, may not use index
WHERE user_id = 123                    -- Correct

-- 3. LIKE with leading wildcard
WHERE name LIKE '%test%'               -- Index not used
WHERE name LIKE 'test%'                -- Index used

-- 4. OR conditions (unless all conditions have indexes)
WHERE status = 1 OR type = 2           -- May not use index
WHERE status = 1 AND type = 2          -- Index used

-- 5. NOT conditions
WHERE status != 'deleted'              -- Usually doesn't use index
WHERE status IN ('active', 'pending')  -- Index used

-- 6. NULL checks
WHERE deleted_at IS NULL               -- Depends on database version and configuration
```

## SQL vs NoSQL Selection

### Comparative Analysis

```
+-------------------------------------------------------------+
|                     SQL vs NoSQL Comparison                   |
+-------------+------------------------+-----------------------+
|   Feature   |          SQL           |        NoSQL          |
+-------------+------------------------+-----------------------+
| Data Model  | Relational, tabular    | Document/KV/Column/Graph|
| Schema      | Fixed structure        | Flexible structure     |
| Scaling     | Primarily vertical     | Primarily horizontal   |
| Transactions| Full ACID support      | Limited (mostly BASE)  |
| Querying    | SQL, complex queries   | Simple queries mainly  |
| Consistency | Strong consistency     | Eventual consistency   |
| Examples    | MySQL/PostgreSQL       | MongoDB/Redis/Cassandra|
+-------------+------------------------+-----------------------+
```

### Selection Guide

```typescript
interface DatabaseSelectionGuide {
  useSQL: {
    scenarios: [
      'Complex transaction processing (banking, e-commerce orders)',
      'Complex data relationships requiring multi-table JOINs',
      'Strong consistency requirements',
      'Relatively fixed data structure',
      'Complex reporting and analytical queries'
    ],
    examples: ['User account systems', 'Order management systems', 'Inventory management']
  },

  useNoSQL: {
    scenarios: [
      'Massive data storage',
      'High concurrency read/write',
      'Frequently changing data structure',
      'Need for rapid horizontal scaling',
      'Simple key-value queries'
    ],
    examples: ['User behavior logs', 'Product catalogs', 'Real-time counters', 'Session storage']
  },

  hybridApproach: {
    pattern: 'SQL for primary data, NoSQL for auxiliary data',
    example: {
      MySQL: 'Core business data: users, orders, payments',
      Redis: 'Caching, sessions, leaderboards',
      MongoDB: 'Flexible structure data: product descriptions, user profiles',
      Elasticsearch: 'Search, log analysis'
    }
  }
}
```

### NoSQL Type Selection

```typescript
// Key-Value Database (Redis)
// Use cases: Caching, sessions, counters
interface KeyValueUseCase {
  example: `
    // User session storage
    SET session:user:123 '{"userId":123,"role":"admin"}'
    EXPIRE session:user:123 3600

    // Distributed lock
    SET lock:order:456 1 NX EX 30

    // Counter
    INCR page:view:article:789
  `
}

// Document Database (MongoDB)
// Use cases: Flexible structure, nested data
interface DocumentUseCase {
  example: `
    // Product information (different types have different attributes)
    {
      "_id": ObjectId("..."),
      "name": "iPhone 15",
      "category": "electronics",
      "price": 999,
      "specs": {
        "screen": "6.1 inch",
        "storage": "256GB",
        "color": "blue"
      },
      "reviews": [
        {"userId": 1, "rating": 5, "comment": "Great!"},
        {"userId": 2, "rating": 4, "comment": "Good value"}
      ]
    }
  `
}

// Column-Family Database (Cassandra/HBase)
// Use cases: Time-series data, massive writes
interface ColumnFamilyUseCase {
  example: `
    // User behavior logs
    CREATE TABLE user_events (
      user_id UUID,
      event_time TIMESTAMP,
      event_type TEXT,
      event_data TEXT,
      PRIMARY KEY ((user_id), event_time)
    ) WITH CLUSTERING ORDER BY (event_time DESC);
  `
}

// Graph Database (Neo4j)
// Use cases: Social relationships, recommendation systems
interface GraphUseCase {
  example: `
    // Social relationships
    MATCH (a:Person)-[:FRIENDS_WITH]->(b:Person)
          -[:FRIENDS_WITH]->(c:Person)
    WHERE a.name = 'Alice' AND NOT (a)-[:FRIENDS_WITH]->(c)
    RETURN c.name AS RecommendedFriend
  `
}
```

## Database Architecture Patterns

### Single Database Architecture

```
+-------------------------------------------------------------+
|                   Single Database Architecture                |
+-------------------------------------------------------------+
|                                                               |
|  +----------+   +----------+   +----------+                   |
|  |  App 1   |   |  App 2   |   |  App 3   |                   |
|  +----+-----+   +----+-----+   +----+-----+                   |
|       |              |              |                         |
|       +------+-------+-------+------+                         |
|              |                                                |
|       +------v------+                                         |
|       |  Database   |                                         |
|       | (Single)    |                                         |
|       +-------------+                                         |
|                                                               |
|  Pros: Simple, good transaction support, low ops cost         |
|  Cons: Poor scalability, single point of failure, bottleneck  |
|  Use: Small applications, early startups                      |
+-------------------------------------------------------------+
```

### Master-Slave Replication

```
+-------------------------------------------------------------+
|                  Master-Slave Replication                     |
+-------------------------------------------------------------+
|                                                               |
|  +---------------------+     +---------------------+          |
|  |   Application       |     |   Application       |          |
|  +----------+----------+     +-----------+---------+          |
|             |                            |                    |
|        Write|                       Read |                    |
|             v                            v                    |
|  +-----------------+   Replication +-----------------+        |
|  |    Master       |-------------->|    Slave 1      |        |
|  |   (Write)       |               |   (Read)        |        |
|  +-----------------+               +-----------------+        |
|             |                                                 |
|             | Replication                                     |
|             v                                                 |
|  +-----------------+                                          |
|  |    Slave 2      |                                          |
|  |   (Read)        |                                          |
|  +-----------------+                                          |
|                                                               |
|  Pros: Read-write separation, improved read performance,      |
|        data backup                                            |
|  Cons: Replication lag, write performance not improved,       |
|        master still a bottleneck                              |
+-------------------------------------------------------------+
```

```typescript
// Read-Write Separation Implementation
class DatabaseRouter {
  private masterPool: ConnectionPool;
  private slavePool: ConnectionPool;

  constructor(config: DatabaseConfig) {
    this.masterPool = createPool(config.master);
    this.slavePool = createPool(config.slaves);
  }

  async query(sql: string, params: any[], options?: { forceMaster?: boolean }) {
    // Write operations or forced master
    if (this.isWriteOperation(sql) || options?.forceMaster) {
      return this.masterPool.query(sql, params);
    }
    // Read operations go to slave
    return this.slavePool.query(sql, params);
  }

  private isWriteOperation(sql: string): boolean {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const upperSql = sql.trim().toUpperCase();
    return writeKeywords.some(keyword => upperSql.startsWith(keyword));
  }

  // Handle master-slave lag: read after write goes to master
  async writeAndRead<T>(
    writeSql: string,
    writeParams: any[],
    readSql: string,
    readParams: any[]
  ): Promise<T> {
    await this.masterPool.query(writeSql, writeParams);
    // Read immediately after write goes to master to avoid lag issues
    return this.masterPool.query(readSql, readParams);
  }
}
```

### Database Sharding

```
+-------------------------------------------------------------+
|                   Database Sharding Architecture              |
+-------------------------------------------------------------+
|                                                               |
|  +------------------------------------------+                 |
|  |              Application                  |                |
|  +---------------------+--------------------+                 |
|                        |                                      |
|                        v                                      |
|  +------------------------------------------+                 |
|  |          Sharding Middleware              |                |
|  |      (ShardingSphere / Vitess)           |                 |
|  +----+----------+----------+---------------+                 |
|       |          |          |                                 |
|       v          v          v                                 |
|  +--------+ +--------+ +--------+                             |
|  | DB 0   | | DB 1   | | DB 2   |                             |
|  +--------+ +--------+ +--------+                             |
|  |user_0  | |user_1  | |user_2  |                             |
|  |order_0 | |order_1 | |order_2 |                             |
|  +--------+ +--------+ +--------+                             |
|                                                               |
+-------------------------------------------------------------+
```

#### Sharding Strategies

```typescript
// 1. Range Sharding
class RangeSharding {
  getShardIndex(userId: number): number {
    if (userId < 1000000) return 0;
    if (userId < 2000000) return 1;
    return 2;
  }
  // Problem: Uneven data distribution, hotspots
}

// 2. Hash Sharding
class HashSharding {
  private shardCount: number;

  constructor(shardCount: number) {
    this.shardCount = shardCount;
  }

  getShardIndex(userId: number): number {
    return userId % this.shardCount;
  }
  // Pros: Even data distribution
  // Cons: Difficult to scale, requires data migration
}

// 3. Consistent Hashing
class ConsistentHashing {
  private ring: Map<number, number> = new Map(); // hash -> shardIndex
  private virtualNodes: number;

  constructor(shardCount: number, virtualNodes = 150) {
    this.virtualNodes = virtualNodes;
    for (let i = 0; i < shardCount; i++) {
      this.addShard(i);
    }
  }

  private hash(key: string): number {
    // Simplified hash implementation
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  addShard(shardIndex: number): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`shard-${shardIndex}-node-${i}`);
      this.ring.set(hash, shardIndex);
    }
  }

  getShardIndex(key: string): number {
    const hash = this.hash(key);
    const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);
    for (const nodeHash of sortedHashes) {
      if (hash <= nodeHash) {
        return this.ring.get(nodeHash)!;
      }
    }
    return this.ring.get(sortedHashes[0])!;
  }
}

// 4. Sharding Router Example
class ShardingRouter {
  private dbCount = 4;
  private tableCount = 16;

  route(userId: number): { dbIndex: number; tableIndex: number } {
    const tableIndex = userId % this.tableCount;
    const dbIndex = Math.floor(tableIndex / (this.tableCount / this.dbCount));
    return { dbIndex, tableIndex };
  }

  getTableName(userId: number): string {
    const { tableIndex } = this.route(userId);
    return `orders_${tableIndex}`;
  }

  getDataSource(userId: number): string {
    const { dbIndex } = this.route(userId);
    return `db_${dbIndex}`;
  }
}
```

#### Sharding Challenges

```typescript
interface ShardingChallenges {
  // 1. Cross-shard queries
  crossShardQuery: {
    problem: 'Cannot directly JOIN data from different shards',
    solutions: [
      'Application-layer aggregation',
      'Broadcast queries',
      'Middleware handling',
      'Redundant storage'
    ]
  },

  // 2. Distributed transactions
  distributedTransaction: {
    problem: 'Cross-shard transaction consistency',
    solutions: [
      'Eventual consistency (most common)',
      'TCC pattern',
      'Saga pattern',
      'XA two-phase commit'
    ]
  },

  // 3. Global unique IDs
  globalId: {
    problem: 'Auto-increment IDs not unique across shards',
    solutions: [
      'Snowflake algorithm',
      'UUID',
      'Segment allocation',
      'Database sequences'
    ]
  },

  // 4. Scaling
  scaling: {
    problem: 'Adding shards requires data migration',
    solutions: [
      'Consistent hashing to reduce migration',
      'Pre-sharding',
      'Dual-write migration',
      'Downtime migration'
    ]
  }
}
```

## Data Migration Strategies

### Migration Approach Comparison

```
+-------------------------------------------------------------+
|                 Data Migration Strategy Comparison            |
+--------------+----------------------------------------------+
|   Strategy   |                 Characteristics               |
+--------------+----------------------------------------------+
| Downtime     | Simple and reliable, but requires service    |
| Migration    | downtime. Suitable for small data volumes    |
+--------------+----------------------------------------------+
| Dual-Write   | Zero downtime, but complex logic. Needs      |
| Migration    | consistency handling                          |
+--------------+----------------------------------------------+
| Incremental  | Uses binlog or similar mechanisms. Suitable  |
| Sync         | for large data volumes                        |
+--------------+----------------------------------------------+
| Shadow Table | Writes to new table, gradual switch. Easy    |
| Migration    | rollback                                      |
+--------------+----------------------------------------------+
```

### Dual-Write Migration Implementation

```typescript
/**
 * Dual-Write Migration Strategy Implementation
 * Phase 1: Dual-write, read from old database
 * Phase 2: Dual-write, read from new database
 * Phase 3: Write only to new database
 */
class DualWriteMigration {
  private phase: 'dual-write-read-old' | 'dual-write-read-new' | 'new-only' = 'dual-write-read-old';
  private oldDb: Database;
  private newDb: Database;

  constructor(oldDb: Database, newDb: Database) {
    this.oldDb = oldDb;
    this.newDb = newDb;
  }

  async write(data: any): Promise<void> {
    switch (this.phase) {
      case 'dual-write-read-old':
      case 'dual-write-read-new':
        // Dual-write: Write to new database first, then old database
        await this.newDb.write(data);
        try {
          await this.oldDb.write(data);
        } catch (error) {
          // Old database write failure logged but doesn't affect main flow
          console.error('Old DB write failed:', error);
        }
        break;
      case 'new-only':
        await this.newDb.write(data);
        break;
    }
  }

  async read(id: string): Promise<any> {
    switch (this.phase) {
      case 'dual-write-read-old':
        return this.oldDb.read(id);
      case 'dual-write-read-new':
      case 'new-only':
        return this.newDb.read(id);
    }
  }

  setPhase(phase: typeof this.phase): void {
    this.phase = phase;
    console.log(`Migration phase changed to: ${phase}`);
  }

  // Data verification
  async verify(sampleSize: number): Promise<VerificationResult> {
    const oldData = await this.oldDb.sample(sampleSize);
    const results = await Promise.all(
      oldData.map(async (item) => {
        const newItem = await this.newDb.read(item.id);
        return {
          id: item.id,
          match: this.deepEqual(item, newItem),
          old: item,
          new: newItem
        };
      })
    );

    const matchCount = results.filter(r => r.match).length;
    return {
      total: sampleSize,
      matched: matchCount,
      mismatched: sampleSize - matchCount,
      details: results.filter(r => !r.match)
    };
  }

  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
```

### Migration Best Practices

```typescript
interface MigrationBestPractices {
  preparation: [
    'Estimate data volume and migration time',
    'Prepare rollback plan',
    'Create data backups',
    'Prepare data verification tools',
    'Notify stakeholders of expected impact'
  ],

  execution: [
    'Execute during off-peak hours',
    'Migrate in batches, control batch sizes',
    'Monitor system performance metrics',
    'Maintain detailed logs',
    'Set up alerting mechanisms'
  ],

  verification: [
    'Data integrity verification',
    'Data consistency verification',
    'Business functionality validation',
    'Performance comparison testing'
  ],

  rollback: [
    'Define rollback trigger conditions',
    'Prepare rollback scripts',
    'Set rollback time windows',
    'Test rollback procedures'
  ]
}
```

## Interview Key Points

### Common Interview Questions

#### Database Design Related

**Q: How would you design a database for an e-commerce system?**

```typescript
// Key points to cover
const ecommerceDesign = {
  coreEntities: [
    'users',
    'products',
    'orders',
    'order_items',
    'categories',
    'inventory',
    'payments'
  ],

  keyDecisions: {
    idStrategy: 'Use Snowflake algorithm for distributed unique IDs',
    orderNo: 'Separate business order number (date+random) from internal ID',
    price: 'Use DECIMAL(10,2), storing in cents is even better',
    status: 'Use enums or state machine for order status management',
    softDelete: 'Use deleted_at for soft deletes',
    audit: 'All tables include created_at, updated_at'
  },

  optimization: {
    hotData: 'Cache hot data (active users, popular products) in Redis',
    historicalData: 'Archive historical order data',
    searchData: 'Use Elasticsearch for product search'
  }
};
```

**Q: When should you use denormalization?**

```typescript
const denormalizationAnswer = {
  scenarios: [
    'Query frequency is much higher than update frequency',
    'Need to avoid complex multi-table JOINs',
    'Can accept some degree of data redundancy',
    'Have mechanisms to ensure data consistency'
  ],

  examples: [
    'Redundant username/product name in order table',
    'Redundant author info in article table',
    'Statistical summary tables'
  ],

  tradeoffs: [
    'Trade space for time',
    'Increased update complexity',
    'Need to maintain data consistency'
  ]
};
```

#### Index Related

**Q: How do you optimize slow queries?**

```sql
-- Analysis steps
-- 1. Use EXPLAIN to analyze execution plan
EXPLAIN SELECT * FROM orders WHERE user_id = 123 AND status = 'paid';

-- 2. Check key metrics
-- type: Access type (ALL < index < range < ref < eq_ref < const)
-- key: Index used
-- rows: Rows scanned
-- Extra: Additional info (Using filesort, Using temporary need optimization)

-- 3. Optimization approaches
-- Add appropriate composite index
CREATE INDEX idx_user_status ON orders(user_id, status);

-- Avoid SELECT *
SELECT id, order_no, total_amount FROM orders WHERE user_id = 123;

-- Use covering index
CREATE INDEX idx_covering ON orders(user_id, status, order_no, total_amount);
```

**Q: What's the difference between clustered and non-clustered indexes?**

```typescript
const indexComparison = {
  clusteredIndex: {
    definition: 'Data rows and index stored together',
    features: [
      'A table can only have one clustered index',
      'InnoDB primary key is the clustered index',
      'Efficient for range queries',
      'Inserts may cause page splits'
    ],
    storage: 'Leaf nodes store complete data rows'
  },

  nonClusteredIndex: {
    definition: 'Index and data stored separately',
    features: [
      'A table can have multiple non-clustered indexes',
      'Queries may require table lookups',
      'Covering indexes can avoid table lookups'
    ],
    storage: 'Leaf nodes store primary key values'
  }
};
```

#### Sharding Related

**Q: How do you handle cross-shard JOINs after database sharding?**

```typescript
const crossShardJoinSolutions = {
  approach1: {
    name: 'Global Tables',
    description: 'Replicate small tables (like config tables) to every shard',
    pros: ['Simple queries'],
    cons: ['Data sync overhead', 'Only suitable for small tables']
  },

  approach2: {
    name: 'Field Redundancy',
    description: 'Redundantly store fields needed for JOINs',
    pros: ['High query efficiency'],
    cons: ['Data consistency maintenance']
  },

  approach3: {
    name: 'Application-Layer Aggregation',
    description: 'Query separately and merge in application layer',
    example: `
      // Query user orders with product info
      const orders = await orderDb.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
      const productIds = orders.map(o => o.product_id);
      const products = await productDb.query('SELECT * FROM products WHERE id IN (?)', [productIds]);

      // Merge in application layer
      return orders.map(order => ({
        ...order,
        product: products.find(p => p.id === order.product_id)
      }));
    `
  }
};
```

**Q: How do you generate primary keys after database sharding?**

```typescript
const distributedIdStrategies = {
  snowflake: {
    description: 'Snowflake algorithm, 64-bit distributed ID',
    pros: ['Trending sequential', 'High performance', 'Database independent'],
    cons: ['Depends on clock synchronization']
  },

  segment: {
    description: 'Segment allocation, batch fetch ID ranges from database',
    pros: ['Sequential IDs', 'Good disaster recovery'],
    cons: ['Database dependency']
  },

  uuid: {
    description: 'Universally Unique Identifier',
    pros: ['Simple', 'Globally unique'],
    cons: ['Unordered', 'Large storage space', 'Poor index performance']
  }
};
```

### Design Question Framework

```typescript
// Database design interview answer framework
const designFramework = {
  step1_clarify: {
    questions: [
      'What is the estimated user scale and data volume?',
      'What is the read/write ratio?',
      'What are the consistency requirements?',
      'What are the core business scenarios?'
    ]
  },

  step2_entities: {
    task: 'Identify core entities and relationships',
    output: 'ER diagram'
  },

  step3_schema: {
    task: 'Design table structures',
    considerations: ['Primary key strategy', 'Field types', 'Constraints', 'Index design']
  },

  step4_optimization: {
    task: 'Performance optimization plan',
    aspects: ['Index optimization', 'Read-write separation', 'Caching strategy', 'Database sharding']
  },

  step5_tradeoffs: {
    task: 'Discuss trade-offs',
    topics: ['Consistency vs Availability', 'Normalization vs Denormalization', 'Cost vs Performance']
  }
};
```

## Summary

Database design is the foundation of software engineering, requiring a balance between theory and practice:

1. **Follow the Design Process**: Requirement analysis -> Conceptual design -> Logical design -> Physical design
2. **Understand Normalization Principles**: Eliminate redundancy, ensure data integrity
3. **Apply Denormalization Flexibly**: Moderate redundancy based on actual needs to improve query performance
4. **Design Primary Keys and Indexes Properly**: Choose appropriate ID strategies, follow index design principles
5. **Select the Right Database Type**: SQL vs NoSQL, decide based on business characteristics
6. **Plan Scalable Architecture**: Read-write separation, database sharding to handle data growth
7. **Develop Migration Strategies**: Safe, rollback-capable data migration plans

Good database design considers current requirements while leaving room for future expansion. Through continuous practical experience, you can design database systems that meet business needs while maintaining excellent scalability.
