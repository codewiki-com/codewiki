---
title: Spring Boot入门
description: Spring Boot完全指南，自动配置、依赖注入与快速开发
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Spring Boot
  - Spring
  - Web框架
status: imported
origin: old/src/content/docs/java/spring-boot.zh.md
divergence: 0.187
issues: []
legacy:
  category: Java
  subcategory: Web框架
  order: 12
  lastUpdated: 2026-01-07
---

Spring Boot 是基于 Spring 框架的快速开发平台，通过自动配置和约定优于配置的原则，让开发者能够快速构建生产级别的 Spring 应用程序。本文将全面介绍 Spring Boot 的核心概念和实践技巧。

---

## Spring Boot 简介

### 什么是 Spring Boot

Spring Boot 是 Pivotal 团队开发的框架，旨在简化 Spring 应用的初始搭建和开发过程。它提供了以下核心特性：

- **自动配置**：根据项目依赖自动配置 Spring 应用
- **起步依赖**：通过 starter 依赖快速引入所需功能
- **内嵌服务器**：内置 Tomcat、Jetty 或 Undertow，无需部署 WAR 文件
- **生产就绪**：提供健康检查、指标监控等生产级特性
- **无代码生成**：不需要 XML 配置

### Spring Boot 与 Spring Framework 的关系

```
┌─────────────────────────────────────┐
│           Spring Boot               │
│  ┌───────────────────────────────┐  │
│  │      自动配置 + Starters      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │      Spring Framework         │  │
│  │  (IoC, AOP, MVC, Data, etc.) │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Spring Boot 不是 Spring Framework 的替代品，而是建立在其之上的增强层，使 Spring 开发更加便捷。

---

## 快速开始

### 创建项目

#### 方式一：使用 Spring Initializr

访问 [https://start.spring.io](https://start.spring.io) 创建项目，或使用 curl：

```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,h2 \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d baseDir=my-app \
  -d groupId=com.example \
  -d artifactId=my-app \
  -o my-app.zip

unzip my-app.zip
cd my-app
```

#### 方式二：使用 Maven

创建 `pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <description>Demo project for Spring Boot</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 方式三：使用 Gradle

创建 `build.gradle`：

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 主应用程序类

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

`@SpringBootApplication` 是一个组合注解，等同于：

```java
@SpringBootConfiguration  // 标识这是配置类
@EnableAutoConfiguration  // 启用自动配置
@ComponentScan           // 启用组件扫描
public class DemoApplication {
    // ...
}
```

### Hello World 示例

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }
}
```

运行应用：

```bash
# Maven
./mvnw spring-boot:run

# Gradle
./gradlew bootRun

# 或直接运行 JAR
./mvnw package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

访问 `http://localhost:8080/hello` 即可看到响应。

---

## 自动配置原理

### 自动配置机制

Spring Boot 自动配置的核心在于 `@EnableAutoConfiguration` 注解，它会：

1. 扫描 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 文件
2. 根据条件注解决定是否加载配置类
3. 自动配置相应的 Bean

### 条件注解

Spring Boot 提供了丰富的条件注解：

```java
// 当类路径存在指定类时生效
@ConditionalOnClass(DataSource.class)

// 当类路径不存在指定类时生效
@ConditionalOnMissingClass("com.example.SomeClass")

// 当容器中存在指定 Bean 时生效
@ConditionalOnBean(DataSource.class)

// 当容器中不存在指定 Bean 时生效
@ConditionalOnMissingBean(DataSource.class)

// 当指定属性有特定值时生效
@ConditionalOnProperty(name = "app.feature.enabled", havingValue = "true")

// Web 应用环境生效
@ConditionalOnWebApplication

// 非 Web 应用环境生效
@ConditionalOnNotWebApplication
```

### 自定义自动配置

创建自定义的自动配置类：

```java
package com.example.autoconfigure;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass(MyService.class)
@EnableConfigurationProperties(MyServiceProperties.class)
public class MyServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyServiceProperties properties) {
        return new MyService(properties.getName(), properties.getTimeout());
    }
}
```

配置属性类：

```java
package com.example.autoconfigure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "myservice")
public class MyServiceProperties {

    private String name = "default";
    private int timeout = 30;

    // getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }
}
```

注册自动配置类（创建 `src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）：

```
com.example.autoconfigure.MyServiceAutoConfiguration
```

### 查看自动配置报告

启动时添加 `--debug` 参数可查看自动配置报告：

```bash
java -jar app.jar --debug
```

或在 `application.properties` 中配置：

```properties
debug=true
```

---

## 依赖注入

### IoC 容器基础

Spring 的核心是 IoC（控制反转）容器，通过依赖注入（DI）管理对象之间的依赖关系。

### Bean 定义方式

#### 方式一：组件扫描

```java
// 通用组件
@Component
public class EmailService {
    public void sendEmail(String to, String content) {
        // 发送邮件逻辑
    }
}

// 业务层
@Service
public class UserService {
    // 业务逻辑
}

// 数据访问层
@Repository
public class UserRepository {
    // 数据访问逻辑
}

// 控制器层
@Controller
public class UserController {
    // 请求处理逻辑
}
```

#### 方式二：Java 配置

```java
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }
}
```

### 依赖注入方式

#### 构造器注入（推荐）

```java
@Service
public class OrderService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    // Spring 4.3+ 单构造器可省略 @Autowired
    public OrderService(UserRepository userRepository,
                       ProductRepository productRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    public Order createOrder(Long userId, List<Long> productIds) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        List<Product> products = productRepository.findAllById(productIds);
        Order order = new Order(user, products);

        emailService.sendOrderConfirmation(user.getEmail(), order);

        return order;
    }
}
```

#### Setter 注入

```java
@Service
public class NotificationService {

    private EmailService emailService;
    private SmsService smsService;

    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Autowired(required = false)  // 可选依赖
    public void setSmsService(SmsService smsService) {
        this.smsService = smsService;
    }
}
```

#### 字段注入（不推荐用于生产代码）

```java
@Service
public class ReportService {

    @Autowired
    private DataSource dataSource;

    // 不推荐：难以测试，隐藏依赖关系
}
```

### Bean 作用域

```java
@Component
@Scope("singleton")  // 默认，单例
public class SingletonBean { }

@Component
@Scope("prototype")  // 每次请求创建新实例
public class PrototypeBean { }

@Component
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestScopedBean { }  // 每个 HTTP 请求一个实例

@Component
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class SessionScopedBean { }  // 每个 HTTP 会话一个实例
```

### 限定符和优先级

```java
// 定义多个同类型 Bean
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary  // 默认首选
    public DataSource primaryDataSource() {
        return createDataSource("primary");
    }

    @Bean
    @Qualifier("secondary")
    public DataSource secondaryDataSource() {
        return createDataSource("secondary");
    }
}

// 注入特定 Bean
@Service
public class ReportService {

    private final DataSource primaryDs;
    private final DataSource secondaryDs;

    public ReportService(@Qualifier("primaryDataSource") DataSource primaryDs,
                        @Qualifier("secondary") DataSource secondaryDs) {
        this.primaryDs = primaryDs;
        this.secondaryDs = secondaryDs;
    }
}
```

### 生命周期回调

```java
@Component
public class CacheManager {

    private Map<String, Object> cache;

    @PostConstruct
    public void init() {
        cache = new ConcurrentHashMap<>();
        System.out.println("缓存管理器初始化完成");
    }

    @PreDestroy
    public void cleanup() {
        cache.clear();
        System.out.println("缓存管理器已清理");
    }
}

// 或者实现接口
@Component
public class DatabaseConnection implements InitializingBean, DisposableBean {

    @Override
    public void afterPropertiesSet() throws Exception {
        // 初始化逻辑
    }

    @Override
    public void destroy() throws Exception {
        // 清理逻辑
    }
}
```

---

## 构建 REST API

### 控制器基础

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users
    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/users
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User createUser(@RequestBody @Valid CreateUserRequest request) {
        return userService.create(request);
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                           @RequestBody @Valid UpdateUserRequest request) {
        return userService.update(id, request)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }

    // GET /api/users/search?name=xxx&email=xxx
    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam(required = false) String name,
                                  @RequestParam(required = false) String email) {
        return userService.search(name, email);
    }
}
```

### 请求和响应 DTO

```java
// 创建用户请求
public record CreateUserRequest(
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 50, message = "用户名长度必须在2-50之间")
    String username,

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    String email,

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, message = "密码长度至少8位")
    String password
) {}

// 更新用户请求
public record UpdateUserRequest(
    @Size(min = 2, max = 50, message = "用户名长度必须在2-50之间")
    String username,

    @Email(message = "邮箱格式不正确")
    String email
) {}

// 用户响应
public record UserResponse(
    Long id,
    String username,
    String email,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
```

### 异常处理

```java
// 自定义异常
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s 未找到，%s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    // getters...
}

// 业务异常
public class BusinessException extends RuntimeException {

    private final String errorCode;

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

// 全局异常处理器
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleResourceNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(
            "RESOURCE_NOT_FOUND",
            ex.getMessage(),
            LocalDateTime.now()
        );
    }

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleBusinessException(BusinessException ex) {
        return new ErrorResponse(
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> new FieldError(error.getField(), error.getDefaultMessage()))
            .toList();

        return new ValidationErrorResponse(
            "VALIDATION_ERROR",
            "请求参数验证失败",
            errors,
            LocalDateTime.now()
        );
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGenericException(Exception ex) {
        log.error("未处理的异常", ex);
        return new ErrorResponse(
            "INTERNAL_ERROR",
            "服务器内部错误",
            LocalDateTime.now()
        );
    }
}

// 错误响应
public record ErrorResponse(
    String code,
    String message,
    LocalDateTime timestamp
) {}

public record ValidationErrorResponse(
    String code,
    String message,
    List<FieldError> errors,
    LocalDateTime timestamp
) {}

public record FieldError(
    String field,
    String message
) {}
```

### 分页和排序

```java
@GetMapping
public Page<UserResponse> getUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "id") String sortBy,
    @RequestParam(defaultValue = "asc") String sortDir) {

    Sort sort = sortDir.equalsIgnoreCase("desc")
        ? Sort.by(sortBy).descending()
        : Sort.by(sortBy).ascending();

    Pageable pageable = PageRequest.of(page, size, sort);

    return userService.findAll(pageable)
        .map(UserResponse::from);
}

// 使用 Spring Data 的 Pageable 参数解析
@GetMapping("/v2")
public Page<UserResponse> getUsersV2(Pageable pageable) {
    return userService.findAll(pageable).map(UserResponse::from);
}
```

### HATEOAS 支持

添加依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

使用示例：

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public EntityModel<UserResponse> getUser(@PathVariable Long id) {
        User user = userService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        UserResponse response = UserResponse.from(user);

        return EntityModel.of(response,
            linkTo(methodOn(UserController.class).getUser(id)).withSelfRel(),
            linkTo(methodOn(UserController.class).getAllUsers()).withRel("users"),
            linkTo(methodOn(OrderController.class).getOrdersByUser(id)).withRel("orders")
        );
    }
}
```

---

## 数据访问

### Spring Data JPA

添加依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
<!-- 或使用 MySQL -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

#### 实体类

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 构造器、getter、setter
    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    // getters and setters...
}

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    // getters and setters...
}

public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}

public enum OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
}
```

#### Repository 接口

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import com.example.demo.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 方法名派生查询
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findByStatus(UserStatus status);

    List<User> findByUsernameContainingIgnoreCase(String username);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    // 分页查询
    Page<User> findByStatus(UserStatus status, Pageable pageable);

    // JPQL 查询
    @Query("SELECT u FROM User u WHERE u.createdAt >= :startDate")
    List<User> findUsersCreatedAfter(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);

    // 原生 SQL 查询
    @Query(value = "SELECT * FROM users WHERE email LIKE %:domain%", nativeQuery = true)
    List<User> findByEmailDomain(@Param("domain") String domain);

    // 更新操作
    @Modifying
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);

    // 删除操作
    @Modifying
    @Query("DELETE FROM User u WHERE u.status = :status AND u.updatedAt < :before")
    int deleteInactiveUsers(@Param("status") UserStatus status,
                           @Param("before") LocalDateTime before);
}
```

#### Service 层

```java
package com.example.demo.service;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User create(CreateUserRequest request) {
        // 检查用户名是否已存在
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new BusinessException("USER_EXISTS", "用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("EMAIL_EXISTS", "邮箱已被使用");
        }

        User user = new User(
            request.username(),
            request.email(),
            passwordEncoder.encode(request.password())
        );

        return userRepository.save(user);
    }

    @Transactional
    public Optional<User> update(Long id, UpdateUserRequest request) {
        return userRepository.findById(id)
            .map(user -> {
                if (request.username() != null) {
                    user.setUsername(request.username());
                }
                if (request.email() != null) {
                    user.setEmail(request.email());
                }
                return userRepository.save(user);
            });
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    public List<User> search(String name, String email) {
        if (name != null && !name.isBlank()) {
            return userRepository.findByUsernameContainingIgnoreCase(name);
        }
        if (email != null && !email.isBlank()) {
            return userRepository.findByEmailDomain(email);
        }
        return userRepository.findAll();
    }
}
```

### 数据源配置

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1200000

  jpa:
    hibernate:
      ddl-auto: validate  # 生产环境使用 validate 或 none
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect
    open-in-view: false  # 推荐关闭
```

### 使用 Flyway 数据库迁移

添加依赖：

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
```

创建迁移脚本 `src/main/resources/db/migration/V1__Create_users_table.sql`：

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

配置：

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
```

---

## 配置管理

### 配置文件

Spring Boot 支持多种配置文件格式：

#### application.properties

```properties
# 服务器配置
server.port=8080
server.servlet.context-path=/api

# 数据库配置
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=secret

# 日志配置
logging.level.root=INFO
logging.level.com.example=DEBUG
logging.file.name=logs/app.log
```

#### application.yml

```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: my-application

  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: secret

  jpa:
    hibernate:
      ddl-auto: update

logging:
  level:
    root: INFO
    com.example: DEBUG
  file:
    name: logs/app.log
```

### 多环境配置

创建环境特定的配置文件：

```
src/main/resources/
├── application.yml           # 默认配置
├── application-dev.yml       # 开发环境
├── application-test.yml      # 测试环境
├── application-prod.yml      # 生产环境
```

`application.yml`：

```yaml
spring:
  profiles:
    active: dev  # 默认激活 dev 环境

app:
  name: My Application
  version: 1.0.0
```

`application-dev.yml`：

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:mem:devdb
    username: sa
    password:

  h2:
    console:
      enabled: true

logging:
  level:
    com.example: DEBUG
```

`application-prod.yml`：

```yaml
server:
  port: 80

spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/mydb
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

logging:
  level:
    root: WARN
    com.example: INFO
```

激活环境配置：

```bash
# 命令行参数
java -jar app.jar --spring.profiles.active=prod

# 环境变量
export SPRING_PROFILES_ACTIVE=prod
java -jar app.jar

# JVM 参数
java -Dspring.profiles.active=prod -jar app.jar
```

### 配置属性绑定

```java
@Component
@ConfigurationProperties(prefix = "app")
@Validated
public class AppProperties {

    @NotBlank
    private String name;

    private String version;

    @Valid
    private Security security = new Security();

    @Valid
    private List<Server> servers = new ArrayList<>();

    // getters and setters

    public static class Security {

        private boolean enabled = true;

        @NotBlank
        private String tokenSecret;

        @DurationUnit(ChronoUnit.HOURS)
        private Duration tokenExpiration = Duration.ofHours(24);

        // getters and setters
    }

    public static class Server {
        private String host;
        private int port;

        // getters and setters
    }
}
```

配置文件：

```yaml
app:
  name: My Application
  version: 1.0.0
  security:
    enabled: true
    token-secret: my-secret-key
    token-expiration: 48h
  servers:
    - host: server1.example.com
      port: 8080
    - host: server2.example.com
      port: 8081
```

启用配置属性：

```java
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 外部化配置

Spring Boot 按以下优先级加载配置（后面覆盖前面）：

1. 默认属性
2. `@PropertySource` 注解
3. 打包的 `application.properties/yml`
4. 打包的 `application-{profile}.properties/yml`
5. 外部 `config/application.properties/yml`
6. 外部 `application.properties/yml`
7. 命令行参数
8. 环境变量

---

## 测试

### 测试依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

包含：JUnit 5、Spring Test、AssertJ、Hamcrest、Mockito、JSONassert、JsonPath

### 单元测试

```java
package com.example.demo.service;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Nested
    @DisplayName("创建用户测试")
    class CreateUserTests {

        private CreateUserRequest validRequest;

        @BeforeEach
        void setUp() {
            validRequest = new CreateUserRequest("testuser", "test@example.com", "password123");
        }

        @Test
        @DisplayName("成功创建用户")
        void shouldCreateUserSuccessfully() {
            // given
            given(userRepository.findByUsername("testuser")).willReturn(Optional.empty());
            given(userRepository.existsByEmail("test@example.com")).willReturn(false);
            given(passwordEncoder.encode("password123")).willReturn("encoded_password");
            given(userRepository.save(any(User.class))).willAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });

            // when
            User result = userService.create(validRequest);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getUsername()).isEqualTo("testuser");
            assertThat(result.getEmail()).isEqualTo("test@example.com");
            assertThat(result.getPassword()).isEqualTo("encoded_password");

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("用户名已存在时抛出异常")
        void shouldThrowExceptionWhenUsernameExists() {
            // given
            given(userRepository.findByUsername("testuser"))
                .willReturn(Optional.of(new User()));

            // when & then
            assertThatThrownBy(() -> userService.create(validRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户名已存在");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("邮箱已存在时抛出异常")
        void shouldThrowExceptionWhenEmailExists() {
            // given
            given(userRepository.findByUsername("testuser")).willReturn(Optional.empty());
            given(userRepository.existsByEmail("test@example.com")).willReturn(true);

            // when & then
            assertThatThrownBy(() -> userService.create(validRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("邮箱已被使用");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("查询用户测试")
    class FindUserTests {

        @Test
        @DisplayName("根据ID查询存在的用户")
        void shouldFindUserById() {
            // given
            User user = new User("testuser", "test@example.com", "password");
            user.setId(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            // when
            Optional<User> result = userService.findById(1L);

            // then
            assertThat(result).isPresent();
            assertThat(result.get().getUsername()).isEqualTo("testuser");
        }

        @Test
        @DisplayName("根据ID查询不存在的用户")
        void shouldReturnEmptyWhenUserNotFound() {
            // given
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            // when
            Optional<User> result = userService.findById(999L);

            // then
            assertThat(result).isEmpty();
        }
    }
}
```

### 集成测试

```java
package com.example.demo.controller;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldCreateUser() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "newuser", "new@example.com", "password123"
        );

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.username").value("newuser"))
            .andExpect(jsonPath("$.email").value("new@example.com"))
            .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void shouldReturnBadRequestForInvalidInput() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "", "invalid-email", "short"
        );

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.errors", hasSize(greaterThan(0))));
    }

    @Test
    void shouldGetUserById() throws Exception {
        User user = userRepository.save(
            new User("testuser", "test@example.com", "password")
        );

        mockMvc.perform(get("/api/users/{id}", user.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(user.getId()))
            .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void shouldReturn404WhenUserNotFound() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 999))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetAllUsers() throws Exception {
        userRepository.save(new User("user1", "user1@example.com", "pass1"));
        userRepository.save(new User("user2", "user2@example.com", "pass2"));

        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldDeleteUser() throws Exception {
        User user = userRepository.save(
            new User("todelete", "delete@example.com", "password")
        );

        mockMvc.perform(delete("/api/users/{id}", user.getId()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/{id}", user.getId()))
            .andExpect(status().isNotFound());
    }
}
```

### 切片测试

#### @WebMvcTest - 仅测试 Web 层

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturnUsers() throws Exception {
        List<User> users = List.of(
            new User("user1", "user1@example.com", "pass"),
            new User("user2", "user2@example.com", "pass")
        );
        given(userService.findAll()).willReturn(users);

        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }
}
```

#### @DataJpaTest - 仅测试 JPA 层

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("testdb");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldFindByUsername() {
        User user = new User("findme", "find@example.com", "password");
        entityManager.persist(user);
        entityManager.flush();

        Optional<User> found = userRepository.findByUsername("findme");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("find@example.com");
    }

    @Test
    void shouldCheckEmailExists() {
        User user = new User("testuser", "exists@example.com", "password");
        entityManager.persist(user);
        entityManager.flush();

        assertThat(userRepository.existsByEmail("exists@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("notexists@example.com")).isFalse();
    }
}
```

### 测试配置

`src/test/resources/application-test.yml`：

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    username: sa
    password:
    driver-class-name: org.h2.Driver

  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

  flyway:
    enabled: false

logging:
  level:
    org.springframework.test: INFO
    com.example: DEBUG
```

---

## 部署

### 打包应用

#### 创建可执行 JAR

```bash
# Maven
./mvnw clean package

# Gradle
./gradlew clean build
```

运行：

```bash
java -jar target/myapp-0.0.1-SNAPSHOT.jar
```

#### 创建可执行 WAR

修改 `pom.xml`：

```xml
<packaging>war</packaging>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-tomcat</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

修改主类：

```java
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(Application.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### Docker 部署

#### Dockerfile

```dockerfile
# 多阶段构建
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

# 运行阶段
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -D appuser

COPY --from=builder /app/target/*.jar app.jar

# 设置权限
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/mydb
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=secret
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=mydb
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:
```

### Kubernetes 部署

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myregistry/myapp:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
            - name: SPRING_DATASOURCE_USERNAME
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: username
            - name: SPRING_DATASOURCE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: LoadBalancer
```

### 生产配置

#### Actuator 端点

添加依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

配置：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true

info:
  app:
    name: ${spring.application.name}
    version: '@project.version@'
    java:
      version: ${java.version}
```

#### 日志配置

`src/main/resources/logback-spring.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <springProfile name="dev">
        <include resource="org/springframework/boot/logging/logback/console-appender.xml"/>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
        <logger name="com.example" level="DEBUG"/>
    </springProfile>

    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/app.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                <fileNamePattern>logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
                <maxFileSize>100MB</maxFileSize>
                <maxHistory>30</maxHistory>
                <totalSizeCap>3GB</totalSizeCap>
            </rollingPolicy>
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>

        <appender name="JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/app.json</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                <fileNamePattern>logs/app.%d{yyyy-MM-dd}.%i.json.gz</fileNamePattern>
                <maxFileSize>100MB</maxFileSize>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
            <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
        </appender>

        <root level="INFO">
            <appender-ref ref="FILE"/>
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

---

## 最佳实践

### 项目结构

推荐的包结构：

```
com.example.myapp/
├── MyAppApplication.java          # 主类
├── config/                        # 配置类
│   ├── SecurityConfig.java
│   ├── WebConfig.java
│   └── CacheConfig.java
├── controller/                    # REST 控制器
│   ├── UserController.java
│   └── OrderController.java
├── service/                       # 业务逻辑
│   ├── UserService.java
│   └── OrderService.java
├── repository/                    # 数据访问
│   ├── UserRepository.java
│   └── OrderRepository.java
├── entity/                        # JPA 实体
│   ├── User.java
│   └── Order.java
├── dto/                           # 数据传输对象
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   └── UpdateUserRequest.java
│   └── response/
│       ├── UserResponse.java
│       └── ErrorResponse.java
├── exception/                     # 异常类
│   ├── ResourceNotFoundException.java
│   ├── BusinessException.java
│   └── GlobalExceptionHandler.java
├── mapper/                        # 对象映射
│   └── UserMapper.java
└── util/                          # 工具类
    └── DateUtils.java
```

### 编码规范

1. **使用构造器注入**：便于测试和保证依赖不可变
2. **遵循单一职责原则**：每个类只做一件事
3. **使用 DTO**：不要直接暴露实体对象
4. **统一异常处理**：使用 `@RestControllerAdvice`
5. **参数验证**：使用 Bean Validation
6. **日志规范**：使用 SLF4J，避免使用 `System.out`
7. **配置外部化**：敏感信息使用环境变量

### 性能优化

```java
// 1. 使用延迟加载
@ManyToOne(fetch = FetchType.LAZY)
private User user;

// 2. 使用投影减少数据传输
public interface UserSummary {
    Long getId();
    String getUsername();
}

@Query("SELECT u.id as id, u.username as username FROM User u")
List<UserSummary> findAllSummary();

// 3. 批量操作
@Modifying
@Query("UPDATE User u SET u.status = :status WHERE u.id IN :ids")
int updateStatusBatch(@Param("ids") List<Long> ids, @Param("status") UserStatus status);

// 4. 使用缓存
@Service
public class UserService {

    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @CacheEvict(value = "users", key = "#user.id")
    public User update(User user) {
        return userRepository.save(user);
    }
}
```

### 安全建议

1. **使用 HTTPS**：生产环境必须启用
2. **密码加密**：使用 BCrypt 或 Argon2
3. **输入验证**：防止 SQL 注入和 XSS
4. **敏感信息保护**：使用 Vault 或密钥管理服务
5. **定期更新依赖**：修复已知安全漏洞
6. **限制请求频率**：防止 DDoS 攻击
7. **审计日志**：记录关键操作

```java
// 密码加密配置
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

---

## 总结

Spring Boot 通过自动配置、起步依赖和内嵌服务器等特性，极大地简化了 Spring 应用的开发过程。本文涵盖了从项目创建到生产部署的完整流程，包括：

- **核心概念**：自动配置、依赖注入、组件扫描
- **Web 开发**：REST API、异常处理、数据验证
- **数据访问**：Spring Data JPA、事务管理、数据库迁移
- **配置管理**：多环境配置、属性绑定、外部化配置
- **测试策略**：单元测试、集成测试、切片测试
- **部署方案**：Docker、Kubernetes、云原生

掌握这些知识后，你将能够高效地开发和维护企业级 Spring Boot 应用程序。

## 参考资源

- [Spring Boot 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Framework 参考文档](https://docs.spring.io/spring-framework/reference/)
- [Spring Data JPA 文档](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Baeldung Spring 教程](https://www.baeldung.com/spring-boot)
