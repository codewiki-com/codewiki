---
title: Virtual Threads
description: Complete guide to Java virtual threads, Project Loom, lightweight concurrency and high-throughput applications
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - Virtual Threads
  - Project Loom
  - Concurrency
status: imported
origin: old/src/content/docs/java/virtual-threads.en.md
divergence: 0.291
issues: []
legacy:
  category: Java
  subcategory: Concurrent Programming
  order: 11
  lastUpdated: 2026-01-07
---

Virtual threads represent one of the most significant changes to the Java platform. Introduced as a preview feature in Java 19 and finalized in Java 21 through [JEP 444](https://openjdk.org/jeps/444), virtual threads are part of Project Loom, a long-term effort to dramatically improve concurrent programming in Java.

We explore virtual threads in depth, covering everything from fundamental concepts to advanced migration strategies for production applications.

## Understanding Virtual Threads

### What Are Virtual Threads?

Virtual threads are lightweight threads that are managed by the Java Virtual Machine (JVM) rather than the operating system. Unlike traditional platform threads, which have a one-to-one mapping with OS threads, virtual threads are multiplexed onto a smaller number of OS threads by the JVM runtime.

Think of virtual threads as user-mode threads or green threads, but implemented with decades of lessons learned about what works in practice. They enable the "thread-per-request" programming style at massive scale without the resource overhead traditionally associated with threads.

### The Problem Virtual Threads Solve

Traditional Java applications face a fundamental scalability challenge. Consider a typical web server scenario:

```java
// Traditional approach with platform threads
public class TraditionalWebServer {
    private final ExecutorService executor = Executors.newFixedThreadPool(200);

    public void handleRequest(Socket socket) {
        executor.submit(() -> {
            try {
                // Read request (blocks waiting for network I/O)
                String request = readRequest(socket);

                // Query database (blocks waiting for response)
                String data = queryDatabase(request);

                // Call external API (blocks waiting for response)
                String enrichedData = callExternalApi(data);

                // Write response (blocks on network I/O)
                writeResponse(socket, enrichedData);
            } catch (Exception e) {
                handleError(socket, e);
            }
        });
    }
}
```

The problem is clear: each request requires a thread, but threads are expensive. A platform thread consumes approximately 1-2 MB of memory for its stack alone, and operating systems typically limit applications to thousands of threads. This means:

- **200-thread pool = maximum 200 concurrent requests**
- **Most thread time is spent waiting (blocked on I/O)**
- **Scaling requires complex async programming or more servers**

### How Virtual Threads Change the Game

Virtual threads eliminate this tradeoff:

```java
// Virtual threads approach
public class VirtualThreadWebServer {
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public void handleRequest(Socket socket) {
        executor.submit(() -> {
            try {
                // Same simple, blocking code
                String request = readRequest(socket);
                String data = queryDatabase(request);
                String enrichedData = callExternalApi(data);
                writeResponse(socket, enrichedData);
            } catch (Exception e) {
                handleError(socket, e);
            }
        });
    }
}
```

The code looks nearly identical, but the behavior is dramatically different:

- **Millions of virtual threads can exist simultaneously**
- **Each virtual thread consumes only ~1 KB of memory initially**
- **Blocking operations release the underlying OS thread**
- **Simple, synchronous code scales automatically**

## Virtual Threads vs Platform Threads

### Architectural Comparison

```
Platform Threads:
┌──────────────────────────────────────────────────────────┐
│ Java Application                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │ Thread1 │ │ Thread2 │ │ Thread3 │ │ Thread4 │  ...    │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘         │
└───────┼───────────┼───────────┼───────────┼──────────────┘
        │           │           │           │
        │ 1:1       │ 1:1       │ 1:1       │ 1:1
        │           │           │           │
┌───────▼───────────▼───────────▼───────────▼──────────────┐
│ Operating System                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │OS Thrd1 │ │OS Thrd2 │ │OS Thrd3 │ │OS Thrd4 │  ...    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
└──────────────────────────────────────────────────────────┘

Virtual Threads:
┌──────────────────────────────────────────────────────────┐
│ Java Application                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ...   │
│  │VT1 │ │VT2 │ │VT3 │ │VT4 │ │VT5 │ │VT6 │ │VTn │       │
│  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘       │
└─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────────┘
      │      │      │      │      │      │      │
      └──────┴──────┴───┬──┴──────┴──────┴──────┘
                        │ M:N (many-to-few)
                        │
┌───────────────────────▼──────────────────────────────────┐
│ JVM Scheduler (Carrier Threads)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ Carrier 1   │ │ Carrier 2   │ │ Carrier 3   │         │
│  │ (OS Thread) │ │ (OS Thread) │ │ (OS Thread) │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└──────────────────────────────────────────────────────────┘
```

### Detailed Comparison Table

| Characteristic | Platform Threads | Virtual Threads |
|----------------|------------------|-----------------|
| **Memory per thread** | ~1-2 MB (stack) | ~1 KB (initial), grows as needed |
| **Creation cost** | Expensive (OS kernel call) | Cheap (JVM internal) |
| **Maximum practical count** | Thousands | Millions |
| **Scheduling** | OS kernel | JVM (ForkJoinPool) |
| **Context switch cost** | High (kernel mode) | Low (user mode) |
| **Blocking behavior** | Blocks OS thread | Unmounts from carrier |
| **Thread pooling needed** | Yes, essential | No, anti-pattern |
| **Stack size** | Fixed at creation | Dynamically grows/shrinks |
| **Native code support** | Full | Limited (causes pinning) |
| **Suitable for** | CPU-bound work | I/O-bound work |

### Behavioral Differences

#### Thread Identity

```java
public class ThreadIdentityDemo {
    public static void main(String[] args) throws Exception {
        // Platform thread
        Thread platform = Thread.ofPlatform()
            .name("platform-worker")
            .start(() -> {
                System.out.println("Platform thread: " + Thread.currentThread());
                System.out.println("Is virtual: " + Thread.currentThread().isVirtual());
            });

        // Virtual thread
        Thread virtual = Thread.ofVirtual()
            .name("virtual-worker")
            .start(() -> {
                System.out.println("Virtual thread: " + Thread.currentThread());
                System.out.println("Is virtual: " + Thread.currentThread().isVirtual());
            });

        platform.join();
        virtual.join();
    }
}

// Output:
// Platform thread: Thread[#21,platform-worker,5,main]
// Is virtual: false
// Virtual thread: VirtualThread[#22,virtual-worker]/runnable@ForkJoinPool-1-worker-1
// Is virtual: true
```

#### Memory Consumption Comparison

```java
public class MemoryComparisonDemo {

    public static void main(String[] args) throws Exception {
        int threadCount = 100_000;

        System.out.println("Testing with " + threadCount + " threads");

        // Measure virtual threads
        long startMemory = getUsedMemory();
        List<Thread> virtualThreads = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            Thread vt = Thread.ofVirtual().start(() -> {
                try {
                    Thread.sleep(10_000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            virtualThreads.add(vt);
        }

        long virtualMemory = getUsedMemory() - startMemory;
        System.out.printf("Virtual threads memory: ~%.2f MB%n",
            virtualMemory / (1024.0 * 1024.0));
        System.out.printf("Per virtual thread: ~%.2f KB%n",
            virtualMemory / (1024.0 * threadCount));

        // Clean up
        virtualThreads.forEach(Thread::interrupt);
        for (Thread t : virtualThreads) {
            t.join();
        }

        // Note: Testing 100,000 platform threads would likely crash the JVM
        // due to memory exhaustion or OS limits
        System.out.println("\nNote: 100,000 platform threads would require ~100-200 GB!");
    }

    private static long getUsedMemory() {
        Runtime runtime = Runtime.getRuntime();
        return runtime.totalMemory() - runtime.freeMemory();
    }
}
```

## Creating and Using Virtual Threads

### Method 1: Thread.startVirtualThread()

The simplest way to create and start a virtual thread:

```java
public class StartVirtualThreadDemo {
    public static void main(String[] args) throws Exception {
        Thread vt = Thread.startVirtualThread(() -> {
            System.out.println("Hello from virtual thread!");
            System.out.println("Thread: " + Thread.currentThread());
        });

        vt.join();  // Wait for completion
    }
}
```

### Method 2: Thread.ofVirtual() Builder

Provides more control over thread creation:

```java
public class VirtualThreadBuilderDemo {
    public static void main(String[] args) throws Exception {
        // Named virtual thread
        Thread namedVt = Thread.ofVirtual()
            .name("my-worker")
            .start(() -> {
                System.out.println("Thread name: " + Thread.currentThread().getName());
            });

        // Virtual thread with uncaught exception handler
        Thread handledVt = Thread.ofVirtual()
            .name("error-prone")
            .uncaughtExceptionHandler((t, e) -> {
                System.err.println("Exception in " + t.getName() + ": " + e.getMessage());
            })
            .start(() -> {
                throw new RuntimeException("Intentional error");
            });

        // Thread factory for sequential naming
        Thread.Builder builder = Thread.ofVirtual().name("worker-", 0);

        Thread vt1 = builder.start(() -> System.out.println(Thread.currentThread().getName()));
        Thread vt2 = builder.start(() -> System.out.println(Thread.currentThread().getName()));
        Thread vt3 = builder.start(() -> System.out.println(Thread.currentThread().getName()));

        // Output: worker-0, worker-1, worker-2

        namedVt.join();
        handledVt.join();
        vt1.join();
        vt2.join();
        vt3.join();
    }
}
```

### Method 3: newVirtualThreadPerTaskExecutor

The recommended approach for most applications:

```java
import java.util.concurrent.*;
import java.util.*;

public class VirtualThreadExecutorDemo {

    public static void main(String[] args) throws Exception {
        // AutoCloseable executor with try-with-resources
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {

            // Submit Runnable tasks
            executor.submit(() -> {
                System.out.println("Task 1 running on: " + Thread.currentThread());
            });

            // Submit Callable tasks and get results
            Future<String> future = executor.submit(() -> {
                Thread.sleep(100);
                return "Result from virtual thread";
            });

            System.out.println("Future result: " + future.get());

            // Submit multiple tasks
            List<Callable<Integer>> tasks = new ArrayList<>();
            for (int i = 0; i < 1000; i++) {
                final int taskId = i;
                tasks.add(() -> {
                    Thread.sleep(10);
                    return taskId * 2;
                });
            }

            List<Future<Integer>> results = executor.invokeAll(tasks);
            int sum = results.stream()
                .map(f -> {
                    try {
                        return f.get();
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .mapToInt(Integer::intValue)
                .sum();

            System.out.println("Sum of results: " + sum);

        } // Executor automatically shuts down and awaits termination
    }
}
```

### Method 4: Thread Factory

Create a factory for consistent thread creation:

```java
import java.util.concurrent.*;

public class ThreadFactoryDemo {

    public static void main(String[] args) throws Exception {
        // Create a thread factory for virtual threads
        ThreadFactory factory = Thread.ofVirtual()
            .name("http-handler-", 0)
            .factory();

        // Use the factory to create threads
        for (int i = 0; i < 5; i++) {
            Thread t = factory.newThread(() -> {
                System.out.println(Thread.currentThread().getName() + " executing");
            });
            t.start();
        }

        // Use factory with ExecutorService
        ExecutorService executor = Executors.newThreadPerTaskExecutor(factory);

        try {
            executor.submit(() -> System.out.println("Factory-created virtual thread"));
        } finally {
            executor.shutdown();
            executor.awaitTermination(1, TimeUnit.MINUTES);
        }
    }
}
```

### Practical Example: Concurrent HTTP Client

```java
import java.net.URI;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;

public class ConcurrentHttpClient {

    private final HttpClient httpClient;

    public ConcurrentHttpClient() {
        // HttpClient uses virtual threads internally when configured
        this.httpClient = HttpClient.newBuilder()
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public List<String> fetchAllUrls(List<String> urls) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<String>> futures = urls.stream()
                .map(url -> executor.submit(() -> fetchUrl(url)))
                .toList();

            List<String> results = new ArrayList<>();
            for (Future<String> future : futures) {
                try {
                    results.add(future.get(30, TimeUnit.SECONDS));
                } catch (TimeoutException e) {
                    results.add("TIMEOUT: Request exceeded 30 seconds");
                } catch (ExecutionException e) {
                    results.add("ERROR: " + e.getCause().getMessage());
                }
            }
            return results;
        }
    }

    private String fetchUrl(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        return String.format("URL: %s, Status: %d, Length: %d",
            url, response.statusCode(), response.body().length());
    }

    public static void main(String[] args) throws Exception {
        ConcurrentHttpClient client = new ConcurrentHttpClient();

        List<String> urls = List.of(
            "https://httpbin.org/get",
            "https://httpbin.org/delay/1",
            "https://httpbin.org/status/200",
            "https://httpbin.org/headers",
            "https://httpbin.org/ip"
        );

        long start = System.currentTimeMillis();
        List<String> results = client.fetchAllUrls(urls);
        long duration = System.currentTimeMillis() - start;

        results.forEach(System.out::println);
        System.out.printf("Total time: %d ms (fetched %d URLs concurrently)%n",
            duration, urls.size());
    }
}
```

## The Carrier Thread Model

### Understanding Mounting and Unmounting

Virtual threads execute on carrier threads (platform threads from a ForkJoinPool). When a virtual thread performs a blocking operation, it "unmounts" from its carrier, freeing the carrier to run other virtual threads. When the blocking operation completes, the virtual thread is "mounted" onto an available carrier and resumes execution.

```java
public class CarrierThreadDemo {

    public static void main(String[] args) throws Exception {
        int virtualThreadCount = 1000;
        CountDownLatch latch = new CountDownLatch(virtualThreadCount);
        Set<String> carriers = ConcurrentHashMap.newKeySet();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < virtualThreadCount; i++) {
                executor.submit(() -> {
                    try {
                        // Record which carrier thread we're on
                        String carrier = getCurrentCarrier();
                        carriers.add(carrier);

                        // Blocking operation causes unmounting
                        Thread.sleep(100);

                        // May be on a different carrier after waking up
                        String newCarrier = getCurrentCarrier();
                        if (!carrier.equals(newCarrier)) {
                            System.out.println("Switched carriers: " +
                                carrier + " -> " + newCarrier);
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await();
        }

        System.out.println("Total carrier threads used: " + carriers.size());
        System.out.println("Virtual threads executed: " + virtualThreadCount);
        System.out.println("Carriers: " + carriers);
    }

    private static String getCurrentCarrier() {
        // Virtual thread's toString includes carrier info
        String threadStr = Thread.currentThread().toString();
        int atIndex = threadStr.indexOf('@');
        if (atIndex >= 0) {
            return threadStr.substring(atIndex + 1);
        }
        return threadStr;
    }
}
```

### Blocking Operations That Trigger Unmounting

These operations cause a virtual thread to unmount:

```java
public class UnmountingOperationsDemo {

    public void blockingOperations() throws Exception {
        // All of these cause unmounting from carrier thread:

        // 1. Thread.sleep()
        Thread.sleep(1000);

        // 2. Blocking I/O operations
        Socket socket = new Socket("example.com", 80);
        InputStream in = socket.getInputStream();
        int data = in.read();  // Unmounts while waiting

        // 3. Lock acquisition (when using ReentrantLock)
        ReentrantLock lock = new ReentrantLock();
        lock.lock();  // Unmounts if lock is held

        // 4. Condition waiting
        Condition condition = lock.newCondition();
        condition.await();  // Unmounts while waiting

        // 5. BlockingQueue operations
        BlockingQueue<String> queue = new LinkedBlockingQueue<>();
        String item = queue.take();  // Unmounts while queue is empty

        // 6. Future.get()
        Future<String> future = CompletableFuture.supplyAsync(() -> "result");
        String result = future.get();  // Unmounts while waiting

        // 7. Object.wait() (when not inside synchronized)
        Object monitor = new Object();
        synchronized (monitor) {
            monitor.wait();  // Note: This causes pinning, discussed later
        }
    }
}
```

### Configuring Carrier Thread Pool

The default carrier thread pool is a ForkJoinPool with parallelism equal to the number of available processors. You can configure it:

```java
// Set via system properties before JVM starts
// -Djdk.virtualThreadScheduler.parallelism=16
// -Djdk.virtualThreadScheduler.maxPoolSize=256
// -Djdk.virtualThreadScheduler.minRunnable=1

public class CarrierConfigDemo {

    public static void main(String[] args) {
        // Check current configuration
        int parallelism = Runtime.getRuntime().availableProcessors();
        System.out.println("Default carrier parallelism: " + parallelism);

        // The scheduler uses a ForkJoinPool
        // You can get statistics using JFR or JMX

        // For most applications, default settings are optimal
        // Only tune if you observe carrier thread starvation
    }
}
```

## Structured Concurrency

Structured concurrency, introduced as a preview feature in Java 21 ([JEP 453](https://openjdk.org/jeps/453)) and refined in later releases, provides a way to organize concurrent tasks into hierarchical structures that follow the natural structure of code.

### The Problem with Unstructured Concurrency

```java
// Problematic unstructured concurrency pattern
public class UnstructuredProblems {
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public Response handleRequest(String userId) throws Exception {
        // Start two concurrent tasks
        Future<User> userFuture = executor.submit(() -> fetchUser(userId));
        Future<List<Order>> ordersFuture = executor.submit(() -> fetchOrders(userId));

        // Problems:
        // 1. If fetchUser() fails, fetchOrders() continues running
        // 2. If this method throws an exception, both tasks may leak
        // 3. Thread dump doesn't show relationship between tasks
        // 4. Cancellation doesn't propagate properly

        User user = userFuture.get();
        List<Order> orders = ordersFuture.get();

        return new Response(user, orders);
    }
}
```

### StructuredTaskScope Basics

```java
import java.util.concurrent.StructuredTaskScope;

public class StructuredBasicsDemo {

    public Response handleRequest(String userId) throws Exception {
        // The try-with-resources ensures all forked tasks complete
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // Fork subtasks - they run concurrently
            StructuredTaskScope.Subtask<User> userTask =
                scope.fork(() -> fetchUser(userId));
            StructuredTaskScope.Subtask<List<Order>> ordersTask =
                scope.fork(() -> fetchOrders(userId));

            // Wait for all tasks or first failure
            scope.join();

            // Propagate any exceptions
            scope.throwIfFailed();

            // All tasks succeeded - get results
            return new Response(userTask.get(), ordersTask.get());

        } // If we exit (even via exception), all tasks are cancelled
    }

    private User fetchUser(String userId) throws Exception {
        Thread.sleep(100);
        return new User(userId, "John Doe");
    }

    private List<Order> fetchOrders(String userId) throws Exception {
        Thread.sleep(150);
        return List.of(new Order("ORD-1"), new Order("ORD-2"));
    }

    record User(String id, String name) {}
    record Order(String id) {}
    record Response(User user, List<Order> orders) {}
}
```

### ShutdownOnFailure Pattern

Cancel all sibling tasks if any task fails:

```java
public class ShutdownOnFailureDemo {

    public Data fetchCriticalData() throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // All three pieces of data are required
            var configTask = scope.fork(() -> fetchConfig());
            var credentialsTask = scope.fork(() -> fetchCredentials());
            var settingsTask = scope.fork(() -> fetchSettings());

            // Join with timeout
            scope.joinUntil(Instant.now().plusSeconds(30));

            // If any task failed, throw the exception
            scope.throwIfFailed(ex -> new DataFetchException("Failed to fetch data", ex));

            return new Data(
                configTask.get(),
                credentialsTask.get(),
                settingsTask.get()
            );
        }
    }

    // Simulate a failure scenario
    public void demonstrateFailure() {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var fastTask = scope.fork(() -> {
                Thread.sleep(50);
                return "fast";
            });

            var failingTask = scope.fork(() -> {
                Thread.sleep(100);
                throw new RuntimeException("Task failed!");
            });

            var slowTask = scope.fork(() -> {
                // This task will be cancelled when failingTask fails
                Thread.sleep(5000);
                System.out.println("This won't print");
                return "slow";
            });

            scope.join();
            // slowTask was cancelled, so we have clean shutdown

        } catch (Exception e) {
            System.out.println("Caught: " + e.getMessage());
        }
    }

    record Data(String config, String credentials, String settings) {}
}
```

### ShutdownOnSuccess Pattern

Return as soon as any task succeeds (race pattern):

```java
public class ShutdownOnSuccessDemo {

    // Query multiple replicas, return first response
    public String queryWithRedundancy(String query) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
            scope.fork(() -> queryReplica1(query));
            scope.fork(() -> queryReplica2(query));
            scope.fork(() -> queryReplica3(query));

            scope.join();

            // Returns result of first successful task
            // Other tasks are cancelled automatically
            return scope.result();
        }
    }

    // Find fastest available service
    public ServiceEndpoint findFastestService() throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<ServiceEndpoint>()) {
            scope.fork(() -> pingService("primary"));
            scope.fork(() -> pingService("secondary"));
            scope.fork(() -> pingService("fallback"));

            scope.join();
            return scope.result();
        }
    }

    // Handle case where all tasks might fail
    public String queryWithFallback(String query) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
            scope.fork(() -> queryPrimary(query));
            scope.fork(() -> querySecondary(query));

            scope.join();
            return scope.result();

        } catch (ExecutionException e) {
            // All tasks failed, use default
            return "default-value";
        }
    }

    private String queryReplica1(String query) throws Exception {
        Thread.sleep(100);
        return "Result from replica 1";
    }

    private String queryReplica2(String query) throws Exception {
        Thread.sleep(50);
        return "Result from replica 2";
    }

    private String queryReplica3(String query) throws Exception {
        Thread.sleep(200);
        return "Result from replica 3";
    }

    record ServiceEndpoint(String name, String url) {}

    private ServiceEndpoint pingService(String name) throws Exception {
        Thread.sleep((long)(Math.random() * 100));
        return new ServiceEndpoint(name, "http://" + name + ".example.com");
    }

    private String queryPrimary(String query) throws Exception {
        Thread.sleep(100);
        return "primary: " + query;
    }

    private String querySecondary(String query) throws Exception {
        Thread.sleep(150);
        return "secondary: " + query;
    }
}
```

### Custom StructuredTaskScope

Create custom policies for handling task completion:

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Subtask;
import java.util.stream.Stream;

public class CustomScopeDemo {

    // Collect all results, including failures
    public static class CollectAllScope<T> extends StructuredTaskScope<T> {
        private final List<Subtask<T>> subtasks = new CopyOnWriteArrayList<>();

        @Override
        protected void handleComplete(Subtask<? extends T> subtask) {
            subtasks.add((Subtask<T>) subtask);
        }

        public List<T> successfulResults() {
            return subtasks.stream()
                .filter(st -> st.state() == Subtask.State.SUCCESS)
                .map(Subtask::get)
                .toList();
        }

        public List<Throwable> failures() {
            return subtasks.stream()
                .filter(st -> st.state() == Subtask.State.FAILED)
                .map(Subtask::exception)
                .toList();
        }

        public int successCount() {
            return (int) subtasks.stream()
                .filter(st -> st.state() == Subtask.State.SUCCESS)
                .count();
        }
    }

    public void processWithPartialFailures(List<String> items) throws Exception {
        try (var scope = new CollectAllScope<String>()) {
            for (String item : items) {
                scope.fork(() -> processItem(item));
            }

            scope.join();

            List<String> results = scope.successfulResults();
            List<Throwable> errors = scope.failures();

            System.out.printf("Processed %d/%d items successfully%n",
                results.size(), items.size());

            if (!errors.isEmpty()) {
                System.out.println("Errors encountered:");
                errors.forEach(e -> System.out.println("  - " + e.getMessage()));
            }
        }
    }

    private String processItem(String item) throws Exception {
        if (item.startsWith("bad")) {
            throw new Exception("Cannot process: " + item);
        }
        Thread.sleep(50);
        return "Processed: " + item;
    }
}
```

### Nested Structured Concurrency

Scopes can be nested for complex workflows:

```java
public class NestedScopeDemo {

    public FullReport generateReport(String reportId) throws Exception {
        try (var mainScope = new StructuredTaskScope.ShutdownOnFailure()) {
            // Fork high-level sections
            var headerTask = mainScope.fork(() -> generateHeader(reportId));
            var bodyTask = mainScope.fork(() -> generateBody(reportId));
            var footerTask = mainScope.fork(() -> generateFooter(reportId));

            mainScope.join();
            mainScope.throwIfFailed();

            return new FullReport(
                headerTask.get(),
                bodyTask.get(),
                footerTask.get()
            );
        }
    }

    private ReportBody generateBody(String reportId) throws Exception {
        // Nested scope for body sections
        try (var bodyScope = new StructuredTaskScope.ShutdownOnFailure()) {
            var summaryTask = bodyScope.fork(() -> generateSummary(reportId));
            var detailsTask = bodyScope.fork(() -> generateDetails(reportId));
            var chartsTask = bodyScope.fork(() -> generateCharts(reportId));

            bodyScope.join();
            bodyScope.throwIfFailed();

            return new ReportBody(
                summaryTask.get(),
                detailsTask.get(),
                chartsTask.get()
            );
        }
    }

    // ... other generator methods

    record FullReport(ReportHeader header, ReportBody body, ReportFooter footer) {}
    record ReportBody(String summary, String details, List<Chart> charts) {}
    record ReportHeader(String title, String date) {}
    record ReportFooter(String author, String version) {}
    record Chart(String name, byte[] data) {}
}
```

## Scoped Values

Scoped values ([JEP 464](https://openjdk.org/jeps/464)), finalized in Java 24, provide an alternative to ThreadLocal that is optimized for virtual threads and structured concurrency.

### ThreadLocal vs ScopedValue

```java
import java.lang.ScopedValue;

public class ScopedValueDemo {

    // ThreadLocal approach (works but not ideal for virtual threads)
    private static final ThreadLocal<String> USER_THREAD_LOCAL = new ThreadLocal<>();

    // ScopedValue approach (optimized for virtual threads)
    private static final ScopedValue<String> USER = ScopedValue.newInstance();

    public void demonstrateDifference() {
        // ThreadLocal: mutable, expensive with millions of virtual threads
        USER_THREAD_LOCAL.set("user123");
        doWork();
        USER_THREAD_LOCAL.remove();  // Must remember to clean up!

        // ScopedValue: immutable, efficient, automatic cleanup
        ScopedValue.runWhere(USER, "user123", () -> {
            doWork();
        });  // Value automatically goes out of scope
    }

    private void doWork() {
        // Both accessible the same way in practice
        String user1 = USER_THREAD_LOCAL.get();
        String user2 = USER.get();
    }
}
```

### ScopedValue with Structured Concurrency

```java
public class ScopedValueWithStructuredConcurrency {

    private static final ScopedValue<RequestContext> CONTEXT = ScopedValue.newInstance();

    public Response handleRequest(Request request) throws Exception {
        RequestContext ctx = new RequestContext(
            request.userId(),
            request.traceId(),
            Instant.now()
        );

        // Run entire request handling with context bound
        return ScopedValue.callWhere(CONTEXT, ctx, () -> {
            return processRequest(request);
        });
    }

    private Response processRequest(Request request) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // Context automatically inherited by forked tasks
            var userTask = scope.fork(() -> fetchUserData());
            var prefsTask = scope.fork(() -> fetchPreferences());

            scope.join();
            scope.throwIfFailed();

            return buildResponse(userTask.get(), prefsTask.get());
        }
    }

    private UserData fetchUserData() throws Exception {
        // Access context in forked virtual thread
        RequestContext ctx = CONTEXT.get();
        System.out.println("Fetching data for user: " + ctx.userId());
        System.out.println("Trace ID: " + ctx.traceId());

        Thread.sleep(100);
        return new UserData(ctx.userId(), "John Doe");
    }

    private Preferences fetchPreferences() throws Exception {
        RequestContext ctx = CONTEXT.get();
        Thread.sleep(80);
        return new Preferences(ctx.userId(), "dark-mode");
    }

    record RequestContext(String userId, String traceId, Instant timestamp) {}
    record Request(String userId, String traceId, String body) {}
    record Response(UserData user, Preferences prefs) {}
    record UserData(String id, String name) {}
    record Preferences(String userId, String theme) {}
}
```

### Rebinding Scoped Values

```java
public class ScopedValueRebindingDemo {

    private static final ScopedValue<String> OPERATION = ScopedValue.newInstance();
    private static final ScopedValue<Integer> DEPTH = ScopedValue.newInstance();

    public void processWithNesting() {
        ScopedValue.runWhere(OPERATION, "main", () -> {
            ScopedValue.runWhere(DEPTH, 0, () -> {
                System.out.println(OPERATION.get() + " at depth " + DEPTH.get());

                // Rebind for nested operation
                ScopedValue.runWhere(OPERATION, "nested", () -> {
                    ScopedValue.runWhere(DEPTH, DEPTH.get() + 1, () -> {
                        System.out.println(OPERATION.get() + " at depth " + DEPTH.get());

                        // Even deeper nesting
                        ScopedValue.runWhere(DEPTH, DEPTH.get() + 1, () -> {
                            System.out.println(OPERATION.get() + " at depth " + DEPTH.get());
                        });
                    });
                });

                // Back to original bindings
                System.out.println(OPERATION.get() + " at depth " + DEPTH.get());
            });
        });
    }

    // Output:
    // main at depth 0
    // nested at depth 1
    // nested at depth 2
    // main at depth 0
}
```

## Thread Pinning and Performance

### Understanding Thread Pinning

Thread pinning occurs when a virtual thread cannot unmount from its carrier thread during a blocking operation. This defeats the main benefit of virtual threads by consuming an OS thread while blocked.

### Causes of Pinning

```java
public class PinningCausesDemo {

    private final Object monitor = new Object();

    // Cause 1: synchronized blocks with blocking inside
    public void pinningSynchronized() {
        synchronized (monitor) {
            try {
                Thread.sleep(1000);  // PINNED! Cannot unmount
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // Cause 2: synchronized methods with blocking
    public synchronized void pinningSynchronizedMethod() {
        try {
            Thread.sleep(1000);  // PINNED!
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // Cause 3: Native method calls or JNI
    public void pinningNative() {
        // Native code execution pins the virtual thread
        System.loadLibrary("someNativeLib");
        // Any call to native code causes pinning
    }
}
```

### Detecting Pinning

```java
public class PinningDetectionDemo {

    public static void main(String[] args) throws Exception {
        // Enable pinning detection via system property
        // Run with: -Djdk.tracePinnedThreads=full

        // Or programmatically check for pinning scenarios
        demonstratePinningDetection();
    }

    public static void demonstratePinningDetection() throws Exception {
        Object lock = new Object();
        CountDownLatch latch = new CountDownLatch(1);

        Thread vt = Thread.startVirtualThread(() -> {
            synchronized (lock) {
                try {
                    System.out.println("About to sleep in synchronized block (will pin)");
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            latch.countDown();
        });

        latch.await();
        vt.join();

        System.out.println("Check console for pinning warnings with -Djdk.tracePinnedThreads=full");
    }
}

// With -Djdk.tracePinnedThreads=full, output includes:
// Thread[#23,ForkJoinPool-1-worker-1,5,CarrierThreads]
//     PinningCausesDemo.pinningSynchronized(PinningCausesDemo.java:10)
//     ...
```

### Avoiding Pinning

```java
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.locks.Condition;

public class AvoidingPinningDemo {

    // BAD: synchronized with blocking causes pinning
    private final Object monitor = new Object();

    public void badApproach() {
        synchronized (monitor) {
            try {
                Thread.sleep(1000);  // Pinning!
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // GOOD: ReentrantLock allows unmounting
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition condition = lock.newCondition();

    public void goodApproach() {
        lock.lock();
        try {
            Thread.sleep(1000);  // No pinning - can unmount
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    // GOOD: Use Condition instead of Object.wait()
    public void goodWaiting() throws InterruptedException {
        lock.lock();
        try {
            while (!conditionMet()) {
                condition.await();  // No pinning - can unmount
            }
        } finally {
            lock.unlock();
        }
    }

    // GOOD: Keep synchronized blocks short without blocking
    public void shortSynchronized() {
        int value;
        synchronized (monitor) {
            value = computeQuickValue();  // Quick, no I/O
        }
        // Do blocking work outside synchronized block
        processValue(value);
    }

    private boolean conditionMet() { return true; }
    private int computeQuickValue() { return 42; }
    private void processValue(int value) {}
}
```

### Pinning-Safe Patterns

```java
public class PinningSafePatterns {

    // Pattern 1: Compute then lock
    private final ReentrantLock lock = new ReentrantLock();
    private String sharedState;

    public void computeThenLock() throws Exception {
        // Do blocking work first
        String result = performBlockingOperation();

        // Lock only for the update
        lock.lock();
        try {
            sharedState = result;
        } finally {
            lock.unlock();
        }
    }

    // Pattern 2: Lock, copy, unlock, process
    private final Map<String, Data> cache = new HashMap<>();

    public Data getCachedData(String key) throws Exception {
        Data data;
        lock.lock();
        try {
            data = cache.get(key);
        } finally {
            lock.unlock();
        }

        if (data == null) {
            // Blocking operation outside lock
            data = fetchFromRemote(key);

            lock.lock();
            try {
                cache.putIfAbsent(key, data);
                return cache.get(key);
            } finally {
                lock.unlock();
            }
        }
        return data;
    }

    // Pattern 3: Use concurrent collections
    private final ConcurrentHashMap<String, Data> concurrentCache = new ConcurrentHashMap<>();

    public Data getCachedDataConcurrent(String key) throws Exception {
        return concurrentCache.computeIfAbsent(key, k -> {
            try {
                return fetchFromRemote(k);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    private String performBlockingOperation() throws Exception {
        Thread.sleep(100);
        return "result";
    }

    private Data fetchFromRemote(String key) throws Exception {
        Thread.sleep(200);
        return new Data(key, "value");
    }

    record Data(String key, String value) {}
}
```

## Best Practices

### Do's and Don'ts

```java
public class BestPracticesDemo {

    // DO: Use try-with-resources for executors
    public void doUseAutoCloseable() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> doWork());
        } // Automatically shuts down and awaits termination
    }

    // DON'T: Pool virtual threads
    public void dontPoolVirtualThreads() {
        // BAD - defeats the purpose of virtual threads
        ExecutorService pool = Executors.newFixedThreadPool(100,
            Thread.ofVirtual().factory());

        // GOOD - one virtual thread per task
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    }

    // DO: Use virtual threads for I/O-bound work
    public void doUseForIO() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // HTTP requests, database queries, file I/O
            executor.submit(() -> fetchFromDatabase());
            executor.submit(() -> callExternalApi());
            executor.submit(() -> readFile());
        }
    }

    // DON'T: Use virtual threads for CPU-bound work
    public void dontUseForCPU() {
        // BAD - virtual threads don't help with CPU-bound work
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> computeFactorial(10000));
            executor.submit(() -> sortLargeArray(new int[1000000]));
        }

        // GOOD - use platform threads or parallel streams for CPU-bound
        try (var executor = Executors.newFixedThreadPool(
                Runtime.getRuntime().availableProcessors())) {
            executor.submit(() -> computeFactorial(10000));
        }
    }

    // DO: Use structured concurrency for related tasks
    public void doUseStructuredConcurrency() throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var task1 = scope.fork(() -> fetchData1());
            var task2 = scope.fork(() -> fetchData2());

            scope.join();
            scope.throwIfFailed();

            process(task1.get(), task2.get());
        }
    }

    // DON'T: Create threads in tight loops without limit
    public void dontUnboundedCreation() {
        // BAD - no backpressure
        while (true) {
            Thread.startVirtualThread(() -> processItem());
        }

        // GOOD - use bounded queue or semaphore for backpressure
        Semaphore semaphore = new Semaphore(10000);
        while (true) {
            semaphore.acquire();
            Thread.startVirtualThread(() -> {
                try {
                    processItem();
                } finally {
                    semaphore.release();
                }
            });
        }
    }

    // DO: Use ReentrantLock instead of synchronized for blocking code
    private final ReentrantLock lock = new ReentrantLock();

    public void doUseReentrantLock() throws Exception {
        lock.lock();
        try {
            Thread.sleep(100);  // Can unmount
        } finally {
            lock.unlock();
        }
    }

    // DON'T: Block in synchronized
    private final Object monitor = new Object();

    public void dontBlockInSynchronized() {
        synchronized (monitor) {
            // BAD - causes pinning
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void doWork() {}
    private void fetchFromDatabase() {}
    private void callExternalApi() {}
    private void readFile() {}
    private long computeFactorial(int n) { return 0; }
    private void sortLargeArray(int[] arr) {}
    private String fetchData1() { return "data1"; }
    private String fetchData2() { return "data2"; }
    private void process(String d1, String d2) {}
    private void processItem() {}
}
```

### Rate Limiting and Backpressure

```java
public class BackpressureDemo {

    // Limit concurrent operations
    private final Semaphore databasePermits = new Semaphore(100);
    private final Semaphore apiPermits = new Semaphore(50);

    public void processWithBackpressure(List<Request> requests) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (Request request : requests) {
                executor.submit(() -> {
                    try {
                        databasePermits.acquire();
                        try {
                            queryDatabase(request);
                        } finally {
                            databasePermits.release();
                        }

                        apiPermits.acquire();
                        try {
                            callExternalApi(request);
                        } finally {
                            apiPermits.release();
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
        }
    }

    // Use BlockingQueue for producer-consumer with backpressure
    private final BlockingQueue<Task> taskQueue = new LinkedBlockingQueue<>(1000);

    public void startProcessing() {
        // Start consumer virtual threads
        for (int i = 0; i < 10; i++) {
            Thread.startVirtualThread(() -> {
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        Task task = taskQueue.take();
                        processTask(task);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }
    }

    public void submitTask(Task task) throws InterruptedException {
        // Blocks if queue is full - backpressure
        taskQueue.put(task);
    }

    record Request(String id) {}
    record Task(String id, String data) {}

    private void queryDatabase(Request r) {}
    private void callExternalApi(Request r) {}
    private void processTask(Task t) {}
}
```

### Error Handling Best Practices

```java
public class ErrorHandlingDemo {

    // Handle exceptions in virtual thread tasks
    public void handleExceptions() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Future<String> future = executor.submit(() -> {
                if (Math.random() > 0.5) {
                    throw new RuntimeException("Random failure");
                }
                return "Success";
            });

            try {
                String result = future.get(10, TimeUnit.SECONDS);
                System.out.println(result);
            } catch (ExecutionException e) {
                Throwable cause = e.getCause();
                System.err.println("Task failed: " + cause.getMessage());
                // Handle or rethrow as appropriate
            } catch (TimeoutException e) {
                future.cancel(true);
                System.err.println("Task timed out");
            }
        }
    }

    // With structured concurrency
    public void handleStructuredExceptions() throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var task1 = scope.fork(() -> riskyOperation1());
            var task2 = scope.fork(() -> riskyOperation2());

            scope.join();

            try {
                scope.throwIfFailed();
            } catch (ExecutionException e) {
                // Handle the first failure
                Throwable cause = e.getCause();
                if (cause instanceof RecoverableException) {
                    // Attempt recovery
                    return handleRecovery((RecoverableException) cause);
                }
                throw e;
            }

            process(task1.get(), task2.get());
        }
    }

    // Custom exception handling with custom scope
    public List<Result> processWithPartialFailures(List<Item> items) throws Exception {
        try (var scope = new StructuredTaskScope<Result>()) {
            Map<StructuredTaskScope.Subtask<Result>, Item> taskToItem = new HashMap<>();

            for (Item item : items) {
                var task = scope.fork(() -> processItem(item));
                taskToItem.put(task, item);
            }

            scope.join();

            List<Result> results = new ArrayList<>();
            List<String> failures = new ArrayList<>();

            for (var entry : taskToItem.entrySet()) {
                var task = entry.getKey();
                var item = entry.getValue();

                switch (task.state()) {
                    case SUCCESS -> results.add(task.get());
                    case FAILED -> failures.add(
                        item.id() + ": " + task.exception().getMessage()
                    );
                    case UNAVAILABLE -> failures.add(
                        item.id() + ": Task was cancelled"
                    );
                }
            }

            if (!failures.isEmpty()) {
                System.err.println("Some items failed to process:");
                failures.forEach(f -> System.err.println("  - " + f));
            }

            return results;
        }
    }

    static class RecoverableException extends Exception {
        RecoverableException(String message) { super(message); }
    }

    record Item(String id, String data) {}
    record Result(String id, String processedData) {}

    private String riskyOperation1() throws Exception { return "result1"; }
    private String riskyOperation2() throws Exception { return "result2"; }
    private void process(String r1, String r2) {}
    private void handleRecovery(RecoverableException e) {}
    private Result processItem(Item item) throws Exception {
        return new Result(item.id(), item.data());
    }
}
```

## Migration Strategies

### Identifying Migration Candidates

```java
public class MigrationAnalysis {

    // Before: Traditional thread pool with fixed size
    public class BeforeTraditionalService {
        private final ExecutorService executor = Executors.newFixedThreadPool(100);

        public void handleRequest(Request request) {
            executor.submit(() -> {
                try {
                    // These operations block waiting for I/O
                    String userData = fetchFromDatabase(request.userId());
                    String enriched = callExternalApi(userData);
                    saveToDatabase(enriched);
                } catch (Exception e) {
                    handleError(e);
                }
            });
        }

        // GOOD MIGRATION CANDIDATE:
        // - I/O-bound operations (database, API calls)
        // - Simple request-response pattern
        // - Thread pool limits concurrency artificially
    }

    // After: Virtual threads
    public class AfterVirtualThreadService {
        private final ExecutorService executor =
            Executors.newVirtualThreadPerTaskExecutor();

        public void handleRequest(Request request) {
            executor.submit(() -> {
                try {
                    // Same blocking code, now scales to millions of requests
                    String userData = fetchFromDatabase(request.userId());
                    String enriched = callExternalApi(userData);
                    saveToDatabase(enriched);
                } catch (Exception e) {
                    handleError(e);
                }
            });
        }
    }

    record Request(String userId, String data) {}

    private String fetchFromDatabase(String userId) throws Exception { return "data"; }
    private String callExternalApi(String data) throws Exception { return "enriched"; }
    private void saveToDatabase(String data) throws Exception {}
    private void handleError(Exception e) {}
}
```

### Gradual Migration Strategy

```java
public class GradualMigration {

    // Step 1: Create abstraction for executor selection
    public class ExecutorProvider {
        private final boolean useVirtualThreads;

        public ExecutorProvider() {
            this.useVirtualThreads = Boolean.getBoolean("app.useVirtualThreads");
        }

        public ExecutorService createExecutor() {
            if (useVirtualThreads) {
                System.out.println("Using virtual threads");
                return Executors.newVirtualThreadPerTaskExecutor();
            } else {
                System.out.println("Using platform threads");
                return Executors.newFixedThreadPool(
                    Runtime.getRuntime().availableProcessors() * 2
                );
            }
        }
    }

    // Step 2: Update services to use provider
    public class MigratableService {
        private final ExecutorService executor;

        public MigratableService(ExecutorProvider provider) {
            this.executor = provider.createExecutor();
        }

        public CompletableFuture<String> processAsync(String input) {
            CompletableFuture<String> future = new CompletableFuture<>();
            executor.submit(() -> {
                try {
                    String result = process(input);
                    future.complete(result);
                } catch (Exception e) {
                    future.completeExceptionally(e);
                }
            });
            return future;
        }

        private String process(String input) throws Exception {
            Thread.sleep(100);
            return "Processed: " + input;
        }
    }

    // Step 3: Toggle via configuration
    // -Dapp.useVirtualThreads=true java -jar myapp.jar

    // Step 4: Monitor and compare performance
    public class MigrationMonitor {
        private final AtomicLong requestCount = new AtomicLong();
        private final AtomicLong totalLatency = new AtomicLong();

        public void recordRequest(long latencyMs) {
            requestCount.incrementAndGet();
            totalLatency.addAndGet(latencyMs);
        }

        public void reportStats() {
            long count = requestCount.get();
            long total = totalLatency.get();
            System.out.printf("Requests: %d, Avg Latency: %.2f ms%n",
                count, count > 0 ? (double) total / count : 0);
        }
    }
}
```

### Spring Boot Migration

```java
// Spring Boot 3.2+ has built-in virtual thread support

// application.properties:
// spring.threads.virtual.enabled=true

// Or configure programmatically:
@Configuration
public class VirtualThreadConfig {

    @Bean
    @ConditionalOnProperty(name = "app.virtual-threads.enabled", havingValue = "true")
    public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadCustomizer() {
        return protocolHandler -> {
            protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        };
    }

    // For async operations
    @Bean
    @ConditionalOnProperty(name = "app.virtual-threads.enabled", havingValue = "true")
    public AsyncTaskExecutor applicationTaskExecutor() {
        return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
    }

    // For scheduled tasks
    @Bean
    @ConditionalOnProperty(name = "app.virtual-threads.enabled", havingValue = "true")
    public TaskSchedulerCustomizer taskSchedulerCustomizer() {
        return taskScheduler -> {
            taskScheduler.setVirtualThreads(true);
        };
    }
}

// Service using virtual threads
@Service
public class UserService {

    private final UserRepository userRepository;
    private final ExternalApiClient apiClient;

    public UserService(UserRepository userRepository, ExternalApiClient apiClient) {
        this.userRepository = userRepository;
        this.apiClient = apiClient;
    }

    // This method will run in a virtual thread when virtual threads are enabled
    public UserProfile getUserProfile(String userId) {
        // Blocking database call - works great with virtual threads
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        // Blocking API call - works great with virtual threads
        List<Order> orders = apiClient.getOrders(userId);

        return new UserProfile(user, orders);
    }
}
```

### Library Compatibility Checklist

```java
public class CompatibilityChecklist {

    /*
     * COMPATIBLE LIBRARIES (work well with virtual threads):
     *
     * JDBC Drivers (most modern versions):
     * - PostgreSQL JDBC 42.x
     * - MySQL Connector/J 8.x
     * - Oracle JDBC 21c+
     * - H2, HSQLDB
     *
     * HTTP Clients:
     * - java.net.http.HttpClient (built-in)
     * - Apache HttpClient 5.x
     * - OkHttp 4.x (with care)
     *
     * Frameworks:
     * - Spring Boot 3.2+
     * - Quarkus 3.x
     * - Micronaut 4.x
     * - Helidon 4.x
     *
     * PARTIALLY COMPATIBLE (may need configuration):
     *
     * - Netty-based libraries (use blocking wrapper)
     * - Some connection pools (check pool size settings)
     * - Logging frameworks (may have synchronized blocks)
     *
     * REQUIRES ATTENTION:
     *
     * - Libraries using synchronized heavily
     * - JNI/native libraries
     * - Libraries with ThreadLocal state
     * - Custom thread pools
     */

    // Example: Check library compatibility
    public void checkCompatibility() {
        // Enable pinning detection during testing
        System.setProperty("jdk.tracePinnedThreads", "full");

        // Run representative workload and check for pinning warnings
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(this::typicalWorkload);
            }
        }
    }

    private void typicalWorkload() {
        // Test all typical operations your app performs
        // Check console for pinning warnings
    }
}
```

## Real-World Examples

### High-Throughput Web Scraper

```java
import java.net.http.*;
import java.net.URI;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

public class WebScraper {

    private final HttpClient httpClient;
    private final Semaphore rateLimiter;
    private final Map<String, String> results = new ConcurrentHashMap<>();

    public WebScraper(int maxConcurrentRequests) {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .build();
        this.rateLimiter = new Semaphore(maxConcurrentRequests);
    }

    public Map<String, String> scrapeUrls(List<String> urls) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            Map<StructuredTaskScope.Subtask<PageContent>, String> tasks = new HashMap<>();

            for (String url : urls) {
                var task = scope.fork(() -> fetchPage(url));
                tasks.put(task, url);
            }

            scope.join();

            for (var entry : tasks.entrySet()) {
                var task = entry.getKey();
                var url = entry.getValue();

                if (task.state() == StructuredTaskScope.Subtask.State.SUCCESS) {
                    PageContent content = task.get();
                    results.put(url, content.body());
                } else if (task.state() == StructuredTaskScope.Subtask.State.FAILED) {
                    results.put(url, "ERROR: " + task.exception().getMessage());
                }
            }

            return new HashMap<>(results);
        }
    }

    private PageContent fetchPage(String url) throws Exception {
        rateLimiter.acquire();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofString()
            );

            return new PageContent(
                url,
                response.statusCode(),
                response.body()
            );
        } finally {
            rateLimiter.release();
        }
    }

    record PageContent(String url, int statusCode, String body) {}

    public static void main(String[] args) throws Exception {
        WebScraper scraper = new WebScraper(100);

        List<String> urls = List.of(
            "https://example.com",
            "https://httpbin.org/get",
            "https://httpbin.org/ip"
            // Add more URLs...
        );

        long start = System.currentTimeMillis();
        Map<String, String> results = scraper.scrapeUrls(urls);
        long duration = System.currentTimeMillis() - start;

        System.out.printf("Scraped %d URLs in %d ms%n", results.size(), duration);
        results.forEach((url, content) ->
            System.out.printf("%s: %d chars%n", url, content.length())
        );
    }
}
```

### Database Connection Pool with Virtual Threads

```java
import javax.sql.DataSource;
import java.sql.*;
import java.util.concurrent.*;

public class VirtualThreadDatabaseService {

    private final DataSource dataSource;
    private final Semaphore connectionLimiter;

    public VirtualThreadDatabaseService(DataSource dataSource, int maxConnections) {
        this.dataSource = dataSource;
        // Limit concurrent database connections
        this.connectionLimiter = new Semaphore(maxConnections);
    }

    public <T> T executeQuery(String sql, ResultSetMapper<T> mapper) throws Exception {
        connectionLimiter.acquire();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            return mapper.map(rs);
        } finally {
            connectionLimiter.release();
        }
    }

    public int executeUpdate(String sql, Object... params) throws Exception {
        connectionLimiter.acquire();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                stmt.setObject(i + 1, params[i]);
            }
            return stmt.executeUpdate();
        } finally {
            connectionLimiter.release();
        }
    }

    // Batch processing with virtual threads
    public void processBatch(List<BatchItem> items) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            for (BatchItem item : items) {
                scope.fork(() -> {
                    executeUpdate(
                        "INSERT INTO items (id, data) VALUES (?, ?)",
                        item.id(),
                        item.data()
                    );
                    return null;
                });
            }

            scope.join();
            scope.throwIfFailed();
        }
    }

    // Parallel queries with result aggregation
    public DashboardData loadDashboard(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var userTask = scope.fork(() ->
                executeQuery(
                    "SELECT * FROM users WHERE id = ?",
                    rs -> rs.next() ? new User(rs.getString("id"), rs.getString("name")) : null
                )
            );

            var ordersTask = scope.fork(() ->
                executeQuery(
                    "SELECT * FROM orders WHERE user_id = ?",
                    rs -> {
                        List<Order> orders = new ArrayList<>();
                        while (rs.next()) {
                            orders.add(new Order(rs.getString("id"), rs.getBigDecimal("total")));
                        }
                        return orders;
                    }
                )
            );

            var statsTask = scope.fork(() ->
                executeQuery(
                    "SELECT COUNT(*) as count, SUM(total) as sum FROM orders WHERE user_id = ?",
                    rs -> rs.next() ? new Stats(rs.getInt("count"), rs.getBigDecimal("sum")) : null
                )
            );

            scope.join();
            scope.throwIfFailed();

            return new DashboardData(userTask.get(), ordersTask.get(), statsTask.get());
        }
    }

    @FunctionalInterface
    interface ResultSetMapper<T> {
        T map(ResultSet rs) throws SQLException;
    }

    record BatchItem(String id, String data) {}
    record User(String id, String name) {}
    record Order(String id, java.math.BigDecimal total) {}
    record Stats(int count, java.math.BigDecimal total) {}
    record DashboardData(User user, List<Order> orders, Stats stats) {}
}
```

### Microservice with Virtual Threads

```java
public class OrderProcessingService {

    private static final ScopedValue<RequestContext> REQUEST_CTX = ScopedValue.newInstance();

    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final ShippingClient shippingClient;
    private final NotificationClient notificationClient;
    private final OrderRepository orderRepository;

    public OrderProcessingService(
            InventoryClient inventoryClient,
            PaymentClient paymentClient,
            ShippingClient shippingClient,
            NotificationClient notificationClient,
            OrderRepository orderRepository) {
        this.inventoryClient = inventoryClient;
        this.paymentClient = paymentClient;
        this.shippingClient = shippingClient;
        this.notificationClient = notificationClient;
        this.orderRepository = orderRepository;
    }

    public OrderResult processOrder(OrderRequest request) throws Exception {
        RequestContext ctx = new RequestContext(
            UUID.randomUUID().toString(),
            request.userId(),
            Instant.now()
        );

        return ScopedValue.callWhere(REQUEST_CTX, ctx, () -> {
            return doProcessOrder(request);
        });
    }

    private OrderResult doProcessOrder(OrderRequest request) throws Exception {
        // Step 1: Validate inventory for all items in parallel
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            Map<String, StructuredTaskScope.Subtask<InventoryStatus>> inventoryChecks =
                new HashMap<>();

            for (OrderItem item : request.items()) {
                var task = scope.fork(() ->
                    inventoryClient.checkAvailability(item.productId(), item.quantity())
                );
                inventoryChecks.put(item.productId(), task);
            }

            scope.join();
            scope.throwIfFailed();

            // Verify all items are available
            for (var entry : inventoryChecks.entrySet()) {
                InventoryStatus status = entry.getValue().get();
                if (!status.available()) {
                    return OrderResult.failed("Item not available: " + entry.getKey());
                }
            }
        }

        // Step 2: Reserve inventory and process payment in parallel
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var reservationTask = scope.fork(() ->
                inventoryClient.reserveItems(request.items())
            );

            var paymentTask = scope.fork(() ->
                paymentClient.processPayment(
                    request.userId(),
                    request.paymentMethod(),
                    calculateTotal(request.items())
                )
            );

            scope.join();
            scope.throwIfFailed();

            Reservation reservation = reservationTask.get();
            PaymentResult payment = paymentTask.get();

            if (!payment.successful()) {
                // Rollback reservation
                inventoryClient.cancelReservation(reservation.id());
                return OrderResult.failed("Payment failed: " + payment.message());
            }

            // Step 3: Create order and initiate shipping
            Order order = orderRepository.createOrder(
                request.userId(),
                request.items(),
                reservation.id(),
                payment.transactionId()
            );

            // Step 4: Async post-processing (fire and forget with error handling)
            try (var postScope = new StructuredTaskScope<Void>()) {
                postScope.fork(() -> {
                    shippingClient.initiateShipment(order.id(), request.shippingAddress());
                    return null;
                });

                postScope.fork(() -> {
                    notificationClient.sendOrderConfirmation(
                        request.userId(),
                        order.id()
                    );
                    return null;
                });

                postScope.join();
                // Don't throw on failure - these are non-critical
            }

            return OrderResult.success(order.id());
        }
    }

    private java.math.BigDecimal calculateTotal(List<OrderItem> items) {
        return items.stream()
            .map(item -> item.price().multiply(java.math.BigDecimal.valueOf(item.quantity())))
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }

    // Records and interfaces
    record RequestContext(String traceId, String userId, Instant timestamp) {}
    record OrderRequest(String userId, List<OrderItem> items,
                       PaymentMethod paymentMethod, Address shippingAddress) {}
    record OrderItem(String productId, int quantity, java.math.BigDecimal price) {}
    record OrderResult(boolean success, String orderId, String errorMessage) {
        static OrderResult success(String orderId) {
            return new OrderResult(true, orderId, null);
        }
        static OrderResult failed(String message) {
            return new OrderResult(false, null, message);
        }
    }
    record InventoryStatus(boolean available, int quantity) {}
    record Reservation(String id, Instant expiresAt) {}
    record PaymentResult(boolean successful, String transactionId, String message) {}
    record Order(String id, String userId, List<OrderItem> items) {}
    record PaymentMethod(String type, String token) {}
    record Address(String street, String city, String zipCode) {}

    // Client interfaces
    interface InventoryClient {
        InventoryStatus checkAvailability(String productId, int quantity) throws Exception;
        Reservation reserveItems(List<OrderItem> items) throws Exception;
        void cancelReservation(String reservationId) throws Exception;
    }

    interface PaymentClient {
        PaymentResult processPayment(String userId, PaymentMethod method,
                                    java.math.BigDecimal amount) throws Exception;
    }

    interface ShippingClient {
        void initiateShipment(String orderId, Address address) throws Exception;
    }

    interface NotificationClient {
        void sendOrderConfirmation(String userId, String orderId) throws Exception;
    }

    interface OrderRepository {
        Order createOrder(String userId, List<OrderItem> items,
                         String reservationId, String transactionId) throws Exception;
    }
}
```

## Debugging and Monitoring

### JFR Events for Virtual Threads

```java
public class VirtualThreadMonitoring {

    public static void main(String[] args) throws Exception {
        // Start JFR recording
        // java -XX:StartFlightRecording=filename=recording.jfr,settings=profile ...

        // Or programmatically
        enableJfrRecording();

        // Run workload
        runVirtualThreadWorkload();

        // Analyze recording with JDK Mission Control or programmatically
    }

    private static void enableJfrRecording() throws Exception {
        // Requires jdk.jfr module
        var recording = new jdk.jfr.Recording();
        recording.enable("jdk.VirtualThreadStart");
        recording.enable("jdk.VirtualThreadEnd");
        recording.enable("jdk.VirtualThreadPinned");
        recording.enable("jdk.VirtualThreadSubmitFailed");
        recording.start();
    }

    private static void runVirtualThreadWorkload() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10000; i++) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
        }
    }
}
```

### Thread Dumps with Virtual Threads

```java
public class ThreadDumpDemo {

    public static void main(String[] args) throws Exception {
        // Virtual threads appear in thread dumps with their state
        Thread vt = Thread.startVirtualThread(() -> {
            try {
                System.out.println("Virtual thread running: " + Thread.currentThread());
                Thread.sleep(60000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        Thread.sleep(1000);

        // Get thread dump (in production, use jcmd or jstack)
        // jcmd <pid> Thread.dump_to_file -format=json threads.json

        // Programmatic approach
        Thread.getAllStackTraces().forEach((thread, stack) -> {
            if (thread.isVirtual()) {
                System.out.println("Virtual thread: " + thread.getName());
                System.out.println("  State: " + thread.getState());
                for (StackTraceElement element : stack) {
                    System.out.println("    " + element);
                }
            }
        });

        vt.interrupt();
        vt.join();
    }
}
```

### Custom Metrics and Observability

```java
import java.util.concurrent.atomic.*;

public class VirtualThreadMetrics {

    private final AtomicLong activeVirtualThreads = new AtomicLong();
    private final AtomicLong totalVirtualThreadsCreated = new AtomicLong();
    private final AtomicLong totalBlockingTime = new AtomicLong();
    private final AtomicLong tasksCompleted = new AtomicLong();
    private final AtomicLong tasksFailed = new AtomicLong();

    private final ThreadFactory instrumentedFactory;

    public VirtualThreadMetrics() {
        this.instrumentedFactory = createInstrumentedFactory();
    }

    private ThreadFactory createInstrumentedFactory() {
        return runnable -> {
            totalVirtualThreadsCreated.incrementAndGet();

            return Thread.ofVirtual()
                .name("instrumented-vt-", totalVirtualThreadsCreated.get())
                .unstarted(() -> {
                    activeVirtualThreads.incrementAndGet();
                    long startTime = System.nanoTime();
                    try {
                        runnable.run();
                        tasksCompleted.incrementAndGet();
                    } catch (Exception e) {
                        tasksFailed.incrementAndGet();
                        throw e;
                    } finally {
                        activeVirtualThreads.decrementAndGet();
                        long duration = System.nanoTime() - startTime;
                        totalBlockingTime.addAndGet(duration);
                    }
                });
        };
    }

    public ExecutorService createInstrumentedExecutor() {
        return Executors.newThreadPerTaskExecutor(instrumentedFactory);
    }

    public void reportMetrics() {
        System.out.println("Virtual Thread Metrics:");
        System.out.println("  Active threads: " + activeVirtualThreads.get());
        System.out.println("  Total created: " + totalVirtualThreadsCreated.get());
        System.out.println("  Tasks completed: " + tasksCompleted.get());
        System.out.println("  Tasks failed: " + tasksFailed.get());
        System.out.printf("  Total blocking time: %.2f seconds%n",
            totalBlockingTime.get() / 1_000_000_000.0);
    }

    // Integration with Micrometer (for production)
    /*
    public void registerMicrometerMetrics(MeterRegistry registry) {
        Gauge.builder("virtual_threads.active", activeVirtualThreads, AtomicLong::get)
            .register(registry);
        Counter.builder("virtual_threads.created")
            .register(registry);
        Counter.builder("virtual_threads.completed")
            .register(registry);
        Counter.builder("virtual_threads.failed")
            .register(registry);
    }
    */

    public static void main(String[] args) throws Exception {
        VirtualThreadMetrics metrics = new VirtualThreadMetrics();

        try (var executor = metrics.createInstrumentedExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
        }

        metrics.reportMetrics();
    }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Pooling Virtual Threads

```java
public class PoolingPitfall {

    // WRONG: Pooling defeats the purpose of virtual threads
    public void wrongApproach() {
        ExecutorService pool = Executors.newFixedThreadPool(100,
            Thread.ofVirtual().factory());
        // This limits concurrency to 100, even though virtual threads are cheap
    }

    // CORRECT: One thread per task
    public void correctApproach() {
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        // Unlimited virtual threads, JVM manages carrier pool
    }
}
```

### Pitfall 2: Using synchronized for Blocking Code

```java
public class SynchronizedPitfall {
    private final Object lock = new Object();
    private final ReentrantLock reentrantLock = new ReentrantLock();

    // WRONG: Causes pinning
    public void wrongApproach() {
        synchronized (lock) {
            performBlockingIO();  // Thread is pinned here
        }
    }

    // CORRECT: Use ReentrantLock
    public void correctApproach() {
        reentrantLock.lock();
        try {
            performBlockingIO();  // Thread can unmount
        } finally {
            reentrantLock.unlock();
        }
    }

    private void performBlockingIO() {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### Pitfall 3: Ignoring Carrier Thread Starvation

```java
public class CarrierStarvationPitfall {

    // WRONG: CPU-intensive work can starve carriers
    public void wrongApproach() {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> {
                    // Heavy CPU computation doesn't yield
                    computeFibonacci(45);
                });
            }
        }
    }

    // CORRECT: Use platform threads for CPU-intensive work
    public void correctApproach() {
        // Virtual threads for I/O
        var ioExecutor = Executors.newVirtualThreadPerTaskExecutor();

        // Platform threads for CPU work
        var cpuExecutor = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors()
        );

        try {
            // I/O tasks use virtual threads
            ioExecutor.submit(this::fetchFromDatabase);

            // CPU tasks use platform threads
            cpuExecutor.submit(() -> computeFibonacci(45));
        } finally {
            ioExecutor.shutdown();
            cpuExecutor.shutdown();
        }
    }

    private long computeFibonacci(int n) {
        if (n <= 1) return n;
        return computeFibonacci(n - 1) + computeFibonacci(n - 2);
    }

    private void fetchFromDatabase() {}
}
```

### Pitfall 4: ThreadLocal Abuse

```java
public class ThreadLocalPitfall {

    // WRONG: ThreadLocal with large objects and many virtual threads
    private static final ThreadLocal<byte[]> BUFFER =
        ThreadLocal.withInitial(() -> new byte[1024 * 1024]);  // 1MB per thread!

    public void wrongApproach() {
        // With millions of virtual threads, this consumes terabytes
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1_000_000; i++) {
                executor.submit(() -> {
                    byte[] buffer = BUFFER.get();
                    processWithBuffer(buffer);
                });
            }
        }
    }

    // CORRECT: Use ScopedValue or pass explicitly
    private static final ScopedValue<byte[]> BUFFER_SCOPED = ScopedValue.newInstance();

    public void correctApproach() {
        byte[] sharedBuffer = new byte[1024 * 1024];

        ScopedValue.runWhere(BUFFER_SCOPED, sharedBuffer, () -> {
            // Process with shared buffer
            // Or better: allocate per-task and size appropriately
        });
    }

    private void processWithBuffer(byte[] buffer) {}
}
```

### Pitfall 5: Not Handling Cancellation

```java
public class CancellationPitfall {

    // WRONG: Ignoring interruption
    public void wrongApproach() {
        Thread.startVirtualThread(() -> {
            while (true) {
                doWork();  // Never checks for interruption
            }
        });
    }

    // CORRECT: Respond to interruption
    public void correctApproach() {
        Thread vt = Thread.startVirtualThread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    doWork();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;  // Exit loop
                }
            }
            cleanup();
        });

        // Later: cancel gracefully
        vt.interrupt();
    }

    private void doWork() throws InterruptedException {
        Thread.sleep(100);
    }

    private void cleanup() {
        System.out.println("Cleaning up...");
    }
}
```

## Conclusion

Virtual threads represent a fundamental shift in how Java applications handle concurrency. By enabling the simple "thread-per-request" model at massive scale, they eliminate the traditional tradeoff between code simplicity and application scalability.

### Key Takeaways

1. **Virtual threads are for I/O-bound workloads**: They excel when your application spends most of its time waiting for I/O operations like database queries, HTTP requests, or file operations.

2. **Don't pool virtual threads**: Create them on-demand using `Executors.newVirtualThreadPerTaskExecutor()` or `Thread.startVirtualThread()`.

3. **Avoid pinning**: Replace `synchronized` blocks containing blocking operations with `ReentrantLock`, and be aware of native code implications.

4. **Use structured concurrency**: Organize concurrent tasks into scopes that match your application's logical structure.

5. **Migrate incrementally**: Start with I/O-bound services, enable pinning detection, and monitor performance differences.

6. **Combine with platform threads**: Use platform threads for CPU-intensive work and virtual threads for I/O operations.

Virtual threads, combined with structured concurrency and scoped values, provide a complete toolkit for building highly concurrent, maintainable Java applications. As the ecosystem matures and libraries optimize for virtual threads, their benefits will become even more pronounced.

## References

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 453: Structured Concurrency](https://openjdk.org/jeps/453)
- [JEP 464: Scoped Values](https://openjdk.org/jeps/464)
- [Java 21 Virtual Threads Documentation](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [Project Loom Wiki](https://wiki.openjdk.org/display/loom)
- [Spring Boot Virtual Threads Support](https://spring.io/blog/2023/09/09/all-together-now-spring-boot-3-2-graalvm-native-images-java-21-and-virtual)
