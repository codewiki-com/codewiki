---
title: 数据库设计完全指南
description: 掌握数据库设计原则与方法，构建高效的数据存储方案
track: backend
section: databases
difficulty: intermediate
tags:
  - 数据库设计
  - 范式
  - ER图
  - 数据建模
status: imported
origin: old/src/content/docs/architecture/database-design.zh.md
divergence: 0.214
issues: []
legacy:
  category: Architecture
  subcategory: Database
  order: 13
  lastUpdated: 2026-01-07
---

数据库设计是软件开发中最关键的环节之一。一个优秀的数据库设计不仅能够高效存储和检索数据，还能保证数据的一致性、完整性和可扩展性。本文将深入探讨数据库设计的核心原则、方法论和最佳实践。

## 什么是数据库设计

数据库设计是指根据业务需求，设计数据库的逻辑结构和物理结构的过程。它涉及到：

- **概念设计**：使用 ER 图等工具描述业务实体及其关系
- **逻辑设计**：将概念模型转换为关系模型，应用范式化
- **物理设计**：确定存储结构、索引策略、分区方案
- **实施与优化**：创建数据库对象，进行性能调优

数据库设计的质量直接影响系统的性能、可维护性和扩展性。一个设计良好的数据库可以支撑系统运行多年，而设计不当的数据库则会成为系统演进的沉重包袱。

## 数据库设计流程

### 完整设计流程

```
┌─────────────────────────────────────────────────────────────┐
│                     数据库设计流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ 需求分析  │──▶│ 概念设计  │──▶│ 逻辑设计  │──▶│ 物理设计  │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│       │              │              │              │        │
│       ▼              ▼              ▼              ▼        │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │业务流程图 │   │  ER 图   │   │关系模式  │   │DDL脚本   │ │
│  │数据字典  │   │概念模型  │   │范式化    │   │索引策略  │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 第一步：需求分析

需求分析是数据库设计的起点，需要充分理解业务需求：

**功能性需求**：
- 系统需要存储哪些数据？
- 数据之间存在什么关系？
- 需要支持哪些查询操作？
- 数据的增删改频率如何？

**非功能性需求**：
- 数据量预估（现有及未来增长）
- 并发访问量
- 响应时间要求
- 数据保留策略

```typescript
// 需求分析示例：电商系统
interface RequirementAnalysis {
  // 核心实体
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

  // 核心查询
  criticalQueries: [
    '根据用户ID查询订单列表',
    '根据时间范围统计销售额',
    '根据商品类别查询热销商品',
    '用户登录验证'
  ],

  // 性能要求
  performance: {
    readLatency: 'P99 < 50ms',
    writeLatency: 'P99 < 100ms',
    availability: '99.9%'
  }
}
```

### 第二步：概念设计

概念设计阶段使用 ER 图（实体-关系图）描述数据模型：

```
┌─────────────────────────────────────────────────────────────┐
│                      电商系统 ER 图                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐      places      ┌──────────┐                │
│  │   User   │─────────────────▶│  Order   │                │
│  │──────────│   1         *    │──────────│                │
│  │ id (PK)  │                  │ id (PK)  │                │
│  │ username │                  │ user_id  │                │
│  │ email    │                  │ total    │                │
│  │ password │                  │ status   │                │
│  │ created  │                  │ created  │                │
│  └──────────┘                  └──────────┘                │
│                                     │                       │
│                                     │ contains              │
│                                     │ 1                     │
│                                     ▼ *                     │
│  ┌──────────┐     belongs     ┌──────────────┐             │
│  │ Category │◀───────────────│  OrderItem   │             │
│  │──────────│   1         *   │──────────────│             │
│  │ id (PK)  │                 │ id (PK)      │             │
│  │ name     │                 │ order_id     │             │
│  │ parent_id│                 │ product_id   │             │
│  └──────────┘                 │ quantity     │             │
│       │                       │ price        │             │
│       │ has                   └──────────────┘             │
│       │ 1                           │                      │
│       ▼ *                           │ references           │
│  ┌──────────┐                       │ *                    │
│  │ Product  │◀──────────────────────┘ 1                    │
│  │──────────│                                              │
│  │ id (PK)  │                                              │
│  │ name     │                                              │
│  │ price    │                                              │
│  │ stock    │                                              │
│  │ cat_id   │                                              │
│  └──────────┘                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 第三步：逻辑设计

将 ER 图转换为关系模式，并进行范式化处理：

```sql
-- 用户表
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

-- 商品分类表（支持层级结构）
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

-- 商品表
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

-- 订单表
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

-- 订单项表
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

### 第四步：物理设计

物理设计关注存储效率和访问性能：

```sql
-- 表分区示例：按时间分区订单表
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

## 数据库范式详解

数据库范式是评价关系模式设计优劣的标准。范式化的目的是消除数据冗余，避免插入、更新、删除异常。

### 第一范式（1NF）

**定义**：关系中的每个属性都是不可再分的原子值。

**违反 1NF 的例子**：

```
// 错误设计：联系方式字段包含多个值
┌────────┬──────────────────────────┐
│ 用户ID │        联系方式           │
├────────┼──────────────────────────┤
│   1    │ 138xxx, 139xxx, xxx@qq   │
│   2    │ 137xxx, yyy@gmail        │
└────────┴──────────────────────────┘
```

**符合 1NF 的设计**：

```sql
-- 方案1：拆分为多个字段
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(100)
);

-- 方案2：使用关联表（更灵活）
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

### 第二范式（2NF）

**定义**：在 1NF 基础上，非主属性完全函数依赖于候选键（消除部分依赖）。

**违反 2NF 的例子**：

```
// 错误设计：学生选课表存在部分依赖
┌────────┬────────┬──────────┬──────────┬──────────┐
│ 学生ID │ 课程ID │  学生姓名 │  课程名称 │   成绩    │
├────────┼────────┼──────────┼──────────┼──────────┤
│   1    │  101   │   张三    │  数据库   │   85     │
│   1    │  102   │   张三    │  操作系统 │   90     │
│   2    │  101   │   李四    │  数据库   │   78     │
└────────┴────────┴──────────┴──────────┴──────────┘

分析：
- 主键：(学生ID, 课程ID)
- 学生姓名 只依赖于 学生ID（部分依赖）
- 课程名称 只依赖于 课程ID（部分依赖）
- 成绩 依赖于 (学生ID, 课程ID)（完全依赖）
```

**符合 2NF 的设计**：

```sql
-- 学生表
CREATE TABLE students (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 课程表
CREATE TABLE courses (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 选课表（只保留完全依赖于主键的属性）
CREATE TABLE enrollments (
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    score DECIMAL(5, 2),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

### 第三范式（3NF）

**定义**：在 2NF 基础上，非主属性不传递依赖于候选键（消除传递依赖）。

**违反 3NF 的例子**：

```
// 错误设计：员工表存在传递依赖
┌────────┬──────────┬────────┬──────────┬──────────┐
│ 员工ID │  员工姓名 │ 部门ID │  部门名称 │ 部门经理  │
├────────┼──────────┼────────┼──────────┼──────────┤
│   1    │   张三    │   10   │  研发部  │   王总    │
│   2    │   李四    │   10   │  研发部  │   王总    │
│   3    │   王五    │   20   │  市场部  │   李总    │
└────────┴──────────┴────────┴──────────┴──────────┘

分析：
- 主键：员工ID
- 员工ID → 部门ID → 部门名称（传递依赖）
- 员工ID → 部门ID → 部门经理（传递依赖）
```

**符合 3NF 的设计**：

```sql
-- 部门表
CREATE TABLE departments (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(50)
);

-- 员工表
CREATE TABLE employees (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department_id BIGINT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

### BC范式（BCNF）

**定义**：在 3NF 基础上，每个决定因素都是候选键。

**违反 BCNF 的例子**：

```
// 场景：一个学生可以选多门课，每门课有多个老师，
// 但每个老师只教一门课，一个学生一门课只能选一个老师

┌────────┬────────┬────────┐
│ 学生ID │ 课程ID │ 教师ID │
├────────┼────────┼────────┤
│   1    │  数学  │  T1    │
│   1    │  物理  │  T2    │
│   2    │  数学  │  T1    │
└────────┴────────┴────────┘

分析：
- 候选键：(学生ID, 课程ID) 或 (学生ID, 教师ID)
- 函数依赖：教师ID → 课程ID
- 教师ID 不是候选键，但它决定了课程ID，违反 BCNF
```

**符合 BCNF 的设计**：

```sql
-- 教师-课程关系表
CREATE TABLE teacher_courses (
    teacher_id BIGINT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 学生选课表
CREATE TABLE student_teachers (
    student_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    PRIMARY KEY (student_id, teacher_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (teacher_id) REFERENCES teacher_courses(teacher_id)
);
```

### 范式总结

```
┌─────────────────────────────────────────────────────────────┐
│                      范式层级关系                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                      BCNF                            │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │                    3NF                         │  │   │
│  │  │  ┌─────────────────────────────────────────┐  │  │   │
│  │  │  │                  2NF                     │  │  │   │
│  │  │  │  ┌───────────────────────────────────┐  │  │  │   │
│  │  │  │  │                1NF                 │  │  │  │   │
│  │  │  │  │        属性不可再分                 │  │  │  │   │
│  │  │  │  └───────────────────────────────────┘  │  │  │   │
│  │  │  │          消除部分依赖                    │  │  │   │
│  │  │  └─────────────────────────────────────────┘  │  │   │
│  │  │            消除传递依赖                        │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │              每个决定因素都是候选键                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 反范式化设计

虽然范式化能消除数据冗余，但在实际应用中，有时需要适当的反范式化来提升查询性能。

### 什么时候需要反范式化

1. **查询性能优先**：频繁的多表 JOIN 影响性能
2. **读多写少**：数据更新不频繁
3. **数据一致性要求可适当放宽**：允许短暂的数据不一致

### 常见反范式化技术

#### 冗余列

```sql
-- 范式化设计：需要 JOIN 获取用户名
CREATE TABLE orders_normalized (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12, 2)
);

-- 查询订单列表需要 JOIN
SELECT o.id, o.total_amount, u.username
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > '2024-01-01';

-- 反范式化设计：冗余存储用户名
CREATE TABLE orders_denormalized (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,  -- 冗余字段
    total_amount DECIMAL(12, 2)
);

-- 查询订单列表无需 JOIN
SELECT id, total_amount, username
FROM orders_denormalized
WHERE created_at > '2024-01-01';
```

#### 派生列

```sql
-- 范式化设计：订单总金额需要计算
CREATE TABLE orders (
    id BIGINT PRIMARY KEY
    -- total_amount 不存储，每次查询时计算
);

SELECT o.id, SUM(oi.quantity * oi.unit_price) as total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- 反范式化设计：存储派生值
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    total_amount DECIMAL(12, 2) NOT NULL,  -- 派生字段
    item_count INT NOT NULL DEFAULT 0       -- 派生字段
);

-- 通过触发器或应用层维护派生值
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

#### 汇总表

```sql
-- 销售统计汇总表
CREATE TABLE sales_daily_summary (
    date DATE PRIMARY KEY,
    total_orders INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    avg_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    new_customers INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
);

-- 定时任务更新汇总数据
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

### 反范式化的权衡

```typescript
interface DenormalizationTradeoff {
  pros: [
    '减少 JOIN 操作，提升查询性能',
    '简化查询语句',
    '降低数据库负载'
  ],
  cons: [
    '数据冗余增加存储成本',
    '更新操作更复杂',
    '可能出现数据不一致',
    '维护成本增加'
  ],
  bestPractices: [
    '在应用层或触发器中维护数据一致性',
    '使用事务保证原子性更新',
    '定期校验和修复数据',
    '文档化冗余字段及其维护逻辑'
  ]
}
```

## 主键与外键设计

### 主键设计策略

#### 自增主键

```sql
-- 自增主键：简单高效
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL
);

-- 优点：有序、紧凑、性能好
-- 缺点：分布式环境下难以保证唯一性，可预测
```

#### UUID

```sql
-- UUID 主键
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,  -- 或使用 BINARY(16) 存储
    username VARCHAR(50) NOT NULL
);

-- 应用层生成 UUID
-- 优点：全局唯一，不可预测
-- 缺点：存储空间大，无序导致索引性能差
```

#### 雪花算法（Snowflake）

```typescript
/**
 * 雪花算法生成分布式唯一ID
 * 64位结构：1位符号 + 41位时间戳 + 10位机器ID + 12位序列号
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

// 使用示例
const idGenerator = new SnowflakeIdGenerator(1);
const orderId = idGenerator.nextId();
console.log(orderId.toString()); // 如：1234567890123456789
```

```sql
-- 使用雪花ID作为主键
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,  -- 雪花算法生成
    order_no VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL
);
```

### 外键设计

```sql
-- 外键约束
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,

    -- 外键约束
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

#### 外键策略选择

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| RESTRICT | 禁止删除/更新父表记录 | 强引用完整性 |
| CASCADE | 级联删除/更新子表记录 | 父子强关联 |
| SET NULL | 设置外键为 NULL | 弱关联 |
| NO ACTION | 延迟检查（事务结束时） | 复杂事务场景 |

#### 是否使用外键约束

```typescript
// 外键约束的权衡
interface ForeignKeyConsideration {
  withConstraint: {
    pros: [
      '数据库层面保证引用完整性',
      '自动级联更新/删除',
      '数据模型更清晰'
    ],
    cons: [
      '影响写入性能（需要额外检查）',
      '批量操作受限',
      '跨库场景无法使用'
    ]
  },
  withoutConstraint: {
    pros: [
      '更好的写入性能',
      '更灵活的批量操作',
      '支持分库分表'
    ],
    cons: [
      '需要应用层保证完整性',
      '可能出现孤儿数据',
      '维护成本增加'
    ]
  }
}

// 实践建议
// - 核心业务表使用外键约束
// - 日志、历史记录表不使用外键
// - 分布式系统使用应用层约束
```

## 索引设计原则

### 索引类型

```sql
-- 1. B+Tree 索引（默认）
CREATE INDEX idx_user_email ON users(email);

-- 2. 唯一索引
CREATE UNIQUE INDEX uk_user_username ON users(username);

-- 3. 复合索引
CREATE INDEX idx_order_user_status ON orders(user_id, status, created_at);

-- 4. 全文索引
CREATE FULLTEXT INDEX ft_product_name ON products(name, description);

-- 5. 前缀索引
CREATE INDEX idx_user_email_prefix ON users(email(20));

-- 6. 覆盖索引（通过复合索引实现）
-- 查询的所有列都在索引中，无需回表
CREATE INDEX idx_covering ON orders(user_id, status, total_amount);
-- 可以高效执行：SELECT status, total_amount FROM orders WHERE user_id = 1;
```

### 最左前缀原则

```sql
-- 复合索引 (a, b, c)
CREATE INDEX idx_abc ON table_name(a, b, c);

-- 可以使用索引的查询：
WHERE a = 1                      -- 使用 a
WHERE a = 1 AND b = 2            -- 使用 a, b
WHERE a = 1 AND b = 2 AND c = 3  -- 使用 a, b, c
WHERE a = 1 AND c = 3            -- 只使用 a
WHERE a = 1 ORDER BY b           -- 使用 a，排序使用 b

-- 无法使用索引的查询：
WHERE b = 2                      -- 不满足最左前缀
WHERE b = 2 AND c = 3            -- 不满足最左前缀
WHERE c = 3                      -- 不满足最左前缀
```

### 索引设计最佳实践

```sql
-- 1. 区分度高的列放前面
-- 假设 status 只有 5 种值，user_id 有 100 万种值
-- 推荐：
CREATE INDEX idx_user_status ON orders(user_id, status);
-- 不推荐：
CREATE INDEX idx_status_user ON orders(status, user_id);

-- 2. 覆盖常用查询
-- 常用查询：SELECT id, status, total_amount FROM orders WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX idx_user_covering ON orders(user_id, created_at DESC, status, total_amount);

-- 3. 避免冗余索引
-- 有了 (a, b, c) 就不需要 (a) 和 (a, b)
-- 冗余：
CREATE INDEX idx_a ON t(a);      -- 冗余
CREATE INDEX idx_ab ON t(a, b);  -- 冗余
CREATE INDEX idx_abc ON t(a, b, c);

-- 4. 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM orders WHERE user_id = 1 AND status = 'paid';
```

### 索引失效场景

```sql
-- 1. 函数或表达式操作
WHERE YEAR(created_at) = 2024          -- 索引失效
WHERE created_at >= '2024-01-01'       -- 使用索引

-- 2. 类型转换
WHERE user_id = '123'                  -- 隐式转换，可能失效
WHERE user_id = 123                    -- 正确

-- 3. LIKE 前缀模糊匹配
WHERE name LIKE '%test%'               -- 索引失效
WHERE name LIKE 'test%'                -- 使用索引

-- 4. OR 条件（除非所有条件都有索引）
WHERE status = 1 OR type = 2           -- 可能失效
WHERE status = 1 AND type = 2          -- 使用索引

-- 5. NOT 条件
WHERE status != 'deleted'              -- 通常不使用索引
WHERE status IN ('active', 'pending')  -- 使用索引

-- 6. NULL 判断
WHERE deleted_at IS NULL               -- 取决于数据库版本和配置
```

## SQL vs NoSQL 选型

### 对比分析

```
┌─────────────────────────────────────────────────────────────┐
│                    SQL vs NoSQL 对比                         │
├────────────┬─────────────────────┬─────────────────────────┤
│    特性    │        SQL          │        NoSQL            │
├────────────┼─────────────────────┼─────────────────────────┤
│ 数据模型   │ 关系型、表结构       │ 文档/键值/列族/图       │
│ Schema     │ 固定结构            │ 灵活结构                │
│ 扩展方式   │ 主要纵向扩展        │ 横向扩展为主            │
│ 事务支持   │ ACID 完整支持       │ 有限支持（部分 BASE）    │
│ 查询能力   │ SQL、复杂查询       │ 简单查询为主            │
│ 一致性     │ 强一致性            │ 最终一致性为主          │
│ 典型代表   │ MySQL/PostgreSQL    │ MongoDB/Redis/Cassandra │
└────────────┴─────────────────────┴─────────────────────────┘
```

### 选型指南

```typescript
interface DatabaseSelectionGuide {
  useSQL: {
    scenarios: [
      '复杂事务处理（银行、电商订单）',
      '数据关系复杂，需要多表 JOIN',
      '需要强一致性',
      '数据结构相对固定',
      '复杂的报表和分析查询'
    ],
    examples: ['用户账户系统', '订单管理系统', '库存管理']
  },

  useNoSQL: {
    scenarios: [
      '海量数据存储',
      '高并发读写',
      '数据结构多变',
      '需要快速水平扩展',
      '简单的键值查询'
    ],
    examples: ['用户行为日志', '商品目录', '实时计数器', '会话存储']
  },

  hybridApproach: {
    pattern: '主数据用 SQL，辅助数据用 NoSQL',
    example: {
      MySQL: '用户、订单、支付等核心业务数据',
      Redis: '缓存、会话、排行榜',
      MongoDB: '商品描述、用户画像等灵活结构数据',
      Elasticsearch: '搜索、日志分析'
    }
  }
}
```

### NoSQL 类型选择

```typescript
// 键值数据库（Redis）
// 适用：缓存、会话、计数器
interface KeyValueUseCase {
  example: `
    // 用户会话存储
    SET session:user:123 '{"userId":123,"role":"admin"}'
    EXPIRE session:user:123 3600

    // 分布式锁
    SET lock:order:456 1 NX EX 30

    // 计数器
    INCR page:view:article:789
  `
}

// 文档数据库（MongoDB）
// 适用：灵活结构、嵌套数据
interface DocumentUseCase {
  example: `
    // 商品信息（不同类型有不同属性）
    {
      "_id": ObjectId("..."),
      "name": "iPhone 15",
      "category": "electronics",
      "price": 5999,
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

// 列族数据库（Cassandra/HBase）
// 适用：时序数据、海量写入
interface ColumnFamilyUseCase {
  example: `
    // 用户行为日志
    CREATE TABLE user_events (
      user_id UUID,
      event_time TIMESTAMP,
      event_type TEXT,
      event_data TEXT,
      PRIMARY KEY ((user_id), event_time)
    ) WITH CLUSTERING ORDER BY (event_time DESC);
  `
}

// 图数据库（Neo4j）
// 适用：社交关系、推荐系统
interface GraphUseCase {
  example: `
    // 社交关系
    MATCH (a:Person)-[:FRIENDS_WITH]->(b:Person)
          -[:FRIENDS_WITH]->(c:Person)
    WHERE a.name = 'Alice' AND NOT (a)-[:FRIENDS_WITH]->(c)
    RETURN c.name AS RecommendedFriend
  `
}
```

## 数据库架构模式

### 单库架构

```
┌─────────────────────────────────────────────────────────────┐
│                      单库架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │  App 1   │   │  App 2   │   │  App 3   │                │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘                │
│       │              │              │                       │
│       └──────────────┼──────────────┘                       │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │   Database   │                               │
│              │  (单实例)    │                               │
│              └──────────────┘                               │
│                                                             │
│  优点：简单、事务支持好、运维成本低                           │
│  缺点：扩展性差、单点故障、性能瓶颈                           │
│  适用：小规模应用、创业初期                                   │
└─────────────────────────────────────────────────────────────┘
```

### 主从复制

```
┌─────────────────────────────────────────────────────────────┐
│                     主从复制架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐     ┌─────────────────────┐       │
│  │      应用服务       │     │      应用服务       │        │
│  └─────────┬───────────┘     └──────────┬──────────┘        │
│            │                            │                   │
│       写操作│                       读操作│                   │
│            ▼                            ▼                   │
│  ┌─────────────────┐     复制    ┌─────────────────┐       │
│  │    Master       │────────────▶│    Slave 1      │       │
│  │   (主库/写)     │             │   (从库/读)     │        │
│  └─────────────────┘             └─────────────────┘       │
│            │                                                │
│            │ 复制                                           │
│            ▼                                                │
│  ┌─────────────────┐                                       │
│  │    Slave 2      │                                       │
│  │   (从库/读)     │                                        │
│  └─────────────────┘                                       │
│                                                             │
│  优点：读写分离、提高读性能、数据备份                         │
│  缺点：复制延迟、写性能未提升、主库仍是瓶颈                    │
└─────────────────────────────────────────────────────────────┘
```

```typescript
// 读写分离实现
class DatabaseRouter {
  private masterPool: ConnectionPool;
  private slavePool: ConnectionPool;

  constructor(config: DatabaseConfig) {
    this.masterPool = createPool(config.master);
    this.slavePool = createPool(config.slaves);
  }

  async query(sql: string, params: any[], options?: { forceMaster?: boolean }) {
    // 写操作或强制走主库
    if (this.isWriteOperation(sql) || options?.forceMaster) {
      return this.masterPool.query(sql, params);
    }
    // 读操作走从库
    return this.slavePool.query(sql, params);
  }

  private isWriteOperation(sql: string): boolean {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const upperSql = sql.trim().toUpperCase();
    return writeKeywords.some(keyword => upperSql.startsWith(keyword));
  }

  // 处理主从延迟：写后读走主库
  async writeAndRead<T>(
    writeSql: string,
    writeParams: any[],
    readSql: string,
    readParams: any[]
  ): Promise<T> {
    await this.masterPool.query(writeSql, writeParams);
    // 写后立即读，走主库避免延迟问题
    return this.masterPool.query(readSql, readParams);
  }
}
```

### 分库分表

```
┌─────────────────────────────────────────────────────────────┐
│                      分库分表架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────┐              │
│  │               应用服务                    │               │
│  └─────────────────────┬────────────────────┘              │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────┐              │
│  │            分片中间件                     │               │
│  │      (ShardingSphere / Vitess)           │              │
│  └────┬──────────┬──────────┬───────────────┘              │
│       │          │          │                               │
│       ▼          ▼          ▼                               │
│  ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │ DB 0   │ │ DB 1   │ │ DB 2   │                          │
│  ├────────┤ ├────────┤ ├────────┤                          │
│  │user_0  │ │user_1  │ │user_2  │                          │
│  │order_0 │ │order_1 │ │order_2 │                          │
│  └────────┘ └────────┘ └────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 分片策略

```typescript
// 1. 范围分片
class RangeSharding {
  getShardIndex(userId: number): number {
    if (userId < 1000000) return 0;
    if (userId < 2000000) return 1;
    return 2;
  }
  // 问题：数据分布不均匀，热点问题
}

// 2. 哈希分片
class HashSharding {
  private shardCount: number;

  constructor(shardCount: number) {
    this.shardCount = shardCount;
  }

  getShardIndex(userId: number): number {
    return userId % this.shardCount;
  }
  // 优点：数据分布均匀
  // 问题：扩容困难，需要数据迁移
}

// 3. 一致性哈希
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
    // 简化的哈希实现
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

// 4. 分库分表路由示例
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

#### 分库分表挑战

```typescript
interface ShardingChallenges {
  // 1. 跨分片查询
  crossShardQuery: {
    problem: '无法直接 JOIN 不同分片的数据',
    solutions: [
      '应用层聚合',
      '广播查询',
      '使用中间件处理',
      '冗余存储'
    ]
  },

  // 2. 分布式事务
  distributedTransaction: {
    problem: '跨分片事务一致性',
    solutions: [
      '最终一致性（最常用）',
      'TCC 模式',
      'Saga 模式',
      'XA 两阶段提交'
    ]
  },

  // 3. 全局唯一ID
  globalId: {
    problem: '自增 ID 在分片间不唯一',
    solutions: [
      '雪花算法',
      'UUID',
      '号段模式',
      '数据库序列'
    ]
  },

  // 4. 扩容
  scaling: {
    problem: '增加分片需要数据迁移',
    solutions: [
      '一致性哈希减少迁移量',
      '预分片',
      '双写迁移',
      '停机迁移'
    ]
  }
}
```

## 数据迁移策略

### 迁移方案对比

```
┌─────────────────────────────────────────────────────────────┐
│                     数据迁移策略对比                         │
├──────────────┬──────────────────────────────────────────────┤
│    策略      │                    特点                       │
├──────────────┼──────────────────────────────────────────────┤
│   停机迁移   │ 简单可靠，但需要停服务，适合小数据量           │
├──────────────┼──────────────────────────────────────────────┤
│   双写迁移   │ 零停机，但逻辑复杂，需要处理一致性             │
├──────────────┼──────────────────────────────────────────────┤
│   增量同步   │ 使用 binlog 等机制，适合大数据量               │
├──────────────┼──────────────────────────────────────────────┤
│  影子表迁移  │ 在新表写入，逐步切换，回滚容易                 │
└──────────────┴──────────────────────────────────────────────┘
```

### 双写迁移实现

```typescript
/**
 * 双写迁移策略实现
 * 阶段1：双写，读旧库
 * 阶段2：双写，读新库
 * 阶段3：单写新库
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
        // 双写：先写新库，再写旧库
        await this.newDb.write(data);
        try {
          await this.oldDb.write(data);
        } catch (error) {
          // 旧库写入失败，记录日志但不影响主流程
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

  // 数据校验
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

### 迁移最佳实践

```typescript
interface MigrationBestPractices {
  preparation: [
    '评估数据量和迁移时间',
    '准备回滚方案',
    '创建数据备份',
    '准备数据校验工具',
    '通知相关方预计影响'
  ],

  execution: [
    '选择低峰期执行',
    '分批次迁移，控制每批数量',
    '监控系统性能指标',
    '保留详细日志',
    '设置告警机制'
  ],

  verification: [
    '数据完整性校验',
    '数据一致性校验',
    '业务功能验证',
    '性能对比测试'
  ],

  rollback: [
    '定义回滚触发条件',
    '准备回滚脚本',
    '设置回滚时间窗口',
    '测试回滚流程'
  ]
}
```

## 面试要点

### 常见面试题

#### 数据库设计相关

**Q: 如何设计一个电商系统的数据库？**

```typescript
// 回答要点
const ecommerceDesign = {
  coreEntities: [
    'users（用户）',
    'products（商品）',
    'orders（订单）',
    'order_items（订单项）',
    'categories（分类）',
    'inventory（库存）',
    'payments（支付）'
  ],

  keyDecisions: {
    idStrategy: '使用雪花算法生成分布式唯一ID',
    orderNo: '业务订单号（年月日+随机数）+ 内部ID 分离',
    price: '使用 DECIMAL(10,2)，存储单位为分更好',
    status: '使用枚举或状态机管理订单状态',
    softDelete: '使用 deleted_at 软删除',
    audit: '所有表包含 created_at, updated_at'
  },

  optimization: {
    hotData: '热数据（活跃用户、热门商品）缓存到 Redis',
    historicalData: '历史订单数据归档',
    searchData: '商品搜索使用 Elasticsearch'
  }
};
```

**Q: 什么时候使用反范式化？**

```typescript
const denormalizationAnswer = {
  scenarios: [
    '查询频率远高于更新频率',
    '需要避免复杂的多表 JOIN',
    '可以接受一定程度的数据冗余',
    '有机制保证数据一致性'
  ],

  examples: [
    '订单表冗余用户名、商品名',
    '文章表冗余作者信息',
    '统计汇总表'
  ],

  tradeoffs: [
    '以空间换时间',
    '增加更新复杂度',
    '需要维护数据一致性'
  ]
};
```

#### 索引相关

**Q: 如何优化慢查询？**

```sql
-- 分析步骤
-- 1. 使用 EXPLAIN 分析执行计划
EXPLAIN SELECT * FROM orders WHERE user_id = 123 AND status = 'paid';

-- 2. 查看关键指标
-- type: 访问类型（ALL < index < range < ref < eq_ref < const）
-- key: 使用的索引
-- rows: 扫描行数
-- Extra: 额外信息（Using filesort, Using temporary 需要优化）

-- 3. 优化方案
-- 添加合适的复合索引
CREATE INDEX idx_user_status ON orders(user_id, status);

-- 避免 SELECT *
SELECT id, order_no, total_amount FROM orders WHERE user_id = 123;

-- 使用覆盖索引
CREATE INDEX idx_covering ON orders(user_id, status, order_no, total_amount);
```

**Q: 聚簇索引和非聚簇索引的区别？**

```typescript
const indexComparison = {
  clusteredIndex: {
    definition: '数据行和索引存储在一起',
    features: [
      '一个表只能有一个聚簇索引',
      'InnoDB 主键就是聚簇索引',
      '范围查询效率高',
      '插入时可能导致页分裂'
    ],
    storage: '叶子节点存储完整数据行'
  },

  nonClusteredIndex: {
    definition: '索引和数据分开存储',
    features: [
      '一个表可以有多个非聚簇索引',
      '查询可能需要回表',
      '覆盖索引可以避免回表'
    ],
    storage: '叶子节点存储主键值'
  }
};
```

#### 分库分表相关

**Q: 分库分表后如何处理跨库 JOIN？**

```typescript
const crossShardJoinSolutions = {
  approach1: {
    name: '全局表',
    description: '将小表（如配置表）复制到每个分片',
    pros: ['查询简单'],
    cons: ['数据同步开销', '只适合小表']
  },

  approach2: {
    name: '字段冗余',
    description: '将需要 JOIN 的字段冗余存储',
    pros: ['查询效率高'],
    cons: ['数据一致性维护']
  },

  approach3: {
    name: '应用层聚合',
    description: '分别查询后在应用层合并',
    example: `
      // 查询用户订单及商品信息
      const orders = await orderDb.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
      const productIds = orders.map(o => o.product_id);
      const products = await productDb.query('SELECT * FROM products WHERE id IN (?)', [productIds]);

      // 应用层合并
      return orders.map(order => ({
        ...order,
        product: products.find(p => p.id === order.product_id)
      }));
    `
  }
};
```

**Q: 分库分表的主键如何生成？**

```typescript
const distributedIdStrategies = {
  snowflake: {
    description: '雪花算法，64位分布式ID',
    pros: ['趋势递增', '高性能', '不依赖数据库'],
    cons: ['依赖时钟同步']
  },

  segment: {
    description: '号段模式，从数据库批量获取ID范围',
    pros: ['ID 连续', '容灾性好'],
    cons: ['需要依赖数据库']
  },

  uuid: {
    description: '通用唯一标识符',
    pros: ['简单', '全局唯一'],
    cons: ['无序', '存储空间大', '索引性能差']
  }
};
```

### 设计题思路

```typescript
// 数据库设计面试答题框架
const designFramework = {
  step1_clarify: {
    questions: [
      '用户规模和数据量预估？',
      '读写比例如何？',
      '对一致性的要求？',
      '核心业务场景是什么？'
    ]
  },

  step2_entities: {
    task: '识别核心实体和关系',
    output: 'ER 图'
  },

  step3_schema: {
    task: '设计表结构',
    considerations: ['主键策略', '字段类型', '约束条件', '索引设计']
  },

  step4_optimization: {
    task: '性能优化方案',
    aspects: ['索引优化', '读写分离', '缓存策略', '分库分表']
  },

  step5_tradeoffs: {
    task: '讨论权衡',
    topics: ['一致性 vs 可用性', '范式化 vs 反范式化', '成本 vs 性能']
  }
};
```

## 总结

数据库设计是软件工程的基石，需要在理论和实践之间找到平衡：

1. **遵循设计流程**：需求分析 -> 概念设计 -> 逻辑设计 -> 物理设计
2. **理解范式原则**：消除冗余，保证数据完整性
3. **灵活反范式化**：根据实际需求适度冗余，提升查询性能
4. **合理设计主键和索引**：选择合适的ID策略，遵循索引设计原则
5. **选择合适的数据库类型**：SQL vs NoSQL，根据业务特点决定
6. **规划扩展架构**：读写分离、分库分表，应对数据增长
7. **制定迁移策略**：安全、可回滚的数据迁移方案

好的数据库设计需要考虑当前需求，也要为未来扩展预留空间。在实践中不断积累经验，才能设计出既满足业务需求又具有良好扩展性的数据库系统。
