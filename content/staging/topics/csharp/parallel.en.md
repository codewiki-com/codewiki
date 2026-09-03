---
title: C# Parallel 并行编程
description: 深入掌握 C# Parallel 类：Parallel.For、Parallel.ForEach、Parallel.Invoke、PLINQ 与数据分区策略
track: csharp
section: async
difficulty: intermediate
tags:
  - C#
  - Parallel
  - 并行编程
  - PLINQ
  - TPL
status: imported
origin: old/src/content/docs/csharp/parallel.en.md
divergence: 0.195
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 并发编程
  order: 3
  lastUpdated: 2026-01-07
---

In the era of modern multi-core processors, fully utilizing the CPU's parallel computing capability is crucial for improving application performance. The `Parallel` class in C# is a core component of the Task Parallel Library (TPL), providing a concise yet powerful API for implementing data parallelism and task parallelism.

## Concept Explanation

### What is Parallel Programming?

Parallel programming is a programming paradigm that executes multiple computational tasks simultaneously. Unlike traditional serial execution, parallel programming allows programs to distribute workloads across multiple processor cores for concurrent execution, significantly improving the efficiency of compute-intensive tasks.

### The Role of the Parallel Class

The `System.Threading.Tasks.Parallel` class is part of the Task Parallel Library (TPL) introduced in .NET Framework 4.0. It primarily addresses the following challenges:

1. **Simplifying Parallel Loops**: Convert ordinary loops to parallel execution without manually managing threads
2. **Automatic Load Balancing**: The runtime automatically distributes work based on available cores
3. **Exception Aggregation**: Unified handling of multiple exceptions during parallel execution
4. **Cancellation Support**: Built-in cancellation token support for graceful termination of parallel operations

### Parallel vs Concurrent vs Async

| Concept | Definition | Use Cases |
|---------|------------|-----------|
| **Parallel** | Multiple tasks executing simultaneously on different cores | CPU-intensive tasks |
| **Concurrent** | Multiple tasks executing alternately, sharing time slices | Task switching, resource sharing |
| **Async** | Non-blocking waiting for operation completion | I/O-intensive tasks |

```csharp
// Parallel: True simultaneous execution
Parallel.For(0, 100, i => ComputeIntensive(i));

// Concurrent: Threads executing alternately
var tasks = Enumerable.Range(0, 100)
    .Select(i => Task.Run(() => ComputeIntensive(i)));

// Async: Non-blocking waiting
await httpClient.GetStringAsync(url);
```

## Core Principles

### Work-Stealing Algorithm

The Parallel class uses the thread pool and work-stealing algorithm under the hood to achieve efficient task scheduling:

```
┌─────────────────────────────────────────────────────────────┐
│                     ThreadPool                               │
├─────────────────────────────────────────────────────────────┤
│  Thread1 Queue   Thread2 Queue   Thread3 Queue   Thread4 Queue │
│  ┌─────┐        ┌─────┐        ┌─────┐        ┌─────┐         │
│  │TaskA│        │TaskD│        │TaskG│        │Empty│ ← Steal │
│  │TaskB│        │TaskE│        │TaskH│        │     │         │
│  │TaskC│        │TaskF│        │TaskI│        │     │         │
│  └─────┘        └─────┘        └─────┘        └─────┘         │
│     ↓              ↓              ↓              ↑            │
│  Execute       Execute       Execute     Steal from others    │
└─────────────────────────────────────────────────────────────┘
```

When a thread completes all tasks in its queue, it attempts to "steal" tasks from other threads' queues, thereby maintaining utilization of all cores.

### Partitioning Strategy

The Parallel class uses a Partitioner to divide the data source into multiple chunks:

```csharp
// Default partitioning: Range partitioning
// Divides 0-999 into multiple consecutive ranges
Parallel.For(0, 1000, i => Process(i));

// Internally similar to:
// Thread1: Process 0-249
// Thread2: Process 250-499
// Thread3: Process 500-749
// Thread4: Process 750-999
```

### Task Scheduler

```csharp
// Uses thread pool scheduler by default
TaskScheduler.Default

// Custom scheduler can be specified
ParallelOptions options = new ParallelOptions
{
    TaskScheduler = new LimitedConcurrencyLevelTaskScheduler(2)
};
```

## Key Points

### Core Methods of the Parallel Class

| Method | Purpose | Use Cases |
|--------|---------|-----------|
| `Parallel.For` | Parallelize indexed loops | Array/list processing requiring index access |
| `Parallel.ForEach` | Parallelize collection iteration | General collection processing |
| `Parallel.Invoke` | Execute multiple independent operations in parallel | Independent task batch processing |
| `Parallel.ForEachAsync` | Async parallel iteration (.NET 6+) | Parallel processing of async I/O operations |

### ParallelOptions Configuration

```csharp
ParallelOptions options = new ParallelOptions
{
    // Maximum degree of parallelism: limits concurrent operations
    // -1 means unlimited (uses all available cores)
    MaxDegreeOfParallelism = Environment.ProcessorCount,

    // Cancellation token: used to cancel parallel operations
    CancellationToken = cancellationTokenSource.Token,

    // Task scheduler: controls how tasks are scheduled
    TaskScheduler = TaskScheduler.Default
};
```

### Return Value ParallelLoopResult

```csharp
ParallelLoopResult result = Parallel.For(0, 100, (i, state) =>
{
    if (ShouldStop(i))
    {
        state.Break(); // or state.Stop()
    }
});

// Check if the loop completed
Console.WriteLine($"Completed: {result.IsCompleted}");
Console.WriteLine($"Lowest break iteration: {result.LowestBreakIteration}");
```

## Code Examples

### Parallel.For Basic Usage

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

public class ParallelForExamples
{
    // Basic Parallel.For
    public void BasicParallelFor()
    {
        int[] results = new int[100];

        Parallel.For(0, 100, i =>
        {
            results[i] = ComputeSquare(i);
            Console.WriteLine($"Index {i} executed on thread {Thread.CurrentThread.ManagedThreadId}");
        });

        Console.WriteLine($"Computation complete, result count: {results.Length}");
    }

    // Parallel.For with options
    public void ParallelForWithOptions()
    {
        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 4  // Use at most 4 threads
        };

        Parallel.For(0, 1000, options, i =>
        {
            // CPU-intensive computation
            double result = 0;
            for (int j = 0; j < 10000; j++)
            {
                result += Math.Sqrt(i * j);
            }
        });
    }

    // Parallel.For with cancellation support
    public async Task ParallelForWithCancellation()
    {
        using CancellationTokenSource cts = new CancellationTokenSource();

        // Cancel after 3 seconds
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        ParallelOptions options = new ParallelOptions
        {
            CancellationToken = cts.Token
        };

        try
        {
            Parallel.For(0, int.MaxValue, options, i =>
            {
                Thread.Sleep(100);  // Simulate time-consuming operation
                Console.WriteLine($"Processing {i}");
            });
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation was canceled");
        }
    }

    // Parallel.For with local state (performance optimization)
    public long ParallelForWithLocalState()
    {
        long totalSum = 0;
        object lockObj = new object();

        Parallel.For(0, 10000,
            // Initialize local state for each thread
            () => 0L,

            // Loop body: use local state
            (i, state, localSum) =>
            {
                return localSum + i;
            },

            // Merge local state into global result
            localSum =>
            {
                lock (lockObj)
                {
                    totalSum += localSum;
                }
            }
        );

        return totalSum;
    }

    // Using Interlocked instead of locks (more efficient)
    public long ParallelForWithInterlocked()
    {
        long totalSum = 0;

        Parallel.For(0, 10000,
            () => 0L,
            (i, state, localSum) => localSum + i,
            localSum => Interlocked.Add(ref totalSum, localSum)
        );

        return totalSum;
    }

    private int ComputeSquare(int n)
    {
        Thread.SpinWait(1000);  // Simulate computation
        return n * n;
    }
}
```

### Parallel.ForEach In Detail

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

public class ParallelForEachExamples
{
    // Basic Parallel.ForEach
    public void BasicParallelForEach()
    {
        List<string> urls = new List<string>
        {
            "https://api1.example.com",
            "https://api2.example.com",
            "https://api3.example.com",
            "https://api4.example.com"
        };

        ConcurrentBag<string> results = new ConcurrentBag<string>();

        Parallel.ForEach(urls, url =>
        {
            string content = DownloadContent(url);
            results.Add(content);
        });

        Console.WriteLine($"Download complete: {results.Count} files");
    }

    // Parallel.ForEach with index
    public void ParallelForEachWithIndex()
    {
        string[] items = { "apple", "banana", "cherry", "date", "elderberry" };

        Parallel.ForEach(items, (item, state, index) =>
        {
            Console.WriteLine($"[{index}] {item} - Thread {Thread.CurrentThread.ManagedThreadId}");
        });
    }

    // Parallel.ForEach with local state
    public Dictionary<string, int> CountWordFrequencies(IEnumerable<string> documents)
    {
        ConcurrentDictionary<string, int> globalCounts = new ConcurrentDictionary<string, int>();

        Parallel.ForEach(documents,
            // Initialize thread-local dictionary
            () => new Dictionary<string, int>(),

            // Process each document
            (document, state, localCounts) =>
            {
                foreach (string word in document.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    string normalized = word.ToLowerInvariant();
                    if (localCounts.ContainsKey(normalized))
                        localCounts[normalized]++;
                    else
                        localCounts[normalized] = 1;
                }
                return localCounts;
            },

            // Merge local results into global
            localCounts =>
            {
                foreach (var kvp in localCounts)
                {
                    globalCounts.AddOrUpdate(kvp.Key, kvp.Value,
                        (key, oldValue) => oldValue + kvp.Value);
                }
            }
        );

        return new Dictionary<string, int>(globalCounts);
    }

    // Using Break for early termination
    public int? FindFirstMatch(int[] numbers, Predicate<int> predicate)
    {
        int? result = null;
        object lockObj = new object();

        Parallel.ForEach(numbers, (number, state) =>
        {
            if (predicate(number))
            {
                lock (lockObj)
                {
                    if (!result.HasValue || number < result.Value)
                    {
                        result = number;
                    }
                }
                state.Break();  // Request to break subsequent iterations
            }
        });

        return result;
    }

    // Using Stop for immediate termination
    public bool ContainsInvalid(IEnumerable<string> items)
    {
        bool found = false;

        Parallel.ForEach(items, (item, state) =>
        {
            if (IsInvalid(item))
            {
                found = true;
                state.Stop();  // Immediately stop all iterations
            }
        });

        return found;
    }

    private string DownloadContent(string url)
    {
        Thread.Sleep(500);  // Simulate network latency
        return $"Content from {url}";
    }

    private bool IsInvalid(string item) => item.Contains("invalid");
}
```

### Parallel.Invoke Usage

```csharp
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

public class ParallelInvokeExamples
{
    // Basic Parallel.Invoke
    public void BasicParallelInvoke()
    {
        Stopwatch sw = Stopwatch.StartNew();

        Parallel.Invoke(
            () => Task1(),
            () => Task2(),
            () => Task3()
        );

        sw.Stop();
        Console.WriteLine($"Parallel execution time: {sw.ElapsedMilliseconds}ms");
        // If each task takes 1 second, parallel execution completes in about 1 second
    }

    // Compare with serial execution
    public void SerialExecution()
    {
        Stopwatch sw = Stopwatch.StartNew();

        Task1();
        Task2();
        Task3();

        sw.Stop();
        Console.WriteLine($"Serial execution time: {sw.ElapsedMilliseconds}ms");
        // Serial execution takes about 3 seconds
    }

    // Parallel.Invoke with options
    public void ParallelInvokeWithOptions()
    {
        using CancellationTokenSource cts = new CancellationTokenSource();

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 2,
            CancellationToken = cts.Token
        };

        try
        {
            Parallel.Invoke(options,
                () => LongRunningTask("TaskA"),
                () => LongRunningTask("TaskB"),
                () => LongRunningTask("TaskC"),
                () => LongRunningTask("TaskD")
            );
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation was canceled");
        }
    }

    // Practical application: Data processing pipeline
    public void DataProcessingPipeline(string[] data)
    {
        string[] step1Results = null;
        string[] step2Results = null;
        string[] step3Results = null;

        // Phase 1: Three independent processing steps execute in parallel
        Parallel.Invoke(
            () => step1Results = ProcessStep1(data),
            () => step2Results = ProcessStep2(data),
            () => step3Results = ProcessStep3(data)
        );

        // Phase 2: Merge results
        MergeResults(step1Results, step2Results, step3Results);
    }

    // Dynamic task count
    public void DynamicParallelInvoke(int taskCount)
    {
        Action[] actions = new Action[taskCount];

        for (int i = 0; i < taskCount; i++)
        {
            int taskId = i;  // Capture loop variable
            actions[i] = () =>
            {
                Console.WriteLine($"Executing task {taskId}");
                Thread.Sleep(500);
            };
        }

        Parallel.Invoke(actions);
    }

    private void Task1()
    {
        Console.WriteLine($"Task1 started - Thread {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine("Task1 completed");
    }

    private void Task2()
    {
        Console.WriteLine($"Task2 started - Thread {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine("Task2 completed");
    }

    private void Task3()
    {
        Console.WriteLine($"Task3 started - Thread {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine("Task3 completed");
    }

    private void LongRunningTask(string name)
    {
        Console.WriteLine($"{name} started");
        Thread.Sleep(2000);
        Console.WriteLine($"{name} completed");
    }

    private string[] ProcessStep1(string[] data) => data;
    private string[] ProcessStep2(string[] data) => data;
    private string[] ProcessStep3(string[] data) => data;
    private void MergeResults(params string[][] results) { }
}
```

### PLINQ - Parallel LINQ

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public class PLINQExamples
{
    // Basic PLINQ
    public void BasicPLINQ()
    {
        int[] numbers = Enumerable.Range(1, 1000000).ToArray();

        // Use AsParallel() to enable parallel query
        var evenSquares = numbers
            .AsParallel()
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .ToArray();

        Console.WriteLine($"Found {evenSquares.Length} squares of even numbers");
    }

    // Control degree of parallelism
    public void PLINQWithDegreeOfParallelism()
    {
        int[] data = Enumerable.Range(1, 10000).ToArray();

        var result = data
            .AsParallel()
            .WithDegreeOfParallelism(4)  // Use at most 4 threads
            .Where(x => IsPrime(x))
            .ToArray();

        Console.WriteLine($"Found {result.Length} prime numbers");
    }

    // Preserve ordering
    public void PLINQWithOrdering()
    {
        int[] numbers = { 5, 3, 8, 1, 9, 2, 7, 4, 6 };

        // Default PLINQ does not guarantee order
        var unordered = numbers
            .AsParallel()
            .Select(n => n * 2)
            .ToArray();

        Console.WriteLine($"Unordered result: {string.Join(", ", unordered)}");

        // Use AsOrdered() to preserve order
        var ordered = numbers
            .AsParallel()
            .AsOrdered()
            .Select(n => n * 2)
            .ToArray();

        Console.WriteLine($"Ordered result: {string.Join(", ", ordered)}");
    }

    // Force parallel execution
    public void ForceParallelism()
    {
        var result = Enumerable.Range(1, 100)
            .AsParallel()
            .WithExecutionMode(ParallelExecutionMode.ForceParallelism)  // Force parallel
            .Select(x =>
            {
                Console.WriteLine($"Processing {x} on thread {Thread.CurrentThread.ManagedThreadId}");
                return x * 2;
            })
            .ToArray();
    }

    // Specify merge options
    public void MergeOptions()
    {
        // NotBuffered: Results returned immediately (suitable for streaming)
        var stream = Enumerable.Range(1, 1000)
            .AsParallel()
            .WithMergeOptions(ParallelMergeOptions.NotBuffered)
            .Select(x => x * 2);

        // AutoBuffered: Partial buffering (default)
        var autoBuf = Enumerable.Range(1, 1000)
            .AsParallel()
            .WithMergeOptions(ParallelMergeOptions.AutoBuffered)
            .Select(x => x * 2);

        // FullyBuffered: Complete buffering (ensures order)
        var fullyBuf = Enumerable.Range(1, 1000)
            .AsParallel()
            .WithMergeOptions(ParallelMergeOptions.FullyBuffered)
            .Select(x => x * 2);
    }

    // PLINQ aggregation
    public void PLINQAggregation()
    {
        int[] numbers = Enumerable.Range(1, 10000).ToArray();

        // Parallel sum
        int sum = numbers.AsParallel().Sum();

        // Parallel average
        double avg = numbers.AsParallel().Average();

        // Custom aggregation
        long customSum = numbers.AsParallel().Aggregate(
            0L,                              // Seed value
            (subtotal, item) => subtotal + item,  // Accumulator
            (total, subtotal) => total + subtotal, // Combiner
            total => total                    // Result selector
        );

        Console.WriteLine($"Sum: {sum}, Avg: {avg}, Custom: {customSum}");
    }

    // PLINQ cancellation
    public void PLINQWithCancellation()
    {
        using CancellationTokenSource cts = new CancellationTokenSource();

        try
        {
            var query = Enumerable.Range(1, int.MaxValue)
                .AsParallel()
                .WithCancellation(cts.Token)
                .Select(x =>
                {
                    if (x > 10000)
                    {
                        cts.Cancel();
                    }
                    return x * 2;
                });

            foreach (var item in query)
            {
                // Process results
            }
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Query was canceled");
        }
    }

    // PLINQ exception handling
    public void PLINQExceptionHandling()
    {
        int[] numbers = { 1, 2, 0, 4, 5 };

        try
        {
            var result = numbers
                .AsParallel()
                .Select(n =>
                {
                    if (n == 0) throw new DivideByZeroException();
                    return 100 / n;
                })
                .ToArray();
        }
        catch (AggregateException ae)
        {
            foreach (var ex in ae.InnerExceptions)
            {
                Console.WriteLine($"Exception: {ex.Message}");
            }
        }
    }

    // ForAll - No need to wait for all results
    public void PLINQForAll()
    {
        ConcurrentBag<int> results = new ConcurrentBag<int>();

        Enumerable.Range(1, 1000)
            .AsParallel()
            .Where(n => n % 2 == 0)
            .ForAll(n =>
            {
                // Process directly on worker thread, no need to collect results
                results.Add(ProcessItem(n));
            });

        Console.WriteLine($"Processed {results.Count} items");
    }

    // Practical application: Image processing
    public byte[][] ProcessImages(byte[][] images)
    {
        return images
            .AsParallel()
            .AsOrdered()  // Preserve image order
            .Select(image => ApplyFilter(image))
            .ToArray();
    }

    private bool IsPrime(int n)
    {
        if (n < 2) return false;
        for (int i = 2; i <= Math.Sqrt(n); i++)
        {
            if (n % i == 0) return false;
        }
        return true;
    }

    private int ProcessItem(int n) => n * 2;
    private byte[] ApplyFilter(byte[] image) => image;  // Simulate image processing
}
```

### Data Partitioning Strategies

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public class PartitioningExamples
{
    // Range partitioning (suitable for indexed access)
    public void RangePartitioning()
    {
        int[] data = Enumerable.Range(0, 10000).ToArray();

        // Create range partitioner
        var rangePartitioner = Partitioner.Create(0, data.Length, 1000);

        long totalSum = 0;
        object lockObj = new object();

        Parallel.ForEach(rangePartitioner, range =>
        {
            long localSum = 0;
            for (int i = range.Item1; i < range.Item2; i++)
            {
                localSum += data[i];
            }

            lock (lockObj)
            {
                totalSum += localSum;
            }

            Console.WriteLine($"Processing range [{range.Item1}, {range.Item2})");
        });

        Console.WriteLine($"Total sum: {totalSum}");
    }

    // Load-balancing partitioning
    public void LoadBalancingPartitioning()
    {
        // When processing time varies per element, use load-balancing partitioning
        int[] data = Enumerable.Range(0, 100).ToArray();

        var loadBalancer = Partitioner.Create(data, true);  // true = enable load balancing

        Parallel.ForEach(loadBalancer, item =>
        {
            // Simulate uneven workload
            Thread.Sleep(item % 10);
            Console.WriteLine($"Processing {item} - Thread {Thread.CurrentThread.ManagedThreadId}");
        });
    }

    // Custom partitioner
    public void CustomPartitioner()
    {
        int[] data = Enumerable.Range(0, 1000).ToArray();

        // Custom partitioning based on workload
        var customPartitioner = new ChunkPartitioner<int>(data, chunkSize: 50);

        Parallel.ForEach(customPartitioner, item =>
        {
            // Process each item
        });
    }

    // Chunk partitioning (suitable for non-indexed collections)
    public void ChunkPartitioning()
    {
        IEnumerable<int> sequence = GenerateSequence();

        // Create chunk partitioner, 100 elements per chunk
        var chunkPartitioner = Partitioner.Create(sequence);

        Parallel.ForEach(chunkPartitioner, item =>
        {
            ProcessItem(item);
        });
    }

    // Ordered partitioning
    public void OrderedPartitioning()
    {
        int[] data = Enumerable.Range(0, 1000).ToArray();

        // Create ordered partitioner
        var orderedPartitioner = Partitioner.Create(data, loadBalance: false);

        int[] results = new int[data.Length];

        Parallel.ForEach(orderedPartitioner, (item, state, index) =>
        {
            results[index] = item * 2;
        });

        // results maintains the same order as input
    }

    // Partitioning combined with PLINQ
    public void PartitioningWithPLINQ()
    {
        int[] data = Enumerable.Range(0, 10000).ToArray();

        var rangePartitioner = Partitioner.Create(0, data.Length, 500);

        var results = rangePartitioner
            .AsParallel()
            .SelectMany(range =>
            {
                int[] localResults = new int[range.Item2 - range.Item1];
                for (int i = range.Item1, j = 0; i < range.Item2; i++, j++)
                {
                    localResults[j] = data[i] * 2;
                }
                return localResults;
            })
            .ToArray();
    }

    private IEnumerable<int> GenerateSequence()
    {
        for (int i = 0; i < 1000; i++)
        {
            yield return i;
        }
    }

    private void ProcessItem(int item) { }
}

// Custom partitioner implementation
public class ChunkPartitioner<T> : Partitioner<T>
{
    private readonly IList<T> _source;
    private readonly int _chunkSize;

    public ChunkPartitioner(IList<T> source, int chunkSize)
    {
        _source = source;
        _chunkSize = chunkSize;
    }

    public override IList<IEnumerator<T>> GetPartitions(int partitionCount)
    {
        var partitions = new List<IEnumerator<T>>(partitionCount);

        for (int i = 0; i < partitionCount; i++)
        {
            partitions.Add(GetEnumerator(i, partitionCount));
        }

        return partitions;
    }

    private IEnumerator<T> GetEnumerator(int partitionIndex, int partitionCount)
    {
        int start = partitionIndex * _chunkSize;

        while (start < _source.Count)
        {
            int end = Math.Min(start + _chunkSize, _source.Count);
            for (int i = start; i < end; i++)
            {
                yield return _source[i];
            }
            start += partitionCount * _chunkSize;
        }
    }

    public override bool SupportsDynamicPartitions => true;
}
```

### Parallel.ForEachAsync (.NET 6+)

```csharp
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

public class ParallelForEachAsyncExamples
{
    private readonly HttpClient _httpClient = new HttpClient();

    // Basic async parallel
    public async Task BasicForEachAsync()
    {
        List<string> urls = new List<string>
        {
            "https://api.github.com",
            "https://api.twitter.com",
            "https://api.example.com"
        };

        await Parallel.ForEachAsync(urls, async (url, ct) =>
        {
            try
            {
                string content = await _httpClient.GetStringAsync(url, ct);
                Console.WriteLine($"Downloaded {url}: {content.Length} bytes");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Download failed {url}: {ex.Message}");
            }
        });
    }

    // Control concurrency
    public async Task ForEachAsyncWithConcurrency()
    {
        IEnumerable<int> ids = Enumerable.Range(1, 100);

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 10  // Maximum 10 concurrent requests
        };

        await Parallel.ForEachAsync(ids, options, async (id, ct) =>
        {
            await ProcessItemAsync(id, ct);
        });
    }

    // With cancellation support
    public async Task ForEachAsyncWithCancellation()
    {
        using CancellationTokenSource cts = new CancellationTokenSource();
        cts.CancelAfter(TimeSpan.FromSeconds(30));

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 5,
            CancellationToken = cts.Token
        };

        try
        {
            await Parallel.ForEachAsync(GetItemsAsync(), options, async (item, ct) =>
            {
                await ProcessItemAsync(item, ct);
            });
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation was canceled");
        }
    }

    // Error handling
    public async Task ForEachAsyncWithErrorHandling()
    {
        List<string> urls = GetUrls();
        ConcurrentBag<Exception> errors = new ConcurrentBag<Exception>();

        await Parallel.ForEachAsync(urls, async (url, ct) =>
        {
            try
            {
                await DownloadAndProcessAsync(url, ct);
            }
            catch (Exception ex)
            {
                errors.Add(ex);
                // Log error but continue processing other items
                Console.WriteLine($"Error processing {url}: {ex.Message}");
            }
        });

        if (errors.Any())
        {
            Console.WriteLine($"Completed with {errors.Count} errors");
        }
    }

    // Practical application: Batch API calls
    public async Task<Dictionary<int, UserData>> FetchUserDataBatch(IEnumerable<int> userIds)
    {
        ConcurrentDictionary<int, UserData> results = new ConcurrentDictionary<int, UserData>();

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 20  // Limit concurrent API calls
        };

        await Parallel.ForEachAsync(userIds, options, async (userId, ct) =>
        {
            UserData userData = await FetchUserDataAsync(userId, ct);
            results.TryAdd(userId, userData);
        });

        return new Dictionary<int, UserData>(results);
    }

    private async IAsyncEnumerable<int> GetItemsAsync()
    {
        for (int i = 0; i < 100; i++)
        {
            await Task.Delay(10);
            yield return i;
        }
    }

    private async Task ProcessItemAsync(int item, CancellationToken ct)
    {
        await Task.Delay(100, ct);
    }

    private List<string> GetUrls() => new List<string>();
    private async Task DownloadAndProcessAsync(string url, CancellationToken ct) => await Task.Delay(100, ct);
    private async Task<UserData> FetchUserDataAsync(int userId, CancellationToken ct)
    {
        await Task.Delay(100, ct);
        return new UserData();
    }

    public class UserData { }
}
```

## Best Practices

### Choose the Right Degree of Parallelism

```csharp
public class ParallelismBestPractices
{
    // CPU-bound tasks: Use processor core count
    public void CpuBoundTask()
    {
        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount
        };

        Parallel.For(0, 1000, options, i =>
        {
            // CPU-intensive computation
        });
    }

    // I/O-bound tasks: Can use higher degree of parallelism
    public async Task IoBoundTask()
    {
        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount * 2
        };

        await Parallel.ForEachAsync(GetUrls(), options, async (url, ct) =>
        {
            await DownloadAsync(url, ct);
        });
    }

    // Mixed tasks: Adjust based on actual situation
    public void MixedTask()
    {
        // Use benchmarking to determine optimal parallelism
        int optimalParallelism = DetermineOptimalParallelism();

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = optimalParallelism
        };
    }

    private IEnumerable<string> GetUrls() => new List<string>();
    private async Task DownloadAsync(string url, CancellationToken ct) => await Task.Delay(100, ct);
    private int DetermineOptimalParallelism() => Environment.ProcessorCount;
}
```

### Avoid Shared State Contention

```csharp
public class SharedStateBestPractices
{
    // Use thread-local state
    public long CalculateSumWithLocalState(int[] data)
    {
        long total = 0;

        Parallel.For(0, data.Length,
            () => 0L,  // Local state initialization
            (i, state, local) => local + data[i],  // Accumulate to local state
            local => Interlocked.Add(ref total, local)  // Merge local state
        );

        return total;
    }

    // Use concurrent collections
    public List<int> ProcessWithConcurrentCollection(int[] data)
    {
        ConcurrentBag<int> results = new ConcurrentBag<int>();

        Parallel.ForEach(data, item =>
        {
            if (ShouldInclude(item))
            {
                results.Add(item);
            }
        });

        return results.ToList();
    }

    // Use partitioned writes
    public int[] ProcessWithPartitionedWrite(int[] data)
    {
        int[] results = new int[data.Length];

        Parallel.For(0, data.Length, i =>
        {
            // Each index is written by only one thread, no synchronization needed
            results[i] = ProcessItem(data[i]);
        });

        return results;
    }

    private bool ShouldInclude(int item) => item > 0;
    private int ProcessItem(int item) => item * 2;
}
```

### Handle Exceptions Properly

```csharp
public class ExceptionHandlingBestPractices
{
    // Collect all exceptions
    public void HandleAllExceptions()
    {
        try
        {
            Parallel.For(0, 10, i =>
            {
                if (i == 3) throw new InvalidOperationException($"Error at {i}");
                if (i == 7) throw new ArgumentException($"Argument error at {i}");
            });
        }
        catch (AggregateException ae)
        {
            Console.WriteLine($"Caught {ae.InnerExceptions.Count} exceptions:");
            foreach (var ex in ae.InnerExceptions)
            {
                Console.WriteLine($"  - {ex.GetType().Name}: {ex.Message}");
            }
        }
    }

    // Handle specific exception types
    public void HandleSpecificExceptions()
    {
        try
        {
            Parallel.ForEach(GetItems(), item =>
            {
                ProcessItem(item);
            });
        }
        catch (AggregateException ae)
        {
            ae.Handle(ex =>
            {
                if (ex is TimeoutException)
                {
                    Console.WriteLine("Timeout error handled");
                    return true;  // Handled
                }
                return false;  // Not handled, rethrow
            });
        }
    }

    // Handle exceptions within the loop
    public void HandleExceptionsInLoop()
    {
        ConcurrentBag<Exception> errors = new ConcurrentBag<Exception>();

        Parallel.ForEach(GetItems(), item =>
        {
            try
            {
                ProcessItem(item);
            }
            catch (Exception ex)
            {
                errors.Add(ex);
                // Continue processing other items
            }
        });

        if (errors.Any())
        {
            throw new AggregateException("Errors occurred during processing", errors);
        }
    }

    private IEnumerable<int> GetItems() => Enumerable.Range(0, 10);
    private void ProcessItem(int item) { }
}
```

### Use Cancellation Tokens Properly

```csharp
public class CancellationBestPractices
{
    public async Task ProcessWithGracefulCancellation(CancellationToken externalToken)
    {
        using CancellationTokenSource internalCts = new CancellationTokenSource();
        using CancellationTokenSource linkedCts =
            CancellationTokenSource.CreateLinkedTokenSource(externalToken, internalCts.Token);

        ParallelOptions options = new ParallelOptions
        {
            CancellationToken = linkedCts.Token
        };

        try
        {
            await Parallel.ForEachAsync(GetItems(), options, async (item, ct) =>
            {
                // Check for cancellation
                ct.ThrowIfCancellationRequested();

                // Process item
                await ProcessItemAsync(item, ct);
            });
        }
        catch (OperationCanceledException) when (externalToken.IsCancellationRequested)
        {
            Console.WriteLine("External cancellation request");
            throw;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Internal cancellation");
        }
    }

    // Set timeout
    public async Task ProcessWithTimeout(TimeSpan timeout)
    {
        using CancellationTokenSource cts = new CancellationTokenSource(timeout);

        ParallelOptions options = new ParallelOptions
        {
            CancellationToken = cts.Token
        };

        try
        {
            await Parallel.ForEachAsync(GetItems(), options, async (item, ct) =>
            {
                await ProcessItemAsync(item, ct);
            });
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine($"Operation timed out ({timeout})");
        }
    }

    private IEnumerable<int> GetItems() => Enumerable.Range(0, 100);
    private async Task ProcessItemAsync(int item, CancellationToken ct) => await Task.Delay(100, ct);
}
```

## Common Pitfalls

### Closure Variable Capture Issues

```csharp
public class ClosurePitfall
{
    // Problematic example
    public void BadClosureCapture()
    {
        List<Action> actions = new List<Action>();

        for (int i = 0; i < 10; i++)
        {
            // All actions capture the same variable i
            actions.Add(() => Console.WriteLine(i));
        }

        Parallel.Invoke(actions.ToArray());
        // Output: all 10s
    }

    // Correct approach
    public void GoodClosureCapture()
    {
        List<Action> actions = new List<Action>();

        for (int i = 0; i < 10; i++)
        {
            int captured = i;  // Create new variable in each iteration
            actions.Add(() => Console.WriteLine(captured));
        }

        Parallel.Invoke(actions.ToArray());
        // Output: 0 to 9 (order may vary)
    }
}
```

### Inappropriate Lock Usage

```csharp
public class LockPitfall
{
    private readonly object _lock = new object();
    private int _counter = 0;

    // Problem: Over-locking causes serialization
    public void OverLocking()
    {
        Parallel.For(0, 10000, i =>
        {
            lock (_lock)
            {
                // Entire operation is inside the lock, loses parallel advantage
                var result = ExpensiveComputation(i);
                _counter += result;
            }
        });
    }

    // Improved: Reduce lock granularity
    public void MinimalLocking()
    {
        Parallel.For(0, 10000, i =>
        {
            // Computation is outside the lock
            var result = ExpensiveComputation(i);

            lock (_lock)
            {
                // Only lock the shared state update
                _counter += result;
            }
        });
    }

    // Best: Use atomic operations
    public void AtomicOperation()
    {
        long counter = 0;

        Parallel.For(0, 10000,
            () => 0,
            (i, state, local) => local + ExpensiveComputation(i),
            local => Interlocked.Add(ref counter, local)
        );
    }

    private int ExpensiveComputation(int i) => i * 2;
}
```

### Using async void in Parallel Loops

```csharp
public class AsyncVoidPitfall
{
    // Wrong: async void makes it impossible to wait for completion
    public void BadAsyncInParallel()
    {
        Parallel.ForEach(GetUrls(), async url =>
        {
            // This is async void!
            await DownloadAsync(url);
        });

        // Parallel.ForEach returns immediately, downloads may not be complete
        Console.WriteLine("Done? Still downloading actually...");
    }

    // Correct: Use Parallel.ForEachAsync (.NET 6+)
    public async Task GoodAsyncInParallel()
    {
        await Parallel.ForEachAsync(GetUrls(), async (url, ct) =>
        {
            await DownloadAsync(url);
        });

        Console.WriteLine("Really done!");
    }

    // Alternative: Use Task.WhenAll
    public async Task AlternativeAsyncParallel()
    {
        var tasks = GetUrls().Select(url => DownloadAsync(url));
        await Task.WhenAll(tasks);
    }

    private IEnumerable<string> GetUrls() => new List<string> { "url1", "url2" };
    private async Task DownloadAsync(string url) => await Task.Delay(100);
}
```

### Ignoring Uneven Workloads

```csharp
public class LoadImbalancePitfall
{
    // Problem: Uneven workload leads to inefficiency
    public void UnbalancedWork()
    {
        int[] data = Enumerable.Range(1, 100).ToArray();

        // If processing time is proportional to i, later threads will be busier
        Parallel.For(0, data.Length, i =>
        {
            // Uneven processing time
            Thread.Sleep(i);  // Larger i means longer wait
        });
    }

    // Improved: Use dynamic partitioning
    public void BalancedWork()
    {
        int[] data = Enumerable.Range(1, 100).ToArray();

        // Enable load balancing
        var partitioner = Partitioner.Create(data, loadBalance: true);

        Parallel.ForEach(partitioner, item =>
        {
            Thread.Sleep(item);
        });
    }
}
```

### Using Parallel on the UI Thread

```csharp
public class UIThreadPitfall
{
    // Problem: Parallel blocks the UI thread
    public void BlockingUI()
    {
        // Calling on UI thread will freeze the interface
        Parallel.For(0, 1000, i =>
        {
            ExpensiveComputation(i);
        });
    }

    // Correct: Execute parallel operations on background thread
    public async Task NonBlockingUI()
    {
        await Task.Run(() =>
        {
            Parallel.For(0, 1000, i =>
            {
                ExpensiveComputation(i);
            });
        });

        // Return to UI thread to update interface
        UpdateUI();
    }

    private void ExpensiveComputation(int i) { }
    private void UpdateUI() { }
}
```

## Performance Considerations

### When to Use Parallel

```csharp
public class PerformanceConsiderations
{
    // Scenarios suitable for parallelization
    public void GoodForParallel()
    {
        // 1. CPU-intensive tasks
        Parallel.For(0, 1000, i =>
        {
            CalculatePrimes(i * 1000, (i + 1) * 1000);
        });

        // 2. Large amounts of independent data processing
        int[] largeArray = new int[1000000];
        Parallel.For(0, largeArray.Length, i =>
        {
            largeArray[i] = ProcessValue(i);
        });
    }

    // Scenarios not suitable for parallelization
    public void BadForParallel()
    {
        // 1. Tasks too small, overhead exceeds benefit
        int[] smallArray = new int[10];
        // Parallelization overhead may exceed the computation itself

        // 2. Heavy shared state
        // 3. Sequentially dependent operations
    }

    private void CalculatePrimes(int start, int end) { }
    private int ProcessValue(int i) => i * 2;
}
```

### Performance Benchmarking

```csharp
using System.Diagnostics;

public class PerformanceBenchmark
{
    public void ComparePerformance()
    {
        int[] data = Enumerable.Range(0, 10000000).ToArray();

        // Serial execution
        var sw1 = Stopwatch.StartNew();
        long sum1 = 0;
        for (int i = 0; i < data.Length; i++)
        {
            sum1 += ComputeIntensive(data[i]);
        }
        sw1.Stop();
        Console.WriteLine($"Serial: {sw1.ElapsedMilliseconds}ms");

        // Parallel.For
        var sw2 = Stopwatch.StartNew();
        long sum2 = 0;
        Parallel.For(0, data.Length,
            () => 0L,
            (i, state, local) => local + ComputeIntensive(data[i]),
            local => Interlocked.Add(ref sum2, local)
        );
        sw2.Stop();
        Console.WriteLine($"Parallel.For: {sw2.ElapsedMilliseconds}ms");

        // PLINQ
        var sw3 = Stopwatch.StartNew();
        long sum3 = data.AsParallel().Sum(x => ComputeIntensive(x));
        sw3.Stop();
        Console.WriteLine($"PLINQ: {sw3.ElapsedMilliseconds}ms");

        // Calculate speedup ratio
        Console.WriteLine($"Parallel.For speedup: {(double)sw1.ElapsedMilliseconds / sw2.ElapsedMilliseconds:F2}x");
        Console.WriteLine($"PLINQ speedup: {(double)sw1.ElapsedMilliseconds / sw3.ElapsedMilliseconds:F2}x");
    }

    private long ComputeIntensive(int value)
    {
        long result = 0;
        for (int i = 0; i < 100; i++)
        {
            result += (long)Math.Sqrt(value * i);
        }
        return result;
    }
}
```

### Memory Considerations

```csharp
public class MemoryConsiderations
{
    // Avoid allocating objects in each iteration
    public void AvoidAllocation()
    {
        // Problem: Creates new object every iteration
        Parallel.For(0, 100000, i =>
        {
            var list = new List<int>();  // Frequent allocation
            // ...
        });

        // Improved: Use ArrayPool
        var pool = ArrayPool<int>.Shared;

        Parallel.For(0, 100000, i =>
        {
            int[] buffer = pool.Rent(1024);
            try
            {
                // Use buffer
            }
            finally
            {
                pool.Return(buffer);
            }
        });
    }

    // Use Span to reduce memory copying
    public void UseSpan()
    {
        int[] data = new int[1000000];

        var rangePartitioner = Partitioner.Create(0, data.Length, 10000);

        Parallel.ForEach(rangePartitioner, range =>
        {
            // Use Span to avoid array copying
            Span<int> span = data.AsSpan(range.Item1, range.Item2 - range.Item1);
            ProcessSpan(span);
        });
    }

    private void ProcessSpan(Span<int> span)
    {
        for (int i = 0; i < span.Length; i++)
        {
            span[i] *= 2;
        }
    }
}
```

## Real-World Scenarios

### Batch Image Processing

```csharp
using System.Drawing;
using System.Collections.Concurrent;

public class ImageProcessor
{
    public async Task ProcessImagesAsync(string[] imagePaths, string outputDir)
    {
        ConcurrentBag<string> processedFiles = new ConcurrentBag<string>();
        ConcurrentBag<Exception> errors = new ConcurrentBag<Exception>();

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount
        };

        await Parallel.ForEachAsync(imagePaths, options, async (imagePath, ct) =>
        {
            try
            {
                // Read image
                byte[] imageData = await File.ReadAllBytesAsync(imagePath, ct);

                // Process image (synchronous operation, but executed in parallel on different threads)
                byte[] processedData = ProcessImage(imageData);

                // Save result
                string outputPath = Path.Combine(outputDir, Path.GetFileName(imagePath));
                await File.WriteAllBytesAsync(outputPath, processedData, ct);

                processedFiles.Add(outputPath);
            }
            catch (Exception ex)
            {
                errors.Add(new Exception($"Failed to process {imagePath}: {ex.Message}", ex));
            }
        });

        Console.WriteLine($"Successfully processed: {processedFiles.Count} files");
        Console.WriteLine($"Failed: {errors.Count} files");
    }

    private byte[] ProcessImage(byte[] imageData)
    {
        // Simulate image processing
        return imageData;
    }
}
```

### Data Analysis Pipeline

```csharp
public class DataAnalysisPipeline
{
    public AnalysisResult AnalyzeData(IEnumerable<DataPoint> dataPoints)
    {
        // Convert data to list to support parallel access
        List<DataPoint> data = dataPoints.ToList();

        // Calculate multiple statistical metrics in parallel
        double mean = 0, stdDev = 0, median = 0;
        int[] histogram = null;

        Parallel.Invoke(
            // Calculate mean
            () => mean = data.AsParallel().Average(d => d.Value),

            // Calculate standard deviation
            () =>
            {
                double avg = data.Average(d => d.Value);
                double sumSquares = data.AsParallel().Sum(d => Math.Pow(d.Value - avg, 2));
                stdDev = Math.Sqrt(sumSquares / data.Count);
            },

            // Calculate median
            () =>
            {
                var sorted = data.AsParallel().OrderBy(d => d.Value).ToList();
                int mid = sorted.Count / 2;
                median = sorted.Count % 2 == 0
                    ? (sorted[mid - 1].Value + sorted[mid].Value) / 2
                    : sorted[mid].Value;
            },

            // Calculate histogram
            () =>
            {
                histogram = new int[10];
                double min = data.Min(d => d.Value);
                double max = data.Max(d => d.Value);
                double bucketSize = (max - min) / 10;

                Parallel.ForEach(data, () => new int[10],
                    (point, state, localHist) =>
                    {
                        int bucket = Math.Min((int)((point.Value - min) / bucketSize), 9);
                        localHist[bucket]++;
                        return localHist;
                    },
                    localHist =>
                    {
                        for (int i = 0; i < 10; i++)
                        {
                            Interlocked.Add(ref histogram[i], localHist[i]);
                        }
                    });
            }
        );

        return new AnalysisResult
        {
            Mean = mean,
            StandardDeviation = stdDev,
            Median = median,
            Histogram = histogram
        };
    }

    public class DataPoint
    {
        public double Value { get; set; }
    }

    public class AnalysisResult
    {
        public double Mean { get; set; }
        public double StandardDeviation { get; set; }
        public double Median { get; set; }
        public int[] Histogram { get; set; }
    }
}
```

### Parallel Web Crawler

```csharp
public class ParallelWebCrawler
{
    private readonly HttpClient _httpClient;
    private readonly ConcurrentDictionary<string, bool> _visited;
    private readonly ConcurrentQueue<string> _urlQueue;
    private readonly SemaphoreSlim _throttle;

    public ParallelWebCrawler(int maxConcurrency = 10)
    {
        _httpClient = new HttpClient();
        _visited = new ConcurrentDictionary<string, bool>();
        _urlQueue = new ConcurrentQueue<string>();
        _throttle = new SemaphoreSlim(maxConcurrency);
    }

    public async Task<List<PageData>> CrawlAsync(string startUrl, int maxPages, CancellationToken ct = default)
    {
        ConcurrentBag<PageData> results = new ConcurrentBag<PageData>();
        _urlQueue.Enqueue(startUrl);
        _visited[startUrl] = true;

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 20,
            CancellationToken = ct
        };

        while (results.Count < maxPages && !_urlQueue.IsEmpty)
        {
            List<string> batch = new List<string>();
            while (batch.Count < 10 && _urlQueue.TryDequeue(out string url))
            {
                batch.Add(url);
            }

            await Parallel.ForEachAsync(batch, options, async (url, innerCt) =>
            {
                await _throttle.WaitAsync(innerCt);
                try
                {
                    PageData pageData = await FetchPageAsync(url, innerCt);
                    if (pageData != null)
                    {
                        results.Add(pageData);

                        // Add newly discovered links to the queue
                        foreach (string link in pageData.Links)
                        {
                            if (_visited.TryAdd(link, true))
                            {
                                _urlQueue.Enqueue(link);
                            }
                        }
                    }
                }
                finally
                {
                    _throttle.Release();
                }
            });
        }

        return results.ToList();
    }

    private async Task<PageData> FetchPageAsync(string url, CancellationToken ct)
    {
        try
        {
            string html = await _httpClient.GetStringAsync(url, ct);
            return new PageData
            {
                Url = url,
                Content = html,
                Links = ExtractLinks(html, url)
            };
        }
        catch
        {
            return null;
        }
    }

    private List<string> ExtractLinks(string html, string baseUrl)
    {
        // Simplified link extraction logic
        return new List<string>();
    }

    public class PageData
    {
        public string Url { get; set; }
        public string Content { get; set; }
        public List<string> Links { get; set; }
    }
}
```

### Parallel File Search

```csharp
public class ParallelFileSearcher
{
    public async Task<List<SearchResult>> SearchFilesAsync(
        string directory,
        string searchPattern,
        Regex contentPattern,
        CancellationToken ct = default)
    {
        ConcurrentBag<SearchResult> results = new ConcurrentBag<SearchResult>();

        // Get all matching files
        string[] files = Directory.GetFiles(directory, searchPattern, SearchOption.AllDirectories);

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount,
            CancellationToken = ct
        };

        await Parallel.ForEachAsync(files, options, async (filePath, innerCt) =>
        {
            try
            {
                string content = await File.ReadAllTextAsync(filePath, innerCt);

                // Parallel search file content
                MatchCollection matches = contentPattern.Matches(content);

                if (matches.Count > 0)
                {
                    results.Add(new SearchResult
                    {
                        FilePath = filePath,
                        Matches = matches.Cast<Match>()
                            .Select(m => new MatchInfo
                            {
                                LineNumber = GetLineNumber(content, m.Index),
                                Value = m.Value,
                                Context = GetContext(content, m.Index)
                            })
                            .ToList()
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error searching {filePath}: {ex.Message}");
            }
        });

        return results.OrderBy(r => r.FilePath).ToList();
    }

    private int GetLineNumber(string content, int index)
    {
        return content.Take(index).Count(c => c == '\n') + 1;
    }

    private string GetContext(string content, int index, int contextLength = 50)
    {
        int start = Math.Max(0, index - contextLength);
        int end = Math.Min(content.Length, index + contextLength);
        return content.Substring(start, end - start);
    }

    public class SearchResult
    {
        public string FilePath { get; set; }
        public List<MatchInfo> Matches { get; set; }
    }

    public class MatchInfo
    {
        public int LineNumber { get; set; }
        public string Value { get; set; }
        public string Context { get; set; }
    }
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between Parallel.For and Task.WhenAll?**

```csharp
// Parallel.For: Synchronously blocking, suitable for CPU-bound tasks
Parallel.For(0, 100, i => ComputeIntensive(i));  // Blocks until complete

// Task.WhenAll: Asynchronously non-blocking, suitable for I/O-bound tasks
var tasks = Enumerable.Range(0, 100).Select(i => ProcessAsync(i));
await Task.WhenAll(tasks);  // Async wait

// Key differences:
// 1. Parallel.For is synchronous, blocks the calling thread
// 2. Task.WhenAll is asynchronous, doesn't block the calling thread
// 3. Parallel.For uses work-stealing algorithm to optimize performance
// 4. Task.WhenAll is suitable for combining multiple async operations
```

**Q2: How do you handle exceptions in Parallel.ForEach?**

```csharp
// Method 1: Use AggregateException
try
{
    Parallel.ForEach(items, item => ProcessWithPossibleError(item));
}
catch (AggregateException ae)
{
    foreach (var ex in ae.InnerExceptions)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}

// Method 2: Catch within the loop
ConcurrentBag<Exception> errors = new ConcurrentBag<Exception>();
Parallel.ForEach(items, item =>
{
    try
    {
        ProcessWithPossibleError(item);
    }
    catch (Exception ex)
    {
        errors.Add(ex);
    }
});
```

**Q3: What is the performance impact of AsOrdered() in PLINQ?**

```csharp
// Unordered: Best performance
var unordered = data.AsParallel()
    .Select(x => ExpensiveTransform(x));  // Returns as completed

// Ordered: Requires additional synchronization overhead
var ordered = data.AsParallel()
    .AsOrdered()
    .Select(x => ExpensiveTransform(x));  // Must wait for previous items to complete

// AsOrdered overhead:
// 1. Requires buffering results
// 2. Must wait for previous index results
// 3. May cause some threads to wait idle
```

**Q4: When should you avoid using the Parallel class?**

```csharp
// Scenarios not suitable for Parallel:

// 1. Tasks too small
Parallel.For(0, 10, i => i * 2);  // Overhead exceeds benefit

// 2. Sequential dependencies
// Computation depends on previous result
int prev = 0;
Parallel.For(0, 100, i => prev = prev + i);  // Wrong!

// 3. Primarily I/O waiting
Parallel.ForEach(urls, url => Download(url));  // async/await is better

// 4. Too much shared state
// Heavy lock contention reduces parallel efficiency

// 5. Calling on UI thread
Parallel.For(0, 1000, i => Compute(i));  // Will freeze UI
```

**Q5: How do you choose MaxDegreeOfParallelism?**

```csharp
// CPU-bound: Use core count
MaxDegreeOfParallelism = Environment.ProcessorCount;

// I/O-bound: Can be higher
MaxDegreeOfParallelism = Environment.ProcessorCount * 2;

// Rate-limited external services
MaxDegreeOfParallelism = 10;  // Based on API limits

// Memory-sensitive: Adjust based on available memory
MaxDegreeOfParallelism = Math.Min(
    Environment.ProcessorCount,
    (int)(GetAvailableMemory() / PerTaskMemoryUsage)
);

// Dynamic adjustment
MaxDegreeOfParallelism = DetermineOptimalParallelism();
```

## Further Reading

### Official Documentation

- [Parallel Class - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel)
- [Task Parallel Library (TPL) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl)
- [Introduction to PLINQ - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/introduction-to-plinq)
- [Data Partitioning - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/custom-partitioners-for-plinq-and-tpl)

### Classic Books

- "CLR via C#" - Jeffrey Richter (Chapters 27-28)
- "Concurrency in C# Cookbook" - Stephen Cleary
- "Pro .NET Performance" - Sasha Goldshtein
- "C# 10 in a Nutshell" - Joseph Albahari (Chapters 22-23)

### Quality Articles

- [Parallel Programming in .NET - Microsoft Patterns & Practices](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff963553(v=pandp.10))
- [Understanding C# async / await Pattern](https://blog.stephencleary.com/2012/02/async-and-await.html)
- [Best Practices in Asynchronous Programming](https://docs.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming)

### Related Topics

- [C# Async Programming](/docs/csharp/async) - Task, async/await basics
- [C# Collections](/docs/csharp/collections) - Concurrent collections in detail
- [C# Span and Memory](/docs/csharp/span-memory) - High-performance memory operations
