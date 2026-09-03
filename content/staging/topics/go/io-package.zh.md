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
origin: old/src/content/docs/go/io-package.zh.md
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

Go 语言的 `io` 包是标准库中最基础、最重要的包之一。它定义了 I/O 原语的基本接口，是整个 Go I/O 生态系统的基石。理解 `io` 包对于编写高效、可组合的 Go 程序至关重要。

## 概念解释

### 什么是 io 包

`io` 包提供了 I/O 原语的基本接口，主要包括：

- **Reader/Writer 接口**：定义了读写操作的基本抽象
- **辅助函数**：如 `io.Copy`、`io.ReadAll` 等，用于常见的 I/O 操作
- **组合工具**：如 `io.Pipe`、`io.TeeReader`、`io.MultiWriter` 等，用于构建复杂的 I/O 管道

`io` 包的设计哲学体现了 Go 语言的核心理念：**简单、正交、可组合**。通过定义小而精的接口，Go 实现了高度的代码复用和灵活的组合能力。

### 为什么 io 包如此重要

```go
// io 包的核心接口被广泛使用
// 几乎所有涉及数据读写的场景都会用到这些接口

// 文件操作
file, _ := os.Open("data.txt")  // *os.File 实现了 io.Reader 和 io.Writer

// 网络操作
conn, _ := net.Dial("tcp", "localhost:8080")  // net.Conn 实现了 io.Reader 和 io.Writer

// HTTP 响应
resp, _ := http.Get("https://example.com")  // resp.Body 实现了 io.Reader

// 内存缓冲
var buf bytes.Buffer  // bytes.Buffer 实现了 io.Reader 和 io.Writer
```

### 历史背景

`io` 包的设计借鉴了 Unix 的 "一切皆文件" 哲学和管道机制。在 Unix 系统中，文件、设备、网络连接都被抽象为文件描述符，可以通过统一的 read/write 系统调用进行操作。Go 的 `io` 包将这一思想提升到了类型系统层面，通过接口实现了更强的类型安全和更好的抽象能力。

## 核心原理

### Reader 接口

`io.Reader` 是 Go 中最基础的读取接口：

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}
```

**Read 方法的契约：**

1. **读取数据**：将最多 `len(p)` 字节的数据读入 `p`
2. **返回值**：返回实际读取的字节数 `n` (0 <= n <= len(p)) 和任何错误
3. **EOF 处理**：到达数据末尾时，返回 `io.EOF` 错误
4. **部分读取**：即使 `n < len(p)`，也可能使用了 `p` 的全部空间
5. **非阻塞**：如果数据暂时不可用但未到达 EOF，Read 应该阻塞而不是返回错误

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    // 创建一个 Reader
    reader := strings.NewReader("Hello, Go io package!")

    // 分块读取数据
    buf := make([]byte, 8)
    for {
        n, err := reader.Read(buf)
        if n > 0 {
            fmt.Printf("读取了 %d 字节: %s\n", n, buf[:n])
        }
        if err == io.EOF {
            fmt.Println("读取完毕")
            break
        }
        if err != nil {
            fmt.Println("读取错误:", err)
            break
        }
    }
}

// 输出:
// 读取了 8 字节: Hello, G
// 读取了 8 字节: o io pac
// 读取了 5 字节: kage!
// 读取完毕
```

### Writer 接口

`io.Writer` 是 Go 中最基础的写入接口：

```go
type Writer interface {
    Write(p []byte) (n int, err error)
}
```

**Write 方法的契约：**

1. **写入数据**：将 `p` 中的数据写入底层数据流
2. **返回值**：返回实际写入的字节数 `n` 和任何错误
3. **完整写入**：如果 `n < len(p)`，必须返回一个非 nil 的错误
4. **不修改切片**：Write 不能修改切片 `p`，即使是临时修改

```go
package main

import (
    "bytes"
    "fmt"
    "os"
)

func main() {
    // 写入到标准输出
    n, err := os.Stdout.Write([]byte("Hello, stdout!\n"))
    fmt.Printf("写入了 %d 字节, 错误: %v\n", n, err)

    // 写入到内存缓冲区
    var buf bytes.Buffer
    buf.Write([]byte("Hello, "))
    buf.Write([]byte("Buffer!"))
    fmt.Println("缓冲区内容:", buf.String())
}
```

### 其他重要接口

```go
// Closer 接口：用于关闭资源
type Closer interface {
    Close() error
}

// Seeker 接口：用于随机访问
type Seeker interface {
    Seek(offset int64, whence int) (int64, error)
}

// 组合接口
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

### 接口组合的威力

```go
package main

import (
    "fmt"
    "io"
    "os"
)

// 处理任何 Reader
func processReader(r io.Reader) error {
    data, err := io.ReadAll(r)
    if err != nil {
        return err
    }
    fmt.Printf("处理了 %d 字节数据\n", len(data))
    return nil
}

// 处理任何 ReadCloser
func processAndClose(rc io.ReadCloser) error {
    defer rc.Close()
    return processReader(rc)
}

func main() {
    // 文件实现了 ReadCloser
    file, _ := os.Open("example.txt")
    processAndClose(file)

    // 使用 io.NopCloser 将 Reader 转换为 ReadCloser
    reader := strings.NewReader("some data")
    rc := io.NopCloser(reader)
    processAndClose(rc)
}
```

## 核心要点

### io.Copy - 高效数据复制

`io.Copy` 是最常用的 I/O 函数之一，用于从 Reader 复制数据到 Writer：

```go
func Copy(dst Writer, src Reader) (written int64, err error)
```

**工作原理：**

1. 从 `src` 读取数据
2. 将读取的数据写入 `dst`
3. 重复直到 `src` 返回 EOF 或发生错误
4. 返回总共复制的字节数

```go
package main

import (
    "fmt"
    "io"
    "os"
    "strings"
)

func main() {
    // 基本复制：从字符串复制到标准输出
    reader := strings.NewReader("Hello, io.Copy!\n")
    n, err := io.Copy(os.Stdout, reader)
    fmt.Printf("复制了 %d 字节, 错误: %v\n", n, err)

    // 文件复制示例
    src, _ := os.Open("source.txt")
    defer src.Close()

    dst, _ := os.Create("destination.txt")
    defer dst.Close()

    written, err := io.Copy(dst, src)
    if err != nil {
        fmt.Println("复制失败:", err)
        return
    }
    fmt.Printf("成功复制 %d 字节\n", written)
}
```

**io.CopyN - 限制复制字节数：**

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

    // 只复制前 13 个字节
    n, err := io.CopyN(os.Stdout, reader, 13)
    fmt.Printf("\n复制了 %d 字节, 错误: %v\n", n, err)
    // 输出: Hello, World!
}
```

**io.CopyBuffer - 使用自定义缓冲区：**

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

    // 使用自定义 32KB 缓冲区
    buf := make([]byte, 32*1024)
    n, err := io.CopyBuffer(&dst, src, buf)

    fmt.Printf("复制了 %d 字节: %s\n", n, dst.String())
}
```

### io.Pipe - 内存管道

`io.Pipe` 创建一个同步的内存管道，用于连接 Reader 和 Writer：

```go
func Pipe() (*PipeReader, *PipeWriter)
```

**特点：**

- 同步操作：写入操作会阻塞直到数据被读取
- 无内部缓冲：数据直接从写入端传递到读取端
- 线程安全：可以在不同的 goroutine 中安全使用

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
    // 创建管道
    pr, pw := io.Pipe()

    // 在一个 goroutine 中写入 JSON 数据
    go func() {
        defer pw.Close()

        encoder := json.NewEncoder(pw)
        users := []User{
            {"张三", "zhangsan@example.com"},
            {"李四", "lisi@example.com"},
            {"王五", "wangwu@example.com"},
        }

        for _, user := range users {
            if err := encoder.Encode(user); err != nil {
                pw.CloseWithError(err)
                return
            }
        }
    }()

    // 在主 goroutine 中读取
    decoder := json.NewDecoder(pr)
    for {
        var user User
        err := decoder.Decode(&user)
        if err == io.EOF {
            break
        }
        if err != nil {
            fmt.Println("解码错误:", err)
            break
        }
        fmt.Printf("读取用户: %s <%s>\n", user.Name, user.Email)
    }
}
```

**处理大数据流的实际应用：**

```go
package main

import (
    "compress/gzip"
    "fmt"
    "io"
    "os"
)

func main() {
    // 场景：压缩文件并上传（模拟）
    pr, pw := io.Pipe()

    // 错误通道
    errCh := make(chan error, 1)

    // 生产者：读取文件并压缩
    go func() {
        defer pw.Close()

        // 创建 gzip Writer
        gw := gzip.NewWriter(pw)
        defer gw.Close()

        // 读取源文件
        file, err := os.Open("large_file.txt")
        if err != nil {
            pw.CloseWithError(err)
            errCh <- err
            return
        }
        defer file.Close()

        // 压缩数据
        _, err = io.Copy(gw, file)
        if err != nil {
            pw.CloseWithError(err)
            errCh <- err
            return
        }

        errCh <- nil
    }()

    // 消费者：将压缩数据写入目标文件
    output, _ := os.Create("compressed.gz")
    defer output.Close()

    written, err := io.Copy(output, pr)
    if err != nil {
        fmt.Println("写入错误:", err)
        return
    }

    // 检查生产者是否有错误
    if prodErr := <-errCh; prodErr != nil {
        fmt.Println("压缩错误:", prodErr)
        return
    }

    fmt.Printf("成功压缩 %d 字节\n", written)
}
```

### io.TeeReader - 数据分流

`io.TeeReader` 返回一个 Reader，它会将从 `r` 读取的数据同时写入 `w`：

```go
func TeeReader(r Reader, w Writer) Reader
```

**使用场景：**

- 计算数据校验和的同时处理数据
- 记录网络请求/响应的同时转发数据
- 调试 I/O 流

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
    // 原始数据
    data := "Hello, io.TeeReader! This is important data."
    reader := strings.NewReader(data)

    // 创建 SHA256 哈希计算器
    hash := sha256.New()

    // 创建 TeeReader：读取数据的同时计算哈希
    teeReader := io.TeeReader(reader, hash)

    // 读取并处理数据
    content, err := io.ReadAll(teeReader)
    if err != nil {
        fmt.Println("读取错误:", err)
        return
    }

    // 数据已被读取，哈希已计算完成
    fmt.Println("内容:", string(content))
    fmt.Println("SHA256:", hex.EncodeToString(hash.Sum(nil)))
}
```

**实际应用：下载文件并验证校验和**

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
    // 发起 HTTP 请求
    resp, err := http.Get(url)
    if err != nil {
        return fmt.Errorf("请求失败: %w", err)
    }
    defer resp.Body.Close()

    // 创建目标文件
    file, err := os.Create(dest)
    if err != nil {
        return fmt.Errorf("创建文件失败: %w", err)
    }
    defer file.Close()

    // 创建哈希计算器
    hash := sha256.New()

    // 使用 TeeReader 同时写入文件和计算哈希
    teeReader := io.TeeReader(resp.Body, hash)

    // 复制数据到文件
    written, err := io.Copy(file, teeReader)
    if err != nil {
        return fmt.Errorf("下载失败: %w", err)
    }

    // 验证哈希
    actualHash := hex.EncodeToString(hash.Sum(nil))
    if actualHash != expectedHash {
        os.Remove(dest) // 删除损坏的文件
        return fmt.Errorf("哈希不匹配: 期望 %s, 实际 %s", expectedHash, actualHash)
    }

    fmt.Printf("下载成功: %d 字节, 哈希验证通过\n", written)
    return nil
}
```

### io.MultiWriter - 多目标写入

`io.MultiWriter` 创建一个 Writer，写入它的数据会被同时写入所有提供的 Writer：

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
    // 创建多个写入目标
    var buf1, buf2 bytes.Buffer

    // 创建 MultiWriter：同时写入 stdout、buf1、buf2
    multiWriter := io.MultiWriter(os.Stdout, &buf1, &buf2)

    // 写入数据
    fmt.Fprintln(multiWriter, "这条消息会被写入三个地方")

    // 验证
    fmt.Println("buf1:", buf1.String())
    fmt.Println("buf2:", buf2.String())
}
```

**实际应用：日志同时写入文件和控制台**

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
    // 创建日志文件
    logFile, err := os.OpenFile(
        fmt.Sprintf("app_%s.log", time.Now().Format("2006-01-02")),
        os.O_CREATE|os.O_WRONLY|os.O_APPEND,
        0644,
    )
    if err != nil {
        log.Fatal("无法创建日志文件:", err)
    }

    // 创建 MultiWriter：同时输出到文件和控制台
    multiWriter := io.MultiWriter(os.Stdout, logFile)

    // 创建 Logger
    logger := log.New(multiWriter, "[APP] ", log.Ldate|log.Ltime|log.Lshortfile)

    // 返回清理函数
    cleanup := func() {
        logFile.Close()
    }

    return logger, cleanup
}

func main() {
    logger, cleanup := setupLogger()
    defer cleanup()

    logger.Println("应用程序启动")
    logger.Println("处理用户请求")
    logger.Println("操作完成")
}
```

### io.MultiReader - 多源读取

`io.MultiReader` 创建一个 Reader，它按顺序从多个 Reader 读取数据：

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
    // 创建多个 Reader
    r1 := strings.NewReader("Hello, ")
    r2 := strings.NewReader("World")
    r3 := strings.NewReader("!")

    // 合并多个 Reader
    multiReader := io.MultiReader(r1, r2, r3)

    // 一次性读取所有数据
    data, _ := io.ReadAll(multiReader)
    fmt.Println(string(data)) // 输出: Hello, World!
}
```

**实际应用：合并文件头和内容**

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

    // 创建头部 Reader
    headerReader := bytes.NewReader(header)

    // 合并头部和内容
    combined := io.MultiReader(headerReader, content)

    // 写入文件
    _, err = io.Copy(file, combined)
    return err
}
```

### io.LimitReader - 限制读取量

`io.LimitReader` 返回一个 Reader，它最多读取 n 个字节：

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

    // 只读取前 13 个字节
    limitReader := io.LimitReader(reader, 13)

    data, _ := io.ReadAll(limitReader)
    fmt.Println(string(data)) // 输出: Hello, World!
}
```

**安全应用：防止请求体过大**

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
    // 限制请求体大小，防止内存耗尽攻击
    limitedReader := io.LimitReader(r.Body, MaxBodySize)

    var data map[string]interface{}
    decoder := json.NewDecoder(limitedReader)

    if err := decoder.Decode(&data); err != nil {
        if err == io.EOF {
            http.Error(w, "请求体为空", http.StatusBadRequest)
            return
        }
        http.Error(w, "无效的 JSON", http.StatusBadRequest)
        return
    }

    fmt.Fprintf(w, "接收到数据: %v", data)
}
```

### io.SectionReader - 区间读取

`io.SectionReader` 实现了对底层 `ReaderAt` 的一个区间的 Read、Seek 和 ReadAt：

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

    // 只读取 "World!" 部分 (从偏移 7 开始，读取 6 个字节)
    section := io.NewSectionReader(reader, 7, 6)

    data, _ := io.ReadAll(section)
    fmt.Println(string(data)) // 输出: World!

    // SectionReader 支持 Seek
    section.Seek(0, io.SeekStart) // 回到开头

    buf := make([]byte, 3)
    section.Read(buf)
    fmt.Println(string(buf)) // 输出: Wor
}
```

## 代码示例

### 自定义 Reader 实现

```go
package main

import (
    "fmt"
    "io"
)

// CountingReader 统计读取的字节数
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

    // 读取数据
    io.ReadAll(cr)

    fmt.Printf("总共读取了 %d 字节\n", cr.BytesRead)
}
```

### 自定义 Writer 实现

```go
package main

import (
    "fmt"
    "io"
    "unicode"
)

// UppercaseWriter 将所有写入的内容转换为大写
type UppercaseWriter struct {
    writer io.Writer
}

func NewUppercaseWriter(w io.Writer) *UppercaseWriter {
    return &UppercaseWriter{writer: w}
}

func (uw *UppercaseWriter) Write(p []byte) (n int, err error) {
    // 转换为大写
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

    fmt.Println(buf.String()) // 输出: HELLO, WORLD!
}
```

### 进度跟踪 Reader

```go
package main

import (
    "fmt"
    "io"
    "strings"
    "time"
)

// ProgressReader 跟踪读取进度
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
        fmt.Printf("\r进度: %.1f%% (%d/%d 字节)", percent, read, total)
    }

    pr := NewProgressReader(
        strings.NewReader(data),
        int64(len(data)),
        progressCallback,
    )

    // 模拟慢速读取
    buf := make([]byte, 100)
    for {
        _, err := pr.Read(buf)
        if err == io.EOF {
            break
        }
        time.Sleep(50 * time.Millisecond)
    }

    fmt.Println("\n读取完成!")
}
```

### 完整的数据处理管道

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
    // 原始数据
    originalData := "Hello, World! This is a demonstration of io composition."

    // 步骤 1: 压缩数据
    var compressed bytes.Buffer
    gzWriter := gzip.NewWriter(&compressed)
    io.WriteString(gzWriter, originalData)
    gzWriter.Close()

    fmt.Printf("原始大小: %d 字节\n", len(originalData))
    fmt.Printf("压缩后大小: %d 字节\n", compressed.Len())

    // 步骤 2: 使用 TeeReader 解压并计算哈希
    hash := sha256.New()
    gzReader, _ := gzip.NewReader(&compressed)
    teeReader := io.TeeReader(gzReader, hash)

    // 步骤 3: 使用带缓冲的读取
    bufferedReader := bufio.NewReader(teeReader)

    // 步骤 4: 逐行读取
    fmt.Println("\n解压后的内容:")
    for {
        line, err := bufferedReader.ReadString('\n')
        if len(line) > 0 {
            fmt.Print(line)
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            fmt.Println("读取错误:", err)
            break
        }
    }

    // 读取完成后计算最终哈希
    fmt.Printf("\n\nSHA256: %s\n", hex.EncodeToString(hash.Sum(nil)))
}
```

## 最佳实践

### 始终检查返回值

```go
// 错误示范
func badExample(r io.Reader) {
    buf := make([]byte, 1024)
    r.Read(buf)  // 忽略了返回值！
}

// 正确做法
func goodExample(r io.Reader) error {
    buf := make([]byte, 1024)
    n, err := r.Read(buf)
    if err != nil && err != io.EOF {
        return err
    }
    // 只使用实际读取的数据
    process(buf[:n])
    return nil
}
```

### 正确处理 io.EOF

```go
// io.EOF 是正常的结束信号，不是错误
func readAll(r io.Reader) ([]byte, error) {
    var result []byte
    buf := make([]byte, 1024)

    for {
        n, err := r.Read(buf)
        if n > 0 {
            result = append(result, buf[:n]...)
        }

        if err == io.EOF {
            // 正常结束
            return result, nil
        }

        if err != nil {
            // 真正的错误
            return result, err
        }
    }
}
```

### 优先使用 io.Copy 而非手动循环

```go
// 不推荐：手动复制
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

// 推荐：使用 io.Copy
func betterCopy(dst io.Writer, src io.Reader) error {
    _, err := io.Copy(dst, src)
    return err
}
```

### 使用 defer 确保资源关闭

```go
func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()  // 确保文件被关闭

    // 处理文件...
    return nil
}
```

### 利用接口进行依赖注入

```go
// 可测试的设计
type DataProcessor struct {
    reader io.Reader
    writer io.Writer
}

func (dp *DataProcessor) Process() error {
    data, err := io.ReadAll(dp.reader)
    if err != nil {
        return err
    }

    // 处理数据...
    processed := bytes.ToUpper(data)

    _, err = dp.writer.Write(processed)
    return err
}

// 测试时可以使用 bytes.Buffer
func TestDataProcessor(t *testing.T) {
    input := bytes.NewBufferString("hello")
    output := &bytes.Buffer{}

    dp := &DataProcessor{reader: input, writer: output}
    dp.Process()

    if output.String() != "HELLO" {
        t.Errorf("期望 HELLO, 得到 %s", output.String())
    }
}
```

### 合理使用缓冲

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

    // 使用带缓冲的 Writer 提高性能
    bufferedWriter := bufio.NewWriter(dstFile)
    defer bufferedWriter.Flush()  // 确保所有数据被写入

    _, err = io.Copy(bufferedWriter, srcFile)
    return err
}
```

## 常见陷阱

### 忘记处理部分读取

```go
// 错误：假设 Read 会读满缓冲区
func badRead(r io.Reader) ([]byte, error) {
    buf := make([]byte, 1024)
    r.Read(buf)  // 可能只读取了部分数据
    return buf, nil  // 返回了可能包含垃圾数据的缓冲区
}

// 正确：使用 io.ReadFull 确保读满
func goodRead(r io.Reader, size int) ([]byte, error) {
    buf := make([]byte, size)
    _, err := io.ReadFull(r, buf)
    if err != nil {
        return nil, err
    }
    return buf, nil
}
```

### 忽略 Write 的返回值

```go
// 错误：忽略写入错误
func badWrite(w io.Writer, data []byte) {
    w.Write(data)  // 可能写入失败！
}

// 正确：检查返回值
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

### 在 Pipe 中忘记关闭

```go
// 错误：忘记关闭 PipeWriter，导致 Reader 阻塞
func badPipe() {
    pr, pw := io.Pipe()

    go func() {
        pw.Write([]byte("hello"))
        // 忘记 pw.Close()，Reader 会永远等待
    }()

    io.ReadAll(pr)  // 永远阻塞
}

// 正确：总是关闭 PipeWriter
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

### 重复读取已耗尽的 Reader

```go
// 错误：Reader 只能读取一次
func badReuse(r io.Reader) {
    data1, _ := io.ReadAll(r)
    data2, _ := io.ReadAll(r)  // data2 会是空的！

    fmt.Println(len(data1), len(data2))
}

// 解决方案 1：使用 io.TeeReader 保存数据
func solution1(r io.Reader) {
    var buf bytes.Buffer
    tee := io.TeeReader(r, &buf)

    data1, _ := io.ReadAll(tee)
    data2, _ := io.ReadAll(&buf)

    fmt.Println(len(data1), len(data2))  // 相同
}

// 解决方案 2：使用 bytes.Reader 的 Reset
func solution2(data []byte) {
    reader := bytes.NewReader(data)

    io.ReadAll(reader)
    reader.Reset(data)  // 重置到开始
    io.ReadAll(reader)
}
```

### MultiWriter 中的错误处理

```go
// 注意：MultiWriter 遇到第一个错误就会停止
func multiWriterError() {
    var buf1, buf2 bytes.Buffer

    // 创建一个会失败的 Writer
    failWriter := &errorWriter{}

    multi := io.MultiWriter(&buf1, failWriter, &buf2)

    _, err := multi.Write([]byte("hello"))
    // buf1 会收到数据，但 buf2 不会
    if err != nil {
        fmt.Println("写入失败:", err)
    }
}

type errorWriter struct{}

func (e *errorWriter) Write(p []byte) (int, error) {
    return 0, fmt.Errorf("模拟错误")
}
```

## 性能考量

### 缓冲区大小选择

```go
package main

import (
    "io"
    "os"
    "testing"
)

// 基准测试：不同缓冲区大小的影响
func BenchmarkCopyBuffer(b *testing.B) {
    sizes := []int{
        512,
        1024,
        4096,
        32 * 1024,  // 32KB，通常是最佳选择
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

### 避免不必要的内存分配

```go
// 差：每次调用都分配新的缓冲区
func badCopy(src io.Reader, dst io.Writer) error {
    buf := make([]byte, 32*1024)  // 每次都分配
    _, err := io.CopyBuffer(dst, src, buf)
    return err
}

// 好：复用缓冲区
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

// 更好：使用 sync.Pool
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

### 使用 WriteTo 和 ReadFrom 优化

```go
// io.Copy 会自动检测并使用这些接口进行优化

// WriteTo 接口：Reader 直接写入 Writer
type WriterTo interface {
    WriteTo(w Writer) (n int64, err error)
}

// ReadFrom 接口：Writer 直接从 Reader 读取
type ReaderFrom interface {
    ReadFrom(r Reader) (n int64, err error)
}

// 例如，bytes.Buffer 实现了这两个接口
// 当 io.Copy 的源或目标实现这些接口时，会直接调用它们
// 避免额外的缓冲区和数据复制
```

### 利用操作系统零拷贝

```go
// 在 Linux 上，当 src 是文件且 dst 支持时
// io.Copy 会使用 sendfile 系统调用实现零拷贝

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

    // io.Copy 会自动选择最优策略
    // 包括可能的 sendfile 系统调用
    _, err = io.Copy(dstFile, srcFile)
    return err
}
```

### Pipe 性能注意事项

```go
// io.Pipe 是同步的，没有内部缓冲
// 对于高吞吐量场景，考虑使用带缓冲的通道

// 使用带缓冲的管道实现
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

## 实战场景

### 场景 1: HTTP 响应流式处理

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
        return fmt.Errorf("请求失败: %w", err)
    }
    defer resp.Body.Close()

    // 创建目标文件
    file, err := os.Create(dest)
    if err != nil {
        return fmt.Errorf("创建文件失败: %w", err)
    }
    defer file.Close()

    // 使用带缓冲的 Writer
    buffered := bufio.NewWriter(file)
    defer buffered.Flush()

    // 获取文件大小
    total := resp.ContentLength

    // 创建进度跟踪器
    progress := &ProgressWriter{
        writer: buffered,
        total:  total,
        onProgress: func(written, total int64) {
            if total > 0 {
                percent := float64(written) / float64(total) * 100
                fmt.Printf("\r下载进度: %.2f%% (%d/%d 字节)", percent, written, total)
            }
        },
    }

    // 复制数据
    _, err = io.Copy(progress, resp.Body)
    fmt.Println()  // 换行

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

### 场景 2: 日志处理管道

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

// 日志处理管道
func processLogs(input io.Reader, output io.Writer) error {
    scanner := bufio.NewScanner(input)
    encoder := json.NewEncoder(output)

    for scanner.Scan() {
        line := scanner.Text()

        // 解析日志行
        entry := parseLogLine(line)

        // 过滤 ERROR 级别
        if entry.Level == "ERROR" {
            if err := encoder.Encode(entry); err != nil {
                return err
            }
        }
    }

    return scanner.Err()
}

func parseLogLine(line string) LogEntry {
    // 简化的日志解析
    parts := strings.SplitN(line, " ", 3)
    return LogEntry{
        Timestamp: time.Now(),
        Level:     parts[1],
        Message:   parts[2],
    }
}

func main() {
    // 处理日志文件
    input, _ := os.Open("app.log")
    defer input.Close()

    output, _ := os.Create("errors.json")
    defer output.Close()

    processLogs(input, output)
}
```

### 场景 3: 数据转换代理

```go
package main

import (
    "io"
    "net/http"
    "strings"
)

// 转换 Writer：将响应内容中的敏感信息脱敏
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

// 代理处理器
func proxyHandler(w http.ResponseWriter, r *http.Request) {
    // 发起代理请求
    resp, err := http.Get("http://backend-service" + r.URL.Path)
    if err != nil {
        http.Error(w, "代理请求失败", http.StatusBadGateway)
        return
    }
    defer resp.Body.Close()

    // 复制响应头
    for key, values := range resp.Header {
        for _, value := range values {
            w.Header().Add(key, value)
        }
    }
    w.WriteHeader(resp.StatusCode)

    // 使用脱敏 Writer
    redacting := &RedactingWriter{
        writer:   w,
        keywords: []string{"password", "secret", "token"},
    }

    io.Copy(redacting, resp.Body)
}
```

### 场景 4: 数据校验流

```go
package main

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "os"
)

// ValidatingReader 在读取时验证数据完整性
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
        return fmt.Errorf("哈希不匹配: 期望 %s, 实际 %s", vr.expectedHash, actualHash)
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

    // 处理数据...
    io.Copy(io.Discard, vr)

    // 验证
    return vr.Validate()
}
```

## 面试要点

### 基础概念题

**Q1: io.Reader 和 io.Writer 接口有什么特点？为什么这样设计？**

```
A1:
- io.Reader 只有一个 Read 方法，io.Writer 只有一个 Write 方法
- 这种最小化接口设计体现了 Go 的"小接口"哲学
- 优点：
  1. 易于实现：任何类型只需实现一个方法即可满足接口
  2. 高度可组合：可以通过组合创建复杂的 I/O 处理管道
  3. 解耦：代码不依赖具体实现，只依赖接口
  4. 测试友好：容易创建 mock 对象进行单元测试
```

**Q2: io.EOF 是错误吗？应该如何处理？**

```go
// io.EOF 是一个预定义的 sentinel error，表示正常的输入结束
// 不应该作为错误返回给调用者

func readData(r io.Reader) ([]byte, error) {
    data, err := io.ReadAll(r)
    if err != nil {
        // io.ReadAll 内部已经处理了 EOF，不会返回 EOF
        return nil, err
    }
    return data, nil
}

// 手动读取时的正确处理
func manualRead(r io.Reader) ([]byte, error) {
    var result []byte
    buf := make([]byte, 1024)
    for {
        n, err := r.Read(buf)
        if n > 0 {
            result = append(result, buf[:n]...)
        }
        if err == io.EOF {
            return result, nil  // EOF 不是错误
        }
        if err != nil {
            return nil, err  // 真正的错误
        }
    }
}
```

**Q3: io.Copy 内部是如何工作的？有哪些优化？**

```
A3:
1. 基本流程：
   - 创建一个缓冲区（默认 32KB）
   - 循环从 src 读取到缓冲区
   - 将缓冲区数据写入 dst
   - 直到遇到 EOF 或错误

2. 优化策略：
   - 如果 dst 实现了 io.ReaderFrom，直接调用 dst.ReadFrom(src)
   - 如果 src 实现了 io.WriterTo，直接调用 src.WriteTo(dst)
   - 在 Linux 上可能使用 sendfile 系统调用实现零拷贝

3. 这些优化可以避免数据在用户空间和内核空间之间多次复制
```

### 实践编码题

**Q4: 实现一个限速的 Reader**

```go
package main

import (
    "io"
    "time"
)

// RateLimitedReader 限制读取速度
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
    // 计算应该读取的最大字节数
    elapsed := time.Since(rl.lastRead)
    allowedBytes := int(float64(rl.bytesPerSec) * elapsed.Seconds())

    if allowedBytes < len(p) && allowedBytes > 0 {
        p = p[:allowedBytes]
    }

    n, err = rl.reader.Read(p)

    // 计算需要等待的时间
    if n > 0 {
        expectedDuration := time.Duration(float64(n) / float64(rl.bytesPerSec) * float64(time.Second))
        time.Sleep(expectedDuration)
        rl.lastRead = time.Now()
    }

    return
}
```

**Q5: 如何使用 io 包实现一个简单的行计数器？**

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

// 或者使用更低级的方法
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
    fmt.Println("行数:", count)  // 输出: 3
}
```

### 设计题

**Q6: 设计一个支持回放的 Reader**

```go
package main

import (
    "bytes"
    "io"
)

// ReplayableReader 支持回放读取过的数据
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

## 延伸阅读

### 官方文档

- [io 包官方文档](https://pkg.go.dev/io)
- [bufio 包官方文档](https://pkg.go.dev/bufio)
- [Effective Go - I/O](https://go.dev/doc/effective_go#interfaces)

### 深入理解

- [Go 语言 I/O 源码分析](https://github.com/golang/go/blob/master/src/io/io.go)
- [io.Copy 实现原理](https://github.com/golang/go/blob/master/src/io/io.go#L379)

### 相关包

- **bufio**：带缓冲的 I/O，提供 Scanner、Reader、Writer
- **bytes**：字节切片的 I/O 操作
- **strings**：字符串的 I/O 操作
- **os**：操作系统文件 I/O
- **net**：网络 I/O
- **compress/gzip**：gzip 压缩 I/O
- **encoding/json**：JSON 编解码 I/O

### 推荐阅读

- 《Go 语言圣经》- 第 7 章：接口
- 《Go 语言高级编程》- 第 1 章：语言基础
- [Go Blog: Go 接口的力量](https://go.dev/doc/effective_go#interfaces)

---

> `io` 包是 Go 标准库的核心基石。通过理解 Reader/Writer 接口和各种组合工具，你可以构建出高效、可组合、易测试的 I/O 处理代码。记住：小接口，大能力。
