---
title: LiveData 响应式数据
description: Android LiveData 完全指南，涵盖可观察数据持有者、生命周期感知、数据转换以及响应式 UI 模式
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - LiveData
  - Reactive
  - Jetpack
  - Architecture
status: imported
origin: old/src/content/docs/kotlin/livedata.zh.md
divergence: 0.213
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 22
  lastUpdated: 2026-01-21
---

LiveData 是一个可观察的数据持有者类，它具有生命周期感知能力，这意味着它会尊重其他应用组件（如 Activity、Fragment 和 Service）的生命周期。这种感知能力确保 LiveData 只更新处于活跃生命周期状态的观察者，从而防止内存泄漏和崩溃。

## 概念解释

LiveData 是 Android 架构组件的一部分，作为响应式数据持有者使用。与普通的可观察对象不同，LiveData 具有生命周期感知能力，这意味着它会根据观察者的生命周期状态自动管理订阅。

### 为什么需要 LiveData？

传统的从数据变化更新 UI 的方式存在问题：

```kotlin
// 不使用 LiveData - 手动管理生命周期
class OldActivity : AppCompatActivity() {
    private var callback: DataCallback? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        callback = DataCallback { data ->
            // 如果在 onDestroy 之后调用可能会崩溃！
            textView.text = data
        }
        repository.registerCallback(callback!!)
    }

    override fun onDestroy() {
        super.onDestroy()
        // 必须记得取消注册！
        repository.unregisterCallback(callback!!)
    }
}
```

使用 LiveData，生命周期管理是自动的：

```kotlin
// 使用 LiveData - 自动管理生命周期
class ModernActivity : AppCompatActivity() {
    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 当 Activity 销毁时自动停止观察
        viewModel.data.observe(this) { data ->
            textView.text = data
        }
    }
    // 无需清理！
}
```

### 主要优势

1. **无内存泄漏**：观察者绑定到 Lifecycle 对象，会自行清理
2. **不会因停止的 Activity 而崩溃**：LiveData 不会向已停止的观察者发送更新
3. **数据始终最新**：观察者在变为活跃状态时会收到最新数据
4. **正确处理配置更改**：通过 ViewModel 使数据在配置更改后保留
5. **资源共享**：扩展 LiveData 以包装系统服务并在整个应用中共享

### 配置依赖

在 `build.gradle.kts` 中添加 LiveData：

```kotlin
dependencies {
    // LiveData
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")

    // ViewModel（通常与 LiveData 一起使用）
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // 可选：ReactiveStreams 支持
    implementation("androidx.lifecycle:lifecycle-reactivestreams-ktx:2.7.0")

    // 测试
    testImplementation("androidx.arch.core:core-testing:2.2.0")
}
```

## 核心原理

### LiveData 基础

LiveData 是一个泛型类，持有一个值并允许观察：

```kotlin
class MyViewModel : ViewModel() {
    // 私有可变 LiveData
    private val _name = MutableLiveData<String>()

    // 公开不可变 LiveData
    val name: LiveData<String> = _name

    fun setName(name: String) {
        _name.value = name  // 必须在主线程调用
    }

    fun setNameAsync(name: String) {
        _name.postValue(name)  // 可以从任何线程调用
    }
}

class MyActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.name.observe(this) { name ->
            // 更新 UI
            nameTextView.text = name
        }
    }
}
```

### 生命周期感知

LiveData 只在活跃状态（STARTED 或 RESUMED）时通知观察者：

```kotlin
class LifecycleAwareActivity : AppCompatActivity() {

    private val viewModel: DataViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.data.observe(this) { data ->
            // 只在 Activity 处于 STARTED 或 RESUMED 状态时调用
            Log.d("LiveData", "收到: $data")
            updateUI(data)
        }
    }

    override fun onStart() {
        super.onStart()
        // 观察者在此变为活跃
        // 如果在停止时更新了数据，现在会收到最新值
    }

    override fun onStop() {
        super.onStop()
        // 观察者在此变为非活跃
        // 停止期间不会收到更新
    }
}
```

### 观察者生命周期状态

```
INITIALIZED -> CREATED -> STARTED -> RESUMED
                            |           |
                            +-----------+
                            活跃状态（接收更新）

DESTROYED <- CREATED <- STARTED <- RESUMED
                |
              非活跃（无更新）
```

## 核心要点

### MutableLiveData vs LiveData

```kotlin
class UserViewModel : ViewModel() {

    // MutableLiveData - 可以修改
    private val _user = MutableLiveData<User>()

    // LiveData - 只读暴露
    val user: LiveData<User> = _user

    // 只有 ViewModel 可以修改值
    fun updateUser(user: User) {
        _user.value = user
    }
}

// 在 Activity/Fragment 中
class UserActivity : AppCompatActivity() {

    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 可以观察
        viewModel.user.observe(this) { user ->
            displayUser(user)
        }

        // 无法修改 - 编译错误
        // viewModel.user.value = newUser  // 错误！
    }
}
```

### setValue vs postValue

```kotlin
class DataViewModel : ViewModel() {

    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data

    // setValue - 必须在主线程调用
    fun updateOnMainThread(value: String) {
        _data.value = value  // 立即更新
    }

    // postValue - 可以从任何线程调用
    fun updateFromBackground(value: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val result = fetchFromNetwork()
            _data.postValue(result)  // 发送到主线程
        }
    }

    // 多次调用 postValue 的行为
    fun multiplePostValues() {
        viewModelScope.launch(Dispatchers.Default) {
            _data.postValue("第一个")
            _data.postValue("第二个")
            _data.postValue("第三个")
            // 只有"第三个"会被传递！
            // postValue 会合并更新
        }
    }
}
```

### 观察 LiveData

```kotlin
class ObservingActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 使用生命周期所有者进行标准观察
        viewModel.data.observe(this) { data ->
            // 生命周期感知的观察
        }

        // 使用显式 Observer 对象观察
        val observer = Observer<String> { data ->
            textView.text = data
        }
        viewModel.data.observe(this, observer)

        // 如果需要，手动移除观察者
        viewModel.data.removeObserver(observer)

        // 移除此生命周期所有者的所有观察者
        viewModel.data.removeObservers(this)
    }
}
```

### ObserveForever

用于非生命周期感知的观察：

```kotlin
class ServiceClass {

    private val observer = Observer<Data> { data ->
        processData(data)
    }

    fun startObserving(liveData: LiveData<Data>) {
        // 没有生命周期所有者 - 必须手动移除
        liveData.observeForever(observer)
    }

    fun stopObserving(liveData: LiveData<Data>) {
        // 必须移除以防止内存泄漏！
        liveData.removeObserver(observer)
    }
}
```

## 代码示例

### 基础 ViewModel 与 LiveData

```kotlin
data class User(
    val id: String,
    val name: String,
    val email: String
)

class UserViewModel : ViewModel() {

    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun loadUser(userId: String) {
        _isLoading.value = true
        _error.value = null

        viewModelScope.launch {
            try {
                val user = repository.fetchUser(userId)
                _user.value = user
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }
}

class UserActivity : AppCompatActivity() {

    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        viewModel.user.observe(this) { user ->
            nameTextView.text = user.name
            emailTextView.text = user.email
        }

        viewModel.isLoading.observe(this) { isLoading ->
            progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(this) { error ->
            error?.let {
                Toast.makeText(this, it, Toast.LENGTH_SHORT).show()
            }
        }

        viewModel.loadUser("user123")
    }
}
```

### LiveData 转换

```kotlin
class TransformationsViewModel : ViewModel() {

    private val _userId = MutableLiveData<String>()

    // map - 转换值
    val userName: LiveData<String> = _userId.map { userId ->
        "用户: $userId"
    }

    // switchMap - 根据值切换到不同的 LiveData
    val userDetails: LiveData<User> = _userId.switchMap { userId ->
        repository.getUserLiveData(userId)
    }

    fun setUserId(id: String) {
        _userId.value = id
    }
}

// 直接使用 Transformations 类
class ExplicitTransformationsViewModel : ViewModel() {

    private val _searchQuery = MutableLiveData<String>()

    // map 转换
    val formattedQuery: LiveData<String> = Transformations.map(_searchQuery) { query ->
        query.trim().lowercase()
    }

    // switchMap 转换
    val searchResults: LiveData<List<Result>> = Transformations.switchMap(_searchQuery) { query ->
        if (query.isBlank()) {
            MutableLiveData(emptyList())
        } else {
            repository.search(query)
        }
    }
}
```

### MediatorLiveData

组合多个 LiveData 源：

```kotlin
class CombinedViewModel : ViewModel() {

    private val _firstName = MutableLiveData<String>()
    private val _lastName = MutableLiveData<String>()

    val fullName = MediatorLiveData<String>().apply {
        fun update() {
            val first = _firstName.value ?: ""
            val last = _lastName.value ?: ""
            value = "$first $last".trim()
        }

        addSource(_firstName) { update() }
        addSource(_lastName) { update() }
    }

    fun setFirstName(name: String) {
        _firstName.value = name
    }

    fun setLastName(name: String) {
        _lastName.value = name
    }
}

// 更复杂的示例
class DataMergerViewModel : ViewModel() {

    private val localData = repository.getLocalData()
    private val remoteData = repository.getRemoteData()

    val mergedData = MediatorLiveData<List<Item>>().apply {
        var localItems: List<Item>? = null
        var remoteItems: List<Item>? = null

        fun merge() {
            val local = localItems ?: emptyList()
            val remote = remoteItems ?: emptyList()
            value = (local + remote).distinctBy { it.id }
        }

        addSource(localData) { items ->
            localItems = items
            merge()
        }

        addSource(remoteData) { items ->
            remoteItems = items
            merge()
        }
    }
}
```

### 自定义 LiveData

创建连接到系统服务的自定义 LiveData：

```kotlin
class LocationLiveData(
    private val context: Context
) : LiveData<Location>() {

    private val locationManager =
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            value = location
        }

        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    override fun onActive() {
        // 当至少有一个活跃观察者时调用
        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                1000L,
                10f,
                locationListener
            )
        }
    }

    override fun onInactive() {
        // 当没有活跃观察者时调用
        locationManager.removeUpdates(locationListener)
    }
}

// 使用
class LocationActivity : AppCompatActivity() {

    private val locationLiveData by lazy { LocationLiveData(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        locationLiveData.observe(this) { location ->
            updateLocationUI(location)
        }
    }
}
```

### 网络连接 LiveData

```kotlin
class NetworkStateLiveData(
    private val context: Context
) : LiveData<Boolean>() {

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            postValue(true)
        }

        override fun onLost(network: Network) {
            postValue(false)
        }

        override fun onUnavailable() {
            postValue(false)
        }
    }

    override fun onActive() {
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(networkRequest, networkCallback)

        // 设置初始值
        val isConnected = connectivityManager.activeNetwork != null
        postValue(isConnected)
    }

    override fun onInactive() {
        connectivityManager.unregisterNetworkCallback(networkCallback)
    }

    companion object {
        private var instance: NetworkStateLiveData? = null

        fun getInstance(context: Context): NetworkStateLiveData {
            return instance ?: synchronized(this) {
                instance ?: NetworkStateLiveData(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }
}
```

### 与 Room 数据库配合使用的 LiveData

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): LiveData<List<UserEntity>>

    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserById(userId: String): LiveData<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Delete
    suspend fun deleteUser(user: UserEntity)
}

class UserRepository(private val userDao: UserDao) {

    fun getAllUsers(): LiveData<List<UserEntity>> = userDao.getAllUsers()

    fun getUserById(id: String): LiveData<UserEntity?> = userDao.getUserById(id)

    suspend fun saveUser(user: UserEntity) = userDao.insertUser(user)
}

class UserListViewModel(
    private val repository: UserRepository
) : ViewModel() {

    val users: LiveData<List<UserEntity>> = repository.getAllUsers()

    fun saveUser(user: UserEntity) {
        viewModelScope.launch {
            repository.saveUser(user)
            // LiveData 自动更新观察者
        }
    }
}
```

## 最佳实践

### 1. 封装 MutableLiveData

```kotlin
// 错误：暴露 MutableLiveData
class BadViewModel : ViewModel() {
    val data = MutableLiveData<String>()  // 任何人都可以修改！
}

// 正确：暴露不可变 LiveData
class GoodViewModel : ViewModel() {
    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data

    fun updateData(value: String) {
        _data.value = value
    }
}
```

### 2. 使用转换而非在 ViewModel 中观察

```kotlin
// 错误：在 ViewModel 中观察 LiveData
class BadViewModel : ViewModel() {
    private val _userId = MutableLiveData<String>()
    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user

    init {
        _userId.observeForever { userId ->
            viewModelScope.launch {
                _user.value = repository.getUser(userId)
            }
        }
        // 潜在的内存泄漏！
    }
}

// 正确：使用 switchMap
class GoodViewModel : ViewModel() {
    private val _userId = MutableLiveData<String>()

    val user: LiveData<User> = _userId.switchMap { userId ->
        liveData {
            emit(repository.getUser(userId))
        }
    }

    fun setUserId(id: String) {
        _userId.value = id
    }
}
```

### 3. 处理空值

```kotlin
class NullSafeViewModel : ViewModel() {

    private val _data = MutableLiveData<String?>()
    val data: LiveData<String?> = _data

    // 提供带默认值的非空版本
    val nonNullData: LiveData<String> = _data.map { it ?: "默认值" }

    // 或使用 requireValue 扩展
    fun processData() {
        val value = _data.value ?: return
        // 安全处理 value
    }
}

// 在 Activity/Fragment 中
viewModel.data.observe(this) { data ->
    data?.let { nonNullData ->
        // 可以安全使用
    }
}
```

### 4. 避免在 map/switchMap 中执行繁重操作

```kotlin
// 错误：在 map 中执行繁重操作
val processedData = rawData.map { data ->
    // 这会在主线程运行！
    heavyProcessing(data)
}

// 正确：使用带协程的 liveData 构建器
val processedData = rawData.switchMap { data ->
    liveData(Dispatchers.Default) {
        val result = heavyProcessing(data)
        emit(result)
    }
}
```

### 5. 在 Fragment 中使用 viewLifecycleOwner

```kotlin
// 在 Fragment 中错误的做法
class BadFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.data.observe(this) { data ->  // 使用 Fragment 生命周期
            // 当视图被销毁时可能仍然收到更新
        }
    }
}

// 在 Fragment 中正确的做法
class GoodFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.data.observe(viewLifecycleOwner) { data ->  // 使用 View 生命周期
            // 只在视图存在时收到更新
        }
    }
}
```

## 常见陷阱

### 1. 在错误的生命周期中观察

```kotlin
// 错误：在 Fragment 的 onCreate 中观察
class BadFragment : Fragment() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.data.observe(this) { }  // Fragment 还没有附加到视图
    }
}

// 正确：在 onViewCreated 中观察
class GoodFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewModel.data.observe(viewLifecycleOwner) { }
    }
}
```

### 2. 未处理初始空值

```kotlin
// 问题：假设数据永不为空
class NullProblemActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.user.observe(this) { user ->
            // 如果 user 为空会崩溃！
            textView.text = user.name
        }
    }
}

// 解决方案：处理空值
class NullSafeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.user.observe(this) { user ->
            user?.let {
                textView.text = it.name
            } ?: run {
                textView.text = "加载中..."
            }
        }
    }
}
```

### 3. 多个观察者创建重复

```kotlin
// 错误：每次点击按钮都创建新观察者
class BadActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        button.setOnClickListener {
            // 每次都创建新观察者！
            viewModel.data.observe(this) { data ->
                processData(data)
            }
        }
    }
}

// 正确：只观察一次
class GoodActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 在生命周期中只观察一次
        viewModel.data.observe(this) { data ->
            processData(data)
        }

        button.setOnClickListener {
            viewModel.triggerDataLoad()
        }
    }
}
```

### 4. 使用 LiveData 处理事件

```kotlin
// 问题：事件被多次消费
class EventProblemViewModel : ViewModel() {
    private val _navigateEvent = MutableLiveData<String>()
    val navigateEvent: LiveData<String> = _navigateEvent

    fun onItemClick(id: String) {
        _navigateEvent.value = id
        // 旋转后，观察者会再次收到同一事件！
    }
}

// 解决方案 1：使用 SingleLiveEvent（包装器）
class SingleLiveEvent<T> : MutableLiveData<T>() {
    private val pending = AtomicBoolean(false)

    override fun observe(owner: LifecycleOwner, observer: Observer<in T>) {
        super.observe(owner) { t ->
            if (pending.compareAndSet(true, false)) {
                observer.onChanged(t)
            }
        }
    }

    override fun setValue(value: T?) {
        pending.set(true)
        super.setValue(value)
    }
}

// 解决方案 2：使用 Event 包装器
open class Event<out T>(private val content: T) {
    private var hasBeenHandled = false

    fun getContentIfNotHandled(): T? {
        return if (hasBeenHandled) {
            null
        } else {
            hasBeenHandled = true
            content
        }
    }

    fun peekContent(): T = content
}

class EventViewModel : ViewModel() {
    private val _navigateEvent = MutableLiveData<Event<String>>()
    val navigateEvent: LiveData<Event<String>> = _navigateEvent

    fun onItemClick(id: String) {
        _navigateEvent.value = Event(id)
    }
}

// 使用
viewModel.navigateEvent.observe(this) { event ->
    event.getContentIfNotHandled()?.let { id ->
        navigate(id)
    }
}
```

### 5. postValue 丢失更新

```kotlin
// 问题：多次调用 postValue
class PostValueProblem : ViewModel() {
    private val _count = MutableLiveData<Int>()
    val count: LiveData<Int> = _count

    fun increment() {
        viewModelScope.launch(Dispatchers.Default) {
            repeat(100) {
                val current = _count.value ?: 0
                _count.postValue(current + 1)
                // 大多数更新会丢失！
            }
        }
    }
}

// 解决方案：使用原子操作或主调度器
class PostValueSolution : ViewModel() {
    private val _count = MutableLiveData(0)
    val count: LiveData<Int> = _count

    fun increment() {
        viewModelScope.launch {
            repeat(100) {
                withContext(Dispatchers.Main) {
                    _count.value = (_count.value ?: 0) + 1
                }
            }
        }
    }

    // 或者使用 StateFlow 代替
    private val _countFlow = MutableStateFlow(0)
    val countFlow: StateFlow<Int> = _countFlow.asStateFlow()

    fun incrementFlow() {
        viewModelScope.launch {
            repeat(100) {
                _countFlow.update { it + 1 }  // 线程安全
            }
        }
    }
}
```

## 性能考量

### 1. 避免频繁更新

```kotlin
class ThrottledViewModel : ViewModel() {

    private val _sensorData = MutableLiveData<SensorData>()
    val sensorData: LiveData<SensorData> = _sensorData

    private var lastUpdateTime = 0L
    private val updateInterval = 100L  // 100ms 节流

    fun onSensorUpdate(data: SensorData) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastUpdateTime >= updateInterval) {
            _sensorData.value = data
            lastUpdateTime = currentTime
        }
    }
}
```

### 2. 使用 distinctUntilChanged

```kotlin
class DistinctViewModel : ViewModel() {

    private val _searchQuery = MutableLiveData<String>()

    val searchResults: LiveData<List<Result>> = _searchQuery
        .distinctUntilChanged()  // 只在值变化时发射
        .switchMap { query ->
            liveData {
                emit(repository.search(query))
            }
        }
}

// 自定义 distinctUntilChanged 扩展
fun <T> LiveData<T>.distinctUntilChanged(): LiveData<T> {
    val mediatorLiveData = MediatorLiveData<T>()
    mediatorLiveData.addSource(this) { newValue ->
        if (mediatorLiveData.value != newValue) {
            mediatorLiveData.value = newValue
        }
    }
    return mediatorLiveData
}
```

### 3. 延迟初始化

```kotlin
class LazyViewModel : ViewModel() {

    // 延迟初始化 - 只在首次观察时创建
    val expensiveData: LiveData<ExpensiveData> by lazy {
        liveData {
            val data = withContext(Dispatchers.IO) {
                calculateExpensiveData()
            }
            emit(data)
        }
    }
}
```

## 实战场景

### 场景 1：表单验证

```kotlin
class FormViewModel : ViewModel() {

    val email = MutableLiveData<String>()
    val password = MutableLiveData<String>()

    val emailError: LiveData<String?> = email.map { email ->
        when {
            email.isNullOrBlank() -> "邮箱必填"
            !email.isValidEmail() -> "邮箱格式无效"
            else -> null
        }
    }

    val passwordError: LiveData<String?> = password.map { password ->
        when {
            password.isNullOrBlank() -> "密码必填"
            password.length < 8 -> "密码至少需要 8 个字符"
            else -> null
        }
    }

    val isFormValid = MediatorLiveData<Boolean>().apply {
        fun validate() {
            value = emailError.value == null &&
                    passwordError.value == null &&
                    !email.value.isNullOrBlank() &&
                    !password.value.isNullOrBlank()
        }

        addSource(emailError) { validate() }
        addSource(passwordError) { validate() }
    }

    private val _loginResult = MutableLiveData<Event<Result<User>>>()
    val loginResult: LiveData<Event<Result<User>>> = _loginResult

    fun login() {
        if (isFormValid.value != true) return

        viewModelScope.launch {
            val result = repository.login(email.value!!, password.value!!)
            _loginResult.value = Event(result)
        }
    }
}
```

### 场景 2：带防抖的搜索

```kotlin
class SearchViewModel : ViewModel() {

    private val _searchQuery = MutableLiveData<String>()

    val searchResults: LiveData<Resource<List<SearchResult>>> =
        _searchQuery.switchMap { query ->
            liveData {
                emit(Resource.Loading())

                if (query.isBlank()) {
                    emit(Resource.Success(emptyList()))
                    return@liveData
                }

                delay(300)  // 防抖

                try {
                    val results = repository.search(query)
                    emit(Resource.Success(results))
                } catch (e: Exception) {
                    emit(Resource.Error(e.message ?: "搜索失败"))
                }
            }
        }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }
}

sealed class Resource<T> {
    class Loading<T> : Resource<T>()
    data class Success<T>(val data: T) : Resource<T>()
    data class Error<T>(val message: String) : Resource<T>()
}
```

### 场景 3：轮询数据

```kotlin
class PollingViewModel : ViewModel() {

    private val _isPolling = MutableLiveData(false)
    private var pollingJob: Job? = null

    val data: LiveData<Data> = liveData {
        while (true) {
            if (_isPolling.value == true) {
                try {
                    val data = repository.fetchLatestData()
                    emit(data)
                } catch (e: Exception) {
                    // 处理错误
                }
            }
            delay(5000)  // 每 5 秒轮询一次
        }
    }

    fun startPolling() {
        _isPolling.value = true
    }

    fun stopPolling() {
        _isPolling.value = false
    }

    override fun onCleared() {
        super.onCleared()
        stopPolling()
    }
}
```

## LiveData vs StateFlow

现代 Android 开发通常使用 StateFlow 代替 LiveData：

```kotlin
// LiveData 方式
class LiveDataViewModel : ViewModel() {
    private val _state = MutableLiveData<UiState>()
    val state: LiveData<UiState> = _state
}

// StateFlow 方式
class StateFlowViewModel : ViewModel() {
    private val _state = MutableStateFlow<UiState>(UiState.Initial)
    val state: StateFlow<UiState> = _state.asStateFlow()
}
```

| 特性 | LiveData | StateFlow |
|------|----------|-----------|
| 初始值 | 可选 | 必需 |
| 空安全 | 可空 | 可以非空 |
| 线程安全 | setValue 仅主线程 | 任何线程 |
| 生命周期感知 | 内置 | 需要 repeatOnLifecycle |
| 转换 | map, switchMap | 完整 Flow 操作符 |
| 测试 | 需要 InstantTaskExecutorRule | 标准协程测试 |

## 面试要点

1. **什么是 LiveData？**
   - 可观察的数据持有者类
   - 生命周期感知 - 只更新活跃观察者
   - Android 架构组件的一部分
   - 防止内存泄漏和崩溃

2. **setValue 和 postValue 有什么区别？**
   - setValue：必须在主线程调用，立即更新
   - postValue：可以从任何线程调用，发送到主线程
   - postValue 会合并多次调用

3. **什么是 MediatorLiveData？**
   - LiveData 子类，可以观察其他 LiveData 源
   - 用于组合或转换多个 LiveData
   - 管理多个源的注册

4. **LiveData 如何处理配置更改？**
   - 与 ViewModel 配合使用时，数据在配置更改后保留
   - 新的 Activity/Fragment 在观察时会收到最新值
   - 观察者会自动重新注册

5. **什么是 LiveData 转换？**
   - map：将 LiveData 值转换为另一种类型
   - switchMap：根据值切换到不同的 LiveData
   - 惰性的 - 只在被观察时才计算

6. **如何用 LiveData 处理一次性事件？**
   - 使用 Event 包装器模式
   - 使用 SingleLiveEvent
   - 考虑使用 SharedFlow 处理事件

7. **何时使用 LiveData vs StateFlow？**
   - LiveData：简单 UI 状态，Java 互操作
   - StateFlow：复杂转换，Compose，测试

8. **常见的 LiveData 陷阱有哪些？**
   - 使用 Fragment 生命周期而非 viewLifecycleOwner
   - 暴露 MutableLiveData
   - 在同一生命周期所有者上有多个观察者
   - 事件在旋转后被重新传递

## 延伸阅读

- [LiveData 概述](https://developer.android.com/topic/libraries/architecture/livedata)
- [LiveData 与 ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [LiveData 转换](https://developer.android.com/topic/libraries/architecture/livedata#transform_livedata)
- [StateFlow 和 SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- [从 LiveData 迁移到 StateFlow](https://developer.android.com/topic/libraries/architecture/livedata#migrate-stateflow)
- [Android 架构组件](https://developer.android.com/topic/architecture)
