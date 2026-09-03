---
title: Span与Memory
description: C# Span与Memory完全指南，高性能内存操作与零分配编程
track: csharp
section: types-linq
difficulty: advanced
tags:
  - C#
  - Span
  - Memory
  - 性能
status: imported
origin: old/src/content/docs/csharp/span-memory.zh.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 性能优化
  order: 9
  lastUpdated: 2026-01-07
---

在现代高性能 C# 应用程序开发中，内存管理和性能优化至关重要。`Span<T>` 和 `Memory<T>` 是 .NET 中用于高效内存操作的核心类型，它们允许开发者在不进行堆分配的情况下处理连续内存区域，从而实现零分配编程。

## Span 基础

### 什么是 Span<T>

`Span<T>` 是一个轻量级的值类型（`ref struct`），它表示任意连续内存区域的类型安全视图。它可以指向托管堆、栈或非托管内存，而不需要进行任何内存分配。

```csharp
using System;

class SpanBasics
{
    static void Main()
    {
        // 从数组创建 Span
        int[] numbers = { 1, 2, 3, 4, 5 };
        Span<int> span = numbers.AsSpan();

        // 修改 Span 会影响原始数组
        span[0] = 100;
        Console.WriteLine($"数组第一个元素: {numbers[0]}"); // 输出: 100

        // 使用 Span 遍历
        foreach (ref int num in span)
        {
            num *= 2;
        }

        Console.WriteLine("修改后的数组:");
        foreach (var num in numbers)
        {
            Console.WriteLine(num); // 200, 4, 6, 8, 10
        }
    }
}
```

### Span 的创建方式

```csharp
using System;
using System.Runtime.InteropServices;

class SpanCreation
{
    static void Main()
    {
        // 1. 从数组创建
        int[] array = { 1, 2, 3, 4, 5 };
        Span<int> fromArray = array.AsSpan();
        Span<int> fromArraySlice = array.AsSpan(1, 3); // 从索引 1 开始，取 3 个元素

        // 2. 使用构造函数
        Span<int> fromCtor = new Span<int>(array);
        Span<int> fromCtorSlice = new Span<int>(array, 2, 2);

        // 3. 使用 stackalloc（仅在栈上分配）
        Span<int> stackSpan = stackalloc int[5] { 10, 20, 30, 40, 50 };

        // 4. 从指针创建（不安全代码）
        unsafe
        {
            int* ptr = stackalloc int[3] { 100, 200, 300 };
            Span<int> fromPointer = new Span<int>(ptr, 3);
            Console.WriteLine($"从指针创建: {fromPointer[0]}, {fromPointer[1]}, {fromPointer[2]}");
        }

        // 5. 空 Span
        Span<int> emptySpan = Span<int>.Empty;
        Console.WriteLine($"空 Span 长度: {emptySpan.Length}"); // 0
    }
}
```

### ReadOnlySpan<T>

`ReadOnlySpan<T>` 是 `Span<T>` 的只读版本，特别适用于处理不可变数据，如字符串。

```csharp
using System;

class ReadOnlySpanExample
{
    static void Main()
    {
        // 字符串可以直接转换为 ReadOnlySpan<char>
        string text = "Hello, World!";
        ReadOnlySpan<char> charSpan = text.AsSpan();

        // 获取子字符串（不分配内存）
        ReadOnlySpan<char> hello = charSpan.Slice(0, 5);
        ReadOnlySpan<char> world = charSpan.Slice(7, 5);

        Console.WriteLine($"Hello: {hello.ToString()}");
        Console.WriteLine($"World: {world.ToString()}");

        // 从只读数组创建
        ReadOnlySpan<int> readOnlyNumbers = new int[] { 1, 2, 3, 4, 5 };

        // Span 可以隐式转换为 ReadOnlySpan
        int[] numbers = { 10, 20, 30 };
        Span<int> span = numbers.AsSpan();
        ReadOnlySpan<int> readOnly = span; // 隐式转换

        ProcessReadOnly(span); // Span 可以传递给接受 ReadOnlySpan 的方法
    }

    static void ProcessReadOnly(ReadOnlySpan<int> data)
    {
        foreach (int item in data)
        {
            Console.WriteLine(item);
        }
    }
}
```

### Span 的 ref struct 限制

由于 `Span<T>` 是 `ref struct` 类型，它具有以下限制：

```csharp
using System;
using System.Threading.Tasks;

class SpanRestrictions
{
    // ❌ 不能作为类的字段
    // private Span<int> _span; // 编译错误

    // ❌ 不能被装箱
    static void CannotBox()
    {
        Span<int> span = stackalloc int[5];
        // object obj = span; // 编译错误
    }

    // ❌ 不能在异步方法中使用
    // static async Task CannotUseInAsync()
    // {
    //     Span<int> span = stackalloc int[5];
    //     await Task.Delay(100); // 编译错误：不能在异步方法中使用 Span
    // }

    // ❌ 不能被 Lambda 表达式捕获
    static void CannotCapture()
    {
        Span<int> span = stackalloc int[5];
        // Action action = () => Console.WriteLine(span.Length); // 编译错误
    }

    // ❌ 不能作为泛型类型参数
    static void CannotBeGenericArg()
    {
        // List<Span<int>> list = new List<Span<int>>(); // 编译错误
    }

    // ✅ 可以在同步方法中使用
    static void CanUseInSync()
    {
        Span<int> span = stackalloc int[5];
        for (int i = 0; i < span.Length; i++)
        {
            span[i] = i * 10;
        }
    }

    // ✅ 可以作为方法参数和返回值（有条件）
    static Span<int> GetSpan(int[] array)
    {
        return array.AsSpan();
    }
}
```

### Span 的常用方法

```csharp
using System;

class SpanMethods
{
    static void Main()
    {
        Span<int> span = stackalloc int[] { 5, 3, 8, 1, 9, 2, 7, 4, 6 };

        // 填充
        Span<int> toFill = stackalloc int[5];
        toFill.Fill(42);
        Console.WriteLine($"填充后: {string.Join(", ", toFill.ToArray())}"); // 42, 42, 42, 42, 42

        // 清空
        Span<int> toClear = stackalloc int[] { 1, 2, 3, 4, 5 };
        toClear.Clear();
        Console.WriteLine($"清空后: {string.Join(", ", toClear.ToArray())}"); // 0, 0, 0, 0, 0

        // 复制
        Span<int> source = stackalloc int[] { 10, 20, 30 };
        Span<int> destination = stackalloc int[5];
        source.CopyTo(destination);
        Console.WriteLine($"复制后: {string.Join(", ", destination.ToArray())}"); // 10, 20, 30, 0, 0

        // 尝试复制（如果目标太小则返回 false）
        Span<int> smallDest = stackalloc int[2];
        bool success = source.TryCopyTo(smallDest);
        Console.WriteLine($"尝试复制结果: {success}"); // false

        // 反转
        Span<int> toReverse = stackalloc int[] { 1, 2, 3, 4, 5 };
        toReverse.Reverse();
        Console.WriteLine($"反转后: {string.Join(", ", toReverse.ToArray())}"); // 5, 4, 3, 2, 1

        // 排序（.NET 5+）
        span.Sort();
        Console.WriteLine($"排序后: {string.Join(", ", span.ToArray())}"); // 1, 2, 3, 4, 5, 6, 7, 8, 9

        // 二分查找（需要先排序）
        int index = span.BinarySearch(5);
        Console.WriteLine($"元素 5 的索引: {index}"); // 4

        // 转换为数组
        int[] array = span.ToArray();

        // 检查是否为空
        Span<int> empty = Span<int>.Empty;
        Console.WriteLine($"是否为空: {empty.IsEmpty}"); // true
    }
}
```

## Memory 类型

### 什么是 Memory<T>

`Memory<T>` 是 `Span<T>` 的"堆友好"版本。它可以存储在堆上，因此可以用作类的字段、在异步方法中使用，以及被 Lambda 表达式捕获。

```csharp
using System;
using System.Threading.Tasks;

class MemoryBasics
{
    // ✅ Memory 可以作为类的字段
    private Memory<int> _data;

    public MemoryBasics(int[] data)
    {
        _data = data.AsMemory();
    }

    // ✅ Memory 可以在异步方法中使用
    public async Task ProcessDataAsync()
    {
        Console.WriteLine($"开始处理，数据长度: {_data.Length}");

        await Task.Delay(100);

        // 当需要实际操作数据时，获取 Span
        Span<int> span = _data.Span;
        for (int i = 0; i < span.Length; i++)
        {
            span[i] *= 2;
        }

        await Task.Delay(100);

        Console.WriteLine("处理完成");
    }

    static async Task Main()
    {
        int[] numbers = { 1, 2, 3, 4, 5 };
        var processor = new MemoryBasics(numbers);

        await processor.ProcessDataAsync();

        Console.WriteLine($"处理后: {string.Join(", ", numbers)}"); // 2, 4, 6, 8, 10
    }
}
```

### Memory 与 Span 的关系

```csharp
using System;
using System.Threading.Tasks;

class MemoryAndSpan
{
    static async Task Main()
    {
        int[] array = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        Memory<int> memory = array.AsMemory();

        // Memory 可以切片
        Memory<int> slice = memory.Slice(2, 5);
        Console.WriteLine($"切片长度: {slice.Length}"); // 5

        // 在需要时获取 Span
        Span<int> span = memory.Span;
        span[0] = 100;

        // 在异步方法中使用 Memory
        await ProcessMemoryAsync(memory);

        // 传递给同步方法时转换为 Span
        ProcessSpan(memory.Span);
    }

    static async Task ProcessMemoryAsync(Memory<int> memory)
    {
        await Task.Delay(50);

        // 在 await 之后获取 Span
        Span<int> span = memory.Span;
        foreach (ref int item in span)
        {
            item++;
        }

        await Task.Delay(50);
    }

    static void ProcessSpan(Span<int> span)
    {
        foreach (ref int item in span)
        {
            item *= 2;
        }
    }
}
```

### ReadOnlyMemory<T>

```csharp
using System;
using System.Threading.Tasks;

class ReadOnlyMemoryExample
{
    static async Task Main()
    {
        string text = "Hello, World! This is a test string.";
        ReadOnlyMemory<char> memory = text.AsMemory();

        // 异步处理字符串片段
        await ProcessWordsAsync(memory);
    }

    static async Task ProcessWordsAsync(ReadOnlyMemory<char> text)
    {
        int start = 0;

        for (int i = 0; i <= text.Length; i++)
        {
            if (i == text.Length || text.Span[i] == ' ')
            {
                if (i > start)
                {
                    ReadOnlyMemory<char> word = text.Slice(start, i - start);
                    await ProcessWordAsync(word);
                }
                start = i + 1;
            }
        }
    }

    static async Task ProcessWordAsync(ReadOnlyMemory<char> word)
    {
        await Task.Delay(10);
        Console.WriteLine($"处理单词: {word.Span.ToString()}");
    }
}
```

### IMemoryOwner<T> 和 MemoryPool<T>

对于需要频繁分配和释放内存的场景，可以使用 `MemoryPool<T>` 来租用内存。

```csharp
using System;
using System.Buffers;

class MemoryPoolExample
{
    static void Main()
    {
        // 使用共享的 MemoryPool
        using (IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024))
        {
            Memory<byte> memory = owner.Memory;

            // 注意：实际分配的大小可能大于请求的大小
            Console.WriteLine($"请求 1024 字节，实际获得: {memory.Length} 字节");

            // 使用内存
            Span<byte> span = memory.Span;
            for (int i = 0; i < 100; i++)
            {
                span[i] = (byte)(i % 256);
            }

            ProcessData(memory.Slice(0, 100));
        } // 在 using 块结束时自动归还内存

        // 多次租用演示
        ProcessMultipleTimes();
    }

    static void ProcessData(Memory<byte> data)
    {
        Console.WriteLine($"处理 {data.Length} 字节数据");
    }

    static void ProcessMultipleTimes()
    {
        for (int i = 0; i < 5; i++)
        {
            using (IMemoryOwner<int> owner = MemoryPool<int>.Shared.Rent(256))
            {
                Memory<int> memory = owner.Memory.Slice(0, 256);
                memory.Span.Fill(i);
                Console.WriteLine($"第 {i + 1} 次租用，第一个元素: {memory.Span[0]}");
            }
        }
    }
}
```

## stackalloc 与栈分配

### stackalloc 基础

`stackalloc` 关键字在栈上分配内存，避免了堆分配和垃圾回收的开销。

```csharp
using System;

class StackAllocBasics
{
    static void Main()
    {
        // 基本 stackalloc 用法
        Span<int> numbers = stackalloc int[5];
        for (int i = 0; i < numbers.Length; i++)
        {
            numbers[i] = (i + 1) * 10;
        }
        Console.WriteLine($"栈分配数组: {string.Join(", ", numbers.ToArray())}");

        // 带初始化器的 stackalloc
        Span<int> initialized = stackalloc int[] { 1, 2, 3, 4, 5 };
        Console.WriteLine($"初始化数组: {string.Join(", ", initialized.ToArray())}");

        // stackalloc 字节缓冲区
        Span<byte> buffer = stackalloc byte[256];
        buffer.Fill(0xFF);
        Console.WriteLine($"缓冲区第一个字节: 0x{buffer[0]:X2}");

        // stackalloc 用于字符处理
        Span<char> chars = stackalloc char[10];
        "Hello".AsSpan().CopyTo(chars);
        Console.WriteLine($"字符数组: {new string(chars.Slice(0, 5))}");
    }
}
```

### 安全的 stackalloc 模式

```csharp
using System;
using System.Buffers;

class SafeStackAlloc
{
    // 定义栈分配的安全阈值
    private const int StackAllocThreshold = 256;

    static void Main()
    {
        // 小数据使用栈分配
        ProcessData(100);

        // 大数据使用堆分配
        ProcessData(1000);
    }

    static void ProcessData(int size)
    {
        // 条件栈分配模式
        Span<byte> buffer = size <= StackAllocThreshold
            ? stackalloc byte[size]
            : new byte[size];

        // 使用缓冲区
        buffer.Fill(42);
        Console.WriteLine($"处理 {size} 字节，第一个值: {buffer[0]}");
    }

    // 使用 ArrayPool 的更优模式
    static void ProcessDataWithPool(int size)
    {
        byte[]? rentedArray = null;

        try
        {
            Span<byte> buffer = size <= StackAllocThreshold
                ? stackalloc byte[size]
                : (rentedArray = ArrayPool<byte>.Shared.Rent(size)).AsSpan(0, size);

            // 使用缓冲区
            buffer.Fill(42);
            Console.WriteLine($"处理 {size} 字节");
        }
        finally
        {
            if (rentedArray != null)
            {
                ArrayPool<byte>.Shared.Return(rentedArray);
            }
        }
    }
}
```

### stackalloc 与 unsafe 代码

```csharp
using System;

class StackAllocUnsafe
{
    static unsafe void Main()
    {
        // 传统的 unsafe stackalloc
        int* ptr = stackalloc int[5];
        for (int i = 0; i < 5; i++)
        {
            ptr[i] = (i + 1) * 100;
        }

        Console.WriteLine("使用指针访问:");
        for (int i = 0; i < 5; i++)
        {
            Console.WriteLine($"ptr[{i}] = {ptr[i]}");
        }

        // 将指针转换为 Span
        Span<int> span = new Span<int>(ptr, 5);
        Console.WriteLine($"通过 Span 访问第一个元素: {span[0]}");

        // 结构体数组
        Point* points = stackalloc Point[3];
        points[0] = new Point { X = 1, Y = 2 };
        points[1] = new Point { X = 3, Y = 4 };
        points[2] = new Point { X = 5, Y = 6 };

        Span<Point> pointSpan = new Span<Point>(points, 3);
        foreach (var point in pointSpan)
        {
            Console.WriteLine($"Point: ({point.X}, {point.Y})");
        }
    }

    struct Point
    {
        public int X;
        public int Y;
    }
}
```

## 切片操作

切片是 `Span<T>` 和 `Memory<T>` 的核心特性之一，它允许创建原始数据的视图而不进行任何内存复制。

### 基本切片操作

```csharp
using System;

class SlicingBasics
{
    static void Main()
    {
        int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
        Span<int> span = array.AsSpan();

        // 从指定索引开始切片
        Span<int> fromIndex = span.Slice(3);
        Console.WriteLine($"从索引 3 开始: {string.Join(", ", fromIndex.ToArray())}");
        // 输出: 3, 4, 5, 6, 7, 8, 9

        // 指定起始索引和长度
        Span<int> subRange = span.Slice(2, 4);
        Console.WriteLine($"索引 2 开始，长度 4: {string.Join(", ", subRange.ToArray())}");
        // 输出: 2, 3, 4, 5

        // 使用范围语法（C# 8.0+）
        Span<int> rangeSlice = span[2..6];
        Console.WriteLine($"范围 [2..6]: {string.Join(", ", rangeSlice.ToArray())}");
        // 输出: 2, 3, 4, 5

        // 从末尾切片
        Span<int> lastThree = span[^3..];
        Console.WriteLine($"最后 3 个: {string.Join(", ", lastThree.ToArray())}");
        // 输出: 7, 8, 9

        // 排除最后 2 个
        Span<int> exceptLastTwo = span[..^2];
        Console.WriteLine($"排除最后 2 个: {string.Join(", ", exceptLastTwo.ToArray())}");
        // 输出: 0, 1, 2, 3, 4, 5, 6, 7
    }
}
```

### 切片 vs Substring 性能对比

```csharp
using System;
using System.Diagnostics;

class SliceVsSubstring
{
    static void Main()
    {
        string longString = new string('a', 10000) + "TARGET" + new string('b', 10000);

        const int iterations = 100000;

        // 测试 Substring（会分配内存）
        var sw1 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            string sub = longString.Substring(10000, 6);
            _ = sub.Length; // 防止优化
        }
        sw1.Stop();
        Console.WriteLine($"Substring 耗时: {sw1.ElapsedMilliseconds}ms");

        // 测试 Span 切片（零分配）
        var sw2 = Stopwatch.StartNew();
        ReadOnlySpan<char> spanStr = longString.AsSpan();
        for (int i = 0; i < iterations; i++)
        {
            ReadOnlySpan<char> slice = spanStr.Slice(10000, 6);
            _ = slice.Length; // 防止优化
        }
        sw2.Stop();
        Console.WriteLine($"Span 切片耗时: {sw2.ElapsedMilliseconds}ms");

        // 验证结果相同
        string substring = longString.Substring(10000, 6);
        ReadOnlySpan<char> sliced = longString.AsSpan().Slice(10000, 6);
        Console.WriteLine($"结果相同: {substring == sliced.ToString()}");
    }
}
```

### 切片链式操作

```csharp
using System;

class ChainedSlicing
{
    static void Main()
    {
        int[] data = Enumerable.Range(0, 100).ToArray();
        Span<int> span = data.AsSpan();

        // 链式切片
        Span<int> result = span
            .Slice(10)      // 跳过前 10 个
            .Slice(0, 50)   // 取 50 个
            .Slice(5, 20);  // 再取中间 20 个

        Console.WriteLine($"链式切片结果: {string.Join(", ", result.ToArray())}");
        // 输出: 15, 16, 17, ... 34

        // 分块处理大数据
        ProcessInChunks(span, 25);
    }

    static void ProcessInChunks(Span<int> data, int chunkSize)
    {
        int processed = 0;
        int chunkIndex = 0;

        while (processed < data.Length)
        {
            int remaining = data.Length - processed;
            int currentChunkSize = Math.Min(chunkSize, remaining);

            Span<int> chunk = data.Slice(processed, currentChunkSize);

            Console.WriteLine($"块 {chunkIndex}: 从 {processed} 开始，{currentChunkSize} 个元素");
            Console.WriteLine($"  首元素: {chunk[0]}, 末元素: {chunk[^1]}");

            processed += currentChunkSize;
            chunkIndex++;
        }
    }
}
```

## 字符串操作优化

### 高效的字符串解析

```csharp
using System;

class StringParsing
{
    static void Main()
    {
        // CSV 行解析示例
        string csvLine = "张三,25,北京,工程师,50000";
        ParseCsvLine(csvLine.AsSpan());

        // 日期解析
        string dateStr = "2024-12-25";
        var (year, month, day) = ParseDate(dateStr.AsSpan());
        Console.WriteLine($"解析日期: {year}年{month}月{day}日");

        // IP 地址解析
        string ip = "192.168.1.100";
        var parts = ParseIpAddress(ip.AsSpan());
        Console.WriteLine($"IP 地址: {parts[0]}.{parts[1]}.{parts[2]}.{parts[3]}");
    }

    static void ParseCsvLine(ReadOnlySpan<char> line)
    {
        Console.WriteLine("CSV 解析结果:");
        int fieldIndex = 0;
        int start = 0;

        for (int i = 0; i <= line.Length; i++)
        {
            if (i == line.Length || line[i] == ',')
            {
                ReadOnlySpan<char> field = line.Slice(start, i - start);
                Console.WriteLine($"  字段 {fieldIndex}: {field.ToString()}");
                start = i + 1;
                fieldIndex++;
            }
        }
    }

    static (int year, int month, int day) ParseDate(ReadOnlySpan<char> date)
    {
        // 格式: YYYY-MM-DD
        int firstDash = date.IndexOf('-');
        int lastDash = date.LastIndexOf('-');

        int year = int.Parse(date.Slice(0, firstDash));
        int month = int.Parse(date.Slice(firstDash + 1, lastDash - firstDash - 1));
        int day = int.Parse(date.Slice(lastDash + 1));

        return (year, month, day);
    }

    static int[] ParseIpAddress(ReadOnlySpan<char> ip)
    {
        int[] parts = new int[4];
        int partIndex = 0;
        int start = 0;

        for (int i = 0; i <= ip.Length && partIndex < 4; i++)
        {
            if (i == ip.Length || ip[i] == '.')
            {
                parts[partIndex] = int.Parse(ip.Slice(start, i - start));
                start = i + 1;
                partIndex++;
            }
        }

        return parts;
    }
}
```

### 字符串搜索和查找

```csharp
using System;

class StringSearching
{
    static void Main()
    {
        string text = "Hello World, Hello Universe, Hello Galaxy";
        ReadOnlySpan<char> span = text.AsSpan();

        // 查找子字符串
        ReadOnlySpan<char> search = "Hello".AsSpan();

        Console.WriteLine("查找所有 'Hello' 的位置:");
        int index = 0;
        int occurrence = 1;

        while (index < span.Length)
        {
            int found = span.Slice(index).IndexOf(search);
            if (found == -1) break;

            int absoluteIndex = index + found;
            Console.WriteLine($"  第 {occurrence} 次出现在索引: {absoluteIndex}");

            index = absoluteIndex + search.Length;
            occurrence++;
        }

        // 使用 SequenceEqual 比较
        ReadOnlySpan<char> hello1 = text.AsSpan(0, 5);
        ReadOnlySpan<char> hello2 = text.AsSpan(13, 5);
        Console.WriteLine($"两个 Hello 相等: {hello1.SequenceEqual(hello2)}");

        // StartsWith 和 EndsWith
        Console.WriteLine($"以 Hello 开头: {span.StartsWith("Hello".AsSpan())}");
        Console.WriteLine($"以 Galaxy 结尾: {span.EndsWith("Galaxy".AsSpan())}");

        // Trim 操作
        string padded = "   Hello World   ";
        ReadOnlySpan<char> trimmed = padded.AsSpan().Trim();
        Console.WriteLine($"修剪后: '{trimmed.ToString()}'");
    }
}
```

### 高性能字符串构建

```csharp
using System;
using System.Buffers;
using System.Text;

class StringBuilding
{
    static void Main()
    {
        // 使用 Span 构建字符串
        string result = BuildGreeting("张三", 25);
        Console.WriteLine(result);

        // 格式化数字到 Span
        Span<char> buffer = stackalloc char[32];
        int number = 12345;

        if (number.TryFormat(buffer, out int charsWritten))
        {
            Console.WriteLine($"格式化结果: {buffer.Slice(0, charsWritten).ToString()}");
        }

        // 格式化日期
        DateTime now = DateTime.Now;
        if (now.TryFormat(buffer, out charsWritten, "yyyy-MM-dd HH:mm:ss"))
        {
            Console.WriteLine($"日期格式化: {buffer.Slice(0, charsWritten).ToString()}");
        }

        // 使用 string.Create
        string created = string.Create(20, ("Hello", 42), (span, state) =>
        {
            state.Item1.AsSpan().CopyTo(span);
            span[5] = ' ';
            state.Item2.TryFormat(span.Slice(6), out _);
        });
        Console.WriteLine($"string.Create 结果: {created}");
    }

    static string BuildGreeting(string name, int age)
    {
        // 计算所需长度
        int nameLength = name.Length;
        int ageDigits = age < 10 ? 1 : age < 100 ? 2 : 3;
        int totalLength = 6 + nameLength + 8 + ageDigits + 1; // "你好，" + name + "，你今年" + age + "岁"

        return string.Create(totalLength, (name, age), (span, state) =>
        {
            int pos = 0;

            "你好，".AsSpan().CopyTo(span.Slice(pos));
            pos += 3;

            state.name.AsSpan().CopyTo(span.Slice(pos));
            pos += state.name.Length;

            "，你今年".AsSpan().CopyTo(span.Slice(pos));
            pos += 4;

            state.age.TryFormat(span.Slice(pos), out int written);
            pos += written;

            span[pos] = '岁';
        });
    }
}
```

### 使用 Span 解析数字

```csharp
using System;
using System.Globalization;

class NumberParsing
{
    static void Main()
    {
        // 直接从 Span 解析数字
        ReadOnlySpan<char> intSpan = "12345".AsSpan();
        int intValue = int.Parse(intSpan);
        Console.WriteLine($"整数: {intValue}");

        // 解析浮点数
        ReadOnlySpan<char> doubleSpan = "3.14159".AsSpan();
        double doubleValue = double.Parse(doubleSpan, CultureInfo.InvariantCulture);
        Console.WriteLine($"浮点数: {doubleValue}");

        // 十六进制解析
        ReadOnlySpan<char> hexSpan = "FF".AsSpan();
        int hexValue = int.Parse(hexSpan, NumberStyles.HexNumber);
        Console.WriteLine($"十六进制 FF = {hexValue}");

        // 使用 TryParse 安全解析
        ReadOnlySpan<char> maybeNumber = "abc123".AsSpan();
        if (int.TryParse(maybeNumber, out int parsed))
        {
            Console.WriteLine($"解析成功: {parsed}");
        }
        else
        {
            Console.WriteLine("解析失败");
        }

        // 批量解析数字字符串
        string numbers = "10,20,30,40,50";
        int sum = SumNumbers(numbers.AsSpan());
        Console.WriteLine($"数字之和: {sum}");
    }

    static int SumNumbers(ReadOnlySpan<char> input)
    {
        int sum = 0;
        int start = 0;

        for (int i = 0; i <= input.Length; i++)
        {
            if (i == input.Length || input[i] == ',')
            {
                if (i > start)
                {
                    sum += int.Parse(input.Slice(start, i - start));
                }
                start = i + 1;
            }
        }

        return sum;
    }
}
```

## ArrayPool 对象池

### ArrayPool 基础

`ArrayPool<T>` 提供了可重用的数组缓冲区池，减少内存分配和垃圾回收压力。

```csharp
using System;
using System.Buffers;

class ArrayPoolBasics
{
    static void Main()
    {
        // 使用共享的 ArrayPool
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);

        try
        {
            // 注意：租用的数组大小可能大于请求的大小
            Console.WriteLine($"请求 1024，实际获得: {buffer.Length}");

            // 使用数组
            for (int i = 0; i < 1024; i++)
            {
                buffer[i] = (byte)(i % 256);
            }

            ProcessBuffer(buffer.AsSpan(0, 1024));
        }
        finally
        {
            // 归还数组到池中
            ArrayPool<byte>.Shared.Return(buffer);
        }

        // 归还时清空数组
        int[] intBuffer = ArrayPool<int>.Shared.Rent(100);
        try
        {
            for (int i = 0; i < 100; i++)
            {
                intBuffer[i] = i;
            }
        }
        finally
        {
            // clearArray: true 会在归还前清空数组，防止数据泄露
            ArrayPool<int>.Shared.Return(intBuffer, clearArray: true);
        }
    }

    static void ProcessBuffer(Span<byte> data)
    {
        Console.WriteLine($"处理 {data.Length} 字节数据");
    }
}
```

### 创建自定义 ArrayPool

```csharp
using System;
using System.Buffers;

class CustomArrayPool
{
    static void Main()
    {
        // 创建自定义配置的 ArrayPool
        ArrayPool<byte> customPool = ArrayPool<byte>.Create(
            maxArrayLength: 1024 * 1024,  // 最大数组长度：1MB
            maxArraysPerBucket: 50         // 每个桶的最大数组数
        );

        // 使用自定义池
        byte[] buffer1 = customPool.Rent(512);
        byte[] buffer2 = customPool.Rent(1024);

        try
        {
            Console.WriteLine($"缓冲区1大小: {buffer1.Length}");
            Console.WriteLine($"缓冲区2大小: {buffer2.Length}");

            // 使用缓冲区...
        }
        finally
        {
            customPool.Return(buffer1);
            customPool.Return(buffer2);
        }

        // 演示池的重用
        DemonstratePoolReuse();
    }

    static void DemonstratePoolReuse()
    {
        var pool = ArrayPool<int>.Shared;

        // 租用并归还多次
        for (int i = 0; i < 5; i++)
        {
            int[] arr = pool.Rent(100);
            Console.WriteLine($"第 {i + 1} 次租用，数组 HashCode: {arr.GetHashCode()}");
            pool.Return(arr);
        }

        // 你会发现多次租用可能返回同一个数组实例
    }
}
```

### ArrayPool 与 Span/Memory 结合使用

```csharp
using System;
using System.Buffers;
using System.Threading.Tasks;

class ArrayPoolWithSpanMemory
{
    static async Task Main()
    {
        // 同步场景：结合 stackalloc 和 ArrayPool
        ProcessDataEfficiently(100);   // 使用栈
        ProcessDataEfficiently(10000); // 使用池

        // 异步场景：使用 MemoryPool
        await ProcessDataAsyncEfficiently(1024);
    }

    const int StackAllocThreshold = 256;

    static void ProcessDataEfficiently(int size)
    {
        byte[]? rentedArray = null;

        try
        {
            Span<byte> buffer = size <= StackAllocThreshold
                ? stackalloc byte[size]
                : (rentedArray = ArrayPool<byte>.Shared.Rent(size)).AsSpan(0, size);

            // 初始化并处理数据
            for (int i = 0; i < buffer.Length; i++)
            {
                buffer[i] = (byte)(i % 256);
            }

            // 计算校验和
            int checksum = 0;
            foreach (byte b in buffer)
            {
                checksum += b;
            }

            Console.WriteLine($"大小 {size}: 校验和 = {checksum}");
        }
        finally
        {
            if (rentedArray != null)
            {
                ArrayPool<byte>.Shared.Return(rentedArray);
            }
        }
    }

    static async Task ProcessDataAsyncEfficiently(int size)
    {
        using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(size);
        Memory<byte> memory = owner.Memory.Slice(0, size);

        // 在异步操作之间保持 Memory
        await Task.Delay(10);

        // 当需要实际操作时获取 Span
        Span<byte> span = memory.Span;
        span.Fill(42);

        await Task.Delay(10);

        int sum = 0;
        foreach (byte b in memory.Span)
        {
            sum += b;
        }

        Console.WriteLine($"异步处理完成，总和: {sum}");
    }
}
```

### 实际应用：高效文件读取

```csharp
using System;
using System.Buffers;
using System.IO;
using System.Threading.Tasks;

class EfficientFileReading
{
    static async Task Main()
    {
        // 创建测试文件
        string testFile = "test_data.bin";
        await CreateTestFile(testFile, 1024 * 1024); // 1MB

        // 使用 ArrayPool 高效读取
        await ReadFileWithPoolAsync(testFile);

        // 清理
        File.Delete(testFile);
    }

    static async Task CreateTestFile(string path, int size)
    {
        byte[] data = new byte[size];
        new Random(42).NextBytes(data);
        await File.WriteAllBytesAsync(path, data);
        Console.WriteLine($"创建测试文件: {size} 字节");
    }

    static async Task ReadFileWithPoolAsync(string path)
    {
        const int bufferSize = 4096; // 4KB 缓冲区

        byte[] buffer = ArrayPool<byte>.Shared.Rent(bufferSize);

        try
        {
            using FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read);

            long totalBytes = 0;
            int checksum = 0;

            int bytesRead;
            while ((bytesRead = await fs.ReadAsync(buffer.AsMemory(0, bufferSize))) > 0)
            {
                // 使用 Span 处理读取的数据
                ReadOnlySpan<byte> data = buffer.AsSpan(0, bytesRead);

                foreach (byte b in data)
                {
                    checksum = (checksum + b) & 0xFFFF;
                }

                totalBytes += bytesRead;
            }

            Console.WriteLine($"读取完成: {totalBytes} 字节，校验和: {checksum}");
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }
}
```

## 性能优势与基准测试

### 内存分配对比

```csharp
using System;
using System.Buffers;
using System.Diagnostics;

class PerformanceComparison
{
    const int Iterations = 100000;
    const int DataSize = 1000;

    static void Main()
    {
        Console.WriteLine("性能对比测试");
        Console.WriteLine(new string('=', 50));

        // 预热
        WarmUp();

        // 测试 1: 数组分配 vs ArrayPool
        TestArrayAllocation();
        TestArrayPool();

        Console.WriteLine();

        // 测试 2: Substring vs Span 切片
        TestSubstring();
        TestSpanSlice();

        Console.WriteLine();

        // 测试 3: 数组复制 vs Span 视图
        TestArrayCopy();
        TestSpanView();
    }

    static void WarmUp()
    {
        for (int i = 0; i < 1000; i++)
        {
            var arr = new byte[DataSize];
            var pool = ArrayPool<byte>.Shared.Rent(DataSize);
            ArrayPool<byte>.Shared.Return(pool);
        }
    }

    static void TestArrayAllocation()
    {
        GC.Collect();
        long memBefore = GC.GetTotalMemory(true);
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            byte[] array = new byte[DataSize];
            array[0] = 42; // 防止优化
        }

        sw.Stop();
        GC.Collect();
        long memAfter = GC.GetTotalMemory(true);

        Console.WriteLine($"数组分配: {sw.ElapsedMilliseconds}ms");
    }

    static void TestArrayPool()
    {
        GC.Collect();
        long memBefore = GC.GetTotalMemory(true);
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            byte[] array = ArrayPool<byte>.Shared.Rent(DataSize);
            array[0] = 42;
            ArrayPool<byte>.Shared.Return(array);
        }

        sw.Stop();
        GC.Collect();
        long memAfter = GC.GetTotalMemory(true);

        Console.WriteLine($"ArrayPool: {sw.ElapsedMilliseconds}ms");
    }

    static void TestSubstring()
    {
        string source = new string('a', 10000);
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            string sub = source.Substring(1000, 100);
            _ = sub.Length;
        }

        sw.Stop();
        Console.WriteLine($"Substring: {sw.ElapsedMilliseconds}ms");
    }

    static void TestSpanSlice()
    {
        string source = new string('a', 10000);
        ReadOnlySpan<char> span = source.AsSpan();
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            ReadOnlySpan<char> slice = span.Slice(1000, 100);
            _ = slice.Length;
        }

        sw.Stop();
        Console.WriteLine($"Span 切片: {sw.ElapsedMilliseconds}ms");
    }

    static void TestArrayCopy()
    {
        int[] source = new int[DataSize];
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            int[] copy = new int[100];
            Array.Copy(source, 100, copy, 0, 100);
            _ = copy[0];
        }

        sw.Stop();
        Console.WriteLine($"数组复制: {sw.ElapsedMilliseconds}ms");
    }

    static void TestSpanView()
    {
        int[] source = new int[DataSize];
        Span<int> span = source.AsSpan();
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            Span<int> view = span.Slice(100, 100);
            _ = view[0];
        }

        sw.Stop();
        Console.WriteLine($"Span 视图: {sw.ElapsedMilliseconds}ms");
    }
}
```

### 使用 BenchmarkDotNet 进行精确测试

```csharp
using System;
using System.Buffers;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
[RankColumn]
public class SpanBenchmarks
{
    private readonly string _testString = new string('x', 10000);
    private readonly int[] _testArray = new int[1000];

    [Benchmark(Baseline = true)]
    public string Substring()
    {
        return _testString.Substring(100, 500);
    }

    [Benchmark]
    public ReadOnlySpan<char> SpanSlice()
    {
        return _testString.AsSpan().Slice(100, 500);
    }

    [Benchmark]
    public int[] ArrayCopy()
    {
        int[] result = new int[500];
        Array.Copy(_testArray, 100, result, 0, 500);
        return result;
    }

    [Benchmark]
    public Span<int> SpanSliceArray()
    {
        return _testArray.AsSpan().Slice(100, 500);
    }

    [Benchmark]
    public byte[] NewArray()
    {
        return new byte[1024];
    }

    [Benchmark]
    public byte[] RentFromPool()
    {
        byte[] arr = ArrayPool<byte>.Shared.Rent(1024);
        ArrayPool<byte>.Shared.Return(arr);
        return arr;
    }
}

// 运行基准测试
// class Program
// {
//     static void Main() => BenchmarkRunner.Run<SpanBenchmarks>();
// }
```

### 真实场景：JSON 解析优化

```csharp
using System;
using System.Text;
using System.Text.Json;

class JsonParsingOptimization
{
    static void Main()
    {
        // 模拟 JSON 数据
        string json = """
        {
            "name": "张三",
            "age": 30,
            "city": "北京",
            "scores": [95, 88, 92, 78, 85]
        }
        """;

        // 使用 Span 和 Utf8JsonReader 进行高效解析
        ParseJsonEfficiently(Encoding.UTF8.GetBytes(json));
    }

    static void ParseJsonEfficiently(ReadOnlySpan<byte> jsonData)
    {
        var reader = new Utf8JsonReader(jsonData);

        string? name = null;
        int age = 0;
        string? city = null;

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.PropertyName)
            {
                // 使用 ValueSpan 避免字符串分配
                ReadOnlySpan<byte> propertyName = reader.ValueSpan;

                reader.Read();

                if (propertyName.SequenceEqual("name"u8))
                {
                    name = reader.GetString();
                }
                else if (propertyName.SequenceEqual("age"u8))
                {
                    age = reader.GetInt32();
                }
                else if (propertyName.SequenceEqual("city"u8))
                {
                    city = reader.GetString();
                }
                else if (propertyName.SequenceEqual("scores"u8))
                {
                    // 读取数组
                    Console.Write("分数: ");
                    while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
                    {
                        if (reader.TokenType == JsonTokenType.Number)
                        {
                            Console.Write($"{reader.GetInt32()} ");
                        }
                    }
                    Console.WriteLine();
                }
            }
        }

        Console.WriteLine($"姓名: {name}");
        Console.WriteLine($"年龄: {age}");
        Console.WriteLine($"城市: {city}");
    }
}
```

## 最佳实践

### 选择正确的类型

```csharp
using System;
using System.Buffers;
using System.Threading.Tasks;

class TypeSelection
{
    // ✅ 同步方法中使用 Span
    public void SyncMethod(Span<int> data)
    {
        foreach (ref int item in data)
        {
            item *= 2;
        }
    }

    // ✅ 异步方法中使用 Memory
    public async Task AsyncMethod(Memory<int> data)
    {
        await Task.Delay(10);

        // 需要操作时获取 Span
        Span<int> span = data.Span;
        foreach (ref int item in span)
        {
            item *= 2;
        }
    }

    // ✅ 只读数据使用 ReadOnlySpan/ReadOnlyMemory
    public int SumValues(ReadOnlySpan<int> values)
    {
        int sum = 0;
        foreach (int value in values)
        {
            sum += value;
        }
        return sum;
    }

    // ❌ 避免：在类中存储 Span
    // private Span<int> _data; // 编译错误

    // ✅ 正确：在类中存储 Memory 或数组
    private Memory<int> _memoryData;
    private int[]? _arrayData;
}
```

### 安全的栈分配模式

```csharp
using System;
using System.Buffers;

class SafeStackAllocation
{
    // 定义阈值常量
    private const int MaxStackAllocSize = 256;

    // 推荐模式：结合 stackalloc 和 ArrayPool
    public void ProcessData(int size)
    {
        byte[]? rentedArray = null;

        try
        {
            Span<byte> buffer = size <= MaxStackAllocSize
                ? stackalloc byte[size]
                : (rentedArray = ArrayPool<byte>.Shared.Rent(size)).AsSpan(0, size);

            // 使用 buffer...
            buffer.Fill(0);
            DoWork(buffer);
        }
        finally
        {
            // 确保归还租用的数组
            if (rentedArray is not null)
            {
                ArrayPool<byte>.Shared.Return(rentedArray);
            }
        }
    }

    private void DoWork(Span<byte> data)
    {
        // 处理数据
    }

    // ❌ 避免：动态大小的栈分配可能导致栈溢出
    public void UnsafeMethod(int userProvidedSize)
    {
        // 危险：用户可能传入很大的值
        // Span<byte> buffer = stackalloc byte[userProvidedSize];
    }
}
```

### 正确使用 ArrayPool

```csharp
using System;
using System.Buffers;

class ArrayPoolBestPractices
{
    // ✅ 正确：使用 try-finally 确保归还
    public void GoodPattern()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
        try
        {
            // 使用 buffer
            ProcessBuffer(buffer.AsSpan(0, 1024));
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }

    // ✅ 更好：使用辅助方法简化代码
    public void BetterPattern()
    {
        using var lease = new ArrayLease<byte>(1024);
        ProcessBuffer(lease.Span);
    }

    // ❌ 避免：忘记归还数组
    public void BadPattern()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
        ProcessBuffer(buffer.AsSpan(0, 1024));
        // 忘记归还！内存泄漏
    }

    // ❌ 避免：多次归还同一个数组
    public void DoubleFree()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
        ArrayPool<byte>.Shared.Return(buffer);
        // ArrayPool<byte>.Shared.Return(buffer); // 危险！
    }

    private void ProcessBuffer(Span<byte> data) { }
}

// 辅助类：自动管理 ArrayPool 租用
ref struct ArrayLease<T>
{
    private T[]? _array;
    private readonly int _requestedSize;

    public ArrayLease(int size)
    {
        _array = ArrayPool<T>.Shared.Rent(size);
        _requestedSize = size;
    }

    public Span<T> Span => _array.AsSpan(0, _requestedSize);

    public void Dispose()
    {
        if (_array is not null)
        {
            ArrayPool<T>.Shared.Return(_array);
            _array = null;
        }
    }
}
```

### 避免常见陷阱

```csharp
using System;
using System.Threading.Tasks;

class CommonPitfalls
{
    // ❌ 陷阱 1: 返回指向栈内存的 Span
    // public Span<int> DangerousReturn()
    // {
    //     Span<int> local = stackalloc int[5];
    //     return local; // 编译错误，幸好编译器会阻止
    // }

    // ❌ 陷阱 2: 在异步方法中使用 Span
    // public async Task DangerousAsync()
    // {
    //     Span<int> span = stackalloc int[5];
    //     await Task.Delay(100); // 编译错误
    // }

    // ✅ 正确做法
    public async Task SafeAsync()
    {
        // 在 await 之前使用 Span
        Span<int> span = stackalloc int[5];
        ProcessSync(span);

        await Task.Delay(100);

        // 或者使用 Memory
        int[] array = new int[5];
        Memory<int> memory = array.AsMemory();
        await ProcessAsync(memory);
    }

    private void ProcessSync(Span<int> data) { }
    private async Task ProcessAsync(Memory<int> data)
    {
        await Task.Delay(10);
    }

    // ❌ 陷阱 3: 切片后继续使用原始数组引用时的误解
    public void SliceMisunderstanding()
    {
        int[] array = { 1, 2, 3, 4, 5 };
        Span<int> slice = array.AsSpan(1, 3);

        // 修改切片会影响原始数组！
        slice[0] = 100;
        Console.WriteLine(array[1]); // 输出: 100，不是 2
    }

    // ❌ 陷阱 4: 忘记 Rent 返回的数组可能比请求的大
    public void ArrayPoolSize()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(100);
        Console.WriteLine($"请求 100，实际: {buffer.Length}"); // 可能是 128 或更大

        // ✅ 始终跟踪实际需要的大小
        int requestedSize = 100;
        Span<byte> actualData = buffer.AsSpan(0, requestedSize);

        ArrayPool<byte>.Shared.Return(buffer);
    }
}
```

### 性能优化技巧

```csharp
using System;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

class PerformanceTips
{
    // 技巧 1: 使用 ref 返回避免复制
    public ref int GetElementRef(Span<int> span, int index)
    {
        return ref span[index];
    }

    // 技巧 2: 使用 MemoryMarshal 进行类型转换
    public void ReinterpretCast()
    {
        byte[] bytes = { 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00 };
        Span<int> ints = MemoryMarshal.Cast<byte, int>(bytes);

        Console.WriteLine($"重新解释为 int: {ints[0]}, {ints[1]}"); // 1, 2
    }

    // 技巧 3: 使用 Unsafe 类进行高性能操作
    public void UnsafeOperations()
    {
        int[] array = { 1, 2, 3, 4, 5 };

        // 获取数组数据的引用，跳过边界检查
        ref int first = ref MemoryMarshal.GetArrayDataReference(array);

        // 使用 Unsafe.Add 进行指针运算
        ref int third = ref Unsafe.Add(ref first, 2);
        Console.WriteLine($"第三个元素: {third}"); // 3
    }

    // 技巧 4: 向量化操作
    public int SumVectorized(ReadOnlySpan<int> values)
    {
        int sum = 0;

        // 对于大数组，考虑使用 SIMD
        // 这里简化展示，实际应使用 System.Numerics.Vector<T>
        foreach (int value in values)
        {
            sum += value;
        }

        return sum;
    }

    // 技巧 5: 避免在循环中创建委托
    public void ProcessWithoutAllocations(Span<int> data)
    {
        // ❌ 每次迭代都创建委托
        // foreach (var item in data.ToArray().Select(x => x * 2)) { }

        // ✅ 直接操作
        foreach (ref int item in data)
        {
            item *= 2;
        }
    }
}
```

## 总结

`Span<T>` 和 `Memory<T>` 是 .NET 高性能编程的核心工具。它们的主要优势包括：

1. **零分配操作**：切片、视图创建等操作不会分配新内存
2. **类型安全**：编译时检查，避免缓冲区溢出等问题
3. **统一抽象**：可以统一处理数组、栈内存和非托管内存
4. **性能提升**：减少 GC 压力，提高应用程序性能

### 使用建议

| 场景 | 推荐类型 |
|------|----------|
| 同步方法中的临时数据 | `Span<T>` / `ReadOnlySpan<T>` |
| 异步方法 | `Memory<T>` / `ReadOnlyMemory<T>` |
| 类字段 | `Memory<T>` 或数组 |
| 小型临时缓冲区 | `stackalloc` + `Span<T>` |
| 频繁分配的大型缓冲区 | `ArrayPool<T>` |
| 只读数据 | `ReadOnlySpan<T>` / `ReadOnlyMemory<T>` |

### 关键要点

- **Span 是 ref struct**：不能装箱、不能在异步方法中跨 await 使用、不能作为类字段
- **Memory 是堆友好的**：可以存储在类中、在异步方法中使用
- **ArrayPool 减少分配**：重用数组，减少 GC 压力
- **stackalloc 适合小缓冲区**：快速、零 GC，但要控制大小
- **切片是零成本的**：创建视图不复制数据

掌握这些类型将帮助你编写出更高效、更安全的 C# 代码。

## 参考资源

- [Microsoft Learn: Memory and Span usage guidelines](https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/memory-t-usage-guidelines)
- [Adam Sitnik: Span](https://adamsitnik.com/Span/)
- [NDepend Blog: Improve C# code performance with Span](https://blog.ndepend.com/improve-c-code-performance-with-spant/)
- [CODE Magazine: Writing High-Performance Code Using Span and Memory in C#](https://www.codemag.com/Article/2207031/Writing-High-Performance-Code-Using-SpanT-and-MemoryT-in-C)
