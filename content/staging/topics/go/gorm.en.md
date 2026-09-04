---
title: GORM ORM Complete Guide
description: Master GORM, Go's most popular ORM framework, from model definition to advanced features
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - GORM
  - ORM
  - Database
  - MySQL
  - PostgreSQL
status: imported
origin: old/src/content/docs/go/gorm.en.md
divergence: 0.226
issues: []
legacy:
  category: Go
  subcategory: Data Access
  order: 15
  lastUpdated: 2026-01-07
---

GORM is the most popular and feature-rich ORM (Object-Relational Mapping) framework in Go. It provides an elegant API, powerful association handling, automatic migrations, hook functions, and other advanced features that significantly simplify database operations. This comprehensive guide will introduce GORM's core concepts, usage patterns, and best practices.

## Concept Introduction

### What is ORM

ORM (Object-Relational Mapping) is a programming technique that establishes mapping relationships between object-oriented programming languages and relational databases. Through ORM, developers can manipulate databases using object-oriented approaches without writing extensive SQL statements.

### GORM's Positioning

GORM is the "full-featured ORM" in the Go ecosystem, with the design philosophy of:

- **Developer-Friendly**: Provides clean and intuitive APIs
- **Feature-Complete**: Supports associations, transactions, migrations, hooks, and other advanced features
- **Extensibility**: Supports plugin systems and custom functionality
- **Database-Agnostic**: Supports MySQL, PostgreSQL, SQLite, SQL Server, and other databases

### GORM History

GORM was created by Jinzhu in 2013 and is one of Go's earliest ORM frameworks. GORM v2, released in 2020, underwent a major overhaul introducing better performance, clearer APIs, and more powerful features.

## Core Principles

### Reflection Mechanism

GORM extensively uses Go's reflection (reflect) package to implement object-to-database-table mapping:

```go
// GORM internally uses reflection to parse model structures
type Schema struct {
    ModelType      reflect.Type
    Table          string
    PrimaryFields  []*Field
    Fields         []*Field
    Relationships  map[string]*Relationship
}

// Field information
type Field struct {
    Name              string
    DBName            string
    FieldType         reflect.Type
    Tag               reflect.StructTag
    PrimaryKey        bool
    AutoIncrement     bool
    // ...
}
```

### Method Chaining

GORM implements method chaining by returning `*gorm.DB` instances. Each call clones a new DB instance:

```go
// Method chaining example
db.Where("age > ?", 18).Order("name").Limit(10).Find(&users)

// Internal implementation
func (db *DB) Where(query interface{}, args ...interface{}) *DB {
    tx := db.getInstance() // Clone instance
    tx.Statement.AddClause(clause.Where{
        Exprs: []clause.Expression{clause.Expr{SQL: query, Vars: args}},
    })
    return tx
}
```

### SQL Builder

GORM uses an internal SQL builder to generate SQL statements:

```go
// Statement struct stores query information
type Statement struct {
    DB            *DB
    Table         string
    Model         interface{}
    Clauses       map[string]clause.Clause
    Selects       []string
    Omits         []string
    Joins         []Join
    Preloads      map[string][]interface{}
    // ...
}
```

### Callback System

GORM operations are implemented through callback chains, allowing custom logic insertion at different operation stages:

```go
// Callback registration
db.Callback().Create().Before("gorm:create").Register("my_plugin", func(db *gorm.DB) {
    // Execute before create
})

// Default callback chains
// Create: BeforeCreate -> Create -> AfterCreate
// Query:  Query
// Update: BeforeUpdate -> Update -> AfterUpdate
// Delete: BeforeDelete -> Delete -> AfterDelete
```

## Key Points

### Installation and Setup

```bash
# Install GORM v2
go get -u gorm.io/gorm

# Install database drivers
go get -u gorm.io/driver/mysql     # MySQL
go get -u gorm.io/driver/postgres  # PostgreSQL
go get -u gorm.io/driver/sqlite    # SQLite
go get -u gorm.io/driver/sqlserver # SQL Server
```

### Database Connection

```go
package main

import (
    "log"
    "time"

    "gorm.io/driver/mysql"
    "gorm.io/driver/postgres"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// MySQL connection
func connectMySQL() (*gorm.DB, error) {
    dsn := "user:password@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
    return gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
}

// PostgreSQL connection
func connectPostgreSQL() (*gorm.DB, error) {
    dsn := "host=localhost user=postgres password=secret dbname=mydb port=5432 sslmode=disable"
    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

// SQLite connection
func connectSQLite() (*gorm.DB, error) {
    return gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
}

// Configure connection pool
func configureConnectionPool(db *gorm.DB) error {
    sqlDB, err := db.DB()
    if err != nil {
        return err
    }

    // Set maximum idle connections
    sqlDB.SetMaxIdleConns(10)
    // Set maximum open connections
    sqlDB.SetMaxOpenConns(100)
    // Set connection maximum lifetime
    sqlDB.SetConnMaxLifetime(time.Hour)
    // Set connection maximum idle time
    sqlDB.SetConnMaxIdleTime(10 * time.Minute)

    return nil
}
```

### GORM Configuration Options

```go
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
    // Skip default transaction (improve performance)
    SkipDefaultTransaction: true,

    // Naming strategy
    NamingStrategy: schema.NamingStrategy{
        TablePrefix:   "t_",      // Table prefix
        SingularTable: true,      // Use singular table names
        NoLowerCase:   false,     // Use lowercase
    },

    // Disable foreign key constraints during migration
    DisableForeignKeyConstraintWhenMigrating: true,

    // Logger configuration
    Logger: logger.New(
        log.New(os.Stdout, "\r\n", log.LstdFlags),
        logger.Config{
            SlowThreshold:             time.Second,   // Slow query threshold
            LogLevel:                  logger.Info,   // Log level
            IgnoreRecordNotFoundError: true,          // Ignore record not found errors
            Colorful:                  true,          // Colorful output
        },
    ),

    // Time configuration
    NowFunc: func() time.Time {
        return time.Now().Local()
    },

    // Prepared statement caching
    PrepareStmt: true,
})
```

## Code Examples

### Model Definition

GORM uses structs to define database models, with tags configuring field attributes:

```go
package models

import (
    "time"

    "gorm.io/gorm"
)

// Base model (built-in GORM)
// gorm.Model contains ID, CreatedAt, UpdatedAt, DeletedAt fields

// User model
type User struct {
    ID        uint           `gorm:"primaryKey;autoIncrement"`
    CreatedAt time.Time      `gorm:"autoCreateTime"`
    UpdatedAt time.Time      `gorm:"autoUpdateTime"`
    DeletedAt gorm.DeletedAt `gorm:"index"` // Soft delete

    // Basic fields
    Username string `gorm:"type:varchar(50);uniqueIndex;not null;comment:Username"`
    Email    string `gorm:"type:varchar(100);uniqueIndex;not null"`
    Password string `gorm:"type:varchar(255);not null"`
    Age      int    `gorm:"default:0;check:age >= 0"`
    Active   bool   `gorm:"default:true"`

    // Nullable fields
    Phone    *string    `gorm:"type:varchar(20)"`
    Birthday *time.Time

    // JSON field
    Settings JSON `gorm:"type:json"`

    // Ignored fields
    TempData string `gorm:"-"`              // Completely ignored
    ReadOnly string `gorm:"->;default:ro"`  // Read-only
    WriteOnly string `gorm:"->:false;<-"`   // Write-only

    // Association fields
    Profile   *Profile  `gorm:"foreignKey:UserID"`
    Posts     []Post    `gorm:"foreignKey:AuthorID"`
    Roles     []Role    `gorm:"many2many:user_roles"`
    Followers []User    `gorm:"many2many:user_follows;joinForeignKey:user_id;joinReferences:follower_id"`
}

// TableName custom table name
func (User) TableName() string {
    return "users"
}

// Profile user profile (one-to-one)
type Profile struct {
    ID        uint   `gorm:"primaryKey"`
    UserID    uint   `gorm:"uniqueIndex"`
    Bio       string `gorm:"type:text"`
    Avatar    string `gorm:"type:varchar(255)"`
    Location  string `gorm:"type:varchar(100)"`
    Website   string `gorm:"type:varchar(255)"`
}

// Post model (one-to-many)
type Post struct {
    ID        uint           `gorm:"primaryKey"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`

    Title     string `gorm:"type:varchar(200);not null;index"`
    Content   string `gorm:"type:text"`
    Published bool   `gorm:"default:false"`
    ViewCount int    `gorm:"default:0"`
    AuthorID  uint   `gorm:"index"`

    Author   *User      `gorm:"foreignKey:AuthorID"`
    Tags     []Tag      `gorm:"many2many:post_tags"`
    Comments []Comment  `gorm:"foreignKey:PostID"`
}

// Tag model (many-to-many)
type Tag struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"type:varchar(50);uniqueIndex"`
    Posts []Post `gorm:"many2many:post_tags"`
}

// Comment model
type Comment struct {
    ID        uint      `gorm:"primaryKey"`
    CreatedAt time.Time
    PostID    uint      `gorm:"index"`
    UserID    uint      `gorm:"index"`
    Content   string    `gorm:"type:text;not null"`
    ParentID  *uint     `gorm:"index"` // Parent comment ID, supports nested comments

    Post     *Post      `gorm:"foreignKey:PostID"`
    User     *User      `gorm:"foreignKey:UserID"`
    Parent   *Comment   `gorm:"foreignKey:ParentID"`
    Children []Comment  `gorm:"foreignKey:ParentID"`
}

// Role model
type Role struct {
    ID          uint   `gorm:"primaryKey"`
    Name        string `gorm:"type:varchar(50);uniqueIndex"`
    Description string `gorm:"type:varchar(255)"`
    Users       []User `gorm:"many2many:user_roles"`
}

// JSON custom type
type JSON map[string]interface{}

// Scan implement sql.Scanner interface
func (j *JSON) Scan(value interface{}) error {
    bytes, ok := value.([]byte)
    if !ok {
        return errors.New("type assertion failed")
    }
    return json.Unmarshal(bytes, j)
}

// Value implement driver.Valuer interface
func (j JSON) Value() (driver.Value, error) {
    if j == nil {
        return nil, nil
    }
    return json.Marshal(j)
}
```

### GORM Tags Details

```go
// Common tags
type Example struct {
    // Primary key
    ID uint `gorm:"primaryKey"`

    // Column name
    Name string `gorm:"column:user_name"`

    // Type
    Content string `gorm:"type:text"`

    // Size (for string types)
    Title string `gorm:"size:255"`

    // Precision (for numeric types)
    Price float64 `gorm:"precision:10;scale:2"`

    // Not null
    Email string `gorm:"not null"`

    // Unique
    Code string `gorm:"unique"`

    // Default value
    Status int `gorm:"default:1"`

    // Index
    Age int `gorm:"index"`

    // Composite index
    Field1 string `gorm:"index:idx_name,priority:1"`
    Field2 string `gorm:"index:idx_name,priority:2"`

    // Unique index
    Phone string `gorm:"uniqueIndex"`

    // Auto increment
    Seq uint `gorm:"autoIncrement"`

    // Embedded struct
    Address Address `gorm:"embedded;embeddedPrefix:addr_"`

    // Serializer
    Data []string `gorm:"serializer:json"`

    // Check constraint
    Age int `gorm:"check:age >= 18"`

    // Comment
    Desc string `gorm:"comment:Description"`
}

// Address embedded struct
type Address struct {
    Province string
    City     string
    Street   string
}
```

### CRUD Operations

#### Create Operations

```go
// Create single record
func CreateUser(db *gorm.DB) {
    user := User{
        Username: "alice",
        Email:    "alice@example.com",
        Password: "hashed_password",
        Age:      25,
    }

    result := db.Create(&user)
    if result.Error != nil {
        log.Fatal(result.Error)
    }

    fmt.Printf("Created user ID: %d, Rows affected: %d\n", user.ID, result.RowsAffected)
}

// Batch create
func CreateUsers(db *gorm.DB) {
    users := []User{
        {Username: "bob", Email: "bob@example.com", Age: 28},
        {Username: "charlie", Email: "charlie@example.com", Age: 30},
        {Username: "david", Email: "david@example.com", Age: 22},
    }

    // Batch insert
    result := db.Create(&users)
    fmt.Printf("Created %d users\n", result.RowsAffected)

    // Batch insert in chunks (100 records per batch)
    db.CreateInBatches(&users, 100)
}

// Selective create
func CreateWithSelect(db *gorm.DB) {
    user := User{
        Username: "eve",
        Email:    "eve@example.com",
        Age:      25,
        Active:   false, // Will not be inserted
    }

    // Insert only specified fields
    db.Select("Username", "Email").Create(&user)

    // Ignore specified fields
    db.Omit("Age", "Active").Create(&user)
}

// Create with Map
func CreateWithMap(db *gorm.DB) {
    db.Model(&User{}).Create(map[string]interface{}{
        "Username": "frank",
        "Email":    "frank@example.com",
        "Age":      32,
    })
}

// Upsert (create or update)
func Upsert(db *gorm.DB) {
    user := User{
        Username: "grace",
        Email:    "grace@example.com",
        Age:      28,
    }

    // Update on conflict
    db.Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "email"}},
        DoUpdates: clause.AssignmentColumns([]string{"username", "age"}),
    }).Create(&user)
}
```

#### Query Operations

```go
// Basic queries
func QueryBasics(db *gorm.DB) {
    var user User
    var users []User

    // Query by primary key
    db.First(&user, 1)                    // SELECT * FROM users WHERE id = 1 ORDER BY id LIMIT 1
    db.First(&user, "id = ?", 1)          // Same, with condition
    db.First(&user, []int{1, 2, 3})       // IN query

    // Query first/last
    db.First(&user)                       // ORDER BY id LIMIT 1
    db.Last(&user)                        // ORDER BY id DESC LIMIT 1
    db.Take(&user)                        // LIMIT 1 (no ordering)

    // Query all
    db.Find(&users)

    // Check if record exists
    result := db.First(&user, 100)
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        fmt.Println("Record not found")
    }
}

// Conditional queries
func QueryWithConditions(db *gorm.DB) {
    var users []User

    // Where conditions
    db.Where("age > ?", 18).Find(&users)
    db.Where("name = ? AND age >= ?", "alice", 18).Find(&users)
    db.Where("name IN ?", []string{"alice", "bob"}).Find(&users)
    db.Where("name LIKE ?", "%ali%").Find(&users)
    db.Where("age BETWEEN ? AND ?", 20, 30).Find(&users)
    db.Where("created_at > ?", time.Now().AddDate(0, 0, -7)).Find(&users)

    // Struct condition (zero values ignored)
    db.Where(&User{Username: "alice", Age: 25}).Find(&users)

    // Map condition (zero values not ignored)
    db.Where(map[string]interface{}{"username": "alice", "age": 0}).Find(&users)

    // Or condition
    db.Where("age > ?", 30).Or("active = ?", true).Find(&users)

    // Not condition
    db.Not("name = ?", "admin").Find(&users)

    // Inline condition
    db.Find(&users, "age > ? AND active = ?", 18, true)
}

// Advanced queries
func AdvancedQuery(db *gorm.DB) {
    var users []User
    var user User

    // Select fields
    db.Select("id", "username", "email").Find(&users)
    db.Select("id", "username as name").Find(&users)

    // Ordering
    db.Order("age desc, username").Find(&users)
    db.Order("age desc").Order("username").Find(&users)

    // Pagination
    page, pageSize := 1, 10
    offset := (page - 1) * pageSize
    db.Offset(offset).Limit(pageSize).Find(&users)

    // Group and aggregation
    type Result struct {
        Age   int
        Count int
    }
    var results []Result
    db.Model(&User{}).Select("age, count(*) as count").Group("age").Having("count > ?", 1).Find(&results)

    // Distinct
    db.Distinct("age").Find(&users)

    // Raw SQL
    db.Raw("SELECT * FROM users WHERE age > ?", 18).Scan(&users)

    // Subquery
    subQuery := db.Model(&User{}).Select("avg(age)")
    db.Where("age > (?)", subQuery).Find(&users)

    // Locking
    db.Clauses(clause.Locking{Strength: "UPDATE"}).Find(&users)  // FOR UPDATE
    db.Clauses(clause.Locking{Strength: "SHARE"}).Find(&users)   // FOR SHARE

    // FirstOrInit (initialize if not found)
    db.Where(User{Username: "new_user"}).Attrs(User{Age: 20}).FirstOrInit(&user)

    // FirstOrCreate (create if not found)
    db.Where(User{Username: "new_user"}).Attrs(User{Age: 20}).FirstOrCreate(&user)
}

// Aggregate queries
func AggregateQuery(db *gorm.DB) {
    var count int64
    var totalAge int64
    var avgAge float64

    // Count
    db.Model(&User{}).Count(&count)
    db.Model(&User{}).Where("active = ?", true).Count(&count)

    // Sum
    db.Model(&User{}).Select("sum(age)").Scan(&totalAge)

    // Average
    db.Model(&User{}).Select("avg(age)").Scan(&avgAge)

    // Pluck (get single column)
    var ages []int
    db.Model(&User{}).Pluck("age", &ages)

    var usernames []string
    db.Model(&User{}).Pluck("username", &usernames)
}

// Scan to custom struct
func ScanToStruct(db *gorm.DB) {
    type UserDTO struct {
        ID       uint
        Username string
        PostCount int
    }

    var results []UserDTO
    db.Model(&User{}).
        Select("users.id, users.username, count(posts.id) as post_count").
        Joins("left join posts on posts.author_id = users.id").
        Group("users.id").
        Scan(&results)
}
```

#### Update Operations

```go
// Basic updates
func UpdateBasics(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // Update single field
    db.Model(&user).Update("age", 30)

    // Update multiple fields (struct, zero values not updated)
    db.Model(&user).Updates(User{Username: "new_name", Age: 30})

    // Update multiple fields (Map, zero values updated)
    db.Model(&user).Updates(map[string]interface{}{
        "username": "new_name",
        "age":      0,
        "active":   false,
    })

    // Selective update
    db.Model(&user).Select("username", "age").Updates(User{Username: "select_update", Age: 25})

    // Omit fields
    db.Model(&user).Omit("age").Updates(User{Username: "omit_update", Age: 999})
}

// Conditional updates
func ConditionalUpdate(db *gorm.DB) {
    // Batch update
    db.Model(&User{}).Where("age < ?", 18).Update("active", false)

    // Using expressions
    db.Model(&User{}).Update("age", gorm.Expr("age + ?", 1))

    // Using subquery
    db.Model(&User{}).Update("age", db.Model(&User{}).Select("avg(age)"))
}

// Update hook
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if u.Age < 0 {
        return errors.New("age cannot be negative")
    }
    return nil
}

// Skip hooks update
func UpdateWithoutHooks(db *gorm.DB) {
    db.Model(&User{}).Where("id = ?", 1).UpdateColumn("age", 30)
    db.Model(&User{}).Where("id = ?", 1).UpdateColumns(map[string]interface{}{"age": 30})
}

// Save (update all fields)
func SaveUser(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    user.Username = "updated_name"
    user.Age = 35
    db.Save(&user) // Update all fields, including zero values
}
```

#### Delete Operations

```go
// Basic deletes
func DeleteBasics(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // Delete record (soft delete if DeletedAt field exists)
    db.Delete(&user)

    // Delete by primary key
    db.Delete(&User{}, 1)
    db.Delete(&User{}, []int{1, 2, 3})

    // Conditional delete
    db.Where("age < ?", 18).Delete(&User{})
    db.Delete(&User{}, "email LIKE ?", "%test%")
}

// Soft delete
func SoftDelete(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // Soft delete (sets deleted_at field)
    db.Delete(&user)

    // Queries automatically exclude soft-deleted records
    var users []User
    db.Find(&users) // Does not include soft-deleted records

    // Query including soft-deleted records
    db.Unscoped().Find(&users)

    // Query only soft-deleted records
    db.Unscoped().Where("deleted_at IS NOT NULL").Find(&users)
}

// Hard delete
func HardDelete(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // Permanently delete (skip soft delete)
    db.Unscoped().Delete(&user)
}

// Delete hook
func (u *User) BeforeDelete(tx *gorm.DB) error {
    // Check if can be deleted
    if u.Username == "admin" {
        return errors.New("cannot delete admin account")
    }
    return nil
}
```

### Association Operations

```go
// Preload associations
func PreloadAssociations(db *gorm.DB) {
    var user User
    var users []User

    // Preload single association
    db.Preload("Profile").First(&user, 1)

    // Preload multiple associations
    db.Preload("Profile").Preload("Posts").Preload("Roles").First(&user, 1)

    // Nested preload
    db.Preload("Posts.Comments").Preload("Posts.Tags").First(&user, 1)

    // Conditional preload
    db.Preload("Posts", "published = ?", true).Find(&users)

    // Custom preload
    db.Preload("Posts", func(db *gorm.DB) *gorm.DB {
        return db.Where("published = ?", true).Order("created_at DESC").Limit(5)
    }).Find(&users)

    // Preload all associations
    db.Preload(clause.Associations).Find(&users)

    // Nested conditional preload
    db.Preload("Posts.Comments", func(db *gorm.DB) *gorm.DB {
        return db.Order("comments.created_at DESC")
    }).Find(&users)
}

// Joins preload (inner join, more efficient but only for one-to-one)
func JoinsPreload(db *gorm.DB) {
    var users []User

    // Using Joins for preload
    db.Joins("Profile").Find(&users)

    // Joins with conditions
    db.Joins("Profile", db.Where(&Profile{Location: "Beijing"})).Find(&users)
}

// Association methods
func AssociationMethods(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // Get association
    var posts []Post
    db.Model(&user).Association("Posts").Find(&posts)

    // Add association
    db.Model(&user).Association("Posts").Append(&Post{Title: "New Post"})

    // Replace association
    db.Model(&user).Association("Posts").Replace(&Post{Title: "Replaced Post"})

    // Delete association
    db.Model(&user).Association("Posts").Delete(&posts[0])

    // Clear association
    db.Model(&user).Association("Posts").Clear()

    // Count
    count := db.Model(&user).Association("Posts").Count()
    fmt.Printf("User has %d posts\n", count)
}

// Many-to-many operations
func ManyToManyOperations(db *gorm.DB) {
    var user User
    var role Role
    db.First(&user, 1)
    db.First(&role, 1)

    // Add role
    db.Model(&user).Association("Roles").Append(&role)

    // Add multiple roles
    roles := []Role{{Name: "admin"}, {Name: "editor"}}
    db.Model(&user).Association("Roles").Append(&roles)

    // Delete role
    db.Model(&user).Association("Roles").Delete(&role)

    // Replace all roles
    newRoles := []Role{{Name: "viewer"}}
    db.Model(&user).Association("Roles").Replace(&newRoles)
}

// Create with associations
func CreateWithAssociations(db *gorm.DB) {
    // Create user with profile
    user := User{
        Username: "john",
        Email:    "john@example.com",
        Profile: &Profile{
            Bio:      "Hello, I'm John",
            Location: "New York",
        },
        Posts: []Post{
            {Title: "First Post", Content: "Content 1"},
            {Title: "Second Post", Content: "Content 2"},
        },
        Roles: []Role{
            {Name: "user"},
        },
    }

    db.Create(&user)
}

// Skip associations creation
func SkipAssociations(db *gorm.DB) {
    user := User{
        Username: "jane",
        Email:    "jane@example.com",
        Profile:  &Profile{Bio: "Skip this"},
    }

    // Skip all associations
    db.Omit(clause.Associations).Create(&user)

    // Skip specific association
    db.Omit("Profile").Create(&user)
}
```

### Hooks and Callbacks

```go
// Model hooks example
type User struct {
    ID           uint
    Username     string
    Email        string
    PasswordHash string
    Password     string `gorm:"-"` // Not stored in database
    CreatedAt    time.Time
    UpdatedAt    time.Time
}

// BeforeSave called before create and update
func (u *User) BeforeSave(tx *gorm.DB) error {
    // Validate data
    if u.Username == "" {
        return errors.New("username cannot be empty")
    }
    return nil
}

// BeforeCreate before create
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // Encrypt password
    if u.Password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
        if err != nil {
            return err
        }
        u.PasswordHash = string(hash)
        u.Password = "" // Clear plaintext password
    }

    // Set default value
    if u.CreatedAt.IsZero() {
        u.CreatedAt = time.Now()
    }

    return nil
}

// AfterCreate after create
func (u *User) AfterCreate(tx *gorm.DB) error {
    // Send welcome email
    go sendWelcomeEmail(u.Email)

    // Record audit log
    tx.Create(&AuditLog{
        Action:    "create",
        TableName: "users",
        RecordID:  u.ID,
        CreatedAt: time.Now(),
    })

    return nil
}

// BeforeUpdate before update
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    // Re-encrypt password if modified
    if u.Password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
        if err != nil {
            return err
        }
        u.PasswordHash = string(hash)
        u.Password = ""
    }
    return nil
}

// AfterUpdate after update
func (u *User) AfterUpdate(tx *gorm.DB) error {
    // Clear cache
    cache.Delete(fmt.Sprintf("user:%d", u.ID))
    return nil
}

// BeforeDelete before delete
func (u *User) BeforeDelete(tx *gorm.DB) error {
    // Check for associated data
    var postCount int64
    tx.Model(&Post{}).Where("author_id = ?", u.ID).Count(&postCount)
    if postCount > 0 {
        return errors.New("user has posts, cannot delete")
    }
    return nil
}

// AfterDelete after delete
func (u *User) AfterDelete(tx *gorm.DB) error {
    // Clean up associated data
    tx.Where("user_id = ?", u.ID).Delete(&Profile{})
    return nil
}

// AfterFind after query
func (u *User) AfterFind(tx *gorm.DB) error {
    // Desensitize data
    if u.Email != "" {
        parts := strings.Split(u.Email, "@")
        if len(parts) == 2 {
            u.Email = parts[0][:1] + "***@" + parts[1]
        }
    }
    return nil
}

// Audit log model
type AuditLog struct {
    ID        uint
    Action    string
    TableName string
    RecordID  uint
    UserID    uint
    CreatedAt time.Time
}
```

### Transaction Handling

```go
// Auto transaction
func AutoTransaction(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // Create user
        user := User{Username: "alice", Email: "alice@example.com"}
        if err := tx.Create(&user).Error; err != nil {
            return err // Error returns automatically rollback
        }

        // Create profile
        profile := Profile{UserID: user.ID, Bio: "Hello"}
        if err := tx.Create(&profile).Error; err != nil {
            return err
        }

        // Return nil to commit transaction
        return nil
    })
}

// Manual transaction
func ManualTransaction(db *gorm.DB) error {
    // Begin transaction
    tx := db.Begin()
    if tx.Error != nil {
        return tx.Error
    }

    // Use defer to ensure rollback on panic
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
            panic(r)
        }
    }()

    // Execute operations
    user := User{Username: "bob", Email: "bob@example.com"}
    if err := tx.Create(&user).Error; err != nil {
        tx.Rollback()
        return err
    }

    profile := Profile{UserID: user.ID, Bio: "Hi"}
    if err := tx.Create(&profile).Error; err != nil {
        tx.Rollback()
        return err
    }

    // Commit transaction
    return tx.Commit().Error
}

// Nested transactions (savepoints)
func NestedTransaction(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // Outer transaction operation
        tx.Create(&User{Username: "user1", Email: "user1@example.com"})

        // Nested transaction (using savepoint)
        err := tx.Transaction(func(tx2 *gorm.DB) error {
            tx2.Create(&User{Username: "user2", Email: "user2@example.com"})
            return errors.New("simulated error, rollback nested transaction")
        })

        if err != nil {
            // Nested transaction failed, but outer transaction can continue
            log.Printf("Nested transaction failed: %v", err)
        }

        // Continue outer transaction
        tx.Create(&User{Username: "user3", Email: "user3@example.com"})

        return nil // user1 and user3 will be saved
    })
}

// Transaction with options
func TransactionWithOptions(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // Transaction operations
        return nil
    }, &sql.TxOptions{
        Isolation: sql.LevelSerializable, // Isolation level
        ReadOnly:  false,
    })
}

// Transaction helper function
type TxFunc func(tx *gorm.DB) error

func WithTransaction(db *gorm.DB, fn TxFunc) error {
    return db.Transaction(fn)
}

// Usage example
func TransferMoney(db *gorm.DB, fromID, toID uint, amount float64) error {
    return WithTransaction(db, func(tx *gorm.DB) error {
        // Deduct from source account
        result := tx.Model(&Account{}).
            Where("id = ? AND balance >= ?", fromID, amount).
            Update("balance", gorm.Expr("balance - ?", amount))

        if result.RowsAffected == 0 {
            return errors.New("insufficient balance")
        }

        // Increase destination account
        if err := tx.Model(&Account{}).
            Where("id = ?", toID).
            Update("balance", gorm.Expr("balance + ?", amount)).Error; err != nil {
            return err
        }

        // Record transfer
        return tx.Create(&Transfer{
            FromID:  fromID,
            ToID:    toID,
            Amount:  amount,
        }).Error
    })
}
```

### Database Migrations

```go
// Auto migration
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &User{},
        &Profile{},
        &Post{},
        &Tag{},
        &Comment{},
        &Role{},
    )
}

// Check if table exists
func TableExists(db *gorm.DB) {
    hasTable := db.Migrator().HasTable(&User{})
    fmt.Printf("users table exists: %v\n", hasTable)

    hasTable = db.Migrator().HasTable("posts")
    fmt.Printf("posts table exists: %v\n", hasTable)
}

// Manual migration operations
func ManualMigration(db *gorm.DB) {
    migrator := db.Migrator()

    // Create table
    migrator.CreateTable(&User{})

    // Drop table
    migrator.DropTable(&User{})
    migrator.DropTable("users")

    // Rename table
    migrator.RenameTable(&User{}, &UserNew{})
    migrator.RenameTable("users", "users_new")
}

// Column operations
func ColumnOperations(db *gorm.DB) {
    migrator := db.Migrator()

    // Check if column exists
    hasColumn := migrator.HasColumn(&User{}, "Age")
    fmt.Printf("Age column exists: %v\n", hasColumn)

    // Add column
    migrator.AddColumn(&User{}, "Phone")

    // Drop column
    migrator.DropColumn(&User{}, "TempField")

    // Modify column
    migrator.AlterColumn(&User{}, "Username")

    // Rename column
    migrator.RenameColumn(&User{}, "old_name", "new_name")
}

// Index operations
func IndexOperations(db *gorm.DB) {
    migrator := db.Migrator()

    // Check if index exists
    hasIndex := migrator.HasIndex(&User{}, "idx_users_email")
    fmt.Printf("Index exists: %v\n", hasIndex)

    // Create index
    migrator.CreateIndex(&User{}, "idx_users_email")

    // Drop index
    migrator.DropIndex(&User{}, "idx_users_email")

    // Rename index
    migrator.RenameIndex(&User{}, "old_index", "new_index")
}

// Constraint operations
func ConstraintOperations(db *gorm.DB) {
    migrator := db.Migrator()

    // Check if constraint exists
    hasConstraint := migrator.HasConstraint(&User{}, "fk_users_profile")

    // Create constraint
    migrator.CreateConstraint(&User{}, "Profile")

    // Drop constraint
    migrator.DropConstraint(&User{}, "fk_users_profile")
}

// Get table information
func GetTableInfo(db *gorm.DB) {
    migrator := db.Migrator()

    // Get all tables
    tables, _ := migrator.GetTables()
    fmt.Printf("All tables: %v\n", tables)

    // Get column information
    columns, _ := migrator.ColumnTypes(&User{})
    for _, column := range columns {
        name := column.Name()
        dataType, _ := column.ColumnType()
        nullable, _ := column.Nullable()
        fmt.Printf("Column: %s, Type: %s, Nullable: %v\n", name, dataType, nullable)
    }

    // Get index information
    indexes, _ := migrator.GetIndexes(&User{})
    for _, index := range indexes {
        fmt.Printf("Index: %s, Columns: %v\n", index.Name(), index.Columns())
    }
}
```

## Best Practices

### Repository Pattern

```go
// Repository interface definition
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id uint) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id uint) error
    List(ctx context.Context, filter UserFilter) ([]User, int64, error)
}

// Query filter
type UserFilter struct {
    Username string
    Email    string
    AgeMin   int
    AgeMax   int
    Active   *bool
    Page     int
    PageSize int
    OrderBy  string
}

// Repository implementation
type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uint) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).
        Preload("Profile").
        Preload("Roles").
        First(&user, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Delete(&User{}, id).Error
}

func (r *userRepository) List(ctx context.Context, filter UserFilter) ([]User, int64, error) {
    var users []User
    var total int64

    query := r.db.WithContext(ctx).Model(&User{})

    // Apply filter conditions
    if filter.Username != "" {
        query = query.Where("username LIKE ?", "%"+filter.Username+"%")
    }
    if filter.Email != "" {
        query = query.Where("email LIKE ?", "%"+filter.Email+"%")
    }
    if filter.AgeMin > 0 {
        query = query.Where("age >= ?", filter.AgeMin)
    }
    if filter.AgeMax > 0 {
        query = query.Where("age <= ?", filter.AgeMax)
    }
    if filter.Active != nil {
        query = query.Where("active = ?", *filter.Active)
    }

    // Count
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // Ordering
    if filter.OrderBy != "" {
        query = query.Order(filter.OrderBy)
    } else {
        query = query.Order("id DESC")
    }

    // Pagination
    if filter.PageSize <= 0 {
        filter.PageSize = 10
    }
    if filter.Page <= 0 {
        filter.Page = 1
    }
    offset := (filter.Page - 1) * filter.PageSize
    query = query.Offset(offset).Limit(filter.PageSize)

    // Preload associations
    query = query.Preload("Profile")

    err := query.Find(&users).Error
    return users, total, err
}
```

### Scopes

```go
// Common scopes
func Active(db *gorm.DB) *gorm.DB {
    return db.Where("active = ?", true)
}

func Published(db *gorm.DB) *gorm.DB {
    return db.Where("published = ?", true)
}

func NotDeleted(db *gorm.DB) *gorm.DB {
    return db.Where("deleted_at IS NULL")
}

// Scopes with parameters
func AgeRange(min, max int) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("age BETWEEN ? AND ?", min, max)
    }
}

func CreatedAfter(t time.Time) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("created_at > ?", t)
    }
}

func OrderByLatest(db *gorm.DB) *gorm.DB {
    return db.Order("created_at DESC")
}

// Pagination scope
func Paginate(page, pageSize int) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if page <= 0 {
            page = 1
        }
        if pageSize <= 0 {
            pageSize = 10
        }
        if pageSize > 100 {
            pageSize = 100
        }
        offset := (page - 1) * pageSize
        return db.Offset(offset).Limit(pageSize)
    }
}

// Search scope
func Search(keyword string, fields ...string) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if keyword == "" || len(fields) == 0 {
            return db
        }

        conditions := make([]string, len(fields))
        args := make([]interface{}, len(fields))
        for i, field := range fields {
            conditions[i] = fmt.Sprintf("%s LIKE ?", field)
            args[i] = "%" + keyword + "%"
        }

        return db.Where(strings.Join(conditions, " OR "), args...)
    }
}

// Using scopes
func UseScopesExample(db *gorm.DB) {
    var users []User

    // Single scope
    db.Scopes(Active).Find(&users)

    // Multiple scopes
    db.Scopes(Active, AgeRange(18, 30), OrderByLatest).Find(&users)

    // Combined usage
    db.Scopes(
        Active,
        AgeRange(20, 40),
        Paginate(1, 10),
        Search("john", "username", "email"),
    ).Find(&users)

    // Dynamic scopes
    scopes := []func(*gorm.DB) *gorm.DB{Active}
    if wantYoung {
        scopes = append(scopes, AgeRange(18, 25))
    }
    db.Scopes(scopes...).Find(&users)
}
```

### Generic Repository

```go
// Generic Repository (Go 1.18+)
type Repository[T any] interface {
    Create(ctx context.Context, entity *T) error
    GetByID(ctx context.Context, id uint) (*T, error)
    Update(ctx context.Context, entity *T) error
    Delete(ctx context.Context, id uint) error
    List(ctx context.Context, page, pageSize int) ([]T, int64, error)
}

type baseRepository[T any] struct {
    db *gorm.DB
}

func NewBaseRepository[T any](db *gorm.DB) Repository[T] {
    return &baseRepository[T]{db: db}
}

func (r *baseRepository[T]) Create(ctx context.Context, entity *T) error {
    return r.db.WithContext(ctx).Create(entity).Error
}

func (r *baseRepository[T]) GetByID(ctx context.Context, id uint) (*T, error) {
    var entity T
    err := r.db.WithContext(ctx).First(&entity, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &entity, err
}

func (r *baseRepository[T]) Update(ctx context.Context, entity *T) error {
    return r.db.WithContext(ctx).Save(entity).Error
}

func (r *baseRepository[T]) Delete(ctx context.Context, id uint) error {
    var entity T
    return r.db.WithContext(ctx).Delete(&entity, id).Error
}

func (r *baseRepository[T]) List(ctx context.Context, page, pageSize int) ([]T, int64, error) {
    var entities []T
    var total int64

    var entity T
    db := r.db.WithContext(ctx).Model(&entity)

    if err := db.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    offset := (page - 1) * pageSize
    err := db.Offset(offset).Limit(pageSize).Find(&entities).Error
    return entities, total, err
}

// Using generic repository
func UseGenericRepository(db *gorm.DB) {
    userRepo := NewBaseRepository[User](db)
    postRepo := NewBaseRepository[Post](db)

    ctx := context.Background()

    // Create user
    user := &User{Username: "test", Email: "test@example.com"}
    userRepo.Create(ctx, user)

    // Get user
    user, _ = userRepo.GetByID(ctx, 1)

    // Create post
    post := &Post{Title: "Test Post", AuthorID: user.ID}
    postRepo.Create(ctx, post)
}
```

## Common Pitfalls

### N+1 Query Problem

```go
// Bad example - N+1 queries
func BadExample(db *gorm.DB) {
    var users []User
    db.Find(&users)

    for _, user := range users {
        var profile Profile
        db.Where("user_id = ?", user.ID).First(&profile) // One query per user
        fmt.Println(user.Username, profile.Bio)
    }
}

// Correct example - Using Preload
func GoodExample(db *gorm.DB) {
    var users []User
    db.Preload("Profile").Find(&users) // Only two queries

    for _, user := range users {
        if user.Profile != nil {
            fmt.Println(user.Username, user.Profile.Bio)
        }
    }
}

// Correct example - Using Joins (for one-to-one)
func BetterExample(db *gorm.DB) {
    var users []User
    db.Joins("Profile").Find(&users) // Only one query (JOIN)

    for _, user := range users {
        if user.Profile != nil {
            fmt.Println(user.Username, user.Profile.Bio)
        }
    }
}
```

### Zero Value Update Problem

```go
// Issue: Zero values are not updated
func ZeroValueProblem(db *gorm.DB) {
    user := User{ID: 1, Username: "new_name", Age: 0, Active: false}

    // Age and Active are not updated because they are zero values
    db.Model(&user).Updates(user)
}

// Solution 1: Use Map
func SolutionWithMap(db *gorm.DB) {
    db.Model(&User{ID: 1}).Updates(map[string]interface{}{
        "username": "new_name",
        "age":      0,
        "active":   false,
    })
}

// Solution 2: Use Select to specify fields
func SolutionWithSelect(db *gorm.DB) {
    user := User{ID: 1, Username: "new_name", Age: 0, Active: false}
    db.Model(&user).Select("username", "age", "active").Updates(user)
}

// Solution 3: Use pointer types
type UserWithPointers struct {
    ID       uint
    Username *string
    Age      *int
    Active   *bool
}

func SolutionWithPointers(db *gorm.DB) {
    age := 0
    active := false
    user := UserWithPointers{ID: 1, Age: &age, Active: &active}
    db.Model(&user).Updates(user)
}
```

### Transaction Pitfalls

```go
// Bad example - Transaction not handled correctly
func BadTransaction(db *gorm.DB) error {
    tx := db.Begin()

    // Forgot to check if Begin succeeded
    tx.Create(&User{Username: "test"})

    // Forgot to rollback
    if err := tx.Create(&Profile{}).Error; err != nil {
        return err // Transaction is orphaned
    }

    return tx.Commit().Error
}

// Correct example
func GoodTransaction(db *gorm.DB) error {
    tx := db.Begin()
    if tx.Error != nil {
        return tx.Error
    }

    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
            panic(r)
        }
    }()

    if err := tx.Create(&User{Username: "test"}).Error; err != nil {
        tx.Rollback()
        return err
    }

    if err := tx.Create(&Profile{}).Error; err != nil {
        tx.Rollback()
        return err
    }

    return tx.Commit().Error
}

// Best approach - Use Transaction method
func BestTransaction(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(&User{Username: "test"}).Error; err != nil {
            return err
        }
        if err := tx.Create(&Profile{}).Error; err != nil {
            return err
        }
        return nil
    })
}
```

### Concurrency Safety Issues

```go
// Bad example - Shared DB instance state
func ConcurrencyProblem(db *gorm.DB) {
    // This affects all subsequent queries
    db = db.Where("active = ?", true)

    // Concurrent requests will share this condition
    go func() { db.Find(&users1) }()
    go func() { db.Find(&users2) }()
}

// Correct example - Create new session for each query
func ConcurrencySafe(db *gorm.DB) {
    // Use Session to create new session
    go func() {
        db.Session(&gorm.Session{}).Where("active = ?", true).Find(&users1)
    }()

    go func() {
        db.Session(&gorm.Session{}).Where("active = ?", false).Find(&users2)
    }()
}

// Or use WithContext
func ConcurrencySafeWithContext(db *gorm.DB) {
    ctx1 := context.Background()
    ctx2 := context.Background()

    go func() {
        db.WithContext(ctx1).Where("active = ?", true).Find(&users1)
    }()

    go func() {
        db.WithContext(ctx2).Where("active = ?", false).Find(&users2)
    }()
}
```

### Memory Leaks

```go
// Bad example - Rows not closed
func MemoryLeak(db *gorm.DB) {
    rows, _ := db.Model(&User{}).Rows()
    // Forgot to close rows
    for rows.Next() {
        // ...
    }
}

// Correct example
func NoMemoryLeak(db *gorm.DB) {
    rows, err := db.Model(&User{}).Rows()
    if err != nil {
        return
    }
    defer rows.Close() // Ensure closing

    for rows.Next() {
        var user User
        db.ScanRows(rows, &user)
        // ...
    }
}
```

## Performance Considerations

### Connection Pool Optimization

```go
func OptimizeConnectionPool(db *gorm.DB) {
    sqlDB, err := db.DB()
    if err != nil {
        log.Fatal(err)
    }

    // Adjust based on application type
    // Web application (high concurrency, short connections)
    sqlDB.SetMaxOpenConns(100)    // Max open connections
    sqlDB.SetMaxIdleConns(25)     // Max idle connections
    sqlDB.SetConnMaxLifetime(5 * time.Minute)
    sqlDB.SetConnMaxIdleTime(2 * time.Minute)

    // Background tasks (low concurrency, long connections)
    // sqlDB.SetMaxOpenConns(10)
    // sqlDB.SetMaxIdleConns(5)
    // sqlDB.SetConnMaxLifetime(30 * time.Minute)
}

// Monitor connection pool status
func MonitorConnectionPool(db *gorm.DB) {
    sqlDB, _ := db.DB()

    ticker := time.NewTicker(30 * time.Second)
    for range ticker.C {
        stats := sqlDB.Stats()
        log.Printf(
            "DB Pool: Open=%d InUse=%d Idle=%d WaitCount=%d",
            stats.OpenConnections,
            stats.InUse,
            stats.Idle,
            stats.WaitCount,
        )
    }
}
```

### Query Optimization

```go
// 1. Only query needed fields
func SelectOptimization(db *gorm.DB) {
    var users []User

    // Not recommended
    db.Find(&users)

    // Recommended
    db.Select("id", "username", "email").Find(&users)

    // Or use dedicated DTO
    type UserDTO struct {
        ID       uint
        Username string
        Email    string
    }
    var dtos []UserDTO
    db.Model(&User{}).Select("id", "username", "email").Scan(&dtos)
}

// 2. Use indexes properly
func IndexOptimization(db *gorm.DB) {
    // Ensure query condition fields have indexes
    db.Where("email = ?", "test@example.com").First(&user) // email should have index

    // Composite index order matters
    db.Where("status = ? AND created_at > ?", 1, time.Now().AddDate(0, 0, -7)).Find(&users)
}

// 3. Batch operations
func BatchOptimization(db *gorm.DB) {
    // Batch insert
    users := make([]User, 1000)
    db.CreateInBatches(users, 100) // 100 records per batch

    // Batch update
    db.Model(&User{}).Where("status = ?", 0).Updates(map[string]interface{}{"status": 1})
}

// 4. Use raw SQL for complex queries
func RawSQLOptimization(db *gorm.DB) {
    // Use raw SQL for complex queries
    var results []map[string]interface{}
    db.Raw(`
        SELECT u.id, u.username, COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON p.author_id = u.id
        WHERE u.active = ?
        GROUP BY u.id
        HAVING post_count > ?
        ORDER BY post_count DESC
        LIMIT 10
    `, true, 5).Scan(&results)
}

// 5. Prepared statements
func PreparedStatementOptimization(db *gorm.DB) {
    // Enable prepared statement caching
    db, _ = gorm.Open(mysql.Open(dsn), &gorm.Config{
        PrepareStmt: true,
    })

    // Subsequent queries with same structure will reuse prepared statement
    db.Where("age > ?", 18).Find(&users)
    db.Where("age > ?", 25).Find(&users)
}

// 6. Avoid SELECT *
func AvoidSelectAll(db *gorm.DB) {
    // Use Pluck to get single column
    var emails []string
    db.Model(&User{}).Pluck("email", &emails)

    // Use Scan to get partial fields
    type Result struct {
        Username string
        Count    int
    }
    var results []Result
    db.Model(&User{}).Select("username, count(*) as count").Group("username").Scan(&results)
}
```

### Large Dataset Processing

```go
// Process large amounts of data in batches
func BatchProcess(db *gorm.DB) {
    var users []User

    // Use FindInBatches for batch processing
    db.Where("active = ?", true).FindInBatches(&users, 100, func(tx *gorm.DB, batch int) error {
        for _, user := range users {
            // Process each user
            processUser(user)
        }
        return nil
    })
}

// Use cursor processing
func CursorProcess(db *gorm.DB) {
    rows, _ := db.Model(&User{}).Where("active = ?", true).Rows()
    defer rows.Close()

    for rows.Next() {
        var user User
        db.ScanRows(rows, &user)
        processUser(user)
    }
}

// Stream processing
func StreamProcess(db *gorm.DB) {
    // Use Iterator
    var user User
    rows, _ := db.Model(&User{}).Where("active = ?", true).Rows()
    defer rows.Close()

    for rows.Next() {
        db.ScanRows(rows, &user)
        // Process immediately without occupying large memory
        processUser(user)
    }
}
```

## Real-World Scenarios

### RESTful API Implementation

```go
// handler/user_handler.go
type UserHandler struct {
    userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

// Get user list
func (h *UserHandler) List(c *gin.Context) {
    var filter UserFilter
    if err := c.ShouldBindQuery(&filter); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    users, total, err := h.userService.List(c.Request.Context(), filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "data":  users,
        "total": total,
        "page":  filter.Page,
        "size":  filter.PageSize,
    })
}

// Get single user
func (h *UserHandler) Get(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    user, err := h.userService.GetByID(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if user == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": user})
}

// Create user
func (h *UserHandler) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    user, err := h.userService.Create(c.Request.Context(), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"data": user})
}

// Update user
func (h *UserHandler) Update(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    var req UpdateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    user, err := h.userService.Update(c.Request.Context(), uint(id), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": user})
}

// Delete user
func (h *UserHandler) Delete(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    if err := h.userService.Delete(c.Request.Context(), uint(id)); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
```

### Multi-Tenancy Implementation

```go
// Schema-based multi-tenancy
type TenantModel struct {
    ID        uint `gorm:"primaryKey"`
    TenantID  uint `gorm:"index"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// Tenant scope
func WithTenant(tenantID uint) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("tenant_id = ?", tenantID)
    }
}

// Tenant middleware
func TenantMiddleware(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := c.GetHeader("X-Tenant-ID")
        if tenantID == "" {
            c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "tenant id required"})
            return
        }

        tid, err := strconv.ParseUint(tenantID, 10, 32)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
            return
        }

        // Create DB with tenant context
        tenantDB := db.Scopes(WithTenant(uint(tid)))
        c.Set("db", tenantDB)
        c.Set("tenantID", uint(tid))

        c.Next()
    }
}

// Use in Handler
func (h *UserHandler) List(c *gin.Context) {
    db := c.MustGet("db").(*gorm.DB)

    var users []User
    db.Find(&users) // Automatically includes tenant condition
}

// Auto set tenant ID
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // Get tenant ID from context
    if tenantID, ok := tx.Statement.Context.Value("tenantID").(uint); ok {
        u.TenantID = tenantID
    }
    return nil
}
```

### Audit Logging

```go
// Audit log model
type AuditLog struct {
    ID         uint      `gorm:"primaryKey"`
    TableName  string    `gorm:"size:100;index"`
    RecordID   uint      `gorm:"index"`
    Action     string    `gorm:"size:20"` // create, update, delete
    OldValues  JSON      `gorm:"type:json"`
    NewValues  JSON      `gorm:"type:json"`
    UserID     uint      `gorm:"index"`
    IPAddress  string    `gorm:"size:45"`
    UserAgent  string    `gorm:"size:255"`
    CreatedAt  time.Time `gorm:"index"`
}

// Audit log plugin
func AuditLogPlugin(db *gorm.DB) {
    // Create callback
    db.Callback().Create().After("gorm:create").Register("audit:create", func(db *gorm.DB) {
        if db.Error != nil || db.Statement.Schema == nil {
            return
        }

        auditLog := AuditLog{
            TableName: db.Statement.Table,
            Action:    "create",
            NewValues: structToJSON(db.Statement.Model),
            CreatedAt: time.Now(),
        }

        // Get user info from context
        if userID, ok := db.Statement.Context.Value("userID").(uint); ok {
            auditLog.UserID = userID
        }

        // Get primary key value
        if primaryField := db.Statement.Schema.PrioritizedPrimaryField; primaryField != nil {
            if value, isZero := primaryField.ValueOf(db.Statement.Context, db.Statement.ReflectValue); !isZero {
                auditLog.RecordID = value.(uint)
            }
        }

        // Log asynchronously
        go db.Session(&gorm.Session{SkipHooks: true}).Create(&auditLog)
    })

    // Update callback
    db.Callback().Update().Before("gorm:update").Register("audit:before_update", func(db *gorm.DB) {
        if db.Statement.Schema == nil {
            return
        }

        // Save old values
        var oldRecord map[string]interface{}
        db.Session(&gorm.Session{NewDB: true}).
            Table(db.Statement.Table).
            Where(db.Statement.Clauses["WHERE"]).
            First(&oldRecord)

        db.Statement.Context = context.WithValue(db.Statement.Context, "oldValues", oldRecord)
    })

    db.Callback().Update().After("gorm:update").Register("audit:update", func(db *gorm.DB) {
        if db.Error != nil || db.Statement.Schema == nil {
            return
        }

        oldValues, _ := db.Statement.Context.Value("oldValues").(map[string]interface{})

        auditLog := AuditLog{
            TableName: db.Statement.Table,
            Action:    "update",
            OldValues: oldValues,
            NewValues: structToJSON(db.Statement.Model),
            CreatedAt: time.Now(),
        }

        if userID, ok := db.Statement.Context.Value("userID").(uint); ok {
            auditLog.UserID = userID
        }

        go db.Session(&gorm.Session{SkipHooks: true}).Create(&auditLog)
    })

    // Delete callback
    db.Callback().Delete().After("gorm:delete").Register("audit:delete", func(db *gorm.DB) {
        if db.Error != nil {
            return
        }

        auditLog := AuditLog{
            TableName: db.Statement.Table,
            Action:    "delete",
            CreatedAt: time.Now(),
        }

        if userID, ok := db.Statement.Context.Value("userID").(uint); ok {
            auditLog.UserID = userID
        }

        go db.Session(&gorm.Session{SkipHooks: true}).Create(&auditLog)
    })
}

func structToJSON(v interface{}) JSON {
    data, _ := json.Marshal(v)
    var result JSON
    json.Unmarshal(data, &result)
    return result
}
```

## Interview Points

### GORM Core Principles

**Q: How does GORM implement object-to-table mapping?**

GORM uses Go's reflection mechanism to parse struct field information, including field names, types, and tags. During initialization, GORM parses the model struct to generate Schema containing table name, column names, primary key, indexes, and other metadata. During queries, GORM builds SQL statements based on Schema information and maps results back to structs.

**Q: How is method chaining implemented in GORM?**

Each GORM method (like Where, Order, Limit) returns a new `*gorm.DB` instance. Each call clones the current instance and adds new conditions to the Statement. When the query finally executes, it builds complete SQL based on all accumulated conditions in the Statement.

### Transactions

**Q: What are the transaction usage methods in GORM? Which is recommended?**

GORM supports two transaction methods:

1. **Auto Transaction**: Use `db.Transaction()` method, recommended
2. **Manual Transaction**: Use `db.Begin()`, `tx.Commit()`, `tx.Rollback()`

Auto transaction is recommended because it automatically handles panic recovery and error rollback, making code safer and cleaner.

### Performance

**Q: How to avoid GORM's N+1 query problem?**

Use Preload or Joins to preload associated data:

```go
// Using Preload (two queries)
db.Preload("Posts").Find(&users)

// Using Joins (one query, suitable for one-to-one)
db.Joins("Profile").Find(&users)
```

**Q: How does GORM's default transaction affect performance? How to optimize?**

GORM enables transactions by default for create, update, delete operations. For single operations that don't need transactions, disable via config:

```go
db, _ := gorm.Open(mysql.Open(dsn), &gorm.Config{
    SkipDefaultTransaction: true,
})
```

Or for single operations:

```go
db.Session(&gorm.Session{SkipDefaultTransaction: true}).Create(&user)
```

### Soft Delete

**Q: What is the implementation principle of GORM soft delete?**

GORM implements soft delete by adding `gorm.DeletedAt` field to the model. Instead of actually deleting records, it sets `deleted_at` to current time. Queries automatically add `deleted_at IS NULL` condition. Use `Unscoped()` to query or manipulate soft-deleted records.

### Practical Problems

**Q: How to handle GORM update zero value issue?**

Three solutions:

1. Use `map[string]interface{}` instead of struct
2. Use `Select()` to explicitly specify fields to update
3. Use pointer types for fields

**Q: How to implement optimistic locking?**

```go
type Product struct {
    ID      uint
    Name    string
    Version int `gorm:"default:1"`
}

// Check version number on update
result := db.Model(&product).
    Where("id = ? AND version = ?", product.ID, product.Version).
    Updates(map[string]interface{}{
        "name":    product.Name,
        "version": gorm.Expr("version + 1"),
    })

if result.RowsAffected == 0 {
    return errors.New("concurrent conflict, please retry")
}
```

## Further Reading

### Official Resources

- [GORM Official Documentation](https://gorm.io/docs/)
- [GORM GitHub Repository](https://github.com/go-gorm/gorm)
- [GORM Playground](https://github.com/go-gorm/playground)

### Database Drivers

- [MySQL Driver](https://github.com/go-gorm/mysql)
- [PostgreSQL Driver](https://github.com/go-gorm/postgres)
- [SQLite Driver](https://github.com/go-gorm/sqlite)
- [SQL Server Driver](https://github.com/go-gorm/sqlserver)

### Plugins and Extensions

- [gorm-gen](https://github.com/go-gorm/gen) - Code generator
- [datatypes](https://github.com/go-gorm/datatypes) - Custom data types
- [dbresolver](https://github.com/go-gorm/dbresolver) - Read-write separation
- [sharding](https://github.com/go-gorm/sharding) - Sharding and partitioning

### Related Books and Tutorials

- "Advanced Go Programming" - Database chapter
- "Go Web Programming" - ORM related content

### Community Resources

- [GORM Community](https://gorm.io/)
- [Go Language Community](https://golang.org/)
