---
title: Go Language Fundamentals
description: "Deep dive into Go basics: variables, constants, data types, functions and control flow"
track: go
section: basics
difficulty: beginner
tags:
  - Go
  - Fundamentals
  - Variables
  - Functions
status: imported
origin: old/src/content/docs/go/fundamentals.en.md
divergence: 0.277
issues: []
legacy:
  category: Go
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

Go (also known as Golang) is a statically typed, compiled programming language designed at Google. It combines the efficiency of compiled languages with the ease of programming of interpreted languages. We cover the fundamental concepts you need to master Go programming.

## Packages and Imports

Every Go program is organized into packages. A package is a collection of source files in the same directory that are compiled together.

### Package Declaration

Every Go source file begins with a package declaration:

```go
package main
```

The `main` package is special - it defines a standalone executable program, not a library. The `main` function in the `main` package is where program execution begins.

### Importing Packages

You import other packages to use their exported functionality:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

For multiple imports, you can use a grouped import statement:

```go
package main

import (
    "fmt"
    "math"
    "strings"
    "time"
)

func main() {
    fmt.Println("Current time:", time.Now())
    fmt.Println("Square root of 16:", math.Sqrt(16))
    fmt.Println("Uppercase:", strings.ToUpper("hello"))
}
```

### Import Aliases

You can create aliases for imported packages:

```go
package main

import (
    f "fmt"
    m "math"
)

func main() {
    f.Println("Pi is approximately", m.Pi)
}
```

### Blank Imports

Sometimes you need to import a package for its side effects only (like initialization):

```go
import (
    "database/sql"
    _ "github.com/lib/pq" // PostgreSQL driver
)
```

## Variables and Constants

### Variable Declarations

Go provides several ways to declare variables:

#### Using `var` Keyword

```go
package main

import "fmt"

func main() {
    // Explicit type declaration
    var name string = "Alice"
    var age int = 30
    var isActive bool = true

    fmt.Println(name, age, isActive)

    // Type inference
    var city = "New York"  // type inferred as string
    var population = 8336817  // type inferred as int

    fmt.Println(city, population)
}
```

#### Multiple Variable Declaration

```go
package main

import "fmt"

func main() {
    // Multiple variables of same type
    var x, y, z int = 1, 2, 3

    // Multiple variables of different types
    var (
        username string = "john_doe"
        userId   int    = 12345
        verified bool   = true
    )

    fmt.Println(x, y, z)
    fmt.Println(username, userId, verified)
}
```

#### Short Variable Declaration

Inside functions, you can use the `:=` short assignment operator:

```go
package main

import "fmt"

func main() {
    // Short declaration (only inside functions)
    name := "Bob"
    age := 25
    height := 5.9

    fmt.Println(name, age, height)

    // Multiple short declarations
    firstName, lastName := "Jane", "Smith"
    fmt.Println(firstName, lastName)
}
```

#### Zero Values

Variables declared without an explicit initial value are given their zero value:

```go
package main

import "fmt"

func main() {
    var i int       // 0
    var f float64   // 0.0
    var b bool      // false
    var s string    // "" (empty string)

    fmt.Printf("int: %v, float: %v, bool: %v, string: '%v'\n", i, f, b, s)
}
```

### Constants

Constants are declared using the `const` keyword and cannot be changed after declaration:

```go
package main

import "fmt"

const Pi = 3.14159
const MaxConnections = 100

func main() {
    const greeting = "Hello"

    fmt.Println(Pi, MaxConnections, greeting)

    // Multiple constants
    const (
        StatusOK       = 200
        StatusNotFound = 404
        StatusError    = 500
    )

    fmt.Println(StatusOK, StatusNotFound, StatusError)
}
```

#### Enumerated Constants with `iota`

The `iota` keyword is used to create enumerated constants:

```go
package main

import "fmt"

const (
    Monday = iota + 1  // 1
    Tuesday            // 2
    Wednesday          // 3
    Thursday           // 4
    Friday             // 5
    Saturday           // 6
    Sunday             // 7
)

const (
    _  = iota             // skip 0
    KB = 1 << (10 * iota) // 1024
    MB                     // 1048576
    GB                     // 1073741824
)

func main() {
    fmt.Println("Friday:", Friday)
    fmt.Println("1 MB in bytes:", MB)
}
```

## Basic Data Types

Go has several built-in basic data types:

### Numeric Types

#### Integers

```go
package main

import "fmt"

func main() {
    // Signed integers
    var i8 int8 = 127           // -128 to 127
    var i16 int16 = 32767       // -32768 to 32767
    var i32 int32 = 2147483647  // -2^31 to 2^31-1
    var i64 int64 = 9223372036854775807  // -2^63 to 2^63-1

    // Unsigned integers
    var ui8 uint8 = 255         // 0 to 255
    var ui16 uint16 = 65535     // 0 to 65535
    var ui32 uint32 = 4294967295  // 0 to 2^32-1

    // Platform-dependent size (32 or 64 bits)
    var i int = 42
    var ui uint = 100

    fmt.Println(i8, i16, i32, i64)
    fmt.Println(ui8, ui16, ui32)
    fmt.Println(i, ui)
}
```

#### Floating-Point Numbers

```go
package main

import "fmt"

func main() {
    var f32 float32 = 3.14159
    var f64 float64 = 3.141592653589793

    // Scientific notation
    var large float64 = 1.23e9   // 1.23 * 10^9
    var small float64 = 1.23e-9  // 1.23 * 10^-9

    fmt.Println(f32, f64)
    fmt.Println(large, small)
}
```

#### Complex Numbers

```go
package main

import "fmt"

func main() {
    var c64 complex64 = 1 + 2i
    var c128 complex128 = 2 + 3i

    // Using complex() function
    c := complex(3, 4)  // 3 + 4i

    // Extracting real and imaginary parts
    fmt.Println("Real:", real(c), "Imaginary:", imag(c))
    fmt.Println(c64, c128, c)
}
```

### Boolean Type

```go
package main

import "fmt"

func main() {
    var isTrue bool = true
    var isFalse bool = false

    // Boolean operations
    result1 := isTrue && isFalse  // AND: false
    result2 := isTrue || isFalse  // OR: true
    result3 := !isTrue            // NOT: false

    fmt.Println(result1, result2, result3)

    // Comparison operations
    fmt.Println(5 > 3)   // true
    fmt.Println(5 == 3)  // false
    fmt.Println(5 != 3)  // true
}
```

### String Type

```go
package main

import "fmt"

func main() {
    var str1 string = "Hello, World!"
    str2 := "Go Programming"

    // String concatenation
    greeting := str1 + " " + str2
    fmt.Println(greeting)

    // String length
    fmt.Println("Length:", len(str1))

    // Accessing individual bytes (not characters!)
    fmt.Println("First byte:", str1[0])

    // Raw string literals (ignores escape sequences)
    path := `C:\Users\John\Documents`
    multiline := `This is a
    multiline
    string`

    fmt.Println(path)
    fmt.Println(multiline)

    // String iteration
    for i, char := range "Hello" {
        fmt.Printf("Index: %d, Character: %c\n", i, char)
    }
}
```

### Type Conversion

Go requires explicit type conversion:

```go
package main

import "fmt"

func main() {
    var i int = 42
    var f float64 = float64(i)
    var u uint = uint(f)

    fmt.Printf("int: %v, float64: %v, uint: %v\n", i, f, u)

    // String conversion
    var x int = 65
    var s string = string(x)  // Converts to character 'A'
    fmt.Println(s)

    // For numeric to string conversion, use strconv
    // import "strconv"
    // str := strconv.Itoa(42)  // "42"
}
```

## Functions

Functions are the building blocks of Go programs.

### Basic Function Syntax

```go
package main

import "fmt"

// Function with no parameters and no return value
func sayHello() {
    fmt.Println("Hello!")
}

// Function with parameters and return value
func add(x int, y int) int {
    return x + y
}

// Shortened parameter declaration (same type)
func multiply(x, y int) int {
    return x * y
}

// Multiple return values
func divide(dividend, divisor float64) (float64, error) {
    if divisor == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return dividend / divisor, nil
}

func main() {
    sayHello()

    sum := add(5, 3)
    fmt.Println("Sum:", sum)

    product := multiply(4, 7)
    fmt.Println("Product:", product)

    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Result:", result)
    }
}
```

### Named Return Values

Functions can have named return values, which act as variables:

```go
package main

import "fmt"

func split(sum int) (x, y int) {
    x = sum * 4 / 9
    y = sum - x
    return  // naked return
}

func calculate(a, b int) (sum, product, difference int) {
    sum = a + b
    product = a * b
    difference = a - b
    return  // returns sum, product, difference
}

func main() {
    x, y := split(17)
    fmt.Println("Split:", x, y)

    s, p, d := calculate(10, 5)
    fmt.Println("Sum:", s, "Product:", p, "Difference:", d)
}
```

### Variadic Functions

Functions can accept a variable number of arguments:

```go
package main

import "fmt"

func sum(numbers ...int) int {
    total := 0
    for _, num := range numbers {
        total += num
    }
    return total
}

func printInfo(name string, ages ...int) {
    fmt.Printf("Name: %s\n", name)
    fmt.Println("Ages:", ages)
}

func main() {
    fmt.Println("Sum:", sum(1, 2, 3, 4, 5))
    fmt.Println("Sum:", sum(10, 20))

    // Pass a slice
    numbers := []int{1, 2, 3, 4}
    fmt.Println("Sum:", sum(numbers...))

    printInfo("Alice", 25, 30, 35)
}
```

### Anonymous Functions and Closures

```go
package main

import "fmt"

func main() {
    // Anonymous function
    func(msg string) {
        fmt.Println(msg)
    }("Hello from anonymous function!")

    // Assign to variable
    greet := func(name string) string {
        return "Hello, " + name
    }
    fmt.Println(greet("Bob"))

    // Closure
    counter := makeCounter()
    fmt.Println(counter())  // 1
    fmt.Println(counter())  // 2
    fmt.Println(counter())  // 3
}

func makeCounter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}
```

### Higher-Order Functions

Functions can accept other functions as parameters:

```go
package main

import "fmt"

func apply(fn func(int, int) int, a, b int) int {
    return fn(a, b)
}

func main() {
    add := func(x, y int) int { return x + y }
    multiply := func(x, y int) int { return x * y }

    fmt.Println("Add:", apply(add, 5, 3))
    fmt.Println("Multiply:", apply(multiply, 5, 3))
}
```

## Defer Statement

The `defer` statement defers the execution of a function until the surrounding function returns.

### Basic Defer Usage

```go
package main

import "fmt"

func main() {
    defer fmt.Println("World")
    fmt.Println("Hello")
    // Output:
    // Hello
    // World
}
```

### Common Use Cases

#### Resource Cleanup

```go
package main

import (
    "fmt"
    "os"
)

func readFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()  // Ensures file is closed when function returns

    // Read and process file...
    // If an error occurs, file.Close() is still called

    return nil
}

func main() {
    err := readFile("example.txt")
    if err != nil {
        fmt.Println("Error:", err)
    }
}
```

### Defer Stack

Multiple defer statements are executed in LIFO (Last In, First Out) order:

```go
package main

import "fmt"

func main() {
    fmt.Println("Counting")

    for i := 0; i < 5; i++ {
        defer fmt.Println(i)
    }

    fmt.Println("Done")
    // Output:
    // Counting
    // Done
    // 4
    // 3
    // 2
    // 1
    // 0
}
```

### Defer with Function Arguments

Arguments to deferred functions are evaluated immediately:

```go
package main

import "fmt"

func main() {
    x := 10
    defer fmt.Println("Deferred x:", x)  // x is captured as 10

    x = 20
    fmt.Println("Current x:", x)
    // Output:
    // Current x: 20
    // Deferred x: 10
}
```

### Defer for Error Handling

```go
package main

import "fmt"

func processData() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered from panic: %v", r)
        }
    }()

    // Code that might panic
    panic("something went wrong")

    return nil
}

func main() {
    err := processData()
    if err != nil {
        fmt.Println("Error:", err)
    }
}
```

## Control Flow

### If Statements

```go
package main

import "fmt"

func main() {
    // Basic if
    x := 10
    if x > 5 {
        fmt.Println("x is greater than 5")
    }

    // If-else
    age := 18
    if age >= 18 {
        fmt.Println("Adult")
    } else {
        fmt.Println("Minor")
    }

    // If-else if-else
    score := 85
    if score >= 90 {
        fmt.Println("Grade: A")
    } else if score >= 80 {
        fmt.Println("Grade: B")
    } else if score >= 70 {
        fmt.Println("Grade: C")
    } else {
        fmt.Println("Grade: F")
    }

    // If with initialization statement
    if num := 9; num < 0 {
        fmt.Println(num, "is negative")
    } else if num < 10 {
        fmt.Println(num, "has 1 digit")
    } else {
        fmt.Println(num, "has multiple digits")
    }
    // num is not accessible here
}
```

### For Loops

Go has only one looping construct: the `for` loop.

```go
package main

import "fmt"

func main() {
    // Traditional for loop
    for i := 0; i < 5; i++ {
        fmt.Println(i)
    }

    // While-style loop
    j := 0
    for j < 5 {
        fmt.Println(j)
        j++
    }

    // Infinite loop
    count := 0
    for {
        count++
        if count > 3 {
            break
        }
        fmt.Println("Count:", count)
    }

    // Range loop (over arrays, slices, maps, strings)
    numbers := []int{1, 2, 3, 4, 5}
    for index, value := range numbers {
        fmt.Printf("Index: %d, Value: %d\n", index, value)
    }

    // Ignore index
    for _, value := range numbers {
        fmt.Println(value)
    }

    // Only index
    for index := range numbers {
        fmt.Println("Index:", index)
    }

    // Range over string
    for i, char := range "Hello" {
        fmt.Printf("Index: %d, Char: %c\n", i, char)
    }

    // Range over map
    person := map[string]string{
        "name": "Alice",
        "city": "New York",
    }
    for key, value := range person {
        fmt.Printf("%s: %s\n", key, value)
    }
}
```

### Break and Continue

```go
package main

import "fmt"

func main() {
    // Break statement
    for i := 0; i < 10; i++ {
        if i == 5 {
            break  // Exit loop when i is 5
        }
        fmt.Println(i)
    }

    fmt.Println("---")

    // Continue statement
    for i := 0; i < 5; i++ {
        if i == 2 {
            continue  // Skip iteration when i is 2
        }
        fmt.Println(i)
    }

    fmt.Println("---")

    // Labeled break (for nested loops)
outer:
    for i := 0; i < 3; i++ {
        for j := 0; j < 3; j++ {
            if i == 1 && j == 1 {
                break outer  // Break out of outer loop
            }
            fmt.Printf("i=%d, j=%d\n", i, j)
        }
    }
}
```

### Switch Statements

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // Basic switch
    day := "Tuesday"
    switch day {
    case "Monday":
        fmt.Println("Start of work week")
    case "Tuesday", "Wednesday", "Thursday":
        fmt.Println("Middle of work week")
    case "Friday":
        fmt.Println("End of work week")
    case "Saturday", "Sunday":
        fmt.Println("Weekend!")
    default:
        fmt.Println("Invalid day")
    }

    // Switch with initialization
    switch hour := time.Now().Hour(); {
    case hour < 12:
        fmt.Println("Good morning!")
    case hour < 17:
        fmt.Println("Good afternoon!")
    default:
        fmt.Println("Good evening!")
    }

    // Switch without expression (like if-else)
    num := 15
    switch {
    case num < 0:
        fmt.Println("Negative")
    case num == 0:
        fmt.Println("Zero")
    case num > 0 && num < 10:
        fmt.Println("Small positive")
    default:
        fmt.Println("Large positive")
    }

    // Type switch
    var i interface{} = "hello"
    switch v := i.(type) {
    case int:
        fmt.Println("Integer:", v)
    case string:
        fmt.Println("String:", v)
    case bool:
        fmt.Println("Boolean:", v)
    default:
        fmt.Printf("Unknown type: %T\n", v)
    }

    // Fallthrough
    number := 2
    switch number {
    case 1:
        fmt.Println("One")
    case 2:
        fmt.Println("Two")
        fallthrough  // Executes next case regardless of condition
    case 3:
        fmt.Println("Three")
    default:
        fmt.Println("Other")
    }
    // Output: Two, Three
}
```

### Goto Statement

While generally discouraged, Go supports `goto`:

```go
package main

import "fmt"

func main() {
    i := 0

Loop:
    fmt.Println(i)
    i++

    if i < 5 {
        goto Loop
    }

    fmt.Println("Done")
}
```

## Best Practices

### Use Short Variable Declarations

Inside functions, prefer `:=` over `var`:

```go
// Good
name := "Alice"
count := 42

// Less idiomatic (but fine for zero values)
var buffer bytes.Buffer
```

### Error Handling

Always handle errors explicitly:

```go
file, err := os.Open("data.txt")
if err != nil {
    return err  // or log and handle appropriately
}
defer file.Close()
```

### Use Descriptive Names

```go
// Good
userCount := 100
maxRetries := 3

// Avoid
uc := 100
mr := 3
```

### Keep Functions Focused

Write small, focused functions that do one thing well:

```go
// Good - separate concerns
func validateUser(user User) error { ... }
func saveUser(user User) error { ... }

// Less good - doing too much
func validateAndSaveUser(user User) error { ... }
```

### Use Constants for Magic Numbers

```go
const (
    MaxConnections = 100
    TimeoutSeconds = 30
    RetryAttempts  = 3
)

func connect() {
    // Use constants instead of magic numbers
    for i := 0; i < RetryAttempts; i++ {
        // connection logic
    }
}
```

## Summary

This guide covered the fundamental building blocks of Go programming:

- **Packages and Imports**: Organizing code and using external functionality
- **Variables and Constants**: Declaring and initializing data
- **Data Types**: Numeric types, booleans, strings, and type conversion
- **Functions**: Basic syntax, multiple returns, variadic functions, closures
- **Defer**: Delaying function execution for cleanup and resource management
- **Control Flow**: If statements, for loops, switch statements, and flow control

These fundamentals form the foundation for writing efficient and idiomatic Go code. Master these concepts, and you'll be well-prepared to tackle more advanced Go topics like structs, interfaces, concurrency, and error handling patterns.

## Next Steps

After mastering these fundamentals, explore:

- Composite types (arrays, slices, maps, structs)
- Methods and interfaces
- Pointers and memory management
- Error handling patterns
- Goroutines and channels (concurrency)
- Testing and benchmarking
- Working with packages and modules

Happy coding in Go!
