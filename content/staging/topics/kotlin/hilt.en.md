---
title: Hilt Dependency Injection
description: "A comprehensive guide to Kotlin Hilt dependency injection: master dependency management, modular design, and testing strategies in Android applications"
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Hilt
  - Dependency Injection
  - Android
  - Dagger
status: imported
origin: old/src/content/docs/kotlin/hilt.en.md
divergence: 0.206
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: kotlin
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is Dependency Injection

Dependency Injection (DI) is a design pattern that transfers the creation of objects and the management of dependencies from inside objects to an external container. This pattern follows the "Inversion of Control" (IoC) principle, making code more modular, testable, and maintainable.

```kotlin
// Without dependency injection - tight coupling
class UserRepository {
    private val database = AppDatabase() // Dependencies created directly
    private val apiService = RetrofitClient.create() // Dependencies created directly

    fun getUser(id: String): User {
        // ...
    }
}

// With dependency injection - loose coupling
class UserRepository(
    private val database: AppDatabase, // Dependencies passed from outside
    private val apiService: ApiService  // Dependencies passed from outside
) {
    fun getUser(id: String): User {
        // ...
    }
}
```

### What is Hilt

Hilt is Google's dependency injection library for Android, built on top of Dagger and specifically designed for Android applications. Hilt simplifies Dagger's configuration by providing standardized components and scopes, making it much easier to implement dependency injection in Android apps.

```
Hilt's Core Advantages:
1. Reduced boilerplate code - Automatic generation of Dagger components and modules
2. Predefined components - Tightly integrated with Android lifecycle
3. Standardization - Unified dependency injection approach
4. Test-friendly - Built-in testing support
5. Android Studio support - Complete IDE integration
```

### Hilt vs Dagger vs Koin

| Feature | Hilt | Dagger | Koin |
|---------|------|--------|------|
| Type | Compile-time | Compile-time | Runtime |
| Performance | High | High | Moderate |
| Learning Curve | Moderate | Steep | Gentle |
| Boilerplate Code | Low | High | Low |
| Compile-time Checking | Yes | Yes | No |
| Android Integration | Native | Requires Config | Good |
| Google Official | Yes | Yes | No |

## Core Principles

### Hilt Component Hierarchy

Hilt defines a standard component hierarchy, with each component corresponding to a specific Android lifecycle:

```
SingletonComponent (Application)
    │
    ├── ActivityRetainedComponent (ViewModel)
    │       │
    │       └── ActivityComponent (Activity)
    │               │
    │               ├── FragmentComponent (Fragment)
    │               │       │
    │               │       └── ViewWithFragmentComponent (View with Fragment)
    │               │
    │               └── ViewComponent (View)
    │
    └── ServiceComponent (Service)
```

### Component and Scope Correspondence

```kotlin
Component                          Scope                    Creation Time     Destruction Time
─────────────────────────────────────────────────────────────────────────────────────
SingletonComponent                @Singleton              App created       App destroyed
ActivityRetainedComponent         @ActivityRetainedScoped Activity created   Activity final destroyed
ActivityComponent                 @ActivityScoped          Activity created   Activity destroyed
FragmentComponent                 @FragmentScoped          Fragment attach    Fragment detach
ViewComponent                     @ViewScoped              View created       View destroyed
ViewWithFragmentComponent         @ViewScoped              View created       View destroyed
ServiceComponent                  @ServiceScoped           Service created    Service destroyed
```

### Dependency Injection Workflow

```
1. Compile-time Processing
   ┌─────────────────────────────────────────────────────┐
   │  @HiltAndroidApp    →  Generate Hilt_Application   │
   │  @AndroidEntryPoint →  Generate Hilt_XxxActivity   │
   │  @Module/@Provides  →  Generate XxxModule_Factory  │
   │  @Inject            →  Record Dependencies          │
   └─────────────────────────────────────────────────────┘

2. Runtime Injection
   ┌─────────────────────────────────────────────────────┐
   │  Application Start → Create SingletonComponent      │
   │  Activity Create   → Create ActivityComponent       │
   │  Request Dependency → Obtain or create from component │
   │  Lifecycle End     → Component destroyed, release   │
   └─────────────────────────────────────────────────────┘
```

## Key Points

### Configuring Hilt

First, add Hilt dependencies to your project:

```kotlin
// project build.gradle.kts
plugins {
    id("com.google.dagger.hilt.android") version "2.50" apply false
}

// app build.gradle.kts
plugins {
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}

android {
    // ...
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-android-compiler:2.50")

    // For ViewModel support
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Testing support
    testImplementation("com.google.dagger:hilt-android-testing:2.50")
    kspTest("com.google.dagger:hilt-android-compiler:2.50")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.50")
    kspAndroidTest("com.google.dagger:hilt-android-compiler:2.50")
}
```

### @HiltAndroidApp

The `@HiltAndroidApp` annotation marks the Application class and is the trigger point for Hilt code generation, generating the fundamental components needed by Hilt.

```kotlin
@HiltAndroidApp
class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Hilt automatically handles dependency injection initialization
        // No need to call any manual initialization code
    }
}
```

Register in `AndroidManifest.xml`:

```xml
<application
    android:name=".MyApplication"
    android:allowBackup="true"
    ... >
</application>
```

### @AndroidEntryPoint

The `@AndroidEntryPoint` annotation marks Android components that need dependency injection. Supported component types include:

- Activity
- Fragment
- View
- Service
- BroadcastReceiver

```kotlin
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    // Field injection
    @Inject
    lateinit var userRepository: UserRepository

    @Inject
    lateinit var analyticsService: AnalyticsService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // At this point userRepository and analyticsService are already injected
        // Can be used directly
        userRepository.getUser("123")
    }
}

@AndroidEntryPoint
class UserFragment : Fragment() {

    @Inject
    lateinit var userRepository: UserRepository

    // Fragment must be attached to an Activity with @AndroidEntryPoint
}

@AndroidEntryPoint
class MyService : Service() {

    @Inject
    lateinit var notificationHelper: NotificationHelper

    override fun onBind(intent: Intent?): IBinder? = null
}
```

### @Inject

The `@Inject` annotation has two purposes:

1. **Constructor Injection**: Tells Hilt how to create instances of a class
2. **Field Injection**: Injects dependencies in Android components

```kotlin
// Constructor injection - Hilt knows how to create UserRepository
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    suspend fun getUser(id: String): User {
        return userDao.getUser(id) ?: apiService.fetchUser(id)
    }
}

// Multi-level dependency chain
class UserDao @Inject constructor(
    private val database: AppDatabase
) {
    fun getUser(id: String): User? {
        return database.userDao().findById(id)
    }
}

class ApiService @Inject constructor(
    private val retrofit: Retrofit
) {
    suspend fun fetchUser(id: String): User {
        return retrofit.create(UserApi::class.java).getUser(id)
    }
}
```

### @Module and @InstallIn

When Hilt cannot create instances through constructor injection (e.g., interfaces, third-party library classes), use Modules to provide dependencies.

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.example.com/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        )
        .fallbackToDestructiveMigration()
        .build()
    }

    @Provides
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }
}
```

### @Provides

The `@Provides` annotation defines how to create instances of a type within a Module.

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // Provide simple dependencies
    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create()
    }

    // Depend on other injected objects
    @Provides
    @Singleton
    fun provideSharedPreferences(
        @ApplicationContext context: Context
    ): SharedPreferences {
        return context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    }

    // Provide conditional dependencies
    @Provides
    @Singleton
    fun provideBaseUrl(): String {
        return if (BuildConfig.DEBUG) {
            "https://dev-api.example.com/"
        } else {
            "https://api.example.com/"
        }
    }
}
```

### @Binds

The `@Binds` annotation binds an interface to its implementation, more efficient than `@Provides` as it requires no method body.

```kotlin
// Define interface and implementation
interface UserRepository {
    suspend fun getUser(id: String): User
    suspend fun saveUser(user: User)
}

class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) : UserRepository {

    override suspend fun getUser(id: String): User {
        return userDao.getUser(id) ?: apiService.fetchUser(id).also {
            userDao.insertUser(it)
        }
    }

    override suspend fun saveUser(user: User) {
        userDao.insertUser(user)
        apiService.updateUser(user)
    }
}

// Use @Binds to bind interface to implementation
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindUserRepository(
        userRepositoryImpl: UserRepositoryImpl
    ): UserRepository

    @Binds
    @Singleton
    abstract fun bindProductRepository(
        productRepositoryImpl: ProductRepositoryImpl
    ): ProductRepository
}
```

### Qualifiers

When multiple implementations of the same type exist, use qualifiers to distinguish them:

```kotlin
// Define qualifiers
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AuthInterceptor

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class LoggingInterceptor

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class IoDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class MainDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class DefaultDispatcher

// Use qualifiers in Module
@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule {

    @Provides
    @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides
    @MainDispatcher
    fun provideMainDispatcher(): CoroutineDispatcher = Dispatchers.Main

    @Provides
    @DefaultDispatcher
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default
}

@Module
@InstallIn(SingletonComponent::class)
object InterceptorModule {

    @Provides
    @AuthInterceptor
    fun provideAuthInterceptor(
        tokenManager: TokenManager
    ): Interceptor {
        return Interceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer ${tokenManager.getToken()}")
                .build()
            chain.proceed(request)
        }
    }

    @Provides
    @LoggingInterceptor
    fun provideLoggingInterceptor(): Interceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }
}

// Use qualifiers when injecting
class NetworkRepository @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher,
    private val apiService: ApiService
) {
    suspend fun fetchData() = withContext(ioDispatcher) {
        apiService.getData()
    }
}
```

## Code Examples

### Complete Application Architecture Example

```kotlin
// ============ Data Layer ============

// Entity class
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?,
    val createdAt: Long
)

// DAO
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUserById(id: String): UserEntity?

    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<UserEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Delete
    suspend fun deleteUser(user: UserEntity)
}

// Database
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}

// API Service
interface UserApiService {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserDto

    @GET("users")
    suspend fun getAllUsers(): List<UserDto>

    @POST("users")
    suspend fun createUser(@Body user: UserDto): UserDto
}

// DTO
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?,
    val createdAt: String
)

// Mapper
class UserMapper @Inject constructor() {
    fun toEntity(dto: UserDto): UserEntity {
        return UserEntity(
            id = dto.id,
            name = dto.name,
            email = dto.email,
            avatarUrl = dto.avatarUrl,
            createdAt = parseDate(dto.createdAt)
        )
    }

    fun toDomain(entity: UserEntity): User {
        return User(
            id = entity.id,
            name = entity.name,
            email = entity.email,
            avatarUrl = entity.avatarUrl
        )
    }

    private fun parseDate(dateString: String): Long {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            .parse(dateString)?.time ?: 0
    }
}

// Repository interface
interface UserRepository {
    suspend fun getUser(id: String): Result<User>
    fun getAllUsers(): Flow<List<User>>
    suspend fun refreshUsers()
}

// Repository implementation
class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val userApiService: UserApiService,
    private val userMapper: UserMapper,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : UserRepository {

    override suspend fun getUser(id: String): Result<User> = withContext(ioDispatcher) {
        try {
            // Try getting from local storage first
            val localUser = userDao.getUserById(id)
            if (localUser != null) {
                return@withContext Result.success(userMapper.toDomain(localUser))
            }

            // If not local, fetch from network
            val remoteUser = userApiService.getUser(id)
            val entity = userMapper.toEntity(remoteUser)
            userDao.insertUser(entity)

            Result.success(userMapper.toDomain(entity))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getAllUsers(): Flow<List<User>> {
        return userDao.getAllUsers()
            .map { entities -> entities.map { userMapper.toDomain(it) } }
            .flowOn(ioDispatcher)
    }

    override suspend fun refreshUsers() = withContext(ioDispatcher) {
        try {
            val remoteUsers = userApiService.getAllUsers()
            remoteUsers.forEach { dto ->
                userDao.insertUser(userMapper.toEntity(dto))
            }
        } catch (e: Exception) {
            // Handle error
        }
    }
}

// ============ Domain Layer ============

// Domain model
data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?
)

// Use Case
class GetUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(userId: String): Result<User> {
        return userRepository.getUser(userId)
    }
}

class GetAllUsersUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    operator fun invoke(): Flow<List<User>> {
        return userRepository.getAllUsers()
    }
}

// ============ Presentation Layer ============

// UI State
sealed interface UserUiState {
    object Loading : UserUiState
    data class Success(val users: List<User>) : UserUiState
    data class Error(val message: String) : UserUiState
}

// ViewModel
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getAllUsersUseCase: GetAllUsersUseCase,
    private val getUserUseCase: GetUserUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()

    private val _selectedUser = MutableStateFlow<User?>(null)
    val selectedUser: StateFlow<User?> = _selectedUser.asStateFlow()

    init {
        loadUsers()
    }

    private fun loadUsers() {
        viewModelScope.launch {
            getAllUsersUseCase()
                .catch { e ->
                    _uiState.value = UserUiState.Error(e.message ?: "Unknown error")
                }
                .collect { users ->
                    _uiState.value = UserUiState.Success(users)
                }
        }
    }

    fun selectUser(userId: String) {
        viewModelScope.launch {
            getUserUseCase(userId)
                .onSuccess { user ->
                    _selectedUser.value = user
                }
                .onFailure { e ->
                    // Handle error
                }
        }
    }
}

// Activity
@AndroidEntryPoint
class UserActivity : AppCompatActivity() {

    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is UserUiState.Loading -> showLoading()
                        is UserUiState.Success -> showUsers(state.users)
                        is UserUiState.Error -> showError(state.message)
                    }
                }
            }
        }
    }

    private fun showLoading() { /* ... */ }
    private fun showUsers(users: List<User>) { /* ... */ }
    private fun showError(message: String) { /* ... */ }
}
```

### Hilt Module Configuration

```kotlin
// ============ Dependency Injection Modules ============

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(
        @AuthInterceptor authInterceptor: Interceptor,
        @LoggingInterceptor loggingInterceptor: Interceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    @Provides
    @Singleton
    fun provideUserApiService(retrofit: Retrofit): UserApiService {
        return retrofit.create(UserApiService::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        )
        .addMigrations(MIGRATION_1_2)
        .build()
    }

    @Provides
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }

    private val MIGRATION_1_2 = object : Migration(1, 2) {
        override fun migrate(database: SupportSQLiteDatabase) {
            database.execSQL("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        }
    }
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindUserRepository(
        impl: UserRepositoryImpl
    ): UserRepository
}

@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule {

    @Provides
    @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides
    @MainDispatcher
    fun provideMainDispatcher(): CoroutineDispatcher = Dispatchers.Main

    @Provides
    @DefaultDispatcher
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default
}

@Module
@InstallIn(SingletonComponent::class)
object CommonModule {

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .serializeNulls()
            .create()
    }
}
```

### Jetpack Compose with Hilt

```kotlin
// Use HiltViewModel in Compose
@Composable
fun UserScreen(
    viewModel: UserViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is UserUiState.Loading -> {
            LoadingIndicator()
        }
        is UserUiState.Success -> {
            UserList(
                users = state.users,
                onUserClick = { user ->
                    viewModel.selectUser(user.id)
                }
            )
        }
        is UserUiState.Error -> {
            ErrorMessage(message = state.message)
        }
    }
}

@Composable
fun UserList(
    users: List<User>,
    onUserClick: (User) -> Unit
) {
    LazyColumn {
        items(users) { user ->
            UserItem(
                user = user,
                onClick = { onUserClick(user) }
            )
        }
    }
}

// ViewModel with navigation parameters
@HiltViewModel
class UserDetailViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val userId: String = savedStateHandle.get<String>("userId")
        ?: throw IllegalArgumentException("userId is required")

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    init {
        loadUser()
    }

    private fun loadUser() {
        viewModelScope.launch {
            getUserUseCase(userId)
                .onSuccess { _user.value = it }
        }
    }
}

// Navigation Compose with Hilt
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = "users"
    ) {
        composable("users") {
            UserScreen(
                onUserClick = { userId ->
                    navController.navigate("users/$userId")
                }
            )
        }

        composable(
            route = "users/{userId}",
            arguments = listOf(
                navArgument("userId") { type = NavType.StringType }
            )
        ) {
            UserDetailScreen()
        }
    }
}

@Composable
fun UserDetailScreen(
    viewModel: UserDetailViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsStateWithLifecycle()

    user?.let { u ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Text(text = u.name, style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = u.email, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
```

### Assisted Injection

When certain parameters need to be provided at runtime, use assisted injection:

```kotlin
// Define class requiring assisted injection
class ImageLoader @AssistedInject constructor(
    private val okHttpClient: OkHttpClient,
    private val diskCache: DiskCache,
    @Assisted private val config: ImageLoaderConfig
) {

    @AssistedFactory
    interface Factory {
        fun create(config: ImageLoaderConfig): ImageLoader
    }

    fun load(url: String): Bitmap {
        // Load image using config
        return loadImageWithConfig(url, config)
    }

    private fun loadImageWithConfig(url: String, config: ImageLoaderConfig): Bitmap {
        // Implementation details
        TODO()
    }
}

data class ImageLoaderConfig(
    val maxWidth: Int,
    val maxHeight: Int,
    val quality: Int
)

// Use assisted injection
@AndroidEntryPoint
class ImageActivity : AppCompatActivity() {

    @Inject
    lateinit var imageLoaderFactory: ImageLoader.Factory

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val config = ImageLoaderConfig(
            maxWidth = 1024,
            maxHeight = 768,
            quality = 80
        )

        val imageLoader = imageLoaderFactory.create(config)
        // Use imageLoader
    }
}
```

### WorkManager with Hilt

```kotlin
// Configure HiltWorkerFactory
@HiltAndroidApp
class MyApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}

// Define Worker
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val userRepository: UserRepository
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            userRepository.refreshUsers()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    companion object {
        const val WORK_NAME = "sync_work"

        fun buildRequest(): PeriodicWorkRequest {
            return PeriodicWorkRequestBuilder<SyncWorker>(
                15, TimeUnit.MINUTES
            )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
        }
    }
}

// No additional configuration needed in Module
// Hilt automatically handles @HiltWorker annotated Workers
```

## Best Practices

### Module Responsibility Separation

```kotlin
// Place different types of dependencies in separate modules

// Network-related
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule { /* ... */ }

// Database-related
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule { /* ... */ }

// Repository binding
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule { /* ... */ }

// Dispatchers
@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule { /* ... */ }

// Feature-specific dependencies
@Module
@InstallIn(ViewModelComponent::class)
object UserFeatureModule { /* ... */ }
```

### Prefer Constructor Injection

```kotlin
// Recommended: Constructor injection
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
)

// Avoid: Field injection (only use in Android components)
class UserRepository {
    @Inject
    lateinit var userDao: UserDao  // Not recommended
}
```

### Use Interface Abstraction

```kotlin
// Define interface
interface DataSource<T> {
    suspend fun get(id: String): T?
    suspend fun save(item: T)
    suspend fun delete(id: String)
}

// Implement interface
class LocalUserDataSource @Inject constructor(
    private val userDao: UserDao
) : DataSource<User> {
    override suspend fun get(id: String) = userDao.getUserById(id)
    override suspend fun save(item: User) = userDao.insertUser(item)
    override suspend fun delete(id: String) = userDao.deleteById(id)
}

class RemoteUserDataSource @Inject constructor(
    private val apiService: ApiService
) : DataSource<User> {
    override suspend fun get(id: String) = apiService.getUser(id)
    override suspend fun save(item: User) = apiService.updateUser(item)
    override suspend fun delete(id: String) = apiService.deleteUser(id)
}

// Use qualifiers to distinguish
@Qualifier annotation class LocalDataSource
@Qualifier annotation class RemoteDataSource

@Module
@InstallIn(SingletonComponent::class)
abstract class DataSourceModule {
    @Binds @LocalDataSource
    abstract fun bindLocalDataSource(impl: LocalUserDataSource): DataSource<User>

    @Binds @RemoteDataSource
    abstract fun bindRemoteDataSource(impl: RemoteUserDataSource): DataSource<User>
}
```

### Choose Scope Correctly

```kotlin
// Singleton - entire application lifecycle
@Singleton
class AppConfig @Inject constructor()

// ActivityRetainedScoped - retained across configuration changes
@ActivityRetainedScoped
class SessionManager @Inject constructor()

// ViewModelScoped - not recommended to use directly, use @HiltViewModel
// ActivityScoped - Activity lifecycle
@ActivityScoped
class ActivityAnalytics @Inject constructor()

// FragmentScoped - Fragment lifecycle
@FragmentScoped
class FragmentState @Inject constructor()

// Unscoped - new instance created on each injection
class Mapper @Inject constructor()
```

### Avoid Circular Dependencies

```kotlin
// Error: Circular dependency
class A @Inject constructor(private val b: B)
class B @Inject constructor(private val a: A) // Compile error

// Solution 1: Use Lazy
class A @Inject constructor(private val b: Lazy<B>)
class B @Inject constructor(private val a: A)

// Solution 2: Use Provider
class A @Inject constructor(private val bProvider: Provider<B>)
class B @Inject constructor(private val a: A)

// Solution 3: Refactor design, introduce intermediate layer
class A @Inject constructor(private val shared: Shared)
class B @Inject constructor(private val shared: Shared)
class Shared @Inject constructor()
```

## Common Pitfalls

### Forgot to Annotate with @AndroidEntryPoint

```kotlin
// Error: Missing @AndroidEntryPoint annotation
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository // null or uninitialized at runtime
}

// Correct
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository
}
```

### Using Concrete Implementation in @Binds

```kotlin
// Error: @Binds method must be abstract
@Module
@InstallIn(SingletonComponent::class)
object WrongModule {
    @Binds
    fun bindRepository(impl: UserRepositoryImpl): UserRepository {
        return impl // Error: cannot have method body
    }
}

// Correct
@Module
@InstallIn(SingletonComponent::class)
abstract class CorrectModule {
    @Binds
    abstract fun bindRepository(impl: UserRepositoryImpl): UserRepository
}
```

### Scope Mismatch

```kotlin
// Error: Providing Singleton scope in ViewModelComponent
@Module
@InstallIn(ViewModelComponent::class)
object WrongScopeModule {
    @Provides
    @Singleton // Error: scope doesn't match component
    fun provideManager(): Manager = ManagerImpl()
}

// Correct: Use matching scope
@Module
@InstallIn(ViewModelComponent::class)
object CorrectScopeModule {
    @Provides
    @ViewModelScoped
    fun provideManager(): Manager = ManagerImpl()
}
```

### Fragment Not Attached to @AndroidEntryPoint Activity

```kotlin
// Error: Activity not annotated
class MainActivity : AppCompatActivity() // Missing @AndroidEntryPoint

@AndroidEntryPoint
class UserFragment : Fragment() {
    @Inject
    lateinit var repository: UserRepository // Runtime crash
}

// Correct
@AndroidEntryPoint
class MainActivity : AppCompatActivity()

@AndroidEntryPoint
class UserFragment : Fragment() {
    @Inject
    lateinit var repository: UserRepository
}
```

### Using Injected Dependencies in init Block

```kotlin
// Error: Dependency may not be injected at init time
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository

    init {
        repository.doSomething() // Crash: repository not initialized
    }
}

// Correct: Use in onCreate
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository.doSomething() // Correct: injected by now
    }
}
```

### Mixing object and abstract class

```kotlin
// Error: Mixing @Provides and @Binds in same module
@Module
@InstallIn(SingletonComponent::class)
abstract class MixedModule {
    @Binds
    abstract fun bindRepository(impl: RepositoryImpl): Repository

    @Provides // Error: abstract class cannot have concrete methods
    fun provideApi(): Api = ApiImpl()
}

// Correct: Separate definitions
@Module
@InstallIn(SingletonComponent::class)
abstract class BindsModule {
    @Binds
    abstract fun bindRepository(impl: RepositoryImpl): Repository
}

@Module
@InstallIn(SingletonComponent::class)
object ProvidesModule {
    @Provides
    fun provideApi(): Api = ApiImpl()
}

// Or use companion object
@Module
@InstallIn(SingletonComponent::class)
abstract class CombinedModule {
    @Binds
    abstract fun bindRepository(impl: RepositoryImpl): Repository

    companion object {
        @Provides
        fun provideApi(): Api = ApiImpl()
    }
}
```

## Performance Considerations

### Compile-time Performance

Hilt uses annotation processors to generate code at compile time, which increases build time:

```kotlin
// Optimization suggestions:

// 1. Use incremental compilation
// gradle.properties
kapt.incremental.apt=true
kapt.use.worker.api=true

// 2. For KSP (recommended)
// build.gradle.kts
plugins {
    id("com.google.devtools.ksp")
}

dependencies {
    ksp("com.google.dagger:hilt-android-compiler:2.50")
}

// 3. Reduce unnecessary modules
// Combine related dependencies into fewer modules
```

### Runtime Performance

```kotlin
// 1. Avoid excessive use of Lazy and Provider
// Only use when truly needing lazy initialization

// 2. Use scope appropriately
// @Singleton holds instances until app ends
// For rarely used dependencies consider no scope

// 3. Avoid time-consuming operations in @Provides methods
@Provides
@Singleton
fun provideDatabase(context: Context): Database {
    // Database creation is time-consuming, but since it's Singleton
    // it only executes once, which is acceptable
    return Room.databaseBuilder(...).build()
}

// 4. Use @Binds instead of @Provides (more efficient)
// @Binds doesn't create extra method calls
@Binds
abstract fun bindRepository(impl: RepositoryImpl): Repository
```

### Memory Optimization

```kotlin
// 1. Choose component scope correctly
// Avoid placing large objects in SingletonComponent

// 2. Use WeakReference to handle potential memory leaks
class Analytics @Inject constructor() {
    private var activityRef: WeakReference<Activity>? = null

    fun attach(activity: Activity) {
        activityRef = WeakReference(activity)
    }
}

// 3. Release resources at appropriate lifecycle
@ActivityScoped
class ResourceManager @Inject constructor() {
    private var resources: Resources? = null

    fun release() {
        resources = null
    }
}
```

## Real-World Scenarios

### Multi-Module Project Configuration

```kotlin
// ============ Core Module ============

// core/build.gradle.kts
plugins {
    id("com.android.library")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-android-compiler:2.50")
}

// core/.../di/CoreModule.kt
@Module
@InstallIn(SingletonComponent::class)
object CoreModule {
    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder().create()
}

// ============ Feature Module ============

// feature-user/build.gradle.kts
plugins {
    id("com.android.library")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

dependencies {
    implementation(project(":core"))
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-android-compiler:2.50")
}

// feature-user/.../di/UserModule.kt
@Module
@InstallIn(SingletonComponent::class)
abstract class UserModule {
    @Binds
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository
}

// ============ App Module ============

// app/build.gradle.kts
plugins {
    id("com.android.application")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

dependencies {
    implementation(project(":core"))
    implementation(project(":feature-user"))
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-android-compiler:2.50")
}

// app/.../MyApplication.kt
@HiltAndroidApp
class MyApplication : Application()
```

### Testing Configuration

```kotlin
// ============ Unit Tests ============

// Use Fake implementations for real ones
class FakeUserRepository : UserRepository {
    private val users = mutableMapOf<String, User>()

    override suspend fun getUser(id: String): Result<User> {
        return users[id]?.let { Result.success(it) }
            ?: Result.failure(Exception("User not found"))
    }

    override fun getAllUsers(): Flow<List<User>> {
        return flowOf(users.values.toList())
    }

    override suspend fun refreshUsers() {
        // Test implementation
    }

    fun addUser(user: User) {
        users[user.id] = user
    }
}

class UserViewModelTest {

    private lateinit var viewModel: UserViewModel
    private lateinit var fakeRepository: FakeUserRepository

    @Before
    fun setup() {
        fakeRepository = FakeUserRepository()
        viewModel = UserViewModel(
            getAllUsersUseCase = GetAllUsersUseCase(fakeRepository),
            getUserUseCase = GetUserUseCase(fakeRepository)
        )
    }

    @Test
    fun `when users exist, state should be Success`() = runTest {
        // Given
        fakeRepository.addUser(User("1", "Test", "test@example.com", null))

        // When & Then
        viewModel.uiState.test {
            assertEquals(UserUiState.Loading, awaitItem())
            val successState = awaitItem() as UserUiState.Success
            assertEquals(1, successState.users.size)
        }
    }
}

// ============ Android Tests ============

// Use Hilt testing
@HiltAndroidTest
class UserActivityTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val activityRule = ActivityScenarioRule(UserActivity::class.java)

    @Inject
    lateinit var userRepository: UserRepository

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @Test
    fun testUserListDisplayed() {
        // Test implementation
    }
}

// Replace test modules
@Module
@InstallIn(SingletonComponent::class)
abstract class TestRepositoryModule {
    @Binds
    @Singleton
    abstract fun bindUserRepository(
        fakeRepository: FakeUserRepository
    ): UserRepository
}

// Replace production modules in tests
@UninstallModules(RepositoryModule::class)
@HiltAndroidTest
class UserActivityTestWithFake {
    // ...
}

// Custom test Application
@CustomTestApplication(MyApplication::class)
interface HiltTestApplication

// Test runner
class HiltTestRunner : AndroidJUnitRunner() {
    override fun newApplication(
        cl: ClassLoader?,
        className: String?,
        context: Context?
    ): Application {
        return super.newApplication(cl, HiltTestApplication_Application::class.java.name, context)
    }
}

// app/build.gradle.kts
android {
    defaultConfig {
        testInstrumentationRunner = "com.example.HiltTestRunner"
    }
}
```

### Conditional Dependency Injection

```kotlin
// Provide different implementations based on build type
@Module
@InstallIn(SingletonComponent::class)
object LoggerModule {

    @Provides
    @Singleton
    fun provideLogger(): Logger {
        return if (BuildConfig.DEBUG) {
            DebugLogger()
        } else {
            ReleaseLogger()
        }
    }
}

// Using BuildConfig variables
@Module
@InstallIn(SingletonComponent::class)
object ConfigModule {

    @Provides
    @Singleton
    fun provideApiConfig(): ApiConfig {
        return ApiConfig(
            baseUrl = BuildConfig.API_BASE_URL,
            apiKey = BuildConfig.API_KEY,
            timeout = if (BuildConfig.DEBUG) 60L else 30L
        )
    }
}

// Using Feature Flags
@Module
@InstallIn(SingletonComponent::class)
abstract class FeatureModule {

    @Binds
    abstract fun bindPaymentProcessor(
        @FeatureFlag("new_payment") processor: PaymentProcessor
    ): PaymentProcessor
}

// Feature Flag implementation
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class FeatureFlag(val flag: String)

@Module
@InstallIn(SingletonComponent::class)
object PaymentModule {

    @Provides
    @FeatureFlag("new_payment")
    fun providePaymentProcessor(
        featureFlags: FeatureFlags,
        newProcessor: NewPaymentProcessor,
        legacyProcessor: LegacyPaymentProcessor
    ): PaymentProcessor {
        return if (featureFlags.isEnabled("new_payment")) {
            newProcessor
        } else {
            legacyProcessor
        }
    }
}
```

## Interview Questions

### What is Dependency Injection and what problems does it solve?

```
Definition of Dependency Injection:
Dependency Injection is a design pattern that transfers the creation of objects and the management of dependencies from inside objects to an external container.

Problems it solves:
1. Tight Coupling - Classes no longer create dependencies directly, reducing coupling
2. Testability - Can easily replace dependencies for unit testing
3. Maintainability - Dependencies are centrally managed, easier to modify
4. Extensibility - Easy to add new implementations without modifying existing code
5. Code Reuse - Dependencies can be shared across multiple places

Three ways to perform dependency injection:
1. Constructor injection (recommended)
2. Field injection
3. Method injection
```

### What advantages does Hilt have over Dagger?

```
Hilt's advantages:

1. Reduced boilerplate code
   - No need to manually create Components
   - No need to manually manage Component lifecycle
   - Predefined Android component bindings

2. Standardization
   - Unified component hierarchy
   - Unified scope definitions
   - Unified best practices

3. Better Android integration
   - Seamless ViewModel integration
   - Seamless WorkManager integration
   - Seamless Navigation integration

4. Testing support
   - Built-in test rules
   - Easy dependency replacement
   - @UninstallModules support

5. Compile-time checking
   - Retains Dagger's compile-time safety
   - Catches configuration errors early
```

### What's the difference between @Provides and @Binds?

```kotlin
// @Provides
// - For providing concrete instances
// - Can have method body
// - Can call constructors or other methods
// - Must be used in object class

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.example.com")
            .build()
    }
}

// @Binds
// - For binding interface to implementation
// - No method body allowed
// - Must be abstract method
// - Must be in abstract class
// - Better performance (doesn't generate extra factory class)

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindRepository(impl: RepositoryImpl): Repository
}

// When to use which:
// - @Binds: Interface binding to implementation class (recommended)
// - @Provides: Third-party library classes, objects needing configuration, complex creation logic
```

### Explain Hilt's component hierarchy

```
SingletonComponent (Application level)
│
├── ActivityRetainedComponent (retained across config changes)
│   │
│   └── ActivityComponent (Activity level)
│       │
│       ├── FragmentComponent (Fragment level)
│       │   │
│       │   └── ViewWithFragmentComponent (View in Fragment)
│       │
│       └── ViewComponent (View in Activity)
│
└── ServiceComponent (Service level)

Key points:
1. Child components can access parent component dependencies
2. Each component has corresponding scope
3. Component lifecycle syncs with Android component lifecycle
4. @Singleton can only be used in SingletonComponent
5. @ActivityScoped can only be used in ActivityComponent
```

### How do you handle multiple dependencies of the same type?

```kotlin
// Use @Qualifier qualifiers

// 1. Define qualifiers
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class LocalDataSource

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class RemoteDataSource

// 2. Use in Module
@Module
@InstallIn(SingletonComponent::class)
object DataSourceModule {
    @Provides
    @LocalDataSource
    fun provideLocalDataSource(db: Database): DataSource {
        return LocalDataSourceImpl(db)
    }

    @Provides
    @RemoteDataSource
    fun provideRemoteDataSource(api: Api): DataSource {
        return RemoteDataSourceImpl(api)
    }
}

// 3. Specify qualifier when injecting
class Repository @Inject constructor(
    @LocalDataSource private val localDataSource: DataSource,
    @RemoteDataSource private val remoteDataSource: DataSource
)

// Built-in qualifiers:
// @ApplicationContext - Application Context
// @ActivityContext - Activity Context
```

### How do you test code using Hilt?

```kotlin
// Unit tests: Create objects directly, use Fake implementations
class UserViewModelTest {
    @Test
    fun test() {
        val fakeRepository = FakeUserRepository()
        val viewModel = UserViewModel(fakeRepository)
        // Test
    }
}

// Android tests: Use Hilt testing framework
@HiltAndroidTest
class UserActivityTest {

    @get:Rule
    val hiltRule = HiltAndroidRule(this)

    @Inject
    lateinit var repository: UserRepository

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @Test
    fun test() {
        // Test
    }
}

// Replace dependencies
@UninstallModules(RepositoryModule::class)
@HiltAndroidTest
class TestWithFake {
    // Use test modules to replace
}

@Module
@InstallIn(SingletonComponent::class)
object TestModule {
    @Provides
    fun provideRepository(): UserRepository = FakeUserRepository()
}
```

## Further Reading

### Official Documentation
- [Hilt Official Documentation](https://developer.android.com/training/dependency-injection/hilt-android)
- [Dagger Official Documentation](https://dagger.dev/)
- [Hilt and Jetpack Integration](https://developer.android.com/training/dependency-injection/hilt-jetpack)

### Recommended Resources
- [Android Developers - Dependency Injection Guide](https://developer.android.com/training/dependency-injection)
- [Hilt Codelab](https://developer.android.com/codelabs/android-hilt)
- [Hilt Testing Guide](https://developer.android.com/training/dependency-injection/hilt-testing)
- [Kotlin Coroutines with Hilt](https://developer.android.com/kotlin/coroutines)

### Related Libraries
- [Koin](https://insert-koin.io/) - Lightweight runtime dependency injection framework
- [Kodein](https://kosi-libs.org/kodein/) - Kotlin dependency injection framework
- [Toothpick](https://github.com/stephanenicolas/toothpick) - Scope-based DI framework

### Best Practice Articles
- [Google's Android App Architecture Guide](https://developer.android.com/topic/architecture)
- [Clean Architecture and Dependency Injection](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
