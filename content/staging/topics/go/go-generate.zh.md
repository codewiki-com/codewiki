---
title: go generate 代码生成
description: go generate 完全指南，Go 内置的代码生成工具，用于自动化重复编码任务和生成样板代码
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - 代码生成
  - go generate
  - 元编程
  - 工具
status: imported
origin: old/src/content/docs/go/go-generate.zh.md
divergence: 0.22
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 55
  lastUpdated: 2026-01-21
---

`go generate` 是 Go 的内置工具，通过扫描源文件中的特殊注释并运行指定的命令来自动化代码生成。它用于生成样板代码、创建类型安全的包装器、实现接口等。

## 概念解释

`go generate` 扫描 Go 源文件中形如以下格式的指令：

```go
//go:generate command arguments...
```

当你运行 `go generate` 时，它会在包目录中执行这些命令。生成的代码成为你代码库的一部分，并提交到版本控制系统。

常见用例：
- 为枚举生成字符串方法
- 创建 mock 实现
- 构建 protocol buffers
- 生成 SQL 迁移
- 创建资源嵌入

```go
package main

//go:generate stringer -type=Status

type Status int

const (
    Pending Status = iota
    Active
    Completed
    Cancelled
)

func main() {
    s := Active
    println(s.String()) // "Active" - stringer 生成的方法
}
```

## 核心原理

### 指令语法

```go
package example

// 基本指令
//go:generate echo "Hello, World!"

// 多个参数
//go:generate stringer -type=MyType -output=mytype_string.go

// 使用环境变量
//go:generate sh -c "echo $GOFILE"

// 链接命令
//go:generate sh -c "cmd1 && cmd2"

// 长命令（不支持换行 - 使用 sh -c 代替）
//go:generate sh -c "long-command --flag1 --flag2 --flag3"
```

### 内置变量

```go
package example

// $GOARCH - 目标架构
// $GOOS - 目标操作系统
// $GOFILE - 当前文件名
// $GOLINE - 指令所在行号
// $GOPACKAGE - 包名
// $DOLLAR - 美元符号字面量

//go:generate echo "文件: $GOFILE"
//go:generate echo "包: $GOPACKAGE"
//go:generate echo "系统: $GOOS, 架构: $GOARCH"
```

### 运行 go generate

```bash
# 为当前包生成
go generate

# 为指定包生成
go generate ./pkg/models

# 为所有包生成
go generate ./...

# 详细输出
go generate -v ./...

# 干运行（显示命令但不执行）
go generate -n ./...

# 运行特定生成器
go generate -run "stringer" ./...
```

## 核心要点

### Stringer - 枚举字符串方法

`stringer` 工具为整数常量生成 `String()` 方法：

```go
// 文件: status.go
package order

//go:generate stringer -type=Status

type Status int

const (
    StatusPending Status = iota
    StatusProcessing
    StatusShipped
    StatusDelivered
    StatusCancelled
)

// 运行 go generate 后，会创建 status_string.go：
// func (s Status) String() string { ... }
```

安装 stringer：`go install golang.org/x/tools/cmd/stringer@latest`

### Mockgen - Mock 生成

为测试生成 mock 实现：

```go
// 文件: repository.go
package user

//go:generate mockgen -source=repository.go -destination=mocks/mock_repository.go -package=mocks

type Repository interface {
    GetByID(id int64) (*User, error)
    Create(user *User) error
    Update(user *User) error
    Delete(id int64) error
    List(offset, limit int) ([]*User, error)
}

type User struct {
    ID    int64
    Name  string
    Email string
}
```

安装 mockgen：`go install github.com/golang/mock/mockgen@latest`

在测试中使用：

```go
// 文件: service_test.go
package user_test

import (
    "testing"

    "github.com/golang/mock/gomock"
    "myapp/user"
    "myapp/user/mocks"
)

func TestUserService_GetUser(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockRepo := mocks.NewMockRepository(ctrl)

    // 设置期望
    mockRepo.EXPECT().
        GetByID(int64(1)).
        Return(&user.User{ID: 1, Name: "Alice"}, nil)

    service := user.NewService(mockRepo)
    u, err := service.GetUser(1)

    if err != nil {
        t.Fatalf("意外错误: %v", err)
    }
    if u.Name != "Alice" {
        t.Errorf("期望 Alice，得到 %s", u.Name)
    }
}
```

### Protocol Buffers

```go
// 文件: proto/user.proto
syntax = "proto3";
package user;
option go_package = "myapp/proto/user";

message User {
    int64 id = 1;
    string name = 2;
    string email = 3;
}

// 文件: generate.go
package proto

//go:generate protoc --go_out=. --go_opt=paths=source_relative user.proto
```

## 代码示例

### 自定义代码生成器

创建你自己的代码生成器：

```go
// 文件: cmd/enumgen/main.go
package main

import (
    "bytes"
    "flag"
    "fmt"
    "go/ast"
    "go/parser"
    "go/token"
    "os"
    "strings"
    "text/template"
)

var (
    typeName   = flag.String("type", "", "类型名称")
    outputFile = flag.String("output", "", "输出文件名")
)

const tmpl = `// 由 enumgen 生成的代码。请勿编辑。
package {{.Package}}

import "fmt"

var _{{.Type}}Names = map[{{.Type}}]string{
{{- range .Values}}
    {{.Name}}: "{{.Name}}",
{{- end}}
}

var _{{.Type}}Values = map[string]{{.Type}}{
{{- range .Values}}
    "{{.Name}}": {{.Name}},
{{- end}}
}

func (e {{.Type}}) String() string {
    if name, ok := _{{.Type}}Names[e]; ok {
        return name
    }
    return fmt.Sprintf("{{.Type}}(%d)", e)
}

func Parse{{.Type}}(s string) ({{.Type}}, error) {
    if v, ok := _{{.Type}}Values[s]; ok {
        return v, nil
    }
    return 0, fmt.Errorf("无效的 {{.Type}}: %s", s)
}

func (e {{.Type}}) MarshalText() ([]byte, error) {
    return []byte(e.String()), nil
}

func (e *{{.Type}}) UnmarshalText(text []byte) error {
    v, err := Parse{{.Type}}(string(text))
    if err != nil {
        return err
    }
    *e = v
    return nil
}
`

type Value struct {
    Name string
}

type TemplateData struct {
    Package string
    Type    string
    Values  []Value
}

func main() {
    flag.Parse()

    if *typeName == "" {
        fmt.Fprintln(os.Stderr, "需要类型名称")
        os.Exit(1)
    }

    // 解析源文件
    filename := os.Getenv("GOFILE")
    fset := token.NewFileSet()
    f, err := parser.ParseFile(fset, filename, nil, parser.ParseComments)
    if err != nil {
        fmt.Fprintf(os.Stderr, "解析错误: %v\n", err)
        os.Exit(1)
    }

    // 查找指定类型的常量
    var values []Value
    ast.Inspect(f, func(n ast.Node) bool {
        decl, ok := n.(*ast.GenDecl)
        if !ok || decl.Tok != token.CONST {
            return true
        }

        for _, spec := range decl.Specs {
            vspec, ok := spec.(*ast.ValueSpec)
            if !ok {
                continue
            }

            // 检查类型是否匹配
            if vspec.Type != nil {
                ident, ok := vspec.Type.(*ast.Ident)
                if !ok || ident.Name != *typeName {
                    continue
                }
            }

            for _, name := range vspec.Names {
                if !strings.HasPrefix(name.Name, "_") {
                    values = append(values, Value{Name: name.Name})
                }
            }
        }
        return true
    })

    // 生成代码
    data := TemplateData{
        Package: f.Name.Name,
        Type:    *typeName,
        Values:  values,
    }

    t := template.Must(template.New("enum").Parse(tmpl))
    var buf bytes.Buffer
    if err := t.Execute(&buf, data); err != nil {
        fmt.Fprintf(os.Stderr, "模板错误: %v\n", err)
        os.Exit(1)
    }

    // 写入输出
    output := *outputFile
    if output == "" {
        output = strings.ToLower(*typeName) + "_enum.go"
    }

    if err := os.WriteFile(output, buf.Bytes(), 0644); err != nil {
        fmt.Fprintf(os.Stderr, "写入错误: %v\n", err)
        os.Exit(1)
    }

    fmt.Printf("已生成 %s\n", output)
}
```

使用方法：

```go
// 文件: status.go
package order

//go:generate go run ../cmd/enumgen/main.go -type=Status

type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusCompleted
)
```

### SQL 查询生成器

```go
// 文件: cmd/sqlgen/main.go
package main

import (
    "flag"
    "fmt"
    "os"
    "strings"
    "text/template"
)

var (
    tableName = flag.String("table", "", "数据库表名")
    modelType = flag.String("type", "", "模型结构体类型")
    output    = flag.String("output", "", "输出文件")
)

const queryTemplate = `// 由 sqlgen 生成的代码。请勿编辑。
package {{.Package}}

const (
    {{.Type}}TableName = "{{.Table}}"

    {{.Type}}SelectAll = ` + "`" + `
        SELECT {{.Columns}}
        FROM {{.Table}}
    ` + "`" + `

    {{.Type}}SelectByID = ` + "`" + `
        SELECT {{.Columns}}
        FROM {{.Table}}
        WHERE id = $1
    ` + "`" + `

    {{.Type}}Insert = ` + "`" + `
        INSERT INTO {{.Table}} ({{.InsertColumns}})
        VALUES ({{.InsertPlaceholders}})
        RETURNING id
    ` + "`" + `

    {{.Type}}Update = ` + "`" + `
        UPDATE {{.Table}}
        SET {{.UpdateSet}}
        WHERE id = $1
    ` + "`" + `

    {{.Type}}Delete = ` + "`" + `
        DELETE FROM {{.Table}}
        WHERE id = $1
    ` + "`" + `
)
`

type Field struct {
    Name   string
    Column string
}

func main() {
    flag.Parse()

    // 在实际实现中，应该解析结构体获取字段
    // 这里为了演示进行了简化
    fields := []Field{
        {Name: "ID", Column: "id"},
        {Name: "Name", Column: "name"},
        {Name: "Email", Column: "email"},
        {Name: "CreatedAt", Column: "created_at"},
    }

    var columns, insertColumns []string
    var placeholders, updateSet []string

    for i, f := range fields {
        columns = append(columns, f.Column)
        if f.Column != "id" {
            insertColumns = append(insertColumns, f.Column)
            placeholders = append(placeholders, fmt.Sprintf("$%d", len(insertColumns)))
            updateSet = append(updateSet,
                fmt.Sprintf("%s = $%d", f.Column, i+1))
        }
    }

    data := struct {
        Package            string
        Type               string
        Table              string
        Columns            string
        InsertColumns      string
        InsertPlaceholders string
        UpdateSet          string
    }{
        Package:            os.Getenv("GOPACKAGE"),
        Type:               *modelType,
        Table:              *tableName,
        Columns:            strings.Join(columns, ", "),
        InsertColumns:      strings.Join(insertColumns, ", "),
        InsertPlaceholders: strings.Join(placeholders, ", "),
        UpdateSet:          strings.Join(updateSet, ", "),
    }

    t := template.Must(template.New("sql").Parse(queryTemplate))

    outFile := *output
    if outFile == "" {
        outFile = strings.ToLower(*modelType) + "_queries.go"
    }

    f, _ := os.Create(outFile)
    defer f.Close()

    t.Execute(f, data)
}
```

## 最佳实践

### 1. 包含生成注释

```go
// Code generated by mygen. DO NOT EDIT.
package example

// 这告诉工具（和开发者）这个文件是生成的
// go fmt 会识别这个模式
```

### 2. 使生成可重现

```go
// 错误：非确定性输出
//go:generate sh -c "date > version.go"

// 正确：仅基于输入的确定性输出
//go:generate stringer -type=Status
```

### 3. 版本化你的工具

```go
// Makefile 或脚本确保正确的工具版本
//go:generate go install golang.org/x/tools/cmd/stringer@v0.1.12
//go:generate stringer -type=Status

// 或使用 go.mod 工具依赖（Go 1.17+）
```

### 4. 记录生成要求

```go
// 文件: doc.go
/*
Package models 包含数据库模型。

代码生成：
此包使用 go generate。提交前运行：

    go generate ./...

所需工具：
    go install golang.org/x/tools/cmd/stringer@latest
    go install github.com/golang/mock/mockgen@latest

生成的文件：
    - status_string.go（来自 stringer）
    - mocks/*.go（来自 mockgen）
*/
package models
```

### 5. CI/CD 验证

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: 安装生成器
        run: |
          go install golang.org/x/tools/cmd/stringer@latest

      - name: 验证生成的代码
        run: |
          go generate ./...
          git diff --exit-code || (echo "生成的代码已过期" && exit 1)
```

## 常见陷阱

### 1. 忘记运行 go generate

```bash
# 添加 pre-commit 钩子
# .git/hooks/pre-commit
#!/bin/sh
go generate ./...
git diff --exit-code
```

### 2. 生成器输出在不同环境间不一致

```go
// 使用明确的版本和确定性输出
//go:generate stringer -type=Status -linecomment=false

// 避免基于时间或随机的内容
// 在迭代前对 map 排序
```

### 3. 循环依赖

```go
// 错误：同一包中的生成器需要生成的代码
//go:generate mygen -input=types.go  // mygen 需要此包编译！

// 正确：生成器在独立模块中
//go:generate go run github.com/myorg/mygen@v1.0.0 -input=types.go
```

### 4. 缺少构建约束

```go
// 文件: gen.go
//go:build ignore

// 此文件仅用于生成，不参与编译
package main

//go:generate go run gen.go
```

## 性能考量

### 生成时间

```go
// 并行化独立的生成器
//go:generate sh -c "stringer -type=A & stringer -type=B & wait"

// 或使用 make 进行依赖管理
// Makefile
generate: status_string.go mock_repo.go

status_string.go: status.go
    stringer -type=Status

mock_repo.go: repository.go
    mockgen -source=repository.go -destination=mock_repo.go
```

### 增量生成

```go
// 仅在源文件变化时重新生成
// 大多数工具不支持这个，使用 make/构建系统

// Makefile 示例
%.string.go: %.go
    stringer -type=$(basename $<) -output=$@
```

## 面试要点

1. **什么是 go generate**：
   - 扫描 `//go:generate` 注释
   - 运行指定的命令
   - 生成的代码提交到 VCS
   - 不在 go build 期间运行

2. **常用工具**：
   - `stringer`：枚举的字符串方法
   - `mockgen`：测试用的 mock 生成
   - `protoc`：Protocol buffer 编译
   - 自定义生成器

3. **内置变量**：
   - `$GOFILE`、`$GOPACKAGE`、`$GOLINE`
   - `$GOOS`、`$GOARCH`

4. **最佳实践**：
   - "Code generated" 注释
   - 可重现的输出
   - 版本控制生成的文件
   - CI 验证

5. **与 //go:embed 的区别**：
   - `go:embed` 用于编译时嵌入文件
   - `go:generate` 用于运行任意命令
   - `go:embed` 是内置的（Go 1.16+）
   - `go:generate` 需要外部工具

## 延伸阅读

- [go generate 命令](https://pkg.go.dev/cmd/go#hdr-Generate_Go_files_by_processing_source)
- [Go 博客：生成代码](https://blog.golang.org/generate)
- [stringer 工具](https://pkg.go.dev/golang.org/x/tools/cmd/stringer)
- [mockgen 工具](https://github.com/golang/mock)
- [Go AST 包](https://pkg.go.dev/go/ast)
- [jennifer - Go 代码生成器](https://github.com/dave/jennifer)
