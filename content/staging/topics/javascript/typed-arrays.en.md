---
title: JavaScript TypedArrays and ArrayBuffer
description: "Master binary data handling: ArrayBuffer, TypedArrays, DataView, and working with raw binary data in JavaScript"
track: javascript
section: core
difficulty: advanced
tags:
  - JavaScript
  - TypedArrays
  - ArrayBuffer
  - Binary Data
  - DataView
  - Performance
status: imported
origin: old/src/content/docs/javascript/typed-arrays.en.md
divergence: 0.215
issues:
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: Binary Data
  order: 45
  lastUpdated: 2026-01-07
---

TypedArrays and ArrayBuffer provide a way to work with raw binary data in JavaScript. They are essential for handling binary protocols, file manipulation, image processing, audio/video streams, WebGL, and other applications that require efficient memory management and byte-level data manipulation.

## What are TypedArrays and ArrayBuffer?

### Concept Overview

**ArrayBuffer** is a fixed-length raw binary data buffer in memory. It represents a contiguous block of bytes but provides no methods to directly read or write its contents.

**TypedArrays** are array-like objects that provide a view into an ArrayBuffer, allowing you to interpret and manipulate the binary data as specific numeric types (integers, floating-point numbers, etc.).

**DataView** is another view that allows reading and writing data at specific byte offsets with control over byte order (endianness).

These three components work together:
- **ArrayBuffer**: The actual memory
- **TypedArrays**: Type-specific views (Int32Array, Float64Array, etc.)
- **DataView**: Byte-level access with endianness control

## Core Principles

### Memory Layout and Efficiency

```javascript
// Traditional JavaScript array
const jsArray = [1, 2, 3, 4, 5];
// Stores references to JavaScript objects, higher memory overhead

// TypedArray - contiguous memory
const buffer = new ArrayBuffer(20); // 20 bytes
const intArray = new Int32Array(buffer); // Each element is exactly 4 bytes
// Much more memory efficient and faster
```

### View Concept

```javascript
// Multiple views of the same data
const buffer = new ArrayBuffer(4);
const int32View = new Int32Array(buffer);
const uint8View = new Uint8Array(buffer);

int32View[0] = 0x11223344;

// Same underlying data, different interpretations
console.log(int32View[0]);     // 287454020
console.log(uint8View[0]);     // 68 (or 52 on big-endian)
console.log(uint8View[1]);     // 51 (or 67 on big-endian)
console.log(uint8View[2]);     // 34
console.log(uint8View[3]);     // 17
```

### Fixed-Size Buffers

```javascript
// ArrayBuffer size is fixed at creation
const buffer = new ArrayBuffer(100);
console.log(buffer.byteLength); // 100

// Cannot be resized
// buffer.byteLength = 200; // Error: not settable

// Must create new buffer if you need different size
const newBuffer = new ArrayBuffer(200);
```

## Key Points

### TypedArray Types

JavaScript provides 10 different TypedArray constructors:

| Type | Element Size | Range | Use Case |
|------|--------------|-------|----------|
| **Int8Array** | 1 byte | -128 to 127 | Small signed integers |
| **Uint8Array** | 1 byte | 0 to 255 | Bytes, unsigned integers |
| **Uint8ClampedArray** | 1 byte | 0 to 255 (clamped) | Pixel data (clamps instead of wrapping) |
| **Int16Array** | 2 bytes | -32,768 to 32,767 | Signed 16-bit integers |
| **Uint16Array** | 2 bytes | 0 to 65,535 | Unsigned 16-bit integers |
| **Int32Array** | 4 bytes | -2,147,483,648 to 2,147,483,647 | Signed 32-bit integers |
| **Uint32Array** | 4 bytes | 0 to 4,294,967,295 | Unsigned 32-bit integers |
| **Float32Array** | 4 bytes | IEEE 754 32-bit float | Single-precision floats |
| **Float64Array** | 8 bytes | IEEE 754 64-bit float | Double-precision floats |
| **BigInt64Array** | 8 bytes | Large signed integers | 64-bit signed integers |
| **BigUint64Array** | 8 bytes | Large unsigned integers | 64-bit unsigned integers |

### Creation Methods

```javascript
// Method 1: From ArrayBuffer
const buffer = new ArrayBuffer(16);
const int32Array = new Int32Array(buffer);

// Method 2: From length (creates buffer automatically)
const array = new Int32Array(4); // Creates 16-byte buffer

// Method 3: From array-like object
const array = new Int32Array([1, 2, 3, 4]); // Copies values

// Method 4: From iterable
const array = new Uint8Array([255, 128, 64, 32]);

// Method 5: Static methods
const array = Int32Array.of(1, 2, 3, 4);
const array2 = Uint8Array.from([1, 2, 3, 4]);
```

### Memory Efficiency

```javascript
// Size comparison
const jsArray = new Array(1000).fill(42);
console.log(jsArray.length * 8); // Rough estimate: thousands of bytes

const typedArray = new Int32Array(1000).fill(42);
console.log(typedArray.byteLength); // Exactly 4000 bytes

// TypedArrays are typically 10-100x more memory efficient
```

## Code Examples

### Basic ArrayBuffer and TypedArray Operations

```javascript
// Create and populate an ArrayBuffer
const buffer = new ArrayBuffer(16);
const view = new Int32Array(buffer);

// Write data
view[0] = 100;
view[1] = 200;
view[2] = 300;
view[3] = 400;

// Read data
console.log(view[0]); // 100
console.log(view.length); // 4

// Get underlying buffer
console.log(view.buffer === buffer); // true

// Get byte offset and element size
console.log(view.byteOffset); // 0
console.log(view.BYTES_PER_ELEMENT); // 4
```

### Working with Multiple Views

```javascript
// Create buffer with multiple views
const buffer = new ArrayBuffer(8);
const float64 = new Float64Array(buffer);
const int32 = new Int32Array(buffer);
const uint8 = new Uint8Array(buffer);

// Write as float64
float64[0] = 3.14159;

// Read as different types
console.log(float64[0]);        // 3.14159
console.log(int32[0]);          // 2570638386
console.log(int32[1]);          // 1074340347
console.log(uint8[0]);          // 110

// Shows how the same bytes are interpreted differently
```

### DataView for Precise Control

```javascript
// DataView for byte-level control and endianness
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

// Write bytes with specific byte order
view.setInt32(0, 0x12345678, false); // big-endian (false)

// Read as different types
console.log(view.getInt32(0, false));   // 305419896
console.log(view.getUint8(0));          // 18 (0x12)
console.log(view.getUint8(1));          // 52 (0x34)

// Little-endian write
view.setInt32(0, 0x12345678, true);    // little-endian (true)
console.log(view.getUint8(0));          // 120 (0x78)
```

### Reading Binary File Data

```javascript
async function readBinaryFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);

      // Check file signature (magic bytes)
      const signature = uint8Array.slice(0, 4);
      console.log('File signature:', Array.from(signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' '));

      resolve(arrayBuffer);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const buffer = await readBinaryFile(e.target.files[0]);
  // Process binary data
});
```

### Converting Between TypedArrays

```javascript
// Convert between different TypedArray types
const int32Array = new Int32Array([1000, 2000, 3000]);

// Method 1: Copy values
const float32Array = new Float32Array(Array.from(int32Array));
console.log(float32Array); // Float32Array [1000, 2000, 3000]

// Method 2: Reinterpret bytes (same buffer)
const buffer = int32Array.buffer;
const uint16Array = new Uint16Array(buffer);
console.log(uint16Array.length); // 6 (twice as many elements)

// Method 3: Set method
const uint8Array = new Uint8Array(3);
uint8Array.set([100, 200, 50]); // Values wrapped to 0-255
console.log(Array.from(uint8Array)); // [100, 200, 50]
```

### Extracting Bits and Bytes

```javascript
// Extract individual bits from bytes
function getBit(uint8Array, byteIndex, bitIndex) {
  const byte = uint8Array[byteIndex];
  return (byte >> bitIndex) & 1;
}

function setBit(uint8Array, byteIndex, bitIndex, value) {
  const byte = uint8Array[byteIndex];
  if (value) {
    uint8Array[byteIndex] = byte | (1 << bitIndex);
  } else {
    uint8Array[byteIndex] = byte & ~(1 << bitIndex);
  }
}

// Usage
const data = new Uint8Array([0b10101010]);
console.log(getBit(data, 0, 0)); // 0
console.log(getBit(data, 0, 1)); // 1

setBit(data, 0, 0, 1);
console.log(data[0].toString(2)); // 10101011
```

### Image Processing with TypedArrays

```javascript
async function processImage(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const imageData = new Uint8Array(arrayBuffer);

  // Apply grayscale effect
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    imageData[i] = gray;     // Red
    imageData[i + 1] = gray; // Green
    imageData[i + 2] = gray; // Blue
    // imageData[i + 3] is alpha, unchanged
  }

  return imageData;
}
```

### Network Protocol Parsing

```javascript
// Parse a simple binary protocol
class NetworkPacket {
  constructor(arrayBuffer) {
    this.view = new DataView(arrayBuffer);
  }

  get messageType() {
    return this.view.getUint8(0);
  }

  get packetLength() {
    return this.view.getUint16(1, true); // little-endian
  }

  get timestamp() {
    return this.view.getUint32(3, true); // little-endian
  }

  get payload() {
    const length = this.packetLength - 7; // Header size
    const buffer = this.view.buffer.slice(7, 7 + length);
    return new Uint8Array(buffer);
  }

  static create(messageType, payload) {
    const buffer = new ArrayBuffer(7 + payload.length);
    const view = new DataView(buffer);

    view.setUint8(0, messageType);
    view.setUint16(1, 7 + payload.length, true);
    view.setUint32(3, Date.now(), true);

    const payloadView = new Uint8Array(buffer, 7);
    payloadView.set(payload);

    return buffer;
  }
}

// Usage
const packet = new Uint8Array([
  0x01,          // Message type
  0x0C, 0x00,    // Packet length (12, little-endian)
  0xAB, 0xCD, 0xEF, 0x00, // Timestamp
  0x48, 0x65, 0x6C, 0x6C, 0x6F // Payload: "Hello"
]);

const parsed = new NetworkPacket(packet.buffer);
console.log(parsed.messageType); // 1
console.log(parsed.packetLength); // 12
```

### Audio Sample Manipulation

```javascript
// Manipulate audio samples with TypedArray
function amplifyAudio(audioBuffer, factor) {
  // audioBuffer is typically a Float32Array
  const channelData = audioBuffer;

  for (let i = 0; i < channelData.length; i++) {
    // Amplify but prevent clipping
    channelData[i] = Math.max(-1, Math.min(1, channelData[i] * factor));
  }

  return channelData;
}

function generateSineWave(frequency, duration, sampleRate) {
  const numSamples = duration * sampleRate;
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    samples[i] = Math.sin(2 * Math.PI * frequency * t);
  }

  return samples;
}

// Generate 440 Hz sine wave for 1 second at 44100 Hz
const audioSamples = generateSineWave(440, 1, 44100);
console.log(audioSamples.length); // 44100
```

## Best Practices

### Choose the Right TypedArray Type

```javascript
// Good: Matching data size to actual range
const pixels = new Uint8Array(pixelData);      // 0-255 range
const audioSamples = new Float32Array(data);   // -1 to 1 range
const temperatures = new Int16Array(tempData); // Can handle negative values

// Avoid: Wasting memory
const pixels = new Float64Array(pixelData); // Overkill for pixel data
const counts = new Int32Array(smallNumbers); // Wastes space vs Uint8Array
```

### Minimize Memory Allocations

```javascript
// Good: Reuse buffers
class ImageProcessor {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixelBuffer = new Uint8ClampedArray(width * height * 4);
  }

  process(imageData) {
    // Reuse pixelBuffer for each image
    this.pixelBuffer.set(imageData);
    // ... processing
  }
}

// Avoid: Creating new buffers repeatedly
function processImages(images) {
  for (const image of images) {
    const buffer = new Uint8Array(image.data); // New allocation each time
  }
}
```

### Use DataView for Complex Binary Formats

```javascript
// Good: Using DataView for endianness control
const view = new DataView(buffer);
const networkValue = view.getInt32(offset, true); // Explicitly little-endian

// Avoid: Assuming endianness
const array = new Int32Array(buffer);
const value = array[0]; // Endianness depends on platform
```

### Document Binary Formats

```javascript
// Good: Clear documentation of binary structure
/**
 * Packet Structure:
 * Offset 0-3: Message ID (Uint32, big-endian)
 * Offset 4-5: Flags (Uint16, big-endian)
 * Offset 6-9: Timestamp (Uint32, big-endian)
 * Offset 10+: Payload (variable length)
 */
class PacketParser {
  constructor(buffer) {
    this.view = new DataView(buffer);
  }

  get messageId() {
    return this.view.getUint32(0, false);
  }

  get flags() {
    return this.view.getUint16(4, false);
  }

  get timestamp() {
    return this.view.getUint32(6, false);
  }
}
```

### Handle Endianness Carefully

```javascript
// Create helper functions for cross-platform consistency
class BinaryProtocol {
  // Always use explicit byte order
  static readInt32BE(view, offset) {
    return view.getInt32(offset, false); // big-endian
  }

  static readInt32LE(view, offset) {
    return view.getInt32(offset, true);  // little-endian
  }

  static writeInt32BE(view, offset, value) {
    view.setInt32(offset, value, false);
  }

  static writeInt32LE(view, offset, value) {
    view.setInt32(offset, value, true);
  }
}

// Usage
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

BinaryProtocol.writeInt32BE(view, 0, 0x12345678);
const value = BinaryProtocol.readInt32BE(view, 0); // 0x12345678
```

## Common Pitfalls

### Forgetting Buffer Ownership

```javascript
// Bad: Modifying shared buffer
const buffer = new ArrayBuffer(8);
const view1 = new Int32Array(buffer);
const view2 = new Int32Array(buffer);

view1[0] = 100;
console.log(view2[0]); // Also 100! Both views point to same data

// Good: Create separate buffers when needed
const buffer1 = new ArrayBuffer(8);
const buffer2 = new ArrayBuffer(8);
const view1 = new Int32Array(buffer1);
const view2 = new Int32Array(buffer2);

view1[0] = 100;
console.log(view2[0]); // 0 - independent buffers
```

### Integer Overflow and Underflow

```javascript
// Bad: Not accounting for wraparound
const uint8 = new Uint8Array(1);
uint8[0] = 256;
console.log(uint8[0]); // 0 (wraps around)

uint8[0] = -1;
console.log(uint8[0]); // 255 (wraps around)

// Good: Check ranges
function setUint8Value(array, index, value) {
  if (value < 0 || value > 255) {
    throw new RangeError(`Value must be 0-255, got ${value}`);
  }
  array[index] = value;
}
```

### Incorrect Byte Offset Calculations

```javascript
// Bad: Hardcoding byte offsets
const buffer = new ArrayBuffer(20);
const view = new DataView(buffer);
view.setInt32(0, 100);  // offset 0
view.setInt32(4, 200);  // offset 4
view.setInt32(8, 300);  // offset 8
// Fragile: hard to maintain

// Good: Use constants and calculations
const HEADER_SIZE = 4;
const ID_OFFSET = 0;
const FLAG_OFFSET = ID_OFFSET + 4;
const DATA_OFFSET = FLAG_OFFSET + 2;

view.setInt32(ID_OFFSET, 100);
view.setInt16(FLAG_OFFSET, 200);
// Easier to understand and modify
```

### Memory Leaks with Large Buffers

```javascript
// Bad: Holding references to large buffers
class ImageCache {
  constructor() {
    this.cache = [];
  }

  addImage(imageBuffer) {
    this.cache.push(imageBuffer); // Keeps references forever
  }

  // No cleanup method
}

// Good: Implement proper cleanup
class ImageCache {
  constructor(maxSize = 10) {
    this.cache = [];
    this.maxSize = maxSize;
  }

  addImage(imageBuffer) {
    this.cache.push(imageBuffer);
    if (this.cache.length > this.maxSize) {
      this.cache.shift(); // Remove oldest
    }
  }

  clear() {
    this.cache = [];
  }
}
```

### Type Confusion Between ArrayBuffer and TypedArray

```javascript
// Bad: Mixing ArrayBuffer and TypedArray
function processData(data) {
  if (data instanceof ArrayBuffer) {
    const view = new Uint8Array(data);
    // ...
  } else if (data instanceof Uint8Array) {
    // ...
  }
}

// Good: Clear function signature and validation
function processData(uint8Array) {
  if (!(uint8Array instanceof Uint8Array)) {
    throw new TypeError('Expected Uint8Array');
  }
  // ...
}

// Or handle both explicitly
function processData(data) {
  let uint8Array;
  if (data instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(data);
  } else if (data instanceof Uint8Array) {
    uint8Array = data;
  } else {
    throw new TypeError('Expected ArrayBuffer or Uint8Array');
  }
  // ...
}
```

## Performance Considerations

### Allocation vs Access Patterns

```javascript
// Benchmark different allocation strategies
console.time('Create 1000 Int32Array');
for (let i = 0; i < 1000; i++) {
  const arr = new Int32Array(100);
}
console.timeEnd('Create 1000 Int32Array');

// Pre-allocate large buffer and reuse
const largeBuffer = new ArrayBuffer(1000 * 100 * 4);
console.time('Reuse views of large buffer');
for (let i = 0; i < 1000; i++) {
  const arr = new Int32Array(largeBuffer, i * 400, 100);
}
console.timeEnd('Reuse views of large buffer');
// Second approach is much faster
```

### Iteration Performance

```javascript
// Good: Direct iteration (fastest)
const arr = new Int32Array(1000000);
console.time('Direct iteration');
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum += arr[i];
}
console.timeEnd('Direct iteration');

// Slower: forEach
console.time('forEach');
let sum2 = 0;
arr.forEach(v => sum2 += v);
console.timeEnd('forEach');

// TypedArrays benefit from direct loops
```

### Copy vs View Operations

```javascript
// View (zero-copy, very fast)
const buffer = new ArrayBuffer(1000);
const view = new Int32Array(buffer, 100, 100); // View of bytes 100-500
// No memory allocation, instant

// Copy (slower but independent)
const buffer = new ArrayBuffer(1000);
const array = new Int32Array(buffer);
const copy = new Int32Array(array); // Allocates new buffer
// Slower but independent data
```

### DataView vs TypedArray

```javascript
// TypedArray (faster, no endianness flexibility)
const arr = new Int32Array(100000);
console.time('Int32Array');
for (let i = 0; i < arr.length; i++) {
  arr[i] = i;
}
console.timeEnd('Int32Array');

// DataView (slower, endianness control)
const buffer = new ArrayBuffer(100000 * 4);
const view = new DataView(buffer);
console.time('DataView');
for (let i = 0; i < 100000; i++) {
  view.setInt32(i * 4, i, false);
}
console.timeEnd('DataView');
// TypedArray is typically 10-100x faster
```

## Real-world Scenarios

### WebGL Vertex Data

```javascript
// Store vertex data efficiently for WebGL
class Mesh {
  constructor(vertices, indices) {
    // Store vertices as Float32Array (x, y, z for each vertex)
    this.vertices = new Float32Array(vertices);

    // Store indices as Uint16Array for element buffer
    this.indices = new Uint16Array(indices);

    this.vertexBuffer = null;
    this.indexBuffer = null;
  }

  uploadToGPU(gl) {
    // Create WebGL buffers
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  }
}
```

### WebRTC Data Channel

```javascript
// Send binary data over WebRTC
class BinaryMessenger {
  constructor(dataChannel) {
    this.channel = dataChannel;
  }

  sendMessage(type, data) {
    // Create binary message: [type (1 byte)] [data]
    const buffer = new ArrayBuffer(1 + data.byteLength);
    const view = new Uint8Array(buffer);

    view[0] = type;
    view.set(new Uint8Array(data), 1);

    this.channel.send(buffer);
  }

  setupReceiver() {
    this.channel.binaryType = 'arraybuffer';
    this.channel.onmessage = (event) => {
      const buffer = event.data;
      const view = new Uint8Array(buffer);

      const messageType = view[0];
      const payload = buffer.slice(1);

      this.handleMessage(messageType, payload);
    };
  }

  handleMessage(type, payload) {
    // Process message based on type
    console.log(`Message type: ${type}, payload size: ${payload.byteLength}`);
  }
}
```

### Compression/Decompression

```javascript
// Work with compressed data using TypedArrays
class CompressionHelper {
  // Simple compression: store run-length encoded data
  static compress(uint8Array) {
    const result = [];
    let i = 0;

    while (i < uint8Array.length) {
      const byte = uint8Array[i];
      let count = 1;

      while (count < 255 && i + count < uint8Array.length &&
             uint8Array[i + count] === byte) {
        count++;
      }

      result.push(count, byte);
      i += count;
    }

    return new Uint8Array(result);
  }

  static decompress(compressed) {
    const result = [];

    for (let i = 0; i < compressed.length; i += 2) {
      const count = compressed[i];
      const byte = compressed[i + 1];

      for (let j = 0; j < count; j++) {
        result.push(byte);
      }
    }

    return new Uint8Array(result);
  }
}

// Usage
const original = new Uint8Array([1, 1, 1, 2, 2, 3, 3, 3, 3]);
const compressed = CompressionHelper.compress(original);
const decompressed = CompressionHelper.decompress(compressed);
console.log(Array.from(decompressed)); // [1, 1, 1, 2, 2, 3, 3, 3, 3]
```

### Cryptocurrency/Hashing

```javascript
// Work with hash data (typically 32 bytes)
class HashUtil {
  static hashToHex(hash) {
    // Convert hash bytes to hex string
    const uint8Array = new Uint8Array(hash);
    return Array.from(uint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToHash(hexString) {
    // Convert hex string to hash bytes
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.slice(i, i + 2), 16));
    }
    return new Uint8Array(bytes);
  }

  static compareHashes(hash1, hash2) {
    // Constant-time comparison
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
      result |= hash1[i] ^ hash2[i];
    }
    return result === 0;
  }
}

// Usage
const hash = new Uint8Array(32);
crypto.getRandomValues(hash);
const hex = HashUtil.hashToHex(hash);
const recovered = HashUtil.hexToHash(hex);
console.log(HashUtil.compareHashes(hash, recovered)); // true
```

### JPEG/PNG Parsing

```javascript
// Parse simple binary file format (PNG example)
class PNGParser {
  constructor(arrayBuffer) {
    this.view = new DataView(arrayBuffer);
    this.offset = 0;
  }

  readSignature() {
    // PNG signature: 137 80 78 71 13 10 26 10
    const expected = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const actual = new Uint8Array(this.view.buffer, 0, 8);

    if (!this.compareArrays(actual, expected)) {
      throw new Error('Invalid PNG signature');
    }
    this.offset = 8;
  }

  readChunk() {
    // Read chunk length
    const length = this.view.getUint32(this.offset, false); // big-endian
    this.offset += 4;

    // Read chunk type
    const typeBytes = new Uint8Array(this.view.buffer, this.offset, 4);
    const type = String.fromCharCode(...typeBytes);
    this.offset += 4;

    // Read chunk data
    const data = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;

    // Read CRC (we'll skip validation for this example)
    this.offset += 4;

    return { type, data };
  }

  compareArrays(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

// Usage
fetch('image.png')
  .then(r => r.arrayBuffer())
  .then(buffer => {
    const parser = new PNGParser(buffer);
    parser.readSignature();
    // ... parse chunks
  });
```

## Interview Points

### Explain ArrayBuffer vs TypedArray

**Answer:** ArrayBuffer is a fixed-size raw binary buffer that cannot be directly read or written. TypedArray is a view into an ArrayBuffer that interprets the bytes as specific numeric types (Int32, Float64, etc.). Multiple TypedArrays can reference the same ArrayBuffer with different interpretations.

### Why Use TypedArrays Over Regular Arrays?

**Answer:** TypedArrays are:
- **Memory efficient**: Fixed element size, no object overhead
- **Faster**: Contiguous memory, CPU cache friendly
- **Binary compatible**: Direct representation of bytes
- **Interoperable**: Can be passed to WebGL, WebAssembly, etc.

### What is Endianness and Why Does It Matter?

**Answer:** Endianness is byte order (big-endian vs little-endian). It matters when:
- Reading/writing network protocols
- Working with binary file formats
- Communicating across platforms
DataView allows explicit endianness control, while TypedArrays use native platform order.

### How Would You Implement a Binary Protocol Parser?

**Answer:** Use DataView for explicit endianness control, create helper functions for each data type, document the binary format, validate data, and handle errors. Use offset tracking and constant calculations for buffer positions.

### What Are Common Use Cases for TypedArrays?

**Answer:**
- WebGL vertex/texture data
- Audio/video processing
- Binary file parsing (images, archives)
- Network protocols
- Cryptography
- Data compression
- WebAssembly interoperability
- Canvas pixel manipulation

### How Do You Prevent Memory Leaks with TypedArrays?

**Answer:** Keep references limited, implement caches with size limits, clear buffers when done, avoid creating unnecessary copies, and consider weak references for cached data.

### Performance Comparison: TypedArray vs Array

**Answer:** TypedArrays are typically 10-100x faster due to:
- No object wrapper overhead
- Contiguous memory layout
- CPU cache optimization
- Type specialization in engines
- Less garbage collection pressure

## Further Reading

### Official Documentation
- [MDN: ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [MDN: TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)
- [MDN: DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView)
- [ECMAScript Specification: ArrayBuffer](https://tc39.es/ecma262/#sec-arraybuffer-objects)

### Related Topics
- **WebGL**: Uses TypedArrays for vertex and texture data
- **WebAssembly**: Shares memory with TypedArrays via SharedArrayBuffer
- **Web Audio API**: Works with Float32Array for audio samples
- **Canvas API**: Pixel data as Uint8ClampedArray
- **File API**: FileReader with readAsArrayBuffer()

### Practical Guides
- Binary file format specifications (PNG, JPEG, ZIP)
- Network protocol documentation
- WebGL programming guides
- Audio processing tutorials
- Cryptography libraries documentation

### Performance Optimization
- V8 optimization guides for typed operations
- Memory profiling with DevTools
- Garbage collection considerations
- SIMD opportunities (where available)

---

## Summary

TypedArrays and ArrayBuffer are fundamental for working with binary data in JavaScript:

- **ArrayBuffer** provides raw memory, **TypedArrays** provide typed views into it
- Choose the right TypedArray type for your data range and performance needs
- **DataView** offers fine-grained control and explicit endianness handling
- Multiple views can reference the same buffer for different data interpretations
- Memory efficiency and performance are orders of magnitude better than regular arrays
- Essential for WebGL, audio, binary protocols, and file processing
- Proper memory management prevents leaks and optimizes performance

Mastering TypedArrays opens up high-performance binary data processing in the browser and Node.js environments.
