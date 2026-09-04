---
title: Java JDBC Database Connectivity
description: "Master Java JDBC: Establish database connections, execute queries, handle results, manage transactions, and implement connection pooling"
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - JDBC
  - Database
  - SQL
  - Connection Pooling
status: imported
origin: old/src/content/docs/java/jdbc.en.md
divergence: 0.357
issues:
  - missing-subcategory-zh
  - order-mismatch
  - divergent
legacy:
  category: Java
  subcategory: Database
  order: 25
  lastUpdated: 2026-01-07
---

Java Database Connectivity (JDBC) is a standard API that enables Java applications to interact with relational databases. JDBC provides a unified interface for database operations, allowing developers to write database-agnostic code and execute SQL queries seamlessly. This comprehensive guide covers everything you need to know about JDBC, from basic connections to advanced connection pooling strategies.

## Concept Explanation

### What is JDBC?

JDBC is a Java API that provides a standardized way for applications to access data in various databases. It abstracts the complexity of database communication by providing a consistent interface across different database systems (MySQL, PostgreSQL, Oracle, SQL Server, etc.).

### JDBC Architecture

JDBC operates on a layered architecture:

1. **Application Layer**: Your Java application code
2. **JDBC API Layer**: Java interfaces and classes (java.sql package)
3. **JDBC Driver Manager**: Loads and manages database drivers
4. **JDBC Driver Layer**: Database-specific implementations
5. **Database Layer**: The actual relational database

```
┌─────────────────────────────────────┐
│     Java Application Layer          │
├─────────────────────────────────────┤
│    java.sql Package (JDBC API)      │
├─────────────────────────────────────┤
│    JDBC Driver Manager              │
├─────────────────────────────────────┤
│  JDBC Drivers (Type 1-4)            │
├─────────────────────────────────────┤
│    Relational Database              │
└─────────────────────────────────────┘
```

### JDBC Driver Types

- **Type 1 (Bridge)**: Uses ODBC to communicate with databases (deprecated)
- **Type 2 (Native)**: Uses native code libraries provided by database vendors
- **Type 3 (Middleware)**: Uses middleware servers for database communication
- **Type 4 (Pure Java)**: Pure Java implementation communicating directly with databases (most common)

## Core Principles

### Connection Management

A `Connection` object represents a connection to a specific database. It acts as a gateway for all database operations.

```java
String url = "jdbc:mysql://localhost:3306/mydb";
String username = "root";
String password = "password";

Connection connection = DriverManager.getConnection(url, username, password);
// Use the connection
connection.close(); // Always close when done
```

### Statement Types

JDBC provides three types of statements:

- **Statement**: For simple SQL queries without parameters
- **PreparedStatement**: For parameterized SQL queries (prevents SQL injection)
- **CallableStatement**: For executing stored procedures

### Result Set Handling

A `ResultSet` is a table-like object containing the results of a database query. It maintains a cursor pointing to the current row.

```java
Statement statement = connection.createStatement();
ResultSet resultSet = statement.executeQuery("SELECT * FROM users");

while (resultSet.next()) {
    int id = resultSet.getInt("id");
    String name = resultSet.getString("name");
}
```

### Transaction Management

JDBC supports transaction management to ensure data consistency:

```java
connection.setAutoCommit(false);
try {
    // Execute multiple statements
    statement.execute("INSERT INTO ...");
    statement.execute("UPDATE ...");
    connection.commit();
} catch (SQLException e) {
    connection.rollback();
}
```

### Resource Management

Proper resource management is critical to prevent connection leaks:

- Close `ResultSet` objects
- Close `Statement` objects
- Close `Connection` objects
- Use try-with-resources for automatic closure

## Key Points

### Database URL Format

```
jdbc:mysql://hostname:port/database
jdbc:postgresql://hostname:port/database
jdbc:oracle:thin:@hostname:port:database
jdbc:sqlserver://hostname:port;databaseName=database
```

### JDBC Operations

| Operation | Method | Returns |
|-----------|--------|---------|
| SELECT | `executeQuery()` | ResultSet |
| INSERT/UPDATE/DELETE | `executeUpdate()` | int (rows affected) |
| Mixed operations | `execute()` | boolean |

### Connection Properties

```java
Properties properties = new Properties();
properties.setProperty("user", "username");
properties.setProperty("password", "password");
properties.setProperty("serverTimezone", "UTC");

Connection conn = DriverManager.getConnection(url, properties);
```

### ResultSet Types

- **TYPE_FORWARD_ONLY**: Can only scroll forward (default)
- **TYPE_SCROLL_INSENSITIVE**: Can scroll both directions, insensitive to changes
- **TYPE_SCROLL_SENSITIVE**: Can scroll both directions, sensitive to changes

### Concurrency Modes

- **CONCUR_READ_ONLY**: ResultSet is read-only
- **CONCUR_UPDATABLE**: ResultSet can be updated

## Code Examples

### Basic JDBC Connection

```java
import java.sql.*;

public class BasicJDBCExample {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/company_db";
        String username = "root";
        String password = "password";

        Connection connection = null;
        Statement statement = null;
        ResultSet resultSet = null;

        try {
            // Load driver (optional in Java 7+)
            Class.forName("com.mysql.cj.jdbc.Driver");

            // Establish connection
            connection = DriverManager.getConnection(url, username, password);
            System.out.println("Connected to database successfully");

            // Create statement
            statement = connection.createStatement();

            // Execute query
            resultSet = statement.executeQuery("SELECT * FROM employees");

            // Process results
            while (resultSet.next()) {
                int id = resultSet.getInt("id");
                String name = resultSet.getString("name");
                double salary = resultSet.getDouble("salary");

                System.out.println("ID: " + id + ", Name: " + name + ", Salary: " + salary);
            }

        } catch (ClassNotFoundException e) {
            System.err.println("Driver not found: " + e.getMessage());
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        } finally {
            // Close resources in reverse order
            try {
                if (resultSet != null) resultSet.close();
                if (statement != null) statement.close();
                if (connection != null) connection.close();
            } catch (SQLException e) {
                System.err.println("Error closing resources: " + e.getMessage());
            }
        }
    }
}
```

### PreparedStatement with Parameters

```java
import java.sql.*;

public class PreparedStatementExample {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/company_db";
        String username = "root";
        String password = "password";

        try (Connection connection = DriverManager.getConnection(url, username, password)) {

            // INSERT using PreparedStatement
            String insertSQL = "INSERT INTO employees (name, email, salary) VALUES (?, ?, ?)";
            try (PreparedStatement preparedStatement = connection.prepareStatement(insertSQL)) {
                preparedStatement.setString(1, "John Doe");
                preparedStatement.setString(2, "john@example.com");
                preparedStatement.setDouble(3, 75000.0);

                int rowsInserted = preparedStatement.executeUpdate();
                System.out.println("Rows inserted: " + rowsInserted);
            }

            // SELECT with parameters
            String selectSQL = "SELECT * FROM employees WHERE salary > ? AND department = ?";
            try (PreparedStatement preparedStatement = connection.prepareStatement(selectSQL)) {
                preparedStatement.setDouble(1, 50000.0);
                preparedStatement.setString(2, "Engineering");

                try (ResultSet resultSet = preparedStatement.executeQuery()) {
                    while (resultSet.next()) {
                        System.out.println(resultSet.getString("name"));
                    }
                }
            }

            // UPDATE using PreparedStatement
            String updateSQL = "UPDATE employees SET salary = ? WHERE id = ?";
            try (PreparedStatement preparedStatement = connection.prepareStatement(updateSQL)) {
                preparedStatement.setDouble(1, 85000.0);
                preparedStatement.setInt(2, 1);

                int rowsUpdated = preparedStatement.executeUpdate();
                System.out.println("Rows updated: " + rowsUpdated);
            }

        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

### Transaction Management

```java
import java.sql.*;

public class TransactionExample {
    public static void transferFunds(String accountFromId, String accountToId, double amount) {
        String url = "jdbc:mysql://localhost:3306/bank_db";
        String username = "root";
        String password = "password";

        try (Connection connection = DriverManager.getConnection(url, username, password)) {
            // Disable auto-commit for transaction control
            connection.setAutoCommit(false);

            try {
                // Withdraw from source account
                String withdrawSQL = "UPDATE accounts SET balance = balance - ? WHERE account_id = ?";
                try (PreparedStatement withdrawStmt = connection.prepareStatement(withdrawSQL)) {
                    withdrawStmt.setDouble(1, amount);
                    withdrawStmt.setString(2, accountFromId);
                    withdrawStmt.executeUpdate();
                }

                // Verify sufficient balance
                String checkSQL = "SELECT balance FROM accounts WHERE account_id = ?";
                try (PreparedStatement checkStmt = connection.prepareStatement(checkSQL)) {
                    checkStmt.setString(1, accountFromId);
                    try (ResultSet resultSet = checkStmt.executeQuery()) {
                        if (resultSet.next() && resultSet.getDouble("balance") < 0) {
                            throw new SQLException("Insufficient balance");
                        }
                    }
                }

                // Deposit to target account
                String depositSQL = "UPDATE accounts SET balance = balance + ? WHERE account_id = ?";
                try (PreparedStatement depositStmt = connection.prepareStatement(depositSQL)) {
                    depositStmt.setDouble(1, amount);
                    depositStmt.setString(2, accountToId);
                    depositStmt.executeUpdate();
                }

                // Commit transaction
                connection.commit();
                System.out.println("Transfer completed successfully");

            } catch (SQLException e) {
                // Rollback on error
                connection.rollback();
                System.out.println("Transaction rolled back: " + e.getMessage());
                throw e;
            }

        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        transferFunds("ACC001", "ACC002", 500.0);
    }
}
```

### Batch Processing

```java
import java.sql.*;

public class BatchProcessingExample {
    public static void batchInsertEmployees(java.util.List<Employee> employees) {
        String url = "jdbc:mysql://localhost:3306/company_db";
        String username = "root";
        String password = "password";

        String sql = "INSERT INTO employees (name, email, salary) VALUES (?, ?, ?)";

        try (Connection connection = DriverManager.getConnection(url, username, password);
             PreparedStatement statement = connection.prepareStatement(sql)) {

            for (Employee employee : employees) {
                statement.setString(1, employee.getName());
                statement.setString(2, employee.getEmail());
                statement.setDouble(3, employee.getSalary());

                // Add to batch instead of executing immediately
                statement.addBatch();
            }

            // Execute all statements at once
            int[] results = statement.executeBatch();
            System.out.println("Batch insert completed. Rows affected: " + results.length);

        } catch (SQLException e) {
            System.err.println("Batch processing error: " + e.getMessage());
        }
    }
}

class Employee {
    private String name;
    private String email;
    private double salary;

    public Employee(String name, String email, double salary) {
        this.name = name;
        this.email = email;
        this.salary = salary;
    }

    public String getName() { return name; }
    public String getEmail() { return email; }
    public double getSalary() { return salary; }
}
```

### Connection Pooling with HikariCP

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.*;

public class ConnectionPoolingExample {
    private static HikariDataSource dataSource;

    static {
        // Configure connection pool
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/company_db");
        config.setUsername("root");
        config.setPassword("password");
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000); // 30 seconds
        config.setIdleTimeout(600000); // 10 minutes
        config.setMaxLifetime(1800000); // 30 minutes
        config.setLeakDetectionThreshold(60000); // 1 minute

        dataSource = new HikariDataSource(config);
    }

    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    public static void queryDatabase() {
        String sql = "SELECT * FROM employees WHERE id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, 1);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    System.out.println("Employee: " + resultSet.getString("name"));
                }
            }

        } catch (SQLException e) {
            System.err.println("Query error: " + e.getMessage());
        }
    }

    public static void closePool() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }

    public static void main(String[] args) {
        queryDatabase();
        closePool();
    }
}
```

### Custom Database Utility Class

```java
import java.sql.*;
import java.util.*;

public class DatabaseUtil {
    private String url;
    private String username;
    private String password;

    public DatabaseUtil(String url, String username, String password) {
        this.url = url;
        this.username = username;
        this.password = password;
    }

    public List<Map<String, Object>> executeQuery(String sql, Object... params) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();

        try (Connection connection = DriverManager.getConnection(url, username, password);
             PreparedStatement statement = connection.prepareStatement(sql)) {

            // Set parameters
            for (int i = 0; i < params.length; i++) {
                statement.setObject(i + 1, params[i]);
            }

            try (ResultSet resultSet = statement.executeQuery()) {
                ResultSetMetaData metadata = resultSet.getMetaData();
                int columnCount = metadata.getColumnCount();

                while (resultSet.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        String columnName = metadata.getColumnName(i);
                        Object value = resultSet.getObject(i);
                        row.put(columnName, value);
                    }
                    results.add(row);
                }
            }
        }

        return results;
    }

    public int executeUpdate(String sql, Object... params) throws SQLException {
        try (Connection connection = DriverManager.getConnection(url, username, password);
             PreparedStatement statement = connection.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                statement.setObject(i + 1, params[i]);
            }

            return statement.executeUpdate();
        }
    }

    public void executeBatch(String sql, List<Object[]> paramsList) throws SQLException {
        try (Connection connection = DriverManager.getConnection(url, username, password);
             PreparedStatement statement = connection.prepareStatement(sql)) {

            for (Object[] params : paramsList) {
                for (int i = 0; i < params.length; i++) {
                    statement.setObject(i + 1, params[i]);
                }
                statement.addBatch();
            }

            statement.executeBatch();
        }
    }
}

// Usage
class DatabaseUtilExample {
    public static void main(String[] args) throws SQLException {
        DatabaseUtil util = new DatabaseUtil(
            "jdbc:mysql://localhost:3306/company_db",
            "root",
            "password"
        );

        // Execute query
        List<Map<String, Object>> results = util.executeQuery(
            "SELECT * FROM employees WHERE salary > ?",
            50000.0
        );

        for (Map<String, Object> row : results) {
            System.out.println(row);
        }

        // Execute update
        int rowsAffected = util.executeUpdate(
            "UPDATE employees SET salary = ? WHERE id = ?",
            75000.0,
            1
        );

        System.out.println("Rows updated: " + rowsAffected);
    }
}
```

### Stored Procedure Execution

```java
import java.sql.*;

public class CallableStatementExample {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/company_db";
        String username = "root";
        String password = "password";

        try (Connection connection = DriverManager.getConnection(url, username, password)) {

            // Call stored procedure with input/output parameters
            String sql = "{call calculateBonus(?, ?, ?)}";

            try (CallableStatement statement = connection.prepareCall(sql)) {
                // Set input parameters
                statement.setInt(1, 1); // Employee ID
                statement.setDouble(2, 50000.0); // Base salary

                // Register output parameter
                statement.registerOutParameter(3, java.sql.Types.DOUBLE);

                // Execute stored procedure
                statement.execute();

                // Retrieve output parameter
                double bonus = statement.getDouble(3);
                System.out.println("Calculated bonus: " + bonus);
            }

        } catch (SQLException e) {
            System.err.println("Stored procedure error: " + e.getMessage());
        }
    }
}
```

## Best Practices

### Use Try-With-Resources

```java
// Good: Automatic resource management
try (Connection conn = DriverManager.getConnection(url, user, password);
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery(sql)) {
    while (rs.next()) {
        // Process results
    }
} catch (SQLException e) {
    // Handle exception
}

// Avoid: Manual resource management (error-prone)
Connection conn = null;
Statement stmt = null;
try {
    // ...
} finally {
    // Easy to forget closing resources
}
```

### Always Use PreparedStatements

```java
// Good: Prevents SQL injection
String sql = "SELECT * FROM users WHERE email = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setString(1, userEmail);

// Avoid: String concatenation (vulnerable to SQL injection)
String sql = "SELECT * FROM users WHERE email = '" + userEmail + "'";
Statement stmt = connection.createStatement();
```

### Implement Connection Pooling

```java
// Use a connection pool for production applications
// Options: HikariCP, C3P0, Apache DBCP2, Tomcat JDBC Connection Pool

// Benefits:
// - Reduces connection overhead
// - Improves application performance
// - Manages connection lifecycle
// - Prevents connection leaks
```

### Handle Exceptions Properly

```java
try (Connection conn = DriverManager.getConnection(url, user, password)) {
    // Execute database operations
} catch (SQLException e) {
    // Log the error
    logger.error("Database operation failed", e);

    // Determine the cause
    int errorCode = e.getErrorCode();
    String sqlState = e.getSQLState();

    // Handle specific errors
    if ("23505".equals(sqlState)) {
        // Handle unique constraint violation
    } else if (errorCode == 1040) {
        // Handle too many connections
    }

    // Provide meaningful feedback to user
    throw new DataAccessException("Unable to complete database operation");
}
```

### Set Appropriate Timeouts

```java
Connection conn = DriverManager.getConnection(url, user, password);

// Set network timeout (Java 7+)
conn.setNetworkTimeout(executor, 30000); // 30 seconds

// Set statement timeout
Statement stmt = conn.createStatement();
stmt.setQueryTimeout(60); // 60 seconds

// Set connection timeout in pool configuration
HikariConfig config = new HikariConfig();
config.setConnectionTimeout(30000); // 30 seconds
```

### Use Connection Pooling Configuration

```java
// HikariCP configuration example
HikariConfig config = new HikariConfig();
config.setJdbcUrl(url);
config.setUsername(user);
config.setPassword(password);

// Connection pool settings
config.setMaximumPoolSize(20);      // Maximum active connections
config.setMinimumIdle(5);            // Minimum idle connections
config.setConnectionTimeout(30000);  // Connection acquisition timeout
config.setIdleTimeout(600000);       // Idle connection timeout (10 min)
config.setMaxLifetime(1800000);      // Maximum connection lifetime (30 min)

// Performance and monitoring
config.setLeakDetectionThreshold(60000); // Detect connection leaks
config.setInitializationFailTimeout(1);  // Fail fast on startup
```

### Validate Query Results

```java
String sql = "SELECT COUNT(*) as count FROM users";

try (Connection conn = DriverManager.getConnection(url, user, password);
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery(sql)) {

    // Verify ResultSet has data
    if (rs.next()) {
        int count = rs.getInt("count");
        System.out.println("Total users: " + count);
    } else {
        System.out.println("No results found");
    }

} catch (SQLException e) {
    // Handle error
}
```

### Use Object-Oriented Data Access

```java
// Define a DAO interface
public interface UserRepository {
    User findById(int id) throws SQLException;
    List<User> findAll() throws SQLException;
    void save(User user) throws SQLException;
    void update(User user) throws SQLException;
    void delete(int id) throws SQLException;
}

// Implement the DAO
public class JdbcUserRepository implements UserRepository {
    private DataSource dataSource;

    public JdbcUserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public User findById(int id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRowToUser(rs);
                }
            }
        }
        return null;
    }

    private User mapRowToUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("id"),
            rs.getString("name"),
            rs.getString("email")
        );
    }
}
```

## Common Pitfalls

### Not Closing Resources

```java
// Problematic: Connection leak
Connection conn = DriverManager.getConnection(url, user, password);
// If exception occurs, connection is never closed

// Solution: Use try-with-resources
try (Connection conn = DriverManager.getConnection(url, user, password)) {
    // Use connection
} catch (SQLException e) {
    // Handle error
}
```

### SQL Injection Vulnerability

```java
// Dangerous: String concatenation
String email = getUserInput();
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(sql);

// Safe: PreparedStatement with parameters
String sql = "SELECT * FROM users WHERE email = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setString(1, email);
ResultSet rs = stmt.executeQuery();
```

### Connection Pool Exhaustion

```java
// Problem: Connections not returned to pool
while (true) {
    Connection conn = dataSource.getConnection();
    // Forgot to close connection
}

// Solution: Always close connections
for (int i = 0; i < 100; i++) {
    try (Connection conn = dataSource.getConnection()) {
        // Use connection
    } // Automatically returned to pool
}
```

### Ignoring Driver Loading

```java
// Modern approach (Java 7+): Auto-loading
// No need to explicitly load driver
Connection conn = DriverManager.getConnection(url, user, password);

// Legacy approach (still works, but not necessary)
Class.forName("com.mysql.cj.jdbc.Driver");
Connection conn = DriverManager.getConnection(url, user, password);
```

### Not Setting Timeouts

```java
// Problematic: Can hang indefinitely
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM large_table");

// Solution: Set query timeout
Statement stmt = connection.createStatement();
stmt.setQueryTimeout(60); // 60 seconds
ResultSet rs = stmt.executeQuery("SELECT * FROM large_table");
```

### Incorrect ResultSet Processing

```java
// Problem: Accessing closed ResultSet
ResultSet rs = statement.executeQuery(sql);
statement.close(); // Closes associated ResultSet
String value = rs.getString(1); // SQLException: ResultSet is closed

// Solution: Process ResultSet before closing Statement
ResultSet rs = statement.executeQuery(sql);
List<String> values = new ArrayList<>();
while (rs.next()) {
    values.add(rs.getString(1));
}
rs.close();
statement.close();
```

### Inefficient Query Execution

```java
// Inefficient: Multiple queries in loop
for (int id : employeeIds) {
    String sql = "SELECT * FROM employees WHERE id = ?";
    PreparedStatement stmt = connection.prepareStatement(sql);
    stmt.setInt(1, id);
    ResultSet rs = stmt.executeQuery();
    // Process result
}

// Efficient: Single batch query
String sql = "SELECT * FROM employees WHERE id IN (?, ?, ?)";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setInt(1, id1);
stmt.setInt(2, id2);
stmt.setInt(3, id3);
ResultSet rs = stmt.executeQuery();
```

## Performance Considerations

### Connection Pooling Impact

Connection pooling significantly improves performance:

```
Without Pooling:
- Create connection: 100-200ms
- Execute query: 1-10ms
- Close connection: 50-100ms
- Total per operation: 151-310ms

With Connection Pooling:
- Get connection from pool: 1-2ms
- Execute query: 1-10ms
- Return connection to pool: 1-2ms
- Total per operation: 3-14ms
```

### Batch Processing Performance

```java
// Single insert: 100 queries * 10ms = 1000ms
for (Employee emp : employees) {
    String sql = "INSERT INTO employees (name, email) VALUES (?, ?)";
    PreparedStatement stmt = connection.prepareStatement(sql);
    stmt.setString(1, emp.getName());
    stmt.setString(2, emp.getEmail());
    stmt.executeUpdate(); // 10ms each
}

// Batch insert: ~100ms (100x faster)
String sql = "INSERT INTO employees (name, email) VALUES (?, ?)";
PreparedStatement stmt = connection.prepareStatement(sql);
for (Employee emp : employees) {
    stmt.setString(1, emp.getName());
    stmt.setString(2, emp.getEmail());
    stmt.addBatch();
}
stmt.executeBatch(); // Single round-trip
```

### Fetch Size Optimization

```java
// Tune fetch size for better performance
Statement stmt = connection.createStatement();
stmt.setFetchSize(1000); // Fetch 1000 rows at a time

ResultSet rs = stmt.executeQuery("SELECT * FROM large_table");
while (rs.next()) {
    // Process rows
}
```

### Connection Pool Sizing

```
Formula: pool_size = Nthreads * (1 + (W/C))

Where:
- Nthreads = number of application threads
- W = average wait time for I/O
- C = average computation time

Example:
- 8 threads
- Wait time (IO): 100ms
- Computation time: 10ms
- pool_size = 8 * (1 + (100/10)) = 8 * 11 = 88

But practical limits: 20-40 for most applications
```

### Query Optimization

```java
// Inefficient: SELECT *
String sql = "SELECT * FROM employees";

// Efficient: Select only needed columns
String sql = "SELECT id, name, email FROM employees";

// Inefficient: No WHERE clause
String sql = "SELECT * FROM orders";

// Efficient: Filter results
String sql = "SELECT * FROM orders WHERE created_date > ?";
```

### Lazy Loading vs Eager Loading

```java
// Lazy loading: Load data on demand
public class User {
    private int id;
    private String name;
    private List<Order> orders; // Loaded when accessed

    public List<Order> getOrders() {
        if (orders == null) {
            orders = loadOrders(); // Load from database
        }
        return orders;
    }
}

// Eager loading: Load all data upfront
public List<User> loadUsersWithOrders() {
    String sql = """
        SELECT u.*, o.* FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
    """;
    // More efficient for bulk operations
}
```

## Real-world Scenarios

### Scenario 1: E-commerce Order Processing

```java
public class OrderService {
    private DataSource dataSource;

    public Order createOrder(int customerId, List<OrderItem> items) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            try {
                // Insert order
                String orderSQL = "INSERT INTO orders (customer_id, status, created_at) VALUES (?, ?, ?)";
                int orderId;
                try (PreparedStatement stmt = conn.prepareStatement(orderSQL, Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setInt(1, customerId);
                    stmt.setString(2, "PENDING");
                    stmt.setTimestamp(3, new java.sql.Timestamp(System.currentTimeMillis()));
                    stmt.executeUpdate();

                    try (ResultSet rs = stmt.getGeneratedKeys()) {
                        rs.next();
                        orderId = rs.getInt(1);
                    }
                }

                // Insert order items
                String itemSQL = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(itemSQL)) {
                    for (OrderItem item : items) {
                        stmt.setInt(1, orderId);
                        stmt.setInt(2, item.getProductId());
                        stmt.setInt(3, item.getQuantity());
                        stmt.setDouble(4, item.getPrice());
                        stmt.addBatch();
                    }
                    stmt.executeBatch();
                }

                // Update inventory
                String inventorySQL = "UPDATE products SET stock = stock - ? WHERE id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(inventorySQL)) {
                    for (OrderItem item : items) {
                        stmt.setInt(1, item.getQuantity());
                        stmt.setInt(2, item.getProductId());
                        stmt.addBatch();
                    }
                    stmt.executeBatch();
                }

                conn.commit();

                // Retrieve and return complete order
                return getOrder(orderId);

            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    private Order getOrder(int orderId) throws SQLException {
        String sql = "SELECT * FROM orders WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRowToOrder(rs);
                }
            }
        }
        return null;
    }

    private Order mapRowToOrder(ResultSet rs) throws SQLException {
        return new Order(
            rs.getInt("id"),
            rs.getInt("customer_id"),
            rs.getString("status"),
            rs.getTimestamp("created_at").toLocalDateTime()
        );
    }
}
```

### Scenario 2: User Authentication with Salt and Hash

```java
public class AuthenticationService {
    private DataSource dataSource;

    public boolean authenticate(String username, String password) throws SQLException {
        String sql = "SELECT password_hash, salt FROM users WHERE username = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, username);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    return false; // User not found
                }

                String storedHash = rs.getString("password_hash");
                String salt = rs.getString("salt");

                // Hash input password with stored salt
                String inputHash = hashPassword(password, salt);

                return storedHash.equals(inputHash);
            }
        }
    }

    public void registerUser(String username, String email, String password) throws SQLException {
        String salt = generateSalt();
        String hash = hashPassword(password, salt);

        String sql = "INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, username);
            stmt.setString(2, email);
            stmt.setString(3, hash);
            stmt.setString(4, salt);
            stmt.executeUpdate();

        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) { // Duplicate key
                throw new SQLException("Username already exists");
            }
            throw e;
        }
    }

    private String generateSalt() {
        // Implementation using SecureRandom
        return java.util.Base64.getEncoder().encodeToString(
            new byte[16] // 16 random bytes
        );
    }

    private String hashPassword(String password, String salt) {
        // Implementation using PBKDF2 or bcrypt
        return password; // Simplified
    }
}
```

### Scenario 3: Analytics and Reporting

```java
public class AnalyticsService {
    private DataSource dataSource;

    public Map<String, Integer> getMonthlySales(int year) throws SQLException {
        Map<String, Integer> results = new LinkedHashMap<>();

        String sql = """
            SELECT
                DATE_FORMAT(order_date, '%M') as month,
                SUM(amount) as total_sales
            FROM orders
            WHERE YEAR(order_date) = ?
            GROUP BY MONTH(order_date)
            ORDER BY MONTH(order_date)
        """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, year);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String month = rs.getString("month");
                    int sales = rs.getInt("total_sales");
                    results.put(month, sales);
                }
            }
        }

        return results;
    }

    public List<ProductStats> getTopSellingProducts(int limit) throws SQLException {
        List<ProductStats> stats = new ArrayList<>();

        String sql = """
            SELECT
                p.id,
                p.name,
                COUNT(oi.id) as order_count,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.quantity * oi.price) as revenue
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT ?
        """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, limit);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    stats.add(new ProductStats(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getInt("order_count"),
                        rs.getInt("total_quantity"),
                        rs.getDouble("revenue")
                    ));
                }
            }
        }

        return stats;
    }
}

class ProductStats {
    int id;
    String name;
    int orderCount;
    int totalQuantity;
    double revenue;

    ProductStats(int id, String name, int orderCount, int totalQuantity, double revenue) {
        this.id = id;
        this.name = name;
        this.orderCount = orderCount;
        this.totalQuantity = totalQuantity;
        this.revenue = revenue;
    }
}
```

## Interview Points

### Explain JDBC Architecture

**Answer**: JDBC follows a layered architecture:
- Application Layer: Your Java code
- JDBC API: Standard interfaces in java.sql package
- JDBC Driver Manager: Loads and manages drivers
- JDBC Driver: Database-specific implementation
- Database: The actual data storage

This separation allows database-agnostic code.

### What are JDBC Driver Types?

**Answer**:
- **Type 1 (Bridge)**: Uses ODBC (deprecated)
- **Type 2 (Native)**: Uses native database libraries
- **Type 3 (Middleware)**: Uses middleware servers
- **Type 4 (Pure Java)**: Pure Java implementation (most common, recommended)

### How do you prevent SQL Injection?

**Answer**: Use PreparedStatement instead of string concatenation:
```java
// Safe
String sql = "SELECT * FROM users WHERE email = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setString(1, userEmail);

// Unsafe
String sql = "SELECT * FROM users WHERE email = '" + userEmail + "'";
```

PreparedStatements use parameterized queries where placeholders are separated from SQL, preventing malicious input from being interpreted as code.

### What is Connection Pooling and why is it important?

**Answer**: Connection pooling maintains a pool of reusable database connections rather than creating new ones for each request.

**Benefits**:
- Reduces connection overhead (100-200ms per connection)
- Improves application performance
- Manages connection lifecycle
- Prevents resource exhaustion
- Enables connection monitoring and timeout management

### Explain the difference between Statement and PreparedStatement

**Answer**:
- **Statement**: For simple, one-time queries
  - No parameter binding
  - Vulnerable to SQL injection
  - Less efficient for repeated use

- **PreparedStatement**: For parameterized queries
  - Supports parameter binding
  - Protects against SQL injection
  - Better performance (pre-compiled)
  - Reusable for multiple executions

### What happens if you don't close database resources?

**Answer**: Resource leaks occur:
- **Connection Leaks**: Exhausts connection pool, causing new requests to fail or hang
- **Statement Leaks**: Consumes memory
- **ResultSet Leaks**: Prevents garbage collection
- **Solution**: Use try-with-resources for automatic closure

### How do you handle transactions in JDBC?

**Answer**:
```java
try {
    connection.setAutoCommit(false);
    // Execute multiple statements
    connection.commit(); // Save changes
} catch (SQLException e) {
    connection.rollback(); // Undo changes
}
```

Transactions ensure ACID properties: Atomicity, Consistency, Isolation, Durability.

### What is the difference between executeQuery, executeUpdate, and execute?

**Answer**:
- **executeQuery()**: Returns ResultSet, used for SELECT statements
- **executeUpdate()**: Returns int (rows affected), used for INSERT/UPDATE/DELETE
- **execute()**: Returns boolean, used for mixed operations or stored procedures

### Explain Batch Processing and its benefits

**Answer**: Batch processing executes multiple SQL statements together:
```java
PreparedStatement stmt = connection.prepareStatement(sql);
for (Data data : dataList) {
    stmt.setObject(...);
    stmt.addBatch();
}
stmt.executeBatch(); // Single round-trip
```

**Benefits**:
- Reduces network round-trips (1 instead of N)
- Significantly faster (10-100x)
- Reduces database overhead
- Better for bulk operations

### What are common JDBC exceptions and how do you handle them?

**Answer**:
- **SQLException**: General database error
- **SQLWarning**: Database warning
- **BatchUpdateException**: Batch operation failure

Handle with:
```java
catch (SQLException e) {
    int errorCode = e.getErrorCode();
    String sqlState = e.getSQLState();
    // Log and handle based on error code/state
}
```

## Further Reading

### JDBC Documentation and Resources

1. **Official JDBC Documentation**
   - Java Documentation: https://docs.oracle.com/javase/8/docs/technotes/guides/jdbc/
   - JDBC API Specification

2. **Connection Pooling Libraries**
   - HikariCP: https://github.com/brettwooldridge/HikariCP
   - Apache DBCP2: https://commons.apache.org/proper/commons-dbcp/
   - C3P0: https://www.mchange.com/projects/c3p0/

3. **ORM Frameworks (Advanced)**
   - Hibernate: https://hibernate.org/
   - MyBatis: https://mybatis.org/
   - JPA/EclipseLink: https://www.eclipse.org/eclipselink/

4. **Database Drivers**
   - MySQL Connector/J: https://dev.mysql.com/downloads/connector/j/
   - PostgreSQL JDBC: https://jdbc.postgresql.org/
   - Oracle JDBC: https://www.oracle.com/database/technologies/appdev/jdbc.html
   - SQL Server JDBC: https://docs.microsoft.com/en-us/sql/connect/jdbc/microsoft-jdbc-driver-for-sql-server

5. **Best Practices Articles**
   - JDBC Best Practices Guide
   - Database Connection Management
   - SQL Injection Prevention
   - Performance Tuning for JDBC

### Key Takeaways

1. **Always use try-with-resources** for automatic resource management
2. **Use PreparedStatement** to prevent SQL injection and improve performance
3. **Implement connection pooling** for production applications
4. **Set appropriate timeouts** to prevent hanging connections
5. **Use batch processing** for bulk operations
6. **Handle exceptions properly** with specific error handling
7. **Use parameterized queries** to separate data from SQL code
8. **Monitor and optimize** database performance
9. **Test database operations** thoroughly
10. **Consider ORM frameworks** for complex applications

---

Last Updated: 2026-01-07
