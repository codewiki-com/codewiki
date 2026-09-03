---
title: Kotlin Backend Development
description: Build backend services with Kotlin and Ktor/Spring
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Kotlin
  - Ktor
  - Spring Boot
  - JVM
status: imported
origin: old/src/content/docs/backend/kotlin-backend.en.md
divergence: 0.367
issues:
  - divergent
legacy:
  category: Backend
  subcategory: Languages
  order: 27
  lastUpdated: 2026-01-07
---

## Why Kotlin for Backend?

Kotlin has emerged as a powerful choice for backend development, offering a modern, expressive language that runs on the JVM while maintaining full interoperability with Java. Originally developed by JetBrains and now officially supported by Google for Android development, Kotlin has proven equally capable for server-side applications.

### Key Advantages of Kotlin

Kotlin brings several compelling features to backend development:

- **Null Safety**: Eliminates the billion-dollar mistake by making null handling explicit at compile time
- **Concise Syntax**: Reduces boilerplate code significantly compared to Java
- **Coroutines**: First-class support for asynchronous programming without callback hell
- **Java Interoperability**: Seamlessly use existing Java libraries and frameworks
- **Type Inference**: Smart compiler reduces verbosity while maintaining type safety
- **Extension Functions**: Add functionality to existing classes without inheritance
- **Data Classes**: Automatic generation of equals, hashCode, toString, and copy methods
- **Sealed Classes**: Represent restricted class hierarchies for exhaustive when expressions

### Kotlin vs Java Comparison

```kotlin
// Java - Traditional POJO
public class User {
    private final String id;
    private final String name;
    private final String email;

    public User(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }

    @Override
    public boolean equals(Object o) { /* implementation */ }
    @Override
    public int hashCode() { /* implementation */ }
    @Override
    public String toString() { /* implementation */ }
}

// Kotlin - Data Class (equivalent functionality)
data class User(
    val id: String,
    val name: String,
    val email: String
)
```

## Setting Up Kotlin for Backend

### Project Setup with Gradle

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.serialization") version "1.9.22"
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin standard library
    implementation(kotlin("stdlib"))

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Testing
    testImplementation(kotlin("test"))
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
}

kotlin {
    jvmToolchain(17)
}

application {
    mainClass.set("com.example.ApplicationKt")
}

tasks.test {
    useJUnitPlatform()
}
```

### Project Structure

```
my-kotlin-backend/
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   └── com/example/
│   │   │       ├── Application.kt
│   │   │       ├── routes/
│   │   │       ├── models/
│   │   │       ├── services/
│   │   │       ├── repositories/
│   │   │       └── plugins/
│   │   └── resources/
│   │       ├── application.conf
│   │       └── logback.xml
│   └── test/
│       └── kotlin/
│           └── com/example/
├── build.gradle.kts
└── settings.gradle.kts
```

## Ktor Framework

Ktor is a modern, asynchronous framework built by JetBrains specifically for Kotlin. It leverages coroutines for non-blocking I/O and provides a lightweight, modular architecture.

### Why Choose Ktor?

- **Native Kotlin**: Built from the ground up for Kotlin with coroutines
- **Lightweight**: Include only what you need through plugins
- **Asynchronous**: Non-blocking by default using coroutines
- **Testable**: Built-in testing support with TestApplication
- **Flexible**: Works with various engines (Netty, Jetty, CIO, Tomcat)

### Getting Started with Ktor

```kotlin
// build.gradle.kts - Ktor dependencies
val ktorVersion = "2.3.7"

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-status-pages-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-auth-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-auth-jwt-jvm:$ktorVersion")
    implementation("ch.qos.logback:logback-classic:1.4.14")

    testImplementation("io.ktor:ktor-server-tests-jvm:$ktorVersion")
    testImplementation("io.ktor:ktor-client-content-negotiation-jvm:$ktorVersion")
}
```

### Basic Ktor Application

```kotlin
// Application.kt
package com.example

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configurePlugins()
        configureRouting()
    }.start(wait = true)
}

fun Application.configurePlugins() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
}

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Hello, Kotlin Backend!")
        }

        get("/health") {
            call.respond(mapOf("status" to "healthy"))
        }
    }
}
```

### Modular Route Organization

```kotlin
// routes/UserRoutes.kt
package com.example.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String
)

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

fun Route.userRoutes() {
    route("/api/users") {
        // Get all users
        get {
            val users = listOf(
                User("1", "Alice", "alice@example.com"),
                User("2", "Bob", "bob@example.com")
            )
            call.respond(ApiResponse(success = true, data = users))
        }

        // Get user by ID
        get("/{id}") {
            val id = call.parameters["id"]
                ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<User>(success = false, message = "Missing user ID")
                )

            // Simulated user lookup
            val user = User(id, "User $id", "user$id@example.com")
            call.respond(ApiResponse(success = true, data = user))
        }

        // Create user
        post {
            val request = call.receive<CreateUserRequest>()
            val newUser = User(
                id = java.util.UUID.randomUUID().toString(),
                name = request.name,
                email = request.email
            )
            call.respond(
                HttpStatusCode.Created,
                ApiResponse(success = true, data = newUser)
            )
        }

        // Update user
        put("/{id}") {
            val id = call.parameters["id"]!!
            val request = call.receive<CreateUserRequest>()
            val updatedUser = User(id, request.name, request.email)
            call.respond(ApiResponse(success = true, data = updatedUser))
        }

        // Delete user
        delete("/{id}") {
            val id = call.parameters["id"]!!
            call.respond(
                ApiResponse<Unit>(success = true, message = "User $id deleted")
            )
        }
    }
}
```

### Authentication with JWT

```kotlin
// plugins/Authentication.kt
package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import java.util.*

data class JwtConfig(
    val secret: String,
    val issuer: String,
    val audience: String,
    val realm: String,
    val expirationMs: Long = 3600000 // 1 hour
)

fun Application.configureAuthentication(config: JwtConfig) {
    install(Authentication) {
        jwt("auth-jwt") {
            realm = config.realm
            verifier(
                JWT.require(Algorithm.HMAC256(config.secret))
                    .withAudience(config.audience)
                    .withIssuer(config.issuer)
                    .build()
            )
            validate { credential ->
                if (credential.payload.getClaim("userId").asString() != "") {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
            challenge { _, _ ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    mapOf("error" to "Token is invalid or expired")
                )
            }
        }
    }
}

// Token generation utility
class JwtService(private val config: JwtConfig) {
    fun generateToken(userId: String, email: String): String {
        return JWT.create()
            .withAudience(config.audience)
            .withIssuer(config.issuer)
            .withClaim("userId", userId)
            .withClaim("email", email)
            .withExpiresAt(Date(System.currentTimeMillis() + config.expirationMs))
            .sign(Algorithm.HMAC256(config.secret))
    }
}

// Protected routes
fun Route.protectedRoutes() {
    authenticate("auth-jwt") {
        get("/api/profile") {
            val principal = call.principal<JWTPrincipal>()
            val userId = principal!!.payload.getClaim("userId").asString()
            val email = principal.payload.getClaim("email").asString()

            call.respond(mapOf(
                "userId" to userId,
                "email" to email
            ))
        }
    }
}
```

### Error Handling with Status Pages

```kotlin
// plugins/StatusPages.kt
package com.example.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val status: Int
)

// Custom exceptions
class NotFoundException(message: String) : Exception(message)
class ValidationException(message: String) : Exception(message)
class UnauthorizedException(message: String) : Exception(message)

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<NotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(
                    error = "Not Found",
                    message = cause.message ?: "Resource not found",
                    status = 404
                )
            )
        }

        exception<ValidationException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(
                    error = "Validation Error",
                    message = cause.message ?: "Invalid request",
                    status = 400
                )
            )
        }

        exception<UnauthorizedException> { call, cause ->
            call.respond(
                HttpStatusCode.Unauthorized,
                ErrorResponse(
                    error = "Unauthorized",
                    message = cause.message ?: "Authentication required",
                    status = 401
                )
            )
        }

        exception<Throwable> { call, cause ->
            call.application.environment.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    error = "Internal Server Error",
                    message = "An unexpected error occurred",
                    status = 500
                )
            )
        }

        status(HttpStatusCode.NotFound) { call, status ->
            call.respond(
                status,
                ErrorResponse(
                    error = "Not Found",
                    message = "The requested resource was not found",
                    status = 404
                )
            )
        }
    }
}
```

## Kotlin with Spring Boot

Kotlin is officially supported by Spring Boot and works seamlessly with the Spring ecosystem. This combination provides the robustness of Spring with the expressiveness of Kotlin.

### Spring Boot Kotlin Setup

```kotlin
// build.gradle.kts
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.2.1"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.spring") version "1.9.22"
    kotlin("plugin.jpa") version "1.9.22"
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

    runtimeOnly("org.postgresql:postgresql")

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
```

### Spring Boot Application Structure

```kotlin
// Application.kt
package com.example.demo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class DemoApplication

fun main(args: Array<String>) {
    runApplication<DemoApplication>(*args)
}
```

### Entity and Repository

```kotlin
// models/User.kt
package com.example.demo.models

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false)
    val password: String,

    @Column(name = "created_at")
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Enumerated(EnumType.STRING)
    val role: UserRole = UserRole.USER
)

enum class UserRole {
    USER, ADMIN
}

// repositories/UserRepository.kt
package com.example.demo.repositories

import com.example.demo.models.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmail(email: String): Optional<User>
    fun existsByEmail(email: String): Boolean

    @Query("SELECT u FROM User u WHERE u.role = :role")
    fun findByRole(role: String): List<User>

    @Query("SELECT u FROM User u WHERE u.name LIKE %:name%")
    fun searchByName(name: String): List<User>
}
```

### Service Layer

```kotlin
// services/UserService.kt
package com.example.demo.services

import com.example.demo.models.User
import com.example.demo.models.UserRole
import com.example.demo.repositories.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

data class CreateUserDto(
    val email: String,
    val name: String,
    val password: String
)

data class UpdateUserDto(
    val name: String? = null,
    val email: String? = null
)

data class UserResponse(
    val id: Long,
    val email: String,
    val name: String,
    val role: UserRole,
    val createdAt: LocalDateTime
)

fun User.toResponse() = UserResponse(
    id = id,
    email = email,
    name = name,
    role = role,
    createdAt = createdAt
)

class UserNotFoundException(message: String) : RuntimeException(message)
class UserAlreadyExistsException(message: String) : RuntimeException(message)

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    fun findAll(): List<UserResponse> =
        userRepository.findAll().map { it.toResponse() }

    fun findById(id: Long): UserResponse =
        userRepository.findById(id)
            .map { it.toResponse() }
            .orElseThrow { UserNotFoundException("User not found with id: $id") }

    fun findByEmail(email: String): UserResponse =
        userRepository.findByEmail(email)
            .map { it.toResponse() }
            .orElseThrow { UserNotFoundException("User not found with email: $email") }

    fun create(dto: CreateUserDto): UserResponse {
        if (userRepository.existsByEmail(dto.email)) {
            throw UserAlreadyExistsException("User already exists with email: ${dto.email}")
        }

        val user = User(
            email = dto.email,
            name = dto.name,
            password = passwordEncoder.encode(dto.password)
        )

        return userRepository.save(user).toResponse()
    }

    fun update(id: Long, dto: UpdateUserDto): UserResponse {
        val user = userRepository.findById(id)
            .orElseThrow { UserNotFoundException("User not found with id: $id") }

        val updatedUser = user.copy(
            name = dto.name ?: user.name,
            email = dto.email ?: user.email,
            updatedAt = LocalDateTime.now()
        )

        return userRepository.save(updatedUser).toResponse()
    }

    fun delete(id: Long) {
        if (!userRepository.existsById(id)) {
            throw UserNotFoundException("User not found with id: $id")
        }
        userRepository.deleteById(id)
    }
}
```

### REST Controller

```kotlin
// controllers/UserController.kt
package com.example.demo.controllers

import com.example.demo.services.*
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class CreateUserRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Name is required")
    @field:Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    val name: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String
)

data class UpdateUserRequest(
    @field:Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    val name: String? = null,

    @field:Email(message = "Invalid email format")
    val email: String? = null
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {

    @GetMapping
    fun getAllUsers(): ResponseEntity<ApiResponse<List<UserResponse>>> {
        val users = userService.findAll()
        return ResponseEntity.ok(ApiResponse(success = true, data = users))
    }

    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.findById(id)
        return ResponseEntity.ok(ApiResponse(success = true, data = user))
    }

    @PostMapping
    fun createUser(
        @Valid @RequestBody request: CreateUserRequest
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.create(
            CreateUserDto(
                email = request.email,
                name = request.name,
                password = request.password
            )
        )
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse(success = true, data = user))
    }

    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserRequest
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.update(
            id,
            UpdateUserDto(name = request.name, email = request.email)
        )
        return ResponseEntity.ok(ApiResponse(success = true, data = user))
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteUser(@PathVariable id: Long) {
        userService.delete(id)
    }
}

// Exception handler
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException::class)
    fun handleUserNotFound(ex: UserNotFoundException): ResponseEntity<ApiResponse<Nothing>> {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApiResponse(success = false, message = ex.message))
    }

    @ExceptionHandler(UserAlreadyExistsException::class)
    fun handleUserAlreadyExists(ex: UserAlreadyExistsException): ResponseEntity<ApiResponse<Nothing>> {
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApiResponse(success = false, message = ex.message))
    }
}
```

## Coroutines for Asynchronous Programming

Kotlin coroutines provide a powerful way to handle asynchronous operations without the complexity of callbacks or the overhead of threads.

### Coroutine Basics

```kotlin
import kotlinx.coroutines.*
import kotlin.system.measureTimeMillis

// Basic coroutine example
fun main() = runBlocking {
    println("Starting...")

    // Launch multiple coroutines concurrently
    val time = measureTimeMillis {
        val deferred1 = async { fetchUser(1) }
        val deferred2 = async { fetchUser(2) }
        val deferred3 = async { fetchUser(3) }

        // Await all results
        val users = awaitAll(deferred1, deferred2, deferred3)
        users.forEach { println(it) }
    }

    println("Completed in $time ms")
}

suspend fun fetchUser(id: Int): String {
    delay(1000) // Simulate network call
    return "User $id"
}
```

### Structured Concurrency

```kotlin
import kotlinx.coroutines.*

class OrderService(
    private val userService: UserService,
    private val inventoryService: InventoryService,
    private val paymentService: PaymentService
) {
    // Using coroutineScope for structured concurrency
    suspend fun processOrder(orderId: String, userId: String): OrderResult {
        return coroutineScope {
            // Parallel fetches
            val userDeferred = async { userService.getUser(userId) }
            val inventoryDeferred = async { inventoryService.checkAvailability(orderId) }

            val user = userDeferred.await()
            val inventory = inventoryDeferred.await()

            // Sequential processing
            if (inventory.isAvailable) {
                val payment = paymentService.processPayment(user, inventory.total)
                OrderResult(success = true, transactionId = payment.id)
            } else {
                OrderResult(success = false, error = "Items not available")
            }
        }
    }
}

// Coroutine context and dispatchers
class BackgroundProcessor {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun processInBackground(data: List<String>) {
        scope.launch {
            data.forEach { item ->
                launch {
                    processItem(item)
                }
            }
        }
    }

    private suspend fun processItem(item: String) {
        withContext(Dispatchers.IO) {
            // Perform I/O operation
            println("Processing $item on ${Thread.currentThread().name}")
        }
    }

    fun shutdown() {
        scope.cancel()
    }
}
```

### Flow for Reactive Streams

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// Creating flows
fun numbers(): Flow<Int> = flow {
    for (i in 1..10) {
        delay(100)
        emit(i)
    }
}

// Flow operators
suspend fun processNumbers() {
    numbers()
        .filter { it % 2 == 0 }
        .map { it * it }
        .collect { println(it) }
}

// Real-world example: Event streaming
class EventService {
    private val _events = MutableSharedFlow<Event>()
    val events: SharedFlow<Event> = _events.asSharedFlow()

    suspend fun emit(event: Event) {
        _events.emit(event)
    }
}

data class Event(val type: String, val payload: Any)

class EventConsumer(private val eventService: EventService) {
    suspend fun subscribe() {
        eventService.events
            .filter { it.type == "ORDER_CREATED" }
            .onEach { event -> processEvent(event) }
            .catch { e -> handleError(e) }
            .collect()
    }

    private suspend fun processEvent(event: Event) {
        println("Processing event: $event")
    }

    private fun handleError(e: Throwable) {
        println("Error: ${e.message}")
    }
}

// StateFlow for state management
class UserStateManager {
    private val _state = MutableStateFlow<UserState>(UserState.Loading)
    val state: StateFlow<UserState> = _state.asStateFlow()

    suspend fun loadUser(id: String) {
        _state.value = UserState.Loading
        try {
            val user = fetchUser(id)
            _state.value = UserState.Success(user)
        } catch (e: Exception) {
            _state.value = UserState.Error(e.message ?: "Unknown error")
        }
    }

    private suspend fun fetchUser(id: String): User {
        delay(1000) // Simulate API call
        return User(id, "John Doe", "john@example.com")
    }
}

sealed class UserState {
    data object Loading : UserState()
    data class Success(val user: User) : UserState()
    data class Error(val message: String) : UserState()
}

data class User(val id: String, val name: String, val email: String)
```

### Coroutines in Ktor

```kotlin
// Ktor with coroutines
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.*

fun Route.asyncRoutes() {
    get("/api/dashboard") {
        // Parallel data fetching
        coroutineScope {
            val statsDeferred = async { fetchStats() }
            val recentOrdersDeferred = async { fetchRecentOrders() }
            val notificationsDeferred = async { fetchNotifications() }

            val dashboard = DashboardResponse(
                stats = statsDeferred.await(),
                recentOrders = recentOrdersDeferred.await(),
                notifications = notificationsDeferred.await()
            )

            call.respond(dashboard)
        }
    }

    // Streaming response with Flow
    get("/api/events/stream") {
        val flow = eventStream()
        call.respondTextWriter {
            flow.collect { event ->
                write("data: $event\n\n")
                flush()
            }
        }
    }
}

suspend fun fetchStats(): Stats = withContext(Dispatchers.IO) {
    delay(100)
    Stats(totalOrders = 1000, revenue = 50000.0)
}

suspend fun fetchRecentOrders(): List<Order> = withContext(Dispatchers.IO) {
    delay(150)
    listOf(Order("1", "Product A"), Order("2", "Product B"))
}

suspend fun fetchNotifications(): List<Notification> = withContext(Dispatchers.IO) {
    delay(80)
    listOf(Notification("New order received"))
}

fun eventStream(): Flow<String> = flow {
    var counter = 0
    while (true) {
        emit("Event ${counter++}")
        delay(1000)
    }
}

data class DashboardResponse(
    val stats: Stats,
    val recentOrders: List<Order>,
    val notifications: List<Notification>
)
data class Stats(val totalOrders: Int, val revenue: Double)
data class Order(val id: String, val product: String)
data class Notification(val message: String)
```

## Database Access with Exposed

Exposed is a lightweight SQL library for Kotlin developed by JetBrains. It provides both a typesafe SQL DSL and a lightweight DAO framework.

### Setting Up Exposed

```kotlin
// build.gradle.kts
val exposedVersion = "0.45.0"

dependencies {
    implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-dao:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-java-time:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-json:$exposedVersion")

    // Database drivers
    implementation("org.postgresql:postgresql:42.7.1")
    implementation("com.zaxxer:HikariCP:5.1.0")
}
```

### Database Configuration

```kotlin
// database/DatabaseFactory.kt
package com.example.database

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init(config: DatabaseConfig) {
        val dataSource = createHikariDataSource(config)
        Database.connect(dataSource)

        transaction {
            SchemaUtils.create(
                Users,
                Products,
                Orders,
                OrderItems
            )
        }
    }

    private fun createHikariDataSource(config: DatabaseConfig): HikariDataSource {
        val hikariConfig = HikariConfig().apply {
            driverClassName = "org.postgresql.Driver"
            jdbcUrl = config.url
            username = config.username
            password = config.password
            maximumPoolSize = config.maxPoolSize
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }
        return HikariDataSource(hikariConfig)
    }
}

data class DatabaseConfig(
    val url: String,
    val username: String,
    val password: String,
    val maxPoolSize: Int = 10
)
```

### Table Definitions (DSL Approach)

```kotlin
// database/Tables.kt
package com.example.database

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Users : UUIDTable("users") {
    val email = varchar("email", 255).uniqueIndex()
    val name = varchar("name", 100)
    val passwordHash = varchar("password_hash", 255)
    val role = varchar("role", 20).default("USER")
    val active = bool("active").default(true)
    val createdAt = datetime("created_at").default(LocalDateTime.now())
    val updatedAt = datetime("updated_at").default(LocalDateTime.now())
}

object Products : IntIdTable("products") {
    val name = varchar("name", 255)
    val description = text("description").nullable()
    val price = decimal("price", 10, 2)
    val stock = integer("stock").default(0)
    val category = varchar("category", 100)
    val createdAt = datetime("created_at").default(LocalDateTime.now())
}

object Orders : UUIDTable("orders") {
    val userId = reference("user_id", Users)
    val status = varchar("status", 20).default("PENDING")
    val totalAmount = decimal("total_amount", 10, 2)
    val shippingAddress = text("shipping_address")
    val createdAt = datetime("created_at").default(LocalDateTime.now())
    val updatedAt = datetime("updated_at").default(LocalDateTime.now())
}

object OrderItems : IntIdTable("order_items") {
    val orderId = reference("order_id", Orders)
    val productId = reference("product_id", Products)
    val quantity = integer("quantity")
    val unitPrice = decimal("unit_price", 10, 2)
}
```

### Repository with DSL

```kotlin
// repositories/UserRepository.kt
package com.example.repositories

import com.example.database.Users
import com.example.models.User
import com.example.models.UserRole
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import java.util.UUID

class UserRepository {

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }

    suspend fun findAll(): List<User> = dbQuery {
        Users.selectAll()
            .map { it.toUser() }
    }

    suspend fun findById(id: UUID): User? = dbQuery {
        Users.selectAll()
            .where { Users.id eq id }
            .map { it.toUser() }
            .singleOrNull()
    }

    suspend fun findByEmail(email: String): User? = dbQuery {
        Users.selectAll()
            .where { Users.email eq email }
            .map { it.toUser() }
            .singleOrNull()
    }

    suspend fun create(user: User): User = dbQuery {
        val id = Users.insert {
            it[email] = user.email
            it[name] = user.name
            it[passwordHash] = user.passwordHash
            it[role] = user.role.name
            it[active] = user.active
        } get Users.id

        user.copy(id = id.value)
    }

    suspend fun update(id: UUID, user: User): Boolean = dbQuery {
        Users.update({ Users.id eq id }) {
            it[email] = user.email
            it[name] = user.name
            it[role] = user.role.name
            it[active] = user.active
            it[updatedAt] = java.time.LocalDateTime.now()
        } > 0
    }

    suspend fun delete(id: UUID): Boolean = dbQuery {
        Users.deleteWhere { Users.id eq id } > 0
    }

    suspend fun search(query: String, limit: Int = 20): List<User> = dbQuery {
        Users.selectAll()
            .where {
                (Users.name like "%$query%") or
                (Users.email like "%$query%")
            }
            .limit(limit)
            .map { it.toUser() }
    }

    private fun ResultRow.toUser() = User(
        id = this[Users.id].value,
        email = this[Users.email],
        name = this[Users.name],
        passwordHash = this[Users.passwordHash],
        role = UserRole.valueOf(this[Users.role]),
        active = this[Users.active],
        createdAt = this[Users.createdAt],
        updatedAt = this[Users.updatedAt]
    )
}

// Model
data class User(
    val id: UUID = UUID.randomUUID(),
    val email: String,
    val name: String,
    val passwordHash: String,
    val role: UserRole = UserRole.USER,
    val active: Boolean = true,
    val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now(),
    val updatedAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)

enum class UserRole { USER, ADMIN, MODERATOR }
```

### DAO Approach with Exposed

```kotlin
// database/dao/Entities.kt
package com.example.database.dao

import com.example.database.Products
import com.example.database.Orders
import com.example.database.OrderItems
import com.example.database.Users
import org.jetbrains.exposed.dao.*
import org.jetbrains.exposed.dao.id.EntityID
import java.util.UUID

class UserEntity(id: EntityID<UUID>) : UUIDEntity(id) {
    companion object : UUIDEntityClass<UserEntity>(Users)

    var email by Users.email
    var name by Users.name
    var passwordHash by Users.passwordHash
    var role by Users.role
    var active by Users.active
    var createdAt by Users.createdAt
    var updatedAt by Users.updatedAt

    val orders by OrderEntity referrersOn Orders.userId
}

class ProductEntity(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<ProductEntity>(Products)

    var name by Products.name
    var description by Products.description
    var price by Products.price
    var stock by Products.stock
    var category by Products.category
    var createdAt by Products.createdAt
}

class OrderEntity(id: EntityID<UUID>) : UUIDEntity(id) {
    companion object : UUIDEntityClass<OrderEntity>(Orders)

    var user by UserEntity referencedOn Orders.userId
    var status by Orders.status
    var totalAmount by Orders.totalAmount
    var shippingAddress by Orders.shippingAddress
    var createdAt by Orders.createdAt
    var updatedAt by Orders.updatedAt

    val items by OrderItemEntity referrersOn OrderItems.orderId
}

class OrderItemEntity(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<OrderItemEntity>(OrderItems)

    var order by OrderEntity referencedOn OrderItems.orderId
    var product by ProductEntity referencedOn OrderItems.productId
    var quantity by OrderItems.quantity
    var unitPrice by OrderItems.unitPrice
}
```

### Complex Queries

```kotlin
// repositories/OrderRepository.kt
package com.example.repositories

import com.example.database.*
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

class OrderRepository {

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }

    // Join query
    suspend fun getOrderWithDetails(orderId: UUID) = dbQuery {
        (Orders innerJoin Users innerJoin OrderItems innerJoin Products)
            .selectAll()
            .where { Orders.id eq orderId }
            .map { row ->
                OrderWithDetails(
                    orderId = row[Orders.id].value,
                    userEmail = row[Users.email],
                    userName = row[Users.name],
                    status = row[Orders.status],
                    totalAmount = row[Orders.totalAmount],
                    items = listOf(
                        OrderItemDetail(
                            productName = row[Products.name],
                            quantity = row[OrderItems.quantity],
                            unitPrice = row[OrderItems.unitPrice]
                        )
                    )
                )
            }
            .firstOrNull()
    }

    // Aggregation query
    suspend fun getSalesReport(startDate: LocalDateTime, endDate: LocalDateTime) = dbQuery {
        Orders
            .slice(
                Orders.status,
                Orders.totalAmount.sum(),
                Orders.id.count()
            )
            .selectAll()
            .where {
                (Orders.createdAt greaterEq startDate) and
                (Orders.createdAt lessEq endDate)
            }
            .groupBy(Orders.status)
            .map { row ->
                SalesReport(
                    status = row[Orders.status],
                    totalRevenue = row[Orders.totalAmount.sum()] ?: BigDecimal.ZERO,
                    orderCount = row[Orders.id.count()]
                )
            }
    }

    // Subquery
    suspend fun getUsersWithOrders() = dbQuery {
        val orderCount = Orders
            .slice(Orders.userId, Orders.id.count())
            .selectAll()
            .groupBy(Orders.userId)
            .alias("order_counts")

        Users
            .join(orderCount, JoinType.LEFT, Users.id, orderCount[Orders.userId])
            .slice(Users.name, Users.email, orderCount[Orders.id.count()])
            .selectAll()
            .map { row ->
                UserOrderSummary(
                    name = row[Users.name],
                    email = row[Users.email],
                    orderCount = row[orderCount[Orders.id.count()]] ?: 0
                )
            }
    }

    // Batch insert
    suspend fun createOrderWithItems(
        userId: UUID,
        items: List<CreateOrderItem>,
        shippingAddress: String
    ): UUID = dbQuery {
        val totalAmount = items.sumOf { it.unitPrice * it.quantity.toBigDecimal() }

        val orderId = Orders.insert {
            it[Orders.userId] = userId
            it[status] = "PENDING"
            it[Orders.totalAmount] = totalAmount
            it[Orders.shippingAddress] = shippingAddress
        } get Orders.id

        OrderItems.batchInsert(items) { item ->
            this[OrderItems.orderId] = orderId
            this[OrderItems.productId] = item.productId
            this[OrderItems.quantity] = item.quantity
            this[OrderItems.unitPrice] = item.unitPrice
        }

        orderId.value
    }
}

data class OrderWithDetails(
    val orderId: UUID,
    val userEmail: String,
    val userName: String,
    val status: String,
    val totalAmount: BigDecimal,
    val items: List<OrderItemDetail>
)

data class OrderItemDetail(
    val productName: String,
    val quantity: Int,
    val unitPrice: BigDecimal
)

data class SalesReport(
    val status: String,
    val totalRevenue: BigDecimal,
    val orderCount: Long
)

data class UserOrderSummary(
    val name: String,
    val email: String,
    val orderCount: Long
)

data class CreateOrderItem(
    val productId: Int,
    val quantity: Int,
    val unitPrice: BigDecimal
)
```

## Testing Kotlin Backend Applications

### Testing Ktor Applications

```kotlin
// test/ApplicationTest.kt
package com.example

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import kotlin.test.*

class ApplicationTest {

    @Test
    fun testRoot() = testApplication {
        application {
            configurePlugins()
            configureRouting()
        }

        client.get("/").apply {
            assertEquals(HttpStatusCode.OK, status)
            assertEquals("Hello, Kotlin Backend!", bodyAsText())
        }
    }

    @Test
    fun testHealthCheck() = testApplication {
        application {
            configurePlugins()
            configureRouting()
        }

        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }

        client.get("/health").apply {
            assertEquals(HttpStatusCode.OK, status)
            assertTrue(bodyAsText().contains("healthy"))
        }
    }

    @Test
    fun testCreateUser() = testApplication {
        application {
            configurePlugins()
            configureRouting()
        }

        val client = createClient {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }

        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody("""{"name": "Test User", "email": "test@example.com"}""")
        }.apply {
            assertEquals(HttpStatusCode.Created, status)
        }
    }
}
```

### Testing with MockK

```kotlin
// test/services/UserServiceTest.kt
package com.example.services

import com.example.repositories.UserRepository
import com.example.models.User
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class UserServiceTest {

    private lateinit var userRepository: UserRepository
    private lateinit var userService: UserService

    @BeforeEach
    fun setup() {
        userRepository = mockk()
        userService = UserService(userRepository)
    }

    @Test
    fun `findById returns user when exists`() = runTest {
        val userId = UUID.randomUUID()
        val expectedUser = User(
            id = userId,
            email = "test@example.com",
            name = "Test User",
            passwordHash = "hash"
        )

        coEvery { userRepository.findById(userId) } returns expectedUser

        val result = userService.findById(userId)

        assertEquals(expectedUser, result)
        coVerify(exactly = 1) { userRepository.findById(userId) }
    }

    @Test
    fun `findById throws exception when user not found`() = runTest {
        val userId = UUID.randomUUID()

        coEvery { userRepository.findById(userId) } returns null

        assertFailsWith<UserNotFoundException> {
            userService.findById(userId)
        }
    }

    @Test
    fun `create user saves and returns user`() = runTest {
        val createDto = CreateUserDto(
            email = "new@example.com",
            name = "New User",
            password = "password123"
        )

        coEvery { userRepository.findByEmail(any()) } returns null
        coEvery { userRepository.create(any()) } answers {
            firstArg<User>().copy(id = UUID.randomUUID())
        }

        val result = userService.create(createDto)

        assertEquals(createDto.email, result.email)
        assertEquals(createDto.name, result.name)
        coVerify { userRepository.create(any()) }
    }
}
```

## Best Practices

### Code Organization

```kotlin
// Use sealed classes for representing states
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

// Extension function for Result handling
inline fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> = when (this) {
    is Result.Success -> Result.Success(transform(data))
    is Result.Error -> this
    is Result.Loading -> this
}

// Use inline value classes for type safety
@JvmInline
value class UserId(val value: UUID)

@JvmInline
value class Email(val value: String) {
    init {
        require(value.contains("@")) { "Invalid email format" }
    }
}

// Repository pattern with interface
interface Repository<T, ID> {
    suspend fun findById(id: ID): T?
    suspend fun findAll(): List<T>
    suspend fun save(entity: T): T
    suspend fun delete(id: ID): Boolean
}
```

### Dependency Injection with Koin

```kotlin
// di/AppModule.kt
package com.example.di

import com.example.repositories.*
import com.example.services.*
import org.koin.dsl.module

val appModule = module {
    // Repositories
    single { UserRepository() }
    single { ProductRepository() }
    single { OrderRepository() }

    // Services
    single { UserService(get()) }
    single { ProductService(get()) }
    single { OrderService(get(), get(), get()) }
}

// Application.kt
import org.koin.ktor.plugin.Koin

fun Application.configureKoin() {
    install(Koin) {
        modules(appModule)
    }
}

// Usage in routes
fun Route.userRoutes() {
    val userService by inject<UserService>()

    get("/api/users/{id}") {
        val id = call.parameters["id"]!!
        val user = userService.findById(UUID.fromString(id))
        call.respond(user)
    }
}
```

### Configuration Management

```kotlin
// config/AppConfig.kt
package com.example.config

import com.typesafe.config.ConfigFactory
import io.ktor.server.config.*

data class AppConfig(
    val database: DatabaseConfig,
    val jwt: JwtConfig,
    val server: ServerConfig
)

data class DatabaseConfig(
    val url: String,
    val username: String,
    val password: String,
    val maxPoolSize: Int
)

data class JwtConfig(
    val secret: String,
    val issuer: String,
    val audience: String,
    val expirationMs: Long
)

data class ServerConfig(
    val port: Int,
    val host: String
)

fun loadConfig(): AppConfig {
    val config = ConfigFactory.load()

    return AppConfig(
        database = DatabaseConfig(
            url = config.getString("database.url"),
            username = config.getString("database.username"),
            password = config.getString("database.password"),
            maxPoolSize = config.getInt("database.maxPoolSize")
        ),
        jwt = JwtConfig(
            secret = config.getString("jwt.secret"),
            issuer = config.getString("jwt.issuer"),
            audience = config.getString("jwt.audience"),
            expirationMs = config.getLong("jwt.expirationMs")
        ),
        server = ServerConfig(
            port = config.getInt("server.port"),
            host = config.getString("server.host")
        )
    )
}
```

```hocon
# resources/application.conf
server {
    port = 8080
    port = ${?PORT}
    host = "0.0.0.0"
}

database {
    url = "jdbc:postgresql://localhost:5432/myapp"
    url = ${?DATABASE_URL}
    username = "postgres"
    username = ${?DATABASE_USERNAME}
    password = "password"
    password = ${?DATABASE_PASSWORD}
    maxPoolSize = 10
}

jwt {
    secret = "your-secret-key"
    secret = ${?JWT_SECRET}
    issuer = "myapp"
    audience = "myapp-users"
    expirationMs = 3600000
}
```

### Error Handling Patterns

```kotlin
// Use Result type for operations that can fail
class UserService(private val repository: UserRepository) {

    suspend fun findByIdSafe(id: UUID): Result<User> = runCatching {
        repository.findById(id) ?: throw UserNotFoundException("User not found: $id")
    }.fold(
        onSuccess = { Result.Success(it) },
        onFailure = { Result.Error(it) }
    )

    suspend fun createSafe(dto: CreateUserDto): Result<User> = try {
        val user = repository.create(dto.toUser())
        Result.Success(user)
    } catch (e: Exception) {
        Result.Error(e)
    }
}

// Extension for handling results in routes
suspend inline fun <reified T> ApplicationCall.respondResult(result: Result<T>) {
    when (result) {
        is Result.Success -> respond(HttpStatusCode.OK, result.data)
        is Result.Error -> respond(
            HttpStatusCode.InternalServerError,
            ErrorResponse(result.exception.message ?: "Unknown error")
        )
        is Result.Loading -> respond(HttpStatusCode.Accepted)
    }
}
```

### Logging Best Practices

```kotlin
// Use structured logging
import org.slf4j.LoggerFactory

class OrderService(private val orderRepository: OrderRepository) {
    private val logger = LoggerFactory.getLogger(OrderService::class.java)

    suspend fun createOrder(request: CreateOrderRequest): Order {
        logger.info("Creating order for user: {}", request.userId)

        return try {
            val order = orderRepository.create(request)
            logger.info(
                "Order created successfully. orderId={}, userId={}, amount={}",
                order.id,
                order.userId,
                order.totalAmount
            )
            order
        } catch (e: Exception) {
            logger.error(
                "Failed to create order for user: {}. Error: {}",
                request.userId,
                e.message,
                e
            )
            throw e
        }
    }
}
```

## Performance Optimization

### Connection Pooling

```kotlin
// Optimized HikariCP configuration
fun createOptimizedDataSource(config: DatabaseConfig): HikariDataSource {
    return HikariDataSource(HikariConfig().apply {
        jdbcUrl = config.url
        username = config.username
        password = config.password

        // Pool sizing
        maximumPoolSize = config.maxPoolSize
        minimumIdle = config.maxPoolSize / 2

        // Connection timeout
        connectionTimeout = 30000
        idleTimeout = 600000
        maxLifetime = 1800000

        // Performance
        addDataSourceProperty("cachePrepStmts", "true")
        addDataSourceProperty("prepStmtCacheSize", "250")
        addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
        addDataSourceProperty("useServerPrepStmts", "true")
    })
}
```

### Caching with Caffeine

```kotlin
// services/CachedUserService.kt
import com.github.benmanes.caffeine.cache.Caffeine
import java.util.concurrent.TimeUnit

class CachedUserService(private val userRepository: UserRepository) {

    private val userCache = Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build<UUID, User>()

    suspend fun findById(id: UUID): User? {
        return userCache.getIfPresent(id) ?: run {
            userRepository.findById(id)?.also { user ->
                userCache.put(id, user)
            }
        }
    }

    suspend fun invalidate(id: UUID) {
        userCache.invalidate(id)
    }

    suspend fun update(id: UUID, dto: UpdateUserDto): User {
        val updated = userRepository.update(id, dto)
        userCache.put(id, updated)
        return updated
    }
}
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle shadowJar --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=jdbc:postgresql://db:5432/myapp
      - DATABASE_USERNAME=postgres
      - DATABASE_PASSWORD=password
      - JWT_SECRET=your-production-secret
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Summary

Kotlin provides a modern, expressive, and safe language for backend development. Key takeaways:

1. **Choose the Right Framework**: Ktor for lightweight, coroutine-first applications; Spring Boot for enterprise applications with extensive ecosystem needs

2. **Leverage Coroutines**: Use coroutines for efficient asynchronous programming without callback complexity

3. **Type Safety**: Utilize Kotlin's null safety, sealed classes, and inline classes for safer code

4. **Exposed for Database**: Use Exposed's DSL or DAO approach for type-safe database operations

5. **Testing**: Take advantage of Kotlin's testing capabilities with libraries like MockK

6. **Best Practices**: Follow established patterns for error handling, dependency injection, and configuration management

Kotlin's combination of expressiveness, safety features, and JVM compatibility makes it an excellent choice for building robust, maintainable backend services.
