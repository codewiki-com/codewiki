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
origin: old/src/content/docs/kotlin/multiplatform.en.md
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

Kotlin Multiplatform (KMP) is a cross-platform development technology from JetBrains that allows developers to share business logic code across multiple platforms while maintaining the flexibility of native UI and platform-specific features. We'll cover various aspects of KMP in depth, from project structure to practical applications.

## What is Kotlin Multiplatform

### Core Concepts

Kotlin Multiplatform is a code sharing strategy that allows you to:

1. **Share business logic**: Network requests, data processing, business rules, etc.
2. **Keep native UI**: Each platform uses its native UI framework
3. **Access platform APIs**: Call platform-specific features through the expect/actual mechanism
4. **Gradual adoption**: Existing projects can be migrated to KMP incrementally

### KMP vs Other Cross-Platform Solutions

| Feature | KMP | Flutter | React Native |
|---------|-----|---------|--------------|
| UI Approach | Native UI or Compose Multiplatform | Custom rendering engine | Bridge to native components |
| Code Sharing | Business logic | Full stack | Full stack |
| Performance | Native performance | Near native | Depends on bridging |
| Learning Curve | Kotlin developer friendly | Dart language | JavaScript/React |
| Native Integration | Seamless | Requires platform channels | Requires bridging |

### Supported Platforms

Kotlin Multiplatform supports the following target platforms:

- **JVM**: Android, server-side applications
- **Native**: iOS, macOS, Linux, Windows
- **JavaScript**: Browser applications, Node.js
- **WebAssembly**: Browser applications (experimental)

## Project Structure

### Standard Project Layout

A typical KMP project structure is as follows:

```
my-kmp-project/
├── build.gradle.kts
├── settings.gradle.kts
├── shared/                          # Shared module
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/              # Common code
│       │   └── kotlin/
│       │       └── com/example/
│       │           ├── Platform.kt
│       │           └── Greeting.kt
│       ├── commonTest/              # Common tests
│       │   └── kotlin/
│       ├── androidMain/             # Android-specific code
│       │   └── kotlin/
│       │       └── com/example/
│       │           └── Platform.android.kt
│       ├── iosMain/                 # iOS-specific code
│       │   └── kotlin/
│       │       └── com/example/
│       │           └── Platform.ios.kt
│       ├── jvmMain/                 # JVM-specific code
│       │   └── kotlin/
│       └── jsMain/                  # JavaScript-specific code
│           └── kotlin/
├── androidApp/                      # Android application
│   ├── build.gradle.kts
│   └── src/
└── iosApp/                          # iOS application (Xcode project)
    └── iosApp/
```

### Configuring build.gradle.kts

Build configuration for the shared module:

```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
}

kotlin {
    // Target platform configuration
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "1.8"
            }
        }
    }

    // iOS targets
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

    // JVM target
    jvm("desktop")

    // JavaScript target
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
    }

    // Source set configuration
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

### Version Catalog Configuration

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

## The expect/actual Mechanism

### Basic Concepts

`expect`/`actual` is the core mechanism of KMP, used to declare platform-specific implementations in shared code.

- **expect**: Declares the expected interface or class in commonMain
- **actual**: Provides the actual implementation in each platform source set

### Basic Usage

```kotlin
// commonMain/kotlin/com/example/Platform.kt
package com.example

// Declare expected class
expect class Platform() {
    val name: String
    val version: String
}

// Declare expected function
expect fun getPlatformName(): String

// Use expected declarations
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

### Interface Pattern

For more complex scenarios, you can use the interface pattern:

```kotlin
// commonMain/kotlin/com/example/storage/Storage.kt
package com.example.storage

// Define common interface
interface KeyValueStorage {
    suspend fun getString(key: String): String?
    suspend fun putString(key: String, value: String)
    suspend fun remove(key: String)
    suspend fun clear()
}

// Declare factory function
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

// Context needs to be provided via dependency injection
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

### Advanced Usage of expect/actual

#### Type Aliases

```kotlin
// commonMain
expect class UUID

// jvmMain
actual typealias UUID = java.util.UUID

// iosMain
import platform.Foundation.NSUUID
actual typealias UUID = NSUUID
```

#### Annotations

```kotlin
// commonMain
@OptionalExpectation
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.BINARY)
expect annotation class Parcelize()

// androidMain
import kotlinx.parcelize.Parcelize as AndroidParcelize
actual typealias Parcelize = AndroidParcelize

// iosMain - No implementation needed due to @OptionalExpectation
```

#### Functions with Default Parameters

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

## Code Sharing Strategies

### Sharing Data Models

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

// Data validation
fun User.isValid(): Boolean {
    return username.isNotBlank() &&
           email.contains("@") &&
           email.contains(".")
}

// Data transformation
fun User.toDisplayName(): String {
    return username.replaceFirstChar { it.uppercase() }
}
```

### Sharing Business Logic

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

// Default implementation
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
            kotlinx.coroutines.delay(5000) // Refresh every 5 seconds
        }
    }
}
```

### Sharing the Network Layer

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

// Create platform-specific HttpClient
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
            println("GET request failed: ${e.message}")
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

### Sharing State Management

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

// UI State
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
                _users.value = UiState.Error(e.message ?: "Failed to load users")
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
                loadUsers() // Refresh list
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

// Platform-specific implementation for getting current time
expect fun currentTimeMillis(): Long
```

## Kotlin/Native

### Overview

Kotlin/Native is a technology that compiles Kotlin to native binary code, running without a virtual machine. It is primarily used for iOS, macOS, Linux, and Windows development.

### Memory Management

Kotlin/Native uses automatic memory management:

```kotlin
// commonMain
class DataProcessor {
    private val cache = mutableMapOf<String, Any>()

    fun process(key: String, data: Any): Any {
        return cache.getOrPut(key) {
            // Process data
            transform(data)
        }
    }

    private fun transform(data: Any): Any {
        // Data transformation logic
        return data
    }

    fun clearCache() {
        cache.clear()
    }
}
```

### Interoperability with Objective-C/Swift

```kotlin
// iosMain/kotlin/com/example/ios/IOSIntegration.kt
package com.example.ios

import platform.Foundation.*
import platform.UIKit.*
import kotlinx.cinterop.*

// Using iOS frameworks
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

// Using NSFileManager
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

// Using NSUserDefaults
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

### Exporting Swift-Friendly APIs

```kotlin
// iosMain/kotlin/com/example/ios/SwiftExports.kt
package com.example.ios

import kotlinx.coroutines.*
import kotlin.native.concurrent.freeze

// Provide callback-style APIs for Swift
class UserService(private val repository: UserRepository) {

    // Swift-friendly async method
    fun fetchUsers(
        onSuccess: (List<User>) -> Unit,
        onError: (String) -> Unit
    ) {
        MainScope().launch {
            try {
                val users = repository.getUsers()
                onSuccess(users)
            } catch (e: Exception) {
                onError(e.message ?: "Unknown error")
            }
        }
    }

    // Return cancellable task
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

Usage in Swift:

```swift
// Swift code
import shared

class UserListViewController: UIViewController {
    private let userService = UserService(repository: DefaultUserRepository())
    private var usersObserver: Cancellable?

    override func viewDidLoad() {
        super.viewDidLoad()

        // Fetch users
        userService.fetchUsers(
            onSuccess: { users in
                self.updateUI(with: users)
            },
            onError: { error in
                self.showError(error)
            }
        )

        // Observe user changes
        usersObserver = userService.observeUsers { users in
            self.updateUI(with: users)
        }
    }

    deinit {
        usersObserver?.cancel()
    }

    private func updateUI(with users: [User]) {
        // Update UI
    }

    private func showError(_ message: String) {
        // Show error
    }
}
```

## Kotlin/JS

### Overview

Kotlin/JS compiles Kotlin to JavaScript, which can run in browsers and Node.js.

### Configuring JavaScript Target

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

### JavaScript-Specific Code

```kotlin
// jsMain/kotlin/com/example/js/Browser.kt
package com.example.js

import kotlinx.browser.document
import kotlinx.browser.window
import org.w3c.dom.*
import org.w3c.fetch.*
import kotlinx.coroutines.*
import kotlin.js.Promise

// Accessing the DOM
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

// Using Fetch API
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

// Using localStorage
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

### Interoperability with JavaScript Libraries

```kotlin
// jsMain/kotlin/com/example/js/external/External.kt
package com.example.js.external

import kotlin.js.Json
import kotlin.js.Promise

// Declare external JavaScript functions
external fun require(module: String): dynamic

// Declare external JavaScript objects
external object JSON {
    fun parse(text: String): dynamic
    fun stringify(value: dynamic): String
}

// Declare external JavaScript classes
external class Date() {
    fun getTime(): Double
    fun toISOString(): String
    fun toLocaleDateString(): String
}

// Import npm packages with @JsModule
@JsModule("axios")
@JsNonModule
external fun axios(config: dynamic): Promise<dynamic>

// Wrap axios
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

// Helper function to create JSON objects
fun json(vararg pairs: Pair<String, Any?>): Json {
    val result = js("{}")
    for ((key, value) in pairs) {
        result[key] = value
    }
    return result as Json
}
```

### Exporting Kotlin to JavaScript

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
        return "I'm $name, $age years old"
    }
}
```

Usage in JavaScript:

```javascript
// JavaScript code
import { Calculator, createGreeting, Person } from 'shared';

const calc = new Calculator();
console.log(calc.add(5, 3)); // 8

console.log(createGreeting("World")); // Hello, World!

const person = new Person("John", 25);
console.log(person.introduce()); // I'm John, 25 years old
```

## Platform-Specific Implementations

### Dependency Injection

```kotlin
// commonMain/kotlin/com/example/di/DI.kt
package com.example.di

import com.example.domain.UserRepository
import com.example.network.ApiClient
import com.example.storage.KeyValueStorage

// Simple dependency injection container
object AppModule {
    private var _storage: KeyValueStorage? = null
    private var _apiClient: ApiClient? = null
    private var _userRepository: UserRepository? = null

    val storage: KeyValueStorage
        get() = _storage ?: throw IllegalStateException("Storage not initialized")

    val apiClient: ApiClient
        get() = _apiClient ?: throw IllegalStateException("ApiClient not initialized")

    val userRepository: UserRepository
        get() = _userRepository ?: throw IllegalStateException("UserRepository not initialized")

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

// Platform-specific initialization
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

### Permission Handling

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

// Needs to be initialized in Activity
private var permissionHandler: PermissionHandler? = null

fun initPermissionHandler(handler: PermissionHandler) {
    permissionHandler = handler
}

actual fun createPermissionHandler(): PermissionHandler {
    return permissionHandler ?: throw IllegalStateException("PermissionHandler not initialized")
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
        // Location permissions need to be requested via CLLocationManager
        // Simplified handling here
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

## Practical Examples

### Complete Cross-Platform Application

```kotlin
// commonMain/kotlin/com/example/app/App.kt
package com.example.app

import com.example.di.AppModule
import com.example.viewmodel.UserViewModel
import com.example.viewmodel.UiState
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// Application entry point
class App(private val scope: CoroutineScope) {

    private val userViewModel by lazy {
        UserViewModel(AppModule.userRepository, scope)
    }

    fun start() {
        // Load data on startup
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

    // These methods can be overridden by platform-specific UI
    open fun onLoading() {
        println("Loading...")
    }

    open fun onUsersLoaded(users: List<User>) {
        println("Loaded ${users.size} users")
        users.forEach { user ->
            println("  - ${user.username}: ${user.email}")
        }
    }

    open fun onError(message: String) {
        println("Error: $message")
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

### Unit Testing

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
        User(1, "John", "john@example.com", null, 1000L),
        User(2, "Jane", "jane@example.com", null, 2000L)
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
        assertTrue(usernames.contains("John"))
        assertTrue(usernames.contains("Jane"))
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

### Integration Testing

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
        val mockClient = createMockClient("""{"id": 1, "name": "Test User"}""")
        val apiClient = ApiClient("https://api.test.com", mockClient)

        val user = apiClient.get<TestUser>("/user/1")

        assertNotNull(user)
        assertEquals(1L, user.id)
        assertEquals("Test User", user.name)
    }

    @Test
    fun get_parsesListResponse() = runTest {
        val mockClient = createMockClient(
            """[{"id": 1, "name": "User 1"}, {"id": 2, "name": "User 2"}]"""
        )
        val apiClient = ApiClient("https://api.test.com", mockClient)

        val users = apiClient.get<List<TestUser>>("/users")

        assertNotNull(users)
        assertEquals(2, users.size)
    }
}
```

## Best Practices

### Reasonable Division of Shared Code

```kotlin
// Recommended: Place shareable business logic in commonMain
// commonMain/kotlin/com/example/domain/
// - Data models
// - Business rules
// - Repository interfaces
// - Use cases

// Not recommended: Using platform-specific APIs in commonMain
// If needed, use expect/actual
```

### Use Interfaces to Abstract Platform Differences

```kotlin
// Recommended
interface Logger {
    fun log(level: LogLevel, message: String)
}

expect fun createLogger(): Logger

// Not recommended: Using expect class directly in commonMain
expect class PlatformLogger {
    fun log(message: String)
}
```

### Handle Coroutine Scopes

```kotlin
// Recommended: Inject CoroutineScope
class UserViewModel(
    private val repository: UserRepository,
    private val scope: CoroutineScope
)

// Android usage
class AndroidUserViewModel : ViewModel() {
    private val viewModel = UserViewModel(repo, viewModelScope)
}

// iOS usage
class IOSUserViewModel {
    private val scope = MainScope()
    private val viewModel = UserViewModel(repo, scope)

    fun clear() {
        scope.cancel()
    }
}
```

### Error Handling

```kotlin
// Define common error types
sealed class AppError {
    data class Network(val message: String) : AppError()
    data class Validation(val field: String, val message: String) : AppError()
    data class Unknown(val throwable: Throwable) : AppError()
}

// Use Result type
suspend fun <T> safeCall(block: suspend () -> T): Result<T> {
    return try {
        Result.success(block())
    } catch (e: Exception) {
        Result.failure(e)
    }
}

// Usage example
suspend fun loadUser(id: Long): Result<User> = safeCall {
    repository.getUser(id) ?: throw NoSuchElementException("User not found")
}
```

### Resource Management

```kotlin
// commonMain/kotlin/com/example/resources/Strings.kt
object Strings {
    const val APP_NAME = "My App"
    const val LOADING = "Loading..."
    const val ERROR_NETWORK = "Network error, please check your connection"
    const val ERROR_UNKNOWN = "Unknown error"

    fun userGreeting(name: String) = "Hello, $name!"
    fun itemCount(count: Int) = "Total $count items"
}

// Platform-specific localization can be implemented via expect/actual
expect fun getLocalizedString(key: String): String
```

### Version Compatibility

```kotlin
// Use @OptIn for experimental APIs
@OptIn(ExperimentalCoroutinesApi::class)
fun someFunction() {
    // Use experimental API
}

// Use @Suppress for deprecation warnings
@Suppress("DEPRECATION")
fun legacyFunction() {
    // Use deprecated API
}
```

## Common Issues and Solutions

### iOS Framework Export Issues

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
            // Export dependencies
            export(project(":core"))
        }
    }
}
```

### JavaScript Module Issues

```kotlin
// Using npm dependencies in jsMain
kotlin {
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport { enabled.set(true) }
            }
        }
        // Generate npm package
        compilations["main"].packageJson {
            customField("main", "kotlin/my-app.js")
        }
    }
}

// Add npm dependencies in build.gradle.kts
dependencies {
    implementation(npm("axios", "1.6.0"))
}
```

### Coroutine Cancellation Issues

```kotlin
// Ensure proper handling of coroutine cancellation
class SafeRepository(private val api: Api) {
    suspend fun fetchData(): Result<Data> {
        return try {
            withContext(Dispatchers.IO) {
                // Check cancellation status
                ensureActive()
                val data = api.getData()
                ensureActive()
                Result.success(data)
            }
        } catch (e: CancellationException) {
            // Rethrow cancellation exception
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### Memory Leaks

```kotlin
// Avoid circular references in iOS
class IOSViewModel {
    private val scope = MainScope()

    // Use WeakReference to avoid circular references
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

## Summary

Kotlin Multiplatform is a powerful cross-platform development tool that provides:

1. **Code Sharing**: Share business logic, data models, and network layer across multiple platforms
2. **Native Performance**: Compiles to native code on each platform with no runtime overhead
3. **Flexible UI**: Use native UI or Compose Multiplatform
4. **Gradual Adoption**: Existing projects can be migrated to KMP incrementally
5. **Rich Ecosystem**: Supports excellent libraries like Ktor, Kotlinx.serialization, SQLDelight, etc.

Key concepts recap:

- **expect/actual**: Mechanism for declaring and implementing platform-specific features
- **Source Sets**: Way of organizing code for different platforms
- **Kotlin/Native**: Compiles to native code, supporting iOS and other platforms
- **Kotlin/JS**: Compiles to JavaScript, supporting browsers and Node.js

By properly using KMP, you can significantly reduce duplicate code, boost developer productivity, while maintaining native experience on each platform. With the maturation of Compose Multiplatform, KMP is becoming the mainstream choice for cross-platform development.

## Next Steps

- Compose Multiplatform: Cross-platform UI framework
- SQLDelight: Cross-platform database
- Ktor: Cross-platform networking library
- Kotlinx.datetime: Cross-platform date/time handling
- Koin/Kodein: Cross-platform dependency injection
