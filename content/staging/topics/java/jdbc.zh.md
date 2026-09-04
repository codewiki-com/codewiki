---
title: Java JDBC 数据库连接完全指南
description: 深入理解 Java JDBC API：从基本原理、核心概念到实战应用，掌握数据库连接、语句执行、资源管理的最佳实践
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - JDBC
  - 数据库
  - 连接
  - SQL
  - 资源管理
  - 性能优化
status: imported
origin: old/src/content/docs/java/jdbc.zh.md
divergence: 0.357
issues:
  - missing-subcategory-zh
  - order-mismatch
  - divergent
legacy:
  category: Java
  subcategory: ""
  order: 25
  lastUpdated: 2026-01-07
---

Java Database Connectivity (JDBC) 是 Java 应用程序与数据库交互的标准 API。它提供了一个与数据库无关的数据访问方法，使开发者能够编写可跨不同数据库系统运行的代码。本文将系统介绍 JDBC 的核心原理、最佳实践和常见问题，帮助开发者构建高效、稳定的数据库应用。

## 概念解释

### 什么是 JDBC

JDBC 是 Java 的标准 API，用于在 Java 应用程序中执行 SQL 语句和处理数据库结果。它采用 **面向接口编程** 的设计，提供了统一的方式来访问不同的关系型数据库。

**核心特点：**

- **数据库无关性**：通过驱动程序，同一套代码可适配多种数据库
- **面向接口**：基于标准接口而非具体实现，支持灵活扩展
- **事务支持**：提供事务管理机制保证数据一致性
- **参数化查询**：支持 PreparedStatement 防止 SQL 注入

### JDBC 的核心组件

**Connection**：表示与数据库的连接
- 负责创建 Statement 对象
- 管理事务（提交、回滚）
- 配置连接属性

**Statement**：用于执行 SQL 语句
- 执行静态 SQL 语句
- 返回 ResultSet 结果集
- 提供批量操作支持

**PreparedStatement**：预编译的 SQL 语句
- 使用占位符（?）防止 SQL 注入
- 重复使用时性能更优
- 自动处理特殊字符

**ResultSet**：代表查询结果集
- 游标遍历结果行
- 支持不同的游标类型和并发模式
- 提供类型转换方法

**Driver**：数据库驱动程序
- 实现 java.sql.Driver 接口
- 负责建立数据库连接
- 将 JDBC API 调用转换为数据库协议

### 连接池的重要性

由于创建数据库连接是一个昂贵的操作（涉及网络通信、身份验证等），实际应用中必须使用 **连接池** 来复用连接，避免频繁创建和销毁连接导致的性能问题。

## 核心原理

### JDBC 的执行流程

```
┌─────────────────────────────────────────┐
│ 1. 注册数据库驱动                        │
│    Class.forName("com.mysql.cj...")    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 2. 获取数据库连接                        │
│    DriverManager.getConnection(url,...)  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 3. 创建 SQL 语句对象                     │
│    conn.prepareStatement(sql)           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 4. 执行 SQL 语句                         │
│    pstmt.executeQuery() 或 executeUpdate()│
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 5. 处理结果                              │
│    遍历 ResultSet 或 获取受影响行数      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 6. 关闭资源                              │
│    resultSet.close()                    │
│    pstmt.close()                        │
│    conn.close()                         │
└─────────────────────────────────────────┘
```

### 数据库驱动加载机制

**驱动注册方式**：

1. **显式注册**（传统方式）
```java
Class.forName("com.mysql.cj.jdbc.Driver");
```
当驱动类加载时，会在静态代码块中执行 `DriverManager.registerDriver()` 自动注册。

2. **隐式注册**（JDBC 4.0+）
使用 Service Provider Interface (SPI)，驱动会自动被发现和加载，无需显式调用 `Class.forName()`。

### SQL 执行的两条路径

**路径 1：Statement（不推荐）**
- SQL 直接发送到数据库
- 每次执行都需要编译
- 容易受 SQL 注入攻击

**路径 2：PreparedStatement（推荐）**
- 先发送 SQL 模板到数据库预编译
- 参数单独发送，数据库直接使用已编译的计划
- 提高性能，防止 SQL 注入

### ResultSet 的游标模式

**TYPE_FORWARD_ONLY（默认）**
- 游标只能向前移动
- 内存占用最少
- 适合一次性遍历

**TYPE_SCROLL_INSENSITIVE**
- 游标可前后移动
- 对数据库的其他更改不敏感
- 内存占用较大

**TYPE_SCROLL_SENSITIVE**
- 游标可前后移动
- 对数据库的其他更改敏感
- 实现困难，很少使用

## 核心要点

### 资源管理的正确方式

JDBC 资源（Connection、Statement、ResultSet）必须显式关闭，否则会导致资源泄漏。

**推荐方式：使用 try-with-resources**

```java
try (Connection conn = dataSource.getConnection();
     PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, username);
    try (ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getString("name"));
        }
    }
} catch (SQLException e) {
    // 异常处理
}
```

### 事务管理

**自动提交模式**（默认）
```java
Connection conn = dataSource.getConnection(); // autoCommit = true
pstmt.executeUpdate(); // 立即提交
```

**手动事务管理**
```java
try {
    conn.setAutoCommit(false);
    pstmt1.executeUpdate();
    pstmt2.executeUpdate();
    conn.commit(); // 全部成功才提交
} catch (SQLException e) {
    conn.rollback(); // 发生异常则回滚
} finally {
    conn.setAutoCommit(true);
    conn.close();
}
```

### 参数化查询防止 SQL 注入

**不安全的方式**
```java
String sql = "SELECT * FROM users WHERE name = '" + username + "'";
// 输入: admin' OR '1'='1 会导致查询所有记录
```

**安全的方式**
```java
String sql = "SELECT * FROM users WHERE name = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, username); // 参数由驱动程序正确转义
ResultSet rs = pstmt.executeQuery();
```

### 批量操作

**减少网络往返，提高性能**

```java
String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    for (User user : users) {
        pstmt.setString(1, user.getName());
        pstmt.setString(2, user.getEmail());
        pstmt.addBatch(); // 添加到批处理
    }
    pstmt.executeBatch(); // 一次执行所有批处理语句
}
```

## 代码示例

### 基础的 CRUD 操作

```java
import java.sql.*;

public class JdbcBasicDemo {

    private static final String URL = "jdbc:mysql://localhost:3306/testdb";
    private static final String USER = "root";
    private static final String PASSWORD = "password";

    // 创建（CREATE）
    public static void createUser(String name, String email) {
        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, name);
            pstmt.setString(2, email);
            int rows = pstmt.executeUpdate();
            System.out.println("插入 " + rows + " 行数据");

        } catch (SQLException e) {
            System.err.println("插入失败: " + e.getMessage());
        }
    }

    // 读取（READ）
    public static void readUsers() {
        String sql = "SELECT id, name, email FROM users";
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                int id = rs.getInt("id");
                String name = rs.getString("name");
                String email = rs.getString("email");
                System.out.println("ID: " + id + ", 名称: " + name + ", 邮箱: " + email);
            }

        } catch (SQLException e) {
            System.err.println("查询失败: " + e.getMessage());
        }
    }

    // 更新（UPDATE）
    public static void updateUser(int id, String newEmail) {
        String sql = "UPDATE users SET email = ? WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, newEmail);
            pstmt.setInt(2, id);
            int rows = pstmt.executeUpdate();
            System.out.println("更新 " + rows + " 行数据");

        } catch (SQLException e) {
            System.err.println("更新失败: " + e.getMessage());
        }
    }

    // 删除（DELETE）
    public static void deleteUser(int id) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            int rows = pstmt.executeUpdate();
            System.out.println("删除 " + rows + " 行数据");

        } catch (SQLException e) {
            System.err.println("删除失败: " + e.getMessage());
        }
    }
}
```

### 使用连接池

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import java.sql.*;

public class ConnectionPoolDemo {

    private static DataSource dataSource;

    static {
        // 初始化 HikariCP 连接池
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/testdb");
        config.setUsername("root");
        config.setPassword("password");
        config.setMaximumPoolSize(10); // 最大连接数
        config.setMinimumIdle(5);      // 最小空闲连接数
        config.setConnectionTimeout(30000); // 连接超时（毫秒）
        config.setIdleTimeout(600000);  // 空闲超时（毫秒）
        config.setMaxLifetime(1800000); // 最大生命周期（毫秒）

        dataSource = new HikariDataSource(config);
    }

    public static void queryWithPool() {
        String sql = "SELECT COUNT(*) as cnt FROM users";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            if (rs.next()) {
                System.out.println("用户总数: " + rs.getInt("cnt"));
            }

        } catch (SQLException e) {
            System.err.println("查询失败: " + e.getMessage());
        }
    }

    public static void close() {
        if (dataSource instanceof HikariDataSource) {
            ((HikariDataSource) dataSource).close();
        }
    }

    public static void main(String[] args) {
        queryWithPool();
        close();
    }
}
```

### 事务处理示例

```java
import java.sql.*;

public class TransactionDemo {

    private static final String URL = "jdbc:mysql://localhost:3306/testdb";
    private static final String USER = "root";
    private static final String PASSWORD = "password";

    public static void transferMoney(int fromUserId, int toUserId, double amount) {
        String deductSql = "UPDATE accounts SET balance = balance - ? WHERE user_id = ?";
        String addSql = "UPDATE accounts SET balance = balance + ? WHERE user_id = ?";

        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD)) {

            // 禁用自动提交，启动事务
            conn.setAutoCommit(false);

            try (PreparedStatement deductStmt = conn.prepareStatement(deductSql);
                 PreparedStatement addStmt = conn.prepareStatement(addSql)) {

                // 扣款
                deductStmt.setDouble(1, amount);
                deductStmt.setInt(2, fromUserId);
                int deductRows = deductStmt.executeUpdate();

                // 模拟异常
                // throw new SQLException("模拟异常");

                // 入账
                addStmt.setDouble(1, amount);
                addStmt.setInt(2, toUserId);
                int addRows = addStmt.executeUpdate();

                // 验证操作都成功
                if (deductRows == 1 && addRows == 1) {
                    conn.commit();
                    System.out.println("转账成功");
                } else {
                    conn.rollback();
                    System.out.println("转账失败");
                }

            } catch (SQLException e) {
                conn.rollback();
                System.err.println("转账异常，已回滚: " + e.getMessage());
            } finally {
                conn.setAutoCommit(true); // 恢复自动提交
            }

        } catch (SQLException e) {
            System.err.println("连接错误: " + e.getMessage());
        }
    }
}
```

### 批量操作

```java
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BatchOperationDemo {

    private static final String URL = "jdbc:mysql://localhost:3306/testdb";
    private static final String USER = "root";
    private static final String PASSWORD = "password";

    public static class User {
        public String name;
        public String email;

        public User(String name, String email) {
            this.name = name;
            this.email = email;
        }
    }

    public static void batchInsert(List<User> users) {
        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";

        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            long startTime = System.currentTimeMillis();

            for (User user : users) {
                pstmt.setString(1, user.name);
                pstmt.setString(2, user.email);
                pstmt.addBatch(); // 添加到批处理队列
            }

            int[] results = pstmt.executeBatch(); // 一次性执行所有批处理语句

            long endTime = System.currentTimeMillis();

            System.out.println("批量插入 " + results.length + " 条记录");
            System.out.println("耗时: " + (endTime - startTime) + " ms");

        } catch (SQLException e) {
            System.err.println("批量插入失败: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        List<User> users = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            users.add(new User("User" + i, "user" + i + "@example.com"));
        }
        batchInsert(users);
    }
}
```

### 高级特性：自动生成的主键

```java
import java.sql.*;

public class GeneratedKeysDemo {

    private static final String URL = "jdbc:mysql://localhost:3306/testdb";
    private static final String USER = "root";
    private static final String PASSWORD = "password";

    public static int insertAndGetId(String name, String email) {
        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
        int generatedId = -1;

        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, name);
            pstmt.setString(2, email);
            pstmt.executeUpdate();

            // 获取生成的主键
            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    generatedId = generatedKeys.getInt(1);
                    System.out.println("插入成功，生成的 ID: " + generatedId);
                }
            }

        } catch (SQLException e) {
            System.err.println("插入失败: " + e.getMessage());
        }

        return generatedId;
    }
}
```

## 最佳实践

### 连接管理最佳实践

**1. 使用连接池而不是 DriverManager**

```java
// 不推荐：每次都创建新连接
Connection conn = DriverManager.getConnection(url, user, password);

// 推荐：使用连接池复用连接
Connection conn = dataSource.getConnection();
```

**2. 使用 try-with-resources 自动关闭资源**

```java
// 推荐：自动关闭
try (Connection conn = dataSource.getConnection();
     PreparedStatement pstmt = conn.prepareStatement(sql)) {
    // 操作
}

// 不推荐：需要手动关闭，容易遗忘
Connection conn = null;
try {
    conn = dataSource.getConnection();
    // 操作
} finally {
    if (conn != null) conn.close();
}
```

**3. 配置合理的连接池参数**

```java
config.setMaximumPoolSize(10);    // 根据并发数设置
config.setMinimumIdle(5);         // 保持一些预热连接
config.setConnectionTimeout(30000); // 避免无限等待
config.setIdleTimeout(600000);    // 及时回收空闲连接
config.setMaxLifetime(1800000);   // 防止连接长期占用
config.setConnectionTestQuery("SELECT 1"); // 定期测试连接有效性
```

### SQL 执行最佳实践

**1. 总是使用 PreparedStatement**

```java
// 推荐
String sql = "SELECT * FROM users WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, userId);

// 不推荐：容易 SQL 注入，性能差
String sql = "SELECT * FROM users WHERE id = " + userId;
Statement stmt = conn.createStatement();
```

**2. 显式指定数据类型**

```java
// 推荐：类型安全
pstmt.setInt(1, age);
pstmt.setString(2, name);
pstmt.setBoolean(3, isActive);
pstmt.setTimestamp(4, new Timestamp(System.currentTimeMillis()));

// 不推荐：过度依赖自动转换
pstmt.setObject(1, age);
pstmt.setObject(2, name);
```

**3. 批量操作使用 addBatch 和 executeBatch**

```java
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    for (int i = 0; i < 1000; i++) {
        pstmt.setInt(1, i);
        pstmt.setString(2, "data" + i);
        pstmt.addBatch();
    }
    pstmt.executeBatch(); // 比逐条执行快 10 倍以上
}
```

### 结果集处理最佳实践

**1. 及时关闭 ResultSet**

```java
try (ResultSet rs = pstmt.executeQuery()) {
    while (rs.next()) {
        // 处理每一行
    }
    // 离开 try 块时自动关闭
}
```

**2. 使用列名而不是索引（可读性更好）**

```java
// 推荐
String name = rs.getString("name");
int age = rs.getInt("age");

// 不推荐：容易出错，难以维护
String name = rs.getString(1);
int age = rs.getInt(2);
```

**3. 检查 NULL 值**

```java
String phone = rs.getString("phone");
if (rs.wasNull()) {
    // 处理 NULL 值
    phone = null;
}

// 或者使用 Optional
Optional<String> phone = Optional.ofNullable(rs.getString("phone"));
```

### 事务处理最佳实践

**1. 明确界定事务边界**

```java
try {
    conn.setAutoCommit(false);
    // 所有数据库操作
    // ...
    conn.commit();
} catch (SQLException e) {
    try {
        conn.rollback();
    } catch (SQLException rollbackEx) {
        // 处理回滚异常
    }
} finally {
    try {
        conn.setAutoCommit(true);
    } catch (SQLException ex) {
        // 处理异常
    }
}
```

**2. 使用适当的隔离级别**

```java
// 读未提交（脏读风险）
conn.setTransactionIsolation(Connection.TRANSACTION_READ_UNCOMMITTED);

// 读已提交（大多数情况下够用）
conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);

// 可重复读
conn.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);

// 串行化（最严格）
conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
```

**3. 最小化事务持续时间**

```java
// 不推荐：事务包含过多业务逻辑
try {
    conn.setAutoCommit(false);
    complexBusinessLogic(); // 耗时很长
    updateDatabase();
    conn.commit();
}

// 推荐：只将数据库操作放在事务内
complexBusinessLogic(); // 业务逻辑
try {
    conn.setAutoCommit(false);
    updateDatabase(); // 只有数据库操作在事务内
    conn.commit();
}
```

### 性能优化最佳实践

**1. 使用缓存减少数据库访问**

```java
private static final Map<Integer, User> userCache = new ConcurrentHashMap<>();

public User getUserWithCache(int userId) {
    return userCache.computeIfAbsent(userId, id -> {
        // 缓存未命中才执行数据库查询
        return queryUserFromDatabase(id);
    });
}
```

**2. 分页查询避免加载大量数据**

```java
public List<User> getUsersWithPagination(int pageNum, int pageSize) {
    String sql = "SELECT * FROM users LIMIT ? OFFSET ?";
    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
        pstmt.setInt(1, pageSize);
        pstmt.setInt(2, (pageNum - 1) * pageSize);
        // ...
    }
}
```

**3. 选择合适的 ResultSet 类型**

```java
// 一次性读取，使用默认的前向游标
PreparedStatement pstmt = conn.prepareStatement(sql); // TYPE_FORWARD_ONLY

// 需要随机访问，使用可滚动游标（注意内存开销）
PreparedStatement pstmt = conn.prepareStatement(sql,
    ResultSet.TYPE_SCROLL_INSENSITIVE,
    ResultSet.CONCUR_READ_ONLY);
```

## 常见陷阱

### 资源泄漏

**陷阱：忘记关闭资源**

```java
// 危险：资源未关闭
public void query() throws SQLException {
    Connection conn = dataSource.getConnection();
    PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users");
    ResultSet rs = pstmt.executeQuery();
    // 没有关闭 rs, pstmt, conn
    while (rs.next()) {
        System.out.println(rs.getString("name"));
    }
}

// 解决方案：使用 try-with-resources
public void query() throws SQLException {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users");
         ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getString("name"));
        }
    }
}
```

### SQL 注入漏洞

**陷阱：字符串拼接 SQL**

```java
// 危险：SQL 注入漏洞
String username = request.getParameter("username");
String sql = "SELECT * FROM users WHERE username = '" + username + "'";
// 输入: ' OR '1'='1 会返回所有用户

// 解决方案：使用参数化查询
String sql = "SELECT * FROM users WHERE username = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, username); // 参数被安全转义
```

### 事务边界混乱

**陷阱：事务提交异常未正确处理**

```java
// 问题代码：异常时未回滚
try {
    conn.setAutoCommit(false);
    operation1();
    operation2();
    conn.commit();
} catch (SQLException e) {
    // 虽然异常被捕获，但未回滚
    e.printStackTrace();
} finally {
    conn.setAutoCommit(true);
}

// 改进代码：确保异常时回滚
try {
    conn.setAutoCommit(false);
    operation1();
    operation2();
    conn.commit();
} catch (SQLException e) {
    conn.rollback(); // 显式回滚
} finally {
    conn.setAutoCommit(true);
}
```

### 不合适的数据类型转换

**陷阱：类型不匹配导致异常**

```java
// 问题：数据库中是 VARCHAR，但用 getInt() 读取
String sqlResult = rs.getString("code");
int code = Integer.parseInt(sqlResult); // 可能抛出 NumberFormatException

// 改进：检查类型并正确转换
Object value = rs.getObject("code");
int code = value instanceof Number
    ? ((Number) value).intValue()
    : Integer.parseInt(value.toString());
```

### 连接池配置不当

**陷阱：最大连接数设置过小导致连接饥饿**

```java
// 问题：最大连接数太少
config.setMaximumPoolSize(1); // 高并发环境下线程会等待连接

// 改进：根据并发需求设置
config.setMaximumPoolSize(10); // 根据应用的最大并发数设置
config.setMinimumIdle(5);      // 保持一些预热连接
```

### ResultSet 使用不当

**陷阱：ResultSet 只能向前遍历**

```java
// 问题：尝试向前遍历
try (ResultSet rs = pstmt.executeQuery()) {
    rs.next();
    System.out.println(rs.getString("name"));
    rs.previous(); // 抛出异常：不支持
}

// 解决方案：创建可滚动的 ResultSet
PreparedStatement pstmt = conn.prepareStatement(sql,
    ResultSet.TYPE_SCROLL_INSENSITIVE,
    ResultSet.CONCUR_READ_ONLY);
try (ResultSet rs = pstmt.executeQuery()) {
    rs.last(); // 跳到最后一行
    System.out.println(rs.getString("name"));
    rs.previous(); // 现在支持
}
```

### NULL 值处理不当

**陷阱：没有检查 NULL**

```java
// 问题：可能返回 null，导致 NullPointerException
String email = rs.getString("email");
System.out.println(email.toLowerCase()); // 如果 email 是 NULL，报错

// 解决方案：检查 NULL 或使用默认值
String email = rs.getString("email");
String finalEmail = email != null ? email.toLowerCase() : "unknown";

// 或使用 Optional
Optional<String> email = Optional.ofNullable(rs.getString("email"))
    .map(String::toLowerCase);
```

## 性能考量

### 连接池的性能影响

**连接创建成本**

- 建立网络连接：5-50ms
- 身份验证：10-100ms
- 总计：15-150ms

使用连接池可以避免频繁创建连接，性能提升 5-10 倍。

**连接池配置对性能的影响**

```
场景1：最大连接数=1，并发=10
└─ 线程等待连接，吞吐量极低

场景2：最大连接数=10，并发=10
└─ 连接利用率最高，吞吐量最好

场景3：最大连接数=100，并发=10
└─ 大量空闲连接浪费内存，无性能提升
```

### SQL 执行性能对比

| 操作 | 性能 | 说明 |
|------|------|------|
| PreparedStatement（已编译） | 高 | 数据库重用执行计划 |
| Statement（未编译） | 低 | 每次都需要编译 |
| 批量插入（Batch） | 高 | 减少网络往返 |
| 逐条插入 | 低 | 每次都需要往返 |

**性能测试示例**

```java
public class PerformanceComparison {

    // 测试 1000 条插入记录
    static final int RECORD_COUNT = 1000;

    // 逐条执行：~1000ms
    public long testSequentialInsert() {
        long start = System.currentTimeMillis();
        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < RECORD_COUNT; i++) {
                pstmt.setString(1, "User" + i);
                pstmt.setString(2, "user" + i + "@example.com");
                pstmt.executeUpdate(); // 1000 次网络往返
            }
        }
        return System.currentTimeMillis() - start;
    }

    // 批量执行：~100ms（快 10 倍）
    public long testBatchInsert() {
        long start = System.currentTimeMillis();
        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < RECORD_COUNT; i++) {
                pstmt.setString(1, "User" + i);
                pstmt.setString(2, "user" + i + "@example.com");
                pstmt.addBatch();
            }
            pstmt.executeBatch(); // 1 次网络往返
        }
        return System.currentTimeMillis() - start;
    }
}
```

### ResultSet 性能考量

**游标类型对性能的影响**

```java
// TYPE_FORWARD_ONLY（默认）：内存占用少，性能最优
PreparedStatement pstmt = conn.prepareStatement(sql);
// 内存占用：最少，适合大数据量单次遍历

// TYPE_SCROLL_INSENSITIVE：内存占用多，性能一般
PreparedStatement pstmt = conn.prepareStatement(sql,
    ResultSet.TYPE_SCROLL_INSENSITIVE,
    ResultSet.CONCUR_READ_ONLY);
// 内存占用：整个 ResultSet 缓存在内存，不适合大数据量
```

**优化大数据量查询**

```java
// 不推荐：一次加载所有数据
List<User> allUsers = queryAllUsers(); // 可能导致内存溢出

// 推荐：分页查询
for (int page = 1; page <= totalPages; page++) {
    List<User> pageUsers = queryUsersByPage(page, pageSize);
    processUsers(pageUsers);
}

// 或推荐：使用游标逐行处理
try (ResultSet rs = pstmt.executeQuery()) {
    while (rs.next()) {
        User user = mapToUser(rs);
        processUser(user); // 及时处理，释放内存
    }
}
```

### 缓存策略

**使用缓存减少数据库访问**

```java
public class UserService {
    private final DataSource dataSource;
    private final Cache<Integer, User> userCache =
        CacheBuilder.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .build();

    public User getUser(int userId) {
        return userCache.get(userId, () -> {
            // 缓存未命中才查询数据库
            return queryUserFromDatabase(userId);
        });
    }

    private User queryUserFromDatabase(int userId) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapToUser(rs);
                }
            }
        } catch (SQLException e) {
            // 日志和异常处理
        }
        return null;
    }
}
```

## 实战场景

### 电商订单管理系统

```java
public class OrderService {

    private final DataSource dataSource;

    /**
     * 创建订单并更新库存（事务操作）
     */
    public boolean createOrder(Order order, List<OrderItem> items) {
        String orderSql = "INSERT INTO orders (user_id, total_amount, status, created_at) VALUES (?, ?, ?, ?)";
        String itemSql = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
        String stockSql = "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?";

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            try {
                // 1. 插入订单
                long orderId;
                try (PreparedStatement pstmt = conn.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
                    pstmt.setInt(1, order.getUserId());
                    pstmt.setDouble(2, order.getTotalAmount());
                    pstmt.setString(3, "PENDING");
                    pstmt.setTimestamp(4, new Timestamp(System.currentTimeMillis()));
                    pstmt.executeUpdate();

                    try (ResultSet rs = pstmt.getGeneratedKeys()) {
                        if (rs.next()) {
                            orderId = rs.getLong(1);
                        } else {
                            throw new SQLException("无法获取生成的订单 ID");
                        }
                    }
                }

                // 2. 插入订单项并更新库存
                try (PreparedStatement itemPstmt = conn.prepareStatement(itemSql);
                     PreparedStatement stockPstmt = conn.prepareStatement(stockSql)) {

                    for (OrderItem item : items) {
                        // 插入订单项
                        itemPstmt.setLong(1, orderId);
                        itemPstmt.setInt(2, item.getProductId());
                        itemPstmt.setInt(3, item.getQuantity());
                        itemPstmt.setDouble(4, item.getPrice());
                        itemPstmt.addBatch();

                        // 更新库存
                        stockPstmt.setInt(1, item.getQuantity());
                        stockPstmt.setInt(2, item.getProductId());
                        stockPstmt.setInt(3, item.getQuantity());

                        int updated = stockPstmt.executeUpdate();
                        if (updated == 0) {
                            throw new SQLException("库存不足，产品 ID: " + item.getProductId());
                        }
                    }

                    itemPstmt.executeBatch();
                }

                conn.commit();
                return true;

            } catch (SQLException e) {
                conn.rollback();
                System.err.println("订单创建失败: " + e.getMessage());
                return false;
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException e) {
            System.err.println("数据库连接错误: " + e.getMessage());
            return false;
        }
    }
}
```

### 日志系统的大批量数据插入

```java
public class LogService {

    private final DataSource dataSource;
    private static final int BATCH_SIZE = 1000;

    /**
     * 批量插入日志记录
     */
    public void batchInsertLogs(List<LogEntry> logs) {
        String sql = "INSERT INTO logs (level, message, timestamp, trace) VALUES (?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            int count = 0;
            long startTime = System.currentTimeMillis();

            for (LogEntry log : logs) {
                pstmt.setString(1, log.getLevel());
                pstmt.setString(2, log.getMessage());
                pstmt.setTimestamp(3, new Timestamp(log.getTimestamp()));
                pstmt.setString(4, log.getTrace());
                pstmt.addBatch();

                count++;
                if (count % BATCH_SIZE == 0) {
                    pstmt.executeBatch();
                    pstmt.clearBatch();
                    System.out.println("已插入 " + count + " 条日志");
                }
            }

            // 插入剩余记录
            if (count % BATCH_SIZE != 0) {
                pstmt.executeBatch();
            }

            long endTime = System.currentTimeMillis();
            System.out.println("总计插入 " + count + " 条日志，耗时 " + (endTime - startTime) + "ms");

        } catch (SQLException e) {
            System.err.println("批量插入日志失败: " + e.getMessage());
        }
    }
}
```

### 缓存查询优化

```java
public class UserRepository {

    private final DataSource dataSource;
    private final Map<Integer, User> cache = new ConcurrentHashMap<>();

    /**
     * 获取用户信息（带缓存）
     */
    public User getUserWithCache(int userId) {
        // 先查缓存
        if (cache.containsKey(userId)) {
            return cache.get(userId);
        }

        // 缓存未命中，查询数据库
        User user = queryUserFromDatabase(userId);
        if (user != null) {
            cache.put(userId, user);
        }
        return user;
    }

    /**
     * 批量获取用户信息（减少数据库访问）
     */
    public Map<Integer, User> getUsersWithCache(List<Integer> userIds) {
        Map<Integer, User> result = new HashMap<>();
        List<Integer> uncachedIds = new ArrayList<>();

        // 先查缓存
        for (int userId : userIds) {
            if (cache.containsKey(userId)) {
                result.put(userId, cache.get(userId));
            } else {
                uncachedIds.add(userId);
            }
        }

        // 批量查询未缓存的用户
        if (!uncachedIds.isEmpty()) {
            String sql = "SELECT * FROM users WHERE id IN (" +
                uncachedIds.stream().map(String::valueOf).collect(Collectors.joining(",")) + ")";
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql);
                 ResultSet rs = pstmt.executeQuery()) {

                while (rs.next()) {
                    User user = mapToUser(rs);
                    result.put(user.getId(), user);
                    cache.put(user.getId(), user); // 缓存结果
                }

            } catch (SQLException e) {
                System.err.println("查询失败: " + e.getMessage());
            }
        }

        return result;
    }

    private User queryUserFromDatabase(int userId) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapToUser(rs);
                }
            }

        } catch (SQLException e) {
            System.err.println("查询失败: " + e.getMessage());
        }
        return null;
    }

    private User mapToUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getTimestamp("created_at").toLocalDateTime()
        );
    }
}
```

## 面试要点

### JDBC 的核心概念

**Q: JDBC 是什么？有什么优点？**

A: JDBC 是 Java 数据库连接 API，提供了一个与数据库无关的数据访问方法。主要优点包括：
- 数据库独立性：相同代码可适配多个数据库
- 面向接口编程：驱动程序通过实现标准接口集成
- 事务支持：能够控制数据的一致性
- 参数化查询：防止 SQL 注入攻击

### Connection、Statement、PreparedStatement 的区别

**Q: Connection、Statement 和 PreparedStatement 有什么区别？**

A:
- **Connection**：代表与数据库的连接，用于创建 Statement 对象和管理事务
- **Statement**：执行静态 SQL 语句，性能较低，容易受 SQL 注入
- **PreparedStatement**：继承自 Statement，支持参数化查询，性能更高，更安全

```java
// Statement：SQL 字符串拼接
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE id = " + userId);

// PreparedStatement：占位符 + 参数绑定
PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
pstmt.setInt(1, userId);
ResultSet rs = pstmt.executeQuery();
```

### SQL 注入如何防止

**Q: 什么是 SQL 注入？如何防止？**

A: SQL 注入是通过在输入数据中插入恶意 SQL 代码来攻击数据库的技术。防止方法：

1. 使用 PreparedStatement（最重要）
2. 输入验证和过滤
3. 使用 ORM 框架（如 Hibernate、MyBatis）
4. 数据库权限最小化

```java
// 危险：直接拼接
String sql = "SELECT * FROM users WHERE name = '" + name + "'";
// 输入: admin' OR '1'='1 会查询所有用户

// 安全：参数化查询
String sql = "SELECT * FROM users WHERE name = ?";
pstmt.setString(1, name);
```

### 事务和隔离级别

**Q: 说说 JDBC 中的事务和隔离级别**

A: 事务保证了数据操作的 ACID 特性。隔离级别有四个：

1. **READ_UNCOMMITTED**：读未提交（脏读）
2. **READ_COMMITTED**：读已提交（不可重复读）
3. **REPEATABLE_READ**：可重复读（幻读）
4. **SERIALIZABLE**：串行化（最安全）

```java
conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
try {
    conn.setAutoCommit(false);
    // 业务逻辑
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
}
```

### 连接池的必要性

**Q: 为什么必须使用连接池？**

A: 创建数据库连接成本高（15-150ms），频繁创建销毁连接会严重影响性能。连接池通过以下方式优化性能：

- 复用连接，避免频繁创建销毁
- 预创建一些连接保持就绪状态
- 自动回收超时连接
- 性能提升 5-10 倍

```java
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(10);
config.setMinimumIdle(5);
DataSource dataSource = new HikariDataSource(config);
```

### 资源泄漏的原因和解决方案

**Q: 如何避免 JDBC 的资源泄漏？**

A: JDBC 的 ResultSet、Statement、Connection 都需要显式关闭，否则会导致资源泄漏。

```java
// 推荐：使用 try-with-resources（自动关闭）
try (Connection conn = dataSource.getConnection();
     PreparedStatement pstmt = conn.prepareStatement(sql);
     ResultSet rs = pstmt.executeQuery()) {
    // 操作
}

// 不推荐：手动关闭（容易遗忘）
Connection conn = null;
try {
    conn = dataSource.getConnection();
    // 操作
} finally {
    if (conn != null) conn.close();
}
```

### 批量操作的优化

**Q: 如何优化批量数据插入的性能？**

A: 使用 PreparedStatement 的 addBatch() 和 executeBatch() 方法，将多条语句合并为一条网络请求执行，性能可提升 10 倍以上。

```java
String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    for (User user : users) {
        pstmt.setString(1, user.getName());
        pstmt.setString(2, user.getEmail());
        pstmt.addBatch();
    }
    pstmt.executeBatch(); // 一次执行所有
}
```

### 处理大数据量查询

**Q: 如何处理返回大量数据的查询？**

A:
1. 分页查询：每次只加载一页数据
2. 流式处理：逐行处理，及时释放内存
3. 缓存热点数据：减少数据库访问
4. 选择合适的 ResultSet 类型

```java
// 分页查询
for (int page = 1; page <= totalPages; page++) {
    String sql = "SELECT * FROM users LIMIT ? OFFSET ?";
    pstmt.setInt(1, pageSize);
    pstmt.setInt(2, (page - 1) * pageSize);
    // 处理当前页
}

// 流式处理
try (ResultSet rs = pstmt.executeQuery()) {
    while (rs.next()) {
        processRow(rs); // 及时处理，释放内存
    }
}
```

### 常见异常处理

**Q: JDBC 中的常见异常有哪些？**

A:
- **SQLException**：最常见的 JDBC 异常基类
- **SQLSyntaxErrorException**：SQL 语法错误
- **SQLIntegrityConstraintViolationException**：约束违反（如唯一性约束）
- **DataAccessException**：数据访问异常

```java
try {
    // JDBC 操作
} catch (SQLException e) {
    String sqlState = e.getSQLState();
    int errorCode = e.getErrorCode();
    String message = e.getMessage();

    if (sqlState.startsWith("23")) {
        // 完整性约束违反
    } else if (sqlState.startsWith("42")) {
        // SQL 语法错误
    }
}
```

### JDBC 与 ORM 框架的关系

**Q: JDBC 和 ORM 框架（Hibernate、MyBatis）的关系？**

A: ORM 框架是在 JDBC 之上的高级抽象，提供了对象关系映射功能：

- **JDBC**：底层驱动，暴露 SQL 细节，性能最优，学习成本低
- **ORM 框架**：高级抽象，隐藏 SQL 细节，开发效率高，但性能开销更大

选择应根据项目需求：
- 简单 CRUD 应用：使用 JDBC 或轻量级框架（如 JOOQ）
- 复杂业务应用：使用 ORM 框架（如 Hibernate、JPA）
- 性能敏感应用：使用 MyBatis 或原生 JDBC

## 延伸阅读

### 相关技术栈

- **连接池框架**：HikariCP、Druid、C3P0、DBCP
- **ORM 框架**：Hibernate、JPA、MyBatis、JOOQ
- **数据库驱动**：MySQL Connector/J、PostgreSQL JDBC、Oracle JDBC
- **事务管理**：Spring Transaction、Narayana

### 进阶主题

1. **连接池的高级配置**
   - 连接验证策略
   - 连接泄漏检测
   - 连接重置策略

2. **性能监控与调优**
   - 慢查询日志
   - 查询计划分析
   - 索引优化

3. **高可用部署**
   - 主从复制
   - 读写分离
   - 连接池故障转移

4. **事务处理高级特性**
   - 分布式事务（XA）
   - 补偿事务
   - Saga 模式

### 推荐学习资源

- Java 官方文档：JDBC API Specification
- HikariCP 官方文档：https://github.com/brettwooldridge/HikariCP
- 数据库官方文档：MySQL、PostgreSQL、Oracle 驱动程序文档
- 开源项目：Spring JDBC、JOOQ 等

### 常用工具

- **SQL 执行分析**：EXPLAIN、查询分析器
- **连接池监控**：HikariCP Admin、Druid 监控面板
- **性能分析**：JProfiler、YourKit、JFR
- **数据库管理**：MySQL Workbench、DBeaver、Navicat

---

## 总结

Java JDBC 是开发者与关系型数据库交互的核心技术。掌握 JDBC 不仅需要理解基本的 API 使用，还需要深入理解连接池、事务管理、资源管理等重要概念。通过本文的学习，你应该能够：

1. 理解 JDBC 的核心组件和执行流程
2. 安全、高效地编写数据库访问代码
3. 正确配置和使用连接池
4. 避免常见的陷阱和性能问题
5. 在实际项目中应用 JDBC 的最佳实践

无论是使用原生 JDBC 还是 ORM 框架，理解其底层原理都将使你成为更优秀的 Java 开发者。
