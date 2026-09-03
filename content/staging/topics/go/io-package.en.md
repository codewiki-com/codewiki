---
title: Go io 包详解
description: 深入理解 Go io 包：Reader/Writer 接口、io.Copy、io.Pipe、io.TeeReader、io.MultiWriter 等核心组件
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - io
  - Reader
  - Writer
  - 流处理
status: imported
origin: old/src/content/docs/go/io-package.en.md
divergence: 0.183
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 标准库
  order: 15
  lastUpdated: 2026-01-07
---

The `io` package in Go is one of the most fundamental and important packages in the standard library. It defines the basic interfaces for I/O primitives and serves as the cornerstone of Go's entire I/O ecosystem. Understanding the `io` package is crucial for writing efficient, composable Go programs.

## Concept Explanation

### What is the io Package

The `io` package provides basic interfaces for I/O primitives, mainly including:

- **Reader/Writer interfaces**: Define basic abstractions for read and write operations
- **Helper functions**: Such as `io.Copy`, `io.ReadAll`, etc., for common I/O operations
- **Composition tools**: Such as `io.Pipe`, `io.TeeReader`, `io.MultiWriter`, etc., for building complex I/O pipelines

The design philosophy of the `io` package reflects Go's core principles: **simple, orthogonal, and composable**. By defining small and precise interfaces, Go achieves a high degree of code reuse and flexible composition capabilities.

### Why the io Package is So Important

```go
// The core interfaces of the io package are widely used
// Almost all scenarios involving data reading and writing use these interfaces

// File operations
file, _ := os.Open("data.txt")  // *os.File implements io.Reader and io.Writer

// Network operations
conn, _ := net.Dial("tcp", "localhost:8080")  // net.Conn implements io.Reader and io.Writer

// HTTP responses
resp, _ := http.Get("https://example.com")  // resp.Body implements io.Reader

// Memory buffers
var buf bytes.Buffer  // bytes.Buffer implements io.Reader and io.Writer
```

### Historical Background

The design of the `io` package draws inspiration from Unix's "everything is a file" philosophy and pipe mechanism. In Unix systems, files, devices, and network connections are all abstracted as file descriptors and can be operated through unified read/write system calls. Go's `io` package elevates this concept to the type system level, achieving stronger type safety and better abstraction through interfaces.

## Core Principles

### Reader Interface

`io.Reader` is the most fundamental reading interface in Go:

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}
```

**The Read method contract:**

1. **Read data**: Read up to `len(p)` bytes into `p`
2. **Return values**: Return the number of bytes actually read `n` (0 <= n <= len(p)) and any error
3. **EOF handling**: Return `io.EOF` error when reaching the end of data
4. **Partial reads**: Even if `n < len(p)`, the entire space of `p` may have been used
5. **Non-blocking**: If data is temporarily unavailable but EOF has not been reached, Read should block rather than return an error

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    // Create a Reader
    reader := strings.NewReader("Hello, Go io package!")

    // Read data in chunks
    buf := make([]byte, 8)
    for {
        n, err := reader.Read(buf)
        if n > 0 {
            fmt.Printf("Read %d bytes: %s\n", n, buf[:n])
        }
        if err == io.EOF {
            fmt.Println("Reading complete")
            break
        }
        if err != nil {
            fmt.Println("Read error:", err)
            break
        }
    }
}

// Output:
// Read 8 bytes: Hello, G
// Read 8 bytes: o io pac
// Read 5 bytes: kage!
// Reading complete
```

### Writer Interface

`io.Writer` is the most fundamental writing interface in Go:

```go
type Writer interface {
    Write(p []byte) (n int, err error)
}
```

**The Write method contract:**

1. **Write data**: Write data from `p` to the underlying data stream
2. **Return values**: Return the number of bytes actually written `n` and any error
3. **Complete write**: If `n < len(p)`, must return a non-nil error
4. **Do not modify slice**: Write must not modify the slice `p`, even temporarily

```go
package main

import (
    "bytes"
    "fmt"
    "os"
)

func main() {
    // Write to standard output
    n, err := os.Stdout.Write([]byte("Hello, stdout!\n"))
    fmt.Printf("Wrote %d bytes, error: %v\n", n, err)

    // Write to memory buffer
    var buf bytes.Buffer
    buf.Write([]byte("Hello, "))
    buf.Write([]byte("Buffer!"))
    fmt.Println("Buffer content:", buf.String())
}
```

### Other Important Interfaces

```go
// Closer interface: for closing resources
type Closer interface {
    Close() error
}

// Seeker interface: for random access
type Seeker interface {
    Seek(offset int64, whence int) (int64, error)
}

// Combined interfaces
type ReadWriter interface {
    Reader
    Writer
}

type ReadCloser interface {
    Reader
    Closer
}

type WriteCloser interface {
    Writer
    Closer
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}

type ReadSeeker interface {
    Reader
    Seeker
}

type WriteSeeker interface {
    Writer
    Seeker
}

type ReadWriteSeeker interface {
    Reader
    Writer
    Seeker
}
```

### The Power of Interface Composition

```go
package main

import (
    "fmt"
    "io"
    "os"
)

// Process any Reader
func processReader(r io.Reader) error {
    data, err := io.ReadAll(r)
    if err != nil {
        return err
    }
    fmt.Printf("Processed %d bytes of data\n", len(data))
    return nil
}

// Process any ReadCloser
func processAndClose(rc io.ReadCloser) error {
    defer rc.Close()
    return processReader(rc)
}

func main() {
    // File implements ReadCloser
    file, _ := os.Open("example.txt")
    processAndClose(file)

    // Use io.NopCloser to convert Reader to ReadCloser
    reader := strings.NewReader("some data")
    rc := io.NopCloser(reader)
    processAndClose(rc)
}
```

## Key Points

### io.Copy - Efficient Data Copying

`io.Copy` is one of the most commonly used I/O functions, for copying data from a Reader to a Writer:

```go
func Copy(dst Writer, src Reader) (written int64, err error)
```

**How it works:**

1. Read data from `src`
2. Write the read data to `dst`
3. Repeat until `src` returns EOF or an error occurs
4. Return the total number of bytes copied

```go
package main

import (
    "fmt"
    "io"
    "os"
    "strings"
)

func main() {
    // Basic copy: from string to standard output
    reader := strings.NewReader("Hello, io.Copy!\n")
    n, err := io.Copy(os.Stdout, reader)
    fmt.Printf("Copied %d bytes, error: %v\n", n, err)

    // File copy example
    src, _ := os.Open("source.txt")
    defer src.Close()

    dst, _ := os.Create("destination.txt")
    defer dst.Close()

    written, err := io.Copy(dst, src)
    if err != nil {
        fmt.Println("Copy failed:", err)
        return
    }
    fmt.Printf("Successfully copied %d bytes\n", written)
}
```

**io.CopyN - Limit the number of bytes copied:**

```go
package main

import (
    "fmt"
    "io"
    "os"
    "strings"
)

func main() {
    reader := strings.NewReader("Hello, World! This is a long string.")

    // Only copy the first 13 bytes
    n, err := io.CopyN(os.Stdout, reader, 13)
    fmt.Printf("\nCopied %d bytes, error: %v\n", n, err)
    // Output: Hello, World!
}
```

**io.CopyBuffer - Use a custom buffer:**

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "strings"
)

func main() {
    src := strings.NewReader("Hello, CopyBuffer!")
    var dst bytes.Buffer

    // Use a custom 32KB buffer
    buf := make([]byte, 32*1024)
    n, err := io.CopyBuffer(&dst, src, buf)

    fmt.Printf("Copied %d bytes: %s\n", n, dst.String())
}
```

### io.Pipe - In-Memory Pipe

`io.Pipe` creates a synchronous in-memory pipe to connect a Reader and a Writer:

```go
func Pipe() (*PipeReader, *PipeWriter)
```

**Characteristics:**

- Synchronous operation: Write operations block until data is read
- No internal buffering: Data passes directly from the write end to the read end
- Thread-safe: Can be safely used in different goroutines

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
)

type User struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    // Create a pipe
    pr, pw := io.Pipe()

    // Write JSON data in one goroutine
    go func() {
        defer pw.Close()

        encoder := json.NewEncoder(pw)
        users := []User{
            {"Zhang San", "zhangsan@example.com"},
            {"Li Si", "lisi@example.com"},
            {"Wang Wu", "wangwu@example.com"},
        }

        for _, user := range users {
            if err := encoder.Encode(user); err != nil {
                pw.CloseWithError(err)
                return
            }
        }
    }()

    // Read in the main goroutine
    decoder := json.NewDecoder(pr)
    for {
        var user User
        err := decoder.Decode(&user)
        if err == io.EOF {
            break
        }
        if err != nil {
            fmt.Println("Decode error:", err)
            break
        }
        fmt.Printf("Read user: %s <%s>\n", user.Name, user.Email)
    }
}
```

**Practical application for handling large data streams:**

```go
package main

import (
    "compress/gzip"
    "fmt"
    "io"
    "os"
)

func main() {
    // Scenario: Compress file and upload (simulated)
    pr, pw := io.Pipe()

    // Error channel
    errCh := make(chan error, 1)

    // Producer: Read file and compress
    go func() {
        defer pw.Close()

        // Create gzip Writer
        gw := gzip.NewWriter(pw)
        defer gw.Close()

        // Read source file
        file, err := os.Open("large_file.txt")
        if err != nil {
            pw.CloseWithError(err)
            errCh <- err
            return
        }
        defer file.Close()

        // Compress data
        _, err = io.Copy(gw, file)
        if err != nil {
            pw.CloseWithError(err)
            errCh <- err
            return
        }

        errCh <- nil
    }()

    // Consumer: Write compressed data to destination file
    output, _ := os.Create("compressed.gz")
    defer output.Close()

    written, err := io.Copy(output, pr)
    if err != nil {
        fmt.Println("Write error:", err)
        return
    }

    // Check if producer had an error
    if prodErr := <-errCh; prodErr != nil {
        fmt.Println("Compression error:", prodErr)
        return
    }

    fmt.Printf("Successfully compressed %d bytes\n", written)
}
```

### io.TeeReader - Data Splitting

`io.TeeReader` returns a Reader that writes data read from `r` to `w` simultaneously:

```go
func TeeReader(r Reader, w Writer) Reader
```

**Use cases:**

- Calculate data checksums while processing data
- Log network requests/responses while forwarding data
- Debug I/O streams

```go
package main

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "strings"
)

func main() {
    // Original data
    data := "Hello, io.TeeReader! This is important data."
    reader := strings.NewReader(data)

    // Create SHA256 hash calculator
    hash := sha256.New()

    // Create TeeReader: calculate hash while reading data
    teeReader := io.TeeReader(reader, hash)

    // Read and process data
    content, err := io.ReadAll(teeReader)
    if err != nil {
        fmt.Println("Read error:", err)
        return
    }

    // Data has been read, hash has been calculated
    fmt.Println("Content:", string(content))
    fmt.Println("SHA256:", hex.EncodeToString(hash.Sum(nil)))
}
```

**Practical application: Download file and verify checksum**

```go
package main

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "net/http"
    "os"
)

func downloadAndVerify(url, expectedHash string, dest string) error {
    // Make HTTP request
    resp, err := http.Get(url)
    if err != nil {
        return fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    // Create destination file
    file, err := os.Create(dest)
    if err != nil {
        return fmt.Errorf("failed to create file: %w", err)
    }
    defer file.Close()

    // Create hash calculator
    hash := sha256.New()

    // Use TeeReader to write to file and calculate hash simultaneously
    teeReader := io.TeeReader(resp.Body, hash)

    // Copy data to file
    written, err := io.Copy(file, teeReader)
    if err != nil {
        return fmt.Errorf("download failed: %w", err)
    }

    // Verify hash
    actualHash := hex.EncodeToString(hash.Sum(nil))
    if actualHash != expectedHash {
        os.Remove(dest) // Delete corrupted file
        return fmt.Errorf("hash mismatch: expected %s, got %s", expectedHash, actualHash)
    }

    fmt.Printf("Download successful: %d bytes, hash verified\n", written)
    return nil
}
```

### io.MultiWriter - Multi-Target Writing

`io.MultiWriter` creates a Writer that writes data to all provided Writers simultaneously:

```go
func MultiWriter(writers ...Writer) Writer
```

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "os"
)

func main() {
    // Create multiple write targets
    var buf1, buf2 bytes.Buffer

    // Create MultiWriter: write to stdout, buf1, buf2 simultaneously
    multiWriter := io.MultiWriter(os.Stdout, &buf1, &buf2)

    // Write data
    fmt.Fprintln(multiWriter, "This message will be written to three places")

    // Verify
    fmt.Println("buf1:", buf1.String())
    fmt.Println("buf2:", buf2.String())
}
```

**Practical application: Log to both file and console**

```go
package main

import (
    "fmt"
    "io"
    "log"
    "os"
    "time"
)

func setupLogger() (*log.Logger, func()) {
    // Create log file
    logFile, err := os.OpenFile(
        fmt.Sprintf("app_%s.log", time.Now().Format("2006-01-02")),
        os.O_CREATE|os.O_WRONLY|os.O_APPEND,
        0644,
    )
    if err != nil {
        log.Fatal("Unable to create log file:", err)
    }

    // Create MultiWriter: output to both file and console
    multiWriter := io.MultiWriter(os.Stdout, logFile)

    // Create Logger
    logger := log.New(multiWriter, "[APP] ", log.Ldate|log.Ltime|log.Lshortfile)

    // Return cleanup function
    cleanup := func() {
        logFile.Close()
    }

    return logger, cleanup
}

func main() {
    logger, cleanup := setupLogger()
    defer cleanup()

    logger.Println("Application started")
    logger.Println("Processing user request")
    logger.Println("Operation completed")
}
```

### io.MultiReader - Multi-Source Reading

`io.MultiReader` creates a Reader that reads data from multiple Readers in sequence:

```go
func MultiReader(readers ...Reader) Reader
```

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    // Create multiple Readers
    r1 := strings.NewReader("Hello, ")
    r2 := strings.NewReader("World")
    r3 := strings.NewReader("!")

    // Merge multiple Readers
    multiReader := io.MultiReader(r1, r2, r3)

    // Read all data at once
    data, _ := io.ReadAll(multiReader)
    fmt.Println(string(data)) // Output: Hello, World!
}
```

**Practical application: Merge file header and content**

```go
package main

import (
    "bytes"
    "io"
    "os"
)

func writeFileWithHeader(filename string, header []byte, content io.Reader) error {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    // Create header Reader
    headerReader := bytes.NewReader(header)

    // Merge header and content
    combined := io.MultiReader(headerReader, content)

    // Write to file
    _, err = io.Copy(file, combined)
    return err
}
```

### io.LimitReader - Limit Read Amount

`io.LimitReader` returns a Reader that reads at most n bytes:

```go
func LimitReader(r Reader, n int64) Reader
```

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    reader := strings.NewReader("Hello, World! This is a very long string.")

    // Only read the first 13 bytes
    limitReader := io.LimitReader(reader, 13)

    data, _ := io.ReadAll(limitReader)
    fmt.Println(string(data)) // Output: Hello, World!
}
```

**Security application: Prevent oversized request bodies**

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const MaxBodySize = 1 << 20 // 1MB

func handleRequest(w http.ResponseWriter, r *http.Request) {
    // Limit request body size to prevent memory exhaustion attacks
    limitedReader := io.LimitReader(r.Body, MaxBodySize)

    var data map[string]interface{}
    decoder := json.NewDecoder(limitedReader)

    if err := decoder.Decode(&data); err != nil {
        if err == io.EOF {
            http.Error(w, "Request body is empty", http.StatusBadRequest)
            return
        }
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    fmt.Fprintf(w, "Received data: %v", data)
}
```

### io.SectionReader - Section Reading

`io.SectionReader` implements Read, Seek, and ReadAt for a section of the underlying `ReaderAt`:

```go
func NewSectionReader(r ReaderAt, off int64, n int64) *SectionReader
```

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    reader := strings.NewReader("Hello, World! Welcome to Go.")

    // Only read the "World!" part (starting at offset 7, reading 6 bytes)
    section := io.NewSectionReader(reader, 7, 6)

    data, _ := io.ReadAll(section)
    fmt.Println(string(data)) // Output: World!

    // SectionReader supports Seek
    section.Seek(0, io.SeekStart) // Return to beginning

    buf := make([]byte, 3)
    section.Read(buf)
    fmt.Println(string(buf)) // Output: Wor
}
```

## Code Examples

### Custom Reader Implementation

```go
package main

import (
    "fmt"
    "io"
)

// CountingReader counts the bytes read
type CountingReader struct {
    reader    io.Reader
    BytesRead int64
}

func NewCountingReader(r io.Reader) *CountingReader {
    return &CountingReader{reader: r}
}

func (cr *CountingReader) Read(p []byte) (n int, err error) {
    n, err = cr.reader.Read(p)
    cr.BytesRead += int64(n)
    return
}

func main() {
    data := "Hello, World! This is a counting reader example."
    cr := NewCountingReader(strings.NewReader(data))

    // Read data
    io.ReadAll(cr)

    fmt.Printf("Total bytes read: %d\n", cr.BytesRead)
}
```

### Custom Writer Implementation

```go
package main

import (
    "fmt"
    "io"
    "unicode"
)

// UppercaseWriter converts all written content to uppercase
type UppercaseWriter struct {
    writer io.Writer
}

func NewUppercaseWriter(w io.Writer) *UppercaseWriter {
    return &UppercaseWriter{writer: w}
}

func (uw *UppercaseWriter) Write(p []byte) (n int, err error) {
    // Convert to uppercase
    upper := make([]byte, len(p))
    for i, b := range p {
        upper[i] = byte(unicode.ToUpper(rune(b)))
    }
    return uw.writer.Write(upper)
}

func main() {
    var buf bytes.Buffer
    uw := NewUppercaseWriter(&buf)

    io.WriteString(uw, "hello, world!")

    fmt.Println(buf.String()) // Output: HELLO, WORLD!
}
```

### Progress Tracking Reader

```go
package main

import (
    "fmt"
    "io"
    "strings"
    "time"
)

// ProgressReader tracks reading progress
type ProgressReader struct {
    reader     io.Reader
    total      int64
    read       int64
    onProgress func(read, total int64)
}

func NewProgressReader(r io.Reader, total int64, callback func(read, total int64)) *ProgressReader {
    return &ProgressReader{
        reader:     r,
        total:      total,
        onProgress: callback,
    }
}

func (pr *ProgressReader) Read(p []byte) (n int, err error) {
    n, err = pr.reader.Read(p)
    pr.read += int64(n)
    if pr.onProgress != nil {
        pr.onProgress(pr.read, pr.total)
    }
    return
}

func main() {
    data := strings.Repeat("x", 1000)

    progressCallback := func(read, total int64) {
        percent := float64(read) / float64(total) * 100
        fmt.Printf("\rProgress: %.1f%% (%d/%d bytes)", percent, read, total)
    }

    pr := NewProgressReader(
        strings.NewReader(data),
        int64(len(data)),
        progressCallback,
    )

    // Simulate slow reading
    buf := make([]byte, 100)
    for {
        _, err := pr.Read(buf)
        if err == io.EOF {
            break
        }
        time.Sleep(50 * time.Millisecond)
    }

    fmt.Println("\nReading complete!")
}
```

### Complete Data Processing Pipeline

```go
package main

import (
    "bufio"
    "bytes"
    "compress/gzip"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "strings"
)

func main() {
    // Original data
    originalData := "Hello, World! This is a demonstration of io composition."

    // Step 1: Compress data
    var compressed bytes.Buffer
    gzWriter := gzip.NewWriter(&compressed)
    io.WriteString(gzWriter, originalData)
    gzWriter.Close()

    fmt.Printf("Original size: %d bytes\n", len(originalData))
    fmt.Printf("Compressed size: %d bytes\n", compressed.Len())

    // Step 2: Use TeeReader to decompress and calculate hash
    hash := sha256.New()
    gzReader, _ := gzip.NewReader(&compressed)
    teeReader := io.TeeReader(gzReader, hash)

    // Step 3: Use buffered reading
    bufferedReader := bufio.NewReader(teeReader)

    // Step 4: Read line by line
    fmt.Println("\nDecompressed content:")
    for {
        line, err := bufferedReader.ReadString('\n')
        if len(line) > 0 {
            fmt.Print(line)
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            fmt.Println("Read error:", err)
            break
        }
    }

    // Calculate final hash after reading is complete
    fmt.Printf("\n\nSHA256: %s\n", hex.EncodeToString(hash.Sum(nil)))
}
```

## Best Practices

### Always Check Return Values

```go
// Bad example
func badExample(r io.Reader) {
    buf := make([]byte, 1024)
    r.Read(buf)  // Ignored return values!
}

// Correct approach
func goodExample(r io.Reader) error {
    buf := make([]byte, 1024)
    n, err := r.Read(buf)
    if err != nil && err != io.EOF {
        return err
    }
    // Only use actually read data
    process(buf[:n])
    return nil
}
```

### Handle io.EOF Correctly

```go
// io.EOF is a normal end signal, not an error
func readAll(r io.Reader) ([]byte, error) {
    var result []byte
    buf := make([]byte, 1024)

    for {
        n, err := r.Read(buf)
        if n > 0 {
            result = append(result, buf[:n]...)
        }

        if err == io.EOF {
            // Normal end
            return result, nil
        }

        if err != nil {
            // Real error
            return result, err
        }
    }
}
```

### Prefer io.Copy Over Manual Loops

```go
// Not recommended: Manual copying
func manualCopy(dst io.Writer, src io.Reader) error {
    buf := make([]byte, 1024)
    for {
        n, err := src.Read(buf)
        if n > 0 {
            if _, writeErr := dst.Write(buf[:n]); writeErr != nil {
                return writeErr
            }
        }
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
    }
}

// Recommended: Use io.Copy
func betterCopy(dst io.Writer, src io.Reader) error {
    _, err := io.Copy(dst, src)
    return err
}
```

### Use defer to Ensure Resource Closure

```go
func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()  // Ensure file is closed

    // Process file...
    return nil
}
```

### Use Interfaces for Dependency Injection

```go
// Testable design
type DataProcessor struct {
    reader io.Reader
    writer io.Writer
}

func (dp *DataProcessor) Process() error {
    data, err := io.ReadAll(dp.reader)
    if err != nil {
        return err
    }

    // Process data...
    processed := bytes.ToUpper(data)

    _, err = dp.writer.Write(processed)
    return err
}

// Can use bytes.Buffer for testing
func TestDataProcessor(t *testing.T) {
    input := bytes.NewBufferString("hello")
    output := &bytes.Buffer{}

    dp := &DataProcessor{reader: input, writer: output}
    dp.Process()

    if output.String() != "HELLO" {
        t.Errorf("Expected HELLO, got %s", output.String())
    }
}
```

### Use Buffering Appropriately

```go
package main

import (
    "bufio"
    "io"
    "os"
)

func copyWithBuffer(src, dst string) error {
    srcFile, err := os.Open(src)
    if err != nil {
        return err
    }
    defer srcFile.Close()

    dstFile, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer dstFile.Close()

    // Use buffered Writer to improve performance
    bufferedWriter := bufio.NewWriter(dstFile)
    defer bufferedWriter.Flush()  // Ensure all data is written

    _, err = io.Copy(bufferedWriter, srcFile)
    return err
}
```

## Common Pitfalls

### Forgetting to Handle Partial Reads

```go
// Error: Assuming Read will fill the buffer
func badRead(r io.Reader) ([]byte, error) {
    buf := make([]byte, 1024)
    r.Read(buf)  // May have only read partial data
    return buf, nil  // Returning buffer that may contain garbage data
}

// Correct: Use io.ReadFull to ensure full read
func goodRead(r io.Reader, size int) ([]byte, error) {
    buf := make([]byte, size)
    _, err := io.ReadFull(r, buf)
    if err != nil {
        return nil, err
    }
    return buf, nil
}
```

### Ignoring Write Return Values

```go
// Error: Ignoring write errors
func badWrite(w io.Writer, data []byte) {
    w.Write(data)  // May fail to write!
}

// Correct: Check return values
func goodWrite(w io.Writer, data []byte) error {
    n, err := w.Write(data)
    if err != nil {
        return err
    }
    if n != len(data) {
        return io.ErrShortWrite
    }
    return nil
}
```

### Forgetting to Close in Pipe

```go
// Error: Forgetting to close PipeWriter, causing Reader to block
func badPipe() {
    pr, pw := io.Pipe()

    go func() {
        pw.Write([]byte("hello"))
        // Forgot pw.Close(), Reader will wait forever
    }()

    io.ReadAll(pr)  // Blocks forever
}

// Correct: Always close PipeWriter
func goodPipe() {
    pr, pw := io.Pipe()

    go func() {
        defer pw.Close()
        pw.Write([]byte("hello"))
    }()

    data, _ := io.ReadAll(pr)
    fmt.Println(string(data))
}
```

### Re-reading an Exhausted Reader

```go
// Error: Reader can only be read once
func badReuse(r io.Reader) {
    data1, _ := io.ReadAll(r)
    data2, _ := io.ReadAll(r)  // data2 will be empty!

    fmt.Println(len(data1), len(data2))
}

// Solution 1: Use io.TeeReader to save data
func solution1(r io.Reader) {
    var buf bytes.Buffer
    tee := io.TeeReader(r, &buf)

    data1, _ := io.ReadAll(tee)
    data2, _ := io.ReadAll(&buf)

    fmt.Println(len(data1), len(data2))  // Same
}

// Solution 2: Use bytes.Reader's Reset
func solution2(data []byte) {
    reader := bytes.NewReader(data)

    io.ReadAll(reader)
    reader.Reset(data)  // Reset to beginning
    io.ReadAll(reader)
}
```

### Error Handling in MultiWriter

```go
// Note: MultiWriter stops on first error
func multiWriterError() {
    var buf1, buf2 bytes.Buffer

    // Create a Writer that will fail
    failWriter := &errorWriter{}

    multi := io.MultiWriter(&buf1, failWriter, &buf2)

    _, err := multi.Write([]byte("hello"))
    // buf1 will receive data, but buf2 will not
    if err != nil {
        fmt.Println("Write failed:", err)
    }
}

type errorWriter struct{}

func (e *errorWriter) Write(p []byte) (int, error) {
    return 0, fmt.Errorf("simulated error")
}
```

## Performance Considerations

### Buffer Size Selection

```go
package main

import (
    "io"
    "os"
    "testing"
)

// Benchmark: Impact of different buffer sizes
func BenchmarkCopyBuffer(b *testing.B) {
    sizes := []int{
        512,
        1024,
        4096,
        32 * 1024,  // 32KB, usually the best choice
        64 * 1024,
        1024 * 1024,
    }

    for _, size := range sizes {
        b.Run(fmt.Sprintf("buf_%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                src, _ := os.Open("testfile")
                dst, _ := os.Create("output")

                buf := make([]byte, size)
                io.CopyBuffer(dst, src, buf)

                src.Close()
                dst.Close()
            }
        })
    }
}
```

### Avoid Unnecessary Memory Allocations

```go
// Bad: Allocates new buffer on each call
func badCopy(src io.Reader, dst io.Writer) error {
    buf := make([]byte, 32*1024)  // Allocates every time
    _, err := io.CopyBuffer(dst, src, buf)
    return err
}

// Good: Reuse buffer
type Copier struct {
    buf []byte
}

func NewCopier() *Copier {
    return &Copier{buf: make([]byte, 32*1024)}
}

func (c *Copier) Copy(dst io.Writer, src io.Reader) error {
    _, err := io.CopyBuffer(dst, src, c.buf)
    return err
}

// Better: Use sync.Pool
var bufPool = sync.Pool{
    New: func() interface{} {
        buf := make([]byte, 32*1024)
        return &buf
    },
}

func pooledCopy(dst io.Writer, src io.Reader) error {
    bufPtr := bufPool.Get().(*[]byte)
    defer bufPool.Put(bufPtr)

    _, err := io.CopyBuffer(dst, src, *bufPtr)
    return err
}
```

### Optimization with WriteTo and ReadFrom

```go
// io.Copy automatically detects and uses these interfaces for optimization

// WriteTo interface: Reader writes directly to Writer
type WriterTo interface {
    WriteTo(w Writer) (n int64, err error)
}

// ReadFrom interface: Writer reads directly from Reader
type ReaderFrom interface {
    ReadFrom(r Reader) (n int64, err error)
}

// For example, bytes.Buffer implements both interfaces
// When io.Copy's source or destination implements these interfaces, it calls them directly
// Avoiding extra buffers and data copies
```

### Leverage OS Zero-Copy

```go
// On Linux, when src is a file and dst supports it
// io.Copy uses the sendfile system call for zero-copy

func efficientFileCopy(src, dst string) error {
    srcFile, err := os.Open(src)
    if err != nil {
        return err
    }
    defer srcFile.Close()

    dstFile, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer dstFile.Close()

    // io.Copy automatically selects the optimal strategy
    // Including possible sendfile system call
    _, err = io.Copy(dstFile, srcFile)
    return err
}
```

### Pipe Performance Considerations

```go
// io.Pipe is synchronous with no internal buffering
// For high-throughput scenarios, consider using buffered channels

// Buffered pipe implementation
type BufferedPipe struct {
    buf    chan []byte
    done   chan struct{}
    writer *BufferedPipeWriter
    reader *BufferedPipeReader
}

func NewBufferedPipe(bufferSize int) *BufferedPipe {
    bp := &BufferedPipe{
        buf:  make(chan []byte, bufferSize),
        done: make(chan struct{}),
    }
    bp.writer = &BufferedPipeWriter{bp: bp}
    bp.reader = &BufferedPipeReader{bp: bp}
    return bp
}
```

## Practical Scenarios

### Scenario 1: HTTP Response Streaming

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "net/http"
    "os"
)

func downloadLargeFile(url string, dest string) error {
    resp, err := http.Get(url)
    if err != nil {
        return fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    // Create destination file
    file, err := os.Create(dest)
    if err != nil {
        return fmt.Errorf("failed to create file: %w", err)
    }
    defer file.Close()

    // Use buffered Writer
    buffered := bufio.NewWriter(file)
    defer buffered.Flush()

    // Get file size
    total := resp.ContentLength

    // Create progress tracker
    progress := &ProgressWriter{
        writer: buffered,
        total:  total,
        onProgress: func(written, total int64) {
            if total > 0 {
                percent := float64(written) / float64(total) * 100
                fmt.Printf("\rDownload progress: %.2f%% (%d/%d bytes)", percent, written, total)
            }
        },
    }

    // Copy data
    _, err = io.Copy(progress, resp.Body)
    fmt.Println()  // Newline

    return err
}

type ProgressWriter struct {
    writer     io.Writer
    written    int64
    total      int64
    onProgress func(written, total int64)
}

func (pw *ProgressWriter) Write(p []byte) (n int, err error) {
    n, err = pw.writer.Write(p)
    pw.written += int64(n)
    if pw.onProgress != nil {
        pw.onProgress(pw.written, pw.total)
    }
    return
}
```

### Scenario 2: Log Processing Pipeline

```go
package main

import (
    "bufio"
    "encoding/json"
    "io"
    "os"
    "strings"
    "time"
)

type LogEntry struct {
    Timestamp time.Time `json:"timestamp"`
    Level     string    `json:"level"`
    Message   string    `json:"message"`
}

// Log processing pipeline
func processLogs(input io.Reader, output io.Writer) error {
    scanner := bufio.NewScanner(input)
    encoder := json.NewEncoder(output)

    for scanner.Scan() {
        line := scanner.Text()

        // Parse log line
        entry := parseLogLine(line)

        // Filter ERROR level
        if entry.Level == "ERROR" {
            if err := encoder.Encode(entry); err != nil {
                return err
            }
        }
    }

    return scanner.Err()
}

func parseLogLine(line string) LogEntry {
    // Simplified log parsing
    parts := strings.SplitN(line, " ", 3)
    return LogEntry{
        Timestamp: time.Now(),
        Level:     parts[1],
        Message:   parts[2],
    }
}

func main() {
    // Process log file
    input, _ := os.Open("app.log")
    defer input.Close()

    output, _ := os.Create("errors.json")
    defer output.Close()

    processLogs(input, output)
}
```

### Scenario 3: Data Transformation Proxy

```go
package main

import (
    "io"
    "net/http"
    "strings"
)

// Redacting Writer: masks sensitive information in response content
type RedactingWriter struct {
    writer   io.Writer
    keywords []string
}

func (rw *RedactingWriter) Write(p []byte) (n int, err error) {
    content := string(p)

    for _, keyword := range rw.keywords {
        content = strings.ReplaceAll(content, keyword, "[REDACTED]")
    }

    return rw.writer.Write([]byte(content))
}

// Proxy handler
func proxyHandler(w http.ResponseWriter, r *http.Request) {
    // Make proxy request
    resp, err := http.Get("http://backend-service" + r.URL.Path)
    if err != nil {
        http.Error(w, "Proxy request failed", http.StatusBadGateway)
        return
    }
    defer resp.Body.Close()

    // Copy response headers
    for key, values := range resp.Header {
        for _, value := range values {
            w.Header().Add(key, value)
        }
    }
    w.WriteHeader(resp.StatusCode)

    // Use redacting Writer
    redacting := &RedactingWriter{
        writer:   w,
        keywords: []string{"password", "secret", "token"},
    }

    io.Copy(redacting, resp.Body)
}
```

### Scenario 4: Data Validation Stream

```go
package main

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "os"
)

// ValidatingReader validates data integrity while reading
type ValidatingReader struct {
    reader       io.Reader
    expectedHash string
    hash         io.Writer
    bytesRead    int64
}

func NewValidatingReader(r io.Reader, expectedHash string) *ValidatingReader {
    hash := sha256.New()
    return &ValidatingReader{
        reader:       io.TeeReader(r, hash),
        expectedHash: expectedHash,
        hash:         hash,
    }
}

func (vr *ValidatingReader) Read(p []byte) (n int, err error) {
    n, err = vr.reader.Read(p)
    vr.bytesRead += int64(n)
    return
}

func (vr *ValidatingReader) Validate() error {
    actualHash := hex.EncodeToString(vr.hash.(*sha256.digest).Sum(nil))
    if actualHash != vr.expectedHash {
        return fmt.Errorf("hash mismatch: expected %s, got %s", vr.expectedHash, actualHash)
    }
    return nil
}

func processWithValidation(filename string, expectedHash string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    vr := NewValidatingReader(file, expectedHash)

    // Process data...
    io.Copy(io.Discard, vr)

    // Validate
    return vr.Validate()
}
```

## Interview Key Points

### Basic Concept Questions

**Q1: What are the characteristics of io.Reader and io.Writer interfaces? Why are they designed this way?**

```
A1:
- io.Reader has only one Read method, io.Writer has only one Write method
- This minimal interface design reflects Go's "small interface" philosophy
- Advantages:
  1. Easy to implement: Any type only needs to implement one method to satisfy the interface
  2. Highly composable: Complex I/O processing pipelines can be created through composition
  3. Decoupled: Code doesn't depend on concrete implementations, only interfaces
  4. Test-friendly: Easy to create mock objects for unit testing
```

**Q2: Is io.EOF an error? How should it be handled?**

```go
// io.EOF is a predefined sentinel error indicating normal end of input
// Should not be returned as an error to callers

func readData(r io.Reader) ([]byte, error) {
    data, err := io.ReadAll(r)
    if err != nil {
        // io.ReadAll handles EOF internally and won't return EOF
        return nil, err
    }
    return data, nil
}

// Correct handling when reading manually
func manualRead(r io.Reader) ([]byte, error) {
    var result []byte
    buf := make([]byte, 1024)
    for {
        n, err := r.Read(buf)
        if n > 0 {
            result = append(result, buf[:n]...)
        }
        if err == io.EOF {
            return result, nil  // EOF is not an error
        }
        if err != nil {
            return nil, err  // Real error
        }
    }
}
```

**Q3: How does io.Copy work internally? What optimizations does it have?**

```
A3:
1. Basic flow:
   - Create a buffer (default 32KB)
   - Loop reading from src into buffer
   - Write buffer data to dst
   - Until EOF or error is encountered

2. Optimization strategies:
   - If dst implements io.ReaderFrom, directly call dst.ReadFrom(src)
   - If src implements io.WriterTo, directly call src.WriteTo(dst)
   - On Linux, may use sendfile system call for zero-copy

3. These optimizations can avoid multiple data copies between user space and kernel space
```

### Practical Coding Questions

**Q4: Implement a rate-limited Reader**

```go
package main

import (
    "io"
    "time"
)

// RateLimitedReader limits reading speed
type RateLimitedReader struct {
    reader      io.Reader
    bytesPerSec int
    lastRead    time.Time
    bytesSinceLastSleep int
}

func NewRateLimitedReader(r io.Reader, bytesPerSec int) *RateLimitedReader {
    return &RateLimitedReader{
        reader:      r,
        bytesPerSec: bytesPerSec,
        lastRead:    time.Now(),
    }
}

func (rl *RateLimitedReader) Read(p []byte) (n int, err error) {
    // Calculate maximum bytes to read
    elapsed := time.Since(rl.lastRead)
    allowedBytes := int(float64(rl.bytesPerSec) * elapsed.Seconds())

    if allowedBytes < len(p) && allowedBytes > 0 {
        p = p[:allowedBytes]
    }

    n, err = rl.reader.Read(p)

    // Calculate wait time needed
    if n > 0 {
        expectedDuration := time.Duration(float64(n) / float64(rl.bytesPerSec) * float64(time.Second))
        time.Sleep(expectedDuration)
        rl.lastRead = time.Now()
    }

    return
}
```

**Q5: How to implement a simple line counter using the io package?**

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "strings"
)

func countLines(r io.Reader) (int, error) {
    scanner := bufio.NewScanner(r)
    count := 0
    for scanner.Scan() {
        count++
    }
    return count, scanner.Err()
}

// Or using a lower-level approach
func countLinesManual(r io.Reader) (int, error) {
    buf := make([]byte, 32*1024)
    count := 0

    for {
        n, err := r.Read(buf)
        for i := 0; i < n; i++ {
            if buf[i] == '\n' {
                count++
            }
        }

        if err == io.EOF {
            return count, nil
        }
        if err != nil {
            return count, err
        }
    }
}

func main() {
    text := "line1\nline2\nline3\n"
    count, _ := countLines(strings.NewReader(text))
    fmt.Println("Line count:", count)  // Output: 3
}
```

### Design Questions

**Q6: Design a replayable Reader**

```go
package main

import (
    "bytes"
    "io"
)

// ReplayableReader supports replaying previously read data
type ReplayableReader struct {
    reader io.Reader
    buffer bytes.Buffer
    replay bool
}

func NewReplayableReader(r io.Reader) *ReplayableReader {
    return &ReplayableReader{reader: r}
}

func (rr *ReplayableReader) Read(p []byte) (n int, err error) {
    if rr.replay {
        return rr.buffer.Read(p)
    }

    n, err = rr.reader.Read(p)
    if n > 0 {
        rr.buffer.Write(p[:n])
    }
    return
}

func (rr *ReplayableReader) Replay() {
    rr.replay = true
    rr.buffer = *bytes.NewBuffer(rr.buffer.Bytes())
}

func (rr *ReplayableReader) Reset() {
    rr.replay = false
    rr.buffer.Reset()
}
```

## Further Reading

### Official Documentation

- [io package official documentation](https://pkg.go.dev/io)
- [bufio package official documentation](https://pkg.go.dev/bufio)
- [Effective Go - I/O](https://go.dev/doc/effective_go#interfaces)

### Deep Understanding

- [Go I/O source code analysis](https://github.com/golang/go/blob/master/src/io/io.go)
- [io.Copy implementation principles](https://github.com/golang/go/blob/master/src/io/io.go#L379)

### Related Packages

- **bufio**: Buffered I/O, provides Scanner, Reader, Writer
- **bytes**: I/O operations on byte slices
- **strings**: I/O operations on strings
- **os**: Operating system file I/O
- **net**: Network I/O
- **compress/gzip**: gzip compression I/O
- **encoding/json**: JSON encoding/decoding I/O

### Recommended Reading

- "The Go Programming Language" - Chapter 7: Interfaces
- "Advanced Go Programming" - Chapter 1: Language Basics
- [Go Blog: The Power of Go Interfaces](https://go.dev/doc/effective_go#interfaces)

---

> The `io` package is the core cornerstone of Go's standard library. By understanding the Reader/Writer interfaces and various composition tools, you can build efficient, composable, and testable I/O processing code. Remember: small interfaces, great power.
