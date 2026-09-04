---
title: WebAssembly Introduction and Practice
description: Learn WebAssembly technology and its applications in web development
track: javascript
section: browser
difficulty: advanced
tags:
  - WebAssembly
  - WASM
  - Rust
  - performance
status: imported
origin: old/src/content/docs/frontend/webassembly.en.md
divergence: 0.203
issues: []
legacy:
  category: Frontend
  subcategory: Advanced
  order: 33
  lastUpdated: 2026-01-07
---

WebAssembly (Wasm) is a binary instruction format designed for stack-based virtual machines. It enables near-native performance for web applications and opens the door to running code written in languages like C, C++, Rust, and Go directly in browsers. We cover WebAssembly from fundamental concepts to practical implementation.

## What is WebAssembly?

WebAssembly is a low-level, assembly-like language with a compact binary format that runs with near-native performance. It's designed to complement JavaScript, not replace it, providing a compilation target for languages like C, C++, and Rust.

### Key Characteristics

1. **Binary Format**: Wasm uses a compact binary format that is fast to decode and execute
2. **Portable**: Runs on any platform that supports WebAssembly (browsers, Node.js, standalone runtimes)
3. **Secure**: Executes in a sandboxed environment with memory safety guarantees
4. **Fast**: Near-native execution speed with predictable performance
5. **Language Agnostic**: Can be compiled from multiple source languages

### WebAssembly vs JavaScript

| Aspect | JavaScript | WebAssembly |
|--------|------------|-------------|
| Format | Text-based | Binary |
| Parsing | JIT compilation | Pre-compiled |
| Type System | Dynamic | Static |
| Performance | Good with JIT | Near-native |
| Use Case | General web dev | CPU-intensive tasks |
| Memory | Garbage collected | Manual/linear |

```javascript
// JavaScript: Interpreted and JIT-compiled
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// WebAssembly: Pre-compiled binary
// (Compiled from Rust, C, or other languages)
// Executes at near-native speed
```

## Use Cases for WebAssembly

WebAssembly excels in scenarios requiring high performance or leveraging existing native codebases.

### Ideal Use Cases

**1. CPU-Intensive Computations**

```javascript
// Image processing example
const imageModule = await WebAssembly.instantiateStreaming(
  fetch('image-processor.wasm')
);

// Process image data with near-native speed
const processedData = imageModule.instance.exports.applyGaussianBlur(
  imageData,
  width,
  height,
  radius
);
```

**2. Gaming and Graphics**

- Game engines (Unity, Unreal Engine compile to Wasm)
- 3D rendering and physics simulations
- Real-time graphics processing

**3. Audio/Video Processing**

```javascript
// Audio processing with WebAssembly
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.wasmModule = null;
  }

  async loadWasm() {
    const response = await fetch('audio-effects.wasm');
    const wasmBytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBytes);
    this.wasmModule = instance.exports;
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    const output = outputs[0][0];

    if (this.wasmModule && input) {
      // Apply DSP effects using WebAssembly
      this.wasmModule.processAudio(input, output, input.length);
    }

    return true;
  }
}
```

**4. Cryptography and Security**

```javascript
// Cryptographic operations
async function hashPassword(password) {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch('argon2.wasm')
  );

  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Use WebAssembly for CPU-intensive password hashing
  return instance.exports.argon2Hash(passwordBytes, salt, iterations);
}
```

**5. Scientific Computing**

- Data analysis and statistics
- Machine learning inference
- Numerical simulations

**6. Porting Native Libraries**

```javascript
// Using SQLite compiled to WebAssembly
import initSqlJs from 'sql.js';

async function createDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  const db = new SQL.Database();
  db.run(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
    INSERT INTO users VALUES (1, 'Alice');
  `);

  return db;
}
```

## Compiling to WebAssembly

### Compiling from Rust

Rust is one of the best languages for WebAssembly development due to its excellent tooling and zero-cost abstractions.

**Setting Up the Environment**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install wasm-pack for easy bundling
cargo install wasm-pack
```

**Creating a Rust WebAssembly Project**

```bash
# Create new library project
cargo new --lib wasm-example
cd wasm-example
```

**Cargo.toml Configuration**

```toml
[package]
name = "wasm-example"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"

[profile.release]
opt-level = "s"
lto = true
```

**Rust Code (src/lib.rs)**

```rust
use wasm_bindgen::prelude::*;

// Export function to JavaScript
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2)
    }
}

// Iterative version for better performance
#[wasm_bindgen]
pub fn fibonacci_iterative(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }

    let mut prev = 0u64;
    let mut curr = 1u64;

    for _ in 2..=n {
        let next = prev + curr;
        prev = curr;
        curr = next;
    }

    curr
}

// String manipulation example
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

// Working with complex data structures
#[wasm_bindgen]
pub struct Point {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Point {
        Point { x, y }
    }

    pub fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f64 {
        self.x
    }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.y
    }
}
```

**Building the Project**

```bash
# Build with wasm-pack
wasm-pack build --target web

# Or for bundler integration
wasm-pack build --target bundler
```

### Compiling from C/C++

Emscripten is the primary toolchain for compiling C/C++ to WebAssembly.

**Setting Up Emscripten**

```bash
# Clone Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate latest version
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

**C Example**

```c
// math_utils.c
#include <emscripten/emscripten.h>
#include <math.h>

// Export function to JavaScript
EMSCRIPTEN_KEEPALIVE
double calculate_distance(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return sqrt(dx * dx + dy * dy);
}

EMSCRIPTEN_KEEPALIVE
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Array processing example
EMSCRIPTEN_KEEPALIVE
void multiply_array(float* arr, int length, float multiplier) {
    for (int i = 0; i < length; i++) {
        arr[i] *= multiplier;
    }
}
```

**Compiling with Emscripten**

```bash
# Basic compilation
emcc math_utils.c -o math_utils.js \
    -s EXPORTED_FUNCTIONS='["_calculate_distance", "_factorial", "_multiply_array"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s MODULARIZE=1 \
    -O3

# For standalone Wasm (no JavaScript glue)
emcc math_utils.c -o math_utils.wasm \
    --no-entry \
    -s STANDALONE_WASM \
    -O3
```

**C++ Example with Classes**

```cpp
// image_processor.cpp
#include <emscripten/bind.h>
#include <vector>
#include <cmath>

class ImageProcessor {
private:
    std::vector<uint8_t> pixels;
    int width;
    int height;

public:
    ImageProcessor(int w, int h)
        : width(w), height(h), pixels(w * h * 4) {}

    void setPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
        int idx = (y * width + x) * 4;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = a;
    }

    void applyGrayscale() {
        for (int i = 0; i < width * height; i++) {
            int idx = i * 4;
            uint8_t gray = static_cast<uint8_t>(
                0.299 * pixels[idx] +
                0.587 * pixels[idx + 1] +
                0.114 * pixels[idx + 2]
            );
            pixels[idx] = gray;
            pixels[idx + 1] = gray;
            pixels[idx + 2] = gray;
        }
    }

    emscripten::val getPixels() const {
        return emscripten::val(
            emscripten::typed_memory_view(pixels.size(), pixels.data())
        );
    }
};

EMSCRIPTEN_BINDINGS(image_processor) {
    emscripten::class_<ImageProcessor>("ImageProcessor")
        .constructor<int, int>()
        .function("setPixel", &ImageProcessor::setPixel)
        .function("applyGrayscale", &ImageProcessor::applyGrayscale)
        .function("getPixels", &ImageProcessor::getPixels);
}
```

**Compiling C++ with Embind**

```bash
emcc image_processor.cpp -o image_processor.js \
    --bind \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='ImageProcessorModule' \
    -O3
```

## Loading and Instantiating Modules

### Basic Loading Methods

**Using instantiateStreaming (Recommended)**

```javascript
// Most efficient method - streams and compiles simultaneously
async function loadWasmModule() {
  const { instance, module } = await WebAssembly.instantiateStreaming(
    fetch('example.wasm'),
    {
      env: {
        // Import object - functions/values accessible from Wasm
        memory: new WebAssembly.Memory({ initial: 256 }),
        log: (value) => console.log('From Wasm:', value),
      }
    }
  );

  return instance.exports;
}
```

**Using instantiate (Fallback)**

```javascript
// Fallback for browsers that don't support streaming
async function loadWasmModuleFallback() {
  const response = await fetch('example.wasm');
  const bytes = await response.arrayBuffer();

  const { instance, module } = await WebAssembly.instantiate(
    bytes,
    {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
      }
    }
  );

  return instance.exports;
}
```

**Using compile and instantiate Separately**

```javascript
// Useful when you need to instantiate the same module multiple times
async function loadAndCacheModule() {
  const response = await fetch('example.wasm');
  const bytes = await response.arrayBuffer();

  // Compile once
  const module = await WebAssembly.compile(bytes);

  // Cache for later use
  return {
    module,
    createInstance: (imports) => WebAssembly.instantiate(module, imports)
  };
}

// Usage
const { module, createInstance } = await loadAndCacheModule();

const instance1 = await createInstance({ env: { /* imports */ } });
const instance2 = await createInstance({ env: { /* different imports */ } });
```

### Loading with wasm-pack (Rust)

```javascript
// Using ES modules generated by wasm-pack
import init, { fibonacci, greet, Point } from './pkg/wasm_example.js';

async function main() {
  // Initialize the WebAssembly module
  await init();

  // Use exported functions
  console.log(fibonacci(10)); // 55
  console.log(greet('World')); // "Hello, World!"

  // Use exported classes
  const p1 = new Point(0, 0);
  const p2 = new Point(3, 4);
  console.log(p1.distance(p2)); // 5
}

main();
```

### Loading with Emscripten

```javascript
// Loading Emscripten-generated module
import createModule from './math_utils.js';

async function main() {
  const Module = await createModule();

  // Using cwrap for type-safe function calls
  const calculateDistance = Module.cwrap(
    'calculate_distance',
    'number',        // return type
    ['number', 'number', 'number', 'number']  // argument types
  );

  const distance = calculateDistance(0, 0, 3, 4);
  console.log(distance); // 5

  // Using ccall for one-off calls
  const result = Module.ccall(
    'factorial',
    'number',
    ['number'],
    [5]
  );
  console.log(result); // 120
}

main();
```

## JavaScript Interop

### Calling WebAssembly from JavaScript

**Basic Function Calls**

```javascript
// Direct function calls from exports
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('math.wasm')
);

const add = instance.exports.add;
const multiply = instance.exports.multiply;

console.log(add(5, 3));      // 8
console.log(multiply(4, 7)); // 28
```

**Passing Strings (with wasm-bindgen)**

```javascript
import init, { process_string } from './pkg/string_processor.js';

await init();

// wasm-bindgen handles string encoding/decoding automatically
const result = process_string("Hello, WebAssembly!");
console.log(result);
```

**Manual String Passing**

```javascript
// For low-level WebAssembly without wasm-bindgen
const memory = new WebAssembly.Memory({ initial: 1 });
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('string.wasm'),
  { env: { memory } }
);

function passStringToWasm(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str + '\0'); // null-terminated

  const ptr = instance.exports.allocate(bytes.length);
  const view = new Uint8Array(memory.buffer, ptr, bytes.length);
  view.set(bytes);

  return ptr;
}

function getStringFromWasm(ptr) {
  const view = new Uint8Array(memory.buffer);
  let end = ptr;
  while (view[end] !== 0) end++;

  const decoder = new TextDecoder();
  return decoder.decode(view.slice(ptr, end));
}

// Usage
const inputPtr = passStringToWasm("Hello");
const resultPtr = instance.exports.process_string(inputPtr);
const result = getStringFromWasm(resultPtr);
```

### Calling JavaScript from WebAssembly

**Importing JavaScript Functions**

```javascript
// Define JavaScript functions to import
const imports = {
  env: {
    // Console logging
    consoleLog: (ptr, len) => {
      const bytes = new Uint8Array(memory.buffer, ptr, len);
      const str = new TextDecoder().decode(bytes);
      console.log(str);
    },

    // Get current timestamp
    getCurrentTime: () => Date.now(),

    // DOM manipulation (use safe methods)
    setElementText: (elementIdPtr, textPtr) => {
      const elementId = getString(elementIdPtr);
      const text = getString(textPtr);
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = text;
      }
    },

    // Fetch API wrapper
    fetchData: async (urlPtr, callbackPtr) => {
      const url = getString(urlPtr);
      const response = await fetch(url);
      const data = await response.json();
      // Call back into Wasm with the result
      instance.exports.handleFetchResult(callbackPtr, data);
    }
  }
};

const { instance } = await WebAssembly.instantiateStreaming(
  fetch('app.wasm'),
  imports
);
```

**With wasm-bindgen (Rust)**

```rust
use wasm_bindgen::prelude::*;

// Import JavaScript functions
#[wasm_bindgen]
extern "C" {
    // Import console.log
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // Import alert
    fn alert(s: &str);

    // Import custom JavaScript function
    #[wasm_bindgen(js_namespace = window)]
    fn customFunction(x: i32) -> i32;
}

// Use imported functions
#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
}

#[wasm_bindgen]
pub fn show_alert(message: &str) {
    alert(message);
}
```

**Web APIs Access (with web-sys)**

```rust
use wasm_bindgen::prelude::*;
use web_sys::{Document, Element, Window};

#[wasm_bindgen]
pub fn manipulate_dom() -> Result<(), JsValue> {
    // Get window and document
    let window = web_sys::window().expect("no global window");
    let document = window.document().expect("no document");

    // Create and append element
    let element = document.create_element("div")?;
    element.set_text_content(Some("Created from WebAssembly!"));
    element.set_attribute("class", "wasm-element")?;

    let body = document.body().expect("no body");
    body.append_child(&element)?;

    Ok(())
}

#[wasm_bindgen]
pub fn add_event_listener() -> Result<(), JsValue> {
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();

    let button = document.get_element_by_id("my-button").unwrap();

    // Create closure for event handler
    let closure = Closure::wrap(Box::new(move |_event: web_sys::MouseEvent| {
        web_sys::console::log_1(&"Button clicked!".into());
    }) as Box<dyn FnMut(_)>);

    button.add_event_listener_with_callback(
        "click",
        closure.as_ref().unchecked_ref()
    )?;

    // Keep closure alive
    closure.forget();

    Ok(())
}
```

## Memory Management

WebAssembly uses a linear memory model - a contiguous, byte-addressable range of memory.

### Understanding Linear Memory

```javascript
// Create memory with 1 page (64KB)
const memory = new WebAssembly.Memory({
  initial: 1,    // 1 page = 64KB
  maximum: 100,  // Maximum 100 pages
  shared: false  // Not shared between threads
});

// Access memory as different typed arrays
const uint8View = new Uint8Array(memory.buffer);
const int32View = new Int32Array(memory.buffer);
const float64View = new Float64Array(memory.buffer);

// Write data
uint8View[0] = 255;
int32View[1] = 42; // Note: offset is in elements, not bytes

// Pass memory to WebAssembly module
const imports = {
  env: { memory }
};
```

### Memory Allocation Patterns

**Simple Bump Allocator (Rust)**

```rust
use std::alloc::{alloc, dealloc, Layout};
use wasm_bindgen::prelude::*;

static mut HEAP_OFFSET: usize = 0;

#[wasm_bindgen]
pub fn allocate(size: usize) -> *mut u8 {
    unsafe {
        let layout = Layout::from_size_align(size, 1).unwrap();
        alloc(layout)
    }
}

#[wasm_bindgen]
pub fn deallocate(ptr: *mut u8, size: usize) {
    unsafe {
        let layout = Layout::from_size_align(size, 1).unwrap();
        dealloc(ptr, layout);
    }
}
```

**Working with Typed Arrays**

```javascript
async function processArrayInWasm() {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch('array_processor.wasm')
  );

  const memory = instance.exports.memory;
  const allocate = instance.exports.allocate;
  const processArray = instance.exports.process_array;
  const deallocate = instance.exports.deallocate;

  // Input data
  const inputData = new Float32Array([1.0, 2.0, 3.0, 4.0, 5.0]);
  const byteLength = inputData.length * 4; // Float32 = 4 bytes

  // Allocate memory in Wasm
  const inputPtr = allocate(byteLength);

  // Copy data to Wasm memory
  const inputView = new Float32Array(
    memory.buffer,
    inputPtr,
    inputData.length
  );
  inputView.set(inputData);

  // Process in Wasm
  const outputPtr = processArray(inputPtr, inputData.length);

  // Read results
  const outputView = new Float32Array(
    memory.buffer,
    outputPtr,
    inputData.length
  );
  const results = Array.from(outputView);

  // Free memory
  deallocate(inputPtr, byteLength);
  deallocate(outputPtr, byteLength);

  return results;
}
```

### Sharing Data Between JavaScript and WebAssembly

```javascript
// Efficient data sharing using memory views
class WasmDataBridge {
  constructor(wasmInstance) {
    this.memory = wasmInstance.exports.memory;
    this.allocate = wasmInstance.exports.allocate;
    this.deallocate = wasmInstance.exports.deallocate;
  }

  // Write a JavaScript array to Wasm memory
  writeFloat32Array(data) {
    const byteLength = data.length * 4;
    const ptr = this.allocate(byteLength);

    const view = new Float32Array(this.memory.buffer, ptr, data.length);
    view.set(data);

    return { ptr, length: data.length, byteLength };
  }

  // Read a Float32Array from Wasm memory
  readFloat32Array(ptr, length) {
    const view = new Float32Array(this.memory.buffer, ptr, length);
    return new Float32Array(view); // Copy to prevent issues if memory grows
  }

  // Write a string to Wasm memory
  writeString(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const ptr = this.allocate(bytes.length + 1); // +1 for null terminator

    const view = new Uint8Array(this.memory.buffer, ptr, bytes.length + 1);
    view.set(bytes);
    view[bytes.length] = 0; // Null terminator

    return { ptr, length: bytes.length };
  }

  // Read a null-terminated string from Wasm memory
  readString(ptr) {
    const view = new Uint8Array(this.memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;

    const decoder = new TextDecoder();
    return decoder.decode(view.slice(ptr, end));
  }

  // Free allocated memory
  free(ptr, byteLength) {
    this.deallocate(ptr, byteLength);
  }
}
```

### Handling Memory Growth

```javascript
// Monitor and handle memory growth
const memory = new WebAssembly.Memory({ initial: 1, maximum: 100 });

// Store initial buffer reference
let memoryBuffer = memory.buffer;

// Check if memory has grown and update views
function ensureMemoryViews() {
  if (memoryBuffer !== memory.buffer) {
    memoryBuffer = memory.buffer;
    // Recreate all typed array views
    uint8View = new Uint8Array(memoryBuffer);
    int32View = new Int32Array(memoryBuffer);
    // ... recreate other views
    console.log('Memory grew to', memory.buffer.byteLength, 'bytes');
  }
}

// Grow memory programmatically
function growMemoryIfNeeded(requiredBytes) {
  const currentBytes = memory.buffer.byteLength;
  if (requiredBytes > currentBytes) {
    const pagesNeeded = Math.ceil((requiredBytes - currentBytes) / 65536);
    memory.grow(pagesNeeded);
    ensureMemoryViews();
  }
}
```

## Practical Examples

### Example 1: Image Processing

**Rust Implementation**

```rust
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub fn apply_grayscale(data: Clamped<Vec<u8>>, width: u32, height: u32) -> Clamped<Vec<u8>> {
    let mut result = data.0;

    for i in (0..result.len()).step_by(4) {
        let r = result[i] as f32;
        let g = result[i + 1] as f32;
        let b = result[i + 2] as f32;

        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        result[i] = gray;
        result[i + 1] = gray;
        result[i + 2] = gray;
        // Alpha channel remains unchanged
    }

    Clamped(result)
}

#[wasm_bindgen]
pub fn apply_sepia(data: Clamped<Vec<u8>>, width: u32, height: u32) -> Clamped<Vec<u8>> {
    let mut result = data.0;

    for i in (0..result.len()).step_by(4) {
        let r = result[i] as f32;
        let g = result[i + 1] as f32;
        let b = result[i + 2] as f32;

        let new_r = (0.393 * r + 0.769 * g + 0.189 * b).min(255.0) as u8;
        let new_g = (0.349 * r + 0.686 * g + 0.168 * b).min(255.0) as u8;
        let new_b = (0.272 * r + 0.534 * g + 0.131 * b).min(255.0) as u8;

        result[i] = new_r;
        result[i + 1] = new_g;
        result[i + 2] = new_b;
    }

    Clamped(result)
}

#[wasm_bindgen]
pub fn adjust_brightness(
    data: Clamped<Vec<u8>>,
    width: u32,
    height: u32,
    factor: f32
) -> Clamped<Vec<u8>> {
    let mut result = data.0;

    for i in (0..result.len()).step_by(4) {
        result[i] = ((result[i] as f32 * factor).min(255.0).max(0.0)) as u8;
        result[i + 1] = ((result[i + 1] as f32 * factor).min(255.0).max(0.0)) as u8;
        result[i + 2] = ((result[i + 2] as f32 * factor).min(255.0).max(0.0)) as u8;
    }

    Clamped(result)
}
```

**JavaScript Integration**

```javascript
import init, { apply_grayscale, apply_sepia, adjust_brightness } from './pkg/image_processor.js';

class WasmImageProcessor {
  constructor() {
    this.initialized = false;
  }

  async init() {
    await init();
    this.initialized = true;
  }

  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('WasmImageProcessor not initialized. Call init() first.');
    }
  }

  processCanvas(canvas, effect, options = {}) {
    this.ensureInitialized();

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = new Uint8ClampedArray(imageData.data);

    let result;
    switch (effect) {
      case 'grayscale':
        result = apply_grayscale(data, canvas.width, canvas.height);
        break;
      case 'sepia':
        result = apply_sepia(data, canvas.width, canvas.height);
        break;
      case 'brightness':
        result = adjust_brightness(
          data,
          canvas.width,
          canvas.height,
          options.factor || 1.2
        );
        break;
      default:
        throw new Error(`Unknown effect: ${effect}`);
    }

    imageData.data.set(result);
    ctx.putImageData(imageData, 0, 0);
  }
}

// Usage
const processor = new WasmImageProcessor();
await processor.init();

const canvas = document.getElementById('image-canvas');
processor.processCanvas(canvas, 'sepia');
```

### Example 2: Markdown Parser

**Rust Implementation**

```rust
use wasm_bindgen::prelude::*;
use pulldown_cmark::{Parser, Options, html};

#[wasm_bindgen]
pub fn parse_markdown(input: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(input, options);

    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    html_output
}

#[wasm_bindgen]
pub fn get_headings(input: &str) -> js_sys::Array {
    use pulldown_cmark::{Event, Tag};

    let parser = Parser::new(input);
    let headings = js_sys::Array::new();

    let mut in_heading = false;
    let mut current_heading = String::new();
    let mut current_level = 0u32;

    for event in parser {
        match event {
            Event::Start(Tag::Heading(level, _, _)) => {
                in_heading = true;
                current_level = level as u32;
                current_heading.clear();
            }
            Event::End(Tag::Heading(_, _, _)) => {
                in_heading = false;
                let obj = js_sys::Object::new();
                js_sys::Reflect::set(&obj, &"level".into(), &current_level.into()).unwrap();
                js_sys::Reflect::set(&obj, &"text".into(), &current_heading.clone().into()).unwrap();
                headings.push(&obj);
            }
            Event::Text(text) if in_heading => {
                current_heading.push_str(&text);
            }
            _ => {}
        }
    }

    headings
}
```

**JavaScript Integration**

```javascript
import init, { parse_markdown, get_headings } from './pkg/markdown_parser.js';

class MarkdownEditor {
  constructor(inputElement, previewElement, tocElement) {
    this.input = inputElement;
    this.preview = previewElement;
    this.toc = tocElement;
    this.initialized = false;
  }

  async init() {
    await init();
    this.initialized = true;
    this.setupEventListeners();
  }

  setupEventListeners() {
    let debounceTimer;
    this.input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.render(), 150);
    });
  }

  render() {
    if (!this.initialized) return;

    const markdown = this.input.value;

    // Parse markdown to HTML using WebAssembly
    const htmlContent = parse_markdown(markdown);

    // Use a sanitization library like DOMPurify before rendering HTML
    // import DOMPurify from 'dompurify';
    // this.preview.replaceChildren();
    // const sanitized = DOMPurify.sanitize(htmlContent);
    // this.preview.insertAdjacentHTML('beforeend', sanitized);

    // Or use a shadow DOM / iframe sandbox for rendering untrusted content
    this.renderSanitizedContent(htmlContent);

    // Extract headings for table of contents
    const headings = get_headings(markdown);
    this.renderToc(headings);
  }

  renderSanitizedContent(htmlContent) {
    // Clear existing content safely
    while (this.preview.firstChild) {
      this.preview.removeChild(this.preview.firstChild);
    }

    // Create a template and sanitize content
    // In production, use DOMPurify or similar library
    const template = document.createElement('template');
    // Note: In production, sanitize htmlContent with DOMPurify first
    template.innerHTML = htmlContent;
    this.preview.appendChild(template.content.cloneNode(true));
  }

  renderToc(headings) {
    // Clear existing content safely
    while (this.toc.firstChild) {
      this.toc.removeChild(this.toc.firstChild);
    }

    const ul = document.createElement('ul');

    headings.forEach(heading => {
      const li = document.createElement('li');
      li.style.marginLeft = `${(heading.level - 1) * 16}px`;
      li.textContent = heading.text;
      ul.appendChild(li);
    });

    this.toc.appendChild(ul);
  }
}

// Usage
const editor = new MarkdownEditor(
  document.getElementById('markdown-input'),
  document.getElementById('preview'),
  document.getElementById('toc')
);
await editor.init();
```

### Example 3: Physics Simulation

**Rust Implementation**

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Particle {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    radius: f64,
    mass: f64,
}

#[wasm_bindgen]
impl Particle {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, radius: f64) -> Particle {
        Particle {
            x,
            y,
            vx: 0.0,
            vy: 0.0,
            radius,
            mass: radius * radius,
        }
    }

    pub fn update(&mut self, dt: f64, gravity: f64, bounds_width: f64, bounds_height: f64) {
        // Apply gravity
        self.vy += gravity * dt;

        // Update position
        self.x += self.vx * dt;
        self.y += self.vy * dt;

        // Bounce off walls
        if self.x - self.radius < 0.0 {
            self.x = self.radius;
            self.vx = -self.vx * 0.8;
        }
        if self.x + self.radius > bounds_width {
            self.x = bounds_width - self.radius;
            self.vx = -self.vx * 0.8;
        }
        if self.y - self.radius < 0.0 {
            self.y = self.radius;
            self.vy = -self.vy * 0.8;
        }
        if self.y + self.radius > bounds_height {
            self.y = bounds_height - self.radius;
            self.vy = -self.vy * 0.8;
        }
    }

    // Getters
    pub fn x(&self) -> f64 { self.x }
    pub fn y(&self) -> f64 { self.y }
    pub fn radius(&self) -> f64 { self.radius }
}

#[wasm_bindgen]
pub struct ParticleSystem {
    particles: Vec<Particle>,
    width: f64,
    height: f64,
    gravity: f64,
}

#[wasm_bindgen]
impl ParticleSystem {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f64, height: f64) -> ParticleSystem {
        ParticleSystem {
            particles: Vec::new(),
            width,
            height,
            gravity: 500.0,
        }
    }

    pub fn add_particle(&mut self, x: f64, y: f64, radius: f64) {
        self.particles.push(Particle::new(x, y, radius));
    }

    pub fn update(&mut self, dt: f64) {
        // Update all particles
        for particle in &mut self.particles {
            particle.update(dt, self.gravity, self.width, self.height);
        }

        // Check collisions between particles
        self.resolve_collisions();
    }

    fn resolve_collisions(&mut self) {
        let len = self.particles.len();
        for i in 0..len {
            for j in (i + 1)..len {
                let dx = self.particles[j].x - self.particles[i].x;
                let dy = self.particles[j].y - self.particles[i].y;
                let dist = (dx * dx + dy * dy).sqrt();
                let min_dist = self.particles[i].radius + self.particles[j].radius;

                if dist < min_dist && dist > 0.0 {
                    // Collision detected - separate and bounce
                    let nx = dx / dist;
                    let ny = dy / dist;
                    let overlap = min_dist - dist;

                    // Separate particles
                    let total_mass = self.particles[i].mass + self.particles[j].mass;
                    let ratio_i = self.particles[j].mass / total_mass;
                    let ratio_j = self.particles[i].mass / total_mass;

                    self.particles[i].x -= nx * overlap * ratio_i;
                    self.particles[i].y -= ny * overlap * ratio_i;
                    self.particles[j].x += nx * overlap * ratio_j;
                    self.particles[j].y += ny * overlap * ratio_j;

                    // Elastic collision response
                    let rel_vx = self.particles[i].vx - self.particles[j].vx;
                    let rel_vy = self.particles[i].vy - self.particles[j].vy;
                    let rel_vel_along_normal = rel_vx * nx + rel_vy * ny;

                    if rel_vel_along_normal > 0.0 {
                        continue;
                    }

                    let restitution = 0.8;
                    let impulse = -(1.0 + restitution) * rel_vel_along_normal / total_mass;

                    self.particles[i].vx += impulse * self.particles[j].mass * nx;
                    self.particles[i].vy += impulse * self.particles[j].mass * ny;
                    self.particles[j].vx -= impulse * self.particles[i].mass * nx;
                    self.particles[j].vy -= impulse * self.particles[i].mass * ny;
                }
            }
        }
    }

    pub fn particle_count(&self) -> usize {
        self.particles.len()
    }

    pub fn get_particle_x(&self, index: usize) -> f64 {
        self.particles[index].x
    }

    pub fn get_particle_y(&self, index: usize) -> f64 {
        self.particles[index].y
    }

    pub fn get_particle_radius(&self, index: usize) -> f64 {
        self.particles[index].radius
    }
}
```

**JavaScript Rendering**

```javascript
import init, { ParticleSystem } from './pkg/physics.js';

class PhysicsSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.system = null;
    this.lastTime = 0;
    this.running = false;
  }

  async init() {
    await init();
    this.system = new ParticleSystem(this.canvas.width, this.canvas.height);

    // Add initial particles
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height / 2;
      const radius = 10 + Math.random() * 20;
      this.system.add_particle(x, y, radius);
    }

    // Add click handler to spawn new particles
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.system.add_particle(x, y, 10 + Math.random() * 20);
    });
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.running = false;
  }

  animate() {
    if (!this.running) return;

    const currentTime = performance.now();
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
    this.lastTime = currentTime;

    // Update physics in WebAssembly
    this.system.update(dt);

    // Render
    this.render();

    requestAnimationFrame(() => this.animate());
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const count = this.system.particle_count();
    for (let i = 0; i < count; i++) {
      const x = this.system.get_particle_x(i);
      const y = this.system.get_particle_y(i);
      const radius = this.system.get_particle_radius(i);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${(i * 137) % 360}, 70%, 60%)`;
      ctx.fill();
    }
  }
}

// Usage
const canvas = document.getElementById('physics-canvas');
const simulation = new PhysicsSimulation(canvas);
await simulation.init();
simulation.start();
```

## Performance Optimization

### Best Practices

**1. Minimize JavaScript-WebAssembly Boundary Crossings**

```javascript
// Bad: Many boundary crossings
for (let i = 0; i < 1000; i++) {
  wasmModule.processItem(items[i]);
}

// Good: Batch processing
wasmModule.processItems(items, items.length);
```

**2. Use Typed Arrays for Data Transfer**

```javascript
// Efficient: Direct memory access
const buffer = new Float32Array(wasmMemory.buffer, dataPtr, length);
buffer.set(sourceData);

// Inefficient: Individual value copies
for (let i = 0; i < length; i++) {
  wasmModule.setArrayValue(i, sourceData[i]);
}
```

**3. Avoid Unnecessary String Conversions**

```rust
// In Rust, prefer bytes when possible
#[wasm_bindgen]
pub fn process_binary_data(data: &[u8]) -> Vec<u8> {
    // Process bytes directly
    data.iter().map(|b| b.wrapping_add(1)).collect()
}
```

**4. Use SIMD When Available**

```rust
// Enable SIMD in Rust
#[cfg(target_feature = "simd128")]
use std::arch::wasm32::*;

#[wasm_bindgen]
pub fn add_vectors_simd(a: &[f32], b: &[f32]) -> Vec<f32> {
    let mut result = Vec::with_capacity(a.len());

    #[cfg(target_feature = "simd128")]
    {
        for i in (0..a.len()).step_by(4) {
            unsafe {
                let va = v128_load(a.as_ptr().add(i) as *const v128);
                let vb = v128_load(b.as_ptr().add(i) as *const v128);
                let vr = f32x4_add(va, vb);
                // Store result
                let mut temp = [0f32; 4];
                v128_store(temp.as_mut_ptr() as *mut v128, vr);
                result.extend_from_slice(&temp);
            }
        }
    }

    result
}
```

**5. Optimize Wasm Binary Size**

```toml
# Cargo.toml
[profile.release]
opt-level = "s"      # Optimize for size
lto = true           # Link-time optimization
codegen-units = 1    # Better optimization
panic = "abort"      # Smaller panic handling
```

```bash
# Use wasm-opt for further optimization
wasm-opt -Os -o optimized.wasm original.wasm
```

### Benchmarking

```javascript
// Benchmark helper
async function benchmark(name, fn, iterations = 1000) {
  // Warm-up
  for (let i = 0; i < 100; i++) {
    await fn();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const end = performance.now();

  console.log(`${name}: ${((end - start) / iterations).toFixed(4)}ms per iteration`);
}

// Compare JavaScript vs WebAssembly
await benchmark('JS Fibonacci', () => {
  fibonacciJS(40);
});

await benchmark('Wasm Fibonacci', () => {
  wasmModule.fibonacci(40);
});
```

## Debugging and Tooling

### Browser DevTools

```javascript
// Enable detailed Wasm debugging
// Chrome: Enable "WebAssembly Debugging: Enable DWARF support" in DevTools settings

// Source maps for Rust
// Add to Cargo.toml:
// [profile.dev]
// debug = true
```

### Console Logging from Wasm

```rust
use web_sys::console;

#[wasm_bindgen]
pub fn debug_function(value: i32) {
    console::log_1(&format!("Debug: value = {}", value).into());
    console::time_with_label("operation");

    // ... expensive operation

    console::time_end_with_label("operation");
}
```

### Error Handling

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn safe_divide(a: f64, b: f64) -> Result<f64, JsValue> {
    if b == 0.0 {
        Err(JsValue::from_str("Division by zero"))
    } else {
        Ok(a / b)
    }
}
```

```javascript
try {
  const result = wasmModule.safe_divide(10, 0);
} catch (error) {
  console.error('Wasm error:', error);
}
```

## Interview Key Points

### Common Interview Questions

**1. What is WebAssembly and when should you use it?**

WebAssembly is a binary instruction format that provides near-native performance in web browsers. Use it for:
- CPU-intensive computations (image/video processing, cryptography)
- Porting existing C/C++/Rust codebases to the web
- Games and real-time applications
- When JavaScript performance is insufficient

**2. How does WebAssembly interact with JavaScript?**

- JavaScript loads and instantiates Wasm modules
- Functions can be exported from Wasm and called from JS
- JS functions can be imported into Wasm
- They share linear memory for efficient data transfer
- wasm-bindgen (Rust) or Embind (C++) provide high-level bindings

**3. What are the security implications of WebAssembly?**

- Runs in a sandboxed environment
- Same-origin policy applies
- No direct access to DOM or Web APIs (must go through JavaScript)
- Memory is isolated from JavaScript heap
- Cannot access filesystem or network directly

**4. How do you handle memory in WebAssembly?**

- WebAssembly uses linear memory (contiguous byte array)
- Memory can be shared between JS and Wasm
- Manual memory management (allocate/deallocate)
- Memory can grow dynamically but not shrink
- Use TypedArrays for efficient data transfer

**5. What are the limitations of WebAssembly?**

- No direct DOM access
- No garbage collection (though Wasm GC proposal exists)
- Limited threading support (SharedArrayBuffer required)
- Binary format not human-readable
- Additional build complexity

## Further Reading

### Official Resources

- [WebAssembly Official Site](https://webassembly.org/)
- [MDN WebAssembly Guide](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [WebAssembly Specification](https://webassembly.github.io/spec/)

### Rust Resources

- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)
- [wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/)
- [wasm-pack Documentation](https://rustwasm.github.io/docs/wasm-pack/)

### C/C++ Resources

- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly C/C++ Tutorial](https://developer.mozilla.org/en-US/docs/WebAssembly/C_to_wasm)

### Tools

- [wasm-pack](https://rustwasm.github.io/wasm-pack/) - Rust to Wasm build tool
- [Emscripten](https://emscripten.org/) - C/C++ to Wasm compiler
- [wasm-opt](https://github.com/WebAssembly/binaryen) - Wasm optimizer
- [wabt](https://github.com/WebAssembly/wabt) - WebAssembly Binary Toolkit

### Community Projects

- [AssemblyScript](https://www.assemblyscript.org/) - TypeScript-like language for Wasm
- [Blazor](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor) - .NET in WebAssembly
- [Pyodide](https://pyodide.org/) - Python in WebAssembly
- [sql.js](https://github.com/sql-js/sql.js) - SQLite in WebAssembly

---

WebAssembly represents a significant evolution in web platform capabilities. While it does not replace JavaScript, it complements it by providing near-native performance for computationally intensive tasks. As the ecosystem matures with proposals like garbage collection, threads, and SIMD, WebAssembly will become even more powerful. Start experimenting with WebAssembly in your projects to gain hands-on experience with this transformative technology.
