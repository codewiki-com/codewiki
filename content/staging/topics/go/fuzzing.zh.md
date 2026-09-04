---
title: Go 模糊测试 (Fuzzing)
description: Go 语言内置模糊测试完全指南：自动化测试输入生成，发现代码中的边界情况和潜在漏洞
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - 模糊测试
  - 测试
  - 安全
  - 质量保证
status: imported
origin: old/src/content/docs/go/fuzzing.zh.md
divergence: 0.245
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 52
  lastUpdated: 2026-01-22
---

模糊测试（Fuzzing）是一种自动化测试技术，通过生成随机输入来发现 bug、崩溃和安全漏洞。Go 1.18 引入了原生模糊测试支持，使得发现传统单元测试可能遗漏的边界情况变得容易。

## 概念解释

传统测试使用预定义的输入，而模糊测试自动生成成千上万甚至数百万个输入来发现意外行为。模糊器由代码覆盖率引导，学习哪些输入探索了新的代码路径，并变异它们以发现更多路径。

Go 的模糊测试引擎维护一个有趣输入的语料库，并不断变异它们以最大化代码覆盖率。当它发现导致崩溃或意外行为的输入时，会将输入最小化为最小的复现案例，并保存以供未来回归测试。

```go
package main

import (
    "testing"
    "unicode/utf8"
)

// FuzzReverse 使用随机输入测试 Reverse 函数
func FuzzReverse(f *testing.F) {
    // 添加种子语料库条目
    f.Add("hello")
    f.Add("world")
    f.Add("")
    f.Add("!12345")

    // 模糊目标函数
    f.Fuzz(func(t *testing.T, orig string) {
        rev := Reverse(orig)
        doubleRev := Reverse(rev)

        // 属性：两次反转应返回原始值
        if orig != doubleRev {
            t.Errorf("Reverse(Reverse(%q)) = %q, 期望 %q", orig, doubleRev, orig)
        }

        // 属性：长度应保持不变
        if utf8.RuneCountInString(orig) != utf8.RuneCountInString(rev) {
            t.Errorf("长度不匹配: %q 有 %d 个 rune，反转后有 %d 个",
                orig, utf8.RuneCountInString(orig), utf8.RuneCountInString(rev))
        }
    })
}

func Reverse(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}
```

## 核心原理

### 模糊测试结构

模糊测试有与常规测试不同的特定结构：

```go
package main

import "testing"

// 模糊测试函数必须以 "Fuzz" 开头
func FuzzMyFunction(f *testing.F) {
    // 1. 种子语料库 - 开始模糊测试的初始输入
    f.Add([]byte("initial input"))
    f.Add([]byte("another input"))

    // 2. 模糊目标 - 接收生成的输入
    f.Fuzz(func(t *testing.T, data []byte) {
        // 使用生成的数据测试你的函数
        result := MyFunction(data)

        // 检查不变量 - 应该始终成立的属性
        if len(result) < 0 {
            t.Error("不可能：负长度")
        }
    })
}
```

### 支持的类型

模糊测试引擎可以生成以下类型：

```go
func FuzzSupportedTypes(f *testing.F) {
    // 使用示例值作为种子
    f.Add("string", []byte("bytes"), int(42), int8(1), int16(2),
          int32(3), int64(4), uint(5), uint8(6), uint16(7),
          uint32(8), uint64(9), rune('r'), float32(1.5),
          float64(2.5), true)

    f.Fuzz(func(t *testing.T,
        s string,
        b []byte,
        i int,
        i8 int8,
        i16 int16,
        i32 int32,
        i64 int64,
        u uint,
        u8 uint8,
        u16 uint16,
        u32 uint32,
        u64 uint64,
        r rune,
        f32 float32,
        f64 float64,
        bl bool,
    ) {
        // 使用所有这些类型测试
    })
}
```

### 覆盖率引导的模糊测试

模糊器跟踪代码覆盖率以找到有趣的输入：

```go
package parser

import "testing"

func FuzzParse(f *testing.F) {
    // 使用有效输入作为种子
    f.Add(`{"name": "test"}`)
    f.Add(`{"array": [1,2,3]}`)
    f.Add(`{"nested": {"key": "value"}}`)

    f.Fuzz(func(t *testing.T, input string) {
        // 模糊器将尝试最大化代码覆盖率
        // 它会找到到达新分支的输入
        result, err := Parse(input)

        if err == nil {
            // 如果解析成功，验证结果
            if result == nil {
                t.Error("解析成功但结果为 nil")
            }
        }
        // 对于无效输入，错误是预期的 - 不是 bug
    })
}
```

## 关键概念

### 运行模糊测试

```bash
# 运行模糊测试 30 秒
go test -fuzz=FuzzReverse -fuzztime=30s

# 无限期运行模糊测试
go test -fuzz=FuzzReverse

# 使用特定持续时间运行模糊测试
go test -fuzz=FuzzReverse -fuzztime=1m

# 使用迭代次数运行模糊测试
go test -fuzz=FuzzReverse -fuzztime=10000x

# 作为常规测试运行所有模糊测试（仅使用种子语料库）
go test -v

# 作为常规测试运行特定模糊测试
go test -run=FuzzReverse

# 并行模糊测试
go test -fuzz=FuzzReverse -parallel=4
```

### 语料库管理

模糊器将有趣的输入保存到语料库：

```
testdata/
└── fuzz/
    └── FuzzReverse/
        ├── 2b3c7e8a9f1d4e5b  # 二进制哈希文件名
        ├── 8f7e6d5c4b3a2910
        └── corpus/          # 种子语料库（检入源代码控制）
            ├── input1.txt
            └── input2.txt
```

```go
package main

import (
    "os"
    "path/filepath"
    "testing"
)

func FuzzWithCorpus(f *testing.F) {
    // 从文件加载语料库
    corpusDir := filepath.Join("testdata", "corpus")
    entries, err := os.ReadDir(corpusDir)
    if err == nil {
        for _, entry := range entries {
            if !entry.IsDir() {
                data, err := os.ReadFile(filepath.Join(corpusDir, entry.Name()))
                if err == nil {
                    f.Add(data)
                }
            }
        }
    }

    f.Fuzz(func(t *testing.T, data []byte) {
        // 测试函数
    })
}
```

### 基于属性的测试

当测试属性时，模糊测试最有效：

```go
package main

import (
    "encoding/json"
    "testing"
)

type User struct {
    Name  string `json:"name"`
    Age   int    `json:"age"`
    Email string `json:"email"`
}

func FuzzJSONRoundTrip(f *testing.F) {
    // 使用示例用户作为种子
    f.Add("Alice", 30, "alice@example.com")
    f.Add("", 0, "")
    f.Add("Bob Smith", -1, "invalid")

    f.Fuzz(func(t *testing.T, name string, age int, email string) {
        original := User{Name: name, Age: age, Email: email}

        // 序列化为 JSON
        data, err := json.Marshal(original)
        if err != nil {
            // 某些输入可能不是有效的 JSON（例如无效的 UTF-8）
            return
        }

        // 反序列化回来
        var decoded User
        if err := json.Unmarshal(data, &decoded); err != nil {
            t.Fatalf("Unmarshal 失败: %v", err)
        }

        // 属性：往返应该保持数据不变
        if original != decoded {
            t.Errorf("往返不匹配:\n原始: %+v\n解码: %+v", original, decoded)
        }
    })
}
```

## 代码示例

### 模糊测试解析器

```go
package parser

import (
    "testing"
)

// 表达式解析器模糊测试
func FuzzExpressionParser(f *testing.F) {
    // 使用有效表达式作为种子
    f.Add("1 + 2")
    f.Add("(3 * 4) - 5")
    f.Add("10 / 2 + 3")
    f.Add("-5")
    f.Add("((1))")

    // 使用边界情况作为种子
    f.Add("")
    f.Add("   ")
    f.Add("+++")
    f.Add("1 ++ 2")

    f.Fuzz(func(t *testing.T, expr string) {
        result, err := ParseExpression(expr)

        if err == nil {
            // 如果解析成功，求值不应该 panic
            func() {
                defer func() {
                    if r := recover(); r != nil {
                        t.Errorf("对有效表达式 %q 求值时 panic: %v", expr, r)
                    }
                }()
                _ = result.Evaluate()
            }()
        }
    })
}

// URL 解析器模糊测试
func FuzzURLParser(f *testing.F) {
    f.Add("https://example.com/path?query=value#fragment")
    f.Add("http://user:pass@host:8080/")
    f.Add("ftp://files.example.com/file.txt")
    f.Add("")
    f.Add("not-a-url")
    f.Add("://missing-scheme")

    f.Fuzz(func(t *testing.T, urlStr string) {
        parsed, err := ParseURL(urlStr)

        if err == nil {
            // 属性：ToString 应该产生可解析的输出
            reparsed, err2 := ParseURL(parsed.ToString())
            if err2 != nil {
                t.Errorf("重新解析失败: %v", err2)
            }

            // 属性：有效 URL 的 Scheme 不应该为空
            if parsed.Scheme == "" {
                t.Error("有效 URL 的 scheme 为空")
            }
        }
    })
}
```

### 模糊测试二进制协议

```go
package protocol

import (
    "bytes"
    "testing"
)

func FuzzMessageDecoder(f *testing.F) {
    // 有效消息格式: [length:4][type:1][payload:length]
    validMsg := []byte{0, 0, 0, 5, 1, 'h', 'e', 'l', 'l', 'o'}
    f.Add(validMsg)

    // 边界情况
    f.Add([]byte{})                    // 空
    f.Add([]byte{0, 0, 0, 0, 1})      // 零长度
    f.Add([]byte{255, 255, 255, 255}) // 巨大长度
    f.Add([]byte{0, 0, 0, 10, 1})     // 截断

    f.Fuzz(func(t *testing.T, data []byte) {
        msg, err := DecodeMessage(data)

        if err == nil {
            // 属性：重新编码应产生相同的字节
            encoded := msg.Encode()

            // 解码编码的消息
            msg2, err := DecodeMessage(encoded)
            if err != nil {
                t.Fatalf("重新解码失败: %v", err)
            }

            // 比较
            if msg.Type != msg2.Type || !bytes.Equal(msg.Payload, msg2.Payload) {
                t.Error("往返不匹配")
            }
        }
    })
}
```

### 模糊测试并发代码

```go
package concurrent

import (
    "sync"
    "testing"
)

func FuzzConcurrentMap(f *testing.F) {
    f.Add("key1", "value1", 4)
    f.Add("", "", 1)
    f.Add("long-key-name", "long-value-data", 8)

    f.Fuzz(func(t *testing.T, key, value string, goroutines int) {
        if goroutines < 1 {
            goroutines = 1
        }
        if goroutines > 100 {
            goroutines = 100
        }

        m := NewConcurrentMap()
        var wg sync.WaitGroup

        // 并发写入
        for i := 0; i < goroutines; i++ {
            wg.Add(1)
            go func(id int) {
                defer wg.Done()
                m.Set(key, value)
                m.Get(key)
                m.Delete(key)
            }(i)
        }

        wg.Wait()

        // Map 应该处于一致状态
        // 没有 panic = 测试通过
    })
}
```

### 安全性模糊测试

```go
package security

import (
    "testing"
)

func FuzzSQLQueryBuilder(f *testing.F) {
    // 正常输入
    f.Add("users", "id", "123")
    f.Add("products", "name", "widget")

    // SQL 注入尝试
    f.Add("users", "id", "1; DROP TABLE users;--")
    f.Add("users", "id", "' OR '1'='1")
    f.Add("users", "id", "1 UNION SELECT * FROM passwords")

    f.Fuzz(func(t *testing.T, table, column, value string) {
        query := BuildQuery(table, column, value)

        // 检查 SQL 注入漏洞
        dangerousPatterns := []string{
            "DROP", "DELETE", "UPDATE", "INSERT",
            "UNION", "--", ";", "'",
        }

        // 查询应该是参数化的，不应该包含原始值
        for _, pattern := range dangerousPatterns {
            if containsRaw(query, pattern, value) {
                t.Errorf("潜在的 SQL 注入: 查询包含未转义的 %q", pattern)
            }
        }
    })
}

func FuzzXSSPrevention(f *testing.F) {
    f.Add("<script>alert('xss')</script>")
    f.Add("<img src=x onerror=alert(1)>")
    f.Add("javascript:alert(1)")
    f.Add("<div onmouseover='alert(1)'>")

    f.Fuzz(func(t *testing.T, input string) {
        sanitized := SanitizeHTML(input)

        // 检查危险模式是否已移除
        if containsUnsafe(sanitized) {
            t.Errorf("净化后的输出仍包含危险内容: %q", sanitized)
        }
    })
}
```

## 最佳实践

### 1. 为可模糊测试性设计

```go
package main

// 好：函数接受简单类型
func ProcessData(data []byte) (Result, error) {
    // 容易模糊测试
    return parse(data)
}

// 较差：复杂的输入类型
func ProcessRequest(req *ComplexRequest) (Result, error) {
    // 更难直接模糊测试
    return handle(req)
}

// 解决方案：为模糊测试创建包装器
func FuzzProcessRequest(f *testing.F) {
    f.Add([]byte(`{"field": "value"}`))

    f.Fuzz(func(t *testing.T, data []byte) {
        // 反序列化为复杂类型
        var req ComplexRequest
        if err := json.Unmarshal(data, &req); err != nil {
            return // 跳过无效输入
        }

        // 现在用有效的复杂输入测试
        _, _ = ProcessRequest(&req)
    })
}
```

### 2. 专注于不变量

```go
func FuzzSortedList(f *testing.F) {
    f.Add([]byte{3, 1, 4, 1, 5, 9, 2, 6})

    f.Fuzz(func(t *testing.T, data []byte) {
        // 转换为 int 切片
        ints := make([]int, len(data))
        for i, b := range data {
            ints[i] = int(b)
        }

        sorted := SortedList(ints)

        // 不变量 1：输出长度等于输入长度
        if len(sorted) != len(ints) {
            t.Errorf("长度变化: %d -> %d", len(ints), len(sorted))
        }

        // 不变量 2：输出已排序
        for i := 1; i < len(sorted); i++ {
            if sorted[i] < sorted[i-1] {
                t.Errorf("在索引 %d 处未排序: %d > %d", i, sorted[i-1], sorted[i])
            }
        }

        // 不变量 3：相同的元素（多重集相等）
        if !sameElements(ints, sorted) {
            t.Error("元素发生变化")
        }
    })
}
```

### 3. 优雅处理预期的失败

```go
func FuzzParser(f *testing.F) {
    f.Add("valid input")

    f.Fuzz(func(t *testing.T, input string) {
        result, err := Parse(input)

        // 不要在预期错误上失败
        if err != nil {
            // 对于无效输入这是预期的
            // 只需确保错误处理不会 panic
            return
        }

        // 只对成功解析检查不变量
        if result == nil {
            t.Error("解析成功但结果为 nil")
        }
    })
}
```

### 4. 有效使用种子语料库

```go
func FuzzImageDecoder(f *testing.F) {
    // 添加真实图像文件作为种子
    testImages := []string{
        "testdata/small.png",
        "testdata/large.jpg",
        "testdata/animated.gif",
        "testdata/transparent.png",
    }

    for _, path := range testImages {
        data, err := os.ReadFile(path)
        if err != nil {
            continue
        }
        f.Add(data)
    }

    // 添加精心设计的边界情况
    f.Add([]byte{})                    // 空
    f.Add([]byte{0x89, 0x50, 0x4E, 0x47}) // 仅 PNG 魔数
    f.Add([]byte{0xFF, 0xD8, 0xFF})    // 仅 JPEG 魔数

    f.Fuzz(func(t *testing.T, data []byte) {
        img, format, err := DecodeImage(data)

        if err == nil {
            // 验证解码的图像
            if img.Bounds().Empty() {
                t.Error("解码的图像边界为空")
            }
            if format == "" {
                t.Error("有效图像的格式不应该为空")
            }
        }
    })
}
```

## 常见陷阱

### 1. 不检查不变量

```go
// 错误：只是运行函数
func FuzzBadExample(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        _ = Process(s) // 我们在测试什么？
    })
}

// 正确：检查有意义的属性
func FuzzGoodExample(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        result := Process(s)

        // 属性：结果应该是大写
        if result != strings.ToUpper(result) {
            t.Errorf("结果不是大写: %q", result)
        }

        // 属性：长度不应该减少
        if len(result) < len(s) {
            t.Errorf("结果比输入短")
        }
    })
}
```

### 2. 过于严格的断言

```go
// 错误：在有效的边界情况上失败
func FuzzTooStrict(f *testing.F) {
    f.Add(5)
    f.Fuzz(func(t *testing.T, n int) {
        result := Compute(n)
        if result < 0 {
            t.Error("负结果") // 但负输入是有效的！
        }
    })
}

// 正确：考虑边界情况
func FuzzFlexible(f *testing.F) {
    f.Add(5)
    f.Fuzz(func(t *testing.T, n int) {
        result := Compute(n)

        // 属性：非零时符号应该保持
        if n > 0 && result <= 0 {
            t.Error("正输入给出非正结果")
        }
        if n < 0 && result >= 0 {
            t.Error("负输入给出非负结果")
        }
    })
}
```

### 3. 缺少超时处理

```go
// 错误：可能在病态输入上挂起
func FuzzNoTimeout(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        // 对于某些输入可能永远不会结束
        result := SlowProcess(s)
        _ = result
    })
}

// 正确：使用带超时的 context
func FuzzWithTimeout(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        ctx, cancel := context.WithTimeout(context.Background(), time.Second)
        defer cancel()

        result, err := ProcessWithContext(ctx, s)
        if err == context.DeadlineExceeded {
            // 输入导致超时 - 可能值得调查
            return
        }

        // 检查属性
        _ = result
    })
}
```

### 4. 忽略语料库失败

```bash
# 当模糊测试发现失败时，它会保存输入
# testdata/fuzz/FuzzReverse/abc123...

# 错误：删除失败并继续
rm testdata/fuzz/FuzzReverse/abc123...

# 正确：修复 bug，保留语料库条目用于回归测试
# 该输入将在每次 'go test' 调用时运行
```

## 性能考虑

### 优化模糊目标

```go
// 错误：慢的模糊目标
func FuzzSlow(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        // 每次迭代都有昂贵的设置
        db := connectToDatabase()
        defer db.Close()

        result := query(db, s)
        _ = result
    })
}

// 正确：最小化每次迭代的开销
var testDB *sql.DB

func FuzzFast(f *testing.F) {
    // 一次性设置
    var err error
    testDB, err = connectToDatabase()
    if err != nil {
        f.Fatal(err)
    }
    f.Cleanup(func() { testDB.Close() })

    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        // 使用共享资源
        result := query(testDB, s)
        _ = result
    })
}
```

### 资源限制

```go
func FuzzResourceLimited(f *testing.F) {
    f.Add([]byte("input"))

    f.Fuzz(func(t *testing.T, data []byte) {
        // 限制输入大小以防止 OOM
        if len(data) > 1024*1024 { // 最大 1MB
            return
        }

        // 限制分配
        result := ProcessWithLimit(data, MaxAllocation)
        _ = result
    })
}
```

## 实际场景

### 模糊测试压缩库

```go
func FuzzCompression(f *testing.F) {
    // 使用各种数据模式作为种子
    f.Add([]byte("hello world"))
    f.Add([]byte(strings.Repeat("a", 1000)))
    f.Add(make([]byte, 0))

    // 类似随机的数据
    randomData := make([]byte, 256)
    for i := range randomData {
        randomData[i] = byte(i)
    }
    f.Add(randomData)

    f.Fuzz(func(t *testing.T, original []byte) {
        // 压缩
        compressed, err := Compress(original)
        if err != nil {
            return // 某些输入可能无法压缩
        }

        // 解压
        decompressed, err := Decompress(compressed)
        if err != nil {
            t.Fatalf("解压失败: %v", err)
        }

        // 属性：往返应该保持数据不变
        if !bytes.Equal(original, decompressed) {
            t.Error("往返后数据损坏")
        }

        // 属性：压缩+解压后应该等于原始大小
        if len(decompressed) != len(original) {
            t.Error("往返后大小不匹配")
        }
    })
}
```

### 模糊测试状态机

```go
func FuzzStateMachine(f *testing.F) {
    // 命令: 0=start, 1=stop, 2=pause, 3=resume
    f.Add([]byte{0, 2, 3, 1})
    f.Add([]byte{0, 1, 0, 1})
    f.Add([]byte{})

    f.Fuzz(func(t *testing.T, commands []byte) {
        sm := NewStateMachine()

        for _, cmd := range commands {
            switch cmd % 4 {
            case 0:
                sm.Start()
            case 1:
                sm.Stop()
            case 2:
                sm.Pause()
            case 3:
                sm.Resume()
            }

            // 不变量：状态应该始终有效
            if !sm.IsValidState() {
                t.Errorf("命令 %d 后状态无效", cmd)
            }
        }

        // 不变量：应该能够从任何状态停止
        sm.Stop()
        if sm.State() != StateStopped {
            t.Error("无法停止状态机")
        }
    })
}
```

## 面试要点

1. **什么是模糊测试？**
   - 生成随机输入的自动化测试
   - 覆盖率引导：从代码路径学习
   - 发现人类不会想到的边界情况

2. **Go 模糊测试如何工作？**
   - Go 1.18 起原生支持
   - 模糊器生成种子语料库的变异
   - 跟踪覆盖率以引导输入生成
   - 保存失败的输入用于回归测试

3. **什么是种子语料库？**
   - 开始模糊测试的初始输入
   - 可以通过 f.Add() 或 testdata/fuzz 目录添加
   - 模糊器变异这些以生成新输入

4. **模糊测试应该检查什么？**
   - 属性/不变量，而不是特定输出
   - 往返一致性
   - 没有 panic 或崩溃
   - 安全属性（没有注入等）

5. **什么时候应该使用模糊测试？**
   - 解析器和解码器
   - 序列化/反序列化
   - 密码学操作
   - 任何输入验证逻辑

## 延伸阅读

- [Go 模糊测试教程](https://go.dev/doc/tutorial/fuzz)
- [Go 模糊测试设计文档](https://go.dev/doc/fuzz/)
- [go-fuzz（1.18 之前的模糊器）](https://github.com/dvyukov/go-fuzz)
- [基于属性的测试介绍](https://increment.com/testing/in-praise-of-property-based-testing/)
- [AFL++ 模糊器](https://aflplus.plus/)
- [Google OSS-Fuzz](https://google.github.io/oss-fuzz/)
