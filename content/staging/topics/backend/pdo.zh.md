---
title: PHP PDO 数据库操作
description: 深入学习 PHP PDO 进行数据库操作，包括连接管理、预处理语句、事务控制、获取模式和错误处理的完整指南
track: backend
section: databases
difficulty: intermediate
tags:
  - PHP
  - PDO
  - 数据库
  - MySQL
  - 预处理语句
  - 事务
status: imported
origin: old/src/content/docs/php/pdo.zh.md
divergence: 0.213
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 数据库
  order: 9
  lastUpdated: 2026-01-07
---

PDO (PHP Data Objects) 是 PHP 中访问数据库的标准扩展，提供了统一的数据访问抽象层。无论使用何种数据库系统，都可以通过相同的 API 执行查询和获取数据，是现代 PHP 应用程序数据库操作的首选方案。

## 概念解释

### 什么是 PDO

PDO 是 PHP 5.1 引入的数据库访问扩展，全称为 PHP Data Objects（PHP 数据对象）。它的设计目标是提供一个轻量级、一致性的接口来访问多种数据库系统。

**PDO 解决的问题：**

在 PDO 出现之前，PHP 针对不同数据库有不同的扩展（如 mysql_*、pg_* 等），这导致：
- 代码与特定数据库紧密耦合
- 切换数据库需要重写大量代码
- 不同扩展的 API 风格不一致
- 安全性参差不齐（如 mysql_* 扩展容易导致 SQL 注入）

**PDO 支持的数据库：**

```php
<?php
// 查看系统支持的 PDO 驱动
print_r(PDO::getAvailableDrivers());
// 输出示例: ['mysql', 'pgsql', 'sqlite', 'sqlsrv', ...]

/**
 * 常见支持的数据库：
 * - MySQL / MariaDB
 * - PostgreSQL
 * - SQLite
 * - SQL Server (sqlsrv)
 * - Oracle (oci)
 * - IBM DB2 (ibm)
 * - Firebird (firebird)
 */
?>
```

### PDO 与 mysqli 对比

```php
<?php
// mysqli - 仅支持 MySQL
$mysqli = new mysqli("localhost", "user", "password", "database");
$result = $mysqli->query("SELECT * FROM users");

// PDO - 支持多种数据库
$pdo = new PDO("mysql:host=localhost;dbname=database", "user", "password");
$result = $pdo->query("SELECT * FROM users");

// 切换到 PostgreSQL，只需修改 DSN
$pdo = new PDO("pgsql:host=localhost;dbname=database", "user", "password");
// 其他代码保持不变！
?>
```

| 特性 | PDO | mysqli |
|-----|-----|--------|
| 数据库支持 | 12+ 种数据库 | 仅 MySQL |
| API 风格 | 面向对象 | 面向对象/过程式 |
| 命名参数 | 支持 | 不支持 |
| 预处理语句 | 支持 | 支持 |
| 事务 | 支持 | 支持 |
| 存储过程 | 支持 | 支持 |

### PDO 三大核心类

```php
<?php
/**
 * PDO 核心类结构：
 *
 * 1. PDO - 数据库连接类
 *    - 建立数据库连接
 *    - 执行 SQL 语句
 *    - 管理事务
 *
 * 2. PDOStatement - 语句类
 *    - 代表预处理语句
 *    - 执行查询并获取结果
 *    - 绑定参数和列
 *
 * 3. PDOException - 异常类
 *    - 处理数据库错误
 *    - 提供错误信息和代码
 */

// 示例：三个类的典型用法
try {
    // PDO 类 - 建立连接
    $pdo = new PDO("mysql:host=localhost;dbname=test", "root", "password");

    // PDOStatement 类 - 准备和执行语句
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([1]);
    $user = $stmt->fetch();

} catch (PDOException $e) {
    // PDOException 类 - 处理错误
    echo "数据库错误: " . $e->getMessage();
}
?>
```

## 核心原理

### PDO 驱动层架构

PDO 采用分层架构设计，将数据库访问抽象为统一接口：

```
┌─────────────────────────────────────────────┐
│              PHP 应用程序                     │
├─────────────────────────────────────────────┤
│              PDO 核心层                       │
│   (统一的 API: prepare, execute, fetch...)   │
├──────────┬──────────┬──────────┬────────────┤
│ PDO_MySQL│PDO_PgSQL │PDO_SQLite│ PDO_...    │
│  驱动    │  驱动    │   驱动   │   驱动     │
├──────────┼──────────┼──────────┼────────────┤
│  MySQL   │PostgreSQL│  SQLite  │   其他     │
│  服务器  │  服务器  │   文件   │   数据库   │
└──────────┴──────────┴──────────┴────────────┘
```

### 预处理语句原理

预处理语句（Prepared Statements）是 PDO 安全性和性能的核心。其工作流程分为两个阶段：

**第一阶段：准备（Prepare）**
```sql
-- SQL 模板发送到数据库服务器
SELECT * FROM users WHERE id = ? AND status = ?
-- 数据库解析、编译并优化执行计划
-- 返回语句句柄给客户端
```

**第二阶段：执行（Execute）**
```sql
-- 只发送参数值：[1, 'active']
-- 数据库使用已编译的计划执行
-- 参数作为数据处理，不会被解释为 SQL
```

```php
<?php
// 预处理的两阶段过程
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");  // 阶段1：准备
$stmt->execute([1]);  // 阶段2：执行

// 同一语句可多次执行，只需改变参数
$stmt->execute([2]);  // 复用已编译的语句
$stmt->execute([3]);
?>
```

### 防止 SQL 注入的原理

```php
<?php
// 危险：直接拼接 SQL
$username = "admin'; DROP TABLE users; --";
$sql = "SELECT * FROM users WHERE username = '$username'";
// 结果: SELECT * FROM users WHERE username = 'admin'; DROP TABLE users; --'
// 这将执行恶意的 DROP 语句！

// 安全：使用预处理语句
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
// 原理：$username 被当作纯数据传输，不会被解释为 SQL 代码
// 数据库收到的是: username = "admin'; DROP TABLE users; --"
// 单引号和特殊字符被正确转义或作为字面值处理
?>
```

**预处理防注入的关键：**
1. SQL 结构（模板）与数据（参数）分离
2. 参数在数据库端绑定，不在客户端拼接
3. 数据库知道参数是数据，不会解释为代码

### 事务处理原理

PDO 事务遵循 ACID 原则：

```php
<?php
/**
 * ACID 特性：
 *
 * A - 原子性 (Atomicity)
 *     事务中的所有操作要么全部成功，要么全部失败回滚
 *
 * C - 一致性 (Consistency)
 *     事务完成后，数据库从一个一致状态转换到另一个一致状态
 *
 * I - 隔离性 (Isolation)
 *     多个并发事务之间相互隔离，互不影响
 *
 * D - 持久性 (Durability)
 *     事务一旦提交，对数据的修改是永久性的
 */

// 事务处理流程
try {
    $pdo->beginTransaction();  // 开始事务

    // 操作1：扣减账户A余额
    $pdo->exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1");

    // 操作2：增加账户B余额
    $pdo->exec("UPDATE accounts SET balance = balance + 100 WHERE id = 2");

    $pdo->commit();  // 提交事务 - 两个操作同时生效

} catch (Exception $e) {
    $pdo->rollBack();  // 回滚事务 - 两个操作都撤销
    throw $e;
}
?>
```

### 获取模式内部机制

```php
<?php
/**
 * PDO 获取模式的工作原理：
 *
 * 当执行查询后，结果集存储在服务器端或缓冲区中。
 * fetch() 方法根据指定的模式，将原始数据转换为不同的 PHP 数据结构。
 */

$stmt = $pdo->query("SELECT id, name, email FROM users LIMIT 1");

// 原始数据: [1, '张三', 'zhangsan@example.com']

// FETCH_ASSOC - 转换为关联数组
// ['id' => 1, 'name' => '张三', 'email' => 'zhangsan@example.com']

// FETCH_NUM - 转换为索引数组
// [0 => 1, 1 => '张三', 2 => 'zhangsan@example.com']

// FETCH_OBJ - 转换为 stdClass 对象
// stdClass { id: 1, name: '张三', email: 'zhangsan@example.com' }

// FETCH_CLASS - 转换为指定类的实例
// User { id: 1, name: '张三', email: 'zhangsan@example.com' }
?>
```

## 核心要点

### 连接管理

```php
<?php
// DSN (数据源名称) 格式
$dsn = "驱动名:参数1=值1;参数2=值2";

// MySQL DSN
$dsn = "mysql:host=localhost;port=3306;dbname=myapp;charset=utf8mb4";

// PostgreSQL DSN
$dsn = "pgsql:host=localhost;port=5432;dbname=myapp";

// SQLite DSN
$dsn = "sqlite:/path/to/database.sqlite";

// 推荐的连接选项
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,           // 异常模式
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,      // 默认关联数组
    PDO::ATTR_EMULATE_PREPARES => false,                   // 真正的预处理
    PDO::ATTR_PERSISTENT => false,                         // 非持久连接
];

$pdo = new PDO($dsn, $username, $password, $options);
?>
```

### 预处理语句绑定方式

```php
<?php
// 方式1：execute() 传递参数数组（推荐）
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND status = ?");
$stmt->execute([1, 'active']);

// 方式2：命名参数
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id AND status = :status");
$stmt->execute([':id' => 1, ':status' => 'active']);

// 方式3：bindValue() - 绑定值
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->bindValue(':id', 1, PDO::PARAM_INT);
$stmt->execute();

// 方式4：bindParam() - 绑定引用
$id = 1;
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();  // 使用 $id 当前值
$id = 2;
$stmt->execute();  // 使用 $id 新值
?>
```

### 数据获取模式

```php
<?php
// 单行获取
$row = $stmt->fetch(PDO::FETCH_ASSOC);      // 关联数组
$row = $stmt->fetch(PDO::FETCH_NUM);        // 索引数组
$row = $stmt->fetch(PDO::FETCH_OBJ);        // stdClass 对象
$row = $stmt->fetch(PDO::FETCH_BOTH);       // 混合（默认）

// 全部获取
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);  // 所有行为关联数组
$rows = $stmt->fetchAll(PDO::FETCH_COLUMN); // 获取单列
$rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // 键值对（两列时）
$rows = $stmt->fetchAll(PDO::FETCH_UNIQUE);   // 第一列为键
$rows = $stmt->fetchAll(PDO::FETCH_GROUP);    // 按第一列分组

// 单列获取
$value = $stmt->fetchColumn();    // 获取第一列
$value = $stmt->fetchColumn(1);   // 获取第二列

// 映射到类
$stmt->setFetchMode(PDO::FETCH_CLASS, User::class);
$user = $stmt->fetch();
?>
```

### 事务控制

```php
<?php
// 基本事务
$pdo->beginTransaction();
try {
    // 执行多个操作
    $pdo->exec("...");
    $pdo->exec("...");
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    throw $e;
}

// 检查事务状态
if ($pdo->inTransaction()) {
    echo "当前在事务中";
}

// 保存点（嵌套事务模拟）
$pdo->beginTransaction();
$pdo->exec("SAVEPOINT sp1");
// ... 操作 ...
$pdo->exec("ROLLBACK TO SAVEPOINT sp1");  // 回滚到保存点
$pdo->commit();
?>
```

### 错误处理模式

```php
<?php
// 模式1：静默模式（默认）- 需手动检查
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
$result = $pdo->query("INVALID SQL");
if ($result === false) {
    print_r($pdo->errorInfo());  // [SQLSTATE, 驱动错误码, 错误信息]
}

// 模式2：警告模式 - 产生 PHP Warning
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);

// 模式3：异常模式（推荐）- 抛出 PDOException
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
try {
    $pdo->query("INVALID SQL");
} catch (PDOException $e) {
    echo $e->getMessage();
    echo $e->getCode();
    print_r($e->errorInfo);
}
?>
```

## 代码示例

### 数据库连接

```php
<?php
/**
 * 生产环境推荐的数据库连接配置
 */
class Database
{
    private static ?PDO $instance = null;

    private static array $options = [
        // 错误模式：抛出异常
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        // 默认获取模式：关联数组
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // 禁用模拟预处理（使用数据库原生预处理）
        PDO::ATTR_EMULATE_PREPARES => false,
        // 字符串不转换为 PHP null
        PDO::ATTR_ORACLE_NULLS => PDO::NULL_NATURAL,
        // 获取列名时保持原样
        PDO::ATTR_CASE => PDO::CASE_NATURAL,
    ];

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
                $_ENV['DB_HOST'] ?? 'localhost',
                $_ENV['DB_PORT'] ?? '3306',
                $_ENV['DB_NAME'] ?? 'myapp'
            );

            self::$instance = new PDO(
                $dsn,
                $_ENV['DB_USER'] ?? 'root',
                $_ENV['DB_PASS'] ?? '',
                self::$options
            );
        }

        return self::$instance;
    }

    // 防止克隆和反序列化
    private function __construct() {}
    private function __clone() {}
    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }
}

// 使用
$pdo = Database::getConnection();
?>
```

### CRUD 操作完整示例

```php
<?php
class UserRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 创建用户
     */
    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO users (name, email, password, created_at)
            VALUES (:name, :email, :password, NOW())
        ");

        $stmt->execute([
            ':name' => $data['name'],
            ':email' => $data['email'],
            ':password' => password_hash($data['password'], PASSWORD_DEFAULT),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * 根据 ID 查找用户
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * 根据邮箱查找用户
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * 获取所有用户（分页）
     */
    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        // 获取总数
        $countStmt = $this->pdo->query("SELECT COUNT(*) FROM users");
        $total = (int) $countStmt->fetchColumn();

        // 获取数据
        $stmt = $this->pdo->prepare("
            SELECT id, name, email, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(),
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => (int) ceil($total / $perPage),
        ];
    }

    /**
     * 条件搜索
     */
    public function search(array $criteria): array
    {
        $sql = "SELECT * FROM users WHERE 1=1";
        $params = [];

        if (!empty($criteria['name'])) {
            $sql .= " AND name LIKE :name";
            $params[':name'] = '%' . $criteria['name'] . '%';
        }

        if (!empty($criteria['email'])) {
            $sql .= " AND email LIKE :email";
            $params[':email'] = '%' . $criteria['email'] . '%';
        }

        if (!empty($criteria['status'])) {
            $sql .= " AND status = :status";
            $params[':status'] = $criteria['status'];
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * 更新用户
     */
    public function update(int $id, array $data): bool
    {
        $allowedFields = ['name', 'email', 'status', 'phone'];
        $sets = [];
        $params = [':id' => $id];

        foreach ($data as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $sets[] = "$field = :$field";
                $params[":$field"] = $value;
            }
        }

        if (empty($sets)) {
            return false;
        }

        $sql = "UPDATE users SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute($params);
    }

    /**
     * 删除用户（软删除）
     */
    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL
        ");
        return $stmt->execute([$id]);
    }

    /**
     * 批量插入
     */
    public function batchInsert(array $users): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO users (name, email, password, created_at)
            VALUES (:name, :email, :password, NOW())
        ");

        $count = 0;
        $this->pdo->beginTransaction();

        try {
            foreach ($users as $user) {
                $stmt->execute([
                    ':name' => $user['name'],
                    ':email' => $user['email'],
                    ':password' => password_hash($user['password'], PASSWORD_DEFAULT),
                ]);
                $count++;
            }
            $this->pdo->commit();
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return $count;
    }
}

// 使用示例
$pdo = Database::getConnection();
$userRepo = new UserRepository($pdo);

// 创建用户
$userId = $userRepo->create([
    'name' => '张三',
    'email' => 'zhangsan@example.com',
    'password' => 'secret123',
]);
echo "创建用户 ID: $userId\n";

// 查找用户
$user = $userRepo->findById($userId);
print_r($user);

// 更新用户
$userRepo->update($userId, ['name' => '张三丰', 'phone' => '13800138000']);

// 搜索用户
$users = $userRepo->search(['name' => '张', 'status' => 'active']);

// 分页获取
$result = $userRepo->findAll(1, 10);
echo "共 {$result['total']} 条记录\n";
?>
```

### 事务处理示例

```php
<?php
/**
 * 转账服务 - 事务处理示例
 */
class TransferService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 执行转账
     *
     * @throws Exception
     */
    public function transfer(int $fromAccountId, int $toAccountId, float $amount): array
    {
        // 参数验证
        if ($amount <= 0) {
            throw new InvalidArgumentException("转账金额必须大于0");
        }

        if ($fromAccountId === $toAccountId) {
            throw new InvalidArgumentException("不能给自己转账");
        }

        $this->pdo->beginTransaction();

        try {
            // 1. 锁定并检查源账户
            $stmt = $this->pdo->prepare("
                SELECT id, user_id, balance FROM accounts
                WHERE id = ? FOR UPDATE
            ");
            $stmt->execute([$fromAccountId]);
            $fromAccount = $stmt->fetch();

            if (!$fromAccount) {
                throw new Exception("源账户不存在");
            }

            if ($fromAccount['balance'] < $amount) {
                throw new Exception("余额不足");
            }

            // 2. 锁定并检查目标账户
            $stmt->execute([$toAccountId]);
            $toAccount = $stmt->fetch();

            if (!$toAccount) {
                throw new Exception("目标账户不存在");
            }

            // 3. 执行扣款
            $stmt = $this->pdo->prepare("
                UPDATE accounts SET balance = balance - ? WHERE id = ?
            ");
            $stmt->execute([$amount, $fromAccountId]);

            // 4. 执行入账
            $stmt = $this->pdo->prepare("
                UPDATE accounts SET balance = balance + ? WHERE id = ?
            ");
            $stmt->execute([$amount, $toAccountId]);

            // 5. 记录交易日志
            $stmt = $this->pdo->prepare("
                INSERT INTO transactions (from_account_id, to_account_id, amount, type, created_at)
                VALUES (?, ?, ?, 'transfer', NOW())
            ");
            $stmt->execute([$fromAccountId, $toAccountId, $amount]);
            $transactionId = $this->pdo->lastInsertId();

            // 6. 提交事务
            $this->pdo->commit();

            return [
                'success' => true,
                'transaction_id' => $transactionId,
                'message' => "成功转账 ¥" . number_format($amount, 2),
            ];

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * 使用保存点的复杂事务
     */
    public function processOrder(int $orderId): bool
    {
        $this->pdo->beginTransaction();

        try {
            // 更新订单状态
            $this->pdo->prepare("UPDATE orders SET status = 'processing' WHERE id = ?")
                ->execute([$orderId]);

            // 保存点1：处理支付
            $this->pdo->exec("SAVEPOINT payment");
            try {
                $this->processPayment($orderId);
            } catch (Exception $e) {
                // 支付失败，回滚到保存点
                $this->pdo->exec("ROLLBACK TO SAVEPOINT payment");
                // 标记订单为支付失败
                $this->pdo->prepare("UPDATE orders SET status = 'payment_failed' WHERE id = ?")
                    ->execute([$orderId]);
                $this->pdo->commit();
                return false;
            }

            // 保存点2：处理库存
            $this->pdo->exec("SAVEPOINT inventory");
            try {
                $this->deductInventory($orderId);
            } catch (Exception $e) {
                $this->pdo->exec("ROLLBACK TO SAVEPOINT inventory");
                // 退还支付
                $this->refundPayment($orderId);
                $this->pdo->prepare("UPDATE orders SET status = 'inventory_failed' WHERE id = ?")
                    ->execute([$orderId]);
                $this->pdo->commit();
                return false;
            }

            // 完成订单
            $this->pdo->prepare("UPDATE orders SET status = 'completed' WHERE id = ?")
                ->execute([$orderId]);

            $this->pdo->commit();
            return true;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function processPayment(int $orderId): void { /* 支付处理 */ }
    private function deductInventory(int $orderId): void { /* 库存扣减 */ }
    private function refundPayment(int $orderId): void { /* 退款处理 */ }
}
?>
```

### 数据获取模式详解

```php
<?php
// 准备测试数据
$pdo->exec("
    CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY,
        category_id INT,
        name VARCHAR(100),
        price DECIMAL(10,2)
    )
");

// FETCH_ASSOC - 关联数组（最常用）
$stmt = $pdo->query("SELECT id, name, price FROM products");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['name']}: ¥{$row['price']}\n";
}

// FETCH_OBJ - 匿名对象
$stmt = $pdo->query("SELECT id, name, price FROM products");
while ($product = $stmt->fetch(PDO::FETCH_OBJ)) {
    echo "{$product->name}: ¥{$product->price}\n";
}

// FETCH_CLASS - 映射到自定义类
class Product
{
    public int $id;
    public string $name;
    public float $price;

    public function getFormattedPrice(): string
    {
        return '¥' . number_format($this->price, 2);
    }
}

$stmt = $pdo->query("SELECT id, name, price FROM products");
$stmt->setFetchMode(PDO::FETCH_CLASS, Product::class);
while ($product = $stmt->fetch()) {
    echo "{$product->name}: {$product->getFormattedPrice()}\n";
}

// FETCH_KEY_PAIR - 两列变键值对
$stmt = $pdo->query("SELECT id, name FROM products");
$productNames = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
// 结果: [1 => '商品A', 2 => '商品B', 3 => '商品C']

// FETCH_UNIQUE - 第一列作为键
$stmt = $pdo->query("SELECT id, name, price FROM products");
$products = $stmt->fetchAll(PDO::FETCH_UNIQUE);
// 结果: [1 => ['name' => '商品A', 'price' => 99.00], ...]

// FETCH_GROUP - 按第一列分组
$stmt = $pdo->query("SELECT category_id, id, name FROM products ORDER BY category_id");
$grouped = $stmt->fetchAll(PDO::FETCH_GROUP);
// 结果: [1 => [['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B']], 2 => [...]]

// FETCH_COLUMN - 获取单列
$stmt = $pdo->query("SELECT name FROM products");
$names = $stmt->fetchAll(PDO::FETCH_COLUMN);
// 结果: ['商品A', '商品B', '商品C']

// fetchColumn() - 获取单个值
$count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
echo "共 $count 个商品\n";
?>
```

### 错误处理最佳实践

```php
<?php
/**
 * 自定义数据库异常类
 */
class DatabaseException extends Exception
{
    protected string $sqlState;
    protected ?string $sql;
    protected array $params;

    public function __construct(
        PDOException $e,
        ?string $sql = null,
        array $params = []
    ) {
        $this->sqlState = $e->errorInfo[0] ?? 'UNKNOWN';
        $this->sql = $sql;
        $this->params = $params;

        parent::__construct($e->getMessage(), (int) $e->getCode(), $e);
    }

    public function getSqlState(): string
    {
        return $this->sqlState;
    }

    public function getSql(): ?string
    {
        return $this->sql;
    }

    public function isDuplicateEntry(): bool
    {
        return $this->sqlState === '23000'
            && str_contains($this->getMessage(), 'Duplicate entry');
    }

    public function isForeignKeyViolation(): bool
    {
        return $this->sqlState === '23000'
            && str_contains($this->getMessage(), 'foreign key constraint');
    }

    public function isConnectionError(): bool
    {
        return in_array($this->sqlState, ['08001', '08004', 'HY000']);
    }

    public function isDeadlock(): bool
    {
        return $this->sqlState === '40001';
    }
}

/**
 * 数据库操作封装类
 */
class SafeDatabase
{
    private PDO $pdo;
    private bool $debug;

    public function __construct(PDO $pdo, bool $debug = false)
    {
        $this->pdo = $pdo;
        $this->debug = $debug;
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function query(string $sql, array $params = []): PDOStatement
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->handleError($e, $sql, $params);
        }
    }

    public function insert(string $table, array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_map(fn($col) => ":$col", $columns);

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $params = [];
        foreach ($data as $col => $val) {
            $params[":$col"] = $val;
        }

        $this->query($sql, $params);
        return (int) $this->pdo->lastInsertId();
    }

    private function handleError(PDOException $e, string $sql, array $params): never
    {
        // 记录错误日志
        error_log(sprintf(
            "[DB Error] %s | SQL: %s | Params: %s",
            $e->getMessage(),
            $sql,
            json_encode($params)
        ));

        $dbException = new DatabaseException($e, $sql, $params);

        // 针对不同错误类型返回友好消息
        if ($dbException->isDuplicateEntry()) {
            throw new RuntimeException('该记录已存在', 409, $dbException);
        }

        if ($dbException->isForeignKeyViolation()) {
            throw new RuntimeException('关联数据不存在或无法删除', 400, $dbException);
        }

        if ($dbException->isConnectionError()) {
            throw new RuntimeException('数据库连接失败，请稍后重试', 503, $dbException);
        }

        if ($dbException->isDeadlock()) {
            throw new RuntimeException('操作冲突，请重试', 409, $dbException);
        }

        // 开发环境显示详细错误
        if ($this->debug) {
            throw $dbException;
        }

        // 生产环境显示通用错误
        throw new RuntimeException('数据库操作失败', 500, $dbException);
    }
}

// 使用示例
$db = new SafeDatabase($pdo, debug: false);

try {
    $userId = $db->insert('users', [
        'name' => '张三',
        'email' => 'zhangsan@example.com',
    ]);
} catch (RuntimeException $e) {
    // 获取用户友好的错误消息
    echo $e->getMessage();  // "该记录已存在"
}
?>
```

## 最佳实践

### 连接配置最佳实践

```php
<?php
// 生产环境推荐配置
$options = [
    // 必须：异常模式处理错误
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

    // 推荐：默认使用关联数组
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

    // 重要：禁用模拟预处理，使用真正的预处理语句
    // 这可以防止某些类型的 SQL 注入并提高性能
    PDO::ATTR_EMULATE_PREPARES => false,

    // MySQL 特定：设置正确的字符集
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",

    // 可选：连接超时
    PDO::ATTR_TIMEOUT => 5,
];
?>
```

### 始终使用预处理语句

```php
<?php
// 错误：直接拼接用户输入
$name = $_GET['name'];
// 永远不要这样做！
// $pdo->query("SELECT * FROM users WHERE name = '$name'");

// 正确：使用预处理语句
$stmt = $pdo->prepare("SELECT * FROM users WHERE name = ?");
$stmt->execute([$name]);

// 对于动态列名/表名，使用白名单验证
function getOrderedUsers(PDO $pdo, string $column, string $direction): array
{
    $allowedColumns = ['id', 'name', 'email', 'created_at'];
    $allowedDirections = ['ASC', 'DESC'];

    if (!in_array($column, $allowedColumns)) {
        $column = 'id';
    }

    $direction = strtoupper($direction);
    if (!in_array($direction, $allowedDirections)) {
        $direction = 'ASC';
    }

    // 经过白名单验证后可以安全拼接
    $sql = "SELECT * FROM users ORDER BY $column $direction";
    return $pdo->query($sql)->fetchAll();
}
?>
```

### 合理使用事务

```php
<?php
// 使用回调封装事务，确保正确的异常处理
function transaction(PDO $pdo, callable $callback): mixed
{
    $pdo->beginTransaction();

    try {
        $result = $callback($pdo);
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// 使用示例
$orderId = transaction($pdo, function ($pdo) {
    $pdo->exec("INSERT INTO orders (user_id, total) VALUES (1, 100)");
    $orderId = $pdo->lastInsertId();

    $pdo->exec("INSERT INTO order_items (order_id, product_id) VALUES ($orderId, 1)");
    $pdo->exec("UPDATE products SET stock = stock - 1 WHERE id = 1");

    return $orderId;
});
?>
```

### 密码安全存储

```php
<?php
// 创建用户时哈希密码
function createUser(PDO $pdo, string $email, string $password): int
{
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT, [
        'cost' => 12  // 增加计算成本以提高安全性
    ]);

    $stmt = $pdo->prepare("
        INSERT INTO users (email, password) VALUES (?, ?)
    ");
    $stmt->execute([$email, $hashedPassword]);

    return (int) $pdo->lastInsertId();
}

// 验证登录
function verifyLogin(PDO $pdo, string $email, string $password): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        // 防止时序攻击：用户不存在时也执行密码验证
        if (!$user) {
            password_verify($password, '$2y$12$invalidhashfortimingattempt');
        }
        return null;
    }

    // 检查是否需要重新哈希（算法升级时）
    if (password_needs_rehash($user['password'], PASSWORD_DEFAULT, ['cost' => 12])) {
        updatePassword($pdo, $user['id'], $password);
    }

    unset($user['password']);  // 不返回密码字段
    return $user;
}
?>
```

### 处理大数据集

```php
<?php
// 使用无缓冲查询避免内存溢出
function processLargeTable(PDO $pdo): Generator
{
    // 关闭查询缓冲
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);

    $stmt = $pdo->query("SELECT * FROM large_table");

    while ($row = $stmt->fetch()) {
        yield $row;  // 使用生成器逐行处理
    }

    // 恢复默认设置
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
}

// 使用
foreach (processLargeTable($pdo) as $row) {
    processRow($row);
}

// 分批处理大量数据
function batchProcess(PDO $pdo, int $batchSize = 1000): void
{
    $lastId = 0;

    while (true) {
        $stmt = $pdo->prepare("
            SELECT * FROM records
            WHERE id > ?
            ORDER BY id
            LIMIT ?
        ");
        $stmt->execute([$lastId, $batchSize]);
        $rows = $stmt->fetchAll();

        if (empty($rows)) {
            break;
        }

        foreach ($rows as $row) {
            // 处理每条记录
        }

        $lastId = end($rows)['id'];
        echo "已处理到 ID: $lastId\n";
    }
}
?>
```

## 常见陷阱

### 忽略错误处理

```php
<?php
// 错误：不设置异常模式，错误被静默忽略
$pdo = new PDO($dsn, $user, $pass);
$result = $pdo->query("INVALID SQL");  // 返回 false，但没有提示
// 后续代码继续执行，可能导致数据不一致

// 正确：始终使用异常模式
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
]);
// 现在错误会抛出异常，可以被正确捕获和处理
?>
```

### 在循环中执行查询

```php
<?php
// 错误：N+1 查询问题
$users = $pdo->query("SELECT * FROM users")->fetchAll();
foreach ($users as $user) {
    // 每个用户执行一次查询 = N 次额外查询
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $orders = $stmt->fetchAll();
}

// 正确：使用 JOIN 或批量查询
$stmt = $pdo->query("
    SELECT u.*, o.id as order_id, o.total
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
");
$results = $stmt->fetchAll();

// 或者批量获取后在 PHP 中组合
$userIds = array_column($users, 'id');
$placeholders = implode(',', array_fill(0, count($userIds), '?'));
$stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id IN ($placeholders)");
$stmt->execute($userIds);
$allOrders = $stmt->fetchAll(PDO::FETCH_GROUP);  // 按 user_id 分组
?>
```

### 误解 EMULATE_PREPARES

```php
<?php
// 模拟预处理（默认开启）的问题

// 问题1：LIMIT 参数类型问题
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
$stmt = $pdo->prepare("SELECT * FROM users LIMIT ?");
$stmt->execute([10]);
// 在模拟模式下，10 可能被当作字符串 '10'，某些数据库会报错

// 解决：禁用模拟预处理
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
$stmt = $pdo->prepare("SELECT * FROM users LIMIT ?");
$stmt->bindValue(1, 10, PDO::PARAM_INT);  // 明确指定类型
$stmt->execute();

// 问题2：模拟预处理的安全隐患
// 在极端情况下，如果数据库连接的字符集设置不正确，
// 模拟预处理可能受到 SQL 注入攻击
// 解决：禁用模拟预处理 + 正确设置字符集
$dsn = "mysql:host=localhost;dbname=test;charset=utf8mb4";
$options = [
    PDO::ATTR_EMULATE_PREPARES => false,
];
?>
```

### 事务未正确处理

```php
<?php
// 错误：事务异常后未回滚
$pdo->beginTransaction();
$pdo->exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
$pdo->exec("UPDATE invalid_table SET ...");  // 这里失败
$pdo->commit();  // 事务处于中间状态

// 错误：嵌套事务
$pdo->beginTransaction();
// ... 一些操作 ...
$pdo->beginTransaction();  // 错误！PDO 不支持真正的嵌套事务
// 这会抛出异常或导致意外行为

// 正确：使用 try-catch 确保回滚
$pdo->beginTransaction();
try {
    $pdo->exec("...");
    $pdo->exec("...");
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    throw $e;
}

// 正确：检查事务状态
if (!$pdo->inTransaction()) {
    $pdo->beginTransaction();
}
?>
```

### fetchAll 大数据集导致内存溢出

```php
<?php
// 错误：一次性获取大量数据
$stmt = $pdo->query("SELECT * FROM logs");  // 假设有百万条记录
$logs = $stmt->fetchAll();  // 内存溢出！

// 正确：逐行处理
$stmt = $pdo->query("SELECT * FROM logs");
while ($log = $stmt->fetch()) {
    processLog($log);
}

// 正确：使用 LIMIT 分页处理
$page = 0;
$pageSize = 1000;
do {
    $offset = $page * $pageSize;
    $stmt = $pdo->prepare("SELECT * FROM logs LIMIT ? OFFSET ?");
    $stmt->bindValue(1, $pageSize, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $logs = $stmt->fetchAll();

    foreach ($logs as $log) {
        processLog($log);
    }

    $page++;
} while (count($logs) === $pageSize);
?>
```

### 参数类型不匹配

```php
<?php
// 问题：字符串传给需要整数的字段
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute(["1"]);  // 传入字符串 "1"
// 某些数据库可能无法正确使用索引

// 正确：明确指定参数类型
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bindValue(1, 1, PDO::PARAM_INT);
$stmt->execute();

// 或者在 execute 前进行类型转换
$stmt->execute([(int) $userId]);

// 常见参数类型
PDO::PARAM_STR   // 字符串（默认）
PDO::PARAM_INT   // 整数
PDO::PARAM_BOOL  // 布尔值
PDO::PARAM_NULL  // NULL
PDO::PARAM_LOB   // 大对象
?>
```

### IN 子句参数绑定错误

```php
<?php
// 错误：不能直接传递数组
$ids = [1, 2, 3];
$stmt = $pdo->prepare("SELECT * FROM users WHERE id IN (?)");
$stmt->execute([$ids]);  // 不工作！

// 正确：动态生成占位符
$ids = [1, 2, 3];
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare("SELECT * FROM users WHERE id IN ($placeholders)");
$stmt->execute($ids);

// 封装成可复用函数
function whereIn(PDO $pdo, string $sql, string $placeholder, array $values): PDOStatement
{
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $sql = str_replace($placeholder, $placeholders, $sql);

    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    return $stmt;
}

$stmt = whereIn($pdo, "SELECT * FROM users WHERE id IN (:ids)", ':ids', [1, 2, 3]);
?>
```

## 性能考量

### 预处理语句复用

```php
<?php
// 低效：每次都准备新语句
foreach ($users as $user) {
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
}

// 高效：复用预处理语句
$stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
foreach ($users as $user) {
    $stmt->execute([$user['id']]);
}

// 更高效：批量更新
$ids = array_column($users, 'id');
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$pdo->prepare("UPDATE users SET last_login = NOW() WHERE id IN ($placeholders)")
    ->execute($ids);
?>
```

### 批量插入优化

```php
<?php
// 低效：逐条插入
foreach ($products as $product) {
    $stmt = $pdo->prepare("INSERT INTO products (name, price) VALUES (?, ?)");
    $stmt->execute([$product['name'], $product['price']]);
}

// 高效：单条 SQL 批量插入
function bulkInsert(PDO $pdo, string $table, array $data, int $chunkSize = 500): int
{
    if (empty($data)) return 0;

    $columns = array_keys($data[0]);
    $columnList = implode(', ', $columns);
    $inserted = 0;

    $pdo->beginTransaction();

    try {
        foreach (array_chunk($data, $chunkSize) as $chunk) {
            $placeholders = [];
            $values = [];

            foreach ($chunk as $row) {
                $rowPlaceholders = array_fill(0, count($columns), '?');
                $placeholders[] = '(' . implode(', ', $rowPlaceholders) . ')';
                $values = array_merge($values, array_values($row));
            }

            $sql = "INSERT INTO $table ($columnList) VALUES " . implode(', ', $placeholders);
            $pdo->prepare($sql)->execute($values);
            $inserted += count($chunk);
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

    return $inserted;
}

// 使用
$products = [
    ['name' => '商品1', 'price' => 100],
    ['name' => '商品2', 'price' => 200],
    // ... 更多数据
];
$count = bulkInsert($pdo, 'products', $products);
?>
```

### 查询优化

```php
<?php
// 1. 只选择需要的列
// 不好
$pdo->query("SELECT * FROM users");
// 好
$pdo->query("SELECT id, name, email FROM users");

// 2. 使用索引
// 确保 WHERE 子句中的列有索引
$pdo->query("SELECT * FROM orders WHERE user_id = 1");  // user_id 应有索引

// 3. 避免 SELECT IN 子查询，使用 JOIN
// 不好
$sql = "SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active')";
// 好
$sql = "SELECT o.* FROM orders o INNER JOIN users u ON o.user_id = u.id WHERE u.status = 'active'";

// 4. 使用 EXPLAIN 分析查询
$stmt = $pdo->query("EXPLAIN SELECT * FROM users WHERE email = 'test@example.com'");
print_r($stmt->fetchAll());
// 查看是否使用了索引，扫描了多少行

// 5. 合理使用 LIMIT
$pdo->prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT ?")
    ->execute([100]);
?>
```

### 连接管理

```php
<?php
// 1. 使用连接池（通过持久连接模拟）
$options = [
    PDO::ATTR_PERSISTENT => true,  // 开启持久连接
];

// 2. 及时关闭不需要的连接
$pdo = null;  // 显式关闭连接

// 3. 使用连接池工具如 PgBouncer (PostgreSQL) 或 ProxySQL (MySQL)

// 4. 单例模式避免重复创建连接
class DB
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo === null) {
            self::$pdo = new PDO($dsn, $user, $pass, $options);
        }
        return self::$pdo;
    }
}
?>
```

### 缓存策略

```php
<?php
/**
 * 简单的查询缓存实现
 */
class CachedDatabase
{
    private PDO $pdo;
    private array $cache = [];
    private int $ttl;

    public function __construct(PDO $pdo, int $ttl = 300)
    {
        $this->pdo = $pdo;
        $this->ttl = $ttl;
    }

    public function cachedQuery(string $sql, array $params = []): array
    {
        $cacheKey = md5($sql . serialize($params));

        if (isset($this->cache[$cacheKey])) {
            $cached = $this->cache[$cacheKey];
            if ($cached['expires'] > time()) {
                return $cached['data'];
            }
            unset($this->cache[$cacheKey]);
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();

        $this->cache[$cacheKey] = [
            'data' => $data,
            'expires' => time() + $this->ttl,
        ];

        return $data;
    }

    public function invalidate(): void
    {
        $this->cache = [];
    }
}

// 生产环境建议使用 Redis 等外部缓存
?>
```

## 实战场景

### 场景1：用户认证系统

```php
<?php
class AuthService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function register(string $email, string $password, string $name): array
    {
        // 检查邮箱是否已存在
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new RuntimeException("该邮箱已被注册");
        }

        // 创建用户
        $stmt = $this->pdo->prepare("
            INSERT INTO users (email, password, name, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $name,
        ]);

        $userId = $this->pdo->lastInsertId();

        return [
            'id' => $userId,
            'email' => $email,
            'name' => $name,
        ];
    }

    public function login(string $email, string $password): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, email, name, password FROM users WHERE email = ?
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            // 记录失败尝试
            $this->recordFailedAttempt($email);
            return null;
        }

        // 检查账户是否被锁定
        if ($this->isAccountLocked($email)) {
            throw new RuntimeException("账户已被锁定，请稍后重试");
        }

        // 更新最后登录时间
        $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")
            ->execute([$user['id']]);

        unset($user['password']);
        return $user;
    }

    private function recordFailedAttempt(string $email): void
    {
        $this->pdo->prepare("
            INSERT INTO login_attempts (email, attempted_at, ip_address)
            VALUES (?, NOW(), ?)
        ")->execute([$email, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
    }

    private function isAccountLocked(string $email): bool
    {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) FROM login_attempts
            WHERE email = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute([$email]);
        return $stmt->fetchColumn() >= 5;
    }
}
?>
```

### 场景2：电商订单系统

```php
<?php
class OrderService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function createOrder(int $userId, array $items): int
    {
        $this->pdo->beginTransaction();

        try {
            // 1. 锁定并验证库存
            $productIds = array_column($items, 'product_id');
            $placeholders = implode(',', array_fill(0, count($productIds), '?'));

            $stmt = $this->pdo->prepare("
                SELECT id, name, price, stock
                FROM products
                WHERE id IN ($placeholders)
                FOR UPDATE
            ");
            $stmt->execute($productIds);
            $products = $stmt->fetchAll(PDO::FETCH_UNIQUE);

            // 2. 计算总价并验证库存
            $totalAmount = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $product = $products[$item['product_id']] ?? null;

                if (!$product) {
                    throw new RuntimeException("商品不存在: {$item['product_id']}");
                }

                if ($product['stock'] < $item['quantity']) {
                    throw new RuntimeException("商品库存不足: {$product['name']}");
                }

                $itemTotal = $product['price'] * $item['quantity'];
                $totalAmount += $itemTotal;

                $orderItems[] = [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'price' => $product['price'],
                    'quantity' => $item['quantity'],
                    'total' => $itemTotal,
                ];
            }

            // 3. 创建订单
            $stmt = $this->pdo->prepare("
                INSERT INTO orders (user_id, total_amount, status, created_at)
                VALUES (?, ?, 'pending', NOW())
            ");
            $stmt->execute([$userId, $totalAmount]);
            $orderId = $this->pdo->lastInsertId();

            // 4. 创建订单项
            $stmt = $this->pdo->prepare("
                INSERT INTO order_items
                (order_id, product_id, product_name, price, quantity, total)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($orderItems as $item) {
                $stmt->execute([
                    $orderId,
                    $item['product_id'],
                    $item['product_name'],
                    $item['price'],
                    $item['quantity'],
                    $item['total'],
                ]);
            }

            // 5. 扣减库存
            $stmt = $this->pdo->prepare("
                UPDATE products SET stock = stock - ? WHERE id = ?
            ");

            foreach ($items as $item) {
                $stmt->execute([$item['quantity'], $item['product_id']]);
            }

            $this->pdo->commit();

            return $orderId;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function cancelOrder(int $orderId, int $userId): bool
    {
        $this->pdo->beginTransaction();

        try {
            // 验证订单
            $stmt = $this->pdo->prepare("
                SELECT id, status FROM orders
                WHERE id = ? AND user_id = ?
                FOR UPDATE
            ");
            $stmt->execute([$orderId, $userId]);
            $order = $stmt->fetch();

            if (!$order) {
                throw new RuntimeException("订单不存在");
            }

            if ($order['status'] !== 'pending') {
                throw new RuntimeException("只能取消待处理的订单");
            }

            // 获取订单项
            $stmt = $this->pdo->prepare("
                SELECT product_id, quantity FROM order_items WHERE order_id = ?
            ");
            $stmt->execute([$orderId]);
            $items = $stmt->fetchAll();

            // 恢复库存
            $stmt = $this->pdo->prepare("
                UPDATE products SET stock = stock + ? WHERE id = ?
            ");

            foreach ($items as $item) {
                $stmt->execute([$item['quantity'], $item['product_id']]);
            }

            // 更新订单状态
            $this->pdo->prepare("
                UPDATE orders SET status = 'cancelled', cancelled_at = NOW()
                WHERE id = ?
            ")->execute([$orderId]);

            $this->pdo->commit();
            return true;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
?>
```

### 场景3：数据导入导出

```php
<?php
class DataExporter
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 导出大表到 CSV（流式处理，避免内存溢出）
     */
    public function exportToCsv(string $table, string $filename): int
    {
        $file = fopen($filename, 'w');
        if (!$file) {
            throw new RuntimeException("无法创建文件: $filename");
        }

        // 禁用查询缓冲
        $this->pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);

        $stmt = $this->pdo->query("SELECT * FROM $table");
        $count = 0;

        // 写入表头
        $firstRow = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($firstRow) {
            fputcsv($file, array_keys($firstRow));
            fputcsv($file, array_values($firstRow));
            $count++;

            // 写入数据行
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                fputcsv($file, array_values($row));
                $count++;
            }
        }

        fclose($file);
        $this->pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);

        return $count;
    }

    /**
     * 从 CSV 导入数据（批量插入）
     */
    public function importFromCsv(string $table, string $filename, int $batchSize = 500): int
    {
        $file = fopen($filename, 'r');
        if (!$file) {
            throw new RuntimeException("无法打开文件: $filename");
        }

        // 读取表头
        $headers = fgetcsv($file);
        if (!$headers) {
            throw new RuntimeException("CSV 文件为空");
        }

        $columnList = implode(', ', $headers);
        $placeholders = implode(', ', array_fill(0, count($headers), '?'));
        $sql = "INSERT INTO $table ($columnList) VALUES ($placeholders)";

        $stmt = $this->pdo->prepare($sql);
        $count = 0;

        $this->pdo->beginTransaction();

        try {
            while (($row = fgetcsv($file)) !== false) {
                $stmt->execute($row);
                $count++;

                // 每批次提交一次
                if ($count % $batchSize === 0) {
                    $this->pdo->commit();
                    $this->pdo->beginTransaction();
                    echo "已导入 $count 条记录...\n";
                }
            }

            $this->pdo->commit();

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        fclose($file);
        return $count;
    }
}
?>
```

## 面试要点

### PDO 与 mysqli 的区别是什么？

**答案要点：**
- PDO 支持 12+ 种数据库，mysqli 仅支持 MySQL
- PDO 支持命名参数（`:name`），mysqli 只支持位置参数（`?`）
- PDO 是纯面向对象的，mysqli 同时支持面向对象和过程式
- PDO 更容易实现数据库无关的代码
- 两者都支持预处理语句和事务

### 如何使用 PDO 防止 SQL 注入？

**答案要点：**
```php
<?php
// 使用预处理语句，参数与 SQL 分离
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$userInput]);

// 原理：用户输入作为数据传输，不会被解释为 SQL 代码
// 禁用模拟预处理可获得最佳安全性
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

// 对于动态表名/列名，使用白名单验证
$allowedColumns = ['name', 'email', 'created_at'];
if (!in_array($column, $allowedColumns)) {
    throw new InvalidArgumentException("Invalid column");
}
?>
```

### PDO 的三种错误处理模式是什么？

**答案要点：**
- `PDO::ERRMODE_SILENT`：静默模式（默认），需手动检查错误
- `PDO::ERRMODE_WARNING`：警告模式，产生 PHP Warning
- `PDO::ERRMODE_EXCEPTION`：异常模式（推荐），抛出 PDOException

### PDO 事务的使用场景和注意事项？

**答案要点：**
```php
<?php
// 使用场景：需要保证多个操作的原子性
// 如：转账、订单处理等

// 注意事项：
// 1. 必须使用 try-catch 确保异常时回滚
// 2. 不要在事务中执行耗时操作（如发送邮件）
// 3. PDO 不支持真正的嵌套事务，需使用保存点模拟
// 4. 确保使用的表引擎支持事务（如 InnoDB）

$pdo->beginTransaction();
try {
    $pdo->exec("...");
    $pdo->exec("...");
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    throw $e;
}
?>
```

### FETCH_CLASS 和 FETCH_OBJ 的区别？

**答案要点：**
- `FETCH_OBJ`：返回 stdClass 匿名对象
- `FETCH_CLASS`：返回指定类的实例，可以包含方法和业务逻辑
- `FETCH_CLASS` 默认先设置属性再调用构造函数
- 使用 `PDO::FETCH_PROPS_LATE` 可以先调用构造函数

### bindParam 和 bindValue 的区别？

**答案要点：**
```php
<?php
// bindValue：绑定值，立即复制变量的值
$id = 1;
$stmt->bindValue(':id', $id, PDO::PARAM_INT);
$id = 2;
$stmt->execute();  // 使用值 1

// bindParam：绑定引用，执行时才读取变量的值
$id = 1;
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$id = 2;
$stmt->execute();  // 使用值 2

// bindParam 适合在循环中复用语句
$stmt = $pdo->prepare("INSERT INTO logs (msg) VALUES (?)");
$stmt->bindParam(1, $msg);
foreach ($messages as $msg) {
    $stmt->execute();  // 每次使用 $msg 的当前值
}
?>
```

### 如何处理大数据集避免内存溢出？

**答案要点：**
```php
<?php
// 1. 使用无缓冲查询
$pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);
while ($row = $stmt->fetch()) {
    // 逐行处理
}

// 2. 使用生成器
function fetchLazy(PDO $pdo): Generator {
    $stmt = $pdo->query("SELECT * FROM large_table");
    while ($row = $stmt->fetch()) {
        yield $row;
    }
}

// 3. 分页/分批处理
// 使用 LIMIT + OFFSET 或基于 ID 的游标分页
?>
```

### ATTR_EMULATE_PREPARES 的作用是什么？

**答案要点：**
- `true`（默认）：PDO 在客户端模拟预处理，参数替换后发送完整 SQL
- `false`：使用数据库原生的预处理语句

**建议设置为 `false` 的原因：**
1. 更好的安全性（参数在服务端绑定）
2. 正确处理 LIMIT 等需要整数的参数
3. 利用数据库的查询计划缓存
4. 某些字符集配置不当时，模拟预处理可能存在注入风险

## 延伸阅读

### 官方文档

- [PHP PDO 官方文档](https://www.php.net/manual/zh/book.pdo.php)
- [PDO 预定义常量](https://www.php.net/manual/zh/pdo.constants.php)
- [PDO 驱动列表](https://www.php.net/manual/zh/pdo.drivers.php)

### 数据库专题

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)

### 安全相关

- [OWASP SQL 注入防护](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PHP 安全最佳实践](https://www.php.net/manual/zh/security.php)

### ORM 框架

- [Doctrine ORM](https://www.doctrine-project.org/) - 功能强大的 PHP ORM
- [Eloquent ORM](https://laravel.com/docs/eloquent) - Laravel 的优雅 ORM
- [Cycle ORM](https://cycle-orm.dev/) - 现代化的数据映射器

### 推荐书籍

- 《PHP 和 MySQL Web 开发》
- 《Modern PHP》 - Josh Lockhart
- 《PHP 7 底层设计与源码实现》

### 相关工具

- [PhpMyAdmin](https://www.phpmyadmin.net/) - MySQL 管理工具
- [DBeaver](https://dbeaver.io/) - 跨平台数据库管理工具
- [TablePlus](https://tableplus.com/) - 现代化数据库客户端

---

PDO 是 PHP 数据库操作的基石，掌握其核心概念和最佳实践对于构建安全、高效的应用程序至关重要。通过预处理语句防止 SQL 注入、合理使用事务保证数据一致性、选择合适的获取模式优化性能，这些都是日常开发中需要牢记的要点。随着对 PDO 理解的深入，可以进一步学习 Doctrine、Eloquent 等 ORM 框架，它们在 PDO 基础上提供了更高级的抽象和便捷的开发体验。
