---
title: HTTP/2 Deep Dive and Practice
description: Comprehensive guide to HTTP/2 in Go, covering multiplexing, server push, flow control, and performance optimization
track: foundations
section: networking
difficulty: advanced
tags:
  - Go
  - HTTP/2
  - Networking
  - Performance
  - Web
status: imported
origin: old/src/content/docs/go/http2.en.md
divergence: 0.222
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 52
  lastUpdated: 2026-01-21
---

HTTP/2 is a major revision of the HTTP protocol that provides significant performance improvements through multiplexing, header compression, and server push. Go's `net/http` package provides first-class HTTP/2 support, making it easy to build high-performance web applications.

## Concept Explanation

HTTP/2 was standardized in 2015 (RFC 7540) to address the limitations of HTTP/1.1. Key improvements include:

- **Multiplexing**: Multiple requests/responses over a single TCP connection
- **Header Compression**: HPACK compression reduces header overhead
- **Server Push**: Proactively send resources before client requests them
- **Binary Protocol**: More efficient parsing than text-based HTTP/1.1
- **Stream Prioritization**: Clients can indicate resource priorities

```go
package main

import (
    "crypto/tls"
    "fmt"
    "io"
    "log"
    "net/http"
    "time"
)

func main() {
    // Create HTTP/2 client
    client := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                InsecureSkipVerify: true, // For testing only
            },
            ForceAttemptHTTP2: true,
        },
        Timeout: 30 * time.Second,
    }

    resp, err := client.Get("https://http2.golang.org/")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    fmt.Printf("Protocol: %s\n", resp.Proto)
    fmt.Printf("Status: %s\n", resp.Status)

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("Body length: %d bytes\n", len(body))
}
```

## Core Principles

### HTTP/2 Frame Types

HTTP/2 uses a binary framing layer with different frame types:

```go
package main

import (
    "fmt"
)

// HTTP/2 Frame Types (from spec)
const (
    FrameData         = 0x0  // Carries request/response body
    FrameHeaders      = 0x1  // Carries HTTP headers
    FramePriority     = 0x2  // Specifies stream priority
    FrameRstStream    = 0x3  // Terminates a stream
    FrameSettings     = 0x4  // Configuration parameters
    FramePushPromise  = 0x5  // Server push initiation
    FramePing         = 0x6  // Connection health check
    FrameGoaway       = 0x7  // Graceful connection shutdown
    FrameWindowUpdate = 0x8  // Flow control
    FrameContinuation = 0x9  // Continues a header block
)

func main() {
    frameTypes := map[int]string{
        FrameData:         "DATA",
        FrameHeaders:      "HEADERS",
        FramePriority:     "PRIORITY",
        FrameRstStream:    "RST_STREAM",
        FrameSettings:     "SETTINGS",
        FramePushPromise:  "PUSH_PROMISE",
        FramePing:         "PING",
        FrameGoaway:       "GOAWAY",
        FrameWindowUpdate: "WINDOW_UPDATE",
        FrameContinuation: "CONTINUATION",
    }

    for id, name := range frameTypes {
        fmt.Printf("Frame Type 0x%x: %s\n", id, name)
    }
}
```

### Multiplexing

Multiple streams share a single TCP connection, eliminating head-of-line blocking:

```go
package main

import (
    "crypto/tls"
    "fmt"
    "io"
    "net/http"
    "sync"
    "time"
)

func fetchURL(client *http.Client, url string, wg *sync.WaitGroup, results chan<- string) {
    defer wg.Done()

    start := time.Now()
    resp, err := client.Get(url)
    if err != nil {
        results <- fmt.Sprintf("Error fetching %s: %v", url, err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    duration := time.Since(start)

    results <- fmt.Sprintf("%s: %d bytes in %v (Proto: %s)",
        url, len(body), duration, resp.Proto)
}

func main() {
    // Create HTTP/2-enabled client
    client := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                InsecureSkipVerify: true,
            },
            ForceAttemptHTTP2: true,
        },
    }

    urls := []string{
        "https://http2.golang.org/reqinfo",
        "https://http2.golang.org/clockstream",
        "https://http2.golang.org/gophertiles",
    }

    var wg sync.WaitGroup
    results := make(chan string, len(urls))

    // Concurrent requests over single connection
    start := time.Now()
    for _, url := range urls {
        wg.Add(1)
        go fetchURL(client, url, &wg, results)
    }

    wg.Wait()
    close(results)

    fmt.Printf("Total time: %v\n", time.Since(start))
    fmt.Println("\nResults:")
    for result := range results {
        fmt.Println(result)
    }
}
```

### Stream States

Each HTTP/2 stream goes through defined states:

```go
package main

import "fmt"

// HTTP/2 Stream States
type StreamState int

const (
    StateIdle StreamState = iota
    StateReservedLocal
    StateReservedRemote
    StateOpen
    StateHalfClosedLocal
    StateHalfClosedRemote
    StateClosed
)

func (s StreamState) String() string {
    names := []string{
        "idle",
        "reserved (local)",
        "reserved (remote)",
        "open",
        "half-closed (local)",
        "half-closed (remote)",
        "closed",
    }
    return names[s]
}

// Stream represents an HTTP/2 stream
type Stream struct {
    ID    uint32
    State StreamState
}

func (s *Stream) transition(event string) {
    oldState := s.State
    switch event {
    case "send_headers":
        if s.State == StateIdle {
            s.State = StateOpen
        }
    case "recv_headers":
        if s.State == StateIdle {
            s.State = StateOpen
        }
    case "send_end_stream":
        if s.State == StateOpen {
            s.State = StateHalfClosedLocal
        }
    case "recv_end_stream":
        if s.State == StateOpen {
            s.State = StateHalfClosedRemote
        } else if s.State == StateHalfClosedLocal {
            s.State = StateClosed
        }
    case "send_rst_stream", "recv_rst_stream":
        s.State = StateClosed
    }
    fmt.Printf("Stream %d: %s -> %s (event: %s)\n",
        s.ID, oldState, s.State, event)
}

func main() {
    stream := &Stream{ID: 1, State: StateIdle}

    // Simulate stream lifecycle
    stream.transition("send_headers")
    stream.transition("recv_headers")
    stream.transition("send_end_stream")
    stream.transition("recv_end_stream")
}
```

## Key Concepts

### HTTP/2 Server Setup

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, HTTP/2!\n")
        fmt.Fprintf(w, "Protocol: %s\n", r.Proto)
        fmt.Fprintf(w, "Method: %s\n", r.Method)
        fmt.Fprintf(w, "URL: %s\n", r.URL.Path)
    })

    mux.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
        // Simulate slow response with streaming
        flusher, ok := w.(http.Flusher)
        if !ok {
            http.Error(w, "Streaming not supported", http.StatusInternalServerError)
            return
        }

        for i := 1; i <= 5; i++ {
            fmt.Fprintf(w, "Chunk %d\n", i)
            flusher.Flush()
            time.Sleep(500 * time.Millisecond)
        }
    })

    server := &http.Server{
        Addr:         ":8443",
        Handler:      mux,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    // HTTP/2 requires TLS (or h2c for cleartext)
    log.Println("Starting HTTP/2 server on https://localhost:8443")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### Server Push

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Serve static files
    mux.HandleFunc("/style.css", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/css")
        fmt.Fprint(w, `
            body { font-family: sans-serif; margin: 40px; }
            h1 { color: #333; }
        `)
    })

    mux.HandleFunc("/script.js", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/javascript")
        fmt.Fprint(w, `console.log("Script loaded!");`)
    })

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // Try to use HTTP/2 Server Push
        pusher, ok := w.(http.Pusher)
        if ok {
            // Push resources before they're requested
            if err := pusher.Push("/style.css", nil); err != nil {
                log.Printf("Push failed for style.css: %v", err)
            }
            if err := pusher.Push("/script.js", nil); err != nil {
                log.Printf("Push failed for script.js: %v", err)
            }
            log.Println("Resources pushed successfully")
        } else {
            log.Println("Push not supported (client may be HTTP/1.1)")
        }

        w.Header().Set("Content-Type", "text/html")
        fmt.Fprint(w, `<!DOCTYPE html>
<html>
<head>
    <title>HTTP/2 Server Push Demo</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1>HTTP/2 Server Push Demo</h1>
    <p>If HTTP/2 is used, style.css and script.js were pushed before you requested them!</p>
    <script src="/script.js"></script>
</body>
</html>`)
    })

    server := &http.Server{
        Addr:    ":8443",
        Handler: mux,
    }

    log.Println("Starting server with Server Push support on https://localhost:8443")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### h2c (HTTP/2 Cleartext)

HTTP/2 without TLS, useful for internal services:

```go
package main

import (
    "fmt"
    "log"
    "net/http"

    "golang.org/x/net/http2"
    "golang.org/x/net/http2/h2c"
)

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Protocol: %s\n", r.Proto)
        fmt.Fprintf(w, "Method: %s\n", r.Method)
        fmt.Fprintf(w, "Host: %s\n", r.Host)
    })

    // Create h2c handler
    h2s := &http2.Server{}
    handler := h2c.NewHandler(mux, h2s)

    server := &http.Server{
        Addr:    ":8080",
        Handler: handler,
    }

    log.Println("Starting h2c server on http://localhost:8080")
    log.Println("Test with: curl --http2-prior-knowledge http://localhost:8080/")
    log.Fatal(server.ListenAndServe())
}
```

### Custom HTTP/2 Transport

```go
package main

import (
    "crypto/tls"
    "fmt"
    "io"
    "log"
    "net/http"
    "time"

    "golang.org/x/net/http2"
)

func main() {
    // Create custom HTTP/2 transport with tuned settings
    transport := &http2.Transport{
        // TLS configuration
        TLSClientConfig: &tls.Config{
            InsecureSkipVerify: true,
        },
        // Disable compression (useful for already compressed content)
        DisableCompression: false,
        // Allow HTTP (h2c)
        AllowHTTP: true,
        // Connection settings
        ReadIdleTimeout: 10 * time.Second,
        PingTimeout:     5 * time.Second,
        // Write buffer size
        WriteByteTimeout: 10 * time.Second,
    }

    client := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    }

    resp, err := client.Get("https://http2.golang.org/")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    fmt.Printf("Protocol: %s\n", resp.Proto)
    fmt.Printf("Status: %s\n", resp.Status)

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("Body: %d bytes\n", len(body))
}
```

## Code Examples

### Bidirectional Streaming

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "log"
    "net/http"
    "time"
)

func streamHandler(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    // Set headers for streaming
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("X-Accel-Buffering", "no")

    // Create context for client disconnect detection
    ctx := r.Context()

    for i := 1; ; i++ {
        select {
        case <-ctx.Done():
            log.Println("Client disconnected")
            return
        default:
            fmt.Fprintf(w, "data: Message %d at %s\n\n",
                i, time.Now().Format(time.RFC3339))
            flusher.Flush()
            time.Sleep(time.Second)

            if i >= 10 {
                fmt.Fprintf(w, "data: Stream complete\n\n")
                flusher.Flush()
                return
            }
        }
    }
}

func main() {
    http.HandleFunc("/stream", streamHandler)

    server := &http.Server{
        Addr:         ":8443",
        ReadTimeout:  0, // No timeout for streaming
        WriteTimeout: 0,
    }

    log.Println("Starting streaming server on https://localhost:8443")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### Connection Pool Management

```go
package main

import (
    "crypto/tls"
    "fmt"
    "io"
    "log"
    "net/http"
    "sync"
    "sync/atomic"
    "time"
)

type ConnectionStats struct {
    RequestCount int64
    Errors       int64
    TotalBytes   int64
}

func (s *ConnectionStats) AddRequest(bytes int64, err bool) {
    atomic.AddInt64(&s.RequestCount, 1)
    if err {
        atomic.AddInt64(&s.Errors, 1)
    } else {
        atomic.AddInt64(&s.TotalBytes, bytes)
    }
}

func (s *ConnectionStats) String() string {
    return fmt.Sprintf("Requests: %d, Errors: %d, Bytes: %d",
        atomic.LoadInt64(&s.RequestCount),
        atomic.LoadInt64(&s.Errors),
        atomic.LoadInt64(&s.TotalBytes))
}

func main() {
    stats := &ConnectionStats{}

    // Create transport with connection pooling
    transport := &http.Transport{
        TLSClientConfig: &tls.Config{
            InsecureSkipVerify: true,
        },
        ForceAttemptHTTP2:     true,
        MaxIdleConns:          100,
        MaxIdleConnsPerHost:   100,
        MaxConnsPerHost:       100,
        IdleConnTimeout:       90 * time.Second,
        TLSHandshakeTimeout:   10 * time.Second,
        ExpectContinueTimeout: 1 * time.Second,
    }

    client := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    }

    // Make concurrent requests
    var wg sync.WaitGroup
    numRequests := 50

    start := time.Now()
    for i := 0; i < numRequests; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()

            resp, err := client.Get("https://http2.golang.org/reqinfo")
            if err != nil {
                stats.AddRequest(0, true)
                log.Printf("Request %d failed: %v", id, err)
                return
            }
            defer resp.Body.Close()

            body, _ := io.ReadAll(resp.Body)
            stats.AddRequest(int64(len(body)), false)
        }(i)
    }

    wg.Wait()
    duration := time.Since(start)

    fmt.Printf("Completed %d requests in %v\n", numRequests, duration)
    fmt.Printf("Stats: %s\n", stats)
    fmt.Printf("Requests/sec: %.2f\n", float64(numRequests)/duration.Seconds())
}
```

### Graceful Shutdown

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync/atomic"
    "syscall"
    "time"
)

var requestCount int64

func handler(w http.ResponseWriter, r *http.Request) {
    count := atomic.AddInt64(&requestCount, 1)
    fmt.Fprintf(w, "Request #%d, Protocol: %s\n", count, r.Proto)
}

func slowHandler(w http.ResponseWriter, r *http.Request) {
    atomic.AddInt64(&requestCount, 1)
    time.Sleep(5 * time.Second)
    fmt.Fprintf(w, "Slow request completed\n")
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", handler)
    mux.HandleFunc("/slow", slowHandler)

    server := &http.Server{
        Addr:         ":8443",
        Handler:      mux,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server in goroutine
    go func() {
        log.Println("Starting server on https://localhost:8443")
        if err := server.ListenAndServeTLS("cert.pem", "key.pem"); err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")

    // Create context with timeout for shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Gracefully shutdown, waiting for active requests
    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Printf("Server stopped. Total requests served: %d", atomic.LoadInt64(&requestCount))
}
```

## Best Practices

### 1. Enable HTTP/2 Properly

```go
package main

import (
    "crypto/tls"
    "net/http"
)

func createHTTP2Server() *http.Server {
    // HTTP/2 is enabled by default for HTTPS in Go 1.6+
    // Just use ListenAndServeTLS

    tlsConfig := &tls.Config{
        MinVersion: tls.VersionTLS12,
        // ALPN negotiation for HTTP/2
        NextProtos: []string{"h2", "http/1.1"},
        // Prefer server cipher suites
        PreferServerCipherSuites: true,
    }

    return &http.Server{
        Addr:      ":443",
        TLSConfig: tlsConfig,
        // Important: don't set TLSNextProto to empty map
        // That would disable HTTP/2!
    }
}

func createHTTP2Client() *http.Client {
    return &http.Client{
        Transport: &http.Transport{
            ForceAttemptHTTP2: true,
            TLSClientConfig: &tls.Config{
                MinVersion: tls.VersionTLS12,
            },
        },
    }
}
```

### 2. Handle Server Push Correctly

```go
package main

import (
    "log"
    "net/http"
    "path/filepath"
    "strings"
)

func pushResources(w http.ResponseWriter, resources []string) {
    pusher, ok := w.(http.Pusher)
    if !ok {
        return // HTTP/1.1 or push not supported
    }

    for _, resource := range resources {
        opts := &http.PushOptions{
            Header: http.Header{
                "Accept-Encoding": []string{"gzip"},
            },
        }

        // Set appropriate content type based on extension
        ext := filepath.Ext(resource)
        switch ext {
        case ".css":
            opts.Header.Set("Content-Type", "text/css")
        case ".js":
            opts.Header.Set("Content-Type", "application/javascript")
        case ".png", ".jpg", ".jpeg", ".gif":
            // Don't push images by default - they're usually large
            continue
        }

        if err := pusher.Push(resource, opts); err != nil {
            log.Printf("Push failed for %s: %v", resource, err)
        }
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    // Only push for the main page
    if r.URL.Path == "/" && !strings.HasPrefix(r.URL.Path, "/api") {
        pushResources(w, []string{
            "/static/css/main.css",
            "/static/js/app.js",
        })
    }

    // ... rest of handler
}
```

### 3. Configure Timeouts Appropriately

```go
package main

import (
    "net/http"
    "time"

    "golang.org/x/net/http2"
)

func createConfiguredServer() *http.Server {
    h2s := &http2.Server{
        // Maximum concurrent streams per connection
        MaxConcurrentStreams: 250,
        // Maximum size of uploaded headers
        MaxUploadBufferPerConnection: 1 << 20, // 1MB
        MaxUploadBufferPerStream:     1 << 20,
        // Maximum size of frames
        MaxReadFrameSize: 1 << 20,
        // Timeouts
        IdleTimeout: 120 * time.Second,
    }

    server := &http.Server{
        Addr:         ":443",
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    // Configure HTTP/2
    http2.ConfigureServer(server, h2s)

    return server
}
```

## Common Pitfalls

### 1. Accidentally Disabling HTTP/2

```go
package main

import (
    "net/http"
)

// BAD: This disables HTTP/2!
func badServer() *http.Server {
    return &http.Server{
        Addr: ":443",
        // Empty TLSNextProto disables HTTP/2
        TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
    }
}

// GOOD: HTTP/2 enabled by default
func goodServer() *http.Server {
    return &http.Server{
        Addr: ":443",
        // Don't set TLSNextProto at all, or set it to nil
    }
}
```

### 2. Blocking Stream Processing

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

// BAD: Blocks the stream, preventing multiplexing benefits
func badHandler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(5 * time.Second) // Blocks entire handler
    fmt.Fprintf(w, "Done")
}

// GOOD: Use context for cancellation, stream data
func goodHandler(w http.ResponseWriter, r *http.Request) {
    flusher, _ := w.(http.Flusher)
    ctx := r.Context()

    for i := 0; i < 5; i++ {
        select {
        case <-ctx.Done():
            return // Client disconnected
        case <-time.After(time.Second):
            fmt.Fprintf(w, "Progress: %d/5\n", i+1)
            if flusher != nil {
                flusher.Flush()
            }
        }
    }
    fmt.Fprintf(w, "Done\n")
}
```

### 3. Ignoring Flow Control

```go
package main

import (
    "fmt"
    "net/http"
)

// BAD: May overwhelm slow clients
func badStreamHandler(w http.ResponseWriter, r *http.Request) {
    flusher, _ := w.(http.Flusher)

    // Blast data without regard for client
    for i := 0; i < 1000000; i++ {
        fmt.Fprintf(w, "Line %d: some data here\n", i)
        if i%100 == 0 {
            flusher.Flush()
        }
    }
}

// GOOD: Respect flow control, handle client disconnect
func goodStreamHandler(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    ctx := r.Context()

    for i := 0; i < 1000000; i++ {
        select {
        case <-ctx.Done():
            return // Client disconnected or cancelled
        default:
            _, err := fmt.Fprintf(w, "Line %d: some data here\n", i)
            if err != nil {
                return // Write failed (likely client issue)
            }
            if i%100 == 0 {
                flusher.Flush()
            }
        }
    }
}
```

### 4. Not Handling Push Rejection

```go
package main

import (
    "log"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    pusher, ok := w.(http.Pusher)
    if !ok {
        // HTTP/1.1 client or push disabled
        log.Println("Push not available")
    } else {
        err := pusher.Push("/resource.js", nil)
        if err != nil {
            // Push can fail for various reasons:
            // - Client has SETTINGS_ENABLE_PUSH = 0
            // - Too many concurrent pushes
            // - Resource already in cache
            log.Printf("Push rejected: %v", err)
        }
    }

    // Always serve the page, regardless of push status
    w.Header().Set("Content-Type", "text/html")
    w.Write([]byte("<html>...</html>"))
}
```

## Performance Considerations

### Measuring HTTP/2 vs HTTP/1.1

```go
package main

import (
    "crypto/tls"
    "fmt"
    "io"
    "net/http"
    "sync"
    "time"
)

func benchmark(name string, transport http.RoundTripper, urls []string, concurrent int) {
    client := &http.Client{Transport: transport}

    start := time.Now()
    var wg sync.WaitGroup
    var totalBytes int64
    var mu sync.Mutex

    for i := 0; i < concurrent; i++ {
        for _, url := range urls {
            wg.Add(1)
            go func(url string) {
                defer wg.Done()
                resp, err := client.Get(url)
                if err != nil {
                    return
                }
                defer resp.Body.Close()
                body, _ := io.ReadAll(resp.Body)
                mu.Lock()
                totalBytes += int64(len(body))
                mu.Unlock()
            }(url)
        }
    }

    wg.Wait()
    duration := time.Since(start)

    totalRequests := concurrent * len(urls)
    fmt.Printf("%s:\n", name)
    fmt.Printf("  Total requests: %d\n", totalRequests)
    fmt.Printf("  Total bytes: %d\n", totalBytes)
    fmt.Printf("  Duration: %v\n", duration)
    fmt.Printf("  Requests/sec: %.2f\n", float64(totalRequests)/duration.Seconds())
    fmt.Printf("  Throughput: %.2f MB/s\n", float64(totalBytes)/1024/1024/duration.Seconds())
    fmt.Println()
}

func main() {
    urls := []string{
        "https://http2.golang.org/reqinfo",
        "https://http2.golang.org/file/gopher.png",
    }

    // HTTP/1.1 Transport
    http1Transport := &http.Transport{
        TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
        // Disable HTTP/2
        TLSNextProto: make(map[string]func(string, *tls.Conn) http.RoundTripper),
    }

    // HTTP/2 Transport
    http2Transport := &http.Transport{
        TLSClientConfig:   &tls.Config{InsecureSkipVerify: true},
        ForceAttemptHTTP2: true,
    }

    fmt.Println("Benchmarking HTTP/1.1 vs HTTP/2")
    fmt.Println("================================")

    benchmark("HTTP/1.1", http1Transport, urls, 10)
    benchmark("HTTP/2", http2Transport, urls, 10)
}
```

### Connection Reuse Monitoring

```go
package main

import (
    "crypto/tls"
    "fmt"
    "net/http"
    "net/http/httptrace"
    "sync/atomic"
)

type ConnectionTracer struct {
    dnsStart     int64
    connStart    int64
    connReused   int64
    tlsStart     int64
    firstByte    int64
}

func (t *ConnectionTracer) trace() *httptrace.ClientTrace {
    return &httptrace.ClientTrace{
        DNSStart: func(info httptrace.DNSStartInfo) {
            atomic.AddInt64(&t.dnsStart, 1)
        },
        ConnectStart: func(network, addr string) {
            atomic.AddInt64(&t.connStart, 1)
        },
        GotConn: func(info httptrace.GotConnInfo) {
            if info.Reused {
                atomic.AddInt64(&t.connReused, 1)
            }
        },
        TLSHandshakeStart: func() {
            atomic.AddInt64(&t.tlsStart, 1)
        },
        GotFirstResponseByte: func() {
            atomic.AddInt64(&t.firstByte, 1)
        },
    }
}

func (t *ConnectionTracer) String() string {
    return fmt.Sprintf(
        "DNS: %d, ConnStart: %d, ConnReused: %d, TLS: %d, FirstByte: %d",
        atomic.LoadInt64(&t.dnsStart),
        atomic.LoadInt64(&t.connStart),
        atomic.LoadInt64(&t.connReused),
        atomic.LoadInt64(&t.tlsStart),
        atomic.LoadInt64(&t.firstByte),
    )
}

func main() {
    tracer := &ConnectionTracer{}

    transport := &http.Transport{
        TLSClientConfig:   &tls.Config{InsecureSkipVerify: true},
        ForceAttemptHTTP2: true,
    }
    client := &http.Client{Transport: transport}

    // Make multiple requests
    for i := 0; i < 10; i++ {
        req, _ := http.NewRequest("GET", "https://http2.golang.org/", nil)
        req = req.WithContext(httptrace.WithClientTrace(req.Context(), tracer.trace()))

        resp, err := client.Do(req)
        if err != nil {
            fmt.Println("Error:", err)
            continue
        }
        resp.Body.Close()
    }

    fmt.Println("Connection Statistics:")
    fmt.Println(tracer)
}
```

## Real-World Scenarios

### Load Balancer Health Check

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "sync"
    "time"

    "golang.org/x/net/http2"
)

type Backend struct {
    URL     string
    Healthy bool
    mu      sync.RWMutex
}

func (b *Backend) SetHealth(healthy bool) {
    b.mu.Lock()
    b.Healthy = healthy
    b.mu.Unlock()
}

func (b *Backend) IsHealthy() bool {
    b.mu.RLock()
    defer b.mu.RUnlock()
    return b.Healthy
}

type HealthChecker struct {
    backends []*Backend
    client   *http.Client
    interval time.Duration
}

func NewHealthChecker(backends []string, interval time.Duration) *HealthChecker {
    h2Transport := &http2.Transport{
        AllowHTTP: true,
    }

    hc := &HealthChecker{
        client: &http.Client{
            Transport: h2Transport,
            Timeout:   5 * time.Second,
        },
        interval: interval,
    }

    for _, url := range backends {
        hc.backends = append(hc.backends, &Backend{URL: url, Healthy: true})
    }

    return hc
}

func (hc *HealthChecker) checkBackend(ctx context.Context, backend *Backend) {
    req, _ := http.NewRequestWithContext(ctx, "GET", backend.URL+"/health", nil)

    resp, err := hc.client.Do(req)
    if err != nil {
        backend.SetHealth(false)
        fmt.Printf("Backend %s unhealthy: %v\n", backend.URL, err)
        return
    }
    defer resp.Body.Close()

    healthy := resp.StatusCode == http.StatusOK
    backend.SetHealth(healthy)

    status := "healthy"
    if !healthy {
        status = "unhealthy"
    }
    fmt.Printf("Backend %s is %s (HTTP/2: %v)\n",
        backend.URL, status, resp.Proto == "HTTP/2.0")
}

func (hc *HealthChecker) Start(ctx context.Context) {
    ticker := time.NewTicker(hc.interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            for _, backend := range hc.backends {
                go hc.checkBackend(ctx, backend)
            }
        }
    }
}

func (hc *HealthChecker) GetHealthyBackends() []string {
    var healthy []string
    for _, b := range hc.backends {
        if b.IsHealthy() {
            healthy = append(healthy, b.URL)
        }
    }
    return healthy
}
```

### gRPC-Web Proxy

```go
package main

import (
    "fmt"
    "io"
    "log"
    "net/http"
    "strings"
)

// Simple gRPC-Web proxy over HTTP/2
func grpcWebProxy(w http.ResponseWriter, r *http.Request) {
    // Check for gRPC-Web content type
    contentType := r.Header.Get("Content-Type")
    if !strings.HasPrefix(contentType, "application/grpc-web") {
        http.Error(w, "Invalid content type", http.StatusBadRequest)
        return
    }

    // Log the request
    fmt.Printf("gRPC-Web request: %s %s\n", r.Method, r.URL.Path)
    fmt.Printf("Protocol: %s\n", r.Proto)

    // Set response headers
    w.Header().Set("Content-Type", "application/grpc-web+proto")
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, x-grpc-web")

    // Handle preflight
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    // Read request body
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Failed to read body", http.StatusInternalServerError)
        return
    }

    fmt.Printf("Request body: %d bytes\n", len(body))

    // In a real proxy, forward to gRPC backend
    // For demo, return mock response
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("mock-grpc-response"))
}

func main() {
    http.HandleFunc("/", grpcWebProxy)

    server := &http.Server{
        Addr: ":8443",
    }

    log.Println("Starting gRPC-Web proxy on https://localhost:8443")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

## Interview Key Points

1. **HTTP/2 vs HTTP/1.1**:
   - Multiplexing: multiple streams over single connection
   - Header compression: HPACK algorithm
   - Server push: proactive resource delivery
   - Binary protocol: more efficient parsing

2. **Go HTTP/2 support**:
   - Enabled by default for HTTPS (Go 1.6+)
   - Use `ForceAttemptHTTP2: true` in Transport
   - h2c requires `golang.org/x/net/http2/h2c`

3. **Server Push**:
   - Use `http.Pusher` interface
   - Check if available before pushing
   - Handle push rejection gracefully
   - Don't push large resources

4. **Flow control**:
   - Stream-level and connection-level windows
   - WINDOW_UPDATE frames for control
   - Prevents overwhelming slow clients

5. **Common issues**:
   - Empty TLSNextProto disables HTTP/2
   - Timeouts need adjustment for streaming
   - Context cancellation for cleanup

## Further Reading

- [Go Documentation: net/http](https://pkg.go.dev/net/http)
- [HTTP/2 RFC 7540](https://tools.ietf.org/html/rfc7540)
- [HPACK RFC 7541](https://tools.ietf.org/html/rfc7541)
- [Go HTTP/2 Demo Server](https://http2.golang.org/)
- [golang.org/x/net/http2](https://pkg.go.dev/golang.org/x/net/http2)
- [HTTP/2 in Action (Book)](https://www.manning.com/books/http2-in-action)
