---
title: sqlx 数据库操作详解
description: sqlx 完全指南，一个扩展 database/sql 的 Go 库，提供结构体扫描、命名参数和查询构建等强大功能
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - sqlx
  - 数据库
  - SQL
  - PostgreSQL
  - MySQL
status: imported
origin: old/src/content/docs/go/sqlx.zh.md
divergence: 0.237
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 54
  lastUpdated: 2026-01-21
---

sqlx 是一个在 Go 标准 `database/sql` 库基础上提供扩展功能的库。它通过添加直接扫描到结构体、命名参数和额外的查询方法，使数据库操作更加便捷。

## 概念解释

sqlx 扩展而非替代 `database/sql`。你可以获得标准库的所有安全性和功能，外加：

- **结构体扫描**：直接将查询结果映射到 Go 结构体
- **命名参数**：使用 `:name` 风格的参数替代位置参数 `$1, $2`
- **Get 和 Select**：便捷的单行和多行查询方法
- **In 子句展开**：自动为 IN 子句展开切片
- **命名查询**：使用命名参数准备语句

```go
package main

import (
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

type User struct {
    ID        int    `db:"id"`
    Name      string `db:"name"`
    Email     string `db:"email"`
    CreatedAt string `db:"created_at"`
}

func main() {
    db, err := sqlx.Connect("postgres", "postgres://localhost/mydb?sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 获取单个用户
    var user User
    err = db.Get(&user, "SELECT * FROM users WHERE id=$1", 1)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("用户: %+v\n", user)

    // 获取多个用户
    var users []User
    err = db.Select(&users, "SELECT * FROM users ORDER BY name")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("找到 %d 个用户\n", len(users))
}
```

## 核心原理

### 结构体标签和字段映射

sqlx 使用 `db` 结构体标签将列映射到结构体字段：

```go
package main

import (
    "database/sql"
    "time"
)

type User struct {
    // 基本映射
    ID   int    `db:"id"`
    Name string `db:"name"`

    // 可空字段
    Bio sql.NullString `db:"bio"`

    // 嵌入结构体
    Address

    // 忽略的字段
    InternalState string `db:"-"`

    // 时间处理
    CreatedAt time.Time  `db:"created_at"`
    UpdatedAt *time.Time `db:"updated_at"` // 使用指针表示可空
}

type Address struct {
    Street  string `db:"street"`
    City    string `db:"city"`
    Country string `db:"country"`
}

// 替代方案：使用 JSON 处理复杂类型
type UserPreferences struct {
    Theme    string   `json:"theme"`
    Language string   `json:"language"`
    Features []string `json:"features"`
}

type UserWithPrefs struct {
    ID          int             `db:"id"`
    Preferences UserPreferences `db:"preferences"` // 需要自定义扫描器
}
```

### 连接管理

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

func setupDatabase() *sqlx.DB {
    dsn := "postgres://user:pass@localhost/dbname?sslmode=disable"

    db, err := sqlx.Connect("postgres", dsn)
    if err != nil {
        log.Fatal("连接失败:", err)
    }

    // 连接池设置
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)
    db.SetConnMaxLifetime(5 * time.Minute)
    db.SetConnMaxIdleTime(1 * time.Minute)

    // 验证连接
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := db.PingContext(ctx); err != nil {
        log.Fatal("Ping 数据库失败:", err)
    }

    return db
}

func main() {
    db := setupDatabase()
    defer db.Close()

    // 使用 db 进行查询...
}
```

### 查询方法对比

```go
package main

import (
    "database/sql"
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
)

type Product struct {
    ID    int     `db:"id"`
    Name  string  `db:"name"`
    Price float64 `db:"price"`
}

func demonstrateMethods(db *sqlx.DB) {
    // ===== 标准 database/sql 方式 =====
    rows, _ := db.Query("SELECT id, name, price FROM products")
    defer rows.Close()

    var products1 []Product
    for rows.Next() {
        var p Product
        rows.Scan(&p.ID, &p.Name, &p.Price)
        products1 = append(products1, p)
    }

    // ===== sqlx Get - 单行 =====
    var product Product
    err := db.Get(&product, "SELECT * FROM products WHERE id=$1", 1)
    if err == sql.ErrNoRows {
        fmt.Println("产品未找到")
    } else if err != nil {
        log.Fatal(err)
    }

    // ===== sqlx Select - 多行 =====
    var products2 []Product
    err = db.Select(&products2, "SELECT * FROM products WHERE price > $1", 10.0)
    if err != nil {
        log.Fatal(err)
    }

    // ===== sqlx QueryRowx - 使用 StructScan =====
    row := db.QueryRowx("SELECT * FROM products WHERE id=$1", 1)
    var p Product
    row.StructScan(&p)

    // ===== sqlx Queryx - 循环中使用 StructScan =====
    rows2, _ := db.Queryx("SELECT * FROM products")
    defer rows2.Close()

    for rows2.Next() {
        var p Product
        rows2.StructScan(&p)
        fmt.Printf("产品: %+v\n", p)
    }
}
```

## 核心要点

### 命名参数

```go
package main

import (
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
)

type User struct {
    ID    int    `db:"id"`
    Name  string `db:"name"`
    Email string `db:"email"`
    Age   int    `db:"age"`
}

func namedParameterExamples(db *sqlx.DB) {
    // 使用结构体的命名查询
    user := User{Name: "Alice", Email: "alice@example.com", Age: 30}

    result, err := db.NamedExec(`
        INSERT INTO users (name, email, age)
        VALUES (:name, :email, :age)
    `, user)
    if err != nil {
        log.Fatal(err)
    }

    id, _ := result.LastInsertId()
    fmt.Printf("插入用户 ID: %d\n", id)

    // 使用 map 的命名查询
    params := map[string]interface{}{
        "name":    "Bob",
        "email":   "bob@example.com",
        "min_age": 18,
    }

    var users []User
    query, args, _ := sqlx.Named(`
        SELECT * FROM users
        WHERE name = :name OR email = :email OR age >= :min_age
    `, params)

    // 为特定数据库重新绑定
    query = db.Rebind(query)
    err = db.Select(&users, query, args...)
    if err != nil {
        log.Fatal(err)
    }

    // 预编译命名语句
    stmt, err := db.PrepareNamed(`
        SELECT * FROM users WHERE name = :name AND age > :min_age
    `)
    if err != nil {
        log.Fatal(err)
    }
    defer stmt.Close()

    var foundUsers []User
    err = stmt.Select(&foundUsers, map[string]interface{}{
        "name":    "Alice",
        "min_age": 25,
    })
}
```

### In 子句展开

```go
package main

import (
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
)

type User struct {
    ID   int    `db:"id"`
    Name string `db:"name"`
}

func inClauseExamples(db *sqlx.DB) {
    // 为 IN 子句展开切片
    ids := []int{1, 2, 3, 4, 5}

    query, args, err := sqlx.In("SELECT * FROM users WHERE id IN (?)", ids)
    if err != nil {
        log.Fatal(err)
    }

    // 为你的数据库重新绑定（PostgreSQL 使用 $1, $2；MySQL 使用 ?）
    query = db.Rebind(query)

    var users []User
    err = db.Select(&users, query, args...)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("找到 %d 个用户\n", len(users))

    // 与其他参数组合
    names := []string{"Alice", "Bob", "Charlie"}
    minAge := 18

    query, args, err = sqlx.In(`
        SELECT * FROM users
        WHERE name IN (?) AND age >= ?
    `, names, minAge)
    if err != nil {
        log.Fatal(err)
    }

    query = db.Rebind(query)
    err = db.Select(&users, query, args...)

    // 命名参数与 IN 子句
    arg := map[string]interface{}{
        "ids": []int{1, 2, 3},
        "status": "active",
    }

    query, args, _ = sqlx.Named(`
        SELECT * FROM users WHERE id IN (:ids) AND status = :status
    `, arg)
    query, args, _ = sqlx.In(query, args...)
    query = db.Rebind(query)

    db.Select(&users, query, args...)
}
```

### 事务

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
)

type Order struct {
    ID     int     `db:"id"`
    UserID int     `db:"user_id"`
    Total  float64 `db:"total"`
}

type OrderItem struct {
    ID        int     `db:"id"`
    OrderID   int     `db:"order_id"`
    ProductID int     `db:"product_id"`
    Quantity  int     `db:"quantity"`
    Price     float64 `db:"price"`
}

func createOrder(db *sqlx.DB, userID int, items []OrderItem) (*Order, error) {
    tx, err := db.Beginx()
    if err != nil {
        return nil, err
    }
    // 始终处理回滚
    defer tx.Rollback()

    // 创建订单
    var total float64
    for _, item := range items {
        total += item.Price * float64(item.Quantity)
    }

    result, err := tx.NamedExec(`
        INSERT INTO orders (user_id, total) VALUES (:user_id, :total)
    `, map[string]interface{}{
        "user_id": userID,
        "total":   total,
    })
    if err != nil {
        return nil, err
    }

    orderID, _ := result.LastInsertId()

    // 创建订单项
    for _, item := range items {
        item.OrderID = int(orderID)
        _, err := tx.NamedExec(`
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (:order_id, :product_id, :quantity, :price)
        `, item)
        if err != nil {
            return nil, err
        }
    }

    // 更新库存
    for _, item := range items {
        result, err := tx.Exec(`
            UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1
        `, item.Quantity, item.ProductID)
        if err != nil {
            return nil, err
        }

        affected, _ := result.RowsAffected()
        if affected == 0 {
            return nil, fmt.Errorf("产品 %d 库存不足", item.ProductID)
        }
    }

    // 提交事务
    if err := tx.Commit(); err != nil {
        return nil, err
    }

    return &Order{ID: int(orderID), UserID: userID, Total: total}, nil
}

// 带 context 的事务
func createOrderWithContext(ctx context.Context, db *sqlx.DB) error {
    tx, err := db.BeginTxx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // 使用支持 context 的方法
    _, err = tx.ExecContext(ctx, "INSERT INTO orders ...")
    if err != nil {
        return err
    }

    return tx.Commit()
}
```

## 代码示例

### Repository 模式

```go
package main

import (
    "context"
    "database/sql"
    "errors"
    "time"

    "github.com/jmoiron/sqlx"
)

var ErrNotFound = errors.New("记录未找到")

type User struct {
    ID        int64      `db:"id"`
    Name      string     `db:"name"`
    Email     string     `db:"email"`
    Password  string     `db:"password"`
    Active    bool       `db:"active"`
    CreatedAt time.Time  `db:"created_at"`
    UpdatedAt time.Time  `db:"updated_at"`
    DeletedAt *time.Time `db:"deleted_at"`
}

type UserFilter struct {
    Name     *string
    Email    *string
    Active   *bool
    Limit    int
    Offset   int
    OrderBy  string
    OrderDir string
}

type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id int64) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, filter UserFilter) ([]User, int, error)
}

type userRepository struct {
    db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *User) error {
    query := `
        INSERT INTO users (name, email, password, active, created_at, updated_at)
        VALUES (:name, :email, :password, :active, :created_at, :updated_at)
        RETURNING id
    `

    user.CreatedAt = time.Now()
    user.UpdatedAt = user.CreatedAt
    user.Active = true

    rows, err := r.db.NamedQueryContext(ctx, query, user)
    if err != nil {
        return err
    }
    defer rows.Close()

    if rows.Next() {
        rows.Scan(&user.ID)
    }

    return nil
}

func (r *userRepository) GetByID(ctx context.Context, id int64) (*User, error) {
    var user User
    err := r.db.GetContext(ctx, &user,
        "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL", id)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, ErrNotFound
    }
    return &user, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    var user User
    err := r.db.GetContext(ctx, &user,
        "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL", email)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, ErrNotFound
    }
    return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *User) error {
    user.UpdatedAt = time.Now()

    result, err := r.db.NamedExecContext(ctx, `
        UPDATE users
        SET name = :name, email = :email, active = :active, updated_at = :updated_at
        WHERE id = :id AND deleted_at IS NULL
    `, user)
    if err != nil {
        return err
    }

    affected, _ := result.RowsAffected()
    if affected == 0 {
        return ErrNotFound
    }

    return nil
}

func (r *userRepository) Delete(ctx context.Context, id int64) error {
    // 软删除
    result, err := r.db.ExecContext(ctx,
        "UPDATE users SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL",
        time.Now(), id)
    if err != nil {
        return err
    }

    affected, _ := result.RowsAffected()
    if affected == 0 {
        return ErrNotFound
    }

    return nil
}

func (r *userRepository) List(ctx context.Context, filter UserFilter) ([]User, int, error) {
    // 构建动态查询
    baseQuery := "FROM users WHERE deleted_at IS NULL"
    args := make(map[string]interface{})

    if filter.Name != nil {
        baseQuery += " AND name ILIKE :name"
        args["name"] = "%" + *filter.Name + "%"
    }

    if filter.Email != nil {
        baseQuery += " AND email ILIKE :email"
        args["email"] = "%" + *filter.Email + "%"
    }

    if filter.Active != nil {
        baseQuery += " AND active = :active"
        args["active"] = *filter.Active
    }

    // 获取总数
    var total int
    countQuery := "SELECT COUNT(*) " + baseQuery
    query, queryArgs, _ := sqlx.Named(countQuery, args)
    query = r.db.Rebind(query)
    r.db.GetContext(ctx, &total, query, queryArgs...)

    // 获取分页结果
    selectQuery := "SELECT * " + baseQuery

    // 添加排序
    orderBy := "created_at"
    if filter.OrderBy != "" {
        orderBy = filter.OrderBy
    }
    orderDir := "DESC"
    if filter.OrderDir == "ASC" {
        orderDir = "ASC"
    }
    selectQuery += " ORDER BY " + orderBy + " " + orderDir

    // 添加分页
    if filter.Limit > 0 {
        selectQuery += " LIMIT :limit OFFSET :offset"
        args["limit"] = filter.Limit
        args["offset"] = filter.Offset
    }

    var users []User
    query, queryArgs, _ = sqlx.Named(selectQuery, args)
    query = r.db.Rebind(query)
    err := r.db.SelectContext(ctx, &users, query, queryArgs...)

    return users, total, err
}
```

### 批量操作

```go
package main

import (
    "context"
    "fmt"
    "strings"

    "github.com/jmoiron/sqlx"
)

type Product struct {
    ID    int     `db:"id"`
    Name  string  `db:"name"`
    Price float64 `db:"price"`
    Stock int     `db:"stock"`
}

// 使用 NamedExec 批量插入
func batchInsertProducts(db *sqlx.DB, products []Product) error {
    _, err := db.NamedExec(`
        INSERT INTO products (name, price, stock)
        VALUES (:name, :price, :stock)
    `, products)
    return err
}

// 使用单条查询批量插入（更高效）
func batchInsertProductsFast(db *sqlx.DB, products []Product) error {
    if len(products) == 0 {
        return nil
    }

    // 构建多值插入
    valueStrings := make([]string, 0, len(products))
    valueArgs := make([]interface{}, 0, len(products)*3)

    for i, p := range products {
        valueStrings = append(valueStrings,
            fmt.Sprintf("($%d, $%d, $%d)", i*3+1, i*3+2, i*3+3))
        valueArgs = append(valueArgs, p.Name, p.Price, p.Stock)
    }

    query := fmt.Sprintf(`
        INSERT INTO products (name, price, stock)
        VALUES %s
    `, strings.Join(valueStrings, ","))

    _, err := db.Exec(query, valueArgs...)
    return err
}

// 批量更新
func batchUpdatePrices(db *sqlx.DB, updates map[int]float64) error {
    tx, err := db.Beginx()
    if err != nil {
        return err
    }
    defer tx.Rollback()

    stmt, err := tx.Preparex("UPDATE products SET price = $1 WHERE id = $2")
    if err != nil {
        return err
    }
    defer stmt.Close()

    for id, price := range updates {
        _, err := stmt.Exec(price, id)
        if err != nil {
            return err
        }
    }

    return tx.Commit()
}

// Upsert（PostgreSQL）
func upsertProduct(db *sqlx.DB, product Product) error {
    _, err := db.NamedExec(`
        INSERT INTO products (id, name, price, stock)
        VALUES (:id, :name, :price, :stock)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock
    `, product)
    return err
}
```

## 最佳实践

### 1. 使用 Context 设置超时

```go
package main

import (
    "context"
    "time"

    "github.com/jmoiron/sqlx"
)

func queryWithTimeout(db *sqlx.DB) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var result []User
    return db.SelectContext(ctx, &result, "SELECT * FROM users")
}
```

### 2. 对重复查询使用预编译语句

```go
package main

import (
    "github.com/jmoiron/sqlx"
)

type UserService struct {
    db           *sqlx.DB
    getUserStmt  *sqlx.Stmt
    listUsersStmt *sqlx.NamedStmt
}

func NewUserService(db *sqlx.DB) (*UserService, error) {
    getUserStmt, err := db.Preparex("SELECT * FROM users WHERE id = $1")
    if err != nil {
        return nil, err
    }

    listUsersStmt, err := db.PrepareNamed(`
        SELECT * FROM users
        WHERE active = :active
        ORDER BY created_at DESC
        LIMIT :limit
    `)
    if err != nil {
        getUserStmt.Close()
        return nil, err
    }

    return &UserService{
        db:           db,
        getUserStmt:  getUserStmt,
        listUsersStmt: listUsersStmt,
    }, nil
}

func (s *UserService) Close() {
    s.getUserStmt.Close()
    s.listUsersStmt.Close()
}
```

### 3. 正确处理可空字段

```go
package main

import (
    "database/sql"
    "time"
)

type User struct {
    ID        int64          `db:"id"`
    Name      string         `db:"name"`
    Bio       sql.NullString `db:"bio"`
    Age       sql.NullInt64  `db:"age"`
    DeletedAt sql.NullTime   `db:"deleted_at"`
}

// 替代方案：直接使用指针
type UserAlt struct {
    ID        int64      `db:"id"`
    Name      string     `db:"name"`
    Bio       *string    `db:"bio"`
    Age       *int       `db:"age"`
    DeletedAt *time.Time `db:"deleted_at"`
}
```

## 常见陷阱

### 1. 忘记关闭 Rows

```go
package main

import "github.com/jmoiron/sqlx"

// 错误：Rows 未关闭
func badQuery(db *sqlx.DB) {
    rows, _ := db.Queryx("SELECT * FROM users")
    // rows.Close() 从未调用 - 连接泄漏！

    for rows.Next() {
        // ...
    }
}

// 正确：始终关闭 rows
func goodQuery(db *sqlx.DB) {
    rows, err := db.Queryx("SELECT * FROM users")
    if err != nil {
        return
    }
    defer rows.Close() // 始终 defer close

    for rows.Next() {
        // ...
    }
}

// 更好：使用 Select 简化
func betterQuery(db *sqlx.DB) {
    var users []User
    db.Select(&users, "SELECT * FROM users") // 无需手动处理行
}
```

### 2. SQL 注入

```go
package main

import (
    "fmt"
    "github.com/jmoiron/sqlx"
)

// 错误：SQL 注入漏洞
func badSearch(db *sqlx.DB, name string) {
    query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", name)
    db.Select(&users, query) // 危险！
}

// 正确：使用参数化查询
func goodSearch(db *sqlx.DB, name string) {
    db.Select(&users, "SELECT * FROM users WHERE name = $1", name)
}
```

### 3. 事务未回滚

```go
package main

import "github.com/jmoiron/sqlx"

// 错误：缺少回滚
func badTransaction(db *sqlx.DB) error {
    tx, _ := db.Beginx()

    _, err := tx.Exec("INSERT INTO users ...")
    if err != nil {
        return err // 事务未关闭！
    }

    return tx.Commit()
}

// 正确：始终 defer 回滚
func goodTransaction(db *sqlx.DB) error {
    tx, err := db.Beginx()
    if err != nil {
        return err
    }
    defer tx.Rollback() // 安全：提交后是空操作

    _, err = tx.Exec("INSERT INTO users ...")
    if err != nil {
        return err
    }

    return tx.Commit() // 提交后 Rollback 不会执行
}
```

## 性能考量

### 查询优化

```go
package main

import (
    "github.com/jmoiron/sqlx"
)

// 只 SELECT 需要的列
func efficientQuery(db *sqlx.DB) {
    // 错误：SELECT * 获取所有列
    db.Select(&users, "SELECT * FROM users")

    // 正确：只获取需要的列
    db.Select(&users, "SELECT id, name, email FROM users")
}

// 批量查询代替 N+1
func avoidNPlusOne(db *sqlx.DB, userIDs []int64) {
    // 错误：N+1 查询
    for _, id := range userIDs {
        var orders []Order
        db.Select(&orders, "SELECT * FROM orders WHERE user_id = $1", id)
    }

    // 正确：使用 IN 子句的单次查询
    query, args, _ := sqlx.In("SELECT * FROM orders WHERE user_id IN (?)", userIDs)
    query = db.Rebind(query)

    var allOrders []Order
    db.Select(&allOrders, query, args...)
}
```

## 面试要点

1. **sqlx 与 database/sql**：
   - sqlx 扩展而非替代 database/sql
   - 添加结构体扫描、命名参数、In 子句
   - 相同的连接池、相同的驱动支持

2. **查询方法**：
   - `Get`：单行到结构体
   - `Select`：多行到切片
   - `NamedExec`/`NamedQuery`：命名参数
   - `In`：为 IN 子句展开切片

3. **事务处理**：
   - 始终 `defer tx.Rollback()`
   - Commit 后 Rollback 是空操作
   - 使用 `BeginTxx` 支持 context

4. **性能技巧**：
   - 对重复查询使用预编译语句
   - 生产环境避免 SELECT *
   - 使用 In 子句代替 N+1 查询
   - 正确的连接池设置

5. **常见模式**：
   - Repository 模式用于数据访问
   - 实现 Scanner/Valuer 的自定义类型
   - Context 用于超时和取消

## 延伸阅读

- [sqlx GitHub 仓库](https://github.com/jmoiron/sqlx)
- [sqlx 文档](https://jmoiron.github.io/sqlx/)
- [Go database/sql 教程](http://go-database-sql.org/)
- [PostgreSQL 驱动 (lib/pq)](https://github.com/lib/pq)
- [MySQL 驱动](https://github.com/go-sql-driver/mysql)
- [SQLite 驱动](https://github.com/mattn/go-sqlite3)
