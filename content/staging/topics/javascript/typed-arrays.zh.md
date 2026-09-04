---
title: JavaScript TypedArrays 与 ArrayBuffer 二进制数据处理
description: 深入理解 JavaScript 的二进制数据处理机制，包括 ArrayBuffer、TypedArrays、DataView 的原理、使用方式以及性能优化技巧。
track: javascript
section: core
difficulty: advanced
tags:
  - TypedArrays
  - ArrayBuffer
  - DataView
  - 二进制
  - 性能
  - WebAssembly
status: imported
origin: old/src/content/docs/javascript/typed-arrays.zh.md
divergence: 0.215
issues:
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---


## 概念解释

### 什么是 ArrayBuffer 和 TypedArrays？

**ArrayBuffer** 是 JavaScript 中用于表示原始二进制数据的对象。它分配一个固定长度的内存块，但不能直接读写。必须通过视图对象（如 TypedArray 或 DataView）来访问其中的数据。

**TypedArrays** 是一组类型化数组构造函数，提供了各种整数和浮点数类型的视图。包括：
- 整数类型：Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array
- 大整数类型：BigInt64Array, BigUint64Array
- 浮点类型：Float32Array, Float64Array

### 历史背景

二进制数据处理在 JavaScript 中长期缺失。随着以下场景的出现，该特性变得必要：
1. **WebGL** - 3D 图形编程需要高效的顶点和纹理数据传输
2. **Web Audio API** - 音频处理需要直接操作音频样本
3. **WebAssembly** - 与 WASM 模块共享内存需要二进制接口
4. **File API** - 处理文件和 Blob 数据
5. **网络编程** - 二进制协议通信（如 WebSocket）

### 解决的问题

传统 JavaScript 字符串和数组处理二进制数据存在以下问题：
- **内存浪费** - 每个数字占用独立对象，内存开销大
- **性能低下** - 缺乏类型信息，无法进行 SIMD 优化
- **互操作性差** - 难以与 C/C++ 库、WebAssembly 共享数据
- **无法直接操作字节** - 编码/解码过程复杂

---

## 核心原理

### 内存模型

```
┌─────────────────────────────────────────────────┐
│  ArrayBuffer (原始二进制内存)                    │
│  固定大小的字节序列，无法直接访问                │
└─────────────────────────────────────────────────┘
           ↑              ↑              ↑
           │              │              │
      ┌────┴────┐   ┌─────┴─────┐  ┌────┴────┐
      │TypedArray│   │ DataView  │  │ Blob    │
      │(类型视图)│   │ (通用视图) │  │(文件I/O)│
      └─────────┘   └───────────┘  └─────────┘
```

### ArrayBuffer 的特性

1. **固定大小** - 创建后无法改变大小
2. **对齐要求** - 某些类型访问时需要内存对齐
3. **可转移** - 可通过 Worker.postMessage 转移所有权
4. **垃圾回收** - 当所有视图都被回收时，缓冲区被释放

### TypedArray 的视图机制

每个 TypedArray 包含：
- **字节偏移** (byteOffset) - 在 ArrayBuffer 中的起始位置
- **元素数量** (length) - 视图包含的元素个数
- **字节长度** (byteLength) - 占用的字节数
- **字节顺序** (Endianness) - 多字节数的存储顺序

### 字节顺序（Endianness）

```javascript
// 大端序 (Big-endian) - 高字节在前
// 小端序 (Little-endian) - 低字节在前

// 例：0x12345678
// 大端：[0x12, 0x34, 0x56, 0x78]
// 小端：[0x78, 0x56, 0x34, 0x12]

// JavaScript 中的字节顺序取决于平台
const buffer = new ArrayBuffer(4);
const view = new Uint32Array(buffer);
view[0] = 0x12345678;
const bytes = new Uint8Array(buffer);
console.log(bytes); // 取决于系统：[0x78, 0x56, 0x34, 0x12] 或 [0x12, 0x34, 0x56, 0x78]
```

---

## 核心要点

### 类型选择

| 类型 | 字节数 | 范围 | 用途 |
|-----|--------|------|------|
| Int8Array | 1 | -128 到 127 | 有符号字节 |
| Uint8Array | 1 | 0 到 255 | 无符号字节、ASCII |
| Int16Array | 2 | -32768 到 32767 | 有符号短整数 |
| Uint16Array | 2 | 0 到 65535 | Unicode 字符 |
| Int32Array | 4 | -2^31 到 2^31-1 | 有符号整数 |
| Uint32Array | 4 | 0 到 2^32-1 | 无符号整数 |
| BigInt64Array | 8 | -2^63 到 2^63-1 | 大整数 |
| BigUint64Array | 8 | 0 到 2^64-1 | 大整数 |
| Float32Array | 4 | ±1.4×10^-45 到 ±3.4×10^38 | 单精度浮点 |
| Float64Array | 8 | ±5×10^-324 到 ±1.8×10^308 | 双精度浮点 |

### 内存生命周期

- 创建 ArrayBuffer → 分配内存
- 创建视图 → 添加引用计数
- 使用数据 → 读写操作
- 视图回收 → 引用计数减少
- 缓冲区回收 → 释放内存（所有引用消失时）

### 关键限制

- **固定大小** - 不能动态扩展，需要用 TypedArray.slice() 或创建新缓冲区
- **连续内存** - 无法保证内存的连续性（引擎实现），但通常是连续的
- **同步操作** - TypedArray 操作是同步的，无法异步处理大数据
- **浏览器兼容性** - 某些操作（如 SharedArrayBuffer）有安全限制

---

## 代码示例

### 创建和基本操作

```javascript
// 1. 创建 ArrayBuffer
const buffer = new ArrayBuffer(16); // 16 字节的缓冲区
console.log(buffer.byteLength); // 16

// 2. 创建 TypedArray 视图
const int32Array = new Int32Array(buffer);
const uint8Array = new Uint8Array(buffer);

// 设置值
int32Array[0] = 0x12345678;
int32Array[1] = 100;

// 读取值
console.log(int32Array[0]); // 305419896
console.log(int32Array[1]); // 100

// 3. 通过 Uint8Array 查看字节
console.log(Array.from(uint8Array));
// [0x78, 0x56, 0x34, 0x12, 0x64, 0x00, 0x00, 0x00, ...]
```

### DataView - 高级数据操作

```javascript
// DataView 提供更灵活的字节级访问，支持字节顺序控制

const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);

// 写入不同类型的数据
view.setInt8(0, -50); // 位置0，有符号字节
view.setUint8(1, 200); // 位置1，无符号字节
view.setInt16(2, -1000, true); // 位置2，16位整数，小端序
view.setFloat32(4, 3.14, true); // 位置4，32位浮点，小端序

// 读取数据
console.log(view.getInt8(0)); // -50
console.log(view.getUint8(1)); // 200
console.log(view.getInt16(2, true)); // -1000
console.log(view.getFloat32(4, true)); // 3.1400001049041748

// 检查字节顺序
const test = new Uint32Array(new ArrayBuffer(4));
test[0] = 0x12345678;
const testBytes = new Uint8Array(test.buffer);
const isLittleEndian = testBytes[0] === 0x78;
console.log('系统字节顺序:', isLittleEndian ? '小端' : '大端');
```

### 处理图片和音频数据

```javascript
// 处理图像像素数据（RGBA）
class ImageProcessor {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // RGBA: 4 字节/像素
    this.buffer = new ArrayBuffer(width * height * 4);
    this.pixels = new Uint8Array(this.buffer);
  }

  setPixel(x, y, r, g, b, a = 255) {
    const index = (y * this.width + x) * 4;
    this.pixels[index] = r;
    this.pixels[index + 1] = g;
    this.pixels[index + 2] = b;
    this.pixels[index + 3] = a;
  }

  getPixel(x, y) {
    const index = (y * this.width + x) * 4;
    return {
      r: this.pixels[index],
      g: this.pixels[index + 1],
      b: this.pixels[index + 2],
      a: this.pixels[index + 3]
    };
  }

  // 灰度化处理
  toGrayscale() {
    for (let i = 0; i < this.width * this.height; i++) {
      const r = this.pixels[i * 4];
      const g = this.pixels[i * 4 + 1];
      const b = this.pixels[i * 4 + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      this.pixels[i * 4] = gray;
      this.pixels[i * 4 + 1] = gray;
      this.pixels[i * 4 + 2] = gray;
    }
  }
}

// 使用示例
const image = new ImageProcessor(2, 2);
image.setPixel(0, 0, 255, 0, 0, 255); // 红色
image.setPixel(1, 0, 0, 255, 0, 255); // 绿色
image.toGrayscale();
```

### 网络数据序列化

```javascript
// 网络数据包结构：[类型:1字节][ID:4字节][温度:4字节浮点][湿度:4字节浮点]
class SensorData {
  static TYPE_TEMPERATURE = 1;
  static TYPE_HUMIDITY = 2;

  constructor() {
    this.buffer = new ArrayBuffer(13); // 1+4+4+4 字节
    this.view = new DataView(this.buffer);
  }

  encode(type, id, value1, value2) {
    this.view.setUint8(0, type);
    this.view.setUint32(1, id, true); // 小端序
    this.view.setFloat32(5, value1, true);
    this.view.setFloat32(9, value2, true);
    return this.buffer;
  }

  static decode(buffer) {
    const view = new DataView(buffer);
    return {
      type: view.getUint8(0),
      id: view.getUint32(1, true),
      value1: view.getFloat32(5, true),
      value2: view.getFloat32(9, true)
    };
  }
}

// 发送数据到服务器
const sensorData = new SensorData();
const encoded = sensorData.encode(
  SensorData.TYPE_TEMPERATURE,
  12345,
  22.5,
  65.3
);

// 接收并解码
const decoded = SensorData.decode(encoded);
console.log(decoded);
// { type: 1, id: 12345, value1: 22.5, value2: 65.3 }
```

### 与 WebAssembly 共享内存

```javascript
// WebAssembly 模块（简化版）可以直接访问 JavaScript 的 ArrayBuffer
class WasmInterop {
  constructor() {
    // 创建共享内存
    this.buffer = new ArrayBuffer(4096);
    this.data = new Float32Array(this.buffer);
    this.wasmMemory = null;
  }

  async initWasm(wasmCode) {
    // 导入内存供 WASM 使用
    const wasmMemory = new WebAssembly.Memory({
      initial: 256,
      maximum: 512
    });

    const importObject = {
      env: {
        memory: wasmMemory
      }
    };

    const wasmModule = await WebAssembly.instantiate(wasmCode, importObject);
    this.wasmMemory = new Float32Array(wasmMemory.buffer);
    return wasmModule;
  }

  // 从 JS 传入数据到 WASM
  setWasmData(offset, values) {
    this.wasmMemory.set(values, offset);
  }

  // 从 WASM 读取结果
  getWasmData(offset, length) {
    return Array.from(this.wasmMemory.slice(offset, offset + length));
  }
}
```

### 字节缓冲区工具类

```javascript
// 通用的字节缓冲区读写工具
class ByteBuffer {
  constructor(size = 256) {
    this.buffer = new ArrayBuffer(size);
    this.view = new DataView(this.buffer);
    this.writePos = 0;
    this.readPos = 0;
  }

  // 写操作
  writeInt8(value) {
    this.view.setInt8(this.writePos, value);
    this.writePos += 1;
  }

  writeUint16(value, littleEndian = true) {
    this.view.setUint16(this.writePos, value, littleEndian);
    this.writePos += 2;
  }

  writeFloat32(value, littleEndian = true) {
    this.view.setFloat32(this.writePos, value, littleEndian);
    this.writePos += 4;
  }

  writeString(str, encoding = 'utf-8') {
    const encoded = new TextEncoder().encode(str);
    for (let i = 0; i < encoded.length; i++) {
      this.view.setUint8(this.writePos + i, encoded[i]);
    }
    this.writePos += encoded.length;
    return this;
  }

  // 读操作
  readInt8() {
    const value = this.view.getInt8(this.readPos);
    this.readPos += 1;
    return value;
  }

  readUint16(littleEndian = true) {
    const value = this.view.getUint16(this.readPos, littleEndian);
    this.readPos += 2;
    return value;
  }

  readFloat32(littleEndian = true) {
    const value = this.view.getFloat32(this.readPos, littleEndian);
    this.readPos += 4;
    return value;
  }

  readString(length, encoding = 'utf-8') {
    const bytes = new Uint8Array(this.buffer, this.readPos, length);
    const value = new TextDecoder(encoding).decode(bytes);
    this.readPos += length;
    return value;
  }

  // 辅助方法
  reset() {
    this.writePos = 0;
    this.readPos = 0;
  }

  getBuffer() {
    return this.buffer.slice(0, this.writePos);
  }

  getBytes() {
    return new Uint8Array(this.buffer, 0, this.writePos);
  }
}

// 使用示例
const buffer = new ByteBuffer();
buffer.writeInt8(42);
buffer.writeUint16(1000);
buffer.writeFloat32(3.14);
buffer.writeString("Hello");

buffer.reset();
buffer.readPos = 0;
console.log(buffer.readInt8()); // 42
console.log(buffer.readUint16()); // 1000
console.log(buffer.readFloat32()); // 3.1400001
console.log(buffer.readString(5)); // "Hello"
```

---

## 最佳实践

### 类型选择策略

```javascript
// 好的实践：根据数据范围选择合适的类型
function storeTemperature(buffer, offset, celsius) {
  // 温度通常在 -50 到 50°C，用 Int8Array 足够
  const temps = new Int8Array(buffer);
  temps[offset] = Math.round(celsius);
}

// 不好的实践：过度分配
function storeTemperatureBad(buffer, offset, celsius) {
  // 使用 Float64Array 浪费内存
  const temps = new Float64Array(buffer);
  temps[offset] = celsius;
}
```

### 内存管理

```javascript
// 好的实践：及时释放大型缓冲区
class DataProcessor {
  processLargeFile(file) {
    let buffer = new ArrayBuffer(file.size);
    let data = new Uint8Array(buffer);

    // 处理数据...
    const result = this.analyze(data);

    // 显式清理
    buffer = null;
    data = null;

    return result;
  }
}

// 不好的实践：保留不必要的引用
class DataProcessorBad {
  processLargeFile(file) {
    this.buffer = new ArrayBuffer(file.size); // 长期持有
    this.data = new Uint8Array(this.buffer);

    return this.analyze(this.data);
    // 即使不再使用，内存也不会释放
  }
}
```

### 字节顺序处理

```javascript
// 好的实践：显式指定字节顺序
function encodeNetworkPacket(data) {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);

  // 网络字节顺序通常是大端，但明确指定
  view.setUint32(0, data.messageId, false); // false = 大端
  view.setUint32(4, data.timestamp, false);
  view.setUint32(8, data.checksum, false);

  return buffer;
}

// 不好的实践：依赖默认字节顺序
function encodeNetworkPacketBad(data) {
  // 在不同平台上行为可能不同
  const ints = new Uint32Array(3);
  ints[0] = data.messageId;
  // ...
}
```

### 性能优化

```javascript
// 好的实践：批量操作
function processPixelsBatch(imageData) {
  const pixels = new Uint8ClampedArray(imageData.data);

  // 使用循环展开减少迭代次数
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // 计算灰度值
    const gray = (r + g + b) / 3;
    pixels[i] = gray;
    pixels[i + 1] = gray;
    pixels[i + 2] = gray;
    // pixels[i + 3] 是 Alpha，不修改
  }
}

// 不好的实践：频繁创建新视图
function processPixelsBad(imageData) {
  for (let i = 0; i < imageData.data.length; i += 4) {
    // 频繁创建视图，增加开销
    const view = new Uint8ClampedArray(imageData.data);
    // ...
  }
}
```

### 安全的数据转换

```javascript
// 好的实践：验证数据范围
function safeInt8Convert(value) {
  // 检查范围 [-128, 127]
  if (value < -128 || value > 127) {
    throw new RangeError(`Value ${value} out of Int8 range`);
  }
  return Math.floor(value);
}

// 使用策略：对于不确定的数据来源，验证范围
function deserializeData(buffer) {
  const view = new DataView(buffer);

  const age = view.getInt8(0);
  if (age < 0 || age > 150) {
    throw new Error('Invalid age value');
  }

  return { age };
}
```

---

## 常见陷阱

### 类型溢出

```javascript
// 陷阱：整数溢出无声失败
const array = new Uint8Array(1);
array[0] = 256; // 溢出！
console.log(array[0]); // 0，不是 256

array[0] = -1; // 有符号值赋给无符号数组
console.log(array[0]); // 255，自动转换

// 解决方案：检查范围
function safeSetUint8(array, index, value) {
  if (value < 0 || value > 255) {
    throw new RangeError(`Value ${value} out of Uint8 range`);
  }
  array[index] = value;
}
```

### 字节对齐问题

```javascript
// 陷阱：某些架构要求对齐访问
const buffer = new ArrayBuffer(5);
const view = new DataView(buffer);

// 某些操作可能对齐要求不同
view.setUint32(0, 0x12345678); // 偏移 0，通常 OK
view.setUint32(1, 0xABCDEF00); // 偏移 1，某些平台可能有问题

// 解决方案：确保对齐
function setAlignedUint32(view, offset, value) {
  if (offset % 4 !== 0) {
    // 使用 setUint8 逐字节写入
    const bytes = new Uint32Array([value]);
    const byteView = new Uint8Array(bytes.buffer);
    for (let i = 0; i < 4; i++) {
      view.setUint8(offset + i, byteView[i]);
    }
  } else {
    view.setUint32(offset, value, true);
  }
}
```

### 浮点精度问题

```javascript
// 陷阱：Float32 精度损失
const buffer = new ArrayBuffer(8);
const float32 = new Float32Array(buffer);
const float64 = new Float64Array(buffer);

float32[0] = 0.1 + 0.2;
console.log(float32[0]); // 0.30000001192092896
console.log(float32[0] === 0.3); // false

// 解决方案：对浮点数进行适当的舍入
function storeFloat32Safe(array, index, value) {
  const buffer = new ArrayBuffer(4);
  const f32 = new Float32Array(buffer);
  f32[0] = value;
  array[index] = f32[0]; // 读回来确保精度一致
}
```

### 共享视图修改问题

```javascript
// 陷阱：多个视图指向同一缓冲区
const buffer = new ArrayBuffer(8);
const int32 = new Int32Array(buffer);
const int8 = new Int8Array(buffer);

int32[0] = 0x12345678;
console.log(int8[0]); // 依赖字节顺序：0x78 或 0x12

// 修改一个视图会影响另一个
int8[0] = 0xFF;
console.log(int32[0]); // 值改变了！

// 解决方案：明确理解视图关系或使用独立的缓冲区
function createIndependentViews(size) {
  return {
    int32: new Int32Array(new ArrayBuffer(size * 4)),
    int8: new Int8Array(new ArrayBuffer(size))
  };
}
```

### 性能陷阱

```javascript
// 陷阱：频繁创建和销毁缓冲区
function processDataBadly(dataArray) {
  let result = [];

  for (let item of dataArray) {
    // 频繁分配内存
    const buffer = new ArrayBuffer(1024);
    const view = new Float32Array(buffer);

    // 处理...
    result.push(view[0]);
  }

  return result;
}

// 解决方案：复用缓冲区
function processDataWell(dataArray) {
  // 预分配一次
  const buffer = new ArrayBuffer(1024);
  const view = new Float32Array(buffer);
  let result = [];

  for (let item of dataArray) {
    // 复用同一个缓冲区
    // 写入处理...
    result.push(view[0]);
  }

  return result;
}
```

---

## 性能考量

### 内存占用对比

```javascript
// 存储 1000 个数字

// 传统方法：普通数组
const arr = new Array(1000);
for (let i = 0; i < 1000; i++) {
  arr[i] = i;
}
// 内存占用：约 8KB - 40KB（取决于引擎优化）

// 优化方法：TypedArray
const typedArr = new Int32Array(1000);
for (let i = 0; i < 1000; i++) {
  typedArr[i] = i;
}
// 内存占用：4KB（恒定）
```

### 访问速度对比

```javascript
// 性能测试
function benchmarkArrayAccess() {
  const size = 1000000;
  const regularArray = new Array(size);
  const typedArray = new Float32Array(size);

  // 初始化
  for (let i = 0; i < size; i++) {
    regularArray[i] = i * 0.5;
    typedArray[i] = i * 0.5;
  }

  // 普通数组读写
  console.time('Regular Array');
  let sum = 0;
  for (let i = 0; i < size; i++) {
    sum += regularArray[i];
  }
  console.timeEnd('Regular Array');

  // TypedArray 读写
  console.time('Typed Array');
  sum = 0;
  for (let i = 0; i < size; i++) {
    sum += typedArray[i];
  }
  console.timeEnd('Typed Array');

  // 结果：TypedArray 通常快 10-50%（取决于引擎）
}
```

### 优化建议

```javascript
// 1. 批量操作优于单个操作
// 不好
for (let i = 0; i < array.length; i++) {
  array[i] = processValue(array[i]);
}

// 更好：使用内置方法
array.forEach((val, i, arr) => {
  arr[i] = processValue(val);
});

// 2. 避免频繁类型转换
// 不好
const mixed = [1, 2.5, 'text']; // 混合类型
for (let item of mixed) {
  process(item);
}

// 好：使用同一类型
const numbers = new Float32Array([1, 2.5, 3.7]);
for (let num of numbers) {
  process(num);
}

// 3. 使用 subarray 而不是 slice
const array = new Float32Array(1000);

// 创建新缓冲区（复制数据）
const copy = array.slice(100, 200);

// 创建视图（无复制）
const view = array.subarray(100, 200);
```

---

## 实战场景

### 图像处理（Canvas）

```javascript
class CanvasImageProcessor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // 应用滤镜：图像反转
  invertColors(imageData) {
    const data = new Uint8Array(imageData.data);

    // 每 4 个字节为一个像素 (RGBA)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];       // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
      // data[i + 3] 是 Alpha，保持不变
    }

    return imageData;
  }

  // 应用高斯模糊（简化版）
  blur(imageData, radius = 2) {
    const data = new Uint8Array(imageData.data);
    const { width, height } = imageData;
    const tempData = new Uint8Array(data.length);

    // 水平模糊
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (y * width + nx) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }

        const idx = (y * width + x) * 4;
        tempData[idx] = Math.round(r / count);
        tempData[idx + 1] = Math.round(g / count);
        tempData[idx + 2] = Math.round(b / count);
      }
    }

    data.set(tempData);
    return imageData;
  }
}
```

### 音频处理

```javascript
class AudioProcessor {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
  }

  // 生成正弦波
  generateSineWave(frequency, duration) {
    const samples = Math.floor(duration * this.sampleRate);
    const buffer = new AudioBuffer({
      length: samples,
      sampleRate: this.sampleRate
    });

    const channelData = buffer.getChannelData(0);
    const amplitude = 0.3;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      channelData[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
    }

    return buffer;
  }

  // 音频效果：增益控制
  applyGain(buffer, gain) {
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      channelData[i] *= gain;
      // 防止失真
      channelData[i] = Math.max(-1, Math.min(1, channelData[i]));
    }

    return buffer;
  }

  // 计算 RMS（均方根）音量
  calculateRMS(buffer) {
    const channelData = buffer.getChannelData(0);
    let sum = 0;

    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }

    return Math.sqrt(sum / channelData.length);
  }
}
```

### 二进制文件处理

```javascript
class BinaryFileParser {
  // 解析 BMP 图像头
  parseBMPHeader(arrayBuffer) {
    const view = new DataView(arrayBuffer);

    // BMP 文件头（14 字节）
    const signature = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1)
    );

    if (signature !== 'BM') {
      throw new Error('Not a valid BMP file');
    }

    const fileSize = view.getUint32(2, true);
    const pixelDataOffset = view.getUint32(10, true);

    // DIB 头（40 字节）
    const width = view.getInt32(18, true);
    const height = view.getInt32(22, true);
    const bitsPerPixel = view.getUint16(28, true);

    return {
      signature,
      fileSize,
      pixelDataOffset,
      width,
      height,
      bitsPerPixel
    };
  }

  // 解析 ZIP 文件的中央目录
  parseZIPCentralDirectory(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const entries = [];

    // 寻找中央目录签名 (0x02014b50)
    for (let i = 0; i < arrayBuffer.byteLength - 4; i++) {
      const signature = view.getUint32(i, true);

      if (signature === 0x02014b50) {
        const versionMadeBy = view.getUint16(i + 4, true);
        const versionNeeded = view.getUint16(i + 6, true);
        const flags = view.getUint16(i + 8, true);
        const compressionMethod = view.getUint16(i + 10, true);
        const lastModTime = view.getUint16(i + 12, true);
        const lastModDate = view.getUint16(i + 14, true);
        const crc32 = view.getUint32(i + 16, true);
        const compressedSize = view.getUint32(i + 20, true);
        const uncompressedSize = view.getUint32(i + 24, true);
        const filenameLength = view.getUint16(i + 28, true);

        // 读取文件名
        const filenameBytes = new Uint8Array(
          arrayBuffer,
          i + 46,
          filenameLength
        );
        const filename = new TextDecoder().decode(filenameBytes);

        entries.push({
          filename,
          compressionMethod,
          compressedSize,
          uncompressedSize,
          crc32
        });

        // 跳过该条目
        i += 46 + filenameLength;
      }
    }

    return entries;
  }
}
```

### WebSocket 二进制协议

```javascript
class WebSocketBinaryProtocol {
  // 消息类型定义
  static MESSAGE_TYPES = {
    HEARTBEAT: 0x01,
    DATA: 0x02,
    COMMAND: 0x03,
    ERROR: 0x04
  };

  constructor(url) {
    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer';
    this.handlers = {};

    this.socket.onmessage = (event) => {
      this.handleBinaryMessage(event.data);
    };
  }

  // 编码消息
  encodeMessage(type, payload = {}) {
    // 消息格式：[类型:1字节][长度:4字节][数据]
    let dataBuffer = new ArrayBuffer(0);

    if (typeof payload === 'string') {
      const encoded = new TextEncoder().encode(payload);
      dataBuffer = encoded.buffer;
    } else if (payload instanceof ArrayBuffer) {
      dataBuffer = payload;
    }

    const messageBuffer = new ArrayBuffer(5 + dataBuffer.byteLength);
    const view = new DataView(messageBuffer);
    const data = new Uint8Array(messageBuffer);

    view.setUint8(0, type);
    view.setUint32(1, dataBuffer.byteLength, true);

    if (dataBuffer.byteLength > 0) {
      data.set(new Uint8Array(dataBuffer), 5);
    }

    return messageBuffer;
  }

  // 解码消息
  decodeMessage(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const type = view.getUint8(0);
    const length = view.getUint32(1, true);

    let payload = null;
    if (length > 0) {
      const payloadBuffer = arrayBuffer.slice(5, 5 + length);
      payload = payloadBuffer;
    }

    return { type, payload };
  }

  // 处理接收的二进制消息
  handleBinaryMessage(arrayBuffer) {
    const { type, payload } = this.decodeMessage(arrayBuffer);

    if (this.handlers[type]) {
      this.handlers[type](payload);
    }
  }

  // 发送消息
  send(type, data) {
    const message = this.encodeMessage(type, data);
    this.socket.send(message);
  }

  on(type, handler) {
    this.handlers[type] = handler;
  }
}

// 使用示例
const wsProtocol = new WebSocketBinaryProtocol('ws://localhost:8080');

wsProtocol.on(
  WebSocketBinaryProtocol.MESSAGE_TYPES.HEARTBEAT,
  () => console.log('Heartbeat received')
);

wsProtocol.on(
  WebSocketBinaryProtocol.MESSAGE_TYPES.DATA,
  (payload) => {
    const view = new DataView(payload);
    console.log('Received data:', view.getFloat32(0, true));
  }
);

// 发送数据
const dataBuffer = new ArrayBuffer(4);
const dataView = new DataView(dataBuffer);
dataView.setFloat32(0, 42.5, true);
wsProtocol.send(WebSocketBinaryProtocol.MESSAGE_TYPES.DATA, dataBuffer);
```

---

## 面试要点

### Q1: ArrayBuffer 和 TypedArray 有什么区别？

**答案：**
- ArrayBuffer 是原始二进制数据的容器，本身无法读写
- TypedArray 是 ArrayBuffer 的视图，提供有类型的数据访问
- 一个 ArrayBuffer 可以有多个 TypedArray 视图
- TypedArray 的长度固定（取决于缓冲区大小和元素类型）

```javascript
const buffer = new ArrayBuffer(8);
const int32 = new Int32Array(buffer);
const int8 = new Int8Array(buffer);

int32[0] = 0x12345678;
console.log(int8[0]); // 返回低字节（取决于字节顺序）
```

### Q2: 如何处理不同平台的字节顺序差异？

**答案：**
- 使用 DataView 显式指定字节顺序
- 小端序：littleEndian = true
- 大端序：littleEndian = false

```javascript
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

// 明确指定字节顺序
view.setUint32(0, 0x12345678, false); // 大端
view.setUint32(0, 0x12345678, true);  // 小端

// 检测系统字节顺序
function getSystemEndianness() {
  const buffer = new Uint32Array([0x12345678]);
  const bytes = new Uint8Array(buffer.buffer);
  return bytes[0] === 0x78 ? 'little' : 'big';
}
```

### Q3: TypedArray 的性能优势在哪里？

**答案：**
1. **内存高效** - 每个元素占用固定的字节数，无额外对象开销
2. **访问快速** - 类型确定，无需类型检查和转换
3. **引擎优化** - JIT 编译器可以生成更高效的代码
4. **缓存友好** - 连续内存布局，CPU 缓存效率高

### Q4: 如何实现 TypedArray 的动态扩展？

**答案：**
ArrayBuffer 不能直接扩展，但可以：

```javascript
class DynamicTypedArray {
  constructor(elementType = Uint8Array, initialSize = 10) {
    this.elementType = elementType;
    this.capacity = initialSize;
    this.length = 0;
    this.buffer = new ArrayBuffer(
      initialSize * elementType.BYTES_PER_ELEMENT
    );
    this.array = new elementType(this.buffer);
  }

  push(value) {
    if (this.length >= this.capacity) {
      this.grow();
    }
    this.array[this.length++] = value;
  }

  grow() {
    const newCapacity = this.capacity * 2;
    const newBuffer = new ArrayBuffer(
      newCapacity * this.elementType.BYTES_PER_ELEMENT
    );
    const newArray = new this.elementType(newBuffer);
    newArray.set(this.array);

    this.buffer = newBuffer;
    this.array = newArray;
    this.capacity = newCapacity;
  }

  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () => {
        if (index < this.length) {
          return {
            value: this.array[index++],
            done: false
          };
        }
        return { done: true };
      }
    };
  }
}

const dynamicArray = new DynamicTypedArray(Int32Array, 5);
for (let i = 0; i < 10; i++) {
  dynamicArray.push(i * 10);
}
```

### Q5: SharedArrayBuffer 有什么用途和风险？

**答案：**

用途：
- 在 Web Workers 之间共享内存
- 实现高效的多线程数据同步

风险：
- 需要特定的 HTTP 头 (Cross-Origin-Opener-Policy)
- 竞态条件和数据竞争
- 原子操作是必需的 (Atomics API)

```javascript
// 主线程
const shared = new SharedArrayBuffer(4);
const array = new Int32Array(shared);

const worker = new Worker('worker.js');
worker.postMessage({ shared });

// Worker 线程
self.onmessage = (event) => {
  const shared = event.data.shared;
  const array = new Int32Array(shared);

  // 原子操作确保线程安全
  Atomics.store(array, 0, 42);
  Atomics.notify(array, 0);
};
```

### Q6: 如何将字符串转换为 TypedArray？

**答案：**

```javascript
// 字符串 → Uint8Array
function stringToUint8Array(str, encoding = 'utf-8') {
  return new TextEncoder().encode(str);
}

// Uint8Array → 字符串
function uint8ArrayToString(array, encoding = 'utf-8') {
  return new TextDecoder(encoding).decode(array);
}

// 示例
const str = "Hello, 世界";
const encoded = stringToUint8Array(str);
const decoded = uint8ArrayToString(encoded);
console.log(decoded); // "Hello, 世界"

// 获取特定编码
const utf16 = new TextEncoder().encode(str); // UTF-8 only in TextEncoder
```

---

## 延伸阅读

### 官方文档
- [MDN - ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [MDN - TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)
- [MDN - DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView)
- [ECMAScript 规范 - ArrayBuffer Objects](https://tc39.es/ecma262/#sec-arraybuffer-objects)

### 相关技术
- [WebAssembly Linear Memory](https://webassembly.org/docs/semantics/#linear-memory)
- [Web Audio API](https://www.w3.org/TR/webaudio/)
- [Canvas API - ImageData](https://html.spec.whatwg.org/multipage/canvas.html#imagedata)
- [File API](https://w3c.github.io/FileAPI/)

### 深入学习
- [Exploring JS - Binary Data](https://exploringjs.com/es2016-beyond/ch_typed-arrays.html)
- [Efficient 3D Graphics on the Web with WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [Working with Binary Data in JavaScript](https://stackoverflow.com/questions/tagged/typed-arrays)

### 实践项目
- [Image Processing Filters](https://github.com/topics/image-processing-javascript)
- [Audio Synthesis & Effects](https://github.com/topics/web-audio-api)
- [Network Protocol Implementation](https://github.com/topics/binary-protocol)
- [3D Graphics with Three.js](https://threejs.org/)
