---
title: "Go bufio Package: Buffered I/O Operations"
description: Master Go's buffered I/O with bufio package. Learn Scanner, Reader, Writer, and efficient stream processing patterns.
track: go
section: stdlib
difficulty: intermediate
tags:
  - bufio
  - buffered I/O
  - streams
  - performance
  - file handling
status: imported
origin: old/src/content/docs/go/bufio.en.md
divergence: 0.265
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Go
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

The `bufio` package in Go provides buffered I/O operations that wrap `io.Reader` and `io.Writer` interfaces. Buffering improves performance by reducing the number of system calls needed for reading and writing data. Whether you're processing large files, reading network streams, or building command-line applications, understanding bufio is essential for writing efficient Go programs.

---

## Concept Explanation

Buffered I/O is a technique where data is temporarily stored in a buffer before being read from or written to the underlying source. Without buffering, each read or write operation would result in a system call, which is expensive. By accumulating data in a buffer, bufio reduces the overhead and improves throughput.

### The Problem Without Buffering

When you read from a file directly without buffering, each read call makes a system call to the kernel:

```
Application → System Call → Kernel → Disk
           ← Data ←
```

For reading 1 million individual bytes, this would mean 1 million system calls—extremely inefficient.

### The Solution: Buffering

With bufio, data is read in larger chunks and stored in a buffer:

```
Application → Read from Buffer (fast, in-memory)
           ↓
        Buffer (refilled when empty)
           ↓
     System Call → Kernel → Disk (happens less frequently)
```

The Go `bufio` package provides four main types:

- **Reader**: Buffered reading from any `io.Reader`
- **Writer**: Buffered writing to any `io.Writer`
- **Scanner**: Convenient line-by-line or token-based reading
- **ReadWriter**: Combined reader and writer

---

## Core Principles

### Wrapping Pattern

The `bufio` package doesn't replace standard I/O—it wraps existing readers and writers:

```go
// Create a buffered reader from a file
file, _ := os.Open("data.txt")
reader := bufio.NewReader(file)
```

### Buffer Size Configuration

You can control buffer size explicitly:

```go
reader := bufio.NewReaderSize(file, 64*1024) // 64KB buffer
writer := bufio.NewWriterSize(file, 64*1024)
```

### Flush Requirements

Buffered writers cache data; you must flush to ensure it's written:

```go
writer.WriteString("hello")
writer.Flush() // Critical for file/network operations
```

### Delimiter-based Reading

The Scanner type simplifies reading by delimiters (lines, bytes, words):

```go
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    line := scanner.Text()
}
```

---

## Key Points

1. **System Call Reduction**: Buffering drastically reduces system calls, improving performance by 10-100x for small operations

2. **Wrapper Pattern**: `bufio` types wrap existing readers/writers; you maintain control over the underlying source

3. **Flush is Essential**: Buffered writers need explicit flushing to guarantee data is written to the underlying source

4. **Scanner Simplicity**: The Scanner provides a convenient interface for line-by-line and token-based reading

5. **Token Customization**: You can define custom split functions for the Scanner

6. **Buffer Overrun Protection**: Both Reader and Writer have configurable buffer sizes with sensible defaults

7. **Peek Without Consuming**: `Reader.Peek()` allows looking ahead without consuming data

8. **Copy Operations**: `io.Copy` with buffered readers/writers is highly efficient

---

## Code Examples

### Example 1: Reading a Large File Efficiently

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func readFileBuffered(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    // Create buffered reader with default 4KB buffer
    reader := bufio.NewReader(file)

    // Read line by line
    lineNum := 0
    for {
        line, err := reader.ReadString('\n')
        if err != nil && err.Error() != "EOF" {
            return err
        }

        lineNum++
        fmt.Printf("Line %d: %s", lineNum, line)

        if err != nil {
            break // EOF reached
        }
    }

    return nil
}

func main() {
    readFileBuffered("data.txt")
}
```

### Example 2: Using Scanner for Clean Line Reading

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func scanFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)

    // Optional: set custom buffer size
    buf := make([]byte, 64*1024) // 64KB
    scanner.Buffer(buf, 1024*1024) // max 1MB tokens

    lineNum := 0
    for scanner.Scan() {
        lineNum++
        line := scanner.Text()
        fmt.Printf("Line %d: %s\n", lineNum, line)
    }

    // Always check scanner errors
    if err := scanner.Err(); err != nil {
        return fmt.Errorf("scanner error: %w", err)
    }

    return nil
}

func main() {
    scanFile("data.txt")
}
```

### Example 3: Buffered Writing

```go
package main

import (
    "bufio"
    "os"
)

func writeBuffered(filename string) error {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    writer := bufio.NewWriter(file)
    defer writer.Flush() // Flush on exit

    // Write data in buffer
    for i := 0; i < 100000; i++ {
        _, err := writer.WriteString("This is a test line\n")
        if err != nil {
            return err
        }

        // Optionally flush periodically
        if i%10000 == 0 {
            if err := writer.Flush(); err != nil {
                return err
            }
        }
    }

    // Final flush (also happens in defer)
    return writer.Flush()
}

func main() {
    writeBuffered("output.txt")
}
```

### Example 4: Custom Scanner Split Function

```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func scanCustom() error {
    input := "apple,banana,cherry,date"
    reader := strings.NewReader(input)
    scanner := bufio.NewScanner(reader)

    // Split by comma instead of newline
    scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
        if atEOF && len(data) == 0 {
            return 0, nil, nil
        }

        // Find next comma
        if i := strings.IndexByte(string(data), ','); i >= 0 {
            return i + 1, data[0:i], nil
        }

        if atEOF {
            return len(data), data, nil
        }

        return 0, nil, nil // Need more data
    })

    for scanner.Scan() {
        fmt.Println(scanner.Text())
    }

    return scanner.Err()
}

func main() {
    scanCustom()
}
```

### Example 5: Peek and Buffered Reading

```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func peekExample() {
    input := "Hello, World!"
    reader := bufio.NewReader(strings.NewReader(input))

    // Peek first 5 bytes without consuming
    peeked, err := reader.Peek(5)
    if err != nil {
        fmt.Println("Peek error:", err)
        return
    }
    fmt.Printf("Peeked: %q\n", peeked)

    // Now actually read those bytes
    actual, err := reader.ReadBytes(',')
    if err != nil {
        fmt.Println("Read error:", err)
        return
    }
    fmt.Printf("Read: %q\n", actual)

    // Read the rest
    rest, _ := reader.ReadString('\n')
    fmt.Printf("Rest: %q\n", rest)
}

func main() {
    peekExample()
}
```

### Example 6: Reading Word by Word with Delimiter

```go
package main

import (
    "bufio"
    "fmt"
    "strings"
    "unicode"
)

func readWords() {
    input := "The quick brown fox jumps"
    reader := bufio.NewReader(strings.NewReader(input))

    // ReadWord using predefined scan function
    scanner := bufio.NewScanner(reader)
    scanner.Split(bufio.ScanWords)

    for scanner.Scan() {
        word := scanner.Text()
        fmt.Printf("Word: %s\n", word)
    }
}

func main() {
    readWords()
}
```

### Example 7: Error Handling with ReadString

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "strings"
)

func readWithErrorHandling() {
    input := "line1\nline2\nline3"
    reader := bufio.NewReader(strings.NewReader(input))

    for {
        line, err := reader.ReadString('\n')

        // Process the line even if error occurred
        if len(line) > 0 {
            fmt.Printf("Got: %q\n", line)
        }

        // Check for EOF vs other errors
        if err == io.EOF {
            fmt.Println("End of file reached")
            break
        } else if err != nil {
            fmt.Printf("Error: %v\n", err)
            break
        }
    }
}

func main() {
    readWithErrorHandling()
}
```

### Example 8: Combining Reader and Writer

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func copyWithProcessing(src, dst string) error {
    // Open source file
    srcFile, err := os.Open(src)
    if err != nil {
        return err
    }
    defer srcFile.Close()

    // Create destination file
    dstFile, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer dstFile.Close()

    // Create buffered reader and writer
    reader := bufio.NewReader(srcFile)
    writer := bufio.NewWriter(dstFile)
    defer writer.Flush()

    // Process line by line
    for {
        line, err := reader.ReadString('\n')
        if err != nil && err.Error() != "EOF" {
            return err
        }

        // Transform: convert to uppercase
        transformed := strings.ToUpper(line)

        _, err = writer.WriteString(transformed)
        if err != nil {
            return err
        }

        if err != nil { // EOF
            break
        }
    }

    return nil
}

func main() {
    copyWithProcessing("input.txt", "output.txt")
}
```

---

## Best Practices

### Always Defer Flush for Writers

```go
writer := bufio.NewWriter(file)
defer writer.Flush() // Guarantee flush even on error

// Your write operations
writer.WriteString("data")
```

### Check Scanner Errors

```go
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    // Process
}

// Don't forget to check for errors
if err := scanner.Err(); err != nil {
    log.Fatal(err)
}
```

### Use Appropriate Buffer Sizes

```go
// For line-based reading, default 4KB is fine
reader := bufio.NewReader(file)

// For network with lots of small reads, increase buffer
reader := bufio.NewReaderSize(conn, 64*1024)

// For CSV or structured data, consider the record size
reader := bufio.NewReaderSize(file, 256*1024)
```

### Handle EOF Correctly

```go
for {
    line, err := reader.ReadString('\n')

    // Process line even if error occurred
    if len(line) > 0 {
        // handle line
    }

    // Check for EOF
    if err == io.EOF {
        break
    }
    if err != nil {
        return err // Other error
    }
}
```

### Consider Using io.Copy for Large Data Transfers

```go
// Highly efficient: uses internal buffering
_, err := io.Copy(dst, src)

// With custom buffer control if needed
_, err := io.CopyBuffer(dst, src, buf)
```

### Set Reasonable Token Limits in Scanner

```go
scanner := bufio.NewScanner(file)
buf := make([]byte, 0, 64*1024)
scanner.Buffer(buf, 1024*1024) // 64KB initial, 1MB max

// Prevents memory exhaustion from corrupted/huge tokens
```

### Use Named Delimiters When Clear

```go
// Instead of magic runes
line, _ := reader.ReadString('\n')

// Prefer clarity
const newline = '\n'
line, _ := reader.ReadString(newline)
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Flush

```go
// WRONG: Data might not be written
writer := bufio.NewWriter(file)
writer.WriteString("important data")
file.Close() // Data may be lost

// CORRECT: Explicit flush
writer := bufio.NewWriter(file)
writer.WriteString("important data")
writer.Flush() // or use defer
```

### Pitfall 2: Ignoring Scanner Errors

```go
// WRONG: Silent failures
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    process(scanner.Text())
}
// Errors are silently ignored

// CORRECT: Check errors
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    process(scanner.Text())
}
if err := scanner.Err(); err != nil {
    return err
}
```

### Pitfall 3: Incorrect EOF Handling

```go
// WRONG: Missing final line before EOF
for {
    line, err := reader.ReadString('\n')
    if err == io.EOF {
        break // line content lost if no newline at EOF
    }
    process(line)
}

// CORRECT: Process line before checking error
for {
    line, err := reader.ReadString('\n')
    if len(line) > 0 {
        process(line)
    }
    if err == io.EOF {
        break
    }
    if err != nil {
        return err
    }
}
```

### Pitfall 4: Token Size Limit Exceeded

```go
// WRONG: Default 64KB max token—may fail on large lines
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    process(scanner.Text())
}

// CORRECT: Set appropriate limits
scanner := bufio.NewScanner(file)
buf := make([]byte, 0, 64*1024)
scanner.Buffer(buf, 10*1024*1024) // 64KB start, 10MB max
for scanner.Scan() {
    process(scanner.Text())
}
```

### Pitfall 5: Not Handling Partial Writes

```go
// WRONG: Assumes entire write completes
data := []byte("large data")
writer.Write(data)

// CORRECT: Check written count
n, err := writer.Write(data)
if err != nil {
    return err
}
if n != len(data) {
    return fmt.Errorf("incomplete write: %d/%d", n, len(data))
}
```

### Pitfall 6: Peeking Beyond Buffer

```go
// WRONG: Can return partial data
peeked, _ := reader.Peek(10000)
// peeked might be shorter than requested

// CORRECT: Check returned length
peeked, err := reader.Peek(10000)
if len(peeked) < 10000 {
    // Handle incomplete peek
}
```

---

## Performance Considerations

### Buffer Size Impact

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "os"
    "testing"
)

// Benchmark different buffer sizes
func benchmarkRead(size int) time.Duration {
    file, _ := os.Open("large_file.txt")
    defer file.Close()

    reader := bufio.NewReaderSize(file, size)

    start := time.Now()
    io.Copy(io.Discard, reader)
    return time.Since(start)
}

func main() {
    sizes := []int{1024, 4096, 16384, 65536}
    for _, size := range sizes {
        duration := benchmarkRead(size)
        fmt.Printf("Buffer size %5d: %v\n", size, duration)
    }
}
```

### Key Performance Insights

1. **Small Buffer (1-4KB)**: Frequent system calls, higher overhead
2. **Medium Buffer (64-256KB)**: Sweet spot for most workloads
3. **Large Buffer (1MB+)**: Overkill for small files; useful for network I/O

### System Call Reduction

```
Without buffering: 1,000,000 reads = 1,000,000 system calls
With 64KB buffer:  1,000,000 reads = 15 system calls (~66,666 bytes per call)

Performance improvement: 66,666x fewer system calls
```

### When Buffering Matters Most

1. **Network I/O**: Reducing RTT (round-trip time) is critical
2. **Large File Processing**: Amortizes overhead over many bytes
3. **High-frequency Updates**: Batch writes dramatically improve throughput
4. **Streaming Data**: Continuous reading benefits from reduced syscalls

---

## Real-world Scenarios

### Scenario 1: Log File Processing

```go
func processLogs(logFile string, handler func(string) error) error {
    file, err := os.Open(logFile)
    if err != nil {
        return err
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)

    // Set buffer for multi-line log entries
    buf := make([]byte, 0, 64*1024)
    scanner.Buffer(buf, 10*1024*1024)

    lineNum := 0
    for scanner.Scan() {
        lineNum++
        line := scanner.Text()

        if err := handler(line); err != nil {
            return fmt.Errorf("line %d: %w", lineNum, err)
        }
    }

    return scanner.Err()
}

// Usage
func main() {
    processLogs("app.log", func(line string) error {
        if strings.Contains(line, "ERROR") {
            log.Println("Found error:", line)
        }
        return nil
    })
}
```

### Scenario 2: CSV/TSV Parsing

```go
func parseCSV(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    reader := bufio.NewReader(file)

    // Skip header
    reader.ReadString('\n')

    lineNum := 1
    for {
        line, err := reader.ReadString('\n')
        if err != nil && err.Error() != "EOF" {
            return err
        }

        if len(line) > 0 {
            lineNum++
            fields := strings.Split(strings.TrimSpace(line), ",")
            // Process CSV fields
            fmt.Println(fields)
        }

        if err != nil {
            break
        }
    }

    return nil
}
```

### Scenario 3: Network Protocol Parsing

```go
func readHTTPRequest(conn net.Conn) (string, error) {
    reader := bufio.NewReader(conn)

    // Read request line
    reqLine, err := reader.ReadString('\n')
    if err != nil {
        return "", err
    }

    // Read headers until blank line
    headers := make(map[string]string)
    for {
        header, err := reader.ReadString('\n')
        if err != nil {
            return "", err
        }

        header = strings.TrimSpace(header)
        if header == "" {
            break // End of headers
        }

        parts := strings.SplitN(header, ": ", 2)
        if len(parts) == 2 {
            headers[parts[0]] = parts[1]
        }
    }

    return reqLine, nil
}
```

### Scenario 4: Bulk Data Export

```go
func exportDataToFile(dbRows []interface{}, filename string) error {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    writer := bufio.NewWriterSize(file, 256*1024)
    defer writer.Flush()

    // Write header
    writer.WriteString("ID,Name,Value\n")

    // Batch writes for efficiency
    for i, row := range dbRows {
        line := formatRowAsCSV(row)
        _, err := writer.WriteString(line + "\n")
        if err != nil {
            return err
        }

        // Flush periodically to prevent buffer overrun
        if (i+1)%10000 == 0 {
            if err := writer.Flush(); err != nil {
                return err
            }
        }
    }

    return writer.Flush()
}

func formatRowAsCSV(row interface{}) string {
    // Format implementation
    return ""
}
```

### Scenario 5: Pipeline Processing

```go
func pipelineProcess(input, output string) error {
    srcFile, err := os.Open(input)
    if err != nil {
        return err
    }
    defer srcFile.Close()

    dstFile, err := os.Create(output)
    if err != nil {
        return err
    }
    defer dstFile.Close()

    reader := bufio.NewReader(srcFile)
    writer := bufio.NewWriter(dstFile)
    defer writer.Flush()

    scanner := bufio.NewScanner(reader)
    for scanner.Scan() {
        line := scanner.Text()

        // Transform
        processed := strings.ToUpper(line)
        processed = strings.ReplaceAll(processed, "OLD", "NEW")

        // Write
        _, err := writer.WriteString(processed + "\n")
        if err != nil {
            return err
        }
    }

    return scanner.Err()
}
```

---

## Interview Points

### Q1: How does buffio.Reader improve performance compared to unbuffered I/O?

**Answer**: Buffio reduces the number of system calls by reading data in larger chunks. Instead of making a system call for each byte or small group of bytes, bufio reads a larger block (default 4KB) and serves reads from that buffer. This reduces context switches between userspace and kernel space, dramatically improving performance.

**Example**: Reading 1 million individual bytes:
- Unbuffered: 1 million system calls
- With bufio (4KB buffer): ~250 system calls (1,000,000 / 4,096)

### Q2: Why is Flush() necessary for buffered writers?

**Answer**: Buffered writers accumulate data in memory before writing to the underlying source. The Flush() method ensures all buffered data is written to the destination. Without explicit flushing, data may remain in the buffer and be lost if the program terminates unexpectedly.

```go
writer := bufio.NewWriter(file)
writer.WriteString("data")
writer.Flush() // Required to guarantee write
```

### Q3: How does Scanner differ from Reader?

**Answer**:
- **Reader**: Provides low-level read methods (ReadByte, ReadString, etc.)
- **Scanner**: Provides high-level token scanning with configurable delimiters

Scanner is simpler for line-by-line reading but less flexible. Reader offers more control for complex parsing.

### Q4: What's the token size limit in Scanner, and how do you handle large tokens?

**Answer**: The default maximum token size is 64KB. For larger tokens, use:

```go
scanner := bufio.NewScanner(file)
buf := make([]byte, 0, 64*1024) // Initial size
scanner.Buffer(buf, 10*1024*1024) // Max size
```

### Q5: Explain the difference between ReadString and ReadBytes.

**Answer**: Both are nearly identical. ReadString takes a rune delimiter while ReadBytes takes a byte delimiter. They both include the delimiter in the returned slice.

```go
// ReadString(rune)
line, err := reader.ReadString('\n')

// ReadBytes(byte)
line, err := reader.ReadBytes('\n')
```

### Q6: How do you handle partial reads or incomplete writes?

**Answer**: Check the returned count and error:

```go
n, err := writer.Write(data)
if err != nil {
    return err
}
if n < len(data) {
    return fmt.Errorf("incomplete write")
}
```

### Q7: When should you use custom split functions in Scanner?

**Answer**: Use custom split functions when:
- Reading delimited data other than lines (CSV, tab-separated, etc.)
- Processing variable-width records (record headers with length)
- Handling specialized protocols

```go
scanner.Split(bufio.ScanWords) // Built-in
scanner.Split(customSplitFunc)  // Custom
```

### Q8: How do you avoid losing the final line in a file without trailing newline?

**Answer**: Process the line before checking for EOF:

```go
for {
    line, err := reader.ReadString('\n')

    // Process first, check error after
    if len(line) > 0 {
        process(line)
    }

    if err == io.EOF {
        break
    }
    if err != nil {
        return err
    }
}
```

### Q9: What's the purpose of Peek() and when would you use it?

**Answer**: Peek() returns bytes from the buffer without consuming them, allowing lookahead. Use cases:
- Determining record type before full parsing
- Detecting file format
- Conditional token reading

```go
peek, _ := reader.Peek(4)
if string(peek) == "HTTP" {
    // Parse as HTTP protocol
}
```

### Q10: How do you choose an appropriate buffer size?

**Answer**:
- **Default (4KB)**: Good for most sequential file reading
- **64-256KB**: Better for network I/O and large file processing
- **1MB+**: Specialized cases, network connections with variable latency

Consider:
- Average read request size
- System memory constraints
- I/O pattern (sequential vs. random)

---

## Further Reading

### Official Documentation
- [Go bufio Package Documentation](https://pkg.go.dev/bufio)
- [Go io Package Documentation](https://pkg.go.dev/io)

### Related Topics
- File I/O and os.File operations
- io.Reader and io.Writer interfaces
- Go context and deadline handling
- Network programming with TCP/UDP

### Recommended Patterns
- Buffered JSON streaming
- Line-oriented protocol parsing
- Large file processing optimization
- Pipeline architectures in Go

### Advanced Topics
- Custom split functions for Scanner
- Memory-mapped file I/O
- Concurrent read/write patterns
- Buffer pooling with sync.Pool

### Practice Exercises
1. Write a program that counts lines in a file and reports the largest line
2. Implement a simple CSV parser using Scanner
3. Create a log file aggregator that processes multiple files concurrently
4. Build a text file transformer (uppercase, substitution, filtering)
5. Implement a simple HTTP request parser using bufio.Reader

---

## Summary

The `bufio` package is essential for efficient I/O in Go. Key takeaways:

- **Buffering reduces system calls** dramatically, improving performance by orders of magnitude
- **Flush is mandatory** for writers to guarantee data reaches the destination
- **Scanner simplifies line reading** but Reader offers more control
- **Choose buffer sizes** based on your I/O patterns and memory constraints
- **Always handle EOF correctly** to avoid losing data
- **Check errors** at every step in buffered operations

By mastering bufio, you'll write performant Go programs that handle large data volumes efficiently. Whether processing log files, network streams, or CSV data, buffio is your go-to tool for optimized I/O.
