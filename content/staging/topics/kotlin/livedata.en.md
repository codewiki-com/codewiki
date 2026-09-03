---
title: LiveData Reactive Data
description: Complete guide to Android LiveData for observable data holders, lifecycle awareness, transformations, and reactive UI patterns
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
origin: old/src/content/docs/kotlin/livedata.en.md
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

LiveData is an observable data holder class that is lifecycle-aware, meaning it respects the lifecycle of other app components such as Activities, Fragments, and Services. This awareness ensures LiveData only updates app component observers that are in an active lifecycle state, preventing memory leaks and crashes.

## Concept Explanation

LiveData is part of Android's Architecture Components and serves as a reactive data holder. Unlike regular observables, LiveData is lifecycle-aware, which means it automatically manages subscriptions based on the lifecycle state of observers.

### Why LiveData?

Traditional approaches to updating UI from data changes had issues:

```kotlin
// Without LiveData - Manual lifecycle management
class OldActivity : AppCompatActivity() {
    private var callback: DataCallback? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        callback = DataCallback { data ->
            // Might crash if called after onDestroy!
            textView.text = data
        }
        repository.registerCallback(callback!!)
    }

    override fun onDestroy() {
        super.onDestroy()
        // Must remember to unregister!
        repository.unregisterCallback(callback!!)
    }
}
```

With LiveData, lifecycle management is automatic:

```kotlin
// With LiveData - Automatic lifecycle management
class ModernActivity : AppCompatActivity() {
    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Automatically stops observing when Activity is destroyed
        viewModel.data.observe(this) { data ->
            textView.text = data
        }
    }
    // No cleanup needed!
}
```

### Key Benefits

1. **No memory leaks**: Observers are bound to Lifecycle objects and clean up after themselves
2. **No crashes from stopped activities**: LiveData won't deliver updates to stopped observers
3. **Always up-to-date data**: Observers receive the latest data when becoming active
4. **Proper configuration change handling**: Data survives configuration changes via ViewModel
5. **Sharing resources**: Extend LiveData to wrap system services and share across the app

### Setup and Dependencies

Add LiveData to your project in `build.gradle.kts`:

```kotlin
dependencies {
    // LiveData
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")

    // ViewModel (commonly used with LiveData)
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // Optional: ReactiveStreams support
    implementation("androidx.lifecycle:lifecycle-reactivestreams-ktx:2.7.0")

    // Testing
    testImplementation("androidx.arch.core:core-testing:2.2.0")
}
```

## Core Principles

### LiveData Basics

LiveData is a generic class that holds a value and allows observation:

```kotlin
class MyViewModel : ViewModel() {
    // Private mutable LiveData
    private val _name = MutableLiveData<String>()

    // Public immutable LiveData
    val name: LiveData<String> = _name

    fun setName(name: String) {
        _name.value = name  // Must be called on main thread
    }

    fun setNameAsync(name: String) {
        _name.postValue(name)  // Can be called from any thread
    }
}

class MyActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.name.observe(this) { name ->
            // Update UI
            nameTextView.text = name
        }
    }
}
```

### Lifecycle Awareness

LiveData only notifies observers in active states (STARTED or RESUMED):

```kotlin
class LifecycleAwareActivity : AppCompatActivity() {

    private val viewModel: DataViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.data.observe(this) { data ->
            // Only called when Activity is in STARTED or RESUMED state
            Log.d("LiveData", "Received: $data")
            updateUI(data)
        }
    }

    override fun onStart() {
        super.onStart()
        // Observer becomes active here
        // If data was updated while stopped, receive latest now
    }

    override fun onStop() {
        super.onStop()
        // Observer becomes inactive here
        // No updates delivered while stopped
    }
}
```

### Observer Lifecycle States

```
INITIALIZED -> CREATED -> STARTED -> RESUMED
                            |           |
                            +-----------+
                            Active states (receives updates)

DESTROYED <- CREATED <- STARTED <- RESUMED
                |
              Inactive (no updates)
```

## Key Concepts

### MutableLiveData vs LiveData

```kotlin
class UserViewModel : ViewModel() {

    // MutableLiveData - can be modified
    private val _user = MutableLiveData<User>()

    // LiveData - read-only exposure
    val user: LiveData<User> = _user

    // Only ViewModel can modify the value
    fun updateUser(user: User) {
        _user.value = user
    }
}

// In Activity/Fragment
class UserActivity : AppCompatActivity() {

    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Can observe
        viewModel.user.observe(this) { user ->
            displayUser(user)
        }

        // Cannot modify - compile error
        // viewModel.user.value = newUser  // ERROR!
    }
}
```

### setValue vs postValue

```kotlin
class DataViewModel : ViewModel() {

    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data

    // setValue - must be called on main thread
    fun updateOnMainThread(value: String) {
        _data.value = value  // Immediate update
    }

    // postValue - can be called from any thread
    fun updateFromBackground(value: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val result = fetchFromNetwork()
            _data.postValue(result)  // Posts to main thread
        }
    }

    // postValue behavior with multiple calls
    fun multiplePostValues() {
        viewModelScope.launch(Dispatchers.Default) {
            _data.postValue("First")
            _data.postValue("Second")
            _data.postValue("Third")
            // Only "Third" will be delivered!
            // postValue coalesces updates
        }
    }
}
```

### Observing LiveData

```kotlin
class ObservingActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Standard observe with lifecycle owner
        viewModel.data.observe(this) { data ->
            // Lifecycle-aware observation
        }

        // Observe with explicit Observer object
        val observer = Observer<String> { data ->
            textView.text = data
        }
        viewModel.data.observe(this, observer)

        // Remove observer manually if needed
        viewModel.data.removeObserver(observer)

        // Remove all observers for this lifecycle owner
        viewModel.data.removeObservers(this)
    }
}
```

### ObserveForever

For non-lifecycle-aware observation:

```kotlin
class ServiceClass {

    private val observer = Observer<Data> { data ->
        processData(data)
    }

    fun startObserving(liveData: LiveData<Data>) {
        // No lifecycle owner - must manually remove
        liveData.observeForever(observer)
    }

    fun stopObserving(liveData: LiveData<Data>) {
        // MUST remove to prevent memory leaks!
        liveData.removeObserver(observer)
    }
}
```

## Code Examples

### Basic ViewModel with LiveData

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

### LiveData Transformations

```kotlin
class TransformationsViewModel : ViewModel() {

    private val _userId = MutableLiveData<String>()

    // map - transform value
    val userName: LiveData<String> = _userId.map { userId ->
        "User: $userId"
    }

    // switchMap - switch to different LiveData based on value
    val userDetails: LiveData<User> = _userId.switchMap { userId ->
        repository.getUserLiveData(userId)
    }

    fun setUserId(id: String) {
        _userId.value = id
    }
}

// Using Transformations class directly
class ExplicitTransformationsViewModel : ViewModel() {

    private val _searchQuery = MutableLiveData<String>()

    // map transformation
    val formattedQuery: LiveData<String> = Transformations.map(_searchQuery) { query ->
        query.trim().lowercase()
    }

    // switchMap transformation
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

Combine multiple LiveData sources:

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

// More complex example
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

### Custom LiveData

Create custom LiveData that connects to system services:

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
        // Called when there's at least one active observer
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
        // Called when there are no active observers
        locationManager.removeUpdates(locationListener)
    }
}

// Usage
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

### Network Connectivity LiveData

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

        // Set initial value
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

### LiveData with Room Database

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
            // LiveData automatically updates observers
        }
    }
}
```

## Best Practices

### 1. Encapsulate MutableLiveData

```kotlin
// Bad: Exposing MutableLiveData
class BadViewModel : ViewModel() {
    val data = MutableLiveData<String>()  // Anyone can modify!
}

// Good: Expose immutable LiveData
class GoodViewModel : ViewModel() {
    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data

    fun updateData(value: String) {
        _data.value = value
    }
}
```

### 2. Use Transformations Instead of Observing in ViewModel

```kotlin
// Bad: Observing LiveData in ViewModel
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
        // Memory leak potential!
    }
}

// Good: Use switchMap
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

### 3. Handle Null Values

```kotlin
class NullSafeViewModel : ViewModel() {

    private val _data = MutableLiveData<String?>()
    val data: LiveData<String?> = _data

    // Provide non-null version with default
    val nonNullData: LiveData<String> = _data.map { it ?: "Default" }

    // Or use requireValue extension
    fun processData() {
        val value = _data.value ?: return
        // Process value safely
    }
}

// In Activity/Fragment
viewModel.data.observe(this) { data ->
    data?.let { nonNullData ->
        // Safe to use
    }
}
```

### 4. Avoid Heavy Operations in map/switchMap

```kotlin
// Bad: Heavy operation in map
val processedData = rawData.map { data ->
    // This runs on main thread!
    heavyProcessing(data)
}

// Good: Use liveData builder with coroutine
val processedData = rawData.switchMap { data ->
    liveData(Dispatchers.Default) {
        val result = heavyProcessing(data)
        emit(result)
    }
}
```

### 5. Use viewLifecycleOwner in Fragments

```kotlin
// Bad in Fragment
class BadFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.data.observe(this) { data ->  // Uses Fragment lifecycle
            // May receive updates when view is destroyed
        }
    }
}

// Good in Fragment
class GoodFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.data.observe(viewLifecycleOwner) { data ->  // Uses View lifecycle
            // Only receives updates when view exists
        }
    }
}
```

## Common Pitfalls

### 1. Observing in Wrong Lifecycle

```kotlin
// Wrong: Observing in onCreate of Fragment
class BadFragment : Fragment() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.data.observe(this) { }  // Fragment isn't attached to view yet
    }
}

// Correct: Observe in onViewCreated
class GoodFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewModel.data.observe(viewLifecycleOwner) { }
    }
}
```

### 2. Not Handling Initial Null Value

```kotlin
// Problem: Assuming data is never null
class NullProblemActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.user.observe(this) { user ->
            // Crashes if user is null!
            textView.text = user.name
        }
    }
}

// Solution: Handle null
class NullSafeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.user.observe(this) { user ->
            user?.let {
                textView.text = it.name
            } ?: run {
                textView.text = "Loading..."
            }
        }
    }
}
```

### 3. Multiple Observers Creating Duplicates

```kotlin
// Wrong: Creating new observer on each button click
class BadActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        button.setOnClickListener {
            // Creates new observer each time!
            viewModel.data.observe(this) { data ->
                processData(data)
            }
        }
    }
}

// Correct: Observe once
class GoodActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Observe once during lifecycle
        viewModel.data.observe(this) { data ->
            processData(data)
        }

        button.setOnClickListener {
            viewModel.triggerDataLoad()
        }
    }
}
```

### 4. Event Handling with LiveData

```kotlin
// Problem: Events consumed multiple times
class EventProblemViewModel : ViewModel() {
    private val _navigateEvent = MutableLiveData<String>()
    val navigateEvent: LiveData<String> = _navigateEvent

    fun onItemClick(id: String) {
        _navigateEvent.value = id
        // On rotation, observer receives same event again!
    }
}

// Solution 1: Use SingleLiveEvent (wrapper)
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

// Solution 2: Use Event wrapper
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

// Usage
viewModel.navigateEvent.observe(this) { event ->
    event.getContentIfNotHandled()?.let { id ->
        navigate(id)
    }
}
```

### 5. postValue Losing Updates

```kotlin
// Problem: Multiple postValue calls
class PostValueProblem : ViewModel() {
    private val _count = MutableLiveData<Int>()
    val count: LiveData<Int> = _count

    fun increment() {
        viewModelScope.launch(Dispatchers.Default) {
            repeat(100) {
                val current = _count.value ?: 0
                _count.postValue(current + 1)
                // Most updates will be lost!
            }
        }
    }
}

// Solution: Use atomic operations or main dispatcher
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

    // Or use StateFlow instead
    private val _countFlow = MutableStateFlow(0)
    val countFlow: StateFlow<Int> = _countFlow.asStateFlow()

    fun incrementFlow() {
        viewModelScope.launch {
            repeat(100) {
                _countFlow.update { it + 1 }  // Thread-safe
            }
        }
    }
}
```

## Performance Considerations

### 1. Avoid Frequent Updates

```kotlin
class ThrottledViewModel : ViewModel() {

    private val _sensorData = MutableLiveData<SensorData>()
    val sensorData: LiveData<SensorData> = _sensorData

    private var lastUpdateTime = 0L
    private val updateInterval = 100L  // 100ms throttle

    fun onSensorUpdate(data: SensorData) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastUpdateTime >= updateInterval) {
            _sensorData.value = data
            lastUpdateTime = currentTime
        }
    }
}
```

### 2. Use distinctUntilChanged

```kotlin
class DistinctViewModel : ViewModel() {

    private val _searchQuery = MutableLiveData<String>()

    val searchResults: LiveData<List<Result>> = _searchQuery
        .distinctUntilChanged()  // Only emit when value changes
        .switchMap { query ->
            liveData {
                emit(repository.search(query))
            }
        }
}

// Custom distinctUntilChanged extension
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

### 3. Lazy Initialization

```kotlin
class LazyViewModel : ViewModel() {

    // Lazy initialization - only created when first observed
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

## Real-World Scenarios

### Scenario 1: Form Validation

```kotlin
class FormViewModel : ViewModel() {

    val email = MutableLiveData<String>()
    val password = MutableLiveData<String>()

    val emailError: LiveData<String?> = email.map { email ->
        when {
            email.isNullOrBlank() -> "Email is required"
            !email.isValidEmail() -> "Invalid email format"
            else -> null
        }
    }

    val passwordError: LiveData<String?> = password.map { password ->
        when {
            password.isNullOrBlank() -> "Password is required"
            password.length < 8 -> "Password must be at least 8 characters"
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

### Scenario 2: Search with Debounce

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

                delay(300)  // Debounce

                try {
                    val results = repository.search(query)
                    emit(Resource.Success(results))
                } catch (e: Exception) {
                    emit(Resource.Error(e.message ?: "Search failed"))
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

### Scenario 3: Polling Data

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
                    // Handle error
                }
            }
            delay(5000)  // Poll every 5 seconds
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

Modern Android development often uses StateFlow instead of LiveData:

```kotlin
// LiveData approach
class LiveDataViewModel : ViewModel() {
    private val _state = MutableLiveData<UiState>()
    val state: LiveData<UiState> = _state
}

// StateFlow approach
class StateFlowViewModel : ViewModel() {
    private val _state = MutableStateFlow<UiState>(UiState.Initial)
    val state: StateFlow<UiState> = _state.asStateFlow()
}
```

| Feature | LiveData | StateFlow |
|---------|----------|-----------|
| Initial value | Optional | Required |
| Null safety | Nullable | Can be non-null |
| Thread safety | Main thread only for setValue | Any thread |
| Lifecycle awareness | Built-in | Requires repeatOnLifecycle |
| Transformations | map, switchMap | Full Flow operators |
| Testing | Requires InstantTaskExecutorRule | Standard coroutine testing |

## Interview Key Points

1. **What is LiveData?**
   - Observable data holder class
   - Lifecycle-aware - only updates active observers
   - Part of Android Architecture Components
   - Prevents memory leaks and crashes

2. **What's the difference between setValue and postValue?**
   - setValue: Must be called on main thread, immediate update
   - postValue: Can be called from any thread, posts to main thread
   - postValue coalesces multiple calls

3. **What is MediatorLiveData?**
   - LiveData subclass that can observe other LiveData sources
   - Used to combine or transform multiple LiveData
   - Manages multiple source registrations

4. **How does LiveData handle configuration changes?**
   - When paired with ViewModel, data survives configuration changes
   - New Activity/Fragment receives latest value when observing
   - Observers are automatically re-registered

5. **What are LiveData transformations?**
   - map: Transform LiveData value to another type
   - switchMap: Switch to different LiveData based on value
   - Lazy - only computed when observed

6. **How to handle one-time events with LiveData?**
   - Use Event wrapper pattern
   - Use SingleLiveEvent
   - Consider SharedFlow for events

7. **When to use LiveData vs StateFlow?**
   - LiveData: Simple UI state, Java interop
   - StateFlow: Complex transformations, Compose, testing

8. **What are common LiveData pitfalls?**
   - Using Fragment lifecycle instead of viewLifecycleOwner
   - Exposing MutableLiveData
   - Multiple observers on same lifecycle owner
   - Events being re-delivered on rotation

## Further Reading

- [LiveData Overview](https://developer.android.com/topic/libraries/architecture/livedata)
- [LiveData with ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [LiveData Transformations](https://developer.android.com/topic/libraries/architecture/livedata#transform_livedata)
- [StateFlow and SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- [Migrating from LiveData to StateFlow](https://developer.android.com/topic/libraries/architecture/livedata#migrate-stateflow)
- [Android Architecture Components](https://developer.android.com/topic/architecture)
