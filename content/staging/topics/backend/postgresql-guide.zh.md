---
title: PostgreSQL 数据库深入
description: 掌握PostgreSQL的高级特性、索引优化和查询性能调优
track: backend
section: databases
difficulty: intermediate
tags:
  - PostgreSQL
  - SQL
  - 数据库
  - 索引
status: imported
origin: old/src/content/docs/backend/postgresql-guide.zh.md
divergence: 0.243
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: Database
  order: 12
  lastUpdated: 2026-01-07
---

PostgreSQL 是世界上最先进的开源关系型数据库管理系统，以其可靠性、功能丰富性和性能著称。本文将深入探讨 PostgreSQL 的核心概念、高级特性和性能优化技巧，帮助开发者全面掌握这一强大的数据库系统。

## 核心概念解释

### PostgreSQL 架构概述

PostgreSQL 采用客户端/服务器模型，其架构主要包含以下核心组件：

- **Postmaster 进程**：主守护进程，负责监听连接请求并为每个客户端连接 fork 出独立的后端进程
- **Backend 进程**：处理客户端查询请求的工作进程
- **共享内存**：包含共享缓冲区（Shared Buffers）、WAL 缓冲区等
- **后台工作进程**：包括 WAL Writer、Checkpointer、Autovacuum 等

### MVCC 多版本并发控制

PostgreSQL 使用 MVCC（Multi-Version Concurrency Control）机制来处理并发访问。每个事务看到的是数据的一个快照，而不是最新状态。这种机制的核心特点包括：

- 读操作不会阻塞写操作，写操作不会阻塞读操作
- 每行数据包含 `xmin` 和 `xmax` 系统列，记录创建和删除该行的事务 ID
- 通过事务快照判断数据行对当前事务是否可见

```sql
-- 查看行的系统列
SELECT xmin, xmax, ctid, * FROM users LIMIT 5;
```

### WAL 预写式日志

Write-Ahead Logging（WAL）是 PostgreSQL 保证数据持久性的核心机制。所有修改操作在写入数据文件之前，必须先写入 WAL 日志。这种机制确保了即使在系统崩溃后，数据库也能恢复到一致状态。

WAL 的核心优势包括：
- **崩溃恢复**：系统重启后通过重放 WAL 日志恢复未完成的事务
- **复制基础**：流复制和逻辑复制都基于 WAL 实现
- **时间点恢复**：结合基础备份可实现任意时间点恢复（PITR）

```sql
-- 查看 WAL 相关配置
SHOW wal_level;
SHOW max_wal_size;
SHOW checkpoint_timeout;

-- 查看当前 WAL 位置
SELECT pg_current_wal_lsn();

-- 查看 WAL 文件
SELECT * FROM pg_ls_waldir() ORDER BY modification DESC LIMIT 5;
```

### 检查点机制

检查点（Checkpoint）是将内存中的脏页刷新到磁盘的过程，它标志着之前的 WAL 日志可以被回收：

```sql
-- 查看检查点相关配置
SHOW checkpoint_timeout;          -- 检查点间隔时间
SHOW checkpoint_completion_target; -- 检查点完成目标比例
SHOW checkpoint_warning;          -- 检查点过于频繁时的警告阈值

-- 手动触发检查点（谨慎使用）
CHECKPOINT;
```

## 数据类型详解

PostgreSQL 提供了丰富的数据类型系统，除了标准的 SQL 类型外，还支持许多高级数据类型。合理使用这些类型可以简化应用程序逻辑，提高查询效率。

### JSONB 类型

JSONB 是 PostgreSQL 中存储 JSON 数据的二进制格式，相比 JSON 类型具有更好的查询性能和索引支持。JSONB 会在存储时进行解析和验证，虽然写入略慢，但读取和查询性能显著提升。

**JSON vs JSONB 对比：**
| 特性 | JSON | JSONB |
|-----|------|-------|
| 存储格式 | 文本 | 二进制 |
| 写入速度 | 快 | 略慢 |
| 查询速度 | 慢 | 快 |
| 索引支持 | 不支持 | 支持 GIN |
| 保留空格和顺序 | 是 | 否 |
| 重复键处理 | 保留 | 保留最后一个 |

```sql
-- 创建包含 JSONB 列的表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    attributes JSONB
);

-- 插入 JSONB 数据
INSERT INTO products (name, attributes) VALUES
('iPhone 15', '{"color": "black", "storage": 256, "specs": {"cpu": "A17", "ram": 8}}'),
('MacBook Pro', '{"color": "silver", "storage": 512, "ports": ["USB-C", "HDMI"]}');

-- JSONB 操作符示例
-- 获取顶级键值
SELECT attributes -> 'color' FROM products;

-- 获取文本值
SELECT attributes ->> 'color' FROM products;

-- 获取嵌套值
SELECT attributes -> 'specs' ->> 'cpu' FROM products;

-- 路径查询
SELECT attributes #> '{specs, cpu}' FROM products;

-- 检查键是否存在
SELECT * FROM products WHERE attributes ? 'ports';

-- 检查键值对是否存在
SELECT * FROM products WHERE attributes @> '{"color": "black"}';

-- 更新 JSONB 字段
UPDATE products
SET attributes = jsonb_set(attributes, '{storage}', '512')
WHERE name = 'iPhone 15';
```

### 数组类型

PostgreSQL 原生支持数组类型，可以在单个字段中存储多个同类型值：

```sql
-- 创建包含数组列的表
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[],
    scores INTEGER[]
);

-- 插入数组数据
INSERT INTO articles (title, tags, scores) VALUES
('PostgreSQL Guide', ARRAY['database', 'sql', 'tutorial'], ARRAY[95, 88, 92]),
('React Hooks', '{"react", "frontend", "javascript"}', '{90, 85}');

-- 数组操作
-- 访问数组元素（索引从1开始）
SELECT tags[1] FROM articles;

-- 数组切片
SELECT tags[1:2] FROM articles;

-- 检查元素是否在数组中
SELECT * FROM articles WHERE 'database' = ANY(tags);

-- 数组包含检查
SELECT * FROM articles WHERE tags @> ARRAY['sql'];

-- 数组重叠检查
SELECT * FROM articles WHERE tags && ARRAY['react', 'vue'];

-- 数组追加元素
UPDATE articles SET tags = array_append(tags, 'advanced') WHERE id = 1;

-- 数组长度
SELECT array_length(tags, 1) FROM articles;
```

### UUID 类型

UUID（Universally Unique Identifier）适合用于分布式系统中的主键：

```sql
-- 启用 uuid-ossp 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建使用 UUID 主键的表
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据
INSERT INTO orders (customer_id, total_amount)
VALUES (uuid_generate_v4(), 199.99);

-- 使用 gen_random_uuid()（PostgreSQL 13+，无需扩展）
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER,
    expires_at TIMESTAMP
);
```

### 范围类型

PostgreSQL 还支持范围类型（Range Types），用于表示值的范围：

```sql
-- 内置范围类型
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    during TSRANGE NOT NULL,  -- 时间戳范围
    EXCLUDE USING GIST (room_id WITH =, during WITH &&)
);

-- 插入数据
INSERT INTO reservations (room_id, during) VALUES
(101, '[2024-01-15 14:00, 2024-01-15 16:00)'),
(101, '[2024-01-15 17:00, 2024-01-15 19:00)');

-- 范围查询
SELECT * FROM reservations
WHERE during @> '2024-01-15 15:00'::timestamp;  -- 包含查询

-- 重叠检查
SELECT * FROM reservations
WHERE during && '[2024-01-15 15:00, 2024-01-15 18:00)'::tsrange;
```

### 枚举类型

枚举类型适用于固定值集合的场景：

```sql
-- 创建枚举类型
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- 使用枚举类型
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    status order_status DEFAULT 'pending'
);

-- 添加新的枚举值
ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'cancelled';
```

## 索引类型深入解析

索引是数据库性能优化的核心手段。PostgreSQL 提供了多种索引类型，每种类型针对不同的数据特征和查询模式进行了优化。理解这些索引类型的工作原理和适用场景，是数据库性能调优的关键。

### B-Tree 索引

B-Tree（平衡树）是 PostgreSQL 的默认索引类型，也是最常用的索引结构。它将数据按照排序顺序组织成树形结构，支持快速的等值查询和范围查询：

```sql
-- 创建 B-Tree 索引
CREATE INDEX idx_users_email ON users(email);

-- 复合索引
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- 部分索引（仅索引满足条件的行）
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- 唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- B-Tree 适用的查询操作符
-- <, <=, =, >=, >, BETWEEN, IN, IS NULL, IS NOT NULL
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM orders WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
```

### Hash 索引

Hash 索引仅支持等值比较，在 PostgreSQL 10 之后变得可靠且支持 WAL：

```sql
-- 创建 Hash 索引
CREATE INDEX idx_users_hash_email ON users USING HASH (email);

-- 仅适用于等值查询
SELECT * FROM users WHERE email = 'test@example.com';
```

### GIN 索引（通用倒排索引）

GIN（Generalized Inverted Index）索引适用于包含多个值的数据类型，如数组、JSONB、全文搜索：

```sql
-- 为 JSONB 列创建 GIN 索引
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- 为数组列创建 GIN 索引
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);

-- 使用 jsonb_path_ops 操作符类（更紧凑，仅支持 @> 操作符）
CREATE INDEX idx_products_attrs_path ON products
    USING GIN (attributes jsonb_path_ops);

-- 全文搜索 GIN 索引
CREATE INDEX idx_articles_fts ON articles
    USING GIN (to_tsvector('english', title || ' ' || content));
```

### GiST 索引（通用搜索树）

GiST（Generalized Search Tree）索引支持复杂数据类型的空间搜索：

```sql
-- 安装 PostGIS 扩展进行地理空间查询
CREATE EXTENSION IF NOT EXISTS postgis;

-- 创建地理位置表
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    coordinates GEOMETRY(Point, 4326)
);

-- 创建 GiST 索引
CREATE INDEX idx_locations_geo ON locations USING GiST (coordinates);

-- 范围查询
SELECT * FROM locations
WHERE ST_DWithin(coordinates, ST_MakePoint(116.4, 39.9)::geography, 5000);
```

### BRIN 索引（块范围索引）

BRIN 索引适用于物理顺序与逻辑顺序相关的大表：

```sql
-- 适用于时序数据
CREATE TABLE logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    message TEXT
);

-- 创建 BRIN 索引
CREATE INDEX idx_logs_created_brin ON logs USING BRIN (created_at);

-- BRIN 索引占用空间极小，适合亿级数据表
```

### 索引选择指南

选择合适的索引类型是性能优化的关键。以下是索引选择的总结：

| 索引类型 | 适用场景 | 操作符支持 | 空间占用 |
|---------|---------|-----------|---------|
| B-Tree | 等值、范围、排序 | <, <=, =, >=, >, BETWEEN | 中等 |
| Hash | 仅等值查询 | = | 小 |
| GIN | 全文搜索、JSONB、数组 | @>, ?, ?&, ?\|, @@ | 大 |
| GiST | 地理空间、范围类型 | &&, @>, <@, << | 中等 |
| BRIN | 时序数据、大表 | <, <=, =, >=, > | 极小 |

## 查询优化与 EXPLAIN ANALYZE

查询优化是数据库性能调优的核心工作。PostgreSQL 的查询优化器会根据表统计信息、索引可用性等因素选择最优执行计划。理解执行计划是优化查询的第一步。

### 理解执行计划

使用 `EXPLAIN` 和 `EXPLAIN ANALYZE` 命令可以查看查询的执行计划。两者的区别在于 `EXPLAIN` 只显示计划不执行查询，而 `EXPLAIN ANALYZE` 会实际执行查询并显示真实的执行时间：

```sql
-- 基本 EXPLAIN
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- EXPLAIN ANALYZE 实际执行查询
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- 详细输出
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;
```

### 执行计划解读

```
Seq Scan on users  (cost=0.00..1.05 rows=1 width=100) (actual time=0.015..0.017 rows=1 loops=1)
  Filter: (email = 'test@example.com'::text)
  Rows Removed by Filter: 4
Planning Time: 0.085 ms
Execution Time: 0.035 ms
```

关键指标解释：
- **cost**：估算成本（启动成本..总成本）
- **rows**：估算返回行数
- **actual time**：实际执行时间（首行时间..总时间，毫秒）
- **loops**：循环执行次数
- **Buffers**：缓冲区命中和读取情况

### 常见优化技巧

```sql
-- 使用覆盖索引避免回表
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (name);

-- 强制使用索引（仅用于测试）
SET enable_seqscan = OFF;

-- 更新统计信息
ANALYZE users;

-- 查看表统计信息
SELECT * FROM pg_stats WHERE tablename = 'users';
```

### 执行计划节点类型

理解常见的执行计划节点有助于优化查询：

- **Seq Scan**：顺序扫描，遍历整个表
- **Index Scan**：使用索引查找，然后回表获取数据
- **Index Only Scan**：仅使用索引，无需回表（覆盖索引）
- **Bitmap Index Scan**：位图索引扫描，适合多条件查询
- **Nested Loop**：嵌套循环连接，适合小数据集
- **Hash Join**：哈希连接，适合等值连接
- **Merge Join**：归并连接，适合已排序数据
- **Sort**：排序操作
- **Aggregate**：聚合操作

### 常见性能问题诊断

```sql
-- 查找缺失索引的表
SELECT
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE WHEN seq_scan > 0
        THEN round(seq_tup_read::numeric / seq_scan, 2)
        ELSE 0
    END AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;

-- 查找未使用的索引
SELECT
    indexrelname AS index_name,
    relname AS table_name,
    idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## 事务与隔离级别

事务是数据库操作的基本单位，具有 ACID 特性：原子性（Atomicity）、一致性（Consistency）、隔离性（Isolation）和持久性（Durability）。PostgreSQL 通过 MVCC 机制实现高效的事务隔离。

### 四种隔离级别

PostgreSQL 支持 SQL 标准定义的四种隔离级别，不同级别提供不同程度的并发控制：

```sql
-- 读未提交（PostgreSQL 实际按读已提交处理）
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- 读已提交（默认级别）
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 可重复读
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- 可串行化
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### 隔离级别特性对比

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|---------|------|-----------|------|
| READ UNCOMMITTED | 不可能 | 可能 | 可能 |
| READ COMMITTED | 不可能 | 可能 | 可能 |
| REPEATABLE READ | 不可能 | 不可能 | 不可能* |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 |

*注：PostgreSQL 的 REPEATABLE READ 实际上也防止了幻读

### 事务使用示例

```sql
-- 基本事务
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 保存点
BEGIN;
INSERT INTO orders (customer_id, total) VALUES (1, 100);
SAVEPOINT sp1;
INSERT INTO order_items (order_id, product_id) VALUES (1, 100);
-- 发生错误时回滚到保存点
ROLLBACK TO sp1;
INSERT INTO order_items (order_id, product_id) VALUES (1, 200);
COMMIT;
```

## 锁机制详解

锁是数据库并发控制的核心机制。PostgreSQL 提供了丰富的锁类型来支持不同的并发场景。理解锁机制对于诊断死锁、优化并发性能至关重要。

### 表级锁

PostgreSQL 提供八种表级锁模式，按限制程度从低到高排列：

1. **ACCESS SHARE**：SELECT 语句获取，与 ACCESS EXCLUSIVE 冲突
2. **ROW SHARE**：SELECT FOR UPDATE/SHARE 获取
3. **ROW EXCLUSIVE**：INSERT/UPDATE/DELETE 获取
4. **SHARE UPDATE EXCLUSIVE**：VACUUM、ANALYZE 等获取
5. **SHARE**：CREATE INDEX（非并发）获取
6. **SHARE ROW EXCLUSIVE**：类似 EXCLUSIVE，允许 ROW SHARE
7. **EXCLUSIVE**：阻止读写，但允许 ACCESS SHARE
8. **ACCESS EXCLUSIVE**：ALTER TABLE、DROP TABLE 等获取，完全排他

```sql
-- 显式获取表锁
BEGIN;
LOCK TABLE accounts IN ACCESS EXCLUSIVE MODE;
-- 执行操作
COMMIT;

-- 查看当前锁
SELECT
    pg_class.relname,
    pg_locks.mode,
    pg_locks.granted
FROM pg_locks
JOIN pg_class ON pg_locks.relation = pg_class.oid
WHERE pg_class.relname NOT LIKE 'pg_%';
```

### 行级锁

```sql
-- FOR UPDATE：独占锁，阻止其他事务修改或锁定
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- FOR SHARE：共享锁，允许其他事务读取但不能修改
SELECT * FROM accounts WHERE id = 1 FOR SHARE;

-- FOR NO KEY UPDATE：更新非键列时使用
SELECT * FROM accounts WHERE id = 1 FOR NO KEY UPDATE;

-- SKIP LOCKED：跳过已锁定的行
SELECT * FROM tasks WHERE status = 'pending'
FOR UPDATE SKIP LOCKED LIMIT 1;

-- NOWAIT：不等待锁释放
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
```

### 死锁检测与处理

```sql
-- 查看死锁超时设置
SHOW deadlock_timeout;

-- 设置锁等待超时
SET lock_timeout = '10s';

-- 查看等待中的锁
SELECT
    blocked_locks.pid AS blocked_pid,
    blocking_locks.pid AS blocking_pid,
    blocked_activity.query AS blocked_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database = blocked_locks.database
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocked_activity
    ON blocked_activity.pid = blocked_locks.pid
WHERE NOT blocked_locks.granted;
```

## 分区表

分区表是 PostgreSQL 处理大数据量的重要特性。通过将大表拆分为多个较小的物理分区，可以显著提升查询性能和数据管理效率。PostgreSQL 10 引入了声明式分区，大大简化了分区表的使用。

分区表的主要优势：
- **查询性能**：分区裁剪可以只扫描相关分区
- **数据管理**：可以快速删除整个分区而不是逐行删除
- **并行处理**：不同分区可以并行扫描
- **维护效率**：可以对单个分区进行 VACUUM 或重建索引

### 范围分区

```sql
-- 创建分区表
CREATE TABLE orders (
    id BIGSERIAL,
    customer_id INTEGER,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2),
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

-- 创建分区
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- 创建默认分区
CREATE TABLE orders_default PARTITION OF orders DEFAULT;
```

### 列表分区

```sql
CREATE TABLE customers (
    id SERIAL,
    name VARCHAR(100),
    region VARCHAR(20) NOT NULL,
    PRIMARY KEY (id, region)
) PARTITION BY LIST (region);

CREATE TABLE customers_asia PARTITION OF customers
    FOR VALUES IN ('china', 'japan', 'korea');

CREATE TABLE customers_europe PARTITION OF customers
    FOR VALUES IN ('uk', 'france', 'germany');
```

### 哈希分区

```sql
CREATE TABLE sessions (
    id UUID,
    user_id INTEGER NOT NULL,
    data JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE sessions_0 PARTITION OF sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE sessions_1 PARTITION OF sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

-- 以此类推...
```

### 分区表管理

```sql
-- 查看分区表结构
SELECT
    parent.relname AS parent,
    child.relname AS partition,
    pg_get_expr(child.relpartbound, child.oid) AS partition_bound
FROM pg_class parent
JOIN pg_inherits ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'orders';

-- 分离分区（不删除数据）
ALTER TABLE orders DETACH PARTITION orders_2024_q1;

-- 重新附加分区
ALTER TABLE orders ATTACH PARTITION orders_2024_q1
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- 在分区上创建索引（PostgreSQL 11+会自动在所有分区创建）
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

## 全文搜索

PostgreSQL 内置了强大的全文搜索功能，无需依赖外部搜索引擎。全文搜索使用 `tsvector`（文档向量）和 `tsquery`（查询表达式）两种数据类型来实现高效的文本检索。

### 核心概念

- **tsvector**：将文档转换为可搜索的词素（lexeme）列表
- **tsquery**：表示搜索条件的查询表达式
- **词典（Dictionary）**：负责词素化处理，如词干提取、停用词过滤
- **配置（Configuration）**：定义使用哪些词典和分析器

### 基本全文搜索

```sql
-- 创建全文搜索列
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- 更新搜索向量
UPDATE articles SET search_vector =
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

-- 创建 GIN 索引
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

-- 执行全文搜索
SELECT title, ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'postgresql & tutorial') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

### 中文全文搜索

```sql
-- 使用 pg_jieba 或 zhparser 扩展
CREATE EXTENSION pg_jieba;

-- 创建中文搜索配置
CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = jieba);

-- 使用中文配置
SELECT * FROM articles
WHERE to_tsvector('chinese', content) @@ to_tsquery('chinese', '数据库');
```

### 搜索高亮显示

```sql
SELECT
    title,
    ts_headline('english', content, to_tsquery('english', 'postgresql'),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50') AS highlighted
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql');
```

### 搜索权重和排名

```sql
-- 为不同字段设置不同权重
UPDATE articles SET search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C');

-- 使用权重进行排名
SELECT
    title,
    ts_rank_cd(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'database') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

## 常用扩展

PostgreSQL 的扩展生态系统非常丰富，可以显著增强数据库功能。以下是一些常用且重要的扩展：

### pg_stat_statements

```sql
-- 启用扩展
CREATE EXTENSION pg_stat_statements;

-- 查看慢查询
SELECT
    query,
    calls,
    total_exec_time / calls AS avg_time,
    rows / calls AS avg_rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### pgcrypto

```sql
CREATE EXTENSION pgcrypto;

-- 密码哈希
INSERT INTO users (email, password_hash)
VALUES ('user@example.com', crypt('mypassword', gen_salt('bf')));

-- 验证密码
SELECT * FROM users
WHERE email = 'user@example.com'
AND password_hash = crypt('mypassword', password_hash);
```

### pg_trgm（三元组相似度）

```sql
CREATE EXTENSION pg_trgm;

-- 创建模糊搜索索引
CREATE INDEX idx_users_name_trgm ON users USING GIN (name gin_trgm_ops);

-- 相似度搜索
SELECT name, similarity(name, 'Jhon') AS sim
FROM users
WHERE name % 'Jhon'
ORDER BY sim DESC;
```

### 其他常用扩展

| 扩展名 | 用途 | 说明 |
|-------|------|------|
| PostGIS | 地理空间 | 最强大的开源 GIS 数据库扩展 |
| pg_partman | 分区管理 | 自动化分区创建和维护 |
| pgvector | 向量搜索 | 支持 AI/ML 场景的向量相似度搜索 |
| TimescaleDB | 时序数据 | 专为时间序列数据优化 |
| Citus | 分布式 | 将 PostgreSQL 扩展为分布式数据库 |
| pg_repack | 表重组 | 在线重组表，无需长时间锁定 |
| HypoPG | 虚拟索引 | 测试索引效果而不实际创建 |

## 性能调优

性能调优是一个系统性工程，需要从硬件配置、参数设置、查询优化等多个维度综合考虑。以下是 PostgreSQL 性能调优的核心要点。

### 内存配置

```sql
-- 共享缓冲区（建议系统内存的 25%）
SHOW shared_buffers;
-- ALTER SYSTEM SET shared_buffers = '4GB';

-- 工作内存（每个操作可用内存）
SHOW work_mem;
-- SET work_mem = '256MB';

-- 维护操作内存
SHOW maintenance_work_mem;

-- 有效缓存大小（帮助查询规划器估算）
SHOW effective_cache_size;
```

### 连接池配置

```sql
-- 最大连接数
SHOW max_connections;

-- 建议使用 PgBouncer 作为连接池
-- pgbouncer.ini 配置示例：
-- pool_mode = transaction
-- max_client_conn = 1000
-- default_pool_size = 25
```

### VACUUM 与自动清理

VACUUM 是 PostgreSQL 维护数据库健康的重要操作。由于 MVCC 机制，更新和删除操作不会立即物理删除数据，而是标记为"死元组"。VACUUM 负责回收这些空间。

```sql
-- 手动 VACUUM
VACUUM ANALYZE users;

-- 完全 VACUUM（重建表，会锁表）
VACUUM FULL users;

-- 查看自动清理配置
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;

-- 查看表的死行数
SELECT
    relname,
    n_dead_tup,
    n_live_tup,
    last_vacuum,
    last_autovacuum,
    round(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) AS dead_ratio
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

### 监控与诊断

```sql
-- 查看数据库大小
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- 查看表大小（包含索引）
SELECT
    relname,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- 查看当前活动连接
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- 查看长时间运行的查询
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state != 'idle';
```

## 面试要点

### 常见面试问题

1. **PostgreSQL 与 MySQL 的主要区别是什么？**
   - PostgreSQL 支持更丰富的数据类型（JSONB、数组、范围类型等）
   - PostgreSQL 使用 MVCC，MySQL InnoDB 也使用但实现不同
   - PostgreSQL 支持更多索引类型（GIN、GiST、BRIN）
   - PostgreSQL 对 SQL 标准支持更完整

2. **如何优化一个慢查询？**
   - 使用 EXPLAIN ANALYZE 分析执行计划
   - 检查是否使用了合适的索引
   - 更新表统计信息（ANALYZE）
   - 考虑查询重写或添加覆盖索引
   - 检查 work_mem 配置

3. **MVCC 如何工作？**
   - 每行数据保存版本信息（xmin/xmax）
   - 读取时根据事务快照判断可见性
   - 不同隔离级别使用不同的快照策略

4. **如何处理大表？**
   - 使用分区表
   - 定期归档历史数据
   - 使用 BRIN 索引
   - 考虑使用 TimescaleDB 扩展

5. **什么时候使用不同的索引类型？**
   - B-Tree：默认选择，适用于等值和范围查询
   - Hash：仅等值查询，占用空间小
   - GIN：全文搜索、JSONB、数组
   - GiST：地理空间、范围类型
   - BRIN：时序数据、有序大表

6. **VACUUM 和 VACUUM FULL 的区别？**
   - VACUUM：标记死元组空间可重用，不回收空间到操作系统，不阻塞读写
   - VACUUM FULL：重建整个表，回收空间到操作系统，会锁表
   - 日常维护用 VACUUM，空间严重膨胀时考虑 VACUUM FULL

7. **如何实现数据库高可用？**
   - 使用流复制配置主从架构
   - 使用 Patroni 或 pg_auto_failover 实现自动故障转移
   - 结合 PgBouncer 实现连接池和故障切换
   - 使用 Citus 实现分布式架构

8. **什么是连接膨胀问题？如何解决？**
   - PostgreSQL 每个连接都是独立进程，占用一定内存
   - 大量连接会消耗大量资源
   - 使用连接池（PgBouncer）控制实际数据库连接数
   - 合理设置 max_connections 参数

## 延伸阅读

### 官方资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [PostgreSQL Wiki](https://wiki.postgresql.org/)
- [PostgreSQL 源码](https://github.com/postgres/postgres)

### 推荐书籍

- 《PostgreSQL 实战》
- 《PostgreSQL 技术内幕》
- 《High Performance PostgreSQL for Rails》

### 在线学习

- [PostgreSQL Exercises](https://pgexercises.com/)
- [The Art of PostgreSQL](https://theartofpostgresql.com/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

### 进阶主题

- 逻辑复制与流复制
- PostgreSQL 高可用方案（Patroni、pg_auto_failover）
- 时序数据库扩展 TimescaleDB
- 分布式扩展 Citus
- 向量数据库扩展 pgvector

---

PostgreSQL 作为一个功能强大的开源数据库，其丰富的特性和优秀的性能使其成为众多企业的首选。深入理解其核心机制和优化技巧，将帮助开发者构建更高效、可靠的数据库应用。持续关注 PostgreSQL 社区的发展，紧跟新版本特性，是提升数据库技能的有效途径。
