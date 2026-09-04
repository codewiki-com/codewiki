---
title: JavaScript Objects and Prototypes
description: Deep dive into JavaScript objects, prototype chain, prototypal inheritance and property descriptors
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Objects
  - Prototype Chain
  - Inheritance
status: imported
origin: old/src/content/docs/javascript/objects-prototypes.en.md
divergence: 0.309
issues: []
legacy:
  category: JavaScript
  subcategory: Core Concepts
  order: 3
  lastUpdated: 2026-01-07
---

JavaScript is fundamentally an object-oriented language, but it uses a unique approach called prototypal inheritance rather than classical inheritance found in languages like Java or C++. Understanding objects and prototypes is crucial for mastering JavaScript.

## Object Fundamentals

In JavaScript, objects are collections of key-value pairs. Almost everything in JavaScript is an object or behaves like one, including functions, arrays, and even primitive wrapper objects.

```javascript
// Simple object
const user = {
  name: 'Alice',
  age: 30,
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

console.log(user.name); // 'Alice'
user.greet(); // 'Hello, I'm Alice'
```

### Creating Objects

There are multiple ways to create objects in JavaScript:

```javascript
// 1. Object literal (most common)
const obj1 = { key: 'value' };

// 2. Object constructor
const obj2 = new Object();
obj2.key = 'value';

// 3. Object.create()
const obj3 = Object.create(null); // Creates object with no prototype
obj3.key = 'value';

// 4. Constructor function
function Person(name) {
  this.name = name;
}
const obj4 = new Person('Bob');

// 5. ES6 Class (syntactic sugar over constructor functions)
class Animal {
  constructor(name) {
    this.name = name;
  }
}
const obj5 = new Animal('Dog');
```

## Object Literals

Object literals provide a concise way to create objects with properties and methods.

### Basic Syntax

```javascript
const person = {
  firstName: 'John',
  lastName: 'Doe',
  age: 35,

  // Method shorthand (ES6)
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  // Traditional method syntax
  greet: function() {
    console.log('Hello!');
  }
};

console.log(person.getFullName()); // 'John Doe'
```

### Computed Property Names

```javascript
const propName = 'dynamicKey';
const value = 42;

const obj = {
  [propName]: value,
  [`${propName}_2`]: value * 2,
  ['computed' + 'Name']: 'computed value'
};

console.log(obj.dynamicKey); // 42
console.log(obj.dynamicKey_2); // 84
console.log(obj.computedName); // 'computed value'
```

### Property Shorthand

```javascript
const name = 'Alice';
const age = 25;

// Old way
const user1 = {
  name: name,
  age: age
};

// ES6 shorthand
const user2 = { name, age };

console.log(user2); // { name: 'Alice', age: 25 }
```

### Accessing Properties

```javascript
const car = {
  brand: 'Tesla',
  model: 'Model 3',
  'max-speed': 261
};

// Dot notation
console.log(car.brand); // 'Tesla'

// Bracket notation (required for special characters or variables)
console.log(car['max-speed']); // 261

const prop = 'model';
console.log(car[prop]); // 'Model 3'
```

## Property Descriptors

Every property in JavaScript has associated metadata called property descriptors that control how the property behaves.

### Descriptor Attributes

```javascript
const obj = {};

Object.defineProperty(obj, 'name', {
  value: 'John',           // The property value
  writable: true,          // Can the value be changed?
  enumerable: true,        // Will it show up in for...in loops?
  configurable: true       // Can the descriptor be changed or property deleted?
});

console.log(obj.name); // 'John'
```

### Getting Property Descriptors

```javascript
const person = {
  name: 'Alice',
  age: 30
};

// Get descriptor for a single property
const descriptor = Object.getOwnPropertyDescriptor(person, 'name');
console.log(descriptor);
// {
//   value: 'Alice',
//   writable: true,
//   enumerable: true,
//   configurable: true
// }

// Get all descriptors
const allDescriptors = Object.getOwnPropertyDescriptors(person);
console.log(allDescriptors);
```

### Non-Writable Properties

```javascript
const config = {};

Object.defineProperty(config, 'API_KEY', {
  value: 'secret-key-123',
  writable: false,
  enumerable: true,
  configurable: false
});

console.log(config.API_KEY); // 'secret-key-123'
config.API_KEY = 'new-key'; // Silently fails in non-strict mode
console.log(config.API_KEY); // Still 'secret-key-123'

// In strict mode, this would throw an error
// 'use strict';
// config.API_KEY = 'new-key'; // TypeError: Cannot assign to read only property
```

### Non-Enumerable Properties

```javascript
const user = { name: 'Bob' };

Object.defineProperty(user, 'password', {
  value: 'hashed-password',
  enumerable: false
});

console.log(user.password); // 'hashed-password'

// Won't appear in for...in loop
for (let key in user) {
  console.log(key); // Only 'name'
}

// Won't appear in Object.keys()
console.log(Object.keys(user)); // ['name']

// But will appear in Object.getOwnPropertyNames()
console.log(Object.getOwnPropertyNames(user)); // ['name', 'password']
```

### Getters and Setters

```javascript
const person = {
  firstName: 'John',
  lastName: 'Doe',

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  set fullName(value) {
    const parts = value.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
};

console.log(person.fullName); // 'John Doe'
person.fullName = 'Jane Smith';
console.log(person.firstName); // 'Jane'
console.log(person.lastName); // 'Smith'
```

### Defining Getters and Setters with defineProperty

```javascript
const account = {
  _balance: 1000 // Convention: underscore indicates private
};

Object.defineProperty(account, 'balance', {
  get() {
    return this._balance;
  },
  set(value) {
    if (value < 0) {
      throw new Error('Balance cannot be negative');
    }
    this._balance = value;
  },
  enumerable: true,
  configurable: true
});

console.log(account.balance); // 1000
account.balance = 2000;
console.log(account.balance); // 2000
// account.balance = -500; // Throws Error
```

## The Prototype Chain

Every JavaScript object has an internal property called `[[Prototype]]` (accessible via `__proto__` or `Object.getPrototypeOf()`). This creates a chain of objects used for property lookup.

### Understanding Prototypes

```javascript
const animal = {
  eats: true,
  walk() {
    console.log('Animal walks');
  }
};

const dog = {
  barks: true
};

// Set animal as prototype of dog
Object.setPrototypeOf(dog, animal);

console.log(dog.barks); // true (own property)
console.log(dog.eats); // true (inherited from animal)
dog.walk(); // 'Animal walks' (inherited method)

// Check prototype
console.log(Object.getPrototypeOf(dog) === animal); // true
```

### Prototype Chain Lookup

```javascript
const grandparent = {
  surname: 'Smith',
  greet() {
    console.log(`Hello from ${this.surname} family`);
  }
};

const parent = Object.create(grandparent);
parent.occupation = 'Engineer';

const child = Object.create(parent);
child.name = 'Alice';

// Property lookup walks up the chain
console.log(child.name); // 'Alice' (own property)
console.log(child.occupation); // 'Engineer' (from parent)
console.log(child.surname); // 'Smith' (from grandparent)
child.greet(); // 'Hello from Smith family'

// Check the chain
console.log(Object.getPrototypeOf(child) === parent); // true
console.log(Object.getPrototypeOf(parent) === grandparent); // true
```

### hasOwnProperty vs in Operator

```javascript
const parent = { inherited: true };
const child = Object.create(parent);
child.own = true;

console.log('own' in child); // true
console.log('inherited' in child); // true

console.log(child.hasOwnProperty('own')); // true
console.log(child.hasOwnProperty('inherited')); // false
```

### Constructor Functions and Prototypes

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}

// Methods should be on prototype for memory efficiency
Person.prototype.greet = function() {
  console.log(`Hi, I'm ${this.name}, ${this.age} years old`);
};

Person.prototype.species = 'Human';

const alice = new Person('Alice', 25);
const bob = new Person('Bob', 30);

alice.greet(); // 'Hi, I'm Alice, 25 years old'
bob.greet(); // 'Hi, I'm Bob, 30 years old'

console.log(alice.species); // 'Human'

// Both instances share the same prototype
console.log(Object.getPrototypeOf(alice) === Person.prototype); // true
console.log(Object.getPrototypeOf(alice) === Object.getPrototypeOf(bob)); // true

// The greet method is shared, not duplicated
console.log(alice.greet === bob.greet); // true
```

### The Constructor Property

```javascript
function Dog(name) {
  this.name = name;
}

const buddy = new Dog('Buddy');

console.log(buddy.constructor === Dog); // true
console.log(Dog.prototype.constructor === Dog); // true

// Can create new instances using constructor
const max = new buddy.constructor('Max');
console.log(max.name); // 'Max'
```

## Prototypal Inheritance

JavaScript uses prototypal inheritance where objects inherit directly from other objects.

### Object.create()

```javascript
const animalMethods = {
  eat() {
    console.log(`${this.name} is eating`);
  },
  sleep() {
    console.log(`${this.name} is sleeping`);
  }
};

const dog = Object.create(animalMethods);
dog.name = 'Buddy';
dog.bark = function() {
  console.log('Woof!');
};

dog.eat(); // 'Buddy is eating'
dog.bark(); // 'Woof!'
```

### Inheritance with Constructor Functions

```javascript
// Parent constructor
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name} is eating`);
};

// Child constructor
function Dog(name, breed) {
  Animal.call(this, name); // Call parent constructor
  this.breed = breed;
}

// Set up prototype chain
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog; // Fix constructor reference

// Add child-specific methods
Dog.prototype.bark = function() {
  console.log('Woof!');
};

const buddy = new Dog('Buddy', 'Golden Retriever');
buddy.eat(); // 'Buddy is eating' (inherited)
buddy.bark(); // 'Woof!' (own method)

console.log(buddy instanceof Dog); // true
console.log(buddy instanceof Animal); // true
```

### ES6 Class Inheritance

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  eat() {
    console.log(`${this.name} is eating`);
  }

  sleep() {
    console.log(`${this.name} is sleeping`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // Call parent constructor
    this.breed = breed;
  }

  bark() {
    console.log('Woof!');
  }

  // Override parent method
  eat() {
    super.eat(); // Call parent method
    console.log('Dog food is delicious!');
  }
}

const buddy = new Dog('Buddy', 'Labrador');
buddy.eat();
// 'Buddy is eating'
// 'Dog food is delicious!'
buddy.bark(); // 'Woof!'
buddy.sleep(); // 'Buddy is sleeping'
```

### Multiple Inheritance Pattern (Mixins)

JavaScript doesn't support multiple inheritance directly, but we can use mixins:

```javascript
// Mixin objects
const canSwim = {
  swim() {
    console.log(`${this.name} is swimming`);
  }
};

const canFly = {
  fly() {
    console.log(`${this.name} is flying`);
  }
};

// Base class
class Animal {
  constructor(name) {
    this.name = name;
  }
}

// Apply mixins
class Duck extends Animal {
  constructor(name) {
    super(name);
  }
}

Object.assign(Duck.prototype, canSwim, canFly);

const donald = new Duck('Donald');
donald.swim(); // 'Donald is swimming'
donald.fly(); // 'Donald is flying'
```

## Object Static Methods

JavaScript provides many built-in static methods on the Object constructor for working with objects.

### Object.keys(), values(), and entries()

```javascript
const user = {
  name: 'Alice',
  age: 30,
  city: 'New York'
};

// Get all keys
const keys = Object.keys(user);
console.log(keys); // ['name', 'age', 'city']

// Get all values
const values = Object.values(user);
console.log(values); // ['Alice', 30, 'New York']

// Get key-value pairs
const entries = Object.entries(user);
console.log(entries);
// [['name', 'Alice'], ['age', 30], ['city', 'New York']]

// Useful for iteration
Object.entries(user).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
```

### Object.assign()

```javascript
// Copying properties from one or more source objects to target
const target = { a: 1 };
const source1 = { b: 2 };
const source2 = { c: 3 };

const result = Object.assign(target, source1, source2);

console.log(result); // { a: 1, b: 2, c: 3 }
console.log(target); // { a: 1, b: 2, c: 3 } (target is modified)

// Cloning an object (shallow copy)
const original = { x: 1, y: 2 };
const clone = Object.assign({}, original);
console.log(clone); // { x: 1, y: 2 }

// Note: This is a shallow copy
const obj = { a: 1, nested: { b: 2 } };
const copy = Object.assign({}, obj);
copy.nested.b = 99;
console.log(obj.nested.b); // 99 (nested object is shared)
```

### Object.freeze(), seal(), and preventExtensions()

```javascript
// Object.freeze() - No modifications allowed
const frozen = { prop: 42 };
Object.freeze(frozen);

frozen.prop = 99; // Silently fails
frozen.newProp = 'test'; // Silently fails
delete frozen.prop; // Silently fails

console.log(frozen.prop); // 42

// Object.seal() - Can modify existing properties but can't add/delete
const sealed = { prop: 42 };
Object.seal(sealed);

sealed.prop = 99; // Works
sealed.newProp = 'test'; // Silently fails
delete sealed.prop; // Silently fails

console.log(sealed.prop); // 99

// Object.preventExtensions() - Can't add new properties
const obj = { prop: 42 };
Object.preventExtensions(obj);

obj.prop = 99; // Works
obj.newProp = 'test'; // Silently fails
delete obj.prop; // Works

console.log(obj.prop); // 99

// Check object state
console.log(Object.isFrozen(frozen)); // true
console.log(Object.isSealed(sealed)); // true
console.log(Object.isExtensible(obj)); // false
```

### Object.create()

```javascript
// Create object with specific prototype
const proto = {
  greet() {
    console.log('Hello!');
  }
};

const obj = Object.create(proto);
obj.greet(); // 'Hello!'

// Create object with null prototype (no inherited properties)
const pureObj = Object.create(null);
pureObj.name = 'Pure';
console.log(pureObj.toString); // undefined (no Object.prototype)

// Create object with properties
const person = Object.create(proto, {
  name: {
    value: 'Alice',
    writable: true,
    enumerable: true,
    configurable: true
  },
  age: {
    value: 30,
    writable: true,
    enumerable: true,
    configurable: true
  }
});

console.log(person.name); // 'Alice'
person.greet(); // 'Hello!'
```

### Object.is()

```javascript
// More precise equality comparison than ===
console.log(Object.is(25, 25)); // true
console.log(Object.is('foo', 'foo')); // true
console.log(Object.is(NaN, NaN)); // true (unlike ===)
console.log(Object.is(0, -0)); // false (unlike ===)

// Compare with ===
console.log(NaN === NaN); // false
console.log(0 === -0); // true
```

### Object.fromEntries()

```javascript
// Convert key-value pairs to object
const entries = [
  ['name', 'Alice'],
  ['age', 30],
  ['city', 'NYC']
];

const obj = Object.fromEntries(entries);
console.log(obj); // { name: 'Alice', age: 30, city: 'NYC' }

// Useful with Map
const map = new Map([
  ['a', 1],
  ['b', 2]
]);
const objFromMap = Object.fromEntries(map);
console.log(objFromMap); // { a: 1, b: 2 }

// Transform object
const prices = { apple: 1.5, banana: 0.5, orange: 2.0 };
const discountedPrices = Object.fromEntries(
  Object.entries(prices).map(([key, value]) => [key, value * 0.8])
);
console.log(discountedPrices);
// { apple: 1.2, banana: 0.4, orange: 1.6 }
```

### Object.getOwnPropertyNames() and getOwnPropertySymbols()

```javascript
const obj = {
  prop1: 'value1',
  prop2: 'value2'
};

Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false
});

const sym = Symbol('symbol');
obj[sym] = 'symbol value';

// Get all string property names (including non-enumerable)
console.log(Object.getOwnPropertyNames(obj));
// ['prop1', 'prop2', 'hidden']

// Get all symbol properties
console.log(Object.getOwnPropertySymbols(obj));
// [Symbol(symbol)]

// Compare with Object.keys() (only enumerable)
console.log(Object.keys(obj)); // ['prop1', 'prop2']
```

## Best Practices

### Use Object Literals for Simple Objects

```javascript
// Good
const user = {
  name: 'Alice',
  age: 30
};

// Avoid unnecessary constructor
// const user = new Object();
// user.name = 'Alice';
// user.age = 30;
```

### Put Methods on Prototype

```javascript
// Good - methods shared across instances
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log(`Hello, I'm ${this.name}`);
};

// Avoid - method duplicated for each instance
// function Person(name) {
//   this.name = name;
//   this.greet = function() {
//     console.log(`Hello, I'm ${this.name}`);
//   };
// }
```

### Use Object.create() for Prototypal Inheritance

```javascript
// Good
const animal = {
  eat() {
    console.log('eating');
  }
};

const dog = Object.create(animal);
dog.bark = function() {
  console.log('barking');
};
```

### Be Careful with hasOwnProperty

```javascript
const obj = Object.create(null);
obj.prop = 'value';

// Safe way to check own property
console.log(Object.prototype.hasOwnProperty.call(obj, 'prop')); // true

// Or use Object.hasOwn() (ES2022)
console.log(Object.hasOwn(obj, 'prop')); // true
```

### Use Descriptive Property Names

```javascript
// Good
const config = {
  maxConnections: 10,
  timeoutMs: 5000,
  retryAttempts: 3
};

// Less clear
// const config = {
//   max: 10,
//   timeout: 5000,
//   retry: 3
// };
```

### Consider Using Classes for Complex Objects

```javascript
// Modern, clear syntax
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  sendEmail(message) {
    console.log(`Sending "${message}" to ${this.email}`);
  }
}

const user = new User('Alice', 'alice@example.com');
user.sendEmail('Hello!');
```

### Use Object Spread for Shallow Copying

```javascript
const original = { a: 1, b: 2 };

// Modern way
const copy = { ...original };

// Or
const copy2 = Object.assign({}, original);

// Merge objects
const merged = { ...original, c: 3, d: 4 };
console.log(merged); // { a: 1, b: 2, c: 3, d: 4 }
```

## Conclusion

JavaScript's object and prototype system is powerful and flexible. Key takeaways:

- Objects are collections of properties with configurable descriptors
- The prototype chain enables inheritance and property lookup
- Prototypal inheritance is more flexible than classical inheritance
- Object static methods provide powerful tools for object manipulation
- Modern syntax (classes, spread operator) makes working with objects easier

Understanding these concepts deeply will help you write more efficient and maintainable JavaScript code. Whether you use constructor functions, Object.create(), or ES6 classes, the underlying prototype mechanism remains the same.
