---
title: Templates
description: Generate text and HTML with Go's template packages
track: go
section: stdlib
difficulty: intermediate
tags:
  - go
  - templates
  - text-template
  - html-template
status: imported
origin: old/src/content/docs/go/templates.en.md
divergence: 0.204
issues: []
legacy:
  category: Go
  subcategory: Web
  order: 19
  lastUpdated: 2026-01-07
---


## Overview

Go provides powerful templating capabilities through the `text/template` and `html/template` packages. These packages allow you to generate text and HTML dynamically by substituting values into template files. The `html/template` package is specifically designed for safe HTML generation, automatically escaping values to prevent injection attacks.

## Text Templates vs HTML Templates

### text/template

The `text/template` package is a general-purpose text template engine. It processes any text content and is useful for generating plain text, configuration files, emails, and other non-HTML content.

```go
package main

import (
	"fmt"
	"log"
	"text/template"
)

func main() {
	// Create a template from a string
	tmpl, err := template.New("greeting").Parse("Hello, {{.Name}}!")
	if err != nil {
		log.Fatal(err)
	}

	// Data to inject into the template
	data := map[string]string{"Name": "Alice"}

	// Execute the template
	err = tmpl.Execute(os.Stdout, data)
	if err != nil {
		log.Fatal(err)
	}
	// Output: Hello, Alice!
}
```

### html/template

The `html/template` package extends `text/template` with automatic HTML escaping. This protects against injection attacks by escaping special HTML characters.

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

	// Data with potentially dangerous HTML
	data := map[string]string{
		"Content": "<script>alert('XSS')</script>",
	}

	err = tmpl.Execute(os.Stdout, data)
	if err != nil {
		log.Fatal(err)
	}
	// Output: <p>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</p>
}
```

## Understanding Go Templates

Templates in Go are text files or strings that contain static text interspersed with actions enclosed in double curly braces `{{ }}`. These actions can reference data, execute control structures, and call functions. Templates are parsed once and can be executed multiple times with different data.

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    // Create a simple template
    tmpl, err := template.New("hello").Parse("Hello, {{.Name}}!\n")
    if err != nil {
        panic(err)
    }

    data := struct {
        Name string
    }{
        Name: "World",
    }

    // Execute the template
    err = tmpl.Execute(os.Stdout, data)
    if err != nil {
        panic(err)
    }
    // Output: Hello, World!
}
```

## Basic Template Syntax

### Data Access

Access data from the current context using the dot (`.`) operator:

The dot `.` represents the current value being processed. At the top level, this is the data passed to `Execute`. Within loops or `with` blocks, the dot changes to represent the current item.

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

### Accessing Nested Fields

You can access nested struct fields and map keys using dot notation:

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

### Variables

You can define variables within templates using the `$` prefix:

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

## Actions and Pipelines

### Actions

Actions are the template directives enclosed in `{{` and `}}`. Common actions include:

- `{{.}}` - current value
- `{{.Field}}` - field access
- `{{if}}`, `{{else}}`, `{{else if}}`, `{{end}}` - conditionals
- `{{range}}`, `{{end}}` - loops
- `{{with}}`, `{{end}}` - context switching

### Pipelines

Pipelines allow chaining operations by passing the output of one command as input to the next:

```go
tmpl, _ := template.New("test").Parse(`
{{.Name | strings.ToUpper}}
`)

// "John" becomes "JOHN"
```

Multiple filters can be chained:

```go
// Custom filter chain
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
// Output: OLLEH
```

## Control Structures

### Conditionals with if/else

The `if` action evaluates whether its argument is "true" (non-empty, non-zero, non-nil):

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

### Iteration with range

The `range` action iterates over slices, arrays, maps, and channels:

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

### Scoping with with

The `with` action changes the dot to a new value if it's not empty:

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

## Built-in Functions

Go templates include several built-in functions:

### Comparison Functions

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

### String and Collection Functions

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

### call Function

The `call` function invokes a method or function:

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

## Custom Functions

### Defining Custom Functions

Register custom functions using the `Funcs` method before parsing:

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

### Function Signature Rules

Custom functions must follow these rules:

1. The function must return one value, or two values where the second is an `error`
2. If the function returns an error, the template stops processing and the error is returned

```go
funcMap := template.FuncMap{
	// Single return value
	"double": func(x int) int {
		return x * 2
	},

	// Return value and error
	"safeDivide": func(a, b int) (int, error) {
		if b == 0 {
			return 0, fmt.Errorf("division by zero")
		}
		return a / b, nil
	},
}
```

## Pipelines

Pipelines allow chaining commands similar to Unix pipes:

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

## Template Files and Nesting

### Parsing from Files

Load templates from files using `ParseFiles`:

```go
tmpl, err := template.ParseFiles("base.html", "header.html", "footer.html")
if err != nil {
	log.Fatal(err)
}
```

Parse all files matching a pattern with `ParseGlob`:

```go
tmpl, err := template.ParseGlob("templates/*.html")
if err != nil {
	log.Fatal(err)
}
```

### Template Nesting with define and template

Use `define` to create named templates and `template` to invoke them:

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

Execute a specific template:

```go
tmpl, _ := template.ParseGlob("templates/*.html")
tmpl.ExecuteTemplate(os.Stdout, "main.html", data)
```

## Template Composition

### Defining and Using Sub-templates

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

### Template Inheritance Pattern

```go
package main

import (
    "bytes"
    "os"
    "text/template"
)

func main() {
    // Base template
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

    // Page template that overrides blocks
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

    // Parse templates
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

### Loading Templates from Files

```go
package main

import (
    "os"
    "path/filepath"
    "text/template"
)

func main() {
    // Create template directory structure
    os.MkdirAll("templates/layouts", 0755)
    os.MkdirAll("templates/partials", 0755)

    // Create template files (in practice, these would already exist)
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

    // Load all templates
    tmpl := template.New("")

    // Load layouts
    layoutFiles, _ := filepath.Glob("templates/layouts/*.tmpl")
    tmpl = template.Must(tmpl.ParseFiles(layoutFiles...))

    // Load partials
    partialFiles, _ := filepath.Glob("templates/partials/*.tmpl")
    tmpl = template.Must(tmpl.ParseFiles(partialFiles...))

    // Load page templates
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

    // Cleanup
    os.RemoveAll("templates")
}
```

## HTML Templates

The `html/template` package provides the same functionality as `text/template` but with automatic escaping for HTML, JavaScript, CSS, and URLs.

### Basic HTML Template

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

### Automatic XSS Protection

```go
package main

import (
    "html/template"
    "os"
)

func main() {
    // html/template automatically escapes dangerous content
    tmpl := template.Must(template.New("safe").Parse(`
<!DOCTYPE html>
<html>
<body>
    <h1>User Input Demo</h1>

    <!-- This will be escaped automatically -->
    <p>Username: {{.Username}}</p>
    <p>Comment: {{.Comment}}</p>

    <!-- Dangerous script is escaped -->
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
    // The script and img tags will be escaped, preventing XSS attacks
}
```

### Trusted HTML with template.HTML

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

    <!-- Escaped (safe) -->
    <div class="escaped">{{.UnsafeHTML}}</div>

    <!-- Trusted (renders as HTML) -->
    <div class="trusted">{{.TrustedHTML}}</div>

    <!-- Trusted CSS -->
    <style>{{.TrustedCSS}}</style>

    <!-- Trusted JavaScript -->
    <script>{{.TrustedJS}}</script>

    <!-- Trusted URL -->
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

### Context-Aware Escaping

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
    <!-- Text context -->
    <p>Name: {{.Name}}</p>

    <!-- Attribute context -->
    <div id="{{.ID}}" class="{{.Class}}">
        <!-- URL context -->
        <a href="{{.URL}}">Profile</a>

        <!-- JavaScript context -->
        <button onclick="greet('{{.Name}}')">Greet</button>
    </div>

    <script>
        // JavaScript context
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

## Advanced Features

### Context Switching with with

The `with` action changes the current context:

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

### Template Comments

Comments are ignored during rendering:

```go
tmpl, _ := template.New("test").Parse(`
{{/* This is a comment */}}
<p>{{.Title}}</p>
{{/* Multi-line comments
     are also supported */}}
`)
```

### Handling Nil Values

Check for nil or empty values:

```go
tmpl, _ := template.New("test").Parse(`
{{if .User}}
  {{.User.Name}}
{{else}}
  No user found
{{end}}
`)
```

## Practical Examples

### Email Template System

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

### Configuration File Generator

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

### Web Application with Templates

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

### Report Generator

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

## Template Caching and Performance

### Parsing Once, Executing Many Times

```go
package main

import (
    "bytes"
    "fmt"
    "html/template"
    "sync"
)

// TemplateCache provides thread-safe template caching
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

    // Parse templates once at startup
    cache.Parse("greeting", "Hello, {{.Name}}!")
    cache.Parse("farewell", "Goodbye, {{.Name}}!")

    // Execute many times with different data
    for _, name := range []string{"Alice", "Bob", "Charlie"} {
        result, _ := cache.Execute("greeting", map[string]string{"Name": name})
        fmt.Println(result)
    }
}
```

### Cloning Templates

```go
package main

import (
    "bytes"
    "fmt"
    "html/template"
)

func main() {
    // Create a base template with common functions and definitions
    base := template.Must(template.New("base").Funcs(template.FuncMap{
        "greet": func(name string) string {
            return "Hello, " + name + "!"
        },
    }).Parse(`{{define "header"}}Header Content{{end}}`))

    // Clone for different pages - each clone is independent
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

## Error Handling

### Handling Parse Errors

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

### Handling Execution Errors

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

### Using Must for Compile-Time Errors

```go
package main

import (
    "os"
    "text/template"
)

// Templates that must be valid - panic at startup if not
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

## Common Built-in Functions

Go templates include several built-in functions:

- `len`: Returns the length of a slice, array, or map
- `index`: Gets the element at an index
- `printf`: Formats strings like `fmt.Sprintf`
- `html`: Explicitly escapes HTML (html/template only)
- `js`: Escapes for JavaScript strings (html/template only)
- `url`: Escapes for URLs (html/template only)

```go
tmpl, _ := template.New("test").Parse(`
Length: {{len .Items}}
Index 0: {{index .Items 0}}
Formatted: {{printf "Count: %d" (len .Items)}}
`)
```

## Best Practices

### Template Organization

1. **Separate templates from code**: Store templates in dedicated files or embed them using `go:embed`
2. **Use consistent naming conventions**: Name templates clearly (e.g., `base.html`, `partials/header.html`)
3. **Parse templates once**: Parse at application startup, not on each request
4. **Use template caching**: In production, cache parsed templates

### Security Considerations

1. **Always use html/template for HTML output**: Never use text/template for user-facing HTML
2. **Be careful with template.HTML**: Only use trusted content with template.HTML
3. **Validate data before passing to templates**: Templates should render data, not validate it
4. **Escape user input appropriately**: The html/template package handles most cases automatically

### Performance Tips

1. **Minimize template complexity**: Move complex logic to Go code
2. **Use simple data structures**: Flat structs are faster than deeply nested ones
3. **Avoid heavy computations in templates**: Pre-compute values before passing to templates
4. **Use buffer pools for high-throughput scenarios**: Reduce memory allocations

### Code Organization

```go
// Good: Define template helpers in a separate package
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

## Summary

Go templates provide a powerful and secure way to generate text and HTML output. Key takeaways:

- **Two packages**: Use `text/template` for plain text and `html/template` for HTML with automatic XSS protection
- **Actions**: Template logic is enclosed in `{{` and `}}`
- **The dot**: `.` represents the current data context
- **Control structures**: `if`, `else`, `range`, and `with` provide flow control
- **Custom functions**: Add functions via `Funcs` to extend template capabilities
- **Pipelines**: Chain commands using the pipe operator `|`
- **Template composition**: Use `define`, `template`, and `block` for reusable components
- **Security**: The `html/template` package automatically escapes content based on context
- **Performance**: Parse templates once and execute many times; use caching in production

Templates are ideal for generating configuration files, reports, emails, and web pages. The separation of presentation from logic makes code more maintainable and easier to test.
