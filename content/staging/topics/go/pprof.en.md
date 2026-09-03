---
title: pprof Profiling
description: Complete guide to Go pprof, CPU profiling, memory profiling and performance optimization
track: go
section: services-tooling
difficulty: advanced
tags:
  - Go
  - pprof
  - Performance
  - Profiling
status: imported
origin: old/src/content/docs/go/pprof.en.md
divergence: 0.422
issues:
  - divergent
legacy:
  category: Go
  subcategory: Performance
  order: 11
  lastUpdated: 2026-01-07
---

pprof is Go's built-in profiling tool that helps developers identify performance bottlenecks, memory leaks, and concurrency issues. This comprehensive guide covers all aspects of profiling Go applications, from basic CPU profiling to advanced analysis techniques.

## Introduction to pprof

pprof is a tool for visualization and analysis of profiling data. Go provides two main packages for profiling:

- `runtime/pprof`: For writing profiling data to files
- `net/http/pprof`: For exposing profiling data via HTTP endpoints

### Profile Types

Go supports several types of profiles:

| Profile Type | Description |
|-------------|-------------|
| CPU | Shows where CPU time is spent |
| Heap | Shows memory allocations |
| Goroutine | Shows all current goroutines |
| Block | Shows where goroutines block waiting |
| Mutex | Shows mutex contention |
| Threadcreate | Shows OS thread creation |

## CPU Profiling

CPU profiling helps identify functions that consume the most CPU time. The profiler samples the call stack at regular intervals (default: 100 times per second).

### Programmatic CPU Profiling

```go
package main

import (
    "log"
    "os"
    "runtime/pprof"
)

func main() {
    // Create CPU profile file
    f, err := os.Create("cpu.prof")
    if err != nil {
        log.Fatal("could not create CPU profile: ", err)
    }
    defer f.Close()

    // Start CPU profiling
    if err := pprof.StartCPUProfile(f); err != nil {
        log.Fatal("could not start CPU profile: ", err)
    }
    defer pprof.StopCPUProfile()

    // Your application code here
    runExpensiveOperation()
}

func runExpensiveOperation() {
    // Simulate CPU-intensive work
    result := 0
    for i := 0; i < 100000000; i++ {
        result += i * i
    }
}
```

### CPU Profiling in Tests

Go's testing package has built-in support for CPU profiling:

```bash
# Run tests with CPU profiling
go test -cpuprofile=cpu.prof -bench=.

# Analyze the profile
go tool pprof cpu.prof
```

### Example: Identifying CPU Hotspots

```go
package main

import (
    "crypto/sha256"
    "os"
    "runtime/pprof"
)

func main() {
    f, _ := os.Create("cpu.prof")
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()

    // Inefficient: creates many allocations
    inefficientHash()

    // Efficient: reuses buffer
    efficientHash()
}

func inefficientHash() {
    for i := 0; i < 100000; i++ {
        data := make([]byte, 1024)
        sha256.Sum256(data)
    }
}

func efficientHash() {
    data := make([]byte, 1024)
    for i := 0; i < 100000; i++ {
        sha256.Sum256(data)
    }
}
```

## Memory Profiling

Memory profiling tracks heap allocations and helps identify memory leaks and excessive allocations.

### Heap Profile Types

- `alloc_objects`: Total number of objects allocated
- `alloc_space`: Total bytes allocated
- `inuse_objects`: Objects currently in use
- `inuse_space`: Bytes currently in use

### Programmatic Memory Profiling

```go
package main

import (
    "log"
    "os"
    "runtime"
    "runtime/pprof"
)

func main() {
    // Run your application logic
    allocateMemory()

    // Force garbage collection for accurate results
    runtime.GC()

    // Create memory profile file
    f, err := os.Create("mem.prof")
    if err != nil {
        log.Fatal("could not create memory profile: ", err)
    }
    defer f.Close()

    // Write heap profile
    if err := pprof.WriteHeapProfile(f); err != nil {
        log.Fatal("could not write memory profile: ", err)
    }
}

func allocateMemory() {
    // This will show up in the memory profile
    data := make([][]byte, 1000)
    for i := range data {
        data[i] = make([]byte, 10000)
    }
    _ = data
}
```

### Memory Profiling in Tests

```bash
# Run tests with memory profiling
go test -memprofile=mem.prof -bench=.

# Analyze allocations
go tool pprof -alloc_space mem.prof

# Analyze currently in-use memory
go tool pprof -inuse_space mem.prof
```

### Example: Detecting Memory Leaks

```go
package main

import (
    "net/http"
    _ "net/http/pprof"
    "time"
)

var leakyCache = make(map[string][]byte)

func main() {
    go func() {
        http.ListenAndServe(":6060", nil)
    }()

    // Simulate a memory leak
    for i := 0; ; i++ {
        key := time.Now().String()
        leakyCache[key] = make([]byte, 1024*1024) // 1MB per entry
        time.Sleep(100 * time.Millisecond)
    }
}
```

To detect the leak:

```bash
# Take heap profile
curl -o heap1.prof http://localhost:6060/debug/pprof/heap

# Wait and take another
sleep 30
curl -o heap2.prof http://localhost:6060/debug/pprof/heap

# Compare profiles
go tool pprof -base=heap1.prof heap2.prof
```

## Goroutine Profiling

Goroutine profiling shows all running goroutines and their stack traces, useful for detecting goroutine leaks and deadlocks.

### Capturing Goroutine Profile

```go
package main

import (
    "log"
    "os"
    "runtime/pprof"
    "sync"
    "time"
)

func main() {
    // Create some goroutines
    var wg sync.WaitGroup
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            time.Sleep(5 * time.Second)
        }(i)
    }

    // Give goroutines time to start
    time.Sleep(100 * time.Millisecond)

    // Write goroutine profile
    f, err := os.Create("goroutine.prof")
    if err != nil {
        log.Fatal(err)
    }
    defer f.Close()

    if err := pprof.Lookup("goroutine").WriteTo(f, 1); err != nil {
        log.Fatal(err)
    }

    wg.Wait()
}
```

### Detecting Goroutine Leaks

```go
package main

import (
    "fmt"
    "net/http"
    _ "net/http/pprof"
    "runtime"
    "time"
)

func leakyFunction() {
    ch := make(chan int)
    go func() {
        // This goroutine will never exit because
        // nobody sends to or closes the channel
        val := <-ch
        fmt.Println(val)
    }()
    // Function returns, but goroutine is stuck
}

func main() {
    go func() {
        http.ListenAndServe(":6060", nil)
    }()

    for {
        leakyFunction()
        fmt.Printf("Goroutines: %d\n", runtime.NumGoroutine())
        time.Sleep(100 * time.Millisecond)
    }
}
```

Access `http://localhost:6060/debug/pprof/goroutine?debug=1` to see all goroutines in plain text.

## Block Profiling

Block profiling shows where goroutines block waiting on synchronization primitives like channels and mutexes.

### Enabling Block Profiling

```go
package main

import (
    "log"
    "os"
    "runtime"
    "runtime/pprof"
    "sync"
    "time"
)

func main() {
    // Enable block profiling
    // Parameter is the sampling rate (1 = 100%)
    runtime.SetBlockProfileRate(1)

    var mu sync.Mutex
    var wg sync.WaitGroup

    // Create contention
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := 0; j < 100; j++ {
                mu.Lock()
                time.Sleep(time.Millisecond)
                mu.Unlock()
            }
        }()
    }

    wg.Wait()

    // Write block profile
    f, err := os.Create("block.prof")
    if err != nil {
        log.Fatal(err)
    }
    defer f.Close()

    if err := pprof.Lookup("block").WriteTo(f, 0); err != nil {
        log.Fatal(err)
    }
}
```

### Analyzing Channel Blocking

```go
package main

import (
    "log"
    "os"
    "runtime"
    "runtime/pprof"
    "time"
)

func main() {
    runtime.SetBlockProfileRate(1)

    ch := make(chan int) // Unbuffered channel

    go func() {
        for i := 0; i < 100; i++ {
            ch <- i // Blocks until receiver is ready
            time.Sleep(10 * time.Millisecond)
        }
        close(ch)
    }()

    for range ch {
        time.Sleep(50 * time.Millisecond) // Slow consumer
    }

    f, _ := os.Create("block.prof")
    defer f.Close()
    pprof.Lookup("block").WriteTo(f, 0)

    log.Println("Block profile written to block.prof")
}
```

## Mutex Profiling

Mutex profiling specifically tracks mutex contention, showing where goroutines wait to acquire locks.

### Enabling Mutex Profiling

```go
package main

import (
    "log"
    "os"
    "runtime"
    "runtime/pprof"
    "sync"
)

func main() {
    // Enable mutex profiling
    // Parameter is the sampling rate (1 = 100%)
    runtime.SetMutexProfileFraction(1)

    var mu sync.Mutex
    var counter int
    var wg sync.WaitGroup

    // Create high mutex contention
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := 0; j < 10000; j++ {
                mu.Lock()
                counter++
                mu.Unlock()
            }
        }()
    }

    wg.Wait()

    // Write mutex profile
    f, err := os.Create("mutex.prof")
    if err != nil {
        log.Fatal(err)
    }
    defer f.Close()

    if err := pprof.Lookup("mutex").WriteTo(f, 0); err != nil {
        log.Fatal(err)
    }

    log.Printf("Final counter: %d\n", counter)
}
```

## Using net/http/pprof

The `net/http/pprof` package provides HTTP endpoints for profiling running applications, essential for production debugging.

### Basic Setup

```go
package main

import (
    "log"
    "net/http"
    _ "net/http/pprof" // Import for side effects
)

func main() {
    // pprof endpoints are automatically registered
    // at /debug/pprof/

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, World!"))
    })

    log.Println("Server starting on :8080")
    log.Println("pprof available at http://localhost:8080/debug/pprof/")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `/debug/pprof/` | Index page with links to all profiles |
| `/debug/pprof/profile` | CPU profile (30s default) |
| `/debug/pprof/heap` | Heap memory profile |
| `/debug/pprof/goroutine` | Goroutine profile |
| `/debug/pprof/block` | Block profile |
| `/debug/pprof/mutex` | Mutex profile |
| `/debug/pprof/trace` | Execution trace |
| `/debug/pprof/threadcreate` | Thread creation profile |

### Custom Mux Setup

For applications using custom routers:

```go
package main

import (
    "net/http"
    "net/http/pprof"
)

func main() {
    mux := http.NewServeMux()

    // Your application routes
    mux.HandleFunc("/", homeHandler)

    // Manually register pprof handlers
    mux.HandleFunc("/debug/pprof/", pprof.Index)
    mux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
    mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
    mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
    mux.HandleFunc("/debug/pprof/trace", pprof.Trace)

    http.ListenAndServe(":8080", mux)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Home"))
}
```

### Securing pprof Endpoints

In production, protect pprof endpoints:

```go
package main

import (
    "net/http"
    "net/http/pprof"
    "strings"
)

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Check for authentication
        token := r.Header.Get("X-Debug-Token")
        if token != "your-secret-token" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next(w, r)
    }
}

func main() {
    mux := http.NewServeMux()

    // Protected pprof endpoints
    mux.HandleFunc("/debug/pprof/", authMiddleware(pprof.Index))
    mux.HandleFunc("/debug/pprof/profile", authMiddleware(pprof.Profile))
    // ... register other endpoints

    // Alternative: Run on separate port
    go func() {
        debugMux := http.NewServeMux()
        debugMux.HandleFunc("/debug/pprof/", pprof.Index)
        debugMux.HandleFunc("/debug/pprof/profile", pprof.Profile)
        // Listen only on localhost
        http.ListenAndServe("127.0.0.1:6060", debugMux)
    }()

    http.ListenAndServe(":8080", mux)
}
```

## Analyzing Profiles

### Using go tool pprof

The `go tool pprof` command provides an interactive shell for analyzing profiles.

```bash
# Analyze a profile file
go tool pprof cpu.prof

# Analyze from HTTP endpoint
go tool pprof http://localhost:6060/debug/pprof/profile

# Analyze with binary for better symbol resolution
go tool pprof ./myapp cpu.prof
```

### Common pprof Commands

```bash
# Inside pprof interactive mode:

# Show top functions by CPU/memory usage
(pprof) top
(pprof) top 20          # Show top 20
(pprof) top -cum        # Sort by cumulative time

# Show function details
(pprof) list functionName
(pprof) list main.processData

# Show call graph
(pprof) web             # Open in browser
(pprof) svg > out.svg   # Save as SVG
(pprof) png > out.png   # Save as PNG

# Filter by function
(pprof) focus functionName
(pprof) ignore functionName

# Show source with annotations
(pprof) weblist functionName

# Disassembly view
(pprof) disasm functionName
```

### Understanding pprof Output

```
(pprof) top
Showing nodes accounting for 4.5s, 90% of 5s total
      flat  flat%   sum%        cum   cum%
      2.5s 50.00% 50.00%       2.5s 50.00%  main.computeHash
      1.2s 24.00% 74.00%       3.7s 74.00%  main.processData
      0.5s 10.00% 84.00%       0.5s 10.00%  runtime.mallocgc
      0.3s  6.00% 90.00%       4.0s 80.00%  main.handleRequest
```

- **flat**: Time spent in the function itself
- **cum**: Cumulative time (including called functions)
- **sum%**: Running sum of flat percentages

### Comparing Profiles

```bash
# Compare two profiles
go tool pprof -base=old.prof new.prof

# Inside pprof:
(pprof) top
# Shows differences between profiles
```

## Flame Graphs

Flame graphs provide an intuitive visualization of where time is spent in your application.

### Generating Flame Graphs with pprof

Modern versions of Go's pprof support flame graphs directly:

```bash
# Generate and open flame graph in browser
go tool pprof -http=:8081 cpu.prof

# Navigate to "Flame Graph" view in the web UI
```

### Using go-torch (Legacy)

For older Go versions:

```bash
# Install go-torch
go install github.com/uber/go-torch@latest

# Generate flame graph
go-torch --file=torch.svg cpu.prof

# From HTTP endpoint
go-torch --url http://localhost:6060/debug/pprof/profile
```

### Reading Flame Graphs

- **X-axis**: Stack depth (not time!)
- **Y-axis**: Function call hierarchy
- **Width**: Proportional to time spent
- **Colors**: Random (used only for differentiation)

Tips for reading:
- Wide boxes indicate hot spots
- Look for unexpected wide boxes
- Deep stacks may indicate excessive recursion

### Practical Example: Finding Performance Issues

```go
package main

import (
    "crypto/md5"
    "encoding/hex"
    "net/http"
    _ "net/http/pprof"
    "strings"
)

func main() {
    http.HandleFunc("/hash", hashHandler)
    http.ListenAndServe(":8080", nil)
}

func hashHandler(w http.ResponseWriter, r *http.Request) {
    data := r.URL.Query().Get("data")

    // Inefficient: multiple string concatenations
    result := ""
    for i := 0; i < 1000; i++ {
        hash := md5.Sum([]byte(data))
        result = result + hex.EncodeToString(hash[:]) // Slow!
    }

    w.Write([]byte(result))
}

// Improved version
func hashHandlerOptimized(w http.ResponseWriter, r *http.Request) {
    data := r.URL.Query().Get("data")

    // Use strings.Builder for efficient concatenation
    var builder strings.Builder
    for i := 0; i < 1000; i++ {
        hash := md5.Sum([]byte(data))
        builder.WriteString(hex.EncodeToString(hash[:]))
    }

    w.Write([]byte(builder.String()))
}
```

Profile and visualize:

```bash
# Generate load
hey -n 1000 "http://localhost:8080/hash?data=test"

# Capture CPU profile
curl -o cpu.prof "http://localhost:8080/debug/pprof/profile?seconds=30"

# Analyze with flame graph
go tool pprof -http=:8081 cpu.prof
```

## Best Practices

### Profile in Production-like Environments

```go
// Use build tags for profiling code
// +build profile

package main

import (
    "net/http"
    _ "net/http/pprof"
)

func init() {
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()
}
```

Build with: `go build -tags profile`

### Set Appropriate Sampling Rates

```go
import "runtime"

func configureProfiling() {
    // CPU profiling: default is fine for most cases

    // Memory profiling: sample rate (default: 512KB)
    runtime.MemProfileRate = 512 * 1024

    // Block profiling: enable with reasonable rate
    runtime.SetBlockProfileRate(10000) // Nanoseconds

    // Mutex profiling: sample fraction
    runtime.SetMutexProfileFraction(100) // 1 in 100 events
}
```

### Profile Specific Code Sections

```go
package main

import (
    "os"
    "runtime/pprof"
)

func profiledFunction() {
    // Start CPU profile for this section only
    f, _ := os.Create("section.prof")
    pprof.StartCPUProfile(f)

    // Critical section to profile
    expensiveOperation()

    pprof.StopCPUProfile()
    f.Close()
}
```

### Create Custom Profiles

```go
package main

import (
    "runtime/pprof"
)

var customProfile = pprof.NewProfile("custom.requests")

func trackRequest(id string) {
    customProfile.Add(id, 1)
}

func completeRequest(id string) {
    customProfile.Remove(id)
}

// Access via: /debug/pprof/custom.requests
```

### Continuous Profiling in Production

```go
package main

import (
    "log"
    "os"
    "runtime/pprof"
    "time"
)

func continuousProfiling() {
    ticker := time.NewTicker(1 * time.Hour)

    for range ticker.C {
        // CPU profile
        cpuFile, _ := os.Create(
            time.Now().Format("cpu-2006-01-02-15-04-05.prof"),
        )
        pprof.StartCPUProfile(cpuFile)
        time.Sleep(30 * time.Second)
        pprof.StopCPUProfile()
        cpuFile.Close()

        // Heap profile
        heapFile, _ := os.Create(
            time.Now().Format("heap-2006-01-02-15-04-05.prof"),
        )
        pprof.WriteHeapProfile(heapFile)
        heapFile.Close()

        log.Println("Profiles captured")
    }
}
```

### Benchmark Before and After

```go
package main

import "testing"

func BenchmarkOriginal(b *testing.B) {
    for i := 0; i < b.N; i++ {
        originalFunction()
    }
}

func BenchmarkOptimized(b *testing.B) {
    for i := 0; i < b.N; i++ {
        optimizedFunction()
    }
}
```

Run with profiling:

```bash
go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof -benchmem
```

## Quick Reference

### Common Commands

```bash
# CPU profiling
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Memory profiling
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine dump
curl http://localhost:6060/debug/pprof/goroutine?debug=2

# Start web UI
go tool pprof -http=:8081 profile.prof

# Compare profiles
go tool pprof -diff_base=old.prof new.prof
```

### Profile Collection Script

```bash
#!/bin/bash
# collect-profiles.sh

HOST=${1:-localhost:6060}
DURATION=${2:-30}
OUTPUT_DIR=${3:-.}

echo "Collecting profiles from $HOST..."

# CPU profile
curl -o "$OUTPUT_DIR/cpu.prof" \
    "http://$HOST/debug/pprof/profile?seconds=$DURATION"

# Heap profile
curl -o "$OUTPUT_DIR/heap.prof" \
    "http://$HOST/debug/pprof/heap"

# Goroutine profile
curl -o "$OUTPUT_DIR/goroutine.prof" \
    "http://$HOST/debug/pprof/goroutine"

# Block profile
curl -o "$OUTPUT_DIR/block.prof" \
    "http://$HOST/debug/pprof/block"

# Mutex profile
curl -o "$OUTPUT_DIR/mutex.prof" \
    "http://$HOST/debug/pprof/mutex"

echo "Profiles saved to $OUTPUT_DIR"
```

## Conclusion

Profiling is an essential skill for Go developers. The pprof tools provide powerful capabilities for understanding application performance. Key takeaways:

1. **Profile before optimizing** - Don't guess where problems are
2. **Use the right profile type** - CPU, memory, goroutine, block, or mutex
3. **Profile in realistic conditions** - Production-like data and load
4. **Compare before and after** - Verify optimizations work
5. **Use flame graphs** - Visual analysis is often faster
6. **Secure production endpoints** - Don't expose pprof publicly
7. **Automate profiling** - Set up continuous profiling for production

With these tools and techniques, you can identify and resolve performance issues in your Go applications effectively.
