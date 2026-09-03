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
origin: old/src/content/docs/csharp/span-memory.en.md
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

In modern high-performance C# application development, memory management and performance optimization are crucial. `Span<T>` and `Memory<T>` are core types in .NET for efficient memory operations, allowing developers to work with contiguous memory regions without heap allocation, thus enabling zero-allocation programming.

## Span Basics

### What is Span<T>

`Span<T>` is a lightweight value type (`ref struct`) that represents a type-safe view over any contiguous memory region. It can point to managed heap, stack, or unmanaged memory without requiring any memory allocation.

```csharp
using System;

class SpanBasics
{
    static void Main()
    {
        // Create Span from array
        int[] numbers = { 1, 2, 3, 4, 5 };
        Span<int> span = numbers.AsSpan();

        // Modifying Span affects the original array
        span[0] = 100;
        Console.WriteLine($"First element of array: {numbers[0]}"); // Output: 100

        // Iterate using Span
        foreach (ref int num in span)
        {
            num *= 2;
        }

        Console.WriteLine("Modified array:");
        foreach (var num in numbers)
        {
            Console.WriteLine(num); // 200, 4, 6, 8, 10
        }
    }
}
```

### Ways to Create Span

```csharp
using System;
using System.Runtime.InteropServices;

class SpanCreation
{
    static void Main()
    {
        // 1. Create from array
        int[] array = { 1, 2, 3, 4, 5 };
        Span<int> fromArray = array.AsSpan();
        Span<int> fromArraySlice = array.AsSpan(1, 3); // Start at index 1, take 3 elements

        // 2. Using constructor
        Span<int> fromCtor = new Span<int>(array);
        Span<int> fromCtorSlice = new Span<int>(array, 2, 2);

        // 3. Using stackalloc (allocates only on stack)
        Span<int> stackSpan = stackalloc int[5] { 10, 20, 30, 40, 50 };

        // 4. Create from pointer (unsafe code)
        unsafe
        {
            int* ptr = stackalloc int[3] { 100, 200, 300 };
            Span<int> fromPointer = new Span<int>(ptr, 3);
            Console.WriteLine($"Created from pointer: {fromPointer[0]}, {fromPointer[1]}, {fromPointer[2]}");
        }

        // 5. Empty Span
        Span<int> emptySpan = Span<int>.Empty;
        Console.WriteLine($"Empty Span length: {emptySpan.Length}"); // 0
    }
}
```

### ReadOnlySpan<T>

`ReadOnlySpan<T>` is the read-only version of `Span<T>`, particularly suitable for working with immutable data like strings.

```csharp
using System;

class ReadOnlySpanExample
{
    static void Main()
    {
        // String can be directly converted to ReadOnlySpan<char>
        string text = "Hello, World!";
        ReadOnlySpan<char> charSpan = text.AsSpan();

        // Get substring (no memory allocation)
        ReadOnlySpan<char> hello = charSpan.Slice(0, 5);
        ReadOnlySpan<char> world = charSpan.Slice(7, 5);

        Console.WriteLine($"Hello: {hello.ToString()}");
        Console.WriteLine($"World: {world.ToString()}");

        // Create from read-only array
        ReadOnlySpan<int> readOnlyNumbers = new int[] { 1, 2, 3, 4, 5 };

        // Span can be implicitly converted to ReadOnlySpan
        int[] numbers = { 10, 20, 30 };
        Span<int> span = numbers.AsSpan();
        ReadOnlySpan<int> readOnly = span; // Implicit conversion

        ProcessReadOnly(span); // Span can be passed to methods accepting ReadOnlySpan
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

### Span's ref struct Restrictions

Because `Span<T>` is a `ref struct` type, it has the following restrictions:

```csharp
using System;
using System.Threading.Tasks;

class SpanRestrictions
{
    // Cannot be a class field
    // private Span<int> _span; // Compilation error

    // Cannot be boxed
    static void CannotBox()
    {
        Span<int> span = stackalloc int[5];
        // object obj = span; // Compilation error
    }

    // Cannot be used in async methods
    // static async Task CannotUseInAsync()
    // {
    //     Span<int> span = stackalloc int[5];
    //     await Task.Delay(100); // Compilation error: Cannot use Span in async method
    // }

    // Cannot be captured by lambda expressions
    static void CannotCapture()
    {
        Span<int> span = stackalloc int[5];
        // Action action = () => Console.WriteLine(span.Length); // Compilation error
    }

    // Cannot be used as generic type argument
    static void CannotBeGenericArg()
    {
        // List<Span<int>> list = new List<Span<int>>(); // Compilation error
    }

    // Can be used in synchronous methods
    static void CanUseInSync()
    {
        Span<int> span = stackalloc int[5];
        for (int i = 0; i < span.Length; i++)
        {
            span[i] = i * 10;
        }
    }

    // Can be used as method parameters and return values (with conditions)
    static Span<int> GetSpan(int[] array)
    {
        return array.AsSpan();
    }
}
```

### Common Span Methods

```csharp
using System;

class SpanMethods
{
    static void Main()
    {
        Span<int> span = stackalloc int[] { 5, 3, 8, 1, 9, 2, 7, 4, 6 };

        // Fill
        Span<int> toFill = stackalloc int[5];
        toFill.Fill(42);
        Console.WriteLine($"After fill: {string.Join(", ", toFill.ToArray())}"); // 42, 42, 42, 42, 42

        // Clear
        Span<int> toClear = stackalloc int[] { 1, 2, 3, 4, 5 };
        toClear.Clear();
        Console.WriteLine($"After clear: {string.Join(", ", toClear.ToArray())}"); // 0, 0, 0, 0, 0

        // Copy
        Span<int> source = stackalloc int[] { 10, 20, 30 };
        Span<int> destination = stackalloc int[5];
        source.CopyTo(destination);
        Console.WriteLine($"After copy: {string.Join(", ", destination.ToArray())}"); // 10, 20, 30, 0, 0

        // TryCopyTo (returns false if destination is too small)
        Span<int> smallDest = stackalloc int[2];
        bool success = source.TryCopyTo(smallDest);
        Console.WriteLine($"TryCopyTo result: {success}"); // false

        // Reverse
        Span<int> toReverse = stackalloc int[] { 1, 2, 3, 4, 5 };
        toReverse.Reverse();
        Console.WriteLine($"After reverse: {string.Join(", ", toReverse.ToArray())}"); // 5, 4, 3, 2, 1

        // Sort (.NET 5+)
        span.Sort();
        Console.WriteLine($"After sort: {string.Join(", ", span.ToArray())}"); // 1, 2, 3, 4, 5, 6, 7, 8, 9

        // Binary search (requires sorted data)
        int index = span.BinarySearch(5);
        Console.WriteLine($"Index of element 5: {index}"); // 4

        // Convert to array
        int[] array = span.ToArray();

        // Check if empty
        Span<int> empty = Span<int>.Empty;
        Console.WriteLine($"Is empty: {empty.IsEmpty}"); // true
    }
}
```

## Memory Type

### What is Memory<T>

`Memory<T>` is the "heap-friendly" version of `Span<T>`. It can be stored on the heap, so it can be used as a class field, in async methods, and can be captured by lambda expressions.

```csharp
using System;
using System.Threading.Tasks;

class MemoryBasics
{
    // Memory can be used as a class field
    private Memory<int> _data;

    public MemoryBasics(int[] data)
    {
        _data = data.AsMemory();
    }

    // Memory can be used in async methods
    public async Task ProcessDataAsync()
    {
        Console.WriteLine($"Starting processing, data length: {_data.Length}");

        await Task.Delay(100);

        // Get Span when you need to actually manipulate the data
        Span<int> span = _data.Span;
        for (int i = 0; i < span.Length; i++)
        {
            span[i] *= 2;
        }

        await Task.Delay(100);

        Console.WriteLine("Processing complete");
    }

    static async Task Main()
    {
        int[] numbers = { 1, 2, 3, 4, 5 };
        var processor = new MemoryBasics(numbers);

        await processor.ProcessDataAsync();

        Console.WriteLine($"After processing: {string.Join(", ", numbers)}"); // 2, 4, 6, 8, 10
    }
}
```

### Relationship Between Memory and Span

```csharp
using System;
using System.Threading.Tasks;

class MemoryAndSpan
{
    static async Task Main()
    {
        int[] array = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        Memory<int> memory = array.AsMemory();

        // Memory can be sliced
        Memory<int> slice = memory.Slice(2, 5);
        Console.WriteLine($"Slice length: {slice.Length}"); // 5

        // Get Span when needed
        Span<int> span = memory.Span;
        span[0] = 100;

        // Use Memory in async methods
        await ProcessMemoryAsync(memory);

        // Convert to Span when passing to synchronous methods
        ProcessSpan(memory.Span);
    }

    static async Task ProcessMemoryAsync(Memory<int> memory)
    {
        await Task.Delay(50);

        // Get Span after await
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

        // Process string segments asynchronously
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
        Console.WriteLine($"Processing word: {word.Span.ToString()}");
    }
}
```

### IMemoryOwner<T> and MemoryPool<T>

For scenarios requiring frequent memory allocation and deallocation, you can use `MemoryPool<T>` to rent memory.

```csharp
using System;
using System.Buffers;

class MemoryPoolExample
{
    static void Main()
    {
        // Use shared MemoryPool
        using (IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024))
        {
            Memory<byte> memory = owner.Memory;

            // Note: The actual allocated size may be larger than requested
            Console.WriteLine($"Requested 1024 bytes, got: {memory.Length} bytes");

            // Use the memory
            Span<byte> span = memory.Span;
            for (int i = 0; i < 100; i++)
            {
                span[i] = (byte)(i % 256);
            }

            ProcessData(memory.Slice(0, 100));
        } // Memory is automatically returned at the end of using block

        // Multiple rent demonstration
        ProcessMultipleTimes();
    }

    static void ProcessData(Memory<byte> data)
    {
        Console.WriteLine($"Processing {data.Length} bytes of data");
    }

    static void ProcessMultipleTimes()
    {
        for (int i = 0; i < 5; i++)
        {
            using (IMemoryOwner<int> owner = MemoryPool<int>.Shared.Rent(256))
            {
                Memory<int> memory = owner.Memory.Slice(0, 256);
                memory.Span.Fill(i);
                Console.WriteLine($"Rent #{i + 1}, first element: {memory.Span[0]}");
            }
        }
    }
}
```

## stackalloc and Stack Allocation

### stackalloc Basics

The `stackalloc` keyword allocates memory on the stack, avoiding heap allocation and garbage collection overhead.

```csharp
using System;

class StackAllocBasics
{
    static void Main()
    {
        // Basic stackalloc usage
        Span<int> numbers = stackalloc int[5];
        for (int i = 0; i < numbers.Length; i++)
        {
            numbers[i] = (i + 1) * 10;
        }
        Console.WriteLine($"Stack allocated array: {string.Join(", ", numbers.ToArray())}");

        // stackalloc with initializer
        Span<int> initialized = stackalloc int[] { 1, 2, 3, 4, 5 };
        Console.WriteLine($"Initialized array: {string.Join(", ", initialized.ToArray())}");

        // stackalloc byte buffer
        Span<byte> buffer = stackalloc byte[256];
        buffer.Fill(0xFF);
        Console.WriteLine($"First byte of buffer: 0x{buffer[0]:X2}");

        // stackalloc for character processing
        Span<char> chars = stackalloc char[10];
        "Hello".AsSpan().CopyTo(chars);
        Console.WriteLine($"Character array: {new string(chars.Slice(0, 5))}");
    }
}
```

### Safe stackalloc Patterns

```csharp
using System;
using System.Buffers;

class SafeStackAlloc
{
    // Define safe threshold for stack allocation
    private const int StackAllocThreshold = 256;

    static void Main()
    {
        // Use stack allocation for small data
        ProcessData(100);

        // Use heap allocation for large data
        ProcessData(1000);
    }

    static void ProcessData(int size)
    {
        // Conditional stack allocation pattern
        Span<byte> buffer = size <= StackAllocThreshold
            ? stackalloc byte[size]
            : new byte[size];

        // Use the buffer
        buffer.Fill(42);
        Console.WriteLine($"Processing {size} bytes, first value: {buffer[0]}");
    }

    // Better pattern using ArrayPool
    static void ProcessDataWithPool(int size)
    {
        byte[]? rentedArray = null;

        try
        {
            Span<byte> buffer = size <= StackAllocThreshold
                ? stackalloc byte[size]
                : (rentedArray = ArrayPool<byte>.Shared.Rent(size)).AsSpan(0, size);

            // Use the buffer
            buffer.Fill(42);
            Console.WriteLine($"Processing {size} bytes");
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

### stackalloc and Unsafe Code

```csharp
using System;

class StackAllocUnsafe
{
    static unsafe void Main()
    {
        // Traditional unsafe stackalloc
        int* ptr = stackalloc int[5];
        for (int i = 0; i < 5; i++)
        {
            ptr[i] = (i + 1) * 100;
        }

        Console.WriteLine("Accessing via pointer:");
        for (int i = 0; i < 5; i++)
        {
            Console.WriteLine($"ptr[{i}] = {ptr[i]}");
        }

        // Convert pointer to Span
        Span<int> span = new Span<int>(ptr, 5);
        Console.WriteLine($"First element via Span: {span[0]}");

        // Struct array
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

## Slicing Operations

Slicing is one of the core features of `Span<T>` and `Memory<T>`, allowing you to create views over original data without any memory copying.

### Basic Slicing Operations

```csharp
using System;

class SlicingBasics
{
    static void Main()
    {
        int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
        Span<int> span = array.AsSpan();

        // Slice from specified index
        Span<int> fromIndex = span.Slice(3);
        Console.WriteLine($"From index 3: {string.Join(", ", fromIndex.ToArray())}");
        // Output: 3, 4, 5, 6, 7, 8, 9

        // Specify start index and length
        Span<int> subRange = span.Slice(2, 4);
        Console.WriteLine($"Index 2, length 4: {string.Join(", ", subRange.ToArray())}");
        // Output: 2, 3, 4, 5

        // Using range syntax (C# 8.0+)
        Span<int> rangeSlice = span[2..6];
        Console.WriteLine($"Range [2..6]: {string.Join(", ", rangeSlice.ToArray())}");
        // Output: 2, 3, 4, 5

        // Slice from end
        Span<int> lastThree = span[^3..];
        Console.WriteLine($"Last 3: {string.Join(", ", lastThree.ToArray())}");
        // Output: 7, 8, 9

        // Exclude last 2
        Span<int> exceptLastTwo = span[..^2];
        Console.WriteLine($"Excluding last 2: {string.Join(", ", exceptLastTwo.ToArray())}");
        // Output: 0, 1, 2, 3, 4, 5, 6, 7
    }
}
```

### Slice vs Substring Performance Comparison

```csharp
using System;
using System.Diagnostics;

class SliceVsSubstring
{
    static void Main()
    {
        string longString = new string('a', 10000) + "TARGET" + new string('b', 10000);

        const int iterations = 100000;

        // Test Substring (allocates memory)
        var sw1 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            string sub = longString.Substring(10000, 6);
            _ = sub.Length; // Prevent optimization
        }
        sw1.Stop();
        Console.WriteLine($"Substring time: {sw1.ElapsedMilliseconds}ms");

        // Test Span slicing (zero allocation)
        var sw2 = Stopwatch.StartNew();
        ReadOnlySpan<char> spanStr = longString.AsSpan();
        for (int i = 0; i < iterations; i++)
        {
            ReadOnlySpan<char> slice = spanStr.Slice(10000, 6);
            _ = slice.Length; // Prevent optimization
        }
        sw2.Stop();
        Console.WriteLine($"Span slice time: {sw2.ElapsedMilliseconds}ms");

        // Verify results are identical
        string substring = longString.Substring(10000, 6);
        ReadOnlySpan<char> sliced = longString.AsSpan().Slice(10000, 6);
        Console.WriteLine($"Results are equal: {substring == sliced.ToString()}");
    }
}
```

### Chained Slicing Operations

```csharp
using System;

class ChainedSlicing
{
    static void Main()
    {
        int[] data = Enumerable.Range(0, 100).ToArray();
        Span<int> span = data.AsSpan();

        // Chained slicing
        Span<int> result = span
            .Slice(10)      // Skip first 10
            .Slice(0, 50)   // Take 50
            .Slice(5, 20);  // Take middle 20

        Console.WriteLine($"Chained slice result: {string.Join(", ", result.ToArray())}");
        // Output: 15, 16, 17, ... 34

        // Process large data in chunks
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

            Console.WriteLine($"Chunk {chunkIndex}: starting at {processed}, {currentChunkSize} elements");
            Console.WriteLine($"  First element: {chunk[0]}, last element: {chunk[^1]}");

            processed += currentChunkSize;
            chunkIndex++;
        }
    }
}
```

## String Operation Optimization

### Efficient String Parsing

```csharp
using System;

class StringParsing
{
    static void Main()
    {
        // CSV line parsing example
        string csvLine = "John,25,Beijing,Engineer,50000";
        ParseCsvLine(csvLine.AsSpan());

        // Date parsing
        string dateStr = "2024-12-25";
        var (year, month, day) = ParseDate(dateStr.AsSpan());
        Console.WriteLine($"Parsed date: {year}-{month}-{day}");

        // IP address parsing
        string ip = "192.168.1.100";
        var parts = ParseIpAddress(ip.AsSpan());
        Console.WriteLine($"IP address: {parts[0]}.{parts[1]}.{parts[2]}.{parts[3]}");
    }

    static void ParseCsvLine(ReadOnlySpan<char> line)
    {
        Console.WriteLine("CSV parsing result:");
        int fieldIndex = 0;
        int start = 0;

        for (int i = 0; i <= line.Length; i++)
        {
            if (i == line.Length || line[i] == ',')
            {
                ReadOnlySpan<char> field = line.Slice(start, i - start);
                Console.WriteLine($"  Field {fieldIndex}: {field.ToString()}");
                start = i + 1;
                fieldIndex++;
            }
        }
    }

    static (int year, int month, int day) ParseDate(ReadOnlySpan<char> date)
    {
        // Format: YYYY-MM-DD
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

### String Searching and Finding

```csharp
using System;

class StringSearching
{
    static void Main()
    {
        string text = "Hello World, Hello Universe, Hello Galaxy";
        ReadOnlySpan<char> span = text.AsSpan();

        // Find substring
        ReadOnlySpan<char> search = "Hello".AsSpan();

        Console.WriteLine("Finding all positions of 'Hello':");
        int index = 0;
        int occurrence = 1;

        while (index < span.Length)
        {
            int found = span.Slice(index).IndexOf(search);
            if (found == -1) break;

            int absoluteIndex = index + found;
            Console.WriteLine($"  Occurrence {occurrence} at index: {absoluteIndex}");

            index = absoluteIndex + search.Length;
            occurrence++;
        }

        // Compare using SequenceEqual
        ReadOnlySpan<char> hello1 = text.AsSpan(0, 5);
        ReadOnlySpan<char> hello2 = text.AsSpan(13, 5);
        Console.WriteLine($"Two Hellos are equal: {hello1.SequenceEqual(hello2)}");

        // StartsWith and EndsWith
        Console.WriteLine($"Starts with Hello: {span.StartsWith("Hello".AsSpan())}");
        Console.WriteLine($"Ends with Galaxy: {span.EndsWith("Galaxy".AsSpan())}");

        // Trim operation
        string padded = "   Hello World   ";
        ReadOnlySpan<char> trimmed = padded.AsSpan().Trim();
        Console.WriteLine($"After trim: '{trimmed.ToString()}'");
    }
}
```

### High-Performance String Building

```csharp
using System;
using System.Buffers;
using System.Text;

class StringBuilding
{
    static void Main()
    {
        // Build string using Span
        string result = BuildGreeting("John", 25);
        Console.WriteLine(result);

        // Format number to Span
        Span<char> buffer = stackalloc char[32];
        int number = 12345;

        if (number.TryFormat(buffer, out int charsWritten))
        {
            Console.WriteLine($"Formatted result: {buffer.Slice(0, charsWritten).ToString()}");
        }

        // Format date
        DateTime now = DateTime.Now;
        if (now.TryFormat(buffer, out charsWritten, "yyyy-MM-dd HH:mm:ss"))
        {
            Console.WriteLine($"Date formatted: {buffer.Slice(0, charsWritten).ToString()}");
        }

        // Using string.Create
        string created = string.Create(20, ("Hello", 42), (span, state) =>
        {
            state.Item1.AsSpan().CopyTo(span);
            span[5] = ' ';
            state.Item2.TryFormat(span.Slice(6), out _);
        });
        Console.WriteLine($"string.Create result: {created}");
    }

    static string BuildGreeting(string name, int age)
    {
        // Calculate required length
        int nameLength = name.Length;
        int ageDigits = age < 10 ? 1 : age < 100 ? 2 : 3;
        int totalLength = 7 + nameLength + 16 + ageDigits + 11; // "Hello, " + name + ", you are " + age + " years old"

        return string.Create(totalLength, (name, age), (span, state) =>
        {
            int pos = 0;

            "Hello, ".AsSpan().CopyTo(span.Slice(pos));
            pos += 7;

            state.name.AsSpan().CopyTo(span.Slice(pos));
            pos += state.name.Length;

            ", you are ".AsSpan().CopyTo(span.Slice(pos));
            pos += 10;

            state.age.TryFormat(span.Slice(pos), out int written);
            pos += written;

            " years old".AsSpan().CopyTo(span.Slice(pos));
        });
    }
}
```

### Parsing Numbers with Span

```csharp
using System;
using System.Globalization;

class NumberParsing
{
    static void Main()
    {
        // Parse number directly from Span
        ReadOnlySpan<char> intSpan = "12345".AsSpan();
        int intValue = int.Parse(intSpan);
        Console.WriteLine($"Integer: {intValue}");

        // Parse floating-point number
        ReadOnlySpan<char> doubleSpan = "3.14159".AsSpan();
        double doubleValue = double.Parse(doubleSpan, CultureInfo.InvariantCulture);
        Console.WriteLine($"Floating-point: {doubleValue}");

        // Hexadecimal parsing
        ReadOnlySpan<char> hexSpan = "FF".AsSpan();
        int hexValue = int.Parse(hexSpan, NumberStyles.HexNumber);
        Console.WriteLine($"Hexadecimal FF = {hexValue}");

        // Safe parsing with TryParse
        ReadOnlySpan<char> maybeNumber = "abc123".AsSpan();
        if (int.TryParse(maybeNumber, out int parsed))
        {
            Console.WriteLine($"Parse succeeded: {parsed}");
        }
        else
        {
            Console.WriteLine("Parse failed");
        }

        // Batch parse number string
        string numbers = "10,20,30,40,50";
        int sum = SumNumbers(numbers.AsSpan());
        Console.WriteLine($"Sum of numbers: {sum}");
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

## ArrayPool Object Pool

### ArrayPool Basics

`ArrayPool<T>` provides a reusable buffer pool of arrays, reducing memory allocation and garbage collection pressure.

```csharp
using System;
using System.Buffers;

class ArrayPoolBasics
{
    static void Main()
    {
        // Use shared ArrayPool
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);

        try
        {
            // Note: The rented array size may be larger than requested
            Console.WriteLine($"Requested 1024, got: {buffer.Length}");

            // Use the array
            for (int i = 0; i < 1024; i++)
            {
                buffer[i] = (byte)(i % 256);
            }

            ProcessBuffer(buffer.AsSpan(0, 1024));
        }
        finally
        {
            // Return array to the pool
            ArrayPool<byte>.Shared.Return(buffer);
        }

        // Return and clear array
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
            // clearArray: true clears the array before returning, preventing data leakage
            ArrayPool<int>.Shared.Return(intBuffer, clearArray: true);
        }
    }

    static void ProcessBuffer(Span<byte> data)
    {
        Console.WriteLine($"Processing {data.Length} bytes of data");
    }
}
```

### Creating Custom ArrayPool

```csharp
using System;
using System.Buffers;

class CustomArrayPool
{
    static void Main()
    {
        // Create custom configured ArrayPool
        ArrayPool<byte> customPool = ArrayPool<byte>.Create(
            maxArrayLength: 1024 * 1024,  // Maximum array length: 1MB
            maxArraysPerBucket: 50         // Maximum arrays per bucket
        );

        // Use custom pool
        byte[] buffer1 = customPool.Rent(512);
        byte[] buffer2 = customPool.Rent(1024);

        try
        {
            Console.WriteLine($"Buffer1 size: {buffer1.Length}");
            Console.WriteLine($"Buffer2 size: {buffer2.Length}");

            // Use buffers...
        }
        finally
        {
            customPool.Return(buffer1);
            customPool.Return(buffer2);
        }

        // Demonstrate pool reuse
        DemonstratePoolReuse();
    }

    static void DemonstratePoolReuse()
    {
        var pool = ArrayPool<int>.Shared;

        // Rent and return multiple times
        for (int i = 0; i < 5; i++)
        {
            int[] arr = pool.Rent(100);
            Console.WriteLine($"Rent #{i + 1}, array HashCode: {arr.GetHashCode()}");
            pool.Return(arr);
        }

        // You'll notice multiple rents may return the same array instance
    }
}
```

### ArrayPool Combined with Span/Memory

```csharp
using System;
using System.Buffers;
using System.Threading.Tasks;

class ArrayPoolWithSpanMemory
{
    static async Task Main()
    {
        // Synchronous scenario: combine stackalloc and ArrayPool
        ProcessDataEfficiently(100);   // Uses stack
        ProcessDataEfficiently(10000); // Uses pool

        // Asynchronous scenario: use MemoryPool
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

            // Initialize and process data
            for (int i = 0; i < buffer.Length; i++)
            {
                buffer[i] = (byte)(i % 256);
            }

            // Calculate checksum
            int checksum = 0;
            foreach (byte b in buffer)
            {
                checksum += b;
            }

            Console.WriteLine($"Size {size}: checksum = {checksum}");
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

        // Keep Memory between async operations
        await Task.Delay(10);

        // Get Span when actual operation is needed
        Span<byte> span = memory.Span;
        span.Fill(42);

        await Task.Delay(10);

        int sum = 0;
        foreach (byte b in memory.Span)
        {
            sum += b;
        }

        Console.WriteLine($"Async processing complete, sum: {sum}");
    }
}
```

### Practical Application: Efficient File Reading

```csharp
using System;
using System.Buffers;
using System.IO;
using System.Threading.Tasks;

class EfficientFileReading
{
    static async Task Main()
    {
        // Create test file
        string testFile = "test_data.bin";
        await CreateTestFile(testFile, 1024 * 1024); // 1MB

        // Efficiently read using ArrayPool
        await ReadFileWithPoolAsync(testFile);

        // Cleanup
        File.Delete(testFile);
    }

    static async Task CreateTestFile(string path, int size)
    {
        byte[] data = new byte[size];
        new Random(42).NextBytes(data);
        await File.WriteAllBytesAsync(path, data);
        Console.WriteLine($"Created test file: {size} bytes");
    }

    static async Task ReadFileWithPoolAsync(string path)
    {
        const int bufferSize = 4096; // 4KB buffer

        byte[] buffer = ArrayPool<byte>.Shared.Rent(bufferSize);

        try
        {
            using FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read);

            long totalBytes = 0;
            int checksum = 0;

            int bytesRead;
            while ((bytesRead = await fs.ReadAsync(buffer.AsMemory(0, bufferSize))) > 0)
            {
                // Process read data using Span
                ReadOnlySpan<byte> data = buffer.AsSpan(0, bytesRead);

                foreach (byte b in data)
                {
                    checksum = (checksum + b) & 0xFFFF;
                }

                totalBytes += bytesRead;
            }

            Console.WriteLine($"Read complete: {totalBytes} bytes, checksum: {checksum}");
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }
}
```

## Performance Advantages and Benchmarking

### Memory Allocation Comparison

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
        Console.WriteLine("Performance Comparison Test");
        Console.WriteLine(new string('=', 50));

        // Warm up
        WarmUp();

        // Test 1: Array allocation vs ArrayPool
        TestArrayAllocation();
        TestArrayPool();

        Console.WriteLine();

        // Test 2: Substring vs Span slice
        TestSubstring();
        TestSpanSlice();

        Console.WriteLine();

        // Test 3: Array copy vs Span view
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
            array[0] = 42; // Prevent optimization
        }

        sw.Stop();
        GC.Collect();
        long memAfter = GC.GetTotalMemory(true);

        Console.WriteLine($"Array allocation: {sw.ElapsedMilliseconds}ms");
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
        Console.WriteLine($"Span slice: {sw.ElapsedMilliseconds}ms");
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
        Console.WriteLine($"Array copy: {sw.ElapsedMilliseconds}ms");
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
        Console.WriteLine($"Span view: {sw.ElapsedMilliseconds}ms");
    }
}
```

### Precise Testing with BenchmarkDotNet

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

// Run benchmark
// class Program
// {
//     static void Main() => BenchmarkRunner.Run<SpanBenchmarks>();
// }
```

### Real-World Scenario: JSON Parsing Optimization

```csharp
using System;
using System.Text;
using System.Text.Json;

class JsonParsingOptimization
{
    static void Main()
    {
        // Simulated JSON data
        string json = """
        {
            "name": "John",
            "age": 30,
            "city": "Beijing",
            "scores": [95, 88, 92, 78, 85]
        }
        """;

        // Efficient parsing using Span and Utf8JsonReader
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
                // Use ValueSpan to avoid string allocation
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
                    // Read array
                    Console.Write("Scores: ");
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

        Console.WriteLine($"Name: {name}");
        Console.WriteLine($"Age: {age}");
        Console.WriteLine($"City: {city}");
    }
}
```

## Best Practices

### Choosing the Right Type

```csharp
using System;
using System.Buffers;
using System.Threading.Tasks;

class TypeSelection
{
    // Use Span in synchronous methods
    public void SyncMethod(Span<int> data)
    {
        foreach (ref int item in data)
        {
            item *= 2;
        }
    }

    // Use Memory in asynchronous methods
    public async Task AsyncMethod(Memory<int> data)
    {
        await Task.Delay(10);

        // Get Span when operation is needed
        Span<int> span = data.Span;
        foreach (ref int item in span)
        {
            item *= 2;
        }
    }

    // Use ReadOnlySpan/ReadOnlyMemory for read-only data
    public int SumValues(ReadOnlySpan<int> values)
    {
        int sum = 0;
        foreach (int value in values)
        {
            sum += value;
        }
        return sum;
    }

    // Avoid: Storing Span in a class
    // private Span<int> _data; // Compilation error

    // Correct: Store Memory or array in a class
    private Memory<int> _memoryData;
    private int[]? _arrayData;
}
```

### Safe Stack Allocation Patterns

```csharp
using System;
using System.Buffers;

class SafeStackAllocation
{
    // Define threshold constant
    private const int MaxStackAllocSize = 256;

    // Recommended pattern: combine stackalloc and ArrayPool
    public void ProcessData(int size)
    {
        byte[]? rentedArray = null;

        try
        {
            Span<byte> buffer = size <= MaxStackAllocSize
                ? stackalloc byte[size]
                : (rentedArray = ArrayPool<byte>.Shared.Rent(size)).AsSpan(0, size);

            // Use buffer...
            buffer.Fill(0);
            DoWork(buffer);
        }
        finally
        {
            // Ensure rented array is returned
            if (rentedArray is not null)
            {
                ArrayPool<byte>.Shared.Return(rentedArray);
            }
        }
    }

    private void DoWork(Span<byte> data)
    {
        // Process data
    }

    // Avoid: Dynamic-sized stack allocation may cause stack overflow
    public void UnsafeMethod(int userProvidedSize)
    {
        // Dangerous: User might pass a very large value
        // Span<byte> buffer = stackalloc byte[userProvidedSize];
    }
}
```

### Proper Use of ArrayPool

```csharp
using System;
using System.Buffers;

class ArrayPoolBestPractices
{
    // Correct: Use try-finally to ensure return
    public void GoodPattern()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
        try
        {
            // Use buffer
            ProcessBuffer(buffer.AsSpan(0, 1024));
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }

    // Better: Use helper method to simplify code
    public void BetterPattern()
    {
        using var lease = new ArrayLease<byte>(1024);
        ProcessBuffer(lease.Span);
    }

    // Avoid: Forgetting to return the array
    public void BadPattern()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
        ProcessBuffer(buffer.AsSpan(0, 1024));
        // Forgot to return! Memory leak
    }

    // Avoid: Returning the same array multiple times
    public void DoubleFree()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
        ArrayPool<byte>.Shared.Return(buffer);
        // ArrayPool<byte>.Shared.Return(buffer); // Dangerous!
    }

    private void ProcessBuffer(Span<byte> data) { }
}

// Helper class: Auto-manage ArrayPool rental
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

### Avoiding Common Pitfalls

```csharp
using System;
using System.Threading.Tasks;

class CommonPitfalls
{
    // Pitfall 1: Returning Span pointing to stack memory
    // public Span<int> DangerousReturn()
    // {
    //     Span<int> local = stackalloc int[5];
    //     return local; // Compilation error, fortunately compiler prevents this
    // }

    // Pitfall 2: Using Span in async methods
    // public async Task DangerousAsync()
    // {
    //     Span<int> span = stackalloc int[5];
    //     await Task.Delay(100); // Compilation error
    // }

    // Correct approach
    public async Task SafeAsync()
    {
        // Use Span before await
        Span<int> span = stackalloc int[5];
        ProcessSync(span);

        await Task.Delay(100);

        // Or use Memory
        int[] array = new int[5];
        Memory<int> memory = array.AsMemory();
        await ProcessAsync(memory);
    }

    private void ProcessSync(Span<int> data) { }
    private async Task ProcessAsync(Memory<int> data)
    {
        await Task.Delay(10);
    }

    // Pitfall 3: Misunderstanding when using original array reference after slicing
    public void SliceMisunderstanding()
    {
        int[] array = { 1, 2, 3, 4, 5 };
        Span<int> slice = array.AsSpan(1, 3);

        // Modifying slice affects the original array!
        slice[0] = 100;
        Console.WriteLine(array[1]); // Output: 100, not 2
    }

    // Pitfall 4: Forgetting that Rent may return larger array than requested
    public void ArrayPoolSize()
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(100);
        Console.WriteLine($"Requested 100, got: {buffer.Length}"); // May be 128 or larger

        // Always track the actual size needed
        int requestedSize = 100;
        Span<byte> actualData = buffer.AsSpan(0, requestedSize);

        ArrayPool<byte>.Shared.Return(buffer);
    }
}
```

### Performance Optimization Tips

```csharp
using System;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

class PerformanceTips
{
    // Tip 1: Use ref return to avoid copying
    public ref int GetElementRef(Span<int> span, int index)
    {
        return ref span[index];
    }

    // Tip 2: Use MemoryMarshal for type casting
    public void ReinterpretCast()
    {
        byte[] bytes = { 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00 };
        Span<int> ints = MemoryMarshal.Cast<byte, int>(bytes);

        Console.WriteLine($"Reinterpreted as int: {ints[0]}, {ints[1]}"); // 1, 2
    }

    // Tip 3: Use Unsafe class for high-performance operations
    public void UnsafeOperations()
    {
        int[] array = { 1, 2, 3, 4, 5 };

        // Get reference to array data, skipping bounds check
        ref int first = ref MemoryMarshal.GetArrayDataReference(array);

        // Use Unsafe.Add for pointer arithmetic
        ref int third = ref Unsafe.Add(ref first, 2);
        Console.WriteLine($"Third element: {third}"); // 3
    }

    // Tip 4: Vectorized operations
    public int SumVectorized(ReadOnlySpan<int> values)
    {
        int sum = 0;

        // For large arrays, consider using SIMD
        // Simplified here, should use System.Numerics.Vector<T> in practice
        foreach (int value in values)
        {
            sum += value;
        }

        return sum;
    }

    // Tip 5: Avoid creating delegates in loops
    public void ProcessWithoutAllocations(Span<int> data)
    {
        // Creates delegate on each iteration
        // foreach (var item in data.ToArray().Select(x => x * 2)) { }

        // Direct operation
        foreach (ref int item in data)
        {
            item *= 2;
        }
    }
}
```

## Summary

`Span<T>` and `Memory<T>` are core tools for high-performance programming in .NET. Their main advantages include:

1. **Zero-allocation operations**: Slicing, view creation and other operations do not allocate new memory
2. **Type safety**: Compile-time checking prevents issues like buffer overflows
3. **Unified abstraction**: Can uniformly handle arrays, stack memory, and unmanaged memory
4. **Performance improvement**: Reduces GC pressure, improves application performance

### Usage Recommendations

| Scenario | Recommended Type |
|----------|------------------|
| Temporary data in synchronous methods | `Span<T>` / `ReadOnlySpan<T>` |
| Asynchronous methods | `Memory<T>` / `ReadOnlyMemory<T>` |
| Class fields | `Memory<T>` or array |
| Small temporary buffers | `stackalloc` + `Span<T>` |
| Frequently allocated large buffers | `ArrayPool<T>` |
| Read-only data | `ReadOnlySpan<T>` / `ReadOnlyMemory<T>` |

### Key Points

- **Span is a ref struct**: Cannot be boxed, cannot be used across await in async methods, cannot be a class field
- **Memory is heap-friendly**: Can be stored in classes, used in async methods
- **ArrayPool reduces allocations**: Reuses arrays, reduces GC pressure
- **stackalloc is suitable for small buffers**: Fast, zero GC, but size must be controlled
- **Slicing is zero-cost**: Creating views does not copy data

With these types, you can write more efficient and safer C# code.

## References

- [Microsoft Learn: Memory and Span usage guidelines](https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/memory-t-usage-guidelines)
- [Adam Sitnik: Span](https://adamsitnik.com/Span/)
- [NDepend Blog: Improve C# code performance with Span](https://blog.ndepend.com/improve-c-code-performance-with-spant/)
- [CODE Magazine: Writing High-Performance Code Using Span and Memory in C#](https://www.codemag.com/Article/2207031/Writing-High-Performance-Code-Using-SpanT-and-MemoryT-in-C)
