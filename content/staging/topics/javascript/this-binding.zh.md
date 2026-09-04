---
title: this绑定机制
description: 深入理解JavaScript中的this绑定规则，默认绑定、隐式绑定、显式绑定与new绑定
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - this
  - 绑定
  - 执行上下文
status: imported
origin: old/src/content/docs/javascript/this-binding.zh.md
divergence: 0.385
issues:
  - order-mismatch
  - divergent
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 4
  lastUpdated: 2026-01-07
---

在 JavaScript 中，`this` 是一个特殊的关键字，它在函数执行时被自动定义，指向当前执行上下文的对象。与其他编程语言不同，JavaScript 中的 `this` 不是在编写时绑定的，而是在运行时绑定的。理解 `this` 的绑定规则对于编写正确的 JavaScript 代码至关重要。

## 为什么需要理解 this

```javascript
const person = {
  name: '张三',
  greet: function() {
    console.log('你好，我是' + this.name);
  }
};

person.greet(); // 你好，我是张三

const greetFunc = person.greet;
greetFunc(); // 你好，我是undefined（严格模式下会报错）
```

同一个函数，在不同的调用方式下，`this` 指向完全不同。这就是为什么我们需要深入理解 `this` 绑定机制。

## 四种绑定规则

JavaScript 中 `this` 的绑定遵循四种规则，按优先级从低到高排列：

1. 默认绑定
2. 隐式绑定
3. 显式绑定
4. new 绑定

### 默认绑定

当函数独立调用时，应用默认绑定规则。在非严格模式下，`this` 指向全局对象（浏览器中是 `window`，Node.js 中是 `global`）；在严格模式下，`this` 为 `undefined`。

```javascript
// 非严格模式
function showThis() {
  console.log(this);
}

showThis(); // window（浏览器环境）

// 严格模式
function strictShowThis() {
  'use strict';
  console.log(this);
}

strictShowThis(); // undefined
```

#### 实际应用场景

```javascript
var name = '全局变量'; // 使用 var 声明会成为 window 的属性

function getName() {
  return this.name;
}

console.log(getName()); // "全局变量"

// 注意：let 和 const 声明的变量不会成为 window 的属性
let age = 25;
function getAge() {
  return this.age;
}
console.log(getAge()); // undefined
```

### 隐式绑定

当函数作为对象的方法调用时，`this` 隐式绑定到该对象上。

```javascript
const user = {
  name: '李四',
  age: 30,
  introduce: function() {
    console.log(`我叫${this.name}，今年${this.age}岁`);
  }
};

user.introduce(); // 我叫李四，今年30岁
```

#### 对象嵌套情况

当存在多层对象嵌套时，`this` 绑定到最近的（最后一层）调用对象。

```javascript
const company = {
  name: '科技公司',
  department: {
    name: '研发部',
    showName: function() {
      console.log(this.name);
    }
  }
};

company.department.showName(); // "研发部"（绑定到 department）
```

#### 隐式丢失问题

隐式绑定最常见的问题是"隐式丢失"——当把对象方法赋值给变量或作为回调传递时，会丢失绑定。

```javascript
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  }
};

// 情况1：赋值给变量
const getValue = obj.getValue;
console.log(getValue()); // undefined（this 指向全局）

// 情况2：作为回调函数传递
function executeCallback(callback) {
  callback();
}

executeCallback(obj.getValue); // undefined

// 情况3：setTimeout 中的回调
setTimeout(obj.getValue, 100); // undefined
```

### 显式绑定

JavaScript 提供了三个方法来显式指定 `this` 的值：`call`、`apply` 和 `bind`。

#### call 方法

`call` 方法立即调用函数，第一个参数指定 `this`，后续参数依次传入。

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}，${this.name}${punctuation}`);
}

const person1 = { name: '王五' };
const person2 = { name: '赵六' };

greet.call(person1, '你好', '！'); // 你好，王五！
greet.call(person2, '早上好', '~'); // 早上好，赵六~
```

#### apply 方法

`apply` 与 `call` 类似，但参数以数组形式传入。

```javascript
function introduce(hobby1, hobby2) {
  console.log(`我是${this.name}，爱好是${hobby1}和${hobby2}`);
}

const student = { name: '小明' };

// 使用 apply，参数以数组形式传入
introduce.apply(student, ['篮球', '编程']); // 我是小明，爱好是篮球和编程

// 等价的 call 调用
introduce.call(student, '篮球', '编程'); // 我是小明，爱好是篮球和编程
```

#### apply 的实用技巧

```javascript
// 找出数组中的最大值
const numbers = [5, 2, 9, 1, 7];
const max = Math.max.apply(null, numbers);
console.log(max); // 9

// ES6 后可以使用展开运算符
const maxES6 = Math.max(...numbers);
console.log(maxES6); // 9
```

#### bind 方法

`bind` 不会立即调用函数，而是返回一个新函数，其 `this` 被永久绑定到指定值。

```javascript
const module = {
  x: 42,
  getX: function() {
    return this.x;
  }
};

const unboundGetX = module.getX;
console.log(unboundGetX()); // undefined

const boundGetX = unboundGetX.bind(module);
console.log(boundGetX()); // 42
```

#### 解决隐式丢失

使用 `bind` 可以解决前面提到的隐式丢失问题。

```javascript
const obj = {
  value: 100,
  getValue: function() {
    return this.value;
  }
};

// 使用 bind 解决回调中的 this 丢失
setTimeout(obj.getValue.bind(obj), 100); // 100

// 在事件处理中
class Button {
  constructor(text) {
    this.text = text;
    // 绑定 this 到实例
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(`按钮 "${this.text}" 被点击`);
  }
}

const btn = new Button('提交');
// 即使作为回调传递，this 也能正确指向
document.addEventListener('click', btn.handleClick);
```

#### 部分应用（柯里化）

`bind` 还可以用于创建部分应用函数。

```javascript
function multiply(a, b) {
  return a * b;
}

// 创建一个乘以 2 的函数
const double = multiply.bind(null, 2);
console.log(double(5)); // 10
console.log(double(10)); // 20

// 创建一个乘以 10 的函数
const multiplyByTen = multiply.bind(null, 10);
console.log(multiplyByTen(3)); // 30
```

### new 绑定

当使用 `new` 关键字调用函数时，会创建一个新对象，`this` 绑定到这个新对象。

```javascript
function Person(name, age) {
  // new 调用时，this 指向新创建的对象
  this.name = name;
  this.age = age;
  this.sayHello = function() {
    console.log(`你好，我是${this.name}`);
  };
}

const person = new Person('张三', 25);
console.log(person.name); // "张三"
person.sayHello(); // 你好，我是张三
```

#### new 操作符的工作原理

当使用 `new` 调用函数时，JavaScript 引擎会执行以下步骤：

```javascript
function myNew(Constructor, ...args) {
  // 1. 创建一个新的空对象
  const obj = {};

  // 2. 将新对象的原型链接到构造函数的 prototype
  Object.setPrototypeOf(obj, Constructor.prototype);

  // 3. 将构造函数的 this 绑定到新对象，并执行构造函数
  const result = Constructor.apply(obj, args);

  // 4. 如果构造函数返回对象，则返回该对象；否则返回新创建的对象
  return result instanceof Object ? result : obj;
}

// 测试
function Animal(type) {
  this.type = type;
}

const cat = myNew(Animal, '猫');
console.log(cat.type); // "猫"
console.log(cat instanceof Animal); // true
```

## 箭头函数中的 this

箭头函数是 ES6 引入的新语法，它没有自己的 `this`。箭头函数中的 `this` 继承自外层作用域，且一旦确定就不能被改变。

### 基本特性

```javascript
const obj = {
  name: '对象',
  regularFunc: function() {
    console.log('普通函数 this:', this.name);
  },
  arrowFunc: () => {
    console.log('箭头函数 this:', this.name);
  }
};

obj.regularFunc(); // 普通函数 this: 对象
obj.arrowFunc(); // 箭头函数 this: undefined（继承外层，即全局）
```

### 箭头函数解决回调问题

```javascript
const timer = {
  seconds: 0,
  start: function() {
    // 普通函数作为回调，this 会丢失
    // setInterval(function() {
    //   this.seconds++; // 错误：this 指向全局
    // }, 1000);

    // 箭头函数继承外层 this
    setInterval(() => {
      this.seconds++;
      console.log(this.seconds);
    }, 1000);
  }
};

timer.start(); // 1, 2, 3, 4, ...
```

### 类中的箭头函数

```javascript
class Counter {
  count = 0;

  // 箭头函数作为类属性，this 永远指向实例
  increment = () => {
    this.count++;
    console.log(this.count);
  };

  // 普通方法
  decrement() {
    this.count--;
    console.log(this.count);
  }
}

const counter = new Counter();

// 作为回调传递
const inc = counter.increment;
const dec = counter.decrement;

inc(); // 1（正确）
dec(); // TypeError: Cannot read property 'count' of undefined
```

### 箭头函数不能使用显式绑定

```javascript
const arrowFunc = () => {
  console.log(this);
};

const obj = { name: 'test' };

// call、apply、bind 对箭头函数无效
arrowFunc.call(obj); // window（不是 obj）
arrowFunc.apply(obj); // window（不是 obj）
const boundArrow = arrowFunc.bind(obj);
boundArrow(); // window（不是 obj）
```

## 绑定优先级

当多种绑定规则同时适用时，按以下优先级确定 `this`：

**new 绑定 > 显式绑定 > 隐式绑定 > 默认绑定**

### 验证优先级

```javascript
// 隐式绑定 vs 显式绑定
function showName() {
  console.log(this.name);
}

const obj1 = { name: '对象1', showName };
const obj2 = { name: '对象2' };

obj1.showName(); // "对象1"（隐式绑定）
obj1.showName.call(obj2); // "对象2"（显式绑定 > 隐式绑定）
```

```javascript
// 显式绑定 vs new 绑定
function Foo(value) {
  this.value = value;
}

const obj = {};
const Bar = Foo.bind(obj);
Bar(1);
console.log(obj.value); // 1

const baz = new Bar(2);
console.log(obj.value); // 1（没有变化）
console.log(baz.value); // 2（new 绑定 > 显式绑定）
```

### 判断 this 的流程

```javascript
function determineThis() {
  // 1. 函数是否通过 new 调用？
  //    是 -> this 是新创建的对象

  // 2. 函数是否通过 call、apply、bind 调用？
  //    是 -> this 是指定的对象

  // 3. 函数是否作为对象方法调用？
  //    是 -> this 是该对象

  // 4. 默认绑定
  //    严格模式 -> undefined
  //    非严格模式 -> 全局对象
}
```

## 特殊情况

### null 和 undefined 作为绑定对象

当 `call`、`apply` 或 `bind` 的第一个参数是 `null` 或 `undefined` 时，实际应用的是默认绑定规则。

```javascript
function logThis() {
  console.log(this);
}

logThis.call(null); // window（非严格模式）
logThis.apply(undefined); // window（非严格模式）

// 严格模式下
function strictLogThis() {
  'use strict';
  console.log(this);
}

strictLogThis.call(null); // null
strictLogThis.apply(undefined); // undefined
```

### 安全的 this 绑定

为了避免意外修改全局对象，可以传入一个空对象作为 `this`。

```javascript
// 创建一个真正的空对象（没有原型）
const emptyThis = Object.create(null);

function spread(a, b, c) {
  console.log(`a: ${a}, b: ${b}, c: ${c}`);
}

const args = [1, 2, 3];
spread.apply(emptyThis, args); // a: 1, b: 2, c: 3
```

### 间接引用

创建函数的间接引用时，调用这个函数会应用默认绑定规则。

```javascript
function foo() {
  console.log(this.a);
}

const a = 'global';
const obj1 = { a: 'obj1', foo };
const obj2 = { a: 'obj2' };

obj1.foo(); // "obj1"
(obj2.foo = obj1.foo)(); // "global"（间接引用，默认绑定）
```

## 实战案例

### 事件处理器中的 this

```javascript
class FormHandler {
  constructor() {
    this.data = { submitted: false };

    // 方法1：在构造函数中绑定
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.data.submitted = true;
    console.log('表单已提交');
  }

  // 方法2：使用箭头函数
  handleReset = () => {
    this.data.submitted = false;
    console.log('表单已重置');
  };

  init() {
    const form = document.querySelector('form');
    form.addEventListener('submit', this.handleSubmit);
    form.addEventListener('reset', this.handleReset);
  }
}
```

### 回调函数中保持 this

```javascript
const api = {
  baseUrl: 'https://api.example.com',

  // 方法1：使用箭头函数
  fetchData(endpoint) {
    return fetch(this.baseUrl + endpoint)
      .then(response => response.json())
      .then(data => {
        console.log(`从 ${this.baseUrl} 获取数据`);
        return data;
      });
  },

  // 方法2：保存 this 引用
  fetchDataAlternative(endpoint) {
    const self = this;
    return fetch(this.baseUrl + endpoint)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log(`从 ${self.baseUrl} 获取数据`);
        return data;
      });
  }
};
```

### 方法链式调用

```javascript
class Calculator {
  constructor(value = 0) {
    this.value = value;
  }

  add(n) {
    this.value += n;
    return this; // 返回 this 支持链式调用
  }

  subtract(n) {
    this.value -= n;
    return this;
  }

  multiply(n) {
    this.value *= n;
    return this;
  }

  getResult() {
    return this.value;
  }
}

const result = new Calculator(10)
  .add(5)
  .multiply(2)
  .subtract(10)
  .getResult();

console.log(result); // 20
```

## 常见错误与调试

### 错误1：对象方法中嵌套函数

```javascript
const obj = {
  value: 10,
  calculate: function() {
    // 错误：嵌套函数中 this 指向全局
    function helper() {
      return this.value * 2;
    }
    return helper(); // NaN 或错误
  }
};

// 解决方案1：使用箭头函数
const objFixed1 = {
  value: 10,
  calculate: function() {
    const helper = () => this.value * 2;
    return helper(); // 20
  }
};

// 解决方案2：保存 this 引用
const objFixed2 = {
  value: 10,
  calculate: function() {
    const self = this;
    function helper() {
      return self.value * 2;
    }
    return helper(); // 20
  }
};
```

### 错误2：forEach 等数组方法中的 this

```javascript
const processor = {
  multiplier: 2,

  // 错误示例
  processArrayWrong: function(arr) {
    return arr.map(function(item) {
      return item * this.multiplier; // this 不是 processor
    });
  },

  // 正确示例1：使用箭头函数
  processArrayRight1: function(arr) {
    return arr.map(item => item * this.multiplier);
  },

  // 正确示例2：使用 thisArg 参数
  processArrayRight2: function(arr) {
    return arr.map(function(item) {
      return item * this.multiplier;
    }, this); // 传入 thisArg
  }
};

console.log(processor.processArrayRight1([1, 2, 3])); // [2, 4, 6]
```

## 总结

| 绑定规则 | 调用方式 | this 指向 |
|---------|---------|----------|
| 默认绑定 | `fn()` | 全局对象（严格模式为 undefined） |
| 隐式绑定 | `obj.fn()` | 调用对象 obj |
| 显式绑定 | `fn.call(obj)` / `fn.apply(obj)` / `fn.bind(obj)` | 指定对象 obj |
| new 绑定 | `new Fn()` | 新创建的对象 |
| 箭头函数 | `() => {}` | 继承外层作用域的 this |

理解并掌握 `this` 绑定机制是成为 JavaScript 高手的必经之路。记住：`this` 是在运行时绑定的，它的值取决于函数的调用方式，而不是函数的定义位置。在遇到 `this` 相关问题时，按照优先级规则逐一判断，就能准确确定 `this` 的指向。
