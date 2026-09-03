---
title: Go bufio 包：缓冲 I/O 操作指南
description: 深入理解 Go 标准库 bufio 包的缓冲机制、核心组件、最佳实践和性能优化技巧，包括 Scanner、Reader、Writer 等关键工具的使用方法和实战应用
track: go
section: stdlib
difficulty: intermediate
tags:
  - bufio
  - I/O
  - 缓冲
  - Scanner
  - Reader
  - Writer
  - 性能
  - 文件操作
status: imported
origin: old/src/content/docs/go/bufio.zh.md
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


## 概念解释

bufio（buffered I/O）是 Go 标准库中提供缓冲输入输出功能的包。它的核心目的是通过缓冲机制提高 I/O 操作的效率。

### 什么是缓冲 I/O

缓冲 I/O 的基本思想很简单：不直接读写数据，而是先把数据存储在内存中的缓冲区（buffer）里，攒到一定量再进行实际的 I/O 操作。这样可以：

1. **减少系统调用次数**：系统调用的开销很大，批量处理数据可以显著降低性能损耗
2. **提高吞吐量**：减少 CPU 和 I/O 设备之间的切换
3. **简化编程**：提供便捷的高层接口（如 Scanner）来处理按行读取等常见场景

### 为什么需要 bufio

直接使用原始 I/O（如 `os.File`）有几个缺点：

- 逐字节读写效率低下
- 没有便捷的按行读取、按单词读取等功能
- 每次读写都会触发系统调用

bufio 包在这些基础 I/O 操作上加了一层薄而高效的抽象，使得常见的 I/O 场景变得简单高效。

### 历史背景

bufio 包的设计深受 C 标准库（stdlib）中 `stdio` 的影响，但针对 Go 的特点做了优化：

- 充分利用 Go 的接口系统（`io.Reader`、`io.Writer`）
- 提供更现代的 API（如 `Scanner`）
- 良好的性能特性

---

## 核心原理

### 缓冲机制的工作原理

#### 读操作的缓冲流程

```
用户代码
    ↓
bufio.Reader (缓冲区维护)
    ↓
内存缓冲区 (默认 4096 字节)
    ↓
底层 io.Reader (如 os.File)
    ↓
操作系统内核
```

当调用 `Reader.Read()` 时：

1. **检查缓冲区**：如果缓冲区中还有数据，直接返回
2. **缓冲区为空**：触发一次系统调用，从底层 Reader 读取一大块数据到缓冲区
3. **返回数据**：从缓冲区返回用户请求的字节

#### 写操作的缓冲流程

```
用户代码
    ↓
bufio.Writer (缓冲区维护)
    ↓
内存缓冲区 (默认 4096 字节)
    ↓
底层 io.Writer (如 os.File)
    ↓
操作系统内核
```

当调用 `Writer.Write()` 时：

1. **写入缓冲区**：把数据放入缓冲区
2. **检查缓冲区**：如果缓冲区满或调用 `Flush()`，则进行一次系统调用
3. **写入底层**：把缓冲区中的数据写到底层 Writer

### 关键组件

#### Reader 结构体

```go
type Reader struct {
    buf          []byte  // 缓冲区
    rd           io.Reader  // 底层读取源
    r, w         int     // 读写位置
    err          error   // 缓存的错误
    lastByte     int     // 上一个字节（用于 Unread）
    lastRuneSize int     // 上一个 rune 的大小
}
```

关键字段说明：
- `buf`：缓冲区
- `r`：下一个可读字节的位置
- `w`：缓冲区中有效数据的末尾位置
- `rd`：底层数据源

#### Writer 结构体

```go
type Writer struct {
    buf []byte      // 缓冲区
    wr  io.Writer   // 底层写入目标
    n   int         // 缓冲区中已写入的字节数
    err error       // 缓存的错误
}
```

### Scanner 的工作机制

Scanner 是 bufio 包中最常用的高层接口，用于按某个分隔符（默认是换行符）扫描数据。

```go
type Scanner struct {
    r            io.Reader  // 底层读取源
    buf          []byte     // 缓冲区
    maxScanTokenSize int    // token 最大大小
    split        SplitFunc  // 分割函数
    // ... 其他字段
}
```

Scanner 的扫描流程：

1. **读取数据**：使用 `split` 函数定义的规则（如按行分割）
2. **缓冲管理**：当缓冲区不足时，自动扩展
3. **错误处理**：统一在 `Err()` 中返回错误

---

## 核心要点

### bufio 包的核心组件

1. **Reader**：缓冲读取器
   - 适合大量小读操作
   - 提供 `ReadLine()`、`ReadString()`、`ReadBytes()` 等便捷方法
   - 支持 `Unread()` 回退

2. **Writer**：缓冲写入器
   - 适合大量小写操作
   - 必须调用 `Flush()` 才能保证数据写出
   - 提供 `WriteString()` 等便捷方法

3. **Scanner**：分隔符扫描器
   - 最常用的按行读取工具
   - 自动处理不同的行尾格式（`\n`、`\r\n`）
   - 可自定义分割函数

4. **ReadWriter**：结合读写的包装器
   - 同时提供 Reader 和 Writer 的功能
   - 用于双向 I/O（如网络连接）

### 重要性质

| 特性 | Reader | Writer | Scanner |
|------|--------|--------|---------|
| 缓冲大小可定制 | ✓ | ✓ | ✓ |
| 自动错误缓存 | ✓ | ✓ | ✓ |
| 提供高层接口 | ✓ | ✓ | ✓ |
| 支持 Unread | ✓ | ✗ | ✗ |
| 按行读取 | ✓ | ✗ | ✓ |
| 自动缓冲区扩展 | ✗ | ✗ | ✓ |

### 缓冲区大小的选择

- **默认大小**：4096 字节
- **更大的缓冲区**（如 64KB）：适合大文件、高吞吐量场景
- **更小的缓冲区**（如 512 字节）：适合内存受限、低延迟场景
- **权衡原则**：缓冲区大小与延迟、内存占用的平衡

---

## 代码示例

### 使用 Scanner 按行读取文件

最常用的场景：

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    // 打开文件
    file, err := os.Open("input.txt")
    if err != nil {
        fmt.Println("打开文件失败:", err)
        return
    }
    defer file.Close()

    // 创建 Scanner，默认使用 ScanLines（按行分割）
    scanner := bufio.NewScanner(file)

    // 遍历每一行
    lineNum := 0
    for scanner.Scan() {
        lineNum++
        text := scanner.Text()  // 获取当前行（不包括换行符）
        fmt.Printf("行 %d: %s\n", lineNum, text)
    }

    // 检查是否出错
    if err := scanner.Err(); err != nil {
        fmt.Println("读取错误:", err)
    }
}
```

### 使用 Reader 读取数据

更灵活的底层方法：

```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    input := "Hello, World!\nHow are you?\n"
    reader := bufio.NewReader(strings.NewReader(input))

    // 按行读取
    for {
        line, err := reader.ReadString('\n')  // 读取到换行符
        if err != nil {
            if err.Error() != "EOF" {
                fmt.Println("读取错误:", err)
            }
            break
        }
        fmt.Print("读取: " + line)
    }
}
```

输出：
```
读取: Hello, World!
读取: How are you?
```

### 使用 Writer 写入数据

缓冲写入的示例：

```go
package main

import (
    "bufio"
    "os"
)

func main() {
    // 创建文件
    file, err := os.Create("output.txt")
    if err != nil {
        panic(err)
    }
    defer file.Close()

    // 创建 Writer
    writer := bufio.NewWriter(file)

    // 写入数据
    messages := []string{"Hello", "World", "Go", "bufio"}
    for _, msg := range messages {
        writer.WriteString(msg + "\n")
    }

    // 重要：必须 Flush 才能保证数据写入文件
    if err := writer.Flush(); err != nil {
        panic(err)
    }

    println("数据写入成功")
}
```

### 自定义 SplitFunc

按自定义分隔符读取：

```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    input := "apple,banana,cherry,date"

    // 创建 Scanner，使用逗号分割
    scanner := bufio.NewScanner(strings.NewReader(input))

    // 定义分割函数
    splitComma := func(data []byte, atEOF bool) (advance int, token []byte, err error) {
        // 查找逗号
        for i := 0; i < len(data); i++ {
            if data[i] == ',' {
                return i + 1, data[:i], nil
            }
        }
        if !atEOF {
            return 0, nil, nil  // 需要更多数据
        }
        return len(data), data, nil  // 返回最后一个 token
    }

    // 设置自定义分割函数
    scanner.Split(splitComma)

    // 扫描
    for scanner.Scan() {
        fmt.Printf("单词: %s\n", scanner.Text())
    }
}
```

输出：
```
单词: apple
单词: banana
单词: cherry
单词: date
```

### 读取大文件（避免 token 过大错误）

处理可能含有长行的文件：

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("large.txt")
    if err != nil {
        panic(err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)

    // 设置更大的 token 大小（默认 64KB）
    buf := make([]byte, 0, 64*1024)  // 64KB 初始缓冲区
    scanner.Buffer(buf, 1024*1024)   // 最大 1MB

    lineNum := 0
    for scanner.Scan() {
        lineNum++
        if lineNum%10000 == 0 {
            fmt.Printf("已读取 %d 行\n", lineNum)
        }
    }

    if err := scanner.Err(); err != nil {
        fmt.Println("错误:", err)
    }

    fmt.Printf("总共 %d 行\n", lineNum)
}
```

### ReadWriter 双向 I/O

适用于网络连接等场景：

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "strings"
)

func main() {
    // 创建一个双向的管道（用于演示）
    r := strings.NewReader("Hello\nWorld\n")

    // 模拟读写器
    rw := bufio.NewReadWriter(
        bufio.NewReader(r),
        bufio.NewWriter(os.Stdout),
    )

    // 从 rw 中读取
    for {
        line, err := rw.Reader.ReadString('\n')
        if err == io.EOF {
            break
        }
        if err != nil {
            panic(err)
        }

        // 处理并写入
        fmt.Fprintf(rw.Writer, "处理: %s", line)
    }

    // 刷新输出
    rw.Writer.Flush()
}
```

### 逐字读取和 Peek

```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    input := "Hello"
    reader := bufio.NewReader(strings.NewReader(input))

    // Peek：查看接下来的 n 个字节而不消费它们
    peek, _ := reader.Peek(3)
    fmt.Printf("Peek(3): %s\n", peek)

    // ReadByte：读取单个字节
    byte1, _ := reader.ReadByte()
    fmt.Printf("ReadByte: %c\n", byte1)

    // ReadRune：读取一个 UTF-8 字符
    rune1, size, _ := reader.ReadRune()
    fmt.Printf("ReadRune: %c (size: %d)\n", rune1, size)

    // UnreadByte：回退上一个字节
    reader.UnreadByte()
    fmt.Println("After UnreadByte, Peek(1):", string(reader.Peek(1)))
}
```

输出：
```
Peek(3): Hel
ReadByte: H
ReadRune: e (size: 1)
After UnreadByte, Peek(1): e
```

---

## 最佳实践

### 始终处理错误

```go
// 不好
for scanner.Scan() {
    // 处理
}

// 好
for scanner.Scan() {
    // 处理
}
if err := scanner.Err(); err != nil {
    log.Fatalf("扫描错误: %v", err)
}
```

### 记住 Flush Writer

```go
// 不好
writer := bufio.NewWriter(file)
writer.WriteString("data")
// 忘记 Flush，数据可能未写入

// 好
writer := bufio.NewWriter(file)
defer writer.Flush()  // 确保写入
writer.WriteString("data")
```

### 适当设置缓冲区大小

```go
// 默认 4KB - 适合大多数场景
reader := bufio.NewReader(file)

// 大文件：使用更大的缓冲区
largeReader := bufio.NewReaderSize(file, 64*1024)

// 内存受限：使用较小的缓冲区
smallReader := bufio.NewReaderSize(file, 1024)
```

### 使用 Scanner 处理文本行

```go
// Scanner 自动处理各种行尾格式（\n, \r\n）
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    line := scanner.Text()  // 行尾符已去除
    // 处理 line
}

// 如果需要保留行尾，使用 Reader
reader := bufio.NewReader(file)
for {
    line, err := reader.ReadString('\n')
    if err != nil && err != io.EOF {
        break
    }
    // line 包含 \n
}
```

### 处理超长行的问题

```go
// 如果文件包含可能很长的行，需要设置最大 token 大小
scanner := bufio.NewScanner(file)
buf := make([]byte, 0, 64*1024)
scanner.Buffer(buf, 512*1024)  // 最大 512KB 的行

for scanner.Scan() {
    line := scanner.Text()
}

// 检查是否因为行过长而出错
if err := scanner.Err(); err != nil {
    if err == bufio.ErrTooLong {
        fmt.Println("行太长")
    }
}
```

### 性能关键场景

```go
// 对于高性能应用，使用更大的缓冲区减少系统调用
reader := bufio.NewReaderSize(file, 256*1024)  // 256KB

// 对于 CSV/日志处理，可能需要自定义 split 函数来提高性能
scanner := bufio.NewScanner(file)
scanner.Split(customSplit)  // 比默认 ScanLines 可能更快
```

### 在 goroutine 中的使用

```go
// Reader/Writer 不是并发安全的
// 如果在多个 goroutine 中使用，需要同步

reader := bufio.NewReader(conn)
mu := sync.Mutex{}

// 在 goroutine 中使用
go func() {
    mu.Lock()
    defer mu.Unlock()
    // 使用 reader
}()
```

---

## 常见陷阱

### 忘记 Flush Writer

```go
// 错误
writer := bufio.NewWriter(file)
writer.WriteString("important data")
file.Close()  // 数据可能丢失！

// 正确
writer := bufio.NewWriter(file)
writer.WriteString("important data")
writer.Flush()  // 必须显式 Flush
file.Close()
```

### 错误地理解 Peek

```go
reader := bufio.NewReader(source)

// 错误：以为 Peek 会移动位置
bytes, _ := reader.Peek(10)
// 下一次 Read 仍然从同一位置读取！

// 正确用法
bytes, _ := reader.Peek(10)  // 查看接下来的数据
// ... 根据内容决定如何读取
```

### Scanner 的 token 过长错误

```go
// 错误：如果文件包含很长的行，会报错
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    // 如果某一行超过 64KB，会失败
}

// 正确：提前设置最大 token 大小
buf := make([]byte, 0, 64*1024)
scanner.Buffer(buf, 1024*1024)  // 最大 1MB
```

### 混淆 Text() 和 Bytes()

```go
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    text := scanner.Text()    // 返回 string，已去除换行符
    bytes := scanner.Bytes()  // 返回 []byte，已去除换行符

    // 两者都是 token 本身，不包含分隔符
}
```

### Reader 中的 UnreadRune 误用

```go
reader := bufio.NewReader(source)

// 错误：混淆 UnreadByte 和 UnreadRune
r, size, _ := reader.ReadRune()
reader.UnreadByte()  // 错误！应该是 UnreadRune
reader.UnreadRune()  // 正确

// UnreadRune 只能在 ReadRune 之后使用
```

### 假设 NewScanner 会自动关闭底层资源

```go
// 错误
file, _ := os.Open("file.txt")
scanner := bufio.NewScanner(file)
// ... 使用 scanner
// 忘记关闭 file

// 正确
file, _ := os.Open("file.txt")
defer file.Close()
scanner := bufio.NewScanner(file)
```

### ReadString 的行为误解

```go
reader := bufio.NewReader(source)

// ReadString 返回包含分隔符的数据
line, _ := reader.ReadString('\n')
// line 末尾包含 '\n'

// Scanner.Text() 返回不包含分隔符的数据
scanner := bufio.NewScanner(source)
scanner.Scan()
text := scanner.Text()
// text 末尾不包含换行符
```

---

## 性能考量

### 缓冲区大小的性能影响

```go
package main

import (
    "bufio"
    "os"
    "testing"
)

func BenchmarkReadSizes(b *testing.B) {
    file, _ := os.Open("large_file.txt")
    defer file.Close()

    benchmarks := []struct {
        name string
        size int
    }{
        {"1KB", 1024},
        {"4KB", 4096},
        {"64KB", 64 * 1024},
        {"256KB", 256 * 1024},
    }

    for _, bm := range benchmarks {
        b.Run(bm.name, func(b *testing.B) {
            file.Seek(0, 0)
            reader := bufio.NewReaderSize(file, bm.size)

            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                file.Seek(0, 0)
                reader.Reset(file)
                for {
                    _, err := reader.ReadByte()
                    if err != nil {
                        break
                    }
                }
            }
        })
    }
}
```

**性能观察**：
- 很小的缓冲区（1KB）：频繁系统调用，性能差
- 中等缓冲区（4-64KB）：性能最优，是 4KB 的数倍
- 很大的缓冲区（>256KB）：收益递减，且占用更多内存

### Reader vs Scanner 性能对比

```go
// Reader 性能优于 Scanner（当不需要便捷的 split 时）
// Reader：直接操作字节，更快
reader := bufio.NewReader(file)
for {
    b, _ := reader.ReadByte()
    // 处理
}

// Scanner：需要额外的 token 分割和 string 转换
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    text := scanner.Text()
    // 处理
}
```

性能差异通常在 10-30% 之间，根据使用场景而定。

### 避免过度缓冲

```go
// 不好：为每个操作创建新的 Reader
for _, filename := range files {
    file, _ := os.Open(filename)
    reader := bufio.NewReader(file)
    // 使用
    file.Close()
}

// 好：重用 Reader
reader := bufio.NewReader(nil)
for _, filename := range files {
    file, _ := os.Open(filename)
    reader.Reset(file)
    // 使用
    file.Close()
}
```

### 内存分配优化

```go
// 批量操作时，避免频繁的内存分配
scanner := bufio.NewScanner(file)
scanner.Buffer(make([]byte, 64*1024), 1024*1024)

// 如果需要修改读出的数据，提前分配
buf := make([]byte, 64*1024)
reader := bufio.NewReaderSize(file, len(buf))
```

### 系统调用减少的效果

```
场景：读取 1GB 文件

直接读取（每次 1 字节）：
- 系统调用次数：1,000,000,000 次
- 耗时：极长

使用 bufio（4KB 缓冲）：
- 系统调用次数：250,000 次
- 耗时：基准的 1/1000

减少了 99.975% 的系统调用！
```

---

## 实战场景

### 场景 1：日志文件处理

```go
package main

import (
    "bufio"
    "fmt"
    "log"
    "os"
    "strings"
)

func processLogs(filename string, pattern string) {
    file, err := os.Open(filename)
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)

    lineNum := 0
    matchCount := 0

    for scanner.Scan() {
        lineNum++
        line := scanner.Text()

        if strings.Contains(line, pattern) {
            matchCount++
            fmt.Printf("第 %d 行: %s\n", lineNum, line)
        }
    }

    if err := scanner.Err(); err != nil {
        log.Fatal(err)
    }

    fmt.Printf("总行数: %d, 匹配: %d\n", lineNum, matchCount)
}

func main() {
    processLogs("app.log", "ERROR")
}
```

### 场景 2：CSV 数据处理

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func readCSV(filename string) {
    file, _ := os.Open(filename)
    defer file.Close()

    scanner := bufio.NewScanner(file)

    // 自定义分割函数：处理 CSV 的逗号分割
    scanner.Split(bufio.ScanLines)

    headers := []string{}
    rowNum := 0

    for scanner.Scan() {
        line := scanner.Text()

        if rowNum == 0 {
            // 解析header
            headers = strings.Split(line, ",")
            fmt.Println("Headers:", headers)
        } else {
            // 解析数据行
            values := strings.Split(line, ",")

            // 创建行数据
            row := make(map[string]string)
            for i, header := range headers {
                if i < len(values) {
                    row[header] = values[i]
                }
            }

            fmt.Printf("Row %d: %v\n", rowNum, row)
        }

        rowNum++
    }
}

func main() {
    readCSV("data.csv")
}
```

### 场景 3：实时流处理

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "sync"
)

// StreamProcessor 处理来自管道的数据流
type StreamProcessor struct {
    input chan string
    wg    sync.WaitGroup
}

func (sp *StreamProcessor) processStream(reader io.Reader) {
    sp.wg.Add(1)
    go func() {
        defer sp.wg.Done()

        scanner := bufio.NewScanner(reader)

        for scanner.Scan() {
            line := scanner.Text()
            sp.input <- line
        }

        close(sp.input)
    }()
}

func (sp *StreamProcessor) process(processor func(string)) {
    sp.wg.Add(1)
    go func() {
        defer sp.wg.Done()

        for line := range sp.input {
            processor(line)
        }
    }()
}

func (sp *StreamProcessor) wait() {
    sp.wg.Wait()
}

func main() {
    // 示例用法
    processor := &StreamProcessor{
        input: make(chan string),
    }

    // 处理数据
    processor.process(func(line string) {
        fmt.Println("处理:", line)
    })

    processor.wait()
}
```

### 场景 4：网络数据解析

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "net"
)

func handleConnection(conn net.Conn) {
    defer conn.Close()

    // 创建读写器
    reader := bufio.NewReader(conn)
    writer := bufio.NewWriter(conn)
    defer writer.Flush()

    for {
        // 读取一行命令
        line, err := reader.ReadString('\n')
        if err != nil {
            if err != io.EOF {
                fmt.Println("读取错误:", err)
            }
            break
        }

        // 处理命令
        result := processCommand(line)

        // 写入响应
        writer.WriteString(result + "\n")
    }
}

func processCommand(cmd string) string {
    // 处理逻辑
    return "OK: " + cmd
}

func main() {
    // 监听连接
    ln, _ := net.Listen("tcp", ":8080")
    defer ln.Close()

    for {
        conn, _ := ln.Accept()
        go handleConnection(conn)
    }
}
```

### 场景 5：大文件分块处理

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func processLargeFileInChunks(filename string, chunkSize int, processor func([]byte)) {
    file, _ := os.Open(filename)
    defer file.Close()

    reader := bufio.NewReaderSize(file, chunkSize)
    buffer := make([]byte, chunkSize)

    for {
        n, err := reader.Read(buffer)
        if n > 0 {
            processor(buffer[:n])
        }

        if err != nil {
            break
        }
    }
}

func main() {
    processLargeFileInChunks("huge_file.bin", 1024*1024, func(chunk []byte) {
        // 处理 1MB 的数据块
        fmt.Printf("处理 %d 字节的数据块\n", len(chunk))
    })
}
```

---

## 面试要点

### 问题 1: 什么是缓冲 I/O，为什么需要它？

**回答要点**：
- 缓冲 I/O 使用内存缓冲区减少系统调用次数
- 系统调用开销大，批量处理可显著提高性能
- bufio 包在原始 I/O 基础上提供高层接口（如 Scanner）

**示例**：
```
直接读取 1GB 文件（每次 1 字节）：10 亿次系统调用
使用 4KB 缓冲：250 万次系统调用
性能提升：> 1000 倍
```

### 问题 2: Reader 和 Scanner 的区别？

**回答**：
| 特性 | Reader | Scanner |
|------|--------|---------|
| 底层操作 | 直接字节 | token 分割 |
| 性能 | 稍快 | 稍慢（包装层） |
| 易用性 | 较低 | 高（自动分割） |
| 行处理 | 需手工处理 `\r\n` | 自动处理 |
| 使用场景 | 需要精细控制时 | 按行/按词读取 |

### 问题 3: Writer.Flush() 的作用？

**回答**：
- bufio.Writer 缓存数据在内存中
- 只有调用 Flush() 或缓冲区满时，才会写入底层 io.Writer
- 忘记 Flush() 会导致数据丢失（如文件未同步）
- defer writer.Flush() 是最佳实践

### 问题 4: Scanner 的 token 过长会发生什么？

**回答**：
- Scanner 有最大 token 大小限制（默认 64KB）
- 如果某行超过限制，会报 `bufio.ErrTooLong`
- 解决方案：使用 `scanner.Buffer()` 设置更大的限制

```go
buf := make([]byte, 0, 64*1024)
scanner.Buffer(buf, 512*1024)  // 最大 512KB
```

### 问题 5: bufio 包在并发环境中使用需要注意什么？

**回答**：
- Reader/Writer 不是并发安全的
- 多个 goroutine 访问需要同步（如 sync.Mutex）
- 网络连接中，通常在单个 goroutine 中读，另一个写

```go
mu := sync.Mutex{}
reader := bufio.NewReader(conn)

go func() {
    mu.Lock()
    defer mu.Unlock()
    reader.ReadString('\n')
}()
```

### 问题 6: 如何最优化文件读取性能？

**回答要点**：
1. 选择合适的缓冲区大小（通常 64KB）
2. 避免频繁创建新的 Reader
3. 使用 Reader 而非 Scanner（如果不需要自动分割）
4. 预分配缓冲区避免重复分配

```go
// 好的做法
reader := bufio.NewReaderSize(file, 64*1024)
buf := make([]byte, 0, 64*1024)
reader.Buffer(buf, 256*1024)
```

### 问题 7: Peek() 方法的典型用途？

**回答**：
- Peek(n) 查看接下来 n 个字节而不消费
- 常用于解析协议或判断数据格式后再决定如何读取
- 例如：HTTP 请求解析前检查请求行

```go
reader := bufio.NewReader(conn)

// 检查协议版本
versionByte, _ := reader.Peek(1)
if versionByte[0] == 'H' {
    // HTTP 协议
} else {
    // 其他协议
}
```

---

## 延伸阅读

### 官方资源

- [Go bufio 包官方文档](https://golang.org/pkg/bufio/)
- [Go io 包（bufio 的依赖）](https://golang.org/pkg/io/)
- [Effective Go - I/O 部分](https://golang.org/doc/effective_go#io)

### 相关标准库

- **io 包**：I/O 接口定义（Reader, Writer, Closer）
- **os 包**：文件和系统交互
- **fmt 包**：格式化输入输出
- **encoding 包**：各种编码（JSON, XML, CSV）

### 性能优化

- [Go 性能优化指南 - I/O 部分](https://go.dev/doc/diagnostics)
- [pprof - Go 性能分析工具](https://github.com/google/pprof)
- [Go Memory Model](https://golang.org/ref/mem)

### 进阶概念

- **io.MultiReader/MultiWriter**：组合多个读写器
- **sync.Pool**：对象池优化频繁分配
- **bytes.Buffer**：内存缓冲区（vs 文件缓冲）
- **gzip/bzip2**：配合 bufio 进行流压缩

### 常见问题讨论

- Go 官方论坛上的 bufio 讨论
- Go Reddit 社区的最佳实践
- GitHub 开源项目中 bufio 的实际应用（如日志库、数据处理库）

### 推荐阅读顺序

1. **入门**：官方文档 + 基础示例
2. **进阶**：自定义 SplitFunc + 性能优化
3. **精通**：源码分析 + 并发编程 + 实战应用

### 相关话题

- **Streaming**：流式处理大数据
- **Network Programming**：网络编程中的应用
- **File I/O**：文件操作的各种场景
- **Text Processing**：文本处理和解析

---

**最后更新**：2024 年 1 月
**难度等级**：中级
**核心知识点**：缓冲机制、Reader/Writer/Scanner、自定义分割、性能优化
