---
title: JavaScript String Methods Complete Guide
description: Master all JavaScript string methods including slice, substring, split, replace, replaceAll, trim, padStart, and more
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - strings
  - methods
  - text manipulation
status: imported
origin: old/src/content/docs/javascript/string-methods.en.md
divergence: 0.22
issues: []
legacy:
  category: JavaScript
  subcategory: Built-in Objects
  order: 22
  lastUpdated: 2026-01-07
---

Strings are one of the most fundamental data types in JavaScript, and mastering string methods is essential for effective programming. This comprehensive guide covers all important string methods with practical examples.

## Concept Explanation

Strings in JavaScript are immutable sequences of characters. String methods allow you to inspect, manipulate, transform, and analyze string data without modifying the original string. All string methods return new values rather than modifying the string itself, since strings are immutable in JavaScript.

String methods fall into several categories:
- **Extraction methods**: Extract portions of strings (slice, substring, substr)
- **Search methods**: Find characters or substrings (indexOf, includes, search)
- **Case methods**: Change character casing (toUpperCase, toLowerCase)
- **Transformation methods**: Convert strings to arrays and manipulate content (split, replace, replaceAll)
- **Trimming methods**: Remove whitespace (trim, trimStart, trimEnd)
- **Padding methods**: Add characters to strings (padStart, padEnd)
- **Character methods**: Work with individual characters (charAt, charCodeAt)

## Core Principles

### Immutability

Strings in JavaScript are immutable. All string methods return new strings rather than modifying the original:

```javascript
const original = 'Hello World';
const modified = original.toUpperCase();

console.log(original); // 'Hello World' (unchanged)
console.log(modified); // 'HELLO WORLD' (new string)
```

### Zero-Based Indexing

Most string methods use zero-based indexing, meaning the first character is at index 0:

```javascript
const str = 'JavaScript';
console.log(str[0]);      // 'J'
console.log(str.charAt(0)); // 'J'
console.log(str[10]);     // undefined (out of bounds)
```

### Method Chaining

Many string methods can be chained together since they return new strings:

```javascript
const result = '  hello world  '
  .trim()
  .split(' ')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

console.log(result); // 'Hello World'
```

## Key Points

1. **Strings are immutable** - all methods return new strings
2. **Zero-based indexing** - first character is at index 0
3. **Unicode support** - JavaScript strings support Unicode characters
4. **Method chaining** - most string methods can be chained
5. **Regular expressions** - many methods support regex patterns
6. **Performance trade-offs** - repeated concatenation is slower than join()
7. **Case sensitivity** - comparison methods are case-sensitive by default
8. **Negative indices** - slice() supports negative indices, substring() does not

## Extraction Methods

### slice()

Extract a portion of a string without modifying the original.

```javascript
const str = 'JavaScript';

// slice(start, end) - end is exclusive
console.log(str.slice(0, 4));    // 'Java'
console.log(str.slice(4));       // 'Script'
console.log(str.slice());        // 'JavaScript'

// Negative indices count from the end
console.log(str.slice(-6));      // 'Script'
console.log(str.slice(-6, -2));  // 'Scri'
console.log(str.slice(0, -6));   // 'Java'

// Empty result with invalid ranges
console.log(str.slice(5, 2));    // '' (start > end)

// Practical example: remove file extension
const filename = 'document.pdf';
const nameOnly = filename.slice(0, -4); // 'document'
console.log(nameOnly);
```

### substring()

Extract a portion of a string (does not support negative indices).

```javascript
const str = 'JavaScript';

// substring(start, end) - end is exclusive
console.log(str.substring(0, 4));    // 'Java'
console.log(str.substring(4));       // 'Script'
console.log(str.substring());        // 'JavaScript'

// Unlike slice, swaps start/end if start > end
console.log(str.substring(5, 2));    // 'vas' (same as substring(2, 5))

// Negative indices are treated as 0
console.log(str.substring(-3));      // 'JavaScript' (same as substring(0))

// Difference from slice
const text = 'Hello World';
console.log(text.slice(-5));         // 'World'
console.log(text.substring(-5));     // 'Hello World' (negative treated as 0)
```

### substr()

Extract a portion of a string starting at index and extending for a specified length. (Deprecated - prefer slice or substring)

```javascript
const str = 'JavaScript';

// substr(start, length)
console.log(str.substr(0, 4));    // 'Java'
console.log(str.substr(4, 6));    // 'Script'
console.log(str.substr(-6));      // 'Script' (negative indices count from end)
console.log(str.substr(-6, 3));   // 'Scr'

// Note: This method is deprecated, use slice() instead
```

### charAt()

Get the character at a specific index.

```javascript
const str = 'Hello';

console.log(str.charAt(0));    // 'H'
console.log(str.charAt(1));    // 'e'
console.log(str.charAt(10));   // '' (out of bounds returns empty string)

// Get last character
console.log(str.charAt(str.length - 1)); // 'o'

// Bracket notation alternative (modern)
console.log(str[0]);           // 'H'
console.log(str[10]);          // undefined (different from charAt)
```

### charCodeAt()

Get the Unicode code unit at a specific index.

```javascript
const str = 'ABC';

console.log(str.charCodeAt(0)); // 65 (code for 'A')
console.log(str.charCodeAt(1)); // 66 (code for 'B')
console.log(str.charCodeAt(2)); // 67 (code for 'C')
console.log(str.charCodeAt(10)); // NaN (out of bounds)

// Convert back to character
const code = 65;
console.log(String.fromCharCode(code)); // 'A'

// Work with multiple characters
const codes = 'Hello'.split('').map(char => char.charCodeAt(0));
console.log(codes); // [72, 101, 108, 108, 111]
```

### codePointAt()

Get the Unicode code point at a specific index (better for emoji and special characters).

```javascript
const str = 'Hello🌍World';

console.log(str.codePointAt(0));  // 72 (H)
console.log(str.codePointAt(5));  // 127757 (🌍 emoji)

// Convert back to character
const codePoint = 127757;
console.log(String.fromCodePoint(codePoint)); // '🌍'

// Handle emoji properly
const emoji = '👨‍👩‍👧‍👦';
for (let i = 0; i < emoji.length; i++) {
  console.log(emoji.codePointAt(i));
}
```

## Search and Position Methods

### indexOf()

Find the index of the first occurrence of a substring.

```javascript
const str = 'Hello World Hello';

console.log(str.indexOf('o'));       // 4
console.log(str.indexOf('World'));   // 6
console.log(str.indexOf('xyz'));     // -1 (not found)

// With starting position
console.log(str.indexOf('o', 5));    // 7 (first 'o' after index 5)
console.log(str.indexOf('Hello', 1)); // 12 (second 'Hello')

// Case-sensitive
console.log(str.indexOf('hello'));   // -1 (lowercase)

// Check if substring exists
if (str.indexOf('World') !== -1) {
  console.log('Found!');
}

// Find all occurrences
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

Find the index of the last occurrence of a substring.

```javascript
const str = 'Hello World Hello';

console.log(str.lastIndexOf('o'));       // 14
console.log(str.lastIndexOf('Hello'));   // 12
console.log(str.lastIndexOf('xyz'));     // -1 (not found)

// Search backwards from position
console.log(str.lastIndexOf('o', 10));   // 7 (last 'o' at or before index 10)

// Get last word
function getLastWord(str) {
  const lastSpace = str.lastIndexOf(' ');
  return lastSpace === -1 ? str : str.slice(lastSpace + 1);
}

console.log(getLastWord('Hello World Hello')); // 'Hello'
```

### includes()

Check if a string contains a substring.

```javascript
const str = 'Hello World';

console.log(str.includes('World'));  // true
console.log(str.includes('xyz'));    // false

// Case-sensitive
console.log(str.includes('world'));  // false

// With starting position
console.log(str.includes('World', 6)); // true
console.log(str.includes('World', 7)); // false

// Practical: URL validation
function isValidProtocol(url) {
  return url.includes('http://') || url.includes('https://');
}

console.log(isValidProtocol('https://example.com')); // true
```

### search()

Find the index of the first match of a regular expression or substring.

```javascript
const str = 'Hello World';

// Search for substring
console.log(str.search('World'));    // 6
console.log(str.search('xyz'));      // -1

// Search with regex
console.log(str.search(/o/));        // 4 (first 'o')
console.log(str.search(/o/i));       // 4 (case-insensitive)
console.log(str.search(/[aeiou]/i)); // 1 (first vowel)

// Find first digit
const text = 'abc123def456';
console.log(text.search(/\d/));      // 3
```

### match()

Find all matches of a regular expression.

```javascript
const str = 'Hello World 123';

// Match with global flag
console.log(str.match(/\w+/g));      // ['Hello', 'World', '123']
console.log(str.match(/\d+/g));      // ['123']

// Match without global flag (returns array with additional info)
const match = str.match(/(\w+)\s(\w+)/);
console.log(match);
// ['Hello World', 'Hello', 'World', index: 0, ...]

// Extract email addresses
const text = 'Contact: alice@example.com or bob@test.org';
const emails = text.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
console.log(emails); // ['alice@example.com', 'bob@test.org']

// No match returns null
console.log('xyz'.match(/\d/)); // null
```

### matchAll()

Find all matches of a regular expression with capture groups.

```javascript
const str = 'test1 test2 test3';

// Requires global flag
const regex = /test(\d)/g;
const matches = [...str.matchAll(regex)];

for (const match of matches) {
  console.log(match[0]); // Full match
  console.log(match[1]); // First capture group
}
// test1, 1
// test2, 2
// test3, 3

// Extract structured data
const log = '2026-01-07 ERROR 404 not found\n2026-01-07 WARN 503 unavailable';
const pattern = /(\d{4}-\d{2}-\d{2})\s(\w+)\s(\d+)/g;

for (const [full, date, level, code] of log.matchAll(pattern)) {
  console.log(`${date}: ${level} (${code})`);
}
```

### startsWith()

Check if a string starts with a specific substring.

```javascript
const str = 'Hello World';

console.log(str.startsWith('Hello'));  // true
console.log(str.startsWith('hello'));  // false (case-sensitive)
console.log(str.startsWith('World'));  // false

// With starting position
console.log(str.startsWith('World', 6)); // true

// Practical: file type checking
function isImageFile(filename) {
  return filename.toLowerCase().endsWith('.jpg') ||
         filename.toLowerCase().endsWith('.png') ||
         filename.toLowerCase().endsWith('.gif');
}

// Protocol checking
function isHttpUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}
```

### endsWith()

Check if a string ends with a specific substring.

```javascript
const str = 'Hello World';

console.log(str.endsWith('World'));     // true
console.log(str.endsWith('world'));     // false (case-sensitive)
console.log(str.endsWith('Hello'));     // false

// With length parameter (check end of substring)
console.log(str.endsWith('Hello', 5));  // true

// File extension checking
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1);
}

function isJsonFile(filename) {
  return filename.endsWith('.json');
}

// Content type checking
const supportedFormats = ['.pdf', '.doc', '.docx', '.txt'];
function isSupportedFormat(filename) {
  return supportedFormats.some(format => filename.endsWith(format));
}
```

## Case Methods

### toUpperCase()

Convert all characters to uppercase.

```javascript
const str = 'Hello World';

console.log(str.toUpperCase());     // 'HELLO WORLD'

// Works with Unicode
const international = 'café';
console.log(international.toUpperCase()); // 'CAFÉ'

// Practical: normalize user input
function normalizeCommand(input) {
  return input.trim().toUpperCase();
}

// Convert array of words
const words = ['hello', 'world'];
const uppercase = words.map(word => word.toUpperCase());
console.log(uppercase); // ['HELLO', 'WORLD']
```

### toLowerCase()

Convert all characters to lowercase.

```javascript
const str = 'Hello World';

console.log(str.toLowerCase());     // 'hello world'

// Case-insensitive comparison
function caseInsensitiveEqual(str1, str2) {
  return str1.toLowerCase() === str2.toLowerCase();
}

console.log(caseInsensitiveEqual('Hello', 'HELLO')); // true

// Normalize email addresses
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Create URL-friendly slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

console.log(createSlug('Hello World!')); // 'hello-world'
```

### toLocaleUpperCase()

Convert to uppercase using locale-specific rules.

```javascript
// Most characters same as toUpperCase()
console.log('hello'.toLocaleUpperCase());     // 'HELLO'

// Locale matters for some languages
const turkish = 'istanbul';
console.log(turkish.toLocaleUpperCase('tr-TR')); // 'İSTANBUL' (capital I with dot)
console.log(turkish.toUpperCase());              // 'ISTANBUL' (capital I without dot)
```

### toLocaleLowerCase()

Convert to lowercase using locale-specific rules.

```javascript
// Most characters same as toLowerCase()
console.log('HELLO'.toLocaleLowerCase());     // 'hello'

// Locale matters for some languages
const german = 'STRASSE';
console.log(german.toLocaleLowerCase('de-DE')); // 'straße' (German ß)
console.log(german.toLowerCase());               // 'strasse'
```

## Transformation Methods

### split()

Split a string into an array of substrings.

```javascript
const str = 'Hello World JavaScript';

// Split by space
console.log(str.split(' '));        // ['Hello', 'World', 'JavaScript']

// Split each character
console.log(str.split(''));         // ['H', 'e', 'l', 'l', 'o', ...]

// Split by pattern
console.log(str.split('o'));        // ['Hell', ' W', 'rld JavaScript']

// Limit number of splits
console.log(str.split(' ', 2));     // ['Hello', 'World']

// Split with regex
const csv = 'name,age,city';
console.log(csv.split(','));        // ['name', 'age', 'city']

const mixed = 'hello123world456';
console.log(mixed.split(/\d+/));    // ['hello', 'world', '']

// Parse CSV line
function parseCSVLine(line) {
  return line.split(',').map(field => field.trim());
}

// Split email into user and domain
const email = 'user@example.com';
const [user, domain] = email.split('@');
console.log(user, domain); // 'user', 'example.com'

// Split with capture groups
const text = 'hello123world456';
const parts = text.split(/(\d+)/);
console.log(parts); // ['hello', '123', 'world', '456', '']
```

### replace()

Replace the first occurrence of a substring or pattern.

```javascript
const str = 'Hello World, Hello Universe';

// Replace first occurrence
console.log(str.replace('Hello', 'Hi'));
// 'Hi World, Hello Universe'

// Replace with regex and global flag
console.log(str.replace(/Hello/g, 'Hi'));
// 'Hi World, Hi Universe'

// Replace with function
const replaced = str.replace(/Hello/g, (match) => match.toLowerCase());
console.log(replaced); // 'hello World, hello Universe'

// Replace with captured groups
const date = '2026-01-07';
console.log(date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1'));
// '07/01/2026'

// Function replacement with all parameters
const result = 'test123test456'.replace(/test(\d+)/g, (match, group1, offset, string) => {
  console.log(`Match: ${match}, Group: ${group1}, Offset: ${offset}`);
  return group1;
});
// Match: test123, Group: 123, Offset: 0
// Match: test456, Group: 456, Offset: 8

// Practical: camelCase to snake_case
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
console.log(camelToSnake('helloWorld')); // 'hello_world'

// HTML escape
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

Replace all occurrences of a substring or pattern.

```javascript
const str = 'Hello World, Hello Universe, Hello World';

// Replace all with string
console.log(str.replaceAll('Hello', 'Hi'));
// 'Hi World, Hi Universe, Hi World'

// Replace with regex (requires global flag)
console.log(str.replaceAll(/Hello/g, 'Hi'));
// 'Hi World, Hi Universe, Hi World'

// Replace with function
const result = str.replaceAll('Hello', (match) => match.toLowerCase());
console.log(result);
// 'hello World, hello Universe, hello World'

// Remove all whitespace
function removeWhitespace(str) {
  return str.replaceAll(/\s+/g, '');
}
console.log(removeWhitespace('Hello World')); // 'HelloWorld'

// Replace template variables
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

Create a new string by repeating the original string multiple times.

```javascript
const str = 'Hello';

console.log(str.repeat(3));         // 'HelloHelloHello'
console.log(str.repeat(1));         // 'Hello'
console.log(str.repeat(0));         // ''

// Create patterns
console.log('='.repeat(20));        // '===================='

// Practical: create indentation
function indent(text, level, spaces = 2) {
  return ' '.repeat(level * spaces) + text;
}

console.log(indent('code', 2));     // '    code'

// Create progress bar
function progressBar(percent) {
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  return '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
}

console.log(progressBar(75)); // '[===============     ]'
```

## Trimming and Padding Methods

### trim()

Remove whitespace from both ends of a string.

```javascript
const str = '  Hello World  ';

console.log(str.trim());            // 'Hello World'
console.log(str.trim().length);     // 11

// Works with various whitespace
const whitespace = '\t\n  Text  \r\n';
console.log(whitespace.trim());     // 'Text'

// Practical: clean user input
function cleanUserInput(input) {
  return input.trim().replace(/\s+/g, ' ');
}

console.log(cleanUserInput('  hello   world  ')); // 'hello world'

// Validate non-empty input
function isNonEmpty(str) {
  return str.trim().length > 0;
}
```

### trimStart() (trimLeft())

Remove whitespace from the start of a string.

```javascript
const str = '  Hello World  ';

console.log(str.trimStart());       // 'Hello World  '
console.log(str.trimLeft());        // 'Hello World  ' (alias)

// Remove leading indentation
const indented = '    code';
console.log(indented.trimStart());  // 'code'

// Remove leading zeros
function removeLeadingZeros(str) {
  return str.trimStart() > '0' ? str.trim() : '0';
}
```

### trimEnd() (trimRight())

Remove whitespace from the end of a string.

```javascript
const str = '  Hello World  ';

console.log(str.trimEnd());         // '  Hello World'
console.log(str.trimRight());       // '  Hello World' (alias)

// Remove trailing newline
const withNewline = 'text\n';
console.log(withNewline.trimEnd()); // 'text'

// Remove trailing spaces in multiple lines
function trimLines(text) {
  return text.split('\n').map(line => line.trimEnd()).join('\n');
}
```

### padStart()

Pad a string at the beginning to reach a target length.

```javascript
const str = '42';

console.log(str.padStart(5));       // '   42' (spaces)
console.log(str.padStart(5, '0'));  // '00042' (zeros)
console.log(str.padStart(5, '-'));  // '---42' (dashes)

// Format numbers
const numbers = [5, 42, 123];
numbers.forEach(num => {
  console.log(String(num).padStart(4, '0'));
});
// 0005
// 0042
// 0123

// Practical: right-align text
function rightAlign(text, width) {
  return text.padStart(width);
}

// Format time
function formatTime(hours, minutes, seconds) {
  return [hours, minutes, seconds]
    .map(num => String(num).padStart(2, '0'))
    .join(':');
}

console.log(formatTime(9, 5, 3)); // '09:05:03'

// Create column alignment
const items = ['Name', 'Age', 'City'];
items.forEach(item => {
  console.log(item.padStart(10) + ' | Data');
});
```

### padEnd()

Pad a string at the end to reach a target length.

```javascript
const str = '42';

console.log(str.padEnd(5));         // '42   ' (spaces)
console.log(str.padEnd(5, '.'));    // '42...' (dots)
console.log(str.padEnd(5, '*'));    // '42***' (asterisks)

// Create table-like formatting
const items = ['Name', 'Age', 'City'];
items.forEach(item => {
  console.log(item.padEnd(15) + '| Data');
});

// Create loading animation
function createLoadingBar(filled, total) {
  return '[' + '█'.repeat(filled).padEnd(total, '░') + ']';
}

console.log(createLoadingBar(3, 10)); // '[███░░░░░░]'
```

## Matching and Replacing Methods

### localeCompare()

Compare two strings according to sort order.

```javascript
const str1 = 'apple';
const str2 = 'banana';
const str3 = 'apple';

console.log(str1.localeCompare(str2)); // -1 (str1 < str2)
console.log(str2.localeCompare(str1)); // 1 (str2 > str1)
console.log(str1.localeCompare(str3)); // 0 (equal)

// Sort array of strings
const fruits = ['banana', 'apple', 'cherry', 'date'];
fruits.sort((a, b) => a.localeCompare(b));
console.log(fruits); // ['apple', 'banana', 'cherry', 'date']

// Case-insensitive sort
const words = ['Zebra', 'apple', 'Banana'];
words.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
console.log(words); // ['apple', 'Banana', 'Zebra']

// Locale-aware sorting
const names = ['Ä', 'Z', 'A'];
console.log(names.sort((a, b) => a.localeCompare(b, 'de')));
```

## Template and Formatting Methods

### concat()

Concatenate strings.

```javascript
const str1 = 'Hello';
const str2 = 'World';

console.log(str1.concat(' ', str2));           // 'Hello World'
console.log(str1.concat(' ', str2, '!'));      // 'Hello World!'

// Multiple arguments
console.log('a'.concat('b', 'c', 'd'));        // 'abcd'

// Usually use template literals instead
const result = `${str1} ${str2}`; // Better approach
```

## Character Methods

### charAt()

Get the character at a specific index (covered earlier in detail).

```javascript
const str = 'Hello';

console.log(str.charAt(0));         // 'H'
console.log(str.charAt(4));         // 'o'
console.log(str.charAt(10));        // '' (empty string)

// Find most frequent character
function mostFrequentChar(str) {
  const counts = {};
  for (const char of str) {
    counts[char] = (counts[char] || 0) + 1;
  }
  return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

console.log(mostFrequentChar('hello')); // 'l'
```

### charCodeAt() and codePointAt()

Get character codes (covered earlier in detail).

```javascript
// Validate password strength
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

## Repetition and Duplication

### repeat()

Repeat a string multiple times (covered earlier in detail).

```javascript
// Create separator
console.log('='.repeat(50));

// Duplicate data
const item = 'item';
console.log(item.repeat(3)); // 'itemitemitem'

// Create indentation levels
function createIndent(level) {
  return '  '.repeat(level);
}

for (let i = 0; i < 3; i++) {
  console.log(createIndent(i) + 'Level ' + i);
}
```

## Best Practices

### Use Template Literals for String Interpolation

```javascript
// Bad: Concatenation
const name = 'Alice';
const greeting = 'Hello ' + name + ', welcome!';

// Good: Template literals
const greeting = `Hello ${name}, welcome!`;

// Multiline strings
const html = `
  <div>
    <p>Hello ${name}</p>
  </div>
`;
```

### Use Appropriate Methods for the Task

```javascript
// Check existence: use includes()
if (str.includes('world')) { /* ... */ }

// Extract: use slice() or substring()
const extracted = str.slice(0, 5);

// Replace: use replace() or replaceAll()
const modified = str.replaceAll('old', 'new');

// Split: use split()
const parts = str.split(' ');
```

### Consider Performance for Large Strings

```javascript
// Bad: Multiple string concatenations
let result = '';
for (let i = 0; i < 1000; i++) {
  result += 'item' + i + ', ';
}

// Good: Use array and join()
const items = [];
for (let i = 0; i < 1000; i++) {
  items.push(`item${i}`);
}
const result = items.join(', ');

// Also good: Template literals with join
const results = Array.from({ length: 1000 }, (_, i) => `item${i}`).join(', ');
```

### Use Case-Insensitive Comparison Properly

```javascript
// Bad: Direct comparison
if (userInput === 'admin') { /* ... */ }

// Good: Case-insensitive comparison
if (userInput.toLowerCase() === 'admin') { /* ... */ }

// Better: Use localeCompare
if (userInput.localeCompare('admin', undefined, { sensitivity: 'base' }) === 0) { /* ... */ }
```

### Validate and Sanitize Input

```javascript
function validateUsername(username) {
  // Trim whitespace
  const trimmed = username.trim();

  // Check length
  if (trimmed.length < 3 || trimmed.length > 20) {
    return false;
  }

  // Check valid characters (alphanumeric and underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return false;
  }

  return true;
}
```

## Common Pitfalls

### Forgetting Strings are Immutable

```javascript
const str = 'Hello';
str.toUpperCase(); // This doesn't modify str!
console.log(str);  // Still 'Hello'

// Correct way
const upper = str.toUpperCase();
console.log(upper); // 'HELLO'
```

### Confusing slice() and substring()

```javascript
const str = 'Hello World';

// slice() supports negative indices
console.log(str.slice(-5));        // 'World'

// substring() treats negative as 0
console.log(str.substring(-5));    // 'Hello World'

// slice(2, 1) returns empty
console.log(str.slice(2, 1));      // ''

// substring swaps arguments if needed
console.log(str.substring(2, 1));  // 'e'
```

### Regex Flags with replace()

```javascript
const str = 'Hello hello hello';

// Without global flag, only first match
console.log(str.replace(/hello/i, 'Hi'));
// 'Hi hello hello'

// With global flag, all matches
console.log(str.replace(/hello/gi, 'Hi'));
// 'Hi Hi Hi'
```

### Off-by-One Errors

```javascript
const str = 'Hello';

// slice(1, 4) returns chars at indices 1, 2, 3 (not 4)
console.log(str.slice(1, 4));      // 'ell'

// indexOf + substring
const index = str.indexOf('l');
console.log(str.substring(0, index)); // 'He'
console.log(str.substring(index));    // 'llo'
```

### Not Handling Edge Cases

```javascript
// Bad: Doesn't handle empty string
function getFirstChar(str) {
  return str.charAt(0);
}

getFirstChar(''); // Returns ''

// Good: Handle edge cases
function getFirstChar(str) {
  if (!str || str.length === 0) {
    return null;
  }
  return str.charAt(0);
}
```

## Performance Considerations

### String Concatenation vs Array Join

```javascript
// Benchmark: concatenation vs join

const items = Array.from({ length: 10000 }, (_, i) => `item${i}`);

// Slow: String concatenation
console.time('concatenation');
let result1 = '';
for (const item of items) {
  result1 += item + ',';
}
console.timeEnd('concatenation');
// ~50-100ms

// Fast: Array.join()
console.time('join');
const result2 = items.join(',');
console.timeEnd('join');
// ~1-5ms

// Result: join() is 10-50x faster for large arrays
```

### Regular Expression Performance

```javascript
// Inefficient: Creating regex repeatedly
function findDates(text) {
  return text.match(/\d{4}-\d{2}-\d{2}/g);
}

// Efficient: Reuse regex pattern
const dateRegex = /\d{4}-\d{2}-\d{2}/g;
function findDates(text) {
  return text.match(dateRegex);
}

// Note: With global flag, reset lastIndex or avoid reuse
const regex = /\d+/g;
console.log(regex.exec('a1b2')); // ['1', ...]
console.log(regex.exec('a1b2')); // ['2', ...] (continues)
regex.lastIndex = 0;             // Reset for new search
console.log(regex.exec('a1b2')); // ['1', ...] (starts over)
```

### String Method Chaining

```javascript
// Multiple iterations through string
const text = '  hello world  ';

// Create intermediate strings
const step1 = text.trim();                 // 'hello world'
const step2 = step1.split(' ');            // ['hello', 'world']
const step3 = step2.map(w => w.toUpperCase()).join(' '); // 'HELLO WORLD'

// Single chain (preferred)
const result = text
  .trim()
  .split(' ')
  .map(w => w.toUpperCase())
  .join(' ');

// Both have same performance, chain is more readable
```

## Real-world Scenarios

### Email Validation and Normalization

```javascript
function validateAndNormalizeEmail(email) {
  // Trim and convert to lowercase
  const normalized = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    throw new Error('Invalid email format');
  }

  return normalized;
}

console.log(validateAndNormalizeEmail('  ALICE@EXAMPLE.COM  ')); // 'alice@example.com'
```

### URL Slug Generation

```javascript
function generateSlug(title) {
  return title
    .toLowerCase()                    // Convert to lowercase
    .trim()                          // Remove whitespace
    .replace(/\s+/g, '-')            // Replace spaces with dashes
    .replace(/[^\w-]/g, '')          // Remove special characters
    .replace(/-+/g, '-')             // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing dashes
}

console.log(generateSlug('Hello World!'));        // 'hello-world'
console.log(generateSlug('JavaScript  Tips'));    // 'javascript-tips'
console.log(generateSlug('---Amazing---Post---')); // 'amazing-post'
```

### CSV Parsing

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

### HTML Tag Removal

```javascript
function stripHtmlTags(html) {
  return html
    .replace(/<[^>]*>/g, '')        // Remove all tags
    .replace(/&nbsp;/g, ' ')        // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const html = '<p>Hello <b>World</b>!</p>';
console.log(stripHtmlTags(html)); // 'Hello World!'
```

### Password Strength Meter

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

### Text Truncation with Ellipsis

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

## Interview Points

### String Immutability

**Question**: What does immutability mean for strings?

**Answer**: Strings in JavaScript are immutable, meaning they cannot be changed after creation. All string methods return new strings rather than modifying the original:

```javascript
const original = 'hello';
const modified = original.toUpperCase();
// original is still 'hello'
// modified is 'HELLO'
```

### Difference Between slice() and substring()

**Question**: What's the difference between slice() and substring()?

**Answer**:
- `slice()` supports negative indices; `substring()` treats negatives as 0
- `slice(a, b)` returns empty if a > b; `substring()` swaps the arguments
- Both are non-mutating and return new strings

```javascript
const str = 'Hello';
str.slice(-3);      // 'llo'
str.substring(-3);  // 'Hello'
```

### String Methods vs Regex Methods

**Question**: When should you use string methods vs regex?

**Answer**: Use string methods for simple operations, regex for complex patterns:
- `indexOf()`: Find simple substring
- `includes()`: Check if contains substring
- `replace()`: Replace with regex patterns
- `match()`: Complex pattern matching

### Performance Optimization

**Question**: How would you optimize string concatenation in a loop?

**Answer**: Use array.join() instead of string concatenation:

```javascript
// Bad: O(n²) time complexity
let result = '';
for (let i = 0; i < 1000; i++) {
  result += 'item' + i;
}

// Good: O(n) time complexity
const items = [];
for (let i = 0; i < 1000; i++) {
  items.push('item' + i);
}
const result = items.join('');
```

### Unicode and Emoji Handling

**Question**: How do you properly handle emoji and Unicode characters?

**Answer**: Use codePointAt() instead of charCodeAt() for emoji:

```javascript
const emoji = '👍';
emoji.charCodeAt(0);  // Incorrect for emoji
emoji.codePointAt(0); // Correct approach

// Iterate over emoji properly
for (const char of emoji) {
  console.log(char.codePointAt(0));
}
```

## Further Reading

### Related Topics

1. **Regular Expressions**: Learn pattern matching and complex text manipulation
2. **Array Methods**: Understand transformation methods that work with strings
3. **Template Literals**: Modern string interpolation and formatting
4. **Internationalization (i18n)**: Locale-aware string handling
5. **Text Processing**: Advanced techniques for natural language processing

### Practice Exercises

1. Write a function to validate a phone number format
2. Create a URL parameter parser
3. Implement a simple markdown to HTML converter
4. Build a text search and highlight function
5. Create a string compression utility

### JavaScript Standards

- **ECMA-262**: Official JavaScript specification
- **String Prototype Methods**: MDN Web Docs
- **Unicode Standard**: Unicode character encoding

---

## Summary

JavaScript string methods provide powerful tools for text manipulation:

**Extraction**: `slice()`, `substring()`, `charAt()`
**Search**: `indexOf()`, `includes()`, `search()`, `match()`
**Case Conversion**: `toUpperCase()`, `toLowerCase()`
**Transformation**: `split()`, `replace()`, `replaceAll()`
**Trimming/Padding**: `trim()`, `padStart()`, `padEnd()`
**Comparison**: `localeCompare()`

Master these methods to handle string operations efficiently and write clean, maintainable code. Remember that strings are immutable, choose the right method for your use case, and consider performance implications for large-scale text processing.
