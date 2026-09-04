---
title: 测试
description: Go测试完全指南，单元测试、表驱动测试与基准测试
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - 测试
  - 单元测试
  - 基准测试
status: imported
origin: old/src/content/docs/go/testing.zh.md
divergence: 0.113
issues: []
legacy:
  category: Go
  subcategory: 测试
  order: 6
  lastUpdated: 2026-01-07
---

Go 语言内置了强大的测试框架，通过标准库 `testing` 包提供了完整的测试支持。本文将全面介绍 Go 测试的各个方面，包括单元测试、表驱动测试、基准测试、示例测试、测试覆盖率、子测试以及 Mock 技术。

## testing 包基础

### 测试文件命名规范

Go 的测试文件必须遵循以下命名规范：

- 测试文件名必须以 `_test.go` 结尾
- 测试文件与被测试文件放在同一目录下
- 测试函数名必须以 `Test` 开头，后跟大写字母开头的名称

```go
// calculator.go - 被测试的源文件
package calculator

func Add(a, b int) int {
    return a + b
}

func Subtract(a, b int) int {
    return a - b
}

func Multiply(a, b int) int {
    return a * b
}

func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("除数不能为零")
    }
    return a / b, nil
}
```

```go
// calculator_test.go - 对应的测试文件
package calculator

import (
    "errors"
    "testing"
)

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    expected := 5

    if result != expected {
        t.Errorf("Add(2, 3) = %d; 期望 %d", result, expected)
    }
}
```

### 运行测试

```bash
# 运行当前目录下所有测试
go test

# 运行所有包的测试
go test ./...

# 显示详细输出
go test -v

# 运行特定测试函数
go test -run TestAdd

# 使用正则表达式匹配测试
go test -run "Test.*Add"

# 设置测试超时时间
go test -timeout 30s

# 并行测试数量
go test -parallel 4
```

### testing.T 核心方法

`testing.T` 提供了丰富的方法用于测试控制和结果报告：

```go
func TestMethods(t *testing.T) {
    // 错误报告 - 继续执行
    t.Error("测试失败")
    t.Errorf("期望 %d，得到 %d", 5, 3)

    // 致命错误 - 立即停止当前测试
    t.Fatal("严重错误，测试中止")
    t.Fatalf("严重错误: %v", err)

    // 标记失败
    t.Fail()      // 标记失败但继续执行
    t.FailNow()   // 标记失败并立即停止

    // 日志输出（仅在失败或 -v 模式下显示）
    t.Log("调试信息")
    t.Logf("变量值: %d", value)

    // 跳过测试
    if runtime.GOOS != "linux" {
        t.Skip("仅在 Linux 上运行")
    }
    t.Skipf("跳过原因: %s", reason)

    // 检查是否处于短测试模式
    if testing.Short() {
        t.Skip("短模式下跳过此测试")
    }
}
```

## 单元测试

### 基本单元测试

```go
package stringutil

import "testing"

// 被测试函数
func Reverse(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

// 测试函数
func TestReverse(t *testing.T) {
    result := Reverse("hello")
    expected := "olleh"

    if result != expected {
        t.Errorf("Reverse(\"hello\") = %q; 期望 %q", result, expected)
    }
}

func TestReverseEmpty(t *testing.T) {
    result := Reverse("")
    if result != "" {
        t.Errorf("Reverse(\"\") = %q; 期望空字符串", result)
    }
}

func TestReverseUnicode(t *testing.T) {
    result := Reverse("你好世界")
    expected := "界世好你"

    if result != expected {
        t.Errorf("Reverse(\"你好世界\") = %q; 期望 %q", result, expected)
    }
}
```

### 测试错误处理

```go
func TestDivide(t *testing.T) {
    // 测试正常情况
    result, err := Divide(10, 2)
    if err != nil {
        t.Fatalf("Divide(10, 2) 返回意外错误: %v", err)
    }
    if result != 5 {
        t.Errorf("Divide(10, 2) = %f; 期望 5", result)
    }
}

func TestDivideByZero(t *testing.T) {
    // 测试除零错误
    _, err := Divide(10, 0)
    if err == nil {
        t.Error("Divide(10, 0) 应返回错误，但得到 nil")
    }
}

func TestDivideErrorMessage(t *testing.T) {
    _, err := Divide(10, 0)
    if err == nil {
        t.Fatal("期望错误但得到 nil")
    }

    expectedMsg := "除数不能为零"
    if err.Error() != expectedMsg {
        t.Errorf("错误消息 = %q; 期望 %q", err.Error(), expectedMsg)
    }
}
```

## 表驱动测试

表驱动测试是 Go 社区推崇的测试模式，通过定义测试用例表来组织多个测试场景，使测试代码更加简洁、易于维护和扩展。

### 基本表驱动测试

```go
func TestAddTableDriven(t *testing.T) {
    // 定义测试用例表
    tests := []struct {
        name     string // 测试用例名称
        a        int    // 输入参数
        b        int    // 输入参数
        expected int    // 期望结果
    }{
        {"正数相加", 2, 3, 5},
        {"负数相加", -2, -3, -5},
        {"正负相加", -2, 3, 1},
        {"零值相加", 0, 0, 0},
        {"与零相加", 5, 0, 5},
        {"大数相加", 1000000, 2000000, 3000000},
    }

    // 遍历执行测试用例
    for _, tt := range tests {
        result := Add(tt.a, tt.b)
        if result != tt.expected {
            t.Errorf("%s: Add(%d, %d) = %d; 期望 %d",
                tt.name, tt.a, tt.b, result, tt.expected)
        }
    }
}
```

### 带错误检查的表驱动测试

```go
func TestDivideTableDriven(t *testing.T) {
    tests := []struct {
        name      string
        a         float64
        b         float64
        expected  float64
        wantErr   bool   // 是否期望错误
        errString string // 期望的错误消息
    }{
        {"正常除法", 10, 2, 5, false, ""},
        {"小数除法", 7, 2, 3.5, false, ""},
        {"除以零", 10, 0, 0, true, "除数不能为零"},
        {"零除以数", 0, 5, 0, false, ""},
        {"负数除法", -10, 2, -5, false, ""},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Divide(tt.a, tt.b)

            // 检查错误
            if tt.wantErr {
                if err == nil {
                    t.Errorf("期望错误但得到 nil")
                    return
                }
                if err.Error() != tt.errString {
                    t.Errorf("错误消息 = %q; 期望 %q", err.Error(), tt.errString)
                }
                return
            }

            if err != nil {
                t.Errorf("意外错误: %v", err)
                return
            }

            if result != tt.expected {
                t.Errorf("结果 = %f; 期望 %f", result, tt.expected)
            }
        })
    }
}
```

### 复杂数据结构的表驱动测试

```go
type User struct {
    Name  string
    Email string
    Age   int
}

func ValidateUser(u User) error {
    if u.Name == "" {
        return errors.New("姓名不能为空")
    }
    if u.Email == "" {
        return errors.New("邮箱不能为空")
    }
    if u.Age < 0 || u.Age > 150 {
        return errors.New("年龄无效")
    }
    return nil
}

func TestValidateUser(t *testing.T) {
    tests := []struct {
        name    string
        user    User
        wantErr bool
        errMsg  string
    }{
        {
            name:    "有效用户",
            user:    User{Name: "张三", Email: "zhang@example.com", Age: 25},
            wantErr: false,
        },
        {
            name:    "空姓名",
            user:    User{Name: "", Email: "test@example.com", Age: 25},
            wantErr: true,
            errMsg:  "姓名不能为空",
        },
        {
            name:    "空邮箱",
            user:    User{Name: "张三", Email: "", Age: 25},
            wantErr: true,
            errMsg:  "邮箱不能为空",
        },
        {
            name:    "负年龄",
            user:    User{Name: "张三", Email: "test@example.com", Age: -1},
            wantErr: true,
            errMsg:  "年龄无效",
        },
        {
            name:    "年龄过大",
            user:    User{Name: "张三", Email: "test@example.com", Age: 200},
            wantErr: true,
            errMsg:  "年龄无效",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateUser(tt.user)

            if tt.wantErr {
                if err == nil {
                    t.Error("期望错误但得到 nil")
                    return
                }
                if err.Error() != tt.errMsg {
                    t.Errorf("错误 = %q; 期望 %q", err.Error(), tt.errMsg)
                }
            } else {
                if err != nil {
                    t.Errorf("意外错误: %v", err)
                }
            }
        })
    }
}
```

## 子测试

子测试（Subtests）使用 `t.Run()` 方法创建，提供更好的测试组织和输出结构。

### 基本子测试

```go
func TestMathOperations(t *testing.T) {
    t.Run("加法", func(t *testing.T) {
        if Add(2, 3) != 5 {
            t.Error("加法测试失败")
        }
    })

    t.Run("减法", func(t *testing.T) {
        if Subtract(5, 3) != 2 {
            t.Error("减法测试失败")
        }
    })

    t.Run("乘法", func(t *testing.T) {
        if Multiply(4, 3) != 12 {
            t.Error("乘法测试失败")
        }
    })

    t.Run("除法", func(t *testing.T) {
        t.Run("正常除法", func(t *testing.T) {
            result, err := Divide(10, 2)
            if err != nil {
                t.Fatal(err)
            }
            if result != 5 {
                t.Errorf("结果 = %f; 期望 5", result)
            }
        })

        t.Run("除以零", func(t *testing.T) {
            _, err := Divide(10, 0)
            if err == nil {
                t.Error("期望除零错误")
            }
        })
    })
}
```

### 并行子测试

```go
func TestParallel(t *testing.T) {
    tests := []struct {
        name  string
        input int
        want  int
    }{
        {"测试1", 1, 2},
        {"测试2", 2, 4},
        {"测试3", 3, 6},
        {"测试4", 4, 8},
    }

    for _, tt := range tests {
        tt := tt // 重要：捕获循环变量
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel() // 标记为并行执行

            result := tt.input * 2
            if result != tt.want {
                t.Errorf("结果 = %d; 期望 %d", result, tt.want)
            }
        })
    }
}
```

运行并行测试：

```bash
# 设置最大并行数
go test -parallel 8

# 查看并行执行效果
go test -v -parallel 4
```

### 子测试的 Setup 和 Teardown

```go
func TestWithSetupTeardown(t *testing.T) {
    // 共享 setup
    db := setupDatabase()
    defer db.Close()

    t.Run("插入测试", func(t *testing.T) {
        // 子测试特定 setup
        t.Cleanup(func() {
            db.ClearTable("users")
        })

        err := db.Insert("users", map[string]interface{}{
            "name": "张三",
        })
        if err != nil {
            t.Fatal(err)
        }
    })

    t.Run("查询测试", func(t *testing.T) {
        // 另一个子测试
        users, err := db.Query("SELECT * FROM users")
        if err != nil {
            t.Fatal(err)
        }
        t.Logf("找到 %d 个用户", len(users))
    })
}
```

## 测试辅助函数

### 使用 t.Helper()

`t.Helper()` 将函数标记为测试辅助函数，使错误报告更准确，显示调用者的位置而非辅助函数内部。

```go
// 断言相等
func assertEqual(t *testing.T, got, want interface{}) {
    t.Helper() // 标记为辅助函数
    if got != want {
        t.Errorf("得到 %v; 期望 %v", got, want)
    }
}

// 断言无错误
func assertNoError(t *testing.T, err error) {
    t.Helper()
    if err != nil {
        t.Fatalf("意外错误: %v", err)
    }
}

// 断言有错误
func assertError(t *testing.T, err error) {
    t.Helper()
    if err == nil {
        t.Fatal("期望错误但得到 nil")
    }
}

// 断言包含
func assertContains(t *testing.T, s, substr string) {
    t.Helper()
    if !strings.Contains(s, substr) {
        t.Errorf("%q 不包含 %q", s, substr)
    }
}

// 使用辅助函数
func TestWithHelpers(t *testing.T) {
    result := Add(2, 3)
    assertEqual(t, result, 5)

    _, err := Divide(10, 0)
    assertError(t, err)

    _, err = Divide(10, 2)
    assertNoError(t, err)
}
```

### TestMain 函数

`TestMain` 用于在所有测试运行前后执行全局的 setup 和 teardown。

```go
var testDB *sql.DB

func TestMain(m *testing.M) {
    // 全局 setup
    fmt.Println("========== 全局初始化 ==========")
    var err error
    testDB, err = setupTestDatabase()
    if err != nil {
        fmt.Printf("数据库初始化失败: %v\n", err)
        os.Exit(1)
    }

    // 运行所有测试
    code := m.Run()

    // 全局 teardown
    fmt.Println("========== 全局清理 ==========")
    testDB.Close()
    cleanupTestDatabase()

    os.Exit(code)
}

func setupTestDatabase() (*sql.DB, error) {
    // 初始化测试数据库
    return sql.Open("sqlite3", ":memory:")
}

func cleanupTestDatabase() {
    // 清理测试数据
}
```

### t.Cleanup 函数

`t.Cleanup` 注册在测试结束时执行的清理函数，按照注册的相反顺序执行。

```go
func TestWithCleanup(t *testing.T) {
    // 创建临时资源
    file, err := os.CreateTemp("", "test-*.txt")
    if err != nil {
        t.Fatal(err)
    }

    // 注册清理函数
    t.Cleanup(func() {
        file.Close()
        os.Remove(file.Name())
        t.Log("清理完成")
    })

    // 测试代码
    _, err = file.WriteString("test data")
    if err != nil {
        t.Fatal(err)
    }
}

func TestMultipleCleanups(t *testing.T) {
    t.Cleanup(func() { t.Log("清理 1") })
    t.Cleanup(func() { t.Log("清理 2") })
    t.Cleanup(func() { t.Log("清理 3") })

    // 输出顺序: 清理 3, 清理 2, 清理 1
}
```

## 基准测试

基准测试用于测量代码性能，函数名必须以 `Benchmark` 开头，接收 `*testing.B` 参数。

### 基本基准测试

```go
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}

func BenchmarkReverse(b *testing.B) {
    s := "hello world"
    for i := 0; i < b.N; i++ {
        Reverse(s)
    }
}
```

运行基准测试：

```bash
# 运行所有基准测试
go test -bench=.

# 运行特定基准测试
go test -bench=BenchmarkAdd

# 显示内存分配
go test -bench=. -benchmem

# 运行多次取平均
go test -bench=. -count=5

# 设置基准测试时间
go test -bench=. -benchtime=5s

# 输出示例:
# BenchmarkAdd-8          1000000000       0.25 ns/op
# BenchmarkReverse-8      20000000         89.5 ns/op    16 B/op    1 allocs/op
```

### 带参数的基准测试

```go
func BenchmarkReverseSize(b *testing.B) {
    sizes := []struct {
        name string
        size int
    }{
        {"小字符串", 10},
        {"中字符串", 100},
        {"大字符串", 1000},
        {"超大字符串", 10000},
    }

    for _, s := range sizes {
        input := strings.Repeat("a", s.size)
        b.Run(s.name, func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                Reverse(input)
            }
        })
    }
}
```

### 重置计时器

```go
func BenchmarkWithSetup(b *testing.B) {
    // 不计入基准时间的准备工作
    data := make([]int, 10000)
    for i := range data {
        data[i] = i
    }

    b.ResetTimer() // 重置计时器

    for i := 0; i < b.N; i++ {
        sort.Ints(data)
    }
}

func BenchmarkWithPause(b *testing.B) {
    for i := 0; i < b.N; i++ {
        b.StopTimer() // 暂停计时
        data := generateTestData()
        b.StartTimer() // 恢复计时

        processData(data)
    }
}
```

### 内存分配基准测试

```go
// 比较字符串拼接的不同实现
func BenchmarkStringConcatPlus(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var s string
        for j := 0; j < 100; j++ {
            s += "a"
        }
        _ = s
    }
}

func BenchmarkStringConcatBuilder(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var builder strings.Builder
        for j := 0; j < 100; j++ {
            builder.WriteString("a")
        }
        _ = builder.String()
    }
}

func BenchmarkStringConcatBuffer(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var buf bytes.Buffer
        for j := 0; j < 100; j++ {
            buf.WriteString("a")
        }
        _ = buf.String()
    }
}

// 输出比较:
// BenchmarkStringConcatPlus-8       5000    234567 ns/op    53000 B/op    99 allocs/op
// BenchmarkStringConcatBuilder-8  500000      3456 ns/op      512 B/op     4 allocs/op
// BenchmarkStringConcatBuffer-8   300000      4567 ns/op      640 B/op     5 allocs/op
```

### 并行基准测试

```go
func BenchmarkParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            Add(2, 3)
        }
    })
}

// 测试不同 CPU 核心数下的性能
// go test -bench=BenchmarkParallel -cpu=1,2,4,8
```

## 示例测试

示例测试既是测试也是文档，会出现在 `go doc` 生成的文档中。

### 基本示例

```go
func ExampleAdd() {
    result := Add(2, 3)
    fmt.Println(result)
    // Output: 5
}

func ExampleReverse() {
    s := "hello"
    reversed := Reverse(s)
    fmt.Println(reversed)
    // Output: olleh
}

func ExampleReverse_unicode() {
    s := "你好"
    reversed := Reverse(s)
    fmt.Println(reversed)
    // Output: 好你
}
```

### 类型和方法的示例

```go
type Counter struct {
    value int
}

func (c *Counter) Add(n int) {
    c.value += n
}

func (c *Counter) Value() int {
    return c.value
}

func ExampleCounter() {
    c := &Counter{}
    c.Add(5)
    c.Add(3)
    fmt.Println(c.Value())
    // Output: 8
}

func ExampleCounter_Add() {
    c := &Counter{}
    c.Add(10)
    fmt.Println(c.Value())
    // Output: 10
}
```

### 无序输出示例

```go
func ExampleMapIteration() {
    m := map[string]int{
        "a": 1,
        "b": 2,
        "c": 3,
    }

    for k, v := range m {
        fmt.Printf("%s=%d\n", k, v)
    }

    // Unordered output:
    // a=1
    // b=2
    // c=3
}
```

### 复杂示例

```go
func Example_complete() {
    // 这是一个完整的使用示例
    calc := NewCalculator()
    calc.Add(10)
    calc.Subtract(3)
    calc.Multiply(2)

    result := calc.Result()
    fmt.Printf("计算结果: %d\n", result)
    // Output: 计算结果: 14
}
```

## 测试覆盖率

### 生成覆盖率报告

```bash
# 显示覆盖率百分比
go test -cover

# 生成覆盖率数据文件
go test -coverprofile=coverage.out

# 查看覆盖率详情
go tool cover -func=coverage.out

# 生成 HTML 报告
go tool cover -html=coverage.out -o coverage.html

# 在浏览器中直接打开
go tool cover -html=coverage.out

# 测试所有包
go test -coverprofile=coverage.out ./...
```

### 覆盖率模式

```bash
# set: 语句是否执行（默认）
go test -covermode=set -coverprofile=coverage.out

# count: 语句执行次数
go test -covermode=count -coverprofile=coverage.out

# atomic: 原子计数，适用于并发测试
go test -covermode=atomic -coverprofile=coverage.out
```

### 提高覆盖率示例

```go
// validator.go
package validator

import (
    "errors"
    "regexp"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func ValidateEmail(email string) error {
    if email == "" {
        return errors.New("邮箱不能为空")
    }

    if len(email) > 254 {
        return errors.New("邮箱长度超出限制")
    }

    if !emailRegex.MatchString(email) {
        return errors.New("邮箱格式无效")
    }

    return nil
}
```

```go
// validator_test.go
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
        errMsg  string
    }{
        // 正常情况
        {"有效邮箱", "test@example.com", false, ""},
        {"带加号邮箱", "test+tag@example.com", false, ""},
        {"子域名邮箱", "test@mail.example.com", false, ""},

        // 边界情况
        {"空邮箱", "", true, "邮箱不能为空"},
        {"超长邮箱", strings.Repeat("a", 250) + "@test.com", true, "邮箱长度超出限制"},

        // 格式错误
        {"无@符号", "testexample.com", true, "邮箱格式无效"},
        {"无域名", "test@", true, "邮箱格式无效"},
        {"无顶级域名", "test@example", true, "邮箱格式无效"},
        {"空格", "test @example.com", true, "邮箱格式无效"},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)

            if tt.wantErr {
                if err == nil {
                    t.Error("期望错误但得到 nil")
                    return
                }
                if err.Error() != tt.errMsg {
                    t.Errorf("错误 = %q; 期望 %q", err.Error(), tt.errMsg)
                }
            } else {
                if err != nil {
                    t.Errorf("意外错误: %v", err)
                }
            }
        })
    }
}
```

## Mock 技术

### 使用接口进行 Mock

```go
// 定义接口
type Storage interface {
    Save(key string, value []byte) error
    Load(key string) ([]byte, error)
    Delete(key string) error
}

// 实际实现
type FileStorage struct {
    basePath string
}

func (fs *FileStorage) Save(key string, value []byte) error {
    return os.WriteFile(filepath.Join(fs.basePath, key), value, 0644)
}

func (fs *FileStorage) Load(key string) ([]byte, error) {
    return os.ReadFile(filepath.Join(fs.basePath, key))
}

func (fs *FileStorage) Delete(key string) error {
    return os.Remove(filepath.Join(fs.basePath, key))
}

// 使用存储的服务
type UserService struct {
    storage Storage
}

func (s *UserService) SaveUser(user User) error {
    data, err := json.Marshal(user)
    if err != nil {
        return err
    }
    return s.storage.Save(user.ID, data)
}

func (s *UserService) GetUser(id string) (*User, error) {
    data, err := s.storage.Load(id)
    if err != nil {
        return nil, err
    }

    var user User
    if err := json.Unmarshal(data, &user); err != nil {
        return nil, err
    }
    return &user, nil
}
```

### Mock 实现

```go
// Mock 存储
type MockStorage struct {
    SaveFunc   func(key string, value []byte) error
    LoadFunc   func(key string) ([]byte, error)
    DeleteFunc func(key string) error

    // 调用记录
    SaveCalls   []struct{ Key string; Value []byte }
    LoadCalls   []string
    DeleteCalls []string
}

func (m *MockStorage) Save(key string, value []byte) error {
    m.SaveCalls = append(m.SaveCalls, struct{ Key string; Value []byte }{key, value})
    if m.SaveFunc != nil {
        return m.SaveFunc(key, value)
    }
    return nil
}

func (m *MockStorage) Load(key string) ([]byte, error) {
    m.LoadCalls = append(m.LoadCalls, key)
    if m.LoadFunc != nil {
        return m.LoadFunc(key)
    }
    return nil, errors.New("not found")
}

func (m *MockStorage) Delete(key string) error {
    m.DeleteCalls = append(m.DeleteCalls, key)
    if m.DeleteFunc != nil {
        return m.DeleteFunc(key)
    }
    return nil
}
```

### 使用 Mock 进行测试

```go
func TestUserService_SaveUser(t *testing.T) {
    mock := &MockStorage{
        SaveFunc: func(key string, value []byte) error {
            return nil
        },
    }

    service := &UserService{storage: mock}

    user := User{ID: "user-1", Name: "张三", Email: "zhang@example.com"}
    err := service.SaveUser(user)

    if err != nil {
        t.Fatalf("意外错误: %v", err)
    }

    // 验证 Save 被调用
    if len(mock.SaveCalls) != 1 {
        t.Errorf("Save 调用次数 = %d; 期望 1", len(mock.SaveCalls))
    }

    if mock.SaveCalls[0].Key != "user-1" {
        t.Errorf("Save key = %s; 期望 user-1", mock.SaveCalls[0].Key)
    }
}

func TestUserService_GetUser(t *testing.T) {
    userData, _ := json.Marshal(User{ID: "user-1", Name: "张三", Email: "zhang@example.com"})

    mock := &MockStorage{
        LoadFunc: func(key string) ([]byte, error) {
            if key == "user-1" {
                return userData, nil
            }
            return nil, errors.New("not found")
        },
    }

    service := &UserService{storage: mock}

    t.Run("用户存在", func(t *testing.T) {
        user, err := service.GetUser("user-1")
        if err != nil {
            t.Fatalf("意外错误: %v", err)
        }
        if user.Name != "张三" {
            t.Errorf("用户名 = %s; 期望 张三", user.Name)
        }
    })

    t.Run("用户不存在", func(t *testing.T) {
        _, err := service.GetUser("nonexistent")
        if err == nil {
            t.Error("期望错误但得到 nil")
        }
    })
}

func TestUserService_SaveUser_Error(t *testing.T) {
    mock := &MockStorage{
        SaveFunc: func(key string, value []byte) error {
            return errors.New("存储错误")
        },
    }

    service := &UserService{storage: mock}

    user := User{ID: "user-1", Name: "张三"}
    err := service.SaveUser(user)

    if err == nil {
        t.Error("期望错误但得到 nil")
    }
}
```

### HTTP Mock

```go
import (
    "net/http"
    "net/http/httptest"
)

func TestHTTPClient(t *testing.T) {
    // 创建测试服务器
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 验证请求
        if r.URL.Path != "/api/users" {
            t.Errorf("路径 = %s; 期望 /api/users", r.URL.Path)
        }
        if r.Method != "GET" {
            t.Errorf("方法 = %s; 期望 GET", r.Method)
        }

        // 返回响应
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(`{"users": [{"id": "1", "name": "张三"}]}`))
    }))
    defer server.Close()

    // 使用测试服务器 URL
    client := NewAPIClient(server.URL)
    users, err := client.GetUsers()

    if err != nil {
        t.Fatalf("意外错误: %v", err)
    }

    if len(users) != 1 {
        t.Errorf("用户数 = %d; 期望 1", len(users))
    }
}
```

## 高级测试技巧

### 竞态条件检测

```go
func TestRaceCondition(t *testing.T) {
    counter := &SafeCounter{}

    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }
    wg.Wait()

    if counter.Value() != 1000 {
        t.Errorf("计数器值 = %d; 期望 1000", counter.Value())
    }
}

// 运行竞态检测
// go test -race
```

### 临时目录和文件

```go
func TestWithTempDir(t *testing.T) {
    // Go 1.15+ 自动清理
    dir := t.TempDir()

    // 创建测试文件
    testFile := filepath.Join(dir, "test.txt")
    err := os.WriteFile(testFile, []byte("test content"), 0644)
    if err != nil {
        t.Fatal(err)
    }

    // 使用测试文件
    content, err := os.ReadFile(testFile)
    if err != nil {
        t.Fatal(err)
    }

    if string(content) != "test content" {
        t.Error("文件内容不匹配")
    }
    // 测试结束后目录自动清理
}
```

### 黄金文件测试

```go
var update = flag.Bool("update", false, "更新黄金文件")

func TestGoldenFile(t *testing.T) {
    input := "test input data"
    result := ProcessData(input)

    goldenFile := filepath.Join("testdata", "golden.txt")

    if *update {
        // 更新模式：写入新的黄金文件
        err := os.WriteFile(goldenFile, []byte(result), 0644)
        if err != nil {
            t.Fatal(err)
        }
        t.Log("黄金文件已更新")
        return
    }

    // 读取并比较
    expected, err := os.ReadFile(goldenFile)
    if err != nil {
        t.Fatalf("读取黄金文件失败: %v", err)
    }

    if result != string(expected) {
        t.Errorf("结果与黄金文件不匹配:\n得到:\n%s\n期望:\n%s", result, expected)
    }
}

// 运行: go test -update  // 更新黄金文件
// 运行: go test          // 正常测试
```

### 条件跳过测试

```go
func TestRequiresNetwork(t *testing.T) {
    if testing.Short() {
        t.Skip("短模式下跳过网络测试")
    }

    // 网络相关测试...
}

func TestRequiresLinux(t *testing.T) {
    if runtime.GOOS != "linux" {
        t.Skip("仅在 Linux 上运行")
    }

    // Linux 特定测试...
}

func TestRequiresDocker(t *testing.T) {
    if os.Getenv("DOCKER_HOST") == "" {
        t.Skip("需要 Docker 环境")
    }

    // Docker 相关测试...
}

// go test -short  // 短模式运行
```

### 测试超时控制

```go
func TestWithTimeout(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    done := make(chan bool)

    go func() {
        // 可能耗时的操作
        result := SlowOperation()
        _ = result
        done <- true
    }()

    select {
    case <-done:
        t.Log("操作完成")
    case <-ctx.Done():
        t.Fatal("测试超时")
    }
}

// 命令行设置超时
// go test -timeout 30s
```

## 最佳实践

### 测试文件组织

```
myproject/
├── internal/
│   ├── user/
│   │   ├── user.go
│   │   ├── user_test.go           # 单元测试
│   │   └── user_integration_test.go # 集成测试
│   └── order/
│       ├── order.go
│       └── order_test.go
├── testdata/                       # 测试数据
│   ├── fixtures/
│   │   └── users.json
│   └── golden/
│       └── report.txt
└── go.mod
```

### 测试命名规范

```go
// 函数测试: Test + 函数名
func TestAdd(t *testing.T) {}

// 方法测试: Test + 类型名 + 下划线 + 方法名
func TestCalculator_Add(t *testing.T) {}

// 场景测试: Test + 描述
func TestAdd_WithNegativeNumbers(t *testing.T) {}

// 基准测试: Benchmark + 名称
func BenchmarkAdd(b *testing.B) {}

// 示例: Example + 名称
func ExampleAdd() {}
```

### 表驱动测试的结构设计

```go
func TestWellStructuredTable(t *testing.T) {
    tests := []struct {
        name     string      // 必须：测试用例名称
        input    InputType   // 输入数据
        setup    func()      // 可选：测试前设置
        expected OutputType  // 期望输出
        wantErr  bool        // 是否期望错误
        errType  error       // 可选：期望的错误类型
    }{
        {
            name:     "描述性的测试名称",
            input:    InputType{...},
            expected: OutputType{...},
            wantErr:  false,
        },
        // 更多测试用例...
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if tt.setup != nil {
                tt.setup()
            }

            result, err := FunctionUnderTest(tt.input)

            if (err != nil) != tt.wantErr {
                t.Errorf("错误 = %v, 期望错误 = %v", err, tt.wantErr)
                return
            }

            if !reflect.DeepEqual(result, tt.expected) {
                t.Errorf("结果 = %v, 期望 = %v", result, tt.expected)
            }
        })
    }
}
```

### 错误消息的格式

```go
// 好的错误消息格式
t.Errorf("FunctionName(%v) = %v; want %v", input, got, want)
t.Errorf("user.Age = %d; want %d", user.Age, expectedAge)

// 包含上下文
t.Errorf("[用例 %s] 结果 = %v; 期望 %v", caseName, got, want)

// 多行对比
t.Errorf("结果不匹配:\n得到: %#v\n期望: %#v", got, want)
```

### 使用 testdata 目录

```go
func TestWithTestdata(t *testing.T) {
    // testdata 目录不会被编译到二进制中
    input, err := os.ReadFile("testdata/input.json")
    if err != nil {
        t.Fatal(err)
    }

    expected, err := os.ReadFile("testdata/expected.json")
    if err != nil {
        t.Fatal(err)
    }

    result := ProcessJSON(input)

    if !bytes.Equal(result, expected) {
        t.Errorf("结果与预期不符")
    }
}
```

### 避免测试中的常见错误

```go
// 错误: 在循环中直接使用循环变量
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        // tt 可能是最后一个值!
        _ = tt
    })
}

// 正确: 捕获循环变量
for _, tt := range tests {
    tt := tt // 重要!
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        _ = tt
    })
}

// 注意: Go 1.22+ 循环变量语义已改变，但为了兼容性仍建议显式捕获
```

### 合理使用 t.Parallel()

```go
func TestParallelCorrectly(t *testing.T) {
    // 仅当测试之间完全独立时使用
    tests := []struct {
        name string
        // ...
    }{
        // 测试用例
    }

    for _, tt := range tests {
        tt := tt
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel() // 确保不共享任何可变状态
            // 测试代码...
        })
    }
}
```

## 总结

Go 的测试框架虽然简洁，但功能强大，涵盖了软件测试的各个方面：

| 测试类型 | 函数前缀 | 参数类型 | 用途 |
|---------|---------|---------|------|
| 单元测试 | Test | *testing.T | 功能验证 |
| 基准测试 | Benchmark | *testing.B | 性能测量 |
| 示例测试 | Example | 无 | 文档示例 |
| 模糊测试 | Fuzz | *testing.F | 自动发现边界情况 |

关键要点：

1. **表驱动测试**是 Go 社区的最佳实践，使测试更加清晰和可维护
2. **子测试**提供更好的组织结构和并发控制
3. **t.Helper()** 使错误报告更加准确
4. **基准测试**帮助发现性能问题，使用 `-benchmem` 了解内存分配
5. **测试覆盖率**帮助发现未测试的代码路径
6. **Mock 技术**通过接口实现，便于测试隔离
7. **竞态检测**使用 `-race` 标志发现并发问题

掌握这些测试技术，将帮助你编写高质量、可维护的 Go 代码。
