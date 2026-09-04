---
title: Hibernate ORM In-Depth Guide
description: Master the core concepts, entity mapping, query languages, and performance optimization of the Hibernate ORM framework
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Hibernate
  - ORM
  - JPA
  - Database
status: imported
origin: old/src/content/docs/java/hibernate.en.md
divergence: 0.208
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-07
---

Hibernate is the most popular Object-Relational Mapping (ORM) framework in the Java ecosystem. It implements the JPA (Java Persistence API) specification and provides powerful data persistence capabilities. This comprehensive guide covers Hibernate's core concepts, entity mapping, query mechanisms, and performance optimization techniques.

## Concept Explanation

### What is ORM?

ORM (Object-Relational Mapping) is a programming technique that establishes a mapping relationship between object-oriented programming languages and relational databases. It solves the "impedance mismatch" problem between object-oriented and relational models.

**Problems with traditional JDBC development:**

```java
// Traditional JDBC approach - verbose and error-prone
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

**Using Hibernate approach:**

```java
// Hibernate approach - concise and elegant
public User findUserById(Long id) {
    return session.find(User.class, id);
}
```

### History and Evolution of Hibernate

- **2001**: Gavin King created Hibernate to solve the complexity of EJB 2.x Entity Bean
- **2006**: JPA 1.0 released, Hibernate became the JPA reference implementation
- **2010**: Hibernate 3.5 fully compatible with JPA 2.0
- **2017**: Hibernate 5.2 supports JPA 2.1
- **2022**: Hibernate 6.0 released, supporting Jakarta EE 9+ and JPA 3.0

### Relationship Between Hibernate and JPA

```
┌─────────────────────────────────────────────────────┐
│                   Application Code                   │
├─────────────────────────────────────────────────────┤
│                  JPA API (Specification)             │
│          (EntityManager, JPQL, Criteria)             │
├─────────────────────────────────────────────────────┤
│              Hibernate (JPA Implementation)          │
│    (SessionFactory, Session, HQL, Criteria)          │
├─────────────────────────────────────────────────────┤
│                    JDBC                              │
├─────────────────────────────────────────────────────┤
│                 Relational Database                  │
└─────────────────────────────────────────────────────┘
```

- **JPA** is a specification (interface) defining standard persistence APIs
- **Hibernate** is the JPA implementation, providing additional features
- Recommended: Use JPA APIs by default, use Hibernate native APIs for advanced features

## Core Architecture

### Architecture Overview

Hibernate's core architecture contains the following key components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SessionFactory                          │   │
│  │  - Thread-safe heavyweight object                         │   │
│  │  - Only one instance needed per application lifetime      │   │
│  │  - Responsible for creating Session instances            │   │
│  │  - Caches compiled SQL statements and mapping metadata    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Session                              │   │
│  │  - Non-thread-safe lightweight object                     │   │
│  │  - Represents a single session with the database          │   │
│  │  - First-level cache (persistence context)                │   │
│  │  - Responsible for CRUD operations                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Transaction                             │   │
│  │  - Manages database transactions                          │   │
│  │  - Ensures data consistency                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      JDBC                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Entity Lifecycle

Entities in Hibernate have four distinct states:

```
┌─────────────┐    new     ┌─────────────┐
│  Transient  │ ─────────► │  Persistent │
│  (Transient)│            │ (Persistent)│
└─────────────┘            └─────────────┘
      ▲                          │ │
      │                          │ │
      │ new                      │ │ evict/clear/close
      │                          │ │
      │                          ▼ ▼
┌─────────────┐   delete   ┌─────────────┐
│   Removed   │ ◄───────── │  Detached   │
│  (Removed)  │            │ (Detached)  │
└─────────────┘            └─────────────┘
                                 │
                           merge/update
                                 │
                                 ▼
                          ┌─────────────┐
                          │  Persistent │
                          └─────────────┘
```

**Four states explained:**

1. **Transient**: Object just created, not associated with any Session, no database identity
2. **Persistent**: Object associated with a Session, has database identity, any changes automatically sync to database
3. **Detached**: Object was persistent, but Session is closed
4. **Removed**: Object marked for deletion, will be deleted from database when transaction commits

```java
// Entity lifecycle transition example
public class EntityLifecycleDemo {

    public void demonstrateLifecycle(SessionFactory sessionFactory) {
        // 1. Transient state - newly created object
        User user = new User();
        user.setName("John Doe");
        user.setEmail("john@example.com");
        // user is in Transient state here

        Session session = sessionFactory.openSession();
        Transaction tx = session.beginTransaction();

        // 2. Persistent state - after persist/save
        session.persist(user);
        // user is now in Persistent state with ID assigned
        System.out.println("User ID: " + user.getId());

        // Changes to persistent objects automatically sync (dirty checking)
        user.setName("Jane Doe");
        // No need to call update, Hibernate automatically detects changes

        tx.commit();
        session.close();
        // 3. Detached state - after Session closes
        // user is now in Detached state

        // Reattach to new Session
        Session newSession = sessionFactory.openSession();
        Transaction newTx = newSession.beginTransaction();

        // 4. Back to Persistent state
        User mergedUser = newSession.merge(user);
        // mergedUser is in Persistent state

        // 5. Removed state
        newSession.remove(mergedUser);
        // mergedUser is now in Removed state

        newTx.commit();
        newSession.close();
    }
}
```

### Persistence Context and Dirty Checking

Persistence Context is one of Hibernate's core concepts, also called first-level cache:

```java
public class PersistenceContextDemo {

    public void demonstratePersistenceContext(Session session) {
        Transaction tx = session.beginTransaction();

        // First query - sends SQL to database
        User user1 = session.find(User.class, 1L);

        // Second query same entity - retrieved from first-level cache, no SQL
        User user2 = session.find(User.class, 1L);

        // user1 and user2 are same object
        System.out.println(user1 == user2); // true

        // Dirty checking example
        user1.setName("New Name");
        // Hibernate automatically detects change and generates UPDATE on flush

        tx.commit(); // Auto flush executes UPDATE
    }

    // Manual flush control
    public void manualFlush(Session session) {
        Transaction tx = session.beginTransaction();

        User user = session.find(User.class, 1L);
        user.setName("Temporary Name");

        // Manual flush executes SQL immediately
        session.flush();

        // Database is updated now, but transaction not committed
        user.setName("Final Name");

        tx.commit(); // Flush again and commit
    }
}
```

## Core Topics

### SessionFactory Configuration

SessionFactory is the factory for creating Session instances. An application should have only one instance:

```java
// Configuration via hibernate.cfg.xml
public class HibernateUtil {
    private static final SessionFactory sessionFactory;

    static {
        try {
            // Load configuration from hibernate.cfg.xml
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

**hibernate.cfg.xml configuration file:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-configuration PUBLIC
    "-//Hibernate/Hibernate Configuration DTD 3.0//EN"
    "http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
    <session-factory>
        <!-- Database connection configuration -->
        <property name="hibernate.connection.driver_class">com.mysql.cj.jdbc.Driver</property>
        <property name="hibernate.connection.url">jdbc:mysql://localhost:3306/mydb?useSSL=false&amp;serverTimezone=UTC</property>
        <property name="hibernate.connection.username">root</property>
        <property name="hibernate.connection.password">password</property>

        <!-- Connection pool configuration -->
        <property name="hibernate.c3p0.min_size">5</property>
        <property name="hibernate.c3p0.max_size">20</property>
        <property name="hibernate.c3p0.timeout">300</property>
        <property name="hibernate.c3p0.max_statements">50</property>

        <!-- Hibernate configuration -->
        <property name="hibernate.dialect">org.hibernate.dialect.MySQLDialect</property>
        <property name="hibernate.show_sql">true</property>
        <property name="hibernate.format_sql">true</property>
        <property name="hibernate.hbm2ddl.auto">update</property>

        <!-- Second-level cache configuration -->
        <property name="hibernate.cache.use_second_level_cache">true</property>
        <property name="hibernate.cache.region.factory_class">
            org.hibernate.cache.jcache.JCacheRegionFactory
        </property>

        <!-- Entity mapping -->
        <mapping class="com.example.entity.User"/>
        <mapping class="com.example.entity.Order"/>
    </session-factory>
</hibernate-configuration>
```

**Programmatic configuration approach:**

```java
public class ProgrammaticConfiguration {

    public static SessionFactory buildSessionFactory() {
        Configuration configuration = new Configuration();

        // Database connection configuration
        configuration.setProperty("hibernate.connection.driver_class", "com.mysql.cj.jdbc.Driver");
        configuration.setProperty("hibernate.connection.url", "jdbc:mysql://localhost:3306/mydb");
        configuration.setProperty("hibernate.connection.username", "root");
        configuration.setProperty("hibernate.connection.password", "password");

        // Hibernate configuration
        configuration.setProperty("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        configuration.setProperty("hibernate.show_sql", "true");
        configuration.setProperty("hibernate.format_sql", "true");
        configuration.setProperty("hibernate.hbm2ddl.auto", "update");

        // Add entity classes
        configuration.addAnnotatedClass(User.class);
        configuration.addAnnotatedClass(Order.class);

        return configuration.buildSessionFactory();
    }
}
```

### Session Operations

Session is the primary interface for database interaction:

```java
public class SessionOperations {
    private SessionFactory sessionFactory;

    // Save entity
    public Long saveUser(User user) {
        Session session = sessionFactory.openSession();
        Transaction tx = null;
        try {
            tx = session.beginTransaction();

            // persist() - JPA standard method
            session.persist(user);

            // Or use save() - Hibernate native method, returns ID
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

    // Query entity
    public User findUser(Long id) {
        try (Session session = sessionFactory.openSession()) {
            // find() - returns null if not found
            return session.find(User.class, id);

            // Or use get() - Hibernate native method
            // return session.get(User.class, id);

            // getReference() - returns proxy, lazy loading
            // return session.getReference(User.class, id);
        }
    }

    // Update entity
    public void updateUser(User user) {
        try (Session session = sessionFactory.openSession()) {
            Transaction tx = session.beginTransaction();

            // merge() - merge detached object
            session.merge(user);

            tx.commit();
        }
    }

    // Delete entity
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

### Entity Mapping

#### Basic Entity Mapping

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
    private Long version; // Optimistic lock version

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

#### ID Generation Strategies

```java
// 1. IDENTITY - Database auto-increment (MySQL, PostgreSQL)
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

// 2. SEQUENCE - Sequence (Oracle, PostgreSQL)
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
@SequenceGenerator(name = "user_seq", sequenceName = "user_sequence", allocationSize = 50)
private Long id;

// 3. TABLE - Table simulating sequence
@Id
@GeneratedValue(strategy = GenerationType.TABLE, generator = "user_gen")
@TableGenerator(name = "user_gen", table = "id_generator",
                pkColumnName = "gen_name", valueColumnName = "gen_value",
                pkColumnValue = "user_id", allocationSize = 50)
private Long id;

// 4. UUID - Universally unique identifier
@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;

// 5. AUTO - Let Hibernate choose the strategy
@Id
@GeneratedValue(strategy = GenerationType.AUTO)
private Long id;
```

#### Association Mapping

**One-to-Many / Many-to-One Relationship:**

```java
@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // One-to-Many: one department has multiple employees
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Employee> employees = new ArrayList<>();

    // Convenience method: maintain bidirectional relationship
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

    // Many-to-One: multiple employees belong to one department
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
}
```

**Many-to-Many Relationship:**

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

**One-to-One Relationship:**

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    // One-to-One: shared primary key
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
    @MapsId // Shared primary key
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 500)
    private String bio;

    private String avatarUrl;
}
```

#### Embedded Types

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

#### Inheritance Mapping

```java
// Strategy 1: Single Table Inheritance - all subclasses in one table
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

// Strategy 2: Joined Table Inheritance - each class has its own table
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

// Strategy 3: Table Per Class
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

## Code Examples

### HQL (Hibernate Query Language)

HQL is an object-oriented query language similar to SQL but operates on entities rather than tables:

```java
public class HQLExamples {
    private Session session;

    // Basic query
    public List<User> findAllUsers() {
        String hql = "FROM User";
        return session.createQuery(hql, User.class).getResultList();
    }

    // Conditional query
    public List<User> findUsersByStatus(UserStatus status) {
        String hql = "FROM User u WHERE u.status = :status";
        return session.createQuery(hql, User.class)
                      .setParameter("status", status)
                      .getResultList();
    }

    // Wildcard search
    public List<User> searchUsersByName(String keyword) {
        String hql = "FROM User u WHERE u.name LIKE :keyword";
        return session.createQuery(hql, User.class)
                      .setParameter("keyword", "%" + keyword + "%")
                      .getResultList();
    }

    // Ordering and pagination
    public List<User> findUsersWithPagination(int page, int size) {
        String hql = "FROM User u ORDER BY u.createdAt DESC";
        return session.createQuery(hql, User.class)
                      .setFirstResult(page * size)
                      .setMaxResults(size)
                      .getResultList();
    }

    // Projection query (select specific fields)
    public List<Object[]> findUserNameAndEmail() {
        String hql = "SELECT u.name, u.email FROM User u";
        return session.createQuery(hql, Object[].class).getResultList();
    }

    // DTO projection
    public List<UserDTO> findUserDTOs() {
        String hql = "SELECT new com.example.dto.UserDTO(u.id, u.name, u.email) FROM User u";
        return session.createQuery(hql, UserDTO.class).getResultList();
    }

    // Association query
    public List<Order> findOrdersWithUser() {
        String hql = "SELECT o FROM Order o JOIN FETCH o.user WHERE o.status = :status";
        return session.createQuery(hql, Order.class)
                      .setParameter("status", OrderStatus.PENDING)
                      .getResultList();
    }

    // Aggregation query
    public Long countActiveUsers() {
        String hql = "SELECT COUNT(u) FROM User u WHERE u.status = :status";
        return session.createQuery(hql, Long.class)
                      .setParameter("status", UserStatus.ACTIVE)
                      .getSingleResult();
    }

    // Group query
    public List<Object[]> countUsersByStatus() {
        String hql = "SELECT u.status, COUNT(u) FROM User u GROUP BY u.status";
        return session.createQuery(hql, Object[].class).getResultList();
    }

    // Subquery
    public List<User> findUsersWithOrders() {
        String hql = "FROM User u WHERE u.id IN " +
                     "(SELECT DISTINCT o.user.id FROM Order o WHERE o.totalAmount > :amount)";
        return session.createQuery(hql, User.class)
                      .setParameter("amount", new BigDecimal("1000"))
                      .getResultList();
    }

    // Update query
    public int updateUserStatus(UserStatus oldStatus, UserStatus newStatus) {
        String hql = "UPDATE User u SET u.status = :newStatus WHERE u.status = :oldStatus";
        return session.createQuery(hql)
                      .setParameter("newStatus", newStatus)
                      .setParameter("oldStatus", oldStatus)
                      .executeUpdate();
    }

    // Delete query
    public int deleteInactiveUsers() {
        String hql = "DELETE FROM User u WHERE u.status = :status";
        return session.createQuery(hql)
                      .setParameter("status", UserStatus.INACTIVE)
                      .executeUpdate();
    }
}
```

### Criteria API

Criteria API provides type-safe, object-oriented querying:

```java
public class CriteriaExamples {
    private Session session;

    // Basic query
    public List<User> findAllUsers() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);
        cq.select(root);

        return session.createQuery(cq).getResultList();
    }

    // Conditional query
    public List<User> findActiveUsers() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        cq.select(root)
          .where(cb.equal(root.get("status"), UserStatus.ACTIVE));

        return session.createQuery(cq).getResultList();
    }

    // Multiple conditions
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

    // Pagination
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

    // Count query
    public Long countUsers() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<User> root = cq.from(User.class);

        cq.select(cb.count(root));

        return session.createQuery(cq).getSingleResult();
    }

    // Association query
    public List<Order> findOrdersWithUser() {
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Order> cq = cb.createQuery(Order.class);
        Root<Order> root = cq.from(Order.class);

        // Fetch join avoids N+1 issue
        root.fetch("user", JoinType.LEFT);

        cq.select(root)
          .where(cb.equal(root.get("status"), OrderStatus.PENDING));

        return session.createQuery(cq).getResultList();
    }

    // Aggregation query
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

### Named Queries

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
    // ... entity fields
}

// Using named queries
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

### Native SQL Queries

```java
public class NativeQueryExamples {
    private Session session;

    // Basic native query
    public List<User> findUsersNative() {
        String sql = "SELECT * FROM users WHERE status = :status";
        return session.createNativeQuery(sql, User.class)
                      .setParameter("status", "ACTIVE")
                      .getResultList();
    }

    // Complex native query
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

    // Using result set mapping
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

### Cache Configuration and Usage

#### First-Level Cache (Session Level)

```java
public class FirstLevelCacheDemo {

    public void demonstrateFirstLevelCache(SessionFactory sessionFactory) {
        try (Session session = sessionFactory.openSession()) {
            // First query - sends SQL to database
            User user1 = session.find(User.class, 1L);
            System.out.println("First query: " + user1.getName());

            // Second query - retrieved from first-level cache, no SQL
            User user2 = session.find(User.class, 1L);
            System.out.println("Second query: " + user2.getName());

            // Verify same object
            System.out.println("Same object: " + (user1 == user2)); // true

            // Clear first-level cache
            session.clear();

            // Third query - cache cleared, SQL sent again
            User user3 = session.find(User.class, 1L);
            System.out.println("Third query: " + user3.getName());
        }
    }
}
```

#### Second-Level Cache (SessionFactory Level)

```java
// Entity class with second-level cache
@Entity
@Table(name = "users")
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class User {
    // ... entity fields
}

// Second-level cache configuration in hibernate.cfg.xml
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
        // First Session
        try (Session session1 = sessionFactory.openSession()) {
            User user1 = session1.find(User.class, 1L);
            System.out.println("Session1 query: " + user1.getName());
        }

        // Second Session - retrieved from second-level cache
        try (Session session2 = sessionFactory.openSession()) {
            User user2 = session2.find(User.class, 1L);
            System.out.println("Session2 query: " + user2.getName());
        }

        // Query cache statistics
        Statistics statistics = sessionFactory.getStatistics();
        System.out.println("Cache hits: " + statistics.getSecondLevelCacheHitCount());
        System.out.println("Cache misses: " + statistics.getSecondLevelCacheMissCount());
    }
}
```

#### Query Cache

```java
public class QueryCacheDemo {
    private Session session;

    public List<User> findActiveUsersWithQueryCache() {
        String hql = "FROM User u WHERE u.status = :status";

        return session.createQuery(hql, User.class)
                      .setParameter("status", UserStatus.ACTIVE)
                      .setCacheable(true) // Enable query cache
                      .setCacheRegion("activeUsers") // Specify cache region
                      .getResultList();
    }
}
```

### Lazy Loading and Eager Loading

```java
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lazy loading (default) - loaded on access
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Eager loading - loaded immediately
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;

    // Lazy loading collection
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();
}

public class LazyLoadingDemo {

    // Resolve LazyInitializationException
    public Order getOrderWithItems(Session session, Long orderId) {
        // Method 1: Use JOIN FETCH
        String hql = "SELECT o FROM Order o " +
                     "JOIN FETCH o.user " +
                     "JOIN FETCH o.items " +
                     "WHERE o.id = :id";

        return session.createQuery(hql, Order.class)
                      .setParameter("id", orderId)
                      .uniqueResult();
    }

    // Method 2: Use Hibernate.initialize()
    public Order getOrderWithItemsV2(Session session, Long orderId) {
        Order order = session.find(Order.class, orderId);
        Hibernate.initialize(order.getItems()); // Force initialization
        return order;
    }

    // Method 3: Use EntityGraph
    public Order getOrderWithEntityGraph(Session session, Long orderId) {
        EntityGraph<Order> graph = session.createEntityGraph(Order.class);
        graph.addAttributeNodes("user", "items");

        Map<String, Object> hints = new HashMap<>();
        hints.put("jakarta.persistence.fetchgraph", graph);

        return session.find(Order.class, orderId, hints);
    }
}
```

## Best Practices

### Entity Design Best Practices

```java
@Entity
@Table(name = "products")
public class Product {

    // Use wrapper types instead of primitives
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Not long

    @Column(nullable = false)
    private String name;

    // Use BigDecimal for monetary amounts
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    // Implement equals and hashCode correctly
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        // Use business key or ID (if persistent)
        return id != null && Objects.equals(id, product.id);
    }

    @Override
    public int hashCode() {
        // Use fixed value or business key
        return getClass().hashCode();
    }

    // Provide meaningful toString
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

### Association Best Practices

```java
@Entity
@Table(name = "parents")
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Use Set instead of List for better performance
    @OneToMany(mappedBy = "parent",
               cascade = CascadeType.ALL,
               orphanRemoval = true)
    private Set<Child> children = new HashSet<>();

    // Provide convenience methods to sync bidirectional relationships
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

    // Association side always uses LAZY loading
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

### Transaction Management Best Practices

```java
@Service
public class UserService {

    private final SessionFactory sessionFactory;

    // Recommended: Use declarative transactions (Spring)
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

    // Manual transaction management template
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

### Batch Operations Best Practices

```java
public class BatchOperations {

    private static final int BATCH_SIZE = 50;

    // Batch insert
    public void batchInsert(Session session, List<User> users) {
        Transaction tx = session.beginTransaction();

        for (int i = 0; i < users.size(); i++) {
            session.persist(users.get(i));

            if (i > 0 && i % BATCH_SIZE == 0) {
                // Flush and clear first-level cache
                session.flush();
                session.clear();
            }
        }

        tx.commit();
    }

    // Use StatelessSession for large batch operations
    public void batchInsertStateless(SessionFactory sessionFactory, List<User> users) {
        try (StatelessSession session = sessionFactory.openStatelessSession()) {
            Transaction tx = session.beginTransaction();

            for (User user : users) {
                session.insert(user);
            }

            tx.commit();
        }
    }

    // Batch update
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

## Common Pitfalls

### N+1 Query Problem

```java
// Problematic code: N+1 query issue
public void n1Problem(Session session) {
    List<Order> orders = session.createQuery("FROM Order", Order.class).getResultList();

    for (Order order : orders) {
        // Each access to user triggers a query!
        System.out.println(order.getUser().getName());
    }
}

// Solution 1: JOIN FETCH
public void solution1(Session session) {
    String hql = "SELECT o FROM Order o JOIN FETCH o.user";
    List<Order> orders = session.createQuery(hql, Order.class).getResultList();

    for (Order order : orders) {
        System.out.println(order.getUser().getName()); // No extra query
    }
}

// Solution 2: EntityGraph
public void solution2(Session session) {
    EntityGraph<Order> graph = session.createEntityGraph(Order.class);
    graph.addAttributeNodes("user");

    List<Order> orders = session.createQuery("FROM Order", Order.class)
                                .setHint("jakarta.persistence.fetchgraph", graph)
                                .getResultList();
}

// Solution 3: Batch fetching
@Entity
@BatchSize(size = 25) // Batch load 25 items
public class User {
    // ...
}
```

### LazyInitializationException

```java
// Problematic code
public User getUserOutsideSession(SessionFactory sessionFactory, Long id) {
    User user;
    try (Session session = sessionFactory.openSession()) {
        user = session.find(User.class, id);
    }
    // Session closed, accessing lazy collection throws exception
    user.getOrders().size(); // LazyInitializationException!
    return user;
}

// Solution 1: Initialize in Session
public User solution1(SessionFactory sessionFactory, Long id) {
    try (Session session = sessionFactory.openSession()) {
        User user = session.find(User.class, id);
        Hibernate.initialize(user.getOrders()); // Initialize before closing
        return user;
    }
}

// Solution 2: Use JOIN FETCH
public User solution2(Session session, Long id) {
    String hql = "SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id";
    return session.createQuery(hql, User.class)
                  .setParameter("id", id)
                  .uniqueResult();
}

// Solution 3: Use DTO
public UserDTO solution3(Session session, Long id) {
    String hql = "SELECT new com.example.UserDTO(u.id, u.name, u.email) " +
                 "FROM User u WHERE u.id = :id";
    return session.createQuery(hql, UserDTO.class)
                  .setParameter("id", id)
                  .uniqueResult();
}
```

### Bidirectional Relationship Sync Issues

```java
// Problematic code
public void bidirectionalProblem() {
    Department dept = new Department();
    dept.setName("IT");

    Employee emp = new Employee();
    emp.setName("John Doe");
    emp.setDepartment(dept); // Only set one side

    // dept.getEmployees() doesn't contain emp!
}

// Correct approach: Use convenience methods
@Entity
public class Department {

    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    private List<Employee> employees = new ArrayList<>();

    public void addEmployee(Employee employee) {
        employees.add(employee);
        employee.setDepartment(this); // Set both sides
    }
}
```

### Misuse of merge and persist

```java
public class MergeVsPersist {

    // persist - for new entities
    public void persistExample(Session session) {
        User user = new User();
        user.setName("New User");
        session.persist(user); // user becomes persistent
        // user ID is set
    }

    // merge - for detached entities
    public void mergeExample(Session session) {
        User detachedUser = getDetachedUser(); // Detached object
        detachedUser.setName("Updated Name");

        // merge returns new persistent object
        User managedUser = session.merge(detachedUser);

        // Note: detachedUser still detached!
        // managedUser is persistent
    }

    // Common mistake
    public void commonMistake(Session session) {
        User user = new User();
        user.setId(100L); // Set ID

        // Wrong: persist fails because entity with ID is detached
        // session.persist(user); // May throw exception

        // Use merge instead
        session.merge(user);
    }
}
```

### Using Lombok with Entities

```java
// Problem: Lombok @Data generates unsuitable equals/hashCode
@Data // Not recommended for entities
@Entity
public class BadEntity {
    @Id
    private Long id;
    // Lombok-generated equals/hashCode includes all fields, may cause issues
}

// Correct approach
@Entity
@Getter
@Setter
@NoArgsConstructor
public class GoodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // Manually implement equals and hashCode
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

## Performance Considerations

### Connection Pool Configuration

```properties
# HikariCP configuration (recommended)
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000
spring.datasource.hikari.connection-timeout=20000
```

### Batch Operations Configuration

```properties
# Hibernate batch configuration
hibernate.jdbc.batch_size=50
hibernate.order_inserts=true
hibernate.order_updates=true
hibernate.batch_versioned_data=true
```

### Query Optimization

```java
public class QueryOptimization {

    // Use projection to reduce data transfer
    public List<UserDTO> getOptimizedUsers(Session session) {
        String hql = "SELECT new com.example.UserDTO(u.id, u.name) FROM User u";
        return session.createQuery(hql, UserDTO.class).getResultList();
    }

    // Use read-only transactions
    @Transactional(readOnly = true)
    public List<User> getUsers() {
        // Read-only transaction skips dirty checking, better performance
        return session.createQuery("FROM User", User.class).getResultList();
    }

    // Use StatelessSession for large read-only batch queries
    public void processLargeDataset(SessionFactory sessionFactory) {
        try (StatelessSession session = sessionFactory.openStatelessSession()) {
            ScrollableResults<User> results = session
                .createQuery("FROM User", User.class)
                .setFetchSize(1000)
                .scroll(ScrollMode.FORWARD_ONLY);

            while (results.next()) {
                User user = results.get();
                // Process user, won't be cached in first-level cache
            }
        }
    }
}
```

### Cache Strategy Selection

```java
// Read-heavy, write-light - use READ_ONLY
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
public class Country {
    // Country data changes rarely
}

// Read-heavy, occasional writes - use NONSTRICT_READ_WRITE
@Entity
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class Product {
    // Product data updated occasionally, brief inconsistency acceptable
}

// Balanced read/write - use READ_WRITE
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class User {
    // User data frequently read and written
}

// High concurrency writes - use TRANSACTIONAL
@Entity
@Cache(usage = CacheConcurrencyStrategy.TRANSACTIONAL)
public class Order {
    // Order data requires strict transaction control
}
```

### Statistics and Monitoring

```java
public class HibernateStatistics {

    public void enableAndPrintStatistics(SessionFactory sessionFactory) {
        // Enable statistics
        sessionFactory.getStatistics().setStatisticsEnabled(true);

        Statistics stats = sessionFactory.getStatistics();

        System.out.println("=== Hibernate Statistics ===");
        System.out.println("Session opens: " + stats.getSessionOpenCount());
        System.out.println("Session closes: " + stats.getSessionCloseCount());
        System.out.println("Transactions: " + stats.getTransactionCount());
        System.out.println("Successful transactions: " + stats.getSuccessfulTransactionCount());

        System.out.println("\n=== Query Statistics ===");
        System.out.println("Query executions: " + stats.getQueryExecutionCount());
        System.out.println("Slowest query: " + stats.getQueryExecutionMaxTime() + "ms");
        System.out.println("Slowest query: " + stats.getQueryExecutionMaxTimeQueryString());

        System.out.println("\n=== Cache Statistics ===");
        System.out.println("Second-level cache hits: " + stats.getSecondLevelCacheHitCount());
        System.out.println("Second-level cache misses: " + stats.getSecondLevelCacheMissCount());
        System.out.println("Second-level cache puts: " + stats.getSecondLevelCachePutCount());

        System.out.println("\n=== Entity Statistics ===");
        System.out.println("Entity loads: " + stats.getEntityLoadCount());
        System.out.println("Entity inserts: " + stats.getEntityInsertCount());
        System.out.println("Entity updates: " + stats.getEntityUpdateCount());
        System.out.println("Entity deletes: " + stats.getEntityDeleteCount());
    }
}
```

## Real-World Scenarios

### Scenario 1: E-Commerce Order System

```java
// Entity definition
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

    // Business methods
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

// Repository implementation
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

### Scenario 2: Content Management System

```java
// Article entity (using inheritance)
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

// Full-text search
@Repository
public class ContentRepository {

    @PersistenceContext
    private EntityManager em;

    // Full-text search using native SQL (MySQL)
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

    // Query by tags
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

### Scenario 3: Audit Logging

```java
// Using Hibernate Envers for audit
@Entity
@Table(name = "products")
@Audited // Enable audit
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @NotAudited // Don't audit this field
    private String internalNotes;
}

// Query history versions
@Repository
public class AuditRepository {

    @PersistenceContext
    private EntityManager em;

    public List<Product> getProductHistory(Long productId) {
        AuditReader auditReader = AuditReaderFactory.get(em);

        // Get all revision numbers
        List<Number> revisions = auditReader.getRevisions(Product.class, productId);

        // Get entity at each version
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

## Interview Questions

### What is the difference between Hibernate and MyBatis?

| Feature | Hibernate | MyBatis |
|---------|-----------|---------|
| Type | Full-automatic ORM | Semi-automatic ORM |
| SQL Control | Auto-generated | Manual SQL |
| Learning Curve | Steep | Gentle |
| Performance Tuning | Complex | Direct |
| Caching | L1 + L2 cache | L1 + L2 cache |
| Use Case | Complex domain models | Complex SQL |

### What are first-level and second-level caches?

- **First-level cache**: Session-scoped, enabled by default, lifetime tied to Session
- **Second-level cache**: SessionFactory-scoped, requires configuration, shared across Sessions

### What is the difference between get() and load()?

```java
// get() - eager loading, returns null if not found
User user = session.get(User.class, 1L);

// load() - lazy loading, returns proxy, throws exception if not found
User user = session.load(User.class, 1L);
```

### How to solve N+1 query problem?

1. Use JOIN FETCH
2. Use @BatchSize annotation
3. Use EntityGraph
4. Use subqueries with @Fetch(FetchMode.SUBSELECT)

### What are optimistic and pessimistic locks?

```java
// Optimistic lock: Use @Version
@Version
private Long version;

// Pessimistic lock: Use LockModeType
session.find(User.class, id, LockModeType.PESSIMISTIC_WRITE);
```

### What is dirty checking?

Hibernate automatically detects changes to persistent object properties and generates UPDATE statements on flush.

### What is the difference between persist, save, merge, and update?

| Method | Description |
|--------|-------------|
| persist | JPA standard, persists transient object |
| save | Hibernate native, returns ID |
| merge | Merges detached object, returns new persistent object |
| update | Reattaches detached object to Session |

### How to optimize Hibernate performance?

1. Use lazy loading and eager loading appropriately
2. Enable second-level and query caches
3. Set batch_size for bulk operations
4. Use @Transactional(readOnly=true) for read queries
5. Consider native SQL for complex queries
6. Use projection queries efficiently

## Further Reading

### Official Documentation

- [Hibernate ORM Official Documentation](https://hibernate.org/orm/documentation/)
- [Jakarta Persistence (JPA) Specification](https://jakarta.ee/specifications/persistence/)
- [Hibernate Validator](https://hibernate.org/validator/)

### Recommended Books

- Java Persistence with Hibernate - Christian Bauer
- High-Performance Java Persistence - Vlad Mihalcea
- Pro JPA 2 in Java EE 8 - Mike Keith

### Online Resources

- [Vlad Mihalcea Blog](https://vladmihalcea.com/) - Hibernate performance optimization authority
- [Baeldung Hibernate Tutorial](https://www.baeldung.com/hibernate-tutorial)
- [Thorben Janssen Blog](https://thorben-janssen.com/) - JPA and Hibernate best practices

### Advanced Topics

- Hibernate Search (full-text search)
- Hibernate Reactive (reactive programming)
- Hibernate Envers (data auditing)
- Hibernate Spatial (geospatial data)

---

Hibernate is the most mature ORM framework in the Java ecosystem, providing powerful object-relational mapping capabilities. Mastering its core principles and best practices is essential for building high-performance data access layers. Practice with real projects, especially paying attention to performance optimization and avoiding common pitfalls.
