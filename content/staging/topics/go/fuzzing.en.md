---
title: Go Fuzzing
description: Complete guide to Go's built-in fuzz testing, automated test input generation, and discovering edge cases in your code
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Fuzzing
  - Testing
  - Security
  - Quality Assurance
status: imported
origin: old/src/content/docs/go/fuzzing.en.md
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

Fuzz testing (fuzzing) is an automated testing technique that generates random inputs to discover bugs, crashes, and security vulnerabilities. Go 1.18 introduced native fuzzing support, making it easy to find edge cases that traditional unit tests might miss.

## Concept Explanation

Traditional testing uses predefined inputs, but fuzzing automatically generates thousands or millions of inputs to find unexpected behaviors. The fuzzer is guided by code coverage, learning which inputs explore new code paths and mutating them to discover more.

Go's fuzzing engine maintains a corpus of interesting inputs and continuously mutates them to maximize code coverage. When it finds an input that causes a crash or unexpected behavior, it minimizes the input to the smallest reproducing case and saves it for future regression testing.

```go
package main

import (
    "testing"
    "unicode/utf8"
)

// FuzzReverse tests the Reverse function with random inputs
func FuzzReverse(f *testing.F) {
    // Add seed corpus entries
    f.Add("hello")
    f.Add("world")
    f.Add("")
    f.Add("!12345")

    // The fuzz target function
    f.Fuzz(func(t *testing.T, orig string) {
        rev := Reverse(orig)
        doubleRev := Reverse(rev)

        // Property: reversing twice returns original
        if orig != doubleRev {
            t.Errorf("Reverse(Reverse(%q)) = %q, want %q", orig, doubleRev, orig)
        }

        // Property: length is preserved
        if utf8.RuneCountInString(orig) != utf8.RuneCountInString(rev) {
            t.Errorf("length mismatch: %q has %d runes, reversed has %d",
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

## Core Principles

### Fuzz Test Structure

A fuzz test has a specific structure different from regular tests:

```go
package main

import "testing"

// Fuzz test function must start with "Fuzz"
func FuzzMyFunction(f *testing.F) {
    // 1. Seed corpus - initial inputs to start fuzzing
    f.Add([]byte("initial input"))
    f.Add([]byte("another input"))

    // 2. Fuzz target - receives generated inputs
    f.Fuzz(func(t *testing.T, data []byte) {
        // Test your function with generated data
        result := MyFunction(data)

        // Check invariants - properties that should always hold
        if len(result) < 0 {
            t.Error("impossible: negative length")
        }
    })
}
```

### Supported Types

The fuzzing engine can generate these types:

```go
func FuzzSupportedTypes(f *testing.F) {
    // Seed with example values
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
        // Test with all these types
    })
}
```

### Coverage-Guided Fuzzing

The fuzzer tracks code coverage to find interesting inputs:

```go
package parser

import "testing"

func FuzzParse(f *testing.F) {
    // Seed with valid inputs
    f.Add(`{"name": "test"}`)
    f.Add(`{"array": [1,2,3]}`)
    f.Add(`{"nested": {"key": "value"}}`)

    f.Fuzz(func(t *testing.T, input string) {
        // The fuzzer will try to maximize code coverage
        // It will find inputs that reach new branches
        result, err := Parse(input)

        if err == nil {
            // If parsing succeeds, verify the result
            if result == nil {
                t.Error("Parse succeeded but result is nil")
            }
        }
        // Errors are expected for invalid input - not a bug
    })
}
```

## Key Concepts

### Running Fuzz Tests

```bash
# Run fuzz test for 30 seconds
go test -fuzz=FuzzReverse -fuzztime=30s

# Run fuzz test indefinitely
go test -fuzz=FuzzReverse

# Run fuzz test with specific duration
go test -fuzz=FuzzReverse -fuzztime=1m

# Run fuzz test with iteration count
go test -fuzz=FuzzReverse -fuzztime=10000x

# Run all fuzz tests as regular tests (with seed corpus only)
go test -v

# Run specific fuzz test as regular test
go test -run=FuzzReverse

# Parallel fuzzing
go test -fuzz=FuzzReverse -parallel=4
```

### Corpus Management

The fuzzer saves interesting inputs to a corpus:

```
testdata/
└── fuzz/
    └── FuzzReverse/
        ├── 2b3c7e8a9f1d4e5b  # Binary hash filenames
        ├── 8f7e6d5c4b3a2910
        └── corpus/          # Seed corpus (checked into source control)
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
    // Load corpus from files
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
        // Test function
    })
}
```

### Property-Based Testing

Fuzzing is most effective when testing properties:

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
    // Seed with example users
    f.Add("Alice", 30, "alice@example.com")
    f.Add("", 0, "")
    f.Add("Bob Smith", -1, "invalid")

    f.Fuzz(func(t *testing.T, name string, age int, email string) {
        original := User{Name: name, Age: age, Email: email}

        // Marshal to JSON
        data, err := json.Marshal(original)
        if err != nil {
            // Some inputs might not be valid JSON (e.g., invalid UTF-8)
            return
        }

        // Unmarshal back
        var decoded User
        if err := json.Unmarshal(data, &decoded); err != nil {
            t.Fatalf("Unmarshal failed: %v", err)
        }

        // Property: round-trip should preserve data
        if original != decoded {
            t.Errorf("Round-trip mismatch:\noriginal: %+v\ndecoded:  %+v", original, decoded)
        }
    })
}
```

## Code Examples

### Fuzzing a Parser

```go
package parser

import (
    "testing"
)

// Expression parser fuzzing
func FuzzExpressionParser(f *testing.F) {
    // Seed with valid expressions
    f.Add("1 + 2")
    f.Add("(3 * 4) - 5")
    f.Add("10 / 2 + 3")
    f.Add("-5")
    f.Add("((1))")

    // Seed with edge cases
    f.Add("")
    f.Add("   ")
    f.Add("+++")
    f.Add("1 ++ 2")

    f.Fuzz(func(t *testing.T, expr string) {
        result, err := ParseExpression(expr)

        if err == nil {
            // If parsing succeeds, evaluate should not panic
            func() {
                defer func() {
                    if r := recover(); r != nil {
                        t.Errorf("Evaluate panicked for valid expression %q: %v", expr, r)
                    }
                }()
                _ = result.Evaluate()
            }()
        }
    })
}

// URL parser fuzzing
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
            // Property: ToString should produce parseable output
            reparsed, err2 := ParseURL(parsed.ToString())
            if err2 != nil {
                t.Errorf("Reparsing failed: %v", err2)
            }

            // Property: Scheme should not be empty for valid URLs
            if parsed.Scheme == "" {
                t.Error("Valid URL has empty scheme")
            }
        }
    })
}
```

### Fuzzing Binary Protocols

```go
package protocol

import (
    "bytes"
    "testing"
)

func FuzzMessageDecoder(f *testing.F) {
    // Valid message format: [length:4][type:1][payload:length]
    validMsg := []byte{0, 0, 0, 5, 1, 'h', 'e', 'l', 'l', 'o'}
    f.Add(validMsg)

    // Edge cases
    f.Add([]byte{})                    // Empty
    f.Add([]byte{0, 0, 0, 0, 1})      // Zero length
    f.Add([]byte{255, 255, 255, 255}) // Huge length
    f.Add([]byte{0, 0, 0, 10, 1})     // Truncated

    f.Fuzz(func(t *testing.T, data []byte) {
        msg, err := DecodeMessage(data)

        if err == nil {
            // Property: Re-encoding should produce same bytes
            encoded := msg.Encode()

            // Decode the encoded message
            msg2, err := DecodeMessage(encoded)
            if err != nil {
                t.Fatalf("Re-decoding failed: %v", err)
            }

            // Compare
            if msg.Type != msg2.Type || !bytes.Equal(msg.Payload, msg2.Payload) {
                t.Error("Round-trip mismatch")
            }
        }
    })
}
```

### Fuzzing Concurrent Code

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

        // Concurrent writes
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

        // Map should be in consistent state
        // No panics = test passes
    })
}
```

### Fuzzing for Security

```go
package security

import (
    "testing"
)

func FuzzSQLQueryBuilder(f *testing.F) {
    // Normal inputs
    f.Add("users", "id", "123")
    f.Add("products", "name", "widget")

    // SQL injection attempts
    f.Add("users", "id", "1; DROP TABLE users;--")
    f.Add("users", "id", "' OR '1'='1")
    f.Add("users", "id", "1 UNION SELECT * FROM passwords")

    f.Fuzz(func(t *testing.T, table, column, value string) {
        query := BuildQuery(table, column, value)

        // Check for SQL injection vulnerabilities
        dangerousPatterns := []string{
            "DROP", "DELETE", "UPDATE", "INSERT",
            "UNION", "--", ";", "'",
        }

        // The query should be parameterized, not contain raw values
        for _, pattern := range dangerousPatterns {
            if containsRaw(query, pattern, value) {
                t.Errorf("Potential SQL injection: query contains unescaped %q", pattern)
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

        // Check that dangerous patterns are removed
        if containsUnsafe(sanitized) {
            t.Errorf("Sanitized output still contains dangerous content: %q", sanitized)
        }
    })
}
```

## Best Practices

### 1. Design for Fuzzability

```go
package main

// Good: Function takes simple types
func ProcessData(data []byte) (Result, error) {
    // Easy to fuzz
    return parse(data)
}

// Less ideal: Complex input types
func ProcessRequest(req *ComplexRequest) (Result, error) {
    // Harder to fuzz directly
    return handle(req)
}

// Solution: Create a wrapper for fuzzing
func FuzzProcessRequest(f *testing.F) {
    f.Add([]byte(`{"field": "value"}`))

    f.Fuzz(func(t *testing.T, data []byte) {
        // Deserialize to complex type
        var req ComplexRequest
        if err := json.Unmarshal(data, &req); err != nil {
            return // Skip invalid inputs
        }

        // Now test with valid complex input
        _, _ = ProcessRequest(&req)
    })
}
```

### 2. Focus on Invariants

```go
func FuzzSortedList(f *testing.F) {
    f.Add([]byte{3, 1, 4, 1, 5, 9, 2, 6})

    f.Fuzz(func(t *testing.T, data []byte) {
        // Convert to int slice
        ints := make([]int, len(data))
        for i, b := range data {
            ints[i] = int(b)
        }

        sorted := SortedList(ints)

        // Invariant 1: Output length equals input length
        if len(sorted) != len(ints) {
            t.Errorf("Length changed: %d -> %d", len(ints), len(sorted))
        }

        // Invariant 2: Output is sorted
        for i := 1; i < len(sorted); i++ {
            if sorted[i] < sorted[i-1] {
                t.Errorf("Not sorted at index %d: %d > %d", i, sorted[i-1], sorted[i])
            }
        }

        // Invariant 3: Same elements (multiset equality)
        if !sameElements(ints, sorted) {
            t.Error("Elements changed")
        }
    })
}
```

### 3. Handle Expected Failures Gracefully

```go
func FuzzParser(f *testing.F) {
    f.Add("valid input")

    f.Fuzz(func(t *testing.T, input string) {
        result, err := Parse(input)

        // Don't fail on expected errors
        if err != nil {
            // This is expected for invalid input
            // Just ensure error handling doesn't panic
            return
        }

        // Only check invariants for successful parses
        if result == nil {
            t.Error("Parse succeeded but result is nil")
        }
    })
}
```

### 4. Use Seed Corpus Effectively

```go
func FuzzImageDecoder(f *testing.F) {
    // Add real image files as seeds
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

    // Add crafted edge cases
    f.Add([]byte{})                    // Empty
    f.Add([]byte{0x89, 0x50, 0x4E, 0x47}) // PNG magic only
    f.Add([]byte{0xFF, 0xD8, 0xFF})    // JPEG magic only

    f.Fuzz(func(t *testing.T, data []byte) {
        img, format, err := DecodeImage(data)

        if err == nil {
            // Verify decoded image
            if img.Bounds().Empty() {
                t.Error("Decoded image has empty bounds")
            }
            if format == "" {
                t.Error("Format should not be empty for valid image")
            }
        }
    })
}
```

## Common Pitfalls

### 1. Not Checking Invariants

```go
// WRONG: Just running the function
func FuzzBadExample(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        _ = Process(s) // What are we testing?
    })
}

// CORRECT: Check meaningful properties
func FuzzGoodExample(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        result := Process(s)

        // Property: result should be uppercase
        if result != strings.ToUpper(result) {
            t.Errorf("Result not uppercase: %q", result)
        }

        // Property: length should not decrease
        if len(result) < len(s) {
            t.Errorf("Result shorter than input")
        }
    })
}
```

### 2. Overly Strict Assertions

```go
// WRONG: Fails on valid edge cases
func FuzzTooStrict(f *testing.F) {
    f.Add(5)
    f.Fuzz(func(t *testing.T, n int) {
        result := Compute(n)
        if result < 0 {
            t.Error("Negative result") // But negative input is valid!
        }
    })
}

// CORRECT: Account for edge cases
func FuzzFlexible(f *testing.F) {
    f.Add(5)
    f.Fuzz(func(t *testing.T, n int) {
        result := Compute(n)

        // Property: sign should be preserved for non-zero
        if n > 0 && result <= 0 {
            t.Error("Positive input gave non-positive result")
        }
        if n < 0 && result >= 0 {
            t.Error("Negative input gave non-negative result")
        }
    })
}
```

### 3. Missing Timeout Handling

```go
// WRONG: May hang on pathological inputs
func FuzzNoTimeout(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        // This might take forever for some inputs
        result := SlowProcess(s)
        _ = result
    })
}

// CORRECT: Use context with timeout
func FuzzWithTimeout(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        ctx, cancel := context.WithTimeout(context.Background(), time.Second)
        defer cancel()

        result, err := ProcessWithContext(ctx, s)
        if err == context.DeadlineExceeded {
            // Input caused timeout - might be worth investigating
            return
        }

        // Check properties
        _ = result
    })
}
```

### 4. Ignoring Corpus Failures

```bash
# When fuzzing finds a failure, it saves the input
# testdata/fuzz/FuzzReverse/abc123...

# WRONG: Deleting the failure and moving on
rm testdata/fuzz/FuzzReverse/abc123...

# CORRECT: Fix the bug, keep the corpus entry for regression testing
# The input will be run on every 'go test' invocation
```

## Performance Considerations

### Optimizing Fuzz Targets

```go
// WRONG: Slow fuzz target
func FuzzSlow(f *testing.F) {
    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        // Expensive setup on every iteration
        db := connectToDatabase()
        defer db.Close()

        result := query(db, s)
        _ = result
    })
}

// CORRECT: Minimize per-iteration overhead
var testDB *sql.DB

func FuzzFast(f *testing.F) {
    // One-time setup
    var err error
    testDB, err = connectToDatabase()
    if err != nil {
        f.Fatal(err)
    }
    f.Cleanup(func() { testDB.Close() })

    f.Add("input")
    f.Fuzz(func(t *testing.T, s string) {
        // Use shared resource
        result := query(testDB, s)
        _ = result
    })
}
```

### Resource Limits

```go
func FuzzResourceLimited(f *testing.F) {
    f.Add([]byte("input"))

    f.Fuzz(func(t *testing.T, data []byte) {
        // Limit input size to prevent OOM
        if len(data) > 1024*1024 { // 1MB max
            return
        }

        // Limit allocations
        result := ProcessWithLimit(data, MaxAllocation)
        _ = result
    })
}
```

## Real-World Scenarios

### Fuzzing a Compression Library

```go
func FuzzCompression(f *testing.F) {
    // Seed with various data patterns
    f.Add([]byte("hello world"))
    f.Add([]byte(strings.Repeat("a", 1000)))
    f.Add(make([]byte, 0))

    // Random-ish data
    randomData := make([]byte, 256)
    for i := range randomData {
        randomData[i] = byte(i)
    }
    f.Add(randomData)

    f.Fuzz(func(t *testing.T, original []byte) {
        // Compress
        compressed, err := Compress(original)
        if err != nil {
            return // Some inputs may not be compressible
        }

        // Decompress
        decompressed, err := Decompress(compressed)
        if err != nil {
            t.Fatalf("Decompress failed: %v", err)
        }

        // Property: Round-trip should preserve data
        if !bytes.Equal(original, decompressed) {
            t.Error("Data corruption after round-trip")
        }

        // Property: Compressed+decompressed should equal original size
        if len(decompressed) != len(original) {
            t.Error("Size mismatch after round-trip")
        }
    })
}
```

### Fuzzing a State Machine

```go
func FuzzStateMachine(f *testing.F) {
    // Commands: 0=start, 1=stop, 2=pause, 3=resume
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

            // Invariant: State should always be valid
            if !sm.IsValidState() {
                t.Errorf("Invalid state after command %d", cmd)
            }
        }

        // Invariant: Should be able to stop from any state
        sm.Stop()
        if sm.State() != StateStopped {
            t.Error("Could not stop state machine")
        }
    })
}
```

## Interview Key Points

1. **What is fuzz testing?**
   - Automated testing that generates random inputs
   - Coverage-guided: learns from code paths
   - Finds edge cases humans wouldn't think of

2. **How does Go fuzzing work?**
   - Native support since Go 1.18
   - Fuzzer generates mutations of seed corpus
   - Tracks coverage to guide input generation
   - Saves failing inputs for regression testing

3. **What are seed corpora?**
   - Initial inputs to start fuzzing from
   - Can be added via f.Add() or testdata/fuzz directory
   - Fuzzer mutates these to generate new inputs

4. **What should fuzz tests check?**
   - Properties/invariants, not specific outputs
   - Round-trip consistency
   - No panics or crashes
   - Security properties (no injection, etc.)

5. **When should you use fuzzing?**
   - Parsers and decoders
   - Serialization/deserialization
   - Cryptographic operations
   - Any input validation logic

## Further Reading

- [Go Fuzzing Tutorial](https://go.dev/doc/tutorial/fuzz)
- [Go Fuzzing Design Doc](https://go.dev/doc/fuzz/)
- [go-fuzz (pre-1.18 fuzzer)](https://github.com/dvyukov/go-fuzz)
- [Property-Based Testing Intro](https://increment.com/testing/in-praise-of-property-based-testing/)
- [AFL++ Fuzzer](https://aflplus.plus/)
- [Google OSS-Fuzz](https://google.github.io/oss-fuzz/)
