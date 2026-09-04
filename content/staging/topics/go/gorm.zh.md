---
title: GORM ORM 完全指南
description: 深入掌握Go语言最流行的ORM框架GORM，从模型定义到高级特性
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - GORM
  - ORM
  - 数据库
  - MySQL
  - PostgreSQL
status: imported
origin: old/src/content/docs/go/gorm.zh.md
divergence: 0.226
issues: []
legacy:
  category: Go
  subcategory: 数据访问
  order: 15
  lastUpdated: 2026-01-07
---

GORM 是 Go 语言中最流行、功能最丰富的 ORM（Object-Relational Mapping）框架。它提供了优雅的 API、强大的关联处理、自动迁移、钩子函数等特性，极大地简化了数据库操作。本文将全面介绍 GORM 的核心概念、使用方法和最佳实践。

## 概念解释

### 什么是 ORM

ORM（Object-Relational Mapping，对象关系映射）是一种编程技术，用于在面向对象编程语言和关系型数据库之间建立映射关系。通过 ORM，开发者可以使用面向对象的方式操作数据库，而无需编写大量的 SQL 语句。

### GORM 的定位

GORM 是 Go 语言生态中的"全功能 ORM"，其设计理念是：

- **开发者友好**：提供简洁、直观的 API
- **功能完备**：支持关联、事务、迁移、钩子等高级特性
- **可扩展性**：支持插件系统和自定义功能
- **数据库无关**：支持 MySQL、PostgreSQL、SQLite、SQL Server 等多种数据库

### GORM 的历史

GORM 由 Jinzhu 于 2013 年创建，是 Go 语言最早的 ORM 框架之一。2020 年发布了 GORM v2，进行了重大重构，引入了更好的性能、更清晰的 API 和更强大的功能。

## 核心原理

### 反射机制

GORM 底层大量使用 Go 的反射（reflect）包来实现对象与数据库表的映射：

```go
// GORM 内部使用反射解析模型结构
type Schema struct {
    ModelType      reflect.Type
    Table          string
    PrimaryFields  []*Field
    Fields         []*Field
    Relationships  map[string]*Relationship
}

// 字段信息
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

### 链式调用原理

GORM 的链式调用通过返回 `*gorm.DB` 实例实现，每次调用都会克隆一个新的 DB 实例：

```go
// 链式调用示例
db.Where("age > ?", 18).Order("name").Limit(10).Find(&users)

// 内部实现原理
func (db *DB) Where(query interface{}, args ...interface{}) *DB {
    tx := db.getInstance() // 克隆实例
    tx.Statement.AddClause(clause.Where{
        Exprs: []clause.Expression{clause.Expr{SQL: query, Vars: args}},
    })
    return tx
}
```

### SQL 构建器

GORM 使用内部的 SQL 构建器来生成 SQL 语句：

```go
// Statement 结构体存储查询信息
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

### 回调系统

GORM 的操作通过回调链实现，允许在操作的不同阶段插入自定义逻辑：

```go
// 回调注册
db.Callback().Create().Before("gorm:create").Register("my_plugin", func(db *gorm.DB) {
    // 在创建之前执行
})

// 默认回调链
// Create: BeforeCreate -> Create -> AfterCreate
// Query:  Query
// Update: BeforeUpdate -> Update -> AfterUpdate
// Delete: BeforeDelete -> Delete -> AfterDelete
```

## 核心要点

### 安装与配置

```bash
# 安装 GORM v2
go get -u gorm.io/gorm

# 安装数据库驱动
go get -u gorm.io/driver/mysql     # MySQL
go get -u gorm.io/driver/postgres  # PostgreSQL
go get -u gorm.io/driver/sqlite    # SQLite
go get -u gorm.io/driver/sqlserver # SQL Server
```

### 连接数据库

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

// MySQL 连接
func connectMySQL() (*gorm.DB, error) {
    dsn := "user:password@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
    return gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
}

// PostgreSQL 连接
func connectPostgreSQL() (*gorm.DB, error) {
    dsn := "host=localhost user=postgres password=secret dbname=mydb port=5432 sslmode=disable"
    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

// SQLite 连接
func connectSQLite() (*gorm.DB, error) {
    return gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
}

// 配置连接池
func configureConnectionPool(db *gorm.DB) error {
    sqlDB, err := db.DB()
    if err != nil {
        return err
    }

    // 设置最大空闲连接数
    sqlDB.SetMaxIdleConns(10)
    // 设置最大打开连接数
    sqlDB.SetMaxOpenConns(100)
    // 设置连接最大生存时间
    sqlDB.SetConnMaxLifetime(time.Hour)
    // 设置连接最大空闲时间
    sqlDB.SetConnMaxIdleTime(10 * time.Minute)

    return nil
}
```

### GORM 配置选项

```go
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
    // 跳过默认事务（提高性能）
    SkipDefaultTransaction: true,

    // 命名策略
    NamingStrategy: schema.NamingStrategy{
        TablePrefix:   "t_",      // 表前缀
        SingularTable: true,      // 使用单数表名
        NoLowerCase:   false,     // 不使用小写
    },

    // 禁用外键约束
    DisableForeignKeyConstraintWhenMigrating: true,

    // 日志配置
    Logger: logger.New(
        log.New(os.Stdout, "\r\n", log.LstdFlags),
        logger.Config{
            SlowThreshold:             time.Second,   // 慢查询阈值
            LogLevel:                  logger.Info,   // 日志级别
            IgnoreRecordNotFoundError: true,          // 忽略记录不存在错误
            Colorful:                  true,          // 彩色输出
        },
    ),

    // 时间配置
    NowFunc: func() time.Time {
        return time.Now().Local()
    },

    // 预编译语句缓存
    PrepareStmt: true,
})
```

## 代码示例

### 模型定义

GORM 使用结构体来定义数据库模型，通过标签（tag）来配置字段属性：

```go
package models

import (
    "time"

    "gorm.io/gorm"
)

// 基础模型（GORM 内置）
// gorm.Model 包含 ID, CreatedAt, UpdatedAt, DeletedAt 字段

// User 用户模型
type User struct {
    ID        uint           `gorm:"primaryKey;autoIncrement"`
    CreatedAt time.Time      `gorm:"autoCreateTime"`
    UpdatedAt time.Time      `gorm:"autoUpdateTime"`
    DeletedAt gorm.DeletedAt `gorm:"index"` // 软删除

    // 基本字段
    Username string `gorm:"type:varchar(50);uniqueIndex;not null;comment:用户名"`
    Email    string `gorm:"type:varchar(100);uniqueIndex;not null"`
    Password string `gorm:"type:varchar(255);not null"`
    Age      int    `gorm:"default:0;check:age >= 0"`
    Active   bool   `gorm:"default:true"`

    // 可空字段
    Phone    *string    `gorm:"type:varchar(20)"`
    Birthday *time.Time

    // JSON 字段
    Settings JSON `gorm:"type:json"`

    // 忽略字段
    TempData string `gorm:"-"`              // 完全忽略
    ReadOnly string `gorm:"->;default:ro"`  // 只读
    WriteOnly string `gorm:"->:false;<-"`   // 只写

    // 关联字段
    Profile   *Profile  `gorm:"foreignKey:UserID"`
    Posts     []Post    `gorm:"foreignKey:AuthorID"`
    Roles     []Role    `gorm:"many2many:user_roles"`
    Followers []User    `gorm:"many2many:user_follows;joinForeignKey:user_id;joinReferences:follower_id"`
}

// TableName 自定义表名
func (User) TableName() string {
    return "users"
}

// Profile 用户资料（一对一）
type Profile struct {
    ID        uint   `gorm:"primaryKey"`
    UserID    uint   `gorm:"uniqueIndex"`
    Bio       string `gorm:"type:text"`
    Avatar    string `gorm:"type:varchar(255)"`
    Location  string `gorm:"type:varchar(100)"`
    Website   string `gorm:"type:varchar(255)"`
}

// Post 文章模型（一对多）
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

// Tag 标签模型（多对多）
type Tag struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"type:varchar(50);uniqueIndex"`
    Posts []Post `gorm:"many2many:post_tags"`
}

// Comment 评论模型
type Comment struct {
    ID        uint      `gorm:"primaryKey"`
    CreatedAt time.Time
    PostID    uint      `gorm:"index"`
    UserID    uint      `gorm:"index"`
    Content   string    `gorm:"type:text;not null"`
    ParentID  *uint     `gorm:"index"` // 父评论ID，支持嵌套评论

    Post     *Post      `gorm:"foreignKey:PostID"`
    User     *User      `gorm:"foreignKey:UserID"`
    Parent   *Comment   `gorm:"foreignKey:ParentID"`
    Children []Comment  `gorm:"foreignKey:ParentID"`
}

// Role 角色模型
type Role struct {
    ID          uint   `gorm:"primaryKey"`
    Name        string `gorm:"type:varchar(50);uniqueIndex"`
    Description string `gorm:"type:varchar(255)"`
    Users       []User `gorm:"many2many:user_roles"`
}

// JSON 自定义类型
type JSON map[string]interface{}

// Scan 实现 sql.Scanner 接口
func (j *JSON) Scan(value interface{}) error {
    bytes, ok := value.([]byte)
    if !ok {
        return errors.New("类型断言失败")
    }
    return json.Unmarshal(bytes, j)
}

// Value 实现 driver.Valuer 接口
func (j JSON) Value() (driver.Value, error) {
    if j == nil {
        return nil, nil
    }
    return json.Marshal(j)
}
```

### GORM 标签详解

```go
// 常用标签
type Example struct {
    // 主键
    ID uint `gorm:"primaryKey"`

    // 列名
    Name string `gorm:"column:user_name"`

    // 类型
    Content string `gorm:"type:text"`

    // 大小（针对 string 类型）
    Title string `gorm:"size:255"`

    // 精度（针对数值类型）
    Price float64 `gorm:"precision:10;scale:2"`

    // 非空
    Email string `gorm:"not null"`

    // 唯一
    Code string `gorm:"unique"`

    // 默认值
    Status int `gorm:"default:1"`

    // 索引
    Age int `gorm:"index"`

    // 复合索引
    Field1 string `gorm:"index:idx_name,priority:1"`
    Field2 string `gorm:"index:idx_name,priority:2"`

    // 唯一索引
    Phone string `gorm:"uniqueIndex"`

    // 自增
    Seq uint `gorm:"autoIncrement"`

    // 嵌入结构体
    Address Address `gorm:"embedded;embeddedPrefix:addr_"`

    // 序列化器
    Data []string `gorm:"serializer:json"`

    // 检查约束
    Age int `gorm:"check:age >= 18"`

    // 注释
    Desc string `gorm:"comment:描述信息"`
}

// Address 嵌入结构体
type Address struct {
    Province string
    City     string
    Street   string
}
```

### CRUD 操作

#### 创建操作

```go
// 创建单条记录
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

// 批量创建
func CreateUsers(db *gorm.DB) {
    users := []User{
        {Username: "bob", Email: "bob@example.com", Age: 28},
        {Username: "charlie", Email: "charlie@example.com", Age: 30},
        {Username: "david", Email: "david@example.com", Age: 22},
    }

    // 批量插入
    result := db.Create(&users)
    fmt.Printf("Created %d users\n", result.RowsAffected)

    // 分批插入（每批100条）
    db.CreateInBatches(&users, 100)
}

// 选择性创建
func CreateWithSelect(db *gorm.DB) {
    user := User{
        Username: "eve",
        Email:    "eve@example.com",
        Age:      25,
        Active:   false, // 不会被插入
    }

    // 只插入指定字段
    db.Select("Username", "Email").Create(&user)

    // 忽略指定字段
    db.Omit("Age", "Active").Create(&user)
}

// 使用 Map 创建
func CreateWithMap(db *gorm.DB) {
    db.Model(&User{}).Create(map[string]interface{}{
        "Username": "frank",
        "Email":    "frank@example.com",
        "Age":      32,
    })
}

// 创建或更新（Upsert）
func Upsert(db *gorm.DB) {
    user := User{
        Username: "grace",
        Email:    "grace@example.com",
        Age:      28,
    }

    // 冲突时更新
    db.Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "email"}},
        DoUpdates: clause.AssignmentColumns([]string{"username", "age"}),
    }).Create(&user)
}
```

#### 查询操作

```go
// 基础查询
func QueryBasics(db *gorm.DB) {
    var user User
    var users []User

    // 根据主键查询
    db.First(&user, 1)                    // SELECT * FROM users WHERE id = 1 ORDER BY id LIMIT 1
    db.First(&user, "id = ?", 1)          // 同上，使用条件
    db.First(&user, []int{1, 2, 3})       // IN 查询

    // 查询第一条/最后一条
    db.First(&user)                       // ORDER BY id LIMIT 1
    db.Last(&user)                        // ORDER BY id DESC LIMIT 1
    db.Take(&user)                        // LIMIT 1（无排序）

    // 查询所有
    db.Find(&users)

    // 检查是否找到记录
    result := db.First(&user, 100)
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        fmt.Println("记录不存在")
    }
}

// 条件查询
func QueryWithConditions(db *gorm.DB) {
    var users []User

    // Where 条件
    db.Where("age > ?", 18).Find(&users)
    db.Where("name = ? AND age >= ?", "alice", 18).Find(&users)
    db.Where("name IN ?", []string{"alice", "bob"}).Find(&users)
    db.Where("name LIKE ?", "%ali%").Find(&users)
    db.Where("age BETWEEN ? AND ?", 20, 30).Find(&users)
    db.Where("created_at > ?", time.Now().AddDate(0, 0, -7)).Find(&users)

    // 使用结构体条件（零值会被忽略）
    db.Where(&User{Username: "alice", Age: 25}).Find(&users)

    // 使用 Map 条件（零值不会被忽略）
    db.Where(map[string]interface{}{"username": "alice", "age": 0}).Find(&users)

    // Or 条件
    db.Where("age > ?", 30).Or("active = ?", true).Find(&users)

    // Not 条件
    db.Not("name = ?", "admin").Find(&users)

    // 内联条件
    db.Find(&users, "age > ? AND active = ?", 18, true)
}

// 高级查询
func AdvancedQuery(db *gorm.DB) {
    var users []User
    var user User

    // 选择字段
    db.Select("id", "username", "email").Find(&users)
    db.Select("id", "username as name").Find(&users)

    // 排序
    db.Order("age desc, username").Find(&users)
    db.Order("age desc").Order("username").Find(&users)

    // 分页
    page, pageSize := 1, 10
    offset := (page - 1) * pageSize
    db.Offset(offset).Limit(pageSize).Find(&users)

    // 分组与聚合
    type Result struct {
        Age   int
        Count int
    }
    var results []Result
    db.Model(&User{}).Select("age, count(*) as count").Group("age").Having("count > ?", 1).Find(&results)

    // Distinct
    db.Distinct("age").Find(&users)

    // 原生 SQL
    db.Raw("SELECT * FROM users WHERE age > ?", 18).Scan(&users)

    // 子查询
    subQuery := db.Model(&User{}).Select("avg(age)")
    db.Where("age > (?)", subQuery).Find(&users)

    // 锁
    db.Clauses(clause.Locking{Strength: "UPDATE"}).Find(&users)  // FOR UPDATE
    db.Clauses(clause.Locking{Strength: "SHARE"}).Find(&users)   // FOR SHARE

    // FirstOrInit（找不到则初始化）
    db.Where(User{Username: "new_user"}).Attrs(User{Age: 20}).FirstOrInit(&user)

    // FirstOrCreate（找不到则创建）
    db.Where(User{Username: "new_user"}).Attrs(User{Age: 20}).FirstOrCreate(&user)
}

// 统计查询
func AggregateQuery(db *gorm.DB) {
    var count int64
    var totalAge int64
    var avgAge float64

    // 计数
    db.Model(&User{}).Count(&count)
    db.Model(&User{}).Where("active = ?", true).Count(&count)

    // 求和
    db.Model(&User{}).Select("sum(age)").Scan(&totalAge)

    // 平均值
    db.Model(&User{}).Select("avg(age)").Scan(&avgAge)

    // Pluck（获取单列值）
    var ages []int
    db.Model(&User{}).Pluck("age", &ages)

    var usernames []string
    db.Model(&User{}).Pluck("username", &usernames)
}

// Scan 到自定义结构体
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

#### 更新操作

```go
// 基础更新
func UpdateBasics(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 更新单个字段
    db.Model(&user).Update("age", 30)

    // 更新多个字段（结构体，零值不更新）
    db.Model(&user).Updates(User{Username: "new_name", Age: 30})

    // 更新多个字段（Map，零值会更新）
    db.Model(&user).Updates(map[string]interface{}{
        "username": "new_name",
        "age":      0,
        "active":   false,
    })

    // 选择性更新
    db.Model(&user).Select("username", "age").Updates(User{Username: "select_update", Age: 25})

    // 忽略字段
    db.Model(&user).Omit("age").Updates(User{Username: "omit_update", Age: 999})
}

// 条件更新
func ConditionalUpdate(db *gorm.DB) {
    // 批量更新
    db.Model(&User{}).Where("age < ?", 18).Update("active", false)

    // 使用表达式
    db.Model(&User{}).Update("age", gorm.Expr("age + ?", 1))

    // 使用子查询
    db.Model(&User{}).Update("age", db.Model(&User{}).Select("avg(age)"))
}

// 更新钩子
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if u.Age < 0 {
        return errors.New("年龄不能为负数")
    }
    return nil
}

// 跳过钩子更新
func UpdateWithoutHooks(db *gorm.DB) {
    db.Model(&User{}).Where("id = ?", 1).UpdateColumn("age", 30)
    db.Model(&User{}).Where("id = ?", 1).UpdateColumns(map[string]interface{}{"age": 30})
}

// 保存（更新所有字段）
func SaveUser(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    user.Username = "updated_name"
    user.Age = 35
    db.Save(&user) // 更新所有字段，包括零值
}
```

#### 删除操作

```go
// 基础删除
func DeleteBasics(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 删除记录（如果有 DeletedAt 字段则软删除）
    db.Delete(&user)

    // 根据主键删除
    db.Delete(&User{}, 1)
    db.Delete(&User{}, []int{1, 2, 3})

    // 条件删除
    db.Where("age < ?", 18).Delete(&User{})
    db.Delete(&User{}, "email LIKE ?", "%test%")
}

// 软删除
func SoftDelete(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 软删除（设置 deleted_at 字段）
    db.Delete(&user)

    // 查询时自动排除软删除记录
    var users []User
    db.Find(&users) // 不包含已软删除的记录

    // 查询包含软删除的记录
    db.Unscoped().Find(&users)

    // 查询只有软删除的记录
    db.Unscoped().Where("deleted_at IS NOT NULL").Find(&users)
}

// 永久删除
func HardDelete(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 永久删除（跳过软删除）
    db.Unscoped().Delete(&user)
}

// 删除钩子
func (u *User) BeforeDelete(tx *gorm.DB) error {
    // 检查是否可以删除
    if u.Username == "admin" {
        return errors.New("不能删除管理员账户")
    }
    return nil
}
```

### 关联操作

```go
// 预加载关联
func PreloadAssociations(db *gorm.DB) {
    var user User
    var users []User

    // 预加载单个关联
    db.Preload("Profile").First(&user, 1)

    // 预加载多个关联
    db.Preload("Profile").Preload("Posts").Preload("Roles").First(&user, 1)

    // 嵌套预加载
    db.Preload("Posts.Comments").Preload("Posts.Tags").First(&user, 1)

    // 条件预加载
    db.Preload("Posts", "published = ?", true).Find(&users)

    // 自定义预加载
    db.Preload("Posts", func(db *gorm.DB) *gorm.DB {
        return db.Where("published = ?", true).Order("created_at DESC").Limit(5)
    }).Find(&users)

    // Preload All（预加载所有关联）
    db.Preload(clause.Associations).Find(&users)

    // 嵌套条件预加载
    db.Preload("Posts.Comments", func(db *gorm.DB) *gorm.DB {
        return db.Order("comments.created_at DESC")
    }).Find(&users)
}

// Joins 预加载（内连接，更高效但只能用于一对一）
func JoinsPreload(db *gorm.DB) {
    var users []User

    // 使用 Joins 预加载
    db.Joins("Profile").Find(&users)

    // 带条件的 Joins
    db.Joins("Profile", db.Where(&Profile{Location: "Beijing"})).Find(&users)
}

// 关联操作 - Association 方法
func AssociationMethods(db *gorm.DB) {
    var user User
    db.First(&user, 1)

    // 获取关联
    var posts []Post
    db.Model(&user).Association("Posts").Find(&posts)

    // 添加关联
    db.Model(&user).Association("Posts").Append(&Post{Title: "New Post"})

    // 替换关联
    db.Model(&user).Association("Posts").Replace(&Post{Title: "Replaced Post"})

    // 删除关联
    db.Model(&user).Association("Posts").Delete(&posts[0])

    // 清除关联
    db.Model(&user).Association("Posts").Clear()

    // 计数
    count := db.Model(&user).Association("Posts").Count()
    fmt.Printf("User has %d posts\n", count)
}

// 多对多操作
func ManyToManyOperations(db *gorm.DB) {
    var user User
    var role Role
    db.First(&user, 1)
    db.First(&role, 1)

    // 添加角色
    db.Model(&user).Association("Roles").Append(&role)

    // 添加多个角色
    roles := []Role{{Name: "admin"}, {Name: "editor"}}
    db.Model(&user).Association("Roles").Append(&roles)

    // 删除角色
    db.Model(&user).Association("Roles").Delete(&role)

    // 替换所有角色
    newRoles := []Role{{Name: "viewer"}}
    db.Model(&user).Association("Roles").Replace(&newRoles)
}

// 创建带关联的记录
func CreateWithAssociations(db *gorm.DB) {
    // 创建用户及其资料
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

// 跳过关联创建
func SkipAssociations(db *gorm.DB) {
    user := User{
        Username: "jane",
        Email:    "jane@example.com",
        Profile:  &Profile{Bio: "Skip this"},
    }

    // 跳过所有关联
    db.Omit(clause.Associations).Create(&user)

    // 跳过特定关联
    db.Omit("Profile").Create(&user)
}
```

### 钩子函数

```go
// 模型钩子示例
type User struct {
    ID           uint
    Username     string
    Email        string
    PasswordHash string
    Password     string `gorm:"-"` // 不存储到数据库
    CreatedAt    time.Time
    UpdatedAt    time.Time
}

// BeforeSave 在创建和更新之前都会调用
func (u *User) BeforeSave(tx *gorm.DB) error {
    // 验证数据
    if u.Username == "" {
        return errors.New("用户名不能为空")
    }
    return nil
}

// BeforeCreate 创建之前
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // 密码加密
    if u.Password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
        if err != nil {
            return err
        }
        u.PasswordHash = string(hash)
        u.Password = "" // 清除明文密码
    }

    // 设置默认值
    if u.CreatedAt.IsZero() {
        u.CreatedAt = time.Now()
    }

    return nil
}

// AfterCreate 创建之后
func (u *User) AfterCreate(tx *gorm.DB) error {
    // 发送欢迎邮件
    go sendWelcomeEmail(u.Email)

    // 记录审计日志
    tx.Create(&AuditLog{
        Action:    "create",
        TableName: "users",
        RecordID:  u.ID,
        CreatedAt: time.Now(),
    })

    return nil
}

// BeforeUpdate 更新之前
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    // 如果密码被修改，重新加密
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

// AfterUpdate 更新之后
func (u *User) AfterUpdate(tx *gorm.DB) error {
    // 清除缓存
    cache.Delete(fmt.Sprintf("user:%d", u.ID))
    return nil
}

// BeforeDelete 删除之前
func (u *User) BeforeDelete(tx *gorm.DB) error {
    // 检查是否有关联数据
    var postCount int64
    tx.Model(&Post{}).Where("author_id = ?", u.ID).Count(&postCount)
    if postCount > 0 {
        return errors.New("用户还有文章，无法删除")
    }
    return nil
}

// AfterDelete 删除之后
func (u *User) AfterDelete(tx *gorm.DB) error {
    // 清理关联数据
    tx.Where("user_id = ?", u.ID).Delete(&Profile{})
    return nil
}

// AfterFind 查询之后
func (u *User) AfterFind(tx *gorm.DB) error {
    // 脱敏处理
    if u.Email != "" {
        parts := strings.Split(u.Email, "@")
        if len(parts) == 2 {
            u.Email = parts[0][:1] + "***@" + parts[1]
        }
    }
    return nil
}

// 审计日志模型
type AuditLog struct {
    ID        uint
    Action    string
    TableName string
    RecordID  uint
    UserID    uint
    CreatedAt time.Time
}
```

### 事务处理

```go
// 自动事务
func AutoTransaction(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // 创建用户
        user := User{Username: "alice", Email: "alice@example.com"}
        if err := tx.Create(&user).Error; err != nil {
            return err // 返回错误会自动回滚
        }

        // 创建资料
        profile := Profile{UserID: user.ID, Bio: "Hello"}
        if err := tx.Create(&profile).Error; err != nil {
            return err
        }

        // 返回 nil 提交事务
        return nil
    })
}

// 手动事务
func ManualTransaction(db *gorm.DB) error {
    // 开始事务
    tx := db.Begin()
    if tx.Error != nil {
        return tx.Error
    }

    // 使用 defer 确保异常时回滚
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
            panic(r)
        }
    }()

    // 执行操作
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

    // 提交事务
    return tx.Commit().Error
}

// 嵌套事务（保存点）
func NestedTransaction(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // 外部事务操作
        tx.Create(&User{Username: "user1", Email: "user1@example.com"})

        // 嵌套事务（使用保存点）
        err := tx.Transaction(func(tx2 *gorm.DB) error {
            tx2.Create(&User{Username: "user2", Email: "user2@example.com"})
            return errors.New("模拟错误，回滚嵌套事务")
        })

        if err != nil {
            // 嵌套事务失败，但外部事务可以继续
            log.Printf("嵌套事务失败: %v", err)
        }

        // 继续外部事务
        tx.Create(&User{Username: "user3", Email: "user3@example.com"})

        return nil // user1 和 user3 会被保存
    })
}

// 指定事务选项
func TransactionWithOptions(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // 事务操作
        return nil
    }, &sql.TxOptions{
        Isolation: sql.LevelSerializable, // 隔离级别
        ReadOnly:  false,
    })
}

// 事务辅助函数
type TxFunc func(tx *gorm.DB) error

func WithTransaction(db *gorm.DB, fn TxFunc) error {
    return db.Transaction(fn)
}

// 使用示例
func TransferMoney(db *gorm.DB, fromID, toID uint, amount float64) error {
    return WithTransaction(db, func(tx *gorm.DB) error {
        // 扣除转出账户
        result := tx.Model(&Account{}).
            Where("id = ? AND balance >= ?", fromID, amount).
            Update("balance", gorm.Expr("balance - ?", amount))

        if result.RowsAffected == 0 {
            return errors.New("余额不足")
        }

        // 增加转入账户
        if err := tx.Model(&Account{}).
            Where("id = ?", toID).
            Update("balance", gorm.Expr("balance + ?", amount)).Error; err != nil {
            return err
        }

        // 记录转账记录
        return tx.Create(&Transfer{
            FromID:  fromID,
            ToID:    toID,
            Amount:  amount,
        }).Error
    })
}
```

### 数据库迁移

```go
// 自动迁移
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

// 检查表是否存在
func TableExists(db *gorm.DB) {
    hasTable := db.Migrator().HasTable(&User{})
    fmt.Printf("users 表存在: %v\n", hasTable)

    hasTable = db.Migrator().HasTable("posts")
    fmt.Printf("posts 表存在: %v\n", hasTable)
}

// 手动迁移操作
func ManualMigration(db *gorm.DB) {
    migrator := db.Migrator()

    // 创建表
    migrator.CreateTable(&User{})

    // 删除表
    migrator.DropTable(&User{})
    migrator.DropTable("users")

    // 重命名表
    migrator.RenameTable(&User{}, &UserNew{})
    migrator.RenameTable("users", "users_new")
}

// 列操作
func ColumnOperations(db *gorm.DB) {
    migrator := db.Migrator()

    // 检查列是否存在
    hasColumn := migrator.HasColumn(&User{}, "Age")
    fmt.Printf("Age 列存在: %v\n", hasColumn)

    // 添加列
    migrator.AddColumn(&User{}, "Phone")

    // 删除列
    migrator.DropColumn(&User{}, "TempField")

    // 修改列
    migrator.AlterColumn(&User{}, "Username")

    // 重命名列
    migrator.RenameColumn(&User{}, "old_name", "new_name")
}

// 索引操作
func IndexOperations(db *gorm.DB) {
    migrator := db.Migrator()

    // 检查索引是否存在
    hasIndex := migrator.HasIndex(&User{}, "idx_users_email")
    fmt.Printf("索引存在: %v\n", hasIndex)

    // 创建索引
    migrator.CreateIndex(&User{}, "idx_users_email")

    // 删除索引
    migrator.DropIndex(&User{}, "idx_users_email")

    // 重命名索引
    migrator.RenameIndex(&User{}, "old_index", "new_index")
}

// 约束操作
func ConstraintOperations(db *gorm.DB) {
    migrator := db.Migrator()

    // 检查约束是否存在
    hasConstraint := migrator.HasConstraint(&User{}, "fk_users_profile")

    // 创建约束
    migrator.CreateConstraint(&User{}, "Profile")

    // 删除约束
    migrator.DropConstraint(&User{}, "fk_users_profile")
}

// 获取表信息
func GetTableInfo(db *gorm.DB) {
    migrator := db.Migrator()

    // 获取所有表
    tables, _ := migrator.GetTables()
    fmt.Printf("所有表: %v\n", tables)

    // 获取列信息
    columns, _ := migrator.ColumnTypes(&User{})
    for _, column := range columns {
        name := column.Name()
        dataType, _ := column.ColumnType()
        nullable, _ := column.Nullable()
        fmt.Printf("列: %s, 类型: %s, 可空: %v\n", name, dataType, nullable)
    }

    // 获取索引信息
    indexes, _ := migrator.GetIndexes(&User{})
    for _, index := range indexes {
        fmt.Printf("索引: %s, 列: %v\n", index.Name(), index.Columns())
    }
}
```

## 最佳实践

### Repository 模式

```go
// Repository 接口定义
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id uint) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id uint) error
    List(ctx context.Context, filter UserFilter) ([]User, int64, error)
}

// 查询过滤器
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

// Repository 实现
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

    // 应用过滤条件
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

    // 计数
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // 排序
    if filter.OrderBy != "" {
        query = query.Order(filter.OrderBy)
    } else {
        query = query.Order("id DESC")
    }

    // 分页
    if filter.PageSize <= 0 {
        filter.PageSize = 10
    }
    if filter.Page <= 0 {
        filter.Page = 1
    }
    offset := (filter.Page - 1) * filter.PageSize
    query = query.Offset(offset).Limit(filter.PageSize)

    // 预加载关联
    query = query.Preload("Profile")

    err := query.Find(&users).Error
    return users, total, err
}
```

### 作用域（Scopes）

```go
// 通用作用域
func Active(db *gorm.DB) *gorm.DB {
    return db.Where("active = ?", true)
}

func Published(db *gorm.DB) *gorm.DB {
    return db.Where("published = ?", true)
}

func NotDeleted(db *gorm.DB) *gorm.DB {
    return db.Where("deleted_at IS NULL")
}

// 带参数的作用域
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

// 分页作用域
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

// 搜索作用域
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

// 使用作用域
func UseScopesExample(db *gorm.DB) {
    var users []User

    // 单个作用域
    db.Scopes(Active).Find(&users)

    // 多个作用域
    db.Scopes(Active, AgeRange(18, 30), OrderByLatest).Find(&users)

    // 组合使用
    db.Scopes(
        Active,
        AgeRange(20, 40),
        Paginate(1, 10),
        Search("john", "username", "email"),
    ).Find(&users)

    // 动态作用域
    scopes := []func(*gorm.DB) *gorm.DB{Active}
    if wantYoung {
        scopes = append(scopes, AgeRange(18, 25))
    }
    db.Scopes(scopes...).Find(&users)
}
```

### 泛型 Repository

```go
// 泛型 Repository（Go 1.18+）
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

// 使用泛型 Repository
func UseGenericRepository(db *gorm.DB) {
    userRepo := NewBaseRepository[User](db)
    postRepo := NewBaseRepository[Post](db)

    ctx := context.Background()

    // 创建用户
    user := &User{Username: "test", Email: "test@example.com"}
    userRepo.Create(ctx, user)

    // 获取用户
    user, _ = userRepo.GetByID(ctx, 1)

    // 创建文章
    post := &Post{Title: "Test Post", AuthorID: user.ID}
    postRepo.Create(ctx, post)
}
```

## 常见陷阱

### N+1 查询问题

```go
// 错误示例 - N+1 查询
func BadExample(db *gorm.DB) {
    var users []User
    db.Find(&users)

    for _, user := range users {
        var profile Profile
        db.Where("user_id = ?", user.ID).First(&profile) // 每个用户都会执行一次查询
        fmt.Println(user.Username, profile.Bio)
    }
}

// 正确示例 - 使用 Preload
func GoodExample(db *gorm.DB) {
    var users []User
    db.Preload("Profile").Find(&users) // 只执行两次查询

    for _, user := range users {
        if user.Profile != nil {
            fmt.Println(user.Username, user.Profile.Bio)
        }
    }
}

// 正确示例 - 使用 Joins（适用于一对一）
func BetterExample(db *gorm.DB) {
    var users []User
    db.Joins("Profile").Find(&users) // 只执行一次查询（JOIN）

    for _, user := range users {
        if user.Profile != nil {
            fmt.Println(user.Username, user.Profile.Bio)
        }
    }
}
```

### 零值更新问题

```go
// 问题：零值不会被更新
func ZeroValueProblem(db *gorm.DB) {
    user := User{ID: 1, Username: "new_name", Age: 0, Active: false}

    // Age 和 Active 不会被更新，因为它们是零值
    db.Model(&user).Updates(user)
}

// 解决方案1：使用 Map
func SolutionWithMap(db *gorm.DB) {
    db.Model(&User{ID: 1}).Updates(map[string]interface{}{
        "username": "new_name",
        "age":      0,
        "active":   false,
    })
}

// 解决方案2：使用 Select 指定字段
func SolutionWithSelect(db *gorm.DB) {
    user := User{ID: 1, Username: "new_name", Age: 0, Active: false}
    db.Model(&user).Select("username", "age", "active").Updates(user)
}

// 解决方案3：使用指针类型
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

### 事务陷阱

```go
// 错误示例 - 事务未正确处理
func BadTransaction(db *gorm.DB) error {
    tx := db.Begin()

    // 忘记检查 Begin 是否成功
    tx.Create(&User{Username: "test"})

    // 忘记回滚
    if err := tx.Create(&Profile{}).Error; err != nil {
        return err // 事务悬空
    }

    return tx.Commit().Error
}

// 正确示例
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

// 最佳方案 - 使用 Transaction 方法
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

### 并发安全问题

```go
// 错误示例 - 共享 DB 实例的状态
func ConcurrencyProblem(db *gorm.DB) {
    // 这会影响所有后续查询
    db = db.Where("active = ?", true)

    // 并发请求会共享这个条件
    go func() { db.Find(&users1) }()
    go func() { db.Find(&users2) }()
}

// 正确示例 - 每次查询使用新的会话
func ConcurrencySafe(db *gorm.DB) {
    // 使用 Session 创建新会话
    go func() {
        db.Session(&gorm.Session{}).Where("active = ?", true).Find(&users1)
    }()

    go func() {
        db.Session(&gorm.Session{}).Where("active = ?", false).Find(&users2)
    }()
}

// 或者使用 WithContext
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

### 内存泄漏

```go
// 错误示例 - Rows 未关闭
func MemoryLeak(db *gorm.DB) {
    rows, _ := db.Model(&User{}).Rows()
    // 忘记关闭 rows
    for rows.Next() {
        // ...
    }
}

// 正确示例
func NoMemoryLeak(db *gorm.DB) {
    rows, err := db.Model(&User{}).Rows()
    if err != nil {
        return
    }
    defer rows.Close() // 确保关闭

    for rows.Next() {
        var user User
        db.ScanRows(rows, &user)
        // ...
    }
}
```

## 性能考量

### 连接池配置

```go
func OptimizeConnectionPool(db *gorm.DB) {
    sqlDB, err := db.DB()
    if err != nil {
        log.Fatal(err)
    }

    // 根据应用类型调整
    // Web 应用（高并发，短连接）
    sqlDB.SetMaxOpenConns(100)    // 最大打开连接
    sqlDB.SetMaxIdleConns(25)     // 最大空闲连接
    sqlDB.SetConnMaxLifetime(5 * time.Minute)
    sqlDB.SetConnMaxIdleTime(2 * time.Minute)

    // 后台任务（低并发，长连接）
    // sqlDB.SetMaxOpenConns(10)
    // sqlDB.SetMaxIdleConns(5)
    // sqlDB.SetConnMaxLifetime(30 * time.Minute)
}

// 监控连接池状态
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

### 查询优化

```go
// 1. 只查询需要的字段
func SelectOptimization(db *gorm.DB) {
    var users []User

    // 不推荐
    db.Find(&users)

    // 推荐
    db.Select("id", "username", "email").Find(&users)

    // 或使用专门的 DTO
    type UserDTO struct {
        ID       uint
        Username string
        Email    string
    }
    var dtos []UserDTO
    db.Model(&User{}).Select("id", "username", "email").Scan(&dtos)
}

// 2. 合理使用索引
func IndexOptimization(db *gorm.DB) {
    // 确保查询条件字段有索引
    db.Where("email = ?", "test@example.com").First(&user) // email 应该有索引

    // 复合索引要注意顺序
    db.Where("status = ? AND created_at > ?", 1, time.Now().AddDate(0, 0, -7)).Find(&users)
}

// 3. 批量操作
func BatchOptimization(db *gorm.DB) {
    // 批量插入
    users := make([]User, 1000)
    db.CreateInBatches(users, 100) // 每批 100 条

    // 批量更新
    db.Model(&User{}).Where("status = ?", 0).Updates(map[string]interface{}{"status": 1})
}

// 4. 使用原生 SQL
func RawSQLOptimization(db *gorm.DB) {
    // 复杂查询使用原生 SQL
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

// 5. 预编译语句
func PreparedStatementOptimization(db *gorm.DB) {
    // 开启预编译语句缓存
    db, _ = gorm.Open(mysql.Open(dsn), &gorm.Config{
        PrepareStmt: true,
    })

    // 后续相同结构的查询会复用预编译语句
    db.Where("age > ?", 18).Find(&users)
    db.Where("age > ?", 25).Find(&users)
}

// 6. 避免 SELECT *
func AvoidSelectAll(db *gorm.DB) {
    // 使用 Pluck 获取单列
    var emails []string
    db.Model(&User{}).Pluck("email", &emails)

    // 使用 Scan 获取部分字段
    type Result struct {
        Username string
        Count    int
    }
    var results []Result
    db.Model(&User{}).Select("username, count(*) as count").Group("username").Scan(&results)
}
```

### 大数据量处理

```go
// 分批处理大量数据
func BatchProcess(db *gorm.DB) {
    var users []User

    // 使用 FindInBatches 分批查询
    db.Where("active = ?", true).FindInBatches(&users, 100, func(tx *gorm.DB, batch int) error {
        for _, user := range users {
            // 处理每个用户
            processUser(user)
        }
        return nil
    })
}

// 使用游标处理
func CursorProcess(db *gorm.DB) {
    rows, _ := db.Model(&User{}).Where("active = ?", true).Rows()
    defer rows.Close()

    for rows.Next() {
        var user User
        db.ScanRows(rows, &user)
        processUser(user)
    }
}

// 流式查询
func StreamProcess(db *gorm.DB) {
    // 使用 Iterator
    var user User
    rows, _ := db.Model(&User{}).Where("active = ?", true).Rows()
    defer rows.Close()

    for rows.Next() {
        db.ScanRows(rows, &user)
        // 立即处理，不占用大量内存
        processUser(user)
    }
}
```

## 实战场景

### RESTful API 实现

```go
// handler/user_handler.go
type UserHandler struct {
    userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

// 获取用户列表
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

// 获取单个用户
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

// 创建用户
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

// 更新用户
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

// 删除用户
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

### 多租户实现

```go
// 基于 Schema 的多租户
type TenantModel struct {
    ID        uint `gorm:"primaryKey"`
    TenantID  uint `gorm:"index"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// 租户作用域
func WithTenant(tenantID uint) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("tenant_id = ?", tenantID)
    }
}

// 租户中间件
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

        // 创建带租户上下文的 DB
        tenantDB := db.Scopes(WithTenant(uint(tid)))
        c.Set("db", tenantDB)
        c.Set("tenantID", uint(tid))

        c.Next()
    }
}

// 在 Handler 中使用
func (h *UserHandler) List(c *gin.Context) {
    db := c.MustGet("db").(*gorm.DB)

    var users []User
    db.Find(&users) // 自动带上租户条件
}

// 自动设置租户 ID
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // 从上下文获取租户 ID
    if tenantID, ok := tx.Statement.Context.Value("tenantID").(uint); ok {
        u.TenantID = tenantID
    }
    return nil
}
```

### 审计日志

```go
// 审计日志模型
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

// 审计日志插件
func AuditLogPlugin(db *gorm.DB) {
    // 创建回调
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

        // 从上下文获取用户信息
        if userID, ok := db.Statement.Context.Value("userID").(uint); ok {
            auditLog.UserID = userID
        }

        // 获取主键值
        if primaryField := db.Statement.Schema.PrioritizedPrimaryField; primaryField != nil {
            if value, isZero := primaryField.ValueOf(db.Statement.Context, db.Statement.ReflectValue); !isZero {
                auditLog.RecordID = value.(uint)
            }
        }

        // 异步记录日志
        go db.Session(&gorm.Session{SkipHooks: true}).Create(&auditLog)
    })

    // 更新回调
    db.Callback().Update().Before("gorm:update").Register("audit:before_update", func(db *gorm.DB) {
        if db.Statement.Schema == nil {
            return
        }

        // 保存旧值
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

    // 删除回调
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

## 面试要点

### GORM 的核心原理

**Q: GORM 是如何实现对象与数据库表的映射的？**

GORM 使用 Go 的反射机制来解析结构体的字段信息，包括字段名、类型、标签等。在初始化时，GORM 会解析模型结构体生成 Schema，包含表名、列名、主键、索引等元信息。查询时，GORM 根据 Schema 信息构建 SQL 语句，并将查询结果映射回结构体。

**Q: GORM 的链式调用是如何实现的？**

GORM 的每个方法（如 Where、Order、Limit）都返回一个新的 `*gorm.DB` 实例。每次调用都会克隆当前实例并添加新的条件到 Statement 中。最终执行查询时，会根据 Statement 中累积的所有条件构建完整的 SQL。

### 关于事务

**Q: GORM 事务的使用方式有哪些？推荐哪种？**

GORM 支持两种事务使用方式：

1. **自动事务**：使用 `db.Transaction()` 方法，推荐使用
2. **手动事务**：使用 `db.Begin()`、`tx.Commit()`、`tx.Rollback()`

推荐使用自动事务，因为它会自动处理 panic 恢复和错误回滚，代码更简洁安全。

### 关于性能

**Q: 如何避免 GORM 的 N+1 查询问题？**

使用 Preload 或 Joins 预加载关联数据：

```go
// 使用 Preload（两次查询）
db.Preload("Posts").Find(&users)

// 使用 Joins（一次查询，适用于一对一）
db.Joins("Profile").Find(&users)
```

**Q: GORM 的默认事务对性能有什么影响？如何优化？**

GORM 默认在创建、更新、删除操作时开启事务。对于不需要事务的单条操作，可以通过配置禁用：

```go
db, _ := gorm.Open(mysql.Open(dsn), &gorm.Config{
    SkipDefaultTransaction: true, // 禁用默认事务
})
```

或者在单次操作时跳过：

```go
db.Session(&gorm.Session{SkipDefaultTransaction: true}).Create(&user)
```

### 关于软删除

**Q: GORM 软删除的实现原理是什么？**

GORM 通过在模型中添加 `gorm.DeletedAt` 字段实现软删除。删除时不会真正删除记录，而是将 `deleted_at` 设置为当前时间。查询时会自动添加 `deleted_at IS NULL` 条件。使用 `Unscoped()` 可以查询或操作被软删除的记录。

### 实战问题

**Q: 如何处理 GORM 更新时零值不更新的问题？**

三种解决方案：
1. 使用 `map[string]interface{}` 代替结构体
2. 使用 `Select()` 明确指定要更新的字段
3. 使用指针类型定义字段

**Q: 如何实现乐观锁？**

```go
type Product struct {
    ID      uint
    Name    string
    Version int `gorm:"default:1"`
}

// 更新时检查版本号
result := db.Model(&product).
    Where("id = ? AND version = ?", product.ID, product.Version).
    Updates(map[string]interface{}{
        "name":    product.Name,
        "version": gorm.Expr("version + 1"),
    })

if result.RowsAffected == 0 {
    return errors.New("并发冲突，请重试")
}
```

## 延伸阅读

### 官方资源

- [GORM 官方文档](https://gorm.io/zh_CN/docs/)
- [GORM GitHub 仓库](https://github.com/go-gorm/gorm)
- [GORM Playground](https://github.com/go-gorm/playground)

### 数据库驱动

- [MySQL 驱动](https://github.com/go-gorm/mysql)
- [PostgreSQL 驱动](https://github.com/go-gorm/postgres)
- [SQLite 驱动](https://github.com/go-gorm/sqlite)
- [SQL Server 驱动](https://github.com/go-gorm/sqlserver)

### 插件与扩展

- [gorm-gen](https://github.com/go-gorm/gen) - 代码生成器
- [datatypes](https://github.com/go-gorm/datatypes) - 自定义数据类型
- [dbresolver](https://github.com/go-gorm/dbresolver) - 读写分离
- [sharding](https://github.com/go-gorm/sharding) - 分表分库

### 相关书籍与教程

- 《Go 语言高级编程》- 数据库章节
- 《Go Web 编程》- ORM 相关内容

### 社区资源

- [GORM 中文社区](https://learnku.com/gorm)
- [Go 语言中文网](https://studygolang.com/)
