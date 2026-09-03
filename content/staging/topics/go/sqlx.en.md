---
title: sqlx Database Operations Deep Dive
description: Complete guide to sqlx, a Go library that extends database/sql with powerful features for struct scanning, named parameters, and query building
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - sqlx
  - Database
  - SQL
  - PostgreSQL
  - MySQL
status: imported
origin: old/src/content/docs/go/sqlx.en.md
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

sqlx is a library that provides a set of extensions on Go's standard `database/sql` library. It makes working with SQL databases more convenient by adding support for scanning directly into structs, named parameters, and additional query methods.

## Concept Explanation

sqlx extends `database/sql` without replacing it. You get all the safety and features of the standard library plus:

- **Struct scanning**: Map query results directly to Go structs
- **Named parameters**: Use `:name` style parameters instead of positional `$1, $2`
- **Get and Select**: Convenient methods for single-row and multi-row queries
- **In-clause expansion**: Automatically expand slices for IN clauses
- **Named queries**: Prepare statements with named parameters

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

    // Get single user
    var user User
    err = db.Get(&user, "SELECT * FROM users WHERE id=$1", 1)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("User: %+v\n", user)

    // Get multiple users
    var users []User
    err = db.Select(&users, "SELECT * FROM users ORDER BY name")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Found %d users\n", len(users))
}
```

## Core Principles

### Struct Tags and Field Mapping

sqlx uses `db` struct tags to map columns to struct fields:

```go
package main

import (
    "database/sql"
    "time"
)

type User struct {
    // Basic mapping
    ID   int    `db:"id"`
    Name string `db:"name"`

    // Nullable fields
    Bio sql.NullString `db:"bio"`

    // Embedded structs
    Address

    // Ignored field
    InternalState string `db:"-"`

    // Time handling
    CreatedAt time.Time  `db:"created_at"`
    UpdatedAt *time.Time `db:"updated_at"` // Pointer for nullable
}

type Address struct {
    Street  string `db:"street"`
    City    string `db:"city"`
    Country string `db:"country"`
}

// Alternative: Use JSON for complex types
type UserPreferences struct {
    Theme    string   `json:"theme"`
    Language string   `json:"language"`
    Features []string `json:"features"`
}

type UserWithPrefs struct {
    ID          int             `db:"id"`
    Preferences UserPreferences `db:"preferences"` // Requires custom scanner
}
```

### Connection Management

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
        log.Fatal("Failed to connect:", err)
    }

    // Connection pool settings
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)
    db.SetConnMaxLifetime(5 * time.Minute)
    db.SetConnMaxIdleTime(1 * time.Minute)

    // Verify connection
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := db.PingContext(ctx); err != nil {
        log.Fatal("Failed to ping database:", err)
    }

    return db
}

func main() {
    db := setupDatabase()
    defer db.Close()

    // Use db for queries...
}
```

### Query Methods Comparison

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
    // ===== Standard database/sql way =====
    rows, _ := db.Query("SELECT id, name, price FROM products")
    defer rows.Close()

    var products1 []Product
    for rows.Next() {
        var p Product
        rows.Scan(&p.ID, &p.Name, &p.Price)
        products1 = append(products1, p)
    }

    // ===== sqlx Get - single row =====
    var product Product
    err := db.Get(&product, "SELECT * FROM products WHERE id=$1", 1)
    if err == sql.ErrNoRows {
        fmt.Println("Product not found")
    } else if err != nil {
        log.Fatal(err)
    }

    // ===== sqlx Select - multiple rows =====
    var products2 []Product
    err = db.Select(&products2, "SELECT * FROM products WHERE price > $1", 10.0)
    if err != nil {
        log.Fatal(err)
    }

    // ===== sqlx QueryRowx - with StructScan =====
    row := db.QueryRowx("SELECT * FROM products WHERE id=$1", 1)
    var p Product
    row.StructScan(&p)

    // ===== sqlx Queryx - with StructScan in loop =====
    rows2, _ := db.Queryx("SELECT * FROM products")
    defer rows2.Close()

    for rows2.Next() {
        var p Product
        rows2.StructScan(&p)
        fmt.Printf("Product: %+v\n", p)
    }
}
```

## Key Concepts

### Named Parameters

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
    // Named query with struct
    user := User{Name: "Alice", Email: "alice@example.com", Age: 30}

    result, err := db.NamedExec(`
        INSERT INTO users (name, email, age)
        VALUES (:name, :email, :age)
    `, user)
    if err != nil {
        log.Fatal(err)
    }

    id, _ := result.LastInsertId()
    fmt.Printf("Inserted user with ID: %d\n", id)

    // Named query with map
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

    // Rebind for specific database
    query = db.Rebind(query)
    err = db.Select(&users, query, args...)
    if err != nil {
        log.Fatal(err)
    }

    // Prepared named statement
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

### In-Clause Expansion

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
    // Expand slice for IN clause
    ids := []int{1, 2, 3, 4, 5}

    query, args, err := sqlx.In("SELECT * FROM users WHERE id IN (?)", ids)
    if err != nil {
        log.Fatal(err)
    }

    // Rebind for your database (PostgreSQL uses $1, $2; MySQL uses ?)
    query = db.Rebind(query)

    var users []User
    err = db.Select(&users, query, args...)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Found %d users\n", len(users))

    // Combine with other parameters
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

    // Named parameters with IN clause
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

### Transactions

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
    // Always handle rollback
    defer tx.Rollback()

    // Create order
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

    // Create order items
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

    // Update inventory
    for _, item := range items {
        result, err := tx.Exec(`
            UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1
        `, item.Quantity, item.ProductID)
        if err != nil {
            return nil, err
        }

        affected, _ := result.RowsAffected()
        if affected == 0 {
            return nil, fmt.Errorf("insufficient stock for product %d", item.ProductID)
        }
    }

    // Commit transaction
    if err := tx.Commit(); err != nil {
        return nil, err
    }

    return &Order{ID: int(orderID), UserID: userID, Total: total}, nil
}

// Transaction with context
func createOrderWithContext(ctx context.Context, db *sqlx.DB) error {
    tx, err := db.BeginTxx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // Use context-aware methods
    _, err = tx.ExecContext(ctx, "INSERT INTO orders ...")
    if err != nil {
        return err
    }

    return tx.Commit()
}
```

## Code Examples

### Repository Pattern

```go
package main

import (
    "context"
    "database/sql"
    "errors"
    "time"

    "github.com/jmoiron/sqlx"
)

var ErrNotFound = errors.New("record not found")

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
    // Soft delete
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
    // Build dynamic query
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

    // Get total count
    var total int
    countQuery := "SELECT COUNT(*) " + baseQuery
    query, queryArgs, _ := sqlx.Named(countQuery, args)
    query = r.db.Rebind(query)
    r.db.GetContext(ctx, &total, query, queryArgs...)

    // Get paginated results
    selectQuery := "SELECT * " + baseQuery

    // Add ordering
    orderBy := "created_at"
    if filter.OrderBy != "" {
        orderBy = filter.OrderBy
    }
    orderDir := "DESC"
    if filter.OrderDir == "ASC" {
        orderDir = "ASC"
    }
    selectQuery += " ORDER BY " + orderBy + " " + orderDir

    // Add pagination
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

### Batch Operations

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

// Batch insert using NamedExec
func batchInsertProducts(db *sqlx.DB, products []Product) error {
    _, err := db.NamedExec(`
        INSERT INTO products (name, price, stock)
        VALUES (:name, :price, :stock)
    `, products)
    return err
}

// Batch insert with single query (more efficient)
func batchInsertProductsFast(db *sqlx.DB, products []Product) error {
    if len(products) == 0 {
        return nil
    }

    // Build multi-value insert
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

// Batch update
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

// Upsert (PostgreSQL)
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

// Bulk upsert
func bulkUpsertProducts(ctx context.Context, db *sqlx.DB, products []Product) error {
    if len(products) == 0 {
        return nil
    }

    tx, err := db.BeginTxx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    for _, p := range products {
        _, err := tx.NamedExecContext(ctx, `
            INSERT INTO products (id, name, price, stock)
            VALUES (:id, :name, :price, :stock)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                price = EXCLUDED.price,
                stock = EXCLUDED.stock
        `, p)
        if err != nil {
            return err
        }
    }

    return tx.Commit()
}
```

### Custom Type Scanning

```go
package main

import (
    "database/sql/driver"
    "encoding/json"
    "errors"
    "fmt"
    "strings"

    "github.com/jmoiron/sqlx"
)

// StringSlice - array type for PostgreSQL
type StringSlice []string

func (s *StringSlice) Scan(src interface{}) error {
    switch v := src.(type) {
    case []byte:
        return s.scanString(string(v))
    case string:
        return s.scanString(v)
    case nil:
        *s = nil
        return nil
    default:
        return fmt.Errorf("cannot scan %T into StringSlice", src)
    }
}

func (s *StringSlice) scanString(src string) error {
    // PostgreSQL array format: {a,b,c}
    src = strings.Trim(src, "{}")
    if src == "" {
        *s = []string{}
        return nil
    }
    *s = strings.Split(src, ",")
    return nil
}

func (s StringSlice) Value() (driver.Value, error) {
    if s == nil {
        return nil, nil
    }
    return "{" + strings.Join(s, ",") + "}", nil
}

// JSONMap - JSON column as map
type JSONMap map[string]interface{}

func (j *JSONMap) Scan(src interface{}) error {
    var data []byte
    switch v := src.(type) {
    case []byte:
        data = v
    case string:
        data = []byte(v)
    case nil:
        *j = nil
        return nil
    default:
        return fmt.Errorf("cannot scan %T into JSONMap", src)
    }

    return json.Unmarshal(data, j)
}

func (j JSONMap) Value() (driver.Value, error) {
    if j == nil {
        return nil, nil
    }
    return json.Marshal(j)
}

// Usage
type Article struct {
    ID       int         `db:"id"`
    Title    string      `db:"title"`
    Tags     StringSlice `db:"tags"`
    Metadata JSONMap     `db:"metadata"`
}

func customTypeExample(db *sqlx.DB) {
    // Insert with custom types
    article := Article{
        Title:    "Go sqlx Guide",
        Tags:     StringSlice{"go", "database", "tutorial"},
        Metadata: JSONMap{"author": "John", "views": 100},
    }

    _, err := db.NamedExec(`
        INSERT INTO articles (title, tags, metadata)
        VALUES (:title, :tags, :metadata)
    `, article)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    // Query with custom types
    var articles []Article
    db.Select(&articles, "SELECT * FROM articles WHERE 'go' = ANY(tags)")

    for _, a := range articles {
        fmt.Printf("Article: %s\n", a.Title)
        fmt.Printf("Tags: %v\n", a.Tags)
        fmt.Printf("Metadata: %v\n", a.Metadata)
    }
}
```

## Best Practices

### 1. Use Context for Timeouts

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

func longRunningQuery(db *sqlx.DB) error {
    // Longer timeout for reports
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
    defer cancel()

    var result []ReportRow
    return db.SelectContext(ctx, &result, `
        SELECT ... FROM large_table
        WHERE ...
        GROUP BY ...
    `)
}
```

### 2. Prepared Statements for Repeated Queries

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

func (s *UserService) GetUser(id int64) (*User, error) {
    var user User
    err := s.getUserStmt.Get(&user, id)
    return &user, err
}

func (s *UserService) ListActiveUsers(limit int) ([]User, error) {
    var users []User
    err := s.listUsersStmt.Select(&users, map[string]interface{}{
        "active": true,
        "limit":  limit,
    })
    return users, err
}
```

### 3. Handle Nullable Fields Properly

```go
package main

import (
    "database/sql"
    "encoding/json"
    "time"
)

type User struct {
    ID        int64          `db:"id"`
    Name      string         `db:"name"`
    Bio       sql.NullString `db:"bio"`
    Age       sql.NullInt64  `db:"age"`
    Score     sql.NullFloat64 `db:"score"`
    Active    sql.NullBool   `db:"active"`
    DeletedAt sql.NullTime   `db:"deleted_at"`
}

// For JSON serialization, create a DTO
type UserDTO struct {
    ID        int64      `json:"id"`
    Name      string     `json:"name"`
    Bio       *string    `json:"bio,omitempty"`
    Age       *int64     `json:"age,omitempty"`
    DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (u User) ToDTO() UserDTO {
    dto := UserDTO{
        ID:   u.ID,
        Name: u.Name,
    }

    if u.Bio.Valid {
        dto.Bio = &u.Bio.String
    }
    if u.Age.Valid {
        dto.Age = &u.Age.Int64
    }
    if u.DeletedAt.Valid {
        dto.DeletedAt = &u.DeletedAt.Time
    }

    return dto
}

// Alternative: Use pointers directly
type UserAlt struct {
    ID        int64      `db:"id"`
    Name      string     `db:"name"`
    Bio       *string    `db:"bio"`
    Age       *int       `db:"age"`
    DeletedAt *time.Time `db:"deleted_at"`
}
```

## Common Pitfalls

### 1. Forgetting to Close Rows

```go
package main

import "github.com/jmoiron/sqlx"

// BAD: Rows not closed
func badQuery(db *sqlx.DB) {
    rows, _ := db.Queryx("SELECT * FROM users")
    // rows.Close() never called - connection leak!

    for rows.Next() {
        // ...
    }
}

// GOOD: Always close rows
func goodQuery(db *sqlx.DB) {
    rows, err := db.Queryx("SELECT * FROM users")
    if err != nil {
        return
    }
    defer rows.Close() // Always defer close

    for rows.Next() {
        // ...
    }
}

// BETTER: Use Select for simplicity
func betterQuery(db *sqlx.DB) {
    var users []User
    db.Select(&users, "SELECT * FROM users") // No manual row handling
}
```

### 2. SQL Injection

```go
package main

import (
    "fmt"
    "github.com/jmoiron/sqlx"
)

// BAD: SQL injection vulnerability
func badSearch(db *sqlx.DB, name string) {
    query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", name)
    db.Select(&users, query) // DANGEROUS!
}

// GOOD: Use parameterized queries
func goodSearch(db *sqlx.DB, name string) {
    db.Select(&users, "SELECT * FROM users WHERE name = $1", name)
}

// GOOD: Use named parameters
func goodSearchNamed(db *sqlx.DB, name string) {
    db.NamedQuery("SELECT * FROM users WHERE name = :name",
        map[string]interface{}{"name": name})
}
```

### 3. Transaction Not Rolled Back

```go
package main

import "github.com/jmoiron/sqlx"

// BAD: Missing rollback
func badTransaction(db *sqlx.DB) error {
    tx, _ := db.Beginx()

    _, err := tx.Exec("INSERT INTO users ...")
    if err != nil {
        return err // Transaction left open!
    }

    return tx.Commit()
}

// GOOD: Always defer rollback
func goodTransaction(db *sqlx.DB) error {
    tx, err := db.Beginx()
    if err != nil {
        return err
    }
    defer tx.Rollback() // Safe: no-op if committed

    _, err = tx.Exec("INSERT INTO users ...")
    if err != nil {
        return err
    }

    return tx.Commit() // Rollback won't execute after commit
}
```

## Performance Considerations

### Query Optimization

```go
package main

import (
    "context"
    "time"

    "github.com/jmoiron/sqlx"
)

// Use SELECT only needed columns
func efficientQuery(db *sqlx.DB) {
    // BAD: SELECT * fetches all columns
    db.Select(&users, "SELECT * FROM users")

    // GOOD: Only fetch needed columns
    db.Select(&users, "SELECT id, name, email FROM users")
}

// Use prepared statements for repeated queries
func repeatedQueries(db *sqlx.DB, ids []int64) {
    stmt, _ := db.Preparex("SELECT * FROM users WHERE id = $1")
    defer stmt.Close()

    for _, id := range ids {
        var user User
        stmt.Get(&user, id)
    }
}

// Batch queries instead of N+1
func avoidNPlusOne(db *sqlx.DB, userIDs []int64) {
    // BAD: N+1 queries
    for _, id := range userIDs {
        var orders []Order
        db.Select(&orders, "SELECT * FROM orders WHERE user_id = $1", id)
    }

    // GOOD: Single query with IN clause
    query, args, _ := sqlx.In("SELECT * FROM orders WHERE user_id IN (?)", userIDs)
    query = db.Rebind(query)

    var allOrders []Order
    db.Select(&allOrders, query, args...)
}

// Use EXPLAIN ANALYZE for query optimization
func analyzeQuery(db *sqlx.DB) {
    rows, _ := db.Query(`
        EXPLAIN ANALYZE
        SELECT * FROM users WHERE email LIKE '%@example.com'
    `)
    defer rows.Close()
    // Review query plan
}
```

### Connection Pool Tuning

```go
package main

import (
    "time"

    "github.com/jmoiron/sqlx"
)

func configurePool(db *sqlx.DB) {
    // Max open connections
    // Rule of thumb: (core_count * 2) + effective_spindle_count
    db.SetMaxOpenConns(25)

    // Max idle connections
    // Keep some connections ready but not too many
    db.SetMaxIdleConns(5)

    // Max connection lifetime
    // Helps with load balancing and connection refresh
    db.SetConnMaxLifetime(5 * time.Minute)

    // Max idle time
    // Close idle connections to free resources
    db.SetConnMaxIdleTime(1 * time.Minute)
}
```

## Interview Key Points

1. **sqlx vs database/sql**:
   - sqlx extends, doesn't replace database/sql
   - Adds struct scanning, named params, In clause
   - Same connection pooling, same driver support

2. **Query methods**:
   - `Get`: single row into struct
   - `Select`: multiple rows into slice
   - `NamedExec`/`NamedQuery`: named parameters
   - `In`: expand slices for IN clauses

3. **Transaction handling**:
   - Always `defer tx.Rollback()`
   - Rollback is no-op after Commit
   - Use `BeginTxx` for context support

4. **Performance tips**:
   - Use prepared statements for repeated queries
   - Avoid SELECT * in production
   - Use In clause instead of N+1 queries
   - Proper connection pool settings

5. **Common patterns**:
   - Repository pattern for data access
   - Custom types implementing Scanner/Valuer
   - Context for timeouts and cancellation

## Further Reading

- [sqlx GitHub Repository](https://github.com/jmoiron/sqlx)
- [sqlx Documentation](https://jmoiron.github.io/sqlx/)
- [Go database/sql Tutorial](http://go-database-sql.org/)
- [PostgreSQL Driver (lib/pq)](https://github.com/lib/pq)
- [MySQL Driver](https://github.com/go-sql-driver/mysql)
- [SQLite Driver](https://github.com/mattn/go-sqlite3)
