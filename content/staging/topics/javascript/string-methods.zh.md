---
title: JavaScript 字符串方法完整指南
description: 掌握所有 JavaScript 字符串方法，包括 slice、substring、split、replace、replaceAll、trim、padStart 等
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - strings
  - methods
  - text manipulation
status: imported
origin: old/src/content/docs/javascript/string-methods.zh.md
divergence: 0.22
issues: []
legacy:
  category: JavaScript
  subcategory: Built-in Objects
  order: 22
  lastUpdated: 2026-01-07
---

字符串是 JavaScript 中最基本的数据类型之一，掌握字符串方法对于高效编程至关重要。本综合指南通过实用示例涵盖所有重要的字符串方法。

## 概念解释

JavaScript 中的字符串是不可变的字符序列。字符串方法允许你检查、操作、转换和分析字符串数据，而不会修改原始字符串。所有字符串方法都返回新值，而不是修改字符串本身，因为 JavaScript 中的字符串是不可变的。

字符串方法分为几类：
- **提取方法**：提取字符串的部分（slice、substring、substr）
- **搜索方法**：查找字符或子字符串（indexOf、includes、search）
- **大小写方法**：更改字符大小写（toUpperCase、toLowerCase）
- **转换方法**：将字符串转换为数组并操作内容（split、replace、replaceAll）
- **修剪方法**：删除空白字符（trim、trimStart、trimEnd）
- **填充方法**：向字符串添加字符（padStart、padEnd）
- **字符方法**：处理单个字符（charAt、charCodeAt）

## 核心原则

### 不可变性

JavaScript 中的字符串是不可变的。所有字符串方法都返回新字符串，而不是修改原始字符串：

```javascript
const original = 'Hello World';
const modified = original.toUpperCase();

console.log(original); // 'Hello World' (未改变)
console.log(modified); // 'HELLO WORLD' (新字符串)
```

### 从零开始的索引

大多数字符串方法使用从零开始的索引，意味着第一个字符在索引 0 处：

```javascript
const str = 'JavaScript';
console.log(str[0]);      // 'J'
console.log(str.charAt(0)); // 'J'
console.log(str[10]);     // undefined (超出范围)
```

### 方法链

许多字符串方法可以链接在一起，因为它们返回新字符串：

```javascript
const result = '  hello world  '
  .trim()
  .split(' ')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

console.log(result); // 'Hello World'
```

## 要点

1. **字符串是不可变的** - 所有方法都返回新字符串
2. **从零开始的索引** - 第一个字符在索引 0 处
3. **Unicode 支持** - JavaScript 字符串支持 Unicode 字符
4. **方法链** - 大多数字符串方法可以链接
5. **正则表达式** - 许多方法支持正则表达式模式
6. **性能权衡** - 重复连接比 join() 慢
7. **区分大小写** - 比较方法默认区分大小写
8. **负索引** - slice() 支持负索引，substring() 不支持

## 提取方法

### slice()

提取字符串的一部分而不修改原始字符串。

```javascript
const str = 'JavaScript';

// slice(start, end) - end 不包含
console.log(str.slice(0, 4));    // 'Java'
console.log(str.slice(4));       // 'Script'
console.log(str.slice());        // 'JavaScript'

// 负索引从末尾计数
console.log(str.slice(-6));      // 'Script'
console.log(str.slice(-6, -2));  // 'Scri'
console.log(str.slice(0, -6));   // 'Java'

// 无效范围返回空结果
console.log(str.slice(5, 2));    // '' (start > end)

// 实用示例：删除文件扩展名
const filename = 'document.pdf';
const nameOnly = filename.slice(0, -4); // 'document'
console.log(nameOnly);
```

### substring()

提取字符串的一部分（不支持负索引）。

```javascript
const str = 'JavaScript';

// substring(start, end) - end 不包含
console.log(str.substring(0, 4));    // 'Java'
console.log(str.substring(4));       // 'Script'
console.log(str.substring());        // 'JavaScript'

// 与 slice 不同，如果 start > end 则交换参数
console.log(str.substring(5, 2));    // 'vas' (与 substring(2, 5) 相同)

// 负索引被视为 0
console.log(str.substring(-3));      // 'JavaScript' (与 substring(0) 相同)

// 与 slice 的区别
const text = 'Hello World';
console.log(text.slice(-5));         // 'World'
console.log(text.substring(-5));     // 'Hello World' (负数视为 0)
```

### substr()

从索引开始提取指定长度的字符串部分。（已弃用 - 建议使用 slice 或 substring）

```javascript
const str = 'JavaScript';

// substr(start, length)
console.log(str.substr(0, 4));    // 'Java'
console.log(str.substr(4, 6));    // 'Script'
console.log(str.substr(-6));      // 'Script' (负索引从末尾计数)
console.log(str.substr(-6, 3));   // 'Scr'

// 注意：此方法已弃用，请使用 slice() 代替
```

### charAt()

获取特定索引处的字符。

```javascript
const str = 'Hello';

console.log(str.charAt(0));    // 'H'
console.log(str.charAt(1));    // 'e'
console.log(str.charAt(10));   // '' (超出范围返回空字符串)

// 获取最后一个字符
console.log(str.charAt(str.length - 1)); // 'o'

// 方括号表示法替代（现代方式）
console.log(str[0]);           // 'H'
console.log(str[10]);          // undefined (与 charAt 不同)
```

### charCodeAt()

获取特定索引处的 Unicode 代码单元。

```javascript
const str = 'ABC';

console.log(str.charCodeAt(0)); // 65 ('A' 的代码)
console.log(str.charCodeAt(1)); // 66 ('B' 的代码)
console.log(str.charCodeAt(2)); // 67 ('C' 的代码)
console.log(str.charCodeAt(10)); // NaN (超出范围)

// 转换回字符
const code = 65;
console.log(String.fromCharCode(code)); // 'A'

// 处理多个字符
const codes = 'Hello'.split('').map(char => char.charCodeAt(0));
console.log(codes); // [72, 101, 108, 108, 111]
```

### codePointAt()

获取特定索引处的 Unicode 码点（更适合表情符号和特殊字符）。

```javascript
const str = 'Hello🌍World';

console.log(str.codePointAt(0));  // 72 (H)
console.log(str.codePointAt(5));  // 127757 (🌍 表情符号)

// 转换回字符
const codePoint = 127757;
console.log(String.fromCodePoint(codePoint)); // '🌍'

// 正确处理表情符号
const emoji = '👨‍👩‍👧‍👦';
for (let i = 0; i < emoji.length; i++) {
  console.log(emoji.codePointAt(i));
}
```

## 搜索和定位方法

### indexOf()

查找子字符串首次出现的索引。

```javascript
const str = 'Hello World Hello';

console.log(str.indexOf('o'));       // 4
console.log(str.indexOf('World'));   // 6
console.log(str.indexOf('xyz'));     // -1 (未找到)

// 带起始位置
console.log(str.indexOf('o', 5));    // 7 (索引 5 之后的第一个 'o')
console.log(str.indexOf('Hello', 1)); // 12 (第二个 'Hello')

// 区分大小写
console.log(str.indexOf('hello'));   // -1 (小写)

// 检查子字符串是否存在
if (str.indexOf('World') !== -1) {
  console.log('Found!');
}

// 查找所有出现位置
function findAllOccurrences(str, substring) {
  const positions = [];
  let index = 0;
  while ((index = str.indexOf(substring, index)) !== -1) {
    positions.push(index);
    index += substring.length;
  }
  return positions;
}

console.log(findAllOccurrences('Hello World Hello', 'o')); // [4, 7, 14]
```

### lastIndexOf()

查找子字符串最后一次出现的索引。

```javascript
const str = 'Hello World Hello';

console.log(str.lastIndexOf('o'));       // 14
console.log(str.lastIndexOf('Hello'));   // 12
console.log(str.lastIndexOf('xyz'));     // -1 (未找到)

// 从位置向后搜索
console.log(str.lastIndexOf('o', 10));   // 7 (索引 10 或之前的最后一个 'o')

// 获取最后一个单词
function getLastWord(str) {
  const lastSpace = str.lastIndexOf(' ');
  return lastSpace === -1 ? str : str.slice(lastSpace + 1);
}

console.log(getLastWord('Hello World Hello')); // 'Hello'
```

### includes()

检查字符串是否包含子字符串。

```javascript
const str = 'Hello World';

console.log(str.includes('World'));  // true
console.log(str.includes('xyz'));    // false

// 区分大小写
console.log(str.includes('world'));  // false

// 带起始位置
console.log(str.includes('World', 6)); // true
console.log(str.includes('World', 7)); // false

// 实用：URL 验证
function isValidProtocol(url) {
  return url.includes('http://') || url.includes('https://');
}

console.log(isValidProtocol('https://example.com')); // true
```

### search()

查找正则表达式或子字符串首次匹配的索引。

```javascript
const str = 'Hello World';

// 搜索子字符串
console.log(str.search('World'));    // 6
console.log(str.search('xyz'));      // -1

// 使用正则表达式搜索
console.log(str.search(/o/));        // 4 (第一个 'o')
console.log(str.search(/o/i));       // 4 (不区分大小写)
console.log(str.search(/[aeiou]/i)); // 1 (第一个元音)

// 查找第一个数字
const text = 'abc123def456';
console.log(text.search(/\d/));      // 3
```

### match()

查找正则表达式的所有匹配项。

```javascript
const str = 'Hello World 123';

// 带全局标志的匹配
console.log(str.match(/\w+/g));      // ['Hello', 'World', '123']
console.log(str.match(/\d+/g));      // ['123']

// 不带全局标志的匹配（返回带附加信息的数组）
const match = str.match(/(\w+)\s(\w+)/);
console.log(match);
// ['Hello World', 'Hello', 'World', index: 0, ...]

// 提取电子邮件地址
const text = 'Contact: alice@example.com or bob@test.org';
const emails = text.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
console.log(emails); // ['alice@example.com', 'bob@test.org']

// 无匹配返回 null
console.log('xyz'.match(/\d/)); // null
```

### matchAll()

查找正则表达式的所有匹配项及捕获组。

```javascript
const str = 'test1 test2 test3';

// 需要全局标志
const regex = /test(\d)/g;
const matches = [...str.matchAll(regex)];

for (const match of matches) {
  console.log(match[0]); // 完整匹配
  console.log(match[1]); // 第一个捕获组
}
// test1, 1
// test2, 2
// test3, 3

// 提取结构化数据
const log = '2026-01-07 ERROR 404 not found\n2026-01-07 WARN 503 unavailable';
const pattern = /(\d{4}-\d{2}-\d{2})\s(\w+)\s(\d+)/g;

for (const [full, date, level, code] of log.matchAll(pattern)) {
  console.log(`${date}: ${level} (${code})`);
}
```

### startsWith()

检查字符串是否以特定子字符串开头。

```javascript
const str = 'Hello World';

console.log(str.startsWith('Hello'));  // true
console.log(str.startsWith('hello'));  // false (区分大小写)
console.log(str.startsWith('World'));  // false

// 带起始位置
console.log(str.startsWith('World', 6)); // true

// 实用：文件类型检查
function isImageFile(filename) {
  return filename.toLowerCase().endsWith('.jpg') ||
         filename.toLowerCase().endsWith('.png') ||
         filename.toLowerCase().endsWith('.gif');
}

// 协议检查
function isHttpUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}
```

### endsWith()

检查字符串是否以特定子字符串结尾。

```javascript
const str = 'Hello World';

console.log(str.endsWith('World'));     // true
console.log(str.endsWith('world'));     // false (区分大小写)
console.log(str.endsWith('Hello'));     // false

// 带长度参数（检查子字符串的结尾）
console.log(str.endsWith('Hello', 5));  // true

// 文件扩展名检查
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1);
}

function isJsonFile(filename) {
  return filename.endsWith('.json');
}

// 内容类型检查
const supportedFormats = ['.pdf', '.doc', '.docx', '.txt'];
function isSupportedFormat(filename) {
  return supportedFormats.some(format => filename.endsWith(format));
}
```

## 大小写方法

### toUpperCase()

将所有字符转换为大写。

```javascript
const str = 'Hello World';

console.log(str.toUpperCase());     // 'HELLO WORLD'

// 适用于 Unicode
const international = 'café';
console.log(international.toUpperCase()); // 'CAFÉ'

// 实用：标准化用户输入
function normalizeCommand(input) {
  return input.trim().toUpperCase();
}

// 转换单词数组
const words = ['hello', 'world'];
const uppercase = words.map(word => word.toUpperCase());
console.log(uppercase); // ['HELLO', 'WORLD']
```

### toLowerCase()

将所有字符转换为小写。

```javascript
const str = 'Hello World';

console.log(str.toLowerCase());     // 'hello world'

// 不区分大小写的比较
function caseInsensitiveEqual(str1, str2) {
  return str1.toLowerCase() === str2.toLowerCase();
}

console.log(caseInsensitiveEqual('Hello', 'HELLO')); // true

// 标准化电子邮件地址
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// 创建 URL 友好的 slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

console.log(createSlug('Hello World!')); // 'hello-world'
```

### toLocaleUpperCase()

使用特定区域设置规则转换为大写。

```javascript
// 大多数字符与 toUpperCase() 相同
console.log('hello'.toLocaleUpperCase());     // 'HELLO'

// 区域设置对某些语言很重要
const turkish = 'istanbul';
console.log(turkish.toLocaleUpperCase('tr-TR')); // 'İSTANBUL' (带点的大写 I)
console.log(turkish.toUpperCase());              // 'ISTANBUL' (不带点的大写 I)
```

### toLocaleLowerCase()

使用特定区域设置规则转换为小写。

```javascript
// 大多数字符与 toLowerCase() 相同
console.log('HELLO'.toLocaleLowerCase());     // 'hello'

// 区域设置对某些语言很重要
const german = 'STRASSE';
console.log(german.toLocaleLowerCase('de-DE')); // 'straße' (德语 ß)
console.log(german.toLowerCase());               // 'strasse'
```

## 转换方法

### split()

将字符串拆分为子字符串数组。

```javascript
const str = 'Hello World JavaScript';

// 按空格拆分
console.log(str.split(' '));        // ['Hello', 'World', 'JavaScript']

// 拆分每个字符
console.log(str.split(''));         // ['H', 'e', 'l', 'l', 'o', ...]

// 按模式拆分
console.log(str.split('o'));        // ['Hell', ' W', 'rld JavaScript']

// 限制拆分数量
console.log(str.split(' ', 2));     // ['Hello', 'World']

// 使用正则表达式拆分
const csv = 'name,age,city';
console.log(csv.split(','));        // ['name', 'age', 'city']

const mixed = 'hello123world456';
console.log(mixed.split(/\d+/));    // ['hello', 'world', '']

// 解析 CSV 行
function parseCSVLine(line) {
  return line.split(',').map(field => field.trim());
}

// 将电子邮件拆分为用户和域
const email = 'user@example.com';
const [user, domain] = email.split('@');
console.log(user, domain); // 'user', 'example.com'

// 带捕获组的拆分
const text = 'hello123world456';
const parts = text.split(/(\d+)/);
console.log(parts); // ['hello', '123', 'world', '456', '']
```

### replace()

替换子字符串或模式的第一次出现。

```javascript
const str = 'Hello World, Hello Universe';

// 替换第一次出现
console.log(str.replace('Hello', 'Hi'));
// 'Hi World, Hello Universe'

// 使用带全局标志的正则表达式替换
console.log(str.replace(/Hello/g, 'Hi'));
// 'Hi World, Hi Universe'

// 使用函数替换
const replaced = str.replace(/Hello/g, (match) => match.toLowerCase());
console.log(replaced); // 'hello World, hello Universe'

// 使用捕获组替换
const date = '2026-01-07';
console.log(date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1'));
// '07/01/2026'

// 带所有参数的函数替换
const result = 'test123test456'.replace(/test(\d+)/g, (match, group1, offset, string) => {
  console.log(`Match: ${match}, Group: ${group1}, Offset: ${offset}`);
  return group1;
});
// Match: test123, Group: 123, Offset: 0
// Match: test456, Group: 456, Offset: 8

// 实用：驼峰命名转蛇形命名
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
console.log(camelToSnake('helloWorld')); // 'hello_world'

// HTML 转义
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### replaceAll()

替换子字符串或模式的所有出现。

```javascript
const str = 'Hello World, Hello Universe, Hello World';

// 使用字符串替换所有
console.log(str.replaceAll('Hello', 'Hi'));
// 'Hi World, Hi Universe, Hi World'

// 使用正则表达式替换（需要全局标志）
console.log(str.replaceAll(/Hello/g, 'Hi'));
// 'Hi World, Hi Universe, Hi World'

// 使用函数替换
const result = str.replaceAll('Hello', (match) => match.toLowerCase());
console.log(result);
// 'hello World, hello Universe, hello World'

// 删除所有空白
function removeWhitespace(str) {
  return str.replaceAll(/\s+/g, '');
}
console.log(removeWhitespace('Hello World')); // 'HelloWorld'

// 替换模板变量
function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

const template = 'Hello {{name}}, welcome to {{place}}!';
const vars = { name: 'Alice', place: 'Wonderland' };
console.log(replaceVariables(template, vars));
// 'Hello Alice, welcome to Wonderland!'
```

### repeat()

通过重复原始字符串多次创建新字符串。

```javascript
const str = 'Hello';

console.log(str.repeat(3));         // 'HelloHelloHello'
console.log(str.repeat(1));         // 'Hello'
console.log(str.repeat(0));         // ''

// 创建模式
console.log('='.repeat(20));        // '===================='

// 实用：创建缩进
function indent(text, level, spaces = 2) {
  return ' '.repeat(level * spaces) + text;
}

console.log(indent('code', 2));     // '    code'

// 创建进度条
function progressBar(percent) {
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  return '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
}

console.log(progressBar(75)); // '[===============     ]'
```

## 修剪和填充方法

### trim()

删除字符串两端的空白字符。

```javascript
const str = '  Hello World  ';

console.log(str.trim());            // 'Hello World'
console.log(str.trim().length);     // 11

// 适用于各种空白字符
const whitespace = '\t\n  Text  \r\n';
console.log(whitespace.trim());     // 'Text'

// 实用：清理用户输入
function cleanUserInput(input) {
  return input.trim().replace(/\s+/g, ' ');
}

console.log(cleanUserInput('  hello   world  ')); // 'hello world'

// 验证非空输入
function isNonEmpty(str) {
  return str.trim().length > 0;
}
```

### trimStart() (trimLeft())

删除字符串开头的空白字符。

```javascript
const str = '  Hello World  ';

console.log(str.trimStart());       // 'Hello World  '
console.log(str.trimLeft());        // 'Hello World  ' (别名)

// 删除前导缩进
const indented = '    code';
console.log(indented.trimStart());  // 'code'

// 删除前导零
function removeLeadingZeros(str) {
  return str.trimStart() > '0' ? str.trim() : '0';
}
```

### trimEnd() (trimRight())

删除字符串末尾的空白字符。

```javascript
const str = '  Hello World  ';

console.log(str.trimEnd());         // '  Hello World'
console.log(str.trimRight());       // '  Hello World' (别名)

// 删除尾随换行符
const withNewline = 'text\n';
console.log(withNewline.trimEnd()); // 'text'

// 删除多行中的尾随空格
function trimLines(text) {
  return text.split('\n').map(line => line.trimEnd()).join('\n');
}
```

### padStart()

在字符串开头填充以达到目标长度。

```javascript
const str = '42';

console.log(str.padStart(5));       // '   42' (空格)
console.log(str.padStart(5, '0'));  // '00042' (零)
console.log(str.padStart(5, '-'));  // '---42' (破折号)

// 格式化数字
const numbers = [5, 42, 123];
numbers.forEach(num => {
  console.log(String(num).padStart(4, '0'));
});
// 0005
// 0042
// 0123

// 实用：右对齐文本
function rightAlign(text, width) {
  return text.padStart(width);
}

// 格式化时间
function formatTime(hours, minutes, seconds) {
  return [hours, minutes, seconds]
    .map(num => String(num).padStart(2, '0'))
    .join(':');
}

console.log(formatTime(9, 5, 3)); // '09:05:03'

// 创建列对齐
const items = ['Name', 'Age', 'City'];
items.forEach(item => {
  console.log(item.padStart(10) + ' | Data');
});
```

### padEnd()

在字符串末尾填充以达到目标长度。

```javascript
const str = '42';

console.log(str.padEnd(5));         // '42   ' (空格)
console.log(str.padEnd(5, '.'));    // '42...' (点)
console.log(str.padEnd(5, '*'));    // '42***' (星号)

// 创建类似表格的格式
const items = ['Name', 'Age', 'City'];
items.forEach(item => {
  console.log(item.padEnd(15) + '| Data');
});

// 创建加载动画
function createLoadingBar(filled, total) {
  return '[' + '█'.repeat(filled).padEnd(total, '░') + ']';
}

console.log(createLoadingBar(3, 10)); // '[███░░░░░░░]'
```

## 匹配和替换方法

### localeCompare()

根据排序顺序比较两个字符串。

```javascript
const str1 = 'apple';
const str2 = 'banana';
const str3 = 'apple';

console.log(str1.localeCompare(str2)); // -1 (str1 < str2)
console.log(str2.localeCompare(str1)); // 1 (str2 > str1)
console.log(str1.localeCompare(str3)); // 0 (相等)

// 排序字符串数组
const fruits = ['banana', 'apple', 'cherry', 'date'];
fruits.sort((a, b) => a.localeCompare(b));
console.log(fruits); // ['apple', 'banana', 'cherry', 'date']

// 不区分大小写排序
const words = ['Zebra', 'apple', 'Banana'];
words.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
console.log(words); // ['apple', 'Banana', 'Zebra']

// 区域感知排序
const names = ['Ä', 'Z', 'A'];
console.log(names.sort((a, b) => a.localeCompare(b, 'de')));
```

## 模板和格式化方法

### concat()

连接字符串。

```javascript
const str1 = 'Hello';
const str2 = 'World';

console.log(str1.concat(' ', str2));           // 'Hello World'
console.log(str1.concat(' ', str2, '!'));      // 'Hello World!'

// 多个参数
console.log('a'.concat('b', 'c', 'd'));        // 'abcd'

// 通常使用模板字面量代替
const result = `${str1} ${str2}`; // 更好的方法
```

## 字符方法

### charAt()

获取特定索引处的字符（前面已详细介绍）。

```javascript
const str = 'Hello';

console.log(str.charAt(0));         // 'H'
console.log(str.charAt(4));         // 'o'
console.log(str.charAt(10));        // '' (空字符串)

// 查找最频繁的字符
function mostFrequentChar(str) {
  const counts = {};
  for (const char of str) {
    counts[char] = (counts[char] || 0) + 1;
  }
  return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

console.log(mostFrequentChar('hello')); // 'l'
```

### charCodeAt() 和 codePointAt()

获取字符代码（前面已详细介绍）。

```javascript
// 验证密码强度
function checkPasswordStrength(password) {
  let hasUppercase = false;
  let hasLowercase = false;
  let hasDigit = false;

  for (const char of password) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) hasUppercase = true;      // A-Z
    if (code >= 97 && code <= 122) hasLowercase = true;     // a-z
    if (code >= 48 && code <= 57) hasDigit = true;          // 0-9
  }

  return hasUppercase && hasLowercase && hasDigit;
}

console.log(checkPasswordStrength('Password123')); // true
```

## 重复和复制

### repeat()

重复字符串多次（前面已详细介绍）。

```javascript
// 创建分隔符
console.log('='.repeat(50));

// 复制数据
const item = 'item';
console.log(item.repeat(3)); // 'itemitemitem'

// 创建缩进级别
function createIndent(level) {
  return '  '.repeat(level);
}

for (let i = 0; i < 3; i++) {
  console.log(createIndent(i) + 'Level ' + i);
}
```

## 最佳实践

### 使用模板字面量进行字符串插值

```javascript
// 不好：连接
const name = 'Alice';
const greeting = 'Hello ' + name + ', welcome!';

// 好：模板字面量
const greeting = `Hello ${name}, welcome!`;

// 多行字符串
const html = `
  <div>
    <p>Hello ${name}</p>
  </div>
`;
```

### 使用适当的方法完成任务

```javascript
// 检查存在性：使用 includes()
if (str.includes('world')) { /* ... */ }

// 提取：使用 slice() 或 substring()
const extracted = str.slice(0, 5);

// 替换：使用 replace() 或 replaceAll()
const modified = str.replaceAll('old', 'new');

// 拆分：使用 split()
const parts = str.split(' ');
```

### 考虑大型字符串的性能

```javascript
// 不好：多次字符串连接
let result = '';
for (let i = 0; i < 1000; i++) {
  result += 'item' + i + ', ';
}

// 好：使用数组和 join()
const items = [];
for (let i = 0; i < 1000; i++) {
  items.push(`item${i}`);
}
const result = items.join(', ');

// 也好：带 join 的模板字面量
const results = Array.from({ length: 1000 }, (_, i) => `item${i}`).join(', ');
```

### 正确使用不区分大小写的比较

```javascript
// 不好：直接比较
if (userInput === 'admin') { /* ... */ }

// 好：不区分大小写的比较
if (userInput.toLowerCase() === 'admin') { /* ... */ }

// 更好：使用 localeCompare
if (userInput.localeCompare('admin', undefined, { sensitivity: 'base' }) === 0) { /* ... */ }
```

### 验证和清理输入

```javascript
function validateUsername(username) {
  // 修剪空白
  const trimmed = username.trim();

  // 检查长度
  if (trimmed.length < 3 || trimmed.length > 20) {
    return false;
  }

  // 检查有效字符（字母数字和下划线）
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return false;
  }

  return true;
}
```

## 常见陷阱

### 忘记字符串是不可变的

```javascript
const str = 'Hello';
str.toUpperCase(); // 这不会修改 str！
console.log(str);  // 仍然是 'Hello'

// 正确方式
const upper = str.toUpperCase();
console.log(upper); // 'HELLO'
```

### 混淆 slice() 和 substring()

```javascript
const str = 'Hello World';

// slice() 支持负索引
console.log(str.slice(-5));        // 'World'

// substring() 将负数视为 0
console.log(str.substring(-5));    // 'Hello World'

// slice(2, 1) 返回空
console.log(str.slice(2, 1));      // ''

// substring 在需要时交换参数
console.log(str.substring(2, 1));  // 'e'
```

### replace() 的正则表达式标志

```javascript
const str = 'Hello hello hello';

// 没有全局标志，只匹配第一个
console.log(str.replace(/hello/i, 'Hi'));
// 'Hi hello hello'

// 有全局标志，匹配所有
console.log(str.replace(/hello/gi, 'Hi'));
// 'Hi Hi Hi'
```

### 差一错误

```javascript
const str = 'Hello';

// slice(1, 4) 返回索引 1、2、3 处的字符（不包括 4）
console.log(str.slice(1, 4));      // 'ell'

// indexOf + substring
const index = str.indexOf('l');
console.log(str.substring(0, index)); // 'He'
console.log(str.substring(index));    // 'llo'
```

### 不处理边缘情况

```javascript
// 不好：不处理空字符串
function getFirstChar(str) {
  return str.charAt(0);
}

getFirstChar(''); // 返回 ''

// 好：处理边缘情况
function getFirstChar(str) {
  if (!str || str.length === 0) {
    return null;
  }
  return str.charAt(0);
}
```

## 性能考虑

### 字符串连接 vs 数组 Join

```javascript
// 基准测试：连接 vs join

const items = Array.from({ length: 10000 }, (_, i) => `item${i}`);

// 慢：字符串连接
console.time('concatenation');
let result1 = '';
for (const item of items) {
  result1 += item + ',';
}
console.timeEnd('concatenation');
// ~50-100ms

// 快：Array.join()
console.time('join');
const result2 = items.join(',');
console.timeEnd('join');
// ~1-5ms

// 结果：对于大型数组，join() 比连接快 10-50 倍
```

### 正则表达式性能

```javascript
// 低效：重复创建正则表达式
function findDates(text) {
  return text.match(/\d{4}-\d{2}-\d{2}/g);
}

// 高效：重用正则表达式模式
const dateRegex = /\d{4}-\d{2}-\d{2}/g;
function findDates(text) {
  return text.match(dateRegex);
}

// 注意：带全局标志时，重置 lastIndex 或避免重用
const regex = /\d+/g;
console.log(regex.exec('a1b2')); // ['1', ...]
console.log(regex.exec('a1b2')); // ['2', ...] (继续)
regex.lastIndex = 0;             // 为新搜索重置
console.log(regex.exec('a1b2')); // ['1', ...] (重新开始)
```

### 字符串方法链

```javascript
// 多次迭代字符串
const text = '  hello world  ';

// 创建中间字符串
const step1 = text.trim();                 // 'hello world'
const step2 = step1.split(' ');            // ['hello', 'world']
const step3 = step2.map(w => w.toUpperCase()).join(' '); // 'HELLO WORLD'

// 单链（首选）
const result = text
  .trim()
  .split(' ')
  .map(w => w.toUpperCase())
  .join(' ');

// 两者性能相同，链更易读
```

## 实际场景

### 电子邮件验证和标准化

```javascript
function validateAndNormalizeEmail(email) {
  // 修剪并转换为小写
  const normalized = email.trim().toLowerCase();

  // 基本电子邮件正则表达式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    throw new Error('Invalid email format');
  }

  return normalized;
}

console.log(validateAndNormalizeEmail('  ALICE@EXAMPLE.COM  ')); // 'alice@example.com'
```

### URL Slug 生成

```javascript
function generateSlug(title) {
  return title
    .toLowerCase()                    // 转换为小写
    .trim()                          // 删除空白
    .replace(/\s+/g, '-')            // 用破折号替换空格
    .replace(/[^\w-]/g, '')          // 删除特殊字符
    .replace(/-+/g, '-')             // 用单个破折号替换多个破折号
    .replace(/^-+|-+$/g, '');        // 删除前导/尾随破折号
}

console.log(generateSlug('Hello World!'));        // 'hello-world'
console.log(generateSlug('JavaScript  Tips'));    // 'javascript-tips'
console.log(generateSlug('---Amazing---Post---')); // 'amazing-post'
```

### CSV 解析

```javascript
function parseCSV(csv) {
  return csv
    .trim()
    .split('\n')
    .map(line =>
      line.split(',').map(field => field.trim())
    );
}

const csv = `
name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago
`;

const data = parseCSV(csv);
console.log(data);
// [
//   ['name', 'age', 'city'],
//   ['Alice', '30', 'New York'],
//   ['Bob', '25', 'Los Angeles'],
//   ['Charlie', '35', 'Chicago']
// ]
```

### HTML 标签删除

```javascript
function stripHtmlTags(html) {
  return html
    .replace(/<[^>]*>/g, '')        // 删除所有标签
    .replace(/&nbsp;/g, ' ')        // 替换 HTML 实体
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const html = '<p>Hello <b>World</b>!</p>';
console.log(stripHtmlTags(html)); // 'Hello World!'
```

### 密码强度检测

```javascript
function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password)
  };

  const strength = Object.values(checks).filter(Boolean).length;

  return {
    score: strength,
    strength: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength],
    checks
  };
}

console.log(checkPasswordStrength('password'));         // score: 2, strength: 'Fair'
console.log(checkPasswordStrength('Pas$w0rd'));         // score: 5, strength: 'Strong'
```

### 带省略号的文本截断

```javascript
function truncate(text, maxLength, ellipsis = '...') {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

console.log(truncate('Hello World', 8));        // 'Hello...'
console.log(truncate('Hello World', 20));       // 'Hello World'
console.log(truncate('Hello World', 8, '…'));   // 'Hello…'
```

## 面试要点

### 字符串不可变性

**问题**：不可变性对字符串意味着什么？

**回答**：JavaScript 中的字符串是不可变的，意味着创建后不能更改。所有字符串方法都返回新字符串，而不是修改原始字符串：

```javascript
const original = 'hello';
const modified = original.toUpperCase();
// original 仍然是 'hello'
// modified 是 'HELLO'
```

### slice() 和 substring() 的区别

**问题**：slice() 和 substring() 有什么区别？

**回答**：
- `slice()` 支持负索引；`substring()` 将负数视为 0
- `slice(a, b)` 如果 a > b 返回空；`substring()` 交换参数
- 两者都是非修改的，返回新字符串

```javascript
const str = 'Hello';
str.slice(-3);      // 'llo'
str.substring(-3);  // 'Hello'
```

### 字符串方法 vs 正则表达式方法

**问题**：什么时候应该使用字符串方法 vs 正则表达式？

**回答**：简单操作使用字符串方法，复杂模式使用正则表达式：
- `indexOf()`：查找简单子字符串
- `includes()`：检查是否包含子字符串
- `replace()`：用正则表达式模式替换
- `match()`：复杂模式匹配

### 性能优化

**问题**：如何优化循环中的字符串连接？

**回答**：使用 array.join() 代替字符串连接：

```javascript
// 不好：O(n²) 时间复杂度
let result = '';
for (let i = 0; i < 1000; i++) {
  result += 'item' + i;
}

// 好：O(n) 时间复杂度
const items = [];
for (let i = 0; i < 1000; i++) {
  items.push('item' + i);
}
const result = items.join('');
```

### Unicode 和表情符号处理

**问题**：如何正确处理表情符号和 Unicode 字符？

**回答**：对表情符号使用 codePointAt() 而不是 charCodeAt()：

```javascript
const emoji = '👍';
emoji.charCodeAt(0);  // 对表情符号不正确
emoji.codePointAt(0); // 正确方法

// 正确迭代表情符号
for (const char of emoji) {
  console.log(char.codePointAt(0));
}
```

## 延伸阅读

### 相关主题

1. **正则表达式**：学习模式匹配和复杂文本操作
2. **数组方法**：理解与字符串配合使用的转换方法
3. **模板字面量**：现代字符串插值和格式化
4. **国际化（i18n）**：区域感知的字符串处理
5. **文本处理**：自然语言处理的高级技术

### 练习题

1. 编写一个验证电话号码格式的函数
2. 创建一个 URL 参数解析器
3. 实现一个简单的 Markdown 到 HTML 转换器
4. 构建一个文本搜索和高亮功能
5. 创建一个字符串压缩工具

### JavaScript 标准

- **ECMA-262**：官方 JavaScript 规范
- **String 原型方法**：MDN Web 文档
- **Unicode 标准**：Unicode 字符编码

---

## 总结

JavaScript 字符串方法提供了强大的文本操作工具：

**提取**：`slice()`、`substring()`、`charAt()`
**搜索**：`indexOf()`、`includes()`、`search()`、`match()`
**大小写转换**：`toUpperCase()`、`toLowerCase()`
**转换**：`split()`、`replace()`、`replaceAll()`
**修剪/填充**：`trim()`、`padStart()`、`padEnd()`
**比较**：`localeCompare()`

掌握这些方法可以高效处理字符串操作并编写干净、可维护的代码。记住字符串是不可变的，根据用例选择正确的方法，并考虑大规模文本处理的性能影响。
