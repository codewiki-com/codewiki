---
title: MySQL 性能优化指南
description: 掌握MySQL性能优化技术，构建高性能数据库应用
track: backend
section: databases
difficulty: advanced
tags:
  - MySQL
  - 性能优化
  - 索引
  - SQL
status: imported
origin: old/src/content/docs/backend/mysql-optimization.zh.md
divergence: 0.221
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 21
  lastUpdated: 2026-01-07
---

MySQL 是全球最流行的开源关系型数据库之一，广泛应用于 Web 应用、企业系统和互联网服务中。随着数据量和访问量的增长，数据库性能优化成为构建高可用系统的关键环节。本文将系统性地介绍 MySQL 性能优化的核心技术，从架构原理到实践技巧，帮助开发者打造高性能的数据库应用。

## MySQL 架构与存储引擎

### MySQL 整体架构

MySQL 采用分层架构设计，主要包含以下几个核心层次：

```
┌─────────────────────────────────────────────────────────┐
│                    连接层 (Connection Layer)              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  连接管理  │  认证授权  │  线程池  │  连接池         │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    服务层 (Server Layer)                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  SQL接口  │  解析器  │  优化器  │  缓存  │  执行器  │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   存储引擎层 (Storage Engine Layer)       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ InnoDB  │ │ MyISAM  │ │ Memory  │ │ Archive │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│                    文件系统层 (File System)               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  数据文件  │  日志文件  │  配置文件  │  索引文件     │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**连接层**负责处理客户端连接、身份认证和权限校验。每个客户端连接都会分配一个独立的线程来处理请求。

**服务层**是 MySQL 的核心，包含查询解析、优化、缓存和执行等功能。查询优化器会为 SQL 语句生成最优的执行计划。

**存储引擎层**负责数据的存储和提取。MySQL 支持插拔式存储引擎架构，不同的存储引擎具有不同的特性。

### InnoDB 存储引擎深入

InnoDB 是 MySQL 的默认存储引擎，也是生产环境中最常用的引擎，它具备以下核心特性：

```sql
-- 查看当前默认存储引擎
SHOW VARIABLES LIKE 'default_storage_engine';

-- 查看所有支持的存储引擎
SHOW ENGINES;

-- 查看表使用的存储引擎
SHOW TABLE STATUS LIKE 'users'\G
```

**InnoDB 核心特性：**

| 特性 | 说明 |
|-----|------|
| 事务支持 | 完整的 ACID 事务支持 |
| 行级锁 | 支持行级锁定，并发性能好 |
| 外键约束 | 支持外键完整性约束 |
| MVCC | 多版本并发控制，读写互不阻塞 |
| 崩溃恢复 | 自动崩溃恢复能力 |
| 聚簇索引 | 数据按主键顺序存储 |

### InnoDB 内存结构

```sql
-- 查看 InnoDB 缓冲池配置
SHOW VARIABLES LIKE 'innodb_buffer_pool%';

-- 查看缓冲池状态
SHOW STATUS LIKE 'Innodb_buffer_pool%';

-- 推荐配置（通常设置为物理内存的 70-80%）
SET GLOBAL innodb_buffer_pool_size = 8589934592;  -- 8GB
```

**Buffer Pool（缓冲池）** 是 InnoDB 最重要的内存结构，用于缓存数据页和索引页：

```sql
-- 查看缓冲池命中率
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

### Redo Log 与 Undo Log

**Redo Log（重做日志）** 确保事务的持久性，记录数据页的物理修改：

```sql
-- 查看 Redo Log 配置
SHOW VARIABLES LIKE 'innodb_log%';

-- 推荐配置
-- innodb_log_file_size = 1G        -- 单个日志文件大小
-- innodb_log_files_in_group = 2    -- 日志文件组数量
-- innodb_log_buffer_size = 64M     -- 日志缓冲区大小
```

**Undo Log（回滚日志）** 用于事务回滚和 MVCC 实现：

```sql
-- 查看 Undo 相关配置
SHOW VARIABLES LIKE 'innodb_undo%';

-- 查看当前活跃的 Undo 段
SELECT * FROM information_schema.INNODB_METRICS
WHERE NAME LIKE '%undo%';
```

## 索引原理与优化

### B+树索引结构

MySQL InnoDB 使用 B+树作为默认的索引数据结构，这是一种平衡多路搜索树：

```
                        ┌─────────────────┐
                        │   [35, 70]      │  根节点
                        └────────┬────────┘
                   ┌─────────────┼─────────────┐
                   ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │[10,20,30]│  │[40,50,60]│  │[75,80,90]│  分支节点
            └────┬─────┘  └────┬─────┘  └────┬─────┘
                 │             │             │
     ┌───┬───┬───┼───┐   ┌───┬───┬───┐   ┌───┬───┬───┐
     ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼
   ┌───┬───┬───┬───┐   ┌───┬───┬───┐   ┌───┬───┬───┐
   │10 │20 │30 │→  │   │40 │50 │60 │   │75 │80 │90 │  叶子节点
   │   │   │   │   │   │   │   │   │   │   │   │   │  (双向链表)
   └───┴───┴───┴───┘   └───┴───┴───┘   └───┴───┴───┘
```

**B+树的优势：**

1. **磁盘友好**：节点大小与磁盘页对齐，减少 I/O 次数
2. **范围查询高效**：叶子节点通过链表连接，支持高效的范围扫描
3. **查询稳定**：所有查询都要到叶子节点，查询效率稳定
4. **更高的扇出**：非叶子节点不存储数据，可容纳更多键值

### 聚簇索引与二级索引

```sql
-- 创建示例表
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

**聚簇索引（Clustered Index）**：

- InnoDB 中主键索引就是聚簇索引
- 叶子节点存储完整的行数据
- 表数据按主键顺序物理存储

**二级索引（Secondary Index）**：

- 非主键索引都是二级索引
- 叶子节点存储主键值
- 查询时可能需要回表操作

```sql
-- 聚簇索引查询（直接获取数据）
SELECT * FROM users WHERE id = 100;

-- 二级索引查询（可能需要回表）
SELECT * FROM users WHERE username = 'john';
-- 执行过程：1. 在 idx_username 索引中找到 username='john' 对应的 id
--          2. 根据 id 回表查询完整数据

-- 索引覆盖查询（无需回表）
SELECT id, username FROM users WHERE username = 'john';
-- 因为 idx_username 索引已包含 id 和 username，无需回表
```

### 覆盖索引优化

覆盖索引是指索引包含了查询所需的所有列，避免回表操作：

```sql
-- 创建覆盖索引
CREATE INDEX idx_username_email ON users(username, email);

-- 这个查询可以使用覆盖索引
EXPLAIN SELECT username, email FROM users WHERE username = 'john';
-- Extra 列会显示 "Using index"

-- 优化前：需要回表
SELECT id, username, email, age FROM users WHERE username LIKE 'john%';

-- 优化后：创建覆盖索引
CREATE INDEX idx_cover_user ON users(username, email, age);
SELECT id, username, email, age FROM users WHERE username LIKE 'john%';
```

### 联合索引与最左前缀原则

```sql
-- 创建联合索引
CREATE INDEX idx_compound ON orders(user_id, status, created_at);

-- 以下查询可以使用索引：
SELECT * FROM orders WHERE user_id = 100;                           -- 使用索引
SELECT * FROM orders WHERE user_id = 100 AND status = 'paid';       -- 使用索引
SELECT * FROM orders WHERE user_id = 100 AND status = 'paid'
    AND created_at > '2024-01-01';                                  -- 使用索引

-- 以下查询无法使用索引（违反最左前缀）：
SELECT * FROM orders WHERE status = 'paid';                         -- 无法使用
SELECT * FROM orders WHERE created_at > '2024-01-01';               -- 无法使用
SELECT * FROM orders WHERE status = 'paid' AND created_at > '2024-01-01';  -- 无法使用
```

### 索引设计最佳实践

```sql
-- 1. 选择性高的列适合建索引
SELECT
    COUNT(DISTINCT status) / COUNT(*) AS status_selectivity,
    COUNT(DISTINCT user_id) / COUNT(*) AS user_id_selectivity
FROM orders;
-- user_id 选择性更高，更适合建索引

-- 2. 避免过度索引
-- 不好的做法：为每个列都建立索引
CREATE INDEX idx_col1 ON table_name(col1);
CREATE INDEX idx_col2 ON table_name(col2);
CREATE INDEX idx_col3 ON table_name(col3);

-- 更好的做法：根据查询模式建立联合索引
CREATE INDEX idx_composite ON table_name(col1, col2, col3);

-- 3. 前缀索引优化长字符串
-- 对于很长的字符串，使用前缀索引节省空间
CREATE INDEX idx_email_prefix ON users(email(20));

-- 计算最佳前缀长度
SELECT
    COUNT(DISTINCT LEFT(email, 10)) / COUNT(*) AS prefix_10,
    COUNT(DISTINCT LEFT(email, 15)) / COUNT(*) AS prefix_15,
    COUNT(DISTINCT LEFT(email, 20)) / COUNT(*) AS prefix_20,
    COUNT(DISTINCT email) / COUNT(*) AS full_selectivity
FROM users;

-- 4. 使用索引下推（ICP）
-- MySQL 5.6+ 支持索引条件下推
EXPLAIN SELECT * FROM users
WHERE age > 20 AND username LIKE '%test%';
-- Extra: Using index condition
```

## SQL 语句优化

### 查询优化原则

```sql
-- 1. 避免 SELECT *
-- 不推荐
SELECT * FROM users WHERE id = 100;

-- 推荐：只选择需要的列
SELECT id, username, email FROM users WHERE id = 100;

-- 2. 避免在 WHERE 子句中对列进行函数操作
-- 不推荐（无法使用索引）
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- 推荐（可以使用索引）
SELECT * FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

-- 3. 避免隐式类型转换
-- 假设 phone 列是 VARCHAR 类型
-- 不推荐（触发隐式转换，无法使用索引）
SELECT * FROM users WHERE phone = 13800138000;

-- 推荐
SELECT * FROM users WHERE phone = '13800138000';

-- 4. 使用 EXISTS 替代 IN（大数据集时）
-- 不推荐
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- 推荐
SELECT * FROM orders o
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id AND u.status = 'active');

-- 5. 合理使用 LIMIT 分页
-- 不推荐（深分页性能差）
SELECT * FROM orders ORDER BY id LIMIT 1000000, 20;

-- 推荐：延迟关联优化
SELECT o.* FROM orders o
INNER JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 20) t
ON o.id = t.id;

-- 或者使用游标分页
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 20;
```

### JOIN 优化

```sql
-- 1. 确保 JOIN 列有索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_users_id ON users(id);  -- 主键自动有索引

-- 2. 小表驱动大表
-- MySQL 优化器通常会自动选择，但可以使用 STRAIGHT_JOIN 强制指定
SELECT STRAIGHT_JOIN u.*, o.order_no
FROM users u  -- 小表
INNER JOIN orders o ON u.id = o.user_id;  -- 大表

-- 3. 避免过多的 JOIN
-- 不推荐：多表 JOIN 复杂度高
SELECT * FROM a
JOIN b ON a.id = b.a_id
JOIN c ON b.id = c.b_id
JOIN d ON c.id = d.c_id
JOIN e ON d.id = e.d_id;

-- 推荐：拆分为多个简单查询，在应用层组装

-- 4. 查看 JOIN 执行顺序
EXPLAIN FORMAT=JSON
SELECT u.username, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;
```

### 子查询优化

```sql
-- 1. 将相关子查询改写为 JOIN
-- 不推荐：相关子查询
SELECT u.*,
    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count
FROM users u;

-- 推荐：使用 JOIN
SELECT u.*, COALESCE(o.order_count, 0) AS order_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
) o ON u.id = o.user_id;

-- 2. 避免在 WHERE 中使用相关子查询
-- 不推荐
SELECT * FROM products p
WHERE price > (SELECT AVG(price) FROM products WHERE category_id = p.category_id);

-- 推荐
SELECT p.* FROM products p
INNER JOIN (
    SELECT category_id, AVG(price) AS avg_price
    FROM products
    GROUP BY category_id
) avg_t ON p.category_id = avg_t.category_id AND p.price > avg_t.avg_price;
```

## EXPLAIN 执行计划分析

### EXPLAIN 输出解读

```sql
-- 基本用法
EXPLAIN SELECT * FROM users WHERE username = 'john';

-- 详细格式
EXPLAIN FORMAT=JSON SELECT * FROM users WHERE username = 'john';

-- 实际执行统计（MySQL 8.0+）
EXPLAIN ANALYZE SELECT * FROM users WHERE username = 'john';
```

**EXPLAIN 输出列详解：**

| 列名 | 说明 |
|-----|------|
| id | 查询标识符，相同 id 从上到下执行，不同 id 大的先执行 |
| select_type | 查询类型：SIMPLE、PRIMARY、SUBQUERY、DERIVED 等 |
| table | 访问的表名 |
| partitions | 匹配的分区 |
| type | 访问类型（重要！）：从好到差依次为 system > const > eq_ref > ref > range > index > ALL |
| possible_keys | 可能使用的索引 |
| key | 实际使用的索引 |
| key_len | 使用的索引长度 |
| ref | 索引比较的列或常量 |
| rows | 预估扫描行数 |
| filtered | 按条件过滤后的行百分比 |
| Extra | 额外信息 |

### type 访问类型详解

```sql
-- system/const: 最优，主键或唯一索引等值查询
EXPLAIN SELECT * FROM users WHERE id = 1;
-- type: const

-- eq_ref: JOIN 时使用主键或唯一索引
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.id;
-- users 表的 type: eq_ref

-- ref: 非唯一索引等值查询
EXPLAIN SELECT * FROM orders WHERE user_id = 100;
-- type: ref

-- range: 索引范围扫描
EXPLAIN SELECT * FROM orders WHERE created_at > '2024-01-01';
-- type: range

-- index: 索引全扫描
EXPLAIN SELECT id FROM users;
-- type: index

-- ALL: 全表扫描（需要优化！）
EXPLAIN SELECT * FROM users WHERE email LIKE '%@gmail.com';
-- type: ALL
```

### Extra 列重要信息

```sql
-- Using index: 使用覆盖索引，无需回表
EXPLAIN SELECT id, username FROM users WHERE username = 'john';

-- Using where: 存储引擎返回记录后，MySQL 服务层再进行过滤
EXPLAIN SELECT * FROM users WHERE age > 18 AND status = 'active';

-- Using index condition: 使用索引条件下推（ICP）
EXPLAIN SELECT * FROM users WHERE age > 18 AND username LIKE 'john%';

-- Using temporary: 使用临时表（需要关注）
EXPLAIN SELECT DISTINCT username FROM users;

-- Using filesort: 使用文件排序（需要优化）
EXPLAIN SELECT * FROM users ORDER BY created_at;

-- Using join buffer: 使用连接缓冲区
EXPLAIN SELECT * FROM orders o, users u WHERE o.user_id = u.id;
```

### 实战分析示例

```sql
-- 复杂查询分析
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

-- 优化建议：
-- 1. 为 users.created_at 和 users.status 建立复合索引
CREATE INDEX idx_users_status_created ON users(status, created_at);

-- 2. 为 orders.user_id 建立索引
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 3. 考虑使用覆盖索引优化 orders 表查询
CREATE INDEX idx_orders_cover ON orders(user_id, amount);
```

## 慢查询分析与优化

### 开启慢查询日志

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 动态开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL long_query_time = 1;  -- 超过1秒记录
SET GLOBAL log_queries_not_using_indexes = 'ON';  -- 记录未使用索引的查询

-- 在配置文件中永久开启 /etc/my.cnf
-- [mysqld]
-- slow_query_log = 1
-- slow_query_log_file = /var/log/mysql/slow.log
-- long_query_time = 1
-- log_queries_not_using_indexes = 1
```

### 使用 mysqldumpslow 分析

```bash
# 查看慢查询总数
mysqldumpslow -s c /var/log/mysql/slow.log

# 按执行时间排序，显示前10条
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log

# 按平均执行时间排序
mysqldumpslow -s at -t 10 /var/log/mysql/slow.log

# 按查询次数排序
mysqldumpslow -s c -t 10 /var/log/mysql/slow.log
```

### 使用 pt-query-digest 分析

```bash
# 安装 Percona Toolkit
apt-get install percona-toolkit

# 分析慢查询日志
pt-query-digest /var/log/mysql/slow.log

# 生成详细报告
pt-query-digest --report-format=profile /var/log/mysql/slow.log > slow_report.txt

# 对比两个时间段的慢查询
pt-query-digest slow_before.log --review h=localhost,D=review,t=queries \
    --history h=localhost,D=review,t=history
```

### 实时监控慢查询

```sql
-- 查看当前正在执行的查询
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- 查看执行时间超过指定秒数的查询
SELECT * FROM information_schema.PROCESSLIST
WHERE COMMAND != 'Sleep' AND TIME > 10;

-- 使用 Performance Schema 监控
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

## 锁机制与并发控制

### InnoDB 锁类型

```sql
-- 1. 共享锁（S Lock）- 读锁
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE;
-- MySQL 8.0+ 新语法
SELECT * FROM users WHERE id = 1 FOR SHARE;

-- 2. 排他锁（X Lock）- 写锁
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- 3. 意向锁（表级锁）
-- IS（意向共享锁）和 IX（意向排他锁）由数据库自动添加

-- 4. 查看当前锁等待
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
-- MySQL 8.0+
SELECT * FROM performance_schema.data_lock_waits;
```

### 行锁实现原理

InnoDB 的行锁是通过锁定索引项实现的：

```sql
-- 记录锁（Record Lock）：锁定单个索引记录
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- 间隙锁（Gap Lock）：锁定索引记录之间的间隙，防止幻读
-- 假设 age 索引中有值：10, 20, 30
SELECT * FROM users WHERE age = 15 FOR UPDATE;
-- 会锁定 (10, 20) 这个间隙

-- 临键锁（Next-Key Lock）：记录锁 + 间隙锁
-- 默认的锁策略，锁定记录及其之前的间隙
SELECT * FROM users WHERE age >= 20 FOR UPDATE;
-- 会锁定 [20, +无穷) 范围
```

### 死锁检测与处理

```sql
-- 查看死锁日志
SHOW ENGINE INNODB STATUS\G

-- 设置死锁检测
SHOW VARIABLES LIKE 'innodb_deadlock_detect';
SET GLOBAL innodb_deadlock_detect = ON;

-- 设置锁等待超时
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';
SET GLOBAL innodb_lock_wait_timeout = 50;  -- 默认50秒
```

**避免死锁的最佳实践：**

```sql
-- 1. 固定加锁顺序
-- 不好的做法
-- 事务1: UPDATE accounts SET balance = balance - 100 WHERE id = 1;
--        UPDATE accounts SET balance = balance + 100 WHERE id = 2;
-- 事务2: UPDATE accounts SET balance = balance - 100 WHERE id = 2;
--        UPDATE accounts SET balance = balance + 100 WHERE id = 1;

-- 好的做法：按 ID 顺序加锁
-- 事务1和事务2都先更新 ID=1，再更新 ID=2

-- 2. 使用合理的索引减少锁范围
-- 确保 WHERE 条件使用索引，避免全表扫描导致的表锁

-- 3. 减少事务的持有时间
-- 将非数据库操作移到事务外部

-- 4. 批量操作时分批处理
-- 不推荐：一次性更新大量数据
UPDATE orders SET status = 'expired' WHERE created_at < '2020-01-01';

-- 推荐：分批更新
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
        -- 适当休眠，减少锁竞争
        DO SLEEP(0.1);
    END WHILE;
END //
DELIMITER ;
```

### 事务隔离级别

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;  -- MySQL 8.0+
SELECT @@tx_isolation;           -- MySQL 5.7

-- 设置隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 隔离级别说明
-- READ UNCOMMITTED: 可读取未提交数据，存在脏读
-- READ COMMITTED: 只读取已提交数据，解决脏读
-- REPEATABLE READ: 可重复读（MySQL 默认），通过 MVCC + 间隙锁解决幻读
-- SERIALIZABLE: 串行化，最高隔离级别，性能最差
```

## 分库分表

### 分库分表策略

当单表数据量超过千万级别或单库连接数不足时，需要考虑分库分表：

```
分库分表策略：

1. 垂直分库：按业务模块拆分
   用户数据库 → users, user_profiles, user_settings
   订单数据库 → orders, order_items, payments
   商品数据库 → products, categories, inventory

2. 垂直分表：按列拆分（冷热数据分离）
   users_basic → id, username, email, phone
   users_detail → user_id, address, bio, avatar

3. 水平分库：相同结构的库，数据按规则分散
   db_0: orders (user_id % 4 = 0)
   db_1: orders (user_id % 4 = 1)
   db_2: orders (user_id % 4 = 2)
   db_3: orders (user_id % 4 = 3)

4. 水平分表：相同库下按规则拆分表
   orders_0, orders_1, orders_2, orders_3
```

### 分片键选择

```sql
-- 常见分片策略

-- 1. 哈希分片
-- 路由规则: table_index = hash(user_id) % table_count
-- 优点：数据分布均匀
-- 缺点：扩容困难，需要数据迁移

-- 2. 范围分片
-- 路由规则:
--   table_0: id 1-1000000
--   table_1: id 1000001-2000000
-- 优点：方便扩容
-- 缺点：可能存在热点问题

-- 3. 时间分片
-- 路由规则: table_name = orders_2024_01, orders_2024_02
-- 优点：便于历史数据归档
-- 缺点：近期数据可能是热点

-- 4. 一致性哈希
-- 解决哈希分片扩容问题
-- 使用虚拟节点实现数据均匀分布
```

### ShardingSphere 实战

```yaml
# ShardingSphere-JDBC 配置示例
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

### 分布式 ID 生成

```sql
-- 雪花算法（Snowflake）结构
-- 64位 = 1位符号位 + 41位时间戳 + 10位机器ID + 12位序列号

-- 1. 数据库自增ID（不推荐用于分布式）
-- 问题：各分片ID会重复

-- 2. 号段模式
CREATE TABLE id_generator (
    biz_type VARCHAR(50) PRIMARY KEY,
    max_id BIGINT NOT NULL,
    step INT NOT NULL DEFAULT 1000,
    version INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 获取号段
UPDATE id_generator
SET max_id = max_id + step, version = version + 1
WHERE biz_type = 'order' AND version = #{version};

-- 3. Redis INCR
-- INCR order:id

-- 4. 使用 UUID（不推荐作为主键，索引效率低）
SELECT UUID();  -- 36字符
SELECT REPLACE(UUID(), '-', '');  -- 32字符
```

## 读写分离

### 读写分离架构

```
                    ┌─────────────────┐
                    │   Application   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Proxy/Driver  │  (ShardingSphere/MyCat/ProxySQL)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  Master  │   │  Slave1  │   │  Slave2  │
       │  (写)    │──▶│  (读)    │   │  (读)    │
       └──────────┘   └──────────┘   └──────────┘
              │              ▲              ▲
              └──────────────┴──────────────┘
                      主从复制
```

### MySQL 主从复制配置

```sql
-- Master 配置 (/etc/my.cnf)
-- [mysqld]
-- server-id = 1
-- log-bin = mysql-bin
-- binlog-format = ROW
-- sync_binlog = 1
-- gtid_mode = ON
-- enforce_gtid_consistency = ON

-- 创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'replication_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- 查看 Master 状态
SHOW MASTER STATUS;

-- Slave 配置 (/etc/my.cnf)
-- [mysqld]
-- server-id = 2
-- relay-log = relay-bin
-- read_only = 1
-- gtid_mode = ON
-- enforce_gtid_consistency = ON

-- Slave 上配置主从
CHANGE MASTER TO
    MASTER_HOST = 'master_host',
    MASTER_USER = 'repl',
    MASTER_PASSWORD = 'replication_password',
    MASTER_AUTO_POSITION = 1;  -- 使用 GTID

-- 启动复制
START SLAVE;

-- 查看复制状态
SHOW SLAVE STATUS\G
```

### 处理主从延迟

```sql
-- 监控主从延迟
SHOW SLAVE STATUS\G
-- 关注 Seconds_Behind_Master 字段

-- 使用 pt-heartbeat 监控延迟
-- 在 Master 上运行
pt-heartbeat -D test --create-table --update --daemonize

-- 在 Slave 上运行
pt-heartbeat -D test --monitor

-- 解决主从延迟的方案：

-- 1. 强制走主库（关键业务）
-- 在应用层标记需要走主库的查询

-- 2. 等待 GTID 同步
-- MySQL 5.7+
SELECT WAIT_FOR_EXECUTED_GTID_SET('gtid_set', timeout);

-- 3. 半同步复制
-- Master 配置
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 10000;  -- 10秒

-- Slave 配置
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';
SET GLOBAL rpl_semi_sync_slave_enabled = 1;
```

### 读写分离中间件配置

```yaml
# ShardingSphere 读写分离配置
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

## 监控与诊断工具

### Performance Schema

```sql
-- 启用 Performance Schema
-- 在 my.cnf 中配置
-- performance_schema = ON

-- 查看配置的 instruments
SELECT * FROM performance_schema.setup_instruments
WHERE NAME LIKE '%statement%';

-- 启用语句监控
UPDATE performance_schema.setup_instruments
SET ENABLED = 'YES', TIMED = 'YES'
WHERE NAME LIKE 'statement/%';

-- 查看最耗时的 SQL
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

-- 查看表 I/O 统计
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

-- 查看索引使用情况
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

### sys Schema 诊断

```sql
-- MySQL 5.7+ 内置 sys schema

-- 查看未使用的索引
SELECT * FROM sys.schema_unused_indexes;

-- 查看冗余索引
SELECT * FROM sys.schema_redundant_indexes;

-- 查看等待事件
SELECT * FROM sys.wait_classes_global_by_avg_latency;

-- 查看最消耗资源的 SQL
SELECT * FROM sys.statements_with_runtimes_in_95th_percentile;

-- 查看全表扫描的语句
SELECT * FROM sys.statements_with_full_table_scans;

-- 查看使用临时表的语句
SELECT * FROM sys.statements_with_temp_tables;

-- 查看 I/O 最多的表
SELECT * FROM sys.io_global_by_file_by_bytes LIMIT 10;

-- 查看内存使用情况
SELECT * FROM sys.memory_global_by_current_bytes;

-- 查看用户统计
SELECT * FROM sys.user_summary;
```

### 常用监控命令

```sql
-- 查看服务器状态
SHOW GLOBAL STATUS;

-- 重要的状态变量
SHOW GLOBAL STATUS LIKE 'Threads_%';
SHOW GLOBAL STATUS LIKE 'Connections';
SHOW GLOBAL STATUS LIKE 'Queries';
SHOW GLOBAL STATUS LIKE 'Slow_queries';
SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_%';
SHOW GLOBAL STATUS LIKE 'Handler_%';

-- 查看连接数
SHOW STATUS LIKE 'Max_used_connections';
SHOW VARIABLES LIKE 'max_connections';

-- QPS 和 TPS 计算
-- QPS = Queries / Uptime
-- TPS = (Com_commit + Com_rollback) / Uptime

-- 查看表的大小
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

### Prometheus + Grafana 监控

```yaml
# mysqld_exporter 配置
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
-- 创建监控用户
CREATE USER 'exporter'@'%' IDENTIFIED BY 'password';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
```

## 面试要点

### 高频面试题

**1. MySQL 索引相关**

```markdown
Q: 为什么 MySQL 使用 B+树而不是 B树或哈希索引？

A:
- B+树叶子节点通过链表连接，支持高效范围查询
- B+树非叶子节点不存储数据，单节点可存储更多键，树更矮
- B+树查询稳定，所有查询都要到叶子节点
- 哈希索引不支持范围查询和排序

Q: 什么情况下索引会失效？

A:
- 在索引列上使用函数或表达式
- 隐式类型转换
- LIKE 以 % 开头
- OR 条件中有非索引列
- 违反最左前缀原则
- 优化器判断全表扫描更快
```

**2. 事务与锁**

```markdown
Q: MySQL 如何解决幻读问题？

A:
- 在 REPEATABLE READ 级别下，InnoDB 使用 MVCC + 间隙锁解决幻读
- MVCC 通过 Read View 保证快照读的一致性
- 间隙锁防止其他事务在锁定范围内插入新记录

Q: 什么情况下行锁会升级为表锁？

A:
- 更新条件没有使用索引，导致全表扫描
- 索引字段发生隐式类型转换
- 对表执行 DDL 操作
```

**3. 主从复制**

```markdown
Q: MySQL 主从复制原理是什么？

A:
1. Master 将数据变更写入 binlog
2. Slave 的 I/O 线程读取 Master 的 binlog，写入本地 relay log
3. Slave 的 SQL 线程重放 relay log 中的事件

Q: 如何解决主从延迟？

A:
- 使用并行复制（MySQL 5.7+）
- 关键业务强制走主库
- 使用半同步复制保证数据一致性
- 业务层面通过 GTID 等待机制
```

**4. 分库分表**

```markdown
Q: 分库分表后如何进行跨库 JOIN？

A:
- 尽量避免跨库 JOIN，通过冗余数据解决
- 使用全局表（广播表）存储小的、经常需要关联的表
- 在应用层进行数据组装
- 使用分布式数据库中间件支持

Q: 分库分表后如何保证全局唯一 ID？

A:
- 雪花算法（Snowflake）
- 号段模式（数据库号段 + 本地缓存）
- Redis INCR
- UUID（不推荐作为主键）
```

### 性能优化核查清单

```markdown
## SQL 优化检查项
- [ ] 是否存在 SELECT *
- [ ] WHERE 条件是否可以使用索引
- [ ] JOIN 操作是否有合适的索引
- [ ] 是否有深分页问题
- [ ] 是否存在不必要的子查询
- [ ] ORDER BY 是否可以利用索引

## 索引优化检查项
- [ ] 是否存在冗余索引
- [ ] 是否存在未使用的索引
- [ ] 联合索引顺序是否合理
- [ ] 索引区分度是否足够
- [ ] 是否考虑了覆盖索引

## 架构优化检查项
- [ ] 是否需要读写分离
- [ ] 是否需要分库分表
- [ ] 缓存策略是否合理
- [ ] 连接池配置是否合理
- [ ] 是否有慢查询监控
```

### 常见配置优化

```ini
# my.cnf 推荐配置

[mysqld]
# 基础配置
max_connections = 500
max_connect_errors = 1000
wait_timeout = 600
interactive_timeout = 600

# InnoDB 配置
innodb_buffer_pool_size = 8G          # 物理内存的 70-80%
innodb_buffer_pool_instances = 8       # 缓冲池实例数
innodb_log_file_size = 1G             # Redo Log 文件大小
innodb_log_buffer_size = 64M          # Log 缓冲区大小
innodb_flush_log_at_trx_commit = 1    # 事务提交时刷盘策略
innodb_flush_method = O_DIRECT        # 刷盘方式

# 查询缓存（MySQL 8.0 已移除）
# query_cache_type = 0
# query_cache_size = 0

# 日志配置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = 1

# 复制配置
server_id = 1
log_bin = mysql-bin
binlog_format = ROW
sync_binlog = 1
gtid_mode = ON
enforce_gtid_consistency = ON
```

## 总结

MySQL 性能优化是一个系统工程，需要从多个维度进行考量：

1. **SQL 层面**：编写高效的 SQL，避免常见的性能陷阱
2. **索引层面**：合理设计索引，利用覆盖索引减少回表
3. **架构层面**：读写分离、分库分表应对高并发场景
4. **配置层面**：根据硬件资源合理配置 MySQL 参数
5. **监控层面**：建立完善的监控体系，及时发现性能问题

性能优化没有银弹，需要根据具体的业务场景和数据特点，选择合适的优化策略。建议在优化前进行充分的测试和验证，确保优化方案的有效性和稳定性。

掌握这些 MySQL 优化技术，将帮助你构建更加高效、稳定的数据库应用，在面试和实际工作中都能游刃有余地应对各种数据库性能挑战。
