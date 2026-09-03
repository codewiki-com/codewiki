---
title: Classes and Object-Oriented Programming
description: Complete Guide to JavaScript Class Syntax and Object-Oriented Programming
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Classes
  - OOP
  - Inheritance
status: imported
origin: old/src/content/docs/javascript/classes.en.md
divergence: 0.212
issues: []
legacy:
  category: JavaScript
  subcategory: Object-Oriented
  order: 12
  lastUpdated: 2026-01-07
---

JavaScript introduced the `class` syntax in ES6, providing a clearer and more elegant way to implement object-oriented programming. Although JavaScript classes are still prototype-based at their core, the class syntax makes code easier to understand and maintain.

## Basic Class Syntax

### Class Declaration

Use the `class` keyword to declare a class:

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // Instance method
  introduce() {
    return `My name is ${this.name}, I am ${this.age} years old.`;
  }
}

// Create instance
const person = new Person('John', 25);
console.log(person.introduce()); // "My name is John, I am 25 years old."
```

### Class Expressions

Classes can also be defined using expressions:

```javascript
// Anonymous class expression
const Animal = class {
  constructor(name) {
    this.name = name;
  }
};

// Named class expression
const Dog = class DogClass {
  constructor(name) {
    this.name = name;
  }

  // Class name can only be used inside the class
  clone() {
    return new DogClass(this.name);
  }
};

const dog = new Dog('Buddy');
console.log(dog.name); // "Buddy"
```

### Class Characteristics

Class declarations have the following characteristics:

- **No hoisting**: Must be declared before use, otherwise throws `ReferenceError`
- **Strict mode**: Code inside the class body automatically runs in strict mode
- **Non-enumerable**: Class methods are non-enumerable by default
- **Must use new**: Directly calling the class constructor throws `TypeError`

```javascript
// Error: Class declarations are not hoisted
const car = new Car(); // ReferenceError: Cannot access 'Car' before initialization

class Car {
  constructor(brand) {
    this.brand = brand;
  }
}

// Error: Must use the new keyword
const car2 = Car('Toyota'); // TypeError: Class constructor Car cannot be invoked without 'new'
```

## Constructors

`constructor` is a special method of a class used to create and initialize object instances. Each class can have only one constructor.

```javascript
class Rectangle {
  constructor(width, height) {
    // Parameter validation
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }

    this.width = width;
    this.height = height;

    // Can call other methods in the constructor
    this._calculateArea();
  }

  _calculateArea() {
    this.area = this.width * this.height;
  }
}

const rect = new Rectangle(10, 5);
console.log(rect.area); // 50
```

### Default Constructor

If no constructor is explicitly defined, JavaScript provides a default empty constructor:

```javascript
class Empty {
  // Equivalent to: constructor() {}
}

class Child extends Parent {
  // Equivalent to: constructor(...args) { super(...args); }
}
```

### Validation in Constructor

Performing input validation in the constructor is a good practice:

```javascript
class User {
  constructor(username, email) {
    if (!username || username.length < 3) {
      throw new Error('Username must contain at least 3 characters');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address');
    }

    this.username = username;
    this.email = email;
    this.createdAt = new Date();
  }
}

try {
  const user = new User('ab', 'invalid-email');
} catch (error) {
  console.error(error.message); // "Username must contain at least 3 characters"
}
```

## Instance Methods

Instance methods are defined on the class prototype and can be shared by all instances:

```javascript
class Calculator {
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  add(num) {
    this.value += num;
    return this; // Return this to support method chaining
  }

  subtract(num) {
    this.value -= num;
    return this;
  }

  multiply(num) {
    this.value *= num;
    return this;
  }

  divide(num) {
    if (num === 0) {
      throw new Error('Cannot divide by zero');
    }
    this.value /= num;
    return this;
  }

  reset() {
    this.value = 0;
    return this;
  }

  getResult() {
    return this.value;
  }
}

// Method chaining example
const calc = new Calculator(10);
const result = calc.add(5).multiply(2).subtract(10).getResult();
console.log(result); // 20
```

### Method Shorthand and Computed Property Names

Class methods support computed property names:

```javascript
const methodName = 'dynamicMethod';

class DynamicClass {
  // Computed property name method
  [methodName]() {
    return 'This is a dynamically named method';
  }

  ['get' + 'Data']() {
    return { id: 1, name: 'test' };
  }
}

const obj = new DynamicClass();
console.log(obj.dynamicMethod()); // "This is a dynamically named method"
console.log(obj.getData()); // { id: 1, name: 'test' }
```

## Static Members

### Static Methods

Static methods belong to the class itself, not to class instances. Define them using the `static` keyword:

```javascript
class MathUtils {
  // Static methods
  static add(a, b) {
    return a + b;
  }

  static subtract(a, b) {
    return a - b;
  }

  static isEven(num) {
    return num % 2 === 0;
  }

  static factorial(n) {
    if (n <= 1) return 1;
    return n * MathUtils.factorial(n - 1);
  }
}

// Call directly through the class name
console.log(MathUtils.add(5, 3)); // 8
console.log(MathUtils.isEven(4)); // true
console.log(MathUtils.factorial(5)); // 120

// Cannot call static methods through instances
const utils = new MathUtils();
// utils.add(5, 3); // TypeError: utils.add is not a function
```

### Static Properties

ES2022 introduced support for static properties:

```javascript
class Config {
  // Static properties
  static version = '1.0.0';
  static defaultSettings = {
    theme: 'light',
    language: 'en-US',
    fontSize: 14
  };

  static getVersion() {
    return this.version;
  }

  static updateSettings(newSettings) {
    this.defaultSettings = { ...this.defaultSettings, ...newSettings };
  }
}

console.log(Config.version); // "1.0.0"
console.log(Config.defaultSettings.theme); // "light"

Config.updateSettings({ theme: 'dark' });
console.log(Config.defaultSettings.theme); // "dark"
```

### Static Initialization Blocks

ES2022 also introduced static initialization blocks for complex static property initialization:

```javascript
class Database {
  static connection;
  static isInitialized = false;

  // Static initialization block
  static {
    try {
      this.connection = this.createConnection();
      this.isInitialized = true;
      console.log('Database connection initialized successfully');
    } catch (error) {
      console.error('Database connection initialization failed:', error);
      this.connection = null;
    }
  }

  static createConnection() {
    // Simulate creating database connection
    return { host: 'localhost', port: 3306 };
  }
}

console.log(Database.isInitialized); // true
console.log(Database.connection); // { host: 'localhost', port: 3306 }
```

### Factory Pattern Application

Static methods are ideal for implementing the factory pattern:

```javascript
class Product {
  constructor(name, price, category) {
    this.name = name;
    this.price = price;
    this.category = category;
    this.id = Product.generateId();
  }

  static #idCounter = 0;

  static generateId() {
    return `PROD-${++this.#idCounter}`;
  }

  // Create instance from JSON
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new Product(data.name, data.price, data.category);
  }

  // Create discounted product
  static createDiscounted(name, price, discountPercent, category) {
    const discountedPrice = price * (1 - discountPercent / 100);
    const product = new Product(name, discountedPrice, category);
    product.originalPrice = price;
    product.discount = discountPercent;
    return product;
  }

  // Batch create
  static createBatch(items) {
    return items.map(item => new Product(item.name, item.price, item.category));
  }
}

const product1 = Product.fromJSON('{"name":"Laptop","price":5999,"category":"Electronics"}');
const product2 = Product.createDiscounted('Smartphone', 3999, 20, 'Electronics');

console.log(product1); // Product { name: 'Laptop', price: 5999, ... }
console.log(product2.price); // 3199.2
console.log(product2.discount); // 20
```

## Getters and Setters

Getters and Setters allow you to define accessor properties, executing custom logic when reading or setting properties:

```javascript
class Temperature {
  constructor(celsius) {
    this._celsius = celsius;
  }

  // Getter
  get celsius() {
    return this._celsius;
  }

  // Setter
  set celsius(value) {
    if (value < -273.15) {
      throw new Error('Temperature cannot be below absolute zero');
    }
    this._celsius = value;
  }

  // Getter and setter for Fahrenheit
  get fahrenheit() {
    return this._celsius * 9 / 5 + 32;
  }

  set fahrenheit(value) {
    this.celsius = (value - 32) * 5 / 9;
  }

  // Kelvin temperature
  get kelvin() {
    return this._celsius + 273.15;
  }

  set kelvin(value) {
    this.celsius = value - 273.15;
  }
}

const temp = new Temperature(25);
console.log(temp.celsius); // 25
console.log(temp.fahrenheit); // 77
console.log(temp.kelvin); // 298.15

temp.fahrenheit = 86;
console.log(temp.celsius); // 30
```

### Computed Properties and Data Validation

Getters and Setters are commonly used for computed properties and data validation:

```javascript
class Person {
  constructor(firstName, lastName, birthYear) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthYear = birthYear;
  }

  // Computed property: full name
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  set fullName(value) {
    const parts = value.split(' ');
    if (parts.length < 2) {
      throw new Error('Full name must include first and last name');
    }
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(' ');
  }

  // Computed property: age
  get age() {
    return new Date().getFullYear() - this.birthYear;
  }

  // Read-only property example
  get isAdult() {
    return this.age >= 18;
  }
}

const person = new Person('John', 'Doe', 2000);
console.log(person.fullName); // "John Doe"
console.log(person.age); // 26 (assuming current year is 2026)
console.log(person.isAdult); // true

person.fullName = 'Jane Smith';
console.log(person.firstName); // "Jane"
console.log(person.lastName); // "Smith"
```

### Lazy Computed Properties

Using Getters to implement lazy computation (delayed computation):

```javascript
class DataProcessor {
  constructor(data) {
    this._data = data;
    this._processedData = null;
  }

  // Lazy computation: only process data on first access
  get processedData() {
    if (this._processedData === null) {
      console.log('Processing data...');
      this._processedData = this._data.map(item => item * 2);
    }
    return this._processedData;
  }

  // Invalidate data, recompute on next access
  invalidateCache() {
    this._processedData = null;
  }
}

const processor = new DataProcessor([1, 2, 3, 4, 5]);
console.log(processor.processedData); // "Processing data..." [2, 4, 6, 8, 10]
console.log(processor.processedData); // [2, 4, 6, 8, 10] (no recomputation needed)
```

## Class Inheritance

### Basic Inheritance

Use the `extends` keyword to implement class inheritance:

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }

  move(distance = 0) {
    console.log(`${this.name} moved ${distance} meters`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    // Call parent constructor
    super(name);
    this.breed = breed;
  }

  // Override parent method
  speak() {
    console.log(`${this.name} barks`);
  }

  // Extended functionality
  fetch(item) {
    console.log(`${this.name} goes to fetch ${item}`);
  }
}

const dog = new Dog('Buddy', 'Golden Retriever');
dog.speak(); // "Buddy barks"
dog.move(10); // "Buddy moved 10 meters"
dog.fetch('ball'); // "Buddy goes to fetch ball"
```

### The super Keyword

The `super` keyword is used to call the parent class's constructor and methods:

```javascript
class Vehicle {
  constructor(brand, year) {
    this.brand = brand;
    this.year = year;
  }

  getInfo() {
    return `${this.year} ${this.brand}`;
  }

  start() {
    return 'Vehicle starting';
  }
}

class ElectricCar extends Vehicle {
  constructor(brand, year, batteryCapacity) {
    // Must call super() before using this
    super(brand, year);
    this.batteryCapacity = batteryCapacity;
    this.batteryLevel = 100;
  }

  // Call and extend parent method
  getInfo() {
    return `${super.getInfo()} - Battery capacity: ${this.batteryCapacity}kWh`;
  }

  start() {
    const parentMessage = super.start();
    return `${parentMessage} - Electric mode`;
  }

  charge() {
    this.batteryLevel = 100;
    return 'Charging complete';
  }
}

const tesla = new ElectricCar('Tesla', 2024, 75);
console.log(tesla.getInfo()); // "2024 Tesla - Battery capacity: 75kWh"
console.log(tesla.start()); // "Vehicle starting - Electric mode"
```

### Multi-level Inheritance

```javascript
class LivingThing {
  constructor(name) {
    this.name = name;
    this.isAlive = true;
  }

  breathe() {
    console.log(`${this.name} is breathing`);
  }
}

class Animal extends LivingThing {
  constructor(name, species) {
    super(name);
    this.species = species;
  }

  move() {
    console.log(`${this.name} is moving`);
  }
}

class Bird extends Animal {
  constructor(name, canFly = true) {
    super(name, 'Bird');
    this.canFly = canFly;
  }

  fly() {
    if (this.canFly) {
      console.log(`${this.name} is flying`);
    } else {
      console.log(`${this.name} cannot fly`);
    }
  }
}

class Eagle extends Bird {
  constructor(name) {
    super(name, true);
    this.wingspan = 2.3; // Wingspan in meters
  }

  hunt() {
    console.log(`${this.name} is hunting`);
  }
}

const eagle = new Eagle('Golden Eagle');
eagle.breathe(); // "Golden Eagle is breathing"
eagle.move(); // "Golden Eagle is moving"
eagle.fly(); // "Golden Eagle is flying"
eagle.hunt(); // "Golden Eagle is hunting"
```

### Extending Built-in Classes

You can extend JavaScript's built-in classes:

```javascript
class CustomArray extends Array {
  // Get first element
  get first() {
    return this[0];
  }

  // Get last element
  get last() {
    return this[this.length - 1];
  }

  // Sum
  sum() {
    return this.reduce((acc, val) => acc + val, 0);
  }

  // Average
  average() {
    return this.length ? this.sum() / this.length : 0;
  }

  // Remove duplicates
  unique() {
    return new CustomArray(...new Set(this));
  }

  // Chunk
  chunk(size) {
    const chunks = [];
    for (let i = 0; i < this.length; i += size) {
      chunks.push(new CustomArray(...this.slice(i, i + size)));
    }
    return chunks;
  }
}

const arr = new CustomArray(1, 2, 3, 2, 1, 4, 5);
console.log(arr.first); // 1
console.log(arr.last); // 5
console.log(arr.sum()); // 18
console.log(arr.average()); // ~2.57
console.log(arr.unique()); // CustomArray [1, 2, 3, 4, 5]
console.log(arr.chunk(3)); // [CustomArray [1, 2, 3], CustomArray [2, 1, 4], CustomArray [5]]

// Inherited methods return same type instance
const mapped = arr.map(x => x * 2);
console.log(mapped instanceof CustomArray); // true
```

### Extending the Error Class

Creating custom error types:

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;

    // Fix prototype chain (needed in some environments)
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field
    };
  }
}

class NetworkError extends Error {
  constructor(message, statusCode, url) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.url = url;

    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  isServerError() {
    return this.statusCode >= 500;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.timestamp = new Date();

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

// Using custom errors
function validateUser(user) {
  if (!user.email) {
    throw new ValidationError('Email cannot be empty', 'email');
  }
  if (!user.password || user.password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters', 'password');
  }
}

try {
  validateUser({ email: '', password: '123' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation error - Field: ${error.field}, Message: ${error.message}`);
  }
}
```

## Private Fields and Methods

ES2022 introduced true private fields and methods using the `#` prefix:

### Private Instance Fields

```javascript
class BankAccount {
  // Private fields
  #balance = 0;
  #transactionHistory = [];
  #accountNumber;

  constructor(accountNumber, initialBalance = 0) {
    this.#accountNumber = accountNumber;
    if (initialBalance > 0) {
      this.#balance = initialBalance;
      this.#recordTransaction('Initial deposit', initialBalance);
    }
  }

  // Private method
  #recordTransaction(type, amount) {
    this.#transactionHistory.push({
      type,
      amount,
      date: new Date(),
      balance: this.#balance
    });
  }

  #validateAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
  }

  // Public methods
  deposit(amount) {
    this.#validateAmount(amount);
    this.#balance += amount;
    this.#recordTransaction('Deposit', amount);
    return this.#balance;
  }

  withdraw(amount) {
    this.#validateAmount(amount);
    if (amount > this.#balance) {
      throw new Error('Insufficient funds');
    }
    this.#balance -= amount;
    this.#recordTransaction('Withdrawal', amount);
    return this.#balance;
  }

  getBalance() {
    return this.#balance;
  }

  getTransactionHistory() {
    // Return copy to protect internal data
    return this.#transactionHistory.map(t => ({ ...t }));
  }

  // Read-only account info
  get accountInfo() {
    return {
      accountNumber: this.#accountNumber.slice(-4).padStart(this.#accountNumber.length, '*'),
      balance: this.#balance,
      transactionCount: this.#transactionHistory.length
    };
  }
}

const account = new BankAccount('1234567890', 1000);
account.deposit(500);
account.withdraw(200);
console.log(account.getBalance()); // 1300
console.log(account.accountInfo);
// { accountNumber: '******7890', balance: 1300, transactionCount: 3 }

// Cannot directly access private fields
// console.log(account.#balance); // SyntaxError
```

### Private Static Fields and Methods

```javascript
class IdGenerator {
  // Private static fields
  static #counter = 0;
  static #prefix = 'ID';
  static #usedIds = new Set();

  // Private static methods
  static #formatId(num) {
    return `${this.#prefix}_${num.toString().padStart(6, '0')}`;
  }

  static #isUnique(id) {
    return !this.#usedIds.has(id);
  }

  // Public static methods
  static generate() {
    let id;
    do {
      this.#counter++;
      id = this.#formatId(this.#counter);
    } while (!this.#isUnique(id));

    this.#usedIds.add(id);
    return id;
  }

  static setPrefix(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw new Error('Prefix must be a non-empty string');
    }
    this.#prefix = prefix;
  }

  static getCount() {
    return this.#counter;
  }

  static reset() {
    this.#counter = 0;
    this.#usedIds.clear();
  }

  // Check if ID has been used
  static isUsed(id) {
    return this.#usedIds.has(id);
  }
}

console.log(IdGenerator.generate()); // "ID_000001"
console.log(IdGenerator.generate()); // "ID_000002"

IdGenerator.setPrefix('USER');
console.log(IdGenerator.generate()); // "USER_000003"

console.log(IdGenerator.getCount()); // 3
console.log(IdGenerator.isUsed('ID_000001')); // true
```

### Private Field Existence Check

Use the `in` operator to check if an object has a certain private field:

```javascript
class SecureData {
  #secret;

  constructor(secret) {
    this.#secret = secret;
  }

  // Check if object is a SecureData instance (by checking private field)
  static isSecureData(obj) {
    return #secret in obj;
  }

  getSecret(password) {
    if (password === 'admin123') {
      return this.#secret;
    }
    throw new Error('Wrong password');
  }

  // Static method: safely get data
  static safeGet(obj, password) {
    if (this.isSecureData(obj)) {
      return obj.getSecret(password);
    }
    throw new Error('Not a valid SecureData object');
  }
}

const data = new SecureData('Confidential information');
console.log(SecureData.isSecureData(data)); // true
console.log(SecureData.isSecureData({})); // false
console.log(SecureData.isSecureData({ secret: 'fake' })); // false
```

### Private Accessors

Private Getters and Setters:

```javascript
class User {
  #password;
  #loginAttempts = 0;
  static #maxAttempts = 3;

  constructor(username, password) {
    this.username = username;
    this.#password = password;
  }

  // Private getter
  get #hashedPassword() {
    // Simplified hash simulation
    return this.#password.split('').reverse().join('');
  }

  // Private setter
  set #resetAttempts(value) {
    this.#loginAttempts = value;
  }

  validatePassword(input) {
    if (this.#loginAttempts >= User.#maxAttempts) {
      throw new Error('Account locked, please try again later');
    }

    const inputHash = input.split('').reverse().join('');
    if (inputHash === this.#hashedPassword) {
      this.#resetAttempts = 0;
      return true;
    }

    this.#loginAttempts++;
    return false;
  }

  get isLocked() {
    return this.#loginAttempts >= User.#maxAttempts;
  }
}

const user = new User('admin', 'secret123');
console.log(user.validatePassword('wrong')); // false
console.log(user.validatePassword('secret123')); // true
```

## Mixins Pattern

JavaScript does not support multiple inheritance, but you can use the Mixins pattern to combine functionality from multiple classes:

### Basic Mixin Implementation

```javascript
// Define Mixin functions
const Flyable = (Base) => class extends Base {
  fly() {
    console.log(`${this.name} is flying`);
  }

  land() {
    console.log(`${this.name} has landed`);
  }

  get canFly() {
    return true;
  }
};

const Swimmable = (Base) => class extends Base {
  swim() {
    console.log(`${this.name} is swimming`);
  }

  dive(depth) {
    console.log(`${this.name} dives to ${depth} meters deep`);
  }

  get canSwim() {
    return true;
  }
};

const Walkable = (Base) => class extends Base {
  walk() {
    console.log(`${this.name} is walking`);
  }

  run() {
    console.log(`${this.name} is running`);
  }

  get canWalk() {
    return true;
  }
};

// Base class
class Animal {
  constructor(name) {
    this.name = name;
  }

  eat() {
    console.log(`${this.name} is eating`);
  }
}

// Combine multiple Mixins
class Duck extends Flyable(Swimmable(Walkable(Animal))) {
  quack() {
    console.log(`${this.name} quacks`);
  }
}

const duck = new Duck('Donald');
duck.fly();   // "Donald is flying"
duck.swim();  // "Donald is swimming"
duck.walk();  // "Donald is walking"
duck.quack(); // "Donald quacks"
duck.eat();   // "Donald is eating"

console.log(duck.canFly);  // true
console.log(duck.canSwim); // true
console.log(duck.canWalk); // true
```

### Mixins with State

```javascript
// Event emitter Mixin
const EventEmitter = (Base) => class extends Base {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
    return this;
  }

  off(event, callback) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event).delete(callback);
    }
    return this;
  }

  emit(event, ...args) {
    if (this.#listeners.has(event)) {
      for (const callback of this.#listeners.get(event)) {
        callback.call(this, ...args);
      }
    }
    return this;
  }

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.call(this, ...args);
    };
    return this.on(event, wrapper);
  }
};

// Serializable Mixin
const Serializable = (Base) => class extends Base {
  toJSON() {
    const result = {};
    for (const key of Object.keys(this)) {
      if (!key.startsWith('_')) {
        result[key] = this[key];
      }
    }
    return result;
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const instance = new this();
    Object.assign(instance, data);
    return instance;
  }
};

// Timestamped Mixin
const Timestamped = (Base) => class extends Base {
  constructor(...args) {
    super(...args);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  get age() {
    return Date.now() - this.createdAt.getTime();
  }
};

// Combined usage
class Document extends EventEmitter(Serializable(Timestamped(class {}))) {
  constructor(title, content) {
    super();
    this.title = title;
    this.content = content;
  }

  update(content) {
    const oldContent = this.content;
    this.content = content;
    this.touch();
    this.emit('update', { oldContent, newContent: content });
  }
}

const doc = new Document('My Document', 'Initial content');

doc.on('update', ({ oldContent, newContent }) => {
  console.log(`Content updated from "${oldContent}" to "${newContent}"`);
});

doc.update('New content');
// "Content updated from "Initial content" to "New content""

console.log(doc.toString());
// Outputs formatted JSON
```

### Functional Composition Mixins

```javascript
// Validatable Mixin
const Validatable = (Base) => class extends Base {
  #rules = [];
  #errors = [];

  addRule(rule, message) {
    this.#rules.push({ validate: rule, message });
    return this;
  }

  validate() {
    this.#errors = [];
    for (const { validate, message } of this.#rules) {
      if (!validate(this)) {
        this.#errors.push(message);
      }
    }
    return this.#errors.length === 0;
  }

  get errors() {
    return [...this.#errors];
  }

  get isValid() {
    return this.validate();
  }
};

// Comparable Mixin
const Comparable = (Base) => class extends Base {
  compareTo(other) {
    throw new Error('Subclass must implement compareTo method');
  }

  equals(other) {
    return this.compareTo(other) === 0;
  }

  lessThan(other) {
    return this.compareTo(other) < 0;
  }

  greaterThan(other) {
    return this.compareTo(other) > 0;
  }

  lessThanOrEqual(other) {
    return this.compareTo(other) <= 0;
  }

  greaterThanOrEqual(other) {
    return this.compareTo(other) >= 0;
  }
};

// Cloneable Mixin
const Cloneable = (Base) => class extends Base {
  clone() {
    const cloned = Object.create(Object.getPrototypeOf(this));
    for (const key of Object.keys(this)) {
      const value = this[key];
      if (value && typeof value === 'object') {
        cloned[key] = JSON.parse(JSON.stringify(value));
      } else {
        cloned[key] = value;
      }
    }
    return cloned;
  }
};

// Combined usage
class Product extends Validatable(Comparable(Cloneable(class {}))) {
  constructor(name, price) {
    super();
    this.name = name;
    this.price = price;

    // Add validation rules
    this.addRule(p => p.name.length >= 2, 'Product name must be at least 2 characters')
        .addRule(p => p.price > 0, 'Price must be greater than 0')
        .addRule(p => p.price < 1000000, 'Price cannot exceed 1 million');
  }

  compareTo(other) {
    return this.price - other.price;
  }
}

const product1 = new Product('Laptop', 5999);
const product2 = new Product('Smartphone', 3999);

console.log(product1.isValid); // true
console.log(product1.greaterThan(product2)); // true

const cloned = product1.clone();
cloned.price = 4999;
console.log(product1.price); // 5999 (original object unaffected)
console.log(cloned.price); // 4999
```

## Practical Examples

### State Management Class

```javascript
class Store {
  #state;
  #listeners = new Set();
  #reducers = new Map();

  constructor(initialState = {}) {
    this.#state = this.#deepFreeze(initialState);
  }

  #deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    Object.freeze(obj);
    Object.values(obj).forEach(value => this.#deepFreeze(value));
    return obj;
  }

  getState() {
    return this.#state;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  registerReducer(actionType, reducer) {
    this.#reducers.set(actionType, reducer);
  }

  dispatch(action) {
    const { type, payload } = action;
    const reducer = this.#reducers.get(type);

    if (!reducer) {
      console.warn(`No reducer found for ${type}`);
      return;
    }

    const prevState = this.#state;
    const newState = reducer(prevState, payload);

    if (newState !== prevState) {
      this.#state = this.#deepFreeze(newState);
      this.#notifyListeners(prevState, this.#state);
    }
  }

  #notifyListeners(prevState, newState) {
    for (const listener of this.#listeners) {
      listener(newState, prevState);
    }
  }
}

// Usage example
const store = new Store({
  todos: [],
  filter: 'all'
});

// Register reducers
store.registerReducer('ADD_TODO', (state, todo) => ({
  ...state,
  todos: [...state.todos, { id: Date.now(), ...todo, completed: false }]
}));

store.registerReducer('TOGGLE_TODO', (state, id) => ({
  ...state,
  todos: state.todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  )
}));

store.registerReducer('SET_FILTER', (state, filter) => ({
  ...state,
  filter
}));

// Subscribe to changes
const unsubscribe = store.subscribe((newState, prevState) => {
  console.log('State updated:', newState);
});

// Dispatch actions
store.dispatch({ type: 'ADD_TODO', payload: { text: 'Learn JavaScript classes' } });
store.dispatch({ type: 'ADD_TODO', payload: { text: 'Complete project' } });

console.log(store.getState());
```

### HTTP Client Class

```javascript
class HttpClient {
  #baseURL;
  #defaultHeaders;
  #interceptors = {
    request: [],
    response: []
  };

  constructor(baseURL = '', options = {}) {
    this.#baseURL = baseURL;
    this.#defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.#interceptors.request.push(interceptor);
    return this;
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.#interceptors.response.push(interceptor);
    return this;
  }

  async #applyRequestInterceptors(config) {
    let currentConfig = config;
    for (const interceptor of this.#interceptors.request) {
      currentConfig = await interceptor(currentConfig);
    }
    return currentConfig;
  }

  async #applyResponseInterceptors(response) {
    let currentResponse = response;
    for (const interceptor of this.#interceptors.response) {
      currentResponse = await interceptor(currentResponse);
    }
    return currentResponse;
  }

  async #request(method, endpoint, data = null, customConfig = {}) {
    let config = {
      method,
      headers: { ...this.#defaultHeaders, ...customConfig.headers },
      ...customConfig
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    config = await this.#applyRequestInterceptors(config);

    const url = `${this.#baseURL}${endpoint}`;
    let response = await fetch(url, config);

    response = await this.#applyResponseInterceptors(response);

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response.json();
  }

  get(endpoint, config) {
    return this.#request('GET', endpoint, null, config);
  }

  post(endpoint, data, config) {
    return this.#request('POST', endpoint, data, config);
  }

  put(endpoint, data, config) {
    return this.#request('PUT', endpoint, data, config);
  }

  patch(endpoint, data, config) {
    return this.#request('PATCH', endpoint, data, config);
  }

  delete(endpoint, config) {
    return this.#request('DELETE', endpoint, null, config);
  }
}

// Usage example
const api = new HttpClient('https://api.example.com');

// Add authentication interceptor
api.addRequestInterceptor(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add logging interceptor
api.addResponseInterceptor(async (response) => {
  console.log(`[${response.status}] ${response.url}`);
  return response;
});

// Make requests
// const users = await api.get('/users');
// const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });
```

### Component Base Class

```javascript
class Component {
  #element = null;
  #state = {};
  #props = {};
  #isMounted = false;

  constructor(props = {}) {
    this.#props = { ...this.defaultProps, ...props };
  }

  get defaultProps() {
    return {};
  }

  get props() {
    return { ...this.#props };
  }

  get state() {
    return { ...this.#state };
  }

  get element() {
    return this.#element;
  }

  get isMounted() {
    return this.#isMounted;
  }

  setState(newState) {
    const prevState = this.#state;
    this.#state = { ...this.#state, ...newState };

    if (this.#isMounted) {
      this.shouldUpdate(prevState, this.#state) && this.#rerender();
    }
  }

  shouldUpdate(prevState, newState) {
    return JSON.stringify(prevState) !== JSON.stringify(newState);
  }

  #rerender() {
    if (!this.#element || !this.#element.parentNode) return;

    const parent = this.#element.parentNode;
    const newElement = this.render();
    parent.replaceChild(newElement, this.#element);
    this.#element = newElement;
    this.onUpdate();
  }

  mount(container) {
    this.#element = this.render();
    container.appendChild(this.#element);
    this.#isMounted = true;
    this.onMount();
    return this;
  }

  unmount() {
    if (this.#element && this.#element.parentNode) {
      this.onUnmount();
      this.#element.parentNode.removeChild(this.#element);
      this.#element = null;
      this.#isMounted = false;
    }
    return this;
  }

  // Lifecycle hooks
  onMount() {}
  onUpdate() {}
  onUnmount() {}

  render() {
    throw new Error('Subclass must implement render method');
  }
}

// Counter component example
class Counter extends Component {
  get defaultProps() {
    return { initialCount: 0, step: 1 };
  }

  constructor(props) {
    super(props);
    this.setState({ count: this.props.initialCount });
  }

  increment = () => {
    this.setState({ count: this.state.count + this.props.step });
  }

  decrement = () => {
    this.setState({ count: this.state.count - this.props.step });
  }

  onMount() {
    console.log('Counter component mounted');
  }

  onUpdate() {
    console.log('Counter component updated, current value:', this.state.count);
  }

  render() {
    const div = document.createElement('div');
    div.className = 'counter';

    const title = document.createElement('h3');
    title.textContent = `Counter: ${this.state.count}`;

    const decBtn = document.createElement('button');
    decBtn.className = 'dec';
    decBtn.textContent = '-';
    decBtn.addEventListener('click', this.decrement);

    const incBtn = document.createElement('button');
    incBtn.className = 'inc';
    incBtn.textContent = '+';
    incBtn.addEventListener('click', this.increment);

    div.appendChild(title);
    div.appendChild(decBtn);
    div.appendChild(incBtn);

    return div;
  }
}

// Usage
// const counter = new Counter({ initialCount: 10, step: 5 });
// counter.mount(document.getElementById('app'));
```

## Best Practices

### Prefer Composition Over Inheritance

```javascript
// Not recommended: Deep inheritance chain
class Animal { }
class Mammal extends Animal { }
class Dog extends Mammal { }
class Labrador extends Dog { }

// Recommended: Use composition
class Dog {
  constructor(name) {
    this.name = name;
    this.movement = new WalkingBehavior();
    this.sound = new BarkingBehavior();
    this.eating = new CarnivoreBehavior();
  }

  move() {
    return this.movement.execute(this);
  }

  makeSound() {
    return this.sound.execute(this);
  }
}
```

### Keep Single Responsibility for Classes

```javascript
// Not recommended: One class doing too much
class User {
  saveToDatabase() { /* ... */ }
  sendEmail() { /* ... */ }
  generateReport() { /* ... */ }
  validateInput() { /* ... */ }
}

// Recommended: Separate responsibilities
class User {
  constructor(data) {
    this.data = data;
  }
}

class UserRepository {
  save(user) { /* ... */ }
  findById(id) { /* ... */ }
}

class EmailService {
  send(to, subject, body) { /* ... */ }
}

class ReportGenerator {
  generate(data) { /* ... */ }
}
```

### Use Private Fields to Protect Internal State

```javascript
class SafeCounter {
  #count = 0;
  #maxValue;

  constructor(maxValue = Infinity) {
    this.#maxValue = maxValue;
  }

  increment() {
    if (this.#count < this.#maxValue) {
      this.#count++;
      return true;
    }
    return false;
  }

  decrement() {
    if (this.#count > 0) {
      this.#count--;
      return true;
    }
    return false;
  }

  get value() {
    return this.#count;
  }
}
```

### Provide Clear Public Interfaces

```javascript
class ShoppingCart {
  #items = [];

  // Clear public methods
  addItem(product, quantity = 1) {
    const existingItem = this.#findItem(product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.#items.push({ product, quantity });
    }
    return this;
  }

  removeItem(productId) {
    const index = this.#items.findIndex(item => item.product.id === productId);
    if (index > -1) {
      this.#items.splice(index, 1);
    }
    return this;
  }

  updateQuantity(productId, quantity) {
    const item = this.#findItem(productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        this.removeItem(productId);
      }
    }
    return this;
  }

  clear() {
    this.#items = [];
    return this;
  }

  // Computed properties
  get totalItems() {
    return this.#items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice() {
    return this.#items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  get items() {
    return this.#items.map(item => ({ ...item }));
  }

  // Private helper method
  #findItem(productId) {
    return this.#items.find(item => item.product.id === productId);
  }
}
```

### Use Static Methods for Utility Functions and Factory Methods

```javascript
class DateFormatter {
  #date;

  constructor(date = new Date()) {
    this.#date = date;
  }

  // Static factory methods
  static fromString(dateString) {
    return new DateFormatter(new Date(dateString));
  }

  static fromTimestamp(timestamp) {
    return new DateFormatter(new Date(timestamp));
  }

  static now() {
    return new DateFormatter();
  }

  // Static utility methods
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Instance methods
  format(pattern = 'YYYY-MM-DD') {
    const year = this.#date.getFullYear();
    const month = String(this.#date.getMonth() + 1).padStart(2, '0');
    const day = String(this.#date.getDate()).padStart(2, '0');
    const hours = String(this.#date.getHours()).padStart(2, '0');
    const minutes = String(this.#date.getMinutes()).padStart(2, '0');
    const seconds = String(this.#date.getSeconds()).padStart(2, '0');

    return pattern
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  toRelative() {
    const now = Date.now();
    const diff = now - this.#date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'just now';
  }
}

// Usage
const formatter = DateFormatter.fromString('2024-06-15');
console.log(formatter.format('YYYY/MM/DD')); // "2024/06/15"
console.log(DateFormatter.isLeapYear(2024)); // true
```

## Summary

JavaScript's class syntax provides a clear and intuitive way to implement object-oriented programming. Key points include:

- **Class declaration**: Use the `class` keyword to define classes, `constructor` to initialize instances
- **Instance methods**: Methods defined in the class body are added to the prototype and shared by all instances
- **Static members**: Use the `static` keyword to define properties and methods belonging to the class itself
- **Accessors**: `get` and `set` provide controlled access to properties, supporting computed properties and data validation
- **Inheritance**: `extends` implements class inheritance, `super` calls parent class constructor and methods
- **Private fields**: Use `#` prefix for true encapsulation to protect internal state
- **Mixins**: Use function composition to achieve the effect of multiple inheritance, enhancing code reusability

In practice, follow these principles:

1. Prefer composition over inheritance
2. Keep single responsibility for classes
3. Use private fields to protect internal state
4. Provide clear public interfaces
5. Appropriately use static methods as utility functions and factory methods

Understanding and correctly applying these concepts can help you write more modular, maintainable, and extensible JavaScript code.
