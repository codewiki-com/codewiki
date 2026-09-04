---
title: WorkManager Background Tasks
description: Complete guide to Android WorkManager for reliable background work, including constraints, chaining, periodic work, and handling edge cases
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - WorkManager
  - Background
  - Jetpack
  - Tasks
status: imported
origin: old/src/content/docs/kotlin/workmanager.en.md
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

WorkManager is the recommended solution for persistent, deferrable background work in Android. It provides a consistent API that works across different Android versions, handling backward compatibility, battery optimization, and system constraints automatically.

## Concept Explanation

WorkManager is designed for work that needs to run reliably even if the app exits or the device restarts. It's not for immediate work or work that can be cancelled when the user leaves the app - use Coroutines or Threads for that instead.

Key characteristics of WorkManager:
- **Guaranteed execution**: Work will run even after app restart or device reboot
- **Constraint-aware**: Can wait for specific conditions (network, charging, etc.)
- **Battery-efficient**: Respects Doze mode and app standby
- **Backward compatible**: Works on API 14+ with consistent behavior

```kotlin
// Simple example: Upload work that runs when network is available
val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    )
    .build()

WorkManager.getInstance(context).enqueue(uploadWorkRequest)
```

## Core Principles

### When to Use WorkManager

| Use Case | Solution |
|----------|----------|
| Must complete, even after app closed | WorkManager |
| User-initiated, immediate work | Coroutines |
| Exact timing required | AlarmManager |
| Long-running foreground work | Foreground Service |
| Real-time messaging | Firebase Cloud Messaging |

### WorkManager Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkManager API                           │
├─────────────────────────────────────────────────────────────┤
│  WorkRequest                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  OneTimeWork    │  │  PeriodicWork   │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  Internal Scheduler (API-dependent)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ JobScheduler │ │   Alarm +    │ │   Firebase   │         │
│  │  (API 23+)   │ │ Broadcast    │ │  JobDispatcher│         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  WorkManager Database (Room)                                 │
│  - Work specs, constraints, state                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Setting Up Dependencies

```kotlin
// build.gradle.kts (app module)
dependencies {
    val workVersion = "2.9.0"

    // Kotlin + Coroutines
    implementation("androidx.work:work-runtime-ktx:$workVersion")

    // Optional - Multiprocess support
    implementation("androidx.work:work-multiprocess:$workVersion")

    // Testing
    androidTestImplementation("androidx.work:work-testing:$workVersion")
}
```

### Creating a Worker

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
            // Perform the upload
            val uploadUrl = uploadImage(imageUri)

            // Return success with output data
            Result.success(workDataOf("upload_url" to uploadUrl))
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                // Retry with exponential backoff
                Result.retry()
            } else {
                Result.failure(workDataOf("error" to e.message))
            }
        }
    }

    private suspend fun uploadImage(uri: String): String {
        // Actual upload logic
        return "https://example.com/uploaded-image.jpg"
    }
}

// Alternative: Worker (blocking, for Java interop)
class BlockingUploadWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    override fun doWork(): Result {
        // This runs on a background thread from WorkManager
        return try {
            performUpload()
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private fun performUpload() {
        // Blocking upload logic
    }
}
```

### Work Requests

```kotlin
import androidx.work.*
import java.util.concurrent.TimeUnit

// One-time work
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

// Periodic work (minimum 15 minutes interval)
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

// Expedited work (for urgent, user-initiated work)
val expeditedRequest = OneTimeWorkRequestBuilder<CriticalWorker>()
    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    .build()
```

### Constraints

```kotlin
val constraints = Constraints.Builder()
    // Network requirements
    .setRequiredNetworkType(NetworkType.CONNECTED)      // Any network
    .setRequiredNetworkType(NetworkType.UNMETERED)      // WiFi only
    .setRequiredNetworkType(NetworkType.NOT_ROAMING)    // Not roaming

    // Battery requirements
    .setRequiresBatteryNotLow(true)
    .setRequiresCharging(true)

    // Storage requirements
    .setRequiresStorageNotLow(true)

    // Device idle (API 23+)
    .setRequiresDeviceIdle(true)

    // Content URI triggers (API 24+)
    .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)

    .build()
```

## Code Examples

### Chaining Work

```kotlin
class WorkChainExample(private val context: Context) {

    fun executeWorkChain(imageUris: List<String>) {
        val workManager = WorkManager.getInstance(context)

        // Create parallel compression work for each image
        val compressionRequests = imageUris.map { uri ->
            OneTimeWorkRequestBuilder<CompressWorker>()
                .setInputData(workDataOf("image_uri" to uri))
                .build()
        }

        // Combine results and upload
        val uploadRequest = OneTimeWorkRequestBuilder<BatchUploadWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // Notify completion
        val notificationRequest = OneTimeWorkRequestBuilder<NotificationWorker>()
            .build()

        // Chain: compress all (parallel) -> upload -> notify
        workManager
            .beginWith(compressionRequests)
            .then(uploadRequest)
            .then(notificationRequest)
            .enqueue()
    }
}

class CompressWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val uri = inputData.getString("image_uri") ?: return Result.failure()
        val compressedPath = compressImage(uri)
        return Result.success(workDataOf("compressed_path" to compressedPath))
    }

    private suspend fun compressImage(uri: String): String {
        // Compression logic
        return "/path/to/compressed.jpg"
    }
}

class BatchUploadWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        // Get outputs from all previous workers using InputMerger
        val compressedPaths = inputData.getStringArray("compressed_paths")
            ?: return Result.failure()

        // Upload all compressed images
        val urls = compressedPaths.map { uploadImage(it) }
        return Result.success(workDataOf("uploaded_urls" to urls.toTypedArray()))
    }

    private suspend fun uploadImage(path: String): String {
        return "https://example.com/image.jpg"
    }
}
```

### Observing Work Status

```kotlin
class WorkObservationViewModel(
    private val workManager: WorkManager
) : ViewModel() {

    private val uploadWorkId: UUID = UUID.randomUUID()

    // Observe specific work
    val uploadStatus: LiveData<WorkInfo?> = workManager
        .getWorkInfoByIdLiveData(uploadWorkId)

    // Observe by tag
    val allUploadsStatus: LiveData<List<WorkInfo>> = workManager
        .getWorkInfosByTagLiveData("upload")

    // Observe unique work
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

    // Flow-based observation (recommended)
    fun observeUploadProgress(): Flow<WorkInfo?> {
        return workManager.getWorkInfoByIdFlow(uploadWorkId)
    }
}

// In Activity/Fragment
class UploadActivity : AppCompatActivity() {

    private val viewModel: WorkObservationViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Observe with LiveData
        viewModel.uploadStatus.observe(this) { workInfo ->
            when (workInfo?.state) {
                WorkInfo.State.ENQUEUED -> showStatus("Waiting to start...")
                WorkInfo.State.RUNNING -> showStatus("Uploading...")
                WorkInfo.State.SUCCEEDED -> {
                    val url = workInfo.outputData.getString("upload_url")
                    showStatus("Upload complete: $url")
                }
                WorkInfo.State.FAILED -> {
                    val error = workInfo.outputData.getString("error")
                    showError("Upload failed: $error")
                }
                WorkInfo.State.CANCELLED -> showStatus("Upload cancelled")
                WorkInfo.State.BLOCKED -> showStatus("Waiting for constraints...")
                else -> {}
            }
        }

        // Or with Flow in Compose
        lifecycleScope.launch {
            viewModel.observeUploadProgress().collect { workInfo ->
                // Handle state changes
            }
        }
    }
}
```

### Progress Reporting

```kotlin
class DownloadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val url = inputData.getString("url") ?: return Result.failure()

        return try {
            downloadFile(url) { progress ->
                // Report progress (0-100)
                setProgress(workDataOf("progress" to progress))
            }
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private suspend fun downloadFile(url: String, onProgress: suspend (Int) -> Unit) {
        // Simulated download with progress
        for (i in 0..100 step 10) {
            delay(500)
            onProgress(i)
        }
    }
}

// Observe progress
workManager.getWorkInfoByIdFlow(downloadWorkId).collect { workInfo ->
    if (workInfo?.state == WorkInfo.State.RUNNING) {
        val progress = workInfo.progress.getInt("progress", 0)
        updateProgressBar(progress)
    }
}
```

### Unique Work

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

        // Only one sync work at a time
        workManager.enqueueUniquePeriodicWork(
            "sync_work",
            ExistingPeriodicWorkPolicy.KEEP, // Keep existing if running
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
            ExistingWorkPolicy.REPLACE, // Cancel existing and start new
            syncRequest
        )
    }

    fun cancelSync() {
        workManager.cancelUniqueWork("sync_work")
    }
}
```

### Foreground Service Worker

```kotlin
class LongRunningWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        // Set foreground info for long-running work
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
        val title = "Processing..."

        // Create notification channel (required for API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Background Tasks",
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
        // Long running work here
        delay(60000)
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
    }
}
```

## Best Practices

### 1. Handle Work Lifecycle Properly

```kotlin
class RobustWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // Check if work was cancelled
            if (isStopped) {
                return Result.failure()
            }

            performWork()

            // Check again after long operation
            if (isStopped) {
                cleanupPartialWork()
                return Result.failure()
            }

            Result.success()
        } catch (e: CancellationException) {
            // Coroutine was cancelled
            cleanupPartialWork()
            Result.failure()
        } catch (e: Exception) {
            handleError(e)
        }
    }

    private suspend fun performWork() {
        // Actual work
    }

    private fun cleanupPartialWork() {
        // Clean up any partial state
    }

    private fun handleError(e: Exception): Result {
        return when {
            e is IOException && runAttemptCount < 3 -> Result.retry()
            else -> Result.failure(workDataOf("error" to e.message))
        }
    }
}
```

### 2. Use Dependency Injection

```kotlin
// Hilt integration
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

// Application setup
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

### 3. Test Your Workers

```kotlin
@RunWith(AndroidJUnit4::class)
class UploadWorkerTest {

    private lateinit var context: Context

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()

        // Initialize WorkManager for testing
        val config = Configuration.Builder()
            .setMinimumLoggingLevel(Log.DEBUG)
            .setExecutor(SynchronousExecutor())
            .build()

        WorkManagerTestInitHelper.initializeTestWorkManager(context, config)
    }

    @Test
    fun testUploadWorker_success() {
        // Create input data
        val inputData = workDataOf("image_uri" to "content://test/image.jpg")

        // Create work request
        val request = OneTimeWorkRequestBuilder<UploadWorker>()
            .setInputData(inputData)
            .build()

        val workManager = WorkManager.getInstance(context)
        workManager.enqueue(request).result.get()

        // Get test driver
        val testDriver = WorkManagerTestInitHelper.getTestDriver(context)!!

        // Meet constraints
        testDriver.setAllConstraintsMet(request.id)

        // Get work info
        val workInfo = workManager.getWorkInfoById(request.id).get()

        // Assert
        assertThat(workInfo.state).isEqualTo(WorkInfo.State.SUCCEEDED)
        assertThat(workInfo.outputData.getString("upload_url")).isNotNull()
    }
}
```

## Common Pitfalls

### 1. Using WorkManager for Immediate Work

```kotlin
// WRONG: WorkManager for immediate, short-lived work
fun saveUserPreference(value: String) {
    val request = OneTimeWorkRequestBuilder<SavePreferenceWorker>()
        .setInputData(workDataOf("value" to value))
        .build()
    workManager.enqueue(request) // Overkill!
}

// CORRECT: Use coroutines for immediate work
fun saveUserPreference(value: String) {
    viewModelScope.launch {
        dataStore.edit { it[KEY] = value }
    }
}
```

### 2. Not Handling Retry Properly

```kotlin
// WRONG: Infinite retries
override suspend fun doWork(): Result {
    return try {
        performWork()
        Result.success()
    } catch (e: Exception) {
        Result.retry() // Will retry forever!
    }
}

// CORRECT: Limit retries
override suspend fun doWork(): Result {
    return try {
        performWork()
        Result.success()
    } catch (e: Exception) {
        if (runAttemptCount < MAX_RETRIES) {
            Result.retry()
        } else {
            Result.failure(workDataOf("error" to "Max retries exceeded"))
        }
    }
}
```

### 3. Large Data in WorkData

```kotlin
// WRONG: Storing large data in WorkData
val request = OneTimeWorkRequestBuilder<ProcessWorker>()
    .setInputData(workDataOf(
        "image_bytes" to imageBytes // Don't do this!
    ))
    .build()

// CORRECT: Store reference to data
val request = OneTimeWorkRequestBuilder<ProcessWorker>()
    .setInputData(workDataOf(
        "image_uri" to "content://..." // Store URI instead
    ))
    .build()
```

## Performance Considerations

### Efficient Periodic Work

```kotlin
// Use flex interval for better battery efficiency
val periodicRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 1,
    repeatIntervalTimeUnit = TimeUnit.HOURS,
    // Work can run anytime in the last 15 minutes of the interval
    flexTimeInterval = 15,
    flexTimeIntervalUnit = TimeUnit.MINUTES
)
    .build()
```

### Expedited Work for User-Initiated Tasks

```kotlin
val expeditedRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    .build()

// In Worker, handle expedited notification
override suspend fun getForegroundInfo(): ForegroundInfo {
    return createForegroundInfo()
}
```

## Real-World Scenarios

### Photo Backup System

```kotlin
class PhotoBackupManager(private val context: Context) {

    private val workManager = WorkManager.getInstance(context)

    fun scheduleBackup() {
        // Constraints: WiFi + Charging for non-urgent backups
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

## Interview Key Points

1. **When should you use WorkManager?**
   - Deferrable, guaranteed work
   - Work that must complete even after app closes
   - Constraint-based work (network, charging, etc.)

2. **What are the main components?**
   - Worker/CoroutineWorker: The work to do
   - WorkRequest: Configuration for how to run
   - WorkManager: Schedules and manages work

3. **How does WorkManager ensure reliability?**
   - Persists work to database
   - Survives app/device restarts
   - Uses JobScheduler (API 23+) or AlarmManager

4. **What's the difference between OneTimeWork and PeriodicWork?**
   - OneTimeWork: Runs once
   - PeriodicWork: Repeats at intervals (min 15 min)

5. **How to handle errors and retries?**
   - Return Result.retry() with backoff policy
   - Check runAttemptCount to limit retries
   - Return Result.failure() for permanent failures

## Further Reading

- [WorkManager Official Guide](https://developer.android.com/topic/libraries/architecture/workmanager)
- [WorkManager Advanced Guide](https://developer.android.com/topic/libraries/architecture/workmanager/advanced)
- [WorkManager Codelab](https://developer.android.com/codelabs/android-workmanager)
- [Testing WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager/how-to/testing)
- [WorkManager with Hilt](https://developer.android.com/training/dependency-injection/hilt-jetpack#workmanager)
