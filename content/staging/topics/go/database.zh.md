---
title: 数据库操作
description: Go数据库操作完全指南，database/sql、连接池与ORM
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - 数据库
  - SQL
  - ORM
status: imported
origin: old/src/content/docs/go/database.zh.md
divergence: 0.164
issues: []
legacy:
  category: Go
  subcategory: 数据访问
  order: 14
  lastUpdated: 2026-01-07
---

Go 语言提供了强大而灵活的数据库访问能力。标准库中的 `database/sql` 包定义了与 SQL 数据库交互的通用接口，配合各种数据库驱动程序，可以轻松连接 MySQL、PostgreSQL、SQLite 等主流数据库。本文将全面介绍 Go 中的数据库操作，从基础的 `database/sql` 到流行的 ORM 框架 GORM。

## database/sql 包概述

`database/sql` 是 Go 标准库提供的数据库访问接口，它不包含具体的数据库驱动实现，而是定义了一套通用的 API。这种设计使得：

- 代码可以在不同数据库之间轻松切换
- 数据库驱动可以独立开发和更新
- 应用程序只需依赖标准接口

### 核心类型

```go
// sql.DB - 数据库连接池（不是单个连接）
type DB struct { ... }

// sql.Tx - 数据库事务
type Tx struct { ... }

// sql.Stmt - 预编译语句
type Stmt struct { ... }

// sql.Row - 单行查询结果
type Row struct { ... }

// sql.Rows - 多行查询结果
type Rows struct { ... }
```

## 连接数据库

### 安装数据库驱动

首先需要安装对应数据库的驱动程序：

```bash
# MySQL 驱动
go get -u github.com/go-sql-driver/mysql

# PostgreSQL 驱动
go get -u github.com/lib/pq

# SQLite 驱动
go get -u modernc.org/sqlite
# 或者使用 CGO 版本
go get -u github.com/mattn/go-sqlite3
```

### 建立连接

```go
package main

import (
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/go-sql-driver/mysql" // MySQL 驱动
)

func main() {
    // DSN (Data Source Name) 格式：
    // [username[:password]@][protocol[(address)]]/dbname[?param1=value1&...]
    dsn := "root:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True&loc=Local"

    // sql.Open 不会立即建立连接，只是初始化连接池
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal("打开数据库失败:", err)
    }
    defer db.Close()

    // Ping 会真正建立连接并验证
    if err := db.Ping(); err != nil {
        log.Fatal("连接数据库失败:", err)
    }

    fmt.Println("数据库连接成功！")
}
```

### PostgreSQL 连接示例

```go
import (
    "database/sql"
    _ "github.com/lib/pq"
)

func connectPostgreSQL() (*sql.DB, error) {
    // PostgreSQL DSN 格式
    dsn := "host=localhost port=5432 user=postgres password=secret dbname=mydb sslmode=disable"

    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, err
    }

    if err := db.Ping(); err != nil {
        return nil, err
    }

    return db, nil
}
```

### SQLite 连接示例

```go
import (
    "database/sql"
    _ "modernc.org/sqlite"
)

func connectSQLite() (*sql.DB, error) {
    // SQLite 使用文件路径作为 DSN
    db, err := sql.Open("sqlite", "./mydata.db")
    if err != nil {
        return nil, err
    }

    if err := db.Ping(); err != nil {
        return nil, err
    }

    return db, nil
}
```

## 连接池配置

`sql.DB` 实际上是一个连接池，而不是单个数据库连接。合理配置连接池对于应用程序的性能和稳定性至关重要。

### 连接池参数

```go
func setupConnectionPool(db *sql.DB) {
    // 设置最大打开连接数
    // 默认值为 0（无限制）
    db.SetMaxOpenConns(25)

    // 设置最大空闲连接数
    // 默认值为 2
    db.SetMaxIdleConns(10)

    // 设置连接的最大生存时间
    // 默认值为 0（永不过期）
    db.SetConnMaxLifetime(5 * time.Minute)

    // 设置连接的最大空闲时间（Go 1.15+）
    // 默认值为 0（永不过期）
    db.SetConnMaxIdleTime(2 * time.Minute)
}
```

### 连接池最佳实践

```go
package main

import (
    "context"
    "database/sql"
    "log"
    "time"

    _ "github.com/go-sql-driver/mysql"
)

// DBConfig 数据库配置
type DBConfig struct {
    DSN             string
    MaxOpenConns    int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
    ConnMaxIdleTime time.Duration
}

// NewDB 创建并配置数据库连接池
func NewDB(cfg DBConfig) (*sql.DB, error) {
    db, err := sql.Open("mysql", cfg.DSN)
    if err != nil {
        return nil, err
    }

    // 配置连接池
    db.SetMaxOpenConns(cfg.MaxOpenConns)
    db.SetMaxIdleConns(cfg.MaxIdleConns)
    db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
    db.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

    // 使用带超时的 context 验证连接
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := db.PingContext(ctx); err != nil {
        db.Close()
        return nil, err
    }

    return db, nil
}

func main() {
    cfg := DBConfig{
        DSN:             "root:password@tcp(127.0.0.1:3306)/mydb?parseTime=true",
        MaxOpenConns:    25,
        MaxIdleConns:    10,
        ConnMaxLifetime: 5 * time.Minute,
        ConnMaxIdleTime: 2 * time.Minute,
    }

    db, err := NewDB(cfg)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 获取连接池统计信息
    stats := db.Stats()
    log.Printf("连接池状态: 打开=%d, 使用中=%d, 空闲=%d",
        stats.OpenConnections,
        stats.InUse,
        stats.Idle)
}
```

## CRUD 操作

### 插入数据

```go
// 用户结构体
type User struct {
    ID        int64
    Name      string
    Email     string
    Age       int
    CreatedAt time.Time
}

// 插入单条记录
func CreateUser(db *sql.DB, user *User) error {
    query := `INSERT INTO users (name, email, age, created_at) VALUES (?, ?, ?, ?)`

    result, err := db.Exec(query, user.Name, user.Email, user.Age, time.Now())
    if err != nil {
        return err
    }

    // 获取自增 ID
    id, err := result.LastInsertId()
    if err != nil {
        return err
    }

    user.ID = id
    return nil
}

// 使用 Context 版本（推荐）
func CreateUserContext(ctx context.Context, db *sql.DB, user *User) error {
    query := `INSERT INTO users (name, email, age, created_at) VALUES (?, ?, ?, ?)`

    result, err := db.ExecContext(ctx, query, user.Name, user.Email, user.Age, time.Now())
    if err != nil {
        return err
    }

    id, err := result.LastInsertId()
    if err != nil {
        return err
    }

    user.ID = id
    return nil
}
```

### 查询单条记录

```go
// 根据 ID 查询用户
func GetUserByID(db *sql.DB, id int64) (*User, error) {
    query := `SELECT id, name, email, age, created_at FROM users WHERE id = ?`

    user := &User{}
    err := db.QueryRow(query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Age,
        &user.CreatedAt,
    )

    if err != nil {
        if err == sql.ErrNoRows {
            return nil, nil // 没有找到记录
        }
        return nil, err
    }

    return user, nil
}

// 使用 Context 版本
func GetUserByIDContext(ctx context.Context, db *sql.DB, id int64) (*User, error) {
    query := `SELECT id, name, email, age, created_at FROM users WHERE id = ?`

    user := &User{}
    err := db.QueryRowContext(ctx, query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Age,
        &user.CreatedAt,
    )

    if err != nil {
        if err == sql.ErrNoRows {
            return nil, nil
        }
        return nil, err
    }

    return user, nil
}
```

### 查询多条记录

```go
// 获取所有用户
func GetAllUsers(db *sql.DB) ([]User, error) {
    query := `SELECT id, name, email, age, created_at FROM users ORDER BY id`

    rows, err := db.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close() // 重要：必须关闭 rows

    var users []User
    for rows.Next() {
        var user User
        err := rows.Scan(
            &user.ID,
            &user.Name,
            &user.Email,
            &user.Age,
            &user.CreatedAt,
        )
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    // 检查迭代过程中是否有错误
    if err := rows.Err(); err != nil {
        return nil, err
    }

    return users, nil
}

// 分页查询
func GetUsersPaginated(db *sql.DB, page, pageSize int) ([]User, error) {
    offset := (page - 1) * pageSize
    query := `SELECT id, name, email, age, created_at FROM users ORDER BY id LIMIT ? OFFSET ?`

    rows, err := db.Query(query, pageSize, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age, &user.CreatedAt); err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    return users, rows.Err()
}
```

### 更新数据

```go
// 更新用户信息
func UpdateUser(db *sql.DB, user *User) error {
    query := `UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?`

    result, err := db.Exec(query, user.Name, user.Email, user.Age, user.ID)
    if err != nil {
        return err
    }

    // 检查是否有记录被更新
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }

    if rowsAffected == 0 {
        return fmt.Errorf("用户 ID %d 不存在", user.ID)
    }

    return nil
}

// 部分更新
func UpdateUserEmail(ctx context.Context, db *sql.DB, userID int64, email string) error {
    query := `UPDATE users SET email = ? WHERE id = ?`

    result, err := db.ExecContext(ctx, query, email, userID)
    if err != nil {
        return err
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return sql.ErrNoRows
    }

    return nil
}
```

### 删除数据

```go
// 删除用户
func DeleteUser(db *sql.DB, id int64) error {
    query := `DELETE FROM users WHERE id = ?`

    result, err := db.Exec(query, id)
    if err != nil {
        return err
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }

    if rowsAffected == 0 {
        return fmt.Errorf("用户 ID %d 不存在", id)
    }

    return nil
}

// 批量删除
func DeleteUsersByAge(ctx context.Context, db *sql.DB, minAge int) (int64, error) {
    query := `DELETE FROM users WHERE age < ?`

    result, err := db.ExecContext(ctx, query, minAge)
    if err != nil {
        return 0, err
    }

    return result.RowsAffected()
}
```

## 预编译语句 (Prepared Statements)

预编译语句可以提高性能并防止 SQL 注入攻击。

### 基本用法

```go
// 创建预编译语句
func PreparedStatementExample(db *sql.DB) error {
    // 准备语句
    stmt, err := db.Prepare(`SELECT id, name, email FROM users WHERE age > ?`)
    if err != nil {
        return err
    }
    defer stmt.Close() // 使用完毕后关闭

    // 多次执行同一语句
    ages := []int{18, 25, 30}
    for _, age := range ages {
        rows, err := stmt.Query(age)
        if err != nil {
            return err
        }

        for rows.Next() {
            var id int64
            var name, email string
            if err := rows.Scan(&id, &name, &email); err != nil {
                rows.Close()
                return err
            }
            fmt.Printf("ID: %d, Name: %s, Email: %s\n", id, name, email)
        }
        rows.Close()

        if err := rows.Err(); err != nil {
            return err
        }
    }

    return nil
}
```

### 预编译语句管理器

```go
// StmtManager 预编译语句管理器
type StmtManager struct {
    db    *sql.DB
    stmts map[string]*sql.Stmt
    mu    sync.RWMutex
}

// NewStmtManager 创建语句管理器
func NewStmtManager(db *sql.DB) *StmtManager {
    return &StmtManager{
        db:    db,
        stmts: make(map[string]*sql.Stmt),
    }
}

// Prepare 准备并缓存语句
func (m *StmtManager) Prepare(name, query string) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    if _, exists := m.stmts[name]; exists {
        return nil // 已存在
    }

    stmt, err := m.db.Prepare(query)
    if err != nil {
        return err
    }

    m.stmts[name] = stmt
    return nil
}

// Get 获取预编译语句
func (m *StmtManager) Get(name string) (*sql.Stmt, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    stmt, ok := m.stmts[name]
    return stmt, ok
}

// Close 关闭所有语句
func (m *StmtManager) Close() {
    m.mu.Lock()
    defer m.mu.Unlock()
    for _, stmt := range m.stmts {
        stmt.Close()
    }
}

// 使用示例
func useStmtManager(db *sql.DB) {
    manager := NewStmtManager(db)
    defer manager.Close()

    // 准备常用语句
    manager.Prepare("getUserByID", "SELECT id, name, email FROM users WHERE id = ?")
    manager.Prepare("getUsersByAge", "SELECT id, name, email FROM users WHERE age > ?")

    // 使用预编译语句
    if stmt, ok := manager.Get("getUserByID"); ok {
        var id int64
        var name, email string
        stmt.QueryRow(1).Scan(&id, &name, &email)
    }
}
```

## 事务处理

事务确保一组数据库操作要么全部成功，要么全部失败。

### 基本事务

```go
// TransferMoney 转账示例
func TransferMoney(db *sql.DB, fromID, toID int64, amount float64) error {
    // 开始事务
    tx, err := db.Begin()
    if err != nil {
        return err
    }

    // 使用 defer 确保事务正确结束
    defer func() {
        if err != nil {
            tx.Rollback() // 出错时回滚
        }
    }()

    // 扣除转出账户余额
    result, err := tx.Exec(
        `UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?`,
        amount, fromID, amount,
    )
    if err != nil {
        return err
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return fmt.Errorf("余额不足或账户不存在")
    }

    // 增加转入账户余额
    _, err = tx.Exec(
        `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
        amount, toID,
    )
    if err != nil {
        return err
    }

    // 记录转账记录
    _, err = tx.Exec(
        `INSERT INTO transfers (from_id, to_id, amount, created_at) VALUES (?, ?, ?, ?)`,
        fromID, toID, amount, time.Now(),
    )
    if err != nil {
        return err
    }

    // 提交事务
    return tx.Commit()
}
```

### 使用 Context 的事务

```go
// TransferMoneyContext 带 Context 的事务
func TransferMoneyContext(ctx context.Context, db *sql.DB, fromID, toID int64, amount float64) error {
    // 使用 BeginTx 可以设置事务选项
    tx, err := db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelSerializable, // 隔离级别
        ReadOnly:  false,
    })
    if err != nil {
        return err
    }

    defer tx.Rollback() // 如果 Commit 成功，Rollback 不会有任何影响

    // 执行事务操作...
    _, err = tx.ExecContext(ctx,
        `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
        amount, fromID,
    )
    if err != nil {
        return err
    }

    _, err = tx.ExecContext(ctx,
        `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
        amount, toID,
    )
    if err != nil {
        return err
    }

    return tx.Commit()
}
```

### 事务辅助函数

```go
// TxFunc 事务函数类型
type TxFunc func(tx *sql.Tx) error

// WithTransaction 事务包装器
func WithTransaction(db *sql.DB, fn TxFunc) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }

    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p) // 重新抛出 panic
        }
    }()

    if err := fn(tx); err != nil {
        tx.Rollback()
        return err
    }

    return tx.Commit()
}

// WithTransactionContext 带 Context 的事务包装器
type TxFuncContext func(ctx context.Context, tx *sql.Tx) error

func WithTransactionContext(ctx context.Context, db *sql.DB, opts *sql.TxOptions, fn TxFuncContext) error {
    tx, err := db.BeginTx(ctx, opts)
    if err != nil {
        return err
    }

    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()

    if err := fn(ctx, tx); err != nil {
        tx.Rollback()
        return err
    }

    return tx.Commit()
}

// 使用示例
func transferWithWrapper(db *sql.DB, fromID, toID int64, amount float64) error {
    return WithTransaction(db, func(tx *sql.Tx) error {
        _, err := tx.Exec(`UPDATE accounts SET balance = balance - ? WHERE id = ?`, amount, fromID)
        if err != nil {
            return err
        }

        _, err = tx.Exec(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, amount, toID)
        return err
    })
}
```

## 处理 NULL 值

数据库中的 NULL 值需要特殊处理。

### 使用 sql.Null* 类型

```go
import "database/sql"

// UserWithNullable 包含可空字段的用户
type UserWithNullable struct {
    ID        int64
    Name      string
    Email     sql.NullString  // 可空字符串
    Age       sql.NullInt64   // 可空整数
    Balance   sql.NullFloat64 // 可空浮点数
    IsActive  sql.NullBool    // 可空布尔值
    CreatedAt sql.NullTime    // 可空时间
}

func GetUserWithNullable(db *sql.DB, id int64) (*UserWithNullable, error) {
    query := `SELECT id, name, email, age, balance, is_active, created_at FROM users WHERE id = ?`

    user := &UserWithNullable{}
    err := db.QueryRow(query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Age,
        &user.Balance,
        &user.IsActive,
        &user.CreatedAt,
    )
    if err != nil {
        return nil, err
    }

    return user, nil
}

// 检查 NULL 值
func printUser(user *UserWithNullable) {
    fmt.Printf("ID: %d, Name: %s\n", user.ID, user.Name)

    if user.Email.Valid {
        fmt.Printf("Email: %s\n", user.Email.String)
    } else {
        fmt.Println("Email: NULL")
    }

    if user.Age.Valid {
        fmt.Printf("Age: %d\n", user.Age.Int64)
    }
}
```

### 使用指针处理 NULL

```go
// UserWithPointers 使用指针表示可空字段
type UserWithPointers struct {
    ID        int64
    Name      string
    Email     *string
    Age       *int
    CreatedAt *time.Time
}

func GetUserWithPointers(db *sql.DB, id int64) (*UserWithPointers, error) {
    query := `SELECT id, name, email, age, created_at FROM users WHERE id = ?`

    user := &UserWithPointers{}
    err := db.QueryRow(query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email, // 指针可以直接接收 NULL
        &user.Age,
        &user.CreatedAt,
    )
    if err != nil {
        return nil, err
    }

    return user, nil
}
```

## sqlx 扩展库

`sqlx` 是 `database/sql` 的扩展库，提供了更便捷的功能。

### 安装

```bash
go get github.com/jmoiron/sqlx
```

### 基本用法

```go
package main

import (
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
    _ "github.com/go-sql-driver/mysql"
)

// User 使用 db 标签映射字段
type User struct {
    ID        int64  `db:"id"`
    Name      string `db:"name"`
    Email     string `db:"email"`
    Age       int    `db:"age"`
    CreatedAt string `db:"created_at"`
}

func main() {
    // 使用 sqlx.Connect 连接并 Ping
    db, err := sqlx.Connect("mysql", "root:password@tcp(127.0.0.1:3306)/mydb?parseTime=true")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 查询单条记录 - 自动映射到结构体
    var user User
    err = db.Get(&user, "SELECT * FROM users WHERE id = ?", 1)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("User: %+v\n", user)

    // 查询多条记录 - 自动映射到切片
    var users []User
    err = db.Select(&users, "SELECT * FROM users WHERE age > ?", 18)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Found %d users\n", len(users))
}
```

### 命名参数

```go
// 使用命名参数查询
func NamedQueryExample(db *sqlx.DB) error {
    // 使用 map 作为参数
    rows, err := db.NamedQuery(
        `SELECT * FROM users WHERE name = :name AND age > :age`,
        map[string]interface{}{
            "name": "张三",
            "age":  18,
        },
    )
    if err != nil {
        return err
    }
    defer rows.Close()

    for rows.Next() {
        var user User
        if err := rows.StructScan(&user); err != nil {
            return err
        }
        fmt.Printf("%+v\n", user)
    }

    return nil
}

// 使用结构体作为参数
func NamedExecExample(db *sqlx.DB) error {
    user := User{
        Name:  "李四",
        Email: "lisi@example.com",
        Age:   25,
    }

    result, err := db.NamedExec(
        `INSERT INTO users (name, email, age) VALUES (:name, :email, :age)`,
        user,
    )
    if err != nil {
        return err
    }

    id, _ := result.LastInsertId()
    fmt.Printf("Inserted user ID: %d\n", id)
    return nil
}
```

### 批量插入

```go
// 批量插入用户
func BatchInsertUsers(db *sqlx.DB, users []User) error {
    query := `INSERT INTO users (name, email, age) VALUES (:name, :email, :age)`

    result, err := db.NamedExec(query, users)
    if err != nil {
        return err
    }

    rowsAffected, _ := result.RowsAffected()
    fmt.Printf("Inserted %d users\n", rowsAffected)
    return nil
}

// 使用事务批量插入
func BatchInsertWithTx(db *sqlx.DB, users []User) error {
    tx, err := db.Beginx()
    if err != nil {
        return err
    }
    defer tx.Rollback()

    stmt, err := tx.PrepareNamed(`INSERT INTO users (name, email, age) VALUES (:name, :email, :age)`)
    if err != nil {
        return err
    }
    defer stmt.Close()

    for _, user := range users {
        _, err := stmt.Exec(user)
        if err != nil {
            return err
        }
    }

    return tx.Commit()
}
```

### In 查询

```go
// 使用 In 查询多个 ID
func GetUsersByIDs(db *sqlx.DB, ids []int64) ([]User, error) {
    query, args, err := sqlx.In("SELECT * FROM users WHERE id IN (?)", ids)
    if err != nil {
        return nil, err
    }

    // 需要 Rebind 将 ? 转换为对应数据库的占位符
    query = db.Rebind(query)

    var users []User
    err = db.Select(&users, query, args...)
    return users, err
}

// 组合多个条件
func SearchUsers(db *sqlx.DB, names []string, minAge int) ([]User, error) {
    query, args, err := sqlx.In(
        "SELECT * FROM users WHERE name IN (?) AND age > ?",
        names, minAge,
    )
    if err != nil {
        return nil, err
    }

    query = db.Rebind(query)

    var users []User
    err = db.Select(&users, query, args...)
    return users, err
}
```

## GORM 入门

GORM 是 Go 语言中最流行的 ORM 框架，提供了丰富的功能和优雅的 API。

### 安装

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
go get -u gorm.io/driver/postgres
go get -u gorm.io/driver/sqlite
```

### 连接数据库

```go
package main

import (
    "log"

    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

func main() {
    dsn := "root:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True&loc=Local"

    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info), // 打印 SQL 日志
    })
    if err != nil {
        log.Fatal("连接数据库失败:", err)
    }

    // 获取底层 sql.DB 以配置连接池
    sqlDB, err := db.DB()
    if err != nil {
        log.Fatal(err)
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
}
```

### 定义模型

```go
import (
    "time"

    "gorm.io/gorm"
)

// User GORM 模型
type User struct {
    ID        uint           `gorm:"primaryKey"`
    Name      string         `gorm:"size:100;not null"`
    Email     string         `gorm:"size:100;uniqueIndex"`
    Age       int            `gorm:"default:0"`
    Birthday  *time.Time
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"` // 软删除
}

// Product 产品模型
type Product struct {
    ID          uint    `gorm:"primaryKey"`
    Code        string  `gorm:"size:50;uniqueIndex"`
    Name        string  `gorm:"size:200;not null"`
    Price       float64 `gorm:"type:decimal(10,2)"`
    Description string  `gorm:"type:text"`
    CategoryID  uint
    Category    Category `gorm:"foreignKey:CategoryID"` // 关联
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

// Category 分类模型
type Category struct {
    ID       uint      `gorm:"primaryKey"`
    Name     string    `gorm:"size:100;not null"`
    Products []Product // 一对多关系
}

// 自动迁移（创建表）
func migrate(db *gorm.DB) {
    db.AutoMigrate(&User{}, &Product{}, &Category{})
}
```

### CRUD 操作

```go
// 创建记录
func createExamples(db *gorm.DB) {
    // 创建单条记录
    user := User{Name: "张三", Email: "zhangsan@example.com", Age: 25}
    result := db.Create(&user)
    if result.Error != nil {
        log.Fatal(result.Error)
    }
    fmt.Printf("Created user ID: %d, Rows affected: %d\n", user.ID, result.RowsAffected)

    // 批量创建
    users := []User{
        {Name: "李四", Email: "lisi@example.com", Age: 28},
        {Name: "王五", Email: "wangwu@example.com", Age: 30},
    }
    db.Create(&users)

    // 选择性创建（只插入指定字段）
    db.Select("Name", "Email").Create(&User{
        Name:  "赵六",
        Email: "zhaoliu@example.com",
        Age:   35, // 不会被插入
    })
}

// 查询记录
func queryExamples(db *gorm.DB) {
    // 根据主键查询
    var user User
    db.First(&user, 1) // 查询 ID=1 的记录
    db.First(&user, "id = ?", 1) // 同上

    // 根据条件查询第一条
    db.Where("name = ?", "张三").First(&user)

    // 查询所有记录
    var users []User
    db.Find(&users)

    // 条件查询
    db.Where("age > ?", 20).Find(&users)
    db.Where("name LIKE ?", "%张%").Find(&users)
    db.Where("age BETWEEN ? AND ?", 20, 30).Find(&users)

    // 链式调用
    db.Where("age > ?", 18).
        Order("created_at DESC").
        Limit(10).
        Offset(0).
        Find(&users)

    // 查询指定字段
    db.Select("name", "email").Find(&users)

    // 统计
    var count int64
    db.Model(&User{}).Where("age > ?", 20).Count(&count)
}

// 更新记录
func updateExamples(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 更新单个字段
    db.Model(&user).Update("name", "新名字")

    // 更新多个字段
    db.Model(&user).Updates(User{Name: "新名字", Age: 30})

    // 使用 map 更新（可以更新零值）
    db.Model(&user).Updates(map[string]interface{}{
        "name": "新名字",
        "age":  0, // 会被更新为 0
    })

    // 批量更新
    db.Model(&User{}).Where("age < ?", 18).Update("age", 18)

    // 使用 SQL 表达式
    db.Model(&user).Update("age", gorm.Expr("age + ?", 1))
}

// 删除记录
func deleteExamples(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 软删除（如果模型有 DeletedAt 字段）
    db.Delete(&user)

    // 根据主键删除
    db.Delete(&User{}, 1)
    db.Delete(&User{}, []int{1, 2, 3}) // 删除多个

    // 条件删除
    db.Where("age < ?", 18).Delete(&User{})

    // 永久删除（跳过软删除）
    db.Unscoped().Delete(&user)

    // 查询被软删除的记录
    db.Unscoped().Where("deleted_at IS NOT NULL").Find(&users)
}
```

### 关联操作

```go
// 定义关联模型
type Author struct {
    ID    uint
    Name  string
    Books []Book // 一对多
}

type Book struct {
    ID       uint
    Title    string
    AuthorID uint
    Author   Author   // 属于
    Tags     []Tag    `gorm:"many2many:book_tags"` // 多对多
}

type Tag struct {
    ID    uint
    Name  string
    Books []Book `gorm:"many2many:book_tags"` // 多对多
}

// 预加载关联
func preloadExamples(db *gorm.DB) {
    // 预加载一对多
    var author Author
    db.Preload("Books").First(&author, 1)

    // 预加载多对多
    var book Book
    db.Preload("Tags").First(&book, 1)

    // 嵌套预加载
    db.Preload("Books.Tags").First(&author, 1)

    // 条件预加载
    db.Preload("Books", "published = ?", true).First(&author, 1)

    // 自定义预加载
    db.Preload("Books", func(db *gorm.DB) *gorm.DB {
        return db.Order("books.created_at DESC").Limit(5)
    }).First(&author, 1)
}

// 创建关联
func createAssociationExamples(db *gorm.DB) {
    // 创建带关联的记录
    author := Author{
        Name: "作者A",
        Books: []Book{
            {Title: "书籍1"},
            {Title: "书籍2"},
        },
    }
    db.Create(&author)

    // 添加关联
    var existingAuthor Author
    db.First(&existingAuthor, 1)
    db.Model(&existingAuthor).Association("Books").Append(&Book{Title: "新书"})

    // 替换关联
    db.Model(&existingAuthor).Association("Books").Replace([]Book{{Title: "替换的书"}})

    // 删除关联
    db.Model(&existingAuthor).Association("Books").Delete(&book)

    // 清除所有关联
    db.Model(&existingAuthor).Association("Books").Clear()
}
```

### 事务

```go
// 自动事务
func transactionExample(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // 在事务中执行操作
        if err := tx.Create(&User{Name: "用户1"}).Error; err != nil {
            return err // 返回错误会自动回滚
        }

        if err := tx.Create(&User{Name: "用户2"}).Error; err != nil {
            return err
        }

        // 返回 nil 提交事务
        return nil
    })
}

// 手动事务
func manualTransactionExample(db *gorm.DB) error {
    tx := db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    if err := tx.Error; err != nil {
        return err
    }

    if err := tx.Create(&User{Name: "用户1"}).Error; err != nil {
        tx.Rollback()
        return err
    }

    if err := tx.Create(&User{Name: "用户2"}).Error; err != nil {
        tx.Rollback()
        return err
    }

    return tx.Commit().Error
}

// 嵌套事务（保存点）
func nestedTransactionExample(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        tx.Create(&User{Name: "用户1"})

        // 嵌套事务
        err := tx.Transaction(func(tx2 *gorm.DB) error {
            tx2.Create(&User{Name: "用户2"})
            return errors.New("回滚嵌套事务")
        })
        // 嵌套事务回滚不影响外部事务

        if err != nil {
            log.Println("嵌套事务失败:", err)
        }

        tx.Create(&User{Name: "用户3"})
        return nil // 用户1和用户3会被保存
    })
}
```

### 钩子函数

```go
// User 模型钩子
type User struct {
    ID           uint
    Name         string
    Email        string
    PasswordHash string
    Password     string `gorm:"-"` // 忽略字段
}

// BeforeCreate 创建前钩子
func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.Password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
        if err != nil {
            return err
        }
        u.PasswordHash = string(hash)
    }
    return nil
}

// AfterCreate 创建后钩子
func (u *User) AfterCreate(tx *gorm.DB) error {
    // 发送欢迎邮件等操作
    log.Printf("用户 %s 创建成功", u.Name)
    return nil
}

// BeforeUpdate 更新前钩子
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if u.Password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
        if err != nil {
            return err
        }
        u.PasswordHash = string(hash)
    }
    return nil
}

// BeforeDelete 删除前钩子
func (u *User) BeforeDelete(tx *gorm.DB) error {
    // 检查是否可以删除
    return nil
}
```

### 作用域和复用

```go
// 定义作用域
func Active(db *gorm.DB) *gorm.DB {
    return db.Where("is_active = ?", true)
}

func AgeGreaterThan(age int) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("age > ?", age)
    }
}

func Paginate(page, pageSize int) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if page <= 0 {
            page = 1
        }
        if pageSize <= 0 {
            pageSize = 10
        }
        offset := (page - 1) * pageSize
        return db.Offset(offset).Limit(pageSize)
    }
}

// 使用作用域
func scopeExamples(db *gorm.DB) {
    var users []User

    // 单个作用域
    db.Scopes(Active).Find(&users)

    // 多个作用域
    db.Scopes(Active, AgeGreaterThan(18)).Find(&users)

    // 分页
    db.Scopes(Paginate(1, 10)).Find(&users)

    // 组合使用
    db.Scopes(Active, AgeGreaterThan(18), Paginate(1, 10)).
        Order("created_at DESC").
        Find(&users)
}
```

## 数据库迁移

### 使用 golang-migrate

```bash
go install -tags 'mysql' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

```go
// migrations/000001_create_users_table.up.sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

// migrations/000001_create_users_table.down.sql
DROP TABLE IF EXISTS users;
```

```go
package main

import (
    "database/sql"
    "log"

    "github.com/golang-migrate/migrate/v4"
    "github.com/golang-migrate/migrate/v4/database/mysql"
    _ "github.com/golang-migrate/migrate/v4/source/file"
    _ "github.com/go-sql-driver/mysql"
)

func runMigrations(db *sql.DB) error {
    driver, err := mysql.WithInstance(db, &mysql.Config{})
    if err != nil {
        return err
    }

    m, err := migrate.NewWithDatabaseInstance(
        "file://migrations",
        "mysql",
        driver,
    )
    if err != nil {
        return err
    }

    // 执行所有未应用的迁移
    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return err
    }

    log.Println("迁移完成")
    return nil
}

func rollbackMigration(db *sql.DB) error {
    driver, err := mysql.WithInstance(db, &mysql.Config{})
    if err != nil {
        return err
    }

    m, err := migrate.NewWithDatabaseInstance(
        "file://migrations",
        "mysql",
        driver,
    )
    if err != nil {
        return err
    }

    // 回滚一个版本
    return m.Steps(-1)
}
```

## 最佳实践

### Repository 模式

```go
// UserRepository 用户仓库接口
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id int64) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, offset, limit int) ([]User, error)
}

// userRepository 实现
type userRepository struct {
    db *sql.DB
}

// NewUserRepository 创建用户仓库
func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *User) error {
    query := `INSERT INTO users (name, email, age, created_at) VALUES (?, ?, ?, ?)`
    result, err := r.db.ExecContext(ctx, query, user.Name, user.Email, user.Age, time.Now())
    if err != nil {
        return err
    }
    id, _ := result.LastInsertId()
    user.ID = id
    return nil
}

func (r *userRepository) GetByID(ctx context.Context, id int64) (*User, error) {
    query := `SELECT id, name, email, age, created_at FROM users WHERE id = ?`
    user := &User{}
    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &user.ID, &user.Name, &user.Email, &user.Age, &user.CreatedAt,
    )
    if err == sql.ErrNoRows {
        return nil, nil
    }
    return user, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    query := `SELECT id, name, email, age, created_at FROM users WHERE email = ?`
    user := &User{}
    err := r.db.QueryRowContext(ctx, query, email).Scan(
        &user.ID, &user.Name, &user.Email, &user.Age, &user.CreatedAt,
    )
    if err == sql.ErrNoRows {
        return nil, nil
    }
    return user, err
}

func (r *userRepository) Update(ctx context.Context, user *User) error {
    query := `UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?`
    _, err := r.db.ExecContext(ctx, query, user.Name, user.Email, user.Age, user.ID)
    return err
}

func (r *userRepository) Delete(ctx context.Context, id int64) error {
    query := `DELETE FROM users WHERE id = ?`
    _, err := r.db.ExecContext(ctx, query, id)
    return err
}

func (r *userRepository) List(ctx context.Context, offset, limit int) ([]User, error) {
    query := `SELECT id, name, email, age, created_at FROM users ORDER BY id LIMIT ? OFFSET ?`
    rows, err := r.db.QueryContext(ctx, query, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age, &user.CreatedAt); err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    return users, rows.Err()
}
```

### 错误处理

```go
import (
    "database/sql"
    "errors"

    "github.com/go-sql-driver/mysql"
)

var (
    ErrNotFound       = errors.New("记录不存在")
    ErrDuplicateEntry = errors.New("记录已存在")
    ErrForeignKey     = errors.New("外键约束错误")
)

// WrapDBError 包装数据库错误
func WrapDBError(err error) error {
    if err == nil {
        return nil
    }

    if err == sql.ErrNoRows {
        return ErrNotFound
    }

    // MySQL 错误处理
    var mysqlErr *mysql.MySQLError
    if errors.As(err, &mysqlErr) {
        switch mysqlErr.Number {
        case 1062: // 重复键
            return ErrDuplicateEntry
        case 1452: // 外键约束
            return ErrForeignKey
        }
    }

    return err
}

// 使用示例
func GetUser(db *sql.DB, id int64) (*User, error) {
    user := &User{}
    err := db.QueryRow("SELECT * FROM users WHERE id = ?", id).Scan(...)
    if err != nil {
        return nil, WrapDBError(err)
    }
    return user, nil
}
```

### 连接健康检查

```go
// HealthChecker 数据库健康检查
type HealthChecker struct {
    db       *sql.DB
    interval time.Duration
    timeout  time.Duration
}

// NewHealthChecker 创建健康检查器
func NewHealthChecker(db *sql.DB, interval, timeout time.Duration) *HealthChecker {
    return &HealthChecker{
        db:       db,
        interval: interval,
        timeout:  timeout,
    }
}

// Start 开始健康检查
func (h *HealthChecker) Start(ctx context.Context) {
    ticker := time.NewTicker(h.interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            h.check()
        }
    }
}

func (h *HealthChecker) check() {
    ctx, cancel := context.WithTimeout(context.Background(), h.timeout)
    defer cancel()

    if err := h.db.PingContext(ctx); err != nil {
        log.Printf("数据库健康检查失败: %v", err)
        // 可以触发告警或采取其他措施
    }

    stats := h.db.Stats()
    log.Printf("连接池状态: 总连接=%d, 使用中=%d, 空闲=%d",
        stats.OpenConnections, stats.InUse, stats.Idle)
}

// Check 单次检查
func (h *HealthChecker) Check(ctx context.Context) error {
    return h.db.PingContext(ctx)
}
```

## 性能优化

### 查询优化

```go
// 1. 使用索引
// 确保 WHERE 子句中的字段有索引

// 2. 选择需要的字段，避免 SELECT *
db.Select("id", "name").Find(&users)

// 3. 使用批量操作
func batchInsert(db *sql.DB, users []User) error {
    if len(users) == 0 {
        return nil
    }

    // 构建批量插入语句
    query := "INSERT INTO users (name, email, age) VALUES "
    values := make([]interface{}, 0, len(users)*3)
    placeholders := make([]string, 0, len(users))

    for _, user := range users {
        placeholders = append(placeholders, "(?, ?, ?)")
        values = append(values, user.Name, user.Email, user.Age)
    }

    query += strings.Join(placeholders, ", ")
    _, err := db.Exec(query, values...)
    return err
}

// 4. 使用事务批量处理
func batchProcess(db *sql.DB, items []Item, batchSize int) error {
    for i := 0; i < len(items); i += batchSize {
        end := i + batchSize
        if end > len(items) {
            end = len(items)
        }

        batch := items[i:end]
        err := processBatch(db, batch)
        if err != nil {
            return err
        }
    }
    return nil
}

// 5. 连接池配置
func optimizeConnectionPool(db *sql.DB) {
    // 根据应用程序并发量调整
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(5 * time.Minute)
}
```

### 使用连接池监控

```go
// 监控连接池状态
func monitorPool(db *sql.DB, interval time.Duration) {
    ticker := time.NewTicker(interval)
    for range ticker.C {
        stats := db.Stats()

        // 记录指标
        metrics.Gauge("db.connections.open", float64(stats.OpenConnections))
        metrics.Gauge("db.connections.in_use", float64(stats.InUse))
        metrics.Gauge("db.connections.idle", float64(stats.Idle))
        metrics.Counter("db.connections.wait_count", float64(stats.WaitCount))
        metrics.Gauge("db.connections.wait_duration", float64(stats.WaitDuration.Milliseconds()))
    }
}
```

## 总结

Go 语言提供了强大而灵活的数据库访问能力：

1. **database/sql** - 标准库提供了统一的数据库接口，支持连接池、事务、预编译语句等核心功能
2. **sqlx** - 扩展了标准库，提供了结构体映射、命名参数等便捷功能
3. **GORM** - 功能完善的 ORM 框架，适合快速开发

选择建议：

- **简单项目或需要精确控制**：使用 `database/sql` + `sqlx`
- **快速开发或复杂关联查询**：使用 GORM
- **高性能要求**：使用 `database/sql` 配合预编译语句

无论选择哪种方式，都应该注意：

- 合理配置连接池参数
- 使用 Context 控制超时
- 正确处理错误和 NULL 值
- 使用事务保证数据一致性
- 避免 SQL 注入，使用参数化查询
