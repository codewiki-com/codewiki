---
title: Database Operations
description: Complete guide to Go database access, database/sql, connection pooling and ORM
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Database
  - SQL
  - ORM
status: imported
origin: old/src/content/docs/go/database.en.md
divergence: 0.164
issues: []
legacy:
  category: Go
  subcategory: Data Access
  order: 14
  lastUpdated: 2026-01-07
---

Go provides excellent support for database operations through its standard library and ecosystem. The `database/sql` package offers a consistent, idiomatic interface for working with SQL databases, while third-party packages like `sqlx` and GORM provide additional convenience and features.

## The database/sql Package

The `database/sql` package is Go's standard library solution for SQL database access. It provides:

- A generic interface around SQL databases
- Connection pooling out of the box
- Safe handling of concurrent operations
- Support for prepared statements and transactions

### Installing a Database Driver

The `database/sql` package doesn't include any database drivers. You need to import a driver for your specific database. Drivers are imported with a blank identifier because they register themselves with `database/sql` via their `init()` function.

```go
package main

import (
    "database/sql"

    _ "github.com/lib/pq"           // PostgreSQL
    // _ "github.com/go-sql-driver/mysql"  // MySQL
    // _ "github.com/mattn/go-sqlite3"     // SQLite
)
```

Install the driver using Go modules:

```bash
go get github.com/lib/pq           # PostgreSQL
go get github.com/go-sql-driver/mysql  # MySQL
go get github.com/mattn/go-sqlite3     # SQLite
```

### Opening a Database Connection

The `sql.Open()` function creates a database handle, but it doesn't actually establish any connections. Connections are created lazily when needed.

```go
package main

import (
    "database/sql"
    "fmt"
    "log"

    _ "github.com/lib/pq"
)

func main() {
    // Connection string format varies by driver
    connStr := "host=localhost port=5432 user=myuser password=mypass dbname=mydb sslmode=disable"

    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Error opening database:", err)
    }
    defer db.Close()

    // Verify the connection is actually working
    if err := db.Ping(); err != nil {
        log.Fatal("Error connecting to database:", err)
    }

    fmt.Println("Successfully connected to database!")
}
```

### Connection String Formats

Different databases use different connection string formats:

```go
// PostgreSQL
connStr := "host=localhost port=5432 user=postgres password=secret dbname=mydb sslmode=disable"
// or URL format
connStr := "postgres://postgres:secret@localhost:5432/mydb?sslmode=disable"

// MySQL
connStr := "user:password@tcp(localhost:3306)/dbname?parseTime=true"

// SQLite
connStr := "./mydb.sqlite3"
// or in-memory
connStr := ":memory:"
```

## Connection Pooling

One of the most powerful features of `database/sql` is its built-in connection pool. The pool automatically manages connections, reusing them when possible and creating new ones when needed.

### Configuring the Connection Pool

```go
package main

import (
    "database/sql"
    "time"

    _ "github.com/lib/pq"
)

func main() {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // SetMaxOpenConns sets the maximum number of open connections
    // Default is 0 (unlimited)
    db.SetMaxOpenConns(25)

    // SetMaxIdleConns sets the maximum number of idle connections in the pool
    // Default is 2
    db.SetMaxIdleConns(10)

    // SetConnMaxLifetime sets the maximum time a connection can be reused
    // Default is 0 (no limit)
    db.SetConnMaxLifetime(5 * time.Minute)

    // SetConnMaxIdleTime sets the maximum time a connection can be idle
    // Added in Go 1.15
    db.SetConnMaxIdleTime(5 * time.Minute)
}
```

### Connection Pool Best Practices

Understanding how to configure the pool is crucial for production applications:

```go
package main

import (
    "database/sql"
    "log"
    "time"

    _ "github.com/lib/pq"
)

func setupDatabase(connStr string) (*sql.DB, error) {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return nil, err
    }

    // For a web application with moderate traffic:
    // - MaxOpenConns should be less than the database's max connections
    // - MaxIdleConns should be reasonable but not too high to waste resources
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)

    // Connections older than this will be closed
    // This helps with load balancers and database failovers
    db.SetConnMaxLifetime(5 * time.Minute)

    // Idle connections older than this will be closed
    // Helps reduce load on idle databases
    db.SetConnMaxIdleTime(5 * time.Minute)

    // Verify connectivity
    if err := db.Ping(); err != nil {
        db.Close()
        return nil, err
    }

    return db, nil
}

func main() {
    db, err := setupDatabase("postgres://localhost/mydb?sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // Check pool statistics
    stats := db.Stats()
    log.Printf("Open connections: %d", stats.OpenConnections)
    log.Printf("In use: %d", stats.InUse)
    log.Printf("Idle: %d", stats.Idle)
}
```

## Executing Queries

The `database/sql` package provides several methods for executing queries, each suited for different use cases.

### Exec for Non-Select Queries

Use `Exec()` for INSERT, UPDATE, DELETE, and other queries that don't return rows:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/lib/pq"
)

func main() {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // INSERT with ExecContext
    result, err := db.ExecContext(ctx,
        "INSERT INTO users (name, email) VALUES ($1, $2)",
        "Alice", "alice@example.com",
    )
    if err != nil {
        log.Fatal("Insert failed:", err)
    }

    // Get the auto-generated ID (if supported by driver)
    id, err := result.LastInsertId()
    if err != nil {
        // PostgreSQL doesn't support LastInsertId
        // Use RETURNING clause instead
        log.Println("LastInsertId not supported")
    } else {
        fmt.Println("Inserted ID:", id)
    }

    // Get the number of rows affected
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Rows affected:", rowsAffected)
}
```

### Using RETURNING with PostgreSQL

PostgreSQL doesn't support `LastInsertId()`. Instead, use the `RETURNING` clause:

```go
func insertUserPostgres(ctx context.Context, db *sql.DB, name, email string) (int64, error) {
    var id int64
    err := db.QueryRowContext(ctx,
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
        name, email,
    ).Scan(&id)

    if err != nil {
        return 0, err
    }
    return id, nil
}
```

### QueryRow for Single Row Results

Use `QueryRow()` when you expect exactly one row:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/lib/pq"
)

type User struct {
    ID        int64
    Name      string
    Email     string
    CreatedAt time.Time
}

func getUserByID(ctx context.Context, db *sql.DB, id int64) (*User, error) {
    user := &User{}

    err := db.QueryRowContext(ctx,
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        id,
    ).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

    if err == sql.ErrNoRows {
        return nil, fmt.Errorf("user %d not found", id)
    }
    if err != nil {
        return nil, fmt.Errorf("error querying user: %w", err)
    }

    return user, nil
}

func main() {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    ctx := context.Background()

    user, err := getUserByID(ctx, db, 1)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("User: %+v\n", user)
}
```

### Query for Multiple Rows

Use `Query()` when you expect multiple rows:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/lib/pq"
)

type User struct {
    ID        int64
    Name      string
    Email     string
    CreatedAt time.Time
}

func getAllUsers(ctx context.Context, db *sql.DB) ([]User, error) {
    rows, err := db.QueryContext(ctx,
        "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC",
    )
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close() // Always close rows!

    var users []User

    for rows.Next() {
        var user User
        err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
        if err != nil {
            return nil, fmt.Errorf("scan failed: %w", err)
        }
        users = append(users, user)
    }

    // Check for errors from iterating over rows
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("rows iteration error: %w", err)
    }

    return users, nil
}

func getUsersByStatus(ctx context.Context, db *sql.DB, active bool) ([]User, error) {
    rows, err := db.QueryContext(ctx,
        "SELECT id, name, email, created_at FROM users WHERE active = $1",
        active,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    users := make([]User, 0)

    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt); err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    return users, rows.Err()
}

func main() {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    ctx := context.Background()

    users, err := getAllUsers(ctx, db)
    if err != nil {
        log.Fatal(err)
    }

    for _, user := range users {
        fmt.Printf("User: %s <%s>\n", user.Name, user.Email)
    }
}
```

## Handling NULL Values

Database NULL values require special handling in Go because Go's basic types don't have a null state.

### Using sql.Null Types

```go
package main

import (
    "database/sql"
    "fmt"
    "time"
)

type User struct {
    ID        int64
    Name      string
    Email     sql.NullString // Can be NULL
    Phone     sql.NullString // Can be NULL
    Age       sql.NullInt64  // Can be NULL
    CreatedAt time.Time
    DeletedAt sql.NullTime   // Can be NULL
}

func getUserWithNulls(ctx context.Context, db *sql.DB, id int64) (*User, error) {
    user := &User{}

    err := db.QueryRowContext(ctx,
        `SELECT id, name, email, phone, age, created_at, deleted_at
         FROM users WHERE id = $1`,
        id,
    ).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Phone,
        &user.Age,
        &user.CreatedAt,
        &user.DeletedAt,
    )

    if err != nil {
        return nil, err
    }

    return user, nil
}

func printUserInfo(user *User) {
    fmt.Printf("ID: %d\n", user.ID)
    fmt.Printf("Name: %s\n", user.Name)

    // Check if nullable fields have valid values
    if user.Email.Valid {
        fmt.Printf("Email: %s\n", user.Email.String)
    } else {
        fmt.Println("Email: (not set)")
    }

    if user.Phone.Valid {
        fmt.Printf("Phone: %s\n", user.Phone.String)
    } else {
        fmt.Println("Phone: (not set)")
    }

    if user.Age.Valid {
        fmt.Printf("Age: %d\n", user.Age.Int64)
    } else {
        fmt.Println("Age: (not set)")
    }
}
```

### Using Pointers for Nullable Fields

An alternative approach is to use pointers:

```go
type User struct {
    ID        int64
    Name      string
    Email     *string    // nil if NULL
    Phone     *string    // nil if NULL
    Age       *int       // nil if NULL
    DeletedAt *time.Time // nil if NULL
}

func getUserWithPointers(ctx context.Context, db *sql.DB, id int64) (*User, error) {
    user := &User{}

    err := db.QueryRowContext(ctx,
        `SELECT id, name, email, phone, age, deleted_at
         FROM users WHERE id = $1`,
        id,
    ).Scan(
        &user.ID,
        &user.Name,
        &user.Email,  // Will be nil if NULL
        &user.Phone,
        &user.Age,
        &user.DeletedAt,
    )

    return user, err
}

func printUserInfoWithPointers(user *User) {
    fmt.Printf("Name: %s\n", user.Name)

    if user.Email != nil {
        fmt.Printf("Email: %s\n", *user.Email)
    } else {
        fmt.Println("Email: (not set)")
    }
}
```

## Prepared Statements

Prepared statements improve performance for repeated queries and provide protection against SQL injection.

### Creating and Using Prepared Statements

```go
package main

import (
    "context"
    "database/sql"
    "log"
    "time"

    _ "github.com/lib/pq"
)

type UserRepository struct {
    db         *sql.DB
    insertStmt *sql.Stmt
    selectStmt *sql.Stmt
    updateStmt *sql.Stmt
}

func NewUserRepository(db *sql.DB) (*UserRepository, error) {
    ctx := context.Background()

    insertStmt, err := db.PrepareContext(ctx,
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
    )
    if err != nil {
        return nil, err
    }

    selectStmt, err := db.PrepareContext(ctx,
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
    )
    if err != nil {
        insertStmt.Close()
        return nil, err
    }

    updateStmt, err := db.PrepareContext(ctx,
        "UPDATE users SET name = $1, email = $2 WHERE id = $3",
    )
    if err != nil {
        insertStmt.Close()
        selectStmt.Close()
        return nil, err
    }

    return &UserRepository{
        db:         db,
        insertStmt: insertStmt,
        selectStmt: selectStmt,
        updateStmt: updateStmt,
    }, nil
}

func (r *UserRepository) Close() error {
    var errs []error

    if err := r.insertStmt.Close(); err != nil {
        errs = append(errs, err)
    }
    if err := r.selectStmt.Close(); err != nil {
        errs = append(errs, err)
    }
    if err := r.updateStmt.Close(); err != nil {
        errs = append(errs, err)
    }

    if len(errs) > 0 {
        return errs[0]
    }
    return nil
}

func (r *UserRepository) Create(ctx context.Context, name, email string) (int64, error) {
    var id int64
    err := r.insertStmt.QueryRowContext(ctx, name, email).Scan(&id)
    return id, err
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*User, error) {
    user := &User{}
    err := r.selectStmt.QueryRowContext(ctx, id).Scan(
        &user.ID, &user.Name, &user.Email, &user.CreatedAt,
    )
    if err == sql.ErrNoRows {
        return nil, nil
    }
    return user, err
}

func (r *UserRepository) Update(ctx context.Context, id int64, name, email string) error {
    _, err := r.updateStmt.ExecContext(ctx, name, email, id)
    return err
}
```

### Prepared Statement Considerations

```go
// Prepared statements are bound to a specific connection
// The database/sql package handles re-preparation transparently

// Don't prepare statements in a loop - prepare once and reuse
// Bad:
for _, user := range users {
    stmt, _ := db.Prepare("INSERT INTO users (name) VALUES ($1)")
    stmt.Exec(user.Name)
    stmt.Close() // Wasteful!
}

// Good:
stmt, _ := db.Prepare("INSERT INTO users (name) VALUES ($1)")
defer stmt.Close()
for _, user := range users {
    stmt.Exec(user.Name)
}
```

## Transactions

Transactions ensure that a series of database operations either all succeed or all fail together.

### Basic Transaction Usage

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "log"

    _ "github.com/lib/pq"
)

func transferFunds(ctx context.Context, db *sql.DB, fromID, toID int64, amount float64) error {
    // Start a transaction
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }

    // Deferred rollback - will be a no-op if tx.Commit() succeeds
    defer tx.Rollback()

    // Check source account balance
    var balance float64
    err = tx.QueryRowContext(ctx,
        "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE",
        fromID,
    ).Scan(&balance)
    if err != nil {
        return fmt.Errorf("failed to get source balance: %w", err)
    }

    if balance < amount {
        return fmt.Errorf("insufficient funds: have %.2f, need %.2f", balance, amount)
    }

    // Deduct from source account
    _, err = tx.ExecContext(ctx,
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        amount, fromID,
    )
    if err != nil {
        return fmt.Errorf("failed to deduct from source: %w", err)
    }

    // Add to destination account
    _, err = tx.ExecContext(ctx,
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        amount, toID,
    )
    if err != nil {
        return fmt.Errorf("failed to add to destination: %w", err)
    }

    // Record the transfer
    _, err = tx.ExecContext(ctx,
        "INSERT INTO transfers (from_id, to_id, amount) VALUES ($1, $2, $3)",
        fromID, toID, amount,
    )
    if err != nil {
        return fmt.Errorf("failed to record transfer: %w", err)
    }

    // Commit the transaction
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }

    return nil
}
```

### Transaction Options

```go
func transferWithOptions(ctx context.Context, db *sql.DB) error {
    // Transaction with isolation level and read-only options
    tx, err := db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelSerializable, // Highest isolation level
        ReadOnly:  false,
    })
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // ... perform operations ...

    return tx.Commit()
}

// Available isolation levels:
// sql.LevelDefault
// sql.LevelReadUncommitted
// sql.LevelReadCommitted
// sql.LevelWriteCommitted
// sql.LevelRepeatableRead
// sql.LevelSnapshot
// sql.LevelSerializable
// sql.LevelLinearizable
```

### Transaction Helper Function

A common pattern is to create a helper function that handles transaction boilerplate:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
)

// TxFunc is a function that executes within a transaction
type TxFunc func(tx *sql.Tx) error

// WithTransaction executes a function within a transaction
func WithTransaction(ctx context.Context, db *sql.DB, fn TxFunc) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin transaction: %w", err)
    }

    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p) // Re-throw panic after rollback
        }
    }()

    if err := fn(tx); err != nil {
        if rbErr := tx.Rollback(); rbErr != nil {
            return fmt.Errorf("tx error: %v, rollback error: %v", err, rbErr)
        }
        return err
    }

    if err := tx.Commit(); err != nil {
        return fmt.Errorf("commit transaction: %w", err)
    }

    return nil
}

// Usage
func createUserWithProfile(ctx context.Context, db *sql.DB, name, email, bio string) error {
    return WithTransaction(ctx, db, func(tx *sql.Tx) error {
        // Create user
        var userID int64
        err := tx.QueryRowContext(ctx,
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
            name, email,
        ).Scan(&userID)
        if err != nil {
            return fmt.Errorf("create user: %w", err)
        }

        // Create profile
        _, err = tx.ExecContext(ctx,
            "INSERT INTO profiles (user_id, bio) VALUES ($1, $2)",
            userID, bio,
        )
        if err != nil {
            return fmt.Errorf("create profile: %w", err)
        }

        return nil
    })
}
```

## Using sqlx for Enhanced Functionality

The `sqlx` package extends `database/sql` with additional features like struct scanning and named parameters.

### Installing sqlx

```bash
go get github.com/jmoiron/sqlx
```

### Basic sqlx Usage

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

type User struct {
    ID        int64     `db:"id"`
    Name      string    `db:"name"`
    Email     string    `db:"email"`
    CreatedAt time.Time `db:"created_at"`
}

func main() {
    // Connect using sqlx
    db, err := sqlx.Connect("postgres", "postgres://localhost/mydb?sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    ctx := context.Background()

    // Query single row into struct
    var user User
    err = db.GetContext(ctx, &user,
        "SELECT id, name, email, created_at FROM users WHERE id = $1", 1)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("User: %+v\n", user)

    // Query multiple rows into slice
    var users []User
    err = db.SelectContext(ctx, &users,
        "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
    if err != nil {
        log.Fatal(err)
    }

    for _, u := range users {
        fmt.Printf("User: %s <%s>\n", u.Name, u.Email)
    }
}
```

### Named Queries with sqlx

```go
package main

import (
    "context"
    "log"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

type User struct {
    ID    int64  `db:"id"`
    Name  string `db:"name"`
    Email string `db:"email"`
}

func main() {
    db, err := sqlx.Connect("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    ctx := context.Background()

    // Named exec with struct
    user := User{Name: "Alice", Email: "alice@example.com"}
    result, err := db.NamedExecContext(ctx,
        "INSERT INTO users (name, email) VALUES (:name, :email)",
        user,
    )
    if err != nil {
        log.Fatal(err)
    }

    // Named exec with map
    _, err = db.NamedExecContext(ctx,
        "UPDATE users SET name = :name WHERE email = :email",
        map[string]interface{}{
            "name":  "Bob",
            "email": "bob@example.com",
        },
    )
    if err != nil {
        log.Fatal(err)
    }

    // Named query
    var users []User
    err = db.SelectContext(ctx, &users,
        "SELECT * FROM users WHERE name = :name",
        map[string]interface{}{"name": "Alice"},
    )
}
```

### In Queries with sqlx

```go
package main

import (
    "context"
    "log"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

func main() {
    db, err := sqlx.Connect("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    ctx := context.Background()

    // Query with IN clause
    ids := []int64{1, 2, 3, 4, 5}

    // Use sqlx.In to expand the slice
    query, args, err := sqlx.In(
        "SELECT * FROM users WHERE id IN (?)",
        ids,
    )
    if err != nil {
        log.Fatal(err)
    }

    // Rebind for PostgreSQL (converts ? to $1, $2, etc.)
    query = db.Rebind(query)

    var users []User
    err = db.SelectContext(ctx, &users, query, args...)
    if err != nil {
        log.Fatal(err)
    }
}
```

### StructScan for Complex Queries

```go
package main

import (
    "context"
    "time"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

type UserWithPosts struct {
    ID        int64     `db:"id"`
    Name      string    `db:"name"`
    Email     string    `db:"email"`
    CreatedAt time.Time `db:"created_at"`
    PostCount int       `db:"post_count"`
}

func getUsersWithPostCount(ctx context.Context, db *sqlx.DB) ([]UserWithPosts, error) {
    var users []UserWithPosts

    err := db.SelectContext(ctx, &users, `
        SELECT
            u.id,
            u.name,
            u.email,
            u.created_at,
            COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON p.user_id = u.id
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY post_count DESC
    `)

    return users, err
}
```

## GORM - Go ORM

GORM is a full-featured ORM for Go that provides a high-level abstraction over database operations.

### Installing GORM

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres  # or mysql, sqlite, sqlserver
```

### Basic GORM Setup

```go
package main

import (
    "log"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:100;not null"`
    Email     string    `gorm:"size:255;uniqueIndex;not null"`
    Age       *int      `gorm:"default:null"`
    Active    bool      `gorm:"default:true"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"` // Soft delete
}

func main() {
    dsn := "host=localhost user=postgres password=secret dbname=mydb port=5432 sslmode=disable"

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info), // Log all SQL
    })
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Auto-migrate the schema
    err = db.AutoMigrate(&User{})
    if err != nil {
        log.Fatal("Failed to migrate:", err)
    }
}
```

### GORM CRUD Operations

```go
package main

import (
    "errors"
    "fmt"
    "log"

    "gorm.io/gorm"
)

// Create
func createUser(db *gorm.DB) {
    user := User{
        Name:  "Alice",
        Email: "alice@example.com",
    }

    result := db.Create(&user)
    if result.Error != nil {
        log.Fatal(result.Error)
    }

    fmt.Printf("Created user with ID: %d\n", user.ID)
    fmt.Printf("Rows affected: %d\n", result.RowsAffected)
}

// Create multiple records
func createUsers(db *gorm.DB) {
    users := []User{
        {Name: "Bob", Email: "bob@example.com"},
        {Name: "Carol", Email: "carol@example.com"},
    }

    result := db.Create(&users)
    if result.Error != nil {
        log.Fatal(result.Error)
    }

    for _, u := range users {
        fmt.Printf("Created: %s (ID: %d)\n", u.Name, u.ID)
    }
}

// Read single record
func getUser(db *gorm.DB, id uint) (*User, error) {
    var user User

    result := db.First(&user, id)
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        return nil, fmt.Errorf("user %d not found", id)
    }
    if result.Error != nil {
        return nil, result.Error
    }

    return &user, nil
}

// Read with conditions
func getUserByEmail(db *gorm.DB, email string) (*User, error) {
    var user User

    result := db.Where("email = ?", email).First(&user)
    if result.Error != nil {
        return nil, result.Error
    }

    return &user, nil
}

// Read multiple records
func getActiveUsers(db *gorm.DB) ([]User, error) {
    var users []User

    result := db.Where("active = ?", true).Find(&users)
    if result.Error != nil {
        return nil, result.Error
    }

    return users, nil
}

// Update
func updateUser(db *gorm.DB, id uint, name string) error {
    result := db.Model(&User{}).Where("id = ?", id).Update("name", name)
    return result.Error
}

// Update multiple fields
func updateUserFields(db *gorm.DB, id uint, updates map[string]interface{}) error {
    result := db.Model(&User{}).Where("id = ?", id).Updates(updates)
    return result.Error
}

// Delete (soft delete if DeletedAt field exists)
func deleteUser(db *gorm.DB, id uint) error {
    result := db.Delete(&User{}, id)
    return result.Error
}

// Permanent delete
func permanentDeleteUser(db *gorm.DB, id uint) error {
    result := db.Unscoped().Delete(&User{}, id)
    return result.Error
}
```

### GORM Relationships

```go
package main

import (
    "time"

    "gorm.io/gorm"
)

// User has many Posts
type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:100"`
    Email     string    `gorm:"size:255;uniqueIndex"`
    Posts     []Post    `gorm:"foreignKey:UserID"`
    Profile   Profile   `gorm:"foreignKey:UserID"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

type Post struct {
    ID        uint      `gorm:"primaryKey"`
    Title     string    `gorm:"size:200"`
    Content   string    `gorm:"type:text"`
    UserID    uint      `gorm:"index"`
    User      User      `gorm:"foreignKey:UserID"`
    Tags      []Tag     `gorm:"many2many:post_tags"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

type Profile struct {
    ID     uint   `gorm:"primaryKey"`
    UserID uint   `gorm:"uniqueIndex"`
    Bio    string `gorm:"type:text"`
    Avatar string `gorm:"size:255"`
}

type Tag struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"size:50;uniqueIndex"`
    Posts []Post `gorm:"many2many:post_tags"`
}

// Preloading relationships
func getUserWithPosts(db *gorm.DB, id uint) (*User, error) {
    var user User

    result := db.Preload("Posts").Preload("Profile").First(&user, id)
    if result.Error != nil {
        return nil, result.Error
    }

    return &user, nil
}

// Nested preloading
func getPostWithUserAndTags(db *gorm.DB, id uint) (*Post, error) {
    var post Post

    result := db.Preload("User").Preload("Tags").First(&post, id)
    if result.Error != nil {
        return nil, result.Error
    }

    return &post, nil
}

// Conditional preloading
func getUserWithRecentPosts(db *gorm.DB, id uint) (*User, error) {
    var user User

    result := db.Preload("Posts", func(db *gorm.DB) *gorm.DB {
        return db.Order("created_at DESC").Limit(5)
    }).First(&user, id)

    return &user, result.Error
}
```

### GORM Transactions

```go
package main

import (
    "errors"

    "gorm.io/gorm"
)

func transferCredits(db *gorm.DB, fromID, toID uint, amount int) error {
    return db.Transaction(func(tx *gorm.DB) error {
        var fromUser, toUser User

        // Lock the source user row
        if err := tx.Set("gorm:query_option", "FOR UPDATE").
            First(&fromUser, fromID).Error; err != nil {
            return err
        }

        // Check sufficient credits (assuming Credits field exists)
        if fromUser.Credits < amount {
            return errors.New("insufficient credits")
        }

        // Lock the destination user row
        if err := tx.Set("gorm:query_option", "FOR UPDATE").
            First(&toUser, toID).Error; err != nil {
            return err
        }

        // Perform transfer
        if err := tx.Model(&fromUser).Update("credits", fromUser.Credits-amount).Error; err != nil {
            return err
        }

        if err := tx.Model(&toUser).Update("credits", toUser.Credits+amount).Error; err != nil {
            return err
        }

        return nil
    })
}

// Manual transaction control
func createUserWithProfile(db *gorm.DB, name, email, bio string) error {
    tx := db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    if tx.Error != nil {
        return tx.Error
    }

    user := User{Name: name, Email: email}
    if err := tx.Create(&user).Error; err != nil {
        tx.Rollback()
        return err
    }

    profile := Profile{UserID: user.ID, Bio: bio}
    if err := tx.Create(&profile).Error; err != nil {
        tx.Rollback()
        return err
    }

    return tx.Commit().Error
}
```

### GORM Hooks

```go
package main

import (
    "time"

    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:100"`
    Email     string    `gorm:"size:255;uniqueIndex"`
    Password  string    `gorm:"size:255"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// BeforeCreate hook - hash password before saving
func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.Password != "" {
        hashedPassword, err := bcrypt.GenerateFromPassword(
            []byte(u.Password),
            bcrypt.DefaultCost,
        )
        if err != nil {
            return err
        }
        u.Password = string(hashedPassword)
    }
    return nil
}

// AfterCreate hook - log or perform actions after creation
func (u *User) AfterCreate(tx *gorm.DB) error {
    // Example: send welcome email, create audit log, etc.
    return nil
}

// BeforeUpdate hook
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    // Example: validate data before update
    return nil
}

// AfterFind hook - runs after a record is found
func (u *User) AfterFind(tx *gorm.DB) error {
    // Example: decrypt sensitive data, transform fields
    return nil
}
```

## Best Practices

### Always Use Context

```go
// Good - uses context for timeout and cancellation
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

rows, err := db.QueryContext(ctx, "SELECT * FROM users")

// Avoid - no context means no timeout control
rows, err := db.Query("SELECT * FROM users")
```

### Close Resources Properly

```go
// Always close rows
rows, err := db.Query("SELECT * FROM users")
if err != nil {
    return err
}
defer rows.Close() // Important!

// Always close prepared statements when done
stmt, err := db.Prepare("INSERT INTO users (name) VALUES ($1)")
if err != nil {
    return err
}
defer stmt.Close()
```

### Handle sql.ErrNoRows

```go
var user User
err := db.QueryRow("SELECT * FROM users WHERE id = $1", id).Scan(&user.ID, &user.Name)

switch {
case errors.Is(err, sql.ErrNoRows):
    // No user found - this might be expected
    return nil, ErrUserNotFound
case err != nil:
    // Actual error
    return nil, fmt.Errorf("query failed: %w", err)
default:
    return &user, nil
}
```

### Use Parameterized Queries

```go
// Good - parameterized query prevents SQL injection
db.Query("SELECT * FROM users WHERE email = $1", email)

// DANGEROUS - vulnerable to SQL injection!
db.Query(fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email))
```

### Configure Connection Pool for Production

```go
func setupProductionDB(connStr string) (*sql.DB, error) {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return nil, err
    }

    // Configure for production workload
    db.SetMaxOpenConns(25)                 // Limit connections
    db.SetMaxIdleConns(5)                  // Keep some connections ready
    db.SetConnMaxLifetime(5 * time.Minute) // Prevent stale connections
    db.SetConnMaxIdleTime(5 * time.Minute) // Clean up idle connections

    // Verify connection works
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := db.PingContext(ctx); err != nil {
        db.Close()
        return nil, err
    }

    return db, nil
}
```

### Use Transactions for Related Operations

```go
func createOrder(ctx context.Context, db *sql.DB, order *Order, items []OrderItem) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // Insert order
    err = tx.QueryRowContext(ctx,
        "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id",
        order.UserID, order.Total,
    ).Scan(&order.ID)
    if err != nil {
        return err
    }

    // Insert all order items
    stmt, err := tx.PrepareContext(ctx,
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
    )
    if err != nil {
        return err
    }
    defer stmt.Close()

    for _, item := range items {
        _, err = stmt.ExecContext(ctx, order.ID, item.ProductID, item.Quantity, item.Price)
        if err != nil {
            return err
        }
    }

    return tx.Commit()
}
```

## Conclusion

Go provides excellent tools for database operations at multiple levels of abstraction:

- **database/sql**: The standard library package that provides a low-level, flexible interface with built-in connection pooling. Best for maximum control and when you need to write custom SQL.

- **sqlx**: An extension of database/sql that adds convenient features like struct scanning and named parameters while maintaining compatibility with the standard library.

- **GORM**: A full-featured ORM that handles most database operations automatically. Best for rapid development and when you want to minimize SQL writing.

Choose the right tool based on your project's needs:

- Use `database/sql` when you need maximum control, are comfortable with SQL, or have complex queries that ORMs struggle with.
- Use `sqlx` when you want the benefits of the standard library with more convenient struct scanning.
- Use GORM when you want rapid development, automatic migrations, and are willing to accept some performance overhead for convenience.

Regardless of which approach you choose, always remember to:
- Use parameterized queries to prevent SQL injection
- Close resources properly with defer
- Use context for timeout and cancellation control
- Configure connection pooling appropriately for your workload
- Use transactions for operations that need to succeed or fail together
