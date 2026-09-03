---
title: Hibernate ORM 深入指南
description: 全面掌握 Hibernate ORM 框架的核心概念、实体映射、查询语言与性能优化
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Hibernate
  - ORM
  - JPA
  - 数据库
status: imported
origin: old/src/content/docs/java/hibernate.zh.md
divergence: 0.208
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: ORM框架
  order: 13
  lastUpdated: 2026-01-07
---

Hibernate 是 Java 生态系统中最流行的对象关系映射（ORM）框架，它实现了 JPA（Java Persistence API）规范，提供了强大的数据持久化能力。本文将全面介绍 Hibernate 的核心概念、实体映射、查询机制和性能优化技巧。

## 概念解释

### 什么是 ORM

ORM（Object-Relational Mapping，对象关系映射）是一种编程技术，用于在面向对象编程语言和关系型数据库之间建立映射关系。它解决了面向对象模型与关系模型之间的"阻抗不匹配"问题。

**传统 JDBC 开发的问题：**

```java
// 传统 JDBC 方式 - 繁琐且容易出错
public User findUserById(Long id) throws SQLException {
    String sql = "SELECT id, name, email, created_at FROM users WHERE id = ?";
    try (Connection conn = dataSource.getConnection();
         PreparedStatement stmt = conn.prepareStatement(sql)) {
        stmt.setLong(1, id);
        try (ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                User user = new User();
                user.setId(rs.getLong("id"));
                user.setName(rs.getString("name"));
                user.setEmail(rs.getString("email"));
                user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                return user;
            }
        }
    }
    return null;
}
```

**使用 Hibernate 的方式：**

```java
// Hibernate 方式 - 简洁优雅
public User findUserById(Long id) {
    return session.find(User.class, id);
}
```

### Hibernate 的历史与发展

- **2001年**：Gavin King 创建 Hibernate，解决 EJB 2.x Entity Bean 的复杂性问题
- **2006年**：JPA 1.0 发布，Hibernate 成为 JPA 参考实现
- **2010年**：Hibernate 3.5 完全兼容 JPA 2.0
- **2017年**：Hibernate 5.2 支持 JPA 2.1
- **2022年**：Hibernate 6.0 发布，支持 Jakarta EE 9+ 和 JPA 3.0

### Hibernate 与 JPA 的关系

```
┌─────────────────────────────────────────────────────┐
│                   应用程序代码                        │
├─────────────────────────────────────────────────────┤
│                  JPA API (规范)                      │
│          (EntityManager, JPQL, Criteria)            │
├─────────────────────────────────────────────────────┤
│              Hibernate (JPA 实现)                    │
│    (SessionFactory, Session, HQL, Criteria)         │
├─────────────────────────────────────────────────────┤
│                    JDBC                             │
├─────────────────────────────────────────────────────┤
│                 关系型数据库                          │
└─────────────────────────────────────────────────────┘
```

- **JPA** 是规范（接口），定义了标准的持久化 API
- **Hibernate** 是 JPA 的实现，同时提供了扩展功能
- 建议优先使用 JPA API，需要高级功能时使用 Hibernate 原生 API

## 核心原理

### 核心架构

Hibernate 的核心架构包含以下关键组件：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SessionFactory                          │   │
│  │  - 线程安全的重量级对象                                      │   │
│  │  - 整个应用生命周期内只需一个实例                             │   │
│  │  - 负责创建 Session                                        │   │
│  │  - 缓存预编译的 SQL 语句和映射元数据                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Session                              │   │
│  │  - 非线程安全的轻量级对象                                    │   │
│  │  - 代表与数据库的一次会话                                    │   │
│  │  - 一级缓存（持久化上下文）                                  │   │
│  │  - 负责 CRUD 操作                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Transaction                             │   │
│  │  - 管理数据库事务                                           │   │
│  │  - 确保数据一致性                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      JDBC                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 实体生命周期

Hibernate 中的实体对象有四种状态：

```
┌─────────────┐    new     ┌─────────────┐
│   Transient │ ─────────► │  Persistent │
│   (瞬时态)   │            │   (持久态)   │
└─────────────┘            └─────────────┘
      ▲                          │ │
      │                          │ │
      │ new                      │ │ evict/clear/close
      │                          │ │
      │                          ▼ ▼
┌─────────────┐   delete   ┌─────────────┐
│   Removed   │ ◄───────── │  Detached   │
│   (删除态)   │            │   (游离态)   │
└─────────────┘            └─────────────┘
                                 │
                           merge/update
                                 │
                                 ▼
                          ┌─────────────┐
                          │  Persistent │
                          └─────────────┘
```

**四种状态详解：**

1. **Transient（瞬时态）**：对象刚被创建，没有与任何 Session 关联，没有数据库标识
2. **Persistent（持久态）**：对象与 Session 关联，有数据库标识，任何修改会自动同步到数据库
3. **Detached（游离态）**：对象曾经是持久态，但 Session 已关闭
4. **Removed（删除态）**：对象被标记为删除，事务提交后从数据库删除

```java
// 实体状态转换示例
public class EntityLifecycleDemo {

    public void demonstrateLifecycle(SessionFactory sessionFactory) {
        // 1. Transient 状态 - 新创建的对象
        User user = new User();
        user.setName("张三");
        user.setEmail("zhangsan@example.com");
        // 此时 user 是 Transient 状态

        Session session = sessionFactory.openSession();
        Transaction tx = session.beginTransaction();

        // 2. Persistent 状态 - 调用 persist/save 后
        session.persist(user);
        // 此时 user 是 Persistent 状态，已有 ID
        System.out.println("User ID: " + user.getId());

        // 持久态对象的修改会自动同步（脏检查机制）
        user.setName("李四");
        // 不需要调用 update，Hibernate 会自动检测变化

        tx.commit();
        session.close();
        // 3. Detached 状态 - Session 关闭后
        // 此时 user 是 Detached 状态

        // 重新附加到新 Session
        Session newSession = sessionFactory.openSession();
        Transaction newTx = newSession.beginTransaction();

        // 4. 重新变为 Persistent 状态
        User mergedUser = newSession.merge(user);
        // mergedUser 是 Persistent 状态

        // 5. Removed 状态
        newSession.remove(mergedUser);
        // 此时 mergedUser 是 Removed 状态

        newTx.commit();
        newSession.close();
    }
}
```

### 持久化上下文与脏检查

持久化上下文（Persistence Context）是 Hibernate 的核心概念之一，也称为一级缓存：

```java
public class PersistenceContextDemo {

    public void demonstratePersistenceContext(Session session) {
        Transaction tx = session.beginTransaction();

        // 第一次查询 - 发送 SQL 到数据库
        User user1 = session.find(User.class, 1L);

        // 第二次查询同一实体 - 从一级缓存获取，不发送 SQL
        User user2 = session.find(User.class, 1L);

        // user1 和 user2 是同一个对象
        System.out.println(user1 == user2); // true

        // 脏检查示例
        user1.setName("新名字");
        // Hibernate 在 flush 时自动检测变化并生成 UPDATE 语句

        tx.commit(); // 自动 flush，执行 UPDATE
    }

    // 手动 flush 控制
    public void manualFlush(Session session) {
        Transaction tx = session.beginTransaction();

        User user = session.find(User.class, 1L);
        user.setName("临时名字");

        // 手动刷新，立即执行 SQL
        session.flush();

        // 此时数据库已更新，但事务未提交
        user.setName("最终名字");

        tx.commit(); // 再次 flush 并提交
    }
}
```

## 核心要点

### SessionFactory 配置

SessionFactory 是创建 Session 的工厂，整个应用应该只有一个实例：

```java
// hibernate.cfg.xml 配置方式
public class HibernateUtil {
    private static final SessionFactory sessionFactory;

    static {
        try {
            // 从 hibernate.cfg.xml 加载配置
            Configuration configuration = new Configuration().configure();
            sessionFactory = configuration.buildSessionFactory();
        } catch (Throwable ex) {
            throw new ExceptionInInitializerError(ex);
        }
    }

    public static SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    public static void shutdown() {
        getSessionFactory().close();
    }
}
```

**hibernate.cfg.xml 配置文件：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-configuration PUBLIC
    "-//Hibernate/Hibernate Configuration DTD 3.0//EN"
    "http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
    <session-factory>
        <!-- 数据库连接配置 -->
        <property name="hibernate.connection.driver_class">com.mysql.cj.jdbc.Driver</property>
        <property name="hibernate.connection.url">jdbc:mysql://localhost:3306/mydb?useSSL=false&amp;serverTimezone=UTC</property>
        <property name="hibernate.connection.username">root</property>
        <property name="hibernate.connection.password">password</property>

        <!-- 连接池配置 -->
        <property name="hibernate.c3p0.min_size">5</property>
        <property name="hibernate.c3p0.max_size">20</property>
        <property name="hibernate.c3p0.timeout">300</property>
        <property name="hibernate.c3p0.max_statements">50</property>

        <!-- Hibernate 配置 -->
        <property name="hibernate.dialect">org.hibernate.dialect.MySQLDialect</property>
        <property name="hibernate.show_sql">true</property>
        <property name="hibernate.format_sql">true</property>
        <property name="hibernate.hbm2ddl.auto">update</property>

        <!-- 二级缓存配置 -->
        <property name="hibernate.cache.use_second_level_cache">true</property>
        <property name="hibernate.cache.region.factory_class">
            org.hibernate.cache.jcache.JCacheRegionFactory
        </property>

        <!-- 实体映射 -->
        <mapping class="com.example.entity.User"/>
        <mapping class="com.example.entity.Order"/>
    </session-factory>
</hibernate-configuration>
```

**程序化配置方式：**

```java
public class ProgrammaticConfiguration {

    public static SessionFactory buildSessionFactory() {
        Configuration configuration = new Configuration();

        // 数据库连接配置
        configuration.setProperty("hibernate.connection.driver_class", "com.mysql.cj.jdbc.Driver");
        configuration.setProperty("hibernate.connection.url", "jdbc:mysql://localhost:3306/mydb");
        configuration.setProperty("hibernate.connection.username", "root");
        configuration.setProperty("hibernate.connection.password", "password");

        // Hibernate 配置
        configuration.setProperty("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        configuration.setProperty("hibernate.show_sql", "true");
        configuration.setProperty("hibernate.format_sql", "true");
        configuration.setProperty("hibernate.hbm2ddl.auto", "update");

        // 添加实体类
        configuration.addAnnotatedClass(User.class);
        configuration.addAnnotatedClass(Order.class);

        return configuration.buildSessionFactory();
    }
}
```

### Session 操作

Session 是与数据库交互的主要接口：

```java
public class SessionOperations {
    private SessionFactory sessionFactory;

    // 保存实体
    public Long saveUser(User user) {
        Session session = sessionFactory.openSession();
        Transaction tx = null;
        try {
            tx = session.beginTransaction();

            // persist() - JPA 标准方法
            session.persist(user);

            // 或使用 save() - Hibernate 原生方法，返回 ID
            // Long id = (Long) session.save(user);

            tx.commit();
            return user.getId();
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw e;
        } finally {
            session.close();
        }
    }

    // 查询实体
    public User findUser(Long id) {
        try (Session session = sessionFactory.openSession()) {
            // find() - 返回 null 如果不存在
            return session.find(User.class, id);

            // 或使用 get() - Hibernate 原生方法
            // return session.get(User.class, id);

            // getReference() - 返回代理对象，延迟加载
            // return session.getReference(User.class, id);
        }
    }

    // 更新实体
    public void updateUser(User user) {
        try (Session session = sessionFactory.openSession()) {
            Transaction tx = session.beginTransaction();

            // merge() - 合并游离态对象
            session.merge(user);

            tx.commit();
        }
    }

    // 删除实体
    public void deleteUser(Long id) {
        try (Session session = sessionFactory.openSession()) {
            Transaction tx = session.beginTransaction();

            User user = session.find(User.class, id);
            if (user != null) {
                session.remove(user);
            }

            tx.commit();
        }
    }
}
```

### 实体映射

#### 基本实体映射

```java
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users",
       indexes = {
           @Index(name = "idx_email", columnList = "email"),
           @Index(name = "idx_created_at", columnList = "created_at")
       },
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "email")
       })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Long version; // 乐观锁版本号

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
}

enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

#### ID 生成策略

```java
// 1. IDENTITY - 数据库自增（MySQL、PostgreSQL）
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

// 2. SEQUENCE - 序列（Oracle、PostgreSQL）
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
@SequenceGenerator(name = "user_seq", sequenceName = "user_sequence", allocationSize = 50)
private Long id;

// 3. TABLE - 模拟序列的表
@Id
@GeneratedValue(strategy = GenerationType.TABLE, generator = "user_gen")
@TableGenerator(name = "user_gen", table = "id_generator",
                pkColumnName = "gen_name", valueColumnName = "gen_value",
                pkColumnValue = "user_id", allocationSize = 50)
private Long id;

// 4. UUID - 通用唯一标识符
@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;

// 5. AUTO - 让 Hibernate 选择策略
@Id
@GeneratedValue(strategy = GenerationType.AUTO)
private Long id;
```

#### 关联映射

**一对多 / 多对一关系：**

```java
@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // 一对多：一个部门有多个员工
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Employee> employees = new ArrayList<>();

    // 便捷方法：维护双向关系
    public void addEmployee(Employee employee) {
        employees.add(employee);
        employee.setDepartment(this);
    }

    public void removeEmployee(Employee employee) {
        employees.remove(employee);
        employee.setDepartment(null);
    }
}

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // 多对一：多个员工属于一个部门
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
}
```

**多对多关系：**

```java
@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "student_courses",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new HashSet<>();

    public void enrollCourse(Course course) {
        courses.add(course);
        course.getStudents().add(this);
    }

    public void dropCourse(Course course) {
        courses.remove(course);
        course.getStudents().remove(this);
    }
}

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToMany(mappedBy = "courses")
    private Set<Student> students = new HashSet<>();
}
```

**一对一关系：**

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    // 一对一：共享主键
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL,
              fetch = FetchType.LAZY, optional = false)
    private UserProfile profile;

    public void setProfile(UserProfile profile) {
        if (profile == null) {
            if (this.profile != null) {
                this.profile.setUser(null);
            }
        } else {
            profile.setUser(this);
        }
        this.profile = profile;
    }
}

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // 共享主键
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 500)
    private String bio;

    private String avatarUrl;
}
```

#### 嵌入式类型

```java
@Embeddable
public class Address {

    @Column(length = 100)
    private String street;

    @Column(length = 50)
    private String city;

    @Column(length = 50)
    private String state;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(length = 50)
    private String country;
}

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "street", column = @Column(name = "hq_street")),
        @AttributeOverride(name = "city", column = @Column(name = "hq_city")),
        @AttributeOverride(name = "state", column = @Column(name = "hq_state")),
        @AttributeOverride(name = "zipCode", column = @Column(name = "hq_zip")),
        @AttributeOverride(name = "country", column = @Column(name = "hq_country"))
    })
    private Address headquartersAddress;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "street", column = @Column(name = "billing_street")),
        @AttributeOverride(name = "city", column = @Column(name = "billing_city")),
        @AttributeOverride(name = "state", column = @Column(name = "billing_state")),
        @AttributeOverride(name = "zipCode", column = @Column(name = "billing_zip")),
        @AttributeOverride(name = "country", column = @Column(name = "billing_country"))
    })
    private Address billingAddress;
}
```

#### 继承映射

```java
// 策略一：单表继承（SINGLE_TABLE）- 所有子类在一个表中
@Entity
@Table(name = "payments")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "payment_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;
}

@Entity
@DiscriminatorValue("CREDIT_CARD")
public class CreditCardPayment extends Payment {

    @Column(name = "card_number")
    private String cardNumber;

    @Column(name = "expiry_date")
    private String expiryDate;
}

@Entity
@DiscriminatorValue("BANK_TRANSFER")
public class BankTransferPayment extends Payment {

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number")
    private String accountNumber;
}

// 策略二：连接表继承（JOINED）- 每个类一个表
@Entity
@Table(name = "vehicles")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String manufacturer;
    private String model;
}

@Entity
@Table(name = "cars")
@PrimaryKeyJoinColumn(name = "vehicle_id")
public class Car extends Vehicle {
    private int numberOfDoors;
    private String fuelType;
}

@Entity
@Table(name = "motorcycles")
@PrimaryKeyJoinColumn(name = "vehicle_id")
public class Motorcycle extends Vehicle {
    private int engineCC;
    private boolean hasSidecar;
}

// 策略三：每类一表（TABLE_PER_CLASS）
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String message;
    private LocalDateTime sentAt;
}

@Entity
@Table(name = "email_notifications")
public class EmailNotification extends Notification {
    private String emailAddress;
    private String subject;
}

@Entity
@Table(name = "sms_notifications")
public class SmsNotification extends Notification {
    private String phoneNumber;
}
```

## 代码示例

### HQL（Hibernate Query Language）

HQL 是面向对象的查询语言，类似于 SQL，但操作的是实体对象而非表：

```java
public class HQLExamples {
    private Session session;

    // 基本查询
    public List<User> findAllUsers() {
        String hql = "FROM User";
        return session.createQuery(hql, User.class).getResultList();
    }

    // 条件查询
    public List<User> findUsersByStatus(UserStatus status) {
        String hql = "FROM User u WHERE u.status = :status";
        return session.createQuery(hql, User.class)
                      .setParameter("status", status)
                      .getResultList();
    }

    // 模糊查询
    public List<User> searchUsersByName(String keyword) {
        String hql = "FROM User u WHERE u.name LIKE :keyword";
        return session.createQuery(hql, User.class)
                      .setParameter("keyword", "%" + keyword + "%")
                      .getResultList();
    }

    // 排序和分页
    public List<User> findUsersWithPagination(int page, int size) {
        String hql = "FROM User u ORDER BY u.createdAt DESC";
        return session.createQuery(hql, User.class)
                      .setFirstResult(page * size)
                      .setMaxResults(size)
                      .getResultList();
    }

    // 投影查询（只查询特定字段）
    public List<Object[]> findUserNameAndEmail() {
        String hql = "SELECT u.name, u.email FROM User u";
        return session.createQuery(hql, Object[].class).getResultList();
    }

    // 使用 DTO 投影
    public List<UserDTO> findUserDTOs() {
        String hql = "SELECT new com.example.dto.UserDTO(u.id, u.name, u.email) FROM User u";
        return session.createQuery(hql, UserDTO.class).getResultList();
    }

    // 关联查询
    public List<Order> findOrdersWithUser() {
        String hql = "SELECT o FROM Order o JOIN FETCH o.user WHERE o.status = :status";
        return session.createQuery(hql, Order.class)
                      .setParameter("status", OrderStatus.PENDING)
                      .getResultList();
    }

    // 聚合查询
    public Long countActiveUsers() {
        String hql = "SELECT COUNT(u) FROM User u WHERE u.status = :status";
        return session.createQuery(hql, Long.class)
                      .setParameter("status", UserStatus.ACTIVE)
                      .getSingleResult();
    }

    // 分组查询
    public List<Object[]> countUsersByStatus() {
        String hql = "SELECT u.status, COUNT(u) FROM User u GROUP BY u.status";
        return session.createQuery(hql, Object[].class).getResultList();
    }

    // 子查询
    public List<User> findUsersWithOrders() {
        String hql = "FROM User u WHERE u.id IN " +
                     "(SELECT DISTINCT o.user.id FROM Order o WHERE o.totalAmount > :amount)";
        return session.createQuery(hql, User.class)
                      .setParameter("amount", new BigDecimal("1000"))
                      .getResultList();
    }

    // 更新查询
    public int updateUserStatus(UserStatus oldStatus, UserStatus newStatus) {
        String hql = "UPDATE User u SET u.status = :newStatus WHERE u.status = :oldStatus";
        return session.createQuery(hql)
                      .setParameter("newStatus", newStatus)
                      .setParameter("oldStatus", oldStatus)
                      .executeUpdate();
    }

    // 删除查询
    public int deleteInactiveUsers() {
        String hql = "DELETE FROM User u WHERE u.status = :status";
        return session.createQuery(hql)
                      .setParameter("status", UserStatus.INACTIVE)
                      .executeUpdate();
    }
}
```

### Criteria API

Criteria API 提供了类型安全的、面向对象的查询方式：

```java
public class CriteriaExamples {
    private Session session;

    // 基本查询
    public List<User> findAllUsers() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);
        cq.select(root);

        return session.createQuery(cq).getResultList();
    }

    // 条件查询
    public List<User> findActiveUsers() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        cq.select(root)
          .where(cb.equal(root.get("status"), UserStatus.ACTIVE));

        return session.createQuery(cq).getResultList();
    }

    // 多条件查询
    public List<User> findUsersByCriteria(String name, UserStatus status,
                                          LocalDateTime startDate, LocalDateTime endDate) {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        List<Predicate> predicates = new ArrayList<>();

        if (name != null && !name.isEmpty()) {
            predicates.add(cb.like(root.get("name"), "%" + name + "%"));
        }

        if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
        }

        if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
        }

        if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
        }

        cq.select(root)
          .where(predicates.toArray(new Predicate[0]))
          .orderBy(cb.desc(root.get("createdAt")));

        return session.createQuery(cq).getResultList();
    }

    // 分页查询
    public List<User> findUsersWithPagination(int page, int size) {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        cq.select(root).orderBy(cb.desc(root.get("createdAt")));

        return session.createQuery(cq)
                      .setFirstResult(page * size)
                      .setMaxResults(size)
                      .getResultList();
    }

    // 计数查询
    public Long countUsers() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<User> root = cq.from(User.class);

        cq.select(cb.count(root));

        return session.createQuery(cq).getSingleResult();
    }

    // 关联查询
    public List<Order> findOrdersWithUser() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Order> cq = cb.createQuery(Order.class);
        Root<Order> root = cq.from(Order.class);

        // Fetch join 避免 N+1 问题
        root.fetch("user", JoinType.LEFT);

        cq.select(root)
          .where(cb.equal(root.get("status"), OrderStatus.PENDING));

        return session.createQuery(cq).getResultList();
    }

    // 聚合查询
    public List<Object[]> getOrderStatistics() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Object[]> cq = cb.createQuery(Object[].class);
        Root<Order> root = cq.from(Order.class);

        cq.multiselect(
            root.get("status"),
            cb.count(root),
            cb.sum(root.get("totalAmount")),
            cb.avg(root.get("totalAmount"))
        ).groupBy(root.get("status"));

        return session.createQuery(cq).getResultList();
    }
}
```

### 命名查询

```java
@Entity
@Table(name = "users")
@NamedQueries({
    @NamedQuery(
        name = "User.findByStatus",
        query = "FROM User u WHERE u.status = :status"
    ),
    @NamedQuery(
        name = "User.findByEmail",
        query = "FROM User u WHERE u.email = :email"
    ),
    @NamedQuery(
        name = "User.countByStatus",
        query = "SELECT COUNT(u) FROM User u WHERE u.status = :status"
    )
})
@NamedNativeQueries({
    @NamedNativeQuery(
        name = "User.findAllNative",
        query = "SELECT * FROM users WHERE status = ?",
        resultClass = User.class
    )
})
public class User {
    // ... 实体字段
}

// 使用命名查询
public class NamedQueryExample {
    private Session session;

    public List<User> findActiveUsers() {
        return session.createNamedQuery("User.findByStatus", User.class)
                      .setParameter("status", UserStatus.ACTIVE)
                      .getResultList();
    }

    public User findByEmail(String email) {
        return session.createNamedQuery("User.findByEmail", User.class)
                      .setParameter("email", email)
                      .uniqueResult();
    }
}
```

### 原生 SQL 查询

```java
public class NativeQueryExamples {
    private Session session;

    // 基本原生查询
    public List<User> findUsersNative() {
        String sql = "SELECT * FROM users WHERE status = :status";
        return session.createNativeQuery(sql, User.class)
                      .setParameter("status", "ACTIVE")
                      .getResultList();
    }

    // 复杂原生查询
    public List<Object[]> getComplexStatistics() {
        String sql = """
            SELECT
                u.id,
                u.name,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.status = :status
            GROUP BY u.id, u.name
            HAVING COUNT(o.id) > :minOrders
            ORDER BY total_spent DESC
            """;

        return session.createNativeQuery(sql, Object[].class)
                      .setParameter("status", "ACTIVE")
                      .setParameter("minOrders", 5)
                      .getResultList();
    }

    // 使用结果集映射
    @SqlResultSetMapping(
        name = "UserStatisticsMapping",
        classes = @ConstructorResult(
            targetClass = UserStatistics.class,
            columns = {
                @ColumnResult(name = "user_id", type = Long.class),
                @ColumnResult(name = "user_name", type = String.class),
                @ColumnResult(name = "order_count", type = Long.class),
                @ColumnResult(name = "total_spent", type = BigDecimal.class)
            }
        )
    )
    public List<UserStatistics> getUserStatistics() {
        String sql = """
            SELECT u.id as user_id, u.name as user_name,
                   COUNT(o.id) as order_count,
                   COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id, u.name
            """;

        return session.createNativeQuery(sql, "UserStatisticsMapping")
                      .getResultList();
    }
}
```

### 缓存配置与使用

#### 一级缓存（Session 级别）

```java
public class FirstLevelCacheDemo {

    public void demonstrateFirstLevelCache(SessionFactory sessionFactory) {
        try (Session session = sessionFactory.openSession()) {
            // 第一次查询 - 发送 SQL 到数据库
            User user1 = session.find(User.class, 1L);
            System.out.println("第一次查询: " + user1.getName());

            // 第二次查询 - 从一级缓存获取，不发送 SQL
            User user2 = session.find(User.class, 1L);
            System.out.println("第二次查询: " + user2.getName());

            // 验证是同一个对象
            System.out.println("是否同一对象: " + (user1 == user2)); // true

            // 清除一级缓存
            session.clear();

            // 第三次查询 - 缓存已清除，再次发送 SQL
            User user3 = session.find(User.class, 1L);
            System.out.println("第三次查询: " + user3.getName());
        }
    }
}
```

#### 二级缓存（SessionFactory 级别）

```java
// 实体类配置二级缓存
@Entity
@Table(name = "users")
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class User {
    // ... 实体字段
}

// hibernate.cfg.xml 二级缓存配置
/*
<property name="hibernate.cache.use_second_level_cache">true</property>
<property name="hibernate.cache.region.factory_class">
    org.hibernate.cache.jcache.JCacheRegionFactory
</property>
<property name="hibernate.javax.cache.provider">
    org.ehcache.jsr107.EhcacheCachingProvider
</property>
<property name="hibernate.cache.use_query_cache">true</property>
*/

public class SecondLevelCacheDemo {

    public void demonstrateSecondLevelCache(SessionFactory sessionFactory) {
        // 第一个 Session
        try (Session session1 = sessionFactory.openSession()) {
            User user1 = session1.find(User.class, 1L);
            System.out.println("Session1 查询: " + user1.getName());
        }

        // 第二个 Session - 从二级缓存获取
        try (Session session2 = sessionFactory.openSession()) {
            User user2 = session2.find(User.class, 1L);
            System.out.println("Session2 查询: " + user2.getName());
        }

        // 查询缓存统计
        Statistics statistics = sessionFactory.getStatistics();
        System.out.println("二级缓存命中: " + statistics.getSecondLevelCacheHitCount());
        System.out.println("二级缓存未命中: " + statistics.getSecondLevelCacheMissCount());
    }
}
```

#### 查询缓存

```java
public class QueryCacheDemo {
    private Session session;

    public List<User> findActiveUsersWithQueryCache() {
        String hql = "FROM User u WHERE u.status = :status";

        return session.createQuery(hql, User.class)
                      .setParameter("status", UserStatus.ACTIVE)
                      .setCacheable(true) // 启用查询缓存
                      .setCacheRegion("activeUsers") // 指定缓存区域
                      .getResultList();
    }
}
```

### 延迟加载与急加载

```java
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 延迟加载（默认）- 访问时才加载
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 急加载 - 立即加载
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;

    // 延迟加载的集合
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();
}

public class LazyLoadingDemo {

    // 解决 LazyInitializationException
    public Order getOrderWithItems(Session session, Long orderId) {
        // 方法一：使用 JOIN FETCH
        String hql = "SELECT o FROM Order o " +
                     "JOIN FETCH o.user " +
                     "JOIN FETCH o.items " +
                     "WHERE o.id = :id";

        return session.createQuery(hql, Order.class)
                      .setParameter("id", orderId)
                      .uniqueResult();
    }

    // 方法二：使用 Hibernate.initialize()
    public Order getOrderWithItemsV2(Session session, Long orderId) {
        Order order = session.find(Order.class, orderId);
        Hibernate.initialize(order.getItems()); // 强制初始化
        return order;
    }

    // 方法三：使用 EntityGraph
    public Order getOrderWithEntityGraph(Session session, Long orderId) {
        EntityGraph<Order> graph = session.createEntityGraph(Order.class);
        graph.addAttributeNodes("user", "items");

        Map<String, Object> hints = new HashMap<>();
        hints.put("jakarta.persistence.fetchgraph", graph);

        return session.find(Order.class, orderId, hints);
    }
}
```

## 最佳实践

### 实体设计最佳实践

```java
@Entity
@Table(name = "products")
public class Product {

    // 使用包装类型而非原始类型
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 不要用 long

    @Column(nullable = false)
    private String name;

    // 使用 BigDecimal 处理金额
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    // 正确实现 equals 和 hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        // 使用业务键或 ID（如果已持久化）
        return id != null && Objects.equals(id, product.id);
    }

    @Override
    public int hashCode() {
        // 使用固定值或业务键
        return getClass().hashCode();
    }

    // 提供有意义的 toString
    @Override
    public String toString() {
        return "Product{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", price=" + price +
               '}';
    }
}
```

### 关联关系最佳实践

```java
@Entity
@Table(name = "parents")
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 使用 Set 而非 List 提高性能
    @OneToMany(mappedBy = "parent",
               cascade = CascadeType.ALL,
               orphanRemoval = true)
    private Set<Child> children = new HashSet<>();

    // 提供同步双向关系的便捷方法
    public void addChild(Child child) {
        children.add(child);
        child.setParent(this);
    }

    public void removeChild(Child child) {
        children.remove(child);
        child.setParent(null);
    }
}

@Entity
@Table(name = "children")
public class Child {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 关联端始终使用 LAZY 加载
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Parent parent;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Child child = (Child) o;
        return id != null && Objects.equals(id, child.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

### 事务管理最佳实践

```java
@Service
public class UserService {

    private final SessionFactory sessionFactory;

    // 推荐：使用声明式事务（Spring）
    @Transactional
    public void createUser(User user) {
        Session session = sessionFactory.getCurrentSession();
        session.persist(user);
    }

    @Transactional(readOnly = true)
    public User findUser(Long id) {
        Session session = sessionFactory.getCurrentSession();
        return session.find(User.class, id);
    }

    // 手动事务管理模板
    public void manualTransaction(Consumer<Session> operation) {
        Session session = null;
        Transaction tx = null;
        try {
            session = sessionFactory.openSession();
            tx = session.beginTransaction();

            operation.accept(session);

            tx.commit();
        } catch (Exception e) {
            if (tx != null && tx.isActive()) {
                tx.rollback();
            }
            throw e;
        } finally {
            if (session != null) {
                session.close();
            }
        }
    }
}
```

### 批量操作最佳实践

```java
public class BatchOperations {

    private static final int BATCH_SIZE = 50;

    // 批量插入
    public void batchInsert(Session session, List<User> users) {
        Transaction tx = session.beginTransaction();

        for (int i = 0; i < users.size(); i++) {
            session.persist(users.get(i));

            if (i > 0 && i % BATCH_SIZE == 0) {
                // 刷新并清除一级缓存
                session.flush();
                session.clear();
            }
        }

        tx.commit();
    }

    // 使用 StatelessSession 进行大批量操作
    public void batchInsertStateless(SessionFactory sessionFactory, List<User> users) {
        try (StatelessSession session = sessionFactory.openStatelessSession()) {
            Transaction tx = session.beginTransaction();

            for (User user : users) {
                session.insert(user);
            }

            tx.commit();
        }
    }

    // 批量更新
    public int batchUpdate(Session session) {
        String hql = "UPDATE User u SET u.status = :newStatus " +
                     "WHERE u.status = :oldStatus";

        return session.createQuery(hql)
                      .setParameter("newStatus", UserStatus.INACTIVE)
                      .setParameter("oldStatus", UserStatus.ACTIVE)
                      .executeUpdate();
    }
}
```

## 常见陷阱

### N+1 查询问题

```java
// 问题代码：N+1 查询
public void n1Problem(Session session) {
    List<Order> orders = session.createQuery("FROM Order", Order.class).getResultList();

    for (Order order : orders) {
        // 每次访问 user 都会触发一次查询！
        System.out.println(order.getUser().getName());
    }
}

// 解决方案 1：JOIN FETCH
public void solution1(Session session) {
    String hql = "SELECT o FROM Order o JOIN FETCH o.user";
    List<Order> orders = session.createQuery(hql, Order.class).getResultList();

    for (Order order : orders) {
        System.out.println(order.getUser().getName()); // 不会触发额外查询
    }
}

// 解决方案 2：EntityGraph
public void solution2(Session session) {
    EntityGraph<Order> graph = session.createEntityGraph(Order.class);
    graph.addAttributeNodes("user");

    List<Order> orders = session.createQuery("FROM Order", Order.class)
                                .setHint("jakarta.persistence.fetchgraph", graph)
                                .getResultList();
}

// 解决方案 3：批量抓取
@Entity
@BatchSize(size = 25) // 批量加载 25 个
public class User {
    // ...
}
```

### LazyInitializationException

```java
// 问题代码
public User getUserOutsideSession(SessionFactory sessionFactory, Long id) {
    User user;
    try (Session session = sessionFactory.openSession()) {
        user = session.find(User.class, id);
    }
    // Session 已关闭，访问延迟加载的集合会抛出异常
    user.getOrders().size(); // LazyInitializationException!
    return user;
}

// 解决方案 1：在 Session 内初始化
public User solution1(SessionFactory sessionFactory, Long id) {
    try (Session session = sessionFactory.openSession()) {
        User user = session.find(User.class, id);
        Hibernate.initialize(user.getOrders()); // 在 Session 关闭前初始化
        return user;
    }
}

// 解决方案 2：使用 JOIN FETCH
public User solution2(Session session, Long id) {
    String hql = "SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id";
    return session.createQuery(hql, User.class)
                  .setParameter("id", id)
                  .uniqueResult();
}

// 解决方案 3：使用 DTO
public UserDTO solution3(Session session, Long id) {
    String hql = "SELECT new com.example.UserDTO(u.id, u.name, u.email) " +
                 "FROM User u WHERE u.id = :id";
    return session.createQuery(hql, UserDTO.class)
                  .setParameter("id", id)
                  .uniqueResult();
}
```

### 双向关联不同步

```java
// 问题代码
public void bidirectionalProblem() {
    Department dept = new Department();
    dept.setName("IT");

    Employee emp = new Employee();
    emp.setName("张三");
    emp.setDepartment(dept); // 只设置了一方

    // dept.getEmployees() 不包含 emp！
}

// 正确做法：使用便捷方法维护双向关系
@Entity
public class Department {

    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    private List<Employee> employees = new ArrayList<>();

    public void addEmployee(Employee employee) {
        employees.add(employee);
        employee.setDepartment(this); // 同时设置另一方
    }
}
```

### 误用 merge 和 persist

```java
public class MergeVsPersist {

    // persist - 用于新实体
    public void persistExample(Session session) {
        User user = new User();
        user.setName("新用户");
        session.persist(user); // user 变为持久态
        // user 的 ID 被设置
    }

    // merge - 用于游离态实体
    public void mergeExample(Session session) {
        User detachedUser = getDetachedUser(); // 游离态对象
        detachedUser.setName("更新的名字");

        // merge 返回的是新的持久态对象
        User managedUser = session.merge(detachedUser);

        // 注意：detachedUser 仍然是游离态！
        // managedUser 才是持久态
    }

    // 常见错误
    public void commonMistake(Session session) {
        User user = new User();
        user.setId(100L); // 设置了 ID

        // 错误：persist 会失败，因为有 ID 的实体被认为是游离态
        // session.persist(user); // 可能抛出异常

        // 应该使用 merge
        session.merge(user);
    }
}
```

### 在实体中使用 Lombok

```java
// 问题：Lombok 的 @Data 会生成不合适的 equals/hashCode
@Data // 不推荐用于实体
@Entity
public class BadEntity {
    @Id
    private Long id;
    // Lombok 生成的 equals/hashCode 包含所有字段，可能导致问题
}

// 正确做法
@Entity
@Getter
@Setter
@NoArgsConstructor
public class GoodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // 手动实现 equals 和 hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GoodEntity that = (GoodEntity) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

## 性能考量

### 连接池配置

```properties
# HikariCP 配置（推荐）
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000
spring.datasource.hikari.connection-timeout=20000
```

### 批量操作配置

```properties
# Hibernate 批量配置
hibernate.jdbc.batch_size=50
hibernate.order_inserts=true
hibernate.order_updates=true
hibernate.batch_versioned_data=true
```

### 查询优化

```java
public class QueryOptimization {

    // 使用投影减少数据传输
    public List<UserDTO> getOptimizedUsers(Session session) {
        String hql = "SELECT new com.example.UserDTO(u.id, u.name) FROM User u";
        return session.createQuery(hql, UserDTO.class).getResultList();
    }

    // 使用只读事务
    @Transactional(readOnly = true)
    public List<User> getUsers() {
        // 只读事务跳过脏检查，提高性能
        return session.createQuery("FROM User", User.class).getResultList();
    }

    // 使用 StatelessSession 进行只读大批量查询
    public void processLargeDataset(SessionFactory sessionFactory) {
        try (StatelessSession session = sessionFactory.openStatelessSession()) {
            ScrollableResults<User> results = session
                .createQuery("FROM User", User.class)
                .setFetchSize(1000)
                .scroll(ScrollMode.FORWARD_ONLY);

            while (results.next()) {
                User user = results.get();
                // 处理用户，不会放入一级缓存
            }
        }
    }
}
```

### 缓存策略选择

```java
// 读多写少 - 使用 READ_ONLY
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
public class Country {
    // 国家数据很少变化
}

// 读多写少 - 使用 NONSTRICT_READ_WRITE
@Entity
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class Product {
    // 产品数据偶尔更新，可接受短暂不一致
}

// 读写均衡 - 使用 READ_WRITE
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class User {
    // 用户数据经常读写
}

// 高并发写 - 使用 TRANSACTIONAL
@Entity
@Cache(usage = CacheConcurrencyStrategy.TRANSACTIONAL)
public class Order {
    // 订单数据需要严格事务控制
}
```

### 统计和监控

```java
public class HibernateStatistics {

    public void enableAndPrintStatistics(SessionFactory sessionFactory) {
        // 启用统计
        sessionFactory.getStatistics().setStatisticsEnabled(true);

        Statistics stats = sessionFactory.getStatistics();

        System.out.println("=== Hibernate 统计信息 ===");
        System.out.println("Session 打开次数: " + stats.getSessionOpenCount());
        System.out.println("Session 关闭次数: " + stats.getSessionCloseCount());
        System.out.println("事务数量: " + stats.getTransactionCount());
        System.out.println("成功事务数: " + stats.getSuccessfulTransactionCount());

        System.out.println("\n=== 查询统计 ===");
        System.out.println("查询执行次数: " + stats.getQueryExecutionCount());
        System.out.println("最慢查询: " + stats.getQueryExecutionMaxTime() + "ms");
        System.out.println("最慢查询语句: " + stats.getQueryExecutionMaxTimeQueryString());

        System.out.println("\n=== 缓存统计 ===");
        System.out.println("二级缓存命中: " + stats.getSecondLevelCacheHitCount());
        System.out.println("二级缓存未命中: " + stats.getSecondLevelCacheMissCount());
        System.out.println("二级缓存放入: " + stats.getSecondLevelCachePutCount());

        System.out.println("\n=== 实体统计 ===");
        System.out.println("实体加载: " + stats.getEntityLoadCount());
        System.out.println("实体插入: " + stats.getEntityInsertCount());
        System.out.println("实体更新: " + stats.getEntityUpdateCount());
        System.out.println("实体删除: " + stats.getEntityDeleteCount());
    }
}
```

## 实战场景

### 场景一：电商订单系统

```java
// 实体定义
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true, nullable = false)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Version
    private Long version;

    // 业务方法
    public void addItem(Product product, int quantity) {
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setUnitPrice(product.getPrice());
        item.setOrder(this);
        items.add(item);
        recalculateTotal();
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
        recalculateTotal();
    }

    private void recalculateTotal() {
        this.totalAmount = items.stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @PrePersist
    protected void onCreate() {
        this.orderNumber = generateOrderNumber();
        this.createdAt = LocalDateTime.now();
    }

    private String generateOrderNumber() {
        return "ORD" + System.currentTimeMillis();
    }
}

// Repository 实现
@Repository
public class OrderRepository {

    @PersistenceContext
    private EntityManager em;

    public Order findByIdWithItems(Long id) {
        String jpql = """
            SELECT o FROM Order o
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.product
            LEFT JOIN FETCH o.user
            WHERE o.id = :id
            """;

        return em.createQuery(jpql, Order.class)
                 .setParameter("id", id)
                 .getSingleResult();
    }

    public Page<Order> findByUserWithPagination(Long userId, int page, int size) {
        String countJpql = "SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId";
        Long total = em.createQuery(countJpql, Long.class)
                       .setParameter("userId", userId)
                       .getSingleResult();

        String jpql = """
            SELECT o FROM Order o
            WHERE o.user.id = :userId
            ORDER BY o.createdAt DESC
            """;

        List<Order> orders = em.createQuery(jpql, Order.class)
                               .setParameter("userId", userId)
                               .setFirstResult(page * size)
                               .setMaxResults(size)
                               .getResultList();

        return new PageImpl<>(orders, PageRequest.of(page, size), total);
    }

    public List<OrderStatistics> getOrderStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        String jpql = """
            SELECT new com.example.dto.OrderStatistics(
                o.status,
                COUNT(o),
                SUM(o.totalAmount),
                AVG(o.totalAmount)
            )
            FROM Order o
            WHERE o.createdAt BETWEEN :startDate AND :endDate
            GROUP BY o.status
            """;

        return em.createQuery(jpql, OrderStatistics.class)
                 .setParameter("startDate", startDate)
                 .setParameter("endDate", endDate)
                 .getResultList();
    }
}
```

### 场景二：内容管理系统

```java
// 文章实体（使用继承）
@Entity
@Table(name = "contents")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "content_type")
public abstract class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @ManyToMany
    @JoinTable(
        name = "content_tags",
        joinColumns = @JoinColumn(name = "content_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @Enumerated(EnumType.STRING)
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}

@Entity
@DiscriminatorValue("ARTICLE")
public class Article extends Content {

    @Lob
    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "reading_time")
    private Integer readingTime;
}

@Entity
@DiscriminatorValue("VIDEO")
public class Video extends Content {

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;
}

// 全文搜索
@Repository
public class ContentRepository {

    @PersistenceContext
    private EntityManager em;

    // 使用原生 SQL 实现全文搜索（MySQL）
    public List<Article> fullTextSearch(String searchTerm) {
        String sql = """
            SELECT * FROM contents
            WHERE content_type = 'ARTICLE'
            AND MATCH(title, body) AGAINST(:term IN NATURAL LANGUAGE MODE)
            ORDER BY MATCH(title, body) AGAINST(:term IN NATURAL LANGUAGE MODE) DESC
            """;

        return em.createNativeQuery(sql, Article.class)
                 .setParameter("term", searchTerm)
                 .getResultList();
    }

    // 按标签查询
    public List<Content> findByTags(Set<String> tagNames) {
        String jpql = """
            SELECT DISTINCT c FROM Content c
            JOIN c.tags t
            WHERE t.name IN :tagNames
            AND c.status = :status
            ORDER BY c.publishedAt DESC
            """;

        return em.createQuery(jpql, Content.class)
                 .setParameter("tagNames", tagNames)
                 .setParameter("status", ContentStatus.PUBLISHED)
                 .getResultList();
    }
}
```

### 场景三：审计日志

```java
// 使用 Hibernate Envers 实现审计
@Entity
@Table(name = "products")
@Audited // 启用审计
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @NotAudited // 不审计此字段
    private String internalNotes;
}

// 查询历史版本
@Repository
public class AuditRepository {

    @PersistenceContext
    private EntityManager em;

    public List<Product> getProductHistory(Long productId) {
        AuditReader auditReader = AuditReaderFactory.get(em);

        // 获取所有修订版本号
        List<Number> revisions = auditReader.getRevisions(Product.class, productId);

        // 获取每个版本的实体
        List<Product> history = new ArrayList<>();
        for (Number revision : revisions) {
            Product product = auditReader.find(Product.class, productId, revision);
            history.add(product);
        }

        return history;
    }

    public Product getProductAtRevision(Long productId, int revision) {
        AuditReader auditReader = AuditReaderFactory.get(em);
        return auditReader.find(Product.class, productId, revision);
    }

    public Product getProductAtDate(Long productId, Date date) {
        AuditReader auditReader = AuditReaderFactory.get(em);
        Number revision = auditReader.getRevisionNumberForDate(date);
        return auditReader.find(Product.class, productId, revision);
    }
}
```

## 面试要点

### Hibernate 与 MyBatis 的区别？

| 特性 | Hibernate | MyBatis |
|------|-----------|---------|
| 类型 | 全自动 ORM | 半自动 ORM |
| SQL 控制 | 自动生成 | 手写 SQL |
| 学习曲线 | 陡峭 | 平缓 |
| 性能优化 | 复杂 | 直接 |
| 缓存 | 一级+二级缓存 | 一级+二级缓存 |
| 适用场景 | 领域模型复杂 | SQL 复杂 |

### Hibernate 的一级缓存和二级缓存？

- **一级缓存**：Session 级别，默认开启，生命周期与 Session 相同
- **二级缓存**：SessionFactory 级别，需要手动配置，可跨 Session 共享

### get() 和 load() 的区别？

```java
// get() - 立即加载，不存在返回 null
User user = session.get(User.class, 1L);

// load() - 延迟加载，返回代理对象，不存在抛出异常
User user = session.load(User.class, 1L);
```

### 如何解决 N+1 查询问题？

1. 使用 JOIN FETCH
2. 使用 @BatchSize 注解
3. 使用 EntityGraph
4. 使用子查询（@Fetch(FetchMode.SUBSELECT)）

### Hibernate 的乐观锁和悲观锁？

```java
// 乐观锁：使用 @Version
@Version
private Long version;

// 悲观锁：使用 LockMode
session.find(User.class, id, LockModeType.PESSIMISTIC_WRITE);
```

### 什么是脏检查（Dirty Checking）？

Hibernate 自动检测持久态对象的属性变化，在 flush 时自动生成并执行 UPDATE 语句。

### Hibernate 中 persist、save、merge、update 的区别？

| 方法 | 说明 |
|------|------|
| persist | JPA 标准，持久化瞬时态对象 |
| save | Hibernate 原生，返回 ID |
| merge | 合并游离态对象，返回新的持久态对象 |
| update | 重新附加游离态对象到 Session |

### 如何优化 Hibernate 性能？

1. 合理使用延迟加载和急加载
2. 使用二级缓存和查询缓存
3. 批量操作使用 batch_size
4. 只读查询使用 @Transactional(readOnly=true)
5. 复杂查询考虑使用原生 SQL
6. 合理使用投影查询

## 延伸阅读

### 官方文档

- [Hibernate ORM 官方文档](https://hibernate.org/orm/documentation/)
- [Jakarta Persistence (JPA) 规范](https://jakarta.ee/specifications/persistence/)
- [Hibernate Validator](https://hibernate.org/validator/)

### 推荐书籍

- 《Java Persistence with Hibernate》- Christian Bauer
- 《High-Performance Java Persistence》- Vlad Mihalcea
- 《Pro JPA 2 in Java EE 8》- Mike Keith

### 在线资源

- [Vlad Mihalcea 博客](https://vladmihalcea.com/) - Hibernate 性能优化权威
- [Baeldung Hibernate 教程](https://www.baeldung.com/hibernate-tutorial)
- [Thorben Janssen 博客](https://thorben-janssen.com/) - JPA 和 Hibernate 最佳实践

### 进阶主题

- Hibernate Search（全文搜索）
- Hibernate Reactive（响应式编程）
- Hibernate Envers（数据审计）
- Hibernate Spatial（地理空间数据）

---

Hibernate 作为 Java 生态系统中最成熟的 ORM 框架，提供了强大的对象关系映射能力。深入理解其核心原理、掌握最佳实践，对于构建高性能的数据访问层至关重要。建议结合实际项目多加练习，特别注意性能优化和常见陷阱的规避。
