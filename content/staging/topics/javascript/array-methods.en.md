---
title: JavaScript Array Methods Complete Guide
description: Master all JavaScript array methods including iteration, transformation, searching, and sorting
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - arrays
  - methods
  - functional
status: imported
origin: old/src/content/docs/javascript/array-methods.en.md
divergence: 0.187
issues: []
legacy:
  category: JavaScript
  subcategory: Built-in Objects
  order: 21
  lastUpdated: 2026-01-07
---

Arrays are fundamental data structures in JavaScript, and mastering array methods is essential for effective programming. This comprehensive guide covers all important array methods with practical examples.

## Creating Arrays

Before diving into methods, let's review the different ways to create arrays.

```javascript
// Array literal (most common)
const fruits = ['apple', 'banana', 'orange'];

// Array constructor
const numbers = new Array(1, 2, 3, 4, 5);

// Array with specified length
const empty = new Array(5); // Creates array with 5 empty slots
console.log(empty.length); // 5

// Array.of() - creates array from arguments
const arr1 = Array.of(7);       // [7]
const arr2 = Array.of(1, 2, 3); // [1, 2, 3]

// Array.from() - creates array from iterable or array-like
const arr3 = Array.from('hello');           // ['h', 'e', 'l', 'l', 'o']
const arr4 = Array.from([1, 2, 3], x => x * 2); // [2, 4, 6]
const arr5 = Array.from({ length: 5 }, (_, i) => i); // [0, 1, 2, 3, 4]

// Spread operator
const original = [1, 2, 3];
const copy = [...original]; // [1, 2, 3]
```

## Mutating Methods

These methods modify the original array.

### push() and pop()

Add or remove elements from the end of an array.

```javascript
const stack = [];

// push() - adds elements to the end, returns new length
stack.push(1);        // returns 1, stack = [1]
stack.push(2, 3);     // returns 3, stack = [1, 2, 3]
console.log(stack);   // [1, 2, 3]

// pop() - removes last element, returns removed element
const last = stack.pop(); // returns 3, stack = [1, 2]
console.log(last);        // 3
console.log(stack);       // [1, 2]

// Pop from empty array returns undefined
const empty = [];
console.log(empty.pop()); // undefined
```

### unshift() and shift()

Add or remove elements from the beginning of an array.

```javascript
const queue = [2, 3];

// unshift() - adds elements to the beginning, returns new length
queue.unshift(1);       // returns 3, queue = [1, 2, 3]
queue.unshift(-1, 0);   // returns 5, queue = [-1, 0, 1, 2, 3]
console.log(queue);     // [-1, 0, 1, 2, 3]

// shift() - removes first element, returns removed element
const first = queue.shift(); // returns -1, queue = [0, 1, 2, 3]
console.log(first);          // -1
console.log(queue);          // [0, 1, 2, 3]
```

### splice()

The Swiss army knife of array manipulation - add, remove, or replace elements.

```javascript
const arr = [1, 2, 3, 4, 5];

// Remove elements: splice(startIndex, deleteCount)
const removed = arr.splice(2, 2); // Remove 2 elements starting at index 2
console.log(removed); // [3, 4]
console.log(arr);     // [1, 2, 5]

// Insert elements: splice(startIndex, 0, ...items)
arr.splice(2, 0, 3, 4); // Insert 3 and 4 at index 2
console.log(arr);       // [1, 2, 3, 4, 5]

// Replace elements: splice(startIndex, deleteCount, ...items)
arr.splice(1, 2, 'a', 'b', 'c'); // Remove 2, insert 3 elements
console.log(arr); // [1, 'a', 'b', 'c', 4, 5]

// Negative indices count from end
const nums = [1, 2, 3, 4, 5];
nums.splice(-2, 1); // Remove 1 element at second-to-last position
console.log(nums);  // [1, 2, 3, 5]

// Remove all elements from index
const data = [1, 2, 3, 4, 5];
data.splice(2); // Remove all from index 2
console.log(data); // [1, 2]
```

### fill()

Fill array with a static value.

```javascript
// fill(value, start?, end?)
const arr = [1, 2, 3, 4, 5];

arr.fill(0);           // [0, 0, 0, 0, 0]
arr.fill(1, 2);        // [0, 0, 1, 1, 1] (from index 2)
arr.fill(2, 1, 3);     // [0, 2, 2, 1, 1] (from index 1 to 3)

// Create array filled with value
const zeros = new Array(5).fill(0);
console.log(zeros); // [0, 0, 0, 0, 0]

// Caution with objects (same reference)
const objects = new Array(3).fill({});
objects[0].value = 1;
console.log(objects); // [{ value: 1 }, { value: 1 }, { value: 1 }]

// Use Array.from for unique objects
const uniqueObjects = Array.from({ length: 3 }, () => ({}));
uniqueObjects[0].value = 1;
console.log(uniqueObjects); // [{ value: 1 }, {}, {}]
```

### copyWithin()

Copy part of the array to another location within the same array.

```javascript
// copyWithin(target, start?, end?)
const arr = [1, 2, 3, 4, 5];

// Copy elements 0-2 to position 3
arr.copyWithin(3, 0, 2);
console.log(arr); // [1, 2, 3, 1, 2]

// Copy last two elements to the beginning
const arr2 = [1, 2, 3, 4, 5];
arr2.copyWithin(0, -2);
console.log(arr2); // [4, 5, 3, 4, 5]
```

## Iteration Methods

These methods iterate over array elements without modifying the original array.

### forEach()

Execute a function for each element.

```javascript
const fruits = ['apple', 'banana', 'orange'];

// Basic usage
fruits.forEach(fruit => {
  console.log(fruit);
});
// 'apple', 'banana', 'orange'

// With index and array
fruits.forEach((fruit, index, array) => {
  console.log(`${index}: ${fruit} (of ${array.length})`);
});
// '0: apple (of 3)'
// '1: banana (of 3)'
// '2: orange (of 3)'

// Using thisArg
const counter = {
  count: 0,
  increment() {
    this.count++;
  }
};

[1, 2, 3].forEach(function() {
  this.increment();
}, counter);

console.log(counter.count); // 3

// Note: forEach cannot be stopped (use for...of or some() for that)
// Note: forEach returns undefined
```

### for...of Loop

Modern way to iterate over array elements.

```javascript
const colors = ['red', 'green', 'blue'];

// Basic iteration
for (const color of colors) {
  console.log(color);
}

// With index using entries()
for (const [index, color] of colors.entries()) {
  console.log(`${index}: ${color}`);
}

// Can be broken
for (const color of colors) {
  if (color === 'green') break;
  console.log(color); // Only 'red'
}
```

### entries(), keys(), values()

Return iterators for the array.

```javascript
const arr = ['a', 'b', 'c'];

// entries() - returns [index, value] pairs
for (const [index, value] of arr.entries()) {
  console.log(index, value);
}
// 0 'a'
// 1 'b'
// 2 'c'

// keys() - returns indices
console.log([...arr.keys()]); // [0, 1, 2]

// values() - returns values
console.log([...arr.values()]); // ['a', 'b', 'c']

// Convert to array
const entries = Array.from(arr.entries());
console.log(entries); // [[0, 'a'], [1, 'b'], [2, 'c']]
```

## Transformation Methods

These methods create new arrays based on transformations.

### map()

Create a new array by transforming each element.

```javascript
const numbers = [1, 2, 3, 4, 5];

// Double each number
const doubled = numbers.map(num => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// Extract property from objects
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 35 }
];

const names = users.map(user => user.name);
console.log(names); // ['Alice', 'Bob', 'Charlie']

// Transform objects
const userCards = users.map(user => ({
  displayName: user.name.toUpperCase(),
  isAdult: user.age >= 18
}));
console.log(userCards);
// [
//   { displayName: 'ALICE', isAdult: true },
//   { displayName: 'BOB', isAdult: true },
//   { displayName: 'CHARLIE', isAdult: true }
// ]

// Using index
const indexed = numbers.map((num, index) => `${index}: ${num}`);
console.log(indexed); // ['0: 1', '1: 2', '2: 3', '3: 4', '4: 5']

// Chaining
const result = numbers
  .map(n => n * 2)
  .map(n => n + 1);
console.log(result); // [3, 5, 7, 9, 11]
```

### filter()

Create a new array with elements that pass a test.

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Filter even numbers
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens); // [2, 4, 6, 8, 10]

// Filter by condition
const products = [
  { name: 'Laptop', price: 1200, inStock: true },
  { name: 'Phone', price: 800, inStock: false },
  { name: 'Tablet', price: 500, inStock: true },
  { name: 'Watch', price: 300, inStock: true }
];

const available = products.filter(p => p.inStock);
console.log(available.length); // 3

const affordable = products.filter(p => p.price < 600 && p.inStock);
console.log(affordable); // [{ name: 'Tablet', ... }, { name: 'Watch', ... }]

// Remove falsy values
const mixed = [0, 1, '', 'hello', null, undefined, false, true, NaN];
const truthy = mixed.filter(Boolean);
console.log(truthy); // [1, 'hello', true]

// Remove duplicates (with Set is better, but filter works)
const withDuplicates = [1, 2, 2, 3, 3, 3, 4];
const unique = withDuplicates.filter((item, index, arr) =>
  arr.indexOf(item) === index
);
console.log(unique); // [1, 2, 3, 4]
```

### reduce()

Reduce array to a single value.

```javascript
const numbers = [1, 2, 3, 4, 5];

// Sum all numbers
const sum = numbers.reduce((accumulator, current) => {
  return accumulator + current;
}, 0);
console.log(sum); // 15

// Without initial value (uses first element)
const sum2 = numbers.reduce((acc, cur) => acc + cur);
console.log(sum2); // 15

// Find maximum
const max = numbers.reduce((max, num) => num > max ? num : max, -Infinity);
console.log(max); // 5

// Count occurrences
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(count); // { apple: 3, banana: 2, orange: 1 }

// Group by property
const people = [
  { name: 'Alice', department: 'Engineering' },
  { name: 'Bob', department: 'Marketing' },
  { name: 'Charlie', department: 'Engineering' },
  { name: 'Diana', department: 'Marketing' }
];

const byDepartment = people.reduce((groups, person) => {
  const dept = person.department;
  groups[dept] = groups[dept] || [];
  groups[dept].push(person);
  return groups;
}, {});
console.log(byDepartment);
// {
//   Engineering: [{ name: 'Alice', ... }, { name: 'Charlie', ... }],
//   Marketing: [{ name: 'Bob', ... }, { name: 'Diana', ... }]
// }

// Flatten nested array
const nested = [[1, 2], [3, 4], [5, 6]];
const flat = nested.reduce((acc, arr) => [...acc, ...arr], []);
console.log(flat); // [1, 2, 3, 4, 5, 6]

// Pipeline of functions
const pipeline = [
  x => x + 1,
  x => x * 2,
  x => x - 3
];
const result = pipeline.reduce((value, fn) => fn(value), 5);
console.log(result); // ((5 + 1) * 2) - 3 = 9
```

### reduceRight()

Same as reduce but processes from right to left.

```javascript
const arr = [[1, 2], [3, 4], [5, 6]];

// Right to left flattening
const flattened = arr.reduceRight((acc, curr) => [...acc, ...curr], []);
console.log(flattened); // [5, 6, 3, 4, 1, 2]

// Compose functions (right to left)
const compose = (...fns) => x =>
  fns.reduceRight((acc, fn) => fn(acc), x);

const add1 = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const composed = compose(add1, double, square);
console.log(composed(3)); // ((3^2) * 2) + 1 = 19
```

### flat()

Flatten nested arrays.

```javascript
// Default depth is 1
const nested = [1, [2, 3], [4, [5, 6]]];
console.log(nested.flat());    // [1, 2, 3, 4, [5, 6]]
console.log(nested.flat(2));   // [1, 2, 3, 4, 5, 6]

// Flatten all levels with Infinity
const deepNested = [1, [2, [3, [4, [5]]]]];
console.log(deepNested.flat(Infinity)); // [1, 2, 3, 4, 5]

// Removes empty slots
const sparse = [1, , 3, , 5];
console.log(sparse.flat()); // [1, 3, 5]
```

### flatMap()

Map then flatten (depth of 1).

```javascript
const sentences = ['Hello world', 'How are you'];

// Split into words
const words = sentences.flatMap(sentence => sentence.split(' '));
console.log(words); // ['Hello', 'world', 'How', 'are', 'you']

// Filter and map in one step
const numbers = [1, 2, 3, 4, 5];
const doubledEvens = numbers.flatMap(n =>
  n % 2 === 0 ? [n * 2] : []
);
console.log(doubledEvens); // [4, 8]

// Duplicate elements conditionally
const items = [{ name: 'A', qty: 2 }, { name: 'B', qty: 1 }];
const expanded = items.flatMap(item =>
  Array(item.qty).fill(item.name)
);
console.log(expanded); // ['A', 'A', 'B']
```

## Searching Methods

Methods for finding elements or checking conditions.

### find() and findIndex()

Find first element matching a condition.

```javascript
const users = [
  { id: 1, name: 'Alice', active: false },
  { id: 2, name: 'Bob', active: true },
  { id: 3, name: 'Charlie', active: true }
];

// find() - returns first matching element or undefined
const activeUser = users.find(user => user.active);
console.log(activeUser); // { id: 2, name: 'Bob', active: true }

const admin = users.find(user => user.role === 'admin');
console.log(admin); // undefined

// findIndex() - returns index of first match or -1
const bobIndex = users.findIndex(user => user.name === 'Bob');
console.log(bobIndex); // 1

const missingIndex = users.findIndex(user => user.id === 99);
console.log(missingIndex); // -1
```

### findLast() and findLastIndex()

Find last element matching a condition (ES2023).

```javascript
const numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];

// findLast() - returns last matching element
const lastEven = numbers.findLast(n => n % 2 === 0);
console.log(lastEven); // 2 (at index 7)

// findLastIndex() - returns index of last match
const lastEvenIndex = numbers.findLastIndex(n => n % 2 === 0);
console.log(lastEvenIndex); // 7
```

### includes()

Check if array contains a value.

```javascript
const fruits = ['apple', 'banana', 'orange'];

console.log(fruits.includes('banana'));   // true
console.log(fruits.includes('grape'));    // false

// With starting index
console.log(fruits.includes('apple', 1)); // false (starts at index 1)

// Works with NaN (unlike indexOf)
const arr = [1, 2, NaN, 4];
console.log(arr.includes(NaN));    // true
console.log(arr.indexOf(NaN));     // -1 (doesn't work!)

// Case sensitive for strings
const words = ['Hello', 'World'];
console.log(words.includes('hello')); // false
```

### indexOf() and lastIndexOf()

Find index of an element.

```javascript
const arr = [1, 2, 3, 2, 1];

// indexOf() - first occurrence
console.log(arr.indexOf(2));     // 1
console.log(arr.indexOf(5));     // -1 (not found)
console.log(arr.indexOf(2, 2));  // 3 (start from index 2)

// lastIndexOf() - last occurrence
console.log(arr.lastIndexOf(2)); // 3
console.log(arr.lastIndexOf(2, 2)); // 1 (search backwards from index 2)

// Common pattern: check if exists
if (arr.indexOf(3) !== -1) {
  console.log('Found!');
}

// Note: Use includes() for simple existence check
// Use indexOf() when you need the position
```

### some() and every()

Test if elements pass a condition.

```javascript
const numbers = [1, 2, 3, 4, 5];

// some() - at least one element passes
const hasEven = numbers.some(n => n % 2 === 0);
console.log(hasEven); // true

const hasNegative = numbers.some(n => n < 0);
console.log(hasNegative); // false

// every() - all elements pass
const allPositive = numbers.every(n => n > 0);
console.log(allPositive); // true

const allEven = numbers.every(n => n % 2 === 0);
console.log(allEven); // false

// Practical example: form validation
const formFields = [
  { name: 'email', valid: true },
  { name: 'password', valid: true },
  { name: 'username', valid: false }
];

const isFormValid = formFields.every(field => field.valid);
console.log(isFormValid); // false

const hasAnyError = formFields.some(field => !field.valid);
console.log(hasAnyError); // true

// Empty array behavior
console.log([].some(x => x > 0));  // false
console.log([].every(x => x > 0)); // true (vacuous truth)
```

## Sorting and Reversing

### sort()

Sort array elements in place.

```javascript
// Default sort (converts to strings)
const fruits = ['banana', 'apple', 'orange', 'grape'];
fruits.sort();
console.log(fruits); // ['apple', 'banana', 'grape', 'orange']

// Numeric sort requires compare function
const numbers = [10, 5, 100, 25, 1];
numbers.sort(); // Wrong!
console.log(numbers); // [1, 10, 100, 25, 5] (string sort)

numbers.sort((a, b) => a - b); // Ascending
console.log(numbers); // [1, 5, 10, 25, 100]

numbers.sort((a, b) => b - a); // Descending
console.log(numbers); // [100, 25, 10, 5, 1]

// Sort objects
const users = [
  { name: 'Charlie', age: 25 },
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
];

// Sort by age ascending
users.sort((a, b) => a.age - b.age);
console.log(users.map(u => u.name)); // ['Charlie', 'Bob', 'Alice']

// Sort by name alphabetically
users.sort((a, b) => a.name.localeCompare(b.name));
console.log(users.map(u => u.name)); // ['Alice', 'Bob', 'Charlie']

// Multi-level sort (by age, then by name)
users.sort((a, b) => {
  if (a.age !== b.age) {
    return a.age - b.age;
  }
  return a.name.localeCompare(b.name);
});

// Case-insensitive sort
const words = ['Banana', 'apple', 'Orange'];
words.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
console.log(words); // ['apple', 'Banana', 'Orange']
```

### toSorted()

Create a sorted copy without modifying original (ES2023).

```javascript
const original = [3, 1, 4, 1, 5, 9, 2, 6];

const sorted = original.toSorted((a, b) => a - b);
console.log(sorted);   // [1, 1, 2, 3, 4, 5, 6, 9]
console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6] (unchanged)
```

### reverse()

Reverse array in place.

```javascript
const arr = [1, 2, 3, 4, 5];
arr.reverse();
console.log(arr); // [5, 4, 3, 2, 1]

// Chain with sort for descending order
const numbers = [3, 1, 4, 1, 5];
numbers.sort((a, b) => a - b).reverse();
console.log(numbers); // [5, 4, 3, 1, 1]
```

### toReversed()

Create a reversed copy without modifying original (ES2023).

```javascript
const original = [1, 2, 3, 4, 5];
const reversed = original.toReversed();
console.log(reversed); // [5, 4, 3, 2, 1]
console.log(original); // [1, 2, 3, 4, 5] (unchanged)
```

## Combining and Slicing

### concat()

Combine arrays.

```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const arr3 = [7, 8, 9];

// Concatenate two arrays
const combined = arr1.concat(arr2);
console.log(combined); // [1, 2, 3, 4, 5, 6]

// Concatenate multiple arrays
const all = arr1.concat(arr2, arr3);
console.log(all); // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Concatenate with values
const withValues = arr1.concat(4, 5);
console.log(withValues); // [1, 2, 3, 4, 5]

// Original arrays unchanged
console.log(arr1); // [1, 2, 3]

// Alternative with spread operator
const spreadCombined = [...arr1, ...arr2, ...arr3];
console.log(spreadCombined); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### slice()

Extract a portion of the array.

```javascript
const arr = [1, 2, 3, 4, 5];

// slice(start, end) - end is exclusive
console.log(arr.slice(1, 4));    // [2, 3, 4]
console.log(arr.slice(2));       // [3, 4, 5] (to end)
console.log(arr.slice());        // [1, 2, 3, 4, 5] (shallow copy)

// Negative indices
console.log(arr.slice(-3));      // [3, 4, 5] (last 3)
console.log(arr.slice(-3, -1));  // [3, 4] (from -3 to -1)
console.log(arr.slice(1, -1));   // [2, 3, 4]

// Original unchanged
console.log(arr); // [1, 2, 3, 4, 5]

// Common use: convert array-like to array
function example() {
  const args = Array.prototype.slice.call(arguments);
  // Modern alternative: Array.from(arguments) or [...arguments]
  return args;
}
```

### toSpliced()

Create a spliced copy without modifying original (ES2023).

```javascript
const original = [1, 2, 3, 4, 5];

// Remove elements
const removed = original.toSpliced(1, 2);
console.log(removed);  // [1, 4, 5]
console.log(original); // [1, 2, 3, 4, 5] (unchanged)

// Insert elements
const inserted = original.toSpliced(2, 0, 'a', 'b');
console.log(inserted); // [1, 2, 'a', 'b', 3, 4, 5]

// Replace elements
const replaced = original.toSpliced(1, 2, 'x', 'y', 'z');
console.log(replaced); // [1, 'x', 'y', 'z', 4, 5]
```

### join()

Convert array to string.

```javascript
const arr = ['Hello', 'World'];

console.log(arr.join());      // 'Hello,World'
console.log(arr.join(' '));   // 'Hello World'
console.log(arr.join('-'));   // 'Hello-World'
console.log(arr.join(''));    // 'HelloWorld'

// Useful for path building
const pathParts = ['users', '123', 'profile'];
const path = '/' + pathParts.join('/');
console.log(path); // '/users/123/profile'

// HTML generation
const items = ['Item 1', 'Item 2', 'Item 3'];
const html = '<li>' + items.join('</li><li>') + '</li>';
console.log(html); // '<li>Item 1</li><li>Item 2</li><li>Item 3</li>'
```

### with()

Create a copy with one element changed (ES2023).

```javascript
const original = ['a', 'b', 'c', 'd'];

const modified = original.with(1, 'x');
console.log(modified); // ['a', 'x', 'c', 'd']
console.log(original); // ['a', 'b', 'c', 'd'] (unchanged)

// Negative index
const modified2 = original.with(-1, 'z');
console.log(modified2); // ['a', 'b', 'c', 'z']

// Chaining
const result = original
  .with(0, '1')
  .with(1, '2')
  .with(2, '3');
console.log(result); // ['1', '2', '3', 'd']
```

## Static Methods

Methods called on the Array constructor.

### Array.isArray()

Check if a value is an array.

```javascript
console.log(Array.isArray([1, 2, 3]));    // true
console.log(Array.isArray('hello'));       // false
console.log(Array.isArray({ length: 3 })); // false
console.log(Array.isArray(new Array()));   // true

// Why not use instanceof?
// Array.isArray works across different window/frame contexts
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const iframeArray = iframe.contentWindow.Array;
const arr = new iframeArray(1, 2, 3);

console.log(arr instanceof Array);   // false (different Array constructor)
console.log(Array.isArray(arr));     // true (always works)
```

### Array.from()

Create array from array-like or iterable.

```javascript
// From string
console.log(Array.from('hello')); // ['h', 'e', 'l', 'l', 'o']

// From Set
const set = new Set([1, 2, 3]);
console.log(Array.from(set)); // [1, 2, 3]

// From Map
const map = new Map([['a', 1], ['b', 2]]);
console.log(Array.from(map)); // [['a', 1], ['b', 2]]

// From NodeList
const divs = document.querySelectorAll('div');
const divArray = Array.from(divs);

// With map function
console.log(Array.from([1, 2, 3], x => x * 2)); // [2, 4, 6]

// Generate sequence
const sequence = Array.from({ length: 5 }, (_, i) => i + 1);
console.log(sequence); // [1, 2, 3, 4, 5]

// Generate alphabet
const alphabet = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i)
);
console.log(alphabet); // ['A', 'B', 'C', ..., 'Z']

// Clone array with transformation
const original = [1, 2, 3];
const squared = Array.from(original, x => x * x);
console.log(squared); // [1, 4, 9]
```

### Array.of()

Create array from arguments.

```javascript
// Difference from Array constructor
console.log(new Array(3));    // [empty x 3]
console.log(Array.of(3));     // [3]

console.log(new Array(1, 2)); // [1, 2]
console.log(Array.of(1, 2));  // [1, 2]

// Useful when array length is unknown
function createArray(...items) {
  return Array.of(...items);
}
```

### Array.fromAsync()

Create array from async iterable (ES2024).

```javascript
// From async generator
async function* asyncGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const arr = await Array.fromAsync(asyncGenerator());
console.log(arr); // [1, 2, 3]

// From array of promises
const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

const results = await Array.fromAsync(promises);
console.log(results); // [1, 2, 3]

// With mapping function
const doubled = await Array.fromAsync(
  asyncGenerator(),
  x => x * 2
);
console.log(doubled); // [2, 4, 6]
```

## Practical Examples

### Array Manipulation Recipes

```javascript
// Remove duplicates
const withDupes = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(withDupes)];
console.log(unique); // [1, 2, 3]

// Remove falsy values
const mixed = [0, 1, false, 2, '', 3, null, undefined, NaN];
const clean = mixed.filter(Boolean);
console.log(clean); // [1, 2, 3]

// Shuffle array (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
console.log(shuffle([1, 2, 3, 4, 5])); // Random order

// Chunk array
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
console.log(chunk([1, 2, 3, 4, 5, 6, 7], 3));
// [[1, 2, 3], [4, 5, 6], [7]]

// Get random element
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}
console.log(getRandomElement(['a', 'b', 'c'])); // Random

// Intersection of arrays
function intersection(arr1, arr2) {
  const set = new Set(arr2);
  return arr1.filter(x => set.has(x));
}
console.log(intersection([1, 2, 3, 4], [3, 4, 5, 6])); // [3, 4]

// Difference of arrays
function difference(arr1, arr2) {
  const set = new Set(arr2);
  return arr1.filter(x => !set.has(x));
}
console.log(difference([1, 2, 3, 4], [3, 4, 5, 6])); // [1, 2]

// Union of arrays
function union(...arrays) {
  return [...new Set(arrays.flat())];
}
console.log(union([1, 2], [2, 3], [3, 4])); // [1, 2, 3, 4]
```

### Data Processing Examples

```javascript
// Calculate statistics
const numbers = [23, 45, 67, 12, 89, 34, 56];

const stats = {
  min: Math.min(...numbers),
  max: Math.max(...numbers),
  sum: numbers.reduce((a, b) => a + b, 0),
  avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
  count: numbers.length
};
console.log(stats);
// { min: 12, max: 89, sum: 326, avg: 46.57, count: 7 }

// Group and count
const orders = [
  { product: 'A', status: 'shipped' },
  { product: 'B', status: 'pending' },
  { product: 'C', status: 'shipped' },
  { product: 'D', status: 'delivered' },
  { product: 'E', status: 'shipped' }
];

const statusCount = orders.reduce((acc, order) => {
  acc[order.status] = (acc[order.status] || 0) + 1;
  return acc;
}, {});
console.log(statusCount);
// { shipped: 3, pending: 1, delivered: 1 }

// Pivot table
const sales = [
  { region: 'North', product: 'A', amount: 100 },
  { region: 'South', product: 'A', amount: 150 },
  { region: 'North', product: 'B', amount: 200 },
  { region: 'South', product: 'B', amount: 250 }
];

const pivot = sales.reduce((acc, sale) => {
  if (!acc[sale.region]) {
    acc[sale.region] = {};
  }
  acc[sale.region][sale.product] =
    (acc[sale.region][sale.product] || 0) + sale.amount;
  return acc;
}, {});
console.log(pivot);
// { North: { A: 100, B: 200 }, South: { A: 150, B: 250 } }

// Top N items
const products = [
  { name: 'A', sales: 100 },
  { name: 'B', sales: 250 },
  { name: 'C', sales: 175 },
  { name: 'D', sales: 300 },
  { name: 'E', sales: 125 }
];

const top3 = products
  .toSorted((a, b) => b.sales - a.sales)
  .slice(0, 3);
console.log(top3.map(p => p.name)); // ['D', 'B', 'C']
```

### Method Chaining

```javascript
const transactions = [
  { id: 1, type: 'income', amount: 1000, category: 'salary' },
  { id: 2, type: 'expense', amount: 50, category: 'food' },
  { id: 3, type: 'expense', amount: 200, category: 'utilities' },
  { id: 4, type: 'income', amount: 500, category: 'freelance' },
  { id: 5, type: 'expense', amount: 100, category: 'food' },
  { id: 6, type: 'expense', amount: 75, category: 'transport' }
];

// Calculate total expenses by category
const expensesByCategory = transactions
  .filter(t => t.type === 'expense')
  .reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
console.log(expensesByCategory);
// { food: 150, utilities: 200, transport: 75 }

// Get formatted expense report
const report = transactions
  .filter(t => t.type === 'expense')
  .sort((a, b) => b.amount - a.amount)
  .map(t => `${t.category}: $${t.amount}`)
  .join('\n');
console.log(report);
// utilities: $200
// food: $100
// transport: $75
// food: $50

// Calculate net balance
const balance = transactions
  .map(t => t.type === 'income' ? t.amount : -t.amount)
  .reduce((sum, amount) => sum + amount, 0);
console.log(`Balance: $${balance}`); // Balance: $1075
```

## Performance Considerations

### Choosing the Right Method

```javascript
// Bad: Multiple iterations
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const badResult = arr
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .reduce((sum, n) => sum + n, 0);

// Good: Single iteration with reduce
const goodResult = arr.reduce((sum, n) => {
  if (n % 2 === 0) {
    return sum + n * 2;
  }
  return sum;
}, 0);

// Both produce 60, but second is more efficient for large arrays
```

### Mutating vs Non-Mutating

```javascript
// Mutating methods (modify original):
// push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin

// Non-mutating methods (return new array):
// map, filter, reduce, slice, concat, flat, flatMap
// toSorted, toReversed, toSpliced, with (ES2023)

// Prefer non-mutating for predictability
const original = [3, 1, 4, 1, 5];

// Mutating (avoid when possible)
const sorted1 = original.slice().sort();

// Non-mutating (preferred)
const sorted2 = original.toSorted();

// original unchanged in both cases
```

### Large Array Operations

```javascript
// For very large arrays, consider:

// 1. Use for loop for critical performance
const arr = new Array(1000000).fill(0).map((_, i) => i);

console.time('forEach');
let sum1 = 0;
arr.forEach(n => sum1 += n);
console.timeEnd('forEach');

console.time('for');
let sum2 = 0;
for (let i = 0; i < arr.length; i++) {
  sum2 += arr[i];
}
console.timeEnd('for');

// 2. Avoid creating intermediate arrays
// Bad: Creates 2 intermediate arrays
const result1 = arr.filter(n => n % 2 === 0).map(n => n * 2);

// Better: Single pass
const result2 = arr.reduce((acc, n) => {
  if (n % 2 === 0) {
    acc.push(n * 2);
  }
  return acc;
}, []);

// 3. Use typed arrays for numeric data
const typedArr = new Int32Array(1000000);
// More memory efficient and faster for numeric operations
```

## Summary

JavaScript array methods can be categorized by their behavior:

**Mutating Methods**: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`

**Iteration Methods**: `forEach`, `entries`, `keys`, `values`

**Transformation Methods**: `map`, `filter`, `reduce`, `reduceRight`, `flat`, `flatMap`

**Searching Methods**: `find`, `findIndex`, `findLast`, `findLastIndex`, `includes`, `indexOf`, `lastIndexOf`, `some`, `every`

**Combining/Slicing**: `concat`, `slice`, `join`

**ES2023 Non-Mutating Copies**: `toSorted`, `toReversed`, `toSpliced`, `with`

**Static Methods**: `Array.isArray`, `Array.from`, `Array.of`, `Array.fromAsync`

Master these methods to write clean, functional, and efficient JavaScript code. Remember to choose the right method for your use case and consider performance implications for large datasets.
