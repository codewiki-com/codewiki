---
title: 正则表达式
description: JavaScript正则表达式完全指南，模式匹配、捕获组与高级技巧
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - 正则表达式
  - RegExp
  - 字符串
status: imported
origin: old/src/content/docs/javascript/regexp.zh.md
divergence: 0.276
issues: []
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 20
  lastUpdated: 2026-01-07
---

正则表达式（Regular Expression，简称 RegExp）是用于匹配字符串中字符组合的模式。在 JavaScript 中，正则表达式也是对象，可以配合 `RegExp` 和 `String` 的方法使用，实现强大的文本处理功能。

## 创建正则表达式

JavaScript 提供两种创建正则表达式的方式。

### 字面量语法

使用斜杠包围模式，这是最常用的方式：

```javascript
const pattern = /abc/;
const patternWithFlags = /abc/gi;
```

字面量语法在脚本加载时编译，适用于模式固定不变的情况。

### 构造函数语法

使用 `RegExp` 构造函数创建：

```javascript
const pattern = new RegExp('abc');
const patternWithFlags = new RegExp('abc', 'gi');

// 动态构建正则表达式
const searchTerm = 'hello';
const dynamicPattern = new RegExp(searchTerm, 'i');
```

构造函数适用于需要动态构建正则表达式的场景。

> **注意**：使用构造函数时，反斜杠需要转义。例如 `/\d+/` 等价于 `new RegExp('\\d+')`。

## 正则表达式标志（Flags）

标志用于控制正则表达式的匹配行为。

| 标志 | 名称 | 说明 |
|------|------|------|
| `g` | global | 全局匹配，查找所有匹配项而非在第一个匹配后停止 |
| `i` | ignoreCase | 忽略大小写 |
| `m` | multiline | 多行模式，`^` 和 `$` 匹配每行的开头和结尾 |
| `s` | dotAll | 使 `.` 匹配包括换行符在内的任意字符 |
| `u` | unicode | 启用完整的 Unicode 支持 |
| `y` | sticky | 粘性匹配，从 `lastIndex` 位置开始匹配 |

### 标志示例

```javascript
// g - 全局匹配
'hello hello'.match(/hello/);   // ['hello']
'hello hello'.match(/hello/g);  // ['hello', 'hello']

// i - 忽略大小写
/hello/i.test('HELLO');  // true

// m - 多行模式
const text = `line1
line2
line3`;

text.match(/^line/g);   // ['line'] - 只匹配开头
text.match(/^line/gm);  // ['line', 'line', 'line'] - 匹配每行开头

// s - dotAll 模式
/foo.bar/.test('foo\nbar');   // false - . 默认不匹配换行符
/foo.bar/s.test('foo\nbar');  // true - s 标志使 . 匹配换行符

// u - Unicode 模式
/^.$/.test('😀');   // false - emoji 被视为两个字符
/^.$/u.test('😀');  // true - 正确处理 Unicode

// y - 粘性匹配
const sticky = /foo/y;
sticky.lastIndex = 0;
sticky.test('foo bar');  // true
sticky.lastIndex = 4;
sticky.test('foo bar');  // false - 必须从 lastIndex 处开始匹配
```

## 字符类（Character Classes）

字符类用于匹配特定类型的字符。

### 预定义字符类

| 字符类 | 说明 | 等价于 |
|--------|------|--------|
| `.` | 匹配除换行符外的任意字符 | `[^\n\r]` |
| `\d` | 匹配数字 | `[0-9]` |
| `\D` | 匹配非数字 | `[^0-9]` |
| `\w` | 匹配单词字符 | `[A-Za-z0-9_]` |
| `\W` | 匹配非单词字符 | `[^A-Za-z0-9_]` |
| `\s` | 匹配空白字符 | `[\t\n\v\f\r ]` |
| `\S` | 匹配非空白字符 | `[^\t\n\v\f\r ]` |

```javascript
// 匹配数字
'abc123def'.match(/\d+/g);  // ['123']

// 匹配单词
'hello_world 123'.match(/\w+/g);  // ['hello_world', '123']

// 匹配空白分隔的内容
'a b  c'.split(/\s+/);  // ['a', 'b', 'c']
```

### 自定义字符类

使用方括号 `[]` 定义自定义字符类：

```javascript
// 匹配元音字母
'hello'.match(/[aeiou]/g);  // ['e', 'o']

// 匹配范围
'abc123XYZ'.match(/[a-z]/g);  // ['a', 'b', 'c']
'abc123XYZ'.match(/[A-Z]/g);  // ['X', 'Y', 'Z']
'abc123XYZ'.match(/[0-9]/g);  // ['1', '2', '3']

// 组合范围
'Hello123'.match(/[a-zA-Z0-9]/g);  // ['H', 'e', 'l', 'l', 'o', '1', '2', '3']

// 否定字符类（使用 ^）
'hello123'.match(/[^a-z]/g);  // ['1', '2', '3']

// 匹配特殊字符（需要转义或放在特定位置）
/[[\]\\]/.test('[');  // true - 匹配 [ ] \
/[-]/.test('-');      // true - 连字符放在开头或结尾无需转义
```

## 量词（Quantifiers）

量词指定字符或组应该出现的次数。

| 量词 | 说明 |
|------|------|
| `*` | 匹配 0 次或多次 |
| `+` | 匹配 1 次或多次 |
| `?` | 匹配 0 次或 1 次 |
| `{n}` | 精确匹配 n 次 |
| `{n,}` | 匹配至少 n 次 |
| `{n,m}` | 匹配 n 到 m 次 |

### 贪婪与惰性匹配

默认情况下，量词是贪婪的，会尽可能多地匹配。在量词后加 `?` 变为惰性匹配：

```javascript
const html = '<div>content</div>';

// 贪婪匹配 - 匹配尽可能多的字符
html.match(/<.+>/);   // ['<div>content</div>']

// 惰性匹配 - 匹配尽可能少的字符
html.match(/<.+?>/);  // ['<div>']

// 更多示例
'aaaa'.match(/a+/);   // ['aaaa'] - 贪婪
'aaaa'.match(/a+?/);  // ['a'] - 惰性

'aaaa'.match(/a{2,4}/);   // ['aaaa'] - 贪婪，匹配4个
'aaaa'.match(/a{2,4}?/);  // ['aa'] - 惰性，匹配2个
```

## 锚点（Anchors）

锚点用于匹配位置而非字符。

| 锚点 | 说明 |
|------|------|
| `^` | 匹配字符串开头（多行模式下匹配行开头） |
| `$` | 匹配字符串结尾（多行模式下匹配行结尾） |
| `\b` | 匹配单词边界 |
| `\B` | 匹配非单词边界 |

```javascript
// 开头和结尾
/^hello/.test('hello world');  // true
/world$/.test('hello world');  // true
/^hello$/.test('hello');       // true - 完全匹配

// 单词边界
'hello world'.match(/\bworld\b/);  // ['world']
'helloworld'.match(/\bworld\b/);   // null - world 不是独立单词

// 边界的实际应用
const text = 'cat concatenate category';
text.match(/\bcat\b/g);  // ['cat'] - 只匹配独立的 'cat'
text.match(/cat/g);      // ['cat', 'cat', 'cat'] - 匹配所有 'cat'
```

## 分组与捕获（Groups and Capturing）

### 捕获组

使用圆括号 `()` 创建捕获组，可以提取匹配的子串：

```javascript
// 基本捕获组
const datePattern = /(\d{4})-(\d{2})-(\d{2})/;
const match = '2026-01-07'.match(datePattern);

console.log(match[0]);  // '2026-01-07' - 完整匹配
console.log(match[1]);  // '2026' - 第一个捕获组
console.log(match[2]);  // '01' - 第二个捕获组
console.log(match[3]);  // '07' - 第三个捕获组

// 使用 exec 获取更多信息
const result = datePattern.exec('Date: 2026-01-07');
console.log(result.index);  // 6 - 匹配开始的位置
console.log(result.input);  // 'Date: 2026-01-07' - 原始字符串
```

### 命名捕获组

ES2018 引入了命名捕获组，使代码更易读：

```javascript
const datePattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = '2026-01-07'.match(datePattern);

console.log(match.groups.year);   // '2026'
console.log(match.groups.month);  // '01'
console.log(match.groups.day);    // '07'

// 在替换中使用命名组
'2026-01-07'.replace(datePattern, '$<day>/$<month>/$<year>');
// '07/01/2026'
```

### 非捕获组

使用 `(?:)` 创建非捕获组，用于分组但不捕获：

```javascript
// 非捕获组不会出现在匹配结果中
const pattern = /(?:https?:\/\/)?(\w+\.\w+)/;
const match = 'https://example.com'.match(pattern);

console.log(match[0]);  // 'https://example.com'
console.log(match[1]);  // 'example.com' - 只有一个捕获组
```

### 反向引用

在正则表达式中引用前面的捕获组：

```javascript
// 数字引用
const duplicateWords = /\b(\w+)\s+\1\b/g;
'the the quick brown fox'.match(duplicateWords);  // ['the the']

// 命名引用
const pattern = /\b(?<word>\w+)\s+\k<word>\b/g;
'hello hello world'.match(pattern);  // ['hello hello']

// 匹配引号中的内容（确保引号配对）
const quoted = /(['"]).*?\1/g;
`"hello" and 'world'`.match(quoted);  // ['"hello"', "'world'"]
```

## 断言（Lookahead and Lookbehind）

断言匹配位置，不消耗字符。

### 先行断言（Lookahead）

```javascript
// 正向先行断言 (?=)
// 匹配后面跟着指定模式的位置
'100px 200em 300px'.match(/\d+(?=px)/g);  // ['100', '300']

// 负向先行断言 (?!)
// 匹配后面不跟着指定模式的位置
'100px 200em 300px'.match(/\d+(?!px)/g);  // ['200', '30']
// 注意：300 中的 30 被匹配，因为 30 后面不是 px
```

### 后行断言（Lookbehind）

ES2018 引入了后行断言：

```javascript
// 正向后行断言 (?<=)
// 匹配前面是指定模式的位置
'$100 €200 $300'.match(/(?<=\$)\d+/g);  // ['100', '300']

// 负向后行断言 (?<!)
// 匹配前面不是指定模式的位置
'$100 €200 £300'.match(/(?<!\$)\d+/g);  // ['200', '300']
```

### 断言的实际应用

```javascript
// 密码验证：至少包含一个大写字母、一个小写字母、一个数字
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
passwordPattern.test('Password123');  // true
passwordPattern.test('password123');  // false - 没有大写字母

// 提取不以特定词开头的行
const text = `
TODO: fix bug
DONE: add feature
TODO: write tests
`;
text.match(/^(?!TODO:).+$/gm);  // ['DONE: add feature']

// 格式化数字（添加千位分隔符）
'1234567890'.replace(/\B(?=(\d{3})+(?!\d))/g, ',');  // '1,234,567,890'
```

## 交替与分支

使用 `|` 表示"或"关系：

```javascript
// 基本交替
/cat|dog/.test('I have a cat');  // true
/cat|dog/.test('I have a dog');  // true

// 在组中使用交替
/I have a (cat|dog|bird)/.test('I have a bird');  // true

// 匹配多个选项
const filePattern = /\.(jpg|jpeg|png|gif)$/i;
filePattern.test('image.PNG');  // true
filePattern.test('image.pdf');  // false

// 注意交替的优先级
/gray|grey/.test('gray');   // true
/gr(a|e)y/.test('grey');    // true - 更精确的写法
```

## String 方法与正则表达式

### match()

返回匹配结果数组：

```javascript
// 无 g 标志 - 返回第一个匹配及捕获组
'hello123world456'.match(/(\d+)/);
// ['123', '123', index: 5, input: 'hello123world456', groups: undefined]

// 有 g 标志 - 返回所有匹配
'hello123world456'.match(/\d+/g);
// ['123', '456']

// 无匹配返回 null
'hello'.match(/\d+/);  // null
```

### matchAll()

返回包含所有匹配及其捕获组的迭代器：

```javascript
const text = 'test1test2test3';
const pattern = /test(\d)/g;

const matches = [...text.matchAll(pattern)];
matches.forEach(match => {
  console.log(`完整匹配: ${match[0]}, 捕获组: ${match[1]}, 位置: ${match.index}`);
});
// 完整匹配: test1, 捕获组: 1, 位置: 0
// 完整匹配: test2, 捕获组: 2, 位置: 5
// 完整匹配: test3, 捕获组: 3, 位置: 10
```

### replace() 和 replaceAll()

替换匹配的内容：

```javascript
// 基本替换
'hello world'.replace(/world/, 'JavaScript');  // 'hello JavaScript'

// 全局替换
'aaa'.replace(/a/g, 'b');     // 'bbb'
'aaa'.replaceAll(/a/g, 'b');  // 'bbb' - 必须使用 g 标志

// 使用捕获组
'John Smith'.replace(/(\w+) (\w+)/, '$2, $1');  // 'Smith, John'

// 使用函数
'hello'.replace(/[aeiou]/g, char => char.toUpperCase());
// 'hEllO'

// 复杂的函数替换
const prices = 'apple: $1.99, banana: $0.99';
prices.replace(/\$(\d+\.\d{2})/g, (match, price) => {
  return `$${(parseFloat(price) * 1.1).toFixed(2)}`;
});
// 'apple: $2.19, banana: $1.09'
```

### search()

返回第一个匹配的索引：

```javascript
'hello world'.search(/world/);  // 6
'hello world'.search(/foo/);    // -1
```

### split()

使用正则表达式分割字符串：

```javascript
// 按空白分割
'a  b   c'.split(/\s+/);  // ['a', 'b', 'c']

// 保留分隔符（使用捕获组）
'a1b2c3'.split(/(\d)/);  // ['a', '1', 'b', '2', 'c', '3', '']

// 复杂分割
'key1=value1&key2=value2'.split(/[=&]/);
// ['key1', 'value1', 'key2', 'value2']
```

## RegExp 对象方法

### test()

测试是否匹配：

```javascript
const pattern = /hello/i;
pattern.test('Hello World');  // true
pattern.test('Hi World');     // false

// 注意：使用 g 标志时，test() 会更新 lastIndex
const globalPattern = /a/g;
globalPattern.test('aaa');  // true, lastIndex = 1
globalPattern.test('aaa');  // true, lastIndex = 2
globalPattern.test('aaa');  // true, lastIndex = 3
globalPattern.test('aaa');  // false, lastIndex = 0
```

### exec()

执行匹配，返回详细信息：

```javascript
const pattern = /(\w+)@(\w+\.\w+)/g;
const text = 'Contact: alice@example.com and bob@test.org';

let match;
while ((match = pattern.exec(text)) !== null) {
  console.log(`邮箱: ${match[0]}`);
  console.log(`用户名: ${match[1]}`);
  console.log(`域名: ${match[2]}`);
  console.log(`位置: ${match.index}`);
  console.log('---');
}
```

## 实际应用示例

### 验证表单输入

```javascript
// 邮箱验证
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
emailPattern.test('user@example.com');  // true

// 手机号验证（中国大陆）
const phonePattern = /^1[3-9]\d{9}$/;
phonePattern.test('13812345678');  // true

// URL 验证
const urlPattern = /^https?:\/\/[\w\-.]+(:\d+)?(\/[\w\-./?%&=]*)?$/;
urlPattern.test('https://example.com:8080/path?query=1');  // true

// 身份证号验证（简化版）
const idCardPattern = /^\d{17}[\dXx]$/;
idCardPattern.test('110101199003074518');  // true

// IP 地址验证
const ipPattern = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
ipPattern.test('192.168.1.1');   // true
ipPattern.test('256.1.1.1');     // false
```

### 文本处理

```javascript
// 去除 HTML 标签
const html = '<p>Hello <strong>World</strong></p>';
html.replace(/<[^>]+>/g, '');  // 'Hello World'

// 提取 URL
const text = 'Visit https://example.com or http://test.org for more info';
const urls = text.match(/https?:\/\/[^\s]+/g);
// ['https://example.com', 'http://test.org']

// 驼峰转连字符
'backgroundColor'.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
// 'background-color'

// 连字符转驼峰
'background-color'.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
// 'backgroundColor'

// 首字母大写
'hello world'.replace(/\b\w/g, c => c.toUpperCase());
// 'Hello World'
```

### 解析结构化数据

```javascript
// 解析查询字符串
function parseQueryString(query) {
  const result = {};
  const pattern = /([^&=]+)=([^&]*)/g;
  let match;

  while ((match = pattern.exec(query)) !== null) {
    result[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }

  return result;
}

parseQueryString('name=John&age=30&city=Beijing');
// { name: 'John', age: '30', city: 'Beijing' }

// 解析 Markdown 链接
const markdown = 'Check [Google](https://google.com) and [GitHub](https://github.com)';
const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
const links = [...markdown.matchAll(linkPattern)].map(m => ({
  text: m[1],
  url: m[2]
}));
// [{ text: 'Google', url: 'https://google.com' }, { text: 'GitHub', url: 'https://github.com' }]

// 解析日志文件
const log = '[2026-01-07 10:30:15] ERROR: Connection failed';
const logPattern = /\[(?<date>[\d-]+) (?<time>[\d:]+)\] (?<level>\w+): (?<message>.+)/;
const logMatch = log.match(logPattern);
console.log(logMatch.groups);
// { date: '2026-01-07', time: '10:30:15', level: 'ERROR', message: 'Connection failed' }
```

### 代码处理

```javascript
// 提取函数名
const code = `
function add(a, b) { return a + b; }
const multiply = (a, b) => a * b;
const subtract = function(a, b) { return a - b; };
`;

const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g;
const functions = [...code.matchAll(functionPattern)].map(m => m[1] || m[2]);
// ['add', 'multiply', 'subtract']

// 提取注释
const codeWithComments = `
// This is a single line comment
const x = 1; // inline comment
/* This is a
   multi-line comment */
`;

const commentPattern = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
codeWithComments.match(commentPattern);
// ['// This is a single line comment', '// inline comment', '/* This is a\n   multi-line comment */']
```

## Unicode 与国际化

### Unicode 属性转义

ES2018 引入了 Unicode 属性转义，需要 `u` 标志：

```javascript
// 匹配任意字母（包括各种语言）
/\p{Letter}/gu.test('中');  // true
/\p{Letter}/gu.test('あ');  // true
/\p{Letter}/gu.test('A');   // true

// 匹配中文
/\p{Script=Han}/gu.test('中文');  // true

// 匹配 emoji
/\p{Emoji}/gu.test('😀');  // true

// 匹配标点符号
/\p{Punctuation}/gu.test('。');  // true
```

### 处理多语言文本

```javascript
// 匹配中文字符
const chinesePattern = /[\u4e00-\u9fa5]+/g;
'Hello 你好 World 世界'.match(chinesePattern);  // ['你好', '世界']

// 使用 Unicode 属性（更推荐）
'Hello 你好 World 世界'.match(/\p{Script=Han}+/gu);  // ['你好', '世界']

// 匹配日文假名
/[\u3040-\u309f\u30a0-\u30ff]+/g.test('こんにちは');  // true
```

## 性能优化建议

### 避免回溯陷阱

```javascript
// 危险模式 - 可能导致灾难性回溯
const badPattern = /^(a+)+$/;
// 对于 'aaaaaaaaaaaaaaaaX' 这样的输入会非常慢

// 改进版本
const goodPattern = /^a+$/;
```

### 使用非捕获组

```javascript
// 不需要捕获时使用非捕获组
const pattern = /(?:https?:\/\/)?example\.com/;  // 更高效
```

### 具体化模式

```javascript
// 避免过于宽泛的模式
const vague = /.*foo.*/;    // 较慢
const specific = /\w*foo\w*/;  // 较快
```

### 锚定模式

```javascript
// 在可能的情况下使用锚点
const unanchored = /pattern/;
const anchored = /^pattern$/;  // 更快，因为不需要在每个位置尝试匹配
```

## 调试正则表达式

```javascript
// 使用 source 和 flags 属性查看正则表达式
const pattern = /hello/gi;
console.log(pattern.source);  // 'hello'
console.log(pattern.flags);   // 'gi'

// 分步测试复杂正则表达式
function debugRegex(pattern, text) {
  console.log('Pattern:', pattern);
  console.log('Text:', text);
  console.log('Test:', pattern.test(text));
  console.log('Match:', text.match(pattern));
}

// 使用在线工具如 regex101.com 可视化和调试正则表达式
```

## 总结

正则表达式是文本处理的强大工具，掌握它可以极大提高开发效率。关键要点：

1. **基础语法**：熟练使用字符类、量词、锚点
2. **分组与捕获**：合理使用捕获组提取信息
3. **断言**：利用先行和后行断言实现复杂匹配
4. **标志**：根据需求选择合适的标志
5. **性能**：注意避免回溯陷阱，优化匹配模式
6. **实践**：通过实际项目练习巩固知识

建议在实际开发中逐步应用，从简单模式开始，逐渐掌握高级技巧。同时善用在线工具进行调试和学习。
