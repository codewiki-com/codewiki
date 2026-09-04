---
title: Spring Core：IoC与DI深度解析
description: 全面解析Spring框架核心机制：IoC容器原理、依赖注入方式、Bean生命周期管理与最佳实践
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Spring
  - IoC
  - DI
  - 依赖注入
  - 控制反转
status: imported
origin: old/src/content/docs/java/spring-core.zh.md
divergence: 0.188
issues: []
legacy:
  category: Java
  subcategory: Spring框架
  order: 11
  lastUpdated: 2026-01-07
---

Spring Framework 是 Java 企业级开发的基石，而 IoC（控制反转）和 DI（依赖注入）则是 Spring 的核心机制。深入理解这些概念对于掌握 Spring 生态系统至关重要。

## 概念解释

### 什么是控制反转（IoC）

控制反转（Inversion of Control，IoC）是一种设计原则，它将对象的创建和依赖关系的管理从应用程序代码中转移到外部容器。这种"反转"体现在：

- **传统方式**：对象主动创建或查找其依赖
- **IoC方式**：容器负责创建对象并注入依赖

```java
// 传统方式：对象主动创建依赖
public class OrderService {
    private UserRepository userRepository = new UserRepositoryImpl();
    private EmailService emailService = new SmtpEmailService();

    public void createOrder(Order order) {
        User user = userRepository.findById(order.getUserId());
        emailService.sendOrderConfirmation(user.getEmail(), order);
    }
}

// IoC方式：依赖由外部注入
public class OrderService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    // 依赖通过构造器注入
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

### 什么是依赖注入（DI）

依赖注入（Dependency Injection，DI）是实现 IoC 的主要方式。它有三种基本形式：

1. **构造器注入（Constructor Injection）**：通过构造函数传入依赖
2. **Setter注入（Setter Injection）**：通过 setter 方法设置依赖
3. **字段注入（Field Injection）**：直接在字段上注入依赖

```java
// 构造器注入（推荐）
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// Setter注入
@Service
public class NotificationService {
    private EmailSender emailSender;

    @Autowired
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}

// 字段注入（不推荐用于生产代码）
@Service
public class ReportService {
    @Autowired
    private DataSource dataSource;
}
```

### IoC容器的作用

Spring IoC 容器负责：

- **对象实例化**：创建应用程序中的对象（Bean）
- **依赖装配**：将依赖注入到需要它们的对象中
- **生命周期管理**：管理 Bean 的创建、初始化和销毁
- **配置管理**：集中管理应用程序配置

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
│  │             依赖关系管理                             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              配置元数据（XML/注解/Java配置）         │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 核心原理

### IoC容器架构

Spring 提供两种 IoC 容器实现：

#### BeanFactory

`BeanFactory` 是 Spring IoC 容器的基础接口，提供最基本的依赖注入支持：

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

`ApplicationContext` 是 `BeanFactory` 的子接口，提供更多企业级功能：

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

ApplicationContext 相比 BeanFactory 的增强功能：

| 功能 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| Bean 实例化/装配 | 是 | 是 |
| 自动 BeanPostProcessor 注册 | 否 | 是 |
| 自动 BeanFactoryPostProcessor 注册 | 否 | 是 |
| 国际化消息访问 | 否 | 是 |
| ApplicationEvent 发布 | 否 | 是 |
| 资源加载抽象 | 否 | 是 |

### Bean定义与注册

Spring 使用 `BeanDefinition` 描述 Bean 的元数据：

```java
public interface BeanDefinition extends AttributeAccessor, BeanMetadataElement {
    // Bean 的类名
    void setBeanClassName(String beanClassName);
    String getBeanClassName();

    // 作用域
    void setScope(String scope);
    String getScope();

    // 是否延迟初始化
    void setLazyInit(boolean lazyInit);
    boolean isLazyInit();

    // 依赖的 Bean
    void setDependsOn(String... dependsOn);
    String[] getDependsOn();

    // 是否自动装配候选
    void setAutowireCandidate(boolean autowireCandidate);
    boolean isAutowireCandidate();

    // 是否为主要候选
    void setPrimary(boolean primary);
    boolean isPrimary();

    // 初始化和销毁方法
    void setInitMethodName(String initMethodName);
    String getInitMethodName();
    void setDestroyMethodName(String destroyMethodName);
    String getDestroyMethodName();
}
```

### 依赖解析过程

Spring 解析依赖的流程：

```
┌─────────────────────────────────────────────────────────┐
│                     依赖解析流程                          │
├─────────────────────────────────────────────────────────┤
│  1. 扫描配置元数据                                        │
│     ↓                                                    │
│  2. 创建 BeanDefinition                                  │
│     ↓                                                    │
│  3. 解析依赖关系图                                        │
│     ↓                                                    │
│  4. 检测循环依赖                                          │
│     ↓                                                    │
│  5. 确定实例化顺序                                        │
│     ↓                                                    │
│  6. 创建 Bean 实例                                        │
│     ↓                                                    │
│  7. 填充属性（依赖注入）                                   │
│     ↓                                                    │
│  8. 调用初始化方法                                        │
│     ↓                                                    │
│  9. Bean 可用                                            │
└─────────────────────────────────────────────────────────┘
```

### 自动装配原理

Spring 支持多种自动装配模式：

```java
public interface AutowireCapableBeanFactory extends BeanFactory {
    // 不自动装配
    int AUTOWIRE_NO = 0;

    // 按名称自动装配
    int AUTOWIRE_BY_NAME = 1;

    // 按类型自动装配
    int AUTOWIRE_BY_TYPE = 2;

    // 按构造器自动装配
    int AUTOWIRE_CONSTRUCTOR = 3;
}
```

`@Autowired` 注解的解析过程：

```java
// AutowiredAnnotationBeanPostProcessor 负责处理 @Autowired
public class AutowiredAnnotationBeanPostProcessor
        implements SmartInstantiationAwareBeanPostProcessor {

    // 收集注入元数据
    @Override
    public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
        // 1. 查找所有 @Autowired/@Value/@Inject 标注的字段和方法
        InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);

        // 2. 执行注入
        metadata.inject(bean, beanName, pvs);

        return pvs;
    }
}
```

## 核心要点

### Bean作用域

Spring 支持六种 Bean 作用域：

```java
// 1. singleton（默认）：每个容器中只有一个实例
@Component
@Scope("singleton")
public class SingletonBean { }

// 2. prototype：每次请求创建新实例
@Component
@Scope("prototype")
public class PrototypeBean { }

// 3. request：每个HTTP请求一个实例（Web应用）
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestBean { }

// 4. session：每个HTTP会话一个实例（Web应用）
@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class SessionBean { }

// 5. application：每个ServletContext一个实例（Web应用）
@Component
@Scope(value = WebApplicationContext.SCOPE_APPLICATION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ApplicationBean { }

// 6. websocket：每个WebSocket会话一个实例
@Component
@Scope(value = "websocket", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class WebSocketBean { }
```

### 核心注解详解

#### @Component及其派生注解

```java
// @Component：通用组件
@Component
public class MyComponent { }

// @Service：业务逻辑层
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

// @Repository：数据访问层，自动转换数据访问异常
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

// @Controller：Web控制器层
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

#### @Configuration与@Bean

```java
@Configuration
public class AppConfig {

    // 定义第三方库的Bean
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return restTemplate;
    }

    // 带条件的Bean定义
    @Bean
    @ConditionalOnProperty(name = "cache.enabled", havingValue = "true")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
    }

    // Bean之间的依赖
    @Bean
    public UserService userService(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder) {
        return new UserService(userRepository, passwordEncoder);
    }

    // 使用@Bean方法内部调用（Full模式）
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityService securityService() {
        // 调用passwordEncoder()会返回同一个Bean实例
        return new SecurityService(passwordEncoder());
    }
}

// Lite模式：@Component类中的@Bean方法
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

#### @Autowired深入理解

```java
@Service
public class OrderService {

    // 1. 字段注入（不推荐）
    @Autowired
    private PaymentService paymentService;

    // 2. 构造器注入（推荐）
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // Spring 4.3+ 单构造器可省略@Autowired
    public OrderService(UserRepository userRepository,
                       ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    // 3. Setter注入
    private NotificationService notificationService;

    @Autowired
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // 4. 可选依赖
    private AuditService auditService;

    @Autowired(required = false)
    public void setAuditService(AuditService auditService) {
        this.auditService = auditService;
    }

    // 5. 使用Optional包装可选依赖
    @Autowired
    private Optional<MetricsService> metricsService;

    // 6. 注入集合
    @Autowired
    private List<OrderValidator> validators;

    @Autowired
    private Map<String, PaymentProcessor> paymentProcessors;
}
```

#### @Qualifier与@Primary

```java
// 定义多个同类型Bean
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary  // 默认注入此Bean
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
            DataSource primaryDs,  // 注入@Primary标注的Bean
            @Qualifier("replica") DataSource replicaDs,
            @Qualifier("analytics") DataSource analyticsDs) {
        this.primaryDs = primaryDs;
        this.replicaDs = replicaDs;
        this.analyticsDs = analyticsDs;
    }
}

// 自定义限定符注解
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

### Bean生命周期

Bean 的完整生命周期包含以下阶段：

```
┌─────────────────────────────────────────────────────────────┐
│                    Bean 生命周期                              │
├─────────────────────────────────────────────────────────────┤
│  1. 实例化 (Instantiation)                                   │
│     └─ BeanPostProcessor.postProcessBeforeInstantiation()    │
│                                                              │
│  2. 填充属性 (Populate Properties)                           │
│     └─ 依赖注入                                              │
│                                                              │
│  3. 设置Bean名称 (BeanNameAware.setBeanName())               │
│                                                              │
│  4. 设置BeanFactory (BeanFactoryAware.setBeanFactory())      │
│                                                              │
│  5. 设置ApplicationContext                                   │
│     (ApplicationContextAware.setApplicationContext())        │
│                                                              │
│  6. 初始化前置处理                                            │
│     (BeanPostProcessor.postProcessBeforeInitialization())    │
│                                                              │
│  7. 初始化                                                    │
│     ├─ @PostConstruct                                        │
│     ├─ InitializingBean.afterPropertiesSet()                 │
│     └─ 自定义init-method                                      │
│                                                              │
│  8. 初始化后置处理                                            │
│     (BeanPostProcessor.postProcessAfterInitialization())     │
│                                                              │
│  9. Bean就绪，可以使用                                        │
│                                                              │
│  10. 销毁                                                     │
│      ├─ @PreDestroy                                          │
│      ├─ DisposableBean.destroy()                             │
│      └─ 自定义destroy-method                                  │
└─────────────────────────────────────────────────────────────┘
```

生命周期回调示例：

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

    // 1. 构造器调用
    public DatabaseConnectionPool() {
        System.out.println("1. 构造器调用");
    }

    // 2. 依赖注入
    @Autowired
    public void setConfiguration(DataSourceProperties properties) {
        System.out.println("2. 依赖注入");
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
        // 验证连接池配置
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

### 组件扫描机制

```java
// 基本组件扫描
@Configuration
@ComponentScan(basePackages = "com.example.myapp")
public class AppConfig { }

// 指定多个包
@Configuration
@ComponentScan(basePackages = {"com.example.service", "com.example.repository"})
public class AppConfig { }

// 类型安全的扫描配置
@Configuration
@ComponentScan(basePackageClasses = {UserService.class, OrderRepository.class})
public class AppConfig { }

// 使用过滤器
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

// 自定义过滤器
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

## 代码示例

### 完整的IoC/DI应用示例

#### 领域模型

```java
// 用户实体
public class User {
    private Long id;
    private String username;
    private String email;
    private String password;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 构造器、getter、setter
    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.status = UserStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
    }

    // getter和setter省略
}

public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

#### Repository层

```java
// Repository接口
public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAll();
    User save(User user);
    void deleteById(Long id);
    boolean existsByEmail(String email);
}

// Repository实现
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

#### Service层

```java
// 密码编码器接口
public interface PasswordEncoder {
    String encode(String rawPassword);
    boolean matches(String rawPassword, String encodedPassword);
}

// BCrypt实现
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

// 邮件服务接口
public interface EmailService {
    void sendWelcomeEmail(String to, String username);
    void sendPasswordResetEmail(String to, String resetToken);
}

// 邮件服务实现
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

        sendHtmlEmail(to, "欢迎加入我们", content);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken) {
        Context context = new Context();
        context.setVariable("resetToken", resetToken);
        String content = templateEngine.process("email/password-reset", context);

        sendHtmlEmail(to, "密码重置", content);
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
            throw new EmailSendException("发送邮件失败", e);
        }
    }
}

// 用户服务
@Service
@Transactional(readOnly = true)
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    // 构造器注入所有依赖
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
        log.info("注册新用户: {}", username);

        // 验证用户名唯一性
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UsernameAlreadyExistsException(username);
        }

        // 验证邮箱唯一性
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        // 创建用户
        User user = new User(username, email, passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);

        // 发送欢迎邮件
        emailService.sendWelcomeEmail(email, username);

        // 发布用户注册事件
        eventPublisher.publishEvent(new UserRegisteredEvent(this, savedUser));

        log.info("用户注册成功: id={}", savedUser.getId());
        return savedUser;
    }

    @Transactional
    public User updateProfile(Long userId, String newUsername, String newEmail) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        // 验证新用户名
        if (!user.getUsername().equals(newUsername)) {
            userRepository.findByUsername(newUsername)
                .ifPresent(existing -> {
                    throw new UsernameAlreadyExistsException(newUsername);
                });
            user.setUsername(newUsername);
        }

        // 验证新邮箱
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

        log.info("用户密码已更新: id={}", userId);
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

#### 事件处理

```java
// 用户注册事件
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

// 事件监听器
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
        log.info("处理用户注册事件: userId={}", event.getUser().getId());

        // 更新指标
        metricsService.incrementCounter("user.registrations");

        // 记录审计日志
        auditService.log("USER_REGISTERED", event.getUser().getId().toString());
    }

    @EventListener
    @Async
    public void onUserDeactivated(UserDeactivatedEvent event) {
        log.info("处理用户停用事件: userId={}", event.getUser().getId());

        // 异步处理清理工作
        // ...
    }
}
```

#### 配置类

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

#### 启动类

```java
public class Application {

    public static void main(String[] args) {
        // 创建应用上下文
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

        // 获取服务并使用
        UserService userService = context.getBean(UserService.class);

        try {
            // 注册新用户
            User user = userService.register("john", "john@example.com", "password123");
            System.out.println("用户注册成功: " + user.getId());

            // 查询用户
            userService.findByUsername("john")
                .ifPresent(u -> System.out.println("找到用户: " + u.getUsername()));

        } catch (Exception e) {
            e.printStackTrace();
        }

        // 关闭上下文
        ((ConfigurableApplicationContext) context).close();
    }
}
```

## 最佳实践

### 优先使用构造器注入

```java
// 推荐：构造器注入
@Service
public class OrderService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PaymentService paymentService;

    // 依赖不可变，便于测试
    public OrderService(UserRepository userRepository,
                       ProductRepository productRepository,
                       PaymentService paymentService) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.paymentService = paymentService;
    }
}

// 不推荐：字段注入
@Service
public class OrderService {
    @Autowired
    private UserRepository userRepository;  // 难以测试

    @Autowired
    private ProductRepository productRepository;  // 隐藏依赖
}
```

### 面向接口编程

```java
// 定义接口
public interface NotificationService {
    void notify(String userId, String message);
}

// 实现类
@Service
@Primary
public class EmailNotificationService implements NotificationService {
    @Override
    public void notify(String userId, String message) {
        // 发送邮件通知
    }
}

@Service
@Qualifier("sms")
public class SmsNotificationService implements NotificationService {
    @Override
    public void notify(String userId, String message) {
        // 发送短信通知
    }
}

// 使用接口注入
@Service
public class AlertService {
    private final NotificationService notificationService;

    public AlertService(NotificationService notificationService) {
        this.notificationService = notificationService;  // 注入@Primary的实现
    }
}
```

### 合理使用Bean作用域

```java
// 无状态服务使用单例（默认）
@Service
public class CalculationService {
    public BigDecimal calculate(BigDecimal amount, BigDecimal rate) {
        return amount.multiply(rate);
    }
}

// 有状态对象使用原型
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

// 在单例中注入原型Bean需要使用方法注入
@Service
public class OrderProcessingService {

    @Lookup
    public ShoppingCart createShoppingCart() {
        // Spring会重写此方法
        return null;
    }

    public void processOrder(Long userId) {
        ShoppingCart cart = createShoppingCart();  // 每次获取新实例
        // 处理订单...
    }
}
```

### 使用@Lazy解决循环依赖

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

### 使用配置属性类

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

    // getter和setter
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

### 使用事件解耦

```java
// 定义事件
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

// 发布事件
@Service
public class OrderService {
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        Order order = // 创建订单逻辑

        // 发布事件，解耦后续处理
        eventPublisher.publishEvent(new OrderCreatedEvent(this, order));

        return order;
    }
}

// 监听事件
@Component
public class OrderEventHandlers {

    @EventListener
    public void sendConfirmationEmail(OrderCreatedEvent event) {
        // 发送确认邮件
    }

    @EventListener
    @Async
    public void updateInventory(OrderCreatedEvent event) {
        // 异步更新库存
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void notifyExternalSystem(OrderCreatedEvent event) {
        // 事务提交后通知外部系统
    }
}
```

## 常见陷阱

### 循环依赖

```java
// 问题：循环依赖导致Bean创建失败
@Service
public class ServiceA {
    private final ServiceB serviceB;

    public ServiceA(ServiceB serviceB) {  // 需要ServiceB
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    private final ServiceA serviceA;

    public ServiceB(ServiceA serviceA) {  // 需要ServiceA
        this.serviceA = serviceA;
    }
}

// 解决方案1：使用@Lazy延迟注入
@Service
public class ServiceA {
    private final ServiceB serviceB;

    public ServiceA(@Lazy ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

// 解决方案2：重构设计，提取公共依赖
@Service
public class SharedService {
    // 公共逻辑
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

// 解决方案3：使用setter注入（不推荐）
@Service
public class ServiceA {
    private ServiceB serviceB;

    @Autowired
    public void setServiceB(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}
```

### 在单例中注入原型Bean

```java
// 问题：原型Bean在单例中变成单例
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
    private final PrototypeBean prototypeBean;  // 只会注入一次

    public SingletonService(PrototypeBean prototypeBean) {
        this.prototypeBean = prototypeBean;
    }

    public void doSomething() {
        System.out.println(prototypeBean.getId());  // 总是同一个ID
    }
}

// 解决方案1：使用@Lookup方法
@Service
public abstract class SingletonService {

    @Lookup
    public abstract PrototypeBean getPrototypeBean();

    public void doSomething() {
        PrototypeBean bean = getPrototypeBean();  // 每次获取新实例
        System.out.println(bean.getId());
    }
}

// 解决方案2：使用ObjectFactory
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

// 解决方案3：使用Provider（JSR-330）
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

### @Transactional失效

```java
// 问题1：非public方法
@Service
public class OrderService {

    @Transactional  // 无效！
    private void processOrder(Order order) {
        // 事务不会生效
    }
}

// 问题2：同类内部调用
@Service
public class OrderService {

    public void createOrder(Order order) {
        processOrder(order);  // 直接调用，事务不生效
    }

    @Transactional
    public void processOrder(Order order) {
        // 事务不会生效
    }
}

// 解决方案：注入自身或拆分服务
@Service
public class OrderService {

    @Autowired
    private OrderService self;  // 注入代理对象

    public void createOrder(Order order) {
        self.processOrder(order);  // 通过代理调用
    }

    @Transactional
    public void processOrder(Order order) {
        // 事务正常生效
    }
}

// 问题3：异常类型不匹配
@Service
public class PaymentService {

    @Transactional  // 默认只回滚RuntimeException
    public void processPayment(Payment payment) throws PaymentException {
        // 检查性异常不会触发回滚
        throw new PaymentException("支付失败");
    }
}

// 解决方案：指定回滚异常
@Service
public class PaymentService {

    @Transactional(rollbackFor = Exception.class)
    public void processPayment(Payment payment) throws PaymentException {
        throw new PaymentException("支付失败");  // 现在会回滚
    }
}
```

### Bean命名冲突

```java
// 问题：两个同名Bean
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
    public DataSource dataSource() {  // 命名冲突！
        return createSecondaryDataSource();
    }
}

// 解决方案：使用不同名称
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

### @PostConstruct中使用事务

```java
// 问题：@PostConstruct中事务可能未完全初始化
@Service
public class DataInitService {

    private final UserRepository userRepository;

    public DataInitService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    @Transactional  // 可能不生效
    public void init() {
        // 初始化数据
        userRepository.save(new User("admin", "admin@example.com"));
    }
}

// 解决方案：使用事件监听
@Service
public class DataInitService {

    private final UserRepository userRepository;

    public DataInitService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        // 应用完全启动后初始化
        userRepository.save(new User("admin", "admin@example.com"));
    }
}
```

## 性能考量

### Bean初始化优化

```java
// 使用@Lazy延迟初始化非关键Bean
@Service
@Lazy
public class ReportGenerationService {
    // 重量级服务，按需加载
}

// 全局懒加载配置（Spring Boot）
// application.properties
spring.main.lazy-initialization=true

// 或在代码中配置
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(Application.class);
        app.setLazyInitialization(true);
        app.run(args);
    }
}
```

### 避免不必要的依赖

```java
// 反模式：注入整个ApplicationContext
@Service
public class BadService {
    @Autowired
    private ApplicationContext context;

    public void doSomething() {
        // 每次都从容器获取
        SomeBean bean = context.getBean(SomeBean.class);
    }
}

// 推荐：直接注入所需依赖
@Service
public class GoodService {
    private final SomeBean someBean;

    public GoodService(SomeBean someBean) {
        this.someBean = someBean;
    }

    public void doSomething() {
        // 直接使用
    }
}
```

### 组件扫描优化

```java
// 避免扫描过多包
@Configuration
@ComponentScan(basePackages = "com")  // 扫描范围太大

// 精确指定扫描包
@Configuration
@ComponentScan(basePackages = {
    "com.example.service",
    "com.example.repository",
    "com.example.controller"
})
public class AppConfig { }

// 或使用排除过滤器
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

### 单例Bean的线程安全

```java
// 问题：单例Bean中的可变状态
@Service
public class UnsafeService {
    private int counter = 0;  // 非线程安全

    public void increment() {
        counter++;  // 竞态条件
    }
}

// 解决方案1：使用原子类
@Service
public class SafeService {
    private final AtomicInteger counter = new AtomicInteger(0);

    public void increment() {
        counter.incrementAndGet();
    }
}

// 解决方案2：无状态设计
@Service
public class StatelessService {
    public int calculate(int input) {
        return input * 2;  // 无状态，天然线程安全
    }
}

// 解决方案3：使用ThreadLocal
@Service
public class ThreadLocalService {
    private final ThreadLocal<SimpleDateFormat> dateFormat =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    public String format(Date date) {
        return dateFormat.get().format(date);
    }
}
```

### 启动时间优化

```java
// 使用AOT（Ahead-of-Time）编译（Spring 6+）
// 在GraalVM Native Image环境下提升启动速度

// 使用类路径扫描索引
// 添加依赖：spring-context-indexer
// 编译时生成 META-INF/spring.components

// 减少自动配置
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class,
    // 排除不需要的自动配置
})
public class Application { }
```

## 实战场景

### 场景1：多数据源配置

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

### 场景2：策略模式与DI

```java
// 策略接口
public interface PaymentStrategy {
    PaymentResult process(Payment payment);
    String getType();
}

// 具体策略
@Component
public class CreditCardPaymentStrategy implements PaymentStrategy {
    @Override
    public PaymentResult process(Payment payment) {
        // 信用卡支付逻辑
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
        // 支付宝支付逻辑
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
        // 微信支付逻辑
        return PaymentResult.success();
    }

    @Override
    public String getType() {
        return "WECHAT";
    }
}

// 策略管理器
@Component
public class PaymentStrategyManager {
    private final Map<String, PaymentStrategy> strategies;

    // Spring自动注入所有PaymentStrategy实现
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

// 使用
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

### 场景3：动态Bean注册

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
        // 根据配置动态注册Bean
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
                throw new BeanCreationException("无法找到模块类: " + className, e);
            }
        }
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        // 可以在这里修改已注册的BeanDefinition
    }
}
```

### 场景4：条件化配置

```java
// 自定义条件
public class OnProductionEnvironmentCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String[] activeProfiles = context.getEnvironment().getActiveProfiles();
        return Arrays.asList(activeProfiles).contains("prod");
    }
}

// 使用自定义条件
@Configuration
@Conditional(OnProductionEnvironmentCondition.class)
public class ProductionConfig {

    @Bean
    public AuditService auditService() {
        return new ProductionAuditService();
    }
}

// 使用Spring Boot条件注解
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

## 面试要点

### 核心概念题

**1. IoC和DI有什么区别？**

IoC（控制反转）是一种设计原则，强调将对象的创建和依赖管理的控制权从应用代码转移到容器。DI（依赖注入）是实现IoC的具体方式，通过构造器、setter或字段将依赖注入到对象中。简单来说，IoC是"what"（目标），DI是"how"（手段）。

**2. Spring中有几种依赖注入方式？各自的优缺点？**

三种方式：
- **构造器注入**（推荐）：依赖不可变，便于测试，可以在构造时检测循环依赖
- **Setter注入**：可以注入可选依赖，允许重新配置
- **字段注入**：简洁但隐藏依赖，难以测试

**3. @Autowired和@Resource的区别？**

```java
// @Autowired：Spring注解，默认按类型注入
@Autowired
private UserService userService;

// 按名称注入需要配合@Qualifier
@Autowired
@Qualifier("primaryUserService")
private UserService userService;

// @Resource：JSR-250标准注解，默认按名称注入
@Resource(name = "primaryUserService")
private UserService userService;

// 不指定名称时按字段名匹配
@Resource
private UserService primaryUserService;  // 按名称"primaryUserService"注入
```

**4. 解释Bean的作用域及使用场景？**

- **singleton**：无状态服务，如Service、Repository
- **prototype**：有状态对象，如购物车、会话数据
- **request**：请求级数据，如用户请求上下文
- **session**：会话级数据，如用户登录信息
- **application**：应用级共享数据

**5. 如何解决循环依赖？**

- 使用`@Lazy`延迟初始化
- 重构代码消除循环
- 使用setter注入（不推荐）
- 注意：Spring 6.0+默认禁止构造器循环依赖

### 实践编码题

```java
// 题目1：实现一个简单的IoC容器
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

    // 带依赖注入的注册
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
        // 查找@Inject标注的构造器
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

// 题目2：实现Bean生命周期管理
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

        // 前置处理
        for (BeanPostProcessor processor : postProcessors) {
            result = processor.postProcessBeforeInitialization(result, beanName);
        }

        // 调用初始化方法
        invokeInitMethods(result);

        // 后置处理
        for (BeanPostProcessor processor : postProcessors) {
            result = processor.postProcessAfterInitialization(result, beanName);
        }

        return result;
    }

    private void invokeInitMethods(Object bean) {
        // 调用@PostConstruct方法
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

        // 调用InitializingBean接口
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

### 进阶问题

**1. Spring如何解决setter方式的循环依赖？**

Spring使用三级缓存解决setter循环依赖：
- 一级缓存（singletonObjects）：完全初始化的Bean
- 二级缓存（earlySingletonObjects）：提前曝光的Bean（未完成初始化）
- 三级缓存（singletonFactories）：Bean工厂

创建Bean A时，先将A的工厂放入三级缓存，然后填充属性时需要B，创建B时发现需要A，从三级缓存获取A的早期引用放入二级缓存，完成B的初始化，然后A获取到B完成初始化。

**2. 为什么构造器注入无法解决循环依赖？**

构造器注入需要在创建对象时就提供所有依赖，而此时依赖对象可能还未创建。Spring无法先创建一个"半成品"对象，因为对象必须通过构造器创建。

**3. BeanFactory和ApplicationContext的主要区别？**

- BeanFactory是延迟加载，ApplicationContext是预加载
- ApplicationContext提供更多企业级功能（事件发布、国际化、资源加载等）
- ApplicationContext自动注册BeanPostProcessor和BeanFactoryPostProcessor
- 实际开发中总是使用ApplicationContext

## 延伸阅读

### 官方文档

- [Spring Framework Reference - IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring Framework Reference - Bean Lifecycle](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)
- [Spring Framework API Documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/)

### 推荐书籍

- 《Spring实战》（第6版）- Craig Walls
- 《Spring揭秘》- 王福强
- 《Expert One-on-One J2EE Development without EJB》- Rod Johnson

### 相关主题

- **Spring AOP**：面向切面编程，IoC容器的重要补充
- **Spring Boot自动配置**：基于IoC的自动化配置机制
- **Spring Cloud**：分布式系统中的依赖管理
- **JSR-330标准**：Java依赖注入规范

### 源码学习

核心类推荐阅读顺序：
1. `BeanFactory` - IoC容器核心接口
2. `DefaultListableBeanFactory` - BeanFactory默认实现
3. `AbstractApplicationContext` - ApplicationContext核心实现
4. `AnnotationConfigApplicationContext` - 注解驱动的上下文
5. `AutowiredAnnotationBeanPostProcessor` - @Autowired处理器

---

> 深入理解Spring IoC/DI是掌握整个Spring生态系统的基础。通过本文的学习，你应该能够理解IoC容器的工作原理，熟练使用各种依赖注入方式，并能够避免常见的陷阱。建议结合实际项目练习，加深对这些概念的理解。
