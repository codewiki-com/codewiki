---
title: HTTP/2 详解与实践
description: Go 语言 HTTP/2 完全指南，涵盖多路复用、服务器推送、流量控制和性能优化
track: foundations
section: networking
difficulty: advanced
tags:
  - Go
  - HTTP/2
  - 网络
  - 性能
  - Web
status: imported
origin: old/src/content/docs/go/http2.zh.md
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

HTTP/2 是 HTTP 协议的重大修订版本，通过多路复用、头部压缩和服务器推送提供了显著的性能改进。Go 的 `net/http` 包提供了一流的 HTTP/2 支持，使构建高性能 Web 应用变得简单。

## 概念解释

HTTP/2 于 2015 年标准化（RFC 7540），旨在解决 HTTP/1.1 的局限性。主要改进包括：

- **多路复用**：单个 TCP 连接上的多个请求/响应
- **头部压缩**：HPACK 压缩减少头部开销
- **服务器推送**：在客户端请求之前主动发送资源
- **二进制协议**：比基于文本的 HTTP/1.1 解析更高效
- **流优先级**：客户端可以指示资源优先级

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
    // 创建 HTTP/2 客户端
    client := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                InsecureSkipVerify: true, // 仅用于测试
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

    fmt.Printf("协议: %s\n", resp.Proto)
    fmt.Printf("状态: %s\n", resp.Status)

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("响应体长度: %d 字节\n", len(body))
}
```

## 核心原理

### HTTP/2 帧类型

HTTP/2 使用二进制帧层，包含不同的帧类型：

```go
package main

import (
    "fmt"
)

// HTTP/2 帧类型（来自规范）
const (
    FrameData         = 0x0  // 承载请求/响应体
    FrameHeaders      = 0x1  // 承载 HTTP 头部
    FramePriority     = 0x2  // 指定流优先级
    FrameRstStream    = 0x3  // 终止流
    FrameSettings     = 0x4  // 配置参数
    FramePushPromise  = 0x5  // 服务器推送初始化
    FramePing         = 0x6  // 连接健康检查
    FrameGoaway       = 0x7  // 优雅关闭连接
    FrameWindowUpdate = 0x8  // 流量控制
    FrameContinuation = 0x9  // 继续头部块
)

func main() {
    frameTypes := map[int]string{
        FrameData:         "DATA（数据）",
        FrameHeaders:      "HEADERS（头部）",
        FramePriority:     "PRIORITY（优先级）",
        FrameRstStream:    "RST_STREAM（重置流）",
        FrameSettings:     "SETTINGS（设置）",
        FramePushPromise:  "PUSH_PROMISE（推送承诺）",
        FramePing:         "PING（心跳）",
        FrameGoaway:       "GOAWAY（离开）",
        FrameWindowUpdate: "WINDOW_UPDATE（窗口更新）",
        FrameContinuation: "CONTINUATION（继续）",
    }

    for id, name := range frameTypes {
        fmt.Printf("帧类型 0x%x: %s\n", id, name)
    }
}
```

### 多路复用

多个流共享单个 TCP 连接，消除了队头阻塞：

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
        results <- fmt.Sprintf("获取 %s 错误: %v", url, err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    duration := time.Since(start)

    results <- fmt.Sprintf("%s: %d 字节用时 %v（协议: %s）",
        url, len(body), duration, resp.Proto)
}

func main() {
    // 创建支持 HTTP/2 的客户端
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

    // 通过单个连接并发请求
    start := time.Now()
    for _, url := range urls {
        wg.Add(1)
        go fetchURL(client, url, &wg, results)
    }

    wg.Wait()
    close(results)

    fmt.Printf("总耗时: %v\n", time.Since(start))
    fmt.Println("\n结果:")
    for result := range results {
        fmt.Println(result)
    }
}
```

### 流状态

每个 HTTP/2 流都经历定义的状态：

```go
package main

import "fmt"

// HTTP/2 流状态
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
        "空闲",
        "本地保留",
        "远程保留",
        "打开",
        "本地半关闭",
        "远程半关闭",
        "关闭",
    }
    return names[s]
}

// Stream 表示一个 HTTP/2 流
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
    fmt.Printf("流 %d: %s -> %s（事件: %s）\n",
        s.ID, oldState, s.State, event)
}

func main() {
    stream := &Stream{ID: 1, State: StateIdle}

    // 模拟流生命周期
    stream.transition("send_headers")
    stream.transition("recv_headers")
    stream.transition("send_end_stream")
    stream.transition("recv_end_stream")
}
```

## 核心要点

### HTTP/2 服务器设置

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
        fmt.Fprintf(w, "你好，HTTP/2！\n")
        fmt.Fprintf(w, "协议: %s\n", r.Proto)
        fmt.Fprintf(w, "方法: %s\n", r.Method)
        fmt.Fprintf(w, "URL: %s\n", r.URL.Path)
    })

    mux.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
        // 模拟带流式传输的慢响应
        flusher, ok := w.(http.Flusher)
        if !ok {
            http.Error(w, "不支持流式传输", http.StatusInternalServerError)
            return
        }

        for i := 1; i <= 5; i++ {
            fmt.Fprintf(w, "分块 %d\n", i)
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

    // HTTP/2 需要 TLS（或用于明文的 h2c）
    log.Println("在 https://localhost:8443 启动 HTTP/2 服务器")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### 服务器推送

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // 提供静态文件
    mux.HandleFunc("/style.css", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/css")
        fmt.Fprint(w, `
            body { font-family: sans-serif; margin: 40px; }
            h1 { color: #333; }
        `)
    })

    mux.HandleFunc("/script.js", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/javascript")
        fmt.Fprint(w, `console.log("脚本已加载！");`)
    })

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // 尝试使用 HTTP/2 服务器推送
        pusher, ok := w.(http.Pusher)
        if ok {
            // 在请求之前推送资源
            if err := pusher.Push("/style.css", nil); err != nil {
                log.Printf("推送 style.css 失败: %v", err)
            }
            if err := pusher.Push("/script.js", nil); err != nil {
                log.Printf("推送 script.js 失败: %v", err)
            }
            log.Println("资源推送成功")
        } else {
            log.Println("不支持推送（客户端可能是 HTTP/1.1）")
        }

        w.Header().Set("Content-Type", "text/html")
        fmt.Fprint(w, `<!DOCTYPE html>
<html>
<head>
    <title>HTTP/2 服务器推送演示</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <h1>HTTP/2 服务器推送演示</h1>
    <p>如果使用 HTTP/2，style.css 和 script.js 在你请求之前就已经推送了！</p>
    <script src="/script.js"></script>
</body>
</html>`)
    })

    server := &http.Server{
        Addr:    ":8443",
        Handler: mux,
    }

    log.Println("在 https://localhost:8443 启动支持服务器推送的服务器")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### h2c（HTTP/2 明文）

无需 TLS 的 HTTP/2，适用于内部服务：

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
        fmt.Fprintf(w, "协议: %s\n", r.Proto)
        fmt.Fprintf(w, "方法: %s\n", r.Method)
        fmt.Fprintf(w, "主机: %s\n", r.Host)
    })

    // 创建 h2c 处理器
    h2s := &http2.Server{}
    handler := h2c.NewHandler(mux, h2s)

    server := &http.Server{
        Addr:    ":8080",
        Handler: handler,
    }

    log.Println("在 http://localhost:8080 启动 h2c 服务器")
    log.Println("测试命令: curl --http2-prior-knowledge http://localhost:8080/")
    log.Fatal(server.ListenAndServe())
}
```

### 自定义 HTTP/2 Transport

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
    // 创建带调优设置的自定义 HTTP/2 transport
    transport := &http2.Transport{
        // TLS 配置
        TLSClientConfig: &tls.Config{
            InsecureSkipVerify: true,
        },
        // 禁用压缩（对已压缩内容有用）
        DisableCompression: false,
        // 允许 HTTP（h2c）
        AllowHTTP: true,
        // 连接设置
        ReadIdleTimeout: 10 * time.Second,
        PingTimeout:     5 * time.Second,
        // 写缓冲区大小
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

    fmt.Printf("协议: %s\n", resp.Proto)
    fmt.Printf("状态: %s\n", resp.Status)

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("响应体: %d 字节\n", len(body))
}
```

## 代码示例

### 双向流式传输

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
        http.Error(w, "不支持流式传输", http.StatusInternalServerError)
        return
    }

    // 设置流式传输的头部
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("X-Accel-Buffering", "no")

    // 创建用于检测客户端断开的 context
    ctx := r.Context()

    for i := 1; ; i++ {
        select {
        case <-ctx.Done():
            log.Println("客户端已断开")
            return
        default:
            fmt.Fprintf(w, "data: 消息 %d 于 %s\n\n",
                i, time.Now().Format(time.RFC3339))
            flusher.Flush()
            time.Sleep(time.Second)

            if i >= 10 {
                fmt.Fprintf(w, "data: 流式传输完成\n\n")
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
        ReadTimeout:  0, // 流式传输无超时
        WriteTimeout: 0,
    }

    log.Println("在 https://localhost:8443 启动流式服务器")
    log.Fatal(server.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### 连接池管理

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
    return fmt.Sprintf("请求数: %d, 错误数: %d, 字节数: %d",
        atomic.LoadInt64(&s.RequestCount),
        atomic.LoadInt64(&s.Errors),
        atomic.LoadInt64(&s.TotalBytes))
}

func main() {
    stats := &ConnectionStats{}

    // 创建带连接池的 transport
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

    // 发起并发请求
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
                log.Printf("请求 %d 失败: %v", id, err)
                return
            }
            defer resp.Body.Close()

            body, _ := io.ReadAll(resp.Body)
            stats.AddRequest(int64(len(body)), false)
        }(i)
    }

    wg.Wait()
    duration := time.Since(start)

    fmt.Printf("在 %v 内完成 %d 个请求\n", duration, numRequests)
    fmt.Printf("统计: %s\n", stats)
    fmt.Printf("请求/秒: %.2f\n", float64(numRequests)/duration.Seconds())
}
```

### 优雅关闭

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
    fmt.Fprintf(w, "请求 #%d，协议: %s\n", count, r.Proto)
}

func slowHandler(w http.ResponseWriter, r *http.Request) {
    atomic.AddInt64(&requestCount, 1)
    time.Sleep(5 * time.Second)
    fmt.Fprintf(w, "慢请求已完成\n")
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

    // 在 goroutine 中启动服务器
    go func() {
        log.Println("在 https://localhost:8443 启动服务器")
        if err := server.ListenAndServeTLS("cert.pem", "key.pem"); err != http.ErrServerClosed {
            log.Fatalf("服务器错误: %v", err)
        }
    }()

    // 等待中断信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("正在关闭服务器...")

    // 创建带超时的关闭 context
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // 优雅关闭，等待活动请求完成
    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("服务器被强制关闭: %v", err)
    }

    log.Printf("服务器已停止。总共处理请求数: %d", atomic.LoadInt64(&requestCount))
}
```

## 最佳实践

### 1. 正确启用 HTTP/2

```go
package main

import (
    "crypto/tls"
    "net/http"
)

func createHTTP2Server() *http.Server {
    // Go 1.6+ 默认为 HTTPS 启用 HTTP/2
    // 只需使用 ListenAndServeTLS

    tlsConfig := &tls.Config{
        MinVersion: tls.VersionTLS12,
        // HTTP/2 的 ALPN 协商
        NextProtos: []string{"h2", "http/1.1"},
        // 优先使用服务器密码套件
        PreferServerCipherSuites: true,
    }

    return &http.Server{
        Addr:      ":443",
        TLSConfig: tlsConfig,
        // 重要：不要将 TLSNextProto 设置为空 map
        // 那会禁用 HTTP/2！
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

### 2. 正确处理服务器推送

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
        return // HTTP/1.1 或不支持推送
    }

    for _, resource := range resources {
        opts := &http.PushOptions{
            Header: http.Header{
                "Accept-Encoding": []string{"gzip"},
            },
        }

        // 根据扩展名设置适当的内容类型
        ext := filepath.Ext(resource)
        switch ext {
        case ".css":
            opts.Header.Set("Content-Type", "text/css")
        case ".js":
            opts.Header.Set("Content-Type", "application/javascript")
        case ".png", ".jpg", ".jpeg", ".gif":
            // 默认不推送图片 - 通常很大
            continue
        }

        if err := pusher.Push(resource, opts); err != nil {
            log.Printf("推送 %s 失败: %v", resource, err)
        }
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    // 只为主页面推送
    if r.URL.Path == "/" && !strings.HasPrefix(r.URL.Path, "/api") {
        pushResources(w, []string{
            "/static/css/main.css",
            "/static/js/app.js",
        })
    }

    // ... 处理器的其余部分
}
```

### 3. 适当配置超时

```go
package main

import (
    "net/http"
    "time"

    "golang.org/x/net/http2"
)

func createConfiguredServer() *http.Server {
    h2s := &http2.Server{
        // 每个连接的最大并发流数
        MaxConcurrentStreams: 250,
        // 上传头部的最大大小
        MaxUploadBufferPerConnection: 1 << 20, // 1MB
        MaxUploadBufferPerStream:     1 << 20,
        // 帧的最大大小
        MaxReadFrameSize: 1 << 20,
        // 超时
        IdleTimeout: 120 * time.Second,
    }

    server := &http.Server{
        Addr:         ":443",
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    // 配置 HTTP/2
    http2.ConfigureServer(server, h2s)

    return server
}
```

## 常见陷阱

### 1. 意外禁用 HTTP/2

```go
package main

import (
    "net/http"
)

// 错误：这会禁用 HTTP/2！
func badServer() *http.Server {
    return &http.Server{
        Addr: ":443",
        // 空的 TLSNextProto 会禁用 HTTP/2
        TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
    }
}

// 正确：HTTP/2 默认启用
func goodServer() *http.Server {
    return &http.Server{
        Addr: ":443",
        // 完全不设置 TLSNextProto，或设置为 nil
    }
}
```

### 2. 阻塞流处理

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

// 错误：阻塞流，无法利用多路复用的优势
func badHandler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(5 * time.Second) // 阻塞整个处理器
    fmt.Fprintf(w, "完成")
}

// 正确：使用 context 进行取消，流式传输数据
func goodHandler(w http.ResponseWriter, r *http.Request) {
    flusher, _ := w.(http.Flusher)
    ctx := r.Context()

    for i := 0; i < 5; i++ {
        select {
        case <-ctx.Done():
            return // 客户端已断开
        case <-time.After(time.Second):
            fmt.Fprintf(w, "进度: %d/5\n", i+1)
            if flusher != nil {
                flusher.Flush()
            }
        }
    }
    fmt.Fprintf(w, "完成\n")
}
```

### 3. 忽略流量控制

```go
package main

import (
    "fmt"
    "net/http"
)

// 错误：可能压垮慢速客户端
func badStreamHandler(w http.ResponseWriter, r *http.Request) {
    flusher, _ := w.(http.Flusher)

    // 不考虑客户端情况就大量发送数据
    for i := 0; i < 1000000; i++ {
        fmt.Fprintf(w, "行 %d: 一些数据\n", i)
        if i%100 == 0 {
            flusher.Flush()
        }
    }
}

// 正确：尊重流量控制，处理客户端断开
func goodStreamHandler(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "不支持流式传输", http.StatusInternalServerError)
        return
    }

    ctx := r.Context()

    for i := 0; i < 1000000; i++ {
        select {
        case <-ctx.Done():
            return // 客户端断开或取消
        default:
            _, err := fmt.Fprintf(w, "行 %d: 一些数据\n", i)
            if err != nil {
                return // 写入失败（可能是客户端问题）
            }
            if i%100 == 0 {
                flusher.Flush()
            }
        }
    }
}
```

### 4. 未处理推送拒绝

```go
package main

import (
    "log"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    pusher, ok := w.(http.Pusher)
    if !ok {
        // HTTP/1.1 客户端或推送已禁用
        log.Println("推送不可用")
    } else {
        err := pusher.Push("/resource.js", nil)
        if err != nil {
            // 推送可能因各种原因失败：
            // - 客户端设置 SETTINGS_ENABLE_PUSH = 0
            // - 并发推送太多
            // - 资源已在缓存中
            log.Printf("推送被拒绝: %v", err)
        }
    }

    // 无论推送状态如何，始终提供页面
    w.Header().Set("Content-Type", "text/html")
    w.Write([]byte("<html>...</html>"))
}
```

## 性能考量

### 测量 HTTP/2 与 HTTP/1.1

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
    fmt.Printf("  总请求数: %d\n", totalRequests)
    fmt.Printf("  总字节数: %d\n", totalBytes)
    fmt.Printf("  耗时: %v\n", duration)
    fmt.Printf("  请求/秒: %.2f\n", float64(totalRequests)/duration.Seconds())
    fmt.Printf("  吞吐量: %.2f MB/s\n", float64(totalBytes)/1024/1024/duration.Seconds())
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
        // 禁用 HTTP/2
        TLSNextProto: make(map[string]func(string, *tls.Conn) http.RoundTripper),
    }

    // HTTP/2 Transport
    http2Transport := &http.Transport{
        TLSClientConfig:   &tls.Config{InsecureSkipVerify: true},
        ForceAttemptHTTP2: true,
    }

    fmt.Println("HTTP/1.1 与 HTTP/2 基准测试")
    fmt.Println("================================")

    benchmark("HTTP/1.1", http1Transport, urls, 10)
    benchmark("HTTP/2", http2Transport, urls, 10)
}
```

### 连接复用监控

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
        "DNS: %d, 连接开始: %d, 连接复用: %d, TLS: %d, 首字节: %d",
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

    // 发起多个请求
    for i := 0; i < 10; i++ {
        req, _ := http.NewRequest("GET", "https://http2.golang.org/", nil)
        req = req.WithContext(httptrace.WithClientTrace(req.Context(), tracer.trace()))

        resp, err := client.Do(req)
        if err != nil {
            fmt.Println("错误:", err)
            continue
        }
        resp.Body.Close()
    }

    fmt.Println("连接统计:")
    fmt.Println(tracer)
}
```

## 实战场景

### 负载均衡器健康检查

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
        fmt.Printf("后端 %s 不健康: %v\n", backend.URL, err)
        return
    }
    defer resp.Body.Close()

    healthy := resp.StatusCode == http.StatusOK
    backend.SetHealth(healthy)

    status := "健康"
    if !healthy {
        status = "不健康"
    }
    fmt.Printf("后端 %s 状态: %s（HTTP/2: %v）\n",
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

## 面试要点

1. **HTTP/2 与 HTTP/1.1 的区别**：
   - 多路复用：单个连接上的多个流
   - 头部压缩：HPACK 算法
   - 服务器推送：主动资源传递
   - 二进制协议：解析更高效

2. **Go HTTP/2 支持**：
   - HTTPS 默认启用（Go 1.6+）
   - 在 Transport 中使用 `ForceAttemptHTTP2: true`
   - h2c 需要 `golang.org/x/net/http2/h2c`

3. **服务器推送**：
   - 使用 `http.Pusher` 接口
   - 推送前检查是否可用
   - 优雅处理推送拒绝
   - 不要推送大型资源

4. **流量控制**：
   - 流级别和连接级别窗口
   - WINDOW_UPDATE 帧用于控制
   - 防止压垮慢速客户端

5. **常见问题**：
   - 空的 TLSNextProto 会禁用 HTTP/2
   - 流式传输需要调整超时
   - Context 取消用于清理

## 延伸阅读

- [Go 文档：net/http](https://pkg.go.dev/net/http)
- [HTTP/2 RFC 7540](https://tools.ietf.org/html/rfc7540)
- [HPACK RFC 7541](https://tools.ietf.org/html/rfc7541)
- [Go HTTP/2 演示服务器](https://http2.golang.org/)
- [golang.org/x/net/http2](https://pkg.go.dev/golang.org/x/net/http2)
- [HTTP/2 实战（书籍）](https://www.manning.com/books/http2-in-action)
