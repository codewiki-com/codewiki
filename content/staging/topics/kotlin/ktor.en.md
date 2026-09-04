---
title: Kotlin Ktor Framework
description: Learn Ktor for Kotlin async web development including server and client
track: kotlin
section: tooling
difficulty: intermediate
tags:
  - Kotlin
  - Ktor
  - Web
  - async
status: imported
origin: old/src/content/docs/kotlin/ktor.en.md
divergence: 0.204
issues: []
legacy:
  category: Kotlin
  subcategory: Web Development
  order: 16
  lastUpdated: 2026-01-07
---

Ktor is a modern, asynchronous framework for building connected applications in Kotlin. Developed by JetBrains, it leverages Kotlin's coroutines to provide a lightweight, flexible approach to creating servers, clients, and microservices. This comprehensive guide covers both server-side and client-side development with Ktor.

## Introduction to Ktor

### What is Ktor?

Ktor is an asynchronous framework for creating microservices, web applications, and HTTP clients. Built from the ground up using Kotlin and coroutines, it provides:

- **Lightweight architecture**: No heavy containers or complex configurations
- **Asynchronous by design**: Built on Kotlin coroutines for non-blocking I/O
- **Multiplatform support**: Works on JVM, JavaScript, and Native platforms
- **Extensible plugin system**: Add only the features you need
- **Type-safe DSL**: Kotlin-idiomatic configuration and routing

### Why Choose Ktor?

Compared to traditional frameworks like Spring Boot, Ktor offers:

```kotlin
// Minimal Ktor server - incredibly simple
fun main() {
    embeddedServer(Netty, port = 8080) {
        routing {
            get("/") {
                call.respondText("Hello, World!")
            }
        }
    }.start(wait = true)
}
```

Key advantages:

- **Minimal boilerplate**: No annotations or reflection required
- **Fast startup**: Lightweight runtime means quick application starts
- **Coroutine-native**: Seamless integration with Kotlin's concurrency model
- **Flexible**: Use only what you need through the plugin system
- **Testable**: Built-in testing utilities and mockable components

### Ktor Architecture

Ktor applications are built around these core concepts:

- **Application**: The main entry point that hosts the server
- **Engine**: The underlying HTTP server (Netty, Jetty, CIO, etc.)
- **Plugins**: Modular features like authentication, serialization, and logging
- **Routing**: Defines how requests are handled
- **Pipeline**: Request/response processing chain

## Project Setup

### Gradle Configuration

Create a new Ktor project with the following `build.gradle.kts`:

```kotlin
plugins {
    kotlin("jvm") version "2.0.0"
    kotlin("plugin.serialization") version "2.0.0"
    id("io.ktor.plugin") version "3.1.1"
}

group = "com.example"
version = "1.0.0"

application {
    mainClass.set("com.example.ApplicationKt")
}

repositories {
    mavenCentral()
}

dependencies {
    // Ktor server
    implementation("io.ktor:ktor-server-core:3.1.1")
    implementation("io.ktor:ktor-server-netty:3.1.1")
    implementation("io.ktor:ktor-server-content-negotiation:3.1.1")
    implementation("io.ktor:ktor-serialization-kotlinx-json:3.1.1")

    // Ktor client
    implementation("io.ktor:ktor-client-core:3.1.1")
    implementation("io.ktor:ktor-client-cio:3.1.1")
    implementation("io.ktor:ktor-client-content-negotiation:3.1.1")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.5.6")

    // Testing
    testImplementation("io.ktor:ktor-server-test-host:3.1.1")
    testImplementation("org.jetbrains.kotlin:kotlin-test:2.0.0")
}
```

### Project Structure

A typical Ktor project follows this structure:

```
src/
├── main/
│   ├── kotlin/
│   │   └── com/example/
│   │       ├── Application.kt
│   │       ├── plugins/
│   │       │   ├── Routing.kt
│   │       │   ├── Serialization.kt
│   │       │   └── Security.kt
│   │       ├── routes/
│   │       │   ├── UserRoutes.kt
│   │       │   └── TaskRoutes.kt
│   │       └── models/
│   │           └── User.kt
│   └── resources/
│       ├── application.conf
│       └── logback.xml
└── test/
    └── kotlin/
        └── com/example/
            └── ApplicationTest.kt
```

### Application Entry Point

```kotlin
// Application.kt
package com.example

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import com.example.plugins.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configureRouting()
        configureSerialization()
        configureSecurity()
    }.start(wait = true)
}
```

### Configuration with HOCON

Ktor uses HOCON format for configuration. Create `application.conf`:

```hocon
ktor {
    deployment {
        port = 8080
        port = ${?PORT}
        host = "0.0.0.0"
    }
    application {
        modules = [ com.example.ApplicationKt.module ]
    }
}

database {
    url = "jdbc:postgresql://localhost:5432/mydb"
    driver = "org.postgresql.Driver"
    user = "postgres"
    password = ${?DB_PASSWORD}
}

jwt {
    secret = ${?JWT_SECRET}
    issuer = "example.com"
    audience = "example-audience"
    realm = "example-realm"
}
```

Using configuration-based startup:

```kotlin
// Application.kt
package com.example

import io.ktor.server.application.*
import io.ktor.server.netty.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    configureRouting()
    configureSerialization()
    configureSecurity()
}
```

## Server Fundamentals

### Embedded Server vs Engine Main

Ktor offers two ways to start a server:

**Embedded Server** - Programmatic configuration:

```kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        // Configure application
    }.start(wait = true)
}
```

**Engine Main** - Configuration file based:

```kotlin
fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    // Configure application
}
```

### Available Engines

Ktor supports multiple HTTP engines:

```kotlin
// Netty - High performance, production ready
embeddedServer(Netty, port = 8080) { }

// CIO - Coroutine-based I/O, pure Kotlin
embeddedServer(CIO, port = 8080) { }

// Jetty - Mature servlet container
embeddedServer(Jetty, port = 8080) { }

// Tomcat - Servlet container
embeddedServer(Tomcat, port = 8080) { }
```

### Plugins (Features)

Plugins add functionality to your application:

```kotlin
fun Application.module() {
    // Install plugins
    install(ContentNegotiation) {
        json()
    }

    install(CallLogging) {
        level = Level.INFO
        filter { call -> call.request.path().startsWith("/api") }
    }

    install(CORS) {
        allowHost("example.com")
        allowHeader(HttpHeaders.ContentType)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
    }

    install(DefaultHeaders) {
        header("X-Engine", "Ktor")
    }
}
```

### Application Events

Monitor application lifecycle:

```kotlin
fun Application.module() {
    environment.monitor.subscribe(ApplicationStarted) {
        log.info("Application started")
    }

    environment.monitor.subscribe(ApplicationStopped) {
        log.info("Application stopped")
        // Cleanup resources
    }
}
```

## Routing

### Basic Routing

Define routes using Ktor's type-safe DSL:

```kotlin
fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Hello, World!")
        }

        get("/hello/{name}") {
            val name = call.parameters["name"] ?: "Guest"
            call.respondText("Hello, $name!")
        }

        post("/users") {
            // Handle user creation
        }

        put("/users/{id}") {
            // Handle user update
        }

        delete("/users/{id}") {
            // Handle user deletion
        }
    }
}
```

### Route Organization

Organize routes into separate files:

```kotlin
// routes/UserRoutes.kt
fun Route.userRoutes() {
    route("/users") {
        get {
            val users = userRepository.findAll()
            call.respond(users)
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
                ?: throw BadRequestException("Invalid user ID")

            val user = userRepository.findById(id)
                ?: throw NotFoundException("User not found")

            call.respond(user)
        }

        post {
            val request = call.receive<CreateUserRequest>()
            val user = userRepository.create(request)
            call.respond(HttpStatusCode.Created, user)
        }

        put("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
                ?: throw BadRequestException("Invalid user ID")
            val request = call.receive<UpdateUserRequest>()
            val user = userRepository.update(id, request)
            call.respond(user)
        }

        delete("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
                ?: throw BadRequestException("Invalid user ID")
            userRepository.delete(id)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

// Application.kt
fun Application.configureRouting() {
    routing {
        userRoutes()
        taskRoutes()
        productRoutes()
    }
}
```

### Route Parameters

Handle different types of parameters:

```kotlin
routing {
    // Path parameters
    get("/users/{id}") {
        val id = call.parameters["id"]
    }

    // Optional parameters
    get("/users/{id?}") {
        val id = call.parameters["id"] // Can be null
    }

    // Wildcard parameters
    get("/files/{path...}") {
        val path = call.parameters.getAll("path") // List of path segments
    }

    // Query parameters
    get("/search") {
        val query = call.request.queryParameters["q"]
        val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
        val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
    }
}
```

### Type-Safe Routing

Use type-safe routes with the Resources plugin:

```kotlin
// Define resources
@Resource("/users")
class Users {
    @Resource("{id}")
    class Id(val parent: Users = Users(), val id: Long)

    @Resource("search")
    class Search(val parent: Users = Users(), val query: String, val page: Int = 1)
}

// Install plugin
fun Application.module() {
    install(Resources)

    routing {
        get<Users> {
            call.respond(userRepository.findAll())
        }

        get<Users.Id> { user ->
            val foundUser = userRepository.findById(user.id)
            call.respond(foundUser)
        }

        get<Users.Search> { search ->
            val results = userRepository.search(search.query, search.page)
            call.respond(results)
        }
    }
}
```

## Request Handling

### Receiving Request Body

Parse request bodies using content negotiation:

```kotlin
@Serializable
data class CreateTaskRequest(
    val name: String,
    val description: String,
    val priority: Priority
)

post("/tasks") {
    val request = call.receive<CreateTaskRequest>()

    // Validate
    if (request.name.isBlank()) {
        throw BadRequestException("Task name cannot be empty")
    }

    val task = taskRepository.create(request)
    call.respond(HttpStatusCode.Created, task)
}
```

### Form Data

Handle form submissions:

```kotlin
post("/login") {
    val formParameters = call.receiveParameters()
    val username = formParameters["username"] ?: throw BadRequestException("Missing username")
    val password = formParameters["password"] ?: throw BadRequestException("Missing password")

    val user = authService.authenticate(username, password)
    call.respond(mapOf("token" to generateToken(user)))
}
```

### Multipart File Uploads

Handle file uploads:

```kotlin
post("/upload") {
    val multipart = call.receiveMultipart()
    var fileName: String? = null
    var fileBytes: ByteArray? = null

    multipart.forEachPart { part ->
        when (part) {
            is PartData.FormItem -> {
                // Handle form field
                println("${part.name} = ${part.value}")
            }
            is PartData.FileItem -> {
                fileName = part.originalFileName
                fileBytes = part.streamProvider().readBytes()
            }
            else -> {}
        }
        part.dispose()
    }

    if (fileName != null && fileBytes != null) {
        // Save file
        File("uploads/$fileName").writeBytes(fileBytes!!)
        call.respond(mapOf("filename" to fileName))
    } else {
        throw BadRequestException("No file uploaded")
    }
}
```

### Request Validation

Implement validation with a custom approach:

```kotlin
// Validation result
sealed class ValidationResult<out T> {
    data class Valid<T>(val value: T) : ValidationResult<T>()
    data class Invalid(val errors: List<String>) : ValidationResult<Nothing>()
}

// Validator
inline fun <reified T : Any> validateRequest(
    request: T,
    block: ValidationBuilder<T>.() -> Unit
): ValidationResult<T> {
    val builder = ValidationBuilder(request)
    builder.block()
    return if (builder.errors.isEmpty()) {
        ValidationResult.Valid(request)
    } else {
        ValidationResult.Invalid(builder.errors)
    }
}

class ValidationBuilder<T>(private val request: T) {
    val errors = mutableListOf<String>()

    fun require(condition: Boolean, message: String) {
        if (!condition) errors.add(message)
    }

    fun requireNotBlank(value: String?, fieldName: String) {
        if (value.isNullOrBlank()) {
            errors.add("$fieldName cannot be blank")
        }
    }

    fun requireEmail(value: String?, fieldName: String) {
        val emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$".toRegex()
        if (value == null || !emailRegex.matches(value)) {
            errors.add("$fieldName must be a valid email address")
        }
    }
}

// Usage
post("/users") {
    val request = call.receive<CreateUserRequest>()

    when (val result = validateRequest(request) {
        requireNotBlank(request.name, "name")
        requireEmail(request.email, "email")
        require(request.age >= 18, "User must be at least 18 years old")
    }) {
        is ValidationResult.Valid -> {
            val user = userRepository.create(request)
            call.respond(HttpStatusCode.Created, user)
        }
        is ValidationResult.Invalid -> {
            call.respond(HttpStatusCode.BadRequest, mapOf("errors" to result.errors))
        }
    }
}
```

## Response Generation

### Text Responses

```kotlin
get("/text") {
    call.respondText("Plain text response")
}

get("/html") {
    call.respondText(
        "<html><body><h1>Hello!</h1></body></html>",
        ContentType.Text.Html
    )
}
```

### JSON Responses

```kotlin
@Serializable
data class User(
    val id: Long,
    val name: String,
    val email: String
)

get("/user/{id}") {
    val user = userRepository.findById(call.parameters["id"]!!.toLong())
    call.respond(user) // Automatically serialized to JSON
}

get("/users") {
    val users = userRepository.findAll()
    call.respond(mapOf("data" to users, "count" to users.size))
}
```

### File Responses

```kotlin
get("/download/{filename}") {
    val filename = call.parameters["filename"]!!
    val file = File("uploads/$filename")

    if (file.exists()) {
        call.response.header(
            HttpHeaders.ContentDisposition,
            ContentDisposition.Attachment.withParameter(
                ContentDisposition.Parameters.FileName, filename
            ).toString()
        )
        call.respondFile(file)
    } else {
        call.respond(HttpStatusCode.NotFound, "File not found")
    }
}
```

### Redirects

```kotlin
get("/old-page") {
    call.respondRedirect("/new-page", permanent = true)
}

get("/temporary-redirect") {
    call.respondRedirect("/target", permanent = false)
}
```

### Status Codes

```kotlin
post("/users") {
    val user = userRepository.create(request)
    call.respond(HttpStatusCode.Created, user)
}

delete("/users/{id}") {
    userRepository.delete(id)
    call.respond(HttpStatusCode.NoContent)
}

get("/users/{id}") {
    val user = userRepository.findById(id)
    if (user != null) {
        call.respond(user)
    } else {
        call.respond(HttpStatusCode.NotFound, ErrorResponse("User not found"))
    }
}
```

### Exception Handling

Install status pages for centralized error handling:

```kotlin
fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<BadRequestException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(cause.message ?: "Bad request"))
        }

        exception<NotFoundException> { call, cause ->
            call.respond(HttpStatusCode.NotFound, ErrorResponse(cause.message ?: "Not found"))
        }

        exception<AuthenticationException> { call, cause ->
            call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Authentication required"))
        }

        exception<AuthorizationException> { call, cause ->
            call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
        }

        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse("An unexpected error occurred")
            )
        }

        status(HttpStatusCode.NotFound) { call, status ->
            call.respond(status, ErrorResponse("Resource not found"))
        }
    }
}

@Serializable
data class ErrorResponse(val message: String)

// Custom exceptions
class BadRequestException(message: String) : RuntimeException(message)
class NotFoundException(message: String) : RuntimeException(message)
class AuthenticationException(message: String) : RuntimeException(message)
class AuthorizationException(message: String) : RuntimeException(message)
```

## Content Negotiation and Serialization

### JSON with kotlinx.serialization

```kotlin
fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            encodeDefaults = true
            explicitNulls = false
        })
    }
}
```

### Custom Serializers

```kotlin
@Serializable
data class Task(
    val id: Long,
    val name: String,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    val priority: Priority
)

object InstantSerializer : KSerializer<Instant> {
    override val descriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: Instant) {
        encoder.encodeString(value.toString())
    }

    override fun deserialize(decoder: Decoder): Instant {
        return Instant.parse(decoder.decodeString())
    }
}

@Serializable
enum class Priority {
    @SerialName("low") Low,
    @SerialName("medium") Medium,
    @SerialName("high") High,
    @SerialName("vital") Vital
}
```

### Multiple Content Types

Support multiple serialization formats:

```kotlin
install(ContentNegotiation) {
    json()
    xml()
    cbor()
}
```

## Authentication and Security

### JWT Authentication

```kotlin
fun Application.configureSecurity() {
    val jwtSecret = environment.config.property("jwt.secret").getString()
    val jwtIssuer = environment.config.property("jwt.issuer").getString()
    val jwtAudience = environment.config.property("jwt.audience").getString()
    val jwtRealm = environment.config.property("jwt.realm").getString()

    install(Authentication) {
        jwt("auth-jwt") {
            realm = jwtRealm
            verifier(
                JWT.require(Algorithm.HMAC256(jwtSecret))
                    .withAudience(jwtAudience)
                    .withIssuer(jwtIssuer)
                    .build()
            )
            validate { credential ->
                if (credential.payload.getClaim("username").asString() != "") {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
            challenge { defaultScheme, realm ->
                call.respond(HttpStatusCode.Unauthorized, "Token is not valid or has expired")
            }
        }
    }
}

// Token generation
fun generateToken(user: User, config: JWTConfig): String {
    return JWT.create()
        .withAudience(config.audience)
        .withIssuer(config.issuer)
        .withClaim("username", user.username)
        .withClaim("userId", user.id)
        .withExpiresAt(Date(System.currentTimeMillis() + 3600000)) // 1 hour
        .sign(Algorithm.HMAC256(config.secret))
}

// Protected routes
routing {
    authenticate("auth-jwt") {
        get("/protected") {
            val principal = call.principal<JWTPrincipal>()
            val username = principal!!.payload.getClaim("username").asString()
            call.respond(mapOf("message" to "Hello, $username!"))
        }
    }

    post("/login") {
        val request = call.receive<LoginRequest>()
        val user = userRepository.authenticate(request.username, request.password)
            ?: throw AuthenticationException("Invalid credentials")

        val token = generateToken(user, jwtConfig)
        call.respond(mapOf("token" to token))
    }
}
```

### Basic Authentication

```kotlin
install(Authentication) {
    basic("auth-basic") {
        realm = "Access to the API"
        validate { credentials ->
            if (userRepository.authenticate(credentials.name, credentials.password)) {
                UserIdPrincipal(credentials.name)
            } else {
                null
            }
        }
    }
}
```

### Session Authentication

```kotlin
data class UserSession(val userId: Long, val username: String)

fun Application.configureSession() {
    install(Sessions) {
        cookie<UserSession>("user_session") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 3600
            cookie.secure = true
            cookie.httpOnly = true
            transform(SessionTransportTransformerMessageAuthentication(
                hex("your-secret-key")
            ))
        }
    }

    install(Authentication) {
        session<UserSession>("auth-session") {
            validate { session ->
                session // Return session if valid
            }
            challenge {
                call.respond(HttpStatusCode.Unauthorized)
            }
        }
    }
}

// Usage
post("/login") {
    val request = call.receive<LoginRequest>()
    val user = userRepository.authenticate(request)

    call.sessions.set(UserSession(user.id, user.username))
    call.respond(mapOf("message" to "Logged in"))
}

post("/logout") {
    call.sessions.clear<UserSession>()
    call.respond(mapOf("message" to "Logged out"))
}

authenticate("auth-session") {
    get("/profile") {
        val session = call.sessions.get<UserSession>()!!
        call.respond(userRepository.findById(session.userId))
    }
}
```

### CORS Configuration

```kotlin
install(CORS) {
    allowHost("example.com", schemes = listOf("https"))
    allowHost("localhost:3000")

    allowHeader(HttpHeaders.ContentType)
    allowHeader(HttpHeaders.Authorization)

    allowMethod(HttpMethod.Get)
    allowMethod(HttpMethod.Post)
    allowMethod(HttpMethod.Put)
    allowMethod(HttpMethod.Delete)
    allowMethod(HttpMethod.Options)

    allowCredentials = true
    maxAgeInSeconds = 3600
}
```

### Rate Limiting

```kotlin
fun Application.configureRateLimiting() {
    install(RateLimit) {
        register(RateLimitName("public")) {
            rateLimiter(limit = 100, refillPeriod = 60.seconds)
        }

        register(RateLimitName("authenticated")) {
            rateLimiter(limit = 1000, refillPeriod = 60.seconds)
            requestKey { call ->
                call.principal<UserIdPrincipal>()?.name ?: call.request.origin.remoteHost
            }
        }
    }
}

routing {
    rateLimit(RateLimitName("public")) {
        get("/api/public") {
            call.respond("Public data")
        }
    }

    authenticate("auth-jwt") {
        rateLimit(RateLimitName("authenticated")) {
            get("/api/protected") {
                call.respond("Protected data")
            }
        }
    }
}
```

## WebSockets

### Basic WebSocket Server

```kotlin
fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(30)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }

    routing {
        webSocket("/ws") {
            send("Connected to server")

            for (frame in incoming) {
                when (frame) {
                    is Frame.Text -> {
                        val text = frame.readText()
                        send("You said: $text")
                    }
                    is Frame.Close -> {
                        close(CloseReason(CloseReason.Codes.NORMAL, "Client disconnected"))
                    }
                    else -> {}
                }
            }
        }
    }
}
```

### Chat Application Example

```kotlin
class ChatServer {
    private val connections = Collections.synchronizedSet<Connection>(LinkedHashSet())

    fun addConnection(connection: Connection) {
        connections += connection
    }

    fun removeConnection(connection: Connection) {
        connections -= connection
    }

    suspend fun broadcast(message: String) {
        connections.forEach { connection ->
            connection.session.send(message)
        }
    }
}

data class Connection(val session: DefaultWebSocketSession, val username: String)

fun Application.configureChatServer() {
    val chatServer = ChatServer()

    routing {
        webSocket("/chat/{username}") {
            val username = call.parameters["username"] ?: "Anonymous"
            val connection = Connection(this, username)

            try {
                chatServer.addConnection(connection)
                chatServer.broadcast("$username joined the chat")

                for (frame in incoming) {
                    when (frame) {
                        is Frame.Text -> {
                            val message = frame.readText()
                            chatServer.broadcast("$username: $message")
                        }
                        else -> {}
                    }
                }
            } finally {
                chatServer.removeConnection(connection)
                chatServer.broadcast("$username left the chat")
            }
        }
    }
}
```

### WebSocket with JSON

```kotlin
@Serializable
sealed class WebSocketMessage {
    @Serializable
    @SerialName("chat")
    data class Chat(val text: String) : WebSocketMessage()

    @Serializable
    @SerialName("notification")
    data class Notification(val type: String, val payload: String) : WebSocketMessage()
}

webSocket("/ws/json") {
    val json = Json { ignoreUnknownKeys = true }

    for (frame in incoming) {
        when (frame) {
            is Frame.Text -> {
                val message = json.decodeFromString<WebSocketMessage>(frame.readText())

                when (message) {
                    is WebSocketMessage.Chat -> {
                        val response = WebSocketMessage.Notification(
                            type = "received",
                            payload = message.text
                        )
                        send(json.encodeToString(WebSocketMessage.serializer(), response))
                    }
                    is WebSocketMessage.Notification -> {
                        // Handle notification
                    }
                }
            }
            else -> {}
        }
    }
}
```

## HTTP Client

### Basic Client Usage

```kotlin
suspend fun fetchData() {
    val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json()
        }
    }

    try {
        // GET request
        val response: HttpResponse = client.get("https://api.example.com/users")
        val users: List<User> = response.body()

        // POST request
        val newUser = client.post("https://api.example.com/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserRequest(name = "John", email = "john@example.com"))
        }.body<User>()

    } finally {
        client.close()
    }
}
```

### Client Configuration

```kotlin
val client = HttpClient(CIO) {
    // JSON serialization
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            ignoreUnknownKeys = true
        })
    }

    // Logging
    install(Logging) {
        logger = Logger.DEFAULT
        level = LogLevel.HEADERS
        filter { request ->
            request.url.host.contains("api.example.com")
        }
    }

    // Default headers
    install(DefaultRequest) {
        header(HttpHeaders.ContentType, ContentType.Application.Json)
        header("X-Api-Key", "your-api-key")
    }

    // Timeout
    install(HttpTimeout) {
        requestTimeoutMillis = 30000
        connectTimeoutMillis = 10000
        socketTimeoutMillis = 30000
    }

    // Retry on failure
    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 3)
        exponentialDelay()
    }

    // Authentication
    install(Auth) {
        bearer {
            loadTokens {
                BearerTokens("access-token", "refresh-token")
            }
            refreshTokens {
                // Refresh token logic
                BearerTokens("new-access-token", "new-refresh-token")
            }
        }
    }
}
```

### Request Builder

```kotlin
suspend fun advancedRequest() {
    val client = HttpClient(CIO)

    val response = client.request {
        method = HttpMethod.Post
        url {
            protocol = URLProtocol.HTTPS
            host = "api.example.com"
            path("v1", "users")
            parameters.append("filter", "active")
        }
        headers {
            append(HttpHeaders.Authorization, "Bearer token")
            append(HttpHeaders.Accept, ContentType.Application.Json.toString())
        }
        contentType(ContentType.Application.Json)
        setBody(CreateUserRequest(name = "John", email = "john@example.com"))
    }

    println("Status: ${response.status}")
    println("Body: ${response.bodyAsText()}")

    client.close()
}
```

### Streaming Responses

```kotlin
suspend fun streamLargeFile(url: String, outputFile: File) {
    val client = HttpClient(CIO)

    client.prepareGet(url).execute { response ->
        val channel: ByteReadChannel = response.bodyAsChannel()

        outputFile.outputStream().use { output ->
            while (!channel.isClosedForRead) {
                val packet = channel.readRemaining(DEFAULT_BUFFER_SIZE.toLong())
                while (!packet.isEmpty) {
                    val bytes = packet.readBytes()
                    output.write(bytes)
                }
            }
        }
    }

    client.close()
}
```

### WebSocket Client

```kotlin
suspend fun webSocketClient() {
    val client = HttpClient(CIO) {
        install(WebSockets)
    }

    client.webSocket(
        method = HttpMethod.Get,
        host = "example.com",
        port = 8080,
        path = "/ws"
    ) {
        // Send messages
        launch {
            while (true) {
                send("Ping")
                delay(5000)
            }
        }

        // Receive messages
        for (frame in incoming) {
            when (frame) {
                is Frame.Text -> println("Received: ${frame.readText()}")
                is Frame.Close -> break
                else -> {}
            }
        }
    }

    client.close()
}
```

## Testing

### Test Setup

```kotlin
class ApplicationTest {
    @Test
    fun testRoot() = testApplication {
        application {
            configureRouting()
            configureSerialization()
        }

        client.get("/").apply {
            assertEquals(HttpStatusCode.OK, status)
            assertEquals("Hello, World!", bodyAsText())
        }
    }
}
```

### Testing JSON Endpoints

```kotlin
@Test
fun `test create user`() = testApplication {
    application {
        module()
    }

    val client = createClient {
        install(ContentNegotiation) {
            json()
        }
    }

    val response = client.post("/users") {
        contentType(ContentType.Application.Json)
        setBody(CreateUserRequest(name = "John", email = "john@example.com"))
    }

    assertEquals(HttpStatusCode.Created, response.status)

    val user = response.body<User>()
    assertEquals("John", user.name)
    assertEquals("john@example.com", user.email)
}
```

### Testing with Authentication

```kotlin
@Test
fun `test protected endpoint requires authentication`() = testApplication {
    application {
        module()
    }

    // Without token
    client.get("/protected").apply {
        assertEquals(HttpStatusCode.Unauthorized, status)
    }

    // With valid token
    val token = generateTestToken()
    client.get("/protected") {
        header(HttpHeaders.Authorization, "Bearer $token")
    }.apply {
        assertEquals(HttpStatusCode.OK, status)
    }
}
```

### Testing WebSockets

```kotlin
@Test
fun `test websocket echo`() = testApplication {
    application {
        configureWebSockets()
    }

    val client = createClient {
        install(io.ktor.client.plugins.websocket.WebSockets)
    }

    client.webSocket("/ws") {
        send("Hello, server!")

        val response = incoming.receive()
        assertTrue(response is Frame.Text)
        assertEquals("You said: Hello, server!", (response as Frame.Text).readText())
    }
}
```

### Mocking Dependencies

```kotlin
interface UserRepository {
    suspend fun findById(id: Long): User?
    suspend fun findAll(): List<User>
}

class MockUserRepository : UserRepository {
    private val users = mutableMapOf<Long, User>()

    override suspend fun findById(id: Long): User? = users[id]
    override suspend fun findAll(): List<User> = users.values.toList()

    fun addUser(user: User) {
        users[user.id] = user
    }
}

@Test
fun `test get user by id`() = testApplication {
    val mockRepo = MockUserRepository().apply {
        addUser(User(1, "John", "john@example.com"))
    }

    application {
        configureSerialization()
        routing {
            userRoutes(mockRepo)
        }
    }

    val client = createClient {
        install(ContentNegotiation) { json() }
    }

    client.get("/users/1").apply {
        assertEquals(HttpStatusCode.OK, status)
        val user = body<User>()
        assertEquals("John", user.name)
    }
}
```

## Deployment

### Building a Fat JAR

Add to `build.gradle.kts`:

```kotlin
plugins {
    id("io.ktor.plugin") version "3.1.1"
}

ktor {
    fatJar {
        archiveFileName.set("app.jar")
    }
}
```

Build with:

```bash
./gradlew buildFatJar
```

Run with:

```bash
java -jar build/libs/app.jar
```

### Docker Deployment

Dockerfile:

```dockerfile
FROM gradle:8.4-jdk17 AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle buildFatJar --no-daemon

FROM eclipse-temurin:17-jre-alpine
EXPOSE 8080
RUN mkdir /app
COPY --from=build /home/gradle/src/build/libs/app.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Docker Compose:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DB_URL=jdbc:postgresql://db:5432/mydb
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### GraalVM Native Image

For native compilation with GraalVM:

```kotlin
plugins {
    id("io.ktor.plugin") version "3.1.1"
    id("org.graalvm.buildtools.native") version "0.10.1"
}

graalvmNative {
    binaries {
        named("main") {
            fallback.set(false)
            verbose.set(true)
            buildArgs.add("--initialize-at-build-time=io.ktor,kotlinx,kotlin")
            buildArgs.add("-H:+InstallExitHandlers")
            buildArgs.add("-H:+ReportUnsupportedElementsAtRuntime")
        }
    }
}
```

Build native image:

```bash
./gradlew nativeCompile
```

### Environment Configuration

```kotlin
fun Application.module() {
    val environment = environment.config.propertyOrNull("ktor.environment")?.getString() ?: "development"

    when (environment) {
        "production" -> {
            install(CallLogging) {
                level = Level.WARN
            }
            // Production-specific configuration
        }
        "development" -> {
            install(CallLogging) {
                level = Level.DEBUG
            }
            // Development-specific configuration
        }
    }
}
```

## Best Practices

### Use Dependency Injection

```kotlin
// Using Koin
val appModule = module {
    single<UserRepository> { UserRepositoryImpl(get()) }
    single<UserService> { UserServiceImpl(get()) }
    single { Database.connect(get()) }
}

fun Application.module() {
    install(Koin) {
        modules(appModule)
    }

    routing {
        val userService by inject<UserService>()
        userRoutes(userService)
    }
}
```

### Structured Error Handling

```kotlin
sealed class ApiError(val statusCode: HttpStatusCode, override val message: String) : Exception(message) {
    class NotFound(resource: String) : ApiError(HttpStatusCode.NotFound, "$resource not found")
    class BadRequest(reason: String) : ApiError(HttpStatusCode.BadRequest, reason)
    class Unauthorized : ApiError(HttpStatusCode.Unauthorized, "Authentication required")
    class Forbidden : ApiError(HttpStatusCode.Forbidden, "Access denied")
    class Conflict(reason: String) : ApiError(HttpStatusCode.Conflict, reason)
}

install(StatusPages) {
    exception<ApiError> { call, cause ->
        call.respond(cause.statusCode, ErrorResponse(cause.message))
    }
}
```

### Request Logging and Tracing

```kotlin
install(CallLogging) {
    level = Level.INFO
    filter { call -> call.request.path().startsWith("/api") }
    format { call ->
        val status = call.response.status()
        val method = call.request.httpMethod.value
        val path = call.request.path()
        val duration = call.processingTimeMillis()
        "$method $path - $status ($duration ms)"
    }
    mdc("requestId") { call ->
        call.request.header("X-Request-ID") ?: UUID.randomUUID().toString()
    }
}
```

### Graceful Shutdown

```kotlin
fun main() {
    val server = embeddedServer(Netty, port = 8080) {
        module()
    }

    Runtime.getRuntime().addShutdownHook(Thread {
        server.stop(gracePeriodMillis = 1000, timeoutMillis = 5000)
    })

    server.start(wait = true)
}
```

### Health Checks

```kotlin
fun Route.healthRoutes(database: Database, cache: Cache) {
    route("/health") {
        get {
            call.respond(mapOf("status" to "UP"))
        }

        get("/ready") {
            val checks = mutableMapOf<String, String>()

            checks["database"] = try {
                database.ping()
                "UP"
            } catch (e: Exception) {
                "DOWN"
            }

            checks["cache"] = try {
                cache.ping()
                "UP"
            } catch (e: Exception) {
                "DOWN"
            }

            val status = if (checks.values.all { it == "UP" }) {
                HttpStatusCode.OK
            } else {
                HttpStatusCode.ServiceUnavailable
            }

            call.respond(status, checks)
        }
    }
}
```

### API Versioning

```kotlin
fun Application.configureRouting() {
    routing {
        route("/api/v1") {
            userRoutesV1()
            taskRoutesV1()
        }

        route("/api/v2") {
            userRoutesV2()
            taskRoutesV2()
        }
    }
}
```

### Documentation with OpenAPI

Ktor 3.3+ supports automatic OpenAPI generation:

```kotlin
plugins {
    id("io.ktor.plugin") version "3.3.0"
}

dependencies {
    implementation("io.ktor:ktor-server-openapi:3.3.0")
    implementation("io.ktor:ktor-server-swagger-ui:3.3.0")
}

fun Application.module() {
    install(OpenAPI)
    install(SwaggerUI) {
        swagger {
            swaggerUrl = "swagger-ui"
            forwardRoot = true
        }
        info {
            title = "My API"
            version = "1.0.0"
            description = "API documentation"
        }
    }
}
```

## Summary

Ktor provides a modern, Kotlin-native approach to building web applications and services:

- **Lightweight and fast**: Minimal overhead with quick startup times
- **Coroutine-native**: Built on Kotlin coroutines for efficient async operations
- **Flexible plugin system**: Add only the features you need
- **Type-safe DSL**: Kotlin-idiomatic configuration and routing
- **Full-featured client**: Powerful HTTP client for consuming APIs
- **Multiplatform ready**: Share code across JVM, JavaScript, and Native

By leveraging Ktor's capabilities along with Kotlin's expressive syntax and coroutine support, you can build efficient, maintainable web services that scale well and are a joy to develop.
