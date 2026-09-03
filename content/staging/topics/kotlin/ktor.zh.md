---
title: Kotlin Ktor 框架
description: 学习 Ktor 进行 Kotlin 异步 Web 开发，包括服务器和客户端
track: kotlin
section: tooling
difficulty: intermediate
tags:
  - Kotlin
  - Ktor
  - Web
  - 异步
status: imported
origin: old/src/content/docs/kotlin/ktor.zh.md
divergence: 0.204
issues: []
legacy:
  category: Kotlin
  subcategory: Web开发
  order: 16
  lastUpdated: 2026-01-07
---

Ktor 是由 JetBrains 开发的异步 Web 框架，专为 Kotlin 设计。它采用协程实现非阻塞 I/O，支持服务器端和客户端开发，是构建微服务、RESTful API 和实时应用的理想选择。

## Ktor 简介

### 核心特性

Ktor 具有以下核心特性：

1. **原生协程支持**：基于 Kotlin 协程构建，天然支持异步操作
2. **轻量级设计**：按需添加功能，无冗余依赖
3. **插件化架构**：通过插件扩展功能，如认证、序列化、日志等
4. **多平台支持**：支持 JVM、Native 和 JavaScript 平台
5. **DSL 风格 API**：提供直观的 Kotlin DSL 配置方式

### 项目结构

典型的 Ktor 项目结构如下：

```
ktor-project/
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   └── com/example/
│   │   │       ├── Application.kt
│   │   │       ├── plugins/
│   │   │       │   ├── Routing.kt
│   │   │       │   ├── Serialization.kt
│   │   │       │   └── Security.kt
│   │   │       └── routes/
│   │   │           └── CustomerRoutes.kt
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── logback.xml
│   └── test/
│       └── kotlin/
│           └── com/example/
│               └── ApplicationTest.kt
├── build.gradle.kts
└── gradle.properties
```

## 服务器配置

### 添加依赖

在 `build.gradle.kts` 中添加 Ktor 服务器依赖：

```kotlin
val ktor_version = "3.3.3"

plugins {
    kotlin("jvm") version "2.0.0"
    id("io.ktor.plugin") version ktor_version
    kotlin("plugin.serialization") version "2.0.0"
}

dependencies {
    // Ktor 核心
    implementation("io.ktor:ktor-server-core:$ktor_version")

    // 服务器引擎（选择其一）
    implementation("io.ktor:ktor-server-netty:$ktor_version")
    // 或使用 CIO 引擎
    // implementation("io.ktor:ktor-server-cio:$ktor_version")

    // 内容协商和序列化
    implementation("io.ktor:ktor-server-content-negotiation:$ktor_version")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktor_version")

    // 认证
    implementation("io.ktor:ktor-server-auth:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jwt:$ktor_version")

    // WebSocket
    implementation("io.ktor:ktor-server-websockets:$ktor_version")

    // 日志
    implementation("ch.qos.logback:logback-classic:1.5.6")

    // 测试
    testImplementation("io.ktor:ktor-server-test-host:$ktor_version")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}
```

### 嵌入式服务器

使用 `embeddedServer` 快速启动服务器：

```kotlin
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun main() {
    embeddedServer(Netty, port = 8080) {
        routing {
            get("/") {
                call.respondText("Hello, Ktor!")
            }
        }
    }.start(wait = true)
}
```

### 配置文件方式

使用配置文件 `application.yaml` 管理服务器设置：

```yaml
ktor:
  application:
    modules:
      - com.example.ApplicationKt.module
  deployment:
    port: 8080
    host: 0.0.0.0
  development: true
```

对应的应用程序模块：

```kotlin
package com.example

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    configureRouting()
    configureSerialization()
    configureSecurity()
}

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Hello, Ktor!")
        }

        get("/health") {
            call.respondText("OK")
        }
    }
}
```

### 安装插件

Ktor 使用插件系统扩展功能：

```kotlin
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
}
```

## 路由系统

### 基本路由

Ktor 提供直观的 DSL 定义路由：

```kotlin
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.http.*

fun Application.configureRouting() {
    routing {
        // GET 请求
        get("/hello") {
            call.respondText("Hello, World!")
        }

        // POST 请求
        post("/echo") {
            val text = call.receiveText()
            call.respondText("You said: $text")
        }

        // PUT 请求
        put("/update") {
            call.respond(HttpStatusCode.OK, "Updated")
        }

        // DELETE 请求
        delete("/remove") {
            call.respond(HttpStatusCode.NoContent)
        }

        // HEAD 请求
        head("/check") {
            call.respond(HttpStatusCode.OK)
        }

        // OPTIONS 请求
        options("/options") {
            call.response.header("Allow", "GET, POST, PUT, DELETE")
            call.respond(HttpStatusCode.OK)
        }
    }
}
```

### 路由分组

使用 `route` 函数组织相关路由：

```kotlin
fun Application.configureRouting() {
    routing {
        route("/api") {
            route("/v1") {
                route("/users") {
                    get { /* 获取用户列表 */ }
                    post { /* 创建用户 */ }

                    route("/{id}") {
                        get { /* 获取单个用户 */ }
                        put { /* 更新用户 */ }
                        delete { /* 删除用户 */ }
                    }
                }

                route("/products") {
                    get { /* 获取产品列表 */ }
                    post { /* 创建产品 */ }
                }
            }
        }
    }
}
```

### 路径参数

从 URL 路径中提取参数：

```kotlin
routing {
    // 必选路径参数
    get("/users/{id}") {
        val userId = call.parameters["id"]
            ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing id")
        call.respondText("User ID: $userId")
    }

    // 可选路径参数
    get("/articles/{category?}") {
        val category = call.parameters["category"] ?: "all"
        call.respondText("Category: $category")
    }

    // 尾部通配符（匹配剩余路径）
    get("/files/{path...}") {
        val pathSegments = call.parameters.getAll("path")
        call.respondText("Path: ${pathSegments?.joinToString("/")}")
    }

    // 通配符（匹配单个路径段）
    get("/download/*") {
        call.respondText("Download endpoint")
    }
}
```

### 正则表达式路由

使用正则表达式匹配复杂路径模式：

```kotlin
routing {
    // 匹配以 /hello 结尾的路径
    get(Regex(".+/hello")) {
        call.respondText("Hello!")
    }

    // 使用命名捕获组
    get(Regex("""(?<id>\d+)/details""")) {
        val id = call.parameters["id"]
        call.respondText("Details for ID: $id")
    }
}
```

### 查询参数

获取 URL 查询参数：

```kotlin
routing {
    get("/search") {
        val query = call.request.queryParameters["q"] ?: ""
        val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
        val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 10

        call.respondText("Searching '$query' - Page $page, Limit $limit")
    }

    // 多值查询参数
    get("/filter") {
        val tags = call.request.queryParameters.getAll("tag") ?: emptyList()
        call.respondText("Tags: ${tags.joinToString(", ")}")
    }
}
```

### 路由扩展函数

将路由定义为扩展函数以便模块化：

```kotlin
// routes/CustomerRoutes.kt
fun Route.customerRoutes() {
    route("/customers") {
        get {
            call.respond(customerService.getAllCustomers())
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest)

            val customer = customerService.getCustomer(id)
                ?: return@get call.respond(HttpStatusCode.NotFound)

            call.respond(customer)
        }

        post {
            val customer = call.receive<Customer>()
            val created = customerService.createCustomer(customer)
            call.respond(HttpStatusCode.Created, created)
        }

        delete("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest)

            if (customerService.deleteCustomer(id)) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }
    }
}

// Application.kt
fun Application.configureRouting() {
    routing {
        customerRoutes()
        productRoutes()
        orderRoutes()
    }
}
```

## 请求与响应处理

### 处理请求

```kotlin
import io.ktor.server.request.*
import kotlinx.serialization.Serializable

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    val age: Int
)

routing {
    post("/users") {
        // 获取请求头
        val contentType = call.request.contentType()
        val authorization = call.request.header("Authorization")
        val userAgent = call.request.userAgent()

        // 获取请求体（JSON）
        val request = call.receive<CreateUserRequest>()

        // 获取客户端信息
        val clientHost = call.request.origin.remoteHost
        val clientPort = call.request.origin.remotePort

        // 处理并响应
        val user = userService.createUser(request)
        call.respond(HttpStatusCode.Created, user)
    }

    // 接收原始文本
    post("/text") {
        val text = call.receiveText()
        call.respondText("Received: $text")
    }

    // 接收字节数组
    post("/binary") {
        val bytes = call.receive<ByteArray>()
        call.respondText("Received ${bytes.size} bytes")
    }
}
```

### 响应类型

```kotlin
import io.ktor.server.response.*
import io.ktor.http.*

routing {
    // 文本响应
    get("/text") {
        call.respondText("Plain text response")
    }

    // HTML 响应
    get("/html") {
        call.respondText(
            contentType = ContentType.Text.Html,
            text = "<h1>Hello, HTML!</h1>"
        )
    }

    // JSON 响应（需要 ContentNegotiation 插件）
    get("/json") {
        call.respond(mapOf("message" to "Hello", "status" to "OK"))
    }

    // 自定义状态码
    get("/created") {
        call.respond(HttpStatusCode.Created, User(1, "John"))
    }

    // 重定向
    get("/redirect") {
        call.respondRedirect("/new-location", permanent = false)
    }

    // 文件响应
    get("/download") {
        val file = File("path/to/file.pdf")
        call.response.header(
            HttpHeaders.ContentDisposition,
            ContentDisposition.Attachment
                .withParameter(ContentDisposition.Parameters.FileName, "document.pdf")
                .toString()
        )
        call.respondFile(file)
    }

    // 字节响应
    get("/bytes") {
        val bytes = "Hello".toByteArray()
        call.respondBytes(bytes, ContentType.Application.OctetStream)
    }

    // 设置响应头
    get("/custom-headers") {
        call.response.header("X-Custom-Header", "CustomValue")
        call.response.header("Cache-Control", "no-cache")
        call.respondText("Response with custom headers")
    }
}
```

### 表单处理

```kotlin
import io.ktor.server.request.*
import io.ktor.http.content.*

routing {
    // URL 编码表单
    post("/login") {
        val formParameters = call.receiveParameters()
        val username = formParameters["username"]
        val password = formParameters["password"]

        if (authService.authenticate(username, password)) {
            call.respondText("Login successful")
        } else {
            call.respond(HttpStatusCode.Unauthorized, "Invalid credentials")
        }
    }

    // 多部分表单（文件上传）
    post("/upload") {
        val multipart = call.receiveMultipart()

        multipart.forEachPart { part ->
            when (part) {
                is PartData.FormItem -> {
                    val name = part.name
                    val value = part.value
                    println("Form field: $name = $value")
                }
                is PartData.FileItem -> {
                    val fileName = part.originalFileName ?: "unknown"
                    val fileBytes = part.streamProvider().readBytes()

                    // 保存文件
                    File("uploads/$fileName").writeBytes(fileBytes)
                    println("Uploaded file: $fileName (${fileBytes.size} bytes)")
                }
                else -> {}
            }
            part.dispose()
        }

        call.respondText("Upload complete")
    }
}
```

## 内容协商与序列化

### 配置 JSON 序列化

使用 kotlinx.serialization 进行 JSON 序列化：

```kotlin
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true           // 格式化输出
            isLenient = true             // 宽松解析
            ignoreUnknownKeys = true     // 忽略未知字段
            encodeDefaults = true        // 编码默认值
            explicitNulls = false        // 不显式输出 null
        })
    }
}
```

### 使用 Gson

```kotlin
import io.ktor.serialization.gson.*

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        gson {
            setPrettyPrinting()
            setDateFormat("yyyy-MM-dd HH:mm:ss")
            serializeNulls()
        }
    }
}
```

### 使用 Jackson

```kotlin
import io.ktor.serialization.jackson.*
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        jackson {
            enable(SerializationFeature.INDENT_OUTPUT)
            registerModule(JavaTimeModule())
            disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        }
    }
}
```

### 多格式支持

同时支持 JSON 和 XML：

```kotlin
import io.ktor.serialization.kotlinx.json.*
import io.ktor.serialization.kotlinx.xml.*
import nl.adaptivity.xmlutil.XmlDeclMode
import nl.adaptivity.xmlutil.serialization.XML

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json()
        xml(format = XML {
            xmlDeclMode = XmlDeclMode.Charset
        })
    }
}
```

### 数据类定义

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String,
    @SerialName("created_at")
    val createdAt: String? = null
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null
)

// 使用示例
routing {
    get("/users/{id}") {
        val id = call.parameters["id"]?.toIntOrNull()
            ?: return@get call.respond(
                HttpStatusCode.BadRequest,
                ApiResponse<User>(false, error = "Invalid ID")
            )

        val user = userService.findById(id)
        if (user != null) {
            call.respond(ApiResponse(true, data = user))
        } else {
            call.respond(
                HttpStatusCode.NotFound,
                ApiResponse<User>(false, error = "User not found")
            )
        }
    }

    post("/users") {
        val user = call.receive<User>()
        val created = userService.create(user)
        call.respond(HttpStatusCode.Created, ApiResponse(true, data = created))
    }
}
```

## 认证与授权

### 基本认证

```kotlin
import io.ktor.server.auth.*

fun Application.configureSecurity() {
    install(Authentication) {
        basic("auth-basic") {
            realm = "Access to the API"
            validate { credentials ->
                if (credentials.name == "admin" && credentials.password == "secret") {
                    UserIdPrincipal(credentials.name)
                } else {
                    null
                }
            }
        }
    }

    routing {
        authenticate("auth-basic") {
            get("/protected") {
                val principal = call.principal<UserIdPrincipal>()
                call.respondText("Hello, ${principal?.name}!")
            }
        }
    }
}
```

### Bearer Token 认证

```kotlin
fun Application.configureSecurity() {
    install(Authentication) {
        bearer("auth-bearer") {
            realm = "Access to the API"
            authenticate { tokenCredential ->
                if (tokenService.validateToken(tokenCredential.token)) {
                    UserIdPrincipal(tokenService.getUserFromToken(tokenCredential.token))
                } else {
                    null
                }
            }
        }
    }

    routing {
        authenticate("auth-bearer") {
            get("/api/profile") {
                val principal = call.principal<UserIdPrincipal>()
                val user = userService.findByUsername(principal!!.name)
                call.respond(user)
            }
        }
    }
}
```

### JWT 认证

```kotlin
import io.ktor.server.auth.jwt.*
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm

// JWT 配置
object JwtConfig {
    private const val secret = "your-secret-key"
    private const val issuer = "ktor-app"
    private const val audience = "ktor-audience"
    private const val validityInMs = 36_000_00 * 24 // 24 hours

    private val algorithm = Algorithm.HMAC256(secret)

    val verifier = JWT
        .require(algorithm)
        .withAudience(audience)
        .withIssuer(issuer)
        .build()

    fun generateToken(userId: String, role: String): String = JWT.create()
        .withAudience(audience)
        .withIssuer(issuer)
        .withClaim("userId", userId)
        .withClaim("role", role)
        .withExpiresAt(Date(System.currentTimeMillis() + validityInMs))
        .sign(algorithm)
}

fun Application.configureSecurity() {
    install(Authentication) {
        jwt("auth-jwt") {
            realm = "ktor-app"
            verifier(JwtConfig.verifier)

            validate { credential ->
                val userId = credential.payload.getClaim("userId").asString()
                val role = credential.payload.getClaim("role").asString()

                if (userId != null) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }

            challenge { defaultScheme, realm ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    mapOf("error" to "Token is not valid or has expired")
                )
            }
        }
    }

    routing {
        // 登录端点（无需认证）
        post("/login") {
            val credentials = call.receive<LoginRequest>()
            val user = authService.authenticate(credentials)

            if (user != null) {
                val token = JwtConfig.generateToken(user.id.toString(), user.role)
                call.respond(mapOf("token" to token))
            } else {
                call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid credentials"))
            }
        }

        // 受保护的端点
        authenticate("auth-jwt") {
            get("/api/me") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal!!.payload.getClaim("userId").asString()
                val role = principal.payload.getClaim("role").asString()

                call.respond(mapOf(
                    "userId" to userId,
                    "role" to role
                ))
            }
        }
    }
}
```

### 表单认证

```kotlin
fun Application.configureSecurity() {
    install(Authentication) {
        form("auth-form") {
            userParamName = "username"
            passwordParamName = "password"

            validate { credentials ->
                if (authService.validateCredentials(credentials.name, credentials.password)) {
                    UserIdPrincipal(credentials.name)
                } else {
                    null
                }
            }

            challenge {
                call.respond(HttpStatusCode.Unauthorized, "Invalid credentials")
            }
        }
    }
}
```

### 会话认证

```kotlin
import io.ktor.server.sessions.*

@Serializable
data class UserSession(
    val userId: String,
    val username: String,
    val role: String
)

fun Application.configureSecurity() {
    install(Sessions) {
        cookie<UserSession>("user_session") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 86400 // 24 hours
            cookie.secure = true
            cookie.httpOnly = true
        }
    }

    install(Authentication) {
        session<UserSession>("auth-session") {
            validate { session ->
                session  // 返回会话作为 Principal
            }

            challenge {
                call.respondRedirect("/login")
            }
        }
    }

    routing {
        post("/login") {
            val credentials = call.receive<LoginRequest>()
            val user = authService.authenticate(credentials)

            if (user != null) {
                call.sessions.set(UserSession(user.id, user.username, user.role))
                call.respondRedirect("/dashboard")
            } else {
                call.respond(HttpStatusCode.Unauthorized)
            }
        }

        authenticate("auth-session") {
            get("/dashboard") {
                val session = call.principal<UserSession>()!!
                call.respondText("Welcome, ${session.username}!")
            }
        }

        get("/logout") {
            call.sessions.clear<UserSession>()
            call.respondRedirect("/login")
        }
    }
}
```

### OAuth 认证

```kotlin
import io.ktor.server.auth.*

fun Application.configureSecurity() {
    install(Authentication) {
        oauth("auth-oauth-google") {
            urlProvider = { "http://localhost:8080/callback" }
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "google",
                    authorizeUrl = "https://accounts.google.com/o/oauth2/auth",
                    accessTokenUrl = "https://oauth2.googleapis.com/token",
                    requestMethod = HttpMethod.Post,
                    clientId = System.getenv("GOOGLE_CLIENT_ID"),
                    clientSecret = System.getenv("GOOGLE_CLIENT_SECRET"),
                    defaultScopes = listOf(
                        "https://www.googleapis.com/auth/userinfo.profile",
                        "https://www.googleapis.com/auth/userinfo.email"
                    )
                )
            }
            client = HttpClient(CIO)
        }
    }

    routing {
        authenticate("auth-oauth-google") {
            get("/login/google") {
                // 自动重定向到 Google
            }

            get("/callback") {
                val principal = call.principal<OAuthAccessTokenResponse.OAuth2>()
                    ?: return@get call.respond(HttpStatusCode.Unauthorized)

                // 使用 access token 获取用户信息
                val userInfo = googleClient.getUserInfo(principal.accessToken)

                // 创建或更新用户
                val user = userService.findOrCreateByGoogle(userInfo)

                // 创建会话
                call.sessions.set(UserSession(user.id, user.name, "user"))
                call.respondRedirect("/dashboard")
            }
        }
    }
}
```

### 多认证方式

```kotlin
fun Application.configureSecurity() {
    install(Authentication) {
        jwt("jwt") { /* ... */ }
        basic("basic") { /* ... */ }
        session<UserSession>("session") { /* ... */ }
    }

    routing {
        // 需要 JWT 或 Basic 认证
        authenticate("jwt", "basic") {
            get("/api/data") {
                call.respond("Authenticated via JWT or Basic")
            }
        }

        // 可选认证（未认证也可访问）
        authenticate("jwt", optional = true) {
            get("/api/public") {
                val principal = call.principal<JWTPrincipal>()
                if (principal != null) {
                    call.respond("Hello, authenticated user!")
                } else {
                    call.respond("Hello, guest!")
                }
            }
        }
    }
}
```

## WebSocket 支持

### 安装 WebSocket 插件

```kotlin
import io.ktor.server.websocket.*
import kotlin.time.Duration.Companion.seconds

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
}
```

### 基本 WebSocket 端点

```kotlin
import io.ktor.websocket.*

fun Application.configureRouting() {
    routing {
        webSocket("/echo") {
            send("Welcome to the echo server!")

            for (frame in incoming) {
                when (frame) {
                    is Frame.Text -> {
                        val text = frame.readText()
                        if (text.equals("bye", ignoreCase = true)) {
                            close(CloseReason(CloseReason.Codes.NORMAL, "Client said bye"))
                        } else {
                            send("Echo: $text")
                        }
                    }
                    is Frame.Binary -> {
                        val bytes = frame.readBytes()
                        send(Frame.Binary(true, bytes))
                    }
                    is Frame.Close -> {
                        println("Client disconnected")
                    }
                    else -> {}
                }
            }
        }
    }
}
```

### 聊天室示例

```kotlin
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import java.util.concurrent.ConcurrentHashMap

// 连接管理器
class ConnectionManager {
    private val connections = ConcurrentHashMap<String, DefaultWebSocketServerSession>()

    suspend fun addConnection(userId: String, session: DefaultWebSocketServerSession) {
        connections[userId] = session
        broadcast("$userId joined the chat")
    }

    suspend fun removeConnection(userId: String) {
        connections.remove(userId)
        broadcast("$userId left the chat")
    }

    suspend fun broadcast(message: String) {
        connections.values.forEach { session ->
            try {
                session.send(message)
            } catch (e: Exception) {
                // 连接可能已关闭
            }
        }
    }

    suspend fun sendTo(userId: String, message: String) {
        connections[userId]?.send(message)
    }
}

val connectionManager = ConnectionManager()

fun Application.configureRouting() {
    routing {
        webSocket("/chat/{username}") {
            val username = call.parameters["username"]
                ?: return@webSocket close(
                    CloseReason(CloseReason.Codes.VIOLATED_POLICY, "No username")
                )

            connectionManager.addConnection(username, this)

            try {
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        val message = frame.readText()
                        connectionManager.broadcast("$username: $message")
                    }
                }
            } catch (e: ClosedReceiveChannelException) {
                println("$username disconnected: ${closeReason.await()}")
            } catch (e: Exception) {
                println("Error: ${e.message}")
            } finally {
                connectionManager.removeConnection(username)
            }
        }
    }
}
```

### 使用 SharedFlow 广播

```kotlin
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

@Serializable
data class ChatMessage(
    val sender: String,
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

val messageFlow = MutableSharedFlow<ChatMessage>()
val sharedFlow = messageFlow.asSharedFlow()

fun Application.configureRouting() {
    routing {
        webSocket("/ws/chat") {
            send("Connected to chat!")

            // 订阅消息流
            val job = launch {
                sharedFlow.collect { message ->
                    send(Json.encodeToString(message))
                }
            }

            // 处理收到的消息
            try {
                incoming.consumeEach { frame ->
                    if (frame is Frame.Text) {
                        val text = frame.readText()
                        val message = Json.decodeFromString<ChatMessage>(text)
                        messageFlow.emit(message)
                    }
                }
            } catch (e: Exception) {
                println("WebSocket error: ${e.message}")
            } finally {
                job.cancel()
            }
        }
    }
}
```

### WebSocket 事件处理

```kotlin
webSocket("/events") {
    println("Client connected")  // onConnect

    try {
        for (frame in incoming) {
            when (frame) {
                is Frame.Text -> {
                    println("Received: ${frame.readText()}")  // onMessage
                }
                is Frame.Close -> {
                    println("Close reason: ${closeReason.await()}")  // onClose
                }
                else -> {}
            }
        }
    } catch (e: ClosedReceiveChannelException) {
        println("Connection closed: ${closeReason.await()}")  // onClose
    } catch (e: Throwable) {
        println("Error: ${e.message}")  // onError
    }
}
```

## Ktor HTTP 客户端

### 创建客户端

```kotlin
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*

suspend fun main() {
    val client = HttpClient(CIO)

    try {
        val response: HttpResponse = client.get("https://api.example.com/data")
        println("Status: ${response.status}")
        println("Body: ${response.bodyAsText()}")
    } finally {
        client.close()
    }
}
```

### 配置客户端

```kotlin
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

val client = HttpClient(CIO) {
    // JSON 序列化
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }

    // 日志
    install(Logging) {
        logger = Logger.DEFAULT
        level = LogLevel.INFO
    }

    // 超时设置
    install(HttpTimeout) {
        requestTimeoutMillis = 30000
        connectTimeoutMillis = 10000
        socketTimeoutMillis = 30000
    }

    // 默认请求配置
    defaultRequest {
        url("https://api.example.com")
        header("Accept", "application/json")
    }

    // 重试
    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 3)
        exponentialDelay()
    }
}
```

### 发送请求

```kotlin
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*

// GET 请求
suspend fun getUsers(): List<User> {
    return client.get("/users").body()
}

// 带查询参数的 GET
suspend fun searchUsers(query: String, page: Int): List<User> {
    return client.get("/users/search") {
        parameter("q", query)
        parameter("page", page)
    }.body()
}

// POST 请求
suspend fun createUser(user: User): User {
    return client.post("/users") {
        contentType(ContentType.Application.Json)
        setBody(user)
    }.body()
}

// PUT 请求
suspend fun updateUser(id: Int, user: User): User {
    return client.put("/users/$id") {
        contentType(ContentType.Application.Json)
        setBody(user)
    }.body()
}

// DELETE 请求
suspend fun deleteUser(id: Int): Boolean {
    val response = client.delete("/users/$id")
    return response.status == HttpStatusCode.NoContent
}

// 自定义头部
suspend fun getProtectedData(token: String): ProtectedData {
    return client.get("/protected") {
        header("Authorization", "Bearer $token")
    }.body()
}
```

### 表单提交

```kotlin
import io.ktor.client.request.forms.*
import io.ktor.http.*

// URL 编码表单
suspend fun login(username: String, password: String): String {
    val response = client.submitForm(
        url = "/login",
        formParameters = parameters {
            append("username", username)
            append("password", password)
        }
    )
    return response.bodyAsText()
}

// 多部分表单（文件上传）
suspend fun uploadFile(file: File, description: String): UploadResponse {
    return client.submitFormWithBinaryData(
        url = "/upload",
        formData = formData {
            append("description", description)
            append("file", file.readBytes(), Headers.build {
                append(HttpHeaders.ContentType, "application/octet-stream")
                append(HttpHeaders.ContentDisposition, "filename=\"${file.name}\"")
            })
        }
    ).body()
}
```

### 客户端 WebSocket

```kotlin
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*

val client = HttpClient(CIO) {
    install(WebSockets)
}

suspend fun connectToChat() {
    client.webSocket(
        method = HttpMethod.Get,
        host = "localhost",
        port = 8080,
        path = "/chat"
    ) {
        // 发送消息
        send("Hello from client!")

        // 接收消息
        for (frame in incoming) {
            when (frame) {
                is Frame.Text -> println("Received: ${frame.readText()}")
                is Frame.Close -> println("Connection closed")
                else -> {}
            }
        }
    }
}
```

### 服务端使用 HTTP 客户端

```kotlin
// 在服务端调用外部 API
fun Application.module() {
    val httpClient = HttpClient(CIO) {
        install(ContentNegotiation) {
            json()
        }
    }

    routing {
        get("/weather/{city}") {
            val city = call.parameters["city"]!!

            // 调用外部天气 API
            val weather = httpClient.get("https://api.weather.com/v1/current") {
                parameter("city", city)
                header("API-Key", System.getenv("WEATHER_API_KEY"))
            }.body<WeatherData>()

            call.respond(weather)
        }
    }

    // 应用关闭时清理客户端
    environment.monitor.subscribe(ApplicationStopped) {
        httpClient.close()
    }
}
```

## 测试

### 基本测试

```kotlin
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.*

class ApplicationTest {
    @Test
    fun testRoot() = testApplication {
        application {
            module()
        }

        val response = client.get("/")
        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("Hello, World!", response.bodyAsText())
    }
}
```

### 测试路由

```kotlin
class UserRoutesTest {
    @Test
    fun `test get all users`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }

        val response = client.get("/api/users")

        assertEquals(HttpStatusCode.OK, response.status)
        val users = Json.decodeFromString<List<User>>(response.bodyAsText())
        assertTrue(users.isNotEmpty())
    }

    @Test
    fun `test create user`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }

        // 配置测试客户端
        val testClient = createClient {
            install(ContentNegotiation) {
                json()
            }
        }

        val response = testClient.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(User(0, "Test User", "test@example.com"))
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val createdUser = response.body<User>()
        assertEquals("Test User", createdUser.name)
    }

    @Test
    fun `test get user not found`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }

        val response = client.get("/api/users/999")
        assertEquals(HttpStatusCode.NotFound, response.status)
    }
}
```

### 测试认证

```kotlin
class AuthenticationTest {
    @Test
    fun `test protected endpoint without auth`() = testApplication {
        application {
            configureSecurity()
            configureRouting()
        }

        val response = client.get("/api/protected")
        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }

    @Test
    fun `test protected endpoint with valid token`() = testApplication {
        application {
            configureSecurity()
            configureRouting()
        }

        val token = JwtConfig.generateToken("1", "admin")

        val response = client.get("/api/protected") {
            header("Authorization", "Bearer $token")
        }

        assertEquals(HttpStatusCode.OK, response.status)
    }

    @Test
    fun `test login success`() = testApplication {
        application {
            configureSerialization()
            configureSecurity()
            configureRouting()
        }

        val testClient = createClient {
            install(ContentNegotiation) {
                json()
            }
        }

        val response = testClient.post("/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("admin", "password"))
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.body<Map<String, String>>()
        assertNotNull(body["token"])
    }
}
```

### 测试 WebSocket

```kotlin
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*

class WebSocketTest {
    @Test
    fun `test echo websocket`() = testApplication {
        application {
            configureSockets()
            configureRouting()
        }

        val client = createClient {
            install(WebSockets)
        }

        client.webSocket("/echo") {
            send("Hello")

            val response = incoming.receive() as Frame.Text
            assertEquals("Echo: Hello", response.readText())

            send("bye")
        }
    }
}
```

### 模拟外部服务

```kotlin
class ExternalServiceTest {
    @Test
    fun `test weather endpoint`() = testApplication {
        application {
            configureSerialization()
            configureRouting()
        }

        // 模拟外部天气 API
        externalServices {
            hosts("https://api.weather.com") {
                install(ContentNegotiation) {
                    json()
                }
                routing {
                    get("/v1/current") {
                        val city = call.request.queryParameters["city"]
                        call.respond(WeatherData(
                            city = city ?: "Unknown",
                            temperature = 25.0,
                            condition = "Sunny"
                        ))
                    }
                }
            }
        }

        val response = client.get("/weather/Tokyo")
        assertEquals(HttpStatusCode.OK, response.status)

        val weather = Json.decodeFromString<WeatherData>(response.bodyAsText())
        assertEquals("Tokyo", weather.city)
    }
}
```

### 使用自定义配置测试

```kotlin
class ConfigurationTest {
    @Test
    fun `test with custom config`() = testApplication {
        environment {
            config = MapApplicationConfig(
                "ktor.environment" to "test",
                "database.url" to "jdbc:h2:mem:test",
                "jwt.secret" to "test-secret"
            )
        }

        application {
            module()
        }

        val response = client.get("/config/environment")
        assertEquals("test", response.bodyAsText())
    }

    @Test
    fun `test with config file`() = testApplication {
        environment {
            config = ApplicationConfig("application-test.yaml")
        }

        application {
            module()
        }

        // 执行测试
    }
}
```

## 完整示例：RESTful API

### 项目结构

```
src/main/kotlin/com/example/
├── Application.kt
├── plugins/
│   ├── Routing.kt
│   ├── Serialization.kt
│   ├── Security.kt
│   └── Databases.kt
├── models/
│   └── Models.kt
├── routes/
│   ├── UserRoutes.kt
│   └── ProductRoutes.kt
└── services/
    ├── UserService.kt
    └── ProductService.kt
```

### 数据模型

```kotlin
// models/Models.kt
package com.example.models

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: Int = 0,
    val username: String,
    val email: String,
    val role: String = "user"
)

@Serializable
data class Product(
    val id: Int = 0,
    val name: String,
    val description: String,
    val price: Double,
    val stock: Int
)

@Serializable
data class CreateUserRequest(
    val username: String,
    val email: String,
    val password: String
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalPages: Int,
    val totalItems: Int
)
```

### 服务层

```kotlin
// services/UserService.kt
package com.example.services

import com.example.models.*

class UserService {
    private val users = mutableListOf(
        User(1, "admin", "admin@example.com", "admin"),
        User(2, "john", "john@example.com", "user")
    )
    private var nextId = 3

    fun getAll(): List<User> = users.toList()

    fun getById(id: Int): User? = users.find { it.id == id }

    fun getByUsername(username: String): User? =
        users.find { it.username == username }

    fun create(request: CreateUserRequest): User {
        val user = User(
            id = nextId++,
            username = request.username,
            email = request.email
        )
        users.add(user)
        return user
    }

    fun update(id: Int, user: User): User? {
        val index = users.indexOfFirst { it.id == id }
        if (index == -1) return null

        val updated = user.copy(id = id)
        users[index] = updated
        return updated
    }

    fun delete(id: Int): Boolean {
        return users.removeIf { it.id == id }
    }

    fun authenticate(username: String, password: String): User? {
        // 简化的认证逻辑
        return users.find { it.username == username }
    }
}
```

### 路由定义

```kotlin
// routes/UserRoutes.kt
package com.example.routes

import com.example.models.*
import com.example.services.UserService
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.userRoutes(userService: UserService) {
    route("/api/users") {
        // 公开端点：获取用户列表
        get {
            val users = userService.getAll()
            call.respond(ApiResponse(true, data = users))
        }

        // 公开端点：获取单个用户
        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<User>(false, message = "Invalid ID")
                )

            val user = userService.getById(id)
            if (user != null) {
                call.respond(ApiResponse(true, data = user))
            } else {
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiResponse<User>(false, message = "User not found")
                )
            }
        }

        // 受保护端点：创建用户
        authenticate("jwt") {
            post {
                val principal = call.principal<JWTPrincipal>()
                val role = principal?.payload?.getClaim("role")?.asString()

                if (role != "admin") {
                    return@post call.respond(
                        HttpStatusCode.Forbidden,
                        ApiResponse<User>(false, message = "Admin access required")
                    )
                }

                val request = call.receive<CreateUserRequest>()
                val user = userService.create(request)
                call.respond(HttpStatusCode.Created, ApiResponse(true, data = user))
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: return@put call.respond(
                        HttpStatusCode.BadRequest,
                        ApiResponse<User>(false, message = "Invalid ID")
                    )

                val user = call.receive<User>()
                val updated = userService.update(id, user)

                if (updated != null) {
                    call.respond(ApiResponse(true, data = updated))
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<User>(false, message = "User not found")
                    )
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: return@delete call.respond(
                        HttpStatusCode.BadRequest,
                        ApiResponse<Unit>(false, message = "Invalid ID")
                    )

                if (userService.delete(id)) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(false, message = "User not found")
                    )
                }
            }
        }
    }
}
```

### 应用程序入口

```kotlin
// Application.kt
package com.example

import com.example.plugins.*
import com.example.routes.*
import com.example.services.*
import io.ktor.server.application.*
import io.ktor.server.netty.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    // 初始化服务
    val userService = UserService()
    val productService = ProductService()

    // 安装插件
    configureSerialization()
    configureSecurity()
    configureRouting(userService, productService)
}
```

### 插件配置

```kotlin
// plugins/Routing.kt
package com.example.plugins

import com.example.routes.*
import com.example.services.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting(
    userService: UserService,
    productService: ProductService
) {
    routing {
        get("/") {
            call.respondText("Ktor API Server")
        }

        get("/health") {
            call.respondText("OK")
        }

        // 注册路由
        userRoutes(userService)
        productRoutes(productService)
        authRoutes(userService)
    }
}
```

```kotlin
// plugins/Serialization.kt
package com.example.plugins

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.json.Json

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            encodeDefaults = true
        })
    }
}
```

```kotlin
// plugins/Security.kt
package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import java.util.*

object JwtConfig {
    private val secret = System.getenv("JWT_SECRET") ?: "default-secret"
    private val issuer = System.getenv("JWT_ISSUER") ?: "ktor-app"
    private val audience = System.getenv("JWT_AUDIENCE") ?: "ktor-audience"
    private const val validityMs = 3600000L * 24 // 24 hours

    private val algorithm = Algorithm.HMAC256(secret)

    val verifier = JWT
        .require(algorithm)
        .withAudience(audience)
        .withIssuer(issuer)
        .build()

    fun generateToken(userId: String, username: String, role: String): String =
        JWT.create()
            .withAudience(audience)
            .withIssuer(issuer)
            .withClaim("userId", userId)
            .withClaim("username", username)
            .withClaim("role", role)
            .withExpiresAt(Date(System.currentTimeMillis() + validityMs))
            .sign(algorithm)
}

fun Application.configureSecurity() {
    install(Authentication) {
        jwt("jwt") {
            realm = "ktor-app"
            verifier(JwtConfig.verifier)

            validate { credential ->
                val userId = credential.payload.getClaim("userId").asString()
                if (userId != null) {
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
```

## 最佳实践

### 错误处理

```kotlin
import io.ktor.server.plugins.statuspages.*

fun Application.configureErrorHandling() {
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            when (cause) {
                is IllegalArgumentException -> {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ApiResponse<Unit>(false, message = cause.message)
                    )
                }
                is NotFoundException -> {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(false, message = cause.message)
                    )
                }
                is AuthenticationException -> {
                    call.respond(
                        HttpStatusCode.Unauthorized,
                        ApiResponse<Unit>(false, message = "Authentication required")
                    )
                }
                else -> {
                    call.application.log.error("Unhandled exception", cause)
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ApiResponse<Unit>(false, message = "Internal server error")
                    )
                }
            }
        }

        status(HttpStatusCode.NotFound) { call, status ->
            call.respond(
                status,
                ApiResponse<Unit>(false, message = "Resource not found")
            )
        }
    }
}

class NotFoundException(message: String) : Exception(message)
class AuthenticationException(message: String) : Exception(message)
```

### CORS 配置

```kotlin
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCORS() {
    install(CORS) {
        allowHost("localhost:3000")
        allowHost("example.com", schemes = listOf("https"))

        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)

        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)

        allowCredentials = true
        maxAgeInSeconds = 3600
    }
}
```

### 请求日志

```kotlin
import io.ktor.server.plugins.calllogging.*
import org.slf4j.event.Level

fun Application.configureLogging() {
    install(CallLogging) {
        level = Level.INFO

        filter { call ->
            call.request.path().startsWith("/api")
        }

        format { call ->
            val status = call.response.status()
            val method = call.request.httpMethod.value
            val uri = call.request.uri
            val duration = call.processingTimeMillis()
            "$method $uri - $status (${duration}ms)"
        }
    }
}
```

### 请求验证

```kotlin
import io.ktor.server.plugins.requestvalidation.*

fun Application.configureValidation() {
    install(RequestValidation) {
        validate<CreateUserRequest> { request ->
            when {
                request.username.isBlank() ->
                    ValidationResult.Invalid("Username cannot be blank")
                request.email.isBlank() || !request.email.contains("@") ->
                    ValidationResult.Invalid("Invalid email format")
                request.password.length < 8 ->
                    ValidationResult.Invalid("Password must be at least 8 characters")
                else -> ValidationResult.Valid
            }
        }

        validate<Product> { product ->
            val reasons = mutableListOf<String>()

            if (product.name.isBlank()) {
                reasons.add("Name cannot be blank")
            }
            if (product.price < 0) {
                reasons.add("Price cannot be negative")
            }
            if (product.stock < 0) {
                reasons.add("Stock cannot be negative")
            }

            if (reasons.isEmpty()) {
                ValidationResult.Valid
            } else {
                ValidationResult.Invalid(reasons)
            }
        }
    }
}
```

### 速率限制

```kotlin
import io.ktor.server.plugins.ratelimit.*
import kotlin.time.Duration.Companion.seconds

fun Application.configureRateLimit() {
    install(RateLimit) {
        register(RateLimitName("public")) {
            rateLimiter(limit = 100, refillPeriod = 60.seconds)
        }

        register(RateLimitName("authenticated")) {
            rateLimiter(limit = 1000, refillPeriod = 60.seconds)
        }

        register(RateLimitName("strict")) {
            rateLimiter(limit = 10, refillPeriod = 60.seconds)
        }
    }

    routing {
        rateLimit(RateLimitName("public")) {
            get("/api/public") {
                call.respondText("Public endpoint")
            }
        }

        authenticate("jwt") {
            rateLimit(RateLimitName("authenticated")) {
                get("/api/data") {
                    call.respondText("Authenticated endpoint")
                }
            }
        }
    }
}
```

## 总结

Ktor 是一个功能强大且灵活的 Kotlin Web 框架，具有以下优势：

1. **原生协程支持**：充分利用 Kotlin 协程实现高效异步处理
2. **插件化架构**：按需添加功能，保持应用轻量
3. **类型安全**：利用 Kotlin 类型系统减少运行时错误
4. **DSL 风格**：直观的 API 设计，代码简洁易读
5. **全栈支持**：同时支持服务器和客户端开发
6. **测试友好**：内置测试引擎，便于编写单元测试和集成测试

通过本文的学习，你应该能够：

- 创建和配置 Ktor 服务器应用
- 定义路由处理 HTTP 请求
- 实现各种认证和授权机制
- 使用 WebSocket 构建实时应用
- 使用 Ktor 客户端调用外部 API
- 编写测试验证应用行为

Ktor 特别适合构建微服务、RESTful API 和需要实时通信的应用。结合 Kotlin 多平台能力，还可以在不同平台间共享网络代码。
