---
title: 模板
description: 使用 Go 的模板包生成文本和 HTML
track: go
section: stdlib
difficulty: intermediate
tags:
  - go
  - templates
  - text-template
  - html-template
status: imported
origin: old/src/content/docs/go/templates.zh.md
divergence: 0.204
issues: []
legacy:
  category: Go
  subcategory: Web
  order: 19
  lastUpdated: 2026-01-07
---


## 概述

Go 通过 `text/template` 和 `html/template` 包提供了强大的模板功能。这些包允许你通过将值替换到模板文件中来动态生成文本和 HTML。`html/template` 包专门用于安全的 HTML 生成，自动转义值以防止注入攻击。

## 文本模板 vs HTML 模板

### text/template

`text/template` 包是一个通用的文本模板引擎。它处理任何文本内容，对于生成纯文本、配置文件、电子邮件和其他非 HTML 内容很有用。

```go
package main

import (
	"fmt"
	"log"
	"text/template"
)

func main() {
	// 从字符串创建模板
	tmpl, err := template.New("greeting").Parse("Hello, {{.Name}}!")
	if err != nil {
		log.Fatal(err)
	}

	// 要注入模板的数据
	data := map[string]string{"Name": "Alice"}

	// 执行模板
	err = tmpl.Execute(os.Stdout, data)
	if err != nil {
		log.Fatal(err)
	}
	// 输出: Hello, Alice!
}
```

### html/template

`html/template` 包扩展了 `text/template`，具有自动 HTML 转义功能。这通过转义特殊 HTML 字符来防止注入攻击。

```go
package main

import (
	"html/template"
	"log"
	"os"
)

func main() {
	tmpl, err := template.New("page").Parse("<p>{{.Content}}</p>")
	if err != nil {
		log.Fatal(err)
	}

	// 包含潜在危险 HTML 的数据
	data := map[string]string{
		"Content": "<script>alert('XSS')</script>",
	}

	err = tmpl.Execute(os.Stdout, data)
	if err != nil {
		log.Fatal(err)
	}
	// 输出: <p>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</p>
}
```

## 理解 Go 模板

Go 中的模板是文本文件或字符串，包含静态文本和用双花括号 `{{ }}` 括起来的动作。这些动作可以引用数据、执行控制结构和调用函数。模板解析一次后可以用不同的数据执行多次。

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    // 创建一个简单的模板
    tmpl, err := template.New("hello").Parse("Hello, {{.Name}}!\n")
    if err != nil {
        panic(err)
    }

    data := struct {
        Name string
    }{
        Name: "World",
    }

    // 执行模板
    err = tmpl.Execute(os.Stdout, data)
    if err != nil {
        panic(err)
    }
    // 输出: Hello, World!
}
```

## 基本模板语法

### 数据访问

使用点（`.`）运算符访问当前上下文中的数据：

点 `.` 表示当前正在处理的值。在顶层，这是传递给 `Execute` 的数据。在循环或 `with` 块内，点会改变为表示当前项目。

```go
package main

import (
    "os"
    "text/template"
)

type User struct {
    Name    string
    Email   string
    Age     int
    Premium bool
}

func main() {
    tmpl := template.Must(template.New("user").Parse(`
User Profile:
  Name: {{.Name}}
  Email: {{.Email}}
  Age: {{.Age}}
  Premium: {{.Premium}}
`))

    user := User{
        Name:    "Alice",
        Email:   "alice@example.com",
        Age:     28,
        Premium: true,
    }

    tmpl.Execute(os.Stdout, user)
}
```

### 访问嵌套字段

你可以使用点表示法访问嵌套的结构体字段和 map 键：

```go
package main

import (
    "os"
    "text/template"
)

type Address struct {
    Street  string
    City    string
    Country string
}

type Person struct {
    Name    string
    Address Address
    Tags    map[string]string
}

func main() {
    tmpl := template.Must(template.New("person").Parse(`
{{.Name}} lives at:
  {{.Address.Street}}
  {{.Address.City}}, {{.Address.Country}}

Role: {{.Tags.role}}
`))

    person := Person{
        Name: "Bob",
        Address: Address{
            Street:  "123 Main St",
            City:    "New York",
            Country: "USA",
        },
        Tags: map[string]string{
            "role":       "developer",
            "department": "engineering",
        },
    }

    tmpl.Execute(os.Stdout, person)
}
```

### 变量

你可以在模板中使用 `$` 前缀定义变量：

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    tmpl := template.Must(template.New("vars").Parse(`
{{$name := .Name}}
{{$count := len .Items}}

{{$name}} has {{$count}} items:
{{range $index, $item := .Items}}
  {{$index}}: {{$item}}
{{end}}
`))

    data := struct {
        Name  string
        Items []string
    }{
        Name:  "Alice",
        Items: []string{"apple", "banana", "cherry"},
    }

    tmpl.Execute(os.Stdout, data)
}
```

## 动作和管道

### 动作

动作是用 `{{` 和 `}}` 括起来的模板指令。常见的动作包括：

- `{{.}}` - 当前值
- `{{.Field}}` - 字段访问
- `{{if}}`、`{{else}}`、`{{else if}}`、`{{end}}` - 条件
- `{{range}}`、`{{end}}` - 循环
- `{{with}}`、`{{end}}` - 上下文切换

### 管道

管道允许通过将一个命令的输出作为下一个命令的输入来链接操作：

```go
tmpl, _ := template.New("test").Parse(`
{{.Name | strings.ToUpper}}
`)

// "John" 变成 "JOHN"
```

可以链接多个过滤器：

```go
// 自定义过滤器链
type Page struct {
	Text string
}

funcMap := template.FuncMap{
	"toUpper": strings.ToUpper,
	"reverse": func(s string) string {
		runes := []rune(s)
		for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
			runes[i], runes[j] = runes[j], runes[i]
		}
		return string(runes)
	},
}

tmpl, _ := template.New("test").Funcs(funcMap).Parse(`
{{.Text | toUpper | reverse}}
`)

tmpl.Execute(os.Stdout, Page{"hello"})
// 输出: OLLEH
```

## 控制结构

### if/else 条件

`if` 动作评估其参数是否为"真"（非空、非零、非 nil）：

```go
package main

import (
    "os"
    "text/template"
)

type User struct {
    Name      string
    IsAdmin   bool
    Role      string
    LoginCount int
}

func main() {
    tmpl := template.Must(template.New("conditional").Parse(`
User: {{.Name}}

{{if .IsAdmin}}
  [ADMIN ACCESS GRANTED]
{{else}}
  [Standard User]
{{end}}

{{if .Role}}
  Role: {{.Role}}
{{else}}
  Role: Not Assigned
{{end}}

{{if gt .LoginCount 100}}
  Veteran User ({{.LoginCount}} logins)
{{else if gt .LoginCount 10}}
  Regular User ({{.LoginCount}} logins)
{{else}}
  New User ({{.LoginCount}} logins)
{{end}}
`))

    users := []User{
        {Name: "Alice", IsAdmin: true, Role: "Manager", LoginCount: 150},
        {Name: "Bob", IsAdmin: false, Role: "", LoginCount: 5},
    }

    for _, user := range users {
        tmpl.Execute(os.Stdout, user)
    }
}
```

### range 迭代

`range` 动作迭代切片、数组、map 和通道：

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    tmpl := template.Must(template.New("range").Parse(`
=== Slice Iteration ===
{{range .Items}}
  - {{.}}
{{end}}

=== Slice with Index ===
{{range $i, $v := .Items}}
  {{$i}}: {{$v}}
{{end}}

=== Map Iteration ===
{{range $key, $value := .Config}}
  {{$key}} = {{$value}}
{{end}}

=== Empty Check ===
{{range .Empty}}
  This won't print
{{else}}
  The list is empty
{{end}}
`))

    data := struct {
        Items  []string
        Config map[string]string
        Empty  []int
    }{
        Items:  []string{"apple", "banana", "cherry"},
        Config: map[string]string{"debug": "true", "port": "8080"},
        Empty:  []int{},
    }

    tmpl.Execute(os.Stdout, data)
}
```

### with 作用域

如果值不为空，`with` 动作将点改变为新值：

```go
package main

import (
    "os"
    "text/template"
)

type Company struct {
    Name    string
    Address *Address
}

type Address struct {
    Street string
    City   string
}

func main() {
    tmpl := template.Must(template.New("with").Parse(`
Company: {{.Name}}

{{with .Address}}
Address:
  Street: {{.Street}}
  City: {{.City}}
{{else}}
No address on file
{{end}}
`))

    companies := []Company{
        {
            Name:    "Acme Corp",
            Address: &Address{Street: "123 Main St", City: "NYC"},
        },
        {
            Name:    "StartupXYZ",
            Address: nil,
        },
    }

    for _, company := range companies {
        tmpl.Execute(os.Stdout, company)
    }
}
```

## 内置函数

Go 模板包含几个内置函数：

### 比较函数

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    tmpl := template.Must(template.New("compare").Parse(`
Value: {{.Value}}

{{if eq .Value 10}}Equal to 10{{end}}
{{if ne .Value 5}}Not equal to 5{{end}}
{{if lt .Value 20}}Less than 20{{end}}
{{if le .Value 10}}Less than or equal to 10{{end}}
{{if gt .Value 5}}Greater than 5{{end}}
{{if ge .Value 10}}Greater than or equal to 10{{end}}

Multiple comparisons: {{if or (eq .Value 10) (eq .Value 20)}}Is 10 or 20{{end}}
All conditions: {{if and (gt .Value 5) (lt .Value 15)}}Between 5 and 15{{end}}
Negation: {{if not (eq .Value 0)}}Not zero{{end}}
`))

    tmpl.Execute(os.Stdout, struct{ Value int }{Value: 10})
}
```

### 字符串和集合函数

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    tmpl := template.Must(template.New("functions").Parse(`
=== len ===
Array length: {{len .Items}}
String length: {{len .Name}}

=== index ===
First item: {{index .Items 0}}
Last item: {{index .Items 2}}
Nested access: {{index .Matrix 1 1}}

=== print functions ===
print: {{print .Name " has " (len .Items) " items"}}
printf: {{printf "%s: %d items" .Name (len .Items)}}
println: {{println .Name}}

=== slice ===
First two: {{slice .Items 0 2}}
From index 1: {{slice .Items 1}}
`))

    data := struct {
        Name   string
        Items  []string
        Matrix [][]int
    }{
        Name:  "Alice",
        Items: []string{"a", "b", "c"},
        Matrix: [][]int{
            {1, 2, 3},
            {4, 5, 6},
        },
    }

    tmpl.Execute(os.Stdout, data)
}
```

### call 函数

`call` 函数调用方法或函数：

```go
package main

import (
    "os"
    "strings"
    "text/template"
)

type StringProcessor struct {
    Value string
}

func (s StringProcessor) Upper() string {
    return strings.ToUpper(s.Value)
}

func (s StringProcessor) Repeat(n int) string {
    return strings.Repeat(s.Value, n)
}

func main() {
    tmpl := template.Must(template.New("call").Parse(`
Original: {{.Value}}
Upper: {{.Upper}}
Repeated: {{.Repeat 3}}

Using call: {{call .Upper}}
`))

    processor := StringProcessor{Value: "hello"}
    tmpl.Execute(os.Stdout, processor)
}
```

## 自定义函数

### 定义自定义函数

在解析之前使用 `Funcs` 方法注册自定义函数：

```go
package main

import (
    "os"
    "strings"
    "text/template"
    "time"
)

func main() {
    funcMap := template.FuncMap{
        "upper":    strings.ToUpper,
        "lower":    strings.ToLower,
        "title":    strings.Title,
        "repeat":   strings.Repeat,
        "join":     strings.Join,
        "split":    strings.Split,
        "contains": strings.Contains,
        "replace":  strings.ReplaceAll,
        "now":      time.Now,
        "formatDate": func(t time.Time, layout string) string {
            return t.Format(layout)
        },
        "add": func(a, b int) int {
            return a + b
        },
        "sub": func(a, b int) int {
            return a - b
        },
        "mul": func(a, b int) int {
            return a * b
        },
        "div": func(a, b int) int {
            if b == 0 {
                return 0
            }
            return a / b
        },
        "default": func(defaultVal, val interface{}) interface{} {
            if val == nil || val == "" || val == 0 {
                return defaultVal
            }
            return val
        },
    }

    tmpl := template.Must(template.New("custom").Funcs(funcMap).Parse(`
=== String Functions ===
Upper: {{upper .Name}}
Lower: {{lower .Name}}
Title: {{title .Description}}
Repeat: {{repeat .Name 3}}
Join: {{join .Tags ", "}}
Replace: {{replace .Description "good" "great"}}

=== Math Functions ===
Add: {{add .X .Y}}
Sub: {{sub .X .Y}}
Mul: {{mul .X .Y}}
Div: {{div .X .Y}}

=== Date Functions ===
Now: {{formatDate now "2006-01-02 15:04:05"}}
Created: {{formatDate .Created "Jan 02, 2006"}}

=== Default Values ===
Role: {{default "guest" .Role}}
Status: {{default "active" .Status}}
`))

    data := struct {
        Name        string
        Description string
        Tags        []string
        X, Y        int
        Created     time.Time
        Role        string
        Status      string
    }{
        Name:        "ALICE",
        Description: "this is a good example",
        Tags:        []string{"go", "templates", "tutorial"},
        X:           10,
        Y:           3,
        Created:     time.Now().AddDate(-1, 0, 0),
        Role:        "",
        Status:      "premium",
    }

    tmpl.Execute(os.Stdout, data)
}
```

### 函数签名规则

自定义函数必须遵循以下规则：

1. 函数必须返回一个值，或两个值（第二个是 `error`）
2. 如果函数返回错误，模板停止处理并返回错误

```go
funcMap := template.FuncMap{
	// 单个返回值
	"double": func(x int) int {
		return x * 2
	},

	// 返回值和错误
	"safeDivide": func(a, b int) (int, error) {
		if b == 0 {
			return 0, fmt.Errorf("division by zero")
		}
		return a / b, nil
	},
}
```

## 管道

管道允许类似 Unix 管道的命令链接：

```go
package main

import (
    "os"
    "strings"
    "text/template"
)

func main() {
    funcMap := template.FuncMap{
        "upper":   strings.ToUpper,
        "lower":   strings.ToLower,
        "trim":    strings.TrimSpace,
        "replace": strings.ReplaceAll,
        "prefix": func(prefix, s string) string {
            return prefix + s
        },
        "suffix": func(suffix, s string) string {
            return s + suffix
        },
    }

    tmpl := template.Must(template.New("pipeline").Funcs(funcMap).Parse(`
Simple pipeline: {{.Name | upper}}

Chained pipelines: {{.Name | lower | trim}}

Multiple arguments: {{.Text | replace " " "_" | upper}}

With prefix/suffix: {{.Name | lower | prefix "user_" | suffix "_id"}}

Conditional pipeline: {{if .Active | not}}User is inactive{{end}}

Pipeline in range:
{{range .Items | slice 0 2}}
  - {{. | upper}}
{{end}}
`))

    data := struct {
        Name   string
        Text   string
        Active bool
        Items  []string
    }{
        Name:   "  Alice  ",
        Text:   "hello world",
        Active: false,
        Items:  []string{"apple", "banana", "cherry"},
    }

    tmpl.Execute(os.Stdout, data)
}
```

## 模板文件和嵌套

### 从文件解析

使用 `ParseFiles` 从文件加载模板：

```go
tmpl, err := template.ParseFiles("base.html", "header.html", "footer.html")
if err != nil {
	log.Fatal(err)
}
```

使用 `ParseGlob` 解析匹配模式的所有文件：

```go
tmpl, err := template.ParseGlob("templates/*.html")
if err != nil {
	log.Fatal(err)
}
```

### 使用 define 和 template 的模板嵌套

使用 `define` 创建命名模板，使用 `template` 调用它们：

```go
// templates/main.html
<!DOCTYPE html>
<html>
<head>
	<title>{{template "title" .}}</title>
</head>
<body>
	{{template "header" .}}
	<main>{{.Content}}</main>
	{{template "footer" .}}
</body>
</html>

{{define "title"}}My Website{{end}}
{{define "header"}}
<header>
	<h1>Welcome {{.Username}}</h1>
</header>
{{end}}
{{define "footer"}}
<footer><p>&copy; 2024</p></footer>
{{end}}
```

执行特定模板：

```go
tmpl, _ := template.ParseGlob("templates/*.html")
tmpl.ExecuteTemplate(os.Stdout, "main.html", data)
```

## 模板组合

### 定义和使用子模板

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    const templateText = `
{{define "header"}}
========================================
  {{.Title}}
========================================
{{end}}

{{define "footer"}}
----------------------------------------
  Generated at: {{.Timestamp}}
----------------------------------------
{{end}}

{{define "item"}}
  * {{.Name}} - ${{printf "%.2f" .Price}}
{{end}}

{{define "main"}}
{{template "header" .}}

Items:
{{range .Items}}
{{template "item" .}}
{{end}}

{{template "footer" .}}
{{end}}

{{template "main" .}}
`

    tmpl := template.Must(template.New("composed").Parse(templateText))

    data := struct {
        Title     string
        Timestamp string
        Items     []struct {
            Name  string
            Price float64
        }
    }{
        Title:     "Product List",
        Timestamp: "2024-01-15 10:30:00",
        Items: []struct {
            Name  string
            Price float64
        }{
            {Name: "Widget", Price: 19.99},
            {Name: "Gadget", Price: 29.99},
            {Name: "Gizmo", Price: 39.99},
        },
    }

    tmpl.Execute(os.Stdout, data)
}
```

### 模板继承模式

```go
package main

import (
    "bytes"
    "os"
    "text/template"
)

func main() {
    // 基础模板
    baseTemplate := `
{{define "base"}}
<!DOCTYPE html>
<html>
<head>
    <title>{{block "title" .}}Default Title{{end}}</title>
</head>
<body>
    <header>
        {{block "header" .}}
        <nav>Default Navigation</nav>
        {{end}}
    </header>

    <main>
        {{block "content" .}}
        <p>Default content</p>
        {{end}}
    </main>

    <footer>
        {{block "footer" .}}
        <p>Default Footer</p>
        {{end}}
    </footer>
</body>
</html>
{{end}}
`

    // 覆盖块的页面模板
    pageTemplate := `
{{define "title"}}{{.PageTitle}} - My Site{{end}}

{{define "content"}}
<h1>{{.Heading}}</h1>
<p>{{.Body}}</p>
{{end}}

{{define "footer"}}
<p>Copyright 2024 - {{.Author}}</p>
{{end}}
`

    // 解析模板
    tmpl := template.Must(template.New("page").Parse(baseTemplate))
    tmpl = template.Must(tmpl.Parse(pageTemplate))

    data := struct {
        PageTitle string
        Heading   string
        Body      string
        Author    string
    }{
        PageTitle: "Welcome",
        Heading:   "Hello, World!",
        Body:      "This is the main content of the page.",
        Author:    "Go Developer",
    }

    var buf bytes.Buffer
    tmpl.ExecuteTemplate(&buf, "base", data)
    os.Stdout.Write(buf.Bytes())
}
```

### 从文件加载模板

```go
package main

import (
    "os"
    "path/filepath"
    "text/template"
)

func main() {
    // 创建模板目录结构
    os.MkdirAll("templates/layouts", 0755)
    os.MkdirAll("templates/partials", 0755)

    // 创建模板文件（实际上这些文件应该已经存在）
    os.WriteFile("templates/layouts/base.tmpl", []byte(`
{{define "base"}}
<html>
<head><title>{{template "title" .}}</title></head>
<body>
{{template "header" .}}
{{template "content" .}}
{{template "footer" .}}
</body>
</html>
{{end}}
`), 0644)

    os.WriteFile("templates/partials/header.tmpl", []byte(`
{{define "header"}}<header><h1>{{.SiteName}}</h1></header>{{end}}
`), 0644)

    os.WriteFile("templates/partials/footer.tmpl", []byte(`
{{define "footer"}}<footer><p>{{.Copyright}}</p></footer>{{end}}
`), 0644)

    os.WriteFile("templates/home.tmpl", []byte(`
{{define "title"}}Home - {{.SiteName}}{{end}}
{{define "content"}}
<main>
    <h2>Welcome to {{.SiteName}}</h2>
    <p>{{.Message}}</p>
</main>
{{end}}
`), 0644)

    // 加载所有模板
    tmpl := template.New("")

    // 加载布局
    layoutFiles, _ := filepath.Glob("templates/layouts/*.tmpl")
    tmpl = template.Must(tmpl.ParseFiles(layoutFiles...))

    // 加载部件
    partialFiles, _ := filepath.Glob("templates/partials/*.tmpl")
    tmpl = template.Must(tmpl.ParseFiles(partialFiles...))

    // 加载页面模板
    pageFiles, _ := filepath.Glob("templates/*.tmpl")
    tmpl = template.Must(tmpl.ParseFiles(pageFiles...))

    data := struct {
        SiteName  string
        Message   string
        Copyright string
    }{
        SiteName:  "My Website",
        Message:   "Hello, visitor!",
        Copyright: "2024 My Company",
    }

    tmpl.ExecuteTemplate(os.Stdout, "base", data)

    // 清理
    os.RemoveAll("templates")
}
```

## HTML 模板

`html/template` 包提供与 `text/template` 相同的功能，但具有对 HTML、JavaScript、CSS 和 URL 的自动转义。

### 基本 HTML 模板

```go
package main

import (
    "html/template"
    "os"
)

type Article struct {
    Title   string
    Content string
    Author  string
    Tags    []string
}

func main() {
    tmpl := template.Must(template.New("article").Parse(`
<!DOCTYPE html>
<html>
<head>
    <title>{{.Title}}</title>
</head>
<body>
    <article>
        <h1>{{.Title}}</h1>
        <p class="author">By {{.Author}}</p>
        <div class="content">
            {{.Content}}
        </div>
        <div class="tags">
            {{range .Tags}}
            <span class="tag">{{.}}</span>
            {{end}}
        </div>
    </article>
</body>
</html>
`))

    article := Article{
        Title:   "Introduction to Go Templates",
        Content: "Go templates are powerful and flexible.",
        Author:  "Jane Doe",
        Tags:    []string{"Go", "Templates", "Tutorial"},
    }

    tmpl.Execute(os.Stdout, article)
}
```

### 自动 XSS 防护

```go
package main

import (
    "html/template"
    "os"
)

func main() {
    // html/template 自动转义危险内容
    tmpl := template.Must(template.New("safe").Parse(`
<!DOCTYPE html>
<html>
<body>
    <h1>User Input Demo</h1>

    <!-- 这将被自动转义 -->
    <p>Username: {{.Username}}</p>
    <p>Comment: {{.Comment}}</p>

    <!-- 危险脚本被转义 -->
    <div>Bio: {{.Bio}}</div>
</body>
</html>
`))

    data := struct {
        Username string
        Comment  string
        Bio      string
    }{
        Username: "user123",
        Comment:  "<script>alert('XSS')</script>",
        Bio:      `<img src="x" onerror="alert('XSS')">`,
    }

    tmpl.Execute(os.Stdout, data)
    // script 和 img 标签将被转义，防止 XSS 攻击
}
```

### 使用 template.HTML 的受信任 HTML

```go
package main

import (
    "html/template"
    "os"
)

func main() {
    tmpl := template.Must(template.New("trusted").Parse(`
<!DOCTYPE html>
<html>
<body>
    <h1>Content Types</h1>

    <!-- 转义（安全） -->
    <div class="escaped">{{.UnsafeHTML}}</div>

    <!-- 受信任（作为 HTML 渲染） -->
    <div class="trusted">{{.TrustedHTML}}</div>

    <!-- 受信任的 CSS -->
    <style>{{.TrustedCSS}}</style>

    <!-- 受信任的 JavaScript -->
    <script>{{.TrustedJS}}</script>

    <!-- 受信任的 URL -->
    <a href="{{.TrustedURL}}">Link</a>
</body>
</html>
`))

    data := struct {
        UnsafeHTML  string
        TrustedHTML template.HTML
        TrustedCSS  template.CSS
        TrustedJS   template.JS
        TrustedURL  template.URL
    }{
        UnsafeHTML:  "<strong>This will be escaped</strong>",
        TrustedHTML: template.HTML("<strong>This will render as bold</strong>"),
        TrustedCSS:  template.CSS("body { background: blue; }"),
        TrustedJS:   template.JS("console.log('Hello');"),
        TrustedURL:  template.URL("https://example.com?q=test"),
    }

    tmpl.Execute(os.Stdout, data)
}
```

### 上下文感知转义

```go
package main

import (
    "html/template"
    "os"
)

func main() {
    tmpl := template.Must(template.New("context").Parse(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .user-bg { background-color: {{.Color}}; }
    </style>
</head>
<body>
    <!-- 文本上下文 -->
    <p>Name: {{.Name}}</p>

    <!-- 属性上下文 -->
    <div id="{{.ID}}" class="{{.Class}}">
        <!-- URL 上下文 -->
        <a href="{{.URL}}">Profile</a>

        <!-- JavaScript 上下文 -->
        <button onclick="greet('{{.Name}}')">Greet</button>
    </div>

    <script>
        // JavaScript 上下文
        var userData = {
            name: "{{.Name}}",
            id: {{.UserID}}
        };
    </script>
</body>
</html>
`))

    data := struct {
        Name   string
        ID     string
        Class  string
        URL    string
        Color  string
        UserID int
    }{
        Name:   "John O'Connor",
        ID:     "user-123",
        Class:  "profile active",
        URL:    "/users/123?tab=info",
        Color:  "#336699",
        UserID: 123,
    }

    tmpl.Execute(os.Stdout, data)
}
```

## 高级特性

### 使用 with 切换上下文

`with` 动作改变当前上下文：

```go
tmpl, _ := template.New("test").Parse(`
{{with .User}}
  Name: {{.Name}}
  Email: {{.Email}}
{{end}}
`)

type User struct {
	Name  string
	Email string
}

data := map[string]User{
	"User": {"Eve", "eve@example.com"},
}

tmpl.Execute(os.Stdout, data)
```

### 模板注释

注释在渲染时被忽略：

```go
tmpl, _ := template.New("test").Parse(`
{{/* This is a comment */}}
<p>{{.Title}}</p>
{{/* Multi-line comments
     are also supported */}}
`)
```

### 处理 Nil 值

检查 nil 或空值：

```go
tmpl, _ := template.New("test").Parse(`
{{if .User}}
  {{.User.Name}}
{{else}}
  No user found
{{end}}
`)
```

## 实用示例

### 电子邮件模板系统

```go
package main

import (
    "bytes"
    "fmt"
    "html/template"
    "time"
)

type EmailData struct {
    RecipientName string
    Subject       string
    Items         []OrderItem
    Total         float64
    OrderDate     time.Time
    SupportEmail  string
}

type OrderItem struct {
    Name     string
    Quantity int
    Price    float64
}

const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #4a90d9; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .total { font-weight: bold; font-size: 1.2em; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Confirmation</h1>
    </div>

    <div class="content">
        <p>Dear {{.RecipientName}},</p>

        <p>Thank you for your order placed on {{formatDate .OrderDate "January 2, 2006"}}.</p>

        <h2>Order Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {{range .Items}}
                <tr>
                    <td>{{.Name}}</td>
                    <td>{{.Quantity}}</td>
                    <td>${{printf "%.2f" .Price}}</td>
                    <td>${{printf "%.2f" (multiply .Price .Quantity)}}</td>
                </tr>
                {{end}}
            </tbody>
            <tfoot>
                <tr class="total">
                    <td colspan="3">Total</td>
                    <td>${{printf "%.2f" .Total}}</td>
                </tr>
            </tfoot>
        </table>

        <p>If you have any questions, please contact us at {{.SupportEmail}}.</p>
    </div>

    <div class="footer">
        <p>This email was sent automatically. Please do not reply.</p>
    </div>
</body>
</html>
`

func main() {
    funcMap := template.FuncMap{
        "formatDate": func(t time.Time, layout string) string {
            return t.Format(layout)
        },
        "multiply": func(a float64, b int) float64 {
            return a * float64(b)
        },
    }

    tmpl := template.Must(template.New("email").Funcs(funcMap).Parse(emailTemplate))

    data := EmailData{
        RecipientName: "Alice Smith",
        Subject:       "Your Order Confirmation",
        Items: []OrderItem{
            {Name: "Widget Pro", Quantity: 2, Price: 29.99},
            {Name: "Gadget Plus", Quantity: 1, Price: 49.99},
            {Name: "Accessory Pack", Quantity: 3, Price: 9.99},
        },
        Total:        139.94,
        OrderDate:    time.Now(),
        SupportEmail: "support@example.com",
    }

    var buf bytes.Buffer
    if err := tmpl.Execute(&buf, data); err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(buf.String())
}
```

### 配置文件生成器

```go
package main

import (
    "os"
    "text/template"
)

type NginxConfig struct {
    ServerName   string
    Port         int
    UpstreamName string
    Upstreams    []Upstream
    Locations    []Location
    EnableSSL    bool
    SSLCertPath  string
    SSLKeyPath   string
}

type Upstream struct {
    Address string
    Weight  int
}

type Location struct {
    Path     string
    Proxy    bool
    ProxyTo  string
    Root     string
    TryFiles string
}

const nginxTemplate = `
# Nginx configuration generated automatically

{{if .Upstreams}}
upstream {{.UpstreamName}} {
    {{range .Upstreams}}
    server {{.Address}}{{if .Weight}} weight={{.Weight}}{{end}};
    {{end}}
}
{{end}}

server {
    listen {{.Port}}{{if .EnableSSL}} ssl{{end}};
    server_name {{.ServerName}};

    {{if .EnableSSL}}
    ssl_certificate {{.SSLCertPath}};
    ssl_certificate_key {{.SSLKeyPath}};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    {{end}}

    {{range .Locations}}
    location {{.Path}} {
        {{if .Proxy}}
        proxy_pass {{.ProxyTo}};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        {{else}}
        root {{.Root}};
        {{if .TryFiles}}
        try_files {{.TryFiles}};
        {{end}}
        {{end}}
    }
    {{end}}
}
`

func main() {
    tmpl := template.Must(template.New("nginx").Parse(nginxTemplate))

    config := NginxConfig{
        ServerName:   "example.com",
        Port:         443,
        UpstreamName: "app_servers",
        Upstreams: []Upstream{
            {Address: "127.0.0.1:3001", Weight: 3},
            {Address: "127.0.0.1:3002", Weight: 2},
            {Address: "127.0.0.1:3003", Weight: 1},
        },
        Locations: []Location{
            {
                Path:    "/api",
                Proxy:   true,
                ProxyTo: "http://app_servers",
            },
            {
                Path:     "/",
                Proxy:    false,
                Root:     "/var/www/html",
                TryFiles: "$uri $uri/ /index.html",
            },
        },
        EnableSSL:   true,
        SSLCertPath: "/etc/ssl/certs/example.com.crt",
        SSLKeyPath:  "/etc/ssl/private/example.com.key",
    }

    tmpl.Execute(os.Stdout, config)
}
```

### 带模板的 Web 应用

```go
package main

import (
    "fmt"
    "html/template"
    "net/http"
    "time"
)

type PageData struct {
    Title       string
    CurrentYear int
    User        *User
    Content     interface{}
}

type User struct {
    ID       int
    Username string
    Email    string
    IsAdmin  bool
}

type Product struct {
    ID          int
    Name        string
    Description string
    Price       float64
    InStock     bool
}

var templates *template.Template

func init() {
    funcMap := template.FuncMap{
        "formatPrice": func(p float64) string {
            return fmt.Sprintf("$%.2f", p)
        },
        "currentYear": func() int {
            return time.Now().Year()
        },
    }

    templates = template.Must(template.New("").Funcs(funcMap).Parse(`
{{define "base"}}
<!DOCTYPE html>
<html>
<head>
    <title>{{.Title}} - My Store</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        header { background: #333; color: white; padding: 1rem; }
        nav a { color: white; margin-right: 1rem; text-decoration: none; }
        main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        footer { background: #f5f5f5; padding: 1rem; text-align: center; margin-top: 2rem; }
        .product { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
        .product h3 { margin-top: 0; }
        .price { color: #e44d26; font-size: 1.2em; font-weight: bold; }
        .out-of-stock { color: #999; }
        .btn { display: inline-block; padding: 0.5rem 1rem; background: #4a90d9; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <header>
        <nav>
            <a href="/">Home</a>
            <a href="/products">Products</a>
            {{if .User}}
                <a href="/profile">{{.User.Username}}</a>
                {{if .User.IsAdmin}}<a href="/admin">Admin</a>{{end}}
            {{else}}
                <a href="/login">Login</a>
            {{end}}
        </nav>
    </header>

    <main>
        {{template "content" .}}
    </main>

    <footer>
        <p>&copy; {{currentYear}} My Store. All rights reserved.</p>
    </footer>
</body>
</html>
{{end}}

{{define "home"}}
{{template "base" .}}
{{end}}

{{define "content"}}
<h1>{{.Title}}</h1>
{{with .Content}}
    {{if (index . "Message")}}
        <p>{{index . "Message"}}</p>
    {{end}}
    {{if (index . "Products")}}
        {{range index . "Products"}}
        <div class="product">
            <h3>{{.Name}}</h3>
            <p>{{.Description}}</p>
            <p class="price">{{formatPrice .Price}}</p>
            {{if .InStock}}
                <a href="/cart/add/{{.ID}}" class="btn">Add to Cart</a>
            {{else}}
                <span class="out-of-stock">Out of Stock</span>
            {{end}}
        </div>
        {{end}}
    {{end}}
{{end}}
{{end}}
`))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    data := PageData{
        Title:       "Welcome",
        CurrentYear: time.Now().Year(),
        User: &User{
            ID:       1,
            Username: "johndoe",
            Email:    "john@example.com",
            IsAdmin:  true,
        },
        Content: map[string]interface{}{
            "Message": "Welcome to our store! Check out our latest products.",
        },
    }

    templates.ExecuteTemplate(w, "home", data)
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
    products := []Product{
        {ID: 1, Name: "Laptop", Description: "Powerful laptop for work and play", Price: 999.99, InStock: true},
        {ID: 2, Name: "Mouse", Description: "Ergonomic wireless mouse", Price: 49.99, InStock: true},
        {ID: 3, Name: "Keyboard", Description: "Mechanical keyboard with RGB", Price: 149.99, InStock: false},
    }

    data := PageData{
        Title:       "Products",
        CurrentYear: time.Now().Year(),
        User: &User{
            ID:       1,
            Username: "johndoe",
            Email:    "john@example.com",
            IsAdmin:  true,
        },
        Content: map[string]interface{}{
            "Products": products,
        },
    }

    templates.ExecuteTemplate(w, "home", data)
}

func main() {
    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/products", productsHandler)

    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}
```

### 报表生成器

```go
package main

import (
    "os"
    "text/template"
    "time"
)

type Report struct {
    Title        string
    GeneratedAt  time.Time
    Period       string
    Summary      Summary
    TopProducts  []ProductStat
    SalesByMonth []MonthlySales
}

type Summary struct {
    TotalRevenue   float64
    TotalOrders    int
    AverageOrder   float64
    UniqueCustomers int
}

type ProductStat struct {
    Rank     int
    Name     string
    Quantity int
    Revenue  float64
}

type MonthlySales struct {
    Month   string
    Revenue float64
    Orders  int
}

const reportTemplate = `
================================================================================
                           {{.Title}}
================================================================================

Generated: {{formatDate .GeneratedAt "2006-01-02 15:04:05"}}
Period: {{.Period}}

--------------------------------------------------------------------------------
                              SUMMARY
--------------------------------------------------------------------------------

  Total Revenue:      ${{printf "%12.2f" .Summary.TotalRevenue}}
  Total Orders:       {{printf "%13d" .Summary.TotalOrders}}
  Average Order:      ${{printf "%12.2f" .Summary.AverageOrder}}
  Unique Customers:   {{printf "%13d" .Summary.UniqueCustomers}}

--------------------------------------------------------------------------------
                          TOP PRODUCTS
--------------------------------------------------------------------------------

  {{printf "%-4s" "Rank"}} {{printf "%-30s" "Product"}} {{printf "%10s" "Qty"}} {{printf "%15s" "Revenue"}}
  {{repeat "-" 63}}
  {{range .TopProducts}}
  {{printf "%-4d" .Rank}} {{printf "%-30s" (truncate .Name 28)}} {{printf "%10d" .Quantity}} ${{printf "%14.2f" .Revenue}}
  {{end}}

--------------------------------------------------------------------------------
                        MONTHLY BREAKDOWN
--------------------------------------------------------------------------------

  {{printf "%-15s" "Month"}} {{printf "%15s" "Revenue"}} {{printf "%10s" "Orders"}}
  {{repeat "-" 42}}
  {{range .SalesByMonth}}
  {{printf "%-15s" .Month}} ${{printf "%14.2f" .Revenue}} {{printf "%10d" .Orders}}
  {{end}}

================================================================================
                             END OF REPORT
================================================================================
`

func main() {
    funcMap := template.FuncMap{
        "formatDate": func(t time.Time, layout string) string {
            return t.Format(layout)
        },
        "repeat": func(s string, n int) string {
            result := ""
            for i := 0; i < n; i++ {
                result += s
            }
            return result
        },
        "truncate": func(s string, maxLen int) string {
            if len(s) <= maxLen {
                return s
            }
            return s[:maxLen-2] + ".."
        },
    }

    tmpl := template.Must(template.New("report").Funcs(funcMap).Parse(reportTemplate))

    report := Report{
        Title:       "QUARTERLY SALES REPORT",
        GeneratedAt: time.Now(),
        Period:      "Q4 2024 (Oct-Dec)",
        Summary: Summary{
            TotalRevenue:    158432.50,
            TotalOrders:     1234,
            AverageOrder:    128.43,
            UniqueCustomers: 892,
        },
        TopProducts: []ProductStat{
            {Rank: 1, Name: "Premium Wireless Headphones", Quantity: 245, Revenue: 24500.00},
            {Rank: 2, Name: "Ultra-Slim Laptop Stand", Quantity: 189, Revenue: 9450.00},
            {Rank: 3, Name: "Mechanical Keyboard Pro", Quantity: 156, Revenue: 23400.00},
            {Rank: 4, Name: "4K Webcam with Microphone", Quantity: 134, Revenue: 16080.00},
            {Rank: 5, Name: "USB-C Hub 7-in-1", Quantity: 98, Revenue: 4900.00},
        },
        SalesByMonth: []MonthlySales{
            {Month: "October", Revenue: 48234.50, Orders: 378},
            {Month: "November", Revenue: 62198.00, Orders: 492},
            {Month: "December", Revenue: 48000.00, Orders: 364},
        },
    }

    tmpl.Execute(os.Stdout, report)
}
```

## 模板缓存和性能

### 解析一次，多次执行

```go
package main

import (
    "bytes"
    "fmt"
    "html/template"
    "sync"
)

// TemplateCache 提供线程安全的模板缓存
type TemplateCache struct {
    templates map[string]*template.Template
    mu        sync.RWMutex
    funcMap   template.FuncMap
}

func NewTemplateCache(funcMap template.FuncMap) *TemplateCache {
    return &TemplateCache{
        templates: make(map[string]*template.Template),
        funcMap:   funcMap,
    }
}

func (tc *TemplateCache) Parse(name, content string) error {
    tc.mu.Lock()
    defer tc.mu.Unlock()

    tmpl, err := template.New(name).Funcs(tc.funcMap).Parse(content)
    if err != nil {
        return err
    }

    tc.templates[name] = tmpl
    return nil
}

func (tc *TemplateCache) Execute(name string, data interface{}) (string, error) {
    tc.mu.RLock()
    tmpl, ok := tc.templates[name]
    tc.mu.RUnlock()

    if !ok {
        return "", fmt.Errorf("template %q not found", name)
    }

    var buf bytes.Buffer
    if err := tmpl.Execute(&buf, data); err != nil {
        return "", err
    }

    return buf.String(), nil
}

func main() {
    cache := NewTemplateCache(template.FuncMap{
        "upper": func(s string) string { return s },
    })

    // 在启动时解析模板一次
    cache.Parse("greeting", "Hello, {{.Name}}!")
    cache.Parse("farewell", "Goodbye, {{.Name}}!")

    // 用不同的数据多次执行
    for _, name := range []string{"Alice", "Bob", "Charlie"} {
        result, _ := cache.Execute("greeting", map[string]string{"Name": name})
        fmt.Println(result)
    }
}
```

### 克隆模板

```go
package main

import (
    "bytes"
    "fmt"
    "html/template"
)

func main() {
    // 创建具有通用函数和定义的基础模板
    base := template.Must(template.New("base").Funcs(template.FuncMap{
        "greet": func(name string) string {
            return "Hello, " + name + "!"
        },
    }).Parse(`{{define "header"}}Header Content{{end}}`))

    // 为不同页面克隆 - 每个克隆是独立的
    page1 := template.Must(base.Clone())
    template.Must(page1.Parse(`
{{define "main"}}
<h1>Page 1</h1>
{{template "header"}}
<p>{{greet .Name}}</p>
{{end}}
`))

    page2 := template.Must(base.Clone())
    template.Must(page2.Parse(`
{{define "main"}}
<h1>Page 2</h1>
{{template "header"}}
<p>Different content for {{.Name}}</p>
{{end}}
`))

    var buf1, buf2 bytes.Buffer
    page1.ExecuteTemplate(&buf1, "main", map[string]string{"Name": "Alice"})
    page2.ExecuteTemplate(&buf2, "main", map[string]string{"Name": "Bob"})

    fmt.Println("Page 1:")
    fmt.Println(buf1.String())
    fmt.Println("\nPage 2:")
    fmt.Println(buf2.String())
}
```

## 错误处理

### 处理解析错误

```go
package main

import (
    "fmt"
    "text/template"
)

func parseTemplate(name, content string) (*template.Template, error) {
    tmpl, err := template.New(name).Parse(content)
    if err != nil {
        return nil, fmt.Errorf("parsing template %q: %w", name, err)
    }
    return tmpl, nil
}

func main() {
    testCases := []struct {
        name    string
        content string
    }{
        {"valid", "Hello, {{.Name}}!"},
        {"unclosed_action", "Hello, {{.Name}"},
        {"unknown_function", "Hello, {{unknownFunc .Name}}!"},
        {"bad_field", "Hello, {{.Name.Invalid.Field}}!"},
    }

    for _, tc := range testCases {
        _, err := parseTemplate(tc.name, tc.content)
        if err != nil {
            fmt.Printf("%s: ERROR - %v\n", tc.name, err)
        } else {
            fmt.Printf("%s: OK\n", tc.name)
        }
    }
}
```

### 处理执行错误

```go
package main

import (
    "bytes"
    "fmt"
    "text/template"
)

func executeTemplate(tmpl *template.Template, data interface{}) (string, error) {
    var buf bytes.Buffer
    if err := tmpl.Execute(&buf, data); err != nil {
        return "", fmt.Errorf("executing template: %w", err)
    }
    return buf.String(), nil
}

func main() {
    tmpl := template.Must(template.New("test").Parse("{{.Name}} is {{.Age}} years old"))

    testCases := []struct {
        name string
        data interface{}
    }{
        {"valid struct", struct{ Name string; Age int }{"Alice", 30}},
        {"valid map", map[string]interface{}{"Name": "Bob", "Age": 25}},
        {"nil data", nil},
        {"missing field", map[string]interface{}{"Name": "Charlie"}},
    }

    for _, tc := range testCases {
        result, err := executeTemplate(tmpl, tc.data)
        if err != nil {
            fmt.Printf("%s: ERROR - %v\n", tc.name, err)
        } else {
            fmt.Printf("%s: %s\n", tc.name, result)
        }
    }
}
```

### 使用 Must 处理编译时错误

```go
package main

import (
    "os"
    "text/template"
)

// 必须有效的模板 - 如果无效则在启动时 panic
var templates = template.Must(template.New("").Parse(`
{{define "header"}}
<header>{{.Title}}</header>
{{end}}

{{define "footer"}}
<footer>{{.Copyright}}</footer>
{{end}}

{{define "page"}}
<!DOCTYPE html>
<html>
<head><title>{{.Title}}</title></head>
<body>
{{template "header" .}}
<main>{{.Content}}</main>
{{template "footer" .}}
</body>
</html>
{{end}}
`))

func main() {
    data := struct {
        Title     string
        Content   string
        Copyright string
    }{
        Title:     "My Page",
        Content:   "Hello, World!",
        Copyright: "2024",
    }

    templates.ExecuteTemplate(os.Stdout, "page", data)
}
```

## 常用内置函数

Go 模板包含几个内置函数：

- `len`：返回切片、数组或 map 的长度
- `index`：获取指定索引处的元素
- `printf`：类似 `fmt.Sprintf` 格式化字符串
- `html`：显式转义 HTML（仅 html/template）
- `js`：转义 JavaScript 字符串（仅 html/template）
- `url`：转义 URL（仅 html/template）

```go
tmpl, _ := template.New("test").Parse(`
Length: {{len .Items}}
Index 0: {{index .Items 0}}
Formatted: {{printf "Count: %d" (len .Items)}}
`)
```

## 最佳实践

### 模板组织

1. **将模板与代码分离**：将模板存储在专用文件中或使用 `go:embed` 嵌入
2. **使用一致的命名约定**：清晰命名模板（例如 `base.html`、`partials/header.html`）
3. **只解析一次模板**：在应用程序启动时解析，而不是每次请求时
4. **使用模板缓存**：在生产环境中缓存已解析的模板

### 安全考虑

1. **HTML 输出始终使用 html/template**：永远不要对用户可见的 HTML 使用 text/template
2. **谨慎使用 template.HTML**：只对受信任的内容使用 template.HTML
3. **在传递给模板之前验证数据**：模板应该渲染数据，而不是验证数据
4. **适当转义用户输入**：html/template 包自动处理大多数情况

### 性能技巧

1. **最小化模板复杂性**：将复杂逻辑移到 Go 代码中
2. **使用简单数据结构**：扁平结构比深度嵌套的更快
3. **避免模板中的重计算**：在传递给模板之前预计算值
4. **高吞吐量场景使用缓冲池**：减少内存分配

### 代码组织

```go
// 好的做法：在单独的包中定义模板辅助函数
package templates

import (
    "html/template"
    "time"
)

var FuncMap = template.FuncMap{
    "formatDate":  FormatDate,
    "formatPrice": FormatPrice,
    "truncate":    Truncate,
}

func FormatDate(t time.Time, layout string) string {
    return t.Format(layout)
}

func FormatPrice(p float64) string {
    return fmt.Sprintf("$%.2f", p)
}

func Truncate(s string, maxLen int) string {
    if len(s) <= maxLen {
        return s
    }
    return s[:maxLen-3] + "..."
}
```

## 总结

Go 模板提供了一种强大且安全的方式来生成文本和 HTML 输出。关键要点：

- **两个包**：使用 `text/template` 处理纯文本，使用 `html/template` 处理具有自动 XSS 防护的 HTML
- **动作**：模板逻辑用 `{{` 和 `}}` 括起来
- **点**：`.` 表示当前数据上下文
- **控制结构**：`if`、`else`、`range` 和 `with` 提供流程控制
- **自定义函数**：通过 `Funcs` 添加函数来扩展模板功能
- **管道**：使用管道运算符 `|` 链接命令
- **模板组合**：使用 `define`、`template` 和 `block` 创建可重用组件
- **安全**：`html/template` 包根据上下文自动转义内容
- **性能**：解析模板一次，多次执行；在生产环境中使用缓存

模板非常适合生成配置文件、报表、电子邮件和网页。将展示与逻辑分离使代码更易于维护和测试。
