---
title: Kotlin 后端开发
description: 使用Kotlin和Ktor/Spring构建后端服务
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Kotlin
  - Ktor
  - Spring Boot
  - JVM
status: imported
origin: old/src/content/docs/backend/kotlin-backend.zh.md
divergence: 0.367
issues:
  - divergent
legacy:
  category: Backend
  subcategory: Languages
  order: 27
  lastUpdated: 2026-01-07
---

## 概念解释

Kotlin 是由 JetBrains 开发的现代化静态类型编程语言，运行在 JVM 上并完全兼容 Java。自从 Google 宣布 Kotlin 为 Android 开发的首选语言后，Kotlin 在后端开发领域也获得了广泛关注。它结合了面向对象和函数式编程的特性，以简洁、安全、实用为设计理念。

### 为什么选择 Kotlin 做后端开发？

Kotlin 在后端开发中的优势体现在多个方面。它不仅继承了 Java 生态系统的所有优点，还通过现代语言特性大大提升了开发效率和代码质量。

Kotlin 后端开发的核心优势包括：

- **空安全**：类型系统级别的空指针检查，从根本上解决 NullPointerException 问题
- **简洁语法**：相比 Java 减少约 40% 的样板代码
- **协程支持**：轻量级并发编程，简化异步代码编写
- **完全互操作**：与 Java 无缝互操作，可直接使用所有 Java 库
- **数据类**：一行代码定义 POJO，自动生成 equals、hashCode、toString
- **扩展函数**：为现有类添加功能而无需继承
- **高阶函数**：函数式编程支持，代码更加声明式
- **智能类型推断**：减少类型声明，代码更加简洁

## Kotlin 语言优势

### 空安全类型系统

Kotlin 的空安全是其最重要的特性之一，在编译期就能发现潜在的空指针问题：

```kotlin
// 非空类型 - 不能赋值为 null
var name: String = "Kotlin"
// name = null  // 编译错误！

// 可空类型 - 使用 ? 标记
var nullableName: String? = "Kotlin"
nullableName = null  // 合法

// 安全调用操作符 ?.
val length: Int? = nullableName?.length  // 如果为 null 返回 null

// Elvis 操作符 ?: 提供默认值
val safeLength: Int = nullableName?.length ?: 0

// 非空断言 !! （谨慎使用）
val forcedLength: Int = nullableName!!.length  // 如果为 null 抛出 NPE

// 安全类型转换
val str: Any = "Hello"
val safeStr: String? = str as? String  // 转换失败返回 null

// let 配合安全调用进行非空处理
nullableName?.let {
    println("Name is $it with length ${it.length}")
}

// 多层安全调用链
data class Address(val city: String?)
data class User(val name: String, val address: Address?)

fun getUserCity(user: User?): String {
    return user?.address?.city ?: "Unknown"
}
```

### 简洁的类定义

Kotlin 大大简化了类的定义方式：

```kotlin
// Java 风格的类需要大量样板代码
// Kotlin 的 data class 自动生成 equals, hashCode, toString, copy, componentN

data class User(
    val id: Long,
    val username: String,
    val email: String,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val isActive: Boolean = true
)

// 使用
val user = User(1, "john", "john@example.com")
println(user)  // User(id=1, username=john, email=john@example.com, ...)

// copy 方法创建修改后的副本
val updatedUser = user.copy(email = "newemail@example.com")

// 解构声明
val (id, username, email) = user

// 密封类 - 表示受限的类层次结构
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Exception? = null) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

// 使用 when 表达式处理密封类（编译器保证穷尽性）
fun <T> handleResult(result: Result<T>): String = when (result) {
    is Result.Success -> "成功: ${result.data}"
    is Result.Error -> "错误: ${result.message}"
    is Result.Loading -> "加载中..."
    // 不需要 else 分支，编译器知道所有情况都已覆盖
}

// 单例对象
object DatabaseConfig {
    val url: String = "jdbc:postgresql://localhost:5432/mydb"
    val username: String = "admin"

    fun getConnection(): Connection {
        // 获取数据库连接
        return DriverManager.getConnection(url, username, "password")
    }
}

// 伴生对象 - 类似 Java 静态成员
class User private constructor(val name: String) {
    companion object Factory {
        fun create(name: String): User {
            return User(name.trim().lowercase())
        }

        const val MAX_NAME_LENGTH = 50
    }
}

val user = User.create("John")
println(User.MAX_NAME_LENGTH)
```

### 扩展函数与高阶函数

```kotlin
// 扩展函数 - 为现有类添加功能
fun String.toSlug(): String {
    return this.lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .replace(Regex("\\s+"), "-")
        .trim('-')
}

println("Hello World!".toSlug())  // hello-world

// 为可空类型添加扩展
fun String?.orEmpty(): String = this ?: ""

// 高阶函数 - 函数作为参数或返回值
fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}

val numbers = listOf(1, 2, 3, 4, 5)
val evenNumbers = numbers.customFilter { it % 2 == 0 }  // [2, 4]

// 内联函数 - 避免 lambda 的运行时开销
inline fun <T> measureTime(block: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = block()
    val time = System.currentTimeMillis() - start
    return result to time
}

val (result, duration) = measureTime {
    // 耗时操作
    Thread.sleep(100)
    "完成"
}
println("结果: $result, 耗时: ${duration}ms")

// 带接收者的函数类型 - DSL 构建基础
class HtmlBuilder {
    private val elements = mutableListOf<String>()

    fun div(content: String) {
        elements.add("<div>$content</div>")
    }

    fun p(content: String) {
        elements.add("<p>$content</p>")
    }

    fun build(): String = elements.joinToString("\n")
}

fun html(block: HtmlBuilder.() -> Unit): String {
    val builder = HtmlBuilder()
    builder.block()
    return builder.build()
}

val htmlContent = html {
    div("标题")
    p("这是段落内容")
}
```

### 集合操作

```kotlin
// Kotlin 集合 API 非常强大
data class Product(
    val id: Long,
    val name: String,
    val price: Double,
    val category: String,
    val inStock: Boolean
)

val products = listOf(
    Product(1, "iPhone", 999.0, "Electronics", true),
    Product(2, "MacBook", 1999.0, "Electronics", true),
    Product(3, "T-Shirt", 29.99, "Clothing", false),
    Product(4, "Headphones", 199.0, "Electronics", true),
    Product(5, "Jeans", 79.99, "Clothing", true)
)

// 链式操作
val result = products
    .filter { it.inStock }                          // 过滤有库存的商品
    .filter { it.category == "Electronics" }        // 只要电子产品
    .sortedByDescending { it.price }                // 按价格降序
    .take(2)                                        // 取前2个
    .map { "${it.name}: $${it.price}" }            // 转换格式

println(result)  // [MacBook: $1999.0, iPhone: $999.0]

// 分组
val byCategory = products.groupBy { it.category }
// {Electronics=[...], Clothing=[...]}

// 聚合操作
val totalValue = products.filter { it.inStock }.sumOf { it.price }
val averagePrice = products.map { it.price }.average()
val mostExpensive = products.maxByOrNull { it.price }

// 关联操作
val productMap = products.associateBy { it.id }  // Map<Long, Product>
val priceMap = products.associate { it.name to it.price }  // Map<String, Double>

// 分区
val (inStock, outOfStock) = products.partition { it.inStock }

// 序列 - 惰性求值，适合大数据集
val lazyResult = products.asSequence()
    .filter { it.inStock }
    .map { it.name.uppercase() }
    .take(3)
    .toList()

// 自定义聚合
val categoryStats = products.groupBy { it.category }
    .mapValues { (_, items) ->
        mapOf(
            "count" to items.size,
            "totalPrice" to items.sumOf { it.price },
            "avgPrice" to items.map { it.price }.average()
        )
    }
```

## Ktor 框架

### Ktor 简介与项目搭建

Ktor 是 JetBrains 开发的 Kotlin 原生异步 Web 框架，专为协程设计：

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.21"
    kotlin("plugin.serialization") version "1.9.21"
    id("io.ktor.plugin") version "2.3.7"
}

dependencies {
    // Ktor 核心
    implementation("io.ktor:ktor-server-core-jvm")
    implementation("io.ktor:ktor-server-netty-jvm")

    // 内容协商与序列化
    implementation("io.ktor:ktor-server-content-negotiation-jvm")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm")

    // 认证
    implementation("io.ktor:ktor-server-auth-jvm")
    implementation("io.ktor:ktor-server-auth-jwt-jvm")

    // 其他功能
    implementation("io.ktor:ktor-server-status-pages-jvm")
    implementation("io.ktor:ktor-server-call-logging-jvm")
    implementation("io.ktor:ktor-server-cors-jvm")

    // 数据库
    implementation("org.jetbrains.exposed:exposed-core:0.45.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.45.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.45.0")
    implementation("com.zaxxer:HikariCP:5.1.0")
    implementation("org.postgresql:postgresql:42.7.1")

    // 测试
    testImplementation("io.ktor:ktor-server-tests-jvm")
    testImplementation("io.ktor:ktor-client-content-negotiation-jvm")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit")
}

application {
    mainClass.set("com.example.ApplicationKt")
}
```

### 应用程序结构

```kotlin
// src/main/kotlin/com/example/Application.kt
package com.example

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import com.example.plugins.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configurePlugins()
        configureRouting()
    }.start(wait = true)
}

// 也可以使用配置文件方式
// application.conf (HOCON 格式)
/*
ktor {
    deployment {
        port = 8080
        port = ${?PORT}
    }
    application {
        modules = [ com.example.ApplicationKt.module ]
    }
}
*/

fun Application.module() {
    configurePlugins()
    configureRouting()
}
```

```kotlin
// src/main/kotlin/com/example/plugins/Plugins.kt
package com.example.plugins

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.http.*
import io.ktor.server.response.*
import kotlinx.serialization.json.Json
import org.slf4j.event.Level

fun Application.configurePlugins() {
    // JSON 序列化配置
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            encodeDefaults = true
        })
    }

    // 请求日志
    install(CallLogging) {
        level = Level.INFO
        filter { call -> call.request.path().startsWith("/api") }
        format { call ->
            val status = call.response.status()
            val httpMethod = call.request.httpMethod.value
            val path = call.request.path()
            "$httpMethod $path -> $status"
        }
    }

    // CORS 配置
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        anyHost()  // 生产环境应该限制具体域名
    }

    // 异常处理
    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(cause.message ?: "Bad Request"))
        }
        exception<NotFoundException> { call, cause ->
            call.respond(HttpStatusCode.NotFound, ErrorResponse(cause.message ?: "Not Found"))
        }
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled error", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse("Internal Server Error")
            )
        }
    }
}

@kotlinx.serialization.Serializable
data class ErrorResponse(val message: String)

class NotFoundException(message: String) : Exception(message)
```

### 路由定义

```kotlin
// src/main/kotlin/com/example/plugins/Routing.kt
package com.example.plugins

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.http.*
import com.example.routes.*

fun Application.configureRouting() {
    routing {
        // 根路由
        get("/") {
            call.respondText("Welcome to Ktor API!", ContentType.Text.Plain)
        }

        // 健康检查
        get("/health") {
            call.respond(mapOf("status" to "healthy", "timestamp" to System.currentTimeMillis()))
        }

        // API 路由分组
        route("/api/v1") {
            userRoutes()
            productRoutes()
            orderRoutes()
        }
    }
}

// src/main/kotlin/com/example/routes/UserRoutes.kt
package com.example.routes

import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.http.*
import com.example.models.*
import com.example.services.UserService
import org.koin.ktor.ext.inject

fun Route.userRoutes() {
    val userService by inject<UserService>()

    route("/users") {
        // 获取所有用户
        get {
            val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
            val size = call.request.queryParameters["size"]?.toIntOrNull() ?: 10
            val users = userService.getAllUsers(page, size)
            call.respond(users)
        }

        // 根据 ID 获取用户
        get("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: throw IllegalArgumentException("Invalid user ID")

            val user = userService.getUserById(id)
                ?: throw NotFoundException("User not found with id: $id")

            call.respond(user)
        }

        // 创建用户
        post {
            val request = call.receive<CreateUserRequest>()
            val user = userService.createUser(request)
            call.respond(HttpStatusCode.Created, user)
        }

        // 更新用户
        put("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: throw IllegalArgumentException("Invalid user ID")

            val request = call.receive<UpdateUserRequest>()
            val user = userService.updateUser(id, request)
                ?: throw NotFoundException("User not found with id: $id")

            call.respond(user)
        }

        // 删除用户
        delete("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: throw IllegalArgumentException("Invalid user ID")

            val deleted = userService.deleteUser(id)
            if (deleted) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                throw NotFoundException("User not found with id: $id")
            }
        }

        // 搜索用户
        get("/search") {
            val query = call.request.queryParameters["q"]
                ?: throw IllegalArgumentException("Search query is required")

            val users = userService.searchUsers(query)
            call.respond(users)
        }
    }
}

// src/main/kotlin/com/example/models/User.kt
package com.example.models

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: Long,
    val username: String,
    val email: String,
    val role: UserRole = UserRole.USER,
    val createdAt: String,
    val isActive: Boolean = true
)

@Serializable
enum class UserRole {
    ADMIN, MODERATOR, USER
}

@Serializable
data class CreateUserRequest(
    val username: String,
    val email: String,
    val password: String,
    val role: UserRole = UserRole.USER
)

@Serializable
data class UpdateUserRequest(
    val username: String? = null,
    val email: String? = null,
    val role: UserRole? = null,
    val isActive: Boolean? = null
)

@Serializable
data class UserListResponse(
    val users: List<User>,
    val total: Long,
    val page: Int,
    val size: Int,
    val totalPages: Int
)
```

### JWT 认证

```kotlin
// src/main/kotlin/com/example/plugins/Security.kt
package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.http.*
import io.ktor.server.response.*
import java.util.*

object JwtConfig {
    private const val SECRET = "your-256-bit-secret-key-here"
    private const val ISSUER = "ktor-api"
    private const val AUDIENCE = "ktor-api-users"
    private const val VALIDITY_MS = 3600000L * 24  // 24 小时

    private val algorithm = Algorithm.HMAC256(SECRET)

    val verifier = JWT.require(algorithm)
        .withIssuer(ISSUER)
        .withAudience(AUDIENCE)
        .build()

    fun generateToken(userId: Long, username: String, role: String): String {
        return JWT.create()
            .withIssuer(ISSUER)
            .withAudience(AUDIENCE)
            .withClaim("userId", userId)
            .withClaim("username", username)
            .withClaim("role", role)
            .withExpiresAt(Date(System.currentTimeMillis() + VALIDITY_MS))
            .sign(algorithm)
    }
}

fun Application.configureSecurity() {
    install(Authentication) {
        jwt("auth-jwt") {
            realm = "ktor-api"
            verifier(JwtConfig.verifier)

            validate { credential ->
                val userId = credential.payload.getClaim("userId").asLong()
                val username = credential.payload.getClaim("username").asString()
                val role = credential.payload.getClaim("role").asString()

                if (userId != null && username != null) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }

            challenge { _, _ ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    ErrorResponse("Token is invalid or expired")
                )
            }
        }
    }
}

// 使用认证的路由
fun Route.protectedRoutes() {
    authenticate("auth-jwt") {
        get("/me") {
            val principal = call.principal<JWTPrincipal>()!!
            val userId = principal.payload.getClaim("userId").asLong()
            val username = principal.payload.getClaim("username").asString()

            call.respond(mapOf(
                "userId" to userId,
                "username" to username
            ))
        }

        // 角色授权
        route("/admin") {
            install(RoleAuthorizationPlugin) {
                roles = setOf("ADMIN")
            }

            get("/dashboard") {
                call.respond(mapOf("message" to "Welcome, Admin!"))
            }
        }
    }
}

// 自定义角色授权插件
class RoleAuthorizationConfig {
    var roles: Set<String> = emptySet()
}

val RoleAuthorizationPlugin = createRouteScopedPlugin(
    name = "RoleAuthorization",
    createConfiguration = ::RoleAuthorizationConfig
) {
    on(AuthenticationChecked) { call ->
        val principal = call.principal<JWTPrincipal>()
        val userRole = principal?.payload?.getClaim("role")?.asString()

        if (userRole == null || userRole !in pluginConfig.roles) {
            call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
        }
    }
}

// 登录路由
fun Route.authRoutes() {
    val userService by inject<UserService>()

    post("/login") {
        val request = call.receive<LoginRequest>()
        val user = userService.authenticate(request.username, request.password)
            ?: throw IllegalArgumentException("Invalid credentials")

        val token = JwtConfig.generateToken(user.id, user.username, user.role.name)

        call.respond(LoginResponse(
            token = token,
            user = user
        ))
    }

    post("/register") {
        val request = call.receive<CreateUserRequest>()
        val user = userService.createUser(request)
        val token = JwtConfig.generateToken(user.id, user.username, user.role.name)

        call.respond(HttpStatusCode.Created, LoginResponse(
            token = token,
            user = user
        ))
    }
}

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: User
)
```

## Kotlin + Spring Boot

### 项目配置

```kotlin
// build.gradle.kts
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.2.1"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.21"
    kotlin("plugin.spring") version "1.9.21"
    kotlin("plugin.jpa") version "1.9.21"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")

    // 数据库
    runtimeOnly("org.postgresql:postgresql")

    // 测试
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += "-Xjsr305=strict"
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// JPA 插件配置 - 为 data class 生成无参构造函数
allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}
```

### 实体与仓库

```kotlin
// src/main/kotlin/com/example/domain/User.kt
package com.example.domain

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(unique = true, nullable = false, length = 50)
    val username: String,

    @Column(unique = true, nullable = false)
    val email: String,

    @Column(nullable = false)
    val passwordHash: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: UserRole = UserRole.USER,

    @Column(nullable = false)
    val isActive: Boolean = true,

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @UpdateTimestamp
    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val orders: MutableList<Order> = mutableListOf()
)

enum class UserRole {
    ADMIN, MODERATOR, USER
}

// src/main/kotlin/com/example/repository/UserRepository.kt
package com.example.repository

import com.example.domain.User
import com.example.domain.UserRole
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, Long> {

    fun findByUsername(username: String): User?

    fun findByEmail(email: String): User?

    fun existsByUsername(username: String): Boolean

    fun existsByEmail(email: String): Boolean

    fun findByIsActiveTrue(pageable: Pageable): Page<User>

    fun findByRole(role: UserRole, pageable: Pageable): Page<User>

    @Query("SELECT u FROM User u WHERE u.username LIKE %:query% OR u.email LIKE %:query%")
    fun searchUsers(query: String, pageable: Pageable): Page<User>

    @Query("""
        SELECT u FROM User u
        WHERE u.createdAt >= :startDate
        AND u.createdAt <= :endDate
    """)
    fun findUsersCreatedBetween(
        startDate: LocalDateTime,
        endDate: LocalDateTime,
        pageable: Pageable
    ): Page<User>
}
```

### 服务层

```kotlin
// src/main/kotlin/com/example/service/UserService.kt
package com.example.service

import com.example.domain.User
import com.example.domain.UserRole
import com.example.dto.*
import com.example.exception.ResourceNotFoundException
import com.example.exception.DuplicateResourceException
import com.example.repository.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {

    fun getAllUsers(page: Int, size: Int, sortBy: String = "createdAt"): Page<UserDto> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy))
        return userRepository.findByIsActiveTrue(pageable).map { it.toDto() }
    }

    fun getUserById(id: Long): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("User not found with id: $id") }
        return user.toDto()
    }

    fun getUserByUsername(username: String): UserDto? {
        return userRepository.findByUsername(username)?.toDto()
    }

    @Transactional
    fun createUser(request: CreateUserRequest): UserDto {
        // 检查用户名和邮箱是否已存在
        if (userRepository.existsByUsername(request.username)) {
            throw DuplicateResourceException("Username already exists: ${request.username}")
        }
        if (userRepository.existsByEmail(request.email)) {
            throw DuplicateResourceException("Email already exists: ${request.email}")
        }

        val user = User(
            username = request.username,
            email = request.email,
            passwordHash = passwordEncoder.encode(request.password),
            role = request.role ?: UserRole.USER
        )

        val savedUser = userRepository.save(user)
        return savedUser.toDto()
    }

    @Transactional
    fun updateUser(id: Long, request: UpdateUserRequest): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("User not found with id: $id") }

        // 使用 copy 创建更新后的实体
        val updatedUser = user.copy(
            username = request.username ?: user.username,
            email = request.email ?: user.email,
            role = request.role ?: user.role,
            isActive = request.isActive ?: user.isActive
        )

        val savedUser = userRepository.save(updatedUser)
        return savedUser.toDto()
    }

    @Transactional
    fun deleteUser(id: Long) {
        if (!userRepository.existsById(id)) {
            throw ResourceNotFoundException("User not found with id: $id")
        }
        userRepository.deleteById(id)
    }

    fun searchUsers(query: String, page: Int, size: Int): Page<UserDto> {
        val pageable = PageRequest.of(page, size)
        return userRepository.searchUsers(query, pageable).map { it.toDto() }
    }

    fun authenticate(username: String, password: String): User? {
        val user = userRepository.findByUsername(username) ?: return null
        return if (passwordEncoder.matches(password, user.passwordHash) && user.isActive) {
            user
        } else {
            null
        }
    }
}

// 扩展函数用于 DTO 转换
private fun User.toDto() = UserDto(
    id = id,
    username = username,
    email = email,
    role = role,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt
)
```

### 控制器

```kotlin
// src/main/kotlin/com/example/controller/UserController.kt
package com.example.controller

import com.example.dto.*
import com.example.service.UserService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
class UserController(private val userService: UserService) {

    @GetMapping
    fun getAllUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String
    ): ResponseEntity<Page<UserDto>> {
        val users = userService.getAllUsers(page, size, sortBy)
        return ResponseEntity.ok(users)
    }

    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<UserDto> {
        val user = userService.getUserById(id)
        return ResponseEntity.ok(user)
    }

    @PostMapping
    fun createUser(@Valid @RequestBody request: CreateUserRequest): ResponseEntity<UserDto> {
        val user = userService.createUser(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(user)
    }

    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserRequest
    ): ResponseEntity<UserDto> {
        val user = userService.updateUser(id, request)
        return ResponseEntity.ok(user)
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteUser(@PathVariable id: Long) {
        userService.deleteUser(id)
    }

    @GetMapping("/search")
    fun searchUsers(
        @RequestParam q: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<Page<UserDto>> {
        val users = userService.searchUsers(q, page, size)
        return ResponseEntity.ok(users)
    }
}

// src/main/kotlin/com/example/dto/UserDto.kt
package com.example.dto

import com.example.domain.UserRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val role: UserRole,
    val isActive: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class CreateUserRequest(
    @field:NotBlank(message = "Username is required")
    @field:Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    val username: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,

    val role: UserRole? = null
)

data class UpdateUserRequest(
    @field:Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    val username: String? = null,

    @field:Email(message = "Invalid email format")
    val email: String? = null,

    val role: UserRole? = null,
    val isActive: Boolean? = null
)
```

### 异常处理

```kotlin
// src/main/kotlin/com/example/exception/Exceptions.kt
package com.example.exception

class ResourceNotFoundException(message: String) : RuntimeException(message)
class DuplicateResourceException(message: String) : RuntimeException(message)
class UnauthorizedException(message: String) : RuntimeException(message)

// src/main/kotlin/com/example/exception/GlobalExceptionHandler.kt
package com.example.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.LocalDateTime

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleResourceNotFound(ex: ResourceNotFoundException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            status = HttpStatus.NOT_FOUND.value(),
            message = ex.message ?: "Resource not found",
            timestamp = LocalDateTime.now()
        )
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error)
    }

    @ExceptionHandler(DuplicateResourceException::class)
    fun handleDuplicateResource(ex: DuplicateResourceException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            status = HttpStatus.CONFLICT.value(),
            message = ex.message ?: "Resource already exists",
            timestamp = LocalDateTime.now()
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(ex: MethodArgumentNotValidException): ResponseEntity<ValidationErrorResponse> {
        val errors = ex.bindingResult.allErrors.associate { error ->
            val fieldName = (error as? FieldError)?.field ?: error.objectName
            fieldName to (error.defaultMessage ?: "Validation error")
        }

        val response = ValidationErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            message = "Validation failed",
            errors = errors,
            timestamp = LocalDateTime.now()
        )
        return ResponseEntity.badRequest().body(response)
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            message = "An unexpected error occurred",
            timestamp = LocalDateTime.now()
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
    }
}

data class ErrorResponse(
    val status: Int,
    val message: String,
    val timestamp: LocalDateTime
)

data class ValidationErrorResponse(
    val status: Int,
    val message: String,
    val errors: Map<String, String>,
    val timestamp: LocalDateTime
)
```

## 协程与异步编程

### 协程基础

Kotlin 协程是轻量级的并发编程解决方案：

```kotlin
import kotlinx.coroutines.*
import kotlin.system.measureTimeMillis

// 基础协程示例
fun main() = runBlocking {
    // launch 启动一个新协程
    val job = launch {
        delay(1000L)
        println("World!")
    }
    println("Hello,")
    job.join()  // 等待协程完成
}

// async 用于并发获取结果
suspend fun fetchUserData(userId: Long): User = coroutineScope {
    // 并发请求多个数据源
    val userDeferred = async { userRepository.findById(userId) }
    val ordersDeferred = async { orderRepository.findByUserId(userId) }
    val preferencesDeferred = async { preferenceRepository.findByUserId(userId) }

    // 等待所有结果
    val user = userDeferred.await()
    val orders = ordersDeferred.await()
    val preferences = preferencesDeferred.await()

    user.copy(orders = orders, preferences = preferences)
}

// 结构化并发
suspend fun processOrders(orderIds: List<Long>): List<OrderResult> = coroutineScope {
    orderIds.map { orderId ->
        async {
            processOrder(orderId)  // 并发处理每个订单
        }
    }.awaitAll()
}

// 协程作用域与取消
class OrderService {
    // 服务级别的协程作用域
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun processOrderAsync(orderId: Long): Deferred<OrderResult> {
        return scope.async {
            processOrder(orderId)
        }
    }

    // 清理资源
    fun shutdown() {
        scope.cancel()
    }
}

// 超时处理
suspend fun fetchWithTimeout(url: String): String {
    return withTimeout(5000L) {  // 5秒超时
        httpClient.get(url)
    }
}

// 可选超时（不抛异常）
suspend fun fetchWithOptionalTimeout(url: String): String? {
    return withTimeoutOrNull(5000L) {
        httpClient.get(url)
    }
}
```

### 协程调度器

```kotlin
import kotlinx.coroutines.*

// 不同的调度器用于不同场景
suspend fun demonstrateDispatchers() = coroutineScope {
    // Default - CPU 密集型任务
    launch(Dispatchers.Default) {
        // 计算密集型操作
        val result = (1..1_000_000).map { it * it }.sum()
        println("计算结果: $result")
    }

    // IO - I/O 密集型任务
    launch(Dispatchers.IO) {
        // 文件读写、网络请求等
        val data = readFile("large_file.txt")
        println("文件大小: ${data.length}")
    }

    // Main - UI 更新（Android 或特定框架）
    // launch(Dispatchers.Main) { ... }

    // Unconfined - 不限制执行线程
    launch(Dispatchers.Unconfined) {
        println("当前线程: ${Thread.currentThread().name}")
    }

    // 自定义调度器
    val customDispatcher = Executors.newFixedThreadPool(4).asCoroutineDispatcher()
    launch(customDispatcher) {
        // 使用自定义线程池
    }
}

// 在指定调度器上执行代码块
suspend fun processData(): ProcessedData {
    return withContext(Dispatchers.Default) {
        // CPU 密集型数据处理
        heavyComputation()
    }
}

// 阻塞代码的协程包装
suspend fun blockingToSuspend(): String {
    return withContext(Dispatchers.IO) {
        // 将阻塞调用包装为挂起函数
        legacyBlockingCall()
    }
}
```

### Flow - 响应式流

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.delay

// 创建 Flow
fun numberFlow(): Flow<Int> = flow {
    for (i in 1..5) {
        delay(100)  // 模拟异步操作
        emit(i)     // 发射值
    }
}

// Flow 操作符
suspend fun demonstrateFlowOperators() {
    numberFlow()
        .filter { it % 2 == 0 }        // 过滤偶数
        .map { it * it }               // 平方
        .onEach { println("处理: $it") } // 副作用
        .collect { println("收集: $it") } // 终端操作
}

// 实际应用：实时数据流
class StockPriceService {

    // 股票价格流
    fun stockPriceFlow(symbol: String): Flow<StockPrice> = flow {
        while (true) {
            val price = fetchCurrentPrice(symbol)
            emit(price)
            delay(1000)  // 每秒更新
        }
    }.catch { e ->
        emit(StockPrice(symbol, 0.0, "Error: ${e.message}"))
    }

    // 多只股票价格合并
    fun multiStockPrices(symbols: List<String>): Flow<StockPrice> {
        return symbols.map { stockPriceFlow(it) }
            .merge()  // 合并多个 Flow
    }

    // 价格变化检测
    fun priceChangeFlow(symbol: String): Flow<PriceChange> {
        return stockPriceFlow(symbol)
            .distinctUntilChanged()  // 去重
            .runningReduce { previous, current ->
                // 计算变化
                current.copy(change = current.price - previous.price)
            }
            .filter { it.change != 0.0 }
    }
}

// StateFlow - 状态管理
class UserViewModel {
    private val _userState = MutableStateFlow<UserState>(UserState.Loading)
    val userState: StateFlow<UserState> = _userState.asStateFlow()

    suspend fun loadUser(userId: Long) {
        _userState.value = UserState.Loading
        try {
            val user = userService.getUser(userId)
            _userState.value = UserState.Success(user)
        } catch (e: Exception) {
            _userState.value = UserState.Error(e.message ?: "Unknown error")
        }
    }
}

sealed class UserState {
    data object Loading : UserState()
    data class Success(val user: User) : UserState()
    data class Error(val message: String) : UserState()
}

// SharedFlow - 事件广播
class EventBus {
    private val _events = MutableSharedFlow<Event>(
        replay = 0,
        extraBufferCapacity = 64,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val events: SharedFlow<Event> = _events.asSharedFlow()

    suspend fun emit(event: Event) {
        _events.emit(event)
    }
}
```

### Ktor 中的协程应用

```kotlin
// Ktor 天然支持协程
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.client.*
import io.ktor.client.request.*
import kotlinx.coroutines.*

fun Route.asyncRoutes() {
    val httpClient = HttpClient()

    // 并发请求多个外部 API
    get("/aggregate") {
        val results = coroutineScope {
            val users = async { httpClient.get("https://api.example.com/users") }
            val products = async { httpClient.get("https://api.example.com/products") }
            val orders = async { httpClient.get("https://api.example.com/orders") }

            mapOf(
                "users" to users.await(),
                "products" to products.await(),
                "orders" to orders.await()
            )
        }
        call.respond(results)
    }

    // 流式响应
    get("/stream") {
        call.respondTextWriter(ContentType.Text.EventStream) {
            repeat(10) { i ->
                write("data: Message $i\n\n")
                flush()
                delay(1000)
            }
        }
    }

    // 超时处理
    get("/with-timeout") {
        try {
            val result = withTimeout(5000) {
                longRunningOperation()
            }
            call.respond(result)
        } catch (e: TimeoutCancellationException) {
            call.respond(HttpStatusCode.GatewayTimeout, "Operation timed out")
        }
    }
}

// Spring WebFlux 中的协程
@RestController
@RequestMapping("/api/v1/reactive")
class ReactiveController(
    private val userService: UserService,
    private val orderService: OrderService
) {

    @GetMapping("/users/{id}/dashboard")
    suspend fun getUserDashboard(@PathVariable id: Long): DashboardResponse {
        return coroutineScope {
            val userDeferred = async { userService.getUser(id) }
            val ordersDeferred = async { orderService.getRecentOrders(id) }
            val statsDeferred = async { orderService.getOrderStats(id) }

            DashboardResponse(
                user = userDeferred.await(),
                recentOrders = ordersDeferred.await(),
                stats = statsDeferred.await()
            )
        }
    }

    @GetMapping("/users/{id}/orders", produces = [MediaType.APPLICATION_NDJSON_VALUE])
    fun streamOrders(@PathVariable id: Long): Flow<Order> {
        return orderService.streamOrders(id)
    }
}
```

## Exposed 数据库访问

### Exposed 简介与配置

Exposed 是 JetBrains 开发的 Kotlin SQL 框架，提供 DSL 和 DAO 两种 API：

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.jetbrains.exposed:exposed-core:0.45.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.45.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.45.0")
    implementation("org.jetbrains.exposed:exposed-java-time:0.45.0")
    implementation("com.zaxxer:HikariCP:5.1.0")
    implementation("org.postgresql:postgresql:42.7.1")
}

// 数据库配置
object DatabaseFactory {
    fun init() {
        val config = HikariConfig().apply {
            driverClassName = "org.postgresql.Driver"
            jdbcUrl = "jdbc:postgresql://localhost:5432/mydb"
            username = "postgres"
            password = "password"
            maximumPoolSize = 10
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }

        val dataSource = HikariDataSource(config)
        Database.connect(dataSource)

        // 创建表
        transaction {
            SchemaUtils.create(Users, Orders, OrderItems, Products)
        }
    }

    // 协程事务支持
    suspend fun <T> dbQuery(block: suspend Transaction.() -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
```

### 表定义（DSL API）

```kotlin
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.javatime.datetime

// 用户表
object Users : Table("users") {
    val id = long("id").autoIncrement()
    val username = varchar("username", 50).uniqueIndex()
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val role = enumeration<UserRole>("role").default(UserRole.USER)
    val isActive = bool("is_active").default(true)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}

// 订单表
object Orders : Table("orders") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").references(Users.id)
    val status = enumeration<OrderStatus>("status").default(OrderStatus.PENDING)
    val totalAmount = decimal("total_amount", 10, 2)
    val shippingAddress = text("shipping_address")
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)

    init {
        index(true, userId, createdAt)
    }
}

// 订单项表
object OrderItems : Table("order_items") {
    val id = long("id").autoIncrement()
    val orderId = long("order_id").references(Orders.id, onDelete = ReferenceOption.CASCADE)
    val productId = long("product_id").references(Products.id)
    val quantity = integer("quantity")
    val unitPrice = decimal("unit_price", 10, 2)

    override val primaryKey = PrimaryKey(id)
}

// 产品表
object Products : Table("products") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 100)
    val description = text("description").nullable()
    val price = decimal("price", 10, 2)
    val stock = integer("stock").default(0)
    val category = varchar("category", 50)
    val isAvailable = bool("is_available").default(true)

    override val primaryKey = PrimaryKey(id)
}

enum class OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
}
```

### CRUD 操作（DSL API）

```kotlin
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

class UserRepository {

    // 创建用户
    suspend fun create(user: CreateUserDto): Long = DatabaseFactory.dbQuery {
        Users.insert {
            it[username] = user.username
            it[email] = user.email
            it[passwordHash] = user.passwordHash
            it[role] = user.role
        }[Users.id]
    }

    // 根据 ID 查询
    suspend fun findById(id: Long): UserDto? = DatabaseFactory.dbQuery {
        Users.select { Users.id eq id }
            .map { it.toUserDto() }
            .singleOrNull()
    }

    // 查询所有用户（分页）
    suspend fun findAll(page: Int, size: Int): List<UserDto> = DatabaseFactory.dbQuery {
        Users.selectAll()
            .orderBy(Users.createdAt to SortOrder.DESC)
            .limit(size, offset = (page * size).toLong())
            .map { it.toUserDto() }
    }

    // 条件查询
    suspend fun findByRole(role: UserRole): List<UserDto> = DatabaseFactory.dbQuery {
        Users.select { Users.role eq role }
            .map { it.toUserDto() }
    }

    // 复杂查询
    suspend fun searchUsers(query: String, isActive: Boolean? = null): List<UserDto> =
        DatabaseFactory.dbQuery {
            val conditions = ArrayList<Op<Boolean>>()
            conditions.add((Users.username like "%$query%") or (Users.email like "%$query%"))
            isActive?.let { conditions.add(Users.isActive eq it) }

            Users.select { conditions.reduce { acc, op -> acc and op } }
                .map { it.toUserDto() }
        }

    // 更新用户
    suspend fun update(id: Long, user: UpdateUserDto): Boolean = DatabaseFactory.dbQuery {
        Users.update({ Users.id eq id }) {
            user.username?.let { u -> it[username] = u }
            user.email?.let { e -> it[email] = e }
            user.role?.let { r -> it[role] = r }
            user.isActive?.let { a -> it[isActive] = a }
            it[updatedAt] = LocalDateTime.now()
        } > 0
    }

    // 删除用户
    suspend fun delete(id: Long): Boolean = DatabaseFactory.dbQuery {
        Users.deleteWhere { Users.id eq id } > 0
    }

    // 批量插入
    suspend fun batchInsert(users: List<CreateUserDto>): List<Long> = DatabaseFactory.dbQuery {
        Users.batchInsert(users) { user ->
            this[Users.username] = user.username
            this[Users.email] = user.email
            this[Users.passwordHash] = user.passwordHash
            this[Users.role] = user.role
        }.map { it[Users.id] }
    }
}

// 扩展函数用于 DTO 转换
private fun ResultRow.toUserDto() = UserDto(
    id = this[Users.id],
    username = this[Users.username],
    email = this[Users.email],
    role = this[Users.role],
    isActive = this[Users.isActive],
    createdAt = this[Users.createdAt],
    updatedAt = this[Users.updatedAt]
)
```

### 联表查询

```kotlin
class OrderRepository {

    // 联表查询：获取订单及其用户信息
    suspend fun findOrderWithUser(orderId: Long): OrderWithUserDto? = DatabaseFactory.dbQuery {
        (Orders innerJoin Users)
            .select { Orders.id eq orderId }
            .map { row ->
                OrderWithUserDto(
                    orderId = row[Orders.id],
                    status = row[Orders.status],
                    totalAmount = row[Orders.totalAmount],
                    username = row[Users.username],
                    email = row[Users.email]
                )
            }
            .singleOrNull()
    }

    // 多表联查：获取订单详情（包含订单项和产品信息）
    suspend fun findOrderDetails(orderId: Long): OrderDetailsDto? = DatabaseFactory.dbQuery {
        val order = Orders.select { Orders.id eq orderId }.singleOrNull() ?: return@dbQuery null

        val items = (OrderItems innerJoin Products)
            .select { OrderItems.orderId eq orderId }
            .map { row ->
                OrderItemDto(
                    productId = row[Products.id],
                    productName = row[Products.name],
                    quantity = row[OrderItems.quantity],
                    unitPrice = row[OrderItems.unitPrice],
                    total = row[OrderItems.quantity].toBigDecimal() * row[OrderItems.unitPrice]
                )
            }

        OrderDetailsDto(
            id = order[Orders.id],
            status = order[Orders.status],
            totalAmount = order[Orders.totalAmount],
            shippingAddress = order[Orders.shippingAddress],
            createdAt = order[Orders.createdAt],
            items = items
        )
    }

    // 聚合查询：用户订单统计
    suspend fun getUserOrderStats(userId: Long): UserOrderStatsDto = DatabaseFactory.dbQuery {
        val stats = Orders
            .slice(
                Orders.id.count(),
                Orders.totalAmount.sum(),
                Orders.totalAmount.avg()
            )
            .select { Orders.userId eq userId }
            .single()

        UserOrderStatsDto(
            totalOrders = stats[Orders.id.count()],
            totalSpent = stats[Orders.totalAmount.sum()] ?: BigDecimal.ZERO,
            averageOrderValue = stats[Orders.totalAmount.avg()] ?: BigDecimal.ZERO
        )
    }

    // 分组查询：按状态统计订单数量
    suspend fun getOrderCountByStatus(): Map<OrderStatus, Long> = DatabaseFactory.dbQuery {
        Orders.slice(Orders.status, Orders.id.count())
            .selectAll()
            .groupBy(Orders.status)
            .associate {
                it[Orders.status] to it[Orders.id.count()]
            }
    }

    // 子查询
    suspend fun findUsersWithRecentOrders(days: Int): List<UserDto> = DatabaseFactory.dbQuery {
        val cutoffDate = LocalDateTime.now().minusDays(days.toLong())

        val userIdsWithOrders = Orders
            .slice(Orders.userId)
            .select { Orders.createdAt greater cutoffDate }
            .map { it[Orders.userId] }
            .distinct()

        Users.select { Users.id inList userIdsWithOrders }
            .map { it.toUserDto() }
    }
}
```

### DAO API

```kotlin
import org.jetbrains.exposed.dao.*
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.LongIdTable

// 使用 LongIdTable 简化表定义
object UsersTable : LongIdTable("users") {
    val username = varchar("username", 50).uniqueIndex()
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val role = enumeration<UserRole>("role").default(UserRole.USER)
    val isActive = bool("is_active").default(true)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
}

object OrdersTable : LongIdTable("orders") {
    val user = reference("user_id", UsersTable)
    val status = enumeration<OrderStatus>("status").default(OrderStatus.PENDING)
    val totalAmount = decimal("total_amount", 10, 2)
    val shippingAddress = text("shipping_address")
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
}

// Entity 类
class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(UsersTable)

    var username by UsersTable.username
    var email by UsersTable.email
    var passwordHash by UsersTable.passwordHash
    var role by UsersTable.role
    var isActive by UsersTable.isActive
    var createdAt by UsersTable.createdAt

    // 一对多关系
    val orders by OrderEntity referrersOn OrdersTable.user

    fun toDto() = UserDto(
        id = id.value,
        username = username,
        email = email,
        role = role,
        isActive = isActive,
        createdAt = createdAt
    )
}

class OrderEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<OrderEntity>(OrdersTable)

    var user by UserEntity referencedOn OrdersTable.user
    var status by OrdersTable.status
    var totalAmount by OrdersTable.totalAmount
    var shippingAddress by OrdersTable.shippingAddress
    var createdAt by OrdersTable.createdAt
}

// 使用 DAO API
class UserDaoService {

    suspend fun createUser(dto: CreateUserDto): UserDto = DatabaseFactory.dbQuery {
        UserEntity.new {
            username = dto.username
            email = dto.email
            passwordHash = dto.passwordHash
            role = dto.role
        }.toDto()
    }

    suspend fun findById(id: Long): UserDto? = DatabaseFactory.dbQuery {
        UserEntity.findById(id)?.toDto()
    }

    suspend fun findAll(): List<UserDto> = DatabaseFactory.dbQuery {
        UserEntity.all().map { it.toDto() }
    }

    suspend fun update(id: Long, dto: UpdateUserDto): UserDto? = DatabaseFactory.dbQuery {
        UserEntity.findById(id)?.apply {
            dto.username?.let { username = it }
            dto.email?.let { email = it }
            dto.role?.let { role = it }
            dto.isActive?.let { isActive = it }
        }?.toDto()
    }

    suspend fun delete(id: Long): Boolean = DatabaseFactory.dbQuery {
        UserEntity.findById(id)?.let {
            it.delete()
            true
        } ?: false
    }

    // 获取用户及其订单
    suspend fun getUserWithOrders(id: Long): UserWithOrdersDto? = DatabaseFactory.dbQuery {
        UserEntity.findById(id)?.let { user ->
            UserWithOrdersDto(
                user = user.toDto(),
                orders = user.orders.map { it.toDto() }
            )
        }
    }
}
```

## 最佳实践

### 项目结构

```
project/
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   └── com/example/
│   │   │       ├── Application.kt          # 应用入口
│   │   │       ├── config/                 # 配置类
│   │   │       │   ├── DatabaseConfig.kt
│   │   │       │   ├── SecurityConfig.kt
│   │   │       │   └── CacheConfig.kt
│   │   │       ├── domain/                 # 领域模型
│   │   │       │   ├── entity/
│   │   │       │   ├── valueobject/
│   │   │       │   └── repository/
│   │   │       ├── application/            # 应用服务
│   │   │       │   ├── service/
│   │   │       │   └── dto/
│   │   │       ├── infrastructure/         # 基础设施
│   │   │       │   ├── persistence/
│   │   │       │   ├── messaging/
│   │   │       │   └── external/
│   │   │       ├── presentation/           # 表现层
│   │   │       │   ├── controller/
│   │   │       │   ├── routes/
│   │   │       │   └── middleware/
│   │   │       └── common/                 # 公共模块
│   │   │           ├── exception/
│   │   │           ├── extension/
│   │   │           └── util/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── logback.xml
│   └── test/
│       └── kotlin/
│           └── com/example/
│               ├── unit/
│               ├── integration/
│               └── e2e/
├── build.gradle.kts
└── settings.gradle.kts
```

### 错误处理最佳实践

```kotlin
// 使用 Result 类型进行错误处理
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Failure(val error: AppError) : Result<Nothing>()

    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Failure -> this
    }

    inline fun <R> flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
        is Success -> transform(data)
        is Failure -> this
    }

    fun getOrNull(): T? = when (this) {
        is Success -> data
        is Failure -> null
    }

    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Failure -> throw error.toException()
    }
}

sealed class AppError {
    data class NotFound(val resource: String, val id: Any) : AppError()
    data class Validation(val errors: Map<String, String>) : AppError()
    data class Unauthorized(val message: String = "Unauthorized") : AppError()
    data class Forbidden(val message: String = "Forbidden") : AppError()
    data class Conflict(val message: String) : AppError()
    data class Internal(val message: String, val cause: Throwable? = null) : AppError()

    fun toException(): Exception = when (this) {
        is NotFound -> ResourceNotFoundException("$resource not found: $id")
        is Validation -> ValidationException(errors)
        is Unauthorized -> UnauthorizedException(message)
        is Forbidden -> ForbiddenException(message)
        is Conflict -> ConflictException(message)
        is Internal -> InternalException(message, cause)
    }
}

// 在服务层使用
class UserService(private val userRepository: UserRepository) {

    suspend fun getUser(id: Long): Result<UserDto> {
        return try {
            val user = userRepository.findById(id)
            if (user != null) {
                Result.Success(user)
            } else {
                Result.Failure(AppError.NotFound("User", id))
            }
        } catch (e: Exception) {
            Result.Failure(AppError.Internal("Failed to fetch user", e))
        }
    }

    suspend fun createUser(request: CreateUserRequest): Result<UserDto> {
        // 验证
        val validationErrors = validateCreateRequest(request)
        if (validationErrors.isNotEmpty()) {
            return Result.Failure(AppError.Validation(validationErrors))
        }

        // 检查重复
        if (userRepository.existsByUsername(request.username)) {
            return Result.Failure(AppError.Conflict("Username already exists"))
        }

        return try {
            val user = userRepository.create(request.toEntity())
            Result.Success(user)
        } catch (e: Exception) {
            Result.Failure(AppError.Internal("Failed to create user", e))
        }
    }
}

// 在路由中使用
fun Route.userRoutes(userService: UserService) {
    get("/users/{id}") {
        val id = call.parameters["id"]?.toLongOrNull()
            ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid user ID")

        when (val result = userService.getUser(id)) {
            is Result.Success -> call.respond(result.data)
            is Result.Failure -> call.respondError(result.error)
        }
    }
}

// 错误响应辅助函数
suspend fun ApplicationCall.respondError(error: AppError) {
    val (status, response) = when (error) {
        is AppError.NotFound -> HttpStatusCode.NotFound to ErrorResponse(error.resource, error.id.toString())
        is AppError.Validation -> HttpStatusCode.BadRequest to ValidationErrorResponse(error.errors)
        is AppError.Unauthorized -> HttpStatusCode.Unauthorized to MessageResponse(error.message)
        is AppError.Forbidden -> HttpStatusCode.Forbidden to MessageResponse(error.message)
        is AppError.Conflict -> HttpStatusCode.Conflict to MessageResponse(error.message)
        is AppError.Internal -> HttpStatusCode.InternalServerError to MessageResponse("Internal server error")
    }
    respond(status, response)
}
```

### 依赖注入

```kotlin
// 使用 Koin 进行依赖注入
// build.gradle.kts
dependencies {
    implementation("io.insert-koin:koin-ktor:3.5.3")
    implementation("io.insert-koin:koin-logger-slf4j:3.5.3")
}

// 模块定义
val appModule = module {
    // 单例
    single { DatabaseFactory.init() }
    single { UserRepository() }
    single { OrderRepository() }

    // 每次创建新实例
    factory { UserService(get()) }
    factory { OrderService(get(), get()) }
}

val securityModule = module {
    single { JwtService() }
    single { PasswordEncoder() }
    factory { AuthService(get(), get(), get()) }
}

// 安装 Koin
fun Application.configureKoin() {
    install(Koin) {
        slf4jLogger()
        modules(appModule, securityModule)
    }
}

// 在路由中使用
fun Route.configuredRoutes() {
    val userService by inject<UserService>()
    val authService by inject<AuthService>()

    route("/api/v1") {
        userRoutes(userService)
        authRoutes(authService)
    }
}
```

### 测试

```kotlin
// 单元测试
class UserServiceTest {
    private val userRepository = mockk<UserRepository>()
    private val userService = UserService(userRepository)

    @Test
    fun `should return user when found`() = runTest {
        // Given
        val userId = 1L
        val expectedUser = UserDto(userId, "john", "john@example.com", UserRole.USER, true, LocalDateTime.now())
        coEvery { userRepository.findById(userId) } returns expectedUser

        // When
        val result = userService.getUser(userId)

        // Then
        assertTrue(result is Result.Success)
        assertEquals(expectedUser, (result as Result.Success).data)
    }

    @Test
    fun `should return NotFound when user does not exist`() = runTest {
        // Given
        val userId = 999L
        coEvery { userRepository.findById(userId) } returns null

        // When
        val result = userService.getUser(userId)

        // Then
        assertTrue(result is Result.Failure)
        assertTrue((result as Result.Failure).error is AppError.NotFound)
    }
}

// Ktor 集成测试
class UserRoutesTest {
    @Test
    fun `should create user successfully`() = testApplication {
        application {
            configurePlugins()
            configureRouting()
        }

        val response = client.post("/api/v1/users") {
            contentType(ContentType.Application.Json)
            setBody("""
                {
                    "username": "testuser",
                    "email": "test@example.com",
                    "password": "password123"
                }
            """.trimIndent())
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val user = response.body<UserDto>()
        assertEquals("testuser", user.username)
    }

    @Test
    fun `should return 404 for non-existent user`() = testApplication {
        application {
            configurePlugins()
            configureRouting()
        }

        val response = client.get("/api/v1/users/99999")

        assertEquals(HttpStatusCode.NotFound, response.status)
    }
}

// Spring Boot 测试
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var userService: UserService

    @Test
    fun `should get user by id`() {
        val user = UserDto(1, "john", "john@example.com", UserRole.USER, true, LocalDateTime.now(), LocalDateTime.now())
        every { userService.getUserById(1) } returns user

        mockMvc.perform(get("/api/v1/users/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.username").value("john"))
            .andExpect(jsonPath("$.email").value("john@example.com"))
    }
}
```

### 性能优化

```kotlin
// 数据库连接池优化
object DatabaseConfig {
    fun createHikariConfig() = HikariConfig().apply {
        jdbcUrl = System.getenv("DATABASE_URL")
        driverClassName = "org.postgresql.Driver"
        username = System.getenv("DATABASE_USER")
        password = System.getenv("DATABASE_PASSWORD")

        // 连接池大小 = ((core_count * 2) + effective_spindle_count)
        maximumPoolSize = 20
        minimumIdle = 5

        // 连接超时
        connectionTimeout = 30000  // 30 秒
        idleTimeout = 600000       // 10 分钟
        maxLifetime = 1800000      // 30 分钟

        // 验证查询
        connectionTestQuery = "SELECT 1"

        // 泄漏检测
        leakDetectionThreshold = 60000  // 1 分钟
    }
}

// 缓存优化
class CachedUserService(
    private val userRepository: UserRepository,
    private val cache: Cache<Long, UserDto>
) {
    suspend fun getUser(id: Long): UserDto? {
        // 先查缓存
        cache.getIfPresent(id)?.let { return it }

        // 缓存未命中，查数据库
        val user = userRepository.findById(id)
        user?.let { cache.put(id, it) }
        return user
    }

    suspend fun updateUser(id: Long, dto: UpdateUserDto): UserDto? {
        val updated = userRepository.update(id, dto)
        // 更新时清除缓存
        cache.invalidate(id)
        return updated
    }
}

// 使用 Caffeine 缓存
fun createUserCache(): Cache<Long, UserDto> = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(10))
    .recordStats()
    .build()

// 批量操作优化
class BatchUserService(private val userRepository: UserRepository) {

    // 使用批量插入代替逐条插入
    suspend fun createUsers(users: List<CreateUserDto>): List<Long> {
        return userRepository.batchInsert(users)
    }

    // 使用并行协程处理
    suspend fun processUsers(userIds: List<Long>): List<ProcessedUser> = coroutineScope {
        userIds.chunked(100)  // 分批处理
            .flatMap { chunk ->
                chunk.map { id ->
                    async(Dispatchers.IO) {
                        processUser(id)
                    }
                }.awaitAll()
            }
    }
}
```

## 面试要点

### 基础概念题

**Q1: Kotlin 相比 Java 的主要优势是什么？**

A: Kotlin 的主要优势包括：
- **空安全**：编译时检查空指针，消除 NPE
- **简洁性**：data class、扩展函数、类型推断大幅减少样板代码
- **协程**：轻量级并发，简化异步编程
- **函数式特性**：高阶函数、lambda 表达式、集合操作
- **完全互操作**：与 Java 代码无缝协作

**Q2: 解释 Kotlin 协程与 Java 线程的区别**

A: 主要区别：
- **资源消耗**：协程比线程轻量得多，可以创建数十万个协程
- **调度方式**：协程是协作式调度，线程是抢占式调度
- **编程模型**：协程使用挂起函数，代码看起来像同步但实际是异步
- **上下文切换**：协程切换不需要操作系统介入，开销更小

**Q3: 什么是 sealed class？有什么用处？**

A: Sealed class 是受限的类层次结构：
- 所有子类必须在编译时已知
- 与 when 表达式配合实现穷尽检查
- 适合表示有限状态集合（如 Result、State）
- 比枚举更灵活，每个子类可以有不同的属性

### 进阶实践题

**Q4: 如何在 Kotlin 中实现单例模式？**

```kotlin
// 方式1：object 声明（推荐）
object DatabaseConnection {
    val connection: Connection by lazy {
        DriverManager.getConnection(url)
    }
}

// 方式2：伴生对象
class Singleton private constructor() {
    companion object {
        @Volatile
        private var instance: Singleton? = null

        fun getInstance(): Singleton {
            return instance ?: synchronized(this) {
                instance ?: Singleton().also { instance = it }
            }
        }
    }
}

// 方式3：懒加载委托
class LazySingleton {
    companion object {
        val instance: LazySingleton by lazy { LazySingleton() }
    }
}
```

**Q5: 解释 Kotlin 的协程调度器及其使用场景**

```kotlin
// Dispatchers.Default - CPU 密集型任务
launch(Dispatchers.Default) {
    // 复杂计算、数据处理
}

// Dispatchers.IO - I/O 密集型任务
launch(Dispatchers.IO) {
    // 文件读写、网络请求、数据库操作
}

// Dispatchers.Main - UI 更新（Android）
launch(Dispatchers.Main) {
    // 更新 UI
}

// 自定义调度器
val customDispatcher = Executors.newFixedThreadPool(4).asCoroutineDispatcher()
```

**Q6: 如何处理协程中的异常？**

```kotlin
// 方式1：try-catch
launch {
    try {
        riskyOperation()
    } catch (e: Exception) {
        handleError(e)
    }
}

// 方式2：CoroutineExceptionHandler
val handler = CoroutineExceptionHandler { _, exception ->
    println("Caught $exception")
}
launch(handler) {
    riskyOperation()
}

// 方式3：supervisorScope（子协程失败不影响其他）
supervisorScope {
    launch { task1() }  // 失败不影响 task2
    launch { task2() }
}

// 方式4：runCatching
val result = runCatching { riskyOperation() }
    .onSuccess { println("Success: $it") }
    .onFailure { println("Error: $it") }
```

### 架构设计题

**Q7: 设计一个高并发的 Kotlin 后端服务架构**

推荐架构：
1. **Web 层**：Ktor/Spring WebFlux + 协程
2. **服务层**：使用协程处理业务逻辑
3. **数据层**：Exposed + HikariCP 连接池
4. **缓存层**：Redis + Caffeine 本地缓存
5. **消息队列**：Kafka/RabbitMQ 异步处理
6. **监控**：Micrometer + Prometheus

**Q8: Ktor vs Spring Boot，如何选择？**

| 特性 | Ktor | Spring Boot |
|------|------|-------------|
| 学习曲线 | 较低 | 较高 |
| 启动速度 | 快 | 较慢 |
| 内存占用 | 低 | 较高 |
| 生态系统 | 较小 | 庞大 |
| Kotlin 原生 | 是 | 否 |
| 协程支持 | 原生 | 需要 WebFlux |
| 企业级功能 | 基础 | 完善 |

选择建议：
- 微服务/轻量级 API：Ktor
- 企业级应用/复杂业务：Spring Boot
- 追求 Kotlin 原生体验：Ktor

## 总结

Kotlin 在后端开发领域展现了强大的竞争力，其现代化的语言特性、优秀的空安全机制和原生协程支持，使其成为 JVM 后端开发的优秀选择。通过本文的学习，你应该掌握了：

1. Kotlin 语言核心优势：空安全、简洁语法、扩展函数
2. Ktor 框架的使用：路由、插件、认证
3. Kotlin + Spring Boot 集成开发
4. 协程与异步编程：Flow、调度器、结构化并发
5. Exposed 数据库访问：DSL 和 DAO API
6. 最佳实践：项目结构、错误处理、测试、性能优化

无论是选择轻量级的 Ktor 还是功能丰富的 Spring Boot，Kotlin 都能为后端开发带来更好的开发体验和代码质量。

## 参考资源

- [Kotlin 官方文档](https://kotlinlang.org/docs/)
- [Ktor 官方文档](https://ktor.io/docs/)
- [Spring Boot + Kotlin 指南](https://spring.io/guides/tutorials/spring-boot-kotlin/)
- [Kotlin 协程指南](https://kotlinlang.org/docs/coroutines-guide.html)
- [Exposed 文档](https://github.com/JetBrains/Exposed)
- [Kotlin 编码规范](https://kotlinlang.org/docs/coding-conventions.html)
