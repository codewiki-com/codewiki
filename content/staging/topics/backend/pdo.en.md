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
origin: old/src/content/docs/php/pdo.en.md
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

PDO (PHP Data Objects) is the standard extension for accessing databases in PHP, providing a unified data access abstraction layer. Regardless of which database system you use, you can execute queries and fetch data through the same API, making it the preferred solution for database operations in modern PHP applications.

## Concept Explanation

### What is PDO

PDO is a database access extension introduced in PHP 5.1, standing for PHP Data Objects. Its design goal is to provide a lightweight, consistent interface for accessing multiple database systems.

**Problems PDO Solves:**

Before PDO, PHP had different extensions for different databases (such as mysql_*, pg_*, etc.), which led to:
- Code tightly coupled to specific databases
- Switching databases required rewriting large amounts of code
- Inconsistent API styles across different extensions
- Varying security levels (e.g., mysql_* extension was prone to SQL injection)

**Databases Supported by PDO:**

```php
<?php
// View PDO drivers supported by the system
print_r(PDO::getAvailableDrivers());
// Example output: ['mysql', 'pgsql', 'sqlite', 'sqlsrv', ...]

/**
 * Commonly supported databases:
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

### PDO vs mysqli Comparison

```php
<?php
// mysqli - MySQL only
$mysqli = new mysqli("localhost", "user", "password", "database");
$result = $mysqli->query("SELECT * FROM users");

// PDO - supports multiple databases
$pdo = new PDO("mysql:host=localhost;dbname=database", "user", "password");
$result = $pdo->query("SELECT * FROM users");

// Switching to PostgreSQL only requires changing the DSN
$pdo = new PDO("pgsql:host=localhost;dbname=database", "user", "password");
// Other code remains unchanged!
?>
```

| Feature | PDO | mysqli |
|-----|-----|--------|
| Database Support | 12+ databases | MySQL only |
| API Style | Object-oriented | Object-oriented/Procedural |
| Named Parameters | Supported | Not supported |
| Prepared Statements | Supported | Supported |
| Transactions | Supported | Supported |
| Stored Procedures | Supported | Supported |

### Three Core PDO Classes

```php
<?php
/**
 * PDO Core Class Structure:
 *
 * 1. PDO - Database Connection Class
 *    - Establishes database connections
 *    - Executes SQL statements
 *    - Manages transactions
 *
 * 2. PDOStatement - Statement Class
 *    - Represents prepared statements
 *    - Executes queries and fetches results
 *    - Binds parameters and columns
 *
 * 3. PDOException - Exception Class
 *    - Handles database errors
 *    - Provides error information and codes
 */

// Example: Typical usage of the three classes
try {
    // PDO class - establish connection
    $pdo = new PDO("mysql:host=localhost;dbname=test", "root", "password");

    // PDOStatement class - prepare and execute statements
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([1]);
    $user = $stmt->fetch();

} catch (PDOException $e) {
    // PDOException class - handle errors
    echo "Database error: " . $e->getMessage();
}
?>
```

## Core Principles

### PDO Driver Layer Architecture

PDO uses a layered architecture design, abstracting database access into a unified interface:

```
┌─────────────────────────────────────────────┐
│              PHP Application                │
├─────────────────────────────────────────────┤
│              PDO Core Layer                 │
│   (Unified API: prepare, execute, fetch...) │
├──────────┬──────────┬──────────┬────────────┤
│ PDO_MySQL│PDO_PgSQL │PDO_SQLite│ PDO_...    │
│  Driver  │  Driver  │  Driver  │  Driver    │
├──────────┼──────────┼──────────┼────────────┤
│  MySQL   │PostgreSQL│  SQLite  │   Other    │
│  Server  │  Server  │   File   │  Databases │
└──────────┴──────────┴──────────┴────────────┘
```

### Prepared Statement Principles

Prepared Statements are the core of PDO's security and performance. The workflow is divided into two phases:

**Phase One: Prepare**
```sql
-- SQL template sent to database server
SELECT * FROM users WHERE id = ? AND status = ?
-- Database parses, compiles, and optimizes execution plan
-- Returns statement handle to client
```

**Phase Two: Execute**
```sql
-- Only parameter values are sent: [1, 'active']
-- Database uses the pre-compiled plan for execution
-- Parameters are treated as data, never interpreted as SQL
```

```php
<?php
// Two-phase process of prepared statements
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");  // Phase 1: Prepare
$stmt->execute([1]);  // Phase 2: Execute

// Same statement can be executed multiple times with different parameters
$stmt->execute([2]);  // Reuses the compiled statement
$stmt->execute([3]);
?>
```

### SQL Injection Prevention Principles

```php
<?php
// Dangerous: Direct SQL concatenation
$username = "admin'; DROP TABLE users; --";
$sql = "SELECT * FROM users WHERE username = '$username'";
// Result: SELECT * FROM users WHERE username = 'admin'; DROP TABLE users; --'
// This will execute the malicious DROP statement!

// Safe: Using prepared statements
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
// Principle: $username is transmitted as pure data, never interpreted as SQL code
// Database receives: username = "admin'; DROP TABLE users; --"
// Quotes and special characters are properly escaped or treated as literal values
?>
```

**Key Points of Prepared Statement Injection Prevention:**
1. SQL structure (template) is separated from data (parameters)
2. Parameters are bound on the database side, not concatenated on the client
3. Database knows parameters are data and won't interpret them as code

### Transaction Processing Principles

PDO transactions follow ACID principles:

```php
<?php
/**
 * ACID Properties:
 *
 * A - Atomicity
 *     All operations in a transaction either succeed completely or fail completely with rollback
 *
 * C - Consistency
 *     After transaction completion, database transitions from one consistent state to another
 *
 * I - Isolation
 *     Multiple concurrent transactions are isolated from each other
 *
 * D - Durability
 *     Once a transaction is committed, modifications to data are permanent
 */

// Transaction processing flow
try {
    $pdo->beginTransaction();  // Start transaction

    // Operation 1: Deduct from Account A
    $pdo->exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1");

    // Operation 2: Add to Account B
    $pdo->exec("UPDATE accounts SET balance = balance + 100 WHERE id = 2");

    $pdo->commit();  // Commit transaction - both operations take effect simultaneously

} catch (Exception $e) {
    $pdo->rollBack();  // Rollback transaction - both operations are reverted
    throw $e;
}
?>
```

### Fetch Mode Internal Mechanism

```php
<?php
/**
 * How PDO Fetch Modes Work:
 *
 * After executing a query, the result set is stored on the server side or in a buffer.
 * The fetch() method converts raw data into different PHP data structures based on the specified mode.
 */

$stmt = $pdo->query("SELECT id, name, email FROM users LIMIT 1");

// Raw data: [1, 'John Doe', 'john@example.com']

// FETCH_ASSOC - Converts to associative array
// ['id' => 1, 'name' => 'John Doe', 'email' => 'john@example.com']

// FETCH_NUM - Converts to indexed array
// [0 => 1, 1 => 'John Doe', 2 => 'john@example.com']

// FETCH_OBJ - Converts to stdClass object
// stdClass { id: 1, name: 'John Doe', email: 'john@example.com' }

// FETCH_CLASS - Converts to instance of specified class
// User { id: 1, name: 'John Doe', email: 'john@example.com' }
?>
```

## Core Points

### Connection Management

```php
<?php
// DSN (Data Source Name) format
$dsn = "driver:param1=value1;param2=value2";

// MySQL DSN
$dsn = "mysql:host=localhost;port=3306;dbname=myapp;charset=utf8mb4";

// PostgreSQL DSN
$dsn = "pgsql:host=localhost;port=5432;dbname=myapp";

// SQLite DSN
$dsn = "sqlite:/path/to/database.sqlite";

// Recommended connection options
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,           // Exception mode
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,      // Default associative array
    PDO::ATTR_EMULATE_PREPARES => false,                   // True prepared statements
    PDO::ATTR_PERSISTENT => false,                         // Non-persistent connection
];

$pdo = new PDO($dsn, $username, $password, $options);
?>
```

### Prepared Statement Binding Methods

```php
<?php
// Method 1: Pass parameter array to execute() (Recommended)
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND status = ?");
$stmt->execute([1, 'active']);

// Method 2: Named parameters
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id AND status = :status");
$stmt->execute([':id' => 1, ':status' => 'active']);

// Method 3: bindValue() - Bind value
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->bindValue(':id', 1, PDO::PARAM_INT);
$stmt->execute();

// Method 4: bindParam() - Bind reference
$id = 1;
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();  // Uses current value of $id
$id = 2;
$stmt->execute();  // Uses new value of $id
?>
```

### Data Fetch Modes

```php
<?php
// Single row fetch
$row = $stmt->fetch(PDO::FETCH_ASSOC);      // Associative array
$row = $stmt->fetch(PDO::FETCH_NUM);        // Indexed array
$row = $stmt->fetch(PDO::FETCH_OBJ);        // stdClass object
$row = $stmt->fetch(PDO::FETCH_BOTH);       // Mixed (default)

// Fetch all
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);  // All rows as associative arrays
$rows = $stmt->fetchAll(PDO::FETCH_COLUMN); // Fetch single column
$rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // Key-value pairs (for two columns)
$rows = $stmt->fetchAll(PDO::FETCH_UNIQUE);   // First column as key
$rows = $stmt->fetchAll(PDO::FETCH_GROUP);    // Group by first column

// Single column fetch
$value = $stmt->fetchColumn();    // Get first column
$value = $stmt->fetchColumn(1);   // Get second column

// Map to class
$stmt->setFetchMode(PDO::FETCH_CLASS, User::class);
$user = $stmt->fetch();
?>
```

### Transaction Control

```php
<?php
// Basic transaction
$pdo->beginTransaction();
try {
    // Execute multiple operations
    $pdo->exec("...");
    $pdo->exec("...");
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    throw $e;
}

// Check transaction status
if ($pdo->inTransaction()) {
    echo "Currently in a transaction";
}

// Savepoints (simulating nested transactions)
$pdo->beginTransaction();
$pdo->exec("SAVEPOINT sp1");
// ... operations ...
$pdo->exec("ROLLBACK TO SAVEPOINT sp1");  // Rollback to savepoint
$pdo->commit();
?>
```

### Error Handling Modes

```php
<?php
// Mode 1: Silent mode (default) - requires manual checking
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
$result = $pdo->query("INVALID SQL");
if ($result === false) {
    print_r($pdo->errorInfo());  // [SQLSTATE, driver error code, error message]
}

// Mode 2: Warning mode - produces PHP Warning
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);

// Mode 3: Exception mode (Recommended) - throws PDOException
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

## Code Examples

### Database Connection

```php
<?php
/**
 * Recommended database connection configuration for production
 */
class Database
{
    private static ?PDO $instance = null;

    private static array $options = [
        // Error mode: throw exceptions
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        // Default fetch mode: associative array
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Disable emulated prepares (use native database prepared statements)
        PDO::ATTR_EMULATE_PREPARES => false,
        // Don't convert strings to PHP null
        PDO::ATTR_ORACLE_NULLS => PDO::NULL_NATURAL,
        // Keep column names as-is when fetching
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

    // Prevent cloning and unserialization
    private function __construct() {}
    private function __clone() {}
    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Usage
$pdo = Database::getConnection();
?>
```

### Complete CRUD Operations Example

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
     * Create user
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
     * Find user by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Get all users (paginated)
     */
    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        // Get total count
        $countStmt = $this->pdo->query("SELECT COUNT(*) FROM users");
        $total = (int) $countStmt->fetchColumn();

        // Get data
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
     * Conditional search
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
     * Update user
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
     * Delete user (soft delete)
     */
    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL
        ");
        return $stmt->execute([$id]);
    }

    /**
     * Batch insert
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

// Usage example
$pdo = Database::getConnection();
$userRepo = new UserRepository($pdo);

// Create user
$userId = $userRepo->create([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => 'secret123',
]);
echo "Created user ID: $userId\n";

// Find user
$user = $userRepo->findById($userId);
print_r($user);

// Update user
$userRepo->update($userId, ['name' => 'John Smith', 'phone' => '1234567890']);

// Search users
$users = $userRepo->search(['name' => 'John', 'status' => 'active']);

// Paginated fetch
$result = $userRepo->findAll(1, 10);
echo "Total {$result['total']} records\n";
?>
```

### Transaction Processing Example

```php
<?php
/**
 * Transfer Service - Transaction Processing Example
 */
class TransferService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Execute transfer
     *
     * @throws Exception
     */
    public function transfer(int $fromAccountId, int $toAccountId, float $amount): array
    {
        // Parameter validation
        if ($amount <= 0) {
            throw new InvalidArgumentException("Transfer amount must be greater than 0");
        }

        if ($fromAccountId === $toAccountId) {
            throw new InvalidArgumentException("Cannot transfer to yourself");
        }

        $this->pdo->beginTransaction();

        try {
            // 1. Lock and check source account
            $stmt = $this->pdo->prepare("
                SELECT id, user_id, balance FROM accounts
                WHERE id = ? FOR UPDATE
            ");
            $stmt->execute([$fromAccountId]);
            $fromAccount = $stmt->fetch();

            if (!$fromAccount) {
                throw new Exception("Source account does not exist");
            }

            if ($fromAccount['balance'] < $amount) {
                throw new Exception("Insufficient balance");
            }

            // 2. Lock and check destination account
            $stmt->execute([$toAccountId]);
            $toAccount = $stmt->fetch();

            if (!$toAccount) {
                throw new Exception("Destination account does not exist");
            }

            // 3. Execute deduction
            $stmt = $this->pdo->prepare("
                UPDATE accounts SET balance = balance - ? WHERE id = ?
            ");
            $stmt->execute([$amount, $fromAccountId]);

            // 4. Execute deposit
            $stmt = $this->pdo->prepare("
                UPDATE accounts SET balance = balance + ? WHERE id = ?
            ");
            $stmt->execute([$amount, $toAccountId]);

            // 5. Record transaction log
            $stmt = $this->pdo->prepare("
                INSERT INTO transactions (from_account_id, to_account_id, amount, type, created_at)
                VALUES (?, ?, ?, 'transfer', NOW())
            ");
            $stmt->execute([$fromAccountId, $toAccountId, $amount]);
            $transactionId = $this->pdo->lastInsertId();

            // 6. Commit transaction
            $this->pdo->commit();

            return [
                'success' => true,
                'transaction_id' => $transactionId,
                'message' => "Successfully transferred $" . number_format($amount, 2),
            ];

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Complex transaction with savepoints
     */
    public function processOrder(int $orderId): bool
    {
        $this->pdo->beginTransaction();

        try {
            // Update order status
            $this->pdo->prepare("UPDATE orders SET status = 'processing' WHERE id = ?")
                ->execute([$orderId]);

            // Savepoint 1: Process payment
            $this->pdo->exec("SAVEPOINT payment");
            try {
                $this->processPayment($orderId);
            } catch (Exception $e) {
                // Payment failed, rollback to savepoint
                $this->pdo->exec("ROLLBACK TO SAVEPOINT payment");
                // Mark order as payment failed
                $this->pdo->prepare("UPDATE orders SET status = 'payment_failed' WHERE id = ?")
                    ->execute([$orderId]);
                $this->pdo->commit();
                return false;
            }

            // Savepoint 2: Process inventory
            $this->pdo->exec("SAVEPOINT inventory");
            try {
                $this->deductInventory($orderId);
            } catch (Exception $e) {
                $this->pdo->exec("ROLLBACK TO SAVEPOINT inventory");
                // Refund payment
                $this->refundPayment($orderId);
                $this->pdo->prepare("UPDATE orders SET status = 'inventory_failed' WHERE id = ?")
                    ->execute([$orderId]);
                $this->pdo->commit();
                return false;
            }

            // Complete order
            $this->pdo->prepare("UPDATE orders SET status = 'completed' WHERE id = ?")
                ->execute([$orderId]);

            $this->pdo->commit();
            return true;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function processPayment(int $orderId): void { /* Payment processing */ }
    private function deductInventory(int $orderId): void { /* Inventory deduction */ }
    private function refundPayment(int $orderId): void { /* Refund processing */ }
}
?>
```

### Data Fetch Modes Detailed

```php
<?php
// Prepare test data
$pdo->exec("
    CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY,
        category_id INT,
        name VARCHAR(100),
        price DECIMAL(10,2)
    )
");

// FETCH_ASSOC - Associative array (most common)
$stmt = $pdo->query("SELECT id, name, price FROM products");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['name']}: \${$row['price']}\n";
}

// FETCH_OBJ - Anonymous object
$stmt = $pdo->query("SELECT id, name, price FROM products");
while ($product = $stmt->fetch(PDO::FETCH_OBJ)) {
    echo "{$product->name}: \${$product->price}\n";
}

// FETCH_CLASS - Map to custom class
class Product
{
    public int $id;
    public string $name;
    public float $price;

    public function getFormattedPrice(): string
    {
        return '$' . number_format($this->price, 2);
    }
}

$stmt = $pdo->query("SELECT id, name, price FROM products");
$stmt->setFetchMode(PDO::FETCH_CLASS, Product::class);
while ($product = $stmt->fetch()) {
    echo "{$product->name}: {$product->getFormattedPrice()}\n";
}

// FETCH_KEY_PAIR - Two columns become key-value pairs
$stmt = $pdo->query("SELECT id, name FROM products");
$productNames = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
// Result: [1 => 'Product A', 2 => 'Product B', 3 => 'Product C']

// FETCH_UNIQUE - First column as key
$stmt = $pdo->query("SELECT id, name, price FROM products");
$products = $stmt->fetchAll(PDO::FETCH_UNIQUE);
// Result: [1 => ['name' => 'Product A', 'price' => 99.00], ...]

// FETCH_GROUP - Group by first column
$stmt = $pdo->query("SELECT category_id, id, name FROM products ORDER BY category_id");
$grouped = $stmt->fetchAll(PDO::FETCH_GROUP);
// Result: [1 => [['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B']], 2 => [...]]

// FETCH_COLUMN - Get single column
$stmt = $pdo->query("SELECT name FROM products");
$names = $stmt->fetchAll(PDO::FETCH_COLUMN);
// Result: ['Product A', 'Product B', 'Product C']

// fetchColumn() - Get single value
$count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
echo "Total $count products\n";
?>
```

### Error Handling Best Practices

```php
<?php
/**
 * Custom Database Exception Class
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
 * Database Operations Wrapper Class
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
        // Log error
        error_log(sprintf(
            "[DB Error] %s | SQL: %s | Params: %s",
            $e->getMessage(),
            $sql,
            json_encode($params)
        ));

        $dbException = new DatabaseException($e, $sql, $params);

        // Return friendly messages based on error type
        if ($dbException->isDuplicateEntry()) {
            throw new RuntimeException('This record already exists', 409, $dbException);
        }

        if ($dbException->isForeignKeyViolation()) {
            throw new RuntimeException('Related data does not exist or cannot be deleted', 400, $dbException);
        }

        if ($dbException->isConnectionError()) {
            throw new RuntimeException('Database connection failed, please try again later', 503, $dbException);
        }

        if ($dbException->isDeadlock()) {
            throw new RuntimeException('Operation conflict, please retry', 409, $dbException);
        }

        // Show detailed error in development environment
        if ($this->debug) {
            throw $dbException;
        }

        // Show generic error in production environment
        throw new RuntimeException('Database operation failed', 500, $dbException);
    }
}

// Usage example
$db = new SafeDatabase($pdo, debug: false);

try {
    $userId = $db->insert('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
} catch (RuntimeException $e) {
    // Get user-friendly error message
    echo $e->getMessage();  // "This record already exists"
}
?>
```

## Best Practices

### Connection Configuration Best Practices

```php
<?php
// Recommended configuration for production
$options = [
    // Required: Exception mode for error handling
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

    // Recommended: Default to associative arrays
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

    // Important: Disable emulated prepares, use true prepared statements
    // This prevents certain types of SQL injection and improves performance
    PDO::ATTR_EMULATE_PREPARES => false,

    // MySQL specific: Set correct character set
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",

    // Optional: Connection timeout
    PDO::ATTR_TIMEOUT => 5,
];
?>
```

### Always Use Prepared Statements

```php
<?php
// Wrong: Directly concatenating user input
$name = $_GET['name'];
// Never do this!
// $pdo->query("SELECT * FROM users WHERE name = '$name'");

// Correct: Using prepared statements
$stmt = $pdo->prepare("SELECT * FROM users WHERE name = ?");
$stmt->execute([$name]);

// For dynamic column/table names, use whitelist validation
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

    // Safe to concatenate after whitelist validation
    $sql = "SELECT * FROM users ORDER BY $column $direction";
    return $pdo->query($sql)->fetchAll();
}
?>
```

### Use Transactions Wisely

```php
<?php
// Use callback to wrap transactions, ensuring proper exception handling
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

// Usage example
$orderId = transaction($pdo, function ($pdo) {
    $pdo->exec("INSERT INTO orders (user_id, total) VALUES (1, 100)");
    $orderId = $pdo->lastInsertId();

    $pdo->exec("INSERT INTO order_items (order_id, product_id) VALUES ($orderId, 1)");
    $pdo->exec("UPDATE products SET stock = stock - 1 WHERE id = 1");

    return $orderId;
});
?>
```

### Secure Password Storage

```php
<?php
// Hash password when creating user
function createUser(PDO $pdo, string $email, string $password): int
{
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT, [
        'cost' => 12  // Increase computation cost for better security
    ]);

    $stmt = $pdo->prepare("
        INSERT INTO users (email, password) VALUES (?, ?)
    ");
    $stmt->execute([$email, $hashedPassword]);

    return (int) $pdo->lastInsertId();
}

// Verify login
function verifyLogin(PDO $pdo, string $email, string $password): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        // Prevent timing attacks: also verify password when user doesn't exist
        if (!$user) {
            password_verify($password, '$2y$12$invalidhashfortimingattempt');
        }
        return null;
    }

    // Check if rehash is needed (when algorithm is upgraded)
    if (password_needs_rehash($user['password'], PASSWORD_DEFAULT, ['cost' => 12])) {
        updatePassword($pdo, $user['id'], $password);
    }

    unset($user['password']);  // Don't return password field
    return $user;
}
?>
```

### Handling Large Datasets

```php
<?php
// Use unbuffered queries to avoid memory overflow
function processLargeTable(PDO $pdo): Generator
{
    // Disable query buffering
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);

    $stmt = $pdo->query("SELECT * FROM large_table");

    while ($row = $stmt->fetch()) {
        yield $row;  // Process row by row using generator
    }

    // Restore default setting
    $pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
}

// Usage
foreach (processLargeTable($pdo) as $row) {
    processRow($row);
}

// Batch process large amounts of data
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
            // Process each record
        }

        $lastId = end($rows)['id'];
        echo "Processed up to ID: $lastId\n";
    }
}
?>
```

## Common Pitfalls

### Ignoring Error Handling

```php
<?php
// Wrong: Not setting exception mode, errors are silently ignored
$pdo = new PDO($dsn, $user, $pass);
$result = $pdo->query("INVALID SQL");  // Returns false, but no indication
// Subsequent code continues, may cause data inconsistency

// Correct: Always use exception mode
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
]);
// Now errors throw exceptions that can be properly caught and handled
?>
```

### Executing Queries in Loops

```php
<?php
// Wrong: N+1 query problem
$users = $pdo->query("SELECT * FROM users")->fetchAll();
foreach ($users as $user) {
    // One query per user = N extra queries
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $orders = $stmt->fetchAll();
}

// Correct: Use JOIN or batch queries
$stmt = $pdo->query("
    SELECT u.*, o.id as order_id, o.total
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
");
$results = $stmt->fetchAll();

// Or batch fetch then combine in PHP
$userIds = array_column($users, 'id');
$placeholders = implode(',', array_fill(0, count($userIds), '?'));
$stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id IN ($placeholders)");
$stmt->execute($userIds);
$allOrders = $stmt->fetchAll(PDO::FETCH_GROUP);  // Group by user_id
?>
```

### Misunderstanding EMULATE_PREPARES

```php
<?php
// Problems with emulated prepares (enabled by default)

// Problem 1: LIMIT parameter type issues
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
$stmt = $pdo->prepare("SELECT * FROM users LIMIT ?");
$stmt->execute([10]);
// In emulated mode, 10 might be treated as string '10', some databases will error

// Solution: Disable emulated prepares
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
$stmt = $pdo->prepare("SELECT * FROM users LIMIT ?");
$stmt->bindValue(1, 10, PDO::PARAM_INT);  // Explicitly specify type
$stmt->execute();

// Problem 2: Security concerns with emulated prepares
// In extreme cases, if database connection charset is incorrectly set,
// emulated prepares may be vulnerable to SQL injection
// Solution: Disable emulated prepares + correctly set charset
$dsn = "mysql:host=localhost;dbname=test;charset=utf8mb4";
$options = [
    PDO::ATTR_EMULATE_PREPARES => false,
];
?>
```

### Transaction Not Properly Handled

```php
<?php
// Wrong: Transaction not rolled back after exception
$pdo->beginTransaction();
$pdo->exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
$pdo->exec("UPDATE invalid_table SET ...");  // This fails
$pdo->commit();  // Transaction in intermediate state

// Wrong: Nested transactions
$pdo->beginTransaction();
// ... some operations ...
$pdo->beginTransaction();  // Error! PDO doesn't support true nested transactions
// This will throw exception or cause unexpected behavior

// Correct: Use try-catch to ensure rollback
$pdo->beginTransaction();
try {
    $pdo->exec("...");
    $pdo->exec("...");
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    throw $e;
}

// Correct: Check transaction status
if (!$pdo->inTransaction()) {
    $pdo->beginTransaction();
}
?>
```

### fetchAll on Large Dataset Causing Memory Overflow

```php
<?php
// Wrong: Fetching all data at once
$stmt = $pdo->query("SELECT * FROM logs");  // Assume millions of records
$logs = $stmt->fetchAll();  // Memory overflow!

// Correct: Process row by row
$stmt = $pdo->query("SELECT * FROM logs");
while ($log = $stmt->fetch()) {
    processLog($log);
}

// Correct: Use LIMIT pagination
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

### Parameter Type Mismatch

```php
<?php
// Problem: Passing string to field requiring integer
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute(["1"]);  // Passing string "1"
// Some databases may not use index correctly

// Correct: Explicitly specify parameter type
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bindValue(1, 1, PDO::PARAM_INT);
$stmt->execute();

// Or cast type before execute
$stmt->execute([(int) $userId]);

// Common parameter types
PDO::PARAM_STR   // String (default)
PDO::PARAM_INT   // Integer
PDO::PARAM_BOOL  // Boolean
PDO::PARAM_NULL  // NULL
PDO::PARAM_LOB   // Large object
?>
```

### IN Clause Parameter Binding Error

```php
<?php
// Wrong: Cannot directly pass array
$ids = [1, 2, 3];
$stmt = $pdo->prepare("SELECT * FROM users WHERE id IN (?)");
$stmt->execute([$ids]);  // Doesn't work!

// Correct: Dynamically generate placeholders
$ids = [1, 2, 3];
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare("SELECT * FROM users WHERE id IN ($placeholders)");
$stmt->execute($ids);

// Encapsulate as reusable function
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

## Performance Considerations

### Prepared Statement Reuse

```php
<?php
// Inefficient: Preparing new statement each time
foreach ($users as $user) {
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
}

// Efficient: Reuse prepared statement
$stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
foreach ($users as $user) {
    $stmt->execute([$user['id']]);
}

// More efficient: Batch update
$ids = array_column($users, 'id');
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$pdo->prepare("UPDATE users SET last_login = NOW() WHERE id IN ($placeholders)")
    ->execute($ids);
?>
```

### Batch Insert Optimization

```php
<?php
// Inefficient: Inserting one by one
foreach ($products as $product) {
    $stmt = $pdo->prepare("INSERT INTO products (name, price) VALUES (?, ?)");
    $stmt->execute([$product['name'], $product['price']]);
}

// Efficient: Single SQL batch insert
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

// Usage
$products = [
    ['name' => 'Product 1', 'price' => 100],
    ['name' => 'Product 2', 'price' => 200],
    // ... more data
];
$count = bulkInsert($pdo, 'products', $products);
?>
```

### Query Optimization

```php
<?php
// 1. Only select needed columns
// Bad
$pdo->query("SELECT * FROM users");
// Good
$pdo->query("SELECT id, name, email FROM users");

// 2. Use indexes
// Ensure columns in WHERE clause have indexes
$pdo->query("SELECT * FROM orders WHERE user_id = 1");  // user_id should be indexed

// 3. Avoid SELECT IN subquery, use JOIN
// Bad
$sql = "SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active')";
// Good
$sql = "SELECT o.* FROM orders o INNER JOIN users u ON o.user_id = u.id WHERE u.status = 'active'";

// 4. Use EXPLAIN to analyze queries
$stmt = $pdo->query("EXPLAIN SELECT * FROM users WHERE email = 'test@example.com'");
print_r($stmt->fetchAll());
// Check if index is used, how many rows are scanned

// 5. Use LIMIT wisely
$pdo->prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT ?")
    ->execute([100]);
?>
```

### Connection Management

```php
<?php
// 1. Use connection pooling (simulated through persistent connections)
$options = [
    PDO::ATTR_PERSISTENT => true,  // Enable persistent connection
];

// 2. Close connections when no longer needed
$pdo = null;  // Explicitly close connection

// 3. Use connection pool tools like PgBouncer (PostgreSQL) or ProxySQL (MySQL)

// 4. Singleton pattern to avoid creating duplicate connections
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

### Caching Strategy

```php
<?php
/**
 * Simple Query Cache Implementation
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

// For production, consider using external cache like Redis
?>
```

## Real-World Scenarios

### Scenario 1: User Authentication System

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
        // Check if email already exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new RuntimeException("This email is already registered");
        }

        // Create user
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
            // Record failed attempt
            $this->recordFailedAttempt($email);
            return null;
        }

        // Check if account is locked
        if ($this->isAccountLocked($email)) {
            throw new RuntimeException("Account is locked, please try again later");
        }

        // Update last login time
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

### Scenario 2: E-commerce Order System

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
            // 1. Lock and validate inventory
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

            // 2. Calculate total and validate stock
            $totalAmount = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $product = $products[$item['product_id']] ?? null;

                if (!$product) {
                    throw new RuntimeException("Product does not exist: {$item['product_id']}");
                }

                if ($product['stock'] < $item['quantity']) {
                    throw new RuntimeException("Insufficient stock: {$product['name']}");
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

            // 3. Create order
            $stmt = $this->pdo->prepare("
                INSERT INTO orders (user_id, total_amount, status, created_at)
                VALUES (?, ?, 'pending', NOW())
            ");
            $stmt->execute([$userId, $totalAmount]);
            $orderId = $this->pdo->lastInsertId();

            // 4. Create order items
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

            // 5. Deduct inventory
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
            // Validate order
            $stmt = $this->pdo->prepare("
                SELECT id, status FROM orders
                WHERE id = ? AND user_id = ?
                FOR UPDATE
            ");
            $stmt->execute([$orderId, $userId]);
            $order = $stmt->fetch();

            if (!$order) {
                throw new RuntimeException("Order does not exist");
            }

            if ($order['status'] !== 'pending') {
                throw new RuntimeException("Can only cancel pending orders");
            }

            // Get order items
            $stmt = $this->pdo->prepare("
                SELECT product_id, quantity FROM order_items WHERE order_id = ?
            ");
            $stmt->execute([$orderId]);
            $items = $stmt->fetchAll();

            // Restore inventory
            $stmt = $this->pdo->prepare("
                UPDATE products SET stock = stock + ? WHERE id = ?
            ");

            foreach ($items as $item) {
                $stmt->execute([$item['quantity'], $item['product_id']]);
            }

            // Update order status
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

### Scenario 3: Data Import/Export

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
     * Export large table to CSV (streaming to avoid memory overflow)
     */
    public function exportToCsv(string $table, string $filename): int
    {
        $file = fopen($filename, 'w');
        if (!$file) {
            throw new RuntimeException("Cannot create file: $filename");
        }

        // Disable query buffering
        $this->pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);

        $stmt = $this->pdo->query("SELECT * FROM $table");
        $count = 0;

        // Write header
        $firstRow = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($firstRow) {
            fputcsv($file, array_keys($firstRow));
            fputcsv($file, array_values($firstRow));
            $count++;

            // Write data rows
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
     * Import data from CSV (batch insert)
     */
    public function importFromCsv(string $table, string $filename, int $batchSize = 500): int
    {
        $file = fopen($filename, 'r');
        if (!$file) {
            throw new RuntimeException("Cannot open file: $filename");
        }

        // Read header
        $headers = fgetcsv($file);
        if (!$headers) {
            throw new RuntimeException("CSV file is empty");
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

                // Commit per batch
                if ($count % $batchSize === 0) {
                    $this->pdo->commit();
                    $this->pdo->beginTransaction();
                    echo "Imported $count records...\n";
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

## Interview Key Points

### What are the differences between PDO and mysqli?

**Key Points:**
- PDO supports 12+ databases, mysqli only supports MySQL
- PDO supports named parameters (`:name`), mysqli only supports positional parameters (`?`)
- PDO is purely object-oriented, mysqli supports both object-oriented and procedural
- PDO makes it easier to write database-agnostic code
- Both support prepared statements and transactions

### How do you prevent SQL injection with PDO?

**Key Points:**
```php
<?php
// Use prepared statements, separating parameters from SQL
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$userInput]);

// Principle: User input is transmitted as data, never interpreted as SQL code
// Disabling emulated prepares provides best security
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

// For dynamic table/column names, use whitelist validation
$allowedColumns = ['name', 'email', 'created_at'];
if (!in_array($column, $allowedColumns)) {
    throw new InvalidArgumentException("Invalid column");
}
?>
```

### What are PDO's three error handling modes?

**Key Points:**
- `PDO::ERRMODE_SILENT`: Silent mode (default), requires manual error checking
- `PDO::ERRMODE_WARNING`: Warning mode, produces PHP Warning
- `PDO::ERRMODE_EXCEPTION`: Exception mode (recommended), throws PDOException

### What are the use cases and considerations for PDO transactions?

**Key Points:**
```php
<?php
// Use cases: Ensuring atomicity of multiple operations
// E.g.: Money transfers, order processing, etc.

// Considerations:
// 1. Must use try-catch to ensure rollback on exception
// 2. Don't perform time-consuming operations (like sending emails) in transactions
// 3. PDO doesn't support true nested transactions, use savepoints to simulate
// 4. Ensure the table engine supports transactions (e.g., InnoDB)

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

### What's the difference between FETCH_CLASS and FETCH_OBJ?

**Key Points:**
- `FETCH_OBJ`: Returns stdClass anonymous object
- `FETCH_CLASS`: Returns instance of specified class, can include methods and business logic
- `FETCH_CLASS` by default sets properties before calling constructor
- Use `PDO::FETCH_PROPS_LATE` to call constructor first

### What's the difference between bindParam and bindValue?

**Key Points:**
```php
<?php
// bindValue: Binds value, immediately copies variable's value
$id = 1;
$stmt->bindValue(':id', $id, PDO::PARAM_INT);
$id = 2;
$stmt->execute();  // Uses value 1

// bindParam: Binds reference, reads variable's value at execution time
$id = 1;
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$id = 2;
$stmt->execute();  // Uses value 2

// bindParam is suitable for reusing statements in loops
$stmt = $pdo->prepare("INSERT INTO logs (msg) VALUES (?)");
$stmt->bindParam(1, $msg);
foreach ($messages as $msg) {
    $stmt->execute();  // Uses current value of $msg each time
}
?>
```

### How do you handle large datasets to avoid memory overflow?

**Key Points:**
```php
<?php
// 1. Use unbuffered queries
$pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);
while ($row = $stmt->fetch()) {
    // Process row by row
}

// 2. Use generators
function fetchLazy(PDO $pdo): Generator {
    $stmt = $pdo->query("SELECT * FROM large_table");
    while ($row = $stmt->fetch()) {
        yield $row;
    }
}

// 3. Pagination/batch processing
// Use LIMIT + OFFSET or cursor-based pagination with ID
?>
```

### What does ATTR_EMULATE_PREPARES do?

**Key Points:**
- `true` (default): PDO emulates prepared statements on client side, sends complete SQL after parameter substitution
- `false`: Uses database's native prepared statements

**Reasons to set it to `false`:**
1. Better security (parameters bound on server side)
2. Correctly handles parameters requiring integers like LIMIT
3. Utilizes database's query plan cache
4. Emulated prepares may have injection vulnerabilities with certain charset misconfigurations

## Further Reading

### Official Documentation

- [PHP PDO Official Documentation](https://www.php.net/manual/en/book.pdo.php)
- [PDO Predefined Constants](https://www.php.net/manual/en/pdo.constants.php)
- [PDO Driver List](https://www.php.net/manual/en/pdo.drivers.php)

### Database Topics

- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [SQLite Official Documentation](https://www.sqlite.org/docs.html)

### Security Related

- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PHP Security Best Practices](https://www.php.net/manual/en/security.php)

### ORM Frameworks

- [Doctrine ORM](https://www.doctrine-project.org/) - Powerful PHP ORM
- [Eloquent ORM](https://laravel.com/docs/eloquent) - Laravel's elegant ORM
- [Cycle ORM](https://cycle-orm.dev/) - Modern data mapper

### Recommended Books

- "PHP and MySQL Web Development"
- "Modern PHP" - Josh Lockhart
- "PHP 7 Programming Blueprints"

### Related Tools

- [PhpMyAdmin](https://www.phpmyadmin.net/) - MySQL management tool
- [DBeaver](https://dbeaver.io/) - Cross-platform database management tool
- [TablePlus](https://tableplus.com/) - Modern database client

---

PDO is the cornerstone of PHP database operations. Mastering its core concepts and best practices is crucial for building secure, efficient applications. Using prepared statements to prevent SQL injection, properly using transactions to ensure data consistency, and choosing appropriate fetch modes to optimize performance are all key points to remember in daily development. As you deepen your understanding of PDO, you can further explore ORM frameworks like Doctrine and Eloquent, which provide higher-level abstractions and more convenient development experiences built on top of PDO.
