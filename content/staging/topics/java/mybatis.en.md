---
title: MyBatis Persistence Framework
description: "Deep understanding of MyBatis ORM framework: Mapper interfaces, XML mapping, annotation configuration, dynamic SQL, result mapping, and caching mechanisms"
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - MyBatis
  - ORM
  - database
  - persistence layer
status: imported
origin: old/src/content/docs/java/mybatis.en.md
divergence: 0.198
issues: []
legacy:
  category: Java
  subcategory: ORM Framework
  order: 15
  lastUpdated: 2026-01-07
---

MyBatis is an excellent persistence framework that supports custom SQL, stored procedures, and advanced mappings. MyBatis eliminates almost all JDBC code and the work of setting parameters and retrieving result sets. It uses simple XML or annotations to configure and map primitive types, interfaces, and Java POJOs to database records.

## Concept Explanation

### What is MyBatis

MyBatis is a semi-automated ORM (Object-Relational Mapping) framework. Compared to fully automated ORM frameworks like Hibernate, MyBatis gives developers more control over SQL. Its core philosophy is separating SQL statements from Java code, mapping SQL to Java objects through XML files or annotations.

### Historical Background

MyBatis was formerly the Apache iBATIS project, created by Clinton Begin in 2001. In 2010, the project migrated from Apache Software Foundation to Google Code and was renamed MyBatis. The project is currently hosted on GitHub and is one of the most popular Java persistence frameworks.

### Problems It Solves

1. **JDBC Code Redundancy**: Eliminates large amounts of repetitive JDBC code, such as connection management, statement creation, result set processing, etc.
2. **SQL-Code Coupling**: Separates SQL statements from Java code for easier maintenance and optimization
3. **Object-Relational Mapping**: Automatically maps query results to Java objects
4. **Dynamic SQL Building**: Supports dynamically generating SQL statements based on conditions
5. **Cache Management**: Provides first-level and second-level caching to improve query performance

### MyBatis Architecture

```
+-------------------------------------------------------------+
|                      Application                             |
+-------------------------+-----------------------------------+
                          |
+-------------------------v-----------------------------------+
|                   SqlSessionFactory                          |
|  +-----------------------------------------------------+    |
|  |              Configuration (mybatis-config.xml)      |    |
|  |  +-----------+-----------+-------------------------+ |    |
|  |  | DataSource|   Mappers |   Type Handlers         | |    |
|  |  +-----------+-----------+-------------------------+ |    |
|  +-----------------------------------------------------+    |
+-------------------------+-----------------------------------+
                          |
+-------------------------v-----------------------------------+
|                      SqlSession                              |
|  +-----------------------------------------------------+    |
|  |  Executor  |  Statement Handler  |  Result Handler   |    |
|  +-----------------------------------------------------+    |
+-------------------------+-----------------------------------+
                          |
+-------------------------v-----------------------------------+
|                       Database                               |
+-------------------------------------------------------------+
```

---

## Core Principles

### Workflow

MyBatis's workflow can be divided into the following stages:

1. **Load Configuration**: Parse mybatis-config.xml and Mapper XML files, build Configuration object
2. **Create SqlSessionFactory**: Create SqlSessionFactory instance based on Configuration
3. **Create SqlSession**: Obtain SqlSession through SqlSessionFactory
4. **Execute SQL**: SqlSession executes SQL through Mapper interface or directly
5. **Process Results**: Map query results to Java objects

### Core Components

#### SqlSessionFactoryBuilder

Builder used to create SqlSessionFactory. Once SqlSessionFactory is created, it's no longer needed.

```java
String resource = "mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

#### SqlSessionFactory

Factory for creating SqlSession. There should be only one instance throughout the application runtime (singleton pattern).

```java
// Get SqlSession
try (SqlSession session = sqlSessionFactory.openSession()) {
    // Execute operations
    UserMapper mapper = session.getMapper(UserMapper.class);
    User user = mapper.selectById(1L);
}
```

#### SqlSession

Core interface for executing SQL operations. Not thread-safe and should be closed after each operation.

```java
// SqlSession lifecycle
SqlSession session = sqlSessionFactory.openSession();
try {
    // Execute operations
    session.commit();  // Commit transaction
} catch (Exception e) {
    session.rollback(); // Rollback transaction
} finally {
    session.close();   // Close session
}
```

#### Mapper Interface

Interface defining SQL operations. MyBatis creates implementations through dynamic proxy.

```java
public interface UserMapper {
    User selectById(Long id);
    List<User> selectAll();
    int insert(User user);
    int update(User user);
    int deleteById(Long id);
}
```

### Dynamic Proxy Mechanism

MyBatis uses JDK dynamic proxy to create proxy objects for Mapper interfaces. When a Mapper method is called:

1. Proxy object intercepts method call
2. Finds corresponding MappedStatement based on method name and parameters
3. Executes SQL through Executor
4. Processes results using ResultHandler

```java
// Simplified version of MapperProxy core logic
public class MapperProxy<T> implements InvocationHandler {
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // Get MappedStatement
        String statementId = mapperInterface.getName() + "." + method.getName();
        MappedStatement ms = configuration.getMappedStatement(statementId);

        // Execute SQL
        return sqlSession.selectOne(statementId, args[0]);
    }
}
```

### SQL Parsing and Execution

MyBatis uses OGNL (Object-Graph Navigation Language) to parse dynamic SQL:

1. **SqlSource**: Encapsulates SQL statements, divided into static SqlSource and dynamic SqlSource
2. **BoundSql**: Contains the actual SQL to execute and parameter mappings
3. **ParameterHandler**: Sets PreparedStatement parameters
4. **ResultSetHandler**: Handles result set mapping

---

## Core Essentials

### Mapper Interface Definition

The Mapper interface is the core of MyBatis, defining data access methods:

```java
package com.example.mapper;

import com.example.entity.User;
import org.apache.ibatis.annotations.*;
import java.util.List;

public interface UserMapper {

    // Basic CRUD operations
    User selectById(Long id);

    List<User> selectAll();

    List<User> selectByCondition(@Param("name") String name,
                                  @Param("email") String email);

    int insert(User user);

    int update(User user);

    int deleteById(Long id);

    // Batch operations
    int batchInsert(List<User> users);

    int batchDelete(List<Long> ids);

    // Pagination query
    List<User> selectByPage(@Param("offset") int offset,
                            @Param("limit") int limit);
}
```

### XML Mapping Configuration

XML mapping files provide the most flexible way to define SQL:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.UserMapper">

    <!-- Result mapping -->
    <resultMap id="userResultMap" type="com.example.entity.User">
        <id property="id" column="id"/>
        <result property="username" column="username"/>
        <result property="email" column="email"/>
        <result property="password" column="password"/>
        <result property="status" column="status"/>
        <result property="createdAt" column="created_at"/>
        <result property="updatedAt" column="updated_at"/>
    </resultMap>

    <!-- SQL fragment reuse -->
    <sql id="userColumns">
        id, username, email, password, status, created_at, updated_at
    </sql>

    <sql id="userTable">
        users
    </sql>

    <!-- Query single record -->
    <select id="selectById" parameterType="long" resultMap="userResultMap">
        SELECT <include refid="userColumns"/>
        FROM <include refid="userTable"/>
        WHERE id = #{id}
    </select>

    <!-- Query all records -->
    <select id="selectAll" resultMap="userResultMap">
        SELECT <include refid="userColumns"/>
        FROM <include refid="userTable"/>
        ORDER BY created_at DESC
    </select>

    <!-- Insert record -->
    <insert id="insert" parameterType="com.example.entity.User"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO <include refid="userTable"/>
        (username, email, password, status, created_at, updated_at)
        VALUES
        (#{username}, #{email}, #{password}, #{status}, NOW(), NOW())
    </insert>

    <!-- Update record -->
    <update id="update" parameterType="com.example.entity.User">
        UPDATE <include refid="userTable"/>
        SET username = #{username},
            email = #{email},
            status = #{status},
            updated_at = NOW()
        WHERE id = #{id}
    </update>

    <!-- Delete record -->
    <delete id="deleteById" parameterType="long">
        DELETE FROM <include refid="userTable"/>
        WHERE id = #{id}
    </delete>

    <!-- Batch insert -->
    <insert id="batchInsert" parameterType="list">
        INSERT INTO <include refid="userTable"/>
        (username, email, password, status, created_at, updated_at)
        VALUES
        <foreach collection="list" item="user" separator=",">
            (#{user.username}, #{user.email}, #{user.password},
             #{user.status}, NOW(), NOW())
        </foreach>
    </insert>

    <!-- Batch delete -->
    <delete id="batchDelete" parameterType="list">
        DELETE FROM <include refid="userTable"/>
        WHERE id IN
        <foreach collection="list" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
    </delete>

</mapper>
```

### Annotation Configuration

MyBatis also supports defining SQL directly on interfaces using annotations:

```java
package com.example.mapper;

import com.example.entity.User;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE id = #{id}")
    @Results(id = "userResultMap", value = {
        @Result(property = "id", column = "id", id = true),
        @Result(property = "username", column = "username"),
        @Result(property = "email", column = "email"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    User selectById(Long id);

    @Select("SELECT * FROM users ORDER BY created_at DESC")
    @ResultMap("userResultMap")
    List<User> selectAll();

    @Insert("INSERT INTO users (username, email, password, status, created_at) " +
            "VALUES (#{username}, #{email}, #{password}, #{status}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE users SET username = #{username}, email = #{email}, " +
            "updated_at = NOW() WHERE id = #{id}")
    int update(User user);

    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);

    // Use Provider to dynamically generate SQL
    @SelectProvider(type = UserSqlProvider.class, method = "selectByCondition")
    List<User> selectByCondition(@Param("name") String name, @Param("email") String email);
}

// SQL Provider class
public class UserSqlProvider {

    public String selectByCondition(@Param("name") String name, @Param("email") String email) {
        return new SQL() {{
            SELECT("*");
            FROM("users");
            if (name != null && !name.isEmpty()) {
                WHERE("username LIKE CONCAT('%', #{name}, '%')");
            }
            if (email != null && !email.isEmpty()) {
                WHERE("email = #{email}");
            }
            ORDER_BY("created_at DESC");
        }}.toString();
    }
}
```

### Dynamic SQL

MyBatis provides powerful dynamic SQL features:

#### if Tag

```xml
<select id="selectByCondition" resultMap="userResultMap">
    SELECT * FROM users
    WHERE 1=1
    <if test="name != null and name != ''">
        AND username LIKE CONCAT('%', #{name}, '%')
    </if>
    <if test="email != null and email != ''">
        AND email = #{email}
    </if>
    <if test="status != null">
        AND status = #{status}
    </if>
</select>
```

#### choose-when-otherwise Tag

```xml
<select id="selectByType" resultMap="userResultMap">
    SELECT * FROM users
    WHERE 1=1
    <choose>
        <when test="searchType == 'name'">
            AND username = #{keyword}
        </when>
        <when test="searchType == 'email'">
            AND email = #{keyword}
        </when>
        <otherwise>
            AND (username LIKE CONCAT('%', #{keyword}, '%')
                 OR email LIKE CONCAT('%', #{keyword}, '%'))
        </otherwise>
    </choose>
</select>
```

#### where Tag

Automatically handles WHERE and excess AND/OR:

```xml
<select id="selectByCondition" resultMap="userResultMap">
    SELECT * FROM users
    <where>
        <if test="name != null and name != ''">
            AND username LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
    </where>
    ORDER BY created_at DESC
</select>
```

#### set Tag

Automatically handles SET and excess commas:

```xml
<update id="updateSelective">
    UPDATE users
    <set>
        <if test="username != null">
            username = #{username},
        </if>
        <if test="email != null">
            email = #{email},
        </if>
        <if test="password != null">
            password = #{password},
        </if>
        <if test="status != null">
            status = #{status},
        </if>
        updated_at = NOW()
    </set>
    WHERE id = #{id}
</update>
```

#### foreach Tag

```xml
<!-- IN query -->
<select id="selectByIds" resultMap="userResultMap">
    SELECT * FROM users
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- Batch update -->
<update id="batchUpdateStatus">
    UPDATE users
    SET status = #{status}, updated_at = NOW()
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</update>

<!-- Multiple condition OR query -->
<select id="selectByMultipleConditions" resultMap="userResultMap">
    SELECT * FROM users
    <where>
        <foreach collection="conditions" item="cond" separator="OR">
            (username = #{cond.name} AND email = #{cond.email})
        </foreach>
    </where>
</select>
```

#### trim Tag

More flexible whitespace and prefix/suffix handling:

```xml
<select id="selectByCondition" resultMap="userResultMap">
    SELECT * FROM users
    <trim prefix="WHERE" prefixOverrides="AND |OR ">
        <if test="name != null">
            AND username = #{name}
        </if>
        <if test="email != null">
            AND email = #{email}
        </if>
    </trim>
</select>

<update id="updateSelective">
    UPDATE users
    <trim prefix="SET" suffixOverrides=",">
        <if test="username != null">
            username = #{username},
        </if>
        <if test="email != null">
            email = #{email},
        </if>
    </trim>
    WHERE id = #{id}
</update>
```

#### bind Tag

Create variable binding to context:

```xml
<select id="selectByName" resultMap="userResultMap">
    <bind name="pattern" value="'%' + name + '%'"/>
    SELECT * FROM users
    WHERE username LIKE #{pattern}
</select>
```

### Result Mapping

#### Basic Mapping

```xml
<resultMap id="userResultMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="user_name"/>
    <result property="email" column="email_address"/>
    <result property="createdAt" column="created_at" javaType="java.time.LocalDateTime"/>
</resultMap>
```

#### One-to-One Association

```xml
<!-- User to address one-to-one relationship -->
<resultMap id="userWithAddressMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <result property="email" column="email"/>

    <!-- Nested result mapping -->
    <association property="address" javaType="Address">
        <id property="id" column="address_id"/>
        <result property="city" column="city"/>
        <result property="street" column="street"/>
        <result property="zipCode" column="zip_code"/>
    </association>
</resultMap>

<select id="selectUserWithAddress" resultMap="userWithAddressMap">
    SELECT u.id, u.username, u.email,
           a.id as address_id, a.city, a.street, a.zip_code
    FROM users u
    LEFT JOIN addresses a ON u.address_id = a.id
    WHERE u.id = #{id}
</select>

<!-- Using nested query (N+1 problem, use with caution) -->
<resultMap id="userWithAddressLazyMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <association property="address" column="address_id"
                 select="com.example.mapper.AddressMapper.selectById"
                 fetchType="lazy"/>
</resultMap>
```

#### One-to-Many Association (collection)

```xml
<!-- User to orders one-to-many relationship -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <result property="email" column="email"/>

    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNumber" column="order_number"/>
        <result property="totalAmount" column="total_amount"/>
        <result property="status" column="order_status"/>
        <result property="createdAt" column="order_created_at"/>
    </collection>
</resultMap>

<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
    SELECT u.id, u.username, u.email,
           o.id as order_id, o.order_number, o.total_amount,
           o.status as order_status, o.created_at as order_created_at
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = #{id}
    ORDER BY o.created_at DESC
</select>

<!-- Using nested query -->
<resultMap id="userWithOrdersLazyMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <collection property="orders" column="id"
                select="com.example.mapper.OrderMapper.selectByUserId"
                fetchType="lazy"/>
</resultMap>
```

#### Discriminator

Use different mappings based on column value:

```xml
<resultMap id="vehicleResultMap" type="Vehicle">
    <id property="id" column="id"/>
    <result property="brand" column="brand"/>
    <result property="model" column="model"/>

    <discriminator javaType="string" column="vehicle_type">
        <case value="CAR" resultType="Car">
            <result property="doorCount" column="door_count"/>
            <result property="seatCount" column="seat_count"/>
        </case>
        <case value="TRUCK" resultType="Truck">
            <result property="loadCapacity" column="load_capacity"/>
            <result property="axleCount" column="axle_count"/>
        </case>
        <case value="MOTORCYCLE" resultType="Motorcycle">
            <result property="engineCapacity" column="engine_capacity"/>
        </case>
    </discriminator>
</resultMap>
```

### Caching Mechanism

#### First-Level Cache (Local Cache)

First-level cache is SqlSession-level cache, enabled by default:

```java
try (SqlSession session = sqlSessionFactory.openSession()) {
    UserMapper mapper = session.getMapper(UserMapper.class);

    // First query, fetched from database
    User user1 = mapper.selectById(1L);

    // Second query, fetched from first-level cache (same SqlSession)
    User user2 = mapper.selectById(1L);

    System.out.println(user1 == user2);  // true

    // Update operation clears first-level cache
    mapper.update(user1);

    // Cache cleared, query from database again
    User user3 = mapper.selectById(1L);
}
```

#### Second-Level Cache (Global Cache)

Second-level cache is namespace-level cache, needs to be manually enabled:

```xml
<!-- Enable in mybatis-config.xml -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- Configure in Mapper XML -->
<mapper namespace="com.example.mapper.UserMapper">

    <!-- Enable second-level cache -->
    <cache
        eviction="LRU"
        flushInterval="60000"
        size="512"
        readOnly="true"/>

    <!-- Or use third-party cache -->
    <cache type="org.mybatis.caches.redis.RedisCache"/>

    <!-- Specify whether statements use cache -->
    <select id="selectById" resultMap="userResultMap" useCache="true">
        SELECT * FROM users WHERE id = #{id}
    </select>

    <select id="selectAll" resultMap="userResultMap" flushCache="false">
        SELECT * FROM users
    </select>

    <!-- Update operations clear cache by default -->
    <update id="update" flushCache="true">
        UPDATE users SET username = #{username} WHERE id = #{id}
    </update>

</mapper>
```

Cache configuration parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| eviction | Eviction policy: LRU, FIFO, SOFT, WEAK | LRU |
| flushInterval | Flush interval (milliseconds) | None (no scheduled flush) |
| size | Maximum cached objects | 1024 |
| readOnly | Read-only (better performance, but unsafe) | false |
| blocking | Blocking (prevents cache penetration) | false |

---

## Code Examples

### Project Configuration

#### Maven Dependencies

```xml
<dependencies>
    <!-- MyBatis Core -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.16</version>
    </dependency>

    <!-- MyBatis Spring Boot Starter -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>3.0.3</version>
    </dependency>

    <!-- Database Driver -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Connection Pool -->
    <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
    </dependency>

    <!-- Pagination Plugin -->
    <dependency>
        <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper-spring-boot-starter</artifactId>
        <version>2.1.0</version>
    </dependency>
</dependencies>
```

#### MyBatis Core Configuration File

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>

    <!-- Property configuration -->
    <properties resource="database.properties">
        <property name="default.timeout" value="30"/>
    </properties>

    <!-- Global settings -->
    <settings>
        <!-- Enable camelCase naming conversion -->
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <!-- Enable second-level cache -->
        <setting name="cacheEnabled" value="true"/>
        <!-- Enable lazy loading -->
        <setting name="lazyLoadingEnabled" value="true"/>
        <!-- Load on demand -->
        <setting name="aggressiveLazyLoading" value="false"/>
        <!-- Log implementation -->
        <setting name="logImpl" value="SLF4J"/>
        <!-- Allow use of generated keys -->
        <setting name="useGeneratedKeys" value="true"/>
        <!-- Call setters on null values -->
        <setting name="callSettersOnNulls" value="true"/>
        <!-- Return instance for empty row instead of null -->
        <setting name="returnInstanceForEmptyRow" value="true"/>
    </settings>

    <!-- Type aliases -->
    <typeAliases>
        <package name="com.example.entity"/>
    </typeAliases>

    <!-- Type handlers -->
    <typeHandlers>
        <typeHandler handler="com.example.handler.JsonTypeHandler"/>
    </typeHandlers>

    <!-- Plugin configuration -->
    <plugins>
        <plugin interceptor="com.github.pagehelper.PageInterceptor">
            <property name="helperDialect" value="mysql"/>
            <property name="reasonable" value="true"/>
        </plugin>
    </plugins>

    <!-- Environment configuration -->
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${jdbc.driver}"/>
                <property name="url" value="${jdbc.url}"/>
                <property name="username" value="${jdbc.username}"/>
                <property name="password" value="${jdbc.password}"/>
            </dataSource>
        </environment>
    </environments>

    <!-- Mapper mapping -->
    <mappers>
        <package name="com.example.mapper"/>
    </mappers>

</configuration>
```

#### Spring Boot Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1200000

mybatis:
  # Mapper XML file location
  mapper-locations: classpath:mapper/**/*.xml
  # Entity class package path (for aliases)
  type-aliases-package: com.example.entity
  # Configuration file location (optional)
  config-location: classpath:mybatis-config.xml
  configuration:
    # Enable camelCase naming conversion
    map-underscore-to-camel-case: true
    # Enable second-level cache
    cache-enabled: true
    # Log implementation
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
    # Lazy loading
    lazy-loading-enabled: true
    aggressive-lazy-loading: false

# Pagination plugin configuration
pagehelper:
  helper-dialect: mysql
  reasonable: true
  support-methods-arguments: true
  params: count=countSql

# Logging configuration
logging:
  level:
    com.example.mapper: debug
```

### Complete CRUD Example

#### Entity Class

```java
package com.example.entity;

import java.time.LocalDateTime;
import java.io.Serializable;

public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String email;
    private String password;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Associated objects
    private Address address;
    private List<Order> orders;

    // Constructors
    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.status = UserStatus.ACTIVE;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public List<Order> getOrders() {
        return orders;
    }

    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
}

// Enum type
public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

#### Mapper Interface

```java
package com.example.mapper;

import com.example.entity.User;
import com.example.entity.UserStatus;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface UserMapper {

    // Query methods
    User selectById(Long id);

    User selectByUsername(String username);

    User selectByEmail(String email);

    List<User> selectAll();

    List<User> selectByStatus(UserStatus status);

    List<User> selectByCondition(UserQueryParam param);

    // Query with associations
    User selectWithAddress(Long id);

    User selectWithOrders(Long id);

    User selectWithAll(Long id);

    // Insert methods
    int insert(User user);

    int batchInsert(List<User> users);

    // Update methods
    int update(User user);

    int updateSelective(User user);

    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);

    int batchUpdateStatus(@Param("ids") List<Long> ids, @Param("status") UserStatus status);

    // Delete methods
    int deleteById(Long id);

    int batchDelete(List<Long> ids);

    // Count methods
    long count();

    long countByStatus(UserStatus status);

    boolean existsByEmail(String email);
}
```

#### Mapper XML

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.UserMapper">

    <!-- Base result mapping -->
    <resultMap id="BaseResultMap" type="User">
        <id property="id" column="id"/>
        <result property="username" column="username"/>
        <result property="email" column="email"/>
        <result property="password" column="password"/>
        <result property="status" column="status"/>
        <result property="createdAt" column="created_at"/>
        <result property="updatedAt" column="updated_at"/>
    </resultMap>

    <!-- Result mapping with address -->
    <resultMap id="WithAddressResultMap" type="User" extends="BaseResultMap">
        <association property="address" javaType="Address">
            <id property="id" column="address_id"/>
            <result property="city" column="city"/>
            <result property="street" column="street"/>
            <result property="zipCode" column="zip_code"/>
        </association>
    </resultMap>

    <!-- Result mapping with orders -->
    <resultMap id="WithOrdersResultMap" type="User" extends="BaseResultMap">
        <collection property="orders" ofType="Order">
            <id property="id" column="order_id"/>
            <result property="orderNumber" column="order_number"/>
            <result property="totalAmount" column="total_amount"/>
            <result property="status" column="order_status"/>
            <result property="createdAt" column="order_created_at"/>
        </collection>
    </resultMap>

    <!-- Full result mapping -->
    <resultMap id="FullResultMap" type="User" extends="BaseResultMap">
        <association property="address" javaType="Address">
            <id property="id" column="address_id"/>
            <result property="city" column="city"/>
            <result property="street" column="street"/>
            <result property="zipCode" column="zip_code"/>
        </association>
        <collection property="orders" ofType="Order">
            <id property="id" column="order_id"/>
            <result property="orderNumber" column="order_number"/>
            <result property="totalAmount" column="total_amount"/>
            <result property="status" column="order_status"/>
        </collection>
    </resultMap>

    <!-- SQL fragment -->
    <sql id="Base_Column_List">
        id, username, email, password, status, created_at, updated_at
    </sql>

    <!-- ========== Query Methods ========== -->

    <select id="selectById" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        WHERE id = #{id}
    </select>

    <select id="selectByUsername" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        WHERE username = #{username}
    </select>

    <select id="selectByEmail" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        WHERE email = #{email}
    </select>

    <select id="selectAll" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        ORDER BY created_at DESC
    </select>

    <select id="selectByStatus" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        WHERE status = #{status}
        ORDER BY created_at DESC
    </select>

    <!-- Dynamic condition query -->
    <select id="selectByCondition" parameterType="UserQueryParam" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        <where>
            <if test="username != null and username != ''">
                AND username LIKE CONCAT('%', #{username}, '%')
            </if>
            <if test="email != null and email != ''">
                AND email = #{email}
            </if>
            <if test="status != null">
                AND status = #{status}
            </if>
            <if test="startDate != null">
                AND created_at >= #{startDate}
            </if>
            <if test="endDate != null">
                AND created_at &lt;= #{endDate}
            </if>
        </where>
        <choose>
            <when test="orderBy != null and orderBy != ''">
                ORDER BY ${orderBy}
                <if test="orderDir != null and orderDir != ''">
                    ${orderDir}
                </if>
            </when>
            <otherwise>
                ORDER BY created_at DESC
            </otherwise>
        </choose>
    </select>

    <!-- Association queries -->
    <select id="selectWithAddress" resultMap="WithAddressResultMap">
        SELECT u.id, u.username, u.email, u.password, u.status,
               u.created_at, u.updated_at,
               a.id as address_id, a.city, a.street, a.zip_code
        FROM users u
        LEFT JOIN addresses a ON u.address_id = a.id
        WHERE u.id = #{id}
    </select>

    <select id="selectWithOrders" resultMap="WithOrdersResultMap">
        SELECT u.id, u.username, u.email, u.password, u.status,
               u.created_at, u.updated_at,
               o.id as order_id, o.order_number, o.total_amount,
               o.status as order_status, o.created_at as order_created_at
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.id = #{id}
        ORDER BY o.created_at DESC
    </select>

    <select id="selectWithAll" resultMap="FullResultMap">
        SELECT u.id, u.username, u.email, u.password, u.status,
               u.created_at, u.updated_at,
               a.id as address_id, a.city, a.street, a.zip_code,
               o.id as order_id, o.order_number, o.total_amount, o.status as order_status
        FROM users u
        LEFT JOIN addresses a ON u.address_id = a.id
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.id = #{id}
    </select>

    <!-- ========== Insert Methods ========== -->

    <insert id="insert" parameterType="User" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (username, email, password, status, created_at, updated_at)
        VALUES (#{username}, #{email}, #{password}, #{status}, NOW(), NOW())
    </insert>

    <insert id="batchInsert" parameterType="list">
        INSERT INTO users (username, email, password, status, created_at, updated_at)
        VALUES
        <foreach collection="list" item="user" separator=",">
            (#{user.username}, #{user.email}, #{user.password},
             #{user.status}, NOW(), NOW())
        </foreach>
    </insert>

    <!-- ========== Update Methods ========== -->

    <update id="update" parameterType="User">
        UPDATE users
        SET username = #{username},
            email = #{email},
            password = #{password},
            status = #{status},
            updated_at = NOW()
        WHERE id = #{id}
    </update>

    <update id="updateSelective" parameterType="User">
        UPDATE users
        <set>
            <if test="username != null">
                username = #{username},
            </if>
            <if test="email != null">
                email = #{email},
            </if>
            <if test="password != null">
                password = #{password},
            </if>
            <if test="status != null">
                status = #{status},
            </if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
    </update>

    <update id="updateStatus">
        UPDATE users
        SET status = #{status}, updated_at = NOW()
        WHERE id = #{id}
    </update>

    <update id="batchUpdateStatus">
        UPDATE users
        SET status = #{status}, updated_at = NOW()
        WHERE id IN
        <foreach collection="ids" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
    </update>

    <!-- ========== Delete Methods ========== -->

    <delete id="deleteById">
        DELETE FROM users WHERE id = #{id}
    </delete>

    <delete id="batchDelete" parameterType="list">
        DELETE FROM users WHERE id IN
        <foreach collection="list" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
    </delete>

    <!-- ========== Count Methods ========== -->

    <select id="count" resultType="long">
        SELECT COUNT(*) FROM users
    </select>

    <select id="countByStatus" resultType="long">
        SELECT COUNT(*) FROM users WHERE status = #{status}
    </select>

    <select id="existsByEmail" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM users WHERE email = #{email})
    </select>

</mapper>
```

#### Service Layer

```java
package com.example.service;

import com.example.entity.User;
import com.example.entity.UserStatus;
import com.example.mapper.UserMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    // Query methods
    public User findById(Long id) {
        return userMapper.selectById(id);
    }

    public User findByUsername(String username) {
        return userMapper.selectByUsername(username);
    }

    public List<User> findAll() {
        return userMapper.selectAll();
    }

    // Pagination query
    public PageInfo<User> findByPage(int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<User> users = userMapper.selectAll();
        return new PageInfo<>(users);
    }

    // Conditional pagination query
    public PageInfo<User> findByCondition(UserQueryParam param, int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<User> users = userMapper.selectByCondition(param);
        return new PageInfo<>(users);
    }

    // Query with associated data
    public User findWithOrders(Long id) {
        return userMapper.selectWithOrders(id);
    }

    // Create user
    @Transactional
    public User create(User user) {
        // Check if email already exists
        if (userMapper.existsByEmail(user.getEmail())) {
            throw new BusinessException("Email already in use");
        }

        user.setStatus(UserStatus.ACTIVE);
        userMapper.insert(user);
        return user;
    }

    // Batch create
    @Transactional
    public int batchCreate(List<User> users) {
        return userMapper.batchInsert(users);
    }

    // Update user
    @Transactional
    public User update(User user) {
        User existing = userMapper.selectById(user.getId());
        if (existing == null) {
            throw new ResourceNotFoundException("User not found");
        }

        userMapper.updateSelective(user);
        return userMapper.selectById(user.getId());
    }

    // Update status
    @Transactional
    public void updateStatus(Long id, UserStatus status) {
        userMapper.updateStatus(id, status);
    }

    // Batch update status
    @Transactional
    public void batchUpdateStatus(List<Long> ids, UserStatus status) {
        userMapper.batchUpdateStatus(ids, status);
    }

    // Delete user
    @Transactional
    public void delete(Long id) {
        if (userMapper.selectById(id) == null) {
            throw new ResourceNotFoundException("User not found");
        }
        userMapper.deleteById(id);
    }

    // Batch delete
    @Transactional
    public void batchDelete(List<Long> ids) {
        userMapper.batchDelete(ids);
    }

    // Count
    public long count() {
        return userMapper.count();
    }
}
```

### Custom Type Handler

```java
package com.example.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

// JSON type handler
@MappedJdbcTypes(JdbcType.VARCHAR)
@MappedTypes(JsonData.class)
public class JsonTypeHandler<T> extends BaseTypeHandler<T> {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final Class<T> type;

    public JsonTypeHandler(Class<T> type) {
        this.type = type;
    }

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, T parameter,
                                     JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, objectMapper.writeValueAsString(parameter));
        } catch (JsonProcessingException e) {
            throw new SQLException("JSON serialization failed", e);
        }
    }

    @Override
    public T getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseJson(rs.getString(columnName));
    }

    @Override
    public T getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseJson(rs.getString(columnIndex));
    }

    @Override
    public T getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseJson(cs.getString(columnIndex));
    }

    private T parseJson(String json) throws SQLException {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new SQLException("JSON deserialization failed", e);
        }
    }
}

// Enum type handler
@MappedTypes(UserStatus.class)
public class UserStatusTypeHandler extends BaseTypeHandler<UserStatus> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, UserStatus parameter,
                                     JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter.name());
    }

    @Override
    public UserStatus getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String value = rs.getString(columnName);
        return value == null ? null : UserStatus.valueOf(value);
    }

    @Override
    public UserStatus getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String value = rs.getString(columnIndex);
        return value == null ? null : UserStatus.valueOf(value);
    }

    @Override
    public UserStatus getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String value = cs.getString(columnIndex);
        return value == null ? null : UserStatus.valueOf(value);
    }
}
```

### Custom Plugin

```java
package com.example.plugin;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Properties;

// SQL execution time statistics plugin
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class SqlExecutionTimePlugin implements Interceptor {

    private static final Logger log = LoggerFactory.getLogger(SqlExecutionTimePlugin.class);

    private long slowSqlThreshold = 1000; // Slow SQL threshold (milliseconds)

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement mappedStatement = (MappedStatement) invocation.getArgs()[0];
        String sqlId = mappedStatement.getId();

        long startTime = System.currentTimeMillis();

        try {
            return invocation.proceed();
        } finally {
            long executionTime = System.currentTimeMillis() - startTime;

            if (executionTime > slowSqlThreshold) {
                log.warn("Slow SQL detected - ID: {}, execution time: {}ms", sqlId, executionTime);
            } else {
                log.debug("SQL execution - ID: {}, execution time: {}ms", sqlId, executionTime);
            }
        }
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        String threshold = properties.getProperty("slowSqlThreshold");
        if (threshold != null) {
            this.slowSqlThreshold = Long.parseLong(threshold);
        }
    }
}

// Data permission plugin
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class DataPermissionPlugin implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];

        // Check if data permission control is needed
        if (needsDataPermission(ms)) {
            // Get current user's data permission
            String dataPermission = getCurrentUserDataPermission();

            // Modify SQL to add data permission condition
            // ...
        }

        return invocation.proceed();
    }

    private boolean needsDataPermission(MappedStatement ms) {
        // Determine if data permission control is needed based on SQL ID or annotation
        return ms.getId().contains("selectBy");
    }

    private String getCurrentUserDataPermission() {
        // Get current user's data permission from context
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
    }
}
```

---

## Best Practices

### Project Structure

```
src/main/
├── java/
│   └── com/example/
│       ├── config/
│       │   └── MyBatisConfig.java
│       ├── entity/
│       │   ├── User.java
│       │   └── Order.java
│       ├── mapper/
│       │   ├── UserMapper.java
│       │   └── OrderMapper.java
│       ├── service/
│       │   ├── UserService.java
│       │   └── OrderService.java
│       ├── handler/
│       │   └── JsonTypeHandler.java
│       └── plugin/
│           └── SqlExecutionTimePlugin.java
└── resources/
    ├── mapper/
    │   ├── UserMapper.xml
    │   └── OrderMapper.xml
    ├── application.yml
    └── mybatis-config.xml
```

### Naming Conventions

1. **Mapper Interface**: End with `Mapper`, e.g., `UserMapper`
2. **Mapper XML**: Same name as interface, e.g., `UserMapper.xml`
3. **namespace**: Use Mapper interface's fully qualified name
4. **Method Names**:
   - Query: `selectById`, `selectByXxx`, `selectAll`
   - Insert: `insert`, `batchInsert`
   - Update: `update`, `updateSelective`, `updateXxx`
   - Delete: `deleteById`, `batchDelete`
   - Count: `count`, `countByXxx`, `existsByXxx`

### SQL Writing Standards

```xml
<!-- 1. Use SQL fragments for reuse -->
<sql id="Base_Column_List">
    id, username, email, status, created_at, updated_at
</sql>

<!-- 2. Avoid SELECT * -->
<select id="selectById" resultMap="BaseResultMap">
    SELECT <include refid="Base_Column_List"/>
    FROM users WHERE id = #{id}
</select>

<!-- 3. Use parameterized queries to prevent SQL injection -->
<!-- Correct: Use #{} -->
<select id="selectByUsername" resultMap="BaseResultMap">
    SELECT * FROM users WHERE username = #{username}
</select>

<!-- Wrong: Using ${} has SQL injection risk -->
<!-- <select id="selectByUsername">
    SELECT * FROM users WHERE username = '${username}'
</select> -->

<!-- 4. Use ${} for sorting but validate -->
<select id="selectWithOrder" resultMap="BaseResultMap">
    SELECT * FROM users
    <if test="orderBy != null and orderBy.matches('^[a-zA-Z_]+$')">
        ORDER BY ${orderBy}
    </if>
</select>

<!-- 5. Use LIMIT to restrict return count -->
<select id="selectTop10" resultMap="BaseResultMap">
    SELECT * FROM users ORDER BY created_at DESC LIMIT 10
</select>
```

### Transaction Management

```java
@Service
public class OrderService {

    private final OrderMapper orderMapper;
    private final UserMapper userMapper;
    private final ProductMapper productMapper;

    // Constructor injection

    // Use declarative transactions
    @Transactional(rollbackFor = Exception.class)
    public Order createOrder(CreateOrderRequest request) {
        // 1. Validate user
        User user = userMapper.selectById(request.getUserId());
        if (user == null) {
            throw new BusinessException("User not found");
        }

        // 2. Validate products and calculate total price
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItemRequest item : request.getItems()) {
            Product product = productMapper.selectById(item.getProductId());
            if (product == null || product.getStock() < item.getQuantity()) {
                throw new BusinessException("Product not found or insufficient stock");
            }
            totalAmount = totalAmount.add(
                product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
            );
        }

        // 3. Create order
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setOrderNumber(generateOrderNumber());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING);
        orderMapper.insert(order);

        // 4. Create order items and deduct stock
        for (OrderItemRequest item : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(order.getId());
            orderItem.setProductId(item.getProductId());
            orderItem.setQuantity(item.getQuantity());
            orderItemMapper.insert(orderItem);

            // Deduct stock
            productMapper.decreaseStock(item.getProductId(), item.getQuantity());
        }

        return order;
    }

    // Programmatic transactions
    @Autowired
    private TransactionTemplate transactionTemplate;

    public Order createOrderProgrammatic(CreateOrderRequest request) {
        return transactionTemplate.execute(status -> {
            try {
                // Business logic
                return createOrderInternal(request);
            } catch (Exception e) {
                status.setRollbackOnly();
                throw e;
            }
        });
    }
}
```

### Pagination Handling

```java
// Using PageHelper plugin
@Service
public class UserService {

    public PageInfo<User> findByPage(int pageNum, int pageSize) {
        // Call PageHelper.startPage before query
        PageHelper.startPage(pageNum, pageSize);

        // The first query following will be paginated
        List<User> users = userMapper.selectAll();

        // Wrap result with PageInfo
        return new PageInfo<>(users);
    }

    public PageInfo<User> findByConditionWithPage(UserQueryParam param,
                                                   int pageNum, int pageSize) {
        // Set pagination and sorting
        PageHelper.startPage(pageNum, pageSize, "created_at desc");
        List<User> users = userMapper.selectByCondition(param);
        return new PageInfo<>(users);
    }

    // Using RowBounds (not recommended, requires full table scan)
    public List<User> findByRowBounds(int offset, int limit) {
        return userMapper.selectAllWithRowBounds(new RowBounds(offset, limit));
    }

    // Manual pagination (recommended for complex queries)
    public List<User> findByManualPage(int offset, int limit) {
        return userMapper.selectByPage(offset, limit);
    }
}

// Common PageInfo properties
// pageInfo.getTotal()      - Total records
// pageInfo.getPages()      - Total pages
// pageInfo.getPageNum()    - Current page number
// pageInfo.getPageSize()   - Page size
// pageInfo.getList()       - Result list
// pageInfo.isHasNextPage() - Has next page
// pageInfo.isHasPreviousPage() - Has previous page
```

---

## Common Pitfalls

### N+1 Query Problem

```xml
<!-- Problem: Nested query causes N+1 problem -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <!-- This executes one extra query for each user -->
    <collection property="orders" column="id"
                select="com.example.mapper.OrderMapper.selectByUserId"/>
</resultMap>

<select id="selectAll" resultMap="userWithOrdersMap">
    SELECT * FROM users  <!-- Query N users -->
</select>
<!-- Result: 1 + N queries -->

<!-- Solution 1: Use JOIN query -->
<resultMap id="userWithOrdersJoinMap" type="User">
    <id property="id" column="id"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNumber" column="order_number"/>
    </collection>
</resultMap>

<select id="selectAllWithOrders" resultMap="userWithOrdersJoinMap">
    SELECT u.*, o.id as order_id, o.order_number
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
</select>

<!-- Solution 2: Batch query + manual assembly -->
```

```java
// Solution 3: Batch query in code
public List<User> findAllWithOrders() {
    List<User> users = userMapper.selectAll();

    if (!users.isEmpty()) {
        List<Long> userIds = users.stream()
            .map(User::getId)
            .collect(Collectors.toList());

        // Query all orders at once
        List<Order> allOrders = orderMapper.selectByUserIds(userIds);

        // Group by user ID
        Map<Long, List<Order>> ordersByUser = allOrders.stream()
            .collect(Collectors.groupingBy(Order::getUserId));

        // Assemble data
        users.forEach(user ->
            user.setOrders(ordersByUser.getOrDefault(user.getId(), Collections.emptyList()))
        );
    }

    return users;
}
```

### Difference Between #{} and ${}

```xml
<!-- #{} - Prepared parameter, prevents SQL injection (recommended) -->
<select id="selectByUsername" resultType="User">
    SELECT * FROM users WHERE username = #{username}
</select>
<!-- Generates: SELECT * FROM users WHERE username = ? -->

<!-- ${} - String substitution, has SQL injection risk -->
<select id="selectByColumn" resultType="User">
    SELECT * FROM users WHERE ${column} = #{value}
</select>
<!-- Generates: SELECT * FROM users WHERE username = ? -->

<!-- Correct use cases for ${} -->
<!-- 1. Dynamic table name -->
<select id="selectFromTable" resultType="map">
    SELECT * FROM ${tableName} WHERE id = #{id}
</select>

<!-- 2. Dynamic column name (requires whitelist validation) -->
<select id="selectWithOrder" resultType="User">
    SELECT * FROM users
    <if test="orderColumn != null">
        ORDER BY ${orderColumn}
    </if>
</select>

<!-- Safe way to use ${} -->
<select id="selectWithSafeOrder" resultType="User">
    SELECT * FROM users
    ORDER BY
    <choose>
        <when test="orderBy == 'username'">username</when>
        <when test="orderBy == 'email'">email</when>
        <when test="orderBy == 'createdAt'">created_at</when>
        <otherwise>id</otherwise>
    </choose>
    <if test="orderDir == 'desc'">DESC</if>
</select>
```

### First-Level Cache Pitfall

```java
// Problem: Cache not shared between different SqlSessions
public void cacheIssue() {
    try (SqlSession session1 = sqlSessionFactory.openSession();
         SqlSession session2 = sqlSessionFactory.openSession()) {

        UserMapper mapper1 = session1.getMapper(UserMapper.class);
        UserMapper mapper2 = session2.getMapper(UserMapper.class);

        // First query
        User user1 = mapper1.selectById(1L);

        // Update in session2
        User updateUser = new User();
        updateUser.setId(1L);
        updateUser.setUsername("newName");
        mapper2.update(updateUser);
        session2.commit();

        // session1's cache not invalidated, reads stale data
        User user2 = mapper1.selectById(1L); // Still old data!
    }
}

// Solution 1: Disable first-level cache
// Set in mybatis-config.xml
// <setting name="localCacheScope" value="STATEMENT"/>

// Solution 2: Manually clear cache
public void clearCacheSolution() {
    try (SqlSession session = sqlSessionFactory.openSession()) {
        UserMapper mapper = session.getMapper(UserMapper.class);

        User user1 = mapper.selectById(1L);

        // Clear first-level cache
        session.clearCache();

        User user2 = mapper.selectById(1L); // Query again
    }
}

// Solution 3: Use Spring-managed (one SqlSession per method)
@Service
@Transactional
public class UserService {
    // Spring-managed SqlSession closes after method ends, no cache issues
}
```

### Batch Operation Data Volume Limit

```xml
<!-- Problem: Batch inserting large amounts of data at once -->
<insert id="batchInsert">
    INSERT INTO users (username, email) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.username}, #{user.email})
    </foreach>
</insert>
<!-- If list has 10000 items, SQL will be very long -->
```

```java
// Solution: Process in batches
@Service
public class UserService {

    private static final int BATCH_SIZE = 500;

    @Transactional
    public void batchInsert(List<User> users) {
        // Insert in batches
        Lists.partition(users, BATCH_SIZE).forEach(batch -> {
            userMapper.batchInsert(batch);
        });
    }

    // Or use MyBatis batch mode
    public void batchInsertWithExecutor(List<User> users) {
        try (SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH)) {
            UserMapper mapper = session.getMapper(UserMapper.class);

            for (int i = 0; i < users.size(); i++) {
                mapper.insert(users.get(i));

                if ((i + 1) % BATCH_SIZE == 0) {
                    session.flushStatements();
                }
            }

            session.flushStatements();
            session.commit();
        }
    }
}
```

### Lazy Loading Failure

```java
// Problem: Accessing lazy-loaded property after SqlSession closes
public User getUserWithOrders(Long id) {
    User user;
    try (SqlSession session = sqlSessionFactory.openSession()) {
        UserMapper mapper = session.getMapper(UserMapper.class);
        user = mapper.selectById(id);
    }
    // SqlSession already closed

    // Accessing lazy-loaded orders here will throw error
    List<Order> orders = user.getOrders(); // LazyLoadingException!

    return user;
}

// Solution 1: Access within SqlSession
public User getUserWithOrders(Long id) {
    try (SqlSession session = sqlSessionFactory.openSession()) {
        UserMapper mapper = session.getMapper(UserMapper.class);
        User user = mapper.selectById(id);

        // Trigger lazy loading before SqlSession closes
        user.getOrders().size();

        return user;
    }
}

// Solution 2: Use eager loading
<resultMap id="eagerLoadMap" type="User">
    <collection property="orders" fetchType="eager" .../>
</resultMap>

// Solution 3: Use Spring-managed transactions
@Service
public class UserService {

    @Transactional(readOnly = true)
    public User getUserWithOrders(Long id) {
        User user = userMapper.selectById(id);
        // Can safely access lazy-loaded properties within transaction
        user.getOrders().size();
        return user;
    }
}
```

### Type Conversion Issues

```xml
<!-- Problem: Enum type handling -->
<insert id="insert">
    INSERT INTO users (status) VALUES (#{status})
</insert>
<!-- By default, uses enum's ordinal, problematic if enum order changes -->

<!-- Solution: Use enum name -->
<insert id="insert">
    INSERT INTO users (status) VALUES (#{status,typeHandler=org.apache.ibatis.type.EnumTypeHandler})
</insert>

<!-- Or configure globally -->
<typeHandlers>
    <typeHandler handler="org.apache.ibatis.type.EnumTypeHandler"
                 javaType="com.example.entity.UserStatus"/>
</typeHandlers>
```

---

## Performance Considerations

### SQL Optimization

```xml
<!-- Avoid full table scans -->
<select id="selectByEmail" resultMap="BaseResultMap">
    SELECT * FROM users WHERE email = #{email}
    <!-- Ensure email column has index -->
</select>

<!-- Use covering index -->
<select id="selectUsernameById" resultType="string">
    SELECT username FROM users WHERE id = #{id}
    <!-- If there's a (id, username) composite index, this is a covering index query -->
</select>

<!-- Avoid functions that invalidate indexes -->
<!-- Wrong -->
<select id="selectByDate">
    SELECT * FROM users WHERE DATE(created_at) = #{date}
</select>
<!-- Correct -->
<select id="selectByDate">
    SELECT * FROM users
    WHERE created_at >= #{startDate} AND created_at &lt; #{endDate}
</select>

<!-- Pagination optimization: Use primary key range query instead of OFFSET -->
<!-- Traditional pagination (slow) -->
<select id="selectByPage">
    SELECT * FROM users ORDER BY id LIMIT #{offset}, #{limit}
</select>

<!-- Optimized pagination (fast) -->
<select id="selectByPageOptimized">
    SELECT * FROM users WHERE id > #{lastId} ORDER BY id LIMIT #{limit}
</select>
```

### Batch Operation Optimization

```java
// Use BATCH executor
public void batchUpdate(List<User> users) {
    try (SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH, false)) {
        UserMapper mapper = session.getMapper(UserMapper.class);

        int batchSize = 1000;
        for (int i = 0; i < users.size(); i++) {
            mapper.update(users.get(i));

            if ((i + 1) % batchSize == 0) {
                session.flushStatements();
                session.clearCache(); // Clear first-level cache
            }
        }

        session.flushStatements();
        session.commit();
    }
}

// MySQL batch insert optimization
// Add parameter to jdbc url: rewriteBatchedStatements=true
// spring.datasource.url=jdbc:mysql://localhost:3306/db?rewriteBatchedStatements=true
```

### Cache Strategy

```xml
<!-- Properly use second-level cache -->
<mapper namespace="com.example.mapper.UserMapper">

    <!-- Configure second-level cache -->
    <cache
        eviction="LRU"
        flushInterval="300000"
        size="1024"
        readOnly="true"/>

    <!-- Disable cache for frequently changing queries -->
    <select id="selectActiveUsers" resultMap="BaseResultMap" useCache="false">
        SELECT * FROM users WHERE status = 'ACTIVE'
    </select>

    <!-- Use cache for immutable data -->
    <select id="selectById" resultMap="BaseResultMap" useCache="true">
        SELECT * FROM users WHERE id = #{id}
    </select>

</mapper>
```

```java
// Use Redis as second-level cache
// 1. Add dependency
// mybatis-redis

// 2. Configure cache
@CacheNamespace(implementation = RedisCache.class)
public interface UserMapper {
    // ...
}

// 3. Configure Redis
// redis.properties
redis.host=localhost
redis.port=6379
redis.database=0
redis.timeout=2000
```

### Connection Pool Optimization

```yaml
spring:
  datasource:
    hikari:
      # Maximum connections
      maximum-pool-size: 20
      # Minimum idle connections
      minimum-idle: 5
      # Idle timeout
      idle-timeout: 300000
      # Connection timeout
      connection-timeout: 20000
      # Maximum connection lifetime
      max-lifetime: 1800000
      # Connection test query
      connection-test-query: SELECT 1
      # Leak detection threshold
      leak-detection-threshold: 60000
```

### Query Result Optimization

```xml
<!-- Use projection to reduce data transfer -->
<select id="selectUsernames" resultType="string">
    SELECT username FROM users WHERE status = 'ACTIVE'
</select>

<!-- Use DTO projection -->
<select id="selectUserSummary" resultType="UserSummaryDTO">
    SELECT id, username, email FROM users WHERE id = #{id}
</select>

<!-- Avoid querying unnecessary columns -->
<!-- Not recommended -->
<select id="selectAll" resultType="User">
    SELECT * FROM users
</select>

<!-- Recommended -->
<select id="selectAll" resultType="User">
    SELECT id, username, email, status, created_at, updated_at FROM users
</select>
```

---

## Practical Scenarios

### Multi-Tenant Data Isolation

```java
// Multi-tenant interceptor
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class TenantInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];

        // Get current tenant ID
        String tenantId = TenantContextHolder.getTenantId();

        // Skip queries that don't need tenant isolation
        if (shouldSkipTenant(ms)) {
            return invocation.proceed();
        }

        // Get original SQL
        BoundSql boundSql = ms.getBoundSql(parameter);
        String originalSql = boundSql.getSql();

        // Add tenant condition
        String newSql = addTenantCondition(originalSql, tenantId);

        // Create new BoundSql
        BoundSql newBoundSql = new BoundSql(
            ms.getConfiguration(), newSql,
            boundSql.getParameterMappings(), parameter
        );

        // Create new MappedStatement
        MappedStatement newMs = newMappedStatement(ms, new BoundSqlSqlSource(newBoundSql));
        invocation.getArgs()[0] = newMs;

        return invocation.proceed();
    }

    private String addTenantCondition(String sql, String tenantId) {
        // Simple implementation: Add tenant condition after WHERE
        if (sql.toLowerCase().contains("where")) {
            return sql.replaceFirst("(?i)where",
                "WHERE tenant_id = '" + tenantId + "' AND ");
        } else {
            return sql + " WHERE tenant_id = '" + tenantId + "'";
        }
    }
}
```

### Audit Logging

```java
// Audit field auto-fill
@Intercepts({
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class AuditInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];

        SqlCommandType sqlCommandType = ms.getSqlCommandType();

        if (parameter != null) {
            String currentUser = SecurityContextHolder.getContext()
                .getAuthentication().getName();
            LocalDateTime now = LocalDateTime.now();

            if (sqlCommandType == SqlCommandType.INSERT) {
                setFieldValue(parameter, "createdBy", currentUser);
                setFieldValue(parameter, "createdAt", now);
                setFieldValue(parameter, "updatedBy", currentUser);
                setFieldValue(parameter, "updatedAt", now);
            } else if (sqlCommandType == SqlCommandType.UPDATE) {
                setFieldValue(parameter, "updatedBy", currentUser);
                setFieldValue(parameter, "updatedAt", now);
            }
        }

        return invocation.proceed();
    }

    private void setFieldValue(Object object, String fieldName, Object value) {
        try {
            Field field = object.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(object, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            // Skip if field doesn't exist
        }
    }
}
```

### Soft Delete Support

```xml
<!-- Soft delete Mapper -->
<mapper namespace="com.example.mapper.UserMapper">

    <!-- Automatically filter deleted records in queries -->
    <sql id="notDeleted">
        AND deleted = 0
    </sql>

    <select id="selectById" resultMap="BaseResultMap">
        SELECT * FROM users WHERE id = #{id}
        <include refid="notDeleted"/>
    </select>

    <select id="selectAll" resultMap="BaseResultMap">
        SELECT * FROM users WHERE 1=1
        <include refid="notDeleted"/>
        ORDER BY created_at DESC
    </select>

    <!-- Soft delete -->
    <update id="softDelete">
        UPDATE users
        SET deleted = 1, deleted_at = NOW(), deleted_by = #{deletedBy}
        WHERE id = #{id} AND deleted = 0
    </update>

    <!-- Restore -->
    <update id="restore">
        UPDATE users
        SET deleted = 0, deleted_at = NULL, deleted_by = NULL
        WHERE id = #{id} AND deleted = 1
    </update>

    <!-- Hard delete (admin only) -->
    <delete id="hardDelete">
        DELETE FROM users WHERE id = #{id}
    </delete>

</mapper>
```

### Complex Report Queries

```xml
<!-- Sales report query -->
<select id="selectSalesReport" resultType="SalesReportDTO">
    SELECT
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as orderCount,
        COUNT(DISTINCT o.user_id) as customerCount,
        SUM(oi.quantity) as totalQuantity,
        SUM(oi.quantity * oi.unit_price) as totalAmount,
        AVG(oi.quantity * oi.unit_price) as avgOrderAmount
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    <where>
        o.status = 'COMPLETED'
        <if test="startDate != null">
            AND o.created_at >= #{startDate}
        </if>
        <if test="endDate != null">
            AND o.created_at &lt;= #{endDate}
        </if>
        <if test="productIds != null and productIds.size() > 0">
            AND oi.product_id IN
            <foreach collection="productIds" item="id" open="(" separator="," close=")">
                #{id}
            </foreach>
        </if>
    </where>
    GROUP BY DATE(o.created_at)
    <if test="orderBy != null">
        ORDER BY
        <choose>
            <when test="orderBy == 'date'">date</when>
            <when test="orderBy == 'amount'">totalAmount</when>
            <when test="orderBy == 'count'">orderCount</when>
            <otherwise>date</otherwise>
        </choose>
        <if test="orderDir == 'desc'">DESC</if>
    </if>
</select>
```

---

## Interview Key Points

### Basic Questions

**Q1: What is the difference between #{} and ${} in MyBatis?**

- `#{}`: Prepared parameter, replaced with `?`, then parameter value is set through PreparedStatement, prevents SQL injection
- `${}`: String substitution, directly concatenates parameter value into SQL, has SQL injection risk, suitable for dynamic table names, column names, etc.

**Q2: What is the difference between first-level and second-level cache in MyBatis?**

| Feature | First-Level Cache | Second-Level Cache |
|---------|-------------------|-------------------|
| Scope | SqlSession | namespace (Mapper) |
| Default State | Enabled | Disabled |
| Lifecycle | SqlSession lifecycle | Application lifecycle |
| Clear Timing | On update operation or manual clear | Configured flush interval or on update |
| Data Sharing | Not shared | Shared within same namespace |

**Q3: How does MyBatis implement pagination?**

1. **RowBounds**: In-memory pagination, not recommended for large data volumes
2. **PageHelper Plugin**: Modifies SQL through interceptor, recommended
3. **Manual SQL**: Write LIMIT and OFFSET directly in SQL
4. **Database Dialect**: Use different pagination syntax for different databases

### Advanced Questions

**Q4: Briefly describe how MyBatis works**

1. Load configuration files (mybatis-config.xml and Mapper.xml)
2. Parse configuration to create Configuration object
3. Create SqlSessionFactory
4. Get SqlSession through SqlSessionFactory
5. SqlSession executes SQL through Executor
6. MappedStatement encapsulates SQL statements and mapping information
7. TypeHandler handles parameter and result type conversion
8. Return results

**Q5: How does MyBatis prevent SQL injection?**

1. Use `#{}` prepared parameters, don't use `${}`
2. For scenarios that must use `${}` (like dynamic column names), use whitelist validation
3. Use MyBatis's dynamic SQL tags to build safe SQL
4. Validate and filter user input

**Q6: How is MyBatis's lazy loading implemented?**

1. Create proxy objects using CGLIB or Javassist
2. When lazy-loaded property is accessed, proxy object intercepts the call
3. Proxy object executes associated query to get data
4. Fills data into target object and returns

### Practical Questions

**Q7: How to optimize MyBatis batch operation performance?**

1. Use `ExecutorType.BATCH` executor
2. Set reasonable batch size (like 500-1000)
3. Enable `rewriteBatchedStatements=true`
4. Use `<foreach>` to build multi-value INSERT
5. Periodically flush and clear first-level cache

**Q8: How does MyBatis handle the N+1 query problem?**

1. Use JOIN query to get all data at once
2. Use batch queries instead of loop queries
3. Properly use lazy loading with `fetchType="lazy"`
4. Use `fetchType="eager"` to load immediately when needed

---

## Further Reading

### Official Resources

- [MyBatis Official Documentation](https://mybatis.org/mybatis-3/)
- [MyBatis-Spring Documentation](https://mybatis.org/spring/)
- [MyBatis-Spring-Boot-Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
- [MyBatis GitHub](https://github.com/mybatis/mybatis-3)

### Plugins and Tools

- [PageHelper Pagination Plugin](https://github.com/pagehelper/Mybatis-PageHelper)
- [MyBatis-Plus](https://baomidou.com/)
- [MyBatis Generator](https://mybatis.org/generator/)
- [tk.mybatis Universal Mapper](https://github.com/abel533/Mapper)

### Recommended Books

- "MyBatis Technical Insider" - Xu Junming
- "MyBatis From Beginner to Expert" - Liu Zenghui
- "Java Persistence in Action" - Related chapters

### Related Articles

- [MyBatis Source Code Analysis Series](https://www.cnblogs.com/dongying/tag/MyBatis/)
- [MyBatis Caching Mechanism Explained](https://tech.meituan.com/2018/01/19/mybatis-cache.html)
- [MyBatis Dynamic SQL Best Practices](https://blog.mybatis.org/)
