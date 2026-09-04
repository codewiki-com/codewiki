---
title: Swift Language Fundamentals
description: Deep dive into Swift variables, constants, data types and optionals
track: swift
section: basics
difficulty: beginner
tags:
  - Swift
  - Fundamentals
  - Optional
  - iOS
status: imported
origin: old/src/content/docs/swift/fundamentals.en.md
divergence: 0.12
issues: []
legacy:
  category: Swift
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

Swift is a powerful and intuitive programming language developed by Apple for iOS, macOS, watchOS, and tvOS development. We'll cover the fundamental concepts you need to master to become proficient in Swift programming.

## Variables and Constants

In Swift, you store values using either variables or constants, depending on whether the value needs to change over time.

### Constants with `let`

Constants are declared using the `let` keyword. Once a constant is assigned a value, it cannot be changed. This is the preferred way to store values in Swift when you know the value won't need to change.

```swift
let maximumLoginAttempts = 10
let welcomeMessage = "Hello, Swift!"
let pi = 3.14159

// This will cause a compilation error:
// maximumLoginAttempts = 15  // Error: Cannot assign to value: 'maximumLoginAttempts' is a 'let' constant
```

**Best Practice**: Always use `let` by default. Only use `var` when you know the value needs to change. This makes your code safer and your intentions clearer.

### Variables with `var`

Variables are declared using the `var` keyword. Unlike constants, variables can be modified after they're initially set.

```swift
var currentLoginAttempt = 0
var greeting = "Hello"

currentLoginAttempt = 1  // This is fine
greeting = "Hi there"    // This is also fine

var temperature = 20.5
temperature = 22.0       // Value can be updated
```

### Type Annotations

Swift is a type-safe language, but it uses type inference to determine the type of a variable or constant automatically. However, you can explicitly specify types using type annotations.

```swift
// Type inference
let inferredString = "Hello"        // Swift knows this is a String
let inferredNumber = 42              // Swift knows this is an Int

// Explicit type annotations
let explicitString: String = "Hello"
let explicitNumber: Int = 42
let explicitDouble: Double = 3.14

// Type annotation without immediate initialization
var username: String
username = "john_doe"  // Must be initialized before use
```

## Data Types

Swift provides a rich set of built-in data types to represent different kinds of values.

### Integer Types

Integers are whole numbers without a fractional component.

```swift
// Signed integers (can be positive, negative, or zero)
let smallNumber: Int8 = 127           // -128 to 127
let mediumNumber: Int16 = 32767       // -32,768 to 32,767
let normalNumber: Int = 1000000       // Platform-dependent (Int64 on 64-bit systems)

// Unsigned integers (only positive or zero)
let positiveNumber: UInt = 100        // 0 and positive values only
let byteValue: UInt8 = 255           // 0 to 255

// Integer literals in different formats
let decimalInteger = 17
let binaryInteger = 0b10001          // Binary (17 in decimal)
let octalInteger = 0o21              // Octal (17 in decimal)
let hexadecimalInteger = 0x11        // Hexadecimal (17 in decimal)
```

### Floating-Point Types

Floating-point numbers represent numbers with a fractional component.

```swift
let pi: Double = 3.14159             // 64-bit floating-point (preferred)
let smallPi: Float = 3.14159         // 32-bit floating-point

// Double has a precision of at least 15 decimal digits
let preciseNumber: Double = 3.141592653589793

// Float has a precision of about 6 decimal digits
let lessPrecise: Float = 3.141593

// Floating-point literals
let decimalDouble = 12.1875
let exponentDouble = 1.21875e1       // 12.1875 in exponential notation
let hexDouble = 0xC.3p0              // Hexadecimal floating-point (12.1875)
```

### Boolean Type

The Boolean type represents truth values.

```swift
let swiftIsFun: Bool = true
let isRaining: Bool = false

// Booleans are commonly used in conditional statements
if swiftIsFun {
    print("Let's code in Swift!")
}

// Swift is type-safe, so you can't use non-Boolean values as Booleans
let number = 1
// This won't work in Swift:
// if number { }  // Error: Type 'Int' cannot be used as a boolean
```

### String Type

Strings represent text in Swift.

```swift
// String literals
let singleLineString = "Hello, World!"
let multiLineString = """
    This is a
    multi-line
    string literal.
    """

// String interpolation
let name = "Alice"
let age = 30
let greeting = "Hello, my name is \(name) and I'm \(age) years old."
print(greeting)  // "Hello, my name is Alice and I'm 30 years old."

// String concatenation
let firstName = "John"
let lastName = "Doe"
let fullName = firstName + " " + lastName

// String methods
let message = "Swift Programming"
print(message.lowercased())          // "swift programming"
print(message.uppercased())          // "SWIFT PROGRAMMING"
print(message.count)                 // 17
print(message.isEmpty)               // false
```

### Character Type

A `Character` represents a single character.

```swift
let exclamationMark: Character = "!"
let letterA: Character = "A"
let emoji: Character = "😊"

// Iterating over characters in a string
let word = "Swift"
for character in word {
    print(character)
}
// Prints: S, w, i, f, t (each on a new line)
```

### Type Conversion

Swift doesn't allow implicit type conversion. You must explicitly convert between types.

```swift
let integer = 42
let decimal = 3.14

// This won't work:
// let sum = integer + decimal  // Error: Binary operator '+' cannot be applied

// Correct approach - explicit conversion
let sum = Double(integer) + decimal           // 45.14
let sumAsInt = integer + Int(decimal)         // 45 (decimal part truncated)

// String to number conversion
let numberString = "123"
if let number = Int(numberString) {
    print("Converted number: \(number)")
} else {
    print("Conversion failed")
}

// Number to string conversion
let age = 25
let ageString = String(age)                   // "25"
```

## Optionals

Optionals are one of Swift's most important features. They handle the absence of a value, making your code safer and more expressive.

### Understanding Optionals

An optional represents either a value or `nil` (the absence of a value). Optionals are declared by adding a `?` after the type.

```swift
// Regular variable (must have a value)
let name: String = "Alice"

// Optional variable (can have a value or be nil)
var optionalName: String? = "Bob"
optionalName = nil  // This is valid for optionals

// Without initialization, optionals default to nil
var age: Int?
print(age)  // nil

// Example: Converting a string to an integer
let possibleNumber = "123"
let convertedNumber: Int? = Int(possibleNumber)  // Returns Int? (optional Int)
print(convertedNumber)  // Optional(123)

let invalidNumber = "abc"
let failedConversion: Int? = Int(invalidNumber)   // Returns nil
print(failedConversion)  // nil
```

### Optional Binding

Optional binding is used to safely unwrap optionals and check if they contain a value.

#### If-Let Binding

```swift
let possibleNumber = "42"

if let actualNumber = Int(possibleNumber) {
    print("The number is \(actualNumber)")
    // actualNumber is available here as a regular Int
} else {
    print("Not a valid number")
}

// Multiple optional bindings
let firstNumber = "4"
let secondNumber = "2"

if let first = Int(firstNumber), let second = Int(secondNumber) {
    let sum = first + second
    print("Sum: \(sum)")  // Sum: 6
}

// Optional binding with additional conditions
if let number = Int(possibleNumber), number > 0 {
    print("Positive number: \(number)")
}
```

#### Guard-Let Binding

Guard statements are used for early exit when a condition is not met. They're particularly useful in functions.

```swift
func greet(person: [String: String]) {
    guard let name = person["name"] else {
        print("No name provided")
        return
    }

    // name is available here for the rest of the function
    print("Hello, \(name)!")

    guard let location = person["location"] else {
        print("I hope the weather is nice near you.")
        return
    }

    print("I hope the weather is nice in \(location).")
}

greet(person: ["name": "John"])
// Prints:
// Hello, John!
// I hope the weather is nice near you.

greet(person: ["name": "Jane", "location": "London"])
// Prints:
// Hello, Jane!
// I hope the weather is nice in London.
```

### Forced Unwrapping

You can force unwrap an optional using `!`, but this should be used sparingly as it will crash if the optional is `nil`.

```swift
let possibleNumber = "123"
let convertedNumber: Int? = Int(possibleNumber)

// Forced unwrapping
let number: Int = convertedNumber!  // Use only when you're certain it's not nil
print(number)  // 123

// DANGEROUS: This will crash
let invalidNumber = "abc"
let failedConversion: Int? = Int(invalidNumber)
// let forcedNumber = failedConversion!  // Runtime crash!
```

**Warning**: Only force unwrap when you're absolutely certain the optional contains a value. Otherwise, use optional binding.

### Implicitly Unwrapped Optionals

Implicitly unwrapped optionals are declared with `!` instead of `?`. They're optionals that are automatically unwrapped when accessed.

```swift
// Regular optional
let possibleString: String? = "An optional string."
let forcedString: String = possibleString!  // Requires explicit unwrapping

// Implicitly unwrapped optional
let assumedString: String! = "An implicitly unwrapped optional string."
let implicitString: String = assumedString  // No need for ! - automatic unwrapping

// Still can be treated as an optional
if let definiteString = assumedString {
    print(definiteString)
}
```

Implicitly unwrapped optionals are primarily used when:
- A value is set immediately after initialization and is never `nil` thereafter
- Working with UI outlets in iOS development

### Nil-Coalescing Operator

The nil-coalescing operator `??` provides a default value when an optional is `nil`.

```swift
let defaultColorName = "red"
var userDefinedColorName: String?  // nil by default

// If userDefinedColorName is nil, use defaultColorName
var colorNameToUse = userDefinedColorName ?? defaultColorName
print(colorNameToUse)  // "red"

userDefinedColorName = "green"
colorNameToUse = userDefinedColorName ?? defaultColorName
print(colorNameToUse)  // "green"

// Can be chained
let a: Int? = nil
let b: Int? = nil
let c: Int? = 42
let result = a ?? b ?? c ?? 0
print(result)  // 42
```

### Optional Chaining

Optional chaining allows you to call properties, methods, and subscripts on an optional that might be `nil`.

```swift
class Person {
    var residence: Residence?
}

class Residence {
    var numberOfRooms = 1
    var address: Address?
}

class Address {
    var street = "123 Main St"
}

let john = Person()

// Optional chaining - returns nil if any link in the chain is nil
if let roomCount = john.residence?.numberOfRooms {
    print("John's residence has \(roomCount) room(s).")
} else {
    print("Unable to retrieve the number of rooms.")
}
// Prints: "Unable to retrieve the number of rooms."

john.residence = Residence()
if let roomCount = john.residence?.numberOfRooms {
    print("John's residence has \(roomCount) room(s).")
}
// Prints: "John's residence has 1 room(s)."

// Chaining through multiple levels
let street = john.residence?.address?.street
print(street)  // nil (address is nil)

john.residence?.address = Address()
if let street = john.residence?.address?.street {
    print("John lives on \(street)")
}
// Prints: "John lives on 123 Main St"
```

## Collection Types

Swift provides three primary collection types: arrays, sets, and dictionaries.

### Arrays

Arrays store ordered collections of values of the same type.

```swift
// Creating arrays
var shoppingList: [String] = ["Eggs", "Milk"]
var numbers = [1, 2, 3, 4, 5]  // Type inferred as [Int]
var emptyArray: [Int] = []
var alsoEmpty = [String]()

// Array operations
shoppingList.append("Flour")
shoppingList += ["Baking Powder", "Chocolate"]
print(shoppingList.count)  // 5

// Accessing elements
let firstItem = shoppingList[0]  // "Eggs"
shoppingList[0] = "Six Eggs"     // Modify element

// Inserting and removing
shoppingList.insert("Maple Syrup", at: 0)
let removedItem = shoppingList.remove(at: 0)
let lastItem = shoppingList.removeLast()

// Iterating over arrays
for item in shoppingList {
    print(item)
}

// Iterating with index
for (index, value) in shoppingList.enumerated() {
    print("Item \(index + 1): \(value)")
}

// Checking if array contains an item
if shoppingList.contains("Milk") {
    print("Already have milk")
}

// Array properties
print(shoppingList.isEmpty)  // false
print(shoppingList.first)    // Optional("Six Eggs")
print(shoppingList.last)     // Optional("Chocolate")

// Creating arrays with default values
let threeDoubles = Array(repeating: 0.0, count: 3)  // [0.0, 0.0, 0.0]
```

### Sets

Sets store unordered collections of unique values of the same type.

```swift
// Creating sets
var favoriteGenres: Set<String> = ["Rock", "Classical", "Hip hop"]
var emptySet = Set<Int>()

// Set operations
favoriteGenres.insert("Jazz")
favoriteGenres.insert("Rock")  // No effect - already exists
print(favoriteGenres.count)    // 4

// Removing elements
if let removedGenre = favoriteGenres.remove("Classical") {
    print("Removed \(removedGenre)")
}

// Checking membership
if favoriteGenres.contains("Jazz") {
    print("I love Jazz!")
}

// Iterating over sets
for genre in favoriteGenres.sorted() {  // sorted() for predictable order
    print(genre)
}

// Set operations
let oddDigits: Set = [1, 3, 5, 7, 9]
let evenDigits: Set = [0, 2, 4, 6, 8]
let singleDigitPrimeNumbers: Set = [2, 3, 5, 7]

// Union - combine all values
let union = oddDigits.union(evenDigits).sorted()
print(union)  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Intersection - only common values
let intersection = oddDigits.intersection(singleDigitPrimeNumbers).sorted()
print(intersection)  // [3, 5, 7]

// Subtracting - values in first but not second
let subtraction = oddDigits.subtracting(singleDigitPrimeNumbers).sorted()
print(subtraction)  // [1, 9]

// Symmetric difference - values in either but not both
let symmetricDiff = oddDigits.symmetricDifference(singleDigitPrimeNumbers).sorted()
print(symmetricDiff)  // [1, 2, 9]

// Set relationships
let houseAnimals: Set = ["🐶", "🐱"]
let farmAnimals: Set = ["🐮", "🐔", "🐑", "🐶", "🐱"]
let cityAnimals: Set = ["🐦", "🐭"]

print(houseAnimals.isSubset(of: farmAnimals))       // true
print(farmAnimals.isSuperset(of: houseAnimals))     // true
print(farmAnimals.isDisjoint(with: cityAnimals))    // true (no common elements)
```

### Dictionaries

Dictionaries store unordered collections of key-value pairs.

```swift
// Creating dictionaries
var airports: [String: String] = ["YYZ": "Toronto Pearson", "DUB": "Dublin"]
var emptyDict: [String: Int] = [:]
var alsoEmptyDict = [String: Int]()

// Accessing values
let airportName = airports["YYZ"]  // Optional("Toronto Pearson")
print(type(of: airportName))       // Optional<String>

// Modifying dictionaries
airports["LHR"] = "London Heathrow"     // Add new key-value pair
airports["LHR"] = "London"              // Update existing value

// Using updateValue (returns old value)
if let oldValue = airports.updateValue("Dublin Airport", forKey: "DUB") {
    print("The old value for DUB was \(oldValue)")
}

// Removing values
airports["YYZ"] = nil  // Remove key-value pair
if let removedValue = airports.removeValue(forKey: "DUB") {
    print("Removed airport: \(removedValue)")
}

// Iterating over dictionaries
for (airportCode, airportName) in airports {
    print("\(airportCode): \(airportName)")
}

// Iterating over keys or values only
for airportCode in airports.keys {
    print("Airport code: \(airportCode)")
}

for airportName in airports.values {
    print("Airport name: \(airportName)")
}

// Converting keys/values to arrays
let airportCodes = Array(airports.keys)
let airportNames = Array(airports.values)

// Dictionary properties
print(airports.count)      // Number of key-value pairs
print(airports.isEmpty)    // false

// Default values for missing keys
let airportName2 = airports["XYZ", default: "Unknown Airport"]
print(airportName2)  // "Unknown Airport"

// Nested dictionaries
var studentGrades: [String: [String: Int]] = [
    "Alice": ["Math": 95, "Science": 88],
    "Bob": ["Math": 82, "Science": 91]
]

if let aliceMath = studentGrades["Alice"]?["Math"] {
    print("Alice's math grade: \(aliceMath)")
}
```

## Tuples

Tuples group multiple values into a single compound value. The values can be of different types.

```swift
// Simple tuple
let http404Error = (404, "Not Found")
print(http404Error.0)  // 404
print(http404Error.1)  // "Not Found"

// Named tuple elements
let http200Status = (statusCode: 200, description: "OK")
print(http200Status.statusCode)      // 200
print(http200Status.description)     // "OK"

// Decomposing tuples
let (statusCode, statusMessage) = http404Error
print("Status code: \(statusCode)")        // 404
print("Status message: \(statusMessage)")  // "Not Found"

// Ignoring parts with underscore
let (justTheCode, _) = http404Error
print(justTheCode)  // 404

// Function returning tuple
func minMax(array: [Int]) -> (min: Int, max: Int)? {
    guard !array.isEmpty else { return nil }

    var currentMin = array[0]
    var currentMax = array[0]

    for value in array[1..<array.count] {
        if value < currentMin {
            currentMin = value
        } else if value > currentMax {
            currentMax = value
        }
    }

    return (currentMin, currentMax)
}

if let bounds = minMax(array: [8, -6, 2, 109, 3, 71]) {
    print("Min is \(bounds.min) and max is \(bounds.max)")
}
// Prints: "Min is -6 and max is 109"
```

## Type Aliases

Type aliases allow you to provide an alternative name for an existing type.

```swift
typealias AudioSample = UInt16

var maxAmplitudeFound = AudioSample.min  // 0
let sample: AudioSample = 65535

// Useful for making code more readable
typealias Coordinate = (x: Double, y: Double)
let point: Coordinate = (x: 10.0, y: 20.0)

typealias CompletionHandler = (Bool) -> Void
func performAction(completion: CompletionHandler) {
    // Perform some action
    completion(true)
}
```

## Best Practices

1. **Prefer `let` over `var`**: Use constants by default, variables only when necessary.

2. **Use type inference**: Let Swift infer types unless explicit annotation improves clarity.

3. **Avoid force unwrapping**: Use optional binding or nil-coalescing instead of `!`.

4. **Use guard for early exits**: Guard statements make code more readable when validating preconditions.

5. **Choose the right collection type**:
   - Use Arrays for ordered collections
   - Use Sets for unique, unordered values
   - Use Dictionaries for key-value associations

6. **Be explicit with optionals**: Make it clear when a value can be absent.

7. **Use meaningful names**: Variable and constant names should describe their purpose.

## Summary

Swift fundamentals form the foundation of iOS and macOS development:

- **Variables (`var`) and Constants (`let`)**: Use constants by default for safety and clarity
- **Data Types**: Swift provides rich type support including Int, Double, Bool, String, and Character
- **Optionals**: Handle the absence of values safely with `?`, optional binding, and nil-coalescing
- **Collection Types**: Arrays for ordered data, Sets for unique values, Dictionaries for key-value pairs
- **Type Safety**: Swift's type system prevents many common programming errors at compile time

Mastering these fundamentals will enable you to write safe, efficient, and expressive Swift code. Practice these concepts regularly, and they'll become second nature as you build more complex applications.
