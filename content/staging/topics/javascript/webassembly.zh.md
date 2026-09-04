---
title: WebAssembly 入门与实践
description: 了解WebAssembly技术及其在Web开发中的应用
track: javascript
section: browser
difficulty: advanced
tags:
  - WebAssembly
  - WASM
  - Rust
  - 性能优化
status: imported
origin: old/src/content/docs/frontend/webassembly.zh.md
divergence: 0.203
issues: []
legacy:
  category: Frontend
  subcategory: Advanced
  order: 33
  lastUpdated: 2026-01-07
---

WebAssembly（简称 Wasm）是一种为 Web 设计的低级字节码格式，它使得用 C、C++、Rust 等语言编写的代码能够在浏览器中以接近原生的速度运行。这项技术正在彻底改变 Web 应用的性能边界，让曾经只能在桌面端运行的复杂应用（如视频编辑器、3D 游戏、CAD 软件）得以在浏览器中流畅运行。

## 什么是 WebAssembly？

### WebAssembly 的定义

WebAssembly 是一种二进制指令格式，为基于栈的虚拟机设计。它被设计为 C/C++/Rust 等高级语言的编译目标，使这些语言编写的应用可以在 Web 上部署。

**核心特点**：

| 特性 | 说明 |
|------|------|
| 高效性 | 二进制格式紧凑，加载和执行速度快 |
| 安全性 | 在沙箱环境中运行，无法直接访问系统资源 |
| 可移植性 | 跨平台运行，不依赖特定硬件或操作系统 |
| 开放标准 | W3C 官方标准，主流浏览器均已支持 |

### WebAssembly vs JavaScript

```
JavaScript:  源代码 → 解析 → 字节码 → JIT编译 → 机器码
WebAssembly: 二进制 → 解码验证 → 编译 → 机器码
```

**性能对比**：

| 维度 | JavaScript | WebAssembly |
|------|-----------|-------------|
| 启动时间 | 需要解析和编译 | 直接解码执行 |
| 执行速度 | JIT 优化后接近原生 | 接近原生速度 |
| 内存控制 | GC 管理，开销较大 | 手动管理，可预测 |
| 适用场景 | UI 交互、DOM 操作 | 计算密集型任务 |

### WebAssembly 的工作原理

WebAssembly 模块的生命周期：

```
源代码（C/C++/Rust）
    ↓ 编译器（Emscripten/wasm-pack）
.wasm 二进制文件
    ↓ 网络传输
浏览器下载 .wasm
    ↓ WebAssembly API
解码 → 验证 → 编译 → 实例化
    ↓
JavaScript 调用 WASM 函数
```

**二进制格式示例**：

```wat
;; WebAssembly 文本格式（.wat）
(module
  ;; 定义一个函数：计算两数之和
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  ;; 导出函数供 JavaScript 调用
  (export "add" (func $add))
)
```

## WebAssembly 的应用场景

### 适合使用 WebAssembly 的场景

**计算密集型任务**：

```javascript
// 图像处理示例
// JavaScript 版本 - 较慢
function applyGrayscaleJS(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // R
    data[i + 1] = avg; // G
    data[i + 2] = avg; // B
  }
  return imageData;
}

// WebAssembly 版本 - 更快
async function applyGrayscaleWasm(imageData) {
  const wasm = await WebAssembly.instantiate(wasmModule);
  const { memory, grayscale } = wasm.instance.exports;

  // 将图像数据复制到 WASM 内存
  const wasmMemory = new Uint8ClampedArray(memory.buffer);
  wasmMemory.set(imageData.data);

  // 调用 WASM 函数处理
  grayscale(imageData.data.length);

  // 复制结果回来
  imageData.data.set(wasmMemory.slice(0, imageData.data.length));
  return imageData;
}
```

**典型应用场景**：

| 领域 | 具体应用 | 代表项目 |
|------|----------|----------|
| 游戏 | 3D 游戏引擎 | Unity WebGL、Unreal Engine |
| 多媒体 | 音视频编解码 | FFmpeg.wasm、Opus |
| 图形处理 | 图像编辑、滤镜 | Photoshop Web、Figma |
| 数据处理 | 加密、压缩 | libsodium、zlib |
| 科学计算 | 数值模拟 | AutoCAD Web |
| 编程工具 | 语言运行时 | Pyodide (Python)、Blazor (C#) |

### 不适合使用 WebAssembly 的场景

```javascript
// DOM 操作 - JavaScript 更适合
// WebAssembly 无法直接操作 DOM，需要通过 JavaScript 桥接
document.getElementById('app').textContent = 'Hello';

// 简单的 UI 交互
button.addEventListener('click', () => {
  // JavaScript 足够高效
  counter++;
  display.textContent = counter;
});
```

**注意事项**：

1. WebAssembly 不能直接访问 DOM
2. 需要与 JavaScript 互操作时有调用开销
3. 简单逻辑使用 JavaScript 可能更快（避免互操作开销）
4. 模块体积较大时会增加加载时间

## 从 Rust 编译到 WebAssembly

### 环境准备

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 添加 WebAssembly 编译目标
rustup target add wasm32-unknown-unknown

# 安装 wasm-pack（推荐工具）
cargo install wasm-pack

# 安装 wasm-bindgen-cli（可选，用于更精细控制）
cargo install wasm-bindgen-cli
```

### 创建 Rust 项目

```bash
# 创建库项目
cargo new --lib wasm-demo
cd wasm-demo
```

**Cargo.toml 配置**：

```toml
[package]
name = "wasm-demo"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = { version = "0.3", features = [
    "console",
    "Document",
    "Element",
    "HtmlElement",
    "Window",
]}

[profile.release]
opt-level = 3
lto = true
```

### 编写 Rust 代码

**src/lib.rs**：

```rust
use wasm_bindgen::prelude::*;

// 导出到 JavaScript 的函数
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 斐波那契数列计算（展示性能优势）
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0u64;
            let mut b = 1u64;
            for _ in 2..=n {
                let temp = a + b;
                a = b;
                b = temp;
            }
            b
        }
    }
}

// 图像灰度处理
#[wasm_bindgen]
pub fn grayscale(data: &mut [u8]) {
    for chunk in data.chunks_mut(4) {
        if chunk.len() == 4 {
            let avg = ((chunk[0] as u32 + chunk[1] as u32 + chunk[2] as u32) / 3) as u8;
            chunk[0] = avg;
            chunk[1] = avg;
            chunk[2] = avg;
            // chunk[3] 是 alpha 通道，保持不变
        }
    }
}

// 调用 JavaScript 的 console.log
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
}

// 使用 web-sys 操作 DOM
#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    // 获取 window 和 document
    let window = web_sys::window().expect("no global window exists");
    let document = window.document().expect("should have a document");

    // 创建元素
    let element = document.create_element("p")?;
    element.set_text_content(Some("Hello from Rust WebAssembly!"));

    // 添加到 body
    if let Some(body) = document.body() {
        body.append_child(&element)?;
    }

    Ok(())
}
```

### 编译和打包

```bash
# 使用 wasm-pack 构建
wasm-pack build --target web

# 产物在 pkg/ 目录下
ls pkg/
# wasm_demo.js      - JavaScript 绑定代码
# wasm_demo_bg.wasm - 编译后的 WASM 二进制
# wasm_demo.d.ts    - TypeScript 类型定义
# package.json      - npm 包配置
```

**不同 target 选项**：

| Target | 用途 | 导入方式 |
|--------|------|---------|
| `web` | 浏览器 ES Modules | `import init from './pkg/wasm_demo.js'` |
| `bundler` | Webpack/Rollup 等 | 同上，但需要打包器处理 |
| `nodejs` | Node.js | `require('./pkg/wasm_demo.js')` |
| `no-modules` | 传统 script 标签 | 全局变量 `wasm_bindgen` |

## 从 C/C++ 编译到 WebAssembly

### 使用 Emscripten

```bash
# 安装 Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### 编写 C 代码

**math.c**：

```c
#include <emscripten.h>
#include <math.h>

// EMSCRIPTEN_KEEPALIVE 防止函数被优化掉
EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}

EMSCRIPTEN_KEEPALIVE
double calculate_distance(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return sqrt(dx * dx + dy * dy);
}

// 处理数组
EMSCRIPTEN_KEEPALIVE
void sort_array(int* arr, int len) {
    // 简单冒泡排序
    for (int i = 0; i < len - 1; i++) {
        for (int j = 0; j < len - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

// 使用 EM_JS 直接嵌入 JavaScript
EM_JS(void, console_log, (const char* str), {
    console.log(UTF8ToString(str));
});

EMSCRIPTEN_KEEPALIVE
void log_message(const char* msg) {
    console_log(msg);
}
```

### C++ 代码示例

**image_processor.cpp**：

```cpp
#include <emscripten/bind.h>
#include <vector>
#include <cmath>

class ImageProcessor {
public:
    ImageProcessor(int width, int height)
        : width_(width), height_(height) {
        pixels_.resize(width * height * 4);
    }

    void setPixelData(const std::vector<uint8_t>& data) {
        pixels_ = data;
    }

    std::vector<uint8_t> getPixelData() const {
        return pixels_;
    }

    void applyGrayscale() {
        for (size_t i = 0; i < pixels_.size(); i += 4) {
            uint8_t avg = static_cast<uint8_t>(
                (pixels_[i] + pixels_[i + 1] + pixels_[i + 2]) / 3
            );
            pixels_[i] = avg;
            pixels_[i + 1] = avg;
            pixels_[i + 2] = avg;
        }
    }

    void applySepia() {
        for (size_t i = 0; i < pixels_.size(); i += 4) {
            uint8_t r = pixels_[i];
            uint8_t g = pixels_[i + 1];
            uint8_t b = pixels_[i + 2];

            pixels_[i] = std::min(255, static_cast<int>(r * 0.393 + g * 0.769 + b * 0.189));
            pixels_[i + 1] = std::min(255, static_cast<int>(r * 0.349 + g * 0.686 + b * 0.168));
            pixels_[i + 2] = std::min(255, static_cast<int>(r * 0.272 + g * 0.534 + b * 0.131));
        }
    }

    void applyBlur(int radius) {
        std::vector<uint8_t> result = pixels_;

        for (int y = radius; y < height_ - radius; y++) {
            for (int x = radius; x < width_ - radius; x++) {
                int sumR = 0, sumG = 0, sumB = 0;
                int count = 0;

                for (int dy = -radius; dy <= radius; dy++) {
                    for (int dx = -radius; dx <= radius; dx++) {
                        int idx = ((y + dy) * width_ + (x + dx)) * 4;
                        sumR += pixels_[idx];
                        sumG += pixels_[idx + 1];
                        sumB += pixels_[idx + 2];
                        count++;
                    }
                }

                int idx = (y * width_ + x) * 4;
                result[idx] = sumR / count;
                result[idx + 1] = sumG / count;
                result[idx + 2] = sumB / count;
            }
        }

        pixels_ = result;
    }

private:
    int width_;
    int height_;
    std::vector<uint8_t> pixels_;
};

// Embind 绑定
EMSCRIPTEN_BINDINGS(image_processor) {
    emscripten::class_<ImageProcessor>("ImageProcessor")
        .constructor<int, int>()
        .function("setPixelData", &ImageProcessor::setPixelData)
        .function("getPixelData", &ImageProcessor::getPixelData)
        .function("applyGrayscale", &ImageProcessor::applyGrayscale)
        .function("applySepia", &ImageProcessor::applySepia)
        .function("applyBlur", &ImageProcessor::applyBlur);

    emscripten::register_vector<uint8_t>("Uint8Vector");
}
```

### 编译命令

```bash
# 编译 C 代码
emcc math.c -o math.js \
    -s EXPORTED_FUNCTIONS='["_add", "_calculate_distance", "_sort_array", "_log_message"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "setValue", "getValue"]' \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -O3

# 编译 C++ 代码（使用 Embind）
em++ image_processor.cpp -o image_processor.js \
    --bind \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -O3

# 常用编译选项说明
# -O3: 最高优化级别
# -s MODULARIZE=1: 生成模块化代码
# -s EXPORT_ES6=1: 导出 ES6 模块
# -s ALLOW_MEMORY_GROWTH=1: 允许动态增长内存
# --bind: 启用 Embind
```

## 加载和实例化 WebAssembly 模块

### 基础加载方式

```javascript
// 方式一：fetch + instantiateStreaming（推荐）
async function loadWasmStreaming() {
  const response = await fetch('module.wasm');
  const { instance, module } = await WebAssembly.instantiateStreaming(
    response,
    importObject
  );
  return instance;
}

// 方式二：fetch + instantiate
async function loadWasm() {
  const response = await fetch('module.wasm');
  const bytes = await response.arrayBuffer();
  const { instance, module } = await WebAssembly.instantiate(bytes, importObject);
  return instance;
}

// 方式三：compile + instantiate（分步控制）
async function loadWasmCompile() {
  const response = await fetch('module.wasm');
  const bytes = await response.arrayBuffer();

  // 先编译
  const module = await WebAssembly.compile(bytes);

  // 可以缓存 module，多次实例化
  const instance1 = await WebAssembly.instantiate(module, importObject);
  const instance2 = await WebAssembly.instantiate(module, importObject);

  return { module, instances: [instance1, instance2] };
}
```

### Import Object 配置

```javascript
// 定义导入对象 - 向 WASM 提供外部功能
const importObject = {
  // 环境函数
  env: {
    // 内存（如果 WASM 不自己创建）
    memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),

    // 表格（用于间接函数调用）
    table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),

    // 提供给 WASM 调用的 JavaScript 函数
    log: (ptr, len) => {
      const bytes = new Uint8Array(memory.buffer, ptr, len);
      console.log(new TextDecoder().decode(bytes));
    },

    // 错误处理
    abort: (msg, file, line, column) => {
      console.error(`Abort: ${msg} at ${file}:${line}:${column}`);
    },
  },

  // JavaScript 标准函数
  js: {
    random: Math.random,
    now: () => performance.now(),
  },

  // Web API 封装
  dom: {
    createElement: (tagPtr, tagLen) => {
      const tag = readString(tagPtr, tagLen);
      return document.createElement(tag);
    },
  },
};

async function initWasm() {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch('module.wasm'),
    importObject
  );

  // 访问导出
  const { add, memory, fibonacci } = instance.exports;

  console.log(add(1, 2)); // 3
  console.log(fibonacci(10)); // 55
}
```

### 使用 wasm-pack 生成的模块

```javascript
// 使用 wasm-pack --target web 生成的模块
import init, { add, fibonacci, grayscale, greet } from './pkg/wasm_demo.js';

async function main() {
  // 初始化 WASM 模块
  await init();

  // 直接调用导出的函数
  console.log('add(1, 2) =', add(1, 2));
  console.log('fibonacci(40) =', fibonacci(40));

  // 调用带字符串参数的函数
  greet('World');

  // 处理图像数据
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 直接传递 Uint8ClampedArray
  grayscale(imageData.data);

  ctx.putImageData(imageData, 0, 0);
}

main();
```

### 模块缓存策略

```javascript
// 使用 IndexedDB 缓存编译后的模块
class WasmCache {
  constructor(dbName = 'wasm-cache', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('modules', { keyPath: 'url' });
      };
    });
  }

  async getModule(url) {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['modules'], 'readonly');
      const store = transaction.objectStore('modules');
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.module);
    });
  }

  async setModule(url, module) {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['modules'], 'readwrite');
      const store = transaction.objectStore('modules');
      const request = store.put({ url, module });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// 使用缓存加载模块
const cache = new WasmCache();

async function loadCachedWasm(url) {
  // 尝试从缓存获取
  let module = await cache.getModule(url);

  if (!module) {
    // 缓存未命中，编译并缓存
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    module = await WebAssembly.compile(bytes);
    await cache.setModule(url, module);
  }

  // 实例化
  return WebAssembly.instantiate(module, importObject);
}
```

## JavaScript 与 WebAssembly 互操作

### 基本类型传递

```javascript
// WASM 只支持数值类型：i32, i64, f32, f64
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('math.wasm')
);

// 直接传递数值
const result = instance.exports.add(10, 20); // 30

// 浮点数
const distance = instance.exports.calculate_distance(0, 0, 3, 4); // 5.0
```

### 字符串传递

```javascript
// 字符串需要通过内存传递
const { memory, alloc, dealloc, greet } = instance.exports;

// JavaScript -> WASM
function passString(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  // 在 WASM 中分配内存
  const ptr = alloc(bytes.length);

  // 写入内存
  const view = new Uint8Array(memory.buffer, ptr, bytes.length);
  view.set(bytes);

  // 调用函数
  greet(ptr, bytes.length);

  // 释放内存
  dealloc(ptr, bytes.length);
}

// WASM -> JavaScript
function readString(ptr, len) {
  const view = new Uint8Array(memory.buffer, ptr, len);
  const decoder = new TextDecoder();
  return decoder.decode(view);
}

// 使用 wasm-bindgen 时会自动处理
import { greet } from './pkg/wasm_demo.js';
greet('World'); // 直接传递字符串
```

### 数组传递

```javascript
// 传递数组到 WASM
const { memory, sort_array, alloc, dealloc } = instance.exports;

function sortArrayInWasm(arr) {
  // 分配内存（i32 = 4 字节）
  const ptr = alloc(arr.length * 4);

  // 创建视图并写入数据
  const view = new Int32Array(memory.buffer, ptr, arr.length);
  view.set(arr);

  // 调用排序函数
  sort_array(ptr, arr.length);

  // 读取排序结果
  const sorted = Array.from(view);

  // 释放内存
  dealloc(ptr, arr.length * 4);

  return sorted;
}

const unsorted = [5, 2, 8, 1, 9];
const sorted = sortArrayInWasm(unsorted);
console.log(sorted); // [1, 2, 5, 8, 9]
```

### 复杂对象传递

```rust
// Rust 端（使用 serde）
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct User {
    pub name: String,
    pub age: u32,
    pub email: String,
}

#[wasm_bindgen]
pub fn process_user(user_json: &str) -> String {
    let mut user: User = serde_json::from_str(user_json).unwrap();
    user.age += 1;
    serde_json::to_string(&user).unwrap()
}

// 使用 JsValue 直接传递
#[wasm_bindgen]
pub fn process_user_direct(user: JsValue) -> JsValue {
    let mut user: User = serde_wasm_bindgen::from_value(user).unwrap();
    user.age += 1;
    serde_wasm_bindgen::to_value(&user).unwrap()
}
```

```javascript
// JavaScript 端
import { process_user, process_user_direct } from './pkg/wasm_demo.js';

// 方式一：JSON 序列化
const user = { name: 'Alice', age: 25, email: 'alice@example.com' };
const result1 = JSON.parse(process_user(JSON.stringify(user)));

// 方式二：直接传递对象（需要 serde-wasm-bindgen）
const result2 = process_user_direct(user);
```

### 回调函数

```rust
// Rust 端
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn async_task(callback: &js_sys::Function) {
    // 模拟耗时操作
    let result = js_sys::JsString::from("Task completed!");

    // 调用 JavaScript 回调
    let this = JsValue::NULL;
    callback.call1(&this, &result).unwrap();
}

#[wasm_bindgen]
pub fn map_array(arr: &js_sys::Array, callback: &js_sys::Function) -> js_sys::Array {
    let result = js_sys::Array::new();
    let this = JsValue::NULL;

    for i in 0..arr.length() {
        let item = arr.get(i);
        let mapped = callback.call1(&this, &item).unwrap();
        result.push(&mapped);
    }

    result
}
```

```javascript
// JavaScript 端
import { async_task, map_array } from './pkg/wasm_demo.js';

// 传递回调
async_task((result) => {
  console.log(result); // "Task completed!"
});

// 类似 Array.map
const numbers = [1, 2, 3, 4, 5];
const doubled = map_array(numbers, (x) => x * 2);
console.log(Array.from(doubled)); // [2, 4, 6, 8, 10]
```

## 内存管理

### WebAssembly 内存模型

```javascript
// 创建 WebAssembly 内存
const memory = new WebAssembly.Memory({
  initial: 1,    // 初始页数（1页 = 64KB）
  maximum: 100,  // 最大页数
  shared: false  // 是否共享（用于多线程）
});

// 内存是一个 ArrayBuffer
console.log(memory.buffer.byteLength); // 65536 (64KB)

// 增长内存
memory.grow(10); // 增长 10 页
console.log(memory.buffer.byteLength); // 720896 (704KB)

// 注意：grow() 后 buffer 引用会改变
// 需要重新创建视图
```

### 直接操作内存

```javascript
const { memory, process_data } = instance.exports;

// 创建不同类型的视图
const uint8View = new Uint8Array(memory.buffer);
const int32View = new Int32Array(memory.buffer);
const float64View = new Float64Array(memory.buffer);

// 写入数据
uint8View[0] = 255;
int32View[0] = 42;        // 注意：覆盖了 uint8View[0-3]
float64View[0] = 3.14159; // 注意：覆盖了 uint8View[0-7]

// 从 WASM 导出的内存指针读取数据
function readInt32Array(ptr, length) {
  // ptr 是字节偏移，需要除以 4 得到 i32 索引
  const startIndex = ptr / 4;
  const view = new Int32Array(memory.buffer);
  return Array.from(view.slice(startIndex, startIndex + length));
}
```

### 内存分配策略

```rust
// Rust 端 - 手动内存管理
use std::alloc::{alloc, dealloc, Layout};
use wasm_bindgen::prelude::*;

/// 分配指定大小的内存，返回指针
#[wasm_bindgen]
pub fn wasm_alloc(size: usize) -> *mut u8 {
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { alloc(layout) }
}

/// 释放内存
#[wasm_bindgen]
pub fn wasm_dealloc(ptr: *mut u8, size: usize) {
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { dealloc(ptr, layout) }
}

/// 获取内存起始地址（用于调试）
#[wasm_bindgen]
pub fn get_memory_base() -> *const u8 {
    unsafe {
        std::ptr::null::<u8>()
    }
}
```

```javascript
// JavaScript 端 - 使用分配器
import init, { wasm_alloc, wasm_dealloc, memory } from './pkg/wasm_demo.js';

class WasmMemoryManager {
  constructor(wasmMemory) {
    this.memory = wasmMemory;
    this.allocations = new Map();
  }

  alloc(size) {
    const ptr = wasm_alloc(size);
    this.allocations.set(ptr, size);
    return ptr;
  }

  dealloc(ptr) {
    const size = this.allocations.get(ptr);
    if (size !== undefined) {
      wasm_dealloc(ptr, size);
      this.allocations.delete(ptr);
    }
  }

  // 自动管理：使用后自动释放
  withBuffer(size, callback) {
    const ptr = this.alloc(size);
    try {
      const view = new Uint8Array(this.memory.buffer, ptr, size);
      return callback(view, ptr);
    } finally {
      this.dealloc(ptr);
    }
  }

  // 释放所有分配的内存
  cleanup() {
    for (const [ptr, size] of this.allocations) {
      wasm_dealloc(ptr, size);
    }
    this.allocations.clear();
  }
}

// 使用
await init();
const manager = new WasmMemoryManager(memory);

manager.withBuffer(1024, (buffer, ptr) => {
  // 使用 buffer...
  buffer.fill(0);
  // 函数返回后自动释放
});
```

### 共享内存与多线程

```javascript
// 创建共享内存（需要浏览器支持 SharedArrayBuffer）
const sharedMemory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true
});

// 主线程
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('parallel.wasm'),
  { env: { memory: sharedMemory } }
);

// Worker 线程也可以访问同一内存
const worker = new Worker('worker.js');
worker.postMessage({ memory: sharedMemory });

// worker.js
self.onmessage = async (e) => {
  const { memory } = e.data;

  const { instance } = await WebAssembly.instantiateStreaming(
    fetch('parallel.wasm'),
    { env: { memory } }
  );

  // 在共享内存上执行计算
  instance.exports.process_chunk(0, 1000);

  // 使用 Atomics 进行同步
  const view = new Int32Array(memory.buffer);
  Atomics.add(view, 0, 1); // 原子加操作
  Atomics.notify(view, 0); // 通知等待的线程
};
```

## 实战案例

### 高性能图像处理

```rust
// src/lib.rs - 图像处理库
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub struct ImageFilter {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ImageFilter {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            width,
            height,
            data: vec![0; (width * height * 4) as usize],
        }
    }

    pub fn set_image_data(&mut self, data: Clamped<Vec<u8>>) {
        self.data = data.0;
    }

    pub fn get_image_data(&self) -> Clamped<Vec<u8>> {
        Clamped(self.data.clone())
    }

    pub fn brightness(&mut self, factor: f32) {
        for i in (0..self.data.len()).step_by(4) {
            self.data[i] = (self.data[i] as f32 * factor).min(255.0) as u8;
            self.data[i + 1] = (self.data[i + 1] as f32 * factor).min(255.0) as u8;
            self.data[i + 2] = (self.data[i + 2] as f32 * factor).min(255.0) as u8;
        }
    }

    pub fn contrast(&mut self, factor: f32) {
        for i in (0..self.data.len()).step_by(4) {
            for j in 0..3 {
                let val = self.data[i + j] as f32;
                let adjusted = ((val / 255.0 - 0.5) * factor + 0.5) * 255.0;
                self.data[i + j] = adjusted.max(0.0).min(255.0) as u8;
            }
        }
    }

    pub fn invert(&mut self) {
        for i in (0..self.data.len()).step_by(4) {
            self.data[i] = 255 - self.data[i];
            self.data[i + 1] = 255 - self.data[i + 1];
            self.data[i + 2] = 255 - self.data[i + 2];
        }
    }

    pub fn gaussian_blur(&mut self, radius: i32) {
        let kernel = self.create_gaussian_kernel(radius);
        let kernel_size = (radius * 2 + 1) as usize;
        let mut result = self.data.clone();

        for y in radius..(self.height as i32 - radius) {
            for x in radius..(self.width as i32 - radius) {
                let mut r = 0.0f32;
                let mut g = 0.0f32;
                let mut b = 0.0f32;

                for ky in 0..kernel_size {
                    for kx in 0..kernel_size {
                        let px = x + kx as i32 - radius;
                        let py = y + ky as i32 - radius;
                        let idx = ((py * self.width as i32 + px) * 4) as usize;
                        let weight = kernel[ky * kernel_size + kx];

                        r += self.data[idx] as f32 * weight;
                        g += self.data[idx + 1] as f32 * weight;
                        b += self.data[idx + 2] as f32 * weight;
                    }
                }

                let idx = ((y * self.width as i32 + x) * 4) as usize;
                result[idx] = r as u8;
                result[idx + 1] = g as u8;
                result[idx + 2] = b as u8;
            }
        }

        self.data = result;
    }

    fn create_gaussian_kernel(&self, radius: i32) -> Vec<f32> {
        let size = (radius * 2 + 1) as usize;
        let mut kernel = vec![0.0f32; size * size];
        let sigma = radius as f32 / 2.0;
        let mut sum = 0.0f32;

        for y in 0..size {
            for x in 0..size {
                let dx = x as f32 - radius as f32;
                let dy = y as f32 - radius as f32;
                let value = (-((dx * dx + dy * dy) / (2.0 * sigma * sigma))).exp();
                kernel[y * size + x] = value;
                sum += value;
            }
        }

        // 归一化
        for v in &mut kernel {
            *v /= sum;
        }

        kernel
    }
}
```

```javascript
// index.js - 使用图像滤镜
import init, { ImageFilter } from './pkg/image_filter.js';

let filter = null;
let originalImageData = null;

async function initialize() {
  await init();
}

function loadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  const originalCanvas = document.getElementById('originalCanvas');
  const processedCanvas = document.getElementById('processedCanvas');

  img.onload = () => {
    // 设置画布大小
    originalCanvas.width = processedCanvas.width = img.width;
    originalCanvas.height = processedCanvas.height = img.height;

    // 绘制原始图像
    const originalCtx = originalCanvas.getContext('2d');
    originalCtx.drawImage(img, 0, 0);
    originalImageData = originalCtx.getImageData(0, 0, img.width, img.height);

    // 初始化 WASM 滤镜
    filter = new ImageFilter(img.width, img.height);
    filter.set_image_data(new Uint8ClampedArray(originalImageData.data));

    // 显示处理后的图像
    updateProcessed();
  };
  img.src = URL.createObjectURL(file);
}

function updateProcessed() {
  const processedCanvas = document.getElementById('processedCanvas');
  const processedCtx = processedCanvas.getContext('2d');
  const processedData = filter.get_image_data();
  const imageData = new ImageData(
    new Uint8ClampedArray(processedData),
    processedCanvas.width,
    processedCanvas.height
  );
  processedCtx.putImageData(imageData, 0, 0);
}

function applyBrightness() {
  if (!filter) return;
  filter.brightness(1.2);
  updateProcessed();
}

function applyBlur() {
  if (!filter) return;
  console.time('WASM Blur');
  filter.gaussian_blur(3);
  console.timeEnd('WASM Blur');
  updateProcessed();
}

function reset() {
  if (!filter || !originalImageData) return;
  filter.set_image_data(new Uint8ClampedArray(originalImageData.data));
  updateProcessed();
}

document.getElementById('imageInput').addEventListener('change', loadImage);
initialize();
```

### Markdown 解析器

```rust
// 使用 pulldown-cmark 解析 Markdown
use wasm_bindgen::prelude::*;
use pulldown_cmark::{Parser, Options, html};

#[wasm_bindgen]
pub fn parse_markdown(input: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    html_output
}

#[wasm_bindgen]
pub fn extract_headings(input: &str) -> JsValue {
    use pulldown_cmark::{Event, Tag, HeadingLevel};

    let parser = Parser::new(input);
    let mut headings = Vec::new();
    let mut current_level = 0u8;
    let mut current_text = String::new();
    let mut in_heading = false;

    for event in parser {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                in_heading = true;
                current_level = match level {
                    HeadingLevel::H1 => 1,
                    HeadingLevel::H2 => 2,
                    HeadingLevel::H3 => 3,
                    HeadingLevel::H4 => 4,
                    HeadingLevel::H5 => 5,
                    HeadingLevel::H6 => 6,
                };
            }
            Event::Text(text) if in_heading => {
                current_text.push_str(&text);
            }
            Event::End(Tag::Heading { .. }) => {
                headings.push((current_level, current_text.clone()));
                current_text.clear();
                in_heading = false;
            }
            _ => {}
        }
    }

    serde_wasm_bindgen::to_value(&headings).unwrap()
}
```

```javascript
// 使用 Markdown 解析器
import init, { parse_markdown, extract_headings } from './pkg/markdown_parser.js';

await init();

const markdown = `
# Welcome to WebAssembly

This is a **powerful** technology!

## Features

- Fast execution
- Cross-platform
- Safe sandboxed environment

## Code Example

\`\`\`rust
fn main() {
    println!("Hello, WASM!");
}
\`\`\`

| Feature | Support |
|---------|---------|
| Tables | Yes |
| Code | Yes |
`;

// 解析为 HTML
const html = parse_markdown(markdown);
document.getElementById('preview').textContent = html;

// 提取标题生成目录
const headings = extract_headings(markdown);
console.log(headings);
// [[1, "Welcome to WebAssembly"], [2, "Features"], [2, "Code Example"]]
```

### 性能对比测试

```javascript
// 性能对比：JavaScript vs WebAssembly
import init, { fibonacci as wasmFib } from './pkg/wasm_demo.js';

// JavaScript 实现
function jsFibonacci(n) {
  if (n <= 1) return BigInt(n);
  let a = BigInt(0);
  let b = BigInt(1);
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

// 矩阵乘法 JavaScript 实现
function jsMatrixMultiply(a, b, n) {
  const result = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += a[i * n + k] * b[k * n + j];
      }
      result[i * n + j] = sum;
    }
  }
  return result;
}

async function runBenchmark() {
  await init();

  console.log('=== Fibonacci Benchmark ===');

  // 预热
  for (let i = 0; i < 100; i++) {
    jsFibonacci(40);
    wasmFib(40);
  }

  // JavaScript 测试
  console.time('JavaScript Fibonacci');
  for (let i = 0; i < 1000; i++) {
    jsFibonacci(80);
  }
  console.timeEnd('JavaScript Fibonacci');

  // WebAssembly 测试
  console.time('WebAssembly Fibonacci');
  for (let i = 0; i < 1000; i++) {
    wasmFib(80);
  }
  console.timeEnd('WebAssembly Fibonacci');

  console.log('\n=== Matrix Multiplication Benchmark ===');

  const n = 200;
  const matrixA = new Float64Array(n * n).map(() => Math.random());
  const matrixB = new Float64Array(n * n).map(() => Math.random());

  console.time('JavaScript Matrix');
  jsMatrixMultiply(matrixA, matrixB, n);
  console.timeEnd('JavaScript Matrix');
}

runBenchmark();
```

## 调试与优化

### 调试技巧

```rust
// 1. 使用 console.log 调试
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn debug_function(x: i32) -> i32 {
    console_log!("Input: {}", x);
    let result = x * 2;
    console_log!("Result: {}", result);
    result
}
```

```bash
# 编译时包含调试信息
wasm-pack build --dev  # 开发模式，包含调试符号

# 使用 wasm2wat 查看文本格式
wasm2wat module.wasm -o module.wat
```

**Chrome DevTools 调试**：

1. 打开 DevTools -> Sources
2. 在左侧面板找到 .wasm 文件
3. 如果有 source map，可以直接调试源代码
4. 设置断点，查看调用栈

### 性能优化

```rust
// Cargo.toml 优化配置
[profile.release]
opt-level = 3          // 最高优化级别
lto = true             // Link Time Optimization
codegen-units = 1      // 单代码生成单元，更好优化
panic = "abort"        // 不使用 panic 展开
strip = true           // 移除调试符号
```

```bash
# 使用 wasm-opt 进一步优化
wasm-opt -O3 input.wasm -o output.wasm

# 压缩 WASM 文件
gzip -9 module.wasm
# 配置服务器返回 Content-Encoding: gzip
```

**减小体积的技巧**：

```rust
// 1. 使用 wee_alloc 替代默认分配器
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// 2. 避免 panic（使用 Result）
#[wasm_bindgen]
pub fn safe_divide(a: i32, b: i32) -> Result<i32, JsValue> {
    if b == 0 {
        Err(JsValue::from_str("Division by zero"))
    } else {
        Ok(a / b)
    }
}

// 3. 条件编译排除调试代码
#[cfg(debug_assertions)]
fn debug_print(msg: &str) {
    log(msg);
}

#[cfg(not(debug_assertions))]
fn debug_print(_msg: &str) {}
```

### 常见问题排查

```javascript
// 问题 1：内存不足
// 解决：增加初始内存或启用自动增长
const memory = new WebAssembly.Memory({
  initial: 256,  // 16MB
  maximum: 16384 // 1GB
});

// 或在编译时设置
// emcc -s INITIAL_MEMORY=16MB -s ALLOW_MEMORY_GROWTH=1

// 问题 2：函数未导出
// 检查导出列表
console.log(Object.keys(instance.exports));

// 问题 3：类型不匹配
// WASM 只支持 i32, i64, f32, f64
// 确保传递正确的类型
const result = instance.exports.add(
  Math.trunc(a), // 确保是整数
  Math.trunc(b)
);

// 问题 4：跨域问题
// WASM 需要正确的 MIME 类型
// 服务器配置：Content-Type: application/wasm
```

## 未来发展

### WASI（WebAssembly System Interface）

```rust
// WASI 允许 WASM 访问系统资源
use std::fs;
use std::io::Read;

fn main() {
    // 在 WASI 运行时中可以访问文件系统
    let mut file = fs::File::open("input.txt").unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    println!("File contents: {}", contents);
}

// 编译
// rustup target add wasm32-wasi
// cargo build --target wasm32-wasi
```

```bash
# 使用 wasmtime 运行
wasmtime --dir=. my_program.wasm
```

### 组件模型（Component Model）

```wit
// 使用 WIT（WebAssembly Interface Type）定义接口
package example:calculator;

interface operations {
    add: func(a: s32, b: s32) -> s32;
    multiply: func(a: s32, b: s32) -> s32;
}

world calculator {
    export operations;
}
```

### 即将到来的特性

| 特性 | 状态 | 描述 |
|------|------|------|
| Garbage Collection | Phase 4 | 原生 GC 支持 |
| Exception Handling | Phase 3 | 异常处理机制 |
| Threads | Phase 2 | 多线程支持 |
| SIMD | Shipped | 单指令多数据 |
| Tail Call | Phase 4 | 尾调用优化 |

## 总结

WebAssembly 是 Web 平台的重要补充，它不是要取代 JavaScript，而是与之协作：

1. **性能关键路径**使用 WebAssembly
2. **UI 和 DOM 操作**继续使用 JavaScript
3. **选择合适的工具**：Rust 的 wasm-bindgen、C/C++ 的 Emscripten
4. **注意互操作开销**：批量操作优于频繁调用
5. **合理管理内存**：了解 WASM 的内存模型

随着 WASI、组件模型等新特性的发展，WebAssembly 将在更多场景发挥作用，包括服务端、边缘计算和插件系统等领域。

## 参考资源

- [WebAssembly 官方网站](https://webassembly.org/)
- [MDN WebAssembly 文档](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
- [Rust and WebAssembly](https://rustwasm.github.io/docs/book/)
- [Emscripten 文档](https://emscripten.org/docs/)
- [wasm-bindgen 指南](https://rustwasm.github.io/docs/wasm-bindgen/)
