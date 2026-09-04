---
title: 类与面向对象
description: JavaScript类语法与面向对象编程完全指南
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - 类
  - OOP
  - 继承
status: imported
origin: old/src/content/docs/javascript/classes.zh.md
divergence: 0.212
issues: []
legacy:
  category: JavaScript
  subcategory: 面向对象
  order: 12
  lastUpdated: 2026-01-07
---

JavaScript 在 ES6 中引入了 `class` 语法，为面向对象编程提供了更加清晰和优雅的方式。虽然 JavaScript 的类本质上仍然是基于原型的，但类语法使得代码更易于理解和维护。

## 类的基本语法

### 类声明

使用 `class` 关键字可以声明一个类：

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 实例方法
  introduce() {
    return `我叫${this.name}，今年${this.age}岁。`;
  }
}

// 创建实例
const person = new Person('张三', 25);
console.log(person.introduce()); // "我叫张三，今年25岁。"
```

### 类表达式

类也可以通过表达式的方式定义：

```javascript
// 匿名类表达式
const Animal = class {
  constructor(name) {
    this.name = name;
  }
};

// 具名类表达式
const Dog = class DogClass {
  constructor(name) {
    this.name = name;
  }

  // 类名只能在类内部使用
  clone() {
    return new DogClass(this.name);
  }
};

const dog = new Dog('旺财');
console.log(dog.name); // "旺财"
```

### 类的特性

类声明具有以下特性：

- **不会提升**：必须先声明后使用，否则会抛出 `ReferenceError`
- **严格模式**：类体内的代码自动运行在严格模式下
- **不可枚举**：类方法默认不可枚举
- **必须使用 new**：直接调用类构造函数会抛出 `TypeError`

```javascript
// 错误示例：类声明不会提升
const car = new Car(); // ReferenceError: Cannot access 'Car' before initialization

class Car {
  constructor(brand) {
    this.brand = brand;
  }
}

// 错误示例：必须使用 new 关键字
const car2 = Car('Toyota'); // TypeError: Class constructor Car cannot be invoked without 'new'
```

## 构造函数

`constructor` 是类的特殊方法，用于创建和初始化对象实例。每个类只能有一个构造函数。

```javascript
class Rectangle {
  constructor(width, height) {
    // 参数验证
    if (width <= 0 || height <= 0) {
      throw new Error('宽度和高度必须为正数');
    }

    this.width = width;
    this.height = height;

    // 可以在构造函数中调用其他方法
    this._calculateArea();
  }

  _calculateArea() {
    this.area = this.width * this.height;
  }
}

const rect = new Rectangle(10, 5);
console.log(rect.area); // 50
```

### 默认构造函数

如果没有显式定义构造函数，JavaScript 会提供一个默认的空构造函数：

```javascript
class Empty {
  // 等同于：constructor() {}
}

class Child extends Parent {
  // 等同于：constructor(...args) { super(...args); }
}
```

### 构造函数中的验证

在构造函数中进行输入验证是一种良好的实践：

```javascript
class User {
  constructor(username, email) {
    if (!username || username.length < 3) {
      throw new Error('用户名必须至少包含3个字符');
    }

    if (!email || !email.includes('@')) {
      throw new Error('请提供有效的邮箱地址');
    }

    this.username = username;
    this.email = email;
    this.createdAt = new Date();
  }
}

try {
  const user = new User('ab', 'invalid-email');
} catch (error) {
  console.error(error.message); // "用户名必须至少包含3个字符"
}
```

## 实例方法

实例方法定义在类的原型上，可以被所有实例共享：

```javascript
class Calculator {
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  add(num) {
    this.value += num;
    return this; // 返回 this 支持链式调用
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
      throw new Error('除数不能为零');
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

// 链式调用示例
const calc = new Calculator(10);
const result = calc.add(5).multiply(2).subtract(10).getResult();
console.log(result); // 20
```

### 方法简写与计算属性名

类方法支持计算属性名：

```javascript
const methodName = 'dynamicMethod';

class DynamicClass {
  // 计算属性名方法
  [methodName]() {
    return '这是动态命名的方法';
  }

  ['get' + 'Data']() {
    return { id: 1, name: 'test' };
  }
}

const obj = new DynamicClass();
console.log(obj.dynamicMethod()); // "这是动态命名的方法"
console.log(obj.getData()); // { id: 1, name: 'test' }
```

## 静态成员

### 静态方法

静态方法属于类本身，而不是类的实例。使用 `static` 关键字定义：

```javascript
class MathUtils {
  // 静态方法
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

// 直接通过类名调用
console.log(MathUtils.add(5, 3)); // 8
console.log(MathUtils.isEven(4)); // true
console.log(MathUtils.factorial(5)); // 120

// 不能通过实例调用静态方法
const utils = new MathUtils();
// utils.add(5, 3); // TypeError: utils.add is not a function
```

### 静态属性

ES2022 引入了静态属性的支持：

```javascript
class Config {
  // 静态属性
  static version = '1.0.0';
  static defaultSettings = {
    theme: 'light',
    language: 'zh-CN',
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

### 静态初始化块

ES2022 还引入了静态初始化块，用于复杂的静态属性初始化：

```javascript
class Database {
  static connection;
  static isInitialized = false;

  // 静态初始化块
  static {
    try {
      this.connection = this.createConnection();
      this.isInitialized = true;
      console.log('数据库连接初始化成功');
    } catch (error) {
      console.error('数据库连接初始化失败:', error);
      this.connection = null;
    }
  }

  static createConnection() {
    // 模拟创建数据库连接
    return { host: 'localhost', port: 3306 };
  }
}

console.log(Database.isInitialized); // true
console.log(Database.connection); // { host: 'localhost', port: 3306 }
```

### 工厂模式应用

静态方法非常适合实现工厂模式：

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

  // 从 JSON 创建实例
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new Product(data.name, data.price, data.category);
  }

  // 创建折扣商品
  static createDiscounted(name, price, discountPercent, category) {
    const discountedPrice = price * (1 - discountPercent / 100);
    const product = new Product(name, discountedPrice, category);
    product.originalPrice = price;
    product.discount = discountPercent;
    return product;
  }

  // 批量创建
  static createBatch(items) {
    return items.map(item => new Product(item.name, item.price, item.category));
  }
}

const product1 = Product.fromJSON('{"name":"笔记本电脑","price":5999,"category":"电子产品"}');
const product2 = Product.createDiscounted('智能手机', 3999, 20, '电子产品');

console.log(product1); // Product { name: '笔记本电脑', price: 5999, ... }
console.log(product2.price); // 3199.2
console.log(product2.discount); // 20
```

## Getter 和 Setter

Getter 和 Setter 允许你定义访问器属性，在读取或设置属性时执行自定义逻辑：

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
      throw new Error('温度不能低于绝对零度');
    }
    this._celsius = value;
  }

  // 华氏温度的 getter 和 setter
  get fahrenheit() {
    return this._celsius * 9 / 5 + 32;
  }

  set fahrenheit(value) {
    this.celsius = (value - 32) * 5 / 9;
  }

  // 开尔文温度
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

### 计算属性与数据验证

Getter 和 Setter 常用于计算属性和数据验证：

```javascript
class Person {
  constructor(firstName, lastName, birthYear) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthYear = birthYear;
  }

  // 计算属性：全名
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  set fullName(value) {
    const parts = value.split(' ');
    if (parts.length < 2) {
      throw new Error('全名必须包含名和姓');
    }
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(' ');
  }

  // 计算属性：年龄
  get age() {
    return new Date().getFullYear() - this.birthYear;
  }

  // 只读属性示例
  get isAdult() {
    return this.age >= 18;
  }
}

const person = new Person('张', '三', 2000);
console.log(person.fullName); // "张 三"
console.log(person.age); // 26 (假设当前是2026年)
console.log(person.isAdult); // true

person.fullName = '李 四';
console.log(person.firstName); // "李"
console.log(person.lastName); // "四"
```

### 惰性计算属性

使用 Getter 实现惰性计算（延迟计算）：

```javascript
class DataProcessor {
  constructor(data) {
    this._data = data;
    this._processedData = null;
  }

  // 惰性计算：只在首次访问时处理数据
  get processedData() {
    if (this._processedData === null) {
      console.log('处理数据中...');
      this._processedData = this._data.map(item => item * 2);
    }
    return this._processedData;
  }

  // 使数据无效，下次访问时重新计算
  invalidateCache() {
    this._processedData = null;
  }
}

const processor = new DataProcessor([1, 2, 3, 4, 5]);
console.log(processor.processedData); // "处理数据中..." [2, 4, 6, 8, 10]
console.log(processor.processedData); // [2, 4, 6, 8, 10] (无需重新计算)
```

## 类继承

### 基本继承

使用 `extends` 关键字实现类继承：

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name}发出了声音`);
  }

  move(distance = 0) {
    console.log(`${this.name}移动了${distance}米`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    // 调用父类构造函数
    super(name);
    this.breed = breed;
  }

  // 重写父类方法
  speak() {
    console.log(`${this.name}汪汪叫`);
  }

  // 扩展功能
  fetch(item) {
    console.log(`${this.name}去捡${item}`);
  }
}

const dog = new Dog('旺财', '金毛');
dog.speak(); // "旺财汪汪叫"
dog.move(10); // "旺财移动了10米"
dog.fetch('球'); // "旺财去捡球"
```

### super 关键字

`super` 关键字用于调用父类的构造函数和方法：

```javascript
class Vehicle {
  constructor(brand, year) {
    this.brand = brand;
    this.year = year;
  }

  getInfo() {
    return `${this.year}年 ${this.brand}`;
  }

  start() {
    return '车辆启动';
  }
}

class ElectricCar extends Vehicle {
  constructor(brand, year, batteryCapacity) {
    // 必须在使用 this 之前调用 super()
    super(brand, year);
    this.batteryCapacity = batteryCapacity;
    this.batteryLevel = 100;
  }

  // 调用父类方法并扩展
  getInfo() {
    return `${super.getInfo()} - 电池容量: ${this.batteryCapacity}kWh`;
  }

  start() {
    const parentMessage = super.start();
    return `${parentMessage} - 电动模式`;
  }

  charge() {
    this.batteryLevel = 100;
    return '充电完成';
  }
}

const tesla = new ElectricCar('特斯拉', 2024, 75);
console.log(tesla.getInfo()); // "2024年 特斯拉 - 电池容量: 75kWh"
console.log(tesla.start()); // "车辆启动 - 电动模式"
```

### 多层继承

```javascript
class LivingThing {
  constructor(name) {
    this.name = name;
    this.isAlive = true;
  }

  breathe() {
    console.log(`${this.name}正在呼吸`);
  }
}

class Animal extends LivingThing {
  constructor(name, species) {
    super(name);
    this.species = species;
  }

  move() {
    console.log(`${this.name}正在移动`);
  }
}

class Bird extends Animal {
  constructor(name, canFly = true) {
    super(name, '鸟类');
    this.canFly = canFly;
  }

  fly() {
    if (this.canFly) {
      console.log(`${this.name}正在飞翔`);
    } else {
      console.log(`${this.name}不能飞`);
    }
  }
}

class Eagle extends Bird {
  constructor(name) {
    super(name, true);
    this.wingspan = 2.3; // 翼展（米）
  }

  hunt() {
    console.log(`${this.name}正在捕猎`);
  }
}

const eagle = new Eagle('金雕');
eagle.breathe(); // "金雕正在呼吸"
eagle.move(); // "金雕正在移动"
eagle.fly(); // "金雕正在飞翔"
eagle.hunt(); // "金雕正在捕猎"
```

### 继承内置类

可以继承 JavaScript 的内置类：

```javascript
class CustomArray extends Array {
  // 获取第一个元素
  get first() {
    return this[0];
  }

  // 获取最后一个元素
  get last() {
    return this[this.length - 1];
  }

  // 求和
  sum() {
    return this.reduce((acc, val) => acc + val, 0);
  }

  // 求平均值
  average() {
    return this.length ? this.sum() / this.length : 0;
  }

  // 去重
  unique() {
    return new CustomArray(...new Set(this));
  }

  // 分块
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
console.log(arr.average()); // 约 2.57
console.log(arr.unique()); // CustomArray [1, 2, 3, 4, 5]
console.log(arr.chunk(3)); // [CustomArray [1, 2, 3], CustomArray [2, 1, 4], CustomArray [5]]

// 继承的方法返回同类型实例
const mapped = arr.map(x => x * 2);
console.log(mapped instanceof CustomArray); // true
```

### 继承 Error 类

创建自定义错误类型：

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;

    // 修复原型链（某些环境需要）
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

// 使用自定义错误
function validateUser(user) {
  if (!user.email) {
    throw new ValidationError('邮箱不能为空', 'email');
  }
  if (!user.password || user.password.length < 6) {
    throw new ValidationError('密码至少需要6个字符', 'password');
  }
}

try {
  validateUser({ email: '', password: '123' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`验证错误 - 字段: ${error.field}, 信息: ${error.message}`);
  }
}
```

## 私有字段和方法

ES2022 引入了真正的私有字段和方法，使用 `#` 前缀：

### 私有实例字段

```javascript
class BankAccount {
  // 私有字段
  #balance = 0;
  #transactionHistory = [];
  #accountNumber;

  constructor(accountNumber, initialBalance = 0) {
    this.#accountNumber = accountNumber;
    if (initialBalance > 0) {
      this.#balance = initialBalance;
      this.#recordTransaction('初始存款', initialBalance);
    }
  }

  // 私有方法
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
      throw new Error('金额必须是正数');
    }
  }

  // 公共方法
  deposit(amount) {
    this.#validateAmount(amount);
    this.#balance += amount;
    this.#recordTransaction('存款', amount);
    return this.#balance;
  }

  withdraw(amount) {
    this.#validateAmount(amount);
    if (amount > this.#balance) {
      throw new Error('余额不足');
    }
    this.#balance -= amount;
    this.#recordTransaction('取款', amount);
    return this.#balance;
  }

  getBalance() {
    return this.#balance;
  }

  getTransactionHistory() {
    // 返回副本以保护内部数据
    return this.#transactionHistory.map(t => ({ ...t }));
  }

  // 只读的账户信息
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

// 无法直接访问私有字段
// console.log(account.#balance); // SyntaxError
```

### 私有静态字段和方法

```javascript
class IdGenerator {
  // 私有静态字段
  static #counter = 0;
  static #prefix = 'ID';
  static #usedIds = new Set();

  // 私有静态方法
  static #formatId(num) {
    return `${this.#prefix}_${num.toString().padStart(6, '0')}`;
  }

  static #isUnique(id) {
    return !this.#usedIds.has(id);
  }

  // 公共静态方法
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
      throw new Error('前缀必须是非空字符串');
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

  // 检查 ID 是否已被使用
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

### 私有字段的存在性检查

使用 `in` 操作符检查对象是否具有某个私有字段：

```javascript
class SecureData {
  #secret;

  constructor(secret) {
    this.#secret = secret;
  }

  // 检查对象是否是 SecureData 实例（通过检查私有字段）
  static isSecureData(obj) {
    return #secret in obj;
  }

  getSecret(password) {
    if (password === 'admin123') {
      return this.#secret;
    }
    throw new Error('密码错误');
  }

  // 静态方法：安全地获取数据
  static safeGet(obj, password) {
    if (this.isSecureData(obj)) {
      return obj.getSecret(password);
    }
    throw new Error('不是有效的 SecureData 对象');
  }
}

const data = new SecureData('机密信息');
console.log(SecureData.isSecureData(data)); // true
console.log(SecureData.isSecureData({})); // false
console.log(SecureData.isSecureData({ secret: 'fake' })); // false
```

### 私有访问器

私有 Getter 和 Setter：

```javascript
class User {
  #password;
  #loginAttempts = 0;
  static #maxAttempts = 3;

  constructor(username, password) {
    this.username = username;
    this.#password = password;
  }

  // 私有 getter
  get #hashedPassword() {
    // 简化的哈希模拟
    return this.#password.split('').reverse().join('');
  }

  // 私有 setter
  set #resetAttempts(value) {
    this.#loginAttempts = value;
  }

  validatePassword(input) {
    if (this.#loginAttempts >= User.#maxAttempts) {
      throw new Error('账户已锁定，请稍后再试');
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

## Mixins 模式

JavaScript 不支持多重继承，但可以使用 Mixins 模式来组合多个类的功能：

### 基本 Mixin 实现

```javascript
// 定义 Mixin 函数
const Flyable = (Base) => class extends Base {
  fly() {
    console.log(`${this.name}正在飞行`);
  }

  land() {
    console.log(`${this.name}已着陆`);
  }

  get canFly() {
    return true;
  }
};

const Swimmable = (Base) => class extends Base {
  swim() {
    console.log(`${this.name}正在游泳`);
  }

  dive(depth) {
    console.log(`${this.name}潜入${depth}米深`);
  }

  get canSwim() {
    return true;
  }
};

const Walkable = (Base) => class extends Base {
  walk() {
    console.log(`${this.name}正在行走`);
  }

  run() {
    console.log(`${this.name}正在奔跑`);
  }

  get canWalk() {
    return true;
  }
};

// 基础类
class Animal {
  constructor(name) {
    this.name = name;
  }

  eat() {
    console.log(`${this.name}正在进食`);
  }
}

// 组合多个 Mixin
class Duck extends Flyable(Swimmable(Walkable(Animal))) {
  quack() {
    console.log(`${this.name}嘎嘎叫`);
  }
}

const duck = new Duck('唐老鸭');
duck.fly();   // "唐老鸭正在飞行"
duck.swim();  // "唐老鸭正在游泳"
duck.walk();  // "唐老鸭正在行走"
duck.quack(); // "唐老鸭嘎嘎叫"
duck.eat();   // "唐老鸭正在进食"

console.log(duck.canFly);  // true
console.log(duck.canSwim); // true
console.log(duck.canWalk); // true
```

### 带有状态的 Mixin

```javascript
// 事件发射器 Mixin
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

// 序列化 Mixin
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

// 时间戳 Mixin
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

// 组合使用
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

const doc = new Document('我的文档', '初始内容');

doc.on('update', ({ oldContent, newContent }) => {
  console.log(`内容从 "${oldContent}" 更新为 "${newContent}"`);
});

doc.update('新内容');
// "内容从 "初始内容" 更新为 "新内容""

console.log(doc.toString());
// 输出格式化的 JSON
```

### 功能组合 Mixin

```javascript
// 验证 Mixin
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

// 可比较 Mixin
const Comparable = (Base) => class extends Base {
  compareTo(other) {
    throw new Error('子类必须实现 compareTo 方法');
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

// 可克隆 Mixin
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

// 组合使用
class Product extends Validatable(Comparable(Cloneable(class {}))) {
  constructor(name, price) {
    super();
    this.name = name;
    this.price = price;

    // 添加验证规则
    this.addRule(p => p.name.length >= 2, '商品名称至少需要2个字符')
        .addRule(p => p.price > 0, '价格必须大于0')
        .addRule(p => p.price < 1000000, '价格不能超过100万');
  }

  compareTo(other) {
    return this.price - other.price;
  }
}

const product1 = new Product('笔记本电脑', 5999);
const product2 = new Product('智能手机', 3999);

console.log(product1.isValid); // true
console.log(product1.greaterThan(product2)); // true

const cloned = product1.clone();
cloned.price = 4999;
console.log(product1.price); // 5999 (原对象未受影响)
console.log(cloned.price); // 4999
```

## 实际应用示例

### 状态管理类

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
      console.warn(`未找到处理 ${type} 的 reducer`);
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

// 使用示例
const store = new Store({
  todos: [],
  filter: 'all'
});

// 注册 reducers
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

// 订阅变化
const unsubscribe = store.subscribe((newState, prevState) => {
  console.log('状态更新:', newState);
});

// 派发动作
store.dispatch({ type: 'ADD_TODO', payload: { text: '学习 JavaScript 类' } });
store.dispatch({ type: 'ADD_TODO', payload: { text: '完成项目' } });

console.log(store.getState());
```

### HTTP 客户端类

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

  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    this.#interceptors.request.push(interceptor);
    return this;
  }

  // 添加响应拦截器
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

// 使用示例
const api = new HttpClient('https://api.example.com');

// 添加认证拦截器
api.addRequestInterceptor(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加日志拦截器
api.addResponseInterceptor(async (response) => {
  console.log(`[${response.status}] ${response.url}`);
  return response;
});

// 发起请求
// const users = await api.get('/users');
// const newUser = await api.post('/users', { name: '张三', email: 'zhangsan@example.com' });
```

### 组件基类

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

  // 生命周期钩子
  onMount() {}
  onUpdate() {}
  onUnmount() {}

  render() {
    throw new Error('子类必须实现 render 方法');
  }
}

// 计数器组件示例
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
    console.log('Counter 组件已挂载');
  }

  onUpdate() {
    console.log('Counter 组件已更新，当前值:', this.state.count);
  }

  render() {
    const div = document.createElement('div');
    div.className = 'counter';

    const title = document.createElement('h3');
    title.textContent = `计数器: ${this.state.count}`;

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

// 使用
// const counter = new Counter({ initialCount: 10, step: 5 });
// counter.mount(document.getElementById('app'));
```

## 最佳实践

### 优先使用组合而非继承

```javascript
// 不推荐：深层继承链
class Animal { }
class Mammal extends Animal { }
class Dog extends Mammal { }
class Labrador extends Dog { }

// 推荐：使用组合
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

### 保持类的单一职责

```javascript
// 不推荐：一个类做太多事情
class User {
  saveToDatabase() { /* ... */ }
  sendEmail() { /* ... */ }
  generateReport() { /* ... */ }
  validateInput() { /* ... */ }
}

// 推荐：分离职责
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

### 使用私有字段保护内部状态

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

### 提供清晰的公共接口

```javascript
class ShoppingCart {
  #items = [];

  // 清晰的公共方法
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

  // 计算属性
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

  // 私有辅助方法
  #findItem(productId) {
    return this.#items.find(item => item.product.id === productId);
  }
}
```

### 使用静态方法进行工具函数和工厂方法

```javascript
class DateFormatter {
  #date;

  constructor(date = new Date()) {
    this.#date = date;
  }

  // 静态工厂方法
  static fromString(dateString) {
    return new DateFormatter(new Date(dateString));
  }

  static fromTimestamp(timestamp) {
    return new DateFormatter(new Date(timestamp));
  }

  static now() {
    return new DateFormatter();
  }

  // 静态工具方法
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // 实例方法
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

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  }
}

// 使用
const formatter = DateFormatter.fromString('2024-06-15');
console.log(formatter.format('YYYY年MM月DD日')); // "2024年06月15日"
console.log(DateFormatter.isLeapYear(2024)); // true
```

## 总结

JavaScript 的类语法提供了一种清晰、直观的方式来实现面向对象编程。核心要点包括：

- **类声明**：使用 `class` 关键字定义类，`constructor` 初始化实例
- **实例方法**：定义在类体中的方法会添加到原型上，被所有实例共享
- **静态成员**：使用 `static` 关键字定义属于类本身的属性和方法
- **访问器**：`get` 和 `set` 提供对属性的受控访问，支持计算属性和数据验证
- **继承**：`extends` 实现类继承，`super` 调用父类构造函数和方法
- **私有字段**：使用 `#` 前缀实现真正的封装，保护内部状态
- **Mixins**：通过函数组合实现多重继承的效果，增强代码复用性

在实际开发中，应当遵循以下原则：

1. 优先使用组合而非继承
2. 保持类的单一职责
3. 使用私有字段保护内部状态
4. 提供清晰的公共接口
5. 适当使用静态方法作为工具函数和工厂方法

理解并正确运用这些概念，可以帮助你编写出更加模块化、可维护和可扩展的 JavaScript 代码。
