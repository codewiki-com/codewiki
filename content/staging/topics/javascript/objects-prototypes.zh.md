---
title: JavaScript 对象与原型链
description: 深入理解 JavaScript 对象、原型链、原型继承与属性描述符
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - 对象
  - 原型链
  - 继承
status: imported
origin: old/src/content/docs/javascript/objects-prototypes.zh.md
divergence: 0.309
issues: []
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 3
  lastUpdated: 2026-01-07
---

## 概述

对象是 JavaScript 的核心数据结构，几乎所有值都可以是对象或继承自对象。理解对象、原型链和继承机制对于掌握 JavaScript 至关重要。

## 对象字面量

### 基本语法

对象字面量是创建对象最简单直接的方式：

```javascript
// 空对象
const emptyObj = {};

// 带属性的对象
const person = {
  name: '张三',
  age: 30,
  city: '北京'
};

// 嵌套对象
const user = {
  id: 1,
  profile: {
    username: 'zhangsan',
    email: 'zhangsan@example.com'
  },
  settings: {
    theme: 'dark',
    notifications: true
  }
};
```

### 属性访问

有两种方式访问对象属性：点表示法和方括号表示法。

```javascript
const person = {
  name: '李四',
  age: 25,
  'favorite color': '蓝色'  // 包含空格的属性名
};

// 点表示法
console.log(person.name);  // '李四'

// 方括号表示法
console.log(person['age']);  // 25
console.log(person['favorite color']);  // '蓝色'

// 动态属性访问
const prop = 'name';
console.log(person[prop]);  // '李四'
```

### 计算属性名

ES6 允许在对象字面量中使用计算属性名：

```javascript
const prefix = 'user';
const id = 123;

const user = {
  [prefix + 'Id']: id,
  [prefix + 'Name']: '王五',
  [`${prefix}Active`]: true
};

console.log(user);
// { userId: 123, userName: '王五', userActive: true }
```

### 方法简写

ES6 提供了更简洁的方法定义语法：

```javascript
const calculator = {
  // 传统写法
  add: function(a, b) {
    return a + b;
  },

  // ES6 简写
  subtract(a, b) {
    return a - b;
  },

  multiply(a, b) {
    return a * b;
  }
};

console.log(calculator.add(5, 3));       // 8
console.log(calculator.subtract(5, 3));  // 2
console.log(calculator.multiply(5, 3));  // 15
```

### 属性简写

当属性名与变量名相同时，可以使用简写语法：

```javascript
const name = '赵六';
const age = 28;
const city = '上海';

// 传统写法
const person1 = {
  name: name,
  age: age,
  city: city
};

// ES6 简写
const person2 = {
  name,
  age,
  city
};

console.log(person2);  // { name: '赵六', age: 28, city: '上海' }
```

## 属性描述符

每个对象属性都有一组属性描述符，用于控制该属性的行为。

### 数据描述符

数据属性包含以下描述符：

- `value`: 属性的值
- `writable`: 是否可写
- `enumerable`: 是否可枚举
- `configurable`: 是否可配置（删除或修改描述符）

```javascript
const person = {};

Object.defineProperty(person, 'name', {
  value: '孙七',
  writable: true,
  enumerable: true,
  configurable: true
});

console.log(person.name);  // '孙七'

// 查看属性描述符
const descriptor = Object.getOwnPropertyDescriptor(person, 'name');
console.log(descriptor);
// {
//   value: '孙七',
//   writable: true,
//   enumerable: true,
//   configurable: true
// }
```

### 访问器描述符

访问器属性使用 getter 和 setter 函数：

- `get`: 获取属性值的函数
- `set`: 设置属性值的函数
- `enumerable`: 是否可枚举
- `configurable`: 是否可配置

```javascript
const person = {
  firstName: '周',
  lastName: '八',

  get fullName() {
    return `${this.firstName}${this.lastName}`;
  },

  set fullName(name) {
    const parts = name.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
};

console.log(person.fullName);  // '周八'

person.fullName = '吴 九';
console.log(person.firstName);  // '吴'
console.log(person.lastName);   // '九'
console.log(person.fullName);   // '吴九'
```

### 定义多个属性

使用 `Object.defineProperties()` 一次定义多个属性：

```javascript
const product = {};

Object.defineProperties(product, {
  name: {
    value: '笔记本电脑',
    writable: true,
    enumerable: true
  },
  price: {
    value: 5999,
    writable: true,
    enumerable: true
  },
  _stock: {
    value: 100,
    writable: true,
    enumerable: false  // 私有属性，不可枚举
  },
  stock: {
    get() {
      return this._stock;
    },
    set(value) {
      if (value >= 0) {
        this._stock = value;
      }
    },
    enumerable: true
  }
});

console.log(product.name);   // '笔记本电脑'
console.log(product.stock);  // 100
product.stock = 150;
console.log(product.stock);  // 150
```

### 属性特性的影响

```javascript
const obj = {};

// writable: false - 属性只读
Object.defineProperty(obj, 'readonly', {
  value: '不可修改',
  writable: false
});

obj.readonly = '尝试修改';
console.log(obj.readonly);  // '不可修改' (严格模式下会报错)

// enumerable: false - 属性不可枚举
Object.defineProperty(obj, 'hidden', {
  value: '隐藏属性',
  enumerable: false
});

console.log(Object.keys(obj));  // ['readonly'] (不包含 hidden)

// configurable: false - 属性不可配置
Object.defineProperty(obj, 'permanent', {
  value: '永久属性',
  configurable: false
});

// 无法删除
delete obj.permanent;
console.log(obj.permanent);  // '永久属性'

// 无法重新配置 (会报错)
// Object.defineProperty(obj, 'permanent', { writable: true });  // TypeError
```

## 原型链

JavaScript 使用原型链实现继承机制。每个对象都有一个内部链接指向另一个对象，称为其原型。

### 原型基础

```javascript
// 每个函数都有 prototype 属性
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function() {
  console.log(`你好，我是 ${this.name}`);
};

const person1 = new Person('钱十');
const person2 = new Person('孙十一');

person1.sayHello();  // '你好，我是 钱十'
person2.sayHello();  // '你好，我是 孙十一'

// 检查原型
console.log(person1.__proto__ === Person.prototype);  // true
console.log(Person.prototype.__proto__ === Object.prototype);  // true
console.log(Object.prototype.__proto__);  // null
```

### 原型链查找

当访问对象属性时，JavaScript 会沿着原型链向上查找：

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name} 正在吃东西`);
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

// 设置原型链
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name} 正在叫: 汪汪!`);
};

const dog = new Dog('旺财', '金毛');

// 原型链查找过程:
// 1. 在 dog 实例上查找 bark -> 找不到
// 2. 在 Dog.prototype 上查找 bark -> 找到
dog.bark();  // '旺财 正在叫: 汪汪!'

// 1. 在 dog 实例上查找 eat -> 找不到
// 2. 在 Dog.prototype 上查找 eat -> 找不到
// 3. 在 Animal.prototype 上查找 eat -> 找到
dog.eat();   // '旺财 正在吃东西'

console.log(dog.name);   // '旺财' (在实例上)
console.log(dog.breed);  // '金毛' (在实例上)
```

### Object.create()

`Object.create()` 创建一个新对象，使用现有对象作为新对象的原型：

```javascript
const personPrototype = {
  greet() {
    console.log(`你好，我是 ${this.name}`);
  },
  introduce() {
    console.log(`我今年 ${this.age} 岁`);
  }
};

const person = Object.create(personPrototype);
person.name = '李明';
person.age = 30;

person.greet();      // '你好，我是 李明'
person.introduce();  // '我今年 30 岁'

console.log(person.__proto__ === personPrototype);  // true
```

### 原型链与 instanceof

`instanceof` 运算符检查对象的原型链：

```javascript
function Vehicle() {}
function Car() {}

Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

const myCar = new Car();

console.log(myCar instanceof Car);      // true
console.log(myCar instanceof Vehicle);  // true
console.log(myCar instanceof Object);   // true

// 手动实现 instanceof
function myInstanceOf(obj, constructor) {
  let proto = Object.getPrototypeOf(obj);

  while (proto !== null) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}

console.log(myInstanceOf(myCar, Car));      // true
console.log(myInstanceOf(myCar, Vehicle));  // true
```

## 原型继承

### 构造函数继承

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['红', '蓝', '绿'];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  // 调用父类构造函数
  Parent.call(this, name);
  this.age = age;
}

// 设置原型链
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child1 = new Child('小明', 10);
const child2 = new Child('小红', 12);

child1.colors.push('黄');
console.log(child1.colors);  // ['红', '蓝', '绿', '黄']
console.log(child2.colors);  // ['红', '蓝', '绿']

child1.sayName();  // '小明'
child1.sayAge();   // 10
```

### ES6 类继承

ES6 提供了更清晰的类语法：

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} 发出声音`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // 调用父类构造函数
    this.breed = breed;
  }

  speak() {
    console.log(`${this.name} 叫: 汪汪!`);
  }

  getBreed() {
    return this.breed;
  }
}

const dog = new Dog('旺财', '哈士奇');
dog.speak();  // '旺财 叫: 汪汪!'
console.log(dog.getBreed());  // '哈士奇'

// 类的本质仍是函数
console.log(typeof Dog);  // 'function'
console.log(dog instanceof Dog);     // true
console.log(dog instanceof Animal);  // true
```

### 混入模式 (Mixin)

JavaScript 不支持多重继承，但可以使用混入模式：

```javascript
const canEat = {
  eat() {
    console.log(`${this.name} 正在吃东西`);
  }
};

const canWalk = {
  walk() {
    console.log(`${this.name} 正在走路`);
  }
};

const canSwim = {
  swim() {
    console.log(`${this.name} 正在游泳`);
  }
};

// 混入函数
function mixin(target, ...sources) {
  Object.assign(target, ...sources);
}

class Person {
  constructor(name) {
    this.name = name;
  }
}

// 将多个能力混入 Person 原型
mixin(Person.prototype, canEat, canWalk, canSwim);

const person = new Person('张三');
person.eat();   // '张三 正在吃东西'
person.walk();  // '张三 正在走路'
person.swim();  // '张三 正在游泳'
```

## Object 静态方法

### Object.keys()、Object.values()、Object.entries()

这些方法用于获取对象的键、值或键值对：

```javascript
const person = {
  name: '李四',
  age: 30,
  city: '深圳'
};

// 获取所有键
const keys = Object.keys(person);
console.log(keys);  // ['name', 'age', 'city']

// 获取所有值
const values = Object.values(person);
console.log(values);  // ['李四', 30, '深圳']

// 获取所有键值对
const entries = Object.entries(person);
console.log(entries);
// [['name', '李四'], ['age', 30], ['city', '深圳']]

// 遍历对象
Object.entries(person).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
// name: 李四
// age: 30
// city: 深圳
```

### Object.assign()

用于对象合并和浅拷贝：

```javascript
const target = { a: 1, b: 2 };
const source1 = { b: 3, c: 4 };
const source2 = { c: 5, d: 6 };

const result = Object.assign(target, source1, source2);

console.log(result);  // { a: 1, b: 3, c: 5, d: 6 }
console.log(target === result);  // true (target 被修改)

// 使用空对象避免修改原对象
const merged = Object.assign({}, target, source1);

// 浅拷贝
const original = {
  name: '王五',
  address: { city: '北京' }
};

const copy = Object.assign({}, original);
copy.name = '赵六';
copy.address.city = '上海';

console.log(original.name);          // '王五' (未改变)
console.log(original.address.city);  // '上海' (被改变，因为是浅拷贝)
```

### Object.freeze()、Object.seal()

控制对象的可变性：

```javascript
// Object.freeze() - 完全冻结对象
const frozen = {
  name: '冻结对象',
  value: 100
};

Object.freeze(frozen);

frozen.name = '尝试修改';     // 无效
frozen.newProp = '新属性';    // 无效
delete frozen.value;          // 无效

console.log(frozen);  // { name: '冻结对象', value: 100 }
console.log(Object.isFrozen(frozen));  // true

// Object.seal() - 密封对象 (可修改现有属性，但不能添加/删除)
const sealed = {
  name: '密封对象',
  value: 200
};

Object.seal(sealed);

sealed.name = '修改成功';     // 有效
sealed.newProp = '新属性';    // 无效
delete sealed.value;          // 无效

console.log(sealed);  // { name: '修改成功', value: 200 }
console.log(Object.isSealed(sealed));  // true
```

### Object.preventExtensions()

阻止对象扩展（添加新属性）：

```javascript
const obj = { name: '张三' };

Object.preventExtensions(obj);

obj.name = '李四';      // 有效
obj.age = 30;           // 无效
delete obj.name;        // 有效

console.log(obj);  // {}
console.log(Object.isExtensible(obj));  // false
```

### Object.getPrototypeOf()、Object.setPrototypeOf()

获取和设置对象的原型：

```javascript
const proto = {
  greet() {
    console.log('你好!');
  }
};

const obj = Object.create(proto);

console.log(Object.getPrototypeOf(obj) === proto);  // true

// 设置原型 (不推荐，性能较差)
const newProto = {
  farewell() {
    console.log('再见!');
  }
};

Object.setPrototypeOf(obj, newProto);
obj.farewell();  // '再见!'
```

### Object.hasOwn()

ES2022 新增，检查对象是否拥有自己的属性（不包括继承的）：

```javascript
const person = {
  name: '王五'
};

console.log(Object.hasOwn(person, 'name'));        // true
console.log(Object.hasOwn(person, 'toString'));    // false

// 比 hasOwnProperty 更安全
const obj = Object.create(null);  // 没有原型
obj.name = '测试';

// obj.hasOwnProperty('name');  // TypeError
console.log(Object.hasOwn(obj, 'name'));  // true
```

### Object.fromEntries()

将键值对数组转换为对象（与 `Object.entries()` 相反）：

```javascript
const entries = [
  ['name', '赵六'],
  ['age', 28],
  ['city', '杭州']
];

const obj = Object.fromEntries(entries);
console.log(obj);  // { name: '赵六', age: 28, city: '杭州' }

// 与 Map 结合使用
const map = new Map([
  ['a', 1],
  ['b', 2]
]);

const objFromMap = Object.fromEntries(map);
console.log(objFromMap);  // { a: 1, b: 2 }

// 过滤对象属性
const original = { a: 1, b: 2, c: 3, d: 4 };
const filtered = Object.fromEntries(
  Object.entries(original).filter(([key, value]) => value > 2)
);
console.log(filtered);  // { c: 3, d: 4 }
```

## 实用示例

### 深拷贝实现

```javascript
function deepClone(obj, hash = new WeakMap()) {
  // 处理 null 和非对象类型
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理日期
  if (obj instanceof Date) {
    return new Date(obj);
  }

  // 处理正则
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }

  // 处理循环引用
  if (hash.has(obj)) {
    return hash.get(obj);
  }

  // 创建新对象，保持原型链
  const cloneObj = new obj.constructor();
  hash.set(obj, cloneObj);

  // 递归拷贝属性
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key], hash);
    }
  }

  return cloneObj;
}

// 测试
const original = {
  name: '测试',
  nested: {
    value: 100
  },
  arr: [1, 2, { a: 3 }],
  date: new Date()
};

original.self = original;  // 循环引用

const cloned = deepClone(original);
cloned.nested.value = 200;

console.log(original.nested.value);  // 100
console.log(cloned.nested.value);    // 200
console.log(cloned.self === cloned); // true
```

### 属性代理

```javascript
function createValidator(target) {
  return new Proxy(target, {
    set(obj, prop, value) {
      if (prop === 'age') {
        if (!Number.isInteger(value)) {
          throw new TypeError('年龄必须是整数');
        }
        if (value < 0 || value > 150) {
          throw new RangeError('年龄必须在 0-150 之间');
        }
      }

      obj[prop] = value;
      return true;
    }
  });
}

const person = createValidator({});

person.name = '孙七';  // 正常
person.age = 25;       // 正常

try {
  person.age = '三十';  // 抛出 TypeError
} catch (e) {
  console.log(e.message);  // '年龄必须是整数'
}

try {
  person.age = 200;  // 抛出 RangeError
} catch (e) {
  console.log(e.message);  // '年龄必须在 0-150 之间'
}
```

### 观察者模式

```javascript
function createObservable(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;

      if (onChange && oldValue !== value) {
        onChange(prop, oldValue, value);
      }

      return true;
    }
  });
}

const data = createObservable(
  { count: 0 },
  (prop, oldValue, newValue) => {
    console.log(`${prop} 从 ${oldValue} 变为 ${newValue}`);
  }
);

data.count = 1;   // 'count 从 0 变为 1'
data.count = 5;   // 'count 从 1 变为 5'
data.name = '测试';  // 'name 从 undefined 变为 测试'
```

## 最佳实践

### 优先使用对象字面量

```javascript
// 推荐
const obj = {};

// 不推荐
const obj = new Object();
```

### 使用 Object.hasOwn() 检查属性

```javascript
// 推荐
if (Object.hasOwn(obj, 'property')) {
  // ...
}

// 不推荐（可能出现问题）
if (obj.property) {  // property 可能是 falsy 值
  // ...
}
```

### 避免修改原生对象原型

```javascript
// 不推荐
Array.prototype.myMethod = function() {
  // ...
};

// 推荐：使用工具函数
function myArrayMethod(arr) {
  // ...
}
```

### 使用解构简化代码

```javascript
const person = {
  name: '周八',
  age: 35,
  city: '广州'
};

// 推荐
const { name, age } = person;

// 不推荐
const name = person.name;
const age = person.age;
```

### 使用扩展运算符合并对象

```javascript
const defaults = { theme: 'light', lang: 'zh' };
const userSettings = { theme: 'dark' };

// 推荐
const settings = { ...defaults, ...userSettings };

// 不推荐
const settings = Object.assign({}, defaults, userSettings);
```

## 总结

- **对象字面量**是创建对象最常用的方式，支持简写语法和计算属性名
- **属性描述符**控制属性的可写、可枚举、可配置特性
- **原型链**是 JavaScript 继承的基础，对象通过原型链共享方法和属性
- **原型继承**可通过构造函数或 ES6 类实现
- **Object 静态方法**提供了丰富的对象操作功能
- 理解对象和原型对于编写高效、可维护的 JavaScript 代码至关重要

掌握这些概念将帮助你更好地理解 JavaScript 的运行机制，编写出更优雅的代码。
