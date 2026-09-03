---
title: DataStore 数据存储
description: Jetpack DataStore 完全指南：涵盖 Preferences DataStore 和 Proto DataStore，实现类型安全的异步数据持久化
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - DataStore
  - Preferences
  - 存储
  - Jetpack
status: imported
origin: old/src/content/docs/kotlin/datastore.zh.md
divergence: 0.286
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 21
  lastUpdated: 2026-01-22
---

Jetpack DataStore 是 Android 的现代数据存储解决方案，提供安全、一致的方式来存储少量数据，如用户偏好设置和应用配置。它用基于协程的响应式 API 替代了 SharedPreferences，异步且一致地处理数据。

## 概念解释

DataStore 有两种实现：

- **Preferences DataStore**：存储键值对，类似 SharedPreferences，但使用基于协程的 API
- **Proto DataStore**：使用 Protocol Buffers 存储类型化对象，提供类型安全和模式演进

两种实现都异步存储数据，提供事务性更新，并优雅地处理异常。与 SharedPreferences 不同，DataStore 从不阻塞 UI 线程，并保证数据一致性。

```kotlin
// Preferences DataStore - 简单的键值存储
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

// Proto DataStore - 类型化对象存储
val Context.userPrefsStore: DataStore<UserPreferences> by dataStore(
    fileName = "user_prefs.pb",
    serializer = UserPreferencesSerializer
)
```

## 核心原理

### 为什么选择 DataStore 而非 SharedPreferences

SharedPreferences 有几个 DataStore 解决的问题：

| 问题 | SharedPreferences | DataStore |
|------|-------------------|-----------|
| 同步 API | `commit()` 阻塞 UI 线程 | 完全异步，使用 Flow |
| 错误处理 | 静默失败 | 传播异常 |
| 类型安全 | 可能出现运行时错误 | 编译时安全（Proto） |
| 数据一致性 | 无事务支持 | 原子读-修改-写 |
| 迁移 | 手动 | 内置支持 |

```kotlin
// SharedPreferences 的问题
val prefs = getSharedPreferences("settings", Context.MODE_PRIVATE)
// 这可能会阻塞 UI 线程！
val value = prefs.getString("key", "default")
// 无法知道是否失败
prefs.edit().putString("key", "value").apply()

// DataStore 解决方案
val key = stringPreferencesKey("key")
// 非阻塞，响应式
val flow: Flow<String> = dataStore.data.map { preferences ->
    preferences[key] ?: "default"
}
// 挂起函数，正确处理错误
dataStore.edit { settings ->
    settings[key] = "value"
}
```

### DataStore 架构

```
┌─────────────────────────────────────────────────┐
│                    应用层                         │
├─────────────────────────────────────────────────┤
│                   ViewModel                       │
│  ┌─────────────┐  ┌─────────────────────────┐   │
│  │  读取 Flow  │  │  写入 (suspend fun)     │   │
│  └──────┬──────┘  └───────────┬─────────────┘   │
├─────────┼─────────────────────┼─────────────────┤
│         │      DataStore      │                   │
│  ┌──────▼──────────────────────▼───────────────┐ │
│  │          内部状态（内存中）                  │ │
│  └─────────────────────┬───────────────────────┘ │
│                        │                          │
│  ┌─────────────────────▼───────────────────────┐ │
│  │              文件（磁盘上）                  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 关键概念

### 设置依赖

```kotlin
// build.gradle.kts (app 模块)
dependencies {
    // Preferences DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.0")

    // Proto DataStore
    implementation("androidx.datastore:datastore:1.1.0")

    // Proto DataStore 需要 Protocol Buffers
    implementation("com.google.protobuf:protobuf-javalite:3.25.0")
}

// Proto DataStore 需要添加 protobuf 插件
plugins {
    id("com.google.protobuf") version "0.9.4"
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.25.0"
    }
    generateProtoTasks {
        all().forEach { task ->
            task.builtins {
                create("java") {
                    option("lite")
                }
            }
        }
    }
}
```

### Preferences DataStore

```kotlin
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

// 使用委托创建 DataStore 实例
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "user_settings"
)

// 定义类型安全的偏好设置键
object PreferencesKeys {
    val DARK_MODE = booleanPreferencesKey("dark_mode")
    val USER_NAME = stringPreferencesKey("user_name")
    val NOTIFICATION_ENABLED = booleanPreferencesKey("notifications_enabled")
    val FONT_SIZE = intPreferencesKey("font_size")
    val VOLUME = floatPreferencesKey("volume")
    val LAST_SYNC = longPreferencesKey("last_sync")
    val SELECTED_TAGS = stringSetPreferencesKey("selected_tags")
}

// 管理偏好设置的仓库
class SettingsRepository(private val dataStore: DataStore<Preferences>) {

    // 以 Flow 形式读取偏好设置
    val darkModeFlow: Flow<Boolean> = dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            preferences[PreferencesKeys.DARK_MODE] ?: false
        }

    val userNameFlow: Flow<String> = dataStore.data
        .map { preferences ->
            preferences[PreferencesKeys.USER_NAME] ?: "访客"
        }

    // 一次读取所有设置
    data class UserSettings(
        val darkMode: Boolean,
        val userName: String,
        val notificationsEnabled: Boolean,
        val fontSize: Int
    )

    val userSettingsFlow: Flow<UserSettings> = dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            UserSettings(
                darkMode = preferences[PreferencesKeys.DARK_MODE] ?: false,
                userName = preferences[PreferencesKeys.USER_NAME] ?: "访客",
                notificationsEnabled = preferences[PreferencesKeys.NOTIFICATION_ENABLED] ?: true,
                fontSize = preferences[PreferencesKeys.FONT_SIZE] ?: 14
            )
        }

    // 写入偏好设置
    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.DARK_MODE] = enabled
        }
    }

    suspend fun setUserName(name: String) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.USER_NAME] = name
        }
    }

    // 原子更新多个偏好设置
    suspend fun updateSettings(darkMode: Boolean, fontSize: Int) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.DARK_MODE] = darkMode
            preferences[PreferencesKeys.FONT_SIZE] = fontSize
        }
    }

    // 清除所有偏好设置
    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
```

### Proto DataStore

```protobuf
// src/main/proto/user_preferences.proto
syntax = "proto3";

option java_package = "com.example.app";
option java_multiple_files = true;

message UserPreferences {
    bool dark_mode = 1;
    string user_name = 2;
    bool notifications_enabled = 3;
    int32 font_size = 4;
    ThemeColor theme_color = 5;

    enum ThemeColor {
        BLUE = 0;
        GREEN = 1;
        RED = 2;
        PURPLE = 3;
    }

    repeated string favorite_categories = 6;

    message NotificationSettings {
        bool email = 1;
        bool push = 2;
        bool sms = 3;
    }
    NotificationSettings notification_settings = 7;
}
```

```kotlin
import android.content.Context
import androidx.datastore.core.CorruptionException
import androidx.datastore.core.DataStore
import androidx.datastore.core.Serializer
import androidx.datastore.dataStore
import com.example.app.UserPreferences
import com.google.protobuf.InvalidProtocolBufferException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream

// Proto DataStore 序列化器
object UserPreferencesSerializer : Serializer<UserPreferences> {
    override val defaultValue: UserPreferences = UserPreferences.getDefaultInstance()

    override suspend fun readFrom(input: InputStream): UserPreferences {
        try {
            return UserPreferences.parseFrom(input)
        } catch (exception: InvalidProtocolBufferException) {
            throw CorruptionException("无法读取 proto。", exception)
        }
    }

    override suspend fun writeTo(t: UserPreferences, output: OutputStream) {
        t.writeTo(output)
    }
}

// 创建 DataStore 实例
val Context.userPreferencesStore: DataStore<UserPreferences> by dataStore(
    fileName = "user_preferences.pb",
    serializer = UserPreferencesSerializer
)

// 使用 Proto DataStore 的仓库
class UserPreferencesRepository(
    private val dataStore: DataStore<UserPreferences>
) {

    val userPreferencesFlow: Flow<UserPreferences> = dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(UserPreferences.getDefaultInstance())
            } else {
                throw exception
            }
        }

    val darkModeFlow: Flow<Boolean> = dataStore.data
        .map { it.darkMode }

    val themeColorFlow: Flow<UserPreferences.ThemeColor> = dataStore.data
        .map { it.themeColor }

    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.updateData { currentPreferences ->
            currentPreferences.toBuilder()
                .setDarkMode(enabled)
                .build()
        }
    }

    suspend fun setThemeColor(color: UserPreferences.ThemeColor) {
        dataStore.updateData { currentPreferences ->
            currentPreferences.toBuilder()
                .setThemeColor(color)
                .build()
        }
    }

    suspend fun setUserName(name: String) {
        dataStore.updateData { currentPreferences ->
            currentPreferences.toBuilder()
                .setUserName(name)
                .build()
        }
    }

    suspend fun addFavoriteCategory(category: String) {
        dataStore.updateData { currentPreferences ->
            currentPreferences.toBuilder()
                .addFavoriteCategories(category)
                .build()
        }
    }
}
```

## 代码示例

### ViewModel 集成

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    // 将设置作为 StateFlow 暴露给 UI
    val darkMode: StateFlow<Boolean> = settingsRepository.darkModeFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = false
        )

    val userSettings: StateFlow<SettingsRepository.UserSettings> =
        settingsRepository.userSettingsFlow
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = SettingsRepository.UserSettings(
                    darkMode = false,
                    userName = "访客",
                    notificationsEnabled = true,
                    fontSize = 14
                )
            )

    // UI 事件
    sealed class SettingsEvent {
        data class SetDarkMode(val enabled: Boolean) : SettingsEvent()
        data class SetUserName(val name: String) : SettingsEvent()
        data class SetFontSize(val size: Int) : SettingsEvent()
        object ClearSettings : SettingsEvent()
    }

    fun onEvent(event: SettingsEvent) {
        viewModelScope.launch {
            when (event) {
                is SettingsEvent.SetDarkMode -> {
                    settingsRepository.setDarkMode(event.enabled)
                }
                is SettingsEvent.SetUserName -> {
                    settingsRepository.setUserName(event.name)
                }
                is SettingsEvent.SetFontSize -> {
                    settingsRepository.updateSettings(
                        darkMode = userSettings.value.darkMode,
                        fontSize = event.size
                    )
                }
                SettingsEvent.ClearSettings -> {
                    settingsRepository.clearAll()
                }
            }
        }
    }
}
```

### 从 SharedPreferences 迁移

```kotlin
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.migrations.SharedPreferencesMigration
import androidx.datastore.migrations.SharedPreferencesView
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore

// 定义迁移
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings",
    produceMigrations = { context ->
        listOf(
            SharedPreferencesMigration(
                context = context,
                sharedPreferencesName = "old_preferences"
            ) { sharedPrefs: SharedPreferencesView, currentData: Preferences ->
                // 将旧键映射到新键
                val mutablePreferences = currentData.toMutablePreferences()

                // 迁移布尔值
                if (sharedPrefs.contains("dark_mode")) {
                    mutablePreferences[PreferencesKeys.DARK_MODE] =
                        sharedPrefs.getBoolean("dark_mode", false)
                }

                // 迁移字符串
                if (sharedPrefs.contains("user_name")) {
                    sharedPrefs.getString("user_name")?.let { name ->
                        mutablePreferences[PreferencesKeys.USER_NAME] = name
                    }
                }

                // 迁移整数
                if (sharedPrefs.contains("font_size")) {
                    mutablePreferences[PreferencesKeys.FONT_SIZE] =
                        sharedPrefs.getInt("font_size", 14)
                }

                mutablePreferences.toPreferences()
            }
        )
    }
)
```

## 最佳实践

### 1. 使用仓库模式

```kotlin
// 用于可测试性的接口
interface SettingsDataSource {
    val darkModeFlow: Flow<Boolean>
    val userNameFlow: Flow<String>
    suspend fun setDarkMode(enabled: Boolean)
    suspend fun setUserName(name: String)
}

// 实现
class DataStoreSettingsDataSource(
    private val dataStore: DataStore<Preferences>
) : SettingsDataSource {

    override val darkModeFlow: Flow<Boolean> = dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.DARK_MODE] ?: false }

    override val userNameFlow: Flow<String> = dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.USER_NAME] ?: "访客" }

    override suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { it[PreferencesKeys.DARK_MODE] = enabled }
    }

    override suspend fun setUserName(name: String) {
        dataStore.edit { it[PreferencesKeys.USER_NAME] = name }
    }
}

// 用于测试的假实现
class FakeSettingsDataSource : SettingsDataSource {
    private val _darkMode = MutableStateFlow(false)
    private val _userName = MutableStateFlow("访客")

    override val darkModeFlow: Flow<Boolean> = _darkMode
    override val userNameFlow: Flow<String> = _userName

    override suspend fun setDarkMode(enabled: Boolean) {
        _darkMode.value = enabled
    }

    override suspend fun setUserName(name: String) {
        _userName.value = name
    }
}
```

### 2. 优雅处理错误

```kotlin
class RobustSettingsRepository(
    private val dataStore: DataStore<Preferences>
) {
    sealed class Result<out T> {
        data class Success<T>(val data: T) : Result<T>()
        data class Error(val exception: Throwable) : Result<Nothing>()
    }

    val settingsFlow: Flow<Result<UserSettings>> = dataStore.data
        .map<Preferences, Result<UserSettings>> { preferences ->
            Result.Success(
                UserSettings(
                    darkMode = preferences[PreferencesKeys.DARK_MODE] ?: false,
                    userName = preferences[PreferencesKeys.USER_NAME] ?: "访客"
                )
            )
        }
        .catch { exception ->
            emit(Result.Error(exception))
        }

    suspend fun setDarkMode(enabled: Boolean): Result<Unit> {
        return try {
            dataStore.edit { preferences ->
                preferences[PreferencesKeys.DARK_MODE] = enabled
            }
            Result.Success(Unit)
        } catch (e: IOException) {
            Result.Error(e)
        }
    }
}
```

## 常见陷阱

### 1. 创建多个 DataStore 实例

```kotlin
// 错误：创建多个实例
class BadRepository(context: Context) {
    // 这每次都会创建一个新的 DataStore！
    private val dataStore = context.dataStore
}

// 正确：使用单例模式
object DataStoreProvider {
    private var dataStore: DataStore<Preferences>? = null

    fun getInstance(context: Context): DataStore<Preferences> {
        return dataStore ?: synchronized(this) {
            dataStore ?: context.applicationContext.dataStore.also {
                dataStore = it
            }
        }
    }
}

// 或者使用依赖注入（推荐）
```

### 2. 在主线程阻塞

```kotlin
// 错误：阻塞主线程
fun getDarkModeSynchronously(): Boolean {
    return runBlocking {
        dataStore.data.first()[PreferencesKeys.DARK_MODE] ?: false
    }
}

// 正确：在协程作用域中使用 Flow
val darkModeFlow: Flow<Boolean> = dataStore.data
    .map { it[PreferencesKeys.DARK_MODE] ?: false }

// 在 ViewModel 中收集
viewModelScope.launch {
    darkModeFlow.collect { darkMode ->
        _uiState.value = _uiState.value.copy(darkMode = darkMode)
    }
}
```

### 3. 不处理异常

```kotlin
// 错误：在 IOException 时崩溃
val dangerousFlow = dataStore.data.map { preferences ->
    preferences[PreferencesKeys.USER_NAME] ?: "访客"
}

// 正确：处理异常
val safeFlow = dataStore.data
    .catch { exception ->
        if (exception is IOException) {
            emit(emptyPreferences())
        } else {
            throw exception
        }
    }
    .map { preferences ->
        preferences[PreferencesKeys.USER_NAME] ?: "访客"
    }
```

## 性能考虑

### 高效读取

```kotlin
// 通过单个 map 高效读取多个值
val settingsFlow: Flow<Settings> = dataStore.data.map { prefs ->
    Settings(
        darkMode = prefs[PreferencesKeys.DARK_MODE] ?: false,
        userName = prefs[PreferencesKeys.USER_NAME] ?: "访客",
        fontSize = prefs[PreferencesKeys.FONT_SIZE] ?: 14
    )
}

// 使用 distinctUntilChanged 避免不必要的更新
val darkModeFlow: Flow<Boolean> = dataStore.data
    .map { it[PreferencesKeys.DARK_MODE] ?: false }
    .distinctUntilChanged()
```

### 批量更新

```kotlin
// 错误：多次写入
suspend fun updateSettingsBadly(darkMode: Boolean, fontSize: Int, userName: String) {
    dataStore.edit { it[PreferencesKeys.DARK_MODE] = darkMode }
    dataStore.edit { it[PreferencesKeys.FONT_SIZE] = fontSize }
    dataStore.edit { it[PreferencesKeys.USER_NAME] = userName }
}

// 正确：单次原子写入
suspend fun updateSettingsEfficiently(darkMode: Boolean, fontSize: Int, userName: String) {
    dataStore.edit { preferences ->
        preferences[PreferencesKeys.DARK_MODE] = darkMode
        preferences[PreferencesKeys.FONT_SIZE] = fontSize
        preferences[PreferencesKeys.USER_NAME] = userName
    }
}
```

## 面试要点

1. **什么是 DataStore，为什么使用它而不是 SharedPreferences？**
   - 现代数据存储解决方案，使用基于协程的异步 API
   - 类型安全，优雅处理错误
   - 从不阻塞 UI 线程

2. **DataStore 有哪两种类型？**
   - Preferences DataStore：键值对
   - Proto DataStore：使用 Protocol Buffers 的类型化对象

3. **DataStore 如何处理数据一致性？**
   - 原子的读-修改-写操作
   - 每个 DataStore 实例一个文件
   - 更新是事务性的

4. **如何从 SharedPreferences 迁移？**
   - 在 produceMigrations 中使用 SharedPreferencesMigration
   - 迁移只运行一次，原子性

5. **DataStore 的最佳实践？**
   - 每个文件一个实例
   - 使用仓库模式
   - 在 catch 操作符中处理 IOException
   - 使用依赖注入

## 延伸阅读

- [DataStore 官方文档](https://developer.android.com/topic/libraries/architecture/datastore)
- [Preferences DataStore 指南](https://developer.android.com/codelabs/android-preferences-datastore)
- [Proto DataStore 指南](https://developer.android.com/codelabs/android-proto-datastore)
- [DataStore 与依赖注入](https://developer.android.com/topic/libraries/architecture/datastore#koin)
- [从 SharedPreferences 迁移](https://developer.android.com/topic/libraries/architecture/datastore#migrations)
