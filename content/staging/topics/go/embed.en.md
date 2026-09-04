---
title: Go Embed嵌入文件
description: Go embed完全指南，将静态资源嵌入二进制文件，构建单文件可执行程序
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - embed
  - 静态资源
  - 文件嵌入
status: imported
origin: old/src/content/docs/go/embed.en.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 核心概念
  order: 15
  lastUpdated: 2026-01-07
---

The `embed` package introduced in Go 1.16 allows you to embed static files directly into Go binaries. This feature solves the long-standing pain point of Go programs needing to carry external resource files, so you can build truly single-file executable programs.

## Concept Explanation

### What is File Embedding

File embedding is a technique that packs file contents directly into the executable at compile time. Once embedded, the resources become part of the binary file and do not depend on the external filesystem at runtime.

```go
package main

import (
    _ "embed"
    "fmt"
)

//go:embed hello.txt
var message string

func main() {
    fmt.Println(message) // Directly use the embedded file content
}
```

### Historical Background

Before Go 1.16, developers typically handled static resources using the following methods:

1. **External file dependency**: Reading external files at runtime
2. **Code generation tools**: Using third-party tools like `go-bindata`, `packr`, `statik`
3. **Manual conversion**: Manually converting file contents to constants in Go code

Each of these methods had drawbacks: external dependencies increased deployment complexity, third-party tools required additional build steps, and manual conversion was difficult to maintain.

### Problems Solved

- **Simplified deployment**: Single-file deployment without carrying resource directories
- **Resource integrity**: Embedded resources cannot be accidentally modified or deleted
- **Version consistency**: Resources are bound to code version, avoiding version mismatch
- **Container-friendly**: Reduces Docker image layers and complexity

## Core Principles

### Compile-time Embedding

`//go:embed` is a compiler directive that is processed during the compilation phase:

```
Source code + Resource files
       ↓
    Compiler processes //go:embed directives
       ↓
    Resource content embedded into .rodata section
       ↓
    Single executable generated
```

### Memory Layout

Embedded data is stored in the read-only data section (`.rodata`) of the executable:

```go
// Embedded as string: content stored directly
//go:embed config.txt
var configStr string  // Underlying pointer to .rodata

// Embedded as byte slice: slice header points to .rodata
//go:embed image.png
var imageData []byte  // slice header -> .rodata

// Embedded as filesystem: virtual filesystem structure built
//go:embed static/*
var staticFS embed.FS  // file tree + content references
```

### embed.FS Structure

`embed.FS` implements the `io/fs.FS` interface, providing a read-only filesystem abstraction:

```go
type FS struct {
    // Internally contains file tree structure and data references
    files *[]file
}

// Implements fs.FS interface
func (f FS) Open(name string) (fs.File, error)

// Additional methods
func (f FS) ReadDir(name string) ([]fs.DirEntry, error)
func (f FS) ReadFile(name string) ([]byte, error)
```

## Key Points

### Basic Syntax

```go
import (
    "embed"
    _ "embed" // Blank import needed when only using string/[]byte
)

// Embed single file as string
//go:embed filename.txt
var content string

// Embed single file as byte slice
//go:embed image.png
var data []byte

// Embed multiple files/directories as filesystem
//go:embed static/*
var staticFS embed.FS

// Multiple embed directives
//go:embed file1.txt
//go:embed file2.txt
var multiFS embed.FS
```

### Path Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Exact path | Embed single file | `//go:embed config.json` |
| Wildcard `*` | Match all files in directory | `//go:embed static/*` |
| Recursive `**` | Not supported | - |
| Multiple paths | Space-separated patterns | `//go:embed a.txt b.txt` |
| Multiple directives | Multiple embed comments | See example above |

### Important Rules

1. **Variable type restriction**: Can only be `string`, `[]byte`, or `embed.FS`
2. **Package-level variable**: Must be a package-level variable, not a local variable
3. **Relative paths**: Paths are relative to the directory containing the source file
4. **No `..`**: Cannot use `..` to access parent directories
5. **Hidden files**: Files starting with `.` or `_` are excluded by default

## Code Examples

### Embedding a Single File

```go
package main

import (
    _ "embed"
    "fmt"
)

// Embed as string (suitable for text files)
//go:embed version.txt
var version string

// Embed as byte slice (suitable for binary files)
//go:embed logo.png
var logo []byte

func main() {
    fmt.Printf("Version: %s\n", version)
    fmt.Printf("Logo size: %d bytes\n", len(logo))
}
```

### Embedding an Entire Directory

```go
package main

import (
    "embed"
    "fmt"
    "io/fs"
)

// Embed all files in the templates directory
//go:embed templates/*
var templatesFS embed.FS

func main() {
    // Read a single file
    content, err := templatesFS.ReadFile("templates/index.html")
    if err != nil {
        panic(err)
    }
    fmt.Printf("index.html content:\n%s\n", content)

    // Walk through all files
    fmt.Println("\nAll template files:")
    fs.WalkDir(templatesFS, ".", func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }
        if !d.IsDir() {
            fmt.Printf("  %s\n", path)
        }
        return nil
    })
}
```

### Embedding Multiple Resources

```go
package main

import (
    "embed"
    "fmt"
    "io/fs"
)

// Using multiple patterns
//go:embed static/css/* static/js/* static/images/*
var staticFS embed.FS

// Or using multiple directives
//go:embed templates/*.html
//go:embed templates/*.tmpl
//go:embed config/*.yaml
var assetsFS embed.FS

func main() {
    // List all embedded files
    fs.WalkDir(assetsFS, ".", func(path string, d fs.DirEntry, err error) error {
        if !d.IsDir() {
            info, _ := d.Info()
            fmt.Printf("%s (%d bytes)\n", path, info.Size())
        }
        return nil
    })
}
```

### Including Hidden Files

By default, files starting with `.` or `_` are ignored. Use the `all:` prefix to include them:

```go
package main

import (
    "embed"
    "io/fs"
    "fmt"
)

// Default: hidden files not included
//go:embed config/*
var configFS embed.FS

// Using all: prefix to include all files
//go:embed all:dotfiles/*
var dotfilesFS embed.FS

func main() {
    fmt.Println("dotfiles directory content:")
    fs.WalkDir(dotfilesFS, ".", func(path string, d fs.DirEntry, err error) error {
        if !d.IsDir() {
            fmt.Printf("  %s\n", path)
        }
        return nil
    })
}
```

### Combining with http.FileServer

```go
package main

import (
    "embed"
    "io/fs"
    "log"
    "net/http"
)

//go:embed static/*
var staticFiles embed.FS

func main() {
    // Get the static subdirectory
    staticContent, err := fs.Sub(staticFiles, "static")
    if err != nil {
        log.Fatal(err)
    }

    // Create file server
    fileServer := http.FileServer(http.FS(staticContent))

    // Register routes
    http.Handle("/static/", http.StripPrefix("/static/", fileServer))

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Welcome! Static files at /static/"))
    })

    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Combining with Template Engine

```go
package main

import (
    "embed"
    "html/template"
    "os"
)

//go:embed templates/*.html
var templateFS embed.FS

func main() {
    // Parse all embedded templates
    tmpl, err := template.ParseFS(templateFS, "templates/*.html")
    if err != nil {
        panic(err)
    }

    // Use template
    data := map[string]interface{}{
        "Title":   "Go Embed Demo",
        "Message": "Hello from embedded templates!",
    }

    err = tmpl.ExecuteTemplate(os.Stdout, "index.html", data)
    if err != nil {
        panic(err)
    }
}
```

### Embedding Configuration Files

```go
package main

import (
    "embed"
    "encoding/json"
    "fmt"
    "gopkg.in/yaml.v3"
)

//go:embed config/default.json
var defaultConfigJSON []byte

//go:embed config/default.yaml
var defaultConfigYAML []byte

type Config struct {
    Server struct {
        Host string `json:"host" yaml:"host"`
        Port int    `json:"port" yaml:"port"`
    } `json:"server" yaml:"server"`
    Database struct {
        Driver string `json:"driver" yaml:"driver"`
        DSN    string `json:"dsn" yaml:"dsn"`
    } `json:"database" yaml:"database"`
}

func LoadDefaultConfig() (*Config, error) {
    var config Config

    // Load from embedded JSON
    if err := json.Unmarshal(defaultConfigJSON, &config); err != nil {
        return nil, fmt.Errorf("parse JSON config: %w", err)
    }

    return &config, nil
}

func LoadDefaultConfigYAML() (*Config, error) {
    var config Config

    // Load from embedded YAML
    if err := yaml.Unmarshal(defaultConfigYAML, &config); err != nil {
        return nil, fmt.Errorf("parse YAML config: %w", err)
    }

    return &config, nil
}

func main() {
    config, err := LoadDefaultConfig()
    if err != nil {
        panic(err)
    }

    fmt.Printf("Server: %s:%d\n", config.Server.Host, config.Server.Port)
    fmt.Printf("Database: %s\n", config.Database.Driver)
}
```

### Database Migration Scripts

```go
package migrations

import (
    "embed"
    "fmt"
    "io/fs"
    "sort"
    "strings"
)

//go:embed sql/*.sql
var migrationsFS embed.FS

type Migration struct {
    Version string
    Name    string
    SQL     string
}

func LoadMigrations() ([]Migration, error) {
    var migrations []Migration

    entries, err := migrationsFS.ReadDir("sql")
    if err != nil {
        return nil, err
    }

    for _, entry := range entries {
        if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
            continue
        }

        content, err := migrationsFS.ReadFile("sql/" + entry.Name())
        if err != nil {
            return nil, err
        }

        // Parse filename: 001_create_users.sql
        parts := strings.SplitN(entry.Name(), "_", 2)
        if len(parts) != 2 {
            continue
        }

        migrations = append(migrations, Migration{
            Version: parts[0],
            Name:    strings.TrimSuffix(parts[1], ".sql"),
            SQL:     string(content),
        })
    }

    // Sort by version
    sort.Slice(migrations, func(i, j int) bool {
        return migrations[i].Version < migrations[j].Version
    })

    return migrations, nil
}

func RunMigrations(db interface{}) error {
    migrations, err := LoadMigrations()
    if err != nil {
        return err
    }

    for _, m := range migrations {
        fmt.Printf("Running migration %s: %s\n", m.Version, m.Name)
        // db.Exec(m.SQL)
    }

    return nil
}
```

## Best Practices

### Organize Directory Structure for Embedded Resources

```
myapp/
├── main.go
├── embed.go          # Centrally define all embedded resources
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── templates/
│   ├── layouts/
│   └── pages/
└── config/
    ├── default.yaml
    └── schema.json
```

```go
// embed.go - Centrally manage embedded resources
package main

import "embed"

//go:embed static/*
var StaticFS embed.FS

//go:embed templates/*
var TemplatesFS embed.FS

//go:embed config/*
var ConfigFS embed.FS
```

### Provide Development Mode Support

```go
package assets

import (
    "embed"
    "io/fs"
    "os"
)

//go:embed static/*
var embeddedStatic embed.FS

// GetStaticFS returns the static filesystem
// Uses local filesystem in dev mode for hot reloading
func GetStaticFS() fs.FS {
    if os.Getenv("DEV_MODE") == "true" {
        // Development mode: use local filesystem
        return os.DirFS("static")
    }
    // Production mode: use embedded filesystem
    sub, _ := fs.Sub(embeddedStatic, "static")
    return sub
}
```

### Embedding Version Information

```go
package main

import (
    _ "embed"
    "fmt"
    "strings"
)

//go:embed VERSION
var version string

//go:embed BUILD_TIME
var buildTime string

//go:embed GIT_COMMIT
var gitCommit string

func Version() string {
    return strings.TrimSpace(version)
}

func BuildInfo() string {
    return fmt.Sprintf(
        "Version: %s\nBuild Time: %s\nGit Commit: %s",
        strings.TrimSpace(version),
        strings.TrimSpace(buildTime),
        strings.TrimSpace(gitCommit),
    )
}

func main() {
    fmt.Println(BuildInfo())
}
```

Build script:
```bash
#!/bin/bash
echo "1.0.0" > VERSION
date -u +"%Y-%m-%dT%H:%M:%SZ" > BUILD_TIME
git rev-parse --short HEAD > GIT_COMMIT
go build -o myapp
```

### Resource File Validation

```go
package main

import (
    "crypto/sha256"
    "embed"
    "encoding/hex"
    "fmt"
)

//go:embed important/config.json
var configData []byte

//go:embed important/config.json.sha256
var configHash string

func ValidateConfig() error {
    hash := sha256.Sum256(configData)
    actual := hex.EncodeToString(hash[:])

    expected := strings.TrimSpace(configHash)

    if actual != expected {
        return fmt.Errorf("config checksum mismatch: expected %s, got %s", expected, actual)
    }

    return nil
}
```

### Conditional Compilation with Embedding

```go
// embed_prod.go
//go:build !dev

package assets

import "embed"

//go:embed dist/*
var StaticFS embed.FS

func GetFS() embed.FS {
    return StaticFS
}
```

```go
// embed_dev.go
//go:build dev

package assets

import (
    "embed"
    "io/fs"
    "os"
)

// In development mode, embed empty content and use local files
var StaticFS embed.FS

func GetFS() fs.FS {
    return os.DirFS("dist")
}
```

## Common Pitfalls

### Paths Must Be Relative to Source File

```go
// Wrong: using absolute path
//go:embed /etc/config.json
var config []byte  // Compilation error

// Wrong: using .. to access parent directory
//go:embed ../shared/data.json
var data []byte  // Compilation error

// Correct: using path relative to current package
//go:embed config/data.json
var data []byte
```

### Variable Type Restrictions

```go
// Wrong: unsupported type
//go:embed data.txt
var data int  // Compilation error

//go:embed data.txt
var data map[string]string  // Compilation error

// Correct: only string, []byte, and embed.FS are supported
//go:embed data.txt
var dataStr string

//go:embed data.txt
var dataBytes []byte

//go:embed data/*
var dataFS embed.FS
```

### Must Be Package-Level Variable

```go
func main() {
    // Wrong: cannot use inside function
    //go:embed config.txt
    var config string  // Compilation error
}

// Correct: package-level variable
//go:embed config.txt
var config string

func main() {
    fmt.Println(config)
}
```

### Empty Directories Are Not Embedded

```go
// If empty_dir/ is an empty directory
//go:embed empty_dir/*
var emptyFS embed.FS  // emptyFS does not contain this directory

// Solution: place a .gitkeep file and use all: prefix
//go:embed all:empty_dir/*
var emptyFS embed.FS
```

### Hidden Files Are Ignored by Default

```go
// This will not include .env or .gitignore
//go:embed config/*
var configFS embed.FS

// Use all: prefix to include hidden files
//go:embed all:config/*
var configFS embed.FS
```

### Missing Files Cause Compilation Failure

```go
// If missing.txt does not exist, compilation will fail
//go:embed missing.txt
var data string  // Compilation error: pattern missing.txt: no matching files found
```

### embed.FS Is Read-Only

```go
//go:embed data/*
var dataFS embed.FS

func main() {
    // Reading is fine
    data, _ := dataFS.ReadFile("data/file.txt")

    // Writing is not possible - embed.FS has no write methods
    // If you need to modify, copy to memory or temporary file
}
```

### Watch the Position of Directive and Variable

```go
// Wrong: blank line between directive and variable
//go:embed data.txt

var data string  // Compilation error

// Wrong: comment between directive and variable
//go:embed data.txt
// This is a comment
var data string  // Compilation error

// Correct: directive directly precedes variable declaration
//go:embed data.txt
var data string
```

## Performance Considerations

### Memory Usage

Embedded file content is stored in the read-only data section of the binary. This means:

```go
//go:embed large_file.bin
var largeData []byte

func main() {
    // largeData points to .rodata section, no extra memory allocation
    // But modifying the slice will trigger a copy

    copy := make([]byte, len(largeData))
    copy(copy, largeData)  // This allocates new memory
}
```

### Startup Time

Embedding large files does not significantly affect startup time because data is already in memory (via memory mapping):

```go
//go:embed huge_database.db
var database []byte  // 100MB file

func main() {
    // Startup is almost instant, data is loaded on demand via mmap
    fmt.Println(len(database))  // Fast

    // Corresponding memory pages are loaded only when actually accessed
    _ = database[50*1024*1024]  // This is when data is actually read
}
```

### Binary File Size

Embedding files increases binary file size:

```bash
# Files are embedded at their original size before compression
# Consider pre-compressing large files

# Original:
go build -o app_with_assets  # 50MB (containing 40MB resources)

# Optimized: compress resources
gzip -k static/large.css
#go:embed static/large.css.gz
# Decompress at runtime
```

### Benchmark Comparison

```go
func BenchmarkReadEmbedded(b *testing.B) {
    //go:embed testdata/sample.txt
    var data []byte

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = data
    }
}

func BenchmarkReadFile(b *testing.B) {
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = os.ReadFile("testdata/sample.txt")
    }
}

// Results:
// BenchmarkReadEmbedded-8    1000000000    0.25 ns/op    0 B/op    0 allocs/op
// BenchmarkReadFile-8        50000         25000 ns/op   4096 B/op    3 allocs/op
```

### Optimization Tips

```go
// 1. Consider compression for large files
//go:embed assets.tar.gz
var compressedAssets []byte

func loadAssets() {
    reader, _ := gzip.NewReader(bytes.NewReader(compressedAssets))
    // Decompress and use
}

// 2. Lazy load large resources
//go:embed optional/*
var optionalFS embed.FS

var cachedData []byte
var loadOnce sync.Once

func getOptionalData() []byte {
    loadOnce.Do(func() {
        cachedData, _ = optionalFS.ReadFile("optional/large.json")
    })
    return cachedData
}

// 3. Avoid duplicate embedding
// Bad: same file embedded in multiple variables
//go:embed shared/config.json
var config1 []byte
//go:embed shared/config.json
var config2 []byte  // Duplicate!

// Good: embed once, use multiple times
//go:embed shared/config.json
var sharedConfig []byte
```

## Real-World Scenarios

### Single-File Deployment for Web Applications

```go
package main

import (
    "embed"
    "html/template"
    "io/fs"
    "log"
    "net/http"
)

//go:embed web/static/*
var staticFS embed.FS

//go:embed web/templates/*
var templatesFS embed.FS

func main() {
    // Parse templates
    tmpl, err := template.ParseFS(templatesFS, "web/templates/*.html")
    if err != nil {
        log.Fatal(err)
    }

    // Static file service
    staticContent, _ := fs.Sub(staticFS, "web/static")
    http.Handle("/static/", http.StripPrefix("/static/",
        http.FileServer(http.FS(staticContent))))

    // Page handling
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        tmpl.ExecuteTemplate(w, "index.html", nil)
    })

    log.Println("Starting server on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### CLI Tool with Built-in Help Documentation

```go
package main

import (
    _ "embed"
    "fmt"
    "os"
)

//go:embed docs/help.txt
var helpText string

//go:embed docs/examples.txt
var examplesText string

//go:embed docs/version.txt
var versionText string

func main() {
    if len(os.Args) < 2 {
        fmt.Print(helpText)
        return
    }

    switch os.Args[1] {
    case "help", "-h", "--help":
        fmt.Print(helpText)
    case "examples":
        fmt.Print(examplesText)
    case "version", "-v", "--version":
        fmt.Print(versionText)
    default:
        fmt.Printf("Unknown command: %s\n", os.Args[1])
        fmt.Print(helpText)
    }
}
```

### Embedding Certificates and Keys

```go
package main

import (
    "crypto/tls"
    _ "embed"
    "log"
    "net/http"
)

//go:embed certs/server.crt
var serverCert []byte

//go:embed certs/server.key
var serverKey []byte

func main() {
    cert, err := tls.X509KeyPair(serverCert, serverKey)
    if err != nil {
        log.Fatal(err)
    }

    server := &http.Server{
        Addr: ":8443",
        TLSConfig: &tls.Config{
            Certificates: []tls.Certificate{cert},
        },
    }

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, TLS!"))
    })

    log.Println("Starting HTTPS server on :8443")
    log.Fatal(server.ListenAndServeTLS("", ""))
}
```

### Game Asset Packaging

```go
package assets

import (
    "bytes"
    "embed"
    "image"
    "image/png"
    "io/fs"
)

//go:embed sprites/*.png
var spritesFS embed.FS

//go:embed sounds/*.wav
var soundsFS embed.FS

//go:embed levels/*.json
var levelsFS embed.FS

type AssetManager struct {
    sprites map[string]image.Image
    sounds  map[string][]byte
    levels  map[string][]byte
}

func NewAssetManager() (*AssetManager, error) {
    am := &AssetManager{
        sprites: make(map[string]image.Image),
        sounds:  make(map[string][]byte),
        levels:  make(map[string][]byte),
    }

    // Load sprites
    entries, _ := spritesFS.ReadDir("sprites")
    for _, e := range entries {
        data, _ := spritesFS.ReadFile("sprites/" + e.Name())
        img, _ := png.Decode(bytes.NewReader(data))
        am.sprites[e.Name()] = img
    }

    // Load sounds
    entries, _ = soundsFS.ReadDir("sounds")
    for _, e := range entries {
        data, _ := soundsFS.ReadFile("sounds/" + e.Name())
        am.sounds[e.Name()] = data
    }

    // Load levels
    entries, _ = levelsFS.ReadDir("levels")
    for _, e := range entries {
        data, _ := levelsFS.ReadFile("levels/" + e.Name())
        am.levels[e.Name()] = data
    }

    return am, nil
}

func (am *AssetManager) GetSprite(name string) image.Image {
    return am.sprites[name]
}

func (am *AssetManager) GetSound(name string) []byte {
    return am.sounds[name]
}

func (am *AssetManager) GetLevel(name string) []byte {
    return am.levels[name]
}
```

### Multi-language Internationalization

```go
package i18n

import (
    "embed"
    "encoding/json"
    "fmt"
    "strings"
)

//go:embed locales/*.json
var localesFS embed.FS

type Translator struct {
    translations map[string]map[string]string
    defaultLang  string
}

func NewTranslator(defaultLang string) (*Translator, error) {
    t := &Translator{
        translations: make(map[string]map[string]string),
        defaultLang:  defaultLang,
    }

    entries, err := localesFS.ReadDir("locales")
    if err != nil {
        return nil, err
    }

    for _, e := range entries {
        if !strings.HasSuffix(e.Name(), ".json") {
            continue
        }

        lang := strings.TrimSuffix(e.Name(), ".json")
        data, err := localesFS.ReadFile("locales/" + e.Name())
        if err != nil {
            return nil, err
        }

        var messages map[string]string
        if err := json.Unmarshal(data, &messages); err != nil {
            return nil, fmt.Errorf("parse %s: %w", e.Name(), err)
        }

        t.translations[lang] = messages
    }

    return t, nil
}

func (t *Translator) T(lang, key string) string {
    if messages, ok := t.translations[lang]; ok {
        if msg, ok := messages[key]; ok {
            return msg
        }
    }

    // Fall back to default language
    if messages, ok := t.translations[t.defaultLang]; ok {
        if msg, ok := messages[key]; ok {
            return msg
        }
    }

    return key
}

// Usage example
// locales/en.json: {"greeting": "Hello", "farewell": "Goodbye"}
// locales/zh.json: {"greeting": "你好", "farewell": "再见"}

func main() {
    t, _ := NewTranslator("en")

    fmt.Println(t.T("zh", "greeting"))  // 你好
    fmt.Println(t.T("en", "farewell"))  // Goodbye
}
```

## Interview Key Points

### Q1: What variable types can the go:embed directive embed?

**Answer**: Only three types of variables can be embedded:
- `string`: Suitable for text files, content is directly a string after embedding
- `[]byte`: Suitable for binary files, content is a byte slice after embedding
- `embed.FS`: Can embed multiple files or directories, provides filesystem interface

```go
//go:embed text.txt
var s string  // Text content

//go:embed binary.dat
var b []byte  // Binary data

//go:embed files/*
var fs embed.FS  // Filesystem
```

### Q2: What is the difference between embed.FS and directly embedding []byte?

**Answer**:
| Feature | []byte | embed.FS |
|---------|--------|----------|
| Number of files | Single file | Multiple files/directories |
| Access method | Direct content access | Through filesystem API |
| Interface compatibility | None | Implements fs.FS interface |
| Directory structure | Not preserved | Preserved |
| Metadata | None | Preserves filename, size, etc. |

### Q3: How do you include hidden files when embedding?

**Answer**: Use the `all:` prefix:

```go
// Does not include files starting with . or _
//go:embed config/*
var configFS embed.FS

// Includes all files, including hidden files
//go:embed all:config/*
var allConfigFS embed.FS
```

### Q4: Where is embed file data stored?

**Answer**: Embedded data is stored in the read-only data section (`.rodata`) of the executable. This means:
- Data is loaded at program startup via memory mapping
- Data is read-only and cannot be modified
- No extra memory allocation (unless you copy the data)
- Access speed is close to accessing regular variables

### Q5: What are the limitations of using embed?

**Answer**:
1. Can only embed paths relative to the source file, cannot use absolute paths or `..`
2. Must be package-level variable, not function local variable
3. Files starting with `.` or `_` are not included by default
4. Empty directories are not embedded
5. If specified file does not exist, compilation fails
6. embed.FS is read-only, cannot write

### Q6: What impact does embed have on program performance?

**Answer**:
- **Startup time**: Almost no impact, data is loaded on demand via memory mapping
- **Memory usage**: Data is in .rodata section, does not use extra heap memory
- **Access speed**: Much faster than file I/O, no system calls
- **Binary size**: Increases, roughly equal to the original size of embedded files

### Q7: How do you use local files in development and embedded files in production?

**Answer**: Use conditional compilation or environment variables:

```go
// Method 1: Environment variable check
func GetFS() fs.FS {
    if os.Getenv("DEV_MODE") == "true" {
        return os.DirFS("static")
    }
    return embeddedFS
}

// Method 2: Build tags
// file_dev.go
//go:build dev
func GetFS() fs.FS { return os.DirFS("static") }

// file_prod.go
//go:build !dev
//go:embed static/*
var embeddedFS embed.FS
func GetFS() fs.FS { return embeddedFS }
```

## Further Reading

### Official Documentation
- [Go embed Package Documentation](https://pkg.go.dev/embed)
- [Go 1.16 Release Notes - embed](https://go.dev/doc/go1.16#library-embed)
- [io/fs Package Documentation](https://pkg.go.dev/io/fs)

### Proposals and Design
- [Proposal: embed files in Go binaries](https://github.com/golang/go/issues/35950)
- [embed Design Document](https://go.googlesource.com/proposal/+/master/design/draft-embed.zh.md)

### Practical Articles
- [How to Use go:embed in Go](https://blog.jetbrains.com/go/2021/06/09/how-to-use-go-embed-in-go-1-16/)
- [Embedding Files in Go 1.16](https://blog.carlmjohnson.net/post/2021/how-to-use-go-embed/)

### Related Tools
- [pkger](https://github.com/markbates/pkger) - File embedding tool before embed was introduced
- [statik](https://github.com/rakyll/statik) - Static file embedding tool
- [go-bindata](https://github.com/go-bindata/go-bindata) - Classic file embedding tool

### Source Code Study
- [embed Package Source Code](https://github.com/golang/go/tree/master/src/embed)
- [Compiler embed Processing](https://github.com/golang/go/blob/master/src/cmd/compile/internal/noder/noder.go)
