---
title: DataStore Data Storage
description: Complete guide to Jetpack DataStore for Android, covering Preferences DataStore and Proto DataStore for type-safe, asynchronous data persistence
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - DataStore
  - Preferences
  - Storage
  - Jetpack
status: imported
origin: old/src/content/docs/kotlin/datastore.en.md
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

Jetpack DataStore is a modern data storage solution for Android that provides a safe, consistent way to store small amounts of data such as user preferences and application settings. It replaces SharedPreferences with a reactive, coroutine-based API that handles data asynchronously and consistently.

## Concept Explanation

DataStore comes in two implementations:

- **Preferences DataStore**: Stores key-value pairs, similar to SharedPreferences but with a coroutine-based API
- **Proto DataStore**: Stores typed objects using Protocol Buffers, providing type safety and schema evolution

Both implementations store data asynchronously, provide transactional updates, and handle exceptions gracefully. Unlike SharedPreferences, DataStore never blocks the UI thread and guarantees data consistency.

```kotlin
// Preferences DataStore - simple key-value storage
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

// Proto DataStore - typed object storage
val Context.userPrefsStore: DataStore<UserPreferences> by dataStore(
    fileName = "user_prefs.pb",
    serializer = UserPreferencesSerializer
)
```

## Core Principles

### Why DataStore Over SharedPreferences

SharedPreferences has several issues that DataStore addresses:

| Issue | SharedPreferences | DataStore |
|-------|-------------------|-----------|
| Synchronous API | Blocks UI thread on `commit()` | Fully asynchronous with Flow |
| Error handling | Silent failures | Propagates exceptions |
| Type safety | Runtime errors possible | Compile-time safety (Proto) |
| Data consistency | No transaction support | Atomic read-modify-write |
| Migration | Manual | Built-in support |

```kotlin
// SharedPreferences issues
val prefs = getSharedPreferences("settings", Context.MODE_PRIVATE)
// This can block the UI thread!
val value = prefs.getString("key", "default")
// No way to know if this failed
prefs.edit().putString("key", "value").apply()

// DataStore solution
val key = stringPreferencesKey("key")
// Non-blocking, reactive
val flow: Flow<String> = dataStore.data.map { preferences ->
    preferences[key] ?: "default"
}
// Suspending, handles errors properly
dataStore.edit { settings ->
    settings[key] = "value"
}
```

### DataStore Architecture

```
┌─────────────────────────────────────────────────┐
│                  Application                      │
├─────────────────────────────────────────────────┤
│                    ViewModel                       │
│  ┌─────────────┐  ┌─────────────────────────┐   │
│  │  Read Flow  │  │  Write (suspend fun)     │   │
│  └──────┬──────┘  └───────────┬─────────────┘   │
├─────────┼─────────────────────┼─────────────────┤
│         │      DataStore      │                   │
│  ┌──────▼──────────────────────▼───────────────┐ │
│  │          Internal State (in-memory)          │ │
│  └─────────────────────┬───────────────────────┘ │
│                        │                          │
│  ┌─────────────────────▼───────────────────────┐ │
│  │              File (on disk)                  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Key Concepts

### Setting Up Dependencies

```kotlin
// build.gradle.kts (app module)
dependencies {
    // Preferences DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.0")

    // Proto DataStore
    implementation("androidx.datastore:datastore:1.1.0")

    // For Proto DataStore - Protocol Buffers
    implementation("com.google.protobuf:protobuf-javalite:3.25.0")
}

// For Proto DataStore, add protobuf plugin
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

// Create DataStore instance using delegate
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "user_settings"
)

// Define preference keys with type safety
object PreferencesKeys {
    val DARK_MODE = booleanPreferencesKey("dark_mode")
    val USER_NAME = stringPreferencesKey("user_name")
    val NOTIFICATION_ENABLED = booleanPreferencesKey("notifications_enabled")
    val FONT_SIZE = intPreferencesKey("font_size")
    val VOLUME = floatPreferencesKey("volume")
    val LAST_SYNC = longPreferencesKey("last_sync")
    val SELECTED_TAGS = stringSetPreferencesKey("selected_tags")
}

// Repository for managing preferences
class SettingsRepository(private val dataStore: DataStore<Preferences>) {

    // Read preferences as Flow
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
            preferences[PreferencesKeys.USER_NAME] ?: "Guest"
        }

    // Read all settings at once
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
                userName = preferences[PreferencesKeys.USER_NAME] ?: "Guest",
                notificationsEnabled = preferences[PreferencesKeys.NOTIFICATION_ENABLED] ?: true,
                fontSize = preferences[PreferencesKeys.FONT_SIZE] ?: 14
            )
        }

    // Write preferences
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

    // Update multiple preferences atomically
    suspend fun updateSettings(darkMode: Boolean, fontSize: Int) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.DARK_MODE] = darkMode
            preferences[PreferencesKeys.FONT_SIZE] = fontSize
        }
    }

    // Clear all preferences
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

// Serializer for Proto DataStore
object UserPreferencesSerializer : Serializer<UserPreferences> {
    override val defaultValue: UserPreferences = UserPreferences.getDefaultInstance()

    override suspend fun readFrom(input: InputStream): UserPreferences {
        try {
            return UserPreferences.parseFrom(input)
        } catch (exception: InvalidProtocolBufferException) {
            throw CorruptionException("Cannot read proto.", exception)
        }
    }

    override suspend fun writeTo(t: UserPreferences, output: OutputStream) {
        t.writeTo(output)
    }
}

// Create DataStore instance
val Context.userPreferencesStore: DataStore<UserPreferences> by dataStore(
    fileName = "user_preferences.pb",
    serializer = UserPreferencesSerializer
)

// Repository using Proto DataStore
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

    suspend fun updateNotificationSettings(
        email: Boolean,
        push: Boolean,
        sms: Boolean
    ) {
        dataStore.updateData { currentPreferences ->
            val notificationSettings = UserPreferences.NotificationSettings.newBuilder()
                .setEmail(email)
                .setPush(push)
                .setSms(sms)
                .build()

            currentPreferences.toBuilder()
                .setNotificationSettings(notificationSettings)
                .build()
        }
    }
}
```

## Code Examples

### ViewModel Integration

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    // Expose settings as StateFlow for UI
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
                    userName = "Guest",
                    notificationsEnabled = true,
                    fontSize = 14
                )
            )

    // UI events
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

// ViewModel Factory with Dependency Injection
class SettingsViewModelFactory(
    private val settingsRepository: SettingsRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(SettingsViewModel::class.java)) {
            return SettingsViewModel(settingsRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
```

### Compose Integration

```kotlin
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel
) {
    val settings by viewModel.userSettings.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Dark Mode Toggle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Dark Mode")
            Switch(
                checked = settings.darkMode,
                onCheckedChange = { enabled ->
                    viewModel.onEvent(SettingsViewModel.SettingsEvent.SetDarkMode(enabled))
                }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // User Name Field
        var userName by remember { mutableStateOf(settings.userName) }
        LaunchedEffect(settings.userName) {
            userName = settings.userName
        }

        OutlinedTextField(
            value = userName,
            onValueChange = { userName = it },
            label = { Text("User Name") },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = {
                viewModel.onEvent(SettingsViewModel.SettingsEvent.SetUserName(userName))
            },
            modifier = Modifier.padding(top = 8.dp)
        ) {
            Text("Save Name")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Font Size Slider
        Text("Font Size: ${settings.fontSize}")
        Slider(
            value = settings.fontSize.toFloat(),
            onValueChange = { size ->
                viewModel.onEvent(
                    SettingsViewModel.SettingsEvent.SetFontSize(size.toInt())
                )
            },
            valueRange = 10f..24f,
            steps = 13
        )

        Spacer(modifier = Modifier.weight(1f))

        // Clear Settings Button
        Button(
            onClick = {
                viewModel.onEvent(SettingsViewModel.SettingsEvent.ClearSettings)
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Clear All Settings")
        }
    }
}
```

### Migration from SharedPreferences

```kotlin
import android.content.Context
import android.content.SharedPreferences
import androidx.datastore.core.DataStore
import androidx.datastore.migrations.SharedPreferencesMigration
import androidx.datastore.migrations.SharedPreferencesView
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore

// Define migration
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings",
    produceMigrations = { context ->
        listOf(
            SharedPreferencesMigration(
                context = context,
                sharedPreferencesName = "old_preferences"
            ) { sharedPrefs: SharedPreferencesView, currentData: Preferences ->
                // Map old keys to new keys
                val mutablePreferences = currentData.toMutablePreferences()

                // Migrate boolean
                if (sharedPrefs.contains("dark_mode")) {
                    mutablePreferences[PreferencesKeys.DARK_MODE] =
                        sharedPrefs.getBoolean("dark_mode", false)
                }

                // Migrate string
                if (sharedPrefs.contains("user_name")) {
                    sharedPrefs.getString("user_name")?.let { name ->
                        mutablePreferences[PreferencesKeys.USER_NAME] = name
                    }
                }

                // Migrate int
                if (sharedPrefs.contains("font_size")) {
                    mutablePreferences[PreferencesKeys.FONT_SIZE] =
                        sharedPrefs.getInt("font_size", 14)
                }

                mutablePreferences.toPreferences()
            }
        )
    }
)

// Custom migration logic
class CustomMigration(context: Context) {
    private val oldPrefs: SharedPreferences =
        context.getSharedPreferences("legacy_prefs", Context.MODE_PRIVATE)

    suspend fun migrateIfNeeded(dataStore: DataStore<Preferences>) {
        val migrated = dataStore.data.first()[booleanPreferencesKey("migration_complete")] ?: false

        if (!migrated && hasLegacyData()) {
            dataStore.edit { preferences ->
                // Migrate all legacy data
                preferences[PreferencesKeys.DARK_MODE] =
                    oldPrefs.getBoolean("theme_dark", false)
                preferences[PreferencesKeys.USER_NAME] =
                    oldPrefs.getString("username", "Guest") ?: "Guest"

                // Mark migration complete
                preferences[booleanPreferencesKey("migration_complete")] = true
            }

            // Clear old preferences
            oldPrefs.edit().clear().apply()
        }
    }

    private fun hasLegacyData(): Boolean {
        return oldPrefs.contains("theme_dark") || oldPrefs.contains("username")
    }
}
```

## Best Practices

### 1. Use Repository Pattern

```kotlin
// Interface for testability
interface SettingsDataSource {
    val darkModeFlow: Flow<Boolean>
    val userNameFlow: Flow<String>
    suspend fun setDarkMode(enabled: Boolean)
    suspend fun setUserName(name: String)
}

// Implementation
class DataStoreSettingsDataSource(
    private val dataStore: DataStore<Preferences>
) : SettingsDataSource {

    override val darkModeFlow: Flow<Boolean> = dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.DARK_MODE] ?: false }

    override val userNameFlow: Flow<String> = dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { it[PreferencesKeys.USER_NAME] ?: "Guest" }

    override suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { it[PreferencesKeys.DARK_MODE] = enabled }
    }

    override suspend fun setUserName(name: String) {
        dataStore.edit { it[PreferencesKeys.USER_NAME] = name }
    }
}

// Fake implementation for testing
class FakeSettingsDataSource : SettingsDataSource {
    private val _darkMode = MutableStateFlow(false)
    private val _userName = MutableStateFlow("Guest")

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

### 2. Handle Errors Gracefully

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
                    userName = preferences[PreferencesKeys.USER_NAME] ?: "Guest"
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

### 3. Use Dependency Injection

```kotlin
// Hilt Module
@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
    }

    @Provides
    @Singleton
    fun provideSettingsRepository(
        dataStore: DataStore<Preferences>
    ): SettingsRepository {
        return SettingsRepository(dataStore)
    }
}

// Usage in ViewModel
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {
    // ...
}
```

## Common Pitfalls

### 1. Creating Multiple DataStore Instances

```kotlin
// WRONG: Creates multiple instances
class BadRepository(context: Context) {
    // This creates a new DataStore each time!
    private val dataStore = context.dataStore
}

// CORRECT: Use singleton pattern
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

// Or use dependency injection (recommended)
```

### 2. Blocking on Main Thread

```kotlin
// WRONG: Blocks the main thread
fun getDarkModeSynchronously(): Boolean {
    return runBlocking {
        dataStore.data.first()[PreferencesKeys.DARK_MODE] ?: false
    }
}

// CORRECT: Use Flow in coroutine scope
val darkModeFlow: Flow<Boolean> = dataStore.data
    .map { it[PreferencesKeys.DARK_MODE] ?: false }

// Collect in ViewModel
viewModelScope.launch {
    darkModeFlow.collect { darkMode ->
        _uiState.value = _uiState.value.copy(darkMode = darkMode)
    }
}
```

### 3. Not Handling Exceptions

```kotlin
// WRONG: Crashes on IOException
val dangerousFlow = dataStore.data.map { preferences ->
    preferences[PreferencesKeys.USER_NAME] ?: "Guest"
}

// CORRECT: Handle exceptions
val safeFlow = dataStore.data
    .catch { exception ->
        if (exception is IOException) {
            emit(emptyPreferences())
        } else {
            throw exception
        }
    }
    .map { preferences ->
        preferences[PreferencesKeys.USER_NAME] ?: "Guest"
    }
```

## Performance Considerations

### Efficient Reading

```kotlin
// Read multiple values efficiently with a single map
val settingsFlow: Flow<Settings> = dataStore.data.map { prefs ->
    Settings(
        darkMode = prefs[PreferencesKeys.DARK_MODE] ?: false,
        userName = prefs[PreferencesKeys.USER_NAME] ?: "Guest",
        fontSize = prefs[PreferencesKeys.FONT_SIZE] ?: 14
    )
}

// Use distinctUntilChanged to avoid unnecessary updates
val darkModeFlow: Flow<Boolean> = dataStore.data
    .map { it[PreferencesKeys.DARK_MODE] ?: false }
    .distinctUntilChanged()
```

### Batch Updates

```kotlin
// WRONG: Multiple writes
suspend fun updateSettingsBadly(darkMode: Boolean, fontSize: Int, userName: String) {
    dataStore.edit { it[PreferencesKeys.DARK_MODE] = darkMode }
    dataStore.edit { it[PreferencesKeys.FONT_SIZE] = fontSize }
    dataStore.edit { it[PreferencesKeys.USER_NAME] = userName }
}

// CORRECT: Single atomic write
suspend fun updateSettingsEfficiently(darkMode: Boolean, fontSize: Int, userName: String) {
    dataStore.edit { preferences ->
        preferences[PreferencesKeys.DARK_MODE] = darkMode
        preferences[PreferencesKeys.FONT_SIZE] = fontSize
        preferences[PreferencesKeys.USER_NAME] = userName
    }
}
```

## Real-World Scenarios

### Theme Management

```kotlin
class ThemeManager(
    private val dataStore: DataStore<Preferences>
) {
    sealed class Theme {
        object Light : Theme()
        object Dark : Theme()
        object System : Theme()
    }

    private val themeKey = stringPreferencesKey("theme")

    val themeFlow: Flow<Theme> = dataStore.data
        .map { preferences ->
            when (preferences[themeKey]) {
                "light" -> Theme.Light
                "dark" -> Theme.Dark
                else -> Theme.System
            }
        }
        .distinctUntilChanged()

    suspend fun setTheme(theme: Theme) {
        dataStore.edit { preferences ->
            preferences[themeKey] = when (theme) {
                Theme.Light -> "light"
                Theme.Dark -> "dark"
                Theme.System -> "system"
            }
        }
    }
}
```

### Onboarding State

```kotlin
class OnboardingManager(
    private val dataStore: DataStore<Preferences>
) {
    private val completedKey = booleanPreferencesKey("onboarding_completed")
    private val stepKey = intPreferencesKey("onboarding_step")

    val isCompletedFlow: Flow<Boolean> = dataStore.data
        .map { it[completedKey] ?: false }

    val currentStepFlow: Flow<Int> = dataStore.data
        .map { it[stepKey] ?: 0 }

    suspend fun completeStep(step: Int) {
        dataStore.edit { preferences ->
            preferences[stepKey] = step
        }
    }

    suspend fun completeOnboarding() {
        dataStore.edit { preferences ->
            preferences[completedKey] = true
        }
    }

    suspend fun resetOnboarding() {
        dataStore.edit { preferences ->
            preferences.remove(completedKey)
            preferences.remove(stepKey)
        }
    }
}
```

## Interview Key Points

1. **What is DataStore and why use it over SharedPreferences?**
   - Modern data storage solution with coroutine-based async API
   - Type-safe, handles errors gracefully
   - Never blocks UI thread

2. **What are the two types of DataStore?**
   - Preferences DataStore: Key-value pairs
   - Proto DataStore: Typed objects with Protocol Buffers

3. **How does DataStore handle data consistency?**
   - Atomic read-modify-write operations
   - Single file per DataStore instance
   - Updates are transactional

4. **How to migrate from SharedPreferences?**
   - Use SharedPreferencesMigration in produceMigrations
   - Migration runs once, atomically

5. **Best practices for DataStore?**
   - Single instance per file
   - Use repository pattern
   - Handle IOException in catch operator
   - Use dependency injection

## Further Reading

- [DataStore Official Documentation](https://developer.android.com/topic/libraries/architecture/datastore)
- [Preferences DataStore Guide](https://developer.android.com/codelabs/android-preferences-datastore)
- [Proto DataStore Guide](https://developer.android.com/codelabs/android-proto-datastore)
- [DataStore and Dependency Injection](https://developer.android.com/topic/libraries/architecture/datastore#koin)
- [Migrating from SharedPreferences](https://developer.android.com/topic/libraries/architecture/datastore#migrations)
