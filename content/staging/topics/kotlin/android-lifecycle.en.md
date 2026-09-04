---
title: Android Lifecycle Management
description: Complete guide to Android lifecycle management, understanding Activity and Fragment lifecycles, lifecycle-aware components, and handling configuration changes
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - Lifecycle
  - Activity
  - Fragment
  - LifecycleOwner
status: imported
origin: old/src/content/docs/kotlin/android-lifecycle.en.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 20
  lastUpdated: 2026-01-21
---

Understanding Android lifecycle management is fundamental to building robust Android applications. The lifecycle determines when your app components are created, started, resumed, paused, stopped, and destroyed. Proper lifecycle management prevents memory leaks, crashes, and ensures a smooth user experience.

## Concept Explanation

The Android lifecycle is a series of states that an Activity or Fragment goes through from creation to destruction. Each state change triggers callback methods that allow you to perform appropriate actions, such as initializing resources, saving data, or releasing connections.

Android introduced lifecycle-aware components through the Jetpack Lifecycle library, which enables classes to observe lifecycle changes without direct coupling to Activities or Fragments. This approach promotes cleaner architecture and reduces boilerplate code.

### Why Lifecycle Management Matters

Poor lifecycle management leads to:
- **Memory leaks**: Holding references to destroyed Activities
- **Crashes**: Updating UI after destruction
- **Resource waste**: Running background tasks when app is not visible
- **Data loss**: Not saving state during configuration changes

## Core Principles

### Activity Lifecycle States

An Activity can be in one of four states:

1. **Created**: Activity exists but is not visible
2. **Started**: Activity is visible but not in foreground
3. **Resumed**: Activity is in foreground and interactive
4. **Destroyed**: Activity is being terminated

### Lifecycle Callbacks

```kotlin
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // Initialize activity, inflate layout, restore state
        Log.d("Lifecycle", "onCreate called")
    }

    override fun onStart() {
        super.onStart()
        // Activity becomes visible
        Log.d("Lifecycle", "onStart called")
    }

    override fun onResume() {
        super.onResume()
        // Activity gains focus, user can interact
        Log.d("Lifecycle", "onResume called")
    }

    override fun onPause() {
        super.onPause()
        // Activity loses focus but may still be visible
        Log.d("Lifecycle", "onPause called")
    }

    override fun onStop() {
        super.onStop()
        // Activity is no longer visible
        Log.d("Lifecycle", "onStop called")
    }

    override fun onDestroy() {
        super.onDestroy()
        // Activity is being destroyed
        Log.d("Lifecycle", "onDestroy called")
    }

    override fun onRestart() {
        super.onRestart()
        // Activity is restarting after being stopped
        Log.d("Lifecycle", "onRestart called")
    }
}
```

### Fragment Lifecycle

Fragments have additional lifecycle callbacks:

```kotlin
class MyFragment : Fragment() {

    override fun onAttach(context: Context) {
        super.onAttach(context)
        // Fragment is attached to Activity
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Initialize fragment (non-UI)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Create and return fragment's view hierarchy
        return inflater.inflate(R.layout.fragment_my, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // View is created, set up UI components
    }

    override fun onStart() {
        super.onStart()
        // Fragment becomes visible
    }

    override fun onResume() {
        super.onResume()
        // Fragment gains focus
    }

    override fun onPause() {
        super.onPause()
        // Fragment loses focus
    }

    override fun onStop() {
        super.onStop()
        // Fragment is no longer visible
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // View is being destroyed, clean up view references
    }

    override fun onDestroy() {
        super.onDestroy()
        // Fragment is being destroyed
    }

    override fun onDetach() {
        super.onDetach()
        // Fragment is detached from Activity
    }
}
```

## Key Concepts

### LifecycleOwner

`LifecycleOwner` is an interface that indicates a class has a lifecycle. Activities and Fragments implement this interface.

```kotlin
interface LifecycleOwner {
    val lifecycle: Lifecycle
}
```

### LifecycleObserver

Classes that need to respond to lifecycle events implement `LifecycleObserver` or use `DefaultLifecycleObserver`:

```kotlin
class MyLifecycleObserver : DefaultLifecycleObserver {

    override fun onCreate(owner: LifecycleOwner) {
        // Respond to onCreate
    }

    override fun onStart(owner: LifecycleOwner) {
        // Respond to onStart
    }

    override fun onResume(owner: LifecycleOwner) {
        // Respond to onResume
    }

    override fun onPause(owner: LifecycleOwner) {
        // Respond to onPause
    }

    override fun onStop(owner: LifecycleOwner) {
        // Respond to onStop
    }

    override fun onDestroy(owner: LifecycleOwner) {
        // Respond to onDestroy
    }
}

// Register observer
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(MyLifecycleObserver())
    }
}
```

### Lifecycle States and Events

```kotlin
enum class Lifecycle.State {
    DESTROYED,
    INITIALIZED,
    CREATED,
    STARTED,
    RESUMED
}

enum class Lifecycle.Event {
    ON_CREATE,
    ON_START,
    ON_RESUME,
    ON_PAUSE,
    ON_STOP,
    ON_DESTROY,
    ON_ANY
}
```

### Checking Current State

```kotlin
class MyFragment : Fragment() {

    fun updateUI() {
        // Only update if fragment is at least STARTED
        if (lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) {
            // Safe to update UI
            textView.text = "Updated"
        }
    }
}
```

## Code Examples

### Location Tracking with Lifecycle Awareness

```kotlin
class LocationManager(
    private val context: Context,
    private val lifecycle: Lifecycle,
    private val callback: (Location) -> Unit
) : DefaultLifecycleObserver {

    private var fusedLocationClient: FusedLocationProviderClient? = null
    private var locationCallback: LocationCallback? = null

    init {
        lifecycle.addObserver(this)
    }

    override fun onStart(owner: LifecycleOwner) {
        startLocationUpdates()
    }

    override fun onStop(owner: LifecycleOwner) {
        stopLocationUpdates()
    }

    override fun onDestroy(owner: LifecycleOwner) {
        lifecycle.removeObserver(this)
    }

    private fun startLocationUpdates() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            10000L
        ).build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { callback(it) }
            }
        }

        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            fusedLocationClient?.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
        }
    }

    private fun stopLocationUpdates() {
        locationCallback?.let {
            fusedLocationClient?.removeLocationUpdates(it)
        }
    }
}

// Usage in Activity
class MapActivity : AppCompatActivity() {

    private lateinit var locationManager: LocationManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)

        locationManager = LocationManager(this, lifecycle) { location ->
            updateMap(location)
        }
    }

    private fun updateMap(location: Location) {
        // Update map with new location
    }
}
```

### Network Connection Observer

```kotlin
class NetworkConnectionObserver(
    private val context: Context,
    private val lifecycle: Lifecycle
) : DefaultLifecycleObserver {

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    init {
        lifecycle.addObserver(this)
    }

    override fun onStart(owner: LifecycleOwner) {
        registerNetworkCallback()
    }

    override fun onStop(owner: LifecycleOwner) {
        unregisterNetworkCallback()
    }

    private fun registerNetworkCallback() {
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _isConnected.value = true
            }

            override fun onLost(network: Network) {
                _isConnected.value = false
            }
        }

        connectivityManager.registerNetworkCallback(networkRequest, networkCallback!!)
    }

    private fun unregisterNetworkCallback() {
        networkCallback?.let {
            connectivityManager.unregisterNetworkCallback(it)
        }
    }
}
```

### Lifecycle-Aware Coroutine Scope

```kotlin
class MyActivity : AppCompatActivity() {

    // lifecycleScope is already provided by AndroidX

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Launched in CREATED, cancelled in DESTROYED
        lifecycleScope.launch {
            loadData()
        }

        // Launched in STARTED, cancelled in STOPPED
        lifecycleScope.launchWhenStarted {
            observeNetworkState()
        }

        // Launched in RESUMED, cancelled in PAUSED
        lifecycleScope.launchWhenResumed {
            animateUI()
        }

        // Modern approach with repeatOnLifecycle
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // Collect flows safely
                viewModel.uiState.collect { state ->
                    updateUI(state)
                }
            }
        }
    }
}
```

### Fragment View Lifecycle

```kotlin
class MyFragment : Fragment(R.layout.fragment_my) {

    private var _binding: FragmentMyBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentMyBinding.bind(view)

        setupUI()
        observeData()
    }

    private fun setupUI() {
        binding.button.setOnClickListener {
            // Handle click
        }
    }

    private fun observeData() {
        // Use viewLifecycleOwner for view-related observations
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.data.collect { data ->
                    binding.textView.text = data
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Critical: Clear binding to prevent memory leaks
        _binding = null
    }
}
```

### Saving and Restoring State

```kotlin
class MainActivity : AppCompatActivity() {

    private var counter = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Restore state
        savedInstanceState?.let {
            counter = it.getInt("counter", 0)
        }

        updateCounterDisplay()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        // Save state before destruction
        outState.putInt("counter", counter)
    }

    private fun incrementCounter() {
        counter++
        updateCounterDisplay()
    }

    private fun updateCounterDisplay() {
        findViewById<TextView>(R.id.counterText).text = counter.toString()
    }
}
```

### ViewModel with SavedStateHandle

```kotlin
class MyViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // Automatically saved and restored
    var searchQuery: String?
        get() = savedStateHandle["query"]
        set(value) { savedStateHandle["query"] = value }

    // StateFlow backed by SavedStateHandle
    val counter: StateFlow<Int> = savedStateHandle.getStateFlow("counter", 0)

    fun incrementCounter() {
        savedStateHandle["counter"] = (savedStateHandle.get<Int>("counter") ?: 0) + 1
    }
}
```

## Best Practices

### 1. Use Lifecycle-Aware Components

```kotlin
// Instead of manual lifecycle handling
class BadExample : AppCompatActivity() {
    private var timer: Timer? = null

    override fun onResume() {
        super.onResume()
        timer = Timer().apply {
            schedule(timerTask { updateUI() }, 0, 1000)
        }
    }

    override fun onPause() {
        super.onPause()
        timer?.cancel()
        timer = null
    }
}

// Use lifecycle-aware components
class GoodExample : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(LifecycleTimer { updateUI() })
    }
}

class LifecycleTimer(
    private val onTick: () -> Unit
) : DefaultLifecycleObserver {
    private var timer: Timer? = null

    override fun onResume(owner: LifecycleOwner) {
        timer = Timer().apply {
            schedule(timerTask { onTick() }, 0, 1000)
        }
    }

    override fun onPause(owner: LifecycleOwner) {
        timer?.cancel()
        timer = null
    }
}
```

### 2. Use viewLifecycleOwner in Fragments

```kotlin
class MyFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Wrong: Uses Fragment lifecycle
        lifecycleScope.launch {
            viewModel.data.collect { updateUI(it) }
        }

        // Correct: Uses View lifecycle
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.data.collect { updateUI(it) }
            }
        }
    }
}
```

### 3. Handle Configuration Changes

```kotlin
class ConfigurationAwareActivity : AppCompatActivity() {

    // ViewModel survives configuration changes
    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Data survives rotation
        viewModel.loadDataIfNeeded()
    }
}

// Declare in manifest for manual handling
// android:configChanges="orientation|screenSize"
class ManualConfigActivity : AppCompatActivity() {

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)

        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            // Handle landscape
        } else {
            // Handle portrait
        }
    }
}
```

### 4. Clean Up Resources in onDestroy

```kotlin
class ResourceActivity : AppCompatActivity() {

    private var mediaPlayer: MediaPlayer? = null
    private var broadcastReceiver: BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        mediaPlayer = MediaPlayer.create(this, R.raw.audio)

        broadcastReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                // Handle broadcast
            }
        }
        registerReceiver(broadcastReceiver, IntentFilter("MY_ACTION"))
    }

    override fun onDestroy() {
        super.onDestroy()

        // Release media player
        mediaPlayer?.release()
        mediaPlayer = null

        // Unregister broadcast receiver
        broadcastReceiver?.let {
            unregisterReceiver(it)
        }
    }
}
```

### 5. Use repeatOnLifecycle for Flow Collection

```kotlin
class ModernActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // This block runs when STARTED, cancels when STOPPED
                // Restarts when STARTED again

                launch {
                    viewModel.uiState.collect { state ->
                        renderState(state)
                    }
                }

                launch {
                    viewModel.events.collect { event ->
                        handleEvent(event)
                    }
                }
            }
        }
    }
}
```

## Common Pitfalls

### 1. Memory Leaks from Inner Classes

```kotlin
// Wrong: Anonymous inner class holds Activity reference
class LeakyActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Handler(Looper.getMainLooper()).postDelayed({
            // This holds reference to Activity
            updateUI()
        }, 10000)
    }
}

// Correct: Use WeakReference or lifecycle-aware approach
class SafeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            delay(10000)
            // Automatically cancelled when Activity is destroyed
            updateUI()
        }
    }
}
```

### 2. Updating UI After Destruction

```kotlin
// Wrong: May crash with IllegalStateException
class CrashyActivity : AppCompatActivity() {

    fun loadData() {
        thread {
            val data = api.fetchData() // Takes time
            runOnUiThread {
                // Activity might be destroyed by now!
                textView.text = data
            }
        }
    }
}

// Correct: Check lifecycle state
class SafeActivity : AppCompatActivity() {

    fun loadData() {
        lifecycleScope.launch {
            val data = withContext(Dispatchers.IO) {
                api.fetchData()
            }
            // Only executes if Activity is still active
            textView.text = data
        }
    }
}
```

### 3. Fragment View Binding Leaks

```kotlin
// Wrong: Binding reference not cleared
class LeakyFragment : Fragment() {
    private var binding: FragmentBinding? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentBinding.inflate(inflater, container, false)
        return binding!!.root
    }
    // Missing onDestroyView - binding leaks!
}

// Correct: Clear binding in onDestroyView
class SafeFragment : Fragment() {
    private var _binding: FragmentBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
```

### 4. Wrong Lifecycle Owner in Fragments

```kotlin
// Wrong: Using Fragment lifecycle for UI observation
class BadFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // This continues even when view is destroyed
        viewModel.data.observe(this) { data ->
            // May crash: view might be null
            binding.textView.text = data
        }
    }
}

// Correct: Using viewLifecycleOwner
class GoodFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel.data.observe(viewLifecycleOwner) { data ->
            binding.textView.text = data
        }
    }
}
```

### 5. Not Handling Process Death

```kotlin
// Wrong: Data lost on process death
class DataLossActivity : AppCompatActivity() {
    private var importantData: String = ""

    fun setData(data: String) {
        importantData = data
    }
}

// Correct: Use SavedStateHandle or onSaveInstanceState
class DataSafeActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    // ViewModel with SavedStateHandle survives process death
}

class MyViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    var importantData: String
        get() = savedStateHandle["data"] ?: ""
        set(value) { savedStateHandle["data"] = value }
}
```

## Performance Considerations

### 1. Avoid Heavy Operations in Lifecycle Callbacks

```kotlin
class OptimizedActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Don't do heavy work here
        // Move to background thread
        lifecycleScope.launch {
            val data = withContext(Dispatchers.IO) {
                loadHeavyData()
            }
            setupUI(data)
        }
    }

    override fun onResume() {
        super.onResume()
        // Keep this fast - user is waiting
    }
}
```

### 2. Defer Non-Critical Initialization

```kotlin
class DeferredInitActivity : AppCompatActivity() {

    private val heavyComponent by lazy {
        // Only created when first accessed
        HeavyComponent()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Use window.decorView to defer work
        window.decorView.post {
            // Runs after view is drawn
            initializeNonCriticalComponents()
        }
    }
}
```

### 3. Use ProcessLifecycleOwner for App-Level Lifecycle

```kotlin
class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        ProcessLifecycleOwner.get().lifecycle.addObserver(
            object : DefaultLifecycleObserver {
                override fun onStart(owner: LifecycleOwner) {
                    // App came to foreground
                    Analytics.logAppForeground()
                }

                override fun onStop(owner: LifecycleOwner) {
                    // App went to background
                    Analytics.logAppBackground()
                }
            }
        )
    }
}
```

## Real-World Scenarios

### Scenario 1: Music Player Service

```kotlin
class MusicPlayerActivity : AppCompatActivity() {

    private var musicService: MusicService? = null
    private var bound = false

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as MusicService.MusicBinder
            musicService = binder.getService()
            bound = true
            updatePlaybackUI()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            musicService = null
            bound = false
        }
    }

    override fun onStart() {
        super.onStart()
        Intent(this, MusicService::class.java).also { intent ->
            bindService(intent, connection, Context.BIND_AUTO_CREATE)
        }
    }

    override fun onStop() {
        super.onStop()
        if (bound) {
            unbindService(connection)
            bound = false
        }
    }
}
```

### Scenario 2: Camera Preview

```kotlin
class CameraActivity : AppCompatActivity() {

    private lateinit var cameraProviderFuture: ListenableFuture<ProcessCameraProvider>
    private var camera: Camera? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)

        cameraProviderFuture = ProcessCameraProvider.getInstance(this)
    }

    override fun onResume() {
        super.onResume()
        startCamera()
    }

    private fun startCamera() {
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this, // LifecycleOwner
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview
                )
            } catch (e: Exception) {
                Log.e("Camera", "Binding failed", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }
}
```

### Scenario 3: Real-Time Data Synchronization

```kotlin
class SyncActivity : AppCompatActivity() {

    private val viewModel: SyncViewModel by viewModels()
    private var syncJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sync)

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // Sync runs when visible, pauses when not
                viewModel.startRealTimeSync().collect { data ->
                    updateUI(data)
                }
            }
        }
    }
}

class SyncViewModel : ViewModel() {

    fun startRealTimeSync(): Flow<SyncData> = flow {
        while (true) {
            val data = repository.fetchLatest()
            emit(data)
            delay(5000) // Poll every 5 seconds
        }
    }.flowOn(Dispatchers.IO)
}
```

## Interview Key Points

1. **Describe the Activity lifecycle callbacks in order**
   - onCreate -> onStart -> onResume -> onPause -> onStop -> onDestroy
   - onRestart is called when returning from stopped state

2. **What is the difference between onPause and onStop?**
   - onPause: Activity loses focus but may still be visible (multi-window mode)
   - onStop: Activity is completely hidden

3. **How does Fragment lifecycle differ from Activity?**
   - Additional callbacks: onAttach, onCreateView, onViewCreated, onDestroyView, onDetach
   - Fragment can have its view destroyed while Fragment instance survives

4. **What is LifecycleOwner?**
   - Interface indicating class has Android lifecycle
   - Activities and Fragments implement it
   - Enables lifecycle-aware components

5. **How to handle configuration changes?**
   - ViewModel: Data survives configuration changes
   - SavedStateHandle: Survives process death
   - onSaveInstanceState: For transient UI state

6. **Why use viewLifecycleOwner in Fragments?**
   - Fragment view can be destroyed while Fragment lives
   - Prevents memory leaks and crashes
   - UI observations should use view lifecycle

7. **What is repeatOnLifecycle?**
   - Safely collects flows based on lifecycle state
   - Cancels collection when below specified state
   - Restarts when state is reached again

8. **How to prevent memory leaks in lifecycle callbacks?**
   - Use lifecycle-aware components
   - Clear references in onDestroy/onDestroyView
   - Use WeakReference for long-running callbacks
   - Cancel coroutines with appropriate scope

## Further Reading

- [Android Lifecycle Documentation](https://developer.android.com/topic/libraries/architecture/lifecycle)
- [Handling Lifecycles with Lifecycle-Aware Components](https://developer.android.com/guide/components/activities/activity-lifecycle)
- [Fragment Lifecycle](https://developer.android.com/guide/fragments/lifecycle)
- [repeatOnLifecycle API Design Story](https://medium.com/androiddevelopers/repeatonlifecycle-api-design-story-8670d1a7d333)
- [Lifecycle-aware Coroutine Scopes](https://developer.android.com/topic/libraries/architecture/coroutines)
