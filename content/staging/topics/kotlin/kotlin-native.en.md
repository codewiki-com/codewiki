---
title: Kotlin/Native Cross-Platform Development
description: Complete guide to Kotlin/Native for building cross-platform applications, iOS development, native interop, and memory management
track: kotlin
section: android-multiplatform
difficulty: advanced
tags:
  - Kotlin
  - Native
  - Cross-Platform
  - iOS
  - KMP
  - Multiplatform
status: imported
origin: old/src/content/docs/kotlin/kotlin-native.en.md
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

Kotlin/Native is a technology that compiles Kotlin code to native binaries without requiring a virtual machine. It enables sharing business logic across platforms including iOS, macOS, Linux, Windows, and embedded systems while leveraging platform-specific APIs when needed.

## Concept Explanation

Kotlin/Native is part of Kotlin Multiplatform (KMP), which allows sharing code across different platforms while still accessing native platform APIs. Unlike cross-platform frameworks that abstract away the platform, Kotlin/Native compiles to actual native code that runs directly on the target system.

Key features:
- **Native compilation**: Produces standalone executables without VM
- **Interoperability**: Direct access to C, Objective-C, and Swift APIs
- **Memory management**: Automatic memory management without garbage collection pauses
- **Platform libraries**: Access to POSIX, CoreFoundation, UIKit, and more

```kotlin
// Shared code that compiles for all platforms
expect class Platform() {
    val name: String
}

fun greet(): String = "Hello from ${Platform().name}!"

// iOS implementation
actual class Platform {
    actual val name: String = UIDevice.currentDevice.systemName()
}

// Android implementation
actual class Platform {
    actual val name: String = "Android ${Build.VERSION.SDK_INT}"
}
```

## Core Principles

### Kotlin Multiplatform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                          │
├───────────────┬─────────────────────────┬───────────────────┤
│   Android UI  │      Shared Code        │      iOS UI       │
│   (Compose)   │   (Kotlin/Common)       │   (SwiftUI)       │
├───────────────┼─────────────────────────┼───────────────────┤
│               │  Business Logic         │                    │
│  Kotlin/JVM   │  Data Models            │   Kotlin/Native   │
│               │  Networking             │                    │
│               │  Database               │                    │
├───────────────┴─────────────────────────┴───────────────────┤
│            Platform-Specific Implementations                  │
│  ┌─────────────────┐              ┌─────────────────────┐   │
│  │ Android APIs    │              │  iOS APIs (UIKit,   │   │
│  │ (Context, etc.) │              │  CoreData, etc.)    │   │
│  └─────────────────┘              └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

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

## Key Concepts

### Setting Up a KMP Project

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
        summary = "Shared module for iOS and Android"
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

### Expect/Actual Mechanism

```kotlin
// commonMain - Declare expected declarations
expect class Platform() {
    val name: String
    val version: String
}

expect fun randomUUID(): String

expect class FileSystem {
    fun readFile(path: String): String?
    fun writeFile(path: String, content: String): Boolean
}

// androidMain - Provide actual implementations
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

// iosMain - Provide iOS implementations
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

### Coroutines in Kotlin/Native

```kotlin
// Shared coroutines code
class DataRepository(
    private val api: ApiClient,
    private val database: Database
) {
    // Runs on any platform
    suspend fun fetchAndCacheData(): List<Item> {
        val items = api.fetchItems()
        database.saveItems(items)
        return items
    }

    fun observeItems(): Flow<List<Item>> {
        return database.observeItems()
    }
}

// iOS-specific: Exposing flows to Swift
class DataRepositoryWrapper(private val repository: DataRepository) {

    // Convert Flow to a Swift-friendly callback pattern
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

## Code Examples

### Networking with Ktor

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

// Platform-specific HTTP engines are configured via dependencies
// androidMain uses ktor-client-android
// iosMain uses ktor-client-darwin
```

### SQLDelight for Database

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

### C Interop

```kotlin
// Create a .def file: src/nativeInterop/cinterop/libcurl.def
headers = curl/curl.h
linkerOpts.osx = -L/usr/local/opt/curl/lib -lcurl
linkerOpts.linux = -lcurl

// build.gradle.kts
kotlin {
    linuxX64 {
        compilations.getByName("main") {
            cinterops {
                val libcurl by creating {
                    defFile(project.file("src/nativeInterop/cinterop/libcurl.def"))
                }
            }
        }
    }
}

// Using the C library in Kotlin
import libcurl.*
import kotlinx.cinterop.*

fun fetchUrl(url: String): String {
    val curl = curl_easy_init()
    if (curl == null) throw RuntimeException("Failed to init curl")

    try {
        memScoped {
            val result = StringBuilder()

            curl_easy_setopt(curl, CURLOPT_URL, url)
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, staticCFunction { buffer: CPointer<ByteVar>?, size: size_t, nmemb: size_t, userdata: COpaquePointer? ->
                val data = buffer?.toKString() ?: return@staticCFunction 0uL
                // Handle data
                size * nmemb
            })

            val code = curl_easy_perform(curl)
            if (code != CURLE_OK) {
                throw RuntimeException("Curl error: $code")
            }

            result.toString()
        }
    } finally {
        curl_easy_cleanup(curl)
    }
}
```

### Objective-C/Swift Interop

```kotlin
// Accessing iOS APIs from Kotlin/Native
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
        println("Location error: ${didFailWithError.localizedDescription}")
    }
}

// Using UIKit components
fun showAlert(title: String, message: String) {
    val alert = UIAlertController.alertControllerWithTitle(
        title = title,
        message = message,
        preferredStyle = UIAlertControllerStyleAlert
    )

    alert.addAction(
        UIAlertAction.actionWithTitle(
            title = "OK",
            style = UIAlertActionStyleDefault,
            handler = null
        )
    )

    // Present from root view controller
    UIApplication.sharedApplication.keyWindow?.rootViewController
        ?.presentViewController(alert, animated = true, completion = null)
}
```

## Best Practices

### 1. Design for Sharing

```kotlin
// Good: Interface-based design for testability
interface UserRepository {
    suspend fun getUser(id: String): User
    suspend fun saveUser(user: User)
    fun observeUsers(): Flow<List<User>>
}

// Platform-specific implementations
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

### 2. Handle Platform Differences Gracefully

```kotlin
// Use expect/actual for platform differences
expect val defaultDispatcher: CoroutineDispatcher

// androidMain
actual val defaultDispatcher: CoroutineDispatcher = Dispatchers.Default

// iosMain - Single-threaded by default for UI safety
actual val defaultDispatcher: CoroutineDispatcher = Dispatchers.Main

// Utility for iOS main thread dispatch
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

### 3. Memory Management Awareness

```kotlin
// In Kotlin/Native, be careful with object references across threads
class SafeSharedState {
    // Use atomic references for thread-safe access
    private val _state = AtomicReference<State>(State.Initial)

    val state: State get() = _state.value

    fun updateState(newState: State) {
        _state.value = newState
    }
}

// Freeze objects that need to cross thread boundaries (legacy memory model)
// With new memory model (default since Kotlin 1.7.20), this is less necessary
class CrossThreadData(val data: String) {
    init {
        // Freeze in old memory model
        // this.freeze()
    }
}
```

## Common Pitfalls

### 1. iOS Threading Issues

```kotlin
// WRONG: Updating UI from background thread
suspend fun loadData() {
    val data = withContext(Dispatchers.Default) {
        api.fetchData()
    }
    // This might crash on iOS if not on main thread
    updateUI(data)
}

// CORRECT: Ensure UI updates on main thread
suspend fun loadData() {
    val data = withContext(Dispatchers.Default) {
        api.fetchData()
    }
    withContext(Dispatchers.Main) {
        updateUI(data)
    }
}
```

### 2. Exposing Coroutines to Swift

```kotlin
// WRONG: Exposing suspend functions directly
// Swift can't call suspend functions easily
class Repository {
    suspend fun getData(): Data // Hard for Swift to use
}

// CORRECT: Provide Swift-friendly wrappers
class Repository {
    suspend fun getData(): Data

    // Wrapper for Swift
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

### 3. Ignoring Framework Size

```kotlin
// Configure to minimize framework size for iOS
kotlin {
    iosArm64 {
        binaries.framework {
            // Use static linking to reduce size
            isStatic = true

            // Optimize for size
            freeCompilerArgs += listOf("-Xopt-in=kotlin.RequiresOptIn")
        }
    }
}
```

## Performance Considerations

### Compile Time Optimization

```kotlin
// build.gradle.kts
kotlin {
    targets.withType<KotlinNativeTarget> {
        binaries.all {
            // Enable compiler optimizations
            optimized = true

            // Link-time optimizations (slower build, faster runtime)
            freeCompilerArgs += "-Xllvm-lto=full"
        }
    }
}
```

### Runtime Performance

```kotlin
// Use inline classes for performance
@JvmInline
value class UserId(val value: String)

// Avoid allocations in hot paths
inline fun <T> measureTimeAndReturn(block: () -> T): Pair<T, Long> {
    val start = getTimeMillis()
    val result = block()
    return result to (getTimeMillis() - start)
}

expect fun getTimeMillis(): Long
```

## Real-World Scenarios

### Shared ViewModel Pattern

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
                _state.value = ViewState.Error(e.message ?: "Unknown error")
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

// iOS wrapper for SwiftUI
class IosViewModelWrapper : ObservableObject {
    private let viewModel: SharedViewModel

    @Published var state: ViewState = .loading

    init(repository: UserRepository) {
        viewModel = SharedViewModel(repository: repository)

        // Observe state changes
        viewModel.state.collect { [weak self] newState in
            DispatchQueue.main.async {
                self?.state = newState
            }
        }
    }

    func loadUsers() {
        viewModel.loadUsers()
    }

    deinit {
        viewModel.onCleared()
    }
}
```

## Interview Key Points

1. **What is Kotlin/Native?**
   - Compiles Kotlin to native binaries
   - Part of Kotlin Multiplatform
   - Enables code sharing across platforms

2. **How does expect/actual work?**
   - `expect` declares common API
   - `actual` provides platform implementation
   - Compiler ensures all actuals exist

3. **What are the memory model considerations?**
   - New memory model (1.7.20+) is more permissive
   - Objects can be shared across threads
   - Still need care with UI thread access

4. **How to share code with iOS?**
   - Use CocoaPods or SPM integration
   - Framework contains compiled Kotlin
   - Swift calls Kotlin through Objective-C interop

5. **Performance vs pure native?**
   - Generally comparable performance
   - Some overhead from memory management
   - Optimizations available for hot paths

## Further Reading

- [Kotlin Multiplatform Documentation](https://kotlinlang.org/docs/multiplatform.html)
- [Kotlin/Native Documentation](https://kotlinlang.org/docs/native-overview.html)
- [KMP Samples Repository](https://github.com/Kotlin/kmm-basic-sample)
- [Touchlab KMP Resources](https://touchlab.co/kotlin-multiplatform/)
- [SQLDelight for KMP](https://cashapp.github.io/sqldelight/2.0.0/)
- [Ktor Client](https://ktor.io/docs/getting-started-ktor-client.html)
