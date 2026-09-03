---
title: Kotlin/Native 跨平台开发
description: Kotlin/Native 完全指南：构建跨平台应用、iOS 开发、原生互操作和内存管理
track: kotlin
section: android-multiplatform
difficulty: advanced
tags:
  - Kotlin
  - Native
  - 跨平台
  - iOS
  - KMP
  - 多平台
status: imported
origin: old/src/content/docs/kotlin/kotlin-native.zh.md
divergence: 0.22
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 23
  lastUpdated: 2026-01-22
---

Kotlin/Native 是一种将 Kotlin 代码编译为原生二进制文件的技术，无需虚拟机。它支持在多个平台（包括 iOS、macOS、Linux、Windows 和嵌入式系统）之间共享业务逻辑，同时在需要时可以使用特定平台的 API。

## 概念解释

Kotlin/Native 是 Kotlin 多平台（KMP）的一部分，允许在不同平台之间共享代码，同时仍可访问原生平台 API。与抽象掉平台的跨平台框架不同，Kotlin/Native 编译为直接在目标系统上运行的实际原生代码。

关键特性：
- **原生编译**：生成无需虚拟机的独立可执行文件
- **互操作性**：直接访问 C、Objective-C 和 Swift API
- **内存管理**：自动内存管理，无垃圾回收暂停
- **平台库**：访问 POSIX、CoreFoundation、UIKit 等

```kotlin
// 为所有平台编译的共享代码
expect class Platform() {
    val name: String
}

fun greet(): String = "来自 ${Platform().name} 的问候！"

// iOS 实现
actual class Platform {
    actual val name: String = UIDevice.currentDevice.systemName()
}

// Android 实现
actual class Platform {
    actual val name: String = "Android ${Build.VERSION.SDK_INT}"
}
```

## 核心原理

### Kotlin 多平台架构

```
┌─────────────────────────────────────────────────────────────┐
│                         应用层                               │
├───────────────┬─────────────────────────┬───────────────────┤
│  Android UI   │        共享代码         │      iOS UI       │
│   (Compose)   │    (Kotlin/Common)      │    (SwiftUI)      │
├───────────────┼─────────────────────────┼───────────────────┤
│               │      业务逻辑           │                    │
│  Kotlin/JVM   │      数据模型           │   Kotlin/Native   │
│               │       网络              │                    │
│               │       数据库            │                    │
├───────────────┴─────────────────────────┴───────────────────┤
│                    平台特定实现                               │
│  ┌─────────────────┐              ┌─────────────────────┐   │
│  │ Android API     │              │  iOS API (UIKit,    │   │
│  │ (Context 等)    │              │  CoreData 等)       │   │
│  └─────────────────┘              └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 项目结构

```
my-kmp-project/
├── build.gradle.kts
├── settings.gradle.kts
├── shared/
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/
│       │   └── kotlin/
│       │       └── com/example/shared/
│       │           ├── Platform.kt
│       │           ├── Greeting.kt
│       │           └── data/
│       │               └── Repository.kt
│       ├── commonTest/
│       │   └── kotlin/
│       ├── androidMain/
│       │   └── kotlin/
│       │       └── com/example/shared/
│       │           └── Platform.android.kt
│       ├── iosMain/
│       │   └── kotlin/
│       │       └── com/example/shared/
│       │           └── Platform.ios.kt
│       └── iosTest/
├── androidApp/
│   ├── build.gradle.kts
│   └── src/main/
└── iosApp/
    └── iosApp.xcodeproj
```

## 关键概念

### 设置 KMP 项目

```kotlin
// shared/build.gradle.kts
plugins {
    kotlin("multiplatform")
    kotlin("native.cocoapods")
    id("com.android.library")
    kotlin("plugin.serialization")
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }

    iosX64()
    iosArm64()
    iosSimulatorArm64()

    cocoapods {
        summary = "iOS 和 Android 的共享模块"
        homepage = "https://example.com"
        version = "1.0"
        ios.deploymentTarget = "14.0"
        podfile = project.file("../iosApp/Podfile")

        framework {
            baseName = "shared"
            isStatic = true
        }
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
                implementation("io.ktor:ktor-client-core:2.3.7")
            }
        }
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
            }
        }
        val androidMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-android:2.3.7")
            }
        }
        val iosMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-darwin:2.3.7")
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

### Expect/Actual 机制

```kotlin
// commonMain - 声明预期声明
expect class Platform() {
    val name: String
    val version: String
}

expect fun randomUUID(): String

expect class FileSystem {
    fun readFile(path: String): String?
    fun writeFile(path: String, content: String): Boolean
}

// androidMain - 提供实际实现
actual class Platform {
    actual val name: String = "Android"
    actual val version: String = Build.VERSION.RELEASE
}

actual fun randomUUID(): String = UUID.randomUUID().toString()

actual class FileSystem {
    actual fun readFile(path: String): String? {
        return try {
            File(path).readText()
        } catch (e: Exception) {
            null
        }
    }

    actual fun writeFile(path: String, content: String): Boolean {
        return try {
            File(path).writeText(content)
            true
        } catch (e: Exception) {
            false
        }
    }
}

// iosMain - 提供 iOS 实现
import platform.Foundation.*
import platform.UIKit.UIDevice

actual class Platform {
    actual val name: String = UIDevice.currentDevice.systemName
    actual val version: String = UIDevice.currentDevice.systemVersion
}

actual fun randomUUID(): String = NSUUID().UUIDString

actual class FileSystem {
    actual fun readFile(path: String): String? {
        return NSString.stringWithContentsOfFile(path, NSUTF8StringEncoding, null)
    }

    actual fun writeFile(path: String, content: String): Boolean {
        return (content as NSString).writeToFile(
            path,
            atomically = true,
            encoding = NSUTF8StringEncoding,
            error = null
        )
    }
}
```

### Kotlin/Native 中的协程

```kotlin
// 共享协程代码
class DataRepository(
    private val api: ApiClient,
    private val database: Database
) {
    // 在任何平台上运行
    suspend fun fetchAndCacheData(): List<Item> {
        val items = api.fetchItems()
        database.saveItems(items)
        return items
    }

    fun observeItems(): Flow<List<Item>> {
        return database.observeItems()
    }
}

// iOS 特定：将 Flow 暴露给 Swift
class DataRepositoryWrapper(private val repository: DataRepository) {

    // 将 Flow 转换为 Swift 友好的回调模式
    fun observeItems(
        onEach: (List<Item>) -> Unit,
        onComplete: () -> Unit,
        onError: (Throwable) -> Unit
    ): Cancellable {
        val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

        scope.launch {
            try {
                repository.observeItems().collect { items ->
                    onEach(items)
                }
                onComplete()
            } catch (e: Throwable) {
                onError(e)
            }
        }

        return object : Cancellable {
            override fun cancel() {
                scope.cancel()
            }
        }
    }
}

interface Cancellable {
    fun cancel()
}
```

## 代码示例

### 使用 Ktor 进行网络请求

```kotlin
// commonMain
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String
)

class ApiClient {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    suspend fun getUsers(): List<User> {
        return client.get("https://api.example.com/users").body()
    }

    suspend fun getUser(id: Int): User {
        return client.get("https://api.example.com/users/$id").body()
    }

    suspend fun createUser(user: User): User {
        return client.post("https://api.example.com/users") {
            setBody(user)
        }.body()
    }
}

// 平台特定的 HTTP 引擎通过依赖配置
// androidMain 使用 ktor-client-android
// iosMain 使用 ktor-client-darwin
```

### SQLDelight 数据库

```kotlin
// build.gradle.kts
plugins {
    id("app.cash.sqldelight") version "2.0.1"
}

sqldelight {
    databases {
        create("AppDatabase") {
            packageName.set("com.example.db")
        }
    }
}
```

```sql
-- src/commonMain/sqldelight/com/example/db/User.sq
CREATE TABLE User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

selectAll:
SELECT * FROM User ORDER BY created_at DESC;

selectById:
SELECT * FROM User WHERE id = ?;

insert:
INSERT INTO User (name, email, created_at)
VALUES (?, ?, ?);

deleteById:
DELETE FROM User WHERE id = ?;
```

```kotlin
// commonMain
expect class DatabaseDriverFactory {
    fun createDriver(): SqlDriver
}

class UserRepository(driverFactory: DatabaseDriverFactory) {
    private val database = AppDatabase(driverFactory.createDriver())
    private val queries = database.userQueries

    fun getAllUsers(): List<User> {
        return queries.selectAll().executeAsList()
    }

    fun getUserById(id: Long): User? {
        return queries.selectById(id).executeAsOneOrNull()
    }

    fun insertUser(name: String, email: String) {
        queries.insert(name, email, Clock.System.now().toEpochMilliseconds())
    }
}

// androidMain
actual class DatabaseDriverFactory(private val context: Context) {
    actual fun createDriver(): SqlDriver {
        return AndroidSqliteDriver(AppDatabase.Schema, context, "app.db")
    }
}

// iosMain
actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(AppDatabase.Schema, "app.db")
    }
}
```

### Objective-C/Swift 互操作

```kotlin
// 从 Kotlin/Native 访问 iOS API
import platform.Foundation.*
import platform.UIKit.*
import platform.CoreLocation.*

class LocationManager : NSObject(), CLLocationManagerDelegateProtocol {
    private val locationManager = CLLocationManager()
    private var locationCallback: ((Double, Double) -> Unit)? = null

    init {
        locationManager.delegate = this
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    fun requestLocation(callback: (Double, Double) -> Unit) {
        locationCallback = callback
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }

    override fun locationManager(
        manager: CLLocationManager,
        didUpdateLocations: List<*>
    ) {
        val location = didUpdateLocations.lastOrNull() as? CLLocation ?: return
        locationCallback?.invoke(
            location.coordinate.latitude,
            location.coordinate.longitude
        )
        locationManager.stopUpdatingLocation()
    }

    override fun locationManager(
        manager: CLLocationManager,
        didFailWithError: NSError
    ) {
        println("位置错误: ${didFailWithError.localizedDescription}")
    }
}

// 使用 UIKit 组件
fun showAlert(title: String, message: String) {
    val alert = UIAlertController.alertControllerWithTitle(
        title = title,
        message = message,
        preferredStyle = UIAlertControllerStyleAlert
    )

    alert.addAction(
        UIAlertAction.actionWithTitle(
            title = "确定",
            style = UIAlertActionStyleDefault,
            handler = null
        )
    )

    // 从根视图控制器呈现
    UIApplication.sharedApplication.keyWindow?.rootViewController
        ?.presentViewController(alert, animated = true, completion = null)
}
```

## 最佳实践

### 1. 为共享而设计

```kotlin
// 好：基于接口的设计，便于测试
interface UserRepository {
    suspend fun getUser(id: String): User
    suspend fun saveUser(user: User)
    fun observeUsers(): Flow<List<User>>
}

// 平台特定实现
class AndroidUserRepository(
    private val dao: UserDao
) : UserRepository {
    override suspend fun getUser(id: String) = dao.getUser(id)
    override suspend fun saveUser(user: User) = dao.insert(user)
    override fun observeUsers() = dao.observeAll()
}

class IosUserRepository(
    private val coreData: CoreDataManager
) : UserRepository {
    override suspend fun getUser(id: String) = coreData.fetchUser(id)
    override suspend fun saveUser(user: User) = coreData.save(user)
    override fun observeUsers() = coreData.observeUsers()
}
```

### 2. 优雅处理平台差异

```kotlin
// 使用 expect/actual 处理平台差异
expect val defaultDispatcher: CoroutineDispatcher

// androidMain
actual val defaultDispatcher: CoroutineDispatcher = Dispatchers.Default

// iosMain - 默认单线程以确保 UI 安全
actual val defaultDispatcher: CoroutineDispatcher = Dispatchers.Main

// iOS 主线程调度的工具函数
fun <T> runOnMainThread(block: () -> T): T {
    return if (NSThread.isMainThread) {
        block()
    } else {
        var result: T? = null
        dispatch_sync(dispatch_get_main_queue()) {
            result = block()
        }
        result!!
    }
}
```

### 3. 内存管理意识

```kotlin
// 在 Kotlin/Native 中，跨线程的对象引用需要注意
class SafeSharedState {
    // 使用原子引用进行线程安全访问
    private val _state = AtomicReference<State>(State.Initial)

    val state: State get() = _state.value

    fun updateState(newState: State) {
        _state.value = newState
    }
}

// 冻结需要跨线程边界的对象（旧内存模型）
// 使用新内存模型（Kotlin 1.7.20 起默认），这不太必要了
class CrossThreadData(val data: String) {
    init {
        // 在旧内存模型中冻结
        // this.freeze()
    }
}
```

## 常见陷阱

### 1. iOS 线程问题

```kotlin
// 错误：从后台线程更新 UI
suspend fun loadData() {
    val data = withContext(Dispatchers.Default) {
        api.fetchData()
    }
    // 如果不在主线程上，可能会在 iOS 上崩溃
    updateUI(data)
}

// 正确：确保 UI 更新在主线程
suspend fun loadData() {
    val data = withContext(Dispatchers.Default) {
        api.fetchData()
    }
    withContext(Dispatchers.Main) {
        updateUI(data)
    }
}
```

### 2. 将协程暴露给 Swift

```kotlin
// 错误：直接暴露挂起函数
// Swift 无法轻松调用挂起函数
class Repository {
    suspend fun getData(): Data // Swift 难以使用
}

// 正确：提供 Swift 友好的包装器
class Repository {
    suspend fun getData(): Data

    // Swift 的包装器
    fun getDataAsync(
        onSuccess: (Data) -> Unit,
        onError: (Throwable) -> Unit
    ) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val data = getData()
                onSuccess(data)
            } catch (e: Throwable) {
                onError(e)
            }
        }
    }
}
```

### 3. 忽略框架大小

```kotlin
// 配置以最小化 iOS 的框架大小
kotlin {
    iosArm64 {
        binaries.framework {
            // 使用静态链接减小大小
            isStatic = true

            // 优化大小
            freeCompilerArgs += listOf("-Xopt-in=kotlin.RequiresOptIn")
        }
    }
}
```

## 性能考虑

### 编译时优化

```kotlin
// build.gradle.kts
kotlin {
    targets.withType<KotlinNativeTarget> {
        binaries.all {
            // 启用编译器优化
            optimized = true

            // 链接时优化（构建更慢，运行时更快）
            freeCompilerArgs += "-Xllvm-lto=full"
        }
    }
}
```

### 运行时性能

```kotlin
// 使用内联类提高性能
@JvmInline
value class UserId(val value: String)

// 避免在热路径中分配
inline fun <T> measureTimeAndReturn(block: () -> T): Pair<T, Long> {
    val start = getTimeMillis()
    val result = block()
    return result to (getTimeMillis() - start)
}

expect fun getTimeMillis(): Long
```

## 实际场景

### 共享 ViewModel 模式

```kotlin
// commonMain
class SharedViewModel(
    private val repository: UserRepository
) {
    private val _state = MutableStateFlow<ViewState>(ViewState.Loading)
    val state: StateFlow<ViewState> = _state.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    fun loadUsers() {
        scope.launch {
            _state.value = ViewState.Loading
            try {
                val users = repository.getUsers()
                _state.value = ViewState.Success(users)
            } catch (e: Exception) {
                _state.value = ViewState.Error(e.message ?: "未知错误")
            }
        }
    }

    fun onCleared() {
        scope.cancel()
    }
}

sealed class ViewState {
    object Loading : ViewState()
    data class Success(val users: List<User>) : ViewState()
    data class Error(val message: String) : ViewState()
}
```

## 面试要点

1. **什么是 Kotlin/Native？**
   - 将 Kotlin 编译为原生二进制文件
   - Kotlin 多平台的一部分
   - 支持跨平台代码共享

2. **expect/actual 如何工作？**
   - `expect` 声明通用 API
   - `actual` 提供平台实现
   - 编译器确保所有 actual 存在

3. **内存模型有哪些考虑？**
   - 新内存模型（1.7.20+）更宽松
   - 对象可以跨线程共享
   - 仍需注意 UI 线程访问

4. **如何与 iOS 共享代码？**
   - 使用 CocoaPods 或 SPM 集成
   - 框架包含编译后的 Kotlin
   - Swift 通过 Objective-C 互操作调用 Kotlin

5. **与纯原生相比的性能？**
   - 通常性能相当
   - 内存管理有一些开销
   - 热路径可用优化

## 延伸阅读

- [Kotlin 多平台文档](https://kotlinlang.org/docs/multiplatform.html)
- [Kotlin/Native 文档](https://kotlinlang.org/docs/native-overview.html)
- [KMP 示例仓库](https://github.com/Kotlin/kmm-basic-sample)
- [Touchlab KMP 资源](https://touchlab.co/kotlin-multiplatform/)
- [SQLDelight for KMP](https://cashapp.github.io/sqldelight/2.0.0/)
- [Ktor Client](https://ktor.io/docs/getting-started-ktor-client.html)
