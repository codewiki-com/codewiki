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
origin: old/src/content/docs/csharp/parallel.zh.md
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

在现代多核处理器时代，充分利用 CPU 的并行计算能力对于提升应用程序性能至关重要。C# 中的 `Parallel` 类是任务并行库 (Task Parallel Library, TPL) 的核心组件，它提供了简洁而强大的 API 来实现数据并行和任务并行。

## 概念解释

### 什么是并行编程？

并行编程是一种同时执行多个计算任务的编程范式。与传统的串行执行不同，并行编程允许程序将工作负载分配到多个处理器核心上同时执行，从而显著提升计算密集型任务的执行效率。

### Parallel 类的定位

`System.Threading.Tasks.Parallel` 类是 .NET Framework 4.0 引入的任务并行库 (TPL) 的一部分。它主要解决以下问题：

1. **简化并行循环**：无需手动管理线程，即可将普通循环转换为并行执行
2. **自动负载均衡**：运行时自动根据可用核心数分配工作
3. **异常聚合**：统一处理并行执行中的多个异常
4. **取消支持**：内置取消令牌支持，可优雅地终止并行操作

### 并行 vs 并发 vs 异步

| 概念 | 定义 | 适用场景 |
|------|------|----------|
| **并行 (Parallel)** | 多个任务同时在不同核心上执行 | CPU 密集型任务 |
| **并发 (Concurrent)** | 多个任务交替执行，共享时间片 | 任务切换、资源共享 |
| **异步 (Async)** | 非阻塞等待操作完成 | I/O 密集型任务 |

```csharp
// 并行：真正的同时执行
Parallel.For(0, 100, i => ComputeIntensive(i));

// 并发：线程交替执行
var tasks = Enumerable.Range(0, 100)
    .Select(i => Task.Run(() => ComputeIntensive(i)));

// 异步：非阻塞等待
await httpClient.GetStringAsync(url);
```

## 核心原理

### 工作窃取算法

Parallel 类底层使用线程池和工作窃取 (Work Stealing) 算法来实现高效的任务调度：

```
┌─────────────────────────────────────────────────────────────┐
│                     线程池 (ThreadPool)                      │
├─────────────────────────────────────────────────────────────┤
│  线程1队列     线程2队列     线程3队列     线程4队列          │
│  ┌─────┐      ┌─────┐      ┌─────┐      ┌─────┐            │
│  │任务A│      │任务D│      │任务G│      │ 空  │ ← 窃取任务  │
│  │任务B│      │任务E│      │任务H│      │     │            │
│  │任务C│      │任务F│      │任务I│      │     │            │
│  └─────┘      └─────┘      └─────┘      └─────┘            │
│     ↓            ↓            ↓            ↑               │
│   执行         执行         执行      从其他队列窃取         │
└─────────────────────────────────────────────────────────────┘
```

当一个线程完成其队列中的所有任务后，它会尝试从其他线程的队列"窃取"任务，从而保持所有核心的利用率。

### 分区策略

Parallel 类使用分区器 (Partitioner) 将数据源划分为多个区块：

```csharp
// 默认分区：范围分区
// 将 0-999 划分为多个连续范围
Parallel.For(0, 1000, i => Process(i));

// 内部类似于：
// 线程1: 处理 0-249
// 线程2: 处理 250-499
// 线程3: 处理 500-749
// 线程4: 处理 750-999
```

### 任务调度器

```csharp
// 默认使用线程池调度器
TaskScheduler.Default

// 可以自定义调度器
ParallelOptions options = new ParallelOptions
{
    TaskScheduler = new LimitedConcurrencyLevelTaskScheduler(2)
};
```

## 核心要点

### Parallel 类的核心方法

| 方法 | 用途 | 适用场景 |
|------|------|----------|
| `Parallel.For` | 并行化索引循环 | 需要索引访问的数组/列表处理 |
| `Parallel.ForEach` | 并行化集合遍历 | 通用集合处理 |
| `Parallel.Invoke` | 并行执行多个独立操作 | 独立的任务批处理 |
| `Parallel.ForEachAsync` | 异步并行遍历 (.NET 6+) | 异步 I/O 操作的并行处理 |

### ParallelOptions 配置

```csharp
ParallelOptions options = new ParallelOptions
{
    // 最大并行度：限制同时执行的操作数
    // -1 表示不限制（使用所有可用核心）
    MaxDegreeOfParallelism = Environment.ProcessorCount,

    // 取消令牌：用于取消并行操作
    CancellationToken = cancellationTokenSource.Token,

    // 任务调度器：控制任务如何调度
    TaskScheduler = TaskScheduler.Default
};
```

### 返回值 ParallelLoopResult

```csharp
ParallelLoopResult result = Parallel.For(0, 100, (i, state) =>
{
    if (ShouldStop(i))
    {
        state.Break(); // 或 state.Stop()
    }
});

// 检查循环是否完成
Console.WriteLine($"是否完成: {result.IsCompleted}");
Console.WriteLine($"最低中断索引: {result.LowestBreakIteration}");
```

## 代码示例

### Parallel.For 基础用法

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

public class ParallelForExamples
{
    // 基本 Parallel.For
    public void BasicParallelFor()
    {
        int[] results = new int[100];

        Parallel.For(0, 100, i =>
        {
            results[i] = ComputeSquare(i);
            Console.WriteLine($"索引 {i} 在线程 {Thread.CurrentThread.ManagedThreadId} 上执行");
        });

        Console.WriteLine($"计算完成，结果数量: {results.Length}");
    }

    // 带选项的 Parallel.For
    public void ParallelForWithOptions()
    {
        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 4  // 最多使用 4 个线程
        };

        Parallel.For(0, 1000, options, i =>
        {
            // CPU 密集型计算
            double result = 0;
            for (int j = 0; j < 10000; j++)
            {
                result += Math.Sqrt(i * j);
            }
        });
    }

    // 带取消支持的 Parallel.For
    public async Task ParallelForWithCancellation()
    {
        using CancellationTokenSource cts = new CancellationTokenSource();

        // 3 秒后取消
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        ParallelOptions options = new ParallelOptions
        {
            CancellationToken = cts.Token
        };

        try
        {
            Parallel.For(0, int.MaxValue, options, i =>
            {
                Thread.Sleep(100);  // 模拟耗时操作
                Console.WriteLine($"处理 {i}");
            });
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("操作已被取消");
        }
    }

    // 带本地状态的 Parallel.For（优化性能）
    public long ParallelForWithLocalState()
    {
        long totalSum = 0;
        object lockObj = new object();

        Parallel.For(0, 10000,
            // 初始化每个线程的本地状态
            () => 0L,

            // 循环体：使用本地状态
            (i, state, localSum) =>
            {
                return localSum + i;
            },

            // 合并本地状态到全局结果
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

    // 使用 Interlocked 替代锁（更高效）
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
        Thread.SpinWait(1000);  // 模拟计算
        return n * n;
    }
}
```

### Parallel.ForEach 详解

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

public class ParallelForEachExamples
{
    // 基本 Parallel.ForEach
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

        Console.WriteLine($"下载完成: {results.Count} 个文件");
    }

    // 带索引的 Parallel.ForEach
    public void ParallelForEachWithIndex()
    {
        string[] items = { "apple", "banana", "cherry", "date", "elderberry" };

        Parallel.ForEach(items, (item, state, index) =>
        {
            Console.WriteLine($"[{index}] {item} - 线程 {Thread.CurrentThread.ManagedThreadId}");
        });
    }

    // 带本地状态的 Parallel.ForEach
    public Dictionary<string, int> CountWordFrequencies(IEnumerable<string> documents)
    {
        ConcurrentDictionary<string, int> globalCounts = new ConcurrentDictionary<string, int>();

        Parallel.ForEach(documents,
            // 初始化线程本地字典
            () => new Dictionary<string, int>(),

            // 处理每个文档
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

            // 合并本地结果到全局
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

    // 使用 Break 提前终止
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
                state.Break();  // 请求中断后续迭代
            }
        });

        return result;
    }

    // 使用 Stop 立即停止
    public bool ContainsInvalid(IEnumerable<string> items)
    {
        bool found = false;

        Parallel.ForEach(items, (item, state) =>
        {
            if (IsInvalid(item))
            {
                found = true;
                state.Stop();  // 立即停止所有迭代
            }
        });

        return found;
    }

    private string DownloadContent(string url)
    {
        Thread.Sleep(500);  // 模拟网络延迟
        return $"Content from {url}";
    }

    private bool IsInvalid(string item) => item.Contains("invalid");
}
```

### Parallel.Invoke 使用

```csharp
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

public class ParallelInvokeExamples
{
    // 基本 Parallel.Invoke
    public void BasicParallelInvoke()
    {
        Stopwatch sw = Stopwatch.StartNew();

        Parallel.Invoke(
            () => Task1(),
            () => Task2(),
            () => Task3()
        );

        sw.Stop();
        Console.WriteLine($"并行执行耗时: {sw.ElapsedMilliseconds}ms");
        // 如果每个任务耗时 1 秒，并行执行约 1 秒完成
    }

    // 对比串行执行
    public void SerialExecution()
    {
        Stopwatch sw = Stopwatch.StartNew();

        Task1();
        Task2();
        Task3();

        sw.Stop();
        Console.WriteLine($"串行执行耗时: {sw.ElapsedMilliseconds}ms");
        // 串行执行约 3 秒完成
    }

    // 带选项的 Parallel.Invoke
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
                () => LongRunningTask("任务A"),
                () => LongRunningTask("任务B"),
                () => LongRunningTask("任务C"),
                () => LongRunningTask("任务D")
            );
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("操作已取消");
        }
    }

    // 实际应用：数据处理管道
    public void DataProcessingPipeline(string[] data)
    {
        string[] step1Results = null;
        string[] step2Results = null;
        string[] step3Results = null;

        // 第一阶段：三个独立的处理步骤并行执行
        Parallel.Invoke(
            () => step1Results = ProcessStep1(data),
            () => step2Results = ProcessStep2(data),
            () => step3Results = ProcessStep3(data)
        );

        // 第二阶段：合并结果
        MergeResults(step1Results, step2Results, step3Results);
    }

    // 动态任务数量
    public void DynamicParallelInvoke(int taskCount)
    {
        Action[] actions = new Action[taskCount];

        for (int i = 0; i < taskCount; i++)
        {
            int taskId = i;  // 捕获循环变量
            actions[i] = () =>
            {
                Console.WriteLine($"执行任务 {taskId}");
                Thread.Sleep(500);
            };
        }

        Parallel.Invoke(actions);
    }

    private void Task1()
    {
        Console.WriteLine($"Task1 开始 - 线程 {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine("Task1 完成");
    }

    private void Task2()
    {
        Console.WriteLine($"Task2 开始 - 线程 {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine("Task2 完成");
    }

    private void Task3()
    {
        Console.WriteLine($"Task3 开始 - 线程 {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine("Task3 完成");
    }

    private void LongRunningTask(string name)
    {
        Console.WriteLine($"{name} 开始");
        Thread.Sleep(2000);
        Console.WriteLine($"{name} 完成");
    }

    private string[] ProcessStep1(string[] data) => data;
    private string[] ProcessStep2(string[] data) => data;
    private string[] ProcessStep3(string[] data) => data;
    private void MergeResults(params string[][] results) { }
}
```

### PLINQ 并行 LINQ

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public class PLINQExamples
{
    // 基本 PLINQ
    public void BasicPLINQ()
    {
        int[] numbers = Enumerable.Range(1, 1000000).ToArray();

        // 使用 AsParallel() 启用并行查询
        var evenSquares = numbers
            .AsParallel()
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .ToArray();

        Console.WriteLine($"找到 {evenSquares.Length} 个偶数的平方");
    }

    // 控制并行度
    public void PLINQWithDegreeOfParallelism()
    {
        int[] data = Enumerable.Range(1, 10000).ToArray();

        var result = data
            .AsParallel()
            .WithDegreeOfParallelism(4)  // 最多使用 4 个线程
            .Where(x => IsPrime(x))
            .ToArray();

        Console.WriteLine($"找到 {result.Length} 个素数");
    }

    // 保持顺序
    public void PLINQWithOrdering()
    {
        int[] numbers = { 5, 3, 8, 1, 9, 2, 7, 4, 6 };

        // 默认 PLINQ 不保证顺序
        var unordered = numbers
            .AsParallel()
            .Select(n => n * 2)
            .ToArray();

        Console.WriteLine($"无序结果: {string.Join(", ", unordered)}");

        // 使用 AsOrdered() 保持顺序
        var ordered = numbers
            .AsParallel()
            .AsOrdered()
            .Select(n => n * 2)
            .ToArray();

        Console.WriteLine($"有序结果: {string.Join(", ", ordered)}");
    }

    // 强制并行执行
    public void ForceParallelism()
    {
        var result = Enumerable.Range(1, 100)
            .AsParallel()
            .WithExecutionMode(ParallelExecutionMode.ForceParallelism)  // 强制并行
            .Select(x =>
            {
                Console.WriteLine($"处理 {x} 在线程 {Thread.CurrentThread.ManagedThreadId}");
                return x * 2;
            })
            .ToArray();
    }

    // 指定合并选项
    public void MergeOptions()
    {
        // NotBuffered: 结果立即返回（适合流式处理）
        var stream = Enumerable.Range(1, 1000)
            .AsParallel()
            .WithMergeOptions(ParallelMergeOptions.NotBuffered)
            .Select(x => x * 2);

        // AutoBuffered: 部分缓冲（默认）
        var autoBuf = Enumerable.Range(1, 1000)
            .AsParallel()
            .WithMergeOptions(ParallelMergeOptions.AutoBuffered)
            .Select(x => x * 2);

        // FullyBuffered: 完全缓冲（确保顺序）
        var fullyBuf = Enumerable.Range(1, 1000)
            .AsParallel()
            .WithMergeOptions(ParallelMergeOptions.FullyBuffered)
            .Select(x => x * 2);
    }

    // PLINQ 聚合
    public void PLINQAggregation()
    {
        int[] numbers = Enumerable.Range(1, 10000).ToArray();

        // 并行求和
        int sum = numbers.AsParallel().Sum();

        // 并行求平均
        double avg = numbers.AsParallel().Average();

        // 自定义聚合
        long customSum = numbers.AsParallel().Aggregate(
            0L,                              // 种子值
            (subtotal, item) => subtotal + item,  // 累加器
            (total, subtotal) => total + subtotal, // 合并器
            total => total                    // 最终选择器
        );

        Console.WriteLine($"Sum: {sum}, Avg: {avg}, Custom: {customSum}");
    }

    // PLINQ 取消
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
                // 处理结果
            }
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("查询已取消");
        }
    }

    // PLINQ 异常处理
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
                Console.WriteLine($"异常: {ex.Message}");
            }
        }
    }

    // ForAll - 无需等待所有结果
    public void PLINQForAll()
    {
        ConcurrentBag<int> results = new ConcurrentBag<int>();

        Enumerable.Range(1, 1000)
            .AsParallel()
            .Where(n => n % 2 == 0)
            .ForAll(n =>
            {
                // 直接在工作线程上处理，无需收集结果
                results.Add(ProcessItem(n));
            });

        Console.WriteLine($"处理了 {results.Count} 个项目");
    }

    // 实际应用：图像处理
    public byte[][] ProcessImages(byte[][] images)
    {
        return images
            .AsParallel()
            .AsOrdered()  // 保持图像顺序
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
    private byte[] ApplyFilter(byte[] image) => image;  // 模拟图像处理
}
```

### 数据分区策略

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public class PartitioningExamples
{
    // 范围分区（适合索引访问）
    public void RangePartitioning()
    {
        int[] data = Enumerable.Range(0, 10000).ToArray();

        // 创建范围分区器
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

            Console.WriteLine($"处理范围 [{range.Item1}, {range.Item2})");
        });

        Console.WriteLine($"总和: {totalSum}");
    }

    // 负载均衡分区
    public void LoadBalancingPartitioning()
    {
        // 当每个元素处理时间不同时，使用负载均衡分区
        int[] data = Enumerable.Range(0, 100).ToArray();

        var loadBalancer = Partitioner.Create(data, true);  // true = 启用负载均衡

        Parallel.ForEach(loadBalancer, item =>
        {
            // 模拟不均匀的工作负载
            Thread.Sleep(item % 10);
            Console.WriteLine($"处理 {item} - 线程 {Thread.CurrentThread.ManagedThreadId}");
        });
    }

    // 自定义分区器
    public void CustomPartitioner()
    {
        int[] data = Enumerable.Range(0, 1000).ToArray();

        // 按照工作量自定义分区
        var customPartitioner = new ChunkPartitioner<int>(data, chunkSize: 50);

        Parallel.ForEach(customPartitioner, item =>
        {
            // 处理每个项目
        });
    }

    // 块分区（适合不支持索引的集合）
    public void ChunkPartitioning()
    {
        IEnumerable<int> sequence = GenerateSequence();

        // 创建块分区器，每块 100 个元素
        var chunkPartitioner = Partitioner.Create(sequence);

        Parallel.ForEach(chunkPartitioner, item =>
        {
            ProcessItem(item);
        });
    }

    // 有序分区
    public void OrderedPartitioning()
    {
        int[] data = Enumerable.Range(0, 1000).ToArray();

        // 创建有序分区器
        var orderedPartitioner = Partitioner.Create(data, loadBalance: false);

        int[] results = new int[data.Length];

        Parallel.ForEach(orderedPartitioner, (item, state, index) =>
        {
            results[index] = item * 2;
        });

        // results 保持与输入相同的顺序
    }

    // 分区与 PLINQ 结合
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

// 自定义分区器实现
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

    // 基本异步并行
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
                Console.WriteLine($"下载 {url}: {content.Length} 字节");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"下载失败 {url}: {ex.Message}");
            }
        });
    }

    // 控制并发度
    public async Task ForEachAsyncWithConcurrency()
    {
        IEnumerable<int> ids = Enumerable.Range(1, 100);

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 10  // 最多 10 个并发请求
        };

        await Parallel.ForEachAsync(ids, options, async (id, ct) =>
        {
            await ProcessItemAsync(id, ct);
        });
    }

    // 带取消支持
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
            Console.WriteLine("操作已取消");
        }
    }

    // 错误处理
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
                // 记录错误但继续处理其他项目
                Console.WriteLine($"处理 {url} 时出错: {ex.Message}");
            }
        });

        if (errors.Any())
        {
            Console.WriteLine($"完成，但有 {errors.Count} 个错误");
        }
    }

    // 实际应用：批量 API 调用
    public async Task<Dictionary<int, UserData>> FetchUserDataBatch(IEnumerable<int> userIds)
    {
        ConcurrentDictionary<int, UserData> results = new ConcurrentDictionary<int, UserData>();

        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 20  // 限制并发 API 调用
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

## 最佳实践

### 选择合适的并行度

```csharp
public class ParallelismBestPractices
{
    // CPU 密集型任务：使用处理器核心数
    public void CpuBoundTask()
    {
        ParallelOptions options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount
        };

        Parallel.For(0, 1000, options, i =>
        {
            // CPU 密集型计算
        });
    }

    // I/O 密集型任务：可以使用更高的并行度
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

    // 混合任务：根据实际情况调整
    public void MixedTask()
    {
        // 使用基准测试来确定最佳并行度
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

### 避免共享状态竞争

```csharp
public class SharedStateBestPractices
{
    // 使用线程本地状态
    public long CalculateSumWithLocalState(int[] data)
    {
        long total = 0;

        Parallel.For(0, data.Length,
            () => 0L,  // 本地状态初始化
            (i, state, local) => local + data[i],  // 累加到本地状态
            local => Interlocked.Add(ref total, local)  // 合并本地状态
        );

        return total;
    }

    // 使用并发集合
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

    // 使用分区写入
    public int[] ProcessWithPartitionedWrite(int[] data)
    {
        int[] results = new int[data.Length];

        Parallel.For(0, data.Length, i =>
        {
            // 每个索引只被一个线程写入，无需同步
            results[i] = ProcessItem(data[i]);
        });

        return results;
    }

    private bool ShouldInclude(int item) => item > 0;
    private int ProcessItem(int item) => item * 2;
}
```

### 正确处理异常

```csharp
public class ExceptionHandlingBestPractices
{
    // 收集所有异常
    public void HandleAllExceptions()
    {
        try
        {
            Parallel.For(0, 10, i =>
            {
                if (i == 3) throw new InvalidOperationException($"错误 at {i}");
                if (i == 7) throw new ArgumentException($"参数错误 at {i}");
            });
        }
        catch (AggregateException ae)
        {
            Console.WriteLine($"捕获 {ae.InnerExceptions.Count} 个异常:");
            foreach (var ex in ae.InnerExceptions)
            {
                Console.WriteLine($"  - {ex.GetType().Name}: {ex.Message}");
            }
        }
    }

    // 处理特定异常类型
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
                    Console.WriteLine("超时错误已处理");
                    return true;  // 已处理
                }
                return false;  // 未处理，重新抛出
            });
        }
    }

    // 在循环内处理异常
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
                // 继续处理其他项目
            }
        });

        if (errors.Any())
        {
            throw new AggregateException("处理过程中出现错误", errors);
        }
    }

    private IEnumerable<int> GetItems() => Enumerable.Range(0, 10);
    private void ProcessItem(int item) { }
}
```

### 合理使用取消令牌

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
                // 检查取消
                ct.ThrowIfCancellationRequested();

                // 处理项目
                await ProcessItemAsync(item, ct);
            });
        }
        catch (OperationCanceledException) when (externalToken.IsCancellationRequested)
        {
            Console.WriteLine("外部取消请求");
            throw;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("内部取消");
        }
    }

    // 设置超时
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
            Console.WriteLine($"操作超时 ({timeout})");
        }
    }

    private IEnumerable<int> GetItems() => Enumerable.Range(0, 100);
    private async Task ProcessItemAsync(int item, CancellationToken ct) => await Task.Delay(100, ct);
}
```

## 常见陷阱

### 闭包变量捕获问题

```csharp
public class ClosurePitfall
{
    // 问题示例
    public void BadClosureCapture()
    {
        List<Action> actions = new List<Action>();

        for (int i = 0; i < 10; i++)
        {
            // 所有 action 都捕获同一个变量 i
            actions.Add(() => Console.WriteLine(i));
        }

        Parallel.Invoke(actions.ToArray());
        // 输出：全部是 10
    }

    // 正确做法
    public void GoodClosureCapture()
    {
        List<Action> actions = new List<Action>();

        for (int i = 0; i < 10; i++)
        {
            int captured = i;  // 在每次迭代中创建新变量
            actions.Add(() => Console.WriteLine(captured));
        }

        Parallel.Invoke(actions.ToArray());
        // 输出：0 到 9（顺序可能不同）
    }
}
```

### 不适当的锁使用

```csharp
public class LockPitfall
{
    private readonly object _lock = new object();
    private int _counter = 0;

    // 问题：过度锁定导致串行化
    public void OverLocking()
    {
        Parallel.For(0, 10000, i =>
        {
            lock (_lock)
            {
                // 整个操作都在锁内，失去并行优势
                var result = ExpensiveComputation(i);
                _counter += result;
            }
        });
    }

    // 改进：减小锁的粒度
    public void MinimalLocking()
    {
        Parallel.For(0, 10000, i =>
        {
            // 计算在锁外进行
            var result = ExpensiveComputation(i);

            lock (_lock)
            {
                // 只锁定共享状态的更新
                _counter += result;
            }
        });
    }

    // 最佳：使用原子操作
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

### 在 Parallel 循环中使用 async void

```csharp
public class AsyncVoidPitfall
{
    // 错误：async void 导致无法等待完成
    public void BadAsyncInParallel()
    {
        Parallel.ForEach(GetUrls(), async url =>
        {
            // 这是 async void！
            await DownloadAsync(url);
        });

        // Parallel.ForEach 立即返回，下载可能尚未完成
        Console.WriteLine("完成？其实还在下载...");
    }

    // 正确：使用 Parallel.ForEachAsync (.NET 6+)
    public async Task GoodAsyncInParallel()
    {
        await Parallel.ForEachAsync(GetUrls(), async (url, ct) =>
        {
            await DownloadAsync(url);
        });

        Console.WriteLine("真正完成了！");
    }

    // 替代方案：使用 Task.WhenAll
    public async Task AlternativeAsyncParallel()
    {
        var tasks = GetUrls().Select(url => DownloadAsync(url));
        await Task.WhenAll(tasks);
    }

    private IEnumerable<string> GetUrls() => new List<string> { "url1", "url2" };
    private async Task DownloadAsync(string url) => await Task.Delay(100);
}
```

### 忽略工作量不均匀

```csharp
public class LoadImbalancePitfall
{
    // 问题：工作量不均匀导致效率低下
    public void UnbalancedWork()
    {
        int[] data = Enumerable.Range(1, 100).ToArray();

        // 如果处理时间与 i 成正比，后面的线程会更忙
        Parallel.For(0, data.Length, i =>
        {
            // 处理时间不均匀
            Thread.Sleep(i);  // i 越大，等待越长
        });
    }

    // 改进：使用动态分区
    public void BalancedWork()
    {
        int[] data = Enumerable.Range(1, 100).ToArray();

        // 启用负载均衡
        var partitioner = Partitioner.Create(data, loadBalance: true);

        Parallel.ForEach(partitioner, item =>
        {
            Thread.Sleep(item);
        });
    }
}
```

### 在 UI 线程上使用 Parallel

```csharp
public class UIThreadPitfall
{
    // 问题：Parallel 会阻塞 UI 线程
    public void BlockingUI()
    {
        // 在 UI 线程调用会导致界面冻结
        Parallel.For(0, 1000, i =>
        {
            ExpensiveComputation(i);
        });
    }

    // 正确：在后台线程执行并行操作
    public async Task NonBlockingUI()
    {
        await Task.Run(() =>
        {
            Parallel.For(0, 1000, i =>
            {
                ExpensiveComputation(i);
            });
        });

        // 回到 UI 线程更新界面
        UpdateUI();
    }

    private void ExpensiveComputation(int i) { }
    private void UpdateUI() { }
}
```

## 性能考量

### 何时使用 Parallel

```csharp
public class PerformanceConsiderations
{
    // 适合并行化的场景
    public void GoodForParallel()
    {
        // 1. CPU 密集型任务
        Parallel.For(0, 1000, i =>
        {
            CalculatePrimes(i * 1000, (i + 1) * 1000);
        });

        // 2. 大量独立的数据处理
        int[] largeArray = new int[1000000];
        Parallel.For(0, largeArray.Length, i =>
        {
            largeArray[i] = ProcessValue(i);
        });
    }

    // 不适合并行化的场景
    public void BadForParallel()
    {
        // 1. 任务太小，开销大于收益
        int[] smallArray = new int[10];
        // 并行化的开销可能超过计算本身

        // 2. 有大量共享状态
        // 3. 顺序依赖的操作
    }

    private void CalculatePrimes(int start, int end) { }
    private int ProcessValue(int i) => i * 2;
}
```

### 性能基准测试

```csharp
using System.Diagnostics;

public class PerformanceBenchmark
{
    public void ComparePerformance()
    {
        int[] data = Enumerable.Range(0, 10000000).ToArray();

        // 串行执行
        var sw1 = Stopwatch.StartNew();
        long sum1 = 0;
        for (int i = 0; i < data.Length; i++)
        {
            sum1 += ComputeIntensive(data[i]);
        }
        sw1.Stop();
        Console.WriteLine($"串行: {sw1.ElapsedMilliseconds}ms");

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

        // 计算加速比
        Console.WriteLine($"Parallel.For 加速比: {(double)sw1.ElapsedMilliseconds / sw2.ElapsedMilliseconds:F2}x");
        Console.WriteLine($"PLINQ 加速比: {(double)sw1.ElapsedMilliseconds / sw3.ElapsedMilliseconds:F2}x");
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

### 内存考量

```csharp
public class MemoryConsiderations
{
    // 避免在每次迭代中分配对象
    public void AvoidAllocation()
    {
        // 问题：每次迭代都创建新对象
        Parallel.For(0, 100000, i =>
        {
            var list = new List<int>();  // 频繁分配
            // ...
        });

        // 改进：使用 ArrayPool
        var pool = ArrayPool<int>.Shared;

        Parallel.For(0, 100000, i =>
        {
            int[] buffer = pool.Rent(1024);
            try
            {
                // 使用 buffer
            }
            finally
            {
                pool.Return(buffer);
            }
        });
    }

    // 使用 Span 减少内存复制
    public void UseSpan()
    {
        int[] data = new int[1000000];

        var rangePartitioner = Partitioner.Create(0, data.Length, 10000);

        Parallel.ForEach(rangePartitioner, range =>
        {
            // 使用 Span 避免数组复制
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

## 实战场景

### 图像批量处理

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
                // 读取图像
                byte[] imageData = await File.ReadAllBytesAsync(imagePath, ct);

                // 处理图像（同步操作，但在不同线程并行执行）
                byte[] processedData = ProcessImage(imageData);

                // 保存结果
                string outputPath = Path.Combine(outputDir, Path.GetFileName(imagePath));
                await File.WriteAllBytesAsync(outputPath, processedData, ct);

                processedFiles.Add(outputPath);
            }
            catch (Exception ex)
            {
                errors.Add(new Exception($"处理 {imagePath} 失败: {ex.Message}", ex));
            }
        });

        Console.WriteLine($"成功处理: {processedFiles.Count} 个文件");
        Console.WriteLine($"失败: {errors.Count} 个文件");
    }

    private byte[] ProcessImage(byte[] imageData)
    {
        // 模拟图像处理
        return imageData;
    }
}
```

### 数据分析管道

```csharp
public class DataAnalysisPipeline
{
    public AnalysisResult AnalyzeData(IEnumerable<DataPoint> dataPoints)
    {
        // 将数据转换为列表以支持并行访问
        List<DataPoint> data = dataPoints.ToList();

        // 并行计算多个统计指标
        double mean = 0, stdDev = 0, median = 0;
        int[] histogram = null;

        Parallel.Invoke(
            // 计算均值
            () => mean = data.AsParallel().Average(d => d.Value),

            // 计算标准差
            () =>
            {
                double avg = data.Average(d => d.Value);
                double sumSquares = data.AsParallel().Sum(d => Math.Pow(d.Value - avg, 2));
                stdDev = Math.Sqrt(sumSquares / data.Count);
            },

            // 计算中位数
            () =>
            {
                var sorted = data.AsParallel().OrderBy(d => d.Value).ToList();
                int mid = sorted.Count / 2;
                median = sorted.Count % 2 == 0
                    ? (sorted[mid - 1].Value + sorted[mid].Value) / 2
                    : sorted[mid].Value;
            },

            // 计算直方图
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

### 并行 Web 爬虫

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

                        // 将新发现的链接加入队列
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
        // 简化的链接提取逻辑
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

### 文件并行搜索

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

        // 获取所有匹配的文件
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

                // 并行搜索文件内容
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
                Console.WriteLine($"搜索 {filePath} 时出错: {ex.Message}");
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

## 面试要点

### 常见面试问题

**Q1: Parallel.For 和 Task.WhenAll 有什么区别？**

```csharp
// Parallel.For：同步阻塞，适合 CPU 密集型
Parallel.For(0, 100, i => ComputeIntensive(i));  // 阻塞直到完成

// Task.WhenAll：异步非阻塞，适合 I/O 密集型
var tasks = Enumerable.Range(0, 100).Select(i => ProcessAsync(i));
await Task.WhenAll(tasks);  // 异步等待

// 主要区别：
// 1. Parallel.For 是同步的，会阻塞调用线程
// 2. Task.WhenAll 是异步的，不阻塞调用线程
// 3. Parallel.For 使用工作窃取算法优化性能
// 4. Task.WhenAll 适合组合多个异步操作
```

**Q2: 如何在 Parallel.ForEach 中处理异常？**

```csharp
// 方法 1：使用 AggregateException
try
{
    Parallel.ForEach(items, item => ProcessWithPossibleError(item));
}
catch (AggregateException ae)
{
    foreach (var ex in ae.InnerExceptions)
    {
        Console.WriteLine($"错误: {ex.Message}");
    }
}

// 方法 2：在循环内捕获
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

**Q3: PLINQ 的 AsOrdered() 对性能有什么影响？**

```csharp
// 不保序：性能最佳
var unordered = data.AsParallel()
    .Select(x => ExpensiveTransform(x));  // 完成即返回

// 保序：需要额外的同步开销
var ordered = data.AsParallel()
    .AsOrdered()
    .Select(x => ExpensiveTransform(x));  // 需要等待之前的项完成

// AsOrdered 开销：
// 1. 需要缓冲结果
// 2. 需要等待之前索引的结果
// 3. 可能导致部分线程空闲等待
```

**Q4: 什么时候应该避免使用 Parallel 类？**

```csharp
// 不适合使用 Parallel 的场景：

// 1. 任务太小
Parallel.For(0, 10, i => i * 2);  // 开销大于收益

// 2. 有顺序依赖
// 计算依赖前一个结果
int prev = 0;
Parallel.For(0, 100, i => prev = prev + i);  // 错误！

// 3. 主要是 I/O 等待
Parallel.ForEach(urls, url => Download(url));  // 用 async/await 更好

// 4. 共享状态太多
// 大量锁竞争会降低并行效率

// 5. 在 UI 线程调用
Parallel.For(0, 1000, i => Compute(i));  // 会冻结 UI
```

**Q5: 如何选择 MaxDegreeOfParallelism？**

```csharp
// CPU 密集型：使用核心数
MaxDegreeOfParallelism = Environment.ProcessorCount;

// I/O 密集型：可以更高
MaxDegreeOfParallelism = Environment.ProcessorCount * 2;

// 有速率限制的外部服务
MaxDegreeOfParallelism = 10;  // 根据 API 限制

// 内存敏感：根据可用内存调整
MaxDegreeOfParallelism = Math.Min(
    Environment.ProcessorCount,
    (int)(GetAvailableMemory() / PerTaskMemoryUsage)
);

// 动态调整
MaxDegreeOfParallelism = DetermineOptimalParallelism();
```

## 延伸阅读

### 官方文档

- [Parallel 类 - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel)
- [任务并行库 (TPL) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl)
- [PLINQ 简介 - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/introduction-to-plinq)
- [数据分区 - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/custom-partitioners-for-plinq-and-tpl)

### 经典书籍

- 《CLR via C#》 - Jeffrey Richter（第 27-28 章）
- 《Concurrency in C# Cookbook》 - Stephen Cleary
- 《Pro .NET Performance》 - Sasha Goldshtein
- 《C# 10 in a Nutshell》 - Joseph Albahari（第 22-23 章）

### 优质文章

- [Parallel Programming in .NET - Microsoft Patterns & Practices](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff963553(v=pandp.10))
- [Understanding C# async / await Pattern](https://blog.stephencleary.com/2012/02/async-and-await.html)
- [Best Practices in Asynchronous Programming](https://docs.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming)

### 相关主题

- [C# 异步编程](/docs/csharp/async) - Task、async/await 基础
- [C# 集合](/docs/csharp/collections) - 并发集合详解
- [C# Span 和 Memory](/docs/csharp/span-memory) - 高性能内存操作
