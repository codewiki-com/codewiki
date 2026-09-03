---
title: JavaScript Math 对象与数学运算
description: 全面掌握 JavaScript Math 对象：常用方法、数学运算、随机数生成、精度问题和性能优化
track: javascript
section: core
difficulty: beginner
tags:
  - Math
  - 数学运算
  - 随机数
  - 数值计算
  - 算法
status: imported
origin: old/src/content/docs/javascript/math-object.zh.md
divergence: 0.19
issues:
  - title-lang-en
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-07
---

JavaScript Math 对象是进行数学运算和数值处理的核心工具。无论是简单的四则运算、三角函数计算，还是复杂的算法实现，都离不开 Math 对象提供的各种方法和常数。本文将系统介绍 Math 对象的常用方法、应用场景、常见陷阱和最佳实践。

## 概念解释

### Math 对象的基本概念

Math 对象是 JavaScript 的内置对象，提供了进行数学运算所需的方法和常数。与其他对象不同，Math 对象具有以下特点：

- **全局对象**：Math 是全局对象，无需创建实例即可使用
- **静态方法**：所有方法都是静态的，通过 `Math.methodName()` 调用
- **静态属性**：提供数学常数如 π、e、√2 等
- **不可实例化**：Math 不能作为构造函数使用

```javascript
// ✓ 正确的使用方式
Math.sqrt(16);     // 4
Math.PI;           // 3.141592653589793

// ✗ 错误的使用方式
new Math();        // TypeError: Math is not a constructor
const m = Math;    // 虽然可行，但没有意义
```

### Math 对象的主要分类

Math 对象的方法和属性可分为以下几类：

1. **数学常数**：PI、E、LN2、LN10 等
2. **基础运算方法**：abs、pow、sqrt、cbrt 等
3. **取整方法**：floor、ceil、round、trunc 等
4. **三角函数**：sin、cos、tan、asin、acos、atan 等
5. **指数与对数**：exp、log、log10、log2 等
6. **随机数生成**：random 方法
7. **极值计算**：max、min 等

## 核心原理

### 浮点数精度问题

JavaScript 使用 IEEE 754 标准的双精度浮点数表示数字，这导致一些数学运算可能产生精度问题：

```javascript
// 浮点数精度问题的典型案例
0.1 + 0.2 === 0.3;        // false！
0.1 + 0.2;                 // 0.30000000000000004

// 三角函数的精度
Math.sin(Math.PI);         // 1.2246467991473532e-16 (不是 0)
Math.cos(Math.PI / 2);     // 6.123233995736766e-17 (不是 0)

// 解决方案：使用精度函数
function isEqual(a, b, tolerance = 1e-10) {
  return Math.abs(a - b) < tolerance;
}

isEqual(0.1 + 0.2, 0.3);   // true
```

### Math 对象的内部实现

Math 对象的大多数方法都是调用底层的 C 数学库（如 libm），这保证了高性能和高精度。然而，由于浮点数的固有限制，仍然会存在精度偏差。

```javascript
// 不同精度的运算结果
const a = Math.sqrt(2);
console.log(a * a);        // 2（看起来对）
console.log(a * a === 2);  // false！

// 原因：√2 无法用有限精度完全表示
console.log(a * a - 2);    // 4.440892098500626e-16
```

### 取整方法的区别

JavaScript 提供了多种取整方法，它们在处理负数时行为不同：

```javascript
const num = 4.7;
const negNum = -4.7;

// floor: 向下取整（向负无穷）
Math.floor(num);      // 4
Math.floor(negNum);   // -5

// ceil: 向上取整（向正无穷）
Math.ceil(num);       // 5
Math.ceil(negNum);    // -4

// round: 四舍五入（0.5向上）
Math.round(4.5);      // 5
Math.round(-4.5);     // -4（向上即向0）

// trunc: 向零取整（截断小数部分）
Math.trunc(num);      // 4
Math.trunc(negNum);   // -4
```

## 核心要点

### 必知的 Math 属性和常用方法

| 属性/方法 | 说明 | 返回值范围 |
|---------|------|----------|
| `Math.PI` | 圆周率 π | 3.141592653589793 |
| `Math.E` | 自然对数的底数 e | 2.718281828459045 |
| `Math.LN2` | 2 的自然对数 | 0.6931471805599453 |
| `Math.LN10` | 10 的自然对数 | 2.302585092994046 |
| `Math.SQRT2` | 2 的平方根 | 1.4142135623730951 |
| `Math.abs(x)` | 绝对值 | ≥ 0 |
| `Math.pow(x, y)` | x 的 y 次方 | 取决于参数 |
| `Math.sqrt(x)` | 平方根 | ≥ 0 |
| `Math.cbrt(x)` | 立方根 | - |
| `Math.random()` | 随机数 | [0, 1) |

### 随机数的正确生成方式

```javascript
// 生成 [0, 1) 的随机数
Math.random();

// 生成 [0, n) 的随机整数
function getRandomInt(n) {
  return Math.floor(Math.random() * n);
}

// 生成 [min, max] 的随机整数（包含边界）
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成 [min, max) 的随机数
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// 示例
console.log(getRandomInt(10));              // 0-9 的整数
console.log(getRandomIntInclusive(1, 6));   // 1-6 的整数（骰子）
console.log(getRandomNumber(0, 100));       // 0-100 的浮点数
```

### 常用的数学计算模式

```javascript
// 求最大值和最小值
const numbers = [3, 1, 4, 1, 5, 9];
const max = Math.max(...numbers);     // 9
const min = Math.min(...numbers);     // 1

// 求和与平均值
const sum = numbers.reduce((a, b) => a + b, 0);
const avg = sum / numbers.length;

// 求标准差
const variance = numbers.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / numbers.length;
const stdDev = Math.sqrt(variance);

// 角度与弧度转换
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

console.log(toRadians(180));    // 3.141592653589793
console.log(toDegrees(Math.PI)); // 180
```

## 代码示例

### 基础数学运算

```javascript
// 1. 幂运算与根运算
console.log('=== 幂运算与根运算 ===');
console.log(Math.pow(2, 3));        // 8 (2^3)
console.log(Math.pow(4, 0.5));      // 2 (√4)
console.log(Math.sqrt(16));         // 4
console.log(Math.cbrt(27));         // 3 (³√27)

// 2. 取整方法对比
console.log('\n=== 取整方法对比 ===');
const testNum = 5.7;
console.log(Math.floor(testNum));   // 5 (向下)
console.log(Math.ceil(testNum));    // 6 (向上)
console.log(Math.round(testNum));   // 6 (四舍五入)
console.log(Math.trunc(testNum));   // 5 (截断)

// 3. 绝对值与符号
console.log('\n=== 绝对值与符号 ===');
console.log(Math.abs(-5));          // 5
console.log(Math.sign(-5));         // -1
console.log(Math.sign(5));          // 1
console.log(Math.sign(0));          // 0

// 4. 指数与对数
console.log('\n=== 指数与对数 ===');
console.log(Math.exp(1));           // e (2.718...)
console.log(Math.log(Math.E));      // 1
console.log(Math.log10(100));       // 2 (log₁₀100)
console.log(Math.log2(8));          // 3 (log₂8)
```

### 三角函数与角度计算

```javascript
// 1. 基础三角函数
console.log('=== 三角函数 ===');
console.log(Math.sin(Math.PI / 2)); // 1
console.log(Math.cos(0));           // 1
console.log(Math.tan(Math.PI / 4)); // 1

// 2. 反三角函数
console.log('\n=== 反三角函数 ===');
console.log(Math.asin(1) * 180 / Math.PI);      // 90°
console.log(Math.acos(0) * 180 / Math.PI);      // 90°
console.log(Math.atan(1) * 180 / Math.PI);      // 45°

// 3. atan2 计算两点之间的角度
console.log('\n=== atan2 - 计算向量角度 ===');
// 计算点 (3, 4) 相对于原点的角度
const angle = Math.atan2(4, 3);
console.log('角度（弧度）:', angle);
console.log('角度（度）:', angle * 180 / Math.PI);

// 4. 距离计算
console.log('\n=== 距离计算 ===');
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

const dist = distance(0, 0, 3, 4);
console.log('点(0,0)到点(3,4)的距离:', dist); // 5
```

### 随机数和概率

```javascript
// 1. 基础随机数生成
console.log('=== 随机数生成 ===');

// 生成 [0, 1) 的随机数
function randomBetween0And1() {
  return Math.random();
}

// 生成 [0, n) 的随机整数
function randomInt(n) {
  return Math.floor(Math.random() * n);
}

// 生成 [min, max] 的随机整数
function randomIntRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log('随机 0-1:', randomBetween0And1());
console.log('随机 0-9:', randomInt(10));
console.log('随机 1-6:', randomIntRange(1, 6));

// 2. 洗牌算法（Fisher-Yates）
console.log('\n=== Fisher-Yates 洗牌 ===');
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const cards = ['♠A', '♥K', '♦Q', '♣J'];
console.log('洗牌前:', cards);
console.log('洗牌后:', shuffle(cards));

// 3. 加权随机选择
console.log('\n=== 加权随机选择 ===');
function weightedRandom(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random < 0) {
      return items[i];
    }
  }
}

const prizes = ['iPhone', '平板', '手机壳'];
const weights = [0.1, 0.3, 0.6];  // 10% 10% 60%
console.log('抽奖结果:', weightedRandom(prizes, weights));
```

### 实用的数学工具函数

```javascript
// 1. 数值范围限制
console.log('=== 数值范围限制 ===');
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

console.log(clamp(15, 0, 100));     // 15
console.log(clamp(-5, 0, 100));     // 0
console.log(clamp(150, 0, 100));    // 100

// 2. 四舍五入到指定小数位
console.log('\n=== 精确四舍五入 ===');
function round(num, decimals = 0) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

console.log(round(3.14159, 2));     // 3.14
console.log(round(1.567, 2));       // 1.57

// 3. 百分比计算
console.log('\n=== 百分比计算 ===');
function percentage(value, total) {
  return round(value / total * 100, 2);
}

function apply(value, percent) {
  return value * (1 + percent / 100);
}

console.log(percentage(30, 200));    // 15
console.log(apply(100, 10));         // 110 (增加10%)

// 4. 最大公约数和最小公倍数
console.log('\n=== GCD 和 LCM ===');
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

console.log(gcd(48, 18));           // 6
console.log(lcm(12, 18));           // 36

// 5. 阶乘计算
console.log('\n=== 阶乘 ===');
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

// 尾递归优化版本
function factorialTail(n, acc = 1) {
  if (n <= 1) return acc;
  return factorialTail(n - 1, acc * n);
}

console.log(factorial(5));          // 120
console.log(factorialTail(5));      // 120
```

### 几何与物理计算

```javascript
// 1. 圆相关计算
console.log('=== 圆的计算 ===');
function circleArea(radius) {
  return Math.PI * Math.pow(radius, 2);
}

function circlePerimeter(radius) {
  return 2 * Math.PI * radius;
}

console.log('半径为5的圆:');
console.log('面积:', circleArea(5));         // 78.54
console.log('周长:', circlePerimeter(5));    // 31.42

// 2. 三角形相关计算
console.log('\n=== 三角形的计算 ===');
// 海伦公式计算三角形面积
function triangleArea(a, b, c) {
  const s = (a + b + c) / 2;
  return Math.sqrt(s * (s - a) * (s - b) * (s - c));
}

const area = triangleArea(3, 4, 5);
console.log('边长为3,4,5的三角形面积:', area); // 6

// 3. 两点间距离
console.log('\n=== 距离计算 ===');
function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = (p2.z || 0) - (p1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

const p1 = { x: 0, y: 0, z: 0 };
const p2 = { x: 3, y: 4, z: 0 };
console.log('3D距离:', distance(p1, p2)); // 5

// 4. 向量角度
console.log('\n=== 向量角度 ===');
function angleBetween(v1, v2) {
  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

const v1 = { x: 1, y: 0 };
const v2 = { x: 1, y: 1 };
console.log('向量夹角（弧度）:', angleBetween(v1, v2));
console.log('向量夹角（度）:', angleBetween(v1, v2) * 180 / Math.PI);
```

## 最佳实践

### 精度处理的最佳实践

```javascript
// ✓ 好的做法：使用精度容差比较
function isApproxEqual(a, b, tolerance = 1e-10) {
  return Math.abs(a - b) < tolerance;
}

// ✓ 对货币使用整数计算（单位：分）
function moneyAdd(cents1, cents2) {
  return cents1 + cents2;
}

// ✓ 使用 toFixed 时注意返回的是字符串
const result = (0.1 + 0.2).toFixed(1);  // "0.3"
const num = parseFloat(result);          // 0.3

// ✗ 避免直接浮点数比较
if (0.1 + 0.2 === 0.3) {  // false，不要这样做
  console.log('相等');
}
```

### 随机数生成的最佳实践

```javascript
// ✓ 好的做法：使用专用函数而不是重复编写逻辑
class Random {
  static int(max) {
    return Math.floor(Math.random() * max);
  }

  static range(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static float(max) {
    return Math.random() * max;
  }

  static choice(arr) {
    return arr[this.int(arr.length)];
  }

  static shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// ✗ 避免的做法
Math.random() * 100;  // 不够清晰，可能包含 0-99 或 0-100

// ✓ 对于真随机需求，考虑 crypto API
function cryptoRandom() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / (0xffffffff + 1);
}
```

### 性能优化的最佳实践

```javascript
// ✓ 避免重复计算
const PI_2 = Math.PI * 2;
const PI_HALF = Math.PI / 2;

// 函数内缓存常用计算
function expensiveCalculation(data) {
  const sqrt5 = Math.sqrt(5);  // 缓存而不是重复计算

  return data.map(x => {
    return (Math.pow(x, 2) + sqrt5) / 2;
  });
}

// ✓ 选择合适的算法
// 不好：重复调用 Math.pow
let result = 1;
for (let i = 0; i < 10; i++) {
  result = Math.pow(result, 2);  // 避免
}

// 好：直接计算
let result = Math.pow(2, 1024);  // 更高效

// ✓ 预计算而不是动态计算
const sinTable = Array.from({ length: 360 }, (_, i) =>
  Math.sin(i * Math.PI / 180)
);

// ✓ 使用位运算代替 Math 方法（当可能时）
Math.floor(x) === x >> 0;  // 对于小整数更快
Math.abs(x) === (x < 0 ? -x : x);  // 可能更快
```

## 常见陷阱

### 浮点数精度陷阱

```javascript
// 陷阱 1：直接比较浮点数
console.log('陷阱 1: 浮点数比较');
console.log(0.1 + 0.2 === 0.3);  // false!
console.log(0.1 + 0.2);          // 0.30000000000000004

// 解决：使用容差
function fuzzyEqual(a, b, tolerance = 1e-10) {
  return Math.abs(a - b) < tolerance;
}
console.log(fuzzyEqual(0.1 + 0.2, 0.3));  // true

// 陷阱 2：三角函数的精度
console.log('\n陷阱 2: 三角函数精度');
console.log(Math.sin(Math.PI) === 0);      // false!
console.log(Math.sin(Math.PI));            // 1.2246467991473532e-16

// 解决：四舍五入到合理精度
function round(num, decimals = 10) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
console.log(round(Math.sin(Math.PI), 10)); // 0
```

### 取整方法的陷阱

```javascript
// 陷阱 1：混淆 Math.round 的行为
console.log('陷阱 1: Math.round 与 0.5');
console.log(Math.round(2.5));    // 3
console.log(Math.round(3.5));    // 4 (银行家舍入的结果)
console.log(Math.round(-2.5));   // -2

// 陷阱 2：负数的 floor 与 ceil
console.log('\n陷阱 2: 负数的取整');
console.log(Math.floor(-4.3));   // -5 (向下，即向负无穷)
console.log(Math.ceil(-4.3));    // -4 (向上，即向0)

// 陷阱 3：使用位运算取整
console.log('\n陷阱 3: 位运算取整');
console.log(5.9 | 0);            // 5 (截断，但可能有溢出)
console.log(Math.floor(5.9));    // 5 (推荐)
console.log((5.9 >> 0));         // 5 (不推荐)
```

### 随机数的陷阱

```javascript
// 陷阱 1：Math.random() 不包括 1
console.log('陷阱 1: random 的范围');
console.log(Math.random());  // [0, 1) 不包括 1

// 生成 1-100 的常见错误
let wrong = Math.random() * 100;  // 可能是 0 或 99.99，不是 100

// 正确做法
let correct = Math.floor(Math.random() * 100) + 1;  // 1-100

// 陷阱 2：种子不可设置（Math.random 没有种子参数）
console.log('\n陷阱 2: 不可复现的随机性');
// 无法复现相同的随机序列
Math.random();  // 0.123...
Math.random();  // 0.456...

// 解决：需要时使用第三方库（如 seedrandom）

// 陷阱 3：选择数组元素时的 off-by-one 错误
console.log('\n陷阱 3: 数组随机选择');
const arr = [1, 2, 3, 4, 5];

// 错误：可能超出数组范围
const wrong = arr[Math.random() * arr.length];  // 可能是 undefined

// 正确
const correct = arr[Math.floor(Math.random() * arr.length)];
```

### Math.max/min 的陷阱

```javascript
// 陷阱 1：传入数组
console.log('陷阱 1: 数组作为参数');
const numbers = [10, 5, 8, 3];
console.log(Math.max(numbers));      // NaN!
console.log(Math.max(...numbers));   // 10 ✓

// 陷阱 2：NaN 会导致结果为 NaN
console.log('\n陷阱 2: NaN 的传播');
console.log(Math.max(5, NaN, 3));    // NaN!

// 陷阱 3：空数组的最大值
console.log('\n陷阱 3: 空数组');
console.log(Math.max());             // -Infinity
console.log(Math.min());             // Infinity

// 解决：使用 reduce
function safeMax(arr) {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a > b ? a : b);
}

console.log(safeMax(numbers));       // 10
```

## 性能考量

### 常用 Math 方法的性能对比

```javascript
// 性能测试框架
function benchmark(name, fn, iterations = 1000000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

// 测试 1：取整方法性能
console.log('=== 取整方法性能 ===');
const num = 5.7;

benchmark('Math.floor', () => Math.floor(num));
benchmark('Math.ceil', () => Math.ceil(num));
benchmark('Math.round', () => Math.round(num));
benchmark('Math.trunc', () => Math.trunc(num));
benchmark('num >> 0', () => num >> 0);
benchmark('~~num', () => ~~num);

// 测试 2：平方根性能
console.log('\n=== 平方根性能 ===');
benchmark('Math.sqrt', () => Math.sqrt(16));
benchmark('Math.pow(16, 0.5)', () => Math.pow(16, 0.5));
benchmark('16 ** 0.5', () => 16 ** 0.5);

// 测试 3：三角函数性能
console.log('\n=== 三角函数性能 ===');
const angle = Math.PI / 4;
benchmark('Math.sin', () => Math.sin(angle));
benchmark('Math.cos', () => Math.cos(angle));
benchmark('Math.tan', () => Math.tan(angle));

// 结果分析（在 Node.js 中运行）
// 通常：位运算 > Math 方法
// Math.floor ≈ Math.trunc > Math.ceil ≈ Math.round
// 三角函数相对较慢
```

### 优化建议

```javascript
// 1. 缓存重复计算
const TWO_PI = Math.PI * 2;  // 避免重复乘法
const PI_OVER_180 = Math.PI / 180;  // 用于度数转换

// 2. 预计算而不是动态计算
// 不好：在循环中计算
for (let i = 0; i < 360; i += 5) {
  const rad = i * Math.PI / 180;  // 重复计算
  console.log(Math.sin(rad));
}

// 好：预先创建查找表
const sinTable = Array.from({ length: 360 }, (_, i) =>
  Math.sin(i * PI_OVER_180)
);
for (let i = 0; i < 360; i += 5) {
  console.log(sinTable[i]);
}

// 3. 选择合适的算法
// 不好：递归计算阶乘（栈溢出风险）
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

// 好：迭代或查找表
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// 4. 避免不必要的 Math 运算
// 不好：多次调用相同的 Math 方法
const hypotenuse = Math.sqrt(x * x + y * y);
if (hypotenuse < 100) { /* ... */ }

// 好：缓存结果
const distSquared = x * x + y * y;
if (Math.sqrt(distSquared) < 100) { /* ... */ }
// 或进一步优化
if (distSquared < 10000) { /* ... */ }  // 避免平方根计算
```

## 实战场景

### 数据可视化中的数学运算

```javascript
// 场景：柱状图的绘制
class BarChart {
  constructor(data, options = {}) {
    this.data = data;
    this.options = {
      width: 400,
      height: 300,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      ...options
    };
  }

  // 计算缩放因子
  getScale() {
    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    const range = max - min || 1;
    const chartHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
    return chartHeight / range;
  }

  // 计算柱子高度
  getBarHeight(value) {
    const min = Math.min(...this.data);
    const scale = this.getScale();
    return (value - min) * scale;
  }

  // 计算柱子位置
  getBarX(index) {
    const chartWidth = this.options.width - this.options.margin.left - this.options.margin.right;
    const barWidth = chartWidth / this.data.length;
    return this.options.margin.left + index * barWidth;
  }
}

// 使用示例
const chart = new BarChart([10, 25, 15, 30, 20]);
console.log('第0个柱子的高度:', chart.getBarHeight(10));
console.log('第2个柱子的位置:', chart.getBarX(2));
```

### 游戏开发中的数学

```javascript
// 场景 1: 2D 游戏的物理引擎
class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // 向量加法
  add(other) {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  // 向量减法
  subtract(other) {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  // 向量长度
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // 向量正规化
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return new Vector2(this.x / mag, this.y / mag);
  }

  // 点乘（标量积）
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  // 旋转
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
}

// 场景 2: 碰撞检测
function circleCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
}

function rectangleCollision(rect1, rect2) {
  return !(rect1.right < rect2.left || rect1.left > rect2.right ||
           rect1.bottom < rect2.top || rect1.top > rect2.bottom);
}

// 场景 3: 动画缓动函数
class Easing {
  // 线性
  static linear(t) {
    return t;
  }

  // 平方缓入
  static easeInQuad(t) {
    return t * t;
  }

  // 平方缓出
  static easeOutQuad(t) {
    return t * (2 - t);
  }

  // 圆形缓入缓出
  static easeInOutCirc(t) {
    return t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  }
}

// 使用示例
console.log('线性缓动 (t=0.5):', Easing.linear(0.5));
console.log('缓入平方 (t=0.5):', Easing.easeInQuad(0.5));
```

### 统计分析应用

```javascript
// 场景：基础统计函数库
class Statistics {
  // 平均值
  static mean(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  // 中位数
  static median(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  // 方差
  static variance(data) {
    const mean = this.mean(data);
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  }

  // 标准差
  static standardDeviation(data) {
    return Math.sqrt(this.variance(data));
  }

  // 百分位数
  static percentile(data, p) {
    const sorted = [...data].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

// 使用示例
const testScores = [65, 72, 88, 92, 78, 95, 85, 90, 88];
console.log('平均分:', Statistics.mean(testScores).toFixed(2));
console.log('中位数:', Statistics.median(testScores));
console.log('标准差:', Statistics.standardDeviation(testScores).toFixed(2));
console.log('90 百分位:', Statistics.percentile(testScores, 90).toFixed(2));
```

### Web 动画与过渡

```javascript
// 场景：平滑动画实现
class Animation {
  constructor(start, end, duration, easing = (t) => t) {
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.easing = easing;
    this.startTime = null;
    this.value = start;
  }

  update(currentTime) {
    if (this.startTime === null) {
      this.startTime = currentTime;
    }

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const easeProgress = this.easing(progress);

    this.value = this.start + (this.end - this.start) * easeProgress;

    return {
      value: this.value,
      isFinished: progress >= 1
    };
  }
}

// 使用示例
const animation = new Animation(0, 100, 1000, (t) => {
  // 缓入缓出效果
  return t < 0.5 ? 2 * t * t : -1 + 4 * t - 2 * t * t;
});

// requestAnimationFrame 循环
function animate(currentTime) {
  const { value, isFinished } = animation.update(currentTime);
  console.log('当前值:', value.toFixed(2));

  if (!isFinished) {
    requestAnimationFrame(animate);
  }
}

// requestAnimationFrame(animate);  // 在浏览器中运行
```

## 面试要点

### 常见面试题

**问题 1：为什么 0.1 + 0.2 !== 0.3？**

```javascript
// 答案解释：
// 1. JavaScript 使用 IEEE 754 双精度浮点数标准
// 2. 十进制的 0.1 和 0.2 无法用二进制完全表示
// 3. 结果是 0.30000000000000004

// 解决方案演示
const result = 0.1 + 0.2;
console.log(result === 0.3);  // false

// 方案 1: 使用容差
const EPSILON = 1e-10;
console.log(Math.abs(result - 0.3) < EPSILON);  // true

// 方案 2: toFixed
console.log(parseFloat((0.1 + 0.2).toFixed(1)) === 0.3);  // true

// 方案 3: 整数运算
const a = Math.round(0.1 * 100);
const b = Math.round(0.2 * 100);
console.log((a + b) / 100);  // 0.3
```

**问题 2：Math.floor、Math.ceil 和 Math.round 的区别？**

```javascript
// 答案对比表
const num = 4.7;
const negNum = -4.7;

console.log('=== Math.floor（向下取整） ===');
console.log(Math.floor(num));       // 4（向-∞）
console.log(Math.floor(negNum));    // -5（向-∞）

console.log('\n=== Math.ceil（向上取整） ===');
console.log(Math.ceil(num));        // 5（向+∞）
console.log(Math.ceil(negNum));     // -4（向+∞）

console.log('\n=== Math.round（四舍五入） ===');
console.log(Math.round(4.5));       // 5
console.log(Math.round(4.4));       // 4
console.log(Math.round(-4.5));      // -4（向上）

console.log('\n=== Math.trunc（截断） ===');
console.log(Math.trunc(num));       // 4（向0）
console.log(Math.trunc(negNum));    // -4（向0）
```

**问题 3：如何生成 [min, max] 范围的随机整数？**

```javascript
// 完整的答案步骤

// 步骤 1: 理解 Math.random()
// Math.random() 返回 [0, 1) 的浮点数

// 步骤 2: 生成 [0, n) 的随机整数
function step2(n) {
  return Math.floor(Math.random() * n);
}

// 步骤 3: 生成 [min, max) 的随机整数
function step3(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// 步骤 4: 生成 [min, max] 的随机整数（包含两端）
function finalAnswer(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 验证
console.log(finalAnswer(1, 6));  // 骰子：1-6
console.log(finalAnswer(10, 20)); // 10-20
```

**问题 4：如何判断一个数是否为整数？**

```javascript
// 多种方法对比

// 方法 1: 使用 Number.isInteger()
Number.isInteger(5);      // true
Number.isInteger(5.0);    // true
Number.isInteger(5.1);    // false
Number.isInteger('5');    // false

// 方法 2: 使用 Math.floor/ceil
function isInteger(n) {
  return Math.floor(n) === n;
}

// 方法 3: 使用 %
function isInteger(n) {
  return n % 1 === 0;
}

// 方法 4: 使用 trunc
function isInteger(n) {
  return Math.trunc(n) === n;
}

// 特殊情况
console.log(Number.isInteger(NaN));       // false
console.log(Number.isInteger(Infinity));  // false
console.log(Number.isInteger(5.0));       // true（5.0 在 JS 中就是 5）
```

**问题 5：Math.max() 和 Math.min() 的陷阱是什么？**

```javascript
// 陷阱演示和解决方案

// 陷阱 1: 不能直接传数组
const arr = [1, 2, 3, 4, 5];
console.log(Math.max(arr));       // NaN ✗

// 解决 1: 使用扩展运算符
console.log(Math.max(...arr));    // 5 ✓

// 解决 2: 使用 reduce
console.log(arr.reduce((a, b) => Math.max(a, b)));  // 5 ✓

// 陷阱 2: 空调用返回 -Infinity 和 Infinity
console.log(Math.max());          // -Infinity ✗
console.log(Math.min());          // Infinity ✗

// 解决: 提供默认值
function safeMax(arr) {
  return arr.length ? Math.max(...arr) : -Infinity;
}

// 陷阱 3: NaN 传播
console.log(Math.max(5, NaN, 3)); // NaN ✗

// 解决: 过滤或验证
const validMax = Math.max(...arr.filter(x => !isNaN(x)));
```

### 深入思考题

**问题 6：设计一个性能优化的随机数生成器？**

```javascript
// 答案：结合不同场景的优化方案

class OptimizedRandom {
  constructor(seed = null) {
    this.seed = seed;
    // 如果提供了种子，使用确定性随机数生成器
    this.useSeededRandom = seed !== null;
  }

  // 线性同余生成器（LCGT）- 用于可复现的随机性
  seededRandom() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // 获取随机数
  random() {
    return this.useSeededRandom ? this.seededRandom() : Math.random();
  }

  // 优化：缓存常用范围
  int(max) {
    return Math.floor(this.random() * max);
  }

  range(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // 优化：预创建数组避免多次分配
  shuffle(arr, inPlace = false) {
    const result = inPlace ? arr : [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // 加权选择 - O(n) 时间复杂度
  weightedChoice(items, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random < 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  }
}

// 使用示例
const rng = new OptimizedRandom();
console.log(rng.range(1, 100));
console.log(rng.weightedChoice(['A', 'B', 'C'], [0.5, 0.3, 0.2]));
```

## 延伸阅读

### 相关概念深化

- **IEEE 754 标准**：了解浮点数的二进制表示，理解精度问题的根本原因
- **三角函数与复数**：掌握复数的表示和运算，理解欧拉公式
- **线性代数基础**：向量、矩阵运算，为 3D 图形学和机器学习做准备
- **数值分析**：误差分析、数值稳定性，优化计算精度

### 相关技术栈

```javascript
// 1. Big.js - 精确十进制算术
// import Big from 'big.js';
// const result = new Big(0.1).plus(0.2);

// 2. math.js - 完整的数学库
// const { sqrt, pow, sin, cos } = require('mathjs');

// 3. Decimal.js - 任意精度十进制
// const Decimal = require('decimal.js');
// new Decimal(0.1).plus(0.2);

// 4. Three.js - 3D 数学库（游戏、图形）
// import * as THREE from 'three';

// 5. Numeric.js - 科学计算库
// numerical linear algebra, numerical integration...
```

### 性能参考资源

- MDN Web Docs - Math 对象文档
- ECMAScript 规范 - 数学函数的定义
- V8 引擎优化 - Math 方法的实现细节
- WebAssembly - 高性能数学计算

### 实战项目推荐

1. **数据可视化图表库**：实践数据缩放、坐标计算
2. **2D 物理引擎**：实现速度、加速度、碰撞检测
3. **图像处理应用**：像素操作、滤镜效果
4. **实时通信游戏**：位置同步、距离计算、视野判断
5. **科学计算工具**：统计分析、数据处理

---

## 总结

JavaScript Math 对象虽然功能看似简单，但掌握其核心原理和最佳实践对开发高质量应用至关重要。特别是要理解浮点数精度问题、选择合适的取整方法、正确生成随机数、优化数学计算性能。通过本文的学习和实践，你将能够：

1. ✓ 熟练使用 Math 对象的各种方法
2. ✓ 理解浮点数精度问题并能够解决
3. ✓ 在实际项目中应用数学知识
4. ✓ 识别和避免常见陷阱
5. ✓ 优化数学密集操作的性能

继续深化学习，探索更多高级应用场景，你将成为一位懂数学的优秀前端工程师！
