---
title: 数据库连接池
description: 理解和优化数据库连接池配置
track: backend
section: databases
difficulty: intermediate
tags:
  - 连接池
  - HikariCP
  - 数据库
  - 性能优化
status: imported
origin: old/src/content/docs/backend/connection-pool.zh.md
divergence: 0.304
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 29
  lastUpdated: 2026-01-07
---

数据库连接池是现代后端系统中不可或缺的组件。它通过复用数据库连接来提升性能、降低资源消耗，并有效管理数据库连接的生命周期。本文将深入探讨连接池的原理、配置策略以及各种调优技巧。

## 为什么需要连接池

### 数据库连接的开销

创建数据库连接是一个昂贵的操作，涉及多个步骤：

```
数据库连接建立过程：
┌─────────────────────────────────────────────────────────────┐
│ 1. TCP 三次握手                    (~1-3 ms)                │
│ 2. SSL/TLS 握手（如启用）           (~10-30 ms)             │
│ 3. 数据库认证                       (~5-20 ms)              │
│ 4. 会话初始化                       (~1-5 ms)               │
│ 5. 分配数据库资源（内存、线程等）    (~1-2 ms)               │
├─────────────────────────────────────────────────────────────┤
│ 总计：每次连接需要 20-60 ms                                  │
└─────────────────────────────────────────────────────────────┘
```

### 没有连接池的问题

```java
// 反模式：每次请求创建新连接
public User getUserById(Long id) {
    Connection conn = null;
    try {
        // 每次都创建新连接 - 性能差！
        conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb",
            "user",
            "password"
        );

        PreparedStatement stmt = conn.prepareStatement(
            "SELECT * FROM users WHERE id = ?"
        );
        stmt.setLong(1, id);
        ResultSet rs = stmt.executeQuery();

        if (rs.next()) {
            return mapToUser(rs);
        }
        return null;
    } finally {
        // 用完就关闭
        if (conn != null) {
            conn.close();
        }
    }
}
```

这种方式的问题：

```
性能问题分析：
┌────────────────────────────────────────────────────────────────┐
│ 问题                    │ 影响                                  │
├────────────────────────────────────────────────────────────────┤
│ 连接建立开销大          │ 响应时间增加 20-60ms                   │
│ 频繁创建/销毁           │ 数据库服务器压力大                     │
│ 连接数不可控            │ 高并发时可能耗尽数据库连接              │
│ 资源浪费               │ 内存、文件描述符等资源频繁分配释放        │
│ 无法复用               │ 每个请求都要重新认证和初始化             │
└────────────────────────────────────────────────────────────────┘
```

### 连接池的工作原理

```
连接池架构：
                                    ┌─────────────────┐
                                    │   数据库服务器   │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
              ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐
              │   连接1   │           │   连接2   │           │   连接3   │
              │  (空闲)   │           │  (使用中)  │           │  (空闲)   │
              └─────┬─────┘           └─────┬─────┘           └─────┴─────┘
                    │                       │                        │
                    └───────────────┬───────┴────────────────────────┘
                                    │
                           ┌────────┴────────┐
                           │    连接池管理器   │
                           │  - 连接分配      │
                           │  - 健康检查      │
                           │  - 超时管理      │
                           └────────┬────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────┴────┐                 ┌────┴────┐                 ┌────┴────┐
   │ 请求 1  │                 │ 请求 2  │                 │ 请求 3  │
   └─────────┘                 └─────────┘                 └─────────┘
```

### 使用连接池后

```java
// 正确方式：使用连接池
@Service
public class UserService {

    @Autowired
    private DataSource dataSource; // HikariCP 连接池

    public User getUserById(Long id) {
        // 从连接池借用连接（通常 < 1ms）
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "SELECT * FROM users WHERE id = ?"
            );
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapToUser(rs);
            }
            return null;
        } // try-with-resources 自动将连接归还池中
    }
}
```

## 连接池大小策略

### 常见误区

很多开发者认为连接池越大越好，这是一个严重的误解。

```
❌ 错误观念：连接池越大，并发能力越强
✓ 正确理解：连接池大小需要根据实际负载精确计算
```

### 连接池大小公式

PostgreSQL 官方推荐的公式：

```
连接池大小 = (核心数 * 2) + 有效磁盘数

示例计算：
- 4 核 CPU + 1 块 SSD
- 连接池大小 = (4 * 2) + 1 = 9
```

### 为什么小池更高效

```java
// 性能测试对比
public class ConnectionPoolBenchmark {

    /*
     * 测试环境：4核CPU，SSD存储
     * 并发线程：10000
     * 查询类型：简单SELECT
     *
     * 结果：
     * ┌──────────────────────────────────────────────────┐
     * │ 连接池大小 │ 平均响应时间 │ 吞吐量 (TPS)         │
     * ├──────────────────────────────────────────────────┤
     * │ 10        │ 25 ms       │ 40,000               │
     * │ 50        │ 35 ms       │ 28,571               │
     * │ 100       │ 55 ms       │ 18,182               │
     * │ 200       │ 120 ms      │ 8,333                │
     * └──────────────────────────────────────────────────┘
     *
     * 原因分析：
     * - 更多连接意味着更多上下文切换
     * - 数据库内部锁竞争加剧
     * - 缓存命中率下降
     * - I/O 队列深度增加
     */
}
```

### 不同场景的配置建议

```yaml
# Web应用 - 短查询为主
web-application:
  minimumIdle: 5
  maximumPoolSize: 10
  connectionTimeout: 3000    # 3秒获取连接超时
  idleTimeout: 600000        # 10分钟空闲超时

# 批处理应用 - 长事务
batch-processing:
  minimumIdle: 2
  maximumPoolSize: 5
  connectionTimeout: 30000   # 30秒获取连接超时
  maxLifetime: 1800000       # 30分钟最大生命周期

# 高并发API服务
high-concurrency-api:
  minimumIdle: 10
  maximumPoolSize: 20
  connectionTimeout: 1000    # 1秒快速失败
  validationTimeout: 500     # 500ms验证超时

# 混合负载
mixed-workload:
  minimumIdle: 5
  maximumPoolSize: 15
  connectionTimeout: 5000
  leakDetectionThreshold: 30000  # 30秒泄漏检测
```

## HikariCP 配置详解

HikariCP 是目前 Java 生态中性能最好的连接池，Spring Boot 2.x 默认使用。

### 基础配置

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=true&serverTimezone=UTC
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

    hikari:
      # 连接池名称，用于日志和JMX
      pool-name: MyAppPool

      # 最大连接数
      maximum-pool-size: 10

      # 最小空闲连接数
      minimum-idle: 5

      # 连接超时时间（毫秒）
      connection-timeout: 30000

      # 空闲连接超时时间（毫秒）
      idle-timeout: 600000

      # 连接最大存活时间（毫秒）
      max-lifetime: 1800000

      # 连接验证超时时间（毫秒）
      validation-timeout: 5000

      # 泄漏检测阈值（毫秒）
      leak-detection-threshold: 60000
```

### 高级配置

```java
@Configuration
public class HikariConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();

        // 基础配置
        ds.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        ds.setUsername("user");
        ds.setPassword("password");

        // 连接池配置
        ds.setPoolName("PrimaryPool");
        ds.setMaximumPoolSize(10);
        ds.setMinimumIdle(5);

        // 连接测试
        ds.setConnectionTestQuery("SELECT 1");

        // 连接初始化SQL
        ds.setConnectionInitSql("SET NAMES utf8mb4");

        // 数据源属性
        ds.addDataSourceProperty("cachePrepStmts", "true");
        ds.addDataSourceProperty("prepStmtCacheSize", "250");
        ds.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        ds.addDataSourceProperty("useServerPrepStmts", "true");
        ds.addDataSourceProperty("useLocalSessionState", "true");
        ds.addDataSourceProperty("rewriteBatchedStatements", "true");
        ds.addDataSourceProperty("cacheResultSetMetadata", "true");
        ds.addDataSourceProperty("cacheServerConfiguration", "true");
        ds.addDataSourceProperty("elideSetAutoCommits", "true");
        ds.addDataSourceProperty("maintainTimeStats", "false");

        return ds;
    }
}
```

### 配置参数详解

```
HikariCP 核心参数说明：
┌────────────────────────────────────────────────────────────────────────┐
│ 参数                    │ 说明                    │ 推荐值            │
├────────────────────────────────────────────────────────────────────────┤
│ maximumPoolSize         │ 最大连接数              │ (CPU核数 * 2) + 1 │
│ minimumIdle             │ 最小空闲连接            │ 与最大值相同      │
│ connectionTimeout       │ 等待连接的最大时间       │ 30000 ms         │
│ idleTimeout             │ 空闲连接存活时间         │ 600000 ms        │
│ maxLifetime             │ 连接最大生命周期         │ 1800000 ms       │
│ validationTimeout       │ 连接验证超时时间         │ 5000 ms          │
│ leakDetectionThreshold  │ 连接泄漏检测阈值         │ 60000 ms         │
│ connectionTestQuery     │ 连接测试SQL             │ SELECT 1         │
└────────────────────────────────────────────────────────────────────────┘
```

### minimumIdle 的最佳实践

```java
/*
 * HikariCP 作者推荐：minimumIdle = maximumPoolSize
 *
 * 原因：
 * 1. 避免动态调整连接数的开销
 * 2. 预热连接，减少冷启动延迟
 * 3. 简化配置，减少调优变量
 *
 * 例外情况：
 * - 连接资源非常宝贵
 * - 负载波动非常大
 * - 多个应用共享数据库
 */

// 推荐配置
@Bean
public HikariDataSource dataSource() {
    HikariDataSource ds = new HikariDataSource();
    int poolSize = Runtime.getRuntime().availableProcessors() * 2 + 1;
    ds.setMaximumPoolSize(poolSize);
    ds.setMinimumIdle(poolSize);  // 设置为相同值
    return ds;
}
```

### maxLifetime 配置要点

```java
/*
 * maxLifetime 必须小于数据库的连接超时时间
 *
 * MySQL: wait_timeout 默认 8小时
 * PostgreSQL: idle_in_transaction_session_timeout
 *
 * 建议：maxLifetime = 数据库超时时间 - 30秒
 */

// MySQL 配置示例
HikariDataSource ds = new HikariDataSource();

// 假设 MySQL wait_timeout = 28800 (8小时)
// maxLifetime 应该小于这个值
ds.setMaxLifetime(28770000);  // 略小于8小时

// 更保守的配置（推荐）
ds.setMaxLifetime(1800000);   // 30分钟，定期刷新连接
```

## 连接池监控

### JMX 监控

```java
@Configuration
public class HikariMetricsConfig {

    @Bean
    public HikariDataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        // ... 基础配置

        // 启用JMX监控
        ds.setRegisterMbeans(true);
        ds.setPoolName("MyAppPool");

        return ds;
    }
}

// JMX 监控指标
/*
 * com.zaxxer.hikari:type=Pool (MyAppPool)
 *
 * 关键指标：
 * - ActiveConnections: 当前活跃连接数
 * - IdleConnections: 当前空闲连接数
 * - TotalConnections: 总连接数
 * - ThreadsAwaitingConnection: 等待获取连接的线程数
 * - ConnectionTimeout: 连接获取超时次数
 */
```

### Micrometer 集成

```java
@Configuration
public class HikariMicrometerConfig {

    @Bean
    public HikariDataSource dataSource(MeterRegistry meterRegistry) {
        HikariDataSource ds = new HikariDataSource();
        // ... 基础配置

        // 集成Micrometer
        ds.setMetricRegistry(meterRegistry);

        return ds;
    }
}
```

```yaml
# 暴露Prometheus端点
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

### 关键监控指标

```java
@Component
@Slf4j
public class ConnectionPoolMonitor {

    @Autowired
    private HikariDataSource dataSource;

    @Scheduled(fixedRate = 60000)  // 每分钟检查
    public void monitorPool() {
        HikariPoolMXBean poolMXBean = dataSource.getHikariPoolMXBean();

        int activeConnections = poolMXBean.getActiveConnections();
        int idleConnections = poolMXBean.getIdleConnections();
        int totalConnections = poolMXBean.getTotalConnections();
        int threadsAwaitingConnection = poolMXBean.getThreadsAwaitingConnection();

        // 计算使用率
        double utilizationRate = (double) activeConnections / totalConnections * 100;

        log.info("连接池状态 - 活跃: {}, 空闲: {}, 总计: {}, 等待线程: {}, 使用率: {:.2f}%",
                activeConnections, idleConnections, totalConnections,
                threadsAwaitingConnection, utilizationRate);

        // 告警阈值
        if (utilizationRate > 80) {
            log.warn("连接池使用率过高: {:.2f}%", utilizationRate);
        }

        if (threadsAwaitingConnection > 0) {
            log.warn("存在等待连接的线程: {}", threadsAwaitingConnection);
        }
    }
}
```

### Grafana Dashboard 配置

```json
{
  "panels": [
    {
      "title": "连接池使用率",
      "targets": [
        {
          "expr": "hikaricp_connections_active / hikaricp_connections_max * 100",
          "legendFormat": "使用率 %"
        }
      ]
    },
    {
      "title": "连接获取时间",
      "targets": [
        {
          "expr": "rate(hikaricp_connections_acquire_seconds_sum[5m]) / rate(hikaricp_connections_acquire_seconds_count[5m])",
          "legendFormat": "平均获取时间"
        }
      ]
    },
    {
      "title": "等待线程数",
      "targets": [
        {
          "expr": "hikaricp_connections_pending",
          "legendFormat": "等待中"
        }
      ]
    },
    {
      "title": "连接创建/关闭",
      "targets": [
        {
          "expr": "rate(hikaricp_connections_creation_seconds_count[5m])",
          "legendFormat": "创建速率"
        },
        {
          "expr": "rate(hikaricp_connections_timeout_total[5m])",
          "legendFormat": "超时速率"
        }
      ]
    }
  ]
}
```

## 常见问题与解决方案

### 连接泄漏

```java
// 问题代码：连接未正确关闭
public void problematicMethod() {
    Connection conn = dataSource.getConnection();
    PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users");
    ResultSet rs = stmt.executeQuery();
    // 如果这里抛出异常，连接永远不会归还！
    processResults(rs);
    conn.close();  // 可能永远执行不到
}

// 正确方式：使用 try-with-resources
public void correctMethod() {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users");
         ResultSet rs = stmt.executeQuery()) {
        processResults(rs);
    }  // 自动关闭所有资源
}
```

启用泄漏检测：

```yaml
spring:
  datasource:
    hikari:
      # 如果连接被借出超过60秒未归还，记录警告
      leak-detection-threshold: 60000
```

```
泄漏检测日志示例：
[WARN] Connection leak detection triggered for conn0:
url=jdbc:mysql://localhost:3306/mydb,
ownerThread=http-nio-8080-exec-1
java.lang.Exception: Apparent connection leak detected
    at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:128)
    at com.example.UserService.findUser(UserService.java:42)
    ...
```

### 连接超时

```java
// 问题：连接获取超时
@Service
public class SlowService {

    @Transactional
    public void slowOperation() {
        // 长时间占用连接
        Thread.sleep(60000);  // 60秒
        // 其他线程在此期间获取不到连接
    }
}

// 解决方案1：增加连接池大小
spring.datasource.hikari.maximum-pool-size=20

// 解决方案2：优化慢查询
// 解决方案3：使用异步处理
// 解决方案4：合理设置超时时间
```

处理超时异常：

```java
@Service
public class ResilientService {

    @Autowired
    private DataSource dataSource;

    public Optional<User> findUserWithFallback(Long id) {
        try {
            return Optional.ofNullable(findUser(id));
        } catch (SQLTransientConnectionException e) {
            // 连接超时，返回降级结果
            log.warn("数据库连接超时，使用缓存: {}", e.getMessage());
            return findUserFromCache(id);
        }
    }
}
```

### 连接验证失败

```yaml
# 配置连接验证
spring:
  datasource:
    hikari:
      # MySQL 8.0+ 使用 isValid() 方法，无需配置 SQL
      # connection-test-query: SELECT 1

      # 验证超时时间
      validation-timeout: 5000

      # 连接最大生命周期（应小于数据库 wait_timeout）
      max-lifetime: 1800000
```

### 连接池耗尽

```
症状：
- 应用响应变慢
- 日志出现 "Connection is not available" 错误
- 等待线程数持续增加

排查步骤：
┌────────────────────────────────────────────────────────────┐
│ 1. 检查是否有连接泄漏                                       │
│    SHOW PROCESSLIST;  -- MySQL                            │
│    SELECT * FROM pg_stat_activity;  -- PostgreSQL         │
│                                                            │
│ 2. 检查慢查询                                              │
│    SHOW FULL PROCESSLIST WHERE Time > 10;                 │
│                                                            │
│ 3. 检查死锁                                                │
│    SHOW ENGINE INNODB STATUS;                             │
│                                                            │
│ 4. 检查连接池配置                                          │
│    - maximum-pool-size 是否合理                           │
│    - connection-timeout 是否过长                          │
│    - leak-detection-threshold 是否启用                    │
└────────────────────────────────────────────────────────────┘
```

### 数据库连接数限制

```sql
-- 查看 MySQL 最大连接数
SHOW VARIABLES LIKE 'max_connections';

-- 查看当前连接数
SHOW STATUS LIKE 'Threads_connected';

-- 调整最大连接数（临时）
SET GLOBAL max_connections = 200;

-- 永久修改，编辑 my.cnf
-- [mysqld]
-- max_connections = 200
```

多应用共享数据库时的配置：

```
场景：3个应用共享一个 max_connections=150 的数据库

分配策略：
┌─────────────────────────────────────────────────┐
│ 应用        │ 连接池大小 │ 说明                 │
├─────────────────────────────────────────────────┤
│ Web API    │ 50        │ 高并发，需要更多连接   │
│ Admin后台  │ 20        │ 低并发，少量连接      │
│ 定时任务   │ 10        │ 串行执行，最少连接    │
│ 预留      │ 70        │ 突发流量和运维操作    │
└─────────────────────────────────────────────────┘
```

## 不同负载类型的调优

### OLTP 场景（在线事务处理）

```yaml
# 特点：高并发、短事务、快速响应
spring:
  datasource:
    hikari:
      pool-name: OLTP-Pool
      maximum-pool-size: 20
      minimum-idle: 20
      connection-timeout: 3000      # 快速失败
      idle-timeout: 300000          # 5分钟
      max-lifetime: 900000          # 15分钟
      validation-timeout: 1000
      leak-detection-threshold: 30000
```

```java
@Service
public class OltpOptimizedService {

    @Transactional(timeout = 5)  // 5秒超时
    @Retry(maxAttempts = 3)
    public Order createOrder(OrderRequest request) {
        // 短小精悍的事务
        Order order = new Order(request);
        orderRepository.save(order);
        inventoryService.decreaseStock(request.getItems());
        return order;
    }
}
```

### OLAP 场景（在线分析处理）

```yaml
# 特点：低并发、长查询、大数据量
spring:
  datasource:
    hikari:
      pool-name: OLAP-Pool
      maximum-pool-size: 5
      minimum-idle: 2
      connection-timeout: 60000     # 允许更长等待
      idle-timeout: 600000          # 10分钟
      max-lifetime: 3600000         # 1小时
      validation-timeout: 10000
      leak-detection-threshold: 300000  # 5分钟
```

```java
@Service
public class AnalyticsService {

    @Transactional(readOnly = true, timeout = 300)  // 5分钟超时
    public ReportResult generateMonthlyReport(YearMonth month) {
        // 只读事务，不锁定数据
        return reportRepository.aggregateMonthlyData(month);
    }
}
```

### 批处理场景

```yaml
# 特点：大批量、顺序处理、容错性要求高
spring:
  datasource:
    hikari:
      pool-name: Batch-Pool
      maximum-pool-size: 3
      minimum-idle: 1
      connection-timeout: 30000
      idle-timeout: 120000          # 2分钟
      max-lifetime: 1800000         # 30分钟
      leak-detection-threshold: 600000  # 10分钟
```

```java
@Service
public class BatchService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void batchInsert(List<User> users) {
        // 使用批量插入优化性能
        jdbcTemplate.batchUpdate(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            new BatchPreparedStatementSetter() {
                @Override
                public void setValues(PreparedStatement ps, int i) throws SQLException {
                    User user = users.get(i);
                    ps.setString(1, user.getName());
                    ps.setString(2, user.getEmail());
                }

                @Override
                public int getBatchSize() {
                    return users.size();
                }
            }
        );
    }
}
```

### 微服务场景

```yaml
# 特点：多服务、分布式事务、连接资源宝贵
spring:
  datasource:
    hikari:
      pool-name: ${spring.application.name}-Pool
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 5000
      idle-timeout: 300000
      max-lifetime: 600000          # 10分钟，适应容器环境
      validation-timeout: 3000
      leak-detection-threshold: 30000
```

## 多数据源配置

### 读写分离配置

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.master")
    public HikariDataSource masterDataSource() {
        return new HikariDataSource();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.slave")
    public HikariDataSource slaveDataSource() {
        return new HikariDataSource();
    }

    @Bean
    @Primary
    public DataSource routingDataSource(
            @Qualifier("masterDataSource") DataSource master,
            @Qualifier("slaveDataSource") DataSource slave) {

        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("master", master);
        targetDataSources.put("slave", slave);

        RoutingDataSource routingDataSource = new RoutingDataSource();
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(master);

        return routingDataSource;
    }
}
```

```yaml
spring:
  datasource:
    master:
      jdbc-url: jdbc:mysql://master-db:3306/mydb
      username: ${DB_MASTER_USER}
      password: ${DB_MASTER_PASSWORD}
      hikari:
        pool-name: Master-Pool
        maximum-pool-size: 10

    slave:
      jdbc-url: jdbc:mysql://slave-db:3306/mydb
      username: ${DB_SLAVE_USER}
      password: ${DB_SLAVE_PASSWORD}
      hikari:
        pool-name: Slave-Pool
        maximum-pool-size: 20  # 读操作更多，连接池更大
```

### 路由数据源实现

```java
public class RoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.getDataSourceType();
    }
}

public class DataSourceContextHolder {

    private static final ThreadLocal<String> contextHolder = new ThreadLocal<>();

    public static void setDataSourceType(String dataSourceType) {
        contextHolder.set(dataSourceType);
    }

    public static String getDataSourceType() {
        return contextHolder.get();
    }

    public static void clearDataSourceType() {
        contextHolder.remove();
    }
}

@Aspect
@Component
public class DataSourceAspect {

    @Before("@annotation(readOnly)")
    public void setReadDataSource(ReadOnly readOnly) {
        DataSourceContextHolder.setDataSourceType("slave");
    }

    @After("@annotation(ReadOnly)")
    public void clearDataSource() {
        DataSourceContextHolder.clearDataSourceType();
    }
}

// 使用示例
@Service
public class UserService {

    @ReadOnly
    public User findById(Long id) {
        // 自动路由到从库
        return userRepository.findById(id);
    }

    public User save(User user) {
        // 默认路由到主库
        return userRepository.save(user);
    }
}
```

## 其他连接池对比

### 主流连接池比较

```
连接池性能对比（基准测试）：
┌────────────────────────────────────────────────────────────────┐
│ 连接池      │ 获取连接 │ 释放连接 │ 特点                       │
├────────────────────────────────────────────────────────────────┤
│ HikariCP   │ 0.27ms  │ 0.24ms  │ 性能最优，Spring Boot默认   │
│ Druid      │ 0.38ms  │ 0.31ms  │ 监控强大，SQL解析          │
│ C3P0       │ 2.41ms  │ 1.89ms  │ 历史悠久，性能一般          │
│ DBCP2      │ 1.23ms  │ 0.98ms  │ Apache出品，稳定可靠        │
│ Tomcat     │ 0.89ms  │ 0.72ms  │ Tomcat内置，中规中矩        │
└────────────────────────────────────────────────────────────────┘
```

### Druid 配置（如需要监控功能）

```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initial-size: 5
      min-idle: 5
      max-active: 20
      max-wait: 60000

      # 连接检测
      validation-query: SELECT 1
      test-while-idle: true
      test-on-borrow: false
      test-on-return: false

      # 空闲连接检测
      time-between-eviction-runs-millis: 60000
      min-evictable-idle-time-millis: 300000

      # 监控配置
      filters: stat,wall,log4j2
      stat-view-servlet:
        enabled: true
        url-pattern: /druid/*
        login-username: admin
        login-password: admin123
```

## 最佳实践总结

### 配置检查清单

```
连接池配置检查清单：
□ maximumPoolSize 是否根据 CPU 核数计算
□ minimumIdle 是否等于 maximumPoolSize
□ maxLifetime 是否小于数据库 wait_timeout
□ connectionTimeout 是否设置合理
□ leakDetectionThreshold 是否启用
□ 是否配置了监控指标收集
□ 是否设置了合理的告警阈值
□ 是否考虑了多应用共享数据库的情况
```

### 生产环境建议

```java
@Configuration
@Profile("production")
public class ProductionDataSourceConfig {

    @Bean
    public HikariDataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();

        // 计算最优连接池大小
        int cpuCores = Runtime.getRuntime().availableProcessors();
        int poolSize = cpuCores * 2 + 1;

        ds.setMaximumPoolSize(poolSize);
        ds.setMinimumIdle(poolSize);
        ds.setConnectionTimeout(5000);     // 生产环境快速失败
        ds.setIdleTimeout(300000);         // 5分钟
        ds.setMaxLifetime(600000);         // 10分钟
        ds.setLeakDetectionThreshold(30000);
        ds.setRegisterMbeans(true);

        // MySQL 优化参数
        ds.addDataSourceProperty("cachePrepStmts", "true");
        ds.addDataSourceProperty("prepStmtCacheSize", "250");
        ds.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        return ds;
    }
}
```

### 故障排查流程

```
连接池问题排查流程：
┌─────────────────────────────────────────────────────────────┐
│                    发现连接池问题                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────────┐
          │  检查监控指标               │
          │  - 活跃连接数               │
          │  - 等待线程数               │
          │  - 连接获取时间             │
          └─────────────┬───────────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │连接池满  │  │连接泄漏  │  │慢查询    │
    └────┬─────┘  └────┬─────┘  └────┬─────┘
         │             │             │
         ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │增加池大小│  │检查代码  │  │优化SQL   │
    │或优化查询│  │修复泄漏  │  │添加索引  │
    └──────────┘  └──────────┘  └──────────┘
```

## 总结

数据库连接池是后端系统性能优化的关键组件。正确配置连接池可以：

1. **提升性能**：减少连接创建开销，降低响应延迟
2. **保护数据库**：限制最大连接数，防止数据库过载
3. **提高稳定性**：连接复用和健康检查保证服务可用性
4. **便于监控**：通过指标及时发现和解决问题

记住核心原则：
- 连接池不是越大越好，要根据实际负载计算
- 始终启用泄漏检测和监控
- 根据业务场景选择合适的超时配置
- 定期检查和优化连接池配置
