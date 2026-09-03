---
title: Hilt 依赖注入
description: Kotlin Hilt 依赖注入完全指南：掌握 Android 应用中的依赖管理、模块化设计与测试策略
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Hilt
  - 依赖注入
  - Android
  - Dagger
status: imported
origin: old/src/content/docs/kotlin/hilt.zh.md
divergence: 0.206
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Kotlin
  subcategory: Android
  order: 10
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是依赖注入

依赖注入（Dependency Injection，DI）是一种设计模式，它将对象的创建和依赖关系的管理从对象内部转移到外部容器。这种模式遵循"控制反转"（Inversion of Control，IoC）原则，使得代码更加模块化、可测试和可维护。

```kotlin
// 不使用依赖注入 - 紧耦合
class UserRepository {
    private val database = AppDatabase() // 直接创建依赖
    private val apiService = RetrofitClient.create() // 直接创建依赖

    fun getUser(id: String): User {
        // ...
    }
}

// 使用依赖注入 - 松耦合
class UserRepository(
    private val database: AppDatabase, // 依赖从外部传入
    private val apiService: ApiService  // 依赖从外部传入
) {
    fun getUser(id: String): User {
        // ...
    }
}
```

### 什么是 Hilt

Hilt 是 Google 推出的 Android 依赖注入库，它建立在 Dagger 之上，专为 Android 应用设计。Hilt 简化了 Dagger 的配置，提供了标准化的组件和作用域，使得在 Android 应用中实现依赖注入变得更加简单。

```
Hilt 的核心优势：
1. 减少样板代码 - 自动生成 Dagger 组件和模块
2. 预定义组件 - 与 Android 生命周期紧密集成
3. 标准化 - 统一的依赖注入方式
4. 测试友好 - 内置测试支持
5. Android Studio 支持 - 完善的 IDE 集成
```

### Hilt vs Dagger vs Koin

| 特性 | Hilt | Dagger | Koin |
|------|------|--------|------|
| 类型 | 编译时 | 编译时 | 运行时 |
| 性能 | 高 | 高 | 中等 |
| 学习曲线 | 中等 | 陡峭 | 平缓 |
| 样板代码 | 少 | 多 | 少 |
| 编译时检查 | 是 | 是 | 否 |
| Android 集成 | 原生 | 需配置 | 良好 |
| Google 官方 | 是 | 是 | 否 |

## 核心原理

### Hilt 组件层次结构

Hilt 定义了一套标准的组件层次结构，每个组件对应 Android 中的特定生命周期：

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

### 组件与作用域对应关系

```kotlin
组件                              作用域                     创建时机        销毁时机
─────────────────────────────────────────────────────────────────────────────────────
SingletonComponent               @Singleton              Application 创建   Application 销毁
ActivityRetainedComponent        @ActivityRetainedScoped Activity 创建      Activity 最终销毁
ActivityComponent                @ActivityScoped          Activity 创建      Activity 销毁
FragmentComponent                @FragmentScoped          Fragment attach    Fragment detach
ViewComponent                    @ViewScoped              View 创建          View 销毁
ViewWithFragmentComponent        @ViewScoped              View 创建          View 销毁
ServiceComponent                 @ServiceScoped           Service 创建       Service 销毁
```

### 依赖注入的工作流程

```
1. 编译时处理
   ┌─────────────────────────────────────────────────────┐
   │  @HiltAndroidApp    →  生成 Hilt_Application       │
   │  @AndroidEntryPoint →  生成 Hilt_XxxActivity       │
   │  @Module/@Provides  →  生成 XxxModule_Factory      │
   │  @Inject            →  记录依赖关系                 │
   └─────────────────────────────────────────────────────┘

2. 运行时注入
   ┌─────────────────────────────────────────────────────┐
   │  Application 启动 → 创建 SingletonComponent         │
   │  Activity 创建    → 创建 ActivityComponent          │
   │  请求依赖        → 从组件中获取或创建实例            │
   │  生命周期结束    → 组件销毁，释放依赖                │
   └─────────────────────────────────────────────────────┘
```

## 核心要点

### 配置 Hilt

首先，在项目中添加 Hilt 依赖：

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

    // 对于 ViewModel 支持
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // 测试支持
    testImplementation("com.google.dagger:hilt-android-testing:2.50")
    kspTest("com.google.dagger:hilt-android-compiler:2.50")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.50")
    kspAndroidTest("com.google.dagger:hilt-android-compiler:2.50")
}
```

### @HiltAndroidApp

`@HiltAndroidApp` 注解用于标记 Application 类，它是 Hilt 代码生成的触发点，会生成 Hilt 所需的基础组件。

```kotlin
@HiltAndroidApp
class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Hilt 会自动处理依赖注入的初始化
        // 不需要手动调用任何初始化代码
    }
}
```

在 `AndroidManifest.xml` 中注册：

```xml
<application
    android:name=".MyApplication"
    android:allowBackup="true"
    ... >
</application>
```

### @AndroidEntryPoint

`@AndroidEntryPoint` 注解用于标记需要依赖注入的 Android 组件。支持的组件类型包括：

- Activity
- Fragment
- View
- Service
- BroadcastReceiver

```kotlin
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    // 字段注入
    @Inject
    lateinit var userRepository: UserRepository

    @Inject
    lateinit var analyticsService: AnalyticsService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 此时 userRepository 和 analyticsService 已经被注入
        // 可以直接使用
        userRepository.getUser("123")
    }
}

@AndroidEntryPoint
class UserFragment : Fragment() {

    @Inject
    lateinit var userRepository: UserRepository

    // Fragment 必须依附于使用 @AndroidEntryPoint 的 Activity
}

@AndroidEntryPoint
class MyService : Service() {

    @Inject
    lateinit var notificationHelper: NotificationHelper

    override fun onBind(intent: Intent?): IBinder? = null
}
```

### @Inject

`@Inject` 注解有两种用途：

1. **构造函数注入**：告诉 Hilt 如何创建类的实例
2. **字段注入**：在 Android 组件中注入依赖

```kotlin
// 构造函数注入 - Hilt 知道如何创建 UserRepository
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    suspend fun getUser(id: String): User {
        return userDao.getUser(id) ?: apiService.fetchUser(id)
    }
}

// 多级依赖链
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

### @Module 和 @InstallIn

当 Hilt 无法通过构造函数注入来创建某个类的实例时（例如接口、第三方库类），需要使用 Module 来提供依赖。

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

`@Provides` 注解用于在 Module 中定义如何创建某个类型的实例。

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // 提供简单的依赖
    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create()
    }

    // 依赖其他已注入的对象
    @Provides
    @Singleton
    fun provideSharedPreferences(
        @ApplicationContext context: Context
    ): SharedPreferences {
        return context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    }

    // 提供带有条件的依赖
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

`@Binds` 注解用于将接口绑定到具体实现，比 `@Provides` 更高效，因为它不需要方法体。

```kotlin
// 定义接口和实现
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

// 使用 @Binds 绑定接口到实现
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

### 限定符（Qualifiers）

当同一类型有多个实现时，使用限定符来区分：

```kotlin
// 定义限定符
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

// 在 Module 中使用限定符
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

// 注入时使用限定符
class NetworkRepository @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher,
    private val apiService: ApiService
) {
    suspend fun fetchData() = withContext(ioDispatcher) {
        apiService.getData()
    }
}
```

## 代码示例

### 完整的应用架构示例

```kotlin
// ============ 数据层 ============

// 实体类
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

// 数据库
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}

// API 接口
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

// 映射器
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

// Repository 接口
interface UserRepository {
    suspend fun getUser(id: String): Result<User>
    fun getAllUsers(): Flow<List<User>>
    suspend fun refreshUsers()
}

// Repository 实现
class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val userApiService: UserApiService,
    private val userMapper: UserMapper,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : UserRepository {

    override suspend fun getUser(id: String): Result<User> = withContext(ioDispatcher) {
        try {
            // 先从本地获取
            val localUser = userDao.getUserById(id)
            if (localUser != null) {
                return@withContext Result.success(userMapper.toDomain(localUser))
            }

            // 本地没有则从网络获取
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
            // 处理错误
        }
    }
}

// ============ 领域层 ============

// 领域模型
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

// ============ 表现层 ============

// UI 状态
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
                    // 处理错误
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

### Hilt 模块配置

```kotlin
// ============ 依赖注入模块 ============

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

### Jetpack Compose 与 Hilt

```kotlin
// Compose 中使用 HiltViewModel
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

// 带导航参数的 ViewModel
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

// Navigation Compose 与 Hilt
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

### 辅助注入（Assisted Injection）

当某些参数需要在运行时传入时，使用辅助注入：

```kotlin
// 定义需要辅助注入的类
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
        // 使用 config 加载图片
        return loadImageWithConfig(url, config)
    }

    private fun loadImageWithConfig(url: String, config: ImageLoaderConfig): Bitmap {
        // 实现细节
        TODO()
    }
}

data class ImageLoaderConfig(
    val maxWidth: Int,
    val maxHeight: Int,
    val quality: Int
)

// 使用辅助注入
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
        // 使用 imageLoader
    }
}
```

### WorkManager 与 Hilt

```kotlin
// 配置 HiltWorkerFactory
@HiltAndroidApp
class MyApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}

// 定义 Worker
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

// 在 Module 中不需要额外配置
// Hilt 会自动处理 @HiltWorker 标注的 Worker
```

## 最佳实践

### 模块职责分离

```kotlin
// 将不同类型的依赖放在不同的模块中

// 网络相关
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule { /* ... */ }

// 数据库相关
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule { /* ... */ }

// Repository 绑定
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule { /* ... */ }

// 调度器
@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule { /* ... */ }

// 功能模块特定的依赖
@Module
@InstallIn(ViewModelComponent::class)
object UserFeatureModule { /* ... */ }
```

### 优先使用构造函数注入

```kotlin
// 推荐：构造函数注入
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
)

// 避免：字段注入（仅在 Android 组件中使用）
class UserRepository {
    @Inject
    lateinit var userDao: UserDao  // 不推荐
}
```

### 使用接口抽象

```kotlin
// 定义接口
interface DataSource<T> {
    suspend fun get(id: String): T?
    suspend fun save(item: T)
    suspend fun delete(id: String)
}

// 实现接口
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

// 使用限定符区分
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

### 正确选择作用域

```kotlin
// Singleton - 整个应用生命周期
@Singleton
class AppConfig @Inject constructor()

// ActivityRetainedScoped - 跨配置变更保留
@ActivityRetainedScoped
class SessionManager @Inject constructor()

// ViewModelScoped - 不推荐直接使用，使用 @HiltViewModel
// ActivityScoped - Activity 生命周期
@ActivityScoped
class ActivityAnalytics @Inject constructor()

// FragmentScoped - Fragment 生命周期
@FragmentScoped
class FragmentState @Inject constructor()

// 无作用域 - 每次注入创建新实例
class Mapper @Inject constructor()
```

### 避免循环依赖

```kotlin
// 错误：循环依赖
class A @Inject constructor(private val b: B)
class B @Inject constructor(private val a: A) // 编译错误

// 解决方案1：使用 Lazy
class A @Inject constructor(private val b: Lazy<B>)
class B @Inject constructor(private val a: A)

// 解决方案2：使用 Provider
class A @Inject constructor(private val bProvider: Provider<B>)
class B @Inject constructor(private val a: A)

// 解决方案3：重构设计，引入中间层
class A @Inject constructor(private val shared: Shared)
class B @Inject constructor(private val shared: Shared)
class Shared @Inject constructor()
```

## 常见陷阱

### 忘记标注 @AndroidEntryPoint

```kotlin
// 错误：没有标注 @AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository // 运行时会是 null 或未初始化
}

// 正确
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository
}
```

### 在 @Binds 中使用具体实现

```kotlin
// 错误：@Binds 方法必须是抽象的
@Module
@InstallIn(SingletonComponent::class)
object WrongModule {
    @Binds
    fun bindRepository(impl: UserRepositoryImpl): UserRepository {
        return impl // 错误：不能有方法体
    }
}

// 正确
@Module
@InstallIn(SingletonComponent::class)
abstract class CorrectModule {
    @Binds
    abstract fun bindRepository(impl: UserRepositoryImpl): UserRepository
}
```

### 作用域不匹配

```kotlin
// 错误：在 ViewModelComponent 中提供 Singleton 作用域
@Module
@InstallIn(ViewModelComponent::class)
object WrongScopeModule {
    @Provides
    @Singleton // 错误：作用域与组件不匹配
    fun provideManager(): Manager = ManagerImpl()
}

// 正确：使用匹配的作用域
@Module
@InstallIn(ViewModelComponent::class)
object CorrectScopeModule {
    @Provides
    @ViewModelScoped
    fun provideManager(): Manager = ManagerImpl()
}
```

### Fragment 未附加到 @AndroidEntryPoint Activity

```kotlin
// 错误：Activity 未标注
class MainActivity : AppCompatActivity() // 缺少 @AndroidEntryPoint

@AndroidEntryPoint
class UserFragment : Fragment() {
    @Inject
    lateinit var repository: UserRepository // 运行时崩溃
}

// 正确
@AndroidEntryPoint
class MainActivity : AppCompatActivity()

@AndroidEntryPoint
class UserFragment : Fragment() {
    @Inject
    lateinit var repository: UserRepository
}
```

### 在 init 块中使用注入的依赖

```kotlin
// 错误：依赖在 init 时可能还未注入
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository

    init {
        repository.doSomething() // 崩溃：repository 未初始化
    }
}

// 正确：在 onCreate 中使用
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject
    lateinit var repository: UserRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository.doSomething() // 正确：此时已注入
    }
}
```

### 混用 object 和 abstract class

```kotlin
// 错误：在同一模块中混用 @Provides 和 @Binds
@Module
@InstallIn(SingletonComponent::class)
abstract class MixedModule {
    @Binds
    abstract fun bindRepository(impl: RepositoryImpl): Repository

    @Provides // 错误：abstract class 不能有具体方法
    fun provideApi(): Api = ApiImpl()
}

// 正确：分开定义
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

// 或者使用 companion object
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

## 性能考量

### 编译时性能

Hilt 使用注解处理器在编译时生成代码，这会增加编译时间：

```kotlin
// 优化建议：

// 1. 使用增量编译
// gradle.properties
kapt.incremental.apt=true
kapt.use.worker.api=true

// 2. 对于 KSP (推荐)
// build.gradle.kts
plugins {
    id("com.google.devtools.ksp")
}

dependencies {
    ksp("com.google.dagger:hilt-android-compiler:2.50")
}

// 3. 减少不必要的模块
// 将相关依赖合并到更少的模块中
```

### 运行时性能

```kotlin
// 1. 避免过度使用 Lazy 和 Provider
// 只在真正需要延迟初始化时使用

// 2. 合理使用作用域
// @Singleton 会持有实例直到应用结束
// 对于不常用的依赖考虑不使用作用域

// 3. 避免在 @Provides 方法中执行耗时操作
@Provides
@Singleton
fun provideDatabase(context: Context): Database {
    // 数据库创建是耗时操作，但因为是 Singleton
    // 所以只会执行一次，是可接受的
    return Room.databaseBuilder(...).build()
}

// 4. 使用 @Binds 替代 @Provides（更高效）
// @Binds 不创建额外的方法调用
@Binds
abstract fun bindRepository(impl: RepositoryImpl): Repository
```

### 内存优化

```kotlin
// 1. 正确选择组件作用域
// 避免在 SingletonComponent 中放置大对象

// 2. 使用 WeakReference 处理可能的内存泄漏
class Analytics @Inject constructor() {
    private var activityRef: WeakReference<Activity>? = null

    fun attach(activity: Activity) {
        activityRef = WeakReference(activity)
    }
}

// 3. 在适当的生命周期释放资源
@ActivityScoped
class ResourceManager @Inject constructor() {
    private var resources: Resources? = null

    fun release() {
        resources = null
    }
}
```

## 实战场景

### 多模块项目配置

```kotlin
// ============ 基础模块 (core) ============

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

// ============ 功能模块 (feature-user) ============

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

// ============ 应用模块 (app) ============

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

### 测试配置

```kotlin
// ============ 单元测试 ============

// 使用 Fake 替代真实实现
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
        // 测试实现
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

// ============ Android 测试 ============

// 使用 Hilt 测试
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
        // 测试实现
    }
}

// 替换测试模块
@Module
@InstallIn(SingletonComponent::class)
abstract class TestRepositoryModule {
    @Binds
    @Singleton
    abstract fun bindUserRepository(
        fakeRepository: FakeUserRepository
    ): UserRepository
}

// 在测试中替换生产模块
@UninstallModules(RepositoryModule::class)
@HiltAndroidTest
class UserActivityTestWithFake {
    // ...
}

// 自定义测试 Application
@CustomTestApplication(MyApplication::class)
interface HiltTestApplication

// 测试运行器
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

### 条件依赖注入

```kotlin
// 根据构建类型提供不同实现
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

// 使用 BuildConfig 变量
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

// 使用 Feature Flag
@Module
@InstallIn(SingletonComponent::class)
abstract class FeatureModule {

    @Binds
    abstract fun bindPaymentProcessor(
        @FeatureFlag("new_payment") processor: PaymentProcessor
    ): PaymentProcessor
}

// Feature Flag 实现
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

## 面试要点

### 什么是依赖注入？它解决了什么问题？

```
依赖注入的定义：
依赖注入是一种设计模式，将对象的创建和依赖关系的管理从对象内部转移到外部容器。

解决的问题：
1. 紧耦合 - 类不再直接创建依赖，降低耦合度
2. 可测试性 - 可以轻松替换依赖进行单元测试
3. 可维护性 - 依赖关系集中管理，便于修改
4. 可扩展性 - 易于添加新的实现而不修改现有代码
5. 代码复用 - 依赖可以在多个地方共享

依赖注入的三种方式：
1. 构造函数注入（推荐）
2. 字段注入
3. 方法注入
```

### Hilt 相比 Dagger 有什么优势？

```
Hilt 的优势：

1. 减少样板代码
   - 不需要手动创建 Component
   - 不需要手动管理 Component 生命周期
   - 预定义的 Android 组件绑定

2. 标准化
   - 统一的组件层次结构
   - 统一的作用域定义
   - 统一的最佳实践

3. 更好的 Android 集成
   - 与 ViewModel 无缝集成
   - 与 WorkManager 无缝集成
   - 与 Navigation 无缝集成

4. 测试支持
   - 内置测试规则
   - 易于替换依赖
   - @UninstallModules 支持

5. 编译时检查
   - 保留了 Dagger 的编译时安全性
   - 提前发现配置错误
```

### @Provides 和 @Binds 的区别是什么？

```kotlin
// @Provides
// - 用于提供具体实例
// - 可以有方法体
// - 可以调用构造函数或其他方法
// - 必须在 object 类中使用

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
// - 用于将接口绑定到实现
// - 不能有方法体
// - 必须是抽象方法
// - 必须在 abstract class 中使用
// - 性能更好（不生成额外的工厂类）

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindRepository(impl: RepositoryImpl): Repository
}

// 何时使用哪个：
// - @Binds：接口绑定到实现类（推荐）
// - @Provides：第三方库类、需要配置的对象、复杂创建逻辑
```

### 解释 Hilt 的组件层次结构

```
SingletonComponent（Application 级别）
│
├── ActivityRetainedComponent（跨配置变更保留）
│   │
│   └── ActivityComponent（Activity 级别）
│       │
│       ├── FragmentComponent（Fragment 级别）
│       │   │
│       │   └── ViewWithFragmentComponent（Fragment 中的 View）
│       │
│       └── ViewComponent（Activity 中的 View）
│
└── ServiceComponent（Service 级别）

关键点：
1. 子组件可以访问父组件的依赖
2. 每个组件有对应的作用域
3. 组件生命周期与 Android 组件同步
4. @Singleton 只能在 SingletonComponent 中使用
5. @ActivityScoped 只能在 ActivityComponent 中使用
```

### 如何处理多个相同类型的依赖？

```kotlin
// 使用 @Qualifier 限定符

// 1. 定义限定符
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class LocalDataSource

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class RemoteDataSource

// 2. 在 Module 中使用
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

// 3. 注入时指定限定符
class Repository @Inject constructor(
    @LocalDataSource private val localDataSource: DataSource,
    @RemoteDataSource private val remoteDataSource: DataSource
)

// 内置限定符：
// @ApplicationContext - Application Context
// @ActivityContext - Activity Context
```

### 如何测试使用 Hilt 的代码？

```kotlin
// 单元测试：直接创建对象，使用 Fake 实现
class UserViewModelTest {
    @Test
    fun test() {
        val fakeRepository = FakeUserRepository()
        val viewModel = UserViewModel(fakeRepository)
        // 测试
    }
}

// Android 测试：使用 Hilt 测试框架
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
        // 测试
    }
}

// 替换依赖
@UninstallModules(RepositoryModule::class)
@HiltAndroidTest
class TestWithFake {
    // 使用测试模块替换
}

@Module
@InstallIn(SingletonComponent::class)
object TestModule {
    @Provides
    fun provideRepository(): UserRepository = FakeUserRepository()
}
```

## 延伸阅读

### 官方文档
- [Hilt 官方文档](https://developer.android.com/training/dependency-injection/hilt-android)
- [Dagger 官方文档](https://dagger.dev/)
- [Hilt 与 Jetpack 集成](https://developer.android.com/training/dependency-injection/hilt-jetpack)

### 推荐资源
- [Android Developers - 依赖注入指南](https://developer.android.com/training/dependency-injection)
- [Hilt Codelab](https://developer.android.com/codelabs/android-hilt)
- [Hilt 测试指南](https://developer.android.com/training/dependency-injection/hilt-testing)
- [Kotlin Coroutines 与 Hilt](https://developer.android.com/kotlin/coroutines)

### 相关库
- [Koin](https://insert-koin.io/) - 轻量级运行时依赖注入框架
- [Kodein](https://kosi-libs.org/kodein/) - Kotlin 依赖注入框架
- [Toothpick](https://github.com/stephanenicolas/toothpick) - 基于作用域的 DI 框架

### 最佳实践文章
- [Google 的 Android 应用架构指南](https://developer.android.com/topic/architecture)
- [Clean Architecture 与依赖注入](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
