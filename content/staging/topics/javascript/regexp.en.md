---
title: Regular Expressions
description: Complete guide to JavaScript regular expressions, pattern matching, capture groups and advanced techniques
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Regular Expressions
  - RegExp
  - Strings
status: imported
origin: old/src/content/docs/javascript/regexp.en.md
divergence: 0.276
issues: []
legacy:
  category: JavaScript
  subcategory: Core Concepts
  order: 20
  lastUpdated: 2026-01-07
---

Regular expressions (regex or regexp) are powerful patterns used for matching, searching, and manipulating text. JavaScript provides robust support for regular expressions through the `RegExp` object and string methods.

## Creating Regular Expressions

There are two ways to create a regular expression in JavaScript:

### Literal Notation

```javascript
const pattern = /hello/;
const patternWithFlags = /hello/gi;
```

### Constructor Notation

```javascript
const pattern = new RegExp('hello');
const patternWithFlags = new RegExp('hello', 'gi');

// Useful when pattern is dynamic
const searchTerm = 'user';
const dynamicPattern = new RegExp(searchTerm, 'i');
```

The constructor notation is particularly useful when you need to build patterns dynamically from variables.

## RegExp Flags

Flags modify how the pattern matching behaves. They can be combined as needed.

### `g` - Global

Finds all matches rather than stopping after the first match.

```javascript
const text = 'cat bat rat';

console.log(text.match(/at/));   // ['at'] - first match only
console.log(text.match(/at/g));  // ['at', 'at', 'at'] - all matches
```

### `i` - Case Insensitive

Makes the pattern case-insensitive.

```javascript
const text = 'Hello HELLO hello';

console.log(text.match(/hello/g));   // ['hello']
console.log(text.match(/hello/gi));  // ['Hello', 'HELLO', 'hello']
```

### `m` - Multiline

Changes the behavior of `^` and `$` to match the start and end of each line, not just the entire string.

```javascript
const text = `first line
second line
third line`;

console.log(text.match(/^\w+/g));   // ['first'] - start of string only
console.log(text.match(/^\w+/gm));  // ['first', 'second', 'third'] - start of each line
```

### `s` - Dotall (Single Line)

Makes the dot (`.`) match newline characters as well.

```javascript
const text = 'line1\nline2';

console.log(/line1.line2/.test(text));   // false - dot doesn't match \n
console.log(/line1.line2/s.test(text));  // true - dot matches \n
```

### `u` - Unicode

Enables full Unicode support, allowing correct handling of surrogate pairs and Unicode property escapes.

```javascript
// Without 'u' flag, surrogate pairs are treated as two characters
console.log(/^.$/.test('😀'));    // false
console.log(/^.$/u.test('😀'));   // true

// Unicode property escapes (requires 'u' flag)
console.log(/\p{Emoji}/u.test('😀'));     // true
console.log(/\p{Script=Greek}/u.test('α')); // true
```

### `y` - Sticky

Matches only from the position indicated by the `lastIndex` property.

```javascript
const pattern = /\d+/y;
const text = '123abc456';

pattern.lastIndex = 0;
console.log(pattern.exec(text));  // ['123']

pattern.lastIndex = 3;
console.log(pattern.exec(text));  // null - no match at position 3 (it's 'a')

pattern.lastIndex = 6;
console.log(pattern.exec(text));  // ['456']
```

## Character Classes

Character classes match specific sets of characters.

### Basic Character Classes

| Pattern | Description |
|---------|-------------|
| `.` | Any character except newline (unless `s` flag is used) |
| `\d` | Digit (0-9) |
| `\D` | Non-digit |
| `\w` | Word character (a-z, A-Z, 0-9, _) |
| `\W` | Non-word character |
| `\s` | Whitespace (space, tab, newline, etc.) |
| `\S` | Non-whitespace |

```javascript
const text = 'Order #123 placed on 2024-01-15';

console.log(text.match(/\d+/g));  // ['123', '2024', '01', '15']
console.log(text.match(/\w+/g)); // ['Order', '123', 'placed', 'on', '2024', '01', '15']
```

### Custom Character Sets

Square brackets define custom character sets.

```javascript
// Match specific characters
console.log('gray grey'.match(/gr[ae]y/g));  // ['gray', 'grey']

// Range of characters
console.log('a1b2c3'.match(/[a-z]/g));  // ['a', 'b', 'c']
console.log('a1b2c3'.match(/[0-9]/g));  // ['1', '2', '3']

// Negated set (characters NOT in the set)
console.log('a1b2c3'.match(/[^a-z]/g));  // ['1', '2', '3']

// Combining ranges
console.log('Hello123'.match(/[a-zA-Z0-9]/g));  // ['H', 'e', 'l', 'l', 'o', '1', '2', '3']
```

### Escaping Special Characters

Special regex characters must be escaped with a backslash when you want to match them literally.

```javascript
// Special characters: . * + ? ^ $ { } [ ] \ | ( )

const price = '$19.99';
console.log(price.match(/\$\d+\.\d+/));  // ['$19.99']

const equation = '2+2=4';
console.log(equation.match(/\d\+\d=\d/));  // ['2+2=4']
```

## Quantifiers

Quantifiers specify how many times a pattern should match.

| Quantifier | Description |
|------------|-------------|
| `*` | Zero or more |
| `+` | One or more |
| `?` | Zero or one |
| `{n}` | Exactly n times |
| `{n,}` | n or more times |
| `{n,m}` | Between n and m times |

```javascript
const text = 'goood gooood good god';

console.log(text.match(/go*d/g));     // ['goood', 'gooood', 'good', 'god']
console.log(text.match(/go+d/g));     // ['goood', 'gooood', 'good']
console.log(text.match(/go?d/g));     // ['god']
console.log(text.match(/go{2}d/g));   // ['good']
console.log(text.match(/go{2,3}d/g)); // ['goood', 'good']
console.log(text.match(/go{3,}d/g));  // ['goood', 'gooood']
```

### Greedy vs. Lazy Quantifiers

By default, quantifiers are greedy (match as much as possible). Add `?` to make them lazy (match as little as possible).

```javascript
const html = '<div>content</div>';

// Greedy - matches as much as possible
console.log(html.match(/<.*>/));   // ['<div>content</div>']

// Lazy - matches as little as possible
console.log(html.match(/<.*?>/));  // ['<div>']

// Practical example: extracting HTML tags
console.log(html.match(/<.*?>/g)); // ['<div>', '</div>']
```

## Anchors and Boundaries

Anchors match positions rather than characters.

| Anchor | Description |
|--------|-------------|
| `^` | Start of string (or line with `m` flag) |
| `$` | End of string (or line with `m` flag) |
| `\b` | Word boundary |
| `\B` | Non-word boundary |

```javascript
const text = 'JavaScript is awesome';

// Start and end anchors
console.log(/^JavaScript/.test(text));  // true
console.log(/awesome$/.test(text));     // true
console.log(/^awesome/.test(text));     // false

// Word boundaries
const sentence = 'cat catalog scatter';
console.log(sentence.match(/\bcat\b/g));  // ['cat'] - only whole word
console.log(sentence.match(/cat/g));      // ['cat', 'cat', 'cat'] - all occurrences
```

## Groups and Capturing

### Capturing Groups

Parentheses create capturing groups that extract matched content.

```javascript
const date = '2024-01-15';
const pattern = /(\d{4})-(\d{2})-(\d{2})/;
const match = date.match(pattern);

console.log(match[0]);  // '2024-01-15' (full match)
console.log(match[1]);  // '2024' (year)
console.log(match[2]);  // '01' (month)
console.log(match[3]);  // '15' (day)
```

### Named Capturing Groups

ES2018 introduced named capturing groups for more readable code.

```javascript
const date = '2024-01-15';
const pattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = date.match(pattern);

console.log(match.groups.year);   // '2024'
console.log(match.groups.month);  // '01'
console.log(match.groups.day);    // '15'

// Destructuring with named groups
const { groups: { year, month, day } } = date.match(pattern);
console.log(year, month, day);  // '2024' '01' '15'
```

### Non-Capturing Groups

Use `(?:...)` when you need grouping but don't need to capture.

```javascript
// Without non-capturing group
const match1 = 'JavaScript'.match(/(Java)(Script)/);
console.log(match1);  // ['JavaScript', 'Java', 'Script']

// With non-capturing group
const match2 = 'JavaScript'.match(/(?:Java)(Script)/);
console.log(match2);  // ['JavaScript', 'Script']

// Useful for alternation without capturing
const protocol = 'https://example.com';
const pattern = /(?:https?|ftp):\/\/(\S+)/;
const match3 = protocol.match(pattern);
console.log(match3[1]);  // 'example.com'
```

### Backreferences

Reference previously captured groups within the same pattern.

```javascript
// Numbered backreference
const html = '<div>content</div>';
const pattern = /<(\w+)>.*?<\/\1>/;
console.log(pattern.test(html));  // true

const badHtml = '<div>content</span>';
console.log(pattern.test(badHtml));  // false

// Named backreference
const pattern2 = /<(?<tag>\w+)>.*?<\/\k<tag>>/;
console.log(pattern2.test(html));  // true
```

## Lookahead and Lookbehind

Lookahead and lookbehind assertions match a position based on what comes before or after, without including it in the match.

### Positive Lookahead `(?=...)`

Matches if followed by the specified pattern.

```javascript
const text = 'price: $100, cost: $200';

// Match digits followed by '00'
console.log(text.match(/\d+(?=00)/g));  // ['1', '2']

// Match words followed by a colon
console.log(text.match(/\w+(?=:)/g));  // ['price', 'cost']
```

### Negative Lookahead `(?!...)`

Matches if NOT followed by the specified pattern.

```javascript
const text = 'file.js file.txt file.ts';

// Match 'file' not followed by '.js'
console.log(text.match(/file(?!\.js)\.\w+/g));  // ['file.txt', 'file.ts']
```

### Positive Lookbehind `(?<=...)`

Matches if preceded by the specified pattern.

```javascript
const text = 'price: $100, value: 200';

// Match digits preceded by '$'
console.log(text.match(/(?<=\$)\d+/g));  // ['100']

// Match words preceded by a space and colon
console.log(text.match(/(?<=: )\w+/g));  // ['$100', '200'] - note: $ is \w here
```

### Negative Lookbehind `(?<!...)`

Matches if NOT preceded by the specified pattern.

```javascript
const text = '$100 200 $300';

// Match numbers not preceded by '$'
console.log(text.match(/(?<!\$)\b\d+/g));  // ['00', '200', '00']

// Better pattern for whole numbers
console.log(text.match(/(?<!\$)\b\d+\b/g));  // ['200']
```

## Alternation

The pipe `|` character allows matching one pattern or another.

```javascript
const text = 'I have a cat, a dog, and a bird';

console.log(text.match(/cat|dog|bird/g));  // ['cat', 'dog', 'bird']

// With groups for more complex patterns
const date = 'Date: Jan 15 or January 15';
console.log(date.match(/Jan(?:uary)?\s\d+/g));  // ['Jan 15', 'January 15']
```

## String Methods with Regular Expressions

### `test()` - Check for Match

Returns `true` or `false`.

```javascript
const email = 'user@example.com';
const emailPattern = /^[\w.-]+@[\w.-]+\.\w{2,}$/;

console.log(emailPattern.test(email));  // true
console.log(emailPattern.test('invalid-email'));  // false
```

### `exec()` - Detailed Match Information

Returns an array with match details or `null`.

```javascript
const text = 'cats and dogs';
const pattern = /(\w+) and (\w+)/;
const result = pattern.exec(text);

console.log(result[0]);      // 'cats and dogs'
console.log(result[1]);      // 'cats'
console.log(result[2]);      // 'dogs'
console.log(result.index);   // 0
console.log(result.input);   // 'cats and dogs'

// Iterating with exec (global flag)
const text2 = 'a1 b2 c3';
const pattern2 = /(\w)(\d)/g;
let match;

while ((match = pattern2.exec(text2)) !== null) {
  console.log(`${match[1]} -> ${match[2]} at index ${match.index}`);
}
// Output:
// a -> 1 at index 0
// b -> 2 at index 3
// c -> 3 at index 6
```

### `match()` - Find Matches

Returns an array of matches or `null`.

```javascript
const text = 'The rain in Spain';

// Without global flag - returns detailed match
console.log(text.match(/ain/));
// ['ain', index: 5, input: 'The rain in Spain', groups: undefined]

// With global flag - returns all matches
console.log(text.match(/ain/g));  // ['ain', 'ain']
```

### `matchAll()` - Iterate All Matches

Returns an iterator of all matches with full details (requires `g` flag).

```javascript
const text = 'test1 test2 test3';
const pattern = /test(\d)/g;

for (const match of text.matchAll(pattern)) {
  console.log(`Full: ${match[0]}, Group: ${match[1]}, Index: ${match.index}`);
}
// Output:
// Full: test1, Group: 1, Index: 0
// Full: test2, Group: 2, Index: 6
// Full: test3, Group: 3, Index: 12

// Convert to array
const matches = [...text.matchAll(pattern)];
```

### `replace()` - Replace Matches

Replaces matched text with a replacement string or function result.

```javascript
const text = 'Hello World';

// Simple replacement
console.log(text.replace(/World/, 'JavaScript'));  // 'Hello JavaScript'

// Global replacement
console.log('aaa'.replace(/a/, 'b'));   // 'baa'
console.log('aaa'.replace(/a/g, 'b'));  // 'bbb'

// Using captured groups
const name = 'John Smith';
console.log(name.replace(/(\w+) (\w+)/, '$2, $1'));  // 'Smith, John'

// Named groups in replacement
const date = '2024-01-15';
const result = date.replace(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/,
  '$<month>/$<day>/$<year>'
);
console.log(result);  // '01/15/2024'

// Function replacement
const prices = 'Items: $10, $20, $30';
const updated = prices.replace(/\$(\d+)/g, (match, amount) => {
  return '$' + (parseInt(amount) * 1.1).toFixed(2);
});
console.log(updated);  // 'Items: $11.00, $22.00, $33.00'
```

### `replaceAll()` - Replace All Matches

Replaces all occurrences (similar to `replace()` with `g` flag).

```javascript
const text = 'foo bar foo bar';

console.log(text.replaceAll('foo', 'baz'));  // 'baz bar baz bar'
console.log(text.replaceAll(/foo/g, 'baz')); // 'baz bar baz bar'
// Note: replaceAll with regex requires the 'g' flag
```

### `split()` - Split by Pattern

Splits a string by a pattern.

```javascript
const text = 'apple, banana; cherry  orange';

// Split by various delimiters
console.log(text.split(/[,;\s]+/));
// ['apple', 'banana', 'cherry', 'orange']

// Capturing groups are included in result
console.log('a1b2c3'.split(/(\d)/));
// ['a', '1', 'b', '2', 'c', '3', '']
```

### `search()` - Find Position

Returns the index of the first match or -1.

```javascript
const text = 'Hello World';

console.log(text.search(/World/));  // 6
console.log(text.search(/world/));  // -1
console.log(text.search(/world/i)); // 6
```

## Practical Examples

### Email Validation

```javascript
function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
}

console.log(isValidEmail('user@example.com'));     // true
console.log(isValidEmail('user.name+tag@domain.co.uk')); // true
console.log(isValidEmail('invalid@.com'));         // false
```

### URL Parsing

```javascript
function parseURL(url) {
  const pattern = /^(?<protocol>https?):\/\/(?<host>[\w.-]+)(?::(?<port>\d+))?(?<path>\/[^\?#]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?$/;
  const match = url.match(pattern);
  return match ? match.groups : null;
}

const url = 'https://example.com:8080/path/to/page?query=value#section';
console.log(parseURL(url));
// {
//   protocol: 'https',
//   host: 'example.com',
//   port: '8080',
//   path: '/path/to/page',
//   query: 'query=value',
//   hash: 'section'
// }
```

### Password Strength Checker

```javascript
function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score,
    strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
  };
}

console.log(checkPasswordStrength('Passw0rd!'));
// { checks: {...}, score: 5, strength: 'strong' }
```

### Phone Number Formatting

```javascript
function formatPhoneNumber(phone) {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format based on length
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 11 && digits[0] === '1') {
    return digits.replace(/1(\d{3})(\d{3})(\d{4})/, '+1 ($1) $2-$3');
  }

  return phone; // Return original if no match
}

console.log(formatPhoneNumber('5551234567'));     // '(555) 123-4567'
console.log(formatPhoneNumber('1-555-123-4567')); // '+1 (555) 123-4567'
```

### HTML Tag Stripper

```javascript
function stripHtmlTags(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const html = '<div><script>alert("hi")</script><p>Hello <b>World</b>!</p></div>';
console.log(stripHtmlTags(html));  // 'Hello World!'
```

### Template String Interpolation

```javascript
function interpolate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data.hasOwnProperty(key) ? data[key] : match;
  });
}

const template = 'Hello, {{name}}! You have {{count}} messages.';
const data = { name: 'Alice', count: 5 };

console.log(interpolate(template, data));
// 'Hello, Alice! You have 5 messages.'
```

### Syntax Highlighter (Simple)

```javascript
function highlightCode(code) {
  const patterns = [
    { pattern: /\b(const|let|var|function|return|if|else|for|while)\b/g, class: 'keyword' },
    { pattern: /"[^"]*"|'[^']*'|`[^`]*`/g, class: 'string' },
    { pattern: /\b\d+\.?\d*\b/g, class: 'number' },
    { pattern: /\/\/.*$/gm, class: 'comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, class: 'comment' }
  ];

  let result = code;
  patterns.forEach(({ pattern, class: className }) => {
    result = result.replace(pattern, match => `<span class="${className}">${match}</span>`);
  });

  return result;
}
```

## Performance Considerations

### Avoid Catastrophic Backtracking

Certain patterns can cause exponential time complexity.

```javascript
// BAD - can cause catastrophic backtracking
const badPattern = /^(a+)+$/;

// GOOD - more specific pattern
const goodPattern = /^a+$/;

// Test with problematic input
const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab';
// badPattern.test(input) - would take very long
// goodPattern.test(input) - returns false immediately
```

### Use Specific Patterns

```javascript
// Less efficient
const pattern1 = /.*foo.*/;

// More efficient - be specific
const pattern2 = /\bfoo\b/;
```

### Compile Once, Use Many Times

```javascript
// BAD - compiles regex on each iteration
for (const item of items) {
  if (/pattern/.test(item)) { /* ... */ }
}

// GOOD - compile once
const pattern = /pattern/;
for (const item of items) {
  if (pattern.test(item)) { /* ... */ }
}
```

### Reset lastIndex When Reusing Global Patterns

```javascript
const pattern = /\d+/g;

console.log(pattern.exec('123 456'));  // ['123']
console.log(pattern.exec('123 456'));  // ['456']
console.log(pattern.exec('123 456'));  // null

// Reset for new string
pattern.lastIndex = 0;
console.log(pattern.exec('789'));  // ['789']
```

## Debugging Regular Expressions

### Using console.log

```javascript
const text = 'The quick brown fox';
const pattern = /(\w+)\s(\w+)\s(\w+)\s(\w+)/;
const match = text.match(pattern);

console.log('Full match:', match[0]);
console.log('Groups:', match.slice(1));
console.log('Index:', match.index);
```

### Testing Incrementally

Build complex patterns step by step.

```javascript
// Start simple
const step1 = /\d{4}/;  // Match year
console.log(step1.test('2024-01-15'));

// Add more
const step2 = /\d{4}-\d{2}/;  // Year and month
console.log(step2.test('2024-01-15'));

// Complete pattern
const final = /\d{4}-\d{2}-\d{2}/;
console.log(final.test('2024-01-15'));
```

## Summary

Regular expressions are an essential tool for text processing in JavaScript. Key takeaways:

- Use literal notation (`/pattern/`) for static patterns and constructor notation (`new RegExp()`) for dynamic patterns
- Understand the six flags: `g` (global), `i` (case-insensitive), `m` (multiline), `s` (dotall), `u` (unicode), `y` (sticky)
- Master character classes (`\d`, `\w`, `\s`) and custom sets (`[abc]`, `[^abc]`)
- Use quantifiers appropriately and understand greedy vs. lazy matching
- Leverage capturing groups and named groups for data extraction
- Apply lookahead and lookbehind for complex matching without consuming characters
- Choose the right string method for your use case: `test()`, `match()`, `matchAll()`, `replace()`, `split()`, `search()`
- Be mindful of performance, especially with complex patterns and large inputs

With practice, regular expressions become an invaluable tool for validation, parsing, and text manipulation in your JavaScript applications.
