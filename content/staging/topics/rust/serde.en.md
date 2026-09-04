---
title: Serde Serialization
description: Complete guide to Rust Serde, serialization, deserialization and custom implementations
track: rust
section: cargo-tooling
difficulty: intermediate
tags:
  - Rust
  - Serde
  - Serialization
  - JSON
status: imported
origin: old/src/content/docs/rust/serde.en.md
divergence: 0.301
issues: []
legacy:
  category: Rust
  subcategory: Third-party Libraries
  order: 14
  lastUpdated: 2026-01-07
---

Serde is Rust's most popular serialization and deserialization framework. The name comes from **ser**ialize and **de**serialize. It provides a powerful, efficient, and flexible way to convert Rust data structures to and from various data formats like JSON, YAML, TOML, MessagePack, and many others.

## Introduction to Serde

Serde is designed around two core traits: `Serialize` and `Deserialize`. What makes Serde unique is its approach to serialization - it separates the data structure from the data format, allowing any data structure to be serialized to any format without writing format-specific code.

### Why Choose Serde

- **Zero-copy deserialization**: Parse data without unnecessary allocations
- **Format independence**: One annotation works for JSON, YAML, TOML, and more
- **Performance**: Generates highly optimized code at compile time
- **Flexibility**: Extensive customization through attributes and custom implementations
- **Wide ecosystem**: Support for dozens of data formats

### Architecture Overview

```text
Rust Data Structure
        |
   Serialize trait
        |
        v
   Serde Data Model (intermediate representation)
        |
   Serializer implementation
        |
        v
   Output Format (JSON, YAML, etc.)
```

The reverse happens for deserialization:

```text
Input Format (JSON, YAML, etc.)
        |
   Deserializer implementation
        |
        v
   Serde Data Model
        |
   Deserialize trait
        |
        v
Rust Data Structure
```

## Getting Started

### Adding Dependencies

Add Serde and the format-specific crate to your `Cargo.toml`:

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"  # For JSON support

# Other format crates you might use:
# serde_yaml = "0.9"
# toml = "0.8"
# serde_cbor = "0.11"
# rmp-serde = "1.1"  # MessagePack
```

### Basic Example

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    name: String,
    age: u32,
    email: String,
}

fn main() -> Result<(), serde_json::Error> {
    // Create a user
    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };

    // Serialize to JSON string
    let json = serde_json::to_string(&user)?;
    println!("Serialized: {}", json);
    // Output: {"name":"Alice","age":30,"email":"alice@example.com"}

    // Deserialize from JSON string
    let parsed: User = serde_json::from_str(&json)?;
    println!("Deserialized: {:?}", parsed);

    Ok(())
}
```

## The Serialize and Deserialize Traits

At the heart of Serde are two traits: `Serialize` and `Deserialize`. Understanding these traits helps you work effectively with Serde.

### The Serialize Trait

The `Serialize` trait defines how a type should be converted to Serde's data model.

```rust
pub trait Serialize {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer;
}
```

### The Deserialize Trait

The `Deserialize` trait defines how to construct a type from Serde's data model.

```rust
pub trait Deserialize<'de>: Sized {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>;
}
```

### Manual Implementation Example

While derive macros handle most cases, understanding manual implementation is valuable:

```rust
use serde::{Serialize, Serializer};
use serde::ser::SerializeStruct;

struct Point {
    x: f64,
    y: f64,
}

impl Serialize for Point {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("Point", 2)?;
        state.serialize_field("x", &self.x)?;
        state.serialize_field("y", &self.y)?;
        state.end()
    }
}

fn main() {
    let point = Point { x: 1.0, y: 2.0 };
    let json = serde_json::to_string(&point).unwrap();
    println!("{}", json); // {"x":1.0,"y":2.0}
}
```

## Derive Macros

The derive macros are the most common way to implement Serde traits. They automatically generate efficient serialization code.

### Deriving for Structs

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Person {
    first_name: String,
    last_name: String,
    age: u32,
    active: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct Company {
    name: String,
    employees: Vec<Person>,
    founded: u32,
}

fn main() {
    let company = Company {
        name: "Rust Corp".to_string(),
        employees: vec![
            Person {
                first_name: "Alice".to_string(),
                last_name: "Smith".to_string(),
                age: 30,
                active: true,
            },
            Person {
                first_name: "Bob".to_string(),
                last_name: "Jones".to_string(),
                age: 25,
                active: true,
            },
        ],
        founded: 2015,
    };

    let json = serde_json::to_string_pretty(&company).unwrap();
    println!("{}", json);
}
```

### Deriving for Enums

Serde handles enums with various representation options:

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
enum Status {
    Active,
    Inactive,
    Pending,
}

#[derive(Serialize, Deserialize, Debug)]
enum Message {
    Text(String),
    Number(i32),
    Coordinates { x: f64, y: f64 },
}

fn main() {
    let status = Status::Active;
    println!("{}", serde_json::to_string(&status).unwrap());
    // Output: "Active"

    let msg1 = Message::Text("Hello".to_string());
    let msg2 = Message::Number(42);
    let msg3 = Message::Coordinates { x: 1.0, y: 2.0 };

    println!("{}", serde_json::to_string(&msg1).unwrap());
    // Output: {"Text":"Hello"}

    println!("{}", serde_json::to_string(&msg2).unwrap());
    // Output: {"Number":42}

    println!("{}", serde_json::to_string(&msg3).unwrap());
    // Output: {"Coordinates":{"x":1.0,"y":2.0}}
}
```

### Deriving for Generic Types

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Wrapper<T> {
    data: T,
    metadata: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Response<T, E> {
    success: bool,
    data: Option<T>,
    error: Option<E>,
}

fn main() {
    let wrapper = Wrapper {
        data: vec![1, 2, 3],
        metadata: "numbers".to_string(),
    };

    let json = serde_json::to_string(&wrapper).unwrap();
    println!("{}", json);
    // Output: {"data":[1,2,3],"metadata":"numbers"}

    let response: Response<String, String> = Response {
        success: true,
        data: Some("Hello".to_string()),
        error: None,
    };

    println!("{}", serde_json::to_string(&response).unwrap());
}
```

## Working with serde_json

`serde_json` is the most commonly used Serde format crate. It provides comprehensive JSON support.

### Basic Serialization and Deserialization

```rust
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    debug: bool,
    port: u16,
    hosts: Vec<String>,
}

fn main() -> Result<(), serde_json::Error> {
    // Serialize to string
    let config = Config {
        debug: true,
        port: 8080,
        hosts: vec!["localhost".to_string(), "127.0.0.1".to_string()],
    };

    let json_string = serde_json::to_string(&config)?;
    let json_pretty = serde_json::to_string_pretty(&config)?;

    println!("Compact: {}", json_string);
    println!("Pretty:\n{}", json_pretty);

    // Serialize to bytes
    let json_bytes = serde_json::to_vec(&config)?;

    // Deserialize from string
    let parsed: Config = serde_json::from_str(&json_string)?;

    // Deserialize from bytes
    let parsed_from_bytes: Config = serde_json::from_slice(&json_bytes)?;

    Ok(())
}
```

### Working with Dynamic JSON (serde_json::Value)

When you do not know the structure at compile time, use `Value`:

```rust
use serde_json::{json, Value};

fn main() -> Result<(), serde_json::Error> {
    // Create JSON using the json! macro
    let data = json!({
        "name": "Alice",
        "age": 30,
        "address": {
            "city": "Wonderland",
            "zip": "12345"
        },
        "phones": [
            "+1-555-1234",
            "+1-555-5678"
        ]
    });

    // Access values
    println!("Name: {}", data["name"]);
    println!("City: {}", data["address"]["city"]);
    println!("First phone: {}", data["phones"][0]);

    // Check if key exists
    if data.get("email").is_none() {
        println!("No email field");
    }

    // Parse unknown JSON
    let json_str = r#"{"key": "value", "number": 42}"#;
    let parsed: Value = serde_json::from_str(json_str)?;

    // Pattern match on value types
    match &parsed["number"] {
        Value::Number(n) => println!("Number: {}", n),
        _ => println!("Not a number"),
    }

    // Convert Value to a typed struct
    #[derive(serde::Deserialize, Debug)]
    struct Data {
        key: String,
        number: i32,
    }

    let typed: Data = serde_json::from_value(parsed)?;
    println!("{:?}", typed);

    Ok(())
}
```

### Streaming JSON

For large files or streaming scenarios:

```rust
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;

#[derive(Serialize, Deserialize, Debug)]
struct Record {
    id: u32,
    name: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Write to file
    let records = vec![
        Record { id: 1, name: "Alice".to_string() },
        Record { id: 2, name: "Bob".to_string() },
    ];

    let file = File::create("records.json")?;
    serde_json::to_writer_pretty(file, &records)?;

    // Read from file
    let file = File::open("records.json")?;
    let reader = BufReader::new(file);
    let loaded: Vec<Record> = serde_json::from_reader(reader)?;

    println!("{:?}", loaded);

    // Clean up
    std::fs::remove_file("records.json")?;

    Ok(())
}
```

### Raw JSON Values

Sometimes you want to pass through JSON without parsing:

```rust
use serde::{Deserialize, Serialize};
use serde_json::value::RawValue;

#[derive(Serialize, Deserialize, Debug)]
struct Response<'a> {
    status: u32,
    #[serde(borrow)]
    payload: &'a RawValue,
}

fn main() -> Result<(), serde_json::Error> {
    let json = r#"{"status": 200, "payload": {"nested": "data", "array": [1,2,3]}}"#;

    let response: Response = serde_json::from_str(json)?;

    println!("Status: {}", response.status);
    println!("Raw payload: {}", response.payload.get());
    // The payload is not parsed, just passed through

    Ok(())
}
```

## Serde Attributes

Serde provides extensive customization through attributes. These are applied using `#[serde(...)]` syntax.

### Container Attributes

Container attributes apply to structs or enums:

```rust
use serde::{Deserialize, Serialize};

// Rename all fields to camelCase
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UserProfile {
    user_name: String,      // Serialized as "userName"
    email_address: String,  // Serialized as "emailAddress"
    is_active: bool,        // Serialized as "isActive"
}

// Deny unknown fields during deserialization
#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct StrictConfig {
    name: String,
    value: i32,
}

// Use a different tag for enum variants
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
enum Event {
    Click { x: i32, y: i32 },
    KeyPress { key: String },
}

// Adjacent tagging
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
enum Message {
    Request { id: u32, method: String },
    Response { id: u32, result: String },
}

fn main() {
    let profile = UserProfile {
        user_name: "alice".to_string(),
        email_address: "alice@example.com".to_string(),
        is_active: true,
    };
    println!("{}", serde_json::to_string_pretty(&profile).unwrap());

    let event = Event::Click { x: 100, y: 200 };
    println!("{}", serde_json::to_string(&event).unwrap());
    // Output: {"type":"Click","x":100,"y":200}

    let msg = Message::Request {
        id: 1,
        method: "get".to_string(),
    };
    println!("{}", serde_json::to_string(&msg).unwrap());
    // Output: {"type":"Request","data":{"id":1,"method":"get"}}
}
```

### Field Attributes

Field attributes apply to individual fields:

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Document {
    // Rename this field
    #[serde(rename = "documentId")]
    id: String,

    // Skip serializing if None
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,

    // Use default value if missing during deserialization
    #[serde(default)]
    tags: Vec<String>,

    // Custom default value
    #[serde(default = "default_priority")]
    priority: u32,

    // Skip this field entirely
    #[serde(skip)]
    internal_state: String,

    // Flatten nested structure
    #[serde(flatten)]
    metadata: Metadata,

    // Serialize with a custom function
    #[serde(serialize_with = "serialize_uppercase")]
    title: String,
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct Metadata {
    created_by: String,
    version: u32,
}

fn default_priority() -> u32 {
    5
}

fn serialize_uppercase<S>(value: &str, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&value.to_uppercase())
}

fn main() {
    let doc = Document {
        id: "doc-123".to_string(),
        description: None,
        tags: vec!["rust".to_string()],
        priority: 10,
        internal_state: "hidden".to_string(),
        metadata: Metadata {
            created_by: "alice".to_string(),
            version: 1,
        },
        title: "hello world".to_string(),
    };

    let json = serde_json::to_string_pretty(&doc).unwrap();
    println!("{}", json);
}
```

### Variant Attributes

Variant attributes apply to enum variants:

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
enum ApiResponse {
    // Rename this variant
    #[serde(rename = "success")]
    Ok { data: String },

    // Use different names for serialization and deserialization
    #[serde(rename(serialize = "error", deserialize = "err"))]
    Error { message: String },

    // Alias for deserialization
    #[serde(alias = "pending", alias = "in_progress")]
    Processing,

    // Skip this variant
    #[serde(skip)]
    Internal(String),
}

fn main() {
    let response = ApiResponse::Ok {
        data: "Hello".to_string(),
    };
    println!("{}", serde_json::to_string(&response).unwrap());
    // Output: {"success":{"data":"Hello"}}

    // Can deserialize from alias
    let json = r#""pending""#;
    let status: ApiResponse = serde_json::from_str(json).unwrap();
    println!("{:?}", status); // Processing
}
```

### Common Rename Conventions

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
struct Lowercase {
    my_field: String, // "myfield"
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
struct Uppercase {
    my_field: String, // "MYFIELD"
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CamelCase {
    my_field: String, // "myField"
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PascalCase {
    my_field: String, // "MyField"
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
struct SnakeCase {
    myField: String, // "my_field"
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
struct ScreamingSnakeCase {
    my_field: String, // "MY_FIELD"
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
struct KebabCase {
    my_field: String, // "my-field"
}
```

## Custom Serializers and Deserializers

When default behavior is not sufficient, you can implement custom serialization logic.

### Using serialize_with and deserialize_with

```rust
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Debug)]
struct Event {
    name: String,

    #[serde(serialize_with = "serialize_timestamp", deserialize_with = "deserialize_timestamp")]
    timestamp: SystemTime,

    #[serde(serialize_with = "serialize_duration", deserialize_with = "deserialize_duration")]
    duration: Duration,
}

fn serialize_timestamp<S>(time: &SystemTime, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let duration = time.duration_since(UNIX_EPOCH).unwrap();
    serializer.serialize_u64(duration.as_secs())
}

fn deserialize_timestamp<'de, D>(deserializer: D) -> Result<SystemTime, D::Error>
where
    D: Deserializer<'de>,
{
    let secs = u64::deserialize(deserializer)?;
    Ok(UNIX_EPOCH + Duration::from_secs(secs))
}

fn serialize_duration<S>(duration: &Duration, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&format!("{}ms", duration.as_millis()))
}

fn deserialize_duration<'de, D>(deserializer: D) -> Result<Duration, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    let ms: u64 = s
        .trim_end_matches("ms")
        .parse()
        .map_err(serde::de::Error::custom)?;
    Ok(Duration::from_millis(ms))
}

fn main() {
    let event = Event {
        name: "startup".to_string(),
        timestamp: SystemTime::now(),
        duration: Duration::from_millis(1500),
    };

    let json = serde_json::to_string_pretty(&event).unwrap();
    println!("{}", json);

    let parsed: Event = serde_json::from_str(&json).unwrap();
    println!("{:?}", parsed);
}
```

### Custom Deserialize Implementation

```rust
use serde::de::{self, MapAccess, Visitor};
use serde::{Deserialize, Deserializer, Serialize};
use std::fmt;

#[derive(Debug, Serialize)]
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

impl<'de> Deserialize<'de> for Color {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        // Accept either a string like "#RRGGBB" or an object with r, g, b fields
        struct ColorVisitor;

        impl<'de> Visitor<'de> for ColorVisitor {
            type Value = Color;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a color string like '#RRGGBB' or an object with r, g, b fields")
            }

            fn visit_str<E>(self, value: &str) -> Result<Color, E>
            where
                E: de::Error,
            {
                if !value.starts_with('#') || value.len() != 7 {
                    return Err(E::custom("invalid color format"));
                }

                let r = u8::from_str_radix(&value[1..3], 16).map_err(E::custom)?;
                let g = u8::from_str_radix(&value[3..5], 16).map_err(E::custom)?;
                let b = u8::from_str_radix(&value[5..7], 16).map_err(E::custom)?;

                Ok(Color { r, g, b })
            }

            fn visit_map<M>(self, mut map: M) -> Result<Color, M::Error>
            where
                M: MapAccess<'de>,
            {
                let mut r = None;
                let mut g = None;
                let mut b = None;

                while let Some(key) = map.next_key::<String>()? {
                    match key.as_str() {
                        "r" => r = Some(map.next_value()?),
                        "g" => g = Some(map.next_value()?),
                        "b" => b = Some(map.next_value()?),
                        _ => {
                            let _: serde_json::Value = map.next_value()?;
                        }
                    }
                }

                Ok(Color {
                    r: r.ok_or_else(|| de::Error::missing_field("r"))?,
                    g: g.ok_or_else(|| de::Error::missing_field("g"))?,
                    b: b.ok_or_else(|| de::Error::missing_field("b"))?,
                })
            }
        }

        deserializer.deserialize_any(ColorVisitor)
    }
}

fn main() {
    // Deserialize from hex string
    let color1: Color = serde_json::from_str(r#""#FF5733""#).unwrap();
    println!("{:?}", color1); // Color { r: 255, g: 87, b: 51 }

    // Deserialize from object
    let color2: Color = serde_json::from_str(r#"{"r": 100, "g": 150, "b": 200}"#).unwrap();
    println!("{:?}", color2); // Color { r: 100, g: 150, b: 200 }
}
```

### Implementing Serialize Manually

```rust
use serde::ser::{SerializeMap, Serializer};
use serde::Serialize;
use std::collections::HashMap;

struct SortedMap {
    data: HashMap<String, i32>,
}

impl Serialize for SortedMap {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // Serialize the map with keys in sorted order
        let mut sorted_keys: Vec<_> = self.data.keys().collect();
        sorted_keys.sort();

        let mut map = serializer.serialize_map(Some(self.data.len()))?;
        for key in sorted_keys {
            map.serialize_entry(key, &self.data[key])?;
        }
        map.end()
    }
}

fn main() {
    let mut data = HashMap::new();
    data.insert("zebra".to_string(), 3);
    data.insert("apple".to_string(), 1);
    data.insert("banana".to_string(), 2);

    let sorted_map = SortedMap { data };

    let json = serde_json::to_string(&sorted_map).unwrap();
    println!("{}", json); // {"apple":1,"banana":2,"zebra":3}
}
```

### Using serde_with for Common Patterns

The `serde_with` crate provides many helpful utilities:

```rust
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr, DurationSeconds};
use std::time::Duration;

#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
struct Config {
    // Serialize/deserialize as string using Display/FromStr
    #[serde_as(as = "DisplayFromStr")]
    port: u16,

    // Serialize Duration as seconds
    #[serde_as(as = "DurationSeconds<u64>")]
    timeout: Duration,

    // Nested transformation
    #[serde_as(as = "Vec<DisplayFromStr>")]
    ports: Vec<u16>,
}

fn main() {
    let config = Config {
        port: 8080,
        timeout: Duration::from_secs(30),
        ports: vec![80, 443, 8080],
    };

    let json = serde_json::to_string_pretty(&config).unwrap();
    println!("{}", json);
    // {
    //   "port": "8080",
    //   "timeout": 30,
    //   "ports": ["80", "443", "8080"]
    // }
}
```

## Format Independence

One of Serde's greatest strengths is format independence. The same derive macros work across all supported formats.

### Supporting Multiple Formats

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Settings {
    app_name: String,
    debug_mode: bool,
    max_connections: u32,
    allowed_hosts: Vec<String>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let settings = Settings {
        app_name: "MyApp".to_string(),
        debug_mode: true,
        max_connections: 100,
        allowed_hosts: vec!["localhost".to_string(), "example.com".to_string()],
    };

    // JSON
    let json = serde_json::to_string_pretty(&settings)?;
    println!("JSON:\n{}\n", json);

    // YAML (requires serde_yaml crate)
    // let yaml = serde_yaml::to_string(&settings)?;
    // println!("YAML:\n{}\n", yaml);

    // TOML (requires toml crate)
    // let toml = toml::to_string_pretty(&settings)?;
    // println!("TOML:\n{}\n", toml);

    // All formats can deserialize back to the same struct
    let from_json: Settings = serde_json::from_str(&json)?;
    println!("Deserialized: {:?}", from_json);

    Ok(())
}
```

### Format-Specific Features

Different formats may have specific features or limitations:

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Data {
    // JSON preserves insertion order in objects with some implementations
    // YAML supports anchors and aliases
    // TOML has strict typing for tables vs arrays of tables
    // MessagePack is binary and more compact

    value: String,
    count: i32,
}

// Creating a format-agnostic configuration system
fn load_config<T>(content: &str, format: &str) -> Result<T, Box<dyn std::error::Error>>
where
    T: for<'de> Deserialize<'de>,
{
    match format {
        "json" => Ok(serde_json::from_str(content)?),
        // "yaml" => Ok(serde_yaml::from_str(content)?),
        // "toml" => Ok(toml::from_str(content)?),
        _ => Err("Unsupported format".into()),
    }
}

fn save_config<T>(data: &T, format: &str) -> Result<String, Box<dyn std::error::Error>>
where
    T: Serialize,
{
    match format {
        "json" => Ok(serde_json::to_string_pretty(data)?),
        // "yaml" => Ok(serde_yaml::to_string(data)?),
        // "toml" => Ok(toml::to_string_pretty(data)?),
        _ => Err("Unsupported format".into()),
    }
}

fn main() {
    let data = Data {
        value: "test".to_string(),
        count: 42,
    };

    let json = save_config(&data, "json").unwrap();
    println!("{}", json);

    let loaded: Data = load_config(&json, "json").unwrap();
    println!("{:?}", loaded);
}
```

## Advanced Patterns

### Handling Optional and Default Values

```rust
use serde::{Deserialize, Serialize};

fn default_retries() -> u32 {
    3
}

fn is_default_retries(value: &u32) -> bool {
    *value == 3
}

#[derive(Serialize, Deserialize, Debug)]
struct RequestConfig {
    url: String,

    // Use default if missing
    #[serde(default)]
    headers: Vec<String>,

    // Custom default
    #[serde(default = "default_retries")]
    retries: u32,

    // Skip serializing if equals default
    #[serde(default = "default_retries", skip_serializing_if = "is_default_retries")]
    max_retries: u32,

    // Option with skip_serializing_if None
    #[serde(skip_serializing_if = "Option::is_none")]
    timeout_ms: Option<u64>,

    // Deserialize from null as None or missing as None
    #[serde(default, deserialize_with = "deserialize_null_default")]
    optional_value: Option<String>,
}

fn deserialize_null_default<'de, D, T>(deserializer: D) -> Result<T, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Default + Deserialize<'de>,
{
    let opt = Option::deserialize(deserializer)?;
    Ok(opt.unwrap_or_default())
}

fn main() {
    // Minimal JSON with missing optional fields
    let json = r#"{"url": "https://example.com"}"#;
    let config: RequestConfig = serde_json::from_str(json).unwrap();
    println!("{:?}", config);
    // Headers will be empty vec, retries will be 3

    // Full JSON
    let json = r#"{
        "url": "https://example.com",
        "headers": ["Authorization: Bearer token"],
        "retries": 5,
        "max_retries": 3,
        "timeout_ms": 5000,
        "optional_value": null
    }"#;
    let config: RequestConfig = serde_json::from_str(json).unwrap();
    println!("{:?}", config);
}
```

### Untagged Enums

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
enum Value {
    Integer(i64),
    Float(f64),
    String(String),
    Boolean(bool),
    Array(Vec<Value>),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
enum StringOrNumber {
    Number(i64),
    String(String),
}

fn main() {
    let values: Vec<Value> = serde_json::from_str(r#"[42, 3.14, "hello", true, [1, 2]]"#).unwrap();

    for value in values {
        println!("{:?}", value);
    }

    // Useful for APIs that return string or number IDs
    let id1: StringOrNumber = serde_json::from_str("123").unwrap();
    let id2: StringOrNumber = serde_json::from_str(r#""abc123""#).unwrap();

    println!("{:?}", id1); // Number(123)
    println!("{:?}", id2); // String("abc123")
}
```

### Borrowed vs Owned Data

```rust
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

// Zero-copy deserialization for strings that do not need escaping
#[derive(Deserialize, Debug)]
struct BorrowedData<'a> {
    #[serde(borrow)]
    name: &'a str,
    #[serde(borrow)]
    data: Cow<'a, str>,
}

// Owned version for when data outlives the source
#[derive(Deserialize, Debug)]
struct OwnedData {
    name: String,
    data: String,
}

fn main() {
    let json = r#"{"name": "test", "data": "hello world"}"#;

    // Borrowed - data references the original JSON string
    // More efficient but borrowed data cannot outlive json
    let borrowed: BorrowedData = serde_json::from_str(json).unwrap();
    println!("{:?}", borrowed);

    // Owned - data is copied
    let owned: OwnedData = serde_json::from_str(json).unwrap();
    println!("{:?}", owned);

    // With Cow, strings without escapes are borrowed, escaped strings are owned
    let json_escaped = r#"{"name": "test", "data": "hello\nworld"}"#;
    let cow_data: BorrowedData = serde_json::from_str(json_escaped).unwrap();
    // data field will be Owned because of the escape sequence
}
```

### Remote Derive

Implement Serde for types from external crates:

```rust
use serde::{Deserialize, Serialize};

// Suppose this is from an external crate
mod external {
    pub struct Duration {
        pub secs: u64,
        pub nanos: u32,
    }
}

// Define a shadow type with serde attributes
#[derive(Serialize, Deserialize)]
#[serde(remote = "external::Duration")]
struct DurationDef {
    secs: u64,
    nanos: u32,
}

#[derive(Serialize, Deserialize)]
struct Task {
    name: String,
    #[serde(with = "DurationDef")]
    duration: external::Duration,
}

fn main() {
    let task = Task {
        name: "Process".to_string(),
        duration: external::Duration {
            secs: 60,
            nanos: 0,
        },
    };

    let json = serde_json::to_string(&task).unwrap();
    println!("{}", json);
}
```

## Error Handling

Serde provides detailed error information for debugging serialization issues.

### Understanding Error Types

```rust
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Deserialize, Debug)]
struct Config {
    name: String,
    count: u32,
}

fn main() {
    // Missing field error
    let json = r#"{"name": "test"}"#;
    match serde_json::from_str::<Config>(json) {
        Ok(config) => println!("{:?}", config),
        Err(e) => {
            eprintln!("Error: {}", e);
            eprintln!("Line: {}, Column: {}", e.line(), e.column());
            // Classify the error
            if e.is_data() {
                eprintln!("Data error: missing field or type mismatch");
            } else if e.is_syntax() {
                eprintln!("Syntax error: invalid JSON");
            } else if e.is_io() {
                eprintln!("IO error: problem reading input");
            } else if e.is_eof() {
                eprintln!("EOF error: unexpected end of input");
            }
        }
    }

    // Type mismatch error
    let json = r#"{"name": "test", "count": "not a number"}"#;
    if let Err(e) = serde_json::from_str::<Config>(json) {
        eprintln!("Type error: {}", e);
    }

    // Syntax error
    let json = r#"{"name": "test", count: 5}"#; // Missing quotes around key
    if let Err(e) = serde_json::from_str::<Config>(json) {
        eprintln!("Syntax error: {}", e);
    }
}
```

### Custom Error Messages

```rust
use serde::{de, Deserialize, Deserializer};

#[derive(Debug)]
struct Percentage(f64);

impl<'de> Deserialize<'de> for Percentage {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = f64::deserialize(deserializer)?;

        if value < 0.0 || value > 100.0 {
            return Err(de::Error::custom(format!(
                "percentage must be between 0 and 100, got {}",
                value
            )));
        }

        Ok(Percentage(value))
    }
}

fn main() {
    let valid: Result<Percentage, _> = serde_json::from_str("50.0");
    println!("{:?}", valid); // Ok(Percentage(50.0))

    let invalid: Result<Percentage, _> = serde_json::from_str("150.0");
    println!("{:?}", invalid);
    // Err: percentage must be between 0 and 100, got 150
}
```

### Handling Missing vs Null

```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct Data {
    // Required field
    id: i32,

    // Optional: missing becomes None
    #[serde(default)]
    name: Option<String>,

    // Distinguishing between missing, null, and present
    #[serde(default, deserialize_with = "deserialize_optional_field")]
    value: OptionalField<String>,
}

#[derive(Debug)]
enum OptionalField<T> {
    Missing,
    Null,
    Present(T),
}

impl<T> Default for OptionalField<T> {
    fn default() -> Self {
        OptionalField::Missing
    }
}

fn deserialize_optional_field<'de, D, T>(deserializer: D) -> Result<OptionalField<T>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Deserialize<'de>,
{
    let opt = Option::<T>::deserialize(deserializer)?;
    match opt {
        Some(value) => Ok(OptionalField::Present(value)),
        None => Ok(OptionalField::Null),
    }
}

fn main() {
    // All fields present
    let json = r#"{"id": 1, "name": "test", "value": "hello"}"#;
    let data: Data = serde_json::from_str(json).unwrap();
    println!("{:?}", data);

    // Missing optional field
    let json = r#"{"id": 1}"#;
    let data: Data = serde_json::from_str(json).unwrap();
    println!("{:?}", data); // value: Missing

    // Null value
    let json = r#"{"id": 1, "value": null}"#;
    let data: Data = serde_json::from_str(json).unwrap();
    println!("{:?}", data); // value: Null
}
```

## Performance Considerations

### Minimizing Allocations

```rust
use serde::Deserialize;
use std::borrow::Cow;

// Use borrowed data when possible
#[derive(Deserialize)]
struct EfficientData<'a> {
    // Zero-copy if no escapes
    #[serde(borrow)]
    text: Cow<'a, str>,

    // Borrow slices when possible
    #[serde(borrow)]
    raw_message: &'a str,
}

// Pre-allocate for known sizes
#[derive(Deserialize)]
struct KnownSize {
    // If you know the approximate size, consider using arrayvec or smallvec
    // For JSON arrays of known size
    items: Vec<i32>,
}

fn main() {
    let json = r#"{"text": "hello", "raw_message": "world"}"#;
    let data: EfficientData = serde_json::from_str(json).unwrap();

    // The text and raw_message reference the original JSON string
    // No allocation needed for these fields
}
```

### Choosing the Right Serialization Format

```rust
// Binary formats (MessagePack, CBOR, Bincode) are generally faster and more compact
// Use them for:
// - Internal service communication
// - Caching
// - Performance-critical paths

// Text formats (JSON, YAML, TOML) are better for:
// - Human-readable configuration
// - API responses
// - Debugging

// Benchmark comparison (rough estimates):
// Format       | Size    | Serialize | Deserialize
// -----------  | ------- | --------- | -----------
// JSON         | Large   | Moderate  | Moderate
// MessagePack  | Small   | Fast      | Fast
// CBOR         | Small   | Fast      | Fast
// Bincode      | Minimal | Fastest   | Fastest
// YAML         | Large   | Slow      | Slow
// TOML         | Medium  | Moderate  | Moderate
```

### Streaming and Large Data

```rust
use serde::{Deserialize, Serialize};
use std::io::{BufReader, BufWriter};
use std::fs::File;

#[derive(Serialize, Deserialize)]
struct Record {
    id: u64,
    data: String,
}

fn process_large_json_array() -> Result<(), Box<dyn std::error::Error>> {
    // For large JSON arrays, use streaming
    let file = File::open("large_data.json")?;
    let reader = BufReader::new(file);

    // Use a streaming deserializer
    let stream = serde_json::Deserializer::from_reader(reader).into_iter::<Record>();

    for result in stream {
        let record = result?;
        // Process each record without loading entire file into memory
        println!("Processing record {}", record.id);
    }

    Ok(())
}

fn write_large_json_array() -> Result<(), Box<dyn std::error::Error>> {
    let file = File::create("output.json")?;
    let writer = BufWriter::new(file);

    // Write directly to file
    let records = vec![
        Record { id: 1, data: "first".to_string() },
        Record { id: 2, data: "second".to_string() },
    ];

    serde_json::to_writer(writer, &records)?;

    Ok(())
}
```

## Best Practices

### Use Derive When Possible

```rust
// Prefer derive macros for standard serialization
#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
}

// Only implement manually when necessary for special behavior
```

### Document Serialization Format

```rust
use serde::{Deserialize, Serialize};

/// Configuration for the application.
///
/// # JSON Example
/// ```json
/// {
///     "serverHost": "localhost",
///     "serverPort": 8080,
///     "debugMode": false
/// }
/// ```
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppConfig {
    server_host: String,
    server_port: u16,
    debug_mode: bool,
}
```

### Use Type-Safe Wrappers

```rust
use serde::{Deserialize, Serialize};

// Instead of using String for emails
#[derive(Serialize, Deserialize, Debug)]
struct Email(String);

impl Email {
    fn new(email: &str) -> Result<Self, &'static str> {
        if email.contains('@') {
            Ok(Email(email.to_string()))
        } else {
            Err("Invalid email format")
        }
    }
}

// Instead of using i64 for IDs
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct UserId(u64);

#[derive(Serialize, Deserialize, Debug)]
struct User {
    id: UserId,
    email: Email,
}
```

### Handle Versioning

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct ConfigV1 {
    name: String,
}

#[derive(Serialize, Deserialize)]
struct ConfigV2 {
    name: String,
    #[serde(default)]
    description: String,
    #[serde(default = "default_version")]
    version: u32,
}

fn default_version() -> u32 {
    2
}

// Or use explicit versioning
#[derive(Serialize, Deserialize)]
#[serde(tag = "version")]
enum VersionedConfig {
    #[serde(rename = "1")]
    V1 { name: String },
    #[serde(rename = "2")]
    V2 { name: String, description: String },
}

fn main() {
    // V1 JSON can deserialize into V2 with defaults
    let v1_json = r#"{"name": "test"}"#;
    let config: ConfigV2 = serde_json::from_str(v1_json).unwrap();
    println!("{:?}", config.version); // 2 (default)

    // Explicit versioning
    let v1 = r#"{"version": "1", "name": "test"}"#;
    let v2 = r#"{"version": "2", "name": "test", "description": "A test config"}"#;

    let config1: VersionedConfig = serde_json::from_str(v1).unwrap();
    let config2: VersionedConfig = serde_json::from_str(v2).unwrap();
}
```

### Test Serialization Round-Trips

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Data {
    value: i32,
    name: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_roundtrip() {
        let original = Data {
            value: 42,
            name: "test".to_string(),
        };

        let json = serde_json::to_string(&original).unwrap();
        let deserialized: Data = serde_json::from_str(&json).unwrap();

        assert_eq!(original, deserialized);
    }

    #[test]
    fn test_deserialize_from_example() {
        let json = r#"{"value": 42, "name": "test"}"#;
        let data: Data = serde_json::from_str(json).unwrap();

        assert_eq!(data.value, 42);
        assert_eq!(data.name, "test");
    }

    #[test]
    fn test_serialize_format() {
        let data = Data {
            value: 42,
            name: "test".to_string(),
        };

        let json = serde_json::to_string(&data).unwrap();

        // Verify the exact format if needed for API compatibility
        assert!(json.contains(r#""value":42"#));
        assert!(json.contains(r#""name":"test""#));
    }
}
```

## Conclusion

Serde is an essential part of the Rust ecosystem, providing powerful and flexible serialization capabilities. Its key strengths include:

- **Zero-cost abstractions**: Compile-time code generation for optimal performance
- **Format independence**: Write once, serialize to any format
- **Extensive customization**: Attributes and custom implementations for any use case
- **Strong type safety**: Leverage Rust's type system for safe data handling
- **Rich ecosystem**: Support for dozens of data formats

### Key Takeaways

1. Use derive macros for standard serialization needs
2. Leverage serde attributes (`#[serde(...)]`) for customization
3. Choose the appropriate data format for your use case
4. Use `serde_json::Value` for dynamic JSON handling
5. Implement custom serializers only when necessary
6. Test serialization round-trips to ensure compatibility
7. Consider performance implications for large-scale applications
8. Document your serialization format for API consumers

Serde's design philosophy of separating data structures from data formats makes it incredibly versatile. Whether you are building web APIs, configuration systems, or data processing pipelines, Serde provides the tools you need for robust data serialization in Rust.
