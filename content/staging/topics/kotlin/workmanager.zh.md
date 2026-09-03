---
title: WorkManager 后台任务
description: Android WorkManager 完全指南：可靠的后台工作处理，包括约束、链式调用、周期性工作和边界情况处理
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - WorkManager
  - 后台任务
  - Jetpack
  - 任务调度
status: imported
origin: old/src/content/docs/kotlin/workmanager.zh.md
divergence: 0.226
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 22
  lastUpdated: 2026-01-22
---

WorkManager 是 Android 中持久化、可延迟后台工作的推荐解决方案。它提供一致的 API，在不同 Android 版本上工作，自动处理向后兼容性、电池优化和系统约束。

## 概念解释

WorkManager 专为即使应用退出或设备重启后仍需可靠运行的工作而设计。它不适用于即时工作或用户离开应用时可以取消的工作——这些应使用协程或线程。

WorkManager 的关键特性：
- **保证执行**：即使应用重启或设备重启后也会运行
- **约束感知**：可以等待特定条件（网络、充电等）
- **电池高效**：遵守 Doze 模式和应用待机
- **向后兼容**：在 API 14+ 上以一致的行为工作

```kotlin
// 简单示例：网络可用时运行的上传工作
val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    )
    .build()

WorkManager.getInstance(context).enqueue(uploadWorkRequest)
```

## 核心原理

### 何时使用 WorkManager

| 用例 | 解决方案 |
|------|----------|
| 必须完成，即使应用关闭 | WorkManager |
| 用户发起，即时工作 | 协程 |
| 需要精确时间 | AlarmManager |
| 长时间运行的前台工作 | 前台服务 |
| 实时消息 | Firebase Cloud Messaging |

### WorkManager 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkManager API                           │
├─────────────────────────────────────────────────────────────┤
│  WorkRequest                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  一次性工作      │  │  周期性工作     │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  内部调度器（依赖 API 版本）                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ JobScheduler │ │   闹钟 +     │ │   Firebase   │         │
│  │  (API 23+)   │ │  广播接收器   │ │ JobDispatcher│         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  WorkManager 数据库（Room）                                  │
│  - 工作规格、约束、状态                                       │
└─────────────────────────────────────────────────────────────┘
```

## 关键概念

### 设置依赖

```kotlin
// build.gradle.kts (app 模块)
dependencies {
    val workVersion = "2.9.0"

    // Kotlin + 协程
    implementation("androidx.work:work-runtime-ktx:$workVersion")

    // 可选 - 多进程支持
    implementation("androidx.work:work-multiprocess:$workVersion")

    // 测试
    androidTestImplementation("androidx.work:work-testing:$workVersion")
}
```

### 创建 Worker

```kotlin
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf

class UploadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val imageUri = inputData.getString("image_uri")
            ?: return Result.failure()

        return try {
            // 执行上传
            val uploadUrl = uploadImage(imageUri)

            // 返回成功和输出数据
            Result.success(workDataOf("upload_url" to uploadUrl))
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                // 使用指数退避重试
                Result.retry()
            } else {
                Result.failure(workDataOf("error" to e.message))
            }
        }
    }

    private suspend fun uploadImage(uri: String): String {
        // 实际上传逻辑
        return "https://example.com/uploaded-image.jpg"
    }
}

// 替代方案：Worker（阻塞式，用于 Java 互操作）
class BlockingUploadWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    override fun doWork(): Result {
        // 这在 WorkManager 的后台线程上运行
        return try {
            performUpload()
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private fun performUpload() {
        // 阻塞式上传逻辑
    }
}
```

### 工作请求

```kotlin
import androidx.work.*
import java.util.concurrent.TimeUnit

// 一次性工作
val oneTimeRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workDataOf("image_uri" to "content://..."))
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.UNMETERED)
            .setRequiresBatteryNotLow(true)
            .build()
    )
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        WorkRequest.MIN_BACKOFF_MILLIS,
        TimeUnit.MILLISECONDS
    )
    .addTag("upload")
    .build()

// 周期性工作（最小 15 分钟间隔）
val periodicRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 1,
    repeatIntervalTimeUnit = TimeUnit.HOURS,
    flexTimeInterval = 15,
    flexTimeIntervalUnit = TimeUnit.MINUTES
)
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    )
    .build()

// 加急工作（用于紧急的用户发起工作）
val expeditedRequest = OneTimeWorkRequestBuilder<CriticalWorker>()
    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    .build()
```

### 约束

```kotlin
val constraints = Constraints.Builder()
    // 网络要求
    .setRequiredNetworkType(NetworkType.CONNECTED)      // 任何网络
    .setRequiredNetworkType(NetworkType.UNMETERED)      // 仅 WiFi
    .setRequiredNetworkType(NetworkType.NOT_ROAMING)    // 非漫游

    // 电池要求
    .setRequiresBatteryNotLow(true)
    .setRequiresCharging(true)

    // 存储要求
    .setRequiresStorageNotLow(true)

    // 设备空闲（API 23+）
    .setRequiresDeviceIdle(true)

    // 内容 URI 触发器（API 24+）
    .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)

    .build()
```

## 代码示例

### 链式工作

```kotlin
class WorkChainExample(private val context: Context) {

    fun executeWorkChain(imageUris: List<String>) {
        val workManager = WorkManager.getInstance(context)

        // 为每个图片创建并行压缩工作
        val compressionRequests = imageUris.map { uri ->
            OneTimeWorkRequestBuilder<CompressWorker>()
                .setInputData(workDataOf("image_uri" to uri))
                .build()
        }

        // 合并结果并上传
        val uploadRequest = OneTimeWorkRequestBuilder<BatchUploadWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // 通知完成
        val notificationRequest = OneTimeWorkRequestBuilder<NotificationWorker>()
            .build()

        // 链：全部压缩（并行）-> 上传 -> 通知
        workManager
            .beginWith(compressionRequests)
            .then(uploadRequest)
            .then(notificationRequest)
            .enqueue()
    }
}
```

### 观察工作状态

```kotlin
class WorkObservationViewModel(
    private val workManager: WorkManager
) : ViewModel() {

    private val uploadWorkId: UUID = UUID.randomUUID()

    // 观察特定工作
    val uploadStatus: LiveData<WorkInfo?> = workManager
        .getWorkInfoByIdLiveData(uploadWorkId)

    // 按标签观察
    val allUploadsStatus: LiveData<List<WorkInfo>> = workManager
        .getWorkInfosByTagLiveData("upload")

    // 观察唯一工作
    val syncStatus: LiveData<List<WorkInfo>> = workManager
        .getWorkInfosForUniqueWorkLiveData("sync")

    fun startUpload(imageUri: String) {
        val request = OneTimeWorkRequestBuilder<UploadWorker>()
            .setId(uploadWorkId)
            .setInputData(workDataOf("image_uri" to imageUri))
            .addTag("upload")
            .build()

        workManager.enqueue(request)
    }

    // 基于 Flow 的观察（推荐）
    fun observeUploadProgress(): Flow<WorkInfo?> {
        return workManager.getWorkInfoByIdFlow(uploadWorkId)
    }
}

// 在 Activity/Fragment 中
class UploadActivity : AppCompatActivity() {

    private val viewModel: WorkObservationViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 使用 LiveData 观察
        viewModel.uploadStatus.observe(this) { workInfo ->
            when (workInfo?.state) {
                WorkInfo.State.ENQUEUED -> showStatus("等待开始...")
                WorkInfo.State.RUNNING -> showStatus("上传中...")
                WorkInfo.State.SUCCEEDED -> {
                    val url = workInfo.outputData.getString("upload_url")
                    showStatus("上传完成: $url")
                }
                WorkInfo.State.FAILED -> {
                    val error = workInfo.outputData.getString("error")
                    showError("上传失败: $error")
                }
                WorkInfo.State.CANCELLED -> showStatus("上传已取消")
                WorkInfo.State.BLOCKED -> showStatus("等待约束条件...")
                else -> {}
            }
        }
    }
}
```

### 进度报告

```kotlin
class DownloadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val url = inputData.getString("url") ?: return Result.failure()

        return try {
            downloadFile(url) { progress ->
                // 报告进度（0-100）
                setProgress(workDataOf("progress" to progress))
            }
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private suspend fun downloadFile(url: String, onProgress: suspend (Int) -> Unit) {
        // 模拟带进度的下载
        for (i in 0..100 step 10) {
            delay(500)
            onProgress(i)
        }
    }
}

// 观察进度
workManager.getWorkInfoByIdFlow(downloadWorkId).collect { workInfo ->
    if (workInfo?.state == WorkInfo.State.RUNNING) {
        val progress = workInfo.progress.getInt("progress", 0)
        updateProgressBar(progress)
    }
}
```

### 唯一工作

```kotlin
class SyncManager(private val context: Context) {

    private val workManager = WorkManager.getInstance(context)

    fun scheduleSyncWork() {
        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            repeatInterval = 1,
            repeatIntervalTimeUnit = TimeUnit.HOURS
        )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // 同一时间只有一个同步工作
        workManager.enqueueUniquePeriodicWork(
            "sync_work",
            ExistingPeriodicWorkPolicy.KEEP, // 如果正在运行则保留现有的
            syncRequest
        )
    }

    fun triggerImmediateSync() {
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        workManager.enqueueUniqueWork(
            "immediate_sync",
            ExistingWorkPolicy.REPLACE, // 取消现有的并启动新的
            syncRequest
        )
    }

    fun cancelSync() {
        workManager.cancelUniqueWork("sync_work")
    }
}
```

### 前台服务 Worker

```kotlin
class LongRunningWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        // 为长时间运行的工作设置前台信息
        setForeground(createForegroundInfo())

        return try {
            performLongRunningTask()
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private fun createForegroundInfo(): ForegroundInfo {
        val channelId = "long_running_work"
        val title = "处理中..."

        // 创建通知渠道（API 26+ 必需）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "后台任务",
                NotificationManager.IMPORTANCE_LOW
            )
            val notificationManager = applicationContext
                .getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(applicationContext, channelId)
            .setContentTitle(title)
            .setSmallIcon(R.drawable.ic_sync)
            .setOngoing(true)
            .build()

        return ForegroundInfo(
            NOTIFICATION_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        )
    }

    private suspend fun performLongRunningTask() {
        // 长时间运行的工作
        delay(60000)
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
    }
}
```

## 最佳实践

### 1. 正确处理工作生命周期

```kotlin
class RobustWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // 检查工作是否已取消
            if (isStopped) {
                return Result.failure()
            }

            performWork()

            // 长时间操作后再次检查
            if (isStopped) {
                cleanupPartialWork()
                return Result.failure()
            }

            Result.success()
        } catch (e: CancellationException) {
            // 协程被取消
            cleanupPartialWork()
            Result.failure()
        } catch (e: Exception) {
            handleError(e)
        }
    }

    private suspend fun performWork() {
        // 实际工作
    }

    private fun cleanupPartialWork() {
        // 清理任何部分状态
    }

    private fun handleError(e: Exception): Result {
        return when {
            e is IOException && runAttemptCount < 3 -> Result.retry()
            else -> Result.failure(workDataOf("error" to e.message))
        }
    }
}
```

### 2. 使用依赖注入

```kotlin
// Hilt 集成
@HiltWorker
class InjectedWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: DataRepository,
    private val api: ApiService
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val data = repository.getPendingData()
            api.upload(data)
            repository.markAsUploaded(data)
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}

// Application 设置
@HiltAndroidApp
class MyApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(Log.DEBUG)
            .build()
}
```

## 常见陷阱

### 1. 对即时工作使用 WorkManager

```kotlin
// 错误：对即时、短期工作使用 WorkManager
fun saveUserPreference(value: String) {
    val request = OneTimeWorkRequestBuilder<SavePreferenceWorker>()
        .setInputData(workDataOf("value" to value))
        .build()
    workManager.enqueue(request) // 过度设计！
}

// 正确：对即时工作使用协程
fun saveUserPreference(value: String) {
    viewModelScope.launch {
        dataStore.edit { it[KEY] = value }
    }
}
```

### 2. 不正确处理重试

```kotlin
// 错误：无限重试
override suspend fun doWork(): Result {
    return try {
        performWork()
        Result.success()
    } catch (e: Exception) {
        Result.retry() // 会永远重试！
    }
}

// 正确：限制重试次数
override suspend fun doWork(): Result {
    return try {
        performWork()
        Result.success()
    } catch (e: Exception) {
        if (runAttemptCount < MAX_RETRIES) {
            Result.retry()
        } else {
            Result.failure(workDataOf("error" to "超过最大重试次数"))
        }
    }
}
```

### 3. WorkData 中的大数据

```kotlin
// 错误：在 WorkData 中存储大数据
val request = OneTimeWorkRequestBuilder<ProcessWorker>()
    .setInputData(workDataOf(
        "image_bytes" to imageBytes // 不要这样做！
    ))
    .build()

// 正确：存储数据引用
val request = OneTimeWorkRequestBuilder<ProcessWorker>()
    .setInputData(workDataOf(
        "image_uri" to "content://..." // 改为存储 URI
    ))
    .build()
```

## 性能考虑

### 高效的周期性工作

```kotlin
// 使用弹性间隔以提高电池效率
val periodicRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 1,
    repeatIntervalTimeUnit = TimeUnit.HOURS,
    // 工作可以在间隔的最后 15 分钟内任何时间运行
    flexTimeInterval = 15,
    flexTimeIntervalUnit = TimeUnit.MINUTES
)
    .build()
```

### 用户发起任务的加急工作

```kotlin
val expeditedRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    .build()

// 在 Worker 中，处理加急通知
override suspend fun getForegroundInfo(): ForegroundInfo {
    return createForegroundInfo()
}
```

## 实际场景

### 照片备份系统

```kotlin
class PhotoBackupManager(private val context: Context) {

    private val workManager = WorkManager.getInstance(context)

    fun scheduleBackup() {
        // 约束：WiFi + 充电用于非紧急备份
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.UNMETERED)
            .setRequiresCharging(true)
            .build()

        val backupRequest = PeriodicWorkRequestBuilder<PhotoBackupWorker>(
            repeatInterval = 6,
            repeatIntervalTimeUnit = TimeUnit.HOURS
        )
            .setConstraints(constraints)
            .addTag("photo_backup")
            .build()

        workManager.enqueueUniquePeriodicWork(
            "photo_backup",
            ExistingPeriodicWorkPolicy.KEEP,
            backupRequest
        )
    }

    fun backupNow() {
        val request = OneTimeWorkRequestBuilder<PhotoBackupWorker>()
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        workManager.enqueueUniqueWork(
            "immediate_backup",
            ExistingWorkPolicy.REPLACE,
            request
        )
    }

    fun observeBackupStatus(): Flow<BackupStatus> {
        return workManager.getWorkInfosByTagFlow("photo_backup")
            .map { workInfos ->
                val info = workInfos.firstOrNull()
                when (info?.state) {
                    WorkInfo.State.RUNNING -> BackupStatus.InProgress(
                        info.progress.getInt("progress", 0)
                    )
                    WorkInfo.State.SUCCEEDED -> BackupStatus.Complete
                    WorkInfo.State.FAILED -> BackupStatus.Failed
                    else -> BackupStatus.Idle
                }
            }
    }
}

sealed class BackupStatus {
    object Idle : BackupStatus()
    data class InProgress(val progress: Int) : BackupStatus()
    object Complete : BackupStatus()
    object Failed : BackupStatus()
}
```

## 面试要点

1. **什么时候应该使用 WorkManager？**
   - 可延迟、保证执行的工作
   - 即使应用关闭后也必须完成的工作
   - 基于约束的工作（网络、充电等）

2. **主要组件是什么？**
   - Worker/CoroutineWorker：要做的工作
   - WorkRequest：如何运行的配置
   - WorkManager：调度和管理工作

3. **WorkManager 如何确保可靠性？**
   - 将工作持久化到数据库
   - 在应用/设备重启后存活
   - 使用 JobScheduler（API 23+）或 AlarmManager

4. **一次性工作和周期性工作有什么区别？**
   - 一次性工作：运行一次
   - 周期性工作：按间隔重复（最小 15 分钟）

5. **如何处理错误和重试？**
   - 使用退避策略返回 Result.retry()
   - 检查 runAttemptCount 以限制重试
   - 对永久性失败返回 Result.failure()

## 延伸阅读

- [WorkManager 官方指南](https://developer.android.com/topic/libraries/architecture/workmanager)
- [WorkManager 高级指南](https://developer.android.com/topic/libraries/architecture/workmanager/advanced)
- [WorkManager Codelab](https://developer.android.com/codelabs/android-workmanager)
- [测试 WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager/how-to/testing)
- [WorkManager 与 Hilt](https://developer.android.com/training/dependency-injection/hilt-jetpack#workmanager)
