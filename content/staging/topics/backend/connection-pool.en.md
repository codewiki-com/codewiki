---
title: Database Connection Pooling
description: Understand and optimize database connection pool configuration
track: backend
section: databases
difficulty: intermediate
tags:
  - connection pool
  - HikariCP
  - database
  - performance
status: imported
origin: old/src/content/docs/backend/connection-pool.en.md
divergence: 0.304
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 29
  lastUpdated: 2026-01-07
---

## Introduction

Database connection pooling is a technique used to maintain a cache of database connections that can be reused for future requests, rather than creating a new connection for each database operation. This optimization is fundamental to building high-performance, scalable applications that interact with databases.

### Why Connection Pooling Matters

Creating a database connection is an expensive operation involving:

1. **TCP/IP Handshake**: Establishing network connectivity between application and database server
2. **Authentication**: Validating credentials against the database security system
3. **Session Initialization**: Allocating server-side resources and setting session parameters
4. **SSL/TLS Negotiation**: When encryption is enabled, additional handshake overhead occurs

A typical database connection establishment takes 20-100 milliseconds, while a pooled connection retrieval takes less than 1 millisecond. For applications handling thousands of requests per second, this difference is critical.

### The Connection Pool Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Connection Pool                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Conn 1  │  │  Conn 2  │  │  Conn 3  │  │  Conn N  │        │
│  │  (idle)  │  │  (busy)  │  │  (idle)  │  │  (idle)  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
        │                │                │
        ▼                ▼                ▼
   Application      Application      Application
   Thread 1         Thread 2         Thread 3
```

---

## Pool Sizing Strategies

Proper pool sizing is crucial for optimal performance. An undersized pool leads to connection starvation and increased latency, while an oversized pool wastes resources and can actually degrade database performance.

### The Pool Size Formula

A commonly referenced formula for calculating optimal pool size is:

```
Pool Size = (Core Count × 2) + Effective Spindle Count
```

For SSD-based systems or cloud databases, this simplifies to:

```
Pool Size = (Core Count × 2) + 1
```

However, this formula is a starting point, not a definitive answer. The optimal size depends on your specific workload characteristics.

### Factors Affecting Pool Size

**1. Query Duration**

Longer-running queries require more connections to maintain throughput:

```
Required Connections = (Requests/sec) × (Average Query Duration in seconds)
```

For example, if you handle 100 requests/second with an average query time of 50ms:

```
Required Connections = 100 × 0.05 = 5 connections minimum
```

**2. Database Server Capacity**

Each database connection consumes server memory (typically 5-10MB per connection in PostgreSQL). A database server with 16GB RAM dedicated to connections can handle roughly:

```
Max Connections = 16GB / 10MB = ~1,600 connections
```

This must be shared across all application instances.

**3. Concurrent Application Instances**

If you run 10 application instances, each pool should be sized:

```
Pool Size per Instance = Total DB Connections / Number of Instances
```

### Minimum vs Maximum Pool Size

Most connection pools have configurable minimum and maximum sizes:

| Setting | Purpose | Recommendation |
|---------|---------|----------------|
| minimumIdle | Connections to maintain when idle | Set equal to maximumPoolSize for consistent performance |
| maximumPoolSize | Hard limit on connections | Start small (10-20), tune based on monitoring |

**Why Equal Min and Max?**

Setting `minimumIdle` equal to `maximumPoolSize` ensures:
- No latency spikes from connection creation during load
- Predictable resource consumption
- Faster response to traffic bursts

```java
// HikariCP recommended configuration
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(10);
config.setMinimumIdle(10);  // Same as max for predictable performance
```

---

## HikariCP Configuration

HikariCP is the fastest and most reliable JDBC connection pool, now the default in Spring Boot. Its design prioritizes simplicity, reliability, and performance.

### Basic Configuration

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class DatabaseConfig {

    public HikariDataSource createDataSource() {
        HikariConfig config = new HikariConfig();

        // Essential settings
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/mydb");
        config.setUsername("dbuser");
        config.setPassword("dbpass");
        config.setDriverClassName("org.postgresql.Driver");

        // Pool sizing
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(10);

        // Timeout settings
        config.setConnectionTimeout(30000);     // 30 seconds
        config.setIdleTimeout(600000);          // 10 minutes
        config.setMaxLifetime(1800000);         // 30 minutes

        // Validation
        config.setValidationTimeout(5000);      // 5 seconds

        // Performance
        config.setPoolName("MyAppPool");
        config.setRegisterMbeans(true);         // Enable JMX monitoring

        return new HikariDataSource(config);
    }
}
```

### Spring Boot Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: dbuser
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver

    hikari:
      pool-name: MyAppPool
      maximum-pool-size: 10
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      validation-timeout: 5000
      leak-detection-threshold: 60000
      register-mbeans: true

      # Connection test query (optional, prefer isValid())
      # connection-test-query: SELECT 1

      # Database-specific optimizations
      data-source-properties:
        cachePrepStmts: true
        prepStmtCacheSize: 250
        prepStmtCacheSqlLimit: 2048
        useServerPrepStmts: true
```

### Critical Configuration Parameters

**connectionTimeout**

Maximum time to wait for a connection from the pool. If exceeded, a `SQLTransientConnectionException` is thrown.

```java
// Default: 30000 (30 seconds)
config.setConnectionTimeout(30000);
```

Recommendation: Keep between 10-30 seconds. Shorter timeouts help fail-fast during outages.

**idleTimeout**

Time a connection can remain idle before being removed from the pool. Only applies when `minimumIdle` is less than `maximumPoolSize`.

```java
// Default: 600000 (10 minutes)
config.setIdleTimeout(600000);
```

**maxLifetime**

Maximum lifetime of a connection in the pool. HikariCP will close connections that exceed this time to prevent stale connections.

```java
// Default: 1800000 (30 minutes)
config.setMaxLifetime(1800000);
```

Important: Set this value several seconds shorter than any database or network timeout:

```java
// If database timeout is 300 seconds (5 minutes)
// Set maxLifetime to 290 seconds
config.setMaxLifetime(290000);
```

**leakDetectionThreshold**

Time before HikariCP logs a warning about potential connection leaks:

```java
// Disabled by default (0)
// Enable for development/staging
config.setLeakDetectionThreshold(60000);  // 1 minute
```

### Database-Specific Settings

**PostgreSQL Optimization**

```yaml
spring:
  datasource:
    hikari:
      data-source-properties:
        # Enable prepared statement caching
        preparedStatementCacheQueries: 256
        preparedStatementCacheSizeMiB: 5

        # Socket timeout
        socketTimeout: 30

        # Application name for monitoring
        ApplicationName: MyApp
```

**MySQL Optimization**

```yaml
spring:
  datasource:
    hikari:
      data-source-properties:
        cachePrepStmts: true
        prepStmtCacheSize: 250
        prepStmtCacheSqlLimit: 2048
        useServerPrepStmts: true
        useLocalSessionState: true
        rewriteBatchedStatements: true
        cacheResultSetMetadata: true
        cacheServerConfiguration: true
        elideSetAutoCommits: true
        maintainTimeStats: false
```

---

## Connection Pool Monitoring

Effective monitoring is essential for maintaining healthy connection pools and diagnosing performance issues.

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Active Connections | Currently borrowed connections | > 80% of max |
| Idle Connections | Available connections in pool | < 20% of max |
| Pending Threads | Threads waiting for connection | > 0 sustained |
| Connection Acquisition Time | Time to get connection from pool | > 100ms average |
| Connection Creation Time | Time to create new connection | > 500ms |
| Connection Timeout Rate | Failed connection acquisitions | Any occurrence |

### JMX Monitoring with HikariCP

Enable JMX by setting `registerMbeans` to true:

```java
config.setRegisterMbeans(true);
config.setPoolName("MyAppPool");  // Important for identifying the pool
```

Access metrics via JMX MBeans:

```
com.zaxxer.hikari:type=Pool (MyAppPool)
├── ActiveConnections
├── IdleConnections
├── TotalConnections
├── ThreadsAwaitingConnection
└── ...
```

### Micrometer Integration

```java
import io.micrometer.core.instrument.MeterRegistry;

@Configuration
public class MetricsConfig {

    @Bean
    public HikariDataSource dataSource(MeterRegistry registry) {
        HikariDataSource ds = new HikariDataSource(hikariConfig());
        ds.setMetricRegistry(registry);
        return ds;
    }
}
```

This exposes metrics to Prometheus, Datadog, or other monitoring systems:

```
# HELP hikaricp_connections_active Active connections
# TYPE hikaricp_connections_active gauge
hikaricp_connections_active{pool="MyAppPool"} 5.0

# HELP hikaricp_connections_pending Pending threads
# TYPE hikaricp_connections_pending gauge
hikaricp_connections_pending{pool="MyAppPool"} 0.0

# HELP hikaricp_connections_acquire_seconds Connection acquire time
# TYPE hikaricp_connections_acquire_seconds summary
hikaricp_connections_acquire_seconds_sum{pool="MyAppPool"} 0.123
```

### Grafana Dashboard Example

Key panels for a connection pool dashboard:

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Active vs Total    │  Pending Threads    │  Acquisition Time   │
│  ▓▓▓▓▓░░░░░ 50%    │  ─────────────       │  p50: 1ms           │
│  5/10 connections   │  0 waiting          │  p99: 15ms          │
└─────────────────────┴─────────────────────┴─────────────────────┘
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Connection Rate    │  Timeout Events     │  Connection Errors  │
│  Created: 2/hr      │  Last 24h: 0        │  Last 24h: 0        │
│  Closed: 2/hr       │                     │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### Logging Configuration

Enable HikariCP debug logging for troubleshooting:

```yaml
# logback-spring.xml
<logger name="com.zaxxer.hikari" level="DEBUG"/>
<logger name="com.zaxxer.hikari.HikariConfig" level="DEBUG"/>

# Or in application.yml
logging:
  level:
    com.zaxxer.hikari: DEBUG
    com.zaxxer.hikari.HikariConfig: DEBUG
```

---

## Common Issues and Solutions

### Connection Leaks

**Symptoms:**
- Pool exhaustion over time
- `connectionTimeout` exceptions
- Active connections equal to max with no pending queries

**Causes:**
- Not closing connections in finally blocks
- Exceptions preventing connection return
- Connections held across long operations

**Solution:**

Always use try-with-resources:

```java
// Correct: Auto-closes connection
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql);
     ResultSet rs = ps.executeQuery()) {

    while (rs.next()) {
        // Process results
    }
}

// Incorrect: Connection might not be closed
Connection conn = dataSource.getConnection();
PreparedStatement ps = conn.prepareStatement(sql);
ResultSet rs = ps.executeQuery();
// If exception occurs here, connection leaks!
conn.close();
```

Enable leak detection during development:

```java
config.setLeakDetectionThreshold(30000);  // 30 seconds
```

### Connection Timeout Exhaustion

**Symptoms:**
- Intermittent `SQLTransientConnectionException`
- High thread wait times
- Application unresponsiveness under load

**Causes:**
- Pool too small for workload
- Slow queries holding connections
- Transaction scope too large

**Solution:**

1. Increase pool size (if database can handle it):
```java
config.setMaximumPoolSize(20);  // Increase from 10
```

2. Optimize slow queries:
```sql
-- Add indexes, optimize query plan
EXPLAIN ANALYZE SELECT * FROM large_table WHERE unindexed_column = 'value';
```

3. Reduce transaction scope:
```java
// Bad: Long transaction
@Transactional
public void processAllOrders() {
    List<Order> orders = orderRepository.findAll();  // Connection held
    for (Order order : orders) {
        externalService.process(order);  // Slow external call
        orderRepository.save(order);
    }
}

// Good: Short transactions
public void processAllOrders() {
    List<Long> orderIds = orderRepository.findAllIds();
    for (Long orderId : orderIds) {
        processOrder(orderId);  // Each call gets its own transaction
    }
}

@Transactional
public void processOrder(Long orderId) {
    Order order = orderRepository.findById(orderId);
    externalService.process(order);
    orderRepository.save(order);
}
```

### Connection Validation Failures

**Symptoms:**
- `Connection is closed` exceptions
- Intermittent query failures after idle periods
- Errors after network blips

**Causes:**
- Firewall closing idle connections
- Database server restarting
- Network timeouts shorter than pool idle timeout

**Solution:**

Configure proper connection validation:

```java
// HikariCP validates connections automatically using isValid()
// Additional settings for problematic environments:

// Ensure connections are valid before use
config.setConnectionTestQuery("SELECT 1");  // Only if isValid() unavailable

// Close connections before network timeout (e.g., firewall 5-minute timeout)
config.setMaxLifetime(240000);  // 4 minutes
config.setIdleTimeout(120000);  // 2 minutes

// Keep connections fresh with periodic validation
config.setKeepaliveTime(120000);  // HikariCP 4.0+
```

### Pool Exhaustion During Deployment

**Symptoms:**
- New instances cannot acquire connections
- Existing instances have full pools
- Database connection limit reached

**Causes:**
- Too many application instances
- Pool size not adjusted for scale
- Database max_connections too low

**Solution:**

Calculate total connections across all instances:

```
Total Pool Size = Instances × Pool Size per Instance

Example:
- 20 application instances
- 10 connections per pool
- Total: 200 database connections needed
```

Adjust database limits:

```sql
-- PostgreSQL
ALTER SYSTEM SET max_connections = 300;

-- MySQL
SET GLOBAL max_connections = 300;
```

Use connection pool per-instance scaling:

```yaml
# Scale pool size based on total instances
spring:
  datasource:
    hikari:
      maximum-pool-size: ${POOL_SIZE:10}  # Override per deployment
```

---

## Tuning for Different Workloads

### OLTP (Online Transaction Processing)

Characteristics: High volume of short, simple transactions.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 20
      connection-timeout: 10000      # Fast fail
      idle-timeout: 300000           # 5 minutes
      max-lifetime: 1200000          # 20 minutes
      validation-timeout: 3000
```

Key considerations:
- Smaller pool with fast connections
- Short transaction timeouts
- Enable prepared statement caching
- Prioritize low latency over throughput

### OLAP (Online Analytical Processing)

Characteristics: Few long-running analytical queries.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 5           # Fewer connections
      minimum-idle: 2
      connection-timeout: 60000      # Allow wait time
      idle-timeout: 1800000          # 30 minutes
      max-lifetime: 3600000          # 1 hour
      validation-timeout: 10000
```

Key considerations:
- Smaller pool (queries are long-running)
- Longer timeouts for complex queries
- May need separate pool from OLTP workload

### Mixed Workloads

Use separate connection pools for different workload types:

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.oltp")
    public DataSource oltpDataSource() {
        return DataSourceBuilder.create()
            .type(HikariDataSource.class)
            .build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.olap")
    public DataSource olapDataSource() {
        return DataSourceBuilder.create()
            .type(HikariDataSource.class)
            .build();
    }
}
```

```yaml
spring:
  datasource:
    oltp:
      hikari:
        pool-name: OLTPPool
        maximum-pool-size: 20
        connection-timeout: 10000
    olap:
      hikari:
        pool-name: OLAPPool
        maximum-pool-size: 5
        connection-timeout: 60000
```

### Batch Processing

Characteristics: Large data volumes, bulk operations.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      max-lifetime: 3600000          # 1 hour for long batches

      data-source-properties:
        rewriteBatchedStatements: true    # MySQL
        defaultRowFetchSize: 1000         # PostgreSQL
```

Key considerations:
- Enable batch statement rewriting
- Configure appropriate fetch sizes
- Consider separate pool for batch jobs
- May need longer max-lifetime for long-running batches

### Microservices with Many Instances

When running many small instances:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: ${POOL_SIZE:3}   # Very small per instance
      minimum-idle: ${POOL_SIZE:3}
      connection-timeout: 20000
```

Calculate based on total capacity:

```
Database max_connections: 200
Reserved for admin/monitoring: 20
Available for apps: 180
Number of instances: 60
Pool size per instance: 180 / 60 = 3
```

---

## Alternative Connection Pools

While HikariCP is the recommended choice for most Java applications, other pools have specific use cases.

### Apache DBCP2

Mature, feature-rich pool with extensive configuration options.

```java
BasicDataSource ds = new BasicDataSource();
ds.setUrl("jdbc:postgresql://localhost:5432/mydb");
ds.setUsername("user");
ds.setPassword("pass");
ds.setInitialSize(5);
ds.setMaxTotal(20);
ds.setMaxIdle(10);
ds.setMinIdle(5);
ds.setMaxWaitMillis(10000);
ds.setValidationQuery("SELECT 1");
ds.setTestOnBorrow(true);
```

### c3p0

One of the oldest Java connection pools, still used in legacy applications.

```java
ComboPooledDataSource ds = new ComboPooledDataSource();
ds.setJdbcUrl("jdbc:postgresql://localhost:5432/mydb");
ds.setUser("user");
ds.setPassword("pass");
ds.setMinPoolSize(5);
ds.setMaxPoolSize(20);
ds.setAcquireIncrement(5);
ds.setMaxIdleTime(300);
```

### Node.js: pg-pool

For PostgreSQL with Node.js:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'dbuser',
  password: 'dbpass',
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000,
  maxUses: 7500,              // Close after N uses (prevent memory leaks)
});

// Use the pool
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// Pool events for monitoring
pool.on('connect', (client) => {
  console.log('New connection created');
});

pool.on('acquire', (client) => {
  console.log('Connection acquired from pool');
});

pool.on('error', (err, client) => {
  console.error('Pool error:', err);
});
```

### Python: SQLAlchemy with Connection Pooling

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:pass@localhost:5432/mydb',
    poolclass=QueuePool,
    pool_size=10,           # Number of connections to maintain
    max_overflow=20,        # Additional connections during peak
    pool_timeout=30,        # Seconds to wait for connection
    pool_recycle=1800,      # Recycle connections after 30 minutes
    pool_pre_ping=True,     # Verify connection before use
)

# Use the engine
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users"))
```

---

## Best Practices Summary

### Configuration Checklist

1. **Set minimum equal to maximum pool size** for predictable performance
2. **Configure max-lifetime shorter than database timeout** to prevent stale connections
3. **Enable leak detection** in development and staging environments
4. **Enable JMX or metrics** for production monitoring
5. **Use prepared statement caching** for improved query performance

### Code Practices

1. **Always use try-with-resources** to ensure connection cleanup
2. **Keep transactions short** to minimize connection hold time
3. **Avoid holding connections during external calls** or user interactions
4. **Use read replicas** to distribute read workload
5. **Consider separate pools** for different workload types

### Operational Practices

1. **Monitor active connections and wait times** as primary health indicators
2. **Set alerts for pool exhaustion** (pending threads > 0 sustained)
3. **Review and tune pool size** based on actual usage patterns
4. **Document connection budget** across all application instances
5. **Test connection failure scenarios** to ensure graceful degradation

---

## Conclusion

Database connection pooling is a critical optimization for any application that interacts with databases. Proper configuration requires understanding your workload characteristics, database capacity, and application scaling requirements.

Key takeaways:

- **Start small and tune based on monitoring** rather than guessing pool sizes
- **HikariCP is the recommended choice** for Java applications due to its performance and reliability
- **Match pool configuration to workload type** (OLTP, OLAP, batch, mixed)
- **Monitor continuously** and set up alerts for pool exhaustion
- **Write defensive code** that properly releases connections back to the pool

With proper connection pool configuration and monitoring, you can achieve optimal database performance while efficiently utilizing resources. Remember that the best configuration is workload-specific, so continue to monitor and adjust as your application evolves.
