---
title: Android 生命周期管理
description: Android 生命周期管理完整指南，理解 Activity 和 Fragment 生命周期、生命周期感知组件以及处理配置更改
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
origin: old/src/content/docs/kotlin/android-lifecycle.zh.md
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

理解 Android 生命周期管理是构建健壮 Android 应用程序的基础。生命周期决定了应用组件何时被创建、启动、恢复、暂停、停止和销毁。正确的生命周期管理可以防止内存泄漏、崩溃，并确保流畅的用户体验。

## 概念解释

Android 生命周期是 Activity 或 Fragment 从创建到销毁所经历的一系列状态。每次状态变化都会触发回调方法，允许你执行适当的操作，如初始化资源、保存数据或释放连接。

Android 通过 Jetpack Lifecycle 库引入了生命周期感知组件，使类能够观察生命周期变化而无需直接耦合到 Activity 或 Fragment。这种方法促进了更清晰的架构并减少了样板代码。

### 为什么生命周期管理很重要

糟糕的生命周期管理会导致：
- **内存泄漏**：持有已销毁 Activity 的引用
- **崩溃**：在销毁后更新 UI
- **资源浪费**：在应用不可见时运行后台任务
- **数据丢失**：在配置更改期间未保存状态

## 核心原理

### Activity 生命周期状态

Activity 可以处于四种状态之一：

1. **Created**：Activity 存在但不可见
2. **Started**：Activity 可见但不在前台
3. **Resumed**：Activity 在前台且可交互
4. **Destroyed**：Activity 正在终止

### 生命周期回调

```kotlin
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // 初始化 activity，膨胀布局，恢复状态
        Log.d("Lifecycle", "onCreate 被调用")
    }

    override fun onStart() {
        super.onStart()
        // Activity 变得可见
        Log.d("Lifecycle", "onStart 被调用")
    }

    override fun onResume() {
        super.onResume()
        // Activity 获得焦点，用户可以交互
        Log.d("Lifecycle", "onResume 被调用")
    }

    override fun onPause() {
        super.onPause()
        // Activity 失去焦点但可能仍然可见
        Log.d("Lifecycle", "onPause 被调用")
    }

    override fun onStop() {
        super.onStop()
        // Activity 不再可见
        Log.d("Lifecycle", "onStop 被调用")
    }

    override fun onDestroy() {
        super.onDestroy()
        // Activity 正在被销毁
        Log.d("Lifecycle", "onDestroy 被调用")
    }

    override fun onRestart() {
        super.onRestart()
        // Activity 从停止状态重新启动
        Log.d("Lifecycle", "onRestart 被调用")
    }
}
```

### Fragment 生命周期

Fragment 有额外的生命周期回调：

```kotlin
class MyFragment : Fragment() {

    override fun onAttach(context: Context) {
        super.onAttach(context)
        // Fragment 附加到 Activity
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 初始化 fragment（非 UI）
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // 创建并返回 fragment 的视图层次结构
        return inflater.inflate(R.layout.fragment_my, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // 视图已创建，设置 UI 组件
    }

    override fun onStart() {
        super.onStart()
        // Fragment 变得可见
    }

    override fun onResume() {
        super.onResume()
        // Fragment 获得焦点
    }

    override fun onPause() {
        super.onPause()
        // Fragment 失去焦点
    }

    override fun onStop() {
        super.onStop()
        // Fragment 不再可见
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // 视图正在被销毁，清理视图引用
    }

    override fun onDestroy() {
        super.onDestroy()
        // Fragment 正在被销毁
    }

    override fun onDetach() {
        super.onDetach()
        // Fragment 从 Activity 分离
    }
}
```

## 关键概念

### LifecycleOwner

`LifecycleOwner` 是一个接口，表示类具有生命周期。Activity 和 Fragment 实现了这个接口。

```kotlin
interface LifecycleOwner {
    val lifecycle: Lifecycle
}
```

### LifecycleObserver

需要响应生命周期事件的类实现 `LifecycleObserver` 或使用 `DefaultLifecycleObserver`：

```kotlin
class MyLifecycleObserver : DefaultLifecycleObserver {

    override fun onCreate(owner: LifecycleOwner) {
        // 响应 onCreate
    }

    override fun onStart(owner: LifecycleOwner) {
        // 响应 onStart
    }

    override fun onResume(owner: LifecycleOwner) {
        // 响应 onResume
    }

    override fun onPause(owner: LifecycleOwner) {
        // 响应 onPause
    }

    override fun onStop(owner: LifecycleOwner) {
        // 响应 onStop
    }

    override fun onDestroy(owner: LifecycleOwner) {
        // 响应 onDestroy
    }
}

// 注册观察者
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(MyLifecycleObserver())
    }
}
```

### 生命周期状态和事件

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

### 检查当前状态

```kotlin
class MyFragment : Fragment() {

    fun updateUI() {
        // 仅在 fragment 至少处于 STARTED 状态时更新
        if (lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) {
            // 安全更新 UI
            textView.text = "已更新"
        }
    }
}
```

## 代码示例

### 带生命周期感知的位置跟踪

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

// 在 Activity 中使用
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
        // 用新位置更新地图
    }
}
```

### 网络连接观察者

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

### 生命周期感知协程作用域

```kotlin
class MyActivity : AppCompatActivity() {

    // lifecycleScope 已由 AndroidX 提供

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 在 CREATED 时启动，在 DESTROYED 时取消
        lifecycleScope.launch {
            loadData()
        }

        // 在 STARTED 时启动，在 STOPPED 时取消
        lifecycleScope.launchWhenStarted {
            observeNetworkState()
        }

        // 在 RESUMED 时启动，在 PAUSED 时取消
        lifecycleScope.launchWhenResumed {
            animateUI()
        }

        // 使用 repeatOnLifecycle 的现代方法
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // 安全地收集 flows
                viewModel.uiState.collect { state ->
                    updateUI(state)
                }
            }
        }
    }
}
```

### Fragment 视图生命周期

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
            // 处理点击
        }
    }

    private fun observeData() {
        // 对与视图相关的观察使用 viewLifecycleOwner
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
        // 关键：清除绑定以防止内存泄漏
        _binding = null
    }
}
```

### 保存和恢复状态

```kotlin
class MainActivity : AppCompatActivity() {

    private var counter = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 恢复状态
        savedInstanceState?.let {
            counter = it.getInt("counter", 0)
        }

        updateCounterDisplay()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        // 在销毁前保存状态
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

### 带 SavedStateHandle 的 ViewModel

```kotlin
class MyViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // 自动保存和恢复
    var searchQuery: String?
        get() = savedStateHandle["query"]
        set(value) { savedStateHandle["query"] = value }

    // 由 SavedStateHandle 支持的 StateFlow
    val counter: StateFlow<Int> = savedStateHandle.getStateFlow("counter", 0)

    fun incrementCounter() {
        savedStateHandle["counter"] = (savedStateHandle.get<Int>("counter") ?: 0) + 1
    }
}
```

## 最佳实践

### 1. 使用生命周期感知组件

```kotlin
// 不要手动处理生命周期
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

// 使用生命周期感知组件
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

### 2. 在 Fragment 中使用 viewLifecycleOwner

```kotlin
class MyFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // 错误：使用 Fragment 生命周期
        lifecycleScope.launch {
            viewModel.data.collect { updateUI(it) }
        }

        // 正确：使用 View 生命周期
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.data.collect { updateUI(it) }
            }
        }
    }
}
```

### 3. 处理配置更改

```kotlin
class ConfigurationAwareActivity : AppCompatActivity() {

    // ViewModel 在配置更改后存活
    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 数据在旋转后存活
        viewModel.loadDataIfNeeded()
    }
}

// 在 manifest 中声明手动处理
// android:configChanges="orientation|screenSize"
class ManualConfigActivity : AppCompatActivity() {

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)

        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            // 处理横屏
        } else {
            // 处理竖屏
        }
    }
}
```

### 4. 在 onDestroy 中清理资源

```kotlin
class ResourceActivity : AppCompatActivity() {

    private var mediaPlayer: MediaPlayer? = null
    private var broadcastReceiver: BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        mediaPlayer = MediaPlayer.create(this, R.raw.audio)

        broadcastReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                // 处理广播
            }
        }
        registerReceiver(broadcastReceiver, IntentFilter("MY_ACTION"))
    }

    override fun onDestroy() {
        super.onDestroy()

        // 释放媒体播放器
        mediaPlayer?.release()
        mediaPlayer = null

        // 注销广播接收器
        broadcastReceiver?.let {
            unregisterReceiver(it)
        }
    }
}
```

### 5. 使用 repeatOnLifecycle 收集 Flow

```kotlin
class ModernActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // 这个代码块在 STARTED 时运行，在 STOPPED 时取消
                // 再次 STARTED 时重新启动

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

## 常见陷阱

### 1. 内部类导致的内存泄漏

```kotlin
// 错误：匿名内部类持有 Activity 引用
class LeakyActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Handler(Looper.getMainLooper()).postDelayed({
            // 这持有 Activity 的引用
            updateUI()
        }, 10000)
    }
}

// 正确：使用 WeakReference 或生命周期感知方法
class SafeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            delay(10000)
            // Activity 销毁时自动取消
            updateUI()
        }
    }
}
```

### 2. 销毁后更新 UI

```kotlin
// 错误：可能因 IllegalStateException 崩溃
class CrashyActivity : AppCompatActivity() {

    fun loadData() {
        thread {
            val data = api.fetchData() // 需要时间
            runOnUiThread {
                // 此时 Activity 可能已被销毁！
                textView.text = data
            }
        }
    }
}

// 正确：检查生命周期状态
class SafeActivity : AppCompatActivity() {

    fun loadData() {
        lifecycleScope.launch {
            val data = withContext(Dispatchers.IO) {
                api.fetchData()
            }
            // 仅在 Activity 仍然活跃时执行
            textView.text = data
        }
    }
}
```

### 3. Fragment 视图绑定泄漏

```kotlin
// 错误：绑定引用未清除
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
    // 缺少 onDestroyView - 绑定泄漏！
}

// 正确：在 onDestroyView 中清除绑定
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

### 4. Fragment 中使用错误的 LifecycleOwner

```kotlin
// 错误：对 UI 观察使用 Fragment 生命周期
class BadFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // 这在视图销毁后继续
        viewModel.data.observe(this) { data ->
            // 可能崩溃：view 可能为 null
            binding.textView.text = data
        }
    }
}

// 正确：使用 viewLifecycleOwner
class GoodFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel.data.observe(viewLifecycleOwner) { data ->
            binding.textView.text = data
        }
    }
}
```

### 5. 未处理进程死亡

```kotlin
// 错误：进程死亡时数据丢失
class DataLossActivity : AppCompatActivity() {
    private var importantData: String = ""

    fun setData(data: String) {
        importantData = data
    }
}

// 正确：使用 SavedStateHandle 或 onSaveInstanceState
class DataSafeActivity : AppCompatActivity() {

    private val viewModel: MyViewModel by viewModels()

    // 带 SavedStateHandle 的 ViewModel 在进程死亡后存活
}

class MyViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    var importantData: String
        get() = savedStateHandle["data"] ?: ""
        set(value) { savedStateHandle["data"] = value }
}
```

## 性能考虑

### 1. 避免在生命周期回调中进行繁重操作

```kotlin
class OptimizedActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 不要在这里做繁重的工作
        // 移到后台线程
        lifecycleScope.launch {
            val data = withContext(Dispatchers.IO) {
                loadHeavyData()
            }
            setupUI(data)
        }
    }

    override fun onResume() {
        super.onResume()
        // 保持快速 - 用户在等待
    }
}
```

### 2. 延迟非关键初始化

```kotlin
class DeferredInitActivity : AppCompatActivity() {

    private val heavyComponent by lazy {
        // 仅在首次访问时创建
        HeavyComponent()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 使用 window.decorView 延迟工作
        window.decorView.post {
            // 在视图绘制后运行
            initializeNonCriticalComponents()
        }
    }
}
```

### 3. 使用 ProcessLifecycleOwner 获取应用级生命周期

```kotlin
class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        ProcessLifecycleOwner.get().lifecycle.addObserver(
            object : DefaultLifecycleObserver {
                override fun onStart(owner: LifecycleOwner) {
                    // 应用进入前台
                    Analytics.logAppForeground()
                }

                override fun onStop(owner: LifecycleOwner) {
                    // 应用进入后台
                    Analytics.logAppBackground()
                }
            }
        )
    }
}
```

## 实际场景

### 场景 1：音乐播放器服务

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

### 场景 2：相机预览

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
                Log.e("Camera", "绑定失败", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }
}
```

### 场景 3：实时数据同步

```kotlin
class SyncActivity : AppCompatActivity() {

    private val viewModel: SyncViewModel by viewModels()
    private var syncJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sync)

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // 可见时同步运行，不可见时暂停
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
            delay(5000) // 每 5 秒轮询一次
        }
    }.flowOn(Dispatchers.IO)
}
```

## 面试要点

1. **按顺序描述 Activity 生命周期回调**
   - onCreate -> onStart -> onResume -> onPause -> onStop -> onDestroy
   - onRestart 在从停止状态返回时调用

2. **onPause 和 onStop 有什么区别？**
   - onPause：Activity 失去焦点但可能仍然可见（多窗口模式）
   - onStop：Activity 完全隐藏

3. **Fragment 生命周期与 Activity 有何不同？**
   - 额外的回调：onAttach、onCreateView、onViewCreated、onDestroyView、onDetach
   - Fragment 的视图可以被销毁而 Fragment 实例存活

4. **什么是 LifecycleOwner？**
   - 表示类具有 Android 生命周期的接口
   - Activity 和 Fragment 实现它
   - 启用生命周期感知组件

5. **如何处理配置更改？**
   - ViewModel：数据在配置更改后存活
   - SavedStateHandle：在进程死亡后存活
   - onSaveInstanceState：用于临时 UI 状态

6. **为什么在 Fragment 中使用 viewLifecycleOwner？**
   - Fragment 视图可以在 Fragment 存活时被销毁
   - 防止内存泄漏和崩溃
   - UI 观察应使用视图生命周期

7. **什么是 repeatOnLifecycle？**
   - 基于生命周期状态安全地收集 flows
   - 在低于指定状态时取消收集
   - 再次达到状态时重新启动

8. **如何防止生命周期回调中的内存泄漏？**
   - 使用生命周期感知组件
   - 在 onDestroy/onDestroyView 中清除引用
   - 对长时间运行的回调使用 WeakReference
   - 使用适当的作用域取消协程

## 进一步阅读

- [Android 生命周期文档](https://developer.android.com/topic/libraries/architecture/lifecycle)
- [使用生命周期感知组件处理生命周期](https://developer.android.com/guide/components/activities/activity-lifecycle)
- [Fragment 生命周期](https://developer.android.com/guide/fragments/lifecycle)
- [repeatOnLifecycle API 设计故事](https://medium.com/androiddevelopers/repeatonlifecycle-api-design-story-8670d1a7d333)
- [生命周期感知协程作用域](https://developer.android.com/topic/libraries/architecture/coroutines)
