---
title: Kotlin Multiplatform
description: Kotlin Multiplatform完全指南，跨平台开发与代码共享
track: kotlin
section: android-multiplatform
difficulty: advanced
tags:
  - Kotlin
  - Multiplatform
  - KMP
  - 跨平台
status: imported
origin: old/src/content/docs/kotlin/multiplatform.zh.md
divergence: 0.199
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Kotlin
  subcategory: 跨平台
  order: 8
  lastUpdated: 2026-01-07
---

Kotlin Multiplatform (KMP) 是 JetBrains 推出的跨平台开发技术，允许开发者在多个平台之间共享业务逻辑代码，同时保持原生 UI 和平台特定功能的灵活性。本文将深入探讨 KMP 的各个方面，从项目结构到实际应用。

## 什么是 Kotlin Multiplatform

### 核心概念

Kotlin Multiplatform 是一种代码共享策略，它允许你：

1. **共享业务逻辑**：网络请求、数据处理、业务规则等
2. **保持原生 UI**：每个平台使用其原生 UI 框架
3. **访问平台 API**：通过 expect/actual 机制调用平台特定功能
4. **渐进式采用**：可以逐步将现有项目迁移到 KMP

### KMP vs 其他跨平台方案

| 特性 | KMP | Flutter | React Native |
|------|-----|---------|--------------|
| UI 方案 | 原生 UI 或 Compose Multiplatform | 自绘引擎 | 桥接原生组件 |
| 代码共享 | 业务逻辑 | 全栈 | 全栈 |
| 性能 | 原生性能 | 接近原生 | 依赖桥接 |
| 学习曲线 | Kotlin 开发者友好 | Dart 语言 | JavaScript/React |
| 原生集成 | 无缝 | 需要平台通道 | 需要桥接 |

### 支持的平台

Kotlin Multiplatform 支持以下目标平台：

- **JVM**：Android、服务端应用
- **Native**：iOS、macOS、Linux、Windows
- **JavaScript**：浏览器应用、Node.js
- **WebAssembly**：浏览器应用（实验性）

## 项目结构

### 标准项目布局

一个典型的 KMP 项目结构如下：

```
my-kmp-project/
├── build.gradle.kts
├── settings.gradle.kts
├── shared/                          # 共享模块
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/              # 通用代码
│       │   └── kotlin/
│       │       └── com/example/
│       │           ├── Platform.kt
│       │           └── Greeting.kt
│       ├── commonTest/              # 通用测试
│       │   └── kotlin/
│       ├── androidMain/             # Android 特定代码
│       │   └── kotlin/
│       │       └── com/example/
│       │           └── Platform.android.kt
│       ├── iosMain/                 # iOS 特定代码
│       │   └── kotlin/
│       │       └── com/example/
│       │           └── Platform.ios.kt
│       ├── jvmMain/                 # JVM 特定代码
│       │   └── kotlin/
│       └── jsMain/                  # JavaScript 特定代码
│           └── kotlin/
├── androidApp/                      # Android 应用
│   ├── build.gradle.kts
│   └── src/
└── iosApp/                          # iOS 应用（Xcode 项目）
    └── iosApp/
```

### 配置 build.gradle.kts

共享模块的构建配置：

```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
}

kotlin {
    // 目标平台配置
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "1.8"
            }
        }
    }

    // iOS 目标
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach {
        it.binaries.framework {
            baseName = "shared"
            isStatic = true
        }
    }

    // JVM 目标
    jvm("desktop")

    // JavaScript 目标
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
    }

    // 源集配置
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(libs.kotlinx.coroutines.core)
                implementation(libs.kotlinx.serialization.json)
                implementation(libs.ktor.client.core)
            }
        }
        val commonTest by getting {
            dependencies {
                implementation(libs.kotlin.test)
            }
        }
        val androidMain by getting {
            dependencies {
                implementation(libs.ktor.client.android)
            }
        }
        val iosMain by creating {
            dependsOn(commonMain)
            dependencies {
                implementation(libs.ktor.client.darwin)
            }
        }
        val iosX64Main by getting { dependsOn(iosMain) }
        val iosArm64Main by getting { dependsOn(iosMain) }
        val iosSimulatorArm64Main by getting { dependsOn(iosMain) }

        val desktopMain by getting {
            dependencies {
                implementation(libs.ktor.client.cio)
            }
        }
        val jsMain by getting {
            dependencies {
                implementation(libs.ktor.client.js)
            }
        }
    }
}

android {
    namespace = "com.example.shared"
    compileSdk = 34
    defaultConfig {
        minSdk = 24
    }
}
```

### 版本目录配置

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "2.0.0"
kotlinxCoroutines = "1.8.0"
kotlinxSerialization = "1.6.3"
ktor = "2.3.9"
agp = "8.2.2"

[libraries]
kotlin-test = { module = "org.jetbrains.kotlin:kotlin-test", version.ref = "kotlin" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinxCoroutines" }
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinxSerialization" }
ktor-client-core = { module = "io.ktor:ktor-client-core", version.ref = "ktor" }
ktor-client-android = { module = "io.ktor:ktor-client-android", version.ref = "ktor" }
ktor-client-darwin = { module = "io.ktor:ktor-client-darwin", version.ref = "ktor" }
ktor-client-cio = { module = "io.ktor:ktor-client-cio", version.ref = "ktor" }
ktor-client-js = { module = "io.ktor:ktor-client-js", version.ref = "ktor" }

[plugins]
kotlinMultiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
kotlinSerialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
androidLibrary = { id = "com.android.library", version.ref = "agp" }
androidApplication = { id = "com.android.application", version.ref = "agp" }
```

## expect/actual 机制

### 基本概念

`expect`/`actual` 是 KMP 的核心机制，用于在共享代码中声明平台特定的实现。

- **expect**：在 commonMain 中声明接口或类的预期
- **actual**：在各平台源集中提供实际实现

### 基本用法

```kotlin
// commonMain/kotlin/com/example/Platform.kt
package com.example

// 声明预期的类
expect class Platform() {
    val name: String
    val version: String
}

// 声明预期的函数
expect fun getPlatformName(): String

// 使用预期声明
class Greeting {
    private val platform = Platform()

    fun greet(): String {
        return "Hello from ${platform.name} ${platform.version}!"
    }
}
```

```kotlin
// androidMain/kotlin/com/example/Platform.android.kt
package com.example

import android.os.Build

actual class Platform actual constructor() {
    actual val name: String = "Android"
    actual val version: String = "${Build.VERSION.SDK_INT}"
}

actual fun getPlatformName(): String = "Android ${Build.VERSION.SDK_INT}"
```

```kotlin
// iosMain/kotlin/com/example/Platform.ios.kt
package com.example

import platform.UIKit.UIDevice

actual class Platform actual constructor() {
    actual val name: String = UIDevice.currentDevice.systemName()
    actual val version: String = UIDevice.currentDevice.systemVersion
}

actual fun getPlatformName(): String = UIDevice.currentDevice.systemName() +
    " " + UIDevice.currentDevice.systemVersion
```

```kotlin
// jvmMain/kotlin/com/example/Platform.jvm.kt
package com.example

actual class Platform actual constructor() {
    actual val name: String = "JVM"
    actual val version: String = System.getProperty("java.version") ?: "Unknown"
}

actual fun getPlatformName(): String = "JVM ${System.getProperty("java.version")}"
```

```kotlin
// jsMain/kotlin/com/example/Platform.js.kt
package com.example

actual class Platform actual constructor() {
    actual val name: String = "JavaScript"
    actual val version: String = "ES2015+"
}

actual fun getPlatformName(): String = "JavaScript (Browser)"
```

### 接口模式

对于更复杂的场景，可以使用接口模式：

```kotlin
// commonMain/kotlin/com/example/storage/Storage.kt
package com.example.storage

// 定义通用接口
interface KeyValueStorage {
    suspend fun getString(key: String): String?
    suspend fun putString(key: String, value: String)
    suspend fun remove(key: String)
    suspend fun clear()
}

// 声明工厂函数
expect fun createStorage(): KeyValueStorage
```

```kotlin
// androidMain/kotlin/com/example/storage/Storage.android.kt
package com.example.storage

import android.content.Context
import android.content.SharedPreferences

class AndroidStorage(context: Context) : KeyValueStorage {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    override suspend fun getString(key: String): String? {
        return prefs.getString(key, null)
    }

    override suspend fun putString(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    override suspend fun remove(key: String) {
        prefs.edit().remove(key).apply()
    }

    override suspend fun clear() {
        prefs.edit().clear().apply()
    }
}

// 需要通过依赖注入提供 Context
private lateinit var appContext: Context

fun initStorage(context: Context) {
    appContext = context.applicationContext
}

actual fun createStorage(): KeyValueStorage = AndroidStorage(appContext)
```

```kotlin
// iosMain/kotlin/com/example/storage/Storage.ios.kt
package com.example.storage

import platform.Foundation.NSUserDefaults

class IOSStorage : KeyValueStorage {
    private val userDefaults = NSUserDefaults.standardUserDefaults

    override suspend fun getString(key: String): String? {
        return userDefaults.stringForKey(key)
    }

    override suspend fun putString(key: String, value: String) {
        userDefaults.setObject(value, forKey = key)
    }

    override suspend fun remove(key: String) {
        userDefaults.removeObjectForKey(key)
    }

    override suspend fun clear() {
        val dictionary = userDefaults.dictionaryRepresentation()
        dictionary.keys.forEach { key ->
            userDefaults.removeObjectForKey(key as String)
        }
    }
}

actual fun createStorage(): KeyValueStorage = IOSStorage()
```

### expect/actual 的高级用法

#### 类型别名

```kotlin
// commonMain
expect class UUID

// jvmMain
actual typealias UUID = java.util.UUID

// iosMain
import platform.Foundation.NSUUID
actual typealias UUID = NSUUID
```

#### 注解

```kotlin
// commonMain
@OptionalExpectation
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.BINARY)
expect annotation class Parcelize()

// androidMain
import kotlinx.parcelize.Parcelize as AndroidParcelize
actual typealias Parcelize = AndroidParcelize

// iosMain - 不需要实现，因为使用了 @OptionalExpectation
```

#### 带默认参数的函数

```kotlin
// commonMain
expect fun log(
    message: String,
    tag: String = "App",
    level: LogLevel = LogLevel.DEBUG
)

// androidMain
import android.util.Log

actual fun log(message: String, tag: String, level: LogLevel) {
    when (level) {
        LogLevel.DEBUG -> Log.d(tag, message)
        LogLevel.INFO -> Log.i(tag, message)
        LogLevel.WARNING -> Log.w(tag, message)
        LogLevel.ERROR -> Log.e(tag, message)
    }
}

// iosMain
import platform.Foundation.NSLog

actual fun log(message: String, tag: String, level: LogLevel) {
    NSLog("[$tag] ${level.name}: $message")
}
```

## 共享代码策略

### 数据模型共享

```kotlin
// commonMain/kotlin/com/example/model/Models.kt
package com.example.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: Long,
    val username: String,
    val email: String,
    val avatar: String?,
    val createdAt: Long
)

@Serializable
data class Post(
    val id: Long,
    val title: String,
    val content: String,
    val authorId: Long,
    val createdAt: Long,
    val tags: List<String> = emptyList()
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: String?
)

// 数据验证
fun User.isValid(): Boolean {
    return username.isNotBlank() &&
           email.contains("@") &&
           email.contains(".")
}

// 数据转换
fun User.toDisplayName(): String {
    return username.replaceFirstChar { it.uppercase() }
}
```

### 业务逻辑共享

```kotlin
// commonMain/kotlin/com/example/domain/UserRepository.kt
package com.example.domain

import com.example.model.User
import com.example.model.ApiResponse
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

interface UserRepository {
    suspend fun getUser(id: Long): User?
    suspend fun getUsers(): List<User>
    suspend fun createUser(user: User): ApiResponse<User>
    suspend fun updateUser(user: User): ApiResponse<User>
    suspend fun deleteUser(id: Long): ApiResponse<Unit>
    fun observeUsers(): Flow<List<User>>
}

// 默认实现
class DefaultUserRepository(
    private val apiClient: ApiClient,
    private val localStorage: KeyValueStorage
) : UserRepository {

    override suspend fun getUser(id: Long): User? {
        return try {
            apiClient.get<User>("/users/$id")
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun getUsers(): List<User> {
        return try {
            apiClient.get<List<User>>("/users") ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    override suspend fun createUser(user: User): ApiResponse<User> {
        return apiClient.post("/users", user)
    }

    override suspend fun updateUser(user: User): ApiResponse<User> {
        return apiClient.put("/users/${user.id}", user)
    }

    override suspend fun deleteUser(id: Long): ApiResponse<Unit> {
        return apiClient.delete("/users/$id")
    }

    override fun observeUsers(): Flow<List<User>> = flow {
        while (true) {
            emit(getUsers())
            kotlinx.coroutines.delay(5000) // 每5秒刷新
        }
    }
}
```

### 网络层共享

```kotlin
// commonMain/kotlin/com/example/network/ApiClient.kt
package com.example.network

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

// 创建平台特定的 HttpClient
expect fun createHttpClient(): HttpClient

class ApiClient(
    private val baseUrl: String,
    private val httpClient: HttpClient = createHttpClient()
) {
    companion object {
        private val json = Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            encodeDefaults = true
        }
    }

    suspend inline fun <reified T> get(endpoint: String): T? {
        return try {
            httpClient.get("$baseUrl$endpoint").body()
        } catch (e: Exception) {
            println("GET 请求失败: ${e.message}")
            null
        }
    }

    suspend inline fun <reified T, reified R> post(
        endpoint: String,
        body: T
    ): ApiResponse<R> {
        return try {
            httpClient.post("$baseUrl$endpoint") {
                contentType(ContentType.Application.Json)
                setBody(body)
            }.body()
        } catch (e: Exception) {
            ApiResponse(false, null, e.message)
        }
    }

    suspend inline fun <reified T, reified R> put(
        endpoint: String,
        body: T
    ): ApiResponse<R> {
        return try {
            httpClient.put("$baseUrl$endpoint") {
                contentType(ContentType.Application.Json)
                setBody(body)
            }.body()
        } catch (e: Exception) {
            ApiResponse(false, null, e.message)
        }
    }

    suspend inline fun <reified R> delete(endpoint: String): ApiResponse<R> {
        return try {
            httpClient.delete("$baseUrl$endpoint").body()
        } catch (e: Exception) {
            ApiResponse(false, null, e.message)
        }
    }
}
```

```kotlin
// androidMain/kotlin/com/example/network/HttpClient.android.kt
package com.example.network

import io.ktor.client.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

actual fun createHttpClient(): HttpClient = HttpClient(Android) {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
    install(Logging) {
        logger = Logger.DEFAULT
        level = LogLevel.HEADERS
    }
    engine {
        connectTimeout = 30_000
        socketTimeout = 30_000
    }
}
```

```kotlin
// iosMain/kotlin/com/example/network/HttpClient.ios.kt
package com.example.network

import io.ktor.client.*
import io.ktor.client.engine.darwin.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

actual fun createHttpClient(): HttpClient = HttpClient(Darwin) {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
    install(Logging) {
        logger = Logger.DEFAULT
        level = LogLevel.HEADERS
    }
    engine {
        configureRequest {
            setAllowsCellularAccess(true)
        }
    }
}
```

### 状态管理共享

```kotlin
// commonMain/kotlin/com/example/viewmodel/UserViewModel.kt
package com.example.viewmodel

import com.example.domain.UserRepository
import com.example.model.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

// UI 状态
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class UserViewModel(
    private val repository: UserRepository,
    private val scope: CoroutineScope
) {
    private val _users = MutableStateFlow<UiState<List<User>>>(UiState.Loading)
    val users: StateFlow<UiState<List<User>>> = _users.asStateFlow()

    private val _selectedUser = MutableStateFlow<User?>(null)
    val selectedUser: StateFlow<User?> = _selectedUser.asStateFlow()

    init {
        loadUsers()
    }

    fun loadUsers() {
        scope.launch {
            _users.value = UiState.Loading
            try {
                val userList = repository.getUsers()
                _users.value = UiState.Success(userList)
            } catch (e: Exception) {
                _users.value = UiState.Error(e.message ?: "加载用户失败")
            }
        }
    }

    fun selectUser(user: User) {
        _selectedUser.value = user
    }

    fun createUser(username: String, email: String) {
        scope.launch {
            val newUser = User(
                id = 0,
                username = username,
                email = email,
                avatar = null,
                createdAt = System.currentTimeMillis()
            )
            val response = repository.createUser(newUser)
            if (response.success) {
                loadUsers() // 刷新列表
            }
        }
    }

    fun deleteUser(userId: Long) {
        scope.launch {
            val response = repository.deleteUser(userId)
            if (response.success) {
                loadUsers()
            }
        }
    }
}

// 获取当前时间的平台特定实现
expect fun currentTimeMillis(): Long
```

## Kotlin/Native

### 概述

Kotlin/Native 是将 Kotlin 编译为原生二进制代码的技术，不依赖虚拟机运行。主要用于 iOS、macOS、Linux 和 Windows 开发。

### 内存管理

Kotlin/Native 使用自动内存管理：

```kotlin
// commonMain
class DataProcessor {
    private val cache = mutableMapOf<String, Any>()

    fun process(key: String, data: Any): Any {
        return cache.getOrPut(key) {
            // 处理数据
            transform(data)
        }
    }

    private fun transform(data: Any): Any {
        // 数据转换逻辑
        return data
    }

    fun clearCache() {
        cache.clear()
    }
}
```

### 与 Objective-C/Swift 互操作

```kotlin
// iosMain/kotlin/com/example/ios/IOSIntegration.kt
package com.example.ios

import platform.Foundation.*
import platform.UIKit.*
import kotlinx.cinterop.*

// 使用 iOS 框架
class IOSDeviceInfo {
    val deviceName: String
        get() = UIDevice.currentDevice.name

    val systemName: String
        get() = UIDevice.currentDevice.systemName

    val systemVersion: String
        get() = UIDevice.currentDevice.systemVersion

    val model: String
        get() = UIDevice.currentDevice.model

    val identifierForVendor: String?
        get() = UIDevice.currentDevice.identifierForVendor?.UUIDString
}

// 使用 NSFileManager
class IOSFileManager {
    private val fileManager = NSFileManager.defaultManager

    fun getDocumentsDirectory(): String {
        val paths = NSSearchPathForDirectoriesInDomains(
            NSDocumentDirectory,
            NSUserDomainMask,
            true
        )
        return paths.first() as String
    }

    fun fileExists(path: String): Boolean {
        return fileManager.fileExistsAtPath(path)
    }

    fun createDirectory(path: String): Boolean {
        return fileManager.createDirectoryAtPath(
            path,
            withIntermediateDirectories = true,
            attributes = null,
            error = null
        )
    }

    fun listFiles(directory: String): List<String> {
        val contents = fileManager.contentsOfDirectoryAtPath(directory, null)
        return contents?.mapNotNull { it as? String } ?: emptyList()
    }
}

// 使用 NSUserDefaults
class IOSPreferences {
    private val defaults = NSUserDefaults.standardUserDefaults

    fun setString(key: String, value: String) {
        defaults.setObject(value, forKey = key)
        defaults.synchronize()
    }

    fun getString(key: String): String? {
        return defaults.stringForKey(key)
    }

    fun setInt(key: String, value: Int) {
        defaults.setInteger(value.toLong(), forKey = key)
        defaults.synchronize()
    }

    fun getInt(key: String): Int {
        return defaults.integerForKey(key).toInt()
    }

    fun remove(key: String) {
        defaults.removeObjectForKey(key)
        defaults.synchronize()
    }
}
```

### 导出 Swift 友好的 API

```kotlin
// iosMain/kotlin/com/example/ios/SwiftExports.kt
package com.example.ios

import kotlinx.coroutines.*
import kotlin.native.concurrent.freeze

// 为 Swift 提供回调风格的 API
class UserService(private val repository: UserRepository) {

    // Swift 友好的异步方法
    fun fetchUsers(
        onSuccess: (List<User>) -> Unit,
        onError: (String) -> Unit
    ) {
        MainScope().launch {
            try {
                val users = repository.getUsers()
                onSuccess(users)
            } catch (e: Exception) {
                onError(e.message ?: "未知错误")
            }
        }
    }

    // 返回可取消的任务
    fun observeUsers(
        onUpdate: (List<User>) -> Unit
    ): Cancellable {
        val job = MainScope().launch {
            repository.observeUsers().collect { users ->
                onUpdate(users)
            }
        }

        return object : Cancellable {
            override fun cancel() {
                job.cancel()
            }
        }
    }
}

interface Cancellable {
    fun cancel()
}
```

在 Swift 中使用：

```swift
// Swift 代码
import shared

class UserListViewController: UIViewController {
    private let userService = UserService(repository: DefaultUserRepository())
    private var usersObserver: Cancellable?

    override func viewDidLoad() {
        super.viewDidLoad()

        // 获取用户
        userService.fetchUsers(
            onSuccess: { users in
                self.updateUI(with: users)
            },
            onError: { error in
                self.showError(error)
            }
        )

        // 观察用户变化
        usersObserver = userService.observeUsers { users in
            self.updateUI(with: users)
        }
    }

    deinit {
        usersObserver?.cancel()
    }

    private func updateUI(with users: [User]) {
        // 更新 UI
    }

    private func showError(_ message: String) {
        // 显示错误
    }
}
```

## Kotlin/JS

### 概述

Kotlin/JS 将 Kotlin 编译为 JavaScript，可以在浏览器和 Node.js 中运行。

### 配置 JavaScript 目标

```kotlin
// shared/build.gradle.kts
kotlin {
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
            testTask {
                useKarma {
                    useChromeHeadless()
                }
            }
        }
        binaries.executable()
    }
}
```

### JavaScript 特定代码

```kotlin
// jsMain/kotlin/com/example/js/Browser.kt
package com.example.js

import kotlinx.browser.document
import kotlinx.browser.window
import org.w3c.dom.*
import org.w3c.fetch.*
import kotlinx.coroutines.*
import kotlin.js.Promise

// 访问 DOM
class DomHelper {
    fun getElementById(id: String): HTMLElement? {
        return document.getElementById(id) as? HTMLElement
    }

    fun createElement(tag: String): HTMLElement {
        return document.createElement(tag) as HTMLElement
    }

    fun querySelector(selector: String): Element? {
        return document.querySelector(selector)
    }

    fun querySelectorAll(selector: String): NodeList {
        return document.querySelectorAll(selector)
    }

    fun addClickListener(element: HTMLElement, handler: (Event) -> Unit) {
        element.addEventListener("click", handler)
    }
}

// 使用 Fetch API
class JsHttpClient {
    suspend fun get(url: String): String {
        return suspendCancellableCoroutine { continuation ->
            window.fetch(url).then { response ->
                response.text().then { text ->
                    continuation.resume(text) {}
                }
            }.catch { error ->
                continuation.cancel(Exception(error.toString()))
            }
        }
    }

    suspend fun post(url: String, body: String): String {
        return suspendCancellableCoroutine { continuation ->
            val options = RequestInit(
                method = "POST",
                body = body,
                headers = json(
                    "Content-Type" to "application/json"
                )
            )
            window.fetch(url, options).then { response ->
                response.text().then { text ->
                    continuation.resume(text) {}
                }
            }.catch { error ->
                continuation.cancel(Exception(error.toString()))
            }
        }
    }
}

// 使用 localStorage
class JsStorage : KeyValueStorage {
    override suspend fun getString(key: String): String? {
        return window.localStorage.getItem(key)
    }

    override suspend fun putString(key: String, value: String) {
        window.localStorage.setItem(key, value)
    }

    override suspend fun remove(key: String) {
        window.localStorage.removeItem(key)
    }

    override suspend fun clear() {
        window.localStorage.clear()
    }
}
```

### 与 JavaScript 库互操作

```kotlin
// jsMain/kotlin/com/example/js/external/External.kt
package com.example.js.external

import kotlin.js.Json
import kotlin.js.Promise

// 声明外部 JavaScript 函数
external fun require(module: String): dynamic

// 声明外部 JavaScript 对象
external object JSON {
    fun parse(text: String): dynamic
    fun stringify(value: dynamic): String
}

// 声明外部 JavaScript 类
external class Date() {
    fun getTime(): Double
    fun toISOString(): String
    fun toLocaleDateString(): String
}

// 使用 @JsModule 导入 npm 包
@JsModule("axios")
@JsNonModule
external fun axios(config: dynamic): Promise<dynamic>

// 封装 axios
class AxiosClient {
    suspend fun get(url: String): String {
        return suspendCancellableCoroutine { continuation ->
            axios(json("url" to url, "method" to "get")).then { response ->
                continuation.resume(JSON.stringify(response.data)) {}
            }.catch { error ->
                continuation.cancel(Exception(error.toString()))
            }
        }
    }
}

// 辅助函数创建 JSON 对象
fun json(vararg pairs: Pair<String, Any?>): Json {
    val result = js("{}")
    for ((key, value) in pairs) {
        result[key] = value
    }
    return result as Json
}
```

### 导出 Kotlin 到 JavaScript

```kotlin
// jsMain/kotlin/com/example/js/Exports.kt
package com.example.js

import kotlin.js.JsExport
import kotlin.js.JsName

@JsExport
class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun subtract(a: Int, b: Int): Int = a - b
    fun multiply(a: Int, b: Int): Int = a * b
    fun divide(a: Int, b: Int): Double = a.toDouble() / b
}

@JsExport
@JsName("createGreeting")
fun greet(name: String): String {
    return "Hello, $name!"
}

@JsExport
data class Person(
    val name: String,
    val age: Int
) {
    fun introduce(): String {
        return "我是 $name，今年 $age 岁"
    }
}
```

在 JavaScript 中使用：

```javascript
// JavaScript 代码
import { Calculator, createGreeting, Person } from 'shared';

const calc = new Calculator();
console.log(calc.add(5, 3)); // 8

console.log(createGreeting("世界")); // Hello, 世界!

const person = new Person("张三", 25);
console.log(person.introduce()); // 我是 张三，今年 25 岁
```

## 平台特定实现

### 依赖注入

```kotlin
// commonMain/kotlin/com/example/di/DI.kt
package com.example.di

import com.example.domain.UserRepository
import com.example.network.ApiClient
import com.example.storage.KeyValueStorage

// 简单的依赖注入容器
object AppModule {
    private var _storage: KeyValueStorage? = null
    private var _apiClient: ApiClient? = null
    private var _userRepository: UserRepository? = null

    val storage: KeyValueStorage
        get() = _storage ?: throw IllegalStateException("Storage 未初始化")

    val apiClient: ApiClient
        get() = _apiClient ?: throw IllegalStateException("ApiClient 未初始化")

    val userRepository: UserRepository
        get() = _userRepository ?: throw IllegalStateException("UserRepository 未初始化")

    fun initialize(
        storage: KeyValueStorage,
        apiClient: ApiClient,
        userRepository: UserRepository
    ) {
        _storage = storage
        _apiClient = apiClient
        _userRepository = userRepository
    }
}

// 平台特定的初始化
expect fun initializeDependencies()
```

```kotlin
// androidMain/kotlin/com/example/di/DI.android.kt
package com.example.di

import android.content.Context
import com.example.domain.DefaultUserRepository
import com.example.network.ApiClient
import com.example.network.createHttpClient
import com.example.storage.AndroidStorage

private lateinit var appContext: Context

fun setApplicationContext(context: Context) {
    appContext = context.applicationContext
}

actual fun initializeDependencies() {
    val storage = AndroidStorage(appContext)
    val apiClient = ApiClient(
        baseUrl = "https://api.example.com",
        httpClient = createHttpClient()
    )
    val userRepository = DefaultUserRepository(apiClient, storage)

    AppModule.initialize(storage, apiClient, userRepository)
}
```

```kotlin
// iosMain/kotlin/com/example/di/DI.ios.kt
package com.example.di

import com.example.domain.DefaultUserRepository
import com.example.network.ApiClient
import com.example.network.createHttpClient
import com.example.storage.IOSStorage

actual fun initializeDependencies() {
    val storage = IOSStorage()
    val apiClient = ApiClient(
        baseUrl = "https://api.example.com",
        httpClient = createHttpClient()
    )
    val userRepository = DefaultUserRepository(apiClient, storage)

    AppModule.initialize(storage, apiClient, userRepository)
}
```

### 权限处理

```kotlin
// commonMain/kotlin/com/example/permissions/Permission.kt
package com.example.permissions

enum class Permission {
    CAMERA,
    LOCATION,
    STORAGE,
    MICROPHONE,
    NOTIFICATIONS
}

enum class PermissionStatus {
    GRANTED,
    DENIED,
    NOT_DETERMINED
}

interface PermissionHandler {
    suspend fun checkPermission(permission: Permission): PermissionStatus
    suspend fun requestPermission(permission: Permission): PermissionStatus
}

expect fun createPermissionHandler(): PermissionHandler
```

```kotlin
// androidMain/kotlin/com/example/permissions/Permission.android.kt
package com.example.permissions

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class AndroidPermissionHandler(
    private val context: Context,
    private val requestPermission: suspend (String) -> Boolean
) : PermissionHandler {

    override suspend fun checkPermission(permission: Permission): PermissionStatus {
        val androidPermission = permission.toAndroidPermission()
        return when {
            ContextCompat.checkSelfPermission(context, androidPermission) ==
                PackageManager.PERMISSION_GRANTED -> PermissionStatus.GRANTED
            else -> PermissionStatus.DENIED
        }
    }

    override suspend fun requestPermission(permission: Permission): PermissionStatus {
        val androidPermission = permission.toAndroidPermission()
        return if (requestPermission(androidPermission)) {
            PermissionStatus.GRANTED
        } else {
            PermissionStatus.DENIED
        }
    }

    private fun Permission.toAndroidPermission(): String = when (this) {
        Permission.CAMERA -> Manifest.permission.CAMERA
        Permission.LOCATION -> Manifest.permission.ACCESS_FINE_LOCATION
        Permission.STORAGE -> Manifest.permission.READ_EXTERNAL_STORAGE
        Permission.MICROPHONE -> Manifest.permission.RECORD_AUDIO
        Permission.NOTIFICATIONS -> Manifest.permission.POST_NOTIFICATIONS
    }
}

// 需要在 Activity 中初始化
private var permissionHandler: PermissionHandler? = null

fun initPermissionHandler(handler: PermissionHandler) {
    permissionHandler = handler
}

actual fun createPermissionHandler(): PermissionHandler {
    return permissionHandler ?: throw IllegalStateException("PermissionHandler 未初始化")
}
```

```kotlin
// iosMain/kotlin/com/example/permissions/Permission.ios.kt
package com.example.permissions

import platform.AVFoundation.*
import platform.CoreLocation.*
import platform.Photos.*
import platform.UserNotifications.*
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class IOSPermissionHandler : PermissionHandler {

    override suspend fun checkPermission(permission: Permission): PermissionStatus {
        return when (permission) {
            Permission.CAMERA -> checkCameraPermission()
            Permission.LOCATION -> checkLocationPermission()
            Permission.STORAGE -> checkPhotoLibraryPermission()
            Permission.MICROPHONE -> checkMicrophonePermission()
            Permission.NOTIFICATIONS -> checkNotificationPermission()
        }
    }

    override suspend fun requestPermission(permission: Permission): PermissionStatus {
        return when (permission) {
            Permission.CAMERA -> requestCameraPermission()
            Permission.LOCATION -> requestLocationPermission()
            Permission.STORAGE -> requestPhotoLibraryPermission()
            Permission.MICROPHONE -> requestMicrophonePermission()
            Permission.NOTIFICATIONS -> requestNotificationPermission()
        }
    }

    private fun checkCameraPermission(): PermissionStatus {
        return when (AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo)) {
            AVAuthorizationStatusAuthorized -> PermissionStatus.GRANTED
            AVAuthorizationStatusNotDetermined -> PermissionStatus.NOT_DETERMINED
            else -> PermissionStatus.DENIED
        }
    }

    private suspend fun requestCameraPermission(): PermissionStatus {
        return suspendCancellableCoroutine { continuation ->
            AVCaptureDevice.requestAccessForMediaType(AVMediaTypeVideo) { granted ->
                continuation.resume(
                    if (granted) PermissionStatus.GRANTED else PermissionStatus.DENIED
                )
            }
        }
    }

    private fun checkLocationPermission(): PermissionStatus {
        return when (CLLocationManager.authorizationStatus()) {
            kCLAuthorizationStatusAuthorizedWhenInUse,
            kCLAuthorizationStatusAuthorizedAlways -> PermissionStatus.GRANTED
            kCLAuthorizationStatusNotDetermined -> PermissionStatus.NOT_DETERMINED
            else -> PermissionStatus.DENIED
        }
    }

    private suspend fun requestLocationPermission(): PermissionStatus {
        // 位置权限需要通过 CLLocationManager 请求
        // 这里简化处理
        return PermissionStatus.NOT_DETERMINED
    }

    private fun checkPhotoLibraryPermission(): PermissionStatus {
        return when (PHPhotoLibrary.authorizationStatus()) {
            PHAuthorizationStatusAuthorized -> PermissionStatus.GRANTED
            PHAuthorizationStatusNotDetermined -> PermissionStatus.NOT_DETERMINED
            else -> PermissionStatus.DENIED
        }
    }

    private suspend fun requestPhotoLibraryPermission(): PermissionStatus {
        return suspendCancellableCoroutine { continuation ->
            PHPhotoLibrary.requestAuthorization { status ->
                continuation.resume(
                    if (status == PHAuthorizationStatusAuthorized)
                        PermissionStatus.GRANTED
                    else
                        PermissionStatus.DENIED
                )
            }
        }
    }

    private fun checkMicrophonePermission(): PermissionStatus {
        return when (AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeAudio)) {
            AVAuthorizationStatusAuthorized -> PermissionStatus.GRANTED
            AVAuthorizationStatusNotDetermined -> PermissionStatus.NOT_DETERMINED
            else -> PermissionStatus.DENIED
        }
    }

    private suspend fun requestMicrophonePermission(): PermissionStatus {
        return suspendCancellableCoroutine { continuation ->
            AVCaptureDevice.requestAccessForMediaType(AVMediaTypeAudio) { granted ->
                continuation.resume(
                    if (granted) PermissionStatus.GRANTED else PermissionStatus.DENIED
                )
            }
        }
    }

    private suspend fun checkNotificationPermission(): PermissionStatus {
        return suspendCancellableCoroutine { continuation ->
            UNUserNotificationCenter.currentNotificationCenter()
                .getNotificationSettingsWithCompletionHandler { settings ->
                    val status = when (settings?.authorizationStatus) {
                        UNAuthorizationStatusAuthorized -> PermissionStatus.GRANTED
                        UNAuthorizationStatusNotDetermined -> PermissionStatus.NOT_DETERMINED
                        else -> PermissionStatus.DENIED
                    }
                    continuation.resume(status)
                }
        }
    }

    private suspend fun requestNotificationPermission(): PermissionStatus {
        return suspendCancellableCoroutine { continuation ->
            UNUserNotificationCenter.currentNotificationCenter()
                .requestAuthorizationWithOptions(
                    UNAuthorizationOptionAlert or
                    UNAuthorizationOptionBadge or
                    UNAuthorizationOptionSound
                ) { granted, _ ->
                    continuation.resume(
                        if (granted) PermissionStatus.GRANTED else PermissionStatus.DENIED
                    )
                }
        }
    }
}

actual fun createPermissionHandler(): PermissionHandler = IOSPermissionHandler()
```

## 实战示例

### 完整的跨平台应用

```kotlin
// commonMain/kotlin/com/example/app/App.kt
package com.example.app

import com.example.di.AppModule
import com.example.viewmodel.UserViewModel
import com.example.viewmodel.UiState
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// 应用入口点
class App(private val scope: CoroutineScope) {

    private val userViewModel by lazy {
        UserViewModel(AppModule.userRepository, scope)
    }

    fun start() {
        // 启动时加载数据
        observeUsers()
    }

    private fun observeUsers() {
        scope.launch {
            userViewModel.users.collect { state ->
                when (state) {
                    is UiState.Loading -> onLoading()
                    is UiState.Success -> onUsersLoaded(state.data)
                    is UiState.Error -> onError(state.message)
                }
            }
        }
    }

    // 这些方法可以被平台特定的 UI 覆盖
    open fun onLoading() {
        println("正在加载...")
    }

    open fun onUsersLoaded(users: List<User>) {
        println("加载了 ${users.size} 个用户")
        users.forEach { user ->
            println("  - ${user.username}: ${user.email}")
        }
    }

    open fun onError(message: String) {
        println("错误: $message")
    }

    fun createUser(username: String, email: String) {
        userViewModel.createUser(username, email)
    }

    fun deleteUser(userId: Long) {
        userViewModel.deleteUser(userId)
    }

    fun refreshUsers() {
        userViewModel.loadUsers()
    }
}
```

### 单元测试

```kotlin
// commonTest/kotlin/com/example/test/UserViewModelTest.kt
package com.example.test

import com.example.domain.UserRepository
import com.example.model.User
import com.example.model.ApiResponse
import com.example.viewmodel.UserViewModel
import com.example.viewmodel.UiState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class UserViewModelTest {

    private val testUsers = listOf(
        User(1, "张三", "zhangsan@example.com", null, 1000L),
        User(2, "李四", "lisi@example.com", null, 2000L)
    )

    private val fakeRepository = object : UserRepository {
        override suspend fun getUser(id: Long): User? {
            return testUsers.find { it.id == id }
        }

        override suspend fun getUsers(): List<User> {
            return testUsers
        }

        override suspend fun createUser(user: User): ApiResponse<User> {
            return ApiResponse(true, user.copy(id = 3), null)
        }

        override suspend fun updateUser(user: User): ApiResponse<User> {
            return ApiResponse(true, user, null)
        }

        override suspend fun deleteUser(id: Long): ApiResponse<Unit> {
            return ApiResponse(true, Unit, null)
        }

        override fun observeUsers(): Flow<List<User>> {
            return flowOf(testUsers)
        }
    }

    @Test
    fun loadUsers_success() = runTest {
        val viewModel = UserViewModel(fakeRepository, this)

        advanceUntilIdle()

        val state = viewModel.users.value
        assertTrue(state is UiState.Success)
        assertEquals(2, (state as UiState.Success).data.size)
    }

    @Test
    fun loadUsers_containsExpectedUsers() = runTest {
        val viewModel = UserViewModel(fakeRepository, this)

        advanceUntilIdle()

        val state = viewModel.users.value as UiState.Success
        val usernames = state.data.map { it.username }
        assertTrue(usernames.contains("张三"))
        assertTrue(usernames.contains("李四"))
    }

    @Test
    fun selectUser_updatesSelectedUser() = runTest {
        val viewModel = UserViewModel(fakeRepository, this)

        advanceUntilIdle()

        viewModel.selectUser(testUsers[0])

        assertEquals(testUsers[0], viewModel.selectedUser.value)
    }
}
```

### 集成测试

```kotlin
// commonTest/kotlin/com/example/test/ApiClientTest.kt
package com.example.test

import com.example.network.ApiClient
import io.ktor.client.*
import io.ktor.client.engine.mock.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class ApiClientTest {

    @Serializable
    data class TestUser(val id: Long, val name: String)

    private fun createMockClient(response: String): HttpClient {
        return HttpClient(MockEngine) {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                })
            }
            engine {
                addHandler { request ->
                    respond(
                        content = response,
                        status = HttpStatusCode.OK,
                        headers = headersOf(
                            HttpHeaders.ContentType,
                            ContentType.Application.Json.toString()
                        )
                    )
                }
            }
        }
    }

    @Test
    fun get_parsesResponse() = runTest {
        val mockClient = createMockClient("""{"id": 1, "name": "测试用户"}""")
        val apiClient = ApiClient("https://api.test.com", mockClient)

        val user = apiClient.get<TestUser>("/user/1")

        assertNotNull(user)
        assertEquals(1L, user.id)
        assertEquals("测试用户", user.name)
    }

    @Test
    fun get_parsesListResponse() = runTest {
        val mockClient = createMockClient(
            """[{"id": 1, "name": "用户1"}, {"id": 2, "name": "用户2"}]"""
        )
        val apiClient = ApiClient("https://api.test.com", mockClient)

        val users = apiClient.get<List<TestUser>>("/users")

        assertNotNull(users)
        assertEquals(2, users.size)
    }
}
```

## 最佳实践

### 合理划分共享代码

```kotlin
// 推荐：将可共享的业务逻辑放在 commonMain
// commonMain/kotlin/com/example/domain/
// - 数据模型
// - 业务规则
// - 仓库接口
// - 用例

// 不推荐：在 commonMain 中使用平台特定的 API
// 如果需要，使用 expect/actual
```

### 使用接口抽象平台差异

```kotlin
// 推荐
interface Logger {
    fun log(level: LogLevel, message: String)
}

expect fun createLogger(): Logger

// 不推荐：直接在 commonMain 中使用 expect class
expect class PlatformLogger {
    fun log(message: String)
}
```

### 处理协程作用域

```kotlin
// 推荐：注入 CoroutineScope
class UserViewModel(
    private val repository: UserRepository,
    private val scope: CoroutineScope
)

// Android 使用
class AndroidUserViewModel : ViewModel() {
    private val viewModel = UserViewModel(repo, viewModelScope)
}

// iOS 使用
class IOSUserViewModel {
    private val scope = MainScope()
    private val viewModel = UserViewModel(repo, scope)

    fun clear() {
        scope.cancel()
    }
}
```

### 错误处理

```kotlin
// 定义通用的错误类型
sealed class AppError {
    data class Network(val message: String) : AppError()
    data class Validation(val field: String, val message: String) : AppError()
    data class Unknown(val throwable: Throwable) : AppError()
}

// 使用 Result 类型
suspend fun <T> safeCall(block: suspend () -> T): Result<T> {
    return try {
        Result.success(block())
    } catch (e: Exception) {
        Result.failure(e)
    }
}

// 使用示例
suspend fun loadUser(id: Long): Result<User> = safeCall {
    repository.getUser(id) ?: throw NoSuchElementException("用户不存在")
}
```

### 资源管理

```kotlin
// commonMain/kotlin/com/example/resources/Strings.kt
object Strings {
    const val APP_NAME = "我的应用"
    const val LOADING = "加载中..."
    const val ERROR_NETWORK = "网络错误，请检查连接"
    const val ERROR_UNKNOWN = "未知错误"

    fun userGreeting(name: String) = "你好，$name！"
    fun itemCount(count: Int) = "共 $count 项"
}

// 平台特定的本地化可以通过 expect/actual 实现
expect fun getLocalizedString(key: String): String
```

### 版本兼容

```kotlin
// 使用 @OptIn 处理实验性 API
@OptIn(ExperimentalCoroutinesApi::class)
fun someFunction() {
    // 使用实验性 API
}

// 使用 @Suppress 处理弃用警告
@Suppress("DEPRECATION")
fun legacyFunction() {
    // 使用已弃用的 API
}
```

## 常见问题与解决方案

### iOS 框架导出问题

```kotlin
// build.gradle.kts
kotlin {
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach {
        it.binaries.framework {
            baseName = "shared"
            isStatic = true
            // 导出依赖
            export(project(":core"))
        }
    }
}
```

### JavaScript 模块问题

```kotlin
// jsMain 中使用 npm 依赖
kotlin {
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport { enabled.set(true) }
            }
        }
        // 生成 npm 包
        compilations["main"].packageJson {
            customField("main", "kotlin/my-app.js")
        }
    }
}

// 在 build.gradle.kts 中添加 npm 依赖
dependencies {
    implementation(npm("axios", "1.6.0"))
}
```

### 协程取消问题

```kotlin
// 确保正确处理协程取消
class SafeRepository(private val api: Api) {
    suspend fun fetchData(): Result<Data> {
        return try {
            withContext(Dispatchers.IO) {
                // 检查取消状态
                ensureActive()
                val data = api.getData()
                ensureActive()
                Result.success(data)
            }
        } catch (e: CancellationException) {
            // 重新抛出取消异常
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 内存泄漏

```kotlin
// iOS 中避免循环引用
class IOSViewModel {
    private val scope = MainScope()

    // 使用 WeakReference 避免循环引用
    private var callback: (() -> Unit)? = null

    fun setCallback(cb: () -> Unit) {
        callback = cb
    }

    fun clear() {
        callback = null
        scope.cancel()
    }
}
```

## 总结

Kotlin Multiplatform 是一个强大的跨平台开发工具，它提供了：

1. **代码共享**：在多个平台之间共享业务逻辑、数据模型和网络层
2. **原生性能**：每个平台都编译为原生代码，没有运行时开销
3. **灵活的 UI**：可以使用原生 UI 或 Compose Multiplatform
4. **渐进式采用**：可以逐步将现有项目迁移到 KMP
5. **丰富的生态**：支持 Ktor、Kotlinx.serialization、SQLDelight 等优秀库

关键概念回顾：

- **expect/actual**：声明和实现平台特定功能的机制
- **源集（Source Sets）**：组织不同平台代码的方式
- **Kotlin/Native**：编译为原生代码，支持 iOS 等平台
- **Kotlin/JS**：编译为 JavaScript，支持浏览器和 Node.js

通过合理使用 KMP，你可以显著减少重复代码，提高开发效率，同时保持各平台的原生体验。随着 Compose Multiplatform 的成熟，KMP 将成为跨平台开发的主流选择。

## 下一步学习

- Compose Multiplatform：跨平台 UI 框架
- SQLDelight：跨平台数据库
- Ktor：跨平台网络库
- Kotlinx.datetime：跨平台日期时间处理
- Koin/Kodein：跨平台依赖注入
