---
title: "Spring Core: Deep Dive into IoC and DI"
description: "A comprehensive analysis of Spring Framework core mechanisms: IoC container principles, dependency injection methods, Bean lifecycle management, and best practices"
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Spring
  - IoC
  - DI
  - Dependency Injection
  - Inversion of Control
status: imported
origin: old/src/content/docs/java/spring-core.en.md
divergence: 0.188
issues: []
legacy:
  category: Java
  subcategory: Spring Framework
  order: 11
  lastUpdated: 2026-01-07
---

Spring Framework is the cornerstone of Java enterprise development, with IoC (Inversion of Control) and DI (Dependency Injection) being its core mechanisms. A deep understanding of these concepts is essential for mastering the Spring ecosystem.

## Concept Explanation

### What is Inversion of Control (IoC)

Inversion of Control (IoC) is a design principle that transfers the creation of objects and management of dependencies from application code to an external container. This "inversion" is manifested in:

- **Traditional approach**: Objects actively create or look up their dependencies
- **IoC approach**: The container is responsible for creating objects and injecting dependencies

```java
// Traditional approach: Object actively creates dependencies
public class OrderService {
    private UserRepository userRepository = new UserRepositoryImpl();
    private EmailService emailService = new SmtpEmailService();

    public void createOrder(Order order) {
        User user = userRepository.findById(order.getUserId());
        emailService.sendOrderConfirmation(user.getEmail(), order);
    }
}

// IoC approach: Dependencies are injected externally
public class OrderService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Dependencies injected via constructor
    public OrderService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public void createOrder(Order order) {
        User user = userRepository.findById(order.getUserId());
        emailService.sendOrderConfirmation(user.getEmail(), order);
    }
}
```

### What is Dependency Injection (DI)

Dependency Injection (DI) is the primary way to implement IoC. It has three basic forms:

1. **Constructor Injection**: Passing dependencies through the constructor
2. **Setter Injection**: Setting dependencies via setter methods
3. **Field Injection**: Injecting dependencies directly into fields

```java
// Constructor injection (recommended)
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// Setter injection
@Service
public class NotificationService {
    private EmailSender emailSender;

    @Autowired
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}

// Field injection (not recommended for production code)
@Service
public class ReportService {
    @Autowired
    private DataSource dataSource;
}
```

### The Role of IoC Container

The Spring IoC container is responsible for:

- **Object instantiation**: Creating objects (Beans) in the application
- **Dependency wiring**: Injecting dependencies into objects that need them
- **Lifecycle management**: Managing the creation, initialization, and destruction of Beans
- **Configuration management**: Centralized management of application configuration

```
┌─────────────────────────────────────────────────────────┐
│                    Spring IoC Container                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    Bean Factory                      │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │ │
│  │  │  Bean A │──│  Bean B │──│  Bean C │             │ │
│  │  └─────────┘  └─────────┘  └─────────┘             │ │
│  │       │            │            │                   │ │
│  │       └────────────┼────────────┘                   │ │
│  │                    ▼                                 │ │
│  │         Dependency Management                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │       Configuration Metadata (XML/Annotations/Java)  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Core Principles

### IoC Container Architecture

Spring provides two IoC container implementations:

#### BeanFactory

`BeanFactory` is the foundational interface of the Spring IoC container, providing basic dependency injection support:

```java
public interface BeanFactory {
    Object getBean(String name) throws BeansException;
    <T> T getBean(String name, Class<T> requiredType) throws BeansException;
    <T> T getBean(Class<T> requiredType) throws BeansException;
    boolean containsBean(String name);
    boolean isSingleton(String name) throws NoSuchBeanDefinitionException;
    boolean isPrototype(String name) throws NoSuchBeanDefinitionException;
    Class<?> getType(String name) throws NoSuchBeanDefinitionException;
}
```

#### ApplicationContext

`ApplicationContext` is a sub-interface of `BeanFactory`, providing more enterprise-level features:

```java
public interface ApplicationContext extends
        EnvironmentCapable,
        ListableBeanFactory,
        HierarchicalBeanFactory,
        MessageSource,
        ApplicationEventPublisher,
        ResourcePatternResolver {

    String getId();
    String getApplicationName();
    String getDisplayName();
    long getStartupDate();
    ApplicationContext getParent();
    AutowireCapableBeanFactory getAutowireCapableBeanFactory();
}
```

Enhanced features of ApplicationContext compared to BeanFactory:

| Feature | BeanFactory | ApplicationContext |
|---------|-------------|-------------------|
| Bean instantiation/wiring | Yes | Yes |
| Automatic BeanPostProcessor registration | No | Yes |
| Automatic BeanFactoryPostProcessor registration | No | Yes |
| Internationalized message access | No | Yes |
| ApplicationEvent publishing | No | Yes |
| Resource loading abstraction | No | Yes |

### Bean Definition and Registration

Spring uses `BeanDefinition` to describe Bean metadata:

```java
public interface BeanDefinition extends AttributeAccessor, BeanMetadataElement {
    // Bean class name
    void setBeanClassName(String beanClassName);
    String getBeanClassName();

    // Scope
    void setScope(String scope);
    String getScope();

    // Lazy initialization
    void setLazyInit(boolean lazyInit);
    boolean isLazyInit();

    // Dependent Beans
    void setDependsOn(String... dependsOn);
    String[] getDependsOn();

    // Autowire candidate
    void setAutowireCandidate(boolean autowireCandidate);
    boolean isAutowireCandidate();

    // Primary candidate
    void setPrimary(boolean primary);
    boolean isPrimary();

    // Init and destroy methods
    void setInitMethodName(String initMethodName);
    String getInitMethodName();
    void setDestroyMethodName(String destroyMethodName);
    String getDestroyMethodName();
}
```

### Dependency Resolution Process

Spring's dependency resolution flow:

```
┌─────────────────────────────────────────────────────────┐
│               Dependency Resolution Flow                 │
├─────────────────────────────────────────────────────────┤
│  1. Scan configuration metadata                          │
│     ↓                                                    │
│  2. Create BeanDefinition                                │
│     ↓                                                    │
│  3. Resolve dependency graph                             │
│     ↓                                                    │
│  4. Detect circular dependencies                         │
│     ↓                                                    │
│  5. Determine instantiation order                        │
│     ↓                                                    │
│  6. Create Bean instance                                 │
│     ↓                                                    │
│  7. Populate properties (dependency injection)           │
│     ↓                                                    │
│  8. Call initialization methods                          │
│     ↓                                                    │
│  9. Bean is ready                                        │
└─────────────────────────────────────────────────────────┘
```

### Autowiring Principles

Spring supports multiple autowiring modes:

```java
public interface AutowireCapableBeanFactory extends BeanFactory {
    // No autowiring
    int AUTOWIRE_NO = 0;

    // Autowire by name
    int AUTOWIRE_BY_NAME = 1;

    // Autowire by type
    int AUTOWIRE_BY_TYPE = 2;

    // Autowire by constructor
    int AUTOWIRE_CONSTRUCTOR = 3;
}
```

The `@Autowired` annotation resolution process:

```java
// AutowiredAnnotationBeanPostProcessor handles @Autowired
public class AutowiredAnnotationBeanPostProcessor
        implements SmartInstantiationAwareBeanPostProcessor {

    // Collect injection metadata
    @Override
    public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
        // 1. Find all fields and methods annotated with @Autowired/@Value/@Inject
        InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);

        // 2. Perform injection
        metadata.inject(bean, beanName, pvs);

        return pvs;
    }
}
```

## Key Points

### Bean Scopes

Spring supports six Bean scopes:

```java
// 1. singleton (default): Only one instance per container
@Component
@Scope("singleton")
public class SingletonBean { }

// 2. prototype: New instance created for each request
@Component
@Scope("prototype")
public class PrototypeBean { }

// 3. request: One instance per HTTP request (Web applications)
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestBean { }

// 4. session: One instance per HTTP session (Web applications)
@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class SessionBean { }

// 5. application: One instance per ServletContext (Web applications)
@Component
@Scope(value = WebApplicationContext.SCOPE_APPLICATION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ApplicationBean { }

// 6. websocket: One instance per WebSocket session
@Component
@Scope(value = "websocket", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class WebSocketBean { }
```

### Core Annotations Explained

#### @Component and Its Derived Annotations

```java
// @Component: Generic component
@Component
public class MyComponent { }

// @Service: Business logic layer
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}

// @Repository: Data access layer, automatically translates data access exceptions
@Repository
public class JdbcUserRepository implements UserRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcUserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<User> findById(Long id) {
        try {
            User user = jdbcTemplate.queryForObject(
                "SELECT * FROM users WHERE id = ?",
                new UserRowMapper(),
                id
            );
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}

// @Controller: Web controller layer
@Controller
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users/{id}")
    public String getUser(@PathVariable Long id, Model model) {
        model.addAttribute("user", userService.findById(id));
        return "user/detail";
    }
}

// @RestController = @Controller + @ResponseBody
@RestController
@RequestMapping("/api/users")
public class UserRestController {
    private final UserService userService;

    public UserRestController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

#### @Configuration and @Bean

```java
@Configuration
public class AppConfig {

    // Define Beans for third-party libraries
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return restTemplate;
    }

    // Conditional Bean definition
    @Bean
    @ConditionalOnProperty(name = "cache.enabled", havingValue = "true")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
    }

    // Dependencies between Beans
    @Bean
    public UserService userService(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder) {
        return new UserService(userRepository, passwordEncoder);
    }

    // Using @Bean method internal calls (Full mode)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityService securityService() {
        // Calling passwordEncoder() returns the same Bean instance
        return new SecurityService(passwordEncoder());
    }
}

// Lite mode: @Bean methods in @Component classes
@Component
public class LiteConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
}
```

#### Deep Understanding of @Autowired

```java
@Service
public class OrderService {

    // 1. Field injection (not recommended)
    @Autowired
    private PaymentService paymentService;

    // 2. Constructor injection (recommended)
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // Spring 4.3+ allows omitting @Autowired for single constructor
    public OrderService(UserRepository userRepository,
                       ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    // 3. Setter injection
    private NotificationService notificationService;

    @Autowired
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // 4. Optional dependencies
    private AuditService auditService;

    @Autowired(required = false)
    public void setAuditService(AuditService auditService) {
        this.auditService = auditService;
    }

    // 5. Using Optional to wrap optional dependencies
    @Autowired
    private Optional<MetricsService> metricsService;

    // 6. Injecting collections
    @Autowired
    private List<OrderValidator> validators;

    @Autowired
    private Map<String, PaymentProcessor> paymentProcessors;
}
```

#### @Qualifier and @Primary

```java
// Define multiple Beans of the same type
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary  // Default Bean to inject
    public DataSource primaryDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://primary:3306/db");
        return ds;
    }

    @Bean
    @Qualifier("replica")
    public DataSource replicaDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://replica:3306/db");
        return ds;
    }

    @Bean
    @Qualifier("analytics")
    public DataSource analyticsDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://analytics:3306/db");
        return ds;
    }
}

@Service
public class ReportService {

    private final DataSource primaryDs;
    private final DataSource replicaDs;
    private final DataSource analyticsDs;

    public ReportService(
            DataSource primaryDs,  // Injects the @Primary annotated Bean
            @Qualifier("replica") DataSource replicaDs,
            @Qualifier("analytics") DataSource analyticsDs) {
        this.primaryDs = primaryDs;
        this.replicaDs = replicaDs;
        this.analyticsDs = analyticsDs;
    }
}

// Custom qualifier annotation
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Qualifier
public @interface DatabaseType {
    String value();
}

@Bean
@DatabaseType("primary")
public DataSource primaryDataSource() { /* ... */ }

@Bean
@DatabaseType("replica")
public DataSource replicaDataSource() { /* ... */ }

@Service
public class DataService {
    public DataService(@DatabaseType("primary") DataSource dataSource) {
        // ...
    }
}
```

### Bean Lifecycle

The complete lifecycle of a Bean includes the following phases:

```
┌─────────────────────────────────────────────────────────────┐
│                      Bean Lifecycle                          │
├─────────────────────────────────────────────────────────────┤
│  1. Instantiation                                            │
│     └─ BeanPostProcessor.postProcessBeforeInstantiation()    │
│                                                              │
│  2. Populate Properties                                      │
│     └─ Dependency injection                                  │
│                                                              │
│  3. Set Bean Name (BeanNameAware.setBeanName())              │
│                                                              │
│  4. Set BeanFactory (BeanFactoryAware.setBeanFactory())      │
│                                                              │
│  5. Set ApplicationContext                                   │
│     (ApplicationContextAware.setApplicationContext())        │
│                                                              │
│  6. Pre-initialization processing                            │
│     (BeanPostProcessor.postProcessBeforeInitialization())    │
│                                                              │
│  7. Initialization                                           │
│     ├─ @PostConstruct                                        │
│     ├─ InitializingBean.afterPropertiesSet()                 │
│     └─ Custom init-method                                    │
│                                                              │
│  8. Post-initialization processing                           │
│     (BeanPostProcessor.postProcessAfterInitialization())     │
│                                                              │
│  9. Bean is ready for use                                    │
│                                                              │
│  10. Destruction                                             │
│      ├─ @PreDestroy                                          │
│      ├─ DisposableBean.destroy()                             │
│      └─ Custom destroy-method                                │
└─────────────────────────────────────────────────────────────┘
```

Lifecycle callback example:

```java
@Component
public class DatabaseConnectionPool implements
        BeanNameAware,
        BeanFactoryAware,
        ApplicationContextAware,
        InitializingBean,
        DisposableBean {

    private String beanName;
    private BeanFactory beanFactory;
    private ApplicationContext applicationContext;
    private HikariDataSource dataSource;

    // 1. Constructor invocation
    public DatabaseConnectionPool() {
        System.out.println("1. Constructor called");
    }

    // 2. Dependency injection
    @Autowired
    public void setConfiguration(DataSourceProperties properties) {
        System.out.println("2. Dependency injection");
        this.dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(properties.getUrl());
    }

    // 3. BeanNameAware
    @Override
    public void setBeanName(String name) {
        System.out.println("3. setBeanName: " + name);
        this.beanName = name;
    }

    // 4. BeanFactoryAware
    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        System.out.println("4. setBeanFactory");
        this.beanFactory = beanFactory;
    }

    // 5. ApplicationContextAware
    @Override
    public void setApplicationContext(ApplicationContext ctx) throws BeansException {
        System.out.println("5. setApplicationContext");
        this.applicationContext = ctx;
    }

    // 6. @PostConstruct
    @PostConstruct
    public void postConstruct() {
        System.out.println("6. @PostConstruct");
    }

    // 7. InitializingBean
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("7. afterPropertiesSet");
        // Validate connection pool configuration
        if (dataSource.getJdbcUrl() == null) {
            throw new IllegalStateException("JDBC URL must be configured");
        }
    }

    // 8. @PreDestroy
    @PreDestroy
    public void preDestroy() {
        System.out.println("8. @PreDestroy");
    }

    // 9. DisposableBean
    @Override
    public void destroy() throws Exception {
        System.out.println("9. destroy");
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
```

### Component Scanning Mechanism

```java
// Basic component scanning
@Configuration
@ComponentScan(basePackages = "com.example.myapp")
public class AppConfig { }

// Specifying multiple packages
@Configuration
@ComponentScan(basePackages = {"com.example.service", "com.example.repository"})
public class AppConfig { }

// Type-safe scan configuration
@Configuration
@ComponentScan(basePackageClasses = {UserService.class, OrderRepository.class})
public class AppConfig { }

// Using filters
@Configuration
@ComponentScan(
    basePackages = "com.example",
    includeFilters = @ComponentScan.Filter(
        type = FilterType.ANNOTATION,
        classes = CustomComponent.class
    ),
    excludeFilters = {
        @ComponentScan.Filter(
            type = FilterType.REGEX,
            pattern = ".*Test.*"
        ),
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = LegacyService.class
        )
    }
)
public class AppConfig { }

// Custom filter
public class CustomTypeFilter implements TypeFilter {
    @Override
    public boolean match(MetadataReader metadataReader,
                        MetadataReaderFactory metadataReaderFactory) {
        ClassMetadata classMetadata = metadataReader.getClassMetadata();
        String className = classMetadata.getClassName();
        return className.endsWith("Service") || className.endsWith("Repository");
    }
}

@Configuration
@ComponentScan(
    basePackages = "com.example",
    includeFilters = @ComponentScan.Filter(
        type = FilterType.CUSTOM,
        classes = CustomTypeFilter.class
    )
)
public class AppConfig { }
```

## Code Examples

### Complete IoC/DI Application Example

#### Domain Model

```java
// User entity
public class User {
    private Long id;
    private String username;
    private String email;
    private String password;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors, getters, setters
    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.status = UserStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters omitted
}

public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

#### Repository Layer

```java
// Repository interface
public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAll();
    User save(User user);
    void deleteById(Long id);
    boolean existsByEmail(String email);
}

// Repository implementation
@Repository
public class JdbcUserRepository implements UserRepository {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<User> userRowMapper;

    public JdbcUserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRowMapper = (rs, rowNum) -> {
            User user = new User();
            user.setId(rs.getLong("id"));
            user.setUsername(rs.getString("username"));
            user.setEmail(rs.getString("email"));
            user.setPassword(rs.getString("password"));
            user.setStatus(UserStatus.valueOf(rs.getString("status")));
            user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            Timestamp updatedAt = rs.getTimestamp("updated_at");
            if (updatedAt != null) {
                user.setUpdatedAt(updatedAt.toLocalDateTime());
            }
            return user;
        };
    }

    @Override
    public Optional<User> findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, userRowMapper, id);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, userRowMapper, username);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, userRowMapper, email);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT * FROM users ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, userRowMapper);
    }

    @Override
    public User save(User user) {
        if (user.getId() == null) {
            return insert(user);
        } else {
            return update(user);
        }
    }

    private User insert(User user) {
        String sql = """
            INSERT INTO users (username, email, password, status, created_at)
            VALUES (?, ?, ?, ?, ?)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPassword());
            ps.setString(4, user.getStatus().name());
            ps.setTimestamp(5, Timestamp.valueOf(user.getCreatedAt()));
            return ps;
        }, keyHolder);

        user.setId(keyHolder.getKey().longValue());
        return user;
    }

    private User update(User user) {
        String sql = """
            UPDATE users SET username = ?, email = ?, password = ?,
                            status = ?, updated_at = ?
            WHERE id = ?
            """;
        user.setUpdatedAt(LocalDateTime.now());
        jdbcTemplate.update(sql,
            user.getUsername(), user.getEmail(), user.getPassword(),
            user.getStatus().name(), Timestamp.valueOf(user.getUpdatedAt()),
            user.getId());
        return user;
    }

    @Override
    public void deleteById(Long id) {
        String sql = "DELETE FROM users WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }
}
```

#### Service Layer

```java
// Password encoder interface
public interface PasswordEncoder {
    String encode(String rawPassword);
    boolean matches(String rawPassword, String encodedPassword);
}

// BCrypt implementation
@Component
public class BCryptPasswordEncoder implements PasswordEncoder {

    private static final int STRENGTH = 12;

    @Override
    public String encode(String rawPassword) {
        return BCrypt.hashpw(rawPassword, BCrypt.gensalt(STRENGTH));
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        return BCrypt.checkpw(rawPassword, encodedPassword);
    }
}

// Email service interface
public interface EmailService {
    void sendWelcomeEmail(String to, String username);
    void sendPasswordResetEmail(String to, String resetToken);
}

// Email service implementation
@Service
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public SmtpEmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Override
    public void sendWelcomeEmail(String to, String username) {
        Context context = new Context();
        context.setVariable("username", username);
        String content = templateEngine.process("email/welcome", context);

        sendHtmlEmail(to, "Welcome to Our Platform", content);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken) {
        Context context = new Context();
        context.setVariable("resetToken", resetToken);
        String content = templateEngine.process("email/password-reset", context);

        sendHtmlEmail(to, "Password Reset", content);
    }

    private void sendHtmlEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new EmailSendException("Failed to send email", e);
        }
    }
}

// User service
@Service
@Transactional(readOnly = true)
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    // Constructor injection for all dependencies
    public UserService(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      EmailService emailService,
                      ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.eventPublisher = eventPublisher;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User register(String username, String email, String password) {
        log.info("Registering new user: {}", username);

        // Validate username uniqueness
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyExistsException(username);
        }

        // Validate email uniqueness
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        // Create user
        User user = new User(username, email, passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(email, username);

        // Publish user registered event
        eventPublisher.publishEvent(new UserRegisteredEvent(this, savedUser));

        log.info("User registration successful: id={}", savedUser.getId());
        return savedUser;
    }

    @Transactional
    public User updateProfile(Long userId, String newUsername, String newEmail) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        // Validate new username
        if (!user.getUsername().equals(newUsername)) {
            userRepository.findByUsername(newUsername)
                .ifPresent(existing -> {
                    throw new UsernameAlreadyExistsException(newUsername);
                });
            user.setUsername(newUsername);
        }

        // Validate new email
        if (!user.getEmail().equals(newEmail)) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new EmailAlreadyExistsException(newEmail);
            }
            user.setEmail(newEmail);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new InvalidPasswordException();
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("User password updated: id={}", userId);
    }

    @Transactional
    public void deactivate(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        eventPublisher.publishEvent(new UserDeactivatedEvent(this, user));
    }
}
```

#### Event Handling

```java
// User registered event
public class UserRegisteredEvent extends ApplicationEvent {
    private final User user;

    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }

    public User getUser() {
        return user;
    }
}

// Event listener
@Component
public class UserEventListener {

    private static final Logger log = LoggerFactory.getLogger(UserEventListener.class);

    private final MetricsService metricsService;
    private final AuditService auditService;

    public UserEventListener(MetricsService metricsService, AuditService auditService) {
        this.metricsService = metricsService;
        this.auditService = auditService;
    }

    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("Handling user registered event: userId={}", event.getUser().getId());

        // Update metrics
        metricsService.incrementCounter("user.registrations");

        // Record audit log
        auditService.log("USER_REGISTERED", event.getUser().getId().toString());
    }

    @EventListener
    @Async
    public void onUserDeactivated(UserDeactivatedEvent event) {
        log.info("Handling user deactivated event: userId={}", event.getUser().getId());

        // Asynchronously handle cleanup work
        // ...
    }
}
```

#### Configuration Class

```java
@Configuration
@ComponentScan(basePackages = "com.example")
@PropertySource("classpath:application.properties")
public class AppConfig {

    @Bean
    public DataSource dataSource(
            @Value("${db.url}") String url,
            @Value("${db.username}") String username,
            @Value("${db.password}") String password) {

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(5);
        dataSource.setConnectionTimeout(30000);
        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    public TransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    @Bean
    public JavaMailSender mailSender(
            @Value("${mail.host}") String host,
            @Value("${mail.port}") int port,
            @Value("${mail.username}") String username,
            @Value("${mail.password}") String password) {

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        return mailSender;
    }
}
```

#### Application Entry Point

```java
public class Application {

    public static void main(String[] args) {
        // Create application context
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

        // Get service and use it
        UserService userService = context.getBean(UserService.class);

        try {
            // Register new user
            User user = userService.register("john", "john@example.com", "password123");
            System.out.println("User registration successful: " + user.getId());

            // Query user
            userService.findByUsername("john")
                .ifPresent(u -> System.out.println("Found user: " + u.getUsername()));

        } catch (Exception e) {
            e.printStackTrace();
        }

        // Close context
        ((ConfigurableApplicationContext) context).close();
    }
}
```

## Best Practices

### Prefer Constructor Injection

```java
// Recommended: Constructor injection
@Service
public class OrderService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PaymentService paymentService;

    // Dependencies are immutable, easy to test
    public OrderService(UserRepository userRepository,
                       ProductRepository productRepository,
                       PaymentService paymentService) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.paymentService = paymentService;
    }
}

// Not recommended: Field injection
@Service
public class OrderService {
    @Autowired
    private UserRepository userRepository;  // Hard to test

    @Autowired
    private ProductRepository productRepository;  // Hidden dependencies
}
```

### Program to Interfaces

```java
// Define interface
public interface NotificationService {
    void notify(String userId, String message);
}

// Implementations
@Service
@Primary
public class EmailNotificationService implements NotificationService {
    @Override
    public void notify(String userId, String message) {
        // Send email notification
    }
}

@Service
@Qualifier("sms")
public class SmsNotificationService implements NotificationService {
    @Override
    public void notify(String userId, String message) {
        // Send SMS notification
    }
}

// Use interface for injection
@Service
public class AlertService {
    private final NotificationService notificationService;

    public AlertService(NotificationService notificationService) {
        this.notificationService = notificationService;  // Injects @Primary implementation
    }
}
```

### Use Bean Scopes Appropriately

```java
// Use singleton for stateless services (default)
@Service
public class CalculationService {
    public BigDecimal calculate(BigDecimal amount, BigDecimal rate) {
        return amount.multiply(rate);
    }
}

// Use prototype for stateful objects
@Component
@Scope("prototype")
public class ShoppingCart {
    private final List<CartItem> items = new ArrayList<>();

    public void addItem(CartItem item) {
        items.add(item);
    }

    public List<CartItem> getItems() {
        return Collections.unmodifiableList(items);
    }
}

// Injecting prototype Bean into singleton requires method injection
@Service
public class OrderProcessingService {

    @Lookup
    public ShoppingCart createShoppingCart() {
        // Spring will override this method
        return null;
    }

    public void processOrder(Long userId) {
        ShoppingCart cart = createShoppingCart();  // Gets new instance each time
        // Process order...
    }
}
```

### Use @Lazy to Resolve Circular Dependencies

```java
@Service
public class ServiceA {
    private final ServiceB serviceB;

    public ServiceA(@Lazy ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    private final ServiceA serviceA;

    public ServiceB(ServiceA serviceA) {
        this.serviceA = serviceA;
    }
}
```

### Use Configuration Properties Classes

```java
@Component
@ConfigurationProperties(prefix = "app.security")
@Validated
public class SecurityProperties {

    @NotNull
    private String jwtSecret;

    @Min(3600)
    private long tokenExpirationSeconds = 86400;

    @NotEmpty
    private List<String> allowedOrigins = new ArrayList<>();

    // Getters and setters
}

@Service
public class JwtService {
    private final SecurityProperties securityProperties;

    public JwtService(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    public String generateToken(User user) {
        return Jwts.builder()
            .setSubject(user.getUsername())
            .setExpiration(new Date(
                System.currentTimeMillis() +
                securityProperties.getTokenExpirationSeconds() * 1000
            ))
            .signWith(Keys.hmacShaKeyFor(
                securityProperties.getJwtSecret().getBytes()
            ))
            .compact();
    }
}
```

### Use Events for Decoupling

```java
// Define event
public class OrderCreatedEvent extends ApplicationEvent {
    private final Order order;

    public OrderCreatedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }

    public Order getOrder() {
        return order;
    }
}

// Publish event
@Service
public class OrderService {
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        Order order = // Order creation logic

        // Publish event, decouple subsequent processing
        eventPublisher.publishEvent(new OrderCreatedEvent(this, order));

        return order;
    }
}

// Listen to events
@Component
public class OrderEventHandlers {

    @EventListener
    public void sendConfirmationEmail(OrderCreatedEvent event) {
        // Send confirmation email
    }

    @EventListener
    @Async
    public void updateInventory(OrderCreatedEvent event) {
        // Asynchronously update inventory
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void notifyExternalSystem(OrderCreatedEvent event) {
        // Notify external system after transaction commits
    }
}
```

## Common Pitfalls

### Circular Dependencies

```java
// Problem: Circular dependency causes Bean creation failure
@Service
public class ServiceA {
    private final ServiceB serviceB;

    public ServiceA(ServiceB serviceB) {  // Needs ServiceB
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    private final ServiceA serviceA;

    public ServiceB(ServiceA serviceA) {  // Needs ServiceA
        this.serviceA = serviceA;
    }
}

// Solution 1: Use @Lazy for delayed injection
@Service
public class ServiceA {
    private final ServiceB serviceB;

    public ServiceA(@Lazy ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

// Solution 2: Refactor design, extract common dependency
@Service
public class SharedService {
    // Common logic
}

@Service
public class ServiceA {
    private final SharedService sharedService;

    public ServiceA(SharedService sharedService) {
        this.sharedService = sharedService;
    }
}

@Service
public class ServiceB {
    private final SharedService sharedService;

    public ServiceB(SharedService sharedService) {
        this.sharedService = sharedService;
    }
}

// Solution 3: Use setter injection (not recommended)
@Service
public class ServiceA {
    private ServiceB serviceB;

    @Autowired
    public void setServiceB(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}
```

### Injecting Prototype Bean into Singleton

```java
// Problem: Prototype Bean becomes singleton in singleton
@Component
@Scope("prototype")
public class PrototypeBean {
    private static int counter = 0;
    private final int id = ++counter;

    public int getId() {
        return id;
    }
}

@Service
public class SingletonService {
    private final PrototypeBean prototypeBean;  // Only injected once

    public SingletonService(PrototypeBean prototypeBean) {
        this.prototypeBean = prototypeBean;
    }

    public void doSomething() {
        System.out.println(prototypeBean.getId());  // Always same ID
    }
}

// Solution 1: Use @Lookup method
@Service
public abstract class SingletonService {

    @Lookup
    public abstract PrototypeBean getPrototypeBean();

    public void doSomething() {
        PrototypeBean bean = getPrototypeBean();  // Gets new instance each time
        System.out.println(bean.getId());
    }
}

// Solution 2: Use ObjectFactory
@Service
public class SingletonService {
    private final ObjectFactory<PrototypeBean> prototypeBeanFactory;

    public SingletonService(ObjectFactory<PrototypeBean> prototypeBeanFactory) {
        this.prototypeBeanFactory = prototypeBeanFactory;
    }

    public void doSomething() {
        PrototypeBean bean = prototypeBeanFactory.getObject();
        System.out.println(bean.getId());
    }
}

// Solution 3: Use Provider (JSR-330)
@Service
public class SingletonService {
    private final Provider<PrototypeBean> prototypeBeanProvider;

    public SingletonService(Provider<PrototypeBean> prototypeBeanProvider) {
        this.prototypeBeanProvider = prototypeBeanProvider;
    }

    public void doSomething() {
        PrototypeBean bean = prototypeBeanProvider.get();
        System.out.println(bean.getId());
    }
}
```

### @Transactional Not Working

```java
// Problem 1: Non-public method
@Service
public class OrderService {

    @Transactional  // Won't work!
    private void processOrder(Order order) {
        // Transaction won't be active
    }
}

// Problem 2: Internal method call within same class
@Service
public class OrderService {

    public void createOrder(Order order) {
        processOrder(order);  // Direct call, transaction won't be active
    }

    @Transactional
    public void processOrder(Order order) {
        // Transaction won't be active
    }
}

// Solution: Inject self or split services
@Service
public class OrderService {

    @Autowired
    private OrderService self;  // Inject proxy object

    public void createOrder(Order order) {
        self.processOrder(order);  // Call through proxy
    }

    @Transactional
    public void processOrder(Order order) {
        // Transaction works correctly
    }
}

// Problem 3: Exception type mismatch
@Service
public class PaymentService {

    @Transactional  // Only rolls back RuntimeException by default
    public void processPayment(Payment payment) throws PaymentException {
        // Checked exception won't trigger rollback
        throw new PaymentException("Payment failed");
    }
}

// Solution: Specify rollback exception
@Service
public class PaymentService {

    @Transactional(rollbackFor = Exception.class)
    public void processPayment(Payment payment) throws PaymentException {
        throw new PaymentException("Payment failed");  // Will roll back now
    }
}
```

### Bean Naming Conflicts

```java
// Problem: Two Beans with same name
@Configuration
public class DataSourceConfig {
    @Bean
    public DataSource dataSource() {
        return createPrimaryDataSource();
    }
}

@Configuration
public class AnotherConfig {
    @Bean
    public DataSource dataSource() {  // Name conflict!
        return createSecondaryDataSource();
    }
}

// Solution: Use different names
@Configuration
public class DataSourceConfig {
    @Bean("primaryDataSource")
    @Primary
    public DataSource primaryDataSource() {
        return createPrimaryDataSource();
    }

    @Bean("secondaryDataSource")
    public DataSource secondaryDataSource() {
        return createSecondaryDataSource();
    }
}
```

### Using Transactions in @PostConstruct

```java
// Problem: Transaction might not be fully initialized in @PostConstruct
@Service
public class DataInitService {

    private final UserRepository userRepository;

    public DataInitService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    @Transactional  // Might not work
    public void init() {
        // Initialize data
        userRepository.save(new User("admin", "admin@example.com"));
    }
}

// Solution: Use event listener
@Service
public class DataInitService {

    private final UserRepository userRepository;

    public DataInitService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        // Initialize after application is fully started
        userRepository.save(new User("admin", "admin@example.com"));
    }
}
```

## Performance Considerations

### Bean Initialization Optimization

```java
// Use @Lazy to delay initialization of non-critical Beans
@Service
@Lazy
public class ReportGenerationService {
    // Heavyweight service, loaded on demand
}

// Global lazy loading configuration (Spring Boot)
// application.properties
spring.main.lazy-initialization=true

// Or configure in code
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(Application.class);
        app.setLazyInitialization(true);
        app.run(args);
    }
}
```

### Avoid Unnecessary Dependencies

```java
// Anti-pattern: Injecting entire ApplicationContext
@Service
public class BadService {
    @Autowired
    private ApplicationContext context;

    public void doSomething() {
        // Getting from container each time
        SomeBean bean = context.getBean(SomeBean.class);
    }
}

// Recommended: Directly inject required dependencies
@Service
public class GoodService {
    private final SomeBean someBean;

    public GoodService(SomeBean someBean) {
        this.someBean = someBean;
    }

    public void doSomething() {
        // Use directly
    }
}
```

### Component Scanning Optimization

```java
// Avoid scanning too many packages
@Configuration
@ComponentScan(basePackages = "com")  // Scan scope too broad

// Precisely specify packages to scan
@Configuration
@ComponentScan(basePackages = {
    "com.example.service",
    "com.example.repository",
    "com.example.controller"
})
public class AppConfig { }

// Or use exclude filters
@Configuration
@ComponentScan(
    basePackages = "com.example",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.example\\.legacy\\..*"
    )
)
public class AppConfig { }
```

### Thread Safety of Singleton Beans

```java
// Problem: Mutable state in singleton Bean
@Service
public class UnsafeService {
    private int counter = 0;  // Not thread-safe

    public void increment() {
        counter++;  // Race condition
    }
}

// Solution 1: Use atomic classes
@Service
public class SafeService {
    private final AtomicInteger counter = new AtomicInteger(0);

    public void increment() {
        counter.incrementAndGet();
    }
}

// Solution 2: Stateless design
@Service
public class StatelessService {
    public int calculate(int input) {
        return input * 2;  // Stateless, naturally thread-safe
    }
}

// Solution 3: Use ThreadLocal
@Service
public class ThreadLocalService {
    private final ThreadLocal<SimpleDateFormat> dateFormat =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    public String format(Date date) {
        return dateFormat.get().format(date);
    }
}
```

### Startup Time Optimization

```java
// Use AOT (Ahead-of-Time) compilation (Spring 6+)
// Improves startup time in GraalVM Native Image environment

// Use classpath scanning index
// Add dependency: spring-context-indexer
// Generates META-INF/spring.components at compile time

// Reduce auto-configuration
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class,
    // Exclude unnecessary auto-configurations
})
public class Application { }
```

## Practical Scenarios

### Scenario 1: Multiple DataSource Configuration

```java
@Configuration
public class MultiDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public JdbcTemplate primaryJdbcTemplate(
            @Qualifier("primaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    public JdbcTemplate secondaryJdbcTemplate(
            @Qualifier("secondaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}

@Service
public class ReportService {
    private final JdbcTemplate primaryJdbcTemplate;
    private final JdbcTemplate secondaryJdbcTemplate;

    public ReportService(
            JdbcTemplate primaryJdbcTemplate,
            @Qualifier("secondaryJdbcTemplate") JdbcTemplate secondaryJdbcTemplate) {
        this.primaryJdbcTemplate = primaryJdbcTemplate;
        this.secondaryJdbcTemplate = secondaryJdbcTemplate;
    }

    public List<Order> getOrders() {
        return primaryJdbcTemplate.query("SELECT * FROM orders", orderRowMapper);
    }

    public List<Report> getReports() {
        return secondaryJdbcTemplate.query("SELECT * FROM reports", reportRowMapper);
    }
}
```

### Scenario 2: Strategy Pattern with DI

```java
// Strategy interface
public interface PaymentStrategy {
    PaymentResult process(Payment payment);
    String getType();
}

// Concrete strategies
@Component
public class CreditCardPaymentStrategy implements PaymentStrategy {
    @Override
    public PaymentResult process(Payment payment) {
        // Credit card payment logic
        return PaymentResult.success();
    }

    @Override
    public String getType() {
        return "CREDIT_CARD";
    }
}

@Component
public class AlipayPaymentStrategy implements PaymentStrategy {
    @Override
    public PaymentResult process(Payment payment) {
        // Alipay payment logic
        return PaymentResult.success();
    }

    @Override
    public String getType() {
        return "ALIPAY";
    }
}

@Component
public class WechatPaymentStrategy implements PaymentStrategy {
    @Override
    public PaymentResult process(Payment payment) {
        // WeChat Pay payment logic
        return PaymentResult.success();
    }

    @Override
    public String getType() {
        return "WECHAT";
    }
}

// Strategy manager
@Component
public class PaymentStrategyManager {
    private final Map<String, PaymentStrategy> strategies;

    // Spring automatically injects all PaymentStrategy implementations
    public PaymentStrategyManager(List<PaymentStrategy> strategyList) {
        this.strategies = strategyList.stream()
            .collect(Collectors.toMap(
                PaymentStrategy::getType,
                Function.identity()
            ));
    }

    public PaymentStrategy getStrategy(String type) {
        PaymentStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new UnsupportedPaymentTypeException(type);
        }
        return strategy;
    }
}

// Usage
@Service
public class PaymentService {
    private final PaymentStrategyManager strategyManager;

    public PaymentService(PaymentStrategyManager strategyManager) {
        this.strategyManager = strategyManager;
    }

    public PaymentResult processPayment(String paymentType, Payment payment) {
        PaymentStrategy strategy = strategyManager.getStrategy(paymentType);
        return strategy.process(payment);
    }
}
```

### Scenario 3: Dynamic Bean Registration

```java
@Component
public class DynamicBeanRegistrar implements
        BeanDefinitionRegistryPostProcessor, EnvironmentAware {

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        // Dynamically register Beans based on configuration
        String[] modules = environment.getProperty("app.modules", String[].class, new String[]{});

        for (String module : modules) {
            String className = "com.example.modules." + module + ".ModuleService";

            try {
                Class<?> clazz = Class.forName(className);

                GenericBeanDefinition beanDefinition = new GenericBeanDefinition();
                beanDefinition.setBeanClass(clazz);
                beanDefinition.setScope("singleton");

                registry.registerBeanDefinition(module + "Service", beanDefinition);

            } catch (ClassNotFoundException e) {
                throw new BeanCreationException("Cannot find module class: " + className, e);
            }
        }
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        // Can modify registered BeanDefinitions here
    }
}
```

### Scenario 4: Conditional Configuration

```java
// Custom condition
public class OnProductionEnvironmentCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String[] activeProfiles = context.getEnvironment().getActiveProfiles();
        return Arrays.asList(activeProfiles).contains("prod");
    }
}

// Using custom condition
@Configuration
@Conditional(OnProductionEnvironmentCondition.class)
public class ProductionConfig {

    @Bean
    public AuditService auditService() {
        return new ProductionAuditService();
    }
}

// Using Spring Boot conditional annotations
@Configuration
public class CacheConfig {

    @Bean
    @ConditionalOnProperty(name = "cache.type", havingValue = "redis")
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        return RedisCacheManager.builder(connectionFactory).build();
    }

    @Bean
    @ConditionalOnProperty(name = "cache.type", havingValue = "caffeine", matchIfMissing = true)
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10)));
        return cacheManager;
    }

    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager simpleCacheManager() {
        return new ConcurrentMapCacheManager();
    }
}
```

## Interview Key Points

### Core Concept Questions

**1. What is the difference between IoC and DI?**

IoC (Inversion of Control) is a design principle that emphasizes transferring control of object creation and dependency management from application code to a container. DI (Dependency Injection) is the specific way to implement IoC, injecting dependencies into objects through constructors, setters, or fields. Simply put, IoC is "what" (the goal), and DI is "how" (the means).

**2. What are the types of dependency injection in Spring? What are their pros and cons?**

Three types:
- **Constructor injection** (recommended): Dependencies are immutable, easy to test, can detect circular dependencies at construction time
- **Setter injection**: Can inject optional dependencies, allows reconfiguration
- **Field injection**: Concise but hides dependencies, hard to test

**3. What is the difference between @Autowired and @Resource?**

```java
// @Autowired: Spring annotation, injects by type by default
@Autowired
private UserService userService;

// Inject by name requires @Qualifier
@Autowired
@Qualifier("primaryUserService")
private UserService userService;

// @Resource: JSR-250 standard annotation, injects by name by default
@Resource(name = "primaryUserService")
private UserService userService;

// When name not specified, matches by field name
@Resource
private UserService primaryUserService;  // Injects by name "primaryUserService"
```

**4. Explain Bean scopes and their use cases?**

- **singleton**: Stateless services, such as Service, Repository
- **prototype**: Stateful objects, such as shopping cart, session data
- **request**: Request-level data, such as user request context
- **session**: Session-level data, such as user login information
- **application**: Application-level shared data

**5. How to resolve circular dependencies?**

- Use `@Lazy` for delayed initialization
- Refactor code to eliminate the cycle
- Use setter injection (not recommended)
- Note: Spring 6.0+ prohibits constructor circular dependencies by default

### Practical Coding Questions

```java
// Question 1: Implement a simple IoC container
public class SimpleIoC {
    private final Map<Class<?>, Object> beans = new ConcurrentHashMap<>();

    public <T> void register(Class<T> type, T instance) {
        beans.put(type, instance);
    }

    @SuppressWarnings("unchecked")
    public <T> T getBean(Class<T> type) {
        Object bean = beans.get(type);
        if (bean == null) {
            throw new RuntimeException("No bean found for type: " + type);
        }
        return (T) bean;
    }

    // Registration with dependency injection
    public <T> T createBean(Class<T> type) throws Exception {
        Constructor<?> constructor = findInjectableConstructor(type);
        Object[] args = resolveConstructorArgs(constructor);
        T instance = (T) constructor.newInstance(args);
        beans.put(type, instance);
        return instance;
    }

    private Constructor<?> findInjectableConstructor(Class<?> type) {
        Constructor<?>[] constructors = type.getConstructors();
        if (constructors.length == 1) {
            return constructors[0];
        }
        // Find constructor annotated with @Inject
        for (Constructor<?> constructor : constructors) {
            if (constructor.isAnnotationPresent(Inject.class)) {
                return constructor;
            }
        }
        throw new RuntimeException("No injectable constructor found");
    }

    private Object[] resolveConstructorArgs(Constructor<?> constructor) {
        Class<?>[] paramTypes = constructor.getParameterTypes();
        Object[] args = new Object[paramTypes.length];
        for (int i = 0; i < paramTypes.length; i++) {
            args[i] = getBean(paramTypes[i]);
        }
        return args;
    }
}

// Question 2: Implement Bean lifecycle management
public interface BeanPostProcessor {
    default Object postProcessBeforeInitialization(Object bean, String beanName) {
        return bean;
    }

    default Object postProcessAfterInitialization(Object bean, String beanName) {
        return bean;
    }
}

public class LifecycleAwareBeanFactory {
    private final List<BeanPostProcessor> postProcessors = new ArrayList<>();

    public void addBeanPostProcessor(BeanPostProcessor processor) {
        postProcessors.add(processor);
    }

    public Object initializeBean(Object bean, String beanName) {
        Object result = bean;

        // Pre-processing
        for (BeanPostProcessor processor : postProcessors) {
            result = processor.postProcessBeforeInitialization(result, beanName);
        }

        // Call initialization methods
        invokeInitMethods(result);

        // Post-processing
        for (BeanPostProcessor processor : postProcessors) {
            result = processor.postProcessAfterInitialization(result, beanName);
        }

        return result;
    }

    private void invokeInitMethods(Object bean) {
        // Call @PostConstruct methods
        for (Method method : bean.getClass().getDeclaredMethods()) {
            if (method.isAnnotationPresent(PostConstruct.class)) {
                try {
                    method.setAccessible(true);
                    method.invoke(bean);
                } catch (Exception e) {
                    throw new RuntimeException("Init method invocation failed", e);
                }
            }
        }

        // Call InitializingBean interface
        if (bean instanceof InitializingBean) {
            try {
                ((InitializingBean) bean).afterPropertiesSet();
            } catch (Exception e) {
                throw new RuntimeException("afterPropertiesSet failed", e);
            }
        }
    }
}
```

### Advanced Questions

**1. How does Spring resolve setter-based circular dependencies?**

Spring uses three-level caching to resolve setter circular dependencies:
- First-level cache (singletonObjects): Fully initialized Beans
- Second-level cache (earlySingletonObjects): Early exposed Beans (not fully initialized)
- Third-level cache (singletonFactories): Bean factories

When creating Bean A, its factory is first placed in the third-level cache, then when populating properties and needing B, creating B finds it needs A, gets A's early reference from the third-level cache and puts it in the second-level cache, completes B's initialization, then A gets B and completes initialization.

**2. Why can't constructor injection resolve circular dependencies?**

Constructor injection requires all dependencies to be provided when creating the object, but at that point the dependent object might not have been created yet. Spring cannot create a "half-finished" object first because the object must be created through the constructor.

**3. What are the main differences between BeanFactory and ApplicationContext?**

- BeanFactory is lazy loading, ApplicationContext is eager loading
- ApplicationContext provides more enterprise-level features (event publishing, internationalization, resource loading, etc.)
- ApplicationContext automatically registers BeanPostProcessor and BeanFactoryPostProcessor
- In practice, ApplicationContext is always used

## Further Reading

### Official Documentation

- [Spring Framework Reference - IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring Framework Reference - Bean Lifecycle](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)
- [Spring Framework API Documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/)

### Recommended Books

- "Spring in Action" (6th Edition) - Craig Walls
- "Expert One-on-One J2EE Development without EJB" - Rod Johnson
- "Pro Spring 6" - Iuliana Cosmina

### Related Topics

- **Spring AOP**: Aspect-Oriented Programming, an important complement to the IoC container
- **Spring Boot Auto-Configuration**: Automated configuration mechanism based on IoC
- **Spring Cloud**: Dependency management in distributed systems
- **JSR-330 Standard**: Java Dependency Injection specification

### Source Code Study

Recommended reading order for core classes:
1. `BeanFactory` - Core IoC container interface
2. `DefaultListableBeanFactory` - Default BeanFactory implementation
3. `AbstractApplicationContext` - Core ApplicationContext implementation
4. `AnnotationConfigApplicationContext` - Annotation-driven context
5. `AutowiredAnnotationBeanPostProcessor` - @Autowired processor

---

> A deep understanding of Spring IoC/DI is the foundation for mastering the entire Spring ecosystem. After reading this, you should be able to understand how the IoC container works, proficiently use various dependency injection methods, and avoid common pitfalls. Practice with real projects to deepen your understanding of these concepts.
