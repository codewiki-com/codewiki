---
title: JavaScript Date 对象与日期处理
description: 全面掌握 JavaScript Date 对象的使用、时间戳、时区、日期计算和常见陷阱
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Date
  - 时间
  - 时区
  - 时间戳
status: imported
origin: old/src/content/docs/javascript/date-object.zh.md
divergence: 0.161
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: 内置对象
  order: 15
  lastUpdated: 2026-01-07
---

日期和时间处理是现代 Web 应用的核心需求。JavaScript 的 Date 对象提供了基本的日期/时间功能，但其设计存在许多陷阱。理解 Date 对象的原理和限制，掌握现代日期处理方案，对编写可靠的时间相关代码至关重要。

## 概念解释

### Date 对象是什么

Date 对象是 JavaScript 中用于处理日期和时间的内置对象。它内部存储一个数字，代表自 1970 年 1 月 1 日 00:00:00 UTC 以来的毫秒数（时间戳）。

### 时间戳（Timestamp）

时间戳是指自 Unix 纪元（1970-01-01T00:00:00Z）以来的毫秒数：

```javascript
// 创建 Date 对象
const now = new Date();
console.log(now); // 2026-01-07T...

// 获取时间戳（毫秒）
const timestamp = now.getTime();
console.log(timestamp); // 1735040000000

// 直接创建时间戳
const timestamp2 = Date.now();
console.log(timestamp2); // 1735040000000
```

### 三种核心时区概念

1. **UTC（协调世界时）**：国际标准时间
2. **本地时区**：用户设备的时区
3. **ISO 8601**：国际标准日期时间格式（`YYYY-MM-DDTHH:mm:ss.sssZ`）

```javascript
const date = new Date('2026-01-07T10:30:00Z');

// UTC 时间
console.log(date.toUTCString());
// "Wed, 07 Jan 2026 10:30:00 GMT"

// ISO 8601 格式
console.log(date.toISOString());
// "2026-01-07T10:30:00.000Z"

// 本地时间
console.log(date.toString());
// "Wed Jan 07 2026 18:30:00 GMT+0800 (China Standard Time)"
```

## 核心原理

### Date 对象的内部结构

Date 对象本质上是一个 64 位整数，存储毫秒级时间戳：

```javascript
// Date 对象的时间戳范围
const maxDate = new Date(8.64e15); // 公元 275760 年
const minDate = new Date(-8.64e15); // 公元前 271821 年

console.log(maxDate); // Date 的最大可表示时间
console.log(minDate); // Date 的最小可表示时间

// 获取时间戳
const timestamp = new Date().valueOf(); // 与 getTime() 相同
```

### 时区与 UTC 的关系

JavaScript Date 对象内部始终以 UTC 存储，但显示时使用本地时区：

```javascript
// 创建 Date 对象时，输入被解释为本地时间
const date1 = new Date(2026, 0, 7, 10, 30, 0);
console.log(date1);
// 内部存储的是相对于 UTC 的时间戳

// 但 getUTC* 方法始终返回 UTC 值
console.log(date1.getUTCHours()); // UTC 小时
console.log(date1.getHours());    // 本地小时

// 时差（毫秒）
const offset = date1.getTimezoneOffset() * 60 * 1000;
console.log(offset); // 本地时区偏移
```

### 月份的特殊性

Month 在 Date 中是 0-indexed（0=January, 11=December）：

```javascript
// 这是 2026 年 1 月（Month=0），不是 2 月！
const date = new Date(2026, 0, 15);
console.log(date.getMonth()); // 0

// 常见错误
const feb = new Date(2026, 1, 15); // 正确：二月
const mar = new Date(2026, 2, 15); // 三月

// 由此导致的陷阱
const month = 2; // 想表示 2 月
const wrongDate = new Date(2026, month, 15); // 实际是 3 月！
const correctDate = new Date(2026, month - 1, 15); // 正确
```

## 核心要点

### Date 对象的三种创建方式

```javascript
// 1. 当前时间
const now = new Date();

// 2. 时间戳（毫秒）
const fromTimestamp = new Date(1704067200000);

// 3. 日期字符串（需要谨慎）
const fromString = new Date('2026-01-07'); // 注意：被解释为 UTC
const fromString2 = new Date('2026-01-07T10:30:00'); // 本地时间

// 4. 年、月、日、时、分、秒（月份需要 -1）
const explicit = new Date(2026, 0, 7, 10, 30, 0);
```

### 获取日期组件

```javascript
const date = new Date(2026, 0, 15, 14, 30, 45, 123);

// 本地时间（Local）
console.log(date.getFullYear());   // 2026
console.log(date.getMonth());      // 0（一月）
console.log(date.getDate());       // 15（日期）
console.log(date.getDay());        // 4（星期四，0=周日）
console.log(date.getHours());      // 14
console.log(date.getMinutes());    // 30
console.log(date.getSeconds());    // 45
console.log(date.getMilliseconds()); // 123

// UTC 时间
console.log(date.getUTCFullYear());
console.log(date.getUTCMonth());
console.log(date.getUTCDate());
// ... 其他 UTC 方法
```

### 设置日期组件

```javascript
const date = new Date();

// 使用 setter 方法（注意返回值是时间戳）
date.setFullYear(2026);
date.setMonth(0); // 一月
date.setDate(7);
date.setHours(10);
date.setMinutes(30);

// 使用 UTC setter
date.setUTCFullYear(2026);
date.setUTCMonth(0);

// 直接修改时间戳
date.setTime(new Date('2026-01-07').getTime());
```

### 日期计算

```javascript
// 添加天数
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const today = new Date(2026, 0, 7);
const tomorrow = addDays(today, 1); // 2026-01-08
const nextWeek = addDays(today, 7); // 2026-01-14

// 添加月份
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

const nextMonth = addMonths(today, 1); // 2026-02-07

// 计算两个日期之间的毫秒数
const date1 = new Date(2026, 0, 7);
const date2 = new Date(2026, 0, 15);
const diffMs = date2 - date1; // 691200000 毫秒
const diffDays = diffMs / (1000 * 60 * 60 * 24); // 8 天
```

## 代码示例

### 示例 1：格式化日期字符串

```javascript
// 基础格式化函数
function formatDate(date, format) {
  const pad = (n) => String(n).padStart(2, '0');

  const map = {
    'YYYY': date.getFullYear(),
    'MM': pad(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds()),
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
}

const date = new Date(2026, 0, 7, 14, 30, 45);
console.log(formatDate(date, 'YYYY-MM-DD HH:mm:ss'));
// "2026-01-07 14:30:45"

// 使用 toLocaleDateString（浏览器依赖）
console.log(date.toLocaleDateString('zh-CN'));
// "2026/1/7"

// 使用 Intl API（推荐）
const formatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
console.log(formatter.format(date));
// "2026/01/07 14:30"
```

### 示例 2：日期范围计算

```javascript
// 获取本月的第一天和最后一天
function getMonthRange(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // 下个月的第 0 天
  return { firstDay, lastDay };
}

const range = getMonthRange(2026, 1);
console.log(range.firstDay); // 2026-01-01
console.log(range.lastDay);  // 2026-01-31

// 获取某年的所有工作日
function getWorkdaysInMonth(year, month) {
  const { firstDay, lastDay } = getMonthRange(year, month);
  const workdays = [];

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = new Date(d).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 排除周末
      workdays.push(new Date(d));
    }
  }

  return workdays;
}

const workdays = getWorkdaysInMonth(2026, 1);
console.log(`一月份有 ${workdays.length} 个工作日`);
```

### 示例 3：倒计时计时器

```javascript
class Countdown {
  constructor(targetDate, onTick, onComplete) {
    this.targetDate = new Date(targetDate).getTime();
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      const now = Date.now();
      const remaining = this.targetDate - now;

      if (remaining <= 0) {
        clearInterval(this.interval);
        this.onComplete?.();
        return;
      }

      // 计算时间差
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const seconds = Math.floor((remaining / 1000) % 60);

      this.onTick({ days, hours, minutes, seconds });
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
  }
}

// 使用示例
const target = new Date(2026, 0, 31).getTime(); // 1 月 31 日
const countdown = new Countdown(
  target,
  (time) => {
    console.log(`距离目标日期还有: ${time.days}天 ${time.hours}小时 ${time.minutes}分钟 ${time.seconds}秒`);
  },
  () => console.log('倒计时结束！')
);

countdown.start();
```

### 示例 4：时区转换

```javascript
// 获取特定时区的时间
function getTimeInTimezone(date, timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return formatter.format(date);
}

const now = new Date();

console.log(getTimeInTimezone(now, 'UTC'));
// "01/07/2026, 12:00:00"

console.log(getTimeInTimezone(now, 'Asia/Shanghai'));
// "01/07/2026, 20:00:00"

console.log(getTimeInTimezone(now, 'America/New_York'));
// "01/07/2026, 07:00:00"

// 获取所有可用时区
function getAllTimezones() {
  const intl = Intl;
  if (!intl.supportedValuesOf) return [];

  try {
    return intl.supportedValuesOf('timeZone');
  } catch (e) {
    return [];
  }
}

const timezones = getAllTimezones();
console.log(timezones.length); // 可用的时区数量
```

### 示例 5：判断是否为闰年

```javascript
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// 测试
console.log(isLeapYear(2024)); // true
console.log(isLeapYear(2025)); // false
console.log(isLeapYear(2000)); // true
console.log(isLeapYear(1900)); // false

// 获取某月的天数
function getDaysInMonth(year, month) {
  // month 是 1-indexed
  return new Date(year, month, 0).getDate();
}

console.log(getDaysInMonth(2024, 2)); // 29（闰年）
console.log(getDaysInMonth(2025, 2)); // 28（平年）
console.log(getDaysInMonth(2025, 1)); // 31
```

## 最佳实践

### 始终使用 UTC 进行存储

```javascript
// 不推荐：在本地时间工作，容易出错
const dateString = '2026-01-07 10:30:00'; // 含糊不清

// 推荐：显式使用 UTC
const date = new Date('2026-01-07T10:30:00Z'); // 明确 UTC 时间
const timestamp = 1704606600000; // 显式的时间戳

// 推荐：在服务器上生成时间戳
const now = Date.now(); // 总是 UTC 时间戳
```

### 避免直接解析日期字符串

```javascript
// 不推荐：浏览器实现不一致
const date1 = new Date('2026-01-07'); // 可能被解释为 UTC 或本地时间
const date2 = new Date('01/07/2026'); // 美国格式，容易混淆

// 推荐：明确指定 ISO 8601 格式
const date = new Date('2026-01-07T10:30:00Z'); // 明确是 UTC

// 推荐：使用时间戳或显式构造
const timestamp = Date.parse('2026-01-07T10:30:00Z');
const explicit = new Date(2026, 0, 7, 10, 30, 0); // 年、月-1、日...
```

### 小心 Month 索引（0-based）

```javascript
// 不推荐：容易搞混
function createDate(year, month, day) {
  return new Date(year, month, day);
}
const date1 = createDate(2026, 1, 7); // 是二月还是一月？

// 推荐：明确注释或使用常数
const MONTHS = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  // ...
};

function createDate(year, month, day) {
  return new Date(year, month, day);
}
const date = createDate(2026, MONTHS.JANUARY, 7);

// 或使用 ISO 字符串（1-indexed）
const date = new Date('2026-01-07');
```

### 使用现代库处理复杂日期

```javascript
// 原生 Date 适合简单操作
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// 复杂操作考虑使用库（Day.js 或 date-fns）
// 这些库更易用、更一致

// Day.js 示例
// const tomorrow = dayjs().add(1, 'day');

// date-fns 示例
// const tomorrow = addDays(new Date(), 1);
```

### 统一时区处理

```javascript
// 推荐：在应用中统一使用 UTC，在展示时转换为用户时区
class DateManager {
  // 内部总是使用 UTC
  constructor(isoString) {
    this.date = new Date(isoString);
  }

  // 获取 UTC 时间
  getUTC() {
    return this.date.toISOString();
  }

  // 获取用户时区的表示
  getLocal(userTimezone = 'Asia/Shanghai') {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return formatter.format(this.date);
  }

  // 用户输入时，明确该输入的时区
  static fromLocal(localString, timezone = 'Asia/Shanghai') {
    // 需要反向转换，通常在后端处理更安全
    throw new Error('在前端处理时区转换很复杂，建议后端处理');
  }
}
```

### 处理跨越月份边界的日期计算

```javascript
// 不推荐：可能导致意外结果
const date = new Date(2026, 0, 31); // 1 月 31 日
date.setMonth(date.getMonth() + 1);
console.log(date); // 3 月 3 日（溢出到 3 月！）

// 推荐：使用专门的日期库或自定义逻辑
function addMonthsSafe(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setMonth(result.getMonth() + months);

  // 如果日期溢出（例如 1 月 31 日 + 1 月 = 3 月 3 日）
  // 需要回溯到该月的最后一天
  if (result.getDate() !== originalDay) {
    result.setDate(0); // 上个月的最后一天
  }

  return result;
}

const jan31 = new Date(2026, 0, 31);
const feb28 = addMonthsSafe(jan31, 1); // 2 月 28 日
```

## 常见陷阱

### 陷阱 1：字符串解析的不一致性

```javascript
// 浏览器间行为不一致！
const date1 = new Date('2026-01-07');
// Chrome: 2026-01-07T00:00:00 (UTC)
// Safari: 2026-01-07T00:00:00 (Local)

// 解决方案：使用明确的 ISO 8601 格式
const date = new Date('2026-01-07T00:00:00Z'); // 明确 UTC
const date2 = new Date('2026-01-07T00:00:00+08:00'); // 明确时区

// 或使用时间戳
const timestamp = 1704067200000;
const date3 = new Date(timestamp);
```

### 陷阱 2：Month 是 0-indexed

```javascript
// 常见错误
const date = new Date(2026, 12, 25); // 不是 12 月 25 日！
console.log(date); // 2027 年 1 月 25 日

// 正确做法
const date = new Date(2026, 11, 25); // 12 月 25 日
const date2 = new Date('2026-12-25'); // 使用字符串更清晰
```

### 陷阱 3：日期可变性导致的 bug

```javascript
// 不推荐：直接修改日期对象
const date = new Date();
function processDate(d) {
  d.setDate(d.getDate() + 1); // 修改了原始对象！
  return d;
}

const original = new Date(2026, 0, 7);
const modified = processDate(original);
console.log(original); // 已被修改！2026-01-08

// 推荐：创建副本
function processDate(d) {
  const copy = new Date(d); // 创建副本
  copy.setDate(copy.getDate() + 1);
  return copy;
}

const original = new Date(2026, 0, 7);
const modified = processDate(original);
console.log(original); // 未改变：2026-01-07
console.log(modified); // 2026-01-08
```

### 陷阱 4：时区偏移的错误理解

```javascript
// 不推荐：假设时区偏移固定不变
const offset = new Date().getTimezoneOffset();
// 这个值会因夏令时变化而改变！

// 推荐：使用 Intl API 处理时区
function formatInTimezone(date, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Intl API 自动处理夏令时
console.log(formatInTimezone(new Date(), 'America/New_York'));
```

### 陷阱 5：NaN 日期的调试困难

```javascript
// 不推荐：创建无效日期
const invalid = new Date('not a date');
console.log(invalid); // Invalid Date
console.log(invalid.getTime()); // NaN

// 无效日期很难调试
if (invalid) { // 这不会触发！
  console.log('日期无效');
}

// 推荐：验证日期有效性
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

console.log(isValidDate(new Date())); // true
console.log(isValidDate(new Date('invalid'))); // false

// 推荐：显式检查解析结果
const timestamp = Date.parse('2026-01-07');
if (isNaN(timestamp)) {
  console.error('无法解析日期字符串');
} else {
  const date = new Date(timestamp);
}
```

## 性能考量

### Date 对象的创建成本

```javascript
// 测试：创建大量 Date 对象
console.time('create dates');
for (let i = 0; i < 1000000; i++) {
  const date = new Date();
}
console.timeEnd('create dates');
// 通常 < 100ms，性能还好

// 但如果需要大量日期计算，使用时间戳更快
console.time('timestamps');
for (let i = 0; i < 1000000; i++) {
  const ts = Date.now();
}
console.timeEnd('timestamps');
// 更快，尤其是高频调用
```

### 字符串解析 vs 时间戳

```javascript
// 字符串解析相对较慢
console.time('parse string');
for (let i = 0; i < 100000; i++) {
  new Date('2026-01-07T10:30:00Z');
}
console.timeEnd('parse string'); // ~50ms

// 使用时间戳快得多
console.time('timestamp');
for (let i = 0; i < 100000; i++) {
  new Date(1704606600000);
}
console.timeEnd('timestamp'); // ~1ms
```

### 优化日期频繁操作

```javascript
// 不推荐：频繁创建和解析
function expensiveLoop() {
  for (let i = 0; i < 1000; i++) {
    const date = new Date('2026-01-07');
    const formatted = date.toLocaleDateString();
  }
}

// 推荐：重用对象或使用时间戳
function optimizedLoop() {
  const baseDate = new Date('2026-01-07');
  const formatter = new Intl.DateTimeFormat('zh-CN');

  for (let i = 0; i < 1000; i++) {
    const workingDate = new Date(baseDate);
    workingDate.setDate(workingDate.getDate() + i);
    const formatted = formatter.format(workingDate);
  }
}

// 或使用时间戳
function timestampLoop() {
  const baseTimestamp = new Date('2026-01-07').getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 1000; i++) {
    const timestamp = baseTimestamp + i * oneDay;
    // 处理时间戳
  }
}
```

### Intl API 的缓存

```javascript
// 不推荐：每次都创建新的 formatter
function expensiveFormat(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// 推荐：缓存 formatter
const cachedFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function efficientFormat(date) {
  return cachedFormatter.format(date);
}

// 性能对比
console.time('不缓存');
for (let i = 0; i < 10000; i++) {
  expensiveFormat(new Date());
}
console.timeEnd('不缓存'); // ~200ms

console.time('缓存');
for (let i = 0; i < 10000; i++) {
  efficientFormat(new Date());
}
console.timeEnd('缓存'); // ~5ms
```

## 实战场景

### 场景 1：记录事件时间戳

```javascript
// 应用：用户行为追踪
class EventTracker {
  constructor() {
    this.events = [];
  }

  trackEvent(eventName, metadata = {}) {
    this.events.push({
      name: eventName,
      timestamp: Date.now(), // 使用时间戳
      isoString: new Date().toISOString(), // 供展示用
      ...metadata,
    });
  }

  getEventsSince(hours) {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events.filter(e => e.timestamp >= cutoff);
  }
}

const tracker = new EventTracker();
tracker.trackEvent('page_view', { page: '/home' });
tracker.trackEvent('button_click', { button_id: 'submit' });
console.log(tracker.getEventsSince(1)); // 过去 1 小时内的事件
```

### 场景 2：计算用户年龄

```javascript
function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  // 检查是否已经过了生日
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

const birthDate = new Date(2000, 0, 15); // 2000 年 1 月 15 日
console.log(calculateAge(birthDate)); // 26（2026 年时）

// 验证：检查下一个生日
function daysUntilBirthday(birthDate) {
  const today = new Date();
  let nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  const diff = nextBirthday - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

console.log(daysUntilBirthday(birthDate)); // 距离下一个生日的天数
```

### 场景 3：日程冲突检测

```javascript
class Event {
  constructor(name, startTime, endTime) {
    this.name = name;
    this.startTime = new Date(startTime);
    this.endTime = new Date(endTime);
  }

  overlaps(other) {
    return this.startTime < other.endTime &&
           this.endTime > other.startTime;
  }

  duration() {
    return (this.endTime - this.startTime) / (1000 * 60); // 分钟
  }
}

class Calendar {
  constructor() {
    this.events = [];
  }

  addEvent(event) {
    // 检查冲突
    for (const existing of this.events) {
      if (existing.overlaps(event)) {
        throw new Error(`事件冲突: "${existing.name}" 与 "${event.name}"`);
      }
    }
    this.events.push(event);
  }

  getEventsBetween(startTime, endTime) {
    return this.events.filter(e =>
      e.startTime >= startTime && e.endTime <= endTime
    );
  }
}

const calendar = new Calendar();
calendar.addEvent(new Event('会议 A', '2026-01-07T10:00:00Z', '2026-01-07T11:00:00Z'));
calendar.addEvent(new Event('会议 B', '2026-01-07T11:30:00Z', '2026-01-07T12:30:00Z')); // 不冲突

try {
  calendar.addEvent(new Event('会议 C', '2026-01-07T10:30:00Z', '2026-01-07T11:30:00Z')); // 冲突！
} catch (e) {
  console.error(e.message);
}
```

### 场景 4：生成周次日程表

```javascript
function getWeekDates(date) {
  const current = new Date(date);
  const first = current.getDate() - current.getDay(); // 周日

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(current.setDate(first + i));
    weekDates.push({
      date: new Date(weekDate),
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekDate.getDay()],
      formatted: weekDate.toLocaleDateString('zh-CN'),
    });
  }

  return weekDates;
}

const weekDates = getWeekDates(new Date(2026, 0, 7)); // 2026 年 1 月 7 日所在周
console.table(weekDates);
// 输出该周的每一天及其日期
```

### 场景 5：比较两个日期是否是同一天

```javascript
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

console.log(isSameDay(today, today)); // true
console.log(isSameDay(today, tomorrow)); // false
console.log(isSameDay(today, new Date())); // true（通常，取决于精确时间）
```

## 面试要点

### 面试问题 1：解释 JavaScript Date 对象的内部结构

**标准答案**：

JavaScript Date 对象内部存储一个 64 位整数，表示自 1970 年 1 月 1 日 00:00:00 UTC 以来的毫秒数。这称为 Unix 时间戳。Date 对象提供了获取和设置各个时间分量（年、月、日等）的方法。

```javascript
const date = new Date('2026-01-07T10:30:00Z');
console.log(date.getTime()); // 获取内部时间戳
// Date 在浏览器中的范围：±8.64e15 毫秒
```

**扩展**：
- 时间戳的最大值是 `8.64e15` 毫秒，对应公元 275760 年
- 最小值是 `-8.64e15` 毫秒，对应公元前 271821 年

### 面试问题 2：Month 为什么是 0-indexed？

**标准答案**：

这是 JavaScript 设计中的历史遗留问题，来源于 Java 的 Date 类。为了实现与 Java 的兼容性，JavaScript 采用了相同的设计。虽然现在看起来不合理，但为了向后兼容，无法改变。

```javascript
// Month 是 0-indexed
new Date(2026, 0, 7); // 一月（Month = 0）
new Date(2026, 11, 25); // 十二月（Month = 11）
```

**建议**：
- 使用常数避免混淆
- 使用日期字符串更明确：`new Date('2026-01-07')`

### 面试问题 3：为什么不应该直接解析日期字符串？

**标准答案**：

浏览器对日期字符串的解析实现不一致：
- ISO 8601 格式（`2026-01-07`）：不同浏览器的解释不同（UTC vs 本地时间）
- 其他格式可能完全不被支持

```javascript
// 不推荐：行为不一致
new Date('2026-01-07'); // 可能是 UTC，也可能是本地时间

// 推荐：明确指定格式
new Date('2026-01-07T10:30:00Z'); // 明确 UTC
new Date('2026-01-07T10:30:00+08:00'); // 明确时区
new Date(2026, 0, 7); // 显式构造
```

### 面试问题 4：如何检查 Date 对象是否有效？

**标准答案**：

```javascript
function isValidDate(value) {
  if (!(value instanceof Date)) return false;
  return !isNaN(value.getTime());
}

console.log(isValidDate(new Date())); // true
console.log(isValidDate(new Date('invalid'))); // false
console.log(isValidDate('2026-01-07')); // false（不是 Date 实例）
```

### 面试问题 5：如何在 JavaScript 中进行跨时区的日期计算？

**标准答案**：

JavaScript Date 对象总是内部用 UTC 存储，但在不同时区显示。Intl API 提供了跨时区的解决方案：

```javascript
// 方案 1：使用 Intl 格式化器
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

console.log(formatter.format(new Date()));

// 方案 2：在服务器进行转换（推荐）
// 在后端使用支持时区的库（如 Python 的 pytz、Node.js 的 moment-timezone）
```

**注意**：
- 在前端进行复杂时区计算很困难
- 建议在服务器端处理时区
- 始终在数据库中存储 UTC 时间

## 延伸阅读

### 现代日期处理库

虽然原生 Date 可以处理基本需求，但对于复杂场景，推荐使用现代库：

1. **Day.js** - 轻量级（仅 2KB），API 与 Moment.js 兼容
   ```javascript
   // dayjs().add(1, 'day').format('YYYY-MM-DD')
   ```

2. **date-fns** - 模块化，功能齐全，Tree-shakeable
   ```javascript
   // addDays(new Date(), 1)
   ```

3. **Luxon** - 为现代 JavaScript 设计，强大的时区支持
   ```javascript
   // DateTime.now().plus({ days: 1 })
   ```

### 为什么不使用 Moment.js？

Moment.js 虽然功能强大，但：
- 体积大（67KB）
- 已进入"维护模式"，不再推荐用于新项目
- 官方建议迁移到 Day.js、date-fns 或 Luxon

### 深入了解的主题

1. **时间戳精度**：JavaScript 使用毫秒精度，某些应用可能需要微秒级（需自定义实现）

2. **时区的历史**：不同地区的时区规则随时间变化，包括夏令时的变更

3. **闰秒**：UTC 每隔几年会增加闰秒，大多数系统（包括 JavaScript）忽略这一点

4. **日历系统**：不同文化使用不同的日历（如伊斯兰历、中国农历），标准库不支持

5. **性能优化**：在高频时间操作中，使用时间戳而非 Date 对象可显著提升性能

---

**记住**：处理日期是软件开发中最容易出错的部分。始终：
- 在内部使用 UTC
- 清楚地记录时区假设
- 在展示时明确进行转换
- 对复杂场景使用经过测试的库
