---
title: MyBatis 持久层框架
description: 深入理解 MyBatis ORM 框架：Mapper 接口、XML 映射、注解配置、动态 SQL、结果映射与缓存机制
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - MyBatis
  - ORM
  - 数据库
  - 持久层
status: imported
origin: old/src/content/docs/java/mybatis.zh.md
divergence: 0.198
issues: []
legacy:
  category: Java
  subcategory: ORM框架
  order: 15
  lastUpdated: 2026-01-07
---

MyBatis 是一款优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。MyBatis 消除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO 为数据库中的记录。

## 概念解释

### 什么是 MyBatis

MyBatis 是一个半自动化的 ORM（Object-Relational Mapping）框架，相比于 Hibernate 等全自动 ORM 框架，MyBatis 给予开发者更多的 SQL 控制权。它的核心思想是将 SQL 语句与 Java 代码分离，通过 XML 文件或注解的方式将 SQL 与 Java 对象进行映射。

### 历史背景

MyBatis 的前身是 Apache 的 iBATIS 项目，于 2001 年由 Clinton Begin 创建。2010 年，该项目从 Apache Software Foundation 迁移至 Google Code，并更名为 MyBatis。目前项目托管在 GitHub 上，是 Java 持久层最流行的框架之一。

### 解决的问题

1. **JDBC 代码冗余**：消除了大量重复的 JDBC 代码，如连接管理、语句创建、结果集处理等
2. **SQL 与代码耦合**：将 SQL 语句从 Java 代码中分离，便于维护和优化
3. **对象关系映射**：自动将查询结果映射为 Java 对象
4. **动态 SQL 构建**：支持根据条件动态生成 SQL 语句
5. **缓存管理**：提供一级缓存和二级缓存，提升查询性能

### MyBatis 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Application                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   SqlSessionFactory                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Configuration (mybatis-config.xml)          ││
│  │  ┌─────────────┬─────────────┬─────────────────────────┐││
│  │  │ DataSource  │   Mappers   │   Type Handlers         │││
│  │  └─────────────┴─────────────┴─────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      SqlSession                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Executor  │  Statement Handler  │  Result Handler      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Database                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心原理

### 工作流程

MyBatis 的工作流程可以分为以下几个阶段：

1. **加载配置**：解析 mybatis-config.xml 和 Mapper XML 文件，构建 Configuration 对象
2. **创建 SqlSessionFactory**：根据 Configuration 创建 SqlSessionFactory 实例
3. **创建 SqlSession**：通过 SqlSessionFactory 获取 SqlSession
4. **执行 SQL**：SqlSession 通过 Mapper 接口或直接执行 SQL
5. **处理结果**：将查询结果映射为 Java 对象

### 核心组件

#### SqlSessionFactoryBuilder

用于创建 SqlSessionFactory 的构建器，一旦创建了 SqlSessionFactory 后就不再需要。

```java
String resource = "mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

#### SqlSessionFactory

创建 SqlSession 的工厂，整个应用运行期间应该只存在一个实例（单例模式）。

```java
// 获取 SqlSession
try (SqlSession session = sqlSessionFactory.openSession()) {
    // 执行操作
    UserMapper mapper = session.getMapper(UserMapper.class);
    User user = mapper.selectById(1L);
}
```

#### SqlSession

执行 SQL 操作的核心接口，非线程安全，每次操作完成后应关闭。

```java
// SqlSession 的生命周期
SqlSession session = sqlSessionFactory.openSession();
try {
    // 执行操作
    session.commit();  // 提交事务
} catch (Exception e) {
    session.rollback(); // 回滚事务
} finally {
    session.close();   // 关闭会话
}
```

#### Mapper 接口

定义 SQL 操作的接口，MyBatis 通过动态代理为其创建实现。

```java
public interface UserMapper {
    User selectById(Long id);
    List<User> selectAll();
    int insert(User user);
    int update(User user);
    int deleteById(Long id);
}
```

### 动态代理机制

MyBatis 使用 JDK 动态代理为 Mapper 接口创建代理对象。当调用 Mapper 方法时：

1. 代理对象拦截方法调用
2. 根据方法名和参数找到对应的 MappedStatement
3. 通过 Executor 执行 SQL
4. 使用 ResultHandler 处理结果

```java
// MapperProxy 核心逻辑简化版
public class MapperProxy<T> implements InvocationHandler {
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 获取 MappedStatement
        String statementId = mapperInterface.getName() + "." + method.getName();
        MappedStatement ms = configuration.getMappedStatement(statementId);

        // 执行 SQL
        return sqlSession.selectOne(statementId, args[0]);
    }
}
```

### SQL 解析与执行

MyBatis 使用 OGNL（Object-Graph Navigation Language）解析动态 SQL：

1. **SqlSource**：封装 SQL 语句，分为静态 SqlSource 和动态 SqlSource
2. **BoundSql**：包含实际执行的 SQL 和参数映射
3. **ParameterHandler**：设置 PreparedStatement 参数
4. **ResultSetHandler**：处理结果集映射

---

## 核心要点

### Mapper 接口定义

Mapper 接口是 MyBatis 的核心，定义了数据访问方法：

```java
package com.example.mapper;

import com.example.entity.User;
import org.apache.ibatis.annotations.*;
import java.util.List;

public interface UserMapper {

    // 基本 CRUD 操作
    User selectById(Long id);

    List<User> selectAll();

    List<User> selectByCondition(@Param("name") String name,
                                  @Param("email") String email);

    int insert(User user);

    int update(User user);

    int deleteById(Long id);

    // 批量操作
    int batchInsert(List<User> users);

    int batchDelete(List<Long> ids);

    // 分页查询
    List<User> selectByPage(@Param("offset") int offset,
                            @Param("limit") int limit);
}
```

### XML 映射配置

XML 映射文件提供了最灵活的 SQL 定义方式：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.UserMapper">

    <!-- 结果映射 -->
    <resultMap id="userResultMap" type="com.example.entity.User">
        <id property="id" column="id"/>
        <result property="username" column="username"/>
        <result property="email" column="email"/>
        <result property="password" column="password"/>
        <result property="status" column="status"/>
        <result property="createdAt" column="created_at"/>
        <result property="updatedAt" column="updated_at"/>
    </resultMap>

    <!-- SQL 片段复用 -->
    <sql id="userColumns">
        id, username, email, password, status, created_at, updated_at
    </sql>

    <sql id="userTable">
        users
    </sql>

    <!-- 查询单条记录 -->
    <select id="selectById" parameterType="long" resultMap="userResultMap">
        SELECT <include refid="userColumns"/>
        FROM <include refid="userTable"/>
        WHERE id = #{id}
    </select>

    <!-- 查询所有记录 -->
    <select id="selectAll" resultMap="userResultMap">
        SELECT <include refid="userColumns"/>
        FROM <include refid="userTable"/>
        ORDER BY created_at DESC
    </select>

    <!-- 插入记录 -->
    <insert id="insert" parameterType="com.example.entity.User"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO <include refid="userTable"/>
        (username, email, password, status, created_at, updated_at)
        VALUES
        (#{username}, #{email}, #{password}, #{status}, NOW(), NOW())
    </insert>

    <!-- 更新记录 -->
    <update id="update" parameterType="com.example.entity.User">
        UPDATE <include refid="userTable"/>
        SET username = #{username},
            email = #{email},
            status = #{status},
            updated_at = NOW()
        WHERE id = #{id}
    </update>

    <!-- 删除记录 -->
    <delete id="deleteById" parameterType="long">
        DELETE FROM <include refid="userTable"/>
        WHERE id = #{id}
    </delete>

    <!-- 批量插入 -->
    <insert id="batchInsert" parameterType="list">
        INSERT INTO <include refid="userTable"/>
        (username, email, password, status, created_at, updated_at)
        VALUES
        <foreach collection="list" item="user" separator=",">
            (#{user.username}, #{user.email}, #{user.password},
             #{user.status}, NOW(), NOW())
        </foreach>
    </insert>

    <!-- 批量删除 -->
    <delete id="batchDelete" parameterType="list">
        DELETE FROM <include refid="userTable"/>
        WHERE id IN
        <foreach collection="list" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
    </delete>

</mapper>
```

### 注解配置

MyBatis 也支持使用注解直接在接口上定义 SQL：

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

    // 使用 Provider 动态生成 SQL
    @SelectProvider(type = UserSqlProvider.class, method = "selectByCondition")
    List<User> selectByCondition(@Param("name") String name, @Param("email") String email);
}

// SQL Provider 类
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

### 动态 SQL

MyBatis 提供了强大的动态 SQL 功能：

#### if 标签

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

#### choose-when-otherwise 标签

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

#### where 标签

自动处理 WHERE 和多余的 AND/OR：

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

#### set 标签

自动处理 SET 和多余的逗号：

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

#### foreach 标签

```xml
<!-- IN 查询 -->
<select id="selectByIds" resultMap="userResultMap">
    SELECT * FROM users
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- 批量更新 -->
<update id="batchUpdateStatus">
    UPDATE users
    SET status = #{status}, updated_at = NOW()
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</update>

<!-- 多条件 OR 查询 -->
<select id="selectByMultipleConditions" resultMap="userResultMap">
    SELECT * FROM users
    <where>
        <foreach collection="conditions" item="cond" separator="OR">
            (username = #{cond.name} AND email = #{cond.email})
        </foreach>
    </where>
</select>
```

#### trim 标签

更灵活的空白和前缀后缀处理：

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

#### bind 标签

创建变量绑定到上下文：

```xml
<select id="selectByName" resultMap="userResultMap">
    <bind name="pattern" value="'%' + name + '%'"/>
    SELECT * FROM users
    WHERE username LIKE #{pattern}
</select>
```

### 结果映射

#### 基本映射

```xml
<resultMap id="userResultMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="user_name"/>
    <result property="email" column="email_address"/>
    <result property="createdAt" column="created_at" javaType="java.time.LocalDateTime"/>
</resultMap>
```

#### 一对一关联（association）

```xml
<!-- 用户与地址的一对一关系 -->
<resultMap id="userWithAddressMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <result property="email" column="email"/>

    <!-- 嵌套结果映射 -->
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

<!-- 使用嵌套查询（N+1 问题，谨慎使用） -->
<resultMap id="userWithAddressLazyMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <association property="address" column="address_id"
                 select="com.example.mapper.AddressMapper.selectById"
                 fetchType="lazy"/>
</resultMap>
```

#### 一对多关联（collection）

```xml
<!-- 用户与订单的一对多关系 -->
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

<!-- 使用嵌套查询 -->
<resultMap id="userWithOrdersLazyMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <collection property="orders" column="id"
                select="com.example.mapper.OrderMapper.selectByUserId"
                fetchType="lazy"/>
</resultMap>
```

#### 鉴别器（discriminator）

根据某列的值使用不同的映射：

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

### 缓存机制

#### 一级缓存（本地缓存）

一级缓存是 SqlSession 级别的缓存，默认开启：

```java
try (SqlSession session = sqlSessionFactory.openSession()) {
    UserMapper mapper = session.getMapper(UserMapper.class);

    // 第一次查询，从数据库获取
    User user1 = mapper.selectById(1L);

    // 第二次查询，从一级缓存获取（相同 SqlSession）
    User user2 = mapper.selectById(1L);

    System.out.println(user1 == user2);  // true

    // 执行更新操作会清空一级缓存
    mapper.update(user1);

    // 缓存已清空，重新从数据库查询
    User user3 = mapper.selectById(1L);
}
```

#### 二级缓存（全局缓存）

二级缓存是 namespace 级别的缓存，需要手动开启：

```xml
<!-- 在 mybatis-config.xml 中启用 -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- 在 Mapper XML 中配置 -->
<mapper namespace="com.example.mapper.UserMapper">

    <!-- 启用二级缓存 -->
    <cache
        eviction="LRU"
        flushInterval="60000"
        size="512"
        readOnly="true"/>

    <!-- 或使用第三方缓存 -->
    <cache type="org.mybatis.caches.redis.RedisCache"/>

    <!-- 指定语句使用或不使用缓存 -->
    <select id="selectById" resultMap="userResultMap" useCache="true">
        SELECT * FROM users WHERE id = #{id}
    </select>

    <select id="selectAll" resultMap="userResultMap" flushCache="false">
        SELECT * FROM users
    </select>

    <!-- 更新操作默认会清空缓存 -->
    <update id="update" flushCache="true">
        UPDATE users SET username = #{username} WHERE id = #{id}
    </update>

</mapper>
```

缓存配置参数说明：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| eviction | 回收策略：LRU, FIFO, SOFT, WEAK | LRU |
| flushInterval | 刷新间隔（毫秒） | 无（不定时刷新） |
| size | 最大缓存对象数 | 1024 |
| readOnly | 是否只读（true 性能更好，但不安全） | false |
| blocking | 是否阻塞（防止缓存穿透） | false |

---

## 代码示例

### 项目配置

#### Maven 依赖

```xml
<dependencies>
    <!-- MyBatis 核心 -->
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

    <!-- 数据库驱动 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- 连接池 -->
    <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
    </dependency>

    <!-- 分页插件 -->
    <dependency>
        <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper-spring-boot-starter</artifactId>
        <version>2.1.0</version>
    </dependency>
</dependencies>
```

#### MyBatis 核心配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>

    <!-- 属性配置 -->
    <properties resource="database.properties">
        <property name="default.timeout" value="30"/>
    </properties>

    <!-- 全局设置 -->
    <settings>
        <!-- 开启驼峰命名转换 -->
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <!-- 开启二级缓存 -->
        <setting name="cacheEnabled" value="true"/>
        <!-- 开启延迟加载 -->
        <setting name="lazyLoadingEnabled" value="true"/>
        <!-- 按需加载 -->
        <setting name="aggressiveLazyLoading" value="false"/>
        <!-- 日志实现 -->
        <setting name="logImpl" value="SLF4J"/>
        <!-- 允许使用生成的主键 -->
        <setting name="useGeneratedKeys" value="true"/>
        <!-- 空值时调用 setter -->
        <setting name="callSettersOnNulls" value="true"/>
        <!-- 返回空结果时返回实例而非 null -->
        <setting name="returnInstanceForEmptyRow" value="true"/>
    </settings>

    <!-- 类型别名 -->
    <typeAliases>
        <package name="com.example.entity"/>
    </typeAliases>

    <!-- 类型处理器 -->
    <typeHandlers>
        <typeHandler handler="com.example.handler.JsonTypeHandler"/>
    </typeHandlers>

    <!-- 插件配置 -->
    <plugins>
        <plugin interceptor="com.github.pagehelper.PageInterceptor">
            <property name="helperDialect" value="mysql"/>
            <property name="reasonable" value="true"/>
        </plugin>
    </plugins>

    <!-- 环境配置 -->
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

    <!-- Mapper 映射 -->
    <mappers>
        <package name="com.example.mapper"/>
    </mappers>

</configuration>
```

#### Spring Boot 配置

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
  # Mapper XML 文件位置
  mapper-locations: classpath:mapper/**/*.xml
  # 实体类包路径（用于别名）
  type-aliases-package: com.example.entity
  # 配置文件位置（可选）
  config-location: classpath:mybatis-config.xml
  configuration:
    # 开启驼峰命名转换
    map-underscore-to-camel-case: true
    # 开启二级缓存
    cache-enabled: true
    # 日志实现
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
    # 延迟加载
    lazy-loading-enabled: true
    aggressive-lazy-loading: false

# 分页插件配置
pagehelper:
  helper-dialect: mysql
  reasonable: true
  support-methods-arguments: true
  params: count=countSql

# 日志配置
logging:
  level:
    com.example.mapper: debug
```

### 完整 CRUD 示例

#### 实体类

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

    // 关联对象
    private Address address;
    private List<Order> orders;

    // 构造器
    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.status = UserStatus.ACTIVE;
    }

    // Getter 和 Setter
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

// 枚举类型
public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

#### Mapper 接口

```java
package com.example.mapper;

import com.example.entity.User;
import com.example.entity.UserStatus;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface UserMapper {

    // 查询方法
    User selectById(Long id);

    User selectByUsername(String username);

    User selectByEmail(String email);

    List<User> selectAll();

    List<User> selectByStatus(UserStatus status);

    List<User> selectByCondition(UserQueryParam param);

    // 带关联查询
    User selectWithAddress(Long id);

    User selectWithOrders(Long id);

    User selectWithAll(Long id);

    // 插入方法
    int insert(User user);

    int batchInsert(List<User> users);

    // 更新方法
    int update(User user);

    int updateSelective(User user);

    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);

    int batchUpdateStatus(@Param("ids") List<Long> ids, @Param("status") UserStatus status);

    // 删除方法
    int deleteById(Long id);

    int batchDelete(List<Long> ids);

    // 统计方法
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

    <!-- 基础结果映射 -->
    <resultMap id="BaseResultMap" type="User">
        <id property="id" column="id"/>
        <result property="username" column="username"/>
        <result property="email" column="email"/>
        <result property="password" column="password"/>
        <result property="status" column="status"/>
        <result property="createdAt" column="created_at"/>
        <result property="updatedAt" column="updated_at"/>
    </resultMap>

    <!-- 带地址的结果映射 -->
    <resultMap id="WithAddressResultMap" type="User" extends="BaseResultMap">
        <association property="address" javaType="Address">
            <id property="id" column="address_id"/>
            <result property="city" column="city"/>
            <result property="street" column="street"/>
            <result property="zipCode" column="zip_code"/>
        </association>
    </resultMap>

    <!-- 带订单的结果映射 -->
    <resultMap id="WithOrdersResultMap" type="User" extends="BaseResultMap">
        <collection property="orders" ofType="Order">
            <id property="id" column="order_id"/>
            <result property="orderNumber" column="order_number"/>
            <result property="totalAmount" column="total_amount"/>
            <result property="status" column="order_status"/>
            <result property="createdAt" column="order_created_at"/>
        </collection>
    </resultMap>

    <!-- 完整结果映射 -->
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

    <!-- SQL 片段 -->
    <sql id="Base_Column_List">
        id, username, email, password, status, created_at, updated_at
    </sql>

    <!-- ========== 查询方法 ========== -->

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

    <!-- 动态条件查询 -->
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

    <!-- 关联查询 -->
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

    <!-- ========== 插入方法 ========== -->

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

    <!-- ========== 更新方法 ========== -->

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

    <!-- ========== 删除方法 ========== -->

    <delete id="deleteById">
        DELETE FROM users WHERE id = #{id}
    </delete>

    <delete id="batchDelete" parameterType="list">
        DELETE FROM users WHERE id IN
        <foreach collection="list" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
    </delete>

    <!-- ========== 统计方法 ========== -->

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

#### Service 层

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

    // 查询方法
    public User findById(Long id) {
        return userMapper.selectById(id);
    }

    public User findByUsername(String username) {
        return userMapper.selectByUsername(username);
    }

    public List<User> findAll() {
        return userMapper.selectAll();
    }

    // 分页查询
    public PageInfo<User> findByPage(int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<User> users = userMapper.selectAll();
        return new PageInfo<>(users);
    }

    // 条件分页查询
    public PageInfo<User> findByCondition(UserQueryParam param, int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<User> users = userMapper.selectByCondition(param);
        return new PageInfo<>(users);
    }

    // 查询带关联数据
    public User findWithOrders(Long id) {
        return userMapper.selectWithOrders(id);
    }

    // 创建用户
    @Transactional
    public User create(User user) {
        // 检查邮箱是否已存在
        if (userMapper.existsByEmail(user.getEmail())) {
            throw new BusinessException("邮箱已被使用");
        }

        user.setStatus(UserStatus.ACTIVE);
        userMapper.insert(user);
        return user;
    }

    // 批量创建
    @Transactional
    public int batchCreate(List<User> users) {
        return userMapper.batchInsert(users);
    }

    // 更新用户
    @Transactional
    public User update(User user) {
        User existing = userMapper.selectById(user.getId());
        if (existing == null) {
            throw new ResourceNotFoundException("用户不存在");
        }

        userMapper.updateSelective(user);
        return userMapper.selectById(user.getId());
    }

    // 更新状态
    @Transactional
    public void updateStatus(Long id, UserStatus status) {
        userMapper.updateStatus(id, status);
    }

    // 批量更新状态
    @Transactional
    public void batchUpdateStatus(List<Long> ids, UserStatus status) {
        userMapper.batchUpdateStatus(ids, status);
    }

    // 删除用户
    @Transactional
    public void delete(Long id) {
        if (userMapper.selectById(id) == null) {
            throw new ResourceNotFoundException("用户不存在");
        }
        userMapper.deleteById(id);
    }

    // 批量删除
    @Transactional
    public void batchDelete(List<Long> ids) {
        userMapper.batchDelete(ids);
    }

    // 统计
    public long count() {
        return userMapper.count();
    }
}
```

### 自定义类型处理器

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

// JSON 类型处理器
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
            throw new SQLException("JSON 序列化失败", e);
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
            throw new SQLException("JSON 反序列化失败", e);
        }
    }
}

// 枚举类型处理器
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

### 自定义插件

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

// SQL 执行时间统计插件
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class SqlExecutionTimePlugin implements Interceptor {

    private static final Logger log = LoggerFactory.getLogger(SqlExecutionTimePlugin.class);

    private long slowSqlThreshold = 1000; // 慢 SQL 阈值（毫秒）

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
                log.warn("慢 SQL 检测 - ID: {}, 执行时间: {}ms", sqlId, executionTime);
            } else {
                log.debug("SQL 执行 - ID: {}, 执行时间: {}ms", sqlId, executionTime);
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

// 数据权限插件
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class DataPermissionPlugin implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];

        // 检查是否需要数据权限控制
        if (needsDataPermission(ms)) {
            // 获取当前用户的数据权限
            String dataPermission = getCurrentUserDataPermission();

            // 修改 SQL 添加数据权限条件
            // ...
        }

        return invocation.proceed();
    }

    private boolean needsDataPermission(MappedStatement ms) {
        // 根据 SQL ID 或注解判断是否需要数据权限控制
        return ms.getId().contains("selectBy");
    }

    private String getCurrentUserDataPermission() {
        // 从上下文获取当前用户的数据权限
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

## 最佳实践

### 项目结构

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

### 命名规范

1. **Mapper 接口**：以 `Mapper` 结尾，如 `UserMapper`
2. **Mapper XML**：与接口同名，如 `UserMapper.xml`
3. **namespace**：使用 Mapper 接口的全限定名
4. **方法名**：
   - 查询：`selectById`, `selectByXxx`, `selectAll`
   - 插入：`insert`, `batchInsert`
   - 更新：`update`, `updateSelective`, `updateXxx`
   - 删除：`deleteById`, `batchDelete`
   - 统计：`count`, `countByXxx`, `existsByXxx`

### SQL 编写规范

```xml
<!-- 1. 使用 SQL 片段复用 -->
<sql id="Base_Column_List">
    id, username, email, status, created_at, updated_at
</sql>

<!-- 2. 避免 SELECT * -->
<select id="selectById" resultMap="BaseResultMap">
    SELECT <include refid="Base_Column_List"/>
    FROM users WHERE id = #{id}
</select>

<!-- 3. 使用参数化查询，防止 SQL 注入 -->
<!-- 正确：使用 #{} -->
<select id="selectByUsername" resultMap="BaseResultMap">
    SELECT * FROM users WHERE username = #{username}
</select>

<!-- 错误：使用 ${} 存在 SQL 注入风险 -->
<!-- <select id="selectByUsername">
    SELECT * FROM users WHERE username = '${username}'
</select> -->

<!-- 4. 排序时使用 ${} 但需要校验 -->
<select id="selectWithOrder" resultMap="BaseResultMap">
    SELECT * FROM users
    <if test="orderBy != null and orderBy.matches('^[a-zA-Z_]+$')">
        ORDER BY ${orderBy}
    </if>
</select>

<!-- 5. 使用 LIMIT 限制返回数量 -->
<select id="selectTop10" resultMap="BaseResultMap">
    SELECT * FROM users ORDER BY created_at DESC LIMIT 10
</select>
```

### 事务管理

```java
@Service
public class OrderService {

    private final OrderMapper orderMapper;
    private final UserMapper userMapper;
    private final ProductMapper productMapper;

    // 构造器注入

    // 使用声明式事务
    @Transactional(rollbackFor = Exception.class)
    public Order createOrder(CreateOrderRequest request) {
        // 1. 验证用户
        User user = userMapper.selectById(request.getUserId());
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 验证商品并计算总价
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItemRequest item : request.getItems()) {
            Product product = productMapper.selectById(item.getProductId());
            if (product == null || product.getStock() < item.getQuantity()) {
                throw new BusinessException("商品不存在或库存不足");
            }
            totalAmount = totalAmount.add(
                product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
            );
        }

        // 3. 创建订单
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setOrderNumber(generateOrderNumber());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING);
        orderMapper.insert(order);

        // 4. 创建订单项并扣减库存
        for (OrderItemRequest item : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(order.getId());
            orderItem.setProductId(item.getProductId());
            orderItem.setQuantity(item.getQuantity());
            orderItemMapper.insert(orderItem);

            // 扣减库存
            productMapper.decreaseStock(item.getProductId(), item.getQuantity());
        }

        return order;
    }

    // 编程式事务
    @Autowired
    private TransactionTemplate transactionTemplate;

    public Order createOrderProgrammatic(CreateOrderRequest request) {
        return transactionTemplate.execute(status -> {
            try {
                // 业务逻辑
                return createOrderInternal(request);
            } catch (Exception e) {
                status.setRollbackOnly();
                throw e;
            }
        });
    }
}
```

### 分页处理

```java
// 使用 PageHelper 插件
@Service
public class UserService {

    public PageInfo<User> findByPage(int pageNum, int pageSize) {
        // 在查询前调用 PageHelper.startPage
        PageHelper.startPage(pageNum, pageSize);

        // 紧跟着的第一个查询会被分页
        List<User> users = userMapper.selectAll();

        // 使用 PageInfo 包装结果
        return new PageInfo<>(users);
    }

    public PageInfo<User> findByConditionWithPage(UserQueryParam param,
                                                   int pageNum, int pageSize) {
        // 设置分页和排序
        PageHelper.startPage(pageNum, pageSize, "created_at desc");
        List<User> users = userMapper.selectByCondition(param);
        return new PageInfo<>(users);
    }

    // 使用 RowBounds（不推荐，需要全表扫描）
    public List<User> findByRowBounds(int offset, int limit) {
        return userMapper.selectAllWithRowBounds(new RowBounds(offset, limit));
    }

    // 手动分页（推荐复杂查询使用）
    public List<User> findByManualPage(int offset, int limit) {
        return userMapper.selectByPage(offset, limit);
    }
}

// PageInfo 常用属性
// pageInfo.getTotal()      - 总记录数
// pageInfo.getPages()      - 总页数
// pageInfo.getPageNum()    - 当前页码
// pageInfo.getPageSize()   - 每页大小
// pageInfo.getList()       - 结果列表
// pageInfo.isHasNextPage() - 是否有下一页
// pageInfo.isHasPreviousPage() - 是否有上一页
```

---

## 常见陷阱

### N+1 查询问题

```xml
<!-- 问题：嵌套查询导致 N+1 问题 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <!-- 这会为每个用户执行一次额外查询 -->
    <collection property="orders" column="id"
                select="com.example.mapper.OrderMapper.selectByUserId"/>
</resultMap>

<select id="selectAll" resultMap="userWithOrdersMap">
    SELECT * FROM users  <!-- 查询 N 个用户 -->
</select>
<!-- 结果：1 + N 次查询 -->

<!-- 解决方案1：使用 JOIN 查询 -->
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

<!-- 解决方案2：批量查询 + 手动组装 -->
```

```java
// 解决方案3：在代码中批量查询
public List<User> findAllWithOrders() {
    List<User> users = userMapper.selectAll();

    if (!users.isEmpty()) {
        List<Long> userIds = users.stream()
            .map(User::getId)
            .collect(Collectors.toList());

        // 一次查询所有订单
        List<Order> allOrders = orderMapper.selectByUserIds(userIds);

        // 按用户 ID 分组
        Map<Long, List<Order>> ordersByUser = allOrders.stream()
            .collect(Collectors.groupingBy(Order::getUserId));

        // 组装数据
        users.forEach(user ->
            user.setOrders(ordersByUser.getOrDefault(user.getId(), Collections.emptyList()))
        );
    }

    return users;
}
```

### #{} 与 ${} 的区别

```xml
<!-- #{} - 预编译参数，防止 SQL 注入（推荐） -->
<select id="selectByUsername" resultType="User">
    SELECT * FROM users WHERE username = #{username}
</select>
<!-- 生成：SELECT * FROM users WHERE username = ? -->

<!-- ${} - 字符串替换，存在 SQL 注入风险 -->
<select id="selectByColumn" resultType="User">
    SELECT * FROM users WHERE ${column} = #{value}
</select>
<!-- 生成：SELECT * FROM users WHERE username = ? -->

<!-- ${} 的正确使用场景 -->
<!-- 1. 动态表名 -->
<select id="selectFromTable" resultType="map">
    SELECT * FROM ${tableName} WHERE id = #{id}
</select>

<!-- 2. 动态列名（需要白名单校验） -->
<select id="selectWithOrder" resultType="User">
    SELECT * FROM users
    <if test="orderColumn != null">
        ORDER BY ${orderColumn}
    </if>
</select>

<!-- 安全使用 ${} 的方式 -->
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

### 一级缓存陷阱

```java
// 问题：不同 SqlSession 之间的缓存不共享
public void cacheIssue() {
    try (SqlSession session1 = sqlSessionFactory.openSession();
         SqlSession session2 = sqlSessionFactory.openSession()) {

        UserMapper mapper1 = session1.getMapper(UserMapper.class);
        UserMapper mapper2 = session2.getMapper(UserMapper.class);

        // 第一次查询
        User user1 = mapper1.selectById(1L);

        // 在 session2 中更新
        User updateUser = new User();
        updateUser.setId(1L);
        updateUser.setUsername("newName");
        mapper2.update(updateUser);
        session2.commit();

        // session1 的缓存没有失效，读取到旧数据
        User user2 = mapper1.selectById(1L); // 还是旧数据！
    }
}

// 解决方案1：关闭一级缓存
// mybatis-config.xml 中设置
// <setting name="localCacheScope" value="STATEMENT"/>

// 解决方案2：手动清空缓存
public void clearCacheSolution() {
    try (SqlSession session = sqlSessionFactory.openSession()) {
        UserMapper mapper = session.getMapper(UserMapper.class);

        User user1 = mapper.selectById(1L);

        // 清空一级缓存
        session.clearCache();

        User user2 = mapper.selectById(1L); // 重新查询
    }
}

// 解决方案3：在 Spring 中使用（每个方法一个 SqlSession）
@Service
@Transactional
public class UserService {
    // Spring 管理的 SqlSession 在方法结束后关闭，不会有缓存问题
}
```

### 批量操作的数据量限制

```xml
<!-- 问题：一次性批量插入大量数据 -->
<insert id="batchInsert">
    INSERT INTO users (username, email) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.username}, #{user.email})
    </foreach>
</insert>
<!-- 如果 list 有 10000 条，SQL 会非常长 -->
```

```java
// 解决方案：分批处理
@Service
public class UserService {

    private static final int BATCH_SIZE = 500;

    @Transactional
    public void batchInsert(List<User> users) {
        // 分批插入
        Lists.partition(users, BATCH_SIZE).forEach(batch -> {
            userMapper.batchInsert(batch);
        });
    }

    // 或使用 MyBatis 的 batch 模式
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

### 懒加载失效

```java
// 问题：在 SqlSession 关闭后访问懒加载属性
public User getUserWithOrders(Long id) {
    User user;
    try (SqlSession session = sqlSessionFactory.openSession()) {
        UserMapper mapper = session.getMapper(UserMapper.class);
        user = mapper.selectById(id);
    }
    // SqlSession 已关闭

    // 这里访问懒加载的 orders 会报错
    List<Order> orders = user.getOrders(); // LazyLoadingException!

    return user;
}

// 解决方案1：在 SqlSession 内访问
public User getUserWithOrders(Long id) {
    try (SqlSession session = sqlSessionFactory.openSession()) {
        UserMapper mapper = session.getMapper(UserMapper.class);
        User user = mapper.selectById(id);

        // 在 SqlSession 关闭前触发懒加载
        user.getOrders().size();

        return user;
    }
}

// 解决方案2：使用 eager loading
<resultMap id="eagerLoadMap" type="User">
    <collection property="orders" fetchType="eager" .../>
</resultMap>

// 解决方案3：使用 Spring 管理的事务
@Service
public class UserService {

    @Transactional(readOnly = true)
    public User getUserWithOrders(Long id) {
        User user = userMapper.selectById(id);
        // 在事务内可以安全访问懒加载属性
        user.getOrders().size();
        return user;
    }
}
```

### 类型转换问题

```xml
<!-- 问题：枚举类型处理 -->
<insert id="insert">
    INSERT INTO users (status) VALUES (#{status})
</insert>
<!-- 默认会使用枚举的 ordinal，如果枚举顺序变了会出问题 -->

<!-- 解决方案：使用枚举名称 -->
<insert id="insert">
    INSERT INTO users (status) VALUES (#{status,typeHandler=org.apache.ibatis.type.EnumTypeHandler})
</insert>

<!-- 或在全局配置 -->
<typeHandlers>
    <typeHandler handler="org.apache.ibatis.type.EnumTypeHandler"
                 javaType="com.example.entity.UserStatus"/>
</typeHandlers>
```

---

## 性能考量

### SQL 优化

```xml
<!-- 避免全表扫描 -->
<select id="selectByEmail" resultMap="BaseResultMap">
    SELECT * FROM users WHERE email = #{email}
    <!-- 确保 email 列有索引 -->
</select>

<!-- 使用覆盖索引 -->
<select id="selectUsernameById" resultType="string">
    SELECT username FROM users WHERE id = #{id}
    <!-- 如果有 (id, username) 的联合索引，这是覆盖索引查询 -->
</select>

<!-- 避免使用函数导致索引失效 -->
<!-- 错误 -->
<select id="selectByDate">
    SELECT * FROM users WHERE DATE(created_at) = #{date}
</select>
<!-- 正确 -->
<select id="selectByDate">
    SELECT * FROM users
    WHERE created_at >= #{startDate} AND created_at &lt; #{endDate}
</select>

<!-- 分页优化：使用主键范围查询代替 OFFSET -->
<!-- 传统分页（慢） -->
<select id="selectByPage">
    SELECT * FROM users ORDER BY id LIMIT #{offset}, #{limit}
</select>

<!-- 优化分页（快） -->
<select id="selectByPageOptimized">
    SELECT * FROM users WHERE id > #{lastId} ORDER BY id LIMIT #{limit}
</select>
```

### 批量操作优化

```java
// 使用 BATCH 执行器
public void batchUpdate(List<User> users) {
    try (SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH, false)) {
        UserMapper mapper = session.getMapper(UserMapper.class);

        int batchSize = 1000;
        for (int i = 0; i < users.size(); i++) {
            mapper.update(users.get(i));

            if ((i + 1) % batchSize == 0) {
                session.flushStatements();
                session.clearCache(); // 清理一级缓存
            }
        }

        session.flushStatements();
        session.commit();
    }
}

// MySQL 批量插入优化
// jdbc url 添加参数：rewriteBatchedStatements=true
// spring.datasource.url=jdbc:mysql://localhost:3306/db?rewriteBatchedStatements=true
```

### 缓存策略

```xml
<!-- 合理使用二级缓存 -->
<mapper namespace="com.example.mapper.UserMapper">

    <!-- 配置二级缓存 -->
    <cache
        eviction="LRU"
        flushInterval="300000"
        size="1024"
        readOnly="true"/>

    <!-- 频繁变化的查询禁用缓存 -->
    <select id="selectActiveUsers" resultMap="BaseResultMap" useCache="false">
        SELECT * FROM users WHERE status = 'ACTIVE'
    </select>

    <!-- 不变的数据使用缓存 -->
    <select id="selectById" resultMap="BaseResultMap" useCache="true">
        SELECT * FROM users WHERE id = #{id}
    </select>

</mapper>
```

```java
// 使用 Redis 作为二级缓存
// 1. 添加依赖
// mybatis-redis

// 2. 配置缓存
@CacheNamespace(implementation = RedisCache.class)
public interface UserMapper {
    // ...
}

// 3. 配置 Redis
// redis.properties
redis.host=localhost
redis.port=6379
redis.database=0
redis.timeout=2000
```

### 连接池优化

```yaml
spring:
  datasource:
    hikari:
      # 最大连接数
      maximum-pool-size: 20
      # 最小空闲连接
      minimum-idle: 5
      # 空闲超时时间
      idle-timeout: 300000
      # 连接超时时间
      connection-timeout: 20000
      # 连接最大生命周期
      max-lifetime: 1800000
      # 连接测试查询
      connection-test-query: SELECT 1
      # 泄漏检测阈值
      leak-detection-threshold: 60000
```

### 查询结果优化

```xml
<!-- 使用投影减少数据传输 -->
<select id="selectUsernames" resultType="string">
    SELECT username FROM users WHERE status = 'ACTIVE'
</select>

<!-- 使用 DTO 投影 -->
<select id="selectUserSummary" resultType="UserSummaryDTO">
    SELECT id, username, email FROM users WHERE id = #{id}
</select>

<!-- 避免查询不需要的列 -->
<!-- 不推荐 -->
<select id="selectAll" resultType="User">
    SELECT * FROM users
</select>

<!-- 推荐 -->
<select id="selectAll" resultType="User">
    SELECT id, username, email, status, created_at, updated_at FROM users
</select>
```

---

## 实战场景

### 多租户数据隔离

```java
// 多租户拦截器
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

        // 获取当前租户 ID
        String tenantId = TenantContextHolder.getTenantId();

        // 跳过不需要租户隔离的查询
        if (shouldSkipTenant(ms)) {
            return invocation.proceed();
        }

        // 获取原始 SQL
        BoundSql boundSql = ms.getBoundSql(parameter);
        String originalSql = boundSql.getSql();

        // 添加租户条件
        String newSql = addTenantCondition(originalSql, tenantId);

        // 创建新的 BoundSql
        BoundSql newBoundSql = new BoundSql(
            ms.getConfiguration(), newSql,
            boundSql.getParameterMappings(), parameter
        );

        // 创建新的 MappedStatement
        MappedStatement newMs = newMappedStatement(ms, new BoundSqlSqlSource(newBoundSql));
        invocation.getArgs()[0] = newMs;

        return invocation.proceed();
    }

    private String addTenantCondition(String sql, String tenantId) {
        // 简单实现：在 WHERE 后添加租户条件
        if (sql.toLowerCase().contains("where")) {
            return sql.replaceFirst("(?i)where",
                "WHERE tenant_id = '" + tenantId + "' AND ");
        } else {
            return sql + " WHERE tenant_id = '" + tenantId + "'";
        }
    }
}
```

### 审计日志

```java
// 审计字段自动填充
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
            // 字段不存在则跳过
        }
    }
}
```

### 软删除支持

```xml
<!-- 软删除 Mapper -->
<mapper namespace="com.example.mapper.UserMapper">

    <!-- 查询时自动过滤已删除记录 -->
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

    <!-- 软删除 -->
    <update id="softDelete">
        UPDATE users
        SET deleted = 1, deleted_at = NOW(), deleted_by = #{deletedBy}
        WHERE id = #{id} AND deleted = 0
    </update>

    <!-- 恢复 -->
    <update id="restore">
        UPDATE users
        SET deleted = 0, deleted_at = NULL, deleted_by = NULL
        WHERE id = #{id} AND deleted = 1
    </update>

    <!-- 真正删除（仅管理员使用） -->
    <delete id="hardDelete">
        DELETE FROM users WHERE id = #{id}
    </delete>

</mapper>
```

### 复杂报表查询

```xml
<!-- 销售报表查询 -->
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

## 面试要点

### 基础问题

**Q1: MyBatis 中 #{} 和 ${} 的区别是什么？**

- `#{}`：预编译参数，会被替换为 `?`，然后通过 PreparedStatement 设置参数值，可以防止 SQL 注入
- `${}`：字符串替换，直接将参数值拼接到 SQL 中，存在 SQL 注入风险，适用于动态表名、列名等场景

**Q2: MyBatis 的一级缓存和二级缓存有什么区别？**

| 特性 | 一级缓存 | 二级缓存 |
|------|----------|----------|
| 作用范围 | SqlSession | namespace（Mapper） |
| 默认状态 | 开启 | 关闭 |
| 生命周期 | SqlSession 生命周期 | 应用生命周期 |
| 清空时机 | 执行更新操作或手动清空 | 配置的刷新间隔或执行更新 |
| 数据共享 | 不共享 | 同一 namespace 共享 |

**Q3: MyBatis 如何实现分页？**

1. **RowBounds**：内存分页，不推荐大数据量使用
2. **PageHelper 插件**：通过拦截器修改 SQL，推荐使用
3. **手动 SQL**：在 SQL 中直接写 LIMIT 和 OFFSET
4. **使用数据库方言**：不同数据库使用不同分页语法

### 进阶问题

**Q4: 简述 MyBatis 的工作原理**

1. 加载配置文件（mybatis-config.xml 和 Mapper.xml）
2. 解析配置创建 Configuration 对象
3. 创建 SqlSessionFactory
4. 通过 SqlSessionFactory 获取 SqlSession
5. SqlSession 通过 Executor 执行 SQL
6. MappedStatement 封装了 SQL 语句和映射信息
7. 通过 TypeHandler 处理参数和结果的类型转换
8. 返回结果

**Q5: MyBatis 如何防止 SQL 注入？**

1. 使用 `#{}` 预编译参数，不要使用 `${}`
2. 对于必须使用 `${}` 的场景（如动态列名），使用白名单校验
3. 使用 MyBatis 提供的动态 SQL 标签构建安全的 SQL
4. 对用户输入进行验证和过滤

**Q6: MyBatis 的延迟加载是如何实现的？**

1. 使用 CGLIB 或 Javassist 创建代理对象
2. 当访问延迟加载属性时，代理对象拦截调用
3. 代理对象执行关联查询获取数据
4. 将数据填充到目标对象并返回

### 实战问题

**Q7: 如何优化 MyBatis 的批量操作性能？**

1. 使用 `ExecutorType.BATCH` 执行器
2. 合理设置批次大小（如 500-1000）
3. 开启 `rewriteBatchedStatements=true`
4. 使用 `<foreach>` 构建多值 INSERT
5. 定期 flush 并清理一级缓存

**Q8: MyBatis 如何处理 N+1 查询问题？**

1. 使用 JOIN 查询一次获取所有数据
2. 使用批量查询替代循环查询
3. 合理使用懒加载并配合 `fetchType="lazy"`
4. 使用 `fetchType="eager"` 在需要时立即加载

---

## 延伸阅读

### 官方资源

- [MyBatis 官方文档](https://mybatis.org/mybatis-3/zh/index.html)
- [MyBatis-Spring 文档](https://mybatis.org/spring/zh/index.html)
- [MyBatis-Spring-Boot-Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
- [MyBatis GitHub](https://github.com/mybatis/mybatis-3)

### 插件和工具

- [PageHelper 分页插件](https://github.com/pagehelper/Mybatis-PageHelper)
- [MyBatis-Plus](https://baomidou.com/)
- [MyBatis Generator](https://mybatis.org/generator/)
- [tk.mybatis 通用 Mapper](https://github.com/abel533/Mapper)

### 推荐书籍

- 《MyBatis 技术内幕》- 徐郡明
- 《MyBatis 从入门到精通》- 刘增辉
- 《Java 持久化实战》- 相关章节

### 相关文章

- [MyBatis 源码分析系列](https://www.cnblogs.com/dongying/tag/MyBatis/)
- [MyBatis 缓存机制详解](https://tech.meituan.com/2018/01/19/mybatis-cache.html)
- [MyBatis 动态 SQL 最佳实践](https://blog.mybatis.org/)
