---
title: Spring Boot Introduction
description: Complete guide to Spring Boot, auto-configuration, dependency injection and rapid development
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Spring Boot
  - Spring
  - Web Framework
status: imported
origin: old/src/content/docs/java/spring-boot.en.md
divergence: 0.187
issues: []
legacy:
  category: Java
  subcategory: Web Frameworks
  order: 12
  lastUpdated: 2026-01-07
---

Spring Boot is an opinionated framework built on top of the Spring Framework that simplifies the creation of production-ready, stand-alone Spring applications. It eliminates much of the boilerplate configuration traditionally required in Spring projects, allowing developers to focus on writing business logic rather than infrastructure code.

## What is Spring Boot?

Spring Boot takes an opinionated view of building Spring applications and gets you up and running as quickly as possible. It provides:

- **Stand-alone applications**: Create applications that can run independently with embedded servers
- **Opinionated defaults**: Sensible default configurations that work out of the box
- **No code generation**: No XML configuration required
- **Production-ready features**: Health checks, metrics, and externalized configuration

### Spring Boot vs Traditional Spring

| Aspect | Traditional Spring | Spring Boot |
|--------|-------------------|-------------|
| Configuration | Extensive XML or Java config | Auto-configuration |
| Server Setup | External server required | Embedded server included |
| Dependency Management | Manual version management | Starter dependencies |
| Project Setup | Complex and time-consuming | Quick with Spring Initializr |

## Getting Started

### Creating a Spring Boot Project

The easiest way to create a Spring Boot project is using [Spring Initializr](https://start.spring.io/). You can also use the command line with Spring CLI or create a project manually.

#### Using Spring Initializr

1. Visit https://start.spring.io/
2. Select your project settings (Maven/Gradle, Java version, etc.)
3. Add dependencies (Spring Web, Spring Data JPA, etc.)
4. Generate and download the project

#### Maven Project Structure

A typical Spring Boot Maven project has the following structure:

```
my-spring-boot-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/demo/
│   │   │       └── DemoApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/
│   │       └── templates/
│   └── test/
│       └── java/
│           └── com/example/demo/
│               └── DemoApplicationTests.java
├── pom.xml
└── README.md
```

#### Basic pom.xml Configuration

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
        <java.version>21</java.version>
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

### The Main Application Class

Every Spring Boot application has a main class annotated with `@SpringBootApplication`:

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

The `@SpringBootApplication` annotation is a convenience annotation that combines:

- `@Configuration`: Marks the class as a source of bean definitions
- `@EnableAutoConfiguration`: Enables Spring Boot's auto-configuration
- `@ComponentScan`: Enables component scanning in the current package and sub-packages

## Auto-Configuration

One of Spring Boot's most powerful features is auto-configuration. It automatically configures your application based on the dependencies you have added.

### How Auto-Configuration Works

Spring Boot examines your classpath and the beans you have defined, then automatically configures components. For example:

- If H2 database is on the classpath, it configures an in-memory database
- If Spring MVC is on the classpath, it configures a DispatcherServlet
- If Thymeleaf is on the classpath, it configures view resolvers

### Customizing Auto-Configuration

You can customize auto-configuration in several ways:

#### Using application.properties or application.yml

```properties
# application.properties
server.port=8081
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=update
```

```yaml
# application.yml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: secret
  jpa:
    hibernate:
      ddl-auto: update
```

#### Excluding Auto-Configuration Classes

```java
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

#### Conditional Beans

```java
@Configuration
public class MyConfiguration {

    @Bean
    @ConditionalOnProperty(name = "feature.enabled", havingValue = "true")
    public MyFeature myFeature() {
        return new MyFeature();
    }

    @Bean
    @ConditionalOnMissingBean
    public DefaultService defaultService() {
        return new DefaultService();
    }
}
```

### Creating Custom Auto-Configuration

You can create your own auto-configuration for reusable components:

```java
@Configuration
@ConditionalOnClass(MyCustomService.class)
@ConditionalOnProperty(name = "myservice.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(MyServiceProperties.class)
public class MyServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyCustomService myCustomService(MyServiceProperties properties) {
        return new MyCustomService(properties.getApiKey());
    }
}
```

Register your auto-configuration in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

```
com.example.autoconfigure.MyServiceAutoConfiguration
```

## Dependency Injection

Spring Boot leverages the Spring Framework's powerful dependency injection (DI) container. DI is a design pattern where objects receive their dependencies from external sources rather than creating them internally.

### Types of Dependency Injection

#### Constructor Injection (Recommended)

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Constructor injection - @Autowired is optional for single constructor
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public User createUser(User user) {
        User savedUser = userRepository.save(user);
        emailService.sendWelcomeEmail(savedUser.getEmail());
        return savedUser;
    }
}
```

#### Field Injection

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;
}
```

> **Note**: Constructor injection is preferred over field injection because it makes dependencies explicit, facilitates testing, and ensures immutability.

#### Setter Injection

```java
@Service
public class UserService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

### Spring Stereotypes

Spring provides several stereotype annotations to define beans:

| Annotation | Purpose |
|------------|---------|
| `@Component` | Generic stereotype for any Spring-managed component |
| `@Service` | Indicates a service layer component |
| `@Repository` | Indicates a data access component |
| `@Controller` | Indicates a web controller |
| `@RestController` | Combines `@Controller` and `@ResponseBody` |
| `@Configuration` | Indicates a configuration class |

### Bean Scopes

```java
@Component
@Scope("prototype")
public class PrototypeBean {
    // A new instance is created each time this bean is requested
}

@Component
@Scope("singleton") // Default scope
public class SingletonBean {
    // Only one instance exists in the application context
}
```

Available scopes include:
- **singleton** (default): One instance per Spring container
- **prototype**: New instance each time requested
- **request**: One instance per HTTP request (web applications)
- **session**: One instance per HTTP session (web applications)

### Qualifiers for Multiple Implementations

When you have multiple implementations of an interface:

```java
public interface NotificationService {
    void send(String message);
}

@Service
@Qualifier("email")
public class EmailNotificationService implements NotificationService {
    public void send(String message) {
        // Send email
    }
}

@Service
@Qualifier("sms")
public class SmsNotificationService implements NotificationService {
    public void send(String message) {
        // Send SMS
    }
}

@Service
public class OrderService {
    private final NotificationService notificationService;

    public OrderService(@Qualifier("email") NotificationService notificationService) {
        this.notificationService = notificationService;
    }
}
```

## Building REST APIs

Spring Boot makes it easy to build RESTful web services using Spring MVC.

### Creating a REST Controller

```java
package com.example.demo.controller;

import com.example.demo.model.User;
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

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User createUser(@RequestBody @Valid User user) {
        return userService.save(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                           @RequestBody @Valid User user) {
        return userService.findById(id)
                .map(existingUser -> {
                    user.setId(id);
                    return ResponseEntity.ok(userService.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.existsById(id)) {
            userService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
```

### Request Mapping Annotations

| Annotation | HTTP Method | Purpose |
|------------|-------------|---------|
| `@GetMapping` | GET | Retrieve resources |
| `@PostMapping` | POST | Create resources |
| `@PutMapping` | PUT | Update resources |
| `@PatchMapping` | PATCH | Partial update |
| `@DeleteMapping` | DELETE | Delete resources |

### Request Parameters and Path Variables

```java
@GetMapping("/search")
public List<User> searchUsers(
        @RequestParam(required = false) String name,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    return userService.search(name, page, size);
}

@GetMapping("/{userId}/orders/{orderId}")
public Order getOrder(
        @PathVariable Long userId,
        @PathVariable Long orderId) {
    return orderService.findByUserIdAndOrderId(userId, orderId);
}
```

### Request and Response Headers

```java
@GetMapping("/download")
public ResponseEntity<byte[]> downloadFile() {
    byte[] content = fileService.getFileContent();

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
    headers.setContentDispositionFormData("attachment", "file.pdf");

    return new ResponseEntity<>(content, headers, HttpStatus.OK);
}

@PostMapping("/upload")
public ResponseEntity<String> handleUpload(
        @RequestHeader("Content-Type") String contentType,
        @RequestHeader(value = "X-Custom-Header", required = false) String customHeader,
        @RequestBody byte[] content) {
    // Process upload
    return ResponseEntity.ok("Uploaded successfully");
}
```

### Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.toList());

        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            errors,
            LocalDateTime.now()
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### Input Validation

Add the validation starter dependency:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

Define validation constraints on your model:

```java
public class User {

    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotNull(message = "Age is required")
    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 150, message = "Age must be less than 150")
    private Integer age;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number")
    private String phone;

    // Getters and setters
}
```

Custom validation:

```java
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail {
    String message() default "Email already exists";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

@Component
public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    private final UserRepository userRepository;

    public UniqueEmailValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return email != null && !userRepository.existsByEmail(email);
    }
}
```

## Data Access with Spring Data JPA

Spring Data JPA provides a powerful abstraction over JPA (Java Persistence API) that significantly reduces boilerplate code.

### Configuration

Add the JPA starter and a database driver:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!-- Or for PostgreSQL -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

Configure the datasource:

```properties
# H2 (development)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true

# PostgreSQL (production)
# spring.datasource.url=jdbc:postgresql://localhost:5432/mydb
# spring.datasource.username=postgres
# spring.datasource.password=secret
# spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### Entity Definition

```java
package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders;

    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors, getters, and setters
}
```

### Repository Interface

```java
package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Derived query methods
    Optional<User> findByEmail(String email);

    List<User> findByNameContainingIgnoreCase(String name);

    List<User> findByAgeGreaterThanEqual(int age);

    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    // Custom JPQL query
    @Query("SELECT u FROM User u WHERE u.name LIKE %:keyword% OR u.email LIKE %:keyword%")
    List<User> searchByKeyword(@Param("keyword") String keyword);

    // Query with join fetch to avoid N+1 problem
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);

    // Native SQL query
    @Query(value = "SELECT * FROM users WHERE created_at >= :date", nativeQuery = true)
    List<User> findUsersCreatedAfter(@Param("date") LocalDateTime date);

    // Modifying query
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.name = :name WHERE u.id = :id")
    int updateUserName(@Param("id") Long id, @Param("name") String name);

    // Delete query
    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.status = :status")
    int deleteByStatus(@Param("status") UserStatus status);
}
```

### Service Layer

```java
package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return userRepository.existsById(id);
    }

    public List<User> search(String keyword) {
        return userRepository.searchByKeyword(keyword);
    }
}
```

### Pagination and Sorting

```java
@GetMapping
public Page<User> getAllUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "id") String sortBy,
        @RequestParam(defaultValue = "asc") String sortDir) {

    Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

    Pageable pageable = PageRequest.of(page, size, sort);
    return userRepository.findAll(pageable);
}
```

### Specifications for Dynamic Queries

```java
public class UserSpecifications {

    public static Specification<User> hasName(String name) {
        return (root, query, builder) ->
            name == null ? null : builder.like(builder.lower(root.get("name")),
                "%" + name.toLowerCase() + "%");
    }

    public static Specification<User> hasStatus(UserStatus status) {
        return (root, query, builder) ->
            status == null ? null : builder.equal(root.get("status"), status);
    }

    public static Specification<User> createdAfter(LocalDateTime date) {
        return (root, query, builder) ->
            date == null ? null : builder.greaterThanOrEqualTo(root.get("createdAt"), date);
    }
}

// Usage in service
public List<User> searchUsers(String name, UserStatus status, LocalDateTime createdAfter) {
    Specification<User> spec = Specification.where(UserSpecifications.hasName(name))
            .and(UserSpecifications.hasStatus(status))
            .and(UserSpecifications.createdAfter(createdAfter));
    return userRepository.findAll(spec);
}
```

## Configuration Management

Spring Boot provides flexible configuration options through profiles and externalized configuration.

### Application Properties

```properties
# application.properties

# Server configuration
server.port=8080
server.servlet.context-path=/api

# Logging
logging.level.root=INFO
logging.level.com.example.demo=DEBUG
logging.file.name=app.log

# Custom properties
app.name=My Application
app.version=1.0.0
app.feature.enabled=true
```

### Using @Value

```java
@Component
public class AppConfig {

    @Value("${app.name}")
    private String appName;

    @Value("${app.version:1.0.0}")  // Default value
    private String appVersion;

    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;

    @Value("${app.allowed-origins}")
    private List<String> allowedOrigins;
}
```

### Using @ConfigurationProperties

```java
@Configuration
@ConfigurationProperties(prefix = "app")
@Validated
public class AppProperties {

    @NotBlank
    private String name;

    private String version;

    private Feature feature = new Feature();

    @Valid
    private Security security = new Security();

    public static class Feature {
        private boolean enabled;
        private int maxRetries = 3;

        // Getters and setters
    }

    public static class Security {
        @NotBlank
        private String jwtSecret;
        private long jwtExpiration = 86400000;

        // Getters and setters
    }

    // Getters and setters
}
```

### Profiles

Create profile-specific configuration files:

```properties
# application-dev.properties
spring.datasource.url=jdbc:h2:mem:devdb
logging.level.com.example.demo=DEBUG
```

```properties
# application-prod.properties
spring.datasource.url=jdbc:postgresql://prod-server:5432/proddb
logging.level.com.example.demo=WARN
```

Activate a profile:

```bash
# Via command line
java -jar app.jar --spring.profiles.active=prod

# Via environment variable
export SPRING_PROFILES_ACTIVE=prod
```

Profile-specific beans:

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Profile("dev")
    public DataSource devDataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }

    @Bean
    @Profile("prod")
    public DataSource prodDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(System.getenv("DB_URL"));
        config.setUsername(System.getenv("DB_USERNAME"));
        config.setPassword(System.getenv("DB_PASSWORD"));
        return new HikariDataSource(config);
    }
}
```

### Profile Groups

```properties
# application.properties
spring.profiles.group.production=prod,prod-db,prod-cache
spring.profiles.group.development=dev,dev-db,h2-console
```

## Testing

Spring Boot provides excellent testing support with the `spring-boot-starter-test` dependency.

### Unit Testing

```java
package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("John Doe");
        testUser.setEmail("john@example.com");
    }

    @Test
    void findById_WhenUserExists_ReturnsUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.findById(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("John Doe");
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void getById_WhenUserNotExists_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.getById(999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    void save_ValidUser_ReturnsSavedUser() {
        // Given
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.save(testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(userRepository, times(1)).save(testUser);
    }
}
```

### Integration Testing

```java
package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
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
    void createUser_ValidUser_ReturnsCreated() throws Exception {
        User user = new User();
        user.setName("Jane Doe");
        user.setEmail("jane@example.com");
        user.setAge(25);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.email").value("jane@example.com"));
    }

    @Test
    void getUser_ExistingUser_ReturnsUser() throws Exception {
        User user = new User();
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user = userRepository.save(user);

        mockMvc.perform(get("/api/users/{id}", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Doe"));
    }

    @Test
    void getUser_NonExistingUser_ReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 999))
                .andExpect(status().isNotFound());
    }

    @Test
    void createUser_InvalidEmail_ReturnsBadRequest() throws Exception {
        User user = new User();
        user.setName("Jane Doe");
        user.setEmail("invalid-email");

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }
}
```

### Testing with TestContainers

For testing with real databases:

```java
@SpringBootTest
@Testcontainers
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    void testFindByEmail() {
        User user = new User();
        user.setName("Test User");
        user.setEmail("test@example.com");
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("test@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test User");
    }
}
```

### Slice Tests

Spring Boot provides slice test annotations for testing specific layers:

```java
// Test only the web layer
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void testGetUser() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("Test User");

        when(userService.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test User"));
    }
}

// Test only the data layer
@DataJpaTest
class UserRepositoryTest {
    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testFindByEmail() {
        User user = new User();
        user.setName("Test");
        user.setEmail("test@example.com");
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByEmail("test@example.com");

        assertThat(found).isPresent();
    }
}

// Test only JSON serialization
@JsonTest
class UserJsonTest {
    @Autowired
    private JacksonTester<User> json;

    @Test
    void testSerialize() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("Test");

        assertThat(json.write(user)).extractingJsonPathNumberValue("$.id")
            .isEqualTo(1);
    }
}
```

## Production Features

### Actuator

Spring Boot Actuator provides production-ready features for monitoring and managing your application.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Configure actuator endpoints:

```properties
# Expose all endpoints
management.endpoints.web.exposure.include=*

# Or expose specific endpoints
management.endpoints.web.exposure.include=health,info,metrics,prometheus

# Customize health endpoint
management.endpoint.health.show-details=always

# Custom base path
management.endpoints.web.base-path=/management

# Custom info
info.app.name=My Application
info.app.version=1.0.0
```

Common actuator endpoints:
- `/actuator/health` - Application health information
- `/actuator/info` - Application information
- `/actuator/metrics` - Application metrics
- `/actuator/env` - Environment properties
- `/actuator/loggers` - Logger configuration
- `/actuator/beans` - All Spring beans
- `/actuator/threaddump` - Thread dump
- `/actuator/heapdump` - Heap dump

### Custom Health Indicator

```java
@Component
public class CustomHealthIndicator implements HealthIndicator {

    private final ExternalService externalService;

    public CustomHealthIndicator(ExternalService externalService) {
        this.externalService = externalService;
    }

    @Override
    public Health health() {
        try {
            boolean serviceUp = externalService.isAvailable();

            if (serviceUp) {
                return Health.up()
                        .withDetail("service", "Available")
                        .withDetail("responseTime", "50ms")
                        .build();
            }

            return Health.down()
                    .withDetail("service", "Unavailable")
                    .withDetail("error", "Connection refused")
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```

### Custom Metrics

```java
@Service
public class OrderService {

    private final MeterRegistry meterRegistry;
    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    public OrderService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.orderCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("type", "online")
            .register(meterRegistry);
        this.orderProcessingTimer = Timer.builder("order.processing.time")
            .description("Order processing time")
            .register(meterRegistry);
    }

    public Order createOrder(Order order) {
        return orderProcessingTimer.record(() -> {
            Order savedOrder = saveOrder(order);
            orderCounter.increment();
            return savedOrder;
        });
    }
}
```

### Securing Actuator Endpoints

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
```

## Deployment

### Building an Executable JAR

```bash
# Maven
./mvnw clean package

# The JAR file will be in target/
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

### Docker Deployment

Create a Dockerfile:

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

Build and run:

```bash
docker build -t my-spring-app .
docker run -p 8080:8080 my-spring-app
```

### Multi-Stage Docker Build

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Spring Boot Layered JAR

Optimize Docker builds with layered JARs:

```dockerfile
FROM eclipse-temurin:21-jre-alpine AS builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spring-boot-app
  template:
    metadata:
      labels:
        app: spring-boot-app
    spec:
      containers:
      - name: spring-boot-app
        image: my-spring-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: JAVA_OPTS
          value: "-Xmx512m -Xms256m"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: spring-boot-service
spec:
  selector:
    app: spring-boot-app
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

### Graceful Shutdown

```properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
```

## Best Practices

### Project Organization

```
src/main/java/com/example/demo/
├── config/           # Configuration classes
├── controller/       # REST controllers
├── dto/              # Data Transfer Objects
├── exception/        # Custom exceptions
├── mapper/           # Object mappers (MapStruct, etc.)
├── model/            # JPA entities
├── repository/       # Data repositories
├── security/         # Security configuration
├── service/          # Business logic
├── util/             # Utility classes
└── DemoApplication.java
```

### Common Best Practices

1. **Use constructor injection** for mandatory dependencies
2. **Keep controllers thin** - delegate business logic to services
3. **Use DTOs** for API responses instead of exposing entities directly
4. **Handle exceptions globally** with `@ControllerAdvice`
5. **Use profiles** for environment-specific configuration
6. **Enable actuator** for production monitoring
7. **Write tests** at multiple levels (unit, integration, slice)
8. **Use database migrations** (Flyway or Liquibase) instead of `ddl-auto`
9. **Externalize configuration** for different environments
10. **Use meaningful logging** with appropriate log levels

### Security Considerations

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### Database Connection Pooling

```properties
# HikariCP configuration (default in Spring Boot)
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.pool-name=HikariPool
```

### Async Processing

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

@Service
public class NotificationService {

    @Async("taskExecutor")
    public CompletableFuture<Void> sendEmailAsync(String to, String subject) {
        // Email sending logic
        return CompletableFuture.completedFuture(null);
    }
}
```

### Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(1000));
        return cacheManager;
    }
}

@Service
public class UserService {

    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @CachePut(value = "users", key = "#user.id")
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

## Conclusion

Spring Boot has revolutionized Java application development by eliminating boilerplate configuration and providing sensible defaults. Its auto-configuration, embedded server support, and extensive ecosystem of starters make it an excellent choice for building modern, production-ready applications.

Key takeaways:

- **Auto-configuration** reduces boilerplate and speeds up development
- **Starter dependencies** simplify dependency management
- **Dependency injection** promotes loose coupling and testability
- **Spring Data JPA** provides powerful data access abstractions
- **Built-in testing support** enables comprehensive test coverage
- **Actuator** provides production-ready monitoring capabilities
- **Flexible deployment options** support containers and cloud platforms

Whether you are building microservices, REST APIs, or traditional web applications, Spring Boot provides the tools and conventions needed to develop robust, maintainable applications efficiently.

## Further Reading

- [Official Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Guides](https://spring.io/guides)
- [Spring Boot GitHub Repository](https://github.com/spring-projects/spring-boot)
- [Baeldung Spring Boot Tutorials](https://www.baeldung.com/spring-boot)
